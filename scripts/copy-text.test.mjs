import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {build} from 'esbuild';
import {chromium,expect} from 'playwright/test';

const command='npx skills add https://leibox.pantoria.cn --skill leibox';
let server,browser,context,port,moduleSource;
test.before(async()=>{
 moduleSource=(await build({entryPoints:['src/lib/copy-text.ts'],bundle:true,write:false,format:'esm',logLevel:'silent'})).outputFiles[0].text;
 server=http.createServer((req,res)=>{
  if(req.url==='/copy.js'){res.setHeader('content-type','text/javascript');res.end(moduleSource);return;}
  res.setHeader('content-type','text/html');
  res.end(`<!doctype html><meta charset="utf-8"><p id="selection">Keep this selection</p><button id="copy">Copy command</button><button id="async">Copy deferred source</button><script type="module">
   import {copyText} from '/copy.js';
   for(const id of ['copy','async'])document.getElementById(id).onclick=async event=>{
    const button=event.currentTarget;try{await copyText(id==='async'?new Promise(resolve=>setTimeout(()=>resolve(${JSON.stringify(command)}),40)):${JSON.stringify(command)});button.dataset.status='copied';}catch{button.dataset.status='failed';}
   };
   document.body.dataset.ready='true';
  </script>`);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));port=server.address().port;
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--host-resolver-rules=MAP leibox-copy.test 127.0.0.1','--no-proxy-server']});
 context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
});
test.after(async()=>{await context?.close();await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});
async function open(host='127.0.0.1'){
 const page=await context.newPage();await page.goto(`http://${host}:${port}`);await expect(page.locator('body')).toHaveAttribute('data-ready','true');return page;
}
async function clipboardText(){const reader=await open();try{return await reader.evaluate(()=>navigator.clipboard.readText());}finally{await reader.close();}}

test('public HTTP without navigator.clipboard copies the exact command and restores focus/selection',async()=>{
 const page=await open('leibox-copy.test');
 try{
  assert.deepEqual(await page.evaluate(()=>({secure:isSecureContext,clipboard:typeof navigator.clipboard})),{secure:false,clipboard:'undefined'});
  await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.getElementById('selection'));getSelection().removeAllRanges();getSelection().addRange(range);});
  await page.locator('#copy').click();await expect(page.locator('#copy')).toHaveAttribute('data-status','copied');
  assert.deepEqual(await page.evaluate(()=>({active:document.activeElement.id,selection:getSelection().toString(),temporaryFields:document.querySelectorAll('textarea').length})),{active:'copy',selection:'Keep this selection',temporaryFields:0});
  assert.equal(await clipboardText(),command);
 }finally{await page.close();}
});
test('modern clipboard writes immediate and deferred source from real user clicks',async()=>{
 const page=await open();
 try{
  for(const id of ['copy','async']){await page.bringToFront();await page.locator('#'+id).click();await expect(page.locator('#'+id)).toHaveAttribute('data-status','copied');assert.equal(await clipboardText(),command);}
 }finally{await page.close();}
});
test('an explicit modern API denial stays a failure and never uses legacy copy',async()=>{
 const page=await open();
 try{
  await page.evaluate(()=>{window.legacyCalls=0;document.execCommand=()=>{window.legacyCalls++;return true;};navigator.clipboard.writeText=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));});
  await page.locator('#copy').click();await expect(page.locator('#copy')).toHaveAttribute('data-status','failed');assert.equal(await page.evaluate(()=>window.legacyCalls),0);
 }finally{await page.close();}
});
test('a rejected legacy operation reports failure and removes its temporary field',async()=>{
 const page=await open('leibox-copy.test');
 try{
  await page.evaluate(()=>document.execCommand=()=>false);await page.locator('#copy').click();await expect(page.locator('#copy')).toHaveAttribute('data-status','failed');assert.equal(await page.locator('textarea').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.id),'copy');
 }finally{await page.close();}
});
