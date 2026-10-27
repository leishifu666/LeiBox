import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const output = path.resolve('work/submit-state-six-20261027');
const results = [];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

function measure() {
  return [...document.querySelectorAll('[data-submit-button]')].map(root => {
    const data = selector => {
      const node = root.querySelector(selector), rect = node.getBoundingClientRect(), css = getComputedStyle(node);
      return { x: rect.x, y: rect.y, right: rect.right, width: rect.width, height: rect.height, opacity: Number(css.opacity), transform: css.transform };
    };
    const rect = root.getBoundingClientRect();
    return { id: root.dataset.variant, state: root.dataset.state, disabled: root.disabled, busy: root.getAttribute('aria-busy'),
      width: rect.width, x: rect.x, y: rect.y, height: rect.height, label: data('[data-submit-label]'), loader: data('[data-submit-loader]'),
      ring: data('[data-submit-ring]'), dot: data('[data-submit-dot]'), fill: data('[data-submit-fill]'),
      success: data('[data-submit-success]'), error: data('[data-submit-error]'),
      parent: root.parentElement.getBoundingClientRect().toJSON(), text: root.textContent,
    };
  });
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, colorScheme: 'light' });
  const errors = [], posts = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
  assert.equal((await page.goto(base + '/submit-state-preview', { waitUntil: 'domcontentloaded' })).status(), 200);
  await page.waitForFunction(() => document.querySelectorAll('[data-submit-button]').length === 6 && [...document.querySelectorAll('[data-submit-button]')].every(e => !!e.style.width));
  await page.waitForTimeout(350);
  const idle = await page.evaluate(measure);
  assert(idle.every(row => row.state === 'idle' && row.width === 104));
  const start = page.getByRole('button', { name: '同时演示六版' });
  await start.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(650);
  const first = await page.evaluate(measure);
  assert(first.every(row => row.state === 'loading' && row.disabled && row.busy === 'true'));
  assert.equal(await page.locator('textarea:disabled').count(), 6, 'fields disabled while sending');
  assert(first[0].loader.opacity > 0.9 && first[0].ring.opacity > 0.9 && first[0].ring.width > 18, 'ring is visible at its intended size');
  assert(first[1].loader.opacity > 0.9 && first[1].dot.opacity > 0.9, 'dots are visible');
  assert(first[2].fill.width > 1 && first[2].fill.height === 40, 'background scan occupies the button');
  assert(Math.abs(first[3].width - 40) < 0.1 && first[3].ring.opacity > 0.9, 'circle shape has a visible loader');
  assert(first[3].label.opacity === 0, 'circle hides visual text while retaining accessible name');
  await page.waitForTimeout(230);
  const second = await page.evaluate(measure);
  assert.notEqual(second[0].ring.transform, first[0].ring.transform, 'ring rotates');
  assert.notEqual(second[1].dot.transform, first[1].dot.transform, 'dots move');
  assert.notEqual(second[2].fill.transform, first[2].fill.transform, 'scan moves');
  assert.notEqual(second[4].label.opacity, first[4].label.opacity, 'text has a waiting rhythm');
  assert.notEqual(second[5].width, first[5].width, 'pulse moves');
  second.forEach((row, i) => {
    assert(Math.abs(row.parent.x - idle[i].parent.x) < 0.1 && Math.abs(row.parent.width - idle[i].parent.width) < 0.1, 'reserved button space prevents layout shifts');
  });
  await page.screenshot({ path: path.join(output, 'motion-1440-light.png'), fullPage: true });
  await page.waitForTimeout(2400);
  const success = await page.evaluate(measure);
  assert(success.every(row => row.state === 'success' && row.disabled && row.success.opacity > 0.99 && row.loader.opacity === 0));
  success.forEach(row => assert(row.success.right < row.label.x, 'success icon and label do not overlap'));
  results.push({ sixDistinctLoadingMotions: true, visibleDecorations: true, stableLayout: true, success: true, keyboard: true });

  await page.getByRole('button', { name: '发送失败', exact: true }).click();
  await start.click();
  await page.waitForTimeout(400);
  assert((await page.evaluate(measure)).every(row => row.success.opacity < 0.01), 'old success icon leaves before retry');
  await page.waitForTimeout(2800);
  const failed = await page.evaluate(measure);
  assert(failed.every(row => row.state === 'error' && !row.disabled && row.error.opacity > 0.99));
  failed.forEach(row => assert(row.error.right < row.label.x, 'error icon and label do not overlap'));
  const messages = await page.locator('textarea').evaluateAll(nodes => nodes.map(n => n.value));
  await page.locator('[data-submit-button]').evaluateAll(nodes => nodes.forEach(n => n.click()));
  await page.waitForTimeout(3200);
  assert((await page.evaluate(measure)).every(row => row.state === 'success' && row.error.opacity === 0 && row.success.opacity > 0.99), 'all retry paths succeed without a stale error icon');
  assert.deepEqual(await page.locator('textarea').evaluateAll(nodes => nodes.map(n => n.value)), messages, 'retry preserves content');
  results.push({ failure: true, allSixRetries: true, draftPreserved: true });

  await page.getByRole('button', { name: '发送成功', exact: true }).click();
  await start.click();
  await page.waitForTimeout(170);
  await page.getByRole('button', { name: '校验未通过', exact: true }).click();
  await start.click();
  await page.waitForTimeout(500);
  const invalid = await page.evaluate(measure);
  assert(invalid.every(row => row.state === 'invalid' && !row.disabled && row.width === 104 && row.label.opacity === 1 && row.loader.opacity === 0), 'validation interrupts loading into a readable stable state');
  await page.waitForTimeout(2200);
  assert((await page.evaluate(measure)).every(row => row.state === 'invalid'), 'invalid fields never start a send');
  const card = page.locator('[data-submit-card="1"]');
  await card.getByRole('button', { name: '请检查', exact: true }).click();
  assert(await card.locator('textarea').evaluate(node => document.activeElement === node), 'invalid submit focuses the field');
  await card.locator('textarea').fill('这是一条足够长的测试留言，不会发送真实请求。');
  await card.getByRole('button', { name: '提交', exact: true }).click();
  await page.waitForTimeout(3000);
  assert.equal(await card.getAttribute('data-status'), 'success');
  results.push({ invalidStopsSending: true, fieldFocus: true, invalidRecovery: true, interruptedCircle: true });

  await page.getByRole('button', { name: '发送成功', exact: true }).click();
  await start.click();
  await page.waitForTimeout(350);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const reducedA = await page.evaluate(measure);
  await page.waitForTimeout(200);
  const reducedB = await page.evaluate(measure);
  assert.deepEqual(reducedB, reducedA, 'reduced motion stops all active motion');
  reducedA.forEach(row => {
    assert.equal(row.width, 104);
    assert.equal(row.loader.width, 20);
    assert(Math.abs(row.loader.y + 10 - (row.y + 20)) < 0.2, 'static loading ring stays vertically centered');
  });
  await page.waitForTimeout(2600);
  assert((await page.evaluate(measure)).every(row => row.success.opacity > 0.99), 'reduced motion still communicates the result');
  results.push({ reducedMotionDuringPlayback: true, staticGeometry: true });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await page.waitForTimeout(350);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme });
      await page.waitForFunction(t => document.documentElement.classList.contains(t), theme);
      await page.waitForTimeout(120);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no horizontal overflow at ${width}/${theme}`);
      assert.equal(await page.locator('[data-submit-card]').count(), 6);
      await page.screenshot({ path: path.join(output, `preview-${width}-${theme}.png`), fullPage: true });
      results.push({ width, theme, overflow: false, cards: 6 });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('checkbox', { name: '半速观看' }).check();
  await start.click();
  await page.waitForTimeout(3000);
  assert((await page.evaluate(measure)).every(row => row.state === 'loading'), 'slow preview has time to compare loops');
  await page.getByRole('link', { name: '返回网站' }).click();
  await page.waitForURL(base + '/');
  await page.waitForTimeout(2100);
  assert.deepEqual(errors, []);
  assert.deepEqual(posts, [], 'preview never submits real messages');
  results.push({ slowPlayback: true, unmountDuringSending: true, noRealSubmissions: true, browserErrors: [] });
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ base, results }, null, 2));
  console.log('PASS: six animated states, bounded geometry, success/error/retry, validation/focus, interrupted loading, reduced motion, responsive light/dark, unmount cleanup and no real sends.');
} finally { await browser.close(); }
