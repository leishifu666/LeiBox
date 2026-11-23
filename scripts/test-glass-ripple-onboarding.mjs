import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

async function pixels(canvas){
  return canvas.evaluate(node=>{
    const context=node.getContext('webgl'),bytes=new Uint8Array(node.width*node.height*4);
    context.readPixels(0,0,node.width,node.height,context.RGBA,context.UNSIGNED_BYTE,bytes);
    let hash=2166136261;for(let index=0;index<bytes.length;index+=31)hash=Math.imul(hash^bytes[index],16777619);
    return hash>>>0;
  });
}

export async function verifyGlassRippleOnboarding(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#glassRippleOnboarding');
  const canvas=scene.locator('canvas'),sheet=scene.locator('#setupSheet'),welcome=scene.locator('#uiLayer');
  const start=scene.locator('#getStartedBtn'),pulse=scene.locator('#starburstBtn'),goals=scene.locator('.goal-option');
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl');
  await expect(root).toHaveAttribute('data-open','false');assert(await sheet.evaluate(node=>node.inert));
  const first=await pixels(canvas);await page.waitForTimeout(220);assert.notEqual(await pixels(canvas),first,'the painting is actually refracted over time');
  assert.equal(await scene.locator('.starburst-svg').evaluate(node=>node.getAnimations()[0].effect.getTiming().duration),3000);
  await page.evaluate(()=>{
    window.__rippleChanges={open:[],goal:[],continue:[]};
    window.__update({onOpenChange:value=>window.__rippleChanges.open.push(value),onGoalChange:value=>window.__rippleChanges.goal.push(value),onContinue:value=>window.__rippleChanges.continue.push(value)});
  });
  await pulse.press('Enter');await expect(root).toHaveAttribute('data-pulses','1');
  await start.press('Enter');await expect(root).toHaveAttribute('data-open','true');
  assert(await welcome.evaluate(node=>node.inert));await expect(goals.first()).toBeFocused();
  await goals.first().press('ArrowDown');await expect(goals.nth(1)).toBeFocused();
  await expect(goals.nth(1)).toHaveAttribute('aria-checked','true');
  await scene.locator('#continueGoalBtn').press('Enter');
  await expect(scene.locator('#setupStatus')).toHaveText('Ready: Build an emergency fund');
  assert.deepEqual(await page.evaluate(()=>window.__rippleChanges),{open:[true],goal:['emergency'],continue:['emergency']});
  if(item.framework==='react')await page.screenshot({path:output+'/glass-ripple-onboarding-native-goals.png'});
  await scene.locator('#continueGoalBtn').press('Escape');await expect(root).toHaveAttribute('data-open','false');
  await expect(start).toBeFocused();
  await start.press('Enter');await goals.nth(1).press('End');await expect(root).toHaveAttribute('data-goal','milestone');
  await goals.nth(2).press('Home');await expect(root).toHaveAttribute('data-goal','spending');
  await scene.locator('#closeSheetBtn').click();await expect(start).toBeFocused();
  const callbacks=await page.evaluate(()=>JSON.stringify(window.__rippleChanges));
  await page.evaluate(()=>window.__update({open:true,goal:'milestone'}));
  await expect(goals.nth(2)).toHaveAttribute('aria-checked','true');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__rippleChanges)),callbacks,'external updates do not emit user callbacks');

  await page.setViewportSize({width:375,height:1000});
  await expect.poll(async()=>{
    const r=await scene.locator('#phoneCard').boundingBox();return r.x>=0&&r.x+r.width<=375&&Math.abs(r.width/r.height-219/460)<.005;
  }).toBe(true);
  for(const control of [scene.locator('#closeSheetBtn'),goals.first(),scene.locator('#continueGoalBtn')])assert((await control.boundingBox()).height>=44);
  await goals.first().tap();await scene.locator('#continueGoalBtn').tap();
  await expect(scene.locator('#setupStatus')).toHaveText('Ready: Monthly spending balance');
  await scene.locator('#closeSheetBtn').tap();await expect(root).toHaveAttribute('data-open','false');
  await page.setViewportSize({width:1200,height:1000});

  await page.evaluate(()=>window.__update({paused:true}));await expect(root).toHaveAttribute('data-paused','true');
  await expect.poll(()=>scene.locator('.starburst-svg').evaluate(node=>node.getAnimations()[0].playState)).toBe('paused');
  const frozenTime=await root.getAttribute('data-time'),frozen=await pixels(canvas);
  await pulse.press('Enter');await page.waitForTimeout(180);
  assert.equal(await root.getAttribute('data-time'),frozenTime);assert.equal(await pixels(canvas),frozen,'a paused pulse does not change the frozen wave');
  await page.evaluate(()=>window.__update({paused:false,reducedMotion:true}));
  await expect(root).toHaveAttribute('data-reduced','true');
  assert.equal(await scene.locator('.starburst-svg').evaluate(node=>node.getAnimations().length),0);
  await page.waitForTimeout(80);const frames=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__motionFrames),frames,'reduced motion runs no continuous RAF');
  await start.press('Enter');await expect(root).toHaveAttribute('data-open','true');
  await scene.locator('#closeSheetBtn').press('Enter');await expect(start).toBeFocused();
  await page.evaluate(()=>window.__update({reducedMotion:false}));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenTime=await root.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await root.getAttribute('data-time'),hiddenTime);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(hiddenTime));

  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__rippleNoGL=true;window.__mount();});
    await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','canvas2d');
    assert(await canvas.evaluate(node=>Boolean(node.getContext('2d'))));
    await start.press('Enter');await goals.nth(2).click();await scene.locator('#continueGoalBtn').click();
    await expect(scene.locator('#setupStatus')).toHaveText('Ready: Save for a milestone');
    await page.evaluate(async()=>{await window.__unmount();window.__rippleNoGL=false;window.__mount();});
    await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl');
  }
}

export async function verifyGlassRippleOnboardingPreviews(page,base){
  const href='/docs/animations/glass-ripple-onboarding';
  await page.goto(base+'/components?category=cards',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#glassRippleOnboarding');
  await expect(root).toHaveAttribute('data-ready','true');
  await expect.poll(()=>root.getAttribute('data-pulses').then(Number)).toBeGreaterThan(0);
  const before=Number(await root.getAttribute('data-time'));
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(before+.1);
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/moizarshi29"]')).toHaveText('作者 · @moizarshi29');
  assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect.poll(()=>popup.frameLocator('iframe').locator('#glassRippleOnboarding').getAttribute('data-pulses').then(Number)).toBeGreaterThan(0);
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
