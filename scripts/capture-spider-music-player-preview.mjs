import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {interactionPreviewDocument} from '../src/components/common/interaction-preview-player.ts';

const out='outputs/desdivj-2114305692547043677';
await fs.mkdir(out,{recursive:true});
const source=await fs.readFile('public/motion/spider-music-player.html','utf8');
const preview=interactionPreviewDocument(source,'spider-music-player');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url==='/preview'?preview:source);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/preview`);
 await page.locator('.sm-scene[data-ready=true]').waitFor();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-motion-surface]').shadowRoot.querySelector('.sm-scene')).backgroundColor==='rgb(244, 244, 244)');
 const poster=await page.screenshot({path:out+'/preview-first-frame.png'});
 await sharp(poster).resize(960,720).png({compressionLevel:9}).toFile('public/assets/components/spider-music-player.png');
 await page.locator('.sm-scene[data-phase=carry]').waitFor();await page.waitForTimeout(100);
 const motion=await page.screenshot({path:out+'/preview-motion.png'});assert(!poster.equals(motion),'hover preview performs the actual transfer');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/preview.json',JSON.stringify({background:'#f4f4f4',firstFrame:true,automaticTransfer:true,errors},null,2));
 console.log('Captured matching poster and actual animated preview');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
