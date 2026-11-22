import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";

// Start the production export with npm start before running this check.
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL });

async function assertCatalogueAlignment(page, width) {
  const cards = await page.locator("#interaction [data-component-card]").evaluateAll(items => items.map(card => {
    const frame = card.firstElementChild.getBoundingClientRect();
    const heading = card.querySelector("h2, h3").getBoundingClientRect();
    const description = card.querySelector("p").getBoundingClientRect();
    return { href: card.dataset.componentCard, top: frame.top, width: frame.width, height: frame.height, heading: heading.top, description: description.top };
  }));
  assert(cards.length > 0);

  let row = cards[0];
  for (const card of cards) {
    assert(Math.abs(card.height - card.width * 3 / 4) < 1, `${card.href} has a different preview ratio at ${width}px`);
    if (Math.abs(card.top - row.top) >= 1) row = card;
    assert(Math.abs(card.heading - row.heading) < 1, `${card.href} heading is out of line at ${width}px`);
    assert(Math.abs(card.description - row.description) < 1, `${card.href} description is out of line at ${width}px`);
  }
}

try {
  for (const width of [375, 768, 1024, 1440]) {
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
      await page.evaluate(() => document.fonts.ready);
      await assertCatalogueAlignment(page, width);
      if (width === 1024) {
        await page.getByRole("button", { name: "Switch to English" }).click();
        await expect(page.locator("html")).toHaveAttribute("data-locale", "en");
        await expect(page.locator("html")).not.toHaveAttribute("data-language-transition", /.+/);
        await page.evaluate(() => document.fonts.ready);
        await assertCatalogueAlignment(page, width);
      }
      console.log(`Catalogue prefetch, keyboard navigation and alignment passed at ${width}px`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
