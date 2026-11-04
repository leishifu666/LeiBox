import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChevronDown, CalendarPlus, UserRoundArrowLeft, ChartNoAxesColumnIncreasing } from 'lucide-react';

export async function buildStackedMetadataSource() {
  const render = icon => renderToStaticMarkup(createElement(icon, { size: 24, strokeWidth: 2.2, 'aria-hidden': true }));
  const icons = { priority: render(ChartNoAxesColumnIncreasing), calendar: render(CalendarPlus), person: render(UserRoundArrowLeft) };
  const base = await fs.readFile('src/lib/ShareInvite/share-invite.css', 'utf8');
  const font = base.slice(0, base.indexOf('@font-face')) + base.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter', 'StackedMetadataInter');
  const css = font + '\n' + await fs.readFile('src/lib/motion-core/stacked-metadata.css', 'utf8');
  const markup = `<section class="sm-scene notranslate" translate="no" aria-label="Task metadata list"><div class="sm-list"><h2 class="sm-heading">${render(ChevronDown)}<span class="sm-heading-text">In Progress</span></h2><div class="sm-rows"></div></div></section>`;
  const license = '/*! Lucide icons, ISC: ' + (await fs.readFile('node_modules/lucide-react/LICENSE', 'utf8')).replaceAll('*/', '* /') + ' */\n';
  const entry = license + `import {createStackedMetadata} from './stacked-metadata.mjs';\nexport function mountStackedMetadata(target,options={}){return createStackedMetadata(target,options,${JSON.stringify(css)},${JSON.stringify(markup)},${JSON.stringify(icons)});}`;
  const config = { stdin: { contents: entry, sourcefile: 'stacked-metadata-entry.js', resolveDir: path.resolve('src/lib/motion-core') }, bundle: true, write: false, platform: 'browser', target: 'es2020', legalComments: 'inline', logLevel: 'silent' };
  const packaged = await build({ ...config, format: 'esm', external: ['./motion-runtime'] });
  const standalone = await build({ ...config, format: 'iife', minify: true, stdin: { ...config.stdin, contents: entry + `\nconst preview=document.documentElement.hasAttribute('data-leibox-motion-preview');const instance=mountStackedMetadata(document.getElementById('stacked-metadata'),{height:innerHeight,theme:preview?'light':'dark'});const resize=()=>instance.update({height:innerHeight});addEventListener('resize',resize);document.fonts.ready.then(()=>{document.body.dataset.motionReady='true';});addEventListener('pagehide',()=>{removeEventListener('resize',resize);instance.destroy();},{once:true});` } });
  await fs.writeFile('public/motion/stacked-metadata.html', `<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stacked Metadata Tags</title><style>html,body{margin:0;background:#090909}</style></head><body><div id="stacked-metadata"></div><script>${standalone.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`);
  return packaged.outputFiles[0].text;
}
