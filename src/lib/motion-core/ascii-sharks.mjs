import {createSurface} from './motion-runtime';

const KINDS=['classic','hammerhead','zebra','tiger','greathammer','mako','thresher','nurse'];
const DEFAULTS=[{kind:'hammerhead',size:1},{kind:'classic',size:.84},{kind:'zebra',size:.77},{kind:'thresher',size:.7}];
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const sharkSpecs=value=>Array.isArray(value)&&value.length?value.slice(0,8).filter(s=>KINDS.includes(s?.kind)).map(s=>({kind:s.kind,size:clamp(Number.isFinite(s.size)?s.size:1,.35,1.25)})):DEFAULTS;

export function createAsciiSharks(target,initial,CSS,MARKUP,createSimulation,removeIcon){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:972,height:880,responsive:true},initial);
 const {root,on}=scope,scene=root.querySelector('.ao-scene'),canvas=root.querySelector('.ao-canvas');
 const form=root.querySelector('.ao-form'),input=root.querySelector('.ao-input'),send=root.querySelector('.ao-send');
 const historyButton=root.querySelector('.ao-history'),historyPanel=root.querySelector('.ao-history-panel'),historyList=root.querySelector('.ao-history-list');
 const fileInput=root.querySelector('.ao-file'),attachmentList=root.querySelector('.ao-attachments'),voice=root.querySelector('.ao-voice'),status=root.querySelector('.ao-status');
 let options={...initial},world,renderer,frame=0,last=0,acc=0,dead=false,ready=false,visible=true,paused=Boolean(initial?.paused);
 let specs=sharkSpecs(initial?.sharks),files=[],history=[],width=0,height=0,dpr=1;
 function render(dt=1/60){
  if(!renderer||dead)return;renderer.render(world,dt);
  scene.dataset.time=world.time.toFixed(4);scene.dataset.draws=String(Number(scene.dataset.draws||0)+1);
  scene.dataset.fish=String(world.fish.filter(f=>f.alive).length);scene.dataset.sharks=String(world.sharks.length);
  const largest=world.sharks[world.sharks.length-1];scene.dataset.sharkHead=largest?`${largest.nodes[0].toFixed(2)},${largest.nodes[1].toFixed(2)}`:'';
 }
 function stop(){if(frame)scope.cancelAnimationFrame(frame);frame=0;last=0;acc=0;}
 function running(){return ready&&!dead&&!paused&&!scope.reduced()&&visible&&!scope.document.hidden;}
 function tick(now){
  frame=0;if(!running())return;
  const dt=Math.min(.1,last?(now-last)/1000:0);last=now;acc+=dt*clamp(options.speed??1,.25,2);
  let steps=0;while(acc>=1/60&&steps<4){world.step(1/60);acc-=1/60;steps++;}if(steps===4)acc=0;
  render(dt);frame=scope.requestAnimationFrame(tick);
 }
 function resume(){if(running()&&!frame){last=0;frame=scope.requestAnimationFrame(tick);}}
 function reset(){
  stop();const engine=createSimulation(Number.isFinite(options.seed)?options.seed:7,target.ownerDocument);
  renderer=new engine.AsciiRenderer(canvas);renderer.setFontFamily('AsciiOceanMono, "Geist Mono", Menlo, monospace');
  const count=Number.isFinite(options.fishCount)?Math.round(clamp(options.fishCount,0,340)):undefined;
  world=new engine.World(specs.length?specs:DEFAULTS,count);renderer.resize(width,height,dpr);world.resize(width,height,renderer.cellWidth,renderer.cellHeight);
  for(let i=0;i<240;i++)world.step(1/60);render();scene.dataset.seed=String(options.seed??7);scene.dataset.pointer='false';resume();
 }
 function resize(){
  if(dead)return;
  const box=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(box.width)),h=Math.max(1,Math.round(box.height)),density=Math.min(scope.window.devicePixelRatio||1,2);
  if(w===width&&h===height&&density===dpr)return;
  if(world&&width&&height){
   const sx=w/width,sy=h/height,sizeRatio=clamp(Math.min(w,h)*.44,170,430)/clamp(Math.min(width,height)*.44,170,430);
   world.fish.forEach(f=>{f.x*=sx;f.y*=sy;});world.sharks.forEach(sh=>{for(let i=0;i<sh.nodes.length;i+=2){sh.nodes[i]*=sx;sh.nodes[i+1]*=sy;}sh.length*=sizeRatio;sh.orbitRadius*=Math.min(w,h)/Math.min(width,height);sh.heading=Math.atan2(Math.sin(sh.heading)*sy,Math.cos(sh.heading)*sx);});
  }
  width=w;height=h;dpr=density;
  if(renderer){renderer.resize(width,height,dpr);world.resize(width,height,renderer.cellWidth,renderer.cellHeight);render();}
 }
 function appearance(){
  scene.dataset.theme=options.theme==='dark'?'dark':'light';scene.dataset.paused=String(paused);
  root.querySelector('.ao-composer').hidden=options.showComposer===false;root.querySelector('.ao-haze').hidden=options.showComposer===false;root.querySelector('.ao-history-wrap').hidden=options.showComposer===false;
  voice.disabled=typeof options.onVoiceInput!=='function';voice.title=voice.disabled?'Voice input is not connected':'Voice input';
 }
 function point(event){const box=canvas.getBoundingClientRect();return{x:clamp((event.clientX-box.left)/box.width*world.width,0,world.width),y:clamp((event.clientY-box.top)/box.height*world.height,0,world.height)};}
 function splash(x,y){
  if(!ready)return;world.splash(x,y);scene.dataset.splashes=String(Number(scene.dataset.splashes||0)+1);scene.dataset.lastSplash=`${x.toFixed(2)},${y.toFixed(2)}`;
  if(!running())render();status.textContent='The nearby fish scatter.';
 }
 on(canvas,'pointermove',event=>{if(!ready)return;Object.assign(world.pointer,point(event),{active:event.pointerType!=='touch'});scene.dataset.pointer=String(world.pointer.active);if(scope.reduced())render();});
 const clearPointer=()=>{if(world)world.pointer.active=false;scene.dataset.pointer='false';};
 on(scene,'pointerleave',clearPointer);on(scope.window,'blur',clearPointer);
 on(canvas,'click',event=>{if(ready){const p=point(event);splash(p.x,p.y);}});
 on(canvas,'keydown',event=>{
  if(!ready)return;
  if(event.key===' '){event.preventDefault();paused=!paused;appearance();if(paused)stop();else resume();status.textContent=paused?'Ocean paused.':'Ocean resumed.';}
  else if(event.key.toLowerCase()==='r'){event.preventDefault();reset();status.textContent='Ocean restarted.';}
  else if(event.key==='Enter'){event.preventDefault();splash(world.pointer.active?world.pointer.x:width/2,world.pointer.active?world.pointer.y:height/2);}
  else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
   event.preventDefault();const p=world.pointer;if(!p.active){p.x=width/2;p.y=height/2;}p.active=true;
   p.x=clamp(p.x+(event.key==='ArrowLeft'?-48:event.key==='ArrowRight'?48:0),0,width);p.y=clamp(p.y+(event.key==='ArrowUp'?-48:event.key==='ArrowDown'?48:0),0,height);
   scene.dataset.pointer='true';if(!running()){world.step(1/60);render();}
  }
 });
 function closeHistory(focus=false){historyPanel.hidden=true;historyButton.setAttribute('aria-expanded','false');if(focus)historyButton.focus();}
 function listHistory(){
  historyList.replaceChildren();root.querySelector('.ao-history-empty').hidden=history.length>0;
  history.forEach((item,index)=>{const button=scope.document.createElement('button');button.className='ao-history-item';button.type='button';button.textContent=item.text||item.names.join(', ');button.dataset.entry=String(index);historyList.append(button);});
 }
 on(historyButton,'click',()=>{const open=historyPanel.hidden;historyPanel.hidden=!open;historyButton.setAttribute('aria-expanded',String(open));});
 on(historyButton,'keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();historyPanel.hidden=false;historyButton.setAttribute('aria-expanded','true');(historyList.firstElementChild||historyPanel).focus();}});
 on(historyList,'click',event=>{const button=event.target.closest('[data-entry]');if(!button)return;input.value=history[Number(button.dataset.entry)].text;closeHistory();input.focus();syncInput();});
 on(scene,'keydown',event=>{if(event.key==='Escape')closeHistory(root.activeElement===historyButton||historyPanel.contains(root.activeElement));});
 on(scope.document,'pointerdown',event=>{if(!event.composedPath().includes(scope.element))closeHistory();});
 on(scene,'pointerdown',event=>{if(!event.target.closest('.ao-history-wrap'))closeHistory();});
 function syncInput(){send.disabled=!input.value.trim()&&!files.length;input.style.height='34px';input.style.height=Math.min(92,Math.max(34,input.scrollHeight))+'px';}
 function attachments(){
  attachmentList.replaceChildren();attachmentList.hidden=!files.length;
  files.forEach((file,index)=>{const chip=scope.document.createElement('div'),name=scope.document.createElement('span'),button=scope.document.createElement('button');chip.className='ao-attachment';name.textContent=file.name;button.className='ao-remove';button.type='button';button.dataset.remove=String(index);button.setAttribute('aria-label','Remove '+file.name);button.innerHTML=removeIcon;chip.append(name,button);attachmentList.append(chip);});syncInput();
 }
 on(root.querySelector('.ao-add'),'click',()=>fileInput.click());
 on(fileInput,'change',()=>{files=[...fileInput.files].slice(0,3);fileInput.value='';attachments();});
 on(attachmentList,'click',event=>{const button=event.target.closest('[data-remove]');if(button){files.splice(Number(button.dataset.remove),1);attachments();}});
 on(voice,'click',()=>options.onVoiceInput?.());
 on(input,'input',syncInput);
 on(input,'keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submitMessage();}});
 // Sandboxed demos do not grant form navigation; run local actions directly.
 on(send,'click',event=>{event.preventDefault();submitMessage();});
 on(form,'submit',event=>{event.preventDefault();submitMessage();});
 function submitMessage(){
  const text=input.value.trim();if(!text&&!files.length)return;
  const message={text,attachments:[...files]};history.unshift({text,names:files.map(f=>f.name)});history=history.slice(0,8);listHistory();
  input.value='';files=[];attachments();options.onSubmit?.(message);scene.dataset.messages=String(Number(scene.dataset.messages||0)+1);status.textContent='Saved to local history.';input.focus();
 }
 const resizeObserver=new scope.ResizeObserver(resize);resizeObserver.observe(scene);
 const observer=new scope.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;scene.dataset.visible=String(visible);if(visible)resume();else stop();});observer.observe(scope.element);
 on(scope.document,'visibilitychange',()=>{if(scope.document.hidden)stop();else resume();});
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',()=>{scope.controller.update({});if(scope.reduced()){stop();render();}else resume();});
 appearance();syncInput();resize();scope.ready();scene.dataset.splashes='0';scene.dataset.messages='0';
 Promise.all([scope.document.fonts.load('600 14px AsciiOceanMono'),scope.document.fonts.load('300 50px AsciiOceanSans')]).then(()=>{
  if(dead)return;ready=true;resize();reset();scene.dataset.ready='true';scope.body.dataset.motionReady='true';
 });
 scope.addCleanup(()=>{dead=true;ready=false;stop();resizeObserver.disconnect();observer.disconnect();files=[];history=[];world=null;renderer=null;canvas.width=0;canvas.height=0;});
 return {...scope.controller,update(next){
  if(dead)return;const old=options;options={...options,...next};scope.controller.update(next);
  if(next.paused!==undefined)paused=Boolean(next.paused);appearance();
  const nextSpecs=next.sharks!==undefined?sharkSpecs(next.sharks):specs;
  const rebuild=JSON.stringify(nextSpecs)!==JSON.stringify(specs)||(next.seed!==undefined&&next.seed!==old.seed)||(next.fishCount!==undefined&&next.fishCount!==old.fishCount);specs=nextSpecs;
  if(ready&&rebuild)reset();else if(ready){resize();if(!running()){stop();render();}else resume();}
 }};
}
