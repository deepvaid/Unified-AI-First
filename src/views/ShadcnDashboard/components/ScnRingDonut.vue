<script setup lang="ts">
// Stroked-circle donut (Overview v2 mockup).
// Segments are precomputed dash arrays on the r=54 ring (viewBox 140).
import type { DonutSegment } from '../dottedDemoData'

defineProps<{
  segments: DonutSegment[]
  centerValue: string
  centerCaption: string
  /* Font size of the center value, px (mockup varies 22–26). */
  centerSize?: number
}>()

</script>

<template>
  <div class="dt-donut">
    <svg viewBox="0 0 140 140" class="dt-donut__svg" role="img" :aria-label="`${centerValue} ${centerCaption}`">
      <g transform="rotate(-90 70 70)" fill="none" stroke-width="17">
        <circle
          v-for="seg in segments"
          :key="seg.color"
          cx="70" cy="70" r="54"
          :stroke="seg.color"
          :stroke-dasharray="seg.dash"
          :stroke-dashoffset="seg.offset"
        />
      </g>
    </svg>
    <div class="dt-donut__center">
      <span class="dt-donut__value" :style="{ fontSize: `${centerSize ?? 22}px` }">{{ centerValue }}</span>
      <span class="dt-donut__caption">{{ centerCaption }}</span>
    </div>
  </div>
</template>

<style scoped>
.dt-donut {
  position: relative;
  width: 172px;
  height: 172px;
}

.dt-donut__svg {
  width: 172px;
  height: 172px;
  display: block;
}

.dt-donut__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dt-donut__value {
  font-weight: 650;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-donut__caption {
  font-size: 11px;
  color: var(--scn-muted);
}
</style>
