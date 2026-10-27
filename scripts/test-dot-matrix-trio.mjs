import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';
import {DOT_MATRIX_TRIO_COPY, DOT_MATRIX_TRIO_BRAND_SVG} from '../src/data/dot-matrix-trio.mjs';

export async function verifyDotMatrixTrio(page, item, root, out) {
  const scene = page.locator('#demo .dm-scene'), cards = page.locator('#demo .dm-poster');
  const pixels = () => page.locator('#demo .dm-canvas').evaluateAll(nodes => nodes.map(node => node.toDataURL()));
  assert.equal(await cards.count(), 3);
  assert.equal(await scene.locator('.dm-brand-logo').count(),2,'both small brands use the site vector');
  assert.equal(await scene.locator('.dm-wordmark').count(),1,'the middle card uses the custom vector wordmark');
  assert.equal(await scene.locator('.dm-copy').nth(0).innerText(),DOT_MATRIX_TRIO_COPY.left.join('\n'));
  assert.equal(await scene.locator('.dm-copy').nth(1).innerText(),DOT_MATRIX_TRIO_COPY.right.join('\n'));
  assert.equal(await scene.locator('.dm-copy[lang="en"]').count(),2,'both card captions stay in English');
  assert(!/circuit/i.test(await scene.innerText()),'the demonstration contains no previous brand text');
  const expectedMark=DOT_MATRIX_TRIO_BRAND_SVG.match(/<path[^>]+d="([^"]+)"/)[1];
  assert.deepEqual(await scene.locator('[data-dm-symbol] path').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d'))),[expectedMark,expectedMark],'the prompt and mounted brand share the actual LeiBox symbol');
  await page.evaluate(() => window.__update({reducedMotion:true}));
  await cards.first().press('Home');
  await page.waitForFunction(() => document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.dm-scene').dataset.motion === 'reduced');
  assert.equal(await scene.getAttribute('data-time'), '0.000');
  const initial = await pixels();
  if (item.framework === 'react') {
    await cards.first().evaluate(node => node.blur());
    await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(out, 'dot-matrix-trio-reference-state.png')});
    await page.evaluate(() => window.__update({height:900}));
    await scene.evaluate(node => { node.style.background = '#f4f4f4'; });
    await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(root, 'public/assets/components/dot-matrix-trio.png')});
    await scene.evaluate(node => { node.style.background = ''; });
    await page.evaluate(() => window.__update({height:540}));
  }
  await page.waitForTimeout(180); assert.deepEqual(await pixels(), initial, 'reduced-motion mount holds all three Canvas frames');
  for (let index = 0; index < 15; index++) await cards.first().press('ArrowRight');
  const stepped = await pixels();
  assert.equal(await scene.getAttribute('data-time'), '0.500');
  stepped.forEach((image, index) => assert.notEqual(image, initial[index], `pattern ${index} changes after stepping`));
  await page.evaluate(() => window.__update({reducedMotion:false}));
  assert.equal(await scene.getAttribute('data-paused'), 'true', 'option updates preserve the user pause');
  await cards.nth(1).click();
  await page.waitForTimeout(200);
  assert.equal(await scene.getAttribute('data-paused'), 'false');
  assert(Number(await scene.getAttribute('data-time')) > .5);
  await cards.nth(2).press('Space');
  const paused = await pixels(), time = await scene.getAttribute('data-time');
  await page.waitForTimeout(180);
  assert.deepEqual(await pixels(), paused, 'pause preserves every pixel');
  assert.equal(await scene.getAttribute('data-time'), time);
  assert.equal(await page.locator('#demo .dm-poster[aria-pressed=true]').count(), 3, 'one shared playback state');
  await cards.first().press('ArrowLeft');
  assert(Number(await scene.getAttribute('data-time')) < Number(time));
  await cards.first().press('Escape');
  assert(Number(await scene.getAttribute('data-time')) < .1, 'reset returns to the first playback frames');
  assert.equal(await scene.getAttribute('data-paused'), 'false');
  await cards.first().tap(); assert.equal(await scene.getAttribute('data-paused'), 'true', 'touch pauses');
  await cards.first().tap(); assert.equal(await scene.getAttribute('data-paused'), 'false', 'touch resumes');
  await cards.first().focus();
  assert.equal(await cards.first().evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  await page.emulateMedia({reducedMotion:'reduce'});
  // Remove the explicit override so the live system preference is observed.
  await page.evaluate(() => window.__update({reducedMotion:undefined}));
  await page.waitForFunction(() => document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.dm-scene').dataset.motion === 'reduced');
  const still = await pixels(); await page.waitForTimeout(140); assert.deepEqual(await pixels(), still);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForTimeout(100);
  await page.locator('#demo').evaluate(node => { node.style.transform = 'translateY(3000px)'; });
  await page.waitForTimeout(150);
  const hidden = await scene.getAttribute('data-time'); await page.waitForTimeout(140);
  assert.equal(await scene.getAttribute('data-time'), hidden, 'offscreen scene stops its clock');
  await page.locator('#demo').evaluate(node => { node.style.transform = ''; });
  await page.waitForTimeout(150);
  assert(Number(await scene.getAttribute('data-time')) > Number(hidden), 'visible scene resumes');
}

export async function verifyDotMatrixTrioDoc(page) {
  const frame = page.frameLocator('section[aria-label="Demo"] iframe');
  const scene = frame.locator('.dm-scene'), card = frame.locator('.dm-poster').first();
  await expect(frame.locator('.dm-poster')).toHaveCount(3);
  await card.press('Space'); await expect(scene).toHaveAttribute('data-paused','true');
  const time = await scene.getAttribute('data-time'); await page.waitForTimeout(150);
  assert.equal(await scene.getAttribute('data-time'),time);
  await card.press('Enter'); await expect(scene).toHaveAttribute('data-paused','false');
  await expect(page.getByRole('link',{name:/Chris Halaska/})).toHaveAttribute('href','https://x.com/chalaska');
  assert.equal(await page.locator('video').count(),0,'detail does not embed the reference video');
  const code = page.locator('section[aria-label="Code"]');
  await page.evaluate(() => {
    window.__dotMatrixClipboard = navigator.clipboard.writeText.bind(navigator.clipboard);
    window.__dotMatrixClipboardWrite = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.writeText = () => Promise.reject(new Error('test clipboard denial'));
    navigator.clipboard.write = () => Promise.reject(new Error('test clipboard denial'));
  });
  await code.getByRole('button',{name:'复制完整代码包',exact:true}).click();
  await expect(code.getByRole('button',{name:'复制失败，请重试',exact:true})).toBeVisible();
  await page.evaluate(() => { navigator.clipboard.writeText = window.__dotMatrixClipboard; navigator.clipboard.write = window.__dotMatrixClipboardWrite; });
  await code.getByRole('button',{name:'复制失败，请重试',exact:true}).click();
  await expect(code.getByRole('button',{name:'已复制',exact:true})).toBeVisible();
}
