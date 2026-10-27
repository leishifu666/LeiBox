import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { parse, compileScript } from '@vue/compiler-sfc';
import { compile } from 'svelte/compiler';
import { transformAsync } from '@babel/core';
import solidPreset from 'babel-preset-solid';
import typescriptPlugin from '@babel/plugin-transform-typescript';
import { chromium } from 'playwright';
import { verifyCrumpledPaper } from './test-crumpled-paper.mjs';
import { verifyGlassTabMenu } from './test-glass-tab-menu.mjs';
import { verifyStaggeredRadialMenu } from './test-staggered-radial-menu.mjs';
import { verifySailingBoat } from './test-sailing-boat.mjs';
import { verifyHammerheadChart } from './test-hammerhead-chart.mjs';
import { verifyDeepAgent } from './test-deep-agent.mjs';
import { verifyElasticPanel } from './test-elastic-panel-resize.mjs';
import { verifyInlineTextMorph } from './test-inline-text-morph.mjs';
import { verifyCollectionLayoutMorph } from './test-collection-layout-morph.mjs';
import { verifyGalaxyEffortSlider } from './test-galaxy-effort-slider.mjs';
import { verifyBlueFlutedGlass } from './test-blue-fluted-glass.mjs';
import { verifyNotesTextColor } from './test-notes-text-color.mjs';
import { verifyBrandPosterCards } from './test-brand-poster-cards.mjs';
import { verifyBoundingBoxResize } from './test-bounding-box-resize.mjs';
import { verifyDotMatrixTrio } from './test-dot-matrix-trio.mjs';
import { verifySelectionFlower } from './test-selection-flower.mjs';
import { verifySpiderMusicPlayer } from './test-spider-music-player.mjs';

const ROOT=process.cwd(),SOURCE=path.join(ROOT,'public/motion-frameworks'),OUT=path.join(ROOT,'outputs/motion-six-frameworks');
await fs.mkdir(OUT,{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(SOURCE,'manifest.json'),'utf8'));
const reports=[];
const filters=process.argv.slice(2);
const frameworkFilters=filters.filter(value=>manifest.frameworks.some(f=>f.id===value));
const slugFilters=filters.filter(value=>!frameworkFilters.includes(value));
const selected=manifest.items.filter(item=>(!slugFilters.length||slugFilters.includes(item.slug))&&(!frameworkFilters.length||frameworkFilters.includes(item.framework)));
assert.equal(manifest.items.length,new Set(manifest.items.map(x=>x.slug)).size*6);
const plugin={name:'framework-components',setup(build){
 build.onResolve({filter:/^motion:svelte-app$/},()=>({path:'app',namespace:'motion-svelte'}));
 build.onLoad({filter:/.*/,namespace:'motion-svelte'},()=>{
  const file=JSON.parse(build.initialOptions.define.__MOTION_SVELTE_FILE__);
  const source=`<script>import Component from ${JSON.stringify(file)}; let options={}; export function updateOptions(next){options=next;}</script><Component {options}/>`;
  return {contents:compile(source,{filename:'MotionApp.svelte',generate:'client',css:'injected'}).js.code,loader:'js',resolveDir:ROOT};
 });
 build.onLoad({filter:/\.vue$/},async args=>{const source=await fs.readFile(args.path,'utf8');const {descriptor}=parse(source,{filename:args.path});const result=compileScript(descriptor,{id:'motion-qa',inlineTemplate:true});return {contents:result.content,loader:'ts',resolveDir:path.dirname(args.path)};});
 build.onLoad({filter:/\.svelte$/},async args=>({contents:compile(await fs.readFile(args.path,'utf8'),{filename:args.path,generate:'client',css:'injected'}).js.code,loader:'js',resolveDir:path.dirname(args.path)}));
 build.onLoad({filter:/\.solid\.tsx$/},async args=>{const result=await transformAsync(await fs.readFile(args.path,'utf8'),{filename:args.path,babelrc:false,configFile:false,presets:[[solidPreset,{generate:'dom',hydratable:false}]],plugins:[[typescriptPlugin,{isTSX:true}]]});return {contents:result.code,loader:'js',resolveDir:path.dirname(args.path)};});
}};
function entrySource(pack,entry){
 const file=JSON.stringify(entry.replaceAll('\\','/')),name=pack.component;
 let imports,create;
 if(pack.framework==='react'||pack.framework==='preact'){
  const preact=pack.framework==='preact';
  imports=`import { ${name} } from ${file}; import { ${preact?'h':'createElement as h'} } from '${preact?'preact':'react'}'; import {useState} from '${preact?'preact/hooks':'react'}'; ${preact?'import {render} from "preact";':'import {createRoot} from "react-dom/client";'}`;
  create=`let update; function App(){const [options,setOptions]=useState({});update=setOptions;return h(${name},{options});} ${preact?'render(h(App),host);':'const app=createRoot(host);app.render(h(App));'} return {update:value=>update(value),destroy:()=>${preact?'render(null,host)':'app.unmount()'}};`;
 }else if(pack.framework==='vue'){
  imports=`import Component from ${file}; import {createApp,h,shallowRef} from 'vue';`;
  create=`const options=shallowRef({});const app=createApp({render:()=>h(Component,{options:options.value})});app.mount(host);return {update:value=>options.value=value,destroy:()=>app.unmount()};`;
 }else if(pack.framework==='svelte'){
  imports=`import App from 'motion:svelte-app';import {mount,unmount} from 'svelte';`;
  create=`const app=mount(App,{target:host});return {update:value=>app.updateOptions(value),destroy:()=>unmount(app)};`;
 }else if(pack.framework==='solid'){
  imports=`import {${name}} from ${file};import {createSignal,createComponent} from 'solid-js';import {render} from 'solid-js/web';`;
  create=`const [options,setOptions]=createSignal({});const dispose=render(()=>createComponent(${name},{get options(){return options();}}),host);return {update:value=>setOptions(value),destroy:dispose};`;
 }else{imports=`import {mount} from ${file};`;create='return mount(host);';}
 const clock=pack.slug==='spider-music-player'?`import {gsap} from 'gsap';window.__spiderMotionClock={pause:()=>{gsap.globalTimeline.pause();},resume:()=>{gsap.globalTimeline.resume();}};`:'';
 return `${imports}\n${clock}\nwindow.__instances={};window.__mount=(id='demo')=>{let host=document.getElementById(id);if(!host){host=document.createElement('div');host.id=id;document.body.appendChild(host);}window.__instances[id]=(()=>{${create}})();};window.__update=(value,id='demo')=>window.__instances[id].update(value);window.__unmount=async(id='demo')=>{await window.__instances[id].destroy();delete window.__instances[id];};`;
}
for(const item of selected){
 const folder=path.join(SOURCE,item.slug,item.framework),pack=JSON.parse(await fs.readFile(path.join(folder,'package.json'),'utf8'));
 const entry=path.join(ROOT,'public',item.entry),target=path.join(OUT,item.slug,item.framework);
 await fs.mkdir(target,{recursive:true});
 await build({stdin:{contents:entrySource(pack,entry),resolveDir:ROOT,sourcefile:'entry.js',loader:'js'},outfile:path.join(target,'entry.js'),bundle:true,platform:'browser',format:'esm',target:'es2020',conditions:['browser'],plugins:[plugin],define:{'process.env.NODE_ENV':'"production"',__VUE_OPTIONS_API__:'false',__VUE_PROD_DEVTOOLS__:'false',__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:'false',__MOTION_NAME__:JSON.stringify(pack.component),__MOTION_SVELTE_FILE__:JSON.stringify(entry.replaceAll('\\','/'))},logLevel:'silent'});
 console.log(`COMPILED ${item.slug} ${item.framework}`);
}
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.endsWith('/entry.js')){const file=path.resolve(OUT,'.'+pathname);if(!file.startsWith(OUT+path.sep))throw new Error('invalid');res.setHeader('content-type','text/javascript');res.end(await fs.readFile(file));}else{res.setHeader('content-type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:white}#demo,#second{width:100%}</style></head><body><div id="demo"></div><script type="module" src="'+pathname.replace(/\/$/,'')+'/entry.js"></script></body></html>');}}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
let activePage,activeItem;
try{
 for(const item of selected){
  const context=await browser.newContext({viewport:{width:1200,height:1000},permissions:['clipboard-read','clipboard-write'],hasTouch:item.slug==='spider-music-player'||item.slug==='dot-matrix-trio'||item.slug==='notes-text-color'||item.slug==='selection-flower'||item.slug==='brand-poster-cards'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  activePage=page;activeItem=item;page.setDefaultTimeout(10000);
  if(item.slug==='inline-text-morph')await page.addInitScript(()=>{
   window.__inlineAnimations=[];const animate=Element.prototype.animate;
   Element.prototype.animate=function(...args){const animation=animate.apply(this,args);window.__inlineAnimations.push(animation);return animation;};
  });
  await page.addInitScript(()=>{window.__motionFrames=0;const request=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>request(time=>{window.__motionFrames++;callback(time);});});
  await page.goto(`${base}/${item.slug}/${item.framework}`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>Boolean(window.__mount));await page.evaluate(()=>window.__mount());
  await page.locator('[data-motion-surface]').waitFor();await page.evaluate(()=>document.fonts.ready);
  if(process.env.MOTION_INSPECT){console.log(JSON.stringify(await page.locator('[data-motion-surface]').evaluate(n=>({rules:[...n.shadowRoot.querySelector('style').sheet.cssRules].filter(r=>r.cssText.includes('--bg-page')).map(r=>r.cssText),nodes:[...n.shadowRoot.querySelectorAll('.motion-body,.widget-container,#access-widget,#toggle-btn')].map(el=>({tag:el.className,rect:el.getBoundingClientRect().toJSON(),style:Object.fromEntries(['display','visibility','opacity','background-color','width','height','position','z-index','mask-image'].map(key=>[key,getComputedStyle(el).getPropertyValue(key)]))}))})),null,2));await page.screenshot({path:path.join(OUT,'inspection.png')});break;}
  assert.equal(await page.locator('iframe').count(),0,'native mount must not use an iframe');
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${item.slug} ${item.framework} fits ${width}px`);
   if(item.framework==='react')await page.screenshot({path:path.join(OUT,`${item.slug}-native-${width}.png`)});
  }
  await page.setViewportSize({width:1200,height:1000});
  if(item.slug==='selection-flower')await verifySelectionFlower(page,item,ROOT,OUT);
  if(item.slug==='spider-music-player')await verifySpiderMusicPlayer(page,item,ROOT,OUT);
  if(item.slug==='crumpled-paper')await verifyCrumpledPaper(page,item,ROOT,OUT);
  if(item.slug==='notes-text-color')await verifyNotesTextColor(page,item,ROOT,OUT);
  if(item.slug==='brand-poster-cards')await verifyBrandPosterCards(page,item,ROOT,OUT);
  if(item.slug==='elastic-panel-resize')await verifyElasticPanel(page);
  if(item.slug==='inline-text-morph')await verifyInlineTextMorph(page);
  if(item.slug==='collection-layout-morph')await verifyCollectionLayoutMorph(page);
  if(item.slug==='galaxy-effort-slider')await verifyGalaxyEffortSlider(page,item,ROOT,OUT);
  if(item.slug==='blue-fluted-glass')await verifyBlueFlutedGlass(page,item,ROOT,OUT);
  if(item.slug==='bounding-box-resize')await verifyBoundingBoxResize(page,item,ROOT,OUT);
  if(item.slug==='dot-matrix-trio')await verifyDotMatrixTrio(page,item,ROOT,OUT);
  if(item.slug==='glass-tab-menu')await verifyGlassTabMenu(page,item,ROOT,OUT);
  if(item.slug==='staggered-radial-menu'||item.slug==='soft-action-wheel')await verifyStaggeredRadialMenu(page,item,ROOT,OUT);
  if(item.slug==='hammerhead-chart')await verifyHammerheadChart(page,item,ROOT,OUT);
  if(item.slug==='reasoning-effort-slider'||item.slug==='deep-agent-composer')await verifyDeepAgent(page,item,ROOT,OUT);
  if(item.slug==='sailing-toc'){
   const root=page.locator('.st-demo'),links=page.locator('.st-link'),scroller=page.locator('.st-scroll');
   await page.locator('.st-demo[data-ready=true]').waitFor();
   assert.equal(await links.count(),16);assert.equal(await root.getAttribute('data-active'),'3');
   if(item.framework==='react'){
    await page.evaluate(()=>{const style=document.createElement('style');style.textContent='.st-demo{--st-surface:#f4f4f4}';document.querySelector('#demo [data-motion-surface]').shadowRoot.append(style);});
    await page.locator('[data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components/sailing-toc.png')});
   }
   await verifySailingBoat(page);
   const route=await page.locator('.st-route').getAttribute('d'),start=await scroller.evaluate(n=>n.scrollTop);
   await links.nth(10).click();assert.equal(await root.getAttribute('data-active'),'10');
   await page.waitForTimeout(150);
   assert.notEqual(await page.locator('.st-route').getAttribute('d'),route,'the dashed route follows the moving ship');
   assert.notEqual(await scroller.evaluate(n=>n.scrollTop),start,'click navigation moves the real article');
   await page.locator('.st-demo[data-moving=false]').waitFor();
   assert.equal(await links.nth(10).getAttribute('aria-current'),'location');
   assert(Math.abs(await page.locator('.st-section').nth(10).evaluate(n=>n.offsetTop-n.closest('.st-scroll').scrollTop)-92)<2);
   await links.first().click();await links.nth(12).click();await page.locator('.st-demo[data-moving=false]').waitFor();
   assert.equal(await root.getAttribute('data-active'),'12','quick selections replace the previous destination');
   await links.first().click();await page.mouse.move(1000,300);await page.mouse.wheel(0,320);
   await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.st-demo').dataset.navigating==='false');
   await links.first().focus();await links.first().press('End');await page.keyboard.press('Enter');
   await page.locator('.st-demo[data-moving=false]').waitFor();assert.equal(await root.getAttribute('data-active'),'15');
   await page.emulateMedia({reducedMotion:'reduce'});await links.nth(5).click();
   assert.equal(await root.getAttribute('data-active'),'5');assert.equal(await root.getAttribute('data-moving'),'false');
   await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>window.__update({reducedMotion:true}));await links.nth(2).click();
   assert.equal(await root.getAttribute('data-active'),'2');assert.equal(await root.getAttribute('data-navigating'),'false');
   await page.evaluate(()=>window.__update({reducedMotion:false}));
   await page.locator('.st-demo[data-moving=false]').waitFor();await page.waitForTimeout(150);
   await page.locator('#demo').evaluate(n=>n.style.transform='translateY(1500px)');
   await page.waitForTimeout(200);
   const hidden=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>window.__motionFrames),hidden,'hidden boat stops its animation loop');
   await page.locator('#demo').evaluate(n=>n.style.transform='');
   await page.waitForTimeout(150);assert(await page.evaluate(()=>window.__motionFrames)>hidden,'visible boat resumes animation');
   await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__mount('reduced'));
   await page.locator('#reduced .st-demo[data-ready=true]').waitFor();
   assert.equal(await page.locator('#reduced .st-demo').getAttribute('data-active'),'3','initial reduced-motion mount still completes layout');
   await page.evaluate(()=>window.__unmount('reduced'));await page.emulateMedia({reducedMotion:'no-preference'});
  }else if(item.slug==='thinking-particles'){
   const root=page.locator('.thinking-demo'),canvas=page.locator('.tp-canvas'),visual=page.locator('.tp-visual');
   await page.waitForTimeout(1000);
   if(item.framework==='react'){
    await page.locator('[data-motion-surface]').screenshot({path:path.join(OUT,'thinking-particles-magnifier.png')});
    await page.evaluate(()=>{const style=document.createElement('style');style.textContent='.thinking-demo{background:#f4f4f4!important}';document.querySelector('#demo [data-motion-surface]').shadowRoot.append(style);});
    await page.locator('[data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components/thinking-particles.png')});
   }
   await page.getByRole('button',{name:'Pause thinking',exact:true}).click();
   const paused=await canvas.evaluate(n=>n.toDataURL()),time=await page.locator('.tp-clock').innerText();
   await page.waitForTimeout(180);assert.equal(await canvas.evaluate(n=>n.toDataURL()),paused);assert.equal(await page.locator('.tp-clock').innerText(),time);
   await canvas.focus();await canvas.press('ArrowRight');assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),paused,'keyboard rotates actual procedural geometry');
   await page.getByRole('button',{name:'Resume thinking',exact:true}).click();
   const seen=[];
   for(const shape of ['cube','bricks','robot','gift']){
    await page.waitForFunction(shape=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.tp-visual').dataset.shape===shape,shape,{timeout:14000});
    seen.push(shape);await page.waitForTimeout(800);
    if(item.framework==='react')await page.locator('[data-motion-surface]').screenshot({path:path.join(OUT,`thinking-particles-${shape}.png`)});
   }
   assert.equal(await page.locator('.tp-step:not([hidden])').count(),5);
   await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.thinking-demo').dataset.state==='complete',undefined,{timeout:15000});
   await page.locator('.tp-answer-actions:not([hidden])').waitFor();
   assert((await page.locator('.tp-answer-copy').innerText()).includes('controller board.'));
   await page.locator('.tp-copy-answer').click();assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('SO-101 robot arm for Dev'));
   await page.getByRole('button',{name:'Helpful',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Helpful',exact:true}).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Not helpful',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Helpful',exact:true}).getAttribute('aria-pressed'),'false');
   await page.locator('.tp-summary').click();assert.equal(await page.locator('.tp-summary').getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.tp-answer').getAttribute('hidden'),'');
   await page.locator('.tp-summary').click();
   if(item.framework==='react'){await page.waitForTimeout(650);await page.locator('[data-motion-surface]').screenshot({path:path.join(OUT,'thinking-particles-answer.png')});}
   await page.locator('.tp-rerun').click();assert.equal(await root.getAttribute('data-state'),'thinking');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.thinking-demo').dataset.state==='complete');
   assert((await page.locator('.tp-answer-copy').innerText()).includes('controller board.'));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>window.__update({reducedMotion:true}));
   await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.thinking-demo').dataset.state==='complete');
   await page.evaluate(()=>window.__update({reducedMotion:false}));
   await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.thinking-demo').dataset.state==='thinking');
   assert.equal(seen.length,4);assert.equal(await visual.count(),1);
  }else if(item.slug==='gradient-cover-wall'){
   assert.equal(await page.locator('.cover').count(),6);
   assert.equal(await page.locator('svg.pattern').count(),5);
   assert.equal(await page.locator('.bloom').count(),24);
   assert.equal(await page.locator('img').count(),0);
   const card=page.locator('.cover').nth(1),box=await card.boundingBox();
   const noise=await card.locator('canvas').evaluate(n=>n.toDataURL());
   const drift=await card.locator('.bloom').first().evaluate(n=>getComputedStyle(n).transform);
   await page.mouse.move(box.x+box.width*.8,box.y+box.height*.2);
   await page.waitForFunction(()=>{const card=document.querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.cover')[1];return parseFloat(card.style.getPropertyValue('--spring-x'))>3&&parseFloat(card.style.getPropertyValue('--spring-y'))<-3;});
   const transforms=await card.evaluate(n=>({colour:new DOMMatrix(getComputedStyle(n.querySelector('.colour-field')).transform).m41,pattern:new DOMMatrix(getComputedStyle(n.querySelector('.pattern')).transform).m41}));
   assert(transforms.colour>0&&transforms.pattern<0,'pattern and colour parallax oppose each other');
   assert.equal(await card.locator('canvas').evaluate(n=>n.toDataURL()),noise,'noise stays fixed while colours move');
   assert.notEqual(await card.locator('.bloom').first().evaluate(n=>getComputedStyle(n).transform),drift,'CSS gradient drift actually changes');
   await page.mouse.move(box.x+box.width*.2,box.y+box.height*.8);
   await page.waitForFunction(()=>parseFloat(document.querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.cover')[1].style.getPropertyValue('--spring-x'))<-3);
   await page.mouse.move(5,5);
   await page.waitForFunction(()=>document.querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.cover')[1].dataset.motionState==='idle');
   await card.focus();await card.press('ArrowRight');
   await page.waitForFunction(()=>parseFloat(document.querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.cover')[1].style.getPropertyValue('--spring-x'))>2);
   await card.press('Escape');
   await page.waitForFunction(()=>document.querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.cover')[1].dataset.motionState==='idle');
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await card.locator('.bloom').first().evaluate(n=>getComputedStyle(n).animationName),'none');
   await page.mouse.move(box.x+box.width*.85,box.y+box.height*.25);
   assert.equal(await card.evaluate(n=>getComputedStyle(n.querySelector('.colour-field')).transform),'none');
   await page.emulateMedia({reducedMotion:'no-preference'});
  }else if(item.slug==='otp-verification'){
   await page.getByRole('button',{name:'Enter verification code',exact:true}).click();
   const input=page.locator('input.otp-native');await input.fill('213212');await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('.otp-stage').dataset.state==='error');
   await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('.otp-stage').dataset.state==='input');
   assert.equal(await input.inputValue(),'');await input.fill('123456');await page.getByRole('button',{name:'Verified. Start again',exact:true}).waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('.otp-stage').dataset.state==='success');
   await page.getByRole('button',{name:'Verified. Start again',exact:true}).click();
  }else if(item.slug==='share-invite'){
   const button=page.locator('.share-morph');const identity=await button.evaluate(n=>{n.dataset.identity='same';return n.dataset.identity;});
   await page.locator('.close-button').click();await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('.share-shell').offsetHeight===56);await button.click();assert.equal(await button.getAttribute('data-identity'),identity);
   await page.locator('.email-input').fill('person@example.com');await page.locator('.role-trigger').click();await page.getByRole('option',{name:'Viewer',exact:true}).click();await page.locator('.send-button').click();await page.locator('.share-transfer').waitFor();await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelectorAll('.person-row').length===4);assert.equal(await page.locator('.person-role').last().innerText(),'Viewer');await page.locator('.copy-button').click();await page.getByText('Copied',{exact:true}).waitFor();assert((await page.evaluate(()=>navigator.clipboard.readText())).endsWith('#q4-plan'));
  }else if(item.slug==='bouncy-access'){
   await page.locator('#toggle-btn').click();await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('#access-widget').offsetHeight===296);await page.locator('#toggle-btn').click();
  }else if(item.slug==='morphing-timer'){
   await page.locator('#btn-toggle').click();await page.locator('.card-h .ctrl-btn').last().click();assert.equal(await page.locator('#wheel-h .active').innerText(),'4');await page.locator('#btn-toggle').click();assert.equal(await page.locator('#v-h').innerText(),'4');
  }else if(item.slug==='ai-generating'){
   assert.equal(await page.locator('.dot').count(),400);const before=await page.locator('.dot').evaluateAll(ns=>ns.map(n=>n.getAttribute('style')).join('|'));await page.waitForTimeout(250);const after=await page.locator('.dot').evaluateAll(ns=>ns.map(n=>n.getAttribute('style')).join('|'));assert.notEqual(before,after,'dot animation actually changes');
  }else if(item.slug==='velocity-drag'){
   const card=page.locator('#event-1'),before=await card.getAttribute('style'),box=await card.boundingBox();await page.mouse.move(box.x+15,box.y+15);await page.mouse.down();await page.mouse.move(box.x+box.width+45,box.y+110,{steps:12});await page.mouse.up();await page.waitForTimeout(900);assert.notEqual(await card.getAttribute('style'),before,'calendar event moves');
  }else if(item.slug==='brand-line-cards'){
   assert.equal(await page.locator('svg.mark').count(),3);const card=page.locator('.card').first(),box=await card.boundingBox();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.3);const before=await card.locator('canvas').evaluate(n=>n.toDataURL());await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6);await page.waitForTimeout(150);assert.notEqual(await card.locator('canvas').evaluate(n=>n.toDataURL()),before);await card.locator('.source').click();await page.locator('dialog[open]').waitFor();await page.locator('dialog .close').click();
  }
  if(item.slug==='glass-folder'){
   const first=page.locator('.gf-root').first();
   await expectReady();
   await first.locator('.gf-key--add').hover();
   await first.evaluate(n=>{n.__addAudit={removed:0};n.__addObserver=new MutationObserver(changes=>{for(const change of changes)for(const removed of change.removedNodes)if(removed.matches?.('.gf-sheet-slot'))n.__addAudit.removed++;});n.__addObserver.observe(n.querySelector('.gf-files'),{childList:true});});
   await first.locator('.gf-key--add').click();
   assert.equal(await first.locator('.gf-meta').innerText(),'4 items');
   assert.equal(await first.evaluate(n=>n.__addAudit.removed),0,'one add retains all existing sheets in place');
   assert(await first.locator('.gf-glyph--plus').evaluate(n=>n.getAnimations().some(a=>a.animationName==='gf-turn')),'plus turns on every add');
   await first.evaluate(n=>{n.__addObserver.disconnect();n.querySelector('.gf-sheet-slot:last-child').dataset.retained='';n.__addAudit.removed=0;n.__addObserver=new MutationObserver(changes=>{for(const change of changes)for(const removed of change.removedNodes)if(removed.matches?.('[data-retained]'))n.__addAudit.removed++;});n.__addObserver.observe(n.querySelector('.gf-files'),{childList:true});});
   for(let i=0;i<3;i++)await first.locator('.gf-key--add').click();
   assert.equal(await first.locator('.gf-meta').innerText(),'7 items');
   assert.equal(await first.locator('.gf-sheet').count(),4,'only the newest four files are shown');
   assert.equal(await first.locator('.gf-sheet--drop').count(),1,'rapid adds animate only the latest new sheet');
   assert.equal(await first.evaluate(n=>n.__addAudit.removed),0,'retained sheet is never detached during rapid adds');
   assert.equal(await first.locator('[data-retained]').count(),1);
   await page.waitForFunction(()=>!document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.gf-sheet--drop'));
   await first.evaluate(n=>n.__addObserver.disconnect());
   await first.locator('.gf-hit').click();await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.gf-root').hasAttribute('data-open'));
   await first.locator('.gf-key--add').click();assert.equal(await first.locator('.gf-meta').innerText(),'8 items');assert.equal(await first.locator('.gf-sheet').count(),4);
   await first.locator('.gf-sheet').last().click({position:{x:35,y:15}});assert((await page.locator('.gf-feedback').first().innerText()).startsWith('Selected:'));
   await first.locator('.gf-hit').press('Escape');assert.equal(await first.locator('.gf-files').getAttribute('inert'),'');
   await first.locator('.gf-key--add').focus();await first.locator('.gf-key--add').press('Enter');assert.equal(await first.locator('.gf-meta').innerText(),'9 items');
   assert(await first.locator('.gf-key--add').evaluate(n=>n.getRootNode().activeElement===n),'adding preserves keyboard focus');
   await page.emulateMedia({reducedMotion:'reduce'});await first.locator('.gf-key--add').press('Space');assert.equal(await first.locator('.gf-meta').innerText(),'10 items');assert.equal(await first.locator('.gf-sheet--drop').count(),0,'reduced motion leaves no stale drop class');await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('.gf-key--more').click();await page.getByRole('menuitem',{name:'Open folder',exact:true}).waitFor();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('.gf-root').nth(1).locator('.gf-meta').innerText(),'4 items');
   async function expectReady(){await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.motion-body').dataset.motionReady==='true');}
  }else if(item.slug==='cosmic-panels'){
   const canvas=page.locator('.cosmos-canvas').nth(1),panel=page.locator('.cosmos-panel').first();
   const before=await canvas.evaluate(n=>n.toDataURL());await page.waitForTimeout(200);assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),before,'halftone animation changes actual pixels');
   await panel.click();assert.equal(await panel.getAttribute('aria-pressed'),'true');const paused=await canvas.evaluate(n=>n.toDataURL());await page.waitForTimeout(200);assert.equal(await canvas.evaluate(n=>n.toDataURL()),paused,'pause stops drawing');
   await panel.press('Space');await page.waitForTimeout(120);assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),paused,'keyboard resumes drawing');
  }
  if(process.env.MOTION_POSTERS&&['glass-folder','cosmic-panels'].includes(item.slug)&&item.framework==='react'){
   await page.evaluate(async()=>{await window.__unmount();window.__mount();});await page.locator('[data-motion-surface]').waitFor();
   if(item.slug==='glass-folder')await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.motion-body').dataset.motionReady==='true');
   await page.mouse.move(1,1);await page.setViewportSize({width:1200,height:900});
   await page.evaluate(()=>{window.__update({height:900});const root=document.querySelector('#demo [data-motion-surface]').shadowRoot;const style=document.createElement('style');style.textContent='.glass-folder-demo,.cosmos-demo{min-height:900px;background:#f4f4f4!important}';root.append(style);});
   if(item.slug==='glass-folder')await page.waitForTimeout(2000);
   await page.locator('[data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components',item.slug+'.png')});
   await page.setViewportSize({width:1200,height:1000});
  }
  if(process.env.MOTION_EXTRAS&&item.slug==='share-invite'){
   await page.locator('.email-input').fill('invalid');await page.locator('.email-input').press('Enter');assert.equal(await page.locator('.invite-error').innerText(),'Enter a valid email address');
   await page.locator('.email-input').fill('');
   await page.locator('.email-input').evaluate(input=>{const data=new DataTransfer();data.setData('text','fresh@example.com, FRESH@example.com; person@example.com');input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));});
   assert.equal(await page.locator('.recipient-chips > .recipient-chip').count(),1,'paste deduplicates existing and repeated emails');
   await page.locator('.recipient-chips .chip-remove').click();assert.equal(await page.locator('.recipient-chips > .recipient-chip').count(),0);
   await page.evaluate(()=>window.__update({locale:'zh',reducedMotion:true}));await page.getByRole('button',{name:'关闭分享面板',exact:true}).waitFor();await page.getByRole('button',{name:'关闭分享面板',exact:true}).click();
   assert.equal(await page.locator('.share-shell').evaluate(n=>n.offsetHeight),56);await page.locator('.share-morph').click();
   await page.evaluate(()=>window.__update({locale:'en',reducedMotion:false}));
   await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(new Error('denied'))}));await page.locator('.copy-button').click();await page.getByText('Try again',{exact:true}).waitFor();
  }
  if(process.env.MOTION_EXTRAS&&item.slug==='otp-verification'){
   await page.evaluate(()=>window.__update({reducedMotion:true}));await page.getByRole('button',{name:'Enter verification code',exact:true}).click();
   await page.locator('.otp-native').fill('12');await page.locator('.otp-native').press('Backspace');assert.equal(await page.locator('.otp-native').inputValue(),'1');await page.locator('.otp-native').press('Escape');
   await page.getByRole('button',{name:'Enter verification code',exact:true}).click();
   await page.locator('.otp-native').evaluate(input=>{const data=new DataTransfer();data.setData('text','a1 b2c3/4d5e6');input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));});
   await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').shadowRoot.querySelector('.otp-stage').dataset.state==='success');
   await page.evaluate(()=>{window.__replayDone=false;window.__update({autoPlay:true,onReplayComplete:()=>window.__replayDone=true});});await page.waitForFunction(()=>window.__replayDone,{},{timeout:15000});
   await page.evaluate(()=>window.__update({autoPlay:false}));
  }
  await page.evaluate(()=>window.__update({height:620}));await page.waitForFunction(()=>document.querySelector('#demo').querySelector('[data-motion-surface]').style.getPropertyValue('--motion-height')==='620px');
  await page.evaluate(()=>window.__mount('second'));await page.locator('#second [data-motion-surface]').waitFor();assert.equal(await page.locator('[data-motion-surface]').count(),2);
  if(item.slug==='dot-matrix-trio'){
   await page.locator('#second .dm-poster').first().click();
   assert.equal(await page.locator('#second .dm-scene').getAttribute('data-paused'),'true');
   assert.equal(await page.locator('#demo .dm-scene').getAttribute('data-paused'),'false','dot matrix instances keep independent playback states');
  }
  if(item.slug==='crumpled-paper'){
   await page.locator('#second .cp-canvas').evaluate(n=>window.__crumpleGL.push(n.getContext('webgl')));
   await page.locator('#second .cp-hit').first().focus();assert.equal(await page.locator('#second .cp-hit').first().getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#demo .cp-hit').first().getAttribute('aria-expanded'),'false','instances keep independent open states');
  }
  if(item.slug==='glass-tab-menu'){
   await page.locator('#second .gt-tab').first().click();
   assert.equal(await page.locator('#second .glass-tab-demo').getAttribute('data-selection'),'0');
   assert.equal(await page.locator('#demo .glass-tab-demo').getAttribute('data-selection'),'2','instances retain independent tab selections');
  }
  if(item.slug==='staggered-radial-menu'||item.slug==='soft-action-wheel'){
   await page.locator('#second .rm-toggle').click();await page.locator('#second .radial-menu-demo[data-open=true]').waitFor();
   assert.equal(await page.locator('#demo .radial-menu-demo').getAttribute('data-open'),'false','instances retain independent open states');
  }
  if(item.slug==='elastic-panel-resize'){
   await page.locator('#second .er-handle').focus();await page.locator('#second .er-handle').press('Home');
   assert.equal(await page.locator('#second .er-handle').getAttribute('aria-valuenow'),'72.4');
   assert.equal(await page.locator('#demo .er-handle').getAttribute('aria-valuenow'),'61.4','instances resize independently');
  }
  if(item.slug==='inline-text-morph'){
   await page.locator('#second .itm-token[data-group=agent]').click();
   assert.equal(await page.locator('#second .itm-token[data-group=agent]').getAttribute('data-value'),'Claude');
   assert.equal(await page.locator('#demo .itm-token[data-group=agent]').getAttribute('data-value'),'ChatGPT','instances keep independent phrase selections');
   await page.waitForTimeout(70);
  }
  if(item.slug==='galaxy-effort-slider'){
   await page.locator('#second .ge-control').press('End');
   assert.equal(await page.locator('#second .ge-control').getAttribute('aria-valuetext'),'Galaxy');
   assert.equal(await page.locator('#demo .ge-control').getAttribute('aria-valuetext'),'Low','effort values are instance-local');
  }
  if(item.slug==='collection-layout-morph'){
   await page.locator('#second .clm-tab[data-view=pack]').click();
   assert.equal(await page.locator('#second .clm-scene').getAttribute('data-view'),'pack');
   assert.equal(await page.locator('#demo .clm-scene').getAttribute('data-view'),'list','collection views are instance-local');
   const ids=await page.locator('.clm-art [id]').evaluateAll(nodes=>nodes.map(node=>node.id));assert.equal(ids.length,new Set(ids).size,'SVG paint IDs are unique across instances');
   await page.evaluate(()=>window.__collectionDetached=[...document.querySelectorAll('[data-motion-surface]')].flatMap(host=>[...host.shadowRoot.querySelectorAll('.clm-tile')]));
  }
  if(item.slug==='spider-music-player'){
   const ids=await page.locator('.sm-spider [id]').evaluateAll(nodes=>nodes.map(node=>node.id));assert.equal(ids.length,new Set(ids).size,'spider gradient IDs stay unique across instances');
   await page.evaluate(()=>window.__update({reducedMotion:true,track:1,playing:false},'second'));
   await page.locator('#second .sm-scene[data-track="1"]').waitFor();
   assert.equal(await page.locator('#second .sm-scene').getAttribute('data-track'),'1');
   assert.equal(await page.locator('#demo .sm-scene').getAttribute('data-track'),'0','music instances have independent queues and selections');
   assert.equal(await page.locator('#second .sm-row').count(),8);
   assert.equal(await page.locator('#demo .sm-row').count(),9,'added songs are instance-local');
   await page.evaluate(()=>{window.__update({reducedMotion:false,track:3});window.__smDetached=[...document.querySelectorAll('[data-motion-surface]')].flatMap(host=>[...host.shadowRoot.querySelectorAll('.sm-art,.sm-spider')]);});
   await page.locator('#demo .sm-scene:not([data-phase=idle])').waitFor();
  }
  await page.evaluate(()=>window.__unmount('second'));await page.evaluate(()=>window.__unmount());assert.equal(await page.locator('[data-motion-surface]').count(),0);
  if(item.slug==='spider-music-player'){
   const frozen=await page.evaluate(()=>window.__smDetached.map(node=>node.getAttribute('style')));await page.waitForTimeout(150);
   assert.deepEqual(await page.evaluate(()=>window.__smDetached.map(node=>node.getAttribute('style'))),frozen,'unmount immediately freezes covers and spider during a transfer');
  }
  if(item.slug==='collection-layout-morph'){
   const frozen=await page.evaluate(()=>window.__collectionDetached.map(node=>node.getAttribute('style')));await page.waitForTimeout(150);
   assert.deepEqual(await page.evaluate(()=>window.__collectionDetached.map(node=>node.getAttribute('style'))),frozen,'unmount immediately freezes interrupted image transitions');
  }
  if(item.slug==='inline-text-morph')assert.equal(await page.evaluate(()=>window.__inlineAnimations.filter(animation=>animation.playState==='running'||animation.playState==='paused').length),0,'unmount cancels detached glyph animations too');
  if(item.slug==='crumpled-paper')assert(await page.evaluate(()=>window.__crumpleGL.every(gl=>gl.isContextLost())),'unmount explicitly releases the WebGL context');
  if(item.slug==='blue-fluted-glass')assert(await page.evaluate(()=>window.__bfgContexts.every(gl=>gl.isContextLost())),'unmount releases the blue fluid WebGL contexts');
  await page.waitForTimeout(['share-invite','otp-verification','reasoning-effort-slider','deep-agent-composer','notes-text-color','brand-poster-cards','collection-layout-morph','spider-music-player'].includes(item.slug)?2400:250);const before=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__motionFrames),before,'animation callbacks stop after unmount');
  if(item.slug==='elastic-panel-resize'){
   await page.evaluate(()=>{document.getElementById('demo').style.display='none';window.__mount();});
   await page.evaluate(()=>{document.getElementById('demo').style.display='block';});
   await page.locator('#demo .er-handle').waitFor();
   await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.er-scene').dataset.position==='0.38650');
   assert.equal(await page.locator('#demo .er-handle').getAttribute('aria-valuenow'),'61.4','remount restores initial width');
   await page.evaluate(()=>window.__unmount());assert.equal(await page.locator('[data-motion-surface]').count(),0);
  }
  if(item.slug==='dot-matrix-trio'){
   await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__mount());
   await page.locator('#demo .dm-scene').waitFor();
   assert.equal(await page.locator('#demo .dm-scene').getAttribute('data-time'),'0.000','remount starts with the initial phase');
   assert.equal(await page.locator('#demo .dm-scene').getAttribute('data-paused'),'false');
   await page.evaluate(()=>window.__unmount());assert.equal(await page.locator('[data-motion-surface]').count(),0);
  }
  assert.deepEqual(errors,[]);
  reports.push({slug:item.slug,framework:item.framework,compiled:true,native:true,interaction:true,update:true,multiInstance:true,unmount:true,pageErrors:errors});
  console.log(`PASS ${item.slug} ${item.framework}: interaction, update, multi-instance, cleanup`);
  await context.close();
 }
 await fs.writeFile(path.join(OUT,filters.length?'partial-results.json':'results.json'),JSON.stringify({components:new Set(selected.map(x=>x.slug)).size,packages:reports.length,checks:reports},null,2));
}catch(error){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:path.join(OUT,'failure.png')});await fs.writeFile(path.join(OUT,'failure.json'),JSON.stringify({item:activeItem,error:String(error),state:await activePage.locator('[data-motion-surface]').evaluateAll(nodes=>nodes.map(n=>({html:n.shadowRoot.innerHTML.slice(-1400),rect:n.getBoundingClientRect().toJSON()})))},null,2));if(activeItem?.slug==='spider-music-player')await fs.writeFile(path.join(OUT,'spider-failure-motion.json'),JSON.stringify(await activePage.evaluate(()=>window.__smMotion??[])));}throw error;}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
console.log(`Verified ${reports.length} real framework packages.`);
