<script setup lang="ts">
// Stroked-circle donut. Segments are computed from raw values; colors
// assigned by index from the chart blues.
import { computed } from 'vue'
import { DOTTED_BLUES, ringSegments } from './dottedChartMath'

const props = withDefaults(defineProps<{
  values: number[]
  colors?: readonly string[]
  centerValue?: string
  centerCaption?: string
  centerSize?: number
}>(), {
  colors: () => DOTTED_BLUES,
  centerSize: 22,
})

const segments = computed(() => ringSegments(props.values))
</script>

<template>
  <div class="dt-donut">
    <svg viewBox="0 0 140 140" class="dt-donut__svg" role="img" :aria-label="`${centerValue ?? ''} ${centerCaption ?? 'donut chart'}`">
      <g transform="rotate(-90 70 70)" fill="none" stroke-width="17">
        <circle
          v-for="(seg, i) in segments"
          :key="i"
          cx="70" cy="70" r="54"
          :stroke="colors[i % colors.length]"
          :stroke-dasharray="seg.dash"
          :stroke-dashoffset="seg.offset"
        />
      </g>
    </svg>
    <div v-if="centerValue" class="dt-donut__center">
      <span class="dt-donut__value" :style="{ fontSize: `${centerSize}px` }">{{ centerValue }}</span>
      <span v-if="centerCaption" class="dt-donut__caption">{{ centerCaption }}</span>
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
  color: var(--text-primary);
}

.dt-donut__caption {
  font-size: 11px;
  color: var(--muted);
}
</style>
