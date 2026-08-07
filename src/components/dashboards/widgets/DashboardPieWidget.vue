<script setup lang="ts">
import { computed, defineAsyncComponent, inject, unref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import {
  CHART_PALETTE_OVERRIDE,
  chartLegendOptions,
  useChartTheme,
  type ChartTheme,
} from '@/plugins/chartPalette'
import type { DashboardSeriesData } from '@/stores/dashboards/types'

const props = withDefaults(defineProps<{
  data: DashboardSeriesData
  height?: number
}>(), {
  height: 0,
})

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

const chartHeight = computed(() => {
  if (!props.height || props.height < 60) return 220
  return Math.max(140, props.height - 4)
})

const { theme, applyChartTheme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
const palette = computed<string[]>(() => resolvedTheme.value.series)
// Exploration options describe the donut through `treatment`; legacy themes keep
// the gradientMarks branches below.
const treatment = computed(() => resolvedTheme.value.treatment)
const gradientMarks = computed(() => resolvedTheme.value.gradientMarks)
const vuetifyTheme = useTheme()
const strokeColor = computed(() => vuetifyTheme.global.current.value.colors.surface)

const series = computed(() => {
  const first = props.data.series[0]
  if (!first) return []
  return first.data
})

function formatSliceValue(value: number): string {
  if (props.data.unit === 'currency') {
    return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${Math.round(value)}`
  }
  if (props.data.unit === 'percent') return `${value.toFixed(1)}%`
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`
}

const chartAriaLabel = computed(() => {
  const parts = props.data.labels.map((label, i) => `${label} ${formatSliceValue(series.value[i] ?? 0)}`)
  return `Donut chart, ${parts.join(', ')}.`
})

// Card-style tooltip matching the chart widget's .mp-chart-tip skin.
function donutTooltip({ seriesIndex }: { seriesIndex: number }): string {
  const label = props.data.labels[seriesIndex] ?? ''
  const color = palette.value[seriesIndex % palette.value.length]
  return `<div class="mp-chart-tip"><div class="mp-chart-tip__row"><span class="mp-chart-tip__dot" style="background:${color}"></span><span class="mp-chart-tip__label">${label}</span><span class="mp-chart-tip__value">${formatSliceValue(series.value[seriesIndex] ?? 0)}</span></div></div>`
}

const options = computed<ApexOptions>(() => {
  const chrome = resolvedTheme.value.chrome
  const base = applyChartTheme.value()
  const t = treatment.value

  return {
    ...base,
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      toolbar: { show: false },
      // Treatment shadows are a stroke effect — on a filled ring they read as a
      // sticker halo, so donuts never take them (P9 critique).
      ...(t
        ? {}
        : gradientMarks.value
          ? { dropShadow: { enabled: true, top: 2, left: 0, blur: 8, opacity: 0.12 } }
          : {}),
    },
    labels: props.data.labels,
    colors: palette.value,
    // Gradient themes shade their slices; flat (Polaris) and blue render solid.
    fill: { type: t ? t.donut.fill : gradientMarks.value ? 'gradient' : 'solid' },
    legend: t
      ? {
          ...chartLegendOptions(palette.value, chrome, 'bottom'),
          markers: {
            size: t.legend.markerSize,
            shape: t.legend.markerShape,
            strokeWidth: 0,
            fillColors: palette.value,
          },
          onItemHover: { highlightDataSeries: t.legend.hoverHighlight },
        }
      : chartLegendOptions(palette.value, chrome, 'bottom'),
    dataLabels: {
      enabled: t ? t.donut.showDataLabels : true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: { fontSize: '11px', fontWeight: 600, colors: [chrome.axisLabel] },
      dropShadow: { enabled: false },
    },
    stroke: { width: t ? t.donut.strokeWidth : 2, colors: [strokeColor.value] },
    plotOptions: {
      pie: {
        donut: {
          size: t ? t.donut.size : '62%',
          labels: { show: false },
        },
        expandOnClick: false,
      },
    },
    tooltip: {
      ...base.tooltip,
      // Apex fills .apexcharts-tooltip-series-group with the raw series
      // colour for pie/donut by default; our CSS then forces the row text
      // to the theme's tooltipText token regardless, which reads near-white
      // on bright slice colours in dark mode. Disabling the fill keeps rows
      // on the standard tooltipBackground so tooltipText stays legible.
      fillSeriesColor: false,
      custom: donutTooltip,
      y: {
        formatter: (value: number) => formatSliceValue(value),
      },
    },
  }
})
</script>

<template>
  <div class="dashboard-pie-widget" role="img" :aria-label="chartAriaLabel">
    <ApexChart
      :height="chartHeight"
      width="100%"
      type="donut"
      :options="options"
      :series="series"
    />
  </div>
</template>

<style scoped>
.dashboard-pie-widget {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-top: 4px;
}

/* Card-style tooltip skin (same .mp-chart-tip markup as the chart widget). */
.dashboard-pie-widget :deep(.apexcharts-tooltip) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.dashboard-pie-widget :deep(.mp-chart-tip) {
  background: var(--mp-tip-bg, var(--surface-primary));
  border: 1px solid var(--mp-tip-border, var(--border-subtle));
  border-radius: var(--mp-tip-radius, 8px);
  box-shadow: var(--mp-tip-shadow, var(--elevation-modal));
  padding: 8px 10px;
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
}

.dashboard-pie-widget :deep(.mp-chart-tip__row) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

.dashboard-pie-widget :deep(.mp-chart-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dashboard-pie-widget :deep(.mp-chart-tip__label) {
  color: var(--mp-tip-muted, var(--muted));
}

.dashboard-pie-widget :deep(.mp-chart-tip__value) {
  margin-left: auto;
  padding-left: 12px;
  font-weight: 500;
  color: var(--mp-tip-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}
</style>
