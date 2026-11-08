import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

export async function buildPixelToggleSource() {
  const css = await fs.readFile('src/lib/motion-core/pixel-toggle.css', 'utf8');
  const entry = `
import { createPixelToggle } from './pixel-toggle.mjs';
const css = ${JSON.stringify(css)};
export function mountPixelToggle(host, options = {}) {
  return createPixelToggle(host, options, css);
}`;
  const demo = `
const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
const gallery = preview || document.documentElement.hasAttribute('data-pixel-poster');
const sceneHeight = () => Math.max(540, innerHeight / Math.min(1, innerWidth / 720));
const instance = createPixelToggle(document.querySelector('main'), { sound: !gallery, height: sceneHeight() }, css, gallery);
const resize = () => instance.update({ height: sceneHeight() });
addEventListener('resize', resize);
const control = instance.root.querySelector('.pixel-switch');
document.body.dataset.motionReady = 'true';
let timer;
if (preview) {
  requestAnimationFrame(() => parent.postMessage({ type: 'leibox-preview-ready', slug: 'pixel-toggle' }, '*'));
  timer = setInterval(() => {
    if (!document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) control.click();
  }, 1800);
}
addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearInterval(timer);
  removeEventListener('resize', resize);
  instance.destroy();
});`;
  const config = {
    stdin: { contents: entry, sourcefile: 'pixel-toggle-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
  };
  const [packaged, standalone] = await Promise.all([
    build({ ...config, format: 'esm', external: ['./motion-runtime'] }),
    build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + demo } }),
  ]);
  const html = `<!doctype html>
<html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Day–Night Toggle</title>
<style>
html,body{margin:0;min-height:100%;background:#151516}
html[data-leibox-motion-preview],html[data-leibox-motion-preview] body,html[data-pixel-poster],html[data-pixel-poster] body{background:#f4f4f4}
body{display:grid;min-height:100vh;place-items:center}
main{width:100%;min-width:0}
</style></head><body><main></main><script>${standalone.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  await fs.writeFile('public/motion/pixel-toggle.html', html);
  return packaged.outputFiles[0].text;
}
