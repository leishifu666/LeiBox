/** @jsxImportSource solid-js */

import {
  createEffect,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";

import {
  createParticleObject,
  type ParticleObjectInstance,
  type ParticleObjectOptions,
} from "./ParticleObjectVanilla";

export interface ParticleObjectProps extends ParticleObjectOptions {
  class?: string;
  style?: JSX.CSSProperties;
}

export function ParticleObject(props: ParticleObjectProps) {
  const [local, options] = splitProps(props, ["class", "style"]);
  let canvasEl!: HTMLCanvasElement;
  let instance: ParticleObjectInstance | null = null;

  onMount(() => {
    instance = createParticleObject({ canvas: canvasEl }, { ...options });
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

export type { ParticleObjectInstance, ParticleObjectOptions };

export default ParticleObject;
