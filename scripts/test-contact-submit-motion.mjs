import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const output = path.resolve('work/contact-submit-01-20261027');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];

function sample(root) {
  const rect = root.getBoundingClientRect();
  const read = selector => {
    const node = root.querySelector(selector), css = getComputedStyle(node), r = node.getBoundingClientRect();
    return { opacity: Number(css.opacity), transform: css.transform, x: r.x, y: r.y, right: r.right, width: r.width, height: r.height };
  };
  return { state: root.dataset.state, disabled: root.disabled, busy: root.getAttribute('aria-busy'), x: rect.x, width: rect.width, height: rect.height,
    label: read('[data-submit-label]'), loader: read('[data-submit-loader]'), ring: read('[data-submit-ring]'), success: read('[data-submit-success]'), error: read('[data-submit-error]') };
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const errors = [], posts = [];
  let getMode = 'hold';
  const pendingGet = [], pendingPost = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { if (window === window.top) localStorage.setItem('theme', 'system'); });
  // Every contact request is intercepted; this exercises the real form without sending email.
  await page.route('**/api/contact', async route => {
    if (route.request().method() === 'GET') {
      if (getMode === 'hold') pendingGet.push(route);
      else if (getMode === 'abort') await route.abort('failed');
      else await route.fulfill({ json: { available: getMode === 'ready' } });
    } else {
      posts.push(route.request().postDataJSON());
      pendingPost.push(route);
    }
  });
  const dialog = page.locator('dialog[data-growing-panel="contact"]');
  const button = dialog.locator('[data-submit-button]');
  const open = async () => {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.documentElement.dataset.locale);
    await page.locator('header [data-contact-trigger="header"]').click();
    await dialog.waitFor({ state: 'visible' });
    await page.waitForTimeout(650);
  };
  const state = async expected => page.waitForFunction(expected => document.querySelector('dialog[open] [data-submit-button]')?.dataset.state === expected, expected);
  const waitPost = async () => {
    for (let i = 0; i < 100 && !pendingPost.length; i++) await page.waitForTimeout(25);
    assert(pendingPost.length, 'form reached the mocked contact endpoint');
    return pendingPost.shift();
  };
  const fill = async () => {
    await dialog.locator('[name="message"]').fill('这是一条验证提交按钮动效的留言，测试不会发送真实邮件。');
    await dialog.locator('[name="email"]').fill('reader@example.test');
  };

  await open();
  await state('checking');
  const checkingA = await button.evaluate(sample);
  await page.waitForTimeout(150);
  const checkingB = await button.evaluate(sample);
  assert(checkingA.disabled && checkingA.busy === 'true' && checkingA.loader.opacity === 1 && checkingA.ring.width > 18);
  assert.notEqual(checkingB.ring.transform, checkingA.ring.transform, 'service check has a visible rotating ring');
  assert.equal(pendingGet.length, 1);
  await pendingGet.shift().fulfill({ json: { available: true } });
  getMode = 'ready';
  await state('idle');
  await page.waitForTimeout(350);
  assert.equal((await button.evaluate(sample)).width, 104);

  await button.click();
  await state('invalid');
  assert.equal(posts.length, 0);
  assert(await dialog.locator('[name="message"]').evaluate(node => document.activeElement === node));
  await page.waitForTimeout(450);
  const repeatedFeedback = await button.evaluate(async node => {
    const frames = [], start = performance.now();
    node.click();
    return new Promise(resolve => {
      const tick = () => {
        frames.push(new DOMMatrix(getComputedStyle(node).transform).m41);
        if (performance.now() - start < 500) requestAnimationFrame(tick); else resolve(frames);
      };
      requestAnimationFrame(tick);
    });
  });
  assert(repeatedFeedback.some(x => x > 0.5) && repeatedFeedback.at(-1) === 0, 'repeated invalid attempts each get one light feedback');
  await fill();
  await dialog.locator('[name="url"]').fill('not-a-valid-link');
  await button.click();
  assert(await dialog.locator('[name="url"]').evaluate(node => document.activeElement === node));
  assert.equal(posts.length, 0);
  await dialog.locator('[name="url"]').fill('');
  await dialog.locator('fieldset label').nth(1).click();
  await button.click();
  assert.equal(await dialog.locator('[name="url"]').getAttribute('aria-invalid'), 'true');
  assert.equal(posts.length, 0);
  await dialog.locator('[name="url"]').fill('https://example.test/component');
  await dialog.locator('[name="name"]').fill('测试访客');
  const before = await button.boundingBox();
  await button.click();
  const failedRoute = await waitPost();
  await state('loading');
  await page.waitForTimeout(550);
  const sending = await button.evaluate(sample);
  assert(sending.disabled && sending.busy === 'true' && sending.loader.opacity === 1 && sending.error.opacity === 0);
  assert.equal(sending.width, before.width);
  assert.equal(await dialog.locator('input:not([name="website"]):not(:disabled)').count(), 0);
  await dialog.locator('form').evaluate(form => form.requestSubmit());
  assert.equal(posts.length, 1, 'busy form blocks duplicate submission');
  await page.screenshot({ path: path.join(output, 'sending-1440-light.png') });
  await failedRoute.fulfill({ status: 500, json: { error: 'delivery_failed' } });
  await state('error');
  await page.waitForTimeout(550);
  const failed = await button.evaluate(sample);
  assert(!failed.disabled && failed.error.opacity === 1 && failed.loader.opacity === 0 && failed.error.right < failed.label.x);
  assert.equal(await button.innerText(), '重试');
  assert.equal(await dialog.locator('[name="name"]').inputValue(), '测试访客');
  assert.equal(await dialog.locator('[name="url"]').inputValue(), 'https://example.test/component');
  await page.screenshot({ path: path.join(output, 'error-1440-light.png') });
  await button.click();
  const retryRoute = await waitPost();
  await retryRoute.fulfill({ json: { ok: true } });
  await state('success');
  await page.waitForTimeout(600);
  const succeeded = await button.evaluate(sample);
  assert(succeeded.disabled && succeeded.success.opacity === 1 && succeeded.error.opacity === 0 && succeeded.loader.opacity === 0);
  assert(succeeded.success.right < succeeded.label.x);
  assert.deepEqual(posts[0], posts[1], 'retry preserves the exact form payload');
  await page.screenshot({ path: path.join(output, 'success-1440-light.png') });
  results.push({ checking: true, fieldValidation: true, requiredSubmissionLink: true, duplicatePrevention: true, serverFailure: true, retry: true, payloadPreserved: true, fastResponse: true });

  await open();
  await state('idle');
  await fill();
  await page.keyboard.press('Tab');
  await button.focus();
  assert(await button.evaluate(node => getComputedStyle(node).outlineStyle === 'solid'));
  await page.keyboard.press('Enter');
  await (await waitPost()).abort('failed');
  await state('error');
  await button.click();
  const reducedRoute = await waitPost();
  await page.waitForTimeout(400);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(200);
  const reducedA = await button.evaluate(sample);
  await page.waitForTimeout(160);
  assert.deepEqual(await button.evaluate(sample), reducedA, 'reduced motion stops the spinner');
  await reducedRoute.fulfill({ json: { ok: true } });
  await state('success');
  assert.equal((await button.evaluate(sample)).success.opacity, 1);
  results.push({ networkFailure: true, keyboardSubmit: true, reducedMotionDuringSending: true });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  getMode = 'unconfigured';
  await open();
  await state('unavailable');
  assert(await button.isDisabled());
  assert.equal((await button.evaluate(sample)).loader.opacity, 0);
  assert(await dialog.getByText('网站发信服务尚未配置，暂时无法直接提交。您可以使用下方邮件链接联系我。').isVisible());
  getMode = 'abort';
  await open();
  await state('unavailable');
  assert(await button.isDisabled());
  results.push({ serviceUnavailableStopsLoading: true, emailFallbackRetained: true });

  getMode = 'ready';
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme });
      await open();
      await state('idle');
      await fill();
      await button.click();
      const route = await waitPost();
      await page.waitForTimeout(500);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const geometry = await button.boundingBox();
      assert(geometry.x >= 0 && geometry.x + geometry.width <= width);
      await page.screenshot({ path: path.join(output, `contact-${width}-${theme}.png`) });
      await route.fulfill({ json: { ok: true } });
      await state('success');
      results.push({ width, theme, overflow: false, sending: true, success: true });
    }
  }

  await page.evaluate(() => localStorage.setItem('leibox:locale', 'en'));
  getMode = 'hold';
  await open();
  await state('checking');
  const english = await button.evaluate(sample);
  assert.equal(english.width, 120);
  assert(english.label.right <= english.x + english.width && english.label.x > english.loader.x + english.loader.width, 'English checking text fits beside the ring');
  await pendingGet.shift().fulfill({ json: { available: true } });
  getMode = 'ready';
  await state('idle');
  await fill();
  await button.click();
  const lastRoute = await waitPost();
  await page.getByRole('button', { name: 'Close contact form', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await lastRoute.fulfill({ json: { ok: true } });
  await page.locator('header [data-contact-trigger="header"]').click();
  await state('success');
  await page.waitForTimeout(600);
  assert.equal((await button.evaluate(sample)).success.opacity, 1, 'response received while closed is shown when reopened');
  results.push({ englishCaptionsFit: true, closeAndReopenDuringRequest: true, noRealEmails: true });
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ base, results, interceptedPosts: posts.length, browserErrors: errors }, null, 2));
  console.log('PASS: real contact form with selected 01 motion, availability, validation, loading, success, failures/retry, reduced motion, responsive themes, English and close/reopen. All mail requests intercepted.');
} finally { await browser.close(); }
