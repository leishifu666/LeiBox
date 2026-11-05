import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

export async function verifyMultiCursorBuilder(page,item,root,out){
 const scene=page.locator('#demo .mc-scene'),port=page.locator('#demo .mc-port');
 await expect(scene).toHaveAttribute('data-ready','true');
 await page.evaluate(()=>{window.__builderPhases=[];window.__builderReplays=0;window.__update({speed:2,onPhaseChange:p=>window.__builderPhases.push(p),onReplay:()=>window.__builderReplays++});});
 await expect(scene).toHaveAttribute('data-phase','build',{timeout:15000});
 assert((await port.evaluate(n=>n.scrollHeight))>2000,'full portfolio remains scrollable inside the component');
 const fonts=await page.evaluate(()=>[...document.fonts].filter(f=>f.family.startsWith('LeiBoxBuilder')).map(f=>({status:f.status,style:f.style,weight:f.weight})));
 assert.equal(fonts.length,6);assert(fonts.every(f=>f.status==='loaded'));assert(fonts.some(f=>f.style==='italic'),'serif italic has its own actual font face');
 await port.focus();await port.press('Space');await expect(scene).toHaveAttribute('data-running','false');
 const stopped=await scene.getAttribute('data-frame');await page.waitForTimeout(140);assert.equal(await scene.getAttribute('data-frame'),stopped,'pause stops real canvas frames');
 await port.press('p');await expect(scene).toHaveAttribute('data-running','true');await expect.poll(()=>scene.getAttribute('data-frame')).not.toBe(stopped);
 await page.locator('#demo #rp').click();assert.equal(await page.evaluate(()=>window.__builderReplays),1);await expect(scene).toHaveAttribute('data-phase','intro');
 await page.evaluate(()=>window.__update({skipIntro:true,speed:2}));await expect(scene).toHaveAttribute('data-phase','build');
 await port.evaluate(n=>n.scrollTo({top:220,behavior:'instant'}));
 await expect.poll(()=>page.locator('#demo .art').first().evaluate(n=>Number(n.style.opacity)),{timeout:20000}).toBe(1);
 const outer=await page.evaluate(()=>scrollY);await port.hover();await page.mouse.wheel(0,950);await expect.poll(()=>port.evaluate(n=>n.scrollTop)).toBeGreaterThan(500);assert.equal(await page.evaluate(()=>scrollY),outer,'wheel stays in the inner native scroll pane');
 await page.mouse.wheel(0,-2000);await expect.poll(()=>port.evaluate(n=>n.scrollTop)).toBe(0);
 // Below-the-fold blocks are really constructed and removed, rather than swapping static pictures.
 await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(scene).toHaveAttribute('data-running','false');
 assert(await page.locator('#demo .b').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).opacity==='1')),'reduced motion presents complete content');
 const reduced=await scene.getAttribute('data-frame');await page.waitForTimeout(140);assert.equal(await scene.getAttribute('data-frame'),reduced);
 const anchor=page.locator('#demo .mc-port a[href="#selected"]');
 if(await anchor.count()){await anchor.click();await expect.poll(()=>port.evaluate(n=>n.scrollTop)).toBeGreaterThan(300);assert.equal(await page.evaluate(()=>scrollY),outer,'native anchors do not change the host document');}
 await page.evaluate(()=>window.__update({reducedMotion:false,skipIntro:false}));await page.locator('#demo #rp').click();await page.evaluate(()=>window.__update({skipIntro:true,speed:2}));
 const lastImage=page.locator('#demo .art').last();await expect.poll(()=>lastImage.evaluate(n=>Number(n.style.opacity))).toBe(0);
 await port.evaluate(n=>n.scrollTo({top:n.scrollHeight,behavior:'instant'}));await expect.poll(()=>lastImage.evaluate(n=>Number(n.style.opacity)),{timeout:20000}).toBe(1);
 await port.evaluate(n=>n.scrollTo({top:0,behavior:'instant'}));await expect.poll(()=>lastImage.evaluate(n=>Number(n.style.opacity)),{timeout:15000}).toBe(0);
 await page.evaluate(()=>window.__update({showToolbar:false}));await expect(page.locator('#demo #bar')).toBeHidden();await page.evaluate(()=>window.__update({showToolbar:true}));await expect(page.locator('#demo #bar')).toBeVisible();
 await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.marginTop='2000px');await expect(scene).toHaveAttribute('data-running','false');const hidden=await scene.getAttribute('data-frame');await page.waitForTimeout(140);assert.equal(await scene.getAttribute('data-frame'),hidden);
 await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.marginTop='0');await expect(scene).toHaveAttribute('data-running','true');
 if(item.framework==='react')await page.screenshot({path:out+'/multi-cursor-builder-interaction.png'});
}
