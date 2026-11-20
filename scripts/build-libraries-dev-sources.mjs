import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const sceneDir = path.resolve('src/lib/motion-core/libraries-dev');
const dependencyDir = path.resolve('node_modules');
const adapterRuntime = {
  name: 'leibox-motion-runtime',
  setup(build) {
    build.onResolve({ filter: /^\.\.\/motion-runtime$/ }, () => ({ path: './motion-runtime', external: true }));
  },
};
const readNotice = (name, file = 'LICENSE') => fs.readFile(path.join(dependencyDir, name, file), 'utf8');
const comment = notices => '/*!\n' + notices.join('\n\n').trim().replaceAll('*/', '* /') + '\n*/';
const packageNameOf = dependency => dependency.replace(/(?<=.)@[^@/]+$/, '');

export async function buildLibrariesDevSources(entries) {
  const css = await fs.readFile(path.join(sceneDir, 'demo.css'), 'utf8');
  const reactNotices = await Promise.all(['react', 'react-dom', 'scheduler'].map(name => readNotice(name)));
  const results = await Promise.all(Object.entries(entries).map(async ([slug, entry]) => {
    const { packageName, version, width, height, page, extraDependencies = [] } = entry;
    const name = slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
    const license = await readNotice(packageName);
    const notices = [`${packageName}@${version} · Jakub Antalik · https://libraries.dev/${page}`, license];
    if (packageName === 'metal-fx') {
      notices.push(await readNotice(packageName, 'NOTICE'), await fs.readFile(path.join(sceneDir, 'Paper-Shaders.LICENSE'), 'utf8'));
    }
    const dependencies = ['react', 'react-dom', `${packageName}@${version}`, ...extraDependencies];
    const source = `
      import Scene from "./${slug}.jsx";
      import { mountLibraryDemo } from "./mount.jsx";
      const scene = { slug: ${JSON.stringify(slug)}, width: ${width}, height: ${height}, css: ${JSON.stringify(css)}, Scene };
      export function mount${name}(target, options = {}) {
        return mountLibraryDemo(target, options, scene);
      }
    `;
    const standalone = source + `
      const preview = document.documentElement.hasAttribute('data-leibox-motion-preview');
      let readyFrame = 0;
      const onReady = () => {
        const deadline = performance.now() + 5000;
        const ready = () => {
          // The avatar package bakes its texture before fading the canvas in.
          // Keep the gallery cover visible during that first render.
          if (scene.slug === 'bot-avatars' && performance.now() < deadline &&
              instance.root.querySelector('.bot-demo-avatar canvas')?.style.opacity !== '1') {
            readyFrame = requestAnimationFrame(ready);
            return;
          }
          document.body.dataset.motionReady = 'true';
          if (parent !== window) parent.postMessage({ type: 'leibox-preview-ready', slug: scene.slug }, '*');
        };
        readyFrame = requestAnimationFrame(() => { readyFrame = requestAnimationFrame(ready); });
      };
      const instance = mountLibraryDemo(document.querySelector('main'), {
        height: Math.max(scene.height, innerHeight),
        locale: new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en',
      }, scene, { preview, onReady });
      const resize = () => instance.update({ height: Math.max(scene.height, innerHeight) });
      const localize = event => {
        if (parent === window || event.source !== parent || event.data?.type !== 'leibox-library-locale') return;
        const locale = event.data.locale === 'zh' ? 'zh' : 'en';
        document.documentElement.lang = locale;
        instance.update({ locale });
      };
      addEventListener('resize', resize);
      addEventListener('message', localize);
      addEventListener('pagehide', event => {
        if (event.persisted) return;
        cancelAnimationFrame(readyFrame);
        removeEventListener('resize', resize);
        removeEventListener('message', localize);
        instance.destroy();
      });
    `;
    const config = {
      stdin: { contents: source, sourcefile: `${slug}-entry.js`, resolveDir: sceneDir },
      bundle: true,
      write: false,
      platform: 'browser',
      jsx: 'automatic',
      target: 'es2020',
      legalComments: 'inline',
      loader: { '.webp': 'dataurl', '.jpg': 'dataurl', '.png': 'dataurl' },
    };
    const extraNotices = await Promise.all(extraDependencies.map(dependency => readNotice(packageNameOf(dependency))));
    const [engine, browser] = await Promise.all([
      build({
        ...config,
        format: 'esm',
        external: dependencies.map(packageNameOf),
        plugins: [adapterRuntime],
        banner: { js: comment(notices) },
      }),
      build({
        ...config,
        stdin: { ...config.stdin, contents: standalone },
        format: 'iife',
        minify: true,
        define: { 'process.env.NODE_ENV': '"production"' },
        banner: { js: comment([...notices, ...reactNotices, ...extraNotices]) },
      }),
    ]);
    const html = `<!doctype html>
<html lang="en" data-leibox-library translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${entry.name}</title>
<style>html,body{margin:0;min-height:100%;background:#fff}main{width:100%;min-width:0}</style>
</head><body><main></main><script>${browser.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></body></html>
`;
    await fs.writeFile(path.join('public/motion', `${slug}.html`), html);
    return [slug, { engine: engine.outputFiles[0].text, dependencies }];
  }));
  return Object.fromEntries(results);
}
