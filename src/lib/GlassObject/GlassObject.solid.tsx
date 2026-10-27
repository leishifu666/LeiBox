/** @jsxImportSource solid-js */

import {
  createEffect,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";

import {
  createGlassObject,
  type GlassObjectInstance,
  type GlassObjectOptions,
} from "./GlassObjectVanilla";

export interface GlassObjectProps extends GlassObjectOptions {
  class?: string;
  style?: JSX.CSSProperties;
}

export function GlassObject(props: GlassObjectProps) {
  const [local, options] = splitProps(props, ["class", "style"]);
  let canvasEl!: HTMLCanvasElement;
  let instance: GlassObjectInstance | null = null;

  onMount(() => {
    instance = createGlassObject({ canvas: canvasEl }, { ...options });
  });

  onCleanup(() => {
    instance?.destroy();
    instance = null;
  });

  createEffect(() => {
    instance?.setOptions({ ...options });
  });

  return (
    <div class={local.class} style={{ position: "relative", ...local.style }}>
      <canvas
        ref={canvasEl}
        style={{
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          display: "block",
          "touch-action": "none",
        }}
      />
    </div>
  );
}

export type { GlassObjectInstance, GlassObjectOptions };

export default GlassObject;
