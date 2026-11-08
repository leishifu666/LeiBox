import { createSurface } from './motion-runtime';

const slot = index => `translate3d(${index * 34}px, ${-index * 26}px, ${-index * 70}px) skewY(6deg)`;
const rubberBand = delta => 160 * Math.tanh(delta / 160);

export function createCardSwap(target, initial, css, defaults) {
  const scope = createSurface(target, {
    css,
    markup: '<div class="csw-scene"><div class="csw-stack" role="group" aria-label="Photo stack"><div class="csw-stage"></div></div></div>',
    width: 360,
    height: 350,
  }, initial);
  const { root, on, setTimeout, clearTimeout, reduced } = scope;
  const stack = root.querySelector('.csw-stack');
  const stage = root.querySelector('.csw-stage');
  const doc = target.ownerDocument;
  const browser = doc.defaultView;
  const preference = browser.matchMedia('(prefers-reduced-motion: reduce)');
  let options = { auto: false, every: 4, ...initial };
  let order = [];
  let timer;
  let drag;
  let hovered = false;
  let visible = false;
  let destroyed = false;

  function paint() {
    order.forEach((card, index) => {
      card.style.setProperty('--slot', slot(index));
      // Paint order is discrete even while the transform is in flight.
      card.style.zIndex = String(order.length - index);
      card.toggleAttribute('data-front', index === 0);
      card.tabIndex = index === 0 ? 0 : -1;
      card.setAttribute('aria-hidden', String(index !== 0));
    });
  }

  function cancelDrag() {
    if (!drag) return;
    const { card, pointerId } = drag;
    drag = undefined;
    card.removeAttribute('data-dragging');
    card.style.removeProperty('transform');
    if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
  }

  function rebuild() {
    cancelDrag();
    const items = options.cards?.length === 4 ? options.cards : defaults;
    order = items.map(({ title, src }) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'csw-card';
      button.setAttribute('aria-label', `${title} · Move to back`);
      const image = doc.createElement('img');
      image.className = 'csw-photo';
      image.alt = '';
      image.draggable = false;
      image.src = src;
      const label = doc.createElement('span');
      label.className = 'csw-tag';
      label.textContent = title;
      button.append(image, label);
      return button;
    });
    stage.replaceChildren(...order);
    paint();
  }

  function schedule() {
    clearTimeout(timer);
    timer = undefined;
    if (destroyed || !options.auto || reduced() || !visible || doc.hidden || hovered || drag || stack.contains(root.activeElement)) return;
    const seconds = Number.isFinite(options.every) ? Math.max(1.5, options.every) : 4;
    timer = setTimeout(swap, seconds * 1000);
  }

  function swap() {
    const front = order.shift();
    const restoreFocus = root.activeElement === front;
    order.push(front);
    paint();
    if (restoreFocus) order[0].focus({ preventScroll: true });
    schedule();
  }

  on(stage, 'pointerdown', event => {
    const card = order[0];
    if (event.target !== card || event.button !== 0 || drag) return;
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    drag = { card, pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: browser.performance.now(), scale };
    card.setPointerCapture(event.pointerId);
    card.setAttribute('data-dragging', '');
    schedule();
  });
  on(stage, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const x = rubberBand((event.clientX - drag.x) / drag.scale);
    const y = rubberBand((event.clientY - drag.y) / drag.scale);
    drag.card.style.transform = `${slot(0)} translate(${x}px, ${y}px) rotate(${x * 0.05}deg)`;
  });
  on(stage, 'pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y) / drag.scale;
    const speed = distance / Math.max(1, browser.performance.now() - drag.start);
    cancelDrag();
    if (distance < 6 || distance > 70 || (speed > 0.6 && distance > 24)) swap();
    else schedule();
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    on(stage, type, event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      cancelDrag();
      schedule();
    });
  }
  on(stage, 'click', event => {
    // Keyboard and assistive activation generate a click without a pointer press.
    if (event.detail === 0 && event.target === order[0]) swap();
  });
  on(stack, 'pointerenter', event => {
    if (event.pointerType !== 'touch') { hovered = true; schedule(); }
  });
  on(stack, 'pointerleave', () => { hovered = false; schedule(); });
  on(stack, 'focusin', schedule);
  on(stack, 'focusout', () => setTimeout(schedule, 0));
  on(preference, 'change', schedule);
  on(doc, 'visibilitychange', () => { if (doc.hidden) cancelDrag(); schedule(); });
  const observer = new scope.IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  observer.observe(scope.element);
  rebuild();

  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      const previousCards = options.cards;
      options = { ...options, ...next };
      scope.controller.update(next);
      if (previousCards !== options.cards) rebuild();
      schedule();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelDrag();
      scope.controller.destroy();
    },
  };
}
