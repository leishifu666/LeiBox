import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

export async function verifySelectionFlower(page,item,ROOT,OUT){
 const scene=page.locator('#demo .sf-scene'),paragraphs=page.locator('#demo .sf-article p'),canvas=page.locator('#demo .sf-canvas');
 await scene.waitFor();assert.equal(await paragraphs.count(),4);
 const point=async(block,index)=>block.evaluate((p,i)=>{const walk=document.createTreeWalker(p,4);let node;while((node=walk.nextNode())){if(i<node.length){const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();return{x:r.x+1,y:r.y+r.height/2};}i-=node.length;}throw new Error('Character offset outside paragraph');},index);
 const drag=async(block,from,to)=>{const a=await point(block,from),b=await point(block,to);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:24});};
 const pixels=()=>canvas.evaluate(n=>n.toDataURL());
 const selection=()=>scene.evaluate(n=>n.getRootNode().getSelection().toString());
 const idle=()=>page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.sf-scene').dataset.state==='idle');
 await page.mouse.move(20,20);const blank=await pixels();await page.mouse.move(600,250);assert.equal(await pixels(),blank,'cursor movement alone does not plant flowers');
 // Compare rendered pixels: a flower must never paint over the native selection.
 await page.evaluate(()=>window.__update({reducedMotion:true}));
 await drag(paragraphs.nth(1),5,52);
 assert(Number(await scene.getAttribute('data-plants'))>0);
 const region=await scene.evaluate(n=>{const r=n.getRootNode().getSelection().getRangeAt(0).getClientRects()[0],b=n.getBoundingClientRect();return{left:Math.ceil(r.left-b.left)+2,top:Math.ceil(r.top-b.top)+2,width:Math.floor(r.width)-4,height:Math.floor(r.height)-4};});
 const shown=await scene.screenshot();
 // Keep the Canvas compositing layer alive. Hiding the element changes Chrome's
 // LCD text antialiasing and produces differences unrelated to occlusion.
 await canvas.evaluate((n,r)=>{const context=n.getContext('2d');n.__layerSnapshot=context.getImageData(0,0,n.width,n.height);context.clearRect(r.left-2,r.top-2,r.width+4,r.height+4);},region);
 const hidden=await scene.screenshot();await canvas.evaluate(n=>{n.getContext('2d').putImageData(n.__layerSnapshot,0,0);delete n.__layerSnapshot;});
 const visiblePixels=await sharp(shown).extract(region).ensureAlpha().raw().toBuffer(),clearPixels=await sharp(hidden).extract(region).ensureAlpha().raw().toBuffer();
 let overwritten=0;for(let i=0;i<visiblePixels.length;i+=4)if(Math.max(Math.abs(visiblePixels[i]-clearPixels[i]),Math.abs(visiblePixels[i+1]-clearPixels[i+1]),Math.abs(visiblePixels[i+2]-clearPixels[i+2]))>3)overwritten++;
 const layerOut=path.join(OUT,'selection-flower-layers');await fs.mkdir(layerOut,{recursive:true});
 await fs.writeFile(path.join(layerOut,item.framework+'.json'),JSON.stringify({selectionPixelsChangedByFlowers:overwritten,selectionPixels:region.width*region.height},null,2));
 await sharp(shown).extract(region).toFile(path.join(layerOut,item.framework+'-selection.png'));
 await sharp(hidden).extract(region).toFile(path.join(layerOut,item.framework+'-selection-clear.png'));
 assert.equal(overwritten,0,'flowers stay behind every green selection pixel and white glyph');
 const image=await sharp(shown).ensureAlpha().raw().toBuffer();let flowerPixels=0;
 for(let i=0;i<image.length;i+=4){const [r,g,b]=[image[i],image[i+1],image[i+2]];if(Math.max(r,g,b)-Math.min(r,g,b)>60&&(r>g*1.15||b>g*1.1||(r>180&&g>130&&b<140)))flowerPixels++;}
 assert(flowerPixels>100,'coloured petals remain visibly rendered outside the selection');
 await page.mouse.up();await idle();await page.evaluate(()=>window.__update({reducedMotion:undefined}));
 await drag(paragraphs.first(),22,54);
 await page.waitForFunction(()=>Number(document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.sf-scene').dataset.plants)>0);
 assert((await selection()).length>20,'real drag creates a real text selection');
 const first=await pixels();await page.waitForTimeout(160);assert.notEqual(await pixels(),first,'flower pixels change over time');
 await page.waitForTimeout(250);assert.equal(await scene.getAttribute('data-state'),'growing');
 if(item.framework==='react')await page.locator('[data-motion-surface]').screenshot({path:path.join(OUT,'selection-flower-bloom.png')});
 const count=Number(await scene.getAttribute('data-plants'));await page.mouse.up();
 await page.waitForTimeout(70);assert.equal(await scene.getAttribute('data-state'),'retracting');assert.equal(Number(await scene.getAttribute('data-plants')),count,'release retains plants while their geometry retracts');
 const closing=await pixels();await page.waitForTimeout(100);assert.notEqual(await pixels(),closing,'reverse growth changes geometry');await idle();assert.equal(await pixels(),blank,'reverse growth leaves a clean transparent canvas');assert((await selection()).length>20,'release preserves the native green selection');
 await drag(paragraphs.nth(1),116,14);assert((await selection()).length>90,'reverse multiline selection works');await page.waitForTimeout(200);
 const end=await point(paragraphs.nth(1),60);await page.mouse.move(end.x,end.y,{steps:12});assert((await selection()).length<80,'shrinking the live selection works');
 await page.mouse.move(10,10);await page.mouse.up();await idle();
 await drag(paragraphs.nth(2),3,38);await page.mouse.up();await drag(paragraphs.first(),10,44);await page.mouse.up();await idle();
 await paragraphs.nth(2).focus();await paragraphs.nth(2).press('Enter');assert.equal(await scene.getAttribute('data-state'),'growing');
 const keyboardText=await selection();await paragraphs.nth(2).press('Shift+ArrowRight');assert.equal((await selection()).length,keyboardText.length+1);
 await paragraphs.nth(2).press('Escape');await idle();assert.equal(await selection(),'');
 await page.evaluate(()=>window.__update({reducedMotion:true}));await paragraphs.first().press('Enter');
 assert(Number(await scene.getAttribute('data-plants'))>0,'reduced motion still renders final flowers');
 const still=await pixels();await page.waitForTimeout(100);assert.equal(await pixels(),still,'reduced motion has no animation loop');
 await paragraphs.first().press('Escape');assert.equal(await scene.getAttribute('data-plants'),'0');
 await page.evaluate(()=>window.__update({reducedMotion:undefined}));
 await page.emulateMedia({reducedMotion:'reduce'});await drag(paragraphs.nth(1),3,35);await page.mouse.up();await idle();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await paragraphs.first().focus();await paragraphs.first().press('Escape');
 await paragraphs.nth(2).tap();assert.equal(await scene.getAttribute('data-state'),'growing');assert((await selection()).length>5,'real touch tap selects a phrase');await page.waitForTimeout(1800);await idle();
 await paragraphs.first().focus();await paragraphs.first().press('Escape');
 if(item.framework==='react'){
  await page.setViewportSize({width:822,height:720});
  await scene.evaluate(n=>{n.blur();n.getRootNode().activeElement?.blur();const style=document.createElement('style');style.textContent='.sf-scene{background:#f4f4f4!important}';n.getRootNode().append(style);});
  await page.mouse.move(1,1);await page.locator('[data-motion-surface]').screenshot({path:path.join(ROOT,'public/assets/components/selection-flower.png')});
  await page.setViewportSize({width:1200,height:1000});
 }
 console.log(`PASS selection-flower ${item.framework}: pixel-verified layering, real selection, reverse geometry, interruption, keyboard and reduced motion`);
}
