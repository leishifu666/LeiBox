import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const out='outputs/shader-flood-20261103/capture';await fs.mkdir(out,{recursive:true});
const html=await fs.readFile('public/motion/shader-flood.html','utf8');
const server=http.createServer((request,response)=>{response.setHeader('content-type','text/html');response.end(request.url==='/poster'?html.replace('<html','<html data-leibox-motion-preview'):html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1120,height:720},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/poster');await expect(page.locator('.sf-scene')).toHaveAttribute('data-ready','true');await expect(page.locator('.sf-card').first()).toHaveAttribute('data-progress','1.0000');await expect(page.locator('.sf-scene')).toHaveAttribute('data-renderer','webgl');
 await page.screenshot({path:'public/assets/components/shader-flood.png'});
 await page.goto('http://127.0.0.1:'+server.address().port);await expect(page.locator('.sf-scene')).toHaveAttribute('data-ready','true');
 for(const width of[375,768,1440]){await page.setViewportSize({width,height:1000});await page.mouse.move(1,1);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`standalone-${width}.png`)});}
 assert.deepEqual(errors,[]);console.log('Captured matching first-frame poster and three responsive sizes.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
