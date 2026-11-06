import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import fs from 'node:fs/promises';

let child, base;
test.before(async () => {
  const socket = createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  child = spawn(process.execPath, ['scripts/serve-local.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = `http://127.0.0.1:${port}`;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Preview did not start')), 10000);
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Preview exited ${code}`)));
    child.stdout.on('data', () => { clearTimeout(timeout); resolve(); });
  });
});
test.after(() => { child?.kill(); });

test('unversioned static resources can be cached without making them immutable', async () => {
  for (const url of ['/fonts/misans.css', '/leibox-logo.svg', '/assets/components/original-asciify.png', '/motion/crumpled-paper.html']) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    const policy = response.headers.get('cache-control');
    assert.match(policy, /public/, url);
    assert.match(policy, /max-age=[1-9]\d*/, url);
    assert(!policy.includes('immutable'), 'Mutable URLs must expire');
  }
});
test('ETag avoids resending unchanged HTML, CSS and images', async () => {
  for (const url of ['/', '/components', '/fonts/misans.css', '/assets/components/original-asciify.png']) {
    const first = await fetch(base + url, { method: 'HEAD' });
    const etag = first.headers.get('etag');
    assert(etag, url);
    const second = await fetch(base + url, { headers: { 'if-none-match': etag } });
    assert.equal(second.status, 304, url);
    assert.equal((await second.arrayBuffer()).byteLength, 0);
    const changed = await fetch(base + url, { method: 'HEAD', headers: { 'if-none-match': '"different-version"' } });
    assert.equal(changed.status, 200);
  }
});
test('errors and APIs are not cached and RSC never becomes a long-lived document', async () => {
  const missing = await fetch(base + '/does-not-exist.png');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  const api = await fetch(base + '/api/contact');
  assert.equal(api.headers.get('cache-control'), 'no-store');
  const page = await fetch(base + '/components', { method: 'HEAD' });
  assert.match(page.headers.get('cache-control'), /no-cache|max-age=0/);
  const rsc = await fetch(base + '/components.txt', { method: 'HEAD' });
  assert.match(rsc.headers.get('content-type'), /text\/x-component/);
  assert.match(rsc.headers.get('cache-control'), /no-cache|max-age=0/);
});
test('versioned runtime HTML, scripts and fonts are immutable and usable by opaque frames', async () => {
  const manifest = JSON.parse(await fs.readFile('public/site-motion-manifest.json', 'utf8'));
  const sample = manifest.components['fluid-tooltip'];
  for (const url of [sample.documentUrl, ...sample.resources, manifest.chineseFontStylesheet]) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('cache-control'), /max-age=31536000,immutable/);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    if (/\.woff2?$/.test(url)) assert.match(response.headers.get('content-type'), /font\/woff/);
  }
});
