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

/**
 * Inches to the nearest half ("33.5"), centimetres to the nearest whole one ("86"),
 * or to the nearest half for a foot length ("23.5"), where half a shoe size is about
 * 0.4 cm.
 */
function convertNumber(value: number, to: SizeUnit, halfCm: boolean): string {
  if (to === 'in') return String(Math.round((value / CM_PER_INCH) * 2) / 2)
  return String(halfCm ? Math.round(value * CM_PER_INCH * 2) / 2 : Math.round(value * CM_PER_INCH))
}

/** A column of foot lengths: its centimetres are kept to the half. */
const FOOT_LENGTH = /\b(foot|feet)\b/i

/**
 * A value written in `from`, in `to`: every number in it is converted and the rest
 * kept, so a range stays a range ("86-91" cm is "34-36" in). Text without numbers
 * ("One size", "—") is left alone. `column` is the column it is in: a size column
 * ("Women's shoe size") is kept as written, and a foot length is converted to the
 * half centimetre.
 */
export function convertMeasurement(value: string, from: SizeUnit, to: SizeUnit, column = ''): string {
  if (from === to || !isMeasurementColumn(column)) return value
  const halfCm = FOOT_LENGTH.test(column)
  return value.replace(/\d+(?:\.\d+)?/g, (n) => convertNumber(Number(n), to, halfCm))
}

/** The chart with its measurements in `unit`. Sizes, size columns, columns and notes are kept as written. */
export function chartInUnit(chart: SizeChart, unit: SizeUnit): SizeChart {
  if (chart.unit === unit) return chart
  return {
    ...chart,
    unit,
    columns: [...chart.columns],
    rows: chart.rows.map((row) => ({ size: row.size, values: row.values.map((value, i) => convertMeasurement(value, chart.unit, unit, chart.columns[i])) })),
  }
}

/** A column of lengths that inches and centimeters both describe; a size column ("Women's shoe size") is written as it is. */
export function isMeasurementColumn(name: string): boolean {
  return !/\bsizes?\b/i.test(name)
}

/** The chart has a column a shopper may want in the other unit (a socks chart of shoe sizes has none). */
export function hasMeasurements(chart: Pick<SizeChart, 'columns'>): boolean {
  return chart.columns.some(isMeasurementColumn)
}
