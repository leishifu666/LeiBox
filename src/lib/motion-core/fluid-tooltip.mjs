import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';

export function createFluidTooltip(target,initial,CSS,MARKUP,ITEMS,LOGO){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1288,height:1080},initial);
 const {root,on}=scope,scene=root.querySelector('.ft-scene'),stage=root.querySelector('.ft-stage');
 const rail=root.querySelector('.ft-rail'),tip=root.querySelector('.ft-tooltip'),track=root.querySelector('.ft-label-track');
 const buttons=[...root.querySelectorAll('.ft-trigger')],rows=[...root.querySelectorAll('.ft-label-row')],logo=root.querySelector('.ft-logo');
 const state={y:0,width:252,opacity:0},centers=[],widths=[];
 let options={...initial},active=ITEMS.some(item=>item.id===initial?.active)?initial.active:'today';
 let hint=-1,tween=null,hideTimer=0,dead=false,ready=false;
 tip.id='ft-tip-'+Math.random().toString(36).slice(2,10);
 function paint(){
  if(dead)return;
  tip.style.transform=`translateY(${state.y}px)`;tip.style.width=state.width+'px';tip.style.opacity=String(state.opacity);
  // The label rows stay at their rail positions while the capsule crops across them.
  track.style.transform=`translateY(${-state.y}px)`;
  scene.dataset.tooltipY=state.y.toFixed(3);scene.dataset.tooltipWidth=state.width.toFixed(3);
 }
 function cancelHide(){if(hideTimer){scope.clearTimeout(hideTimer);hideTimer=0;}}
 function highlight(immediate=false){buttons.forEach((button,index)=>{
  const selected=ITEMS[index].id===active;button.setAttribute('aria-current',selected?'page':'false');
  const backgroundColor=selected?'rgba(255,255,255,.11)':index===hint?'rgba(255,255,255,.025)':'rgba(255,255,255,0)';
  if(immediate||scope.reduced())gsap.set(button,{backgroundColor});else gsap.to(button,{backgroundColor,duration:.13,overwrite:true});
 });}
 function show(index,immediate=false){
  if(dead||index<0||index>=ITEMS.length)return;
  cancelHide();hint=index;scene.dataset.hint=ITEMS[index].id;tip.setAttribute('aria-hidden','false');
  tip.setAttribute('aria-label',rows[index].querySelector('.ft-label').textContent);
  buttons.forEach((button,i)=>{if(i===index)button.setAttribute('aria-describedby',tip.id);else button.removeAttribute('aria-describedby');});
  if(!ready)return;
  tween?.kill();highlight(immediate);
  const next={y:centers[index]-43,width:widths[index],opacity:1};
  if(immediate||scope.reduced()){Object.assign(state,next);paint();return;}
  const first=state.opacity<.01;
  if(first){state.y=next.y;state.width=next.width;paint();}
  tween=gsap.to(state,{...next,duration:first?.15:.43,ease:first?'power2.out':'expo.out',overwrite:true,onUpdate:paint});
 }
 function hide(immediate=false){
  cancelHide();hint=-1;scene.dataset.hint='none';tip.setAttribute('aria-hidden','true');
  buttons.forEach(button=>button.removeAttribute('aria-describedby'));tween?.kill();highlight(immediate);
  if(immediate||scope.reduced()){state.opacity=0;paint();}
  else tween=gsap.to(state,{opacity:0,duration:.15,ease:'power2.out',onUpdate:paint});
 }
 function leave(){cancelHide();hideTimer=scope.setTimeout(()=>{hideTimer=0;const focused=buttons.indexOf(root.activeElement);if(focused>=0)show(focused);else hide();},75);}
 function select(index){
  const next=ITEMS[index].id,changed=next!==active;active=next;scene.dataset.active=active;highlight();show(index);
  if(changed)options.onSelect?.(active);
 }
 function fit(){
  if(dead)return;stage.style.setProperty('--ft-fit',String(Math.min(1,scene.clientHeight/1080)));
  buttons.forEach((button,index)=>{centers[index]=rail.offsetTop+button.offsetTop+button.offsetHeight/2;rows[index].style.top=centers[index]-43+'px';widths[index]=Math.ceil(rows[index].offsetWidth+64);});
  if(ready&&hint>=0){tween?.kill();Object.assign(state,{y:centers[hint]-43,width:widths[hint],opacity:1});tip.setAttribute('aria-label',rows[hint].querySelector('.ft-label').textContent);}
  paint();
 }
 function profile(){
  const label=options.profileLabel??'LeiBox';rows[5].querySelector('.ft-label').textContent=label;
  buttons[5].setAttribute('aria-label',label);logo.src=options.logoSrc||LOGO;
 }
 buttons.forEach((button,index)=>{
  on(button,'pointerenter',event=>{if(event.pointerType!=='touch')show(index);});on(button,'pointerleave',event=>{if(event.pointerType!=='touch')leave();});
  on(button,'focus',()=>show(index));on(button,'blur',leave);on(button,'click',()=>select(index));
  on(button,'keydown',event=>{
   let next=index;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(index+1)%buttons.length;
   else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;
   else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;
   else if(event.key==='Escape'){event.preventDefault();hide(true);return;}else return;
   event.preventDefault();buttons[next].focus();
  });
 });
 on(scene,'pointerdown',event=>{if(!event.target.closest('.ft-trigger')){root.activeElement?.blur();hide();}});
 on(scope.document,'pointerdown',event=>{if(!event.composedPath().includes(scope.element))hide();});
 on(scene,'keydown',event=>{
  if(!(event.metaKey||event.ctrlKey)||event.altKey)return;const index=Number(event.key)-1;
  if(index>=0&&index<5){event.preventDefault();buttons[index].focus();select(index);}
 });
 on(logo,'error',()=>{if(logo.src!==LOGO)logo.src=LOGO;});
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',()=>{scope.controller.update({});if(scope.reduced()){tween?.kill();gsap.killTweensOf(buttons);if(hint>=0)show(hint,true);else hide(true);}});
 on(scope.document,'visibilitychange',()=>{if(scope.document.hidden){cancelHide();tween?.pause();}else tween?.resume();});
 const resize=new scope.ResizeObserver(fit);resize.observe(scene);scope.addCleanup(()=>resize.disconnect());
 profile();fit();highlight(true);scene.dataset.active=active;scene.dataset.hint='none';tip.setAttribute('aria-hidden','true');scope.ready();
 scope.document.fonts.ready.then(()=>{if(dead)return;ready=true;fit();scene.dataset.ready='true';scope.body.dataset.motionReady='true';});
 scope.addCleanup(()=>{dead=true;cancelHide();tween?.kill();gsap.killTweensOf([state,...buttons]);});
 return {...scope.controller,update(next){
  if(dead)return;options={...options,...next};scope.controller.update(next);
  if(next.reducedMotion!==undefined&&scope.reduced()){tween?.kill();gsap.killTweensOf(buttons);if(hint<0)state.opacity=0;}
  if(ITEMS.some(item=>item.id===next.active)){active=next.active;scene.dataset.active=active;highlight();}
  if(next.profileLabel!==undefined||next.logoSrc!==undefined)profile();fit();
 }};
}
