<script setup lang="ts">
// Generic soft area chart — gradient fade, dashed crosshair, card tooltip,
// last-point dot + value badge. Used for timeseries catalog metrics.
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { cardTooltip, labBaseOptions } from '../chartLabApex'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    name: string
    color: string
    formatValue?: (v: number) => string
    formatAxis?: (v: number) => string
    height?: number
    chartLabel: string
  }>(),
  {
    formatValue: (v: number) => `$${Math.round(v).toLocaleString('en-US')}`,
    formatAxis: (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `$${Math.round(v)}`),
    height: 300,
  },
)

const series = computed(() => [{ name: props.name, type: 'area', data: props.values }])

const options = computed<ApexOptions>(() => {
  const base = labBaseOptions()
  const last = props.values.length - 1
  return {
    ...base,
    chart: { ...base.chart, type: 'area' },
    colors: [props.color],
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: { type: 'vertical', shadeIntensity: 0, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 96, 100] },
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      hover: { size: 5 },
      discrete: [{ seriesIndex: 0, dataPointIndex: last, size: 5, fillColor: props.color, strokeColor: '#FFFFFF' }],
    },
    xaxis: { ...base.xaxis, categories: [...props.labels], tickAmount: 6 },
    yaxis: {
      min: 0,
      labels: {
        style: { fontSize: '11px' },
        formatter: (v: number) => props.formatAxis(v),
      },
    },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      custom: cardTooltip((i) => ({
        title: props.labels[i] ?? '',
        rows: [{ color: props.color, label: props.name, value: props.formatValue(props.values[i] ?? 0) }],
      })),
    },
    annotations: {
      points: [
        {
          x: props.labels[last] ?? '',
          y: props.values[last] ?? 0,
          marker: { size: 0 },
          label: {
            text: props.formatValue(props.values[last] ?? 0),
            offsetY: -10,
            borderWidth: 0,
            borderRadius: 6,
            style: {
              background: props.color,
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              padding: { left: 8, right: 8, top: 4, bottom: 4 },
            },
          },
        },
      ],
    },
  }
})
</script>

<template>
  <div class="lac" role="img" :aria-label="chartLabel">
    <VueApexCharts type="area" :height="height" :options="options" :series="series" />
  </div>
</template>

<style scoped>
.lac {
  min-width: 0;
}
</style>
