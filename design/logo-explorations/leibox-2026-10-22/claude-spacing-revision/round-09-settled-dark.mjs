const task=await taskSpace(44);const page=task.page("p3");const fs=await import("node:fs/promises");
const label=await page.evaluate(()=>[...document.querySelectorAll("button")].map(b=>b.getAttribute("aria-label")).find(s=>s&&s.includes("切换")&&s.includes("模式")));
await page.click('button[aria-label="'+label+'"]',{label:"inspect persisted dark logo"});
await page.waitForFunction(()=>document.documentElement.classList.contains("dark"),undefined,{timeout:5000});
await page.reload();
await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await page.waitForFunction(()=>document.documentElement.classList.contains("dark")&&[...document.querySelectorAll('img[alt="LeiBox"]')].some(x=>x.complete&&x.naturalWidth>0),undefined,{timeout:10000});
const dark=await page.evaluate(()=>({dark:document.documentElement.classList.contains("dark"),background:getComputedStyle(document.body).backgroundColor,logos:[...document.querySelectorAll('img[alt="LeiBox"]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({filter:getComputedStyle(x).filter,loaded:x.complete}))}));
const shot=await page.cdp("Page.captureScreenshot",{format:"png",fromSurface:true});
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/site-dark-settled-1440.png",Buffer.from(shot.data,"base64"));
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/site-dark-validation.json",JSON.stringify(dark,null,2),"utf8");
const restore=await page.evaluate(()=>[...document.querySelectorAll("button")].map(b=>b.getAttribute("aria-label")).find(s=>s&&s.includes("切换")&&s.includes("模式")));
await page.click('button[aria-label="'+restore+'"]',{label:"restore light preview preference"});
await page.waitForFunction(()=>!document.documentElement.classList.contains("dark"),undefined,{timeout:5000});
console.log(dark);

