import type { ApexOptions } from 'apexcharts'

import {
  mp_color_chart_light_series1,
  mp_color_chart_light_series2,
  mp_color_chart_light_series3,
  mp_color_chart_light_series4,
  mp_color_chart_light_series6,
  mp_color_chart_light_series7,
} from '@/design-tokens/generated/tokens'

/**
 * Maropost-aligned palette for chart series.
 * Single-hue Picton Blue, well-spaced steps: [600, 300, 500, 900, 400, 700]
 */
export const chartPalette: string[] = [
  mp_color_chart_light_series1,
  mp_color_chart_light_series2,
  mp_color_chart_light_series3,
  mp_color_chart_light_series4,
  mp_color_chart_light_series7,
  mp_color_chart_light_series6,
]

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
  'colors' | 'chart' | 'grid' | 'xaxis' | 'yaxis' | 'tooltip'
> {
  return {
    colors: chartPalette,
    chart: {
      toolbar: { show: false },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: {
      borderColor: chartGridColor,
      strokeDashArray: 0,
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
  }
}
