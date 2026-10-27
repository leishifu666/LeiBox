import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const root=process.cwd();
const output=path.join(root,'public/assets/optimized');
await fs.mkdir(output,{recursive:true});
async function ffmpegPath(){
 if(process.env.FFMPEG_PATH)return process.env.FFMPEG_PATH;
 const folder=path.join(root,'work/performance-tools/imageio_ffmpeg/binaries');
 const files=await fs.readdir(folder).catch(()=>[]);
 const binary=files.find(file=>/^ffmpeg.*(?:\.exe)?$/.test(file));
 if(binary)return path.join(folder,binary);
 throw new Error('Optimized media is missing. Set FFMPEG_PATH to generate it once; retain the generated public assets for deployment.');
}
const images=[...(await fs.readdir('public/assets/components')).filter(name=>/\.(png|jpe?g)$/.test(name)).map(name=>`/assets/components/${name}`),
 '/assets/fallback-hero-poster.jpg','/assets/hero-background.jpg',
 ...(await fs.readdir('public/assets/youtube')).filter(name=>/\.jpg$/.test(name)).map(name=>`/assets/youtube/${name}`)];
const index={};
for(const source of images){
 const bytes=await fs.readFile(path.join(root,'public',source));
 const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const name=path.basename(source,path.extname(source));
 const metadata=await sharp(bytes).metadata();
 const variants=[];
 const widths=[...new Set([320,640,960,1200,Math.min(metadata.width,1200)])].filter(width=>width<=metadata.width).sort((a,b)=>a-b);
 for(const width of widths){
  const url=`/assets/optimized/${name}-${hash}-${width}.webp`;
  try{await fs.access(path.join(root,'public',url));}catch{
   await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path.join(root,'public',url));
  }
  variants.push({width,url});
 }
 if(!variants.length)continue;
 index[source]={src:variants.at(-1).url,srcSet:variants.map(v=>`${v.url} ${v.width}w`).join(', ')};
}
const original='/assets/fallback-hero.mp4';
const bytes=await fs.readFile(path.join(root,'public',original));
const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
const video={};
for(const [name,width,quality] of [['mobile',540,30],['desktop',720,32]]){
 const url=`/assets/optimized/hero-${hash}-${width}-q${quality}.mp4`;
 const target=path.join(root,'public',url);
 try{await fs.access(target);}catch{
  const ffmpeg=await ffmpegPath();
  await new Promise((resolve,reject)=>{
   const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',path.join(root,'public',original),'-an','-vf',`scale=${width}:-2,fps=24`,'-c:v','libx264','-preset','medium','-crf',String(quality),'-pix_fmt','yuv420p','-movflags','+faststart',target],{stdio:['ignore','ignore','pipe'],windowsHide:true});
   let error='';child.stderr.on('data',chunk=>error+=chunk);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(error)));
  });
 }
 video[name]=url;
}
// Static first frames let idle cards show their preview without opening a decoder.
const previews={};
for(const file of (await fs.readdir('public/assets/videos')).filter(name=>name.endsWith('.webm')).sort()){
 const source=`/assets/videos/${file}`;
 const bytes=await fs.readFile(path.join(root,'public',source));
 const digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const url=`/assets/optimized/preview-${path.basename(file,'.webm')}-${digest}-640.webp`;
 const target=path.join(root,'public',url);
 try{await fs.access(target);}catch{
  const ffmpeg=await ffmpegPath();
  const frame=await new Promise((resolve,reject)=>{
   const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-i',path.join(root,'public',source),'-frames:v','1','-vf','scale=640:-2','-f','image2pipe','-vcodec','png','pipe:1'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
   const chunks=[];let error='';child.stdout.on('data',chunk=>chunks.push(chunk));child.stderr.on('data',chunk=>error+=chunk);
   child.on('error',reject);child.on('exit',code=>code===0?resolve(Buffer.concat(chunks)):reject(new Error(error)));
  });
  await sharp(frame).webp({quality:82,effort:5}).toFile(target);
 }
 previews[source]=url;
}
await fs.writeFile('src/data/optimized-media.json',JSON.stringify({images:index,video,previews},null,2)+'\n');
console.log(`Prepared responsive WebP variants for ${Object.keys(index).length} images, two hero videos and ${Object.keys(previews).length} video posters.`);
