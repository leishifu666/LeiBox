const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const checks = [];
  function check(name, value) { assert(value, name); checks.push(name); console.log(`PASS ${name}`); }
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.addInitScript(() => { window.__openedUrls = []; window.open = url => { window.__openedUrls.push(String(url)); return null; }; });
    const page = await context.newPage();
    await page.goto(`${base}/docs/components/ascii-object`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    check('New wordmark has LeiBox accessible name', await page.locator('img[alt="LeiBox"]').first().isVisible());
    check('Document title belongs to LeiBox', (await page.title()).includes('LeiBox'));
    check('No playground entry on component page', await page.locator('a[href^="/playground"]').count() === 0);
    const trigger = page.getByRole('button', { name: '复制给 AI', exact: true });
    await trigger.click();
    const menu = page.getByRole('menu', { name: '复制给 AI' });
    await menu.waitFor();
    check('Six requested AI actions remain', await menu.getByRole('menuitem').count() === 6);
    check('v0 is removed', !(await menu.innerText()).includes('v0'));
    const copies = [
      ['复制提示词', text => text.includes('LeiBox reference: ASCII Object') && text.includes('@canvas-ui/ascii-object-react') && text.includes('Current configuration')],
      ['复制当前配置代码', text => text.includes('AsciiObject') && text.includes('import')],
      ['复制页面 Markdown', text => text.startsWith('# ASCII Object') && text.includes(`${base}/docs/components/ascii-object`) && text.includes('## Props')],
      ['复制演示源码', text => text.includes('AsciiObject') && text.includes('import')],
    ];
    for (const [label, valid] of copies) {
      if (!(await menu.isVisible())) await trigger.click();
      await menu.getByRole('menuitem', { name: label, exact: true }).click();
      const text = await page.evaluate(() => navigator.clipboard.readText());
      check(label, valid(text));
      await menu.waitFor({ state: 'hidden' });
    }
    await page.evaluate(() => { localStorage.setItem('canvasui:renderer', 'webgpu'); window.dispatchEvent(new Event('canvasui:pref')); });
    await page.waitForTimeout(400);
    for (const [label, hostname] of [['在 ChatGPT 中打开', 'chatgpt.com'], ['在 Claude 中打开', 'claude.ai']]) {
      await trigger.click();
      await menu.getByRole('menuitem', { name: label, exact: true }).click();
      const last = await page.evaluate(() => window.__openedUrls.at(-1));
      const url = new URL(last);
      check(label, url.hostname === hostname && url.searchParams.get('q').includes('ascii-object-react-webgpu') && url.searchParams.get('q').includes('WebGPU'));
      await menu.waitFor({ state: 'hidden' });
    }
    check('Removed route returns 404', (await page.request.get(`${base}/playground`)).status() === 404);
    const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
    check('Sitemap removes playground', !sitemap.includes('/playground'));
    const catalog = await (await page.request.get(`${base}/ai/catalog.json`)).json();
    check('AI catalog serves the nine retained entries', catalog.items.length === 9);
    const skill = await (await page.request.get(`${base}/ai/SKILL.md`)).text();
    check('Downloadable Skill names LeiBox and actual CLI', skill.includes('name: leibox') && skill.includes('collection-cli.mjs'));
    const fs = require('node:fs/promises');
    await fs.mkdir('docs/qa-localization/ai-guide', { recursive: true });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${base}/docs/mcp`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1100);
      check(`AI guide ${width}px fits`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `docs/qa-localization/ai-guide/guide-${width}.png` });
    }
    await context.close();
    console.log(`Completed ${checks.length} AI actions and removal checks; external AI windows were intercepted.`);
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
