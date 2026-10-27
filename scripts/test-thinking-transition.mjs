import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=process.cwd(),out=path.join(root,'outputs/thinking-slower');
await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(root,'public/motion/thinking-particles.html'));
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:811}}),errors=[],frames=[],checks=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install({time:new Date('2026-10-23T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-23T00:00:01Z'));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.evaluate(()=>document.fonts.ready);
 let time=0,row=0;
 for(const start of [2.53,6.52,10,15.78]){
  const samples=[];
  for(const [column,phase] of [.20,.45,.75,1.15].entries()){
   const target=Math.round((start+phase)*1000);
   await page.clock.runFor(target-time);time=target;
   const pixels=await page.locator('.tp-canvas').evaluate(n=>n.toDataURL());samples.push(pixels);
   const png=await page.locator('.tp-canvas').screenshot();
   frames.push({input:await sharp(png).resize(420,398).png().toBuffer(),left:column*420,top:row*428+30});
   const title=Buffer.from(`<svg width="420" height="30"><rect width="100%" height="100%" fill="white"/><text x="12" y="21" font-family="Arial" font-size="15">Transition ${row+1}: +${phase.toFixed(2)}s</text></svg>`);
   frames.push({input:title,left:column*420,top:row*428});
  }
  assert.equal(new Set(samples).size,4,'Each transition visibly changes throughout travel and settling');
  checks.push({start,distinctFrames:4});row++;
 }
 await sharp({create:{width:1680,height:1712,channels:3,background:'white'}}).composite(frames).jpeg({quality:92}).toFile(path.join(out,'transition-phases.jpg'));
 await page.getByRole('button',{name:'Pause thinking',exact:true}).click();
 const frozen=await page.locator('.tp-canvas').evaluate(n=>n.toDataURL()),clock=await page.locator('.tp-clock').innerText();
 await page.clock.runFor(1200);
 assert.equal(await page.locator('.tp-canvas').evaluate(n=>n.toDataURL()),frozen);
 assert.equal(await page.locator('.tp-clock').innerText(),clock);
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({checks,pauseFreezesPixelsAndClock:true,pageErrors:errors},null,2));
 console.log('PASS: four slower morphs sampled at 0.20/0.45/0.75/1.15s; pause freezes pixels and timer.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
