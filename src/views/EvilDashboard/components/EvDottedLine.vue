<script setup lang="ts">
// evilcharts "dotted" line chart: dashed polylines over a dotted-pattern area
// fill, on a fixed 0–1800 y-scale with dashed gridlines. Pure SVG, no chart libs —
// mirrors EvRegionBars' fixed-canvas + CSS aspect-ratio pattern.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: { name: string; color: string; data: number[] }[]
    chartLabel: string
    height?: number
  }>(),
  {
    height: 300,
  },
)

// Fixed 720x320 design canvas (per spec). `height` only drives the rendered
// aspect ratio via CSS below — it does not reparameterize this geometry.
const PLOT_LEFT = 60
const PLOT_RIGHT = 700
const PLOT_TOP = 20
const BASELINE_Y = 260
const AXIS_LABEL_Y = 285
const RANGE = BASELINE_Y - PLOT_TOP
const Y_MAX = 1800

// Fixed scale — matches the reference screenshot, not dynamically computed.
const Y_TICKS = [0, 300, 600, 900, 1200, 1500, 1800]

let uidCounter = 0
const uid = uidCounter++

const round2 = (n: number) => Math.round(n * 100) / 100

function yScale(value: number): number {
  return round2(BASELINE_Y - (value / Y_MAX) * RANGE)
}

const yTicks = computed(() =>
  Y_TICKS.map((value) => ({
    value,
    y: yScale(value),
    label: value.toLocaleString('en-US'),
  })),
)

const xPositions = computed<number[]>(() => {
  const n = props.labels.length
  if (n <= 1) return n === 1 ? [PLOT_LEFT] : []
  const step = (PLOT_RIGHT - PLOT_LEFT) / (n - 1)
  return props.labels.map((_, i) => round2(PLOT_LEFT + i * step))
})

const xLabels = computed(() =>
  props.labels.map((label, i) => ({
    label,
    x: xPositions.value[i] ?? PLOT_LEFT,
  })),
)

interface SeriesPoint {
  x: number
  y: number
}

interface SeriesGeometry {
  name: string
  color: string
  patternId: string
  linePoints: string
  areaPoints: string
  markers: SeriesPoint[]
}

const seriesGeometry = computed<SeriesGeometry[]>(() =>
  props.series.map((s, seriesIndex) => {
    const points: SeriesPoint[] = xPositions.value.map((x, i) => ({
      x,
      y: yScale(s.data[i] ?? 0),
    }))

    const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
    const firstX = points[0]?.x ?? PLOT_LEFT
    const lastX = points[points.length - 1]?.x ?? PLOT_LEFT
    const areaPoints = `${linePoints} ${lastX},${BASELINE_Y} ${firstX},${BASELINE_Y}`

    return {
      name: s.name,
      color: s.color,
      patternId: `ev-dot-pattern-${uid}-${seriesIndex}`,
      linePoints,
      areaPoints,
      markers: points,
    }
  }),
)
</script>

<template>
  <div class="evdl">
    <div class="evdl-legend">
      <span v-for="s in series" :key="s.name" class="evdl-legend__item">
        <span class="evdl-legend__dot" :style="{ background: s.color }" aria-hidden="true" />
        <span class="evdl-legend__name">{{ s.name }}</span>
      </span>
    </div>

    <div class="evdl-chart" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 720 320" class="evdl-svg" :style="{ aspectRatio: `720 / ${height}` }">
        <defs>
          <pattern
            v-for="g in seriesGeometry"
            :id="g.patternId"
            :key="g.patternId"
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
          >
            <circle cx="3.5" cy="3.5" r="1.4" :fill="g.color" opacity="0.35" />
          </pattern>
        </defs>

        <line
          v-for="tick in yTicks"
          :key="`grid-${tick.value}`"
          :x1="PLOT_LEFT"
          :x2="PLOT_RIGHT"
          :y1="tick.y"
          :y2="tick.y"
          class="evdl-grid"
        />

        <polygon
          v-for="g in seriesGeometry"
          :key="`area-${g.patternId}`"
          :points="g.areaPoints"
          :fill="`url(#${g.patternId})`"
        />

        <template v-for="g in seriesGeometry" :key="`line-${g.name}`">
          <polyline
            :points="g.linePoints"
            fill="none"
            :stroke="g.color"
            stroke-width="1.6"
            stroke-dasharray="5 4"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-for="(m, i) in g.markers"
            :key="`pt-${g.name}-${i}`"
            :cx="m.x"
            :cy="m.y"
            r="2"
            :fill="g.color"
            opacity="0.9"
          />
        </template>

        <text
          v-for="tick in yTicks"
          :key="`ytick-${tick.value}`"
          :x="PLOT_LEFT - 10"
          :y="tick.y"
          text-anchor="end"
          dominant-baseline="middle"
          class="evdl-ylabel"
        >{{ tick.label }}</text>

        <text
          v-for="xl in xLabels"
          :key="`xl-${xl.label}`"
          :x="xl.x"
          :y="AXIS_LABEL_Y"
          text-anchor="middle"
          class="evdl-xlabel"
        >{{ xl.label }}</text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.evdl {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.evdl-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 12px;
}

.evdl-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.evdl-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.evdl-legend__name {
  font-size: 13px;
  color: var(--scn-fg);
}

.evdl-chart {
  min-width: 0;
}

.evdl-svg {
  display: block;
  width: 100%;
  height: auto;
}

.evdl-grid {
  stroke: var(--scn-border);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.evdl-ylabel,
.evdl-xlabel {
  font-size: 12px;
  fill: var(--scn-muted);
}

.evdl-ylabel {
  font-variant-numeric: tabular-nums;
}
</style>
