import type { NotFoundPreviewItem } from "@/components/not-found-experiments/not-found-experiments";
import { COMPONENT_CATALOG } from "@/data/component-catalog";

const FEATURED = [
  "blue-fluted-glass", "glass-folder", "particle-object", "gradient-cover-wall",
  "galaxy-effort-slider", "liquid-object", "dot-matrix-trio", "brand-poster-cards",
  "ascii-object", "cosmic-panels",
];

/** Share the same small collection between the real 404 and its preview. */
export function getNotFoundItems(): NotFoundPreviewItem[] {
  // Keep source code and prompts in the full catalog on the server.
  return FEATURED.flatMap((slug): NotFoundPreviewItem[] => {
    const entry = COMPONENT_CATALOG.find((item) => item.href.endsWith(`/${slug}`));
    if (!entry) return [];
    return [{
      slug, href: entry.href, name: entry.name,
      ...(entry.kind === "interaction"
        ? { poster: entry.preview, source: entry.sourceFile ? `/motion/${slug}.html` : undefined, width: entry.canvasWidth, height: entry.canvasHeight }
        : { video: entry.video }),
    }];
  });
}
