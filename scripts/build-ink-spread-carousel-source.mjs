import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {INK_SLIDES} from '../src/data/ink-spread-carousel.mjs';

export async function buildInkSpreadCarouselSource(){
 const css=await fs.readFile('src/lib/motion-core/ink-spread-carousel.css','utf8');
 const atlas='data:image/webp;base64,'+(await fs.readFile('public/assets/motion/ink-spread-atlas.webp')).toString('base64');
 const icon=component=>renderToStaticMarkup(createElement(component,{'aria-hidden':true}));
 const license='/*! Lucide icons: Copyright (c) 2022 Lucide Contributors. ISC license.\n'+(await fs.readFile('node_modules/lucide-react/LICENSE','utf8')).replaceAll('*/','* /')+'\n*/\n';
 const markup='<main class="ib-scene notranslate" translate="no" aria-label="Ink spread image carousel"><div class="ib-stage"><div class="ib-halo" aria-hidden="true"></div><div class="ib-halo ib-halo--next" aria-hidden="true"></div><section class="ib-card" aria-roledescription="carousel" aria-label="Four surreal alpine photographs"><div class="ib-fallback" aria-hidden="true"></div><canvas class="ib-canvas" aria-hidden="true"></canvas><button class="ib-photo" type="button" aria-label="Next image"></button><button class="ib-nav ib-nav--prev" type="button" aria-label="Previous image">'+icon(ChevronLeft)+'</button><button class="ib-nav ib-nav--next" type="button" aria-label="Next image">'+icon(ChevronRight)+'</button></section><p class="ib-error" role="alert" hidden></p></div><span class="ib-status ib-sr" role="status" aria-live="polite" aria-atomic="true"></span></main>';
 const entry=license+`import {createInkSpreadCarousel} from './ink-spread-carousel.mjs';\nconst CSS=${JSON.stringify(css)},MARKUP=${JSON.stringify(markup)},ATLAS=${JSON.stringify(atlas)},SLIDES=${JSON.stringify(INK_SLIDES)};\nexport function mountInkSpreadCarousel(target,options={}){return createInkSpreadCarousel(target,options,CSS,MARKUP,ATLAS,SLIDES);}\n`;
 const settings={stdin:{contents:entry,sourcefile:'ink-spread-carousel-entry.js',resolveDir:path.resolve('src/lib/motion-core')},bundle:true,write:false,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['./motion-runtime']});
 const bootstrap=`\nconst component=mountInkSpreadCarousel(document.getElementById('ink-spread-carousel'));const announce=()=>{if(component.root.querySelector('.ib-scene').dataset.ready==='true'){document.body.dataset.motionReady='true';observer.disconnect();}};const observer=new MutationObserver(announce);observer.observe(component.root.querySelector('.ib-scene'),{attributes:true,attributeFilter:['data-ready']});announce();window.addEventListener('pagehide',()=>{observer.disconnect();component.destroy();},{once:true});`;
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+bootstrap},format:'iife',minify:true});
 await fs.writeFile('public/motion/ink-spread-carousel.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ink Spread Carousel</title><style>html,body{margin:0;background:#eaeaea}</style></head><body><div id="ink-spread-carousel"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
