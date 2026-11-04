import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const out='outputs/gabriell-focus-20261105/easing';await fs.mkdir(out,{recursive:true});
const observed=[1007,999,985,967,947,926,905,885,867,851,837,824,814,806,799,793,789,786,784,783,782,782,782,782,783,783,784,785,785,785,786,786,787,787,788,788,788,788,788];
const html=await fs.readFile('public/motion/stacked-metadata.html','utf8');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    let time=0,id=0;const frames=new Map();
    Object.defineProperty(performance,'now',{value:()=>time});
    window.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};window.cancelAnimationFrame=id=>frames.delete(id);
    window.__advance=timeTo=>{time=timeTo;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(time));};
    window.__pendingFrames=()=>frames.size;
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);await expect(page.locator('.sm-scene')).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);
  const row=page.locator('.sm-row').first(),box=await row.boundingBox();
  const read=()=>row.evaluate(n=>({phase:Number(n.style.getPropertyValue('--sm-phase')),titleRight:n.querySelector('.sm-title').getBoundingClientRect().right,tags:[...n.querySelectorAll('.sm-tag')].map(t=>t.getBoundingClientRect().x)}));
  const rest=await read();await page.mouse.move(box.x+60,box.y+40);
  const trace=[];
  for(let i=0;i<observed.length;i++){
    const time=(i+.333)*1000/60;await page.evaluate(t=>window.__advance(t),time);const current=await read();
    const designDisplacement=rest.tags[0]-current.tags[0],sourceDisplacement=(1008-observed[i])/2;
    trace.push({frame:14+i,time,reference:sourceDisplacement,rendered:designDisplacement,phase:current.phase});
    assert(Math.abs((rest.tags[1]-current.tags[1])*2-designDisplacement)<.1,'date and priority use one synchronized spring');
    assert(Math.abs(current.tags[2]-rest.tags[2])<.01,'last tag remains anchored throughout');
    assert(Math.abs(rest.titleRight-current.titleRight-designDisplacement)<.1,'title clipping follows the same spring');
    if([4,12,21,38].includes(i))await page.screenshot({path:out+`/actual-frame-${14+i}.png`});
  }
  const rms=Math.sqrt(trace.reduce((s,t)=>s+(t.rendered-t.reference)**2,0)/trace.length);assert(rms<.3,`browser trajectory RMS ${rms}`);
  await page.evaluate(()=>window.__advance(1000));assert.equal(await page.evaluate(()=>window.__pendingFrames()),0,'settled spring stops scheduling');
  await page.mouse.move(1,1);
  // Closing has the same acceleration and small overshoot, with the signs reversed.
  const closing=[];
  for(let i=1;i<=42;i++){await page.evaluate(t=>window.__advance(t),1000+i*1000/60);closing.push((await read()).phase);}
  assert(Math.min(...closing)<-.025,'closing passes the stacked destination before returning');await page.evaluate(()=>window.__advance(2000));
  await page.mouse.move(box.x+60,box.y+40);await page.evaluate(()=>window.__advance(2080));const before=await read();await page.mouse.move(1,1);const atReverse=await read();await page.evaluate(()=>window.__advance(2081));const after=await read();
  assert.equal(before.phase,atReverse.phase,'interrupting never jumps position');assert(after.phase>atReverse.phase,'retargeting preserves outward velocity');
  await page.evaluate(()=>window.__advance(3200));assert.equal(await page.evaluate(()=>window.__pendingFrames()),0);assert.deepEqual(errors,[]);
  const report={rmsDesignPixels:rms,peak:Math.max(...trace.map(t=>t.phase)),closingPeak:Math.min(...closing),continuousReverse:true,trace};await fs.writeFile(out+'/browser-trajectory.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,trace:undefined},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
