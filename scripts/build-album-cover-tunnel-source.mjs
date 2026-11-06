import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import sharp from 'sharp';
import {DEFAULT_COVERS} from '../src/lib/motion-core/album-cover-tunnel-assets.mjs';

export async function buildAlbumCoverTunnelSource(){
 const css=await fs.readFile('src/lib/motion-core/album-cover-tunnel.css','utf8');
 const markup='<section class="aw-scene notranslate" translate="no" aria-label="Album cover tunnel"><div id="stage"></div><p id="hint">滚轮 / 上下拖动：穿过封面隧道 · 悬停吸起 · 点击飞入中央 · 方向键切换 · 空格暂停</p><span id="fps"></span><p class="aw-status" aria-live="polite"></p><p class="aw-error" role="status" hidden></p></section>';
 const license=await fs.readFile('node_modules/three/LICENSE','utf8');
 const entry='/*!\nLeiShiFu original interaction, supplied by its author. Album artwork rights remain with the respective rights holders.\nThree.js license:\n'+license.replaceAll('*/','* /')+'\n*/\n'+`import {createAlbumCoverTunnel} from './album-cover-tunnel.mjs';\nexport function mountAlbumCoverTunnel(target,options={}){return createAlbumCoverTunnel(target,options,${JSON.stringify(css)},${JSON.stringify(markup)});}`;
 const settings={stdin:{contents:entry,sourcefile:'album-cover-tunnel-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2022',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['three','three/*','./motion-runtime']});
 const boot=`\nconst preview=document.documentElement.hasAttribute('data-leibox-motion-preview');const component=mountAlbumCoverTunnel(document.getElementById('album-cover-tunnel'),{height:innerHeight,theme:preview?'light':'dark'});window.__albumTunnel=component;const resize=()=>component.update({height:innerHeight});addEventListener('resize',resize);component.ready?.then(()=>{document.body.dataset.motionReady='true';});addEventListener('pagehide',()=>{removeEventListener('resize',resize);component.destroy();},{once:true});`;
 const htmlSettings={...settings,stdin:{...settings.stdin,contents:entry+boot},format:'iife',minify:true};
 const standalone=await build(htmlSettings);
 const html=script=>'<!doctype html><html lang="zh" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>专辑封面隧道 · 雷师傅原创</title><style>html,body{margin:0;background:#05060f;overflow:hidden}</style></head><body><div id="album-cover-tunnel"></div><script>'+script.replaceAll('</script','<\\/script')+'</script></body></html>';
 await fs.writeFile('public/motion/album-cover-tunnel.html',html(standalone.outputFiles[0].text));

 // The card uses the same scene and all covers. Only its texture inputs are sized for the card.
 const covers=await Promise.all(DEFAULT_COVERS.map(async ({src,alt})=>{
   const original=Buffer.from(src.split(',')[1],'base64');
   const image=await sharp(original).resize({width:320,withoutEnlargement:true}).webp({quality:87,effort:5}).toBuffer();
   return {src:'data:image/webp;base64,'+(image.length<original.length?image:original).toString('base64'),alt};
 }));
 const firstCovers=await Promise.all(covers.map(async (cover,index)=>{
   if(index<4)return cover;
   const full=Buffer.from(cover.src.split(',')[1],'base64');
   const thumb=await sharp(full).resize({width:160,withoutEnlargement:true}).webp({quality:86,effort:5}).toBuffer();
   return thumb.length<full.length?{...cover,src:'data:image/webp;base64,'+thumb.toString('base64')}:cover;
 }));
 const layers=covers.flatMap((cover,index)=>cover.src===firstCovers[index].src?[]:[[index,cover.src]]);
 const textureDir='public/assets/optimized';
 await fs.mkdir(textureDir,{recursive:true});
 const textureFiles=[];
 for(let offset=0;offset<layers.length;offset+=12){
   const body=`globalThis.__leiboxAlbumCoverLayers=${JSON.stringify(layers.slice(offset,offset+12))};\n`;
   const hash=createHash('sha256').update(body).digest('hex').slice(0,12);
   const file=`album-cover-tunnel-textures-${hash}.js`;
   await fs.writeFile(path.join(textureDir,file),body);
   textureFiles.push(file);
 }
 const previewLayers=`
let closed = false;
addEventListener('pagehide', () => { closed = true; }, { once: true });
async function* coverBatches() {
  await new Promise(resolve => setTimeout(resolve, 750));
  for (const url of ${JSON.stringify(textureFiles.map(file=>'/assets/optimized/'+file))}) {
    if (closed) return;
    const batch = await new Promise(resolve => {
      const script = document.createElement('script');
      const finish = () => {
        const layers = globalThis.__leiboxAlbumCoverLayers || [];
        delete globalThis.__leiboxAlbumCoverLayers;
        script.remove();
        resolve(layers);
      };
      script.src = url;
      script.onload = script.onerror = finish;
      document.head.appendChild(script);
    });
    if (batch.length) yield batch;
  }
}
component.ready?.then(() => component.upgradeCovers(coverBatches())).catch(() => {});
`;
 const preview=await build({...htmlSettings,stdin:{...htmlSettings.stdin,contents:entry+boot+previewLayers},plugins:[{
   name:'album-cover-card-textures',
   setup(builder){
     builder.onLoad({filter:/album-cover-tunnel-assets\.mjs$/},()=>({contents:`export const DEFAULT_COVERS = ${JSON.stringify(firstCovers)};`}));
   },
 }]});
 await fs.writeFile('public/motion/album-cover-tunnel-preview.html',html(preview.outputFiles[0].text));
 for(const file of await fs.readdir(textureDir)){
   if(/^album-cover-tunnel-textures-[a-f0-9]{12}\.js$/.test(file)&&!textureFiles.includes(file))await fs.unlink(path.join(textureDir,file));
 }
 return packaged.outputFiles[0].text;
}
