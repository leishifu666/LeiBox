const task=await taskSpace(40);const page=task.page("p1");
await page.waitForFunction(()=>[...document.querySelectorAll("pre")].some(x=>x.innerText.includes("</html>")),undefined,{timeout:45000}).catch(()=>console.log({waiting:true}));
const blocks=await page.evaluate(()=>[...document.querySelectorAll("pre")].map((x,i)=>({index:i,text:x.innerText})));
console.log({blocks:blocks.map(x=>({index:x.index,length:x.text.length,start:x.text.slice(0,120),end:x.text.slice(-120)}))});
if(blocks.length){const fs=await import("node:fs/promises");await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-equal-arm/claude-code-blocks.json",JSON.stringify(blocks,null,2),"utf8");}
console.log(await page.snapshot({scope:"full_page"}));

