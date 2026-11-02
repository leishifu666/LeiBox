import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const out=path.resolve('outputs/anushka-refine-20261102');await fs.mkdir(out,{recursive:true});
const result=await build({stdin:{contents:`import {drawParticleTextures} from './src/lib/motion-core/particle-texture-renderer.mjs';const ctx=document.querySelector('canvas').getContext('2d');window.draw=t=>{ctx.setTransform(2,0,0,2,0,0);drawParticleTextures(ctx,t);};window.draw(0);`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',logLevel:'silent'});
const server=http.createServer((req,res)=>{if(req.url==='/entry.js'){res.setHeader('content-type','text/javascript');res.end(result.outputFiles[0].text);}else{res.setHeader('content-type','text/html');res.end('<body style="margin:0;background:black"><canvas width="1920" height="1080" style="width:960px;height:540px"></canvas><script src="/entry.js"></script>');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:960,height:540}});await page.goto(`http://127.0.0.1:${server.address().port}`);for(const time of [0,.5,1,1.5,2,2.5,3]){await page.evaluate(t=>window.draw(t),time);await page.screenshot({path:path.join(out,`current-${time.toFixed(1)}.png`)});}const timing=await page.evaluate(()=>{const samples=[];for(let i=0;i<60;i++){const start=performance.now();window.draw(i/60);samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);return{median:samples[30],p95:samples[57]};});await fs.writeFile(path.join(out,'render-cost.json'),JSON.stringify(timing));console.log({out,timing});}finally{await browser.close();await new Promise(r=>server.close(r));}
