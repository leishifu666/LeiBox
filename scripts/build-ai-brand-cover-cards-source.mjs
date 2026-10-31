import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {build} from 'esbuild';
import {AI_BRAND_CARDS} from '../src/data/ai-brand-cover-cards.mjs';
export async function buildAiBrandCoverCardsSource(){
 const folder='src/lib/AiBrandCoverCards/assets';
 const uri=(bytes,mime)=>`data:${mime};base64,${bytes.toString('base64')}`;
 const vector=async name=>uri(await fs.readFile(folder+'/'+name),'image/svg+xml');
 const images=await Promise.all(AI_BRAND_CARDS.map(async card=>({src:uri(await sharp(await fs.readFile(folder+'/'+card.image)).resize(600,1000,{fit:'cover'}).webp({quality:82}).toBuffer(),'image/webp'),alt:card.name+' AI cover'})));
 const brands=await Promise.all(AI_BRAND_CARDS.map(async card=>({...card,logo:await vector(card.logo),symbol:await vector(card.symbol)})));
 const defaults={images,brands,layout:{height:800,cardHeight:500}};
 const css=await fs.readFile('src/lib/motion-core/brand-poster-cards.css','utf8')+`\n.bp-scene{height:var(--motion-height,800px)}.bp-row{grid-template-columns:repeat(3,300px);gap:30px;width:960px}.bp-card{width:300px;aspect-ratio:3/5;container-type:inline-size}.bp-shade{background:linear-gradient(180deg,#00000014 0%,#0000000f 25%,#00000052 52%,#00000014 68%,#0000009e 82%,#000000bd 100%)}.bp-symbol{top:14px;left:14px;width:18px;height:18px;filter:brightness(0) invert(1)}.bp-logo{top:51%;width:83%;filter:brightness(0) invert(1) drop-shadow(0 2px 6px #0005)}.bp-copy{left:6%;right:6%;bottom:4.2%;font-size:12px;line-height:1.55;text-wrap:pretty;text-shadow:0 1px 5px #0005}`;
 const markup=`<main class="bp-scene" aria-label="AI brand cover cards"><div class="bp-row" role="group" aria-label="Claude, Codex and Cursor">${AI_BRAND_CARDS.map((card,index)=>`<figure class="bp-card" role="button" tabindex="0" aria-pressed="false" data-index="${index}"><img class="bp-photo" alt="" draggable="false"><div class="bp-shade"></div><img class="bp-symbol" alt="" aria-hidden="true"><figcaption><img class="bp-logo" alt="${card.name}"><p class="bp-copy"></p></figcaption></figure>`).join('')}</div></main>`;
 const notice=await fs.readFile(folder+'/LICENSE-lobe-icons.txt','utf8');
 const entry=`/*! ${notice}\nSelected AI artwork supplied by Lei Shifu. Claude and Cursor brand marks remain the property of their owners. */\nimport {createBrandPosterCards} from './brand-poster-cards.mjs';\nexport function mountAiBrandCoverCards(target,options={}){return createBrandPosterCards(target,options,${JSON.stringify(css)},${JSON.stringify(markup)},${JSON.stringify(defaults)});}`;
 const opts={stdin:{contents:entry,sourcefile:'ai-brand-cover-cards-entry.js',resolveDir:path.resolve('src/lib/motion-core')},bundle:true,write:false,platform:'browser',target:'es2020',logLevel:'silent'};
 const packaged=await build({...opts,format:'esm',external:['gsap','./motion-runtime']});
 const standalone=await build({...opts,format:'iife',minify:true,stdin:{...opts.stdin,contents:entry+`\nconst instance=mountAiBrandCoverCards(document.getElementById('ai-brand-covers'));const scene=instance.root.querySelector('.bp-scene');const ready=()=>{if(scene.dataset.ready==='true'){document.body.dataset.motionReady='true';observer.disconnect();}};const observer=new MutationObserver(ready);observer.observe(scene,{attributes:true,attributeFilter:['data-ready']});ready();window.addEventListener('pagehide',()=>{observer.disconnect();instance.destroy();},{once:true});`}});
 await fs.writeFile('public/motion/ai-brand-cover-cards.html',`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 品牌封面三联卡片</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="ai-brand-covers"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
