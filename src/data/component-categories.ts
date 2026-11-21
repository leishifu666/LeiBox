export const COMPONENT_CATEGORIES = [
  {
    id: "controls", label: "Buttons and Inputs",
    components: ["upload-tile", "focus-switch", "pixel-toggle", "tactile-push-button", "folded-emoji-scroll", "spider-music-player", "galaxy-effort-slider", "reasoning-effort-slider", "deep-agent-composer", "otp-verification"],
  },
  {
    id: "navigation", label: "Menus and Navigation",
    components: ["metaball-menu", "blister-dropdown", "soft-action-wheel", "staggered-radial-menu", "glass-tab-menu", "sailing-toc"],
  },
  {
    id: "galleries", label: "Galleries and Carousels",
    components: ["image-accordion", "image-compare", "card-swap", "album-cover-tunnel", "ink-spread-carousel", "gradient-ring-cards"],
  },
  {
    id: "cards", label: "Cards",
    components: ["stacked-metadata", "shader-flood", "ai-brand-cover-cards", "collection-layout-morph", "brand-poster-cards", "hammerhead-chart", "glass-folder", "gradient-cover-wall", "brand-line-cards"],
  },
  {
    id: "text", label: "Text Effects",
    components: ["selection-flower", "inline-text-morph", "notes-text-color"],
  },
  {
    id: "feedback", label: "Feedback and Status",
    components: ["thinking-orb", "thinking-orbs", "voice-glow", "bot-avatars", "transfer-glow", "fluid-tooltip", "thinking-particles", "ai-generating"],
  },
  {
    id: "editing", label: "Dragging and Editing",
    components: ["multi-cursor-builder", "bounding-box-resize", "elastic-panel-resize", "velocity-drag"],
  },
  {
    id: "transitions", label: "Pages and Transitions",
    components: ["orbit-not-found", "distortion-waves", "crumpled-paper", "share-invite", "bouncy-access"],
  },
  {
    id: "surfaces", label: "Surfaces and Materials",
    components: ["border-beam", "liquid-metal", "asciify", "frost", "glass"],
  },
  {
    id: "backgrounds", label: "Backgrounds and Objects",
    components: ["ascii-sharks", "particle-texture-trio", "matcha-powder-reveal", "dot-matrix-trio", "blue-fluted-glass", "cosmic-panels", "ascii-object", "glass-object", "glyph-rain", "particle-object", "particle-scroll", "liquid-object"],
  },
  { id: "other", label: "Other Components", components: [] },
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number]["id"];

export const COMPONENT_CATEGORY_LABELS = new Map(COMPONENT_CATEGORIES.map(({ id, label }) => [id, label]));

const primaryCategories = new Map<string, ComponentCategory>(
  COMPONENT_CATEGORIES.flatMap(({ id, components }) => components.map((slug) => [slug, id] as const)),
);
const secondaryCategories: Partial<Record<string, ComponentCategory>> = {
  "border-beam": "controls",
  "card-swap": "editing",
  "fluid-tooltip": "navigation",
  "matcha-powder-reveal": "transitions",
  "notes-text-color": "controls",
  "particle-scroll": "transitions",
};

export function componentCategories(href: string) {
  const slug = href.slice(href.lastIndexOf("/") + 1);
  return {
    primary: primaryCategories.get(slug) ?? "other",
    secondary: secondaryCategories[slug],
  };
}

export function componentCategoryHref(category: ComponentCategory | null) {
  return category ? `/components?category=${category}` : "/components";
}
