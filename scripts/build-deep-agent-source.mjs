import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { dom } from '@fortawesome/fontawesome-svg-core';

const ORIGINAL = path.resolve('src/lib/DeepAgent/original');
const HOST = path.resolve('src/lib/DeepAgent');
const EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'gsap', 'deep-agent-base-ui/preview-card', 'deep-agent-lucide', '@fortawesome/fontawesome-svg-core', '@fortawesome/free-solid-svg-icons', '@fortawesome/react-fontawesome', '@radix-ui/react-slider', 'react-circular-progressbar', 'clsx', 'tailwind-merge'];
const API_NAMES = ['attachmentIngest', 'attachmentRemove', 'getActivePermissionPreset', 'getCommands', 'getPermissionPresetVisibility', 'getSettings', 'listSkills', 'searchProjectFiles', 'setActivePermissionPreset', 'setChatModel', 'setThinkingDepth'];

export async function buildDeepAgentSources({ referenceRoot } = {}) {
  const sourceRoot = referenceRoot ? path.resolve(referenceRoot, 'src') : ORIGINAL;
  const presentation = '.original-deep-agent-stage{display:flex;align-items:center;justify-content:center;min-height:var(--motion-height,600px);padding:24px 16px;background:var(--theme-bg);box-sizing:border-box}.original-composer-container{width:100%;max-width:768px}.original-effort-section{width:264px;max-width:100%}';
  const css = await fs.readFile(path.join(HOST, 'original.css'), 'utf8') + '\n' + dom.css() + '\n' + presentation;
  const tokens = JSON.parse(await fs.readFile(path.join(HOST, 'original-theme.json'), 'utf8'));
  const dictionary = JSON.parse(await fs.readFile(path.join(sourceRoot, referenceRoot ? 'locales/zh.json' : 'locales/zh.json.source'), 'utf8'));
  const adaptations = [];
  const register = `import { library } from '@fortawesome/fontawesome-svg-core'; import { faPlus, faArrowUp, faStop, faFile, faFileLines, faListCheck, faBullseye, faPaperclip, faCube, faFolder, faCircleCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons'; library.add(faPlus,faArrowUp,faStop,faFile,faFileLines,faListCheck,faBullseye,faPaperclip,faCube,faFolder,faCircleCheck,faCircleInfo,faXmark); export { OriginalDemo, disposeMessages } from './original-demo.jsx';`;
  const originalModule = await build({
    stdin: { contents: register, resolveDir: HOST, sourcefile: 'original-icons.js' }, write: false, bundle: true, format: 'cjs', platform: 'browser', target: 'es2020',
    jsx: 'automatic', external: EXTERNALS, legalComments: 'inline', logLevel: 'silent',
    plugins: [{ name: 'original-desktop-ui', setup(bundler) {
      bundler.onResolve({ filter: /^deep-agent-original:/ }, args => ({ path: args.path.replace('deep-agent-original:', ''), namespace: 'original-ui' }));
      bundler.onResolve({ filter: /^\./, namespace: 'original-ui' }, async args => {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(args.importer), args.path));
        if (resolved === 'api') return { path: 'api', namespace: 'original-platform' };
        for (const suffix of ['', '.ts', '.tsx', '.css', '/index.ts', '/index.tsx']) {
          const file = resolved + suffix;
          try { await fs.access(path.join(sourceRoot, file + (referenceRoot ? '' : '.source'))); return { path: file, namespace: 'original-ui' }; } catch {}
        }
        throw new Error('Original UI dependency was not imported: ' + resolved);
      });
      bundler.onResolve({ filter: /^react-i18next$/, namespace: 'original-ui' }, () => ({ path: 'translation', namespace: 'original-platform' }));
      bundler.onResolve({ filter: /^@base-ui\/react\//, namespace: 'original-ui' }, args => ({ path: args.path.replace('@base-ui/react/', 'deep-agent-base-ui/'), external: true }));
      bundler.onResolve({ filter: /^lucide-react$/, namespace: 'original-ui' }, () => ({ path: 'deep-agent-lucide', external: true }));
      bundler.onResolve({ filter: /^lucide-react$/ }, () => ({ path: 'deep-agent-lucide', external: true }));
      bundler.onLoad({ filter: /.*/, namespace: 'original-platform' }, args => ({ loader: 'js', contents: args.path === 'translation'
        ? 'const t = __deepAgentBridge.t; export function useTranslation() { return { t }; }'
        : `export const SETTINGS_CHANGED_EVENT = __deepAgentBridge.event;\n${API_NAMES.map(name => `export const ${name} = (...args) => __deepAgentBridge.api.${name}(...args);`).join('\n')}` }));
      bundler.onLoad({ filter: /.*/, namespace: 'original-ui' }, async args => {
        if (args.path.endsWith('.css')) return { contents: '', loader: 'js' };
        let source = await fs.readFile(path.join(sourceRoot, args.path + (referenceRoot ? '' : '.source')), 'utf8');
        if (args.path === 'components/shadcn/hover-card.tsx') {
          source = source.replace('<PreviewCardPrimitive.Portal data-slot=', '<PreviewCardPrimitive.Portal container={__deepAgentBridge.portals} data-slot=');
          adaptations.push({ file: args.path, change: 'Route the portal into this component instance; popup markup, styles and motion remain original.' });
        }
        if (args.path === 'components/message.tsx') {
          source += '\nexport function disposeMessages() { root?.unmount(); root = null; pushNotice = null; }\n';
          adaptations.push({ file: args.path, change: 'Expose disposal for the original desktop notice root.' });
        }
        return { contents: source, loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: path.resolve('node_modules') };
      });
    } }],
  });
  const engines = {};
  for (const [slug, name, variant] of [['reasoning-effort-slider', 'ReasoningEffortSlider', 'slider'], ['deep-agent-composer', 'DeepAgentComposer', 'composer']]) {
    const imports = EXTERNALS.map((dependency, index) => `import * as external${index} from ${JSON.stringify(dependency)};`).join('\n');
    const map = EXTERNALS.map((dependency, index) => `${JSON.stringify(dependency)}:external${index}`).join(',');
    const entry = `${imports}\nimport { mountOriginalDeepAgent } from './original-host.mjs';\nconst STYLE_TEXT=${JSON.stringify(css)}, TOKENS=${JSON.stringify(tokens)}, COPY=${JSON.stringify(dictionary)};\nconst dependencies=Object.fromEntries(Object.entries({${map}}).map(([key,value])=>[key,{...value,__esModule:true,default:value.default??value}]));\nexport function mount${name}(target,options={}){return mountOriginalDeepAgent(target,options,'${variant}',STYLE_TEXT,TOKENS,COPY,(window,document,setTimeout,clearTimeout,__deepAgentBridge)=>{const module={exports:{}};const exports=module.exports;const require=name=>{if(!dependencies[name])throw new Error('Missing original UI dependency: '+name);return dependencies[name];};\n${originalModule.outputFiles[0].text}\nreturn module.exports;});}\n`;
    const packaged = await build({ stdin: { contents: entry, resolveDir: HOST, sourcefile: 'original-entry.js', loader: 'js' }, write: false, bundle: true, format: 'esm', platform: 'browser', target: 'es2020', external: EXTERNALS, legalComments: 'inline', logLevel: 'silent' });
    engines[slug] = '/* Original Deep Agent Composer, ModelThinkingSelector and EffortSlider; UI source preserved. */\n' + packaged.outputFiles[0].text;
    const standalone = await build({ stdin: { contents: entry + `\nmount${name}(document.getElementById('deep-agent-demo'));`, resolveDir: HOST, sourcefile: 'standalone.js', loader: 'js' }, write: false, bundle: true, minify: true, format: 'iife', platform: 'browser', target: 'es2020', legalComments: 'inline', logLevel: 'silent' });
    const script = standalone.outputFiles[0].text.replaceAll('</script', '<\\/script');
    const file = referenceRoot ? `outputs/deep-agent-original/reference-${slug}.html` : `public/motion/${slug}.html`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} · Deep Agent 原版</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="deep-agent-demo"></div><script>${script}</script></body></html>`);
  }
  if (!referenceRoot) await fs.writeFile(path.join(HOST, 'original-adaptations.json'), JSON.stringify({ visualChanges: [], platformAdaptations: adaptations }, null, 2));
  return engines;
}
