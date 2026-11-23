import fs from 'node:fs/promises';

export async function buildElementalCardCarouselSource(entry){
  const [original,moduleSource,componentCss,fontBase]=await Promise.all([
    fs.readFile('public/motion/elemental-card-carousel-original.html','utf8'),
    fs.readFile('src/lib/motion-core/elemental-card-carousel.js','utf8'),
    fs.readFile('src/lib/motion-core/elemental-card-carousel.css','utf8'),
    fs.readFile('src/lib/ShareInvite/share-invite.css','utf8'),
  ]);
  const license=fontBase.slice(0,fontBase.indexOf('*/')+2);
  const font=fontBase.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter','ElementalInter');
  const css=license+'\n'+font+'\n'+componentCss;
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('id="stage"','id="stage" tabindex="0"')
    .replace('aria-label="Elements"','aria-label="Elements. Use Left, Right, Home, End or keys 1 to 4"');
  const core=moduleSource.replace('export function createElementalCardCarousel','function createElementalCardCarousel');
  await fs.writeFile('public/motion/elemental-card-carousel.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Elemental Card Carousel</title><style>${css}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const carousel=createElementalCardCarousel({
  document,window,
  on:(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
},{theme:document.documentElement.hasAttribute('data-leibox-motion-preview')?'light':'dark'});
addEventListener('pagehide',()=>{carousel.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${license}
${core}
export function mountElementalCardCarousel(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const carousel=createElementalCardCarousel(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);carousel.update(next);},
    destroy(){carousel.destroy();surface.controller.destroy();},
  };
}
`;
}
