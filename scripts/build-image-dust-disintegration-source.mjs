import fs from 'node:fs/promises';

export async function buildImageDustDisintegrationSource(entry){
  const [original,moduleSource,assets,css]=await Promise.all([
    fs.readFile('public/motion/image-dust-disintegration-original.html','utf8'),
    fs.readFile('src/lib/motion-core/image-dust-disintegration.js','utf8'),
    fs.readFile('src/lib/motion-core/image-dust-disintegration-assets.mjs','utf8'),
    fs.readFile('src/lib/motion-core/image-dust-disintegration.css','utf8'),
  ]);
  const core=assets.replace('export const','const')+'\n'+moduleSource
    .replace("import {PORTRAIT_SRC} from './image-dust-disintegration-assets.mjs';",'')
    .replace('export function createImageDustDisintegration','function createImageDustDisintegration');
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('<main class="stage">','<main class="stage" id="imageDustDisintegration">')
    .replace(/(<img id="cardPhoto" )src="[^"]*"/,'$1')
    .replace('aria-label="Generated image card"','role="group" aria-label="Portrait card. Press Enter for image actions" tabindex="-1" inert')
    .replace('aria-label="Image actions"','aria-label="Image actions" aria-orientation="vertical"')
    .replaceAll('class="action-btn"','class="action-btn" disabled tabindex="-1"')
    .replace('id="restoreWrap"','id="restoreWrap" inert aria-hidden="true"')
    .replace('Generate again','Replay image')
    .replace('title="Regenerate" aria-label="Regenerate image"','title="Replay" aria-label="Replay image loading"');
  await fs.writeFile('public/motion/image-dust-disintegration.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image Dust Disintegration</title><style>${css}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const dust=createImageDustDisintegration({
  document,window,
  on:(target,type,handler)=>{target.addEventListener(type,handler);cleanups.push(()=>target.removeEventListener(type,handler));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
},{phase:document.documentElement.hasAttribute('data-leibox-motion-preview')?'ready':'loading'});
addEventListener('pagehide',()=>{dust.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${core}
export function mountImageDustDisintegration(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const dust=createImageDustDisintegration(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);dust.update(next);},
    destroy(){dust.destroy();surface.controller.destroy();},
  };
}
`;
}
