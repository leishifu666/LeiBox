import fs from "node:fs/promises";
import type { MotionEntry } from "../src/data/interaction-components";

/** Navigation and galleries need metadata, not complete recreation prompts. */
export async function buildInteractionPreviews(entries: MotionEntry[]) {
  const previews = entries.map(({ slug, href, name, category, description, keywords, preview, sourceFile, canvasWidth, canvasHeight, responsive, viewportPlayback }) => ({
    slug, href, name, category, description, keywords, preview, sourceFile, canvasWidth, canvasHeight, responsive, viewportPlayback,
  }));
  await fs.writeFile("src/data/interaction-previews.json", JSON.stringify(previews, null, 2) + "\n");
}
