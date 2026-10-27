import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

const ROUTES: { path: string; priority: number }[] = [
  { path: "/docs/animations/collection-layout-morph", priority: 0.8 },
  { path: "/docs/animations/brand-poster-cards", priority: 0.8 },
  { path: "/docs/animations/dot-matrix-trio", priority: 0.8 },
  { path: "/docs/animations/selection-flower", priority: 0.8 },
  { path: "/docs/animations/galaxy-effort-slider", priority: 0.8 },
  { path: "/docs/animations/notes-text-color", priority: 0.8 },
  { path: "/", priority: 1 },
  { path: "/components", priority: 0.9 },
  { path: "/docs", priority: 0.9 },
  { path: "/docs/installation", priority: 0.9 },
  { path: "/docs/rendering", priority: 0.8 },
  { path: "/docs/mcp", priority: 0.7 },
  { path: "/docs/components/share-invite", priority: 0.8 },
  { path: "/docs/components/otp-verification", priority: 0.8 },
  { path: "/docs/animations/inline-text-morph", priority: 0.8 },
  { path: "/docs/animations/bounding-box-resize", priority: 0.8 },
  { path: "/docs/animations/elastic-panel-resize", priority: 0.8 },
  { path: "/docs/animations/blue-fluted-glass", priority: 0.8 },
  { path: "/docs/animations/brand-line-cards", priority: 0.8 },
  { path: "/docs/animations/reasoning-effort-slider", priority: 0.8 },
  { path: "/docs/animations/deep-agent-composer", priority: 0.8 },
  { path: "/docs/animations/glass-folder", priority: 0.8 },
  { path: "/docs/animations/cosmic-panels", priority: 0.8 },
  { path: "/docs/animations/thinking-particles", priority: 0.8 },
  { path: "/docs/animations/gradient-cover-wall", priority: 0.8 },
  { path: "/docs/animations/bouncy-access", priority: 0.8 },
  { path: "/docs/animations/velocity-drag", priority: 0.8 },
  { path: "/docs/animations/ai-generating", priority: 0.8 },
  { path: "/privacy", priority: 0.3 },
  { path: "/copyright", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}
