import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

const canvasAlpha=canvas=>canvas.evaluate(node=>{
  const data=node.getContext('2d').getImageData(0,0,node.width,node.height).data;
  let count=0;for(let i=3;i<data.length;i+=4)if(data[i])count++;return count;
});

export async function verifyElementalCardCarousel(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#stage'),cards=scene.locator('.card');
  const active=id=>scene.locator(`.card[data-id=${id}]`);
  const settled=async()=>{
    await expect.poll(()=>root.getAttribute('data-ignite').then(Number),{timeout:10000}).toBeGreaterThan(.95);
    await expect.poll(()=>root.evaluate(node=>{
      const index=['ember','solar','breeze','bloom'].indexOf(node.dataset.active);
      let delta=(Number(node.dataset.offset)-index)%4;if(delta>2)delta-=4;if(delta<-2)delta+=4;
      return Math.abs(delta)<.015;
    })).toBe(true);
  };
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl2');
  await settled();assert.equal(await root.getAttribute('data-active'),'ember');
  assert(await page.evaluate(()=>window.__elementSamples.every(sample=>sample.corner<50)),'an older first RAF timestamp cannot explode ambient light');
  assert(await page.evaluate(()=>new Set(window.__elementSamples.map(s=>s.hash)).size>3),'the two shader passes draw changing pixels');
  await page.evaluate(()=>{window.__elementChanges=[];window.__update({onActiveChange:index=>window.__elementChanges.push(index)});});
  const hashes=[];
  for(const [index,id] of ['ember','solar','breeze','bloom'].entries()){
    if(index){await cards.filter({has:page.locator('.card-title',{hasText:['Ember','Solar','Breeze','Bloom'][index-1]})}).press('ArrowRight');}
    await expect(root).toHaveAttribute('data-active',id);await settled();
    await expect(active(id)).toHaveAttribute('aria-pressed','true');
    if(index)await expect(active(id)).toBeFocused();
    hashes.push(await page.evaluate(()=>window.__elementSamples.at(-1).hash));
    assert(await canvasAlpha(scene.locator('#fx-front'))>30,'foreground particles are drawn');
    if(id==='breeze')assert(await canvasAlpha(scene.locator('#fx-mid'))>100,'wind streaks are actually drawn on the middle canvas');
    if(item.framework==='react')await root.screenshot({path:`${output}/elemental-card-carousel-native-${id}.png`});
    if(index<3){await active(id).press('ArrowRight');await expect(root).toHaveAttribute('data-active',['solar','breeze','bloom'][index]);await expect.poll(()=>root.getAttribute('data-bursts').then(Number)).toBeGreaterThan(0);await active(['solar','breeze','bloom'][index]).press('ArrowLeft');await settled();}
  }
  assert.equal(new Set(hashes).size,4,'the four fields produce distinct pixels');
  await active('bloom').press('Home');await expect(root).toHaveAttribute('data-active','ember');await expect(active('ember')).toBeFocused();
  await active('ember').press('End');await expect(root).toHaveAttribute('data-active','bloom');
  await active('bloom').press('2');await expect(root).toHaveAttribute('data-active','solar');
  const changes=await page.evaluate(()=>JSON.stringify(window.__elementChanges));
  await page.evaluate(()=>window.__update({active:0}));await expect(root).toHaveAttribute('data-active','ember');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__elementChanges)),changes,'external active updates do not emit user callbacks');await settled();
  await page.evaluate(()=>{document.body.tabIndex=-1;document.body.focus();});
  await page.keyboard.press('4');await expect(root).toHaveAttribute('data-active','ember');
  await root.hover();await page.mouse.wheel(0,150);await expect(root).toHaveAttribute('data-active','ember');
  await page.mouse.wheel(120,0);await expect(root).toHaveAttribute('data-active','solar');

  await page.evaluate(()=>window.__update({paused:true}));await expect(root).toHaveAttribute('data-paused','true');
  await page.waitForTimeout(80);const time=await root.getAttribute('data-time'),draws=await page.evaluate(()=>window.__elementDraws);
  await page.waitForTimeout(180);assert.equal(await root.getAttribute('data-time'),time);assert.equal(await page.evaluate(()=>window.__elementDraws),draws);
  await page.evaluate(()=>window.__update({paused:false}));await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(time));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=await root.getAttribute('data-time');await page.waitForTimeout(150);assert.equal(await root.getAttribute('data-time'),hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(hidden));

  await page.evaluate(()=>window.__update({reducedMotion:true,active:2,theme:'light'}));
  await expect(root).toHaveAttribute('data-active','breeze');await expect(root).toHaveAttribute('data-ignite','1.0000');
  await expect(root).toHaveAttribute('data-theme','light');assert.equal(await page.evaluate(()=>window.__elementSamples.at(-1).corner),244);
  await page.waitForTimeout(100);const frames=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__motionFrames),frames);
  await active('breeze').press('ArrowRight');await expect(root).toHaveAttribute('data-active','bloom');await expect(active('bloom')).toBeFocused();

  await page.setViewportSize({width:375,height:1000});
  await page.evaluate(()=>window.__update({active:0,reducedMotion:false,theme:'dark'}));await expect(root).toHaveAttribute('data-active','ember');await settled();
  const bounds=await active('ember').boundingBox();assert(Math.abs(bounds.width-146)<1&&Math.abs(bounds.height-236)<1);
  await active('solar').tap();await expect(root).toHaveAttribute('data-active','solar');await settled();
  const stage=await root.boundingBox(),x=stage.x+stage.width*.55,y=stage.y+stage.height*.45;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-110,y,{steps:8});await page.mouse.up();
  await expect(root).toHaveAttribute('data-active','breeze');await page.waitForTimeout(400);await expect(root).toHaveAttribute('data-active','breeze');await settled();
  const touch=await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=6;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-110*i/6,y}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();
  await expect(root).toHaveAttribute('data-active','bloom');await settled();
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-35,y,{steps:4});
  await root.dispatchEvent('pointercancel',{pointerId:1,clientX:x-35,clientY:y});await page.mouse.up();
  await expect(root).toHaveAttribute('data-active','bloom');await settled();
  if(item.framework==='react')for(const width of [375,768,1440]){
    await page.setViewportSize({width,height:1000});await root.screenshot({path:`${output}/elemental-card-carousel-native-ready-${width}.png`});
  }
  await page.setViewportSize({width:1200,height:1000});
  await page.evaluate(()=>window.__update({height:540}));await expect.poll(()=>root.evaluate(n=>n.clientHeight)).toBe(540);
  assert.equal(await scene.locator('#gl-canvas').evaluate(n=>n.height),Math.round(540*.72));
  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__elementNoGL=true;window.__mount();});
    await expect(root).toHaveAttribute('data-renderer','canvas2d');await page.evaluate(()=>window.__update({reducedMotion:true,active:2}));
    await expect(root).toHaveAttribute('data-active','breeze');assert(await canvasAlpha(scene.locator('#fx-mid'))>100);
    await active('breeze').press('End');await expect(root).toHaveAttribute('data-active','bloom');
    await page.evaluate(async()=>{await window.__unmount();window.__elementNoGL=false;window.__mount();});await expect(root).toHaveAttribute('data-renderer','webgl2');
  }
}

export async function verifyElementalCardCarouselPreviews(page,base){
  const href='/docs/animations/elemental-card-carousel';
  await page.goto(base+'/components?category=galleries',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);await card.hover();
  await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#stage');await expect(root).toHaveAttribute('data-theme','light');
  await expect(root).toHaveAttribute('data-active','solar',{timeout:8000});
  await expect.poll(()=>root.getAttribute('data-ignite').then(Number)).toBeGreaterThan(.8);
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/kaolti"]')).toHaveText('作者 · @kaolti');assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect(popup.frameLocator('iframe').locator('#stage')).toHaveAttribute('data-active','solar',{timeout:8000});
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
