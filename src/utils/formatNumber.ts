import { formatCurrency } from './formatCurrency'

/** Unit vocabulary shared by dashboard widgets (mirrors DashboardMetricUnit). */
export type NumericUnit = 'currency' | 'count' | 'percent' | undefined

/** Full-precision grouped number: 12847 → "12,847". */
export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits }).format(value)
}

/** Percent with a fixed number of decimals: 42.31 → "42.3%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

/**
 * Compact axis/bar-label form: k-notation at 1000 and above (1 decimal below
 * 10k), full grouped digits below — "$12.8k", "$980", "1,240", "42%".
 */
export function formatCompactValue(value: number, unit: NumericUnit): string {
  if (unit === 'percent') return formatPercent(value, 0)
  const prefix = unit === 'currency' ? '$' : ''
  if (Math.abs(value) < 1000) return `${prefix}${formatNumber(value)}`
  const k = value / 1000
  const text = Math.abs(k) < 10 ? k.toFixed(1).replace(/\.0$/, '') : formatNumber(k)
  return `${prefix}${text}k`
}

/** Full tooltip/legend form: "$12,847", "42.3%", "12,847". */
export function formatFullValue(value: number, unit: NumericUnit): string {
  if (unit === 'currency') return formatCurrency(value)
  if (unit === 'percent') return formatPercent(value)
  return formatNumber(value)
}
