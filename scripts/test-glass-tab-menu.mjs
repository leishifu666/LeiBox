import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';
export async function verifyGlassTabMenu(page,item,rootPath,outputPath){
 const root=page.locator('#demo .glass-tab-demo'),tabs=root.locator('.gt-tab'),toggle=root.locator('.gt-toggle'),menu=root.locator('.gt-menu'),actions=root.locator('.gt-action'),panel=root.locator('.gt-panel');
 await expect(root).toHaveAttribute('data-motion-ready','true');assert.equal(await tabs.count(),4);assert.equal(await actions.count(),6);
 await tabs.nth(2).hover();assert.equal(await root.getAttribute('data-selection'),'0','hover does not select a tab');
 await tabs.nth(3).click();assert.equal(await tabs.nth(3).getAttribute('aria-selected'),'true');
 await expect.poll(()=>root.evaluate(n=>+n.dataset.indicator)).toBe(3);
 if(item.framework==='react'){
  await tabs.first().click();await expect(root).toHaveAttribute('data-moving','false');
  await page.evaluate(()=>window.__update({height:900}));await root.evaluate(n=>n.style.background='#f4f4f4');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(rootPath,'public/assets/components/glass-tab-menu.png')});
  await root.evaluate(n=>n.style.background='');await page.evaluate(()=>window.__update({height:1080}));
 }
 await panel.evaluate(n=>n.dataset.identity='retained');
 await toggle.click();await expect.poll(()=>root.evaluate(n=>+n.dataset.progress)).toBeGreaterThan(0);
 const partial=await root.evaluate(n=>+n.dataset.progress);assert(partial<1,'opening has intermediate geometry');
 assert((await panel.evaluate(n=>n.getBoundingClientRect().width))<762,'the shell narrows during the morph');
 const box=await toggle.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await expect(root).toHaveAttribute('data-open','false');await expect(root).toHaveAttribute('data-moving','false');assert.equal(await root.getAttribute('data-progress'),'0.0000');
 for(let i=0;i<5;i++)await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await expect(root).toHaveAttribute('data-open','true');await expect(root).toHaveAttribute('data-moving','false');assert.equal(await root.getAttribute('data-progress'),'1.0000');assert.equal(await panel.getAttribute('data-identity'),'retained');
 assert.equal(await menu.getAttribute('inert'),null);assert.equal(await root.locator('.gt-tabs').getAttribute('inert'),'');
 if(item.framework==='react')await root.screenshot({path:path.join(outputPath,'glass-tab-menu-expanded.png')});
 await page.mouse.click(3,3);await expect(root).toHaveAttribute('data-open','false');await expect(root).toHaveAttribute('data-moving','false');
 await tabs.first().focus();await tabs.first().press('End');assert.equal(await root.getAttribute('data-selection'),'3');await tabs.nth(3).press('ArrowLeft');assert.equal(await root.getAttribute('data-selection'),'2');
 await toggle.focus();await toggle.press('ArrowDown');await expect(actions.first()).toBeFocused();
 await actions.first().press('ArrowRight');await expect(actions.nth(1)).toBeFocused();await actions.nth(1).press('ArrowDown');await expect(actions.nth(4)).toBeFocused();await actions.nth(4).press('Home');await expect(actions.first()).toBeFocused();await actions.first().press('End');await expect(actions.last()).toBeFocused();await actions.last().press('Escape');await expect(toggle).toBeFocused();await expect(root).toHaveAttribute('data-open','false');
 await page.emulateMedia({reducedMotion:'reduce'});await toggle.click();assert.equal(await root.getAttribute('data-progress'),'1.0000');await toggle.click();assert.equal(await root.getAttribute('data-progress'),'0.0000');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(page.locator('#demo [data-motion-surface]')).toHaveAttribute('data-reduced-motion','true');
 await root.evaluate(n=>{n.__actions=[];n.addEventListener('glass-tab-action',e=>n.__actions.push(e.detail.action));});
 for(let i=0;i<6;i++){await toggle.click();assert.equal(await root.getAttribute('data-progress'),'1.0000');await actions.nth(i).click();assert.equal(await root.getAttribute('data-progress'),'0.0000');assert.equal(await root.getAttribute('data-action'),['Note','Checklist','Photo','Scan','Voice','Sketch'][i]);}
 assert.deepEqual(await root.evaluate(n=>n.__actions),['Note','Checklist','Photo','Scan','Voice','Sketch']);
 await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(page.locator('#demo [data-motion-surface]')).toHaveAttribute('data-reduced-motion','false');
}
export async function verifyGlassTabMenuDoc(page,outputPath){
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe'),root=frame.locator('.glass-tab-demo');
 await iframe.scrollIntoViewIfNeeded();await expect(root).toHaveAttribute('data-motion-ready','true');
 async function clickLocal(selector){const outer=await iframe.boundingBox(),local=await frame.locator(selector).evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),k=outer.width/local.width;await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*k,outer.y+(local.rect.y+local.rect.height/2)*k);}
 await clickLocal('.gt-tab[aria-label="People"]');await expect(root).toHaveAttribute('data-selection','2');await expect(root).toHaveAttribute('data-moving','false');
 await clickLocal('.gt-toggle');await expect(root).toHaveAttribute('data-open','true');await expect(root).toHaveAttribute('data-moving','false');await page.screenshot({path:path.join(outputPath,'glass-tab-menu-open.png')});
 await clickLocal('.gt-action[data-action="Photo"]');await expect(root).toHaveAttribute('data-action','Photo');await expect(root).toHaveAttribute('data-open','false');
 await expect(page.locator('a[href="https://x.com/SolutionB2u"]')).toHaveText('作者 · solutionb');assert.equal(await page.locator('video,a[href$=".mp4"]').count(),0);
 await page.locator('nav a[href="/docs/animations/glass-tab-menu"]').hover();const preview=page.locator('[data-sidebar-preview="/docs/animations/glass-tab-menu"]');
 await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);const live=preview.frameLocator('iframe');await expect(live.locator('.glass-tab-demo')).toHaveAttribute('data-selection','1');
 await expect(live.locator('.glass-tab-demo')).toHaveAttribute('data-open','true');await page.screenshot({path:path.join(outputPath,'glass-tab-menu-sidebar-preview.png')});
 assert.equal(await live.locator('.glass-tab-demo').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');
 await page.mouse.move(1380,20);await expect(preview).toHaveCount(0);console.log('PASS DOC glass-tab-menu: tabs, morph, local action, author, sidebar animation and release');
}
