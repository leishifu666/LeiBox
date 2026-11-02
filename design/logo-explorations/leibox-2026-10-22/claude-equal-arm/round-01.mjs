const task = await taskSpace("LeiBox equal-arm logo Claude 20261022");
const page=task.page("p1");
await page.goto("https://hark.com/projects/new");
console.log({spaceId:task.spaceId,url:await page.url()});
console.log(await page.snapshot());

