import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/screenshots');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const records = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { try { localStorage.setItem('leibox:locale', 'zh'); localStorage.setItem('theme', 'light'); } catch {} });
  for (const [route, filename] of [['/', 'leibox-home.png'], ['/components', 'leibox-components.png'], ['/docs/animations/glass-folder', 'leibox-glass-folder.png']]) {
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    if (route.endsWith('glass-folder')) {
      // Open the actual component through its real button, without replacing any DOM or images.
      const folder = page.frameLocator('iframe[title="玻璃文件夹展开"]').getByRole('button', { name: 'Open My Files, 3 items', exact: true });
      await folder.press("Enter");
      await page.frameLocator('iframe[title="玻璃文件夹展开"]').locator('button.gf-hit[aria-expanded="true"]').first().waitFor({ state: 'attached', timeout: 5000 });
    }
    const destination = path.join(output, filename);
    await page.screenshot({ path: destination });
    const bytes = await fs.readFile(destination);
    records.push({ route, title: await page.title(), filename, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
const manifest = {
  captureDate: '2026-10-28', timezone: 'Asia/Shanghai', base,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  version: 'Working tree with nine restored local original effects, selected painting backgrounds and learning-use notices.',
  viewport: { width: 1440, height: 1100 }, locale: 'zh', theme: 'light', reducedMotion: 'reduce',
  method: 'Direct Playwright screenshots of running pages. No image generation, compositing, DOM substitution or injected screenshot CSS.',
  records,
};
await fs.writeFile(path.join(output, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(output, 'README.md'), `# 当前页面截图\n\n采集日期：2026-10-28（Asia/Shanghai）。\n\n来自当前工作树构建后运行的本地网站 ${base}，不是线上部署状态的证明。视口为 1440 × 1100，中文、浅色主题，启用系统减少动态效果。\n\n${records.map(record => '- `' + record.filename + '`：`' + record.route + '`').join('\n')}\n\n玻璃文件夹截图通过键盘激活实际的 Open My Files 按钮进入展开状态。所有图片均为浏览器直接截图，未生成、拼接或替换页面元素。截图 SHA-256 和基准提交见 [capture.json](capture.json)。\n\n复现：先运行 npm run build 和 npm start，再运行 node scripts/capture-readme-screenshots.mjs。\n`);
console.log(JSON.stringify({ screenshots: records.length, routes: records.map(record => record.route), output }));
