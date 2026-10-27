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

test('list covers the full collection, keeping upstream provenance and adding downloadable project packages', async () => {
  const result = parseSuccess(invoke('list'));
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'public/motion-frameworks/manifest.json'), 'utf8'));
  const projectSlugs = [...new Set(manifest.items.map(item => item.slug))];
  assert.equal(result.count, 9 + projectSlugs.length);
  const upstream = result.items.filter(item => item.source.kind === 'upstream-reference');
  assert.deepEqual(upstream.map(item => item.slug).sort(), [
    'ascii-object', 'asciify', 'frost', 'glass', 'glass-object',
    'glyph-rain', 'liquid-object', 'particle-object', 'particle-scroll',
  ]);
  for (const entry of upstream) {
    assert(entry.name.en && entry.name.zh && entry.description.zh);
    assert.equal(entry.source.kind, 'upstream-reference');
    assert.equal(entry.source.license, 'MIT + Commons Clause');
    assert.equal(entry.distribution.canRedistributeSource, false);
    assert.equal(entry.distribution.installFromThisSite, false);
    assert(entry.docsPath.startsWith('/docs/components/'));
    assert(!JSON.stringify(entry).includes('/playground'));
  }
  for (const slug of projectSlugs) {
    const entry = result.items.find(item => item.slug === slug);
    assert(entry, slug);
    assert.equal(entry.source.kind, 'project-source');
    assert.equal(entry.distribution.installFromThisSite, true);
    assert.equal(entry.frameworks.length, 6);
  }
});
test('English and Chinese searches identify real components and support narrowing', () => {
  assert(parseSuccess(invoke('search', 'glass')).items.some(item => item.slug === 'glass'));
  assert(parseSuccess(invoke('search', '玻璃')).items.some(item => item.slug === 'glass'));
  assert(parseSuccess(invoke('search', '粒子', 'webgpu')).items.some(item => item.slug === 'particle-object'));
  assert.equal(parseSuccess(invoke('search', 'ＡＳＣＩＩＦＹ')).items[0].slug, 'asciify');
  assert(parseSuccess(invoke('search', '玻璃', '文件夹')).items.some(item => item.slug === 'glass-folder'));
  assert(parseSuccess(invoke('search', 'dot', 'matrix')).items.some(item => item.slug === 'dot-matrix-trio'));
});
test('show includes API metadata and explicitly upstream installation commands, not source', () => {
  const result = parseSuccess(invoke('show', 'asciify'));
  assert(result.apiReference.some(prop => prop.name === 'radius' && prop.type === 'number' && prop.description.zh));
  assert.equal(result.install.provider, 'upstream');
  assert.match(result.install.commands.react.webgpu, /@canvas-ui\/asciify-react-webgpu$/);
  assert(result.dependencies.webgpu.runtime.includes('vgpu'));
  assert(result.dependencies.webgpu.dev.includes('@webgpu/types'));
  assert(!Object.hasOwn(result, 'files'));
  assert(!Object.hasOwn(result, 'sourceCode'));
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
  const files = ['public/ai/catalog.json', 'public/ai/components/asciify.json', 'src/data/components.ts', 'package.json'];
  const before = await Promise.all(files.map(async file => hash(await fs.readFile(path.join(ROOT, file)))));
  assert.equal(parseSuccess(invoke('--help')).readOnly, true);
  parseSuccess(invoke('list'));
  parseSuccess(invoke('search', '字符'));
  parseSuccess(invoke('show', 'asciify'));
  const after = await Promise.all(files.map(async file => hash(await fs.readFile(path.join(ROOT, file)))));
  assert.deepEqual(after, before);
});
test('downloadable project Skill is rebuilt from the repository source', async () => {
  const source = await fs.readFile(path.join(ROOT, 'integrations/skills/leibox/SKILL.md'), 'utf8');
  const downloadable = await fs.readFile(path.join(ROOT, 'public/ai/SKILL.md'), 'utf8');
  assert.equal(downloadable, source);
  assert(!/[A-Z]:[\\/]/.test(downloadable));
});
