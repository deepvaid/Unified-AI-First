<script setup lang="ts">
import { computed, defineAsyncComponent, inject, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import type { DashboardChartVariant, DashboardSeriesData, DashboardWidgetType } from '@/stores/dashboards/types'
import {
  CHART_PALETTE_OVERRIDE,
  chartLegendOptions,
  tintHex,
  useChartTheme,
  type ChartTheme,
} from '@/plugins/chartPalette'
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
const { theme, applyChartTheme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
const gradientMarks = computed(() => resolvedTheme.value.gradientMarks)
const vuetifyTheme = useTheme()
const markerStrokeColor = computed(() => (
  vuetifyTheme.global.current.value.dark
    ? vuetifyTheme.global.current.value.colors.surface
    : '#ffffff'
))

const isDistributedBar = computed(
  () => props.widgetType === 'bar' && props.data.series.length <= 1,
)

const isHorizontalBar = computed(
  () => props.widgetType === 'bar' && props.chartVariant === 'horizontal',
)

const apexChartType = computed<'area' | 'line' | 'bar'>(() => {
  if (props.widgetType === 'bar') return 'bar'
  if (props.chartVariant === 'line') return 'line'
  return 'area'
})

const chartSeries = computed(() => props.data.series)

const chartOptions = computed<ApexOptions>(() => {
  const base = applyChartTheme.value()
  const activePalette = resolvedTheme.value.series
  const chrome = resolvedTheme.value.chrome
  const gm = gradientMarks.value
  const isBar = props.widgetType === 'bar'
  const isVerticalBar = isBar && !isHorizontalBar.value
  const singleOrDistributedBar = isDistributedBar.value || props.data.series.length === 1
  const floatingBarLabels = gm && isVerticalBar && props.data.labels.length <= 8
  const showLegend = props.data.series.length > 1

  const gradientFill = (): ApexOptions['fill'] => {
    if (isBar) {
      if (isVerticalBar && singleOrDistributedBar) {
        const stops = resolvedTheme.value.axis
          .slice()
          .reverse()
          .map((color, i, arr) => ({ offset: i * (100 / (arr.length - 1)), color, opacity: 1 }))
        return { type: 'gradient', gradient: { type: 'vertical', colorStops: stops } }
      }
      return {
        type: 'gradient',
        gradient: {
          type: isHorizontalBar.value ? 'horizontal' : 'vertical',
          shadeIntensity: 0,
          opacityFrom: 1,
          opacityTo: 0.92,
          gradientToColors: activePalette.map((c) => tintHex(c, 0.45)),
        },
      }
    }
    if (apexChartType.value === 'area') {
      return {
        type: 'gradient',
        gradient: { shadeIntensity: 0.18, opacityFrom: 0.45, opacityTo: 0.03, stops: [0, 96, 100] },
      }
    }
    if (props.chartVariant === 'line' && props.data.series.length === 1) {
      const stops = resolvedTheme.value.axis.map((color, i, arr) => ({
        offset: i * (100 / (arr.length - 1)),
        color,
        opacity: 1,
      }))
      return { type: 'gradient', gradient: { type: 'horizontal', colorStops: stops } }
    }
    return { type: 'solid' }
  }

  const seriesColors = (themeOverride || gm)
    ? activePalette
    : [accentHex.value, ...activePalette.slice(1)]

  return {
    ...base,
    colors: seriesColors,
    chart: {
      ...base.chart,
      sparkline: { enabled: false },
      zoom: { enabled: false },
      redrawOnParentResize: false,
      ...(gm && props.widgetType === 'timeseries'
        ? { dropShadow: { enabled: true, top: 6, left: 0, blur: 6, opacity: 0.16, color: activePalette[0] } }
        : {}),
    },
    ...(floatingBarLabels
      ? { grid: { ...base.grid, padding: { ...base.grid?.padding, top: 24 } } }
      : {}),
    stroke: {
      curve: 'smooth',
      width: props.widgetType === 'timeseries'
        ? props.data.series.map((_, i) => (i === 0 ? 3 : 2))
        : 0,
      dashArray: props.widgetType === 'timeseries' && props.data.series.length > 1
        ? props.data.series.map((_, i) => (i === 0 ? 0 : 6))
        : undefined,
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
    fill: gm
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
    ...(props.widgetType === 'timeseries' && props.data.series.length === 1
      ? {
          markers: {
            size: 0,
            discrete: [{
              seriesIndex: 0,
              dataPointIndex: (props.data.series[0]?.data as number[]).length - 1,
              fillColor: accentHex.value,
              strokeColor: markerStrokeColor.value,
              size: 5,
            }],
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
            colors: [chrome.axisLabel],
          },
          formatter: (value: number) => formatBarLabel(value, props.data.unit),
        }
      : { enabled: false },
    legend: showLegend
      ? chartLegendOptions(activePalette, chrome, 'top')
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
          colors: chrome.axisLabel,
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
