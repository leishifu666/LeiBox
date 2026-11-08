import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

export async function buildImageAccordionSource() {
  // Name the five shots so adding an asset cannot change the strip or its order.
  const subjects = [['bird', 'Coastal bird'], ['cow', 'Highland cow'], ['house', 'Red coastal house'], ['man', 'Hiker above the fjord'], ['queue', 'Ferry queue']];
  const images = await Promise.all(subjects.map(async ([file, name]) => {
    const bytes = await fs.readFile(`public/assets/components/image-accordion/${file}.webp`);
    return { name, src: `data:image/webp;base64,${bytes.toString('base64')}` };
  }));
  const [css, licence] = await Promise.all([
    fs.readFile('src/lib/motion-core/image-accordion.css', 'utf8'),
    fs.readFile('src/lib/motion-core/image-accordion.LICENSE', 'utf8'),
  ]);
  const entry = `/*!\n${licence}\n*/
import { createImageAccordion } from './image-accordion.mjs';
export function mountImageAccordion(host, options = {}) {
  return createImageAccordion(host, options, ${JSON.stringify(css)}, ${JSON.stringify(images)});
}`;
  const demo = `
const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
const instance = mountImageAccordion(document.getElementById('image-accordion'));
const strip = instance.root.querySelector('.acc');
let timer;
Promise.all([...strip.querySelectorAll('img')].map(image => image.decode().catch(() => {}))).then(() => {
  document.body.dataset.motionReady = 'true';
  if (!preview) return;
  parent.postMessage({ type: 'leibox-preview-ready', slug: 'image-accordion' }, '*');
  const sequence = [2, 0, 4, 1, 3, -1];
  let step = 0;
  timer = setInterval(() => {
    if (document.hidden) return;
    const index = sequence[step++ % sequence.length];
    const cell = strip.children[index];
    if (cell) cell.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    else strip.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse' }));
  }, 1850);
});
addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearInterval(timer);
  instance.destroy();
});`;
  const config = {
    stdin: { contents: entry, sourcefile: 'image-accordion-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', legalComments: 'inline', logLevel: 'silent',
  };
  const [packaged, standalone] = await Promise.all([
    build({ ...config, format: 'esm', external: ['./motion-runtime'] }),
    build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + demo } }),
  ]);
  const html = `<!doctype html>
<html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image Accordion</title>
<style>
html,body{margin:0;min-height:100%;background:#f4f4f4}
body{display:grid;min-height:100vh;box-sizing:border-box;place-items:center}
#image-accordion{width:100%;min-width:0}
</style></head><body><div id="image-accordion"></div><script>${standalone.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  await fs.writeFile('public/motion/image-accordion.html', html);
  return packaged.outputFiles[0].text;
}
