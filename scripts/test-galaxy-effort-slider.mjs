import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

export async function verifyGalaxyEffortSlider(page,item,rootPath,outputPath){
 const root=page.locator('#demo .galaxy-effort-demo'),card=root.locator('.ge-card'),slider=root.locator('.ge-control'),track=root.locator('.ge-track');
 await expect(root).toHaveAttribute('data-motion-ready','true');await expect(slider).toHaveAttribute('aria-valuetext','Low');
 assert.equal(await root.locator('.ge-tick').count(),6);assert.equal(await root.locator('.ge-thumb').count(),1);
 await root.locator('.ge-thumb').evaluate(n=>n.dataset.identity='preserved');
 const visibleFolds=()=>root.locator('.ge-brain').evaluate(n=>[...n.querySelectorAll('.ge-fold')].filter(path=>{const layer=path.closest('.ge-fold-layer');return !layer||Number(getComputedStyle(layer).opacity)>.99;}).length);
 assert.equal(await visibleFolds(),2,'Low keeps only the two original compound grooves');
 await root.locator('.ge-fold--detail').first().evaluate(n=>n.dataset.identity='persistent-fold');
 if(item.framework==='react'){
  await page.setViewportSize({width:945,height:800});await page.evaluate(()=>window.__update({height:708.75}));await root.evaluate(n=>n.style.background='#f4f4f4');await page.waitForTimeout(80);
  await root.screenshot({path:path.join(rootPath,'public/assets/components/galaxy-effort-slider.png')});
  await root.evaluate(n=>n.style.background='');await page.evaluate(()=>window.__update({height:516}));await page.waitForTimeout(60);await root.screenshot({path:path.join(outputPath,'galaxy-effort-slider-low.png')});
  await page.setViewportSize({width:1200,height:1000});
 }
 await slider.focus();await expect(slider).toBeFocused();
 assert.equal(await slider.evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
 await root.evaluate(n=>{
  const layer=n.querySelector('.ge-fold-layer[data-tier="1"]'),path=layer.querySelector('path');n.__foldGrowth=[];
  const sample=()=>{const opacity=Number(getComputedStyle(layer).opacity),offset=parseFloat(getComputedStyle(path).strokeDashoffset);if(opacity>0&&opacity<1)n.__foldGrowth.push({opacity,offset});if(n.dataset.position!=='1.0000')requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 for(const [i,level] of ['Medium','High','Extra','Max','Galaxy'].entries()){
  await slider.press('ArrowRight');await expect(slider).toHaveAttribute('aria-valuetext',level);await expect(root).toHaveAttribute('data-position',(i+1).toFixed(4));
  assert.equal(await visibleFolds(),[4,6,8,12,16][i],`${level} reveals the intended fold density`);
 }
 assert(await root.evaluate(n=>n.__foldGrowth.some(sample=>sample.opacity>0&&sample.opacity<1&&sample.offset>0&&sample.offset<1)),'folds really draw along their paths during motion');
 assert.equal(await root.locator('.ge-fold--detail').first().getAttribute('data-identity'),'persistent-fold','density changes preserve the same SVG paths');
 await expect.poll(()=>root.getAttribute('data-galaxy')).toBe('1.0000');
 await expect.poll(()=>root.getAttribute('data-position')).toBe('5.0000');
 const before=await root.locator('.ge-pixels').evaluate(n=>n.toDataURL());await page.waitForTimeout(140);
 assert.notEqual(await root.locator('.ge-pixels').evaluate(n=>n.toDataURL()),before,'Galaxy pixels really change over time');
 assert.equal(await root.locator('.ge-thumb').getAttribute('data-identity'),'preserved','the same brain moves and transforms');
 assert((await root.locator('.ge-particles').evaluate(n=>n.getContext('2d').getImageData(0,0,n.width,n.height).data.some((v,i)=>i%4===3&&v>0))),'Galaxy has actual visible particles');
 if(item.framework==='react'){await page.mouse.move(2,2);await root.screenshot({path:path.join(outputPath,'galaxy-effort-slider-galaxy.png')});}
 await slider.press('Home');await expect(root).toHaveAttribute('data-position','0.0000');await expect(root).toHaveAttribute('data-galaxy','0.0000');
 await expect(root).toHaveAttribute('data-moving','false');
 assert.equal(await visibleFolds(),2,'returning to Low retracts all added folds');
 await page.waitForTimeout(100);const idle=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>window.__motionFrames),idle,'ordinary levels stop RAF after settling');
 let bounds=await track.boundingBox();
 const point=value=>({x:bounds.x+(16+value/5*358)/392*bounds.width,y:bounds.y+bounds.height/2});
 const start=point(0),end=point(5);await page.mouse.move(start.x,start.y);await page.mouse.down();
 await page.mouse.move(end.x,end.y,{steps:16});await expect(root).toHaveAttribute('data-dragging','true');await page.mouse.up();
 await expect(slider).toHaveAttribute('aria-valuetext','Galaxy');await expect(root).toHaveAttribute('data-dragging','false');
 const middle=point(2);await page.mouse.click(middle.x,middle.y);await expect(slider).toHaveAttribute('aria-valuetext','High');
 await slider.press('Home');await slider.press('End');await slider.press('ArrowLeft');await slider.press('Escape');
 await expect(root).toHaveAttribute('data-position','0.0000');await expect(slider).toHaveAttribute('aria-valuetext','Low');
 // Real touch events exercise pointer capture rather than invoking the handlers directly.
 const session=await page.context().newCDPSession(page);bounds=await track.boundingBox();const a=point(0),b=point(3);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[b]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
 await expect(slider).toHaveAttribute('aria-valuetext','Extra');
 // Cancellation restores the committed value instead of persisting a partial drag.
 bounds=await track.boundingBox();const old=point(3),far=point(5);await page.mouse.move(old.x,old.y);await page.mouse.down();await page.mouse.move(far.x,far.y,{steps:4});
 await slider.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();await expect(slider).toHaveAttribute('aria-valuetext','Extra');
 const help=root.locator('.ge-help'),tooltip=root.locator('.ge-tooltip');await help.focus();await expect(tooltip).toBeVisible();await help.press('Escape');await expect(tooltip).toBeHidden();
 await page.emulateMedia({reducedMotion:'reduce'});await slider.press('End');await expect(root).toHaveAttribute('data-position','5.0000');await expect(root).toHaveAttribute('data-galaxy','1.0000');
 assert.equal(await visibleFolds(),16,'reduced motion still shows the full Galaxy fold density');
 const reduced=await root.locator('.ge-pixels').evaluate(n=>n.toDataURL());await page.waitForTimeout(120);assert.equal(await root.locator('.ge-pixels').evaluate(n=>n.toDataURL()),reduced);
 assert.equal(await card.evaluate(n=>getComputedStyle(n).transform),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>window.__update({reducedMotion:true}));await slider.press('Home');
 await expect(root).toHaveAttribute('data-position','0.0000');await page.evaluate(()=>window.__update({reducedMotion:false}));
 await slider.press('End');await expect(root).toHaveAttribute('data-galaxy','1.0000');
 await page.locator('#demo').evaluate(n=>n.style.transform='translateY(2000px)');await page.waitForTimeout(200);
 const hidden=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.__motionFrames),hidden,'offscreen Galaxy stops drawing');
 await page.locator('#demo').evaluate(n=>n.style.transform='');await page.waitForTimeout(160);assert(await page.evaluate(()=>window.__motionFrames)>hidden,'Galaxy resumes on screen');
 await slider.press('Home');await expect(root).toHaveAttribute('data-position','0.0000');
}

export async function verifyGalaxyEffortSliderDoc(page,outputPath){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.galaxy-effort-demo')).toHaveAttribute('data-motion-ready','true');
 const slider=frame.locator('.ge-control');await slider.focus();await slider.press('End');await expect(slider).toHaveAttribute('aria-valuetext','Galaxy');
 await expect(frame.locator('.galaxy-effort-demo')).toHaveAttribute('data-galaxy','1.0000');
 await page.screenshot({path:path.join(outputPath,'galaxy-effort-slider-doc-galaxy.png')});
 await slider.press('Home');await expect(slider).toHaveAttribute('aria-valuetext','Low');
 await expect(page.locator('a[href="https://x.com/ozzyxs1a"]')).toHaveText('作者 · ozzy');assert.equal(await page.locator('video').count(),0);
}
