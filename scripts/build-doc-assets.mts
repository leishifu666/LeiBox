import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { INTERACTION_COMPONENTS } from "../src/data/interaction-components.ts";
import { getMotionPackages } from "../src/lib/motion-packages.ts";
import { highlight } from "../src/components/docs/highlight.ts";
import type { CodeAsset, DocAssetIndex } from "../src/lib/doc-asset-types.ts";

const root = path.join(process.cwd(), "public/doc-assets");
await fs.mkdir(root, { recursive: true });
const index: DocAssetIndex = { canvas: {}, motion: {} };
const retained = new Set<string>();
let count = 0;
async function asset(value: unknown) {
  const body = JSON.stringify(value);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 24);
  retained.add(`${hash}.json`);
  await fs.writeFile(path.join(root, `${hash}.json`), body);
  count++;
  return `/doc-assets/${hash}.json`;
}
for (const entry of INTERACTION_COMPONENTS) {
  index.motion[entry.slug] = [];
  for (const pack of await getMotionPackages(entry.slug)) {
    const { bundle, files, prompt, ...meta } = pack;
    const refs: CodeAsset[] = [];
    for (const [i, file] of files.entries()) {
      const lang = pack.framework === "vue" ? "vue" : pack.framework === "svelte" ? "svelte" : file.fileName.endsWith("tsx") ? "tsx" : "typescript";
      refs.push({ id: file.id, label: file.label, fileName: file.fileName,
        url: await asset({ source: file.source, ...(i === 0 ? { html: await highlight(file.source, lang) } : {}) }) });
    }
    index.motion[entry.slug].push({ ...meta, promptUrl: await asset({ source: prompt }), files: refs, bundleUrl: await asset({ source: bundle }) });
  }
}
for (const file of await fs.readdir(root)) {
  if (/^[a-f0-9]{24}\.json$/.test(file) && !retained.has(file)) await fs.unlink(path.join(root, file));
}
await fs.writeFile(path.join(process.cwd(), "public/doc-assets-index.json"), JSON.stringify(index));
console.log(`Prepared ${count} on-demand code assets (shared files use the same content hash).`);
