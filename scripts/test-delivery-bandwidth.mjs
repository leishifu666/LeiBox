import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';

// A local CDN fixture only: cacheable replies bypass a shared 3 Mbps origin
// link, while cache misses incur 100 ms and consume the shared byte budget.
// This does not predict production latency or modify a real CDN.
const upstream = process.env.TEST_BASE_URL || 'http://127.0.0.1:3189';
const manifest = JSON.parse(await fs.readFile('public/site-motion-manifest.json', 'utf8'));
const fixed = manifest.components['crumpled-paper'].documentUrl;
const bytesPerSecond = 3_000_000 / 8;
const cache = new Map();
let nextSlot = 0, originBytes = 0, misses = 0, hits = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const edge = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://fixture');
    if (url.pathname === '/delivery-harness') {
      const target = url.searchParams.get('variant') === 'baseline' ? '/motion/crumpled-paper.html' : fixed;
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
      return res.end(`<html><body style="margin:0"><iframe sandbox="allow-scripts" style="width:1200px;height:800px;border:0" src="${target}"></iframe></body></html>`);
    }
    const cached = cache.get(url.pathname);
    if (cached) { hits++; res.writeHead(200, cached.headers); return res.end(cached.bytes); }
    const response = await fetch(new URL(url.pathname, upstream));
    const bytes = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers);
    delete headers.connection; delete headers['keep-alive']; delete headers['transfer-encoding']; delete headers['content-encoding'];
    const compressed = /(?:javascript|text\/html|text\/css)/.test(headers['content-type']) ? gzipSync(bytes) : bytes;
    if (compressed !== bytes) headers['content-encoding'] = 'gzip';
    headers['content-length'] = String(compressed.length);
    // Replay the old observed policy for the downloadable baseline document.
    if (url.pathname === '/motion/crumpled-paper.html') headers['cache-control'] = 'no-cache';
    const canCache = response.ok && !/no-store|no-cache|private/.test(headers['cache-control'] || '') && /max-age=[1-9]\d*/.test(headers['cache-control'] || '');
    if (canCache) cache.set(url.pathname, { bytes: compressed, headers });
    misses++; originBytes += compressed.length;
    await sleep(100);
    res.writeHead(response.status, headers);
    for (let offset = 0; offset < compressed.length; offset += 16384) {
      if (res.destroyed) break;
      const chunk = compressed.subarray(offset, offset + 16384);
      const now = performance.now();
      nextSlot = Math.max(now, nextSlot) + chunk.length / bytesPerSecond * 1000;
      await sleep(Math.max(0, nextSlot - now));
      res.write(chunk);
    }
    res.end();
  } catch (error) { if (!res.headersSent) res.writeHead(502); res.end(String(error.message)); }
});
await new Promise(resolve => edge.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${edge.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const variant of ['baseline', 'fixed']) {
    cache.clear(); nextSlot = 0;
    for (const pass of ['cold', 'edge-warm']) {
      originBytes = 0; misses = 0; hits = 0;
      // A fresh visitor proves shared edge reuse, not only browser memory cache.
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const start = performance.now();
      await page.goto(`${origin}/delivery-harness?variant=${variant}`, { waitUntil: 'domcontentloaded' });
      await page.frameLocator('iframe').locator('.crumple-demo[data-motion-ready="true"]').waitFor({ timeout: 30000 });
      const row = { variant, pass, readyMs: Math.round(performance.now() - start), originBytes, misses, hits, errors };
      report.push(row); console.log(JSON.stringify(row));
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  assert(report[2].originBytes < report[0].originBytes * .3, 'Cold delivery must use less than 30% of baseline origin bytes');
  assert.equal(report[3].originBytes, 0, 'A second visitor must reuse immutable edge resources');
  for (const variant of ['baseline', 'fixed']) {
    originBytes = 0; misses = 0; hits = 0;
    const start = performance.now();
    await Promise.all(Array.from({ length: 5 }, async () => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        const page = await context.newPage();
        await page.goto(`${origin}/delivery-harness?variant=${variant}`, { waitUntil: 'domcontentloaded' });
        await page.frameLocator('iframe').locator('.crumple-demo[data-motion-ready="true"]').waitFor({ timeout: 30000 });
      } finally { await context.close(); }
    }));
    const row = { variant, pass: 'five-visitors', visitors: 5, allReadyMs: Math.round(performance.now() - start), originBytes, misses, hits };
    report.push(row); console.log(JSON.stringify(row));
    if (variant === 'fixed') assert.equal(originBytes, 0, 'Five new visitors must reuse the shared edge cache');
    else assert(originBytes >= 5 * report[1].originBytes, 'The old policy retransmits the complete document to every visitor');
  }
} finally { await browser.close(); edge.closeAllConnections(); await new Promise(resolve => edge.close(resolve)); }
await fs.writeFile('outputs/performance-fix-20261106/bandwidth.json', JSON.stringify({ type: 'local controlled fixture', bitsPerSecond: 3_000_000, missLatencyMs: 100, report }, null, 2));
