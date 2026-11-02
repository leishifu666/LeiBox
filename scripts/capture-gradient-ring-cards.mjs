import http from 'node:http';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium,expect} from 'playwright/test';
import {interactionPreviewDocument} from '../src/components/common/interaction-preview-player.ts';
const out='outputs/basit-2114733820155134045',source=await fs.readFile('public/motion/gradient-ring-cards.html','utf8');
await fs.mkdir(out,{recursive:true});const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(req.url==='/preview'?interactionPreviewDocument(source,'gradient-ring-cards'):source);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1024},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url);await page.waitForFunction(()=>document.body.dataset.motionReady==='true');await expect(page.locator('.gr-scene')).toHaveAttribute('data-renderer','webgl');await page.screenshot({path:out+'/implementation-front.png'});
 await page.goto(url+'/preview');await page.waitForFunction(()=>document.body.dataset.motionReady==='true');await page.waitForTimeout(120);const poster=await page.screenshot();await sharp(poster).resize(960,720,{fit:'cover'}).png().toFile('public/assets/components/gradient-ring-cards.png');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1200);const motion=await page.screenshot({path:out+'/implementation-motion.png'});assert(!motion.equals(poster));assert.deepEqual(errors,[]);
 const fallback=await browser.newPage({viewport:{width:1280,height:1024},reducedMotion:'reduce'});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2'||type==='webgl')return null;return original.call(this,type,...args);};});await fallback.goto(url);await expect(fallback.locator('.gr-scene')).toHaveAttribute('data-renderer','fallback');await fallback.getByRole('button',{name:'Next card',exact:true}).click();await expect(fallback.locator('.gr-scene')).toHaveAttribute('data-active','rerank');await fallback.screenshot({path:out+'/fallback.png'});
 await fs.writeFile(out+'/capture.json',JSON.stringify({webgl:true,animated:true,fallbackNavigation:true,pageErrors:errors},null,2));console.log('Captured WebGL, matching poster, animation and working fallback.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
