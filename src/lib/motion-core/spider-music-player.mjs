import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';
import {createSpiderRenderer} from './spider-music-player-art.mjs';

export function createSpiderMusicPlayer(target,initial,CSS,MARKUP,DATA,ICONS){
 const prefix='sm-'+Math.random().toString(36).slice(2,10);
 const scope=createSurface(target,{css:CSS,markup:MARKUP.replaceAll('$spider-id',prefix),width:1416,height:1080},initial);
 const {root,on}=scope,scene=root.querySelector('.sm-scene'),device=root.querySelector('.sm-device');
 const list=root.querySelector('.sm-list'),slot=root.querySelector('.sm-main-slot'),covers=root.querySelector('.sm-covers');
 const spiderNode=root.querySelector('.sm-spider'),drawSpider=createSpiderRenderer(spiderNode);
 const thread=root.querySelector('.sm-thread'),cocoon=root.querySelector('.sm-cocoon'),search=root.querySelector('.sm-search input');
 const seek=root.querySelector('.sm-progress input'),playButton=root.querySelector('[data-action=play]');
 const records=DATA.map(track=>({...track})),liked=new Set(DATA.map((_,index)=>index));
 const art=[...root.querySelectorAll('.sm-art')].map(node=>({node,x:0,y:0,w:38,h:38,r:7,rotation:0,jitterX:0,jitterY:0,jitterAngle:0,opacity:1,z:4}));
 const spider={x:0,y:0,angle:34},web={beam:0,wrap:0,strain:0,alpha:0,track:0},shake={x:0,angle:0};
 let options={...initial},current=Number.isInteger(initial?.track)?Math.max(0,Math.min(records.length-1,initial.track)):0;
 let requested=current,pending=null,busy=false,dead=false,playing=initial?.playing??true,elapsed=85;
 let transfer=null,walking=null,impact=null,labelTween=null,toastTimer=0,geometryReady=false,fitScale=1;
 const deviceScale=1;
 let shuffle=false,repeat=false,side='right',paintX=null,paintY=null;
 const query=selector=>root.querySelector(selector),time=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
 // Undo the case's impact rotation before measuring targets in device coordinates.
 const rect=node=>{const box=scope.rect(node),origin=scope.rect(device),angle=-shake.angle*Math.PI/180,dx=(box.x+box.width/2-origin.x-origin.width/2)/fitScale,dy=(box.y+box.height/2-origin.y-origin.height/2)/fitScale,width=node.offsetWidth,height=node.offsetHeight,x=dx*Math.cos(angle)-dy*Math.sin(angle)+device.offsetWidth/2-device.clientLeft-width/2,y=dx*Math.sin(angle)+dy*Math.cos(angle)+device.offsetHeight/2-device.clientTop-height/2;return{x,y,left:x,top:y,right:x+width,bottom:y+height,width,height};},coverBox=index=>{
  const row=query(`.sm-row[data-track="${index}"]`),node=row?.querySelector('.sm-icon-slot');
  if(!node)return{x:0,y:0,w:0,h:0,r:0};
  const box=rect(node);return{x:box.x,y:box.y,w:box.width,h:box.height,r:7*deviceScale};
 };
 const mainBox=()=>{const box=rect(slot);return{x:box.x,y:box.y,w:box.width,h:box.height,r:24*deviceScale};};
 const assign=(item,box)=>Object.assign(item,box,{rotation:0,jitterX:0,jitterY:0,jitterAngle:0,opacity:1});
 function phase(name){scene.dataset.phase=name;}
 function paintImpact(){device.style.setProperty('--sm-impact-x',shake.x+'px');device.style.setProperty('--sm-impact-angle',shake.angle+'deg');}
 function stopImpact(){impact?.kill();impact=null;shake.x=0;shake.angle=0;paintImpact();scene.dataset.vibrating='false';}
 function kick(direction){
  stopImpact();if(dead||scope.reduced())return;
  scene.dataset.vibrating='true';
  impact=gsap.timeline({onUpdate:paintImpact,onComplete:()=>{impact=null;scene.dataset.vibrating='false';}});
  // 60fps displacement/rotation samples measured from the short landing recoil.
  for(const [x,angle] of [[-.15,-.008],[-1.48,-.11],[-3.15,-.253],[-2.53,-.297],[.16,-.188],[3.35,.038],[3.49,.169],[.75,.143],[-1.62,.034],[-2.28,-.047],[-.97,-.06],[.19,-.036],[.57,-.006],[.34,.011],[.04,.002],[0,0]])impact.to(shake,{x:x*direction,angle:angle*direction,duration:1/60,ease:'none'});
 }
 function restingPosition(which=side){const box=rect(query(which==='right'?'.sm-now':'.sm-queue'));return{x:which==='right'?box.right-25:box.left+26,y:box.top+49};}
 function clipScreens(){
  let path='';
  root.querySelectorAll('.sm-pane').forEach(pane=>{
   const {x,y,width:w,height:h}=rect(pane),r=parseFloat(scope.window.getComputedStyle(pane).borderTopLeftRadius);
   path+=`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`;
  });
  root.querySelectorAll('.sm-covers,.sm-web,.sm-spider-layer').forEach(layer=>{layer.style.clipPath=`path("${path}")`;});
  scene.dataset.screenClipped='true';
 }
 function paint(){
  if(dead||!geometryReady)return;
  const visible=rect(list);
  art.forEach((item,index)=>{
   const moving=busy&&(index===web.track||index===current),inMain=index===current||moving;
   let opacity=item.opacity;
   if(!inMain){const row=query(`.sm-row[data-track="${index}"]`);if(row?.hidden||item.y+item.h<visible.top||item.y>visible.bottom)opacity=0;else opacity*=Math.max(0,Math.min(1,(visible.bottom-item.y-34*deviceScale)/(115*deviceScale)));}
   item.node.style.cssText=`transform:translate3d(${item.x+item.jitterX}px,${item.y+item.jitterY}px,0) rotate(${item.rotation+item.jitterAngle}deg);width:${item.w}px;height:${item.h}px;border-radius:${item.r}px;opacity:${opacity};z-index:${item.z};`;
  });
  const moved=paintX===null?0:Math.hypot(spider.x-paintX,spider.y-paintY);paintX=spider.x;paintY=spider.y;
  spiderNode.style.transform=`translate(${spider.x-104}px,${spider.y-104}px) rotate(${spider.angle}deg)`;
  scene.dataset.spiderX=spider.x.toFixed(2);scene.dataset.spiderY=spider.y.toFixed(2);
  drawSpider(moved,spider.angle);
  if(web.alpha<.001){thread.setAttribute('d','');cocoon.setAttribute('d','');return;}
  const item=art[web.track],cx=item.x+item.jitterX+item.w/2,cy=item.y+item.jitterY+item.h/2;
  const heading=spider.angle*Math.PI/180,startX=spider.x-Math.sin(heading)*8,startY=spider.y+Math.cos(heading)*8,endX=startX+(cx-startX)*web.beam,endY=startY+(cy-startY)*web.beam;
  const sag=Math.min(22*deviceScale,Math.abs(endX-startX)*.025)*(1-web.wrap*.6)+3*Math.sin(web.strain*Math.PI*12)*Math.sin(web.strain*Math.PI);
  thread.setAttribute('d',`M ${startX} ${startY} Q ${(startX+endX)/2} ${(startY+endY)/2+sag} ${endX} ${endY}`);thread.style.opacity=String(web.alpha);
  const rings=6,points=16,rx=item.w*.61+8*deviceScale,ry=item.h*.62+8*deviceScale;
  const point=(ring,j)=>{const angle=j/points*Math.PI*2,factor=ring/rings,wobble=1+Math.sin(j*2.4+ring*.6)*.065;return[cx+Math.cos(angle)*rx*factor*wobble,cy+Math.sin(angle)*ry*factor*wobble];};
  let mesh='';const amount=Math.max(0,Math.min(1,web.wrap));
  for(let r=1;r<=rings;r++){const limit=Math.min(points,Math.max(0,(amount*rings-r+1)*points));if(limit<=0)continue;for(let j=0;j<=Math.ceil(limit);j++){const p=point(r,Math.min(j,limit));mesh+=(j?' L ':' M ')+p[0]+' '+p[1];}}
  for(let j=0;j<points;j+=2){const p=point(Math.max(0,amount*rings),j);mesh+=` M ${cx} ${cy} L ${p[0]} ${p[1]}`;}
  cocoon.setAttribute('d',mesh);cocoon.style.opacity=String(web.alpha*amount*.82);
 }
 function progress(){seek.max=String(records[current].duration);seek.value=String(elapsed);seek.style.setProperty('--progress',`${elapsed/records[current].duration*100}%`);query('.sm-elapsed').textContent=time(elapsed);query('.sm-remaining').textContent='-'+time(Math.max(0,records[current].duration-elapsed));}
 function playback(next){playing=Boolean(next);scene.dataset.playing=String(playing);playButton.innerHTML=ICONS[playing?'pause':'play'];playButton.setAttribute('aria-label',playing?'Pause':'Play');playButton.setAttribute('aria-pressed',String(playing));}
 function labels(animate=false){
  const track=records[current],next=records[(current+1)%records.length],nodes=[query('.sm-title'),query('.sm-artist'),query('.sm-info'),query('.sm-up-next')];
  labelTween?.kill();
  query('.sm-title').textContent=track.title.replace(/ \(feat\..*\)$/,'');query('.sm-title').title=track.title;
  query('.sm-artist').textContent=track.artist;
  query('.sm-up-next').textContent=`${track.artist} is spinning now, with ${next.artist} queued right after.`;
  const tags=[track.genre,track.album,track.year,'Late night'];query('.sm-tags').replaceChildren(...tags.map(text=>{const span=target.ownerDocument.createElement('span');span.textContent=text;return span;}));
  query('.sm-bio-copy').textContent=`“${track.title}” from ${track.album}. ${track.artist} joins tonight’s eight-record queue. Choose another cover, or let the little spider bring the next one over.`;
  const link=query('.sm-source');link.href=track.source;link.title=track.copyright;slot.setAttribute('aria-label',`${track.album} cover by ${track.artist}`);
  query('[data-action=like]').setAttribute('aria-pressed',String(liked.has(current)));
  root.querySelectorAll('.sm-row').forEach((row,index)=>{row.setAttribute('aria-current',String(index===current));row.querySelector('.sm-next').hidden=index!==(current+1)%records.length;});
  query('.sm-status').textContent=`${track.title} — ${track.artist}`;scene.dataset.track=String(current);progress();
  if(animate&&!scope.reduced())labelTween=gsap.fromTo(nodes,{opacity:0,y:7,filter:'blur(2px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.28,stagger:.035,overwrite:true});
  else gsap.set(nodes,{opacity:1,y:0,filter:'blur(0px)'});
 }
 function placeIdle(){art.forEach((item,index)=>{assign(item,index===current?mainBox():coverBox(index));item.z=index===current?5:4;});paint();}
 function crossTo(timeline,which,at=0,horizontal=.83){
  const goal=restingPosition(which),rim=rect(query('.sm-now')).top-100;
  timeline.to(spider,{y:rim,angle:which==='left'?-25:25,duration:.32,ease:'power1.in'},at)
   .to(spider,{x:goal.x,y:rim,angle:which==='left'?-90:90,duration:horizontal,ease:'none'},at+.32)
   .to(spider,{y:goal.y,angle:which==='left'?-34:34,duration:.32,ease:'power1.out'},at+.32+horizontal);
  return .64+horizontal;
 }
 function walk(){
  if(dead||scope.reduced())return;
  walking?.kill();side=side==='right'?'left':'right';
  walking=gsap.timeline({onUpdate:paint});
  crossTo(walking,side);
 }
 function commit(index,animate=true){current=index;elapsed=0;labels(animate);options.onTrackChange?.(index);}
 function finish(index){
  if(dead)return;busy=false;web.alpha=0;commit(index);placeIdle();phase('idle');transfer=null;
  if(pending!==null&&pending.index!==current){const next=pending;pending=null;select(next.index,next.direction);}
  else{pending=null;requested=current;walk();}
 }
 function select(index,direction){
  if(dead||!Number.isInteger(index)||index<0||index>=records.length)return;
  requested=index;
  if(busy){pending={index,direction};return;}
  if(index===current)return;
  walking?.kill();walking=null;
  const backwards=direction===undefined?index<current:direction<0,actionSide=backwards?'left':'right';side=actionSide;
  scene.dataset.pullFrom=backwards?'right':'left';
  if(scope.reduced()){stopImpact();web.alpha=0;Object.assign(spider,restingPosition(),{angle:side==='right'?34:-34});commit(index,false);placeIdle();phase('idle');return;}
  const old=current,subject=backwards?old:index,item=art[subject];
  const row=query(`.sm-row[data-track="${subject}"]`);if(row?.hidden){search.value='';filter();}
  if(!backwards){row.scrollIntoView({block:'nearest',behavior:'instant'});placeIdle();}
  const start={x:item.x,y:item.y,w:item.w,h:item.h,r:item.r};
  const end=backwards?coverBox(old):mainBox(),from={x:start.x+start.w/2,y:start.y+start.h/2},to={x:end.x+end.w/2,y:end.y+end.h/2};
  const route={p:0},control={x:from.x+(to.x-from.x)*.57,y:Math.min(from.y,to.y)-100*deviceScale};
  busy=true;web.track=subject;web.beam=0;web.wrap=0;web.strain=0;web.alpha=0;item.z=7;cocoon.dataset.track=String(subject);
  const rest=restingPosition(actionSide),inside={x:rest.x+(actionSide==='right'?-73:73),y:rest.y+34};
  const face=Math.atan2(from.y-inside.y,from.x-inside.x)*180/Math.PI-90;
  transfer=gsap.timeline({onUpdate:paint,onComplete:()=>finish(index)});
  const needsCross=(spider.x>device.clientWidth/2)!==(actionSide==='right'),lead=needsCross?crossTo(transfer,actionSide,0,.10):0;
  phase(needsCross?'position':'aim');
  const startAngle=needsCross?(actionSide==='right'?34:-34):spider.angle,angle=startAngle+((face-startAngle+540)%360-180);
  transfer.call(()=>{phase('aim');web.alpha=1;},[],lead)
   .to(spider,{angle,x:inside.x,y:inside.y,duration:.32,ease:'power2.out'},lead)
   .to(web,{beam:1,duration:.16,ease:'power2.out'},lead+.02)
   .call(()=>phase('wrap'),[],lead+.18)
   .to(web,{wrap:1,strain:1,duration:backwards?.40:.34,ease:'none'},lead+.18)
   .call(()=>phase('carry'),[],lead+(backwards?.60:.54));
  const tension=(backwards?1:-1)*Math.max(.35,item.w/526);
  const tremor=[[0,0,0],[12,3.8,-.64],[9.5,2.9,-.42],[-4.8,-1.5,.69],[-3.9,-1.6,.15],[2.35,.87,.16],[1.57,.67,-.13],[.26,.08,-.02],[0,0,0]];
  tremor.forEach(([x,y,angle],i)=>{transfer.to(item,{jitterX:x*tension,jitterY:y*Math.abs(tension),jitterAngle:angle,duration:1/30,ease:'none'},lead+.20+i/30);});
  const at=lead+(backwards?.60:.54),duration=backwards?.60:.54;
  transfer.to(spider,{x:rest.x+(actionSide==='right'?-28:28),y:rest.y+12,duration:.45,ease:'power1.inOut'},at);
  if(backwards){
   const arriving=art[index];assign(arriving,mainBox());arriving.z=5;arriving.opacity=0;
   transfer.to(arriving,{opacity:1,duration:.34,ease:'power1.out'},at+.27);
  }
  transfer.to(route,{p:1,duration,ease:'power2.inOut',onUpdate(){
   const p=route.p,q=1-p,cx=q*q*from.x+2*q*p*control.x+p*p*to.x,cy=q*q*from.y+2*q*p*control.y+p*p*to.y;
   item.w=start.w+(end.w-start.w)*p;item.h=start.h+(end.h-start.h)*p;item.r=start.r+(end.r-start.r)*p;item.x=cx-item.w/2;item.y=cy-item.h/2;item.rotation=Math.sin(p*Math.PI)*(backwards?-9:7);
  }},at).to(web,{alpha:0,duration:.20},at+.44).call(()=>kick(backwards?-1:1),[],at+duration-.035);
  if(!backwards)transfer.to(art[old],{opacity:0,duration:.14},at+.36);
  paint();
 }
 function step(direction){let next=(requested+direction+records.length)%records.length;if(shuffle){next=Math.floor(Math.random()*(records.length-1));if(next>=current)next++;}select(next,direction);}
 function fit(){
  if(dead)return;stopImpact();fitScale=Math.min(1,scene.clientHeight/1080);scene.style.setProperty('--device-scale',String(fitScale));
  if(busy){transfer?.kill();transfer=null;busy=false;web.alpha=0;pending=null;commit(requested,false);phase('idle');}
  walking?.kill();walking=null;geometryReady=true;Object.assign(spider,restingPosition(),{angle:side==='right'?34:-34});clipScreens();placeIdle();
 }
 function filter(){
  const value=search.value.trim().toLowerCase();let matches=0;
  root.querySelectorAll('.sm-row').forEach((row,index)=>{const record=records[index];row.hidden=![record.title,record.artist,record.album].join(' ').toLowerCase().includes(value);if(!row.hidden)matches++;});
  query('.sm-empty').hidden=matches>0;list.scrollTop=0;if(!busy)placeIdle();
 }
 function toast(text){query('.sm-toast').textContent=text;query('.sm-toast').hidden=false;if(toastTimer)scope.clearTimeout(toastTimer);toastTimer=scope.setTimeout(()=>{query('.sm-toast').hidden=true;},2200);}
 on(list,'click',event=>{const row=event.target.closest('.sm-row');if(row)select(Number(row.dataset.track));});
 on(list,'scroll',()=>{if(!busy)placeIdle();});on(search,'input',filter);on(seek,'input',()=>{elapsed=Number(seek.value);progress();});
 on(scene,'click',event=>{
  const button=event.target.closest('button[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='next')step(1);else if(action==='previous')step(-1);else if(action==='play')playback(!playing);
  else if(action==='shuffle'){shuffle=!shuffle;button.setAttribute('aria-pressed',String(shuffle));}
  else if(action==='repeat'){repeat=!repeat;button.setAttribute('aria-pressed',String(repeat));}
  else if(action==='like'){if(liked.has(current))liked.delete(current);else liked.add(current);button.setAttribute('aria-pressed',String(liked.has(current)));}
  else if(action==='queue'||action==='back'){search.value='';filter();query(`.sm-row[data-track="${current}"]`).scrollIntoView({block:'center',behavior:'smooth'});query(`.sm-row[data-track="${current}"]`).focus({preventScroll:true});}
  else if(action==='search'){search.focus();toast('Search by song, artist or album');}
  else if(action==='connect')toast('This device · '+records.length+' tracks in your queue');
  else if(action==='about')toast(records[current].album+' · '+records[current].year);
  else if(action==='add'){query('.sm-dialog').hidden=false;query('.sm-add-title').focus();}
  else if(action==='cancel'){query('.sm-dialog').hidden=true;query('[data-action=add]').focus();}
 });
 on(query('.sm-dialog'),'submit',event=>{
  event.preventDefault();const title=query('.sm-add-title').value.trim(),artist=query('.sm-add-artist').value.trim();if(!title||!artist)return;
  const index=records.length,record={...records[0],id:'local-'+index,title,artist,album:'Your queue',duration:210};records.push(record);
  const row=query('.sm-row').cloneNode(true);row.dataset.track=String(index);row.setAttribute('aria-current','false');row.querySelector('.sm-row-name').textContent=title;row.querySelector('.sm-row-artist').textContent=artist;row.querySelector('.sm-row-duration').textContent=time(record.duration);row.querySelector('.sm-next').hidden=true;list.insertBefore(row,query('.sm-empty'));
  const node=art[0].node.cloneNode(true);node.dataset.cover=String(index);covers.append(node);art.push({node,x:0,y:0,w:38,h:38,r:7,rotation:0,jitterX:0,jitterY:0,jitterAngle:0,opacity:1,z:4});
  query('.sm-dialog').hidden=true;query('.sm-dialog').reset();search.value='';filter();select(index);
 });
 on(scene,'keydown',event=>{
  if(event.target.matches('input,textarea,select')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowRight'){event.preventDefault();step(1);}else if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}
  else if(event.key==='Home'){event.preventDefault();select(0);}else if(event.key==='End'){event.preventDefault();select(records.length-1);}
  else if(event.code==='Space'&&event.target===scene){event.preventDefault();playback(!playing);}
  else if(event.key==='Escape'){pending=null;query('.sm-dialog').hidden=true;if(search.value){search.value='';filter();}}
 });
 scope.setInterval(()=>{if(dead||scope.document.hidden||!playing||busy)return;elapsed++;if(elapsed>=records[current].duration){elapsed=0;if(!repeat)step(1);}progress();},1000);
 const resize=new scope.ResizeObserver(fit);resize.observe(scene);scope.addCleanup(()=>resize.disconnect());
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',()=>{scope.controller.update({});if(scope.reduced()){transfer?.kill();walking?.kill();stopImpact();busy=false;web.alpha=0;if(current!==requested)commit(requested,false);else labels(false);phase('idle');placeIdle();}});
 on(scope.document,'visibilitychange',()=>{if(scope.document.hidden){walking?.pause();transfer?.pause();impact?.pause();labelTween?.pause();}else{walking?.resume();transfer?.resume();impact?.resume();labelTween?.resume();}});
 elapsed=Math.min(elapsed,records[current].duration);labels();playback(playing);fit();phase('idle');scope.ready();
 Promise.all([...root.querySelectorAll('img')].map(image=>image.decode().catch(()=>{}))).then(()=>{if(!dead)scope.requestAnimationFrame(()=>{if(!dead)scene.dataset.ready='true';});});
 scope.addCleanup(()=>{dead=true;transfer?.kill();walking?.kill();impact?.kill();labelTween?.kill();gsap.killTweensOf([...art,spider,web,shake]);});
 return {...scope.controller,update(next){
  if(dead)return;options={...options,...next};scope.controller.update(next);
  if(next.height!==undefined||next.reducedMotion!==undefined)fit();
  if(next.playing!==undefined)playback(next.playing);if(next.track!==undefined)select(next.track);
 }};
}
