<script setup lang="ts">
// evilcharts-style "Reliability Score" banded half-gauge: a 180° speedometer
// arc split into colored bands, a dotted texture arc, a big centered score,
// and a segmented range bar with tick labels below. Pure SVG + CSS, no needle.
import { computed } from 'vue'
import type { ScoreBand } from '../evilDemoData'

const props = defineProps<{
  score: number
  max: number
  bands: ScoreBand[]
  status: string
  updated: string
  chartLabel: string
}>()

const CX = 130
const CY = 132
const OUTER_R = 100
const INNER_R = 74
const START_ANGLE = -180
const END_ANGLE = 0
const TOTAL_SWEEP = END_ANGLE - START_ANGLE
const GAP_DEG = 7

/** Point at `angleDeg` (0° = 3 o'clock, -90° = 12 o'clock, -180° = 9 o'clock) on the ring of `radius` around the gauge center. */
function polarPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  }
}

/** SVG arc "d" from `startDeg` to `endDeg` at `radius` (theta increases start→end, i.e. clockwise on screen — sweep-flag 1). */
function arcPath(startDeg: number, endDeg: number, radius: number): string {
  const start = polarPoint(startDeg, radius)
  const end = polarPoint(endDeg, radius)
  const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

/** Fixed 180° dotted texture arc — constant, doesn't depend on props. */
const dottedArcPath = arcPath(START_ANGLE, END_ANGLE, INNER_R)

interface BandArc {
  key: string
  d: string
  color: string
}

/** One stroked arc per band, each sweep reduced proportionally so a 7° gap separates every pair of neighbors; left-to-right in array order. */
const bandArcs = computed<BandArc[]>(() => {
  const n = props.bands.length
  if (n === 0) return []
  const totalGap = GAP_DEG * (n - 1)
  const scale = (TOTAL_SWEEP - totalGap) / TOTAL_SWEEP
  let cursor = START_ANGLE
  const arcs: BandArc[] = []
  props.bands.forEach((band, i) => {
    const naiveSweep = props.max > 0 ? ((band.to - band.from) / props.max) * TOTAL_SWEEP : 0
    const sweep = naiveSweep * scale
    const start = cursor
    const end = start + sweep
    arcs.push({ key: `band-${i}`, d: arcPath(start, end, OUTER_R), color: band.color })
    cursor = end + GAP_DEG
  })
  return arcs
})

interface Boundary {
  key: string
  value: number
  pct: number
  transform: string
}

/** Tick labels above the range bar: 0, then each band's upper bound. */
const boundaries = computed<Boundary[]>(() => {
  const values = [0, ...props.bands.map((band) => band.to)]
  const lastIndex = values.length - 1
  return values.map((value, i) => ({
    key: `tick-${i}`,
    value,
    pct: props.max > 0 ? (value / props.max) * 100 : 0,
    transform: i === 0 ? 'translateX(0)' : i === lastIndex ? 'translateX(-100%)' : 'translateX(-50%)',
  }))
})

interface BarSegment {
  key: string
  grow: number
  color: string
}

/** Range-bar segments: flex-grow proportional to each band's width. */
const barSegments = computed<BarSegment[]>(() =>
  props.bands.map((band, i) => ({ key: `seg-${i}`, grow: band.to - band.from, color: band.color })),
)
</script>

<template>
  <div class="evg" role="img" :aria-label="chartLabel">
    <svg viewBox="0 0 260 150" class="evg-svg">
      <path
        v-for="arc in bandArcs"
        :key="arc.key"
        :d="arc.d"
        fill="none"
        :stroke="arc.color"
        stroke-width="14"
        stroke-linecap="round"
      />
      <path
        :d="dottedArcPath"
        fill="none"
        stroke="var(--scn-muted)"
        stroke-width="2.5"
        opacity="0.45"
        stroke-dasharray="0.5 7"
        stroke-linecap="round"
      />
      <text x="130" y="118" text-anchor="middle" class="evg-value">{{ score }}</text>
    </svg>

    <div class="evg-summary">
      <div class="evg-status">{{ status }}</div>
      <div class="evg-updated">{{ updated }}</div>
    </div>

    <div class="evg-range">
      <div class="evg-ticks">
        <span
          v-for="tick in boundaries"
          :key="tick.key"
          class="evg-tick"
          :style="{ left: `${tick.pct}%`, transform: tick.transform }"
        >{{ tick.value }}</span>
      </div>
      <div class="evg-bar">
        <div
          v-for="seg in barSegments"
          :key="seg.key"
          class="evg-seg"
          :style="{ flexGrow: seg.grow, background: seg.color }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.evg {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.evg-svg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 260 / 150;
}

.evg-value {
  font-size: 42px;
  font-weight: 700;
  fill: var(--scn-fg);
  font-variant-numeric: tabular-nums;
}

.evg-summary {
  text-align: center;
}

.evg-status {
  font-size: 17px;
  font-weight: 600;
  color: var(--scn-fg);
}

.evg-updated {
  font-size: 14px;
  color: var(--scn-muted);
  margin-top: 4px;
}

.evg-range {
  margin-top: 28px;
}

.evg-ticks {
  position: relative;
  height: 16px;
  margin-bottom: 8px;
}

.evg-tick {
  position: absolute;
  top: 0;
  font-size: 13px;
  color: var(--scn-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.evg-bar {
  display: flex;
  gap: 8px;
  height: 7px;
}

.evg-seg {
  height: 100%;
  min-width: 0;
  border-radius: 999px;
}
</style>
