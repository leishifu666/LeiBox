/** @jsxImportSource solid-js */

import {
  createEffect,
  createSignal,
  children,
  onCleanup,
  onMount,
  splitProps,
  untrack,
  type JSX,
} from "solid-js";

import {
  createPeel,
  supportsHtmlInCanvas,
  type PeelInstance,
  type PeelOptions,
} from "./PeelVanilla";

declare module "solid-js" {
  namespace JSX {
    interface ExplicitAttributes {
      layoutsubtree: string;
    }
  }
}

export interface PeelProps extends PeelOptions {
  /** The content that peels away. */
  children: JSX.Element;
  /** The content revealed underneath the peel. */
  under?: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
}

export function Peel(props: PeelProps) {
  const [local, options] = splitProps(props, [
    "children",
    "under",
    "class",
    "style",
  ]);
  const content = children(() => local.children);
  const under = children(() => local.under);
  const [mounted, setMounted] = createSignal(false);
  const [supported, setSupported] = createSignal(false);
  const [failed, setFailed] = createSignal(false);
  const native = () => supported() && !failed();

  let sourceEl!: HTMLCanvasElement;
  let outputEl!: HTMLCanvasElement;
  let underEl: HTMLDivElement | undefined;
  let instance: PeelInstance | null = null;
  const [contentEl, setContentEl] = createSignal<HTMLDivElement>();

  onMount(() => {
    setSupported(supportsHtmlInCanvas());
    setMounted(true);
  });

  createEffect(() => {
    const contentRoot = contentEl();
    if (!mounted() || !contentRoot) return;
    const useNative = native();
    const initialOptions = untrack(() => ({ ...options }));
    const next = createPeel(
      {
        source: sourceEl,
        content: contentRoot,
        output: outputEl,
        under: underEl,
      },
      initialOptions,
    );
    instance = next;
    if (useNative && !next) setFailed(true);
    onCleanup(() => {
      next?.destroy();
      if (instance === next) instance = null;
    });
  });

  createEffect(() => {
    instance?.setOptions({ ...options });
  });

  return (
    <div class={local.class} style={{ position: "relative", ...local.style }}>
      {native() ? (
        <div
          ref={underEl}
          style={{
            position: "absolute",
            inset: "0",
            overflow: "hidden",
            visibility: "hidden",
          }}
        >
          {under()}
        </div>
      ) : null}
      <canvas
        ref={sourceEl}
        attr:layoutsubtree="true"
        style={
          native()
            ? {
                position: "absolute",
                inset: "0",
                width: "100%",
                height: "100%",
                "pointer-events": "none",
              }
            : { display: "none" }
        }
      >
        {native() ? (
          <div
            ref={setContentEl}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              "pointer-events": "auto",
            }}
          >
            {content()}
          </div>
        ) : null}
      </canvas>
      {!native() ? (
        <div
          ref={setContentEl}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {content()}
        </div>
      ) : null}
      <canvas
        ref={outputEl}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          "pointer-events": "none",
        }}
      />
    </div>
  );
}

export type { PeelInstance, PeelOptions };

export default Peel;
