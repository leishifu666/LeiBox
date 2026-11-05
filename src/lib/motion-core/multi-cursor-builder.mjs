import {createSurface} from './motion-runtime';
import {acquireBuilderFonts} from './multi-cursor-builder-fonts.mjs';

/** Native instance port of the supplied page. All scroll and drawing coordinates stay local. */
export function createMultiCursorBuilder(target,initial,CSS,MARKUP,FONTS){
 const scope=createSurface(target,{css:CSS,markup:MARKUP,width:1120,height:760,responsive:true},initial);
 const {root,on}=scope,owner=target.ownerDocument,browser=owner.defaultView;
 const scene=root.querySelector('.mc-scene'),port=root.querySelector('.mc-port'),pauseButton=root.getElementById('mc-pause');
 const fontLease=acquireBuilderFonts(owner,FONTS);
 let options={playing:true,speed:1,skipIntro:false,showToolbar:true,...initial},dead=false,visible=true,embedScale=1,announcedPhase='';
 function normalize(){options.speed=Number.isFinite(options.speed)?Math.max(.25,Math.min(2,options.speed)):1;}
 normalize();
 let innerWidth=scene.clientWidth,innerHeight=scene.clientHeight,scrollY=port.scrollTop;
 const performance=browser.performance;
 const scrollTo=value=>{port.scrollTo(value);scrollY=port.scrollTop;};
 const document={createElement:owner.createElement.bind(owner),querySelector:root.querySelector.bind(root),querySelectorAll:root.querySelectorAll.bind(root),getElementById:root.getElementById.bind(root),body:port,documentElement:port};

/* ======================= 配色 & 原创图 ======================= */
const PAL=['#0d99ff','#9747ff','#ff24bd','#14ae5c','#ffa629','#f24822','#00b5ce'];
const NAMES=['Lei','Ada','Kai','Momo','Ren','Yuki','Sol'];
let seed=7;const R=(a,b)=>{seed=(seed*16807)%2147483647;return a+(b-a)*(seed/2147483647)};
{const chips=document.querySelector('.chips');[['Three.js',0],['WebGL / GLSL',1],['TypeScript',0],['React',6],['GSAP',3],['Blender',4],['After Effects',1],['FFmpeg',3],['Node.js',3],['Figma',2],['Python',4],['Playwright',5],['Web Audio',2]].forEach(([n,c])=>{const s=document.createElement('span');s.className='chip';s.innerHTML=`<i style="background:${PAL[c]}"></i>${n}`;chips.appendChild(s)})}
{const h=document.querySelector('.heat'),G=['#ebedf0','#c6e9cf','#86d39b','#3fae66','#1f7a44'];for(let i=0;i<53*7;i++){const s=document.createElement('span');const col=Math.floor(i/7),r=R(0,1)*(.5+.5*Math.sin(col*.35));s.style.background=G[r>.82?4:r>.62?3:r>.42?2:r>.22?1:0];h.appendChild(s)}}
{const av=document.getElementById('av');NAMES.forEach((n,i)=>{const s=document.createElement('span');s.style.background=PAL[i];s.textContent=n[0];av.appendChild(s)})}

/* ======================= 工具 ======================= */
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), back=t=>{const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const lerp=(a,b,t)=>a+(b-a)*t;
function docPos(el){const r=el.getBoundingClientRect();return{x:(r.left-origin.x)/origin.sx+port.scrollLeft,y:(r.top-origin.y)/origin.sy+port.scrollTop,w:r.width/origin.sx,h:r.height/origin.sy}}
let Y0=0,VW=innerWidth,VH=innerHeight;
let origin={x:0,y:0,sx:1,sy:1};
function refreshOrigin(){const r=scene.getBoundingClientRect();origin={x:r.x,y:r.y,sx:r.width/scene.clientWidth||1,sy:r.height/scene.clientHeight||1};}

/* ======================= 积木（每块 = 一个 Figma 操作） ======================= */
const blocks=[...document.querySelectorAll('.b')].map((el,i)=>{const B={el,i,k:el.dataset.k,n:el.dataset.n,s:0,dir:0,w0:null,att:false,doneT:-9,last:-1,top:0};
  if(B.k==='text'||B.k==='head'){B.html=el.innerHTML;B.txt=el.textContent;B.em=el.querySelector('em')?el.querySelector('em').textContent:'';el.textContent='';
    B.pre=document.createElement('span');B.emv=document.createElement('em');B.car=document.createElement('span');B.car.className='caret';B.inv=document.createElement('span');B.inv.className='inv';el.append(B.pre,B.emv,B.car,B.inv);
    B.split=B.txt.length-B.em.length;B.inv.textContent=B.txt}
  if(B.k==='text')B.D=.45+.14+B.txt.length/(B.txt.length>60?110:46);
  if(B.k==='head'){B.T1=.22+B.txt.length/34;B.D=B.T1+.38+.18+.55}
  if(B.k==='rect'||B.k==='card'){B.cv=el.querySelector('img.art');B.D=.6+.38+.8+.3}
  if(B.k==='kids'){B.kids=[...el.children];B.kv=B.kids.map(()=>-1);B.D=.25+B.kids.length*.15}
  if(B.k==='grid'){B.kids=[...el.children];B.kv=B.kids.map(()=>-1);B.D=.3+1.9}
  if(B.k==='carry')B.D=.32+.72;
  return B});
function layout(){
  refreshOrigin();VW=innerWidth;VH=innerHeight;
  // Disable only the headings' font transition while measuring final geometry.
  const saved=blocks.filter(B=>B.k==='head').map(B=>({B,raw:B.el.classList.contains('raw'),morph:B.el.classList.contains('morph'),transition:B.el.style.transition}));
  for(const {B}of saved){B.el.style.transition='none';B.el.classList.remove('raw','morph');B.el.style.height='';}
  const scaled=blocks.filter(B=>B.k==='kids').flatMap(B=>B.kids.map(el=>({el,transform:el.style.transform})));
  for(const {el}of scaled)el.style.transform='none';
  // Read fractional CSS-pixel geometry in one batch; carry transforms are tracked separately.
  for(const B of blocks){const r=docPos(B.el);Object.assign(B,{...r,x:r.x-(B.tx||0),y:r.y-(B.ty||0)});if(B.k==='card')B.th=docPos(B.cv.parentNode).h;B.side=(B.x+B.w/2)<VW/2?-1:1;if(B.kids)B.kp=B.kids.map(docPos);B.last=-1;}
  for(const {el,transform}of scaled)el.style.transform=transform;
  for(const {B,raw}of saved){B.el.style.height=B.h+'px';B.el.classList.toggle('raw',raw);}
  // Commit restored text geometry once before re-enabling transitions.
  wrapEl.getBoundingClientRect();
  for(const {B,morph,transition}of saved){B.el.style.transition=transition;B.el.classList.toggle('morph',morph);}
  documentHeight=document.documentElement.scrollHeight;
}

/* 光标在第 s 秒的位置 / 工具（视口坐标） */
function pose(B,s){const x=B.x,y=B.top,w=B.w,h=B.h;
  if(B.k==='text'){
    if(s<.45){const k=io(s/.45);return{x:x+w*k,y:y+h*k,t:'cross',drag:1}}
    if(s<.59){const k=io((s-.45)/.14);return{x:lerp(x+w,x+1,k),y:lerp(y+h,y+10,k),t:'ibeam'}}
    return{x:B.cp?B.cp.x:x,y:B.cp?B.cp.y-Y0:y+10,t:'ibeam'}}
  if(B.k==='head'){
    if(s<B.T1)return{x:B.cp&&s>.22?B.cp.x:x+1,y:B.cp&&s>.22?B.cp.y-Y0:y+12,t:'ibeam'};
    const P=popPos(B);
    if(s<B.T1+.38){const k=io((s-B.T1)/.38),c=B.cpEnd||{x:x,y:y+12+Y0};return{x:lerp(c.x,P.x+150,k),y:lerp(c.y-Y0,P.y+44,k),t:'arrow'}}
    if(s<B.T1+.56)return{x:P.x+150,y:P.y+44,t:'arrow'};
    const k=io((s-B.T1-.56)/.55);return{x:P.x+150+k*10,y:P.y+44+k*24,t:'arrow'}}
  if(B.k==='rect'||B.k==='card'){const H=B.k==='card'?B.th:h;
    if(s<.6){const k=io(s/.6);return{x:x+w*k,y:y+H*k,t:'cross',drag:1}}
    const fx=x+w*.5+B.side*Math.min(VW*.46,640),fy=y+H*.5-60;
    if(s<.98){const k=io((s-.6)/.38);return{x:lerp(x+w,fx,k),y:lerp(y+H,fy,k),t:'arrow'}}
    if(s<1.78){const k=io((s-.98)/.8);return{x:lerp(fx,x+w*.5,k),y:lerp(fy,y+H*.5,k)-Math.sin(Math.PI*k)*30,t:'arrow',grab:1,img:k}}
    return{x:x+w*.5+(s-1.78)*40,y:y+H*.5+(s-1.78)*40,t:'arrow'}}
  if(B.k==='kids'){const n=B.kids.length;if(s<.25){const c=B.kp[0];return{x:c.x+c.w*.5,y:c.y-Y0+c.h*.55,t:'arrow'}}
    const u=(s-.25)/.15,j=Math.min(n-1,Math.floor(u)),f=u-j,a=B.kp[j],b=B.kp[Math.min(n-1,j+1)],m=io(cl((f-.4)/.6));
    return{x:lerp(a.x+a.w*.5,b.x+b.w*.5,m),y:lerp(a.y,b.y,m)-Y0+a.h*.55,t:'arrow'}}
  if(B.k==='grid'){const c0=B.kp[0];if(s<.3)return{x:c0.x+c0.w,y:c0.y-Y0+c0.h,t:'arrow'};
    const k=io((s-.3)/1.9),ky=cl(k*2.4),kx=k,last=B.kp[B.kp.length-1];
    return{x:lerp(c0.x+c0.w,last.x+last.w,kx),y:lerp(c0.y+c0.h,last.y+last.h,ky)-Y0,t:'arrow',grab:1}}
  const ax=x+Math.min(w*.35,64),ay=y+Math.min(h*.5,16),fx=ax+B.side*Math.min(360,VW*.3);
  if(s<.32){const k=io(s/.32);return{x:lerp(ax,fx,k),y:ay-24*Math.sin(Math.PI*k),t:'arrow'}}
  const k=io((s-.32)/.72);return{x:lerp(fx,ax,k),y:ay-Math.sin(Math.PI*k)*14,t:'arrow',grab:1}}
function popPos(B){return{x:Math.min(B.x+B.w-210,VW-260),y:B.top-96}}

/* 元素本身随 s 的状态 */
function setText(B,n){if(n===B.nn)return;B.nn=n;B.caretDirty=true;const a=Math.min(n,B.split),e=Math.max(0,n-B.split);B.pre.textContent=B.txt.slice(0,a);B.emv.textContent=B.em.slice(0,e);B.inv.textContent=B.txt.slice(n)}
function apply(B){const s=B.s,el=B.el;
  if(B.k==='text'){const q=cl((s-.59)/(B.D-.59));setText(B,Math.round(B.txt.length*q));const on=s>.45;if(on!==B.on){B.on=on;el.style.opacity=on?1:0}B.car.style.display=(s>.55&&q<1)?'':'none';return}
  if(B.k==='head'){const q=cl((s-.22)/(B.T1-.22));setText(B,Math.round(B.txt.length*q));const on=s>.05;if(on!==B.on){B.on=on;el.style.opacity=on?1:0}
    B.car.style.display=(s>.12&&q<1)?'':'none';const raw=s<B.T1+.56;if(raw!==B.raw){B.raw=raw;el.classList.toggle('raw',raw)}return}
  if(Math.abs(s-B.last)<.0005)return;B.last=s;
  if(B.k==='rect'||B.k==='card'){const H=B.k==='card'?B.th:B.h;const k=s<.6?io(s/.6):1;
    el.style.opacity=s>0?1:0;
    const ch=B.k==='card'?(1-k*H/B.h):(1-k);el.style.clipPath=k<1?`inset(0 ${(1-k)*100}% ${ch*100}% 0 round 4px)`:'';
    if(B.k==='card'&&k<1)el.style.clipPath=`inset(0 ${(1-k)*100}% ${100-k*H/B.h*100}% 0)`;
    const f=cl((s-1.78)/.22);B.cv.style.opacity=f;
    if(B.k==='card')el.classList.toggle('ok',s>=1.9);return}
  if(B.k==='carry'){if(s<.32){el.style.opacity=0;el.style.transform='';el.style.filter='';el.style.willChange='';B.tx=B.ty=0;return}
    const P=pose(B,s),ax=B.x+Math.min(B.w*.35,64),ay=B.top+Math.min(B.h*.5,16),dx=P.x-ax,dy=P.y-ay,done=s>=B.D-.001;
    el.style.opacity=1;el.style.transform=done?'':`translate3d(${dx}px,${dy}px,0)`;el.style.filter=done?'':'drop-shadow(0 8px 16px rgba(20,20,40,.12))';el.style.willChange=done?'':'transform';B.tx=done?0:dx;B.ty=done?0:dy;return}
  if(B.k==='kids'){el.style.opacity=1;B.kids.forEach((c,j)=>{const v=cl((s-(.25+j*.15+.06))/.2);if(v!==B.kv[j]){B.kv[j]=v;c.style.opacity=v>0?1:0;c.style.transform=v<1?`scale(${back(v)})`:''}});return}
  if(B.k==='grid'){el.style.opacity=1;const P=pose(B,s);const mx=P.x,my=P.y+Y0;
    B.kids.forEach((c,j)=>{const r=B.kp[j],v=(s>.3||j===0)&&s>.05&&(r.x<=mx+1)&&(r.y<=my+1)?1:0;if(v!==B.kv[j]){B.kv[j]=v;c.style.opacity=v}});}}

/* ======================= 画布：光标 & Figma 叠层 ======================= */
const fx=document.getElementById('fx'),ctx=fx.getContext('2d');let DPR=1,canvasScaleX=1,canvasScaleY=1;
function rs(){innerWidth=scene.clientWidth;innerHeight=scene.clientHeight;VW=innerWidth;VH=innerHeight;refreshOrigin();const next=Math.min(2,(browser.devicePixelRatio||1)*Math.min(1,origin.sx)*embedScale,Math.sqrt(2400000/Math.max(1,VW*VH)));if(next!==DPR){for(const key of Object.keys(SPR))delete SPR[key];for(const key of Object.keys(NT))delete NT[key];}DPR=next;fx.width=Math.round(VW*DPR);fx.height=Math.round(VH*DPR);canvasScaleX=fx.width/VW;canvasScaleY=fx.height/VH;needL=1;if(initialized&&reduce.matches)layout();}
const SPR={};
function sprite(col,tool,down){const key=col+tool+(down?1:0);if(SPR[key])return SPR[key];const S=Math.ceil(44*DPR),c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.scale(DPR,DPR);x.translate(10,8);
  x.shadowColor='rgba(0,0,0,.28)';x.shadowBlur=down?2:4;x.shadowOffsetY=down?.5:1.5;x.lineJoin='round';
  if(tool==='arrow'){if(down)x.scale(.92,.92);x.beginPath();x.moveTo(0,0);x.lineTo(0,18.2);x.lineTo(5.1,13.4);x.lineTo(12.9,13.4);x.closePath();x.fillStyle=col;x.fill();x.shadowColor='transparent';x.lineWidth=1.4;x.strokeStyle='#fff';x.stroke()}
  else if(tool==='cross'){for(const[w,cc]of[[4,'#fff'],[1.6,'#111']]){x.lineWidth=w;x.strokeStyle=cc;x.lineCap='round';x.beginPath();x.moveTo(0,-9);x.lineTo(0,9);x.moveTo(-9,0);x.lineTo(9,0);x.stroke();x.shadowColor='transparent'}}
  else{for(const[w,cc]of[[4,'#fff'],[1.6,'#111']]){x.lineWidth=w;x.strokeStyle=cc;x.lineCap='round';x.beginPath();x.moveTo(-4,-10);x.quadraticCurveTo(0,-10,0,-7);x.quadraticCurveTo(0,-10,4,-10);x.moveTo(0,-7);x.lineTo(0,7);x.moveTo(-4,10);x.quadraticCurveTo(0,10,0,7);x.quadraticCurveTo(0,10,4,10);x.stroke();x.shadowColor='transparent'}}
  return SPR[key]=c}
const NT={};
function nameTag(col,name){const k=col+name;if(NT[k])return NT[k];const cv=document.createElement('canvas'),x=cv.getContext('2d');x.font='600 11px LeiBoxBuilderInter,sans-serif';const w=Math.ceil(x.measureText(name).width+12);cv.width=w*DPR;cv.height=19*DPR;x.scale(DPR,DPR);x.font='600 11px LeiBoxBuilderInter,sans-serif';x.beginPath();x.roundRect(0,0,w,19,4);x.fillStyle=col;x.fill();x.fillStyle='#fff';x.fillText(name,6,13.2);return NT[k]={cv,w}}
function drawC(c){if(c.a<.02)return;ctx.globalAlpha=c.a;const s=sprite(c.col,c.tool,c.down),S=s.width/DPR*c.sc;
  if(c.rot){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot);ctx.drawImage(s,-10*c.sc,-8*c.sc,S,S);ctx.restore()}else ctx.drawImage(s,c.x-10*c.sc,c.y-8*c.sc,S,S);
  if(c.name&&c.nm>.03){const t=nameTag(c.col,c.name);ctx.globalAlpha=c.a*c.nm;const ox=c.tool==='arrow'?9:11,oy=c.tool==='arrow'?16:11;ctx.drawImage(t.cv,c.x+ox,c.y+oy,t.w,19)}ctx.globalAlpha=1}
const BLUE='#0d99ff',RED='#f24822';
function pillT(t,x,y,col,a=1,anchor='c'){ctx.globalAlpha=a;ctx.font='500 10.5px LeiBoxBuilderInter,sans-serif';const w=ctx.measureText(t).width+10;const lx=anchor==='c'?x-w/2:x;ctx.beginPath();ctx.roundRect(lx,y,w,17,3);ctx.fillStyle=col;ctx.fill();ctx.fillStyle='#fff';ctx.fillText(t,lx+5,y+12.2);ctx.globalAlpha=1}
function selBox(x,y,w,h,a,label,size){if(w<1||h<1)return;ctx.globalAlpha=a;ctx.strokeStyle=BLUE;ctx.lineWidth=1;ctx.strokeRect(Math.round(x)+.5,Math.round(y)+.5,Math.round(w),Math.round(h));
  ctx.fillStyle='#fff';for(const[p,q]of[[x,y],[x+w,y],[x,y+h],[x+w,y+h]]){ctx.fillRect(Math.round(p)-3,Math.round(q)-3,7,7);ctx.strokeRect(Math.round(p)-3+.5,Math.round(q)-3+.5,6,6)}
  if(label){ctx.font='500 11px LeiBoxBuilderInter,sans-serif';ctx.fillStyle=BLUE;ctx.fillText(label,x,y-7)}ctx.globalAlpha=1;if(size)pillT(size,x+w/2,y+h+8,BLUE,a)}
function redV(x,y1,y2,a){if(y2-y1<6)return;ctx.globalAlpha=a;ctx.strokeStyle=RED;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+.5,y1);ctx.lineTo(x+.5,y2);ctx.moveTo(x-3,y1+.5);ctx.lineTo(x+4,y1+.5);ctx.moveTo(x-3,y2-.5);ctx.lineTo(x+4,y2-.5);ctx.stroke();ctx.globalAlpha=1;pillT(String(Math.round(y2-y1)),x+6,(y1+y2)/2-8,RED,a,'l')}
function guideV(x,a){ctx.globalAlpha=a*.9;ctx.strokeStyle=RED;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(Math.round(x)+.5,0);ctx.lineTo(Math.round(x)+.5,VH);ctx.stroke();ctx.globalAlpha=1}
function popover(B,a){const P=popPos(B),s=B.s,clicked=s>=B.T1+.56;ctx.globalAlpha=a;ctx.save();ctx.shadowColor='rgba(0,0,0,.14)';ctx.shadowBlur=24;ctx.shadowOffsetY=6;ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(P.x,P.y,232,78,10);ctx.fill();ctx.restore();ctx.globalAlpha=a;
  ctx.strokeStyle='#e8e8ea';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(P.x+.5,P.y+.5,231,77,10);ctx.stroke();
  ctx.font='600 11px LeiBoxBuilderInter,sans-serif';ctx.fillStyle='#111';ctx.fillText('Text',P.x+12,P.y+20);
  ctx.fillStyle=clicked?'#e7f4ff':'#f4f4f6';ctx.beginPath();ctx.roundRect(P.x+12,P.y+32,150,30,6);ctx.fill();if(clicked){ctx.strokeStyle=BLUE;ctx.stroke()}
  ctx.fillStyle='#f4f4f6';ctx.beginPath();ctx.roundRect(P.x+170,P.y+32,50,30,6);ctx.fill();
  ctx.font='500 12px LeiBoxBuilderInter,sans-serif';ctx.fillStyle='#111';ctx.fillText(clicked?B.el.dataset.f:'Inter',P.x+22,P.y+51.5);ctx.fillText(clicked?B.el.dataset.s:'15',P.x+180,P.y+51.5);
  ctx.fillStyle='#8a8c92';ctx.fillText('▾',P.x+148,P.y+51.5);ctx.globalAlpha=1}
const ripples=[];function ripple(x,y,col){ripples.push({x,y,col,t:0})}

/* 光标：7 只具名“设计师” + 5 只围观 */
let workers=[],crowd=[],all=[];
function makeCursors(){workers=[];crowd=[];for(let f=0;f<7;f++)workers.push({x:VW/2,y:VH/2,a:0,rot:0,sc:1,col:PAL[f],name:NAMES[f],nm:0,tool:'arrow',job:null,f,down:0,home:[.06+.88*((f*.37+.1)%1),.18+.64*((f*.61+.2)%1)],ph:Math.random()*6.28,tr:null});
  for(let i=0;i<5;i++)crowd.push({x:VW/2,y:VH/2,a:0,rot:0,sc:1,nm:0,name:['Nova','Jin','Mia','Theo','Lina'][i],col:['#7b61ff','#1bc47d','#ff7262','#18a0fb','#f7b500'][i],tool:'arrow',f:i,ph:Math.random()*6.28,tgt:i%7,sw:0,ox:0,oy:0});all=[...crowd,...workers]}

/* Browser-native scrolling stays on the compositor; the overlay follows passively. */
let documentHeight=0;
on(port,'scroll',()=>{scrollY=port.scrollTop;if(!reduce.matches)wake();},{passive:true});
/* ======================= 主循环 ======================= */
const logo=document.getElementById('logo'),bar=document.getElementById('bar'),pct=document.getElementById('pct'),wrapEl=document.getElementById('wrap'),flabel=document.getElementById('flabel');
const TOOLS={arrow:'t-move',cross:'t-rect',ibeam:'t-text'};let curTool='';
let needL=0;const contentResize=new browser.ResizeObserver(()=>{needL=1;if(initialized&&!reduce.matches)wake();});contentResize.observe(document.getElementById('wrap'));
let mode='intro',introStart=0,introT=0,last=performance.now(),frameN=0;
let rafId=0,nextFrame=0,initialized=false,logicalTime=0,suspended=true;
const media=browser.matchMedia('(prefers-reduced-motion: reduce)');const reduce={get matches(){return options.reducedMotion??media.matches;}};
function wake(){if(dead||!initialized||owner.hidden||!visible||!options.playing||reduce.matches||rafId)return;if(suspended){last=browser.performance.now();nextFrame=0;suspended=false;}rafId=browser.requestAnimationFrame(frame);document.body.dataset.animating='true';scene.dataset.running='true';}
function stop(){if(rafId)browser.cancelAnimationFrame(rafId);rafId=0;suspended=true;document.body.dataset.animating='false';scene.dataset.running='false';}
function staticView(){stop();blocks.forEach(B=>{B.s=B.D;B.w0=null;B.att=false;B.last=-1;B.nn=-1;apply(B);B.el.style.willChange='';});mode='build';wrapEl.style.clipPath='';document.body.classList.remove('lock');flabel.style.opacity=1;bar.classList.add('on');logo.style.opacity=0;ctx.clearRect(0,0,VW*DPR,VH*DPR);needL=1;}

function frame(realNow){rafId=0;if(dead||owner.hidden||!visible||!options.playing||reduce.matches){stop();return;}
  const interval=mode==='build'&&!workers.some(w=>w.job)&&!needL?1000/30:1000/60;
  if(realNow+0.1<nextFrame){wake();return;}nextFrame=Math.max(nextFrame+interval,realNow);
  const dt=Math.min(.05,(realNow-last)/1000)*options.speed;last=realNow;logicalTime+=dt*1000;const now=logicalTime;frameN++;scrollY=port.scrollTop;const T=(now-introStart)/1000;
  if(needL){needL=0;layout()}const Y=scrollY;Y0=Y;ctx.setTransform(canvasScaleX,0,0,canvasScaleY,0,0);ctx.clearRect(0,0,VW,VH);
  const W0=workers[0];

  if(mode==='intro'){const cx=VW/2,cy=VH/2;
    all.forEach((c,n)=>{const g=n%6,k=Math.floor(n/6),an=g*1.047+T*(g%2?1:-1)*(1.3+(g%3)*.15),r=92+(g%3)*30+Math.sin(T*1.7+g)*10;
      const lx=cx+Math.cos(an)*r*1.5,ly=cy+Math.sin(an)*r*.66,ta=an+(g%2?1.57:-1.57);
      c.x=lx-Math.cos(ta)*k*22;c.y=ly-Math.sin(ta)*k*22;c.rot=ta-1.25;c.a=Math.min(1,T*1.8)});
    if(T>2.3){mode='burst';introT=T;logo.style.transition='.5s cubic-bezier(.6,0,.2,1)';logo.style.opacity=0;logo.style.transform='translate(-50%,-50%) scale(.5)';
      for(const c of all){const a=Math.atan2(c.y-cy,c.x-cx)+(Math.random()-.5)*.5,d=260+Math.random()*240;c.bx=c.x;c.by=c.y;c.ex=cx+Math.cos(a)*d*1.5;c.ey=cy+Math.sin(a)*d;c.br=c.rot}}}
  else if(mode==='burst'){const k=cl((T-introT)/.6),e=out(k);for(const c of all){c.x=lerp(c.bx,c.ex,e);c.y=lerp(c.by,c.ey,e);c.rot=c.br*(1-e);c.nm=k}
    if(k>=1){mode='board';introT=T;W0.bx=W0.x;W0.by=W0.y}}
  else if(mode==='board'){const r=docPos(wrapEl),wx=r.x,wy=r.y-Y,ww=r.w,u=T-introT;
    if(u<.35){const k=io(u/.35);W0.x=lerp(W0.bx,wx,k);W0.y=lerp(W0.by,wy,k);W0.tool='arrow'}
    else{const k=io(cl((u-.35)/.75));W0.tool='cross';W0.down=1;W0.x=wx+ww*k;W0.y=wy+(VH-wy+40)*k;
      wrapEl.style.clipPath=`inset(0 ${(1-k)*100}% calc(100% - ${Math.max(1,(VH-wy+40)*k)}px) 0)`;
      selBox(wx,wy,ww*k,(VH-wy+40)*k,1,'Desktop',`${Math.round(ww*k)} × ${Math.round((VH-wy+40)*k)}`);
      if(k>=1){wrapEl.style.clipPath='';flabel.style.opacity=1;W0.down=0;W0.tool='arrow';ripple(W0.x,W0.y,W0.col);mode='build';introT=T;document.body.classList.remove('lock');bar.classList.add('on');needL=1}}
    for(const c of all){if(c!==W0){c.x+=Math.sin(now/900+c.f)*.15}}}

  if(mode==='build'){
    for(const B of blocks){B.top=B.y-Y;B.want=B.top<VH*.82?1:(B.top>VH*.92?-1:0);
      if(B.want===-1&&B.top>VH+60&&B.s>0&&!B.w0){B.s=0;B.last=-1;apply(B)}}
    // 派活：从上往下搭，从下往上拆
    for(const B of blocks){if(B.w0)continue;let need=0;
      if(B.want===1&&B.s<B.D){if(B.top+B.h<-20){B.s=B.D;B.last=-1;apply(B);continue}const P=blocks[B.i-1];if(!P||P.s>=Math.min(P.D,.2)||P.want!==1)need=1}
      if(B.want===-1&&B.s>0&&B.top<VH+60){const N=blocks[B.i+1];if(!N||N.s<=0)need=-1}
      if(!need)continue;
      const P0=pose(B,B.s);let best=null,bd=1e9;for(const w of workers){if(w.job)continue;const d=Math.hypot(w.x-P0.x,w.y-P0.y);if(d<bd){bd=d;best=w}}
      if(!best)break;best.job=B;B.w0=best;B.dir=need;B.att=false;best.tr={x:best.x,y:best.y,t:0,d:cl(bd/1500,.22,.55)}}

    const caretReads=[];
    for(const w of workers){const B=w.job;
      if(B){if(B.want!==0&&B.want!==B.dir)B.dir=B.want;
        if(!B.att){let P=pose(B,B.s);w.tr.t+=dt;const k=io(cl(w.tr.t/w.tr.d));w.x=lerp(w.tr.x,P.x,k);w.y=lerp(w.tr.y,P.y,k);w.tool=k>.85?P.t:'arrow';
          if(k>=1){B.att=true;ripple(P.x,P.y,w.col)}}
        else{const sp=B.dir===1?1:2.2,s0=B.s;B.s=cl(B.s+B.dir*sp*dt,0,B.D);
          const marks=B.k==='text'?[.45,.59]:B.k==='head'?[B.T1+.56]:(B.k==='rect'||B.k==='card')?[.6,.98,1.78]:B.k==='carry'?[.32,B.D-.01]:B.k==='grid'?[.3]:[];
          for(const m of marks)if((s0-m)*(B.s-m)<0){const Q=pose(B,m);ripple(Q.x,Q.y,w.col)}
          if(B.k==='kids')B.kids.forEach((c,j)=>{const m=.25+j*.15+.06;if((s0-m)*(B.s-m)<0){const r=B.kp[j];ripple(r.x+r.w/2,r.y-Y+r.h/2,w.col)}});
          apply(B);
          if(B.caretDirty&&((B.k==='text'&&B.s>.55)||(B.k==='head'&&B.s>.2&&B.s<B.T1)))caretReads.push({B,w});
          const P=pose(B,B.s);w.x=P.x;w.y=P.y;w.tool=P.t;w.down=(P.drag||P.grab)?1:0;
          if((B.dir===1&&B.s>=B.D)||(B.dir===-1&&B.s<=0)){B.doneT=now;B.w0=null;w.job=null;w.down=0;w.tool='arrow';w.tr=null}}
        }
      else{w.down=0;w.tool='arrow';const tx=VW*w.home[0]+Math.sin(now/1900+w.ph)*50,ty=VH*w.home[1]+Math.cos(now/1500+w.ph)*36,k=1-Math.exp(-dt*1.4);w.x+=(tx-w.x)*k;w.y+=(ty-w.y)*k}
      w.a+=((w.job?1:.85)-w.a)*(1-Math.exp(-dt*5));w.nm+=(1-w.nm)*(1-Math.exp(-dt*7))}
    // Refresh the host origin once after all writes, including when the outer document scrolls.
    if(caretReads.length)refreshOrigin();
    // All typing writes finish before reading any caret. Workers use the new positions this same frame.
    for(const {B}of caretReads){const c=docPos(B.car);B.cp={x:c.x+1,y:c.y+c.h*.55};B.caretDirty=false;if(B.k==='head')B.cpEnd=B.cp;}
    for(const {B,w}of caretReads){if(w.job===B){const p=pose(B,B.s);w.x=p.x;w.y=p.y;}}
    const busyW=workers.filter(w=>w.job);
    crowd.forEach((c,i)=>{let tx,ty,k=2;
      if(busyW.length){c.sw-=dt;if(c.sw<=0||!workers[c.tgt].job){c.tgt=busyW[(i+Math.floor(now/2600))%busyW.length].f;c.sw=2+Math.random()*2;const an=Math.random()*6.28,r=80+Math.random()*80;c.ox=Math.cos(an)*r;c.oy=Math.sin(an)*r*.6}
        const W=workers[c.tgt];tx=W.x+c.ox+Math.sin(now/900+c.ph)*10;ty=W.y+c.oy+Math.cos(now/800+c.ph)*8}
      else{tx=VW*(.08+.84*((i*.29+.13)%1))+Math.sin(now/2100+c.ph)*40;ty=VH*(.2+.6*((i*.53+.3)%1))+Math.cos(now/1700+c.ph)*30}
      c.x+=(tx-c.x)*(1-Math.exp(-dt*k));c.y+=(ty-c.y)*(1-Math.exp(-dt*k));c.a+=(.85-c.a)*(1-Math.exp(-dt*3));c.nm+=(1-c.nm)*(1-Math.exp(-dt*3))});

    // Figma 叠层
    for(const B of blocks){if(B.top>VH+40||B.top+B.h<-60||B.s<=0)continue;const ft=(now-B.doneT)/1000,showDone=!B.w0&&B.s>=B.D&&ft<.8,act=B.w0&&B.att,a=act?1:(showDone?1-ft/.8:0);if(a<=0)continue;
      const x=B.x,y=B.top,w=B.w,h=B.h,s=B.s;
      if(B.k==='text'){const k=s<.45?io(s/.45):1;selBox(x,y,w*k,h*k,a,s<.45?'Text':null,`${Math.round(w*k)} × ${Math.round(h*k)}`)}
      else if(B.k==='head'){selBox(x-2,y-2,w+4,(B.raw?26:h)+4,a,'Heading',B.raw?null:`${Math.round(w)} × ${Math.round(h)}`);
        if(s>B.T1-.05){const pa=a*cl((s-B.T1+.05)/.2)*(s>B.D-.3?(B.D-s)/.3:1);if(pa>0)popover(B,pa)}}
      else if(B.k==='rect'||B.k==='card'){const H=B.k==='card'?B.th:h,k=s<.6?io(s/.6):1;selBox(x,y,w*k,H*k,a,B.k==='card'?'Thumbnail':'Rectangle',`${Math.round(w*k)} × ${Math.round(H*k)}`);
        const P=pose(B,s);if(P.img!==undefined){const iw=lerp(150,w*.5,P.img*P.img),ih=iw*H/w;ctx.save();ctx.globalAlpha=.94;ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=24;ctx.shadowOffsetY=10;ctx.drawImage(B.cv,P.x-iw*.5,P.y-ih*.5,iw,ih);ctx.restore();
          pillT(B.cv.alt.toLowerCase().replace(/ /g,'-')+'.jpg',P.x+14,P.y+26,'#111',1,'l')}}
      else if(B.k==='kids'){const cnt=B.kv.filter(v=>v>0).length;let lastR=null;B.kp.forEach((r,j)=>{if(B.kv[j]>0)lastR=r});
        if(lastR){const bx=x,by=y,bw=w,bh=lastR.y+lastR.h-B.y;selBox(bx-6,by-6,bw+12,bh+12,a,'Auto layout',`${cnt} items · gap 10`);
          const j=cnt-1;if(j>0&&act){const r=B.kp[j],p=B.kp[j-1];if(Math.abs(r.y-p.y)<2){ctx.globalAlpha=.9;ctx.fillStyle='rgba(242,72,34,.18)';ctx.fillRect(p.x+p.w,r.y-Y,r.x-p.x-p.w,r.h);ctx.globalAlpha=1;pillT('10',(p.x+p.w+r.x)/2,r.y-Y-20,RED,a)}}}}
      else if(B.k==='grid'){const P=pose(B,s),c0=B.kp[0];selBox(c0.x,c0.y-Y,Math.max(c0.w,P.x-c0.x),Math.max(c0.h,P.y-(c0.y-Y)),a,'Repeat grid',`${B.kv.filter(v=>v).length} cells`);selBox(x,y,w,h,a*.35,null,null)}
      else{if(s<.32)continue;const P=pose(B,s),ax=x+Math.min(w*.35,64),ay=y+Math.min(h*.5,16),dx=P.x-ax,dy=P.y-ay;
        const near=1-cl(Math.abs(dx)/40);selBox(x+dx,y+dy,w,h,a,B.n,near>.6?`${Math.round(w)} × ${Math.round(h)}`:null);
        if(act&&near>0){guideV(x,near*a);const Pb=blocks[B.i-1];if(Pb&&Pb.s>0){const gap=y+dy-(Pb.top+Pb.h);if(gap>4&&gap<160&&Math.abs(Pb.x-x)<w)redV(x+w/2,Pb.top+Pb.h,y+dy,near*a)}}}}

    const tool=(busyW[0]&&busyW[0].tool)||'arrow';if(tool!==curTool){if(curTool)document.getElementById(TOOLS[curTool]).classList.remove('on');document.getElementById(TOOLS[tool]).classList.add('on');curTool=tool}
    if(frameN%8===0)pct.textContent=Math.round(100*Y/Math.max(1,documentHeight-VH))+'%';
  }
  for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;if(r.t>.45){ripples.splice(i,1);continue}const k=r.t/.45;ctx.globalAlpha=(1-k)*.7;ctx.strokeStyle=r.col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,3+k*14,0,6.283);ctx.stroke();ctx.globalAlpha=1}
  for(const c of all)drawC(c);
  syncScene();wake()}

function start(){stop();logicalTime=0;nextFrame=0;last=browser.performance.now();scrollTo({top:0,left:0,behavior:'instant'});document.body.classList.add('lock');bar.classList.remove('on');flabel.style.opacity=0;makeCursors();
  blocks.forEach(B=>{B.s=0;B.w0=null;B.att=false;B.dir=0;B.last=-1;B.nn=-1;B.on=null;B.raw=null;B.cp=null;B.cpEnd=null;B.doneT=-9;B.el.style.transform='';B.el.style.filter='';B.el.style.clipPath='';B.el.style.willChange='';B.caretDirty=false;B.tx=B.ty=0});
  layout();blocks.forEach(B=>{B.top=B.y;apply(B)});layout();blocks.forEach(B=>{if(B.k==='head')B.el.classList.add('morph')});
  wrapEl.style.clipPath='inset(0 100% 100% 0)';
  mode='intro';introStart=0;logo.style.transition='none';logo.style.opacity=1;logo.style.transform='translate(-50%,-50%) scale(1)';if(reduce.matches)staticView();else{if(options.skipIntro){mode='build';introT=0;wrapEl.style.clipPath='';flabel.style.opacity=1;document.body.classList.remove('lock');bar.classList.add('on');logo.style.opacity=0;needL=1;for(const c of all){c.a=c.nm=1;c.rot=0;c.x=VW*(c.home?c.home[0]:.15+c.f*.14);c.y=VH*(c.home?c.home[1]:.2+c.f*.12);}
    // Hidden preview iframes are throttled by Chromium. Seed the poster's visible
    // state before handing over; later scrolling still runs the native scheduler.
    if(scene.dataset.preview==='true'){scrollTo({top:220,left:0,behavior:'instant'});layout();for(const B of blocks){B.top=B.y-scrollY;if(B.top<VH*.82){B.s=B.D;B.last=-1;apply(B);}}layout();}
  }wake();}syncScene();}

function syncScene(){scene.dataset.phase=mode;scene.dataset.frame=String(frameN);pauseButton.textContent=options.playing?'Pause':'Resume';pauseButton.setAttribute('aria-pressed',String(!options.playing));bar.hidden=!options.showToolbar;if(announcedPhase!==mode){announcedPhase=mode;options.onPhaseChange?.(mode);}}
function replay(){options.playing=true;start();options.onReplay?.();}
on(document.getElementById('rp'),'click',replay);
on(pauseButton,'click',()=>{options.playing=!options.playing;if(options.playing)wake();else stop();syncScene();});
on(port,'click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const hash=link.getAttribute('href').slice(1),destination=hash?root.getElementById(hash):null;event.preventDefault();refreshOrigin();scrollTo({top:destination?docPos(destination).y:0,behavior:reduce.matches?'instant':'smooth'});});
on(port,'keydown',event=>{if(event.target.closest('button,a,input,textarea,select'))return;if(event.key.toLowerCase()==='r'){event.preventDefault();replay();}if(event.key===' '||event.key.toLowerCase()==='p'){event.preventDefault();options.playing=!options.playing;if(options.playing)wake();else stop();syncScene();}});
on(owner,'visibilitychange',()=>owner.hidden?stop():wake());
on(media,'change',()=>{if(reduce.matches)staticView();else wake();syncScene();});
const viewportResize=new browser.ResizeObserver(()=>{if(dead)return;rs();if(initialized&&!reduce.matches)wake();});viewportResize.observe(scene);
const intersection=new browser.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();});intersection.observe(scope.element);
on(browser,'message',event=>{const data=event.data;if(event.source!==browser.parent||data?.type!=='leibox-render-size'||data.slug!=='multi-cursor-builder'||!Number.isFinite(data.width)||data.width<=0)return;embedScale=Math.min(1,data.width/Math.max(1,scene.clientWidth));rs();});
const ready=fontLease.ready.then(()=>{if(dead)return;rs();initialized=true;start();scene.dataset.ready='true';scope.ready();});
return {...scope.controller,ready,update(next){if(dead)return;const previous={...options};options={...options,...next};normalize();scope.controller.update(next);if('skipIntro'in next&&previous.skipIntro!==options.skipIntro)start();if(reduce.matches)staticView();else if(options.playing)wake();else stop();bar.hidden=!options.showToolbar;syncScene();},destroy(){if(dead)return;dead=true;stop();contentResize.disconnect();viewportResize.disconnect();intersection.disconnect();fontLease.release();fx.width=fx.height=0;scope.controller.destroy();}};

}
