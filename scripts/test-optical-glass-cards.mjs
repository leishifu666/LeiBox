import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

const pixels=canvas=>canvas.evaluate(node=>{
  const gl=node.getContext(node.dataset.renderer),data=new Uint8Array(node.width*node.height*4);
  gl.readPixels(0,0,node.width,node.height,gl.RGBA,gl.UNSIGNED_BYTE,data);
  let hash=2166136261;for(let i=0;i<data.length;i+=97)hash=Math.imul(hash^data[i],16777619);
  return hash>>>0;
});

export async function verifyOpticalGlassCards(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#opticalGallery');
  const canvases=scene.locator('canvas'),open=scene.locator('button[data-open]'),close=scene.locator('button[data-close]'),layers=scene.locator('.card__overlay');
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl2');
  await expect(root).toHaveAttribute('data-open','none');assert(await layers.first().evaluate(node=>node.inert));await expect(close.first()).toBeHidden();
  const first=await Promise.all([pixels(canvases.first()),pixels(canvases.nth(1))]);await page.waitForTimeout(250);
  for(let i=0;i<2;i++)assert.notEqual(await pixels(canvases.nth(i)),first[i],'both procedural 3D scenes change their actual pixels');
  await page.evaluate(()=>{window.__opticalChanges=[];window.__update({paused:true,time:1.25,onOpenChange:ids=>window.__opticalChanges.push(ids)});});
  await expect(root).toHaveAttribute('data-paused','true');await expect(root).toHaveAttribute('data-time','1.250');
  const frozen=await Promise.all([pixels(canvases.first()),pixels(canvases.nth(1))]);await page.waitForTimeout(150);
  for(let i=0;i<2;i++)assert.equal(await pixels(canvases.nth(i)),frozen[i]);
  await canvases.nth(1).evaluate(node=>{
    const gl=node.getContext(node.dataset.renderer),data=new Uint8Array(node.width*node.height*4);gl.readPixels(0,0,node.width,node.height,gl.RGBA,gl.UNSIGNED_BYTE,data);node.__cycleReference=data;
  });
  await page.evaluate(()=>window.__update({time:9.25}));await expect(root).toHaveAttribute('data-time','9.250');
  const cycle=await canvases.nth(1).evaluate(node=>{
    const gl=node.getContext(node.dataset.renderer),data=new Uint8Array(node.width*node.height*4);gl.readPixels(0,0,node.width,node.height,gl.RGBA,gl.UNSIGNED_BYTE,data);
    let sum=0;for(let i=0;i<data.length;i++)sum+=Math.abs(data[i]-node.__cycleReference[i]);return sum/data.length;
  });assert(cycle<.5,'the optical ring returns to its 8-second loop phase');
  await page.evaluate(()=>window.__update({time:1.25}));await expect(root).toHaveAttribute('data-time','1.250');
  await open.first().press('Enter');await expect(root).toHaveAttribute('data-open','ai');await expect(close.first()).toBeFocused();
  assert(await scene.locator('#card-ai .card__content').evaluate(node=>node.inert));
  await close.first().press('Escape');await expect(open.first()).toBeFocused();await expect(root).toHaveAttribute('data-open','none');
  await open.nth(1).press('Enter');await open.first().press('Enter');await expect(root).toHaveAttribute('data-open','ai,optical');
  await close.first().press('Tab');await expect(close.nth(1)).toBeFocused();
  if(item.framework==='react')await root.screenshot({path:output+'/optical-glass-cards-native-both-details.png'});
  await close.nth(1).press('Escape');await expect(root).toHaveAttribute('data-open','ai');await expect(open.nth(1)).toBeFocused();
  await close.first().click();await expect(root).toHaveAttribute('data-open','none');
  assert.deepEqual(await page.evaluate(()=>window.__opticalChanges),[['ai'],[],['optical'],['ai','optical'],['ai'],[]]);
  const callbacks=await page.evaluate(()=>JSON.stringify(window.__opticalChanges));await open.nth(1).focus();
  await page.evaluate(()=>window.__update({open:['ai']}));await expect(root).toHaveAttribute('data-open','ai');await expect(open.nth(1)).toBeFocused();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__opticalChanges)),callbacks,'external updates do not emit callbacks or move focus');
  await page.evaluate(()=>window.__update({open:[],paused:false}));await expect(root).toHaveAttribute('data-paused','false');
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(1.25);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=await root.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await root.getAttribute('data-time'),hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(hidden));
  await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='optical-test-spacer';spacer.style.height='2500px';document.body.appendChild(spacer);window.scrollTo(0,1500);});
  await page.waitForTimeout(200);const offscreen=await root.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await root.getAttribute('data-time'),offscreen,'fully offscreen scenes stop RAF');
  await page.evaluate(()=>{window.scrollTo(0,0);document.getElementById('optical-test-spacer').remove();});
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(offscreen));
  await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(root).toHaveAttribute('data-reduced','true');
  await page.waitForTimeout(80);const frames=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__motionFrames),frames);
  await open.first().press('Enter');await close.first().press('Escape');await expect(root).toHaveAttribute('data-open','none');

  await page.setViewportSize({width:768,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
  await expect.poll(()=>open.first().evaluate(node=>Math.round(node.getBoundingClientRect().height))).toBe(30);
  const target=await open.first().boundingBox();await page.touchscreen.tap(target.x+target.width/2,target.y-4);
  await expect(root).toHaveAttribute('data-open','ai');await close.first().press('Escape');
  await page.setViewportSize({width:375,height:1000});
  await expect.poll(()=>scene.locator('.stage').evaluate(node=>getComputedStyle(node).flexDirection)).toBe('column');
  const bounds=await scene.locator('.card').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().toJSON()));
  assert(bounds.every(r=>r.left>=0&&r.right<=375&&r.height>=620));assert(bounds[1].top>=bounds[0].bottom+27);
  await open.nth(1).tap();await expect(root).toHaveAttribute('data-open','optical');await expect(close.nth(1)).toBeFocused();
  await close.nth(1).press('Escape');await expect(open.nth(1)).toBeFocused();
  if(item.framework==='react')for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
    await root.screenshot({path:`${output}/optical-glass-cards-native-ready-${width}.png`});
  }
  await page.setViewportSize({width:1200,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
  await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(root).toHaveAttribute('data-reduced','false');
  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__opticalMode='webgl1';window.__mount();});
    await expect(root).toHaveAttribute('data-renderer','webgl');await expect(root).toHaveAttribute('data-ready','true');
    const one=await pixels(canvases.first());await page.waitForTimeout(180);assert.notEqual(await pixels(canvases.first()),one,'WebGL1 fallback runs the real shader');
    await page.evaluate(async()=>{await window.__unmount();window.__opticalMode='2d';window.__mount();});
    await expect(root).toHaveAttribute('data-renderer','canvas2d');await expect(root).toHaveAttribute('data-ready','true');
    assert(await canvases.first().evaluate(node=>node.getContext('2d').getImageData(node.width/2,node.height/2,1,1).data[0]>200));
    await page.waitForTimeout(80);const count=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.__motionFrames),count);
    await open.first().press('Enter');await close.first().press('Escape');
    await page.evaluate(async()=>{await window.__unmount();window.__opticalMode='webgl2';window.__mount();});await expect(root).toHaveAttribute('data-renderer','webgl2');
  }
}

export async function verifyOpticalGlassCardsPreviews(page,base){
  const href='/docs/animations/optical-glass-cards';await page.goto(base+'/components?category=cards',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#opticalGallery');await expect(root).toHaveAttribute('data-preview','true');
  await expect.poll(()=>root.getAttribute('data-render-scale').then(Number)).toBeLessThan(1);
  const time=Number(await root.getAttribute('data-time'));await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(time+.1);
  assert(await root.locator('canvas').first().evaluate(node=>node.width<563),'hover preview uses its actual pixel budget');
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});await expect(page.locator('a[href="https://x.com/praveenisomer"]')).toHaveText('作者 · @praveenisomer');assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  const sidebar=popup.frameLocator('iframe').locator('#opticalGallery'),before=Number(await sidebar.getAttribute('data-time'));
  await expect.poll(()=>sidebar.getAttribute('data-time').then(Number)).toBeGreaterThan(before+.1);
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();await link.blur();await expect(popup).toHaveCount(0);
}
