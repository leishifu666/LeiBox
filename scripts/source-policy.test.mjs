import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const read = file => fs.readFile(file, 'utf8');
const studies = ['ascii-object', 'asciify', 'frost', 'glass', 'glass-object', 'glyph-rain', 'liquid-object', 'particle-object', 'particle-scroll'];
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('local original demos retain provenance without claiming project source distribution', async () => {
  const catalog = JSON.parse(await read('public/ai/catalog.json'));
  assert(catalog.items.length > 0);
  for (const item of catalog.items) {
    assert.equal(item.source.kind, 'project-source');
  }
  for (const slug of studies) {
    assert(!catalog.items.some(item => item.slug === slug));
    await assert.rejects(fs.access(`public/ai/components/${slug}.json`), { code: 'ENOENT' });
    const page = await read(`src/app/(shell)/docs/components/${slug}/page.tsx`);
    assert.match(page, /OriginalEffectSource/);
  }
  assert.match(await read('src/demos/demo-image-cycler.tsx'), /DEMO_IMAGES = \["\/landing\/agent-demo\/alpine-lake.png"\]/);
  await assert.rejects(fs.access('src/lib/motion-core/image-study-2d.mjs'), { code: 'ENOENT' });
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

test('restored local pages resolve while original source packages remain at the author', async () => {
  for (const slug of studies) {
    assert.equal((await fetch(base + `/docs/components/${slug}`)).status, 200);
    assert.equal((await fetch(base + `/ai/components/${slug}.json`)).status, 404);
    assert.equal((await fetch(base + `/r/${slug}-react.json`)).status, 404);
  }
  assert.equal((await fetch(base + '/assets/fallback-hero.mp4')).status, 404);
});

test('learning notices appear once in each footer without repeating in page content', async () => {
  const home = await read('out/index.html');
  for (const file of ['index.html', 'components.html', 'docs.html', 'docs/installation.html', 'docs/rendering.html', 'docs/animations/glass-folder.html', 'docs/animations/fluid-tooltip.html', 'docs/components/share-invite.html']) {
    const html = await read('out/' + file);
    assert.equal((html.match(/<aside\b[^>]*\bdata-learning-notice="true"[^>]*>/g) || []).length, 1, file);
    assert.match(html, /<footer\b[^>]*>[\s\S]*?<aside\b[^>]*\bdata-learning-notice="true"[\s\S]*?<\/footer>/, file);
  }
  assert((await read('out/copyright.html')).includes('仅供学习使用'));
  assert((await read('LICENSE.md')).includes('Copyright (c) 2026 David Haz'));
  assert(!/Canvas UI|canvasui\.dev|@canvas-ui\//.test(home));
});
