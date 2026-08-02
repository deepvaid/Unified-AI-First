<script setup lang="ts">
// Hero engagement chart — smooth lines with a gradient fade under the lead
// series, dot legend with live latest values, dashed crosshair and a card-style
// tooltip (references: "Average Enrollment Rate", "Campaign Performance").
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { cardTooltip, labBaseOptions } from '../chartLabApex'
import {
  ENGAGEMENT_RANGES,
  ENGAGEMENT_SERIES,
  type EngagementRange,
} from '../chartLabData'

const props = withDefaults(
  defineProps<{
    rangeKey: EngagementRange['key']
    height?: number
  }>(),
  { height: 300 },
)

const range = computed<EngagementRange>(
  () => ENGAGEMENT_RANGES.find((r) => r.key === props.rangeKey) ?? (ENGAGEMENT_RANGES[0] as EngagementRange),
)

const seriesData = computed(() => [range.value.opens, range.value.clicks, range.value.conversions])

const legend = computed(() =>
  ENGAGEMENT_SERIES.map((s, i) => ({
    ...s,
    latest: (seriesData.value[i]?.[seriesData.value[i]!.length - 1] ?? 0).toLocaleString('en-US'),
  })),
)

const series = computed(() =>
  ENGAGEMENT_SERIES.map((s, i) => ({
    name: s.name,
    type: i === 0 ? 'area' : 'line',
    data: seriesData.value[i] ?? [],
  })),
)

const options = computed<ApexOptions>(() => {
  const base = labBaseOptions()
  const last = range.value.categories.length - 1
  return {
    ...base,
    chart: { ...base.chart, type: 'line' },
    colors: ENGAGEMENT_SERIES.map((s) => s.color),
    stroke: { curve: 'smooth', width: [3, 2.5, 2.5] },
    fill: {
      type: ['gradient', 'solid', 'solid'],
      gradient: { type: 'vertical', shadeIntensity: 0, opacityFrom: 0.24, opacityTo: 0.02, stops: [0, 96, 100] },
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      hover: { size: 5 },
      discrete: ENGAGEMENT_SERIES.map((s, i) => ({
        seriesIndex: i,
        dataPointIndex: last,
        size: 5,
        fillColor: s.color,
        strokeColor: '#FFFFFF',
      })),
    },
    xaxis: { ...base.xaxis, categories: [...range.value.categories] },
    yaxis: {
      ...base.yaxis,
      min: 0,
      labels: {
        style: { colors: (base.yaxis as { labels?: { style?: { colors?: string } } })?.labels?.style?.colors, fontSize: '11px' },
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${Math.round(v)}`),
      },
    },
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      custom: cardTooltip((i) => ({
        title: range.value.categories[i] ?? '',
        rows: ENGAGEMENT_SERIES.map((s, si) => ({
          color: s.color,
          label: s.name,
          value: (seriesData.value[si]?.[i] ?? 0).toLocaleString('en-US'),
        })),
      })),
    },
  }
})
</script>

<template>
  <div class="elc">
    <div class="elc__legend" aria-hidden="true">
      <span v-for="l in legend" :key="l.key" class="elc__legend-item">
        <span class="elc__dot" :style="{ background: l.color }" />
        {{ l.name }}: <strong>{{ l.latest }}</strong>
      </span>
    </div>
    <div
      class="elc__chart"
      role="img"
      :aria-label="`Email engagement, ${range.label.toLowerCase()} view: opens, clicks and conversions per ${range.key === 'weekly' ? 'day' : 'week'}, latest ${legend.map((l) => `${l.name} ${l.latest}`).join(', ')}.`"
    >
      <VueApexCharts :key="range.key" type="line" :height="height" :options="options" :series="series" />
    </div>
  </div>
</template>

<style scoped>
.elc {
  min-width: 0;
}

.elc__legend {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 18px;
  margin: -6px 4px 4px 0;
}

.elc__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.elc__legend-item strong {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.elc__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.elc__chart {
  min-width: 0;
}
</style>
