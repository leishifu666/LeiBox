import {createSurface} from './motion-runtime';
import {createFloodRenderer} from './shader-flood-renderer.mjs';

export function createShaderFlood(target,initial,CSS,MARKUP,DEFAULTS,PALETTES,ICONS){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1120,height:720,responsive:true},initial);
 const {root,on}=scope,scene=root.querySelector('.sf-scene'),stage=root.querySelector('.sf-stage'),grid=root.querySelector('.sf-grid');
 const owner=target.ownerDocument,browser=owner.defaultView,media=browser.matchMedia('(prefers-reduced-motion: reduce)');
 let options={seed:0,speed:1,theme:'light',...initial},items=[],cards=[],renderer,dead=false,visible=true,frame=0,last=0,clock=0,renderFrames=0,pinned=-1,focused=-1,lastInput='mouse',touchPoint=null,embeddedWidth=Infinity;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const reduced=()=>options.reducedMotion??media.matches;
 const color=s=>typeof s==='string'&&/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(s);
 const rgb=s=>{let hex=s.slice(1);if(hex.length===3)hex=[...hex].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);};
 function normalize(){options.seed=Number.isFinite(options.seed)?options.seed:0;options.speed=Number.isFinite(options.speed)?clamp(options.speed,0,3):1;}
 function local(card,event){const r=card.node.getBoundingClientRect();return [clamp((event.clientX-r.x)/r.width),clamp((event.clientY-r.y)/r.height)];}
 function stop(){if(frame)browser.cancelAnimationFrame(frame);frame=0;last=0;}
 function rendererLost(){if(dead)return;renderer.destroy();renderer=createFloodRenderer(stage,{force2D:true});measure();paint();wake();}
 function measure(){
  const box=scope.rect(stage);
  for(const card of cards){const rect=scope.rect(card.node);Object.assign(card,{x:rect.x-box.x,y:rect.y-box.y,width:rect.width,height:rect.height});}
  const display=stage.getBoundingClientRect().width,ratio=Math.max(.3,Math.min(1.5,(browser.devicePixelRatio||1)*Math.min(1,embeddedWidth/display)));
  renderer?.resize(stage.clientWidth,stage.clientHeight,ratio);
 }
 function paint(){
  if(dead)return;
  renderer.draw(cards,reduced()?0:clock);scene.dataset.renderer=renderer.mode;scene.dataset.frame=String(++renderFrames);scene.dataset.ready='true';
  for(const card of cards){card.node.dataset.progress=card.progress.toFixed(4);card.node.dataset.origin=card.origin.map(n=>n.toFixed(4)).join(',');card.node.dataset.state=card.progress===card.target?(card.target?'active':'idle'):(card.target?'entering':'leaving');}
 }
 function tick(now){
  frame=0;if(dead||!visible||owner.hidden)return;
  const dt=last?Math.min((now-last)/1000,.08):0;last=now;clock+=dt*options.speed;
  for(const card of cards){if(card.progress!==card.target){const p=clamp((now-card.started)/card.duration),ease=1-Math.pow(1-p,3);card.progress=p===1?card.target:card.from+(card.target-card.from)*ease;}}
  paint();wake();
 }
 function wake(){if(!frame&&!dead&&visible&&!owner.hidden&&cards.some(c=>c.progress!==c.target||(!reduced()&&options.speed>0&&c.progress>0)))frame=browser.requestAnimationFrame(tick);}
 function setCard(index,active,point=[.5,.5]){
  const card=cards[index];if(!card)return;
  card.origin=point;card.from=card.progress;card.target=active?1:0;card.started=browser.performance.now();card.duration=active?520:420;
  card.node.dataset.active=String(active);card.node.setAttribute('aria-pressed',String(active));
  if(reduced())card.progress=card.target;
  paint();wake();
 }
 function closeAll(){pinned=-1;focused=-1;cards.forEach((c,i)=>{if(c.target)setCard(i,false);});}
 function rebuild(){
  const incoming=Array.isArray(options.items)?options.items:DEFAULTS;
  items=incoming.map((item,index)=>({title:String(item?.title??''),description:String(item?.description??''),icon:typeof item?.icon==='string'&&ICONS[item.icon]?item.icon:'layers',colors:Array.isArray(item?.colors)&&item.colors.length===3&&item.colors.every(color)?item.colors:PALETTES[index%PALETTES.length]}));
  grid.replaceChildren();pinned=-1;focused=-1;
  cards=items.map((item,index)=>{
   const node=owner.createElement('button');node.type='button';node.className='sf-card';node.dataset.index=String(index);node.dataset.active='false';node.setAttribute('aria-pressed','false');node.style.setProperty('--sf-accent',item.colors[1]);
   const icon=owner.createElement('span');icon.className='sf-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=ICONS[item.icon];
   const content=owner.createElement('span');content.className='sf-content';const title=owner.createElement('span');title.className='sf-title';title.textContent=item.title;const description=owner.createElement('span');description.className='sf-description';description.textContent=item.description;content.append(title,description);node.append(icon,content);grid.append(node);
   return {node,index,seed:options.seed+index*7.31,colors:item.colors.map(rgb),origin:[.5,.5],progress:0,target:0,from:0,started:0,duration:520,x:0,y:0,width:0,height:0};
  });
  measure();paint();
 }
 const cardFor=event=>{const node=event.target.closest?.('.sf-card');return node&&grid.contains(node)?cards[Number(node.dataset.index)]:null;};
 on(grid,'pointerover',event=>{if(event.pointerType==='touch')return;const card=cardFor(event);if(!card||card.node.contains(event.relatedTarget))return;lastInput=event.pointerType;setCard(card.index,true,local(card,event));});
 on(grid,'pointerout',event=>{if(event.pointerType==='touch')return;const card=cardFor(event);if(!card||card.node.contains(event.relatedTarget)||card.index===pinned||card.index===focused)return;setCard(card.index,false,local(card,event));});
 on(grid,'pointerdown',event=>{lastInput=event.pointerType;const card=cardFor(event);touchPoint=card?local(card,event):null;});
 on(grid,'click',event=>{const card=cardFor(event);if(!card){closeAll();return;}if(event.pointerType==='touch'||lastInput==='touch'){
  const opening=pinned!==card.index;closeAll();if(opening){pinned=card.index;setCard(card.index,true,touchPoint??[.5,.5]);}
 }else if(event.detail===0){setCard(card.index,!card.target);}});
 on(grid,'focusin',event=>{const card=cardFor(event);if(card&&card.node.matches(':focus-visible')){focused=card.index;setCard(card.index,true);}});
 on(grid,'focusout',event=>{const card=cardFor(event);if(card&&focused===card.index){focused=-1;if(pinned!==card.index)setCard(card.index,false);}});
 on(grid,'keydown',event=>{
  lastInput='keyboard';touchPoint=null;
  const card=cardFor(event);if(event.key==='Escape'){event.preventDefault();closeAll();return;}if(!card)return;
  const directions={ArrowRight:1,ArrowLeft:-1,ArrowDown:1,ArrowUp:-1};let next;
  if(event.key in directions)next=(card.index+directions[event.key]+cards.length)%cards.length;
  if(event.key==='Home')next=0;if(event.key==='End')next=cards.length-1;
  if(next!==undefined){event.preventDefault();lastInput='keyboard';cards[next].node.focus();}
 });
 on(owner,'pointerdown',event=>{if(!scope.element.contains(event.target))closeAll();});
 on(scene,'click',event=>{if(!event.target.closest?.('.sf-card'))closeAll();});
 on(owner,'visibilitychange',()=>{if(owner.hidden)stop();else wake();});
 on(media,'change',()=>{stop();if(reduced())cards.forEach(c=>{c.progress=c.target;});paint();wake();});
 on(browser,'message',event=>{const d=event.data;if(event.source!==browser.parent||d?.type!=='leibox-render-size'||d.slug!=='shader-flood'||!Number.isFinite(d.width)||d.width<=0)return;embeddedWidth=d.width;measure();paint();});
 normalize();renderer=createFloodRenderer(stage,{onLost:rendererLost});rebuild();
 const resize=new browser.ResizeObserver(()=>{measure();paint();});resize.observe(stage);
 const intersection=new browser.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();});intersection.observe(scope.element);
 scene.dataset.theme=options.theme==='dark'?'dark':'light';if(color(options.background))scene.style.setProperty('--sf-background',options.background);
 if(initial.preview&&cards.length){cards[0].progress=cards[0].target=cards[0].from=1;cards[0].node.dataset.active='true';cards[0].node.setAttribute('aria-pressed','true');paint();wake();}
 scope.body.dataset.motionReady='true';
 return {element:scope.element,root,
  update(next={}){if(dead)return;options={...options,...next};normalize();scope.controller.update(next);
   if('items'in next)rebuild();else cards.forEach((card,index)=>card.seed=options.seed+index*7.31);
   scene.dataset.theme=options.theme==='dark'?'dark':'light';if('background'in next){if(color(next.background))scene.style.setProperty('--sf-background',next.background);else scene.style.removeProperty('--sf-background');}
   if(reduced())cards.forEach(c=>{c.progress=c.target;});stop();measure();paint();wake();
  },
  destroy(){if(dead)return;dead=true;stop();resize.disconnect();intersection.disconnect();renderer.destroy();scope.controller.destroy();cards=[];items=[];}
 };
}
