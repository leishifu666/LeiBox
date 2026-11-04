import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {FLOOD_ITEMS,FLOOD_PALETTES,FLOOD_ICONS} from '../src/data/shader-flood.mjs';

export async function buildShaderFloodSource(){
 const css=await fs.readFile('src/lib/motion-core/shader-flood.css','utf8');
 const markup='<div class="sf-container"><main class="sf-scene notranslate" translate="no" aria-label="Directional liquid feature cards"><div class="sf-stage"><div class="sf-grid" role="group" aria-label="Product features"></div></div></main></div>';
 const license='/*! Lucide icons: Copyright (c) 2022 Lucide Contributors. ISC license.\n'+(await fs.readFile('node_modules/lucide-react/LICENSE','utf8')).replaceAll('*/','* /')+'\n*/\n';
 const entry=license+`import {createShaderFlood} from './shader-flood.mjs';\nexport function mountShaderFlood(target,options={}){return createShaderFlood(target,options,${JSON.stringify(css)},${JSON.stringify(markup)},${JSON.stringify(FLOOD_ITEMS)},${JSON.stringify(FLOOD_PALETTES)},${JSON.stringify(FLOOD_ICONS)});}\n`;
 const settings={stdin:{contents:entry,sourcefile:'shader-flood-entry.js',resolveDir:path.resolve('src/lib/motion-core')},bundle:true,write:false,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['./motion-runtime']});
 const standalone=await build({...settings,format:'iife',minify:true,stdin:{...settings.stdin,contents:entry+`\nconst preview=document.documentElement.hasAttribute('data-leibox-motion-preview');const component=mountShaderFlood(document.getElementById('shader-flood'),{height:Math.max(720,innerHeight),...(preview?{preview:true,background:'#f4f4f4'}:{})});const resize=()=>component.update({height:Math.max(720,innerHeight)});window.addEventListener('resize',resize);document.body.dataset.motionReady='true';window.addEventListener('pagehide',()=>{window.removeEventListener('resize',resize);component.destroy();},{once:true});`}});
 await fs.writeFile('public/motion/shader-flood.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Liquid Flood Cards</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="shader-flood"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
