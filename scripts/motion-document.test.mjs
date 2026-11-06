import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function factory() {
  const compiled = await build({ entryPoints: ['src/lib/motion-document.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
  return (await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))).createMotionDocumentLoader;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
test('navigation keeps a pending preview until the destination takes ownership', async () => {
  const create = await factory(); let complete, signal, calls = 0;
  const loader = create({ handoffMs: 100, fetch: (_url, options) => { calls++; signal = options.signal; return new Promise(resolve => { complete = () => resolve(new Response('shared')); }); } });
  const old = loader.acquire('/handoff'); loader.prepareNavigation('/handoff'); old.release(); await tick();
  assert.equal(signal.aborted, false);
  const next = loader.acquire('/handoff'); complete(); assert.equal(await next.promise, 'shared'); next.release(); assert.equal(calls, 1);
});
test('a cancelled navigation cannot keep an abandoned request alive indefinitely', async () => {
  const create = await factory(); let signal;
  const loader = create({ handoffMs: 15, fetch: (_url, options) => {
    signal = options.signal; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  } });
  const lease = loader.acquire('/cancel-navigation'); const rejected = assert.rejects(lease.promise);
  loader.prepareNavigation('/cancel-navigation'); lease.release(); await new Promise(resolve => setTimeout(resolve, 35)); await rejected; assert(signal.aborted);
});
test('preview and detail share an in-flight document and preserve another consumer', async () => {
  const create = await factory();
  let complete, signal, calls = 0;
  const loader = create({ fetch: (_url, options) => { calls++; signal = options.signal; return new Promise(resolve => { complete = () => resolve(new Response('<html>same document</html>')); }); } });
  const preview = loader.acquire('/motion/example.html');
  const detail = loader.acquire('/motion/example.html');
  preview.release(); await tick();
  assert.equal(calls, 1);
  assert.equal(signal.aborted, false);
  complete(); assert.equal(await detail.promise, '<html>same document</html>');
  detail.release();
  const next = loader.acquire('/motion/example.html');
  assert.equal(await next.promise, '<html>same document</html>');
  assert.equal(calls, 1); next.release();
});
test('the last consumer cancels an unfinished download and a later visit retries', async () => {
  const create = await factory(); let calls = 0, signal;
  const loader = create({ fetch: (_url, options) => {
    calls++; signal = options.signal;
    if (calls > 1) return Promise.resolve(new Response('recovered'));
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  } });
  const abandoned = loader.acquire('/slow.html'); const rejection = assert.rejects(abandoned.promise, { name: 'AbortError' });
  abandoned.release(); abandoned.release(); await tick(); await rejection;
  assert.equal(signal.aborted, true);
  const again = loader.acquire('/slow.html'); assert.equal(await again.promise, 'recovered'); assert.equal(calls, 2); again.release();
});
test('a same-commit handoff does not abort, failures retry and the settled cache stays bounded', async () => {
  const create = await factory(); let calls = 0;
  const loader = create({ capacity: 2, fetch: async () => { calls++; return new Response('document'); } });
  const a = loader.acquire('/a'); a.release(); const handoff = loader.acquire('/a');
  assert.equal(await handoff.promise, 'document'); handoff.release(); assert.equal(calls, 1);
  for (const url of ['/b', '/c']) { const entry = loader.acquire(url); await entry.promise; entry.release(); }
  const evicted = loader.acquire('/a'); await evicted.promise; evicted.release(); assert.equal(calls, 4);
  let attempts = 0;
  const retry = create({ fetch: async () => new Response(attempts++ ? 'ok' : 'failed', { status: attempts === 1 ? 503 : 200 }) });
  const bad = retry.acquire('/retry'); await assert.rejects(bad.promise); bad.release();
  const good = retry.acquire('/retry'); assert.equal(await good.promise, 'ok'); good.release();
});
