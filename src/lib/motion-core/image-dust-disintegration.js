/* Supplied HTML adaptation. Design reference: @Irakkkl.
   No separate source or embedded-photo license was supplied or verified. */
import {PORTRAIT_SRC} from './image-dust-disintegration-assets.mjs';

export function createImageDustDisintegration(scope, initial={}) {
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame}=scope;
  const root=document.getElementById('imageDustDisintegration');
  const rectOf=node=>scope.rect?scope.rect(node):node.getBoundingClientRect();
  const cardShell = document.getElementById('cardShell');
  const card = document.getElementById('card');
  const photoSharp = document.getElementById('photoSharp');
  const cardPhoto = document.getElementById('cardPhoto');
  const revealCanvas = document.getElementById('revealCanvas');
  const loaderHud = document.getElementById('loaderHud');
  const ringProgress = document.getElementById('ringProgress');
  const ringPercent = document.getElementById('ringPercent');
  const loaderStatus = document.getElementById('loaderStatus');
  const auroraCanvas = document.getElementById('auroraCanvas');
  const dustCanvas = document.getElementById('dustCanvas');
  const btnLike = document.getElementById('btnLike');
  const btnRegenerate = document.getElementById('btnRegenerate');
  const btnDownload = document.getElementById('btnDownload');
  const btnDelete = document.getElementById('btnDelete');
  const restoreWrap = document.getElementById('restoreWrap');
  const btnRestore = document.getElementById('btnRestore');
  const toastEl = document.getElementById('toast');

  const dustCtx = dustCanvas.getContext('2d');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 27;
  const AURORA_PAD = 34;
  const LOAD_DURATION = 4050;
  const REVEAL_DURATION = 1650;


  let options={...initial},state='idle',isLiked=Boolean(initial.liked),destroyed=false,initialized=false;
  let raf=null,phaseElapsed=0,lastTime=null,dustFrame=null,toastTimer=null,returnFocus=false;
  const contexts=new Set(),resources=[];
  const track=(ctx,kind,value)=>{resources.push({ctx,kind,value});return value;};
  const buttons=[btnLike,btnRegenerate,btnDownload,btnDelete];
  const reduced=()=>scope.reduced();
  const running=()=>!options.paused&&!document.hidden&&!reduced();
  let gl=null,glProgram=null,glUniforms=null,fallback2dCtx=null;
  const VERT_SRC = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const AURORA_FRAG_SRC = `
    precision highp float;

    uniform vec2 u_res;
    uniform vec2 u_cardSize;
    uniform float u_radius;
    uniform float u_time;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.04 + vec2(13.1, 7.7);
        a *= 0.5;
      }
      return v;
    }

    float sdRoundBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    float starField(vec2 uv, float scale, float time, float seed) {
      vec2 gv = uv * scale;
      vec2 id = floor(gv);
      vec2 f = fract(gv) - 0.5;
      float h = hash21(id + seed);
      if (h < 0.78) return 0.0;
      vec2 off = vec2(hash21(id * 1.7 + 3.1), hash21(id * 2.3 + 9.4)) - 0.5;
      float dist = length(f - off * 0.68);
      float size = mix(0.045, 0.11, fract(h * 17.3));
      float core = smoothstep(size, 0.0, dist);
      float twinkle = 0.52 + 0.48 * sin(time * (2.2 + fract(h * 31.1) * 3.8) + h * 62.8);
      return core * core * twinkle * mix(0.35, 1.0, fract(h * 9.7));
    }

    void main() {
      vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
      vec2 p = frag - u_res * 0.5;
      vec2 halfCard = u_cardSize * 0.5;
      vec2 nuv = p / u_cardSize + 0.5;

      float t = u_time;
      float waveT = clamp((t - 0.10) / 2.60, 0.0, 1.0);
      float waveEase = 1.0 - pow(1.0 - waveT, 1.25);
      float waveR = mix(-0.14, 1.68, waveEase);

      float waveIn = smoothstep(0.08, 0.42, t);
      float waveOut = 1.0 - smoothstep(2.05, 2.95, t);
      float waveStrength = waveIn * waveOut;

      vec2 origin = vec2(-0.12, -0.10);
      vec2 rel = (nuv - origin) * vec2(1.0, 0.86);
      float r = length(rel);
      vec2 dir = rel / max(r, 0.0001);

      float n1 = fbm(nuv * 2.8 + vec2(t * 0.25, -t * 0.18));
      float n2 = fbm(nuv * 5.4 - vec2(t * 0.35, t * 0.22));
      float rippleWarp = (n1 - 0.5) * 0.22 + (n2 - 0.5) * 0.08;
      float d = (r + rippleWarp) - waveR;

      float envEdge = exp(-d * d * 22.0) * waveStrength;
      float waveDisp = (sin(d * 14.0) * 0.55 + 0.72) * envEdge;
      float dispPx = waveDisp * (u_cardSize.x * 0.042);
      vec2 warpedP = p - dir * dispPx;

      float sdf = sdRoundBox(warpedP, halfCard, u_radius);
      float cardMask = 1.0 - smoothstep(-0.85, 0.85, sdf);
      if (cardMask <= 0.001) {
        gl_FragColor = vec4(0.0);
        return;
      }

      vec3 col = vec3(0.106, 0.106, 0.110);

      if (waveStrength > 0.002) {
        float arcFlow = 0.68 + 0.52 * fbm(nuv * 3.6 + vec2(-t * 0.4, t * 0.3));
        float fineSilk = 0.78 + 0.35 * sin((nuv.x * 6.5 - nuv.y * 5.2) + n1 * 5.0 - t * 2.2);

        float bTeal = exp(-pow(d - 0.15, 2.0) / 0.032);
        float bCyan = exp(-pow(d - 0.02, 2.0) / 0.014);
        float bCore = exp(-pow(d + 0.01, 2.0) / 0.0042) * fineSilk;
        float bViolet = exp(-pow(d + 0.06, 2.0) / 0.018);
        float bMagenta = exp(-pow(d + 0.14, 2.0) / 0.024);
        float bGold = exp(-pow(d + 0.21, 2.0) / 0.028) * (0.55 + 0.45 * n2);

        vec3 prism = vec3(0.0);
        prism += vec3(0.14, 0.62, 0.66) * bTeal * 0.78;
        prism += vec3(0.32, 0.86, 0.98) * bCyan * 1.05;
        prism += vec3(0.92, 0.96, 1.00) * bCore * 0.62;
        prism += vec3(0.52, 0.42, 0.98) * bViolet * 0.92;
        prism += vec3(0.92, 0.30, 0.74) * bMagenta * 0.88;
        prism += vec3(0.94, 0.58, 0.24) * bGold * 0.70;

        float wideGlow = exp(-d * d * 5.5);
        prism += mix(vec3(0.26, 0.48, 0.72), vec3(0.68, 0.28, 0.56), smoothstep(0.18, -0.22, d)) * wideGlow * 0.34;

        vec3 addCol = prism * arcFlow * waveStrength * 0.88;
        col = 1.0 - (1.0 - col) * (1.0 - clamp(addCol, 0.0, 0.95));
      }

      float wakeMask = smoothstep(0.16, -0.06, d);
      float starGlobal = smoothstep(0.25, 0.65, t) * (1.0 - smoothstep(2.75, 3.85, t));
      if (wakeMask > 0.01 && starGlobal > 0.01) {
        vec2 starUv = warpedP / u_cardSize.x + 0.5;
        float s1 = starField(starUv, 18.0, t, 1.3);
        float s2 = starField(starUv + vec2(0.17, 0.31), 34.0, t, 7.9);
        float s3 = starField(starUv + vec2(0.41, 0.13), 58.0, t, 19.4) * 0.65;
        float stars = s1 + s2 + s3;
        float crestBoost = 1.0 + 1.35 * exp(-d * d * 24.0) * waveStrength;
        vec3 starCol = mix(vec3(0.86, 0.93, 1.0), vec3(1.0, 0.92, 0.85), hash21(floor(starUv * 34.0)));
        col += starCol * stars * wakeMask * starGlobal * crestBoost * 0.85;
      }

      float rim = smoothstep(-2.4, -0.3, sdf) * (1.0 - smoothstep(-0.3, 0.7, sdf));
      col += vec3(1.0) * rim * (0.045 + 0.16 * envEdge);

      gl_FragColor = vec4(col * cardMask, cardMask);
    }
  `;

  let rgl = null;
  let rProgram = null;
  let rUniforms = null;
  let rTexture = null;
  let rTextureReady = false;

  const REVEAL_FRAG_SRC = `
    precision highp float;

    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_texSize;
    uniform float u_progress;

    float hash21(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 34.5);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.03 + vec2(9.2, 5.4);
        a *= 0.5;
      }
      return v;
    }

    // object-fit: cover UV mapping
    vec2 coverUv(vec2 uv, vec2 res, vec2 texSize) {
      float canvasAspect = res.x / max(res.y, 1.0);
      float texAspect = texSize.x / max(texSize.y, 1.0);
      vec2 scale = vec2(1.0);
      if (canvasAspect > texAspect) {
        scale.y = texAspect / canvasAspect;
      } else {
        scale.x = canvasAspect / texAspect;
      }
      return (uv - 0.5) * scale + 0.5;
    }

    void main() {
      vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);
      vec2 baseUv = coverUv(uv, u_res, u_texSize);
      float p = clamp(u_progress, 0.0, 1.0);

      // Organic diagonal + cloud-noise focus wave sweeping top-left -> face -> bottom-right
      float cloud = fbm(uv * 2.8 + vec2(0.4, -p * 0.45));
      float cloudFine = fbm(uv * 5.2 - vec2(p * 0.3, 0.7));
      float waveField = uv.x * 0.44 + uv.y * 0.72 + (cloud - 0.5) * 0.42 + (cloudFine - 0.5) * 0.14;

      // Smooth ease-out front progression
      float easeP = 1.0 - pow(1.0 - p, 1.9);
      float focusFront = mix(-0.48, 1.62, easeP);

      // Continuous per-pixel optical defocus [0.0 = razor sharp, 1.0 = thick dreamy bokeh blur]
      float localBlur = smoothstep(focusFront - 0.46, focusFront + 0.34, waveField);

      // Global initial soft-focus floor so the entire photo begins deeply blurred then pulls into focus
      float globalFloor = (1.0 - smoothstep(0.0, 0.45, p)) * 0.65;
      float blurAmt = clamp(max(localBlur, globalFloor), 0.0, 1.0);

      // Slightly zoom out (1.035 -> 1.0) as the lens locks into focus
      float zoom = 1.0 + blurAmt * 0.032;
      vec2 sampleCenter = (baseUv - 0.5) / zoom + 0.5;

      // Golden-angle Vogel disk optical bokeh sampling (28 taps) with continuous variable radius!
      vec3 col = vec3(0.0);
      float totalW = 0.0;
      float maxRadius = 0.092; // ~32-36px optical blur at blurAmt = 1.0
      float rad = blurAmt * blurAmt * maxRadius + blurAmt * 0.012;
      vec2 aspectFix = vec2(1.0, u_res.x / max(u_res.y, 1.0));
      float rotSeed = hash21(gl_FragCoord.xy * 0.5) * 6.28318;

      if (rad < 0.0005) {
        col = texture2D(u_tex, clamp(sampleCenter, 0.001, 0.999)).rgb;
      } else {
        const int TAPS = 28;
        for (int i = 0; i < TAPS; i++) {
          float fi = (float(i) + 0.5) / float(TAPS);
          float rTap = sqrt(fi) * rad;
          float theta = float(i) * 2.3999632 + rotSeed;
          vec2 off = vec2(cos(theta), sin(theta)) * rTap * aspectFix;
          // Slight chromatic softening at heavy blur edges
          vec2 sUv = clamp(sampleCenter + off, 0.002, 0.998);
          float w = 1.0 - 0.35 * fi;
          col += texture2D(u_tex, sUv).rgb * w;
          totalW += w;
        }
        col /= max(totalW, 0.0001);
      }

      // Dreamy dark atmospheric veil in heavily blurred zones (matches reveal_16frames.png)
      vec3 darkBase = vec3(0.106, 0.106, 0.110);
      vec3 mistTint = mix(vec3(0.18, 0.16, 0.22), vec3(0.32, 0.35, 0.42), cloud);
      col = mix(col, mix(col * 0.72, mistTint, 0.36), blurAmt * 0.68);

      // Smooth fade in from dark loading surface (#1b1b1b) at the very start of reveal
      float fadeIn = smoothstep(0.0, 0.22, p);
      col = mix(darkBase, col, fadeIn);

      gl_FragColor = vec4(col, fadeIn);
    }
  `;

  function compileShader(ctx, type, src) {
    const sh = track(ctx,'shader',ctx.createShader(type));
    ctx.shaderSource(sh, src);
    ctx.compileShader(sh);
    if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
      
      return null;
    }
    return sh;
  }

  function initWebGLAurora() {
    try {
      gl = auroraCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
      if (gl) contexts.add(gl);
      if (!gl) {
        fallback2dCtx = auroraCanvas.getContext('2d');
        return;
      }
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, AURORA_FRAG_SRC);
      if (!vs || !fs) {
        gl = null;
        fallback2dCtx = auroraCanvas.getContext('2d');
        return;
      }
      glProgram = track(gl,'program',gl.createProgram());
      gl.attachShader(glProgram, vs);
      gl.attachShader(glProgram, fs);
      gl.linkProgram(glProgram);
      if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        gl = null;
        fallback2dCtx = auroraCanvas.getContext('2d');
        return;
      }
      const buf = track(gl,'buffer',gl.createBuffer());
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(glProgram, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      glUniforms = {
        res: gl.getUniformLocation(glProgram, 'u_res'),
        cardSize: gl.getUniformLocation(glProgram, 'u_cardSize'),
        radius: gl.getUniformLocation(glProgram, 'u_radius'),
        time: gl.getUniformLocation(glProgram, 'u_time')
      };
    } catch {
      gl = null;
      fallback2dCtx = auroraCanvas.getContext('2d');
    }
  }

  function uploadRevealTexture() {
    if (!rgl || !cardPhoto.complete || !cardPhoto.naturalWidth) return;
    if (!rTexture) {
      rTexture = track(rgl,'texture',rgl.createTexture());
    }
    rgl.bindTexture(rgl.TEXTURE_2D, rTexture);
    rgl.texParameteri(rgl.TEXTURE_2D, rgl.TEXTURE_WRAP_S, rgl.CLAMP_TO_EDGE);
    rgl.texParameteri(rgl.TEXTURE_2D, rgl.TEXTURE_WRAP_T, rgl.CLAMP_TO_EDGE);
    rgl.texParameteri(rgl.TEXTURE_2D, rgl.TEXTURE_MIN_FILTER, rgl.LINEAR);
    rgl.texParameteri(rgl.TEXTURE_2D, rgl.TEXTURE_MAG_FILTER, rgl.LINEAR);
    rgl.texImage2D(rgl.TEXTURE_2D, 0, rgl.RGBA, rgl.RGBA, rgl.UNSIGNED_BYTE, cardPhoto);
    rTextureReady = true;
  }

  function initWebGLReveal() {
    try {
      rgl = revealCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true });
      if (rgl) contexts.add(rgl);
      if (!rgl) return;
      const vs = compileShader(rgl, rgl.VERTEX_SHADER, VERT_SRC);
      const fs = compileShader(rgl, rgl.FRAGMENT_SHADER, REVEAL_FRAG_SRC);
      if (!vs || !fs) {
        rgl = null;
        return;
      }
      rProgram = track(rgl,'program',rgl.createProgram());
      rgl.attachShader(rProgram, vs);
      rgl.attachShader(rProgram, fs);
      rgl.linkProgram(rProgram);
      if (!rgl.getProgramParameter(rProgram, rgl.LINK_STATUS)) {
        rgl = null;
        return;
      }
      const buf = track(rgl,'buffer',rgl.createBuffer());
      rgl.bindBuffer(rgl.ARRAY_BUFFER, buf);
      rgl.bufferData(rgl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), rgl.STATIC_DRAW);
      const aPos = rgl.getAttribLocation(rProgram, 'a_pos');
      rgl.enableVertexAttribArray(aPos);
      rgl.vertexAttribPointer(aPos, 2, rgl.FLOAT, false, 0, 0);

      rUniforms = {
        tex: rgl.getUniformLocation(rProgram, 'u_tex'),
        res: rgl.getUniformLocation(rProgram, 'u_res'),
        texSize: rgl.getUniformLocation(rProgram, 'u_texSize'),
        progress: rgl.getUniformLocation(rProgram, 'u_progress')
      };

      if (cardPhoto.complete && cardPhoto.naturalWidth) {
        uploadRevealTexture();
      } else {
        on(cardPhoto,'load',uploadRevealTexture);
      }
    } catch {
      rgl = null;
    }
  }

  function renderAuroraFrame(elapsedMs) {
    const rect = rectOf(cardShell);
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = w * 0.058;

    if (gl && glProgram && glUniforms) {
      gl.viewport(0, 0, auroraCanvas.width, auroraCanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(glProgram);
      gl.uniform2f(glUniforms.res, auroraCanvas.width, auroraCanvas.height);
      gl.uniform2f(glUniforms.cardSize, w * dpr, h * dpr);
      gl.uniform1f(glUniforms.radius, r * dpr);
      gl.uniform1f(glUniforms.time, elapsedMs / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (fallback2dCtx) {
      const aw = w + AURORA_PAD * 2;
      const ah = h + AURORA_PAD * 2;
      fallback2dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fallback2dCtx.clearRect(0, 0, aw, ah);
      fallback2dCtx.fillStyle = '#1b1b1b';
      fallback2dCtx.beginPath();
      fallback2dCtx.roundRect(AURORA_PAD, AURORA_PAD, w, h, r);
      fallback2dCtx.fill();
    }
  }

  function clearAuroraCanvas() {
    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else if (fallback2dCtx) {
      fallback2dCtx.clearRect(0, 0, auroraCanvas.width, auroraCanvas.height);
    }
  }

  function clearRevealCanvas() {
    if (rgl) {
      rgl.clearColor(0, 0, 0, 0);
      rgl.clear(rgl.COLOR_BUFFER_BIT);
    }
    revealCanvas.style.opacity = '0';
  }

  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function valueNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm2D(x, y) {
    return (
      0.56 * valueNoise(x, y) +
      0.28 * valueNoise(x * 2.07 + 11.3, y * 2.07 + 4.7) +
      0.16 * valueNoise(x * 4.13 + 27.1, y * 4.13 + 19.4)
    );
  }


  function showToast(message) {
    toastEl.textContent=message;toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer=window.setTimeout(()=>{if(!destroyed)toastEl.classList.remove('is-visible');},1700);
  }
  function stopFrame(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
  function clearDust(){dustFrame=null;root.dataset.particles='0';dustCtx.clearRect(0,0,dustCanvas.width,dustCanvas.height);}
  function setState(next,notify=true){
    state=next;root.dataset.phase=state;phaseElapsed=0;lastTime=null;
    const ready=state==='ready',gone=state==='gone';
    card.tabIndex=ready?0:-1;card.inert=!ready;
    card.setAttribute('aria-busy',String(state==='loading'||state==='revealing'));
    buttons.forEach((button,index)=>{button.disabled=!ready;button.tabIndex=ready&&index===0?0:-1;});
    restoreWrap.inert=!gone;restoreWrap.setAttribute('aria-hidden',String(!gone));
    restoreWrap.classList.toggle('is-visible',gone);
    if(notify)options.onPhaseChange?.(state);
  }
  function resizeCanvases(){
    if(destroyed)return;
    const width=Math.max(1,Math.min(344,root.clientWidth*.82,(root.clientHeight-76)*900/1184));
    root.style.setProperty('--card-width',width+'px');
    const rect=rectOf(cardShell),dpr=Math.min(window.devicePixelRatio||1,2);
    const cw=Math.max(1,Math.round(rect.width)),ch=Math.max(1,Math.round(rect.height));
    const aw=cw+AURORA_PAD*2,ah=ch+AURORA_PAD*2;
    auroraCanvas.style.width=aw+'px';auroraCanvas.style.height=ah+'px';
    auroraCanvas.width=Math.round(aw*dpr);auroraCanvas.height=Math.round(ah*dpr);
    revealCanvas.width=Math.round(cw*dpr);revealCanvas.height=Math.round(ch*dpr);
    const vw=Math.max(1,Math.round(root.clientWidth)),vh=Math.max(1,Math.round(root.clientHeight));
    if(dustCanvas.width!==vw||dustCanvas.height!==vh){dustCanvas.width=vw;dustCanvas.height=vh;}
    // Pixel samples belong to the old geometry; finish an interrupted deletion cleanly.
    if(state==='dusting'){finishGone();return;}
    renderCurrent();
  }
  function finishReady(notify=true){
    stopFrame();clearDust();clearRevealCanvas();clearAuroraCanvas();
    auroraCanvas.style.opacity='0';photoSharp.style.opacity='1';photoSharp.style.filter='none';
    loaderHud.classList.add('is-hidden');card.classList.remove('is-hidden','is-touch-open');card.classList.add('is-ready');
    setState('ready',notify);
    if(returnFocus){returnFocus=false;card.focus({preventScroll:true});}
  }
  function finishGone(notify=true){
    stopFrame();clearDust();clearRevealCanvas();clearAuroraCanvas();auroraCanvas.style.opacity='0';
    card.classList.remove('is-ready','is-touch-open');card.classList.add('is-hidden');loaderHud.classList.add('is-hidden');
    setState('gone',notify);
    if(returnFocus){returnFocus=false;btnRestore.focus({preventScroll:true});}
  }
  function startGenerationSequence(notify=true){
    if(destroyed||!initialized)return;
    stopFrame();clearDust();clearRevealCanvas();setState('loading',notify);
    card.classList.remove('is-hidden','is-ready','is-touch-open');loaderHud.classList.remove('is-hidden');
    auroraCanvas.style.opacity='1';photoSharp.style.opacity='0';photoSharp.style.filter='none';
    if(reduced()){finishReady(notify);return;}
    renderCurrent();schedule();
  }
  function beginPhotoReveal(){
    setState('revealing');if(rgl&&!rTextureReady)uploadRevealTexture();revealCanvas.style.opacity='1';renderCurrent();
  }
  function renderReveal(p){
    if (p > 0.1 && !loaderHud.classList.contains('is-hidden')) {
      loaderHud.classList.add('is-hidden');
    }

    if (rgl && rProgram && rUniforms && rTextureReady) {
      rgl.viewport(0, 0, revealCanvas.width, revealCanvas.height);
      rgl.clearColor(0, 0, 0, 0);
      rgl.clear(rgl.COLOR_BUFFER_BIT);
      rgl.useProgram(rProgram);
      rgl.activeTexture(rgl.TEXTURE0);
      rgl.bindTexture(rgl.TEXTURE_2D, rTexture);
      rgl.uniform1i(rUniforms.tex, 0);
      rgl.uniform2f(rUniforms.res, revealCanvas.width, revealCanvas.height);
      rgl.uniform2f(rUniforms.texSize, cardPhoto.naturalWidth || 720, cardPhoto.naturalHeight || 948);
      rgl.uniform1f(rUniforms.progress, p);
      rgl.drawArrays(rgl.TRIANGLES, 0, 6);
    } else {
      // Fallback smooth CSS blur-to-sharp if WebGL unavailable
      photoSharp.style.opacity = Math.min(1, p / 0.35).toFixed(3);
      const blurPx = (1 - p) * 28;
      photoSharp.style.filter = blurPx > 0.1 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
    }

    if (p > 0.35) {
      auroraCanvas.style.opacity = Math.max(0, 1 - (p - 0.35) / 0.3).toFixed(3);
    }


  }
  function renderCurrent(){
    if(!initialized||destroyed)return;
    root.dataset.time=phaseElapsed.toFixed(1);
    if(state==='loading'){
      const u=Math.min(1,phaseElapsed/LOAD_DURATION);
      const pct=u>=1?99:Math.min(99,Math.round(100*(1-Math.pow(1-u,2.05))));
      ringPercent.textContent=pct+'%';ringProgress.style.strokeDashoffset=String(RING_CIRCUMFERENCE*(1-pct/100));
      loaderStatus.textContent=pct<70?'Processing...':'Generating...';renderAuroraFrame(phaseElapsed);
    }else if(state==='revealing')renderReveal(Math.min(1,phaseElapsed/REVEAL_DURATION));
  }
  function tick(now){
    raf=null;if(destroyed||!running())return;
    const dt=lastTime===null?0:Math.max(0,now-lastTime);lastTime=now;phaseElapsed+=dt;
    renderCurrent();
    if(state==='loading'&&phaseElapsed>=LOAD_DURATION)beginPhotoReveal();
    else if(state==='revealing'&&phaseElapsed>=REVEAL_DURATION)finishReady();
    else if(state==='dusting'&&dustFrame){root.dataset.time=phaseElapsed.toFixed(1);if(!dustFrame(phaseElapsed/1000,Math.min(.04,dt/1000)))finishGone();}
    schedule();
  }
  function schedule(){if(!destroyed&&initialized&&running()&&['loading','revealing','dusting'].includes(state)&&raf===null)raf=requestAnimationFrame(tick);}
  function triggerDustDisintegration(focus=false){
    if(destroyed||state!=='ready')return;
    returnFocus=focus;stopFrame();setState('dusting');
    if(reduced()){finishGone();return;}
    const vw = Math.max(1, Math.round(root.clientWidth));
    const vh = Math.max(1, Math.round(root.clientHeight));
    dustCanvas.width = vw;
    dustCanvas.height = vh;

    const canvasRect = rectOf(dustCanvas);
    const rect = rectOf(card);
    const cw = Math.max(1, Math.round(rect.width));
    const ch = Math.max(1, Math.round(rect.height));
    const ox = Math.round(rect.left - canvasRect.left);
    const oy = Math.round(rect.top - canvasRect.top);
    const radius = cw * 0.058;

    card.classList.remove('is-ready', 'is-touch-open');

    const off = document.createElement('canvas');
    off.width = cw;
    off.height = ch;
    const octx = off.getContext('2d');

    octx.beginPath();
    octx.moveTo(radius, 0);
    octx.lineTo(cw - radius, 0);
    octx.quadraticCurveTo(cw, 0, cw, radius);
    octx.lineTo(cw, ch - radius);
    octx.quadraticCurveTo(cw, ch, cw - radius, ch);
    octx.lineTo(radius, ch);
    octx.quadraticCurveTo(0, ch, 0, ch - radius);
    octx.lineTo(0, radius);
    octx.quadraticCurveTo(0, 0, radius, 0);
    octx.closePath();
    octx.clip();

    const iw = cardPhoto.naturalWidth || cw;
    const ih = cardPhoto.naturalHeight || ch;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    octx.drawImage(cardPhoto, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

    const imgData = octx.getImageData(0, 0, cw, ch).data;

    const step = 2;
    const maxCount = Math.ceil(cw / step) * Math.ceil(ch / step);

    const pxArr = new Float32Array(maxCount);
    const pyArr = new Float32Array(maxCount);
    const vxArr = new Float32Array(maxCount);
    const vyArr = new Float32Array(maxCount);
    const detachArr = new Float32Array(maxCount);
    const lifeArr = new Float32Array(maxCount);
    const seedArr = new Float32Array(maxCount);
    const rArr = new Uint8Array(maxCount);
    const gArr = new Uint8Array(maxCount);
    const bArr = new Uint8Array(maxCount);

    let count = 0;
    for (let y = 0; y < ch; y += step) {
      const ny = y / ch;
      for (let x = 0; x < cw; x += step) {
        const idx = (y * cw + x) * 4;
        if (imgData[idx + 3] < 40) continue;

        const nx = x / cw;
        const nVal = fbm2D(nx * 4.2, ny * 5.0);
        const diag = nx * 0.68 + ny * 0.32;
        const jitter = (Math.random() - 0.5) * 0.16;
        const detachT = Math.max(0.06, 0.06 + diag * 0.72 + nVal * 0.30 + jitter);

        pxArr[count] = ox + x;
        pyArr[count] = oy + y;

        const angle = -Math.PI * 0.52 + (nx - 0.5) * 0.42 + (Math.random() - 0.5) * 0.65;
        const speed = 26 + Math.random() * 64 + (1 - ny) * 28;
        vxArr[count] = Math.cos(angle) * speed * 0.52;
        vyArr[count] = Math.sin(angle) * speed - 16;

        detachArr[count] = detachT;
        lifeArr[count] = 1.25 + Math.random() * 1.05;
        seedArr[count] = Math.random() * Math.PI * 2;

        rArr[count] = imgData[idx];
        gArr[count] = imgData[idx + 1];
        bArr[count] = imgData[idx + 2];
        count++;
      }
    }

    dustCtx.clearRect(0, 0, vw, vh);
    dustCtx.drawImage(off, ox, oy);
    card.classList.add('is-hidden');

    const frameBuf = dustCtx.createImageData(vw, vh);
    const bufData = frameBuf.data;

    root.dataset.particles=String(count);
    dustFrame=(elapsed,dt)=>{
      bufData.fill(0);

      let alive = 0;

      for (let i = 0; i < count; i++) {
        const age = elapsed - detachArr[i];
        let x = pxArr[i];
        let y = pyArr[i];
        let alpha = 255;
        let r = rArr[i];
        let g = gArr[i];
        let b = bArr[i];

        if (age > 0) {
          const normAge = age / lifeArr[i];
          if (normAge >= 1) continue;

          const swirl = Math.sin(elapsed * 3.0 + seedArr[i] + y * 0.016);
          vxArr[i] += swirl * 20 * dt;
          vyArr[i] -= 30 * dt;
          vxArr[i] *= 0.986;
          vyArr[i] *= 0.992;

          x += vxArr[i] * dt;
          y += vyArr[i] * dt;
          pxArr[i] = x;
          pyArr[i] = y;

          const ash = Math.min(0.62, normAge * 0.72);
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) * 0.86;
          r = (r * (1 - ash) + lum * ash) | 0;
          g = (g * (1 - ash) + lum * ash) | 0;
          b = (b * (1 - ash) + lum * ash) | 0;

          const fade = 1 - Math.pow(normAge, 1.65);
          alpha = (fade * 250) | 0;
        }

        alive++;

        const ix = x | 0;
        const iy = y | 0;
        if (ix < 0 || iy < 0 || ix >= vw - 2 || iy >= vh - 2) continue;

        const drawSize = age > 0.42 ? 1 : 2;

        for (let dy = 0; dy < drawSize; dy++) {
          const rowOffset = (iy + dy) * vw;
          for (let dx = 0; dx < drawSize; dx++) {
            const p = (rowOffset + ix + dx) * 4;
            if (alpha >= bufData[p + 3]) {
              bufData[p] = r;
              bufData[p + 1] = g;
              bufData[p + 2] = b;
              bufData[p + 3] = alpha;
            }
          }
        }
      }

      dustCtx.putImageData(frameBuf, 0, 0);


      return alive>0&&elapsed<3.4;
    };
    schedule();
  }
  function syncLiked(){btnLike.classList.toggle('is-liked',isLiked);btnLike.setAttribute('aria-pressed',String(isLiked));}
  function syncPlayback(){
    if(destroyed)return;
    root.dataset.paused=String(Boolean(options.paused)||document.hidden);root.dataset.reduced=String(reduced());
    stopFrame();
    if(reduced()&&initialized){if(state==='dusting')finishGone();else if(state==='loading'||state==='revealing')finishReady();}
    schedule();
  }
  buttons.forEach((button,index)=>{
    on(button,'click',event=>{
      event.stopPropagation();if(destroyed||state!=='ready')return;
      if(index===0){isLiked=!isLiked;syncLiked();options.onLikeChange?.(isLiked);showToast(isLiked?'Added to favorites':'Removed from favorites');}
      else if(index===1){returnFocus=event.isTrusted;startGenerationSequence();}
      else if(index===2){
        if(options.onDownload)options.onDownload(cardPhoto.src);
        else{const link=document.createElement('a');link.href=cardPhoto.src;link.download='portrait.jpg';document.body.appendChild(link);link.click();link.remove();}
        showToast('Download requested');
      }else triggerDustDisintegration(event.isTrusted);
    });
    on(button,'keydown',event=>{
      if(destroyed||state!=='ready')return;
      let next=index;
      if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(index+1)%4;
      else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(index+3)%4;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=3;else if(event.key==='Escape'){card.classList.remove('is-touch-open');card.focus();return;}else return;
      event.preventDefault();buttons.forEach((node,i)=>node.tabIndex=i===next?0:-1);buttons[next].focus();
    });
  });
  on(card,'click',()=>{if(!destroyed&&state==='ready')card.classList.toggle('is-touch-open');});
  on(card,'keydown',event=>{
    if(destroyed||state!=='ready'||event.target!==card)return;
    if(['Enter',' ','ArrowDown','ArrowRight'].includes(event.key)){event.preventDefault();card.classList.add('is-touch-open');buttons.find(node=>node.tabIndex===0)?.focus();}
    if(event.key==='Escape')card.classList.remove('is-touch-open');
  });
  on(btnRestore,'click',event=>{if(destroyed||state!=='gone')return;returnFocus=event.isTrusted;startGenerationSequence();});
  on(document,'visibilitychange',syncPlayback);
  const media=scope.matchMedia('(prefers-reduced-motion:reduce)');on(media,'change',syncPlayback);
  const observer=new scope.ResizeObserver(resizeCanvases);observer.observe(root);
  function initialize(){
    if(destroyed||initialized||!cardPhoto.naturalWidth)return;
    initialized=true;initWebGLAurora();initWebGLReveal();resizeCanvases();
    root.dataset.renderer=gl&&rgl?'webgl':'fallback';root.dataset.ready='true';
    if(options.phase==='gone')finishGone(false);else if(options.phase==='ready')finishReady(false);else startGenerationSequence(false);
    syncPlayback();
  }
  on(cardPhoto,'load',initialize);
  on(cardPhoto,'error',()=>{if(!destroyed){root.dataset.error='image';loaderStatus.textContent='Image unavailable';}});
  cardPhoto.src=PORTRAIT_SRC;syncLiked();setState('idle',false);initialize();
  return {
    update(next={}){
      if(destroyed)return;options={...options,...next};
      if(Object.hasOwn(next,'liked')){isLiked=Boolean(next.liked);syncLiked();}
      if(initialized&&['loading','ready','gone'].includes(next.phase)){
        returnFocus=false;if(next.phase==='loading')startGenerationSequence(false);else if(next.phase==='ready')finishReady(false);else finishGone(false);
      }
      syncPlayback();
    },
    destroy(){
      if(destroyed)return;destroyed=true;stopFrame();window.clearTimeout(toastTimer);observer.disconnect();dustFrame=null;
      root.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
      for(const {ctx,kind,value} of resources)ctx['delete'+kind[0].toUpperCase()+kind.slice(1)](value);
      resources.length=0;for(const ctx of contexts)ctx.getExtension('WEBGL_lose_context')?.loseContext();contexts.clear();
      [dustCanvas,revealCanvas,auroraCanvas].forEach(canvas=>{canvas.width=1;canvas.height=1;});
    },
  };
}
