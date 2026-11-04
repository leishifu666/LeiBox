import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

export async function verifyShaderFlood(page,item,root,out){
 const scene=page.locator('#demo .sf-scene'),cards=page.locator('#demo .sf-card'),canvas=page.locator('#demo .sf-canvas');
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-renderer','webgl');await expect(cards).toHaveCount(6);await expect(canvas).toHaveCount(1);
 await page.evaluate(()=>window.__floodContexts=[document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('canvas').getContext('webgl')]);
 const first=cards.first(),box=await first.boundingBox();
 await page.mouse.move(box.x-4,box.y+box.height*.3);await page.mouse.move(box.x+2,box.y+box.height*.3);
 await expect(first).toHaveAttribute('data-active','true');let origin=(await first.getAttribute('data-origin')).split(',').map(Number);assert(origin[0]<.02&&Math.abs(origin[1]-.3)<.02,'reveal starts at the real entry point');
 await expect(first).toHaveAttribute('data-progress','1.0000');const pixels=await canvas.evaluate(n=>n.toDataURL());await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),pixels,'procedural liquid changes real canvas pixels');
 assert.equal(await first.locator('.sf-title').evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');
 if(item.framework==='react')await page.screenshot({path:out+'/shader-flood-active.png'});
 await page.mouse.move(box.x+box.width+4,box.y+box.height*.7);await expect(first).toHaveAttribute('data-active','false');origin=(await first.getAttribute('data-origin')).split(',').map(Number);assert(origin[0]===1&&Math.abs(origin[1]-.7)<.02,'drain follows the actual right exit');
 await expect(first).toHaveAttribute('data-progress','0.0000');
 await page.mouse.move(box.x+2,box.y+box.height*.4);await page.waitForTimeout(65);await page.mouse.move(box.x-3,box.y+box.height*.4);await page.waitForTimeout(40);await page.mouse.move(box.x+3,box.y+box.height*.4);
 const partial=Number(await first.getAttribute('data-progress'));assert(partial>0&&partial<1,'rapid reversal retains the partial reveal');await expect(first).toHaveAttribute('data-progress','1.0000');
 await page.evaluate(()=>window.__update({speed:0,seed:2}));await page.waitForTimeout(80);const accent=await first.locator('.sf-icon').evaluate(n=>getComputedStyle(n).color),seed2=await canvas.evaluate(n=>n.toDataURL());
 await page.evaluate(()=>window.__update({seed:31}));await expect.poll(()=>canvas.evaluate(n=>n.toDataURL())).not.toBe(seed2);assert.equal(await first.locator('.sf-icon').evaluate(n=>getComputedStyle(n).color),accent,'seed changes shape without changing palette');
 await page.evaluate(()=>window.__update({items:[{title:'<img onerror=alert(1)>',description:'Local card',icon:'rocket',colors:['#132313','#73cf22','#f0faee']},{title:'Second',description:'Default palette',icon:'layers'}],seed:0}));
 await expect(cards).toHaveCount(2);await expect(first.locator('.sf-title')).toHaveText('<img onerror=alert(1)>');assert.equal(await scene.locator('img,script').count(),0);assert.equal(await first.locator('.sf-icon').evaluate(n=>getComputedStyle(n).color),'rgb(115, 207, 34)');
 await page.evaluate(()=>window.__update({items:undefined,speed:1}));await expect(cards).toHaveCount(6);await first.focus();await first.press('ArrowRight');await expect(cards.nth(1)).toBeFocused();await expect(cards.nth(1)).toHaveAttribute('data-active','true');
 await cards.nth(1).press('Escape');await expect.poll(()=>cards.evaluateAll(nodes=>nodes.every(n=>n.dataset.active==='false'))).toBe(true);
 await page.evaluate(()=>window.__update({reducedMotion:true}));await first.focus();await first.press('Escape');await first.press('Space');await expect(first).toHaveAttribute('data-progress','1.0000');const still=await canvas.evaluate(n=>n.toDataURL());await page.waitForTimeout(100);assert.equal(await canvas.evaluate(n=>n.toDataURL()),still,'reduced motion keeps a static texture with working keyboard state');await first.press('Escape');
 await page.evaluate(()=>window.__update({reducedMotion:false}));await page.setViewportSize({width:375,height:900});await first.tap();await expect(first).toHaveAttribute('data-active','true');await first.tap();await expect(first).toHaveAttribute('data-active','false');const touchBox=await cards.nth(1).boundingBox();await page.touchscreen.tap(touchBox.x+8,touchBox.y+50);await expect(cards.nth(1)).toHaveAttribute('data-active','true');await page.touchscreen.tap(3,3);await expect(cards.nth(1)).toHaveAttribute('data-active','false');
 await cards.nth(1).press('Escape');await cards.nth(1).press('Space');await expect(cards.nth(1)).toHaveAttribute('data-active','true');await expect(cards.nth(1)).toHaveAttribute('data-origin','0.5000,0.5000');await cards.nth(1).press('Escape');
 await page.setViewportSize({width:1200,height:1000});await page.mouse.move(1,1);await first.focus();await first.press('Escape');await page.waitForTimeout(600);const idle=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.__motionFrames),idle,'idle cards have no animation loop');
 await page.evaluate(()=>window.__floodContexts[0].getExtension('WEBGL_lose_context').loseContext());await expect(scene).toHaveAttribute('data-renderer','canvas2d');await first.focus();await first.press('Space');await expect(first).toHaveAttribute('data-active','true');await expect(first).toHaveAttribute('data-progress','1.0000');const fallback=await canvas.evaluate(n=>n.toDataURL());await page.waitForTimeout(150);assert.notEqual(await canvas.evaluate(n=>n.toDataURL()),fallback,'software fallback keeps rendering usable controls');await first.press('Escape');
}
