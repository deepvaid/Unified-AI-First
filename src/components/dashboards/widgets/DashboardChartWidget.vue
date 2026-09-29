<script setup lang="ts">
import { computed, defineAsyncComponent, inject, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import type ApexCharts from 'apexcharts'
import type { DashboardChartVariant, DashboardSeriesData, DashboardWidgetType } from '@/stores/dashboards/types'
import {
  CHART_PALETTE_OVERRIDE,
  chartLegendOptions,
  duotoneCompanion,
  embossStops,
  tintHex,
  useChartTheme,
  type ChartTheme,
} from '@/plugins/chartPalette'
import { useAppTheme } from '@/composables/useAppTheme'
import { useElementSize } from '@/composables/useElementSize'
import { escapeHtml } from '@/utils/escapeHtml'
import { formatCompactValue, formatFullValue } from '@/utils/formatNumber'

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

/**
 * Shopify admin headline over a timeseries ("$10,317.06 ↗ 31%"): the period
 * total (mean for percent units) against the same aggregate of the previous
 * period. Only the polaris skin renders it — every other option keeps the
 * chart flush with the card header.
 */
const headline = computed(() => {
  if (resolvedTheme.value.skin !== 'polaris' || props.widgetType !== 'timeseries') return null
  const { series, unit } = props.data
  const current = series.find((s) => !s.isComparison)
  if (!current) return null
  const aggregate = (values: Array<number | null | undefined>) => {
    const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    if (nums.length === 0) return 0
    const sum = nums.reduce((a, b) => a + b, 0)
    return unit === 'percent' ? sum / nums.length : sum
  }
  const value = aggregate(current.data)
  const previous = series.find((s) => s.isComparison)
  const previousValue = previous ? aggregate(previous.data) : null
  const delta = previousValue && previousValue > 0 ? (value - previousValue) / previousValue : null
  return {
    value: formatFullValue(value, unit),
    delta,
    deltaText: delta === null ? null : `${Math.round(Math.abs(delta) * 100)}%`,
  }
})
const headlineEl = ref<HTMLElement | null>(null)
const { size: headlineSize } = useElementSize(headlineEl)
const headlineColor = computed(() => {
  const posNeg = treatment.value?.posNeg
  if (!headline.value || headline.value.delta === null || !posNeg) return undefined
  return headline.value.delta >= 0 ? posNeg.positive : posNeg.negative
})

// A one-bucket range ("Yesterday") gives every series a single point, and a
// line through one point paints nothing. Show the point itself at hover size
// so the chart still reads; multi-point series keep their hover-only markers.
const restingMarkerSize = computed(() => (
  props.data.labels.length <= 1 ? (treatment.value?.markers.hoverSize ?? 5) : 0
))

const chartHeight = computed(() => {
  // Readability floors: the main timeseries never renders below 240px, other
  // charts never below 200px, regardless of how small the card body measures.
  const floor = props.widgetType === 'timeseries' ? 240 : 200
  if (!props.height || props.height < 60) return 240
  // The polaris headline sits inside the same clipping box, so it comes off the chart.
  const headlineHeight = headline.value ? (headlineSize.value.height || 28) + 8 : 0
  return Math.max(floor - headlineHeight, props.height - 4 - headlineHeight)
})

// Measure `.dashboard-chart-widget` itself (the overflow: hidden clipping
// box) rather than trusting `props.height`, which is the parent card body's
// size and includes padding this element doesn't have.
const rootEl = ref<HTMLElement | null>(null)
const { size: rootSize } = useElementSize(rootEl)

// `redrawOnParentResize` stays off (it thrashed the grid while a widget is being dragged), so a
// chart never learned that its card got narrower or wider — dock the Da Vinci drawer and the SVG kept
// its old width, clipped at the card edge. Once the width has SETTLED, ask Apex to re-measure: its
// own resize handler debounces, then skips the redraw when the box did not really change.
// (`updateOptions({})` cannot do this — Apex skips options equal to the last call.)
const apexRef = ref<{ chart: { windowResizeHandler?: () => void } | null } | null>(null)
let reflowTimer: ReturnType<typeof setTimeout> | undefined
watch(() => rootSize.value.width, (width, previous) => {
  if (!chartReady.value || !width || width === previous) return
  clearTimeout(reflowTimer)
  reflowTimer = setTimeout(() => {
    reflowTimer = undefined
    // A null chart means vue3-apexcharts is mid-rebuild; the new instance measures itself.
    apexRef.value?.chart?.windowResizeHandler?.()
  }, 200)
})
onBeforeUnmount(() => clearTimeout(reflowTimer))

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
/* P5.5: markers are stroked with the surface they sit on. Both branches used to
   differ only in that the light one was a hardcoded '#ffffff'; the live theme
   surface is the same value in light and the correct one in dark. */
const markerStrokeColor = computed(() => vuetifyTheme.global.current.value.colors.surface)

const isDistributedBar = computed(
  () => props.widgetType === 'bar' && props.data.series.length <= 1,
)

const chartAriaLabel = computed(() => {
  const { labels, series, unit } = props.data
  const kind = props.chartVariant === 'stacked-column'
    ? 'Stacked column chart'
    : props.chartVariant === 'stacked-area'
    ? 'Stacked area chart'
    : props.widgetType === 'bar'
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
    return `${kind} of ${series[0]!.name}, ${labels[0]} to ${labels[labels.length - 1]}, from ${formatFullValue(first, unit)} to ${formatFullValue(last, unit)}.`
  }
  return `${kind} comparing ${series.map((s) => s.name).join(', ')} across ${labels.length} points.`
})

const isHorizontalBar = computed(
  () => props.widgetType === 'bar' && props.chartVariant === 'horizontal',
)

// Stacked variants are the only ones that turn on Apex's `chart.stacked`; every
// other variant keeps the exact options it had before stacking existed.
const isStacked = computed(
  () => props.chartVariant === 'stacked-area' || props.chartVariant === 'stacked-column',
)

const apexChartType = computed<'area' | 'line' | 'bar'>(() => {
  if (props.chartVariant === 'stacked-column') return 'bar'
  if (props.chartVariant === 'stacked-area') return 'area'
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
      return `<div class="mp-chart-tip__row"><span class="mp-chart-tip__dot" style="background:${color}"></span><span class="mp-chart-tip__label">${escapeHtml(s.name)}</span><span class="mp-chart-tip__value">${formatFullValue(s.data[dataPointIndex] ?? 0, unit)}</span></div>`
    })
    .join('')
  return `<div class="mp-chart-tip"><div class="mp-chart-tip__title">${escapeHtml(labels[dataPointIndex])}</div>${rows}</div>`
}

/** Legend preview for the Polaris legend: a 12×2 line, or three dots for the comparison series. */
function legendMarkerHtml(color: string, isComparison: boolean): string {
  if (isComparison) {
    const dot = `<span style="display:inline-block;width:2px;height:2px;border-radius:50%;background:${color}"></span>`
    return `<span style="display:inline-flex;align-items:center;justify-content:space-between;width:12px;height:12px">${dot}${dot}${dot}</span>`
  }
  return `<span style="display:inline-flex;align-items:center;width:12px;height:12px"><span style="display:block;width:12px;height:2px;border-radius:1px;background:${color}"></span></span>`
}

/**
 * Apex only takes one dash number per series; Polaris's previous period is a
 * "0.1 4" dot pattern. After every draw, stamp that pattern onto the comparison
 * series' stroke paths (the fill path has no stroke and is left alone).
 */
function applyComparisonDashPattern(chart: ApexCharts): void {
  const pattern = treatment.value?.comparison.dashPattern
  // Apex hands its instance to events; the rendered root is only on the untyped surface.
  const ctx = chart as unknown as { el?: Element; w?: { globals?: { dom?: { baseEl?: Element } } } }
  const root = ctx?.el ?? ctx?.w?.globals?.dom?.baseEl
  if (!pattern || !root) return
  props.data.series.forEach((series, i) => {
    if (!series.isComparison) return
    root.querySelectorAll(`.apexcharts-series[rel="${i + 1}"] path[stroke]:not([stroke="none"])`).forEach((path) => {
      path.setAttribute('stroke-dasharray', pattern)
    })
  })
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
  // Stacked columns would get one floating label per segment — suppress them.
  const floatingBarLabels = (t ? t.bar.floatingLabels : gm) && isVerticalBar && props.data.labels.length <= 8 && !isStacked.value
  // Legends always on — even single-series charts show their color chip so the
  // active theme's colors and shades read on every widget.
  const showLegend = props.data.series.length >= 1
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
      // Diverging data wears the pos/neg vocabulary — solid fills so the
      // ranges colors read; this outranks any decorative bar fill.
      if (divergingBars) return { type: 'solid' }
      // Axis-ramp bars need a single ramp per column — grouped series fall back to
      // the tint recipe so each series keeps its own identity.
      if (tt.bar.fill === 'axis-gradient' && isVerticalBar && singleOrDistributedBar) {
        const ramp = resolvedTheme.value.axis
          .slice()
          .reverse()
          .map((color, i, arr) => ({ offset: i * (100 / (arr.length - 1)), color, opacity: 1 }))
        const stops = tt.effects.gloss ? embossStops(ramp) : ramp
        return { type: 'gradient', gradient: { type: 'vertical', colorStops: stops } }
      }
      if (tt.bar.fill === 'solid' || divergingBars) return { type: 'solid' }
      // Soft: the series colour at full strength at the head easing to ~72% at
      // the base — same hue both ends, so it reads as depth, not as a second
      // colour (the merchant "middle" between flat and gloss).
      if (tt.bar.fill === 'soft-gradient') {
        return {
          type: 'gradient',
          gradient: {
            type: isHorizontalBar.value ? 'horizontal' : 'vertical',
            shadeIntensity: 0,
            opacityFrom: 1,
            opacityTo: 0.72,
            gradientToColors: resolvedSeriesColors.value,
          },
        }
      }
      // Grouped/horizontal bars: a clean full-height sweep from the series'
      // luminous companion at the head into the base colour — both ends
      // bright, no gloss cap or dark lip (reference style: Stripe/Sea Blizz).
      if (tt.effects.gloss) {
        return {
          type: 'gradient',
          gradient: {
            type: isHorizontalBar.value ? 'horizontal' : 'vertical',
            colorStops: resolvedSeriesColors.value.map((c) => [
              { offset: 0, color: tintHex(duotoneCompanion(c), 0.25), opacity: 0.92 },
              { offset: 100, color: c, opacity: 0.96 },
            ]),
          },
        }
      }
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
      // Emboss: the wash sweeps from the series' vivid duotone companion at the
      // crest into the base colour at the floor, keeping the per-series opacity
      // ramp (comparison stays a faint wash).
      if (tt.effects.gloss) {
        return {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            colorStops: props.data.series.map((_, i) => {
              const c = resolvedSeriesColors.value[i % resolvedSeriesColors.value.length]!
              return [
                { offset: 0, color: tintHex(duotoneCompanion(c), 0.25), opacity: from[i] ?? tt.area.opacityFrom },
                { offset: 100, color: c, opacity: tt.area.opacityTo },
              ]
            }),
          },
        }
      }
      return {
        type: 'gradient',
        gradient: {
          type: 'vertical',
          shadeIntensity: 0,
          opacityFrom: from,
          // The previous period is a wash, not a slab: it fades to the same floor
          // as the current period so the two areas overlay without muddying.
          opacityTo: props.data.series.map(() => tt.area.opacityTo),
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
    // Emboss: line strokes sweep horizontally from the duotone companion into
    // the series colour (Apex paints line strokes from `fill`). Dashed
    // comparison series stay subdued via width/dash, not colour.
    if (tt.effects.gloss) {
      return {
        type: 'gradient',
        gradient: {
          type: 'horizontal',
          colorStops: resolvedSeriesColors.value.map((c) => [
            { offset: 0, color: tintHex(duotoneCompanion(c), 0.2), opacity: 1 },
            { offset: 100, color: c, opacity: 1 },
          ]),
        },
      }
    }
    return { type: 'solid' }
  }

  // Stacked marks read as bands/segments, not as translucent washes: the usual
  // fade-to-0.02 area fill erases the lower band entirely once something is
  // stacked on top of it. One recipe for every theme (legacy included, since
  // the baseline seeds the stacked widgets too), with each option's
  // solid-vs-gradient grammar surviving in the bottom stop only.
  const stackedFill = (): ApexOptions['fill'] => {
    // Stacked columns emboss per segment, so each band in the stack reads as its
    // own lit solid rather than one flat column of colour.
    if (apexChartType.value !== 'area') {
      if (!t?.effects.gloss) return { type: 'solid' }
      return {
        type: 'gradient',
        gradient: {
          type: 'vertical',
          colorStops: resolvedSeriesColors.value.map((c) => [
            { offset: 0, color: tintHex(duotoneCompanion(c), 0.2), opacity: 0.92 },
            { offset: 100, color: c, opacity: 0.96 },
          ]),
        },
      }
    }
    // Stacked areas: emboss sweeps each band from its duotone companion into
    // the base colour; other themes keep the plain opacity ramp.
    if (t?.effects.gloss) {
      return {
        type: 'gradient',
        gradient: {
          type: 'vertical',
          colorStops: resolvedSeriesColors.value.map((c) => [
            { offset: 0, color: tintHex(duotoneCompanion(c), 0.25), opacity: 0.95 },
            { offset: 100, color: c, opacity: t.area.fill === 'solid' ? 0.95 : 0.72 },
          ]),
        },
      }
    }
    return {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.95,
        opacityTo: t && t.area.fill === 'solid' ? 0.95 : 0.72,
        stops: [0, 100],
      },
    }
  }

  return {
    ...base,
    colors: resolvedSeriesColors.value,
    chart: {
      ...base.chart,
      sparkline: { enabled: false },
      zoom: { enabled: false },
      redrawOnParentResize: false,
      ...(isStacked.value ? { stacked: true } : {}),
      ...(t?.comparison.dashPattern && hasComparisonSeries.value
        ? { events: { ...base.chart?.events, mounted: applyComparisonDashPattern, updated: applyComparisonDashPattern, animationEnd: applyComparisonDashPattern } }
        : {}),
      ...(t
        ? (t.effects.dropShadow && isTimeseries
            ? {
                dropShadow: {
                  enabled: true,
                  top: 3,
                  left: 0,
                  blur: 1,
                  opacity: 0.18,
                  color: activePalette[0],
                },
              }
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
          lineCap: t.stroke.lineCap ?? 'butt',
          // Lead series carries the full weight; companions and the previous-period
          // comparison series step back to companionWidth. Stacked bands are
          // peers — every band keeps the full weight and stays solid, so the
          // bright edge line reads on top of each filled area.
          width: isTimeseries
            ? (isStacked.value
                ? t.stroke.width
                : props.data.series.length > 1
                ? props.data.series.map((series, i) => (
                    series.isComparison || i > 0 ? t.stroke.companionWidth : t.stroke.width
                  ))
                : t.stroke.width)
            // Embossed stacked columns take a thin surface-coloured separator
            // so each band reads on its own — same gap grammar as the donuts.
            : isStacked.value && t.effects.gloss
            ? 2
            : 0,
          ...(!isTimeseries && isStacked.value && t.effects.gloss
            ? { colors: [markerStrokeColor.value] }
            : {}),
          dashArray: isTimeseries && !isStacked.value
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
        // Without 'last' Apex rounds every segment of a stack; the reference
        // rounds the top of the column only.
        ...(isStacked.value ? { borderRadiusWhenStacked: 'last' as const } : {}),
        // A stack is one column, so it takes the single-series width — the
        // grouped width would leave almost no gap between buckets.
        columnWidth: isStacked.value
          ? (t ? t.bar.columnWidthSingle : '45%')
          : t
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
    fill: isStacked.value
      ? stackedFill()
      : t
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
                    size: restingMarkerSize.value,
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
                : { size: restingMarkerSize.value, strokeColors: markerStrokeColor.value, hover: { size: t.markers.hoverSize } },
            }
          : {})
      : props.widgetType === 'timeseries' && flatMarks.value
      // Polaris is hover-only: no persistent last-point dot.
      ? { markers: { size: restingMarkerSize.value, strokeColors: markerStrokeColor.value, hover: { size: 4 } } }
      : props.widgetType === 'timeseries' && props.data.series.length === 1
        ? {
            markers: {
              size: restingMarkerSize.value,
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
          formatter: (value: number) => formatCompactValue(value, props.data.unit),
        }
      : { enabled: false },
    legend: showLegend && t?.legend.show !== false
      ? {
          ...chartLegendOptions(resolvedSeriesColors.value, chrome, t?.legend.position ?? 'top', t?.legend.align, t?.legend.fontSize),
          // shadcn legend: small square markers. Dots use the same resolved
          // per-series colours as the marks (incl. the comparison stroke).
          markers: t
            ? {
                size: t.legend.markerSize,
                shape: t.legend.markerShape,
                strokeWidth: 0,
                fillColors: resolvedSeriesColors.value,
                // Polaris legend previews: a 12×2 line per series, three dots for
                // the previous period. Apex has no dotted marker, so we hand it the
                // HTML per series (fillColors still drives the colour vision dimming).
                ...(t.legend.comparisonMarker === 'dots'
                  ? {
                      // Apex accepts one function per series here; its typings only know the single-function form.
                      customHTML: props.data.series.map((series, i) => () => legendMarkerHtml(
                        resolvedSeriesColors.value[i % resolvedSeriesColors.value.length]!,
                        series.isComparison === true,
                      )) as unknown as () => string,
                    }
                  : {}),
              }
            : { size: 8, shape: 'square', strokeWidth: 0, fillColors: resolvedSeriesColors.value },
          ...(t ? { onItemHover: { highlightDataSeries: t.legend.hoverHighlight } } : {}),
        }
      : { show: false },
    xaxis: {
      ...base.xaxis,
      categories: props.data.labels,
      // Stripe keeps only the first and last category label ("3 Dec … Today").
      ...(t?.axes.xLabels === 'ends' ? { tickAmount: Math.max(1, props.data.labels.length - 1) } : {}),
      axisBorder: { show: t?.axes.baseline === true, color: chrome.grid, height: 1 },
      labels: {
        ...base.xaxis?.labels,
        offsetY: 2,
        ...(t?.axes.labelFontSize
          ? { style: { ...base.xaxis?.labels?.style, fontSize: `${t.axes.labelFontSize}px`, fontWeight: t.axes.labelFontWeight ?? 500 } }
          : {}),
        ...(t?.axes.xLabels === 'ends'
          ? {
              hideOverlappingLabels: false,
              formatter: (value: string) => {
                const labels = props.data.labels
                return value === labels[0] || value === labels[labels.length - 1] ? value : ''
              },
            }
          : {}),
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
    // Stacked charts always keep the scale — the cumulative total is the point,
    // and a stack read without a y-axis is just a texture.
    yaxis: {
      ...(t?.axes.yTickAmount != null ? { tickAmount: t.axes.yTickAmount } : {}),
      labels: (isStacked.value || props.chartVariant === 'line' || isHorizontalBar.value || (flatMarks.value && props.widgetType === 'timeseries') || (t?.axes.yLabelsOnTimeseries === true && isTimeseries))
        ? {
            formatter: (value: number) => {
              const text = formatCompactValue(value, props.data.unit)
              return t?.axes.compactUnitCase === 'upper' ? text.replace(/([kmb])$/, (m) => m.toUpperCase()) : text
            },
            style: {
              colors: chrome.axisLabel,
              fontSize: `${t?.axes.labelFontSize ?? 12}px`,
              fontWeight: t?.axes.labelFontWeight ?? 500,
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
        formatter: (value: number) => formatFullValue(value, props.data.unit),
      },
    },
  }
})
</script>

<template>
  <div ref="rootEl" class="dashboard-chart-widget" role="img" :aria-label="chartAriaLabel">
    <div v-if="headline" ref="headlineEl" class="dashboard-chart-widget__headline">
      <span class="dashboard-chart-widget__headline-value">{{ headline.value }}</span>
      <span v-if="headline.deltaText" class="dashboard-chart-widget__headline-delta" :style="{ color: headlineColor }">
        <v-icon size="12">{{ (headline.delta ?? 0) >= 0 ? 'arrow-up-right' : 'arrow-down-right' }}</v-icon>
        {{ headline.deltaText }}
      </span>
    </div>
    <ApexChart
      v-if="chartReady"
      ref="apexRef"
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
  padding-top: var(--mp-space-4);
  container-type: inline-size;
}

/* Polaris-skin headline; the --mp-skin-* vars are set by shopify-admin-skin.css
   and fall back to the design-system values everywhere else. */
.dashboard-chart-widget__headline {
  display: flex;
  align-items: baseline;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-8);
}

.dashboard-chart-widget__headline-value {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-skin-weight-semibold, var(--mp-fontWeight-semibold));
  line-height: 1.2;
  letter-spacing: 0;
  color: var(--mp-skin-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}

.dashboard-chart-widget__headline-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-skin-weight-medium, var(--mp-fontWeight-medium));
  color: var(--muted);
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
  padding: var(--mp-space-8) var(--mp-space-10);
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
}

.dashboard-chart-widget :deep(.mp-chart-tip__title) {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--mp-tip-title-color, var(--text-primary));
  margin-bottom: var(--mp-space-4);
}

.dashboard-chart-widget :deep(.mp-chart-tip__row) {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  padding: var(--mp-space-2) 0;
}

.dashboard-chart-widget :deep(.mp-chart-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: var(--mp-radius-4);
  flex-shrink: 0;
}

.dashboard-chart-widget :deep(.mp-chart-tip__label) {
  color: var(--mp-tip-muted, var(--muted));
}

.dashboard-chart-widget :deep(.mp-chart-tip__value) {
  margin-left: auto;
  padding-left: var(--mp-space-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--mp-tip-text, var(--text-primary));
  font-variant-numeric: tabular-nums;
}
</style>
