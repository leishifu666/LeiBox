import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';

export function createBrandPosterCards(target,initial,CSS,markup,defaults){
 const scope=createSurface(target,{css:CSS,markup,width:1200,height:675},initial);
 const {root,on}=scope,scene=root.querySelector('.bp-scene'),row=root.querySelector('.bp-row');
 const cards=[...root.querySelectorAll('.bp-card')],photos=cards.map(card=>card.querySelector('.bp-photo'));
 const animations=new Map();let options={...initial},selected=-1,hovered=-1,focused=-1,dead=false,loadVersion=0;
 const reduced=()=>scope.reduced();
 function paint(){
  scene.dataset.selected=String(selected);
  cards.forEach((card,index)=>{
   const active=index===selected||index===hovered||index===focused,photo=photos[index];
   card.dataset.active=String(active);card.setAttribute('aria-pressed',String(index===selected));
   animations.get(photo)?.kill();animations.delete(photo);
   const scale=active&&!reduced()?1.035:1;
   if(reduced())gsap.set(photo,{scale:1});
   else{const animation=gsap.to(photo,{scale,duration:active ? .65 : .55,ease:'power2.out',onComplete(){if(animations.get(photo)===animation)animations.delete(photo);}});animations.set(photo,animation);}
  });
 }
 function fit(){const scale=Math.min(1,Math.max(.1,(scene.clientHeight-48)/383.2065));row.style.transform=`scale(${scale})`;}
 function render(){
  const images=options.images??defaults.images;
  cards.forEach((card,index)=>{
   const input=images[index]??defaults.images[index],image=typeof input==='string'?{src:input}:input,photo=photos[index];
   const alt=image.alt??defaults.images[index].alt;card.setAttribute('aria-label',alt);
   photo.alt=alt;photo.style.objectPosition=image.position??'center';
   if(photo.getAttribute('src')!==image.src){photo.dataset.state='loading';photo.src=image.src;}
   card.querySelector('.bp-logo').src=options.logoSrc??defaults.logo;
   card.querySelector('.bp-symbol').src=options.symbolSrc??defaults.symbol;
   card.querySelector('.bp-copy').textContent=options.description??defaults.description;
  });
  const version=++loadVersion;scene.dataset.ready='false';
  Promise.all([...scene.querySelectorAll('img')].map(image=>image.decode().catch(()=>{}))).then(()=>{
   if(dead||version!==loadVersion)return;
   const ready=()=>{if(dead||version!==loadVersion)return;scene.dataset.ready='true';scope.body.dataset.motionReady='true';};if(reduced())ready();else scope.requestAnimationFrame(ready);
  });
 }
 cards.forEach((card,index)=>{
  on(card,'pointerenter',event=>{if(event.pointerType==='touch')return;hovered=index;paint();});
  on(card,'pointerleave',()=>{if(hovered===index)hovered=-1;paint();});
  on(card,'focus',()=>{focused=index;paint();});on(card,'blur',()=>{if(focused===index)focused=-1;paint();});
  on(card,'click',()=>{selected=selected===index?-1:index;paint();});
  on(card,'keydown',event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click();return;}
   let next=index;if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else if(event.key==='Escape'){event.preventDefault();selected=-1;focused=-1;hovered=-1;card.blur();paint();return;}else return;
   event.preventDefault();cards[next].focus({preventScroll:true});
  });
  on(photos[index],'load',()=>{photos[index].dataset.state='ready';});on(photos[index],'error',()=>{photos[index].dataset.state='error';});
 });
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',paint);
 const resize=new scope.ResizeObserver(fit);resize.observe(scene);
 const update=scope.controller.update;
 scope.controller.update=next=>{if(dead)return;const content=['images','description','logoSrc','symbolSrc'].some(key=>key in next);options={...options,...next};update(next);if(content)render();fit();paint();};
 scope.addCleanup(()=>{dead=true;animations.forEach(animation=>animation.kill());animations.clear();gsap.killTweensOf(photos);});
 render();fit();paint();scope.ready();return scope.controller;
}
