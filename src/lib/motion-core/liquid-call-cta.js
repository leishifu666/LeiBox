/* Supplied HTML adaptation. Design reference: @val_soonafter.
   No separate source license was supplied or verified. */
export function createLiquidCallCta(scope,initial={}){
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout}=scope;
  const root=document.getElementById('liquidCta');
  const bookBtn=document.getElementById('bookBtn');
  const starBtn=document.getElementById('starBtn');
  const xBtn=document.getElementById('xBtn');
  const canvas=document.getElementById('liquidCanvas');
  const feedbackToast=document.getElementById('feedbackToast');
  const buttons=[bookBtn,starBtn,xBtn];
  const PILL_W=287,PILL_H=99,BLEED=160,CANVAS_W=PILL_W+BLEED*2,CANVAS_H=PILL_H+BLEED*2;
  const halfW=PILL_W*.5,halfH=PILL_H*.5,cornerR=halfH;
  let options={...initial},destroyed=false,raf=null,toastTimer=null,activePointer=null,lastTime=performance.now();
  const gpu={shaders:[],program:null,buffer:null};
  const reduced=()=>scope.reduced();
  let renderFrame;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(CANVAS_W*dpr);canvas.height=Math.round(CANVAS_H*dpr);
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});

  if (gl) {
  const vertSrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision highp float;
    varying vec2 vUv;

    uniform vec2 uCanvasSize;
    uniform vec2 uPillHalf;
    uniform vec2 uBlobPos;
    uniform float uBlobRadius;
    uniform float uSmoothK;
    uniform vec2 uDropPos;
    uniform float uDropRadius;
    uniform vec2 uLightPos;
    uniform float uHoverMix;
    uniform float uPressScale;
    uniform float uTime;

    // Polynomial smooth minimum for organic liquid metaball union
    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / max(k, 0.0001), 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    float sdRoundedPill(vec2 p, vec2 halfSize) {
      float r = halfSize.y;
      vec2 b = vec2(halfSize.x - r, 0.0);
      vec2 q = abs(p) - b;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    // Subtle screen-space dither to eliminate 8-bit banding in wide soft halos
    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    // Multi-lobe editorial iridescent mesh matching reference frames
    vec3 sampleIridescent(vec2 p, vec2 lightPos, float t) {
      float nx = clamp((p.x + uPillHalf.x) / (uPillHalf.x * 2.0), 0.0, 1.0);
      float ny = clamp((p.y + uPillHalf.y) / (uPillHalf.y * 2.0), 0.0, 1.0);

      // Base velvety muted mesh stops
      vec3 colTaupe  = vec3(0.518, 0.460, 0.428); // warm olive-taupe left edge
      vec3 colRose   = vec3(0.560, 0.325, 0.440); // dusty berry-rose upper-mid
      vec3 colPlum   = vec3(0.425, 0.295, 0.490); // muted plum-violet center-right
      vec3 colSlate  = vec3(0.340, 0.402, 0.498); // cool slate-indigo right

      float drift = sin(t * 0.6) * 0.03;
      vec3 col = mix(colTaupe, colRose, smoothstep(0.04, 0.44 + drift, nx));
      col = mix(col, colPlum, smoothstep(0.36, 0.67 - drift, nx));
      col = mix(col, colSlate, smoothstep(0.58, 0.95, nx));

      // Upper-mid berry depth and lower-left warmth
      float upperBerry = exp(-pow((nx - 0.46) / 0.28, 2.0) - pow((ny - 0.18) / 0.45, 2.0));
      col = mix(col, vec3(0.515, 0.290, 0.435), upperBerry * 0.32);

      // Cursor-following luminous champagne-peach / sand highlight
      float distLight = length(p - lightPos);
      float warmCore = exp(-(distLight * distLight) / (86.0 * 86.0));
      vec3 colChampagne = vec3(0.805, 0.680, 0.585);
      col = mix(col, colChampagne, warmCore * 0.74);

      // Soft rose-blush halo ring around the warm spotlight
      float blushRing = exp(-pow(distLight - 46.0, 2.0) / (54.0 * 54.0));
      col = mix(col, vec3(0.655, 0.410, 0.505), blushRing * 0.22 * (1.0 - nx * 0.4));

      return col;
    }

    void main() {
      vec2 p = (vUv - 0.5) * uCanvasSize;
      p.y = -p.y;

      vec2 pillHalf = uPillHalf * uPressScale;
      float dPill = sdRoundedPill(p, pillHalf);

      float d = dPill;
      if (uBlobRadius > 0.25) {
        float dBlob = length(p - uBlobPos) - uBlobRadius;
        d = smin(dPill, dBlob, uSmoothK);
      }

      // Independent pinched-off droplet on snap-off (slight smooth union only when ultra-close)
      if (uDropRadius > 0.2) {
        float dDrop = length(p - uDropPos) - uDropRadius;
        d = smin(d, dDrop, 5.5);
      }

      // Crisp sub-pixel anti-aliasing
      float aa = 1.05;
      float shapeAlpha = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);

      vec3 idleCol = vec3(0.165, 0.157, 0.161); // #2A2829
      vec3 iridCol = sampleIridescent(p, uLightPos, uTime);

      // Subtle velvety edge translucency when hovered
      float innerRim = smoothstep(-22.0, -0.5, d) * shapeAlpha;
      iridCol += vec3(0.036, 0.028, 0.040) * innerRim;

      vec3 fillCol = mix(idleCol, iridCol, uHoverMix);

      // Soft multi-toned ambient outer glow conforming to the deformed SDF
      float nx = clamp((p.x + uPillHalf.x) / (uPillHalf.x * 2.0), 0.0, 1.0);
      vec3 glowPink = vec3(1.00, 0.74, 0.85);
      vec3 glowLav  = vec3(0.84, 0.75, 0.97);
      vec3 glowBlue = vec3(0.75, 0.81, 0.99);
      vec3 glowCol = mix(glowPink, glowLav, smoothstep(0.10, 0.55, nx));
      glowCol = mix(glowCol, glowBlue, smoothstep(0.50, 0.94, nx));

      float outerDist = max(d, 0.0);
      float glowStrength = exp(-(outerDist * outerDist) / (40.0 * 40.0)) * 0.38
                         + exp(-(outerDist * outerDist) / (88.0 * 88.0)) * 0.16;
      float glowAlpha = glowStrength * uHoverMix * (1.0 - shapeAlpha);

      // Tiny dither to keep outer halo silky smooth on 8-bit displays
      float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
      glowAlpha = max(0.0, glowAlpha + dither * uHoverMix);

      float outAlpha = shapeAlpha + glowAlpha;
      vec3 outPremul = fillCol * shapeAlpha + glowCol * glowAlpha;

      gl_FragColor = vec4(outPremul, outAlpha);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gpu.shaders.push(sh);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }

  const prog = gl.createProgram();
  gpu.program=prog;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gpu.buffer=buf;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  const locPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

  const uCanvasSize = gl.getUniformLocation(prog, 'uCanvasSize');
  const uPillHalf = gl.getUniformLocation(prog, 'uPillHalf');
  const uBlobPos = gl.getUniformLocation(prog, 'uBlobPos');
  const uBlobRadius = gl.getUniformLocation(prog, 'uBlobRadius');
  const uSmoothK = gl.getUniformLocation(prog, 'uSmoothK');
  const uDropPos = gl.getUniformLocation(prog, 'uDropPos');
  const uDropRadius = gl.getUniformLocation(prog, 'uDropRadius');
  const uLightPos = gl.getUniformLocation(prog, 'uLightPos');
  const uHoverMix = gl.getUniformLocation(prog, 'uHoverMix');
  const uPressScale = gl.getUniformLocation(prog, 'uPressScale');
  const uTime = gl.getUniformLocation(prog, 'uTime');

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);

  renderFrame = function (st, nowSec) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uCanvasSize, CANVAS_W, CANVAS_H);
    gl.uniform2f(uPillHalf, halfW, halfH);
    gl.uniform2f(uBlobPos, st.blobX, st.blobY);
    gl.uniform1f(uBlobRadius, Math.max(0, st.blobR));
    gl.uniform1f(uSmoothK, Math.max(1, st.smoothK));
    gl.uniform2f(uDropPos, st.dropX, st.dropY);
    gl.uniform1f(uDropRadius, Math.max(0, st.dropR));
    gl.uniform2f(uLightPos, st.lightX, st.lightY);
    gl.uniform1f(uHoverMix, st.hoverMix);
    gl.uniform1f(uPressScale, st.pressScale);
    gl.uniform1f(uTime, nowSec);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
} else {
  const ctx = canvas.getContext('2d');
  renderFrame = function (st) {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const cx = CANVAS_W * 0.5;
    const cy = CANVAS_H * 0.5;
    const r = halfH * st.pressScale;
    const w = PILL_W * st.pressScale;
    const h = PILL_H * st.pressScale;

    if (st.hoverMix > 0.01) {
      ctx.shadowColor = `rgba(170, 125, 195, ${(0.35 * st.hoverMix).toFixed(3)})`;
      ctx.shadowBlur = 36;
    }
    const grad = ctx.createLinearGradient(cx - w * 0.5, cy, cx + w * 0.5, cy);
    if (st.hoverMix > 0.05) {
      grad.addColorStop(0, '#8d6d68');
      grad.addColorStop(0.5, '#7c4d6e');
      grad.addColorStop(1, '#58657c');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#2a2829';
    }
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.5, cy - h * 0.5, w, h, r);
    ctx.fill();
    ctx.restore();
  };
}



  const state = {
  targetX: 0,
  targetY: 0,
  blobX: 0,
  blobY: 0,
  velX: 0,
  velY: 0,
  blobR: 0,
  targetR: 0,
  velR: 0,
  smoothK: 44,
  targetK: 44,
  // Independent detached droplet spawned at snap-off
  dropX: 0,
  dropY: 0,
  dropVx: 0,
  dropVy: 0,
  dropR: 0,
  // Smooth spotlight position inside/around pill
  lightX: -30,
  lightY: 10,
  hoverMix: 0,
  targetHover: 0,
  focusGlow: false,
  pressScale: 1,
  targetPress: 1,
  engaged: false
};



  function sdPill(x,y){
    const qx=Math.abs(x)-(halfW-cornerR),qy=Math.abs(y);
    return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-cornerR;
  }
  function clampToPillInterior(x,y){
    const bx=halfW-cornerR,cx=Math.max(-bx,Math.min(bx,x)),dx=x-cx,dist=Math.hypot(dx,y)||1;
    const radius=cornerR*.55;
    return dist<=radius?[x,y]:[cx+dx/dist*radius,y/dist*radius];
  }
  function publish(){
    root.dataset.engaged=String(state.engaged);
    root.dataset.blobX=state.blobX.toFixed(2);root.dataset.blobY=state.blobY.toFixed(2);
    root.dataset.blobRadius=state.blobR.toFixed(3);root.dataset.dropRadius=state.dropR.toFixed(3);
    root.dataset.hover=state.hoverMix.toFixed(3);root.dataset.pressed=String(state.targetPress<1);
  }
  function draw(){
    if(destroyed)return;
    renderFrame(state,reduced()?0:performance.now()*.001);publish();
  }
  function settleReduced(){
    state.blobR=0;state.dropR=0;state.velX=0;state.velY=0;state.velR=0;
    state.hoverMix=state.targetHover;state.pressScale=1;state.lightX=-30;state.lightY=10;
    draw();
  }
  function wake(){
    if(destroyed)return;
    if(reduced()){settleReduced();return;}
    if(raf===null&&!document.hidden){lastTime=performance.now();raf=requestAnimationFrame(tick);}
  }
  function updatePointer(clientX,clientY){
    if(destroyed||options.disabled)return;
    const rect=bookBtn.getBoundingClientRect(),scale=rect.width/PILL_W||1;
    const lx=(clientX-rect.left-rect.width*.5)/scale,ly=(clientY-rect.top-rect.height*.5)/scale;
    const d=sdPill(lx,ly);
    if(!state.engaged){
      if(d<22){
        state.engaged=true;
        if(state.blobR<2){[state.blobX,state.blobY]=clampToPillInterior(lx,ly);state.velX=state.velY=0;}
      }
    }else if(d>86){
      state.engaged=false;
      state.dropX=state.blobX;state.dropY=state.blobY;
      state.dropVx=state.velX*.12;state.dropVy=state.velY*.12;
      state.dropR=Math.max(7.5,Math.min(11.5,state.blobR*.62));
      [state.targetX,state.targetY]=clampToPillInterior(state.blobX,state.blobY);
    }
    if(state.engaged){
      state.targetX=lx;state.targetY=ly;
      if(d<=0){state.targetR=39;state.targetK=48;state.targetHover=1;}
      else{
        const t=Math.min(d/86,1);
        state.targetR=37-t*24;state.targetK=46-t*18;
        state.targetHover=d<56?1:Math.max(.25,1-(d-56)/38);
      }
    }else{state.targetHover=state.focusGlow ? .55 : 0;state.targetR=0;state.targetK=28;}
    publish();wake();
  }
  function release(){
    if(destroyed)return;
    if(state.engaged)[state.targetX,state.targetY]=clampToPillInterior(state.blobX,state.blobY);
    state.engaged=false;state.targetHover=state.focusGlow ? .55 : 0;state.targetR=0;
    state.targetPress=1;
    const captured=activePointer;activePointer=null;
    if(captured!==null&&bookBtn.hasPointerCapture(captured))bookBtn.releasePointerCapture(captured);
    bookBtn.classList.remove('is-pressed');
    publish();wake();
  }
  function press(){state.targetPress=.968;bookBtn.classList.add('is-pressed');publish();wake();}
  function showToast(message){
    feedbackToast.textContent=message;feedbackToast.classList.add('is-visible');clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{if(!destroyed)feedbackToast.classList.remove('is-visible');},2000);
  }
  for(const [button,action,message] of [
    [bookBtn,'book','Call booking selected (demo)'],
    [starBtn,'highlights','Highlights selected (demo)'],
    [xBtn,'profile','X profile selected (demo)'],
  ])on(button,'click',()=>{
    if(destroyed||options.disabled)return;
    showToast(message);options.onAction?.(action);
  });
  on(root,'pointermove',e=>{
    if(activePointer!==null&&e.pointerId!==activePointer)return;
    if(e.pointerType==='touch'&&activePointer===null)return;
    updatePointer(e.clientX,e.clientY);
  });
  on(root,'pointerleave',()=>{if(activePointer===null)release();});
  on(bookBtn,'focus',()=>{
    if(destroyed||options.disabled)return;
    state.focusGlow=true;if(!state.engaged)state.targetHover=.55;wake();
  });
  on(bookBtn,'blur',()=>{
    if(destroyed)return;
    state.focusGlow=false;release();
  });
  on(bookBtn,'pointerdown',e=>{
    if(destroyed||options.disabled||e.button!==0||e.isPrimary===false||activePointer!==null)return;
    activePointer=e.pointerId;
    if(e.isTrusted)bookBtn.setPointerCapture(e.pointerId);
    updatePointer(e.clientX,e.clientY);press();
  });
  on(bookBtn,'pointerup',e=>{
    if(e.pointerId!==activePointer)return;
    activePointer=null;state.targetPress=1;bookBtn.classList.remove('is-pressed');
    if(e.pointerType==='touch')release();else wake();
  });
  on(bookBtn,'pointercancel',e=>{if(e.pointerId===activePointer)release();});
  on(bookBtn,'lostpointercapture',()=>{if(activePointer!==null)release();});
  on(bookBtn,'keydown',e=>{
    if(options.disabled||destroyed)return;
    if((e.code==='Space'||e.code==='Enter')&&!e.repeat)press();
    if(e.code==='Escape')release();
  });
  on(bookBtn,'keyup',e=>{
    if(destroyed)return;
    if(e.code==='Space'||e.code==='Enter'){state.targetPress=1;bookBtn.classList.remove('is-pressed');wake();}
  });
  on(window,'blur',()=>{state.focusGlow=false;release();});
  on(document,'visibilitychange',()=>{
    if(document.hidden){
      if(raf!==null)cancelAnimationFrame(raf);raf=null;state.focusGlow=false;release();
    }else wake();
  });

  function tick(now){
    raf=null;
    if(destroyed||document.hidden)return;
    const dt=Math.min(Math.max((now-lastTime)*.001,0),.04);lastTime=Math.max(lastTime,now);
    // Slightly underdamped spring when recoiling for subtle gelatinous snap-back
const stiffnessPos = state.engaged ? 240 : 280;
const dampingPos = state.engaged ? 22 : 17;

const ax = (state.targetX - state.blobX) * stiffnessPos - state.velX * dampingPos;
const ay = (state.targetY - state.blobY) * stiffnessPos - state.velY * dampingPos;
state.velX += ax * dt;
state.velY += ay * dt;
state.blobX += state.velX * dt;
state.blobY += state.velY * dt;

// Radius spring
const stiffnessR = state.engaged ? 210 : 260;
const dampingR = state.engaged ? 23 : 20;
const ar = (state.targetR - state.blobR) * stiffnessR - state.velR * dampingR;
state.velR += ar * dt;
state.blobR = Math.max(0, state.blobR + state.velR * dt);

// Smooth-min blend k
const kLerp = 1 - Math.exp(-dt * 14);
state.smoothK += (state.targetK - state.smoothK) * kLerp;

// Detached droplet decays swiftly in place with light drift
if (state.dropR > 0.05) {
  state.dropX += state.dropVx * dt;
  state.dropY += state.dropVy * dt;
  state.dropVx *= Math.exp(-dt * 10);
  state.dropVy *= Math.exp(-dt * 10);
  state.dropR *= Math.exp(-dt * 16);
  if (state.dropR < 0.25) state.dropR = 0;
}

// Spotlight smoothly follows engaged blob (lags slightly behind shape for lush optical depth)
const lightLerp = 1 - Math.exp(-dt * 9.5);
if (state.engaged) {
  state.lightX += (state.blobX - state.lightX) * lightLerp;
  state.lightY += (state.blobY - state.lightY) * lightLerp;
}

// Color & ambient glow fade slightly behind initial shape deformation (matches video frames #02-#05)
const hoverRate = state.targetHover > state.hoverMix ? 4.6 : 6.4;
state.hoverMix += (state.targetHover - state.hoverMix) * (1 - Math.exp(-dt * hoverRate));

const pressLerp = 1 - Math.exp(-dt * 24);
state.pressScale += (state.targetPress - state.pressScale) * pressLerp;


    draw();
    const moving=Math.max(Math.abs(state.velX),Math.abs(state.velY),Math.abs(state.velR),
      Math.abs(state.targetR-state.blobR),Math.abs(state.targetHover-state.hoverMix),
      Math.abs(state.targetPress-state.pressScale))>.001;
    if(!reduced()&&(state.engaged||state.hoverMix>.001||state.dropR>.05||moving))raf=requestAnimationFrame(tick);
    else{state.blobR=0;state.hoverMix=0;state.pressScale=1;draw();}
  }
  function resize(){
    if(destroyed)return;
    const scale=Math.max(0,Math.min(1,(root.clientWidth-64)/579,(root.clientHeight-64)/(PILL_H+120)));
    root.style.setProperty('--ui-scale',scale.toFixed(4));draw();
  }
  function applyOptions(){
    const label=typeof options.label==='string'?options.label:'Book a call';
    bookBtn.querySelector('.liquid-label').textContent=label;bookBtn.setAttribute('aria-label',label);
    buttons.forEach(button=>button.disabled=Boolean(options.disabled));
    root.dataset.disabled=String(Boolean(options.disabled));root.dataset.reduced=String(reduced());
    if(options.disabled){state.focusGlow=false;release();}
  }
  function refresh(){
    if(destroyed)return;
    if(raf!==null)cancelAnimationFrame(raf);raf=null;
    applyOptions();resize();
    if(reduced())settleReduced();else if(state.engaged||state.hoverMix>0||state.targetHover>0)wake();
  }
  const observer=new scope.ResizeObserver(resize);observer.observe(root);
  on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',refresh);
  root.dataset.renderer=gl?'webgl':'canvas2d';
  applyOptions();resize();
  document.fonts.load('500 34px "LiquidCallInter"').catch(()=>[]).then(()=>{
    if(destroyed)return;draw();root.dataset.ready='true';
  });
  return {
    update(next){if(destroyed)return;options={...options,...next};refresh();},
    destroy(){
      if(destroyed)return;destroyed=true;
      if(raf!==null)cancelAnimationFrame(raf);clearTimeout(toastTimer);observer.disconnect();
      if(gl){
        gpu.shaders.forEach(shader=>gl.deleteShader(shader));
        if(gpu.program)gl.deleteProgram(gpu.program);if(gpu.buffer)gl.deleteBuffer(gpu.buffer);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.width=1;canvas.height=1;
    },
  };
}
