import fs from 'node:fs/promises';

export async function buildGlassRippleOnboardingSource(entry){
  const [original,moduleSource,assets,css]=await Promise.all([
    fs.readFile('public/motion/glass-ripple-onboarding-original.html','utf8'),
    fs.readFile('src/lib/motion-core/glass-ripple-onboarding.js','utf8'),
    fs.readFile('src/lib/motion-core/glass-ripple-onboarding-assets.mjs','utf8'),
    fs.readFile('src/lib/motion-core/glass-ripple-onboarding.css','utf8'),
  ]);
  const core=assets.replace('export const','const')+'\n'+moduleSource
    .replace("import {PAINTING_SRC} from './glass-ripple-onboarding-assets.mjs';",'')
    .replace('export function createGlassRippleOnboarding','function createGlassRippleOnboarding');
  const markup=original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace('<main class="stage">','<main class="stage" id="glassRippleOnboarding">')
    .replace('id="setupSheet" aria-hidden="true"','id="setupSheet" role="group" aria-label="Choose your focus" inert aria-hidden="true"')
    .replace('id="goalList"','id="goalList" role="radiogroup" aria-label="Budget goal"')
    .replaceAll('data-goal=','role="radio" data-goal=')
    .replaceAll('class="goal-check"','class="goal-check" aria-hidden="true"')
    .replace('id="setupStatus" role="status"','id="setupStatus" role="status" aria-live="polite"');
  await fs.writeFile('public/motion/glass-ripple-onboarding.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Concentric Glass Ripple Onboarding</title><style>${css}</style></head><body>${markup}<script>
(()=>{
${core}
const media=matchMedia('(prefers-reduced-motion:reduce)'),cleanups=[];
const onboarding=createGlassRippleOnboarding({
  document,window,
  on:(target,type,handler)=>{target.addEventListener(type,handler);cleanups.push(()=>target.removeEventListener(type,handler));},
  requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),
  reduced:()=>media.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver,
});
addEventListener('pagehide',()=>{onboarding.destroy();cleanups.reverse().forEach(cleanup=>cleanup());},{once:true});
})();</script></body></html>\n`);
  return `import {createSurface} from './motion-runtime';
${core}
export function mountGlassRippleOnboarding(target,options={}){
  const surface=createSurface(target,${JSON.stringify({markup,css,width:entry.canvasWidth,height:entry.canvasHeight,responsive:true})},options);
  const onboarding=createGlassRippleOnboarding(surface,options);
  return {
    ...surface.controller,
    update(next){surface.controller.update(next);onboarding.update(next);},
    destroy(){onboarding.destroy();surface.controller.destroy();},
  };
}
`;
}
