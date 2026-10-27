import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const root=process.cwd(),out=path.join(root,'outputs/particle-logo-volume');
await fs.mkdir(out,{recursive:true});
const svg=await fs.readFile(path.join(root,'public/leibox-mark.svg'),'utf8');
const code=`import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
window.buildLogo=async()=>{
 const parsed=new SVGLoader().parse(${JSON.stringify(svg)});
 const shapes=parsed.paths.filter(p=>p.userData?.style?.fill!=='none').flatMap(p=>SVGLoader.createShapes(p));
 if(shapes.length!==1||shapes[0].holes.length!==1)throw new Error('Approved LeiBox outline and L-shaped hole must remain intact');
 const geometry=new THREE.ExtrudeGeometry(shapes,{depth:68,bevelEnabled:true,bevelThickness:10,bevelSize:10,bevelSegments:6,curveSegments:32,steps:1});
 geometry.rotateX(Math.PI);geometry.center();geometry.rotateY(-.30);
 const materials=[new THREE.MeshStandardMaterial({color:'#8295b2',roughness:.5,metalness:.15}),new THREE.MeshStandardMaterial({color:'#283c58',roughness:.6,metalness:.1})];
 const mesh=new THREE.Mesh(geometry,materials);mesh.name='LeiBox solid particle badge';
 const scene=new THREE.Scene();scene.add(mesh);geometry.computeBoundingBox();
 const dimensions=geometry.boundingBox.getSize(new THREE.Vector3()).toArray();
 const buffer=await new GLTFExporter().parseAsync(scene,{binary:true});
 const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
 const report={source:'leibox-mark.svg',shapes:shapes.length,holes:shapes[0].holes.length,extrusion:68,bevel:10,initialYaw:-.30,dimensions,vertices:geometry.getAttribute('position').count,materials:materials.length,bytes:buffer.byteLength};
 geometry.dispose();materials.forEach(m=>m.dispose());return{data:btoa(binary),report};
};`;
const bundled=await build({stdin:{contents:code,resolveDir:root,loader:'js'},bundle:true,format:'esm',platform:'browser',write:false,logLevel:'silent'});
const server=http.createServer((req,res)=>{if(req.url==='/build.js'){res.setHeader('content-type','text/javascript');res.end(bundled.outputFiles[0].text);}else{res.setHeader('content-type','text/html');res.end('<!doctype html><script type="module" src="/build.js"></script>');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>typeof window.buildLogo==='function');
 const result=await page.evaluate(()=>window.buildLogo());
 const model=path.join(root,'public/assets/models/leibox-particle.glb');await fs.writeFile(model,Buffer.from(result.data,'base64'));
 await fs.writeFile(path.join(out,'model.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
