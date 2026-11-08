import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyCardSwap(page, item) {
  const front = page.locator('#demo .csw-card[data-front]');
  const mountain = page.locator('#demo .csw-card[aria-label^="Mountain"]');
  await expect(front).toContainText('Mountain');
  await front.click();
  await expect(front).toContainText('Bloom');
  assert.equal(await mountain.evaluate(el => el.style.zIndex), '1');
  await front.press('Space');
  await expect(front).toContainText('Peak');
  await expect(front).toBeFocused();

  const box = await front.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 14, y);
  await expect(front).toHaveAttribute('data-dragging', '');
  await page.mouse.up();
  await expect(front).toContainText('Peak');
  await expect(front).not.toHaveAttribute('data-dragging');

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 230, y + 40, { steps: 5 });
  await page.mouse.up();
  await expect(front).toContainText('Wings');
  assert.equal(await page.locator('#demo .csw-card').count(), 4);

  if (item.framework === 'react') {
    await front.blur();
    await page.locator('#demo .csw-stack').hover({ position: { x: 5, y: 5 } });
    await page.evaluate(() => window.__update({ auto: true, every: 1.5 }));
    await page.waitForTimeout(1650);
    await expect(front).toContainText('Wings');
    await page.mouse.move(4, 600);
    await expect(front).toContainText('Mountain', { timeout: 3000 });
    await page.evaluate(() => window.__update({ auto: true, every: 1.5, reducedMotion: true }));
    await page.waitForTimeout(1650);
    await expect(front).toContainText('Mountain');
  }
}
