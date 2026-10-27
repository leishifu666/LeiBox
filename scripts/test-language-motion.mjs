import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium,expect} from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const output=path.resolve('work/language-switch-six-20261027/integration');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report={base,widths:[],errors:[]};
let current;
async function pageFor(width=1440,options={}){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:'light',...options});current=page;
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.addInitScript(()=>{try{localStorage.setItem('leibox:locale','zh');localStorage.setItem('theme','light');}catch{/* Standalone demos intentionally sandbox storage. */}});
  return page;
}
async function ready(page,route='/'){
  await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
}
async function clean(page){
  await page.waitForFunction(()=>!document.documentElement.dataset.languageTransition);
  assert.equal(await page.locator('[data-language-ghosts]').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator('main h1').evaluate(node=>getComputedStyle(node).filter),'none');
}
try{
  for(const width of [1440,768,375]){
    const page=await pageFor(width);await ready(page);
    await page.waitForTimeout(300);
    await page.locator('[data-language-toggle]:visible').click();
    await expect(page.locator('html')).toHaveAttribute('data-language-transition','gravity-focus');
    const during=await page.evaluate(()=>{
      const title=document.querySelector('main h1'),css=getComputedStyle(title);
      const layer=document.querySelector('[data-language-ghosts]');
      return{ghosts:layer.children.length,navMarkers:[...layer.querySelectorAll('li')].map(node=>getComputedStyle(node).listStyleType),filter:css.filter,panelOpacity:getComputedStyle(document.querySelector('.agent-demo')).opacity,interactive:!document.querySelector('main').inert};
    });
    assert(during.ghosts>0);assert.equal(during.panelOpacity,'1');assert(during.interactive);
    assert(during.navMarkers.every(marker=>marker==='none'),'Navigation copies gained list bullets');
    await page.waitForTimeout(180);await page.screenshot({path:path.join(output,`${width}-middle.png`)});
    await clean(page);await expect(page.locator('main h1')).toContainText('Your box');
    assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-language-toggle')),true);
    await page.screenshot({path:path.join(output,`${width}-english.png`)});
    await page.locator('[data-language-toggle]:visible').focus();await page.keyboard.press('Enter');
    await clean(page);await expect(page.locator('main h1')).toContainText('装下');
    assert.equal(await page.evaluate(()=>localStorage.getItem('leibox:locale')),'zh');
    report.widths.push({width,...during,status:'passed'});console.log(JSON.stringify({width,status:'passed'}));await page.close();
  }
  const page=await pageFor();await ready(page,'/components');
  await page.locator('[data-language-toggle]:visible').click();await clean(page);await expect(page.locator('main h1')).toContainText('Components');
  await page.locator('[data-component-card$="/spider-music-player"] h2').click();await page.waitForURL('**/docs/animations/spider-music-player');
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','idle');
  await page.locator('[data-language-toggle]:visible').click();await clean(page);
  await expect(page.locator('main h1')).toContainText('蜘蛛牵引切歌');
  // Locale updates must keep the actual demo browsing context, not reload it.
  const demoBody=page.frameLocator('iframe').first().locator('body');
  await demoBody.evaluate(node=>{node.dataset.languageMotionMarker='preserved';});
  const before=await page.locator('main pre').allTextContents();
  await page.locator('[data-language-toggle]:visible').click();await clean(page);
  await expect(demoBody).toHaveAttribute('data-language-motion-marker','preserved');
  assert.deepEqual(await page.locator('main pre').allTextContents(),before);
  await page.locator('aside a[href="/components"]').first().click();await page.waitForURL('**/components');
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','idle');
  report.navigationAndDemo=true;
  await page.locator('[data-language-toggle]:visible').click();await page.locator('[data-language-toggle]:visible').click();await clean(page);
  assert.equal(await page.locator('html').getAttribute('lang'),'en');report.rapidSwitch=true;
  await page.locator('[data-language-toggle]:visible').click();await page.setViewportSize({width:768,height:1000});await clean(page);report.resizeCleanup=true;
  await page.close();
  const reduced=await pageFor(1440,{reducedMotion:'reduce'});await ready(reduced);
  await reduced.locator('[data-language-toggle]:visible').click();await expect(reduced.locator('html')).toHaveAttribute('lang','en');await clean(reduced);report.reducedMotion=true;await reduced.close();
  assert.equal(report.errors.length,0);await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({all:'passed'}));
}catch(error){await current?.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({error:error.message,report},null,2));throw error;}finally{await browser.close();}
