import * as THREE from 'three';

// The same erosion field drives the disappearing foil and each grain's release time.
export const POWDER_EROSION_GLSL = `
float powderHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float powderNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(powderHash(i),powderHash(i+vec2(1.,0.)),f.x),mix(powderHash(i+vec2(0.,1.)),powderHash(i+1.),f.x),f.y);}
float powderThreshold(vec2 uv){float n=.7*powderNoise(uv*vec2(12.,15.))+.3*powderNoise(uv*vec2(33.,28.));return clamp((.915-uv.y)/.915+(n-.5)*.19,0.,1.);}
`;
const FLOW_GLSL = `
vec3 powderCurl(vec3 p,float t){
 float a=p.z*.011+p.y*.016+t*.73,b=p.x*.013+p.z*.017-t*.65,c=p.y*.014+p.x*.012+t*.58;
 return vec3(.014*cos(c)-.017*cos(b),.011*cos(a)-.012*cos(c),.013*cos(b)-.016*cos(a))*35.;
}
`;
export function createMatchaPowder(image,surfaceDepth){
 let state=17;
 const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state+.5)/4294967296;};
 const gaussian=()=>Math.max(-3,Math.min(3,Math.sqrt(-2*Math.log(rnd()))*Math.cos(6.28318530718*rnd())));
 const elapsed={value:0},pixelScale={value:1},burst={value:new THREE.Vector3(-.15,.1,1)},releaseMatrix={value:new THREE.Matrix4()};
 const uniforms={elapsed,pixelScale,burst,releaseMatrix};
 const count=26000,position=new Float32Array(count*3),uv=new Float32Array(count*2),seed=new Float32Array(count*4),launch=new Float32Array(count*3),tint=new Float32Array(count*3),pixels=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
 const col=new THREE.Color();
 for(let i=0;i<count;i++){
  const u=rnd(),v=rnd()*.915,fine=rnd(),depth=gaussian()*14;
  position.set([(u-.5)*450,(v-.5)*500,surfaceDepth(u,v)+depth],i*3);uv.set([u,v],i*2);seed.set([rnd(),rnd(),rnd(),fine],i*4);
  // Gaussian launch velocities have tapered tails, unlike a bounded rectangular scatter.
  launch.set([gaussian()*(fine<.68?170:120),(fine<.68?120:-10)+gaussian()*80,gaussian()*85],i*3);
  const k=(Math.min(image.height-1,Math.floor((1-v)*image.height))*image.width+Math.floor(u*image.width))*4;col.setRGB(pixels[k]/255,pixels[k+1]/255,pixels[k+2]/255,THREE.SRGBColorSpace).toArray(tint,i*3);
 }
 const grainGeometry=new THREE.BufferGeometry();grainGeometry.setAttribute('position',new THREE.BufferAttribute(position,3));grainGeometry.setAttribute('sourceUv',new THREE.BufferAttribute(uv,2));grainGeometry.setAttribute('seed',new THREE.BufferAttribute(seed,4));grainGeometry.setAttribute('launch',new THREE.BufferAttribute(launch,3));grainGeometry.setAttribute('tint',new THREE.BufferAttribute(tint,3));
 const grainMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms,vertexShader:`
 attribute vec2 sourceUv;attribute vec4 seed;attribute vec3 launch;attribute vec3 tint;
 uniform float elapsed;uniform float pixelScale;uniform vec3 burst;uniform mat4 releaseMatrix;
 varying vec4 vColor;varying vec2 vShape;
 ${POWDER_EROSION_GLSL}${FLOW_GLSL}
 void main(){
  float birth=.06+.54*powderThreshold(sourceUv),age=max(0.,elapsed-birth),fine=1.-step(.68,seed.w);
  float drag=mix(.65,1.5,fine),travel=(1.-exp(-drag*age))/drag;
  vec3 origin=(releaseMatrix*vec4(position,1.)).xyz;
  vec3 velocity=mat3(releaseMatrix)*launch*burst.z;
  velocity.xy+=burst.xy*vec2(110.,65.);
  vec3 p=origin+velocity*travel;
  float loosen=1.-exp(-age*2.8);
  p.x-=origin.x*.12*loosen;
  p+=powderCurl(origin+velocity*age*.35,age+seed.z*.8)*(35.+seed.y*48.)*loosen;
  p.y+=fine*50.*age*exp(-age*.45)-.5*mix(135.,30.,fine)*age*age;
  float life=mix(1.5+seed.x*.9,1.8+seed.x*1.25,fine),alpha=smoothstep(0.,.07,elapsed-birth)*(1.-smoothstep(life*.48,life,age));
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  float perspective=clamp(1483./max(1.,-mv.z),.65,1.7);
  gl_PointSize=(mix(1.8,4.7,seed.y)-fine*.65)*pixelScale*perspective;
  vec3 powder=mix(vec3(.20,.29,.075),vec3(.55,.64,.27),seed.z);
  vColor=vec4(mix(tint,powder,smoothstep(0.,.14,age)),alpha*(.34+seed.x*.5));vShape=vec2(seed.y,seed.z);
 }`,fragmentShader:`
 varying vec4 vColor;varying vec2 vShape;
 void main(){vec2 q=(gl_PointCoord-.5)*2.;float a=vShape.y*6.283;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));q=r*q;q.x*=1.+vShape.x*.5;float d=length(q);float edge=1.-smoothstep(.45,1.,d);float light=.82+.18*clamp(1.-dot(q,vec2(.4,.7)),0.,1.);gl_FragColor=vec4(vColor.rgb*light,vColor.a*edge);
 #include <colorspace_fragment>
 }`});
 const grains=new THREE.Points(grainGeometry,grainMaterial);grains.frustumCulled=false;

 const puffCount=96,base=new THREE.PlaneGeometry(1,1),puffGeometry=new THREE.InstancedBufferGeometry();puffGeometry.index=base.index;puffGeometry.attributes.position=base.attributes.position;puffGeometry.attributes.uv=base.attributes.uv;
 const origins=new Float32Array(puffCount*3),velocities=new Float32Array(puffCount*3),puffSeed=new Float32Array(puffCount*4);
 for(let i=0;i<puffCount;i++){
  const lobe=i%7,side=(lobe-3)/3;
  origins.set([side*140+gaussian()*17,202+gaussian()*14,gaussian()*24],i*3);
  velocities.set([side*90+gaussian()*30,150+gaussian()*35,gaussian()*45],i*3);
  puffSeed.set([rnd()*.36,52+rnd()*58,rnd(),rnd()],i*4);
 }
 puffGeometry.setAttribute('origin',new THREE.InstancedBufferAttribute(origins,3));puffGeometry.setAttribute('velocity',new THREE.InstancedBufferAttribute(velocities,3));puffGeometry.setAttribute('seed',new THREE.InstancedBufferAttribute(puffSeed,4));puffGeometry.instanceCount=puffCount;
 const puffMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms,vertexShader:`
 attribute vec3 origin;attribute vec3 velocity;attribute vec4 seed;
 uniform float elapsed;uniform vec3 burst;uniform mat4 releaseMatrix;
 varying vec2 vUv;varying vec3 vPuff;
 ${FLOW_GLSL}
 void main(){
  float age=max(0.,elapsed-seed.x),travel=(1.-exp(-age*1.1))/1.1;
  vec3 start=(releaseMatrix*vec4(origin,1.)).xyz,vel=mat3(releaseMatrix)*velocity*mix(.85,1.2,burst.z-.6);
  vel.xy+=burst.xy*vec2(95.,45.);vec3 p=start+vel*travel;
  p+=powderCurl(start+vel*age*.3,age)*65.*(1.-exp(-age*2.));p.y+=25.*age;
  float radius=(18.+seed.y*(1.-exp(-age*1.45)))*(1.+age*.13);
  float angle=seed.z*6.28+age*(seed.w-.5)*.5;mat2 rotation=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
  vec2 offset=rotation*(position.xy*radius*2.*vec2(1.15,.86));
  vec4 mv=modelViewMatrix*vec4(p,1.);mv.xy+=offset;gl_Position=projectionMatrix*mv;
  float life=2.2+seed.z*1.1;float opacity=smoothstep(0.,.22,elapsed-seed.x)*(1.-smoothstep(life*.38,life,age));
  vUv=uv;vPuff=vec3(opacity*(.085+seed.w*.055),seed.z*17.,age);
 }`,fragmentShader:`
 varying vec2 vUv;varying vec3 vPuff;
 ${POWDER_EROSION_GLSL}
 void main(){
  vec2 q=(vUv-.5)*2.;float n=powderNoise(q*2.8+vPuff.y+vec2(vPuff.z*.13,-vPuff.z*.2));
  q+=vec2(n-.5,powderNoise(q*2.+vPuff.y+7.)-.5)*.25;
  float r=length(q),edge=1.-smoothstep(.55,1.,r);float density=exp(-2.6*r*r)*edge*(.65+.35*n);
  vec3 color=mix(vec3(.32,.42,.10),vec3(.48,.57,.22),n);
  gl_FragColor=vec4(color,vPuff.x*density);
  #include <colorspace_fragment>
 }`});
 const dust=new THREE.Mesh(puffGeometry,puffMaterial);dust.frustumCulled=false;dust.renderOrder=1;
 const group=new THREE.Group();group.add(grains,dust);group.visible=false;
 const stamp=image.ownerDocument.createElement('canvas');stamp.width=stamp.height=128;const c=stamp.getContext('2d'),gradient=c.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#9aac6260');gradient.addColorStop(.55,'#9aac6224');gradient.addColorStop(1,'#9aac6200');c.fillStyle=gradient;c.fillRect(0,0,128,128);
 function drawFallback(ctx,seconds){
  if(seconds<0)return;const force=burst.value;
  for(let i=0;i<puffCount;i+=2){const k=i*4,j=i*3,age=seconds-puffSeed[k];if(age<=0)continue;const life=2.2+puffSeed[k+2]*1.1,fade=Math.max(0,1-age/life),travel=(1-Math.exp(-age*1.1))/1.1,r=18+puffSeed[k+1]*(1-Math.exp(-age*1.45));ctx.globalAlpha=fade*.5;ctx.drawImage(stamp,origins[j]+(velocities[j]+force.x*95)*travel-r,-origins[j+1]-(velocities[j+1]+force.y*45)*travel-age*25-r,r*2.3,r*1.72);}
  ctx.fillStyle='#879e4a';
  for(let i=0;i<count;i+=13){const k=i*4,j=i*3,age=seconds-(.06+.54*(.915-uv[i*2+1])/.915);if(age<=0)continue;const fine=seed[k+3]<.68,drag=fine?1.5:.65,travel=(1-Math.exp(-drag*age))/drag,life=fine?1.8+seed[k]*1.25:1.5+seed[k]*.9,fade=Math.max(0,1-age/life);if(!fade)continue;const x=position[j]+(launch[j]*force.z+force.x*110)*travel+Math.sin(position[j+1]*.015+age)*45*(1-Math.exp(-age*2)),y=position[j+1]+launch[j+1]*travel+(fine?50*age*Math.exp(-age*.45):0)-.5*(fine?30:135)*age*age;ctx.globalAlpha=fade*.6;ctx.beginPath();ctx.arc(x,-y,.6+seed[k+1]*1.7,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 }
 return {group,elapsed,pixelScale,burst,releaseMatrix,drawFallback,update(seconds){elapsed.value=Math.max(0,seconds);group.visible=seconds>=0;},dispose(){grainGeometry.dispose();grainMaterial.dispose();puffGeometry.dispose();puffMaterial.dispose();stamp.width=stamp.height=1;}};
}
