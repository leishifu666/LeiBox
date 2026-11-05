import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export async function optimizeMedia(root=process.cwd()) {
root=path.resolve(root);
const output=path.join(root,'public/assets/optimized');
await fs.mkdir(output,{recursive:true});
if(await fs.realpath(output)!==output)throw new Error('Optimized image directory must not be a symlink');
// Preserve files another task or the user is currently editing, including untracked outputs.
let protectedFiles=new Set();
try{await fs.access(path.join(root,'.git'));protectedFiles=new Set(execFileSync('git',['status','--porcelain=v1','-z','--untracked-files=all','--','public/assets/optimized'],{cwd:root,encoding:'utf8'}).split('\0').map(line=>line.slice(3)).filter(file=>file.startsWith('public/assets/optimized/')).map(file=>path.basename(file)));}catch(error){if(error.code!=='ENOENT')throw error;}
const images=(await fs.readdir(path.join(root,'public/assets/components'))).filter(name=>/\.(png|jpe?g)$/.test(name)).map(name=>'/assets/components/'+name);
images.push('/landing/agent-demo/alpine-lake.png');
const index={},retained=new Set();
for(const source of images){
 const bytes=await fs.readFile(path.join(root,'public',source)), hash=createHash('sha256').update(bytes).digest('hex').slice(0,12), name=path.basename(source,path.extname(source));
 const metadata=await sharp(bytes).metadata(), variants=[];
 for(const width of [...new Set([320,640,960,1200,Math.min(metadata.width,1200)])].filter(width=>width<=metadata.width).sort((a,b)=>a-b)){
  const url=`/assets/optimized/${name}-${hash}-${width}.webp`;
  retained.add(path.basename(url));
  try{await fs.access(path.join(root,'public',url));}catch{await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path.join(root,'public',url));}
  variants.push({width,url});
 }
 index[source]={src:variants.at(-1).url,srcSet:variants.map(v=>v.url+' '+v.width+'w').join(', ')};
}
await fs.writeFile(path.join(root,'src/data/optimized-media.json'),JSON.stringify({images:index,video:{},previews:{}},null,2)+'\n');
let removed=0,removedBytes=0;
for(const entry of await fs.readdir(output,{withFileTypes:true})){
 if(!entry.isFile()||!/^[-\w]+-[a-f0-9]{12}-\d+\.webp$/.test(entry.name)||retained.has(entry.name)||protectedFiles.has(entry.name))continue;
 const target=path.join(output,entry.name);removedBytes+=(await fs.stat(target)).size;await fs.unlink(target);removed++;
}
const result={images:images.length,removed,removedBytes};console.log(JSON.stringify(result));return result;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))await optimizeMedia();
