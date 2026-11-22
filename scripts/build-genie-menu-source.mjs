import fs from 'node:fs/promises';

export async function buildGenieMenuSource(entry) {
  const [original, moduleSource, componentCss] = await Promise.all([
    fs.readFile('public/motion/genie-menu-original.html', 'utf8'),
    fs.readFile('src/lib/motion-core/genie-menu.js', 'utf8'),
    fs.readFile('src/lib/motion-core/genie-menu.css', 'utf8'),
  ]);
  const core = moduleSource.replace('export function createGenieMenu', 'function createGenieMenu');
  const markup = original.match(/<body>([\s\S]*?)<script>/i)[1];
  const css = componentCss + `
    .stage { width:100%; height:var(--motion-height,100dvh); }
    .speed-control { position:absolute; }
    .menu-item-btn:focus-visible, .speed-btn:focus-visible { outline:2px solid #555; outline-offset:2px; }
    @media (prefers-reduced-motion:reduce) {
      *, *::before, *::after { animation-duration:0s!important; transition-duration:0s!important; }
    }
  `;
  await fs.writeFile('public/motion/genie-menu.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Genie Style Menu</title><style>${css}</style></head><body>${markup}<script>
(() => {
  ${core}
  const media=matchMedia('(prefers-reduced-motion:reduce)');
  const menu=createGenieMenu({
    document, on:(target,type,handler)=>target.addEventListener(type,handler),
    requestAnimationFrame:requestAnimationFrame.bind(window), cancelAnimationFrame:cancelAnimationFrame.bind(window),
    setTimeout:setTimeout.bind(window), clearTimeout:clearTimeout.bind(window), reduced:()=>media.matches,
  });
  media.addEventListener('change',menu.refresh);
})();</script></body></html>\n`);
  const scopedCss = css.replaceAll('vw', 'cqw').replace('@media (max-width: 720px)', '@container (max-width: 720px)')
    + '\n.motion-frame {container-type:inline-size;}';
  return `import { createSurface } from './motion-runtime';
${core}
export function mountGenieMenu(target, options = {}) {
  const surface=createSurface(target,${JSON.stringify({ markup, css: scopedCss, width: entry.canvasWidth, height: entry.canvasHeight, responsive: true })},options);
  const menu=createGenieMenu(surface,options);
  surface.matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',menu.refresh);
  return {
    ...surface.controller,
    update(next) {surface.controller.update(next);menu.update(next);},
    destroy() {menu.destroy();surface.controller.destroy();},
  };
}
`;
}
