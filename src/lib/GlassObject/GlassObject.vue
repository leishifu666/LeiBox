<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
  createGlassObject,
  type GlassObjectInstance,
  type GlassObjectOptions,
} from "./GlassObjectVanilla";

const props = defineProps<GlassObjectOptions>();

const canvasEl = ref<HTMLCanvasElement | null>(null);

let instance: GlassObjectInstance | null = null;

onMounted(() => {
  if (canvasEl.value) {
    instance = createGlassObject({ canvas: canvasEl.value }, props);
  }
});

onBeforeUnmount(() => {
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
    <canvas
      ref="canvasEl"
      style="
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
      "
    />
  </div>
</template>
