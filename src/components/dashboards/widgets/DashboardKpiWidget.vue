<script setup lang="ts">
import { computed, inject, toRef, unref, useId } from 'vue'
import { useLiveAgo } from '@/composables/useRelativeTime'
import MpSourceCloudChip from '@/components/MpSourceCloudChip.vue'
import { activeChartPalette, CHART_PALETTES, CHART_PALETTE_OVERRIDE } from '@/plugins/chartPalette'
import type { DashboardDataSource, DashboardKpiData } from '@/stores/dashboards/types'

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
  lastRefreshedAt?: string
  showViewReport?: boolean
  /** Micro-viz style shown in the spark slot (per-metric, see metricCatalog). */
  sparkVariant?: 'area' | 'bars' | 'dots'
}>(), {
  compact: false,
  title: '',
  subtitle: '',
  comparisonLabel: '',
  icon: '',
  aiGenerated: false,
  dataSource: undefined,
  lastRefreshedAt: undefined,
  showViewReport: false,
  sparkVariant: 'area',
})

const emit = defineEmits<{
  viewReport: []
}>()

const lastRefreshedAt = toRef(() => props.lastRefreshedAt)
const updatedLabel = useLiveAgo(lastRefreshedAt)

// Per-source spark tint used on the default blue theme. Values reuse the per-cloud
// accent hues defined in src/styles/source-cloud-colors.css (single source of truth) —
// referenced as CSS vars so light/dark overrides and future edits stay in one place.
const SOURCE_SPARK_COLOR: Partial<Record<DashboardDataSource, string>> = {
  commerce: 'var(--cloud-commerce-accent)',
  marketing: 'var(--cloud-marketing-accent)',
  analytics: 'var(--cloud-analytics-accent)',
  contacts: 'var(--cloud-contacts-accent)',
  service: 'var(--cloud-service-accent)',
  retail: 'var(--cloud-retail-accent)',
}

// Tint the sparkline so KPI cards differentiate. Precedence:
//   1. pinned palette (compare page) → its series[0]
//   2. non-default global theme (?chart=ocean) → active palette series[0]
//   3. default blue theme → tint by the widget's data-source cloud colour
//      (falls back to the CSS --accent when the source has no cloud colour).
const paletteOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const sparkColor = computed<string | undefined>(() => {
  const override = unref(paletteOverride)
  if (override) return override.series[0]
  if (activeChartPalette.value !== CHART_PALETTES.blue) return activeChartPalette.value[0]
  if (props.dataSource) return SOURCE_SPARK_COLOR[props.dataSource]
  return undefined
})

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

const sparklineValues = computed(() => {
  const delta = props.data.delta ?? 12
  const slope = Math.max(-0.2, Math.min(0.24, delta / 900))
  const base = [0.2, 0.23, 0.31, 0.28, 0.36, 0.34, 0.43, 0.40, 0.51, 0.47, 0.56]
  return base.map((value, index) => Math.min(0.9, Math.max(0.08, value + slope * index)))
})

const sparklinePoints = computed(() => {
  const values = sparklineValues.value
  const maxIndex = Math.max(values.length - 1, 1)
  return values
    .map((value, index) => {
      const x = (index / maxIndex) * 100
      const y = 38 - value * 30
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

// 'bars' variant: rounded-top rects filling the 100x40 viewBox, baseline-aligned.
const sparkBars = computed(() => {
  const values = sparklineValues.value
  const slot = 100 / values.length
  const barW = slot * 0.66
  return values.map((value, index) => {
    const h = Math.max(2, value * 36)
    return { x: index * slot + (slot - barW) / 2, y: 40 - h, w: barW, h }
  })
})

// 'dots' variant: ~10 columns of up to 4 dots, peak column at full opacity.
const sparkDots = computed(() => {
  const values = sparklineValues.value.slice(0, 10)
  const max = Math.max(...values, 0.0001)
  const peak = values.indexOf(Math.max(...values))
  return values.map((value, index) => ({
    count: Math.max(1, Math.round((value / max) * 4)),
    peak: index === peak,
  }))
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
          <div class="dashboard-kpi-widget__title mp-meta-label" :title="title">{{ title }}</div>
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

    <!-- Big value -->
    <div class="dashboard-kpi-widget__value mp-kpi-value mp-money num">
      <template v-if="moneyParts"><span>{{ moneyParts.main }}</span><span class="mp-money__cents">{{ moneyParts.cents }}</span></template>
      <template v-else>{{ data.formattedValue }}</template>
    </div>

    <!-- Trend inline with comparison label (full width — no truncation) -->
    <div class="dashboard-kpi-widget__trend">
      <span
        class="dashboard-kpi-widget__trend-pill"
        :class="trendPositive ? 'dashboard-kpi-widget__trend-pill--positive' : 'dashboard-kpi-widget__trend-pill--negative'"
      >
        <v-icon size="12">{{ trendIcon }}</v-icon>
        {{ displayDeltaLabel }}
      </span>
      <span v-if="comparisonLabel" class="dashboard-kpi-widget__comparison">{{ comparisonLabel }}</span>
    </div>

    <div v-if="data.location" class="dashboard-kpi-widget__location-chip">
      <v-icon size="11">map-pin</v-icon>
      {{ data.location }}
    </div>

    <!-- Full-width micro-viz, pinned to the bottom of the body. All variants sit in the
         same container so the source/theme tint (container `color`) applies to each. -->
    <div class="dashboard-kpi-widget__spark" aria-hidden="true" :style="sparkColor ? { color: sparkColor } : undefined">
      <svg
        v-if="sparkVariant === 'bars'"
        class="dashboard-kpi-widget__sparkline"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <rect
          v-for="(bar, i) in sparkBars"
          :key="i"
          :x="bar.x"
          :y="bar.y"
          :width="bar.w"
          :height="bar.h"
          rx="1.5"
          class="dashboard-kpi-widget__bar"
        />
      </svg>
      <div v-else-if="sparkVariant === 'dots'" class="dashboard-kpi-widget__dots">
        <span
          v-for="(col, i) in sparkDots"
          :key="i"
          class="dashboard-kpi-widget__dots-col"
          :class="{ 'dashboard-kpi-widget__dots-col--dim': !col.peak }"
        >
          <span v-for="d in col.count" :key="d" class="dashboard-kpi-widget__dot" />
        </span>
      </div>
      <svg v-else class="dashboard-kpi-widget__sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
        <defs>
          <linearGradient :id="sparkFillId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.16" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon
          :points="`0,40 ${sparklinePoints} 100,40`"
          class="dashboard-kpi-widget__sparkline-fill"
          :fill="`url(#${sparkFillId})`"
        />
        <polyline :points="sparklinePoints" class="dashboard-kpi-widget__sparkline-line" />
      </svg>
    </div>

    <footer v-if="dataSource" class="dashboard-kpi-widget__foot">
      <MpSourceCloudChip :data-source="dataSource" size="sm" :icon-only="compact" />
      <button
        v-if="showViewReport"
        type="button"
        class="dashboard-kpi-widget__view-report"
        @click="emit('viewReport')"
      >
        View Report
        <v-icon size="12">arrow-up-right</v-icon>
      </button>
      <span v-else-if="updatedLabel" class="dashboard-kpi-widget__updated">
        <v-icon size="11">clock</v-icon>
        Updated {{ updatedLabel }}
      </span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.dashboard-kpi-widget {
  justify-content: flex-start;
  padding: 18px 20px;
  container-type: inline-size;
}

@container (max-width: 260px) {
  .dashboard-kpi-widget__icon-chip {
    display: none;
  }

  .dashboard-kpi-widget__value {
    font-size: 26px;
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
  gap: 1px;
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
  color: var(--muted);
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__period {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-kpi-widget__value {
  overflow: visible;
  margin-top: 10px;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__value {
  margin-top: 4px;
  font-size: 22px;
}

.dashboard-kpi-widget__trend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.dashboard-kpi-widget__trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px 2px 6px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.dashboard-kpi-widget__trend-pill--positive {
  color: var(--pos);
  background: color-mix(in oklch, var(--pos) 12%, transparent);
}

.dashboard-kpi-widget__trend-pill--negative {
  color: var(--neg);
  background: color-mix(in oklch, var(--neg) 12%, transparent);
}

.dashboard-kpi-widget__comparison {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-kpi-widget__location-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--ink) 5%, var(--surface-1));
  border: 1px solid var(--hairline);
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

/* Full-width baseline sparkline, pinned to the bottom of the card body */
.dashboard-kpi-widget__spark {
  margin-top: auto;
  padding-top: 14px;
  color: var(--accent);
  min-height: 0;
}

.dashboard-kpi-widget__sparkline {
  display: block;
  width: 100%;
  height: 40px;
  overflow: visible;
}

@container (max-height: 150px) {
  .dashboard-kpi-widget__sparkline {
    height: 28px;
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

/* 'bars' variant — rounded-top mini bar row, tinted via container color */
.dashboard-kpi-widget__bar {
  fill: currentColor;
}

/* 'dots' variant — compact dot matrix, tinted via container color */
.dashboard-kpi-widget__dots {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  height: 40px;
}

.dashboard-kpi-widget__dots-col {
  display: flex;
  flex: 1 1 0;
  flex-direction: column-reverse;
  align-items: center;
  gap: 3px;
}

.dashboard-kpi-widget__dots-col--dim {
  opacity: 0.4;
}

.dashboard-kpi-widget__dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

@container (max-height: 150px) {
  .dashboard-kpi-widget__dots {
    height: 28px;
  }
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__dots {
  height: 30px;
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
  justify-content: space-between;
  gap: 8px;
  margin: 12px -18px -16px;
  padding: 8px 18px;
  border-top: 1px solid var(--hairline);
  background: var(--surface-1);
  min-height: 36px;
  flex-shrink: 0;
}

.dashboard-kpi-widget--compact .dashboard-kpi-widget__foot {
  margin: 10px -16px -14px;
  padding: 6px 16px;
  min-height: 32px;
}

.dashboard-kpi-widget__updated {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-kpi-widget__updated :deep(.v-icon) {
  color: var(--muted);
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
