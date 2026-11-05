import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright/test';
const [original,core]=await Promise.all([fs.readFile('public/motion/album-cover-tunnel-original.html','utf8'),fs.readFile('src/lib/motion-core/album-cover-tunnel.mjs','utf8')]);
for(const [start,end] of [['  c.fl = {','\nconst ease ='],['const ease =','\nfunction onClick'],['  const newHero =','\n  // 2)'],['    if (c.fl) {','\n    const r =']]){
 const reference=original.slice(original.indexOf(start),original.indexOf(end,original.indexOf(start)));
 assert(reference.length>20&&core.includes(reference),'native motion preserves the supplied HTML algorithm: '+start.trim());
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:675}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/motion/album-cover-tunnel-original.html');await page.waitForFunction(()=>window.__api&&window.__api.hero.s>1.65);
 assert.equal(await page.evaluate(()=>new Set(window.__api.covers.map(c=>c.tex)).size),55);
 let point;
 for(const [x,y] of [[.88,.9],[.14,.12],[.9,.83],[.18,.17]]){await page.mouse.move(x*1200,y*675);await page.waitForTimeout(120);if(await page.evaluate(()=>window.__api.hovered&&window.__api.hovered!==window.__api.hero&&window.__api.hovered.L===window.__api.hero.L)){point={x:x*1200,y:y*675};break;}}
 assert(point,'a same-layer neighbor is visible');
 await page.evaluate(()=>{const outgoing=window.__api.hero,began=performance.now();window.__originalTarget=window.__api.hovered;window.__originalTransition=[];window.__originalTransitionDone=false;const sample=()=>{window.__originalTransition.push({time:performance.now()-began,x:outgoing.x,y:outgoing.y,scale:outgoing.s,z:outgoing.zo,flying:!!outgoing.fl});if(performance.now()-began<1800)requestAnimationFrame(sample);else window.__originalTransitionDone=true;};sample();});
 await page.mouse.click(point.x,point.y);await page.mouse.move(-20,-20);await page.waitForFunction(()=>window.__originalTransitionDone);
 const poses=await page.evaluate(()=>window.__originalTransition);assert(poses.at(-1).scale<1.05);assert(poses.filter(p=>p.flying).length>3);assert(Math.hypot(poses.at(-1).x-poses[0].x,poses.at(-1).y-poses[0].y)>2);
 assert(await page.evaluate(()=>window.__api.hero===window.__originalTarget&&window.__api.hero.s>1.6));assert.deepEqual(errors,[]);
 const result={images:55,frames:poses.length,originalMotion:true,nativeMotionMatchesHtml:true,errors,poses};await fs.writeFile('outputs/album-tunnel-20261105/original-motion-restored/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,poses:undefined}));
}finally{await browser.close();}
