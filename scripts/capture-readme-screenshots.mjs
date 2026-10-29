import { chromium, expect } from 'playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const output = path.resolve('docs/screenshots');
const captures = [
  { route: '/', filename: 'leibox-home.png', label: '首页', state: '首页首屏与组件预览', height: 1280 },
  { route: '/components', filename: 'leibox-components.png', label: '组件浏览', state: '无外框的组件列表', height: 1100 },
  { route: '/docs/animations/glass-folder', filename: 'leibox-glass-folder.png', label: '玻璃文件夹交互', state: '键盘打开 My Files 文件夹', height: 1100 },
  { route: '/docs/components/glass-object', filename: 'leibox-glass-object.png', label: '玻璃物体与自定义背景', state: '模型加载完成，使用选定的雪山湖泊背景', height: 1100 },
  { route: '/docs/mcp', filename: 'leibox-ai-integration.png', label: 'AI 接入', state: '新域名的 Skill 安装命令与实时检索说明', height: 1100 },
];
const now = new Date();
const captureDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const capturedAt = new Date(now.getTime() + 8 * 3600000).toISOString().replace('Z', '+08:00');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const records = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce', colorScheme: 'light' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { try { localStorage.setItem('leibox:locale', 'zh'); localStorage.setItem('theme', 'light'); } catch {} });
  for (const { route, filename, label, state, height } of captures) {
    await page.setViewportSize({ width: 1440, height });
    const response = await page.goto(base + route, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('h1').first()).toBeVisible();
    let captureState = state;
    if (route === '/components') {
      await expect(page.locator('[data-component-card]').first()).toBeVisible();
      captureState += `（${await page.locator('[data-component-card]').count()} 项）`;
    }
    if (route.endsWith('glass-folder')) {
      // Open the actual component through its real button, without replacing any DOM or images.
      const frame = page.frameLocator('iframe[title="玻璃文件夹展开"]');
      await expect(frame.locator('body')).toHaveAttribute('data-motion-ready', 'true');
      const folder = frame.getByRole('button', { name: 'Open My Files, 3 items', exact: true });
      await folder.press("Enter");
      await expect(frame.locator('.gf-root').first().locator('button.gf-hit')).toHaveAttribute('aria-expanded', 'true');
      await frame.locator('.gf-root').first().evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running' && Number.isFinite(animation.effect?.getComputedTiming().endTime) && animation.effect.getComputedTiming().endTime - Number(animation.currentTime) < 1500).map(animation => animation.finished.catch(() => {})));
      });
    }
    if (route.endsWith('glass-object')) {
      const demo = page.locator('div[class*="h-[420px]"]').first();
      await expect(demo.locator('canvas')).toBeVisible();
      await expect(demo.locator('.pointer-events-none.absolute.inset-x-0.bottom-3')).toHaveCount(0, { timeout: 30000 });
    }
    await page.waitForFunction(() => [...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    }).every(image => image.complete && image.naturalWidth > 0));
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().filter(animation => animation.playState === 'running' && Number.isFinite(animation.effect?.getComputedTiming().endTime) && animation.effect.getComputedTiming().endTime - Number(animation.currentTime) < 1500).map(animation => animation.finished.catch(() => {})));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const destination = path.join(output, filename);
    await page.screenshot({ path: destination });
    const bytes = await fs.readFile(destination);
    records.push({ route, label, state: captureState, title: await page.title(), filename, viewport: page.viewportSize(), sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
    console.log(`Captured ${route}: ${filename}`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
const manifest = {
  captureDate, capturedAt, timezone: 'Asia/Shanghai', base,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTreeDirty: Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()),
  buildId: (await fs.readFile('.next/BUILD_ID', 'utf8')).trim(),
  version: 'Current locally built working tree. Includes uncommitted local changes; does not represent the deployed website.',
  locale: 'zh', theme: 'light', reducedMotion: 'reduce',
  method: 'Direct Playwright screenshots of running pages. No image generation, compositing, DOM substitution or injected screenshot CSS.',
  records,
};
await fs.writeFile(path.join(output, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(output, 'README.md'), `# 当前页面截图\n\n采集日期：${captureDate}（Asia/Shanghai）。\n\n来自当前工作树构建后运行的本地网站 ${base}，包含尚未提交的本地修改，不代表线上部署已同步。中文、浅色主题，启用系统减少动态效果。\n\n| 截图 | 页面 | 实际状态 | 视口 |\n| --- | --- | --- | --- |\n${records.map(record => '| [' + record.label + '](' + record.filename + ') | ' + record.route + ' | ' + record.state + ' | ' + record.viewport.width + ' × ' + record.viewport.height + ' |').join('\n')}\n\n玻璃文件夹截图通过键盘激活实际的 Open My Files 按钮，等待展开完成；玻璃物体截图等待真实模型加载完成。所有图片均为浏览器直接截图，未生成、拼接或替换页面元素，也没有注入截图专用样式。\n\n采集时间、构建编号、基准提交和各图 SHA-256 见 [capture.json](capture.json)。\n\n复现：先运行 npm run build 和 npm start，再运行 node scripts/capture-readme-screenshots.mjs。\n`);
console.log(JSON.stringify({ screenshots: records.length, routes: records.map(record => record.route), output }));
