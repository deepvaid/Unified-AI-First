import { computed, inject, ref, unref, type InjectionKey, type Ref } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'

import {
  mp_color_chart_dark_axisLabel,
  mp_color_chart_dark_grid,
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
  mp_color_chart_dark_social_axis1,
  mp_color_chart_dark_social_axis2,
  mp_color_chart_dark_social_axis3,
  mp_color_chart_dark_social_axis4,
  mp_color_chart_dark_social_axis5,
  mp_color_chart_dark_social_series1,
  mp_color_chart_dark_social_series2,
  mp_color_chart_dark_social_series3,
  mp_color_chart_dark_social_series4,
  mp_color_chart_dark_social_series5,
  mp_color_chart_dark_social_series6,
  mp_color_chart_dark_tooltipBackground,
  mp_color_chart_dark_tooltipBorder,
  mp_color_chart_dark_tooltipText,
  mp_color_chart_light_axisLabel,
  mp_color_chart_light_grid,
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
  mp_color_chart_light_grayBlue_axis1,
  mp_color_chart_light_grayBlue_axis2,
  mp_color_chart_light_grayBlue_axis3,
  mp_color_chart_light_grayBlue_axis4,
  mp_color_chart_light_grayBlue_axis5,
  mp_color_chart_light_grayBlue_comparison,
  mp_color_chart_light_grayBlue_negative,
  mp_color_chart_light_grayBlue_neutral,
  mp_color_chart_light_grayBlue_positive,
  mp_color_chart_light_grayBlue_series1,
  mp_color_chart_light_grayBlue_series2,
  mp_color_chart_light_grayBlue_series3,
  mp_color_chart_light_grayBlue_series4,
  mp_color_chart_light_grayBlue_series5,
  mp_color_chart_light_grayBlue_series6,
  mp_color_chart_light_grayBlue_warning,
  mp_color_chart_dark_grayBlue_axis1,
  mp_color_chart_dark_grayBlue_axis2,
  mp_color_chart_dark_grayBlue_axis3,
  mp_color_chart_dark_grayBlue_axis4,
  mp_color_chart_dark_grayBlue_axis5,
  mp_color_chart_dark_grayBlue_comparison,
  mp_color_chart_dark_grayBlue_series1,
  mp_color_chart_dark_grayBlue_series2,
  mp_color_chart_dark_grayBlue_series3,
  mp_color_chart_dark_grayBlue_series4,
  mp_color_chart_dark_grayBlue_series5,
  mp_color_chart_dark_grayBlue_series6,
  mp_color_chart_light_grayBlueGold_axis1,
  mp_color_chart_light_grayBlueGold_axis2,
  mp_color_chart_light_grayBlueGold_axis3,
  mp_color_chart_light_grayBlueGold_axis4,
  mp_color_chart_light_grayBlueGold_axis5,
  mp_color_chart_light_grayBlueGold_series1,
  mp_color_chart_light_grayBlueGold_series2,
  mp_color_chart_light_grayBlueGold_series3,
  mp_color_chart_light_grayBlueGold_series4,
  mp_color_chart_light_grayBlueGold_series5,
  mp_color_chart_light_grayBlueGold_series6,
  mp_color_chart_dark_grayBlueGold_axis1,
  mp_color_chart_dark_grayBlueGold_axis2,
  mp_color_chart_dark_grayBlueGold_axis3,
  mp_color_chart_dark_grayBlueGold_axis4,
  mp_color_chart_dark_grayBlueGold_axis5,
  mp_color_chart_dark_grayBlueGold_series1,
  mp_color_chart_dark_grayBlueGold_series2,
  mp_color_chart_dark_grayBlueGold_series3,
  mp_color_chart_dark_grayBlueGold_series4,
  mp_color_chart_dark_grayBlueGold_series5,
  mp_color_chart_dark_grayBlueGold_series6,
  mp_color_chart_light_social_axis1,
  mp_color_chart_light_social_axis2,
  mp_color_chart_light_social_axis3,
  mp_color_chart_light_social_axis4,
  mp_color_chart_light_social_axis5,
  mp_color_chart_light_social_series1,
  mp_color_chart_light_social_series2,
  mp_color_chart_light_social_series3,
  mp_color_chart_light_social_series4,
  mp_color_chart_light_social_series5,
  mp_color_chart_light_social_series6,
  mp_color_chart_light_tooltipBackground,
  mp_color_chart_light_tooltipBorder,
  mp_color_chart_light_tooltipText,
} from '@/design-tokens/generated/tokens'

/** Selectable chart themes (switchable via the `?chart=` URL param, see App.vue). */
export type ChartPalette =
  | 'grayBlue'
  | 'grayBlueGold'
  | 'social'
  | 'ocean'

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

/**
 * Full visual-system description for a chart theme. The colour options declare
 * one; `ocean` leaves `ChartTheme.treatment` undefined and keeps its existing
 * `gradientMarks` branches verbatim.
 */
export interface ChartTreatment {
  stroke: {
    curve: 'smooth' | 'straight' | 'monotoneCubic'
    /** Lead/only series stroke width. */
    width: number
    /** Non-lead series in a multi-series chart. */
    companionWidth: number
    /** Dash for non-lead (non-comparison) series; 0 = solid. */
    companionDash: number
    /** Single-series line strokes run through the axis ramp. */
    gradientLine: boolean
  }
  comparison: { color?: string; dash: number; fillOpacity: number }
  area: { fill: 'gradient' | 'solid'; opacityFrom: number; opacityTo: number }
  bar: {
    radius: number
    columnWidthSingle: string
    columnWidthGrouped: string
    fill: 'solid' | 'tint-gradient' | 'axis-gradient'
    floatingLabels: boolean
  }
  grid: { show: boolean; dashArray: number; xLines: boolean; yLines: boolean; color?: string }
  axes: { yLabelsOnTimeseries: boolean }
  crosshair: { show: boolean; dash: number; color?: string }
  markers: { hoverSize: number; lastPoint: boolean }
  legend: { markerShape: 'square' | 'circle'; markerSize: number; hoverHighlight: boolean }
  donut: { size: string; fill: 'solid' | 'gradient'; strokeWidth: number; showDataLabels: boolean }
  /** Hand-rolled SVG family (DtGauge / DtRingDonut / stacked bar). */
  svg: { shade: 'flat' | 'tint' }
  kpiSpark: { color?: string; fillOpacity: number }
  effects: { dropShadow: boolean; gloss?: boolean }
  states: { hoverFilter: 'none' | 'lighten' | 'darken'; hoverFilterValue: number; dimmedOpacity: number }
  posNeg: { positive: string; negative: string; warning: string; neutral: string }
  /** Optional ramp overrides; unset ramps derive from `series` / `axis`. */
  ramps?: {
    stack?: string[]
    barGradient?: string
    funnelStops?: { offset: string; color: string }[]
    trendCurrent?: string
    trendPrevious?: string
  }
}

export interface ChartTheme {
  label: string
  /** 6 legend/series colors, slot order = adjacency-validated */
  series: string[]
  /** Ordered gradient stops (deep -> bright) that gradient marks run through */
  axis: string[]
  /** Hyper-style gradient mark treatment on/off */
  gradientMarks: boolean
  /** Polaris-style flat marks: solid bars/slices, no accent swap, hover-only markers. */
  flatMarks?: boolean
  /** Stroke + legend dot for `isComparison` series (Shopify's dashed previous period). */
  comparisonColor?: string
  chrome: ChartChrome
  /**
   * Exploration options only. When set, widgets read every visual decision from
   * here instead of the legacy `gradientMarks`/`flatMarks` branches.
   */
  treatment?: ChartTreatment
}

/**
 * Neutral starting point for option treatments — each option states deltas only via
 * `makeTreatment`. Never consumed on its own (no theme ships BASE_TREATMENT as-is).
 */
const BASE_TREATMENT: ChartTreatment = {
  stroke: { curve: 'smooth', width: 2, companionWidth: 2, companionDash: 0, gradientLine: false },
  comparison: { dash: 5, fillOpacity: 0 },
  area: { fill: 'gradient', opacityFrom: 0.2, opacityTo: 0.02 },
  bar: {
    radius: 4,
    columnWidthSingle: '45%',
    columnWidthGrouped: '68%',
    fill: 'solid',
    floatingLabels: false,
  },
  grid: { show: true, dashArray: 0, xLines: false, yLines: true },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 0 },
  markers: { hoverSize: 4, lastPoint: false },
  legend: { markerShape: 'square', markerSize: 8, hoverHighlight: true },
  donut: { size: '62%', fill: 'solid', strokeWidth: 2, showDataLabels: false },
  svg: { shade: 'flat' },
  kpiSpark: { fillOpacity: 0.16 },
  effects: { dropShadow: false },
  states: { hoverFilter: 'none', hoverFilterValue: 0, dimmedOpacity: 0.35 },
  posNeg: { positive: '#1B7A46', negative: '#C2402A', warning: '#B27B00', neutral: '#8A94A0' },
}

type TreatmentOverrides = {
  [K in keyof ChartTreatment]?: Partial<NonNullable<ChartTreatment[K]>>
}

/**
 * Shallow-per-section merge onto BASE_TREATMENT (every treatment section is a flat
 * object, so one level of merge is exactly the depth needed).
 */
export function makeTreatment(overrides: TreatmentOverrides = {}): ChartTreatment {
  const merged: Record<string, unknown> = { ...BASE_TREATMENT }
  for (const key of Object.keys(overrides) as (keyof ChartTreatment)[]) {
    const patch = overrides[key] as Record<string, unknown> | undefined
    if (!patch) continue
    const base = BASE_TREATMENT[key] as Record<string, unknown> | undefined
    merged[key] = { ...(base ?? {}), ...patch }
  }
  return merged as unknown as ChartTreatment
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

/** Option themes never share a chrome object with the legacy themes. */
function cloneChrome(chrome: ChartChrome, overrides: Partial<ChartChrome> = {}): ChartChrome {
  return { ...chrome, ...overrides }
}

/** Ocean-style line treatment shared by every color-only option — smooth 3px
    primary stroke, dashed comparison line, soft gradient wash. Only the
    comparison (secondary/previous-period) colour varies per theme. */
const oceanLineTreatment = (comparison: string) => makeTreatment({
  stroke: { curve: 'smooth', width: 3, companionWidth: 2, companionDash: 5, gradientLine: false },
  comparison: { color: comparison, dash: 5, fillOpacity: 0.18 },
  area: { fill: 'gradient', opacityFrom: 0.25, opacityTo: 0.02 },
  bar: { radius: 4, columnWidthSingle: '45%', columnWidthGrouped: '68%', fill: 'solid', floatingLabels: false },
  grid: { show: true, dashArray: 4, xLines: false, yLines: true },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 4 },
  markers: { hoverSize: 5, lastPoint: false },
  legend: { markerShape: 'circle', markerSize: 8, hoverHighlight: true },
  // Rounded donut geometry lives in the widgets (Apex 6 native
  // plotOptions.pie.borderRadius + spacing) — no stroke needed for the gaps.
  donut: { size: '68%', fill: 'solid', strokeWidth: 0, showDataLabels: false },
  svg: { shade: 'flat' },
  kpiSpark: { fillOpacity: 0.1 },
  effects: { dropShadow: false },
  states: { hoverFilter: 'none', hoverFilterValue: 0, dimmedOpacity: 0.25 },
  posNeg: {
    positive: mp_color_chart_light_grayBlue_positive,
    negative: mp_color_chart_light_grayBlue_negative,
    warning: mp_color_chart_light_grayBlue_warning,
    neutral: mp_color_chart_light_grayBlue_neutral,
  },
})

// Per-option instances: gray stays the grayBlue identity; every other option's
// secondary series takes that theme's own series-2 hue.
const GRAY_BLUE_TREATMENT = oceanLineTreatment(mp_color_chart_light_grayBlue_comparison)
const GRAY_BLUE_GOLD_TREATMENT = oceanLineTreatment(mp_color_chart_light_grayBlueGold_series2)
const SOCIAL_TREATMENT = oceanLineTreatment(mp_color_chart_light_social_series2)


/**
 * Mode-aware chart themes. Each palette carries light and dark series/axis arrays
 * sourced from generated tokens; chrome (labels, grid, tooltip) is mode-specific.
 */
export const CHART_THEMES: Record<ChartPalette, Record<ChartMode, ChartTheme>> = {
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
  grayBlue: {
    light: {
      label: 'Gray + Blue',
      series: [
        mp_color_chart_light_grayBlue_series1,
        mp_color_chart_light_grayBlue_series2,
        mp_color_chart_light_grayBlue_series3,
        mp_color_chart_light_grayBlue_series4,
        mp_color_chart_light_grayBlue_series5,
        mp_color_chart_light_grayBlue_series6,
      ],
      axis: [
        mp_color_chart_light_grayBlue_axis1,
        mp_color_chart_light_grayBlue_axis2,
        mp_color_chart_light_grayBlue_axis3,
        mp_color_chart_light_grayBlue_axis4,
        mp_color_chart_light_grayBlue_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_grayBlue_comparison,
      chrome: cloneChrome(LIGHT_CHROME),
      treatment: GRAY_BLUE_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Gray + Blue',
      series: [
        mp_color_chart_dark_grayBlue_series1,
        mp_color_chart_dark_grayBlue_series2,
        mp_color_chart_dark_grayBlue_series3,
        mp_color_chart_dark_grayBlue_series4,
        mp_color_chart_dark_grayBlue_series5,
        mp_color_chart_dark_grayBlue_series6,
      ],
      axis: [
        mp_color_chart_dark_grayBlue_axis1,
        mp_color_chart_dark_grayBlue_axis2,
        mp_color_chart_dark_grayBlue_axis3,
        mp_color_chart_dark_grayBlue_axis4,
        mp_color_chart_dark_grayBlue_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_grayBlue_comparison,
      chrome: cloneChrome(DARK_CHROME),
      treatment: GRAY_BLUE_TREATMENT,
    },
  },
  // Shares GRAY_BLUE_TREATMENT — comparison/posNeg values are identical; only
  // the series slots differ (subtle gold in the reference's orange position).
  grayBlueGold: {
    light: {
      label: 'Gray + Blue + Gold',
      series: [
        mp_color_chart_light_grayBlueGold_series1,
        mp_color_chart_light_grayBlueGold_series2,
        mp_color_chart_light_grayBlueGold_series3,
        mp_color_chart_light_grayBlueGold_series4,
        mp_color_chart_light_grayBlueGold_series5,
        mp_color_chart_light_grayBlueGold_series6,
      ],
      axis: [
        mp_color_chart_light_grayBlueGold_axis1,
        mp_color_chart_light_grayBlueGold_axis2,
        mp_color_chart_light_grayBlueGold_axis3,
        mp_color_chart_light_grayBlueGold_axis4,
        mp_color_chart_light_grayBlueGold_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_grayBlueGold_series2,
      chrome: cloneChrome(LIGHT_CHROME),
      treatment: GRAY_BLUE_GOLD_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Gray + Blue + Gold',
      series: [
        mp_color_chart_dark_grayBlueGold_series1,
        mp_color_chart_dark_grayBlueGold_series2,
        mp_color_chart_dark_grayBlueGold_series3,
        mp_color_chart_dark_grayBlueGold_series4,
        mp_color_chart_dark_grayBlueGold_series5,
        mp_color_chart_dark_grayBlueGold_series6,
      ],
      axis: [
        mp_color_chart_dark_grayBlueGold_axis1,
        mp_color_chart_dark_grayBlueGold_axis2,
        mp_color_chart_dark_grayBlueGold_axis3,
        mp_color_chart_dark_grayBlueGold_axis4,
        mp_color_chart_dark_grayBlueGold_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_grayBlueGold_series2,
      chrome: cloneChrome(DARK_CHROME),
      treatment: GRAY_BLUE_GOLD_TREATMENT,
    },
  },
  social: {
    light: {
      label: 'Bright Social',
      series: [
        mp_color_chart_light_social_series1,
        mp_color_chart_light_social_series2,
        mp_color_chart_light_social_series3,
        mp_color_chart_light_social_series4,
        mp_color_chart_light_social_series5,
        mp_color_chart_light_social_series6,
      ],
      axis: [
        mp_color_chart_light_social_axis1,
        mp_color_chart_light_social_axis2,
        mp_color_chart_light_social_axis3,
        mp_color_chart_light_social_axis4,
        mp_color_chart_light_social_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_social_series2,
      chrome: cloneChrome(LIGHT_CHROME),
      treatment: SOCIAL_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Bright Social',
      series: [
        mp_color_chart_dark_social_series1,
        mp_color_chart_dark_social_series2,
        mp_color_chart_dark_social_series3,
        mp_color_chart_dark_social_series4,
        mp_color_chart_dark_social_series5,
        mp_color_chart_dark_social_series6,
      ],
      axis: [
        mp_color_chart_dark_social_axis1,
        mp_color_chart_dark_social_axis2,
        mp_color_chart_dark_social_axis3,
        mp_color_chart_dark_social_axis4,
        mp_color_chart_dark_social_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_social_series2,
      chrome: cloneChrome(DARK_CHROME),
      treatment: SOCIAL_TREATMENT,
    },
  },
}

/** Back-compat: light series colourways keyed by palette. */
export const CHART_PALETTES: Record<ChartPalette, string[]> = Object.fromEntries(
  Object.entries(CHART_THEMES).map(([id, modes]) => [id, modes.light.series]),
) as Record<ChartPalette, string[]>

const chartPaletteId = ref<ChartPalette>('grayBlue')

/**
 * Provide/inject key that lets a widget subtree pin an explicit theme instead of
 * the global palette. No provider ships today (the compare pages that used it
 * were retired); widgets still inject it so a scoped preview stays possible.
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

/** Mix a hex colour toward black by fraction `t` (0..1) — the emboss shadow lip. */
export function shadeHex(hex: string, t: number): string {
  const clean = hex.replace('#', '')
  const mix = (c: number) => Math.round(c * (1 - t))
  const to2 = (i: number) => mix(parseInt(clean.slice(i, i + 2), 16)).toString(16).padStart(2, '0')
  return `#${to2(0)}${to2(2)}${to2(4)}`
}

/** Bold pitch fade — bright crown, series body, deep base. */
export function hyperPitchStops(color: string): { offset: number; color: string; opacity: number }[] {
  return [
    { offset: 0, color: tintHex(color, 0.58), opacity: 1 },
    { offset: 36, color: tintHex(color, 0.16), opacity: 1 },
    { offset: 70, color, opacity: 1 },
    { offset: 100, color: shadeHex(color, 0.34), opacity: 1 },
  ]
}

/**
 * Wrap a vertical gradient ramp in an embossed shell: a bright gloss at the very
 * top edge and a darker lip at the base, so a mark reads as a lit solid rather
 * than a flat wash. Stops are compressed into the first/last few percent so the
 * body of the ramp is untouched.
 */
export function embossStops(
  stops: { offset: number; color: string; opacity: number }[],
): { offset: number; color: string; opacity: number }[] {
  if (stops.length < 2) return stops
  const head = stops[0]!
  const tail = stops[stops.length - 1]!
  const squeeze = stops.map((s) => ({ ...s, offset: 6 + s.offset * 0.88 }))
  return [
    { offset: 0, color: tintHex(head.color, 0.5), opacity: 1 },
    ...squeeze,
    { offset: 100, color: shadeHex(tail.color, 0.16), opacity: 1 },
  ]
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
