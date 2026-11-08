import { createSurface } from './motion-runtime';

const WIDTH = 270;
const HEIGHT = 360;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* Image compare — adapted from Bencho by Lorenzo Cabra (MIT).
   TWO PICTURES, ONE FRAME: the before and after have the same framing.
   THE LINE IS JELLY: the knob follows the pointer, while the ends follow
   it on a damped spring. The before layer uses the very same curve as
   the visible SVG stroke, so there is no straight edge underneath it. */
export function createImageCompare(host, initial, css, defaultImage) {
  const scope = createSurface(host, {
    css,
    width: WIDTH,
    height: HEIGHT,
    markup: `<div class="cmp-scene"><div class="cmp" role="slider" tabindex="0" aria-label="Image compare" aria-valuemin="0" aria-valuemax="100">
      <img class="cmp-img cmp-after" alt="" draggable="false" />
      <div class="cmp-before"><img class="cmp-img" alt="" draggable="false" /></div>
      <span class="cmp-tag">Before</span><span class="cmp-tag cmp-right">After</span>
      <svg class="cmp-line" width="270" height="360" viewBox="0 0 270 360" aria-hidden="true"><path /></svg>
      <span class="cmp-grip"><span class="cmp-knob"><svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M5 1 1 5l4 4M11 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span>
    </div></div>`,
  }, initial);
  const { root, on, reduced, requestAnimationFrame, cancelAnimationFrame } = scope;
  const slider = root.querySelector('.cmp');
  const after = root.querySelector('.cmp-after');
  const before = root.querySelector('.cmp-before');
  const beforeImage = before.querySelector('img');
  const [leftTag, rightTag] = root.querySelectorAll('.cmp-tag');
  const path = root.querySelector('.cmp-line path');
  const grip = root.querySelector('.cmp-grip');
  const doc = host.ownerDocument;
  const browser = doc.defaultView;
  let options = { labels: true, corner: 20, ...initial };
  let position = 0.5;
  let destination = null;
  let ends = 0.5;
  let velocity = 0;
  let previousTime = 0;
  let frame = 0;
  let drag;
  let destroyed = false;

  function paint() {
    const x = position * WIDTH;
    const bend = clamp((position - ends) * WIDTH * 0.5, -9, 9);
    const top = (x - bend).toFixed(2);
    // At the midpoint, the two endpoints and control point average to x.
    const segment = `Q ${(x + bend).toFixed(2)} ${HEIGHT / 2} ${top} ${HEIGHT}`;
    path.setAttribute('d', `M ${top} 0 ${segment}`);
    before.style.clipPath = `path("M 0 0 L ${top} 0 ${segment} L 0 ${HEIGHT} Z")`;
    grip.style.left = `${x}px`;
    leftTag.style.opacity = clamp((position - 0.14) * 4, 0, 1);
    rightTag.style.opacity = clamp((0.86 - position) * 4, 0, 1);
    const percentage = String(Math.round(position * 100));
    if (slider.getAttribute('aria-valuenow') !== percentage) slider.setAttribute('aria-valuenow', percentage);
  }

  function settle() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    position = destination ?? position;
    destination = null;
    ends = position;
    velocity = 0;
    paint();
  }

  /* One loop for the glide and the ends catching up with the middle.
     It stops itself once everything is still. */
  function step(time) {
    frame = 0;
    const dt = Math.min(0.033, Math.max(0, (time - previousTime) / 1000));
    previousTime = time;
    if (destination !== null) {
      position += (destination - position) * (1 - Math.pow(0.0004, dt));
      if (Math.abs(destination - position) < 0.0005) {
        position = destination;
        destination = null;
      }
    }
    // The ends flex behind the pointer and settle with a small overshoot.
    velocity += ((position - ends) * 620 - velocity * 44) * dt;
    ends += velocity * dt;
    if (destination === null && Math.abs(position - ends) < 0.0006 && Math.abs(velocity) < 0.002) {
      settle();
      return;
    }
    paint();
    frame = requestAnimationFrame(step);
  }

  function wake() {
    if (reduced() || doc.hidden) { settle(); return; }
    if (frame) return;
    previousTime = browser.performance.now();
    frame = requestAnimationFrame(step);
  }

  function glide(to) {
    destination = to;
    wake();
  }

  function at(clientX) {
    const box = slider.getBoundingClientRect();
    return clamp((clientX - box.left) / box.width, 0, 1);
  }

  function endDrag() {
    if (!drag) return;
    const { pointerId } = drag;
    drag = undefined;
    slider.removeAttribute('data-held');
    if (slider.hasPointerCapture(pointerId)) slider.releasePointerCapture(pointerId);
  }

  on(slider, 'pointerdown', event => {
    if (event.button !== 0 || drag) return;
    const value = at(event.clientX);
    drag = { pointerId: event.pointerId, speed: 0, time: browser.performance.now(), last: value };
    slider.setPointerCapture(event.pointerId);
    slider.setAttribute('data-held', '');
    glide(value);
  });
  on(slider, 'pointermove', event => {
    if (drag?.pointerId !== event.pointerId) return;
    const value = at(event.clientX);
    const now = browser.performance.now();
    drag.speed = (value - drag.last) / Math.max(1, now - drag.time);
    drag.last = value;
    drag.time = now;
    // Paint the knob under the finger now. Only the line ends lag behind.
    destination = null;
    position = value;
    paint();
    wake();
  });
  on(slider, 'pointerup', event => {
    if (drag?.pointerId !== event.pointerId) return;
    const { speed, time } = drag;
    endDrag();
    // A flick carries the line to the edge it was thrown at. A resting
    // finger must not reuse velocity from a previous movement.
    if (browser.performance.now() - time <= 80 && Math.abs(speed) > 0.0025) glide(speed > 0 ? 1 : 0);
  });
  for (const eventName of ['pointercancel', 'lostpointercapture']) {
    on(slider, eventName, event => { if (drag?.pointerId === event.pointerId) endDrag(); });
  }
  on(slider, 'keydown', event => {
    const value = destination ?? position;
    let next;
    switch (event.key) {
      case 'ArrowLeft': case 'ArrowDown': next = value - 0.1; break;
      case 'ArrowRight': case 'ArrowUp': next = value + 0.1; break;
      case 'Home': next = 0; break;
      case 'End': next = 1; break;
      default: return;
    }
    event.preventDefault();
    glide(clamp(next, 0, 1));
  });
  on(browser.matchMedia('(prefers-reduced-motion: reduce)'), 'change', () => { if (reduced()) settle(); });
  on(doc, 'visibilitychange', () => { if (doc.hidden) { endDrag(); settle(); } });

  function applyOptions() {
    slider.style.borderRadius = `${clamp(Number.isFinite(options.corner) ? options.corner : 20, 0, 28)}px`;
    leftTag.hidden = rightTag.hidden = !options.labels;
    const color = options.afterSrc ?? defaultImage;
    const raw = options.beforeSrc ?? color;
    if (after.getAttribute('src') !== color) after.src = color;
    if (beforeImage.getAttribute('src') !== raw) beforeImage.src = raw;
    beforeImage.toggleAttribute('data-monochrome', options.beforeSrc == null);
  }

  applyOptions();
  paint();
  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.controller.update(next);
      applyOptions();
      if (reduced()) settle();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      endDrag();
      scope.controller.destroy();
    },
  };
}
