import assert from 'node:assert/strict';
import {expect} from 'playwright/test';
import {INLINE_AGENT_ICONS} from '../src/data/inline-agent-icons.mjs';
import sharp from 'sharp';

export async function verifyInlineTextMorph(page){
 const scene=page.locator('#demo .itm-scene');
 await expect(scene).toHaveAttribute('data-ready','true');
 const group=key=>page.locator(`#demo .itm-token[data-group=${key}]`);
 const agent=group('agent'),language=group('language'),customize=group('customize');
 const checkIcon=async key=>{
  const current=agent.locator('.itm-icon-layer[data-current]');
  await expect(current.locator('title')).toHaveText({chatgpt:'Codex',claude:'Claude',cursor:'Cursor',grok:'Grok Bot'}[key]);
  assert.deepEqual(await current.locator('path').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d'))),[...INLINE_AGENT_ICONS[key].matchAll(/\bd="([^"]*)"/g)].map(match=>match[1]),'the mounted icon preserves the supplied SVG paths');
 };
 const checkThemeLayers=async()=>{
  const markup=await language.locator('[data-current] svg').evaluate(node=>{
   const clone=node.cloneNode(true);clone.setAttribute('width','64');clone.setAttribute('height','64');
   return new XMLSerializer().serializeToString(clone);
  });
  const {data,info}=await sharp(Buffer.from(markup)).resize(256,256).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>Array.from(data.subarray(((y*4+2)*info.width+x*4+2)*4,((y*4+2)*info.width+x*4+2)*4+3));
  assert.deepEqual(pixel(28,26),[32,32,32],'front theme card occludes the rear blue control');
  assert.deepEqual(pixel(18,26),[33,143,255],'the exposed part of the rear blue control remains visible');
 };
 const checkRulerPaint=async()=>{
  const paint=await customize.locator('[data-current] svg').evaluate(svg=>{
   const ruler=svg.querySelector('rect'),marks=svg.querySelector('path');
   const r=ruler.getBBox(),m=marks.getBBox();
   return {order:getComputedStyle(ruler).paintOrder,cap:getComputedStyle(marks).strokeLinecap,ticksInside:m.x>=r.x&&m.y>=r.y&&m.x+m.width<=r.x+r.width&&m.y+m.height<=r.y+r.height};
  });
  assert.equal(paint.order.split(' ')[0],'stroke','the white ruler outline is painted behind its yellow face');
  assert.equal(paint.cap,'round');assert(paint.ticksInside,'ruler marks remain on the coloured face');
 };
 assert.equal(await agent.getAttribute('data-value'),'ChatGPT');
 assert.equal(await language.getAttribute('data-value'),'languages');
 assert.equal(await customize.getAttribute('data-value'),'motion');
 assert.equal(await page.locator('#demo .itm-token').count(),3);
 await checkIcon('chatgpt');
 const letter=await agent.locator('[torph-item][torph-id="a"]').elementHandle();
 const width=await agent.evaluate(n=>n.getBoundingClientRect().width);
 await agent.click();await expect(agent).toHaveAttribute('data-value','Claude');
 await checkIcon('claude');
 assert(await letter.evaluate(n=>n.isConnected),'shared letter node survives the morph');
 assert(await letter.evaluate(n=>n===n.parentElement.querySelector('[torph-id="a"]')),'same character keeps its DOM identity');
 const animations=await agent.locator('.itm-label').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);
 assert(animations>0,'character positions actually animate');
 const before=await letter.evaluate(n=>getComputedStyle(n).transform);await page.waitForTimeout(70);
 assert.notEqual(await letter.evaluate(n=>getComputedStyle(n).transform),before,'letter transform changes with time');
 await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.itm-scene').dataset.moving==='false');
 assert((await agent.evaluate(n=>n.getBoundingClientRect().width))<width,'shorter phrase contracts its pill');
 assert.equal(await customize.getAttribute('data-value'),'motion','groups remain independent');
 for(const [value,key] of [['Cursor','cursor'],['Grok','grok'],['ChatGPT','chatgpt']]){await agent.click({force:true});await expect(agent).toHaveAttribute('data-value',value);await checkIcon(key);}
 for(const value of ['themes','systems','languages']){await language.click({force:true});await expect(language).toHaveAttribute('data-value',value);if(value==='themes')await checkThemeLayers();}
 for(const value of ['components','colors','type','spacing','icons','effects','states','motion']){await customize.click({force:true});await expect(customize).toHaveAttribute('data-value',value);if(value==='spacing')await checkRulerPaint();}
 await customize.focus();await customize.press('Home');await expect(customize).toHaveAttribute('data-value','components');
 for(let i=0;i<6;i++)await customize.press('ArrowRight');
 await expect(customize).toHaveAttribute('data-value','states');
 await customize.press('End');await expect(customize).toHaveAttribute('data-value','motion');
 await agent.focus();await agent.press('Enter');await expect(agent).toHaveAttribute('data-value','Claude');
 await agent.press('Space');await expect(agent).toHaveAttribute('data-value','Cursor');
 await agent.press('Home');await expect(agent).toHaveAttribute('data-value','ChatGPT');
 await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.itm-scene').dataset.moving==='false');
 const box=await agent.boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(agent).toHaveAttribute('data-value','Claude');await cdp.detach();
 await page.evaluate(()=>window.__update({reducedMotion:true}));
 await agent.click({force:true});await expect(agent).toHaveAttribute('data-value','Cursor');
 assert.equal(await agent.locator('[torph-item]').count(),0,'reduced motion uses direct text');
 assert.deepEqual(await scene.evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>({kind:a.constructor.name,target:a.effect.target?.className,pseudo:a.effect.pseudoElement,frames:a.effect.getKeyframes()}))),[],'reduced motion cancels ongoing animations');
 await page.evaluate(()=>window.__update({reducedMotion:false}));
 await expect.poll(()=>agent.locator('[torph-item]').count(),{message:'restoring motion recreates character rendering after the framework commits its update'}).toBeGreaterThan(0);
 await agent.press('Home');await language.press('Home');await customize.press('End');
 await page.waitForFunction(()=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.itm-scene').dataset.moving==='false');
 assert.equal(await scene.locator('.itm-icon-layer').count(),3,'old sticker layers are removed after rapid changes');
 assert.equal(await page.evaluate(()=>document.head.querySelectorAll('style[data-torph]').length),0,'Torph styles stay in the instance shadow root');
 assert.equal(await scene.locator('style[data-torph]').count(),1);
}
