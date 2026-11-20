/**
 * ThinkingOrb for the web, framework free, from dissolve (dissolve-ui). This file is yours.
 * The React component (thinking-orb.tsx) wraps it; it also runs on its own:
 *
 *   const orb = createThinkingOrb(el, { state: 'thinking', size: 96 });
 *   orb.update({ state: 'done' });
 *
 * A sphere of dots whose motion shows what an AI agent is doing. Every state change moves each dot
 * from where it is to its new place on the calm curve (600 ms, staggered), never an instant swap.
 * Idle breathes, thinking splits into three tilted rings, searching flattens into a disc swept by
 * a radar arc, listening pulses with the level, done draws a check, error falls and reforms.
 * Dots follow --dissolve-foreground, done --dissolve-success, error --dissolve-danger.
 */
import { CALM, clamp, el, injectStyle, loop, onThemeChange, propsOf, reducedMotion, rgbOf, scope, token, value, vibrate } from './kit';

export type OrbState = 'idle' | 'thinking' | 'searching' | 'listening' | 'done' | 'error';

export type ThinkingOrbProps = {
  /** What the agent is doing. Default 'idle'. */
  state?: OrbState;
  /** Width and height of the orb in px. Default 64. */
  size?: number;
  /** Number of dots. Default 180. */
  dots?: number;
  /** Dot diameter in px at full depth. Default 2.1% of size, at least 2.5. */
  dotSize?: number;
  /**
   * 0..1 input level (a microphone) that drives the listening pulse: a number, or an object whose
   * value is read every frame (no re-render needed). Without it the pulse runs on its own.
   */
  level?: number | { value: number };
  /** Dots flee the pointer within 40 px and spring back. Default false. */
  interactive?: boolean;
  /** Dot color. Default: the foreground token. Done uses success, error uses danger. */
  color?: string;
  /** A short vibration on done and on error, where the browser has it. Default true. */
  haptics?: boolean;
  /** Use a static pose and shorten transitions. Defaults to the system preference. */
  reducedMotion?: boolean;
};

export type ThinkingOrbInstance = {
  update: (props: Partial<ThinkingOrbProps>) => void;
  destroy: () => void;
};

const DEFAULTS = { state: 'idle' as OrbState, size: 64, dots: 180, interactive: false, haptics: true };

const TAU = Math.PI * 2;
const GA = Math.PI * (3 - Math.sqrt(5));
const MORPH = 600;
const STAGGER = 1.5;
/** Error: how long the dots fall before they reform into the sphere. */
const FALL = 900;
const FLEE = 40;
const RING_SPD = [0.0021, -0.0016, 0.0012], RING_TZ = [0, 1.05, -1.05];
/** Checkmark, unit space, y down. */
const CHECK = [[-0.52, 0.02], [-0.16, 0.38], [0.56, -0.36]];

const CSS = `
:where([data-dissolve="thinking-orb"]) { position: relative; display: block; flex: none; -webkit-tap-highlight-color: transparent; }
:where(.dissolve-orb-canvas) { display: block; }
`;

type Rgb = [number, number, number];
const lerp3 = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (c: string): Rgb => { const [r, g, b] = rgbOf(c); return [r / 255, g / 255, b / 255]; };

export function createThinkingOrb(host: HTMLElement, initial: ThinkingOrbProps = {}): ThinkingOrbInstance {
  const root = host.getRootNode();
  injectStyle('dissolve-thinking-orb', CSS, root instanceof ShadowRoot ? root : undefined);
  const props = propsOf(DEFAULTS, initial);
  const p = () => props.current;
  const reduce = () => p().reducedMotion ?? reducedMotion();
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const sc = scope();

  host.dataset.dissolve = 'thinking-orb';
  host.setAttribute('role', 'img');
  const cv = el('canvas', 'dissolve-orb-canvas');
  host.append(cv);
  const ctx = cv.getContext('2d')!;

  let S = 0, N = 0, R = 0, DOT = 0;
  let r1 = new Float32Array(0), r2 = new Float32Array(0), fib = new Float32Array(0), check = new Float32Array(0);
  let cur = new Float32Array(0), from = new Float32Array(0), vel = new Float32Array(0), off = new Float32Array(0), offV = new Float32Array(0);
  const tg = new Float32Array(4);
  let colors: { fg: Rgb; ok: Rgb; bad: Rgb } | null = null;

  /** What is drawn: the state prop, except after an error, which reforms into the idle sphere. */
  let shape: OrbState = 'idle';
  let t0 = -1e9, fallUntil = 0, level = 0, last = performance.now();
  const epoch = performance.now();
  const ok = value(sc, 0, () => {}), bad = value(sc, 0, () => {});
  let ptr: { x: number; y: number } | null = null;

  /** Sizes the canvas. */
  function layout() {
    S = p().size;
    R = S * 0.4;
    DOT = p().dotSize != null ? p().dotSize! / 2 : Math.max(1.25, S * 0.0105);
    cv.width = Math.round(S * DPR);
    cv.height = Math.round(S * DPR);
    cv.style.width = cv.style.height = S + 'px';
    host.style.width = host.style.height = S + 'px';
  }

  /** Per dot randoms, the Fibonacci sphere and the check path, sampled by arc length. */
  function seed() {
    N = Math.max(1, Math.round(p().dots));
    r1 = new Float32Array(N); r2 = new Float32Array(N); fib = new Float32Array(N * 3); check = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      r1[i] = Math.random(); r2[i] = Math.random();
      const y = 1 - ((i + 0.5) / N) * 2, r = Math.sqrt(1 - y * y), th = i * GA;
      fib[i * 3] = Math.cos(th) * r; fib[i * 3 + 1] = y; fib[i * 3 + 2] = Math.sin(th) * r;
    }
    const segs: [number[], number[], number][] = [];
    let tot = 0;
    for (let k = 0; k < 2; k++) {
      const a = CHECK[k], b = CHECK[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push([a, b, l]);
      tot += l;
    }
    for (let i = 0; i < N; i++) {
      let s = ((i + 0.5) / N) * tot, k = 0;
      while (k < 1 && s > segs[k][2]) { s -= segs[k][2]; k++; }
      const [a, b, l] = segs[k], u = s / l, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, j = (r1[i] - 0.5) * 0.11;
      check[i * 3] = a[0] + (b[0] - a[0]) * u + nx * j;
      check[i * 3 + 1] = a[1] + (b[1] - a[1]) * u + ny * j;
      check[i * 3 + 2] = (r2[i] - 0.5) * 0.5;
    }
    cur = new Float32Array(N * 4); from = new Float32Array(N * 4);
    vel = new Float32Array(N * 2); off = new Float32Array(N * 2); offV = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { cur[i * 4] = fib[i * 3]; cur[i * 4 + 1] = fib[i * 3 + 1]; cur[i * 4 + 2] = fib[i * 3 + 2]; cur[i * 4 + 3] = 1; }
    from.set(cur);
  }

  function target(st: OrbState, i: number, tm: number, o: Float32Array) {
    let x: number, y: number, z: number, a = 1;
    if (st === 'thinking') {
      const r = i % 3, ang = (((i / 3) | 0) / (N / 3)) * TAU + tm * RING_SPD[r];
      const x0 = Math.cos(ang) * 0.95, z0 = Math.sin(ang) * 0.95;
      const y1 = -z0 * Math.sin(0.45), z1 = z0 * Math.cos(0.45);
      const c2 = Math.cos(RING_TZ[r]), s2 = Math.sin(RING_TZ[r]);
      x = x0 * c2 - y1 * s2; y = x0 * s2 + y1 * c2; z = z1;
    } else if (st === 'searching') {
      const rd = 0.95 * Math.sqrt((i + 0.5) / N), th = i * GA;
      x = Math.cos(th) * rd; y = Math.sin(th) * rd;
      let d = ((tm / 1000) * TAU - th) % TAU;
      if (d < 0) d += TAU;
      a = 0.3 + 0.7 * Math.exp(-d * 1.4);
      z = a * 0.6 - 0.3;
    } else if (st === 'done') {
      x = check[i * 3]; y = check[i * 3 + 1]; z = check[i * 3 + 2];
    } else {
      // Idle and listening: the rotating sphere.
      x = fib[i * 3]; y = fib[i * 3 + 1]; z = fib[i * 3 + 2];
      let s = 0.98 + 0.02 * Math.sin((tm / 2400) * TAU);
      if (st === 'listening') s = (0.84 + level * 0.2) * (1 + 0.06 * level * Math.sin(y * 5 - tm * 0.012));
      x *= s; y *= s; z *= s;
    }
    if (st !== 'done' && st !== 'searching' && st !== 'thinking') {
      const ra = tm * 0.0004, c = Math.cos(ra), sn = Math.sin(ra);
      const xr = x * c + z * sn, zr = -x * sn + z * c;
      const cb = Math.cos(0.3), sb = Math.sin(0.3);
      x = xr; z = y * sb + zr * cb; y = y * cb - zr * sb;
    }
    o[0] = x; o[1] = y; o[2] = z; o[3] = a;
  }

  function go(next: OrbState) {
    if (next === shape && next !== 'error') return;
    from.set(cur);
    shape = next;
    t0 = performance.now();
    ok.to(next === 'done' ? 1 : 0, 600, CALM);
    if (next === 'error') {
      bad.to(1, 150, CALM);
      for (let i = 0; i < N; i++) { vel[i * 2] = (r1[i] - 0.5) * 0.7; vel[i * 2 + 1] = -r2[i] * 0.6; }
      fallUntil = t0 + (reduce() ? 0 : FALL);
    } else bad.to(0, 500, CALM);
  }

  function inputLevel(tm: number) {
    const l = p().level;
    if (l == null) return clamp(0.3 + 0.35 * Math.sin(tm * 0.0047) * Math.sin(tm * 0.0013 + 1) + 0.3 * Math.abs(Math.sin(tm * 0.011)));
    return clamp(typeof l === 'number' ? l : l.value);
  }

  function draw(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const red = reduce(), tm = red ? 0 : now - epoch;
    const dur = red ? 150 : MORPH, stg = red ? 0 : STAGGER;
    level += (inputLevel(tm) - level) * (red ? 1 : 0.15);
    if (shape === 'error' && fallUntil && (red || now >= fallUntil)) { fallUntil = 0; go('idle'); }
    if (!colors) {
      colors = {
        fg: unit(p().color ?? token(host, 'foreground', 'rgb(28 28 30)')),
        ok: unit(token(host, 'success', 'rgb(52 199 89)')),
        bad: unit(token(host, 'danger', 'rgb(255 59 48)')),
      };
    }
    const col = lerp3(lerp3(colors.fg, colors.ok, ok.v), colors.bad, bad.v);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = `rgb(${col.map((v) => Math.round(v * 255)).join(',')})`;
    const falling = shape === 'error' && fallUntil;
    const flee = ptr && !red && p().interactive ? ptr : null;
    for (let i = 0; i < N; i++) {
      const k4 = i * 4;
      if (falling) {
        vel[i * 2 + 1] += 4.2 * dt;
        cur[k4] += vel[i * 2] * dt;
        cur[k4 + 1] += vel[i * 2 + 1] * dt;
        if (cur[k4 + 1] > 1.05) { cur[k4 + 1] = 1.05; vel[i * 2 + 1] *= -0.28; vel[i * 2] *= 0.7; }
      } else {
        target(shape, i, tm, tg);
        const e = CALM(clamp((now - t0 - i * stg) / dur));
        for (let c = 0; c < 4; c++) cur[k4 + c] = from[k4 + c] + (tg[c] - from[k4 + c]) * e;
      }
      let px = S / 2 + cur[k4] * R, py = S / 2 + cur[k4 + 1] * R;
      // Flee the pointer within 40 px, crisp spring back.
      let gx = 0, gy = 0;
      if (flee) {
        const dx = px - flee.x, dy = py - flee.y, d = Math.hypot(dx, dy);
        if (d < FLEE && d > 0.01) { gx = (dx / d) * (FLEE - d) * 0.8; gy = (dy / d) * (FLEE - d) * 0.8; }
      }
      for (let c = 0; c < 2; c++) {
        const j = i * 2 + c, to = c ? gy : gx;
        if (red) {
          offV[j] = off[j] = 0;
        } else {
          offV[j] += (260 * (to - off[j]) - 22 * offV[j]) * dt;
          off[j] += offV[j] * dt;
        }
      }
      px += off[i * 2]; py += off[i * 2 + 1];
      const d = clamp((cur[k4 + 2] + 1) / 2);
      ctx.globalAlpha = (0.38 + 0.62 * d) * cur[k4 + 3];
      ctx.beginPath();
      ctx.arc(px, py, DOT * (0.8 + 0.4 * d), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(), s = b.width / S || 1; return { x: (e.clientX - b.left) / s, y: (e.clientY - b.top) / s }; };
  const onMove = (e: PointerEvent) => { ptr = local(e); };
  const onLeave = () => { ptr = null; };
  const onUp = (e: PointerEvent) => { if (e.pointerType !== 'mouse') ptr = null; };
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerdown', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointerup', onUp);
  host.addEventListener('pointercancel', onLeave);

  function decorate() {
    host.setAttribute('aria-label', `Assistant ${p().state}`);
    host.style.touchAction = p().interactive ? 'pan-y' : '';
  }

  layout();
  seed();
  decorate();
  shape = p().state === 'error' ? 'idle' : p().state;
  if (shape === 'done') ok.set(1);
  draw(performance.now());
  if (p().state === 'error') go('error');
  const motion = loop(sc, cv, draw, () => !reduce() || last < t0 + MORPH);
  onThemeChange(sc, () => { colors = null; motion.kick(); });
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', motion.kick);
  sc.onDispose(() => media.removeEventListener('change', motion.kick));

  return {
    update(next) {
      const changed = props.update(next);
      if (!changed.size) return;
      if (changed.has('size') || changed.has('dotSize')) layout();
      if (changed.has('dots')) { seed(); t0 = -1e9; }
      if (changed.has('color')) colors = null;
      if (changed.has('state')) {
        const st = p().state;
        if (p().haptics && st === 'done') vibrate(10);
        if (p().haptics && st === 'error') vibrate([20, 60, 20]);
        go(st);
      }
      decorate();
      motion.kick();
    },
    destroy() {
      sc.dispose();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerdown', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointercancel', onLeave);
      cv.remove();
      delete host.dataset.dissolve;
      host.removeAttribute('role');
      host.removeAttribute('aria-label');
      for (const k of ['width', 'height', 'touch-action']) host.style.removeProperty(k);
    },
  };
}
