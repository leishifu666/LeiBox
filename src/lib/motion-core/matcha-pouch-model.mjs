import * as THREE from 'three';
import {POWDER_EROSION_GLSL} from './matcha-powder-simulation.mjs';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function pouchDepth(u,v,back=false){
 const x=u*512,y=(1-v)*576,r=Math.hypot(x-256,y-301),a=clamp((u-.045)/.91),b=clamp((v-.06)/.82);
 const bulge=29*Math.pow(Math.max(0,Math.sin(Math.PI*a)*Math.sin(Math.PI*b)),.7);
 let fold=0;for(const [slope,offset,strength]of[[.72,47,5.5],[-.72,531,4.1],[.3,340,2],[-.31,430,2.5]]){const d=y-slope*x-offset;fold+=strength*(Math.exp(-((d/15)**2))-.5*Math.exp(-(((d+13)/22)**2)));}
 const seal=u<.045||u>.955?Math.sin(y*1.13)*.55:v<.048||v>.953?Math.sin(x*1.3)*.55:0;
 const stamp=back?0:4.7*Math.exp(-(((r-96)/5)**2))-2.8*Math.exp(-(((r-82)/5)**2))-1.6*Math.exp(-((r/72)**6));
 return (back?-1:1)*(.9+bulge+(fold+stamp)*Math.sin(Math.PI*a)*Math.sin(Math.PI*b)+seal);
}
/** Two connected surfaces with perimeter walls: the bag is closed even from the side. */
function closedSurface(v0,v1,nx,ny){
 const positions=[],uvs=[],indices=[],row=nx+1,faceSize=row*(ny+1);
 for(let side=0;side<2;side++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
  const u=x/nx,v=v0+y/ny*(v1-v0);let px=(u-.5)*450;
  if(u>.972&&v>.865&&v<.9)px-=12*(1-Math.abs(v-.8825)/.0175);
  positions.push(px,(v-.5)*500,pouchDepth(u,v,Boolean(side)));uvs.push(u,v);
 }
 for(let side=0;side<2;side++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=side*faceSize+y*row+x,b=a+1,c=a+row,d=c+1;if(!side)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);}
 const frontCount=nx*ny*6,edge=(a,b)=>indices.push(a,b,a+faceSize,b,b+faceSize,a+faceSize);
 for(let x=0;x<nx;x++){edge(x+1,x);edge(ny*row+x,ny*row+x+1);}for(let y=0;y<ny;y++){edge(y*row,(y+1)*row);edge((y+1)*row+nx,y*row+nx);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.addGroup(0,frontCount,0);g.addGroup(frontCount,indices.length-frontCount,1);g.computeVertexNormals();g.computeBoundingBox();return g;
}
export function createPouch(texture,doc,dissolve){
 const group=new THREE.Group(),geometries=[closedSurface(0,.915,96,104),closedSurface(.915,1,96,8)];
 const backCanvas=doc.createElement('canvas');backCanvas.width=256;backCanvas.height=288;const c=backCanvas.getContext('2d'),g=c.createLinearGradient(0,0,256,0);g.addColorStop(0,'#116f35');g.addColorStop(.6,'#238d46');g.addColorStop(1,'#14753b');c.fillStyle=g;c.fillRect(0,0,256,288);c.fillStyle='#08562b';c.fillRect(122,15,13,258);c.fillStyle='#8ebc7560';for(let y=15;y<273;y+=4)c.fillRect(122,y,13,1);
 const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;
 const make=map=>new THREE.MeshPhysicalMaterial({map,metalness:.45,roughness:.30,clearcoat:.45,clearcoatRoughness:.23,envMapIntensity:1.35});
 const front=make(texture),rear=make(backTexture),capFront=front.clone(),capRear=rear.clone();
 capFront.transparent=capRear.transparent=true;
 for(const m of[front,rear])m.onBeforeCompile=shader=>{shader.uniforms.uDissolve=dissolve;shader.fragmentShader='uniform float uDissolve;\n'+POWDER_EROSION_GLSL+shader.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nif(uDissolve>0.&&powderThreshold(vMapUv)<uDissolve)discard;');};
 const body=new THREE.Mesh(geometries[0],[front,rear]),cap=new THREE.Mesh(geometries[1],[capFront,capRear]);group.add(body,cap);
 const rest=geometries.map(g=>g.attributes.position.array.slice()),grip=new THREE.Vector3(218,215,3);let cache='',lastRip=-1;
 function update(q,pull,age,burst){cap.visible=age<.95;if(!cap.visible)return;capFront.opacity=capRear.opacity=clamp((.95-age)/.4);const flight=1-Math.exp(-age*6),key=[q,pull.x,pull.y,pull.z,pull.twist,age].join(':');if(key===cache)return;cache=key;const threshold=1-q;
  const p=geometries[1].attributes.position,uv=geometries[1].attributes.uv;
  for(let i=0;i<p.count;i++){const u=uv.getX(i),x=rest[1][i*3],y=rest[1][i*3+1],z=rest[1][i*3+2];let px=x,py=y,pz=z;
   if(q>.0001&&u>threshold){const k=(u-threshold)/q,L=450*q,bell=Math.sin(k*Math.PI),dy=y-207.5;
    px=225-450*q+(450*q+pull.x)*k+L*.36*bell;
    const twist=k*q*.75+(pull.twist||0)*bell;
    py=207.5+pull.y*k+42*q*bell+dy*Math.cos(twist);
    pz=z+(pull.z??45*q)*k+90*q*bell+dy*Math.sin(twist);
   }
   if(flight>0){const a=.40+burst.x*age*.35,tx=-225+(x+225)*Math.cos(a)-(y-207.5)*Math.sin(a)+(burst.x*125-25)*age,ty=207.5+(x+225)*Math.sin(a)+(y-207.5)*Math.cos(a)+(210+burst.y*80)*age-140*age*age;p.setXYZ(i,THREE.MathUtils.lerp(px,tx,flight),THREE.MathUtils.lerp(py,ty,flight),THREE.MathUtils.lerp(pz,z+80*flight,flight));}else p.setXYZ(i,px,py,pz);
  }p.needsUpdate=true;geometries[1].computeVertexNormals();
  if(lastRip!==q){const bp=geometries[0].attributes.position,bu=geometries[0].attributes.uv;for(let i=0;i<bp.count;i++){if(bu.getY(i)<.9149)continue;const u=bu.getX(i),rip=u>threshold?(Math.sin(u*181)+Math.sin(u*399))*.9:0;bp.setY(i,rest[0][i*3+1]-rip);}bp.needsUpdate=true;lastRip=q;}
  grip.set(218+pull.x,215+pull.y,3+(pull.z??45*q));
 }
 return{group,body,cap,grip,update,thickness:geometries[0].boundingBox.max.z-geometries[0].boundingBox.min.z,dispose(){geometries.forEach(g=>g.dispose());[front,rear,capFront,capRear].forEach(m=>m.dispose());backTexture.dispose();backCanvas.width=backCanvas.height=1;}};
}
