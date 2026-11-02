import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1"));
const decoded=decodeURIComponent(root);
const items=JSON.parse(await fs.readFile(path.join(decoded,"exports.json"),"utf8"));
const reports=[];
for(const v of items){
 const svgPath=path.join(decoded,"svg","leibox-logo-"+v.key+".svg");
 const source=await fs.readFile(svgPath,"utf8");
 const d=source.match(/data-role="l-centerline" d="([^"]+)"/)[1];
 const nums=d.match(/-?\d+(?:\.\d+)?/g).map(Number);
 const vertical=Math.hypot(nums[0]-nums[2],nums[1]-nums[3]);
 const diagonal=Math.hypot(nums[4]-nums[2],nums[5]-nums[3]);
 const strokeWidths=[...source.matchAll(/stroke-width="([^"]+)"/g)].map(m=>Number(m[1]));
 const image=sharp(Buffer.from(source)).resize(512,512).ensureAlpha();
 const {data,info}=await image.raw().toBuffer({resolveWithObject:true});
 const vb=v.viewBox.split(" ").map(Number);
 function alphaAt(x,y){const px=Math.round((x-vb[0])/vb[2]*512),py=Math.round((y-vb[1])/vb[3]*512);return data[(py*info.width+px)*4+3];}
 const hole=alphaAt(v.points.elbow.x,v.points.elbow.y);
 const body=alphaAt(170,256);
 const exterior=data[3];
 const pass=Math.abs(vertical-diagonal)<.001&&strokeWidths.length===1&&hole===0&&body===255&&exterior===0;
 await sharp(Buffer.from(source)).resize(512,512).png().toFile(path.join(decoded,v.key+".png"));
 reports.push({key:v.key,vertical,diagonal,ratio:vertical/diagonal,strokeWidths,alpha:{hole,body,exterior},pass});
}
await fs.writeFile(path.join(decoded,"svg-validation.json"),JSON.stringify(reports,null,2),"utf8");
console.log(JSON.stringify(reports,null,2));
if(reports.some(v=>!v.pass))process.exitCode=1;

