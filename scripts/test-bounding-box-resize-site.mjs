import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const base=process.env.BASE_URL||'http://localhost:3000',href='/docs/animations/bounding-box-resize';
const out='outputs/azlenelza-2106600214593462393';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto(base+'/components',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('html[data-locale="zh"]').waitFor();
  const card=page.locator(`[data-component-card="${href}"]`),preview=card.locator('[data-motion-preview="bounding-box-resize"]');
  await expect(card.locator('h2')).toHaveText('选框拖拽缩放');await card.scrollIntoViewIfNeeded();await page.mouse.move(1400,20);
  await expect(preview).toHaveAttribute('data-preview-state','poster');await card.hover();
  await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);
  const galleryFrame=page.frameLocator(`[data-component-card="${href}"] iframe`);
  await expect.poll(async()=>Number(await galleryFrame.locator('.bb-stage').getAttribute('data-width'))).toBeGreaterThan(291);
  await card.screenshot({path:out+'/gallery-animated.png'});await page.mouse.move(1400,20);await expect(preview.locator('iframe')).toHaveCount(0);
  await card.locator('a').focus();await expect(preview.locator('iframe')).toHaveCount(1);await page.waitForTimeout(2900);
  assert(await card.locator('a').evaluate(n=>n===document.activeElement),'automatic replay preserves gallery keyboard focus');
  await page.keyboard.press('Tab');await expect(preview.locator('iframe')).toHaveCount(0);

  await page.goto(base+href,{waitUntil:'domcontentloaded',timeout:60000});
  await expect(page.locator('a[href="https://x.com/azlenelza"]')).toHaveText('作者 · Azlen');assert.equal(await page.locator('video').count(),0);
  const sidebar=page.locator(`aside a[href="${href}"]`),floating=page.locator(`[data-sidebar-preview="${href}"]`);
  await sidebar.focus();await expect(floating.locator('[data-scene-ready=true]')).toHaveCount(1);await page.waitForTimeout(3100);
  await expect(floating).toHaveCount(1);assert(await sidebar.evaluate(n=>n===document.activeElement),'replay editor does not steal sidebar keyboard focus');
  const rect=await floating.boundingBox();assert.equal(rect.width,224);assert(Math.abs(rect.height-168)<2);
  await page.screenshot({path:out+'/sidebar-focus.png'});
  await page.evaluate(()=>window.scrollBy(0,100));await expect(floating).toHaveCount(0);
  await sidebar.hover();await expect(floating.locator('iframe')).toHaveCount(1);await page.mouse.move(1300,20);await expect(floating).toHaveCount(0);

  const iframe=page.locator('section[aria-label="Demo"] iframe');await iframe.scrollIntoViewIfNeeded();
  const frame=page.frameLocator('section[aria-label="Demo"] iframe');await expect(frame.locator('body')).toHaveAttribute('data-motion-ready','true');
  const local=await frame.locator('.bb-handle[data-handle=e]').evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth,scale:document.querySelector('.bb-workspace').getBoundingClientRect().width/624}));
  const outer=await iframe.boundingBox(),ratio=outer.width/local.width;
  const x=outer.x+(local.rect.x+local.rect.width/2)*ratio,y=outer.y+(local.rect.y+local.rect.height/2)*ratio;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40*local.scale*ratio,y,{steps:12});
  await expect(frame.locator('.bb-stage')).toHaveAttribute('data-width','331');await expect(frame.locator('.bb-stage')).toHaveAttribute('data-height','200');
  await page.screenshot({path:out+'/detail-drag.png'});await page.mouse.up();
  const input=frame.locator('.bb-chip[data-axis=width] input'),box=await input.evaluate(n=>n.getBoundingClientRect().toJSON());
  await page.mouse.click(outer.x+(box.x+box.width/2)*ratio,outer.y+(box.y+box.height/2)*ratio);
  await input.fill('350');await input.press('Enter');await expect(frame.locator('.bb-stage')).toHaveAttribute('data-width','350');
  await page.getByRole('button',{name:'重置演示',exact:true}).click();await expect(frame.locator('.bb-stage')).toHaveAttribute('data-width','291');

  const touch=await browser.newContext({viewport:{width:375,height:700},hasTouch:true,isMobile:true});
  const mobile=await touch.newPage();mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base+'/motion/bounding-box-resize.html');
  const target=await mobile.locator('.bb-handle[data-handle=e]').boundingBox(),scale=await mobile.locator('.bb-workspace').evaluate(n=>n.getBoundingClientRect().width/624);
  const client=await touch.newCDPSession(mobile),tx=target.x+target.width/2,ty=target.y+target.height/2;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx+50*scale,y:ty,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(mobile.locator('.bb-stage')).toHaveAttribute('data-width','341');await expect(mobile.locator('.bb-stage')).toHaveAttribute('data-height','200');
  await mobile.screenshot({path:out+'/touch-375.png'});await touch.close();
  assert.deepEqual(errors,[]);
  await fs.writeFile(out+'/site-results.json',JSON.stringify({galleryAnimation:true,posterAndCleanup:true,galleryKeyboardFocus:true,sidebarKeyboardFocus:true,sidebarHover:true,scrollCleanup:true,scaledDetailDrag:true,dimensionInput:true,reset:true,touchDrag:true,authorLink:true,noReferenceVideo:true,pageErrors:errors},null,2));
  console.log('PASS bounding-box-resize: gallery, sidebar, retained focus, scaled drag, dimension input, reset, touch and attribution');
}catch(error){await page.screenshot({path:out+'/site-failure.png'});await fs.writeFile(out+'/site-failure.json',JSON.stringify({error:String(error),url:page.url(),errors},null,2));throw error;}
finally{await browser.close();}
