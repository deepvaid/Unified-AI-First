<script setup lang="ts">
// shadcn-style area chart: smooth 2px stroke, vertical gradient fill
// (40% → 5%), horizontal-only faint grid, hidden y-axis, card tooltip.
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { cardTooltip } from '../../ChartLab/chartLabApex'
import { SCN_CHART, scnBaseOptions, useDeferredMount, useScnChrome } from '../scnApex'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values: number[]
    name: string
    color?: string
    height?: number
    chartLabel: string
    formatValue?: (v: number) => string
  }>(),
  {
    color: SCN_CHART[1],
    height: 280,
    formatValue: (v: number) => `$${Math.round(v).toLocaleString('en-US')}`,
  },
)

const chrome = useScnChrome()
const ready = useDeferredMount()

const series = computed(() => [{ name: props.name, type: 'area', data: props.values }])

const options = computed<ApexOptions>(() => {
  const base = scnBaseOptions(chrome.value)
  return {
    ...base,
    chart: { ...base.chart, type: 'area' },
    colors: [props.color],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { type: 'vertical', shadeIntensity: 0, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] },
    },
    markers: { size: 0, strokeWidth: 2, hover: { size: 4 } },
    xaxis: { ...base.xaxis, categories: [...props.labels], tickAmount: 6 },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      custom: cardTooltip((i) => ({
        title: props.labels[i] ?? '',
        rows: [{ color: props.color, label: props.name, value: props.formatValue(props.values[i] ?? 0) }],
      })),
    },
  }
})
</script>

<template>
  <div class="scn-chart" role="img" :aria-label="chartLabel" :style="{ minHeight: `${height}px` }">
    <VueApexCharts v-if="ready" type="area" :height="height" :options="options" :series="series" />
  </div>
</template>

<style scoped>
.scn-chart {
  min-width: 0;
}
</style>
