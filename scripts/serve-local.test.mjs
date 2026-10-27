import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
test('exported pages and nested RSC segments resolve',async()=>{
 for(const url of ['/','/components','/docs','/docs/components/glass','/privacy']){
  const r=await fetch(base+url);assert.equal(r.status,200,url);assert.match(r.headers.get('content-type'),/text\/html/);
 }
 for(const url of ['/components/__next.!KHNoZWxsKQ.components.__PAGE__.txt?_rsc=test','/docs/components/glass/__next.!KHNoZWxsKQ.docs.components.glass.txt?_rsc=test']){
  const r=await fetch(base+url);assert.equal(r.status,200,url);assert.match(r.headers.get('content-type'),/text\/x-component/);assert.doesNotMatch((await r.text()).slice(0,100),/<!DOCTYPE html>/);
 }
});
test('removed playground is unavailable',async()=>{
 assert.equal((await fetch(base+'/playground')).status,404);
});
test('videos support range requests for playback and seeking',async()=>{
 const r=await fetch(base+'/assets/fallback-hero.mp4',{headers:{Range:'bytes=0-1023'}});assert.equal(r.status,206);assert.equal(Number(r.headers.get('content-length')),1024);assert.match(r.headers.get('content-range'),/^bytes 0-1023\//);assert.equal((await r.arrayBuffer()).byteLength,1024);
});
test('newsletter exercises local states without sending to a provider',async()=>{
 for(const [email,status,message] of [['',400,'Please enter your email address.'],['invalid',400,'Please enter a valid email address.'],['preview@example.test',200,undefined]]){
  const r=await fetch(base+'/api/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});assert.equal(r.status,status);const json=await r.json();if(message)assert.equal(json.error,message);else assert.deepEqual(json,{ok:true,localPreview:true});
 }
 const r=await fetch(base+'/api/subscribe',{method:'POST',headers:{'content-type':'application/json',origin:'https://external.example'},body:'{}'});assert.equal(r.status,403);
});
