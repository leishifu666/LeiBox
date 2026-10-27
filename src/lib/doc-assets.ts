import fs from "node:fs";
import path from "node:path";
import type { DocAssetIndex } from "./doc-asset-types";

// Re-read when the generated index changes so a running dev server picks up new components.
let index: DocAssetIndex | undefined, stamp = 0;
export function getDocAssets(): DocAssetIndex {
  const file = path.join(process.cwd(), "public/doc-assets-index.json");
  const mtime = fs.statSync(file).mtimeMs;
  if (!index || mtime !== stamp) { index = JSON.parse(fs.readFileSync(file, "utf8")); stamp = mtime; }
  return index!;
}
