import fs from "node:fs/promises";
const html=await fetch("http://127.0.0.1:3000/").then(r=>r.text());
const icon=[...html.matchAll(/<link[^>]+rel="icon"[^>]*>/g)].map(m=>m[0]);
const report={icon,versioned:icon.some(x=>x.includes("/favicon.svg?v=leibox-white-20261022"))};
await fs.writeFile(new URL("favicon-head-validation.json",import.meta.url),JSON.stringify(report,null,2));
console.log(report);if(!report.versioned)process.exitCode=1;

