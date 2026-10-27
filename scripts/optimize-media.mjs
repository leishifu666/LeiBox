import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const root=process.cwd(), output=path.join(root,'public/assets/optimized');
await fs.mkdir(output,{recursive:true});
const images=(await fs.readdir('public/assets/components')).filter(name=>/\.(png|jpe?g)$/.test(name)).map(name=>'/assets/components/'+name);
images.push('/landing/agent-demo/alpine-lake.png');
const index={};
for(const source of images){
 const bytes=await fs.readFile(path.join(root,'public',source)), hash=createHash('sha256').update(bytes).digest('hex').slice(0,12), name=path.basename(source,path.extname(source));
 const metadata=await sharp(bytes).metadata(), variants=[];
 for(const width of [...new Set([320,640,960,1200,Math.min(metadata.width,1200)])].filter(width=>width<=metadata.width).sort((a,b)=>a-b)){
  const url=`/assets/optimized/${name}-${hash}-${width}.webp`;
  try{await fs.access(path.join(root,'public',url));}catch{await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path.join(root,'public',url));}
  variants.push({width,url});
 }
 index[source]={src:variants.at(-1).url,srcSet:variants.map(v=>v.url+' '+v.width+'w').join(', ')};
}
await fs.writeFile('src/data/optimized-media.json',JSON.stringify({images:index,video:{},previews:{}},null,2)+'\n');
console.log('Prepared responsive images for '+images.length+' project assets.');
