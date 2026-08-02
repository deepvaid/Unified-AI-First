<script setup lang="ts">
// shadcn-style column chart: rounded tops, single or grouped series,
// dot legend below when grouped, card tooltip.
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { cardTooltip } from '../../ChartLab/chartLabApex'
import { SCN_CHART, scnBaseOptions, useDeferredMount, useScnChrome } from '../scnApex'

export interface ScnBarSeries {
  name: string
  data: number[]
}

const props = withDefaults(
  defineProps<{
    categories: string[]
    series: ScnBarSeries[]
    colors?: string[]
    height?: number
    chartLabel: string
    formatValue?: (v: number) => string
    /** Full tooltip titles when the axis categories are abbreviated. */
    tooltipTitles?: string[]
  }>(),
  {
    colors: () => [SCN_CHART[1]],
    height: 240,
    formatValue: (v: number) => v.toLocaleString('en-US'),
  },
)

const chrome = useScnChrome()
const ready = useDeferredMount()

const grouped = computed(() => props.series.length > 1)

const options = computed<ApexOptions>(() => {
  const base = scnBaseOptions(chrome.value)
  return {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    colors: [...props.colors],
    plotOptions: {
      bar: {
        columnWidth: grouped.value ? '72%' : '45%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
      },
    },
    stroke: { show: false },
    xaxis: { ...base.xaxis, categories: [...props.categories], crosshairs: { show: false } },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      custom: cardTooltip((i) => ({
        title: props.tooltipTitles?.[i] ?? props.categories[i] ?? '',
        rows: props.series.map((s, si) => ({
          color: props.colors[si] ?? SCN_CHART[si] ?? SCN_CHART[1],
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
    <div role="img" :aria-label="chartLabel" :style="{ minHeight: `${height}px` }">
      <VueApexCharts v-if="ready" type="bar" :height="height" :options="options" :series="series" />
    </div>
    <div v-if="grouped" class="scn-chart__legend" aria-hidden="true">
      <span v-for="(s, i) in series" :key="s.name" class="scn-chart__legend-item">
        <span class="scn-chart__legend-dot" :style="{ background: colors[i] ?? SCN_CHART[i] }" />
        {{ s.name }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.scn-chart {
  min-width: 0;
}

.scn-chart__legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 4px;
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
