import previews from "./interaction-previews.json";
import type { MotionEntry } from "./interaction-components";

export type InteractionPreviewEntry = Pick<MotionEntry, "slug" | "href" | "name" | "category" | "description" | "keywords" | "preview" | "sourceFile" | "canvasWidth" | "canvasHeight" | "responsive">;
export const ORBIT_NOT_FOUND = {
  slug: "orbit-not-found",
  href: "/docs/components/orbit-not-found",
  name: "Orbit 404 Page",
  category: "Page template",
  description: "A 404 page that turns component previews into an orbit. Hover or focus a card to pause it, and open the component from the ring.",
  keywords: "404 页面走丢 组件环游 页面模板 轨道 错误页 error not found orbit page template",
  preview: "/assets/components/orbit-not-found.png",
} satisfies InteractionPreviewEntry;

export const INTERACTION_PREVIEWS: InteractionPreviewEntry[] = [ORBIT_NOT_FOUND, ...previews];
