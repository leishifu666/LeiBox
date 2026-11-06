import fs from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3189';
const manifest = JSON.parse(await fs.readFile('public/site-motion-manifest.json', 'utf8'));
const filters = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
// Use a real loopback response. A fulfilled browser route has no server address
// and makes Chrome's Local Network Access classify the sandbox as public.
const harness = http.createServer(async (req, res) => {
  if (req.url === '/site-motion-test-harness') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<!doctype html><html><body style="margin:0"><iframe sandbox="allow-scripts" style="width:1200px;height:800px;border:0"></iframe></body></html>');
  }
  try {
    const response = await fetch(base + req.url);
    const bytes = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers);
    delete headers['content-encoding']; delete headers['transfer-encoding']; delete headers.connection;
    headers['content-length'] = String(bytes.length);
    res.writeHead(response.status, headers); res.end(bytes);
  } catch { res.writeHead(502); res.end(); }
});
await new Promise(resolve => harness.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${harness.address().port}`;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const [slug, item] of Object.entries(manifest.components)) {
    if (filters.length && !filters.includes(slug)) continue;
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
      await page.goto(origin + '/site-motion-test-harness');
      await page.evaluate(async url => { const response = await fetch(url); if (!response.ok) throw new Error(`Document ${response.status}`); document.querySelector('iframe').srcdoc = await response.text(); }, origin + item.documentUrl);
      const frame = page.frames().find(candidate => candidate.parentFrame());
      await frame.waitForURL('about:srcdoc', { waitUntil: 'load', timeout: 20000 });
      await frame.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(650);
      const result = await frame.evaluate(() => {
        const roots = [document];
        for (let i = 0; i < roots.length; i++) for (const element of roots[i].querySelectorAll('*')) if (element.shadowRoot) roots.push(element.shadowRoot);
        return {
          title: document.title,
          content: roots.reduce((count, root) => count + [...root.querySelectorAll('button,p,h1,h2,label')].reduce((sum, node) => sum + node.textContent.trim().length, 0), 0),
          canvases: roots.flatMap(root => [...root.querySelectorAll('canvas')].map(canvas => ({ width: canvas.width, height: canvas.height }))),
          paintedElements: roots.reduce((count, root) => count + [...root.querySelectorAll('div,span,i')].filter(node => {
            const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && +style.opacity > 0 && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
          }).length, 0),
          fontErrors: [...document.fonts].filter(font => font.status === 'error').map(font => font.family),
          surfaces: roots.length - 1 + roots.reduce((count, root) => count + root.querySelectorAll('svg,button,input').length, 0),
        };
      });
      if (result.fontErrors.length) errors.push('Font errors: ' + result.fontErrors.join(', '));
      if (!result.content && !result.canvases.length && !result.surfaces && !result.paintedElements) errors.push('No rendered content');
      report.push({ slug, ...result, errors });
      console.log(`${errors.length ? 'FAIL' : 'PASS'} SITE ${slug}${errors.length ? ': ' + errors.join('; ').slice(0, 500) : ''}`);
    } catch (error) { report.push({ slug, errors: [...errors, error.message] }); console.log(`FAIL SITE ${slug}: ${error.message}`); }
    finally { await page.close(); }
  }
  await context.close();
} finally { await browser.close(); harness.closeAllConnections(); await new Promise(resolve => harness.close(resolve)); }
await fs.mkdir('outputs/performance-fix-20261106', { recursive: true });
await fs.writeFile('outputs/performance-fix-20261106/site-smoke.json', JSON.stringify(report, null, 2));
if (report.some(row => row.errors.length)) process.exitCode = 1;
