<script setup lang="ts">
// Multi-series line composite matching the real dashboard's channel-trend
// widget: series 0 solid 3px, the rest dashed 2px, smooth curves, visible
// $Nk y-axis labels, top-right dot legend, card tooltip.
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { cardTooltip } from '../../ChartLab/chartLabApex'
import { SCN_CHART, scnBaseOptions, useDeferredMount, useScnChrome } from '../scnApex'

export interface ScnLineSeries {
  name: string
  data: number[]
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: ScnLineSeries[]
    colors?: string[]
    height?: number
    chartLabel: string
    formatValue?: (v: number) => string
    formatAxis?: (v: number) => string
  }>(),
  {
    colors: () => [...SCN_CHART],
    height: 260,
    formatValue: (v: number) => `$${Math.round(v).toLocaleString('en-US')}`,
    formatAxis: (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`),
  },
)

const chrome = useScnChrome()
const ready = useDeferredMount()

const options = computed<ApexOptions>(() => {
  const base = scnBaseOptions(chrome.value)
  return {
    ...base,
    chart: { ...base.chart, type: 'line' },
    colors: [...props.colors],
    stroke: {
      curve: 'smooth',
      width: props.series.map((_, i) => (i === 0 ? 3 : 2)),
      dashArray: props.series.map((_, i) => (i === 0 ? 0 : 6)),
    },
    markers: { size: 0, strokeWidth: 2, hover: { size: 4 } },
    xaxis: { ...base.xaxis, categories: [...props.labels] },
    yaxis: {
      labels: {
        show: true,
        style: { colors: chrome.value.axis, fontSize: '12px' },
        formatter: (v: number) => props.formatAxis(v),
      },
    },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      custom: cardTooltip((i) => ({
        title: props.labels[i] ?? '',
        rows: props.series.map((s, si) => ({
          color: props.colors[si] ?? SCN_CHART[1],
          label: s.name,
          value: props.formatValue(s.data[i] ?? 0),
        })),
      })),
    },
  }
})
</script>

<template>
  <div class="scn-chart">
    <div class="scn-chart__legend scn-chart__legend--top" aria-hidden="true">
      <span v-for="(s, i) in series" :key="s.name" class="scn-chart__legend-item">
        <span class="scn-chart__legend-dot" :style="{ background: colors[i] ?? SCN_CHART[i % 5] }" />
        {{ s.name }}
      </span>
    </div>
    <div role="img" :aria-label="chartLabel" :style="{ minHeight: `${height}px` }">
      <VueApexCharts v-if="ready" type="line" :height="height" :options="options" :series="series" />
    </div>
  </div>
</template>

<style scoped>
.scn-chart {
  min-width: 0;
}

.scn-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.scn-chart__legend--top {
  justify-content: flex-end;
  margin-bottom: 8px;
}

.scn-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--scn-muted);
}

.scn-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
