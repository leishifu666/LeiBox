/* global scope */
// Independent DOM/SVG reconstruction from the observed glass toolbar interaction.
const demo=document.querySelector('.glass-tab-demo'),stage=demo.querySelector('.gt-stage'),cluster=demo.querySelector('.gt-cluster');
const panel=demo.querySelector('.gt-panel'),tabs=demo.querySelector('.gt-tabs'),indicator=demo.querySelector('.gt-selection'),lens=demo.querySelector('.gt-lens'),toggle=demo.querySelector('.gt-toggle'),plus=demo.querySelector('.gt-plus'),menu=demo.querySelector('.gt-menu');
const tabButtons=[...demo.querySelectorAll('.gt-tab')],actions=[...demo.querySelectorAll('.gt-action')],pages=[...demo.querySelectorAll('.gt-page')],status=demo.querySelector('.gt-status');
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
const opening={p:0,v:0,target:0},selection={p:0,v:0,target:0},compression={p:0,v:0,target:0},press={p:0,v:0,target:0},content={p:0,v:0,target:0};
let selected=0,frame=0,last=0,destroyed=false,menuFocus=-1,optionObserver,morphDelay=0,pendingKick=0,compressionDelay=0,contentDelay=0;
function draw(){
 const p=clamp(opening.p),c=clamp(compression.p,-.02,.47),width=762*(1-c),height=147+299*clamp(opening.p,0,1.02),travel=clamp(Math.abs(selection.v)/7);
 panel.style.width=width+'px';panel.style.left=(762-width)/2+'px';panel.style.height=height+'px';panel.style.borderRadius=(73.5+12.5*p)+'px';
 const blur=22*Math.sin(p*Math.PI),reveal=clamp(content.p),menuBlur=22*(1-reveal);
 tabs.style.transform=`translateX(-50%) scaleX(${width/762})`;tabs.style.opacity=String(1-smooth(.03,.39,p));tabs.style.filter=blur>.01?`blur(${blur}px)`: 'none';
 menu.style.transform=`translateX(-50%) scale(${width/762},${height/446})`;menu.style.opacity=String(reveal);menu.style.filter=menuBlur>.01?`blur(${menuBlur}px)`: 'none';
 menu.style.pointerEvents=opening.target&&reveal>.62?'auto':'none';
 menu.inert=!opening.target||reveal<=.62;tabs.inert=Boolean(opening.target)||p>.38;
 indicator.style.transform=`translateX(${selection.p*183}px) scale(${1+travel*.08},${1+travel*.25})`;
 lens.style.transform=indicator.style.transform;lens.style.opacity=String(travel);
 indicator.style.background=`rgba(255,255,255,${.98-.95*travel})`;indicator.style.boxShadow=`0 ${7-3*travel}px ${17+5*travel}px rgba(82,77,99,${.15-.07*travel})`;
 const pulse=clamp(press.p,0,.48);plus.style.transform=`rotate(${45*p}deg)`;toggle.style.transform=`scale(${1+pulse*.6})`;toggle.style.background=`linear-gradient(155deg,rgba(255,255,255,${.43+clamp(pulse*2,0,.57)}),rgba(255,255,255,${.27+clamp(pulse*2.2,0,.73)}))`;
 demo.dataset.content=reveal.toFixed(4);demo.dataset.progress=p.toFixed(4);demo.dataset.selection=String(selected);demo.dataset.indicator=selection.p.toFixed(4);demo.dataset.open=String(Boolean(opening.target));
 if(menuFocus>=0&&reveal>.75){const i=menuFocus;menuFocus=-1;focusAction(i);}
}
function step(state,h,stiffness,damping){state.v+=((state.target-state.p)*stiffness-state.v*damping)*h;state.p+=state.v*h;if(Math.abs(state.p-state.target)<.0001&&Math.abs(state.v)<.001){state.p=state.target;state.v=0;}return state.p!==state.target||state.v!==0;}
function settle(){cancelAnimationFrame(frame);frame=0;last=0;morphDelay=0;pendingKick=0;compressionDelay=0;contentDelay=0;for(const state of [opening,selection,compression,press,content]){state.p=state.target;state.v=0;}draw();demo.dataset.moving='false';}
function tick(time){
 frame=0;if(destroyed)return;if(media.matches){settle();return;}
 const dt=Math.min(.032,(time-(last||time-16))/1000);last=time;let moving=false;
 for(let i=0;i<3;i++){
  const h=dt/3;
  if(morphDelay>0){morphDelay=Math.max(0,morphDelay-h);moving=true;}else moving=step(opening,h,400,26)||moving;
  if(compressionDelay>0){compressionDelay=Math.max(0,compressionDelay-h);moving=true;}else if(pendingKick){compression.v=Math.min(20,compression.v+pendingKick);pendingKick=0;}
  if(contentDelay>0){contentDelay=Math.max(0,contentDelay-h);moving=true;}else moving=step(content,h,480,30)||moving;
  moving=step(selection,h,330,26)||moving;moving=step(compression,h,400,22)||moving;moving=step(press,h,420,24)||moving;
 }
 draw();demo.dataset.moving=String(moving);
 if(moving)frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(destroyed)return;if(media.matches){settle();return;}demo.dataset.moving='true';if(!frame)frame=requestAnimationFrame(tick);}
function setOpen(value,focus=-1){
 if(destroyed)return;
 const next=Number(value);
 if(next!==opening.target&&!media.matches){const gap=Math.abs(next-opening.p);morphDelay=gap>.95?.075:0;compressionDelay=gap>.95?.09:0;contentDelay=next&&gap>.95?.17:0;pendingKick=17*gap;press.v=Math.min(18,press.v+16);}
 opening.target=next;content.target=next;menuFocus=value?focus:-1;
 if(!value&&actions.includes(document.activeElement))toggle.focus();
 menu.inert=!value;tabs.inert=value;toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?'Close creation menu':'Open creation menu');
 if(!value)actions.forEach(n=>n.tabIndex=-1);
 draw();wake();
}
function select(index,focus=false){
 selected=index;selection.target=index;demo.dataset.selection=String(index);
 tabButtons.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;pages[i].hidden=i!==index;});
 if(focus)tabButtons[index].focus();wake();
}
function focusAction(index){actions.forEach((button,i)=>button.tabIndex=i===index?0:-1);actions[index].focus();}
function returnFocus(){setOpen(false);toggle.focus();}
tabButtons.forEach((button,i)=>{
 button.addEventListener('click',()=>select(i));
 button.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%4;else if(event.key==='ArrowLeft')next=(i+3)%4;else if(event.key==='Home')next=0;else if(event.key==='End')next=3;else return;event.preventDefault();select(next,true);});
});
toggle.addEventListener('click',event=>setOpen(!opening.target,event.detail===0&&!opening.target?0:-1));
toggle.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true,event.key==='ArrowDown'?0:5);}else if(event.key==='Escape'&&opening.target){event.preventDefault();returnFocus();}});
actions.forEach((button,i)=>{
 button.addEventListener('click',()=>{demo.dataset.action=button.dataset.action;status.textContent=button.dataset.action+' selected. Local demonstration.';demo.dispatchEvent(new CustomEvent('glass-tab-action',{bubbles:true,composed:true,detail:{action:button.dataset.action}}));returnFocus();});
 button.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%6;else if(event.key==='ArrowLeft')next=(i+5)%6;else if(event.key==='ArrowDown')next=(i+3)%6;else if(event.key==='ArrowUp')next=(i+3)%6;else if(event.key==='Home')next=0;else if(event.key==='End')next=5;else if(event.key==='Escape'){event.preventDefault();returnFocus();return;}else return;event.preventDefault();focusAction(next);});
});
document.addEventListener('pointerdown',event=>{if(opening.target&&!event.composedPath().includes(cluster))setOpen(false);});
cluster.addEventListener('focusout',event=>{if(opening.target&&!cluster.contains(event.relatedTarget))setOpen(false);});
function syncMotion(){if(media.matches)settle();else wake();}
media.addEventListener('change',syncMotion);
function resize(){const rect=demo.getBoundingClientRect();stage.style.setProperty('--gt-scale',String(Math.min(rect.width/1080,rect.height/1080)));draw();}
const observer=new ResizeObserver(resize);observer.observe(demo);
function dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();optionObserver?.disconnect();media.removeEventListener('change',syncMotion);}
if(typeof scope!=='undefined'){scope.addCleanup(dispose);optionObserver=new MutationObserver(syncMotion);optionObserver.observe(scope.element,{attributes:true,attributeFilter:['data-reduced-motion']});}
window.addEventListener('pagehide',dispose,{once:true});
resize();draw();demo.dataset.moving='false';
function ready(){if(destroyed)return;demo.dataset.motionReady='true';document.body.dataset.motionReady='true';}
document.fonts.load('500 33px GlassTabInter').then(ready,ready);
