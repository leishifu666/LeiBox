const task=await taskSpace(40);
const page=await task.newPage();
await page.cdp("Emulation.setDeviceMetricsOverride",{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
await page.goto("file:///F:/%E9%9B%B7%E5%B8%88%E5%82%85/ui%E7%BB%84%E4%BB%B6%E7%BD%91%E7%AB%99/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/index.html");
await page.waitForFunction(()=>window.logoGeometry?.variants?.every(x=>x.screen),undefined,{timeout:10000});
const report=await page.evaluate(()=>({allPass:window.logoGeometry.allPass,variants:window.logoGeometry.variants.map(({key,measured,screen,checks,minClearance})=>({key,measured,screen,checks,minClearance})),overflow:document.documentElement.scrollWidth>innerWidth}));
const fs=await import("node:fs/promises");
await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/geometry-1440.json",JSON.stringify(report,null,2),"utf8");
console.log({page:page.label,report});
console.log({screenshot:await page.screenshot({path:"F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/preview-1440.png"})});
console.log(await page.snapshot());

