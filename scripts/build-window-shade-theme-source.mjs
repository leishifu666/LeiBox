import fs from 'node:fs/promises';

export async function buildWindowShadeThemeSource(entry){
  const [original,moduleSource,shaders,css,font]=await Promise.all([
    fs.readFile('public/motion/window-shade-theme-original.html','utf8'),
    fs.readFile('src/lib/motion-core/window-shade-theme.js','utf8'),
    fs.readFile('src/lib/motion-core/window-shade-theme-shaders.mjs','utf8'),
    fs.readFile('src/lib/motion-core/window-shade-theme.css','utf8'),
    fs.readFile('src/lib/motion-core/window-shade-theme-fonts.css','utf8'),
  ]);
  
  const markup='<div id="shadeTheme" class="shade-theme"'+' data-theme="light"'+'>'+original.match(/<body>([\s\S]*?)<script>/i)[1].replace('aria-valuenow="0"','aria-valuenow="0" aria-orientation="vertical"')+'</div>';
  const styles=font+'\n'+css;
  const core=shaders.replaceAll('export const','const')+'\n'+moduleSource
    .replace("import {vertex,fragment} from './window-shade-theme-shaders.mjs';",'')
    .replace('export function createWindowShadeTheme','function createWindowShadeTheme');
  await fs.writeFile('public/motion/window-shade-theme.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Window Shade Theme Toggle</title><style>${styles}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const component=createWindowShadeTheme({
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
export function mountWindowShadeTheme(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css:styles,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const component=createWindowShadeTheme(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);component.update(next);},
    destroy(){component.destroy();surface.controller.destroy();},
  };
}
`;
}
