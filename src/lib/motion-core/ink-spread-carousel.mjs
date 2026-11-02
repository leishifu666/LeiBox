import {createSurface} from './motion-runtime';
import {INK_VERTEX,INK_FRAGMENT} from './ink-spread-shaders.mjs';

export function createInkSpreadCarousel(target,initial,CSS,MARKUP,ATLAS,SLIDES){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:940,height:876},initial);
 const {root,on}=scope,scene=root.querySelector('.ib-scene'),card=root.querySelector('.ib-card');
 const canvas=root.querySelector('.ib-canvas'),photo=root.querySelector('.ib-photo'),fallback=root.querySelector('.ib-fallback');
 const previous=root.querySelector('.ib-nav--prev'),next=root.querySelector('.ib-nav--next');
 const halos=[...root.querySelectorAll('.ib-halo')],status=root.querySelector('.ib-status'),error=root.querySelector('.ib-error');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const defaults=SLIDES.map(slide=>({...slide,src:ATLAS}));
 let options={...initial},slides=[],index=0,destination=0,from=null,to=null,origin=[.5,.5];
 let progress=1,elapsed=0,last=0,frame=0,seed=1,notify=false,dead=false,visible=true,loadVersion=0;
 let gl=null,context=null,program=null,buffer=null,snapshotTexture=null,snapshotCanvas=null,uniforms={};
 const textures=new Map(),shaders=[],images=new Map();
 let mode='image',lost=false,ready=false;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});}catch{}
 if(!gl)context=canvas.getContext('2d',{alpha:false});
 function compile(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Ink spread shader compilation failed');}
  shaders.push(shader);return shader;
 }
 function setupGL(){
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,INK_VERTEX));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,INK_FRAGMENT));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Ink spread program linking failed');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  uniforms=Object.fromEntries(['from','to','fromRect','toRect','origin','progress','aspect','roughness','seed'].map(name=>[name,gl.getUniformLocation(program,'u_'+name)]));
  gl.uniform1i(uniforms.from,0);gl.uniform1i(uniforms.to,1);mode='webgl';
 }
 function releaseGL(){
  if(!gl)return;
  textures.forEach(texture=>gl.deleteTexture(texture));textures.clear();
  if(snapshotTexture)gl.deleteTexture(snapshotTexture);snapshotTexture=null;
  if(buffer)gl.deleteBuffer(buffer);buffer=null;
  if(program)gl.deleteProgram(program);program=null;
  shaders.splice(0).forEach(shader=>gl.deleteShader(shader));
 }
 if(gl){try{setupGL();}catch{releaseGL();mode='image';}}
 else if(context)mode='canvas2d';
 function texture(slide){
  if(slide.snapshot)return snapshotTexture;
  let tex=textures.get(slide.src);if(tex)return tex;
  tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,images.get(slide.src));
  textures.set(slide.src,tex);return tex;
 }
 function background(node,slide){
  node.style.backgroundImage=`url("${slide.src}")`;
  node.style.backgroundSize=slide.rect[2]===1?'100% 100%':'200% 200%';
  node.style.backgroundPosition=`${slide.rect[0]*200}% ${slide.rect[1]*200}%`;
 }
 function copyImage(ctx,slide){
  if(slide.snapshot){ctx.drawImage(snapshotCanvas,0,0,canvas.width,canvas.height);return;}
  const image=images.get(slide.src),[x,y,w,h]=slide.rect;
  ctx.drawImage(image,x*image.width,y*image.height,w*image.width,h*image.height,0,0,canvas.width,canvas.height);
 }
 function paint(){
  if(dead||!ready)return;
  scene.dataset.progress=progress.toFixed(4);scene.dataset.renderer=mode;
  if(mode==='webgl'&&!lost){
   gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture(from));
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture(to));
   gl.uniform4fv(uniforms.fromRect,from.rect);gl.uniform4fv(uniforms.toRect,to.rect);
   gl.uniform2fv(uniforms.origin,origin);gl.uniform1f(uniforms.progress,progress);
   gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);gl.uniform1f(uniforms.roughness,clamp(options.roughness??.6,0,1));gl.uniform1f(uniforms.seed,seed);
   gl.drawArrays(gl.TRIANGLES,0,6);
  }else if(mode==='canvas2d'){
   copyImage(context,from);
   if(progress>0){
    context.save();
    if(progress<1){
     const aspect=canvas.width/canvas.height,cx=origin[0]*aspect,cy=origin[1];
     const reach=Math.hypot(Math.max(cx,aspect-cx),Math.max(cy,1-cy)),r=-.12+(reach+.34)*progress;
     const strength=clamp(options.roughness??.6,0,1)*Math.sin(progress*Math.PI);
     context.beginPath();
     for(let i=0;i<=128;i++){
      const angle=i/128*Math.PI*2,wobble=(Math.sin(angle*4+seed)*.04+Math.cos(angle*7+seed*.71)*.035+Math.sin(angle*13+progress*5)*.015)*strength;
      const radius=Math.max(0,r+wobble),x=(cx+Math.cos(angle)*radius)/aspect*canvas.width,y=(cy+Math.sin(angle)*radius)*canvas.height;
      if(!i)context.moveTo(x,y);else context.lineTo(x,y);
     }
     context.closePath();context.clip();
    }
    copyImage(context,to);context.restore();
   }
  }
  halos[0].style.opacity=String(.18*(1-progress));halos[1].style.opacity=String(.18*progress);
  scene.dataset.draws=String(Number(scene.dataset.draws||0)+1);
 }
 function stop(){if(frame)scope.cancelAnimationFrame(frame);frame=0;last=0;}
 function announce(){
  photo.setAttribute('aria-label',`Next image. ${slides[index].alt}`);
  status.textContent=`${index+1} of ${slides.length}. ${slides[index].alt}`;
 }
 function finish(){
  stop();progress=1;index=destination;from=to=slides[index];
  background(fallback,to);background(halos[0],to);background(halos[1],to);
  scene.dataset.index=String(index);scene.dataset.animating='false';photo.setAttribute('aria-busy','false');paint();announce();
  const emit=notify;notify=false;if(emit)options.onIndexChange?.(index);
 }
 function tick(now){
  frame=0;if(dead||!visible||scope.document.hidden||progress>=1)return;
  elapsed+=last?Math.min(50,now-last):0;last=now;
  const t=clamp(elapsed/clamp(options.duration??900,250,2400),0,1);
  progress=1-Math.pow(1-t,1.7);paint();
  if(t>=1)finish();else frame=scope.requestAnimationFrame(tick);
 }
 function resume(){
  if(!dead&&ready&&visible&&!scope.document.hidden&&progress<1&&!frame){
   if(scope.reduced()||mode==='image')finish();else{last=0;frame=scope.requestAnimationFrame(tick);}
  }
 }
 function snapshot(){
  paint();
  if(mode==='webgl'){
   if(!snapshotTexture){snapshotTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,snapshotTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
   gl.bindTexture(gl.TEXTURE_2D,snapshotTexture);gl.copyTexImage2D(gl.TEXTURE_2D,0,gl.RGBA,0,0,canvas.width,canvas.height,0);
   return {snapshot:true,rect:[0,1,1,-1]};
  }
  if(!snapshotCanvas)snapshotCanvas=scope.document.createElement('canvas');
  snapshotCanvas.width=canvas.width;snapshotCanvas.height=canvas.height;snapshotCanvas.getContext('2d').drawImage(canvas,0,0);
  return {snapshot:true,rect:[0,0,1,1]};
 }
 function choose(value,point,user=false){
  if(!ready||dead)return;
  const nextIndex=((Math.round(value)%slides.length)+slides.length)%slides.length;
  if(nextIndex===destination)return;
  stop();from=progress<1&&mode!=='image'?snapshot():slides[index];
  destination=nextIndex;to=slides[destination];origin=point;seed+=2.173;progress=0;elapsed=0;notify=user;
  scene.dataset.target=String(destination);scene.dataset.origin=origin.map(n=>n.toFixed(4)).join(',');scene.dataset.animating='true';
  photo.setAttribute('aria-busy','true');background(halos[0],slides[index]);background(halos[1],to);
  if(scope.reduced()||mode==='image'){finish();return;}
  paint();resume();
 }
 function point(event,side){
  if(!event.detail)return [side==='previous'?.12:side==='next'?.88:.5,.5];
  const box=card.getBoundingClientRect(),border=card.clientLeft*(box.width/card.offsetWidth),w=box.width-border*2,h=box.height-border*2;
  return [clamp((event.clientX-box.left-border)/w,0,1),clamp((event.clientY-box.top-border)/h,0,1)];
 }
 on(previous,'click',event=>choose(destination-1,point(event,'previous'),true));
 on(next,'click',event=>choose(destination+1,point(event,'next'),true));
 on(photo,'click',event=>choose(destination+1,point(event,'photo'),true));
 on(card,'keydown',event=>{
  const values={ArrowLeft:destination-1,ArrowRight:destination+1,Home:0,End:slides.length-1};
  if(!(event.key in values))return;event.preventDefault();
  choose(values[event.key],[event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?.88:.5,.5],true);
 });
 function resize(){
  if(dead)return;
  const box=card.getBoundingClientRect(),scale=box.width/card.offsetWidth,dpr=Math.min(scope.window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(card.clientWidth*scale*dpr)),h=Math.max(1,Math.round(card.clientHeight*scale*dpr));
  if(w===canvas.width&&h===canvas.height)return;
  // A framebuffer snapshot belongs to its previous size; finish before reallocating.
  if(ready&&progress<1)finish();
  canvas.width=w;canvas.height=h;paint();
 }
 const resizeObserver=new scope.ResizeObserver(resize);resizeObserver.observe(scope.element);resizeObserver.observe(card);
 const intersection=new scope.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;scene.dataset.visible=String(visible);if(visible)resume();else stop();});intersection.observe(scope.element);
 on(scope.document,'visibilitychange',()=>{if(scope.document.hidden)stop();else resume();});
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',()=>{scope.controller.update({});if(scope.reduced()&&ready)finish();});
 on(canvas,'webglcontextlost',event=>{
  event.preventDefault();if(dead)return;lost=true;mode='image';scene.dataset.renderer=mode;canvas.hidden=true;if(ready)finish();
 });
 on(canvas,'webglcontextrestored',()=>{
  if(dead)return;lost=false;textures.clear();shaders.length=0;snapshotTexture=null;
  try{setupGL();canvas.hidden=false;paint();}catch{mode='image';canvas.hidden=true;}
 });
 function loadImage(src){
  if(images.has(src))return Promise.resolve(images.get(src));
  return new Promise((resolve,reject)=>{
   const image=new scope.window.Image();image.crossOrigin='anonymous';
   image.onload=()=>{image.onload=image.onerror=null;if(dead){reject(new Error('Unmounted'));return;}images.set(src,image);resolve(image);};
   image.onerror=()=>{image.onload=image.onerror=null;reject(new Error('Image unavailable'));};image.src=src;
  });
 }
 async function loadSources(sources){
  const version=++loadVersion;
  let incoming=defaults;
  if(sources!==undefined){
   if(!Array.isArray(sources)||sources.length<2||sources.length>12||sources.some(item=>!(typeof item==='string'?item: item?.src))){error.hidden=false;error.textContent='Choose between 2 and 12 images.';return;}
   incoming=sources.map((item,i)=>({src:typeof item==='string'?item:item.src,alt:typeof item==='string'?`Photo ${i+1}`:item.alt||`Photo ${i+1}`,rect:[0,0,1,1]}));
  }
  scene.dataset.loading='true';
  try{
   await Promise.all([...new Set(incoming.map(slide=>slide.src))].map(loadImage));
   if(dead||version!==loadVersion)return;
   stop();slides=incoming;destination=((Math.round(options.index??0)%slides.length)+slides.length)%slides.length;to=from=slides[destination];
   notify=false;ready=true;error.hidden=true;scene.dataset.loading='false';scene.dataset.target=String(destination);
   if(gl&&!lost&&mode==='webgl'){textures.forEach(tex=>gl.deleteTexture(tex));textures.clear();}
   resize();finish();canvas.hidden=mode==='image';photo.disabled=previous.disabled=next.disabled=false;
   scene.dataset.ready='true';scope.body.dataset.motionReady='true';
  }catch{
   if(dead||version!==loadVersion)return;
   scene.dataset.loading='false';error.hidden=false;error.textContent='Could not load these images. The previous photos are still available.';
   status.textContent=error.textContent;
  }
 }
 scene.dataset.index='0';scene.dataset.target='0';scene.dataset.animating='false';scene.dataset.renderer=mode;
 photo.disabled=previous.disabled=next.disabled=true;resize();scope.ready();
 const boot=loadSources();
 if(initial?.images!==undefined)boot.then(()=>{if(!dead)loadSources(options.images);});
 scope.addCleanup(()=>{
  dead=true;loadVersion++;stop();resizeObserver.disconnect();intersection.disconnect();releaseGL();
  if(gl&&!gl.isContextLost())gl.getExtension('WEBGL_lose_context')?.loseContext();
  images.clear();if(snapshotCanvas){snapshotCanvas.width=0;snapshotCanvas.height=0;snapshotCanvas=null;}canvas.width=0;canvas.height=0;
 });
 return {...scope.controller,update(nextOptions){
  if(dead)return;const oldImages=options.images;options={...options,...nextOptions};scope.controller.update(nextOptions);
  if(nextOptions.images!==undefined&&nextOptions.images!==oldImages){boot.then(()=>{if(!dead)loadSources(options.images);});return;}
  if(ready&&Number.isFinite(nextOptions.index))choose(nextOptions.index,[.5,.5]);
  if(ready&&scope.reduced()&&progress<1)finish();else paint();
 }};
}
