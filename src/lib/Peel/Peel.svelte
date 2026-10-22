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
    createPeel,
    supportsHtmlInCanvas,
    type PeelInstance,
    type PeelOptions,
  } from "./PeelVanilla";

  interface Props extends PeelOptions {
    class?: string;
    children?: import("svelte").Snippet;
    under?: import("svelte").Snippet;
  }

  let { class: className = "", children, under, ...options }: Props = $props();

  let sourceEl = $state<HTMLCanvasElement>()!;
  let contentEl = $state<HTMLDivElement>()!;
  let outputEl = $state<HTMLCanvasElement>()!;
  let underEl = $state<HTMLDivElement>();
  let native = $state(false);
  let instance: PeelInstance | null = null;

  onMount(() => {
    native = supportsHtmlInCanvas();
    let disposed = false;
    (async () => {
      await tick();
      if (disposed) return;
      if (!sourceEl || !contentEl || !outputEl) return;
      instance = createPeel(
        { source: sourceEl, content: contentEl, output: outputEl, under: underEl },
        options,
      );
      if (native && !instance) {
        native = false;
        await tick();
        if (disposed) return;
        if (!sourceEl || !contentEl || !outputEl) return;
        instance = createPeel(
          { source: sourceEl, content: contentEl, output: outputEl, under: underEl },
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
  {#if native}
    <div
      bind:this={underEl}
      style="position: absolute; inset: 0; overflow: hidden; visibility: hidden;"
    >
      {@render under?.()}
    </div>
  {/if}
  <canvas
    bind:this={sourceEl}
    layoutsubtree="true"
    style={native
      ? "position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"
      : "display: none;"}
  >
    {#if native}
      <div
        bind:this={contentEl}
        style="position: relative; width: 100%; height: 100%; overflow: hidden; pointer-events: auto;"
      >
        {@render children?.()}
      </div>
    {/if}
  </canvas>
  {#if !native}
    <div
      bind:this={contentEl}
      style="position: relative; width: 100%; height: 100%; overflow: hidden;"
    >
      {@render children?.()}
    </div>
  {/if}
  <canvas
    bind:this={outputEl}
    aria-hidden="true"
    style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"
  ></canvas>
</div>
