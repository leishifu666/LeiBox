import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {expect} from 'playwright/test';
import sharp from 'sharp';

async function verifyScreenClipping(page,root,out,label,visible=true){
 await page.evaluate(()=>{window.__spiderMotionClock.pause();});
 const panes=await root.locator('.sm-pane').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return{x:rect.x,y:rect.y,w:rect.width,h:rect.height,r:parseFloat(getComputedStyle(node).borderTopLeftRadius)*rect.width/node.offsetWidth};}));
 const bounds=await root.locator('.sm-spider').boundingBox();
 const shown=await page.screenshot();
 await root.locator('.sm-spider').evaluate(node=>{node.style.visibility='hidden';});
 const hidden=await page.screenshot();
 await root.locator('.sm-spider').evaluate(node=>{node.style.visibility='';});
 const first=await sharp(shown).removeAlpha().raw().toBuffer({resolveWithObject:true}),second=await sharp(hidden).removeAlpha().raw().toBuffer();
 let inside=0,outside=0;
 for(let y=0;y<first.info.height;y++)for(let x=0;x<first.info.width;x++){
  if(x<bounds.x-10||x>bounds.x+bounds.width+10||y<bounds.y-10||y>bounds.y+bounds.height+10)continue;
  const offset=(y*first.info.width+x)*first.info.channels;
  if(Math.max(...[0,1,2].map(channel=>Math.abs(first.data[offset+channel]-second[offset+channel])))<12)continue;
  const inScreen=panes.some(pane=>{const px=x+.5,py=y+.5;if(px<pane.x-1||py<pane.y-1||px>pane.x+pane.w+1||py>pane.y+pane.h+1)return false;const cx=Math.max(pane.x+pane.r,Math.min(px,pane.x+pane.w-pane.r)),cy=Math.max(pane.y+pane.r,Math.min(py,pane.y+pane.h-pane.r));return Math.hypot(px-cx,py-cy)<=pane.r+1.5;});
  if(inScreen)inside++;else outside++;
 }
 assert.equal(outside,0,`${label}: no spider pixels cross the curved screen edge, bezel or hinge`);
 if(visible)assert(inside>30,`${label}: the actual rendered spider is visible inside the phone`);
 else assert.equal(inside,0,`${label}: the spider disappears completely behind the upper bezel`);
 await fs.writeFile(path.join(out,`${label}-clipping.json`),JSON.stringify({inside,outside,panes},null,2));
 if(label==='right-rest'||label==='left-rest')await fs.writeFile(path.join(out,`${label}.png`),shown);
 await page.evaluate(()=>{window.__spiderMotionClock.resume();});
 console.log(`CLIPPED ${label}: ${inside} screen pixels, ${outside} outside`);
}

export async function verifySpiderMusicPlayer(page,item,rootDir,outDir){
 const root=page.locator('#demo'),scene=root.locator('.sm-scene'),waitPhase=phase=>page.waitForFunction(phase=>document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector('.sm-scene').dataset.phase===phase,phase,{polling:'raf'});
 const out=path.join(outDir,'spider-music-player',item.framework);await fs.mkdir(out,{recursive:true});
 const holdCarry=async(backwards=false)=>page.waitForFunction(backwards=>{const root=document.querySelector('#demo [data-motion-surface]').shadowRoot,scene=root.querySelector('.sm-scene'),index=root.querySelector('.sm-cocoon').dataset.track,width=root.querySelector(`.sm-art[data-cover="${index}"]`)?.offsetWidth,main=root.querySelector('.sm-main-slot').offsetWidth;if(scene.dataset.phase==='carry'&&width>40&&width<main-5&&(backwards?width<main*.9:width>main*.2)){window.__spiderMotionClock.pause();return true;}return false;},backwards);
 await expect(scene).toHaveAttribute('data-ready','true');
 await expect(scene).toHaveAttribute('data-track','0');assert.equal(await root.locator('.sm-row').count(),8);
 assert.equal(await root.locator('.sm-leg .sm-femur').count(),8);assert.equal(await root.locator('.sm-leg .sm-tibia').count(),8);assert.equal(await root.locator('.sm-joint').count(),8,'all eight legs have tapered segments and individual knee joints');
 await verifyScreenClipping(page,root,out,'right-rest');
 const rightRest=Number(await scene.getAttribute('data-spider-x')),mainWidth=await root.locator('.sm-main-slot').evaluate(node=>node.offsetWidth);
 assert(await root.locator('.sm-art img').evaluateAll(images=>images.length===8&&images.every(image=>image.complete&&image.naturalWidth===600)),'eight real album covers decode from embedded image data');
 await page.evaluate(()=>{window.__smOriginal=[...document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelectorAll('.sm-art')];window.__smChanges=[];window.__update({onTrackChange:index=>window.__smChanges.push(index)});});
 await page.evaluate(()=>{
  window.__smMotion=[];
  const sample=()=>{const root=document.querySelector('#demo [data-motion-surface]')?.shadowRoot;if(!root)return;const scene=root.querySelector('.sm-scene'),device=root.querySelector('.sm-device'),spider=root.querySelector('.sm-spider').getBoundingClientRect(),left=root.querySelector('.sm-queue').getBoundingClientRect(),right=root.querySelector('.sm-now').getBoundingClientRect(),index=root.querySelector('.sm-cocoon').dataset.track,art=root.querySelector(`.sm-art[data-cover="${index}"]`),image=art?.getBoundingClientRect(),style=getComputedStyle(device),transform=art?new DOMMatrixReadOnly(getComputedStyle(art).transform):null;
   let endpoint=null;const thread=root.querySelector('.sm-thread');if(['wrap','carry'].includes(scene.dataset.phase)&&thread.getAttribute('d')){const end=thread.getPointAtLength(thread.getTotalLength()),point=new DOMPoint(end.x,end.y).matrixTransform(thread.getScreenCTM());endpoint=Math.hypot(point.x-image.x-image.width/2,point.y-image.y-image.height/2);}
   window.__smMotion.push({phase:scene.dataset.phase,from:scene.dataset.pullFrom,spider:spider.x+spider.width/2,divider:(left.right+right.left)/2,target:image?image.x+image.width/2:null,artX:transform?.e,artAngle:transform?Math.atan2(transform.b,transform.a)*180/Math.PI:0,impactX:parseFloat(style.getPropertyValue('--sm-impact-x'))||0,impactAngle:parseFloat(style.getPropertyValue('--sm-impact-angle'))||0,caseTransform:style.transform,endpoint});window.__smAuditFrame=requestAnimationFrame(sample);};sample();
 });
 const endpoint=async()=>root.locator('.sm-thread').evaluate(node=>{
  const end=node.getPointAtLength(node.getTotalLength()),point=new DOMPoint(end.x,end.y).matrixTransform(node.getScreenCTM());
  const surface=node.getRootNode(),index=surface.querySelector('.sm-scene').dataset.phase==='idle'?0:Number(surface.querySelector('.sm-cocoon').dataset.track??1);
  const rect=surface.querySelector(`.sm-art[data-cover="${index}"]`).getBoundingClientRect();
  return Math.hypot(point.x-rect.x-rect.width/2,point.y-rect.y-rect.height/2);
 });
 await root.getByRole('button',{name:'Next track',exact:true}).click();
 await waitPhase('wrap');await page.waitForTimeout(180);
 assert(Number(await scene.getAttribute('data-spider-x'))<rightRest-60,'the right spider crawls into the screen before pulling');
 if(item.framework==='react')await verifyScreenClipping(page,root,out,'right-fetch');
 assert((await root.locator('.sm-cocoon').getAttribute('d')).length>100,'real web grows around the source thumbnail');
 assert(await endpoint()<2,'thread endpoint tracks the actual cover centre');
 if(item.framework==='react')await page.screenshot({path:path.join(out,'next-wrap.png')});
 await holdCarry();
 const size=await root.locator('.sm-art[data-cover="1"]').evaluate(node=>node.offsetWidth);assert(size>38&&size<mainWidth,'same cover is between thumbnail and player dimensions');
 assert(await endpoint()<2,'thread follows the cover during its flight');
 if(item.framework==='react')await page.screenshot({path:path.join(out,'next-carry.png')});
 await page.evaluate(()=>{window.__spiderMotionClock.resume();});
 await expect(scene).toHaveAttribute('data-track','1');await expect(scene).toHaveAttribute('data-phase','idle');await page.waitForTimeout(350);
 assert.deepEqual(await page.evaluate(()=>window.__smChanges),[1],'one callback after one actual commit');
 await expect(root.locator('.sm-title')).toHaveText('After Hours');await expect(root.locator('.sm-row[data-track="1"]')).toHaveAttribute('aria-current','true');
 await expect(root.locator('.sm-source')).toHaveAttribute('href',/music\.apple\.com\/us\/album\/after-hours/);
 assert(await page.evaluate(()=>window.__smOriginal.every((node,index)=>node===document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector(`.sm-art[data-cover="${index}"]`))),'all original image nodes persist after the transfer');
 if(item.framework==='react')await verifyScreenClipping(page,root,out,'behind-bezel',false);
 await page.waitForTimeout(1350);const spiderAfter=await scene.getAttribute('data-spider-x');assert(Number(spiderAfter)<200,'spider walks to the opposite top corner');
 if(item.framework==='react')await verifyScreenClipping(page,root,out,'left-rest');
 await root.getByRole('button',{name:'Previous track',exact:true}).click();await waitPhase('wrap');await page.waitForTimeout(180);
 assert(Number(await scene.getAttribute('data-spider-x'))>Number(spiderAfter)+60,'the left spider crawls into the screen before returning the cover');
 if(item.framework==='react')await verifyScreenClipping(page,root,out,'left-fetch');
 assert((await root.locator('.sm-cocoon').getAttribute('d')).length>100,'previous wraps the large cover');
 if(item.framework==='react')await page.screenshot({path:path.join(out,'previous-wrap.png')});
 await holdCarry(true);
 assert(await root.locator('.sm-art[data-cover="1"]').evaluate(node=>node.offsetWidth)<mainWidth,'large cover actually shrinks back to its own queue slot');
 await page.evaluate(()=>{window.__spiderMotionClock.resume();});
 await expect(scene).toHaveAttribute('data-track','0');await expect(scene).toHaveAttribute('data-phase','idle');
 if(item.framework==='react'){
  // Repeat both directions after the idle handoff; the old alternation pulled its own screen.
  const trackedStep=async(action,index)=>{const mark=await page.evaluate(()=>window.__smMotion.length);await root.locator(`[data-action=${action}]`).click();await expect(scene).toHaveAttribute('data-track',String(index));await expect(scene).toHaveAttribute('data-phase','idle');const frames=await page.evaluate(mark=>window.__smMotion.slice(mark).filter(frame=>frame.phase==='wrap'),mark);assert(frames.length>0,'the requested transfer actually wraps the cover');assert(frames.every(frame=>frame.from===(action==='next'?'left':'right')),`${action} keeps its source screen at track ${index}`);};
  for(const [action,index] of [['next',1],['next',2],['previous',1],['previous',0]]){
   await page.waitForTimeout(1500);await trackedStep(action,index);
  }
  await page.evaluate(()=>window.__update({reducedMotion:true,track:7}));await expect(scene).toHaveAttribute('data-track','7');
  await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(root.locator('[data-motion-surface]')).toHaveAttribute('data-reduced-motion','false');
  await trackedStep('next',0);await trackedStep('previous',7);
  await page.evaluate(()=>window.__update({reducedMotion:true,track:0}));await expect(scene).toHaveAttribute('data-track','0');
  await page.evaluate(()=>window.__update({reducedMotion:false}));await expect(root.locator('[data-motion-surface]')).toHaveAttribute('data-reduced-motion','false');
 }
 await root.getByRole('button',{name:'Next track',exact:true}).click();await root.getByRole('button',{name:'Next track',exact:true}).click();await root.getByRole('button',{name:'Next track',exact:true}).click();
 await expect(scene).toHaveAttribute('data-track','3',{timeout:6000});await expect(scene).toHaveAttribute('data-phase','idle');
 await root.getByRole('button',{name:'Pause',exact:true}).click();const frozen=await root.locator('.sm-elapsed').innerText();await page.waitForTimeout(1100);assert.equal(await root.locator('.sm-elapsed').innerText(),frozen,'pause stops the progress timer');
 await root.getByRole('slider',{name:'Playback position'}).fill('45');await expect(root.locator('.sm-elapsed')).toHaveText('0:45');
 const like=root.getByRole('button',{name:'Like this track',exact:true}),wasLiked=await like.getAttribute('aria-pressed');await like.click();await expect(like).toHaveAttribute('aria-pressed',String(wasLiked!=='true'));
 for(const name of ['Shuffle','Repeat track']){const button=root.getByRole('button',{name,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');await button.click();}
 const search=root.getByRole('searchbox',{name:'Search songs or artists'});await search.fill('Frank Ocean');assert.equal(await root.locator('.sm-row:visible').count(),1);await search.fill('No such album');await expect(root.locator('.sm-empty')).toBeVisible();await search.fill('');assert.equal(await root.locator('.sm-row:visible').count(),8);
 await root.getByRole('button',{name:'Add a track',exact:true}).click();await root.getByRole('button',{name:'Add track',exact:true}).click();assert.equal(await root.locator('.sm-row').count(),8,'native required fields block an empty addition');
 await root.locator('.sm-add-title').fill('Night Window');await root.locator('.sm-add-artist').fill('Local demo');await root.getByRole('button',{name:'Add track',exact:true}).click();await expect(scene).toHaveAttribute('data-track','8');await expect(scene).toHaveAttribute('data-phase','idle');assert.equal(await root.locator('.sm-row').count(),9);
 await scene.focus();await scene.press('Home');await expect(scene).toHaveAttribute('data-track','0');await expect(scene).toHaveAttribute('data-phase','idle');
 const row=await root.locator('.sm-row[data-track="2"]').boundingBox();await page.touchscreen.tap(row.x+row.width*.38,row.y+row.height/2);await expect(scene).toHaveAttribute('data-track','2');await expect(scene).toHaveAttribute('data-phase','idle');
 await page.evaluate(()=>window.__update({reducedMotion:true,track:4,playing:false}));await expect(scene).toHaveAttribute('data-track','4');await expect(scene).toHaveAttribute('data-phase','idle');assert.equal(await root.locator('.sm-thread').getAttribute('d'),'');
 assert.equal(await root.locator('.sm-device').evaluate(node=>parseFloat(getComputedStyle(node).getPropertyValue('--sm-impact-x'))),0,'reduced motion immediately cancels case recoil');
 const identity=await page.evaluate(()=>window.__smOriginal.every((node,index)=>node===document.querySelector('#demo [data-motion-surface]').shadowRoot.querySelector(`.sm-art[data-cover="${index}"]`)));assert(identity,'identity survives forward, backward, rapid, touch and reduced-motion changes');
 await page.evaluate(()=>window.__update({reducedMotion:false,track:0,playing:true}));await expect(scene).toHaveAttribute('data-track','0');await expect(scene).toHaveAttribute('data-phase','idle');await page.waitForTimeout(400);
 const motion=await page.evaluate(()=>{cancelAnimationFrame(window.__smAuditFrame);return window.__smMotion;}),wrap=motion.filter(frame=>frame.phase==='wrap');
 assert(wrap.some(frame=>frame.from==='left')&&wrap.some(frame=>frame.from==='right'));
 assert(wrap.every(frame=>(frame.spider-frame.divider)*(frame.target-frame.divider)<0),'every web wrap pulls a cover on the opposite screen, including repeated and wrapped track requests');
 assert(motion.some(frame=>Math.abs(frame.impactX)>1)&&motion.some(frame=>Math.abs(frame.impactAngle)>.1),'the rendered case translates and rotates during landing recoil');
 assert(new Set(motion.filter(frame=>Math.abs(frame.impactX)>1).map(frame=>frame.caseTransform)).size>3,'case vibration changes the real computed transform across frames');
 assert(wrap.some(frame=>Math.abs(frame.artAngle)>.3),'the actual cover shakes before leaving its slot');
 assert(motion.filter(frame=>frame.endpoint!==null).every(frame=>frame.endpoint<2),'web endpoint follows the shaking and transported cover while the case recoils');
 await fs.writeFile(path.join(out,'cross-pull-motion.json'),JSON.stringify(motion,null,2));
 await fs.writeFile(path.join(out,'behaviour.json'),JSON.stringify({framework:item.framework,realCovers:8,identity,forward:true,reverse:true,crossScreenOnly:true,coverShake:true,caseRecoil:true,webEndpoint:true,webGrowth:true,spiderWalk:true,screenClipping:true,articulatedLegs:8,inwardCrawl:true,rapidLastRequest:true,pause:true,seek:true,like:true,search:true,addValidation:true,keyboard:true,touch:true,reducedMotion:true,callbacks:await page.evaluate(()=>window.__smChanges)},null,2));
}
