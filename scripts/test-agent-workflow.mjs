// Run against a running site: TEST_BASE_URL=http://127.0.0.1:3001 node scripts/test-agent-workflow.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const output = path.resolve('work/agent-flow-20261027');
const results = [];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

function samplePanel(el) {
  const flow = el.querySelector('.lb-flow');
  const rows = [...el.querySelectorAll('.lb-flow-item')];
  return {
    time: performance.now(),
    oldLine: getComputedStyle(flow, '::before').content,
    resultOpacity: Number(getComputedStyle(el.querySelector('.lb-agent-result')).opacity),
    rows: rows.map(row => {
      const icon = row.querySelector('.lb-flow-icon');
      const dot = icon.getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      const line = getComputedStyle(row, '::before');
      const scale = line.transform === 'none' ? 1 : new DOMMatrix(line.transform).m22;
      return {
        state: row.dataset.state,
        x: dot.left + dot.width / 2,
        y: dot.top + dot.height / 2,
        opacity: Number(getComputedStyle(icon).opacity),
        checkOpacity: Number(getComputedStyle(row.querySelector('svg')).opacity),
        descriptionOpacity: Number(getComputedStyle(row.querySelector('.lb-flow-desc')).opacity),
        line: line.content !== 'none',
        progress: scale,
        lineStart: rect.top + parseFloat(line.top),
        lineEnd: rect.top + parseFloat(line.top) + parseFloat(line.height) * scale,
        lineX: rect.left + parseFloat(line.left) + parseFloat(line.width) / 2,
      };
    }),
  };
}

async function capture(panel) {
  return panel.evaluate(async (el, source) => {
    const sample = new Function('return (' + source + ')')();
    const frames = [], start = performance.now();
    el.querySelector('[data-lb-action="replay"]').click();
    return new Promise(resolve => {
      const tick = () => {
        const frame = sample(el);
        frame.elapsed = performance.now() - start;
        frames.push(frame);
        if (frame.elapsed < 4100) requestAnimationFrame(tick);
        else resolve(frames);
      };
      requestAnimationFrame(tick);
    });
  }, samplePanel.toString());
}

try {
  for (const width of [375, 768, 1440]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const panel = page.locator('[data-leibox-panel="agent"]');
      await panel.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-leibox-panel="agent"]')?._lbApi);
      await page.waitForTimeout(750);
      const frames = await capture(panel);
      const motion = frames.filter(frame => frame.elapsed > 220);
      const drift = [0, 1, 2].map(i => Math.max(...motion.map(f => f.rows[i].y)) - Math.min(...motion.map(f => f.rows[i].y)));
      assert(drift.every(n => n < 0.25), `circle centers stay fixed at ${width}/${theme}: ${drift}`);
      for (const frame of motion) {
        assert.equal(frame.oldLine, 'none', 'no independent full-height line');
        assert.equal(frame.rows[2].line, false, 'last circle has no outgoing line');
        for (let i = 0; i < 2; i++) {
          const row = frame.rows[i], next = frame.rows[i + 1];
          assert(Math.abs(row.lineStart - row.y) < 0.25, 'line starts at its circle center');
          assert(Math.abs(row.lineX - row.x) < 0.25, 'line and circle share a horizontal center');
          assert(row.lineEnd <= next.y + 0.25, 'line never extends beyond the next circle');
          if (next.opacity > 0.05) assert(row.progress > 0.9, 'next circle appears as the line arrives');
        }
      }
      for (let i = 0; i < 3; i++) {
        assert(motion.some(f => f.rows[i].checkOpacity > 0.05 && f.rows[i].checkOpacity < 0.95), 'check fades in over multiple frames');
        assert(motion.some(f => f.rows[i].descriptionOpacity > 0.05 && f.rows[i].descriptionOpacity < 0.95), 'description fades in over multiple frames');
      }
      for (let i = 0; i < 2; i++) {
        const moving = motion.filter(f => f.rows[i].progress > 0.001 && f.rows[i].progress < 0.999);
        assert(moving.length >= 5, 'connector is drawn continuously');
        for (let j = 1; j < moving.length; j++) assert(moving[j].rows[i].progress >= moving[j - 1].rows[i].progress, 'connector progresses without jumping backward');
      }
      assert(frames.at(-1).rows.every(row => row.state === 'done'), 'all steps finish');
      assert.equal(frames.at(-1).resultOpacity, 1, 'result is visible at completion');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      await panel.screenshot({ path: path.join(output, `agent-${width}-${theme}.png`) });
      await fs.writeFile(path.join(output, `frames-${width}-${theme}.json`), JSON.stringify(frames));
      results.push({ width, theme, frames: frames.length, centerDrift: drift, connectorBounds: true, synchronized: true, smoothCheckAndDescription: true });

      if (width === 1440 && theme === 'dark') {
        const replay = panel.locator('[data-lb-action="replay"]');
        await replay.focus();
        assert(await replay.evaluate(el => getComputedStyle(el).outlineStyle !== 'none'), 'replay has a visible keyboard focus');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1150);
        await panel.screenshot({ path: path.join(output, 'drawing-dark.png') });
        await replay.click();
        await page.waitForTimeout(400);
        await replay.click();
        await page.waitForTimeout(3800);
        assert((await panel.locator('.lb-flow-item').evaluateAll(rows => rows.map(row => row.dataset.state))).every(state => state === 'done'), 'rapid replays settle correctly');

        await replay.click();
        await page.waitForTimeout(1150);
        await panel.evaluate(el => el._lbApi.setActive(false));
        const paused = await panel.evaluate(samplePanel);
        await page.waitForTimeout(400);
        const still = await panel.evaluate(samplePanel);
        assert.deepEqual(still.rows, paused.rows, 'timeline pauses without line/dot drift');
        await panel.evaluate(el => el._lbApi.setActive(true));
        await page.waitForTimeout(2800);
        assert((await panel.evaluate(samplePanel)).rows.every(row => row.state === 'done'), 'timeline resumes to completion');

        await replay.click();
        await page.waitForTimeout(500);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(100);
        const reduced = await panel.evaluate(samplePanel);
        assert(reduced.rows.every(row => row.state === 'done' && row.opacity === 1), 'reduced motion settles all steps');
        assert.equal(reduced.resultOpacity, 1);
        await replay.click();
        assert((await panel.evaluate(samplePanel)).rows.every(row => row.state === 'done'), 'reduced-motion replay stays complete');
        assert.equal(await panel.locator('.lb-agent-result a').getAttribute('href'), '/docs/animations/glass-folder');
        results.push({ rapidReplay: true, pauseResume: true, reducedMotionDuringPlayback: true, keyboardReplay: true, componentLink: true });
      }
      assert.deepEqual(errors, [], 'no browser errors');
      await page.close();
    }
  }
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ base, results }, null, 2));
  console.log('PASS: stable circle centers, bounded and synchronized connectors, continuous completion fades, 375/768/1440 light/dark, replay, pause/resume and reduced motion.');
} finally {
  await browser.close();
}
