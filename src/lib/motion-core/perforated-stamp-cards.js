/* Supplied HTML adaptation. Design reference: @devxnuj.
   No separate source or illustration license was supplied or verified. */
import {STAMP_IMAGES} from './perforated-stamp-cards-assets.mjs';

export function createPerforatedStampCards(scope,initial={}){
  const {document,on,requestAnimationFrame,cancelAnimationFrame}=scope;
  const root=document.getElementById('stampCards'),stage=document.getElementById('stage');
  const slots=[...document.querySelectorAll('.card-slot')];
  let options={...initial},destroyed=false,raf=null,lastTime=null,version=0;
  const reduced=()=>scope.reduced(),running=()=>!options.paused&&!document.hidden&&!reduced();
  const defaults=[
    {headline:'Your calm,\nPersonal co-pilot.',body:'Helping you stay on track without\nthe mental load.'},
    {headline:'Making everyday\nPlanning feel easier.',body:'Organizes your day so nothing slips\nthrough.'},
    {headline:'Taking care of the\nlittle things you forget.',body:"Keeps track of tasks and reminders\nso you don't have to."},
  ];
  const states=slots.map(slot=>({slot,wrap:slot.querySelector('.stamp-wrap'),sheen:slot.querySelector('.stamp-sheen'),image:slot.querySelector('img'),
    hover:false,focus:false,nx:.5,ny:.5,rx:0,ry:0,ty:0,sc:1,sh:0,vrx:0,vry:0,vty:0,vsc:0,vsh:0,trx:0,try_:0,tty:0,tsc:1,tsh:0}));

  // An SVG image with its own luminance mask avoids fragment URLs crossing ShadowRoots.
  const holes=[];
  const hole=(x,y)=>holes.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.45"/>`);
  for(let i=0;i<=20;i++){hole(2.3+i*12.26,-.85);hole(2.3+i*12.26,406.85);}
  for(let i=0;i<33;i++){hole(-.85,9+i*12.26);hole(246.85,9+i*12.26);}
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="246" height="406" viewBox="0 0 246 406"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="246" height="406"><rect width="246" height="406" fill="white"/><g fill="black">${holes.join('')}</g></mask></defs><rect width="246" height="406" fill="white" mask="url(#m)"/></svg>`;
  root.style.setProperty('--stamp-mask',`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  root.dataset.holes=String(holes.length);

  function resize(){
    if(destroyed)return;
    const stacked=root.clientWidth<=560&&!options.preview;
    root.dataset.layout=stacked?'stack':'row';
    if(stacked){stage.style.transform='none';return;}
    const scale=Math.min(root.clientWidth/1024,root.clientHeight/576,1.45);
    stage.style.transform=Math.abs(scale-1)<.002?'none':`scale(${scale.toFixed(4)})`;
  }
  function stepSpring(value,velocity,target,stiffness,damping,dt){
    velocity=(velocity+(target-value)*stiffness*dt)*Math.exp(-damping*dt);
    return [value+velocity*dt,velocity];
  }
  function paint(state){
    const {wrap}=state;
    if(state.rx===0&&state.ry===0&&state.ty===0&&state.sc===1&&state.sh===0){wrap.style.transform='';wrap.style.filter='drop-shadow(0 0 0 rgba(0,0,0,0))';}
    else{
      wrap.style.transform=`translateY(${state.ty.toFixed(2)}px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg) scale(${state.sc.toFixed(4)})`;
      const shadow=Math.max(0,state.sh);
      wrap.style.filter=`drop-shadow(0 ${(shadow*22).toFixed(1)}px ${(shadow*28).toFixed(1)}px rgba(0,0,0,${Math.min(1,shadow*.55).toFixed(3)}))`;
    }
  }
  function moving(state){
    return Math.abs(state.rx-state.trx)>=.01||Math.abs(state.vrx)>=.01||Math.abs(state.ry-state.try_)>=.01||Math.abs(state.vry)>=.01||
      Math.abs(state.ty-state.tty)>=.01||Math.abs(state.vty)>=.01||Math.abs(state.sc-state.tsc)>=.0005||Math.abs(state.vsc)>=.0005||
      Math.abs(state.sh-state.tsh)>=.005||Math.abs(state.vsh)>=.005;
  }
  function snap(state){
    state.rx=state.trx;state.ry=state.try_;state.ty=state.tty;state.sc=state.tsc;state.sh=state.tsh;
    state.vrx=0;state.vry=0;state.vty=0;state.vsc=0;state.vsh=0;paint(state);
  }
  function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
  function schedule(){if(!destroyed&&running()&&raf===null&&states.some(moving)){root.dataset.animating='true';raf=requestAnimationFrame(tick);}}
  function tick(now){
    raf=null;if(destroyed||!running())return;
    const dt=lastTime===null?0:Math.max(0,Math.min(.05,(now-lastTime)/1000));lastTime=now;
    for(const state of states){
      [state.rx,state.vrx]=stepSpring(state.rx,state.vrx,state.trx,180,14,dt);
      [state.ry,state.vry]=stepSpring(state.ry,state.vry,state.try_,180,14,dt);
      [state.ty,state.vty]=stepSpring(state.ty,state.vty,state.tty,200,15,dt);
      [state.sc,state.vsc]=stepSpring(state.sc,state.vsc,state.tsc,200,15,dt);
      [state.sh,state.vsh]=stepSpring(state.sh,state.vsh,state.tsh,160,14,dt);
      if(moving(state))paint(state);else snap(state);
    }
    if(states.some(moving))schedule();else{lastTime=null;root.dataset.animating='false';}
  }
  function targets(state){
    const active=state.hover||state.focus;
    state.slot.dataset.engaged=String(active);
    state.sheen.style.setProperty('--mx',`${(state.nx*100).toFixed(1)}%`);state.sheen.style.setProperty('--my',`${(state.ny*100).toFixed(1)}%`);
    state.trx=reduced()?0:state.hover?(.5-state.ny)*7.5:0;state.try_=reduced()?0:state.hover?(state.nx-.5)*7.5:0;
    state.tty=reduced()?0:state.hover?-6:state.focus?-5:0;
    state.tsc=reduced()?1:state.hover?1.022:state.focus?1.018:1;state.tsh=reduced()?0:state.hover?1:state.focus ? .85 : 0;
    if(reduced())snap(state);else schedule();
  }
  function playback(){
    if(destroyed)return;stop();root.dataset.paused=String(Boolean(options.paused)||document.hidden);root.dataset.reduced=String(reduced());
    states.forEach(targets);if(!running())root.dataset.animating='false';schedule();
  }
  function content(){
    const current=++version;root.dataset.ready='false';
    states.forEach((state,index)=>{
      const card=options.cards?.[index]??{},fallback=defaults[index],art=STAMP_IMAGES[index];
      const headline=card.headline??fallback.headline,body=card.body??fallback.body;
      state.slot.querySelector('.headline').textContent=headline;state.slot.querySelector('.body-copy').textContent=body;
      state.slot.setAttribute('aria-label',`${String(index+1).padStart(2,'0')} ${headline.replaceAll('\n',' ')}`);
      state.image.alt=card.imageAlt??art.alt;const src=card.imageSrc??art.src;
      if(state.image.getAttribute('src')!==src)state.image.src=src;
    });
    Promise.allSettled(states.map(state=>state.image.decode())).then(results=>{
      if(destroyed||current!==version)return;
      root.dataset.imageErrors=String(results.filter(result=>result.status==='rejected').length);root.dataset.ready='true';
    });
  }
  states.forEach((state,index)=>{
    on(state.slot,'pointermove',event=>{
      if(destroyed||event.pointerType==='touch')return;
      const rect=state.slot.getBoundingClientRect();state.nx=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));state.ny=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      state.hover=true;targets(state);
    });
    on(state.slot,'pointerleave',()=>{if(!destroyed){state.hover=false;targets(state);}});
    on(state.slot,'focus',()=>{if(!destroyed){state.focus=true;targets(state);}});
    on(state.slot,'blur',()=>{if(!destroyed){state.focus=false;targets(state);}});
    on(state.slot,'keydown',event=>{
      if(destroyed)return;
      let next=index;
      if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%3;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+2)%3;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=2;
      else if(event.key==='Escape'){event.preventDefault();state.hover=false;state.focus=false;state.slot.blur();targets(state);return;}else return;
      event.preventDefault();states[next].slot.focus({preventScroll:root.dataset.layout!=='stack'});
    });
  });
  on(document,'visibilitychange',playback);on(scope.matchMedia('(prefers-reduced-motion:reduce)'),'change',playback);
  const observer=new scope.ResizeObserver(resize);observer.observe(root);
  root.dataset.theme=options.preview?'light':'dark';root.dataset.animating='false';resize();content();playback();
  return {
    update(next={}){
      if(destroyed)return;options={...options,...next};
      if(Object.hasOwn(next,'cards'))content();resize();playback();
    },
    destroy(){
      if(destroyed)return;destroyed=true;version++;stop();observer.disconnect();
      root.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
      states.forEach(state=>{state.wrap.style.transform='';state.wrap.style.filter='';});
    },
  };
}
