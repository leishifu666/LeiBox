import assert from 'node:assert/strict';
import { expect } from 'playwright/test';

export async function verifyStackedMetadata(page, item, root, out) {
  const scene=page.locator('#demo .sm-scene'),rows=page.locator('#demo .sm-row');
  const positions=()=>rows.first().evaluate(row=>[...row.querySelectorAll('.sm-tag')].map(n=>({x:n.getBoundingClientRect().x,right:n.getBoundingClientRect().right})));
  await expect(scene).toHaveAttribute('data-ready','true');await page.mouse.move(1,1);await expect(scene).toHaveAttribute('data-running','false');
  await expect(rows).toHaveCount(3);await expect(scene).toHaveAttribute('data-active','-1');
  await page.evaluate(()=>{window.__tagNodes=[...document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelectorAll('.sm-tag')];window.__changes=[];window.__update({onExpandChange:i=>window.__changes.push(i)});});
  const rest=await positions(),titleWidth=await rows.first().locator('.sm-title').evaluate(n=>n.getBoundingClientRect().width);
  await rows.first().hover();await expect(rows.first()).toHaveAttribute('aria-expanded','true');await page.waitForTimeout(340);
  const peak=await positions();assert(peak[0].x<rest[0].x-111.5,'opening passes the destination before returning');assert(Math.abs(peak[2].right-rest[2].right)<.1,'overshoot never moves the rightmost tag');
  await expect(scene).toHaveAttribute('data-running','false');
  const full=await positions();assert(Math.abs(full[0].x-rest[0].x+110)<1,'first tag expands 110px left');assert(Math.abs(full[1].x-rest[1].x+55)<1,'date expands 55px left');assert(Math.abs(full[2].right-rest[2].right)<.1,'assignee stays anchored');
  assert((await rows.first().locator('.sm-title').evaluate(n=>n.getBoundingClientRect().width))<titleWidth-100,'title actually clips as the tags spread');
  for(let i=0;i<3;i++)await rows.first().locator('.sm-tag').nth(i).hover();await expect(scene).toHaveAttribute('data-active','0');
  await rows.nth(1).hover();await expect(rows.first()).toHaveAttribute('aria-expanded','false');await expect(rows.nth(1)).toHaveAttribute('aria-expanded','true');
  await rows.nth(2).hover();await rows.first().hover();await page.mouse.move(1,1);await expect(scene).toHaveAttribute('data-running','false');
  assert(await page.evaluate(()=>window.__tagNodes.every((n,i)=>n===document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelectorAll('.sm-tag')[i])),'interrupted transitions retain original nodes');
  await expect(scene).toHaveAttribute('data-active','-1');
  await rows.first().focus();await expect(scene).toHaveAttribute('data-active','0');await rows.first().press('ArrowDown');await expect(rows.nth(1)).toBeFocused();await rows.nth(1).press('End');await expect(scene).toHaveAttribute('data-active','2');await rows.nth(2).press('Home');await expect(scene).toHaveAttribute('data-active','0');await rows.first().press('Escape');await expect(scene).toHaveAttribute('data-active','-1');
  const notified=await page.evaluate(()=>window.__changes.length);await page.evaluate(()=>window.__update({expanded:2,theme:'light'}));await expect(scene).toHaveAttribute('data-active','2');assert.equal(await page.evaluate(()=>window.__changes.length),notified,'external state updates do not emit user callbacks');
  await expect(scene).toHaveCSS('background-color','rgb(244, 244, 244)');
  await page.evaluate(()=>window.__update({expanded:-1,reducedMotion:true}));await rows.nth(1).hover();await expect(rows.nth(1)).toHaveAttribute('aria-expanded','true');assert.equal(await rows.nth(1).locator('.sm-tag').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  await page.mouse.move(1,1);await page.evaluate(()=>window.__update({reducedMotion:false,theme:'dark',expanded:-1}));
  await expect(scene).toHaveAttribute('data-theme','dark');await expect(scene).toHaveAttribute('data-reduced','false');
  const frames=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__motionFrames),frames,'resting component has no permanent animation loop');
  await page.setViewportSize({width:375,height:900});await page.evaluate(()=>document.activeElement?.blur());await rows.first().tap();await expect(scene).toHaveAttribute('data-active','0');await rows.first().tap();await expect(scene).toHaveAttribute('data-active','-1');await rows.nth(1).tap();await expect(scene).toHaveAttribute('data-active','1');
  await page.evaluate(()=>window.__update({items:[{title:'<img src=x onerror=alert(1)>',priority:'High',date:'Jun 8',assignee:'安全文字'}],heading:'Custom tasks',expanded:0}));await expect(rows).toHaveCount(1);await expect(rows.first().locator('.sm-title')).toHaveText('<img src=x onerror=alert(1)>');assert.equal(await scene.locator('img').count(),0);
  await page.evaluate(()=>window.__update({items:[],heading:'In Progress',expanded:-1}));await expect(rows).toHaveCount(3);
  if(item.framework==='react')await page.screenshot({path:out+'/stacked-metadata-touch.png'});
  await page.setViewportSize({width:1200,height:1000});await page.mouse.move(1,1);
  await page.evaluate(()=>window.__update({expanded:0}));await expect(scene).toHaveAttribute('data-running','true');
  await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.transform='translateY(2000px)');await expect(scene).toHaveAttribute('data-running','false');
  const stopped=await rows.first().evaluate(n=>n.style.getPropertyValue('--sm-phase'));await page.waitForTimeout(150);assert.equal(await rows.first().evaluate(n=>n.style.getPropertyValue('--sm-phase')),stopped,'offscreen pauses the actual spring');
  await page.locator('#demo [data-motion-surface]').evaluate(n=>n.style.transform='');await expect(scene).toHaveAttribute('data-running','true');await expect(scene).toHaveAttribute('data-running','false');
  await page.evaluate(()=>window.__update({expanded:-1,reducedMotion:true}));
}
