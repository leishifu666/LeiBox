import {createSurface} from './motion-runtime';

export function createTransferGlow(target,initial,CSS,MARKUP){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1120,height:840,responsive:true},initial);
 const {root,on}=scope,scene=root.querySelector('.tg-scene'),modal=root.querySelector('.tg-modal'),dashboard=root.querySelector('.tg-dashboard'),wrap=root.querySelector('.tg-modal-wrap'),canvas=root.querySelector('.tg-glow'),ctx=canvas.getContext('2d');
 const owner=target.ownerDocument,browser=owner.defaultView,media=browser.matchMedia('(prefers-reduced-motion: reduce)');
 const haze=owner.createElement('canvas'),hazeContext=haze.getContext('2d');
 const find=s=>root.querySelector(s),text=(s,value)=>{find(s).textContent=value;};
 let options={open:true,amount:'100,000.00',account:'Grain USD account',recipient:'Müller Logistik GmbH',receivedAmount:'€92,000.00',duration:5200,...initial};
 let phase='confirm',elapsed=0,last=0,raf=0,visible=true,dead=false,paintCount=0,returnFocus=null,announcement='',reducedTimer=0,paintDue=0;
 const reduced=()=>options.reducedMotion??media.matches;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
 function normalize(){options.duration=Number.isFinite(options.duration)?clamp(options.duration,1200,15000):5200;for(const key of['amount','account','recipient','receivedAmount'])options[key]=String(options[key]??'');}
 function content(success=false){
  text('.tg-title',success?'Money sent':'Confirm transfer');text('.tg-subtitle',success?`Your payment to ${options.recipient} is complete`:'Review the payment details before sending');
  text('.tg-label',success?'Transfer sent':'Transfer amount');text('.tg-number',options.amount);text('.tg-account',options.account);text('.tg-recipient',options.recipient);text('.tg-received',`${options.receivedAmount} EUR`);
  find('.tg-cancel').hidden=success;text('.tg-send',success?'Done':'Confirm & Send');modal.dataset.result=String(success);
 }
 function stop(){if(raf)browser.cancelAnimationFrame(raf);raf=0;last=0;if(reducedTimer)scope.clearTimeout(reducedTimer);reducedTimer=0;scene.dataset.running='false';}
 function announce(value){if(value===announcement)return;const node=find('.tg-status-text'),old=find('.tg-status-old');old.textContent=phase==='processing'?announcement:'';old.classList.remove('tg-retiring');announcement=value;node.classList.remove('tg-changing');node.textContent=value;if(!reduced())scope.requestAnimationFrame(()=>{if(!dead){node.classList.add('tg-changing');old.classList.add('tg-retiring');}});}
 function resize(){canvas.width=Math.round(Math.min(650,modal.clientWidth*(browser.devicePixelRatio||1)));canvas.height=Math.round(canvas.width*modal.clientHeight/modal.clientWidth);haze.width=Math.min(320,canvas.width);haze.height=Math.round(haze.width*modal.clientHeight/modal.clientWidth);if(options.open&&phase==='processing')render();}
 const hash=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q);};
 const motes=Array.from({length:240},(_,i)=>({x:hash(i+2),phase:hash(i+20),speed:.16+hash(i+600)*.13,size:.25+Math.pow(hash(i+100),3)*1.5,light:.35+hash(i+80)*.6,twinkle:2+hash(i+700)*4}));
 function drawGlow(p){
  if(!ctx||!hazeContext)return;const w=canvas.width,h=canvas.height,t=p*5.2;
  ctx.clearRect(0,0,w,h);
  const rise=smooth(.085,.20,p),sweep=smooth(.79,.92,p),base=1.19-.20*rise+.04*Math.sin(t*1.55+1.7)-1.29*sweep,breath=1+.20*Math.sin(t*2.2-.6);
  const fw=haze.width,fh=haze.height,c=hazeContext;c.clearRect(0,0,fw,fh);
  function wash(x,y,rx,ry,color,alpha){
   c.save();c.translate(x*fw,y*fh);c.scale(rx*fw,ry*fh*breath);
   const g=c.createRadialGradient(0,0,0,0,0,1.6);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.38,`rgba(${color},${alpha*.7})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(-1.6,-1.6,3.2,3.2);c.restore();
  }
  wash(.42+.04*Math.sin(t*.8),base+.025,.72,.16,[246,104,235],.72);
  wash(.34+.06*Math.sin(t*1.1),base-.035,.39,.21,[255,162,150],.40);
  wash(.13+.035*Math.cos(t*1.5),base+.07,.29,.14,[244,98,235],.62);
  wash(.84+.035*Math.sin(t*1.1),base-.10,.38,.23,[244,112,236],.48);
  wash(.88+.035*Math.sin(t*1.2),base+.025,.20,.075,[199,60,236],.83);
  wash(.51+.055*Math.sin(t*.95),base+.09,.35,.16,[248,207,68],.98);
  // Small advecting puffs break up the broad washes instead of moving a row of blobs.
  const colors=[[255,116,217],[255,170,153],[255,214,119],[232,123,241]];
  for(let i=0;i<12;i++){const life=(t*(.17+hash(i+70)*.1)+hash(i+30))%1,x=hash(i+12)+Math.sin(life*4+i)*.07,y=base+.16-life*.36;wash(x,y,.10+hash(i+22)*.11,.065+hash(i+52)*.07,colors[i%4],Math.sin(life*Math.PI)*.19);}
  ctx.save();ctx.imageSmoothingQuality='high';ctx.filter='blur(1.2px)';ctx.drawImage(haze,0,0,w,h);ctx.restore();
  const dust=smooth(.12,.30,p)*(1-smooth(.90,.96,p));
  for(let i=0;i<motes.length;i++){
   const m=motes[i],life=(t*m.speed+m.phase)%1,x=(m.x+Math.sin(t*.9+i)*.012)*w,y=(base+.22-life*.34)*h;
   const alpha=Math.sin(life*Math.PI)*m.light*(.72+.28*Math.sin(t*m.twinkle+i))*dust;
   ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,m.size*w/530,0,Math.PI*2);ctx.fill();
  }
  scene.dataset.frame=String(++paintCount);
 }
 function render(){
  const p=clamp(elapsed/options.duration),restore=1-smooth(.80,.98,p),blur=smooth(0,.09,p)*restore,veil=smooth(0,.09,p)*(1-smooth(.81,.95,p)),glow=smooth(.085,.19,p)*(1-smooth(.88,.96,p));
  modal.style.setProperty('--tg-blur',`${reduced()?0:blur*9}px`);modal.style.setProperty('--tg-actions-blur',`${reduced()?0:smooth(.04,.16,p)*(1-smooth(.76,.92,p))*9}px`);modal.style.setProperty('--tg-veil',String(reduced()?blur*.88:veil*.64));modal.style.setProperty('--tg-glow',String(reduced()?0:glow));modal.style.setProperty('--tg-status',String(smooth(.09,.18,p)*(1-smooth(.82,.89,p))));modal.style.setProperty('--tg-status-blur',`${reduced()?0:6*(1-smooth(.11,.22,p))+5*smooth(.81,.88,p)}px`);
  if(p>=.765&&modal.dataset.result!=='true')content(true);
  announce(p<.48?'Transferring money...':'Verifying recipient...');
  if(!reduced())drawGlow(p);scene.dataset.progress=p.toFixed(4);
 }
 function complete(){phase='success';stop();modal.setAttribute('aria-busy','false');scene.dataset.state=phase;modal.style.setProperty('--tg-blur','0px');modal.style.setProperty('--tg-actions-blur','0px');modal.style.setProperty('--tg-veil','0');modal.style.setProperty('--tg-glow','0');modal.style.setProperty('--tg-status','0');content(true);announce(`Money sent. Your payment to ${options.recipient} is complete`);find('.tg-send').disabled=false;find('.tg-send').focus({preventScroll:true});options.onComplete?.();}
 function tick(now){raf=0;if(dead||!options.open||!visible||owner.hidden||phase!=='processing')return;const dt=last?Math.min(now-last,64):0;last=now;elapsed+=dt;
  // High-refresh displays otherwise redraw this soft field 165+ times a second.
  if(now>=paintDue||elapsed>=options.duration){render();paintDue=Math.max(paintDue+1000/60,now);}
  if(elapsed>=options.duration)complete();else wake();
 }
 function wake(){
  if(dead||!options.open||!visible||owner.hidden||phase!=='processing')return;
  scene.dataset.running='true';
  if(reduced()){
   if(reducedTimer)return;render();const next=elapsed<options.duration*.48?options.duration*.48:options.duration;
   last=browser.performance.now();reducedTimer=scope.setTimeout(()=>{reducedTimer=0;elapsed=next;if(elapsed>=options.duration)complete();else{render();wake();}},Math.max(0,next-elapsed));
  }else if(!raf)raf=browser.requestAnimationFrame(tick);
 }
 function suspend(){if(reducedTimer&&last)elapsed=Math.min(options.duration,elapsed+browser.performance.now()-last);stop();}
 function reset(){stop();phase='confirm';elapsed=0;scene.dataset.state=phase;scene.dataset.progress='0.0000';announcement='';find('.tg-status-text').textContent='';find('.tg-status-old').textContent='';for(const prop of['--tg-blur','--tg-actions-blur','--tg-veil','--tg-glow','--tg-status','--tg-status-blur'])modal.style.removeProperty(prop);content();modal.setAttribute('aria-busy','false');find('.tg-send').disabled=false;find('.tg-cancel').disabled=false;ctx?.clearRect(0,0,canvas.width,canvas.height);}
 function setOpen(open,notify=false){
  const changed=options.open!==open;options.open=open;scene.dataset.open=String(open);wrap.hidden=!open;dashboard.inert=open;
  if(open){reset();returnFocus=root.activeElement;resize();find('.tg-send').focus({preventScroll:true});}else{stop();(returnFocus?.isConnected?returnFocus:find('.tg-launch')).focus({preventScroll:true});}
  if(changed&&notify)options.onOpenChange?.(open);
 }
 function start(){if(phase!=='confirm')return;phase='processing';elapsed=0;paintDue=0;scene.dataset.state=phase;modal.setAttribute('aria-busy','true');find('.tg-send').disabled=true;find('.tg-cancel').disabled=true;find('.tg-close').focus({preventScroll:true});render();wake();}
 on(find('.tg-send'),'click',()=>phase==='success'?setOpen(false,true):start());on(find('.tg-cancel'),'click',()=>setOpen(false,true));on(find('.tg-close'),'click',()=>setOpen(false,true));on(find('.tg-launch'),'click',()=>setOpen(true,true));on(find('.tg-convert-trigger'),'click',()=>setOpen(true,true));
 on(modal,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false,true);}if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button')].filter(n=>!n.disabled&&!n.hidden),first=buttons[0],lastButton=buttons.at(-1),active=root.activeElement;if(event.shiftKey&&active===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&active===lastButton){event.preventDefault();first.focus();}}});
 on(owner,'keydown',event=>{if(event.key==='Tab')scene.dataset.keyboard='true';});on(scene,'pointerdown',()=>{scene.dataset.keyboard='false';});
 on(owner,'visibilitychange',()=>owner.hidden?suspend():wake());
 const observer=new browser.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else suspend();});observer.observe(scope.element);
 const ro=new browser.ResizeObserver(resize);ro.observe(modal);
 on(media,'change',()=>{scene.dataset.reduced=String(reduced());suspend();wake();});
 normalize();scene.dataset.reduced=String(reduced());setOpen(options.open);scope.ready();scene.dataset.ready='true';
 return {...scope.controller,update(next){if(dead)return;const wasOpen=options.open;options={...options,...next};normalize();scope.controller.update(next);scene.dataset.reduced=String(reduced());if('open'in next&&wasOpen!==options.open)setOpen(options.open);else{content(phase==='success'||modal.dataset.result==='true');suspend();wake();}},destroy(){if(dead)return;dead=true;stop();observer.disconnect();ro.disconnect();canvas.width=canvas.height=haze.width=haze.height=0;scope.controller.destroy();}};
}
