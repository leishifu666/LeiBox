import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function verifyBlueFlutedGlass(page, item, root, out) {
  const stage = page.locator('#demo .bfg-stage');
  const canvas = page.locator('#demo .bfg-canvas');
  await stage.locator('svg').waitFor();
  assert.equal(await stage.getAttribute('data-renderer'), 'webgl');
  const paths = await stage.locator('svg path').evaluateAll(nodes => nodes.map(n => n.getAttribute('d')));
  const logo = await fs.readFile(path.join(root, 'public/leibox-logo.svg'), 'utf8');
  assert.deepEqual(paths, [...logo.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m => m[1]), 'uses the actual website logo paths');
  await canvas.evaluate(n => { window.__bfgContexts = [n.getContext('webgl')]; });
  const pixels = () => canvas.evaluate(n => n.toDataURL());
  const first = await pixels();
  await page.waitForTimeout(240);
  assert(await pixels() !== first, 'procedural fluid changes actual pixels');

  await stage.click();
  assert.equal(await stage.getAttribute('aria-pressed'), 'true');
  const paused = await pixels();
  const logoBox = await stage.locator('svg').boundingBox();
  for (const [x, y] of [[100, 100], [600, 400], [1000, 700]]) await page.mouse.move(x, y);
  await page.waitForTimeout(160);
  assert(await pixels() === paused, 'paused pixels stay fixed across pointer positions');
  assert.deepEqual(await stage.locator('svg').boundingBox(), logoBox, 'logo stays fixed');
  await stage.press('Space');
  await page.waitForTimeout(160);
  assert.equal(await stage.getAttribute('aria-pressed'), 'false');
  assert(await pixels() !== paused, 'Space resumes the same scene');
  await stage.press('Enter');
  assert.equal(await stage.getAttribute('aria-pressed'), 'true');
  await stage.press('Enter');
  for (let i = 0; i < 4; i++) await stage.click();
  assert.equal(await stage.getAttribute('aria-pressed'), 'false', 'rapid reversals preserve user state');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(80);
  const reduced = await pixels();
  await page.waitForTimeout(160);
  assert(await pixels() === reduced, 'system reduced motion freezes drawing');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(160);
  assert(await pixels() !== reduced, 'system preference resumes motion');
  await page.evaluate(() => window.__update({ reducedMotion: true }));
  await page.waitForTimeout(80);
  const overridden = await pixels();
  await page.waitForTimeout(160);
  assert(await pixels() === overridden, 'instance options freeze drawing');
  await page.evaluate(() => window.__update({ reducedMotion: false }));
  await page.waitForTimeout(160);
  assert(await pixels() !== overridden, 'instance options resume drawing');

  await page.locator('#demo').evaluate(n => n.style.transform = 'translateY(1800px)');
  await page.waitForTimeout(180);
  const hidden = await pixels();
  const frames = await page.evaluate(() => window.__motionFrames);
  await page.waitForTimeout(160);
  assert(await pixels() === hidden, 'offscreen fluid stops drawing');
  assert.equal(await page.evaluate(() => window.__motionFrames), frames, 'offscreen fluid stops RAF callbacks');
  await page.locator('#demo').evaluate(n => n.style.transform = '');
  await page.waitForTimeout(160);
  assert(await pixels() !== hidden, 'onscreen fluid resumes');

  await page.evaluate(() => window.__mount('independent'));
  const second = page.locator('#independent .bfg-stage');
  await second.waitFor();
  await page.locator('#independent .bfg-canvas').evaluate(n => window.__bfgContexts.push(n.getContext('webgl')));
  await stage.click();
  assert.equal(await second.getAttribute('aria-pressed'), 'false', 'instances have independent pause state');
  await page.evaluate(() => window.__unmount('independent'));
  await stage.press('Space');
  await stage.focus();
  assert.equal(await stage.evaluate(n => getComputedStyle(n).outlineStyle), 'solid', 'keyboard focus has a visible outline');

  if (item.framework === 'react') {
    await page.evaluate(() => window.__update({ reducedMotion: true }));
    await page.locator('[data-motion-surface]').screenshot({ path: path.join(out, 'blue-fluted-glass-paused.png') });
    await page.evaluate(() => window.__update({ reducedMotion: false }));
  }
}
