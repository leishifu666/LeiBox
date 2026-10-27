import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

async function beginColorStabilityProbe(page){
 await expect(page.locator('#demo .nc-palette')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
 await page.evaluate(()=>{
  const root=document.querySelector('#demo [data-motion-surface]').shadowRoot,p=root.querySelectorAll('.nc-article p')[3],overlay=root.querySelector('.nc-overlay'),palette=root.querySelector('.nc-palette');
  const probe={frames:[],removed:0,handles:[...overlay.querySelectorAll('button')],running:true};
  probe.observer=new MutationObserver(changes=>{for(const change of changes)probe.removed+=change.removedNodes.length;});probe.observer.observe(overlay,{childList:true});probe.observer.observe(root.querySelector('.nc-history'),{childList:true});
  const read=()=>{
   const points=[],offsets=[0,24,35,65,95,120],walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node,total=0;
   while((node=walk.nextNode())){for(let i=0;i<node.length;i++){if(offsets.includes(total)){const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();points.push([r.x,r.y,r.width,r.height]);}total++;}}
   const r=p.nextElementSibling.getBoundingClientRect(),panel=palette.getBoundingClientRect();
   return {geometry:[...points.flat(),r.x,r.y,r.width,r.height,panel.x,panel.y,panel.width,panel.height],spacing:[...p.children].map(n=>getComputedStyle(n).letterSpacing),shadow:[...p.children].map(n=>getComputedStyle(n).textShadow)};
  };
  probe.frames.push(read());const sample=()=>{probe.frames.push(read());if(probe.running)requestAnimationFrame(sample);};requestAnimationFrame(sample);window.__notesColorProbe=probe;
 });
}
async function finishColorStabilityProbe(page){
 await page.waitForTimeout(300);
 const result=await page.evaluate(()=>{const probe=window.__notesColorProbe;probe.running=false;probe.observer.disconnect();return {frames:probe.frames,removed:probe.removed,handlesPreserved:probe.handles.every(n=>n.isConnected)};});
 const baseline=result.frames[0].geometry;
 assert.equal(result.removed,0,'recoloring preserves the highlight and handle nodes instead of flashing replacements');
 assert(result.handlesPreserved,'selection handles retain their DOM identity');
 for(const frame of result.frames){
  frame.geometry.forEach((value,index)=>assert(Math.abs(value-baseline[index])<.3,`recoloring must not move text, following paragraphs, or palette (coordinate ${index}: ${value-baseline[index]}px; before ${JSON.stringify(baseline)}, current ${JSON.stringify(frame.geometry)})`));
  assert(frame.spacing.every(value=>value==='-0.1px'),'font spacing stays constant during the entire color transition');
  assert(frame.shadow.every(value=>value==='none'),'text does not flash a glow while recoloring');
 }
}

export async function verifyNotesTextColor(page,item,project,out){
 await page.emulateMedia({reducedMotion:'no-preference'});
 const scene=page.locator('#demo .nc-scene'),p=page.locator('#demo .nc-article p'),palette=page.locator('#demo .nc-palette');
 const swatch=name=>page.locator(`#demo .nc-swatch[data-color="${name}"]`);
 const point=async(index,offset,end=false)=>p.nth(index).evaluate((element,{offset,end})=>{
  const walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node,total=0;
  while((node=walk.nextNode())){if(offset<total+node.length){const r=document.createRange();r.setStart(node,offset-total);r.setEnd(node,Math.min(node.length,offset-total+1));const rect=r.getBoundingClientRect();return {x:end?rect.right-.2:rect.left+.2,y:rect.top+rect.height/2};}total+=node.length;}
 },{offset,end});
 const select=async(index,text)=>{
  const full=await p.nth(index).textContent(),start=full.indexOf(text);assert(start>=0);
  const a=await point(index,start),b=await point(index,start+text.length-1,true);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:14});await page.mouse.up();
  await expect(scene).toHaveAttribute('data-open','true');
  await page.waitForTimeout(220);
 };
 await expect(scene).toHaveAttribute('data-ready','true');assert.equal(await p.count(),7);
 await select(3,'nobody reads the case study');
 assert((await scene.getAttribute('data-selection')).includes('nobody reads the case study'));
 assert(await page.locator('#demo .nc-highlight').count()>=2,'selection follows multiple real text lines');
 assert.equal(await page.locator('#demo .nc-selection-handle').count(),2);
 await expect(palette).toBeVisible();assert.equal(await page.locator('#demo .nc-swatch').count(),9);
 const selected=await scene.getAttribute('data-selection');
 await beginColorStabilityProbe(page);
 await swatch('cyan').click();await expect(scene).toHaveAttribute('data-color','#80e9e6');
 await finishColorStabilityProbe(page);
 await expect(swatch('cyan')).toHaveAttribute('aria-checked','true');assert.equal(await scene.getAttribute('data-selection'),selected);
 const actual=await p.nth(3).locator('[data-colored]').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,color:getComputedStyle(n).color})));
 assert(actual.some(n=>n.text.includes('nobody')&&n.color==='rgb(128, 233, 230)'),'the actual selected glyphs change color');
 if(item.framework==='react'){
  await page.setViewportSize({width:900,height:1080});await page.waitForTimeout(250);
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(out,'notes-text-color-cyan.png')});
  await page.setViewportSize({width:1200,height:1080});
 }
 await beginColorStabilityProbe(page);
 await swatch('pink').click();await expect(scene).toHaveAttribute('data-color','#e68dd4');
 await finishColorStabilityProbe(page);
 await page.locator('#demo .nc-done').click();await expect(scene).toHaveAttribute('data-open','false');
 assert((await p.nth(3).locator('[data-colored]').allTextContents()).join('').includes('nobody'),'closing preserves applied text');
 await p.nth(3).focus();await p.nth(3).press('Enter');await expect(palette).toBeVisible();
 const full=await p.nth(3).textContent();assert.equal(await scene.getAttribute('data-selection'),full);
 await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');
 await expect(scene).toHaveAttribute('data-color','#77f172');
 await page.keyboard.press('Escape');await expect(scene).toHaveAttribute('data-open','false');await expect(p.nth(3)).toBeFocused();
 await p.nth(3).press('Enter');
 const recent=page.locator('#demo .nc-recent');assert.equal(await recent.count(),4);
 const previous=await recent.nth(1).textContent();await recent.nth(1).click();
 assert.equal(await scene.getAttribute('data-selection'),previous,'history restores the prior range');
 await swatch('custom').click();await expect(page.locator('#demo .nc-custom')).toBeVisible();
 await page.locator('#demo .nc-custom input').fill('30');await expect(scene).toHaveAttribute('data-color','hsl(30 76% 72%)');
 await swatch('custom').click();await expect(page.locator('#demo .nc-custom')).toBeHidden();
 await page.locator('#demo .nc-back').click();await expect(scene).toHaveAttribute('data-open','false');
 await expect(p.nth(3).locator('span[style]')).toHaveCount(0);assert.equal(await recent.first().textContent(),'Frame 2847');
 // A single colored word opens the same range on touch, without requiring desktop selection gestures.
 const colored=p.nth(2).locator('span[data-colored]');await colored.tap();await expect(scene).toHaveAttribute('data-selection','Frame 2847');
 await swatch('yellow').tap();await expect(scene).toHaveAttribute('data-color','#e6cf67');
 await page.evaluate(()=>window.__update({reducedMotion:true}));await swatch('cyan').click();
 await expect(scene).toHaveAttribute('data-color','#80e9e6');await expect(swatch('cyan')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
 await page.locator('#demo .nc-done').click();await page.evaluate(()=>window.__update({reducedMotion:false}));
 await p.nth(3).focus();await p.nth(3).press('Control+a');await expect(scene).toHaveAttribute('data-selection',full);
 const end=page.locator('#demo .nc-selection-handle[data-edge=end]'),box=await end.boundingBox();
 const dest=await point(3,80,true);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(dest.x,dest.y,{steps:8});await page.mouse.up();
 assert((await scene.getAttribute('data-selection')).length<full.length,'dragging the real selection handle changes the character boundary');
 await page.locator('#demo .nc-done').click();
 const crossStart=await point(3,90),crossEnd=await point(4,18,true);
 await page.mouse.move(crossStart.x,crossStart.y);await page.mouse.down();await page.mouse.move(crossEnd.x,crossEnd.y,{steps:12});await page.mouse.up();await page.waitForTimeout(220);
 await expect(scene).toHaveAttribute('data-open','true');await swatch('purple').click();
 await expect(p.nth(3)).toHaveAttribute('data-active','true');await expect(p.nth(4)).toHaveAttribute('data-active','true');
 assert(await p.nth(4).locator('span[style]').count()>0,'selection formatting crosses real paragraph boundaries');
 await page.locator('#demo .nc-back').click();
 if(item.framework==='react'){
  await page.setViewportSize({width:900,height:1080});
  await page.evaluate(()=>{const style=document.createElement('style');style.textContent='.nc-scene{background:#f4f4f4!important}';document.querySelector('#demo [data-motion-surface]').shadowRoot.append(style);});
  await page.waitForTimeout(250);await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(project,'public/assets/components/notes-text-color.png')});
  await page.setViewportSize({width:1200,height:1000});
 }
 // Changing an option and opening another instance cannot reuse its colors or history.
 await page.evaluate(()=>window.__mount('notes-other'));await page.locator('#notes-other .nc-scene').waitFor();
 await page.locator('#notes-other .nc-article p').nth(3).press('Enter');await page.locator('#notes-other .nc-swatch[data-color=blue]').click();
 await expect(scene).toHaveAttribute('data-open','false');assert.equal(await p.nth(3).locator('span[style]').count(),0);
 await page.evaluate(()=>window.__unmount('notes-other'));
}
