import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(ROOT, 'scripts/collection-cli.mjs');
const invoke = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: os.tmpdir() });
const parseSuccess = result => { assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, ''); return JSON.parse(result.stdout); };
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

test('list contains only current project source packages', async () => {
 const result=parseSuccess(invoke('list'));
 const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'public/motion-frameworks/manifest.json'),'utf8'));
 assert.equal(result.count,new Set(manifest.items.map(item=>item.slug)).size);
 assert(result.items.every(item=>item.source.kind==='project-source'&&item.distribution.installFromThisSite));
 assert(!result.items.some(item=>['glass','asciify','frost','ascii-object'].includes(item.slug)));
});
test('English and Chinese search find current examples',()=>{
 assert(parseSuccess(invoke('search','玻璃','文件夹')).items.some(item=>item.slug==='glass-folder'));
 assert(parseSuccess(invoke('search','spider')).items.some(item=>item.slug==='spider-music-player'));
 assert(parseSuccess(invoke('search','dot','matrix')).items.some(item=>item.slug==='dot-matrix-trio'));
});
test('show returns actual project packages and attribution',()=>{
 const result=parseSuccess(invoke('show','glass-folder'));
 assert.equal(result.source.kind,'project-source');
 assert.equal(result.packages.react.component,'GlassFolder');
 assert(result.packages.react.url.endsWith('/react.json'));
 assert(!Object.hasOwn(result,'sourceCode'));
});

test('unknown slug, empty query, no results and traversal return machine-readable non-zero errors', () => {
  for (const [args, status, code] of [
    [['show', 'unknown-widget'], 3, 'UNKNOWN_SLUG'],
    [['show', 'ripple'], 3, 'UNKNOWN_SLUG'],
    [['search', 'zzzz-absent-widget'], 3, 'NO_RESULTS'],
    [['search'], 2, 'INVALID_ARGUMENTS'],
    [['show', '../../package'], 2, 'INVALID_ARGUMENTS'],
    [['install', 'ripple'], 2, 'UNKNOWN_COMMAND'],
  ]) {
    const result = invoke(...args);
    assert.equal(result.status, status);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).error, code);
  }
});
test('help is JSON and CLI operations leave generated catalog and source unchanged', async () => {
  const files = ['public/ai/catalog.json', 'public/ai/components/glass-folder.json', 'src/data/components.ts', 'package.json'];
  const before = await Promise.all(files.map(async file => hash(await fs.readFile(path.join(ROOT, file)))));
  assert.equal(parseSuccess(invoke('--help')).readOnly, true);
  parseSuccess(invoke('list'));
  parseSuccess(invoke('search', '字符'));
  parseSuccess(invoke('show', 'glass-folder'));
  const after = await Promise.all(files.map(async file => hash(await fs.readFile(path.join(ROOT, file)))));
  assert.deepEqual(after, before);
});
test('downloadable project Skill is rebuilt from the repository source', async () => {
  const source = await fs.readFile(path.join(ROOT, 'integrations/skills/leibox/SKILL.md'), 'utf8');
  const downloadable = await fs.readFile(path.join(ROOT, 'public/ai/SKILL.md'), 'utf8');
  assert.equal(downloadable, source);
  assert(!/[A-Z]:[\\/]/.test(downloadable));
});
