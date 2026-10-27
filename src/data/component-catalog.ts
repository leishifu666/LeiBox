import { COMPONENTS, type ComponentEntry } from "./components";
import { INTERACTION_COMPONENTS, type MotionEntry } from "./interaction-components";

/** One public collection; kind only chooses the existing preview renderer. */
export type CatalogEntry =
  | (MotionEntry & { kind: "interaction" })
  | (ComponentEntry & { kind: "canvas" });

export const COMPONENT_CATALOG: CatalogEntry[] = [
  ...INTERACTION_COMPONENTS.map((entry): CatalogEntry => ({ ...entry, kind: "interaction" })),
  ...COMPONENTS.map((entry): CatalogEntry => ({ ...entry, kind: "canvas" })),
];
