import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

export async function verifyFoldedEmojiScroll(page){
 const scene=page.locator('#demo .fe-scene'),port=page.locator('#demo .fe-scroll'),input=page.locator('#demo .fe-search');
 await expect(scene).toHaveAttribute('data-ready','true');assert((await page.locator('#demo .fe-emoji').count())>500);
 await expect(scene).toHaveAttribute('data-top-fold','0.00');await expect(scene).toHaveAttribute('data-bottom-fold','42.00');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const headerOffset=()=>input.evaluate(node=>{const panel=node.closest('.fe-panel'),p=panel.getBoundingClientRect(),r=node.getBoundingClientRect();return (r.top-p.top)/(p.width/panel.offsetWidth);});
 const header=await headerOffset();await port.hover();await page.mouse.wheel(0,500);await expect.poll(()=>port.evaluate(node=>node.scrollTop)).toBeGreaterThan(100);
 await expect(scene).toHaveAttribute('data-top-fold','42.00');assert(Math.abs((await headerOffset())-header)<.05,'search header stays pinned relative to the picker during real wheel input');
 await port.evaluate(node=>node.scrollTop=540);await expect(scene).toHaveAttribute('data-scroll','540.0');
 await expect(scene).toHaveAttribute('data-pixels-ready','true');
 await page.evaluate(()=>{const canvas=document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.fe-output'),copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);window.__foldPixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;});
 const cornerArtifacts=await page.evaluate(()=>{
  const canvas=document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.fe-output'),pixels=window.__foldPixels,ratio=canvas.width/590;
  let changed=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
   if((x<24*ratio||x>=canvas.width-24*ratio)&&(y<42*ratio||y>=canvas.height-42*ratio)){
    const i=(y*canvas.width+x)*4;if(pixels[i]!==34||pixels[i+1]!==34||pixels[i+2]!==34||pixels[i+3]!==255)changed++;
   }
  }return changed;
 });
 assert.equal(cornerArtifacts,0,'all four folded gutters retain the flat panel background without dark diagonal wedges');
 await page.evaluate(()=>window.__update({foldSize:0}));await expect(scene).toHaveAttribute('data-top-fold','0.00');
 const difference=await page.evaluate(()=>{
  const canvas=document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.fe-output'),copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);const now=ctx.getImageData(0,0,canvas.width,canvas.height).data,old=window.__foldPixels,dpr=canvas.width/590;
  let edge=0,center=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(now[i]!==old[i]||now[i+1]!==old[i+1]||now[i+2]!==old[i+2]){if(y<45*dpr||y>canvas.height-45*dpr)edge++;else center++;}}
  return {edge,center};
 });
 assert(difference.edge>200,'folded edges contain genuinely resampled emoji pixels');assert.equal(difference.center,0,'the center texture is unchanged by fold strength');
 await page.evaluate(()=>window.__update({foldSize:42}));await expect(scene).toHaveAttribute('data-top-fold','42.00');
 const edgeBox=await port.boundingBox();await page.mouse.click(edgeBox.x+edgeBox.width*54/590,edgeBox.y+edgeBox.height*2/702);
 await expect(scene).toHaveAttribute('data-value','😛','top-fold hit testing selects the preceding folded row, not the flat row underneath');
 await input.fill('cat');await expect.poll(()=>page.locator('#demo .fe-emoji').count()).toBeLessThan(40);assert((await page.locator('#demo .fe-emoji').count())>5);
 await input.fill('zz-no-emoji-492');await expect(page.locator('#demo .fe-empty')).toHaveText('No emoji found');await expect(page.locator('#demo .fe-emoji')).toHaveCount(0);
 await input.press('Escape');assert((await page.locator('#demo .fe-emoji').count())>500);
 await page.evaluate(()=>{window.__emojiSelections=[];window.__update({query:'heart',onSelect:emoji=>window.__emojiSelections.push(emoji)});});
 await expect(input).toHaveValue('heart');await page.locator('#demo .fe-emoji').first().click();await expect.poll(()=>page.evaluate(()=>window.__emojiSelections.length)).toBe(1);
 await page.evaluate(()=>window.__update({query:'',value:'😀'}));await expect(input).toHaveValue('');await expect(scene).toHaveAttribute('data-value','😀');
 assert.equal(await page.evaluate(()=>window.__emojiSelections.length),1,'external value update does not call onSelect');
 await input.press('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await expect(scene).toHaveAttribute('data-value','👌');
 await page.keyboard.press('End');await expect.poll(()=>port.evaluate(node=>node.scrollTop)).toBeGreaterThan(3000);
 await expect(scene).toHaveAttribute('data-bottom-fold','0.00');
 await page.keyboard.press('Home');await expect.poll(()=>port.evaluate(node=>node.scrollTop)).toBe(0);
 await page.evaluate(()=>window.__update({reducedMotion:true}));await port.evaluate(node=>node.scrollTop=300);
 await expect(scene).toHaveAttribute('data-scroll','300.0');await expect(scene).toHaveAttribute('data-top-fold','0.00');await expect(scene).toHaveAttribute('data-bottom-fold','0.00');
 await page.evaluate(()=>window.__update({reducedMotion:false,query:'😀'}));await expect(input).toHaveValue('😀');
 const emoji=page.locator('#demo .fe-emoji').first();await emoji.scrollIntoViewIfNeeded();const box=await emoji.boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await expect(scene).toHaveAttribute('data-value','😀');
 await page.evaluate(()=>window.__update({query:'',value:''}));await expect(input).toHaveValue('');await port.evaluate(node=>node.scrollTop=0);
 await page.mouse.move(1100,900);await page.waitForTimeout(100);
 await expect(scene).toHaveAttribute('data-raster-pending','false');
 const captures=await scene.getAttribute('data-capture-count');
 const glyphs=await scene.getAttribute('data-raster-count');
 const visibleBox=await port.boundingBox();
 for(let i=0;i<10;i++)await page.mouse.move(visibleBox.x+visibleBox.width*(.1+i*.08),visibleBox.y+visibleBox.height*.45);
 await page.waitForTimeout(100);
 assert.equal(await scene.getAttribute('data-raster-count'),glyphs,'pointer hover reuses existing emoji pixels');
 await port.hover();
 for(let i=0;i<12;i++){await page.mouse.wheel(0,i<8?260:-260);await page.waitForTimeout(20);}
 await expect.poll(()=>port.evaluate(node=>node.scrollTop)).toBeGreaterThan(100);
 await expect(scene).toHaveAttribute('data-pixels-ready','true');
 assert.equal(await scene.getAttribute('data-capture-count'),captures,'continuous wheel input under a stationary pointer never rebuilds the grid texture');
 await expect(scene).toHaveAttribute('data-raster-pending','false');
 const raster=await scene.getAttribute('data-raster-count');
 await port.evaluate(node=>node.scrollTop=0);await expect(scene).toHaveAttribute('data-scroll','0.0');
 await port.evaluate(node=>node.scrollTop=1000);await expect(scene).toHaveAttribute('data-scroll','1000.0');
 assert.equal(await scene.getAttribute('data-raster-count'),raster,'returning to cached rows does not rasterize their emoji again');
 await page.mouse.move(1100,900);await page.waitForTimeout(180);const draw=await scene.getAttribute('data-draw-count');await page.waitForTimeout(180);assert.equal(await scene.getAttribute('data-draw-count'),draw,'idle picker does not draw in a continuous RAF loop');
}
