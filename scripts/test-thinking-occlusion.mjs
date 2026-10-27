import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
const root=process.cwd(),out=path.join(root,'outputs/thinking-occlusion');
await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(root,'public/motion/thinking-particles.html'));
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:811}}),frames=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install({time:new Date('2026-10-23T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-23T00:00:01Z'));
 let row=0;
 for(const [name,time] of [['bricks',8000],['gift',17000]]){
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>document.fonts.ready);
  await page.clock.runFor(time);await page.getByRole('button',{name:'Pause thinking',exact:true}).click();
  assert.equal(await page.locator('.tp-visual').getAttribute('data-shape'),name);
  const pixels=[];
  for(const [column,steps] of [-3,0,3].entries()){
   const canvas=page.locator('.tp-canvas');await canvas.press('Home');
   for(let i=0;i<Math.abs(steps);i++)await canvas.press(steps<0?'ArrowLeft':'ArrowRight');
   const png=await canvas.screenshot();pixels.push(await canvas.evaluate(n=>n.toDataURL()));
   await fs.writeFile(path.join(out,`${name}-${steps}.png`),png);
   frames.push({input:await sharp(png).resize(420,398).png().toBuffer(),left:column*420,top:row*428+30});
   frames.push({input:Buffer.from(`<svg width="420" height="30"><rect width="100%" height="100%" fill="white"/><text x="12" y="21" font-family="Arial" font-size="15">${name}: rotation ${(steps*.18).toFixed(2)}</text></svg>`),left:column*420,top:row*428});
  }
  assert.equal(new Set(pixels).size,3,'All three inspected angles change the actual rendered geometry');row++;
 }
 assert.deepEqual(errors,[]);
 await sharp({create:{width:1260,height:856,channels:3,background:'white'}}).composite(frames).jpeg({quality:94}).toFile(path.join(out,'angles.jpg'));
 console.log('PASS: bricks and gift render at three keyboard-controlled angles without script errors. Inspect outputs/thinking-occlusion/angles.jpg for occlusion.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
