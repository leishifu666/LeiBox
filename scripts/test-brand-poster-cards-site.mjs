import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';
import {BRAND_POSTER_COPY} from '../src/data/brand-poster-cards.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:3001',slug='brand-poster-cards',out=path.resolve('outputs/brand-poster-cards');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'no-preference'});
try{
 await page.goto(`${base}/docs/animations/${slug}`,{waitUntil:'networkidle'});
 const iframe=page.locator('section[aria-label=Demo] iframe'),frame=page.frameLocator('section[aria-label=Demo] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.bp-scene')).toHaveAttribute('data-ready','true');
 assert.equal(await frame.locator('.bp-photo').count(),3);for(let i=0;i<3;i++)await expect(frame.locator('.bp-copy').nth(i)).toHaveText(BRAND_POSTER_COPY);
 assert(!/[\u3400-\u9fff]/.test(await frame.locator('.bp-copy').first().textContent()),'the poster keeps the reference English language');
 await expect(page.getByText('用户提供截图，作者未知',{exact:false})).toBeVisible();assert.equal(await page.locator('video').count(),0);
 const foreground=()=>frame.locator('.bp-logo,.bp-symbol,.bp-copy').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})),fixed=await foreground();
 const outer=await iframe.boundingBox(),local=await frame.locator('.bp-card').first().evaluate(n=>({box:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;
 await page.mouse.move(outer.x+(local.box.x+local.box.width/2)*scale,outer.y+(local.box.y+local.box.height/2)*scale);
 await expect(frame.locator('.bp-card').first()).toHaveAttribute('data-active','true');
 await expect.poll(()=>frame.locator('.bp-photo').first().evaluate(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).a)).toBe(1.035);assert.deepEqual(await foreground(),fixed);
 await page.mouse.move(10,10);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await iframe.scrollIntoViewIfNeeded();await page.waitForTimeout(600);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('section[aria-label=Demo]').screenshot({path:path.join(out,`detail-${width}.png`)});
 }
 await page.setViewportSize({width:1440,height:1000});const nav=page.locator(`aside a[href="/docs/animations/${slug}"]`).first();await nav.scrollIntoViewIfNeeded();await nav.hover();
 const floating=page.locator(`[data-sidebar-preview="/docs/animations/${slug}"]`);await expect(floating.locator('iframe')).toHaveCount(1);
 await expect(floating.frameLocator('iframe').locator('.bp-card[data-active=true]')).toHaveCount(1);await floating.screenshot({path:path.join(out,'sidebar-hover.png')});
 await page.mouse.move(1200,10);await expect(floating).toHaveCount(0);
 await page.goto(`${base}/components`,{waitUntil:'networkidle'});
 const card=page.locator('[data-preview-card]').filter({has:page.locator(`a[href="/docs/animations/${slug}"]`)}),target=await card.count()?card:page.locator(`a[data-preview-card][href="/docs/animations/${slug}"]`);
 await target.scrollIntoViewIfNeeded();await target.hover();await expect(target.locator('iframe')).toHaveCount(1);
 const preview=target.frameLocator('iframe');await expect(preview.locator('body')).toHaveAttribute('data-motion-ready','true');await expect(preview.locator('.bp-card[data-active=true]')).toHaveCount(1);
 await expect(preview.locator('.bp-scene')).toHaveCSS('background-color','rgb(244, 244, 244)');
 await target.screenshot({path:path.join(out,'gallery-hover.png')});await page.mouse.move(10,10);await expect(target.locator('iframe')).toHaveCount(0);
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'site-results.json'),JSON.stringify({englishCopy:true,threeUserPortraits:true,existingLeiBoxLogo:true,fixedForeground:true,responsive:[375,768,1440],unknownAuthorDisclosed:true,sidebar:true,galleryReplayAndRelease:true,pageErrors:errors},null,2));
 console.log('PASS Brand Poster Cards: English copy, scaled interaction, three viewports, sidebar and gallery');
}catch(error){await page.screenshot({path:path.join(out,'site-failure.png')});throw error;}finally{await browser.close();}
