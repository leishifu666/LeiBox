import { readFile } from 'node:fs/promises';

export async function buildFocusSwitchSource(width, height) {
  const html = (await readFile('public/motion/focus-switch.html', 'utf8')).replaceAll('\r\n', '\n');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  const script = html.match(/\(\(\) => \{\s*'use strict';([\s\S]*?)customElements\.define\('focus-switch', FocusSwitch\);/)?.[1];
  if (!css || !script) throw new Error('Unexpected Focus Switch HTML structure');

  let source = script;
  // Keep the rendering and spring from the supplied HTML. Only adapt document
  // ownership, input coordinates and lifecycle for native component mounts.
  const replace = (original, replacement) => {
    if (!source.includes(original)) throw new Error(`Missing Focus Switch adaptation point: ${original}`);
    source = source.replaceAll(original, replacement);
  };
  replace("const QS = new URLSearchParams(location.search);\nconst FORCE_NOGL = QS.has('nogl');\nconst FORCE_RM = QS.has('rm');", 'const FORCE_NOGL = options.renderer === "canvas2d";');
  replace('FORCE_RM || RM_MQ.matches', 'scope.reduced()');
  replace("RM_MQ.addEventListener && RM_MQ.addEventListener('change', e => { RM = FORCE_RM || e.matches; this.kick(); });",
    "RM_MQ.addEventListener('change', () => { RM = scope.reduced(); this.kick(); });");
  replace('class FocusSwitch extends HTMLElement {\n  connectedCallback() {\n    if (this._init) return; this._init = true;',
    'class FocusSwitch {\n  constructor(root) {\n    this.root = root;');
  replace('this.append(this.canvas, this.btn, this.live);', 'this.root.append(this.canvas, this.btn, this.live);');
  replace('this.dispatchEvent(', 'this.root.dispatchEvent(');
  replace('this.ro.observe(this);', 'this.ro.observe(this.root);');
  replace('this.io.observe(this);', 'this.io.observe(this.root);');
  replace('this.getBoundingClientRect()', 'scope.rect(this.root)');
  replace('e.clientX', 'scope.point(e).x');
  replace('const dpr = window.devicePixelRatio || 1;', 'const dpr = Math.min(window.devicePixelRatio || 1, 2);');
  replace('if (this.gl && !this.setupGL()) this.gl = null;',
    `if (this.gl && !this.setupGL()) {
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
        const replacement = document.createElement('canvas');
        this.canvas.replaceWith(replacement);
        this.canvas = replacement;
        this.gl = null;
      }`);
  replace("this.mode = this.gl ? 'webgl2' : 'canvas2d';", "this.root.dataset.renderer = this.gl ? 'webgl2' : 'canvas2d';");
  replace("this.canvas.addEventListener('webglcontextlost'", "scope.on(this.canvas, 'webglcontextlost'");
  replace('btn.addEventListener(', 'scope.on(btn, ');
  replace('requestAnimationFrame(this.loop.bind(this));', 'this.raf = browser.requestAnimationFrame(this.loop.bind(this));');
  replace('setTarget(t, keyboard)', 'setTarget(t, notify = true)');
  replace("this.root.dispatchEvent(new Event('change', { bubbles: true }));",
    "if (notify) onCheckedChange?.(checked);");

  const config = { markup: '<div class="stage"><focus-switch></focus-switch></div>', css: css.replaceAll('100vw', '100%'), width, height };
  return `// Native port of the supplied Focus Switch HTML. Design reference: Lattice Node.
import { createSurface } from "./motion-runtime";

export function mountFocusSwitch(target, options = {}) {
  const scope = createSurface(target, ${JSON.stringify(config)}, options);
  const { document, window, ResizeObserver, IntersectionObserver, matchMedia } = scope;
  const browser = target.ownerDocument.defaultView;
  let { onCheckedChange } = options;
  ${source}
  const instance = new FocusSwitch(scope.root.querySelector('focus-switch'));
  scope.addCleanup(() => {
    browser.cancelAnimationFrame(instance.raf);
    instance.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    instance.canvas.width = instance.canvas.height = 0;
    if (instance.wc) instance.wc.width = instance.wc.height = 0;
  });
  const update = next => {
    scope.update(next);
    if ('onCheckedChange' in next) onCheckedChange = next.onCheckedChange;
    RM = scope.reduced();
    if (next.checked !== undefined) instance.setTarget(next.checked ? 1 : 0, false);
    instance.kick();
  };
  update(options);
  return { ...scope.controller, update };
}
`;
}
