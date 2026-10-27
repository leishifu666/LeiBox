import gsap from 'gsap';
import { createSurface } from './motion-runtime';
import { OTP_MOTION as M, OTP_REPLAY } from '../OtpVerification/otp-motion';

/** Native input and the reference state chain, shared by every framework. */
export function createOtpVerification(target, initialOptions, css, icons) {
  let options={...initialOptions},phase='idle',code='',active=0,focused=false,attempt=0,replayStarted=0;
  let timeline, verifyTimer, errorTimer;
  const replayTimers=[];
  const markup=`<div class="leibox-otp otp-stage notranslate" translate="no" lang="en" data-state="idle"><div class="otp-scale"><div class="otp-shell"><div class="otp-fill"></div>
    <button class="otp-label otp-idle" type="button" aria-label="Enter verification code">${icons.lock}<span>Enter code</span></button>
    <div class="otp-cells" role="group" aria-label="Six digit verification code">${Array.from({length:6},()=>'<div class="otp-cell" aria-hidden="true"><span class="otp-number"></span></div>').join('')}
      <div class="otp-focus" aria-hidden="true"><span class="otp-caret"></span></div><input class="otp-native" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" aria-label="Six digit verification code" aria-describedby="otp-status"></div>
    <div class="otp-label otp-verifying" aria-hidden="true">${icons.loader}<span>Verifying</span></div><button class="otp-label otp-success" type="button" aria-label="Verified. Start again">${icons.check}<span>Verified</span></button></div></div>
    <span id="otp-status" class="otp-sr-only" role="status" aria-live="polite"></span></div>`;
  const scope=createSurface(target,{markup,css,width:420,height:510,responsive:true},options);
  const q=s=>scope.root.querySelector(s),qa=s=>[...scope.root.querySelectorAll(s)];
  const stage=q('.otp-stage'),shell=q('.otp-shell'),input=q('.otp-native'),trigger=q('.otp-idle'),success=q('.otp-success'),cells=q('.otp-cells'),ring=q('.otp-focus');
  const context=gsap.context(()=>{},scope.body),animate=callback=>context.add(callback);
  function focusRing(){
    q('.otp-caret').style.visibility=(focused||options.autoPlay)&&!code[active]&&phase==='input'?'visible':'hidden';
    animate(()=>gsap.to(ring,{x:active*61,borderRadius:active===0?'29px 17px 17px 29px':active===5?'17px 29px 29px 17px':'17px',duration:scope.reduced()?0:M.focusDuration,ease:'power3.out',overwrite:true}));
  }
  function renderCode(){qa('.otp-number').forEach((n,i)=>n.textContent=code[i]||'');input.value=code;focusRing();}
  function setPhase(next){
    scope.clearTimeout(verifyTimer);scope.clearTimeout(errorTimer);timeline?.kill();phase=next;stage.dataset.state=phase;
    const editing=phase==='input';cells.inert=!editing||Boolean(options.autoPlay);input.readOnly=!editing||Boolean(options.autoPlay);input.tabIndex=editing&&!options.autoPlay?0:-1;
    trigger.inert=phase!=='idle';trigger.tabIndex=phase==='idle'?0:-1;trigger.disabled=Boolean(options.autoPlay);success.inert=phase!=='success';success.tabIndex=phase==='success'?0:-1;success.disabled=Boolean(options.autoPlay);
    input.setAttribute('aria-invalid',String(phase==='error'));
    q('[role="status"]').textContent=phase==='verifying'?'Verifying code':phase==='error'?'Incorrect code. Please try again. Demo code: 123456.':phase==='success'?'Code verified':'';
    const d=v=>scope.reduced()?0:v;
    animate(()=>{
      const labels=qa('.otp-label'),digits=qa('.otp-number'),cell=qa('.otp-cell');
      const tl=gsap.timeline();timeline=tl;
      tl.set(q('.otp-spinner'),{rotation:0});
      if(phase==='idle'){
        tl.set(shell,{width:M.compactWidth,x:0,scale:1}).set(labels,{autoAlpha:0,filter:'blur(0px)',scale:1}).set(trigger,{autoAlpha:1}).set(cells,{autoAlpha:0}).set(q('.otp-fill'),{backgroundColor:'#ecebe4',opacity:1}).set(ring,{autoAlpha:0});
      }else if(phase==='input'){
        tl.to(labels,{autoAlpha:0,filter:'blur(5px)',scale:.84,duration:d(.16)},0).to(shell,{width:M.expandedWidth,x:0,scale:1,duration:d(M.openDuration),ease:M.ease},0)
          .to(q('.otp-fill'),{backgroundColor:'#ecebe4',opacity:0,duration:d(.15)},0).set(cell,{backgroundColor:'#ecebe4',color:'#22221d'},0).set(digits,{opacity:1,y:0,filter:'blur(0px)'},0)
          .fromTo(cells,{autoAlpha:0,scaleX:.76,filter:'blur(5px)'},{autoAlpha:1,scaleX:1,filter:'blur(0px)',duration:d(.32),ease:'power3.out'},d(.1)).set(ring,{autoAlpha:1},d(.18))
          .call(()=>{if(!options.autoPlay)input.focus({preventScroll:true});},[],d(.18));
      }else if(phase==='verifying'){
        tl.set(ring,{autoAlpha:0}).to(digits,{y:-6,opacity:0,filter:'blur(5px)',duration:d(.16),stagger:d(.012)},0).to(cells,{autoAlpha:0,scaleX:.45,filter:'blur(7px)',duration:d(.26),ease:'power2.inOut'},d(.04))
          .to(shell,{width:116,duration:d(.22),ease:'power2.in'},0).to(shell,{width:M.compactWidth,duration:d(M.collapseDuration),ease:M.ease},d(.2)).to(q('.otp-fill'),{opacity:1,duration:d(.15)},d(.22))
          .fromTo(q('.otp-verifying'),{autoAlpha:0,scale:.8,filter:'blur(5px)'},{autoAlpha:1,scale:1,filter:'blur(0px)',duration:d(.22)},d(.32));
        if(!scope.reduced())tl.to(q('.otp-spinner'),{rotation:360,duration:.75,ease:'none',repeat:-1},.3);
      }else if(phase==='error'){
        tl.to(labels,{autoAlpha:0,duration:d(.1)},0).set(cell,{backgroundColor:'#fae3e4',color:'#d32e4d'},0).to(q('.otp-fill'),{opacity:0,duration:d(.15)},0).set(digits,{y:0,opacity:1,filter:'blur(0px)'},0)
          .to(shell,{width:M.expandedWidth,duration:d(.38),ease:M.ease},0).to(cells,{autoAlpha:1,scaleX:1,filter:'blur(0px)',duration:d(.24)},d(.06));
        if(!scope.reduced())tl.to(shell,{keyframes:[{x:-8},{x:8},{x:-5},{x:3},{x:0}],duration:.3,ease:'power1.inOut'},.15);
        tl.to(digits,{opacity:0,y:6,filter:'blur(3px)',duration:d(.18),stagger:d(.02)},d(.38));
      }else{
        tl.to(q('.otp-verifying'),{autoAlpha:0,filter:'blur(4px)',scale:.9,duration:d(.14)},0).to(shell,{width:M.verifiedWidth,duration:d(.42),ease:M.ease},0).to(q('.otp-fill'),{backgroundColor:'#26bc4e',duration:d(.25)},0)
          .fromTo(success,{autoAlpha:0,filter:'blur(4px)',scale:.9},{autoAlpha:1,filter:'blur(0px)',scale:1,duration:d(.25)},d(.08)).call(()=>{if(!options.autoPlay)success.focus({preventScroll:true});});
      }
    });
    focusRing();
    if(phase==='verifying')verifyTimer=scope.setTimeout(()=>setPhase(code==='123456'?'success':'error'),M.verifyDelay);
    if(phase==='error')errorTimer=scope.setTimeout(()=>{code='';active=0;renderCode();setPhase('input');},M.errorDuration);
    if(options.autoPlay&&phase==='input'){
      const currentAttempt=attempt++,sequence=currentAttempt===0?OTP_REPLAY.slice(0,6):OTP_REPLAY.slice(6),lead=currentAttempt===0?750:370;
      sequence.forEach(([time,value])=>replayTimers.push(scope.setTimeout(()=>changeCode(value),lead+time-sequence[0][0])));
    }
    if(options.autoPlay&&phase==='success')replayTimers.push(scope.setTimeout(()=>options.onReplayComplete?.(),Math.max(0,8883-(performance.now()-replayStarted))));
  }
  function changeCode(raw){code=raw.replace(/\D/g,'').slice(0,6);active=Math.min(code.length,5);renderCode();if(code.length===6){focused=false;setPhase('verifying');}else if(code)animate(()=>gsap.fromTo(qa('.otp-number')[code.length-1],{y:7,opacity:0,filter:'blur(3px)'},{y:0,opacity:1,filter:'blur(0px)',duration:scope.reduced()?0:.18,overwrite:true}));}
  function reset(){replayTimers.splice(0).forEach(scope.clearTimeout);code='';active=0;focused=false;renderCode();setPhase('idle');if(!options.autoPlay)trigger.focus({preventScroll:true});}
  function startReplay(){reset();attempt=0;replayStarted=performance.now();replayTimers.push(scope.setTimeout(()=>setPhase('input'),250));}
  scope.on(trigger,'click',()=>setPhase('input'));scope.on(success,'click',reset);
  scope.on(input,'input',()=>changeCode(input.value));scope.on(input,'paste',event=>{event.preventDefault();changeCode(event.clipboardData.getData('text'));});
  scope.on(input,'focus',()=>{focused=true;focusRing();});scope.on(input,'blur',()=>{focused=false;focusRing();});
  scope.on(input,'select',()=>{active=Math.min(input.selectionStart??code.length,5);focusRing();});
  scope.on(input,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();reset();}});
  scope.on(input,'pointerup',event=>{const rect=input.getBoundingClientRect();const i=Math.min(Math.floor((event.clientX-rect.left)/(rect.width/6)),code.length,5);input.setSelectionRange(i,Math.min(i+1,code.length));active=i;focusRing();});
  scope.addCleanup(()=>{timeline?.kill();context.revert();});
  setPhase('idle');if(options.autoPlay)startReplay();
  return {...scope.controller,update(next){const replayChanged=next.autoPlay!==undefined&&next.autoPlay!==options.autoPlay;options={...options,...next};scope.controller.update(next);if(replayChanged){if(options.autoPlay)startReplay();else reset();}}};
}
