import previews from "./interaction-previews.json";
import type { MotionEntry } from "./interaction-components";
import { ORBIT_NOT_FOUND } from "./orbit-not-found";

export type InteractionPreviewEntry = Pick<MotionEntry, "slug" | "href" | "name" | "category" | "description" | "keywords" | "preview" | "sourceFile" | "canvasWidth" | "canvasHeight" | "responsive">;
export { ORBIT_NOT_FOUND };

export const INTERACTION_PREVIEWS: InteractionPreviewEntry[] = [ORBIT_NOT_FOUND, ...previews];
