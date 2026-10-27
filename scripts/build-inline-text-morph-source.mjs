import fs from 'node:fs/promises';
import {INLINE_MORPH_GROUPS,INLINE_MORPH_ICONS} from '../src/data/inline-text-morph.mjs';

export async function buildInlineTextMorphSource(){
 const read=file=>fs.readFile(file,'utf8');
 const fontSource=await read('src/lib/ShareInvite/share-invite.css');
 const fontEnd=fontSource.indexOf('.leibox-share {');
 if(fontEnd<0)throw new Error('Embedded Inter font and license block not found');
 const css=fontSource.slice(0,fontEnd).replaceAll('ShareInviteInter','InlineMorphInter')+await read('src/lib/motion-core/inline-text-morph.css');
 const vendor=await read('src/lib/motion-core/vendor/torph/index.mjs');
 const license=await read('src/lib/motion-core/vendor/torph/LICENSE');
 const iconLicense=await read('src/lib/motion-core/vendor/agent-icons/LICENSE');
 const iconSource=await read('src/lib/motion-core/vendor/agent-icons/SOURCE.md');
 const exports=vendor.match(/export\{([^}]+)\};?\s*$/)?.[1];
 const text=exports?.match(/(\w+) as TextMorph(?:,|$)/)?.[1];
 const controller=exports?.match(/(\w+) as MorphController(?:,|$)/)?.[1];
 if(!text||!controller)throw new Error('Pinned Torph 0.1.3 export contract changed');
 // Track WAAPI instances even when Torph removes an exiting glyph before its
 // longer transform finishes. Unmount must also cancel those detached effects.
 const trackedVendor=vendor.replace(/export\{[^}]+\};?\s*$/,'').replace(/([\w.]+)\.animate\(/g,'trackAnimation($1,');
 const library=`/* Torph 0.1.3 — upstream MIT notice\n${license.replaceAll('*/','* /')}\n*/\nfunction createInlineTorph(document,window,trackAnimation){\n${trackedVendor}\nreturn {TextMorph:${text},MorphController:${controller}};\n}\n`;
 const data=`/* Agent SVG source and notice\n${iconSource.replaceAll('*/','* /')}\n${iconLicense.replaceAll('*/','* /')}\n*/\nconst INLINE_GROUPS=${JSON.stringify(INLINE_MORPH_GROUPS)};\nconst INLINE_ICONS=${JSON.stringify(INLINE_MORPH_ICONS)};\n`;
 const behavior=await read('src/lib/motion-core/inline-text-morph.js');
 const script=library+data+behavior;
 const token=key=>`<button type="button" class="itm-token" data-group="${key}"><span class="itm-icon-window" aria-hidden="true"></span><span class="itm-text" aria-hidden="true"><span class="itm-label"></span></span><span class="itm-measure" aria-hidden="true"></span></button>`;
 const markup=`<main class="itm-scene notranslate" translate="no" aria-label="Inline text morph"><div class="itm-stage"><div class="itm-logo" aria-label="Graphical">Graphical</div><div class="itm-sentence" aria-hidden="false"><span class="itm-line"><span aria-hidden="true">A tool to create visual </span>${token('language')}<span aria-hidden="true">,</span></span><span class="itm-line"><span aria-hidden="true">customize </span>${token('customize')}<span aria-hidden="true">, and build</span></span><span class="itm-line"><span aria-hidden="true">interfaces with </span>${token('agent')}<span aria-hidden="true">.</span></span></div></div><span class="itm-accessible itm-sr"></span><span class="itm-status itm-sr" aria-live="polite"></span></main>`;
 await fs.writeFile('public/motion/inline-text-morph.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inline Text Morph</title><style>${css}</style></head><body>${markup}<script>${script}\nwindow.addEventListener('pagehide',()=>inlineMorph.destroy(),{once:true});</script></body></html>`);
 const native=script.replace(/([\w.]+)\.getBoundingClientRect\(\)/g,'scope.rect($1)');
 return `import {createSurface} from './motion-runtime';\nexport function mountInlineTextMorph(target,options={}){\nconst scope=createSurface(target,${JSON.stringify({markup,css,width:1044,height:684})},options);\nconst {document,window,requestAnimationFrame,cancelAnimationFrame,ResizeObserver,matchMedia}=scope;\n${native}\nscope.addCleanup(()=>inlineMorph.destroy());scope.ready();\nreturn {...scope.controller,update(next){scope.controller.update(next);inlineMorph.update();}};\n}\n`;
}
