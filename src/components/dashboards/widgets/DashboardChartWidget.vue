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
import { useElementSize } from '@/composables/useElementSize'

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

function formatTooltipValue(value: number, unit: DashboardSeriesData['unit']): string {
  if (unit === 'currency') return `$${Math.round(value).toLocaleString('en-US')}`
  if (unit === 'percent') return `${value.toFixed(1)}%`
  return Math.round(value).toLocaleString('en-US')
}

const chartHeight = computed(() => {
  if (!props.height || props.height < 60) return 220
  return Math.max(120, props.height - 4)
})

// Measure `.dashboard-chart-widget` itself (the overflow: hidden clipping
// box) rather than trusting `props.height`, which is the parent card body's
// size and includes padding this element doesn't have.
const rootEl = ref<HTMLElement | null>(null)
const { size: rootSize } = useElementSize(rootEl)

// The Apex tooltip normally follows the cursor, which is the right default —
// it never covers the axis/legend chrome. It only needs to be pinned when the
// tooltip itself is taller than the clipping box above: follow-cursor can
// then flip the tooltip above the hover point and past the container's top
// edge. A rough tooltip-height estimate (title row + one row per series,
// calibrated against a real 6-series tooltip measuring 235px) tells us when
// that's actually at risk, instead of pinning unconditionally in every
// widget/theme regardless of size — which just traded occasional clipping
// for the tooltip permanently covering the y-axis and legend.
const estimatedTooltipHeight = computed(() => 40 + props.data.series.length * 32)
const tooltipNeedsPinning = computed(
  () => rootSize.value.height > 0 && rootSize.value.height < estimatedTooltipHeight.value,
)

const { accentHex } = useAppTheme()
const { theme, applyChartTheme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
// Exploration options describe every visual decision through `treatment`; legacy
// themes leave it undefined and keep the gradientMarks/flatMarks branches below.
const treatment = computed(() => resolvedTheme.value.treatment)
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

const chartAriaLabel = computed(() => {
  const { labels, series, unit } = props.data
  const kind = props.widgetType === 'bar'
    ? 'Bar chart'
    : props.chartVariant === 'line' ? 'Line chart' : 'Area chart'
  if (!series.length || !labels.length) return kind
  if (series.length === 1) {
    const values = series[0]!.data
    const first = values[0] ?? 0
    const last = values[values.length - 1] ?? 0
    if (props.widgetType === 'bar') {
      return `${kind} of ${series[0]!.name} across ${labels.length} categories, ${labels[0]} to ${labels[labels.length - 1]}.`
    }
    return `${kind} of ${series[0]!.name}, ${labels[0]} to ${labels[labels.length - 1]}, from ${formatTooltipValue(first, unit)} to ${formatTooltipValue(last, unit)}.`
  }
  return `${kind} comparing ${series.map((s) => s.name).join(', ')} across ${labels.length} points.`
})

const isHorizontalBar = computed(
  () => props.widgetType === 'bar' && props.chartVariant === 'horizontal',
)

const apexChartType = computed<'area' | 'line' | 'bar'>(() => {
  if (props.widgetType === 'bar') return 'bar'
  if (props.chartVariant === 'line') return 'line'
  return 'area'
})

const chartSeries = computed(() => props.data.series)

const flatMarks = computed(() => !!resolvedTheme.value.flatMarks)

const seriesColors = computed(() => {
  const activePalette = resolvedTheme.value.series
  // Flat (Shopify) and treatment-driven themes keep their own lead colour — no accent swap.
  return (themeOverride || gradientMarks.value || flatMarks.value || !!treatment.value)
    ? activePalette
    : [accentHex.value, ...activePalette.slice(1)]
})

/** Diverging data (specimen only on the real dashboard) drives the pos/neg vocabulary. */
const hasNegativeValues = computed(
  () => props.data.series.some((series) => series.data.some((value) => value < 0)),
)

const hasComparisonSeries = computed(() => props.data.series.some((series) => series.isComparison))

// Per-series colours once comparison series enter the picture: comparison
// series take the theme's dedicated stroke, the rest consume palette slots in
// order. Without comparison series this is the plain palette (distributed
// bars rely on the full array to colour per data point).
const resolvedSeriesColors = computed(() => {
  const t = treatment.value
  // Diverging bars swap the categorical palette for the pos/neg vocabulary: the
  // series reads positive, and plotOptions.bar.colors.ranges paints values < 0.
  if (t && props.widgetType === 'bar' && hasNegativeValues.value) {
    return props.data.series.map(() => t.posNeg.positive)
  }
  if (!hasComparisonSeries.value) return seriesColors.value
  const comparison = t?.comparison.color
    ?? resolvedTheme.value.comparisonColor
    ?? seriesColors.value[1]
    ?? seriesColors.value[0]!
  let slot = 0
  return props.data.series.map((series) => (
    series.isComparison ? comparison : seriesColors.value[slot++ % seriesColors.value.length]!
  ))
})

// Card-style rich tooltip (shadcn look): title + colored-dot rows, rendered
// via tooltip.custom and styled by the scoped .mp-chart-tip rules below.
function chartTooltip({ dataPointIndex }: { dataPointIndex: number }): string {
  const { labels, series, unit } = props.data
  const colors = resolvedSeriesColors.value
  const rows = series
    .map((s, si) => {
      const color = isDistributedBar.value
        ? colors[dataPointIndex % colors.length]
        : colors[si % colors.length]
      return `<div class="mp-chart-tip__row"><span class="mp-chart-tip__dot" style="background:${color}"></span><span class="mp-chart-tip__label">${s.name}</span><span class="mp-chart-tip__value">${formatTooltipValue(s.data[dataPointIndex] ?? 0, unit)}</span></div>`
    })
    .join('')
  return `<div class="mp-chart-tip"><div class="mp-chart-tip__title">${labels[dataPointIndex] ?? ''}</div>${rows}</div>`
}

const chartOptions = computed<ApexOptions>(() => {
  const base = applyChartTheme.value()
  const activePalette = resolvedTheme.value.series
  const chrome = resolvedTheme.value.chrome
  const gm = gradientMarks.value
  const t = treatment.value
  const isBar = props.widgetType === 'bar'
  const isTimeseries = props.widgetType === 'timeseries'
  const isVerticalBar = isBar && !isHorizontalBar.value
  const singleOrDistributedBar = isDistributedBar.value || props.data.series.length === 1
  const floatingBarLabels = (t ? t.bar.floatingLabels : gm) && isVerticalBar && props.data.labels.length <= 8
  const showLegend = props.data.series.length > 1
  const divergingBars = !!t && isBar && hasNegativeValues.value

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

  // Treatment-driven fills — same recipes as above, but every knob comes from the
  // option's treatment instead of the gradientMarks/flatMarks booleans.
  const treatmentFill = (tt: NonNullable<typeof t>): ApexOptions['fill'] => {
    if (isBar) {
      // Axis-ramp bars need a single ramp per column — grouped series fall back to
      // the tint recipe so each series keeps its own identity.
      if (tt.bar.fill === 'axis-gradient' && isVerticalBar && singleOrDistributedBar) {
        const stops = resolvedTheme.value.axis
          .slice()
          .reverse()
          .map((color, i, arr) => ({ offset: i * (100 / (arr.length - 1)), color, opacity: 1 }))
        return { type: 'gradient', gradient: { type: 'vertical', colorStops: stops } }
      }
      if (tt.bar.fill === 'solid' || divergingBars) return { type: 'solid' }
      return {
        type: 'gradient',
        gradient: {
          type: isHorizontalBar.value ? 'horizontal' : 'vertical',
          shadeIntensity: 0,
          opacityFrom: 1,
          opacityTo: 0.92,
          gradientToColors: resolvedSeriesColors.value.map((c) => tintHex(c, 0.45)),
        },
      }
    }
    if (apexChartType.value === 'area') {
      const from = props.data.series.map((series) => (
        series.isComparison ? tt.comparison.fillOpacity : tt.area.opacityFrom
      ))
      if (tt.area.fill === 'solid') return { type: 'solid', opacity: from }
      return {
        type: 'gradient',
        gradient: {
          type: 'vertical',
          shadeIntensity: 0,
          opacityFrom: from,
          opacityTo: props.data.series.map((series) => (
            series.isComparison ? tt.comparison.fillOpacity : tt.area.opacityTo
          )),
          stops: [0, 100],
        },
      }
    }
    // Single-series line strokes may run through the axis ramp (option D).
    if (tt.stroke.gradientLine && props.chartVariant === 'line' && props.data.series.length === 1) {
      const stops = resolvedTheme.value.axis.map((color, i, arr) => ({
        offset: i * (100 / (arr.length - 1)),
        color,
        opacity: 1,
      }))
      return { type: 'gradient', gradient: { type: 'horizontal', colorStops: stops } }
    }
    return { type: 'solid' }
  }

  return {
    ...base,
    colors: resolvedSeriesColors.value,
    chart: {
      ...base.chart,
      sparkline: { enabled: false },
      zoom: { enabled: false },
      redrawOnParentResize: false,
      ...(t
        // Treatment shadows are the option-D guardrail: 1px blur on the marks, no glow.
        ? (t.effects.dropShadow && isTimeseries
            ? { dropShadow: { enabled: true, top: 3, left: 0, blur: 1, opacity: 0.18, color: activePalette[0] } }
            : {})
        : gm && props.widgetType === 'timeseries'
          ? { dropShadow: { enabled: true, top: 6, left: 0, blur: 6, opacity: 0.16, color: activePalette[0] } }
          : {}),
    },
    ...(t
      ? {
          states: {
            hover: { filter: { type: t.states.hoverFilter, value: t.states.hoverFilterValue } },
            active: { filter: { type: 'none', value: 0 } },
          },
        }
      : {}),
    // shadcn chrome: solid horizontal-only grid lines, no vertical rules.
    grid: t
      ? {
          ...base.grid,
          show: t.grid.show,
          borderColor: t.grid.color ?? chrome.grid,
          strokeDashArray: t.grid.dashArray,
          xaxis: { lines: { show: t.grid.xLines } },
          yaxis: { lines: { show: t.grid.yLines } },
          ...(floatingBarLabels ? { padding: { ...base.grid?.padding, top: 24 } } : {}),
        }
      : {
          ...base.grid,
          show: true,
          strokeDashArray: 0,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } },
          ...(floatingBarLabels ? { padding: { ...base.grid?.padding, top: 24 } } : {}),
        },
    stroke: t
      ? {
          curve: t.stroke.curve,
          // Lead series carries the full weight; companions and the previous-period
          // comparison series step back to companionWidth.
          width: isTimeseries
            ? (props.data.series.length > 1
                ? props.data.series.map((series, i) => (
                    series.isComparison || i > 0 ? t.stroke.companionWidth : t.stroke.width
                  ))
                : t.stroke.width)
            : 0,
          dashArray: isTimeseries
            ? props.data.series.map((series, i) => (
                series.isComparison ? t.comparison.dash : i > 0 ? t.stroke.companionDash : 0
              ))
            : undefined,
        }
      : flatMarks.value
      ? {
          // Polaris strokes: every series 2px solid; only a true previous-period
          // comparison series is dashed (Shopify's standardized treatment).
          curve: 'smooth',
          width: props.widgetType === 'timeseries' ? 2 : 0,
          dashArray: props.widgetType === 'timeseries'
            ? props.data.series.map((series) => (series.isComparison ? 5 : 0))
            : undefined,
        }
      : {
          curve: 'smooth',
          // shadcn strokes: single-series area/line 2px; multi-series keeps the
          // solid-3px lead + dashed-2px companions.
          width: props.widgetType === 'timeseries'
            ? (props.data.series.length > 1 ? props.data.series.map((_, i) => (i === 0 ? 3 : 2)) : 2)
            : 0,
          dashArray: props.widgetType === 'timeseries' && props.data.series.length > 1
            ? props.data.series.map((_, i) => (i === 0 ? 0 : 6))
            : undefined,
        },
    plotOptions: {
      bar: {
        // Polaris bars use a small 3px end radius; shadcn 6; gradient themes 10.
        borderRadius: t ? t.bar.radius : gm ? 10 : flatMarks.value ? 3 : 6,
        borderRadiusApplication: 'end',
        columnWidth: t
          ? (props.data.series.length > 1 ? t.bar.columnWidthGrouped : t.bar.columnWidthSingle)
          : gm ? '52%' : (props.data.series.length > 1 ? '72%' : '45%'),
        distributed: isDistributedBar.value,
        horizontal: isHorizontalBar.value,
        ...(floatingBarLabels ? { dataLabels: { position: 'top' } } : {}),
        // Diverging bars: below-zero values take the option's negative colour.
        ...(divergingBars && t
          ? { colors: { ranges: [{ from: -1e12, to: 0, color: t.posNeg.negative }] } }
          : {}),
      },
    },
    fill: t
      ? treatmentFill(t)
      : gm
      ? gradientFill()
      : flatMarks.value
        ? {
            // Polaris marks are flat; only line charts keep a soft area fade,
            // and dashed comparison series get no fill at all.
            type: apexChartType.value === 'area' ? 'gradient' : 'solid',
            gradient: {
              type: 'vertical',
              shadeIntensity: 0,
              opacityFrom: props.data.series.map((series) => (series.isComparison ? 0 : 0.25)),
              opacityTo: props.data.series.map((series) => (series.isComparison ? 0 : 0.02)),
              stops: [0, 100],
            },
          }
        : isBar
          ? {
              // Blue-theme bars keep their series colours but fade toward a
              // lighter tint instead of a flat fill (same recipe as the
              // gradient themes' grouped bars above).
              type: 'gradient',
              gradient: {
                type: isHorizontalBar.value ? 'horizontal' : 'vertical',
                shadeIntensity: 0,
                opacityFrom: 1,
                opacityTo: 0.92,
                gradientToColors: seriesColors.value.map((c) => tintHex(c, 0.45)),
              },
            }
          : {
              type: apexChartType.value === 'area' ? 'gradient' : 'solid',
              gradient: {
                type: 'vertical',
                shadeIntensity: 0,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 100],
              },
            },
    ...(t
      ? (isTimeseries
          ? {
              markers: t.markers.lastPoint && props.data.series.length === 1
                ? {
                    size: 0,
                    discrete: [{
                      seriesIndex: 0,
                      dataPointIndex: (props.data.series[0]?.data as number[]).length - 1,
                      // The dot belongs to the series, not to the app accent.
                      fillColor: resolvedSeriesColors.value[0] ?? activePalette[0]!,
                      strokeColor: markerStrokeColor.value,
                      size: 5,
                    }],
                    hover: { size: t.markers.hoverSize },
                  }
                : { size: 0, strokeColors: markerStrokeColor.value, hover: { size: t.markers.hoverSize } },
            }
          : {})
      : props.widgetType === 'timeseries' && flatMarks.value
      // Polaris is hover-only: no persistent last-point dot.
      ? { markers: { size: 0, strokeColors: markerStrokeColor.value, hover: { size: 4 } } }
      : props.widgetType === 'timeseries' && props.data.series.length === 1
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
      ? {
          ...chartLegendOptions(resolvedSeriesColors.value, chrome, 'top'),
          // shadcn legend: small square markers. Dots use the same resolved
          // per-series colours as the marks (incl. the comparison stroke).
          markers: t
            ? {
                size: t.legend.markerSize,
                shape: t.legend.markerShape,
                strokeWidth: 0,
                fillColors: resolvedSeriesColors.value,
              }
            : { size: 8, shape: 'square', strokeWidth: 0, fillColors: resolvedSeriesColors.value },
          ...(t ? { onItemHover: { highlightDataSeries: t.legend.hoverHighlight } } : {}),
        }
      : { show: false },
    xaxis: {
      ...base.xaxis,
      categories: props.data.labels,
      labels: {
        ...base.xaxis?.labels,
        offsetY: 2,
      },
      crosshairs: isBar
        ? { show: false }
        : t
          ? {
              show: t.crosshair.show,
              width: 1,
              stroke: { color: t.crosshair.color ?? chrome.grid, width: 1, dashArray: t.crosshair.dash },
            }
          : { show: true, width: 1, stroke: { color: chrome.grid, width: 1, dashArray: 0 } },
    },
    // shadcn hides the y-axis scale (values live in the tooltip); the
    // multi-series line view and horizontal bars keep their labels. Polaris
    // (flat) themes show the scale on timeseries too, Shopify-style.
    yaxis: {
      labels: (props.chartVariant === 'line' || isHorizontalBar.value || (flatMarks.value && props.widgetType === 'timeseries') || (t?.axes.yLabelsOnTimeseries === true && isTimeseries))
        ? {
            formatter: (value: number) => formatAxisValue(value, props.data.unit),
            style: {
              colors: chrome.axisLabel,
              fontSize: '12px',
              fontWeight: 500,
            },
          }
        : { show: false },
    },
    tooltip: {
      ...base.tooltip,
      // Only pin the tooltip (see `tooltipNeedsPinning` above) when it's
      // genuinely too tall for the widget to show it follow-cursor without
      // clipping — same geometry issue in both themes, so no theme branch.
      // Pin to top-right rather than top-left: the y-axis scale sits at the
      // left of every widget, so anchoring right keeps it clear (bottomRight
      // was tried and rejected — Apex anchors bottom-pinned tooltips to the
      // plot's own height, not the widget's, which pushed a too-tall tooltip
      // past the *top* edge by more than the ~8px topLeft/topRight ever clip
      // at the bottom).
      fixed: tooltipNeedsPinning.value
        ? { enabled: true, position: 'topRight', offsetX: -4, offsetY: 0 }
        : { enabled: false },
      shared: true,
      intersect: false,
      custom: chartTooltip,
      y: {
        formatter: (value: number) => formatAxisValue(value, props.data.unit),
      },
    },
  }
})
</script>

<template>
  <div ref="rootEl" class="dashboard-chart-widget" role="img" :aria-label="chartAriaLabel">
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
  container-type: inline-size;
}

/* Legend items ("Revenue", "Paid Search", …) have no fixed width from Apex —
   below ~220px (e.g. Da Vinci panel open narrows the grid column to ~196px)
   there isn't room for every label, so cap each item and ellipsis it rather
   than letting Apex wrap/truncate mid-word ("Paid Sea…" becoming unreadable
   across multiple lines). */
@container (max-width: 220px) {
  .dashboard-chart-widget :deep(.apexcharts-legend-text) {
    display: inline-block;
    max-width: 68px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }
}

.dashboard-chart-widget__placeholder {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

/* Card-style tooltip skin over the .mp-chart-tip markup from tooltip.custom —
   the native Apex tooltip chrome is nulled out so only the card shows. */
.dashboard-chart-widget :deep(.apexcharts-tooltip) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.dashboard-chart-widget :deep(.mp-chart-tip) {
  background: var(--mp-tip-bg, var(--surface-primary));
  border: 1px solid var(--mp-tip-border, var(--border-subtle));
  border-radius: var(--mp-tip-radius, 8px);
  box-shadow: var(--mp-tip-shadow, var(--elevation-modal));
  padding: 8px 10px;
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
}

.dashboard-chart-widget :deep(.mp-chart-tip__title) {
  font-size: 12px;
  font-weight: 600;
  color: var(--mp-tip-title-color, var(--text-primary));
  margin-bottom: 4px;
}

.dashboard-chart-widget :deep(.mp-chart-tip__row) {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 0;
}

.dashboard-chart-widget :deep(.mp-chart-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dashboard-chart-widget :deep(.mp-chart-tip__label) {
  color: var(--mp-tip-muted, var(--muted));
}

.dashboard-chart-widget :deep(.mp-chart-tip__value) {
  margin-left: auto;
  padding-left: 12px;
  font-weight: 500;
  color: var(--mp-tip-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}
</style>
