import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyBlisterDropdown(page) {
  const scene = page.locator('#demo .blister-stage');
  const trigger = scene.getByRole('button');
  const panel = scene.locator('.blister-panel');
  const flight = scene.locator('.blister-flight');
  const openRow = scene.getByRole('option', { name: 'open 4' });
  const closedRow = scene.getByRole('option', { name: 'closed 3' });
  await expect(trigger).toHaveAccessibleName('Show all');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(scene.getByRole('option', { name: 'all 7' })).toHaveAttribute('aria-selected', 'true');

  await page.evaluate(() => {
    window.__blisterChanges = [];
    window.__update({ sound: false, onValueChange: value => window.__blisterChanges.push(value) });
  });
  const pocket = closedRow.locator('.blister-pocket');
  const position = await pocket.boundingBox();
  await closedRow.click();
  await expect(closedRow).toHaveAttribute('aria-selected', 'true');
  await expect(flight).toBeVisible();
  assert.deepEqual(await pocket.boundingBox(), position, 'the original socket stays in the foil');
  await expect(closedRow.locator('.blister-cavity')).toBeVisible();
  await expect.poll(async () => (await flight.boundingBox())?.y ?? position.y).toBeLessThan(position.y - 18);
  await expect(trigger).toHaveAccessibleName('Show closed');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toHaveAttribute('inert', '');
  await expect(flight).toBeHidden();

  await trigger.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(scene.getByRole('option', { name: 'all 7' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(openRow).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAccessibleName('Show open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  assert.deepEqual(await page.evaluate(() => window.__blisterChanges), ['closed', 'open']);

  await page.evaluate(() => window.__update({ autoClose: false, expanded: true, value: 'all', counts: { open: 8 }, reducedMotion: true }));
  await expect(trigger).toHaveAccessibleName('Show all');
  const updated = scene.getByRole('option', { name: 'open 8' });
  await updated.click();
  await expect(trigger).toHaveAccessibleName('Show open');
  await expect(flight).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await updated.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  assert.deepEqual(await page.evaluate(() => window.__blisterChanges), ['closed', 'open', 'open']);
}
