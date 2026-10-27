// Included in the standalone HTML and the shared six-framework engine.
const recipeOf=art=>typeof art==='string'?ART_PRESETS[art]:art;
const artCache=new Map();
const paintQueue=[];
let painting=false,backsReady=0;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function paint(recipe,seed,w,h,priority=0){
  const key=JSON.stringify([recipe,seed,w,h]);
  if(artCache.has(key))return artCache.get(key);
  const promise=new Promise(done=>{
    let at=paintQueue.length;while(at>1&&paintQueue[at-1].priority>priority)at--;
    paintQueue.splice(at,0,{job:createArtJob(w,h,recipe,seed),priority,done});
    if(painting)return;painting=true;
    function tick(){
      const until=performance.now()+7;
      while(paintQueue.length&&performance.now()<until){
        const head=paintQueue[0];if(!head.job.step(4))continue;
        paintQueue.shift();const c=document.createElement('canvas');c.width=head.job.width;c.height=head.job.height;
        c.getContext('2d').putImageData(new ImageData(head.job.pixels,c.width,c.height),0,0);head.done(c);
      }
      if(paintQueue.length){if(reduceMotion())setTimeout(tick,0);else requestAnimationFrame(tick);}else painting=false;
    }
    if(reduceMotion())setTimeout(tick,0);else requestAnimationFrame(tick);
  });
  artCache.set(key,promise);return promise;
}
function artCanvas(className,art,seed,w,h,priority){
  const canvas=document.createElement('canvas');canvas.className=className;canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText=`width:${w}px;height:${h}px;max-width:none`;
  const density=Math.min(1.5,window.devicePixelRatio||1);
  paint(recipeOf(art),seed,Math.round(w*density),Math.round(h*density),priority).then(src=>{
    if(!canvas.isConnected)return;canvas.width=src.width;canvas.height=src.height;
    canvas.getContext('2d').drawImage(src,0,0);canvas.dataset.ready='';
    if(className==='gf-art'&&++backsReady===3)document.body.dataset.motionReady='true';
  });
  return canvas;
}
function makeFolder(host,index,settings){
  const uid='gf-port-'+index;
  const root=document.createElement('div');root.className='gf-root';root.dataset.tone=settings.tone;root.dataset.place='bottom-left';root.dataset.folder=String(index);
  root.innerHTML=`<div class="gf-stage"><div class="gf-tilt"><div class="gf-shadow" aria-hidden="true"></div><div class="gf-back" aria-hidden="true"><div class="gf-back-sheen"></div></div><svg class="gf-rim gf-back-rim" viewBox="0 0 340 272" aria-hidden="true"><path d="${BACK_PATH}"/></svg><div class="gf-front"><div class="gf-tint" aria-hidden="true"></div><div class="gf-spec" aria-hidden="true"></div><svg class="gf-rim gf-front-rim" viewBox="0 0 340 198" aria-hidden="true"><defs><linearGradient id="${uid}-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs><path d="${FRONT_PATH}" stroke="url(#${uid}-rim)"/></svg><button class="gf-hit" type="button" aria-expanded="false"></button><div class="gf-label"><span class="gf-title"></span><span class="gf-meta"></span></div></div><div class="gf-files" role="list" inert></div><button class="gf-key gf-key--${settings.action}" type="button">${settings.action==='add'?'<svg class="gf-glyph gf-glyph--plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v15M4.5 12h15"/></svg>':'<svg class="gf-glyph gf-glyph--more" viewBox="0 0 30 12" aria-hidden="true"><rect x="1" y="1.5" width="8" height="9" rx="3.4"/><rect x="11" y="1.5" width="8" height="9" rx="3.4"/><rect x="21" y="1.5" width="8" height="9" rx="3.4"/></svg>'}</button><div class="gf-menu" role="menu" aria-label="Folder options" inert></div></div></div>`;
  const q=s=>root.querySelector(s),front=q('.gf-front'),back=q('.gf-back'),filesNode=q('.gf-files'),hit=q('.gf-hit'),key=q('.gf-key'),menu=q('.gf-menu');
  front.style.clipPath=`path('${FRONT_PATH}')`;back.style.clipPath=`path('${BACK_PATH}')`;
  back.prepend(artCanvas('gf-art',settings.art,settings.seed,W+24,H+24,0));
  q('.gf-title').textContent=settings.label;filesNode.setAttribute('aria-label',settings.label+' contents');
  let files=SAMPLE_FILES.map((file,id)=>({...file,id})),nextId=files.length,open=false,menuOpen=false;
  const sheetNodes=new Map();
  const feedback=document.createElement('output');feedback.className='gf-feedback';feedback.setAttribute('aria-live','polite');
  host.append(root,feedback);
  function setOpen(value){
    open=value;root.toggleAttribute('data-open',open);hit.setAttribute('aria-expanded',String(open));filesNode.inert=!open;setMenu(false);renderLabel();
  }
  function setMenu(value){
    menuOpen=value;menu.toggleAttribute('data-open',value);menu.inert=!value;key.setAttribute('aria-expanded',String(value));
    if(value){menu.firstElementChild.textContent=open?'Close folder':'Open folder';menu.firstElementChild.focus();}
  }
  function renderLabel(){
    hit.setAttribute('aria-label',`${open?'Close':'Open'} ${settings.label}, ${files.length} ${files.length===1?'item':'items'}`);
    const text=document.createElement('span');text.className='gf-meta';text.textContent=files.length+(files.length===1?' item':' items');q('.gf-meta').replaceWith(text);
  }
  function renderFiles(dropped){
    const start=Math.max(0,files.length-MAX_VISIBLE),visible=files.slice(start);
    const visibleIds=new Set(visible.map(file=>file.id));
    // Keep retained sheets attached so their in-flight CSS transitions survive.
    for(const [id,node]of sheetNodes)if(!visibleIds.has(id)){node.remove();sheetNodes.delete(id);}
    visible.forEach((file,v)=>{
      let node=sheetNodes.get(file.id);
      if(!node){
        node=document.createElement('div');node.className='gf-sheet-slot';node.setAttribute('role','listitem');
        const sheet=document.createElement('button');sheet.type='button';sheet.className='gf-sheet'+(file.art?' gf-sheet--art':'');
        if(file.art)sheet.append(artCanvas('gf-sheet-art',file.art,hashString(file.name)%997,SHEET_W,SHEET_H,1));
        else{const lines=document.createElement('span');lines.className='gf-lines';lines.setAttribute('aria-hidden','true');lines.innerHTML=[86,92,64,88,42].map(w=>`<i style="width:${w}%"></i>`).join('');sheet.append(lines);}
        const header=document.createElement('span');header.className='gf-sheet-head';const name=document.createElement('span');name.className='gf-sheet-name';name.textContent=file.name;const meta=document.createElement('span');meta.className='gf-sheet-meta';meta.textContent=file.meta||'';header.append(name,meta);sheet.append(header);
        sheet.addEventListener('click',()=>{feedback.textContent='Selected: '+file.name;});
        sheet.addEventListener('animationend',event=>{if(event.target===sheet&&event.animationName==='gf-drop')sheet.classList.remove('gf-sheet--drop');});
        node.append(sheet);sheetNodes.set(file.id,node);
      }
      const sheet=node.firstElementChild,jitter=rng(hashString(file.name)+file.id);
      sheet.style.setProperty('--gf-slot',fanSlot(v,visible.length));sheet.style.setProperty('--gf-depth',visible.length-1-v);
      sheet.style.setProperty('--gf-jx',((jitter()-.5)*10).toFixed(2)+'px');sheet.style.setProperty('--gf-jr',((jitter()-.5)*3.2).toFixed(2)+'deg');sheet.style.zIndex=v+1;
      // A later add supersedes the previous drop, matching the supplied component.
      sheet.classList.toggle('gf-sheet--drop',file.id===dropped&&!reduceMotion());
      if(node.parentNode!==filesNode)filesNode.append(node);
    });
    renderLabel();
  }
  function add(){
    const id=nextId++;files.push({id,name:'Untitled '+(files.length+1),meta:'Just now'});renderFiles(id);
    front.classList.remove('gf-front--bump');
    if(!reduceMotion()){void front.offsetWidth;front.classList.add('gf-front--bump');}
    // The original keys the glyph by add count; replay it without replacing the button.
    const glyph=key.querySelector('.gf-glyph--plus');if(glyph)glyph.replaceWith(glyph.cloneNode(true));
    feedback.textContent='Added a file · '+files.length+' items';
  }
  front.addEventListener('animationend',event=>{if(event.target===front&&event.animationName==='gf-bump')front.classList.remove('gf-front--bump');});
  hit.addEventListener('click',()=>setOpen(!open));
  if(settings.action==='add'){key.setAttribute('aria-label','Add a file to '+settings.label);key.addEventListener('click',add);}
  else{
    key.setAttribute('aria-label','More options for '+settings.label);key.setAttribute('aria-haspopup','menu');key.setAttribute('aria-expanded','false');
    key.addEventListener('click',()=>setMenu(!menuOpen));
    for(const [label,action,danger]of [['Open folder',()=>setOpen(!open),false],['Add a file',add,false],['Reset contents',()=>{files=SAMPLE_FILES.map((f,id)=>({...f,id}));nextId=files.length;renderFiles();feedback.textContent='Contents reset';},false]]){
      const item=document.createElement('button');item.type='button';item.className='gf-menu-item'+(danger?' gf-menu-item--danger':'');item.setAttribute('role','menuitem');item.tabIndex=-1;item.textContent=label;
      item.addEventListener('click',()=>{setMenu(false);action();key.focus();});menu.append(item);
    }
  }
  menu.addEventListener('keydown',event=>{
    const items=[...menu.children],at=items.indexOf(document.activeElement);let next;
    if(event.key==='ArrowDown')next=(at+1)%items.length;else if(event.key==='ArrowUp')next=(at+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;
    if(next!==undefined){event.preventDefault();items[next].focus();}else if(event.key==='Tab')setMenu(false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(menuOpen){setMenu(false);key.focus();}else if(open&&root.contains(event.composedPath()[0])){setOpen(false);hit.focus();}
  });
  document.addEventListener('pointerdown',event=>{
    const target=event.composedPath()[0];if(!root.contains(target)){if(menuOpen)setMenu(false);else if(open)setOpen(false);}
  });
  let frame=0,px=0,py=0;
  function write(){frame=0;root.style.setProperty('--gf-px',px.toFixed(3));root.style.setProperty('--gf-py',py.toFixed(3));}
  root.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||reduceMotion())return;const bounds=root.getBoundingClientRect();px=(event.clientX-bounds.left)/bounds.width*2-1;py=(event.clientY-bounds.top)/bounds.height*2-1;if(!frame)frame=requestAnimationFrame(write);
  });
  root.addEventListener('pointerleave',()=>{px=py=0;if(!frame)frame=requestAnimationFrame(write);});
  const resize=new ResizeObserver(()=>{const width=Math.min(340,host.clientWidth),k=width/W;root.style.width=width+'px';root.style.height=(H+HEADROOM)*k+'px';q('.gf-stage').style.transform=`translateY(${HEADROOM*k}px) scale(${k})`;});resize.observe(host);
  const enter=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){enter.disconnect();setTimeout(()=>{root.dataset.entered='';},index*100);}},{threshold:.25});enter.observe(root);
  renderFiles();
}
document.querySelectorAll('.gf-demo-slot').forEach((host,index)=>makeFolder(host,index,[
  {label:'My Files',tone:'light',art:'aurora',seed:3,action:'add'},
  {label:'Studio',tone:'dark',art:'ember',seed:7,action:'more'},
  {label:'References',tone:'light',art:'glacier',seed:11,action:'add'},
][index]));
