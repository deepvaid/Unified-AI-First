<script setup lang="ts">
// Composite metric explorer (dotted Overview v2): a joined 4-cell KPI selector
// strip driving an embedded gradient area chart, with a per-widget Compare
// toggle. Metric selection and Compare are widget-local; the data window comes
// from the dashboard's global filters via useWidgetData. Renders bespoke — the
// widget card suppresses its standard header for this type.
import { computed, inject, ref, unref } from 'vue'
import { bounds, linePath, valueToY, CHART_H, CHART_W, TREND_CURRENT, TREND_PREVIOUS } from '../dotted/dottedChartMath'
import { CHART_PALETTE_OVERRIDE, tintHex, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardMetricExplorerData, DashboardMetricExplorerMetric } from '@/stores/dashboards/types'
import { formatFullValue } from '@/utils/formatNumber'

const props = defineProps<{
  data: DashboardMetricExplorerData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
const treatment = computed(() => resolvedTheme.value.treatment)

/** Current period / previous period hues (shadcn area-gradient recipe: two
    blues, each with a vertical fill fading to the baseline). Legacy themes keep
    the literal dottedChartMath pair so the palette-review widget stays in sync;
    exploration options take the lead series + its comparison colour. */
const CURRENT_COLOR = computed(() => {
  const t = treatment.value
  if (!t) return TREND_CURRENT
  return t.ramps?.trendCurrent ?? resolvedTheme.value.series[0]!
})
const PREVIOUS_COLOR = computed(() => {
  const t = treatment.value
  if (!t) return TREND_PREVIOUS
  return t.ramps?.trendPrevious
    ?? resolvedTheme.value.comparisonColor
    ?? tintHex(resolvedTheme.value.series[0]!, 0.55)
})

/** Option themes align the SVG gridlines with the Apex charts' grid colour. */
const gridColor = computed(() => {
  const t = treatment.value
  if (!t) return undefined
  return t.grid.color ?? resolvedTheme.value.chrome.grid
})

const selectedKey = ref<DashboardMetricExplorerMetric['key']>('revenue')
const compare = ref(true)

const selected = computed<DashboardMetricExplorerMetric>(() => {
  return props.data.metrics.find((metric) => metric.key === selectedKey.value) ?? props.data.metrics[0]!
})

const compareAvailable = computed(() => selected.value.prev.some((value) => value > 0) && selected.value.delta !== '')
const compareOn = computed(() => compare.value && compareAvailable.value)

function formatValue(metric: DashboardMetricExplorerMetric, value: number): string {
  return formatFullValue(value, metric.unit)
}

const chart = computed(() => {
  const metric = selected.value
  const vals = compareOn.value ? metric.cur.concat(metric.prev) : metric.cur
  let [lo, hi] = bounds(vals, metric.zeroBased)
  if (metric.key === 'orders') hi = Math.max(2, Math.ceil(hi / 2) * 2)
  const close = (d: string) => (d ? `${d} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z` : '')
  const line = linePath(metric.cur, hi, lo)
  const prev = compareOn.value ? linePath(metric.prev, hi, lo) : ''
  return {
    strokePath: line,
    areaPath: close(line),
    prevStrokePath: prev,
    prevAreaPath: close(prev),
    lo,
    hi,
  }
})

// ── Hover tooltip ─────────────────────────────────────────────────────────
const plotEl = ref<HTMLElement | null>(null)
const hoverIndex = ref<number | null>(null)

function onPointerMove(event: PointerEvent) {
  const el = plotEl.value
  const count = selected.value.cur.length
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
  /** Vertical position on the plot, 0–100%. */
  topPct: number
}

const hoverPoints = computed<HoverPoint[]>(() => {
  const index = hoverIndex.value
  if (index == null) return []
  const metric = selected.value
  const { lo, hi } = chart.value
  const point = (key: string, label: string, color: string, raw: number | undefined): HoverPoint => ({
    key,
    label,
    color,
    value: formatValue(metric, raw ?? 0),
    topPct: Math.min(100, Math.max(0, (valueToY(raw ?? 0, hi, lo) / CHART_H) * 100)),
  })
  const rows = [point('current', metric.label, CURRENT_COLOR.value, metric.cur[index])]
  if (compareOn.value) rows.push(point('previous', 'Previous period', PREVIOUS_COLOR.value, metric.prev[index]))
  return rows
})

const hoverLeftPct = computed(() => {
  const index = hoverIndex.value
  const count = selected.value.cur.length
  if (index == null || count < 2) return 0
  return (index / (count - 1)) * 100
})

const hoverLabel = computed(() =>
  hoverIndex.value == null ? '' : props.data.pointLabels[hoverIndex.value] ?? '',
)

/** Anchor the tooltip so it never overflows the card at either edge. */
const tooltipTransform = computed(() => {
  if (hoverLeftPct.value < 15) return 'translateX(0)'
  if (hoverLeftPct.value > 85) return 'translateX(-100%)'
  return 'translateX(-50%)'
})
</script>

<template>
  <div class="mx" :style="gridColor ? { '--mx-grid': gridColor } : undefined">
    <div class="mx__strip" role="group" aria-label="Metric selector">
      <button
        v-for="metric in data.metrics"
        :key="metric.key"
        type="button"
        class="mx__cell"
        :class="{ 'mx__cell--active': selectedKey === metric.key }"
        :aria-pressed="selectedKey === metric.key"
        @click="selectedKey = metric.key"
      >
        <span class="mx__wash" aria-hidden="true" />
        <span class="mx__bar" aria-hidden="true" />
        <span class="mx__label">{{ metric.label }}</span>
        <span class="mx__value">{{ metric.formattedValue }}</span>
        <span v-if="metric.delta" class="mx__delta-row">
          <span class="mx__delta" :class="metric.deltaPositive ? 'mx__delta--pos' : 'mx__delta--neg'">{{ metric.delta }}</span>
          <span class="mx__vs">{{ data.vsLabel }}</span>
        </span>
      </button>
    </div>

    <div class="mx__chart">
      <div class="mx__chart-head">
        <div class="mx__chart-heading">
          <h3 class="mx__chart-title">{{ selected.label }}</h3>
          <p class="mx__chart-sub">Select a metric above · {{ selected.sub.toLowerCase() }}<template v-if="compareAvailable"> · {{ data.vsLabelLong }}</template></p>
        </div>
        <button
          v-if="compareAvailable"
          type="button"
          class="mx__compare"
          :aria-pressed="compare"
          @click="compare = !compare"
        >
          <span class="mx__compare-dash" :style="{ opacity: compare ? 1 : 0.25 }" aria-hidden="true" />Compare
        </button>
      </div>
      <div class="mx__plot">
        <div
          ref="plotEl"
          class="mx__canvas"
          @pointermove="onPointerMove"
          @pointerleave="hoverIndex = null"
        >
          <svg viewBox="0 0 720 200" preserveAspectRatio="none" class="mx__svg" role="img" :aria-label="`${selected.label} trend chart`">
            <defs>
              <!-- shadcn's area-gradient recipe: .8 → .1 stops fading straight
                   down to the baseline, then fill-opacity on the path (effective
                   ~.35 → .04) — that pairing is what makes the reference read
                   airy rather than saturated. One gradient per series, both in
                   the blue family. -->
              <linearGradient id="mxFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" :stop-color="CURRENT_COLOR" stop-opacity="0.8" />
                <stop offset="95%" :stop-color="CURRENT_COLOR" stop-opacity="0.1" />
              </linearGradient>
              <linearGradient id="mxFillPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" :stop-color="PREVIOUS_COLOR" stop-opacity="0.8" />
                <stop offset="95%" :stop-color="PREVIOUS_COLOR" stop-opacity="0.1" />
              </linearGradient>
              <!-- Contains the cardinal curve's slight overshoot at sharp
                   peaks/valleys, the way recharts clips to its plot area. -->
              <clipPath id="mxClip">
                <rect x="0" y="0" width="720" height="200" />
              </clipPath>
            </defs>
            <!-- Horizontal only, and no rule on the baseline (as in the reference). -->
            <line v-for="y in [0, 50, 100, 150]" :key="y" x1="0" :y1="y" x2="720" :y2="y" class="mx__grid" vector-effect="non-scaling-stroke" />
            <!-- Previous period sits behind the current one (overlaid, not stacked:
                 period-over-period values aren't additive). -->
            <g clip-path="url(#mxClip)">
              <!-- Previous period reads as backdrop: lighter blue, slightly
                   fainter fill — the current period stays the foreground. -->
              <path v-if="chart.prevAreaPath" :d="chart.prevAreaPath" fill="url(#mxFillPrev)" fill-opacity="0.3" />
              <path v-if="chart.prevStrokePath" :d="chart.prevStrokePath" fill="none" :stroke="PREVIOUS_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
              <path :d="chart.areaPath" fill="url(#mxFill)" fill-opacity="0.45" />
              <path :d="chart.strokePath" fill="none" :stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            </g>
          </svg>

          <!-- Active dots and tooltip are HTML, not SVG: the canvas is
               preserveAspectRatio="none", so an SVG circle would stretch into
               an ellipse. -->
          <template v-if="hoverPoints.length">
            <span
              v-for="point in hoverPoints"
              :key="point.key"
              class="mx__dot"
              :style="{ left: `${hoverLeftPct}%`, top: `${point.topPct}%`, background: point.color }"
              aria-hidden="true"
            />
            <div class="mp-chart-tip" :style="{ left: `${hoverLeftPct}%`, transform: tooltipTransform }">
              <div class="mp-chart-tip__title">{{ hoverLabel }}</div>
              <div v-for="point in hoverPoints" :key="point.key" class="mp-chart-tip__row">
                <span class="mp-chart-tip__dot" :style="{ background: point.color }" />
                <span class="mp-chart-tip__label">{{ point.label }}</span>
                <span class="mp-chart-tip__value">{{ point.value }}</span>
              </div>
            </div>
          </template>
        </div>
        <div class="mx__xaxis">
          <span v-for="label in data.xLabels" :key="label">{{ label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mx {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  container-type: inline-size;
}

.mx__strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  flex: none;
}

.mx__cell {
  position: relative;
  background: var(--surface-primary);
  border: 0;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.mx__wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--accent) 15%, transparent) 0%,
    color-mix(in oklch, var(--accent) 3%, transparent) 100%
  );
  opacity: 0;
}

.mx__bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0;
}

.mx__cell--active .mx__wash,
.mx__cell--active .mx__bar {
  opacity: 1;
}

.mx__label {
  position: relative;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mx__value {
  position: relative;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.mx__delta-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.mx__delta {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.mx__delta--pos {
  color: var(--pos);
}

.mx__delta--neg {
  color: var(--neg);
}

.mx__vs {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mx__chart {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 22px 16px;
}

.mx__chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mx__chart-heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.mx__chart-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--text-primary);
}

.mx__chart-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}

.mx__compare {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-primary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  flex: none;
}

.mx__compare-dash {
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: var(--muted);
}

/* No y-axis column (matching the shadcn reference) — the plot runs full-bleed
   and values are read from the hover tooltip. */
.mx__plot {
  flex: 1;
  min-width: 0;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mx__canvas {
  position: relative;
  flex: 1;
  min-height: 140px;
}

.mx__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.mx__grid {
  /* --mx-grid is only set by the exploration options (see gridColor above). */
  stroke: var(--mx-grid, var(--border-subtle));
  stroke-width: 1;
}

.mx__xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--muted);
}

/* Active dot — ringed in the card surface so it reads on top of the fill. */
.mx__dot {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px var(--surface-primary);
  pointer-events: none;
}

/* Tooltip — same anatomy/skin as the Apex charts' .mp-chart-tip so every
   chart in the app shares one tooltip look. */
.mp-chart-tip {
  position: absolute;
  top: 8px;
  z-index: 2;
  pointer-events: none;
  background: var(--mp-tip-bg, var(--surface-primary));
  border: 1px solid var(--mp-tip-border, var(--border-subtle));
  border-radius: var(--mp-tip-radius, 8px);
  box-shadow: var(--mp-tip-shadow, var(--elevation-modal));
  padding: 8px 10px;
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
}

.mp-chart-tip__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--mp-tip-title-color, var(--text-primary));
  margin-bottom: 4px;
}

.mp-chart-tip__row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

.mp-chart-tip__dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.mp-chart-tip__label {
  color: var(--mp-tip-muted, var(--muted));
}

.mp-chart-tip__value {
  margin-left: auto;
  padding-left: 12px;
  font-weight: 500;
  color: var(--mp-tip-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}

@container (max-width: 620px) {
  .mx__strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
