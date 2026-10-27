// Canvas reconstruction from Acream's 4.97s reference; no video texture or screenshots.
const panels=[...document.querySelectorAll('.cosmos-panel')];
const canvases=panels.map(panel=>panel.querySelector('.cosmos-canvas'));
const graph=document.querySelector('.astronaut-graph');
const contexts=canvases.map(canvas=>canvas.getContext('2d'));
const graphContext=graph.getContext('2d');
const DPR=Math.min(2,window.devicePixelRatio||1);
canvases.forEach(canvas=>{canvas.width=574*DPR;canvas.height=724*DPR;});
graph.width=285*DPR;graph.height=333*DPR;
const map=document.createElement('canvas');map.width=720;map.height=360;
const mapContext=map.getContext('2d');mapContext.fillStyle='#fff';
// Natural Earth 1:110m land polygons, public domain. Coordinates are rounded for size.
for(const polygon of LAND){mapContext.beginPath();for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)*2,y=(90-lat)*2;if(i===0)mapContext.moveTo(x,y);else mapContext.lineTo(x,y);});mapContext.closePath();}mapContext.fill('evenodd');}
const land=mapContext.getImageData(0,0,720,360).data;
function line(ctx,points,color,width=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function flare(ctx,x,y,scale,alpha){
  ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,18*scale);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#ffffffa8');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(x-20*scale,y-20*scale,40*scale,40*scale);
  const ray=ctx.createLinearGradient(x-190*scale,y,x+190*scale,y);ray.addColorStop(0,'#ffffff00');ray.addColorStop(.5,'#ffffffbb');ray.addColorStop(1,'#ffffff00');ctx.fillStyle=ray;ctx.fillRect(x-190*scale,y-.6,380*scale,1.2);
  ctx.fillStyle='#fff';ctx.beginPath();[[0,-7],[1,-1],[7,0],[1,1],[0,7],[-1,1],[-7,0],[-1,-1]].forEach(([dx,dy],i)=>i?ctx.lineTo(x+dx*scale,y+dy*scale):ctx.moveTo(x+dx*scale,y+dy*scale));ctx.closePath();ctx.fill();ctx.restore();
}
function loading(ctx,t){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#dcd9e9';ctx.fillRect(0,0,574,724);
  const bg=ctx.createLinearGradient(0,0,180,620);bg.addColorStop(0,'#9b96de');bg.addColorStop(.26,'#3b3acb');bg.addColorStop(.7,'#cecae7');bg.addColorStop(1,'#dcd9e9');ctx.fillStyle=bg;ctx.fillRect(0,0,574,724);
  const navy=ctx.createRadialGradient(470,-45,5,470,-45,530);navy.addColorStop(0,'#131120');navy.addColorStop(.38,'#171238ed');navy.addColorStop(.76,'#292aca33');navy.addColorStop(1,'#2629bc00');ctx.fillStyle=navy;ctx.fillRect(0,0,574,724);
  flare(ctx,287,90,1,.7+.25*Math.sin(t*1.9));flare(ctx,287,575,.8,.52+.2*Math.cos(t*1.9));
  ctx.fillStyle='#fff';for(let i=0;i<4;i++){ctx.globalAlpha=.7+.3*Math.sin(t*3+i);ctx.fillRect(101+i%2*8,198+Math.floor(i/2)*8,5,5);}ctx.globalAlpha=1;ctx.font='14px Arial,sans-serif';ctx.fillText('Loading...',122,207);
  for(let ring=0;ring<5;ring++){
    const angle=t*.72+ring*Math.PI/5;ctx.beginPath();
    for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;const x=287+100*Math.cos(a)*Math.cos(angle)+13*Math.sin(a)*Math.sin(angle),y=372+98*Math.sin(a);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    ctx.strokeStyle=`rgba(255,255,255,${.27+Math.abs(Math.sin(angle))*.23})`;ctx.lineWidth=.62;ctx.stroke();
  }
}
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function clouds(ctx,t){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#dad7e5';ctx.fillRect(0,0,574,724);ctx.fillStyle='#2422d6';
  for(let y=3;y<724;y+=7)for(let x=3;x<574;x+=7){
    const nx=x/574,ny=y/724;
    const wave=Math.sin(nx*8+Math.sin(ny*6+t*.6)*1.7+t*.65)*Math.cos(ny*8-t*.45)+.45*Math.sin((nx+ny)*15-t*.6);
    const density=(wave+1.25)/2.6,threshold=bayer[((y/7|0)%4)*4+(x/7|0)%4]/16;
    if(density>threshold){const radius=.8+Math.min(1.8,Math.max(0,density)*1.9);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();}
  }
}
function diagram(ctx,t){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,285,333);
  line(ctx,[[0,174],[224,174]],'#c5c4bf',.55);
  for(let i=0;i<6;i++){
    const direction=i<3?-1:1,dist=(i%3+1)*9,phase=Math.sin(t*.85+i*.25);
    ctx.beginPath();ctx.moveTo(0,174);ctx.bezierCurveTo(96,174,180+phase*7,174+direction*dist*.1,218,174+direction*dist*(.7+.3*Math.sin(t*.8+.5)));
    ctx.strokeStyle=i===0||i===4?'#bfc1c5':'#707276';ctx.lineWidth=.55;ctx.stroke();
    if(i===0||i===4){ctx.fillStyle=i===0?'#9695e5':'#ceced2';ctx.fillRect(216,172+direction*dist*(.7+.3*Math.sin(t*.8+.5)),3,3);}
  }
  flare(ctx,224,174,.022,.9);
  ctx.save();ctx.translate(250,296);ctx.rotate(t*.35);ctx.strokeStyle='#eeeee9';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(0,0,10,12,-.6,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,14,4,.3,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function globe(ctx,t){
  const cx=306,cy=246,r=211;
  for(let y=-r;y<r;y+=5)for(let x=-r;x<r;x+=5){
    const nx=x/r,ny=y/r;if(nx*nx+ny*ny>1)continue;const z=Math.sqrt(1-nx*nx-ny*ny);
    const lat=Math.asin(-ny),lon=Math.atan2(nx,z)+t*.45+.6;
    const u=((lon/(Math.PI*2)+.5)%1+1)%1,v=.5-lat/Math.PI;
    const isLand=land[(Math.min(359,Math.floor(v*360))*720+Math.min(719,Math.floor(u*720)))*4+3]>0;
    const radius=isLand?1.3+z*.9:.45;ctx.fillStyle=isLand?`rgba(59,48,207,${.45+z*.35})`:'rgba(66,55,172,.31)';ctx.beginPath();ctx.arc(cx+x,cy+y,radius,0,Math.PI*2);ctx.fill();
  }
}
function cube(ctx,cx,cy,phase,t){
  cy+=Math.sin(t*1.28+phase)*34;const w=112,d=50,h=112;
  const poly=(points,gradient)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=gradient;ctx.fill();};
  const left=ctx.createLinearGradient(cx-w,cy,cx,cy+d+h);left.addColorStop(0,'#c1c5fb');left.addColorStop(.4,'#6c7bdf');left.addColorStop(1,'#11164d');
  poly([[cx-w,cy],[cx,cy+d],[cx,cy+d+h],[cx-w,cy+h]],left);
  const right=ctx.createLinearGradient(cx+w,cy,cx,cy+d+h);right.addColorStop(0,'#ced0fb');right.addColorStop(.4,'#465bc6');right.addColorStop(1,'#090a19');
  poly([[cx,cy+d],[cx+w,cy],[cx+w,cy+h],[cx,cy+d+h]],right);
  const top=ctx.createLinearGradient(cx-w,cy,cx+w,cy);top.addColorStop(0,'#03030a');top.addColorStop(.32,'#283cca');top.addColorStop(.72,'#8e99ee');top.addColorStop(1,'#e4e4f4');
  poly([[cx-w,cy],[cx,cy-d],[cx+w,cy],[cx,cy+d]],top);
  ctx.save();ctx.transform(1,.42,0,1,cx-34,cy+52);ctx.fillStyle='#fff';ctx.fillRect(0,0,22,7);ctx.fillStyle='#c7c9df';ctx.fillRect(3,2,3,2);ctx.fillRect(9,2,9,1);ctx.restore();
}
function servers(ctx,t){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#d7d3e9';ctx.fillRect(0,0,574,724);
  const glow=ctx.createRadialGradient(250,500,20,250,500,460);glow.addColorStop(0,'#aeb7ef');glow.addColorStop(1,'#d7d3e9');ctx.fillStyle=glow;ctx.fillRect(0,0,574,724);globe(ctx,t);
  [[147,218,-.3],[147,337,.3],[468,326,1.2],[257,379,.9],[367,454,1.9],[468,528,2.3],[257,511,1.6]].forEach(([x,y,p])=>cube(ctx,x,y,p,t));
}
let animation=0,time=0,last=0,paused=false;
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
function draw(){loading(contexts[0],time);clouds(contexts[1],time);diagram(graphContext,time);servers(contexts[2],time);document.querySelector('.cosmos-demo').dataset.time=time.toFixed(3);document.body.dataset.motionReady='true';}
function start(){if(!animation&&!paused&&!media.matches&&!document.hidden)animation=requestAnimationFrame(tick);}
function tick(now){animation=0;time+=last?Math.min(.06,(now-last)/1000):0;last=now;draw();start();}
function toggle(){paused=!paused;panels.forEach(p=>p.setAttribute('aria-pressed',String(paused)));if(paused){cancelAnimationFrame(animation);animation=0;}else{last=0;start();}}
for(const panel of panels){panel.addEventListener('click',toggle);panel.addEventListener('keydown',event=>{if(event.code==='Space'||event.key==='Enter'){event.preventDefault();toggle();}});}
media.addEventListener('change',()=>{cancelAnimationFrame(animation);animation=0;last=0;draw();start();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(animation);animation=0;}else{last=0;start();}});
draw();start();
