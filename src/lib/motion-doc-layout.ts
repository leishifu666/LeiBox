import type { MotionEntry } from "@/data/interaction-components";

export type MotionDocLayout = {
  width: number;
  height: number;
  responsive: boolean;
  instructions?: string;
  tags: string[];
};

const fullWidthDemos = new Set([
  "multi-cursor-builder", "stacked-metadata", "shader-flood",
  "ascii-sharks", "reasoning-effort-slider", "deep-agent-composer",
]);

export function motionDocLayout(entry: MotionEntry): MotionDocLayout {
  return {
    width: entry.canvasWidth!,
    height: entry.canvasHeight!,
    responsive: fullWidthDemos.has(entry.slug),
    instructions: entry.instructions,
    tags: [entry.category, "6 frameworks", "TypeScript", ...(entry.original ? ["LeiShiFu original"] : [])],
  };
}
