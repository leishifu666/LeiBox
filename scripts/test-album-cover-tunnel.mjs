import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

export async function verifyAlbumCoverTunnel(page,item,root,out){
 const scene=page.locator('#demo .aw-scene'),canvas=page.locator('#demo canvas');
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-renderer','webgl2');await expect(scene).toHaveAttribute('data-cover-count','55');
 await page.evaluate(()=>{window.__albumSelections=[];window.__update({autoTravel:false,onSelect:i=>window.__albumSelections.push(i)});});
 await expect.poll(()=>page.evaluate(()=>window.__albumPoses.at(-1)?.scale??0)).toBeGreaterThan(1.65);
 const box=await canvas.boundingBox();
 let point;
 for(const [x,y] of [[.88,.9],[.14,.12],[.9,.83],[.18,.17],[.93,.96],[.06,.08]]){
  const candidate={x:box.x+box.width*x,y:box.y+box.height*y};await page.mouse.move(candidate.x,candidate.y);await page.waitForTimeout(100);
  const h=await scene.getAttribute('data-hovered');if(h!=='-1'&&h!==await scene.getAttribute('data-active')&&await scene.getAttribute('data-hovered-layer')===await scene.getAttribute('data-active-layer')){point=candidate;break;}
 }
 assert(point,'a visible neighboring cover can be hovered with real pointer input');
 const hovered=await scene.getAttribute('data-hovered');
 await page.evaluate(()=>{window.__albumSwitchAt=performance.now();window.__albumBefore=window.__albumPoses.at(-1);});
 await page.mouse.click(point.x,point.y);
 await expect(scene).toHaveAttribute('data-active',hovered,{timeout:15000});assert.equal(await page.evaluate(()=>window.__albumSelections.length),1);
 await page.mouse.move(1199,990);await page.waitForTimeout(1400);
 const poses=await page.evaluate(()=>[window.__albumBefore,...window.__albumPoses.filter(p=>p.time>=window.__albumSwitchAt)]);
 assert(poses.at(-1).scale<1.05,'outgoing primary finishes at normal wall size');
 const first=poses[0],last=poses.at(-1),dx=last.x-first.x,dy=last.y-first.y,distance=Math.hypot(dx,dy);
 assert(distance>2,'outgoing cover reaches the neighboring wall slot');
 assert(poses.filter(p=>Math.hypot(p.x-first.x,p.y-first.y)>.2&&Math.hypot(p.x-last.x,p.y-last.y)>.2).length>3,'exchange renders intermediate positions');
 assert(poses.some(p=>Math.abs((p.x-first.x)*dy-(p.y-first.y)*dx)/distance>.1),'exchange follows the supplied curved path');
 const current=await scene.getAttribute('data-active');await canvas.press('ArrowLeft');await expect.poll(()=>scene.getAttribute('data-active'),{timeout:15000}).not.toBe(current);
 const travel=Number(await scene.getAttribute('data-travel'));await canvas.hover();await page.mouse.wheel(0,1300);await expect.poll(async()=>Math.abs(Number(await scene.getAttribute('data-travel'))-travel)).toBeGreaterThan(1);
 await canvas.press('Space');await expect(scene).toHaveAttribute('data-paused','true');await page.waitForTimeout(100);const pausedFrame=await scene.getAttribute('data-frame');await page.waitForTimeout(120);assert.equal(await scene.getAttribute('data-frame'),pausedFrame,'pause stops actual GPU redraws');
 await canvas.press('Space');await expect(scene).toHaveAttribute('data-paused','false');await expect.poll(()=>scene.getAttribute('data-frame')).not.toBe(pausedFrame);
 await page.evaluate(()=>{window.__albumSelections=[];window.__update({active:48,reducedMotion:true});});await expect(scene).toHaveAttribute('data-active','48');assert.equal(await page.evaluate(()=>window.__albumSelections.length),0,'external selection does not emit onSelect');
 await page.waitForTimeout(100);const reducedFrame=await scene.getAttribute('data-frame');await page.waitForTimeout(120);assert.equal(await scene.getAttribute('data-frame'),reducedFrame,'reduced motion does not run an ambient RAF loop');
 await canvas.press('ArrowRight');await expect.poll(()=>scene.getAttribute('data-active')).not.toBe('48');
 await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=32;c.getContext('2d').fillRect(0,0,32,32);window.__albumTestImage=c.toDataURL();window.__update({images:[{src:window.__albumTestImage,alt:'<script>safe</script>'}],active:0});});
 await expect(scene).toHaveAttribute('data-cover-count','1');await expect(page.locator('#demo .aw-status')).toHaveText('<script>safe</script>');assert.equal(await scene.locator('script').count(),0);
 await page.evaluate(()=>window.__update({images:['data:image/jpeg;base64,!']}));await expect(scene).toHaveAttribute('data-error','images');
 await page.evaluate(()=>window.__update({images:undefined,reducedMotion:false}));await expect(scene).toHaveAttribute('data-cover-count','55');await expect(scene).not.toHaveAttribute('data-error');
 await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.marginTop='2000px');await expect(scene).toHaveAttribute('data-running','false');await page.waitForTimeout(100);const hiddenFrame=await scene.getAttribute('data-frame');await page.waitForTimeout(100);assert.equal(await scene.getAttribute('data-frame'),hiddenFrame,'offscreen releases RAF');
 await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.marginTop='0');await expect(scene).toHaveAttribute('data-running','true');
 if(item.framework==='react')await page.screenshot({path:out+'/album-cover-tunnel-interaction.png'});
}
