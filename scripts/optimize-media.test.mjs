import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';import sharp from 'sharp';import {optimizeMedia} from './optimize-media.mjs';
test('image generation removes only obsolete generated variants and preserves active and user files',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'leibox-media-'));
 try{
  for(const directory of ['public/assets/components','public/assets/optimized','public/landing/agent-demo','src/data'])await fs.mkdir(path.join(root,directory),{recursive:true});
  const png=await sharp({create:{width:32,height:32,channels:3,background:'#6699aa'}}).png().toBuffer();
  await fs.writeFile(path.join(root,'public/assets/components/example.png'),png);await fs.writeFile(path.join(root,'public/landing/agent-demo/alpine-lake.png'),png);
  const old='public/assets/optimized/example-aaaaaaaaaaaa-32.webp',user='public/assets/optimized/user-bbbbbbbbbbbb-32.webp';
  await fs.writeFile(path.join(root,old),'old generated image');await fs.writeFile(path.join(root,'public/assets/optimized/manual.webp'),'keep');
  execFileSync('git',['init','--quiet'],{cwd:root});execFileSync('git',['add',old],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@localhost','commit','--quiet','-m','fixture'],{cwd:root});await fs.writeFile(path.join(root,user),'untracked output');
  const result=await optimizeMedia(root);assert.equal(result.removed,1);await assert.rejects(fs.access(path.join(root,old)),{code:'ENOENT'});
  assert.equal(await fs.readFile(path.join(root,user),'utf8'),'untracked output');assert.equal(await fs.readFile(path.join(root,'public/assets/optimized/manual.webp'),'utf8'),'keep');
  const index=JSON.parse(await fs.readFile(path.join(root,'src/data/optimized-media.json'),'utf8'));for(const image of Object.values(index.images))assert((await fs.stat(path.join(root,'public',image.src))).size>0);
 }finally{const target=await fs.realpath(root);assert.equal(path.dirname(target),await fs.realpath(os.tmpdir()));assert(path.basename(target).startsWith('leibox-media-'));await fs.rm(target,{recursive:true,force:true});}
});
