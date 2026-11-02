import fs from "node:fs/promises";
import sharp from "sharp";
const root=new URL("../../../",import.meta.url);
const publicFile=name=>new URL("public/"+name,root);
async function inspect(bytes,size){
 const {data,info}=await sharp(bytes).resize(size,size).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let opaque=0,nonWhite=0;
 for(let p=0;p<data.length;p+=info.channels){if(data[p+3]>128){opaque++;if(data[p]<254||data[p+1]<254||data[p+2]<254)nonWhite++;}}
 return {size,cornerAlpha:data[3],letterAlpha:data[(Math.floor(392.618802154/512*size)*size+Math.floor(274/512*size))*4+3],opaque,nonWhite,pass:data[3]===0&&opaque>0&&nonWhite===0};
}
const svg=await fs.readFile(publicFile("favicon.svg"));
const ico=await fs.readFile(publicFile("favicon.ico"));
const frames=[];
for(let i=0;i<ico.readUInt16LE(4);i++){
 const at=6+i*16,sz=ico[at]||256,count=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);
 frames.push(await inspect(ico.subarray(offset,offset+count),sz));
}
const svgResult=await inspect(svg,32);
const response=await fetch("http://127.0.0.1:3000/favicon.svg?v=leibox-white-20261022");
const live=await response.text();
const report={svg:svgResult,ico:frames,served:response.status===200&&live===svg.toString(),pass:svgResult.pass&&frames.every(x=>x.pass)&&response.status===200&&live===svg.toString()};
await fs.writeFile(new URL("favicon-validation.json",import.meta.url),JSON.stringify(report,null,2));
await sharp(svg).resize(128,128).flatten({background:"#1b1b1b"}).png().toFile(new URL("favicon-dark-preview.png",import.meta.url).pathname.replace(/^\/([A-Z]:)/,"$1").split("/").map(decodeURIComponent).join("/"));
console.log(report);
if(!report.pass)process.exitCode=1;

