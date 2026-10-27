import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const output=path.resolve('work/memory-opt-20261027/verification');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,colorScheme:'light'});
await context.addInitScript(()=>{
  window.__releasedWebGL=0;
  const canvases=new WeakSet(),original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
    const result=original.call(this,type,...args);
    if(result&&/webgl/.test(type)&&!canvases.has(this)){canvases.add(this);this.addEventListener('webglcontextlost',()=>window.__releasedWebGL++);}
    return result;
  };
});
const page=await context.newPage();
const errors=[],videoRequests=[],results={base,panels:[],screenshots:[],errors};
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(new URL(request.url()).pathname.endsWith('.webm'))videoRequests.push(request.url());});
const cdp=await context.newCDPSession(page);

async function retention(kind){
  const selector=`[data-claude-panel="${kind}"]`;
  const fn=await cdp.send('Runtime.evaluate',{expression:`document.querySelector(${JSON.stringify(selector)})._lbApi.setStep`,objectGroup:'memoryTest'});
  const props=await cdp.send('Runtime.getProperties',{objectId:fn.result.objectId,ownProperties:true});
  const scopes=props.internalProperties.find(p=>p.name==='[[Scopes]]').value.objectId;
  const list=await cdp.send('Runtime.getProperties',{objectId:scopes,ownProperties:true});
  for(const scope of list.result.filter(p=>/^\d+$/.test(p.name)&&p.value?.objectId)){
    const bindings=await cdp.send('Runtime.getProperties',{objectId:scope.value.objectId,ownProperties:true});
    for(const binding of bindings.result.filter(p=>p.value?.objectId&&p.value.className==='Object')){
      const object=await cdp.send('Runtime.getProperties',{objectId:binding.value.objectId,ownProperties:true});
      if(!object.result.some(p=>p.name==='ctx')||!object.result.some(p=>p.name==='tls'))continue;
      const value=await cdp.send('Runtime.callFunctionOn',{objectId:binding.value.objectId,functionDeclaration:'function(){return {contextEntries:this.ctx.data.length,timelines:this.tls.length}}',returnByValue:true});
      await cdp.send('Runtime.releaseObjectGroup',{objectGroup:'memoryTest'});
      return value.result.value;
    }
  }
  throw Error(`Missing ${kind} controller`);
}

async function assertVisibleMedia(){
  await expect.poll(()=>page.evaluate(()=>[...document.querySelectorAll('.marquee-track [data-component-home-card]')].filter(card=>{
    const r=card.getBoundingClientRect(),clip=card.closest('.marquee').getBoundingClientRect();
    return r.right>clip.left+5&&r.left<clip.right-5;
  }).filter(card=>!card.querySelector('img,video')).length)).toBe(0);
}

try{
  await page.goto(base+'/components',{waitUntil:'networkidle'});
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);}
  assert.equal(videoRequests.length,0,'Idle cards opened video media requests');
  assert.equal(await page.locator('video[src]').count(),0);
  assert(await page.locator('video[poster]').count()>0,'Video posters are missing');
  const video=page.locator('main video').first();
  const card=video.locator('xpath=ancestor::*[@data-preview-card][1]');
  await card.hover();
  await expect.poll(()=>video.evaluate(v=>!v.paused&&v.currentTime>0)).toBe(true);
  await page.mouse.move(1439,1);
  await expect.poll(()=>video.getAttribute('src')).toBe(null);
  const link=card.locator('a');await link.focus();
  await expect.poll(()=>video.evaluate(v=>!v.paused)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>video.getAttribute('src')).toBe(null);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect.poll(()=>video.evaluate(v=>!v.paused)).toBe(true);
  await page.evaluate(()=>document.activeElement.blur());
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await expect.poll(()=>page.locator('video[src]').count()).toBe(0);
  results.video={idleRequests:0,hover:true,keyboard:true,reducedMotion:true,offscreenRelease:true};
  console.log('Video posters, hover, focus, reduced motion and offscreen release passed.');

  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.agent-demo').scrollIntoViewIfNeeded();
  const native=page.locator('.agent-demo [data-site-native-preview="glass-folder"]');
  await expect(native.locator('.gf-root')).toHaveCount(3,{timeout:15000});
  await expect(page.locator('.agent-demo [data-scene-ready="true"]')).toHaveCount(1,{timeout:15000});
  await expect(native.locator('.gf-root').first()).toHaveAttribute('data-open','',{timeout:5000});
  let maxAgentFrames=0;
  for(let i=0;i<24;i++){
    maxAgentFrames=Math.max(maxAgentFrames,await page.locator('.agent-demo iframe').count());
    await page.waitForTimeout(250);
  }
  assert.equal(maxAgentFrames,0,'The guided tutorial should use its native engine without an iframe');
  results.agentDemo={maxConcurrentFrames:maxAgentFrames,nativeFolders:3,actualOpenAction:true};
  const gallery=page.locator('section[aria-labelledby="gallery-heading"]');
  await gallery.scrollIntoViewIfNeeded();
  await expect(page.locator('.marquee-track')).toHaveCount(2);
  await assertVisibleMedia();
  const links=await page.locator('.marquee-track a').count();
  const media=await page.locator('.marquee-track video,.marquee-track [data-motion-preview]').count();
  assert(media>0&&media<links/2,`Too many mounted previews: ${media}/${links}`);
  for(const fraction of [.23,.51,.99,1.01]){
    await page.evaluate(f=>{for(const a of document.getAnimations()){if(a.effect?.target?.classList?.contains('marquee-track'))a.currentTime=Number(a.effect.getTiming().duration)*f;}},fraction);
    await page.waitForTimeout(200);await assertVisibleMedia();
  }
  await page.locator('.marquee-track ul').first().locator('a').nth(12).focus();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.activeElement.closest('[data-component-home-card]')?.querySelector('img,video')))).toBe(true);
  await page.evaluate(()=>document.activeElement.blur());
  await page.evaluate(()=>scrollTo(0,0));
  await expect.poll(()=>page.locator('.marquee-track video,.marquee-track [data-motion-preview]').count()).toBe(0);
  assert.equal(await page.locator('.marquee-track a').count(),links,'Offscreen unloading removed catalog links');
  results.marquee={links,mountedMedia:media,loopCoverage:true,keyboard:true,offscreenRelease:true};
  console.log(`Marquee passed: ${media} mounted previews for ${links} links, including the loop boundary.`);

  const footer=page.locator('section[aria-labelledby="cta-heading"]');
  for(let cycle=0;cycle<3;cycle++){
    await footer.scrollIntoViewIfNeeded();
    await expect(page.locator('.agent-demo [data-site-native-preview]')).toHaveCount(0);
    await expect.poll(()=>footer.locator('canvas').count()).toBeGreaterThan(0);
    await expect.poll(()=>footer.locator('canvas').last().evaluate(c=>c.width)).toBeGreaterThan(1000);
    assert(await footer.locator('canvas').last().evaluate(c=>c.width<=Math.ceil(c.clientWidth*1.25)),'Decorative canvas exceeds its density budget');
    await page.evaluate(()=>scrollTo(0,0));
    await expect.poll(()=>footer.locator('canvas').count()).toBe(0);
  }
  assert(await page.evaluate(()=>window.__releasedWebGL)>=3,'GPU contexts were not explicitly released');
  results.footer={cycles:3,releasedContexts:await page.evaluate(()=>window.__releasedWebGL)};
  console.log('Footer releases and recreates its GPU context across three scroll cycles.');

  for(const kind of ['discovery','frameworks']){
    const selector=`[data-claude-panel="${kind}"]`;
    await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(500);
    const before=await retention(kind);
    for(let round=0;round<4;round++){
      await page.evaluate(selector=>{const api=document.querySelector(selector)._lbApi;for(let i=0;i<50;i++)api.setStep(i%3);},selector);
      await page.waitForTimeout(100);
    }
    const after=await retention(kind);
    assert(after.contextEntries<=12,`${kind} retains ${after.contextEntries} animation records`);
    assert(after.timelines<=1,`${kind} retains ${after.timelines} timelines`);
    results.panels.push({kind,before,after});
  }
  const discovery=page.locator('[data-claude-panel="discovery"]');
  await discovery.scrollIntoViewIfNeeded();
  await discovery.evaluate(el=>el._lbApi.setStep(2));
  await expect(discovery.locator('iframe')).toHaveAttribute('src','/motion/glass-folder.html');
  await page.evaluate(()=>scrollTo(0,0));
  await expect.poll(()=>discovery.locator('iframe').getAttribute('src')).toBe(null);
  console.log('Both panel animation collections remain bounded after 200 changes; inactive demo iframe unloads.');

  for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});
    await page.goto(base,{waitUntil:'networkidle'});await page.waitForTimeout(800);
    const nativeCards=page.locator('.agent-demo [data-site-native-preview] .gf-root');
    await expect(nativeCards).toHaveCount(3,{timeout:15000});
    const tops=await nativeCards.evaluateAll(cards=>cards.map(card=>card.getBoundingClientRect().top));
    assert(Math.max(...tops)-Math.min(...tops)<2,`The scaled native scene changed to a vertical layout at ${width}`);
    for(const [name,locator] of [['home',null],['gallery',gallery],['footer',footer]]){
      if(locator)await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      if(name==='gallery')await assertVisibleMedia();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow at ${width}/${name}`);
      const file=path.join(output,`${width}-${name}.png`);await page.screenshot({path:file});results.screenshots.push(file);
    }
    await page.goto(base+'/components',{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(output,`${width}-components.png`)});
  }
  assert.deepEqual(errors,[],'Browser errors were observed');
  console.log('375 / 768 / 1440 screenshots and overflow checks passed.');
}finally{
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
  await browser.close();
}
