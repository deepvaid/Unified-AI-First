<script setup lang="ts">
import { computed, inject, ref, unref, useId } from 'vue'
import { CHART_PALETTE_OVERRIDE, duotoneCompanion, tintHex, useChartTheme } from '@/plugins/chartPalette'
import type { DashboardDataSource, DashboardKpiData } from '@/stores/dashboards/types'
import { formatFullValue } from '@/utils/formatNumber'

const sparkFillId = useId()
const sparkLineId = useId()

const props = withDefaults(defineProps<{
  data: DashboardKpiData
  compact?: boolean
  title?: string
  subtitle?: string
  comparisonLabel?: string
  icon?: string
  aiGenerated?: boolean
  dataSource?: DashboardDataSource
  showViewReport?: boolean
}>(), {
  compact: false,
  title: '',
  subtitle: '',
  comparisonLabel: '',
  icon: '',
  aiGenerated: false,
  dataSource: undefined,
  showViewReport: false,
})

const emit = defineEmits<{
  viewReport: []
}>()

// Tint the sparkline to the active chart palette so KPI cards differentiate per theme.
// Only when a palette is pinned (compare page) or a non-default palette is active —
// the default keeps its existing accent color, so normal dashboards are unchanged.
const paletteOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const { palette: chartPaletteRef, theme: chartThemeRef } = useChartTheme()
// `theme` already resolves an injected override, so this covers compare panels too.
const treatment = computed(() => chartThemeRef.value.treatment)
const sparkColor = computed<string | undefined>(() => {
  const t = treatment.value
  if (t) return t.kpiSpark.color ?? chartThemeRef.value.series[0]
  const override = unref(paletteOverride)
  if (override) return override.series[0]
  return chartPaletteRef.value[0]
})
/** Area wash under the spark curve — 0.16 is the pre-treatment value. */
const sparkFillOpacity = computed(() => treatment.value?.kpiSpark.fillOpacity ?? 0.16)

// Embossed themes sweep the spark like the big charts: the line stroke runs
// from the luminous companion into the base colour, and the wash crests in the
// companion. Non-emboss themes keep the plain currentColor spark.
const sparkCompanion = computed<string | null>(() => (
  treatment.value?.effects.gloss && sparkColor.value
    ? tintHex(duotoneCompanion(sparkColor.value), 0.2)
    : null
))

const trendPositive = computed(() => props.data.delta == null || props.data.delta >= 0)
const trendIcon = computed(() => (trendPositive.value ? 'arrow-up-right' : 'arrow-down-right'))

// Unsigned magnitude — the diagonal arrow carries the direction.
const deltaText = computed(() => {
  const { delta, deltaLabel, unit } = props.data
  if (delta == null) return deltaLabel
  if (unit === 'percent') return `${Math.abs(delta).toFixed(1)} pp`
  return deltaLabel.replace(/^[+-]\s*/, '')
})

// Demote cents on currency values so the whole-dollar figure reads as the hero.
// Parse the already-formatted string (respects the source's whole-dollar rounding
// for large values); only splits when cents are actually present.
const moneyParts = computed(() => {
  if (props.data.unit !== 'currency') return null
  const match = props.data.formattedValue.match(/^(\$[\d,]+)(\.\d+)$/)
  if (!match) return null
  return { main: match[1], cents: match[2] }
})

/**
 * Centered moving average + downsample to ≤14 points. The Shopify stat-card
 * curve is a stylized read of the trend, not a precise chart — raw daily
 * buckets read as noise at this size.
 */
function smoothSeries(values: number[]): number[] {
  const window = Math.max(2, Math.round(values.length / 6))
  const averaged = values.map((_, i) => {
    const start = Math.max(0, i - window)
    const end = Math.min(values.length - 1, i + window)
    let sum = 0
    for (let j = start; j <= end; j += 1) sum += values[j]!
    return sum / (end - start + 1)
  })
  const target = 14
  if (averaged.length <= target) return averaged
  const step = (averaged.length - 1) / (target - 1)
  return Array.from({ length: target }, (_, i) => averaged[Math.round(i * step)]!)
}

const sparklineValues = computed(() => {
  // Real windowed data (Shopify stat-card style mini area) when the metric
  // provides it; deterministic wobble shaped by the delta otherwise.
  const real = props.data.sparkline
  if (real && real.length >= 2) {
    const smoothed = smoothSeries(real)
    const max = Math.max(...smoothed)
    const min = Math.min(...smoothed)
    const span = max - min || 1
    return smoothed.map((value) => 0.08 + ((value - min) / span) * 0.82)
  }
  const delta = props.data.delta ?? 12
  const slope = Math.max(-0.2, Math.min(0.24, delta / 900))
  const base = [0.2, 0.23, 0.31, 0.28, 0.36, 0.34, 0.43, 0.40, 0.51, 0.47, 0.56]
  return base.map((value, index) => Math.min(0.9, Math.max(0.08, value + slope * index)))
})

// Catmull-Rom → cubic bezier so the curve reads soft at stat-card size.
const sparklinePath = computed(() => {
  const values = sparklineValues.value
  if (values.length < 2) return ''
  const maxIndex = values.length - 1
  const pts = values.map((value, index) => ({ x: (index / maxIndex) * 100, y: 38 - value * 30 }))
  let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
})

const sparklineAreaPath = computed(() => (
  sparklinePath.value ? `${sparklinePath.value} L 100 40 L 0 40 Z` : ''
))

// --- Sparkline hover readout -------------------------------------------------
// Only real windowed data gets a readout; the synthetic fallback wobble has no
// values worth reporting.
const rawSpark = computed(() => (
  props.data.sparkline && props.data.sparkline.length >= 2 ? props.data.sparkline : null
))

// The sparkline is daily buckets over the current window ending today
// (useWidgetData bucketDaily .cur), so dates derive from the index.
const sparkDates = computed(() => {
  const raw = rawSpark.value
  if (!raw) return null
  const today = new Date()
  return raw.map((_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (raw.length - 1 - i))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
})

const sparkHoverIndex = ref<number | null>(null)

function onSparkMove(event: MouseEvent) {
  const raw = rawSpark.value
  if (!raw) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (!rect.width) return
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  sparkHoverIndex.value = Math.round(ratio * (raw.length - 1))
}

function onSparkLeave() {
  sparkHoverIndex.value = null
}

const sparkHoverPoint = computed(() => {
  const raw = rawSpark.value
  const index = sparkHoverIndex.value
  if (!raw || index == null) return null
  const ratio = raw.length > 1 ? index / (raw.length - 1) : 0
  // Sit the cursor dot on the drawn (smoothed) curve: linear interpolation of
  // the normalized points is close enough to the bezier at sparkline size.
  const values = sparklineValues.value
  const pos = ratio * (values.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.min(values.length - 1, lo + 1)
  const v = values[lo]! + (values[hi]! - values[lo]!) * (pos - lo)
  return {
    x: ratio * 100,
    topPct: ((38 - v * 30) / 40) * 100,
    value: formatFullValue(raw[index] ?? 0, props.data.unit),
    date: sparkDates.value?.[index] ?? '',
  }
})

// Marker on the curve's last point (mock: the spark ends in a dot).
const sparkEndPoint = computed(() => {
  if (!rawSpark.value) return null
  const values = sparklineValues.value
  const v = values[values.length - 1]
  if (v == null) return null
  return { topPct: ((38 - v * 30) / 40) * 100 }
})

// "Prev. 30d $19,030" — the previous-period value reconstructed from the delta.
const prevFormatted = computed(() => {
  const { value, delta, unit } = props.data
  if (delta == null) return ''
  const prev = unit === 'percent' ? value - delta : value / (1 + delta / 100)
  if (!Number.isFinite(prev)) return ''
  return formatFullValue(prev, unit)
})

// Footer label derived from the comparison basis: "vs prev 30d" → "Prev. 30d",
// "vs previous year" → "Prev. year", "vs yesterday" → "Yesterday".
const prevStatLabel = computed(() => {
  const stripped = props.comparisonLabel.replace(/^vs\s+/i, '').trim()
  if (!stripped) return 'Prev. period'
  const match = stripped.match(/^prev(?:ious)?\.?\s*(.*)$/i)
  if (match) return `Prev. ${match[1] || 'period'}`
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
})

// "Peak $1,365" — the highest daily bucket in the window.
const peakFormatted = computed(() => {
  const raw = rawSpark.value
  if (!raw || !raw.length) return ''
  const peak = Math.max(...raw)
  if (!Number.isFinite(peak)) return ''
  return formatFullValue(peak, props.data.unit)
})

</script>

<template>
  <div class="dashboard-kpi-widget d-flex flex-column h-100" :class="{ 'dashboard-kpi-widget--compact': compact }">
    <!-- Label only — the Prev/Peak footer carries the window, so no period
         caption; the mock drops the icon chip entirely. -->
    <div class="dashboard-kpi-widget__header-row">
      <div class="dashboard-kpi-widget__header-text">
        <div v-if="title" class="dashboard-kpi-widget__title-row">
          <h2 class="dashboard-kpi-widget__title mp-meta-label" :title="title">{{ title }}</h2>
          <v-tooltip v-if="aiGenerated" location="top" text="Made by Da Vinci">
            <template #activator="{ props: tipProps }">
              <span v-bind="tipProps" class="dashboard-kpi-widget__davinci-chip">
                <v-icon size="10">sparkles</v-icon>
                Da Vinci
              </span>
            </template>
          </v-tooltip>
        </div>
      </div>
    </div>

    <!-- Hero row: value + plain arrow delta on the left, sparkline beside it.
         Hovering the spark reads out the underlying daily value (real data only). -->
    <div class="dashboard-kpi-widget__hero">
      <div class="dashboard-kpi-widget__hero-main">
        <div class="dashboard-kpi-widget__value mp-kpi-value mp-money num">
          <template v-if="moneyParts"><span>{{ moneyParts.main }}</span><span class="mp-money__cents">{{ moneyParts.cents }}</span></template>
          <template v-else>{{ data.formattedValue }}</template>
        </div>
        <div
          v-if="deltaText"
          class="dashboard-kpi-widget__delta"
          :class="data.delta == null
            ? undefined
            : trendPositive ? 'dashboard-kpi-widget__delta--positive' : 'dashboard-kpi-widget__delta--negative'"
          :title="comparisonLabel || undefined"
          :aria-label="data.delta == null
            ? deltaText
            : `${trendPositive ? 'Up' : 'Down'} ${deltaText}${comparisonLabel ? ` ${comparisonLabel}` : ''}`"
        >
          <v-icon v-if="data.delta != null" size="13">{{ trendIcon }}</v-icon>
          {{ deltaText }}
        </div>
      </div>

      <div class="dashboard-kpi-widget__spark" aria-hidden="true" :style="sparkColor ? { color: sparkColor } : undefined">
        <div
          class="dashboard-kpi-widget__spark-hit"
          @mousemove="onSparkMove"
          @mouseleave="onSparkLeave"
        >
          <svg class="dashboard-kpi-widget__sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient :id="sparkFillId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="sparkCompanion ?? 'currentColor'" :stop-opacity="sparkFillOpacity" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
              </linearGradient>
              <linearGradient v-if="sparkCompanion" :id="sparkLineId" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" :stop-color="sparkCompanion" />
                <stop offset="100%" stop-color="currentColor" />
              </linearGradient>
            </defs>
            <path
              :d="sparklineAreaPath"
              class="dashboard-kpi-widget__sparkline-fill"
              :fill="`url(#${sparkFillId})`"
            />
            <path
              :d="sparklinePath"
              class="dashboard-kpi-widget__sparkline-line"
              :style="sparkCompanion ? { stroke: `url(#${sparkLineId})` } : undefined"
            />
          </svg>
          <span
            v-if="sparkEndPoint"
            class="dashboard-kpi-widget__spark-end-dot"
            :style="{ top: `${sparkEndPoint.topPct}%` }"
          />
          <template v-if="sparkHoverPoint">
            <span class="dashboard-kpi-widget__spark-guide" :style="{ left: `${sparkHoverPoint.x}%` }" />
            <span
              class="dashboard-kpi-widget__spark-dot"
              :style="{ left: `${sparkHoverPoint.x}%`, top: `${sparkHoverPoint.topPct}%` }"
            />
            <div class="dashboard-kpi-widget__spark-tip">
              <span class="dashboard-kpi-widget__spark-tip-date">{{ sparkHoverPoint.date }}</span>
              <span class="dashboard-kpi-widget__spark-tip-value num">{{ sparkHoverPoint.value }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.secondaryStat" class="dashboard-kpi-widget__secondary num">{{ data.secondaryStat }}</div>

    <div v-if="data.location" class="dashboard-kpi-widget__location-chip">
      <v-icon size="11">map-pin</v-icon>
      {{ data.location }}
    </div>

    <!-- Divider footer: previous-period value + window peak, derived from the
         delta and the raw daily buckets. -->
    <footer v-if="prevFormatted || peakFormatted" class="dashboard-kpi-widget__stats">
      <span v-if="prevFormatted" class="dashboard-kpi-widget__stat">
        <span class="dashboard-kpi-widget__stat-label">{{ prevStatLabel }}</span>
        <span class="dashboard-kpi-widget__stat-value num">{{ prevFormatted }}</span>
      </span>
      <span v-if="peakFormatted" class="dashboard-kpi-widget__stat dashboard-kpi-widget__stat--end">
        <span class="dashboard-kpi-widget__stat-label">Peak</span>
        <span class="dashboard-kpi-widget__stat-value num">{{ peakFormatted }}</span>
      </span>
    </footer>

    <!-- Stat cards carry the number, not its provenance: the source chip and
         "Updated …" stamp stay on the chart/table cards only. This footer
         survives solely for the View Report action. -->
    <footer v-if="showViewReport" class="dashboard-kpi-widget__foot">
      <button
        type="button"
        class="dashboard-kpi-widget__view-report"
        @click="emit('viewReport')"
      >
        <span class="dashboard-kpi-widget__view-report-text">View Report</span>
        <v-icon size="12">arrow-up-right</v-icon>
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.dashboard-kpi-widget {
  /* Any slack between the grid cell (h=3, 172px) and the compact content
     splits evenly around the hero instead of pooling above the footer. */
  justify-content: space-between;
  gap: var(--mp-space-10);
  /* P4-1: the KPI card is the deliberately DENSE member of the widget family —
     one inset from the scale's compact tier (`card.paddingCompact`), not the
     20 the rest of the family takes. Was an ad-hoc 14 / 16 / 12, i.e. three
     different values on one box. */
  padding: var(--mp-component-card-paddingCompact);
  container-type: inline-size;
}

/* Narrow cards: the spark drops below the value block instead of squeezing beside it. */
@container (max-width: 240px) {
  .dashboard-kpi-widget__value {
    font-size: var(--mp-fontSize-24);
  }

  .dashboard-kpi-widget__spark {
    width: 100%;
  }
}

// Footer (source chip + "Updated Xh ago" / "View Report") has no room to
// spare once the card drops below ~220px (e.g. Da Vinci panel open narrows
// the grid column to ~196px) — the source chip stays fixed-width, and the
// trailing label truncates with an ellipsis instead of clipping/overflowing
// the card. Full text stays available via the `title` attribute above.
@container (max-width: 220px) {
  .dashboard-kpi-widget__foot {
    gap: var(--mp-space-6);
  }

  .dashboard-kpi-widget__view-report {
    min-width: 0;
    flex-shrink: 1;
  }

  .dashboard-kpi-widget__view-report-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dashboard-kpi-widget__header-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  min-width: 0;
}

.dashboard-kpi-widget__header-text {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  min-width: 0;
  flex: 1 1 auto;
}

.dashboard-kpi-widget__title-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  min-width: 0;
}

.dashboard-kpi-widget__davinci-chip {
  display: inline-flex;
  align-items: center;
  /* P4-3: was gap 3 / height 18 / padding 0 7 / font 10 — none on a scale stop,
     and a second copy of the chip DashboardWidgetCard draws. Both now resolve to
     the shared chip ramp. */
  gap: var(--mp-space-4);
  flex-shrink: 0;
  height: var(--mp-component-chip-height-sm);
  padding: 0 var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-radius-full);
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
  border: 1px solid var(--dv-border);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: default;
}

.dashboard-kpi-widget__davinci-chip :deep(.v-icon) {
  color: var(--dv-accent);
}

.dashboard-kpi-widget__title {
  overflow: hidden;
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--muted);
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Hero row (design 1c): value + delta bottom-left, spark bottom-right. The
   hero absorbs the grid cell's spare height and the spark grows into it
   (min 44px), so no void opens between the chart and the text. */
.dashboard-kpi-widget__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--mp-space-12);
  flex-wrap: wrap;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.dashboard-kpi-widget__hero-main {
  min-width: 0;
  flex: 0 0 auto;
}

.dashboard-kpi-widget__value {
  overflow: visible;
  /* Dashboard-local compact size (design 1c); the DS kpiValue token stays
     32px for hero KPIs elsewhere. */
  font-size: var(--mp-fontSize-28);
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__value {
  font-size: var(--mp-fontSize-24);
}

/* Plain-text delta: diagonal arrow + unsigned magnitude, no pill background. */
.dashboard-kpi-widget__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  margin-top: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget__delta--positive {
  color: var(--pos-ink);
}

.dashboard-kpi-widget__delta--negative {
  color: var(--neg-ink);
}

/* Divider footer: "Prev. 30d $19,030" left, "Peak $1,365" right. */
.dashboard-kpi-widget__stats {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-12);
  padding-top: var(--mp-component-card-gapCompact);
  border-top: 1px solid var(--border-subtle);
  min-width: 0;
}

.dashboard-kpi-widget__stat {
  display: inline-flex;
  align-items: baseline;
  gap: var(--mp-space-6);
  min-width: 0;
  white-space: nowrap;
}

.dashboard-kpi-widget__stat--end {
  margin-left: auto;
}

.dashboard-kpi-widget__stat-label {
  font-size: var(--mp-fontSize-11);
  font-weight: 500;
  color: var(--muted);
}

.dashboard-kpi-widget__stat-value {
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget__secondary {
  margin-top: var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__location-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  margin-top: var(--mp-space-6);
  padding: var(--mp-space-2) var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-radius-full);
  background: color-mix(in oklch, var(--text-primary) 5%, var(--surface-primary));
  border: 1px solid var(--border-subtle);
  color: var(--muted);
  font-size: var(--mp-fontSize-11);
  font-weight: 500;
  line-height: 1;
  align-self: flex-start;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__location-chip :deep(.v-icon) {
  color: currentColor;
  opacity: 0.85;
}

/* Spark: 108px wide on compact cards, fills the hero's height (min 44px). */
.dashboard-kpi-widget__spark {
  flex: none;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Sparkline plot width — chart-canvas geometry, exempt from the spacing
     scale (Phase 2/3 changelog). Same for the 44px hero-height floor below. */
  width: 108px;
  min-height: 0;
  color: var(--accent);
}

/* Wide cards (large desktops, 3-4 up on a 16" screen): the 108px spark leaves
   an empty middle — let it take the card's right half, height still fixed. */
@container (min-width: 360px) {
  .dashboard-kpi-widget__spark {
    width: 48%;
    max-width: 260px;
  }
}

.dashboard-kpi-widget__spark-hit {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1 1 auto;
  min-height: 0;
}

.dashboard-kpi-widget__sparkline {
  display: block;
  width: 100%;
  flex: 1 1 44px;
  min-height: 44px;
  overflow: visible;
}

/* Marker on the curve's last point. */
.dashboard-kpi-widget__spark-end-dot {
  position: absolute;
  left: 100%;
  width: var(--mp-space-6);
  height: var(--mp-space-6);
  border-radius: 50%;
  transform: translate(-60%, -50%);
  background: currentColor;
  box-shadow: 0 0 0 2px var(--surface-primary);
  pointer-events: none;
}

/* Hover readout: index cursor + dot on the curve + a small value tip. */
.dashboard-kpi-widget__spark-guide {
  position: absolute;
  top: 0;
  bottom: var(--mp-space-2);
  width: 1px;
  transform: translateX(-0.5px);
  background: color-mix(in oklch, currentColor 30%, transparent);
  pointer-events: none;
}

.dashboard-kpi-widget__spark-dot {
  position: absolute;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: currentColor;
  box-shadow: 0 0 0 2px var(--surface-primary);
  pointer-events: none;
}

.dashboard-kpi-widget__spark-tip {
  position: absolute;
  /* Centered above the fixed spark block (design 1c); floats over the hero
     whitespace, never over the value column. */
  left: 50%;
  bottom: calc(100% + var(--mp-space-4));
  transform: translateX(-50%);
  display: flex;
  align-items: baseline;
  gap: var(--mp-space-6);
  padding: var(--mp-space-4) var(--mp-space-8);
  border-radius: var(--mp-component-chip-radius);
  border: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  box-shadow: var(--elevation-raised);
  white-space: nowrap;
  pointer-events: none;
}

.dashboard-kpi-widget__spark-tip-date {
  font-size: var(--mp-fontSize-11);
  font-weight: 500;
  color: var(--muted);
}

.dashboard-kpi-widget__spark-tip-value {
  font-size: var(--mp-fontSize-12);
  font-weight: 650;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

@container (max-height: 150px) {
  .dashboard-kpi-widget__sparkline {
    height: var(--mp-space-28);
    min-height: var(--mp-space-28);
  }
}

.dashboard-kpi-widget__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.dashboard-kpi-widget__sparkline-fill {
  stroke: none;
}

/* Compact variant */
.dashboard-kpi-widget--compact {
  padding: var(--mp-component-card-paddingCompact);
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__sparkline {
  height: var(--mp-space-32);
  min-height: var(--mp-space-32);
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__header-row {
  gap: var(--mp-space-8);
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__title {
  font-size: var(--mp-fontSize-12);
  line-height: 1.2;
}

.dashboard-kpi-widget__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* Bleeds the footer to the card's edges by cancelling the compact inset. */
  gap: var(--mp-space-8);
  margin: var(--mp-space-12) calc(var(--mp-component-card-paddingCompact) * -1) calc(var(--mp-component-card-paddingCompact) * -1);
  padding: var(--mp-space-8) var(--mp-component-card-paddingCompact);
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  min-height: var(--mp-space-40);
  flex-shrink: 0;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__foot {
  margin: var(--mp-space-10) calc(var(--mp-component-card-paddingCompact) * -1) calc(var(--mp-component-card-paddingCompact) * -1);
  padding: var(--mp-space-6) var(--mp-component-card-paddingCompact);
  min-height: var(--mp-space-32);
}

.dashboard-kpi-widget__view-report {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  color: var(--cloud-retail-link);
  cursor: pointer;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.dashboard-kpi-widget__view-report:hover {
  color: var(--cloud-retail-link-hover);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dashboard-kpi-widget__view-report :deep(.v-icon) {
  color: currentColor;
}
</style>
