import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',slug='notes-text-color';
const out=path.resolve('outputs/heydamir-2106779932659470606');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(`${base}/docs/animations/${slug}`,{waitUntil:'networkidle'});
 const iframe=page.locator('section[aria-label=Demo] iframe'),frame=page.frameLocator('section[aria-label=Demo] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.nc-scene')).toHaveAttribute('data-ready','true');
 const click=async element=>{const outer=await iframe.boundingBox(),local=await element.evaluate(n=>({rect:[...n.getClientRects()].find(r=>r.width>0&&r.height>0).toJSON(),width:innerWidth})),scale=outer.width/local.width;await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);};
 await click(frame.locator('.nc-article p').nth(2).locator('[data-colored]'));
 await expect(frame.locator('.nc-scene')).toHaveAttribute('data-selection','Frame 2847');
 await page.waitForTimeout(250);await click(frame.locator('.nc-swatch[data-color=cyan]'));
 await expect(frame.locator('.nc-scene')).toHaveAttribute('data-color','#80e9e6');
 await expect(page.locator('a[href="https://x.com/heydamir"]')).toHaveText('作者 · Damir Sokolovsky');
 assert.equal(await page.locator('video').count(),0);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1100});await iframe.scrollIntoViewIfNeeded();await page.waitForTimeout(180);
  await page.locator('section[aria-label=Demo]').screenshot({path:path.join(out,`detail-open-${width}.png`)});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:1440,height:1100});
 const nav=page.locator(`aside a[href="/docs/animations/${slug}"]`).first();await nav.scrollIntoViewIfNeeded();await nav.hover();
 const floating=page.locator(`[data-sidebar-preview="/docs/animations/${slug}"]`);await expect(floating.locator('iframe')).toHaveCount(1);
 await expect(floating.frameLocator('iframe').locator('.nc-scene')).toHaveAttribute('data-open','true',{timeout:6000});
 await floating.screenshot({path:path.join(out,'sidebar-hover.png')});await page.mouse.move(1200,10);await expect(floating).toHaveCount(0);
 await page.goto(`${base}/components`,{waitUntil:'networkidle'});
 const card=page.locator('[data-preview-card]').filter({has:page.locator(`a[href="/docs/animations/${slug}"]`)});
 // Some card variants make the link itself the preview boundary.
 const target=await card.count()?card:page.locator(`a[data-preview-card][href="/docs/animations/${slug}"]`);
 await target.scrollIntoViewIfNeeded();await target.hover();
 await expect(target.locator('iframe')).toHaveCount(1);
 const preview=target.frameLocator('iframe');await expect(preview.locator('body')).toHaveAttribute('data-motion-ready','true');
 await expect(preview.locator('.nc-scene')).toHaveAttribute('data-open','true',{timeout:6000});
 await expect(preview.locator('.nc-scene')).toHaveAttribute('data-color','#80e9e6',{timeout:6000});
 await expect(preview.locator('.nc-scene')).toHaveCSS('background-color','rgb(244, 244, 244)');
 await target.screenshot({path:path.join(out,'gallery-hover.png')});
 await page.mouse.move(10,10);await expect(target.locator('iframe')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'docs-interaction-results.json'),JSON.stringify({standalonePalette:true,actualScaledClick:true,authorOnly:true,referenceVideo:false,responsive:[375,768,1440],sidebarReplay:true,sidebarReleased:true,galleryReplay:true,galleryReleased:true,pageErrors:errors},null,2));
 console.log('PASS Notes: actual scaled demo interaction, author, three viewports, gallery replay and release');
}catch(error){await page.screenshot({path:path.join(out,'docs-failure.png')});throw error;}finally{await browser.close();}
