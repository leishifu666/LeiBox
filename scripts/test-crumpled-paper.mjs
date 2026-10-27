import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';
export async function verifyCrumpledPaper(page,item,rootPath,outputPath){
 const root=page.locator('.crumple-demo'),canvas=page.locator('.cp-canvas'),buttons=page.locator('.cp-hit');
 await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.crumple-demo').dataset.motionReady==='true');
 assert.equal(await root.getAttribute('data-renderer'),'webgl');assert.equal(await buttons.count(),3);
 await canvas.evaluate(n=>{window.__crumpleGL=[n.getContext('webgl')];});
 if(item.framework==='react'){
  await page.evaluate(()=>window.__update({height:900}));await page.mouse.move(1,1);
  await root.evaluate(n=>n.style.background='#f4f4f4');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('[data-motion-surface]').screenshot({path:path.join(rootPath,'public/assets/components/crumpled-paper.png')});
  await root.evaluate(n=>n.style.background='');await page.evaluate(()=>window.__update({height:800}));
 }
 const closed=await canvas.evaluate(n=>n.toDataURL());
 await buttons.nth(0).hover();await page.waitForFunction(()=>+document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.cp-hit').dataset.progress>.9999);
 assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),closed,'actual textured mesh changes pixels');
 if(item.framework==='react')await root.screenshot({path:path.join(outputPath,'crumpled-paper-letter.png')});
 await buttons.nth(1).hover();await page.waitForFunction(()=>+document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelectorAll('.cp-hit')[1].dataset.progress>.9999);
 assert.equal(await buttons.nth(0).getAttribute('aria-expanded'),'false');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'true');
 await page.mouse.move(1,1);await page.waitForFunction(()=>[...document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelectorAll('.cp-hit')].every(n=>+n.dataset.progress===0));
 await buttons.nth(0).hover();await page.waitForTimeout(90);
 assert((await buttons.nth(0).evaluate(n=>+n.dataset.progress))>0&&(await buttons.nth(0).evaluate(n=>+n.dataset.progress))<1,'intermediate geometry exists');
 await page.mouse.move(1,1);await page.waitForFunction(()=>+document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.cp-hit').dataset.progress===0);
 await buttons.nth(2).focus();await buttons.nth(2).press('ArrowLeft');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'true');
 await buttons.nth(1).press('Space');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'false');
 await buttons.nth(1).press('Enter');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'true');
 await buttons.nth(1).press('Escape');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'false');
 await page.emulateMedia({reducedMotion:'reduce'});await buttons.nth(0).focus();assert.equal(await buttons.nth(0).getAttribute('data-progress'),'1.0000');await buttons.nth(0).press('Space');assert.equal(await buttons.nth(0).getAttribute('data-progress'),'0.0000');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(page.locator('#demo [data-motion-surface]')).toHaveAttribute('data-reduced-motion','true');await buttons.nth(2).focus();assert.equal(await buttons.nth(2).getAttribute('data-progress'),'1.0000');await buttons.nth(2).press('Escape');await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(page.locator('#demo [data-motion-surface]')).toHaveAttribute('data-reduced-motion','false');
}
export async function verifyCrumpledPaperDoc(page,outputPath){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.crumple-demo')).toHaveAttribute('data-motion-ready','true');
 const first=frame.locator('.cp-hit').first(),outer=await iframe.boundingBox(),local=await first.evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;
 await page.mouse.move(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);
 await expect(first).toHaveAttribute('aria-expanded','true');await expect.poll(()=>first.evaluate(n=>+n.dataset.progress)).toBe(1);
 await page.screenshot({path:path.join(outputPath,'crumpled-paper-open.png')});
 await page.mouse.move(outer.x+outer.width*.5,outer.y+20,{steps:8});await expect(first).toHaveAttribute('aria-expanded','false');await expect.poll(()=>first.evaluate(n=>+n.dataset.progress)).toBe(0);
 await expect(page.locator('a[href="https://x.com/Matthias_Oel"]')).toHaveText('作者 · Matt');
 assert.equal(await page.locator('video,a[href$=".mp4"]').count(),0,'no reference video is displayed or downloadable');
 await page.locator('nav a[href="/docs/animations/crumpled-paper"]').hover();
 const preview=page.locator('[data-sidebar-preview="/docs/animations/crumpled-paper"]');
 await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);await expect(preview.locator('iframe')).toHaveCount(1);
 const previewFrame=preview.frameLocator('iframe');
 await expect.poll(()=>previewFrame.locator('.cp-hit').first().getAttribute('aria-expanded')).toBe('true');
 await page.screenshot({path:path.join(outputPath,'crumpled-paper-sidebar-preview.png')});
 await page.mouse.move(1380,20);await expect(preview).toHaveCount(0);
 console.log('PASS DOC crumpled-paper: hover mesh, close, author, sidebar motion and release');
}
