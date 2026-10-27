import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SunMedium,ChartPie,Calendar,CircleDot,Settings} from 'lucide-react';
import {FLUID_TOOLTIP_ITEMS} from '../src/data/fluid-tooltip.mjs';

export async function buildFluidTooltipSource(){
 const base=await fs.readFile('src/lib/ShareInvite/share-invite.css','utf8');
 const font=base.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter','FluidTooltipInter');
 const license=await fs.readFile('node_modules/lucide-react/LICENSE','utf8');
 const notice='/*!\n'+base.slice(2,base.indexOf('*/'))+'\nLucide icon license\n'+license.replaceAll('*/','* /')+'\n*/\n';
 const noise='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" seed="17"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".7"/></svg>');
 const css=font+'\n'+await fs.readFile('src/lib/motion-core/fluid-tooltip.css','utf8')+`\n.ft-scene{--ft-grain:url("${noise}")}\n`;
 const logo='data:image/svg+xml;base64,'+(await fs.readFile('public/leibox-mark.svg')).toString('base64');
 const icons=[SunMedium,ChartPie,Calendar,CircleDot,Settings].map(icon=>renderToStaticMarkup(createElement(icon,{size:44,strokeWidth:1.6,'aria-hidden':true})));
 const buttons=FLUID_TOOLTIP_ITEMS.map((item,index)=>`<button type="button" class="ft-trigger" data-item="${item.id}" aria-label="${item.label}"${index<5?` aria-keyshortcuts="Meta+${index+1} Control+${index+1}"`:''}>${index<5?icons[index]:`<img class="ft-logo" src="${logo}" alt="" draggable="false"/>`}</button>`).join('');
 const rows=FLUID_TOOLTIP_ITEMS.map(item=>`<div class="ft-label-row" data-label="${item.id}" aria-hidden="true"><span class="ft-label">${item.label}</span>${item.shortcut?`<kbd>${item.shortcut}</kbd>`:''}</div>`).join('');
 const markup=`<main class="ft-scene notranslate" translate="no" aria-label="Fluid navigation tooltips"><div class="ft-stage"><div class="ft-panel" aria-hidden="true"></div><nav class="ft-rail" aria-label="Workspace shortcuts">${buttons}</nav><div class="ft-tooltip" role="tooltip" aria-hidden="true"><div class="ft-label-track">${rows}</div></div><div class="ft-grain" aria-hidden="true"></div></div></main>`;
 const entry=notice+`import {createFluidTooltip} from './fluid-tooltip.mjs';\nconst CSS=${JSON.stringify(css)},MARKUP=${JSON.stringify(markup)},ITEMS=${JSON.stringify(FLUID_TOOLTIP_ITEMS)},LOGO=${JSON.stringify(logo)};\nexport function mountFluidTooltip(target,options={}){return createFluidTooltip(target,options,CSS,MARKUP,ITEMS,LOGO);}\n`;
 const settings={stdin:{contents:entry,sourcefile:'fluid-tooltip-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['gsap','./motion-runtime']});
 const bootstrap=`\nconst component=mountFluidTooltip(document.getElementById('fluid-tooltip'));const announce=()=>{if(component.root.querySelector('.ft-scene').dataset.ready==='true'){document.body.dataset.motionReady='true';observer.disconnect();}};const observer=new MutationObserver(announce);observer.observe(component.root.querySelector('.ft-scene'),{attributes:true,attributeFilter:['data-ready']});announce();window.addEventListener('pagehide',()=>{observer.disconnect();component.destroy();},{once:true});`;
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+bootstrap},format:'iife',minify:true});
 await fs.writeFile('public/motion/fluid-tooltip.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fluid Tooltip</title><style>html,body{margin:0;background:#46536b}</style></head><body><div id="fluid-tooltip"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
