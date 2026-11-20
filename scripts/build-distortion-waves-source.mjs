import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import sharp from 'sharp';

export async function buildDistortionWavesSource() {
  const css = await fs.readFile('src/lib/motion-core/distortion-waves.css', 'utf8');
  const license = await fs.readFile('src/lib/motion-core/distortion-waves.LICENSE', 'utf8');
  const portrait = await sharp('src/lib/BrandPosterCards/assets/clear-glasses.webp')
    .resize(144, 144, { fit: 'cover' })
    .webp({ quality: 82 })
    .toBuffer();
  const avatar = `data:image/webp;base64,${portrait.toString('base64')}`;
  const banner = `/*!\n${license.trim().split('\n').map(line => ` * ${line}`).join('\n')}\n */`;
  const entry = `
import { createDistortionWaves } from './distortion-waves.mjs';
const css = ${JSON.stringify(css)};
const avatar = ${JSON.stringify(avatar)};
export function mountDistortionWaves(host, options = {}) {
  return createDistortionWaves(host, options, { css, avatar });
}`;
  const demo = `
const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
const poster = document.documentElement.hasAttribute('data-distortion-poster');
const gallery = preview || poster;
const sceneHeight = () => Math.max(540, innerHeight);
const instance = createDistortionWaves(
  document.querySelector('main'),
  { height: sceneHeight(), showControls: !gallery, ...(gallery ? { scrub: 0.25 } : {}) },
  { css, avatar, gallery }
);
const resize = () => instance.update({ height: sceneHeight() });
addEventListener('resize', resize);
let firstTimer, loopTimer;
if (gallery) {
  instance.prepare().then(() => {
    instance.update({ scrub: 0.25 });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.dataset.motionReady = 'true';
      if (preview) {
        parent.postMessage({ type: 'leibox-preview-ready', slug: 'distortion-waves' }, '*');
        const reduced = () => document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches;
        firstTimer = setTimeout(() => {
          if (!reduced()) instance.update({ scrub: null, revealed: true });
        }, 180);
        const cta = instance.root.querySelector('[data-dw-cta]');
        loopTimer = setInterval(() => {
          if (!reduced()) cta?.click();
        }, 3200);
      }
    }));
  });
} else {
  document.body.dataset.motionReady = 'true';
}
addEventListener('pagehide', event => {
  if (event.persisted) return;
  clearTimeout(firstTimer);
  clearInterval(loopTimer);
  removeEventListener('resize', resize);
  instance.destroy();
});`;
  const config = {
    stdin: { contents: entry, sourcefile: 'distortion-waves-entry.js', resolveDir: path.resolve('src/lib/motion-core') },
    bundle: true, write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
    legalComments: 'inline', banner: { js: banner },
  };
  const [packaged, standalone] = await Promise.all([
    build({ ...config, format: 'esm', external: ['./motion-runtime'] }),
    build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + demo } }),
  ]);
  const html = `<!doctype html>
<html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Distortion Waves</title>
<style>
html,body{margin:0;min-height:100%;background:#fff}
body{display:grid;min-height:100vh;place-items:center}
main{width:100%;min-width:0}
</style></head><body><main></main><script>${standalone.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  await fs.writeFile('public/motion/distortion-waves.html', html);
  return packaged.outputFiles[0].text;
}
