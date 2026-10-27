import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

export async function verifyFluidTooltip(page,item,rootDir,outDir){
 const root=page.locator('#demo'),scene=root.locator('.ft-scene'),tip=root.locator('.ft-tooltip');
 const button=id=>root.locator(`.ft-trigger[data-item="${id}"]`),out=path.join(outDir,'fluid-tooltip',item.framework);await fs.mkdir(out,{recursive:true});
 await expect(scene).toHaveAttribute('data-ready','true');await expect(scene).toHaveAttribute('data-active','today');await expect(tip).toHaveAttribute('aria-hidden','true');
 const logo='data:image/svg+xml;base64,'+(await fs.readFile(path.join(rootDir,'public/leibox-mark.svg'))).toString('base64');assert.equal(await root.locator('.ft-logo').getAttribute('src'),logo);
 assert(!(await scene.innerText()).includes('Anthony'));assert.equal(await root.locator('.ft-trigger').count(),6);
 await page.evaluate(()=>{
  const root=document.querySelector('#demo [data-motion-surface]').shadowRoot;window.__ftOriginal=root.querySelector('.ft-tooltip');window.__ftChanges=[];window.__update({onSelect:id=>window.__ftChanges.push(id)});
  window.__ftSamples=[];const sample=()=>{const root=document.querySelector('#demo [data-motion-surface]')?.shadowRoot;if(!root)return;const tip=root.querySelector('.ft-tooltip'),r=tip.getBoundingClientRect(),labels=[...root.querySelectorAll('.ft-label-row .ft-label')].map(n=>n.getBoundingClientRect());window.__ftSamples.push({y:r.y,width:r.width,opacity:Number(tip.style.opacity),tops:labels.map(n=>n.y),visible:labels.filter(n=>n.bottom>r.top+1&&n.top<r.bottom-1).length});window.__ftSampleFrame=requestAnimationFrame(sample);};sample();
 });
 const settle=()=>page.waitForFunction(()=>{const root=document.querySelector('#demo [data-motion-surface]').shadowRoot,tip=root.querySelector('.ft-tooltip'),name=root.querySelector('.ft-scene').dataset.hint,button=root.querySelector(`.ft-trigger[data-item="${name}"]`);if(!button)return false;const a=tip.getBoundingClientRect(),b=button.getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2)<.2&&Number(tip.style.opacity)>.999;});
 await button('profile').hover();await settle();await expect(tip).toHaveAttribute('aria-label','LeiBox');const profileWidth=await tip.evaluate(n=>n.offsetWidth);
 await button('settings').hover();await settle();const settingsWidth=await tip.evaluate(n=>n.offsetWidth);assert(settingsWidth>profileWidth+70);
 await expect(button('today')).toHaveAttribute('aria-current','page');assert.deepEqual(await page.evaluate(()=>window.__ftChanges),[],'hover does not select or invoke navigation');
 for(const id of ['calendar','focus','today','settings','tasks'])await button(id).hover();await settle();await expect(scene).toHaveAttribute('data-hint','tasks');
 await page.mouse.move(1100,50);await expect(tip).toHaveAttribute('aria-hidden','true');await page.waitForFunction(()=>Number(document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.ft-tooltip').style.opacity)===0);
 await button('today').focus();await button('today').press('ArrowDown');await expect(button('tasks')).toBeFocused();await button('tasks').press('Enter');await expect(scene).toHaveAttribute('data-active','tasks');
 await button('tasks').press('Enter');assert.deepEqual(await page.evaluate(()=>window.__ftChanges),['tasks'],'selection calls back once for a changed id');
 await button('tasks').press('Escape');await expect(tip).toHaveAttribute('aria-hidden','true');await expect(button('tasks')).toBeFocused();
 await button('tasks').press('End');await expect(button('profile')).toBeFocused();await settle();
 await button('profile').press('Control+5');await expect(scene).toHaveAttribute('data-active','settings');await expect(button('settings')).toBeFocused();
 const focus=await button('settings').evaluate(n=>({style:getComputedStyle(n).outlineStyle,width:getComputedStyle(n).outlineWidth}));assert.equal(focus.style,'solid');assert.equal(focus.width,'3px');
 await page.mouse.click(1100,50);await expect(tip).toHaveAttribute('aria-hidden','true');
 const calendar=await button('calendar').boundingBox();await page.touchscreen.tap(calendar.x+calendar.width/2,calendar.y+calendar.height/2);await expect(scene).toHaveAttribute('data-active','calendar');await expect(tip).toHaveAttribute('aria-hidden','false');
 await page.touchscreen.tap(1100,50);await expect(tip).toHaveAttribute('aria-hidden','true');
 const count=await page.evaluate(()=>window.__ftChanges.length);await page.evaluate(()=>window.__update({active:'focus',profileLabel:'雷师傅',logoSrc:'data:image/png;base64,bm90LWltYWdl'}));await expect(scene).toHaveAttribute('data-active','focus');
 await expect(root.locator('.ft-logo')).toHaveAttribute('src',logo);assert.equal(await page.evaluate(()=>window.__ftChanges.length),count,'controlled updates do not echo a selection callback');
 await button('profile').hover();await settle();await expect(tip).toHaveAttribute('aria-label','雷师傅');
 const custom='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11" fill="blue"/></svg>');
 await page.evaluate(src=>window.__update({logoSrc:src}),custom);await expect(root.locator('.ft-logo')).toHaveAttribute('src',custom);await root.locator('.ft-logo').evaluate(n=>n.decode());
 await page.evaluate(()=>window.__update({reducedMotion:true}));await button('today').hover();await settle();await button('profile').hover();await settle();
 assert(await page.evaluate(()=>window.__ftOriginal===document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.ft-tooltip')),'one capsule node persists through all interactions');
 const samples=await page.evaluate(()=>{cancelAnimationFrame(window.__ftSampleFrame);return window.__ftSamples;});
 assert(samples.some(s=>s.opacity>.9&&s.visible===2),'the moving mask actually crops two anchored labels during a transition');
 const baseline=samples[0].tops;assert(samples.every(s=>s.tops.every((y,i)=>Math.abs(y-baseline[i])<.05)),'label positions remain fixed while the capsule window moves');
 assert(samples.some(s=>s.width>profileWidth*1200/1288+10&&s.width<settingsWidth*1200/1288-5),'the real capsule width interpolates between items');
 await fs.writeFile(path.join(out,'motion.json'),JSON.stringify(samples));
 await page.evaluate(()=>window.__update({reducedMotion:false,active:'today',profileLabel:'LeiBox',logoSrc:''}));await expect(scene).toHaveAttribute('data-active','today');
 await page.mouse.move(1100,50);await expect(tip).toHaveAttribute('aria-hidden','true');
 await fs.writeFile(path.join(out,'behaviour.json'),JSON.stringify({framework:item.framework,logo:true,noOriginalAvatar:true,singleCapsule:true,anchoredLabels:true,twoLabelCrop:true,widthMorph:true,rapidHover:true,focus:true,keyboard:true,shortcut:true,touch:true,callback:true,controlledUpdate:true,customLogo:true,brokenLogoFallback:true,reducedMotion:true},null,2));
}
