import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {expect} from 'playwright/test';
import {PORTRAIT_SRC} from '../src/lib/motion-core/image-dust-disintegration-assets.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const dustPixels=canvas=>canvas.evaluate(node=>{
  const pixels=node.getContext('2d').getImageData(0,0,node.width,node.height).data;
  let opaque=0,colorful=0,checksum=2166136261;
  for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]){opaque++;if(Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>20)colorful++;}checksum=Math.imul(checksum^pixels[i+3],16777619);}
  return {opaque,colorful,checksum};
});

export async function verifyImageDustDisintegration(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#imageDustDisintegration');
  const card=scene.locator('#card'),like=scene.locator('#btnLike'),remove=scene.locator('#btnDelete');
  const restore=scene.locator('#btnRestore'),dust=scene.locator('#dustCanvas');
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl');
  await page.evaluate(()=>{
    window.__dustChanges={phase:[],liked:[],downloads:0};
    window.__update({phase:'loading',onPhaseChange:value=>window.__dustChanges.phase.push(value),onLikeChange:value=>window.__dustChanges.liked.push(value)});
  });
  await expect(root).toHaveAttribute('data-phase','loading');
  assert(await card.evaluate(node=>node.inert));await expect(remove).toBeDisabled();
  await expect.poll(()=>page.evaluate(()=>new Set(window.__dustSamples.auroraCanvas).size)).toBeGreaterThan(2);
  if(item.framework==='react')await page.screenshot({path:output+'/image-dust-disintegration-native-aurora.png'});
  await expect(root).toHaveAttribute('data-phase','revealing',{timeout:12000});
  await expect.poll(()=>page.evaluate(()=>new Set(window.__dustSamples.revealCanvas).size)).toBeGreaterThan(2);
  if(item.framework==='react')await page.screenshot({path:output+'/image-dust-disintegration-native-focus.png'});
  await expect(root).toHaveAttribute('data-phase','ready');
  assert.deepEqual(await page.evaluate(()=>window.__dustChanges.phase),['revealing','ready']);
  assert.equal(await scene.locator('#cardPhoto').evaluate(node=>node.naturalWidth),720);
  await card.press('Enter');await expect(like).toBeFocused();
  await like.press('Enter');await expect(like).toHaveAttribute('aria-pressed','true');
  await like.press('End');await expect(remove).toBeFocused();
  await remove.press('Home');await expect(like).toBeFocused();
  await like.press('ArrowDown');await expect(scene.locator('#btnRegenerate')).toBeFocused();
  await scene.locator('#btnRegenerate').press('Escape');await expect(card).toBeFocused();
  assert.deepEqual(await page.evaluate(()=>window.__dustChanges.liked),[true]);
  await card.hover();
  const downloading=page.waitForEvent('download');await scene.locator('#btnDownload').click();
  const download=await downloading;assert.equal(download.suggestedFilename(),'portrait.jpg');
  const downloaded=await fs.readFile(await download.path());
  assert.equal(hash(downloaded),hash(Buffer.from(PORTRAIT_SRC.split(',')[1],'base64')),'download retains the embedded photograph bytes');

  await remove.click();await expect(root).toHaveAttribute('data-phase','dusting');
  assert(Number(await root.getAttribute('data-particles'))>30000);
  const first=await dustPixels(dust);assert(first.opaque>50000&&first.colorful>10000,'original photo colors and attached pixels remain visible');
  await page.waitForTimeout(650);const next=await dustPixels(dust);assert.notEqual(next.checksum,first.checksum,'the image really disintegrates over time');
  if(item.framework==='react')await page.screenshot({path:output+'/image-dust-disintegration-native-dust.png'});
  await expect(root).toHaveAttribute('data-phase','gone');await expect(restore).toBeFocused();
  assert.equal((await dustPixels(dust)).opaque,0);assert.equal(await root.getAttribute('data-particles'),'0');
  await restore.press('Enter');await expect(root).toHaveAttribute('data-phase','loading');
  await page.evaluate(()=>window.__update({paused:true}));await expect(root).toHaveAttribute('data-paused','true');
  await page.waitForTimeout(50);const time=await root.getAttribute('data-time');
  await page.waitForTimeout(180);assert.equal(await root.getAttribute('data-time'),time);
  assert.equal(await scene.locator('.loader-status').evaluate(node=>node.getAnimations()[0].playState),'paused');
  await page.evaluate(()=>window.__update({paused:false,reducedMotion:true}));
  await expect(root).toHaveAttribute('data-phase','ready');await expect(card).toBeFocused();
  await card.press('Enter');await like.press('End');await remove.press('Enter');
  await expect(root).toHaveAttribute('data-phase','gone');await expect(restore).toBeFocused();
  await page.waitForTimeout(60);const frames=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__motionFrames),frames,'reduced motion has no animation loop');
  await page.evaluate(()=>window.__update({reducedMotion:false,phase:'loading'}));
  await expect(root).toHaveAttribute('data-phase','loading');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenTime=await root.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await root.getAttribute('data-time'),hiddenTime);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(hiddenTime));

  await page.evaluate(()=>window.__update({phase:'ready',liked:false,onDownload:()=>window.__dustChanges.downloads++}));
  await expect(like).toHaveAttribute('aria-pressed','false');assert.deepEqual(await page.evaluate(()=>window.__dustChanges.liked),[true]);
  await card.hover();await scene.locator('#btnDownload').click();assert.equal(await page.evaluate(()=>window.__dustChanges.downloads),1);
  await remove.click();await expect(root).toHaveAttribute('data-phase','dusting');
  await page.evaluate(()=>window.__update({phase:'ready'}));await expect(root).toHaveAttribute('data-phase','ready');
  assert.equal((await dustPixels(dust)).opaque,0,'external interruption clears all particles');
  await page.setViewportSize({width:375,height:1000});
  await expect.poll(async()=>{const r=await card.boundingBox();return r.x>=0&&r.x+r.width<=375&&Math.abs(r.width/r.height-900/1184)<.005;}).toBe(true);
  await card.tap();await like.tap();await expect(like).toHaveAttribute('aria-pressed','true');
  if(item.framework==='react')for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});await card.hover();await page.screenshot({path:`${output}/image-dust-disintegration-native-ready-${width}.png`});
  }
  await page.setViewportSize({width:1200,height:1000});
  await card.hover();await remove.click();await expect(root).toHaveAttribute('data-phase','dusting');
  await page.evaluate(()=>window.__update({height:560}));await expect(root).toHaveAttribute('data-phase','gone');

  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__dustNoGL=true;window.__mount();});
    await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','fallback');
    await expect(root).toHaveAttribute('data-phase','ready',{timeout:12000});
    await card.hover();await remove.click();await expect(root).toHaveAttribute('data-phase','dusting');
    assert((await dustPixels(dust)).colorful>10000);
    await page.evaluate(async()=>{await window.__unmount();window.__dustNoGL=false;window.__mount();});
    await expect(root).toHaveAttribute('data-renderer','webgl');
  }
}

export async function verifyImageDustDisintegrationPreviews(page,base){
  const href='/docs/animations/image-dust-disintegration';
  await page.goto(base+'/components?category=cards',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#imageDustDisintegration');
  await expect(root).toHaveAttribute('data-phase','dusting');
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(300);
  await expect(root).toHaveAttribute('data-phase','gone');
  await expect(root).toHaveAttribute('data-phase','loading');
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/Irakkkl"]')).toHaveText('作者 · @Irakkkl');assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect(popup.frameLocator('iframe').locator('#imageDustDisintegration')).toHaveAttribute('data-phase','dusting');
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
