<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
  createPeel,
  supportsHtmlInCanvas,
  type PeelInstance,
  type PeelOptions,
} from "./PeelVanilla";

const props = defineProps<PeelOptions>();

const sourceEl = ref<HTMLCanvasElement | null>(null);
const contentEl = ref<HTMLDivElement | null>(null);
const outputEl = ref<HTMLCanvasElement | null>(null);
const underEl = ref<HTMLDivElement | null>(null);
const native = ref(false);

let instance: PeelInstance | null = null;
let disposed = false;

onMounted(async () => {
  native.value = supportsHtmlInCanvas();
  await nextTick();
  if (disposed) return;
  if (sourceEl.value && contentEl.value && outputEl.value) {
    instance = createPeel(
      {
        source: sourceEl.value,
        content: contentEl.value,
        output: outputEl.value,
        under: underEl.value ?? undefined,
      },
      props,
    );
    if (native.value && !instance) {
      native.value = false;
      await nextTick();
      if (disposed) return;
      if (sourceEl.value && contentEl.value && outputEl.value) {
        instance = createPeel(
          {
            source: sourceEl.value,
            content: contentEl.value,
            output: outputEl.value,
            under: underEl.value ?? undefined,
          },
          props,
        );
      }
    }
  }
});

onBeforeUnmount(() => {
  disposed = true;
  instance?.destroy();
  instance = null;
});

watch(
  () => ({ ...props }),
  (next) => instance?.setOptions(next),
  { deep: true },
);
</script>

<template>
  <div style="position: relative">
    <div
      v-if="native"
      ref="underEl"
      style="position: absolute; inset: 0; overflow: hidden; visibility: hidden"
    >
      <slot name="under" />
    </div>
    <canvas
      ref="sourceEl"
      layoutsubtree="true"
      :style="
        native
          ? 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none'
          : 'display: none'
      "
    >
      <div
        v-if="native"
        ref="contentEl"
        style="
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: auto;
        "
      >
        <slot />
      </div>
    </canvas>
    <div
      v-if="!native"
      ref="contentEl"
      style="position: relative; width: 100%; height: 100%; overflow: hidden"
    >
      <slot />
    </div>
    <canvas
      ref="outputEl"
      aria-hidden="true"
      style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      "
    />
  </div>
</template>
