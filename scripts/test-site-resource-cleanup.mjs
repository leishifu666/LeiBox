import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {chromium,expect} from 'playwright/test';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',out='outputs/site-cleanup-20261105/browser';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report={pages:[],widths:[]};
try{
 for(const locale of ['en','zh']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],requests=[];
  await context.addInitScript(locale=>localStorage.setItem('leibox:locale',locale),locale);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).toHaveAttribute('lang',locale==='en'?'en':'zh-CN');
  assert(!requests.some(url=>url.includes('/landing/agent-demo/alpine-lake.png')),'homepage never downloads the redundant PNG');
  const backgrounds=requests.filter(url=>/\/assets\/optimized\/alpine-lake-/.test(url));assert.equal(backgrounds.length,1,'preload and background share a single request');
  const fonts=requests.filter(url=>url.includes('/fonts/misans/'));
  if(locale==='en'){assert.equal(fonts.length,0,'saved English visits do not request Chinese fonts');assert.equal(await page.locator('#leibox-chinese-fonts').count(),0);}
  else{assert(fonts.length>0);assert.equal(await page.locator('#leibox-chinese-fonts').count(),1);assert(await page.evaluate(()=>[...document.fonts].some(f=>f.family==='MiSans VF'&&f.status==='loaded')));}
  const initialFonts=fonts.length;
  if(locale==='en'){
   await page.getByRole('button',{name:'切换为中文',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('#leibox-chinese-fonts').count(),1);assert(requests.some(url=>url.includes('/fonts/misans/')));
   await page.getByRole('button',{name:'Switch to English',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');
   await page.getByRole('button',{name:'切换为中文',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');assert.equal(await page.locator('#leibox-chinese-fonts').count(),1);
  }
  assert.deepEqual(errors,[]);report.pages.push({locale,initialChineseFontRequests:initialFonts,wallpaperRequests:backgrounds.length,errors});await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`home-${width}.png`)});
  await page.locator('.agent-demo').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`demo-${width}.png`)});
  const geometry=await page.locator('.agent-demo .g4-plate').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,background:getComputedStyle(e).backgroundImage}));assert(geometry.height>400&&geometry.background.includes('/assets/optimized/alpine-lake-'));report.widths.push({width,geometry});
 }
 await page.goto(base+'/docs/animations/glass-folder',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const styleCheck=await page.evaluate(()=>{let agent=false,showcase=false;function walk(rules){for(const rule of rules){if(rule.selectorText){agent||=rule.selectorText.includes('.agent-demo');showcase||=rule.selectorText.includes('.lb-showcase');}if(rule.cssRules)walk(rule.cssRules);}}for(const sheet of document.styleSheets)try{walk(sheet.cssRules);}catch{}return{agent,showcase};});
 assert.deepEqual(styleCheck,{agent:false,showcase:false},'documentation pages do not apply homepage-specific CSS');report.docsStyles=styleCheck;
 const imageRequests=[];page.on('request',request=>imageRequests.push(request.url()));await page.goto(base+'/docs/components/particle-object',{waitUntil:'networkidle'});
 assert(!imageRequests.some(url=>url.includes('/landing/agent-demo/alpine-lake.png')),'study images also use responsive WebP');await page.screenshot({path:path.join(out,'particles.png')});assert.deepEqual(errors,[]);await context.close();
 const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError');}}));const blockedPage=await blocked.newPage();await blockedPage.goto(base,{waitUntil:'networkidle'});await expect(blockedPage.locator('html')).toHaveAttribute('lang','zh-CN');assert.equal(await blockedPage.locator('#leibox-chinese-fonts').count(),1);report.storageBlocked=true;await blocked.close();
 const noJS=await browser.newContext({javaScriptEnabled:false});const staticPage=await noJS.newPage();await staticPage.goto(base,{waitUntil:'networkidle'});assert(await staticPage.evaluate(()=>[...document.styleSheets].some(sheet=>sheet.href?.includes('/fonts/misans.css'))));report.noJavaScriptFonts=true;await noJS.close();
 await fs.writeFile('outputs/site-cleanup-20261105/browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
