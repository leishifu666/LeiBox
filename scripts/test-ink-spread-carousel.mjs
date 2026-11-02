import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

export async function verifyInkSpreadCarousel(page,item,ROOT,OUT){
 const scene=page.locator('#demo .ib-scene'),photo=page.locator('#demo .ib-photo'),canvas=page.locator('#demo .ib-canvas');
 const next=page.locator('#demo .ib-nav--next'),previous=page.locator('#demo .ib-nav--prev');
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-renderer','webgl');
 await expect(scene).toHaveAttribute('data-index','0');
 const pixels=()=>canvas.evaluate(n=>n.toDataURL()),initial=await pixels();
 await page.evaluate(()=>{window.__inkChanges=[];window.__update({duration:900,onIndexChange:index=>window.__inkChanges.push(index)});});
 await canvas.evaluate(n=>n.dataset.identity='persistent-canvas');
 if(item.framework==='react'){
  await page.setViewportSize({width:1168,height:1000});
  await scene.evaluate(n=>n.style.background='#f4f4f4');
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components/ink-spread-carousel.png')});
  await scene.evaluate(n=>n.style.background='');
  await page.setViewportSize({width:1200,height:1000});
 }
 await next.click();
 await page.waitForFunction(()=>{const n=document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.ib-scene');return +n.dataset.progress>.22&&+n.dataset.progress<.75;});
 const middle=await pixels();assert.notEqual(middle,initial,'the actual WebGL frame changes during the spread');
 assert((await scene.getAttribute('data-origin')).startsWith('0.8'),'arrow reveal originates at its pressed position');
 if(item.framework==='react')await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(OUT,'ink-spread-carousel-middle.png')});
 await expect(scene).toHaveAttribute('data-animating','false');await expect(scene).toHaveAttribute('data-index','1');
 assert.notEqual(await pixels(),middle);assert.deepEqual(await page.evaluate(()=>window.__inkChanges),[1]);
 await photo.click({position:{x:70,y:100}});
 const origin=(await scene.getAttribute('data-origin')).split(',').map(Number);assert(origin[0]<.3&&origin[1]<.3,'a photo click uses the actual upper-left position');
 await page.waitForFunction(()=>+document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.ib-scene').dataset.progress>.1);
 await previous.click();await next.click();await next.click();
 await expect(scene).toHaveAttribute('data-target','3');await expect(scene).toHaveAttribute('data-index','3');await expect(scene).toHaveAttribute('data-animating','false');
 assert.deepEqual(await page.evaluate(()=>window.__inkChanges),[1,3],'interrupted destinations do not emit stale completion callbacks');
 assert.equal(await canvas.getAttribute('data-identity'),'persistent-canvas');
 await next.click();await expect(scene).toHaveAttribute('data-index','0');
 await photo.focus();await photo.press('End');await expect(scene).toHaveAttribute('data-index','3');
 await photo.press('Home');await expect(scene).toHaveAttribute('data-index','0');
 await page.evaluate(()=>window.__update({reducedMotion:true,index:2}));await expect(scene).toHaveAttribute('data-index','2');
 const count=await page.evaluate(()=>window.__inkChanges.length);await page.evaluate(()=>window.__update({index:1}));await expect(scene).toHaveAttribute('data-index','1');
 assert.equal(await page.evaluate(()=>window.__inkChanges.length),count,'external index updates do not call onIndexChange');
 await photo.press('ArrowLeft');await expect(scene).toHaveAttribute('data-index','0');
 await page.evaluate(()=>window.__update({reducedMotion:false}));
 const box=await photo.boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.3,y:box.y+box.height*.3}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await expect(scene).toHaveAttribute('data-index','1');
 await next.click();await page.waitForFunction(()=>+document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.ib-scene').dataset.progress>.12);
 await page.locator('#demo').evaluate(n=>n.style.transform='translateY(1800px)');
 await expect(scene).toHaveAttribute('data-visible','false');const paused=await scene.getAttribute('data-progress');
 await page.waitForTimeout(180);assert.equal(await scene.getAttribute('data-progress'),paused,'offscreen animation pauses at the same progress');
 await page.locator('#demo').evaluate(n=>n.style.transform='');await expect(scene).toHaveAttribute('data-index','2');
 await page.evaluate(()=>window.__update({reducedMotion:undefined}));
 await next.click();await page.emulateMedia({reducedMotion:'reduce'});await expect(scene).toHaveAttribute('data-index','3');await expect(scene).toHaveAttribute('data-animating','false');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>window.__update({images:['data:image/png;base64,invalid','data:image/png;base64,also-invalid']}));
 await expect(page.locator('#demo .ib-error')).toContainText('previous photos are still available');
 assert.equal(await scene.getAttribute('data-index'),'3');await previous.click();await expect(scene).toHaveAttribute('data-index','2');
 const colorSources=['#e44232','#2878c3'].map(color=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="336"><rect width="256" height="336" fill="${color}"/></svg>`));
 await page.evaluate(images=>window.__update({images,index:0,reducedMotion:true}),colorSources);
 await expect(scene).toHaveAttribute('data-loading','false');await expect(scene).toHaveAttribute('data-index','0');await expect(page.locator('#demo .ib-error')).toBeHidden();
 await next.click();await expect(scene).toHaveAttribute('data-index','1');
 const solid=await canvas.evaluate(n=>{const c=document.createElement('canvas');c.width=n.width;c.height=n.height;const ctx=c.getContext('2d');ctx.drawImage(n,0,0);return [...ctx.getImageData(20,20,1,1).data];});
 assert.deepEqual(solid,[40,120,195,255],'custom images are really decoded, uploaded and drawn');
 await page.evaluate(()=>window.__unmount());await page.evaluate(()=>window.__mount());await expect(scene).toHaveAttribute('data-ready','true');
 await canvas.evaluate(n=>{window.__inkLoss=n.getContext('webgl').getExtension('WEBGL_lose_context');window.__inkLoss.loseContext();});
 await expect(scene).toHaveAttribute('data-renderer','image');await expect(canvas).toBeHidden();await next.click();await expect(scene).toHaveAttribute('data-index','1');
 await page.evaluate(()=>window.__inkLoss.restoreContext());await expect(scene).toHaveAttribute('data-renderer','webgl');await expect(canvas).toBeVisible();
 await page.evaluate(()=>{
  window.__inkOriginalGetContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:window.__inkOriginalGetContext.call(this,type,...args);};
  window.__mount('ink-fallback');
 });
 const fallbackScene=page.locator('#ink-fallback .ib-scene');await expect(fallbackScene).toHaveAttribute('data-ready','true');await expect(fallbackScene).toHaveAttribute('data-renderer','canvas2d');
 await page.evaluate(()=>HTMLCanvasElement.prototype.getContext=window.__inkOriginalGetContext);
 await page.evaluate(()=>window.__update({duration:250},'ink-fallback'));await page.locator('#ink-fallback .ib-nav--next').click();await expect(fallbackScene).toHaveAttribute('data-index','1');
 await page.evaluate(()=>window.__unmount('ink-fallback'));await next.scrollIntoViewIfNeeded();
 await page.evaluate(()=>window.__update({reducedMotion:true,index:0}));await expect(scene).toHaveAttribute('data-index','0');
 const draws=await scene.getAttribute('data-draws');await page.waitForTimeout(180);assert.equal(await scene.getAttribute('data-draws'),draws,'idle carousel does not redraw continuously');
 await page.evaluate(()=>{window.__inkGLContexts=[document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('canvas').getContext('webgl')];});
}

export async function verifyInkSpreadCarouselDoc(page){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.ib-scene')).toHaveAttribute('data-ready','true');
 const outer=await iframe.boundingBox(),local=await frame.locator('.ib-photo').evaluate(n=>({box:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;
 await page.mouse.click(outer.x+(local.box.x+local.box.width*.28)*scale,outer.y+(local.box.y+local.box.height*.25)*scale);
 await expect(frame.locator('.ib-scene')).toHaveAttribute('data-index','1');
 await expect(page.locator('a[href="https://x.com/cabralorenzo"]')).toHaveText('作者 · Lorenzo Cabra');
 assert.equal(await page.locator('video').count(),0,'no original video is embedded');
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await iframe.scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const size=await frame.locator('.ib-nav--next').evaluate(n=>{const rect=n.getBoundingClientRect(),after=getComputedStyle(n,'::after'),scale=rect.width/n.offsetWidth;return{rect:rect.toJSON(),hitWidth:rect.width-(parseFloat(after.left)+parseFloat(after.right))*scale,viewport:innerWidth};}),box=await iframe.boundingBox(),scale=box.width/size.viewport;
  assert(size.hitWidth*scale>=24,'navigation touch targets remain at least 24 CSS pixels');
  const before=Number(await frame.locator('.ib-scene').getAttribute('data-index'));
  await page.mouse.click(box.x+(size.rect.left-2)*scale,box.y+(size.rect.top+size.rect.height/2)*scale);
  await expect(frame.locator('.ib-scene'),'the transparent edge really activates the arrow').toHaveAttribute('data-index',String((before+1)%4));
 }
}

export async function verifyInkSpreadPreviews(page,base,out){
 const href='/docs/animations/ink-spread-carousel';
 await page.goto(base+'/components',{waitUntil:'networkidle'});
 const card=page.locator(`li[data-component-card="${href}"]`),preview=card.locator('[data-motion-preview="ink-spread-carousel"]');
 await expect(card).toHaveCount(1);await card.hover();await expect(preview).toHaveAttribute('data-preview-state','playing');
 await expect(card.locator('[data-scene-ready="true"]')).toHaveCount(1);
 const live=card.frameLocator('iframe');await expect(live.locator('.ib-scene')).toHaveAttribute('data-ready','true');
 await expect(live.locator('.ib-scene')).toHaveCSS('background-color','rgb(244, 244, 244)');
 await expect(live.locator('.ib-scene')).toHaveAttribute('data-target','1');
 await page.screenshot({path:path.join(out,'ink-spread-carousel-gallery-live.png')});
 await page.mouse.move(900,20);await expect(card.locator('iframe')).toHaveCount(0);
 await page.goto(base+href,{waitUntil:'networkidle'});
 const link=page.locator(`aside a[href="${href}"]`),panel=page.locator(`[data-sidebar-preview="${href}"]`);
 await link.hover();await expect(panel).toBeVisible();
 await expect(panel.locator('[data-scene-ready="true"]')).toHaveCount(1);
 const box=await panel.boundingBox();assert.equal(Math.round(box.width),224,'sidebar uses the shared 224px preview shell');
 await expect(panel.frameLocator('iframe').locator('.ib-scene')).toHaveAttribute('data-target','1');
 await page.screenshot({path:path.join(out,'ink-spread-carousel-sidebar-live.png')});
 await page.mouse.move(1100,30);await expect(panel).toHaveCount(0);
 await link.focus();await expect(panel).toBeVisible();await page.keyboard.press('Tab');await expect(panel).toHaveCount(0);
}
