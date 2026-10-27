import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';
import sharp from 'sharp';
import {SPIDER_TRACKS} from '../src/data/spider-music-player.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:3001',href='/docs/animations/spider-music-player';
const out=path.resolve('outputs/desdivj-2114305692547043677/site');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[],checks={};page.on('pageerror',error=>errors.push(error.message));
try{
 const response=await page.goto(base+href,{waitUntil:'networkidle'});assert.equal(response.status(),200);
 await expect(page.getByRole('heading',{name:'蜘蛛牵引切歌',exact:true})).toBeVisible();
 await expect(page.locator('a[href="https://x.com/desdivj"]')).toContainText('Divan Raj');
 assert.equal(await page.locator('video').count(),0);assert.equal(await page.locator('a[href*="2114305692547043677"],a[href*="outputs/"]').count(),0,'reference media remains internal');
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await expect(frame.locator('.sm-scene')).toHaveAttribute('data-ready','true');
 const embedded=await(await iframe.elementHandle()).contentFrame(),waitPhase=phase=>embedded.waitForFunction(phase=>document.querySelector('[data-motion-surface]').shadowRoot.querySelector('.sm-scene').dataset.phase===phase,phase,{polling:'raf'});
 const expected=await Promise.all(SPIDER_TRACKS.map(async track=>'data:image/webp;base64,'+(await fs.readFile('public'+track.file)).toString('base64')));
 assert.deepEqual(await frame.locator('.sm-art img').evaluateAll(images=>images.map(image=>image.src)),expected,'all eight live images are the real album files recorded in the source manifest');
 const click=async selector=>{await iframe.scrollIntoViewIfNeeded();const outer=await iframe.boundingBox(),local=await frame.locator(selector).evaluate(node=>({rect:node.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);};
 await click('[data-action=next]');await waitPhase('carry');await page.waitForTimeout(130);await iframe.screenshot({path:path.join(out,'detail-carry.png')});
 await expect(frame.locator('.sm-scene')).toHaveAttribute('data-track','1');await expect(frame.locator('.sm-scene')).toHaveAttribute('data-phase','idle');
 await click('[data-action=previous]');await waitPhase('wrap');await page.waitForTimeout(200);await iframe.screenshot({path:path.join(out,'detail-return-web.png')});
 await expect(frame.locator('.sm-scene')).toHaveAttribute('data-track','0');await expect(frame.locator('.sm-scene')).toHaveAttribute('data-phase','idle');
 await frame.getByRole('button',{name:'Next track',exact:true}).focus();await frame.getByRole('button',{name:'Next track',exact:true}).press('Tab');
 const focus=await frame.getByRole('button',{name:'Repeat track',exact:true}).evaluate(node=>({style:getComputedStyle(node).outlineStyle,width:getComputedStyle(node).outlineWidth}));assert.equal(focus.style,'solid');assert.equal(focus.width,'3px');
 const sourceRequests=[],observeSource=request=>{if(request.isNavigationRequest())sourceRequests.push(request.url());};context.on('request',observeSource);
 const [popup]=await Promise.all([page.waitForEvent('popup'),click('.sm-source')]);await popup.waitForLoadState('domcontentloaded');
 assert(sourceRequests.includes(SPIDER_TRACKS[0].source),'the real album source is requested before any provider region redirect');assert.equal(new URL(popup.url()).hostname,'music.apple.com');
 checks.albumSourceNavigation={requested:SPIDER_TRACKS[0].source,providerDestination:popup.url()};context.off('request',observeSource);await popup.close();
 checks.detail={scaledPointerInput:true,forward:true,reverse:true,realCovers:8,albumSourcePopup:true,visibleFocus:true,author:true,noReferenceVideo:true};
 await page.locator('h1').first().click();
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForFunction(()=>{const node=document.querySelector('section[aria-label="Demo"] iframe');return Math.abs(node.getBoundingClientRect().width-node.parentElement.clientWidth)<1;});
  // Sandboxed frames repaint on a separate compositor after the outer resize.
  await page.waitForTimeout(300);
  const painted=await sharp(await iframe.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true}),offset=(Math.floor(painted.info.height*.5)*painted.info.width+Math.floor(painted.info.width*.97))*painted.info.channels;
  assert(painted.data[offset]>=170&&painted.data[offset]<230,'the right edge is painted with the scene background, not an unpainted white frame');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`detail-${width}.png`)});
 }
 checks.widths=[375,768,1440];
 checks.completeFramePaint=true;
 const link=page.locator(`aside a[href="${href}"]`).first(),floating=page.locator(`[data-sidebar-preview="${href}"]`);
 await link.hover();await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);
 let handle=await floating.locator('iframe').elementHandle(),preview=await handle.contentFrame();
 await preview.locator('.sm-scene[data-phase=carry]').waitFor();assert.equal(await preview.locator('.sm-scene').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(244, 244, 244)');
 const box=await floating.locator('[data-preview-state]').boundingBox();assert(Math.abs(box.width-224)<2.5&&Math.abs(box.height-168)<2.5);await page.screenshot({path:path.join(out,'sidebar-preview.png')});
 await page.mouse.move(1000,10);await expect(floating).toHaveCount(0);
 await link.hover();await page.waitForTimeout(30);await page.mouse.move(1000,10);await page.waitForTimeout(200);await expect(floating).toHaveCount(0);
 await link.focus();await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);await link.evaluate(node=>node.blur());await expect(floating).toHaveCount(0);
 await link.hover();await expect(floating).toHaveCount(1);await page.mouse.wheel(0,200);await expect(floating).toHaveCount(0);
 checks.sidebar={actualTransfer:true,background:'#f4f4f4',size:'224x168',leaveCleanup:true,quickHover:true,keyboard:true,scrollCleanup:true};
 await page.goto(base+'/components',{waitUntil:'networkidle'});const card=page.locator(`[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
 handle=await card.locator('iframe').elementHandle();preview=await handle.contentFrame();await preview.locator('.sm-scene[data-phase=carry]').waitFor();await card.screenshot({path:path.join(out,'gallery-preview.png')});await page.mouse.move(10,10);await expect(card.locator('iframe')).toHaveCount(0);checks.gallery={listed:true,actualTransfer:true,leaveCleanup:true};
 await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await dialog.locator('input').fill('蜘蛛');await expect(dialog.getByRole('button',{name:'蜘蛛牵引切歌',exact:true})).toBeVisible();await page.keyboard.press('Escape');checks.search=true;
 await card.locator(`a[href="${href}"]`).first().click();await expect(page).toHaveURL(base+href);checks.navigation=true;
 await page.getByRole('button',{name:'复制给 AI',exact:true}).click();const menu=page.getByRole('menu',{name:'复制给 AI',exact:true});
 await page.evaluate(()=>{window.__copyWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async()=>{throw new DOMException('Denied for test','NotAllowedError');};});
 await menu.getByRole('menuitem',{name:'复制提示词',exact:true}).click();await expect(menu.getByRole('menuitem',{name:'复制失败，请重试',exact:true})).toBeVisible();await page.evaluate(()=>navigator.clipboard.writeText=window.__copyWrite);
 await menu.getByRole('menuitem',{name:'复制失败，请重试',exact:true}).click();await expect(menu.getByRole('menuitem',{name:'已复制',exact:true})).toBeVisible();
 const prompt=await page.evaluate(()=>navigator.clipboard.readText());assert(prompt.includes('蜘蛛牵引切歌'));assert(!/(https?:\/\/|[A-Z]:[\\/]|参考视频|沿用原|包内字体)/i.test(prompt));await fs.writeFile(path.join(out,'actual-copied-prompt.txt'),prompt);checks.copyRetry=true;
 const blank=await context.newPage();await blank.goto(base+'/components',{waitUntil:'networkidle'});await blank.setContent('<!doctype html><textarea aria-label="Copied prompt"></textarea>');await blank.locator('textarea').focus();await blank.keyboard.press('Control+v');
 const normal=value=>value.replace(/\r\n/g,'\n');assert.equal(normal(await blank.locator('textarea').inputValue()),normal(prompt));checks.blankPromptPaste=true;await blank.close();
 assert.deepEqual(errors,[]);checks.pageErrors=errors;await fs.writeFile(path.join(out,'results.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
}catch(error){await page.screenshot({path:path.join(out,'failure.png')});await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:String(error),errors},null,2));throw error;}finally{await browser.close();}
