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
  "ascii-sharks", "reasoning-effort-slider", "deep-agent-composer", "retro-computer-cord", "knoll-morph-menu", "status-picker", "genie-menu",
]);

export function motionDocLayout(entry: MotionEntry): MotionDocLayout {
  return {
    width: entry.canvasWidth!,
    height: entry.canvasHeight!,
    responsive: fullWidthDemos.has(entry.slug) || entry.viewportPlayback === true,
    instructions: entry.instructions,
    tags: [entry.category, "6 frameworks", "TypeScript", ...(entry.original ? ["LeiShiFu original"] : [])],
  };
}
