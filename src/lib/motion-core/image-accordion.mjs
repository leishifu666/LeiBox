import { createSurface } from './motion-runtime';

const WIDTH = 340;
const HEIGHT = 300;
const MAX_RADIUS = 12;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const setting = (value, fallback, max = 100) => clamp(Number.isFinite(value) ? value : fallback, 0, max);

/* Image accordion — adapted from Bencho by Lorenzo Cabra (MIT).
   Pattern from Toggle Supply: the fixed row, the falloff into neighbours,
   and the cover crop that re-frames instead of stretching. */
export function createImageAccordion(host, initial, css, defaults) {
  const scope = createSurface(host, {
    width: WIDTH,
    height: HEIGHT,
    css,
    markup: '<div class="acc-scene"><div class="acc" role="group" aria-label="Image accordion"></div></div>',
  }, initial);
  const { root, on, reduced, requestAnimationFrame, cancelAnimationFrame } = scope;
  const strip = root.querySelector('.acc');
  const doc = host.ownerDocument;
  const browser = doc.defaultView;
  let options = { open: 50, reach: 35, bounce: 10, gap: 8, ...initial };
  let cells = [];
  let hovered = -1;
  let focused = -1;
  let pinned = -1;
  let frame = 0;
  let previousTime = 0;
  let destroyed = false;

  /* Nothing here grows. The strip is 340px whatever is happening inside
     it. Flex divides one fixed width, even while several cells are in flight. */
  function paint() {
    const lift = 0.4 + setting(options.open, 50) * 0.028;
    for (const cell of cells) {
      // High bounce can overshoot past zero. A flex-grow value must stay positive.
      cell.button.style.flexGrow = Math.max(0.05, 1 + lift * cell.value / 100).toFixed(4);
    }
  }

  function settle() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const cell of cells) {
      cell.value = cell.target;
      cell.velocity = 0;
    }
    paint();
  }

  /* Frames, not milliseconds. Damping is raised to dt so a dropped
     frame decays the same energy. One clock moves all cells with no stagger.
     The spring runs on 0..100 so the absolute .02 snap threshold is useful. */
  function step(time) {
    const dt = previousTime ? clamp((time - previousTime) / 16.67, 0, 2.5) : 1;
    previousTime = time;
    const tune = setting(options.bounce, 10) / 100;
    // -ln(decay) / (2 * sqrt(stiffness)) runs from about .85 to .20.
    // The low end arrives firmly, the high end makes a visible rebound.
    const stiffness = 0.08 + tune * 0.16;
    const decay = Math.pow(0.62 + tune * 0.2, dt);
    let moving = false;
    for (const cell of cells) {
      cell.velocity = (cell.velocity + (cell.target - cell.value) * stiffness * dt) * decay;
      cell.value += cell.velocity * dt;
      if (Math.abs(cell.target - cell.value) < 0.02 && Math.abs(cell.velocity) < 0.02) {
        cell.value = cell.target;
        cell.velocity = 0;
      } else {
        moving = true;
      }
    }
    paint();
    frame = moving ? requestAnimationFrame(step) : 0;
  }

  function sync() {
    const active = hovered >= 0 ? hovered : focused >= 0 ? focused : pinned;
    const reach = 0.35 + setting(options.reach, 35) * 0.009;
    cells.forEach((cell, index) => {
      // A Gaussian falloff lets the immediate neighbours share the swell.
      cell.target = active < 0 ? 0 : 100 * Math.exp(-((Math.abs(index - active) / reach) ** 2));
      cell.button.toggleAttribute('data-open', index === active);
      cell.button.setAttribute('aria-pressed', String(index === pinned));
    });
    if (reduced() || doc.hidden) { settle(); return; }
    if (!frame && cells.some(cell => cell.value !== cell.target || cell.velocity !== 0)) {
      previousTime = 0;
      frame = requestAnimationFrame(step);
    }
  }

  function applyLayout() {
    const gap = setting(options.gap, 8, 20);
    // The strip and every cell share min(gap, 12), so touching corners never notch.
    strip.style.gap = `${gap}px`;
    strip.style.setProperty('--acc-radius', `${Math.min(MAX_RADIUS, gap)}px`);
    paint();
  }

  function rebuild() {
    hovered = focused = pinned = -1;
    const images = options.images;
    const items = images?.length > 0 && images.length <= 5 ? images : defaults;
    cells = items.map(({ name, src }) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'acc-cell';
      button.setAttribute('aria-label', name);
      const image = doc.createElement('img');
      image.alt = '';
      image.draggable = false;
      image.src = src;
      button.append(image);
      return { button, value: 0, target: 0, velocity: 0 };
    });
    strip.replaceChildren(...cells.map(cell => cell.button));
    applyLayout();
    sync();
  }

  const indexOf = node => cells.findIndex(cell => cell.button === node);
  on(strip, 'pointerover', event => {
    if (event.pointerType === 'touch') return;
    const index = indexOf(event.target);
    if (index < 0 || index === hovered) return;
    hovered = index;
    sync();
  });
  // Containment also handles a scripted pointerout with relatedTarget: null.
  on(strip, 'pointerout', event => {
    if (strip.contains(event.relatedTarget)) return;
    hovered = -1;
    sync();
  });
  on(strip, 'pointercancel', () => { hovered = pinned = -1; sync(); });
  on(strip, 'focusin', event => {
    if (!event.target.matches(':focus-visible')) return;
    hovered = -1;
    focused = indexOf(event.target);
    sync();
  });
  on(strip, 'focusout', () => { focused = -1; sync(); });
  on(strip, 'click', event => {
    if (event.pointerType !== 'touch' && event.detail !== 0) return;
    const index = indexOf(event.target);
    if (index < 0) return;
    hovered = -1;
    pinned = pinned === index ? -1 : index;
    sync();
  });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden) { hovered = -1; sync(); }
  });
  on(browser.matchMedia('(prefers-reduced-motion: reduce)'), 'change', sync);

  rebuild();
  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      const previousImages = options.images;
      options = { ...options, ...next };
      scope.controller.update(next);
      if (options.images !== previousImages) rebuild();
      else { applyLayout(); sync(); }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scope.controller.destroy();
    },
  };
}
