import assert from 'node:assert/strict';
import path from 'node:path';
import {expect} from 'playwright/test';

async function appearance(button){return button.evaluate(n=>({opacity:+getComputedStyle(n).opacity,blur:getComputedStyle(n).filter,inert:n.inert}));}
async function radius(root,index){return root.evaluate((n,i)=>{const a=n.querySelectorAll('.rm-action')[i].getBoundingClientRect(),b=n.querySelector('.rm-toggle').getBoundingClientRect(),diameter=n.dataset.variant==='soft'?194:178;return Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2)*diameter/b.width;},index);}
async function observeTransition(root){
 await root.evaluate(n=>{
  n.__transition=[];
  n.querySelector('.rm-toggle').addEventListener('click',()=>{
   const began=performance.now();
   const sample=()=>{
    const trigger=n.querySelector('.rm-toggle').getBoundingClientRect();
    const diameter=n.dataset.variant==='soft'?194:178;
    n.__transition.push([...n.querySelectorAll('.rm-action')].map(button=>{const rect=button.getBoundingClientRect();return {opacity:+getComputedStyle(button).opacity,radius:Math.hypot(rect.x+rect.width/2-trigger.x-trigger.width/2,rect.y+rect.height/2-trigger.y-trigger.height/2)*diameter/trigger.width};}));
    if(n.dataset.moving==='true'&&performance.now()-began<3000)requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
  },{once:true});
 });
}

export async function verifyStaggeredRadialMenu(page,item,rootPath,outputPath){
 const soft=item.slug==='soft-action-wheel';
 const root=page.locator('#demo .radial-menu-demo'),toggle=root.locator('.rm-toggle'),buttons=root.locator('.rm-action');
 await expect(root).toHaveAttribute('data-motion-ready','true');assert.equal(await buttons.count(),6);
 await toggle.hover();await page.waitForTimeout(150);await expect(root).toHaveAttribute('data-open','false');
 assert((await buttons.evaluateAll(nodes=>nodes.every(n=>n.inert&&getComputedStyle(n).visibility==='hidden'))));
 if(item.framework==='react'){
  await page.mouse.move(1,1);
  await page.evaluate(()=>window.__update({height:900}));await root.evaluate(n=>n.style.background='#f4f4f4');
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.locator('#demo [data-motion-surface]').screenshot({path:path.join(rootPath,'public/assets/components',item.slug+'.png')});
  await root.evaluate(n=>n.style.background='');await page.evaluate(()=>window.__update({height:960}));
 }
 await buttons.first().evaluate(n=>n.dataset.identity='preserved');
 await observeTransition(root);await toggle.click();await expect(root).toHaveAttribute('data-moving','false');
 const opening=await root.evaluate(n=>n.__transition);
 assert(opening.some(sample=>sample[0].opacity>0&&sample[5].opacity===0),'the final action waits while the first arrives');
 assert(opening.some(sample=>sample[0].radius>225&&sample[0].radius<450),'the first action arrives inward from the perimeter');
 assert(opening.some(sample=>sample[0].radius<223),'the first action passes its resting radius before springing back');
 assert.equal(await buttons.first().getAttribute('data-identity'),'preserved');
 for(let i=0;i<6;i++){assert(Math.abs(await radius(root,i)-224)<.2);assert.equal((await appearance(buttons.nth(i))).blur,'none');}
 if(soft){assert.equal(await root.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(241, 241, 241)');assert.equal(await toggle.evaluate(n=>n.offsetWidth),194);}
 if(item.framework==='react'){await page.mouse.move(20,20);await root.screenshot({path:path.join(outputPath,item.slug+'-expanded.png')});}
 await observeTransition(root);await toggle.click();await expect(root).toHaveAttribute('data-moving','false');
 const closing=await root.evaluate(n=>n.__transition);
 if(soft){assert(closing.some(sample=>sample.every(button=>button.opacity>0&&button.opacity<1)),'all light actions fade out together');assert(closing.every(sample=>Math.max(...sample.map(button=>button.opacity))-Math.min(...sample.map(button=>button.opacity))<.00001),'light dismissal has no reverse stagger');}
 else assert(closing.some(sample=>sample[5].opacity<1&&sample[0].opacity===1),'dismissal begins in the opposite order');
 assert(closing.some(sample=>sample[5].opacity>0&&sample[5].radius>225),'closing scatters the final action outwards');
 await expect(root).toHaveAttribute('data-open','false');
 const box=await toggle.boundingBox();
 for(let i=0;i<5;i++)await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await expect(root).toHaveAttribute('data-open','true');await expect(root).toHaveAttribute('data-moving','false');
 assert(Math.abs(await radius(root,0)-224)<.2,'rapid reversals finish at the latest target');
 await page.mouse.click(5,5);await expect(root).toHaveAttribute('data-open','false');await expect(root).toHaveAttribute('data-moving','false');
 await toggle.focus();await toggle.press('Enter');await expect(buttons.first()).toBeFocused();
 await buttons.first().press('ArrowRight');await expect(buttons.nth(1)).toBeFocused();await buttons.nth(1).press('End');await expect(buttons.last()).toBeFocused();
 await buttons.last().press('ArrowLeft');await expect(buttons.nth(4)).toBeFocused();await buttons.nth(4).press('Home');await expect(buttons.first()).toBeFocused();
 await buttons.first().press('Escape');await expect(toggle).toBeFocused();await expect(root).toHaveAttribute('data-open','false');
 await page.evaluate(()=>{const after=document.createElement('button');after.id='radial-after';after.textContent='After demonstration';document.body.append(after);});
 await toggle.press('ArrowDown');await expect(buttons.first()).toBeFocused();await page.keyboard.press('Tab');await expect(toggle).toBeFocused();await page.keyboard.press('Tab');
 await expect(page.locator('#radial-after')).toBeFocused();await expect(root).toHaveAttribute('data-open','false');await page.locator('#radial-after').evaluate(n=>n.remove());
 await page.emulateMedia({reducedMotion:'reduce'});await toggle.click();await expect(root).toHaveAttribute('data-moving','false');assert.equal(await root.getAttribute('data-progress'),'1.0000');
 await toggle.click();assert.equal(await root.getAttribute('data-progress'),'0.0000');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>window.__update({reducedMotion:true}));await expect(page.locator('#demo [data-motion-surface]')).toHaveAttribute('data-reduced-motion','true');
 await root.evaluate(n=>{n.__actions=[];n.addEventListener('radial-menu-action',event=>n.__actions.push(event.detail.action));});
 const actions=['mail','photos','notifications','messages','calendar','compose'];
 for(let i=0;i<6;i++){await toggle.click();assert.equal(await root.getAttribute('data-progress'),'1.0000');await buttons.nth(i).click();assert.equal(await root.getAttribute('data-action'),actions[i]);assert.equal(await root.getAttribute('data-progress'),'0.0000');}
 assert.deepEqual(await root.evaluate(n=>n.__actions),actions);
 await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(root).toHaveAttribute('data-moving','false');
 if(item.framework==='react'){
  const touch=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
   const phone=await touch.newPage(),errors=[];phone.on('pageerror',error=>errors.push(error.message));await phone.goto(page.url());await phone.waitForFunction(()=>Boolean(window.__mount));await phone.evaluate(()=>window.__mount());
   const scene=phone.locator('.radial-menu-demo');await expect(scene).toHaveAttribute('data-motion-ready','true');await scene.locator('.rm-toggle').tap();await expect(scene).toHaveAttribute('data-moving','false');
   await phone.screenshot({path:path.join(outputPath,item.slug+'-touch.png')});
   await scene.locator('.rm-action[data-action="photos"]').tap();await expect(scene).toHaveAttribute('data-action','photos');await expect(scene).toHaveAttribute('data-open','false');
   for(let i=0;i<5;i++)await scene.locator('.rm-toggle').tap();await expect(scene).toHaveAttribute('data-open','true');await expect(scene).toHaveAttribute('data-moving','false');assert.deepEqual(errors,[]);
  }finally{await touch.close();}
 }
}

export async function verifyStaggeredRadialMenuDoc(page,outputPath,slug='staggered-radial-menu'){
 const soft=slug==='soft-action-wheel',author=soft?'withAnimation':'Nitish Khagwal',authorUrl=soft?'https://x.com/withAnimationUI':'https://x.com/nitishkmrk';
 const iframe=page.locator('section[aria-label="Demo"] iframe'),frame=page.frameLocator('section[aria-label="Demo"] iframe'),root=frame.locator('.radial-menu-demo');
 await iframe.scrollIntoViewIfNeeded();await expect(root).toHaveAttribute('data-motion-ready','true');
 async function clickLocal(selector){const outer=await iframe.boundingBox(),local=await frame.locator(selector).evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:innerWidth})),scale=outer.width/local.width;await page.mouse.click(outer.x+(local.rect.x+local.rect.width/2)*scale,outer.y+(local.rect.y+local.rect.height/2)*scale);}
 await clickLocal('.rm-toggle');await expect(root).toHaveAttribute('data-open','true');await expect(root).toHaveAttribute('data-moving','false');
 await page.screenshot({path:path.join(outputPath,slug+'-doc-open.png')});
 await clickLocal('.rm-action[data-action="messages"]');await expect(root).toHaveAttribute('data-action','messages');await expect(root).toHaveAttribute('data-open','false');
 await expect(page.locator(`a[href="${authorUrl}"]`)).toHaveText('作者 · '+author);assert.equal(await page.locator('video,a[href$=".mp4"]').count(),0);
 await page.locator(`nav a[href="/docs/animations/${slug}"]`).hover();const preview=page.locator(`[data-sidebar-preview="/docs/animations/${slug}"]`);
 await expect(preview.locator('[data-scene-ready=true]')).toHaveCount(1);const live=preview.frameLocator('iframe');await expect(live.locator('.radial-menu-demo')).toHaveAttribute('data-open','true');
 await expect.poll(()=>live.locator('.rm-action').last().evaluate(n=>+getComputedStyle(n).opacity)).toBe(1);
 assert.equal(await live.locator('.radial-menu-demo').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');
 await page.screenshot({path:path.join(outputPath,slug+'-sidebar.png')});await page.mouse.move(1380,20);await expect(preview).toHaveCount(0);
 console.log(`PASS DOC ${slug}: live controls, author, ready frame, sidebar animation and release`);
}
