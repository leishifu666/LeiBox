import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import { run } from '../integrations/skills/leibox/scripts/leibox.mjs';

const publicRoot = path.resolve('public');
const fixtureRoot = path.resolve('node_modules/.cache/leibox-skill-tests');
let origin, server;
const overrides = new Map();
const requests = [];
test.before(async () => {
  await fs.mkdir(fixtureRoot, { recursive: true });
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    requests.push(pathname);
    const file = path.resolve(publicRoot, '.' + pathname);
    try {
      assert(file.startsWith(publicRoot + path.sep));
      const content = overrides.has(pathname) ? JSON.stringify(overrides.get(pathname)) : await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': 'application/json' }); response.end(content);
    } catch { response.writeHead(404); response.end('{}'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((resolve) => server.close(resolve)));
const invoke = (args, cwd = fixtureRoot) => run([...args, '--origin', origin], { cwd });

test('task index validates against its published schema and covers exactly the live collection', async () => {
  const indexBytes = await fs.readFile(path.join(publicRoot, 'ai/search-index.json'));
  const index = JSON.parse(indexBytes);
  const catalogBytes = await fs.readFile(path.join(publicRoot, 'ai/catalog.json'));
  const catalog = JSON.parse(catalogBytes);
  const schema = JSON.parse(await fs.readFile(path.join(publicRoot, 'ai/search-index.schema.json')));
  const validate = new Ajv({ allErrors: true }).compile(schema);
  assert(validate(index), JSON.stringify(validate.errors));
  assert.equal(index.total, catalog.items.length);
  assert.deepEqual(index.items.map((item) => item.slug), catalog.items.map((item) => item.slug));
  assert.equal(index.revision, createHash('sha256').update(JSON.stringify(index.items)).digest('hex'));
  assert.equal(index.revision, catalog.revision);
  assert(indexBytes.length < catalogBytes.length * 0.75);
  for (const item of index.items) {
    const detail = JSON.parse(await fs.readFile(path.join(publicRoot, item.detailPath)));
    assert.deepEqual(item.frameworks, detail.frameworks);
    assert.deepEqual(item.discovery, detail.discovery);
    assert.equal(item.sourceProvider, detail.distribution.installProvider);
    assert(!Object.hasOwn(item, 'files'));
    assert(!Object.hasOwn(item, 'packages'));
    await fs.access(path.join(publicRoot, item.previewPath));
  }
  for (const [category, count] of Object.entries(index.facets.categories)) assert.equal(count, index.items.filter((item) => item.discovery.category === category).length);
});

test('recommend recognizes Chinese and English UI tasks without requiring LeiBox or component names', async () => {
  const cases = [
    ['给图片生成过程加一个等待反馈', 'ai-generating'],
    ['给一篇很长的文章增加章节导航', 'sailing-toc'],
    ['需要团队成员邀请面板', 'share-invite'],
    ['登录时输入六位验证码', 'otp-verification'],
    ['实现一个文件管理界面', 'glass-folder'],
    ['I need an image generation loading indicator', 'ai-generating'],
    ['Add a table of contents to my article', 'sailing-toc'],
    ['Build a chat composer with attachments', 'deep-agent-composer'],
    ['Organize folders and files', 'glass-folder'],
    ['一个简洁的推理强度滑块', 'reasoning-effort-slider'],
  ];
  for (const [query, slug] of cases) {
    const result = await invoke(['recommend', query, '--framework', 'vue', '--limit', '2']);
    assert.equal(result.items[0]?.slug, slug, query);
    assert(result.count > 0 && result.count <= 2);
    assert(result.items.every((item) => item.frameworks.includes('vue') && item.matchedTerms.length > 0 && item.reasons.length > 0 && item.discovery.caveat));
  }
});

test('recommend respects filters and exclusions, returns no invented fallback, and fetches only the compact index', async () => {
  requests.length = 0;
  const loading = await invoke(['recommend', '加载反馈', '--category', 'feedback', '--exclude-tag', 'particles', '--limit', '1']);
  assert.equal(loading.items[0].slug, 'ai-generating');
  const gpu = await invoke(['recommend', '粒子', '--framework', 'react', '--renderer', 'webgpu']);
  assert.equal(gpu.count, 0, 'retired renderer packages must not be invented as fallback results');
  assert.equal((await invoke(['recommend', '团队邀请', '--category', 'input'])).count, 0);
  assert.equal((await invoke(['recommend', 'zzzz-absent-widget'])).count, 0);
  assert.deepEqual(new Set(requests), new Set(['/ai/search-index.json']));
});

test('invalid recommendation arguments and malformed remote index report real errors', async () => {
  for (const args of [['recommend'], ['recommend', '加载', '--limit', '0'], ['recommend', '加载', '--limit', '3.2'], ['recommend', '加载', '--limit', '11'], ['recommend', '加载', '--framework', 'angular']]) {
    await assert.rejects(invoke(args), { code: 'INVALID_ARGUMENTS' });
  }
  try {
    overrides.set('/ai/search-index.json', { schemaVersion: 1, items: [{ slug: 'fake-component' }] });
    await assert.rejects(invoke(['recommend', '加载']), { code: 'INVALID_CATALOG' });
  } finally { overrides.delete('/ai/search-index.json'); }
});

test('installed helper searches the complete bilingual collection and reads actual package metadata', async () => {
  const catalog = await invoke(['list']);
  assert(catalog.items.some((item) => item.slug === 'glass-folder'));
  assert(catalog.items.every((item) => item.source.kind === 'project-source'));
  await assert.rejects(invoke(['pull', 'glass']), { code: 'UNKNOWN_SLUG' });
  assert((await invoke(['search', '玻璃', '文件夹'])).items.some((item) => item.slug === 'glass-folder'));
  assert.equal((await invoke(['search', 'ＤＯＴ-ＭＡＴＲＩＸ-ＴＲＩＯ'])).items[0].slug, 'dot-matrix-trio');
  const detail = await invoke(['show', 'dot-matrix-trio', '--framework', 'vue']);
  assert.equal(detail.selectedPackage.component, 'DotMatrixTrio');
  assert(detail.selectedPackage.url.endsWith('/vue.json'));
});

test('all generated framework bundles preserve the real files, dependencies and SHA-256 checksums', async () => {
  const catalog = JSON.parse(await fs.readFile(path.join(publicRoot, 'ai/catalog.json')));
  let packages = 0;
  for (const item of catalog.items.filter((entry) => entry.source.kind === 'project-source')) {
    const detail = JSON.parse(await fs.readFile(path.join(publicRoot, item.detailPath)));
    const original = JSON.parse(await fs.readFile(path.join(publicRoot, 'motion-frameworks', item.slug, 'packages.json')));
    for (const framework of item.frameworks) {
      const bundle = JSON.parse(await fs.readFile(path.join(publicRoot, detail.packages[framework].url)));
      const source = original.find((entry) => entry.framework === framework);
      assert.deepEqual(bundle.dependencies, source.dependencies);
      assert.equal(bundle.usage, source.usage);
      assert.deepEqual(bundle.files.map((file) => [file.path, file.content]), source.files.map((file) => [file.fileName, file.source]));
      for (const file of bundle.files) assert.equal(file.sha256, createHash('sha256').update(file.content).digest('hex'));
      packages++;
    }
  }
  assert.equal(packages, catalog.items.filter((entry) => entry.source.kind === 'project-source').length * 6);
});

test('pull downloads every required file and repeated pulls reuse identical content', async () => {
  const folder = await fs.mkdtemp(path.join(fixtureRoot, 'pull-'));
  const args = ['pull', 'dot-matrix-trio', '--framework', 'react', '--out', folder];
  const result = await invoke(args);
  assert.equal(result.files.length, 4);
  assert(result.files.every((file) => !file.skipped));
  assert(result.dependencies.includes('react'));
  assert((await fs.readFile(path.join(folder, 'DotMatrixTrio.tsx'), 'utf8')).includes('useEffect'));
  assert((await invoke(args)).files.every((file) => file.skipped));
});

test('conflicts are found before writing any file; user content remains intact', async () => {
  const folder = await fs.mkdtemp(path.join(fixtureRoot, 'conflict-'));
  await fs.writeFile(path.join(folder, 'motion-runtime.ts'), '// user-authored work');
  await assert.rejects(invoke(['pull', 'dot-matrix-trio', '--out', folder]), { code: 'FILE_CONFLICT' });
  assert.deepEqual(await fs.readdir(folder), ['motion-runtime.ts']);
  assert.equal(await fs.readFile(path.join(folder, 'motion-runtime.ts'), 'utf8'), '// user-authored work');
});

test('tampered hashes and path traversal in downloaded source are rejected before writes', async () => {
  const url = '/ai/packages/dot-matrix-trio/react.json';
  const original = JSON.parse(await fs.readFile(path.join(publicRoot, url)));
  const folder = await fs.mkdtemp(path.join(fixtureRoot, 'invalid-'));
  try {
    const corrupted = structuredClone(original); corrupted.files[0].content += '// tampered'; overrides.set(url, corrupted);
    await assert.rejects(invoke(['pull', 'dot-matrix-trio', '--out', folder]), { code: 'INVALID_PACKAGE' });
    const traversal = structuredClone(original); traversal.files[0].path = '../escaped.ts'; overrides.set(url, traversal);
    await assert.rejects(invoke(['pull', 'dot-matrix-trio', '--out', folder]), { code: 'INVALID_PACKAGE' });
    assert.deepEqual(await fs.readdir(folder), []);
  } finally { overrides.delete(url); }
});

test('skill discovery installs Chinese instructions, UI metadata and the source helper', async () => {
  const source = await fs.readFile('integrations/skills/leibox/SKILL.md', 'utf8');
  const description = source.match(/^description: (.+)$/m)[1];
  assert.match(description, /主动搜索 LeiBox/);
  assert.match(description, /用户无需先提 LeiBox/);
  assert.match(source, /^name: leibox$/m);
  assert.equal(await fs.readFile(path.join(publicRoot, 'ai/SKILL.md'), 'utf8'), source);
  const metadata = await fs.readFile('integrations/skills/leibox/agents/openai.yaml', 'utf8');
  assert.match(metadata, /display_name: "LeiBox 组件库"/);
  assert.match(metadata, /allow_implicit_invocation: true/);
  assert.equal(await fs.readFile(path.join(publicRoot, 'ai/agents/openai.yaml'), 'utf8'), metadata);
  for (const prefix of ['agent-skills', 'skills']) {
    const folder = path.join(publicRoot, '.well-known', prefix);
    const index = JSON.parse(await fs.readFile(path.join(folder, 'index.json')));
    assert.equal(index.skills[0].name, 'leibox');
    assert.equal(index.skills[0].description, description);
    assert.deepEqual(index.skills[0].files, ['SKILL.md', 'scripts/leibox.mjs', 'agents/openai.yaml']);
    for (const filename of index.skills[0].files) assert.equal(await fs.readFile(path.join(folder, 'leibox', filename), 'utf8'), await fs.readFile(path.join('integrations/skills/leibox', filename), 'utf8'));
  }
});

test('installed helper and discovery packages use the current public domain', async () => {
  const expected = 'https://leibox.pantoria.cn';
  assert.equal((await run(['help'])).origin, expected);
  for (const prefix of ['ai', '.well-known/agent-skills/leibox', '.well-known/skills/leibox']) {
    const folder = path.join(publicRoot, prefix);
    const instructions = await fs.readFile(path.join(folder, 'SKILL.md'), 'utf8');
    assert(instructions.includes(expected + '/ai/search-index.json'));
    const helper = await import(new URL('../' + path.join('public', prefix, 'scripts/leibox.mjs').replaceAll('\\', '/'), import.meta.url));
    assert.equal((await helper.run(['help'])).origin, expected);
  }
});
