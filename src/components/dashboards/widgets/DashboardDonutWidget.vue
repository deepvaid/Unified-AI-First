<script setup lang="ts">
// Donut widget: one rounded-donut engine (ApexCharts) for both variants —
// `ring` keeps its legend below, `pie` keeps its legend beside. Segment values,
// per-segment deltas and the footer stat row are unchanged; only the mark
// engine moved off the hand-rolled SVG so every donut on the dashboards reads
// the same (rounded ends, surface-coloured gaps, centre readout).
import { computed, defineAsyncComponent, inject, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { useTheme } from 'vuetify'
import { mp_color_chart_light_series1 } from '@/design-tokens/generated/tokens'
import type { ApexOptions } from 'apexcharts'
import DtLegendList, { type DtLegendRow } from '../dotted/DtLegendList.vue'
import { CHART_PALETTE_OVERRIDE, embossDonutStops, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardDonutData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardDonutData
}>()

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

// Defer mounting until layout settles (same idiom as DashboardChartWidget) —
// vue3-apexcharts' options watcher crashes on a null chart if reactive options
// churn during the initial measure pass.
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

const { theme, applyChartTheme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
const treatment = computed(() => resolvedTheme.value.treatment)
const palette = computed<string[]>(() => resolvedTheme.value.series)
const vuetifyTheme = useTheme()
const strokeColor = computed(() => vuetifyTheme.global.current.value.colors.surface)

const series = computed(() => props.data.segments.map((segment) => segment.value))
const labels = computed(() => props.data.segments.map((segment) => segment.label))

// Fixed ring size (the hand-rolled SVG it replaces was a fixed-size viewBox):
// the legend and footer own the rest of the card, so the chart must not grow
// into their space. The pie variant shares its row with the legend beside it.
const chartHeight = computed(() => (props.data.variant === 'pie' ? 176 : 200))

const legendRows = computed<DtLegendRow[]>(() =>
  props.data.segments.map((segment, index) => ({
    label: segment.label,
    value: segment.formattedValue,
    color: palette.value[index % palette.value.length] ?? mp_color_chart_light_series1,
    delta: segment.delta,
    deltaPositive: segment.deltaPositive,
  })),
)

const chartAriaLabel = computed(() => {
  const parts = props.data.segments.map((segment) => `${segment.label} ${segment.formattedValue}`)
  return `Donut chart, ${parts.join(', ')}.`
})

// Card-style tooltip matching the chart widget's .mp-chart-tip skin. The
// segment carries its own formatted value, so the tooltip reuses it verbatim.
function donutTooltip({ seriesIndex }: { seriesIndex: number }): string {
  const segment = props.data.segments[seriesIndex]
  if (!segment) return ''
  const color = palette.value[seriesIndex % palette.value.length]
  return `<div class="mp-chart-tip"><div class="mp-chart-tip__row"><span class="mp-chart-tip__dot" style="background:${color}"></span><span class="mp-chart-tip__label">${segment.label}</span><span class="mp-chart-tip__value">${segment.formattedValue}</span></div></div>`
}

const options = computed<ApexOptions>(() => {
  const chrome = resolvedTheme.value.chrome
  const base = applyChartTheme.value()
  const t = treatment.value

  return {
    ...base,
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      toolbar: { show: false },
    },
    labels: labels.value,
    colors: palette.value,
    // Treatments may emboss each slice: explicit stops pinned to the visible
    // band (embossDonutStops), since Apex's radial gradient spans the full
    // circle radius and the hole would swallow a shade-based ramp. Every
    // shipped treatment declares 'solid'.
    fill: t?.donut.fill === 'gradient'
      ? {
          type: 'gradient',
          gradient: {
            colorStops: palette.value
              .slice(0, series.value.length)
              .map((c) => embossDonutStops(c, parseFloat(t.donut.size) || 68)),
          },
        }
      : { type: 'solid' },
    // The legend lives outside the chart (DtLegendList) — it carries the
    // per-segment deltas Apex's own legend can't show.
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: t ? t.donut.strokeWidth : 0, colors: [strokeColor.value] },
    plotOptions: {
      pie: {
        // Native rounded-donut geometry (Apex 6): pill slice ends + true gaps.
        borderRadius: 8,
        spacing: 4,
        donut: {
          size: t ? t.donut.size : '68%',
          labels: {
            show: true,
            name: {
              fontSize: '11px',
              fontWeight: 500,
              color: chrome.axisLabel,
              offsetY: -8,
            },
            value: {
              fontSize: '20px',
              fontWeight: 650,
              color: chrome.tooltipText,
              offsetY: 6,
              formatter: (value: string | number) => {
                const index = series.value.indexOf(Number(value))
                return props.data.segments[index]?.formattedValue ?? String(value)
              },
            },
            // The metric already computed the headline figure — show it
            // verbatim rather than re-summing slices.
            total: {
              show: !!props.data.centerValue,
              showAlways: false,
              label: props.data.centerCaption ?? 'Total',
              fontSize: '11px',
              fontWeight: 500,
              color: chrome.axisLabel,
              formatter: () => props.data.centerValue ?? '',
            },
          },
        },
        expandOnClick: false,
      },
    },
    tooltip: {
      ...base.tooltip,
      fillSeriesColor: false,
      custom: donutTooltip,
    },
  }
})
</script>

<template>
  <div class="donut-widget">
    <div v-if="data.variant === 'pie'" class="donut-widget__pie-block">
      <div class="donut-widget__pie-chart" role="img" :aria-label="chartAriaLabel">
        <ApexChart
          v-if="chartReady"
          :height="chartHeight"
          width="100%"
          type="donut"
          :options="options"
          :series="series"
        />
      </div>
      <DtLegendList :rows="legendRows" :gap="10" class="donut-widget__pie-legend" />
    </div>
    <template v-else>
      <div class="donut-widget__ring-block" role="img" :aria-label="chartAriaLabel">
        <ApexChart
          v-if="chartReady"
          :height="chartHeight"
          width="100%"
          type="donut"
          :options="options"
          :series="series"
        />
      </div>
      <DtLegendList :rows="legendRows" />
    </template>
    <div v-if="data.footerStats?.length" class="donut-widget__footer">
      <div v-for="stat in data.footerStats" :key="stat.label" class="donut-widget__stat">
        <span class="donut-widget__stat-label">{{ stat.label }}</span>
        <span class="donut-widget__stat-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-widget {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* The chart floats centered in the card's spare height instead of hugging the
   header and leaving a dead slab above the pinned footer. */
.donut-widget__ring-block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
}

.donut-widget__pie-block {
  display: flex;
  align-items: center;
  gap: var(--mp-space-20);
  flex: 1 1 auto;
  min-height: 0;
}

.donut-widget__pie-chart {
  flex: 1 1 55%;
  min-width: 0;
}

/* Below tablet the side-by-side legend gets too cramped — stack it under the pie. */
@media (max-width: 768px) {
  .donut-widget__pie-block {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mp-space-12);
  }
}

.donut-widget__pie-legend {
  flex: 1;
  min-width: 0;
}

.donut-widget__footer {
  margin-top: auto;
  padding-top: var(--mp-space-14);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: var(--mp-space-24);
}

.donut-widget__stat {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  min-width: 0;
}

.donut-widget__stat-label {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  white-space: nowrap;
}

.donut-widget__stat-value {
  font-size: 17px;
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

/* Card-style tooltip skin (same .mp-chart-tip markup as the chart widget). */
.donut-widget :deep(.apexcharts-tooltip) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.donut-widget :deep(.mp-chart-tip) {
  background: var(--mp-tip-bg, var(--surface-primary));
  border: 1px solid var(--mp-tip-border, var(--border-subtle));
  border-radius: var(--mp-tip-radius, 8px);
  box-shadow: var(--mp-tip-shadow, var(--elevation-modal));
  padding: var(--mp-space-8) var(--mp-space-10);
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
}

.donut-widget :deep(.mp-chart-tip__row) {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  padding: var(--mp-space-2) 0;
}

.donut-widget :deep(.mp-chart-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: var(--mp-radius-4);
  flex-shrink: 0;
}

.donut-widget :deep(.mp-chart-tip__label) {
  color: var(--mp-tip-muted, var(--muted));
}

.donut-widget :deep(.mp-chart-tip__value) {
  margin-left: auto;
  padding-left: var(--mp-space-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--mp-tip-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}
</style>
