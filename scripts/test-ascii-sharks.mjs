import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

export async function verifyAsciiSharks(page,item,ROOT,OUT){
 const scene=page.locator('#demo .ao-scene'),canvas=page.locator('#demo .ao-canvas'),input=page.locator('#demo .ao-input');
 const pixels=()=>canvas.evaluate(n=>n.toDataURL());
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-sharks','4');
 assert(Number(await scene.getAttribute('data-fish'))>50);const start=await pixels();
 await page.waitForTimeout(140);assert.notEqual(await pixels(),start,'the original character rendering actually animates');
 await canvas.focus();await canvas.press('Space');await expect(scene).toHaveAttribute('data-paused','true');
 const stopped=await scene.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await scene.getAttribute('data-time'),stopped);
 await page.evaluate(()=>window.__sharkRandomRef=Math.random);
 await canvas.press('r');const reset=await pixels();await canvas.press('r');assert.equal(await pixels(),reset,'the per-instance seed repeats the same frame');assert(await page.evaluate(()=>Math.random===window.__sharkRandomRef),'resets do not overwrite global Math.random');
 if(item.framework==='react'){
  await page.setViewportSize({width:1173,height:1000});await canvas.press('r');
  await canvas.evaluate(n=>n.blur());
  await scene.evaluate(n=>n.dataset.preview='true');
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components/ascii-sharks.png')});
  await scene.evaluate(n=>delete n.dataset.preview);await page.setViewportSize({width:1200,height:1000});
 }
 await canvas.evaluate(n=>n.dataset.identity='persistent-water');
 const beforeManual=await pixels();
 await canvas.press('ArrowRight');await expect(scene).toHaveAttribute('data-pointer','true');
 await canvas.press('Enter');await expect(scene).toHaveAttribute('data-splashes','1');assert.notEqual(await pixels(),beforeManual,'manual input still changes a paused ocean');
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.15,box.y+box.height*.12);await expect(scene).toHaveAttribute('data-pointer','true');
 await page.mouse.click(box.x+box.width*.15,box.y+box.height*.12);await expect(scene).toHaveAttribute('data-splashes','2');
 const splash=(await scene.getAttribute('data-last-splash')).split(',').map(Number);assert(Math.abs(splash[0]-box.width*.15)<2&&Math.abs(splash[1]-box.height*.12)<2);
 await page.evaluate(()=>{window.__sharkMessages=[];window.__sharkVoice=0;window.__update({onSubmit:m=>window.__sharkMessages.push({text:m.text,files:m.attachments.map(f=>f.name)}),onVoiceInput:()=>window.__sharkVoice++});});
 await input.fill('A calm ocean');await input.press('Shift+Enter');await input.press('End');await input.type('with sharks');
 assert((await input.inputValue()).includes('\n'));await input.press('Enter');await expect(input).toHaveValue('');await expect(scene).toHaveAttribute('data-messages','1');
 assert((await page.evaluate(()=>window.__sharkMessages[0].text)).includes('with sharks'));
 await page.locator('#demo .ao-history').click();await expect(page.locator('#demo .ao-history-panel')).toBeVisible();
 await page.locator('#demo .ao-history-item').click();assert((await input.inputValue()).includes('A calm ocean'));
 await page.locator('#demo .ao-voice').click();assert.equal(await page.evaluate(()=>window.__sharkVoice),1,'voice only calls the supplied handler');
 await input.fill('');await page.locator('#demo .ao-file').setInputFiles({name:'ocean-notes.txt',mimeType:'text/plain',buffer:Buffer.from('local only')});
 await expect(page.locator('#demo .ao-attachment')).toContainText('ocean-notes.txt');await page.locator('#demo .ao-remove').click();await expect(page.locator('#demo .ao-attachment')).toHaveCount(0);
 await page.locator('#demo .ao-file').setInputFiles({name:'ocean-notes.txt',mimeType:'text/plain',buffer:Buffer.from('local only')});await page.locator('#demo .ao-send').click();
 assert.deepEqual(await page.evaluate(()=>window.__sharkMessages[1].files),['ocean-notes.txt']);
 await page.evaluate(()=>window.__update({theme:'dark',showComposer:false}));await expect(canvas).toHaveCSS('filter','none');await expect(page.locator('#demo .ao-composer')).toBeHidden();
 if(item.framework==='react')await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(OUT,'ascii-sharks-dark.png')});
 const kinds=['classic','hammerhead','zebra','tiger','greathammer','mako','thresher','nurse'];
 await page.evaluate(sharks=>window.__update({sharks,fishCount:100,reducedMotion:true,theme:'light',showComposer:true}),kinds.map(kind=>({kind,size:.7})));
 await expect(scene).toHaveAttribute('data-sharks','8');assert.equal(await canvas.getAttribute('data-identity'),'persistent-water');
 if(item.framework==='react')await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(OUT,'ascii-sharks-eight-species.png')});
 await page.evaluate(()=>window.__update({paused:false,reducedMotion:true,sharks:[{kind:'greathammer',size:1}],fishCount:0}));await expect(scene).toHaveAttribute('data-sharks','1');await expect(scene).toHaveAttribute('data-fish','0');
 const still=await scene.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await scene.getAttribute('data-time'),still,'reduced motion does not run a background simulation');
 await page.evaluate(()=>window.__update({reducedMotion:undefined}));await page.emulateMedia({reducedMotion:'reduce'});const mediaStill=await scene.getAttribute('data-time');await page.waitForTimeout(140);assert.equal(await scene.getAttribute('data-time'),mediaStill);
 await page.emulateMedia({reducedMotion:'no-preference'});await expect.poll(()=>scene.getAttribute('data-time')).not.toBe(mediaStill);
 await page.locator('#demo').evaluate(n=>n.style.transform='translateY(1800px)');await expect(scene).toHaveAttribute('data-visible','false');const hidden=await scene.getAttribute('data-time');await page.waitForTimeout(180);assert.equal(await scene.getAttribute('data-time'),hidden);
 await page.locator('#demo').evaluate(n=>n.style.transform='');await expect(scene).toHaveAttribute('data-visible','true');await expect.poll(()=>scene.getAttribute('data-time')).not.toBe(hidden);
 const cdp=await page.context().newCDPSession(page),touch=await canvas.boundingBox(),count=Number(await scene.getAttribute('data-splashes'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x+touch.width*.1,y:touch.y+touch.height*.15}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await expect(scene).toHaveAttribute('data-splashes',String(count+1));
 await input.fill('Keep this draft');await page.evaluate(()=>window.__update({seed:29,theme:'light'}));await expect(input).toHaveValue('Keep this draft');await expect(scene).toHaveAttribute('data-seed','29');
}

export async function verifyAsciiSharksDoc(page){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe');
 await iframe.scrollIntoViewIfNeeded();await expect(frame.locator('.ao-scene')).toHaveAttribute('data-ready','true');
 await frame.locator('.ao-input').fill('A local ocean note');await frame.locator('.ao-input').press('Enter');await expect(frame.locator('.ao-scene')).toHaveAttribute('data-messages','1');
 await frame.locator('.ao-input').fill('Another local ocean note');await frame.locator('.ao-send').click();await expect(frame.locator('.ao-scene')).toHaveAttribute('data-messages','2');
 await expect(page.locator('a[href="https://x.com/stackedlol"]')).toHaveText('作者 · stacked');assert.equal(await page.locator('video').count(),0);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1000});await iframe.scrollIntoViewIfNeeded();
  const outer=await iframe.boundingBox(),size=await frame.locator('.ao-add').evaluate(n=>({width:n.getBoundingClientRect().width,viewport:innerWidth}));
  assert(size.width*outer.width/size.viewport>=24,'the responsive composer keeps usable touch targets');
 }
}

export async function verifyAsciiSharksPreviews(page,base,out){
 const href='/docs/animations/ascii-sharks';await page.goto(base+'/components',{waitUntil:'networkidle'});
 const card=page.locator(`li[data-component-card="${href}"]`);await card.hover();await expect(card.locator('[data-scene-ready=true]')).toHaveCount(1);
 const live=card.frameLocator('iframe');await expect(live.locator('.ao-scene')).toHaveAttribute('data-preview','true');
 const time=await live.locator('.ao-scene').getAttribute('data-time');await expect.poll(()=>live.locator('.ao-scene').getAttribute('data-time')).not.toBe(time);
 await page.screenshot({path:path.join(out,'ascii-sharks-gallery-live.png')});await page.mouse.move(1000,20);await expect(card.locator('iframe')).toHaveCount(0);
 await page.goto(base+href,{waitUntil:'networkidle'});const link=page.locator(`aside a[href="${href}"]`),panel=page.locator(`[data-sidebar-preview="${href}"]`);
 await link.hover();await expect(panel.locator('[data-scene-ready=true]')).toHaveCount(1);await expect(panel.frameLocator('iframe').locator('.ao-scene')).toHaveAttribute('data-sharks','4');
 await page.screenshot({path:path.join(out,'ascii-sharks-sidebar-live.png')});await page.mouse.move(1100,20);await expect(panel).toHaveCount(0);
 await link.focus();await expect(panel).toBeVisible();await page.keyboard.press('Tab');await expect(panel).toHaveCount(0);
}
