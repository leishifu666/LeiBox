<script module lang="ts">
  declare module "svelte/elements" {
    interface HTMLCanvasAttributes {
      layoutsubtree?: string;
    }
  }
</script>

<script lang="ts">
  import { onMount, tick } from "svelte";

  import {
    createFlameWrap,
    supportsHtmlInCanvas,
    type FlameWrapInstance,
    type FlameWrapOptions,
  } from "./FlameWrapVanilla";

  interface Props extends FlameWrapOptions {
    class?: string;
    children?: import("svelte").Snippet;
  }

  let { class: className = "", children, ...options }: Props = $props();

  let sourceEl = $state<HTMLCanvasElement>()!;
  let contentEl = $state<HTMLDivElement>()!;
  let outputEl = $state<HTMLCanvasElement>()!;
  let native = $state(false);
  let instance: FlameWrapInstance | null = null;

  const reach = $derived(Math.round(Math.max(options.height ?? 170, 24) * 1.5) + 40);
  const glow = $derived(Math.round(Math.max(options.spread ?? 8, 8) * 3) + 16);

  onMount(() => {
    native = supportsHtmlInCanvas();
    let disposed = false;
    (async () => {
      await tick();
      if (disposed) return;
      if (!sourceEl || !contentEl || !outputEl) return;
      instance = createFlameWrap(
        { source: sourceEl, content: contentEl, output: outputEl },
        options,
      );
      if (native && !instance) {
        native = false;
        await tick();
        if (disposed) return;
        if (!sourceEl || !contentEl || !outputEl) return;
        instance = createFlameWrap(
          { source: sourceEl, content: contentEl, output: outputEl },
          options,
        );
      }
    })();
    return () => {
      disposed = true;
      instance?.destroy();
      instance = null;
    };
  });

  $effect(() => {
    instance?.setOptions({ ...options });
  });
</script>

<div class={className} style="position: relative;">
  <canvas
    bind:this={sourceEl}
    layoutsubtree="true"
    style={native
      ? "position: absolute; inset: 0; width: 100%; height: 100%;"
      : "display: none;"}
  >
    {#if native}
      <div
        bind:this={contentEl}
        style="position: relative; width: 100%; height: 100%; overflow: auto;"
      >
        {@render children?.()}
      </div>
    {/if}
  </canvas>
  {#if !native}
    <div
      bind:this={contentEl}
      style="position: relative; width: 100%; height: 100%; overflow: auto;"
    >
      {@render children?.()}
    </div>
  {/if}
  <canvas
    bind:this={outputEl}
    aria-hidden="true"
    style="position: absolute; top: {-reach}px; right: {-glow}px; bottom: {-glow}px; left: {-glow}px; width: calc(100% + {glow *
      2}px); height: calc(100% + {reach + glow}px); pointer-events: none;"
  ></canvas>
</div>
