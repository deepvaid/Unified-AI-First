<script setup lang="ts">
// shadcn "Pie Chart - Donut with Text" style: blue-ramp segments with
// card-colored gaps, big centered total, dot legend below.
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { SCN_CHART, scnBaseOptions, useDeferredMount, useScnChrome } from '../scnApex'

export interface ScnDonutItem {
  name: string
  value: number
}

const props = withDefaults(
  defineProps<{
    items: ScnDonutItem[]
    colors?: string[]
    height?: number
    centerValue?: string
    centerCaption?: string
    /** Show the big centered total (default). Off for e.g. Traffic mix. */
    showCenter?: boolean
    /** Percentage labels rendered on the slices themselves. */
    segmentLabels?: boolean
    size?: string
    chartLabel: string
    formatValue?: (v: number) => string
  }>(),
  {
    colors: () => [...SCN_CHART],
    height: 220,
    centerValue: '',
    centerCaption: '',
    showCenter: true,
    segmentLabels: false,
    size: '70%',
    formatValue: (v: number) => v.toLocaleString('en-US'),
  },
)

const chrome = useScnChrome()
const ready = useDeferredMount()

const series = computed(() => props.items.map((i) => i.value))

const options = computed<ApexOptions>(() => {
  const base = scnBaseOptions(chrome.value)
  const c = chrome.value
  return {
    ...base,
    chart: { ...base.chart, type: 'donut' },
    labels: props.items.map((i) => i.name),
    colors: [...props.colors],
    stroke: { colors: [c.cardBg], width: 2 },
    dataLabels: props.segmentLabels
      ? {
          enabled: true,
          formatter: (val: number) => `${val.toFixed(0)}%`,
          style: { fontSize: '11px', fontWeight: 600, colors: [c.axis] },
          dropShadow: { enabled: false },
        }
      : { enabled: false },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: props.size,
          labels: {
            show: props.showCenter,
            name: { show: true, fontSize: '12px', color: c.muted, offsetY: 22 },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 650,
              color: c.fg,
              offsetY: -14,
              formatter: () => props.centerValue,
            },
            total: {
              show: true,
              showAlways: true,
              label: props.centerCaption,
              color: c.muted,
              fontSize: '12px',
              formatter: () => props.centerValue,
            },
          },
        },
      },
    },
    tooltip: {
      ...base.tooltip,
      custom: ({ seriesIndex }: { seriesIndex: number }) => {
        const item = props.items[seriesIndex]
        if (!item) return ''
        const color = props.colors[seriesIndex] ?? SCN_CHART[seriesIndex % SCN_CHART.length]
        return `<div class="lab-tip"><div class="lab-tip__row"><span class="lab-tip__dot" style="background:${color}"></span><span class="lab-tip__label">${item.name}</span><span class="lab-tip__value">${props.formatValue(item.value)}</span></div></div>`
      },
    },
  }
})
</script>

<template>
  <div class="scn-chart">
    <div role="img" :aria-label="chartLabel" :style="{ minHeight: `${height}px` }">
      <VueApexCharts v-if="ready" type="donut" :height="height" :options="options" :series="series" />
    </div>
    <div class="scn-chart__legend" aria-hidden="true">
      <span v-for="(item, i) in items" :key="item.name" class="scn-chart__legend-item">
        <span class="scn-chart__legend-dot" :style="{ background: colors[i] ?? SCN_CHART[i % 5] }" />
        {{ item.name }}
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  margin-top: 12px;
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
