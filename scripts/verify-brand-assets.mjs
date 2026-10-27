import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const brand=path.join(root,"design/brand/leibox");
const source=await fs.readFile(path.join(brand,"selected-source.svg"),"utf8");
const production=await fs.readFile(path.join(root,"public/leibox-mark.svg"),"utf8");
const first=await fs.readFile(path.join(root,"design/logo-explorations/leibox-2026-10-22/claude-equal-arm/svg/leibox-logo-01-balanced.svg"),"utf8");
const shell=svg=>svg.match(/<path d="([^"]+)" fill="#000" mask=/)[1];
const centerD=source.match(/data-role="l-centerline" d="([^"]+)"/)[1];
const ns=centerD.match(/[-0-9.]+/g).map(Number);
const [ax,ay,ex,ey,bx,by]=ns;
const width=Number(source.match(/stroke-width="([^"]+)"/)[1]);
const lengths=[Math.hypot(ax-ex,ay-ey),Math.hypot(bx-ex,by-ey)];
const rightGap=88-Math.hypot(bx-360.258,by-316.193)-width/2;
const bottomGap=222*Math.cos(Math.PI/6)-((ex-256)/2+(ey-256)*Math.sqrt(3)/2)-width/2;
const geometry={lengths,ratio:lengths[0]/lengths[1],width,elbow:{x:ex,y:ey},rightGap,bottomGap,gapRatio:rightGap/bottomGap,shellUnchanged:shell(source)===shell(first)};
async function raw(svg,size){return sharp(Buffer.from(svg)).resize(size,size).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
const [a,b]=await Promise.all([raw(source,1024),raw(production,1024)]);
let intersection=0,union=0,alphaDifference=0,maxDifference=0;
for(let i=3;i<a.data.length;i+=4){const av=a.data[i],bv=b.data[i];if(av>=128&&bv>=128)intersection++;if(av>=128||bv>=128)union++;alphaDifference+=Math.abs(av-bv);maxDifference=Math.max(maxDifference,Math.abs(av-bv));}
const raster={size:1024,alphaIoU:intersection/union,meanAlphaDifference:alphaDifference/(a.data.length/4),maxAlphaDifference:maxDifference};
function topology(data,size){
 const ink=new Uint8Array(size*size);for(let i=0;i<ink.length;i++)ink[i]=data[i*4+3]>=128?1:0;
 const seen=new Uint8Array(ink.length);let components=0,holes=0;
 for(let start=0;start<ink.length;start++){
  if(seen[start])continue;
  const value=ink[start],queue=[start];seen[start]=1;let boundary=false;
  for(let q=0;q<queue.length;q++){
   const index=queue[q],x=index%size,y=Math.floor(index/size);
   if(x===0||y===0||x===size-1||y===size-1)boundary=true;
   // Use complementary digital connectivity: diagonally touching ink pixels
   // belong to one contour; transparent regions use four-neighbor adjacency.
   const adjacent=[x>0?index-1:-1,x<size-1?index+1:-1,y>0?index-size:-1,y<size-1?index+size:-1];
   if(value)adjacent.push(x>0&&y>0?index-size-1:-1,x<size-1&&y>0?index-size+1:-1,x>0&&y<size-1?index+size-1:-1,x<size-1&&y<size-1?index+size+1:-1);
   for(const next of adjacent){
    if(next>=0&&!seen[next]&&ink[next]===value){seen[next]=1;queue.push(next);}
   }
  }
  if(value)components++;else if(!boundary)holes++;
 }
 return {components,holes};
}
const sizes=[];
for(const size of [16,24,32,48,96]){
 const rendered=await raw(production,size);
 sizes.push({size,...topology(rendered.data,size)});
}
const files=["leibox-mark.svg","leibox-logo.svg","logo.svg","logo-icon.svg","favicon.svg","favicon.ico","apple-touch-icon.png","icon-192.png","icon-512.png","leibox-og.svg","leibox-og.png"];
const served=await Promise.all(files.map(async name=>{
 const bytes=await fs.readFile(path.join(root,"public",name));
 const response=await fetch("http://127.0.0.1:3000/"+name);
 const live=Buffer.from(await response.arrayBuffer());
 const hash=x=>createHash("sha256").update(x).digest("hex");
 return {file:name,status:response.status,matches:hash(bytes)===hash(live)};
}));
const report={geometry,raster,topologyMethod:{alphaThreshold:128,inkNeighbors:8,transparentNeighbors:4},sizes,served,pass:geometry.shellUnchanged&&Math.abs(lengths[0]-119)<1e-6&&Math.abs(lengths[0]-lengths[1])<1e-6&&width===54&&rightGap>35&&Math.abs(rightGap-bottomGap)<1&&raster.alphaIoU>.9999&&sizes.every(s=>s.components===1&&s.holes===1)&&served.every(s=>s.status===200&&s.matches)};
await fs.writeFile(path.join(brand,"validation.json"),JSON.stringify(report,null,2),"utf8");
console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;

