import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyStatusPicker(page) {
  const scene = page.locator('#demo');
  const shell = scene.locator('#pickerShell');
  const trigger = scene.locator('#collapsedTrigger');
  const online = scene.locator('.status-orb[data-status="online"]');
  const focus = scene.locator('.status-orb[data-status="focus"]');
  const dnd = scene.locator('.status-orb[data-status="dnd"]');
  const width = () => shell.evaluate(node => node.offsetWidth);
  await expect(shell).toHaveAttribute('data-status', 'online');
  assert.equal(await width(), 72);
  await page.evaluate(() => {
    window.__statusChanges = [];
    window.__update({ onStatusChange: status => window.__statusChanges.push(status) });
  });

  await trigger.press('Enter');
  await expect(shell).toHaveAttribute('data-open', 'true');
  await expect(online).toBeFocused();
  await expect.poll(width).toBe(266);
  await focus.hover();
  await expect(scene.locator('#tooltipPill')).toHaveAttribute('aria-hidden', 'false');
  await expect(scene.locator('.tooltip-text-layer.is-visible')).toHaveText('Focus');
  await dnd.hover();
  await expect(scene.locator('.tooltip-text-layer.is-visible')).toHaveText('Do Not Disturb');
  await expect.poll(() => scene.locator('#tooltipPill').evaluate(node => node.offsetWidth)).toBeGreaterThanOrEqual(164);
  await online.press('End');
  await expect(dnd).toBeFocused();
  await dnd.press('Home');
  await expect(online).toBeFocused();
  await online.press('ArrowRight');
  await expect(focus).toBeFocused();
  await focus.press('Enter');
  await expect(shell).toHaveAttribute('data-status', 'focus');
  await expect(shell).toHaveAttribute('data-open', 'false');
  await expect(trigger).toBeFocused();
  await expect.poll(width).toBe(72);
  assert.deepEqual(await page.evaluate(() => window.__statusChanges), ['focus']);

  await page.evaluate(() => window.__update({ status: 'dnd', open: true }));
  await expect(shell).toHaveAttribute('data-status', 'dnd');
  await expect.poll(width).toBe(266);
  await dnd.click();
  await expect(shell).toHaveAttribute('data-open', 'false');
  assert.deepEqual(await page.evaluate(() => window.__statusChanges), ['focus'], 'external updates and reselecting the current status do not emit changes');

  await trigger.press('Enter');
  await dnd.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(shell).toHaveAttribute('data-open', 'false');
  await trigger.press('Enter');
  await scene.locator('.stage').click({ position: { x: 4, y: 4 } });
  await expect(shell).toHaveAttribute('data-open', 'false');

  await page.evaluate(() => window.__update({ open: true }));
  await page.waitForTimeout(55);
  const middle = await width();
  assert(middle > 72 && middle < 280, 'opening renders intermediate geometry');
  await page.evaluate(() => window.__update({ open: false }));
  await page.waitForTimeout(45);
  await page.evaluate(() => window.__update({ open: true }));
  await expect.poll(width).toBe(266);
  await page.evaluate(() => window.__update({ open: false, reducedMotion: true }));
  await expect.poll(width).toBe(72);
  await page.evaluate(() => window.__update({ open: true }));
  await expect.poll(width).toBe(266);

  await page.setViewportSize({ width: 375, height: 900 });
  await expect.poll(async () => {
    const bounds = await shell.boundingBox();
    return bounds.x >= 0 && bounds.x + bounds.width <= 375;
  }, { message: 'expanded picker fits mobile width after its resize observer updates' }).toBe(true);
  await focus.tap();
  await expect(shell).toHaveAttribute('data-status', 'focus');
  await trigger.tap();
  await online.tap();
  await expect(shell).toHaveAttribute('data-status', 'online');
  await expect(shell).toHaveAttribute('data-open', 'false');
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.mouse.move(1, 1);
  await page.evaluate(() => window.__update({ reducedMotion: false }));
  await page.waitForTimeout(600);
  const frames = await page.evaluate(() => window.__motionFrames);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.__motionFrames), frames, 'settled picker stops requesting frames');
}

export async function verifyStatusPickerPreviews(page, base) {
  const href = '/docs/animations/status-picker';
  await page.goto(base + '/components?category=controls', { waitUntil: 'networkidle' });
  const card = page.locator(`[data-component-card="${href}"]`);
  await card.hover();
  await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const shell = card.frameLocator('iframe').locator('#pickerShell');
  for (const status of ['focus', 'dnd', 'online']) {
    await expect(shell).toHaveAttribute('data-status', status, { timeout: 6500 });
  }
  await page.mouse.move(270, 5);
  await expect(card.locator('iframe')).toHaveCount(0);

  await page.goto(base + href, { waitUntil: 'networkidle' });
  const link = page.locator(`aside a[href="${href}"][aria-current="page"]`);
  const popup = page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();
  await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  const sidebarShell = popup.frameLocator('iframe').locator('#pickerShell');
  for (const status of ['focus', 'dnd', 'online']) {
    await expect(sidebarShell).toHaveAttribute('data-status', status, { timeout: 6500 });
  }
  await page.mouse.move(270, 5);
  await expect(popup).toHaveCount(0);
  await link.focus();
  await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();
  await expect(popup).toHaveCount(0);
}
