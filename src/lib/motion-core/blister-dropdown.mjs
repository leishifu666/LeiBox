import { createSurface } from './motion-runtime';

const values = ['all', 'open', 'closed'];
const defaultCounts = { all: 7, open: 4, closed: 3 };
const accents = { all: '#1a56ff', open: '#eba428', closed: '#769a66' };
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const back = t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
const cubic = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const pocket = (value, cavity = false) => `<span class="blister-pocket" aria-hidden="true">
  <span class="blister-rim"></span><span class="blister-pill" data-value="${value}"></span>
  <span class="blister-dome"></span>${cavity ? '<span class="blister-cavity"></span>' : ''}
</span>`;

const markup = chevron => `<div class="blister-stage">
  <div class="blister-assembly">
    <button type="button" class="blister-trigger blister-foil" aria-haspopup="listbox" aria-controls="blister-options" aria-expanded="true">
      ${pocket('all')}<span class="blister-label" data-current>show all</span>
      ${chevron}
    </button>
    <div class="blister-clip">
      <div id="blister-options" class="blister-panel blister-foil" role="listbox" aria-label="Status">
        ${values.map(value => `<div class="blister-row" role="option" data-value="${value}" aria-selected="${value === 'all'}" tabindex="-1">
          ${pocket(value, true)}<span class="blister-selection blister-label">${value}</span><span class="blister-count"></span>
        </div>`).join('')}
      </div>
    </div>
  </div>
  <span class="blister-pill blister-flight" aria-hidden="true" hidden></span>
</div>`;

export function createBlisterDropdown(host, initial, css, chevron, preview = false) {
  const scope = createSurface(host, { width: 560, height: 448, css, markup: markup(chevron) }, initial);
  const { root, on, reduced, rect, setTimeout, clearTimeout } = scope;
  const doc = host.ownerDocument;
  const browser = doc.defaultView;
  const stage = root.querySelector('.blister-stage');
  const assembly = root.querySelector('.blister-assembly');
  const trigger = root.querySelector('.blister-trigger');
  const panel = root.querySelector('.blister-panel');
  const socket = trigger.querySelector('.blister-pocket');
  const headerPill = trigger.querySelector('.blister-pill');
  const label = root.querySelector('[data-current]');
  const flightPill = root.querySelector('.blister-flight');
  const rows = [...panel.querySelectorAll('.blister-row')];
  const animations = new Set();
  let options = { expanded: true, autoClose: true, sound: true, ...initial };
  let value = values.includes(options.value) ? options.value : 'all';
  let expanded = Boolean(options.expanded);
  let audio, flight, closeTimer;
  if (preview) stage.dataset.preview = '';

  function animate(node, keyframes, timing) {
    const action = node.animate(keyframes, timing);
    animations.add(action);
    void action.finished.then(() => animations.delete(action), () => animations.delete(action));
    return action;
  }

  function playTone(kind, trusted) {
    if (!trusted || !options.sound || !browser.AudioContext) return;
    try {
      audio ??= new browser.AudioContext();
      if (audio.state === 'suspended') void audio.resume().catch(() => {});
      const time = audio.currentTime;
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const pop = kind === 'pop';
      tone.type = kind === 'land' ? 'sine' : 'triangle';
      tone.frequency.setValueAtTime(pop ? 425 : kind === 'land' ? 180 : expanded ? 190 : 245, time);
      tone.frequency.exponentialRampToValueAtTime(pop ? 78 : expanded ? 290 : 140, time + .045);
      volume.gain.setValueAtTime(.0001, time);
      volume.gain.exponentialRampToValueAtTime(pop ? .2 : .072, time + .005);
      volume.gain.exponentialRampToValueAtTime(.0001, time + .06);
      tone.connect(volume).connect(audio.destination);
      tone.onended = () => { tone.disconnect(); volume.disconnect(); };
      tone.start(time);
      tone.stop(time + .065);
      if (!pop) return;

      const noise = audio.createBufferSource();
      noise.buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .09), audio.sampleRate);
      const samples = noise.buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 1.6;
      const band = audio.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 3800;
      band.Q.value = 1.8;
      const level = audio.createGain();
      level.gain.value = .15;
      noise.connect(band).connect(level).connect(audio.destination);
      noise.onended = () => { noise.disconnect(); band.disconnect(); level.disconnect(); };
      noise.start(time + .006);
    } catch {
      // Audio support does not affect selection.
    }
  }

  function paintRows() {
    rows.forEach(row => {
      const key = row.dataset.value;
      row.setAttribute('aria-selected', String(key === value));
      row.tabIndex = expanded && key === value ? 0 : -1;
      const count = options.counts?.[key] ?? defaultCounts[key];
      row.querySelector('.blister-count').textContent = String(count);
    });
  }

  function paintHeader() {
    headerPill.dataset.value = value;
    headerPill.style.visibility = '';
    label.textContent = `show ${value}`;
    trigger.setAttribute('aria-label', `Show ${value}`);
  }

  function cancelClose() {
    if (closeTimer !== undefined) clearTimeout(closeTimer);
    closeTimer = undefined;
  }

  function settleFlight() {
    if (flight) flight.cancel();
    flight = undefined;
    flightPill.hidden = true;
    paintHeader();
  }

  function setExpanded(next, trusted = false, animateRows = true) {
    cancelClose();
    if (!next && panel.contains(root.activeElement)) trigger.focus();
    if (!next && flight) settleFlight();
    expanded = next;
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.inert = !expanded;
    paintRows();
    if (expanded && animateRows && !reduced()) {
      rows.forEach((row, index) => {
        if (row.dataset.value === value) return;
        animate(row.querySelector('.blister-pill'), [
          { transform: 'translateY(-5px) scale(.82)' },
          { transform: 'translateY(1px) scale(1.06)', offset: .65 },
          { transform: 'none' },
        ], { duration: 380, delay: index * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      });
    }
    if (animateRows) playTone('slide', trusted);
  }

  function burst(origin) {
    const group = doc.createElement('span');
    group.className = 'blister-burst';
    group.setAttribute('aria-hidden', 'true');
    group.style.left = `${origin.left + origin.width / 2}px`;
    group.style.top = `${origin.top + origin.height / 2}px`;
    group.style.setProperty('--burst-color', accents[value]);
    stage.append(group);
    const ring = doc.createElement('span');
    ring.className = 'blister-ring';
    group.append(ring);
    const effects = [animate(ring, [{ opacity: .7, transform: 'scale(.8)' }, { opacity: 0, transform: 'scale(3.7)' }],
      { duration: 280, easing: 'ease-out', fill: 'forwards' })];
    for (let i = 0; i < 14; i++) {
      const flake = doc.createElement('span');
      const angle = i / 14 * Math.PI * 2 + (Math.random() - .5) * .3;
      const distance = 22 + Math.random() * 32;
      const x = Math.cos(angle) * distance, y = Math.sin(angle) * distance;
      flake.style.width = `${3 + i % 4}px`;
      flake.style.height = `${1.5 + i % 3}px`;
      group.append(flake);
      effects.push(animate(flake, [
        { opacity: .92, transform: `translate(${x * .16}px,${y * .12}px) rotate(${i * 26}deg)` },
        { opacity: .48, transform: `translate(${x * .66}px,${y * .72 - 10}px) rotate(${i * 34 + 45}deg)`, offset: .56 },
        { opacity: 0, transform: `translate(${x}px,${y + 13}px) rotate(${i * 40 + 95}deg)` },
      ], { duration: 290 + i % 4 * 32, fill: 'forwards' }));
    }
    void Promise.allSettled(effects.map(effect => effect.finished)).then(() => group.remove());
  }

  function select(row, trusted) {
    if (!expanded) return;
    cancelClose();
    settleFlight();
    const next = row.dataset.value;
    const changed = next !== value;
    const from = rect(row.querySelector('.blister-pocket'));
    const to = rect(socket);
    value = next;
    paintRows();
    playTone('pop', trusted);
    if (reduced() || doc.hidden) {
      paintHeader();
      if (options.autoClose) setExpanded(false, false, false);
      if (changed) options.onValueChange?.(value);
      return;
    }
    burst(from);
    animate(row.querySelector('.blister-cavity'), [
      { transform: 'scale(.84)', filter: 'brightness(1.35)' },
      { transform: 'scale(1.05)', filter: 'brightness(.92)', offset: .45 },
      { transform: 'none', filter: 'none' },
    ], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });

    headerPill.style.visibility = 'hidden';
    flightPill.dataset.value = value;
    flightPill.hidden = false;
    const halfWidth = flightPill.offsetWidth / 2, halfHeight = flightPill.offsetHeight / 2;
    const x0 = from.left + from.width / 2 - halfWidth, y0 = from.top + from.height / 2 - halfHeight;
    const x1 = to.left + to.width / 2 - halfWidth, y1 = to.top + to.height / 2 - halfHeight;
    const frames = Array.from({ length: 23 }, (_, i) => {
      const t = i / 22;
      const pop = t <= .36;
      const p = pop ? back(t / .36) : cubic((t - .36) / .64);
      const arc = pop ? 0 : Math.sin(Math.PI * p);
      const x = pop ? x0 : x0 + (x1 - x0) * p - 6 * arc;
      const y = pop ? y0 - 12 * p : y0 - 12 + (y1 - y0 + 12) * p;
      const scale = pop ? 1 + .36 * p : 1.36 - .36 * p + .08 * arc;
      const tilt = -5.5 * (pop ? p : 1 - p);
      return { transform: `translate3d(${x}px,${y}px,0) rotate(${tilt}deg) scale(${scale})` };
    });
    const currentFlight = flight = animate(flightPill, frames, { duration: 430, fill: 'forwards' });
    void currentFlight.finished.then(() => {
      if (flight !== currentFlight) return;
      settleFlight();
      animate(headerPill, [
        { transform: 'translateY(-3px) scale(1.24)' },
        { transform: 'translateY(1px) scale(.92)', offset: .55 },
        { transform: 'none' },
      ], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
      animate(label, [{ opacity: .15, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 160 });
      playTone('land', trusted);
      if (options.autoClose && expanded) closeTimer = setTimeout(() => setExpanded(false, trusted), 160);
    }, () => {});
    if (changed) options.onValueChange?.(value);
  }

  on(trigger, 'click', event => setExpanded(!expanded, event.isTrusted));
  on(trigger, 'keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { if (expanded) setExpanded(false, event.isTrusted); return; }
    if (!expanded) setExpanded(true, event.isTrusted);
    rows[event.key === 'ArrowDown' ? 0 : rows.length - 1].focus();
  });
  rows.forEach((row, index) => {
    on(row, 'click', event => select(row, event.isTrusted));
    on(row, 'keydown', event => {
      const { key, isTrusted } = event;
      if (!['Enter', ' ', 'Escape', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      if (key === 'Enter' || key === ' ') { select(row, isTrusted); return; }
      if (key === 'Escape') { setExpanded(false, isTrusted); return; }
      const next = key === 'Home' ? 0 : key === 'End' ? rows.length - 1
        : (index + (key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      rows[next].focus();
    });
  });
  on(assembly, 'pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = assembly.getBoundingClientRect();
    assembly.style.setProperty('--sheen-x', `${clamp((event.clientX - bounds.left) / bounds.width * 100, -20, 120)}%`);
    assembly.style.setProperty('--sheen-y', `${clamp((event.clientY - bounds.top) / bounds.height * 100, -20, 120)}%`);
  });
  on(doc, 'pointerdown', event => {
    if (expanded && !event.composedPath().includes(assembly)) setExpanded(false, false);
  });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden) settleFlight();
  });
  scope.addCleanup(() => {
    animations.forEach(action => action.cancel());
    if (audio) void audio.close().catch(() => {});
  });
  paintHeader();
  setExpanded(expanded, false, false);

  return {
    ...scope.controller,
    update(next) {
      options = { ...options, ...next };
      scope.controller.update(next);
      if (values.includes(next.value) && next.value !== value) {
        value = next.value;
        cancelClose();
        settleFlight();
      }
      if (typeof next.expanded === 'boolean' && next.expanded !== expanded) setExpanded(next.expanded, false, false);
      else paintRows();
      if (!options.autoClose) cancelClose();
      if (reduced() && flight) settleFlight();
    },
  };
}
