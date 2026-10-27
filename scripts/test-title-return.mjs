import assert from 'node:assert/strict';
import { chromium } from 'playwright/test';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [375, 658, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://127.0.0.1:3014/text-motion.html?scheme=3');
    await page.waitForFunction(() => document.body.dataset.ready === 'true');
    for (const slug of ['spider-music-player', 'brand-poster-cards']) {
      await page.frameLocator('#source-frame').locator(`[data-component-card$="/${slug}"] h2`).click();
      await page.waitForFunction(() => window.transitionPreview.phase === 'detail');
      const result = await page.evaluate(() => {
        const timeline = window.transitionPreview.timeline;
        timeline.pause();
        const title = document.querySelector('.motion-title-proxy');
        const source = document.querySelector('#source-frame').contentDocument.querySelector(`[data-component-card="${window.transitionPreview.href}"] h2`);
        const target = document.querySelector('#detail-frame').contentDocument.querySelector('h1');
        const textRects = node => {
          const walker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT), rects = [];
          while (walker.nextNode()) {
            const range = node.ownerDocument.createRange();
            range.selectNodeContents(walker.currentNode);
            rects.push(...[...range.getClientRects()].filter(rect => rect.width > 0));
          }
          return rects;
        };
        const spread = node => { const tops = textRects(node).map(rect => rect.top); return Math.max(...tops) - Math.min(...tops); };
        const singleLine = spread(source) < 1 && spread(target) < 1;
        let maxSpread = 0, maxStep = 0, previous;
        for (let step = 100; step >= 0; step--) {
          timeline.progress(step / 100, true);
          const rects = textRects(title);
          const current = rects.map(rect => rect.top - rects[0].top);
          maxSpread = Math.max(maxSpread, Math.max(...current) - Math.min(...current));
          if (previous) current.forEach((top, index) => { maxStep = Math.max(maxStep, Math.abs(top - previous[index])); });
          previous = current;
        }
        timeline.progress(1, true);
        return { singleLine, maxSpread, maxStep, glyphs: title.children.length, text: title.textContent };
      });
      assert.equal(result.glyphs, [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(result.text)].length);
      if (result.singleLine) assert(result.maxSpread < 1, `Title left its line: ${JSON.stringify(result)}`);
      assert(result.maxStep < 5, `A letter jumped between frames: ${JSON.stringify(result)}`);
      await page.locator('#back').click();
      await page.waitForFunction(() => window.transitionPreview.phase === 'listing');
      console.log(JSON.stringify({ width, slug, ...result, status: 'passed' }));
    }
    await page.close();
  }
} finally {
  await browser.close();
}
