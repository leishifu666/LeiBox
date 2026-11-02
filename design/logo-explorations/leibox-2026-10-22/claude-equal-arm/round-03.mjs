const task=await taskSpace(40); const page=task.page("p1");
await page.setInputFiles('input[type="file"]',["F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/l-six-variants/01-balanced.png"]);
console.log(await page.snapshot());

