import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";

// Start the production export with npm start before running this check.
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL });

try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      const requests = [];
      page.on("request", request => {
        const pathname = new URL(request.url()).pathname;
        if (request.resourceType() === "fetch" && /^\/components(?:$|\.txt$|\/__next\.)/.test(pathname)) {
          requests.push(pathname);
        }
      });

      const pageData = page.waitForResponse(response => {
        const pathname = new URL(response.url()).pathname;
        return pathname.startsWith("/components/__next.") && pathname.endsWith(".__PAGE__.txt") && response.ok();
      }, { timeout: 8000 });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      const browse = page.locator('[data-hero-actions] a[href="/components"]');
      await expect(browse).toBeVisible();
      await (await pageData).finished();

      const prefetched = requests.length;
      await browse.press("Enter");
      await expect(page).toHaveURL(/\/components$/);
      await expect(page.locator("#components-title")).toBeVisible();
      await expect(page.locator("[data-component-card]").first()).toBeVisible();
      assert.equal(requests.length, prefetched, "Opening the prefetched collection should reuse its route data");
      console.log(`Catalogue prefetch and keyboard navigation passed at ${width}px`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
