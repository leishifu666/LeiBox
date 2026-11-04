import { createSurface } from './motion-runtime';
import { advanceMetadataSpring } from './stacked-metadata-spring.mjs';

export const DEFAULT_METADATA_ROWS = [
  { title: 'Checkout Flow Redesign', priority: 'High', date: 'Mar 31', assignee: 'Matt' },
  { title: 'Edge Cache Rollout v2', priority: 'Medium', date: 'Apr 15', assignee: 'Infra', team: true },
  { title: 'Passkey Login for Teams', priority: 'High', date: 'Feb 28', assignee: 'Alex' },
];

export function createStackedMetadata(target, initial, css, markup, icons) {
  const scope = createSurface(target, { css, markup, width: 800, height: 600, responsive: true }, initial);
  const { root, on } = scope, scene = root.querySelector('.sm-scene'), list = root.querySelector('.sm-rows');
  const owner = target.ownerDocument, browser = owner.defaultView, media = browser.matchMedia('(prefers-reduced-motion: reduce)');
  let options = { heading: 'In Progress', theme: 'dark', expanded: -1, ...initial };
  let rows = [], hovered = -1, focused = -1, pinned = -1, dead = false;
  let frame = 0, lastTime = null, visible = true;
  const reduced = () => options.reducedMotion ?? media.matches;
  const current = () => focused >= 0 ? focused : hovered >= 0 ? hovered : pinned;
  const moving = () => rows.some(row => row.spring.value !== row.spring.target || row.spring.velocity !== 0);
  function draw(row) {
    const progress = row.spring.value;
    row.node.style.setProperty('--sm-phase', String(progress));
    row.node.style.setProperty('--sm-stack', `${row.fullWidth - 2 * row.overlap * (1 - progress)}px`);
  }
  function stop() {
    if (frame) browser.cancelAnimationFrame(frame);
    frame = 0; lastTime = null; scene.dataset.running = 'false';
  }
  function advance(now) {
    if (lastTime === null) return;
    const seconds = Math.max(0, (now - lastTime) / 1000);
    lastTime = Math.max(now, lastTime);
    rows.forEach(row => { advanceMetadataSpring(row.spring, seconds); draw(row); });
  }
  function wake() {
    if (dead || reduced() || !visible || owner.hidden || !moving()) { stop(); return; }
    if (frame) return;
    lastTime ??= browser.performance.now();
    scene.dataset.running = 'true';
    frame = browser.requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (dead || owner.hidden || !visible) { stop(); return; }
    advance(now); wake();
  }
  function settle() {
    rows.forEach(row => { row.spring.value = row.spring.target; row.spring.velocity = 0; draw(row); });
    stop();
  }
  function paint(notify = false) {
    // Finish the old trajectory up to this input before changing its destination.
    if (lastTime !== null) advance(browser.performance.now());
    const active = current(), changed = scene.dataset.active !== String(active);
    scene.dataset.active = String(active);
    rows.forEach((row, index) => {
      const open = active === index;
      row.node.dataset.expanded = String(open);
      row.node.setAttribute('aria-expanded', String(open));
      row.spring.target = open ? 1 : 0;
    });
    if (reduced()) settle(); else wake();
    if (changed && notify) options.onExpandChange?.(active);
  }
  function measure() {
    rows.forEach(row => {
      const { node } = row;
      const tags = [...node.querySelectorAll('.sm-tag')];
      const gap = parseFloat(browser.getComputedStyle(node).getPropertyValue('--sm-gap'));
      const overlap = parseFloat(browser.getComputedStyle(node).getPropertyValue('--sm-overlap'));
      const widths = tags.map(tag => tag.offsetWidth);
      row.fullWidth = widths.reduce((a, b) => a + b, 0) + gap * 2;
      row.overlap = overlap;
      node.style.setProperty('--sm-full', `${row.fullWidth}px`);
      tags.forEach((tag, index) => {
        const right = widths.slice(index + 1).reduce((a, b) => a + b, 0) + gap * (2 - index);
        tag.style.right = `${right}px`;
        tag.style.setProperty('--sm-shift', `${(2 - index) * overlap}px`);
      });
      draw(row);
    });
  }
  function buildRows() {
    stop();
    const data = Array.isArray(options.items) && options.items.length ? options.items.slice(0, 12) : DEFAULT_METADATA_ROWS;
    // Delegated input handlers stay on the list, so replacing data leaves no detached listeners.
    scene.dataset.ready = 'false';
    list.replaceChildren();
    rows = data.map((item, index) => {
      const node = owner.createElement('button');
      node.type = 'button'; node.className = 'sm-row'; node.dataset.index = String(index);
      node.innerHTML = `<span class="sm-progress" aria-hidden="true"><i></i></span><span class="sm-title"></span><span class="sm-tags" aria-hidden="true"><span class="sm-tag sm-priority">${icons.priority}<span></span></span><span class="sm-tag sm-date">${icons.calendar}<span></span></span><span class="sm-tag sm-person">${item.team ? '<i class="sm-team"></i>' : icons.person}<span></span></span></span>`;
      const values = [item.title, item.priority, item.date, item.assignee].map(value => String(value ?? ''));
      node.querySelector('.sm-title').textContent = values[0];
      ['.sm-priority span', '.sm-date span', '.sm-person span'].forEach((selector, i) => { node.querySelector(selector).textContent = values[i + 1]; });
      node.setAttribute('aria-label', values.join(', '));
      node.dataset.priority = values[1].toLowerCase();
      list.append(node);
      return { node, fullWidth: 0, overlap: 0, spring: { value: 0, velocity: 0, target: 0 } };
    });
    hovered = focused = -1;
    pinned = Number.isInteger(options.expanded) && options.expanded >= 0 && options.expanded < rows.length ? options.expanded : -1;
    rows.forEach((row, index) => { row.spring.value = row.spring.target = pinned === index ? 1 : 0; });
    measure(); paint();
    scene.dataset.ready = 'true';
  }
  function appearance() {
    scene.dataset.theme = options.theme === 'light' ? 'light' : 'dark';
    scene.dataset.reduced = String(reduced());
    root.querySelector('.sm-heading-text').textContent = String(options.heading ?? 'In Progress');
    if (reduced()) settle(); else wake();
  }
  const rowFor = event => event.target.closest?.('.sm-row');
  const rowIndex = event => Number(rowFor(event)?.dataset.index ?? -1);
  on(list, 'pointerover', event => {
    if (event.pointerType === 'touch') return;
    const row = rowFor(event); if (!row || row.contains(event.relatedTarget)) return;
    hovered = rowIndex(event); paint(true);
  });
  on(list, 'pointerout', event => {
    if (event.pointerType === 'touch') return;
    const row = rowFor(event); if (!row || row.contains(event.relatedTarget)) return;
    hovered = -1; paint(true);
  });
  on(list, 'focusin', event => { if (rowFor(event)?.matches(':focus-visible')) { focused = rowIndex(event); paint(true); } });
  on(list, 'focusout', () => { focused = -1; paint(true); });
  on(list, 'click', event => {
    const index = rowIndex(event); if (index < 0) return;
    pinned = pinned === index ? -1 : index;
    // Touch selection must not inherit a focus-only expansion after the second tap.
    if (event.detail) focused = -1;
    paint(true);
  });
  on(list, 'keydown', event => {
    const index = rowIndex(event); if (index < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % rows.length;
    if (event.key === 'ArrowUp') next = (index + rows.length - 1) % rows.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = rows.length - 1;
    if (next !== undefined) { event.preventDefault(); rows[next].node.focus(); focused = next; paint(true); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hovered = focused = pinned = -1; paint(true); }
  });
  on(media, 'change', appearance);
  on(owner, 'visibilitychange', () => {
    if (owner.hidden) { advance(browser.performance.now()); stop(); } else wake();
  });
  const visibility = new browser.IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake(); else { advance(browser.performance.now()); stop(); }
  });
  visibility.observe(scope.element);
  const resize = new browser.ResizeObserver(measure); resize.observe(scene);
  appearance(); buildRows();
  // Font loading changes natural pill widths; fonts.ready does not allocate a polling loop.
  owner.fonts.ready.then(() => { if (!dead) measure(); });
  scene.dataset.ready = 'true'; scope.ready();
  return {
    ...scope.controller,
    update(next) {
      if (dead) return;
      options = { ...options, ...next }; scope.controller.update(next); appearance();
      if ('items' in next) buildRows();
      if ('expanded' in next) { hovered = focused = -1; pinned = Number.isInteger(next.expanded) && next.expanded >= 0 && next.expanded < rows.length ? next.expanded : -1; paint(); }
      measure();
    },
    destroy() { if (dead) return; dead = true; stop(); visibility.disconnect(); resize.disconnect(); scope.controller.destroy(); },
  };
}
