// Solid procedural meshes with per-pixel depth, then screen-space Bayer halftoning.
// The screen pixels are the particles; sampling mesh vertices leaves the wrong sparse texture.
function rasterThinkingFaces(faces,width,height,pixels,depth) {
  pixels.fill(0);depth.fill(-Infinity);
  const edge=(a,b,x,y)=>(x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
  for(const face of faces)for(let i=1;i<face.verts.length-1;i++){
    const a=face.verts[0],b=face.verts[i],c=face.verts[i+1],area=edge(a,b,c[0],c[1]);
    if(Math.abs(area)<1e-8)continue;
    const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      const u=edge(b,c,x+.5,y+.5)/area,v=edge(c,a,x+.5,y+.5)/area,w=1-u-v;
      if(u< -1e-7||v< -1e-7||w< -1e-7)continue;
      const z=u*a[2]+v*b[2]+w*c[2],index=y*width+x;
      if(z<depth[index])continue;
      depth[index]=z;const offset=index*4;
      pixels[offset]=pixels[offset+1]=pixels[offset+2]=face.shade;pixels[offset+3]=255;
    }
  }
  return pixels;
}
function createThinkingRenderer(canvas) {
  const ctx = canvas.getContext('2d', {alpha:true});
  const cell = 3;
  const pixels=new Uint8ClampedArray(180*177*4),depthBuffer=new Float32Array(180*177);
  const bayer = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const ease = t=>{t=clamp(t);return t*t*(3-2*t);};
  const hash = n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const normalize = p=>{const n=Math.hypot(...p)||1;return p.map(x=>x/n);};
  const shapes = [0,2.53,6.52,10.0,15.78];
  const morphDuration=.90, assemblyDuration=1.10;
  let faces = [], part=0, previousIndex=-1, lastPixels=[], originPixels=[];
  const staticMeshes=new Map();
  const turn = (p,angle,axis)=>{
    const a=(axis+1)%3,b=(axis+2)%3,c=Math.cos(angle),s=Math.sin(angle),q=[...p];
    q[a]=p[a]*c-p[b]*s;q[b]=p[a]*s+p[b]*c;return q;
  };
  function face(vertices,normal,material=0,group=part) {
    faces.push({vertices,normal,material,group});
  }
  function box(center,size,bevel=.018,material=0,angle=0,group=part) {
    const half=size.map(x=>x/2),inset=half.map(x=>Math.max(.001,x-bevel));
    const put=(v,n)=>face(v.map(p=>turn(p,angle,2).map((x,i)=>x+center[i])),turn(n,angle,2),material,group);
    for(let axis=0;axis<3;axis++){
      const a=(axis+1)%3,b=(axis+2)%3;
      for(const sign of [-1,1]){
        const n=[0,0,0];n[axis]=sign;
        put([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const p=[0,0,0];p[axis]=sign*half[axis];p[a]=u*inset[a];p[b]=v*inset[b];return p;}),n);
      }
    }
    for(let axis=0;axis<3;axis++){
      const a=(axis+1)%3,b=(axis+2)%3;
      for(const sa of [-1,1])for(const sb of [-1,1]){
        const p=[0,0,0],q=[0,0,0],n=[0,0,0];
        p[a]=sa*half[a];p[b]=sb*inset[b];q[a]=sa*inset[a];q[b]=sb*half[b];n[a]=sa;n[b]=sb;
        put([p.map((v,i)=>i===axis?-inset[axis]:v),q.map((v,i)=>i===axis?-inset[axis]:v),q.map((v,i)=>i===axis?inset[axis]:v),p.map((v,i)=>i===axis?inset[axis]:v)],normalize(n));
      }
    }
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
      put([[x*half[0],y*inset[1],z*inset[2]],[x*inset[0],y*half[1],z*inset[2]],[x*inset[0],y*inset[1],z*half[2]]],normalize([x,y,z]));
    }
  }
  function rod(a,b,width,depth,material=0) {
    const dx=b[0]-a[0],dy=b[1]-a[1];
    box(a.map((x,i)=>(x+b[i])/2),[width,Math.hypot(dx,dy),depth],.018,material,Math.atan2(-dx,dy));
  }
  function cylinder(center,radius,height,axis=1,material=0) {
    const convert=p=>{if(axis===2)[p[1],p[2]]=[p[2],p[1]];return p;};
    const rings=[];
    for(let i=0;i<40;i++){
      const a=i/40*Math.PI*2,b=(i+1)/40*Math.PI*2;
      const v=[[Math.cos(a)*radius,-height/2,Math.sin(a)*radius],[Math.cos(b)*radius,-height/2,Math.sin(b)*radius],[Math.cos(b)*radius,height/2,Math.sin(b)*radius],[Math.cos(a)*radius,height/2,Math.sin(a)*radius]];
      face(v.map(p=>convert(p).map((x,j)=>x+center[j])),convert([Math.cos((a+b)/2),0,Math.sin((a+b)/2)]),material);
      rings.push(a);
    }
    for(const sign of [-1,1])face(rings.map(a=>convert([Math.cos(a)*radius,sign*height/2,Math.sin(a)*radius]).map((x,i)=>x+center[i])),convert([0,sign,0]),material);
  }
  function ring(center,outer,inner,depth,stretch=1,angle=0,material=30) {
    const n=64;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
      const p=(r,t,z)=>turn([r*Math.cos(t)*stretch,r*Math.sin(t),z],angle,2).map((x,k)=>x+center[k]);
      for(const sign of [-1,1])face([p(outer,a,sign*depth/2),p(outer,b,sign*depth/2),p(inner,b,sign*depth/2),p(inner,a,sign*depth/2)],[0,0,sign],material);
      for(const r of [outer,inner])face([p(r,a,-depth/2),p(r,b,-depth/2),p(r,b,depth/2),p(r,a,depth/2)],turn([Math.cos((a+b)/2)*(r===inner?-1:1),Math.sin((a+b)/2)*(r===inner?-1:1),0],angle,2),material-20);
    }
  }
  function roundedRing(center) {
    const position=(u,v)=>[center[0]+(.73+.12*Math.cos(v))*Math.cos(u),center[1]+(.73+.12*Math.cos(v))*Math.sin(u),center[2]+.084*Math.sin(v)];
    for(let i=0;i<64;i++)for(let j=0;j<12;j++){
      const u=i/64*Math.PI*2,w=(i+1)/64*Math.PI*2,v=j/12*Math.PI*2,q=(j+1)/12*Math.PI*2;
      const normal=normalize([Math.cos((u+w)/2)*Math.cos((v+q)/2),Math.sin((u+w)/2)*Math.cos((v+q)/2),Math.sin((v+q)/2)/.7]);
      face([position(u,v),position(w,v),position(w,q),position(u,q)],normal,85);
    }
  }
  function build(kind,time) {
    if(staticMeshes.has(kind))return staticMeshes.get(kind);
    faces=[];part=0;
    if(kind===0){
      roundedRing([-.35,.20,0]);
      part++;rod([.19,-.36,0],[.99,-1.13,0],.27,.19,90);
    } else if(kind===1){
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
        const first=faces.length;part++;
        box([x*.62,y*.62,z*.62],[.576,.576,.576],.025,0);
        const starts=y===1?1.1:y===0?1.8:2.6;
        const angle=ease((time-shapes[1]-starts)/.62)*Math.PI/2*(y===0?-1:1);
        for(let i=first;i<faces.length;i++){
          faces[i].vertices=faces[i].vertices.map(v=>turn(v,angle,1));
          faces[i].normal=turn(faces[i].normal,angle,1);
        }
      }
    } else if(kind===2){
      part++;box([-.12,-.48,.16],[.95,.61,1.36],.024);
      part++;box([.15,.40,-.42],[.95,.61,1.36],.024);
      for(const z of [-.75,-.07]){part++;cylinder([.15,.84,z],.25,.29,1,10);}
      part++;cylinder([-.12,-.04,.54],.25,.27,1,10);
    } else if(kind===3){
      const local=time-shapes[3];
      const k=[[0,1.02],[2.1,1.02],[4.0,.12],[5.55,1.03]];
      let theta=k.at(-1)[1];
      for(let i=1;i<k.length;i++)if(local<=k[i][0]){theta=k[i-1][1]+(k[i][1]-k[i-1][1])*ease((local-k[i-1][0])/(k[i][0]-k[i-1][0]));break;}
      const a=[.19,-.82,0],b=[-.47,-.23,0],c=[b[0]+1.25*Math.cos(theta),b[1]+1.25*Math.sin(theta),0];
      part++;box([.08,-1.02,0],[1.18,.15,.73],.022,5);
      part++;rod([.18,-.96,0],a,.32,.32);
      part++;rod(a,b,.21,.31);
      for(const z of [-.15,.15]){part++;rod([b[0],b[1],z],[c[0],c[1],z],.23,.075,96);}
      for(const joint of [a,b,c]){part++;cylinder(joint,.115,.39,2,20);}
      part++;box([c[0],c[1],0],[.32,.40,.38],.018,80,theta-.4);
      const tip=[c[0]+.30,c[1]+.10,0];
      part++;rod(c,tip,.11,.23,10);
      part++;rod([tip[0]-.06,tip[1],-.16],[tip[0]+.36,tip[1]-.06,-.20],.07,.07);
      part++;rod([tip[0]-.06,tip[1],.16],[tip[0]+.36,tip[1]-.06,.20],.07,.07);
    } else {
      part++;box([0,-.14,0],[1.82,1.65,1.43],.025);
      part++;box([0,.76,0],[1.99,.22,1.59],.022);
      part++;box([0,-.13,.728],[.17,1.7,.02],.002,165);
      part++;box([-.923,-.13,0],[.02,1.7,.17],.002,155);
      part++;box([0,.36,.732],[1.82,.20,.025],.002,165);
      part++;box([-.925,.36,0],[.025,.20,1.43],.002,150);
      part++;box([0,.882,0],[.17,.02,1.62],.001,140);
      part++;box([0,.882,0],[2.02,.02,.17],.001,140);
      part++;ring([-.29,1.17,.28],.235,.158,.075,1.5,-.23,0);
      part++;ring([.29,1.17,.28],.235,.158,.075,1.5,.23,0);
      part++;box([0,.98,.28],[.18,.20,.12],.012,30);
    }
    if(kind===0||kind===2||kind===4)staticMeshes.set(kind,faces);
    return faces;
  }
  function render(time,rotation=0,reduced=false) {
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==560*dpr){canvas.width=560*dpr;canvas.height=530*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,560,530);
    let index=0;for(let i=0;i<shapes.length;i++)if(time>=shapes[i])index=i;
    const phase=time-shapes[index],forming=reduced?1:ease(phase/(index?assemblyDuration:.65));
    const yaw=(index===0?.08:index===1?.60:index===2?.62:.40)+rotation+Math.sin(time*.65)*.035;
    const pitch=index===0?.08:index===2?.34:.36;
    const scales=[108,120,111,121,111],scale=scales[index];
    const camera=p=>turn(turn(p,yaw,1),pitch,0);
    const cx=[296,310,316,291,315][index],cy=[275,267,253,261,251][index];
    const list=[];
    for(const f of build(index,time)){
      const normal=camera(f.normal);if(normal[2]<.001)continue;
      const burst=index===0?0:(1-forming);
      const group=f.group;
      const offset=[(hash(group+1)-.5)*.6*burst,(hash(group+53)-.5)*.6*burst,(hash(group+63)-.5)*.6*burst];
      const g=group-1,cubeCenter=[(Math.floor(g/9)-1)*.62,(Math.floor(g%9/3)-1)*.62,(g%3-1)*.62];
      const verts=f.vertices.map(p=>camera(p.map((v,i)=>index===1?cubeCenter[i]+(v-cubeCenter[i])*(.6+.4*forming)+offset[i]:v+offset[i])));
      const shade=clamp(60+132*f.normal[1]-18*f.normal[0]-22*f.normal[2]+f.material,28,225);
      list.push({verts:verts.map(p=>[(cx+p[0]*scale)/cell,(cy-p[1]*scale)/cell,p[2]]),shade});
    }
    rasterThinkingFaces(list,180,177,pixels,depthBuffer);
    ctx.fillStyle='#2a2a2e';
    const targets=[];
    for(let y=0;y<177;y++)for(let x=0;x<180;x++){
      const i=(y*180+x)*4;
      if(pixels[i+3]<128||pixels[i]>(bayer[(y%4)*4+x%4]+.5)/16*255)continue;
      const px=index===0?x*cell+(hash(i+31)*500-x*cell)*(1-forming):x*cell;
      const py=index===0?y*cell+(hash(i+71)*490-y*cell)*(1-forming):y*cell;
      targets.push([px,py]);
    }
    if(index!==previousIndex){originPixels=lastPixels;previousIndex=index;}
    const blend=index===0||!originPixels.length?1:reduced?1:ease(phase/morphDuration);
    if(blend<1){
      const count=Math.max(originPixels.length,targets.length);
      for(let i=0;i<count;i++){
        const a=originPixels[Math.floor(i*originPixels.length/count)],b=targets[Math.floor(i*targets.length/count)];
        const delay=hash(i+209)*.12;
        const progress=ease((phase-delay)/(morphDuration-delay));
        const arc=Math.sin(progress*Math.PI)*(16+hash(i+419)*26),angle=hash(i+619)*Math.PI*2;
        ctx.fillRect(a[0]+(b[0]-a[0])*progress+Math.cos(angle)*arc,a[1]+(b[1]-a[1])*progress+Math.sin(angle)*arc,cell,cell);
      }
    }else for(const p of targets)ctx.fillRect(p[0],p[1],cell,cell);
    lastPixels=targets;
    // Ambient pixels remain sparse; the solid faces above must have contiguous black regions.
    for(let i=0;i<235;i++){
      const x=15+hash(i+101)*535+Math.sin(time*.13+i)*5,y=0+hash(i+819)*493+Math.cos(time*.17+i)*4;
      ctx.fillRect(Math.floor(x/cell)*cell,Math.floor(y/cell)*cell,cell,cell);
    }
    for(let y=-24;y<=24;y+=6)for(let x=-150;x<=150;x+=6){
      const density=Math.exp(-x*x/10000-y*y/170)*.95;
      if(hash(x*9+y*19+6901)>density)continue;
      ctx.fillRect(315+x,430+y,3,3);
    }
    ctx.globalAlpha=1;
    return ['magnifier','cube','bricks','robot','gift'][index];
  }
  return render;
}
