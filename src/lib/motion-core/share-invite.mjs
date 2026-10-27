import gsap from 'gsap';
import { createSurface } from './motion-runtime';
import { SHARE_MOTION as M, springEase } from '../ShareInvite/share-motion';

/** The six adapters share this state machine, DOM, font and motion parameters. */
export function createShareInvite(target, options, css, icons, translations = {}) {
  let settings={...options};
  const initial = [
    {name:'Ava Chen',initials:'AC',role:'Owner',tone:'sand'},
    {name:'Marco Rossi',initials:'MR',role:'Editor',tone:'sage'},
    {name:'Lena Park',initials:'LP',role:'Viewer',tone:'lilac'},
  ];
  const icon = name => icons[name];
  const markup = `<div class="leibox-share notranslate share-stage" translate="no">
    <div class="share-shell" data-open="true">
      <div class="share-compact"><div class="avatar-stack"></div></div>
      <button type="button" class="title-pill share-morph" aria-expanded="true" aria-controls="share-panel">${icon('share')}<span class="share-title">Share “Q4 Plan”</span></button>
      <div class="share-panel" id="share-panel">
        <header class="share-header" data-reveal><div class="title-slot"></div><button type="button" class="share-button close-button" aria-label="Close share panel">${icon('x')}</button></header>
        <form class="invite-form" novalidate><div class="invite-field" data-reveal>${icon('mail')}
          <input class="email-input" type="email" placeholder="Add people by email" aria-label="Add people by email" autocomplete="off" spellcheck="false">
          <button type="button" class="role-trigger" aria-label="Invitation role" aria-haspopup="listbox" aria-expanded="false"><span>Editor</span>${icon('chevrons')}</button>
        </div><div class="recipient-chips" aria-label="Pending invitations"></div><p class="invite-error" role="alert" hidden></p></form>
        <section class="people-section" data-reveal><h2>People with access</h2><ul class="people-list"></ul></section>
        <footer class="share-actions" data-reveal><button type="button" class="share-button copy-button">${icon('link')}<span>Copy link</span></button><button type="button" class="share-button send-button" data-state="idle" disabled>${icon('send')}<span>Send invite</span></button></footer>
      </div>
    </div><button type="button" class="demo-signature" aria-label="Collapse share panel"><span>close</span><span>⟶</span><span>{}</span></button>
    <div class="role-positioner" style="position:absolute;z-index:100" hidden><div class="role-menu" role="listbox" aria-label="Invitation role"><button type="button" class="role-option" role="option" data-role="Editor" aria-selected="true">Editor</button><button type="button" class="role-option" role="option" data-role="Viewer" aria-selected="false">Viewer</button></div></div>
    <p class="sr-only" role="status" aria-live="polite"></p>
  </div>`;
  css+='\n.leibox-share .role-option{display:block;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left}.leibox-share .role-option:focus{background:var(--share-fill)}';
  const scope = createSurface(target, {markup, css, width:332, height:500, responsive:true}, options);
  const reverse=Object.fromEntries(Object.entries(translations).map(([en,zh])=>[zh,en]));
  function translate(){
    const walker=target.ownerDocument.createTreeWalker(scope.root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){const english=reverse[node.textContent]??node.textContent;const value=settings.locale==='zh'?(translations[english]??english):english;if(node.textContent!==value)node.textContent=value;}
    scope.root.querySelectorAll('[aria-label], [placeholder]').forEach(element=>{for(const attr of ['aria-label','placeholder']){const current=element.getAttribute(attr);if(!current)continue;const english=reverse[current]??current;const value=settings.locale==='zh'?(translations[english]??english):english;if(current!==value)element.setAttribute(attr,value);}});
  }
  const translationObserver=new MutationObserver(translate);
  translationObserver.observe(scope.root,{subtree:true,childList:true,characterData:true});
  scope.addCleanup(()=>translationObserver.disconnect());
  const q = selector => scope.root.querySelector(selector);
  const qa = selector => [...scope.root.querySelectorAll(selector)];
  const stage=q('.share-stage'), shell=q('.share-shell'), panel=q('.share-panel'), morph=q('.share-morph'), compact=q('.share-compact'), input=q('.email-input');
  const error=q('.invite-error'), chips=q('.recipient-chips'), send=q('.send-button'), status=q('[role="status"]'), roleButton=q('.role-trigger'), menu=q('.role-positioner');
  let people=[...initial], recipients=[], role='Editor', open=true, sending=false, sent=false, transition, transfer;
  const valid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const escape = value => value.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const context=gsap.context(()=>{},scope.body);
  const animate=callback=>context.add(callback);
  function member(person) { return `<li class="person-row" data-email="${escape(person.email||'')}"><span class="avatar avatar-${person.tone}" aria-hidden="true">${escape(person.initials)}</span><span class="person-name">${escape(person.name)}</span><span class="person-role">${person.role}</span></li>`; }
  function renderPeople() {
    q('.people-list').innerHTML=people.map(member).join('');
    q('.avatar-stack').innerHTML=people.slice(0,3).map(p=>`<span class="avatar avatar-${p.tone}">${p.initials}</span>`).join('')+(people.length>3?`<span class="avatar avatar-extra">+${people.length-3}</span>`:'');
  }
  function size(initial=false, changed=false) {
    const width=Math.max(240,Math.min(320,stage.clientWidth-12));
    stage.style.setProperty('--share-width',`${width}px`);
    const height=open?panel.offsetHeight+2:56;
    const button={left:open?8:96,top:open?8:5,width:open?width-74:99,height:open?48:44,paddingLeft:open?16:15,gap:open?10:8,fontSize:open?16:14,fontWeight:open?600:500,color:open?'#23231f':'#fff',backgroundColor:open?'#ecebe4':'#20211d'};
    panel.inert=!open; panel.setAttribute('aria-hidden',String(!open)); compact.inert=open;
    morph.setAttribute('aria-expanded',String(open)); shell.dataset.open=String(open);
    q('.share-title').textContent=open?'Share “Q4 Plan”':'Share';
    q('.demo-signature').setAttribute('aria-label',open?'Collapse share panel':'Expand share panel');
    q('.demo-signature span').textContent=open?'close':'open';
    animate(()=>{
      if(initial||scope.reduced()) {
        transition?.kill(); gsap.killTweensOf([shell,morph,compact,panel,...qa('[data-reveal]')]);gsap.set(shell,{width:open?width:200,height,borderRadius:open?32:30});gsap.set(morph,button);
        gsap.set(compact,{autoAlpha:open?0:1,scale:1});gsap.set(panel,{autoAlpha:open?1:0,filter:'blur(0px)'});gsap.set(qa('[data-reveal]'),{opacity:1,y:0,filter:'blur(0px)'});return;
      }
      if(!changed){gsap.set(shell,{width:open?width:200});gsap.set(morph,button);gsap.to(shell,{height,duration:M.resize.duration,ease:springEase(M.resize.stiffness,M.resize.damping,M.resize.duration),overwrite:'auto'});return;}
      transition?.kill(); gsap.killTweensOf(shell);const motion=open?M.open:M.close; const tl=gsap.timeline(); transition=tl;
      tl.to(shell,{width:open?width:200,duration:motion.width.duration,ease:springEase(motion.width.stiffness,motion.width.damping,motion.width.duration)},motion.width.delay)
        .to(shell,{height,duration:motion.height.duration,ease:springEase(motion.height.stiffness,motion.height.damping,motion.height.duration)},motion.height.delay)
        .to(shell,{borderRadius:open?32:30,duration:.22},0)
        .to(morph,{...button,duration:motion.width.duration,ease:springEase(motion.width.stiffness,motion.width.damping,motion.width.duration)},motion.width.delay)
        .to(compact,{autoAlpha:open?0:1,duration:.14},open?0:.35)
        .to(panel,{autoAlpha:open?1:0,filter:open?'blur(0px)':'blur(5px)',duration:open?.24:.18},open?.12:0);
      if(open)tl.fromTo(qa('[data-reveal]'),{opacity:0,y:10,filter:'blur(3px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.5,stagger:.035,ease:springEase(280,24,.5)},.13);
    });
  }
  function setOpen(value) { const hadFocus=scope.root.activeElement&&shell.contains(scope.root.activeElement);open=value;menu.hidden=true;size(false,true);if(hadFocus)(open?q('.close-button'):morph).focus({preventScroll:true}); }
  function setError(message='') {error.textContent=message;error.hidden=!message;input.setAttribute('aria-invalid',String(Boolean(message)));size();}
  function renderChips(){chips.innerHTML=recipients.map(r=>`<div class="recipient-chip" data-email="${escape(r.email)}"><span class="avatar avatar-wheat chip-avatar">${r.email[0].toUpperCase()}${r.email.split('@')[1][0].toUpperCase()}</span><span class="chip-email">${escape(r.email)}</span><button class="share-button chip-remove" type="button" aria-label="Remove ${escape(r.email)}" data-remove="${escape(r.email)}">${icon('x')}</button></div>`).join('');chips.hidden=!recipients.length;size();}
  function syncSend(){send.disabled=sending||sent||!(recipients.length||valid(input.value.trim()));input.disabled=sending;roleButton.disabled=sending;}
  function stageEmail(values){
    const list=values.map(v=>v.trim().toLowerCase()).filter(Boolean);if(!list.length)return true;
    if(!list.every(valid)){setError('Enter a valid email address');return false;}
    const unique=[...new Set(list)].filter(email=>!people.some(p=>p.email===email)&&!recipients.some(r=>r.email===email));
    if(!unique.length){setError('This person already has access or is in your invite list');return false;}
    recipients.push(...unique.map(email=>({email,role})));input.value='';setError();renderChips();syncSend();
    animate(()=>gsap.fromTo(qa('.recipient-chip'),{opacity:0,y:-5,scale:.96},{opacity:1,y:0,scale:1,duration:scope.reduced()?0:.42,ease:springEase(360,24,.42)}));return true;
  }
  function invite(){
    if(sending||sent||!stageEmail([input.value])||!recipients.length)return;
    sending=true;syncSend();send.dataset.state='sending';send.innerHTML=icon('loader')+'<span>Sending</span>';
    if(!scope.reduced())animate(()=>gsap.to(send.querySelector('svg'),{rotation:360,duration:.8,repeat:-1,ease:'none'}));
    scope.setTimeout(()=>{
      const origin=stage.getBoundingClientRect();
      const moving=qa('.recipient-chip').map(chip=>{const rect=chip.getBoundingClientRect(),clone=chip.cloneNode(true);clone.classList.add('share-transfer');clone.inert=true;clone.setAttribute('aria-hidden','true');Object.assign(clone.style,{left:`${rect.left-origin.left}px`,top:`${rect.top-origin.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});stage.appendChild(clone);return {email:chip.dataset.email,clone};});
      const start=people.length;
      people.push(...recipients.map(r=>{const words=r.email.split('@')[0].split(/[._+-]+/).filter(Boolean);return {email:r.email,role:r.role,tone:'wheat',name:words.map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),initials:(words.length>1?words.slice(0,2).map(w=>w[0]).join(''):r.email.slice(0,2)).toUpperCase()};}));
      recipients=[];renderPeople();renderChips();sending=false;sent=true;send.dataset.state='sent';send.innerHTML=icon('check')+'<span>Invite sent</span>';status.textContent='Invitations added to this preview';syncSend();
      animate(()=>{
        transfer?.kill();transfer=gsap.timeline({onInterrupt:()=>moving.forEach(m=>m.clone.remove())});
        for(const {email,clone} of moving){const row=qa('.person-row').find(n=>n.dataset.email===email);if(!row||scope.reduced()){clone.remove();continue;}const rect=row.querySelector('.avatar').getBoundingClientRect();transfer.to(clone,{left:rect.left-origin.left,top:rect.top-origin.top,width:32,height:32,padding:0,borderRadius:16,duration:.6,ease:springEase(300,24,.6),onComplete:()=>clone.remove()},0).to(clone.querySelectorAll('.chip-email,.chip-remove'),{opacity:0,duration:.15},0).to(clone.querySelector('.chip-avatar'),{width:32,height:32,fontSize:11,duration:.4},0);}
        gsap.fromTo(qa('.person-row').slice(start),{opacity:0,y:-10,filter:'blur(4px)'},{opacity:1,y:0,filter:'blur(0px)',duration:scope.reduced()?0:.54,delay:scope.reduced()?0:.2,stagger:.05,ease:springEase(300,24,.54)});
      });
      scope.setTimeout(()=>{sent=false;send.dataset.state='idle';send.innerHTML=icon('send')+'<span>Send invite</span>';syncSend();},1500);
    },1050);
  }
  scope.on(morph,'click',()=>setOpen(!open));scope.on(q('.close-button'),'click',()=>setOpen(false));scope.on(q('.demo-signature'),'click',()=>setOpen(!open));
  scope.on(q('.invite-form'),'submit',event=>{event.preventDefault();if(!sending)stageEmail([input.value]);});
  scope.on(input,'input',()=>{sent=false;setError();syncSend();});
  scope.on(input,'keydown',event=>{if(['Enter',',',';'].includes(event.key)){event.preventDefault();stageEmail([input.value]);}});
  scope.on(input,'paste',event=>{const values=event.clipboardData.getData('text').split(/[\s,;]+/).filter(Boolean);if(values.length>1){event.preventDefault();stageEmail(values);}});
  scope.on(stage,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();if(!menu.hidden){menu.hidden=true;roleButton.setAttribute('aria-expanded','false');roleButton.focus();}else setOpen(false);}});
  scope.on(chips,'click',event=>{const button=event.target.closest('[data-remove]');if(button&&!sending){recipients=recipients.filter(r=>r.email!==button.dataset.remove);renderChips();syncSend();}});
  const showMenu=()=>{menu.hidden=!menu.hidden;roleButton.setAttribute('aria-expanded',String(!menu.hidden));const rect=roleButton.getBoundingClientRect(),s=stage.getBoundingClientRect();menu.style.left=`${rect.right-s.left-116}px`;menu.style.top=`${rect.bottom-s.top+6}px`;if(!menu.hidden)q(`[data-role="${role}"]`).focus();};
  scope.on(roleButton,'click',showMenu);scope.on(roleButton,'keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(menu.hidden)showMenu();}});
  scope.on(roleButton,'pointerdown',()=>{if(!scope.reduced())animate(()=>gsap.to(roleButton,{scale:.97,duration:.12,ease:'power2.out'}));});
  scope.on(scope.window,'pointerup',()=>{if(!scope.reduced())animate(()=>gsap.to(roleButton,{scale:1,duration:.42,ease:springEase(420,24,.42)}));});
  scope.on(menu,'keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();const choices=qa('[data-role]');choices[(choices.indexOf(scope.root.activeElement)+1)%choices.length].focus();}});
  scope.on(menu,'click',event=>{const choice=event.target.closest('[data-role]');if(!choice)return;role=choice.dataset.role;roleButton.querySelector('span').textContent=role;qa('[data-role]').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.role===role)));menu.hidden=true;roleButton.setAttribute('aria-expanded','false');roleButton.focus();});
  scope.on(scope.document,'pointerdown',event=>{if(!event.composedPath().includes(menu)&&!event.composedPath().includes(roleButton)){menu.hidden=true;roleButton.setAttribute('aria-expanded','false');}});
  scope.on(send,'click',invite);
  scope.on(q('.copy-button'),'click',async()=>{const button=q('.copy-button');try{const url=new URL(target.ownerDocument.defaultView.location.href);url.search='';url.hash='q4-plan';await navigator.clipboard.writeText(url.href);button.innerHTML=icon('check')+'<span>Copied</span>';status.textContent='Link copied to clipboard';}catch{button.innerHTML=icon('link')+'<span>Try again</span>';status.textContent='Clipboard unavailable. Allow clipboard access and try again.';}scope.setTimeout(()=>button.innerHTML=icon('link')+'<span>Copy link</span>',1800);});
  renderPeople();chips.hidden=true;size(true);
  let lastWidth=stage.clientWidth;
  const resize=new scope.ResizeObserver(()=>{if(stage.clientWidth!==lastWidth){lastWidth=stage.clientWidth;size(true);}});resize.observe(stage);
  scope.addCleanup(()=>{context.revert();transition?.kill();transfer?.kill();});
  translate();
  return {...scope.controller,update(next){settings={...settings,...next};scope.controller.update(next);translate();size(true);}};
}
