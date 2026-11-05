import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const html=await fs.readFile('public/motion/multi-cursor-builder.html','utf8'),server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(html.replace('<html','<html data-leibox-motion-preview'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true,ignoreDefaultArgs:['--hide-scrollbars']}),results=[];
try{
 for(const[width,dpr,scale]of[[375,2,1],[768,1.25,1],[1440,1.75,1],[1120,1.25,.67]]){
  const page=await browser.newPage({viewport:{width,height:960},deviceScaleFactor:dpr});
  await page.addInitScript(()=>{window.__paintedThumbnails=[];const stroke=CanvasRenderingContext2D.prototype.strokeRect;CanvasRenderingContext2D.prototype.strokeRect=function(x,y,w,h){if(this.canvas.id==='fx'&&this.strokeStyle==='#0d99ff'){const root=this.canvas.getRootNode(),scene=root.querySelector('.mc-scene'),origin=scene.getBoundingClientRect(),sx=origin.width/scene.clientWidth,sy=origin.height/scene.clientHeight;for(const n of root.querySelectorAll('.th')){if(Number(n.querySelector('img.art')?.style.opacity??0)<=0)continue;const r=n.getBoundingClientRect(),local={x:(r.x-origin.x)/sx,y:(r.y-origin.y)/sy,w:r.width/sx,h:r.height/sy};if(local.y<-300||local.y>scene.clientHeight+60)continue;if(Math.abs(w-local.w)<2&&Math.abs(h-local.h)<2&&Math.abs(x-local.x)<30&&Math.abs(y-local.y)<30){window.__paintedThumbnails.push({dx:x-local.x,dy:y-local.y,dw:w-local.w,dh:h-local.h,mapping:this.getTransform().a*origin.width/this.canvas.width/sx});if(window.__paintedThumbnails.length>100)window.__paintedThumbnails.shift();}}}return stroke.call(this,x,y,w,h);};});
  await page.goto('http://127.0.0.1:'+server.address().port);await expect(page.locator('.mc-scene')).toHaveAttribute('data-ready','true');
  if(scale!==1)await page.locator('[data-motion-surface]').evaluate((n,k)=>{n.style.transform=`scale(${k})`;n.style.transformOrigin='top left';},scale);
  await page.locator('.mc-port').evaluate(n=>{const card=n.querySelector('.card'),r=card.getBoundingClientRect(),p=n.getBoundingClientRect();n.scrollTo({top:n.scrollTop+(r.y-p.y)/(p.width/n.clientWidth)-180,behavior:'instant'});});
  await expect.poll(()=>page.evaluate(()=>window.__paintedThumbnails.length),{timeout:15000}).toBeGreaterThan(0);
  await page.locator('.mc-port').press('Space');const samples=await page.evaluate(()=>window.__paintedThumbnails);
  for(const s of samples){for(const key of['dx','dy','dw','dh'])assert(Math.abs(s[key])<1.1,`painted ${key} drift at width ${width}, DPR ${dpr}, scale ${scale}: ${s[key]}`);assert(Math.abs(s.mapping-1)<1e-6,'CSS/raster mapping remains exact');}
  results.push({width,dpr,scale,samples:samples.length,maxError:Math.max(...samples.flatMap(s=>[Math.abs(s.dx),Math.abs(s.dy),Math.abs(s.dw),Math.abs(s.dh)]))});await page.screenshot({path:`outputs/lei-figma-optimization-20261105/collected-alignment-${width}-${dpr}-${scale}.png`});await page.close();
 }
 await fs.writeFile('outputs/lei-figma-optimization-20261105/collected-alignment-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
