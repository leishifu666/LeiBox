"use client";

import { useRenderer, type RendererId } from "@/components/docs/renderer";

export function useLiveRenderer(): RendererId {
  const [renderer] = useRenderer(true);
  if (
    renderer === "webgpu" &&
    typeof navigator !== "undefined" &&
    !navigator.gpu
  ) {
    return "webgl";
  }
  return renderer;
}
