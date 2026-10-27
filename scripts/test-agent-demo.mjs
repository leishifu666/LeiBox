import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const output = path.resolve('outputs/agent-demo-recovery');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, 'home page renders successfully');
  const section = page.locator('section[aria-labelledby="agent-demo-heading"]');
  const stage = section.locator('div[aria-hidden]');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('[data-ad-card]')).toHaveCount(6);
  await expect(stage.locator('[data-ad-dock]')).toHaveCount(4);
  await expect(stage.locator('[data-ad-app="claude"]')).toContainText('components/ui/');
  await section.getByRole('button', { name: 'Codex', exact: true }).click();
  await expect(stage.locator('[data-ad-app="codex"]')).toContainText('components/ui/');
  await expect(section.getByRole('button', { name: 'Codex', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await stage.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `home page fits ${width}px`);
    const broken = await stage.locator('img').evaluateAll(images => images.filter(image => image.complete && !image.naturalWidth).map(image => image.src));
    assert.deepEqual(broken, []);
    await section.screenshot({ path: path.join(output, `agent-demo-${width}.png`) });
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('[data-ad-copy]')).toBeVisible({ timeout: 12000 });
  await expect(stage.locator('[data-ad-app="claude"]')).toHaveCSS('opacity', '1', { timeout: 12000 });
  await expect(stage.locator('[data-ad-app="claude"]')).toContainText('components/ui/', { timeout: 16000 });
  await expect(stage.locator('[data-ad-app="codex"]')).toHaveCSS('opacity', '1', { timeout: 16000 });
  await expect(stage.locator('[data-ad-app="codex"]')).toContainText('components/ui/', { timeout: 16000 });
  await page.goto(base + '/docs/animations/reasoning-effort-slider', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ homeStatus: 200, widths: [375, 768, 1440], cards: 6, dock: 4, reducedMotionSwitch: true, normalPlayback: ['copy', 'claude', 'codex'], componentDocs: true, pageErrors: errors }, null, 2));
  console.log('PASS: home page, six-card gallery, Dock, Claude/Codex playback, reduced-motion switching, component docs and three widths.');
} finally { await browser.close(); }
