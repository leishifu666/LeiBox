// Run against `npm start`. Playwright is an optional browser QA dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const DIR = path.resolve('docs/qa-localization');
const report = { checks: [], screenshots: [], errors: [] };
const check = (name, actual, expected) => {
  assert.deepEqual(actual, expected, name);
  report.checks.push(name);
  console.log(`PASS ${name}`);
};
async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1300);
}
async function language(page, locale) {
  if (await page.locator('html').getAttribute('lang') === (locale === 'zh' ? 'zh-CN' : 'en')) {
    await page.waitForFunction(() => !document.documentElement.dataset.languageTransition);
    return;
  }
  // The existing navigation hides on downward scrolling (e.g. to the FAQ).
  // Tab uses its real keyboard reveal behavior before selecting the language.
  if (await page.locator('header[data-scroll-nav="hidden"]').count()) await page.keyboard.press('Tab');
  await page.getByRole('button', { name: locale === 'en' ? 'Switch to English' : '切换为中文', exact: true }).click();
  await page.waitForFunction(expected => document.documentElement.lang === expected && !document.documentElement.dataset.languageTransition, locale === 'zh' ? 'zh-CN' : 'en');
}
async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
}
async function run() {
  await fs.mkdir(DIR, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await ready(page);
    check('fresh visit defaults to Chinese', await page.locator('html').getAttribute('lang'), 'zh-CN');
    check('Chinese home heading', /[\u4e00-\u9fff]/.test(await page.locator('h1').innerText()), true);
    await language(page, 'en');
    check('English home heading', /[A-Za-z]/.test(await page.locator('h1').innerText()), true);
    const faq = page.locator('section[aria-labelledby="faq-heading"] button').nth(1);
    await faq.click();
    await language(page, 'zh');
    check('FAQ remains open across language change', await faq.getAttribute('aria-expanded'), 'true');
    await language(page, 'en');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    check('English choice survives reload', await page.evaluate(() => localStorage.getItem('leibox:locale')), 'en');
    const secondTab = await context.newPage();
    await secondTab.goto(BASE, { waitUntil: 'domcontentloaded' });
    await secondTab.waitForFunction(() => document.documentElement.lang === 'en');
    await language(page, 'zh');
    await secondTab.waitForFunction(() => document.documentElement.lang === 'zh-CN');
    check('Language synchronizes across browser tabs', await secondTab.locator('html').getAttribute('lang'), 'zh-CN');
    await secondTab.close();
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    const search = page.getByRole('textbox', { name: '搜索组件和文档' });
    await search.fill('玻璃透镜');
    const result = page.getByRole('dialog').getByRole('button', { name: '玻璃透镜', exact: true });
    await result.waitFor();
    check('Chinese search finds Glass', await result.count(), 1);
    await search.fill('glass');
    check('English search works in Chinese locale', await result.count(), 1);
    await search.fill('zzzz-unknown-component');
    check('No-result text is Chinese', (await page.getByRole('dialog').innerText()).includes('没有找到'), true);
    await search.fill('玻璃透镜');
    await result.click();
    await page.waitForURL('**/docs/components/glass');
    await ready(page);
    check('Language survives actual client navigation', await page.locator('html').getAttribute('lang'), 'zh-CN');
    check('Chinese component heading', (await page.locator('h1').innerText()).trim(), '玻璃透镜');
    const codeBefore = await page.locator('pre').allTextContents();
    await language(page, 'en');
    check('Code snippets remain byte-for-byte unchanged', await page.locator('pre').allTextContents(), codeBefore);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await page.getByRole('slider').first().waitFor();
    const slider = page.getByRole('slider').first();
    await slider.focus();
    const original = await slider.getAttribute('aria-valuenow');
    await slider.press('ArrowRight');
    await page.waitForTimeout(250);
    const configured = await slider.getAttribute('aria-valuenow');
    check('Parameter is interactive before language change', configured !== original, true);
    const url = page.url();
    await language(page, 'zh');
    check('Configured parameter survives language change', await slider.getAttribute('aria-valuenow'), configured);
    check('Technical URL parameters survive language change', page.url(), url);
    check('Parameter accessible name is Chinese', await slider.getAttribute('aria-label'), '大小');
    await language(page, 'en');
    check('Parameter accessible name switches to English', await slider.getAttribute('aria-label'), 'Size');
    await page.getByRole('button', { name: '切换为中文', exact: true }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    check('Language button keyboard focus is visible', await page.getByRole('button', { name: '切换为中文', exact: true }).evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), true);
    await page.keyboard.press('Enter');
    check('Keyboard changes language', await page.locator('html').getAttribute('lang'), 'zh-CN');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/', '/docs/components/glass', '/components']) {
        await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
        await ready(page);
        for (const locale of ['zh', 'en']) {
          await language(page, locale);
          await page.waitForTimeout(250);
          check(`${route} ${width}px ${locale}: no page overflow`, await overflow(page), false);
          const filename = `${route === '/' ? 'home' : route.startsWith('/docs') ? 'docs' : 'components'}-${width}-${locale}.png`;
          await page.screenshot({ path: path.join(DIR, filename) });
          report.screenshots.push(filename);
        }
      }
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await ready(page);
    await language(page, 'zh');
    await page.getByRole('button', { name: '打开菜单', exact: true }).click();
    await page.getByRole('button', { name: '关闭菜单', exact: true }).waitFor();
    check('Mobile menu translated', (await page.locator('header a[href="/components"]').last().innerText()).trim(), '组件');
    check('Removed playground has no navigation entry', await page.locator('a[href^="/playground"]').count(), 0);
    check('No uncaught browser errors', report.errors, []);
    await context.close();
  } finally {
    await browser.close();
  }
}
run().then(async () => {
  await fs.writeFile(path.join(DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Completed ${report.checks.length} checks and ${report.screenshots.length} screenshots.`);
}).catch(async error => {
  report.failure = error.stack;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.error(error);
  process.exitCode = 1;
});
