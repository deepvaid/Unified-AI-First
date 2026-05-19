<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import type { DashboardChartVariant, DashboardSeriesData, DashboardWidgetType } from '@/stores/dashboards/types'
import { applyChartTheme, chartPalette } from '@/plugins/chartPalette'
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

const chartHeight = computed(() => {
  if (!props.height || props.height < 60) return 220
  return Math.max(120, props.height - 4)
})

const { accentHex } = useAppTheme()
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

  return {
    ...base,
    colors: isPrev
      ? [accentHex.value, 'rgba(124, 58, 237, 0.55)']
      : [accentHex.value, ...chartPalette.slice(1)],
    chart: {
      ...base.chart,
      sparkline: { enabled: false },
      zoom: { enabled: false },
      redrawOnParentResize: false,
    },
    stroke: {
      curve: 'smooth',
      width: isPrev ? [3, 2] : (props.widgetType === 'timeseries' ? 3 : 0),
      ...(isPrev ? { dashArray: [0, 6] } : {}),
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '46%',
        distributed: isDistributedBar.value,
        horizontal: isHorizontalBar.value,
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
    dataLabels: { enabled: false },
    legend: isPrev
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
