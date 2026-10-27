import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

// Design-space helpers mirror the component formulas so pointer targets land on real paths.
const PMAX=1300,PMIN=540,TOP=40,BOT=630,NOW=880.2,TARGETS=[1226,835.38,583.05];
const pathY=(i,x)=>{const t=Math.min(1,Math.max(0,(x-572)/308)),e=1-(1-t)**1.7,l=Math.log(NOW)+(Math.log(TARGETS[i])-Math.log(NOW))*e;return TOP+(Math.log(PMAX)-l)/Math.log(PMAX/PMIN)*(BOT-TOP);};

async function pointAt(page,canvas,x,y,scale={x:0,y:0,f:1}){
 const box=await canvas.boundingBox();
 await page.mouse.move(scale.x+(box.x+box.width*x/1200)*scale.f,scale.y+(box.y+box.height*y/720)*scale.f);
}
const pixels=canvas=>canvas.evaluate(n=>n.toDataURL());
// Left history area is static except for the shark, so a region snapshot shows whether it is there.
const region=(canvas,x,y,w,h)=>canvas.evaluate((n,[x,y,w,h])=>{const k=n.width/1200,d=n.getContext('2d').getImageData(Math.round(x*k),Math.round(y*k),Math.round(w*k),Math.round(h*k)).data;let s=0;for(let i=0;i<d.length;i+=4)s=(s*31+d[i]+d[i+1]*7+d[i+2]*13)%1e9;return s;},[x,y,w,h]);

export async function verifyHammerheadChart(page,item,rootPath){
 const root=page.locator('#demo .hh-demo'),canvas=root.locator('.hh-canvas'),buttons=root.locator('.hh-path'),live=root.locator('.hh-live');
 await expect(root).toHaveAttribute('data-ready','true');
 assert.equal(await buttons.count(),3);
 assert.equal(await buttons.nth(1).getAttribute('aria-checked'),'true','54% path starts selected');
 if(item.framework==='react'){
  // Poster matches the 4:3 gallery scene: the 5:3 chart centered on #f4f4f4.
  await page.locator('#demo').evaluate(n=>Object.assign(n.style,{width:'1200px',height:'900px',display:'flex',alignItems:'center',background:'#f4f4f4'}));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('#demo').screenshot({path:path.join(rootPath,'public/assets/components/hammerhead-chart.png')});
  await page.locator('#demo').evaluate(n=>n.removeAttribute('style'));
 }
 const first=await pixels(canvas);await page.waitForTimeout(300);
 assert.notEqual(await pixels(canvas),first,'the shark and cone noise animate over time');
 await pointAt(page,canvas,800,pathY(0,800));
 await expect(root).toHaveAttribute('data-active','0');
 await pointAt(page,canvas,800,pathY(2,800));
 await expect(root).toHaveAttribute('data-active','2');
 await pointAt(page,canvas,850,pathY(2,850));
 await expect(buttons.nth(2)).toHaveClass(/is-tagged/,{timeout:8000});
 // Pointer in the candle history: the shark leaves the paths and swims to it, then returns.
 const area=()=>region(canvas,240,250,120,100),empty=await area();
 await pointAt(page,canvas,300,300);
 await expect.poll(area,{timeout:4000}).not.toBe(empty);
 await expect(root).toHaveAttribute('data-active','2');
 await pointAt(page,canvas,800,pathY(1,800));
 await expect(root).toHaveAttribute('data-active','1');
 await expect.poll(area,{timeout:4000}).toBe(empty);
 await buttons.nth(0).click();
 await expect(buttons.nth(0)).toHaveAttribute('aria-checked','true');
 await expect(live).toHaveText('21% path, target 1226 +39.3%');
 await page.mouse.move(2,2);
 await buttons.nth(0).focus();await page.keyboard.press('End');
 await expect(buttons.nth(2)).toHaveAttribute('aria-checked','true');await expect(buttons.nth(2)).toBeFocused();
 await page.keyboard.press('ArrowDown');await expect(root).toHaveAttribute('data-active','0');
 await page.keyboard.press('ArrowDown');await expect(root).toHaveAttribute('data-active','1');
 assert.equal(await root.locator('.hh-path[tabindex="0"]').count(),1,'roving tabindex keeps one tab stop');
}

export async function verifyHammerheadChartDoc(page){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await iframe.scrollIntoViewIfNeeded();
 const root=frame.locator('.hh-demo'),canvas=frame.locator('.hh-canvas');
 await expect(root).toHaveAttribute('data-ready','true');
 const outer=await iframe.boundingBox(),inner=await canvas.evaluate(()=>({w:innerWidth}));
 const scale={x:outer.x,y:outer.y,f:outer.width/inner.w};
 // Iframe-local boxes are scaled by the docs frame, so map through its outer box.
 const box=await canvas.boundingBox();
 const local=await canvas.evaluate(n=>n.getBoundingClientRect().toJSON());
 const at=async(x,y)=>page.mouse.move(outer.x+(local.x+local.width*x/1200)*scale.f,outer.y+(local.y+local.height*y/720)*scale.f);
 assert(box);
 await at(800,pathY(0,800));await expect(root).toHaveAttribute('data-active','0');
 await at(800,pathY(2,800));await expect(root).toHaveAttribute('data-active','2');
 await expect(page.locator('a[href="https://x.com/stackedlol"]')).toHaveText('作者 · stacked');
 assert.equal(await page.locator('video').count(),0);
 // Sidebar hover plays the chart on the shared #f4f4f4 surface and releases on leave.
 await page.locator('nav a[href="/docs/animations/hammerhead-chart"]').hover();
 const preview=page.locator('[data-sidebar-preview="/docs/animations/hammerhead-chart"]');
 await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);
 const live=preview.frameLocator('iframe'),liveCanvas=live.locator('.hh-canvas');
 await expect(live.locator('.hh-demo')).toHaveAttribute('data-ready','true');
 assert.equal(await live.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');
 const frame0=await pixels(liveCanvas);await page.waitForTimeout(300);
 assert.notEqual(await pixels(liveCanvas),frame0,'sidebar preview animates');
 await page.mouse.move(1380,20);await expect(preview).toHaveCount(0);
}
