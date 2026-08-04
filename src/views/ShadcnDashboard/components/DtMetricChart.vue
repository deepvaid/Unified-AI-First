<script setup lang="ts">
// Main metric chart card, styled after shadcn's gradient area chart: a bold
// single-hue vertical gradient wash (.8 → .1), solid stroke, horizontal-only
// grid, no y-axis, and a hover tooltip with active dots. "Compare" overlays the
// previous period as a second, paler gradient area. Paths are computed by the
// parent on the fixed 720×200 canvas (see dottedDemoData.linePath).
import { computed, ref } from 'vue'
import { CHART_H, valueToY } from '../dottedDemoData'

const props = defineProps<{
  metricLabel: string
  vsLabelLong: string
  areaPath: string
  strokePath: string
  prevAreaPath: string
  prevStrokePath: string
  xLabels: string[]
  pointLabels: string[]
  curValues: number[]
  prevValues: number[]
  lo: number
  hi: number
  formatValue: (value: number) => string
}>()

const compare = defineModel<boolean>('compare', { required: true })

const CURRENT_COLOR = '#0092D4'
const PREVIOUS_COLOR = '#7ACFF1'

const plotEl = ref<HTMLElement | null>(null)
const hoverIndex = ref<number | null>(null)

function onPointerMove(event: PointerEvent) {
  const el = plotEl.value
  const count = props.curValues.length
  if (!el || count < 2) return
  const rect = el.getBoundingClientRect()
  if (rect.width === 0) return
  const ratio = (event.clientX - rect.left) / rect.width
  hoverIndex.value = Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))))
}

interface HoverPoint {
  key: string
  label: string
  color: string
  value: string
  topPct: number
}

const hoverPoints = computed<HoverPoint[]>(() => {
  const index = hoverIndex.value
  if (index == null) return []
  const point = (key: string, label: string, color: string, raw: number | undefined): HoverPoint => ({
    key,
    label,
    color,
    value: props.formatValue(raw ?? 0),
    topPct: Math.min(100, Math.max(0, (valueToY(raw ?? 0, props.hi, props.lo) / CHART_H) * 100)),
  })
  const rows = [point('current', props.metricLabel, CURRENT_COLOR, props.curValues[index])]
  if (props.prevStrokePath) rows.push(point('previous', 'Previous period', PREVIOUS_COLOR, props.prevValues[index]))
  return rows
})

const hoverLeftPct = computed(() => {
  const index = hoverIndex.value
  const count = props.curValues.length
  if (index == null || count < 2) return 0
  return (index / (count - 1)) * 100
})

const hoverLabel = computed(() =>
  hoverIndex.value == null ? '' : props.pointLabels[hoverIndex.value] ?? '',
)

/** Anchor the tooltip so it never overflows the card at either edge. */
const tooltipTransform = computed(() => {
  if (hoverLeftPct.value < 15) return 'translateX(0)'
  if (hoverLeftPct.value > 85) return 'translateX(-100%)'
  return 'translateX(-50%)'
})
</script>

<template>
  <section class="dt-chart-card">
    <div class="dt-chart-card__head">
      <div class="dt-chart-card__heading">
        <h2 class="dt-chart-card__title">{{ metricLabel }}</h2>
        <p class="dt-chart-card__sub">Select a metric above · {{ vsLabelLong }}</p>
      </div>
      <button type="button" class="dt-chart-card__compare" :aria-pressed="compare" @click="compare = !compare">
        <span class="dt-chart-card__compare-dash" :style="{ opacity: compare ? 1 : 0.25 }" aria-hidden="true" />Compare
      </button>
    </div>
    <div class="dt-chart-card__plot">
      <div
        ref="plotEl"
        class="dt-chart-card__canvas"
        @pointermove="onPointerMove"
        @pointerleave="hoverIndex = null"
      >
        <svg viewBox="0 0 720 200" preserveAspectRatio="none" class="dt-chart-card__svg" role="img" :aria-label="`${metricLabel} trend chart`">
          <defs>
            <!-- shadcn's gradient recipe: .8 → .1 stops, then fill-opacity .4
                 on the path (effective .32 → .04). -->
            <linearGradient id="dtRevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" :stop-color="CURRENT_COLOR" stop-opacity="0.8" />
              <stop offset="95%" :stop-color="CURRENT_COLOR" stop-opacity="0.1" />
            </linearGradient>
            <linearGradient id="dtRevFillPrev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" :stop-color="PREVIOUS_COLOR" stop-opacity="0.8" />
              <stop offset="95%" :stop-color="PREVIOUS_COLOR" stop-opacity="0.1" />
            </linearGradient>
            <!-- Contains the cardinal curve's slight overshoot at sharp peaks. -->
            <clipPath id="dtRevClip">
              <rect x="0" y="0" width="720" height="200" />
            </clipPath>
          </defs>
          <!-- Horizontal only, and no rule on the baseline (as in the reference). -->
          <line v-for="y in [0, 50, 100, 150]" :key="y" x1="0" :y1="y" x2="720" :y2="y" class="dt-chart-card__grid" vector-effect="non-scaling-stroke" />
          <!-- Previous period sits behind the current one (overlaid, not stacked). -->
          <g clip-path="url(#dtRevClip)">
            <path v-if="prevAreaPath" :d="prevAreaPath" fill="url(#dtRevFillPrev)" fill-opacity="0.4" />
            <path v-if="prevStrokePath" :d="prevStrokePath" fill="none" :stroke="PREVIOUS_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            <path :d="areaPath" fill="url(#dtRevFill)" fill-opacity="0.4" />
            <path :d="strokePath" fill="none" :stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          </g>
        </svg>

        <!-- Active dots and tooltip are HTML, not SVG: the canvas is
             preserveAspectRatio="none", so an SVG circle would stretch. -->
        <template v-if="hoverPoints.length">
          <span
            v-for="point in hoverPoints"
            :key="point.key"
            class="dt-chart-card__dot"
            :style="{ left: `${hoverLeftPct}%`, top: `${point.topPct}%`, background: point.color }"
            aria-hidden="true"
          />
          <div class="dt-chart-tip" :style="{ left: `${hoverLeftPct}%`, transform: tooltipTransform }">
            <div class="dt-chart-tip__title">{{ hoverLabel }}</div>
            <div v-for="point in hoverPoints" :key="point.key" class="dt-chart-tip__row">
              <span class="dt-chart-tip__dot" :style="{ background: point.color }" />
              <span class="dt-chart-tip__label">{{ point.label }}</span>
              <span class="dt-chart-tip__value">{{ point.value }}</span>
            </div>
          </div>
        </template>
      </div>
      <div class="dt-chart-card__xaxis">
        <span v-for="label in xLabels" :key="label">{{ label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dt-chart-card {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  padding: 22px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  height: 100%;
}

.dt-chart-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dt-chart-card__heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dt-chart-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--scn-fg);
}

.dt-chart-card__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-chart-card__compare {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--scn-border);
  border-radius: 999px;
  background: var(--scn-card);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-fg);
  cursor: pointer;
}

.dt-chart-card__compare-dash {
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: var(--scn-muted);
}

/* No y-axis column (matching the shadcn reference) — the plot runs full-bleed
   and values are read from the hover tooltip. */
.dt-chart-card__plot {
  flex: 1;
  min-width: 0;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dt-chart-card__canvas {
  position: relative;
  flex: 1;
  min-height: 200px;
}

.dt-chart-card__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.dt-chart-card__grid {
  stroke: var(--scn-border);
  stroke-width: 1;
}

.dt-chart-card__xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--scn-muted);
}

.dt-chart-card__dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px var(--scn-card);
  pointer-events: none;
}

.dt-chart-tip {
  position: absolute;
  top: 8px;
  z-index: 2;
  pointer-events: none;
  background: var(--scn-card);
  border: 1px solid var(--scn-border);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  padding: 8px 10px;
  min-width: 140px;
}

.dt-chart-tip__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--scn-fg);
  margin-bottom: 4px;
}

.dt-chart-tip__row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

.dt-chart-tip__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dt-chart-tip__label {
  color: var(--scn-muted);
}

.dt-chart-tip__value {
  margin-left: auto;
  padding-left: 12px;
  font-weight: 500;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
}
</style>
