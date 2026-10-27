/* global scope, CP_PAPER_IMAGES */
// Independent mesh and material implementation. Paper-face image provenance is recorded separately.
const demo=document.querySelector('.crumple-demo');
const canvas=demo.querySelector('.cp-canvas'),shadow=demo.querySelector('.cp-shadows');
const buttons=[...demo.querySelectorAll('.cp-hit')];
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function random(seed){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
const textures=buttons.map(()=>{const c=document.createElement('canvas');c.width=1200;c.height=1500;const ctx=c.getContext('2d');ctx.fillStyle='#f4f0e7';ctx.fillRect(0,0,c.width,c.height);return c;});
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
let width=1200,height=800,density=1,frame=0,last=0,destroyed=false,loaded=0;
const papers=buttons.map((button,i)=>({p:0,v:0,target:0,seed:41+i*13,button,texture:null,relief:null,buffer:null,count:0}));
let program,uniforms,attributes;

// A folded sheet is piecewise planar at several scales, with rounded grooves at
// its shared edges. A height field keeps the highlights coherent across triangles.
function paperRelief(index){
 const w=512,h=640,field=new Float32Array(w*h),valley=new Float32Array(w*h),rand=random(729+index*113);
 for(const [cols,rows,amplitude,groove] of [[11,14,2.4,.045],[23,29,.52,.025],[45,56,.10,.008]]){
  const points=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)points.push({x:(x+(x&&x<cols?(rand()-.5)*.8:0))*w/cols,y:(y+(y&&y<rows?(rand()-.5)*.8:0))*h/rows,z:(rand()-.5)*amplitude*2});
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
   for(const ids of ((x+y)%2?[[a,b,d],[a,d,c]]:[[a,b,c],[b,d,c]])){
    const [a,b,c]=ids.map(i=>points[i]),area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
    const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x)));
    const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    const altA=Math.abs(area)/Math.hypot(b.x-c.x,b.y-c.y),altB=Math.abs(area)/Math.hypot(a.x-c.x,a.y-c.y),altC=Math.abs(area)/Math.hypot(a.x-b.x,a.y-b.y);
    for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){
     const u=((b.y-c.y)*(px+.5-c.x)+(c.x-b.x)*(py+.5-c.y))/area,v=((c.y-a.y)*(px+.5-c.x)+(a.x-c.x)*(py+.5-c.y))/area,t=1-u-v;
     if(u<0||v<0||t<0)continue;
     const at=py*w+px,edge=Math.min(u*altA,v*altB,t*altC),crease=Math.exp(-edge*edge/(groove>.15?2.4:1.1));
     field[at]+=u*a.z+v*b.z+t*c.z-groove*crease;
     valley[at]=Math.max(valley[at],crease*groove*2.2);
    }
   }
  }
 }
 // Two old letter folds have a rounded trough and an offset, finer raised lip.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const at=y*w+x;
  for(const fold of [1/3,2/3]){const d=y-h*(fold+(x/w-.5)*.006);field[at]-=.28*Math.exp(-d*d/3.4);field[at]+=.13*Math.exp(-(d-2.1)*(d-2.1)/4.8);valley[at]=Math.max(valley[at],.28*Math.exp(-d*d/2));}
 }
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),pixels=ctx.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const at=y*w+x,i=at*4;
  const dx=(field[y*w+Math.min(w-1,x+1)]-field[y*w+Math.max(0,x-1)])*.5*w/296;
  const dy=(field[Math.min(h-1,y+1)*w+x]-field[Math.max(0,y-1)*w+x])*.5*h/374;
  pixels.data[i]=clamp(Math.round(128+dx*100),0,255);pixels.data[i+1]=clamp(Math.round(128+dy*100),0,255);pixels.data[i+2]=clamp(Math.round(valley[at]*255),0,255);pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);return {canvas:c,field,w,h};
}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function uploadTexture(source){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return texture;}
if(gl){
 gl.getExtension('OES_standard_derivatives');
 const vs=shader(gl.VERTEX_SHADER,`precision highp float;
 attribute vec3 a_closed;attribute vec3 a_flat;attribute vec2 a_uv;
 uniform float u_progress;uniform float u_pass;uniform vec2 u_size;uniform vec2 u_center;uniform float u_scale;
 varying vec2 v_uv;varying vec3 v_position;
 void main(){
  float p=u_progress;vec3 pos=mix(a_closed,a_flat,p);
  pos.z+=sin(p*3.14159265)*sin(a_uv.x*8.0+a_uv.y*11.0)*13.0;
  v_position=pos;v_uv=a_uv;vec2 xy=pos.xy;
  if(u_pass>0.5){float above=max(0.0,pos.z+mix(80.0,9.0,p));xy+=vec2(.23,.30)*above;}
  float camera=u_pass>0.5?1.0:1000.0/(1000.0-pos.z);
  vec2 screen=xy*camera*u_scale+u_center;
  gl_Position=vec4(screen.x/u_size.x*2.0-1.0,1.0-screen.y/u_size.y*2.0,-pos.z/400.0,1.0);
 }`);
 const fs=shader(gl.FRAGMENT_SHADER,`#extension GL_OES_standard_derivatives : enable
 precision highp float;
 uniform sampler2D u_texture;uniform sampler2D u_relief;uniform float u_progress;uniform float u_pass;
 varying vec2 v_uv;varying vec3 v_position;
 vec3 toLinear(vec3 c){return pow(c,vec3(2.2));}
 void main(){
  if(u_pass>0.5){gl_FragColor=vec4(.17,.145,.11,1.0);return;}
  vec3 dx=dFdx(v_position),dy=dFdy(v_position),n=normalize(cross(dx,dy));if(n.z<0.0)n=-n;
  vec2 tx=dFdx(v_uv),ty=dFdy(v_uv);float determinant=tx.x*ty.y-tx.y*ty.x;
  vec3 tangent=normalize((dx*ty.y-dy*tx.y)/determinant);
  vec3 bitangent=normalize((dy*tx.x-dx*ty.x)/determinant);
  vec3 crease=texture2D(u_relief,v_uv).rgb;
  vec2 slope=(crease.rg*255.0-128.0)/100.0;
  n=normalize(n-(tangent*slope.x+bitangent*slope.y)*mix(.48,.95,u_progress));
  vec3 light=normalize(vec3(-.30,-.48,.82)),fill=normalize(vec3(.7,.15,.6));
  float key=max(0.0,dot(n,light)),soft=max(0.0,dot(n,fill));
  float lighting=mix(.12+.91*key+.10*soft,.30+.67*key+.12*soft,u_progress);
  float rake=max(0.0,dot(n,normalize(vec3(-.55,-.78,.32))));
  lighting+=u_progress*(rake-.32)*.16;
  float occlusion=mix(.80+.20*smoothstep(-75.0,65.0,v_position.z),1.0,u_progress);
  lighting*=occlusion*(1.0-crease.b*mix(.12,.055,u_progress));
  vec3 ink=texture2D(u_texture,v_uv).rgb;
  vec3 back=mix(vec3(.961,.946,.905),ink,.045);
  vec3 color=toLinear(gl_FrontFacing?ink:back)*lighting;
  vec3 halfLight=normalize(light+vec3(0.0,0.0,1.0));
  float satin=pow(max(0.0,dot(n,halfLight)),38.0)*.045;
  color+=vec3(satin);gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(1.0/2.2)),1.0);
 }`);
 program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 uniforms=Object.fromEntries(['progress','pass','size','center','scale','texture','relief'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));attributes=Object.fromEntries(['closed','flat','uv'].map(n=>[n,gl.getAttribLocation(program,'a_'+n)]));
 papers.forEach((paper,index)=>{
  const cols=32,rows=40,rand=random(paper.seed),points=[],vertices=[],relief=paperRelief(index);
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
   const u=(x+(x&&x<cols?(rand()-.5)*.7:0))/cols,v=(y+(y&&y<rows?(rand()-.5)*.7:0))/rows;
   const cu=u-.5,cv=v-.5,rho=Math.hypot(cu,cv),angle=rho*4.82;
   const fold=Math.sin(u*31+v*10+index)*Math.sin(v*28-u*8)*.12+Math.sin(u*65-v*23)*.048;
   const r=1+fold*.65,rx=index===1?90:72,ry=index===1?87:102;
   const closed=[Math.sin(angle)*(rho?cu/rho:0)*rx*r,Math.sin(angle)*(rho?cv/rho:0)*ry*r,Math.cos(angle)*76*r];
   // A small asymmetry avoids a lathed silhouette and makes the outer lips curl.
   closed[0]+=Math.sin(v*18+index*2)*5.5;closed[1]+=Math.sin(u*17+index)*4;
   const front=Math.max(0,Math.cos(angle*.65));
   closed[2]+=(Math.sin(v*25+Math.sin(u*12)*1.8)*17+Math.sin(u*34-v*7)*9)*front;
   closed[0]+=Math.sin(v*25+u*15)*5*front;closed[1]+=Math.sin(u*25-v*11)*5*front;
   if(index===1){
    closed[2]-=34*Math.exp(-((u-.55)**2+(v-.46)**2)/.025);
    const curl=clamp((u-.78)/.22,0,1);const t=curl*curl*(3-2*curl);
    closed[0]=closed[0]*(1-t)+(66+Math.cos(curl*4.7124)*22+Math.sin(v*26)*5)*t;
    closed[1]=closed[1]*(1-t)+((v-.5)*164+Math.sin(v*31)*6)*t;
    closed[2]=closed[2]*(1-t)+(90+Math.sin(v*28)*17+Math.sin(curl*Math.PI)*10)*t;
   }
   const at=Math.min(relief.h-1,Math.floor(v*relief.h))*relief.w+Math.min(relief.w-1,Math.floor(u*relief.w));
   const edgeU=Math.sin(v*33+index)*.55+Math.sin(v*63)*.24,edgeV=Math.sin(u*35+index)*.55+Math.sin(u*59)*.26;
   const flat=[(u-.5)*296+edgeU,(v-.5)*374+edgeV,relief.field[at]*.72+Math.sin(u*7+v*4)*.5];
   points.push([...closed,...flat,u,v]);
  }
  // Keep actual triangle edge lengths while compacting the sheet. The excess
  // area buckles into folds instead of being compressed onto a smooth sphere.
  const constraints=[],seen=new Set();
  function edge(a,b){const key=Math.min(a,b)*points.length+Math.max(a,b);if(seen.has(key))return;seen.add(key);const p=points[a],q=points[b];constraints.push([a,b,Math.hypot(p[3]-q[3],p[4]-q[4])*1.48]);}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
   edge(a,b);edge(a,c);edge(b,d);edge(c,d);if((x+y)%2)edge(a,d);else edge(b,c);
  }
  for(let step=0;step<260;step++){
   const reverse=step%2;
   for(let j=0;j<constraints.length;j++){
    const [a,b,length]=constraints[reverse?constraints.length-1-j:j],p=points[a],q=points[b];
    const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],distance=Math.hypot(dx,dy,dz)||1,t=(distance-length)/distance*.42;
    p[0]+=dx*t;p[1]+=dy*t;p[2]+=dz*t;q[0]-=dx*t;q[1]-=dy*t;q[2]-=dz*t;
   }
   for(const p of points){const r=Math.hypot(p[0]/(index===1?94:76),p[1]/(index===1?94:108),p[2]/84);if(r>1){const t=(1/r-1)*.68;p[0]+=p[0]*t;p[1]+=p[1]*t;p[2]+=p[2]*t;}}
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;
   for(const at of ((x+y)%2?[a,b,d,a,d,c]:[a,b,c,b,d,c]))vertices.push(...points[at]);
  }
  paper.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,paper.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);paper.count=vertices.length/8;
  paper.texture=uploadTexture(textures[index]);paper.relief=uploadTexture(relief.canvas);relief.canvas.width=relief.canvas.height=1;
 });
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.frontFace(gl.CW);demo.dataset.renderer='webgl';
}else{demo.dataset.renderer='canvas-fallback';}
function renderPass(pass,k){
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
 gl.uniform2f(uniforms.size,width,height);gl.uniform1f(uniforms.scale,k);gl.uniform1i(uniforms.texture,0);gl.uniform1i(uniforms.relief,1);gl.uniform1f(uniforms.pass,pass);
 papers.forEach((paper,index)=>{
  gl.bindBuffer(gl.ARRAY_BUFFER,paper.buffer);
  for(const [name,size,offset]of [['closed',3,0],['flat',3,12],['uv',2,24]]){gl.enableVertexAttribArray(attributes[name]);gl.vertexAttribPointer(attributes[name],size,gl.FLOAT,false,32,offset);}
  gl.uniform1f(uniforms.progress,clamp(paper.p,0,1));gl.uniform2f(uniforms.center,width/2+(index-1)*332*k,height/2);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paper.texture);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,paper.relief);
  gl.drawArrays(gl.TRIANGLES,0,paper.count);
 });
}
function draw(){
 if(destroyed)return;
 const k=Math.min(width/1200,height/800),ctx=shadow.getContext('2d');ctx.setTransform(density,0,0,density,0,0);ctx.clearRect(0,0,width,height);
 if(gl){
  // Project the same folded mesh onto the ground. This preserves its silhouette
  // and moves the shadow as the paper rises; no fixed ellipse under a floating ball.
  renderPass(1,k);ctx.save();ctx.filter=`blur(${4*k}px)`;ctx.globalAlpha=.17;ctx.drawImage(canvas,0,0,width,height);ctx.filter=`blur(${9*k}px)`;ctx.globalAlpha=.07;ctx.drawImage(canvas,0,0,width,height);ctx.restore();renderPass(0,k);
 }
 papers.forEach((paper,index)=>{
  const p=clamp(paper.p,0,1),cx=width/2+(index-1)*332*k,cy=height/2;
  paper.button.style.cssText=`left:${cx}px;top:${cy}px;width:${(index===1?184:168)+(296-(index===1?184:168))*p}px;height:${(index===1?185:218)+(374-(index===1?185:218))*p}px;--cp-k:${k}`;
  paper.button.dataset.progress=p.toFixed(4);
 });
 if(!gl){const c=canvas.getContext('2d');c.setTransform(density,0,0,density,0,0);c.clearRect(0,0,width,height);papers.forEach((paper,i)=>{const p=paper.p,k2=k*(.48+p*.52);c.drawImage(textures[i],width/2+(i-1)*332*k-148*k2,height/2-187*k2,296*k2,374*k2);});}
 if(loaded===textures.length){demo.dataset.motionReady='true';document.body.dataset.motionReady='true';}
}
const images=CP_PAPER_IMAGES.map((src,index)=>{
 const img=document.createElement('img');
 img.onload=()=>{if(destroyed)return;textures[index].getContext('2d').drawImage(img,0,0,1200,1500);if(gl){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,papers[index].texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textures[index]);}loaded++;draw();};
 img.onerror=()=>{if(!destroyed){loaded++;draw();}};img.src=src;return img;
});
function tick(time){
 frame=0;if(destroyed)return;const dt=Math.min(.032,(time-(last||time-16))/1000);last=time;let moving=false;
 papers.forEach(paper=>{if(media.matches){paper.p=paper.target;paper.v=0;}else{const steps=3,h=dt/steps;for(let j=0;j<steps;j++){paper.v+=((paper.target-paper.p)*210-paper.v*26)*h;paper.p+=paper.v*h;}if(Math.abs(paper.p-paper.target)<.0002&&Math.abs(paper.v)<.002){paper.p=paper.target;paper.v=0;}else moving=true;}});
 draw();if(moving)frame=requestAnimationFrame(tick);else last=0;
}
function wake(){if(!frame&&!destroyed)frame=requestAnimationFrame(tick);}
function activate(index){papers.forEach((paper,i)=>{paper.target=i===index?1:0;paper.button.setAttribute('aria-expanded',String(i===index));if(media.matches){paper.p=paper.target;paper.v=0;}});demo.dataset.active=String(index);if(media.matches)draw();else wake();}
let pointer='mouse';
buttons.forEach((button,i)=>{
 button.addEventListener('pointerenter',event=>{pointer=event.pointerType;if(pointer!=='touch')activate(i);});
 button.addEventListener('pointerdown',event=>{pointer=event.pointerType;});
 button.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'&&!button.matches(':focus-visible'))activate(-1);});
 button.addEventListener('focus',()=>{if(pointer!=='touch')activate(i);});button.addEventListener('blur',()=>activate(-1));
 button.addEventListener('click',event=>{if(event.detail===0||pointer==='touch')activate(papers[i].target? -1:i);else activate(i);});
 button.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();activate(-1);}else if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();buttons[(i+(event.key==='ArrowRight'?1:2))%3].focus();}});
});
document.addEventListener('keydown',()=>{pointer='keyboard';},true);
function resize(){const rect=demo.getBoundingClientRect();width=rect.width||1200;height=rect.height||800;density=Math.min(2,window.devicePixelRatio||1);for(const c of [canvas,shadow]){c.width=Math.round(width*density);c.height=Math.round(height*density);}draw();}
const observer=new ResizeObserver(resize);observer.observe(demo);
media.addEventListener('change',()=>{if(media.matches){papers.forEach(p=>{p.p=p.target;p.v=0;});draw();}else wake();});
function dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();if(gl){papers.forEach(p=>{gl.deleteBuffer(p.buffer);gl.deleteTexture(p.texture);gl.deleteTexture(p.relief);});gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}images.forEach(img=>{img.onload=img.onerror=null;img.removeAttribute('src');});textures.forEach(t=>{t.width=t.height=1;});}
window.addEventListener('pagehide',dispose,{once:true});
if(typeof scope!=='undefined')scope.addCleanup(dispose);
resize();
