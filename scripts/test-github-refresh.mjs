import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, expect } from 'playwright/test';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3189';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const status of [403, 200]) {
    const context = await browser.newContext(), page = await context.newPage();
    let calls = 0;
    await context.route('https://api.github.com/repos/**', route => {
      calls++;
      return route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(status === 200 ? { stargazers_count: 62 } : { message: 'rate limit exceeded' }) });
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await expect.poll(() => calls).toBeGreaterThan(0);
    for (let i = 0; i < 6; i++) { await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(80); }
    report.push({ status, calls });
    assert.equal(calls, 1, `Repeated focus must respect ${status === 200 ? 'the cached value' : 'the failure cooldown'}`);
    await context.close();
  }
} finally { await browser.close(); }
await fs.writeFile('outputs/performance-fix-20261106/github-refresh.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
