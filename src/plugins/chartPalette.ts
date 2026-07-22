import { computed, ref, type InjectionKey, type Ref } from 'vue'
import type { ApexOptions } from 'apexcharts'

import {
  mp_color_chart_light_series1,
  mp_color_chart_light_series2,
  mp_color_chart_light_series3,
  mp_color_chart_light_series4,
  mp_color_chart_light_series6,
  mp_color_chart_light_series7,
} from '@/design-tokens/generated/tokens'

/** Selectable chart themes (switchable via the `?chart=` URL param, see App.vue). */
export type ChartPalette = 'blue' | 'indigo' | 'ocean' | 'aurora'

export interface ChartTheme {
  label: string
  /** 6 legend/series colors, slot order = adjacency-validated */
  series: string[]
  /** Ordered gradient stops (deep -> bright) that gradient marks run through */
  axis: string[]
  /** Hyper-style gradient mark treatment on/off */
  gradientMarks: boolean
}

/**
 * SCOP-312 round 3 — the "soft gradient" set, styled after the Hyper Charts UI kit
 * (Setproduct). CEO feedback on the earlier flat palettes: they "look like random
 * colours vs unified against a single colour; too flat vs a soft gradient style."
 * Each gradient theme is unified on ONE gradient axis (`axis`, deep -> bright); marks
 * carry soft gradients along that axis, with rounded bar caps, floating value labels
 * and a soft glow on lines/donuts. `series` is the legend/series colourway (slot order
 * adjacency-validated). All hexes below are validated — do not alter them.
 *
 * - blue    — today's single-hue Picton Blue baseline; flat marks (gradientMarks off).
 * - indigo  — one indigo axis, deep to sky; the closest read of the Hyper reference.
 * - ocean   — Maropost blue flowing into turquoise (brand sea-blue heritage), one axis.
 * - aurora  — blue drifting into violet; bolder, still one unified axis.
 */
export const CHART_THEMES: Record<ChartPalette, ChartTheme> = {
  blue: {
    label: 'Blue (current)',
    series: [
      mp_color_chart_light_series1,
      mp_color_chart_light_series2,
      mp_color_chart_light_series3,
      mp_color_chart_light_series4,
      mp_color_chart_light_series7,
      mp_color_chart_light_series6,
    ],
    axis: ['#064F74', '#0073AB', '#0092D4', '#2CC4FF', '#75D6FF'],
    gradientMarks: false,
  },
  indigo: {
    label: 'Indigo Fade',
    series: ['#3D4EDC', '#7CC7F8', '#4E7CF0', '#2E3DB4', '#5FA9F5', '#4A63E4'],
    axis: ['#2E3DB4', '#3D4EDC', '#4E7CF0', '#5FA9F5', '#7CC7F8'],
    gradientMarks: true,
  },
  ocean: {
    label: 'Ocean',
    series: ['#0077C8', '#2BC5B4', '#0092D4', '#0A4FA8', '#00ACC8', '#1361B8'],
    axis: ['#0A4FA8', '#0077C8', '#0092D4', '#00ACC8', '#2BC5B4'],
    gradientMarks: true,
  },
  aurora: {
    label: 'Aurora',
    series: ['#4A55E8', '#B87CEE', '#6E5FF0', '#2440C9', '#9A6CF2', '#5D3FD3'],
    axis: ['#2440C9', '#4A55E8', '#6E5FF0', '#9A6CF2', '#B87CEE'],
    gradientMarks: true,
  },
}

/** Back-compat: the series colourways keyed by theme. Derived from CHART_THEMES. */
export const CHART_PALETTES: Record<ChartPalette, string[]> = Object.fromEntries(
  Object.entries(CHART_THEMES).map(([id, theme]) => [id, theme.series]),
) as Record<ChartPalette, string[]>

const chartPaletteId = ref<ChartPalette>('blue')

/** Reactive active palette — chart widgets read `activeChartPalette.value` inside their computeds. */
export const activeChartPalette = computed<string[]>(() => CHART_THEMES[chartPaletteId.value].series)

/** Reactive active theme — the full ChartTheme (series + gradient axis + gradientMarks flag). */
export const activeChartTheme = computed<ChartTheme>(() => CHART_THEMES[chartPaletteId.value])

/**
 * Provide/inject key that lets a widget subtree pin an explicit theme instead of
 * the global `activeChartTheme`. Used by the /chart-themes compare page so the real
 * widget panels can each render a different theme on one screen. When absent,
 * widgets follow the global theme as before.
 */
export const CHART_PALETTE_OVERRIDE: InjectionKey<Ref<ChartTheme> | ChartTheme> = Symbol('chartPaletteOverride')

/** Set the active chart palette (and mirror it onto <html data-chart> for parity/debuggability). */
export function applyChartPalette(id: ChartPalette) {
  chartPaletteId.value = id
  document.documentElement.dataset.chart = id
}

/** Back-compat: the default blue palette as a plain array. Prefer `activeChartPalette` for reactivity. */
export const chartPalette: string[] = CHART_THEMES.blue.series

/**
 * Mix a hex colour toward white by fraction `t` (0..1) and return a hex string.
 * Used to derive the bright end of a per-series bar gradient (gradientToColors).
 */
export function tintHex(hex: string, t: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  const to2 = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

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
  'colors' | 'chart' | 'grid' | 'xaxis' | 'yaxis' | 'tooltip' | 'stroke' | 'dataLabels' | 'legend'
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
      tickAmount: 4,
      labels: {
        style: {
          colors: chartLabelColor,
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    legend: {
      fontSize: '12px',
      fontWeight: 500,
      markers: { size: 5, shape: 'circle', offsetX: -2 },
      itemMargin: { horizontal: 10 },
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
