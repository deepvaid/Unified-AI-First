import type { DashboardLayout, DashboardWidgetType } from '@/stores/dashboards/types'

export type WidgetSize = 'S' | 'M' | 'L' | 'XL'

export interface WidgetPreset {
  w: number
  h: number
  minW: number
  minH: number
}

export const SIZE_PRESETS: Record<DashboardWidgetType, Record<WidgetSize, WidgetPreset>> = {
  kpi: {
    S: { w: 3, h: 3, minW: 2, minH: 2 },
    M: { w: 3, h: 4, minW: 2, minH: 2 },
    L: { w: 4, h: 5, minW: 2, minH: 2 },
    XL: { w: 6, h: 5, minW: 2, minH: 2 },
  },
  timeseries: {
    S: { w: 6, h: 6, minW: 2, minH: 3 },
    M: { w: 7, h: 7, minW: 2, minH: 3 },
    L: { w: 9, h: 8, minW: 2, minH: 3 },
    XL: { w: 12, h: 9, minW: 2, minH: 3 },
  },
  bar: {
    S: { w: 5, h: 6, minW: 2, minH: 3 },
    M: { w: 6, h: 7, minW: 2, minH: 3 },
    L: { w: 9, h: 8, minW: 2, minH: 3 },
    XL: { w: 12, h: 9, minW: 2, minH: 3 },
  },
  pie: {
    S: { w: 4, h: 6, minW: 3, minH: 4 },
    M: { w: 5, h: 7, minW: 3, minH: 4 },
    L: { w: 6, h: 8, minW: 3, minH: 4 },
    XL: { w: 8, h: 9, minW: 3, minH: 4 },
  },
  table: {
    S: { w: 5, h: 6, minW: 2, minH: 3 },
    M: { w: 6, h: 7, minW: 2, minH: 3 },
    L: { w: 12, h: 8, minW: 2, minH: 3 },
    XL: { w: 12, h: 10, minW: 2, minH: 3 },
  },
  activity: {
    S: { w: 4, h: 6, minW: 3, minH: 4 },
    M: { w: 5, h: 8, minW: 3, minH: 4 },
    L: { w: 6, h: 10, minW: 3, minH: 4 },
    XL: { w: 8, h: 12, minW: 3, minH: 4 },
  },
  setup: {
    S: { w: 3, h: 7, minW: 3, minH: 6 },
    M: { w: 4, h: 8, minW: 3, minH: 6 },
    L: { w: 4, h: 10, minW: 3, minH: 6 },
    XL: { w: 5, h: 11, minW: 3, minH: 6 },
  },
  attention: {
    /* minH 1 allows the collapsed (default) single-row summary height. */
    S: { w: 12, h: 5, minW: 6, minH: 1 },
    M: { w: 12, h: 6, minW: 6, minH: 1 },
    L: { w: 12, h: 7, minW: 6, minH: 1 },
    XL: { w: 12, h: 8, minW: 6, minH: 1 },
  },
  insights: {
    S: { w: 4, h: 6, minW: 3, minH: 4 },
    M: { w: 6, h: 8, minW: 3, minH: 4 },
    L: { w: 8, h: 9, minW: 3, minH: 4 },
    XL: { w: 12, h: 9, minW: 3, minH: 4 },
  },
  metric_explorer: {
    S: { w: 8, h: 9, minW: 6, minH: 7 },
    M: { w: 8, h: 10, minW: 6, minH: 7 },
    L: { w: 12, h: 10, minW: 6, minH: 7 },
    XL: { w: 12, h: 11, minW: 6, minH: 7 },
  },
  funnel: {
    S: { w: 8, h: 7, minW: 6, minH: 6 },
    M: { w: 12, h: 8, minW: 6, minH: 6 },
    L: { w: 12, h: 9, minW: 6, minH: 6 },
    XL: { w: 12, h: 10, minW: 6, minH: 6 },
  },
  donut: {
    S: { w: 3, h: 7, minW: 3, minH: 5 },
    M: { w: 4, h: 8, minW: 3, minH: 5 },
    L: { w: 4, h: 10, minW: 3, minH: 5 },
    XL: { w: 6, h: 10, minW: 3, minH: 5 },
  },
  gauge: {
    S: { w: 3, h: 7, minW: 3, minH: 5 },
    M: { w: 4, h: 8, minW: 3, minH: 5 },
    L: { w: 4, h: 10, minW: 3, minH: 5 },
    XL: { w: 6, h: 10, minW: 3, minH: 5 },
  },
  bar_list: {
    S: { w: 3, h: 7, minW: 3, minH: 5 },
    M: { w: 4, h: 8, minW: 3, minH: 5 },
    L: { w: 6, h: 8, minW: 3, minH: 5 },
    XL: { w: 8, h: 9, minW: 3, minH: 5 },
  },
  breakdown: {
    S: { w: 3, h: 7, minW: 3, minH: 5 },
    M: { w: 4, h: 8, minW: 3, minH: 5 },
    L: { w: 6, h: 8, minW: 3, minH: 5 },
    XL: { w: 8, h: 9, minW: 3, minH: 5 },
  },
  tabs: {
    S: { w: 6, h: 7, minW: 5, minH: 6 },
    M: { w: 7, h: 8, minW: 5, minH: 6 },
    L: { w: 9, h: 9, minW: 5, minH: 6 },
    XL: { w: 12, h: 9, minW: 5, minH: 6 },
  },
}

export const WIDGET_SIZES: WidgetSize[] = ['S', 'M', 'L', 'XL']

export function getPreset(type: DashboardWidgetType, size: WidgetSize): WidgetPreset {
  return SIZE_PRESETS[type][size]
}

export function getDefaultPreset(type: DashboardWidgetType): WidgetPreset {
  return SIZE_PRESETS[type].M
}

export function detectSize(type: DashboardWidgetType, w: number, h: number): WidgetSize | null {
  const presets = SIZE_PRESETS[type]
  for (const size of WIDGET_SIZES) {
    if (presets[size].w === w && presets[size].h === h) {
      return size
    }
  }
  return null
}

export function buildLayoutFromPreset(
  type: DashboardWidgetType,
  size: WidgetSize,
  position: { x: number; y: number },
): DashboardLayout {
  const preset = getPreset(type, size)
  return {
    x: position.x,
    y: position.y,
    w: preset.w,
    h: preset.h,
    minW: preset.minW,
    minH: preset.minH,
  }
}
