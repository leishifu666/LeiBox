/** @jsxImportSource solid-js */

import {
  createEffect,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";

import {
  createDitheredObject,
  type DitheredObjectInstance,
  type DitheredObjectOptions,
} from "./DitheredObjectVanilla";

export interface DitheredObjectProps extends DitheredObjectOptions {
  class?: string;
  style?: JSX.CSSProperties;
}

export function DitheredObject(props: DitheredObjectProps) {
  const [local, options] = splitProps(props, ["class", "style"]);
  let canvasEl!: HTMLCanvasElement;
  let instance: DitheredObjectInstance | null = null;

  onMount(() => {
    instance = createDitheredObject({ canvas: canvasEl }, { ...options });
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

export type { DitheredObjectInstance, DitheredObjectOptions };

export default DitheredObject;
