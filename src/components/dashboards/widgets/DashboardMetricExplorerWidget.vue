<script setup lang="ts">
// Composite metric explorer (dotted Overview v2): a joined 4-cell KPI selector
// strip driving an embedded dotted area chart, with a per-widget Compare
// toggle. Metric selection and Compare are widget-local; the data window comes
// from the dashboard's global filters via useWidgetData. Renders bespoke — the
// widget card suppresses its standard header for this type.
import { computed, ref } from 'vue'
import { bounds, linePath, CHART_H, CHART_W } from '../dotted/dottedChartMath'
import type { DashboardMetricExplorerData, DashboardMetricExplorerMetric } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardMetricExplorerData
}>()

const selectedKey = ref<DashboardMetricExplorerMetric['key']>('revenue')
const compare = ref(true)

const selected = computed<DashboardMetricExplorerMetric>(() => {
  return props.data.metrics.find((metric) => metric.key === selectedKey.value) ?? props.data.metrics[0]!
})

const compareAvailable = computed(() => selected.value.prev.some((value) => value > 0) && selected.value.delta !== '')
const compareOn = computed(() => compare.value && compareAvailable.value)

function formatAxis(metric: DashboardMetricExplorerMetric, value: number): string {
  if (metric.unit === 'percent') return `${value.toFixed(1)}%`
  if (metric.unit === 'currency') {
    return value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(value)}`
  }
  return String(Math.round(value))
}

const chart = computed(() => {
  const metric = selected.value
  const vals = compareOn.value ? metric.cur.concat(metric.prev) : metric.cur
  let [lo, hi] = bounds(vals, metric.zeroBased)
  if (metric.key === 'orders') hi = Math.max(2, Math.ceil(hi / 2) * 2)
  const line = linePath(metric.cur, hi, lo)
  return {
    strokePath: line,
    areaPath: line ? `${line} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z` : '',
    prevPath: compareOn.value ? linePath(metric.prev, hi, lo) : '',
    yLabels: [formatAxis(metric, hi), formatAxis(metric, (hi + lo) / 2), formatAxis(metric, lo)],
  }
})
</script>

<template>
  <div class="mx">
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
      <div class="mx__plot-row">
        <div class="mx__yaxis">
          <span v-for="label in chart.yLabels" :key="label">{{ label }}</span>
        </div>
        <div class="mx__plot">
          <svg viewBox="0 0 720 200" preserveAspectRatio="none" class="mx__svg" role="img" :aria-label="`${selected.label} trend chart`">
            <defs>
              <linearGradient id="mxFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0092D4" stop-opacity="0.18" />
                <stop offset="60%" stop-color="#3FB4E6" stop-opacity="0.07" />
                <stop offset="100%" stop-color="#63CDEF" stop-opacity="0" />
              </linearGradient>
              <pattern id="mxDots" width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.15" fill="#0092D4" fill-opacity="0.30" />
              </pattern>
              <linearGradient id="mxStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#0092D4" />
                <stop offset="60%" stop-color="#3FB4E6" />
                <stop offset="100%" stop-color="#63CDEF" />
              </linearGradient>
            </defs>
            <line v-for="y in [0, 100, 200]" :key="y" x1="0" :y1="y" x2="720" :y2="y" class="mx__grid" stroke-dasharray="2 5" vector-effect="non-scaling-stroke" />
            <path :d="chart.areaPath" fill="url(#mxFill)" />
            <path :d="chart.areaPath" fill="url(#mxDots)" />
            <path v-if="chart.prevPath" :d="chart.prevPath" fill="none" class="mx__prev" stroke-width="1.5" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" />
            <path :d="chart.strokePath" fill="none" stroke="url(#mxStroke)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
          </svg>
          <div class="mx__xaxis">
            <span v-for="label in data.xLabels" :key="label">{{ label }}</span>
          </div>
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

.mx__plot-row {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 180px;
}

.mx__yaxis {
  width: 44px;
  flex: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 26px;
  font-size: 11px;
  color: var(--muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mx__plot {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mx__svg {
  width: 100%;
  flex: 1;
  min-height: 140px;
  display: block;
  overflow: visible;
}

.mx__grid {
  stroke: var(--border-subtle);
  stroke-width: 1;
}

.mx__prev {
  stroke: var(--muted);
  opacity: 0.55;
}

.mx__xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--muted);
}

@container (max-width: 620px) {
  .mx__strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
