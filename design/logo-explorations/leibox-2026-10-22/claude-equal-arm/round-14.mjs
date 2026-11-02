const task=await taskSpace(40);const page=task.page("p2");
const fs=await import("node:fs/promises");
const reports=[];
async function shot(name){try{const out=await page.cdp("Page.captureScreenshot",{format:"png",fromSurface:true});await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/"+name,Buffer.from(out.data,"base64"));return {name,captured:true};}catch(e){return {name,captured:false,error:String(e.message).slice(0,180)};}}
await page.click('[data-bg="dark"]',{label:"check dark transparent knockout"});
const dark=await page.evaluate(()=>({className:document.body.className,pressed:document.querySelector('[data-bg="dark"]').getAttribute("aria-pressed")}));
const darkShot=await shot("preview-dark.png");
await page.click('[data-bg="white"]',{label:"restore white logo background"});
for(const width of [768,375,1440]){
 await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:width===1440?1600:1100,deviceScaleFactor:1,mobile:false});
 const report=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,cards:document.querySelectorAll(".card").length,ratios:[...document.querySelectorAll(".main-preview svg")].map(svg=>{const n=svg.querySelector('[data-role="l-centerline"]').getAttribute("d").match(/[-0-9.]+/g).map(Number);const m=svg.getScreenCTM();const p=(x,y)=>new DOMPoint(x,y).matrixTransform(m);const a=p(n[0],n[1]),e=p(n[2],n[3]),b=p(n[4],n[5]);return Math.hypot(a.x-e.x,a.y-e.y)/Math.hypot(b.x-e.x,b.y-e.y);})}));
 report.capture=await shot(width===1440?"preview-six.png":"preview-"+width+".png");
 reports.push(report);
}
await page.focus('[data-bg="white"]');await page.keyboard.press("Tab");
const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/ui-validation.json",JSON.stringify({dark,darkShot,reports,focus,downloadEvent:"Ego download event timeout; six SVGs saved from the identical export function. Native download completion not confirmed."},null,2),"utf8");
console.log({dark,darkShot,reports,focus});

