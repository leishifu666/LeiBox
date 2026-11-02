import {WHITE_CONTOURS} from './particle-texture-contours.mjs';
import {MOTION_MODELS} from './particle-texture-motion.mjs';

const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const mix=(a,b,t)=>a+(b-a)*t;
const fract=v=>v-Math.floor(v);
const centers=[182.5,480,779.5];
const lattice=Float32Array.from({length:4096},(_,i)=>fract(Math.sin((i%64)*127.1+Math.floor(i/64)*311.7)*43758.5453));
function noise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const at=(dx,dy)=>lattice[((iy+dy)&63)*64+((ix+dx)&63)];
 return mix(mix(at(0,0),at(1,0),u),mix(at(0,1),at(1,1),u),v);
}
function boundary(x,y,index){
 const square=index===2?.60:.74,circle=index===2?.42:.44,offset=1-circle;
 return Math.min(Math.max(Math.abs(x),Math.abs(y))-square,
  Math.hypot(x,y-offset)-circle,Math.hypot(x,y+offset)-circle,
  Math.hypot(x-offset,y)-circle,Math.hypot(x+offset,y)-circle,
  index===2?10:(Math.abs(x)+Math.abs(y)-1.02)/Math.SQRT2);
}
function contourDistance(x,y){
 let inside=false,distance=10;
 for(const polygon of WHITE_CONTOURS)for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [ax,ay]=polygon[j],[bx,by]=polygon[i],vx=bx-ax,vy=by-ay;
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  const t=clamp(((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy));
  distance=Math.min(distance,Math.hypot(x-ax-vx*t,y-ay-vy*t));
 }
 return inside?distance:-distance;
}
export function particleMotionCoefficients(x,y,index,seed){
 if(index===1){
  const amplitude=.08+.42*seed,phase=seed*TAU;
  return [amplitude*Math.cos(phase),0,amplitude*Math.sin(phase),0];
 }
 const model=MOTION_MODELS.find(value=>value.panel===index),tx=[1,x],ty=[1,y],coefficients=[0,0,0,0];
 for(let i=2;i<=model.degree;i++){tx.push(2*x*tx[i-1]-tx[i-2]);ty.push(2*y*ty[i-1]-ty[i-2]);}
 for(let i=0;i<=model.degree;i++)for(let j=0;j<=model.degree;j++){
  const weight=tx[i]*ty[j],row=model.coefficients[i*(model.degree+1)+j];
  for(let k=0;k<4;k++)coefficients[k]+=row[k]*weight;
 }
 return coefficients;
}
function makePoints(){return centers.map((_,index)=>{
 const dots=[];
 for(let row=-27;row<=27;row++)for(let col=-27;col<=27;col++){
  const x=col*4.485/122,y=row*4.485/122,edge=boundary(x,y,index);
  if(edge>.012)continue;
  const white=index===1?clamp(.5+contourDistance(x,y)/.022):1;
  if(white===0)continue;
  const seed=fract(Math.sin(col*127.1+row*311.7+index*74.7)*43758.5453);
  dots.push({x,y,edge,white,seed,motion:particleMotionCoefficients(x,y,index,seed)});
 }
 return dots;
});}
const palettes=[
 [[130,179,5],[144,190,18],[182,205,170],[180,192,244]],
 [[255,255,255],[255,255,255],[255,255,255],[255,255,255]],
 [[218,148,77],[204,95,95],[185,31,80],[155,3,59]],
];
function makeColors(){return palettes.map(stops=>Array.from({length:48},(_,i)=>{
 const t=i/47*3,k=Math.min(2,Math.floor(t)),f=t-k;
 return stops[k].map((v,j)=>Math.round(mix(v,stops[k+1][j],f)));
}));}
const points=makePoints(),colors=makeColors();

export function drawParticleTextures(ctx,time,{background='#000'}={}){
 ctx.fillStyle=background;ctx.fillRect(0,0,960,540);
 const phase=(time%3)*TAU/3,cos=Math.cos(phase),sin=Math.sin(phase),lightBackground=background==='#f4f4f4';
 for(let index=0;index<3;index++){
  const buckets=Array.from({length:48*16},()=>[]);
  for(const p of points[index]){
   const {x,y,seed}=p;
   const nx=x*5.2+.65*cos,ny=y*5.2+.65*sin;
   const coarse=noise(nx+index*11,ny+index*7),fine=noise(nx*2.5+9,ny*2.5+19);
   const sparkle=.5+.5*Math.sin(seed*TAU+phase*2);
   // Each anchor has its own ellipse axes and phase; direction follows its
   // coefficient determinant, rather than translating one shared noise field.
   const dx=p.motion[0]*cos+p.motion[2]*sin,dy=p.motion[1]*cos+p.motion[3]*sin;
   let radius,brightness,hue;
   if(index===0){
    // Separate local grain from the continuous displacement field.
    const ridge=.5+.5*Math.sin(coarse*17+fine*5+phase),energy=.45*ridge+.55*sparkle;
    radius=.75+1.55*energy;
    brightness=.62+.38*energy;
    const sweep=Math.exp(-(((y-(.38+.23*Math.sin(phase)-.20*Math.sin(x*3+phase)))/.33)**2));
    hue=clamp((y+1)/2+.14*(coarse-.5)+.09*sweep);
    radius=(radius+.20*sweep)*.93;
   }else if(index===1){
    radius=(.80+.49*coarse+.33*sparkle)*Math.sqrt(p.white);
    brightness=clamp(.28+.85*noise(x*3+cos,y*3+sin+43)+.25*Math.max(0,-y))*p.white;
    if(Math.hypot(x,y)<.15)brightness=.95*p.white;
    hue=0;
   }else{
    const rim=Math.exp(-Math.abs(p.edge)*33);
    const ridge=.5+.5*Math.sin(coarse*17+fine*5+phase),energy=.45*ridge+.55*sparkle;
    radius=.75+1.55*energy;
    brightness=.48+.52*energy;
    hue=clamp((y+1)/2+.07*(coarse-.5));
    if(y>.12&&rim>.42)hue=.05+.26*(1-rim);
   }
   const px=centers[index]+x*122+dx,py=270+y*122+dy;
   const shade=Math.round(clamp(brightness)*15),color=Math.round(hue*47);
   buckets[color*16+shade].push(px,py,radius);
  }
  for(let i=0;i<buckets.length;i++){
   const dots=buckets[i];if(!dots.length)continue;
   const c=index===1&&lightBackground?[38,38,38]:colors[index][Math.floor(i/16)],brightness=(i%16)/15;
   const glint=index!==1&&Math.floor(i/16)>18?Math.max(0,(brightness-.85)/.15)**2*.24:0;
   ctx.fillStyle=`rgb(${c.map(v=>{const lit=mix(v,255,glint);return Math.round(lightBackground?mix(244,lit,brightness):lit*brightness);}).join(',')})`;
   ctx.beginPath();for(let j=0;j<dots.length;j+=3){ctx.moveTo(dots[j]+dots[j+2],dots[j+1]);ctx.arc(dots[j],dots[j+1],dots[j+2],0,TAU);}ctx.fill();
  }
 }
}

// Keep the copied specification mathematically identical to the delivered drawing core.
export function getParticleTextureAlgorithm(){
 return [
  'const TAU=Math.PI*2;',
  'const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));',
  'const mix=(a,b,t)=>a+(b-a)*t;',
  'const fract=v=>v-Math.floor(v);',
  `const centers=${JSON.stringify(centers)},WHITE_CONTOURS=${JSON.stringify(WHITE_CONTOURS)},MOTION_MODELS=${JSON.stringify(MOTION_MODELS)},palettes=${JSON.stringify(palettes)};`,
  'const lattice=Float32Array.from({length:4096},(_,i)=>fract(Math.sin((i%64)*127.1+Math.floor(i/64)*311.7)*43758.5453));',
  noise.toString(),boundary.toString(),contourDistance.toString(),particleMotionCoefficients.toString(),makePoints.toString(),makeColors.toString(),
  'const points=makePoints(),colors=makeColors();',drawParticleTextures.toString(),
 ].join('\n');
}
