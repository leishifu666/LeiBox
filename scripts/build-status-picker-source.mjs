import fs from 'node:fs/promises';

export async function buildStatusPickerSource(entry) {
  const [original, moduleSource, componentCss, font] = await Promise.all([
    fs.readFile('public/motion/status-picker-original.html', 'utf8'),
    fs.readFile('src/lib/motion-core/status-picker.js', 'utf8'),
    fs.readFile('src/lib/motion-core/status-picker.css', 'utf8'),
    fs.readFile('src/lib/ShareInvite/share-invite.css', 'utf8'),
  ]);
  const core = moduleSource.replace('export function createStatusPicker', 'function createStatusPicker');
  const localFont = font.slice(0, font.indexOf('.leibox-share {')).replaceAll('ShareInviteInter', 'Inter');
  const markup = original.match(/<body>([\s\S]*?)<script>/i)[1];
  const css = localFont + componentCss + `
    .stage { width:100%; height:var(--motion-height, 100dvh); }
    .tooltip-measurer { position:absolute; }
    .status-orb { touch-action:manipulation; }
    .status-orb:focus-visible { outline:2.5px solid #1c1c1e; outline-offset:2px; }
    @media (prefers-reduced-motion:reduce) {
      *, *::before, *::after { animation-duration:0s!important; transition-duration:0s!important; }
    }
  `;
  await fs.writeFile('public/motion/status-picker.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Status Picker Interaction</title><style>${css}</style></head><body>${markup}<script>
(() => {
  ${core}
  const media = matchMedia('(prefers-reduced-motion:reduce)');
  const picker = createStatusPicker({
    document,
    on:(target, type, handler) => target.addEventListener(type, handler),
    requestAnimationFrame:requestAnimationFrame.bind(window),
    cancelAnimationFrame:cancelAnimationFrame.bind(window),
    setTimeout:setTimeout.bind(window), clearTimeout:clearTimeout.bind(window),
    ResizeObserver, reduced:() => media.matches,
  });
  media.addEventListener('change', picker.refresh);
})();</script></body></html>\n`);

  return `import { createSurface } from './motion-runtime';
${core}
export function mountStatusPicker(target, options = {}) {
  const surface = createSurface(target, ${JSON.stringify({ markup, css, width: entry.canvasWidth, height: entry.canvasHeight, responsive: true })}, options);
  const picker = createStatusPicker(surface, options);
  surface.matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change', picker.refresh);
  return {
    ...surface.controller,
    update(next) { surface.controller.update(next); picker.update(next); },
    destroy() { picker.destroy(); surface.controller.destroy(); },
  };
}
`;
}
