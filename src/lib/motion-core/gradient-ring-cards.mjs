import * as THREE from 'three';
import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';

const TAU=Math.PI*2,STEP=TAU/10;
const mod=n=>((n%5)+5)%5;
const cubic=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
function background(owner,card){
 const canvas=owner.createElement('canvas');canvas.width=512;canvas.height=640;const ctx=canvas.getContext('2d'),image=ctx.createImageData(512,640),field=card.field;
 let seed=17;
 // Bicubic interpolation is separable: reuse 13 horizontal rows instead of
 // allocating 3 arrays and sampling 48 grid cells for every output pixel.
 const horizontal=new Float64Array(field.rows*512*3);
 for(let x=0;x<512;x++){
  const gx=Math.max(0,Math.min(field.columns-1,(x/511-field.uRange[0])/(field.uRange[1]-field.uRange[0])*(field.columns-1))),ix=Math.floor(gx),t=gx-ix,cols=[ix-1,ix,ix+1,ix+2].map(v=>Math.max(0,Math.min(field.columns-1,v)));
  for(let y=0;y<field.rows;y++)for(let k=0;k<3;k++)horizontal[(y*512+x)*3+k]=cubic(...cols.map(c=>field.colors[y][c][k]),t);
 }
 for(let y=0;y<640;y++){
  const gy=Math.max(0,Math.min(field.rows-1,(y/639-field.vRange[0])/(field.vRange[1]-field.vRange[0])*(field.rows-1))),iy=Math.floor(gy),t=gy-iy,rows=[iy-1,iy,iy+1,iy+2].map(v=>Math.max(0,Math.min(field.rows-1,v))*512*3);
  for(let x=0;x<512;x++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296-.5)*1.6,index=(y*512+x)*4,p=x*3;
   for(let k=0;k<3;k++)image.data[index+k]=cubic(horizontal[rows[0]+p+k],horizontal[rows[1]+p+k],horizontal[rows[2]+p+k],horizontal[rows[3]+p+k],t)+noise;
   image.data[index+3]=255;
  }
 }ctx.putImageData(image,0,0);return canvas;
}
function artwork(owner,layers){
 if(!layers)return null;const canvas=owner.createElement('canvas');canvas.width=1024;canvas.height=1280;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';
 for(const layer of layers){ctx.globalAlpha=Math.min(.95,layer.alpha*1.25);ctx.fill(new Path2D(layer.path),'evenodd');for(const [x,y,r] of layer.dots){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}}
 return canvas;
}
function paintCard(card,ctx,bg,artImage){
 ctx.clearRect(0,0,512,640);ctx.save();ctx.beginPath();ctx.roundRect(0,0,512,640,26);ctx.clip();ctx.drawImage(bg,0,0,512,640);
 ctx.fillStyle='#fff';ctx.font='350 28px GradientRingInter,Arial,sans-serif';ctx.fillText(card.title,38,57);ctx.globalAlpha=.55;ctx.font='350 22px GradientRingInter,Arial,sans-serif';ctx.fillText(card.subtitle,38,87);ctx.globalAlpha=1;
 const point=(x,y,a=.55,r=.7)=>{ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();};
 let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const project=(x,y,z,r)=>{const ax=card.kind==='globe'?.28:.06,az=card.kind==='globe'?-.055:0,c=Math.cos(.25),s=Math.sin(.25),xx=x*c+z*s,zz=z*c-x*s,yy=y*Math.cos(ax)-zz*Math.sin(ax),depth=y*Math.sin(ax)+zz*Math.cos(ax);return [(card.kind==='globe'?254:261)+(xx*Math.cos(az)-yy*Math.sin(az))*r,(card.kind==='globe'?325:321)+(xx*Math.sin(az)+yy*Math.cos(az))*r,.10+(depth+1)*.30];};
 if(artImage){
  ctx.drawImage(artImage,0,0,512,640);
 }else if(card.kind==='globe'){
  const wire=vertices=>{ctx.strokeStyle='#fff';ctx.lineWidth=.45;ctx.globalAlpha=.2;ctx.beginPath();vertices.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();for(const q of vertices)if(random()>.38)point(q[0]+(random()-.5)*1.1,q[1]+(random()-.5)*1.1,q[2]*(.4+random()*.6),.3+random()*.25);};
  for(let lat=1;lat<9;lat++){const p=lat*Math.PI/9,vertices=[];for(let j=0;j<=128;j++){const a=j*TAU/128,r=158*(1+.004*Math.sin(a*17+lat));vertices.push(project(Math.sin(p)*Math.cos(a),Math.cos(p),Math.sin(p)*Math.sin(a),r));}wire(vertices);}
  for(let mer=0;mer<11;mer++){const vertices=[];for(let j=0;j<=128;j++){const p=j*Math.PI/128,a=mer*TAU/11+.006*Math.sin(j*.4+mer);vertices.push(project(Math.sin(p)*Math.cos(a),Math.cos(p),Math.sin(p)*Math.sin(a),158));}wire(vertices);}
  for(let j=0;j<2000;j++){const yy=1-2*random(),a=random()*TAU,r=Math.sqrt(1-yy*yy);point(...project(r*Math.cos(a),yy,r*Math.sin(a),158*(.99+random()*.025)),.35+random()*.35);}
 }else if(card.kind==='ring'){
  for(let i=0;i<56;i++)for(let j=0;j<48;j++){const t=j/47,angle=i*TAU/56,a=angle+1.7*t,r=94+65*t*t,near=.15+.55*((1+Math.cos(angle))/2)**1.5;point(256-9*t+Math.cos(a)*r,324+Math.sin(a)*r,.15+(near-.15)*(1-t)**.6,.8);}
  for(let j=0;j<58;j++)point(91+j*2.1,324,.16,.5);
 }else if(card.kind==='sphere'){
  ctx.globalAlpha=.15;ctx.strokeStyle='#fff';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(261,112);ctx.lineTo(261,568);ctx.moveTo(0,321);ctx.lineTo(512,321);ctx.stroke();
  for(let i=0;i<36;i++)for(let j=0;j<48;j++){const p=Math.PI*(j+.35*i/36)/48,y=Math.cos(p),r=Math.sin(p),a=i*TAU/36+1.5*Math.cos(p),q=project(r*Math.cos(a),y,r*Math.sin(a),130);if(q[2]>.4)point(q[0],q[1],.9,.9);}
 }else if(card.kind==='slider'){
  const letters=['00100/01010/10001/10001/11111/10001/10001','01110/10001/10000/10000/10011/10001/01110','01110/10001/10000/01110/00001/10001/01110'];ctx.fillStyle='#fff';ctx.globalAlpha=.96;
  letters.forEach((letter,k)=>letter.split('/').forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')ctx.fillRect(156+k*70.5+x*11.75-2.25,227+y*11.5-2.25,4.5,4.5);})));const line=ctx.createLinearGradient(32,0,480,0);line.addColorStop(0,'#ffffff00');line.addColorStop(.14,'#fff');line.addColorStop(.86,'#fff');line.addColorStop(1,'#ffffff00');ctx.strokeStyle=line;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(32,354);ctx.lineTo(480,354);ctx.stroke();point(338,354,1,14.5);ctx.strokeStyle='#182132';ctx.lineWidth=2;ctx.stroke();
 }else{
  const grad=ctx.createRadialGradient(256,338,0,256,338,163);grad.addColorStop(0,'#08143a');grad.addColorStop(.79,'#08143a');grad.addColorStop(.86,'#101f4a');grad.addColorStop(.98,'#0a1433');grad.addColorStop(1,'#1d3150');ctx.globalAlpha=1;ctx.fillStyle=grad;ctx.beginPath();ctx.arc(256,338,163,0,TAU);ctx.fill();
  const inner=ctx.createRadialGradient(260,340,0,256,338,142);inner.addColorStop(0,'#0d2e89');inner.addColorStop(.65,'#07173f');inner.addColorStop(.94,'#050b26');inner.addColorStop(1,'#222f4b');ctx.fillStyle=inner;ctx.beginPath();ctx.arc(256,338,142,0,TAU);ctx.fill();
  const light=ctx.createRadialGradient(256,338,0,256,338,142);light.addColorStop(0,'#dbe0eec0');light.addColorStop(1,'#8fa1c490');ctx.fillStyle=light;
  for(let j=0;j<90;j++){ctx.globalAlpha=(1-j/90)**1.3;ctx.beginPath();ctx.moveTo(256,338);ctx.arc(256,338,142,j*Math.PI/180,(j+1.1)*Math.PI/180);ctx.closePath();ctx.fill();}
  for(let i=0;i<14;i++){const a=i*TAU/14;point(256+Math.cos(a)*163,338+Math.sin(a)*163,.8,2.3);}
  ctx.globalAlpha=.8;ctx.fillStyle='#fff';ctx.font='11px monospace';ctx.textAlign='center';for(const [word,x,y] of [['DOCS',256,154],['TEAM',256,531],['DATA',65,342],['APPS',445,342]])ctx.fillText(word,x,y);ctx.textAlign='left';
 }
 ctx.globalAlpha=1;ctx.fillStyle='#ffffffdd';ctx.font='350 20px GradientRingInter,Arial,sans-serif';
 if(card.kind==='globe'){ctx.fillStyle='#ffffff26';ctx.beginPath();ctx.roundRect(36,556,228,58,29);ctx.fill();ctx.fillStyle='#fff';ctx.font='350 18px GradientRingInter,Arial,sans-serif';ctx.fillText(card.footer,58,592);ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(234,585);ctx.lineTo(250,585);ctx.moveTo(244,579);ctx.lineTo(250,585);ctx.lineTo(244,591);ctx.stroke();}
 else if(card.kind==='compass'){ctx.font='18px GradientRingInter,Arial,sans-serif';ctx.strokeStyle='#ffffffb0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(44,587,6,0,TAU);ctx.moveTo(48,592);ctx.lineTo(53,598);ctx.moveTo(201,583);ctx.lineTo(214,583);ctx.lineTo(211,579);ctx.moveTo(214,592);ctx.lineTo(201,592);ctx.lineTo(204,596);ctx.moveTo(401,582);ctx.lineTo(408,578);ctx.lineTo(415,582);ctx.lineTo(415,590);ctx.lineTo(408,594);ctx.lineTo(401,590);ctx.closePath();ctx.moveTo(401,582);ctx.lineTo(408,586);ctx.lineTo(415,582);ctx.moveTo(408,586);ctx.lineTo(408,594);ctx.stroke();ctx.fillText('Search',61,595);ctx.fillText('Retrieve',223,595);ctx.fillText('Answer',425,595);ctx.setLineDash([1,6]);ctx.beginPath();ctx.moveTo(126,588);ctx.lineTo(188,588);ctx.moveTo(313,588);ctx.lineTo(387,588);ctx.stroke();ctx.setLineDash([]);}
 else if(card.kind==='sphere'){ctx.fillText('Text Based',38,596);ctx.textAlign='right';ctx.fillText('Image Based',474,596);ctx.textAlign='left';}else ctx.fillText(card.footer,38,596);
 ctx.globalAlpha=.22;ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(.6,.6,510.8,638.8,26);ctx.stroke();ctx.restore();
}
export function createGradientRingCards(target,initial,CSS,MARKUP,CARDS){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1280,height:1024},initial),{root,on}=scope,scene=root.querySelector('.gr-scene'),canvas=root.querySelector('canvas'),status=root.querySelector('.gr-status'),pause=root.querySelector('[data-action=pause]');
 const view=target.ownerDocument.defaultView;
 let options={autoRotate:true,speed:1,distortion:1,...initial},dead=false,drag=null,tween=null,raf=0,last=0,lastPaint=0,focused=false,visible=!target.ownerDocument.hidden,inView=true,dirty=true,embedScale=1,lastActive='',lastPaused='',lastAuto=null;
 const state={phase:Math.max(0,Math.min(4,Math.round(options.active||0)))*STEP},textures=[],cards=[],backgrounds=[],artImages=[];
 for(const card of CARDS){const c=scope.document.createElement('canvas');c.width=1024;c.height=1280;c.getContext('2d').scale(2,2);const bg=background(scope.document,card),art=artwork(scope.document,card.art);backgrounds.push(bg);artImages.push(art);paintCard(card,c.getContext('2d'),bg,art);textures.push(new THREE.CanvasTexture(c));}
 const scene3=new THREE.Scene();scene3.background=new THREE.Color('#f1f2f5');const camera=new THREE.PerspectiveCamera(55,1280/1024,.1,100);camera.position.z=8.1;
 const geometry=new THREE.PlaneGeometry(2.06,2.57,48,48),position=geometry.attributes.position;
 for(let i=0;i<position.count;i++){const x=position.getX(i);position.setZ(i,-.14*x*x);position.setY(i,position.getY(i)*(1-.025*x*x));}geometry.computeVertexNormals();
 Array.from({length:10},(_,i)=>textures[i%5]).forEach((texture,i)=>{texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true,alphaTest:.05});const mesh=new THREE.Mesh(geometry,material);scene3.add(mesh);cards.push(mesh);mesh.userData.index=i;});
 let renderer=null,renderTarget=null,post=null,postGeo=null,postMaterial=null,fallback=null;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});}catch{canvas.hidden=true;fallback=scope.document.createElement('div');fallback.className='gr-fallback';scene.prepend(fallback);scene.dataset.renderer='fallback';}
 if(renderer){
  scene.dataset.renderer='webgl';renderer.setPixelRatio(1);renderer.setSize(1,1,false);renderTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,type:THREE.HalfFloatType,samples:4});
  post=new THREE.Scene();postGeo=new THREE.PlaneGeometry(2,2);postMaterial=new THREE.ShaderMaterial({uniforms:{image:{value:renderTarget.texture},distortion:{value:1}},depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D image;uniform float distortion;varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float e=smoothstep(.2,.95,abs(p.x));vec2 q=vec2(p.x*(1.-.16*e*e),p.y/(1.+0.9*e*e*e));vec2 uv=q*.5+.5;float d=(.00025+.012*e*e*e)*distortion;vec3 c=vec3(texture2D(image,uv+vec2(d,0.)).r,texture2D(image,uv).g,texture2D(image,uv-vec2(d,0.)).b);float sum=1.;if(e>0.){for(int i=1;i<17;i++){float w=.035*e*e;vec2 off=vec2(sign(p.x)*float(i)*.0032*e*e*e,0.);c+=texture2D(image,uv-off).rgb*w;sum+=w;}}gl_FragColor=vec4(c/sum,1.);#include <colorspace_fragment>}`.replace('#include','\n#include')});post.add(new THREE.Mesh(postGeo,postMaterial));
 }
 const postCamera=new THREE.Camera();
 function current(){return mod(Math.round(state.phase/STEP));}
 function render(force=false){
  if(dead)return;dirty=false;const i=current(),paused=String(!options.autoRotate||scope.reduced());
  if(lastActive!==CARDS[i].id){lastActive=CARDS[i].id;scene.dataset.active=lastActive;status.textContent=CARDS[i].title;}
  scene.dataset.phase=state.phase.toFixed(5);if(lastPaused!==paused){lastPaused=paused;scene.dataset.paused=paused;}
  if(force)textures.forEach((texture,j)=>{paintCard(CARDS[j],texture.image.getContext('2d'),backgrounds[j],artImages[j]);texture.needsUpdate=true;});
  if(renderer){cards.forEach((mesh,j)=>{const a=state.phase-j*STEP;const rear=Math.max(0,-Math.cos(a));mesh.position.set(Math.sin(a)*(4.58-.70*rear),0,Math.cos(a)*3.2);mesh.rotation.y=a+.16*Math.sin(a)*rear;mesh.scale.y=1-.17*rear;});postMaterial.uniforms.distortion.value=Math.max(0,Math.min(2,options.distortion));renderer.setRenderTarget(renderTarget);renderer.render(scene3,camera);renderer.setRenderTarget(null);renderer.render(post,postCamera);}
  else if(fallback.dataset.active!==String(i)){fallback.dataset.active=String(i);fallback.replaceChildren(...[-1,0,1].map(offset=>{const image=scope.document.createElement('img'),index=mod(i+offset);image.src=textures[index].image.toDataURL();image.alt=CARDS[index].title;image.dataset.active=String(offset===0);image.dataset.index=String(index);return image;}));}
  if(lastAuto!==options.autoRotate){lastAuto=options.autoRotate;pause.setAttribute('aria-label',options.autoRotate?'Pause rotation':'Resume rotation');pause.setAttribute('aria-pressed',String(!options.autoRotate));}
 }
 function auto(){return !scope.reduced()&&options.autoRotate&&!drag&&!tween&&!focused&&options.speed>0;}
 function tick(time){raf=0;if(dead||!visible)return;const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
  if(auto()){state.phase+=dt*TAU/34.08*Math.max(0,Math.min(3,options.speed));dirty=true;}
  // The reference is 60fps; a 165Hz screen should not run this effect 165 times.
  if(dirty&&time-lastPaint>=1000/60){render();lastPaint=time-(time-lastPaint)%(1000/60);}
  if(dirty||auto()||tween)raf=view.requestAnimationFrame(tick);
 }
 function start(){dirty=true;if(!dead&&visible&&!raf){last=0;raf=view.requestAnimationFrame(tick);}}
 function go(index,notify=true){tween?.kill();tween=null;const value=Math.round(index)*STEP;
  if(scope.reduced()||!visible){state.phase=value;start();}else tween=gsap.to(state,{phase:value,duration:.8,ease:'expo.out',onUpdate:start,onComplete:()=>{tween=null;start();}});
  if(notify)options.onSelect?.(CARDS[mod(Math.round(index))].id);start();
 }
 on(canvas,'pointerdown',e=>{if(e.button!==0)return;tween?.kill();tween=null;drag={x:e.clientX,phase:state.phase,moved:0};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});start();});
 on(canvas,'pointermove',e=>{if(!drag)return;const dx=(e.clientX-drag.x)/(scope.element.getBoundingClientRect().width/1280);drag.moved=Math.max(drag.moved,Math.abs(dx));state.phase=drag.phase+dx*.00175;start();});
 on(canvas,'pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  let index=Math.round(state.phase/STEP);
  if(moved<6&&renderer){const box=canvas.getBoundingClientRect(),ray=new THREE.Raycaster(),x=(e.clientX-box.left)/box.width*2-1,y=-((e.clientY-box.top)/box.height)*2+1,t=Math.max(0,Math.min(1,(Math.abs(x)-.2)/.75)),edge=t*t*(3-2*t);ray.setFromCamera(new THREE.Vector2(x*(1-.16*edge*edge),y/(1+0.9*edge**3)),camera);const hit=ray.intersectObjects(cards)[0];if(hit){const card=hit.object.userData.index;index=Math.round((state.phase-card*STEP)/TAU)*10+card;}}
  go(index);});
 on(canvas,'pointercancel',()=>{if(drag){drag=null;go(state.phase/STEP,false);}});
 on(scene,'keydown',e=>{if(e.target.closest('button')&&(e.key===' '||e.key==='Enter'))return;let index=Math.round(state.phase/STEP);if(e.key==='ArrowRight')index++;else if(e.key==='ArrowLeft')index--;else if(e.key==='Home')index=0;else if(e.key==='End')index=4;else if(e.key===' '){e.preventDefault();options.autoRotate=!options.autoRotate;if(options.autoRotate)focused=false;start();return;}else if(e.key==='Escape'){drag=null;go(index,false);return;}else return;e.preventDefault();go(index);});
 on(scene,'wheel',e=>{if(!e.shiftKey&&Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();go(Math.round(state.phase/STEP)+Math.sign(e.deltaX||e.deltaY));},{passive:false});
 root.querySelectorAll('.gr-controls button').forEach(button=>on(button,'click',()=>{const a=button.dataset.action;if(a==='pause'){options.autoRotate=!options.autoRotate;if(options.autoRotate)focused=false;start();}else go(Math.round(state.phase/STEP)+(a==='next'?1:-1));}));
 if(fallback)on(fallback,'click',e=>{const image=e.target.closest('img[data-index]');if(image)go(Number(image.dataset.index));});
 on(scene,'focusin',e=>{focused=e.target!==canvas||canvas.matches(':focus-visible');start();});on(scene,'focusout',()=>{focused=false;start();});
 function visibility(){visible=!target.ownerDocument.hidden&&inView;if(!visible){view.cancelAnimationFrame(raf);raf=0;last=0;tween?.pause();}else{tween?.resume();start();}}
 on(scope.document,'visibilitychange',visibility);
 const intersection=new scope.IntersectionObserver(entries=>{inView=entries[entries.length-1].isIntersecting;visibility();});intersection.observe(scope.element);scope.addCleanup(()=>intersection.disconnect());
 on(scope.matchMedia('(prefers-reduced-motion: reduce)'),'change',()=>{tween?.kill();tween=null;start();});
 function resize(){
  if(dead)return;camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix();scene3.background.set(view.getComputedStyle(scene).backgroundColor);
  if(renderer){const box=scene.getBoundingClientRect(),ratio=Math.min(view.devicePixelRatio||1,1.5),width=Math.max(1,Math.round(box.width*embedScale*ratio)),height=Math.max(1,Math.round(box.height*embedScale*ratio));if(canvas.width!==width||canvas.height!==height){renderer.setSize(width,height,false);renderTarget.setSize(width,height);}}
  render();
 }
 on(view,'message',event=>{const data=event.data;if(event.source!==view.parent||data?.type!=='leibox-render-size'||data.slug!=='gradient-ring-cards')return;if(typeof data.width!=='number'||typeof data.height!=='number'||!Number.isFinite(data.width)||!Number.isFinite(data.height)||data.width<=0||data.height<=0||data.width>16384||data.height>16384)return;embedScale=Math.min(1,data.width/view.innerWidth);resize();});
 const resizeObserver=new scope.ResizeObserver(resize);resizeObserver.observe(scene);resizeObserver.observe(scope.element);scope.addCleanup(()=>resizeObserver.disconnect());
 const styleObserver=new view.MutationObserver(resize);styleObserver.observe(scene,{attributes:true,attributeFilter:['style']});scope.addCleanup(()=>styleObserver.disconnect());
 resize();scope.ready();scope.document.fonts.ready.then(()=>{if(dead)return;render(true);scene.dataset.ready='true';scope.body.dataset.motionReady='true';if(auto())start();});
 scope.addCleanup(()=>{dead=true;view.cancelAnimationFrame(raf);tween?.kill();textures.forEach(t=>{t.dispose();t.image.width=1;t.image.height=1;});[...backgrounds,...artImages].forEach(c=>{if(c){c.width=1;c.height=1;}});cards.forEach(c=>c.material.dispose());geometry.dispose();renderTarget?.dispose();postGeo?.dispose();postMaterial?.dispose();renderer?.dispose();renderer?.forceContextLoss();});
 return {...scope.controller,update(next){if(dead)return;options={...options,...next};scope.controller.update(next);if(scope.reduced()){tween?.kill();tween=null;}if(next.active!==undefined)go(Math.max(0,Math.min(4,Math.round(next.active)))+Math.round((state.phase/STEP-Math.max(0,Math.min(4,Math.round(next.active))))/5)*5,false);if(next.height!==undefined)resize();start();}};
}
