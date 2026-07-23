<script setup lang="ts">
import { computed, defineAsyncComponent, inject, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import type { DashboardChartVariant, DashboardSeriesData, DashboardWidgetType } from '@/stores/dashboards/types'
import { applyChartTheme, activeChartTheme, CHART_PALETTE_OVERRIDE, tintHex, type ChartTheme } from '@/plugins/chartPalette'
import { useAppTheme } from '@/composables/useAppTheme'

const props = withDefaults(defineProps<{
  data: DashboardSeriesData
  widgetType: Extract<DashboardWidgetType, 'timeseries' | 'bar'>
  chartVariant?: DashboardChartVariant
  height?: number
}>(), {
  chartVariant: undefined,
  height: 0,
})

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

const chartReady = ref(false)
let deferredRenderHandle: number | undefined

onMounted(() => {
  if (typeof window === 'undefined') {
    chartReady.value = true
    return
  }

  const revealChart = () => {
    chartReady.value = true
  }

  if ('requestIdleCallback' in window) {
    deferredRenderHandle = window.requestIdleCallback(revealChart, { timeout: 500 }) as unknown as number
    return
  }

  deferredRenderHandle = globalThis.setTimeout(revealChart, 0)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || deferredRenderHandle == null) return

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(deferredRenderHandle)
    return
  }

  globalThis.clearTimeout(deferredRenderHandle)
})

function formatAxisValue(value: number, unit: DashboardSeriesData['unit']): string {
  if (unit === 'currency') {
    return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${Math.round(value)}`
  }
  if (unit === 'percent') {
    return `${value.toFixed(0)}%`
  }
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`
}

// Per-bar floating labels need one decimal of precision below 10k — whole-k rounding
// makes neighbouring bars read as identical (e.g. four "$4k" labels).
function formatBarLabel(value: number, unit: DashboardSeriesData['unit']): string {
  if (unit === 'percent') return `${value.toFixed(0)}%`
  const prefix = unit === 'currency' ? '$' : ''
  if (value < 1000) return `${prefix}${Math.round(value)}`
  const k = value / 1000
  const text = k < 10 ? k.toFixed(1).replace(/\.0$/, '') : `${Math.round(k)}`
  return `${prefix}${text}k`
}

const chartHeight = computed(() => {
  if (!props.height || props.height < 60) return 220
  return Math.max(120, props.height - 4)
})

const { accentHex } = useAppTheme()
// A theme pinned by an ancestor (the /chart-themes compare page) wins over both the
// global theme and the accent-first override, so each panel shows its true colours.
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(themeOverride) ?? activeChartTheme.value)
const palette = computed<string[]>(() => theme.value.series)
const gradientMarks = computed(() => theme.value.gradientMarks)
const vuetifyTheme = useTheme()
const markerStrokeColor = computed(() => (
  vuetifyTheme.global.current.value.dark
    ? 'rgb(var(--v-theme-surface))'
    : '#ffffff'
))
const base = applyChartTheme()

// For single-series bar charts, distribute palette colors across categories.
const isDistributedBar = computed(
  () => props.widgetType === 'bar' && props.data.series.length <= 1,
)

const isHorizontalBar = computed(
  () => props.widgetType === 'bar' && props.chartVariant === 'horizontal',
)

const apexChartType = computed<'area' | 'line' | 'bar'>(() => {
  if (props.widgetType === 'bar') return 'bar'
  // timeseries
  if (props.chartVariant === 'line') return 'line'
  return 'area'
})

// Show a synthetic "Previous" dashed-gray overlay for single-series timeseries charts.
const showPreviousOverlay = computed(
  () => props.widgetType === 'timeseries' && props.data.series.length === 1,
)

// Synthesize a Previous series scaled down by ~15% for visual reference.
const chartSeries = computed(() => {
  if (!showPreviousOverlay.value) return props.data.series
  const current = props.data.series[0]!
  const previousData = (current.data as number[]).map((v) =>
    typeof v === 'number' ? Math.round(v * 0.85) : v,
  )
  return [current, { name: 'Previous', data: previousData }]
})

const lastDataPointIndex = computed(() => {
  if (!props.data.series[0]) return 0
  return (props.data.series[0].data as number[]).length - 1
})

const chartOptions = computed<ApexOptions>(() => {
  const isPrev = showPreviousOverlay.value
  const gm = gradientMarks.value
  const isBar = props.widgetType === 'bar'
  const isVerticalBar = isBar && !isHorizontalBar.value
  const singleOrDistributedBar = isDistributedBar.value || props.data.series.length === 1
  // Floating value labels: only for vertical bar charts with a small number of columns.
  const floatingBarLabels = gm && isVerticalBar && props.data.labels.length <= 8

  // Hyper-style gradient fill; when gradientMarks is off this falls through to today's fill.
  const gradientFill = (): ApexOptions['fill'] => {
    if (isBar) {
      if (isVerticalBar && singleOrDistributedBar) {
        // One through-mark vertical gradient shared by all bars: bright end at the top
        // (offset 0), deep end at the bottom (offset 100).
        const stops = theme.value.axis
          .slice()
          .reverse()
          .map((color, i, arr) => ({ offset: i * (100 / (arr.length - 1)), color, opacity: 1 }))
        return { type: 'gradient', gradient: { type: 'vertical', colorStops: stops } }
      }
      // Multi-series bars (vertical or horizontal): per-series gradient toward a tint.
      return {
        type: 'gradient',
        gradient: {
          type: isHorizontalBar.value ? 'horizontal' : 'vertical',
          shadeIntensity: 0,
          opacityFrom: 1,
          opacityTo: 0.92,
          gradientToColors: palette.value.map((c) => tintHex(c, 0.45)),
        },
      }
    }
    if (apexChartType.value === 'area') {
      return {
        type: 'gradient',
        gradient: { shadeIntensity: 0.18, opacityFrom: 0.45, opacityTo: 0.03, stops: [0, 96, 100] },
      }
    }
    // Single-series line: gradient stroke running along the x-axis through the theme axis.
    if (props.chartVariant === 'line' && props.data.series.length === 1) {
      const stops = theme.value.axis.map((color, i, arr) => ({
        offset: i * (100 / (arr.length - 1)),
        color,
        opacity: 1,
      }))
      return { type: 'gradient', gradient: { type: 'horizontal', colorStops: stops } }
    }
    // Multi-series line: keep solid per-series strokes (glow via chart.dropShadow only).
    return { type: 'solid' }
  }

  return {
    ...base,
    colors: (themeOverride || gm)
      ? palette.value
      : isPrev
        ? [accentHex.value, '#75D6FF']
        : [accentHex.value, ...palette.value.slice(1)],
    chart: {
      ...base.chart,
      sparkline: { enabled: false },
      zoom: { enabled: false },
      redrawOnParentResize: false,
      ...(gm && props.widgetType === 'timeseries'
        ? { dropShadow: { enabled: true, top: 6, left: 0, blur: 6, opacity: 0.16, color: palette.value[0] } }
        : {}),
    },
    ...(floatingBarLabels
      ? { grid: { ...base.grid, padding: { ...base.grid?.padding, top: 24 } } }
      : {}),
    stroke: {
      curve: 'smooth',
      width: isPrev ? [3, 2] : (props.widgetType === 'timeseries' ? 3 : 0),
      ...(isPrev ? { dashArray: [0, 6] } : {}),
    },
    plotOptions: {
      bar: {
        borderRadius: gm ? 10 : 8,
        ...(gm ? { borderRadiusApplication: 'end' } : {}),
        columnWidth: gm ? '52%' : '46%',
        distributed: isDistributedBar.value,
        horizontal: isHorizontalBar.value,
        ...(floatingBarLabels ? { dataLabels: { position: 'top' } } : {}),
      },
    },
    fill: isPrev
      ? {
          type: 'gradient',
          gradient: {
            shadeIntensity: 0.18,
            opacityFrom: 0.34,
            opacityTo: 0.02,
            stops: [0, 96, 100],
          },
        }
      : gm
        ? gradientFill()
        : {
            type: apexChartType.value === 'area' ? 'gradient' : 'solid',
            gradient: {
              shadeIntensity: 0.18,
              opacityFrom: 0.36,
              opacityTo: 0.02,
              stops: [0, 96, 100],
            },
          },
    ...(isPrev
      ? {
          markers: {
            size: 0,
            discrete: [
              {
                seriesIndex: 0,
                dataPointIndex: lastDataPointIndex.value,
                fillColor: accentHex.value,
                strokeColor: markerStrokeColor.value,
                size: 5,
              },
            ],
            hover: { size: 5 },
          },
        }
      : {}),
    dataLabels: floatingBarLabels
      ? {
          enabled: true,
          offsetY: -18,
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: ['rgba(var(--v-theme-on-surface), 0.72)'],
          },
          formatter: (value: number) => formatBarLabel(value, props.data.unit),
        }
      : { enabled: false },
    legend: (isPrev || props.data.series.length > 1)
      ? { show: true, position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 500 }
      : { show: false },
    xaxis: {
      ...base.xaxis,
      categories: props.data.labels,
      labels: {
        ...base.xaxis?.labels,
        offsetY: 2,
      },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatAxisValue(value, props.data.unit),
        style: {
          colors: 'rgba(var(--v-theme-on-surface), 0.55)',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    tooltip: {
      ...base.tooltip,
      y: {
        formatter: (value: number) => formatAxisValue(value, props.data.unit),
      },
    },
  }
})
</script>

<template>
  <div class="dashboard-chart-widget">
    <ApexChart
      v-if="chartReady"
      :height="chartHeight"
      width="100%"
      :type="apexChartType"
      :options="chartOptions"
      :series="chartSeries"
    />
    <div v-else class="dashboard-chart-widget__placeholder">
      <v-skeleton-loader type="image" height="100%" width="100%" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-chart-widget {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-top: 4px;
}

.dashboard-chart-widget__placeholder {
  width: 100%;
  height: 100%;
  min-height: 120px;
}
</style>
