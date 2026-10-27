import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {SELECTION_FLOWER_TEXT} from '../src/data/selection-flower.mjs';

export async function buildSelectionFlowerSource(){
 const css=await fs.readFile('src/lib/motion-core/selection-flower.css','utf8');
 const opening='Let go, and it grows backwards.';
 const paragraphs=SELECTION_FLOWER_TEXT.map((text,i)=>`<p tabindex="0" aria-label="Paragraph ${i+1}. Select text or press Enter to grow flowers.">${i===2?`<em>${opening}</em>`+text.slice(opening.length):text}</p>`).join('');
 const markup=`<main class="sf-scene selection-flower-demo notranslate" translate="no" aria-label="Text selection flowers"><article class="sf-article" aria-label="Select any text to grow flowers"><h1 tabindex="0">Select any of this and<br>watch it flower.</h1>${paragraphs}</article><canvas class="sf-canvas" aria-hidden="true"></canvas><span class="sf-live sf-sr" role="status" aria-live="polite"></span><span class="sf-sr">Drag to select text and grow flowers. Release to retract. Focus a paragraph and press Enter or Space, Shift with arrow keys to extend, or Escape to clear. Touch: tap or long-press text.</span></main>`;
 const entry=`import {createSelectionFlower} from './selection-flower.mjs';\nconst CSS=${JSON.stringify(css)},MARKUP=${JSON.stringify(markup)};\nexport function mountSelectionFlower(target,options={}){return createSelectionFlower(target,options,CSS,MARKUP);}\n`;
 const shared={stdin:{contents:entry,sourcefile:'selection-flower-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...shared,format:'esm',external:['./motion-runtime']});
 const standalone=await build({...shared,stdin:{...shared.stdin,contents:entry+`\nconst instance=mountSelectionFlower(document.getElementById('selection-flower-demo'));\nwindow.addEventListener('pagehide',()=>instance.destroy(),{once:true});\nrequestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.dataset.motionReady='true';}));`},format:'iife',minify:true});
 await fs.writeFile('public/motion/selection-flower.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Text Selection Flowers</title><style>html,body{margin:0;background:#fff}body[data-preview] #selection-flower-demo{background:#f4f4f4}</style></head><body><div id="selection-flower-demo"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
