import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { COMPONENTS } from "../src/data/components.ts";
import { INTERACTION_COMPONENTS } from "../src/data/interaction-components.ts";
import { getComponentSources, getDemoSource } from "../src/lib/registry.ts";
import { getMotionPackages } from "../src/lib/motion-packages.ts";
import { highlight } from "../src/components/docs/highlight.ts";
import type { CodeAsset, DocAssetIndex } from "../src/lib/doc-asset-types.ts";

const root = path.join(process.cwd(), "public/doc-assets");
await fs.mkdir(root, { recursive: true });
const index: DocAssetIndex = { canvas: {}, motion: {} };
let count = 0;
async function asset(value: unknown) {
  const body = JSON.stringify(value);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 24);
  await fs.writeFile(path.join(root, `${hash}.json`), body);
  count++;
  return `/doc-assets/${hash}.json`;
}
for (const component of COMPONENTS) {
  const slug = component.href.split("/").pop()!;
  const item: DocAssetIndex["canvas"][string] = { webgl: [], webgpu: [] };
  for (const renderer of ["webgl", "webgpu"] as const) {
    for (const file of getComponentSources(slug, renderer)) {
      item[renderer].push({ id: file.id, label: file.label, fileName: file.fileName,
        url: await asset({ source: file.source, html: await highlight(file.source, file.lang) }) });
    }
  }
  const demo = getDemoSource(slug);
  if (demo) item.demoUrl = await asset({ source: demo });
  index.canvas[slug] = item;
}
for (const entry of INTERACTION_COMPONENTS) {
  index.motion[entry.slug] = [];
  for (const pack of await getMotionPackages(entry.slug)) {
    const { bundle, files, ...meta } = pack;
    const refs: CodeAsset[] = [];
    for (const [i, file] of files.entries()) {
      const lang = pack.framework === "vue" ? "vue" : pack.framework === "svelte" ? "svelte" : file.fileName.endsWith("tsx") ? "tsx" : "typescript";
      refs.push({ id: file.id, label: file.label, fileName: file.fileName,
        url: await asset({ source: file.source, ...(i === 0 ? { html: await highlight(file.source, lang) } : {}) }) });
    }
    index.motion[entry.slug].push({ ...meta, files: refs, bundleUrl: await asset({ source: bundle }) });
  }
}
await fs.writeFile(path.join(process.cwd(), "public/doc-assets-index.json"), JSON.stringify(index));
console.log(`Prepared ${count} on-demand code assets (shared files use the same content hash).`);
