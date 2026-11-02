import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000',href='/docs/animations/particle-texture-trio',out='outputs/anushka-20261102/site';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(base+href,{waitUntil:'networkidle'});await expect(page.getByRole('heading',{level:1})).toHaveText('粒子纹理三联');
 const iframe=page.locator('section[aria-label=Demo] iframe'),frame=page.frameLocator('section[aria-label=Demo] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.pt-scene')).toHaveAttribute('data-ready','true');
 const outer=await iframe.boundingBox(),local=await frame.locator('.pt-target').first().evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;
 await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);await expect(frame.locator('.pt-scene')).toHaveAttribute('data-paused','true');
 await expect(page.locator('a[href="https://x.com/anushka_dzn"]')).toHaveText('作者 · Anushka');assert.equal(await page.locator('video').count(),0);
 for(const width of[375,768,1440]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/detail-${width}.png`});}
 const link=page.locator(`aside a[href="${href}"]`).first();await link.hover();const preview=page.locator(`[data-sidebar-preview="${href}"]`);await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);
 const floating=preview.frameLocator('iframe');const first=await floating.locator('.pt-scene').getAttribute('data-time');await expect.poll(()=>floating.locator('.pt-scene').getAttribute('data-time')).not.toBe(first);
 assert.deepEqual(await floating.locator('canvas').evaluate(c=>[...c.getContext('2d').getImageData(0,0,1,1).data]),[244,244,244,255]);
 await expect.poll(()=>floating.locator('canvas').evaluate(c=>c.width)).toBeLessThanOrEqual(480);
 await page.screenshot({path:`${out}/sidebar.png`});await page.mouse.move(1430,2);await expect(preview).toHaveCount(0);
 await link.focus();await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);await link.blur();await expect(preview).toHaveCount(0);
 await page.goto(base+'/components',{waitUntil:'networkidle'});const card=page.locator(`[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
 assert.equal(await page.locator('[data-preview-state=playing]').count(),1);await page.screenshot({path:`${out}/gallery.png`});await page.mouse.move(1,1);await expect(card.locator('iframe')).toHaveCount(0);
 const catalog=await(await page.request.get(base+'/ai/catalog.json')).json();assert(catalog.items.some(item=>item.slug==='particle-texture-trio'));
 const pack=await(await page.request.get(base+'/ai/packages/particle-texture-trio/react.json')).json();assert.equal(pack.files.length,4);assert(pack.files.some(f=>f.content.includes('drawParticleTextures')));assert.deepEqual(errors,[]);
 const touch=await browser.newPage({viewport:{width:375,height:700},hasTouch:true,isMobile:true});
 await touch.goto(base+'/motion/particle-texture-trio.html');await touch.locator('.pt-target').first().tap();await expect(touch.locator('.pt-scene')).toHaveAttribute('data-paused','true');
 await touch.locator('.pt-target').first().tap();await expect(touch.locator('.pt-scene')).toHaveAttribute('data-paused','false');await touch.close();
 console.log({detail:true,realClick:true,touch:true,author:true,widths:[375,768,1440],sidebarHover:true,sidebarFocus:true,grayFirstFrame:true,gallery:true,sourcePackage:true,pageErrors:errors});
}finally{await browser.close();}
