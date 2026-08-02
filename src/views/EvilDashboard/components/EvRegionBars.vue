<script setup lang="ts">
// evilcharts/tremor-style "Sales breakdown by regions": a KPI chip row above
// a pure-SVG bar chart. Two modes: stacked (all regions, bottom-up) or
// selectable (click a chip to drill into one region's monthly bars).
import { computed, ref } from 'vue'
import type { RegionSeries } from '../evilDemoData'

const props = withDefaults(
  defineProps<{
    months: string[]
    regions: RegionSeries[]
    selectable?: boolean
    formatAxis?: (v: number) => string
    chartLabel: string
    height?: number
  }>(),
  {
    selectable: false,
    formatAxis: (v: number) => '$' + Math.round(v / 1000) + 'K',
    height: 300,
  },
)

// Fixed 720x300 design canvas (per spec). `height` only drives the rendered
// aspect ratio via CSS below — it does not reparameterize this geometry.
const PLOT_LEFT = 48
const PLOT_RIGHT = 712
const PLOT_TOP = 14
const BASELINE_Y = 246
const AXIS_LABEL_Y = 268
const BAR_WIDTH_FRAC = 0.6
const TOP_RADIUS = 5
const RANGE = BASELINE_Y - PLOT_TOP
const SELECTED_FILL = '#4A7CF7'

const round2 = (n: number) => Math.round(n * 100) / 100

const selectedIndex = ref(0)

function selectRegion(idx: number) {
  if (!props.selectable) return
  selectedIndex.value = idx
}

const selectedRegion = computed(() => props.regions[selectedIndex.value])

/** Monthly stacked totals (sum across regions) — drives the stacked mode's scale. */
const monthlyStackSums = computed<number[]>(() =>
  props.months.map((_, i) => props.regions.reduce((sum, region) => sum + (region.data[i] ?? 0), 0)),
)

const selectedValues = computed<number[]>(() => props.months.map((_, i) => selectedRegion.value?.data[i] ?? 0))

const maxValue = computed(() => {
  const values = props.selectable ? selectedValues.value : monthlyStackSums.value
  return values.length ? Math.max(...values) : 0
})

/** Round the max up to 4 equal steps of the nearest $5K (e.g. 0/65K/130K/195K/260K). */
const step = computed(() => {
  const raw = Math.ceil(maxValue.value / 4 / 5000) * 5000
  return raw > 0 ? raw : 5000
})

const niceMax = computed(() => step.value * 4)

const ticks = computed(() =>
  [0, 1, 2, 3, 4].map((i) => ({
    value: i * step.value,
    y: round2(BASELINE_Y - (i / 4) * RANGE),
  })),
)

interface BarPiece {
  key: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  rounded: boolean
}

/** Rect path with rounded top corners only (bottom stays square) — used for the topmost stack segment. */
function roundedTopRectPath(x: number, y: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, h, w / 2))
  if (r <= 0) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ')
}

const barPieces = computed<BarPiece[]>(() => {
  const n = props.months.length
  if (n === 0) return []
  const slotWidth = (PLOT_RIGHT - PLOT_LEFT) / n
  const barWidth = slotWidth * BAR_WIDTH_FRAC
  const max = niceMax.value
  const pieces: BarPiece[] = []

  for (let i = 0; i < n; i++) {
    const barX = PLOT_LEFT + i * slotWidth + (slotWidth - barWidth) / 2

    if (props.selectable) {
      const value = selectedRegion.value?.data[i] ?? 0
      const h = (value / max) * RANGE
      if (h > 0) {
        pieces.push({
          key: `sel-${i}`,
          x: round2(barX),
          y: round2(BASELINE_Y - h),
          width: round2(barWidth),
          height: round2(h),
          fill: SELECTED_FILL,
          rounded: true,
        })
      }
      continue
    }

    let cum = 0
    for (let j = 0; j < props.regions.length; j++) {
      const region = props.regions[j]
      if (!region) continue
      const value = region.data[i] ?? 0
      const topValue = cum + value
      const h = (value / max) * RANGE
      const y = BASELINE_Y - (topValue / max) * RANGE
      const isTop = j === props.regions.length - 1
      cum = topValue
      if (h > 0) {
        pieces.push({
          key: `stack-${i}-${j}`,
          x: round2(barX),
          y: round2(y),
          width: round2(barWidth),
          height: round2(h),
          fill: region.color,
          rounded: isTop,
        })
      }
    }
  }
  return pieces
})

const monthPositions = computed(() => {
  const n = props.months.length
  if (n === 0) return []
  const slotWidth = (PLOT_RIGHT - PLOT_LEFT) / n
  return props.months.map((label, i) => ({
    label,
    x: round2(PLOT_LEFT + i * slotWidth + slotWidth / 2),
  }))
})
</script>

<template>
  <div class="evrb">
    <div class="evrb-chips">
      <template v-for="(region, idx) in regions" :key="region.name">
        <button
          v-if="selectable"
          type="button"
          class="evrb-chip evrb-chip--btn"
          :class="{ 'evrb-chip--selected': idx === selectedIndex }"
          :aria-pressed="idx === selectedIndex"
          @click="selectRegion(idx)"
        >
          <span class="evrb-chip__line1">
            <span class="evrb-chip__dot" :style="{ background: region.color }" aria-hidden="true" />
            <span class="evrb-chip__name">{{ region.name }}</span>
          </span>
          <span class="evrb-chip__total">{{ region.totalLabel }}</span>
        </button>
        <div v-else class="evrb-chip">
          <span class="evrb-chip__line1">
            <span class="evrb-chip__dot" :style="{ background: region.color }" aria-hidden="true" />
            <span class="evrb-chip__name">{{ region.name }}</span>
          </span>
          <span class="evrb-chip__total">{{ region.totalLabel }}</span>
        </div>
      </template>
    </div>

    <div class="evrb-chart" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 720 300" class="evrb-svg" :style="{ aspectRatio: `720 / ${height}` }">
        <line
          v-for="tick in ticks"
          :key="`grid-${tick.value}`"
          :x1="PLOT_LEFT"
          :x2="PLOT_RIGHT"
          :y1="tick.y"
          :y2="tick.y"
          class="evrb-grid"
        />

        <template v-for="piece in barPieces" :key="piece.key">
          <path
            v-if="piece.rounded"
            :d="roundedTopRectPath(piece.x, piece.y, piece.width, piece.height, TOP_RADIUS)"
            :fill="piece.fill"
          />
          <rect v-else :x="piece.x" :y="piece.y" :width="piece.width" :height="piece.height" :fill="piece.fill" />
        </template>

        <text
          v-for="tick in ticks"
          :key="`ytick-${tick.value}`"
          :x="PLOT_LEFT - 10"
          :y="tick.y"
          text-anchor="end"
          dominant-baseline="middle"
          class="evrb-ylabel"
        >{{ formatAxis(tick.value) }}</text>

        <text
          v-for="m in monthPositions"
          :key="`x-${m.label}`"
          :x="m.x"
          :y="AXIS_LABEL_Y"
          text-anchor="middle"
          class="evrb-xlabel"
        >{{ m.label }}</text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.evrb {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.evrb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.evrb-chip {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 150px;
  border: 1px solid var(--scn-border);
  border-radius: 10px;
  padding: 14px 18px;
  background: var(--scn-card);
  font: inherit;
  color: inherit;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.evrb-chip--btn {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}

.evrb-chip--btn:focus-visible {
  outline: 2px solid #4a7cf7;
  outline-offset: 2px;
}

.evrb-chip--selected {
  border: 1.5px solid #4a7cf7;
  box-shadow: 0 0 0 3px rgba(74, 124, 247, 0.12);
}

.evrb-chip__line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.evrb-chip__dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  flex-shrink: 0;
}

.evrb-chip__name {
  font-size: 15px;
  color: var(--scn-muted);
}

.evrb-chip__total {
  font-size: 24px;
  font-weight: 700;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
  margin-top: 6px;
}

.evrb-chart {
  min-width: 0;
}

.evrb-svg {
  display: block;
  width: 100%;
  height: auto;
}

.evrb-grid {
  stroke: var(--scn-border);
  stroke-width: 1;
}

.evrb-ylabel,
.evrb-xlabel {
  font-size: 12px;
  fill: var(--scn-muted);
}

.evrb-ylabel {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .evrb-chip {
    transition: none;
  }
}
</style>
