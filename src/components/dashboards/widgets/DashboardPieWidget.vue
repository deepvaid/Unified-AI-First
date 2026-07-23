<script setup lang="ts">
import { computed, defineAsyncComponent, inject, unref } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'
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

const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(themeOverride) ?? activeChartTheme.value)
const palette = computed<string[]>(() => theme.value.series)
const gradientMarks = computed(() => theme.value.gradientMarks)

const series = computed(() => {
  const first = props.data.series[0]
  if (!first) return []
  return first.data
})

const options = computed<ApexOptions>(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit',
    toolbar: { show: false },
    ...(gradientMarks.value
      ? { dropShadow: { enabled: true, top: 2, left: 0, blur: 8, opacity: 0.12 } }
      : {}),
  },
  labels: props.data.labels,
  colors: palette.value,
  ...(gradientMarks.value ? { fill: { type: 'gradient' } } : {}),
  legend: {
    position: 'bottom',
    fontSize: '12px',
    fontWeight: 500,
    labels: { colors: 'rgba(var(--v-theme-on-surface), 0.75)' },
    markers: { size: 8 },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(0)}%`,
    style: { fontSize: '11px', fontWeight: 600 },
    dropShadow: { enabled: false },
  },
  stroke: { width: 2, colors: ['rgb(var(--v-theme-surface))'] },
  plotOptions: {
    pie: {
      donut: {
        size: '62%',
        labels: { show: false },
      },
      expandOnClick: false,
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => {
        if (props.data.unit === 'currency') {
          return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${Math.round(value)}`
        }
        if (props.data.unit === 'percent') return `${value.toFixed(1)}%`
        return value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`
      },
    },
  },
}))
</script>

<template>
  <div class="dashboard-pie-widget">
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
</style>
