import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium,expect} from 'playwright/test';
import sharp from 'sharp';

const base=process.env.BASE_URL||'http://127.0.0.1:3000',href='/docs/animations/fluid-tooltip';
const out=path.resolve('outputs/anthony99-2114869597577023821/site');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[],checks={};page.on('pageerror',e=>errors.push(e.message));
try{
 const response=await page.goto(base+href,{waitUntil:'networkidle'});assert.equal(response.status(),200);
 await expect(page.getByRole('heading',{name:'流体提示气泡',exact:true})).toBeVisible();
 assert.equal(await page.locator('a[href*="Anthony99_s"],a[href*="2114869597577023821"],video').count(),0);
 assert(!(await page.locator('body').innerText()).includes('Anthony Lorenzo'));
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await expect(frame.locator('.ft-scene')).toHaveAttribute('data-ready','true');
 const logo='data:image/svg+xml;base64,'+(await fs.readFile('public/leibox-mark.svg')).toString('base64');assert.equal(await frame.locator('.ft-logo').getAttribute('src'),logo);
 const point=async(id,click=false)=>{await iframe.scrollIntoViewIfNeeded();const box=await iframe.boundingBox(),item=await frame.locator(`[data-item=${id}]`).evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),s=box.width/item.width,x=box.x+(item.rect.x+item.rect.width/2)*s,y=box.y+(item.rect.y+item.rect.height/2)*s;if(click)await page.mouse.click(x,y);else await page.mouse.move(x,y);};
 await point('profile');await expect(frame.locator('.ft-scene')).toHaveAttribute('data-hint','profile');await expect(frame.locator('.ft-tooltip')).toHaveAttribute('aria-label','LeiBox');
 await point('settings');await expect(frame.locator('.ft-scene')).toHaveAttribute('data-hint','settings');await page.waitForTimeout(100);await iframe.screenshot({path:path.join(out,'live-transition.png')});
 await point('calendar',true);await expect(frame.locator('.ft-scene')).toHaveAttribute('data-active','calendar');
 await frame.getByRole('button',{name:'Today',exact:true}).focus();await frame.getByRole('button',{name:'Today',exact:true}).press('ArrowDown');await frame.getByRole('button',{name:'Tasks',exact:true}).press('Enter');await expect(frame.locator('.ft-scene')).toHaveAttribute('data-active','tasks');
 assert.equal(await frame.locator('.ft-tooltip').count(),1);checks.detail={logo:true,noOriginalAvatar:true,noAuthorSource:true,noReferenceVideo:true,scaledHover:true,scaledClick:true,keyboard:true,singleCapsule:true};
 await page.locator('h1').first().click();
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(300);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const shot=await sharp(await iframe.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true}),offset=(Math.floor(shot.info.height*.5)*shot.info.width+Math.floor(shot.info.width*.97))*shot.info.channels;
  assert(shot.data[offset]>35&&shot.data[offset]<110&&shot.data[offset+2]>75&&shot.data[offset+2]<155,'the full right edge is painted with the blue panel');
  await page.screenshot({path:path.join(out,`detail-${width}.png`)});
 }
 checks.widths=[375,768,1440];checks.completeFramePaint=true;
 const link=page.locator(`aside a[href="${href}"]`).first(),floating=page.locator(`[data-sidebar-preview="${href}"]`);
 await link.hover();await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);
 let handle=await floating.locator('iframe').elementHandle(),preview=await handle.contentFrame();await preview.waitForFunction(()=>{const r=document.querySelector('[data-motion-surface]').shadowRoot;return r.querySelector('.ft-scene').dataset.hint!=='profile';});
 assert.equal(await preview.locator('.ft-scene').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');assert.equal(await preview.locator('.ft-logo').getAttribute('src'),logo);
 const box=await floating.locator('[data-preview-state]').boundingBox();assert(Math.abs(box.width-224)<2.5&&Math.abs(box.height-168)<2.5);await page.screenshot({path:path.join(out,'sidebar-preview.png')});
 await page.mouse.move(1300,10);await expect(floating).toHaveCount(0);await link.hover();await page.waitForTimeout(25);await page.mouse.move(1300,10);await page.waitForTimeout(200);await expect(floating).toHaveCount(0);
 await link.focus();await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);await link.evaluate(n=>n.blur());await expect(floating).toHaveCount(0);
 await link.hover();await expect(floating).toHaveCount(1);await page.mouse.wheel(0,160);await expect(floating).toHaveCount(0);
 checks.sidebar={size:'224x168',animated:true,logo:true,background:'#f4f4f4',leave:true,quickHover:true,keyboard:true,scrollCleanup:true};
 await page.goto(base+'/components',{waitUntil:'networkidle'});const card=page.locator(`[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
 handle=await card.locator('iframe').elementHandle();preview=await handle.contentFrame();await preview.waitForFunction(()=>document.querySelector('[data-motion-surface]').shadowRoot.querySelector('.ft-scene').dataset.hint==='settings');await card.screenshot({path:path.join(out,'gallery-preview.png')});
 await page.mouse.move(10,10);await expect(card.locator('iframe')).toHaveCount(0);checks.gallery={animated:true,logo:true,cleanup:true};
 await page.keyboard.press('Control+k');const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await dialog.locator('input').fill('流体提示');await expect(dialog.getByRole('button',{name:'流体提示气泡',exact:true})).toBeVisible();await page.keyboard.press('Escape');checks.search=true;
 await card.locator(`a[href="${href}"]`).first().click();await expect(page).toHaveURL(base+href);
 await page.getByRole('button',{name:'复制给 AI',exact:true}).click();const menu=page.getByRole('menu',{name:'复制给 AI',exact:true});
 await page.evaluate(()=>{window.__copyWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async()=>{throw new DOMException('Denied for test','NotAllowedError');};});
 await menu.getByRole('menuitem',{name:'复制提示词',exact:true}).click();await expect(menu.getByRole('menuitem',{name:'复制失败，请重试',exact:true})).toBeVisible();await page.evaluate(()=>navigator.clipboard.writeText=window.__copyWrite);
 await menu.getByRole('menuitem',{name:'复制失败，请重试',exact:true}).click();await expect(menu.getByRole('menuitem',{name:'已复制',exact:true})).toBeVisible();const prompt=await page.evaluate(()=>navigator.clipboard.readText());
 assert(prompt.includes('LeiBox图形viewBox'));assert(!/(https?:\/\/|Anthony|[A-Z]:[\\/]|参考视频)/i.test(prompt));await fs.writeFile(path.join(out,'copied-prompt.txt'),prompt);
 const blank=await context.newPage();await blank.goto(base+'/components',{waitUntil:'networkidle'});await blank.setContent('<textarea></textarea>');await blank.locator('textarea').focus();await blank.keyboard.press('Control+v');assert.equal((await blank.locator('textarea').inputValue()).replace(/\r\n/g,'\n'),prompt.replace(/\r\n/g,'\n'));await blank.close();checks.copyRetry=true;checks.blankPaste=true;
 assert.deepEqual(errors,[]);checks.pageErrors=errors;await fs.writeFile(path.join(out,'results.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
}catch(error){await page.screenshot({path:path.join(out,'failure.png')});await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:String(error),errors},null,2));throw error;}finally{await browser.close();}
