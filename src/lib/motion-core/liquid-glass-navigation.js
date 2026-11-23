/* Supplied HTML adaptation. Design reference: @jesse_vermeulen.
   Source and photograph licenses were not supplied or verified. */
import {vertex,fragment} from './liquid-glass-navigation-shaders.mjs';

export function createLiquidGlassNavigation(scope,initial={}){
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout}=scope;
  const root=document.getElementById('glassNavigation'),canvas=root.querySelector('canvas'),image=root.querySelector('img');
  const overlay=root.querySelector('.glass-dropdown-overlay'),bridge=root.querySelector('.hover-bridge'),pill=root.querySelector('.hover-pill');
  const triggers=[...root.querySelectorAll('.nav-trigger')],panes=[...root.querySelectorAll('.menu-pane')];
  const keys=['product','resources','company'],counts={product:5,resources:4,company:3};
  let options={...initial},destroyed=false,raf=null,lastTime=null,time=0,visible=true,renderScale=1,closeTimer=null;
  let active=null,hovered=null,scroll=0,rippleTime=-10,ripple={x:.5,y:.5};
  const spring=(value,k=320,c=27)=>({value,target:value,vel:0,k,c});
  const x=spring(0),y=spring(0),w=spring(304),h=spring(296,300,26),opening=spring(0,290,25),pillY=spring(14,440,32),pillAlpha=spring(0,340,28);
  const springs=[x,y,w,h,opening,pillY,pillAlpha];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rawRect=node=>scope.rect?scope.rect(node):node.getBoundingClientRect();
  const rect=node=>{const r=rawRect(node),origin=rawRect(root);return {left:r.left-origin.left,top:r.top-origin.top,right:r.right-origin.left,bottom:r.bottom-origin.top,width:r.width,height:r.height};};
  const width=()=>root.clientWidth,height=()=>root.clientHeight;
  function step(s,dt){const n=Math.max(1,Math.ceil(dt/.004)),d=dt/n;for(let i=0;i<n;i++){s.vel+=((s.target-s.value)*s.k-s.vel*s.c)*d;s.value+=s.vel*d;}}
  function snap(){for(const s of springs){s.value=s.target;s.vel=0;}}
  const reduced=()=>scope.reduced(),suspended=()=>Boolean(options.paused)||document.hidden||!visible;
  function metrics(key){const r=rect(triggers[keys.indexOf(key)]),pw=Math.min(Math.max(264,width()*.295),328,width()-28);return {x:clamp(r.left-30,14,width()-14-pw),y:r.bottom+10,w:pw,h:counts[key]*52+(counts[key]-1)*2+28,trigger:r};}
  function position(key,snapPosition=false){
    const m=metrics(key);x.target=m.x;y.target=m.y;w.target=m.w;h.target=m.h;
    if(snapPosition){x.value=m.x;y.value=m.y-6;w.value=m.w;h.value=m.h;for(const s of [x,y,w,h])s.vel=0;}
    bridge.style.left=Math.min(m.x,m.trigger.left-14)+'px';bridge.style.top=m.trigger.bottom-2+'px';bridge.style.width=Math.max(m.w,m.trigger.width+28)+'px';
  }
  function cancelClose(){if(closeTimer!==null)clearTimeout(closeTimer);closeTimer=null;}
  function setMenu(key,notify=false,snapPosition=false){
    if(destroyed)return;cancelClose();const before=active,wasClosed=!active&&opening.value<.08;
    active=keys.includes(key)?key:null;hovered=null;pillAlpha.target=0;opening.target=active?1:0;
    triggers.forEach(node=>node.setAttribute('aria-expanded',String(node.dataset.menu===active)));
    panes.forEach((pane,i)=>{const show=keys[i]===active;pane.classList.toggle('is-active',show);pane.inert=!show;pane.setAttribute('aria-hidden',String(!show));});
    overlay.inert=!active;overlay.setAttribute('aria-hidden',String(!active));overlay.classList.toggle('is-open',Boolean(active));bridge.classList.toggle('is-active',Boolean(active));
    if(active){position(active,wasClosed||snapPosition);overlay.setAttribute('aria-labelledby',triggers[keys.indexOf(active)].id);}
    root.dataset.menu=active||'none';if(reduced())snap();paint();schedule();
    if(notify&&before!==active)options.onMenuChange?.(active);
  }
  function scheduleClose(){cancelClose();closeTimer=setTimeout(()=>{closeTimer=null;setMenu(null,true);},150);}
  function highlight(node){const index=[...node.parentNode.children].indexOf(node),target=14+index*54;if(!hovered&&pillAlpha.value<.08){pillY.value=target;pillY.vel=0;}hovered=node;pillY.target=target;pillAlpha.target=1;if(reduced())snap();paint();schedule();}
  triggers.forEach((node,index)=>{
    on(node,'pointerenter',event=>{if(event.pointerType==='mouse')setMenu(keys[index],true);});
    on(node,'pointerleave',event=>{if(event.pointerType==='mouse')scheduleClose();});
    on(node,'click',event=>{event.stopPropagation();setMenu(event.detail===0||event.pointerType==='touch'?(active===keys[index]?null:keys[index]):keys[index],true);});
    on(node,'keydown',event=>{
      if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
        event.preventDefault();cancelClose();
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){setMenu(keys[index],true);const items=panes[index].querySelectorAll('.menu-item');items[event.key==='ArrowUp'?items.length-1:0].focus();}
        else{const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowLeft'?2:1))%3;triggers[next].focus();if(active)setMenu(keys[next],true);}
      }
    });
  });
  for(const node of [overlay,bridge]){
    on(node,'pointerenter',cancelClose);
    on(node,'pointerleave',event=>{if(event.pointerType==='mouse'){hovered=null;pillAlpha.target=0;scheduleClose();}});
  }
  panes.forEach((pane,paneIndex)=>{
    const items=[...pane.querySelectorAll('.menu-item')];
    items.forEach((node,index)=>{
      on(node,'pointerenter',()=>highlight(node));on(node,'focus',()=>{cancelClose();highlight(node);});
      on(node,'click',event=>{
        cancelClose();const origin=rawRect(root),point=scope.point?scope.point(event):{x:event.clientX,y:event.clientY},p={x:point.x-origin.left,y:point.y-origin.top};const r=rect(node);
        ripple=event.detail===0?{x:(r.left+r.width/2)/width(),y:1-(r.top+r.height/2)/height()}:{x:p.x/width(),y:1-p.y/height()};rippleTime=time;
        root.dataset.action=node.textContent.trim();options.onAction?.(keys[paneIndex],node.textContent.trim());paint();schedule();
      });
      on(node,'keydown',event=>{
        const key=event.key;
        if(['ArrowDown','ArrowUp','Home','End'].includes(key)){event.preventDefault();items[key==='Home'?0:key==='End'?items.length-1:(index+(key==='ArrowDown'?1:items.length-1))%items.length].focus();}
        else if(key==='ArrowLeft'||key==='ArrowRight'){event.preventDefault();const next=(paneIndex+(key==='ArrowRight'?1:2))%3;setMenu(keys[next],true);panes[next].querySelector('.menu-item').focus();}
      });
    });
  });
  on(root,'keydown',event=>{if(event.key==='Escape'&&active){const index=keys.indexOf(active);event.preventDefault();event.stopPropagation();setMenu(null,true);if(event.isTrusted)triggers[index].focus();}});
  on(root,'pointerdown',event=>{if(!event.target.closest('.nav-bar,.glass-dropdown-overlay,.hover-bridge'))setMenu(null,true);});
  on(document,'pointerdown',event=>{if(active&&!event.composedPath().includes(root))setMenu(null,true);});
  on(root,'focusout',()=>{cancelClose();closeTimer=setTimeout(()=>{closeTimer=null;const focused=document.activeElement;if(!focused||!root.contains(focused))setMenu(null,true);},0);});
  on(root,'wheel',event=>{if(!options.paused&&!reduced()){scroll+=event.deltaY*.00035;paint();}},{passive:true});

  const resources=[];let gl=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true}),program=null,texture=null,buffer=null,attribute=null,uniforms={};
  const gpu=gl,track=(kind,value)=>{resources.push({kind,value});return value;};
  function dispose(){if(!gpu)return;for(const {kind,value} of resources)gpu['delete'+kind[0].toUpperCase()+kind.slice(1)](value);resources.length=0;gpu.getExtension('WEBGL_lose_context')?.loseContext();}
  if(gl)try{
    const compile=(type,source)=>{const shader=track('shader',gl.createShader(type));gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    program=track('program',gl.createProgram());gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    buffer=track('buffer',gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);attribute=gl.getAttribLocation(program,'aPos');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    for(const key of ['uBgTex','uResolution','uImgSize','uDpr','uTime','uScroll','uPanelRect','uCornerRad','uOpen','uRippleAge','uRipplePos'])uniforms[key]=gl.getUniformLocation(program,key);
    texture=track('texture',gl.createTexture());gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([91,127,164,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  }catch(error){root.dataset.gpuError=error.message;dispose();gl=null;}
  root.dataset.renderer=gl?'webgl2':'css';root.style.setProperty('--glass-background',`url("${image.src}")`);
  function upload(){if(destroyed||!image.naturalWidth)return;root.style.setProperty('--glass-background',`url("${image.src}")`);if(gl){gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);}root.dataset.loaded='true';paint();schedule();}
  on(image,'load',upload);on(image,'error',()=>{root.dataset.imageError='true';paint();});
  let dpr=1;
  function resize(){if(destroyed)return;dpr=Math.min(window.devicePixelRatio||1,1.5)*renderScale;canvas.width=Math.max(2,Math.round(width()*dpr));canvas.height=Math.max(2,Math.round(height()*dpr));if(active)position(active);if(reduced())snap();paint();schedule();}
  function paint(){
    if(destroyed)return;const o=clamp(opening.value,0,1),scale=.95+.05*o;
    overlay.style.width=w.value.toFixed(2)+'px';overlay.style.height=h.value.toFixed(2)+'px';overlay.style.transform=`translate3d(${x.value.toFixed(2)}px,${y.value.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;overlay.style.opacity=o.toFixed(4);
    pill.style.transform=`translate3d(0,${pillY.value.toFixed(2)}px,0)`;pill.style.opacity=(clamp(pillAlpha.value,0,1)*o).toFixed(4);
    if(gl){
      gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(uniforms.uBgTex,0);gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);gl.uniform2f(uniforms.uImgSize,image.naturalWidth||1264,image.naturalHeight||848);gl.uniform1f(uniforms.uDpr,dpr);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uScroll,scroll);
      gl.uniform4f(uniforms.uPanelRect,x.value*dpr,y.value*dpr,w.value*dpr,h.value*dpr);gl.uniform1f(uniforms.uCornerRad,(width()<=640?30:36)*dpr);gl.uniform1f(uniforms.uOpen,o);gl.uniform1f(uniforms.uRippleAge,time-rippleTime);gl.uniform2f(uniforms.uRipplePos,ripple.x,ripple.y);gl.drawArrays(gl.TRIANGLES,0,6);
    }
    root.dataset.time=time.toFixed(3);root.dataset.opening=o.toFixed(4);root.dataset.animating=String(springs.some(s=>Math.abs(s.value-s.target)>.001||Math.abs(s.vel)>.001));
    if(root.dataset.loaded==='true'||root.dataset.imageError==='true')root.dataset.ready='true';
  }
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
  function schedule(){if(!destroyed&&!suspended()&&!reduced()&&raf===null&&(gl||springs.some(s=>Math.abs(s.value-s.target)>.001||Math.abs(s.vel)>.001)))raf=requestAnimationFrame(frame);}
  function frame(now){raf=null;if(destroyed||suspended()||reduced())return;const dt=lastTime===null?0:clamp((now-lastTime)/1000,0,.05);lastTime=now;time+=dt;for(const s of springs)step(s,dt);paint();schedule();}
  function playback(){stop();cancelClose();root.dataset.paused=String(Boolean(options.paused)||document.hidden);root.dataset.reduced=String(reduced());if(reduced())snap();paint();schedule();}
  on(document,'visibilitychange',playback);on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',playback);
  on(window,'message',event=>{if(event.source!==window.parent||event.data?.type!=='leibox-render-size'||event.data?.slug!=='liquid-glass-navigation')return;const size=event.data.width;if(Number.isFinite(size)&&size>0){renderScale=Math.min(1,size/Math.max(1,window.innerWidth));resize();}});
  const resizer=new scope.ResizeObserver(resize);resizer.observe(root);
  const observer=new scope.IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);stop();if(!visible)cancelClose();schedule();});observer.observe(root);
  root.dataset.preview=String(Boolean(initial.preview));root.dataset.time='0.000';setMenu(Object.hasOwn(initial,'menu')?initial.menu:'product',false,true);snap();resize();if(image.complete)upload();playback();
  return {
    update(next={}){if(destroyed)return;options={...options,...next};if(Object.hasOwn(next,'menu'))setMenu(next.menu);playback();resize();},
    destroy(){if(destroyed)return;destroyed=true;stop();cancelClose();resizer.disconnect();observer.disconnect();root.getAnimations({subtree:true}).forEach(a=>a.cancel());dispose();canvas.width=1;canvas.height=1;root.style.removeProperty('--glass-background');},
  };
}
