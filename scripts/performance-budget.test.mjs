import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFile(path.join(root,file),'utf8');
const index=JSON.parse(await read('public/doc-assets-index.json'));
const media=JSON.parse(await read('src/data/optimized-media.json'));

test('client catalog excludes reconstruction prompts and their source data',async()=>{
 const result=await build({entryPoints:[path.join(root,'src/data/component-catalog.ts')],bundle:true,write:false,format:'esm',platform:'browser',metafile:true});
 assert(result.outputFiles[0].contents.length<70_000,'Navigation metadata must stay below 70 KB');
 assert(!Object.keys(result.metafile.inputs).some(file=>/motion-prompts|gradient-ring-fields|folded-emoji-scroll\.mjs/.test(file)),'Client navigation must not import full reconstruction data');
});

test('detail HTML and route data stay below 450 KB without embedding all source versions',async()=>{
 for(const file of ['out/docs/animations/glass-folder.html','out/docs/animations/spider-music-player.html','out/docs/animations/gradient-cover-wall.html','out/docs/components/otp-verification.html']){
  const html=await read(file);
  assert(Buffer.byteLength(html)<450_000,`${file}: ${Buffer.byteLength(html)} bytes`);
  assert(!html.includes('data:font/woff2;base64,'),`${file} embeds a downloadable font`);
 }
 const page='out/docs/animations/glass-folder.txt';
 assert((await fs.stat(path.join(root,page))).size<300_000,'Component RSC payload exceeds 300 KB');
});

test('project packages retain complete content-addressed code without retired canvas bundles',async()=>{
 assert.deepEqual(index.canvas,{});
 for(const component of Object.values(index.canvas)){
  assert.equal(component.webgl.length,6);
  assert.equal(component.webgpu.length,6);
  for(const ref of [...component.webgl,...component.webgpu]){
   const body=await read('public'+ref.url);
   assert(ref.url.includes(createHash('sha256').update(body).digest('hex').slice(0,24)));
   const data=JSON.parse(body);
   assert(data.source.length>1000);
   assert(data.html.includes('<pre'));
  }
 }
 for(const packs of Object.values(index.motion)){
  assert.equal(packs.length,6);
  for(const pack of packs){
   assert.equal(pack.files.length,4);
   const bundle=JSON.parse(await read('public'+pack.bundleUrl)).source;
   for(const file of pack.files){
    const content=JSON.parse(await read('public'+file.url)).source;
    assert(bundle.includes(content.trimEnd()),`bundle omitted ${file.fileName}`);
   }
  }
  for(let i=1;i<4;i++)assert.equal(new Set(packs.map(pack=>pack.files[i].url)).size,1,'shared motion core must reuse one asset');
 }
});

test('responsive project posters respect byte budgets',async()=>{
 const image=media.images['/assets/components/gradient-cover-wall.png'];
 const small=image.srcSet.split(', ')[0].split(' ')[0];
 assert((await fs.stat(path.join(root,'public',small))).size<80_000);
 assert.deepEqual(media.video,{});
 const home=await read('out/index.html');
 assert(!home.includes('src="/assets/fallback-hero.mp4"'));
 assert(!home.includes('href="/assets/hero-background.jpg"'));
});

test('retired video assets are not published',async()=>{ assert.deepEqual(media.previews,{}); await assert.rejects(fs.access(path.join(root,'public/assets/videos')), {code:'ENOENT'}); });

test('the guided homepage preview shares the downloadable native engine',async()=>{
 const site=await read('src/lib/motion-core/site-previews/glass-folder.generated.js');
 const downloadable=await read('public/motion-frameworks/glass-folder/react/GlassFolderEngine.js');
 const source=site.slice(site.indexOf('\n')+1).replaceAll('from "../motion-runtime"','from "./motion-runtime"');
 assert.equal(source,downloadable,'the website preview must stay in sync with the delivered component');
});

test('concurrent code reads share one fetch and failed requests remain retryable',async()=>{
 const bundled=await build({entryPoints:[path.join(root,'src/lib/load-doc-asset.ts')],bundle:true,write:false,format:'esm',platform:'node'});
 const {loadDocAsset}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const previous=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({source:'complete source'}));};
  const result=await Promise.all([loadDocAsset('/shared.json'),loadDocAsset('/shared.json')]);
  assert.equal(calls,1);assert.equal(result[0].source,'complete source');
  globalThis.fetch=async()=>new Response('unavailable',{status:503});
  await assert.rejects(loadDocAsset('/retry.json'));
  globalThis.fetch=async()=>new Response(JSON.stringify({source:'recovered'}));
  assert.equal((await loadDocAsset('/retry.json')).source,'recovered');
  let recentCalls=0;
  globalThis.fetch=async()=>{recentCalls++;return new Response(JSON.stringify({source:'complete source'}));};
  for(let i=0;i<40;i++)await loadDocAsset(`/recent-${i}.json`);
  await loadDocAsset('/recent-39.json');
  assert.equal(recentCalls,40,'a recently used source should stay cached');
  await loadDocAsset('/recent-0.json');
  assert.equal(recentCalls,41,'old source requests should leave the bounded cache');
 }finally{globalThis.fetch=previous;}
});
