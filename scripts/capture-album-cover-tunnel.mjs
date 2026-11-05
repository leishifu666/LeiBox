import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';
const html=await fs.readFile('public/motion/album-cover-tunnel.html','utf8'),out='outputs/album-tunnel-20261105/capture';await fs.mkdir(out,{recursive:true});
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(req.url==='/poster'?html.replace('<html','<html data-leibox-motion-preview'):html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:675}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:'+server.address().port;
 await page.goto(base+'/poster');await expect(page.locator('.aw-scene')).toHaveAttribute('data-ready','true');await page.evaluate(()=>window.__albumTunnel.update({paused:true,active:0}));await expect(page.locator('.aw-scene')).toHaveAttribute('data-active','0');await page.screenshot({path:'public/assets/components/album-cover-tunnel.png'});
 await page.goto(base);await expect(page.locator('.aw-scene')).toHaveAttribute('data-ready','true');await page.evaluate(()=>window.__albumTunnel.update({autoTravel:false,paused:true}));await page.screenshot({path:out+'/dark.png'});
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:840});await page.evaluate(()=>window.__albumTunnel.update({paused:false,active:47}));await expect(page.locator('.aw-scene')).toHaveAttribute('data-active','47',{timeout:15000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+`/standalone-${width}.png`});}
 assert.deepEqual(errors,[]);console.log('Captured matching light poster, dark presentation and 375/768/1440 views with 55 covers.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
