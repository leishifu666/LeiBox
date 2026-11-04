import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const out='outputs/gabriell-focus-20261105/capture';await fs.mkdir(out,{recursive:true});
const html=await fs.readFile('public/motion/stacked-metadata.html','utf8');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(req.url==='/poster'?html.replace('<html','<html data-leibox-motion-preview'):html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/poster');await expect(page.locator('.sm-scene')).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);await page.mouse.move(1,1);await page.screenshot({path:'public/assets/components/stacked-metadata.png'});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.mouse.move(1,1);await page.screenshot({path:out+'/rest.png'});
  for(let i=0;i<3;i++){await page.locator('.sm-row').nth(i).hover();await page.waitForTimeout(340);await page.screenshot({path:out+`/overshoot-${i}.png`});await expect(page.locator('.sm-scene')).toHaveAttribute('data-running','false');await page.screenshot({path:out+`/expanded-${i}.png`});}
  const metrics=await page.locator('.sm-row').first().evaluate(n=>({row:n.getBoundingClientRect().toJSON(),tags:[...n.querySelectorAll('.sm-tag')].map(t=>({text:t.textContent,rect:t.getBoundingClientRect().toJSON()}))}));await fs.writeFile(out+'/metrics.json',JSON.stringify(metrics,null,2));
  for(const width of[375,768,1440]){await page.setViewportSize({width,height:840});await page.reload();await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('.sm-row').first().hover();await expect(page.locator('.sm-scene')).toHaveAttribute('data-running','false');await page.screenshot({path:out+`/standalone-${width}.png`});}
  assert.deepEqual(errors,[]);console.log('Captured matching poster, rest, three expanded rows and three widths.');
} finally {await browser.close();await new Promise(r=>server.close(r));}
