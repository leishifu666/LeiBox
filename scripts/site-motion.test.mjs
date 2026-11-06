import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

test('website documents use immutable external scripts and byte-identical shared fonts; offline HTML is untouched', async () => {
  const { buildSiteMotion } = await import('./build-site-motion.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leibox-site-motion-'));
  try {
    await fs.mkdir(path.join(root, 'public/motion'), { recursive: true });
    await fs.mkdir(path.join(root, 'public/fonts'), { recursive: true });
    await fs.mkdir(path.join(root, 'src/lib/ShareInvite'), { recursive: true });
    const font = Buffer.from('fixture font bytes must be retained');
    const fontUrl = 'data:font/woff2;base64,' + font.toString('base64');
    const image = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#e8e3db' } }).png().toBuffer();
    const source = `<html><head><style>@import url('https://fonts.googleapis.com/css2?family=Inter');@font-face{font-family:Demo;src:url(${fontUrl})}body{margin:0}</style></head><body><canvas></canvas><script>const picture="data:image/png;base64,${image.toString('base64')}";window.fixture=picture;/* ${'comment '.repeat(2000)} */</script></body></html>`;
    await fs.writeFile(path.join(root, 'public/motion/example.html'), source);
    await fs.writeFile(path.join(root, 'public/fonts/misans.css'), 'body{font-family:MiSans}');
    await fs.writeFile(path.join(root, 'src/lib/ShareInvite/share-invite.css'), `/*! Font license fixture */\n@font-face{font-family:ShareInviteInter;src:url(${fontUrl})}`);
    const result = await buildSiteMotion({ root, slugs: ['example'] });
    const item = result.components.example;
    assert.match(item.documentUrl, /^\/assets\/motion\/example-[a-f0-9]{24}\.html$/);
    const document = await fs.readFile(path.join(root, 'public', item.documentUrl), 'utf8');
    assert(Buffer.byteLength(document) < 4096);
    assert(!document.includes('base64,'));
    assert.match(document, /<script[^>]+src=/);
    assert.match(document, /<link[^>]+stylesheet/);
    assert.equal(await fs.readFile(path.join(root, 'public/motion/example.html'), 'utf8'), source);
    const files = await fs.readdir(path.join(root, 'public/assets/motion'));
    const fontFile = files.find(name => name.endsWith('.woff2'));
    assert.deepEqual(await fs.readFile(path.join(root, 'public/assets/motion', fontFile)), font);
    for (const css of files.filter(name => name.endsWith('.css'))) assert(!(await fs.readFile(path.join(root, 'public/assets/motion', css), 'utf8')).includes('fonts.googleapis.com'), 'Website fonts must not wait for a third-party font CDN');
    for (const name of files) {
      const body = await fs.readFile(path.join(root, 'public/assets/motion', name));
      assert(name.includes(createHash('sha256').update(body).digest('hex').slice(0, 24)), name);
    }
    const repeated = await buildSiteMotion({ root, slugs: ['example'] });
    assert.equal(repeated.components.example.documentUrl, item.documentUrl);
    assert.match(result.chineseFontStylesheet, /^\/assets\/motion\/[a-f0-9]{24}\.css$/);
    const obsolete = 'obsolete-' + 'a'.repeat(24) + '.js';
    await fs.writeFile(path.join(root, 'public/assets/motion', obsolete), 'obsolete build');
    await fs.writeFile(path.join(root, 'public/assets/motion/manual.txt'), 'keep');
    await buildSiteMotion({ root, slugs: ['example'] });
    await assert.rejects(fs.access(path.join(root, 'public/assets/motion', obsolete)), { code: 'ENOENT' });
    assert.equal(await fs.readFile(path.join(root, 'public/assets/motion/manual.txt'), 'utf8'), 'keep');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
