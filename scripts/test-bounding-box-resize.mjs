import assert from 'node:assert/strict';
import path from 'node:path';
import { expect } from 'playwright/test';

export async function verifyBoundingBoxResize(page, item, root, out) {
  const stage=page.locator('#demo .bb-stage'),box=page.locator('#demo .bb-box');
  const handle=key=>page.locator(`#demo .bb-handle[data-handle="${key}"]`);
  const chip=axis=>page.locator(`#demo .bb-chip[data-axis="${axis}"]`);
  const input=axis=>chip(axis).locator('input');
  const dimensions=()=>stage.evaluate(n=>({width:+n.dataset.width,height:+n.dataset.height,x:+n.dataset.x,y:+n.dataset.y}));
  const reset=async()=>{await handle('se').press('Escape');await expect.poll(()=>box.evaluate(n=>parseFloat(n.style.width))).toBe(291);};
  const drag=async(key,dx,dy,release=true)=>{
    const rect=await handle(key).boundingBox(),scale=await page.locator('#demo .bb-workspace').evaluate(n=>n.getBoundingClientRect().width/624);
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx*scale,y+dy*scale,{steps:10});
    if(release)await page.mouse.up();
  };
  assert.deepEqual(await dimensions(),{width:291,height:200,x:119.5,y:23});
  assert.equal(await page.locator('#demo .bb-handle').count(),8);
  await handle('se').evaluate(n=>n.__originalPolygon=n.querySelector('.bb-glyph'));
  const initial=await handle('se').locator('.bb-glyph').getAttribute('points');
  await handle('se').hover();await page.waitForTimeout(50);
  const between=await handle('se').locator('.bb-glyph').getAttribute('points');
  await page.waitForTimeout(360);
  const arrow=await handle('se').locator('.bb-glyph').getAttribute('points');
  assert.notEqual(initial,between);assert.notEqual(between,arrow);
  assert(await handle('se').evaluate(n=>n.__originalPolygon===n.querySelector('.bb-glyph')),'hover morph preserves the polygon identity');

  await drag('se',93,61,false);await page.waitForTimeout(260);
  assert.deepEqual(await dimensions(),{width:384,height:261,x:119.5,y:23});
  await expect(input('width')).toHaveValue('384');await expect(input('height')).toHaveValue('261');
  await expect(handle('se').locator('.bb-glyph')).toHaveCSS('fill','rgb(30, 137, 245)');
  if(item.framework==='react')await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(out,'bounding-box-resize-corner.png')});
  await page.mouse.up();
  await input('height').click();assert.equal(await input('height').evaluate(n=>n.readOnly),false);
  await input('height').fill('200');await input('height').press('Enter');
  assert.equal((await dimensions()).height,200);await expect.poll(()=>box.evaluate(n=>parseFloat(n.style.height))).toBe(200);
  await input('width').click();await input('width').fill('320');await chip('width').getByRole('button',{name:'Apply width'}).click();
  assert.equal((await dimensions()).width,320);
  await input('height').click();await input('height').fill('999');await input('height').press('Enter');
  await expect(input('height')).toHaveAttribute('aria-invalid','true');assert.equal((await dimensions()).height,200);
  await input('height').press('Escape');assert.equal((await dimensions()).height,200);

  await page.evaluate(()=>window.__update({reducedMotion:true}));
  const cases=[
    ['nw',{width:281,height:190,x:129.5,y:33}],['n',{width:291,height:190,x:119.5,y:33}],
    ['ne',{width:301,height:190,x:119.5,y:33}],['w',{width:281,height:200,x:129.5,y:23}],
    ['e',{width:301,height:200,x:119.5,y:23}],['sw',{width:281,height:210,x:129.5,y:23}],
    ['s',{width:291,height:210,x:119.5,y:23}],['se',{width:301,height:210,x:119.5,y:23}],
  ];
  for(const [key,expected] of cases){await reset();await drag(key,10,10);assert.deepEqual(await dimensions(),expected,`${key} keeps the opposite edges fixed`);}
  await reset();await drag('e',49,0);
  assert.deepEqual(await dimensions(),{width:340,height:200,x:119.5,y:23});
  await expect(page.locator('#demo .bb-guide')).toHaveAttribute('data-visible','true');
  await expect(chip('width')).toHaveAttribute('data-visible','true');await expect(chip('height')).toHaveAttribute('data-visible','false');
  await reset();await drag('se',-1000,-1000);assert.equal((await dimensions()).width,64);assert.equal((await dimensions()).height,48);
  await reset();await drag('se',1000,1000);assert((await dimensions()).width<=489);assert.equal((await dimensions()).height,273);

  await reset();await handle('e').focus();await handle('e').press('ArrowRight');await handle('e').press('Shift+ArrowRight');
  assert.equal((await dimensions()).width,302);assert.equal((await dimensions()).height,200);
  await handle('e').press('Enter');await input('width').fill('300');await input('width').press('Enter');assert.equal((await dimensions()).width,300);
  await reset();await drag('se',30,20,false);await handle('se').press('Escape');await page.mouse.up();
  assert.equal(await stage.getAttribute('data-dragging'),'false');assert.equal((await dimensions()).width,291);

  await page.evaluate(()=>window.__update({reducedMotion:false}));
  await page.mouse.move(1150,900);await handle('e').focus();
  const start=await handle('e').getAttribute('data-morph');await page.waitForTimeout(60);const mid=await handle('e').getAttribute('data-morph');
  assert.notEqual(start,mid,'options update restores animated hover');
  await page.evaluate(()=>window.__update({reducedMotion:undefined}));await page.emulateMedia({reducedMotion:'reduce'});await handle('n').focus();
  assert.equal(await handle('n').getAttribute('data-morph'),'1.000','system reduced motion applies immediately');
  await page.emulateMedia({reducedMotion:'no-preference'});

  await page.evaluate(()=>window.__mount('independent'));
  const second=page.locator('#independent .bb-handle[data-handle=e]');await second.waitFor();await second.press('Shift+ArrowRight');
  assert.equal(await page.locator('#independent .bb-stage').getAttribute('data-width'),'301');assert.equal((await dimensions()).width,291,'instances do not share geometry');
  await page.evaluate(()=>window.__unmount('independent'));await reset();
}
