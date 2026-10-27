import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium, expect } from 'playwright/test';
import sharp from 'sharp';
import { buildDeepAgentSources } from './build-deep-agent-source.mjs';

const referenceRoot = path.resolve(process.env.DEEP_AGENT_SOURCE || '../deepagent/apps/desktop');
const output = path.resolve('outputs/deep-agent-original');
await fs.mkdir(output, { recursive: true });
const manifest = JSON.parse(await fs.readFile('src/lib/DeepAgent/original/manifest.json', 'utf8'));
for (const entry of manifest.files) {
  const [original, imported] = await Promise.all([fs.readFile(path.join(referenceRoot, 'src', entry.file)), fs.readFile(path.join('src/lib/DeepAgent/original', entry.file + '.source'))]);
  assert.equal(createHash('sha256').update(original).digest('hex'), entry.sha256, entry.file + ' matches the original');
  assert.deepEqual(imported, original, entry.file + ' is imported byte for byte');
}
await buildDeepAgentSources({ referenceRoot });
const server = http.createServer(async (request, response) => {
  const name = path.basename(new URL(request.url, 'http://localhost').pathname);
  const file = name.startsWith('reference-') ? path.join(output, name) : path.join('public/motion', name);
  try { response.setHeader('content-type', 'text/html; charset=utf-8'); response.end(await fs.readFile(file)); }
  catch { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const reports = [], errors = [];
try {
  for (const slug of ['reasoning-effort-slider', 'deep-agent-composer']) {
    const composer = slug === 'deep-agent-composer';
    for (const width of [375, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
      const pages = await Promise.all([context.newPage(), context.newPage()]);
      for (const page of pages) page.on('pageerror', error => errors.push(error.message));
      await pages[0].goto(`${base}/reference-${slug}.html`);
      await pages[1].goto(`${base}/${slug}.html`);
      for (const page of pages) await expect(page.locator('[data-original-ready]')).toBeVisible();
      async function compare(state) {
        const shots = [];
        for (const [index, page] of pages.entries()) {
          await page.mouse.move(1, 1);
          await page.locator('[data-original-ready]').evaluate(node => node.getRootNode().activeElement?.blur());
          await expect.poll(() => page.locator('[data-original-ready]').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running' && animation.effect.getTiming().iterations !== Infinity).length)).toBe(0);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          shots.push(await page.locator('[data-motion-surface]').screenshot({ path: path.join(output, `${slug}-${width}-${state}-${index ? 'migrated' : 'reference'}.png`) }));
        }
        const [a, b] = await Promise.all(shots.map(shot => sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
        assert.deepEqual(a.info, b.info);
        let mismatches = 0;
        for (let i = 0; i < a.data.length; i += 4) if (!a.data.subarray(i, i + 4).equals(b.data.subarray(i, i + 4))) mismatches++;
        reports.push({ slug, width, state, mismatchedPixels: mismatches, totalPixels: a.info.width * a.info.height });
        assert.equal(mismatches, 0, `${slug} ${width} ${state} matches the directly rendered original UI`);
      }
      await compare(composer ? 'closed' : 'medium');
      if (composer) {
        for (const page of pages) await page.locator('.composer-model-tools .morph-menu-compact button').click();
        await compare('model-open');
      }
      for (const page of pages) await page.getByRole('button', { name: '深度', exact: true }).click();
      await compare('deep');
      if (composer) {
        for (const page of pages) { await page.keyboard.press('Escape'); await page.locator('.composer-primary-tools .morph-menu-compact button').click(); }
        await compare('permissions-open');
        for (const page of pages) await page.locator('[data-menu-item="full"]').click();
        await compare('full-access');
      }
      await context.close();
    }
    const mobile = await browser.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true });
    const page = await mobile.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/${slug}.html`);
    if (composer) {
      await page.locator('.composer-model-tools .morph-menu-compact button').tap();
      await expect(page.locator('.composer-model-tools .morph-menu-shell')).toHaveCSS('overflow', 'visible');
    }
    const track = page.locator('.reasoning-effort-input'), slider = page.getByRole('slider', { name: '推理强度' });
    const rect = await track.boundingBox();
    await page.touchscreen.tap(rect.x + rect.width - 16, rect.y + 15);
    await expect(slider).toHaveAttribute('aria-valuetext', '深度');
    await page.getByRole('button', { name: '中度', exact: true }).click();
    await expect(slider).toHaveAttribute('aria-valuetext', '中度');
    const canvas = page.locator('canvas');
    await expect.poll(() => page.locator('.reasoning-effort').evaluate(node => +node.style.getPropertyValue('--effort-ratio'))).toBe(.5);
    const image = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(100);
    assert.notEqual(await canvas.evaluate(node => node.toDataURL()), image, 'original Canvas animates');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(50);
    const still = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(100);
    assert.equal(await canvas.evaluate(node => node.toDataURL()), still, 'original Canvas stops in reduced motion');
    await page.setViewportSize({ width: composer ? 900 : 520, height: 700 });
    await page.locator('[data-original-ready]').evaluate(node => node.getRootNode().activeElement?.blur());
    await page.mouse.move(1, 1);
    await page.locator('[data-motion-surface]').screenshot({ path: path.resolve('public/assets/components', slug + '.png') });
    await mobile.close();
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'comparison-results.json'), JSON.stringify({ originalFiles: manifest.files.length, byteIdentical: true, comparison: 'Direct rendering of the source desktop components with local service adapters; not the full Tauri backend.', checks: reports, touch: true, canvasMotion: true, reducedMotion: true, pageErrors: errors }, null, 2));
  console.log(`PASS: ${manifest.files.length} byte-identical original files, ${reports.length} pixel-identical states, touch, Canvas and reduced motion.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
