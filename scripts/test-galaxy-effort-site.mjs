import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',out=path.resolve('outputs/ozzyxs1a-2107523169649389677/site');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[],clipboard=[];
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(60000);
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{
 window.__copyCalls=[];
 for(const method of ['write','writeText']){
  const original=navigator.clipboard[method].bind(navigator.clipboard);
  navigator.clipboard[method]=async(...args)=>{
   const call={method,start:performance.now(),focused:document.hasFocus()};window.__copyCalls.push(call);
   try{const result=await original(...args);call.result='success';return result;}catch(error){call.result=error.name+': '+error.message;throw error;}
  };
 }
});
try{
 await page.goto(base+'/docs/animations/galaxy-effort-slider',{waitUntil:'domcontentloaded'});await page.bringToFront();
 const code=page.locator('section[aria-label="Code"]'),trigger=code.locator('button[aria-label="框架"]');
 const packages=JSON.parse(await fs.readFile('public/motion-frameworks/galaxy-effort-slider/packages.json','utf8'));
 const demoFrame=page.frameLocator('section[aria-label="Demo"] iframe');
 // Start with Vanilla to isolate its assets and real clipboard operation.
 const pack=packages.find(item=>item.framework==='vanilla');await trigger.click();await page.getByRole('option',{name:'Vanilla',exact:true}).click();
 const button=code.getByRole('button',{name:'复制完整代码包',exact:true});await button.click();
 await expect.poll(()=>page.evaluate(()=>window.__copyCalls.at(-1)?.result),{timeout:15000}).toBe('success');
 assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),pack.bundle.replace(/\r\n/g,'\n'));
 clipboard.push({framework:'vanilla',bundle:true});
 await expect(button).toBeVisible();
 await page.evaluate(()=>{window.__savedClipboardWrite=navigator.clipboard.write;navigator.clipboard.write=()=>Promise.reject(new DOMException('Permission denied for retry test','NotAllowedError'));});
 await button.click();const retry=code.getByRole('button',{name:'复制失败，请重试',exact:true});await expect(retry).toBeVisible();
 await page.evaluate(()=>{navigator.clipboard.write=window.__savedClipboardWrite;});await retry.click();
 await expect(code.getByRole('button',{name:'已复制',exact:true})).toBeVisible();
 assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),pack.bundle.replace(/\r\n/g,'\n'));
 clipboard.push({failureFeedback:true,retry:true});
 await page.evaluate(()=>window.scrollTo(0,0));
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===375){
   const outer=await page.locator('section[aria-label="Demo"] iframe').boundingBox();
   const targets=await demoFrame.locator('.galaxy-effort-demo').evaluate(n=>({width:n.ownerDocument.defaultView.innerWidth,help:n.querySelector('.ge-help').getBoundingClientRect().height,slider:n.querySelector('.ge-control').getBoundingClientRect().height}));
   assert(targets.help*outer.width/targets.width>=24,'mobile help hit target is at least 24px');
   assert(targets.slider*outer.width/targets.width>=24,'mobile slider hit target is at least 24px');
  }
  await page.screenshot({path:path.join(out,`details-${width}.png`)});
 }
 await demoFrame.locator('.ge-control').press('End');
 await expect(demoFrame.locator('.galaxy-effort-demo')).toHaveAttribute('data-galaxy','1.0000');
 await page.locator('section[aria-label="Demo"]').screenshot({path:path.join(out,'details-galaxy.png')});
 await demoFrame.locator('.ge-control').press('Home');
 // The sidebar uses the shared 224×168 floating player and releases it on exit.
 const nav=page.locator('aside a[href="/docs/animations/galaxy-effort-slider"]');await nav.hover();
 const floating=page.locator('[data-motion-preview="galaxy-effort-slider"]');await expect(floating).toHaveAttribute('data-preview-state','playing');
 await expect(floating.locator('[data-scene-ready]')).toHaveAttribute('data-scene-ready','true');
 const preview=floating.frameLocator('iframe');await expect(preview.locator('.ge-control')).toHaveAttribute('aria-valuetext','Galaxy',{timeout:7000});
 await floating.screenshot({path:path.join(out,'sidebar-galaxy.png')});
 await page.mouse.move(1100,90);await expect(floating).toHaveCount(0);
 await nav.focus();await expect(floating).toHaveCount(1);await page.keyboard.press('Tab');await expect(floating).toHaveCount(0);
 await page.goto(base+'/components',{waitUntil:'domcontentloaded'});
 const card=page.locator('[data-component-card="/docs/animations/galaxy-effort-slider"]'),scene=card.locator('[data-motion-preview]');
 await expect(scene).toHaveAttribute('data-preview-state','poster');
 await card.screenshot({path:path.join(out,'gallery-poster.png')});
 await card.hover();await expect(scene).toHaveAttribute('data-preview-state','playing');await expect(scene.locator('[data-scene-ready]')).toHaveAttribute('data-scene-ready','true');
 const live=scene.frameLocator('iframe');await expect(live.locator('.ge-control')).toHaveAttribute('aria-valuetext','Galaxy',{timeout:7000});
 assert.equal(await live.locator('.galaxy-effort-demo').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');
 await card.screenshot({path:path.join(out,'gallery-galaxy.png')});
 await page.mouse.move(1100,20);await expect(scene).toHaveAttribute('data-preview-state','poster');await expect(scene.locator('iframe')).toHaveCount(0);
 await card.hover();await expect(scene.locator('iframe')).toHaveCount(1);await page.mouse.wheel(0,1200);await expect(scene.locator('iframe')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({widths:[375,768,1440],clipboard,sidebar:{animated:true,keyboard:true,released:true},gallery:{animated:true,background:true,released:true},pageErrors:errors},null,2));
 console.log('PASS galaxy effort site: real Vanilla clipboard, three widths, animated gallery/sidebar, focus and release');
}catch(error){
 const calls=await page.evaluate(()=>window.__copyCalls).catch(()=>[]);
 await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:String(error),clipboard:calls,pageErrors:errors},null,2));
 await page.screenshot({path:path.join(out,'failure.png')});throw error;
}finally{await browser.close();}
