const task=await taskSpace(40);const page=task.page("p1");
await page.waitForFunction(()=>[...document.querySelectorAll("pre")].some(x=>x.innerText.includes("</html>")),undefined,{timeout:45000}).catch(()=>console.log({waiting:true}));
console.log(await page.snapshot({scope:"full_page"}));

