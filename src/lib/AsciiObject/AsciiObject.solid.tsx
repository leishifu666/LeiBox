/** @jsxImportSource solid-js */

import {
  createEffect,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";

import {
  createAsciiObject,
  type AsciiObjectInstance,
  type AsciiObjectOptions,
} from "./AsciiObjectVanilla";

export interface AsciiObjectProps extends AsciiObjectOptions {
  class?: string;
  style?: JSX.CSSProperties;
}

export function AsciiObject(props: AsciiObjectProps) {
  const [local, options] = splitProps(props, ["class", "style"]);
  let canvasEl!: HTMLCanvasElement;
  let instance: AsciiObjectInstance | null = null;

  onMount(() => {
    instance = createAsciiObject({ canvas: canvasEl }, { ...options });
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

export type { AsciiObjectInstance, AsciiObjectOptions };

export default AsciiObject;
