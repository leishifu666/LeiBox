import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, expect } from 'playwright/test';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3189';
const output = 'outputs/performance-fix-20261106';
await fs.mkdir(output, { recursive: true });
const metadata = await fs.readFile('src/data/site-motion.json', 'utf8').then(JSON.parse).catch(() => ({ components: {} }));
const source = metadata.components['crumpled-paper']?.documentUrl || '/motion/crumpled-paper.html';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(), requests = [], errors = [], events = [];
  page.on('request', request => { if (new URL(request.url()).pathname === source) { requests.push(request.resourceType()); events.push({ type: request.resourceType(), at: Date.now(), event: 'start' }); } });
  page.on('requestfailed', request => { if (new URL(request.url()).pathname === source) events.push({ event: 'failed', failure: request.failure(), at: Date.now() }); });
  page.on('pageerror', error => errors.push(error.message));
  await context.route(url => url.pathname === source, async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue().catch(() => {});
  });
  await page.goto(base + '/components', { waitUntil: 'networkidle' });
  const card = page.locator('[data-component-card="/docs/animations/crumpled-paper"]');
  await page.mouse.move(0, 0); await card.scrollIntoViewIfNeeded();
  const first = page.waitForRequest(request => new URL(request.url()).pathname === source);
  await card.hover(); await first; await card.locator('h2').click();
  await page.waitForURL('**/docs/animations/crumpled-paper', { waitUntil: 'domcontentloaded' });
  const frame = page.frameLocator('iframe[title="揉皱纸张展开"]');
  await expect(frame.locator('.crumple-demo')).toHaveAttribute('data-motion-ready', 'true', { timeout: 20000 });
  await fs.writeFile(`${output}/browser-events.json`, JSON.stringify(events, null, 2));
  assert.equal(requests.length, 1, 'Hover then open must download the shared document once');
  await frame.locator('.cp-hit').first().focus(); await page.keyboard.press('Escape'); await page.keyboard.press('Enter');
  await expect(frame.locator('.cp-hit').first()).toHaveAttribute('aria-expanded', 'true');
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${output}/detail-${width}.png` });
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${output}/browser-dedup.json`, JSON.stringify({ source, requests, keyboardInteraction: true, errors }, null, 2));
  await context.close();
  console.log('Shared hover/detail download, keyboard interaction and responsive widths passed.');
} finally { await browser.close(); }
