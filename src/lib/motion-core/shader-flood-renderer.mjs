// Independently authored procedural marbling; no reference footage or author shader.
const VERTEX=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT=`#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 uv;
uniform vec2 size,origin;
uniform float progress,time,seed;
uniform vec3 low,mid,high;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.533;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){n+=a*noise(p);p=m*p*2.03+vec2(4.7,1.3);a*=.5;}return n;}
void main(){
 vec2 pixel=vec2(uv.x,1.-uv.y)*size;
 vec2 b=size*.5-1.,d=abs(pixel-size*.5)-b+28.;
 float rounded=length(max(d,0.))+min(max(d.x,d.y),0.)-28.;
 float radius=progress*1.5*length(size)*.70710678;
 float circle=length(pixel-origin*size)-radius;
 float alpha=(1.-smoothstep(-.65,.65,rounded))*(1.-smoothstep(-.65,.65,circle));
 if(alpha<.001)discard;
 vec2 p=(uv-.5)*vec2(size.x/size.y,1.)*2.4+vec2(seed*.173,seed*.097);
 float t=time*.15;
 vec2 q=vec2(fbm(p+vec2(t*.22,-t*.17)),fbm(p+vec2(5.2,1.3)+vec2(-t*.18,t*.23)))-.5;
 vec2 r=vec2(fbm(p+3.3*q+vec2(1.7,9.2)+t*.13),fbm(p+3.3*q+vec2(8.3,2.8)-t*.12))-.5;
 float field=fbm(p+3.0*r+1.0*q);
 float f=smoothstep(.17,.77,field);
 vec3 color=mix(low,mid,smoothstep(.05,.57,f));
 color=mix(color,high,pow(smoothstep(.72,.99,f),1.7)*.58);
 float slope=length(vec2(dFdx(field),dFdy(field)))*size.y*.17;
 float crease=(1.-smoothstep(.006,.034,abs(field-.43)))*.88;
 crease+=(1.-smoothstep(.003,.018,abs(field-.59)))*.24;
 color=mix(color,low*.28,min(crease,.94));
 color+=high*pow(max(0.,1.-slope*2.),8.)*.025;
 color*=mix(.24,1.12,smoothstep(-.08,1.,uv.y));
 gl_FragColor=vec4(color,alpha);
}`;

export function createFloodRenderer(stage,{force2D=false,onLost}={}){
 const owner=stage.ownerDocument,canvas=owner.createElement('canvas');
 canvas.className='sf-canvas';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
 let gl,program,buffer,locations,mode='canvas2d',dead=false,ratio=1;
 try{
  if(force2D)throw new Error('Software rendering requested');
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,depth:false,stencil:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl||!gl.getExtension('OES_standard_derivatives'))throw new Error('WebGL derivatives unavailable');
  const shaders=[];
  try{
   for(const [type,source]of[[gl.VERTEX_SHADER,VERTEX],[gl.FRAGMENT_SHADER,FRAGMENT]]){
    const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
   }
   program=gl.createProgram();shaders.forEach(shader=>gl.attachShader(program,shader));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  }finally{shaders.forEach(shader=>gl.deleteShader(shader));}
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  locations=Object.fromEntries(['size','origin','progress','time','seed','low','mid','high'].map(name=>[name,gl.getUniformLocation(program,name)]));
  mode='webgl';
 }catch{
  if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
  // A canvas cannot change context type; replace only this renderer's node.
  const replacement=canvas.cloneNode();canvas.replaceWith(replacement);
  return createSoftwareRenderer(replacement);
 }
 const lost=event=>{event.preventDefault();if(!dead)onLost?.();};canvas.addEventListener('webglcontextlost',lost);
 function resize(width,height,dpr){ratio=dpr;const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
 function draw(cards,time){
  if(dead||gl.isContextLost())return;
  gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.enable(gl.SCISSOR_TEST);
  for(const card of cards){if(card.progress<=0)continue;
   const x=Math.round(card.x*ratio),y=canvas.height-Math.round((card.y+card.height)*ratio),w=Math.round(card.width*ratio),h=Math.round(card.height*ratio);
   gl.viewport(x,y,w,h);gl.scissor(x,y,w,h);
   gl.uniform2f(locations.size,card.width,card.height);gl.uniform2fv(locations.origin,card.origin);gl.uniform1f(locations.progress,card.progress);
   gl.uniform1f(locations.time,time);gl.uniform1f(locations.seed,card.seed);
   gl.uniform3fv(locations.low,card.colors[0]);gl.uniform3fv(locations.mid,card.colors[1]);gl.uniform3fv(locations.high,card.colors[2]);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  gl.disable(gl.SCISSOR_TEST);
 }
 return {canvas,mode,resize,draw,destroy(){if(dead)return;dead=true;canvas.removeEventListener('webglcontextlost',lost);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}};
}

function createSoftwareRenderer(canvas){
 const ctx=canvas.getContext('2d'),css=rgb=>'rgb('+rgb.map(c=>Math.round(c*255)).join(',')+')';let ratio=1,dead=false;
 return {canvas,mode:'canvas2d',resize(w,h,dpr){ratio=dpr;const width=Math.max(1,Math.round(w*dpr)),height=Math.max(1,Math.round(h*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}},
  draw(cards,time){if(dead)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,canvas.width/ratio,canvas.height/ratio);
   for(const c of cards){if(c.progress<=0)continue;ctx.save();ctx.translate(c.x,c.y);ctx.beginPath();ctx.roundRect(1,1,c.width-2,c.height-2,28);ctx.clip();ctx.beginPath();ctx.arc(c.origin[0]*c.width,c.origin[1]*c.height,c.progress*1.5*Math.hypot(c.width,c.height)/Math.SQRT2,0,Math.PI*2);ctx.clip();
    const fill=ctx.createLinearGradient(0,c.height,c.width*.25,0);c.colors.forEach((color,i)=>fill.addColorStop(i/2,css(color)));ctx.fillStyle=fill;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<24;i++){const phase=i*.91+c.seed*.39,timeShift=time*.18;ctx.beginPath();
     for(let j=0;j<=24;j++){const x=j/24*c.width,y=(i/23)*c.height+Math.sin(j*.44+phase+timeShift)*24+Math.sin(j*.95-phase*.71-timeShift)*12;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
     ctx.strokeStyle=i%3?'#00000028':'#ffffff33';ctx.lineWidth=i%3?3:8;ctx.stroke();}
    const shade=ctx.createLinearGradient(0,c.height*.35,0,c.height);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#0009');ctx.fillStyle=shade;ctx.fillRect(0,0,c.width,c.height);ctx.restore();
   }
  },destroy(){dead=true;canvas.width=0;canvas.height=0;canvas.remove();}};
}
