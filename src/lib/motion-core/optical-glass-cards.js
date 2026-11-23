/* Supplied HTML adaptation. Design reference: @praveenisomer.
   Source license not supplied or verified; bundled fonts retain their OFL notices. */
import {fragAI,fragOptical} from './optical-glass-cards-shaders.mjs';

export function createOpticalGlassCards(scope,initial={}){
  const {document,window,on,requestAnimationFrame,cancelAnimationFrame}=scope;
  const root=document.getElementById('opticalGallery');
  const ids=['ai','optical'],cards=ids.map(id=>document.getElementById('card-'+id));
  const overlays=ids.map(id=>document.getElementById('overlay-'+id));
  const openButtons=cards.map(card=>card.querySelector('[data-open]')),closeButtons=cards.map(card=>card.querySelector('[data-close]'));
  let options={...initial},destroyed=false,raf=null,lastTime=null,renderScale=1;
  const timeValue=value=>Number.isFinite(value)?Math.max(0,value):0;
  let elapsed=timeValue(initial.time);
  const normalizeOpen=value=>new Set(Array.isArray(value)?value.filter(id=>ids.includes(id)):[]);
  let opened=normalizeOpen(initial.open);
  const reduced=()=>scope.reduced();
  const scenes=[createScene(document.getElementById('canvas-ai'),fragAI,'ai'),createScene(document.getElementById('canvas-optical'),fragOptical,'optical')];
  const running=()=>!options.paused&&!document.hidden&&!reduced()&&scenes.some(scene=>scene.gl&&scene.visible);

  function createScene(canvas,fragment,id){
    const resources=[];
    let gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:true});
    const webgl2=Boolean(gl);
    if(!gl)gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});
    const gpu=gl;
    const track=(kind,value)=>{resources.push({kind,value});return value;};
    function dispose(){
      if(!gpu)return;
      for(const {kind,value} of resources)gpu['delete'+kind[0].toUpperCase()+kind.slice(1)](value);
      resources.length=0;gpu.getExtension('WEBGL_lose_context')?.loseContext();
    }
    if(gl)try{
      const vertex=webgl2?'#version 300 es\nin vec2 a_pos; out vec2 v_uv; void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}'
        :'attribute vec2 a_pos; varying vec2 v_uv; void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}';
      const source=webgl2?'#version 300 es\nprecision highp float;\nin vec2 v_uv;\nout vec4 fragColor;\n'+fragment
        :'precision highp float;\nvarying vec2 v_uv;\n'+fragment.replaceAll('fragColor','gl_FragColor');
      const compile=(type,source)=>{
        const shader=track('shader',gl.createShader(type));gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Shader compilation failed');
        return shader;
      };
      const program=track('program',gl.createProgram());
      gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,source));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Shader link failed');
      gl.useProgram(program);const buffer=track('buffer',gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      canvas.dataset.renderer=webgl2?'webgl2':'webgl';
      return {canvas,gl,program,buffer,position,uRes:gl.getUniformLocation(program,'u_res'),uTime:gl.getUniformLocation(program,'u_time'),dispose,id,visible:true};
    }catch(error){
      root.dataset.gpuError=error.message;dispose();
      const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;gl=null;
    }
    canvas.dataset.renderer='canvas2d';
    return {canvas,gl:null,ctx:canvas.getContext('2d'),dispose:()=>{},id,visible:true};
  }
  function drawFallback(scene){
    const ctx=scene.ctx;if(!ctx)return;
    const w=scene.canvas.width,h=scene.canvas.height;
    const bg=ctx.createRadialGradient(w*.5,h*.45,0,w*.5,h*.5,w*.7);bg.addColorStop(0,'#fff1e6');bg.addColorStop(1,'#f9ddc8');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const disc=(x,y,rx,ry,rotation)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);const gradient=ctx.createLinearGradient(-rx,-ry,rx,ry);
      gradient.addColorStop(0,'#fff0df');gradient.addColorStop(.4,'#f8ab72');gradient.addColorStop(1,'#e97531');
      ctx.fillStyle=gradient;ctx.strokeStyle='#ffd8b9';ctx.lineWidth=Math.max(1,w*.006);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    };
    if(scene.id==='ai'){
      disc(w*.5,h*.5,w*.235,h*.215,-.24);
      ctx.save();ctx.translate(w*.5,h*.5);ctx.rotate(-.24);ctx.strokeStyle='#fff0df';ctx.lineWidth=w*.019;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      [[-.1,-.045],[-.05,.055],[0,-.025],[.05,.055],[.1,-.045]].forEach(([x,y],i)=>{if(i)ctx.lineTo(x*w,y*h);else ctx.moveTo(x*w,y*h);});ctx.stroke();ctx.restore();
    }else{
      const discs=Array.from({length:8},(_,i)=>({angle:i*Math.PI/4,depth:Math.cos(i*Math.PI/4)})).sort((a,b)=>a.depth-b.depth);
      for(const {angle} of discs)disc(w*(.5+Math.sin(angle)*.25),h*(.5+Math.cos(angle)*.13),w*Math.max(.018,.095*Math.abs(Math.sin(angle))),h*.16,.31);
    }
  }
  function resize(){
    if(destroyed)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.75);
    for(const scene of scenes){
      const rect=scope.rect?scope.rect(scene.canvas):scene.canvas.getBoundingClientRect();
      const w=Math.max(2,Math.round(rect.width*dpr*renderScale)),h=Math.max(2,Math.round(rect.height*dpr*renderScale));
      if(scene.canvas.width!==w||scene.canvas.height!==h){scene.canvas.width=w;scene.canvas.height=h;}
    }
  }
  function paint(){
    if(destroyed)return;
    for(const scene of scenes){
      if(scene.gl){
        const {gl,canvas}=scene;gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(scene.program);
        gl.bindBuffer(gl.ARRAY_BUFFER,scene.buffer);gl.enableVertexAttribArray(scene.position);gl.vertexAttribPointer(scene.position,2,gl.FLOAT,false,0,0);
        gl.uniform2f(scene.uRes,canvas.width,canvas.height);gl.uniform1f(scene.uTime,elapsed);gl.drawArrays(gl.TRIANGLES,0,3);
      }else drawFallback(scene);
    }
    root.dataset.time=elapsed.toFixed(3);root.dataset.ready='true';
  }
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
  function schedule(){if(!destroyed&&running()&&raf===null)raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=null;if(destroyed||!running())return;
    const delta=lastTime===null?0:Math.max(0,now-lastTime);lastTime=now;elapsed+=delta/1000;
    paint();schedule();
  }
  function playback(){
    if(destroyed)return;stop();root.dataset.paused=String(Boolean(options.paused)||document.hidden);root.dataset.reduced=String(reduced());paint();schedule();
  }
  function setOpen(next,notify=false,focusIndex=null){
    if(destroyed)return;opened=next;
    ids.forEach((id,index)=>{
      const open=opened.has(id);overlays[index].classList.toggle('is-open',open);overlays[index].inert=!open;overlays[index].setAttribute('aria-hidden',String(!open));
      openButtons[index].setAttribute('aria-expanded',String(open));
      for(const node of [cards[index].querySelector('.card__visual'),cards[index].querySelector('.card__content')]){node.inert=open;node.setAttribute('aria-hidden',String(open));}
    });
    root.dataset.open=ids.filter(id=>opened.has(id)).join(',')||'none';
    if(focusIndex!==null)(opened.has(ids[focusIndex])?closeButtons[focusIndex]:openButtons[focusIndex]).focus({preventScroll:true});
    if(notify)options.onOpenChange?.(ids.filter(id=>opened.has(id)));
  }
  ids.forEach((id,index)=>{
    on(openButtons[index],'click',event=>{const next=new Set(opened);next.add(id);setOpen(next,true,event.isTrusted?index:null);});
    on(closeButtons[index],'click',event=>{const next=new Set(opened);next.delete(id);setOpen(next,true,event.isTrusted?index:null);});
    on(overlays[index],'keydown',event=>{
      if(event.key!=='Escape'||destroyed)return;event.preventDefault();event.stopPropagation();const next=new Set(opened);next.delete(id);setOpen(next,true,event.isTrusted?index:null);
    });
  });
  on(document,'visibilitychange',playback);on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',playback);
  const resizeObserver=new scope.ResizeObserver(()=>{resize();paint();});resizeObserver.observe(root);
  const visibility=new scope.IntersectionObserver(entries=>{
    if(destroyed)return;for(const entry of entries){const scene=scenes.find(scene=>scene.canvas===entry.target);if(scene)scene.visible=entry.isIntersecting;}
    stop();schedule();
  });scenes.forEach(scene=>visibility.observe(scene.canvas));
  on(window,'message',event=>{
    if(destroyed||event.source!==window.parent||event.data?.type!=='leibox-render-size'||event.data?.slug!=='optical-glass-cards')return;
    const width=event.data.width;if(!Number.isFinite(width)||width<=0)return;
    renderScale=Math.min(1,width/Math.max(1,window.innerWidth));root.dataset.renderScale=renderScale.toFixed(3);resize();paint();
  });
  root.dataset.preview=String(Boolean(initial.preview));root.dataset.renderer=scenes.every(scene=>scene.gl)?scenes[0].canvas.dataset.renderer:'canvas2d';root.dataset.renderScale='1.000';
  setOpen(opened);resize();playback();
  return {
    update(next={}){
      if(destroyed)return;options={...options,...next};
      if(Object.hasOwn(next,'open'))setOpen(normalizeOpen(next.open));if(Object.hasOwn(next,'time'))elapsed=timeValue(next.time);
      resize();playback();
    },
    destroy(){
      if(destroyed)return;destroyed=true;stop();resizeObserver.disconnect();visibility.disconnect();root.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
      for(const scene of scenes){scene.dispose();scene.canvas.width=1;scene.canvas.height=1;}
    },
  };
}
