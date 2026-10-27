import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const root=process.cwd(),out=path.join(root,'outputs/particle-logo-volume');await fs.mkdir(out,{recursive:true});
for(const engine of ['webgl','webgpu']){
 const target=`src/lib/ParticleObject/ParticleObject${engine==='webgl'?'Vanilla':'WebGPU'}.ts`;
 const code=`import * as THREE from 'three';import {createParticleObject} from ${JSON.stringify(path.join(root,target).replaceAll('\\','/'))};
const original=THREE.BufferGeometry.prototype.setAttribute;THREE.BufferGeometry.prototype.setAttribute=function(name,attribute){const result=original.call(this,name,attribute);if(name==='aShade')window.cloud=this;return result;};
window.measureCloud=()=>{
 const p=window.cloud.getAttribute('position').array,s=window.cloud.getAttribute('aShade').array,n=p.length/3,mean=[0,0,0],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<n;i++)for(let k=0;k<3;k++){const v=p[i*3+k];mean[k]+=v/n;min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
 const c=Array(6).fill(0);for(let i=0;i<n;i++){const x=p[i*3]-mean[0],y=p[i*3+1]-mean[1],z=p[i*3+2]-mean[2];c[0]+=x*x/n;c[1]+=x*y/n;c[2]+=y*y/n;c[3]+=x*z/n;c[4]+=y*z/n;c[5]+=z*z/n;}
 const det=c[0]*c[2]-c[1]*c[1],a=(c[3]*c[2]-c[4]*c[1])/det,b=(c[4]*c[0]-c[3]*c[1])/det;
 return{particles:n,spans:max.map((v,k)=>v-min[k]),depthRms:Math.sqrt(Math.max(0,c[5]-a*c[3]-b*c[4])),shadeRange:Math.max(...s)-Math.min(...s)};
};
window.loads=0;window.mount=(src)=>{const options={src,count:20000,size:2.1,sizeVariance:.45,background:'#ffffff',onLoad(){window.loads++;},onError(error){window.assetError=String(error);}};if(window.instance)window.instance.setOptions(options);else window.instance=createParticleObject({canvas:document.querySelector('canvas')},options);};
window.mount(${JSON.stringify(engine==='webgl'?'/leibox-mark.svg':'/assets/models/leibox-particle.glb')});`;
 await build({stdin:{contents:code,resolveDir:root,loader:'js'},outfile:path.join(out,engine+'.js'),bundle:true,platform:'browser',format:'esm',logLevel:'silent'});
}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local');try{
  if(/^\/(?:webgl|webgpu)$/.test(url.pathname)){res.setHeader('content-type','text/html');res.end(`<!doctype html><style>body{margin:0;background:white}canvas{width:100vw;height:100vh;display:block;touch-action:none}</style><canvas></canvas><script type="module" src="${url.pathname}.js"></script>`);return;}
  const file=/^\/(?:webgl|webgpu)\.js$/.test(url.pathname)?path.join(out,url.pathname.slice(1)):['/leibox-mark.svg','/assets/models/leibox-particle.glb'].includes(url.pathname)?path.join(root,'public',url.pathname.slice(1)):null;
  if(!file){res.statusCode=404;res.end();return;}res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'model/gltf-binary');res.end(await fs.readFile(file));
 }catch(error){res.statusCode=500;res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const engine of ['webgl','webgpu']){
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.gpuSubmissions=0;if(typeof GPUQueue!=='undefined'){const submit=GPUQueue.prototype.submit;GPUQueue.prototype.submit=function(...args){window.gpuSubmissions++;return submit.apply(this,args);};}});
  await page.goto(`http://127.0.0.1:${server.address().port}/${engine}`);await page.waitForFunction(()=>window.loads>0||window.assetError||window.instance===null);
  if(engine==='webgpu'&&await page.evaluate(()=>window.instance===null)){results.push({engine,available:false,reason:'WebGPU unavailable in this browser'});await page.close();continue;}
  assert.equal(await page.evaluate(()=>window.assetError),undefined);
  const result={engine,available:true};
  if(engine==='webgl'){
   result.before=await page.evaluate(()=>window.measureCloud());
   await page.evaluate(()=>window.mount('/assets/models/leibox-particle.glb'));await page.waitForFunction(()=>window.loads===2);
   result.after=await page.evaluate(()=>window.measureCloud());
   assert(result.after.depthRms>.04&&result.after.depthRms>result.before.depthRms*8,'actual particle positions occupy a volume rather than a tilted plane');
   assert(result.after.shadeRange>.15,'real surface normals produce different particle brightness');
  }
  await page.mouse.move(20,20);await page.waitForTimeout(350);await page.screenshot({path:path.join(out,engine+'-front.png')});
  const before=await page.locator('canvas').screenshot();await page.mouse.move(480,300);await page.mouse.down();await page.mouse.move(625,340,{steps:24});await page.mouse.up();await page.mouse.move(20,20);await page.waitForTimeout(300);
  const after=await page.locator('canvas').screenshot();assert(!before.equals(after),'real orbit dragging changes the visible 3D faces');
  await page.screenshot({path:path.join(out,engine+'-side.png')});
  if(engine==='webgpu'){result.submissions=await page.evaluate(()=>window.gpuSubmissions);result.native=result.submissions>0;}
  await page.evaluate(()=>window.instance.destroy());assert.deepEqual(errors,[]);result.orbit=true;result.pageErrors=errors;results.push(result);await page.close();console.log(JSON.stringify(result));
 }
 await fs.writeFile(path.join(out,'runtime.json'),JSON.stringify(results,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
