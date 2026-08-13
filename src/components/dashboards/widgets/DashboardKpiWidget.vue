<script setup lang="ts">
import { computed, inject, ref, unref, useId } from 'vue'
import { CHART_PALETTES, CHART_PALETTE_OVERRIDE, useChartTheme } from '@/plugins/chartPalette'
import type { DashboardDataSource, DashboardKpiData } from '@/stores/dashboards/types'
import { formatFullValue } from '@/utils/formatNumber'

const sparkFillId = useId()

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
  if (chartPaletteRef.value !== CHART_PALETTES.blue) return chartPaletteRef.value[0]
  return undefined
})
/** Area wash under the spark curve — 0.16 is the pre-treatment value. */
const sparkFillOpacity = computed(() => treatment.value?.kpiSpark.fillOpacity ?? 0.16)

const trendPositive = computed(() => props.data.delta == null || props.data.delta >= 0)
const trendIcon = computed(() => (trendPositive.value ? 'chevron-up' : 'chevron-down'))

const displayDeltaLabel = computed(() => {
  if (props.data.delta == null) return props.data.deltaLabel
  if (props.data.unit === 'percent') {
    return `${props.data.delta >= 0 ? '+' : ''}${props.data.delta.toFixed(1)} pp`
  }
  return props.data.deltaLabel
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
    // Clamp the tip's anchor so it never hangs past the card edges.
    tipX: Math.min(84, Math.max(16, ratio * 100)),
    topPct: ((38 - v * 30) / 40) * 100,
    value: formatFullValue(raw[index] ?? 0, props.data.unit),
    date: sparkDates.value?.[index] ?? '',
  }
})

</script>

<template>
  <div class="dashboard-kpi-widget d-flex flex-column h-100" :class="{ 'dashboard-kpi-widget--compact': compact }">
    <!-- Icon chip + label + period caption -->
    <div class="dashboard-kpi-widget__header-row">
      <div
        v-if="icon"
        class="dashboard-kpi-widget__icon-chip"
        :class="dataSource && `dashboard-kpi-widget__icon-chip--${dataSource}`"
      >
        <v-icon :size="compact ? 13 : 14">{{ icon }}</v-icon>
      </div>
      <div class="dashboard-kpi-widget__header-text">
        <div v-if="title" class="dashboard-kpi-widget__title-row">
          <h3 class="dashboard-kpi-widget__title mp-meta-label" :title="title">{{ title }}</h3>
          <v-tooltip v-if="aiGenerated" location="top" text="Made by Da Vinci">
            <template #activator="{ props: tipProps }">
              <span v-bind="tipProps" class="dashboard-kpi-widget__davinci-chip">
                <v-icon size="10">sparkles</v-icon>
                Da Vinci
              </span>
            </template>
          </v-tooltip>
        </div>
        <div class="dashboard-kpi-widget__period" v-if="subtitle">{{ subtitle }}</div>
      </div>
    </div>

    <!-- Big value + delta badge on one row; the comparison basis ("vs prev 30d")
         lives on as the badge's tooltip/aria instead of visible caption. -->
    <div class="dashboard-kpi-widget__value-row">
      <div class="dashboard-kpi-widget__value mp-kpi-value mp-money num">
        <template v-if="moneyParts"><span>{{ moneyParts.main }}</span><span class="mp-money__cents">{{ moneyParts.cents }}</span></template>
        <template v-else>{{ data.formattedValue }}</template>
      </div>
      <span
        class="dashboard-kpi-widget__trend-pill"
        :class="trendPositive ? 'dashboard-kpi-widget__trend-pill--positive' : 'dashboard-kpi-widget__trend-pill--negative'"
        :title="comparisonLabel || undefined"
        :aria-label="comparisonLabel ? `${displayDeltaLabel} ${comparisonLabel}` : undefined"
      >
        <v-icon size="12">{{ trendIcon }}</v-icon>
        {{ displayDeltaLabel }}
      </span>
    </div>

    <div v-if="data.secondaryStat" class="dashboard-kpi-widget__secondary num">{{ data.secondaryStat }}</div>

    <div v-if="data.location" class="dashboard-kpi-widget__location-chip">
      <v-icon size="11">map-pin</v-icon>
      {{ data.location }}
    </div>

    <!-- Full-width sparkline baseline, pinned to the bottom of the body.
         Hovering it reads out the underlying daily value (real data only). -->
    <div class="dashboard-kpi-widget__spark" aria-hidden="true" :style="sparkColor ? { color: sparkColor } : undefined">
      <div
        class="dashboard-kpi-widget__spark-hit"
        @mousemove="onSparkMove"
        @mouseleave="onSparkLeave"
      >
        <svg class="dashboard-kpi-widget__sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="sparkFillId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="currentColor" :stop-opacity="sparkFillOpacity" />
              <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            :d="sparklineAreaPath"
            class="dashboard-kpi-widget__sparkline-fill"
            :fill="`url(#${sparkFillId})`"
          />
          <path :d="sparklinePath" class="dashboard-kpi-widget__sparkline-line" />
        </svg>
        <template v-if="sparkHoverPoint">
          <span class="dashboard-kpi-widget__spark-guide" :style="{ left: `${sparkHoverPoint.x}%` }" />
          <span
            class="dashboard-kpi-widget__spark-dot"
            :style="{ left: `${sparkHoverPoint.x}%`, top: `${sparkHoverPoint.topPct}%` }"
          />
          <div class="dashboard-kpi-widget__spark-tip" :style="{ left: `${sparkHoverPoint.tipX}%` }">
            <span class="dashboard-kpi-widget__spark-tip-date">{{ sparkHoverPoint.date }}</span>
            <span class="dashboard-kpi-widget__spark-tip-value num">{{ sparkHoverPoint.value }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Stat cards carry the number, not its provenance: the source chip and
         "Updated …" stamp stay on the chart/table cards only, so a KPI row reads
         as four figures rather than four figures plus eight labels. The footer
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
  justify-content: flex-start;
  padding: 20px;
  container-type: inline-size;
}

@media (max-width: 768px) {
  .dashboard-kpi-widget {
    padding: 16px;
  }
}

@container (max-width: 260px) {
  .dashboard-kpi-widget__icon-chip {
    display: none;
  }

  .dashboard-kpi-widget__value {
    font-size: 22px;
  }
}

// Footer (source chip + "Updated Xh ago" / "View Report") has no room to
// spare once the card drops below ~220px (e.g. Da Vinci panel open narrows
// the grid column to ~196px) — the source chip stays fixed-width, and the
// trailing label truncates with an ellipsis instead of clipping/overflowing
// the card. Full text stays available via the `title` attribute above.
@container (max-width: 220px) {
  .dashboard-kpi-widget__foot {
    gap: 6px;
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
  gap: 10px;
  min-width: 0;
}

.dashboard-kpi-widget__header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.dashboard-kpi-widget__icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--r-chip);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.dashboard-kpi-widget__icon-chip--commerce {
  background: color-mix(in oklch, var(--cloud-commerce-accent) 12%, transparent);
  color: var(--cloud-commerce-text);
}

.dashboard-kpi-widget__icon-chip--marketing {
  background: color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent);
  color: var(--cloud-marketing-text);
}

.dashboard-kpi-widget__icon-chip--analytics {
  background: color-mix(in oklch, var(--cloud-analytics-accent) 12%, transparent);
  color: var(--cloud-analytics-text);
}

.dashboard-kpi-widget__icon-chip--contacts {
  background: color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent);
  color: var(--cloud-contacts-text);
}

.dashboard-kpi-widget__icon-chip--service {
  background: color-mix(in oklch, var(--cloud-service-accent) 12%, transparent);
  color: var(--cloud-service-text);
}

.dashboard-kpi-widget__icon-chip--retail {
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.dashboard-kpi-widget__title-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dashboard-kpi-widget__davinci-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
  border: 1px solid var(--dv-border);
  font-size: 10px;
  font-weight: 600;
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
  /* Restyle spec: 12px KPI labels (the shared metaLabel token is 11px). */
  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__period {
  /* One notch quieter than the label so the header reads as one line + a whisper. */
  color: color-mix(in oklch, var(--muted) 80%, transparent);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  min-width: 0;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__value-row {
  margin-top: 4px;
}

.dashboard-kpi-widget__value {
  overflow: visible;
  /* Dashboard-local 24px override; the DS kpiValue token stays 32px for
     hero KPIs elsewhere. */
  font-size: 24px;
  line-height: 1.05;
  letter-spacing: -0.025em;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__value {
  font-size: 22px;
}

.dashboard-kpi-widget__trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 9px 3px 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget__trend-pill--positive {
  color: var(--pos-ink);
  background: color-mix(in oklch, var(--pos) 12%, transparent);
}

.dashboard-kpi-widget__trend-pill--negative {
  color: var(--neg-ink);
  background: color-mix(in oklch, var(--neg) 12%, transparent);
}

.dashboard-kpi-widget__secondary {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__location-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--text-primary) 5%, var(--surface-primary));
  border: 1px solid var(--border-subtle);
  color: var(--muted);
  font-size: 11px;
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

/* Full-width baseline sparkline pinned to the bottom of the card body. The
   curve absorbs the card's spare height (48–96px) instead of leaving a dead
   slab between the value and a fixed-height chart. */
.dashboard-kpi-widget__spark {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1 1 auto;
  margin-top: auto;
  padding-top: 12px;
  color: var(--accent);
  min-height: 0;
}

.dashboard-kpi-widget__spark-hit {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 96px;
}

.dashboard-kpi-widget__sparkline {
  display: block;
  width: 100%;
  flex: 1 1 48px;
  min-height: 48px;
  max-height: 96px;
  overflow: visible;
}

/* Hover readout: index cursor + dot on the curve + a small value tip. */
.dashboard-kpi-widget__spark-guide {
  position: absolute;
  top: 0;
  bottom: 2px;
  width: 1px;
  transform: translateX(-0.5px);
  background: color-mix(in oklch, currentColor 30%, transparent);
  pointer-events: none;
}

.dashboard-kpi-widget__spark-dot {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: currentColor;
  border: 2px solid var(--surface-primary);
  box-shadow: var(--elevation-raised);
  pointer-events: none;
}

.dashboard-kpi-widget__spark-tip {
  position: absolute;
  /* Sits in the empty air above the curve (the top strip of the spark area)
     so it never covers the KPI value row. */
  top: 0;
  transform: translate(-50%, -35%);
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 7px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  box-shadow: var(--elevation-raised);
  white-space: nowrap;
  pointer-events: none;
}

.dashboard-kpi-widget__spark-tip-date {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--muted);
}

.dashboard-kpi-widget__spark-tip-value {
  font-size: 12px;
  font-weight: 650;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

@container (max-height: 150px) {
  .dashboard-kpi-widget__sparkline {
    flex-basis: 28px;
    min-height: 28px;
  }
  .dashboard-kpi-widget__spark {
    padding-top: 8px;
  }
}

.dashboard-kpi-widget__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.dashboard-kpi-widget__sparkline-fill {
  stroke: none;
}

/* Compact variant */
.dashboard-kpi-widget--compact {
  padding: 14px 16px;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__spark {
  padding-top: 8px;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__sparkline {
  height: 30px;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__icon-chip {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__header-row {
  gap: 8px;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__title {
  font-size: 12px;
  line-height: 1.2;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__period {
  font-size: 10.5px;
}

.dashboard-kpi-widget__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 12px -18px -16px;
  padding: 8px 18px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  min-height: 36px;
  flex-shrink: 0;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__foot {
  margin: 10px -16px -14px;
  padding: 6px 16px;
  min-height: 32px;
}

.dashboard-kpi-widget__view-report {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: 11.5px;
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
