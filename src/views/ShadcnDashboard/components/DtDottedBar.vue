<script setup lang="ts">
// 6px progress pill with the white-dot stipple over a gradient fill.
import { BAR_GRADIENT } from '../dottedDemoData'

withDefaults(defineProps<{ pct: number; gradient?: string; dotAlpha?: number }>(), {
  gradient: BAR_GRADIENT,
  dotAlpha: 0.6,
})
</script>

<template>
  <div class="dt-bar">
    <div
      class="dt-bar__fill"
      :style="{
        width: `${pct}%`,
        backgroundImage: `radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,${dotAlpha}) 0.9px, transparent 0), ${gradient}`,
      }"
    />
  </div>
</template>

<style scoped>
.dt-bar {
  height: 6px;
  border-radius: 99px;
  background: var(--scn-track);
  overflow: hidden;
}

.dt-bar__fill {
  height: 100%;
  border-radius: 99px;
  background-size: 5px 5px, auto;
}
</style>
