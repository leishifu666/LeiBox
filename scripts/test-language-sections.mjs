import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const output=path.resolve('work/language-switch-six-20261027/sections');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
  for(const width of [1440,658,768,375]){
    const page=await browser.newPage({viewport:{width,height:1000},colorScheme:'light'});
    await page.addInitScript(()=>{try{localStorage.setItem('canvasui:locale','zh');localStorage.setItem('theme','light');}catch{}});
    await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    for(const locale of ['en','zh']){
      await page.locator('section[aria-labelledby="cta-heading"]').evaluate(node=>{window.scrollTo(0,window.scrollY+node.getBoundingClientRect().top-300);});
      await page.waitForTimeout(600);await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      const before=await page.locator('section[aria-labelledby="cta-heading"]').boundingBox();
      await page.evaluate(()=>{
        window.sectionFrames=[];
        const sample=kind=>{const node=document.querySelector('section[aria-labelledby="cta-heading"]'),box=node.getBoundingClientRect();sectionFrames.push({kind,y:box.y,height:box.height,scrollY,phase:document.documentElement.dataset.languageTransition});};
        window.sectionSampler=sample;
        if(!window.sectionListener){document.addEventListener('click',event=>{if(event.target.closest('[data-language-toggle]'))window.sectionSampler('click-after');});window.sectionListener=true;}
        const tick=()=>{if(!window.sectionSampler)return;window.sectionSampler('frame');requestAnimationFrame(tick);};if(!window.sectionTick){window.sectionTick=true;tick();}
      });
      await page.locator('[data-language-toggle]:visible').click();
      await page.waitForFunction(()=>document.documentElement.dataset.languageTransition==='gravity-focus');
      const playback=await page.evaluate(()=>{
        const section=document.querySelector('section[aria-labelledby="cta-heading"]');
        const animations=document.getAnimations().filter(animation=>animation.id==='language-layout');
        const saved=animations.map(animation=>({time:animation.currentTime,state:animation.playState}));
        animations.forEach(animation=>animation.pause());const samples=[];
        for(let i=0;i<=32;i++){animations.forEach(animation=>{animation.currentTime=i/32*550;});const box=section.getBoundingClientRect();samples.push({y:box.y,height:box.height});}
        animations.forEach((animation,index)=>{animation.currentTime=saved[index].time;if(saved[index].state==='running')animation.play();});
        const bodyGhost=document.querySelector('[data-language-ghosts=""]'),header=document.querySelector('header');
        return{samples,hasNativeSection:animations.some(animation=>animation.effect?.target===section),bodyBehindHeader:Number(getComputedStyle(bodyGhost).zIndex)<Number(getComputedStyle(header).zIndex)};
      });
      await page.waitForFunction(()=>!document.documentElement.dataset.languageTransition);
      const after=await page.locator('section[aria-labelledby="cta-heading"]').boundingBox();
      const frames=await page.evaluate(()=>sectionFrames.filter(frame=>frame.phase));
      const first=frames.find(frame=>frame.kind==='click-after');
      const record={width,locale,before,after,frames,playback};
      await fs.writeFile(path.join(output,`${width}-${locale}-trace.json`),JSON.stringify(record,null,2));
      assert(first,'No initial section geometry was captured');
      assert(playback.bodyBehindHeader,'Moving body text covered the fixed navigation');
      assert(Math.abs(first.y-before.y)<2,`Black section jumped immediately: ${JSON.stringify({width,locale,before,first,after})}`);
      if(Math.abs(after.y-before.y)>3){
        assert(playback.hasNativeSection,'The whole black section has no layout playback');
        assert(Math.abs(playback.samples[0].y-before.y)<2,'Section did not start at the old position');
        assert(Math.abs(playback.samples.at(-1).y-after.y)<2,'Section did not reach its final position');
        assert(playback.samples.some(sample=>Math.abs(sample.y-before.y)>2&&Math.abs(sample.y-after.y)>2),'Section skipped intermediate positions');
      }
      assert.equal(await page.locator('[data-language-ghosts]').count(),0);
      assert.equal(await page.locator('section[aria-labelledby="cta-heading"]').evaluate(node=>node.style.transform),'');
      assert.equal(await page.evaluate(()=>document.documentElement.style.overflowAnchor),'');
      if(width!==658)await page.screenshot({path:path.join(output,`${width}-${locale}-final.png`)});
      results.push({width,locale,before,after,status:'passed'});console.log(JSON.stringify({width,locale,status:'passed'}));
    }
    await page.close();
  }
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
}finally{await browser.close();}
