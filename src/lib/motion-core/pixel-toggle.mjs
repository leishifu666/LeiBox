import { createSurface } from './motion-runtime';
import { TRACK_WIDTH, TRAVEL, clamp, mix, createPixelPainter, createPixelParticles, knobGeometry } from './pixel-toggle-paint.mjs';

const DAY_ANGLE = .5;
const SLIDE_STIFFNESS = 224;
const SLIDE_DAMPING = 15.5;
const SHAPE_STIFFNESS = 420;
const SHAPE_DAMPING = 24;
const restAngle = checked => checked ? DAY_ANGLE : 0;
const smooth = progress => progress * progress * (3 - 2 * progress);
const easeOut = progress => 1 - (1 - progress) ** 3;

export function createPixelToggle(host, initial, css, preview = false) {
  const scope = createSurface(host, {
    width: 720,
    height: 540,
    css,
    markup: `<div class="pixel-scene"><button class="pixel-switch" type="button" role="switch" aria-label="Day mode"><span class="pixel-knob" aria-hidden="true"></span><canvas class="pixel-effects" aria-hidden="true"></canvas></button></div>`,
  }, initial);
  const { root, on, requestAnimationFrame, cancelAnimationFrame, reduced } = scope;
  const scene = root.querySelector('.pixel-scene');
  const control = root.querySelector('.pixel-switch');
  const owner = host.ownerDocument;
  const browser = owner.defaultView;
  if (preview) scene.dataset.preview = '';
  const pixelRatio = Math.min(preview ? 1 : 1.5, browser.devicePixelRatio || 1);
  const paint = createPixelPainter(scene, root.querySelector('.pixel-knob'), root.querySelector('canvas'), pixelRatio, scope);
  const particles = createPixelParticles();
  let options = { sound: true, ...initial };
  let checked = Boolean(options.checked);
  let position = Number(checked), theme = position, phase = restAngle(checked);
  let speed = 0, stretch = 0, stretchSpeed = 0, press = 0, agitation = 0;
  let colorMove, lightMove, drag, pointer;
  let frame = 0, lastTime = 0, audio, suppressClick = false, destroyed = false;

  function render(box = knobGeometry(position, stretch, press), scatter = 0, transit = 0) {
    paint(box, clamp(theme), phase, transit, particles, scatter);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function snap() {
    stop();
    position = theme = Number(checked);
    phase = restAngle(checked);
    speed = stretch = stretchSpeed = press = agitation = 0;
    colorMove = lightMove = undefined;
    particles.assign(position, true);
    render();
  }

  function requestFrame() {
    if (!frame && !owner.hidden && !reduced()) frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    const dt = lastTime ? clamp((now - lastTime) / 1000, .001, .033) : 1 / 60;
    lastTime = now;
    const substep = dt / 4;
    let transit = 0;
    if (drag?.active) {
      const positionTheme = 1 / (1 + Math.exp(-(position - .5) / .07));
      theme = mix(theme, positionTheme, 1 - Math.exp(-dt * 14));
      phase = mix(phase, drag.base + clamp(position) * DAY_ANGLE, 1 - Math.exp(-dt * 18));
      speed *= Math.exp(-dt * 16);
      transit = .5;
    } else {
      if (colorMove) {
        const p = clamp((now - colorMove.start) / colorMove.duration);
        theme = mix(colorMove.from, Number(checked), smooth(p));
        if (p === 1) colorMove = undefined;
      }
      if (lightMove) {
        const p = clamp((now - lightMove.start) / lightMove.duration);
        phase = mix(lightMove.from, lightMove.to, easeOut(p));
        transit = Math.min(1, p * 8) * (1 - p) ** 2.2;
        if (p === 1) lightMove = undefined;
      }
      for (let i = 0; i < 4; i++) {
        speed += ((Number(checked) - position) * SLIDE_STIFFNESS - speed * SLIDE_DAMPING) * substep;
        position += speed * substep;
      }
      if (Math.abs(position - Number(checked)) < .0001 && Math.abs(speed) < .001) {
        position = Number(checked);
        speed = 0;
      }
    }
    const stretchGoal = Math.min(.18, Math.abs(speed) * .024);
    for (let i = 0; i < 4; i++) {
      stretchSpeed += ((stretchGoal - stretch) * SHAPE_STIFFNESS - stretchSpeed * SHAPE_DAMPING) * substep;
      stretch += stretchSpeed * substep;
    }
    if (!stretchGoal && Math.abs(stretch) < .0001 && Math.abs(stretchSpeed) < .001) stretch = stretchSpeed = 0;
    const pressTarget = Number(Boolean(drag));
    press = mix(press, pressTarget, 1 - Math.exp(-dt * (drag ? 30 : 21)));
    if (Math.abs(press - pressTarget) < .001) press = pressTarget;
    agitation = Math.max(drag && !drag.active ? .3 : 0, agitation - dt * 7);
    const box = knobGeometry(position, stretch, press);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const livePointer = pointer && now - pointer.at < 160 ? pointer : undefined;
    const { scatter, moving } = particles.advance(clamp(theme), agitation, livePointer, center, dt);
    render(box, scatter, transit);
    if (moving || agitation || position !== Number(checked) || stretch || press !== pressTarget || colorMove || lightMove || drag?.active) requestFrame();
    else lastTime = 0;
  }

  function playClick() {
    if (!options.sound || !browser.AudioContext) return;
    try {
      audio ??= new browser.AudioContext();
      if (audio.state === 'suspended') void audio.resume().catch(() => {});
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime;
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(checked ? 1500 : 900, start);
      tone.frequency.exponentialRampToValueAtTime(checked ? 2300 : 480, start + .06);
      volume.gain.setValueAtTime(.0001, start);
      volume.gain.exponentialRampToValueAtTime(.1, start + .005);
      volume.gain.exponentialRampToValueAtTime(.0001, start + .09);
      tone.connect(volume).connect(audio.destination);
      tone.onended = () => { tone.disconnect(); volume.disconnect(); };
      tone.start(start);
      tone.stop(start + .1);
    } catch {
      // Audio policy or an unavailable device does not block the switch.
    }
  }

  function change(next, trigger, trusted = false) {
    const changed = next !== checked;
    checked = next;
    control.setAttribute('aria-checked', String(checked));
    if (reduced() || owner.hidden) snap();
    else {
      const now = browser.performance.now();
      const clicking = trigger === 'click';
      const rest = restAngle(checked);
      const finalPhase = clicking ? Math.ceil(phase + .1 - rest) + rest : Math.round(phase - rest) + rest;
      colorMove = { from: theme, start: now, duration: clicking ? (checked ? 100 : 70) : 140 };
      lightMove = { from: phase, to: finalPhase, start: now + (clicking ? 10 : 0), duration: clicking ? 900 : 700 };
      if (clicking) {
        press = Math.max(press, .65);
        agitation = .8;
        particles.burst(1.1);
      }
      requestFrame();
    }
    if (changed && trigger !== 'update' && trigger !== 'cancel') {
      if (trusted) playClick();
      options.onCheckedChange?.(checked);
    }
  }

  function point(event) {
    const rect = control.getBoundingClientRect();
    const scale = rect.width / TRACK_WIDTH;
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  }

  on(control, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    const local = point(event);
    drag = { id: event.pointerId, startX: local.x, startPosition: position,
      x: local.x, at: browser.performance.now(), velocity: 0, active: false, base: 0 };
    suppressClick = false;
    control.setPointerCapture(event.pointerId);
    if (!reduced()) {
      agitation = .3;
      particles.burst(.35);
      requestFrame();
    }
  });
  on(control, 'pointermove', event => {
    if (drag && event.pointerId !== drag.id) return;
    const local = point(event);
    pointer = event.pointerType === 'touch' && !drag ? undefined : { ...local, at: browser.performance.now() };
    if (drag) {
      const delta = local.x - drag.startX;
      if (!drag.active && Math.abs(delta) > 3) {
        drag.active = true;
        drag.base = Math.round(phase - position * DAY_ANGLE);
        control.dataset.dragging = '';
        colorMove = lightMove = undefined;
      }
      if (drag.active) {
        const raw = drag.startPosition + delta / TRAVEL;
        const next = raw < 0 ? -((-raw) ** .6) * .05 : raw > 1 ? 1 + (raw - 1) ** .6 * .05 : raw;
        const now = browser.performance.now();
        const elapsed = Math.max(1, now - drag.at);
        drag.velocity = mix(drag.velocity, (local.x - drag.x) / elapsed, .5);
        speed = mix(speed, (next - position) * 1000 / elapsed, .5);
        drag.x = local.x;
        drag.at = now;
        position = next;
        agitation = Math.max(agitation, clamp(Math.abs(drag.velocity) * 1.6) * .9);
        if (reduced()) {
          theme = Number(next >= .5);
          phase = drag.base + clamp(next) * DAY_ANGLE;
          particles.assign(theme, true);
          render();
        }
      }
    }
    requestFrame();
  });
  on(control, 'pointerleave', () => { pointer = undefined; requestFrame(); });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const completed = event.type === 'pointerup';
    const { active, velocity, at } = drag;
    drag = undefined;
    if (event.pointerType === 'touch' || !completed) pointer = undefined;
    delete control.dataset.dragging;
    if (!active) return;
    suppressClick = true;
    const fling = browser.performance.now() - at <= 120 && Math.abs(velocity) > .6;
    const next = completed ? (fling ? velocity > 0 : position >= .5) : checked;
    change(next, completed ? 'drag' : 'cancel', event.isTrusted);
  }
  on(control, 'pointerup', finishDrag);
  on(control, 'pointercancel', finishDrag);
  on(control, 'lostpointercapture', finishDrag);
  on(control, 'click', event => {
    if (event.detail && suppressClick) return;
    change(!checked, 'click', event.isTrusted);
  });
  on(owner, 'visibilitychange', () => {
    if (!owner.hidden) return;
    drag = pointer = undefined;
    delete control.dataset.dragging;
    snap();
  });
  on(browser.matchMedia('(prefers-reduced-motion: reduce)'), 'change', () => {
    if (reduced()) snap();
  });
  scope.addCleanup(() => {
    if (audio) void audio.close().catch(() => {});
  });
  control.setAttribute('aria-checked', String(checked));
  snap();

  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.controller.update(next);
      if (typeof next.checked === 'boolean' && next.checked !== checked) {
        if (drag && control.hasPointerCapture(drag.id)) {
          suppressClick = true;
          control.releasePointerCapture(drag.id);
        }
        drag = pointer = undefined;
        delete control.dataset.dragging;
        change(next.checked, 'update');
      } else if (reduced() && !drag) snap();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      scope.controller.destroy();
    },
  };
}
