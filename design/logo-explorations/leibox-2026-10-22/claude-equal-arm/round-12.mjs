const task=await taskSpace(40);const page=task.page("p2");
const fs=await import("node:fs/promises");
const exports=await page.evaluate(()=>window.logoGeometry.variants.map(v=>({key:v.key,svg:window.logoGeometry.buildSvg(v.key),viewBox:v.viewBox,points:v.points})));
await fs.mkdir("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/svg",{recursive:true});
for(const v of exports)await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/svg/leibox-logo-"+v.key+".svg",'<?xml version="1.0" encoding="UTF-8"?>\n'+v.svg+"\n","utf8");
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/exports.json",JSON.stringify(exports,null,2),"utf8");
await page.click('[data-bg="dark"]',{label:"check transparent L background"});
const dark=await page.evaluate(()=>({className:document.body.className,pressed:document.querySelector('[data-bg="dark"]').getAttribute("aria-pressed"),background:getComputedStyle(document.querySelector(".stage")).backgroundColor}));
await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-dark.png"});
await page.click('[data-bg="white"]',{label:"restore white logo background"});
const reports=[];
for(const width of [768,375]){
 await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:1100,deviceScaleFactor:1,mobile:false});
 const report=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,cards:document.querySelectorAll(".card").length,ratio:[...document.querySelectorAll(".main-preview svg")].map(svg=>{const n=svg.querySelector('[data-role="l-centerline"]').getAttribute("d").match(/-?\\d+(?:\\.\\d+)?/g).map(Number);const m=svg.getScreenCTM();const p=(x,y)=>new DOMPoint(x,y).matrixTransform(m);const a=p(n[0],n[1]),e=p(n[2],n[3]),b=p(n[4],n[5]);return Math.hypot(a.x-e.x,a.y-e.y)/Math.hypot(b.x-e.x,b.y-e.y);})}));
 reports.push(report);
 await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-"+width+".png"});
}
await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1600,deviceScaleFactor:1,mobile:false});
await page.click('[data-bg="white"]',{label:"focus background control"});
await page.keyboard.press("Tab");
const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/ui-validation.json",JSON.stringify({exported:exports.map(v=>v.key),dark,reports,focus,downloadEvent:"Ego browser download wait timed out; exported with the same buildSvg function instead"},null,2),"utf8");
console.log({dark,reports,focus,exported:exports.length});
console.log({screenshot:await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-six.png"})});

