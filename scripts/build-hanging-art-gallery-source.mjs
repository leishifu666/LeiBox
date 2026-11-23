import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';

export async function buildHangingArtGallerySource(entry) {
  const [original,moduleSource,assets,css,license]=await Promise.all([
    fs.readFile('public/motion/hanging-art-gallery-original.html','utf8'),
    fs.readFile('src/lib/motion-core/hanging-art-gallery.js','utf8'),
    fs.readFile('src/lib/motion-core/hanging-art-gallery-assets.mjs','utf8'),
    fs.readFile('src/lib/motion-core/hanging-art-gallery.css','utf8'),
    fs.readFile('node_modules/hanging-gallery-three/LICENSE','utf8'),
  ]);
  const core=moduleSource.replace("import * as THREE from 'hanging-gallery-three';",'')
    .replace("import {ARTWORK_URIS,BACK_URIS} from './hanging-art-gallery-assets.mjs';",'')
    .replace('export function createHangingArtGallery','function createHangingArtGallery');
  const bundledCore=`/*! Three.js r128, MIT License\n${license.replaceAll('*/','* /')}\n*/
import * as THREE from 'hanging-gallery-three';
${assets.replaceAll('export const','const')}
${core}`;
  const body=original.match(/<body>([\s\S]*?)<script src=/i)[1];
  const markup=`<section class="gallery-scene" id="gallery-scene" aria-label="Hanging art gallery">${body}
<div class="gallery-fallback" id="gallery-fallback" hidden>
  <p>3D preview unavailable. Select an artwork below.</p>
  <div class="gallery-fallback-list"></div>
  <p class="gallery-fallback-caption" role="status" aria-live="polite"></p>
</div></section>`;
  const boot=`
const media=matchMedia('(prefers-reduced-motion:reduce)');
const cleanups=[];
const gallery=createHangingArtGallery({
  document,window,
  on:(target,type,listener)=>{target.addEventListener(type,listener);cleanups.push(()=>target.removeEventListener(type,listener));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
});
addEventListener('pagehide',()=>{gallery.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});`;
  const standalone=await build({stdin:{contents:bundledCore+boot,sourcefile:'hanging-gallery-standalone.js',resolveDir:path.resolve('.')},write:false,bundle:true,format:'iife',platform:'browser',target:'es2020',minify:true,legalComments:'inline',logLevel:'silent'});
  await fs.writeFile('public/motion/hanging-art-gallery.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hanging Art Gallery</title><style>${css}</style></head><body>${markup}<script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>\n`);
  const scopedCss=css.replaceAll('vw','cqw')+'\n.motion-frame{container-type:inline-size;}';
  return `import {createSurface} from './motion-runtime';
${bundledCore}
export function mountHangingArtGallery(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css:scopedCss,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const gallery=createHangingArtGallery(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);gallery.update(next);},
    destroy(){gallery.destroy();surface.controller.destroy();},
  };
}
`;
}
