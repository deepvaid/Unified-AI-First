import { computed, ref } from 'vue'
import type { ApexOptions } from 'apexcharts'

import {
  mp_color_chart_light_series1,
  mp_color_chart_light_series2,
  mp_color_chart_light_series3,
  mp_color_chart_light_series4,
  mp_color_chart_light_series6,
  mp_color_chart_light_series7,
} from '@/design-tokens/generated/tokens'

/** Selectable chart-series palettes (switchable via the `?chart=` URL param, see App.vue). */
export type ChartPalette = 'blue' | 'cool' | 'multicolor'

/**
 * Blue (default): Maropost-aligned single-hue Picton Blue, steps [600,300,500,900,400,700].
 * Cool: blue→teal. Multicolor: mixed accent hues. Each has 6 well-spaced series colors.
 */
export const CHART_PALETTES: Record<ChartPalette, string[]> = {
  blue: [
    mp_color_chart_light_series1,
    mp_color_chart_light_series2,
    mp_color_chart_light_series3,
    mp_color_chart_light_series4,
    mp_color_chart_light_series7,
    mp_color_chart_light_series6,
  ],
  cool: ['#0073AB', '#0092D4', '#00ADF1', '#00B6DE', '#00C0B7', '#14B8A6'],
  multicolor: ['#8B7CF5', '#34D399', '#F87171', '#FBBF24', '#60A5FA', '#2DD4BF'],
}

const chartPaletteId = ref<ChartPalette>('blue')

/** Reactive active palette — chart widgets read `activeChartPalette.value` inside their computeds. */
export const activeChartPalette = computed<string[]>(() => CHART_PALETTES[chartPaletteId.value])

/** Set the active chart palette (and mirror it onto <html data-chart> for parity/debuggability). */
export function applyChartPalette(id: ChartPalette) {
  chartPaletteId.value = id
  document.documentElement.dataset.chart = id
}

/** Back-compat: the default blue palette as a plain array. Prefer `activeChartPalette` for reactivity. */
export const chartPalette: string[] = CHART_PALETTES.blue

/** Thin, unobtrusive grid lines that read on both light and dark surfaces. */
export const chartGridColor = 'rgba(var(--v-theme-on-surface), 0.06)'

/** Axis label/tick color — readable but secondary. */
export const chartLabelColor = 'rgba(var(--v-theme-on-surface), 0.55)'

/** ApexCharts tooltip theme token. */
export const chartTooltipTheme = 'light' as const

/**
 * Base ApexCharts options shared by every chart surface.
 * Spread into a component's computed options, then add chart-specific
 * properties (categories, formatters, sparkline, etc.) below the spread.
 *
 * @example
 * const chartOptions = computed<ApexOptions>(() => ({
 *   ...applyChartTheme(),
 *   xaxis: { ...applyChartTheme().xaxis, categories: myLabels },
 * }))
 */
export function applyChartTheme(): Pick<
  ApexOptions,
  'colors' | 'chart' | 'grid' | 'xaxis' | 'yaxis' | 'tooltip' | 'stroke' | 'dataLabels'
> {
  return {
    colors: activeChartPalette.value,
    chart: {
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: {
      show: false,
      padding: { top: 8, right: 12, bottom: 4, left: 12 },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: chartLabelColor,
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartLabelColor,
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    tooltip: {
      theme: chartTooltipTheme,
    },
    stroke: {
      width: 2,
    },
    dataLabels: {
      enabled: false,
    },
  }
}
