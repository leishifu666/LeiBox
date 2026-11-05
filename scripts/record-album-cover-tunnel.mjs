import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {chromium,expect} from 'playwright/test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MousePointer2} from 'lucide-react';

const root=process.cwd(),output=path.resolve('deliverables/album-cover-tunnel-20261105');await fs.mkdir(output,{recursive:true});
const ffmpeg=execFileSync('D:/python/python.exe',['-X','utf8','-c',`import sys;sys.path.insert(0,${JSON.stringify(path.join(root,'outputs/album-tunnel-20261105/runtime'))});import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())`],{encoding:'utf8'}).trim();
const html=await fs.readFile('public/motion/album-cover-tunnel.html','utf8'),duration=30,fps=60,total=duration*fps;
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--force-color-profile=srgb','--hide-scrollbars']});
const video=path.join(output,'album-cover-tunnel-30s-1080p.mp4'),log=[],screens=[];let encoder,encoderDone;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('http://127.0.0.1:'+server.address().port);await expect(page.locator('.aw-scene')).toHaveAttribute('data-ready','true');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
 await page.evaluate(()=>{window.__albumTunnel.update({autoTravel:false,active:47});const style=document.createElement('style');style.textContent='#hint{display:none!important}canvas{cursor:none!important;outline:none!important}';window.__albumTunnel.root.append(style);});
 await page.clock.runFor(5000);
 await expect(page.locator('.aw-scene')).toHaveAttribute('data-active','47');
 let neighbor;
 for(const [x,y] of [[.88,.9],[.14,.12],[.9,.83],[.18,.17],[.93,.96],[.06,.08]]){
  await page.mouse.move(x*1920,y*1080);await page.clock.runFor(150);
  const data=await page.locator('.aw-scene').evaluate(n=>({...n.dataset}));if(data.hovered!=='-1'&&data.hovered!==data.active&&data.hoveredLayer===data.activeLayer){neighbor={x:x*1920,y:y*1080};break;}
 }
 if(!neighbor)throw new Error('No visible cover found for the recorded click');
 await page.mouse.move(-20,-20);await page.clock.runFor(1000);
 const pointer=renderToStaticMarkup(createElement(MousePointer2,{size:34,strokeWidth:1.5,fill:'white',color:'#161617'}));
 await page.evaluate(pointer=>{
  const style=document.createElement('style');style.textContent='body{cursor:none!important}.rec-brand{position:fixed;left:48px;top:38px;z-index:100;color:#fff;font:500 20px system-ui,"Microsoft YaHei",sans-serif;letter-spacing:.04em;text-shadow:0 2px 12px #0008;pointer-events:none}.rec-brand span{opacity:.58;margin-left:12px;font-size:16px}.rec-label{position:fixed;bottom:38px;left:50%;transform:translateX(-50%);z-index:100;padding:11px 22px;border:1px solid #ffffff20;border-radius:99px;background:#080912a6;color:#fffc;font:400 21px system-ui,"Microsoft YaHei",sans-serif;backdrop-filter:blur(10px);pointer-events:none}.rec-pointer{position:fixed;left:0;top:0;z-index:120;width:36px;height:36px;filter:drop-shadow(0 2px 4px #0008);pointer-events:none}.rec-pointer[data-down=true]::after{content:"";position:absolute;left:-14px;top:-14px;width:40px;height:40px;border:2px solid #fff9;border-radius:50%}.rec-key{position:fixed;right:48px;bottom:38px;z-index:100;color:#fffc;font:400 18px system-ui;pointer-events:none}';document.head.append(style);
  const brand=document.createElement('div');brand.className='rec-brand';brand.innerHTML='LeiBox<span>雷师傅原创</span>';
  const label=document.createElement('div');label.className='rec-label';const cursor=document.createElement('div');cursor.className='rec-pointer';cursor.innerHTML=pointer;
  const key=document.createElement('div');key.className='rec-key';document.body.append(brand,label,cursor,key);window.__recordingUI={label,cursor,key};
 },pointer);
 encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-vf','scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=full:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium','-crf','21','-maxrate','18M','-bufsize','36M','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});
 let encoderLog='';encoder.stderr.on('data',x=>{encoderLog+=x;});encoderDone=once(encoder,'close');encoder.stdin.on('error',()=>{});
 const ease=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*ease(Math.max(0,Math.min(1,t)));
 const points=[{t:0,x:1820,y:970},{t:2.4,x:1820,y:970},{t:3.7,...neighbor},{t:9.7,...neighbor},{t:10.4,x:1110,y:600},{t:15.6,x:1110,y:600},{t:16.4,x:960,y:720},{t:18.8,x:960,y:510},{t:21,x:960,y:510},{t:22,x:1770,y:950},{t:30,x:1770,y:950}];
 let target;
 for(let i=0;i<total;i++){
  const t=i/fps;let a=points[0],b=points.at(-1);for(let j=1;j<points.length;j++)if(t<=points[j].t){a=points[j-1];b=points[j];break;}
  const x=mix(a.x,b.x,(t-a.t)/(b.t-a.t||1)),y=mix(a.y,b.y,(t-a.t)/(b.t-a.t||1));
  if(t>=2.4&&t<22)await page.mouse.move(x,y);
  if(i===360){target=await page.locator('.aw-scene').getAttribute('data-hovered');if(target==='-1')throw new Error('Recorded hover missed the cover');await page.mouse.click(x,y);}
  if(i===570)await expect(page.locator('.aw-scene')).toHaveAttribute('data-active',target);
  if(i>=660&&i<840&&i%6===0)await page.mouse.wheel(0,55);
  if(i===990)await page.mouse.down();if(i===1130)await page.mouse.up();
  if(i===1290)await page.keyboard.press('ArrowRight');if(i===1440)await page.keyboard.press('ArrowUp');
  const label=t<2.8?'专辑封面隧道':t<6?'悬停 · 吸起封面':t<10.5?'点击 · 飞入中央':t<16.2?'滚动 · 穿过专辑':t<21?'拖动 · 自由穿行':t<27?'方向键 · 连续切换':'雷师傅原创 · LeiBox';
  await page.evaluate(({x,y,t,label,down})=>{const ui=window.__recordingUI;ui.cursor.style.transform=`translate(${x}px,${y}px)`;ui.cursor.style.opacity=t>=2.4&&t<27?'1':'0';ui.cursor.dataset.down=String(down);if(ui.label.textContent!==label)ui.label.textContent=label;ui.key.textContent=t>=21.5&&t<23?'→':t>=24&&t<25.5?'↑':'';},{x,y,t,label,down:i>=990&&i<1130});
  await page.clock.runFor(1000/fps);
  const frame=await page.screenshot({type:'jpeg',quality:96});if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
  if(i%180===0){const data=await page.locator('.aw-scene').evaluate(n=>({...n.dataset}));log.push({frame:i,time:t,...data});console.log(`Rendered ${i}/${total}: ${label}`);}
  if([120,300,480,780,1080,1350,1620,1770].includes(i)){const file=path.join(output,`keyframe-${String(i).padStart(4,'0')}.jpg`);await fs.writeFile(file,frame);screens.push(path.basename(file));}
 }
 encoder.stdin.end();const [code]=await encoderDone;if(code!==0)throw new Error('Video encoding failed: '+encoderLog.slice(-1500));
 if(errors.length)throw new Error(errors.join('\n'));
 const info=spawn(ffmpeg,['-hide_banner','-i',video,'-f','null','-'],{stdio:['ignore','ignore','pipe']});let probe='';info.stderr.on('data',x=>probe+=x);await once(info,'close');
 if(!/Duration: 00:00:30\.00/.test(probe)||!probe.includes('1920x1080')||!/60 fps/.test(probe))throw new Error('Unexpected video metadata');
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({video,duration,fps,width:1920,height:1080,frames:total,realInteraction:true,coverCount:55,newCoverCount:8,chapters:['悬停吸起','点击飞入','滚轮穿行','反向拖动','方向键切换'],pageErrors:errors,keyframes:screens,samples:log,probe},null,2));console.log(JSON.stringify({video,duration,fps,frames:total}));
}finally{if(encoder&&!encoder.stdin.destroyed)encoder.stdin.end();await browser.close();await new Promise(r=>server.close(r));}
