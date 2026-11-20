// Size charts: which chart a product's size guide shows, and its measurements in
// inches or centimetres. A chart is written in one unit and the shopper can
// switch. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import type { SizeChart } from './demoStores/types.ts'

// The one chart shape; it lives with the demo store types because a store's seed carries its charts.
export type { SizeChart }

export type SizeUnit = SizeChart['unit']

export const CM_PER_INCH = 2.54

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface SizedProduct {
  detail?: { sizeChartId?: string }
}

/** The chart the product links (`detail.sizeChartId`), or undefined when it links none or the chart is gone. */
export function chartFor(product: SizedProduct, charts: readonly SizeChart[]): SizeChart | undefined {
  const id = product.detail?.sizeChartId
  return id ? charts.find((chart) => chart.id === id) : undefined
}

/** Inches to the nearest half ("33.5"), centimetres to the nearest whole one ("86"). */
function convertNumber(value: number, to: SizeUnit): string {
  return to === 'in' ? String(Math.round((value / CM_PER_INCH) * 2) / 2) : String(Math.round(value * CM_PER_INCH))
}

/**
 * A measurement written in `from`, in `to`: every number in it is converted and
 * the rest kept, so a range stays a range ("86-91" cm is "34-36" in). Text
 * without numbers ("One size", "—") is left alone.
 */
export function convertMeasurement(value: string, from: SizeUnit, to: SizeUnit): string {
  if (from === to) return value
  return value.replace(/\d+(?:\.\d+)?/g, (n) => convertNumber(Number(n), to))
}

/** The chart with its measurements in `unit`. Sizes, columns and notes are kept as written. */
export function chartInUnit(chart: SizeChart, unit: SizeUnit): SizeChart {
  if (chart.unit === unit) return chart
  return {
    ...chart,
    unit,
    columns: [...chart.columns],
    rows: chart.rows.map((row) => ({ size: row.size, values: row.values.map((value) => convertMeasurement(value, chart.unit, unit)) })),
  }
}
