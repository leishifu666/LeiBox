export const TRACK_WIDTH = 520;
export const TRACK_HEIGHT = 272;
export const KNOB_SIZE = 240;
export const INSET = 16;
export const TRAVEL = 248;
export const MARGIN = 72;
const RADIUS = 66;
const TURN = Math.PI * 2;
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const mix = (from, to, fraction) => from + (to - from) * fraction;
const wrap = (value, period) => ((value % period) + period) % period;
const parseColor = color => color.match(/../g).map(channel => parseInt(channel, 16));
const blend = (a, b, time) => a.map((channel, index) => Math.round(mix(channel, b[index], time)));
const rgba = (color, alpha = 1) => `rgba(${color.join(',')},${alpha})`;

const palette = {
  background: ['151516', 'd9d9d7'], halo: ['202138', 'f3e2c2'],
  focus: ['d6d6ff', '5d3609'],
  'track-top': ['040508', 'e2e0dc'], 'track-bottom': ['0b0c12', 'eeece8'],
  'track-inset': ['000000', 'b9b5ae'], 'track-light': ['191a22', 'ffffff'],
  'track-edge': ['1e1f27', 'ffffff'], 'track-shadow': ['000000', '9c978d'],
  'knob-top': ['9a9fbd', 'ffffff'], 'knob-bottom': ['4a4d63', 'f2efe9'],
  'knob-rim': ['ffffff', 'ffffff'], 'knob-shadow': ['000000', '8a8378'],
};
const alpha = { 'knob-top': [.5, .94], 'knob-bottom': [.42, .88], 'knob-rim': [.27, .62], 'knob-shadow': [.44, .35] };
const sceneColors = Object.entries(palette).map(([name, colors]) => ({ name, night: parseColor(colors[0]), day: parseColor(colors[1]) }));
const lightColors = [
  [[112, 110, 255], [224, 225, 255]],
  [[255, 205, 222], [255, 246, 248]],
  [[255, 168, 18], [255, 232, 150]],
];

function makeMoon() {
  const pixels = [];
  for (let row = -7; row <= 7; row++) {
    for (let col = -7; col <= 7; col++) {
      if (Math.hypot(col + .9, row + .7) > 6) continue;
      const cut = Math.hypot(col - 1.8, row + 2.7);
      if (cut > 4.6) pixels.push([col - .4, row, 1]);
      else if ((col + row) % 2 === 0 || cut > 3.6) pixels.push([col - .4, row, .12 + .4 * (1 - cut / 4.6)]);
    }
  }
  return pixels.concat([[5,-6,1], [4,-6,.7], [6,-6,.7], [5,-7,.7], [5,-5,.7], [3,-4,.35], [7,-3,.3], [2,-7,.3], [7,-7,.25]]);
}

function makeSun() {
  const pixels = [];
  for (let row = -4; row <= 3; row++) {
    for (let col = -4; col <= 3; col++) {
      if ((col + .5) ** 2 + (row + .5) ** 2 <= 17.2) pixels.push([col, row, 1]);
    }
  }
  for (let ray = 0; ray < 8; ray++) {
    const angle = ray * Math.PI / 4;
    const distances = ray % 2 ? [6.1, 7.2] : [6.7, 7.7, 8.7];
    distances.forEach((distance, index) => {
      pixels.push([Math.round(Math.cos(angle) * distance - .5), Math.round(Math.sin(angle) * distance - .5), ray % 2 && index ? .6 : .78]);
    });
  }
  return pixels;
}

const glyphs = [{ pixels: makeMoon(), size: 8.4, ratio: 1.18 }, { pixels: makeSun(), size: 7.2, ratio: 1 }];
const particleCount = Math.max(...glyphs.map(glyph => glyph.pixels.length)) + 20;

export function createPixelParticles() {
  let glyph = 0;
  const dots = Array.from({ length: particleCount }, () => {
    const angle = Math.random() * TURN;
    const distance = Math.sqrt(Math.random()) * 74;
    return { scatterX: Math.cos(angle) * distance, scatterY: Math.sin(angle) * distance * .85,
      x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, opacity: 0, targetOpacity: 0, phase: Math.random() * TURN };
  });

  function assign(index, immediate) {
    glyph = index;
    // Keep the same particles when switching glyphs, but vary which ones reach each pixel.
    const { pixels, size } = glyphs[index];
    const targets = [...pixels];
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }
    dots.forEach((dot, i) => {
      const target = targets[i];
      dot.tx = target ? target[0] * size : dot.scatterX;
      dot.ty = target ? target[1] * size : dot.scatterY;
      dot.targetOpacity = target?.[2] ?? 0;
      if (immediate) {
        dot.x = dot.tx;
        dot.y = dot.ty;
        dot.opacity = dot.targetOpacity;
        dot.vx = dot.vy = 0;
      }
    });
  }

  function burst(strength) {
    for (const dot of dots) {
      const angle = Math.random() * TURN;
      const speed = (60 + Math.random() * 200) * strength;
      dot.vx += Math.cos(angle) * speed;
      dot.vy += Math.sin(angle) * speed;
    }
  }

  function advance(theme, agitation, pointer, center, dt) {
    const nextGlyph = theme > .5 ? 1 : 0;
    if (nextGlyph !== glyph) assign(nextGlyph, false);
    const scatter = Math.max(agitation, clamp(1 - Math.abs(2 * theme - 1) * 1.6));
    let moving = false;
    for (const dot of dots) {
      dot.phase += dt * 2;
      const tx = mix(dot.tx, dot.scatterX, scatter) + Math.sin(dot.phase) * scatter * 6;
      const ty = mix(dot.ty, dot.scatterY, scatter) + Math.cos(dot.phase * .82) * scatter * 6;
      dot.vx += ((tx - dot.x) * 340 - dot.vx * 27) * dt;
      dot.vy += ((ty - dot.y) * 340 - dot.vy * 27) * dt;
      if (pointer) {
        const dx = dot.x - (pointer.x - center.x), dy = dot.y - (pointer.y - center.y);
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 49) {
          const force = (1 - (distance / 49) ** 2) * 2800 * dt / distance;
          dot.vx += dx * force;
          dot.vy += dy * force;
        }
      }
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
      const opacity = Math.max(dot.targetOpacity * (1 - scatter * .25), scatter * .55);
      dot.opacity = mix(dot.opacity, opacity, Math.min(1, dt * (opacity > dot.opacity ? 9 : 12)));
      moving ||= Math.abs(tx - dot.x) + Math.abs(ty - dot.y) > .15 ||
        Math.abs(dot.vx) + Math.abs(dot.vy) > .8 || Math.abs(opacity - dot.opacity) > .005;
    }
    return { scatter, moving };
  }

  function draw(ctx, center, theme, scatter) {
    const { size, ratio } = glyphs[glyph];
    const color = blend([255, 255, 255], [60, 56, 53], theme);
    ctx.shadowColor = '#e1e4ff';
    for (const dot of dots) {
      if (dot.opacity < .02) continue;
      const speed = clamp(Math.hypot(dot.vx, dot.vy) / 420);
      const height = size * .82 * (1 - speed * .35) * (1 - scatter * .35);
      const width = height * (1 + (ratio - 1) * (1 - speed) * (1 - scatter));
      ctx.shadowBlur = dot.targetOpacity > .9 ? Math.max(0, (1 - 2 * theme) * 6) : 0;
      ctx.fillStyle = rgba(color, dot.opacity * (1 - speed * .2));
      ctx.fillRect(center.x + dot.x - width / 2, center.y + dot.y - height / 2, width, height);
    }
  }

  return { assign, advance, draw, burst };
}

// Trace the same clockwise outline for the thin core, wider glow and inner rim.
// Sampling analytic segments avoids reading SVG geometry during animation.
function roundedOutline({ x, y, width, height }, radius) {
  const right = x + width, bottom = y + height, cx = x + width / 2, cy = y + height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const corner = Math.PI * r / 2;
  const horizontal = width - 2 * r, vertical = height - 2 * r;
  const perimeter = 2 * (horizontal + vertical) + 4 * corner;
  const quarter = horizontal / 2 + corner + vertical / 2;
  const opposite = horizontal + 2 * corner + vertical;
  const segments = [];
  let end = 0;
  const line = (sx, sy, tx, ty) => {
    const length = Math.hypot(tx - sx, ty - sy);
    if (length) {
      end += length;
      segments.push({ end, length, point: t => [mix(sx, tx, t), mix(sy, ty, t)] });
    }
  };
  const curve = (ox, oy, start) => {
    end += corner;
    segments.push({ end, length: corner, point: t => {
      const angle = start + t * Math.PI / 2;
      return [ox + Math.cos(angle) * r, oy + Math.sin(angle) * r];
    } });
  };
  line(cx, y, right - r, y);
  curve(right - r, y + r, -Math.PI / 2);
  line(right, y + r, right, bottom - r);
  curve(right - r, bottom - r, 0);
  line(right - r, bottom, x + r, bottom);
  curve(x + r, bottom - r, Math.PI / 2);
  line(x, bottom - r, x, y + r);
  curve(x + r, y + r, Math.PI);
  line(x + r, y, cx, y);
  const point = distance => {
    const at = wrap(distance, perimeter);
    const segment = segments.find(item => at <= item.end) ?? segments.at(-1);
    return segment.point(1 - (segment.end - at) / segment.length);
  };
  const phaseDistance = phase => {
    const turn = wrap(phase, 1) * 4;
    const side = Math.floor(turn);
    const sides = [opposite, quarter, 0, quarter + opposite, opposite];
    return mix(side === 2 ? perimeter : sides[side], sides[side + 1], turn - side);
  };
  return { point, phaseDistance, perimeter, center: { x: cx, y: cy } };
}

function sampleRibbon(outline, distance, length) {
  return Array.from({ length: 49 }, (_, i) => {
    const fraction = i / 48;
    const at = distance + (fraction - .5) * length;
    const [x, y] = outline.point(at);
    const [ax, ay] = outline.point(at - 1);
    const [bx, by] = outline.point(at + 1);
    const span = Math.hypot(bx - ax, by - ay) || 1;
    return { x, y, nx: (by - ay) / span, ny: (ax - bx) / span, taper: Math.sin(Math.PI * fraction) };
  });
}

function paintRibbon(ctx, samples, { width, exponent, offset = 0, color, opacity = 1, blur = 0 }) {
  const shape = new Path2D();
  const outline = (point, side) => {
    const spread = offset + side * width / 2 * point.taper ** exponent;
    return [point.x + point.nx * spread, point.y + point.ny * spread];
  };
  shape.moveTo(...outline(samples[0], 1));
  for (const sample of samples) shape.lineTo(...outline(sample, 1));
  for (let i = samples.length - 1; i >= 0; i--) shape.lineTo(...outline(samples[i], -1));
  shape.closePath();
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = rgba(color);
  if (blur && 'filter' in ctx) ctx.filter = `blur(${blur}px)`;
  else if (blur) {
    ctx.shadowBlur = blur * 2;
    ctx.shadowColor = ctx.fillStyle;
  }
  ctx.fill(shape);
  ctx.restore();
}

export function createPixelPainter(scene, knob, canvas, dpr) {
  const ctx = canvas.getContext('2d');
  canvas.width = Math.round((TRACK_WIDTH + 2 * MARGIN) * dpr);
  canvas.height = Math.round((TRACK_HEIGHT + 2 * MARGIN) * dpr);
  let previousTheme;

  return function paint(box, theme, phase, transit, dots, scatter) {
    if (theme !== previousTheme) {
      for (const { name, night, day } of sceneColors) {
        const opacity = alpha[name];
        scene.style.setProperty(`--${name}`, rgba(blend(night, day, theme), opacity ? mix(...opacity, theme) : 1));
      }
      previousTheme = theme;
    }
    Object.assign(knob.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, dpr * MARGIN, dpr * MARGIN);
    ctx.clearRect(-MARGIN, -MARGIN, TRACK_WIDTH + 2 * MARGIN, TRACK_HEIGHT + 2 * MARGIN);
    const padding = 13;
    const outside = roundedOutline({
      x: box.x - padding, y: box.y - padding, width: box.width + 2 * padding, height: box.height + 2 * padding,
    }, RADIUS + padding);
    const inside = roundedOutline(box, RADIUS);
    const arcFraction = mix(.31, .33, theme) * (1 - .12 * Math.sin(TURN * wrap(phase, .5)));
    const outer = sampleRibbon(outside, outside.phaseDistance(phase), outside.perimeter * arcFraction);
    const inner = sampleRibbon(inside, inside.phaseDistance(phase), inside.perimeter * arcFraction * 1.25);
    const family = theme < .5 ? 0 : 1;
    const [wash, core] = lightColors[family].map((color, index) => blend(color, lightColors[family + 1][index], theme * 2 - family));
    const bright = blend(core, [255, 255, 255], mix(.8, .04, theme));
    const body = blend(wash, core, .54);
    const night = theme < .55;
    ctx.globalCompositeOperation = night ? 'lighter' : 'source-over';
    paintRibbon(ctx, outer, { width: 64, exponent: .5, offset: 16, color: wash, blur: 25, opacity: mix(.86, .54, theme) });
    paintRibbon(ctx, outer, { width: 18, exponent: .6, offset: 4, color: wash, blur: 8, opacity: .74 });
    paintRibbon(ctx, outer, { width: 9, exponent: .75, color: body, blur: 2, opacity: .94 });
    paintRibbon(ctx, outer, { width: 5.6, exponent: .9, color: bright, blur: .5 });
    ctx.globalCompositeOperation = 'source-over';

    const clip = new Path2D();
    clip.roundRect(box.x, box.y, box.width, box.height, RADIUS);
    ctx.save();
    ctx.clip(clip);
    const edge = inner[24];
    const depth = KNOB_SIZE * mix(.57, .7, theme) * (1 + transit * .3);
    ctx.save();
    ctx.translate(edge.x, edge.y);
    ctx.rotate(Math.atan2(edge.nx, -edge.ny));
    ctx.scale(KNOB_SIZE * .84, depth * .62);
    const oriented = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    oriented.addColorStop(0, rgba(bright, mix(.91, .84, theme)));
    oriented.addColorStop(.23, rgba(wash, mix(.9, .52, theme)));
    oriented.addColorStop(.56, rgba(wash, mix(.46, .23, theme)));
    oriented.addColorStop(1, rgba(wash, 0));
    ctx.fillStyle = oriented;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
    paintRibbon(ctx, inner, { width: 22, exponent: .5, color: night ? bright : body, blur: 8, opacity: .76 - transit * .35 });
    paintRibbon(ctx, inner, { width: 8, exponent: .6, color: bright, blur: 2, opacity: .92 });
    dots.draw(ctx, inside.center, theme, scatter);
    ctx.restore();
  };
}

export function knobGeometry(position, stretch) {
  let width = KNOB_SIZE * (1 + Math.max(-.08, stretch));
  let x = INSET + position * TRAVEL - (width - KNOB_SIZE) / 2;
  if (x < INSET) {
    width -= INSET - x;
    x = INSET;
  }
  const right = TRACK_WIDTH - INSET;
  x = Math.min(x, right - KNOB_SIZE * .86);
  width = clamp(width, KNOB_SIZE * .86, right - x);
  const height = KNOB_SIZE * (1 - (width / KNOB_SIZE - 1) * .45);
  return { x, y: (TRACK_HEIGHT - height) / 2, width, height };
}
