<script setup lang="ts">
// 6px progress pill with a gradient fill on a soft track.
import { BAR_GRADIENT } from './dottedChartMath'

withDefaults(defineProps<{ pct: number; gradient?: string }>(), {
  gradient: BAR_GRADIENT,
})
</script>

<template>
  <div class="dt-bar">
    <div
      class="dt-bar__fill"
      :style="{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        backgroundImage: gradient,
      }"
    />
  </div>
</template>

<style scoped>
.dt-bar {
  height: 6px;
  border-radius: 99px;
  background: var(--surface-secondary);
  overflow: hidden;
}

.dt-bar__fill {
  height: 100%;
  border-radius: 99px;
}
</style>
