import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

/** Exercise the real desktop components through the copied framework entry. */
export async function verifyDeepAgent(page, item) {
  const stage = page.locator('#demo [data-original-ready]');
  await expect(stage).toBeVisible();
  const composer = item.slug === 'deep-agent-composer';
  const trigger = stage.locator('.composer-model-tools .morph-menu-compact button');
  const modelShell = stage.locator('.composer-model-tools .morph-menu-shell');
  if (composer) {
    await expect(stage.locator('textarea')).toHaveAttribute('placeholder', '尽管问...');
    await expect(stage.getByRole('button', { name: 'Context 0%', exact: true })).toBeVisible();
    await expect(modelShell).toHaveAttribute('data-state', 'closed');
    await trigger.click();
  }
  const slider = stage.getByRole('slider', { name: '推理强度' });
  await expect(slider).toHaveAttribute('aria-valuetext', '中度');
  await page.evaluate(() => {
    window.__depths = []; window.__models = []; window.__messages = [];
    window.__update({ onValueChange: value => window.__depths.push(value), onModelChange: value => window.__models.push(value), onSubmit: value => window.__messages.push(value) });
  });
  await stage.getByRole('button', { name: '深度', exact: true }).click();
  await expect(slider).toHaveAttribute('aria-valuetext', '深度');
  await stage.getByRole('button', { name: '深度', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__depths), ['deep']);
  await slider.focus(); await slider.press('Home'); await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', '中度');
  assert.deepEqual(await page.evaluate(() => window.__depths), ['deep', 'simple', 'medium']);
  const track = stage.locator('.reasoning-effort-input'), rect = await track.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 15); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width - 16, rect.y + 15, { steps: 6 }); await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuetext', '深度');
  await page.evaluate(() => window.__update({ value: 'simple', reducedMotion: true }));
  await expect(slider).toHaveAttribute('aria-valuetext', '简单');
  await expect.poll(() => stage.locator('.reasoning-effort').evaluate(node => +node.style.getPropertyValue('--effort-ratio'))).toBe(0);
  await page.evaluate(() => window.__update({ value: 'medium', reducedMotion: false }));
  await expect(slider).toHaveAttribute('aria-valuetext', '中度');

  if (composer) {
    await stage.locator('[data-menu-item="deepseek-reasoner"]').click();
    assert.deepEqual(await page.evaluate(() => window.__models), ['deepseek-reasoner']);
    await page.keyboard.press('Escape');
    await expect(modelShell).toHaveAttribute('data-state', 'closed');
    const permission = stage.locator('.composer-primary-tools .morph-menu-compact button');
    await permission.click();
    await stage.locator('[data-menu-item="full"]').click();
    await expect(permission).toContainText('完全访问');
    const input = stage.locator('textarea'), send = stage.locator('.composer-send-btn');
    await expect(send).toBeDisabled();
    await input.fill('原版输入框测试');
    await stage.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('original attachment') });
    await expect(stage.getByText('notes.txt', { exact: true })).toBeVisible();
    await expect(stage.getByText('文本', { exact: true })).toBeVisible();
    await input.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__messages.length)).toBe(1);
    const submitted = await page.evaluate(() => window.__messages[0]);
    assert.equal(submitted.text, '原版输入框测试'); assert.equal(submitted.permission, 'full_access');
    assert.equal(submitted.model, 'deepseek-reasoner'); assert.equal(submitted.attachments[0].name, 'notes.txt');
    assert.equal(submitted.attachments[0].extractedText, 'original attachment');
    await expect(input).toHaveValue('');
    await input.fill('第一行'); await input.press('Shift+Enter'); await input.press('a');
    assert((await input.inputValue()).includes('\n'));
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    assert.equal(await page.evaluate(() => window.__messages.length), 1);
    await input.fill(''); await trigger.click();
  }
  await page.evaluate(() => window.__update({ value: 'medium', reducedMotion: true }));
  await page.evaluate(() => window.__mount('second'));
  const second = page.locator('#second [data-original-ready]');
  await expect(second).toBeVisible();
  if (composer) await second.locator('.composer-model-tools .morph-menu-compact button').click();
  await second.getByRole('button', { name: '深度', exact: true }).click();
  if (composer) await expect(trigger).toContainText('中度');
  else await expect(slider).toHaveAttribute('aria-valuetext', '中度');
  await expect(second.getByRole('slider')).toHaveAttribute('aria-valuetext', '深度');
  await page.evaluate(() => window.__unmount('second'));
}
