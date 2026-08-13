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
  mp_color_chart_dark_optionA_axis1,
  mp_color_chart_dark_optionA_axis2,
  mp_color_chart_dark_optionA_axis3,
  mp_color_chart_dark_optionA_axis4,
  mp_color_chart_dark_optionA_axis5,
  mp_color_chart_dark_optionA_comparison,
  mp_color_chart_dark_optionA_series1,
  mp_color_chart_dark_optionA_series2,
  mp_color_chart_dark_optionA_series3,
  mp_color_chart_dark_optionA_series4,
  mp_color_chart_dark_optionA_series5,
  mp_color_chart_dark_optionA_series6,
  mp_color_chart_dark_optionB_axis1,
  mp_color_chart_dark_optionB_axis2,
  mp_color_chart_dark_optionB_axis3,
  mp_color_chart_dark_optionB_axis4,
  mp_color_chart_dark_optionB_axis5,
  mp_color_chart_dark_optionB_comparison,
  mp_color_chart_dark_optionB_series1,
  mp_color_chart_dark_optionB_series2,
  mp_color_chart_dark_optionB_series3,
  mp_color_chart_dark_optionB_series4,
  mp_color_chart_dark_optionB_series5,
  mp_color_chart_dark_optionB_series6,
  mp_color_chart_dark_optionC_axis1,
  mp_color_chart_dark_optionC_axis2,
  mp_color_chart_dark_optionC_axis3,
  mp_color_chart_dark_optionC_axis4,
  mp_color_chart_dark_optionC_axis5,
  mp_color_chart_dark_optionC_comparison,
  mp_color_chart_dark_optionC_series1,
  mp_color_chart_dark_optionC_series2,
  mp_color_chart_dark_optionC_series3,
  mp_color_chart_dark_optionC_series4,
  mp_color_chart_dark_optionC_series5,
  mp_color_chart_dark_optionC_series6,
  mp_color_chart_dark_optionD_axis1,
  mp_color_chart_dark_optionD_axis2,
  mp_color_chart_dark_optionD_axis3,
  mp_color_chart_dark_optionD_axis4,
  mp_color_chart_dark_optionD_axis5,
  mp_color_chart_dark_optionD_comparison,
  mp_color_chart_dark_optionD_series1,
  mp_color_chart_dark_optionD_series2,
  mp_color_chart_dark_optionD_series3,
  mp_color_chart_dark_optionD_series4,
  mp_color_chart_dark_optionD_series5,
  mp_color_chart_dark_optionD_series6,
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
  mp_color_chart_light_optionA_axis1,
  mp_color_chart_light_optionA_axis2,
  mp_color_chart_light_optionA_axis3,
  mp_color_chart_light_optionA_axis4,
  mp_color_chart_light_optionA_axis5,
  mp_color_chart_light_optionA_comparison,
  mp_color_chart_light_optionA_negative,
  mp_color_chart_light_optionA_neutral,
  mp_color_chart_light_optionA_positive,
  mp_color_chart_light_optionA_series1,
  mp_color_chart_light_optionA_series2,
  mp_color_chart_light_optionA_series3,
  mp_color_chart_light_optionA_series4,
  mp_color_chart_light_optionA_series5,
  mp_color_chart_light_optionA_series6,
  mp_color_chart_light_optionA_warning,
  mp_color_chart_light_optionB_axis1,
  mp_color_chart_light_optionB_axis2,
  mp_color_chart_light_optionB_axis3,
  mp_color_chart_light_optionB_axis4,
  mp_color_chart_light_optionB_axis5,
  mp_color_chart_light_optionB_comparison,
  mp_color_chart_light_optionB_negative,
  mp_color_chart_light_optionB_neutral,
  mp_color_chart_light_optionB_positive,
  mp_color_chart_light_optionB_series1,
  mp_color_chart_light_optionB_series2,
  mp_color_chart_light_optionB_series3,
  mp_color_chart_light_optionB_series4,
  mp_color_chart_light_optionB_series5,
  mp_color_chart_light_optionB_series6,
  mp_color_chart_light_optionB_warning,
  mp_color_chart_light_optionC_axis1,
  mp_color_chart_light_optionC_axis2,
  mp_color_chart_light_optionC_axis3,
  mp_color_chart_light_optionC_axis4,
  mp_color_chart_light_optionC_axis5,
  mp_color_chart_light_optionC_comparison,
  mp_color_chart_light_optionC_negative,
  mp_color_chart_light_optionC_neutral,
  mp_color_chart_light_optionC_positive,
  mp_color_chart_light_optionC_series1,
  mp_color_chart_light_optionC_series2,
  mp_color_chart_light_optionC_series3,
  mp_color_chart_light_optionC_series4,
  mp_color_chart_light_optionC_series5,
  mp_color_chart_light_optionC_series6,
  mp_color_chart_light_optionC_warning,
  mp_color_chart_light_optionD_axis1,
  mp_color_chart_light_optionD_axis2,
  mp_color_chart_light_optionD_axis3,
  mp_color_chart_light_optionD_axis4,
  mp_color_chart_light_optionD_axis5,
  mp_color_chart_light_optionD_comparison,
  mp_color_chart_light_optionD_negative,
  mp_color_chart_light_optionD_neutral,
  mp_color_chart_light_optionD_positive,
  mp_color_chart_light_optionD_series1,
  mp_color_chart_light_optionD_series2,
  mp_color_chart_light_optionD_series3,
  mp_color_chart_light_optionD_series4,
  mp_color_chart_light_optionD_series5,
  mp_color_chart_light_optionD_series6,
  mp_color_chart_light_optionD_warning,
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
export type ChartPalette =
  | 'shopify'
  | 'blue'
  | 'indigo'
  | 'ocean'
  | 'aurora'
  | 'optionA'
  | 'optionB'
  | 'optionC'
  | 'optionD'

/**
 * The four chart visual systems built for the leadership exploration. They are the
 * only themes that carry a `treatment`; every legacy theme leaves it undefined so
 * the existing (baseline) code paths stay literally unchanged.
 */
export const OPTION_CHART_IDS = ['optionA', 'optionB', 'optionC', 'optionD'] as const

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
 * Full visual-system description for a chart theme — the exploration options
 * (optionA–D) declare one; legacy themes leave `ChartTheme.treatment` undefined and
 * keep their existing `gradientMarks`/`flatMarks` branches verbatim.
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

// --- Chart visual-system exploration (P5) -------------------------------------
// Colors are the frozen `color.chart.{light,dark}.option*` tokens — the
// P4-validated values recorded in `scripts/chart-exploration/option-palettes.mjs`.
// Treatments translate the "Treatment spec" blocks in
// `docs/chart-exploration/notes/option-{a,b,c,d}.md`; one treatment serves both
// modes, so its comparison/posNeg colors read the light tokens.

/** A — Restrained Blue: one blue weighted by importance, everything else neutral. */
const OPTION_A_TREATMENT = makeTreatment({
  stroke: { curve: 'smooth', width: 2, companionWidth: 1.75, companionDash: 0, gradientLine: false },
  comparison: { color: mp_color_chart_light_optionA_comparison, dash: 0, fillOpacity: 0.1 },
  area: { fill: 'gradient', opacityFrom: 0.14, opacityTo: 0.02 },
  bar: { radius: 2, columnWidthSingle: '45%', columnWidthGrouped: '68%', fill: 'solid', floatingLabels: false },
  grid: { show: true, dashArray: 0, xLines: false, yLines: true },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 0 },
  markers: { hoverSize: 4, lastPoint: false },
  legend: { markerShape: 'square', markerSize: 8, hoverHighlight: true },
  donut: { size: '62%', fill: 'solid', strokeWidth: 2, showDataLabels: false },
  svg: { shade: 'flat' },
  kpiSpark: { fillOpacity: 0.12 },
  effects: { dropShadow: false },
  states: { hoverFilter: 'none', hoverFilterValue: 0, dimmedOpacity: 0.35 },
  posNeg: {
    positive: mp_color_chart_light_optionA_positive,
    negative: mp_color_chart_light_optionA_negative,
    warning: mp_color_chart_light_optionA_warning,
    neutral: mp_color_chart_light_optionA_neutral,
  },
})

/** B — Sophisticated Multi-Color: one hue per data family, saturation one notch down. */
const OPTION_B_TREATMENT = makeTreatment({
  stroke: { curve: 'straight', width: 2, companionWidth: 2, companionDash: 0, gradientLine: false },
  comparison: { color: mp_color_chart_light_optionB_comparison, dash: 0, fillOpacity: 0.08 },
  area: { fill: 'solid', opacityFrom: 0.09, opacityTo: 0.09 },
  bar: { radius: 4, columnWidthSingle: '45%', columnWidthGrouped: '68%', fill: 'solid', floatingLabels: false },
  grid: { show: true, dashArray: 4, xLines: false, yLines: true },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 4 },
  markers: { hoverSize: 5, lastPoint: false },
  legend: { markerShape: 'circle', markerSize: 8, hoverHighlight: true },
  donut: { size: '66%', fill: 'solid', strokeWidth: 2, showDataLabels: false },
  svg: { shade: 'flat' },
  kpiSpark: { fillOpacity: 0.1 },
  effects: { dropShadow: false },
  states: { hoverFilter: 'none', hoverFilterValue: 0, dimmedOpacity: 0.25 },
  posNeg: {
    positive: mp_color_chart_light_optionB_positive,
    negative: mp_color_chart_light_optionB_negative,
    warning: mp_color_chart_light_optionB_warning,
    neutral: mp_color_chart_light_optionB_neutral,
  },
})

/** C — Blue · Teal · Green: one connected family, separation from alternating lightness. */
const OPTION_C_TREATMENT = makeTreatment({
  stroke: { curve: 'smooth', width: 2.5, companionWidth: 2, companionDash: 0, gradientLine: false },
  comparison: { color: mp_color_chart_light_optionC_comparison, dash: 0, fillOpacity: 0.16 },
  area: { fill: 'gradient', opacityFrom: 0.28, opacityTo: 0.02 },
  bar: { radius: 6, columnWidthSingle: '45%', columnWidthGrouped: '70%', fill: 'tint-gradient', floatingLabels: false },
  grid: { show: true, dashArray: 0, xLines: false, yLines: true },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 0 },
  markers: { hoverSize: 4, lastPoint: true },
  legend: { markerShape: 'circle', markerSize: 8, hoverHighlight: true },
  donut: { size: '64%', fill: 'solid', strokeWidth: 2, showDataLabels: false },
  svg: { shade: 'flat' },
  kpiSpark: { fillOpacity: 0.18 },
  effects: { dropShadow: false },
  states: { hoverFilter: 'none', hoverFilterValue: 0, dimmedOpacity: 0.3 },
  posNeg: {
    positive: mp_color_chart_light_optionC_positive,
    negative: mp_color_chart_light_optionC_negative,
    warning: mp_color_chart_light_optionC_warning,
    neutral: mp_color_chart_light_optionC_neutral,
  },
})

/** D — Modern Gradient: depth and light, every gradient encoding something. */
const OPTION_D_TREATMENT = makeTreatment({
  stroke: { curve: 'smooth', width: 2.5, companionWidth: 2, companionDash: 0, gradientLine: true },
  comparison: { color: mp_color_chart_light_optionD_comparison, dash: 0, fillOpacity: 0.18 },
  area: { fill: 'gradient', opacityFrom: 0.35, opacityTo: 0 },
  bar: { radius: 8, columnWidthSingle: '45%', columnWidthGrouped: '66%', fill: 'axis-gradient', floatingLabels: true },
  // "fainter" grid per the option-D spec — the treatment carries it so the
  // crosshair keeps the standard chrome.grid weight.
  grid: { show: true, dashArray: 0, xLines: false, yLines: true, color: 'rgba(26, 24, 20, 0.04)' },
  axes: { yLabelsOnTimeseries: true },
  crosshair: { show: true, dash: 0 },
  markers: { hoverSize: 6, lastPoint: true },
  legend: { markerShape: 'circle', markerSize: 8, hoverHighlight: true },
  donut: { size: '64%', fill: 'gradient', strokeWidth: 2, showDataLabels: false },
  svg: { shade: 'tint' },
  kpiSpark: { fillOpacity: 0.24 },
  // Gloss is D's alone: a lit top edge + darker base lip so marks read as
  // embossed solids. The other options stay matte by design.
  effects: { dropShadow: true, gloss: true },
  states: { hoverFilter: 'lighten', hoverFilterValue: 0.04, dimmedOpacity: 0.2 },
  posNeg: {
    positive: mp_color_chart_light_optionD_positive,
    negative: mp_color_chart_light_optionD_negative,
    warning: mp_color_chart_light_optionD_warning,
    neutral: mp_color_chart_light_optionD_neutral,
  },
})

/**
 * Mode-aware chart themes. Each palette carries light and dark series/axis arrays
 * sourced from generated tokens; chrome (labels, grid, tooltip) is mode-specific.
 */
export const CHART_THEMES: Record<ChartPalette, Record<ChartMode, ChartTheme>> = {
  // Shopify admin analytics *grammar* (Polaris Viz): flat marks, 2px strokes,
  // dashed previous-period comparison. Polaris's own seriesColors are a
  // multi-hue categorical set (purples/magentas); we keep the grammar but hold
  // the hue inside the Maropost blue (#0092D4) → Shopify azure (#13ACF0)
  // family, drifting only as far as teal on the tail slots — the same
  // blue → teal philosophy as DOTTED_BLUES. Separation between adjacent
  // slices/lines comes from lightness, not hue.
  shopify: {
    light: {
      label: 'Shopify',
      series: [
        '#13ACF0', // Shopify azure — lead
        '#075E82', // deep harbour blue
        '#6FD1F5', // pale sky
        '#0092D4', // Maropost blue
        '#35C4BE', // teal (greenish edge of the family)
        '#A9E3E0', // pale teal
      ],
      axis: ['#0A4C66', '#0C749E', '#0A97D5', '#13ACF0', '#63CCF7'],
      gradientMarks: false,
      flatMarks: true,
      comparisonColor: '#0A97D5',
      chrome: LIGHT_CHROME,
    },
    dark: {
      label: 'Shopify',
      series: ['#4CC9FF', '#0E7FA8', '#A5E4FF', '#2CB6EE', '#48D6CF', '#BFEFEA'],
      axis: ['#0C749E', '#0A97D5', '#13ACF0', '#4CC9FF', '#8ADBFF'],
      gradientMarks: false,
      flatMarks: true,
      comparisonColor: '#3E97C6',
      chrome: DARK_CHROME,
    },
  },
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
  optionA: {
    light: {
      label: 'Restrained Blue',
      series: [
        mp_color_chart_light_optionA_series1,
        mp_color_chart_light_optionA_series2,
        mp_color_chart_light_optionA_series3,
        mp_color_chart_light_optionA_series4,
        mp_color_chart_light_optionA_series5,
        mp_color_chart_light_optionA_series6,
      ],
      axis: [
        mp_color_chart_light_optionA_axis1,
        mp_color_chart_light_optionA_axis2,
        mp_color_chart_light_optionA_axis3,
        mp_color_chart_light_optionA_axis4,
        mp_color_chart_light_optionA_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_optionA_comparison,
      chrome: cloneChrome(LIGHT_CHROME, { grid: 'rgba(26, 24, 20, 0.07)' }),
      treatment: OPTION_A_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Restrained Blue',
      series: [
        mp_color_chart_dark_optionA_series1,
        mp_color_chart_dark_optionA_series2,
        mp_color_chart_dark_optionA_series3,
        mp_color_chart_dark_optionA_series4,
        mp_color_chart_dark_optionA_series5,
        mp_color_chart_dark_optionA_series6,
      ],
      axis: [
        mp_color_chart_dark_optionA_axis1,
        mp_color_chart_dark_optionA_axis2,
        mp_color_chart_dark_optionA_axis3,
        mp_color_chart_dark_optionA_axis4,
        mp_color_chart_dark_optionA_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_optionA_comparison,
      chrome: cloneChrome(DARK_CHROME),
      treatment: OPTION_A_TREATMENT,
    },
  },
  optionB: {
    light: {
      label: 'Sophisticated Multi-Color',
      series: [
        mp_color_chart_light_optionB_series1,
        mp_color_chart_light_optionB_series2,
        mp_color_chart_light_optionB_series3,
        mp_color_chart_light_optionB_series4,
        mp_color_chart_light_optionB_series5,
        mp_color_chart_light_optionB_series6,
      ],
      axis: [
        mp_color_chart_light_optionB_axis1,
        mp_color_chart_light_optionB_axis2,
        mp_color_chart_light_optionB_axis3,
        mp_color_chart_light_optionB_axis4,
        mp_color_chart_light_optionB_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_optionB_comparison,
      chrome: cloneChrome(LIGHT_CHROME),
      treatment: OPTION_B_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Sophisticated Multi-Color',
      series: [
        mp_color_chart_dark_optionB_series1,
        mp_color_chart_dark_optionB_series2,
        mp_color_chart_dark_optionB_series3,
        mp_color_chart_dark_optionB_series4,
        mp_color_chart_dark_optionB_series5,
        mp_color_chart_dark_optionB_series6,
      ],
      axis: [
        mp_color_chart_dark_optionB_axis1,
        mp_color_chart_dark_optionB_axis2,
        mp_color_chart_dark_optionB_axis3,
        mp_color_chart_dark_optionB_axis4,
        mp_color_chart_dark_optionB_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_optionB_comparison,
      chrome: cloneChrome(DARK_CHROME),
      treatment: OPTION_B_TREATMENT,
    },
  },
  optionC: {
    light: {
      label: 'Blue Teal Green',
      series: [
        mp_color_chart_light_optionC_series1,
        mp_color_chart_light_optionC_series2,
        mp_color_chart_light_optionC_series3,
        mp_color_chart_light_optionC_series4,
        mp_color_chart_light_optionC_series5,
        mp_color_chart_light_optionC_series6,
      ],
      axis: [
        mp_color_chart_light_optionC_axis1,
        mp_color_chart_light_optionC_axis2,
        mp_color_chart_light_optionC_axis3,
        mp_color_chart_light_optionC_axis4,
        mp_color_chart_light_optionC_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_optionC_comparison,
      chrome: cloneChrome(LIGHT_CHROME, { grid: 'rgba(26, 24, 20, 0.07)' }),
      treatment: OPTION_C_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Blue Teal Green',
      series: [
        mp_color_chart_dark_optionC_series1,
        mp_color_chart_dark_optionC_series2,
        mp_color_chart_dark_optionC_series3,
        mp_color_chart_dark_optionC_series4,
        mp_color_chart_dark_optionC_series5,
        mp_color_chart_dark_optionC_series6,
      ],
      axis: [
        mp_color_chart_dark_optionC_axis1,
        mp_color_chart_dark_optionC_axis2,
        mp_color_chart_dark_optionC_axis3,
        mp_color_chart_dark_optionC_axis4,
        mp_color_chart_dark_optionC_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_optionC_comparison,
      chrome: cloneChrome(DARK_CHROME),
      treatment: OPTION_C_TREATMENT,
    },
  },
  optionD: {
    light: {
      label: 'Modern Gradient',
      series: [
        mp_color_chart_light_optionD_series1,
        mp_color_chart_light_optionD_series2,
        mp_color_chart_light_optionD_series3,
        mp_color_chart_light_optionD_series4,
        mp_color_chart_light_optionD_series5,
        mp_color_chart_light_optionD_series6,
      ],
      axis: [
        mp_color_chart_light_optionD_axis1,
        mp_color_chart_light_optionD_axis2,
        mp_color_chart_light_optionD_axis3,
        mp_color_chart_light_optionD_axis4,
        mp_color_chart_light_optionD_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_light_optionD_comparison,
      chrome: cloneChrome(LIGHT_CHROME),
      treatment: OPTION_D_TREATMENT,
    },
    // PROVISIONAL — light-only review; dark tuning is follow-up
    dark: {
      label: 'Modern Gradient',
      series: [
        mp_color_chart_dark_optionD_series1,
        mp_color_chart_dark_optionD_series2,
        mp_color_chart_dark_optionD_series3,
        mp_color_chart_dark_optionD_series4,
        mp_color_chart_dark_optionD_series5,
        mp_color_chart_dark_optionD_series6,
      ],
      axis: [
        mp_color_chart_dark_optionD_axis1,
        mp_color_chart_dark_optionD_axis2,
        mp_color_chart_dark_optionD_axis3,
        mp_color_chart_dark_optionD_axis4,
        mp_color_chart_dark_optionD_axis5,
      ],
      gradientMarks: false,
      comparisonColor: mp_color_chart_dark_optionD_comparison,
      chrome: cloneChrome(DARK_CHROME),
      treatment: OPTION_D_TREATMENT,
    },
  },
}

/** Back-compat: light series colourways keyed by palette. */
export const CHART_PALETTES: Record<ChartPalette, string[]> = Object.fromEntries(
  Object.entries(CHART_THEMES).map(([id, modes]) => [id, modes.light.series]),
) as Record<ChartPalette, string[]>

const chartPaletteId = ref<ChartPalette>('shopify')

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

/** Mix a hex colour toward black by fraction `t` (0..1) — the emboss shadow lip. */
export function shadeHex(hex: string, t: number): string {
  const clean = hex.replace('#', '')
  const mix = (c: number) => Math.round(c * (1 - t))
  const to2 = (i: number) => mix(parseInt(clean.slice(i, i + 2), 16)).toString(16).padStart(2, '0')
  return `#${to2(0)}${to2(2)}${to2(4)}`
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
