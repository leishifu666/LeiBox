import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium, expect} from 'playwright/test';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const out = 'outputs/chalaska-2096917032621199665';
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors = []; page.on('pageerror',error => errors.push(error.message));
try {
  await page.goto(`${base}/components`,{waitUntil:'networkidle'});
  const card = page.locator('[data-component-card="/docs/animations/dot-matrix-trio"]');
  await expect(card).toContainText('点阵波纹与旋涡');
  await card.hover(); await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
  const frame = card.frameLocator('iframe');
  assert.equal(await frame.locator('.dm-canvas').count(),3);
  assert.equal(await frame.locator('.dm-brand-logo').count(),2);
  assert.equal(await frame.locator('.dm-wordmark').getAttribute('aria-label'),'LeiBox');
  await expect(frame.locator('.dm-copy').first()).toHaveText('Browse interfacesCollect UI ideasSave handy pieces');
  await expect(frame.locator('.dm-scene')).toHaveCSS('background-color','rgb(244, 244, 244)');
  const before = await frame.locator('.dm-canvas').nth(1).evaluate(node => node.toDataURL());
  await page.waitForTimeout(300);
  assert.notEqual(await frame.locator('.dm-canvas').nth(1).evaluate(node => node.toDataURL()),before,'gallery preview actually animates');
  await page.screenshot({path:`${out}/gallery-live.png`});
  await page.mouse.move(400,20); await expect(card.locator('iframe')).toHaveCount(0);
  await card.locator('a').focus(); await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
  await page.keyboard.press('Tab'); await expect(card.locator('iframe')).toHaveCount(0);
  for (const width of [375,768,1440]) {
    await page.setViewportSize({width,height:1000}); await page.evaluate(() => scrollTo(0,0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
    await page.screenshot({path:`${out}/gallery-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/docs/animations/dot-matrix-trio`,{waitUntil:'networkidle'});
  const link = page.locator('nav a[href="/docs/animations/dot-matrix-trio"]');
  const floating = page.locator('[data-sidebar-preview="/docs/animations/dot-matrix-trio"]');
  await link.hover(); await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);
  const size = await floating.boundingBox(); assert.equal(Math.round(size.width),224);
  const preview = floating.frameLocator('iframe');
  const state = await preview.locator('.dm-scene').getAttribute('data-time'); await page.waitForTimeout(250);
  assert.notEqual(await preview.locator('.dm-scene').getAttribute('data-time'),state,'sidebar preview uses the live scene');
  assert.equal(await page.locator('[data-sidebar-preview] iframe').count(),1);
  await page.screenshot({path:`${out}/sidebar-live.png`});
  await page.mouse.move(420,20); await expect(floating).toHaveCount(0);
  await link.focus(); await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);
  await page.evaluate(() => scrollBy(0,160)); await expect(floating).toHaveCount(0);
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/preview-results.json`,JSON.stringify({galleryAnimation:true,galleryHoverRelease:true,galleryFocusRelease:true,sidebarAnimation:true,sidebarWidth:224,sidebarFocus:true,scrollRelease:true,widths:[375,768,1440],pageErrors:errors},null,2));
  console.log('PASS dot matrix gallery, sidebar, focus, live pixels, release, and responsive screenshots');
} finally { await browser.close(); }
