import fs from 'node:fs/promises';

export async function buildKnollMorphMenuSource(entry) {
  const html = await fs.readFile('public/motion/knoll-morph-menu.html', 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const [, markup, core] = html.match(/<body>([\s\S]*?)<script>([\s\S]*?)<\/script>/);
  const config = { markup, css, width: entry.canvasWidth, height: entry.canvasHeight, responsive: true };

  return `import { createSurface } from "./motion-runtime";
${core}
export function mountKnollMorphMenu(target, options = {}) {
  const surface = createSurface(target, ${JSON.stringify(config)}, options);
  const menu = mountMenu({
    document: surface.document,
    on: surface.on,
    reduced: surface.reduced,
    requestFrame: surface.requestAnimationFrame,
    cancelFrame: surface.cancelAnimationFrame,
    setTimeout: surface.setTimeout,
    clearTimeout: surface.clearTimeout,
    ResizeObserver: surface.ResizeObserver,
  });
  surface.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", menu.refresh);
  return {
    ...surface.controller,
    update(options) {
      surface.controller.update(options);
      menu.refresh();
    },
  };
}
`;
}
