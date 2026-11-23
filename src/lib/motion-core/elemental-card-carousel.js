/* Supplied HTML adaptation. Design reference: @kaolti.
   No separate source license was supplied or verified. */
export function createElementalCardCarousel(scope,initial={}){
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame}=scope;
  let options={...initial},destroyed=false,raf=null,lastTime=null,elapsed=0;
  const normalizeIndex=value=>Number.isInteger(value)?((value%4)+4)%4:0;
  const reduced=()=>scope.reduced();
  const running=()=>!options.paused&&!document.hidden&&!reduced();

  const stage=document.getElementById('stage');
  const cards=Array.from(document.querySelectorAll('.card'));
  const glCanvas = document.getElementById('gl-canvas');
  const fxMid = document.getElementById('fx-mid');
  const fxFront = document.getElementById('fx-front');
  const ctxM = fxMid.getContext('2d');
  const ctxF = fxFront.getContext('2d');
  let gl = glCanvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });

  const gpuContext=gl,resources=[];
  const track=(kind,value)=>{resources.push({kind,value});return value;};
  const fallbackContext=!gl?glCanvas.getContext('2d'):null;

  const VERT_SRC = `#version 300 es
    in vec2 aPos;
    out vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // =========================================================================
  // PASS 1: MASTER ELEMENTAL VFX SHADER
  //   - Ember: Tall roaring FBM fire rising from upper shoulders/crown, razor-thin bottom rim, grainy sparks
  //   - Solar: Needle-fine 360° golden rays, blinding white-gold corona, clean falloff
  //   - Breeze: True 2D aerodynamic potential-flow streamlines curving around the pill + waist pinch cusps
  //   - Bloom: 11-petal cupped lotus with soft directional Fresnel rim + rich stippled botanical grain
  // =========================================================================
  const VFX_FRAG_SRC = `#version 300 es
    precision mediump float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform vec2 uRes;
    uniform float uTime;
    uniform vec4 uCard0;
    uniform vec4 uCard1;
    uniform vec4 uCard2;
    uniform vec4 uCard3;
    uniform vec4 uInt;
    uniform vec3 uAmbient;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    const mat2 ROT = mat2(0.80, -0.60, 0.60, 0.80);

    float fbm4(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = ROT * p * 2.03 + vec2(17.1, 31.7);
        a *= 0.5;
      }
      return v;
    }

    float fbm3(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p = ROT * p * 2.02 + vec2(9.3, 13.7);
        a *= 0.5;
      }
      return v;
    }

    float sdPill(vec2 p, float halfW, float halfH) {
      float seg = max(0.0, halfH - halfW);
      vec2 q = vec2(p.x, p.y - clamp(p.y, -seg, seg));
      return length(q) - halfW;
    }

    // 1. EMBER: Silky, vertically-stretched wispy flame tongues matching 01_ember_active.png
    //    Layered translucent scarlet outer veil + roaring vermilion tongues + smooth white-hot top plasma
    vec3 renderEmber(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float rMask = smoothstep(2.5, 1.25, length(p * vec2(1.0, 0.68)));
      if (rMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);

      float rimStage   = smoothstep(0.00, 0.40, inten);
      float plumeStage = smoothstep(0.16, 0.96, inten);
      float crownStage = smoothstep(0.38, 1.00, inten);

      float t = uTime * 1.15;

      // Anisotropic vertical stretch: fire rises into sleek, silky vertical tongues (NOT round blobs!)
      float hAbove = max(0.0, p.y - (halfH - 0.35));
      // Gentle inward flame taper + organic side flicker as flames rise
      float sway = sin(p.y * 3.2 - t * 2.8) * 0.06 * hAbove;
      vec2 uv = vec2((p.x + sway) * (1.0 + hAbove * 0.28), p.y);

      // Vertically elongated domain-warped coordinates (x high-freq, y stretched!)
      vec2 warp = vec2(
        fbm3(vec2(uv.x * 3.4, uv.y * 1.35 - t * 1.45)) - 0.5,
        fbm3(vec2(uv.x * 3.4 + 4.7, uv.y * 1.35 - t * 1.85)) - 0.5
      );

      // Two silky vertical flame tongue layers (broad silk tongues + fine wispy licks)
      float nBroad = fbm4(vec2(uv.x * 4.2 + warp.x * 1.2, uv.y * 1.55 + warp.y * 0.6 - t * 2.1));
      float nWisp  = fbm3(vec2(uv.x * 8.5 + warp.x * 1.6, uv.y * 2.40 + warp.y * 0.8 - t * 3.2));

      // Concentrate flames smoothly from upper shoulders & top dome; keep lower half ultra-sleek
      float topMask = smoothstep(-0.18, 0.52, p.y / halfH);
      float lateralTaper = exp(-pow(abs(uv.x) / (0.58 + 0.14 * (1.0 - topMask)), 2.8));

      // Silky outer scarlet flame veil (tall, translucent, feathery)
      float outerReach = mix(0.035 * rimStage, 0.98 * plumeStage, topMask);
      float outerField = d - (nBroad * 0.78 + nWisp * 0.30 - 0.10) * outerReach;
      float outerVeil = smoothstep(0.24, -0.08, outerField) * smoothstep(halfH + mix(0.08, 1.22, plumeStage), halfH - 0.10, p.y);
      outerVeil *= (0.45 + 0.55 * nBroad) * lateralTaper * plumeStage;

      // Inner bright fiery vermilion-orange flame tongues (sharper, silkier, licking upward)
      float innerReach = mix(0.025 * rimStage, 0.62 * plumeStage, topMask);
      float innerField = d - (nBroad * 0.65 + nWisp * 0.42 - 0.14) * innerReach;
      float innerTongues = smoothstep(0.14, -0.06, innerField) * smoothstep(halfH + mix(0.06, 0.82, plumeStage), halfH - 0.15, p.y);
      innerTongues *= (0.52 + 0.48 * nWisp) * plumeStage;

      // Smooth incandescent white-gold plasma core hugging the top semicircle
      float crownDist = length(vec2(p.x * 1.18, (p.y - halfH * 0.96) * 2.05));
      float crownCore = exp(-crownDist * 4.4) * (0.82 + 0.24 * nWisp) * crownStage;
      float crownHalo = exp(-crownDist * 2.4) * (0.70 + 0.30 * nBroad) * crownStage;

      // Razor-sleek fiery contour hugging the pill sides & bottom
      float tightRim = exp(-max(0.0, d) * 28.0) * (0.62 + 0.38 * nBroad) * mix(0.55, 1.0, topMask) * rimStage;
      float softGlow = exp(-max(0.0, d) * 3.0) * 0.24 * rimStage;

      vec3 colScarlet = vec3(0.86, 0.08, 0.03);
      vec3 colFlame   = vec3(1.00, 0.30, 0.05);
      vec3 colGold    = vec3(1.00, 0.74, 0.28);
      vec3 colWhite   = vec3(1.00, 0.96, 0.88);

      vec3 col = colScarlet * softGlow;
      col += colScarlet * outerVeil * 1.05;
      col += mix(colFlame, colGold, clamp(innerTongues * 0.75 + crownHalo * 0.5, 0.0, 1.0)) * innerTongues * 1.10;
      col += colGold * crownHalo * 0.52;
      col += colWhite * crownCore * 1.22;
      col += mix(colFlame, colGold, topMask * 0.5) * tightRim * 0.85;

      return col * rMask;
    }

    // 2. SOLAR: Needle-fine 360° golden god-rays + blinding white-gold corona + tight clean falloff
    vec3 renderSolar(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float rLen = length(p * vec2(0.88, 0.74));
      float envMask = smoothstep(2.45, 1.05, rLen);
      if (envMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);

      float coronaStage = smoothstep(0.00, 0.42, inten);
      float rayStage    = smoothstep(0.24, 1.00, inten);
      float rayReach    = 1.0 - pow(1.0 - rayStage, 2.5);

      // High-frequency needle-fine 360° golden shafts matching 05_transition_solar_to_ember.png
      vec2 rayDir = normalize(vec2(p.x, p.y * 0.72) + vec2(1e-5));
      float r1 = vnoise(rayDir * 12.0 + vec2(uTime * 0.28, -uTime * 0.18));
      float r2 = vnoise(rayDir * 34.0 + vec2(-uTime * 0.48, uTime * 0.34));
      float r3 = vnoise(rayDir * 76.0 + vec2(uTime * 0.72, uTime * 0.52));

      float rays = pow(clamp(r1 * 0.38 + r2 * 0.40 + r3 * 0.32, 0.0, 1.0), 2.25);
      float sharpRays = pow(clamp(r2 * 0.44 + r3 * 0.66, 0.0, 1.0), 3.4);

      float distOut = max(0.0, d);
      float decayMul = mix(6.8, 1.0, rayReach);
      // Slightly tighter decay so rays frame Solar dramatically without washing out neighbor cards
      float rayFade = exp(-distOut * (2.68 - rays * 1.25) * decayMul) * rayStage;
      float longShafts = exp(-distOut * (1.72 - sharpRays * 0.72) * decayMul) * sharpRays * rayStage;

      // Subtle sparkling stardust near the corona edge
      float sparkle = pow(hash21(floor(fragPx * 0.65)), 18.0) * exp(-distOut * 5.2) * rayStage * 1.8;

      float innerCorona = exp(-distOut * 25.0) * 1.85 * coronaStage;
      float midCorona   = exp(-distOut * mix(14.0, 7.8, rayReach)) * 0.86 * coronaStage;
      float outerGlow   = exp(-distOut * 2.25) * 0.24 * rayStage;

      vec3 colGold  = vec3(1.00, 0.66, 0.12);
      vec3 colAmber = vec3(0.95, 0.44, 0.04);
      vec3 colWhite = vec3(1.00, 0.98, 0.90);

      vec3 col = colAmber * outerGlow;
      col += mix(colAmber, colGold, rays) * (rayFade * rays * 1.85);
      col += mix(colGold, colWhite, 0.58) * (longShafts * 1.65);
      col += mix(colGold, colWhite, 0.68) * midCorona;
      col += colWhite * (innerCorona + sparkle);

      return col * envMask;
    }

    // 3. BREEZE: True 2D Aerodynamic Potential-Flow Wind Tunnel Streamlines + Waist Pinch Cusps!
    //    Air enters horizontally from the left, parts smoothly over the top & bottom of the pill,
    //    pinches sharply at the left/right waist, and sweeps out to the right — ZERO concentric blobs!
    vec3 renderBreeze(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      // Elliptical wind-tunnel envelope (wider horizontally, tight vertically)
      float envMask = smoothstep(1.95, 0.92, length(p * vec2(0.76, 0.88)));
      if (envMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);
      float distOut = max(0.0, d);

      float auraStage = smoothstep(0.00, 0.40, inten);
      float windStage = smoothstep(0.22, 1.00, inten);

      // 2D potential flow streamfunction around an elliptical body:
      // psi = y * (1 - R^2 / r^2) -> streamlines deflect smoothly around the pill!
      vec2 pe = vec2(p.x * 0.92, p.y * 0.66);
      float r2 = max(0.24, dot(pe, pe));
      float psi = pe.y * (1.0 - 0.34 / r2);
      // Add gentle organic wind undulation
      float t = uTime * 1.35;
      float flowCoordX = pe.x - t * 0.85;
      float undulate = fbm3(vec2(flowCoordX * 1.4, psi * 2.2)) * 0.22;
      float psiWarped = psi + undulate;

      // Layered silky aerodynamic wind-ribbon sheets flowing horizontally around the pill!
      float sheet1 = sin(psiWarped * 24.0 + vnoise(vec2(flowCoordX * 2.5, psi * 4.0)) * 2.6) * 0.5 + 0.5;
      float sheet2 = sin(psiWarped * 46.0 - vnoise(vec2(flowCoordX * 4.0 + 3.1, psi * 6.0)) * 2.2) * 0.5 + 0.5;

      // Modulate streaks along flow direction so they appear as sweeping wind gusts rather than solid bars
      float gustMask = smoothstep(0.22, 0.78, vnoise(vec2(flowCoordX * 2.4, psi * 6.5)));
      float spreadDecay = mix(9.5, 3.6, windStage);
      float radialFade = exp(-distOut * spreadDecay) * smoothstep(-0.02, 0.04, d);

      float softSheets = pow(sheet1, 2.2) * (0.45 + 0.55 * gustMask) * radialFade * windStage;
      float fineStreaks = pow(sheet2, 4.5) * gustMask * exp(-distOut * mix(9.0, 2.8, windStage)) * smoothstep(0.03, 0.12, distOut) * windStage;

      // Tight luminous cyan-emerald contour glow hugging the pill
      float rim = exp(-distOut * 19.0) * 1.25 * auraStage;
      float softAura = exp(-distOut * 3.4) * 0.32 * auraStage;

      // Sharp pointed horizontal wind-pinch cusps at the left & right mid-waist (signature of 04_breeze_active.png!)
      float pinchL = exp(-length((p - vec2(-halfW - 0.04, 0.0)) * vec2(2.6, 5.2)) * 2.4);
      float pinchR = exp(-length((p - vec2( halfW + 0.04, 0.0)) * vec2(2.6, 5.2)) * 2.4);
      float pinch = (pinchL + pinchR) * (0.80 + 0.20 * sin(uTime * 2.6)) * windStage;

      vec3 colDeep = vec3(0.02, 0.42, 0.28);
      vec3 colMid  = vec3(0.08, 0.88, 0.58);
      vec3 colMint = vec3(0.78, 1.00, 0.94);

      vec3 col = colDeep * softAura;
      col += colMid * (softSheets * 1.42 + rim * 0.86);
      col += colMint * (fineStreaks * 1.25 + pinch * 0.88 + exp(-distOut * 32.0) * 0.62 * auraStage);

      return col * envMask;
    }

    // 4. BLOOM: 11-petal cupped translucent lotus with soft directional Fresnel rim & stippled grain
    vec3 evalLotusPetal(vec2 p, float angleRad, float len, float wid, float oy, float openEase, float grain) {
      if (openEase <= 0.01) return vec3(0.0);
      vec2 q = p - vec2(0.0, oy);
      float c = cos(angleRad);
      float s = sin(angleRad);
      vec2 lp = vec2(c * q.x - s * q.y, s * q.x + c * q.y);

      float u = lp.y / len;
      if (u < -0.08 || u > 1.12) return vec3(0.0);

      float uClamped = clamp(u, 0.0, 1.0);
      // Subtle botanical upward cup curvature on lateral petals
      lp.x -= sin(uClamped * 3.14159265) * sign(angleRad) * 0.045 * abs(sin(angleRad));

      float profile = pow(sin(uClamped * 3.14159265), 0.72) * (1.0 - 0.06 * uClamped);
      float halfWidth = wid * profile;

      float dx = abs(lp.x) - halfWidth;
      float tipDist = length(vec2(lp.x * 1.22, max(0.0, lp.y - len * 0.85))) - len * 0.15;
      float dist = mix(max(dx, -lp.y), max(dx, tipDist), smoothstep(0.65, 0.96, uClamped));
      if (lp.y > len) dist = max(dist, lp.y - len);

      float inside = smoothstep(0.020, -0.016, dist);
      float outerHalo = exp(-max(0.0, dist) * 24.0) * 0.22 * smoothstep(-0.04, 0.10, u) * smoothstep(1.10, 0.90, u);
      if (inside <= 0.001 && outerHalo <= 0.001) return vec3(0.0);

      float lat = halfWidth > 0.001 ? clamp(abs(lp.x) / halfWidth, 0.0, 1.0) : 1.0;

      // Soft luminous directional Fresnel rim (broad silky glow rather than hard neon wire!)
      float fresnel = pow(lat, 2.2) * 0.88 + pow(uClamped, 3.2) * 0.62;
      float softRim = exp(-abs(dist) * 34.0) * 0.62 * smoothstep(0.02, 0.18, u);

      // Rich stippled botanical grain concentrated toward outer half of each petal (matching 08_bloom_full.png!)
      float veins = 0.5 + 0.5 * sin(lat * 16.0 - uClamped * 3.2);
      float stipple = mix(0.90, 1.12, grain * (0.35 + 0.65 * fresnel) + veins * 0.30);

      vec3 body = mix(vec3(0.66, 0.03, 0.34), vec3(0.98, 0.16, 0.56), smoothstep(0.05, 0.68, uClamped) * 0.70 + lat * 0.36);
      body = mix(body, vec3(1.00, 0.80, 0.92), clamp(fresnel * 0.86, 0.0, 1.0));
      body *= stipple;

      float alpha = mix(0.46, 0.94, clamp(fresnel, 0.0, 1.0)) * inside;
      vec3 res = body * alpha + vec3(1.00, 0.92, 0.97) * softRim + vec3(0.98, 0.18, 0.56) * outerHalo;
      return res * openEase;
    }

    vec3 renderBloom(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float envMask = smoothstep(2.8, 1.4, length(p * vec2(0.85, 0.95)));
      if (envMask <= 0.001) return vec3(0.0);

      float halfH = 0.5 * (card.w / card.z);
      float grain = hash21(floor(fragPx * 0.85)) * 0.72 + vnoise(p * 30.0) * 0.28;

      float glowStage = smoothstep(0.00, 0.38, inten);
      float radialD = length(p * vec2(0.82, 0.95));
      vec3 col = vec3(0.88, 0.12, 0.48) * exp(-radialD * 1.55) * 0.52 * glowStage;

      const int NUM_P = 11;
      float angles[NUM_P] = float[NUM_P](
         0.0,  -25.0,  25.0,  -51.0,  51.0,
       -75.0,   75.0, -95.0,   95.0, -109.0, 109.0
      );
      float lens[NUM_P] = float[NUM_P](
        1.30,  1.32,  1.32,  1.42,  1.42,
        1.50,  1.50,  1.36,  1.36,  1.16,  1.16
      );
      float wids[NUM_P] = float[NUM_P](
        0.34,  0.34,  0.34,  0.37,  0.37,
        0.40,  0.40,  0.38,  0.38,  0.35,  0.35
      );
      float oys[NUM_P] = float[NUM_P](
       -0.30, -0.32, -0.32, -0.36, -0.36,
       -0.44, -0.44, -0.52, -0.52, -0.58, -0.58
      );
      float delays[NUM_P] = float[NUM_P](
        0.10,  0.15,  0.15,  0.22,  0.22,
        0.29,  0.29,  0.36,  0.36,  0.42,  0.42
      );

      vec3 petalsSum = vec3(0.0);
      for (int i = 0; i < NUM_P; i++) {
        float lp = clamp((inten - delays[i]) / (1.0 - delays[i]), 0.0, 1.0);
        float t1 = 1.0 - lp;
        float ease = 1.0 - t1 * t1 * t1;
        float breathe = sin(uTime * 1.35 + float(i) * 0.65) * 0.02 * ease;
        float angDeg = angles[i] * (0.14 + 0.86 * ease) + breathe * 36.0;
        float rad = angDeg * 0.01745329;
        float pLen = lens[i] * (0.18 + 0.82 * ease) * (1.0 + breathe * 0.5);
        float pWid = wids[i] * (0.32 + 0.68 * ease);
        vec3 pc = evalLotusPetal(p, rad, pLen, pWid, oys[i], ease, grain);
        petalsSum = petalsSum + pc * (1.0 - petalsSum * 0.34);
      }

      col += petalsSum;
      float baseD = length((p - vec2(0.0, -halfH * 0.92)) * vec2(0.95, 2.8));
      col += vec3(1.00, 0.72, 0.88) * exp(-baseD * 2.2) * 0.44 * smoothstep(0.25, 0.95, inten);
      return col * envMask;
    }

    void main() {
      vec2 fragPx = vUv * uRes;
      vec2 uvC = (vUv - vec2(0.5, 0.54)) * vec2(uRes.x / uRes.y, 1.0);
      float bgFalloff = exp(-dot(uvC, uvC) * 2.6);
      vec3 bg = vec3(0.015, 0.014, 0.017) + uAmbient * bgFalloff * 0.24;

      vec3 vfx = vec3(0.0);
      if (uInt.x > 0.002) vfx += renderEmber(fragPx,  uCard0, uInt.x);
      if (uInt.y > 0.002) vfx += renderSolar(fragPx,  uCard1, uInt.y);
      if (uInt.z > 0.002) vfx += renderBreeze(fragPx, uCard2, uInt.z);
      if (uInt.w > 0.002) vfx += renderBloom(fragPx,  uCard3, uInt.w);

      vec3 total = bg + vfx;
      total = total / (1.0 + total * 0.22);
      fragColor = vec4(total, 1.0);
    }
  `;

  // PASS 2: COMPOSITE + GLOSSY FLOOR REFLECTION + AUTHENTIC MONOCHROME ANALOG FILM GRAIN
  const COMP_FRAG_SRC = `#version 300 es
    precision mediump float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform sampler2D uScene;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uFloorY;
    uniform vec3 uAmbient;
    uniform vec4 uActiveCard;
    uniform vec3 uActiveTint;
    uniform float uActiveWarmth;
    uniform float uLight;

    float hashGrain(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec3 col = texture(uScene, vUv).rgb;
      float floorMask = smoothstep(uFloorY + 0.055, uFloorY - 0.055, vUv.y);

      float dyH = (vUv.y - uFloorY) * (uRes.y / 32.0);
      float dxH = (vUv.x - 0.5) * 2.3;
      float horizonBand = exp(-dyH * dyH * 1.4 - dxH * dxH * 1.8);

      if (floorMask > 0.001) {
        float depth = clamp((uFloorY - vUv.y) / max(0.001, uFloorY), 0.0, 1.0);
        float refY = uFloorY + abs(uFloorY - vUv.y) * 1.16 + 0.02;

        vec3 refCol = vec3(0.0);
        if (refY < 0.99) {
          float blurPx = mix(5.0, 14.0, depth);
          vec2 texel = blurPx / uRes;
          refCol += texture(uScene, vec2(vUv.x, refY)).rgb * 0.24;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x, refY + texel.y)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x, refY - texel.y)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY + texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY + texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY - texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY - texel.y)).rgb * 0.06;

          vec2 refPx = vec2(vUv.x * uRes.x, refY * uRes.y);
          vec2 dp = (refPx - uActiveCard.xy) / uActiveCard.z;
          float halfH = 0.5 * (uActiveCard.w / uActiveCard.z);
          float seg = max(0.0, halfH - 0.5);
          vec2 q = vec2(dp.x, dp.y - clamp(dp.y, -seg, seg));
          float cardSil = smoothstep(0.16, -0.06, length(q) - 0.5);
          refCol = mix(refCol, uActiveTint * 0.52 * uActiveWarmth + refCol * 0.65, cardSil * 0.52);
        }

        float refStrength = smoothstep(0.0, 0.26, depth) * mix(0.70, 0.50, depth);
        vec3 floorBase = col * mix(1.0, 0.22, floorMask);
        col = mix(floorBase, refCol * 0.92, floorMask * refStrength);
      }

      col += uAmbient * horizonBand * 0.24;

      // Tactile fine analog film grain visible across dark stage, ambient glows & VFX
      float g1 = hashGrain(gl_FragCoord.xy + fract(uTime * 12.0) * 19.3);
      float g2 = hashGrain(gl_FragCoord.xy * 0.5 + 71.7);
      float grain = (g1 * 0.65 + g2 * 0.35 - 0.5);
      // Slightly stronger in midtones/glows, subtle crisp dither in deep blacks
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += vec3(grain * mix(0.014, 0.026, smoothstep(0.02, 0.45, lum)));

      if (uLight > 0.5) {
      float intensity=max(col.r,max(col.g,col.b));
      col=mix(vec3(244.0/255.0),clamp(col,0.0,1.0),smoothstep(0.16,0.55,intensity));
    }
    fragColor = vec4(max(col, 0.0), 1.0);
    }
  `;

  function compileShader(type, src) {
    const s = track('shader',gl.createShader(type));
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s)||'Shader compilation failed');
    }
    return s;
  }

  function createProgram(vsSrc, fsSrc) {
    const p = track('program',gl.createProgram());
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p)||'Program linking failed');
    }
    return p;
  }

  let vfxProg = null, compProg = null, quadVao = null, fbo = null, fboTex = null;
  let uVfx = {}, uComp = {};

  try { if (gl) {
    vfxProg = createProgram(VERT_SRC, VFX_FRAG_SRC);
    compProg = createProgram(VERT_SRC, COMP_FRAG_SRC);

    quadVao = track('vertexArray',gl.createVertexArray());
    gl.bindVertexArray(quadVao);
    const buf = track('buffer',gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(vfxProg, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    uVfx = {
      uRes: gl.getUniformLocation(vfxProg, 'uRes'),
      uTime: gl.getUniformLocation(vfxProg, 'uTime'),
      uCard0: gl.getUniformLocation(vfxProg, 'uCard0'),
      uCard1: gl.getUniformLocation(vfxProg, 'uCard1'),
      uCard2: gl.getUniformLocation(vfxProg, 'uCard2'),
      uCard3: gl.getUniformLocation(vfxProg, 'uCard3'),
      uInt: gl.getUniformLocation(vfxProg, 'uInt'),
      uAmbient: gl.getUniformLocation(vfxProg, 'uAmbient')
    };

    uComp = {
      uScene: gl.getUniformLocation(compProg, 'uScene'),
      uRes: gl.getUniformLocation(compProg, 'uRes'),
      uTime: gl.getUniformLocation(compProg, 'uTime'),
      uFloorY: gl.getUniformLocation(compProg, 'uFloorY'),
      uAmbient: gl.getUniformLocation(compProg, 'uAmbient'),
      uActiveCard: gl.getUniformLocation(compProg, 'uActiveCard'),
      uActiveTint: gl.getUniformLocation(compProg, 'uActiveTint'),
      uLight: gl.getUniformLocation(compProg, 'uLight'),
      uActiveWarmth: gl.getUniformLocation(compProg, 'uActiveWarmth')
    };

    fbo = track('framebuffer',gl.createFramebuffer());
    fboTex = track('texture',gl.createTexture());
  }

  } catch(error) {stage.dataset.gpuError=error.message;gl=null;}

  let W = stage.clientWidth;
  let H = stage.clientHeight;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  const GL_SCALE = 0.72;

  function setupFBO(pw, ph) {
    if (!gl) return;
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function resize() {
    if(destroyed)return;
    W = Math.max(1,stage.clientWidth);
    H = Math.max(1,stage.clientHeight);
    stage.style.setProperty('--card-w', (W<=640?146:Math.min(240,Math.max(148,W*.164)))+'px');
    stage.style.setProperty('--card-h', (W<=640?236:Math.min(386,Math.max(238,W*.264)))+'px');
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const glW = Math.max(1, Math.round(W * GL_SCALE));
    const glH = Math.max(1, Math.round(H * GL_SCALE));
    glCanvas.width = glW;
    glCanvas.height = glH;
    fxMid.width = Math.round(W * DPR);
    fxMid.height = Math.round(H * DPR);
    fxFront.width = Math.round(W * DPR);
    fxFront.height = Math.round(H * DPR);
    setupFBO(glW, glH);
  }


  // =========================================================================
  // 2. SILKY SPRING CAROUSEL + STAGED IGNITION STATE MACHINE
  // =========================================================================
  const ELEMENTS = [
    { id: 'ember',  ambient: [0.76, 0.13, 0.08], tint: [0.85, 0.24, 0.28] },
    { id: 'solar',  ambient: [0.85, 0.52, 0.08], tint: [0.95, 0.65, 0.22] },
    { id: 'breeze', ambient: [0.06, 0.64, 0.38], tint: [0.22, 0.82, 0.56] },
    { id: 'bloom',  ambient: [0.78, 0.14, 0.46], tint: [0.92, 0.28, 0.62] }
  ];



  const initialIdx=normalizeIndex(initial.active??0);

  let activeIndex = initialIdx;
  let currentOffset = initialIdx;
  let targetOffset = initialIdx;
  let offsetVelocity = 0;

  let pointerNX = 0, pointerNY = 0;
  let smoothPX = 0, smoothPY = 0;

  const elemState = ELEMENTS.map((el, i) => ({
    id: el.id,
    warmth: i === initialIdx ? 0.15 : 0,
    ignite: i === initialIdx ? 0.05 : 0,
    igniteClock: i === initialIdx ? 0.05 : 0,
    cx: W * 0.5,
    cy: H * 0.465,
    w: 220,
    h: 350,
    scale: i === initialIdx ? 1 : 0.91,
    opacity: 1,
    burstParticles: []
  }));

  cards.forEach((c, i) => {
    const isAct = i === initialIdx;
    c.classList.toggle('is-active', isAct);
    c.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });

  const curAmbient = [...ELEMENTS[initialIdx].ambient];
  const curTint = [...ELEMENTS[initialIdx].tint];

  function wrapDelta(index, centerPos) {
    let d = (index - centerPos) % 4;
    if (d > 2) d -= 4;
    if (d < -2) d += 4;
    return d;
  }

  function spawnDisperseBurst(idx) {
    const st = elemState[idx];
    if (st.ignite < 0.12) return;
    const id = st.id;

    if (id === 'ember') {
      // Dense lingering cloud of glowing red-orange embers & crisp hollow triangles rising around crown & sides (00:01)
      const count = 78;
      for (let i = 0; i < count; i++) {
        const isCrown = i < 56;
        const x = isCrown
          ? (Math.random() - 0.5) * st.w * 1.18
          : (Math.random() < 0.5 ? -1 : 1) * st.w * (0.46 + Math.random() * 0.14);
        const y = isCrown
          ? -st.h * (0.34 + Math.random() * 0.34)
          : (Math.random() - 0.5) * st.h * 0.85;
        st.burstParticles.push({
          x, y,
          vx: (Math.random() - 0.5) * 24,
          vy: -16 - Math.random() * 44,
          swayAmp: 6 + Math.random() * 14,
          swayPhase: Math.random() * Math.PI * 2,
          size: 1.8 + Math.random() * 4.6,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 2.4,
          life: 1.0,
          decay: 0.36 + Math.random() * 0.28, // Lingers ~1.8-2.6s!
          kind: (isCrown && Math.random() < 0.34) ? 'tri' : 'emberDot'
        });
      }
    } else if (id === 'bloom') {
      // Lush wide halo of fluttering pink/rose petal confetti around the entire dark card (00:05)
      const count = 88;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const radX = st.w * (0.46 + Math.random() * 0.34);
        const radY = st.h * (0.42 + Math.random() * 0.24);
        st.burstParticles.push({
          x: Math.cos(ang) * radX,
          y: Math.sin(ang) * radY,
          vx: Math.cos(ang) * (12 + Math.random() * 34),
          vy: Math.sin(ang) * (10 + Math.random() * 28) - 8,
          swayAmp: 8 + Math.random() * 14,
          swayPhase: Math.random() * Math.PI * 2,
          size: 3.2 + Math.random() * 5.8,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 3.8,
          life: 1.0,
          decay: 0.35 + Math.random() * 0.28,
          kind: 'petal'
        });
      }
    } else if (id === 'solar') {
      // Shimmering lingering cloud of golden stardust & glowing hollow rings around the dark card (00:10)
      const count = 82;
      for (let i = 0; i < count; i++) {
        const pt = pillPerimeterPoint(Math.random(), st.w, st.h);
        const dist = st.w * (0.04 + Math.random() * 0.32);
        st.burstParticles.push({
          x: pt.x + pt.nx * dist,
          y: pt.y + pt.ny * dist,
          vx: pt.nx * (10 + Math.random() * 28),
          vy: pt.ny * (10 + Math.random() * 28),
          swayAmp: 3 + Math.random() * 6,
          swayPhase: Math.random() * Math.PI * 2,
          size: 1.5 + Math.random() * 3.8,
          rot: 0, vrot: 0,
          life: 1.0,
          decay: 0.38 + Math.random() * 0.28,
          kind: Math.random() < 0.22 ? 'ring' : 'solarDot'
        });
      }
    } else {
      // Graceful unspooling cyan-emerald curved wind-ribbon arcs & eddies around dark Breeze card (00:07 & 00:22)
      const count = 28;
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const ang = (Math.random() - 0.5) * Math.PI * 1.4 + (side < 0 ? Math.PI : 0);
        const rx = st.w * (0.50 + Math.random() * 0.30);
        const ry = st.h * (0.38 + Math.random() * 0.24);
        st.burstParticles.push({
          x: Math.cos(ang) * rx,
          y: Math.sin(ang) * ry,
          vx: Math.cos(ang) * (14 + Math.random() * 26) + 12,
          vy: Math.sin(ang) * (10 + Math.random() * 18),
          swayAmp: 5 + Math.random() * 10,
          swayPhase: Math.random() * Math.PI * 2,
          size: 26 + Math.random() * 44, // Long graceful wind arcs!
          rot: ang + Math.PI * 0.5,
          vrot: (Math.random() - 0.5) * 0.9,
          life: 1.0,
          decay: 0.40 + Math.random() * 0.26,
          kind: 'windArc'
        });
      }
    }
  }

  function selectCard(newIndex,notify=true,focus=false) {
    if(destroyed)return;
    const prevIndex = activeIndex;
    const normalized = ((newIndex % 4) + 4) % 4;
    if (normalized === prevIndex) return;

    let step = (normalized - prevIndex) % 4;
    if (step > 2) step -= 4;
    if (step < -2) step += 4;

    if(!reduced())spawnDisperseBurst(prevIndex);
    activeIndex = normalized;
    targetOffset += step;
    elemState[activeIndex].igniteClock = 0;

    syncSelection();
    if(focus)cards[activeIndex].focus({preventScroll:true});
    if(notify)options.onActiveChange?.(activeIndex);
    if(reduced())settle();
    if(reduced()||!running())renderFrame(elapsed,0);
    schedule();
  }


  function syncSelection(){
    stage.dataset.active=ELEMENTS[activeIndex].id;
    cards.forEach((card,index)=>{const active=index===activeIndex;card.classList.toggle('is-active',active);card.setAttribute('aria-pressed',String(active));card.tabIndex=active?0:-1;});
  }
  let suppressClickUntil=0,dragStartX=null,dragStartOffset=0,isDragging=false,pointerId=null,wheelCooldown=-Infinity;
  const localPoint=event=>scope.point?scope.point(event):{x:event.clientX-stage.getBoundingClientRect().left,y:event.clientY-stage.getBoundingClientRect().top};
  cards.forEach((card,index)=>{
    on(card,'click',event=>{
      if(destroyed)return;
      if(performance.now()<suppressClickUntil){event.preventDefault();return;}
      selectCard(index);
    });
    on(card,'pointermove',event=>{
      if(destroyed||reduced())return;
      const rect=card.getBoundingClientRect();
      card.style.setProperty('--mx',((event.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
      card.style.setProperty('--my',((event.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
    });
  });
  on(stage,'keydown',event=>{
    if(destroyed||event.altKey||event.ctrlKey||event.metaKey)return;
    let next=activeIndex;
    if(event.key==='ArrowRight')next++;
    else if(event.key==='ArrowLeft')next--;
    else if(event.key==='Home')next=0;else if(event.key==='End')next=3;
    else if(event.key>='1'&&event.key<='4')next=Number(event.key)-1;
    else if(event.key==='Enter'||event.key===' '){event.preventDefault();event.target.closest('.card')?.click();return;}
    else return;
    event.preventDefault();event.stopPropagation();selectCard(next,true,event.isTrusted);
  });
  on(stage,'wheel',event=>{
    if(destroyed||(!event.shiftKey&&Math.abs(event.deltaX)<=Math.abs(event.deltaY)))return;
    const now=performance.now(),delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
    if(Math.abs(delta)<=22)return;
    event.preventDefault();if(now-wheelCooldown<460)return;
    wheelCooldown=now;selectCard(activeIndex+(delta>0?1:-1));
  },{passive:false});
  on(stage,'pointerdown',event=>{
    if(destroyed||event.button!==0||!event.isPrimary)return;
    dragStartX=localPoint(event).x;dragStartOffset=currentOffset;isDragging=false;pointerId=event.pointerId;
  });
  on(stage,'pointermove',event=>{
    if(destroyed)return;
    const point=localPoint(event);
    pointerNX=(point.x/W-.5)*2;pointerNY=(point.y/H-.5)*2;
    if(dragStartX===null||event.pointerId!==pointerId)return;
    const dx=point.x-dragStartX;
    if(Math.abs(dx)>12&&!isDragging){isDragging=true;stage.setPointerCapture(pointerId);}
    if(isDragging){
      const gap=Math.min(Math.max(W*.295,cards[0].offsetWidth*1.38),455);
      currentOffset=dragStartOffset-dx/gap*.72;offsetVelocity=0;
      if(reduced()||!running())renderFrame(elapsed,0);
    }
  });
  function finishDrag(event,cancelled=false){
    if(destroyed||pointerId===null||event.pointerId!==pointerId)return;
    const dx=localPoint(event).x-dragStartX,wasDragging=isDragging;
    if(stage.hasPointerCapture(pointerId))stage.releasePointerCapture(pointerId);
    dragStartX=null;isDragging=false;pointerId=null;
    if(wasDragging){suppressClickUntil=performance.now()+350;if(!cancelled&&Math.abs(dx)>55)selectCard(activeIndex+(dx<0?1:-1));}
    if(reduced())settle();if(reduced()||!running())renderFrame(elapsed,0);schedule();
  }
  on(stage,'pointerup',event=>finishDrag(event));
  on(stage,'pointercancel',event=>finishDrag(event,true));
  on(stage,'lostpointercapture',event=>{if(pointerId!==null)finishDrag(event,true);});
  on(stage,'pointerleave',()=>{if(!destroyed&&!isDragging){pointerNX=0;pointerNY=0;}});

  function pillPerimeterPoint(t, w, h) {
    const r = w * 0.5;
    const straight = Math.max(0, h - w);
    const topArc = Math.PI * r;
    const total = 2 * topArc + 2 * straight;
    let d = ((t % 1) + 1) % 1 * total;
    const halfS = straight * 0.5;
    if (d < topArc) {
      const a = -Math.PI + (d / topArc) * Math.PI;
      return { x: Math.cos(a) * r, y: -halfS + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
    }
    d -= topArc;
    if (d < straight) return { x: r, y: -halfS + d, nx: 1, ny: 0 };
    d -= straight;
    if (d < topArc) {
      const a = (d / topArc) * Math.PI;
      return { x: Math.cos(a) * r, y: halfS + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
    }
    d -= topArc;
    return { x: -r, y: halfS - d, nx: -1, ny: 0 };
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  // True aerodynamic potential-flow dash streaks for Breeze (matching 04_breeze_active.png!)
  // Streams flow left -> right, deflecting smoothly above & below the pill, NEVER concentric circles!
  const breezeDashes = Array.from({ length: 34 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1; // top (-1) or bottom (+1) stream family
    const lane = (Math.floor(i / 2) / 17); // 0 (close to pill) -> 1 (outer wind tunnel)
    return {
      side,
      psiTarget: side * (0.48 + lane * 0.62), // vertical streamline lane
      phase: (i * 0.371) % 1,
      speed: 0.36 + (i % 5) * 0.08,
      len: 0.28 + ((i * 29) % 100) / 100 * 0.34,
      thick: i % 3 === 0 ? 1.85 : 1.15,
      bright: i % 2 === 0
    };
  });

  const emberSparks = Array.from({ length: 74 }, (_, i) => ({
    phase: (i * 0.6180339) % 1,
    speed: 0.30 + (i % 7) * 0.055,
    xOff: ((i * 37) % 100) / 100 - 0.5,
    swayAmp: 7 + (i % 5) * 3.5,
    swayFreq: 1.8 + (i % 4) * 0.7,
    size: 1.2 + (i % 6) * 0.60,
    isTri: i % 6 === 0,
    rotSpeed: (i % 2 === 0 ? 1 : -1) * (1.2 + (i % 3) * 0.8),
    sideSpark: i > 52
  }));

  const solarMotes = Array.from({ length: 68 }, (_, i) => ({
    t: (i * 0.6180339) % 1,
    phase: (i * 0.317) % 1,
    speed: 0.14 + (i % 5) * 0.045,
    maxDist: 0.18 + ((i * 23) % 100) / 100 * 0.50,
    size: 1.1 + (i % 5) * 0.70,
    isRing: i % 7 === 0
  }));

  const bloomPollen = Array.from({ length: 48 }, (_, i) => ({
    phase: (i * 0.6180339) % 1,
    speed: 0.16 + (i % 6) * 0.04,
    xOff: ((i * 43) % 100) / 100 - 0.5,
    size: 1.3 + (i % 5) * 0.75,
    topCrown: i < 32
  }));

  // Map (xNorm in [-1.5, 1.5], psiTarget) onto an aerodynamic streamline curving around the pill
  function breezeStreamPoint(xNorm, psiTarget, st, time, windStage) {
    // Deflection bump pushes streamline smoothly above/below the pill dome as |x| approaches 0
    const domeBump = Math.exp(-xNorm * xNorm * 1.45);
    const signY = psiTarget >= 0 ? 1 : -1;
    const baseAbsY = Math.abs(psiTarget);
    // Pill dome height in width-normalized units is ~0.80
    const yNorm = signY * (baseAbsY * (0.58 + 0.42 * windStage) + domeBump * (0.48 - baseAbsY * 0.18) * windStage);
    // Gentle wind flutter
    const flutter = Math.sin(xNorm * 3.8 - time * 3.2 + psiTarget * 5.0) * 0.025 * windStage;
    return {
      x: st.cx + xNorm * st.w * (0.72 + 0.28 * windStage),
      y: st.cy + (yNorm + flutter) * st.w
    };
  }

  function drawMidFilaments(time) {
    ctxM.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctxM.clearRect(0, 0, W, H);
    const st = elemState[2];
    const windStage = smoothstep(0.24, 1.0, st.ignite);
    if (windStage <= 0.01) return;

    ctxM.save();
    ctxM.globalCompositeOperation = 'lighter';
    ctxM.lineCap = 'round';

    for (const d of breezeDashes) {
      // Travel from left (-1.28) to right (+1.28) smoothly
      const progress = (d.phase + time * d.speed) % 1;
      const xHead = -1.25 + progress * 2.50;
      const xTail = xHead - d.len * (0.45 + 0.55 * windStage);

      // Fade in on left entry, brightest while sweeping past pill, fade out on right exit
      const alphaEnv = Math.sin(progress * Math.PI) * windStage;
      if (alphaEnv <= 0.02) continue;

      const steps = 12;
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        const xNorm = xTail + (xHead - xTail) * (k / steps);
        pts.push(breezeStreamPoint(xNorm, d.psiTarget, st, time, windStage));
      }

      const g = ctxM.createLinearGradient(pts[0].x, pts[0].y, pts[steps].x, pts[steps].y);
      g.addColorStop(0, 'rgba(120, 255, 215, 0)');
      g.addColorStop(0.35, d.bright
        ? `rgba(225, 255, 245, ${0.92 * alphaEnv})`
        : `rgba(85, 245, 188, ${0.65 * alphaEnv})`);
      g.addColorStop(0.80, `rgba(175, 255, 232, ${0.72 * alphaEnv})`);
      g.addColorStop(1, 'rgba(50, 210, 150, 0)');

      ctxM.strokeStyle = g;
      ctxM.lineWidth = d.thick;
      ctxM.beginPath();
      ctxM.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < steps; k++) {
        ctxM.quadraticCurveTo(pts[k].x, pts[k].y, (pts[k].x + pts[k + 1].x) * 0.5, (pts[k].y + pts[k + 1].y) * 0.5);
      }
      ctxM.stroke();
    }

    // 3 delicate glowing curled wind-eddy wisps near bottom-left & upper-right (matching 04_breeze_active.png)
    const eddies = [
      { ox: -0.68, oy: 0.34, ph: 0.2 },
      { ox: -0.58, oy: 0.50, ph: 1.9 },
      { ox:  0.66, oy: -0.32, ph: 3.4 }
    ];
    for (const ed of eddies) {
      const pulse = (0.55 + 0.45 * Math.sin(time * 2.2 + ed.ph)) * windStage;
      const ex = st.cx + ed.ox * st.w + Math.sin(time * 1.6 + ed.ph) * 6;
      const ey = st.cy + ed.oy * st.h + Math.cos(time * 1.4 + ed.ph) * 5;
      ctxM.strokeStyle = `rgba(195, 255, 238, ${0.75 * pulse})`;
      ctxM.lineWidth = 1.3;
      ctxM.beginPath();
      ctxM.moveTo(ex - 4, ey - 7);
      ctxM.bezierCurveTo(ex + 5, ey - 2, ex - 6, ey + 3, ex + 4, ey + 8);
      ctxM.stroke();
    }

    ctxM.restore();
  }

  function drawFrontParticles(time, dt) {
    ctxF.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctxF.clearRect(0, 0, W, H);
    ctxF.save();
    ctxF.globalCompositeOperation = 'lighter';

    const eSt = elemState[0];
    const emberSparkStage = smoothstep(0.22, 0.92, eSt.ignite);
    if (emberSparkStage > 0.01) {
      for (const sp of emberSparks) {
        const p = (time * sp.speed + sp.phase) % 1;
        const fade = Math.sin(p * Math.PI) * emberSparkStage;
        if (fade <= 0.01) continue;
        let sx, sy;
        if (sp.sideSpark) {
          const side = sp.xOff >= 0 ? 1 : -1;
          sx = eSt.cx + side * (eSt.w * 0.49 + Math.sin(time * 2 + sp.phase * 10) * 7);
          sy = eSt.cy + eSt.h * 0.30 - p * eSt.h * 0.72;
        } else {
          sx = eSt.cx + sp.xOff * eSt.w * 0.88 + Math.sin(time * sp.swayFreq + sp.phase * 12) * sp.swayAmp;
          sy = eSt.cy - eSt.h * 0.42 - p * eSt.h * 0.38 * emberSparkStage;
        }
        if (sp.isTri && !sp.sideSpark) {
          ctxF.save();
          ctxF.translate(sx, sy);
          ctxF.rotate(time * sp.rotSpeed + sp.phase * 6);
          const ts = sp.size * 1.9;
          ctxF.strokeStyle = `rgba(255, 224, 198, ${0.88 * fade})`;
          ctxF.lineWidth = 1.2;
          ctxF.beginPath();
          ctxF.moveTo(0, -ts);
          ctxF.lineTo(ts * 0.88, ts * 0.75);
          ctxF.lineTo(-ts * 0.88, ts * 0.75);
          ctxF.closePath();
          ctxF.stroke();
          ctxF.restore();
        } else {
          ctxF.fillStyle = `rgba(255, 230, 198, ${0.9 * fade})`;
          ctxF.beginPath();
          ctxF.arc(sx, sy, sp.size * (1 - p * 0.35), 0, Math.PI * 2);
          ctxF.fill();
        }
      }
    }

    const sSt = elemState[1];
    const solarMoteStage = smoothstep(0.32, 1.0, sSt.ignite);
    if (solarMoteStage > 0.01) {
      for (const m of solarMotes) {
        const p = (time * m.speed + m.phase) % 1;
        const fade = Math.sin(p * Math.PI) * solarMoteStage;
        if (fade <= 0.01) continue;
        const pt = pillPerimeterPoint(m.t + Math.sin(time * 0.4 + m.phase * 6) * 0.015, sSt.w, sSt.h);
        const dist = (0.03 + p * m.maxDist * solarMoteStage) * sSt.w;
        const mx = sSt.cx + pt.x + pt.nx * dist;
        const my = sSt.cy + pt.y + pt.ny * dist;
        if (m.isRing) {
          ctxF.strokeStyle = `rgba(255, 244, 192, ${0.90 * fade})`;
          ctxF.lineWidth = 1.3;
          ctxF.beginPath();
          ctxF.arc(mx, my, m.size * 1.15, 0, Math.PI * 2);
          ctxF.stroke();
        } else {
          ctxF.fillStyle = `rgba(255, 246, 198, ${0.90 * fade})`;
          ctxF.beginPath();
          ctxF.arc(mx, my, m.size * (0.68 + 0.32 * fade), 0, Math.PI * 2);
          ctxF.fill();
        }
      }
    }

    const bSt = elemState[3];
    const bloomPollenStage = smoothstep(0.35, 1.0, bSt.ignite);
    if (bloomPollenStage > 0.01) {
      for (const fl of bloomPollen) {
        const p = (time * fl.speed + fl.phase) % 1;
        const fade = Math.sin(p * Math.PI) * bloomPollenStage;
        if (fade <= 0.01) continue;
        const fx = bSt.cx + fl.xOff * bSt.w * (fl.topCrown ? 0.78 : 1.1) + Math.sin(time * 1.8 + fl.phase * 10) * 8;
        const fy = fl.topCrown
          ? bSt.cy - bSt.h * 0.44 - p * bSt.h * 0.18
          : bSt.cy + bSt.h * 0.45 + Math.sin(p * Math.PI) * 14;
        ctxF.fillStyle = `rgba(255, 226, 244, ${0.88 * fade})`;
        ctxF.beginPath();
        ctxF.arc(fx, fy, fl.size * (0.75 + 0.25 * fade), 0, Math.PI * 2);
        ctxF.fill();
      }
    }

    for (const st of elemState) {
      const list = st.burstParticles;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += (p.vx + Math.sin(time * 2.4 + p.swayPhase) * p.swayAmp) * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.rot += p.vrot * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) { list.splice(i, 1); continue; }

        const sx = st.cx + p.x;
        const sy = st.cy + p.y;
        // Smooth fade-out curve with subtle twinkle
        const twinkle = 0.78 + 0.22 * Math.sin(time * 6.5 + p.swayPhase * 3.0);
        const alpha = Math.pow(Math.min(1, p.life * 1.15), 1.35) * twinkle;

        if (p.kind === 'tri') {
          ctxF.save();
          ctxF.translate(sx, sy);
          ctxF.rotate(p.rot);
          ctxF.strokeStyle = `rgba(255, 138, 96, ${0.92 * alpha})`;
          ctxF.lineWidth = 1.25;
          ctxF.beginPath();
          ctxF.moveTo(0, -p.size);
          ctxF.lineTo(p.size * 0.88, p.size * 0.72);
          ctxF.lineTo(-p.size * 0.88, p.size * 0.72);
          ctxF.closePath();
          ctxF.stroke();
          ctxF.restore();
        } else if (p.kind === 'emberDot') {
          ctxF.fillStyle = `rgba(255, 118, 62, ${0.92 * alpha})`;
          ctxF.beginPath();
          ctxF.arc(sx, sy, p.size * (0.45 + 0.35 * p.life), 0, Math.PI * 2);
          ctxF.fill();
        } else if (p.kind === 'petal') {
          ctxF.save();
          ctxF.translate(sx, sy);
          ctxF.rotate(p.rot);
          // Two-tone glowing pink petal fragment
          ctxF.fillStyle = `rgba(255, 122, 186, ${0.88 * alpha})`;
          ctxF.beginPath();
          ctxF.ellipse(0, 0, p.size * 0.44, p.size * 0.95, 0, 0, Math.PI * 2);
          ctxF.fill();
          ctxF.strokeStyle = `rgba(255, 224, 240, ${0.55 * alpha})`;
          ctxF.lineWidth = 0.8;
          ctxF.stroke();
          ctxF.restore();
        } else if (p.kind === 'ring') {
          ctxF.strokeStyle = `rgba(255, 226, 132, ${0.90 * alpha})`;
          ctxF.lineWidth = 1.25;
          ctxF.beginPath();
          ctxF.arc(sx, sy, p.size * (0.85 + 0.25 * (1 - p.life)), 0, Math.PI * 2);
          ctxF.stroke();
        } else if (p.kind === 'solarDot') {
          ctxF.fillStyle = `rgba(255, 218, 112, ${0.92 * alpha})`;
          ctxF.beginPath();
          ctxF.arc(sx, sy, p.size * (0.42 + 0.38 * p.life), 0, Math.PI * 2);
          ctxF.fill();
        } else if (p.kind === 'windArc') {
          ctxF.save();
          ctxF.translate(sx, sy);
          ctxF.rotate(p.rot);
          const half = p.size * 0.5;
          const g = ctxF.createLinearGradient(-half, 0, half, 0);
          g.addColorStop(0, 'rgba(80, 235, 178, 0)');
          g.addColorStop(0.45, `rgba(145, 255, 222, ${0.78 * alpha})`);
          g.addColorStop(1, 'rgba(40, 195, 138, 0)');
          ctxF.strokeStyle = g;
          ctxF.lineWidth = 1.4;
          ctxF.lineCap = 'round';
          ctxF.beginPath();
          ctxF.moveTo(-half, 0);
          ctxF.quadraticCurveTo(0, -p.size * 0.22, half, 0);
          ctxF.stroke();
          ctxF.restore();
        }
      }
    }
    ctxF.restore();
  }

  // =========================================================================
  // 4. MAIN 60FPS PHYSICS & CHOREOGRAPHY LOOP
  // =========================================================================
  function renderFrame(time,dt){
    if(destroyed)return;
    if (!isDragging) {
      const stiffness = 78;
      const damping = 16.5;
      const force = (targetOffset - currentOffset) * stiffness;
      offsetVelocity = (offsetVelocity + force * dt) * Math.exp(-damping * dt);
      currentOffset += offsetVelocity * dt;
      if (Math.abs(targetOffset - currentOffset) < 0.0003 && Math.abs(offsetVelocity) < 0.0003) {
        currentOffset = targetOffset;
        offsetVelocity = 0;
      }
    }

    const pLerp = 1 - Math.exp(-6.0 * dt);
    smoothPX += (pointerNX - smoothPX) * pLerp;
    smoothPY += (pointerNY - smoothPY) * pLerp;

    const baseW = cards[0].offsetWidth || 220;
    const baseH = cards[0].offsetHeight || 350;
    const gap = Math.min(Math.max(W * 0.295, baseW * 1.38), 455);

    for (let i = 0; i < 4; i++) {
      const delta = wrapDelta(i, currentOffset);
      const absD = Math.abs(delta);
      const x = delta * gap;
      const scale = 1 - Math.min(absD, 1.4) * 0.085;
      const opacity = absD <= 1.12 ? 1 : Math.max(0, 1 - (absD - 1.12) * 1.9);
      const zIndex = Math.round(10 - absD * 3);

      const st = elemState[i];
      st.cx = W * 0.5 + x;
      st.cy = H * 0.465;
      st.w = baseW * scale;
      st.h = baseH * scale;
      st.scale = scale;
      st.opacity = opacity;

      const isTarget = i === activeIndex;
      if(reduced()){st.warmth=isTarget?1:0;st.ignite=isTarget?1:0;st.igniteClock=isTarget?1:0;}
      if (isTarget) {
        const arrival = smoothstep(0.42, 0.06, absD);
        if (arrival > 0.02) {
          st.igniteClock = Math.min(1, st.igniteClock + dt * 0.98 * (0.35 + 0.65 * arrival));
        }
        const targetWarmth = smoothstep(0.0, 0.52, st.igniteClock) * arrival;
        const targetIgnite = smoothstep(0.08, 1.0, st.igniteClock) * arrival;
        const upRate = 1 - Math.exp(-9.0 * dt);
        st.warmth += (targetWarmth - st.warmth) * upRate;
        st.ignite += (targetIgnite - st.ignite) * upRate;
      } else {
        st.igniteClock = 0;
        // Graceful cinematic retraction: shader shrinks smoothly while lingering particles dissolve
        const downWarmth = 1 - Math.exp(-3.4 * dt);
        const downIgnite = 1 - Math.exp(-4.2 * dt);
        st.warmth *= (1 - downWarmth);
        st.ignite *= (1 - downIgnite);
        if (st.warmth < 0.002) st.warmth = 0;
        if (st.ignite < 0.002) st.ignite = 0;
      }

      const tiltWeight = st.ignite * (1 - Math.min(1, absD * 2));
      const rotY = smoothPX * 4.2 * tiltWeight;
      const rotX = -smoothPY * 3.2 * tiltWeight;

      const cardEl = cards[i];
      cardEl.style.transform =
        `translate3d(${x.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)}) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
      cardEl.style.opacity = opacity.toFixed(3);
      cardEl.style.zIndex = String(zIndex);
      cardEl.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
      cardEl.setAttribute('aria-hidden',String(opacity<=.25));
      cardEl.inert=opacity<=.25;
      cardEl.style.setProperty('--warmth', st.warmth.toFixed(4));
      cardEl.style.setProperty('--ignite', st.ignite.toFixed(4));
      cardEl.classList.toggle('is-ignited', st.warmth > 0.45);
    }

    const activeSt = elemState[activeIndex];
    const targetAmb = ELEMENTS[activeIndex].ambient;
    const targetTint = ELEMENTS[activeIndex].tint;
    const ambStrength = 0.25 + 0.75 * activeSt.warmth;
    const lerpRate = 1 - Math.exp(-3.8 * dt);
    for (let k = 0; k < 3; k++) {
      curAmbient[k] += (targetAmb[k] * ambStrength - curAmbient[k]) * lerpRate;
      curTint[k] += (targetTint[k] - curTint[k]) * lerpRate;
    }

    if (gl) {
      const pw = glCanvas.width;
      const ph = glCanvas.height;
      const toGL = (st) => [st.cx * GL_SCALE, (H - st.cy) * GL_SCALE, st.w * GL_SCALE, st.h * GL_SCALE];

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, pw, ph);
      gl.useProgram(vfxProg);
      gl.bindVertexArray(quadVao);
      gl.uniform2f(uVfx.uRes, pw, ph);
      gl.uniform1f(uVfx.uTime, time);
      gl.uniform4fv(uVfx.uCard0, toGL(elemState[0]));
      gl.uniform4fv(uVfx.uCard1, toGL(elemState[1]));
      gl.uniform4fv(uVfx.uCard2, toGL(elemState[2]));
      gl.uniform4fv(uVfx.uCard3, toGL(elemState[3]));
      gl.uniform4f(uVfx.uInt, elemState[0].ignite, elemState[1].ignite, elemState[2].ignite, elemState[3].ignite);
      gl.uniform3fv(uVfx.uAmbient, curAmbient);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, pw, ph);
      gl.useProgram(compProg);
      gl.bindVertexArray(quadVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboTex);
      gl.uniform1i(uComp.uScene, 0);
      gl.uniform2f(uComp.uRes, pw, ph);
      gl.uniform1f(uComp.uTime, time);
      gl.uniform1f(uComp.uLight,options.theme==='light'?1:0);
      const floorPxFromTop = activeSt.cy + activeSt.h * 0.72;
      const floorYNorm = Math.max(0.05, Math.min(0.45, 1.0 - floorPxFromTop / H));
      gl.uniform1f(uComp.uFloorY, floorYNorm);
      gl.uniform3fv(uComp.uAmbient, curAmbient);
      gl.uniform4fv(uComp.uActiveCard, toGL(activeSt));
      gl.uniform3fv(uComp.uActiveTint, curTint);
      gl.uniform1f(uComp.uActiveWarmth, activeSt.warmth);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if(!gl&&fallbackContext){
      const ctx=fallbackContext;ctx.fillStyle=options.theme==='light'?'#f4f4f4':'#040405';ctx.fillRect(0,0,glCanvas.width,glCanvas.height);
    }
    drawMidFilaments(time);
    drawFrontParticles(time, dt);
    stage.dataset.time=elapsed.toFixed(3);stage.dataset.offset=currentOffset.toFixed(4);
    stage.dataset.ignite=elemState[activeIndex].ignite.toFixed(4);
    stage.dataset.bursts=String(elemState.reduce((sum,state)=>sum+state.burstParticles.length,0));
    stage.dataset.ready='true';
  }

  function settle(){
    currentOffset=targetOffset;offsetVelocity=0;pointerNX=0;pointerNY=0;smoothPX=0;smoothPY=0;
    elemState.forEach((state,index)=>{state.warmth=index===activeIndex?1:0;state.ignite=state.warmth;state.igniteClock=state.warmth;state.burstParticles.length=0;});
    curAmbient.splice(0,3,...ELEMENTS[activeIndex].ambient);curTint.splice(0,3,...ELEMENTS[activeIndex].tint);
  }
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
  function schedule(){if(!destroyed&&running()&&raf===null)raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=null;if(destroyed||!running())return;
    const delta=lastTime===null?0:Math.max(0,now-lastTime);lastTime=now;elapsed+=delta/1000;
    renderFrame(elapsed,Math.min(.05,delta/1000));schedule();
  }
  function syncPlayback(){
    if(destroyed)return;stop();stage.dataset.paused=String(Boolean(options.paused)||document.hidden);stage.dataset.reduced=String(reduced());
    if(reduced())settle();renderFrame(elapsed,0);schedule();
  }
  function handleResize(){resize();if(reduced())settle();renderFrame(elapsed,0);}
  const observer=new scope.ResizeObserver(handleResize);observer.observe(stage);
  on(document,'visibilitychange',syncPlayback);on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',syncPlayback);
  stage.dataset.renderer=gl?'webgl2':'canvas2d';stage.dataset.theme=options.theme==='light'?'light':'dark';
  syncSelection();resize();syncPlayback();
  return {
    update(next={}){
      if(destroyed)return;options={...options,...next};
      if(Object.hasOwn(next,'active'))selectCard(normalizeIndex(next.active),false);
      stage.dataset.theme=options.theme==='light'?'light':'dark';syncPlayback();
    },
    destroy(){
      if(destroyed)return;destroyed=true;stop();observer.disconnect();
      if(pointerId!==null&&stage.hasPointerCapture(pointerId))stage.releasePointerCapture(pointerId);
      elemState.forEach(state=>state.burstParticles.length=0);stage.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
      if(gpuContext){for(const {kind,value} of resources)gpuContext['delete'+kind[0].toUpperCase()+kind.slice(1)](value);gpuContext.getExtension('WEBGL_lose_context')?.loseContext();}
      resources.length=0;[glCanvas,fxMid,fxFront].forEach(canvas=>{canvas.width=1;canvas.height=1;});
    },
  };

}
