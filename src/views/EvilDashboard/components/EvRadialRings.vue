<script setup lang="ts">
// evilcharts "Gradient Colors" concentric activity rings: one ring per item
// (outermost first), each an SVG arc swept clockwise from 12 o'clock. Shows
// email engagement by mail client.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: { name: string; pct: number; gradient: [string, string] }[]
    chartLabel: string
    size?: number
  }>(),
  {
    size: 300,
  },
)

const CX = 150
const CY = 150
const BASE_RADIUS = 128
const RADIUS_STEP = 24
const MIN_RADIUS = 10
const MAX_SWEEP_DEG = 355
const START_DEG = -90

let uidCounter = 0
const uid = uidCounter++

/** Point on a circle of radius `r` centered at (cx, cy). SVG's y-down coordinate
 *  system means -90° is 12 o'clock and increasing angle sweeps clockwise. */
function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** SVG "d" path for a clockwise arc starting at startDeg and sweeping sweepDeg. */
function arcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): string {
  const start = pointOnCircle(cx, cy, r, startDeg)
  const end = pointOnCircle(cx, cy, r, startDeg + sweepDeg)
  const largeArcFlag = sweepDeg > 180 ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

interface RingGeom {
  key: string
  radius: number
  gradId: string
  gradFrom: string
  gradTo: string
  path: string
}

const rings = computed<RingGeom[]>(() =>
  props.items.map((item, i) => {
    const radius = Math.max(MIN_RADIUS, BASE_RADIUS - i * RADIUS_STEP)
    const clampedPct = Math.max(0, Math.min(100, item.pct))
    const sweep = Math.min(MAX_SWEEP_DEG, (clampedPct / 100) * 360)
    return {
      key: `${item.name}-${i}`,
      radius,
      gradId: `ev-ring-grad-${uid}-${i}`,
      gradFrom: item.gradient[0],
      gradTo: item.gradient[1],
      path: sweep > 0 ? arcPath(CX, CY, radius, START_DEG, sweep) : '',
    }
  }),
)
</script>

<template>
  <div class="evrr">
    <div class="evrr-chart" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 300 300" class="evrr-svg" :style="{ maxWidth: `${size}px` }">
        <defs>
          <linearGradient
            v-for="ring in rings"
            :id="ring.gradId"
            :key="`grad-${ring.key}`"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" :stop-color="ring.gradFrom" />
            <stop offset="100%" :stop-color="ring.gradTo" />
          </linearGradient>
        </defs>

        <template v-for="ring in rings" :key="ring.key">
          <circle :cx="CX" :cy="CY" :r="ring.radius" class="evrr-track" stroke-width="15" fill="none" />
          <path
            v-if="ring.path"
            :d="ring.path"
            :stroke="`url(#${ring.gradId})`"
            stroke-width="15"
            stroke-linecap="round"
            fill="none"
          />
        </template>
      </svg>
    </div>

    <div class="evrr-legend">
      <div v-for="(item, i) in items" :key="`legend-${item.name}-${i}`" class="evrr-legend__item">
        <span
          class="evrr-legend__dot"
          :style="{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }"
          aria-hidden="true"
        />
        <span class="evrr-legend__name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evrr {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.evrr-chart {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.evrr-svg {
  display: block;
  width: 100%;
  height: auto;
}

.evrr-track {
  stroke: var(--scn-track);
}

.evrr-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 20px;
  margin-top: 16px;
}

.evrr-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.evrr-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.evrr-legend__name {
  font-size: 14px;
  color: var(--scn-fg);
}
</style>
