import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyImageAccordion(page) {
  const strip = page.locator('#demo .acc');
  const cells = strip.locator('.acc-cell');
  const active = strip.locator('.acc-cell[data-open]');
  const middle = cells.nth(2);
  const widths = () => cells.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));

  await expect(cells).toHaveCount(5);
  await expect(strip).toHaveCSS('width', '340px');
  await expect(strip).toHaveCSS('border-radius', '8px');
  assert((await widths()).every(width => Math.abs(width - 61.6) < 0.05), 'five photos share the resting width');

  await middle.hover();
  await expect(active).toHaveAccessibleName('Red coastal house');
  await expect.poll(async () => (await widths())[2]).toBeGreaterThan(110);
  const expanded = await widths();
  assert(expanded[2] > expanded[1] && expanded[1] > expanded[0], 'neighboring cells share the expansion');
  assert(Math.abs(expanded.reduce((sum, width) => sum + width, 32) - 340) < 0.1, 'expanding photos preserve the strip width');

  await cells.last().hover();
  await expect(active).toHaveAccessibleName('Ferry queue');
  await page.mouse.move(1100, 400);
  await expect(active).toHaveCount(0);
  await expect.poll(async () => (await widths()).every(width => Math.abs(width - 61.6) < 0.05)).toBe(true);
  await expect.poll(() => strip.locator('.acc-cell[style="flex-grow: 1;"]').count()).toBe(5);
  const settledFrames = await page.evaluate(() => window.__motionFrames);
  await page.waitForTimeout(110);
  assert.equal(await page.evaluate(() => window.__motionFrames), settledFrames, 'the spring stops requesting frames when settled');

  await page.keyboard.press('Tab');
  const first = cells.first();
  await expect(first).toBeFocused();
  await expect(first).toHaveCSS('outline-style', 'solid');
  await expect(active).toHaveAccessibleName('Coastal bird');
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', 'false');

  await page.evaluate(() => window.__update({ gap: 0, reducedMotion: true }));
  await expect(strip).toHaveCSS('border-radius', '0px');
  await expect(first).toHaveCSS('border-radius', '0px');
  await expect(strip).toHaveCSS('gap', '0px');
  await page.keyboard.press('Tab');
  await expect(active).toHaveAccessibleName('Highland cow');
  assert((await widths())[1] > 130, 'reduced motion expands the focused photo immediately');
}
