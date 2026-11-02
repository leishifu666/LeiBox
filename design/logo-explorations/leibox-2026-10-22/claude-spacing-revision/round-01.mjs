const task=await taskSpace("LeiBox L spacing revision Claude 20261022");
const page=task.page("p1");
await page.goto("https://hark.com/project/bb8312f5-3b32-46b5-b6d5-eec50a18d3a0");
console.log({spaceId:task.spaceId,url:await page.url()});
console.log(await page.snapshot());

