import { COMPONENTS, type ComponentEntry } from "./components";
import { INTERACTION_PREVIEWS, type InteractionPreviewEntry } from "./interaction-previews";

/** One public collection; kind only chooses the existing preview renderer. */
export type CatalogEntry =
  | (InteractionPreviewEntry & { kind: "interaction" })
  | (ComponentEntry & { kind: "canvas" });

export const COMPONENT_CATALOG: CatalogEntry[] = [
  ...INTERACTION_PREVIEWS.map((entry): CatalogEntry => ({ ...entry, kind: "interaction" })),
  ...COMPONENTS.map((entry): CatalogEntry => ({ ...entry, kind: "canvas" })),
];
