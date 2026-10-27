import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { build } from 'esbuild';

const source = path.resolve(process.argv[2] || '../deepagent/apps/desktop');
const sourceRoot = path.join(source, 'src');
const destination = path.resolve('src/lib/DeepAgent/original');
const visited = new Set();
const manifest = [];
const external = new Set();
const adapters = new Set(['api.ts', 'api/index.ts']);
const sha = value => createHash('sha256').update(value).digest('hex');
async function copy(relative, recurse = true) {
  if (visited.has(relative) || adapters.has(relative)) return;
  visited.add(relative);
  const file = path.join(sourceRoot, relative), bytes = await fs.readFile(file);
  const output = path.join(destination, relative + '.source');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bytes);
  manifest.push({ file: relative, sha256: sha(bytes), bytes: bytes.length });
  if (!recurse || !/\.tsx?$/.test(relative)) return;
  const ast = ts.createSourceFile(file, bytes.toString(), ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) continue;
    const name = node.moduleSpecifier.text;
    if (!name.startsWith('.')) { external.add(name); continue; }
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(relative), name));
    const candidates = ['', '.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map(extension => base + extension);
    let found;
    for (const candidate of candidates) { try { if ((await fs.stat(path.join(sourceRoot, candidate))).isFile()) { found = candidate; break; } } catch {} }
    if (!found) throw new Error(`Cannot resolve ${relative}: ${name}`);
    await copy(found);
  }
}
await copy('components/Composer.tsx');
for (const file of ['types.ts', 'styles.css', 'theme/themePresets.ts', 'theme/themeTokens.ts', 'theme/themeTypes.ts', 'theme/colorUtils.ts', 'locales/zh.json', 'locales/en.json']) await copy(file, false);
await fs.writeFile(path.join(destination, 'tailwind.config.js.source'), await fs.readFile(path.join(source, 'tailwind.config.js')));
await fs.writeFile(path.join(destination, 'continuous-corners.postcss.mjs.source'), await fs.readFile(path.join(source, 'scripts/continuous-corners.postcss.mjs')));

// Use the source application's compiler and radius plugin, without changing its files.
const requireSource = createRequire(path.join(source, 'package.json'));
const postcss = requireSource('postcss'), tailwind = requireSource('tailwindcss');
const config = (await import(pathToFileURL(path.join(source, 'tailwind.config.js')).href)).default;
const corners = (await import(pathToFileURL(path.join(source, 'scripts/continuous-corners.postcss.mjs')).href)).default;
const content = await Promise.all(manifest.filter(item => /\.(tsx?|css)$/.test(item.file)).map(async item => ({ raw: (await fs.readFile(path.join(destination, item.file + '.source'), 'utf8')), extension: item.file.endsWith('.tsx') ? 'tsx' : 'html' })));
const stylesheet = (await Promise.all(['styles.css', ...manifest.filter(item => item.file.endsWith('.css') && item.file !== 'styles.css').map(item => item.file)].map(file => fs.readFile(path.join(sourceRoot, file), 'utf8')))).join('\n');
const compiled = await postcss([tailwind({ ...config, content }), corners()]).process(stylesheet, { from: undefined });
await fs.writeFile('src/lib/DeepAgent/original.css', compiled.css.replaceAll(':root', ':host'));

const tokens = await build({ stdin: { contents: `import { BUILTIN_PRESETS } from './themePresets'; import { paletteToTokens } from './themeTokens'; export const tokens = paletteToTokens(BUILTIN_PRESETS.find(item => item.id === 'codex').variants.light);`, resolveDir: path.join(sourceRoot, 'theme'), sourcefile: 'tokens.ts', loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' });
const tokenModule = await import('data:text/javascript;base64,' + Buffer.from(tokens.outputFiles[0].text).toString('base64'));
await fs.writeFile('src/lib/DeepAgent/original-theme.json', JSON.stringify(tokenModule.tokens, null, 2) + '\n');
await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ source: 'Deep Agent desktop source', files: manifest, external: [...external], compiler: { tailwind: requireSource('tailwindcss/package.json').version }, adapters: [...adapters], visualChanges: [] }, null, 2) + '\n');
await fs.mkdir('public/motion', { recursive: true });
await fs.writeFile('public/motion/deep-agent-original-source.txt', (await Promise.all(manifest.map(async item => `\n/* ===== ${item.file} · SHA256 ${item.sha256} ===== */\n${await fs.readFile(path.join(destination, item.file + '.source'), 'utf8')}`))).join('\n'));
console.log(`Imported ${manifest.length} original files byte for byte; compiled original Tailwind and continuous corners.`);
