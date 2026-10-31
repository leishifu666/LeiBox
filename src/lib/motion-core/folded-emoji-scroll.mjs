import {createSurface} from './motion-runtime';
import {prepareHtmlInCanvas,drawHtmlInCanvas} from '../html-in-canvas';
import {createFoldedEmojiRenderer} from './folded-emoji-renderer.mjs';
import {createEmojiRasterWorker} from './folded-emoji-raster.mjs';

export function createFoldedEmojiScroll(target,initial,CSS,MARKUP,GROUPS,ALIASES){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1280,height:960},initial);
 const {root,on}=scope,scene=root.querySelector('.fe-scene'),stage=root.querySelector('.fe-stage');
 const search=root.querySelector('.fe-search'),scroll=root.querySelector('.fe-scroll'),content=root.querySelector('.fe-content');
 const output=root.querySelector('.fe-output'),source=root.querySelector('.fe-capture');
 const renderer=createFoldedEmojiRenderer(output),texture=source.getContext('2d'),owner=target.ownerDocument;
 scene.dataset.renderer=renderer.mode;
 const viewport=owner.createElement('canvas'),view=viewport.getContext('2d',{willReadFrequently:true}),padding=72;
 let options={...initial},value=initial?.value??'',dead=false,fontsReady=false,frame=0,nodes=[],boxes=[],entries=[],rows=[],hovered=null,focused=null,top=0,bottom=0,w=590,h=702,ratio=1.5,native=false,contentHeight=702,generation=0,busy=false;
 let worker=createEmojiRasterWorker(owner,result=>{
  busy=false;
  const row=rows[result.id];
  if(dead||result.generation!==generation||!row){result.bitmap.close();if(!dead)pump();return;}
  row.bitmap=result.bitmap;scene.dataset.rasterCount=String(Number(scene.dataset.rasterCount??0)+row.entries.length);
  if(row.y+row.height>=scroll.scrollTop-padding&&row.y<=scroll.scrollTop+h+padding)schedule();pump();
 },()=>{worker?.terminate();worker=null;busy=false;if(!dead){scene.dataset.rasterMode='main';schedule();}});
 scene.dataset.rasterMode=worker?'worker':'main';scene.dataset.rasterPending='false';
 const records=GROUPS.map(group=>({...group,items:group.emoji.split(' ').map(emoji=>({emoji,label:`${group.title}: ${emoji}`,search:`${emoji} ${group.title} ${group.tags} ${ALIASES[emoji]??''}`.toLowerCase()}))}));
 const nativeContent=owner.createElement('div');source.append(nativeContent);prepareHtmlInCanvas(source,nativeContent);
 native=typeof texture.drawElementImage==='function'&&typeof source.requestPaint==='function';
 function fit(){stage.style.transform=`translate(-50%,-50%) scale(${Math.min(1,Math.max(.1,scene.clientHeight/960))})`;}
 function position(node){let x=0,y=0;for(let at=node;at&&at!==content;at=at.offsetParent){x+=at.offsetLeft;y+=at.offsetTop;}return{x,y,width:node.offsetWidth,height:node.offsetHeight};}
 function paintVisible(offset){
  // Retain painted cells for the lifetime of this layout. Pointer and scroll
  // events never measure DOM/fonts, resize canvases, or repaint cached glyphs.
  const start=offset-h/2-padding,end=offset+h*1.5+padding;
  let count=0;
  for(const row of rows){
   if(row.canvas||row.bitmap||row.y+row.height<start||row.y>end)continue;
   if(worker&&row.entries[0].node.classList.contains('fe-emoji'))continue;
   const canvas=owner.createElement('canvas');canvas.width=Math.ceil(w*ratio);canvas.height=Math.ceil(row.height*ratio);
   const painter=canvas.getContext('2d',{willReadFrequently:true});painter.setTransform(ratio,0,0,ratio,0,0);painter.textBaseline='alphabetic';
   for(const entry of row.entries){
    painter.font=entry.font;painter.fillStyle=entry.color;painter.textAlign=entry.align;
    painter.fillText(entry.text,entry.x+(entry.align==='center'?entry.width/2:0),entry.height/2+entry.baseline);count++;
   }
   row.canvas=canvas;
  }
  scene.dataset.rasterCount=String(Number(scene.dataset.rasterCount??0)+count);
  pump();
 }
 function pump(){
  if(!worker||dead||scene.dataset.captureMode==='native'){scene.dataset.rasterPending='false';return;}if(busy)return;
  const offset=scroll.scrollTop;
  const pending=rows.filter(row=>!row.bitmap&&!row.canvas&&row.y+row.height>=offset-h/2-padding&&row.y<=offset+h*1.5+padding);
  pending.sort((a,b)=>Math.max(0,a.y-offset-h,offset-a.y-a.height)-Math.max(0,b.y-offset-h,offset-b.y-b.height));
  const row=pending[0];if(!row){scene.dataset.rasterPending='false';return;}busy=true;scene.dataset.rasterPending='true';
  worker.postMessage({generation,id:rows.indexOf(row),width:Math.ceil(w*ratio),height:Math.ceil(row.height*ratio),ratio,entries:row.entries.map(({font,color,align,text,x,width,height,baseline})=>({font,color,align,text,x,width,height,baseline}))});
 }
 function capture(){
  if(dead||!scroll.clientWidth||!scroll.clientHeight)return;
  w=scroll.clientWidth;h=scroll.clientHeight;ratio=Math.min(2,scope.window.devicePixelRatio||1);
  contentHeight=Math.max(h,content.scrollHeight);
  const styles=new Map();boxes=[];generation++;for(const row of rows){if(row.canvas)row.canvas.width=row.canvas.height=0;row.bitmap?.close();}
  entries=[...content.querySelectorAll('.fe-heading,.fe-emoji,.fe-empty')].map(node=>{
   const isEmoji=node.classList.contains('fe-emoji'),key=node.className,box=position(node);
   if(!styles.has(key)){
    const style=scope.window.getComputedStyle(node),font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    texture.font=font;const metrics=texture.measureText(isEmoji?'😀':node.textContent);
    styles.set(key,{font,color:style.color,align:isEmoji||key==='fe-empty'?'center':'left',baseline:((metrics.fontBoundingBoxAscent??parseFloat(style.fontSize)*.8)-(metrics.fontBoundingBoxDescent??parseFloat(style.fontSize)*.2))/2});
   }
   const entry={...box,...styles.get(key),node,text:node.textContent};if(isEmoji)boxes.push(entry);return entry;
  });
  const rowMap=new Map();for(const entry of entries){if(!rowMap.has(entry.y))rowMap.set(entry.y,{y:entry.y,height:entry.height,entries:[],canvas:null});rowMap.get(entry.y).entries.push(entry);}rows=[...rowMap.values()];
  source.width=Math.ceil(w*ratio);source.height=native?Math.ceil(contentHeight*ratio):1;
  source.style.width=w+'px';source.style.height=contentHeight+'px';
  if(output.width!==Math.ceil(w*ratio)||output.height!==Math.ceil(h*ratio)){output.width=Math.ceil(w*ratio);output.height=Math.ceil(h*ratio);}
  if(viewport.width!==Math.ceil(w*ratio)||viewport.height!==Math.ceil((h+padding*2)*ratio)){viewport.width=Math.ceil(w*ratio);viewport.height=Math.ceil((h+padding*2)*ratio);}
  scene.dataset.captureMode='snapshot';scene.dataset.captureCount=String(Number(scene.dataset.captureCount??0)+1);
  if(native){
   nativeContent.className='fe-content';nativeContent.style.cssText=`opacity:1;width:${w}px`;nativeContent.innerHTML=content.innerHTML;
   for(const node of nativeContent.querySelectorAll('.fe-emoji')){node.setAttribute('aria-pressed','false');delete node.dataset.hover;delete node.dataset.focused;}
   try{source.requestPaint();}catch{native=false;}
  }
  render();
 }
 source.onpaint=()=>{
  if(dead||!native)return;
  try{texture.setTransform(ratio,0,0,ratio,0,0);texture.clearRect(0,0,w,source.height/ratio);drawHtmlInCanvas(source,texture,nativeContent);scene.dataset.captureMode='native';render();}
  catch{native=false;scene.dataset.captureMode='snapshot';render();}
 };
 function sourceY(y){
  const offset=scroll.scrollTop;
  if(top&&y<top)return offset+top-(Math.PI/2-Math.acos(1-y/top))*top;
  if(bottom&&y>h-bottom)return offset+h-bottom+(Math.PI/2-Math.acos(1-(h-y)/bottom))*bottom;
  return offset+y;
 }
 function render(){
  if(dead||!entries.length)return;if(frame)scope.cancelAnimationFrame(frame);frame=0;
  const offset=scroll.scrollTop,max=Math.max(0,contentHeight-h),fold=scope.reduced()?0:Math.max(0,Math.min(72,options.foldSize??42));
  top=Math.min(fold,offset/2);bottom=Math.min(fold,(max-offset)/2);
  if(scene.dataset.captureMode!=='native')paintVisible(offset);
  // A viewport-sized composition keeps transient highlights out of the static
  // glyph texture. Both flat and folded pixels sample the same composition.
  // Only foreground pixels fold. Warping an opaque panel background creates
  // false diagonal seams where the narrowed projection meets its straight sides.
  view.setTransform(ratio,0,0,ratio,0,0);view.clearRect(0,0,w,h+padding*2);
  const visible=boxes.filter(box=>box.y+box.height>=offset-padding&&box.y<=offset+h+padding);
  for(const box of visible)if(box.node===hovered||box.node.dataset.emoji===value){view.fillStyle='#363636';view.beginPath();view.roundRect(box.x,box.y-offset+padding,box.width,box.height,8);view.fill();}
  const start=Math.max(0,offset-padding),end=Math.min(contentHeight,offset+h+padding);
  if(scene.dataset.captureMode==='native'){
   if(end>start)view.drawImage(source,0,start*ratio,source.width,(end-start)*ratio,0,start-offset+padding,w,end-start);
  }else for(const row of rows)if((row.bitmap||row.canvas)&&row.y+row.height>=start&&row.y<=end)view.drawImage(row.bitmap||row.canvas,0,row.y-offset+padding,w,row.height);
  for(const box of visible)if(box.node===focused){view.strokeStyle='#aaa';view.lineWidth=2;view.beginPath();view.roundRect(box.x+1,box.y-offset+padding+1,box.width-2,box.height-2,8);view.stroke();}
  renderer.draw(viewport,w,h,ratio,top,bottom,padding);
  const pixelsReady=scene.dataset.captureMode==='native'||rows.filter(row=>row.y+row.height>=start&&row.y<=end).every(row=>row.bitmap||row.canvas);
  scene.dataset.pixelsReady=String(pixelsReady);
  if(fontsReady&&pixelsReady){scene.dataset.ready='true';scope.body.dataset.motionReady='true';}
  scene.dataset.scroll=scroll.scrollTop.toFixed(1);scene.dataset.topFold=top.toFixed(2);scene.dataset.bottomFold=bottom.toFixed(2);scene.dataset.drawCount=String(Number(scene.dataset.drawCount??0)+1);
 }
 function schedule(){if(dead)return;if(scope.reduced()){render();return;}if(!frame)frame=scope.requestAnimationFrame(render);}
 function rebuild(query){
  const term=query.trim().toLowerCase();hovered=focused=null;content.replaceChildren();
  for(const group of records){
   const items=group.items.filter(item=>!term||item.search.includes(term));if(!items.length)continue;
   const section=owner.createElement('section');section.className='fe-section';
   const heading=owner.createElement('h3');heading.className='fe-heading';heading.textContent=group.title;section.append(heading);
   const grid=owner.createElement('div');grid.className='fe-grid';
   items.forEach(item=>{const button=owner.createElement('button');button.type='button';button.className='fe-emoji';button.textContent=item.emoji;button.dataset.emoji=item.emoji;button.setAttribute('aria-label',item.label);button.setAttribute('aria-pressed',String(value===item.emoji));button.tabIndex=-1;grid.append(button);});
   section.append(grid);content.append(section);
  }
  nodes=[...content.querySelectorAll('.fe-emoji')];if(nodes[0])nodes[0].tabIndex=0;
  if(!nodes.length){const empty=owner.createElement('p');empty.className='fe-empty';empty.textContent='No emoji found';content.append(empty);}
  scroll.scrollTop=0;capture();
 }
 function choose(node,notify=true){
  value=node.dataset.emoji;nodes.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.emoji===value)));
  scene.dataset.value=value;root.querySelector('.fe-status').textContent='Selected '+value;schedule();if(notify)options.onSelect?.(value);
 }
 on(search,'input',()=>rebuild(search.value));
 on(search,'keydown',event=>{if(event.key==='Escape'){search.value='';rebuild('');}if(event.key==='ArrowDown'&&nodes[0]){event.preventDefault();nodes[0].focus();}});
 on(content,'click',event=>{const button=event.target.closest('.fe-emoji');if(button)choose(button);});
 on(scroll,'scroll',schedule,{passive:true});
 on(scroll,'click',event=>{
  if(!event.isTrusted||event.detail===0)return;
  // Use the normalized point directly: parent previews can scale the full scene.
  const physical=scroll.getBoundingClientRect(),px=(event.clientX-physical.left)*w/physical.width,py=(event.clientY-physical.top)*h/physical.height;
  if(py>=top&&py<=h-bottom)return;
  event.preventDefault();event.stopPropagation();const size=py<top?top:bottom,distance=py<top?py:h-py,scale=1-.065*(1-distance/size)**2,x=(px-w/2)/scale+w/2,sy=sourceY(py);
  const box=boxes.find(box=>x>=box.x&&x<box.x+box.width&&sy>=box.y&&sy<box.y+box.height);if(box)choose(box.node);
 },{capture:true});
 on(content,'keydown',event=>{
  const current=nodes.indexOf(event.target);if(current<0)return;let next=current;
  if(event.key==='ArrowRight')next++;else if(event.key==='ArrowLeft')next--;else if(event.key==='ArrowDown')next+=9;else if(event.key==='ArrowUp')next-=9;else if(event.key==='Home')next=0;else if(event.key==='End')next=nodes.length-1;else return;
  event.preventDefault();next=Math.max(0,Math.min(nodes.length-1,next));nodes.forEach((node,i)=>node.tabIndex=i===next?0:-1);nodes[next].focus();nodes[next].scrollIntoView({block:'nearest',inline:'nearest'});
  if(event.key==='Home')scroll.scrollTop=0;else if(event.key==='End')scroll.scrollTop=scroll.scrollHeight;
 });
 on(content,'focusin',event=>{if(focused)delete focused.dataset.focused;focused=event.target.closest('.fe-emoji');if(focused)focused.dataset.focused='true';schedule();});
 on(content,'focusout',()=>{if(focused)delete focused.dataset.focused;focused=null;schedule();});
 on(content,'pointerover',event=>{const node=event.target.closest('.fe-emoji');if(node!==hovered){hovered=node;schedule();}});
 on(content,'pointerout',event=>{if(event.target.closest('.fe-emoji')===hovered){hovered=null;schedule();}});
 const media=scope.matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',render);
 const resize=new scope.ResizeObserver(()=>{fit();if(!entries.length||w!==scroll.clientWidth||h!==scroll.clientHeight||ratio!==Math.min(2,scope.window.devicePixelRatio||1))capture();});resize.observe(scroll);resize.observe(scene);scope.addCleanup(()=>resize.disconnect());
 on(owner.fonts,'loadingdone',capture);scene.dataset.value=value;search.value=initial?.query??'';rebuild(search.value);fit();scope.ready();
 owner.fonts.ready.then(()=>{if(dead)return;fontsReady=true;capture();});
 scope.addCleanup(()=>{dead=true;if(frame)scope.cancelAnimationFrame(frame);worker?.terminate();renderer.destroy();source.onpaint=null;source.width=source.height=output.width=output.height=viewport.width=viewport.height=0;nativeContent.replaceChildren();for(const row of rows){if(row.canvas)row.canvas.width=row.canvas.height=0;row.bitmap?.close();}rows=[];entries=[];boxes=[];});
 return {...scope.controller,update(next){
  if(dead)return;scope.controller.update(next);options={...options,...next};
  if(next.query!==undefined){search.value=next.query;rebuild(search.value);}
  if(next.value!==undefined){value=next.value;nodes.forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.emoji===value)));scene.dataset.value=value;}
  fit();schedule();
 }};
}
