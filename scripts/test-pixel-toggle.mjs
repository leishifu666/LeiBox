import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyPixelToggle(page) {
  const toggle = page.locator('#demo').getByRole('switch', { name: 'Day mode' });
  const knob = toggle.locator('.pixel-knob');
  const canvas = toggle.locator('canvas');
  const pixelFrame = () => canvas.evaluate(node => node.toDataURL());
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(knob).toHaveCSS('left', '16px');
  const night = await pixelFrame();
  await page.evaluate(() => {
    window.__pixelChanges = [];
    window.__update({ sound: false, onCheckedChange: value => window.__pixelChanges.push(value) });
  });

  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect.poll(pixelFrame).not.toBe(night);
  await expect(knob).toHaveCSS('left', '264px');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');

  const bounds = await toggle.boundingBox();
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + bounds.width * .76, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .53, y, { steps: 4 });
  await expect(toggle).toHaveAttribute('data-dragging', '');
  const middle = await knob.evaluate(node => parseFloat(node.style.left));
  assert(middle > 80 && middle < 215, 'the knob follows the pointer before release');
  await page.mouse.move(bounds.x + bounds.width * .26, y, { steps: 5 });
  await page.mouse.up();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).not.toHaveAttribute('data-dragging');
  assert.deepEqual(await page.evaluate(() => window.__pixelChanges), [true, false, true, false]);

  await page.mouse.move(1100, 460);
  await expect(knob).toHaveCSS('left', '16px');
  await expect.poll(async () => {
    const frames = await page.evaluate(() => window.__motionFrames);
    await page.waitForTimeout(125);
    return page.evaluate(start => window.__motionFrames === start, frames);
  }).toBe(true);

  await page.evaluate(() => window.__update({ checked: true, reducedMotion: true }));
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(knob).toHaveCSS('left', '264px');
  assert.deepEqual(await page.evaluate(() => window.__pixelChanges), [true, false, true, false]);
}
