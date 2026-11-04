import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const out='outputs/gabriell-20261105/capture';await fs.mkdir(out,{recursive:true});
const html=await fs.readFile('public/motion/transfer-glow.html','utf8');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(req.url==='/poster'?html.replace('<html','<html data-leibox-motion-preview'):html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1120,height:840}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:'+server.address().port;
 await page.goto(base+'/poster');await expect(page.locator('.tg-scene')).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);await page.mouse.move(1,1);await page.screenshot({path:'public/assets/components/transfer-glow.png'});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.tg-scrim')).toHaveCSS('opacity','1');await page.screenshot({path:out+'/confirm.png'});await page.locator('.tg-send').click();await expect.poll(()=>page.locator('.tg-scene').getAttribute('data-progress')).toMatch(/^0\.[234]/);await page.screenshot({path:out+'/processing.png'});await expect(page.locator('.tg-scene')).toHaveAttribute('data-state','success',{timeout:10000});await page.screenshot({path:out+'/success.png'});
 for(const width of[375,768,1440]){await page.setViewportSize({width,height:840});await page.reload();await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.tg-scrim')).toHaveCSS('opacity','1');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+`/standalone-${width}.png`});const modal=await page.locator('.tg-modal').boundingBox();assert(modal.x>=0&&modal.x+modal.width<=width,'modal fits actual viewport');}
 assert.deepEqual(errors,[]);console.log('Captured matching preview poster, three states and three widths.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
