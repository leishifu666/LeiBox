/*!
 * Distortion Waves core engine — adapted from distortion-waves@0.1.0 (https://libraries.dev/waves)
 * MIT License — Copyright (c) 2026 Jakub Antalik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

export const PALETTES = {
  colorful: {
    colors: [[255, 201, 21], [126, 196, 255], [180, 40, 230], [235, 100, 160], [255, 176, 122], [154, 160, 255], [127, 217, 238]],
    ahead: [255, 122, 182],
    behind: [90, 190, 255],
  },
  green: {
    colors: [[53, 186, 0], [140, 235, 90], [0, 196, 110], [190, 250, 130], [40, 160, 60], [110, 225, 160], [90, 210, 40]],
    ahead: [196, 255, 120],
    behind: [0, 150, 70],
  },
  ocean: {
    colors: [[40, 120, 255], [90, 200, 255], [20, 80, 200], [120, 230, 240], [60, 150, 255], [150, 180, 255], [0, 180, 220]],
    ahead: [150, 230, 255],
    behind: [30, 70, 220],
  },
  sunset: {
    colors: [[255, 140, 60], [255, 90, 120], [255, 200, 80], [240, 70, 90], [255, 170, 120], [220, 90, 200], [255, 120, 80]],
    ahead: [255, 220, 120],
    behind: [200, 60, 160],
  },
  mono: {
    colors: [[240, 240, 245], [200, 205, 215], [255, 255, 255], [170, 175, 190], [225, 228, 235], [190, 195, 205], [245, 245, 250]],
    ahead: [255, 255, 255],
    behind: [160, 165, 180],
  },
};

const lerpRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function singlePalette(c) {
  return {
    colors: [c, lerpRgb(c, [255, 255, 255], 0.25), c, lerpRgb(c, [0, 0, 0], 0.15)],
    ahead: lerpRgb(c, [255, 255, 255], 0.45),
    behind: lerpRgb(c, [0, 0, 0], 0.3),
  };
}

export function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(c) {
  return "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function defaultStyle(type) {
  const base = {
    type,
    anticipation: 0.5,
    travel: 2.28,
    launchGap: 0,
    linger: -0.35,
    rimFade: 3.03,
    returnSpeed: 1.45,
    pull: 24,
    inhale: 56,
    gatherGlow: 0.33,
    gatherDots: 1,
    amplitude: 34,
    lensWidth: 150,
    aberration: 0.78,
    swell: 22,
    blur: 18,
    blurAhead: 90,
    blurBehind: 240,
    lead: 130,
    tail: 300,
    strength: 0.92,
    rimWidth: 14,
    rimUnevenness: 1,
    rimStrength: 0.82,
    rimSoftness: 343,
    cornerRadius: 62,
    rimPulse: 0.6,
    hairlineWidth: 1.5,
    hairlineOpacity: 0.9,
    hairlineWhite: 0.95,
    hairlineLinger: 0.47,
    hairlineFade: 3,
    orientation: 0.5,
    particleCount: 64,
    particleSize: 1.8,
    particleReach: 150,
    particleFlight: 30,
    particleGap: 24,
    particleLife: 2.19,
    particleSpread: 1,
    palette: PALETTES.colorful,
  };
  if (type !== "center") return base;
  return {
    ...base,
    anticipation: 0.25,
    travel: 3.43,
    rimFade: 2.51,
    hairlineLinger: 0.96,
    strength: 0.6,
    rimStrength: 0.6,
    aberration: 0,
    gatherGlow: 0,
    gatherDots: 0,
    particleCount: 89,
    particleLife: 3.93,
    particleSpread: 0.64,
    palette: PALETTES.green,
    cornerRadius: 48,
    pull: 14.4,
    inhale: 33.6,
    amplitude: 20.4,
    lensWidth: 90,
    swell: 13.2,
    blur: 10.8,
    blurAhead: 54,
    blurBehind: 144,
    lead: 78,
    tail: 180,
    rimSoftness: 205.8,
    particleReach: 90,
    particleFlight: 18,
    particleGap: 11,
  };
}

export function duration(style) {
  return style.anticipation + Math.max(
    style.travel * 0.6,
    style.linger + style.rimFade,
    style.linger + style.hairlineLinger + style.hairlineFade,
    style.particleLife
  );
}

export function bezierEase(x1, y1, x2, y2) {
  const sample = (t, a, b) => {
    const u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  };
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (sample(mid, x1, x2) < x) lo = mid;
      else hi = mid;
    }
    return sample((lo + hi) / 2, y1, y2);
  };
}

const DEFAULT_EASE = bezierEase(0.22, 1, 0.36, 1);
let cachedEasePts = [0.22, 1, 0.36, 1];
let cachedEaseFn = DEFAULT_EASE;

function travelEase(style) {
  const x1 = style.easeX1 ?? 0.22;
  const y1 = style.easeY1 ?? 1;
  const x2 = style.easeX2 ?? 0.36;
  const y2 = style.easeY2 ?? 1;
  if (x1 === 0.22 && y1 === 1 && x2 === 0.36 && y2 === 1) return DEFAULT_EASE;
  if (x1 !== cachedEasePts[0] || y1 !== cachedEasePts[1] || x2 !== cachedEasePts[2] || y2 !== cachedEasePts[3]) {
    cachedEasePts = [x1, y1, x2, y2];
    cachedEaseFn = bezierEase(Math.min(Math.max(x1, 0), 1), y1, Math.min(Math.max(x2, 0), 1), y2);
  }
  return cachedEaseFn;
}

const CLEAR_EASE = bezierEase(0.42, 0, 0.58, 1);

export const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export function newFront() {
  return {
    ox: 0, oy: 0, tilt: 0, spine: 0, radius: 0, moved: 0, squash: 1, time: 0,
    energy: 0, swell: 0, width: 0, height: 0, gravity: 0, glow: 0,
    clearRadius: 0, hairClearRadius: 0, rim: 0, sparkle: 0, flying: 0,
    launched: false, hasCleared: false, ring: false, sideways: false, hold: 0,
  };
}

export const COVER_ZONE = 60;
const SQUASH_TARGET = 1.4;
const GRAVITY_FADE = 0.22;
const GATHER_GLOW_CAP = 0.5;
const OVERSHOOT = 100;
const LEAN_ANGLE = 0.45;
const ENERGY_START = 0.2;
const ENERGY_END = 0.55;

export function waveFront(progress, source, width, height, style, focus, out) {
  const total = duration(style);
  const time = Math.min(Math.max(progress, 0), 1) * total;
  const since = time - style.anticipation;
  const ant = smooth(0, Math.max(style.anticipation, 1e-3), time);
  const tr = Math.min(Math.max(since / style.travel, 0), 1);
  const moved = travelEase(style)(tr);
  const ring = style.type === "center";
  const sideways = style.type === "horizontal";
  const sq = ring ? 1 : SQUASH_TARGET;
  const cx = source.x + source.w / 2;
  const cy = source.y + source.h / 2;
  const halfShort = Math.min(source.w, source.h) / 2;
  const span = sideways ? source.h : source.w;
  const halfSpine = ring ? 0 : Math.max(0, span / 2 - halfShort);
  const baseTilt = sideways ? Math.PI / 2 : 0;
  const cosB = Math.cos(baseTilt);
  const sinB = Math.sin(baseTilt);

  let bias = 0;
  if (!ring && focus) {
    const delta = sideways ? focus.y - cy : focus.x - cx;
    bias = Math.min(Math.max(delta / Math.max(span / 2, 1), -1), 1);
  }
  const shift = (bias * span / 2) * style.orientation;
  const lean = bias * style.orientation * LEAN_ANGLE;
  const fullTilt = baseTilt + lean;
  const spineDrop = smooth(0, 0.45, moved);
  const cosT = Math.cos(fullTilt);
  const sinT = Math.sin(fullTilt);

  let maxDist = 0;
  for (let i = 0; i < 4; i++) {
    const dx = (i & 1 ? width : 0) - cx - shift * cosB;
    const dy = (i & 2 ? height : 0) - cy - shift * sinB;
    maxDist = Math.max(maxDist, Math.hypot((cosT * dx + sinT * dy) * sq, -sinT * dx + cosT * dy));
  }
  const clearDist = maxDist + (style.swell + COVER_ZONE) * sq;
  const energyDecay = 1 - smooth(ENERGY_START, ENERGY_END, tr);
  const startRadius = halfShort + Math.max(style.launchGap, 0);
  const radius = since < 0
    ? startRadius + style.inhale * (1 - ant)
    : startRadius + (clearDist + OVERSHOOT - startRadius) * moved;
  const gatherPeak = Math.min(GATHER_GLOW_CAP * Math.max(style.gatherGlow, 0), 1);
  const clearStart = halfShort - style.rimSoftness;
  const clearEnd = maxDist + (style.rimSoftness + style.swell) * sq;
  const f = out ?? newFront();
  const aimBlend = smooth(0, 0.1, moved);

  f.ox = cx + shift * aimBlend * cosB;
  f.oy = cy + shift * aimBlend * sinB;
  f.tilt = baseTilt + lean * aimBlend;
  f.spine = halfSpine * (1 - spineDrop);
  f.radius = radius;
  f.moved = moved;
  f.squash = 1 + (sq - 1) * smooth(0, 0.5, moved);
  f.time = time;
  f.energy = smooth(0, 0.05, tr) * energyDecay;
  f.swell = style.swell * smooth(0, 0.3, moved);
  f.width = width;
  f.height = height;
  f.gravity = style.pull * ant * (1 - smooth(0, GRAVITY_FADE, since));
  f.glow = since < 0 ? gatherPeak * ant : (gatherPeak + (1 - gatherPeak) * smooth(0, 0.07, tr)) * energyDecay;
  f.clearRadius = clearStart + (clearEnd - clearStart) * CLEAR_EASE((since - style.linger) / Math.max(style.rimFade, 0.01));
  f.hairClearRadius = clearStart + (clearEnd - clearStart) * CLEAR_EASE((since - style.linger - style.hairlineLinger) / Math.max(style.hairlineFade, 0.01));
  f.rim = style.rimStrength * smooth(0, 0.1, tr) * (1 - smooth(0.9, 1, time / total));
  f.sparkle = smooth(0, Math.max(style.anticipation, 1e-3) * 0.35, time);
  f.flying = Math.max(since, 0);
  f.launched = since > 0;
  f.hasCleared = radius > clearDist;
  f.ring = ring;
  f.sideways = sideways;
  f.hold = ring ? halfShort : 0;
  return f;
}

export const LUMPS = 7;
const lumpScratch = new Float32Array(LUMPS * 3);
const hash1 = (a, b, c) => {
  const v = Math.sin(a * b + c) * 43758.5453;
  return v - Math.floor(v);
};

export function rimLumps(time, width, height, cornerRadius, pulse) {
  const ex = Math.max(width / 2 - cornerRadius, 0);
  const ey = Math.max(height / 2 - cornerRadius, 0);
  const perimeter = 4 * (ex + ey + 0.5 * Math.PI * cornerRadius);
  for (let i = 0; i < LUMPS; i++) {
    const h1 = hash1(i, 12.9898, 1.3);
    const h2 = hash1(i, 78.233, 4.1);
    const h3 = hash1(i, 39.425, 2.7);
    const center = (perimeter * (i + 0.35 * h1)) / LUMPS + time * (-22 + 44 * h2) * (1 + 2 * pulse);
    const len = (perimeter / LUMPS) * (0.2 + 0.25 * h3);
    const wobble = (0.25 + 0.3 * pulse) * Math.sin(time * (1.1 + 1.2 * h1) * (1 + pulse) + i * 2.4);
    lumpScratch[i * 3] = center;
    lumpScratch[i * 3 + 1] = len;
    lumpScratch[i * 3 + 2] = (0.2 + 2.6 * h2) * (1 + wobble);
  }
  return lumpScratch;
}

const PARTICLE_FAN = 0.22;
const PARTICLE_ARCH = 0.3;
const hash3 = (a, b, c) => {
  const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

export function makeParticles(style) {
  const list = [];
  for (let i = 0; i < Math.round(style.particleCount); i++) {
    const idx = i + 1;
    const seq = (k) => (idx * k) % 1;
    const sz = seq(0.5497004779);
    list.push({
      index: idx,
      column: (seq(0.7548776662) * 2 - 1) * 0.92,
      heading: seq(0.7548776662) * 2 * Math.PI,
      pace: 0.35 + 0.72 * Math.sqrt(seq(0.8191725134)),
      drift: 15 + 50 * seq(0.6710436067),
      sway: 3 + 11 * seq(0.4142135624),
      swayRate: 2.5 + 3.5 * seq(0.7320508076),
      twinkleRate: 8 + 12 * seq(0.2360679775),
      phase: seq(0.6180339887) * 2 * Math.PI,
      life: style.particleLife * (0.4 + 0.6 * seq(0.6457513111)),
      size: style.particleSize * (0.55 + 0.45 * sz * sz),
      brightness: 0.3 + 0.7 * seq(0.6055512755),
      hop: 0.16 + 0.14 * seq(0.1231056256),
      hopOffset: seq(0.472135955),
    });
  }
  return list;
}

export function particleAt(p, front, source, style, out = { x: 0, y: 0, a: 0 }) {
  const twinkle = 0.5 + 0.5 * Math.sin(front.time * p.twinkleRate + p.phase);
  const lum = p.brightness * (0.7 + 0.3 * twinkle);
  const spread = Math.min(Math.max(style.particleSpread, 0), 1);
  const cx = source.x + source.w / 2;
  const cy = source.y + source.h / 2;

  if (!front.launched) {
    const cycle = front.time / p.hop + p.hopOffset;
    const step = Math.floor(cycle);
    const frac = cycle - step;
    const env = smooth(0, 0.25, frac) * (1 - smooth(0.55, 1, frac));
    const endFade = 1 - smooth(style.anticipation * 0.75, style.anticipation, front.time);
    const alpha = front.sparkle * env * endFade * lum * style.gatherDots;
    if (front.ring) {
      const ang = hash3(p.index, step, 1) * 2 * Math.PI;
      const baseR = Math.min(source.w, source.h) / 2 + style.particleGap + style.particleFlight;
      const r = baseR + Math.max(style.particleReach - baseR, 0) * hash3(p.index, step, 2) - style.particleFlight * frac * frac;
      out.x = cx + Math.cos(ang) * r;
      out.y = cy + Math.sin(ang) * r;
      out.a = alpha;
      return out;
    }
    const halfSpan = (front.sideways ? source.h : source.w) / 2;
    const halfThick = (front.sideways ? source.w : source.h) / 2;
    const along = (hash3(p.index, step, 1) * 2 - 1) * (halfSpan + 24);
    const minDist = style.particleGap + style.particleFlight;
    const dist = minDist + Math.max(style.particleReach - minDist, 0) * hash3(p.index, step, 2);
    const corner = Math.min(source.w, source.h) / 2;
    const outDist = halfThick + dist;
    const clamped = Math.min(Math.max(along, -halfSpan + corner), halfSpan - corner);
    const sx = front.sideways ? cx + outDist : cx + along;
    const sy = front.sideways ? cy + along : cy - outDist;
    const dx = (front.sideways ? cx + halfThick : cx + clamped) - sx;
    const dy = (front.sideways ? cy + clamped : cy - halfThick) - sy;
    const len = Math.max(Math.hypot(dx, dy), 1);
    const travel = style.particleFlight * frac * frac;
    out.x = sx + (dx / len) * travel;
    out.y = sy + (dy / len) * travel;
    out.a = alpha;
    return out;
  }

  const alpha = (1 - smooth(p.life * 0.55, p.life, front.flying)) * lum;
  const sway = p.sway * Math.sin(p.swayRate * front.flying + p.phase) * Math.min(front.flying / 0.25, 1);
  if (front.ring) {
    const baseR = Math.min(source.w, source.h) / 2;
    const r = baseR + ((front.radius - baseR) * p.pace + p.drift * front.flying) * spread;
    const cs = Math.cos(p.heading);
    const sn = Math.sin(p.heading);
    out.x = front.ox + cs * r - sn * sway;
    out.y = front.oy + sn * r + cs * sway;
    out.a = alpha;
    return out;
  }
  const baseR = Math.min(source.w, source.h) / 2;
  const fan = 1 + PARTICLE_FAN * front.moved * p.pace * spread;
  const lateral = (p.column * (front.sideways ? source.h : source.w) / 2) * fan + sway;
  const forward = (baseR + (front.radius - baseR) * p.pace * spread) * (1 - PARTICLE_ARCH * p.column * p.column) + p.drift * front.flying * spread;
  const cs = Math.cos(front.tilt);
  const sn = Math.sin(front.tilt);
  out.x = front.ox + cs * lateral + sn * forward;
  out.y = front.oy + sn * lateral - cs * forward;
  out.a = alpha;
  return out;
}

function srgbToOklab(rgb) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [lin(rgb[0]), lin(rgb[1]), lin(rgb[2])];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform float uSigma;
out vec4 outColor;
void main() {
  float r = ceil(uSigma * 3.0);
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (float i = -48.0; i <= 48.0; i += 1.0) {
    if (abs(i) > r) continue;
    float w = exp(-0.5 * i * i / (uSigma * uSigma));
    acc += texture(uTex, vUv + uStep * i) * w;
    wsum += w;
  }
  outColor = acc / wsum;
}`;

const COPY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform float uLod;
out vec4 outColor;
void main() { outColor = textureLod(uTex, vUv, uLod); }`;

const MAIN_FRAG = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uPx;
uniform float uF[19];
uniform sampler2D uC0;
uniform sampler2D uC1;
uniform sampler2D uC2;
uniform sampler2D uR0;
uniform sampler2D uR1;
uniform sampler2D uR2;
uniform int uContent;
uniform int uRevealed;
uniform int uLens;
uniform int uLive;
uniform int uSame;
uniform int uRound;
uniform float uFloor;
uniform float uAmplitude;
uniform float uLensWidth;
uniform float uAberration;
uniform float uBlur;
uniform float uBlurAhead;
uniform float uBlurBehind;
uniform float uNear;
uniform vec3 uPal[9];
uniform int uPalCount;
uniform vec3 uAhead;
uniform vec3 uBehind;
uniform float uLead;
uniform float uTail;
uniform float uStrength;
uniform float uRimWidth;
uniform float uRimSoftness;
uniform float uCorner;
uniform float uUneven;
uniform float uPulse;
uniform float uHairW;
uniform float uHairO;
uniform float uHairWhite;
uniform vec3 uLumps[${LUMPS}];
out vec4 outColor;

const float coverZone = ${COVER_ZONE.toFixed(1)};
const float PI = 3.14159265;

struct Field { float d; vec2 n; vec2 q; vec2 raw; float g; };

float heldAt(vec2 p) {
  if (uF[16] <= 0.0) return 1.0;
  return smoothstep(uF[16] * 0.9, uF[16] * 1.8, length(p - vec2(uF[0], uF[1])));
}

Field fieldAt(vec2 p) {
  vec2 raw = p - vec2(uF[0], uF[1]);
  float cs = cos(uF[14]), sn = sin(uF[14]);
  vec2 q = vec2(cs * raw.x + sn * raw.y, -sn * raw.x + cs * raw.y);
  float spine = uF[2], radius = uF[3], squash = uF[4], time = uF[5], swell = uF[7];
  float mx = q.x * squash;
  vec2 v = vec2(max(abs(mx) - spine, 0.0), q.y);
  float l = max(length(v), 1e-3);
  vec2 grad = vec2(v.x * sign(q.x) * squash, v.y) / l;
  float g = max(length(grad), 1e-3);
  float bend;
  if (uF[15] > 0.5) {
    float a = atan(q.y, q.x);
    bend = 0.62 * sin(2.0 * a + time * 1.1) + 0.38 * sin(3.0 * a - time * 1.5 + 1.7);
  } else {
    float s = mx * 0.0058;
    bend = 0.62 * sin(s + time * 1.1) + 0.38 * sin(s * 2.1 - time * 1.5 + 1.7);
  }
  vec2 n = grad / g;
  Field o;
  o.d = (l - radius) / g + swell * bend;
  o.n = vec2(cs * n.x - sn * n.y, sn * n.x + cs * n.y);
  o.q = q;
  o.raw = raw;
  o.g = g;
  return o;
}

vec3 side(sampler2D a, sampler2D b, sampler2D c, vec2 s, float tn, float tf) {
  vec2 uv = clamp(s, vec2(0.5), uSize - 0.5) / uSize;
  vec3 col = textureLod(a, uv, 0.0).rgb;
  if (tn > 0.0) col = mix(col, textureLod(b, uv, 0.0).rgb, tn);
  if (tf > 0.0) col = mix(col, textureLod(c, uv, 0.0).rgb, tf);
  return col;
}

const vec3 spectrum[5] = vec3[5](
  vec3(0.571, 0.0, 0.0), vec3(0.343, 0.206, 0.0), vec3(0.086, 0.588, 0.086), vec3(0.0, 0.206, 0.343), vec3(0.0, 0.0, 0.571)
);

vec3 lensed(int which, vec2 s, vec2 split, float tn, float tf) {
  if (dot(split, split) < 0.0625) {
    return which == 0 ? side(uC0, uC1, uC2, s, tn, tf) : side(uR0, uR1, uR2, s, tn, tf);
  }
  vec3 o = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float along = float(i) / 4.0 * 2.0 - 1.0;
    vec3 c = which == 0 ? side(uC0, uC1, uC2, s + split * along, tn, tf) : side(uR0, uR1, uR2, s + split * along, tn, tf);
    o += c * spectrum[i];
  }
  return o;
}

float continuousRectSDF(vec2 p, vec2 halfSize, float radius) {
  float a = min(radius * 1.528665, min(halfSize.x, halfSize.y));
  vec2 q = abs(p) - (halfSize - a);
  if (q.x <= 0.0 || q.y <= 0.0) return max(abs(p.x) - halfSize.x, abs(p.y) - halfSize.y);
  const float n = 3.26;
  vec2 u = q / a;
  float norm = pow(pow(u.x, n) + pow(u.y, n), 1.0 / n);
  vec2 gg = pow(u / max(norm, 1e-4), vec2(n - 1.0));
  return (norm - 1.0) * a / max(length(gg), 1e-3);
}

float edgeSDF(vec2 p, vec2 halfSize, float radius) {
  if (uRound == 0) return continuousRectSDF(p, halfSize, radius);
  float r = min(radius, min(halfSize.x, halfSize.y));
  vec2 q = abs(p) - (halfSize - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 perimeterAt(vec2 p, vec2 halfSize, float r) {
  float ex = max(halfSize.x - r, 0.0);
  float ey = max(halfSize.y - r, 0.0);
  float arc = 0.5 * PI * r;
  float P = 4.0 * (ex + ey + arc);
  float ax = abs(p.x), ay = abs(p.y);
  if (ax > ex && ay > ey) {
    vec2 v = p - vec2(sign(p.x) * ex, sign(p.y) * ey);
    float a, base;
    if (p.x >= 0.0 && p.y < 0.0) { a = atan(v.x, -v.y); base = ex; }
    else if (p.x >= 0.0) { a = atan(v.y, v.x); base = ex + arc + 2.0 * ey; }
    else if (p.y >= 0.0) { a = atan(-v.x, v.y); base = 3.0 * ex + 2.0 * arc + 2.0 * ey; }
    else { a = atan(-v.y, -v.x); base = 3.0 * ex + 3.0 * arc + 4.0 * ey; }
    return vec2(base + r * clamp(a, 0.0, 0.5 * PI), P);
  }
  bool sideHit = ax > ex ? true : (ay > ey ? false : (halfSize.x - ax) < (halfSize.y - ay));
  if (sideHit) return vec2(p.x >= 0.0 ? ex + arc + (p.y + ey) : 3.0 * ex + 3.0 * arc + 2.0 * ey + (ey - p.y), P);
  return vec2(p.y < 0.0 ? (p.x >= 0.0 ? p.x : P + p.x) : ex + 2.0 * arc + 2.0 * ey + (ex - p.x), P);
}

float rimThickness(float s, float P) {
  float t = 0.08;
  for (int i = 0; i < ${LUMPS}; i++) {
    float ds = s - uLumps[i].x;
    ds -= P * floor(ds / P + 0.5);
    float k = ds / uLumps[i].y;
    t += uLumps[i].z * exp(-k * k);
  }
  return t / 1.0498;
}

float dither(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))) - 0.5; }

vec3 paletteAt(float u) {
  float x = fract(u) * float(uPalCount);
  int i = min(int(x), uPalCount - 1);
  int j = i + 1 == uPalCount ? 0 : i + 1;
  float m = fract(x);
  m = m * m * (3.0 - 2.0 * m);
  return mix(uPal[i], uPal[j], m);
}

vec3 oklabToSRGB(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  vec3 lin = clamp(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), 0.0, 1.0);
  return mix(12.92 * lin, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), lin));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uPx.y - gl_FragCoord.y) * (uSize.x / uPx.x);

  if (uLive == 0) {
    outColor = vec4(uRevealed == 1 ? textureLod(uR0, p / uSize, 0.0).rgb : textureLod(uC0, p / uSize, 0.0).rgb, 1.0);
    return;
  }

  Field w = fieldAt(p);
  float energy = uF[6], gravity = uF[10];
  float held = heldAt(p);

  vec2 s = p;
  vec2 split = vec2(0.0);
  if (uLens == 1) {
    float u = w.d / (uLensWidth * (w.d > 0.0 ? 0.85 : 1.5));
    float lift = exp(-u * u);
    float r = max(length(w.raw), 1.0);
    vec2 swollen = w.n * energy * uAmplitude * lift * held;
    vec2 inward = w.raw / r;
    s = p - swollen + inward * gravity * exp(-r / 900.0) * held;
    split = (swollen - inward * gravity * exp(-r / 240.0) * held) * uAberration;
  }

  float bu = w.d / (w.d > 0.0 ? uBlurAhead : uBlurBehind);
  float radius = energy * uBlur * exp(-bu * bu) * held;
  float tn = clamp(radius / max(uNear, 1e-3), 0.0, 1.0);
  tn = tn * tn * (3.0 - 2.0 * tn);
  float tf = clamp((radius - uNear) / max(uBlur - uNear, 1e-3), 0.0, 1.0);
  tf = tf * tf * (3.0 - 2.0 * tf);

  float cover = 1.0;
  if (uContent == 1 && uF[17] > 0.5) cover = smoothstep(-coverZone, coverZone, w.d);
  if (uContent == 0) cover = 0.0;

  float own = uFloor;
  if (own < 1.0) {
    float moved = max(smoothstep(0.03, 0.4, length(s - p)), smoothstep(0.03, 0.4, length(split)));
    own = max(own, max(moved, smoothstep(0.0, 0.6, radius)));
    if (uSame == 0 && uContent == 1) own = max(own, 1.0 - smoothstep(0.9, 1.0, cover));
  }

  vec3 col = vec3(0.0);
  if (own > 0.0) {
    if (uSame == 1) {
      col = lensed(0, s, split, tn, tf);
    } else {
      bool showRevealed = uRevealed == 1 && w.d <= coverZone + 6.0 && cover < 1.0;
      if (showRevealed) col = lensed(1, s, split, tn, tf);
      if (cover > 0.0) col = mix(col, lensed(0, s, split, tn, tf), cover);
    }
  }

  float d = w.d, time = uF[5], glow = uF[11], rim = uF[13];
  vec2 c = p - uSize * 0.5;
  float inset = max(-edgeSDF(c, uSize * 0.5, uCorner), 0.0);
  bool nearEdge = rim > 0.0 && inset < max(uRimWidth * 2.2 * (1.0 + 1.9 * uUneven), uHairW * 0.5 + 0.75);
  if (glow <= 0.0 && !nearEdge) {
    outColor = vec4((col + dither(gl_FragCoord.xy) / 255.0) * own, own);
    return;
  }
  bool ring = uF[15] > 0.5;
  float turn = atan(w.q.y, w.q.x);
  float along = w.q.x * 0.0068;
  float lobes = ring
    ? 0.5 + 0.5 * sin(2.0 * turn + time * 1.4) * cos(turn - time * 0.7 + 1.2)
    : 0.5 + 0.5 * sin(along * 1.3 + time * 1.4) * cos(along * 0.6 - time * 0.7 + 1.2);
  float bandA = 0.0;
  if (glow > 0.0 && d < uLead) {
    if (d >= 0.0) {
      float k = 1.0 - d / uLead;
      bandA = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
    } else {
      bandA = pow(1.0 - clamp(-d / (uTail * mix(0.6, 1.3, lobes)), 0.0, 1.0), 2.3);
    }
    bandA *= glow * uStrength * mix(0.6, 1.0, exp(-inset / 140.0)) * held;
  }
  float aroundA = atan(c.y / uSize.y, c.x / uSize.x);
  float rimA = 0.0;
  float hairA = 0.0;
  float shimmer = 0.5;
  if (nearEdge) {
    vec2 edge = perimeterAt(c, uSize * 0.5, uCorner);
    float thickness = 1.0;
    if (uUneven > 0.0) thickness = max(1.0 + (rimThickness(edge.x, edge.y) - 1.0) * uUneven, 0.04);
    float hk = inset / (uRimWidth * thickness);
    float hug = exp(-hk * hk);
    float reached = 1.0 - smoothstep(-uLead * 0.7, uLead * 0.5, d);
    float kept = smoothstep(-uRimSoftness, uRimSoftness, d + (uF[3] - uF[12]) / w.g);
    shimmer = 0.5 + 0.5 * sin(time * 3.4 - edge.x / edge.y * 4.0 * PI);
    rimA = hug * reached * kept * rim * mix(1.0, 0.7 + 0.3 * shimmer, uPulse);
    if (uHairW > 0.0) {
      float line = 1.0 - smoothstep(uHairW * 0.5, uHairW * 0.5 + 0.75, inset);
      float hairKept = smoothstep(-uRimSoftness, uRimSoftness, d + (uF[3] - uF[18]) / w.g);
      hairA = line * reached * hairKept * rim * uHairO
        * mix(0.5, 1.0, smoothstep(0.1, 1.5, thickness))
        * mix(1.0, 0.55 + 0.45 * shimmer, uPulse);
    }
  }
  float a = 1.0 - (1.0 - bandA) * (1.0 - rimA);
  float total = 1.0 - (1.0 - a) * (1.0 - hairA);
  if (total <= 0.0005) {
    outColor = vec4((col + dither(gl_FragCoord.xy) / 255.0) * own, own);
    return;
  }
  float flow = 0.62 + (ring ? turn / (2.0 * PI) : along * 0.2) + time * 0.13 + d * 0.0015 + (ring ? 0.0 : 0.05 * sin(w.q.y * 0.009 + time));
  vec3 lab = paletteAt(flow);
  lab = mix(lab, uAhead, 0.5 * exp(-pow((d - 30.0) / 50.0, 2.0)));
  lab = mix(lab, uBehind, 0.5 * exp(-pow((d + 84.0) / 72.0, 2.0)));
  lab.yz *= 1.22;
  lab = mix(lab, vec3(0.99, 0.0, 0.0), 0.7 * exp(-pow((d + 8.0) / 26.0, 2.0)));
  vec3 rimLab = paletteAt(aroundA / (2.0 * PI) + time * (0.12 + 0.25 * uPulse) + inset * 0.0012);
  rimLab.yz *= 1.1;
  lab = mix(lab, rimLab, rimA / (rimA + bandA + 1e-4));
  vec3 rgb = oklabToSRGB(lab);
  if (hairA > 0.0) {
    vec3 hair = mix(oklabToSRGB(rimLab), vec3(1.0), uHairWhite * (0.5 + 0.5 * shimmer));
    rgb = (rgb * a * (1.0 - hairA) + hair * hairA) / total;
  }
  float noise = dither(gl_FragCoord.xy) * 2.0 / 255.0;
  float over = clamp(total + noise, 0.0, 1.0);
  outColor = vec4(col * own * (1.0 - over) + clamp(rgb + noise, 0.0, 1.0) * over, 1.0 - (1.0 - own) * (1.0 - over));
}`;

const DOT_VERT = `#version 300 es
in vec3 aDot;
uniform vec2 uSize;
uniform float uPoint;
out float vA;
void main() {
  vec2 clip = vec2(aDot.x / uSize.x * 2.0 - 1.0, 1.0 - aDot.y / uSize.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = uPoint;
  vA = aDot.z;
}`;

const DOT_FRAG = `#version 300 es
precision highp float;
in float vA;
uniform float uScale;
uniform float uPoint;
out vec4 outColor;
void main() {
  float a = fract(vA);
  float size = floor(vA) / 10.0;
  float r = length(gl_PointCoord - 0.5) * uPoint;
  float edge = size * uScale * 0.5;
  float cov = clamp(edge - r + 0.5, 0.0, 1.0);
  outColor = vec4(vec3(1.0) * a * cov, a * cov);
}`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader: ${gl.isContextLost() ? "context lost" : gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

function linkProgram(gl, vert, frag) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.bindAttribLocation(prog, 0, "aDot");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || "link");
  }
  const cache = new Map();
  return {
    p: prog,
    loc: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
      return cache.get(name);
    },
  };
}

const TEX_SLOTS = ["uC0", "uC1", "uC2", "uR0", "uR1", "uR2"];
const NEAR_BLUR = 7;

function sourceDims(src) {
  return {
    w: src.naturalWidth || src.videoWidth || src.displayWidth || src.width || 1,
    h: src.naturalHeight || src.videoHeight || src.displayHeight || src.height || 1,
  };
}

export class WaveRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.screens = { content: null, revealed: null };
    this.blank = null;
    this.sizePt = { w: 1, h: 1 };
    this.farBlur = -1;
    this.field = new Float32Array(19);
    this.dotsSize = 0;
    this.pal = new Float32Array(27);
    this.palKey = null;
    this.ahead = new Float32Array(3);
    this.behind = new Float32Array(3);
    this.scratches = new Map();
    this.alpha = !!options.alpha;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      premultipliedAlpha: true,
      alpha: this.alpha,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.ok = !!gl;
    this.gl = gl;
    if (!gl) {
      this.quad = this.dots = null;
      this.main = this.blur = this.copy = this.dot = null;
      return;
    }
    this.main = linkProgram(gl, VERT_SRC, MAIN_FRAG);
    this.blur = linkProgram(gl, VERT_SRC, BLUR_FRAG);
    this.copy = linkProgram(gl, VERT_SRC, COPY_FRAG);
    this.dot = linkProgram(gl, DOT_VERT, DOT_FRAG);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.dots = gl.createBuffer();
  }

  get lost() { return !this.ok || this.gl.isContextLost(); }
  get maxTextureSize() { return this.ok ? this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) : 0; }
  has(slot) { return !!this.screens[slot]; }

  texture(w, h, src, mipmap = false) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mipmap) gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }

  target(w, h) {
    const gl = this.gl;
    const tex = this.texture(w, h);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }

  drop(t) {
    if (!t) return;
    this.gl.deleteTexture(t.tex);
    this.gl.deleteFramebuffer(t.fb);
  }

  quadDraw(prog) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  blurred(sharp, w, h, sigmaPt, existing) {
    const gl = this.gl;
    const scale = w / this.sizePt.w;
    const sigmaPx = sigmaPt * scale;
    const div = Math.max(1, Math.round(sigmaPx / 5));
    const bw = Math.max(1, Math.round(w / div));
    const bh = Math.max(1, Math.round(h / div));
    let out = existing;
    if (!out || out.w !== bw || out.h !== bh) {
      this.drop(out);
      out = this.target(bw, bh);
    }
    const tmp = this.scratch(bw, bh);
    gl.viewport(0, 0, bw, bh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.fb);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sharp);
    gl.useProgram(this.copy.p);
    gl.uniform1i(this.copy.loc("uTex"), 0);
    gl.uniform1f(this.copy.loc("uLod"), Math.log2(div));
    this.quadDraw(this.copy);

    const k = sigmaPx / div;
    gl.useProgram(this.blur.p);
    gl.uniform1i(this.blur.loc("uTex"), 0);
    gl.uniform1f(this.blur.loc("uSigma"), Math.max(k, 0.01));
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmp.fb);
    gl.bindTexture(gl.TEXTURE_2D, out.tex);
    gl.uniform2f(this.blur.loc("uStep"), 1 / bw, 0);
    this.quadDraw(this.blur);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out.fb);
    gl.bindTexture(gl.TEXTURE_2D, tmp.tex);
    gl.uniform2f(this.blur.loc("uStep"), 0, 1 / bh);
    this.quadDraw(this.blur);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return out;
  }

  scratch(w, h) {
    const key = `${w}x${h}`;
    let t = this.scratches.get(key);
    if (!t) {
      t = this.target(w, h);
      this.scratches.set(key, t);
    }
    return t;
  }

  setScreen(src, widthPt, heightPt, blurPt, which = "content") {
    if (!this.ok) return;
    const gl = this.gl;
    const { w, h } = sourceDims(src);
    this.sizePt.w = widthPt;
    this.sizePt.h = heightPt;
    let sc = this.screens[which];
    if (sc && (sc.w !== w || sc.h !== h)) {
      this.dropScreen(sc);
      sc = null;
    }
    if (sc) {
      gl.bindTexture(gl.TEXTURE_2D, sc.sharp);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      sc = { sharp: this.texture(w, h, src, true), near: null, far: null, w, h };
    }
    sc.near = this.blurred(sc.sharp, sc.w, sc.h, NEAR_BLUR, sc.near);
    sc.far = this.blurred(sc.sharp, sc.w, sc.h, Math.max(blurPt, NEAR_BLUR), sc.far);
    this.screens[which] = sc;
    this.farBlur = blurPt;
  }

  setSize(w, h) {
    this.sizePt.w = Math.max(w, 1);
    this.sizePt.h = Math.max(h, 1);
  }

  clearScreen(which) {
    if (!this.ok) return;
    this.dropScreen(this.screens[which]);
    this.screens[which] = null;
  }

  dropScreen(sc) {
    if (!sc) return;
    this.gl.deleteTexture(sc.sharp);
    this.drop(sc.near);
    this.drop(sc.far);
  }

  patchScreen(which, src, x, y) {
    if (!this.ok) return;
    const sc = this.screens[which];
    if (!sc) return;
    const { w, h } = sourceDims(src);
    if (x < 0 || y < 0 || x + w > sc.w || y + h > sc.h) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, sc.sharp);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  reblur(which) {
    if (!this.ok) return;
    const sc = this.screens[which];
    if (!sc) return;
    sc.near = this.blurred(sc.sharp, sc.w, sc.h, NEAR_BLUR, sc.near);
    sc.far = this.blurred(sc.sharp, sc.w, sc.h, Math.max(this.farBlur, NEAR_BLUR), sc.far);
  }

  setBlur(blurPt) {
    if (!this.ok || blurPt === this.farBlur) return;
    this.farBlur = blurPt;
    for (const sc of [this.screens.content, this.screens.revealed]) {
      if (sc) sc.far = this.blurred(sc.sharp, sc.w, sc.h, Math.max(blurPt, NEAR_BLUR), sc.far);
    }
  }

  clear() {
    if (!this.ok) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  blankTexture() {
    if (!this.blank) {
      const gl = this.gl;
      this.blank = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.blank);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    return this.blank;
  }

  render(front, style, lumps, dots, opts = {}) {
    if (!this.ok) return;
    const content = this.screens.content;
    if (!content && !this.alpha) return;
    if (!front && this.alpha) { this.clear(); return; }
    const revealed = opts.same ? content : (this.screens.revealed ?? content);
    const gl = this.gl;
    const pxW = this.canvas.width;
    const pxH = this.canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, pxW, pxH);
    gl.disable(gl.BLEND);

    const m = this.main;
    gl.useProgram(m.p);
    const blank = content ? null : this.blankTexture();
    for (let i = 0; i < 6; i++) {
      const sc = i < 3 ? content : revealed;
      const tex = sc ? (i % 3 === 0 ? sc.sharp : i % 3 === 1 ? sc.near.tex : sc.far.tex) : blank;
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(m.loc(TEX_SLOTS[i]), i);
    }
    gl.uniform2f(m.loc("uSize"), this.sizePt.w, this.sizePt.h);
    gl.uniform2f(m.loc("uPx"), pxW, pxH);
    gl.uniform1i(m.loc("uLive"), front ? 1 : 0);
    if (!front) {
      gl.uniform1i(m.loc("uRevealed"), 0);
      this.quadDraw(m);
      return;
    }
    const gain = content ? Math.min(Math.max(opts.gain ?? 1, 0), 1) : 0;
    const energy = front.energy * gain;
    const gravity = front.gravity * gain;
    const f = this.field;
    f[0] = front.ox; f[1] = front.oy; f[2] = front.spine; f[3] = front.radius;
    f[4] = front.squash; f[5] = front.time; f[6] = energy; f[7] = front.swell;
    f[8] = front.width; f[9] = front.height; f[10] = gravity; f[11] = front.glow;
    f[12] = front.clearRadius; f[13] = front.rim; f[14] = front.tilt;
    f[15] = front.ring ? 1 : 0; f[16] = front.hold; f[17] = front.launched ? 1 : 0; f[18] = front.hairClearRadius;
    gl.uniform1fv(m.loc("uF"), f);

    const hasEnergy = energy > 0;
    gl.uniform1i(m.loc("uContent"), front.hasCleared ? 0 : 1);
    gl.uniform1i(m.loc("uRevealed"), front.launched ? 1 : 0);
    gl.uniform1i(m.loc("uLens"), hasEnergy || gravity > 0 ? 1 : 0);
    gl.uniform1i(m.loc("uSame"), opts.same || revealed === content ? 1 : 0);
    gl.uniform1i(m.loc("uRound"), opts.round ? 1 : 0);
    gl.uniform1f(m.loc("uFloor"), Math.min(Math.max(opts.floor ?? (this.alpha ? 0 : 1), 0), 1));
    gl.uniform1f(m.loc("uAmplitude"), style.amplitude);
    gl.uniform1f(m.loc("uLensWidth"), style.lensWidth);
    gl.uniform1f(m.loc("uAberration"), style.aberration);
    gl.uniform1f(m.loc("uBlur"), hasEnergy ? Math.max(style.blur, NEAR_BLUR) : 0);
    gl.uniform1f(m.loc("uBlurAhead"), style.blurAhead);
    gl.uniform1f(m.loc("uBlurBehind"), style.blurBehind);
    gl.uniform1f(m.loc("uNear"), NEAR_BLUR);

    const count = Math.min(style.palette.colors.length, 9);
    if (this.palKey !== style.palette) {
      this.palKey = style.palette;
      for (let i = 0; i < count; i++) this.pal.set(srgbToOklab(style.palette.colors[i]), i * 3);
      this.ahead.set(srgbToOklab(style.palette.ahead));
      this.behind.set(srgbToOklab(style.palette.behind));
    }
    gl.uniform3fv(m.loc("uPal"), this.pal);
    gl.uniform1i(m.loc("uPalCount"), Math.max(count, 1));
    gl.uniform3fv(m.loc("uAhead"), this.ahead);
    gl.uniform3fv(m.loc("uBehind"), this.behind);
    gl.uniform1f(m.loc("uLead"), style.lead);
    gl.uniform1f(m.loc("uTail"), style.tail);
    gl.uniform1f(m.loc("uStrength"), style.strength);
    gl.uniform1f(m.loc("uRimWidth"), style.rimWidth);
    gl.uniform1f(m.loc("uRimSoftness"), style.rimSoftness);
    gl.uniform1f(m.loc("uCorner"), style.cornerRadius);
    gl.uniform1f(m.loc("uUneven"), style.rimUnevenness);
    gl.uniform1f(m.loc("uPulse"), style.rimPulse);
    gl.uniform1f(m.loc("uHairW"), style.hairlineWidth);
    gl.uniform1f(m.loc("uHairO"), style.hairlineOpacity);
    gl.uniform1f(m.loc("uHairWhite"), style.hairlineWhite);
    gl.uniform3fv(m.loc("uLumps"), lumps);
    this.quadDraw(m);

    if (dots && dots.count > 0) {
      const dp = this.dot;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(dp.p);
      gl.uniform2f(dp.loc("uSize"), this.sizePt.w, this.sizePt.h);
      const scale = pxW / this.sizePt.w;
      gl.uniform1f(dp.loc("uScale"), scale);
      gl.uniform1f(dp.loc("uPoint"), Math.ceil((style.particleSize + 1) * scale) + 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dots);
      if (this.dotsSize < dots.data.length) {
        gl.bufferData(gl.ARRAY_BUFFER, dots.data.byteLength, gl.DYNAMIC_DRAW);
        this.dotsSize = dots.data.length;
      }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, dots.data, 0, dots.count * 3);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, dots.count);
      gl.disable(gl.BLEND);
    }
  }

  prime(front, style, lumps, dots, opts = {}) {
    if (!this.ok) return;
    const gl = this.gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, 1, 1);
    this.render(front, style, lumps, dots, opts);
    gl.disable(gl.SCISSOR_TEST);
    this.clear();
  }

  dispose() {
    if (!this.ok) return;
    const gl = this.gl;
    this.dropScreen(this.screens.content);
    this.dropScreen(this.screens.revealed);
    this.screens = { content: null, revealed: null };
    if (this.blank) gl.deleteTexture(this.blank);
    this.blank = null;
    for (const t of this.scratches.values()) this.drop(t);
    this.scratches.clear();
    for (const prog of [this.main, this.blur, this.copy, this.dot]) gl.deleteProgram(prog.p);
    gl.deleteBuffer(this.quad);
    gl.deleteBuffer(this.dots);
  }
}

// ─── DOM Snapshot (ShadowRoot-isolated default style probe, zero iframes) ───

const XHTML_NS = "http://www.w3.org/1999/xhtml";
const SVG_NS = "http://www.w3.org/2000/svg";
const SKIP_PROPS = new RegExp(
  "^(?:" + [
    "animation", "transition", "view-timeline", "scroll-timeline", "timeline-scope",
    "view-transition", "scroll-behavior", "scroll-snap", "scroll-margin", "scroll-padding",
    "scroll-marker", "scroll-target", "overscroll-behavior", "anchor-", "position-anchor",
    "position-area", "position-try", "position-visibility", "cursor$", "pointer-events$",
    "user-select$", "-webkit-user-", "-moz-user-", "touch-action$", "will-change$", "resize$",
    "caret-", "interactivity$", "app-region$", "-webkit-app-region$", "-webkit-tap-highlight",
    "orphans$", "widows$", "page", "break-", "speak", "interpolate-size$", "field-sizing$",
    "reading-flow$", "reading-order$", "-moz-window", "-moz-force-broken",
    "-moz-context-properties$", "-moz-orient$", "-webkit-line-grid", "-webkit-nbsp-mode",
    "-webkit-cursor", "-webkit-touch-callout",
  ].join("|") + ")"
);
const LOGICAL_PROPS = /(?:^|-)(?:block|inline)(?:-|$)|^border-(?:start|end)-(?:start|end)-radius$/;
const INHERITED_PROPS = new Set(
  "border-collapse border-spacing caption-side color color-scheme direction empty-cells font-family font-feature-settings font-kerning font-language-override font-optical-sizing font-palette font-size font-size-adjust font-stretch font-width font-style font-synthesis-weight font-synthesis-style font-synthesis-small-caps font-synthesis-position font-variant-alternates font-variant-caps font-variant-east-asian font-variant-emoji font-variant-ligatures font-variant-numeric font-variant-position font-variation-settings font-weight forced-color-adjust hanging-punctuation hyphenate-character hyphenate-limit-chars hyphens image-orientation image-rendering letter-spacing line-break line-height line-height-step list-style-image list-style-position list-style-type math-depth math-shift math-style overflow-wrap paint-order print-color-adjust quotes ruby-align ruby-position tab-size text-align text-align-last text-anchor text-autospace text-combine-upright text-decoration-skip-ink text-emphasis-color text-emphasis-position text-emphasis-style text-indent text-justify text-orientation text-rendering text-shadow text-size-adjust text-spacing-trim text-transform text-underline-offset text-underline-position text-wrap-mode text-wrap-style text-wrap white-space-collapse white-space visibility word-break word-spacing writing-mode fill fill-opacity fill-rule stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width clip-rule color-interpolation color-interpolation-filters color-rendering shape-rendering marker-start marker-mid marker-end -webkit-font-smoothing -moz-osx-font-smoothing -webkit-text-fill-color -webkit-text-stroke-color -webkit-text-stroke-width -webkit-text-security -webkit-locale -webkit-rtl-ordering -webkit-text-orientation -webkit-writing-mode -webkit-line-break -webkit-border-horizontal-spacing -webkit-border-vertical-spacing -webkit-print-color-adjust -webkit-text-decorations-in-effect -webkit-text-size-adjust -webkit-hyphenate-character -webkit-text-emphasis-color -webkit-text-emphasis-position -webkit-text-emphasis-style -webkit-text-combine -webkit-ruby-position -webkit-text-zoom -webkit-box-direction -webkit-user-modify -moz-text-size-adjust -moz-tab-size -moz-box-direction -webkit-hyphens -webkit-text-underline-position -webkit-font-kerning -webkit-font-feature-settings".split(" ")
);
const COLOR_DEFAULTS = new Set([
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "outline-color", "text-decoration-color", "column-rule-color", "-webkit-text-decoration-color",
]);
const IGNORED_TAGS = new Set(["script", "style", "noscript", "template", "link", "meta", "title", "head", "base", "source", "track", "param", "datalist"]);
const VOID_TAGS = new Set(["area", "br", "col", "embed", "hr", "img", "input", "wbr"]);
const VALID_TAG = /^[A-Za-z_][\w.-]*$/;
const VALID_SVG_ATTR = /^(?:(?:xlink|xml):)?[A-Za-z_][\w.-]*$/;
const KEEP_ATTRS = {
  "*": ["dir", "lang"],
  input: ["type", "placeholder", "disabled", "min", "max", "step", "size", "multiple", "readonly"],
  textarea: ["placeholder", "rows", "cols", "disabled", "readonly"],
  select: ["multiple", "size", "disabled"],
  button: ["disabled", "type"],
  option: ["disabled", "label"],
  optgroup: ["disabled", "label"],
  progress: ["value", "max"],
  meter: ["value", "min", "max", "low", "high", "optimum"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  col: ["span"],
  colgroup: ["span"],
  ol: ["start", "reversed", "type"],
  li: ["value"],
  details: ["open"],
  dialog: ["open"],
};

let probe = null;
let probeUsers = 0;
let inhNames = [];
let nonNames = [];
let isColorDefault = [];
let colorIdx = 0;
let fontIdx = 0;
let transformIdx = -1;
let originIdx = -1;
let perspOriginIdx = -1;
let appearIdx = -1;
let appearanceTriggers = [];
let appearanceSkips = [];
let divDefaults = { inh: [], non: [] };
const defaultCache = new Map();

function retainProbe() { probeUsers++; }
function releaseProbe() {
  probeUsers = Math.max(0, probeUsers - 1);
  if (probeUsers === 0 && probe) {
    probe.host.remove();
    probe = null;
    defaultCache.clear();
  }
}

function ensureProbe(doc) {
  if (probe && probe.host.isConnected && probe.doc === doc) return true;
  if (!doc) return false;
  probe?.host.remove();
  probe = null;
  defaultCache.clear();
  const host = doc.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("data-dw-skip", "");
  host.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "open" });
  const hidden = doc.createElement("div");
  hidden.style.cssText = "all:initial;display:none;";
  const svg = doc.createElementNS(SVG_NS, "svg");
  hidden.appendChild(svg);
  shadow.appendChild(hidden);
  (doc.body ?? doc.documentElement).appendChild(host);
  const win = doc.defaultView;
  if (!win) { host.remove(); return false; }
  probe = { host, doc, win, hidden, svg };
  if (!inhNames.length) {
    const sample = doc.createElement("div");
    hidden.appendChild(sample);
    const cs = win.getComputedStyle(sample);
    const inh = [];
    const non = [];
    for (let i = 0; i < cs.length; i++) {
      const name = cs[i];
      if (name.startsWith("--") || SKIP_PROPS.test(name) || LOGICAL_PROPS.test(name)) continue;
      (INHERITED_PROPS.has(name) ? inh : non).push(name);
    }
    sample.remove();
    inhNames = inh;
    nonNames = non;
    isColorDefault = non.map((p) => COLOR_DEFAULTS.has(p));
    colorIdx = inh.indexOf("color");
    fontIdx = inh.indexOf("font-family");
    transformIdx = non.indexOf("transform");
    originIdx = non.indexOf("transform-origin");
    perspOriginIdx = non.indexOf("perspective-origin");
    appearIdx = non.indexOf("appearance");
    if (appearIdx < 0) appearIdx = non.indexOf("-webkit-appearance");
    const borderRe = /^border-(?:top|right|bottom|left)-(?:width|style|color)$/;
    const bgRe = /^background-(?:color|image)$/;
    const padRe = /^padding-(?:top|right|bottom|left)$/;
    appearanceSkips = non.map((p) => borderRe.test(p) || bgRe.test(p) || padRe.test(p));
    appearanceTriggers = non.map((p, idx) => (borderRe.test(p) || bgRe.test(p) ? idx : -1)).filter((idx) => idx >= 0);
  }
  divDefaults = tagDefaults("div", XHTML_NS, "");
  return true;
}

function tagDefaults(tag, ns, inputType) {
  const isSvg = ns === SVG_NS;
  const key = isSvg ? "svg:" + tag : inputType ? tag + ":" + inputType : tag;
  const cached = defaultCache.get(key);
  if (cached) return cached;
  const p = probe;
  let el;
  try { el = isSvg ? p.doc.createElementNS(SVG_NS, tag) : p.doc.createElement(tag); }
  catch { el = p.doc.createElement("span"); }
  if (inputType) el.setAttribute("type", inputType);
  (isSvg && tag !== "svg" ? p.svg : p.hidden).appendChild(el);
  const cs = p.win.getComputedStyle(el);
  const res = {
    inh: inhNames.map((n) => cs.getPropertyValue(n)),
    non: nonNames.map((n) => cs.getPropertyValue(n)),
  };
  el.remove();
  defaultCache.set(key, res);
  return res;
}

const dataCache = new Map();
const inflight = new Map();
const CACHE_LIMIT = 400;

function cacheSet(key, value) {
  if (dataCache.size >= CACHE_LIMIT) {
    const first = dataCache.keys().next().value;
    if (first !== undefined) dataCache.delete(first);
  }
  dataCache.set(key, value);
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function fetchText(url) {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(timer);
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

async function fetchDataUrl(url) {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 4000);
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(timer);
    return res.ok ? await blobToDataUrl(await res.blob()) : null;
  } catch { return null; }
}

async function resizeImage(img, url, w, h, doc) {
  try {
    const c = doc.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return fetchDataUrl(url);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => c.toBlob(resolve, "image/webp", 0.96));
    if (blob) return await blobToDataUrl(blob);
  } catch { /* fall through */ }
  return fetchDataUrl(url);
}

function queueFetch(key, loader) {
  let job = inflight.get(key);
  if (!job) {
    job = loader().catch(() => null).then((val) => {
      cacheSet(key, val);
      inflight.delete(key);
    });
    inflight.set(key, job);
  }
  return job;
}

let fontRulesCache = [];
let fontRulesKey = "";
const sheetTextCache = new Map();
const stripQuotes = (s) => s.trim().replace(/^(["'])(.*)\1$/, "$2");
const normFamily = (s) => stripQuotes(s).toLowerCase();
const normWeight = (s) => s.trim().toLowerCase().replace(/\bnormal\b/g, "400").replace(/\bbold\b/g, "700") || "400";
const normRange = (s) => s.toLowerCase().split(",").map((p) => p.trim().replace(/^u\+/, "").split("-").map((x) => x.replace(/^0+(?=.)/, "")).join("-")).filter(Boolean).join(",") || "0-10ffff";
const fontKey = (fam, style, weight, range) => `${normFamily(fam)}|${style.trim().toLowerCase() || "normal"}|${normWeight(weight)}|${normRange(range)}`;

function parseDecls(text) {
  const out = {};
  let depth = 0, quote = "", start = 0;
  const push = (end) => {
    const chunk = text.slice(start, end);
    const colon = chunk.indexOf(":");
    if (colon > 0) out[chunk.slice(0, colon).trim().toLowerCase()] = chunk.slice(colon + 1).trim();
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === ";" && depth === 0) { push(i); start = i + 1; }
  }
  push(text.length);
  return out;
}

const FONT_DESCS = [
  "font-style", "font-weight", "font-stretch", "font-width", "unicode-range",
  "font-feature-settings", "font-variation-settings", "ascent-override",
  "descent-override", "line-gap-override", "size-adjust",
];

function extractFontFaces(cssText, baseUrl, out) {
  const re = /@font-face\s*\{([^}]*)\}/gi;
  let m;
  while ((m = re.exec(cssText))) {
    const decls = parseDecls(m[1]);
    const fam = decls["font-family"];
    const src = decls.src;
    if (!fam || !src) continue;
    let descriptors = `font-family:"${stripQuotes(fam).replace(/["\\]/g, "\\$&")}";`;
    for (const d of FONT_DESCS) if (decls[d]) descriptors += `${d}:${decls[d]};`;
    out.push({
      family: normFamily(fam),
      key: fontKey(fam, decls["font-style"] ?? "", decls["font-weight"] ?? "", decls["unicode-range"] ?? ""),
      descriptors,
      src,
      base: baseUrl,
    });
  }
}

async function collectFontFaces(doc, rootNode) {
  const sheets = [...Array.from(doc.styleSheets)];
  if (doc.adoptedStyleSheets) sheets.push(...doc.adoptedStyleSheets);
  if (rootNode && rootNode !== doc) {
    if (rootNode.styleSheets) sheets.push(...Array.from(rootNode.styleSheets));
    if (rootNode.adoptedStyleSheets) sheets.push(...rootNode.adoptedStyleSheets);
  }
  const sig = sheets.length + "|" + sheets.map((sh) => sh.href ?? sh.ownerNode?.textContent?.length ?? 0).join(",");
  if (sig === fontRulesKey) return fontRulesCache;
  const out = [];
  const pending = [];
  const walkSheet = (sheet, depth) => {
    const base = sheet.href ?? doc.baseURI;
    let rules;
    try { rules = sheet.cssRules; }
    catch {
      if (sheet.href) {
        const href = sheet.href;
        let job = sheetTextCache.get(href);
        if (!job) sheetTextCache.set(href, (job = fetchText(href)));
        pending.push(job.then((text) => { if (text) extractFontFaces(text, href, out); }));
      }
      return;
    }
    const scan = (list) => {
      for (let i = 0; i < list.length; i++) {
        const rule = list[i];
        if (rule.constructor.name === "CSSFontFaceRule" || rule.cssText.startsWith("@font-face")) {
          extractFontFaces(rule.cssText, base, out);
        } else if (rule.styleSheet && depth < 4) {
          walkSheet(rule.styleSheet, depth + 1);
        } else if (rule.cssRules && !rule.cssText.startsWith("@keyframes")) {
          try { scan(rule.cssRules); } catch { /* ignore */ }
        }
      }
    };
    scan(rules);
  };
  for (const sh of sheets) walkSheet(sh, 0);
  await Promise.all(pending);
  fontRulesCache = out;
  fontRulesKey = sig;
  return out;
}

function pickFontUrl(src, base) {
  const re = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)(?:\s*format\(\s*["']?([\w-]+)["']?\s*\))?/g;
  let fallback = null;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1] ?? m[2] ?? m[3] ?? "";
    let href = raw;
    if (!raw.startsWith("data:")) {
      try { href = new URL(raw, base).href; }
      catch { continue; }
    }
    const fmt = (m[4] ?? "").toLowerCase();
    if (fmt === "woff2" || /\.woff2(?:[?#]|$)/i.test(href)) return { url: href, format: "woff2" };
    fallback ??= { url: href, format: fmt };
  }
  return fallback;
}

async function inlineFonts(families, doc, rootNode) {
  if (!families.size || !doc.fonts) return "";
  const faces = await collectFontFaces(doc, rootNode);
  if (!faces.length) return "";
  const loaded = new Set();
  doc.fonts.forEach((f) => {
    if (f.status === "loaded") loaded.add(fontKey(f.family, f.style, f.weight, f.unicodeRange));
  });
  const used = faces.filter((f) => families.has(f.family) && (loaded.has(f.key) || !/url\(/i.test(f.src)));
  const pending = [];
  const mapped = used.map((f) => {
    if (!/url\(/i.test(f.src)) return { f, source: null };
    const picked = pickFontUrl(f.src, f.base);
    if (picked && !picked.url.startsWith("data:") && dataCache.get("u:" + picked.url) === undefined) {
      pending.push(queueFetch("u:" + picked.url, () => fetchDataUrl(picked.url)));
    }
    return { f, source: picked };
  });
  if (pending.length) await Promise.all(pending);
  let css = "";
  for (const { f, source } of mapped) {
    if (!source) { css += `@font-face{${f.descriptors}src:${f.src};}`; continue; }
    const data = source.url.startsWith("data:") ? source.url : dataCache.get("u:" + source.url);
    if (data) css += `@font-face{${f.descriptors}src:url("${data}")${source.format ? ` format("${source.format}")` : ""};}`;
  }
  return css;
}

const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
const escText = (s) => /[&<>\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/.test(s)
  ? s.replace(CTRL_RE, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  : s;
const escAttr = (s) => /[&<"\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/.test(s)
  ? s.replace(CTRL_RE, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
  : s;

function cachedOrMissing(ctx, key, loader) {
  const val = dataCache.get(key);
  if (val !== undefined) return val;
  if (!ctx.missing.has(key)) ctx.missing.set(key, loader);
  return null;
}

const CSS_URL_RE = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/g;
function rewriteCssUrls(val, ctx) {
  return val.replace(CSS_URL_RE, (full, a, b, c) => {
    const raw = a ?? b ?? c ?? "";
    if (!raw || raw.startsWith("data:") || raw.startsWith("#")) return full;
    let href;
    try { href = new URL(raw, ctx.doc.baseURI).href; }
    catch { return full; }
    const hashPos = href.indexOf("#");
    if (hashPos >= 0 && href.slice(0, hashPos) === ctx.win.location.href.split("#")[0]) {
      return `url("${href.slice(hashPos)}")`;
    }
    const data = cachedOrMissing(ctx, "u:" + href, () => fetchDataUrl(href));
    return data ? `url("${data}")` : "none";
  });
}

function recordFamilies(fontFamily, ctx) {
  for (const part of fontFamily.split(",")) ctx.families.add(normFamily(part));
}

function resolveImgSrc(img, ctx) {
  const src = img.currentSrc || img.src;
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  if (!img.complete || !img.naturalWidth) return null;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const tw = Math.max(img.clientWidth, 1) * ctx.o.scale;
  const th = Math.max(img.clientHeight, 1) * ctx.o.scale;
  const ratio = Math.min(1, Math.max(tw / nw, th / nh));
  if (ratio > 0.62 || nw * nh < 4e5 || /\.svg(?:[?#]|$)/i.test(src)) {
    return cachedOrMissing(ctx, "u:" + src, () => fetchDataUrl(src));
  }
  const rw = Math.max(1, Math.ceil((nw * ratio) / 16) * 16);
  const rh = Math.max(1, Math.round((rw * nh) / nw));
  return cachedOrMissing(ctx, `i:${src}|${rw}`, () => resizeImage(img, src, rw, rh, ctx.doc));
}

function captureMedia(el, doc) {
  try {
    if (el.tagName === "CANVAS") return el.width && el.height ? el.toDataURL() : null;
    if (!el.videoWidth || el.readyState < 2) return null;
    const c = doc.createElement("canvas");
    c.width = el.videoWidth;
    c.height = el.videoHeight;
    c.getContext("2d").drawImage(el, 0, 0);
    return c.toDataURL("image/jpeg", 0.92);
  } catch { return null; }
}

function serializeForce(map) {
  if (!map) return "";
  let s = "";
  for (const k in map) s += `${k}:${map[k]};`;
  return s;
}

function capturePseudo(el, pseudo, parentInh, ctx) {
  const cs = ctx.win.getComputedStyle(el, pseudo);
  const content = cs.getPropertyValue("content");
  if (!content || content === "none" || content === "normal" || content === "-moz-alt-content" || cs.getPropertyValue("display") === "none") return "";
  let css = "";
  let col = "";
  for (let i = 0; i < inhNames.length; i++) {
    const v = cs.getPropertyValue(inhNames[i]);
    if (i === colorIdx) col = v;
    if (v !== parentInh[i]) css += `${inhNames[i]}:${v};`;
  }
  const def = divDefaults.non;
  for (let i = 0; i < nonNames.length; i++) {
    let v = cs.getPropertyValue(nonNames[i]);
    if (v !== def[i] && !(isColorDefault[i] && v === col)) {
      if (v.indexOf("url(") >= 0) v = rewriteCssUrls(v, ctx);
      css += `${nonNames[i]}:${v};`;
    }
  }
  const cls = "dw" + ctx.classes++;
  ctx.rules.push(`.${cls}${pseudo}{${css}}`);
  return cls;
}

function serializeElement(el, parentInh, parentNs, scrollTransform, ctx) {
  if (el !== ctx.root && ctx.o.skip?.(el)) return;
  const ns = el.namespaceURI;
  const isSvg = ns === SVG_NS;
  if (!isSvg && ns !== XHTML_NS) return;
  let tag = el.localName;
  if ((!isSvg && IGNORED_TAGS.has(tag)) || !VALID_TAG.test(tag)) return;
  const cs = ctx.win.getComputedStyle(el);
  if (cs.getPropertyValue("display") === "none") return;
  ctx.nodes++;

  let attrs = "";
  let textVal = null;
  let emptyBody = false;
  if (!isSvg) {
    if (tag === "img") {
      const data = resolveImgSrc(el, ctx);
      if (data) attrs += ` src="${escAttr(data)}"`;
    } else if (tag === "canvas" || tag === "video") {
      const data = captureMedia(el, ctx.doc);
      tag = "img";
      if (data) attrs += ` src="${escAttr(data)}"`;
    } else if (tag === "iframe" || tag === "object" || tag === "embed" || tag === "audio") {
      tag = "div";
      emptyBody = true;
    } else if (tag === "textarea") {
      textVal = el.value;
    } else if (tag === "input") {
      if (el.type !== "file") attrs += ` value="${escAttr(el.value)}"`;
      if (el.checked) attrs += ' checked=""';
    } else if (tag === "option" && el.selected) {
      attrs += ' selected=""';
    }
  }

  const inputType = !isSvg && (tag === "input" || tag === "button") ? (el.getAttribute("type") ?? "").toLowerCase() : "";
  const ownDef = tagDefaults(tag, ns, inputType);
  const cmpDef = isSvg ? ownDef : divDefaults;
  const inhVals = new Array(inhNames.length);
  let styleStr = "";
  for (let i = 0; i < inhNames.length; i++) {
    const v = cs.getPropertyValue(inhNames[i]);
    inhVals[i] = v;
    if (parentInh === null || ownDef.inh[i] !== cmpDef.inh[i] || v !== parentInh[i]) {
      styleStr += `${inhNames[i]}:${v};`;
    }
  }
  const colorVal = inhVals[colorIdx];
  if (parentInh === null || inhVals[fontIdx] !== parentInh[fontIdx]) recordFamilies(inhVals[fontIdx], ctx);

  const noTransform = !scrollTransform
    && cs.getPropertyValue("transform") === "none"
    && (cs.getPropertyValue("translate") || "none") === "none"
    && (cs.getPropertyValue("rotate") || "none") === "none"
    && (cs.getPropertyValue("scale") || "none") === "none"
    && (cs.getPropertyValue("offset-path") || "none") === "none";

  let styledControl = false;
  if (!isSvg && appearIdx >= 0 && ownDef.non[appearIdx] !== "none") {
    for (let i = 0; i < appearanceTriggers.length; i++) {
      const idx = appearanceTriggers[i];
      if (cs.getPropertyValue(nonNames[idx]) !== ownDef.non[idx]) {
        styledControl = true;
        break;
      }
    }
  }

  for (let i = 0; i < nonNames.length; i++) {
    let v = cs.getPropertyValue(nonNames[i]);
    const defVal = cmpDef.non[i];
    const skippable = ownDef.non[i] === defVal && !(styledControl && appearanceSkips[i]);
    if (i === transformIdx && scrollTransform) {
      v = v === "none" ? scrollTransform : `${scrollTransform} ${v}`;
    } else if (
      skippable && (
        v === defVal
        || (isColorDefault[i] && v === colorVal)
        || (i === originIdx && noTransform)
        || (i === perspOriginIdx && cs.getPropertyValue("perspective") === "none")
      )
    ) {
      continue;
    }
    if (v.indexOf("url(") >= 0) v = rewriteCssUrls(v, ctx);
    styleStr += `${nonNames[i]}:${v};`;
  }
  styleStr += serializeForce(ctx.o.force?.(el));

  const beforeCls = capturePseudo(el, "::before", inhVals, ctx);
  const afterCls = capturePseudo(el, "::after", inhVals, ctx);

  if (isSvg) {
    for (let i = 0; i < el.attributes.length; i++) {
      const { name, value } = el.attributes[i];
      if (name === "style" || name === "class" || name === "xmlns" || name.startsWith("on") || name.startsWith("xmlns:") || !VALID_SVG_ATTR.test(name)) continue;
      let val = value;
      if ((name === "href" || name === "xlink:href") && val && !val.startsWith("#") && !val.startsWith("data:")) {
        let href;
        try { href = new URL(val, ctx.doc.baseURI).href; }
        catch { continue; }
        const data = cachedOrMissing(ctx, "u:" + href, () => fetchDataUrl(href));
        if (!data) continue;
        val = data;
      }
      attrs += ` ${name}="${escAttr(val)}"`;
    }
  } else {
    for (const name of KEEP_ATTRS["*"]) {
      const val = el.getAttribute(name);
      if (val !== null) attrs += ` ${name}="${escAttr(val)}"`;
    }
    const extra = KEEP_ATTRS[tag];
    if (extra) {
      for (const name of extra) {
        const val = el.getAttribute(name);
        if (val !== null) attrs += ` ${name}="${escAttr(val)}"`;
      }
    }
  }

  const cls = beforeCls && afterCls ? `${beforeCls} ${afterCls}` : beforeCls || afterCls;
  const open = `<${tag}${ns !== parentNs ? ` xmlns="${ns}"` : ""}${cls ? ` class="${cls}"` : ""} style="${escAttr(styleStr)}"${attrs}`;
  if (!isSvg && VOID_TAGS.has(tag)) {
    ctx.out.push(open + "/>");
    return;
  }
  ctx.out.push(open + ">");
  if (textVal !== null) {
    ctx.out.push(escText(textVal));
  } else if (!emptyBody) {
    const sl = el.scrollLeft, st = el.scrollTop;
    const childShift = sl || st ? `translate(${-sl}px,${-st}px)` : "";
    let children = el.shadowRoot ? el.shadowRoot.childNodes : el.childNodes;
    if (!isSvg && tag === "slot") {
      const assigned = el.assignedNodes({ flatten: true });
      if (assigned.length) children = assigned;
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === 1) serializeElement(child, inhVals, ns, childShift, ctx);
      else if (child.nodeType === 3) ctx.out.push(escText(child.data));
    }
  }
  ctx.out.push(`</${tag}>`);
}

function walkTree(root, opts, doc, win) {
  const ctx = { o: opts, root, doc, win, out: [], rules: [], classes: 0, nodes: 0, missing: new Map(), families: new Set() };
  serializeElement(root, null, XHTML_NS, "", ctx);
  return ctx;
}

const SVG_ENC = { "%": "%25", "#": "%23", "\n": "%0A", "\r": "%0D", "\t": "%09" };
function loadSvgImage(svgMarkup) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("distortion-waves: the snapshot would not load"));
    img.src = "data:image/svg+xml;charset=utf-8," + svgMarkup.replace(/[%#\n\r\t]/g, (ch) => SVG_ENC[ch]);
  });
}

function isTransparent(bg) {
  return !bg || bg === "transparent" || /(?:,|\/)\s*0(?:\.0+)?%?\s*\)$/.test(bg);
}

export function backgroundOf(el) {
  const win = el.ownerDocument?.defaultView ?? window;
  let cur = el.parentElement;
  while (cur) {
    const bg = win.getComputedStyle(cur).backgroundColor;
    if (!isTransparent(bg)) return bg;
    cur = cur.parentElement;
  }
  const own = win.getComputedStyle(el).backgroundColor;
  if (!isTransparent(own)) return own;
  return "#fff";
}

const isSafari = typeof navigator !== "undefined" && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg\//.test(navigator.userAgent);
const supportsZoom = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("zoom", "2") && !(typeof navigator !== "undefined" && /Firefox\//.test(navigator.userAgent));

export async function snapshot(root, opts) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!ensureProbe(doc)) throw new Error("distortion-waves: no document to read styles in");
  const t0 = performance.now();
  let ctx = walkTree(root, opts, doc, win);
  let walk = performance.now() - t0;
  if (ctx.missing.size) {
    await Promise.all(Array.from(ctx.missing, ([k, loader]) => queueFetch(k, loader)));
    const t1 = performance.now();
    ctx = walkTree(root, opts, doc, win);
    walk += performance.now() - t1;
  }
  const fontsCss = await inlineFonts(ctx.families, doc, root.getRootNode());
  const t2 = performance.now();
  const w = +opts.width.toFixed(3);
  const h = +opts.height.toFixed(3);
  const pxW = Math.max(1, Math.round(opts.width * opts.scale));
  const pxH = Math.max(1, Math.round(opts.height * opts.scale));
  const hasEmbedded = fontsCss.length > 0 || ctx.out.some((chunk) => chunk.indexOf("data:") >= 0);
  const inner = `<style>${escText(fontsCss + ctx.rules.join(""))}</style>` + ctx.out.join("");
  const svg = supportsZoom && opts.scale !== 1
    ? `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pxW}" height="${pxH}" viewBox="0 0 ${pxW} ${pxH}"><foreignObject x="0" y="0" width="${pxW}" height="${pxH}"><div xmlns="${XHTML_NS}" style="position:relative;width:${pxW}px;height:${pxH}px;overflow:hidden;"><div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;zoom:${+opts.scale.toFixed(4)};">${inner}</div></div></foreignObject></svg>`
    : `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="${XHTML_NS}" style="position:relative;width:${w}px;height:${h}px;overflow:hidden;">${inner}</div></foreignObject></svg>`;
  const img = await loadSvgImage(svg);
  try { await img.decode(); } catch { /* ignore */ }
  if (isSafari && hasEmbedded) await new Promise((r) => setTimeout(r, 60));
  const canvas = opts.into ?? doc.createElement("canvas");
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  const c2d = canvas.getContext("2d", { alpha: false });
  if (!c2d) throw new Error("distortion-waves: no 2D canvas");
  c2d.setTransform(1, 0, 0, 1, 0, 0);
  c2d.fillStyle = "#fff";
  c2d.fillRect(0, 0, pxW, pxH);
  c2d.fillStyle = opts.background;
  c2d.fillRect(0, 0, pxW, pxH);
  c2d.drawImage(img, 0, 0, pxW, pxH);
  return { canvas, walk, raster: performance.now() - t2, nodes: ctx.nodes, size: svg.length };
}

function invalidateFontCache() { fontRulesKey = ""; }

// ─── WaveController ───

const REF_AREA = 393 * 852;
const RETURN_EASE = bezierEase(0.22, 1, 0.36, 1);
const LINEAR = (x) => x;
const HANDOVER_SEC = 0.12;
const LENS_FADE_MS = 150;
const REDUCED_FADE_MS = 300;
const MAX_PIXELS = 9e6;
const RELEASE_IDLE_MS = 3e4;
const PRESS_WINDOW_MS = 2e3;
const SOURCE_SELECTOR = "button, a[href], [role=button], input, select, textarea, summary, label, [data-wave-source]";
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const px = (s) => parseFloat(s) || 0;
const customPalettes = new Map();

function resolvePalette(input, fallback) {
  if (!input) return fallback;
  if (typeof input !== "string") return input;
  if (input in PALETTES) return PALETTES[input];
  if (!/^#?[0-9a-f]{6}$/i.test(input)) return fallback;
  const key = input.replace("#", "").toLowerCase();
  let pal = customPalettes.get(key);
  if (!pal) {
    pal = singlePalette(hexToRgb(key));
    customPalettes.set(key, pal);
  }
  return pal;
}

function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

const SLOTS_ONE = ["content"];
const SLOTS_TWO = ["content", "revealed"];
const emptySlot = () => ({ canvas: null, ready: false, stale: true, busy: false, dirty: 0, cost: 0, last: 0, began: 0, broken: false, nodes: 0, size: 0, walk: 0, raster: 0, count: 0 });

function setLayerState(el, opacity, interactive) {
  el.style.opacity = opacity >= 1 ? "" : String(Math.max(opacity, 0));
  el.style.pointerEvents = interactive ? "" : "none";
  el.toggleAttribute("inert", !interactive);
  if (interactive) el.removeAttribute("aria-hidden");
  else el.setAttribute("aria-hidden", "true");
}

export class WaveController {
  constructor(root, content, revealed = null, env = null) {
    retainProbe();
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    this.env = {
      doc,
      win,
      raf: env?.requestAnimationFrame ?? ((cb) => win.requestAnimationFrame(cb)),
      caf: env?.cancelAnimationFrame ?? ((id) => win.cancelAnimationFrame(id)),
      setTimeout: env?.setTimeout ?? ((cb, ms) => win.setTimeout(cb, ms)),
      clearTimeout: env?.clearTimeout ?? ((id) => win.clearTimeout(id)),
      ResizeObserver: env?.ResizeObserver ?? win.ResizeObserver,
      matchMedia: env?.matchMedia ?? ((q) => win.matchMedia(q)),
      reduced: env?.reduced ?? null,
    };
    this.opts = {};
    this.first = true;
    this.destroyed = false;
    this.canvas = null;
    this.renderer = null;
    this.failed = false;
    this.positioned = false;
    this.geom = null;
    this.geomDirty = true;
    this.epoch = 0;
    this.style = defaultStyle("vertical");
    this.styleDirty = true;
    this.total = duration(this.style);
    this.particles = [];
    this.particlesKey = "";
    this.dots = { data: new Float32Array(0), count: 0 };
    this.front = newFront();
    this.probe = newFront();
    this.spot = { x: 0, y: 0, a: 0 };
    this.frame = { floor: 0, gain: 0, round: true, same: true };
    this.patch = null;
    this.primed = false;
    this.slots = { content: emptySlot(), revealed: emptySlot() };
    this.waiting = { content: false, revealed: false };
    this.p = 0;
    this.run = null;
    this.runAt = 0;
    this.raf = 0;
    this.scrubbing = false;
    this.fading = false;
    this.mode = null;
    this.lensAt = null;
    this.lastProp = undefined;
    this.shown = NaN;
    this.srcEl = null;
    this.srcCss = { x: 0, y: 0, w: 1, h: 1 };
    this.focusCss = null;
    this.src = { x: 0, y: 0, w: 1, h: 1 };
    this.focus = null;
    this.held = false;
    this.playOpts = null;
    this.launchAt = 0;
    this.clearAt = 1;
    this.press = null;
    this.pointerInside = false;
    this.focusInside = false;
    this.refreshTimer = 0;
    this.releaseTimer = 0;
    this.idleTimer = 0;
    this.fadeTimer = 0;
    this.abort = new AbortController();
    this.lastGain = 0;
    this.lastFloor = 0;
    this.lastDraw = 0;

    this.tick = (now) => {
      this.raf = 0;
      const run = this.run;
      if (!run) {
        if (this.scrubbing) this.paint(now);
        return;
      }
      if (run.t0 < 0) run.t0 = now;
      const t = run.dur > 0 ? (now - run.t0) / run.dur : 1;
      if (t >= 1) { this.finish(); return; }
      this.p = run.from + (run.to - run.from) * run.ease(t);
      this.paint(now);
      this.raf = this.env.raf(this.tick);
    };

    this.root = root;
    this.a = content;
    this.b = revealed;
    if (win.getComputedStyle(root).position === "static") {
      root.style.position = "relative";
      this.positioned = true;
    }
    this.still = typeof this.env.matchMedia === "function" ? this.env.matchMedia("(prefers-reduced-motion: reduce)") : null;
    this.observer = new MutationObserver((list) => this.onMutations(list));
    this.observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
    this.resizer = new this.env.ResizeObserver(() => this.onResize());
    this.resizer.observe(root);
    this.listen();
  }

  scheduleIdle(cb) {
    this.env.clearTimeout(this.idleTimer);
    this.idleTimer = this.env.setTimeout(cb, 24);
  }

  update(next) {
    if (this.destroyed) return;
    const prev = this.opts;
    this.opts = next;
    const isFirst = this.first;
    this.first = false;
    if (isFirst || prev.type !== next.type || prev.palette !== next.palette || !shallowEqual(prev.waveStyle, next.waveStyle)) {
      this.styleDirty = true;
    }
    if (isFirst || prev.scale !== next.scale || prev.resolution !== next.resolution || prev.cornerRadius !== next.cornerRadius) {
      this.geomDirty = true;
    }
    const rev = next.revealed;
    const changed = rev !== undefined && rev !== this.lastProp;
    if (rev !== undefined) this.lastProp = rev;

    if (next.scrub != null) { this.scrubTo(next.scrub); return; }
    if (this.scrubbing) {
      this.scrubbing = false;
      this.go((rev ?? this.p >= 0.5) ? 1 : 0);
      return;
    }
    if (isFirst) {
      this.p = rev ? 1 : 0;
      this.held = false;
      this.show(this.p);
      if (next.prewarm !== false) this.warm();
      return;
    }
    if (changed) { this.go(rev ? 1 : 0); return; }
    if ((this.styleDirty || this.geomDirty) && !this.run && this.p > 0 && this.p < 1) this.invalidate();
  }

  setRevealedLayer(el) {
    if (el === this.b) return;
    this.b = el;
    this.slots.revealed = emptySlot();
    this.renderer?.clearScreen("revealed");
    this.shown = NaN;
    if (!this.run && !this.scrubbing) this.show(this.p >= 1 ? 1 : 0);
  }

  play(opts) {
    if (this.destroyed) return;
    this.halt();
    this.scrubbing = false;
    this.p = 0;
    this.held = false;
    this.show(0);
    this.playOpts = opts ?? null;
    this.go(1);
  }

  reverse() {
    if (this.destroyed) return;
    this.scrubbing = false;
    this.go(0);
  }

  reset() {
    if (this.destroyed) return;
    this.halt();
    this.scrubbing = false;
    this.p = 0;
    this.held = false;
    this.mode = null;
    this.renderer?.clear();
    if (this.canvas) this.canvas.style.display = "none";
    this.show(0);
    this.rest();
  }

  async prepare() {
    if (this.destroyed || this.opts.capture === false || this.motionless() || !this.ensureRenderer()) return;
    this.flush();
    await Promise.all(this.needed().map((slot) => (this.fresh(slot) ? undefined : this.capture(slot))));
  }

  get debug() {
    const pick = (s) => ({ ready: s.ready, stale: s.stale, busy: s.busy, cost: s.cost, walk: s.walk, raster: s.raster, nodes: s.nodes, size: s.size, count: s.count });
    return {
      progress: this.p,
      running: !!this.run,
      mode: this.fading ? "fade" : this.mode,
      gain: this.lastGain,
      floor: this.lastFloor,
      draw: this.lastDraw,
      clearAt: this.clearAt,
      duration: this.total,
      geometry: this.geom,
      source: this.src,
      webgl: !!this.renderer && !this.renderer.lost,
      content: pick(this.slots.content),
      revealed: pick(this.slots.revealed),
    };
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.halt();
    this.env.clearTimeout(this.refreshTimer);
    this.env.clearTimeout(this.releaseTimer);
    this.env.clearTimeout(this.idleTimer);
    this.env.clearTimeout(this.fadeTimer);
    this.abort.abort();
    this.observer.disconnect();
    this.resizer.disconnect();
    this.dropRenderer();
    if (this.positioned) this.root.style.position = "";
    releaseProbe();
  }

  measure() {
    this.geomDirty = false;
    const el = this.root;
    const rect = el.getBoundingClientRect();
    const cs = this.env.win.getComputedStyle(el);
    const ow = el.offsetWidth;
    let anc = ow > 0 && rect.width > 0 ? rect.width / ow : 1;
    if (!(anc > 0) || Math.abs(anc - 1) < 0.01) anc = 1;
    const bl = px(cs.borderLeftWidth);
    const bt = px(cs.borderTopWidth);
    const br = px(cs.borderRightWidth);
    const bb = px(cs.borderBottomWidth);
    const bw = rect.width / anc;
    const bh = rect.height / anc;
    const w = Math.max(bw - bl - br, 1);
    const h = Math.max(bh - bt - bb, 1);
    const halfMin = Math.min(bw, bh) / 2;
    const corner = (val, border) => {
      const part = val.split(" ")[0];
      const num = parseFloat(part) || 0;
      return Math.max(Math.min(part.endsWith("%") ? (num / 100) * bw : num, halfMin) - border, 0);
    };
    const tl = corner(cs.borderTopLeftRadius, bl);
    const tr = corner(cs.borderTopRightRadius, br);
    const bRight = corner(cs.borderBottomRightRadius, br);
    const bLeft = corner(cs.borderBottomLeftRadius, bl);
    const optR = this.opts.cornerRadius;
    const radius = optR != null && optR >= 0 ? optR : Math.max(tl, tr, bRight, bLeft);
    const radii = optR != null && optR >= 0 && tl + tr + bRight + bLeft === 0 ? `${optR}px` : `${tl}px ${tr}px ${bRight}px ${bLeft}px`;
    const optScale = this.opts.scale ?? "auto";
    const k = typeof optScale === "number" && optScale > 0 ? optScale : clamp(Math.sqrt((w * h) / REF_AREA), 0.6, 2.2);
    const maxTex = this.renderer?.maxTextureSize || 4096;
    const baseRes = this.opts.resolution && this.opts.resolution > 0 ? this.opts.resolution : Math.min((this.env.win.devicePixelRatio || 1) * anc, 2);
    const bs = Math.min(baseRes, Math.sqrt(MAX_PIXELS / (w * h)), maxTex / w, maxTex / h);
    const W = Math.max(1, Math.round(w * bs));
    const H = Math.max(1, Math.round(h * bs));
    const prev = this.geom;
    const sizeChanged = !prev || prev.W !== W || prev.H !== H || prev.w !== w || prev.h !== h || prev.bl !== bl || prev.bt !== bt;
    const scaleChanged = !prev || prev.k !== k || prev.radius !== radius;
    this.geom = { w, h, bw, bh, bl, bt, anc, k, vw: w / k, vh: h / k, bs, W, H, radius, radii };
    const canvas = this.canvas;
    if (canvas) {
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      if (canvas.style.borderRadius !== radii) canvas.style.borderRadius = radii;
    }
    if (sizeChanged) {
      this.epoch++;
      this.slots.content.stale = true;
      this.slots.revealed.stale = true;
    }
    if ((sizeChanged || scaleChanged || this.styleDirty) && (this.restyle(), this.run || this.scrubbing)) {
      if (this.srcEl?.isConnected) {
        const sr = this.srcEl.getBoundingClientRect();
        if (sr.width > 0 && sr.height > 0) this.srcCss = this.local(sr);
      }
      this.retime();
    }
  }

  local(rect) {
    const g = this.geom;
    const r = this.root.getBoundingClientRect();
    return {
      x: (rect.left - r.left) / g.anc - g.bl,
      y: (rect.top - r.top) / g.anc - g.bt,
      w: rect.width / g.anc,
      h: rect.height / g.anc,
    };
  }

  restyle() {
    const g = this.geom;
    if (!g) return;
    this.styleDirty = false;
    const opts = this.opts;
    const st = defaultStyle(opts.type ?? "vertical");
    const over = opts.waveStyle;
    if (over) {
      for (const k in over) {
        const v = over[k];
        if (k !== "palette" && k !== "type" && k !== "cornerRadius" && typeof v === "number" && isFinite(v)) st[k] = v;
      }
    }
    st.palette = resolvePalette(opts.palette ?? over?.palette, st.palette);
    st.cornerRadius = g.radius / g.k;
    const rootK = Math.sqrt(g.k);
    st.hairlineWidth /= rootK;
    st.particleSize /= rootK;
    this.style = st;
    this.total = duration(st);
    const pKey = `${Math.round(st.particleCount)}|${st.particleSize}|${st.particleLife}`;
    if (pKey !== this.particlesKey) {
      this.particlesKey = pKey;
      this.particles = makeParticles(st);
      if (this.dots.data.length < this.particles.length * 3) {
        this.dots = { data: new Float32Array(this.particles.length * 3), count: 0 };
      }
    }
  }

  aim(target) {
    const opts = this.opts;
    const srcOpt = this.playOpts?.source ?? opts.source;
    if (target === 0 && this.held && srcOpt == null) return;
    const g = this.geom;
    const now = performance.now();
    const press = this.press && now - this.press.t < PRESS_WINDOW_MS ? this.press : null;
    let srcEl = null;
    let srcRect = null;
    if (srcOpt && typeof srcOpt.getBoundingClientRect === "function") srcEl = srcOpt;
    else if (srcOpt && "current" in srcOpt) srcEl = srcOpt.current;
    else if (srcOpt) srcRect = srcOpt;

    if (!srcEl && !srcRect) {
      if (press?.el?.isConnected) srcEl = press.el;
      else if (!press) {
        const rootNode = this.root.getRootNode();
        const active = (rootNode && "activeElement" in rootNode ? rootNode.activeElement : null) || this.env.doc.activeElement;
        if (active && active !== this.root && this.root.contains(active)) srcEl = active;
      }
    }
    if (srcEl) {
      const br = srcEl.getBoundingClientRect();
      if (br.width > 0 && br.height > 0) srcRect = this.local(br);
      else srcEl = null;
    }
    const type = opts.type ?? "vertical";
    const pressPt = press ? this.local({ left: press.x, top: press.y, width: 0, height: 0 }) : null;
    let focus = null;
    const focusOpt = this.playOpts && "focus" in this.playOpts ? this.playOpts.focus : opts.focus;
    if (focusOpt !== undefined) focus = focusOpt;
    else if (pressPt && (!srcEl || srcEl === press.el)) focus = { x: pressPt.x, y: pressPt.y };

    if (!srcRect) {
      const k = g.k;
      if (type === "center") {
        const pt = pressPt ?? { x: g.w / 2, y: g.h / 2 };
        srcRect = { x: pt.x - 29 * k, y: pt.y - 29 * k, w: 58 * k, h: 58 * k };
      } else if (type === "horizontal") {
        const h = Math.min(g.h * 0.5, 240 * k);
        srcRect = { x: -20 * k, y: (g.h - h) / 2, w: 40 * k, h };
      } else {
        const w = Math.min(g.w - 48 * k, 345 * k);
        srcRect = { x: (g.w - w) / 2, y: g.h - 82 * k, w, h: 58 * k };
      }
    }
    this.srcEl = srcEl;
    this.srcCss = srcRect;
    this.focusCss = focus;
  }

  retime() {
    const g = this.geom;
    const st = this.style;
    const k = g.k;
    const sc = this.srcCss;
    this.src = { x: sc.x / k, y: sc.y / k, w: sc.w / k, h: sc.h / k };
    this.focus = this.focusCss ? { x: this.focusCss.x / k, y: this.focusCss.y / k } : null;
    this.total = duration(st);
    this.launchAt = st.anticipation / this.total;
    const cleared = (p) => waveFront(p, this.src, g.vw, g.vh, st, this.focus, this.probe).hasCleared;
    if (!cleared(1)) { this.clearAt = 1; return; }
    let lo = this.launchAt, hi = 1;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (cleared(mid)) hi = mid;
      else lo = mid;
    }
    this.clearAt = hi;
  }

  motionless() {
    const mode = this.opts.reducedMotion ?? "system";
    if (mode === "always") return true;
    if (mode === "never") return false;
    if (this.env.reduced) return this.env.reduced();
    return !!this.still?.matches;
  }

  needed() { return this.b ? SLOTS_TWO : SLOTS_ONE; }
  fresh(slot) { const s = this.slots[slot]; return s.ready && !s.stale; }

  halt() {
    this.env.caf(this.raf);
    this.env.clearTimeout(this.fadeTimer);
    this.raf = 0;
    this.fadeTimer = 0;
    this.run = null;
    this.fading = false;
    this.playOpts = null;
  }

  go(target) {
    if (this.destroyed) return;
    this.env.clearTimeout(this.refreshTimer);
    this.env.clearTimeout(this.releaseTimer);
    this.env.clearTimeout(this.fadeTimer);
    this.fadeTimer = 0;
    this.flush();
    const atRest = !this.run && (this.p <= 0 || this.p >= 1);
    if (atRest && this.p === target) { this.playOpts = null; return; }
    this.env.caf(this.raf);
    this.raf = 0;
    if (this.motionless() || !this.ensureRenderer()) {
      this.renderer?.clear();
      if (this.canvas) this.canvas.style.display = "none";
      this.fading = true;
      this.mode = null;
      const dur = REDUCED_FADE_MS * Math.abs(target - this.p);
      this.run = { from: this.p, to: target, t0: -1, dur, ease: LINEAR };
      if (this.motionless()) {
        this.p = target;
        this.show(target);
        this.fadeTimer = this.env.setTimeout(() => {
          this.fadeTimer = 0;
          if (!this.destroyed && this.run) this.finish();
        }, Math.min(dur, 60));
      } else {
        this.raf = this.env.raf(this.tick);
      }
      return;
    }
    this.fading = false;
    this.measure();
    if (atRest || this.geomDirty) { this.aim(target); this.mode = null; }
    this.retime();
    this.playOpts = null;
    const dur = this.total;
    this.run = {
      from: this.p,
      to: target,
      t0: -1,
      dur: (target === 1 ? dur : dur / Math.max(this.style.returnSpeed, 0.05)) * 1000,
      ease: target === 1 ? LINEAR : RETURN_EASE,
    };
    if (atRest) {
      const doCap = this.opts.capture !== false;
      this.runAt = performance.now();
      let ready = doCap;
      for (const slot of this.needed()) {
        const isFresh = this.fresh(slot);
        this.waiting[slot] = doCap && !isFresh;
        if (!isFresh) {
          ready = false;
          if (doCap && !this.slots[slot].busy) this.capture(slot);
        }
      }
      this.lensAt = ready ? -Infinity : null;
    }
    this.canvas.style.display = "block";
    this.raf = this.env.raf(this.tick);
  }

  paint(now) {
    if (this.fading || !this.renderer || this.renderer.lost) {
      this.show(this.p);
      return;
    }
    const t0 = performance.now();
    this.draw(now);
    this.lastDraw = performance.now() - t0;
  }

  invalidate() {
    if (!this.raf && !this.destroyed) this.raf = this.env.raf(this.tick);
  }

  finish() {
    const to = this.run.to;
    this.run = null;
    this.p = to;
    this.fading = false;
    this.mode = null;
    this.lensAt = null;
    this.waiting.content = this.waiting.revealed = false;
    this.lastGain = this.lastFloor = 0;
    this.held = to === 1;
    if (this.renderer && !this.renderer.lost) this.renderer.clear();
    if (this.canvas) this.canvas.style.display = "none";
    this.show(to);
    this.rest();
    this.opts.onFinish?.(to === 1);
  }

  scrubTo(val) {
    const p = clamp(val, 0, 1);
    if (!this.scrubbing) {
      const atRest = !this.run && (this.p <= 0 || this.p >= 1);
      this.halt();
      this.scrubbing = true;
      this.env.clearTimeout(this.refreshTimer);
      this.env.clearTimeout(this.releaseTimer);
      this.flush();
      if (this.motionless() || !this.ensureRenderer()) {
        this.fading = true;
      } else {
        this.measure();
        if (atRest) { this.aim(1); this.mode = null; }
        this.retime();
        this.waiting.content = this.waiting.revealed = false;
        this.lensAt = -Infinity;
        if (this.opts.capture !== false) {
          for (const slot of this.needed()) {
            if (!this.fresh(slot) && !this.slots[slot].busy) this.capture(slot);
          }
        }
        this.canvas.style.display = "block";
      }
    }
    if (p !== this.p || this.shown !== this.shown || this.styleDirty || this.geomDirty) {
      this.p = p;
      this.invalidate();
    }
  }

  draw(now) {
    const ren = this.renderer;
    if (this.geomDirty) this.measure();
    else if (this.styleDirty) { this.restyle(); this.retime(); }
    const g = this.geom;
    const st = this.style;
    const p = this.p;
    if (p <= 0 || p >= 1) {
      ren.clear();
      this.lastGain = this.lastFloor = 0;
      this.show(p >= 1 ? 1 : 0);
      return;
    }
    const two = !!this.b;
    const front = waveFront(p, this.src, g.vw, g.vh, st, this.focus, this.front);
    const sc = this.slots.content;
    const sr = this.slots.revealed;
    const doCap = this.opts.capture !== false;
    const lensReady = doCap && sc.ready && !this.waiting.content && (!two || (sr.ready && !this.waiting.revealed));
    let gain = 0;
    if (lensReady) {
      if (this.lensAt === null) this.lensAt = now;
      gain = this.scrubbing || this.lensAt === -Infinity ? 1 : smooth(0, LENS_FADE_MS, now - this.lensAt);
    }
    let floor = 0;
    let same = true;
    let useLens = lensReady;
    const hand = HANDOVER_SEC / this.total;
    if (two) {
      if (!this.scrubbing && this.mode === null && p > this.launchAt && p < this.clearAt + hand) {
        this.mode = lensReady ? "lens" : "plain";
      }
      if (!this.scrubbing && this.mode !== null) useLens = this.mode === "lens";
      if (useLens) {
        same = false;
        if (p >= this.clearAt) {
          this.show(1);
          floor = 1 - smooth(this.clearAt, this.clearAt + hand, p);
        } else {
          this.show(0);
        }
      } else {
        gain = 0;
        this.show(front.hasCleared ? 1 : front.launched ? smooth(0.08, 0.7, front.moved) : 0);
      }
    }
    this.lastGain = gain;
    this.lastFloor = floor;
    ren.setSize(g.vw, g.vh);
    ren.setBlur(st.blur);
    const lumps = rimLumps(p * this.total, g.vw, g.vh, st.cornerRadius, st.rimPulse);
    const dots = this.dots;
    let count = 0;
    if (front.time > 0) {
      const src = this.src;
      const list = this.particles;
      const spot = this.spot;
      for (let i = 0; i < list.length; i++) {
        const pt = list[i];
        particleAt(pt, front, src, st, spot);
        if (spot.a <= 2e-3) continue;
        dots.data[count * 3] = spot.x;
        dots.data[count * 3 + 1] = spot.y;
        dots.data[count * 3 + 2] = Math.floor(pt.size * 10) + Math.min(spot.a, 0.999);
        count++;
      }
    }
    dots.count = count;
    const fr = this.frame;
    fr.floor = floor;
    fr.gain = gain;
    fr.same = same;
    if (lensReady) this.patchLive();
    ren.render(front, st, lumps, dots, fr);
    if (doCap) {
      this.chase(now, front, (gain > 0 && (front.energy > 0 || front.gravity > 0)) || floor > 0 || (two && useLens && front.launched && p < this.clearAt + hand));
    }
  }

  patchLive() {
    const ren = this.renderer;
    const g = this.geom;
    if (!ren || !g) return;
    const nodes = this.root.querySelectorAll("canvas[data-dw-live]");
    if (!nodes.length) return;
    let dirtyC = false, dirtyR = false;
    for (let i = 0; i < nodes.length; i++) {
      const c = nodes[i];
      const slot = this.a.contains(c) ? "content" : this.b && this.b.contains(c) ? "revealed" : null;
      if (!slot || !c.width || !c.height) continue;
      const base = this.slots[slot].canvas;
      if (!base || !ren.has(slot)) continue;
      const lr = this.local(c.getBoundingClientRect());
      const s = g.bs;
      const fx = lr.x * s, fy = lr.y * s;
      const x0 = Math.max(0, Math.floor(fx));
      const y0 = Math.max(0, Math.floor(fy));
      const x1 = Math.min(base.width, Math.ceil(fx + lr.w * s));
      const y1 = Math.min(base.height, Math.ceil(fy + lr.h * s));
      if (x1 <= x0 || y1 <= y0) continue;
      const pw = x1 - x0, ph = y1 - y0;
      if (!this.patch) this.patch = this.env.doc.createElement("canvas");
      if (this.patch.width !== pw || this.patch.height !== ph) { this.patch.width = pw; this.patch.height = ph; }
      const ctx = this.patch.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(base, x0, y0, pw, ph, 0, 0, pw, ph);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(c, 0, 0, c.width, c.height, fx - x0, fy - y0, lr.w * s, lr.h * s);
      ren.patchScreen(slot, this.patch, x0, y0);
      if (slot === "content") dirtyC = true;
      else dirtyR = true;
    }
    if (dirtyC) ren.reblur("content");
    if (dirtyR) ren.reblur("revealed");
  }

  chase(now, _front, active) {
    const live = this.opts.live ?? true;
    for (const slot of this.needed()) {
      const s = this.slots[slot];
      if (s.busy || s.broken) continue;
      if (this.waiting[slot] || !s.ready) { this.capture(slot); continue; }
      if (live === false || !active || this.scrubbing) {
        if (this.scrubbing && s.stale) this.capture(slot);
        continue;
      }
      if (now - s.last < Math.max(90, s.cost * 6)) continue;
      if (!s.stale && live === "animations" && this.animating(slot)) s.stale = true;
      if (s.stale) this.capture(slot);
    }
  }

  animating(slot) {
    const el = slot === "content" ? this.a : this.b;
    if (!el || typeof el.getAnimations !== "function") return false;
    return el.getAnimations({ subtree: true }).some((a) => a.playState === "running");
  }

  show(t) {
    if (t === this.shown) return;
    this.shown = t;
    const b = this.b;
    if (!b) setLayerState(this.a, 1, true);
    else {
      const revActive = t > 0.5;
      setLayerState(this.a, t >= 1 ? 0 : 1, !revActive);
      setLayerState(b, t, revActive);
    }
    this.flush();
  }

  ensureRenderer() {
    if (this.renderer) return this.renderer.lost ? null : this.renderer;
    if (this.failed || this.destroyed) return null;
    const canvas = this.env.doc.createElement("canvas");
    canvas.setAttribute("data-dw-skip", "");
    canvas.setAttribute("aria-hidden", "true");
    const st = canvas.style;
    st.position = "absolute";
    st.left = st.top = "0";
    st.width = st.height = "100%";
    st.pointerEvents = "none";
    st.zIndex = "1";
    st.display = "none";
    const ren = new WaveRenderer(canvas, { alpha: true });
    if (!ren.ok) { this.failed = true; return null; }
    const sig = { signal: this.abort.signal };
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.slots.content.ready = this.slots.revealed.ready = false;
      if (this.run) this.finish();
    }, sig);
    canvas.addEventListener("webglcontextrestored", () => {
      if (this.destroyed || this.canvas !== canvas) return;
      this.renderer = new WaveRenderer(canvas, { alpha: true });
      this.primed = false;
      this.slots.content.stale = this.slots.revealed.stale = true;
      this.scheduleRefresh(true);
    }, sig);
    this.root.appendChild(canvas);
    this.canvas = canvas;
    this.renderer = ren;
    this.primed = false;
    this.slots.content.ready = this.slots.revealed.ready = false;
    this.geomDirty = true;
    this.flush();
    return ren;
  }

  dropRenderer() {
    const ren = this.renderer;
    const canvas = this.canvas;
    this.renderer = null;
    this.canvas = null;
    for (const k of ["content", "revealed"]) {
      const s = this.slots[k];
      s.ready = false; s.stale = true; s.canvas = null;
    }
    if (ren?.ok) {
      ren.dispose();
      canvas?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    }
    canvas?.remove();
    if (!this.destroyed) this.flush();
  }

  async capture(slot) {
    const s = this.slots[slot];
    const target = slot === "content" ? this.a : this.b;
    const ren = this.renderer;
    if (s.busy || this.destroyed || !target || !ren || ren.lost) return;
    this.flush();
    if (this.geomDirty || !this.geom) this.measure();
    const g = this.geom;
    const root = this.root;
    const canvas = this.canvas;
    const other = slot === "content" ? this.b : this.a;
    const dirtyMark = s.dirty;
    const epoch = this.epoch;
    const began = performance.now();
    s.busy = true;
    s.began = began;
    let ok = false;
    try {
      const skip = (el) => el === canvas || el === other || el.hasAttribute("data-dw-skip") || el.hasAttribute("data-dw-live");
      const bg = backgroundOf(root);
      let img;
      const custom = this.opts.capture;
      if (typeof custom === "function") {
        img = await custom({ element: root, slot, width: g.w, height: g.h, scale: g.bs, background: bg, ignore: skip });
      } else {
        const rootForce = {
          "border-radius": "0", position: "absolute", left: `${-g.bl}px`, top: `${-g.bt}px`,
          right: "auto", bottom: "auto", margin: "0", transform: "none", translate: "none",
          rotate: "none", scale: "none", opacity: "1", visibility: "visible",
          width: `${g.bw}px`, height: `${g.bh}px`, "box-sizing": "border-box",
          "min-width": "0", "min-height": "0", "max-width": "none", "max-height": "none",
        };
        const layerForce = { opacity: "1", visibility: "visible" };
        const snap = await snapshot(root, {
          width: g.w, height: g.h, scale: g.bs, background: bg, skip,
          force: (el) => (el === root ? rootForce : el === target ? layerForce : undefined),
          into: s.canvas ?? undefined,
        });
        s.canvas = snap.canvas; s.walk = snap.walk; s.raster = snap.raster; s.nodes = snap.nodes; s.size = snap.size;
        img = snap.canvas;
      }
      if (this.destroyed || this.renderer !== ren || ren.lost || epoch !== this.epoch) return;
      ren.setScreen(img, g.vw, g.vh, this.style.blur, slot);
      s.ready = true;
      s.stale = s.dirty !== dirtyMark;
      s.broken = false;
      s.count++;
      ok = true;
    } catch {
      s.broken = true;
    } finally {
      s.busy = false;
      s.last = performance.now();
      s.cost = s.last - began;
    }
    if (this.destroyed) return;
    if (ok && (began >= this.runAt || !s.stale)) this.waiting[slot] = false;
    if (s.broken) this.waiting[slot] = false;
    if (this.scrubbing) this.invalidate();
    else if (!this.run) {
      if (ok) this.prime();
      this.scheduleRefresh();
    }
  }

  prime() {
    const ren = this.renderer;
    const g = this.geom;
    if (this.primed || !ren || ren.lost || !g) return;
    for (const k of this.needed()) if (!this.slots[k].ready) return;
    this.primed = true;
    const st = this.style;
    const sz = Math.min(g.vw, g.vh) / 4;
    const src = { x: (g.vw - sz) / 2, y: (g.vh - sz) / 2, w: sz, h: sz };
    const fr = waveFront((st.anticipation + st.travel * 0.1) / duration(st), src, g.vw, g.vh, st, null, this.probe);
    const dots = this.dots.data.length >= 3 ? this.dots : null;
    if (dots) { dots.data[0] = g.vw / 2; dots.data[1] = g.vh / 2; dots.data[2] = 10.5; dots.count = 1; }
    ren.setSize(g.vw, g.vh);
    ren.setBlur(st.blur);
    ren.prime(fr, st, rimLumps(0, g.vw, g.vh, st.cornerRadius, st.rimPulse), dots, { floor: 0, gain: 1, round: true, same: !this.b });
    if (dots) dots.count = 0;
  }

  warm() {
    if (this.opts.capture === false) return;
    this.scheduleIdle(() => {
      if (this.destroyed || this.run || this.scrubbing || this.motionless() || !this.ensureRenderer()) return;
      this.refresh();
      this.rest();
    });
  }

  refresh() {
    if (this.destroyed || this.run || this.scrubbing || this.opts.capture === false || !this.renderer || this.renderer.lost) return;
    this.flush();
    for (const slot of this.needed()) {
      const s = this.slots[slot];
      if (!this.fresh(slot) && !s.busy && !s.broken) this.capture(slot);
    }
  }

  scheduleRefresh(eager = false) {
    if (this.destroyed || this.run || this.scrubbing || this.opts.capture === false || !this.renderer || this.renderer.lost) return;
    if (!eager && !this.pointerInside && !this.focusInside) return;
    if (this.fresh("content") && (!this.b || this.fresh("revealed"))) return;
    this.env.clearTimeout(this.refreshTimer);
    const cost = Math.max(this.slots.content.cost, this.slots.revealed.cost);
    this.refreshTimer = this.env.setTimeout(() => this.scheduleIdle(() => this.refresh()), Math.max(140, cost * 8));
  }

  rest() {
    if (this.destroyed) return;
    this.scheduleRefresh();
    this.env.clearTimeout(this.releaseTimer);
    if (this.pointerInside || this.focusInside || !this.renderer) return;
    this.releaseTimer = this.env.setTimeout(() => {
      if (this.destroyed || this.run || this.scrubbing || this.pointerInside || this.focusInside) return;
      this.dropRenderer();
    }, RELEASE_IDLE_MS);
  }

  mark(node) {
    if (node && node !== this.root) {
      const el = node.nodeType === 1 ? node : node.parentElement;
      const skipped = el && typeof el.closest === "function" ? el.closest("[data-dw-skip],canvas[data-dw-live]") : null;
      if (skipped && this.root.contains(skipped)) return false;
    }
    const sc = this.slots.content;
    const sr = this.slots.revealed;
    const inA = !!node && this.a.contains(node);
    if (!(!inA && !!node && !!this.b && this.b.contains(node))) { sc.dirty++; sc.stale = true; sc.broken = false; }
    if (!inA) { sr.dirty++; sr.stale = true; sr.broken = false; }
    return true;
  }

  onMutations(records) {
    let changed = false;
    for (const rec of records) {
      const t = rec.target;
      if (t === this.canvas) continue;
      if (rec.type === "attributes") {
        if ((t === this.a || t === this.b) && (rec.attributeName === "style" || rec.attributeName === "inert" || rec.attributeName === "aria-hidden")) continue;
      } else if (rec.type === "childList" && t === this.root) {
        let onlySkip = true;
        for (const list of [rec.addedNodes, rec.removedNodes]) {
          for (let i = 0; i < list.length; i++) {
            const n = list[i];
            if (!(n.nodeType === 1 && n.hasAttribute("data-dw-skip"))) onlySkip = false;
          }
        }
        if (onlySkip) continue;
      }
      if (this.mark(t)) changed = true;
    }
    if (changed) this.scheduleRefresh();
  }

  flush() {
    const list = this.observer.takeRecords();
    if (list.length) this.onMutations(list);
  }

  onResize() {
    const prev = this.geom;
    this.geomDirty = true;
    if (prev) {
      if (this.scrubbing) this.invalidate();
      else if (!this.run) this.scheduleRefresh(true);
    }
  }

  listen() {
    const root = this.root;
    const passive = { signal: this.abort.signal, passive: true };
    const capture = { ...passive, capture: true };
    const onChange = (e) => { if (this.mark(e.target)) this.scheduleRefresh(); };
    root.addEventListener("pointerdown", (e) => {
      const target = e.target;
      const el = target && typeof target.closest === "function" ? target.closest(SOURCE_SELECTOR) : null;
      this.press = { el: el && root.contains(el) ? el : null, x: e.clientX, y: e.clientY, t: performance.now() };
    }, capture);
    root.addEventListener("pointerenter", () => {
      this.pointerInside = true;
      this.env.clearTimeout(this.releaseTimer);
      if (!this.renderer && !this.run && this.opts.capture !== false) this.warm();
      else this.scheduleRefresh();
    }, passive);
    root.addEventListener("pointerleave", () => {
      this.pointerInside = false;
      if (!this.run && !this.scrubbing) this.rest();
    }, passive);
    root.addEventListener("pointerover", onChange, passive);
    root.addEventListener("pointerout", onChange, passive);
    root.addEventListener("focusin", (e) => {
      this.focusInside = true;
      this.env.clearTimeout(this.releaseTimer);
      onChange(e);
    }, passive);
    root.addEventListener("focusout", (e) => {
      const next = e.relatedTarget;
      this.focusInside = !!next && root.contains(next);
      onChange(e);
      if (!this.focusInside && !this.run && !this.scrubbing) this.rest();
    }, passive);
    for (const ev of ["input", "change", "transitionend", "animationend"]) root.addEventListener(ev, onChange, passive);
    root.addEventListener("scroll", onChange, capture);
    root.addEventListener("load", (e) => { this.mark(e.target); this.scheduleRefresh(true); }, capture);
    this.env.doc.fonts?.addEventListener?.("loadingdone", () => {
      invalidateFontCache();
      this.mark(null);
      this.scheduleRefresh(true);
    }, passive);
  }
}
