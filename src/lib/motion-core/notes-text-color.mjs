import {gsap} from 'gsap';
import {createSurface} from './motion-runtime';
import {NOTES_TEXT,NOTES_COLORS} from '../../data/notes-text-color.mjs';

export function createNotesTextColor(target,options,CSS,markup){
 const scope=createSurface(target,{css:CSS,markup,width:900,height:1080},options);
 const {root,on,window:win}=scope,doc=target.ownerDocument;
 const scene=root.querySelector('.nc-scene'),screen=root.querySelector('.nc-screen');
 const scroll=root.querySelector('.nc-scroll'),article=root.querySelector('.nc-article');
 const overlay=root.querySelector('.nc-overlay'),palette=root.querySelector('.nc-palette');
 const history=root.querySelector('.nc-history'),live=root.querySelector('.nc-live');
 const swatches=[...root.querySelectorAll('.nc-swatch')],custom=root.querySelector('.nc-custom');
 const highlights=[],handles=['start','end'].map(edge=>{const handle=doc.createElement('button');handle.type='button';handle.tabIndex=-1;handle.className='nc-selection-handle';handle.dataset.edge=edge;handle.setAttribute('aria-label',`Adjust selection ${edge}`);overlay.append(handle);return handle;});
 overlay.hidden=true;
 const fit=()=>{root.querySelector('.nc-device-wrap').style.transform=`translate(-50%,-50%) scale(${Math.max(.1,Math.min(1.17,(scene.clientHeight-80)/844,(scene.clientWidth-48)/400))})`;if(open)position();};
 const tweens=new Set();let saved=null,active=3,open=false,suppress=false,selecting=false,selectionTimer=0,longPress=0,drag=null,dead=false;
 const paragraphs=NOTES_TEXT.map(text=>({text,colors:Array(text.length).fill('')}));
 const nodes=paragraphs.map((_,i)=>{const p=doc.createElement('p');p.tabIndex=0;p.dataset.index=i;p.setAttribute('aria-label',`Note ${i+1}. Press Enter to select text and choose a color.`);article.append(p);return p;});
 const offsetAt=i=>paragraphs.slice(0,i).reduce((sum,p)=>sum+p.text.length,0);
 const find=(index,text)=>{const start=offsetAt(index)+paragraphs[index].text.indexOf(text);return {start,end:start+text.length};};
 const initial=[{...find(2,'Frame 2847'),color:NOTES_COLORS[6].ink},{...find(1,'bigger'),color:NOTES_COLORS[2].ink},{...find(1,'smaller'),color:NOTES_COLORS[4].ink},{...find(4,'Rent'),color:NOTES_COLORS[7].ink}];
 let recent=[];
 const motion=(element,vars)=>{
  if(!element)return;
  gsap.killTweensOf(element);
  if(scope.reduced()){const rest={...vars};delete rest.duration;delete rest.ease;delete rest.onComplete;gsap.set(element,rest);vars.onComplete?.();return;}
  let tween; tween=gsap.to(element,{...vars,onComplete(){tweens.delete(tween);vars.onComplete?.();}});tweens.add(tween);
 };
 const selection=()=>root.getSelection?.()??doc.getSelection();
 const owned=range=>range&&article.contains(range.startContainer)&&article.contains(range.endContainer);
 const rangeFor=(start,end)=>{
  const walker=doc.createTreeWalker(article,4);let node,total=0,first=null,last=null;
  while((node=walker.nextNode())){const next=total+node.length;if(!first&&start>=total&&start<next)first=[node,start-total];if(end>total&&end<=next){last=[node,end-total];break;}total=next;}
  if(!first||!last)return null;
  const range=doc.createRange();range.setStart(...first);range.setEnd(...last);return range;
 };
 const textFor=range=>NOTES_TEXT.join('').slice(range.start,range.end);
 const same=(a,b)=>a&&b&&a.start===b.start&&a.end===b.end;
 const colorAt=index=>{let base=0;for(const p of paragraphs){if(index<base+p.text.length)return p.colors[index-base]||NOTES_COLORS[0].ink;base+=p.text.length;}return NOTES_COLORS[0].ink;};
 function paintParagraph(index){
  const {text,colors}=paragraphs[index],fragment=doc.createDocumentFragment();
  for(let start=0;start<text.length;){let end=start+1;while(end<text.length&&colors[end]===colors[start])end++;const span=doc.createElement('span');span.textContent=text.slice(start,end);if(colors[start]){span.style.setProperty('--nc-ink',colors[start]);span.dataset.colored='';}fragment.append(span);start=end;}
  nodes[index].replaceChildren(fragment);
 }
 function setColor(range,color){
  const affected=[];let base=0,split=false;
  paragraphs.forEach((p,i)=>{
   const begin=Math.max(0,range.start-base),end=Math.min(p.text.length,range.end-base);base+=p.text.length;
   if(begin>=end)return;p.colors.fill(color,begin,end);
   let offset=0;
   for(const original of [...nodes[i].children]){
    const length=original.textContent.length,from=Math.max(0,begin-offset),to=Math.min(length,end-offset);offset+=length;
    if(from>=to)continue;let span=original;
    // Split only newly selected boundaries. Recoloring keeps text nodes and its
    // native Range intact, including when the next color matches a neighbour.
    if(to<length){const tail=span.cloneNode(false);tail.style.removeProperty('color');tail.append(span.firstChild.splitText(to));span.after(tail);split=true;}
    if(from>0){const selected=span.cloneNode(false);selected.style.removeProperty('color');selected.append(span.firstChild.splitText(from));span.after(selected);span=selected;split=true;}
    const previous=win.getComputedStyle(span).color;span.style.setProperty('--nc-ink',color);span.dataset.colored='';affected.push({span,previous});
   }
  });
  return {affected,split};
 }
 function focusParagraph(index,end=index){active=index;nodes.forEach((p,i)=>{const selected=i>=index&&i<=end;if(p.dataset.active===String(selected))return;p.dataset.active=String(selected);motion(p,{opacity:selected?1:.15,filter:selected?'blur(0px)':'blur(.35px)',duration:.16,ease:'power2.out'});});scene.dataset.active=String(index);}
 function indexFor(offset){let base=0;for(let i=0;i<paragraphs.length;i++){base+=paragraphs[i].text.length;if(offset<base)return i;}return paragraphs.length-1;}
 function restore(){
  if(!saved)return;
  const range=rangeFor(saved.start,saved.end),current=selection();if(!range||!current)return;
  suppress=true;current.setBaseAndExtent(range.startContainer,range.startOffset,range.endContainer,range.endOffset);
  scope.clearTimeout(selectionTimer);selectionTimer=scope.setTimeout(()=>{suppress=false;},30);
 }
 function recentList(){
  history.replaceChildren();
  recent.slice(0,4).forEach(entry=>{const button=doc.createElement('button');button.type='button';button.className='nc-recent';button.style.setProperty('--nc-recent',entry.color);button.setAttribute('aria-label',`Select ${textFor(entry)}`);const label=doc.createElement('span');label.textContent=textFor(entry);button.append(label);button.dataset.start=String(entry.start);button.dataset.end=String(entry.end);history.append(button);});
 }
 function remember(range){const existing=recent.find(entry=>same(entry,range));recent=recent.filter(entry=>!same(entry,range));recent.unshift({...range,color:existing?.color??colorAt(range.start)});recent=recent.slice(0,4);recentList();}
 const updateSwatches=color=>swatches.forEach(button=>button.setAttribute('aria-checked',String(button.dataset.ink===color||(button.dataset.color==='custom'&&!NOTES_COLORS.some(c=>c.ink===color)))));
 function position(){
  if(!saved||!open)return;
  const range=rangeFor(saved.start,saved.end);if(!range)return;
  const bounds=screen.getBoundingClientRect(),scale=bounds.width/screen.offsetWidth;
  const rows=[];
  for(const r of range.getClientRects()){
   if(r.width<.1||r.height<1)continue;
   const box={x:(r.left-bounds.left)/scale,y:(r.top-bounds.top)/scale,w:r.width/scale,h:r.height/scale};
   const previous=rows.at(-1);
   if(previous&&Math.abs(previous.y-box.y)<2&&box.x<=previous.x+previous.w+2){previous.w=Math.max(previous.x+previous.w,box.x+box.w)-previous.x;previous.h=Math.max(previous.h,box.h);}
   else rows.push(box);
  }
  if(!rows.length)return;
  const first=rows[0],last=rows.at(-1),viewTop=scroll.offsetTop,viewBottom=viewTop+scroll.clientHeight;
  if(last.y<viewTop+20||first.y>viewBottom-20){close(false);return;}
  const color=colorAt(saved.start),isWhite=color===NOTES_COLORS[0].ink;
  overlay.hidden=false;
  const articleRight=(article.getBoundingClientRect().right-bounds.left)/scale-25;
  while(highlights.length>rows.length)highlights.pop().remove();
  rows.forEach((box,i)=>{let mark=highlights[i];if(!mark){mark=doc.createElement('div');mark.className='nc-highlight';overlay.insertBefore(mark,handles[0]);highlights.push(mark);}Object.assign(mark.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${i<rows.length-1?Math.max(box.w,articleRight-box.x):box.w}px`,height:`${box.h}px`,background:color});mark.style.opacity=isWhite?'.2':'.32';});
  for(const [handle,box,x] of [[handles[0],first,first.x],[handles[1],last,last.x+last.w]])Object.assign(handle.style,{left:`${x}px`,top:`${box.y}px`,height:`${box.h}px`});
  const left=Math.min(...rows.map(r=>r.x)),right=Math.max(...rows.map(r=>r.x+r.w));
  const width=palette.offsetWidth,anchor=rows.length>1?screen.clientWidth/2:(left+right)/2,x=Math.max(12,Math.min(screen.clientWidth-width-12,anchor-width/2));
  const h=palette.offsetHeight,above=first.y-h-17,below=above<98;
  palette.dataset.side=below?'below':'above';
  palette.style.left=`${x}px`;palette.style.top=`${below?Math.min(viewBottom-h-5,last.y+last.h+17):above}px`;
  palette.style.setProperty('--nc-arrow',`${Math.max(18,Math.min(width-18,anchor-x))}px`);
  scene.dataset.selection=textFor(saved);scene.dataset.color=color;updateSwatches(color);
 }
 function show(range,{keyboard=false,keepHistory=false,native=false}={}){
  if(!range||range.start>=range.end)return;
  const changed=!same(saved,range);saved={...range};focusParagraph(indexFor(range.start),indexFor(range.end-1));
  if(!keepHistory&&(changed||!same(recent[0],range)))remember(range);
  if(!native)restore();const wasOpen=open;open=true;palette.inert=false;palette.setAttribute('aria-hidden','false');scene.dataset.open='true';
  position();
  if(!wasOpen){gsap.set(palette,{opacity:0,visibility:'visible',scale:scope.reduced()?1:.82,y:scope.reduced()?0:7});motion(palette,{opacity:1,scale:1,y:0,duration:.18,ease:'back.out(1.45)'});}
  if(keyboard)swatches.find(button=>button.getAttribute('aria-checked')==='true')?.focus({preventScroll:true});
 }
 function close(returnFocus=true){
  open=false;saved=null;overlay.hidden=true;palette.inert=true;palette.setAttribute('aria-hidden','true');scene.dataset.open='false';delete scene.dataset.selection;custom.hidden=true;
  motion(palette,{autoAlpha:0,scale:.92,y:3,duration:.14,ease:'power2.in'});
  const current=selection();if(current?.rangeCount&&owned(current.getRangeAt(0))){suppress=true;current.removeAllRanges();scope.clearTimeout(selectionTimer);selectionTimer=scope.setTimeout(()=>{suppress=false;},30);}
  if(returnFocus)nodes[active].focus({preventScroll:true});
 }
 function commit(color,button){
  if(!saved)return;const range={...saved};
  const {affected,split}=setColor(range,color);if(split)restore();recent.forEach(entry=>{if(same(entry,range))entry.color=color;});
  for(const entry of recent){const row=[...history.children].find(node=>Number(node.dataset.start)===entry.start&&Number(node.dataset.end)===entry.end);row?.style.setProperty('--nc-recent',entry.color);}
  position();
  for(const {span,previous} of affected){gsap.killTweensOf(span);span.style.removeProperty('color');if(!scope.reduced()){gsap.set(span,{color:previous});motion(span,{color,duration:.14,ease:'power1.out',clearProps:'color'});}}
  if(!scope.reduced()&&button){gsap.set(button,{scale:.9});motion(button,{scale:1,duration:.18,ease:'back.out(2)'});}
  live.textContent=`${button?.getAttribute('aria-label')??'Custom color'} applied to ${textFor(range)}`;
 }
 function capture(){
  if(dead||suppress||drag)return;
  const current=selection();if(!current?.rangeCount||current.isCollapsed)return;
  const range=current.getRangeAt(0);if(!owned(range))return;
  const prefix=doc.createRange();prefix.selectNodeContents(article);prefix.setEnd(range.startContainer,range.startOffset);const start=prefix.toString().length;
  show({start,end:start+range.toString().length},{native:true,keepHistory:selecting});
 }
 function caret(event){
  const hit=doc.caretPositionFromPoint?.(event.clientX,event.clientY,{shadowRoots:[root]});
  const fallback=hit?null:doc.caretRangeFromPoint?.(event.clientX,event.clientY);
  const node=hit?.offsetNode??fallback?.startContainer,offset=hit?.offset??fallback?.startOffset;
  if(!node||!article.contains(node))return null;
  const prefix=doc.createRange();prefix.selectNodeContents(article);prefix.setEnd(node,offset);return prefix.toString().length;
 }
 function selectWord(event,p){
  const index=Number(p.dataset.index),base=offsetAt(index),text=paragraphs[index].text;
  const at=caret(event),local=at===null?Math.floor(text.length/2):Math.max(0,Math.min(text.length-1,at-base));
  let a=local,b=local;while(a>0&&!/\s/.test(text[a-1]))a--;while(b<text.length&&!/\s/.test(text[b]))b++;
  show({start:base+a,end:base+b});
 }
 on(doc,'selectionchange',()=>{if(!suppress&&!drag){scope.clearTimeout(selectionTimer);selectionTimer=scope.setTimeout(capture,40);}});
 on(article,'pointerup',event=>{selecting=false;if(event.pointerType!=='touch')scope.setTimeout(capture,0);});
 on(win,'pointerup',()=>{if(selecting){selecting=false;scope.setTimeout(capture,0);}});
 on(win,'pointercancel',()=>{selecting=false;scope.clearTimeout(longPress);});
 on(article,'click',event=>{
  const p=event.target.closest('p');if(!p)return;
  const current=selection();if(current&&!current.isCollapsed&&owned(current.getRangeAt(0)))return;
  focusParagraph(Number(p.dataset.index));
  if(event.target.matches('[data-colored]')){const range=doc.createRange();range.selectNodeContents(event.target);const prefix=doc.createRange();prefix.selectNodeContents(article);prefix.setEnd(range.startContainer,range.startOffset);const start=prefix.toString().length;show({start,end:start+range.toString().length});}
  else if(open)close(false);
 });
 on(article,'keydown',event=>{
  const p=event.target.closest('p');if(!p)return;
  if(event.key==='Enter'||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a')){event.preventDefault();const index=Number(p.dataset.index),start=offsetAt(index);show({start,end:start+paragraphs[index].text.length},{keyboard:event.key==='Enter'});}
 });
 on(palette,'pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
 on(palette,'click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.matches('.nc-swatch')){if(button.dataset.color==='custom'){custom.hidden=!custom.hidden;position();if(!custom.hidden)custom.querySelector('input').focus({preventScroll:true});}else commit(button.dataset.ink,button);}
  if(button.matches('.nc-recent')){const range={start:Number(button.dataset.start),end:Number(button.dataset.end)};const p=nodes[indexFor(range.start)];scroll.scrollTop=Math.max(0,p.offsetTop-250);show(range);}
 });
 on(palette,'keydown',event=>{
  const index=swatches.indexOf(event.target);if(index<0)return;
  let next=index;
  if(event.key==='ArrowRight')next=(index+1)%9;else if(event.key==='ArrowLeft')next=(index+8)%9;else if(event.key==='ArrowDown')next=(index+3)%9;else if(event.key==='ArrowUp')next=(index+6)%9;else if(event.key==='Home')next=0;else if(event.key==='End')next=8;else return;
  event.preventDefault();swatches[next].focus();
 });
 on(custom.querySelector('input'),'input',event=>commit(`hsl(${event.target.value} 76% 72%)`,swatches[8]));
 on(root,'keydown',event=>{if(event.key==='Escape'&&open){event.preventDefault();close();}});
 on(root,'pointerdown',event=>{if(!palette.contains(event.target)&&!article.contains(event.target)&&!overlay.contains(event.target)&&open)close(false);});
 on(scroll,'scroll',position,{passive:true});on(win,'resize',position);
 on(article,'pointerdown',event=>{
  selecting=event.pointerType!=='touch';
  scope.clearTimeout(longPress);if(event.pointerType!=='touch')return;
  const p=event.target.closest('p');if(!p)return;const x=event.clientX,y=event.clientY;
  scene.__touch={x,y};longPress=scope.setTimeout(()=>{selectWord(event,p);scene.__touch=null;},380);
 });
 on(article,'pointermove',event=>{const touch=scene.__touch;if(touch&&Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>8){scope.clearTimeout(longPress);scene.__touch=null;}});
 for(const type of ['pointerup','pointercancel'])on(article,type,()=>{scope.clearTimeout(longPress);scene.__touch=null;});
 on(overlay,'pointerdown',event=>{const handle=event.target.closest('.nc-selection-handle');if(!handle||!saved)return;event.preventDefault();drag={edge:handle.dataset.edge,range:{...saved},pointer:event.pointerId};overlay.setPointerCapture(event.pointerId);});
 on(overlay,'pointermove',event=>{if(!drag||event.pointerId!==drag.pointer)return;const at=caret(event);if(at===null)return;const range=drag.edge==='start'?{start:Math.min(at,drag.range.end-1),end:drag.range.end}:{start:drag.range.start,end:Math.max(at,drag.range.start+1)};show(range,{keepHistory:true});});
 const endDrag=event=>{if(drag&&event.pointerId===drag.pointer){if(overlay.hasPointerCapture(event.pointerId))overlay.releasePointerCapture(event.pointerId);drag=null;if(saved)remember(saved);}};
 on(overlay,'pointerup',endDrag);on(overlay,'pointercancel',endDrag);on(overlay,'lostpointercapture',()=>{drag=null;});
 function reset(){
  close(false);paragraphs.forEach((p,i)=>{p.colors.fill('');paintParagraph(i);});initial.forEach(entry=>setColor(entry,entry.color));setColor(find(4,'Dentist'),NOTES_COLORS[7].ink);recent=initial.map(entry=>({...entry}));recentList();focusParagraph(3);scroll.scrollTop=65;live.textContent='Notes reset';
 }
 on(root.querySelector('.nc-done'),'click',()=>close(false));on(root.querySelector('.nc-back'),'click',reset);
 reset();fit();const resize=new scope.ResizeObserver(fit);resize.observe(scene);scene.dataset.open='false';scene.dataset.ready='true';scope.body.dataset.motionReady='true';
 scope.addCleanup(()=>{dead=true;const current=selection();if(current?.rangeCount&&owned(current.getRangeAt(0)))current.removeAllRanges();tweens.forEach(tween=>tween.kill());gsap.killTweensOf([palette,...nodes,...swatches,...article.querySelectorAll('span')]);overlay.replaceChildren();});
 scope.ready();return scope.controller;
}
