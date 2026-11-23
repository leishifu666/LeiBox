import fs from 'node:fs/promises';

export async function buildPerforatedStampCardsSource(entry){
  const [original,moduleSource,assets,componentCss,fontBase]=await Promise.all([
    fs.readFile('public/motion/perforated-stamp-cards-original.html','utf8'),
    fs.readFile('src/lib/motion-core/perforated-stamp-cards.js','utf8'),
    fs.readFile('src/lib/motion-core/perforated-stamp-cards-assets.mjs','utf8'),
    fs.readFile('src/lib/motion-core/perforated-stamp-cards.css','utf8'),
    fs.readFile('src/lib/ShareInvite/share-invite.css','utf8'),
  ]);
  const license=fontBase.slice(0,fontBase.indexOf('*/')+2);
  const font=fontBase.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter','StampInter');
  const css=license+'\n'+font+'\n'+componentCss;
  const core=assets.replace('export const','const')+'\n'+moduleSource
    .replace("import {STAMP_IMAGES} from './perforated-stamp-cards-assets.mjs';",'')
    .replace('export function createPerforatedStampCards','function createPerforatedStampCards');
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace(/<svg class="svg-defs"[\s\S]*?<\/svg>/,'')
    .replace('<main class="viewport">','<main class="viewport" id="stampCards" aria-label="Three perforated illustration cards">')
    .replace(/(<img )src="[^"]+"/g,'$1draggable="false"');
  await fs.writeFile('public/motion/perforated-stamp-cards.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Perforated Stamp Cards</title><style>${css}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const cards=createPerforatedStampCards({
  document,
  on:(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
},{preview:document.documentElement.hasAttribute('data-leibox-motion-preview')});
addEventListener('pagehide',()=>{cards.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${license}
${core}
export function mountPerforatedStampCards(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const cards=createPerforatedStampCards(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);cards.update(next);},
    destroy(){cards.destroy();surface.controller.destroy();},
  };
}
`;
}
