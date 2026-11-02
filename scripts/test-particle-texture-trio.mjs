import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';
export async function verifyParticleTextureTrio(page,item,root,out){
 const scene=page.locator('#demo .pt-scene'),canvas=page.locator('#demo .pt-canvas'),buttons=page.locator('#demo .pt-target');
 await expect(scene).toHaveAttribute('data-ready','true');assert.equal(await buttons.count(),3);
 const time=await scene.getAttribute('data-time');await page.waitForTimeout(120);assert.notEqual(await scene.getAttribute('data-time'),time,'particle fields really advance');
 await buttons.first().click();await expect(scene).toHaveAttribute('data-paused','true');
 await page.mouse.move(1,1);const paused=await canvas.evaluate(c=>c.toDataURL());await page.waitForTimeout(150);assert.equal(await canvas.evaluate(c=>c.toDataURL()),paused,'paused pixels stay still');
 const frozenBox=await canvas.boundingBox();
 for(const fraction of [.2,.5,.8]){await page.mouse.move(frozenBox.x+frozenBox.width*fraction,frozenBox.y+frozenBox.height*.5);assert.equal(await canvas.evaluate(c=>c.toDataURL()),paused,'pointer position must not bias the measured particle trajectories');}
 await page.mouse.move(1,1);
 await buttons.first().press('ArrowRight');assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),paused,'stepping changes actual dot fields');
 await buttons.first().press('ArrowDown');await expect(buttons.nth(1)).toBeFocused();
 await buttons.nth(1).press('Home');await expect(scene).toHaveAttribute('data-paused','false');
 await page.evaluate(()=>window.__update({reducedMotion:true}));const reduced=await scene.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await scene.getAttribute('data-time'),reduced);
 await buttons.nth(1).press('ArrowRight');assert.notEqual(await scene.getAttribute('data-time'),reduced,'reduced motion keeps keyboard stepping');
 await page.evaluate(()=>window.__update({reducedMotion:false,paused:false,speed:0}));const stopped=await scene.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await scene.getAttribute('data-time'),stopped,'zero speed stops playback');
 await page.evaluate(()=>window.__update({speed:1}));await page.waitForTimeout(120);assert.notEqual(await scene.getAttribute('data-time'),stopped);
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.5);await page.waitForTimeout(80);await page.mouse.move(1,1);
 await page.evaluate(()=>{window.__update({reducedMotion:true});document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.pt-target').click();});
 await expect(scene).toHaveAttribute('data-paused','true');
 if(item.framework==='react'){
  await page.setViewportSize({width:960,height:700});await buttons.first().press('Home');
  await buttons.first().evaluate(n=>n.blur());
  await canvas.screenshot({path:path.join(out,'particle-texture-reference-black.png')});
  await page.evaluate(()=>window.__update({background:'#f4f4f4'}));
  await canvas.screenshot({path:path.join(root,'public/assets/components/particle-texture-trio.png')});
  await page.setViewportSize({width:1200,height:1000});
 }
 await page.evaluate(()=>window.__update({reducedMotion:false,paused:false,speed:1,background:'#000'}));
 await page.locator('#demo').evaluate(n=>n.style.transform='translateY(2000px)');await page.waitForTimeout(100);const hidden=await scene.getAttribute('data-time');await page.waitForTimeout(120);assert.equal(await scene.getAttribute('data-time'),hidden,'offscreen field stops');
 await page.locator('#demo').evaluate(n=>n.style.transform='');await page.waitForTimeout(180);assert.notEqual(await scene.getAttribute('data-time'),hidden,'onscreen field resumes');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__update({reducedMotion:undefined}));const system=await scene.getAttribute('data-time');await page.waitForTimeout(120);assert.equal(await scene.getAttribute('data-time'),system);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>window.__mount('isolated'));await page.locator('#isolated .pt-target').first().click();
 await expect(page.locator('#isolated .pt-scene')).toHaveAttribute('data-paused','true');await expect(scene).toHaveAttribute('data-paused','false');
 await page.evaluate(()=>window.__unmount('isolated'));
}
