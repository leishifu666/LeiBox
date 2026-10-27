/* global scope */
// Measured visual reconstruction. Values only change this local control.
const demo=document.querySelector('.galaxy-effort-demo'),stage=demo.querySelector('.ge-stage'),card=demo.querySelector('.ge-card');
const control=demo.querySelector('.ge-control'),track=demo.querySelector('.ge-track'),fill=demo.querySelector('.ge-fill'),thumb=demo.querySelector('.ge-thumb'),brain=demo.querySelector('.ge-brain'),label=demo.querySelector('.ge-level');
const pixels=demo.querySelector('.ge-pixels'),particles=demo.querySelector('.ge-particles'),help=demo.querySelector('.ge-help'),tooltip=demo.querySelector('.ge-tooltip');
const foldLayers=[...brain.querySelectorAll('.ge-fold-layer')];
const levels=['Low','Medium','High','Extra','Max','Galaxy'],media=window.matchMedia('(prefers-reduced-motion: reduce)');
const dots=pixels.getContext('2d'),sparks=particles.getContext('2d');
const travel=358,origin=16,trackWidth=392,trackHeight=40;
const state={position:0,velocity:0,target:0,galaxy:0,galaxyVelocity:0};
let level=0,frame=0,last=0,clock=0,entered=-100,dragging=false,pointerId=null,startValue=0,visible=true,destroyed=false,optionObserver;
let labelAnimations=[];
const clamp=(value,min=0,max=5)=>Math.max(min,Math.min(max,value));
const hash=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
const colors=['#80d5d8','#dc8cd5','#b3a3e8','#7061b5','#f4c1eb','#6656a0'];
// Visible track colours sampled from Medium, High, Extra and Max; not source CSS values.
const fillStops=[0,30,60,90,100];
const fillPalettes=[
 [[49,42,45],[86,57,76],[125,73,112],[161,89,146],[175,94,157]],
 [[49,42,45],[81,55,76],[112,69,107],[143,83,139],[153,87,150]],
 [[49,42,45],[78,56,74],[108,69,110],[129,84,149],[136,90,163]],
 [[49,42,45],[77,56,74],[102,67,111],[118,84,153],[124,90,167]],
];
function showLabel(index){
 if(index===level&&label.textContent===levels[index])return;
 level=index;labelAnimations.forEach(animation=>animation.cancel());labelAnimations=[];
 label.replaceChildren(...[...levels[index]].map((letter,i)=>{
  const span=document.createElement('span');span.className='ge-letter';span.textContent=letter;
  if(!media.matches)labelAnimations.push(span.animate([{opacity:0,filter:'blur(4px)',transform:'translateY(5px)'},{opacity:1,filter:'blur(0px)',transform:'translateY(0)'}],{duration:220,delay:i*15,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  return span;
 }));
 card.dataset.level=levels[index];
 control.setAttribute('aria-valuenow',String(index));control.setAttribute('aria-valuetext',levels[index]);
}
function drawPixels(time,strength){
 dots.clearRect(0,0,trackWidth,trackHeight);
 if(strength<=0)return;
 for(let row=0;row<5;row++)for(let col=0;col<49;col++){
  const n=row*49+col,seed=hash(n+7),wave=.5+.5*Math.sin(time*(2+seed*3)+n*1.618);
  const density=.14+.78*Math.pow(col/48,1.6);
  if(seed>density+.16*Math.sin(time*1.8+col*.2))continue;
  dots.globalAlpha=strength*(.18+.72*wave)*(.22+.78*col/48);dots.fillStyle=colors[Math.floor(hash(n+211)*colors.length)];
  const size=seed>.74?5.7:5.1,x=col*8+1,y=row*8+.5;
  dots.beginPath();dots.roundRect(x,y,size,size,1.3);dots.fill();
 }
 dots.globalAlpha=1;
}
function drawSparks(time,strength){
 sparks.clearRect(0,0,640,390);
 if(strength<=0)return;
 const age=Math.max(0,time-entered),burst=Math.exp(-age*5),cx=100+22+origin+state.position/5*travel,cy=60+141+28;
 for(let ray=0;ray<26;ray++){
  const angle=ray*2.399963,seed=hash(ray+94),speed=15+seed*24;
  for(let dot=0;dot<7;dot++){
   const radius=27+((dot*13+time*speed+seed*40)%87)+burst*dot*3;
   const fade=Math.pow(1-clamp((radius-27)/110,0,1),1.6),pulse=.45+.55*Math.sin(time*4+ray+dot)**2;
   sparks.globalAlpha=strength*fade*pulse*(.4+burst*.35);sparks.fillStyle=colors[(ray+dot)%colors.length];
   const size=seed>.65?3:2;sparks.fillRect(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,size,size);
  }
 }
 sparks.globalAlpha=1;
}
function draw(){
 const p=clamp(state.position),g=clamp(state.galaxy,0,1),age=Math.max(0,clock-entered),burst=Math.exp(-age*6)*g;
 foldLayers.forEach(layer=>{
  const amount=clamp((p-Number(layer.dataset.tier)+.85)/.7,0,1),reveal=amount*amount*(3-2*amount);
  layer.style.opacity=String(reveal);layer.style.setProperty('--ge-fold-hidden',String(1-reveal));layer.dataset.reveal=reveal.toFixed(4);
 });
 thumb.style.left=`${origin+p/5*travel}px`;thumb.style.transform=`scale(${1+g*.25+burst*.2})`;
 brain.style.setProperty('--ge-brain-fill',g>.01?`rgb(${255-85*g},${146+4*g},${206+39*g})`:'#ff92ce');
 brain.style.setProperty('--ge-brain-edge',g>.01?`rgb(${101-45*g},${14+2*g},${60+77*g})`:'#650e3c');
 thumb.style.filter=g>.01?`drop-shadow(0 0 ${4+burst*10}px #8351ff) drop-shadow(0 0 ${9+burst*15}px #7543fc70)`:'none';
 fill.style.width=`${origin+p/5*travel}px`;fill.style.opacity=String(1-g);pixels.style.opacity=String(g);
 const tint=clamp(p-1,0,3),palette=Math.min(2,Math.floor(tint)),blend=tint-palette;
 fill.style.backgroundImage=`linear-gradient(90deg, ${fillPalettes[palette].map((rgb,i)=>`rgb(${rgb.map((channel,c)=>Math.round(channel+(fillPalettes[palette+1][i][c]-channel)*blend)).join(',')}) ${fillStops[i]}%`).join(', ')})`;
 const shake=media.matches?0:g*(.28+Math.exp(-age*7)*2.1);
 card.style.transform=shake?`translate(${Math.sin(clock*93)*shake}px,${Math.cos(clock*117)*shake*.65}px)`:'none';
 drawPixels(clock,g);drawSparks(clock,media.matches?0:g);
 demo.dataset.position=p.toFixed(4);demo.dataset.galaxy=g.toFixed(4);demo.dataset.dragging=String(dragging);
}
function spring(key,velocityKey,target,dt,k,damping){
 state[velocityKey]+=((target-state[key])*k-state[velocityKey]*damping)*dt;state[key]+=state[velocityKey]*dt;
 if(Math.abs(state[key]-target)<.0002&&Math.abs(state[velocityKey])<.002){state[key]=target;state[velocityKey]=0;}
 return state[key]!==target||state[velocityKey]!==0;
}
function settle(){
 cancelAnimationFrame(frame);frame=0;last=0;state.position=state.target;state.velocity=0;state.galaxy=level===5?1:0;state.galaxyVelocity=0;
 labelAnimations.forEach(animation=>animation.cancel());labelAnimations=[];draw();demo.dataset.moving='false';
}
function tick(time){
 frame=0;if(destroyed||!visible||document.hidden)return;if(media.matches){settle();return;}
 const dt=Math.min(.032,(time-(last||time-16))/1000);last=time;clock+=dt;let moving=false;
 for(let step=0;step<3;step++){
  moving=spring('position','velocity',state.target,dt/3,420,32)||moving;
  moving=spring('galaxy','galaxyVelocity',level===5?1:0,dt/3,190,25)||moving;
 }
 draw();demo.dataset.moving=String(moving);
 if(moving||level===5)frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(destroyed)return;if(media.matches){settle();return;}if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
function select(value,commit=false){
 const next=clamp(value),index=Math.round(next),wasGalaxy=level===5;
 state.target=next;showLabel(index);if(index===5&&!wasGalaxy)entered=clock;
 demo.dataset.value=String(index);draw();wake();
 if(commit)demo.dispatchEvent(new CustomEvent('effort-change',{bubbles:true,composed:true,detail:{value:index,level:levels[index]}}));
}
function pointerValue(event){const bounds=track.getBoundingClientRect();return clamp((event.clientX-bounds.left-origin)/travel*5);}
control.addEventListener('pointerdown',event=>{
 if(event.button!==0||pointerId!==null)return;event.preventDefault();control.focus();pointerId=event.pointerId;startValue=Math.round(state.target);dragging=true;control.dataset.dragging='true';
 control.setPointerCapture(event.pointerId);select(pointerValue(event));
});
control.addEventListener('pointermove',event=>{if(event.pointerId===pointerId)select(pointerValue(event));});
function release(event,cancelled=false){
 if(event.pointerId!==pointerId)return;pointerId=null;dragging=false;control.dataset.dragging='false';
 select(cancelled?startValue:Math.round(state.target),!cancelled);
 if(control.hasPointerCapture(event.pointerId))control.releasePointerCapture(event.pointerId);
}
control.addEventListener('pointerup',event=>release(event));control.addEventListener('pointercancel',event=>release(event,true));
control.addEventListener('lostpointercapture',event=>{if(pointerId!==null)release(event,true);});
control.addEventListener('keydown',event=>{
 let next=Math.round(state.target);
 if(event.key==='ArrowRight'||event.key==='ArrowUp')next++;else if(event.key==='ArrowLeft'||event.key==='ArrowDown')next--;
 else if(event.key==='Home'||event.key==='Escape')next=0;else if(event.key==='End')next=5;else if(event.key==='PageUp')next+=2;else if(event.key==='PageDown')next-=2;else return;
 event.preventDefault();if(pointerId!==null){const id=pointerId;pointerId=null;dragging=false;control.dataset.dragging='false';if(control.hasPointerCapture(id))control.releasePointerCapture(id);}select(next,true);
});
const hideHelp=()=>{tooltip.hidden=true;help.setAttribute('aria-expanded','false');};
const showHelp=()=>{tooltip.hidden=false;help.setAttribute('aria-expanded','true');};
help.addEventListener('pointerenter',showHelp);help.addEventListener('pointerleave',hideHelp);help.addEventListener('focus',showHelp);help.addEventListener('blur',hideHelp);
help.addEventListener('click',()=>tooltip.hidden?showHelp():hideHelp());
help.addEventListener('keydown',event=>{if(event.key==='Escape'){hideHelp();help.blur();}});
function syncMotion(){if(media.matches)settle();else wake();}
media.addEventListener('change',syncMotion);
function pause(){cancelAnimationFrame(frame);frame=0;last=0;}
document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());
const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else pause();});intersection.observe(demo);
function resize(){const bounds=demo.getBoundingClientRect();stage.style.setProperty('--ge-scale',String(Math.min(bounds.width/945,bounds.height/516)));}
const observer=new ResizeObserver(resize);observer.observe(demo);
function dispose(){if(destroyed)return;destroyed=true;pause();observer.disconnect();intersection.disconnect();optionObserver?.disconnect();media.removeEventListener('change',syncMotion);labelAnimations.forEach(animation=>animation.cancel());}
if(typeof scope!=='undefined'){scope.addCleanup(dispose);optionObserver=new MutationObserver(syncMotion);optionObserver.observe(scope.element,{attributes:true,attributeFilter:['data-reduced-motion']});}
window.addEventListener('pagehide',dispose,{once:true});
pixels.width=trackWidth;pixels.height=trackHeight;particles.width=640;particles.height=390;
showLabel(0);resize();draw();demo.dataset.value='0';demo.dataset.moving='false';
demo.dataset.motionReady='true';document.body.dataset.motionReady='true';
