import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect} from 'playwright/test';
import {BRAND_POSTER_COPY} from '../src/data/brand-poster-cards.mjs';

export async function verifyBrandPosterCards(page,item,project,out){
 await page.emulateMedia({reducedMotion:'no-preference'});
 const scene=page.locator('#demo .bp-scene'),cards=page.locator('#demo .bp-card'),photos=page.locator('#demo .bp-photo');
 await expect(scene).toHaveAttribute('data-ready','true');assert.equal(await cards.count(),3);
 const original=await photos.evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),alt:n.alt})));
 for(const [index,file] of ['clear-glasses.webp','blue-scarf.webp','light-trails.webp'].entries()){
  const expected=(await fs.readFile(path.join(project,'src/lib/BrandPosterCards/assets',file))).toString('base64');
  assert.equal(original[index].src,`data:image/webp;base64,${expected}`,'the supplied portraits are embedded, in the requested order');
 }
 const logo=`data:image/svg+xml;base64,${(await fs.readFile(path.join(project,'public/leibox-logo.svg'))).toString('base64')}`;
 const symbol=`data:image/svg+xml;base64,${(await fs.readFile(path.join(project,'public/logo-icon.svg'))).toString('base64')}`;
 for(let i=0;i<3;i++){
  await expect(cards.nth(i).locator('.bp-copy')).toHaveText(BRAND_POSTER_COPY);
  assert(!/[\u3400-\u9fff]/.test(await cards.nth(i).locator('.bp-copy').textContent()),'poster body copy retains the reference English language');
  assert.equal(await cards.nth(i).locator('.bp-logo').getAttribute('src'),logo,'reuse the existing vector wordmark byte-for-byte');
  assert.equal(await cards.nth(i).locator('.bp-symbol').getAttribute('src'),symbol);
  const box=await cards.nth(i).boundingBox();assert(Math.abs(box.x-(200+i*286.666667))<.2);assert(Math.abs(box.width/box.height-.5915)<.001);
  await expect(photos.nth(i)).toHaveAttribute('data-state','ready');
 }
 const positions=()=>page.locator('#demo .bp-logo,#demo .bp-symbol,#demo .bp-copy').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));
 const scale=index=>photos.nth(index).evaluate(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).a);
 const foreground=await positions();
 if(item.framework==='react'){
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(out,'brand-poster-cards-reference-layout.png')});
  await page.locator('#demo [data-motion-surface]').evaluate(node=>{const style=document.createElement('style');style.className='bp-gallery-test';style.textContent='.bp-scene{background:#f4f4f4!important}';node.shadowRoot.append(style);});
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(project,'public/assets/components/brand-poster-cards.png')});
  await page.locator('#demo [data-motion-surface]').evaluate(node=>node.shadowRoot.querySelector('.bp-gallery-test').remove());
 }
 await cards.first().hover();await page.waitForTimeout(90);
 const middle=await scale(0);assert(middle>1&&middle<1.0351,'real photo zoom advances through an intermediate frame');assert.deepEqual(await positions(),foreground,'brand mark and copy remain fixed');
 await expect.poll(()=>scale(0)).toBe(1.035);assert.deepEqual(await positions(),foreground);
 await page.mouse.move(10,10);await expect.poll(()=>scale(0)).toBe(1);
 await cards.nth(1).focus();await cards.nth(1).press('Enter');await expect(cards.nth(1)).toHaveAttribute('aria-pressed','true');
 await cards.nth(1).press('ArrowRight');await expect(cards.nth(2)).toBeFocused();await cards.nth(2).press('Home');await expect(cards.first()).toBeFocused();await cards.first().press('End');await expect(cards.nth(2)).toBeFocused();
 await cards.nth(2).press('Escape');await expect(scene).toHaveAttribute('data-selected','-1');
 await cards.nth(2).tap();await expect(scene).toHaveAttribute('data-selected','2');await expect(cards.nth(1)).toHaveAttribute('aria-pressed','false');
 await page.evaluate(()=>window.__update({reducedMotion:true}));for(let i=0;i<3;i++)await expect.poll(()=>scale(i)).toBe(1);
 const customCopy='A collection of interfaces worth keeping.';
 await page.evaluate(({images,description,logo,symbol})=>window.__update({images,description,logoSrc:logo,symbolSrc:symbol}),{images:[original[2],original[0],original[1]],description:customCopy,logo:symbol,symbol:logo});
 await expect(cards.first().locator('.bp-copy')).toHaveText(customCopy);await expect(scene).toHaveAttribute('data-ready','true');assert.equal(await photos.first().getAttribute('src'),original[2].src);assert.equal(await cards.first().locator('.bp-logo').getAttribute('src'),symbol);
 await page.evaluate(images=>window.__update({images:[{src:'data:image/png;base64,AA==',alt:'Image failure demonstration'},images[1],images[2]]}),original);
 await expect(photos.first()).toHaveAttribute('data-state','error');await expect(scene).toHaveAttribute('data-ready','true');await expect(cards.first().locator('.bp-copy')).toBeVisible();assert(Math.abs((await cards.first().boundingBox()).width-226.666667)<.2);
 await page.evaluate(()=>window.__update({images:undefined,description:undefined,logoSrc:undefined,symbolSrc:undefined,reducedMotion:false}));await expect(scene).toHaveAttribute('data-ready','true');await expect(cards.first().locator('.bp-copy')).toHaveText(BRAND_POSTER_COPY);
 await cards.nth(2).press('Escape');await page.mouse.move(10,10);
 await page.evaluate(()=>window.__mount('brand-other'));await page.locator('#brand-other .bp-scene[data-ready=true]').waitFor();
 await page.locator('#brand-other .bp-card').first().press('Enter');await expect(page.locator('#brand-other .bp-scene')).toHaveAttribute('data-selected','0');await expect(scene).toHaveAttribute('data-selected','-1');
 await page.evaluate(()=>window.__unmount('brand-other'));
}
