import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

async function artworkPoint(scene,index,offset=0){
  const canvas=await scene.locator('canvas').boundingBox();
  const caption=await scene.locator('.art-caption').nth(index).boundingBox();
  return {x:caption.x+caption.width/2+offset,y:canvas.y+canvas.height*.52};
}

export async function verifyHangingArtGallery(page,item,output){
  const scene=page.locator('#demo');
  const gallery=scene.locator('#gallery-scene');
  const canvas=scene.locator('canvas');
  const captions=scene.locator('.art-caption');
  await expect(gallery).toHaveAttribute('data-ready','true');
  await expect(gallery).toHaveAttribute('data-renderer','webgl');
  await expect(gallery).toHaveAttribute('data-active','2');
  await expect(captions.nth(2)).toHaveAttribute('aria-hidden','false');
  assert.equal(await captions.count(),5);
  assert(await captions.evaluateAll(nodes=>nodes.every(node=>Math.abs(Number(node.dataset.swing))<.02)),
    'initial loading and viewport changes keep the subtle idle sway below 0.02 radians');
  await page.evaluate(()=>{
    window.__galleryChanges=[];
    window.__update({onActiveChange:index=>window.__galleryChanges.push(index)});
  });
  const initial=await artworkPoint(scene,1);
  await page.mouse.move(initial.x,initial.y);
  await expect(gallery).toHaveAttribute('data-active','1');
  await expect.poll(()=>captions.nth(1).getAttribute('data-rotation').then(Number)).toBeLessThan(2.8);
  assert(Number(await captions.nth(1).getAttribute('data-rotation'))>0,'raycast selection runs the actual 3D rotation');
  await expect(captions.nth(1)).toHaveAttribute('aria-hidden','false');
  if(item.framework==='react')await page.screenshot({path:output+'/hanging-art-gallery-native-turning.png'});
  await page.waitForTimeout(800);
  const left=await artworkPoint(scene,1,-20);await page.mouse.move(left.x,left.y);
  await page.waitForTimeout(650);
  const leftTilt=Number(await captions.nth(1).getAttribute('data-rotation'));
  const right=await artworkPoint(scene,1,20);await page.mouse.move(right.x,right.y);
  await page.waitForTimeout(650);
  const rightTilt=Number(await captions.nth(1).getAttribute('data-rotation'));
  assert(rightTilt-leftTilt>.025,'local hit positions produce different real Y tilts');
  await canvas.focus();
  await canvas.press('ArrowRight');await expect(gallery).toHaveAttribute('data-active','2');
  await canvas.press('End');await expect(gallery).toHaveAttribute('data-active','4');
  await canvas.press('Home');await expect(gallery).toHaveAttribute('data-active','0');
  await canvas.blur();await page.mouse.move(1,900);
  await page.keyboard.press('ArrowRight');await expect(gallery).toHaveAttribute('data-active','0');
  const count=await page.evaluate(()=>window.__galleryChanges.length);

  await page.evaluate(()=>window.__update({active:3,reducedMotion:true}));
  await expect(gallery).toHaveAttribute('data-active','3');
  await expect(captions.nth(3)).toHaveAttribute('data-rotation','0.0000');
  await expect(captions.nth(2)).toHaveAttribute('data-rotation','3.1416');
  assert.equal(await page.evaluate(()=>window.__galleryChanges.length),count,'external active updates do not emit input callbacks');
  await canvas.focus();await page.keyboard.press('Tab');
  await expect(scene.locator('.sr-controls')).toHaveCSS('opacity','1');
  await scene.locator('.sr-controls button').first().press('Enter');
  await expect(gallery).toHaveAttribute('data-active','0');
  await canvas.blur();await scene.locator('.sr-controls button').first().blur();
  await page.setViewportSize({width:375,height:1000});
  const target=await artworkPoint(scene,4);await page.touchscreen.tap(target.x,target.y);
  await expect(gallery).toHaveAttribute('data-active','4');
  const label=await captions.nth(4).boundingBox();
  assert(label.x>=7&&label.x+label.width<=368,'edge captions stay inside the narrow container');
  await page.setViewportSize({width:1200,height:1000});
  await page.mouse.move(1,900);
  await page.evaluate(()=>window.__update({active:1,reducedMotion:false,idleMotion:false}));
  await expect.poll(async()=>{
    const before=await page.evaluate(()=>window.__motionFrames);
    await page.waitForTimeout(250);
    return await page.evaluate(()=>window.__motionFrames)===before;
  },{timeout:9000}).toBe(true);

  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__galleryNoGL=true;window.__mount();});
    await expect(gallery).toHaveAttribute('data-renderer','fallback');
    await scene.locator('.gallery-fallback button').nth(3).click();
    await expect(gallery).toHaveAttribute('data-active','3');
    await expect(scene.locator('.gallery-fallback-caption')).toHaveText('Vincent van Gogh · 1889');
    await scene.locator('.gallery-fallback button').nth(3).press('Home');
    await expect(gallery).toHaveAttribute('data-active','0');
    await page.evaluate(async()=>{await window.__unmount();window.__galleryNoGL=false;window.__mount();});
    await expect(gallery).toHaveAttribute('data-ready','true');
    await expect(gallery).toHaveAttribute('data-renderer','webgl');
  }
}

export async function verifyHangingArtGalleryPreviews(page,base){
  const href='/docs/animations/hanging-art-gallery';
  await page.goto(base+'/components?category=galleries',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const gallery=card.frameLocator('iframe').locator('#gallery-scene');
  await expect(gallery).toHaveAttribute('data-ready','true');
  await expect(gallery).toHaveAttribute('data-active','1',{timeout:7000});
  await expect(gallery).toHaveAttribute('data-active','0',{timeout:5000});
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/gabriell_lab"]')).toHaveText('作者 · @gabriell_lab');
  assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`);
  const popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect(popup.frameLocator('iframe').locator('#gallery-scene')).toHaveAttribute('data-active','1',{timeout:7000});
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
