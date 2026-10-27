import assert from 'node:assert/strict';

// Verify rendered poses and wheel input, not just the driver's state attributes.
export async function verifySailingBoat(page,{surface=page,iframe}={}) {
 const root=surface.locator('.st-demo'),ship=surface.locator('.st-ship'),scroller=surface.locator('.st-scroll');
 const boxOf=async locator=>{
  if(!iframe)return locator.boundingBox();
  const outer=await iframe.boundingBox(),local=await locator.evaluate(n=>({rect:n.getBoundingClientRect().toJSON(),width:n.ownerDocument.defaultView.innerWidth}));
  const scale=outer.width/local.width;
  return {x:outer.x+local.rect.x*scale,y:outer.y+local.rect.y*scale,width:local.rect.width*scale,height:local.rect.height*scale};
 };
 const entry=surface.locator('.st-link').nth(4);
 if(iframe){const box=await boxOf(entry);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}else await entry.click();
 await surface.locator('.st-demo[data-moving=false]').waitFor();
 const poses=await ship.evaluate(async node=>{
  const samples=[];
  for(let i=0;i<6;i++){samples.push(getComputedStyle(node).transform);await new Promise(resolve=>setTimeout(resolve,100));}
  return samples;
 });
 assert(new Set(poses).size>3,'the visible boat gently rocks while the document rests');
 const before=await scroller.evaluate(n=>n.scrollTop);
 const box=await boxOf(surface.locator('.st-article')),scrollBox=await boxOf(scroller);
 const viewport=page.viewportSize();
 await page.mouse.move(box.x+box.width/2,Math.min(viewport.height-30,Math.max(30,scrollBox.y+scrollBox.height/2)));
 await page.mouse.wheel(0,260);
 await page.waitForTimeout(140);
 const forward=await ship.evaluate(n=>({yaw:Number(n.style.transform.match(/rotateY\(([-\d.]+)/)[1]),top:n.closest('.st-demo').querySelector('.st-scroll').scrollTop}));
 assert(forward.top>before+200,'real wheel input scrolls the article');
 assert.equal(await root.getAttribute('data-active'),'4','the wheel test stays inside one long section');
 assert(forward.yaw>8,`the boat turns with scrolling even without a section change (yaw ${forward.yaw})`);
 await page.waitForTimeout(650);
 await page.mouse.wheel(0,-180);await page.waitForTimeout(140);
 const reverse=await ship.evaluate(n=>Number(n.style.transform.match(/rotateY\(([-\d.]+)/)[1]));
 assert(reverse<-5,'scrolling upward reverses the boat turn');
 const ripples=await surface.locator('.st-wake ellipse').evaluateAll(nodes=>nodes.map(n=>({rx:n.getAttribute('rx'),opacity:n.style.opacity})));
 await page.waitForTimeout(250);
 assert.notDeepEqual(await surface.locator('.st-wake ellipse').evaluateAll(nodes=>nodes.map(n=>({rx:n.getAttribute('rx'),opacity:n.style.opacity}))),ripples,'water ripples expand and fade');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(50);
 const still=await ship.getAttribute('style');
 await page.waitForTimeout(200);assert.equal(await ship.getAttribute('style'),still,'reduced motion stops boat rocking');
 assert.equal(await ship.evaluate(n=>Number(n.style.transform.match(/rotateY\(([-\d.]+)/)[1])),0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 return {idleRocking:true,wheelWithinSection:true,reverseTurn:true,animatedWake:true,reducedMotionStill:true};
}
