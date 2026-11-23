import fs from 'node:fs/promises';

export async function buildAccountBurnSource(entry) {
  const [original, moduleSource, css] = await Promise.all([
    fs.readFile('public/motion/account-burn-original.html', 'utf8'),
    fs.readFile('src/lib/motion-core/account-burn.js', 'utf8'),
    fs.readFile('src/lib/motion-core/account-burn.css', 'utf8'),
  ]);
  const core = moduleSource.replace('export function createAccountBurn', 'function createAccountBurn');
  const markup = original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('id="screen-signin" aria-label="Sign in"', 'id="screen-signin" inert aria-label="Sign in"')
    .replace('autocomplete="email"', 'autocomplete="off" aria-describedby="signin-feedback"');
  await fs.writeFile('public/motion/account-burn.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hold-to-Burn Transition</title><style>${css}</style></head><body>${markup}<script>
(() => {
  ${core}
  const media=matchMedia('(prefers-reduced-motion:reduce)');
  const cleanups=[];
  const scene=createAccountBurn({
    document, window,
    on:(target,type,handler)=>{target.addEventListener(type,handler);cleanups.push(()=>target.removeEventListener(type,handler));},
    rect:node=>node.getBoundingClientRect(),
    requestAnimationFrame:requestAnimationFrame.bind(window), cancelAnimationFrame:cancelAnimationFrame.bind(window),
    setTimeout:setTimeout.bind(window), clearTimeout:clearTimeout.bind(window),
    reduced:()=>media.matches, matchMedia:window.matchMedia.bind(window), ResizeObserver,
  });
  addEventListener('pagehide',()=>{scene.destroy();cleanups.reverse().forEach(fn=>fn());},{once:true});
})();</script></body></html>\n`);
  const scopedCss=css.replaceAll('vw','cqw')+'\n.motion-frame{container-type:inline-size;}';
  return `import { createSurface } from './motion-runtime';
${core}
export function mountAccountBurn(target, options = {}) {
  const surface=createSurface(target,${JSON.stringify({markup,css:scopedCss,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const scene=createAccountBurn(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);scene.update(next);},
    destroy(){scene.destroy();surface.controller.destroy();},
  };
}
`;
}
