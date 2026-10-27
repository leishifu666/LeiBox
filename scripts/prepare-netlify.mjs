import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(projectRoot, ".netlify", "publish");
// Only replace our generated publish snapshot, never the working project.
if (!root.startsWith(path.join(projectRoot, ".netlify") + path.sep)) {
  throw new Error("Publish directory must remain inside this project's .netlify folder.");
}
await fs.rm(root, { recursive: true, force: true });
await fs.mkdir(path.dirname(root), { recursive: true });
await fs.cp(path.join(projectRoot, "out"), root, { recursive: true });
const inheritedHeaders = await fs.readFile(path.join(root, "_headers"), "utf8").catch(() => "");

async function files(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(target));
    else result.push(target);
  }
  return result;
}

// Next 16's client requests flat segment names, while export writes folders.
// Materialize aliases so Netlify can serve navigation entirely from its CDN.
const allFiles = await files(root);
const rscPaths = new Set();
let aliases = 0;
for (const file of allFiles) {
  if (!file.endsWith(".txt")) continue;
  const parts = path.relative(root, file).split(path.sep);
  const segmentIndex = parts.findIndex((part) => /^__next\.[^.]+$/.test(part));
  if (segmentIndex >= 0 && segmentIndex < parts.length - 1) {
    const flat = path.join(root, ...parts.slice(0, segmentIndex), parts.slice(segmentIndex).join("."));
    await fs.copyFile(file, flat);
    rscPaths.add("/" + path.relative(root, flat).split(path.sep).join("/"));
    aliases++;
  }
  // Ordinary .txt documents (such as llms.txt) must retain their text MIME type.
  const htmlSibling = file.slice(0, -4) + ".html";
  if (parts.some((part) => part.startsWith("__next.")) || allFiles.includes(htmlSibling)) {
    rscPaths.add("/" + parts.join("/"));
  }
}

const rules = [...rscPaths].sort().map((url) =>
  `${url}\n  Content-Type: text/x-component; charset=utf-8\n  Cache-Control: public, max-age=0, must-revalidate\n`,
);
await fs.writeFile(path.join(root, "_headers"), inheritedHeaders + "\n" + rules.join("\n"));
console.log(`Netlify export ready: ${aliases} navigation aliases, ${rscPaths.size} RSC MIME rules.`);
