/* global createInlineTorph, INLINE_GROUPS, INLINE_ICONS */
// Layout and feature stickers are rebuilt; agent SVGs and Torph retain their source notices.
// The builder consumes this controller to bind native mount/update/destroy.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inlineMorph=(()=>{
  const scene=document.querySelector('.itm-scene');
  const status=scene.querySelector('.itm-status');
  const accessible=scene.querySelector('.itm-accessible');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  // Torph's small stylesheet belongs to this instance, including in Shadow DOM.
  const localDocument=new Proxy(document,{get(target,key){
    if(key==='head')return scene;
    const value=Reflect.get(target,key,target);
    return typeof value==='function'?value.bind(target):value;
  }});
  const {MorphController}=createInlineTorph(localDocument,window,trackAnimation);
  const prefix='itm-'+Math.random().toString(36).slice(2,10);
  const animations=new Set();
  let serial=0,raf=0,last=0,destroyed=false;
  const reduced=()=>media.matches;
  const config=()=>({duration:200,ease:'cubic-bezier(0.19, 1, 0.22, 1)',respectReducedMotion:false,disabled:reduced()});
  function trackAnimation(node,...args){
    const animation=node.animate(...args);animations.add(animation);
    animation.addEventListener('finish',()=>animations.delete(animation),{once:true});
    animation.addEventListener('cancel',()=>animations.delete(animation),{once:true});
    return animation;
  }
  function animate(node,frames,settings,finish){
    const animation=trackAnimation(node,frames,settings);
    if(finish)animation.onfinish=finish;
    return animation;
  }
  function clearAnimations(){
    animations.forEach(animation=>{animation.onfinish=null;animation.cancel();});animations.clear();
  }
  function renderIcon(widget,item,immediate=false){
    const windowElement=widget.button.querySelector('.itm-icon-window');
    const old=windowElement.querySelector('.itm-icon-layer[data-current]');
    for(const layer of windowElement.querySelectorAll('.itm-icon-layer:not([data-current])')){
      layer.getAnimations().forEach(animation=>animation.cancel());layer.remove();
    }
    const layer=document.createElement('span');layer.className='itm-icon-layer';layer.dataset.current='';
    const id=prefix+'-'+serial++;
    layer.innerHTML=`<svg class="itm-icon" viewBox="0 0 64 64" aria-hidden="true">${INLINE_ICONS[item.icon].replaceAll('$id',id)}</svg>`;
    const rotation=item.rotation,sign=Math.sign(rotation)||1,x=item.offset||0;
    layer.style.transform=`translateX(${x}px) rotate(${rotation}deg)`;
    windowElement.appendChild(layer);
    if(old){
      delete old.dataset.current;old.getAnimations().forEach(animation=>animation.cancel());
      if(immediate||reduced())old.remove();
      else{
        const oldAngle=Number(old.dataset.rotation)||0,oldX=Number(old.dataset.offset)||0;
        animate(old,[{opacity:1,transform:`translateX(${oldX}px) scale(1) rotate(${oldAngle}deg)`},{opacity:0,transform:`translateX(${oldX}px) scale(.4) rotate(${oldAngle+5*(Math.sign(oldAngle)||1)}deg)`}],{duration:140,easing:'ease-out',fill:'forwards'},()=>old.remove());
      }
    }
    layer.dataset.rotation=String(rotation);layer.dataset.offset=String(x);
    if(!immediate&&!reduced()){
      animate(layer,[{opacity:0,transform:`translateX(${x}px) scale(.4) rotate(${rotation-16*sign}deg)`},{opacity:1,transform:`translateX(${x}px) scale(1.1) rotate(${rotation+5*sign}deg)`,offset:.65},{opacity:1,transform:`translateX(${x}px) scale(1) rotate(${rotation}deg)`}],{duration:300,easing:'cubic-bezier(.19,1,.22,1)'});
    }
  }
  const widgets=INLINE_GROUPS.map(group=>{
    const button=scene.querySelector(`[data-group="${group.key}"]`);
    const widget={group,button,index:group.initial,morph:new MorphController(),width:0,target:0,velocity:0};
    return widget;
  });
  function updateAccessible(announce=false){
    const [language,customize,agent]=widgets.map(widget=>widget.group.items[widget.index].text);
    const text=`A tool to create visual ${language}, customize ${customize}, and build interfaces with ${agent}.`;
    accessible.textContent=text;if(announce)status.textContent=`${language}, ${customize}, ${agent}`;
    for(const widget of widgets){
      const items=widget.group.items,next=items[(widget.index+1)%items.length];
      widget.button.setAttribute('aria-label',`${items[widget.index].text}. Show ${next.text}`);
      widget.button.dataset.value=items[widget.index].text;
    }
  }
  function measure(widget){
    const measureNode=widget.button.querySelector('.itm-measure');
    measureNode.textContent=widget.group.items[widget.index].text;
    return measureNode.getBoundingClientRect().width+90.89;
  }
  function tick(now){
    raf=0;
    const dt=Math.min(Math.max((now-last)/1000,0)||1/60,1/30);last=now;
    let moving=false;
    for(const widget of widgets){
      if(reduced()){widget.width=widget.target;widget.velocity=0;}
      else for(let i=0;i<4;i++){
        const step=dt/4;widget.velocity+=((widget.target-widget.width)*600-widget.velocity*34)*step;widget.width+=widget.velocity*step;
      }
      if(Math.abs(widget.target-widget.width)<.02&&Math.abs(widget.velocity)<.05){widget.width=widget.target;widget.velocity=0;}
      else moving=true;
      widget.button.style.width=`${widget.width}px`;
    }
    scene.dataset.moving=String(moving);
    if(moving&&!destroyed)raf=requestAnimationFrame(tick);
  }
  function wake(){
    if(destroyed)return;
    if(reduced()){if(raf)cancelAnimationFrame(raf);raf=0;tick(performance.now());return;}
    if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}
  }
  function select(widget,index,initial=false){
    widget.index=(index+widget.group.items.length)%widget.group.items.length;
    const item=widget.group.items[widget.index],options=config();
    if(widget.morph.needsRecreate(options))widget.morph.attach(widget.button.querySelector('.itm-label'),options);
    widget.morph.update(item.text);
    widget.target=measure(widget);
    if(initial||reduced())widget.width=widget.target;
    widget.button.style.width=`${widget.width}px`;
    renderIcon(widget,item,initial);updateAccessible(!initial);wake();
  }
  function update(){
    if(destroyed)return;
    if(reduced())clearAnimations();
    const options=config();
    for(const widget of widgets){
      if(widget.morph.needsRecreate(options))widget.morph.attach(widget.button.querySelector('.itm-label'),options);
      widget.target=measure(widget);
      if(reduced()){
        for(const layer of widget.button.querySelectorAll('.itm-icon-layer:not([data-current])'))layer.remove();
      }
    }
    wake();
  }
  for(const widget of widgets){
    select(widget,widget.index,true);
    widget.button.addEventListener('click',()=>select(widget,widget.index+1));
    widget.button.addEventListener('keydown',event=>{
      const keys={ArrowRight:widget.index+1,ArrowDown:widget.index+1,ArrowLeft:widget.index-1,ArrowUp:widget.index-1,Home:0,End:widget.group.items.length-1};
      if(!(event.key in keys))return;event.preventDefault();select(widget,keys[event.key]);
    });
  }
  const observer=new ResizeObserver(update);observer.observe(scene);
  const fontReady=()=>{if(!destroyed){update();scene.dataset.ready='true';document.body.dataset.motionReady='true';}};
  document.fonts.ready.then(fontReady);document.fonts.addEventListener('loadingdone',fontReady);
  media.addEventListener('change',update);
  scene.dataset.ready='false';
  return {update,destroy(){
    if(destroyed)return;destroyed=true;if(raf)cancelAnimationFrame(raf);
    clearAnimations();widgets.forEach(widget=>widget.morph.destroy());observer.disconnect();
    document.fonts.removeEventListener('loadingdone',fontReady);media.removeEventListener('change',update);
    scene.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
  }};
})();
