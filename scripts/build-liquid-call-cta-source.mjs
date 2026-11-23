import fs from 'node:fs/promises';

export async function buildLiquidCallCtaSource(entry){
  const [original,moduleSource,componentCss,fontBase]=await Promise.all([
    fs.readFile('public/motion/liquid-call-cta-original.html','utf8'),
    fs.readFile('src/lib/motion-core/liquid-call-cta.js','utf8'),
    fs.readFile('src/lib/motion-core/liquid-call-cta.css','utf8'),
    fs.readFile('src/lib/ShareInvite/share-invite.css','utf8'),
  ]);
  const license=fontBase.slice(0,fontBase.indexOf('*/')+2);
  const font=fontBase.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter','LiquidCallInter');
  const css=license+'\n'+font+'\n'+componentCss;
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('<main class="stage">','<main class="stage" id="liquidCta" aria-label="Liquid call actions">');
  const core=moduleSource.replace('export function createLiquidCallCta','function createLiquidCallCta');
  await fs.writeFile('public/motion/liquid-call-cta.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Liquid Call CTA</title><style>${css}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const cta=createLiquidCallCta({
  document,window,
  on:(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  setTimeout:setTimeout.bind(window),clearTimeout:clearTimeout.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
});
addEventListener('pagehide',()=>{cta.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${license}
${core}
export function mountLiquidCallCta(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const cta=createLiquidCallCta(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);cta.update(next);},
    destroy(){cta.destroy();surface.controller.destroy();},
  };
}
`;
}
