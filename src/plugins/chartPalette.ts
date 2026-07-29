import { computed, inject, ref, unref, type InjectionKey, type Ref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'

import {
  mp_color_chart_dark_aurora_axis1,
  mp_color_chart_dark_aurora_axis2,
  mp_color_chart_dark_aurora_axis3,
  mp_color_chart_dark_aurora_axis4,
  mp_color_chart_dark_aurora_axis5,
  mp_color_chart_dark_aurora_series1,
  mp_color_chart_dark_aurora_series2,
  mp_color_chart_dark_aurora_series3,
  mp_color_chart_dark_aurora_series4,
  mp_color_chart_dark_aurora_series5,
  mp_color_chart_dark_aurora_series6,
  mp_color_chart_dark_axis1,
  mp_color_chart_dark_axis2,
  mp_color_chart_dark_axis3,
  mp_color_chart_dark_axis4,
  mp_color_chart_dark_axis5,
  mp_color_chart_dark_axisLabel,
  mp_color_chart_dark_grid,
  mp_color_chart_dark_indigo_axis1,
  mp_color_chart_dark_indigo_axis2,
  mp_color_chart_dark_indigo_axis3,
  mp_color_chart_dark_indigo_axis4,
  mp_color_chart_dark_indigo_axis5,
  mp_color_chart_dark_indigo_series1,
  mp_color_chart_dark_indigo_series2,
  mp_color_chart_dark_indigo_series3,
  mp_color_chart_dark_indigo_series4,
  mp_color_chart_dark_indigo_series5,
  mp_color_chart_dark_indigo_series6,
  mp_color_chart_dark_legendLabel,
  mp_color_chart_dark_ocean_axis1,
  mp_color_chart_dark_ocean_axis2,
  mp_color_chart_dark_ocean_axis3,
  mp_color_chart_dark_ocean_axis4,
  mp_color_chart_dark_ocean_axis5,
  mp_color_chart_dark_ocean_series1,
  mp_color_chart_dark_ocean_series2,
  mp_color_chart_dark_ocean_series3,
  mp_color_chart_dark_ocean_series4,
  mp_color_chart_dark_ocean_series5,
  mp_color_chart_dark_ocean_series6,
  mp_color_chart_dark_series1,
  mp_color_chart_dark_series2,
  mp_color_chart_dark_series3,
  mp_color_chart_dark_series4,
  mp_color_chart_dark_series6,
  mp_color_chart_dark_series7,
  mp_color_chart_dark_tooltipBackground,
  mp_color_chart_dark_tooltipBorder,
  mp_color_chart_dark_tooltipText,
  mp_color_chart_light_aurora_axis1,
  mp_color_chart_light_aurora_axis2,
  mp_color_chart_light_aurora_axis3,
  mp_color_chart_light_aurora_axis4,
  mp_color_chart_light_aurora_axis5,
  mp_color_chart_light_aurora_series1,
  mp_color_chart_light_aurora_series2,
  mp_color_chart_light_aurora_series3,
  mp_color_chart_light_aurora_series4,
  mp_color_chart_light_aurora_series5,
  mp_color_chart_light_aurora_series6,
  mp_color_chart_light_axis1,
  mp_color_chart_light_axis2,
  mp_color_chart_light_axis3,
  mp_color_chart_light_axis4,
  mp_color_chart_light_axis5,
  mp_color_chart_light_axisLabel,
  mp_color_chart_light_grid,
  mp_color_chart_light_indigo_axis1,
  mp_color_chart_light_indigo_axis2,
  mp_color_chart_light_indigo_axis3,
  mp_color_chart_light_indigo_axis4,
  mp_color_chart_light_indigo_axis5,
  mp_color_chart_light_indigo_series1,
  mp_color_chart_light_indigo_series2,
  mp_color_chart_light_indigo_series3,
  mp_color_chart_light_indigo_series4,
  mp_color_chart_light_indigo_series5,
  mp_color_chart_light_indigo_series6,
  mp_color_chart_light_legendLabel,
  mp_color_chart_light_ocean_axis1,
  mp_color_chart_light_ocean_axis2,
  mp_color_chart_light_ocean_axis3,
  mp_color_chart_light_ocean_axis4,
  mp_color_chart_light_ocean_axis5,
  mp_color_chart_light_ocean_series1,
  mp_color_chart_light_ocean_series2,
  mp_color_chart_light_ocean_series3,
  mp_color_chart_light_ocean_series4,
  mp_color_chart_light_ocean_series5,
  mp_color_chart_light_ocean_series6,
  mp_color_chart_light_series1,
  mp_color_chart_light_series2,
  mp_color_chart_light_series3,
  mp_color_chart_light_series4,
  mp_color_chart_light_series6,
  mp_color_chart_light_series7,
  mp_color_chart_light_tooltipBackground,
  mp_color_chart_light_tooltipBorder,
  mp_color_chart_light_tooltipText,
} from '@/design-tokens/generated/tokens'

/** Selectable chart themes (switchable via the `?chart=` URL param, see App.vue). */
export type ChartPalette = 'blue' | 'indigo' | 'ocean' | 'aurora'

export type ChartMode = 'light' | 'dark'

export interface ChartChrome {
  axisLabel: string
  legendLabel: string
  grid: string
  tooltipTheme: 'light' | 'dark'
  tooltipBackground: string
  tooltipText: string
  tooltipBorder: string
}

export interface ChartTheme {
  label: string
  /** 6 legend/series colors, slot order = adjacency-validated */
  series: string[]
  /** Ordered gradient stops (deep -> bright) that gradient marks run through */
  axis: string[]
  /** Hyper-style gradient mark treatment on/off */
  gradientMarks: boolean
  chrome: ChartChrome
}

const LIGHT_CHROME: ChartChrome = {
  axisLabel: mp_color_chart_light_axisLabel,
  legendLabel: mp_color_chart_light_legendLabel,
  grid: mp_color_chart_light_grid,
  tooltipTheme: 'light',
  tooltipBackground: mp_color_chart_light_tooltipBackground,
  tooltipText: mp_color_chart_light_tooltipText,
  tooltipBorder: mp_color_chart_light_tooltipBorder,
}

const DARK_CHROME: ChartChrome = {
  axisLabel: mp_color_chart_dark_axisLabel,
  legendLabel: mp_color_chart_dark_legendLabel,
  grid: mp_color_chart_dark_grid,
  tooltipTheme: 'dark',
  tooltipBackground: mp_color_chart_dark_tooltipBackground,
  tooltipText: mp_color_chart_dark_tooltipText,
  tooltipBorder: mp_color_chart_dark_tooltipBorder,
}

/**
 * Mode-aware chart themes. Each palette carries light and dark series/axis arrays
 * sourced from generated tokens; chrome (labels, grid, tooltip) is mode-specific.
 */
export const CHART_THEMES: Record<ChartPalette, Record<ChartMode, ChartTheme>> = {
  blue: {
    light: {
      label: 'Blue (current)',
      series: [
        mp_color_chart_light_series1,
        mp_color_chart_light_series2,
        mp_color_chart_light_series3,
        mp_color_chart_light_series4,
        mp_color_chart_light_series7,
        mp_color_chart_light_series6,
      ],
      axis: [
        mp_color_chart_light_axis1,
        mp_color_chart_light_axis2,
        mp_color_chart_light_axis3,
        mp_color_chart_light_axis4,
        mp_color_chart_light_axis5,
      ],
      gradientMarks: false,
      chrome: LIGHT_CHROME,
    },
    dark: {
      label: 'Blue (current)',
      series: [
        mp_color_chart_dark_series1,
        mp_color_chart_dark_series2,
        mp_color_chart_dark_series3,
        mp_color_chart_dark_series4,
        mp_color_chart_dark_series7,
        mp_color_chart_dark_series6,
      ],
      axis: [
        mp_color_chart_dark_axis1,
        mp_color_chart_dark_axis2,
        mp_color_chart_dark_axis3,
        mp_color_chart_dark_axis4,
        mp_color_chart_dark_axis5,
      ],
      gradientMarks: false,
      chrome: DARK_CHROME,
    },
  },
  indigo: {
    light: {
      label: 'Indigo Fade',
      series: [
        mp_color_chart_light_indigo_series1,
        mp_color_chart_light_indigo_series2,
        mp_color_chart_light_indigo_series3,
        mp_color_chart_light_indigo_series4,
        mp_color_chart_light_indigo_series5,
        mp_color_chart_light_indigo_series6,
      ],
      axis: [
        mp_color_chart_light_indigo_axis1,
        mp_color_chart_light_indigo_axis2,
        mp_color_chart_light_indigo_axis3,
        mp_color_chart_light_indigo_axis4,
        mp_color_chart_light_indigo_axis5,
      ],
      gradientMarks: true,
      chrome: LIGHT_CHROME,
    },
    dark: {
      label: 'Indigo Fade',
      series: [
        mp_color_chart_dark_indigo_series1,
        mp_color_chart_dark_indigo_series2,
        mp_color_chart_dark_indigo_series3,
        mp_color_chart_dark_indigo_series4,
        mp_color_chart_dark_indigo_series5,
        mp_color_chart_dark_indigo_series6,
      ],
      axis: [
        mp_color_chart_dark_indigo_axis1,
        mp_color_chart_dark_indigo_axis2,
        mp_color_chart_dark_indigo_axis3,
        mp_color_chart_dark_indigo_axis4,
        mp_color_chart_dark_indigo_axis5,
      ],
      gradientMarks: true,
      chrome: DARK_CHROME,
    },
  },
  ocean: {
    light: {
      label: 'Ocean',
      series: [
        mp_color_chart_light_ocean_series1,
        mp_color_chart_light_ocean_series2,
        mp_color_chart_light_ocean_series3,
        mp_color_chart_light_ocean_series4,
        mp_color_chart_light_ocean_series5,
        mp_color_chart_light_ocean_series6,
      ],
      axis: [
        mp_color_chart_light_ocean_axis1,
        mp_color_chart_light_ocean_axis2,
        mp_color_chart_light_ocean_axis3,
        mp_color_chart_light_ocean_axis4,
        mp_color_chart_light_ocean_axis5,
      ],
      gradientMarks: true,
      chrome: LIGHT_CHROME,
    },
    dark: {
      label: 'Ocean',
      series: [
        mp_color_chart_dark_ocean_series1,
        mp_color_chart_dark_ocean_series2,
        mp_color_chart_dark_ocean_series3,
        mp_color_chart_dark_ocean_series4,
        mp_color_chart_dark_ocean_series5,
        mp_color_chart_dark_ocean_series6,
      ],
      axis: [
        mp_color_chart_dark_ocean_axis1,
        mp_color_chart_dark_ocean_axis2,
        mp_color_chart_dark_ocean_axis3,
        mp_color_chart_dark_ocean_axis4,
        mp_color_chart_dark_ocean_axis5,
      ],
      gradientMarks: true,
      chrome: DARK_CHROME,
    },
  },
  aurora: {
    light: {
      label: 'Aurora',
      series: [
        mp_color_chart_light_aurora_series1,
        mp_color_chart_light_aurora_series2,
        mp_color_chart_light_aurora_series3,
        mp_color_chart_light_aurora_series4,
        mp_color_chart_light_aurora_series5,
        mp_color_chart_light_aurora_series6,
      ],
      axis: [
        mp_color_chart_light_aurora_axis1,
        mp_color_chart_light_aurora_axis2,
        mp_color_chart_light_aurora_axis3,
        mp_color_chart_light_aurora_axis4,
        mp_color_chart_light_aurora_axis5,
      ],
      gradientMarks: true,
      chrome: LIGHT_CHROME,
    },
    dark: {
      label: 'Aurora',
      series: [
        mp_color_chart_dark_aurora_series1,
        mp_color_chart_dark_aurora_series2,
        mp_color_chart_dark_aurora_series3,
        mp_color_chart_dark_aurora_series4,
        mp_color_chart_dark_aurora_series5,
        mp_color_chart_dark_aurora_series6,
      ],
      axis: [
        mp_color_chart_dark_aurora_axis1,
        mp_color_chart_dark_aurora_axis2,
        mp_color_chart_dark_aurora_axis3,
        mp_color_chart_dark_aurora_axis4,
        mp_color_chart_dark_aurora_axis5,
      ],
      gradientMarks: true,
      chrome: DARK_CHROME,
    },
  },
}

/** Back-compat: light series colourways keyed by palette. */
export const CHART_PALETTES: Record<ChartPalette, string[]> = Object.fromEntries(
  Object.entries(CHART_THEMES).map(([id, modes]) => [id, modes.light.series]),
) as Record<ChartPalette, string[]>

const chartPaletteId = ref<ChartPalette>('blue')

/**
 * Provide/inject key that lets a widget subtree pin an explicit theme instead of
 * the global palette. Used by the /chart-themes compare page.
 */
export const CHART_PALETTE_OVERRIDE: InjectionKey<Ref<ChartTheme> | ChartTheme> = Symbol('chartPaletteOverride')

/** Set the active chart palette (mirrors onto <html data-chart> for debug). */
export function applyChartPalette(id: ChartPalette) {
  chartPaletteId.value = id
  document.documentElement.dataset.chart = id
}

/**
 * Mode-aware chart theme composable. Call once in setup; returns reactive palette,
 * theme, and Apex base options that track Vuetify light/dark.
 */
export function useChartTheme() {
  const vuetifyTheme = useTheme()
  const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)

  const mode = computed<ChartMode>(() => (
    vuetifyTheme.global.current.value.dark ? 'dark' : 'light'
  ))

  const theme = computed<ChartTheme>(() => {
    const override = unref(themeOverride)
    if (override) return override
    return CHART_THEMES[chartPaletteId.value][mode.value]
  })

  const palette = computed<string[]>(() => theme.value.series)

  /** @deprecated Prefer `palette` from `useChartTheme()`. */
  const activeChartPalette = palette
  /** @deprecated Prefer `theme` from `useChartTheme()`. */
  const activeChartTheme = theme

  const applyChartTheme = computed(() => {
    const chrome = theme.value.chrome
    const labelStyle = {
      colors: chrome.axisLabel,
      fontSize: '12px',
      fontWeight: 500 as const,
    }

    return (): Pick<
      ApexOptions,
      'colors' | 'chart' | 'grid' | 'xaxis' | 'yaxis' | 'tooltip' | 'stroke' | 'dataLabels'
    > => ({
      colors: palette.value,
      chart: {
        toolbar: { show: false },
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        show: false,
        borderColor: chrome.grid,
        padding: { top: 8, right: 12, bottom: 4, left: 12 },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: 6,
        labels: { style: labelStyle, hideOverlappingLabels: true, rotate: 0 },
      },
      yaxis: {
        labels: { style: labelStyle },
      },
      tooltip: {
        theme: chrome.tooltipTheme,
      },
      stroke: {
        width: 2,
      },
      dataLabels: {
        enabled: false,
      },
    })
  })

  return {
    mode,
    theme,
    palette,
    applyChartTheme,
    activeChartPalette,
    activeChartTheme,
  }
}

/** Mix a hex colour toward white by fraction `t` (0..1) and return a hex string. */
export function tintHex(hex: string, t: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * t)
  const to2 = (c: number) => mix(c).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** Build legend config with explicit marker colours (Apex omits them without fillColors). */
export function chartLegendOptions(
  palette: string[],
  chrome: ChartChrome,
  position: 'top' | 'bottom' = 'top',
): ApexOptions['legend'] {
  return {
    show: true,
    position,
    horizontalAlign: position === 'top' ? 'right' : 'center',
    fontSize: '12px',
    fontWeight: 500,
    labels: { colors: chrome.legendLabel },
    markers: {
      size: 8,
      strokeWidth: 0,
      fillColors: palette,
    },
  }
}
