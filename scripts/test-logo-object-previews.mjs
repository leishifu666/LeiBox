import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const base=process.env.BASE_URL||'http://127.0.0.1:3001';
const out=path.resolve('outputs/logo-object-previews/site');await fs.mkdir(out,{recursive:true});
const slugs=['ascii-object','particle-object','liquid-object','glass-object'];
const modelFor=slug=>slug==='particle-object'?'/assets/models/leibox-particle.glb':slug==='liquid-object'?'/leibox-mark.svg':'/logo-icon.svg';
const videoFor=slug=>`/assets/videos/${slug}-leibox${slug==='particle-object'?'-3d':''}.webm`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={details:[],darkDetails:[],sidebar:[],gallery:[],homepage:[],pageErrors:[],cachedExternalBackgrounds:true};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 await context.addInitScript(()=>{if(!localStorage.getItem('theme'))localStorage.setItem('theme','light');localStorage.setItem('canvasui:renderer','webgl');});
 await context.route('https://images.unsplash.com/**',async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop()+'.jpg';
  const cached=path.resolve('public/assets/demo-cache',name);
  const file=await fs.stat(cached).then(()=>cached).catch(()=>path.resolve('public/assets/hero-background.jpg'));
  await route.fulfill({body:await fs.readFile(file),contentType:'image/jpeg'});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
 let assets=[];page.on('request',r=>{if(/\.(?:svg|glb)(?:\?|$)/.test(r.url()))assets.push(new URL(r.url()).pathname);});
 for(const slug of slugs){
  assets=[];await page.goto(base+'/docs/components/'+slug,{waitUntil:'domcontentloaded'});
  const demo=page.locator('section[aria-label="Demo"]'),canvas=demo.locator('canvas').first();
  await canvas.waitFor();await expect.poll(()=>assets.includes(modelFor(slug))).toBe(true);
  await page.waitForTimeout(1000);assert(!assets.some(a=>/duck|bolt/.test(a)),slug+' no longer loads an old demonstration object');
  const before=await canvas.screenshot();await page.mouse.move(850,590);await page.waitForTimeout(250);
  assert(!before.equals(await canvas.screenshot()),slug+' still animates');
  await page.getByRole('button',{name:/参数|Controls/}).first().click();
  const file=page.locator('input[type="file"]');await file.setInputFiles(path.resolve('public/leibox-logo.svg'));
  await page.waitForTimeout(600);await expect(page.locator('input[spellcheck="false"]')).toHaveValue('leibox-logo.svg');
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(page.locator('input[spellcheck="false"]')).toHaveValue(modelFor(slug));
  await expect(demo.locator('.pointer-events-none.absolute.inset-x-0.bottom-3')).toHaveCount(0);
  await page.getByRole('button',{name:/参数|Controls/}).first().click();
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(180);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,`${slug}-${width}.png`)});
  }
  report.details.push({slug,logo:true,animation:true,customAsset:true,reset:true,widths:[375,768,1440]});
  console.log('PASS DETAIL '+slug);
 }
 await page.evaluate(()=>localStorage.setItem('theme','dark'));
 for(const slug of slugs){
  assets=[];await page.goto(base+'/docs/components/'+slug,{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveClass(/dark/);
  const demo=page.locator('section[aria-label="Demo"]');await expect.poll(()=>assets.includes(slug==='particle-object'?modelFor(slug):'/logo-icon.svg')).toBe(true);
  await expect(demo.locator('.pointer-events-none.absolute.inset-x-0.bottom-3')).toHaveCount(0);await page.waitForTimeout(200);
  await demo.locator('canvas').first().screenshot({path:path.join(out,slug+'-dark.png')});report.darkDetails.push({slug,logoVisibleOnDarkTheme:true});
 }
 await page.evaluate(()=>localStorage.setItem('theme','light'));await page.goto(base+'/docs/components/glass-object',{waitUntil:'domcontentloaded'});
 await page.setViewportSize({width:1440,height:1000});
 for(const slug of slugs){
  const href='/docs/components/'+slug,link=page.locator(`aside a[href="${href}"]`).first();
  await link.hover();const floating=page.locator(`[data-sidebar-preview="${href}"]`),video=floating.locator('video');
  await expect(video).toHaveAttribute('src',videoFor(slug));
  await expect.poll(()=>video.evaluate(n=>n.readyState)).toBeGreaterThanOrEqual(2);
  const start=await video.evaluate(n=>n.currentTime);await page.waitForTimeout(250);assert.notEqual(await video.evaluate(n=>n.currentTime),start);
  await floating.screenshot({path:path.join(out,slug+'-sidebar.png')});
  await page.mouse.move(1300,20);await expect(floating).toHaveCount(0);
  report.sidebar.push({slug,correctClip:true,plays:true,leaveCleanup:true});console.log('PASS SIDEBAR '+slug);
 }
 await page.goto(base+'/components',{waitUntil:'domcontentloaded'});
 for(const slug of slugs){
  const card=page.locator(`[data-component-card="/docs/components/${slug}"]`),video=card.locator('video');
  await card.hover();await expect(video).toHaveAttribute('src',videoFor(slug));
  await expect.poll(()=>video.evaluate(n=>n.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(()=>video.evaluate(n=>n.paused)).toBe(false);await card.screenshot({path:path.join(out,slug+'-gallery.png')});
  await page.mouse.move(10,10);await expect.poll(()=>video.evaluate(n=>n.paused)).toBe(true);
  report.gallery.push({slug,correctClip:true,hoverPlay:true,leavePause:true});
 }
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 const gallery=page.locator('section[aria-labelledby="gallery-heading"]');await gallery.scrollIntoViewIfNeeded();
 for(const slug of slugs){
  const video=gallery.locator(`video[src="${videoFor(slug)}"]`);await expect(video).toHaveCount(2);
  await video.first().evaluate(n=>{n.preload='auto';n.load();});await expect.poll(()=>video.first().evaluate(n=>n.readyState)).toBeGreaterThanOrEqual(2);
  report.homepage.push({slug,bothMarqueeCopies:true,correctClip:true});
 }
 await gallery.screenshot({path:path.join(out,'homepage-gallery.png')});
 assert.deepEqual(report.pageErrors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
