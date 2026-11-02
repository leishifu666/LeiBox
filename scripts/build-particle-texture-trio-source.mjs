import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
export async function buildParticleTextureTrioSource(){
 const css=await fs.readFile('src/lib/motion-core/particle-texture-trio.css','utf8');
 const markup='<main class="pt-scene" aria-label="Three flowing particle textures"><div class="pt-stage"><canvas class="pt-canvas" aria-hidden="true"></canvas><button class="pt-target" type="button" aria-label="Blue and green particles: pause or resume" aria-pressed="false"></button><button class="pt-target" type="button" aria-label="White hollow particles: pause or resume" aria-pressed="false"></button><button class="pt-target" type="button" aria-label="Orange and pink particles: pause or resume" aria-pressed="false"></button></div><span class="pt-status" role="status" aria-live="polite"></span></main>';
 const entry=`/*! Independently reconstructed particle fields. Visual reference: Anushka, https://x.com/anushka_dzn/status/2115406152167297211/video/1 . Monochrome vector contours measured from the reference retain its design rights. No original author code, video or raster texture included. */\nimport {createParticleTextureTrio} from './particle-texture-trio.mjs';\nexport function mountParticleTextureTrio(target,options={}){return createParticleTextureTrio(target,options,${JSON.stringify(css)},${JSON.stringify(markup)});}`;
 const settings={stdin:{contents:entry,sourcefile:'particle-texture-trio-entry.js',resolveDir:path.resolve('src/lib/motion-core')},bundle:true,write:false,platform:'browser',target:'es2020',logLevel:'silent'};
 const pack=await build({...settings,format:'esm',external:['./motion-runtime']});
 const html=await build({...settings,format:'iife',minify:true,stdin:{...settings.stdin,contents:entry+`\nconst component=mountParticleTextureTrio(document.getElementById('particle-textures'),{background:getComputedStyle(document.body).backgroundColor==='rgb(244, 244, 244)'?'#f4f4f4':'#000'});document.body.dataset.motionReady='true';window.addEventListener('pagehide',()=>component.destroy(),{once:true});`}});
 await fs.writeFile('public/motion/particle-texture-trio.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Particle Texture Trio</title><style>html,body{margin:0;background:#000}</style></head><body><div id="particle-textures"></div><script>${html.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return pack.outputFiles[0].text;
}
