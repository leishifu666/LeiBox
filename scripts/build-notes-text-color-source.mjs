import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ChevronLeft,Wifi,Signal} from 'lucide-react';
import {NOTES_COLORS} from '../src/data/notes-text-color.mjs';

export async function buildNotesTextColorSource(){
 const css=await fs.readFile('src/lib/motion-core/notes-text-color.css','utf8');
 const license=await fs.readFile('node_modules/lucide-react/LICENSE','utf8');
 const icon=component=>renderToStaticMarkup(createElement(component,{'aria-hidden':true}));
 const markup=`<main class="nc-scene notranslate" translate="no" aria-label="Notes text color"><div class="nc-device-wrap"><div class="nc-device"><section class="nc-screen" aria-label="Next week plans"><div class="nc-status" aria-hidden="true"><span>9:41</span><div class="nc-island"></div><div class="nc-system">${icon(Signal)}${icon(Wifi)}<i class="nc-battery"></i></div></div><nav class="nc-nav" aria-label="Notes"><button class="nc-back" type="button" aria-label="Reset notes">${icon(ChevronLeft)}Notes</button><strong>Next week plans</strong><button class="nc-done" type="button">Done</button></nav><div class="nc-scroll"><article class="nc-article" aria-label="Select note text to color"></article></div><div class="nc-overlay"></div><div class="nc-palette" role="dialog" aria-label="Text color" aria-hidden="true" inert><div class="nc-palette-main"><div class="nc-colors" role="radiogroup" aria-label="Colors">${NOTES_COLORS.map(color=>`<button class="nc-swatch" type="button" role="radio" aria-label="${color.name}" aria-checked="false" data-color="${color.id}" data-ink="${color.ink}" style="--nc-center:${color.center};--nc-color:${color.color};--nc-edge:${color.edge}"></button>`).join('')}<button class="nc-swatch" type="button" role="radio" aria-label="Custom color" aria-checked="false" data-color="custom"></button></div><div class="nc-history" aria-label="Recent colored selections"></div></div><div class="nc-custom" hidden><input type="range" min="0" max="360" value="270" aria-label="Custom color hue"></div></div><div class="nc-home" aria-hidden="true"></div><span class="nc-live" role="status" aria-live="polite"></span><span class="nc-instructions">Select text with the mouse, or focus a paragraph and press Enter to choose a color. Escape closes the palette.</span></section></div></div></main>`;
 const entry=`import {createNotesTextColor} from './notes-text-color.mjs';\nconst CSS=${JSON.stringify(css)}, MARKUP=${JSON.stringify(markup)};\nexport function mountNotesTextColor(target,options={}){return createNotesTextColor(target,options,CSS,MARKUP);}\n`;
 const shared={stdin:{contents:entry,sourcefile:'notes-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...shared,format:'esm',external:['gsap','./motion-runtime']});
 const standalone=await build({...shared,stdin:{...shared.stdin,contents:entry+`\nmountNotesTextColor(document.getElementById('notes-demo'));\nrequestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.dataset.motionReady='true';}));`},format:'iife',minify:true});
 await fs.writeFile('public/motion/notes-text-color.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notes Text Color</title><style>html,body{margin:0;background:#08090a}</style></head><body><div id="notes-demo"></div><script>/* Embedded Lucide icons: ${license.replaceAll('*/','* /')} */\n${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return `/* Embedded Lucide icons: ${license.replaceAll('*/','* /')} */\n`+packaged.outputFiles[0].text;
}
