import {createSurface} from './motion-runtime';
import {drawParticleTextures} from './particle-texture-renderer.mjs';

export function createParticleTextureTrio(target,initial,css,markup){
 const surface=createSurface(target,{css,markup,width:960,height:540},initial);
 const {root,element,on}=surface,scene=root.querySelector('.pt-scene'),stage=root.querySelector('.pt-stage'),canvas=root.querySelector('canvas');
 const ctx=canvas.getContext('2d',{alpha:false}),buttons=[...root.querySelectorAll('.pt-target')],status=root.querySelector('.pt-status');
 const owner=target.ownerDocument,browser=owner.defaultView,media=browser.matchMedia('(prefers-reduced-motion: reduce)');
 let options={...initial},time=0,last=0,frame=0,visible=true,destroyed=false,density=0,frameInterval=1000/60,embeddedWidth=Infinity;
 let paused=Boolean(initial.paused);
 const reduced=()=>options.reducedMotion??media.matches;
 function draw(){
  const width=Math.min(canvas.getBoundingClientRect().width,embeddedWidth);
  const dpr=Math.max(.35,Math.min(2,width/960*(browser.devicePixelRatio||1)));
  frameInterval=width<500?1000/30:1000/60;
  if(Math.abs(dpr-density)>.01){density=dpr;canvas.width=Math.round(960*dpr);canvas.height=Math.round(540*dpr);}
  ctx.setTransform(density,0,0,density,0,0);
  drawParticleTextures(ctx,time,{background:options.background??'#000'});
  scene.dataset.time=time.toFixed(4);scene.dataset.paused=String(paused);scene.dataset.motion=reduced()?'reduced':'full';scene.dataset.ready='true';
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(paused)));
 }
 function stop(){if(frame)browser.cancelAnimationFrame(frame);frame=0;last=0;}
 function tick(now){
  frame=0;if(destroyed||paused||reduced()||!visible||owner.hidden||options.speed===0)return;
  if(!last)last=now;
  if(now-last>=frameInterval-.5){time+=Math.min((now-last)/1000,.1)*options.speed;last=now;draw();}
  frame=browser.requestAnimationFrame(tick);
 }
 function wake(){if(!frame&&!destroyed&&!paused&&!reduced()&&visible&&!owner.hidden&&options.speed>0)frame=browser.requestAnimationFrame(tick);}
 function sync(){stop();draw();wake();}
 function reset(){time=0;paused=false;status.textContent='Animation restarted';sync();}
 buttons.forEach(button=>{
  on(button,'click',()=>{paused=!paused;status.textContent=paused?'Animation paused':'Animation playing';sync();});
  on(button,'keydown',event=>{
   if(event.key==='Home'||event.key==='Escape'){event.preventDefault();reset();}
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();paused=true;time=Math.max(0,time+(event.key==='ArrowRight'?1:-1)/30);status.textContent='Animation stepped one frame';sync();}
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(buttons.indexOf(button)+(event.key==='ArrowDown'?1:2))%3].focus();}
  });
 });
 on(media,'change',sync);on(owner,'visibilitychange',()=>owner.hidden?stop():wake());
 on(browser,'message',event=>{
  const data=event.data;
  if(event.source!==browser.parent||data?.type!=='leibox-render-size'||data.slug!=='particle-texture-trio')return;
  if(typeof data.width!=='number'||!Number.isFinite(data.width)||data.width<=0||data.width>16384)return;
  embeddedWidth=data.width;draw();
 });
 const observer=new browser.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();});observer.observe(element);
 const resize=new browser.ResizeObserver(()=>{
  stage.style.setProperty('--pt-scale',String(Math.min(scene.clientWidth/960,scene.clientHeight/540)));draw();
 });resize.observe(scene);
 function normalize(next){
  options={...options,...next};options.speed=Number.isFinite(options.speed)?Math.max(0,Math.min(3,options.speed)):1;
  if(next.paused!==undefined)paused=Boolean(next.paused);
 }
 normalize(initial);draw();wake();
 return {element,root,
  update(next={}){if(destroyed)return;normalize(next);surface.controller.update(next);sync();},
  destroy(){if(destroyed)return;destroyed=true;stop();observer.disconnect();resize.disconnect();surface.controller.destroy();canvas.width=0;canvas.height=0;}
 };
}
