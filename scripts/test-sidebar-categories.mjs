import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "playwright/test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const output = path.resolve("outputs/sidebar-category-motion");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || "chrome" });
const errors = [];
const report = { checks: [], screenshots: [] };

async function recordMotion(page) {
  await page.evaluate(() => {
    window.__sidebarFrames = [];
    const started = performance.now();
    const sample = now => {
      const panels = [...document.querySelectorAll("aside nav [data-sidebar-category-panel]")];
      window.__sidebarFrames.push({
        elapsed: now - started,
        panels: panels.map(panel => ({
          category: panel.dataset.sidebarCategoryPanel,
          height: panel.getBoundingClientRect().height,
          natural: panel.firstElementChild.getBoundingClientRect().height,
        })),
      });
      if (now - started < 3500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const panel = (root, category) => root.locator('[data-sidebar-category-panel="' + category + '"]');

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/docs/animations/knoll-morph-menu");
  const sidebar = page.locator("aside").filter({ has: page.locator("nav [data-sidebar-category-panel]") });
  const navigation = panel(sidebar, "navigation");
  await expect(navigation).toHaveAttribute("aria-hidden", "false");
  await expect.poll(() => navigation.evaluate(node => node.style.height)).toBe("auto");

  // The adjacent component crosses from navigation into dragging and editing.
  await recordMotion(page);
  await page.getByRole("navigation", { name: "Component pagination" })
    .locator('a[rel="next"]').press("Enter");
  await expect(page).toHaveURL(/\/docs\/animations\/retro-computer-cord$/);
  await expect.poll(() => panel(sidebar, "editing").evaluate(node => node.style.height)).toBe("auto");
  const frames = await page.evaluate(() => window.__sidebarFrames);
  const old = frames.flatMap(frame => frame.panels.filter(item => item.category === "navigation"));
  const next = frames.flatMap(frame => frame.panels.filter(item => item.category === "editing"));
  assert(old.some(item => item.height > 1 && item.height < item.natural - 1), "old category visibly collapses");
  assert(next.some(item => item.height > 1 && item.height < item.natural - 1), "new category visibly expands");
  assert(next.some(item => item.height > item.natural + 1), "B has a measurable height rebound");
  assert.equal(await navigation.evaluate(node => node.inert), true);
  await fs.writeFile(path.join(output, "cross-category-frames.json"), JSON.stringify(frames, null, 2));
  report.checks.push("Cross-category navigation animates both lists and retains B's rebound");

  // Interrupt an opening by navigating forward again before it settles.
  await page.goBack();
  await expect(page).toHaveURL(/\/knoll-morph-menu$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/retro-computer-cord$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/knoll-morph-menu$/);
  await expect.poll(() => navigation.evaluate(node => node.style.height)).toBe("auto");
  await expect(panel(sidebar, "editing")).toHaveCSS("height", "0px");
  report.checks.push("Repeated history reversals settle on the requested category");

  const initialHeight = await navigation.evaluate(node => node.getBoundingClientRect().height);
  await recordMotion(page);
  await navigation.locator('a[href="/docs/animations/metaball-menu"]').press("Enter");
  await expect(page).toHaveURL(/\/metaball-menu$/);
  await expect(navigation.locator('[aria-current="page"]')).toHaveText(/黏球|Metaball/);
  const sameCategory = await page.evaluate(() => window.__sidebarFrames
    .flatMap(frame => frame.panels.filter(item => item.category === "navigation")));
  assert(sameCategory.every(item => Math.abs(item.height - initialHeight) < 1), "same-category navigation does not replay expansion");
  report.checks.push("Same-category navigation preserves list height and updates the selected component");

  await page.getByRole("button", { name: "Switch to English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-locale", "en");
  await page.waitForFunction(() => !document.documentElement.dataset.languageTransition);
  assert.equal(await navigation.evaluate(node => node.style.height), "auto");
  assert(await navigation.evaluate(node => node.clientHeight >= node.firstElementChild.offsetHeight));
  await sidebar.locator('a[href="/components?category=navigation"]').press("Enter");
  await expect(page).toHaveURL(/\/components\?category=navigation$/);
  await expect(navigation).toHaveCSS("height", "0px");
  assert.equal(await navigation.evaluate(node => node.inert), true);
  await expect(sidebar.getByRole("link", { name: "SVG Metaball Menu", exact: true })).toHaveCount(0);
  report.checks.push("Language changes keep content complete and category links retain catalogue navigation");

  for (const width of [375, 768, 1440]) {
    const viewport = await browser.newPage({ viewport: { width, height: 1000 } });
    viewport.on("pageerror", error => errors.push(error.message));
    await viewport.goto(base + "/docs/animations/metaball-menu");
    let root = viewport.locator("aside").filter({ has: viewport.locator("nav [data-sidebar-category-panel]") });
    if (width < 1024) {
      await viewport.getByRole("button", { name: /打开文档导航|Open docs navigation/ }).click();
      root = viewport.getByRole("dialog");
      await expect(root).toBeVisible();
    }
    await expect.poll(() => panel(root, "navigation").evaluate(node => node.style.height)).toBe("auto");
    assert(await viewport.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const screenshot = path.join(output, "sidebar-" + width + ".png");
    await viewport.screenshot({ path: screenshot });
    report.screenshots.push(screenshot);
    if (width < 1024) {
      const close = root.getByRole("button", { name: /关闭文档导航|Close docs navigation/ });
      await close.focus();
      await viewport.keyboard.press("Shift+Tab");
      assert(await root.evaluate(node => {
        const focused = document.activeElement;
        return node.contains(focused) && !focused.closest("[inert]");
      }), "mobile focus wraps to an operable link");
      await panel(root, "navigation").locator('a[href="/docs/animations/knoll-morph-menu"]').press("Enter");
      await expect(viewport).toHaveURL(/\/knoll-morph-menu$/);
      await expect(viewport.getByRole("dialog")).toHaveCount(0);
    }
    await viewport.close();
  }
  report.checks.push("375, 768 and 1440 layouts fit and mobile navigation keeps focus and closes on selection");

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await reduced.goto(base + "/docs/animations/knoll-morph-menu");
  const reducedSidebar = reduced.locator("aside").filter({ has: reduced.locator("nav [data-sidebar-category-panel]") });
  await expect.poll(() => panel(reducedSidebar, "navigation").evaluate(node => node.style.height)).toBe("auto");
  await reduced.evaluate(() => {
    window.__reducedSamples = [];
    const nav = document.querySelector('aside [data-sidebar-category-panel="navigation"]');
    new MutationObserver(() => window.__reducedSamples.push({
      expanded: nav.getAttribute("aria-hidden") === "false",
      height: nav.getBoundingClientRect().height,
      natural: nav.firstElementChild.getBoundingClientRect().height,
    })).observe(nav, { attributes: true, attributeFilter: ["aria-hidden", "style"] });
  });
  await reducedSidebar.locator('a[href="/components?category=navigation"]').click();
  await expect(reduced).toHaveURL(/\/components\?category=navigation$/);
  const reducedSamples = await reduced.evaluate(() => window.__reducedSamples);
  assert(reducedSamples.every(item => item.height < 1 || Math.abs(item.height - item.natural) < 1), "reduced motion has no intermediate heights");
  report.checks.push("Reduced motion applies the target state immediately");

  assert.deepEqual(errors, []);
  report.errors = errors;
  await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
