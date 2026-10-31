// Test the selected card-entry motion on real App Router navigation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium,expect} from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3001';
const output=path.resolve('work/text-transition-preview-20261027/integration');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results={base,widths:[],errors:[]};
let current;
async function pageFor(width=1440,options={}){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:'light',...options});
  current=page;
  page.on('pageerror',error=>results.errors.push(error.message));
  await page.addInitScript(()=>{
    window.__entryFrames=[];
    window.__captionSamples=[];
    document.addEventListener('click',event=>{
      const card=event.target instanceof Element&&event.target.closest('[data-component-home-card]');
      const original=card?.querySelector('[data-component-caption]');
      if(!original)return;
      window.__captionBefore=Number(getComputedStyle(original).opacity);
    },true);
    document.addEventListener('click',()=>{
      if(window.__captionBefore===undefined)return;
      const copy=document.querySelector('[data-component-entry-floating] [data-component-caption]');
      if(copy)window.__captionSamples.push({before:window.__captionBefore,after:Number(getComputedStyle(copy).opacity)});
      delete window.__captionBefore;
    });
    const sample=()=>{
      const main=document.querySelector('main[data-component-entry-state]');
      const carrier=document.querySelector('[data-component-entry-floating]')?.firstElementChild;
      const r=carrier?.getBoundingClientRect();
      const chrome=[...document.querySelectorAll('aside, header')].find(n=>n.getBoundingClientRect().width>0);
      const c=chrome?.getBoundingClientRect();
      const media=carrier?.firstElementChild?.getBoundingClientRect();
      const title=document.querySelector('[data-component-entry-title]');
      const t=title?.getBoundingClientRect(),ts=title&&getComputedStyle(title);
      const tops=[];
      if(title){const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const range=document.createRange();range.selectNodeContents(walker.currentNode);for(const rect of range.getClientRects())if(rect.width>0)tops.push(rect.top);}}
      // Absolute glyph boxes and their text ranges have different tops. Only
      // compare painted text, allowing subpixel rounding within the same line.
      const titleLines=tops.sort((a,b)=>a-b).reduce((rows,top)=>{if(!rows.length||top-rows.at(-1)>1)rows.push(top);return rows},[]).length;
      const article=main?.querySelector('[data-component-document]');
      const intro=article&&[...article.children].find(n=>n.tagName==='P');
      const d=intro?.getBoundingClientRect(),ds=intro&&getComputedStyle(intro);
      window.__entryFrames.push({time:performance.now(),state:main?.dataset.componentEntryState,clip:main?getComputedStyle(main).clipPath:undefined,x:r?.x,y:r?.y,width:r?.width,height:r?.height,mediaX:media?.x,mediaY:media?.y,mediaWidth:media?.width,mediaHeight:media?.height,titleX:t?.x,titleY:t?.y,titleWidth:t?.width,titleHeight:t?.height,titleSize:ts?parseFloat(ts.fontSize)*new DOMMatrix(ts.transform).a:undefined,titleOpacity:ts?Number(ts.opacity):undefined,titleColor:ts?.color,titleLines,introX:d?.x,introY:d?.y,introWidth:d?.width,introHeight:d?.height,introOpacity:ds?Number(ds.opacity):undefined,chromeX:c?.x,chromeY:c?.y});
      if(window.__entryFrames.length>1000)window.__entryFrames.shift();
      requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  return page;
}
async function collection(page){
  await page.goto(base+'/components',{waitUntil:'networkidle'});
  await expect(page.locator('main[data-component-entry-state]')).toHaveAttribute('data-component-entry-state','idle');
}
async function clean(page){
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','idle');
  assert.equal(await page.locator('main').evaluate(n=>n.inert),false);
  assert.equal(await page.locator('main').getAttribute('aria-busy'),null);
  assert.equal(await page.locator('main').evaluate(n=>n.style.clipPath),'');
  assert.equal(await page.locator('[data-component-entry-floating] > *, [data-component-entry-backdrop] > *').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
async function enter(page,slug='spider-music-player',{keyboard=false,screenshots=false}={}){
  const card=page.locator(`main [data-component-card$="/${slug}"]`);
  await card.scrollIntoViewIfNeeded();
  const before=await card.boundingBox();
  await page.evaluate(()=>{window.__entryFrames=[]});
  if(keyboard){await card.locator('a').focus();await page.keyboard.press('Enter');}
  else await card.locator('h2').click();
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','entering',{timeout:60000});
  if(screenshots){await page.waitForTimeout(240);await page.screenshot({path:path.join(output,`${page.viewportSize().width}-middle.png`)});}
  await page.waitForURL(url=>url.pathname.endsWith('/'+slug));
  await clean(page);
  const frames=await page.evaluate(()=>window.__entryFrames.filter(f=>f.state==='entering'));
  assert(frames.length>4,'Missing interpolated route frames');
  assert(frames.every(f=>f.clip==='none'),'The page still has a reveal/cutout mask');
  assert(['x','y','width','height'].some(key=>Math.max(...frames.map(f=>f[key]))-Math.min(...frames.map(f=>f[key]))>25),'Card did not travel or resize');
  const titleFrames=frames.filter(f=>f.titleSize>0);
  assert(titleFrames.length>4,'The component title did not travel');
  assert(Math.max(...titleFrames.map(f=>f.titleSize))-Math.min(...titleFrames.map(f=>f.titleSize))>8,'The title did not grow into the detail heading');
  assert(['titleX','titleY'].some(key=>Math.max(...titleFrames.map(f=>f[key]))-Math.min(...titleFrames.map(f=>f[key]))>15),'The title did not move to the detail');
  for(const f of titleFrames){
    if(f.introOpacity>.05 && f.titleOpacity>.05 && f.introX!==undefined){
      const overlap=f.titleX<f.introX+f.introWidth && f.titleX+f.titleWidth>f.introX && f.titleY<f.introY+f.introHeight && f.titleY+f.titleHeight>f.introY;
      assert(!overlap,'The moving title overlaps visible introduction text');
    }
  }
  const chrome=frames.filter(f=>f.chromeX!==undefined&&f.chromeY!==undefined);
  assert(Math.max(...chrome.map(f=>f.chromeX))-Math.min(...chrome.map(f=>f.chromeX))<1,'Sidebar/header shifted horizontally');
  assert(Math.max(...chrome.map(f=>f.chromeY))-Math.min(...chrome.map(f=>f.chromeY))<1,'Sidebar/header shifted vertically');
  assert.equal(await page.locator('main').evaluate(n=>n.contains(document.activeElement)),true,'Focus did not move into the real detail');
  if(screenshots)await page.screenshot({path:path.join(output,`${page.viewportSize().width}-detail.png`)});
  return{slug,keyboard,from:before,movingFrames:frames.length,duration:frames.at(-1).time-frames[0].time};
}
async function back(page,{link=false,menu=false,screenshot=false,slug='spider-music-player'}={}){
  const detailLines=await page.locator('main [data-component-document] h1').evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);return new Set([...range.getClientRects()].filter(rect=>rect.width>0).map(rect=>Math.round(rect.top))).size});
  await page.evaluate(()=>{window.__entryFrames=[]});
  if(menu){await page.locator('header button[aria-expanded]:visible').first().click();await page.locator('[role="dialog"] a[href="/components"]').click();}
  else if(link)await page.locator('aside a[href="/components"]').first().click();
  else await page.goBack();
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','returning');
  if(screenshot){await page.waitForTimeout(160);await page.screenshot({path:path.join(output,`${page.viewportSize().width}-return-middle.png`)});}
  await page.waitForURL('**/components');await clean(page);
  const frames=await page.evaluate(()=>window.__entryFrames.filter(f=>f.state==='returning'));
  assert(frames.length>4,'The demonstration did not animate back to its card');
  assert(frames.every(f=>f.clip==='none'),'Return used a reveal/cutout mask');
  const first=frames.find(f=>f.mediaWidth>0),last=frames.at(-1);
  assert(['mediaX','mediaY','mediaWidth','mediaHeight'].some(key=>Math.abs(first[key]-last[key])>8),'The demonstration did not move or resize into its card');
  const destination=await page.locator(`main [data-component-card$="/${slug}"]`).locator(':scope > div').boundingBox();
  assert(Math.abs(last.mediaX-destination.x)<4&&Math.abs(last.mediaY-destination.y)<4,'Return did not land in the corresponding card');
  const titles=frames.filter(f=>f.titleSize>0);
  assert(titles.length>4 && Math.max(...titles.map(f=>f.titleSize))-Math.min(...titles.map(f=>f.titleSize))>8,'The title did not shrink back with the demo');
  const titleDestination=await page.locator(`main [data-component-card$="/${slug}"] h2`).boundingBox();
  const cardLines=await page.locator(`main [data-component-card$="/${slug}"] h2`).evaluate(node=>{const range=document.createRange();range.selectNodeContents(node);return new Set([...range.getClientRects()].filter(rect=>rect.width>0).map(rect=>Math.round(rect.top))).size});
  if(detailLines===1&&cardLines===1)assert(titles.filter(f=>f.titleOpacity>.05).every(f=>f.titleLines===1),'A single-line title wrapped during return');
  assert(Math.abs(titles.at(-1).titleX-titleDestination.x)<4&&Math.abs(titles.at(-1).titleY-titleDestination.y)<4,'The title did not return to its card');
  return{via:menu?'mobile Browse all':link?'Browse all':'browser back',movingFrames:frames.length,shrinks:first.mediaWidth-last.mediaWidth>8||first.mediaHeight-last.mediaHeight>8,landsInCard:true};
}
try{
  for(const width of [1440,768,375]){
    const page=await pageFor(width);await collection(page);
    await page.screenshot({path:path.join(output,`${width}-listing.png`)});
    const check=await enter(page,'spider-music-player',{screenshots:true});
    const demo=page.frameLocator('iframe[src^="/motion/"]');
    await expect(demo.locator('.sm-scene')).toHaveAttribute('data-ready','true');
    const button=demo.locator('[data-action=play]'),label=await button.getAttribute('aria-label');
    const outer=await page.locator('iframe[src^="/motion/"]').boundingBox();
    const local=await button.evaluate(n=>({r:n.getBoundingClientRect().toJSON(),width:innerWidth}));
    const scale=outer.width/local.width;
    await page.mouse.click(outer.x+(local.r.x+local.r.width/2)*scale,outer.y+(local.r.y+local.r.height/2)*scale);
    await expect(button).not.toHaveAttribute('aria-label',label);
    const reverse=await back(page,{link:width===1440,menu:width===375,screenshot:true});
    await expect(page.locator('main [data-component-card$="/spider-music-player"] a')).toBeFocused();
    results.widths.push({width,...check,demoPlayable:true,back:reverse});
    console.log(JSON.stringify({width,status:'passed'}));await page.close();
  }
  results.home=[];
  for(const width of [1440,768,375]){
    const page=await pageFor(width);
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await page.locator('#gallery-heading').scrollIntoViewIfNeeded();
    await page.locator('.marquee-track[data-ready]').first().waitFor({timeout:45000});
    await page.evaluate(()=>window.scrollTo(0,document.querySelector('#gallery-heading').getBoundingClientRect().top+scrollY-150));
    const cards=page.locator('main [data-component-home-card]');
    let selected;
    for(let i=0;i<await cards.count();i++){
      const candidate=cards.nth(i),r=await candidate.boundingBox();
      const href=await candidate.getAttribute('href');
      if(r&&r.x>=0&&r.x+r.width<=width&&r.y>=0&&r.y+r.height<=1000&&(!selected||href.endsWith('/brand-poster-cards'))){selected={candidate,r,href};if(href.endsWith('/brand-poster-cards'))break;}
    }
    assert(selected,'No carousel card visible to click');
    await page.mouse.move(selected.r.x+selected.r.width/2,selected.r.y+selected.r.height/2);
    await page.waitForTimeout(250);
    const heading=await selected.candidate.locator('h3').innerText();
    const origin=await selected.candidate.locator('h3').boundingBox();
    await page.screenshot({path:path.join(output,`${width}-home-source.png`)});
    await page.evaluate(()=>{window.__entryFrames=[]});
    await selected.candidate.click();
    await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','entering',{timeout:60000});
    await page.screenshot({path:path.join(output,`${width}-home-entry.png`)});
    await page.waitForURL(url=>url.pathname===selected.href);
    await clean(page);
    assert.equal(await page.locator('main h1').innerText(),heading);
    const frames=await page.evaluate(()=>window.__entryFrames.filter(f=>f.state==='entering'&&f.titleSize>0));
    const overlay=await page.evaluate(()=>window.__captionSamples.at(-1));
    assert(overlay&&Math.abs(overlay.before-overlay.after)<.03,`The homepage hover overlay jumped on click: ${JSON.stringify(overlay)}`);
    assert(frames.length>4,'Homepage title did not animate');
    assert(Math.abs(frames[0].titleX-origin.x)<25&&Math.abs(frames[0].titleY-origin.y)<25,'Homepage title did not begin at the clicked moving card');
    assert(Math.max(...frames.map(f=>f.titleSize))-Math.min(...frames.map(f=>f.titleSize))>8,'Homepage title did not grow');
    for(const f of frames.filter(frame=>frame.titleOpacity>.05)){
      const channels=(f.titleColor.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
      assert(channels.length===3&&Math.max(...channels)-Math.min(...channels)<3,`Homepage title changed to an unexpected color: ${f.titleColor}`);
    }
    const slug=selected.href.split('/').at(-1);
    const reverse=await back(page,{slug,link:width===1440,menu:width<1024});
    const card=page.locator(`main [data-component-card$="/${slug}"]`),r=await card.boundingBox();
    assert(r.y>=0&&r.y+r.height<=1000,'Browse all did not reveal the matching card');
    await expect(card.locator('a')).toBeFocused();
    results.home.push({width,slug,titleFromMovingCard:true,back:reverse});
    console.log(JSON.stringify({homeWidth:width,status:'passed'}));await page.close();
  }
  const page=await pageFor();await collection(page);
  const firstHref=await page.locator('main [data-component-card]').first().locator('a').getAttribute('href');
  results.keyboard=await enter(page,'collection-layout-morph',{keyboard:true});
  await page.goBack();await page.waitForURL('**/components');await clean(page);
  const lower=page.locator('main [data-component-card$="/galaxy-effort-slider"]');
  await lower.scrollIntoViewIfNeeded();
  const scroll=await page.evaluate(()=>scrollY);
  assert(scroll>100,'Did not exercise a scrolled collection');
  results.scrolledEntry=await enter(page,'galaxy-effort-slider');
  results.scrolledReturn=await back(page,{slug:'galaxy-effort-slider',link:true});
  await expect(lower.locator('a')).toBeFocused();
  assert(Math.abs(await page.evaluate(()=>scrollY)-scroll)<3,'Back lost collection scroll position');
  results.scrollRestored=true;
  // Body/keyboard scrolling, rapid activation, and route interruption all use
  // the actual navigation, rather than a test copy of the transition logic.
  await page.evaluate(()=>scrollTo(0,0));
  await page.locator('main [data-component-card]').first().locator('a').evaluate(a=>{a.click();a.click()});
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','entering');
  await page.goBack();await page.waitForURL('**/components');await clean(page);
  results.interruptedBack=true;
  await page.locator('main [data-component-card]').first().locator('h2').click();
  await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','entering');
  await page.setViewportSize({width:768,height:1000});await clean(page);
  assert.equal(new URL(page.url()).pathname,firstHref);
  results.resize=true;
  await page.goBack();await page.waitForURL('**/components');await clean(page);
  await page.setViewportSize({width:1440,height:1000});
  const popupPromise=page.context().waitForEvent('page');
  await page.locator('main [data-component-card]').first().locator('a').click({modifiers:['Control']});
  const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
  assert.equal(new URL(popup.url()).pathname,firstHref);await popup.close();
  assert(new URL(page.url()).pathname==='/components');await clean(page);
  results.modifiedClick=true;
  // Warm the server compilation, rather than testing the dev compiler's startup
  // latency against the navigation's deliberate ten-second recovery timeout.
  await page.request.get(base+'/docs/components/ascii-object');
  results.canvasEntry=await enter(page,'ascii-object');
  await page.goBack();await page.waitForURL('**/components');await clean(page);
  await page.close();

  const reduced=await pageFor(375,{reducedMotion:'reduce'});await collection(reduced);
  await reduced.evaluate(()=>{window.__entryFrames=[]});
  await reduced.locator('main [data-component-card]').first().locator('h2').click();
  await reduced.waitForURL(url=>url.pathname===firstHref);await clean(reduced);
  assert.equal(await reduced.evaluate(()=>window.__entryFrames.filter(f=>['waiting','entering'].includes(f.state)).length),0);
  results.reducedMotion=true;await reduced.close();
  assert.deepEqual(results.errors,[]);
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({status:'passed',checks:Object.keys(results)}));
}catch(error){
  if(current&&!current.isClosed())await current.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
  await fs.writeFile(path.join(output,'failure.json'),JSON.stringify({...results,error:String(error)},null,2));
  throw error;
}finally{await browser.close();}
