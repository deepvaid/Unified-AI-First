<script setup lang="ts">
import { computed } from 'vue'

// Animated waveform bars (Orbit handoff `bars()` primitive) — deterministic
// resting heights so SSR/static renders match the reference.
const props = defineProps<{
  count: number
  maxHeight: number
  barWidth: number
  gap: number
}>()

const bars = computed(() =>
  Array.from({ length: props.count }, (_, i) => ({
    height: Math.max(4, props.maxHeight * (0.4 + 0.6 * Math.abs(Math.sin((i + 1) * 1.9)))),
    delay: `${((i % 7) * 0.09).toFixed(2)}s`,
  })),
)
</script>

<template>
  <div
    class="dv-orbit-bars"
    :style="{ gap: `${gap}px`, height: `${maxHeight}px` }"
    aria-hidden="true"
  >
    <div
      v-for="(bar, i) in bars"
      :key="i"
      class="dv-orbit-bars__bar"
      :style="{ width: `${barWidth}px`, height: `${bar.height}px`, animationDelay: bar.delay }"
    ></div>
  </div>
</template>

<style scoped>
.dv-orbit-bars {
  display: flex;
  align-items: center;
  flex: none;
}

.dv-orbit-bars__bar {
  border-radius: 99px;
  background: var(--dv-orbit-wave-grad);
  animation: dv-orbit-bar 1.05s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-bars__bar {
    animation: none;
  }
}
</style>
