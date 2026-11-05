import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from 'playwright/test';

const html=await fs.readFile('public/motion/multi-cursor-builder.html','utf8');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(html.replace('<html','<html data-leibox-motion-preview'));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true,ignoreDefaultArgs:['--hide-scrollbars']});
try{
 const page=await browser.newPage({viewport:{width:1120,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await expect(page.locator('.mc-scene')).toHaveAttribute('data-ready','true');
 await page.locator('.mc-port').evaluate(n=>n.scrollTo({top:220,behavior:'instant'}));
 await expect.poll(()=>page.locator('.art').first().evaluate(n=>Number(n.style.opacity)),{timeout:20000}).toBe(1);
 await expect.poll(()=>page.locator('.mc-scene').getAttribute('data-frame')).not.toBe('0');
 await page.locator('.mc-port').focus();await page.locator('.mc-port').press('Space');await expect(page.locator('.mc-scene')).toHaveAttribute('data-running','false');
 await page.locator('.mc-port').blur();await page.screenshot({path:'public/assets/components/multi-cursor-builder.png'});assert.deepEqual(errors,[]);
 console.log('Captured live native construction with matching gray preview surface.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
