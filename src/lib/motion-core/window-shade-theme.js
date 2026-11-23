/* Supplied HTML adaptation. Design reference: @mjbarton_. Source license unverified. */
import {vertex,fragment} from './window-shade-theme-shaders.mjs';

export function createWindowShadeTheme(scope,initial={}){
  const {document,on,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout}=scope;
  const root=document.getElementById('shadeTheme'),htmlEl=root;
  const windowWrap=document.getElementById('windowWrap'),windowOuter=document.getElementById('windowOuter'),windowMid=document.getElementById('windowMid'),windowInnerRing=document.getElementById('windowInnerRing'),windowAperture=document.getElementById('windowAperture'),windowShadow=document.getElementById('windowShadow'),windowShade=document.getElementById('windowShade'),shadeCastShadow=document.getElementById('shadeCastShadow'),contentShell=document.getElementById('contentShell'),glassGlint=root.querySelector('.glass-glint');
  let canvas=document.getElementById('skyCanvas');
  let options={...initial},destroyed=false,raf=null,prevTime=null,time=0,visible=true,themeCommitTimer=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  const SHADE_OPEN_Y=-204,SHADE_CLOSED_Y=8,SHADE_TRAVEL=212;
  const BG_LIGHT=initial.preview?[244,244,244]:[255,255,255],BG_DARK=[22,22,22];
  let progress=0,target=0,velocity=0,isDragging=false,dragStartY=0,dragStartProgress=0,lastPointerY=0,lastPointerTime=0,pointerVelocity=0,totalDragMove=0,pointerId=null;
  let committedTheme='light',pendingTheme=null,notifyTheme=false;
  const reduced=()=>scope.reduced(),suspended=()=>Boolean(options.paused)||document.hidden||!visible;
  const resources=[];let gl=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true}),program=null,buffer=null,attribute=null,uTime=null,ctx=null;
  const gpu=gl,track=(kind,value)=>{resources.push({kind,value});return value;};
  function dispose(){if(!gpu)return;for(const {kind,value} of resources)gpu['delete'+kind[0].toUpperCase()+kind.slice(1)](value);resources.length=0;gpu.getExtension('WEBGL_lose_context')?.loseContext();}
  if(gl)try{
    const compile=(type,source)=>{const shader=track('shader',gl.createShader(type));gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    program=track('program',gl.createProgram());gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    buffer=track('buffer',gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);attribute=gl.getAttribLocation(program,'aPos');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);uTime=gl.getUniformLocation(program,'uTime');
  }catch(error){root.dataset.gpuError=error.message;dispose();const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;gl=null;}
  if(!gl)ctx=canvas.getContext('2d');root.dataset.renderer=gl?'webgl2':'canvas2d';
  function drawSky(){
    if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);gl.uniform1f(uTime,time);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
    else if(ctx){const w=canvas.width,h=canvas.height,g=ctx.createLinearGradient(0,0,0,h*.52);g.addColorStop(0,'#6ab4fd');g.addColorStop(.65,'#99cefe');g.addColorStop(1,'#dcebf7');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const cg=ctx.createLinearGradient(0,h*.45,0,h);cg.addColorStop(0,'#eef2f5');cg.addColorStop(.5,'#d2d8df');cg.addColorStop(1,'#adb9c8');ctx.fillStyle=cg;ctx.fillRect(0,h*.46,w,h*.54);const drift=time*22%(w+160);ctx.fillStyle='rgba(255,255,255,.42)';for(let i=0;i<6;i++){const x=w+80-((drift+i*95)%(w+180)),y=h*(.56+i%3*.12);ctx.beginPath();ctx.ellipse(x,y,75,34,0,0,Math.PI*2);ctx.fill();}}
  }
      function applyVisualState(p) {
        const shadeY = lerp(SHADE_OPEN_Y, SHADE_CLOSED_Y, p);
        windowShade.style.transform = `translate3d(0, ${shadeY.toFixed(2)}px, 0)`;

        const shadowY = shadeY + 242;
        const shadowOpacity = clamp(1 - Math.max(0, (p - 0.85) / 0.12), 0, 1);
        shadeCastShadow.style.transform = `translate3d(0, ${shadowY.toFixed(2)}px, 0)`;
        shadeCastShadow.style.opacity = shadowOpacity.toFixed(3);

        const amb = clamp(Math.pow(p, 0.95), 0, 1);

        const r = Math.round(lerp(BG_LIGHT[0], BG_DARK[0], amb));
        const g = Math.round(lerp(BG_LIGHT[1], BG_DARK[1], amb));
        const b = Math.round(lerp(BG_LIGHT[2], BG_DARK[2], amb));
        const bgCss = `rgb(${r}, ${g}, ${b})`;
        htmlEl.style.backgroundColor = bgCss;


        const bezelBright = lerp(1.0, 0.145, amb);
        const bezelSat = lerp(1.0, 0.35, amb);

        windowOuter.style.background = amb < 0.001
          ? ''
          : `linear-gradient(155deg,
              rgb(${Math.round(lerp(215, 34, amb))}, ${Math.round(lerp(208, 34, amb))}, ${Math.round(lerp(200, 34, amb))}) 0%,
              rgb(${Math.round(lerp(207, 30, amb))}, ${Math.round(lerp(199, 30, amb))}, ${Math.round(lerp(190, 30, amb))}) 28%,
              rgb(${Math.round(lerp(228, 38, amb))}, ${Math.round(lerp(221, 38, amb))}, ${Math.round(lerp(213, 38, amb))}) 62%,
              rgb(${Math.round(lerp(210, 31, amb))}, ${Math.round(lerp(201, 31, amb))}, ${Math.round(lerp(192, 31, amb))}) 100%)`;

        windowOuter.style.boxShadow = `
          0 2px 6px rgba(0, 0, 0, ${lerp(0.12, 0.45, amb).toFixed(3)}),
          0 10px 24px rgba(0, 0, 0, ${lerp(0.09, 0.55, amb).toFixed(3)}),
          inset 0 2px 3px rgba(255, 252, 248, ${lerp(0.72, 0.08, amb).toFixed(3)}),
          inset 0 -3px 5px rgba(0, 0, 0, ${lerp(0.24, 0.65, amb).toFixed(3)}),
          inset 2px 0 3px rgba(0, 0, 0, ${lerp(0.15, 0.45, amb).toFixed(3)}),
          inset -2px 0 3px rgba(0, 0, 0, ${lerp(0.15, 0.45, amb).toFixed(3)})`;

        windowMid.style.background = `linear-gradient(162deg,
          rgb(${Math.round(lerp(235, 34, amb))}, ${Math.round(lerp(230, 34, amb))}, ${Math.round(lerp(223, 34, amb))}) 0%,
          rgb(${Math.round(lerp(245, 39, amb))}, ${Math.round(lerp(241, 39, amb))}, ${Math.round(lerp(235, 39, amb))}) 45%,
          rgb(${Math.round(lerp(230, 32, amb))}, ${Math.round(lerp(224, 32, amb))}, ${Math.round(lerp(216, 32, amb))}) 85%,
          rgb(${Math.round(lerp(220, 29, amb))}, ${Math.round(lerp(213, 29, amb))}, ${Math.round(lerp(204, 29, amb))}) 100%)`;

        windowMid.style.boxShadow = `
          0 1px 2px rgba(255, 255, 255, ${lerp(0.55, 0.05, amb).toFixed(3)}),
          inset 0 3px 7px rgba(0, 0, 0, ${lerp(0.20, 0.62, amb).toFixed(3)}),
          inset 0 -2px 4px rgba(255, 252, 246, ${lerp(0.78, 0.05, amb).toFixed(3)})`;

        windowInnerRing.style.background = `linear-gradient(180deg,
          rgb(${Math.round(lerp(180, 25, amb))}, ${Math.round(lerp(172, 25, amb))}, ${Math.round(lerp(162, 25, amb))}) 0%,
          rgb(${Math.round(lerp(220, 31, amb))}, ${Math.round(lerp(214, 31, amb))}, ${Math.round(lerp(206, 31, amb))}) 35%,
          rgb(${Math.round(lerp(242, 35, amb))}, ${Math.round(lerp(237, 35, amb))}, ${Math.round(lerp(231, 35, amb))}) 100%)`;

        windowInnerRing.style.boxShadow = `
          inset 0 2px 5px rgba(0, 0, 0, ${lerp(0.32, 0.72, amb).toFixed(3)}),
          0 1px 1px rgba(255, 255, 255, ${lerp(0.72, 0.04, amb).toFixed(3)})`;

        // Fade bezel diagonal sheen, white glass seal ring, and sealed sky completely out in dark mode
        windowMid.style.setProperty('--sheen-opacity', clamp(1 - amb * 1.35, 0, 1).toFixed(3));
        if (glassGlint) {
          glassGlint.style.opacity = clamp(1 - amb * 1.15, 0, 1).toFixed(3);
        }
        canvas.style.opacity = p > 0.96 ? clamp(1 - (p - 0.96) / 0.035, 0, 1).toFixed(3) : '1';

        windowShade.style.filter = `brightness(${bezelBright.toFixed(3)}) saturate(${bezelSat.toFixed(3)})`;
        windowShadow.style.opacity = lerp(1, 0.55, amb).toFixed(3);

        if (committedTheme === 'light') {
          const dimFactor = lerp(1.0, 0.08, Math.pow(amb, 1.35));
          contentShell.style.filter = `brightness(${dimFactor.toFixed(3)})`;
        } else {
          const washOpacity = lerp(0.06, 1.0, Math.pow(amb, 1.1));
          contentShell.style.filter = 'none';
          contentShell.style.opacity = washOpacity.toFixed(3);
        }

        windowWrap.setAttribute('aria-valuenow', String(Math.round(p * 100)));
        windowWrap.setAttribute('aria-valuetext', (p<.005?'Open, light mode':p>.995?'Closed, dark mode':Math.round(p*100)+'% closed'));
        root.dataset.progress=p.toFixed(4);root.dataset.target=String(target);root.dataset.dragging=String(isDragging);
      }
  function clearCommit(){if(themeCommitTimer!==null)clearTimeout(themeCommitTimer);themeCommitTimer=null;}
  function commitTheme(theme,notify=false){
    clearCommit();pendingTheme=null;const changed=theme!==committedTheme;committedTheme=theme;root.dataset.theme=theme;
    contentShell.style.filter='none';contentShell.style.opacity='0';void contentShell.offsetWidth;contentShell.style.opacity='1';
    if(changed&&notify)options.onThemeChange?.(theme);
  }
  function scheduleCommit(theme,notify=false){
    clearCommit();pendingTheme=theme;notifyTheme=notify;
    if(theme===committedTheme){pendingTheme=null;return;}
    if(reduced()){commitTheme(theme,notify);return;}
    if(suspended())return;
    themeCommitTimer=setTimeout(()=>{themeCommitTimer=null;if(!destroyed)commitTheme(theme,notifyTheme);},theme==='dark'?210:150);
  }
  function commitTarget(next,notify=true){target=next;notifyTheme=notify;scheduleCommit(next===1?'dark':'light',notify);if(reduced()){progress=target;velocity=0;}paint();schedule();}
  function release(){if(pointerId!==null&&windowAperture.hasPointerCapture?.(pointerId))windowAperture.releasePointerCapture(pointerId);pointerId=null;isDragging=false;windowAperture.classList.remove('dragging');}
  function cancelDrag(){if(!isDragging)return;release();velocity=0;target=committedTheme==='dark'?1:0;pendingTheme=null;clearCommit();if(reduced())progress=target;paint();schedule();}
  const localY=event=>scope.point?scope.point(event).y:event.clientY;
  on(windowAperture,'pointerdown',event=>{
    if((event.button!==undefined&&event.button!==0)||isDragging)return;event.preventDefault();windowWrap.focus({preventScroll:true});isDragging=true;velocity=0;totalDragMove=0;pointerId=event.pointerId;dragStartY=lastPointerY=localY(event);dragStartProgress=progress;lastPointerTime=performance.now();pointerVelocity=0;windowAperture.classList.add('dragging');
    if(event.isTrusted)windowAperture.setPointerCapture?.(event.pointerId);clearCommit();pendingTheme=null;paint();schedule();
  });
  on(windowAperture,'pointermove',event=>{
    if(!isDragging||event.pointerId!==pointerId)return;const now=performance.now(),py=localY(event),dt=Math.max(1,now-lastPointerTime)/1000;
    totalDragMove+=Math.abs(py-lastPointerY);pointerVelocity=pointerVelocity*.55+((py-lastPointerY)/SHADE_TRAVEL/dt)*.45;lastPointerY=py;lastPointerTime=now;progress=clamp(dragStartProgress+(py-dragStartY)/SHADE_TRAVEL,0,1);
    if(progress>=.995&&committedTheme==='light'&&pendingTheme!=='dark')scheduleCommit('dark',true);
    else if(progress<=.005&&committedTheme==='dark'&&pendingTheme!=='light')scheduleCommit('light',true);
    else if(progress>.005&&progress<.995){clearCommit();pendingTheme=null;}
    paint();
  });
  on(windowAperture,'pointerup',event=>{if(!isDragging||event.pointerId!==pointerId)return;release();if(totalDragMove<5)commitTarget(target===0?1:0);else{velocity=clamp(pointerVelocity,-4.5,4.5);commitTarget(progress+pointerVelocity*.09>=.5?1:0);}});
  on(windowAperture,'pointercancel',cancelDrag);on(windowAperture,'lostpointercapture',cancelDrag);
  on(windowWrap,'keydown',event=>{
    const key=event.key;if(![' ','Enter','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(key))return;event.preventDefault();release();
    commitTarget(key===' '||key==='Enter'?(target===0?1:0):['ArrowDown','ArrowRight','End'].includes(key)?1:0);
  });
  function paint(){if(destroyed)return;applyVisualState(progress);drawSky();root.dataset.time=time.toFixed(3);root.dataset.animating=String(!isDragging&&(Math.abs(target-progress)>=.0008||Math.abs(velocity)>=.002));root.dataset.ready='true';}
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;prevTime=null;}
  function schedule(){if(!destroyed&&!suspended()&&!reduced()&&raf===null&&(progress<.995||Math.abs(target-progress)>=.0008||Math.abs(velocity)>=.002||isDragging))raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=null;if(destroyed||suspended()||reduced())return;const dt=prevTime===null?0:clamp((now-prevTime)/1000,0,.04);prevTime=now;time+=dt;
    if(!isDragging){velocity+=((target-progress)*210-velocity*25)*dt;progress+=velocity*dt;if(Math.abs(target-progress)<.0008&&Math.abs(velocity)<.002){progress=target;velocity=0;}else progress=clamp(progress,0,1);}
    paint();schedule();
  }
  function playback(){stop();clearCommit();root.dataset.paused=String(Boolean(options.paused)||document.hidden);root.dataset.reduced=String(reduced());
    if(reduced()&&!isDragging){progress=target;velocity=0;if(pendingTheme)commitTheme(pendingTheme,notifyTheme);}
    else if(pendingTheme&&!suspended())scheduleCommit(pendingTheme,notifyTheme);
    paint();schedule();
  }
  function setState(next){
    release();clearCommit();pendingTheme=null;velocity=0;
    const theme=next.theme==='dark'?'dark':next.theme==='light'?'light':committedTheme;
    if(Object.hasOwn(next,'theme'))commitTheme(theme);
    if(Object.hasOwn(next,'progress')&&Number.isFinite(next.progress))progress=target=clamp(next.progress,0,1);
    else if(Object.hasOwn(next,'theme'))progress=target=theme==='dark'?1:0;
  }
  on(document,'visibilitychange',()=>{if(document.hidden)cancelDrag();playback();});on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',playback);
  const observer=new scope.IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);if(!visible)cancelDrag();playback();});observer.observe(root);
  root.dataset.preview=String(Boolean(initial.preview));root.dataset.theme='light';windowWrap.setAttribute('aria-orientation','vertical');setState(initial);playback();
  return {
    update(next={}){if(destroyed)return;options={...options,...next};if(Object.hasOwn(next,'theme')||Object.hasOwn(next,'progress'))setState(next);playback();},
    destroy(){if(destroyed)return;release();destroyed=true;stop();clearCommit();observer.disconnect();root.getAnimations({subtree:true}).forEach(a=>a.cancel());dispose();canvas.width=1;canvas.height=1;},
  };
}
