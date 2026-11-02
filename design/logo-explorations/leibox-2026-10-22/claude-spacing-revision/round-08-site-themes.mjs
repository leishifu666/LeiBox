const task=await taskSpace(44);const page=task.page("p3");const fs=await import("node:fs/promises");
async function shot(name){const r=await page.cdp("Page.captureScreenshot",{format:"png",fromSurface:true});await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/"+name,Buffer.from(r.data,"base64"));}
await page.click('loc=role:button[name="切换深色模式"]',{label:"check white logo dark theme"});
await page.waitForFunction(()=>document.documentElement.classList.contains("dark"),undefined,{timeout:5000});
const dark=await page.evaluate(()=>({theme:document.documentElement.className,logos:[...document.querySelectorAll('img[alt="LeiBox"]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,filter:getComputedStyle(x).filter}))}));
await shot("site-dark-1440.png");
const restore=await page.evaluate(()=>[...document.querySelectorAll("button")].map(b=>b.getAttribute("aria-label")).find(s=>s&&s.includes("切换")&&s.includes("模式")));
await page.click('button[aria-label="'+restore+'"]',{label:"restore light website theme"});
await page.waitForFunction(()=>!document.documentElement.classList.contains("dark"),undefined,{timeout:5000});
const widths=[];
for(const width of [375,768]){
 await page.cdp("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:false});
 const data=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,logos:[...document.querySelectorAll('img[alt="LeiBox"]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({loaded:x.complete&&x.naturalWidth>0,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,filter:getComputedStyle(x).filter}))}));
 widths.push(data);await shot("site-"+width+".png");
}
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/site-validation.json",JSON.stringify({dark,widths},null,2),"utf8");
console.log({dark,widths});

