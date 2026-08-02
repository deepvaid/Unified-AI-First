<script setup lang="ts">
// evilcharts-style "Market Share" monochrome donut: a thick ring built from
// filled pie-slice-with-hole paths (not stroked circles) so the gaps between
// slices stay crisp, plus a centered value/caption and a two-column legend.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: { name: string; value: number; pct: number }[]
    centerValue: string
    centerCaption: string
    chartLabel: string
    size?: number
  }>(),
  {
    size: 260,
  },
)

const CX = 120
const CY = 120
const OUTER_R = 112
const INNER_R = 62
const LABEL_R = 87

const SLICE_COLORS = ['#171717', '#2e2e2e', '#4b4b4b', '#6b6b6b', '#8a8a8a', '#a3a3a3']

const round2 = (n: number) => Math.round(n * 100) / 100

function sliceColor(i: number): string {
  return SLICE_COLORS[i % SLICE_COLORS.length] ?? '#171717'
}

/** Clockwise-from-12-o'clock polar point (same convention as ScnRadialChart's polar()). */
function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: round2(CX + r * Math.cos(rad)), y: round2(CY + r * Math.sin(rad)) }
}

/** Donut-slice-with-hole path: outer arc, line to inner ring, inner arc back, close. */
function donutSlicePath(startAngle: number, endAngle: number): string {
  const outerStart = polar(startAngle, OUTER_R)
  const outerEnd = polar(endAngle, OUTER_R)
  const innerEnd = polar(endAngle, INNER_R)
  const innerStart = polar(startAngle, INNER_R)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

interface DonutSlice {
  key: string
  path: string
  fill: string
  labelX: number
  labelY: number
  label: string
  labelFill: string
}

const slices = computed<DonutSlice[]>(() => {
  let cursor = 0
  return props.items.map((item, i) => {
    const startAngle = cursor
    const sweep = (item.pct / 100) * 360
    const endAngle = startAngle + sweep
    cursor = endAngle
    const mid = polar((startAngle + endAngle) / 2, LABEL_R)
    return {
      key: `${item.name}-${i}`,
      path: donutSlicePath(startAngle, endAngle),
      fill: sliceColor(i),
      labelX: mid.x,
      labelY: mid.y,
      label: `${item.pct}%`,
      labelFill: i < 4 ? '#ffffff' : '#1f1f1f',
    }
  })
})

interface LegendItem {
  key: string
  color: string
  name: string
  valueLabel: string
  pctLabel: string
}

const legendItems = computed<LegendItem[]>(() =>
  props.items.map((item, i) => ({
    key: `${item.name}-${i}`,
    color: sliceColor(i),
    name: item.name,
    valueLabel: `$${Math.round(item.value / 1000)}K`,
    pctLabel: `(${item.pct}%)`,
  })),
)
</script>

<template>
  <div class="evmd">
    <div class="evmd-chart" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 240 240" class="evmd-svg" :style="{ maxWidth: `${size}px` }">
        <path v-for="slice in slices" :key="slice.key" :d="slice.path" :fill="slice.fill" class="evmd-slice" />
        <text
          v-for="slice in slices"
          :key="`${slice.key}-label`"
          :x="slice.labelX"
          :y="slice.labelY"
          text-anchor="middle"
          dominant-baseline="middle"
          :fill="slice.labelFill"
          class="evmd-slice-label"
        >{{ slice.label }}</text>
        <text x="120" y="114" text-anchor="middle" class="evmd-center-value">{{ centerValue }}</text>
        <text x="120" y="136" text-anchor="middle" class="evmd-center-caption">{{ centerCaption }}</text>
      </svg>
    </div>

    <div class="evmd-divider" />

    <div class="evmd-legend">
      <div v-for="item in legendItems" :key="item.key" class="evmd-legend__row">
        <span class="evmd-legend__swatch" :style="{ background: item.color }" aria-hidden="true" />
        <span class="evmd-legend__name">{{ item.name }}</span>
        <span class="evmd-legend__value">{{ item.valueLabel }}</span>
        <span class="evmd-legend__pct">{{ item.pctLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evmd {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.evmd-chart {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.evmd-svg {
  display: block;
  width: 100%;
  height: auto;
}

.evmd-slice {
  stroke: var(--scn-card);
  stroke-width: 3;
  stroke-linejoin: round;
}

.evmd-slice-label {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.evmd-center-value {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  fill: var(--scn-fg);
}

.evmd-center-caption {
  font-size: 14px;
  fill: var(--scn-muted);
}

.evmd-divider {
  border-top: 1px solid var(--scn-border);
  margin: 16px 0;
}

.evmd-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 32px;
  min-width: 0;
}

.evmd-legend__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.evmd-legend__swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.evmd-legend__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--scn-fg);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evmd-legend__value {
  font-size: 14px;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
  margin-left: auto;
  flex-shrink: 0;
}

.evmd-legend__pct {
  font-size: 14px;
  color: var(--scn-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
