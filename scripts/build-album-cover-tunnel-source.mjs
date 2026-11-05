import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';

export async function buildAlbumCoverTunnelSource(){
 const css=await fs.readFile('src/lib/motion-core/album-cover-tunnel.css','utf8');
 const markup='<section class="aw-scene notranslate" translate="no" aria-label="Album cover tunnel"><div id="stage"></div><p id="hint">滚轮 / 上下拖动：穿过封面隧道 · 悬停吸起 · 点击飞入中央 · 方向键切换 · 空格暂停</p><span id="fps"></span><p class="aw-status" aria-live="polite"></p><p class="aw-error" role="status" hidden></p></section>';
 const license=await fs.readFile('node_modules/three/LICENSE','utf8');
 const entry='/*!\nLeiShiFu original interaction, supplied by its author. Album artwork rights remain with the respective rights holders.\nThree.js license:\n'+license.replaceAll('*/','* /')+'\n*/\n'+`import {createAlbumCoverTunnel} from './album-cover-tunnel.mjs';\nexport function mountAlbumCoverTunnel(target,options={}){return createAlbumCoverTunnel(target,options,${JSON.stringify(css)},${JSON.stringify(markup)});}`;
 const settings={stdin:{contents:entry,sourcefile:'album-cover-tunnel-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2022',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['three','three/*','./motion-runtime']});
 const boot=`\nconst preview=document.documentElement.hasAttribute('data-leibox-motion-preview');const component=mountAlbumCoverTunnel(document.getElementById('album-cover-tunnel'),{height:innerHeight,theme:preview?'light':'dark'});window.__albumTunnel=component;const resize=()=>component.update({height:innerHeight});addEventListener('resize',resize);component.ready?.then(()=>{document.body.dataset.motionReady='true';});addEventListener('pagehide',()=>{removeEventListener('resize',resize);component.destroy();},{once:true});`;
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+boot},format:'iife',minify:true});
 await fs.writeFile('public/motion/album-cover-tunnel.html','<!doctype html><html lang="zh" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>专辑封面隧道 · 雷师傅原创</title><style>html,body{margin:0;background:#05060f;overflow:hidden}</style></head><body><div id="album-cover-tunnel"></div><script>'+standalone.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script></body></html>');
 return packaged.outputFiles[0].text;
}
