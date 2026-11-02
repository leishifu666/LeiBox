const task=await taskSpace(40); const page=task.page("p1");
console.log(await page.evaluate(()=>({draft:document.querySelector('textarea[aria-label="消息输入"]')?.value,files:[...document.querySelectorAll('input[type="file"]')].map(x=>({accept:x.accept,multiple:x.multiple}))})));
await page.click('button[aria-label="添加附件"]',{label:"attach logo reference"});
console.log(await page.snapshot());

