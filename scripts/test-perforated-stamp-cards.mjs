import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {expect} from 'playwright/test';
import {STAMP_IMAGES} from '../src/lib/motion-core/perforated-stamp-cards-assets.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const pose=card=>card.locator('.stamp-wrap').evaluate(node=>node.style.transform);
const settle=root=>expect(root).toHaveAttribute('data-animating','false');

export async function verifyPerforatedStampCards(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#stampCards'),cards=scene.locator('.card-slot');
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-layout','row');
  await expect(root).toHaveAttribute('data-holes','108');await expect(root).toHaveAttribute('data-image-errors','0');
  for(let i=0;i<3;i++){
    const src=await cards.nth(i).locator('img').getAttribute('src');
    assert.equal(hash(Buffer.from(src.split(',')[1],'base64')),hash(Buffer.from(STAMP_IMAGES[i].src.split(',')[1],'base64')));
  }
  await expect(cards.nth(2).locator('.headline')).toHaveText('Taking care of the\nlittle things you forget.');
  const pixels=await sharp(await cards.first().locator('.stamp-card').screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>[...pixels.data.subarray((y*pixels.info.width+x)*4,(y*pixels.info.width+x)*4+3)];
  assert.deepEqual(pixel(14,1),[17,17,17],'the hole is transparent to the dark container');
  assert.deepEqual(pixel(8,1),[243,243,231],'the tooth retains the paper color');
  await page.waitForTimeout(100);const idle=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__motionFrames),idle,'resting cards schedule no RAF');

  const first=cards.first(),bounds=await first.boundingBox();
  await page.mouse.move(bounds.x+bounds.width*.2,bounds.y+bounds.height*.2);
  await expect(first).toHaveAttribute('data-engaged','true');await settle(root);
  assert((await pose(first)).includes('translateY(-6px)'));assert((await pose(first)).includes('scale(1.022)'));
  const upper=await pose(first);assert(/rotateX\(2\./.test(upper)&&/rotateY\(-2\./.test(upper));
  const sheen=await first.locator('.stamp-sheen').evaluate(node=>node.style.getPropertyValue('--mx'));
  assert(Math.abs(parseFloat(sheen)-20)<.5);
  const held=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.__motionFrames),held,'a settled hover does not keep the spring loop running');
  if(item.framework==='react')await root.screenshot({path:output+'/perforated-stamp-cards-native-hover.png'});
  await page.mouse.move(bounds.x+bounds.width*.8,bounds.y+bounds.height*.8);await settle(root);
  const lower=await pose(first);assert.notEqual(lower,upper);assert(/rotateX\(-2\./.test(lower)&&/rotateY\(2\./.test(lower));
  await page.mouse.move(2,2);await settle(root);assert.equal(await pose(first),'');

  await first.focus();await settle(root);assert((await pose(first)).includes('translateY(-5px)'));
  await first.press('ArrowRight');await expect(cards.nth(1)).toBeFocused();await settle(root);
  await expect(cards.nth(1)).toHaveCSS('outline-width','2px');
  await cards.nth(1).press('End');await expect(cards.nth(2)).toBeFocused();
  await cards.nth(2).press('Home');await expect(first).toBeFocused();
  await first.press('Escape');await settle(root);assert.equal(await pose(first),'');

  await first.focus();await expect(root).toHaveAttribute('data-animating','true');
  await page.evaluate(()=>window.__update({paused:true}));await expect(root).toHaveAttribute('data-paused','true');
  const frozen=await pose(first);await page.waitForTimeout(150);assert.equal(await pose(first),frozen);
  await page.evaluate(()=>window.__update({paused:false}));await expect(root).toHaveAttribute('data-paused','false');await settle(root);assert((await pose(first)).includes('translateY(-5px)'));
  await first.press('Escape');await settle(root);
  await first.focus();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=await pose(first);await page.waitForTimeout(120);assert.equal(await pose(first),hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await settle(root);
  await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(root).toHaveAttribute('data-reduced','true');
  assert.equal(await pose(first),'');await first.press('ArrowRight');await expect(cards.nth(1)).toBeFocused();assert.equal(await pose(cards.nth(1)),'');
  await page.waitForTimeout(80);const reducedFrames=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__motionFrames),reducedFrames);

  await page.evaluate(src=>window.__update({cards:[{headline:'Calm\nToday',body:'<b>Plain text</b>',imageSrc:src,imageAlt:'Custom landscape'}]}),STAMP_IMAGES[2].src);
  await expect(first.locator('.headline')).toHaveText('Calm\nToday');await expect(first.locator('.body-copy')).toHaveText('<b>Plain text</b>');
  await expect(first.locator('.body-copy b')).toHaveCount(0);await expect(first.locator('img')).toHaveAttribute('alt','Custom landscape');
  await expect(root).toHaveAttribute('data-ready','true');
  await page.evaluate(()=>window.__update({cards:[{imageSrc:'data:image/jpeg;base64,AA==',imageAlt:'Unavailable landscape'}]}));
  await expect(root).toHaveAttribute('data-image-errors','1');await expect(root).toHaveAttribute('data-ready','true');
  await expect(first.locator('img')).toHaveAttribute('alt','Unavailable landscape');
  await page.evaluate(()=>window.__update({cards:[],reducedMotion:false}));
  await expect(root).toHaveAttribute('data-image-errors','0');await expect(first.locator('.headline')).toHaveText('Your calm,\nPersonal co-pilot.');
  await cards.nth(1).press('Escape');await settle(root);

  await page.setViewportSize({width:375,height:1000});await expect(root).toHaveAttribute('data-layout','stack');
  const stacked=await cards.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().toJSON()));
  assert(stacked.every(rect=>Math.abs(rect.width-246)<.1&&Math.abs(rect.height-406)<.1&&rect.left>=0&&rect.right<=375));
  assert(Math.abs(stacked[1].top-stacked[0].bottom-32)<.1&&Math.abs(stacked[2].top-stacked[1].bottom-32)<.1);
  await cards.nth(1).tap();await expect(cards.nth(1)).toBeFocused();await settle(root);assert((await pose(cards.nth(1))).includes('translateY(-5px)'));
  await cards.nth(1).press('Escape');await settle(root);
  if(item.framework==='react')for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});await expect(root).toHaveAttribute('data-layout',width<=560?'stack':'row');
    await root.screenshot({path:`${output}/perforated-stamp-cards-native-ready-${width}.png`});
  }
  await page.setViewportSize({width:1200,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await expect(root).toHaveAttribute('data-layout','row');
  await page.evaluate(()=>window.__update({height:620}));await expect.poll(()=>root.evaluate(node=>node.clientHeight)).toBe(620);
}

export async function verifyPerforatedStampCardsPreviews(page,base){
  const href='/docs/animations/perforated-stamp-cards';
  await page.goto(base+'/components?category=cards',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#stampCards');
  await expect(root).toHaveAttribute('data-theme','light');await expect(root).toHaveAttribute('data-layout','row');
  await expect.poll(()=>root.getAttribute('data-preview-time').then(Number)).toBeGreaterThan(200);
  await expect(root.locator('.card-slot[data-engaged=true] .stamp-wrap')).not.toHaveAttribute('style','');
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/devxnuj"]')).toHaveText('作者 · @devxnuj');assert.equal(await page.locator('video').count(),0);
  await page.setViewportSize({width:375,height:1000});
  const demo=page.frameLocator('section[aria-label="Demo"] iframe');
  await expect(demo.locator('#stampCards')).toHaveAttribute('data-layout','stack');
  await demo.locator('.card-slot').nth(2).scrollIntoViewIfNeeded();
  await expect(demo.locator('.card-slot').nth(2)).toBeInViewport({ratio:.9});
  assert(await demo.locator('body').evaluate(node=>node.ownerDocument.defaultView.scrollY>500),'all three stacked cards can be reached in the detail iframe');
  await page.setViewportSize({width:1440,height:1000});await expect(demo.locator('#stampCards')).toHaveAttribute('data-layout','row');

  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect.poll(()=>popup.frameLocator('iframe').locator('#stampCards').getAttribute('data-preview-time').then(Number)).toBeGreaterThan(200);
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();await link.blur();await expect(popup).toHaveCount(0);
}
