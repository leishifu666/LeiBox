import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';

// Render the existing object engines; the sidebar, gallery and homepage share
// these recordings so they retain the existing lightweight preview lifecycle.
const root=process.cwd(),out=path.join(root,'outputs/logo-object-previews');
const probe=process.argv.includes('--probe');
const filters=process.argv.slice(2).filter(value=>!value.startsWith('--'));
const entries=[
 {slug:'ascii-object',name:'AsciiObject',background:'#ffffff',light:true,options:{cellSize:10,cellAspect:.6,contrast:1.5,edgeContrast:3,colored:false,color:'#111111',scale:3,roughness:.15,highlight:'#066aff',floatIntensity:2,rotationIntensity:1,floatSpeed:2,fov:65,cameraDistance:4.2}},
 {slug:'particle-object',name:'ParticleObject',background:'#ffffff',light:true,options:{count:20000,size:2.1,sizeVariance:.45,scale:3,floatIntensity:2,rotationIntensity:1,floatSpeed:2,fov:65,cameraDistance:4.2,autoRotate:true,autoRotateSpeed:.55}},
 {slug:'liquid-object',name:'LiquidObject',background:'#ffffff',light:true,options:{scale:3,yOffset:-.2,depth:.05,bevel:.5,floatIntensity:1,rotationIntensity:.5,floatSpeed:1.5,fov:60,cameraDistance:4}},
 {slug:'glass-object',name:'GlassObject',background:'#0a0a0a',light:false,options:{ior:1.75,thickness:4,roughness:.25,dispersion:1.5,clearcoat:.5,tintDensity:2,depth:.1,bevel:1,scale:3,floatIntensity:1,rotationIntensity:1,floatSpeed:2,fov:55,cameraDistance:4,highlight:'#066aff'}},
].filter(entry=>!filters.length||filters.includes(entry.slug));
assert(entries.length,'Choose an existing object preview');
await fs.mkdir(out,{recursive:true});
for(const entry of entries){
 const source=await fs.readFile(path.join(root,'src/demos',entry.slug+'-demo.tsx'),'utf8');
 const asset=source.match(/const DEFAULT_MODEL = "([^"]+)"/)?.[1];assert(asset?.includes('logo')||asset?.includes('leibox'),'demo must use an existing LeiBox asset');
 entry.asset=asset==='/leibox-mark.svg'&&!entry.light?'/logo-icon.svg':asset;
 const code=`import {create${entry.name}} from ${JSON.stringify(path.join(root,`src/lib/${entry.name}/${entry.name}Vanilla.ts`).replaceAll('\\','/'))};
const canvas=document.querySelector('canvas');window.__object=create${entry.name}({canvas},{...${JSON.stringify(entry.options)},src:${JSON.stringify(entry.asset)},background:${JSON.stringify(entry.background)},onLoad(){document.body.dataset.ready='true';},onError(error){document.body.dataset.error=String(error);}});window.addEventListener('pagehide',()=>window.__object?.destroy(),{once:true});`;
 await build({stdin:{contents:code,resolveDir:root,loader:'js'},bundle:true,platform:'browser',format:'esm',target:'es2020',outfile:path.join(out,entry.slug+'.js'),logLevel:'silent'});
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://local'),entry=entries.find(e=>url.pathname===`/${e.slug}`);
  if(entry){res.setHeader('content-type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;width:100%;height:100%;background:${entry.background}}canvas{display:block;width:100%;height:100%;touch-action:none}</style></head><body><canvas aria-label="${entry.slug} LeiBox preview"></canvas><script type="module" src="/${entry.slug}.js"></script></body></html>`);return;}
  const file=entries.some(e=>url.pathname===`/${e.slug}.js`)?path.join(out,url.pathname.slice(1)):url.pathname==='/logo-icon.svg'||url.pathname==='/leibox-mark.svg'||entries.some(e=>url.pathname===e.asset)?path.join(root,'public',url.pathname.slice(1)):null;
  if(!file){res.statusCode=404;res.end();return;}res.setHeader('content-type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.glb')?'model/gltf-binary':'text/javascript');res.end(await fs.readFile(file));
 }catch(error){res.statusCode=500;res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{
 for(const entry of entries){
  const context=await browser.newContext({viewport:{width:640,height:480},deviceScaleFactor:1,...(probe?{}:{recordVideo:{dir:path.join(out,'raw'),size:{width:640,height:480}}})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const requests=[];page.on('request',r=>{if(/\.(?:svg|glb)$/.test(r.url()))requests.push(new URL(r.url()).pathname);});
  await page.goto(`http://127.0.0.1:${server.address().port}/${entry.slug}`);
  await page.waitForFunction(()=>document.body.dataset.ready==='true'||document.body.dataset.error,{timeout:30000});
  assert.equal(await page.locator('body').getAttribute('data-error'),null);
  await page.waitForTimeout(900);await page.screenshot({path:path.join(out,entry.slug+'.png')});
  if(!probe){
   const started=Date.now();
   for(let i=0;i<60;i++){
    // The first decoded preview frame must show the complete logo, before the
    // pointer demonstration scatters particles or disturbs the liquid.
    const t=(i-18)/31;
    if(entry.slug==='particle-object'||i<18||i>=50)await page.mouse.move(20,20);
    else await page.mouse.move(320+Math.sin(t*Math.PI*2)*125,240+Math.cos(t*Math.PI*2)*80);
    const remaining=started+(i+1)*100-Date.now();if(remaining>0)await page.waitForTimeout(remaining);
   }
  }
  const video=page.video();await context.close();assert.deepEqual(errors,[]);
  const record={slug:entry.slug,source:entry.asset,light:entry.light,requests,errors};
  if(video){
   const fileName=entry.slug==='particle-object'?'particle-object-leibox-3d.webm':entry.slug+'-leibox.webm';
   const input=await video.path(),output=path.join(root,'public/assets/videos',fileName);
   const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
   // Screencast flushing can trim away an idle lead-in. Use the real idle
   // rendering for exactly frame zero; all following frames are recorded motion.
   const encoded=path.join(out,entry.slug+'-encoded.webm');
   const filter='[0:v]scale=640:480,fps=24,trim=end_frame=1,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[cover];[1:v]scale=640:480,fps=24,trim=end_frame=119,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[motion];[cover][motion]concat=n=2:v=1:a=0[result]';
   const args=['-hide_banner','-loglevel','error','-y','-loop','1','-i',path.join(out,entry.slug+'.png'),'-sseof','-5','-i',input,'-filter_complex',filter,'-map','[result]','-an','-frames:v','120','-c:v','libvpx-vp9','-b:v','0','-crf','33','-pix_fmt','yuv420p',encoded];
   await new Promise((resolve,reject)=>{const child=spawn(ffmpeg,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',data=>stderr+=data);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(stderr)));});
   await fs.copyFile(encoded,output);
   const exported=path.join(root,'out/assets/videos',fileName);
   if(await fs.stat(path.dirname(exported)).then(s=>s.isDirectory()).catch(()=>false))await fs.copyFile(encoded,exported);
   record.rawVideo=path.relative(root,input).replaceAll('\\','/');
   record.video=path.relative(root,output).replaceAll('\\','/');record.bytes=(await fs.stat(output)).size;assert(record.bytes>3000);
  }
  report.push(record);console.log(`${probe?'PROBE':'CAPTURED'} ${entry.slug}: ${entry.asset}${record.bytes?' — '+record.bytes+' bytes':''}`);
 }
 await fs.writeFile(path.join(out,probe?'probe.json':'capture.json'),JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
