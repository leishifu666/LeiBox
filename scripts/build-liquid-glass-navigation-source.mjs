import fs from 'node:fs/promises';

export async function buildLiquidGlassNavigationSource(entry){
  const [original,moduleSource,shaders,css,font]=await Promise.all([
    fs.readFile('public/motion/liquid-glass-navigation-original.html','utf8'),
    fs.readFile('src/lib/motion-core/liquid-glass-navigation.js','utf8'),
    fs.readFile('src/lib/motion-core/liquid-glass-navigation-shaders.mjs','utf8'),
    fs.readFile('src/lib/motion-core/liquid-glass-navigation.css','utf8'),
    fs.readFile('src/lib/motion-core/liquid-glass-navigation-fonts.css','utf8'),
  ]);
  const markup='<div id="glassNavigation" class="glass-navigation"'+''+'>'+original.match(/<body>([\s\S]*?)<script>/i)[1].replace(/data-menu="(product|resources|company)"/g,'id="glass-trigger-$1" aria-haspopup="menu" data-menu="$1"')+'</div>';
  const styles=font+'\n'+css;
  const core=shaders.replaceAll('export const','const')+'\n'+moduleSource
    .replace("import {vertex,fragment} from './liquid-glass-navigation-shaders.mjs';",'')
    .replace('export function createLiquidGlassNavigation','function createLiquidGlassNavigation');
  await fs.writeFile('public/motion/liquid-glass-navigation.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Liquid Glass Navigation</title><style>${styles}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const component=createLiquidGlassNavigation({
  document,window,
  on:(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  setTimeout:setTimeout.bind(window),clearTimeout:clearTimeout.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,IntersectionObserver,
},{preview:document.documentElement.hasAttribute('data-leibox-motion-preview')});
addEventListener('pagehide',()=>{component.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${core}
export function mountLiquidGlassNavigation(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css:styles,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const component=createLiquidGlassNavigation(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);component.update(next);},
    destroy(){component.destroy();surface.controller.destroy();},
  };
}
`;
}
