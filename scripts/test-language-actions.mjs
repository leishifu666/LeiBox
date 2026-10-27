import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const output=path.resolve('work/language-switch-six-20261027/actions');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
  for(const width of [375,658,768,1440]){
    const page=await browser.newPage({viewport:{width,height:1000},colorScheme:'light'});
    await page.addInitScript(()=>{try{localStorage.setItem('canvasui:locale','zh');localStorage.setItem('theme','light');}catch{}});
    await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>document.querySelector('[data-hero-actions]').getAnimations().every(animation=>animation.playState==='finished'));
    await page.evaluate(()=>{
      window.actionFrames=[];
      const sample=kind=>{
        const node=document.querySelector('[data-hero-actions] a'),box=node.getBoundingClientRect(),arrow=node.querySelector('[data-soft-arrow]').getBoundingClientRect();
        window.actionFrames.push({kind,time:performance.now(),phase:document.documentElement.dataset.languageTransition,x:box.x,y:box.y,width:box.width,opacity:getComputedStyle(node).opacity,arrowX:arrow.x,arrowY:arrow.y});
      };
      document.addEventListener('click',event=>{if(event.target.closest('[data-language-toggle]'))sample('click-after');});
      const tick=()=>{sample('frame');if(actionFrames.length<600)requestAnimationFrame(tick);};tick();
    });
    for(const locale of ['en','zh']){
      const before=await page.locator('[data-hero-actions] a').first().boundingBox();
      await page.evaluate(()=>{window.actionFrames=[];});
      await page.locator('[data-language-toggle]:visible').click();
      await page.waitForFunction(()=>document.documentElement.dataset.languageTransition==='gravity-focus');
      const playback=await page.evaluate(()=>{
        const animations=document.getAnimations().filter(animation=>animation.id==='language-layout');
        const saved=animations.map(animation=>({time:animation.currentTime,state:animation.playState}));
        animations.forEach(animation=>animation.pause());
        const samples=[];
        for(let index=0;index<=32;index++){
          animations.forEach(animation=>{animation.currentTime=index/32*550;});
          const node=document.querySelector('[data-hero-actions] a'),box=node.getBoundingClientRect();
          samples.push({x:box.x,y:box.y,width:box.width,opacity:getComputedStyle(node).opacity});
        }
        animations.forEach((animation,index)=>{animation.currentTime=saved[index].time;if(saved[index].state==='running')animation.play();});
        return{count:animations.length,samples};
      });
      await page.waitForFunction(()=>!document.documentElement.dataset.languageTransition);
      const after=await page.locator('[data-hero-actions] a').first().boundingBox();
      const frames=await page.evaluate(()=>window.actionFrames.filter(frame=>frame.phase));
      await fs.writeFile(path.join(output,`${width}-${locale}-trace.json`),JSON.stringify({before,after,frames,playback},null,2));
      const first=frames.find(frame=>frame.kind==='click-after');
      assert(first,'No initial language-switch geometry was captured');
      assert(Math.abs(first.y-before.y)<1.5,`Button jumped vertically at ${width}px: ${JSON.stringify({before,first,after})}`);
      assert(Math.abs(first.x-before.x)<1.5,`Button jumped horizontally at ${width}px`);
      assert(Math.abs(first.width-before.width)<1.5,`Button width jumped at ${width}px`);
      assert(frames.every(frame=>Number(frame.opacity)>.99),'The black surface faded during language change');
      const distance=Math.abs(after.y-before.y);
      assert(playback.count>=3,'CTA geometry does not have independent native playback');
      assert(Math.abs(playback.samples[0].y-before.y)<1.5,'Native motion lost the original position');
      assert(Math.abs(playback.samples.at(-1).y-after.y)<1.5,'Native motion missed the destination');
      if(distance>5)assert(playback.samples.filter(frame=>Math.abs(frame.y-before.y)>1.5&&Math.abs(frame.y-after.y)>1.5).length>=4,'Button skipped the intermediate positions');
      assert(Math.abs(frames.at(-1).y-after.y)<1.5,'Button did not settle at its final position');
      assert.equal(await page.locator('[data-hero-actions]').evaluate(node=>node.style.transform),'');
      assert.equal(await page.locator('[data-hero-actions] a').first().evaluate(node=>node.style.width),'');
      if(width!==658)await page.screenshot({path:path.join(output,`${width}-${locale}-final.png`)});
      results.push({width,locale,before,after,frames:frames.length,status:'passed'});
      console.log(JSON.stringify({width,locale,status:'passed'}));
    }
    await page.close();
  }
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
}finally{await browser.close();}
