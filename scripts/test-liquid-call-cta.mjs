import assert from 'node:assert/strict';
import {expect} from 'playwright/test';

async function point(book,x=0,y=0){
  const r=await book.boundingBox(),scale=r.width/287;
  return {x:r.x+r.width*.5+x*scale,y:r.y+r.height*.5+y*scale};
}
async function move(page,book,x=0,y=0){const p=await point(book,x,y);await page.mouse.move(p.x,p.y);}

export async function verifyLiquidCallCta(page,item,output){
  const scene=page.locator('#demo'),root=scene.locator('#liquidCta'),book=scene.locator('#bookBtn');
  await expect(root).toHaveAttribute('data-ready','true');
  await expect(root).toHaveAttribute('data-renderer','webgl');
  await expect(root).toHaveAttribute('data-engaged','false');
  await page.waitForTimeout(150);
  const idle=await page.evaluate(()=>window.__motionFrames);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.__motionFrames),idle,'an idle pill does not run a permanent RAF');
  await page.evaluate(()=>{
    window.__liquidActions=[];
    window.__liquidFonts=[...document.fonts].filter(face=>face.family==='LiquidCallInter').length;
    window.__update({onAction:action=>window.__liquidActions.push(action)});
  });
  const before=await page.evaluate(()=>window.__liquidDraws);
  await move(page,book);await expect(root).toHaveAttribute('data-engaged','true');
  await expect.poll(()=>root.getAttribute('data-hover').then(Number)).toBeGreaterThan(.8);
  assert(await page.evaluate(()=>window.__liquidDraws)>before,'hover draws the actual SDF shader');
  await move(page,book,-70,0);
  await expect.poll(()=>root.getAttribute('data-blob-x').then(Number)).toBeLessThan(-30);
  await move(page,book,65,0);
  await expect.poll(()=>root.getAttribute('data-blob-x').then(Number)).toBeGreaterThan(30);
  await move(page,book,40,-70);
  await expect.poll(()=>root.getAttribute('data-blob-y').then(Number)).toBeLessThan(-50);
  await expect(root).toHaveAttribute('data-engaged','true');
  if(item.framework==='react')await page.screenshot({path:output+'/liquid-call-cta-native-neck.png'});
  await move(page,book,40,-155);
  await expect(root).toHaveAttribute('data-engaged','false');
  await expect.poll(()=>root.getAttribute('data-drop-radius').then(Number),{intervals:[10,20,40]}).toBeGreaterThan(.25);
  await expect(root).toHaveAttribute('data-drop-radius','0.000');
  await expect.poll(()=>root.getAttribute('data-hover').then(Number)).toBeLessThan(.01);

  // Secondary pointers cannot cancel a primary press; a real cancellation never invokes an action.
  const center=await point(book);
  await book.dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:center.x,clientY:center.y});
  await expect(root).toHaveAttribute('data-pressed','true');
  await book.dispatchEvent('pointercancel',{pointerId:8,pointerType:'touch',isPrimary:false});
  await expect(root).toHaveAttribute('data-pressed','true');
  await book.dispatchEvent('pointercancel',{pointerId:7,pointerType:'touch',isPrimary:true});
  await expect(root).toHaveAttribute('data-pressed','false');
  assert.deepEqual(await page.evaluate(()=>window.__liquidActions),[]);
  await book.focus();await page.keyboard.down('Space');
  await expect(root).toHaveAttribute('data-pressed','true');
  await page.keyboard.up('Space');
  await expect(scene.locator('#feedbackToast')).toHaveText('Call booking selected (demo)');
  await expect(root).toHaveAttribute('data-pressed','false');
  await scene.locator('#starBtn').press('Enter');
  await expect(scene.locator('#feedbackToast')).toHaveText('Highlights selected (demo)');
  await scene.locator('#xBtn').press('Enter');
  await expect(scene.locator('#feedbackToast')).toHaveText('X profile selected (demo)');
  assert.deepEqual(await page.evaluate(()=>window.__liquidActions),['book','highlights','profile']);

  await page.setViewportSize({width:375,height:1000});
  await expect.poll(async()=>{
    const row=await scene.locator('#ctaRow').boundingBox();
    return row.x>=0&&row.x+row.width<=375;
  }).toBe(true);
  const icon=await scene.locator('#xBtn').boundingBox();assert(icon.width>=44,'mobile action targets remain at least 44px');
  await book.tap();await expect(root).toHaveAttribute('data-pressed','false');
  assert.equal(await page.evaluate(()=>window.__liquidActions.at(-1)),'book');
  await page.setViewportSize({width:1200,height:1000});
  await page.evaluate(()=>window.__update({label:"Let's talk",disabled:true}));
  await expect(book).toHaveAccessibleName("Let's talk");
  await expect(book).toBeDisabled();await expect(scene.locator('#xBtn')).toBeDisabled();
  const count=await page.evaluate(()=>window.__liquidActions.length);
  await book.dispatchEvent('click');assert.equal(await page.evaluate(()=>window.__liquidActions.length),count);
  await page.evaluate(()=>window.__update({disabled:false,reducedMotion:true}));
  await move(page,book);
  await expect(root).toHaveAttribute('data-blob-radius','0.000');
  await expect(root).toHaveAttribute('data-drop-radius','0.000');
  await page.waitForTimeout(100);const reducedFrames=await page.evaluate(()=>window.__motionFrames);
  await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__motionFrames),reducedFrames);
  await book.press('Enter');assert.equal(await page.evaluate(()=>window.__liquidActions.length),count+1);
  await page.evaluate(()=>window.__update({reducedMotion:false}));
  await book.blur();await page.mouse.move(1,900);

  if(item.framework==='react'){
    await page.evaluate(async()=>{await window.__unmount();window.__liquidNoGL=true;window.__mount();});
    await expect(root).toHaveAttribute('data-renderer','canvas2d');
    await expect(root).toHaveAttribute('data-ready','true');
    await page.evaluate(()=>window.__update({reducedMotion:true}));
    await move(page,book);
    assert(await scene.locator('canvas').evaluate(canvas=>Boolean(canvas.getContext('2d'))));
    await book.press('Enter');await expect(scene.locator('#feedbackToast')).toHaveText('Call booking selected (demo)');
    await page.evaluate(async()=>{await window.__unmount();window.__liquidNoGL=false;window.__mount();});
    await expect(root).toHaveAttribute('data-ready','true');
    await expect(root).toHaveAttribute('data-renderer','webgl');
  }
}

export async function verifyLiquidCallCtaPreviews(page,base){
  const href='/docs/animations/liquid-call-cta';
  await page.goto(base+'/components?category=controls',{waitUntil:'networkidle'});
  const card=page.locator(`[data-component-card="${href}"]`);
  await card.hover();await expect(card.locator('[data-scene-ready=true]')).toBeVisible();
  const root=card.frameLocator('iframe').locator('#liquidCta');
  await expect(root).toHaveAttribute('data-engaged','true',{timeout:7000});
  await expect(root).toHaveAttribute('data-engaged','false',{timeout:5000});
  await page.mouse.move(270,5);await expect(card.locator('iframe')).toHaveCount(0);
  await page.goto(base+href,{waitUntil:'networkidle'});
  await expect(page.locator('a[href="https://x.com/val_soonafter"]')).toHaveText('作者 · @val_soonafter');
  assert.equal(await page.locator('video').count(),0);
  const link=page.locator(`aside a[href="${href}"][aria-current="page"]`);
  const popup=page.locator(`[data-sidebar-preview="${href}"]`);
  await link.hover();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await expect(popup.frameLocator('iframe').locator('#liquidCta')).toHaveAttribute('data-engaged','true',{timeout:7000});
  await page.mouse.move(270,5);await expect(popup).toHaveCount(0);
  await link.focus();await expect(popup.locator('[data-scene-ready=true]')).toBeVisible();
  await link.blur();await expect(popup).toHaveCount(0);
}
