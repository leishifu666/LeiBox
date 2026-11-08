import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyPixelToggle(page) {
  const toggle = page.locator('#demo').getByRole('switch', { name: 'Day mode' });
  const knob = toggle.locator('.pixel-knob');
  const canvas = page.locator('#demo .pixel-scene canvas:visible');
  const pixelFrame = () => canvas.screenshot();
  if (await canvas.getAttribute('class') === 'pixel-glass') {
    const coversScene = await canvas.evaluate(node => {
      const canvasBox = node.getBoundingClientRect();
      const sceneBox = node.parentElement.getBoundingClientRect();
      return ['left', 'right', 'top', 'bottom'].every(side => Math.abs(canvasBox[side] - sceneBox[side]) < 1)
        && node.getContext('webgl2').getContextAttributes().alpha === false;
    });
    assert(coversScene, 'WebGL paints one opaque surface across the entire scene');
  }
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
  await knob.evaluate(node => {
    window.__knobWidths = [];
    const samples = new MutationObserver(() => {
      window.__knobWidths.push({ width: parseFloat(node.style.width), left: parseFloat(node.style.left) });
    });
    samples.observe(node, { attributes: true, attributeFilter: ['style'] });
    window.__stopKnobSamples = () => samples.disconnect();
  });
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => page.evaluate(() => {
    const frames = window.__knobWidths;
    const impact = frames.findIndex(({ left, width }) => left > 264 && width < 224 && Math.abs(left + width - 504) < .1);
    return impact > 0 && frames.slice(0, impact).some(({ width }) => width > 272)
      && frames.slice(impact + 1).some(({ width }) => width >= 236);
  }), { message: 'the knob stretches, squashes against the wall, and rebounds' }).toBe(true);
  await page.evaluate(() => window.__stopKnobSamples());
  await expect(knob).toHaveCSS('left', '264px');
  assert(!(await pixelFrame()).equals(night), 'the rendered glass and pixels change with the mode');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(knob).toHaveCSS('left', '264px');

  const bounds = await toggle.boundingBox();
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(bounds.x + bounds.width * .76, y);
  await page.mouse.down();
  await expect.poll(() => knob.evaluate(node => parseFloat(node.style.width))).toBeLessThan(230);
  await page.mouse.move(bounds.x + bounds.width * .53, y, { steps: 4 });
  await expect(toggle).toHaveAttribute('data-dragging', '');
  await expect.poll(() => knob.evaluate(node => {
    const left = parseFloat(node.style.left);
    return left > 80 && left < 215;
  }), { message: 'the knob follows the pointer before release' }).toBe(true);
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
