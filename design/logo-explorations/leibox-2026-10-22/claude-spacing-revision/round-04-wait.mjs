const task=await taskSpace(44);const page=task.page("p1");
await page.waitForFunction(()=>{const p=[...document.querySelectorAll("pre")];return p.length>1&&p[p.length-1].innerText.includes("</html>");},undefined,{timeout:45000}).catch(()=>console.log({waiting:true}));
const blocks=await page.evaluate(()=>[...document.querySelectorAll("pre")].map((p,i)=>({index:i,text:p.innerText})));
console.log({blocks:blocks.map(x=>({index:x.index,length:x.text.length,complete:x.text.includes("</html>")}))});
if(blocks.length>1&&blocks.at(-1).text.includes("</html>")){const fs=await import("node:fs/promises");await fs.writeFile("F:/雷师傅/ui组件网站/design/logo-explorations/leibox-2026-10-22/claude-spacing-revision/claude-code-blocks.json",JSON.stringify(blocks,null,2),"utf8");}
console.log(await page.snapshot({scope:"full_page"}));

