/* Supplied HTML adaptation. Design reference: @kshvbgde.
   No separate source license was supplied or verified. */
export function createAccountBurn(scope, initial = {}) {
  const { document, window, on, requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout } = scope;
  const stage = document.getElementById('stage');
  const reduced = () => scope.reduced();
  let options = {...initial};
  let inTick = false;
  let destroyed = false, raf = null, holdTimer = null, activePointer = null, focusAfter = false;
  const gpu = {shaders:[], programs:[], textures:[], framebuffers:[], buffers:[], vaos:[]};
  const holdDuration = () => Number.isFinite(options.holdDuration) ? Math.max(.3, options.holdDuration) : 2.2;
  function wake() {
    if (!destroyed && !inTick && raf === null && !document.hidden && !reduced()) {
      lastTs = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }


// ---------- DOM References ----------
const screenDelete = document.getElementById('screen-delete');
const screenSignin = document.getElementById('screen-signin');
const holdBtnWrap = document.getElementById('hold-btn-wrap');
const holdBtn = document.getElementById('hold-btn');
const holdBtnFill = document.getElementById('hold-btn-fill');
const holdBtnCooldown = document.getElementById('hold-btn-cooldown');
const holdBtnSpark = document.getElementById('hold-btn-spark');
const holdBtnRing = document.getElementById('hold-btn-ring');
const continueBtn = document.getElementById('continue-btn');
const restoreBtn = document.getElementById('restore-btn');
const signinForm = document.getElementById('signin-form');
const emailInput = document.getElementById('email-input');
const signinFeedback = document.getElementById('signin-feedback');
const burnCanvas = document.getElementById('burn-canvas');
const burnCtx = burnCanvas.getContext('2d');
const glCanvas = document.createElement('canvas');
const bloomCanvas = document.getElementById('bloom-canvas');
const bloomCtx = bloomCanvas.getContext('2d');
const particlesCanvas = document.getElementById('particles-canvas');
const pCtx = particlesCanvas.getContext('2d');

// ---------- Shared Deterministic Noise (Exact Sync Between WebGL2 & Sign-In Clip-Path) ----------
function fract(x) { return x - Math.floor(x); }
function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm4JS(x, y) {
  let v = 0.0, a = 0.5, px = x, py = y;
  for (let i = 0; i < 4; i++) {
    v += a * vnoise(px, py);
    const nx = px * 1.94 - py * 0.49 + 11.3;
    const ny = px * 0.49 + py * 1.94 + 7.1;
    px = nx; py = ny;
    a *= 0.5;
  }
  return v;
}

function burnEdgeDistJS(dx, dy, radius, time) {
  const npX = dx * 1.45 + time * 0.035;
  const npY = dy * 1.45 - time * 0.055;
  const nLobe = fbm4JS(npX * 1.35 + 2.1, npY * 1.35 + 1.3);
  const nTear = fbm4JS(npX * 3.9 - time * 0.08, npY * 3.9 + 4.7);
  const nJag  = fbm4JS(dx * 10.5 + 5.2, dy * 10.5 - time * 0.12);
  const ovalFactor = Math.max(0, 1.0 - radius * 1.65);
  const rx = 1.0 + ovalFactor * 0.36;
  const ry = 1.0 - ovalFactor * 0.24;
  const baseR = radius * Math.hypot(dx * rx, dy * ry);
  const scale = Math.min(1.0, radius * 2.5);
  const distort = ((nLobe - 0.5) * 0.22 + (nTear - 0.5) * 0.095 + (nJag - 0.5) * 0.034) * scale;
  return Math.max(0, baseR + distort);
}

// ---------- WebGL2 Context Setup ----------
const gl = glCanvas.getContext('webgl2', {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true
});
const hasFloatFBO = gl ? !!gl.getExtension('EXT_color_buffer_float') : false;
if (gl) gl.getExtension('OES_texture_float_linear');
if (!gl || !hasFloatFBO) {
  screenSignin.style.background = '#000000';
}

const VERT_300 = `#version 300 es
  in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const GLSL_NOISE_300 = `
  float sq(float x) { return x * x; }
  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
      mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm4(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = vec2(p.x * 1.94 - p.y * 0.49 + 11.3, p.x * 0.49 + p.y * 1.94 + 7.1);
      a *= 0.5;
    }
    return v;
  }
  float voronoiCrack(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float md = 8.0, md2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vec2(hash2(n + g), hash2(n + g + vec2(17.3, 41.9)));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < md) { md2 = md; md = d; }
        else if (d < md2) { md2 = d; }
      }
    }
    return sqrt(md2) - sqrt(md);
  }
  float computeEdgeRadius(vec2 dir, vec2 p, float u_radius, float u_time) {
    vec2 np = dir * 1.45 + vec2(u_time * 0.035, -u_time * 0.055);
    float nLobe = fbm4(np * 1.35 + vec2(2.1, 1.3));
    float nTear = fbm4(np * 3.9 + vec2(-u_time * 0.08, 4.7));
    float nJag  = fbm4(dir * 10.5 + vec2(5.2, -u_time * 0.12));
    float nMicro = fbm4(p * 28.0 + vec2(u_time * 0.05, -u_time * 0.10));

    float ovalFactor = clamp(1.0 - u_radius * 1.65, 0.0, 1.0);
    vec2 scaledDir = vec2(dir.x * (1.0 + ovalFactor * 0.36), dir.y * (1.0 - ovalFactor * 0.24));
    float baseR = u_radius * length(scaledDir);
    float scale = min(1.0, u_radius * 2.5);
    float distort = ((nLobe - 0.5) * 0.22 + (nTear - 0.5) * 0.095 + (nJag - 0.5) * 0.034 + (nMicro - 0.5) * 0.020) * scale;
    return max(0.0, baseR + distort);
  }
`;

// 1) Semi-Lagrangian Advection
const ADVECT_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_vel;
  uniform sampler2D u_src;
  uniform vec2 u_texel;
  uniform float u_dt;
  uniform float u_dissipation;
  void main() {
    vec2 vel = texture(u_vel, v_uv).xy;
    vec2 coord = v_uv - u_dt * vel * u_texel;
    fragColor = texture(u_src, clamp(coord, vec2(0.001), vec2(0.999))) * u_dissipation;
  }
`;

// 2) Curl
const CURL_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_vel;
  uniform vec2 u_texel;
  void main() {
    float L = texture(u_vel, v_uv - vec2(u_texel.x, 0.0)).y;
    float R = texture(u_vel, v_uv + vec2(u_texel.x, 0.0)).y;
    float T = texture(u_vel, v_uv + vec2(0.0, u_texel.y)).x;
    float B = texture(u_vel, v_uv - vec2(0.0, u_texel.y)).x;
    fragColor = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
  }
`;

// 3) Vorticity Confinement + Buoyancy + Crisp Flame Pillars
const FORCES_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_vel;
  uniform sampler2D u_curl;
  uniform sampler2D u_dye;
  uniform vec2 u_texel;
  uniform vec2 u_center;
  uniform float u_aspect;
  uniform float u_dt;
  uniform float u_time;
  uniform float u_charge;
  uniform float u_radius;
  uniform float u_mode;
  ${GLSL_NOISE_300}
  void main() {
    vec2 vel = texture(u_vel, v_uv).xy;
    float L = abs(texture(u_curl, v_uv - vec2(u_texel.x, 0.0)).x);
    float R = abs(texture(u_curl, v_uv + vec2(u_texel.x, 0.0)).x);
    float T = abs(texture(u_curl, v_uv + vec2(0.0, u_texel.y)).x);
    float B = abs(texture(u_curl, v_uv - vec2(0.0, u_texel.y)).x);
    float C = texture(u_curl, v_uv).x;
    vec2 grad = vec2(T - B, R - L);
    grad /= (length(grad) + 1e-4);
    grad *= vec2(1.0, -1.0);
    vel += grad * C * 22.0 * u_dt;

    vec4 dye = texture(u_dye, v_uv);
    // Controlled upward buoyancy so candle flame & bottom tongues stay sculpted near the rim
    vel.y += min(dye.r, 1.8) * 34.0 * u_dt;
    vel.y += dye.g * 5.0 * u_dt;

    vec2 p = (v_uv - u_center) * vec2(u_aspect, 1.0);
    float nA = fbm4(p * 3.8 + vec2(u_time * 0.24, -u_time * 0.38));
    float nB = fbm4(p * 3.8 + vec2(-u_time * 0.20 + 5.1, u_time * 0.16));
    vec2 turb = vec2(nA - 0.5, nB - 0.5) * 15.0;

    
    if (u_charge > 0.62 && u_mode < 0.5) {
      float c = smoothstep(0.62, 1.0, u_charge);
      float jetMask = exp(-sq(p.x * 16.0)) * exp(-sq((p.y - 0.025) * 16.0));
      vel += vec2((nA - 0.5) * 24.0, 128.0 + 35.0 * nB) * jetMask * c * u_dt;
    }

    // Active burn rim: strong vertical flame pillars shooting UPWARD from the bottom arc into the black void!
    if (u_radius > 0.005 && ((u_mode > 0.5 && u_mode < 1.5) || u_mode > 2.5)) {
      float dist = length(p);
      vec2 dir = dist > 0.0001 ? p / dist : vec2(1.0, 0.0);
      float edgeR = computeEdgeRadius(dir, p, u_radius, u_time);
      float sd = dist - edgeR;
      float rim = exp(-sq(sd / 0.032));
      float bottomWeight = (1.0 - smoothstep(-0.85, 0.05, dir.y));
      float upJet = 14.0 + 48.0 * bottomWeight;
      vel += (vec2(0.0, upJet) + turb * 2.2) * rim * u_dt;
    }

    vel += turb * (dye.g * 0.85) * u_dt;
    fragColor = vec4(vel, 0.0, 1.0);
  }
`;

// 4) Divergence
const DIV_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_vel;
  uniform vec2 u_texel;
  void main() {
    float L = texture(u_vel, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_vel, v_uv + vec2(u_texel.x, 0.0)).x;
    float T = texture(u_vel, v_uv + vec2(0.0, u_texel.y)).y;
    float B = texture(u_vel, v_uv - vec2(0.0, u_texel.y)).y;
    fragColor = vec4(0.5 * ((R - L) + (T - B)), 0.0, 0.0, 1.0);
  }
`;

// 5) Pressure Jacobi
const PRESSURE_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_pressure;
  uniform sampler2D u_div;
  uniform vec2 u_texel;
  void main() {
    float L = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
    float T = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
    float B = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
    float div = texture(u_div, v_uv).x;
    fragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
  }
`;

// 6) Pressure Gradient Subtract
const GRAD_SUB_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_pressure;
  uniform sampler2D u_vel;
  uniform vec2 u_texel;
  void main() {
    float L = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
    float T = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
    float B = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
    vec2 vel = texture(u_vel, v_uv).xy;
    vel -= 0.5 * vec2(R - L, T - B);
    fragColor = vec4(vel, 0.0, 1.0);
  }
`;

// 7) Dye Injection (R = Fire Heat, G = Silky White-Screen Smoke)
const DYE_INJECT_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_dye;
  uniform vec2 u_center;
  uniform float u_aspect;
  uniform float u_dt;
  uniform float u_time;
  uniform float u_charge;
  uniform float u_radius;
  uniform float u_flare;
  uniform float u_mode;
  uniform float u_postSmoke;
  ${GLSL_NOISE_300}
  void main() {
    vec4 dye = texture(u_dye, v_uv);
    vec2 p = (v_uv - u_center) * vec2(u_aspect, 1.0);
    float n = fbm4(p * 6.5 + vec2(u_time * 0.35, -u_time * 0.85));

    // 1) Continuous tapered candle flame rising from top-center of Hold button (smoothly crossfades during ignition — ZERO pop!)
    float nozzlePower = (u_mode < 0.5) ? smoothstep(0.58, 1.0, u_charge) : u_flare;
    if (nozzlePower > 0.002) {
      float nozzle = exp(-sq(p.x * 18.0)) * exp(-sq((p.y - 0.02) * 22.0)) * pow(nozzlePower, 1.2);
      dye.r += nozzle * (0.75 + 0.45 * n) * 5.2 * u_dt * 3.6;
    }

    // 3) Asymmetric Active Burn Front:
    
    //    - Top arc stays tight & clean (blue-indigo rim + crisp black soot dots, NO giant purple fog!)
    if (u_radius > 0.0005 && ((u_mode > 0.5 && u_mode < 1.5) || u_mode > 2.5)) {
      float dist = length(p);
      vec2 dir = dist > 0.0001 ? p / dist : vec2(1.0, 0.0);
      float edgeR = computeEdgeRadius(dir, p, u_radius, u_time);
      float sd = dist - edgeR;
      float edgeFade = smoothstep(0.0, 0.055, u_radius) * (1.0 - smoothstep(1.35, 1.85, u_radius));
      float rim = exp(-sq((sd + 0.003) / 0.024)) * edgeFade;

      
      float pillarPattern = smoothstep(0.34, 0.74, fbm4(vec2(p.x * 10.5 + u_time * 0.18, p.y * 2.8 - u_time * 1.05)));
      float bottomWeight = (1.0 - smoothstep(-0.75, 0.22, dir.y));
      float injectStrength = mix(0.28, 1.95 * (0.35 + 1.25 * pillarPattern), bottomWeight);
      if (u_mode > 2.5) {
        injectStrength *= mix(1.0, 1.55, bottomWeight);
      }

      dye.r += rim * injectStrength * (0.55 + 0.65 * n) * u_dt * 4.4;
      dye.g += rim * (0.22 + 0.45 * n) * u_dt * (u_mode > 2.5 ? 2.0 : 0.45);

      // Damp fire deep in the center (sd < -0.14) so Sign in / Email / Continue stay crystal-clear while bottom tongues lick ~16% inward!
      float deepInterior = (1.0 - smoothstep(-0.22, -0.11, sd));
      dye.r *= (1.0 - deepInterior * min(1.0, u_dt * 14.0));
    }

    
    if (u_postSmoke > 0.01 && u_mode < 0.5) {
      float wispSrc = exp(-sq(p.x * 11.0)) * exp(-sq((p.y + 0.045) * 14.0)) * u_postSmoke;
      dye.g += wispSrc * (0.5 + 0.8 * n) * u_dt * 2.6;
    }

    // Fast crisp cooling so flames stay tight & sculpted around the burn rim
    dye.r = max(0.0, dye.r - u_dt * 4.4);
    dye.g = max(0.0, dye.g - u_dt * 0.28);
    dye = clamp(dye, 0.0, 2.6);
    fragColor = dye;
  }
`;

// 8) HDR Fire Extraction — High-Contrast Luminous Pastel-Peach (on white) & Hot-Pink/White Pillars (on dark)
const BLOOM_EXTRACT_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_dye;
  uniform vec2 u_res;
  uniform vec2 u_center;
  uniform float u_time;
  uniform float u_radius;
  uniform float u_mode;
  uniform float u_charge;
  ${GLSL_NOISE_300}
  void main() {
    vec4 dye = texture(u_dye, v_uv);
    float heat = dye.r;

    float aspect = u_res.x / max(u_res.y, 1.0);
    vec2 p = (v_uv - u_center) * vec2(aspect, 1.0);
    float dist = length(p);
    vec2 dir = dist > 0.0001 ? p / dist : vec2(1.0, 0.0);

    float insideHole = 0.0;
    float rimBoost = 0.0;
    if (u_radius > 0.0005 && ((u_mode > 0.5 && u_mode < 1.5) || u_mode > 2.5)) {
      float edgeR = computeEdgeRadius(dir, p, u_radius, u_time);
      float sd = dist - edgeR;
      float startRamp = smoothstep(0.0, 0.055, u_radius);
      float edgeFade = startRamp * (1.0 - smoothstep(1.35, 1.85, u_radius));
      insideHole = (1.0 - smoothstep(-0.015, 0.015, sd)) * startRamp;
      // Smoothly fade in center-masking as hole widens (0.06..0.22) so rising candle flame NEVER gets chopped!
      float rimZone = smoothstep(-0.12, -0.015, sd) * (1.0 - smoothstep(0.02, 0.14, sd));
      float maskBlend = smoothstep(0.06, 0.22, u_radius);
      heat *= mix(1.0, rimZone, maskBlend);
      // Smooth luminous fire lip modulated by noise
      float lipNoise = 0.45 + 0.85 * fbm4(p * 7.5 + vec2(u_time * 0.2, -u_time * 0.6));
      rimBoost = exp(-sq((sd + 0.003) / 0.012)) * edgeFade * lipNoise * 0.85;
    }

    if (u_mode > 1.5 && u_mode < 2.5) {
      rimBoost = 0.0;
    }

    float totalH = heat + rimBoost;

    // Over WHITE page: ethereal pastel peach-apricot tip -> soft blush pink -> pure blinding white (NO dark purple!)
    vec3 wOut  = vec3(1.02, 0.78, 0.70);
    vec3 wMid  = vec3(1.12, 0.80, 0.92);
    vec3 wCore = vec3(2.40, 2.38, 2.42);

    
    vec3 dOut  = vec3(0.95, 0.24, 0.52);
    vec3 dMid  = vec3(1.35, 0.58, 0.82);
    vec3 dCore = vec3(2.50, 2.45, 2.52);

    vec3 cOut  = mix(wOut,  dOut,  insideHole);
    vec3 cMid  = mix(wMid,  dMid,  insideHole);
    vec3 cCore = mix(wCore, dCore, insideHole);

    vec3 col = mix(vec3(0.0), cOut,  smoothstep(0.08, 0.34, totalH));
    col      = mix(col,       cMid,  smoothstep(0.28, 0.68, totalH));
    col      = mix(col,       cCore, smoothstep(0.58, 1.15, totalH));

    float a = clamp(smoothstep(0.08, 0.62, totalH), 0.0, 1.0);
    fragColor = vec4(col * a, a);
  }
`;

// 9) Kawase Blur
const KAWASE_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_tex;
  uniform vec2 u_texel;
  uniform float u_offset;
  void main() {
    vec2 d = u_texel * u_offset;
    vec4 s = texture(u_tex, v_uv) * 4.0;
    s += texture(u_tex, v_uv + vec2(-d.x, -d.y));
    s += texture(u_tex, v_uv + vec2( d.x, -d.y));
    s += texture(u_tex, v_uv + vec2(-d.x,  d.y));
    s += texture(u_tex, v_uv + vec2( d.x,  d.y));
    fragColor = s / 8.0;
  }
`;

// 10) Tight, Sculpted Foreground HDR Bloom Composite (NO muddy fog!)
const BLOOM_COMPOSITE_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_hdr0;
  uniform sampler2D u_hdr1;
  uniform sampler2D u_hdr2;
  uniform sampler2D u_hdr3;
  uniform sampler2D u_dye;
  uniform float u_mode;
  void main() {
    vec4 b0 = texture(u_hdr0, v_uv);
    vec4 b1 = texture(u_hdr1, v_uv);
    vec4 b2 = texture(u_hdr2, v_uv);
    vec4 b3 = texture(u_hdr3, v_uv);

    // Creamy volumetric HDR fire bloom: crisp white cores with silky coral-pink/magenta halo
    vec3 hdr = b0.rgb * 0.78 + b1.rgb * 0.34 + b2.rgb * 0.15 + b3.rgb * 0.05;
    float lum = max(hdr.r, max(hdr.g, hdr.b));

    vec3 mapped = hdr / (1.0 + hdr * 0.32);
    float alpha = clamp(smoothstep(0.05, 0.85, lum * 0.96), 0.0, 0.96);

    fragColor = vec4(mapped * alpha, alpha);
  }
`;

// 11) Base Layer Composite: Silky Smoke + Crisp Charred Paper Outline + Electric Blue-Indigo Top Inner Halo + Voronoi Cracks + Black Void
const BASE_COMPOSITE_FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_dye;
  uniform vec2 u_res;
  uniform vec2 u_center;
  uniform float u_time;
  uniform float u_radius;
  uniform float u_mode;
  ${GLSL_NOISE_300}
  void main() {
    float aspect = u_res.x / max(u_res.y, 1.0);
    vec2 p = (v_uv - u_center) * vec2(aspect, 1.0);
    float dist = length(p);
    vec2 dir = dist > 0.0001 ? p / dist : vec2(1.0, 0.0);

    vec4 dye = texture(u_dye, v_uv);
    vec3 col = vec3(0.0);
    float alpha = 0.0;

    
    if (u_mode < 0.5 || u_mode > 2.5) {
      float s = smoothstep(0.02, 0.85, dye.g);
      float smokeA = clamp(s * 0.34, 0.0, 0.38);
      col = vec3(0.76, 0.76, 0.78);
      alpha = smokeA;
    }

    
    if (u_mode > 1.5 && u_mode < 2.5) {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // 3) Synchronized Torn-Paper Burn Edge + Cracks + Black Void
    if (u_radius > 0.002 && ((u_mode > 0.5 && u_mode < 1.5) || u_mode > 2.5)) {
      float isRev = u_mode > 2.5 ? 1.0 : 0.0;
      float edgeR = computeEdgeRadius(dir, p, u_radius, u_time);
      float sd = dist - edgeR;
      float edgeFade = (1.0 - smoothstep(1.35, 1.85, u_radius)) * smoothstep(0.0, 0.025, u_radius);
      float nFine = fbm4(p * 18.0 + vec2(u_time * 0.06, -u_time * 0.14));

      
      
      float revTopSide = mix(0.45, 1.15, smoothstep(-0.6, 0.5, dir.y));
      float scorchSpan = mix(0.016, 0.155 * revTopSide, isRev);
      float scorchMask = (1.0 - smoothstep(0.002, scorchSpan, sd)) * smoothstep(-0.005, 0.004, sd) * edgeFade;
      float scorchStreak = mix(0.9 + 0.2 * nFine, 0.45 + 0.85 * fbm4(vec2(p.x * 7.0, p.y * 2.5 - u_time * 0.35)), isRev);
      float scorchA = clamp(scorchMask * scorchStreak * mix(0.96, 1.12, isRev), 0.0, 0.96);

      vec3 toastLight = vec3(0.84, 0.60, 0.30);
      vec3 toastMid   = vec3(0.44, 0.22, 0.07);
      vec3 toastDark  = vec3(0.11, 0.05, 0.02);
      float st = clamp(sd / max(scorchSpan, 0.001), 0.0, 1.0);
      vec3 scorchCol = mix(toastDark, mix(toastMid, toastLight, smoothstep(0.25, 0.85, st)), smoothstep(0.0, 0.75, st));

      // Razor-sharp glowing combustion hairline
      float hairline = exp(-sq((sd - 0.001) / 0.0055)) * edgeFade;
      vec3 hairlineCol = mix(vec3(1.0, 0.60, 0.22), vec3(1.0, 0.98, 0.95), clamp(hairline * 1.4, 0.0, 1.0));

      // Ultra-fine, subtle dark-orange/crimson charcoal ember cracks ONLY in a narrow charred strip (never a neon grid!)
      float vEdge = voronoiCrack(p * 42.0 + vec2(0.0, -u_time * 0.03));
      float crack = (1.0 - smoothstep(0.0, 0.06, vEdge)) * smoothstep(0.32, 0.72, nFine);
      float crackBand = smoothstep(-0.052, -0.012, sd) * (1.0 - smoothstep(-0.008, 0.002, sd)) * edgeFade;
      vec3 crackCol = mix(vec3(0.65, 0.14, 0.22), vec3(0.95, 0.46, 0.14), nFine) * crack * crackBand * 0.62;

      // Pure black void + moody midnight-indigo inner rim (matches frame_6.0!)
      float holeMask = (1.0 - smoothstep(-0.004, 0.004, sd)) * smoothstep(0.0, 0.032, u_radius);
      float blueIndigo = exp(-sq((sd + 0.022) / 0.034)) * (1.0 - smoothstep(-0.010, 0.005, sd)) * edgeFade;
      vec3 haloTint = mix(vec3(0.24, 0.06, 0.38), vec3(0.10, 0.10, 0.44), smoothstep(-0.2, 0.7, dir.y));

      vec3 innerCol = vec3(0.0);
      innerCol += haloTint * blueIndigo * (0.72 + 0.35 * dye.r);
      innerCol += crackCol;

      float burnAlpha = clamp(max(holeMask, max(scorchA, hairline * 0.96)), 0.0, 1.0);
      vec3 burnCol = mix(scorchCol, innerCol, holeMask);
      burnCol += hairlineCol * hairline * 0.92;

      col = mix(col, burnCol, burnAlpha);
      alpha = max(alpha, burnAlpha);
    }

    fragColor = vec4(col * alpha, alpha);
  }
`;

// ---------- WebGL2 Pipeline Setup ----------
let programs = {};
let fbos = {};
let quadVAO = null;

function compileProg(fragSrc, uniformList) {
  function compile(type, src) {
    const s = gl.createShader(type);
  gpu.shaders.push(s);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('GLSL Error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT_300);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gpu.programs.push(p);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Link Error:', gl.getProgramInfoLog(p));
    return null;
  }
  const u = {};
  for (let i = 0; i < uniformList.length; i++) {
    u[uniformList[i]] = gl.getUniformLocation(p, uniformList[i]);
  }
  return { program: p, u };
}

function createFBO(w, h) {
  const tex = gl.createTexture();
  gpu.textures.push(tex);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);

  const fb = gl.createFramebuffer();
  gpu.framebuffers.push(fb);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

function createDoubleFBO(w, h) {
  let a = createFBO(w, h);
  let b = createFBO(w, h);
  return {
    w, h,
    get read() { return a; },
    get write() { return b; },
    swap() { const tmp = a; a = b; b = tmp; }
  };
}

function initFluidEngine() {
  if (!gl || !hasFloatFBO) return false;
  quadVAO = gl.createVertexArray();
  gpu.vaos.push(quadVAO);
  gl.bindVertexArray(quadVAO);
  const buf = gl.createBuffer();
  gpu.buffers.push(buf);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  programs = {
    advect: compileProg(ADVECT_FRAG, ['u_vel', 'u_src', 'u_texel', 'u_dt', 'u_dissipation']),
    curl: compileProg(CURL_FRAG, ['u_vel', 'u_texel']),
    forces: compileProg(FORCES_FRAG, ['u_vel', 'u_curl', 'u_dye', 'u_texel', 'u_center', 'u_aspect', 'u_dt', 'u_time', 'u_charge', 'u_radius', 'u_mode']),
    div: compileProg(DIV_FRAG, ['u_vel', 'u_texel']),
    pressure: compileProg(PRESSURE_FRAG, ['u_pressure', 'u_div', 'u_texel']),
    gradSub: compileProg(GRAD_SUB_FRAG, ['u_pressure', 'u_vel', 'u_texel']),
    dyeInject: compileProg(DYE_INJECT_FRAG, ['u_dye', 'u_center', 'u_aspect', 'u_dt', 'u_time', 'u_charge', 'u_radius', 'u_flare', 'u_mode', 'u_postSmoke']),
    bloomExtract: compileProg(BLOOM_EXTRACT_FRAG, ['u_dye', 'u_res', 'u_center', 'u_time', 'u_radius', 'u_mode', 'u_charge']),
    kawase: compileProg(KAWASE_FRAG, ['u_tex', 'u_texel', 'u_offset']),
    bloomComp: compileProg(BLOOM_COMPOSITE_FRAG, ['u_hdr0', 'u_hdr1', 'u_hdr2', 'u_hdr3', 'u_dye', 'u_mode']),
    baseComp: compileProg(BASE_COMPOSITE_FRAG, ['u_dye', 'u_res', 'u_center', 'u_time', 'u_radius', 'u_mode'])
  };

  const SIM = 256;
  fbos = {
    vel: createDoubleFBO(SIM, SIM),
    dye: createDoubleFBO(SIM, SIM),
    curl: createFBO(SIM, SIM),
    div: createFBO(SIM, SIM),
    pressure: createDoubleFBO(SIM, SIM),
    hdr0: createFBO(256, 256),
    hdr1: createFBO(128, 128),
    hdr2: createFBO(64, 64),
    hdr3: createFBO(32, 32)
  };
  return Object.values(programs).every(Boolean);
}

let fluidReady = initFluidEngine();

function bindTex(unit, tex) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
}

function drawTo(target) {
  if (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    gl.viewport(0, 0, target.w, target.h);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, burnCanvas.width, burnCanvas.height);
  }
  gl.bindVertexArray(quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}


let mode = 'delete'; // 'delete' | 'burning' | 'signin' | 'restoring'
let isHolding = false;
let holdProgress = 0;   // 0..1 over 2.2s
let burnClock = 0;
let signinClock = 0;    
let cooldownGlow = 0;   
let burnRadius = 0;
let postSmoke = 0.0;
let flareAmount = 0;
let elapsedTime = 0;
let lastTs = performance.now();



const BURN_TOTAL = 4.7;
const RESTORE_STORM_DELAY = 1.25;
const RESTORE_TOTAL = 4.7;

let width = stage.clientWidth || 720;
let height = stage.clientHeight || 540;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let burnCenterPx = { x: width * 0.5, y: height * 0.54 };
let continueRect = { left: 0, right: 0, top: 0, bottom: 0 };

function updateLayoutRects() {
  const rect = scope.rect(holdBtn);
  if (rect.width > 0 && rect.height > 0) {
    burnCenterPx.x = rect.left + rect.width * 0.5;
    burnCenterPx.y = rect.top + rect.height * 0.5;
  } else {
    burnCenterPx.x = width * 0.5;
    burnCenterPx.y = height * 0.54;
  }
  const cRect = scope.rect(continueBtn);
  if (cRect.width > 0) continueRect = cRect;
}

function resize() {
  width = stage.clientWidth || 720;
  height = stage.clientHeight || 540;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  const rw = Math.round(width * dpr);
  const rh = Math.round(height * dpr);

  burnCanvas.width = rw;
  burnCanvas.height = rh;
  glCanvas.width = rw;
  glCanvas.height = rh;
  bloomCanvas.width = rw;
  bloomCanvas.height = rh;
  particlesCanvas.width = rw;
  particlesCanvas.height = rh;
  pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  updateLayoutRects();
}


function updateSigninClip(radiusNorm, maxR) {
  if (radiusNorm <= 0.002) {
    screenSignin.style.clipPath = 'circle(0px at 50% 50%)';
    return;
  }
  if (radiusNorm >= (maxR || 1.8) * 0.96) {
    screenSignin.style.clipPath = 'none';
    return;
  }
  const segments = 96;
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const dx = Math.cos(theta);
    const dy = Math.sin(theta);
    const edgeR = Math.max(0, burnEdgeDistJS(dx, dy, radiusNorm, elapsedTime) - 0.008);
    const px = burnCenterPx.x + dx * edgeR * height;
    const py = burnCenterPx.y - dy * edgeR * height;
    pts.push(`${px.toFixed(1)}px ${py.toFixed(1)}px`);
  }
  screenSignin.style.clipPath = `polygon(${pts.join(',')})`;
}


const particles = [];
const MAX_PARTICLES = 780;

function createJaggedScrap(sides, radius) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.52;
    const r = radius * (0.42 + Math.random() * 0.78);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

function spawnParticle(x, y, type, vxBias, vyBias) {
  if (particles.length >= MAX_PARTICLES) return;
  const a = Math.random() * Math.PI * 2;
  const bx = vxBias || 0;
  const by = vyBias || 0;

  if (type === 'scrap') {
    const size = 1.8 + Math.random() * 4.2;
    particles.push({
      type: 'scrap',
      x, y,
      vx: bx + (Math.random() - 0.5) * 44 + Math.cos(a) * 18,
      vy: by - 24 - Math.random() * 76,
      size,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 4.8,
      tilt: Math.random() * Math.PI * 2,
      vtilt: (Math.random() - 0.5) * 5.6,
      life: 0,
      maxLife: 1.4 + Math.random() * 2.4,
      glowing: Math.random() < 0.7,
      hollow: Math.random() < 0.45,
      shape: createJaggedScrap(6, size)
    });
  } else if (type === 'soot') {
    const size = 0.7 + Math.random() * 1.8;
    particles.push({
      type: 'soot',
      x, y,
      vx: bx + (Math.random() - 0.5) * 62,
      vy: by - 42 - Math.random() * 108,
      size,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 6.0,
      tilt: Math.random() * Math.PI,
      vtilt: (Math.random() - 0.5) * 5.0,
      life: 0,
      maxLife: 0.9 + Math.random() * 1.8,
      shape: createJaggedScrap(4, size)
    });
  } else if (type === 'spark') {
    const size = 0.7 + Math.random() * 1.8;
    particles.push({
      type: 'spark',
      x, y,
      vx: bx + (Math.random() - 0.5) * 64 + Math.cos(a) * 24,
      vy: by - 42 - Math.random() * 110,
      size,
      rot: 0, vrot: 0, tilt: 0, vtilt: 0,
      life: 0,
      maxLife: 0.7 + Math.random() * 1.6,
      whiteHot: Math.random() < 0.38,
      shape: null
    });
  } else {
    
    const size = 1.0 + Math.random() * 2.8;
    const warm = Math.random() < 0.22;
    particles.push({
      type: 'residual',
      x: x !== null ? x : Math.random() * width,
      y: y !== null ? y : Math.random() * height,
      vx: (Math.random() - 0.5) * 16,
      vy: -10 - Math.random() * 24,
      size,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 2.0,
      tilt: Math.random() * Math.PI * 2,
      vtilt: (Math.random() - 0.5) * 2.5,
      life: 0,
      maxLife: 1.8 + Math.random() * 1.8,
      warm,
      shape: createJaggedScrap(5, size)
    });
  }
}

function emitAlongBurnRing(count, radiusNorm, isReverse) {
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const dx = Math.cos(theta);
    const dy = Math.sin(theta);
    const edgeR = burnEdgeDistJS(dx, dy, radiusNorm, elapsedTime);
    const jitter = (Math.random() - 0.45) * 0.04;
    const rPx = (edgeR + jitter) * height;
    const px = burnCenterPx.x + dx * rPx;
    const py = burnCenterPx.y - dy * rPx;
    if (px < -40 || px > width + 40 || py < -40 || py > height + 40) continue;

    
    const isTopArc = dy > 0.15;
    const r = Math.random();
    if (isTopArc && r < 0.72) {
      spawnParticle(px, py, 'soot', dx * 22, -48);
    } else if (r < 0.80) {
      spawnParticle(px, py, 'scrap', isReverse ? -dx * 22 : dx * 16, -16);
    } else {
      spawnParticle(px, py, 'spark', isReverse ? -dx * 28 : dx * 22, -32);
    }
  }
}

function isOverContinueBtn(x, y) {
  return (
    continueRect.width > 0 &&
    x >= continueRect.left + 4 &&
    x <= continueRect.right - 4 &&
    y >= continueRect.top + 2 &&
    y <= continueRect.bottom - 2
  );
}

function updateAndDrawParticles(dt) {
  pCtx.clearRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    const t = p.life / p.maxLife;
    const curlX = Math.sin(elapsedTime * 2.1 + p.y * 0.015 + p.x * 0.005) * 26;
    const curlY = Math.cos(elapsedTime * 1.6 + p.x * 0.012) * 10;
    p.x += (p.vx + curlX) * dt;
    p.y += (p.vy + curlY) * dt;
    p.vx *= (1 - dt * 0.55);
    p.rot += p.vrot * dt;
    p.tilt += p.vtilt * dt;

    const alphaEnv = Math.min(1, t * 5.5) * Math.pow(1.0 - t, 1.3);
    if (alphaEnv <= 0.01) continue;

    if (p.type === 'scrap') {
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot);
      const sy = 0.24 + 0.76 * Math.abs(Math.cos(p.tilt));
      pCtx.scale(1, sy);

      const pts = p.shape;
      pCtx.beginPath();
      pCtx.moveTo(pts[0].x, pts[0].y);
      for (let j = 1; j < pts.length; j++) pCtx.lineTo(pts[j].x, pts[j].y);
      pCtx.closePath();

      if (p.hollow && p.glowing && t < 0.75) {
        pCtx.fillStyle = `rgba(36, 20, 14, ${alphaEnv * 0.75})`;
        pCtx.fill();
        pCtx.strokeStyle = `rgba(255, 192, 88, ${alphaEnv * (1 - t * 0.6)})`;
        pCtx.lineWidth = 1.6;
        pCtx.stroke();
        pCtx.beginPath();
        pCtx.arc(0, 0, p.size * 0.34, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255, 240, 200, ${alphaEnv * (1 - t) * 0.85})`;
        pCtx.fill();
      } else {
        pCtx.fillStyle = `rgba(18, 13, 12, ${alphaEnv * 0.94})`;
        pCtx.fill();
        if (p.glowing && t < 0.78) {
          const eg = (1.0 - t / 0.78) * alphaEnv;
          pCtx.strokeStyle = `rgba(255, 165, 58, ${eg * 0.98})`;
          pCtx.lineWidth = 1.3;
          pCtx.stroke();
        }
      }
      pCtx.restore();
    } else if (p.type === 'soot') {
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot);
      const sy = 0.3 + 0.7 * Math.abs(Math.cos(p.tilt));
      pCtx.scale(1, sy);
      const pts = p.shape;
      pCtx.beginPath();
      pCtx.moveTo(pts[0].x, pts[0].y);
      for (let j = 1; j < pts.length; j++) pCtx.lineTo(pts[j].x, pts[j].y);
      pCtx.closePath();
      pCtx.fillStyle = `rgba(16, 12, 11, ${alphaEnv * 0.92})`;
      pCtx.fill();
      pCtx.restore();
    } else if (p.type === 'spark') {
      const glowR = p.size * 2.6;
      const grad = pCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      if (p.whiteHot) {
        grad.addColorStop(0, `rgba(255, 254, 245, ${alphaEnv})`);
        grad.addColorStop(0.38, `rgba(255, 212, 125, ${alphaEnv * 0.88})`);
        grad.addColorStop(1, 'rgba(255, 110, 30, 0)');
      } else {
        grad.addColorStop(0, `rgba(255, 228, 138, ${alphaEnv})`);
        grad.addColorStop(0.45, `rgba(255, 132, 34, ${alphaEnv * 0.82})`);
        grad.addColorStop(1, 'rgba(220, 48, 15, 0)');
      }
      pCtx.fillStyle = grad;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      pCtx.fill();
    } else if (p.type === 'residual') {
      const a = alphaEnv * (p.warm ? 0.85 : 0.62);
      if (a <= 0.01) continue;
      const overWhiteBtn = mode === 'signin' && isOverContinueBtn(p.x, p.y);
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.rot);
      const sy = 0.28 + 0.72 * Math.abs(Math.cos(p.tilt));
      pCtx.scale(1, sy);

      if (p.warm && !overWhiteBtn) {
        const grad = pCtx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.4);
        grad.addColorStop(0, `rgba(255, 226, 178, ${a})`);
        grad.addColorStop(0.45, `rgba(232, 138, 72, ${a * 0.6})`);
        grad.addColorStop(1, 'rgba(180, 68, 28, 0)');
        pCtx.fillStyle = grad;
        pCtx.beginPath();
        pCtx.arc(0, 0, p.size * 2.4, 0, Math.PI * 2);
        pCtx.fill();
      } else {
        const pts = p.shape;
        pCtx.beginPath();
        pCtx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length; j++) pCtx.lineTo(pts[j].x, pts[j].y);
        pCtx.closePath();
        pCtx.fillStyle = overWhiteBtn
          ? `rgba(42, 42, 46, ${a * 0.92})`
          : `rgba(202, 202, 210, ${a})`;
        pCtx.fill();
      }
      pCtx.restore();
    }
  }
}

// ---------- Hold Button UI ----------
function updateHoldButtonUI() {
  const pct = Math.max(0, Math.min(1, holdProgress));
  holdBtnFill.style.clipPath = `inset(0 ${((1 - pct) * 100).toFixed(2)}% 0 0)`;
  holdBtnCooldown.style.opacity = cooldownGlow.toFixed(3);

  if (pct > 0.005) {
    const btnW = holdBtn.offsetWidth || 174;
    holdBtnSpark.style.opacity = Math.min(1, pct * 3.5).toFixed(2);
    holdBtnSpark.style.transform = `translateX(${(pct * btnW - 6).toFixed(1)}px)`;

    const rimStrength = Math.max(0, (pct - 0.50) / 0.50);
    holdBtnRing.style.opacity = (rimStrength * 0.95).toFixed(2);

    if (rimStrength > 0.01) {
      const g = rimStrength * rimStrength;
      holdBtn.style.boxShadow = `
        0 0 ${4 + g * 14}px rgba(255, 130, 50, ${(g * 0.52).toFixed(2)}),
        0 0 ${12 + g * 28}px rgba(215, 110, 195, ${(g * 0.35).toFixed(2)})
      `;
    } else {
      holdBtn.style.boxShadow = '';
    }

    if (pct > 0.70 && isHolding) {
      const shake = (pct - 0.70) * 2.0;
      holdBtn.style.transform = `scale(0.986) translate(${((Math.random() - 0.5) * shake).toFixed(2)}px, ${((Math.random() - 0.5) * shake).toFixed(2)}px)`;
    } else if (isHolding) {
      holdBtn.style.transform = 'scale(0.986)';
    } else {
      holdBtn.style.transform = '';
    }
  } else {
    holdBtnSpark.style.opacity = '0';
    holdBtnRing.style.opacity = '0';
    holdBtn.style.boxShadow = '';
    holdBtn.style.transform = '';
  }
}

// ---------- State Transitions ----------
function startForwardBurn() {
  isHolding = false;
  holdBtn.classList.remove('is-holding');
  mode = 'burning';
  clearTimeout(holdTimer);
  activePointer = null;
  syncScreens();
  burnClock = 0;
  burnRadius = 0;
  flareAmount = 1.0;
  postSmoke = 0;
  cooldownGlow = 0;
  screenSignin.classList.remove('is-active');
  screenSignin.classList.add('is-burning');
  screenSignin.style.clipPath = 'circle(0px at 50% 50%)';
  // Interaction remains inert until the reveal has completed.
  signinFeedback.textContent = '';
  signinFeedback.classList.remove('visible');

  if (reduced()) { finishForwardBurn(); paintStill(); } else wake();
}

function finishForwardBurn() {
  mode = 'signin';
  syncScreens();
  options.onStateChange?.('signin');
  burnClock = 0;
  signinClock = 0;
  holdProgress = 0;
  holdBtnWrap.classList.remove('is-ignited');
  updateHoldButtonUI();
  screenSignin.classList.remove('is-burning');
  screenSignin.classList.add('is-active');
  screenSignin.style.clipPath = 'none';
  screenDelete.setAttribute('aria-hidden', 'true');
  updateLayoutRects();

  if (focusAfter) { emailInput.focus({preventScroll:true}); focusAfter=false; }
}

function startRestoreBurn() {
  if (mode !== 'signin') return;
  mode = 'restoring';
  syncScreens();
  burnClock = 0;
  postSmoke = 0;
  signinFeedback.textContent = '';
  signinFeedback.classList.remove('visible');
  screenSignin.classList.remove('is-active');
  screenSignin.classList.add('is-burning');
  // Interaction remains inert until restoration has completed.
  holdBtnWrap.classList.remove('is-ignited');
  emailInput.blur();
  if (reduced()) { finishRestoreBurn(); paintStill(); } else wake();
}

function finishRestoreBurn() {
  mode = 'delete';
  syncScreens();
  options.onStateChange?.('delete');
  burnClock = 0;
  burnRadius = 0;
  holdProgress = 0;
  cooldownGlow = 0.85; 
  postSmoke = 1.0;     
  updateHoldButtonUI();
  screenSignin.classList.remove('is-burning', 'is-active');
  screenSignin.style.clipPath = 'circle(0px at 50% 50%)';
  screenSignin.setAttribute('aria-hidden', 'true');
  if (focusAfter) { holdBtn.focus({preventScroll:true}); focusAfter=false; }
}

// ---------- Navier-Stokes Fluid + Tight HDR Bloom Render Step ----------
function stepFluidAndRender(dt) {
  if (!fluidReady || reduced()) {
    screenSignin.style.background = '#000';
    burnCtx.clearRect(0,0,burnCanvas.width,burnCanvas.height);
    return;
  }

  const aspect = width / Math.max(height, 1);
  const cxNorm = burnCenterPx.x / Math.max(width, 1);
  const cyNorm = 1.0 - burnCenterPx.y / Math.max(height, 1);
  const modeId = mode === 'delete' ? 0.0 : mode === 'burning' ? 1.0 : mode === 'signin' ? 2.0 : 3.0;
  const simTexelX = 1.0 / fbos.vel.w;
  const simTexelY = 1.0 / fbos.vel.h;

  gl.disable(gl.BLEND);

  // 1. Curl
  {
    const p = programs.curl;
    gl.useProgram(p.program);
    bindTex(0, fbos.vel.read.tex);
    gl.uniform1i(p.u.u_vel, 0);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    drawTo(fbos.curl);
  }

  // 2. Forces
  {
    const p = programs.forces;
    gl.useProgram(p.program);
    bindTex(0, fbos.vel.read.tex);
    bindTex(1, fbos.curl.tex);
    bindTex(2, fbos.dye.read.tex);
    gl.uniform1i(p.u.u_vel, 0);
    gl.uniform1i(p.u.u_curl, 1);
    gl.uniform1i(p.u.u_dye, 2);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    gl.uniform2f(p.u.u_center, cxNorm, cyNorm);
    gl.uniform1f(p.u.u_aspect, aspect);
    gl.uniform1f(p.u.u_dt, dt);
    gl.uniform1f(p.u.u_time, elapsedTime);
    gl.uniform1f(p.u.u_charge, holdProgress);
    gl.uniform1f(p.u.u_radius, burnRadius);
    gl.uniform1f(p.u.u_mode, modeId);
    drawTo(fbos.vel.write);
    fbos.vel.swap();
  }

  // 3. Divergence
  {
    const p = programs.div;
    gl.useProgram(p.program);
    bindTex(0, fbos.vel.read.tex);
    gl.uniform1i(p.u.u_vel, 0);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    drawTo(fbos.div);
  }

  // 4. Pressure Jacobi
  {
    const p = programs.pressure;
    gl.useProgram(p.program);
    bindTex(1, fbos.div.tex);
    gl.uniform1i(p.u.u_div, 1);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    for (let i = 0; i < 14; i++) {
      bindTex(0, fbos.pressure.read.tex);
      gl.uniform1i(p.u.u_pressure, 0);
      drawTo(fbos.pressure.write);
      fbos.pressure.swap();
    }
  }

  // 5. Gradient Subtract
  {
    const p = programs.gradSub;
    gl.useProgram(p.program);
    bindTex(0, fbos.pressure.read.tex);
    bindTex(1, fbos.vel.read.tex);
    gl.uniform1i(p.u.u_pressure, 0);
    gl.uniform1i(p.u.u_vel, 1);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    drawTo(fbos.vel.write);
    fbos.vel.swap();
  }

  // 6. Advect Velocity
  {
    const p = programs.advect;
    gl.useProgram(p.program);
    bindTex(0, fbos.vel.read.tex);
    bindTex(1, fbos.vel.read.tex);
    gl.uniform1i(p.u.u_vel, 0);
    gl.uniform1i(p.u.u_src, 1);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    gl.uniform1f(p.u.u_dt, dt);
    gl.uniform1f(p.u.u_dissipation, 0.972);
    drawTo(fbos.vel.write);
    fbos.vel.swap();
  }

  // 7. Advect Dye
  {
    const p = programs.advect;
    gl.useProgram(p.program);
    bindTex(0, fbos.vel.read.tex);
    bindTex(1, fbos.dye.read.tex);
    gl.uniform1i(p.u.u_vel, 0);
    gl.uniform1i(p.u.u_src, 1);
    gl.uniform2f(p.u.u_texel, simTexelX, simTexelY);
    gl.uniform1f(p.u.u_dt, dt);
    gl.uniform1f(p.u.u_dissipation, 0.99);
    drawTo(fbos.dye.write);
    fbos.dye.swap();
  }

  // 8. Inject Dye
  {
    const p = programs.dyeInject;
    gl.useProgram(p.program);
    bindTex(0, fbos.dye.read.tex);
    gl.uniform1i(p.u.u_dye, 0);
    gl.uniform2f(p.u.u_center, cxNorm, cyNorm);
    gl.uniform1f(p.u.u_aspect, aspect);
    gl.uniform1f(p.u.u_dt, dt);
    gl.uniform1f(p.u.u_time, elapsedTime);
    gl.uniform1f(p.u.u_charge, holdProgress);
    gl.uniform1f(p.u.u_radius, burnRadius);
    gl.uniform1f(p.u.u_flare, flareAmount);
    gl.uniform1f(p.u.u_mode, modeId);
    gl.uniform1f(p.u.u_postSmoke, postSmoke);
    drawTo(fbos.dye.write);
    fbos.dye.swap();
  }

  // 9. HDR Extract + Kawase Pyramid
  {
    const pe = programs.bloomExtract;
    gl.useProgram(pe.program);
    bindTex(0, fbos.dye.read.tex);
    gl.uniform1i(pe.u.u_dye, 0);
    gl.uniform2f(pe.u.u_res, burnCanvas.width, burnCanvas.height);
    gl.uniform2f(pe.u.u_center, cxNorm, cyNorm);
    gl.uniform1f(pe.u.u_time, elapsedTime);
    gl.uniform1f(pe.u.u_radius, burnRadius);
    gl.uniform1f(pe.u.u_mode, modeId);
    gl.uniform1f(pe.u.u_charge, holdProgress);
    drawTo(fbos.hdr0);

    const pk = programs.kawase;
    gl.useProgram(pk.program);
    const levels = [fbos.hdr0, fbos.hdr1, fbos.hdr2, fbos.hdr3];
    for (let i = 0; i < 3; i++) {
      bindTex(0, levels[i].tex);
      gl.uniform1i(pk.u.u_tex, 0);
      gl.uniform2f(pk.u.u_texel, 1.0 / levels[i].w, 1.0 / levels[i].h);
      gl.uniform1f(pk.u.u_offset, 1.3 + i * 0.65);
      drawTo(levels[i + 1]);
    }
  }

  // 10. Foreground HDR Bloom -> hardware blit to #bloom-canvas (z-index: 4)
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, burnCanvas.width, burnCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const p = programs.bloomComp;
    gl.useProgram(p.program);
    bindTex(0, fbos.hdr0.tex);
    bindTex(1, fbos.hdr1.tex);
    bindTex(2, fbos.hdr2.tex);
    bindTex(3, fbos.hdr3.tex);
    bindTex(4, fbos.dye.read.tex);
    gl.uniform1i(p.u.u_hdr0, 0);
    gl.uniform1i(p.u.u_hdr1, 1);
    gl.uniform1i(p.u.u_hdr2, 2);
    gl.uniform1i(p.u.u_hdr3, 3);
    gl.uniform1i(p.u.u_dye, 4);
    gl.uniform1f(p.u.u_mode, modeId);
    drawTo(null);

    bloomCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
    bloomCtx.drawImage(glCanvas, 0, 0, bloomCanvas.width, bloomCanvas.height);
  }

  // 11. Base Layer -> #burn-canvas (z-index: 2)
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, burnCanvas.width, burnCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const p = programs.baseComp;
    gl.useProgram(p.program);
    bindTex(0, fbos.dye.read.tex);
    gl.uniform1i(p.u.u_dye, 0);
    gl.uniform2f(p.u.u_res, burnCanvas.width, burnCanvas.height);
    gl.uniform2f(p.u.u_center, cxNorm, cyNorm);
    gl.uniform1f(p.u.u_time, elapsedTime);
    gl.uniform1f(p.u.u_radius, burnRadius);
    gl.uniform1f(p.u.u_mode, modeId);
    drawTo(null);
    burnCtx.clearRect(0, 0, burnCanvas.width, burnCanvas.height);
    burnCtx.drawImage(glCanvas, 0, 0, burnCanvas.width, burnCanvas.height);
  }
}

// ---------- Main Loop ----------
function tick(now) {
  raf = null;
  if (destroyed || document.hidden) return;
  inTick = true;
  const timelineDt = Math.max(0, (now-lastTs)/1000);
  const dt = Math.min(0.033, Math.max(0.001, (now - lastTs) / 1000));
  lastTs = now;
  elapsedTime += timelineDt;

  const aspect = width / Math.max(height, 1);
  const cxNorm = burnCenterPx.x / Math.max(width, 1);
  const cyNorm = 1.0 - burnCenterPx.y / Math.max(height, 1);
  const maxCornerDist = Math.hypot(
    Math.max(cxNorm, 1 - cxNorm) * aspect,
    Math.max(cyNorm, 1 - cyNorm)
  ) + 0.48;

  if (mode === 'delete') {
    if (isHolding) {
      holdProgress = Math.min(1, holdProgress + timelineDt / holdDuration());
      if (holdProgress > 0.65 && Math.random() < (holdProgress - 0.6) * 1.4) {
        const btnW = holdBtn.offsetWidth || 174;
        const edgeX = burnCenterPx.x - btnW * 0.5 + holdProgress * btnW;
        const edgeY = burnCenterPx.y + (Math.random() - 0.5) * 28;
        spawnParticle(edgeX, edgeY, Math.random() < 0.6 ? 'spark' : 'soot', 0, -24);
      }
      if (holdProgress >= 1) {
        startForwardBurn();
      }
    } else if (holdProgress > 0) {
      holdProgress = Math.max(0, holdProgress - dt * 2.4);
    }

    if (cooldownGlow > 0) {
      cooldownGlow = Math.max(0, cooldownGlow - dt * 1.5);
    }
    if (postSmoke > 0) {
      postSmoke = Math.max(0, postSmoke - dt * 0.38);
    }
    updateHoldButtonUI();
  } else if (mode === 'burning') {
    burnClock += timelineDt;
    // Smooth continuous flare decay (no hard flash pop)
    flareAmount = Math.max(0, flareAmount - dt * 1.25);

    // Continuous C1 expansion from 0.000 -> maxCornerDist (ZERO step jump!)
    const p = Math.min(1, burnClock / BURN_TOTAL);
    const eased = Math.pow(p, 1.75);
    burnRadius = eased * maxCornerDist;
    updateSigninClip(burnRadius, maxCornerDist);

    // Gently fade out the Hold button once the fire actually reaches it (~0.15s..0.45s)
    if (burnClock > 0.12 && !holdBtnWrap.classList.contains('is-ignited')) {
      holdBtnWrap.classList.add('is-ignited');
    }

    if (p > 0.04 && p < 0.92) {
      const emitCount = Math.round((6 + p * 20) * (dt * 60));
      emitAlongBurnRing(Math.min(emitCount, 26), burnRadius, false);
    }

    if (burnClock >= BURN_TOTAL) {
      finishForwardBurn();
    }
  } else if (mode === 'signin') {
    signinClock += timelineDt;
    burnRadius = maxCornerDist + 0.2;
  } else if (mode === 'restoring') {
    burnClock += timelineDt;

    if (burnClock <= RESTORE_STORM_DELAY) {
      burnRadius = maxCornerDist + 0.12;
      const stormT = burnClock / RESTORE_STORM_DELAY;
      const stormCount = Math.round((6 + stormT * 20) * (dt * 60));
      for (let i = 0; i < Math.min(stormCount, 26); i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const toCx = (burnCenterPx.x - sx) * 0.22;
        const toCy = (burnCenterPx.y - sy) * 0.22;
        spawnParticle(sx, sy, Math.random() < 0.65 ? 'spark' : 'scrap', toCx, toCy - 18);
      }
    } else {
      const p = Math.min(1, (burnClock - RESTORE_STORM_DELAY) / (RESTORE_TOTAL - RESTORE_STORM_DELAY));
      const eased = 1.0 - Math.pow(p, 0.88);
      burnRadius = eased * maxCornerDist;
      updateSigninClip(burnRadius, maxCornerDist);

      // Smoothly pre-warm button cooldown right before the closing flame reveals it (no sudden pop!)
      if (p > 0.78) {
        cooldownGlow = Math.min(0.85, (p - 0.78) / 0.22 * 0.85);
        updateHoldButtonUI();
      }

      if (p < 0.95) {
        const emitCount = Math.round((16 * (1.0 - p * 0.5)) * (dt * 60));
        emitAlongBurnRing(Math.min(emitCount, 22), burnRadius, true);
      }
    }

    if (burnClock >= RESTORE_TOTAL) {
      finishRestoreBurn();
    }
  }

  stepFluidAndRender(dt);
  updateAndDrawParticles(dt);

  stage.dataset.progress = holdProgress.toFixed(3);
  inTick = false;
  if (isHolding || holdProgress > 0 || mode === 'burning' || mode === 'restoring' ||
      (mode === 'signin' && signinClock < 3.5) || (mode === 'delete' && postSmoke > 0) || particles.length) {
    raf = requestAnimationFrame(tick);
  } else paintStill();
}


function syncScreens() {
  stage.dataset.state = mode;
  for (const [screen, active] of [[screenDelete,mode==='delete'],[screenSignin,mode==='signin']]) {
    if (!active && screen.contains(document.activeElement)) document.activeElement.blur();
    screen.inert = !active;
    screen.setAttribute('aria-hidden',String(!active));
  }
}
function paintStill() {
  for (const canvas of [burnCanvas,bloomCanvas,particlesCanvas]) {
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
  }
  if (mode==='signin') {
    burnCtx.fillStyle='#000';burnCtx.fillRect(0,0,burnCanvas.width,burnCanvas.height);
  }
  stage.dataset.progress=holdProgress.toFixed(3);
}
function settle(state) {
  endHold();
  if (raf!==null) cancelAnimationFrame(raf);
  raf=null;particles.length=0;holdProgress=0;cooldownGlow=0;postSmoke=0;
  mode=state;signinClock=4;burnClock=0;burnRadius=0;
  holdBtnWrap.classList.remove('is-ignited');
  screenSignin.classList.remove('is-burning');
  screenSignin.classList.toggle('is-active',state==='signin');
  screenSignin.style.clipPath=state==='signin'?'none':'circle(0px at 50% 50%)';
  if(fluidReady) {
    for(const target of Object.values(fbos)) {
      for(const fbo of target.read?[target.read,target.write]:[target]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo.fb);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  syncScreens();updateHoldButtonUI();paintStill();
}
function beginHold(e) {
  if (mode!=='delete' || isHolding || document.hidden) return;
  if (e.type==='pointerdown' && (e.button!==0 || e.isPrimary===false)) return;
  isHolding=true;focusAfter=e.isTrusted;
  activePointer=e.type==='pointerdown'?e.pointerId:null;
  holdBtn.classList.add('is-holding');
  if (activePointer!==null && e.isTrusted) holdBtn.setPointerCapture(activePointer);
  if (reduced()) {
    holdProgress=.5;updateHoldButtonUI();
    holdTimer=setTimeout(()=>{if(isHolding)startForwardBurn();},holdDuration()*1000);
  } else wake();
}
function endHold(e) {
  if (e?.pointerId!==undefined && activePointer!==null && e.pointerId!==activePointer) return;
  clearTimeout(holdTimer);holdTimer=null;activePointer=null;
  isHolding=false;holdBtn.classList.remove('is-holding');
  if (reduced()) {holdProgress=0;updateHoldButtonUI();} else if (holdProgress>0) wake();
}
on(holdBtn,'pointerdown',beginHold);
for (const type of ['pointerup','pointercancel','lostpointercapture']) on(holdBtn,type,endHold);
on(holdBtn,'blur',()=>endHold());
on(window,'blur',()=>endHold());
on(holdBtn,'keydown',e=>{
  if ((e.code==='Space'||e.code==='Enter')&&!e.repeat) {e.preventDefault();beginHold(e);}
  if(e.code==='Escape')endHold();
});
on(holdBtn,'keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();endHold();}});
on(restoreBtn,'click',e=>{focusAfter=e.isTrusted;startRestoreBurn();});
on(signinForm,'submit',e=>{
  e.preventDefault();
  const value=emailInput.value.trim();
  const valid=Boolean(value)&&emailInput.validity.valid;
  emailInput.setAttribute('aria-invalid',String(!valid));
  signinFeedback.textContent=valid?'Demo only. No sign-in request was sent.':value?'Enter a valid email address.':'Enter your email address to continue.';
  signinFeedback.classList.add('visible');
  if(!valid)emailInput.focus();
});
on(emailInput,'input',()=>{emailInput.removeAttribute('aria-invalid');signinFeedback.classList.remove('visible');});
on(document,'visibilitychange',()=>{
  endHold();
  if(document.hidden){if(raf!==null)cancelAnimationFrame(raf);raf=null;}
  else {lastTs=performance.now();wake();}
});
on(glCanvas,'webglcontextlost',e=>{
  e.preventDefault();fluidReady=false;stage.dataset.renderer='fallback';
  screenSignin.style.background='#000';bloomCtx.clearRect(0,0,bloomCanvas.width,bloomCanvas.height);
});
function refresh() {
  if (destroyed) return;
  if (reduced()) settle(mode==='signin'||mode==='burning'?'signin':'delete');
  resize();
  if(mode==='signin'||mode==='delete')paintStill();
  else wake();
}
resize();syncScreens();paintStill();
stage.dataset.renderer=fluidReady?'webgl2':'fallback';
if (initial.state==='signin')settle('signin');
const observer=new scope.ResizeObserver(()=>{resize();if(mode==='delete'||mode==='signin')paintStill();else wake();});
observer.observe(stage);
on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',refresh);
return {
  refresh,
  update(next){
    if(destroyed)return;
    options={...options,...next};
    if(next.state==='delete'||next.state==='signin')settle(next.state);
    if('reducedMotion' in next)refresh();
    else {resize();if(mode==='delete'||mode==='signin')paintStill();}
  },
  destroy(){
    if(destroyed)return;
    destroyed=true;clearTimeout(holdTimer);if(raf!==null)cancelAnimationFrame(raf);observer.disconnect();
    particles.length=0;
    if(gl){
      for (const [key,remove] of [['textures','deleteTexture'],['framebuffers','deleteFramebuffer'],['buffers','deleteBuffer'],['vaos','deleteVertexArray'],['programs','deleteProgram'],['shaders','deleteShader']]) {
        gpu[key].forEach(resource=>gl[remove](resource));gpu[key].length=0;
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    for (const canvas of [burnCanvas,bloomCanvas,particlesCanvas,glCanvas]) {canvas.width=1;canvas.height=1;}
  },
};
}
