import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';

export function createCollectionLayoutMorph(target,initial,CSS,markup){
 const prefix='clm-'+Math.random().toString(36).slice(2,10);
 const scope=createSurface(target,{css:CSS,markup:markup.replaceAll('$instance',prefix),width:1280,height:720},initial);
 const {root,on}=scope,scene=root.querySelector('.clm-scene'),stage=root.querySelector('.clm-stage');
 const tabs=[...root.querySelectorAll('.clm-tab')],items=[...root.querySelectorAll('.clm-item')];
 const indicator=root.querySelector('.clm-indicator'),divider=root.querySelector('.clm-divider');
 const packBars=[...root.querySelectorAll('.clm-pack-meta .clm-bar')],board=root.querySelector('.clm-board');
 const views=['list','card','pack'];
 let view='',timeline=null,dead=false,options={...initial};
 board.id=prefix+'-panel';tabs.forEach((tab,index)=>{tab.id=prefix+'-'+views[index];tab.setAttribute('aria-controls',board.id);});
 function fit(){stage.style.transform=`translate(-50%,-50%) scale(${Math.min(1,Math.max(.1,scene.clientHeight/720))})`;}
 function select(next,immediate=false){
  if(dead||!views.includes(next))return;
  if(next===view&&!immediate)return;
  timeline?.kill();timeline=null;view=next;scene.dataset.view=view;
  const index=views.indexOf(view),instant=immediate||scope.reduced();
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  board.setAttribute('aria-labelledby',tabs[index].id);
  scene.dataset.animating=String(!instant);
  if(!instant)timeline=gsap.timeline({onComplete(){if(!dead)scene.dataset.animating='false';}});
  const move=(node,values,duration=.55,delay=0)=>{
   if(instant)gsap.set(node,{...values,autoRound:false});
   else timeline.to(node,{...values,autoRound:false,duration,ease:'power2.out',overwrite:'auto'},delay);
  };
  move(indicator,{x:[0,110,228][index],width:[100,108,110][index]},.32);
  move(divider,{opacity:view==='card'?0:1},.18);
  items.forEach((item,i)=>{
   const tile=item.querySelector('.clm-tile'),bars=[...item.querySelectorAll('.clm-bar')];
   let image,meta;
   if(view==='list'){
    image={x:0,y:i*88,width:76,height:76,rotation:0,borderRadius:5};
    meta=[{x:92,y:14+i*88,width:204},{x:92,y:40+i*88,width:76},{x:448,y:27+i*88,width:64}];
   }else if(view==='card'){
    const size=472/3,x=i*(size+20);
    image={x,y:0,width:size,height:size,rotation:0,borderRadius:10};
    meta=[{x,y:size+10,width:size*5/6},{x,y:size+36,width:size*.315},{x:x+size*.738,y:size+36,width:size*.262}];
   }else{
    image={x:200+i*18,y:i===1?0:6,width:76,height:76,rotation:(i-1)*14,borderRadius:12};
   }
   item.style.zIndex=String(i);move(tile,image);
   bars.forEach((bar,j)=>move(bar,meta?{...meta[j],opacity:1}:{opacity:0},meta ? .4 : .18));
  });
  packBars.forEach((bar,i)=>move(bar,{x:i?230:204,y:i?130:104,width:i?52:104,opacity:view==='pack'?1:0},.22,view==='pack'?.08:0));
  root.querySelector('.clm-status').textContent=['List view','Card view','Pack view'][index];
 }
 tabs.forEach((tab,index)=>{
  on(tab,'click',()=>select(views[index]));
  on(tab,'keydown',event=>{
   let next=index;
   if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%3;
   else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+2)%3;
   else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;
   event.preventDefault();select(views[next]);tabs[next].focus();
  });
 });
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');
 on(media,'change',()=>select(view,true));
 const resize=new scope.ResizeObserver(fit);resize.observe(scene);scope.addCleanup(()=>resize.disconnect());
 select(views.includes(options.view)?options.view:'list',true);fit();scope.ready();
 scope.requestAnimationFrame(()=>{if(dead)return;scene.dataset.ready='true';scope.body.dataset.motionReady='true';});
 scope.addCleanup(()=>{dead=true;timeline?.kill();timeline=null;});
 return {...scope.controller,update(next){
  if(dead)return;
  scope.controller.update(next);options={...options,...next};fit();
  if(views.includes(next.view))select(next.view,scope.reduced());
  else if(next.reducedMotion!==undefined)select(view,true);
 }};
}
