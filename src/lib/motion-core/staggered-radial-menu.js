/* global scope */
// Independent reconstruction; the reference has outward dismissal, not a collapse into the trigger.
const demo=document.querySelector('.radial-menu-demo'),stage=demo.querySelector('.rm-stage'),menu=demo.querySelector('.rm-menu'),toggle=demo.querySelector('.rm-toggle'),plus=demo.querySelector('.rm-plus'),status=demo.querySelector('.rm-status');
const buttons=[...demo.querySelectorAll('.rm-action')],media=window.matchMedia('(prefers-reduced-motion: reduce)');
const soft=demo.dataset.variant==='soft';
const motion=soft?{from:450,openStiffness:204.0625,openDamping:15.5,closeStiffness:820,closeDamping:57,openGap:.015,closeGap:0,fadeOut:.15}:{from:451,openStiffness:250,openDamping:18,closeStiffness:300,closeDamping:30,openGap:.05,closeGap:.025,fadeOut:.1};
const states=buttons.map(()=>({position:0,velocity:0,opacity:0,blur:24,fromOpacity:0,fromBlur:24,elapsed:0,delay:0}));
const rotation={position:0,velocity:0};
let opened=false,frame=0,last=0,destroyed=false,focusIndex=-1,optionObserver,readyFrame=0;
const clamp=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
function draw(){
 states.forEach((state,i)=>{
  const angle=(-90+i*60)*Math.PI/180,radius=motion.from-(motion.from-224)*state.position,button=buttons[i];
  button.style.transform=`translate(${Math.cos(angle)*radius}px,${Math.sin(angle)*radius}px)`;
  button.style.opacity=String(state.opacity);button.style.filter=state.blur>.01?`blur(${state.blur}px)`:'none';
  button.style.visibility=state.opacity>.001?'visible':'hidden';
  button.inert=!opened||state.opacity<.95;button.style.pointerEvents=button.inert?'none':'auto';
  button.dataset.radius=radius.toFixed(3);button.dataset.reveal=state.opacity.toFixed(3);
 });
 plus.style.transform=`rotate(${rotation.position*45}deg)`;
 if(soft)plus.style.opacity=String(1-.4*clamp(rotation.position));
 demo.dataset.open=String(opened);demo.dataset.progress=clamp(rotation.position).toFixed(4);
 if(focusIndex>=0&&!buttons[focusIndex].inert){const index=focusIndex;focusIndex=-1;focusAction(index);}
}
function spring(state,target,dt,stiffness,damping){
 state.velocity+=((target-state.position)*stiffness-state.velocity*damping)*dt;state.position+=state.velocity*dt;
 if(Math.abs(state.position-target)<.0001&&Math.abs(state.velocity)<.002){state.position=target;state.velocity=0;}
 return state.position!==target||state.velocity!==0;
}
function settle(){
 cancelAnimationFrame(frame);frame=0;last=0;
 states.forEach(state=>{state.position=Number(opened);state.velocity=0;state.opacity=Number(opened);state.blur=opened?0:24;state.delay=0;state.elapsed=1;});
 rotation.position=Number(opened);rotation.velocity=0;draw();demo.dataset.moving='false';
}
function tick(time){
 frame=0;if(destroyed)return;if(media.matches){settle();return;}
 const dt=Math.min(.032,(time-(last||time-16))/1000);last=time;let moving=false;
 states.forEach(state=>{
  state.elapsed+=dt;
  const elapsed=state.elapsed-state.delay;
  if(elapsed<0){moving=true;return;}
  const activeDt=Math.min(dt,elapsed);
  for(let i=0;i<3;i++)moving=spring(state,Number(opened),activeDt/3,opened?motion.openStiffness:motion.closeStiffness,opened?motion.openDamping:motion.closeDamping)||moving;
  state.opacity=state.fromOpacity+(Number(opened)-state.fromOpacity)*smooth(elapsed/(opened?.1:motion.fadeOut));
  state.blur=state.fromBlur+((opened?0:24)-state.fromBlur)*smooth(elapsed/(opened?.15:.13));
  if(elapsed<Math.max(opened?.1:motion.fadeOut,opened?.15:.13))moving=true;
 });
 for(let i=0;i<3;i++)moving=spring(rotation,Number(opened),dt/3,opened?motion.openStiffness:motion.closeStiffness,opened?motion.openDamping:motion.closeDamping)||moving;
 draw();demo.dataset.moving=String(moving);
 if(moving)frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(destroyed)return;if(media.matches){settle();return;}demo.dataset.moving='true';if(!frame)frame=requestAnimationFrame(tick);}
function setOpen(value,focus=-1){
 if(destroyed)return;
 if(value!==opened){
  const interrupted=demo.dataset.moving==='true';opened=value;
  states.forEach((state,i)=>{state.delay=interrupted?0:(opened?i*motion.openGap:(5-i)*motion.closeGap);state.elapsed=0;state.fromOpacity=state.opacity;state.fromBlur=state.blur;});
 }
 focusIndex=value?focus:-1;
 if(!value&&buttons.includes(document.activeElement))toggle.focus();
 toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?'Close actions':'Open actions');menu.inert=!value;
 buttons.forEach((button,i)=>button.tabIndex=value&&i===0?0:-1);
 draw();wake();
}
function focusAction(index){buttons.forEach((button,i)=>button.tabIndex=i===index?0:-1);buttons[index].focus();}
function close(){setOpen(false);toggle.focus();}
toggle.addEventListener('click',event=>setOpen(!opened,event.detail===0&&!opened?0:-1));
toggle.addEventListener('keydown',event=>{
 if(event.key==='ArrowDown'||event.key==='ArrowRight'||event.key==='ArrowUp'||event.key==='ArrowLeft'){event.preventDefault();setOpen(true,event.key==='ArrowUp'||event.key==='ArrowLeft'?5:0);}
 else if(event.key==='Escape'&&opened){event.preventDefault();close();}
});
buttons.forEach((button,i)=>{
 button.addEventListener('click',()=>{
  demo.dataset.action=button.dataset.action;status.textContent=button.getAttribute('aria-label')+' selected. Local demonstration.';
  demo.dispatchEvent(new CustomEvent('radial-menu-action',{bubbles:true,composed:true,detail:{action:button.dataset.action}}));close();
 });
 button.addEventListener('keydown',event=>{
  let next=i;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(i+1)%6;
  else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i+5)%6;
  else if(event.key==='Home')next=0;else if(event.key==='End')next=5;
  else if(event.key==='Escape'){event.preventDefault();close();return;}else return;
  event.preventDefault();focusIndex=next;draw();
 });
});
document.addEventListener('pointerdown',event=>{const path=event.composedPath();if(opened&&!path.includes(toggle)&&!buttons.some(button=>path.includes(button)))setOpen(false);});
stage.addEventListener('focusout',event=>{if(opened&&!stage.contains(event.relatedTarget))setOpen(false);});
function syncMotion(){if(media.matches)settle();else wake();}
media.addEventListener('change',syncMotion);
function resize(){const rect=demo.getBoundingClientRect();stage.style.setProperty('--rm-scale',String(Math.min(rect.width/960,rect.height/960)));draw();}
const observer=new ResizeObserver(resize);observer.observe(demo);
function dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);cancelAnimationFrame(readyFrame);observer.disconnect();optionObserver?.disconnect();media.removeEventListener('change',syncMotion);}
if(typeof scope!=='undefined'){scope.addCleanup(dispose);optionObserver=new MutationObserver(syncMotion);optionObserver.observe(scope.element,{attributes:true,attributeFilter:['data-reduced-motion']});}
window.addEventListener('pagehide',dispose,{once:true});
resize();draw();demo.dataset.moving='false';
readyFrame=requestAnimationFrame(()=>{if(destroyed)return;demo.dataset.motionReady='true';document.body.dataset.motionReady='true';});
