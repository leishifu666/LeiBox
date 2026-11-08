import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

export async function buildCardSwapSource() {
  const labels = [['mount', 'Mountain'], ['bloom', 'Bloom'], ['peak', 'Peak'], ['wings', 'Wings']];
  const cards = await Promise.all(labels.map(async ([name, title]) => {
    const image = await fs.readFile(`public/assets/components/card-swap/${name}.webp`);
    return { title, src: `data:image/webp;base64,${image.toString('base64')}` };
  }));
  const css = await fs.readFile('src/lib/motion-core/card-swap.css', 'utf8');
  const entry = `import { createCardSwap } from './card-swap.mjs';
export function mountCardSwap(target, options = {}) {
  return createCardSwap(target, options, ${JSON.stringify(css)}, ${JSON.stringify(cards)});
}`;
  const standalone = `
const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
const toggle = document.getElementById('card-swap-auto');
const instance = mountCardSwap(document.getElementById('card-swap'), { every: preview ? 2.4 : 4 });
toggle.parentElement.hidden = preview;
toggle.addEventListener('change', () => instance.update({ auto: toggle.checked }));
const language = document.documentElement.lang;
if (language.startsWith('zh')) document.getElementById('card-swap-auto-label').textContent = '自动切换';
Promise.all([...instance.root.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => {
  document.body.dataset.motionReady = 'true';
  if (preview) {
    parent.postMessage({ type: 'leibox-preview-ready', slug: 'card-swap' }, '*');
    instance.update({ auto: true });
  }
});
addEventListener('pagehide', event => { if (!event.persisted) instance.destroy(); });`;
  const config = {
    stdin: { contents: entry, sourcefile: 'card-swap-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
  };
  const [packaged, standaloneBundle] = await Promise.all([
    build({ ...config, format: 'esm', external: ['./motion-runtime'] }),
    build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + standalone } }),
  ]);
  const html = `<!doctype html>
<html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Card Swap</title>
<style>
html,body{margin:0;min-height:100%;background:#f4f4f4}
body{display:grid;min-height:100vh;box-sizing:border-box;place-items:center}
#card-swap{width:100%;min-width:0}
.auto{
  position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
  display:flex;min-height:40px;padding:0 10px;gap:7px;align-items:center;
  color:#383838;font:500 14px/1.3 system-ui,sans-serif;white-space:nowrap;cursor:pointer;
}
.auto[hidden]{display:none}
.auto input{margin:0;accent-color:#343a35}
</style></head>
<body><div id="card-swap"></div><label class="auto"><input type="checkbox" id="card-swap-auto"><span id="card-swap-auto-label">Auto</span></label><script>${standaloneBundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  await fs.writeFile('public/motion/card-swap.html', html);
  return packaged.outputFiles[0].text;
}
