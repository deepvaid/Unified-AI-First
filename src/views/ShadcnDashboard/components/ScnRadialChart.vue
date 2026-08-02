<script setup lang="ts">
// shadcn "Radial Chart - Text" style: 270° rounded-cap SVG arc on a faint
// track with a big centered value + muted caption. Hand-rolled for fidelity.
import { computed } from 'vue'
import { SCN_CHART } from '../scnApex'

const props = withDefaults(
  defineProps<{
    pct: number
    value: string
    caption?: string
    color?: string
    height?: number
    chartLabel: string
  }>(),
  {
    color: SCN_CHART[1],
    height: 220,
  },
)

const CX = 100
const CY = 100
const R = 78
const SWEEP = 270
const START = -135

function polar(deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
}

function arcPath(startDeg: number, endDeg: number) {
  const s = polar(startDeg)
  const e = polar(endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

const trackPath = arcPath(START, START + SWEEP)
const valuePath = computed(() => {
  const clamped = Math.max(0, Math.min(100, props.pct))
  if (clamped === 0) return ''
  return arcPath(START, START + (SWEEP * clamped) / 100)
})
</script>

<template>
  <div class="scn-radial" role="img" :aria-label="chartLabel">
    <svg viewBox="0 0 200 200" :style="{ height: `${height}px` }">
      <path :d="trackPath" class="scn-radial__track" fill="none" stroke-width="16" stroke-linecap="round" />
      <path
        v-if="valuePath"
        :d="valuePath"
        fill="none"
        :stroke="color"
        stroke-width="16"
        stroke-linecap="round"
      />
      <text x="100" y="100" text-anchor="middle" class="scn-radial__value">{{ value }}</text>
      <text v-if="caption" x="100" y="122" text-anchor="middle" class="scn-radial__caption">{{ caption }}</text>
    </svg>
  </div>
</template>

<style scoped>
.scn-radial {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.scn-radial svg {
  max-width: 100%;
}

.scn-radial__track {
  stroke: var(--scn-track);
}

.scn-radial__value {
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  fill: var(--scn-fg);
}

.scn-radial__caption {
  font-size: 12px;
  fill: var(--scn-muted);
}
</style>
