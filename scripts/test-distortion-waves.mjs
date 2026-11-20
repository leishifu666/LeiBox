import assert from 'node:assert/strict';
import path from 'node:path';
import { expect } from 'playwright/test';

export async function verifyDistortionWaves(page, item, out) {
  const root = page.locator('#demo');
  const scene = root.locator('.dw-scene');
  const card = root.locator('.dw-card');
  const cta = root.locator('[data-dw-cta]');

  await expect(scene).toHaveAttribute('data-mode', 'vertical');
  await expect(scene).toHaveAttribute('data-revealed', 'false');
  await expect(cta).toHaveText('Confirm');
  const avatar = root.locator('[data-dw-layer="content"] .dw-badge img');
  const avatarLoaded = await avatar.evaluate(async img => {
    await img.decode();
    return img.naturalWidth > 0 && img.currentSrc.startsWith('data:image/webp;base64,');
  });
  assert(avatarLoaded, 'the project portrait loads without a separate image request');
  assert.equal(await page.locator('iframe').count(), 0, 'no hidden style-probe iframe should be created');

  // Register user/finish callbacks and test scrub mode renders real WebGL2 wave frame
  await page.evaluate(() => {
    window.__dwRevealed = [];
    window.__dwFinished = [];
    window.__update({
      onRevealedChange: v => window.__dwRevealed.push(v),
      onFinish: v => window.__dwFinished.push(v),
    });
  });

  const beforeShot = await card.screenshot();
  await page.evaluate(() => window.__update({ scrub: 0.24 }));
  await expect.poll(async () => {
    return root.locator('.dw-card canvas').evaluateAll(list => list.some(c => c.style.display !== 'none' && c.width > 0 && c.height > 0));
  }, { message: 'WebGL2 wave canvas activates during scrub' }).toBe(true);
  await page.waitForTimeout(180);
  const waveShot = await card.screenshot();
  assert(!waveShot.equals(beforeShot), 'scrubbed distortion wave visibly renders over the card');
  if (item.framework === 'react') {
    await card.screenshot({ path: path.join(out, 'distortion-waves-vertical-wave.png') });
  }

  // Exit scrub back to initial state
  await page.evaluate(() => window.__update({ scrub: null, revealed: false }));
  await expect(scene).toHaveAttribute('data-revealed', 'false');
  await expect(cta).toHaveText('Confirm');
  assert.deepEqual(await page.evaluate(() => window.__dwRevealed), [], 'programmatic updates must not fire onRevealedChange');

  // Click Confirm -> forward wave reveals Sent view
  await cta.click();
  await expect(scene).toHaveAttribute('data-revealed', 'true');
  await expect(cta).toHaveText('Done');
  assert.deepEqual(await page.evaluate(() => window.__dwRevealed), [true]);

  // Mid-flight reverse interrupt by clicking Done immediately
  await page.waitForTimeout(260);
  await cta.click();
  await expect(scene).toHaveAttribute('data-revealed', 'false');
  await expect(cta).toHaveText('Confirm');
  assert.deepEqual(await page.evaluate(() => window.__dwRevealed), [true, false]);

  // Switch to Center mode and verify scrub & toggle
  await root.locator('[data-type="center"]').click();
  await expect(scene).toHaveAttribute('data-mode', 'center');
  await expect(cta).toHaveText('Buy $20 tokens');
  await expect(root.locator('[data-palette="green"]')).toHaveAttribute('aria-pressed', 'true');
  if (item.framework === 'react') {
    await page.evaluate(() => window.__update({ scrub: 0.26 }));
    await page.waitForTimeout(180);
    await card.screenshot({ path: path.join(out, 'distortion-waves-center-wave.png') });
    await page.evaluate(() => window.__update({ scrub: null, revealed: false }));
  }

  // Sample the real card halfway through the mode morph.
  const centerWidth = await card.evaluate(element => element.getBoundingClientRect().width);
  await root.locator('[data-type="horizontal"]').click();
  await expect(scene).toHaveAttribute('data-mode', 'horizontal');
  await expect(cta).toHaveAccessibleName('Ship');
  const intermediateWidth = await card.evaluate(async element => {
    const motion = element.getAnimations()[0];
    await motion.ready;
    motion.currentTime = 200;
    return element.getBoundingClientRect().width;
  });
  await expect(card).not.toHaveAttribute('data-mode-morph', '');
  const horizontalWidth = await card.evaluate(element => element.getBoundingClientRect().width);
  assert(centerWidth < intermediateWidth && intermediateWidth < horizontalWidth, 'card has a visible intermediate width');
  await expect(cta).toHaveText('Ship');
  await expect(cta).toHaveCSS('background-color', 'rgb(242, 242, 245)');
  await root.locator('[data-palette="sunset"]').click();
  await expect(root.locator('[data-palette="sunset"]')).toHaveAttribute('aria-pressed', 'true');

  // Interrupt an in-flight mode switch and settle on the final selection.
  await root.locator('[data-type="vertical"]').press('Enter');
  await expect(card).toHaveAttribute('data-mode-morph', '');
  await root.locator('[data-type="center"]').press('Enter');
  await expect(scene).toHaveAttribute('data-mode', 'center');
  await expect(card).not.toHaveAttribute('data-mode-morph', '');
  await expect(cta).toHaveText('Buy $20 tokens');
  await expect(root.locator('.dw-mode-view,.dw-mode-label')).toHaveCount(0);

  // Keyboard activation + reduced motion crossfade completion
  await page.evaluate(() => window.__update({ reducedMotion: true, type: 'vertical', revealed: false }));
  await expect(cta).toHaveText('Confirm');
  await cta.focus();
  await page.keyboard.press('Enter');
  await expect(scene).toHaveAttribute('data-revealed', 'true');
  await expect(cta).toHaveText('Done');
  await expect.poll(() => page.evaluate(() => window.__dwFinished.at(-1))).toBe(true);
  assert.equal(await page.locator('iframe').count(), 0, 'still zero iframes after full interaction');
}
