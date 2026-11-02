const task=await taskSpace(40);const page=task.page("p2");
const fs=await import("node:fs/promises");
const keys=["01-balanced","02-flat","03-bold","04-thin","05-sharp","06-compact"];
const downloads=[];
for(const key of keys){
 const pending=page.waitForEvent("download",{timeout:10000});
 await page.click('[data-download="'+key+'"]',{label:"download vector logo"});
 const dl=await pending;
 const name=dl.suggestedFilename();
 await dl.saveAs("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/svg/"+name);
 downloads.push({key,file:name});
}
await page.click('[data-bg="dark"]',{label:"check knockout dark background"});
const dark=await page.evaluate(()=>({className:document.body.className,pressed:document.querySelector('[data-bg="dark"]').getAttribute("aria-pressed"),stageBackground:getComputedStyle(document.querySelector(".stage")).backgroundColor}));
console.log({downloads,dark});
console.log({screenshot:await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-dark.png"})});
await page.click('[data-bg="white"]',{label:"restore white logo background"});
const reports=[];
for(const width of [768,375]){
 await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:1100,deviceScaleFactor:1,mobile:false});
 const report=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,cards:document.querySelectorAll(".card").length,ratio:[...document.querySelectorAll(".main-preview svg")].map(svg=>{const n=svg.querySelector('[data-role="l-centerline"]').getAttribute("d").match(/-?\\d+(?:\\.\\d+)?/g).map(Number);const m=svg.getScreenCTM();const p=(x,y)=>new DOMPoint(x,y).matrixTransform(m);const a=p(n[0],n[1]),e=p(n[2],n[3]),b=p(n[4],n[5]);return Math.hypot(a.x-e.x,a.y-e.y)/Math.hypot(b.x-e.x,b.y-e.y);})}));
 reports.push(report);
 await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-"+width+".png"});
}
await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1600,deviceScaleFactor:1,mobile:false});
await page.keyboard.press("ControlOrMeta+Home");
await page.keyboard.press("Tab");
const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/ui-validation.json",JSON.stringify({downloads,dark,reports,focus},null,2),"utf8");
console.log({reports,focus});
console.log({screenshot:await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-six.png"})});

