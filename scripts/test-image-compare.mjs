import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyImageCompare(page) {
  const slider = page.locator('#demo .cmp');
  await expect(slider).toHaveAttribute('aria-valuenow', '50');
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '60');
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.6, y);
  await page.mouse.down();
  await slider.evaluate(node => {
    node.addEventListener('pointermove', () => {
      const stroke = node.querySelector('.cmp-line path').getAttribute('d');
      const cut = node.querySelector('.cmp-before').style.clipPath;
      const coordinates = path => path.split('Q')[1].split('L')[0].match(/-?\d+(?:\.\d+)?/g).map(Number);
      const [control, , end] = coordinates(stroke);
      node.__compareSample = {
        curved: control !== end,
        aligned: JSON.stringify(coordinates(stroke)) === JSON.stringify(coordinates(cut)),
        midpointError: Math.abs((control + end) / 2 - parseFloat(node.querySelector('.cmp-grip').style.left)),
      };
    }, { once: true });
  });
  await page.mouse.move(box.x + box.width * 0.25, y);
  await expect(slider).toHaveAttribute('aria-valuenow', '25');
  const geometry = await slider.evaluate(node => node.__compareSample);
  assert(geometry.curved && geometry.aligned && geometry.midpointError < 0.02, 'the revealed edge and curve bend through the same handle position');
  await page.waitForTimeout(100);
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow', '25');
  await page.mouse.move(box.x + box.width * 0.25, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.82, y);
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow', '100');
  await page.evaluate(() => window.__update({ labels: false, corner: 7, reducedMotion: true }));
  await expect(slider).toHaveCSS('border-radius', '7px');
  await expect(slider.locator('.cmp-tag').first()).toBeHidden();
  await slider.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await expect(slider.locator('.cmp-line path')).toHaveAttribute('d', 'M 0.00 0 Q 0.00 180 0.00 360');
}
