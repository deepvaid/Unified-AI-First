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
export type ChartPalette = 'blue' | 'seaglass' | 'harbor' | 'electric' | 'spectrum'

/**
 * Blue (default): Maropost-aligned single-hue Picton Blue, steps [600,300,500,900,400,700].
 * SCOP-312 review set (each 6 colors, slot order is the CVD-safety mechanism —
 * all validated on light surfaces: lightness band, chroma floor, colorblind
 * adjacent-pair separation, normal-vision separation):
 * Seaglass: soft turquoise/sea-blue family (brand heritage).
 * Harbor: blue/teal base with soft warm accents for series contrast.
 * Electric: bold electric-blue-led vibrant set (#162ADE anchor).
 * Spectrum: muted full-spectrum for maximum series distinction.
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
  seaglass: ['#0A6E9E', '#34C2CB', '#0E8F6E', '#3AA6D4', '#2F5DA8', '#3FB98C'],
  harbor: ['#1E6FD0', '#E07B39', '#12A594', '#6A5AD0', '#CF5A84', '#3AA0D4'],
  electric: ['#162ADE', '#1AA35F', '#7A3FF2', '#E24A78', '#0098A8', '#D98523'],
  spectrum: ['#3E6FD6', '#C6952F', '#1BA38F', '#E07B39', '#7E6BD6', '#D96E92'],
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
