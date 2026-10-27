#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const DEFAULT_ORIGIN = 'https://leibox-ui.netlify.app';
const FRAMEWORKS = ['react', 'vue', 'svelte', 'solid', 'preact', 'vanilla'];
const normalized = (value) => value.normalize('NFKC').toLocaleLowerCase('en-US').trim();

const searchText = (item) => normalized([
  item.slug, item.name.en, item.name.zh, item.description?.en, item.description?.zh, item.summary,
  item.keywords, ...item.frameworks, ...item.renderers,
  item.discovery?.category, ...item.discovery?.useCases ?? [], ...item.discovery?.searchTerms ?? [],
  ...item.discovery?.visualTags ?? [], ...item.discovery?.interactions ?? [],
].filter(Boolean).join(' '));

export function searchItems(items, query) {
  const text = normalized(query);
  const words = text.split(/\s+/).filter(Boolean);
  const score = (item) => {
    const names = [item.slug, item.name.en, item.name.zh].map(normalized);
    return names.includes(text) ? 3 : names.some((name) => name.startsWith(text)) ? 2 : names.some((name) => name.includes(text)) ? 1 : 0;
  };
  return items.filter((item) => {
    const haystack = searchText(item);
    return words.length > 0 && words.every((word) => haystack.includes(word));
  }).sort((a, b) => score(b) - score(a));
}

function matchesFilters(item, options) {
  return (!options.framework || item.frameworks.includes(options.framework))
    && (!options.renderer || item.renderers.includes(options.renderer))
    && (!options.category || item.discovery.category === options.category)
    && !(options.excludeTag ?? '').split(',').filter(Boolean).some((tag) => item.discovery.visualTags.includes(tag));
}

// Match maintained bilingual intent terms, not opaque similarity scores or a remote AI service.
export function recommendItems(items, query, options = {}) {
  const text = normalized(query).replace(/[^\p{L}\p{N}-]+/gu, ' ');
  const singular = (word) => word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
  const words = new Set(text.split(' ').map(singular));
  const hasTerm = (term) => {
    if (/^[a-z0-9-]+$/.test(term)) return words.has(singular(term));
    if (/^[a-z0-9 -]+$/.test(term)) return ` ${text} `.includes(` ${term} `);
    return text.includes(term);
  };
  return items.filter((item) => matchesFilters(item, options)).map((item) => {
    const terms = [...new Set([
      item.slug, ...item.slug.split('-'), item.name.en, item.name.zh,
      ...item.discovery.searchTerms, ...item.discovery.useCases, ...item.discovery.visualTags,
    ].map(normalized))].filter((term) => term.length >= 2 && hasTerm(term));
    const exact = [item.slug, item.name.en, item.name.zh].map(normalized).includes(normalized(query));
    const score = (exact ? 100 : 0) + terms.reduce((sum, term) => sum + Math.min(term.length, 8), 0);
    return { ...item, score, matchedTerms: terms, reasons: [
      `匹配需求词：${terms.join('、')}`,
      ...(options.framework ? [`支持项目框架：${options.framework}`] : []),
      ...(options.category ? [`匹配用途类别：${options.category}`] : []),
    ] };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug)).slice(0, options.limit ?? 3);
}

class SkillError extends Error {
  constructor(code, message, status = 1) { super(message); this.code = code; this.status = status; }
}

function validDiscovery(value) {
  return typeof value?.category === 'string' && typeof value?.caveat === 'string'
    && [value.useCases, value.searchTerms, value.visualTags, value.interactions].every((list) => Array.isArray(list) && list.every((item) => typeof item === 'string'));
}

async function readJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) throw new SkillError('SOURCE_UNAVAILABLE', `${response.status}: ${url}`);
  return response.json();
}

function sourceUrl(value, origin) {
  const url = new URL(value, origin);
  if (!['http:', 'https:'].includes(url.protocol) || ![new URL(origin).origin, 'https://canvasui.dev'].includes(url.origin)) {
    throw new SkillError('INVALID_SOURCE', 'Component source must be served by LeiBox or its declared upstream provider.');
  }
  return url.href;
}

export async function run(args, { cwd = process.cwd() } = {}) {
  const [command = 'help', ...rest] = args;
  if (['help', '--help', '-h'].includes(command)) return {
    name: 'leibox', commands: ['recommend <需求> --limit 3', 'list', 'search <关键词>', 'show <slug>', 'pull <slug> --framework react --out <folder>'],
    options: ['--framework react|vue|svelte|solid|preact|vanilla', '--renderer webgl|webgpu', '--category <用途类别>', '--exclude-tag <视觉标签,视觉标签>', '--limit 1..10 (recommend)', '--out <folder> (pull)', '--origin <catalog-origin>'],
    origin: DEFAULT_ORIGIN, writes: '只有 pull 写入源码；不会覆盖内容不同的已有文件，也不会执行安装。',
  };
  if (!['recommend', 'list', 'search', 'show', 'pull'].includes(command)) throw new SkillError('INVALID_ARGUMENTS', `未知命令：${command}`, 2);
  const options = { origin: DEFAULT_ORIGIN, limit: 3 };
  const values = [];
  for (let index = 0; index < rest.length; index++) {
    if (rest[index].startsWith('--')) {
      const name = rest[index].slice(2);
      if (!['framework', 'renderer', 'out', 'origin', 'limit', 'category', 'exclude-tag'].includes(name) || !rest[index + 1] || rest[index + 1].startsWith('--')) throw new SkillError('INVALID_ARGUMENTS', `无效选项：${rest[index]}`, 2);
      if ((name === 'limit' && command !== 'recommend') || (name === 'out' && command !== 'pull') || (['category', 'exclude-tag'].includes(name) && !['list', 'search', 'recommend'].includes(command))) throw new SkillError('INVALID_ARGUMENTS', `此命令不支持 --${name}`, 2);
      options[name] = rest[++index];
    } else values.push(rest[index]);
  }
  if ((options.framework && !FRAMEWORKS.includes(options.framework)) || (options.renderer && !['webgl', 'webgpu'].includes(options.renderer))) throw new SkillError('INVALID_ARGUMENTS', '请选择受支持的框架和渲染器。', 2);
  if (!/^\d+$/.test(String(options.limit)) || Number(options.limit) < 1 || Number(options.limit) > 10) throw new SkillError('INVALID_ARGUMENTS', '--limit 必须是 1 到 10 的整数。', 2);
  options.limit = Number(options.limit);
  options.excludeTag = options['exclude-tag'];
  if (command === 'list' && values.length) throw new SkillError('INVALID_ARGUMENTS', 'list does not accept a query.', 2);
  if (['search', 'recommend'].includes(command) && !values.join(' ').trim()) throw new SkillError('INVALID_ARGUMENTS', '请提供搜索词或界面需求。', 2);
  if (['show', 'pull'].includes(command) && (values.length !== 1 || !/^[a-z]+(?:-[a-z]+)*$/.test(values[0]))) throw new SkillError('INVALID_ARGUMENTS', 'Provide one component slug.', 2);
  const origin = new URL(options.origin).origin;
  if (!['http:', 'https:'].includes(new URL(origin).protocol)) throw new SkillError('INVALID_ARGUMENTS', 'Catalog origin must use HTTP(S).', 2);
  if (command === 'recommend') {
    const index = await readJson(new URL('/ai/search-index.json', origin));
    if (index?.schemaVersion !== 1 || !Array.isArray(index.items) || index.items.some((item) =>
      !item || typeof item.slug !== 'string' || typeof item.name?.en !== 'string' || typeof item.name?.zh !== 'string'
      || typeof item.summary !== 'string' || typeof item.docsPath !== 'string' || typeof item.detailPath !== 'string'
      || !validDiscovery(item.discovery)
      || [item.frameworks, item.renderers].some((list) => !Array.isArray(list) || list.some((value) => typeof value !== 'string')))) throw new SkillError('INVALID_CATALOG', '推荐索引不符合支持的结构。');
    const items = recommendItems(index.items, values.join(' '), options);
    return { schemaVersion: 1, revision: index.revision, query: values.join(' '), count: items.length, items,
      next: items.length ? '比较用途与注意事项，再读取选中条目的 detailPath；只下载所需框架。' : '未找到合适组件，可缩短用途词重试；仍无结果时使用现有组件或正常实现。' };
  }
  const catalog = await readJson(new URL('/ai/catalog.json', origin));
  if (!Array.isArray(catalog?.items) || catalog.items.some((item) => !item || typeof item.slug !== 'string' || !item.name?.en || !item.name?.zh || !item.description?.en || !item.description?.zh || !Array.isArray(item.frameworks) || !Array.isArray(item.renderers) || !validDiscovery(item.discovery))) throw new SkillError('INVALID_CATALOG', '实时目录缺少必要字段。');
  const candidates = catalog.items.filter((item) => matchesFilters(item, options));
  if (command === 'list') return { count: candidates.length, items: candidates };
  if (command === 'search') {
    const items = searchItems(candidates, values.join(' '));
    if (!items.length) throw new SkillError('NO_RESULTS', 'No matching components. Try fewer keywords.', 3);
    return { count: items.length, items };
  }
  const entry = catalog.items.find((item) => item.slug === values[0]);
  if (!entry) throw new SkillError('UNKNOWN_SLUG', `Unknown component: ${values[0]}`, 3);
  const detail = await readJson(sourceUrl(entry.detailPath, origin));
  options.framework ??= 'react';
  options.renderer ??= 'webgl';
  if (!entry.frameworks.includes(options.framework)) throw new SkillError('UNSUPPORTED_FRAMEWORK', `${entry.slug} does not offer ${options.framework}.`, 2);
  const local = detail.packages?.[options.framework];
  const registry = detail.install?.registryUrls?.[options.framework]?.[options.renderer];
  if (command === 'show') return { ...detail, selectedFramework: options.framework, selectedRenderer: local ? 'dom' : options.renderer, selectedPackage: local ?? { provider: 'upstream', url: registry } };
  if (!local && !registry) throw new SkillError('SOURCE_UNAVAILABLE', 'No source package is offered for this framework/renderer.');
  const pkg = await readJson(sourceUrl(local?.url ?? registry, origin));
  if (!Array.isArray(pkg.files) || !pkg.files.length) throw new SkillError('INVALID_PACKAGE', 'Source package contains no files.');
  const files = pkg.files.map((file) => {
    const name = local ? file.path : path.posix.basename((file.target ?? file.path ?? '').replaceAll('\\', '/'));
    if (typeof name !== 'string' || !/^[a-zA-Z0-9_][a-zA-Z0-9._-]*$/.test(name) || typeof file.content !== 'string') throw new SkillError('INVALID_PACKAGE', 'Source filenames must be plain filenames with text content.');
    const sha256 = createHash('sha256').update(file.content).digest('hex');
    if (local && file.sha256 !== sha256) throw new SkillError('INVALID_PACKAGE', `Source checksum failed: ${name}`);
    return { name, content: file.content, sha256 };
  });
  if (new Set(files.map((file) => file.name.toLowerCase())).size !== files.length) throw new SkillError('INVALID_PACKAGE', 'Source package contains duplicate filenames.');
  const destination = path.resolve(cwd, options.out ?? `components/leibox/${entry.slug}`);
  const plans = [];
  for (const file of files) {
    const target = path.join(destination, file.name);
    let existing;
    try {
      if ((await fs.lstat(target)).isSymbolicLink()) throw new SkillError('FILE_CONFLICT', `Refusing to replace a symbolic link: ${target}`, 2);
      existing = await fs.readFile(target, 'utf8');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing !== undefined && existing !== file.content) throw new SkillError('FILE_CONFLICT', `Existing file differs: ${target}. Choose another folder or merge it deliberately.`, 2);
    plans.push({ ...file, target, skipped: existing !== undefined });
  }
  await fs.mkdir(destination, { recursive: true });
  for (const file of plans) if (!file.skipped) await fs.writeFile(file.target, file.content, { flag: 'wx' });
  return {
    slug: entry.slug, framework: options.framework, renderer: local ? 'dom' : options.renderer, provider: local ? 'leibox' : 'upstream',
    destination, files: plans.map(({ target, sha256, skipped }) => ({ path: target, sha256, skipped })),
    dependencies: pkg.dependencies ?? [], devDependencies: pkg.devDependencies ?? [], usage: pkg.usage ?? detail.usage?.[options.framework] ?? '',
    source: detail.source, next: 'Review the files, install missing dependencies with the project package manager, import the entry and verify the rendered result.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { process.stdout.write(`${JSON.stringify(await run(process.argv.slice(2)), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${JSON.stringify({ error: error.code ?? 'SOURCE_UNAVAILABLE', message: error.message })}\n`); process.exitCode = error.status ?? 1; }
}
