import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

export async function buildImageCompareSource() {
  const [photo, css, licence] = await Promise.all([
    fs.readFile('public/assets/components/image-compare/yaks.webp'),
    fs.readFile('src/lib/motion-core/image-compare.css', 'utf8'),
    fs.readFile('src/lib/motion-core/image-compare.LICENSE', 'utf8'),
  ]);
  const image = `data:image/webp;base64,${photo.toString('base64')}`;
  const entry = `/*!\n${licence}\n*/
import { createImageCompare } from './image-compare.mjs';
export function mountImageCompare(target, options = {}) {
  return createImageCompare(target, options, ${JSON.stringify(css)}, ${JSON.stringify(image)});
}`;
  const demo = `
const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
const instance = mountImageCompare(document.getElementById('image-compare'));
let timer;
Promise.all([...instance.root.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => {
  document.body.dataset.motionReady = 'true';
  if (!preview) return;
  parent.postMessage({ type: 'leibox-preview-ready', slug: 'image-compare' }, '*');
  const slider = instance.root.querySelector('.cmp');
  let step = 0;
  timer = setInterval(() => {
    if (document.hidden) return;
    const key = step % 2 ? 'ArrowLeft' : 'ArrowRight';
    const count = step++ ? 6 : 3;
    for (let i = 0; i < count; i++) slider.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
  }, 2100);
});
addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearInterval(timer);
  instance.destroy();
});`;
  const config = {
    stdin: { contents: entry, sourcefile: 'image-compare-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', legalComments: 'inline', logLevel: 'silent',
  };
  const [packaged, standalone] = await Promise.all([
    build({ ...config, format: 'esm', external: ['./motion-runtime'] }),
    build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + demo } }),
  ]);
  const html = `<!doctype html>
<html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image Compare</title>
<style>
html,body{margin:0;min-height:100%;background:#f4f4f4}
body{display:grid;min-height:100vh;box-sizing:border-box;place-items:center}
#image-compare{width:100%;min-width:0}
</style></head><body><div id="image-compare"></div><script>${standalone.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  await fs.writeFile('public/motion/image-compare.html', html);
  return packaged.outputFiles[0].text;
}
