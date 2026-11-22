import fs from 'node:fs/promises';

export async function buildRetroComputerCordSource({ slug, canvasWidth: width, canvasHeight: height }) {
  const [original, moduleSource, font] = await Promise.all([
    fs.readFile(`public/motion/${slug}-original.html`, 'utf8'),
    fs.readFile('src/lib/motion-core/retro-computer-cord.js', 'utf8'),
    fs.readFile('src/lib/ShareInvite/share-invite.css', 'utf8'),
  ]);
  const core = moduleSource.replace('export function runRetroComputerCord', 'function runRetroComputerCord');
  const localInter = font.slice(0, font.indexOf('.leibox-share {')).replaceAll('ShareInviteInter', 'Inter');
  const css = localInter + original.match(/<style>([\s\S]*?)<\/style>/i)[1] + `
    body { position: relative; }
    #cord-layer { position: absolute; width: 100%; height: 100%; }
    .preview-card, .micro-toast { position: absolute; }
    .specialty-trigger { border: 0; background-color: transparent; font: inherit; }
    .mac-body:focus-visible, .handwriting-btn:focus-visible, .specialty-trigger:focus-visible,
    .social-btn:focus-visible, .wall-outlet:focus-visible, .reconnect-btn:focus-visible {
      outline: 2px solid #575757; outline-offset: 3px;
    }
    .social-btn:is(:hover, :focus-visible), .social-dribbble:hover svg { transform: none; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }
    }
  `;
  const markup = original.match(/<body>([\s\S]*?)<script>/i)[1]
    .replace(' role="button" tabindex="0" aria-label="Interactive Macintosh 128K. Click to change screen tint, or drag away to unplug."', '')
    .replace('id="mac-body"', 'id="mac-body" role="button" tabindex="0" aria-label="Macintosh 128K. Click to change screen tint, or drag away to unplug."')
    .replace('id="reconnect-btn"', 'id="reconnect-btn" tabindex="-1"')
    .replace('id="wall-outlet"', 'id="wall-outlet" aria-pressed="true"')
    .replace(/<span (class="specialty-trigger"[^>]*)>(\w+)<\/span>/g,
      (_, attrs, label) => `<button type="button" ${attrs.replace(' tabindex="0" role="button"', '')}>${label}</button>`)
    .replace(/(\s*<\/div>)(\s*<div class="mac-crt-flash"[^>]*><\/div>)/, '$2$1');
  const script = `${core}
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const point = ({ clientX, clientY }) => {
      const origin = document.body.getBoundingClientRect();
      return { x: clientX - origin.x, y: clientY - origin.y };
    };
    const refresh = runRetroComputerCord({
      document, point, reduced: () => motionPreference.matches, ResizeObserver,
      rect(node) {
        const box = node.getBoundingClientRect();
        const { x, y } = point({ clientX: box.left, clientY: box.top });
        return { left: x, top: y, right: x + box.width, width: box.width, height: box.height };
      },
      on: (target, type, handler) => target.addEventListener(type, handler),
      requestAnimationFrame: requestAnimationFrame.bind(window), cancelAnimationFrame: cancelAnimationFrame.bind(window),
      setTimeout: setTimeout.bind(window), clearTimeout: clearTimeout.bind(window),
    });
    motionPreference.addEventListener('change', refresh);
  `;
  await fs.writeFile(`public/motion/${slug}.html`, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aqib · Product &amp; Web Designer</title><style>${css}</style></head>
<body>${markup}<script>(() => { ${script} })();</script></body></html>\n`);

  const scopedCss = css.replace('@media (max-width: 520px)', '@container (max-width: 520px)')
    + '\n.motion-frame { container-type: inline-size; }';
  return `import { createSurface } from './motion-runtime';
${core}
export function mountRetroComputerCord(target, options = {}) {
  const scope = createSurface(target, ${JSON.stringify({ markup, css: scopedCss, width, height, responsive: true })}, options);
  const refresh = runRetroComputerCord(scope);
  scope.on(target.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)'), 'change', refresh);
  scope.ready();
  return {
    ...scope.controller,
    update(next) { scope.controller.update(next); refresh(); },
  };
}
`;
}
