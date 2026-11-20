import { COMPONENTS, type ComponentEntry } from "./components";
import { INTERACTION_PREVIEWS, type InteractionPreviewEntry } from "./interaction-previews";
import { COMPONENT_CATEGORIES, componentCategories } from "./component-categories";

/** One public collection; kind only chooses the existing preview renderer. */
export type CatalogEntry =
  | (InteractionPreviewEntry & { kind: "interaction" })
  | (ComponentEntry & { kind: "canvas" });

export const COMPONENT_CATALOG: CatalogEntry[] = [
  ...INTERACTION_PREVIEWS.map((entry): CatalogEntry => ({ ...entry, kind: "interaction" })),
  ...COMPONENTS.map((entry): CatalogEntry => ({ ...entry, kind: "canvas" })),
];

export const COMPONENT_CATALOG_GROUPS = COMPONENT_CATEGORIES.map(({ id, label }) => ({
  id,
  label,
  entries: [
    ...COMPONENT_CATALOG.filter(({ href }) => componentCategories(href).primary === id),
    ...COMPONENT_CATALOG.filter(({ href }) => componentCategories(href).secondary === id),
  ],
})).filter(({ entries }) => entries.length > 0);
