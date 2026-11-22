import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyGenieMenu(page, item, output) {
  const scene = page.locator('#demo');
  const trigger = scene.locator('#triggerBtn');
  const card = scene.locator('#menuCard');
  const buttons = scene.locator('.menu-item-btn');
  await expect(card).toHaveAttribute('data-state', 'closed');
  assert(await card.evaluate(node => node.inert));
  await page.evaluate(() => {
    window.__genieActions = [];
    window.__update({ onAction: action => window.__genieActions.push(action) });
  });
  await trigger.press('ArrowDown');
  await expect(card).toHaveAttribute('data-state', 'open');
  await expect(buttons.first()).toBeFocused();
  await buttons.first().press('ArrowDown');
  await expect(buttons.nth(1)).toBeFocused();
  await expect(scene.locator('#hoverPill')).toHaveClass(/visible/);
  await buttons.nth(1).press('End');
  await expect(buttons.last()).toBeFocused();
  await buttons.last().press('Enter');
  await expect(card).toHaveAttribute('data-state', 'closed');
  await expect(trigger).toBeFocused();
  await expect(scene.locator('#actionToast')).toHaveText('Share folder');
  assert.deepEqual(await page.evaluate(() => window.__genieActions), ['Share folder']);

  await scene.locator('#speedSlow').click();
  await expect(scene.locator('#speedSlow')).toHaveAttribute('aria-pressed', 'true');
  await trigger.click();
  await page.waitForFunction(() => {
    const root = document.querySelector('#demo [data-motion-surface]').shadowRoot;
    const progress = Number(root.querySelector('#menuCard').dataset.progress);
    return progress > .025 && progress < .25;
  });
  const liquid = await scene.locator('[data-motion-surface]').evaluate(node => {
    const root = node.shadowRoot;
    return {
      paths: ['surfaceDroplet', 'shadowDroplet', 'contactDroplet'].map(id => root.getElementById(id).getAttribute('d')),
      filter: root.getElementById('surfaceGooGroup').getAttribute('filter'),
    };
  });
  assert(liquid.paths[0]?.startsWith('M '), 'opening draws the real SVG liquid path');
  assert.equal(liquid.paths[1], liquid.paths[0]);
  assert.equal(liquid.paths[2], liquid.paths[0]);
  assert.equal(liquid.filter, 'url(#genie-goo)');
  await page.waitForFunction(() => {
    const card = document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('#menuCard');
    return Number(card.dataset.progress) > .4 && Number(card.dataset.progress) < .9;
  });
  assert((await card.getAttribute('style')).includes('rotateX('), 'card and text use real CSS 3D');
  await trigger.click();
  await trigger.click();
  await expect(card).toHaveAttribute('data-state', 'open');
  assert.equal(await scene.locator('#surfaceDroplet').getAttribute('d'), '', 'liquid hands off to the menu surface');
  await buttons.nth(1).hover();
  if (item.framework === 'react') await page.screenshot({ path: output + '/genie-menu-native-open.png' });
  await trigger.press('Escape');
  await expect(card).toHaveAttribute('data-state', 'closed');

  await page.evaluate(() => window.__update({ open: true, speed: 1, reducedMotion: true }));
  await expect(card).toHaveAttribute('data-state', 'open');
  await buttons.first().focus();
  await page.keyboard.press('Tab');
  await expect(card).toHaveAttribute('data-state', 'closed');
  await expect(scene.locator('#speedNormal')).toBeFocused();
  await trigger.click();
  await scene.locator('.stage').click({ position: { x: 4, y: 4 } });
  await expect(card).toHaveAttribute('data-state', 'closed');

  await page.setViewportSize({ width: 375, height: 900 });
  await trigger.tap();
  await expect(card).toHaveAttribute('data-state', 'open');
  const bounds = await card.boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 375, 'menu fits a mobile container');
  await buttons.nth(2).tap();
  await expect(scene.locator('#actionToast')).toHaveText('Pin folder');
  await expect(card).toHaveAttribute('data-state', 'closed');
  assert.deepEqual(await page.evaluate(() => window.__genieActions), ['Share folder', 'Pin folder']);
  await page.setViewportSize({ width: 1200, height: 1000 });
  await page.mouse.move(1, 1);
  await page.evaluate(() => window.__update({ reducedMotion: false }));
}

export async function verifyGenieMenuPreviews(page, base) {
  const href = '/docs/animations/genie-menu';
  await page.goto(base + '/components?category=navigation', { waitUntil: 'networkidle' });
  const card = page.locator(`[data-component-card="${href}"]`);
  await card.hover();
  await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const menu = card.frameLocator('iframe').locator('#menuCard');
  await expect(menu).toHaveAttribute('data-state', 'closed', { timeout: 7000 });
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.mouse.move(270, 5);
  await expect(card.locator('iframe')).toHaveCount(0);

  await page.goto(base + href, { waitUntil: 'networkidle' });
  const link = page.locator(`aside a[href="${href}"][aria-current="page"]`);
  const popup = page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();
  await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  const previewMenu = popup.frameLocator('iframe').locator('#menuCard');
  await expect(previewMenu).toHaveAttribute('data-state', 'closed', { timeout: 7000 });
  await expect(previewMenu).toHaveAttribute('data-state', 'open');
  await page.mouse.move(270, 5);
  await expect(popup).toHaveCount(0);
  await link.focus();
  await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();
  await expect(popup).toHaveCount(0);
}
