import fs from 'node:fs/promises';

export async function buildOpticalGlassCardsSource(entry){
  const [original,moduleSource,shaders,css,font]=await Promise.all([
    fs.readFile('public/motion/optical-glass-cards-original.html','utf8'),
    fs.readFile('src/lib/motion-core/optical-glass-cards.js','utf8'),
    fs.readFile('src/lib/motion-core/optical-glass-cards-shaders.mjs','utf8'),
    fs.readFile('src/lib/motion-core/optical-glass-cards.css','utf8'),
    fs.readFile('src/lib/motion-core/optical-glass-cards-fonts.css','utf8'),
  ]);
  const styles=font+'\n'+css;
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('<main class="stage">','<main class="optical-gallery" id="opticalGallery" aria-label="Two animated optical cards"><div class="stage">')
    .replace('</main>','</div></main>')
    .replace('id="overlay-ai" aria-hidden="true"','id="overlay-ai" role="dialog" aria-labelledby="details-title-ai" inert aria-hidden="true"')
    .replace('id="overlay-optical" aria-hidden="true"','id="overlay-optical" role="dialog" aria-labelledby="details-title-optical" inert aria-hidden="true"')
    .replace('class="card__overlay-title">AI','class="card__overlay-title" id="details-title-ai">AI')
    .replace('class="card__overlay-title">Optical','class="card__overlay-title" id="details-title-optical">Optical')
    .replace('data-open="overlay-ai"','data-open="overlay-ai" aria-expanded="false" aria-controls="overlay-ai"')
    .replace('data-open="overlay-optical"','data-open="overlay-optical" aria-expanded="false" aria-controls="overlay-optical"');
  const core=shaders.replaceAll('export const','const')+'\n'+moduleSource
    .replace("import {fragAI,fragOptical} from './optical-glass-cards-shaders.mjs';",'')
    .replace('export function createOpticalGlassCards','function createOpticalGlassCards');
  await fs.writeFile('public/motion/optical-glass-cards.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3D Optical Cards</title><style>${styles}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const gallery=createOpticalGlassCards({
  document,window,
  on:(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,IntersectionObserver,
},{preview:document.documentElement.hasAttribute('data-leibox-motion-preview')});
addEventListener('pagehide',()=>{gallery.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${core}
export function mountOpticalGlassCards(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css:styles,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const gallery=createOpticalGlassCards(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);gallery.update(next);},
    destroy(){gallery.destroy();surface.controller.destroy();},
  };
}
`;
}
