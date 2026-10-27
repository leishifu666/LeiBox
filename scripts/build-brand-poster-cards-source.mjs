import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {BRAND_POSTER_COPY,BRAND_POSTER_ALT} from '../src/data/brand-poster-cards.mjs';

export async function buildBrandPosterCardsSource(){
 const css=await fs.readFile('src/lib/motion-core/brand-poster-cards.css','utf8');
 const data=async(file,mime)=>`data:${mime};base64,${(await fs.readFile(file)).toString('base64')}`;
 const logo=await data('public/leibox-logo.svg','image/svg+xml');
 const symbol=await data('public/logo-icon.svg','image/svg+xml');
 const images=await Promise.all(['clear-glasses.webp','blue-scarf.webp','light-trails.webp'].map(async(file,index)=>({src:await data(`src/lib/BrandPosterCards/assets/${file}`,'image/webp'),alt:BRAND_POSTER_ALT[index]})));
 const defaults={images,logo,symbol,description:BRAND_POSTER_COPY};
 const markup=`<main class="bp-scene notranslate" translate="no" aria-label="LeiBox brand poster cards"><div class="bp-row" role="group" aria-label="Three brand portraits">${images.map((_,index)=>`<figure class="bp-card" tabindex="0" role="button" aria-pressed="false" data-index="${index}"><img class="bp-photo" draggable="false" width="816" height="1456" alt=""><div class="bp-shade" aria-hidden="true"></div><img class="bp-symbol" alt="" aria-hidden="true" draggable="false"><figcaption><img class="bp-logo" alt="LeiBox" draggable="false"><p class="bp-copy"></p></figcaption></figure>`).join('')}</div></main>`;
 const entry=`import {createBrandPosterCards} from './brand-poster-cards.mjs';\nconst CSS=${JSON.stringify(css)}, MARKUP=${JSON.stringify(markup)}, DEFAULTS=${JSON.stringify(defaults)};\nexport function mountBrandPosterCards(target,options={}){return createBrandPosterCards(target,options,CSS,MARKUP,DEFAULTS);}\n`;
 const settings={stdin:{contents:entry,sourcefile:'brand-poster-cards-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['gsap','./motion-runtime']});
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+`\nconst component=mountBrandPosterCards(document.getElementById('brand-posters'));\nconst ready=new MutationObserver(()=>{if(component.root.querySelector('.bp-scene').dataset.ready==='true'){document.body.dataset.motionReady='true';ready.disconnect();}});ready.observe(component.root.querySelector('.bp-scene'),{attributes:true,attributeFilter:['data-ready']});`},format:'iife',minify:true});
 await fs.writeFile('public/motion/brand-poster-cards.html',`<!doctype html><html lang="zh-CN" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LeiBox · 品牌海报三联卡片</title><style>html,body{margin:0;background:#fff}</style></head><body><div id="brand-posters"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
