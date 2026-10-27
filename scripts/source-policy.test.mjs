import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const read = file => fs.readFile(file, 'utf8');
const retired = ['ascii-object', 'asciify', 'frost', 'glass', 'glass-object', 'glyph-rain', 'liquid-object', 'particle-object', 'particle-scroll'];
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('the current catalog contains project packages and no retired source entries', async () => {
  const catalog = JSON.parse(await read('public/ai/catalog.json'));
  assert(catalog.items.length > 0);
  for (const item of catalog.items) {
    assert.equal(item.source.kind, 'project-source');
    assert(!retired.includes(item.slug));
  }
  for (const slug of retired) {
    await assert.rejects(fs.access(`public/ai/components/${slug}.json`), { code: 'ENOENT' });
    await assert.rejects(fs.access(`src/app/(shell)/docs/components/${slug}/page.tsx`), { code: 'ENOENT' });
  }
});

test('download folders contain only current project registry and referenced code assets', async () => {
  const registry = JSON.parse(await read('public/r/registry.json'));
  assert.equal(registry.name, 'leibox');
  const expected = ['registry.json', ...registry.items.map(item => `${item.name}.json`)];
  assert.deepEqual((await fs.readdir('public/r')).sort(), expected.sort());
  const index = JSON.parse(await read('public/doc-assets-index.json'));
  assert.deepEqual(index.canvas, {});
  const urls = new Set();
  for (const packages of Object.values(index.motion)) for (const pack of packages) {
    urls.add(path.basename(pack.bundleUrl));
    for (const file of pack.files) urls.add(path.basename(file.url));
  }
  assert.deepEqual((await fs.readdir('public/doc-assets')).sort(), [...urls].sort());
  assert.deepEqual((await fs.readdir('out/r')).sort(), expected.sort());
});

test('retired pages, registries, metadata and videos return real 404 responses', async () => {
  for (const slug of retired) for (const url of [`/docs/components/${slug}`, `/r/${slug}-react.json`, `/ai/components/${slug}.json`]) {
    assert.equal((await fetch(base + url)).status, 404, url);
  }
  assert.equal((await fetch(base + '/assets/fallback-hero.mp4')).status, 404);
});

test('learning notices are published without removing the original legal notice', async () => {
  const home = await read('out/index.html');
  const detail = await read('out/docs/animations/glass-folder.html');
  assert(home.includes('data-learning-notice'));
  assert(detail.includes('data-learning-notice'));
  assert((await read('out/copyright.html')).includes('仅供学习使用'));
  assert((await read('LICENSE.md')).includes('Copyright (c) 2026 David Haz'));
  assert(!/Canvas UI|canvasui\.dev|@canvas-ui\//.test(home));
});
