import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),out=path.join(root,'outputs/thinking-redo');
await fs.mkdir(out,{recursive:true});
const server=http.createServer(async(req,res)=>{res.setHeader('content-type','text/html');res.end(await fs.readFile(path.join(root,'public/motion/thinking-particles.html')));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:811},deviceScaleFactor:1});
 await page.clock.install({time:new Date('2026-10-23T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-23T00:00:01Z'));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.evaluate(()=>document.fonts.ready);
 let previous=0;
 for(const time of [1.5,2.65,4,5.7,8,12,14,17,19.5,20.3,23.3]){
  await page.clock.runFor(Math.round((time-previous)*1000));previous=time;
  await page.screenshot({path:path.join(out,`new-${time}.png`)});
 }
 console.log('Captured eleven fixed-time frames for visual comparison.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
