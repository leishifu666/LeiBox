import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

const signature=canvas=>canvas.evaluate(node=>{
  const gl=node.getContext('webgl2');let data;
  if(gl){data=new Uint8Array(node.width*node.height*4);gl.readPixels(0,0,node.width,node.height,gl.RGBA,gl.UNSIGNED_BYTE,data);}
  else data=node.getContext('2d').getImageData(0,0,node.width,node.height).data;
  let hash=2166136261;for(let i=0;i<data.length;i+=97)hash=Math.imul(hash^data[i],16777619);return hash>>>0;
});

export async function verifyGlassNavigationShade(page,item,output){
  const nav=item.slug==='liquid-glass-navigation',scene=page.locator('#demo'),root=scene.locator(nav?'#glassNavigation':'#shadeTheme'),canvas=root.locator('canvas');
  await expect(root).toHaveAttribute('data-ready','true');await expect(root).toHaveAttribute('data-renderer','webgl2');
  const first=await signature(canvas);await page.waitForTimeout(200);assert.notEqual(await signature(canvas),first,'the actual GPU pixels evolve');
  await page.evaluate(()=>window.__update({paused:true}));await expect(root).toHaveAttribute('data-paused','true');
  const frozen=await signature(canvas);await page.waitForTimeout(160);assert.equal(await signature(canvas),frozen,'pause freezes pixels');
  await page.evaluate(()=>window.__update({paused:false}));await expect(root).toHaveAttribute('data-paused','false');
  if(nav){
    const product=root.locator('[data-menu=product]'),resources=root.locator('[data-menu=resources]'),company=root.locator('[data-menu=company]');
    await page.evaluate(()=>{window.__glassMenus=[];window.__glassActions=[];window.__update({onMenuChange:m=>window.__glassMenus.push(m),onAction:(m,label)=>window.__glassActions.push([m,label])});});
    await resources.hover();await expect(root).toHaveAttribute('data-menu','resources');
    await expect.poll(()=>root.locator('.glass-dropdown-overlay').evaluate(n=>Number.parseFloat(n.style.height))).toBeGreaterThan(243);
    await resources.press('ArrowDown');const docs=root.locator('#pane-resources .menu-item').first();await expect(docs).toBeFocused();
    await docs.press('End');const support=root.locator('#pane-resources .menu-item').last();await expect(support).toBeFocused();await support.press('Enter');
    assert.deepEqual(await page.evaluate(()=>window.__glassActions),[['resources','Support']]);
    await support.press('ArrowRight');await expect(root).toHaveAttribute('data-menu','company');await expect(root.locator('#pane-company .menu-item').first()).toBeFocused();
    await root.locator('#pane-company .menu-item').first().press('Escape');await expect(company).toBeFocused();await expect(root).toHaveAttribute('data-menu','none');
    assert(await root.locator('.glass-dropdown-overlay').evaluate(n=>n.inert));assert(await root.locator('#pane-product').evaluate(n=>n.inert));
    const before=await page.evaluate(()=>JSON.stringify(window.__glassMenus));await product.focus();await page.evaluate(()=>window.__update({menu:'resources'}));await expect(root).toHaveAttribute('data-menu','resources');await expect(product).toBeFocused();assert.equal(await page.evaluate(()=>JSON.stringify(window.__glassMenus)),before);
    await page.setViewportSize({width:375,height:1000});await resources.tap();await expect(root).toHaveAttribute('data-menu','none');await resources.tap();await expect(root).toHaveAttribute('data-menu','resources');
    const r=await resources.boundingBox();assert(r.height>=44);assert(await root.locator('.nav-trigger').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect(),parent=n.closest('.glass-navigation').getBoundingClientRect();return r.left>=parent.left+5&&r.right<=parent.right-5;})),'all three mobile triggers and chevrons fit inside the scene');await expect.poll(()=>root.locator('.glass-dropdown-overlay').evaluate(n=>n.getBoundingClientRect().right)).toBeLessThan(362);
    await root.locator('#pane-resources .menu-item').nth(1).tap();assert.deepEqual((await page.evaluate(()=>window.__glassActions)).at(-1),['resources','Guides']);
    await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(root).toHaveAttribute('data-reduced','true');await company.tap();await expect(root).toHaveAttribute('data-menu','company');await expect(root).toHaveAttribute('data-opening','1.0000');
    const hidden=await root.locator('#pane-product .menu-item').first().evaluate(n=>{n.focus();return n===n.getRootNode().activeElement;});assert.equal(hidden,false);
  }else{
    const slider=root.locator('#windowWrap'),aperture=root.locator('#windowAperture');
    const host=await page.evaluate(()=>({theme:document.documentElement.getAttribute('data-theme'),background:document.body.style.backgroundColor}));
    await page.evaluate(()=>{window.__shadeChanges=[];window.__update({onThemeChange:theme=>window.__shadeChanges.push(theme)});});
    await slider.press('End');await expect(root).toHaveAttribute('data-theme','dark');await expect(root).toHaveAttribute('data-progress','1.0000');await expect(slider).toHaveAttribute('aria-valuenow','100');await expect(root).toHaveAttribute('data-animating','false');
    const frames=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__motionFrames),frames,'closed shade stops its renderer');
    await slider.press('Home');await expect(root).toHaveAttribute('data-theme','light');await expect(root).toHaveAttribute('data-progress','0.0000');
    assert.deepEqual(await page.evaluate(()=>window.__shadeChanges),['dark','light']);
    const box=await aperture.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+12);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+130,{steps:10});
    assert(Number(await root.getAttribute('data-progress'))>.45);assert(Number(await root.getAttribute('data-progress'))<.7);
    if(item.framework==='react')await root.screenshot({path:output+'/window-shade-native-dragging.png'});
    await page.mouse.move(box.x+box.width/2,box.y+218,{steps:10});await page.mouse.up();await expect(root).toHaveAttribute('data-progress','1.0000');await expect(root).toHaveAttribute('data-theme','dark');
    await slider.press('Home');await page.waitForTimeout(70);await slider.press('End');await page.waitForTimeout(50);await slider.press('Home');await expect(root).toHaveAttribute('data-progress','0.0000');await expect(root).toHaveAttribute('data-theme','light');
    const before=await page.evaluate(()=>JSON.stringify(window.__shadeChanges));await page.evaluate(()=>window.__update({theme:'dark',progress:.5,paused:true}));await expect(root).toHaveAttribute('data-progress','0.5000');await expect(root).toHaveAttribute('data-theme','dark');assert.equal(await page.evaluate(()=>JSON.stringify(window.__shadeChanges)),before);
    await page.evaluate(()=>window.__update({theme:'light',reducedMotion:true,paused:false}));await expect(root).toHaveAttribute('data-progress','0.0000');await expect(root).toHaveAttribute('data-reduced','true');
    await slider.press('Enter');await expect(root).toHaveAttribute('data-progress','1.0000');await expect(root).toHaveAttribute('data-theme','dark');await expect(slider).toBeFocused();
    await page.setViewportSize({width:375,height:1000});await aperture.tap();await expect(root).toHaveAttribute('data-theme','light');await expect(root).toHaveAttribute('data-progress','0.0000');
    await aperture.evaluate(n=>{n.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:21,clientY:10}));n.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:21,clientY:110}));n.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:21,clientY:110}));});
    await expect(root).toHaveAttribute('data-progress','0.0000');await expect(root).toHaveAttribute('data-dragging','false');await expect(root).toHaveAttribute('data-theme','light');
    assert.deepEqual(await page.evaluate(()=>({theme:document.documentElement.getAttribute('data-theme'),background:document.body.style.backgroundColor})),host,'the theme never touches the host document');
  }
  // Frozen, hidden and offscreen instances must never catch up to wall clock.
  await page.setViewportSize({width:1200,height:1000});await page.evaluate(()=>{window.scrollTo(0,0);window.__update({reducedMotion:false,paused:false,...(window.__testNav?{menu:'product'}:{theme:'light'})});});
  await expect(root).toHaveAttribute('data-reduced','false');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await root.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await root.getAttribute('data-time'),hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(hidden));
  await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='glass-spacer';spacer.style.height='2500px';document.body.appendChild(spacer);window.scrollTo(0,1500);});await page.waitForTimeout(160);const off=await root.getAttribute('data-time');await page.waitForTimeout(160);assert.equal(await root.getAttribute('data-time'),off);
  await page.evaluate(()=>{window.scrollTo(0,0);document.getElementById('glass-spacer').remove();});await expect.poll(()=>root.getAttribute('data-time').then(Number)).toBeGreaterThan(Number(off));
  await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(root).toHaveAttribute('data-reduced','true');
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(50);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(item.framework==='react')await root.screenshot({path:`${output}/${item.slug}-native-ready-${width}.png`});}
  await page.setViewportSize({width:1200,height:1000});
  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__noGlassGpu=true;window.__mount();});await expect(root).toHaveAttribute('data-renderer',nav?'css':'canvas2d');await expect(root).toHaveAttribute('data-ready','true');
    if(nav){assert(await root.evaluate(n=>n.style.getPropertyValue('--glass-background').includes(n.querySelector('img').src)));await root.locator('[data-menu=company]').press('ArrowDown');await expect(root.locator('#pane-company .menu-item').first()).toBeFocused();}
    else{await page.evaluate(()=>window.__update({reducedMotion:true}));await root.locator('#windowWrap').press('End');await expect(root).toHaveAttribute('data-theme','dark');}
    await page.evaluate(async()=>{await window.__unmount();window.__noGlassGpu=false;window.__mount();});await expect(root).toHaveAttribute('data-renderer','webgl2');await expect(root).toHaveAttribute('data-ready','true');
  }
}

export async function verifyGlassNavigationShadePreviews(page,base,slug){
  const nav=slug==='liquid-glass-navigation',href='/docs/animations/'+slug,selector=nav?'#glassNavigation':'#shadeTheme';
  await page.goto(base+'/components?category='+(nav?'navigation':'controls'),{waitUntil:'networkidle'});const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();const root=card.frameLocator('iframe').locator(selector);const phase=await root.getAttribute(nav?'data-menu':'data-theme');await expect.poll(()=>root.getAttribute(nav?'data-menu':'data-theme'),{timeout:12000}).not.toBe(phase);
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});await expect(page.locator(`a[href="https://x.com/${nav?'jesse_vermeulen':'mjbarton_'}"]`)).toHaveText('作者 · @'+(nav?'jesse_vermeulen':'mjbarton_'));assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current=page]`),popup=page.locator(`[data-sidebar-preview="${href}"]`);await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();const sidebar=popup.frameLocator('iframe').locator(selector),before=await sidebar.getAttribute(nav?'data-menu':'data-theme');await expect.poll(()=>sidebar.getAttribute(nav?'data-menu':'data-theme'),{timeout:12000}).not.toBe(before);
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();await link.blur();await expect(popup).toHaveCount(0);
}
