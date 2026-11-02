const task=await taskSpace(44);const page=task.page("p2");const fs=await import("node:fs/promises");
async function shot(p,name){const out=await p.cdp("Page.captureScreenshot",{format:"png",fromSurface:true});await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/"+name,Buffer.from(out.data,"base64"));}
await page.click('[data-bg="dark"]',{label:"check revised transparent logo"});
await shot(page,"comparison-dark.png");
const dark=await page.evaluate(()=>({background:document.body.className,pressed:document.querySelector('[data-bg="dark"]').getAttribute("aria-pressed")}));
await page.click('[data-bg="white"]',{label:"restore white comparison background"});
const widths=[];
for(const width of [375,768]){
 await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:1100,deviceScaleFactor:1,mobile:false});
 widths.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,logoSizes:[...document.querySelectorAll(".hero svg")].map(x=>({w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height})),allPass:window.logoRevision.allPass})));
 await shot(page,"comparison-"+width+".png");
}
await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1200,deviceScaleFactor:1,mobile:false});
await page.focus('[data-bg="white"]');await page.keyboard.press("Tab");
const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/ui-validation.json",JSON.stringify({dark,widths,focus},null,2),"utf8");
console.log({dark,widths,focus});
const site=await task.newPage();
await site.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await site.goto("http://127.0.0.1:3000/components");
await site.waitForFunction(()=>[...document.querySelectorAll('img[alt="LeiBox"]')].some(x=>x.complete&&x.naturalWidth>0),undefined,{timeout:10000});
console.log({sitePage:site.label,logos:await site.evaluate(()=>[...document.querySelectorAll('img[alt="LeiBox"]')].map(x=>({src:x.getAttribute("src"),width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,filter:getComputedStyle(x).filter,loaded:x.complete})))});
await shot(site,"site-1440.png");
console.log(await site.snapshot());

