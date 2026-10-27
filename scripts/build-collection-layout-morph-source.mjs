import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {COLLECTION_ITEMS} from '../src/data/collection-layout-morph.mjs';

export async function buildCollectionLayoutMorphSource(){
 const css=await fs.readFile('src/lib/motion-core/collection-layout-morph.css','utf8');
 const notice=await fs.readFile('src/lib/motion-core/vendor/agent-icons/SOURCE.md','utf8');
 const license=await fs.readFile('src/lib/motion-core/vendor/agent-icons/LICENSE','utf8');
 const sourceNotice=`/*! SVG sources and notice\n${notice.replaceAll('*/','* /')}\n${license.replaceAll('*/','* /')}\n*/\n`;
 const markup=`<main class="clm-scene notranslate" translate="no" aria-label="Collection layout morph"><div class="clm-stage"><section class="clm-panel"><h2 class="clm-heading">Collectibles</h2><div class="clm-tabs" role="tablist" aria-label="Collection view"><span class="clm-indicator" aria-hidden="true"></span>${['List','Card','Pack'].map(name=>`<button type="button" class="clm-tab" role="tab" data-view="${name.toLowerCase()}">${name} view</button>`).join('')}</div><div class="clm-divider" aria-hidden="true"></div><div class="clm-board" role="tabpanel">${COLLECTION_ITEMS.map((item,index)=>`<div class="clm-item" data-item="${item.id}"><div class="clm-tile" role="img" aria-label="${item.name}" style="background:${item.color}"><svg class="clm-art" viewBox="0 0 64 64" aria-hidden="true">${item.svg.replaceAll('$id','$instance-svg-'+index)}</svg></div><div class="clm-bar" aria-hidden="true"></div><div class="clm-bar" aria-hidden="true"></div><div class="clm-bar" aria-hidden="true"></div></div>`).join('')}<div class="clm-pack-meta" aria-hidden="true"><div class="clm-bar"></div><div class="clm-bar"></div></div></div><span class="clm-status clm-sr" aria-live="polite"></span></section></div></main>`;
 const entry=sourceNotice+`import {createCollectionLayoutMorph} from './collection-layout-morph.mjs';\nconst CSS=${JSON.stringify(css)},MARKUP=${JSON.stringify(markup)};\nexport function mountCollectionLayoutMorph(target,options={}){return createCollectionLayoutMorph(target,options,CSS,MARKUP);}\n`;
 const settings={stdin:{contents:entry,sourcefile:'collection-layout-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['gsap','./motion-runtime']});
 const bootstrap=`\nconst component=mountCollectionLayoutMorph(document.getElementById('collection-layout'));const announce=()=>{if(component.root.querySelector('.clm-scene').dataset.ready==='true'){document.body.dataset.motionReady='true';observer.disconnect();}};const observer=new MutationObserver(announce);observer.observe(component.root.querySelector('.clm-scene'),{attributes:true,attributeFilter:['data-ready']});announce();window.addEventListener('pagehide',()=>{observer.disconnect();component.destroy();},{once:true});`;
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+bootstrap},format:'iife',minify:true});
 await fs.writeFile('public/motion/collection-layout-morph.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collection Layout Morph</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="collection-layout"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
