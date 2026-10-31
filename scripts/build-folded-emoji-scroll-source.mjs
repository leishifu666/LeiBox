import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {FOLDED_EMOJI_GROUPS,FOLDED_EMOJI_ALIASES} from '../src/data/folded-emoji-scroll.mjs';

export async function buildFoldedEmojiScrollSource(){
 const fontSource=await fs.readFile('src/lib/ShareInvite/share-invite.css','utf8');
 const font=fontSource.match(/@font-face\s*\{[^}]*\}/g).join('\n').replaceAll('ShareInviteInter','FoldEmojiInter');
 const notice='/*!\n'+fontSource.slice(2,fontSource.indexOf('*/'))+'\n*/\n';
 const css=font+'\n'+await fs.readFile('src/lib/motion-core/folded-emoji-scroll.css','utf8');
 const markup='<main class="fe-scene notranslate" translate="no" aria-label="Folded emoji scroll"><div class="fe-stage"><section class="fe-panel" aria-label="Emoji picker"><header class="fe-header"><input class="fe-search" type="search" aria-label="Search emoji" placeholder="Search emoji..." autocomplete="off" spellcheck="false"></header><div class="fe-surface"><canvas class="fe-output" aria-hidden="true"></canvas><div class="fe-scroll" tabindex="0" aria-label="Emoji collection"><div class="fe-content"></div></div></div></section></div><canvas class="fe-capture" aria-hidden="true" inert></canvas><span class="fe-status fe-sr" aria-live="polite"></span></main>';
 const entry=notice+`import {createFoldedEmojiScroll} from './folded-emoji-scroll.mjs';\nconst CSS=${JSON.stringify(css)},MARKUP=${JSON.stringify(markup)},GROUPS=${JSON.stringify(FOLDED_EMOJI_GROUPS)},ALIASES=${JSON.stringify(FOLDED_EMOJI_ALIASES)};\nexport function mountFoldedEmojiScroll(target,options={}){return createFoldedEmojiScroll(target,options,CSS,MARKUP,GROUPS,ALIASES);}\n`;
 const settings={stdin:{contents:entry,sourcefile:'folded-emoji-scroll-entry.js',resolveDir:path.resolve('src/lib/motion-core')},write:false,bundle:true,platform:'browser',target:'es2020',legalComments:'inline',logLevel:'silent'};
 const packaged=await build({...settings,format:'esm',external:['./motion-runtime']});
 const bootstrap=`\nconst component=mountFoldedEmojiScroll(document.getElementById('folded-emoji-scroll'));const announce=()=>{if(component.root.querySelector('.fe-scene').dataset.ready==='true'){document.body.dataset.motionReady='true';observer.disconnect();}};const observer=new MutationObserver(announce);observer.observe(component.root.querySelector('.fe-scene'),{attributes:true,attributeFilter:['data-ready']});announce();window.addEventListener('pagehide',()=>{observer.disconnect();component.destroy();},{once:true});`;
 const standalone=await build({...settings,stdin:{...settings.stdin,contents:entry+bootstrap},format:'iife',minify:true});
 await fs.writeFile('public/motion/folded-emoji-scroll.html',`<!doctype html><html lang="en" translate="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Folded Emoji Scroll</title><style>html,body{margin:0;background:#151515}</style></head><body><div id="folded-emoji-scroll"></div><script>${standalone.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);
 return packaged.outputFiles[0].text;
}
