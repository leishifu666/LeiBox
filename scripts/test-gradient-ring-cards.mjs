import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {expect} from 'playwright/test';
import sharp from 'sharp';
export async function verifyGradientRingCards(page,item,rootDir,outDir){
 const root=page.locator('#demo'),scene=root.locator('.gr-scene'),canvas=root.locator('.gr-canvas'),out=path.join(outDir,'gradient-ring-cards',item.framework);await fs.mkdir(out,{recursive:true});
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-renderer','webgl');
 const phase=Number(await scene.getAttribute('data-phase'));await expect.poll(async()=>Number(await scene.getAttribute('data-phase'))-phase,{message:'rotation advances while autoplay is enabled',timeout:4000}).toBeGreaterThan(.03);
 await page.evaluate(()=>{window.__grEvents=[];window.__update({active:0,autoRotate:false,onSelect:id=>window.__grEvents.push(id)});const root=document.querySelector('#demo [data-motion-surface]').shadowRoot;window.__grContexts=[root.querySelector('canvas').getContext('webgl2')];});
 await expect(scene).toHaveAttribute('data-active','command');await expect(scene).toHaveAttribute('data-phase','0.00000');await page.waitForTimeout(150);const still=await canvas.screenshot({path:path.join(out,'front.png')});await page.waitForTimeout(350);
 const first=await sharp(still).removeAlpha().raw().toBuffer(),second=await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();let changed=0;for(let i=0;i<first.length;i+=3)if(Math.max(Math.abs(first[i]-second[i]),Math.abs(first[i+1]-second[i+1]),Math.abs(first[i+2]-second[i+2]))>12)changed++;assert(changed/(first.length/3)<.01,'paused graphics stay fixed apart from subpixel GPU antialiasing');
 await canvas.focus();await canvas.press('ArrowRight');await expect(scene).toHaveAttribute('data-active','rerank');await page.waitForTimeout(850);assert.deepEqual(await page.evaluate(()=>window.__grEvents),['rerank']);
 await canvas.press('End');await expect(scene).toHaveAttribute('data-active','embedded');await canvas.press('Home');await expect(scene).toHaveAttribute('data-active','command');
 await canvas.press(' ');await expect(scene).toHaveAttribute('data-paused','false');await canvas.press(' ');await expect(scene).toHaveAttribute('data-paused','true');
 await page.waitForTimeout(850);const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.45,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5,{steps:12});await page.mouse.up();await expect(scene).toHaveAttribute('data-active','rerank');
 for(const key of ['ArrowRight','ArrowRight','ArrowLeft','Home','End'])await canvas.press(key);await expect(scene).toHaveAttribute('data-active','embedded');await page.waitForTimeout(850);
 await page.emulateMedia({reducedMotion:'reduce'});await canvas.press('Home');await expect(scene).toHaveAttribute('data-active','command');const frozen=await scene.getAttribute('data-phase');await page.waitForTimeout(150);assert.equal(await scene.getAttribute('data-phase'),frozen);
 const events=await page.evaluate(()=>window.__grEvents.length);await page.evaluate(()=>window.__update({active:2,autoRotate:false,distortion:.5,speed:2}));await expect(scene).toHaveAttribute('data-active','northwalk');assert.equal(await page.evaluate(()=>window.__grEvents.length),events,'controlled updates do not emit user selections');
 await root.getByRole('button',{name:'Previous card',exact:true}).press(' ');await expect(scene).toHaveAttribute('data-active','rerank');await root.getByRole('button',{name:'Next card',exact:true}).press(' ');await expect(scene).toHaveAttribute('data-active','northwalk');
 await page.emulateMedia({reducedMotion:'no-preference'});
}
