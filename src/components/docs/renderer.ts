"use client";

import { usePreference } from "@/hooks/use-preference";

export const RENDERERS = [
  { id: "webgl", label: "WebGL" },
  { id: "webgpu", label: "WebGPU" },
] as const;

export type RendererId = (typeof RENDERERS)[number]["id"];

export const RENDERER_IDS = RENDERERS.map((renderer) => renderer.id);

/** Every framework ships a WebGPU build; the wrappers are shared across engines. */
export const WEBGPU_FRAMEWORK_IDS = [
  "react",
  "vue",
  "svelte",
  "solid",
  "preact",
  "vanilla",
] as const;

/**
 * The renderer preference, resolved against what the current component ships.
 * Components without a WebGPU engine always resolve to WebGL.
 */
export function useRenderer(hasWebGPU: boolean) {
  const [preferred, setRenderer] = usePreference<RendererId>(
    "renderer",
    "webgl",
    RENDERER_IDS,
  );
  const renderer: RendererId = hasWebGPU ? preferred : "webgl";
  return [renderer, setRenderer] as const;
}

/** Every framework has both builds, so the stored framework applies as is. */
export function resolveFramework(frameworkId: string, renderer: RendererId) {
  void renderer;
  return frameworkId;
}

export function registrySuffix(renderer: RendererId) {
  return renderer === "webgpu" ? "-webgpu" : "";
}
