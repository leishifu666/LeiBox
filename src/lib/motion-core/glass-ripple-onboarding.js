/* Supplied HTML adaptation. Design reference: @moizarshi29.
   No separate source or embedded-artwork license was supplied or verified. */
import {PAINTING_SRC} from './glass-ripple-onboarding-assets.mjs';

export function createGlassRippleOnboarding(scope,initial={}){
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame}=scope;
  const root=document.getElementById('glassRippleOnboarding');
  const canvas=document.getElementById('ripple-canvas'),card=document.getElementById('phoneCard');
  const uiLayer=document.getElementById('uiLayer'),sheet=document.getElementById('setupSheet');
  const startButton=document.getElementById('getStartedBtn'),closeButton=document.getElementById('closeSheetBtn');
  const pulseButton=document.getElementById('starburstBtn'),goalList=document.getElementById('goalList');
  const continueButton=document.getElementById('continueGoalBtn'),status=document.getElementById('setupStatus');
  const goals=[...goalList.querySelectorAll('.goal-option')];
  const values=['spending','emergency','milestone'];
  const labels=goals.map(button=>button.dataset.goal);
  const CENTER_X=.5,CENTER_Y=.655,RING_PERIOD=2,RING_WAVELENGTH=.158;
  let options={...initial},destroyed=false,ready=false,raf=null,elapsed=0,lastTime=0,pulseStart=-10,pulses=0;
  let open=false,goal=values.includes(initial.goal)?initial.goal:'spending',render=null;
  const reduced=()=>scope.reduced();
  const running=()=>!reduced()&&!options.paused&&!document.hidden;
  const img=new Image();
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
  const gpu={shaders:[],program:null,buffer:null,texture:null};

  const VERT_SRC = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision highp float;
  uniform sampler2D u_tex;
  uniform vec2 u_res;
  uniform vec2 u_imgSize;
  uniform float u_time;
  uniform float u_pulseStart;
  varying vec2 v_uv;

  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;

  vec2 coverUV(vec2 uv) {
    float canvasAspect = u_res.x / u_res.y;
    float imgAspect = u_imgSize.x / u_imgSize.y;
    vec2 scale = vec2(1.0);
    if (canvasAspect > imgAspect) {
      scale.y = imgAspect / canvasAspect;
    } else {
      scale.x = canvasAspect / imgAspect;
    }
    return (uv - 0.5) * (scale * 0.94) + 0.5;
  }

  // Smooth C-infinity Gerstner-like asymmetric liquid wave slope (zero slicing or hard cuts)
  float waveSlope(float theta) {
    float skewed = theta + 0.44 * sin(theta);
    float d1 = cos(skewed) * (1.0 + 0.44 * cos(theta));
    // Subtle trailing secondary capillary swell for organic liquid feel
    float d2 = 0.22 * cos(2.0 * theta - 0.55);
    return d1 + d2;
  }

  void main() {
    float aspect = u_res.x / u_res.y;
    vec2 center = vec2(${CENTER_X.toFixed(4)}, ${CENTER_Y.toFixed(4)});
    vec2 delta = (v_uv - center) * vec2(aspect, 1.0);
    float dist = length(delta);
    vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0, -1.0);
    float angle = atan(delta.y, delta.x);

    float wavelength = ${RING_WAVELENGTH.toFixed(4)};
    float speed = wavelength / ${RING_PERIOD.toFixed(4)};

    // Gentle organic angular undulation so waves feel fluid rather than compass-drawn
    float organicWarp = 0.0045 * sin(angle * 3.0 + u_time * 0.55)
                      + 0.0025 * cos(angle * 5.0 - u_time * 0.38);

    // Slightly expanding wavelength with distance (natural dispersion of water ripples)
    float warpedDist = dist + organicWarp * smoothstep(0.05, 0.28, dist);
    float theta = ((warpedDist - u_time * speed) / wavelength) * TAU;

    // Smooth envelope: calm right inside starburst, rich in mid-field, graceful fade into upper sky
    float innerEnv = smoothstep(0.032, 0.11, dist);
    float outerEnv = exp(-dist * 1.12);
    float env = innerEnv * outerEnv;

    float slope = waveSlope(theta) * env;

    // Interactive tap ripple (smooth Gaussian-windowed liquid wave packet)
    float pulseAge = u_time - u_pulseStart;
    if (pulseAge > 0.0 && pulseAge < 2.4) {
      float pRadius = pulseAge * 0.42;
      float pDiff = dist - pRadius;
      float packet = exp(-pDiff * pDiff * 240.0) * (1.0 - pulseAge / 2.4);
      slope += sin(pDiff * 52.0) * packet * 1.45;
    }

    // Smooth optical refraction displacement (proportional to surface slope)
    float refractStrength = 0.030;
    vec2 disp = (dir * (slope * refractStrength)) / vec2(aspect, 1.0);

    // Subtle liquid-lens softness along steep wave crests (3-tap radial optical sampling)
    float steepness = clamp(abs(slope), 0.0, 2.0);
    vec2 blurStep = (dir * (0.0026 * steepness)) / vec2(aspect, 1.0);

    // Ultra-subtle optical dispersion (keeps painting natural, no harsh rainbow fringes)
    vec2 uvC = clamp(coverUV(v_uv - disp), 0.002, 0.998);
    vec2 uvP = clamp(coverUV(v_uv - disp - blurStep), 0.002, 0.998);
    vec2 uvM = clamp(coverUV(v_uv - disp + blurStep), 0.002, 0.998);

    vec3 colC = texture2D(u_tex, uvC).rgb;
    vec3 colP = texture2D(u_tex, uvP).rgb;
    vec3 colM = texture2D(u_tex, uvM).rgb;
    vec3 col = colC * 0.56 + (colP + colM) * 0.22;

    // True 3D water surface normal for soft natural lighting & specular gloss
    vec3 N = normalize(vec3(-dir * slope * 0.52, 1.0));
    vec3 L = normalize(vec3(-0.22, -0.55, 0.80));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);

    // Soft diffuse shading & caustic volume (gives liquid depth without any hard outlines)
    float ndl = dot(N, L);
    float baseNdl = dot(vec3(0.0, 0.0, 1.0), L);
    float shading = 1.0 + (ndl - baseNdl) * 0.14;
    col *= shading;

    // Delicate glossy water highlight only on curved crests facing overhead light
    float spec = pow(max(dot(N, H), 0.0), 52.0) * 0.18 * env;
    // Gentle Fresnel sky sheen along steep water shoulders
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.8) * 0.11 * env;
    col += vec3(0.94, 0.96, 0.92) * (spec + fresnel);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;



  function publish(){
    root.dataset.open=String(open);root.dataset.goal=goal;
    root.dataset.time=elapsed.toFixed(3);root.dataset.pulses=String(pulses);
    root.dataset.paused=String(Boolean(options.paused));root.dataset.reduced=String(reduced());
  }
  function draw(){if(!destroyed&&ready){render(elapsed);publish();}}
  function wake(){
    if(!destroyed&&ready&&running()&&raf===null){lastTime=performance.now();raf=requestAnimationFrame(tick);}
  }
  function tick(now){
    raf=null;
    if(destroyed||!ready||!running())return;
    elapsed+=Math.max(0,(now-lastTime)*.001);lastTime=Math.max(lastTime,now);
    draw();raf=requestAnimationFrame(tick);
  }
  function pulse(){
    if(destroyed)return;
    pulses++;if(running())pulseStart=elapsed;publish();draw();wake();
  }
  function setGoal(value,notify=false){
    if(!values.includes(value)||destroyed)return;
    const changed=goal!==value;goal=value;
    goals.forEach((button,index)=>{
      const active=values[index]===goal;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-checked',String(active));button.tabIndex=active?0:-1;
      button.querySelector('.goal-check').textContent=active?'✓':'';
    });
    status.textContent='';publish();
    if(changed&&notify)options.onGoalChange?.(goal);
  }
  function setOpen(value,notify=false,focus=false){
    if(destroyed)return;
    const changed=open!==value;open=value;
    // Blur before hiding the previous layer; iframe replays never move host focus.
    const previous=open?uiLayer:sheet;
    if(previous.contains(document.activeElement))document.activeElement.blur();
    uiLayer.classList.toggle('is-hidden',open);uiLayer.inert=open;
    uiLayer.setAttribute('aria-hidden',String(open));
    sheet.classList.toggle('is-open',open);sheet.inert=!open;
    sheet.setAttribute('aria-hidden',String(!open));status.textContent='';publish();
    if(focus)(open?goals[values.indexOf(goal)]:startButton).focus({preventScroll:true});
    if(changed&&notify)options.onOpenChange?.(open);
  }
  on(pulseButton,'click',pulse);on(canvas,'click',pulse);
  on(startButton,'click',event=>{pulse();setOpen(true,true,event.isTrusted);});
  on(closeButton,'click',event=>setOpen(false,true,event.isTrusted));
  goals.forEach((button,index)=>on(button,'click',()=>setGoal(values[index],true)));
  on(goalList,'keydown',event=>{
    if(!open||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const current=values.indexOf(goal);
    const index=event.key==='Home'?0:event.key==='End'?2:(current+(['ArrowUp','ArrowLeft'].includes(event.key)?2:1))%3;
    setGoal(values[index],true);goals[index].focus({preventScroll:true});
  });
  on(root,'keydown',event=>{
    if(open&&event.key==='Escape'){event.preventDefault();setOpen(false,true,event.isTrusted);}
  });
  on(continueButton,'click',()=>{
    if(destroyed||!open)return;
    pulse();status.textContent='Ready: '+labels[values.indexOf(goal)];options.onContinue?.(goal);
  });

  function compile(type,source){
    const shader=gl.createShader(type);gpu.shaders.push(shader);
    gl.shaderSource(shader,source);gl.compileShader(shader);return shader;
  }
  function initWebGL(){
    const program=gl.createProgram();gpu.program=program;
    gl.attachShader(program,compile(gl.VERTEX_SHADER,VERT_SRC));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAG_SRC));
    gl.linkProgram(program);gl.useProgram(program);
    const buffer=gl.createBuffer();gpu.buffer=buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gpu.texture=texture;gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    const res=gl.getUniformLocation(program,'u_res'),imageSize=gl.getUniformLocation(program,'u_imgSize');
    const time=gl.getUniformLocation(program,'u_time'),pulseTime=gl.getUniformLocation(program,'u_pulseStart');
    render=seconds=>{
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(res,canvas.width,canvas.height);gl.uniform2f(imageSize,img.naturalWidth,img.naturalHeight);
      gl.uniform1f(time,seconds);gl.uniform1f(pulseTime,pulseStart);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
  }
  function initCanvas2D(){
    const ctx=canvas.getContext('2d');
    function cover(scaleBoost){
      const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight)*scaleBoost;
      const width=img.naturalWidth*scale,height=img.naturalHeight*scale;
      ctx.drawImage(img,(canvas.width-width)*.5,(canvas.height-height)*.5,width,height);
    }
    render=seconds=>{
      const width=canvas.width,height=canvas.height,cx=width*CENTER_X,cy=height*CENTER_Y;
      const wave=height*RING_WAVELENGTH,offset=(seconds%RING_PERIOD)/RING_PERIOD*wave;
      ctx.clearRect(0,0,width,height);cover(1);
      for(let index=5;index>=0;index--){
        const radius=index*wave+offset;if(radius<8)continue;
        ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();cover(index%2===0?1.035:.975);ctx.restore();
        ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,255,255,'+Math.max(.04,.22-index*.035)+')';ctx.lineWidth=Math.max(1,width*.004);ctx.stroke();
      }
    };
  }
  function resize(){
    if(destroyed)return;
    const height=Math.max(1,Math.min(root.clientHeight*.9,780,Math.max(1,root.clientWidth-32)*460/219));
    root.style.setProperty('--phone-h',height+'px');root.style.setProperty('--phone-w',height*219/460+'px');
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const width=Math.max(1,Math.round(card.clientWidth*dpr)),pixels=Math.max(1,Math.round(card.clientHeight*dpr));
    if(canvas.width!==width)canvas.width=width;if(canvas.height!==pixels)canvas.height=pixels;
    draw();
  }
  function refresh(){
    if(destroyed)return;
    if(raf!==null)cancelAnimationFrame(raf);raf=null;publish();resize();wake();
  }
  on(document,'visibilitychange',refresh);
  on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',refresh);
  const observer=new scope.ResizeObserver(resize);observer.observe(root);
  root.dataset.renderer=gl?'webgl':'canvas2d';setGoal(goal);setOpen(Boolean(initial.open));resize();
  img.onload=()=>{
    if(destroyed)return;
    if(gl)initWebGL();else initCanvas2D();
    ready=true;resize();draw();root.dataset.ready='true';wake();
  };
  img.src=PAINTING_SRC;
  return {
    update(next){
      if(destroyed)return;options={...options,...next};
      if(values.includes(next.goal))setGoal(next.goal);
      if(typeof next.open==='boolean')setOpen(next.open);
      refresh();
    },
    destroy(){
      if(destroyed)return;destroyed=true;
      if(raf!==null)cancelAnimationFrame(raf);observer.disconnect();img.onload=null;img.src='';
      root.querySelectorAll('.starburst-svg').forEach(node=>node.getAnimations().forEach(animation=>animation.cancel()));
      if(gl){
        gpu.shaders.forEach(shader=>gl.deleteShader(shader));
        if(gpu.texture)gl.deleteTexture(gpu.texture);if(gpu.program)gl.deleteProgram(gpu.program);if(gpu.buffer)gl.deleteBuffer(gpu.buffer);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.width=1;canvas.height=1;
    },
  };
}
