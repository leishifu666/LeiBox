(() => {
  const root=document.querySelector('.st-demo'),scroll=root.querySelector('.st-scroll');
  const shell=root.querySelector('.st-nav-shell'),links=root.querySelector('.st-links');
  const buttons=[...root.querySelectorAll('.st-link')],sections=[...root.querySelectorAll('.st-section')];
  const ship=root.querySelector('.st-ship'),route=root.querySelector('.st-route'),ripples=[...root.querySelectorAll('.st-wake ellipse')];
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const nativeScope=typeof scope!=='undefined'&&typeof scope.addCleanup==='function'?scope:null;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const reduced=()=>media.matches;
  let active=3,y=260,target=260,velocity=0,roll=0,yaw=0,phase=0,scrollSpeed=0,previousScroll=0,frame=0,last=0,navigation=null,alive=true,visible=true,ready=false;
  // Layout readiness must run even when the animation scheduler respects reduced motion.
  const layoutWindow=root.ownerDocument.defaultView,layoutFrames=new Set();
  function layoutFrame(callback){const id=layoutWindow.requestAnimationFrame(()=>{layoutFrames.delete(id);if(alive)callback();});layoutFrames.add(id);}
  function draw(){
    const center=clamp(y+(reduced()?0:Math.sin(phase*2.2)*.85),112,759);
    route.setAttribute('d',`M22 58L22 ${center-54}C22 ${center-30} 48 ${center-30} 48 ${center}C48 ${center+30} 22 ${center+30} 22 ${center+54}L22 813`);
    ship.style.transform=`translateY(${center-32}px) perspective(300px) rotateY(${yaw}deg) rotateZ(${roll}deg)`;
    ripples.forEach((ripple,index)=>{
      const progress=(phase/2.4+index/2)%1;
      ripple.setAttribute('rx',String(24+progress*42));ripple.setAttribute('ry',String(6+progress*13));
      ripple.style.opacity=String(reduced()?0:Math.sin(progress*Math.PI)**2*.24);
    });
  }
  function select(index,snap=false){
    active=clamp(index,0,buttons.length-1);root.dataset.active=String(active);
    buttons.forEach((button,i)=>{button.classList.toggle('is-active',i===active);if(i===active)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
    target=clamp(links.offsetTop+buttons[active].offsetTop+buttons[active].offsetHeight/2,112,759);
    if(snap||reduced()){y=target;velocity=roll=yaw=0;root.dataset.moving=String(Boolean(navigation));draw();}
    else schedule();
  }
  function pick(){
    if(!ready||navigation)return;
    let next=0;
    const anchor=scroll.scrollTop+180;
    for(let i=0;i<sections.length;i++)if(sections[i].offsetTop<=anchor)next=i;
    if(scroll.scrollTop>=scroll.scrollHeight-scroll.clientHeight-2)next=sections.length-1;
    if(next!==active)select(next);
  }
  function schedule(){if(alive&&ready&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  function tick(now){
    frame=0;if(!alive||!visible||document.hidden){last=0;return;}
    const dt=Math.min(.032,(now-(last||now))/1000);last=now;
    if(navigation){
      navigation.elapsed+=dt;
      const p=clamp(navigation.elapsed/navigation.duration,0,1),ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      scroll.scrollTop=navigation.from+(navigation.to-navigation.from)*ease;
      if(p===1){navigation=null;root.dataset.navigating='false';}
    }
    if(reduced()){y=target;velocity=roll=yaw=0;}
    else{
      phase+=dt;
      // Read the actual scroll delta on every frame: a long section must still steer the boat.
      const speed=dt>0?clamp((scroll.scrollTop-previousScroll)/dt,-16000,16000):0;
      scrollSpeed+=(speed-scrollSpeed)*(1-Math.exp(-dt*10));
      velocity+=(180*(target-y)-24*velocity)*dt;y+=velocity*dt;
      const smooth=1-Math.exp(-dt*12);
      roll+=(clamp(velocity*.035+scrollSpeed*.012,-20,20)+Math.sin(phase*1.8)*1.4-roll)*smooth;
      yaw+=(clamp(velocity*.05+scrollSpeed*.06,-48,48)+Math.sin(phase*.9)*3-yaw)*smooth;
      if(Math.abs(target-y)<.1&&Math.abs(velocity)<.2){y=target;velocity=0;}
    }
    previousScroll=scroll.scrollTop;
    draw();
    const moving=Boolean(navigation)||Math.abs(target-y)>.1||Math.abs(velocity)>.2;
    root.dataset.moving=String(moving);
    // Navigation can settle while the visible ship keeps its gentle water motion.
    if(moving||!reduced())schedule();else{last=0;roll=yaw=0;draw();}
  }
  function navigate(index){
    const from=scroll.scrollTop,to=clamp(sections[index].offsetTop-92,0,scroll.scrollHeight-scroll.clientHeight);
    if(reduced()){navigation=null;scroll.scrollTop=to;select(index,true);root.dataset.navigating='false';return;}
    navigation={from,to,elapsed:0,duration:clamp(.65+Math.abs(to-from)/4200,.65,1.45)};
    root.dataset.navigating='true';root.dataset.moving='true';select(index);schedule();
  }
  function interrupt(){navigation=null;root.dataset.navigating='false';pick();}
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>navigate(index));
    button.addEventListener('keydown',event=>{
      let next=index;
      if(event.key==='ArrowDown')next=Math.min(buttons.length-1,index+1);
      else if(event.key==='ArrowUp')next=Math.max(0,index-1);
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=buttons.length-1;
      else return;
      event.preventDefault();buttons[next].focus({preventScroll:true});
    });
  });
  scroll.addEventListener('scroll',pick,{passive:true});
  scroll.addEventListener('wheel',interrupt,{passive:true});
  scroll.addEventListener('touchstart',interrupt,{passive:true});
  scroll.addEventListener('keydown',event=>{if(event.target===scroll)interrupt();});
  function resize(){shell.style.transform=`scale(${Math.min(1,scroll.clientHeight/918)})`;if(ready)select(active,true);}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=0;previousScroll=scroll.scrollTop;if(visible&&!reduced())schedule();else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(root);
  document.addEventListener('visibilitychange',()=>{last=0;previousScroll=scroll.scrollTop;if(!document.hidden&&!reduced())schedule();else{cancelAnimationFrame(frame);frame=0;}});
  function motionPreference(){previousScroll=scroll.scrollTop;scrollSpeed=0;if(reduced()){if(navigation)scroll.scrollTop=navigation.to;navigation=null;cancelAnimationFrame(frame);frame=0;last=0;root.dataset.navigating='false';select(active,true);}else schedule();}
  media.addEventListener('change',motionPreference);
  let optionsObserver;
  if(nativeScope){optionsObserver=new MutationObserver(motionPreference);optionsObserver.observe(root.getRootNode().host,{attributes:true,attributeFilter:['data-reduced-motion']});}
  else{
    const fit=()=>{const scale=Math.min(1,window.innerWidth/1200);root.style.transform=`scale(${scale})`;root.style.transformOrigin='top left';document.body.style.height=`${918*scale}px`;};
    window.addEventListener('resize',fit);fit();
  }
  const cleanup=()=>{alive=false;cancelAnimationFrame(frame);layoutFrames.forEach(id=>layoutWindow.cancelAnimationFrame(id));layoutFrames.clear();resizeObserver.disconnect();intersection.disconnect();optionsObserver?.disconnect();media.removeEventListener('change',motionPreference);};
  nativeScope?.addCleanup(cleanup);window.addEventListener('pagehide',cleanup);
  Promise.resolve(document.fonts.load('16px SailingInter')).catch(()=>{}).then(()=>{if(alive)layoutFrame(()=>layoutFrame(()=>{
    if(!alive)return;
    resize();scroll.scrollTop=Math.max(0,sections[3].offsetTop-92);ready=true;select(3,true);
    previousScroll=scroll.scrollTop;
    root.dataset.ready='true';root.dataset.moving='false';document.body.dataset.motionReady='true';if(!reduced())schedule();
  }));});
})();
