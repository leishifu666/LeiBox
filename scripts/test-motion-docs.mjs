import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';
import {verifyCrumpledPaperDoc} from './test-crumpled-paper.mjs';
import {verifyGlassTabMenuDoc} from './test-glass-tab-menu.mjs';
import {verifyStaggeredRadialMenuDoc} from './test-staggered-radial-menu.mjs';
import {verifyGalaxyEffortSliderDoc} from './test-galaxy-effort-slider.mjs';
import {verifySailingBoat} from './test-sailing-boat.mjs';
import {verifyHammerheadChartDoc} from './test-hammerhead-chart.mjs';
import {verifyDotMatrixTrioDoc} from './test-dot-matrix-trio.mjs';

const ROOT=process.cwd(),base=process.env.BASE_URL||'http://127.0.0.1:3000',out=path.join(ROOT,'outputs/motion-six-frameworks/site');
await fs.mkdir(out,{recursive:true});
const packageRoot=process.env.MOTION_PACKAGE_ROOT||path.join(ROOT,'public/motion-frameworks');
const manifest=JSON.parse(await fs.readFile(path.join(packageRoot,'manifest.json'),'utf8'));
const filters=process.argv.slice(2);
const slugs=[...new Set(manifest.items.map(item=>item.slug))].filter(slug=>!filters.length||filters.includes(slug)),checks=[];
assert(slugs.length,'Choose an existing motion component slug');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const route=slug=>slug==='share-invite'||slug==='otp-verification'?`/docs/components/${slug}`:`/docs/animations/${slug}`;
const normal=value=>value.replace(/\r\n/g,'\n');
let active='';
try{
 for(const slug of slugs){
  active=slug;
  const packages=JSON.parse(await fs.readFile(path.join(packageRoot,slug,'packages.json'),'utf8'));
  const response=await page.goto(base+route(slug),{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const code=page.locator('section[aria-label="Code"]'),install=page.locator('section[aria-label="Installation"]');
  for(const pack of packages){
   const trigger=code.locator('button[aria-label="框架"]');await trigger.click();
   await page.getByRole('option',{name:pack.label,exact:true}).click();
   await expect(trigger).toContainText(pack.label);await expect(install.locator('button[aria-label="框架"]')).toContainText(pack.label);
   await expect(install.locator('code')).toHaveText(pack.install);
   await expect(page.locator('section[aria-label="Usage"] code')).toHaveText(pack.usage);
   const copy=code.getByRole('button',{name:'复制完整代码包',exact:true});await copy.click();
   await expect(code.getByRole('button',{name:'已复制',exact:true})).toBeVisible();
   assert.equal(normal(await page.evaluate(()=>navigator.clipboard.readText())),normal(pack.bundle));
   const menuTrigger=page.getByRole('button',{name:'复制给 AI',exact:true});await menuTrigger.click();
   const menu=page.getByRole('menu',{name:'复制给 AI',exact:true});
   await menu.getByRole('menuitem',{name:'复制提示词',exact:true}).click();
   await expect(menu.getByRole('menuitem',{name:'已复制',exact:true})).toBeVisible();
   assert.equal(normal(await page.evaluate(()=>navigator.clipboard.readText())),normal(pack.prompt));
   assert.equal(normal(await page.locator('section[aria-label="Recreation prompt"] pre').innerText()),normal(pack.prompt));
   await expect(menu).toHaveCount(0);
   checks.push({slug,framework:pack.framework,selector:true,install:true,usage:true,bundle:true,prompt:true});
   console.log(`PASS DOC ${slug} ${pack.framework}`);
  }
  if(slug==='crumpled-paper')await verifyCrumpledPaperDoc(page,out);
  if(slug==='dot-matrix-trio')await verifyDotMatrixTrioDoc(page);
  if(slug==='glass-tab-menu')await verifyGlassTabMenuDoc(page,out);
  if(slug==='staggered-radial-menu'||slug==='soft-action-wheel')await verifyStaggeredRadialMenuDoc(page,out,slug);
  if(slug==='galaxy-effort-slider')await verifyGalaxyEffortSliderDoc(page,out);
  if(slug==='hammerhead-chart'){
   await verifyHammerheadChartDoc(page);checks.push({slug,shark:true});
   console.log('PASS DOC hammerhead-chart: shark chase and author-only attribution');
  }else if(slug==='sailing-toc'){
   const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
   await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.st-demo')).toHaveAttribute('data-ready','true');
   assert.equal(await frame.locator('.st-link').count(),16);
   const button=frame.locator('.st-link').nth(10),outer=await iframe.boundingBox(),local=await button.evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;
   await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);
   await expect(frame.locator('.st-demo')).toHaveAttribute('data-active','10');
   await expect(frame.locator('.st-demo')).toHaveAttribute('data-moving','false');
   checks.push({slug,boatMotion:await verifySailingBoat(page,{surface:frame,iframe})});
   await expect(page.locator('a[href="https://x.com/emirayaz"]')).toHaveText('作者 · Emir Ayaz');
   assert.equal(await page.locator('video').count(),0);
   console.log('PASS DOC sailing-toc: scaled iframe navigation and author-only attribution');
  }else if(slug==='thinking-particles'){
   const iframe=page.locator('section[aria-label="Demo"] iframe');
   const frame=page.frameLocator('section[aria-label="Demo"] iframe');
   await iframe.scrollIntoViewIfNeeded();
   const button=frame.locator('.tp-copy-question');
   const outer=await iframe.boundingBox(),local=await button.evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth}));
   const scale=outer.width/local.width;
   await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);
   await expect(frame.locator('.tp-status')).toHaveText('Copied');
   assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'Find a birthday gift for my brother.');
   assert.equal(await page.locator('video').count(),0,'reference video is not embedded');
   await expect(page.locator('a[href="https://x.com/shridharathi"]')).toHaveText('作者 · Shridhar');
   console.log('PASS DOC thinking-particles: sandboxed demo clipboard and author-only attribution');
  }else if(slug==='glass-folder'){
   const frame=page.frameLocator('section[aria-label="Demo"] iframe'),folder=frame.locator('.gf-root').first();
   await expect(frame.locator('body')).toHaveAttribute('data-motion-ready','true');
   const iframe=page.locator('section[aria-label="Demo"] iframe'),add=folder.locator('.gf-key--add');
   await iframe.scrollIntoViewIfNeeded();
   await expect(folder).toHaveAttribute('data-entered','');
   await expect(add).toHaveCSS('opacity','1');
   // Chrome reports unscaled element boxes inside this sandboxed, CSS-scaled iframe.
   // Map its local CSS coordinates to the actual viewport, then send real mouse input.
   const mapAdd=async()=>{const outer=await iframe.boundingBox(),local=await add.evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth}));const scale=outer.width/local.width;return {x:outer.x+(local.rect.x+local.rect.width/2)*scale,y:outer.y+(local.rect.y+local.rect.height/2)*scale};};
   const hover=await mapAdd();await page.mouse.move(hover.x,hover.y);
   await expect.poll(()=>folder.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
   await folder.evaluate(n=>{n.__removedSheets=0;new MutationObserver(changes=>{for(const change of changes)n.__removedSheets+=change.removedNodes.length;}).observe(n.querySelector('.gf-files'),{childList:true});});
   const click=await mapAdd();await page.mouse.click(click.x,click.y);
   await expect(folder.locator('.gf-meta')).toHaveText('4 items');
   assert.equal(await folder.evaluate(n=>n.__removedSheets),0,'detail iframe add keeps the existing stack attached');
   assert(await folder.locator('.gf-glyph--plus').evaluate(n=>n.getAnimations().some(a=>a.animationName==='gf-turn')));
   await page.screenshot({path:path.join(out,'glass-folder-add-in-motion.png')});
   await expect(folder.locator('.gf-sheet--drop')).toHaveCount(0);
   await expect(folder.locator('.gf-front--bump')).toHaveCount(0);
   await page.screenshot({path:path.join(out,'glass-folder-add-settled.png')});
   console.log('PASS DOC glass-folder: single add, retained stack, glyph turn, settled motion');
  }
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(slug==='spider-music-player')await page.waitForTimeout(300);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,`${slug}-${width}.png`)});
   await code.screenshot({path:path.join(out,`${slug}-source-${width}.png`)});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/components#interaction',{waitUntil:'networkidle'});
 await expect(page.locator('[data-preview-state="playing"]')).toHaveCount(0);
 const card=page.locator('[data-preview-card]').first();await card.hover();
 await expect(page.locator('[data-preview-state="playing"]')).toHaveCount(1);
 await page.mouse.move(300,20);await expect(page.locator('[data-preview-state="playing"]')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,filters.length?'partial-results.json':'results.json'),JSON.stringify({checks,previewHover:true,pageErrors:errors},null,2));
}catch(error){await page.screenshot({path:path.join(out,'failure.png')});await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({slug:active,error:String(error),pageErrors:errors},null,2));throw error;}finally{await browser.close();}
console.log(`Verified ${checks.length} selected-framework documentation flows and three widths.`);
