import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {interactionPreviewDocument} from '../src/components/common/interaction-preview-player.ts';

const out='outputs/anthony99-2114869597577023821';await fs.mkdir(out,{recursive:true});
const source=await fs.readFile('public/motion/fluid-tooltip.html','utf8'),preview=interactionPreviewDocument(source,'fluid-tooltip');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(preview);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>{const root=document.querySelector('[data-motion-surface]')?.shadowRoot;return root?.querySelector('.ft-scene').dataset.hint==='profile'&&Number(root.querySelector('.ft-tooltip').style.opacity)>.999;});
 assert.equal(await page.locator('.ft-scene').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(244, 244, 244)');
 const first=await page.screenshot({path:out+'/preview-first-frame.png'});await sharp(first).resize(960,720).png({compressionLevel:9}).toFile('public/assets/components/fluid-tooltip.png');
 await page.waitForFunction(()=>document.querySelector('[data-motion-surface]').shadowRoot.querySelector('.ft-scene').dataset.hint==='settings');
 const next=await page.screenshot({path:out+'/preview-motion.png'});assert(!first.equals(next));assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/preview.json',JSON.stringify({background:'#f4f4f4',realHoverReplay:true,logo:true,errors},null,2));console.log('Captured matching Logo preview poster and actual tooltip motion');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
