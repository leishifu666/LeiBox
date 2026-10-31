import previews from "./interaction-previews.json";
import type { MotionEntry } from "./interaction-components";

export type InteractionPreviewEntry = Pick<MotionEntry, "slug" | "href" | "name" | "category" | "description" | "keywords" | "preview" | "sourceFile" | "canvasWidth" | "canvasHeight" | "responsive">;
export const INTERACTION_PREVIEWS: InteractionPreviewEntry[] = previews;
