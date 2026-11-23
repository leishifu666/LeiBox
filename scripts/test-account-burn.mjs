import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyAccountBurn(page, item, output) {
  const scene=page.locator('#demo');
  const stage=scene.locator('#stage');
  const button=scene.locator('#hold-btn');
  await expect(stage).toHaveAttribute('data-state','delete');
  await expect(stage).toHaveAttribute('data-renderer','webgl2');
  assert(await scene.locator('#screen-signin').evaluate(n=>n.inert));
  await page.evaluate(()=>{
    window.__burnChanges=[];
    window.__update({onStateChange:state=>window.__burnChanges.push(state)});
  });
  await button.hover();await page.mouse.down();
  await expect.poll(()=>stage.getAttribute('data-progress').then(Number)).toBeGreaterThan(.04);
  await page.mouse.up();
  await expect(stage).toHaveAttribute('data-progress','0.000');
  await expect(stage).toHaveAttribute('data-state','delete');
  await button.focus();await page.keyboard.down('Space');
  await page.keyboard.press('Tab');await page.keyboard.up('Space');
  await expect(stage).toHaveAttribute('data-progress','0.000');
  await expect(stage).toHaveAttribute('data-state','delete');

  // One real default-duration run; the other native wrappers use the supported shorter hold.
  if(item.framework!=='react')await page.evaluate(()=>window.__update({holdDuration:.3}));
  await button.focus();await page.keyboard.down('Space');
  await expect(stage).toHaveAttribute('data-state','burning',{timeout:5000});
  await page.keyboard.up('Space');
  assert(await scene.locator('#screen-delete').evaluate(n=>n.inert));
  if(item.framework==='react'){
    await page.waitForTimeout(1600);
    await expect.poll(()=>scene.locator('#screen-signin').evaluate(n=>n.style.clipPath)).toContain('polygon');
    await page.screenshot({path:output+'/account-burn-native-burning.png'});
  }
  await expect(stage).toHaveAttribute('data-state','signin',{timeout:9000});
  await expect(scene.locator('#email-input')).toBeFocused();
  await scene.locator('#continue-btn').click();
  await expect(scene.locator('#signin-feedback')).toHaveText('Enter your email address to continue.');
  await scene.locator('#email-input').fill('invalid');
  await scene.locator('#continue-btn').click();
  await expect(scene.locator('#email-input')).toHaveAttribute('aria-invalid','true');
  await scene.locator('#email-input').fill('person@example.com');
  await scene.locator('#email-input').press('Enter');
  await expect(scene.locator('#signin-feedback')).toHaveText('Demo only. No sign-in request was sent.');
  await scene.locator('#restore-btn').click();
  await expect(stage).toHaveAttribute('data-state','restoring');
  await expect(stage).toHaveAttribute('data-state','delete',{timeout:9000});
  await expect(button).toBeFocused();
  assert.deepEqual(await page.evaluate(()=>window.__burnChanges),['signin','delete']);

  await page.evaluate(()=>window.__update({reducedMotion:true,holdDuration:.3}));
  await button.tap();
  await page.waitForTimeout(350);
  await expect(stage).toHaveAttribute('data-state','delete');
  await button.focus();await page.keyboard.down('Enter');
  await expect(stage).toHaveAttribute('data-state','signin');await page.keyboard.up('Enter');
  await scene.locator('#restore-btn').tap();
  await expect(stage).toHaveAttribute('data-state','delete');
  assert.deepEqual(await page.evaluate(()=>window.__burnChanges),['signin','delete','signin','delete']);
  await page.evaluate(()=>window.__update({state:'signin'}));
  await expect(stage).toHaveAttribute('data-state','signin');
  assert.equal(await page.evaluate(()=>window.__burnChanges.length),4,'external resets do not emit a user action');
  await page.evaluate(()=>window.__update({state:'delete',reducedMotion:false}));
  // Start an animation so the shared harness verifies active work is canceled on unmount.
  await button.hover();await page.mouse.down();
  await expect(stage).toHaveAttribute('data-state','burning');
  await page.mouse.up();
  await page.evaluate(()=>window.__update({state:'delete'}));

  if(item.framework==='react') {
    await page.evaluate(async()=>{
      await window.__unmount();window.__burnNoGL=true;window.__mount();
    });
    await expect(stage).toHaveAttribute('data-renderer','fallback');
    await page.evaluate(()=>window.__update({holdDuration:.3}));
    await button.focus();await page.keyboard.down('Space');
    await expect(stage).toHaveAttribute('data-state','burning');await page.keyboard.up('Space');
    await expect(stage).toHaveAttribute('data-state','signin',{timeout:8000});
    await expect(scene.locator('#screen-signin')).toHaveCSS('background-color','rgb(0, 0, 0)');
    await page.evaluate(()=>window.__update({state:'delete'}));
    await page.evaluate(async()=>{
      await window.__unmount();window.__burnNoGL=false;window.__mount();
    });
    await expect(stage).toHaveAttribute('data-renderer','webgl2');
  }
}

export async function verifyAccountBurnPreviews(page,base) {
  const href='/docs/animations/account-burn';
  await page.goto(base+'/components?category=transitions',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();
  await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const stage=card.frameLocator('iframe').locator('#stage');
  await expect(stage).toHaveAttribute('data-state','burning',{timeout:7000});
  await expect(stage).toHaveAttribute('data-state','signin',{timeout:10000});
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/kshvbgde"]')).toHaveText('作者 · @kshvbgde');
  assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`);
  const popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect(popup.frameLocator('iframe').locator('#stage')).toHaveAttribute('data-state','burning',{timeout:7000});
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
