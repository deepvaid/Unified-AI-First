<script setup lang="ts">
// Stroked-circle donut with the dotted texture overlay. Segments are computed
// from raw values; colors assigned by index from the dotted blues.
import { computed, useId } from 'vue'
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

const patternId = `dtDonutDots-${useId()}`
const segments = computed(() => ringSegments(props.values))
</script>

<template>
  <div class="dt-donut">
    <svg viewBox="0 0 140 140" class="dt-donut__svg" role="img" :aria-label="`${centerValue ?? ''} ${centerCaption ?? 'donut chart'}`">
      <defs>
        <pattern :id="patternId" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.95" fill="#ffffff" fill-opacity="0.5" />
        </pattern>
      </defs>
      <g transform="rotate(-90 70 70)" fill="none" stroke-width="17">
        <circle
          v-for="(seg, i) in segments"
          :key="i"
          cx="70" cy="70" r="54"
          :stroke="colors[i % colors.length]"
          :stroke-dasharray="seg.dash"
          :stroke-dashoffset="seg.offset"
        />
        <circle cx="70" cy="70" r="54" :stroke="`url(#${patternId})`" />
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
