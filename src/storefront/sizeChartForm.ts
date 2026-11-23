// Editing a size chart in Products › Size charts: the grid's edits (sizes are rows,
// measurements are columns, every row has one value per column), what a cell may
// hold, and what has to be fixed before a chart is saved. Pure rules: no Vue, no
// Pinia, no `@/` imports, so `npm run test:storefront` runs them in Node.

import { convertMeasurement } from './sizeCharts.ts'
import type { SizeChart, SizeUnit } from './sizeCharts.ts'

/** A chart as the form holds it: everything but its id. */
export type SizeChartDraft = Omit<SizeChart, 'id'>
export type SizeRow = SizeChart['rows'][number]

// ── Cells ────────────────────────────────────────────────────────────────────

const NUMBER = String.raw`\d+(?:\.\d+)?`
/** "34", "13.5", "34-36"; an en or em dash and spaces round it are fine too. */
const MEASUREMENT = new RegExp(String.raw`^(${NUMBER})(?:\s*[-–—]\s*(${NUMBER}))?$`)

/** What is wrong with a measurement, or '' when it is a number or a range. */
export function measurementError(value: string): string {
  const text = value.trim()
  if (!text) return 'Enter a measurement'
  const match = MEASUREMENT.exec(text)
  if (!match) return 'Use a number or a range, like 34-36'
  if (match[2] !== undefined && Number(match[1]) > Number(match[2])) return 'Put the smaller number first, like 34-36'
  return ''
}

/** A measurement as it is saved: trimmed, a range written "34-36". Anything else is kept as typed. */
export function normalizeMeasurement(value: string): string {
  const text = value.trim()
  const match = MEASUREMENT.exec(text)
  if (!match) return text
  return match[2] === undefined ? match[1]! : `${match[1]}-${match[2]}`
}

/** Every measurement in the other unit (inches to the nearest half, centimeters whole). Sizes are kept. */
export function convertRows(rows: readonly SizeRow[], from: SizeUnit, to: SizeUnit): SizeRow[] {
  return rows.map((row) => ({ size: row.size, values: row.values.map((value) => convertMeasurement(value, from, to)) }))
}

/** True when at least one cell holds a number, so switching the unit changes what is written. */
export function hasMeasurements(rows: readonly SizeRow[]): boolean {
  return rows.some((row) => row.values.some((value) => /\d/.test(value)))
}

// ── Grid edits ───────────────────────────────────────────────────────────────
// Each returns new arrays; a row always has one value per measurement.

/** The list with the item at `from` moved to `to`. Unchanged when either is out of range. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

/** The list without the item at `index`. */
export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index)
}

/** The rows with a new size at the end, its measurements empty. */
export function addSize(rows: readonly SizeRow[], columnCount: number, size = nextSizeName(rows)): SizeRow[] {
  return [...rows.map(copyRow), { size, values: Array.from({ length: columnCount }, () => '') }]
}

/** A new measurement column at the end: every row gets an empty value for it. */
export function addMeasurement(columns: readonly string[], rows: readonly SizeRow[], name = ''): { columns: string[]; rows: SizeRow[] } {
  return { columns: [...columns, name], rows: rows.map((row) => ({ size: row.size, values: [...row.values, ''] })) }
}

/** The column at `index` gone, from the header and from every row. */
export function removeMeasurement(columns: readonly string[], rows: readonly SizeRow[], index: number): { columns: string[]; rows: SizeRow[] } {
  return { columns: removeItem(columns, index), rows: rows.map((row) => ({ size: row.size, values: removeItem(row.values, index) })) }
}

/** The column at `from` moved to `to`, in the header and in every row. */
export function moveMeasurement(columns: readonly string[], rows: readonly SizeRow[], from: number, to: number): { columns: string[]; rows: SizeRow[] } {
  return { columns: moveItem(columns, from, to), rows: rows.map((row) => ({ size: row.size, values: moveItem(row.values, from, to) })) }
}

const copyRow = (row: SizeRow): SizeRow => ({ size: row.size, values: [...row.values] })

const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] as const

/**
 * The size after the last row's, so Add size fills it in: XS, S, M, L, XL, XXL,
 * 3XL; or the next number in steps of the last two (28, 30 → 32). '' when there is
 * no pattern to follow, or the next one is already in the chart.
 */
export function nextSizeName(rows: readonly SizeRow[]): string {
  const sizes = rows.map((row) => row.size.trim())
  const last = sizes[sizes.length - 1]?.toUpperCase()
  if (!last) return ''
  let next = ''
  const letter = LETTER_SIZES.indexOf(last as (typeof LETTER_SIZES)[number])
  if (letter >= 0) next = LETTER_SIZES[letter + 1] ?? ''
  else if (/^\d+$/.test(last)) {
    const before = Number(sizes[sizes.length - 2])
    const step = Number.isInteger(before) && before < Number(last) ? Number(last) - before : 1
    next = String(Number(last) + step)
  }
  const taken = new Set(sizes.map((size) => size.toLowerCase()))
  return next && !taken.has(next.toLowerCase()) ? next : ''
}

// ── Reading a chart ──────────────────────────────────────────────────────────

/** "XS–XL", "28–36", "M", or '' for a chart without sizes. */
export function sizeRange(rows: readonly SizeRow[]): string {
  const sizes = rows.map((row) => row.size.trim()).filter(Boolean)
  if (sizes.length <= 1) return sizes[0] ?? ''
  return `${sizes[0]}–${sizes[sizes.length - 1]}`
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface OptionedProduct {
  detail?: { options?: readonly { name: string; values: readonly string[] }[] }
}

/** The sizes a product sells: the values of its option named Size. */
export function sizesOf(product: OptionedProduct): string[] {
  const option = product.detail?.options?.find((o) => o.name.trim().toLowerCase() === 'size')
  return option ? [...option.values] : []
}

/** The sizes in `sizes` that the chart has no row for (case does not matter), in their order. */
export function missingSizes(rows: readonly SizeRow[], sizes: readonly string[]): string[] {
  const listed = new Set(rows.map((row) => row.size.trim().toLowerCase()))
  return sizes.filter((size) => !listed.has(size.trim().toLowerCase()))
}

// ── Saving ───────────────────────────────────────────────────────────────────

/** Where a problem is, so the form can mark the field and move focus to it. */
export type SizeChartIssueTarget =
  | { kind: 'name' }
  | { kind: 'size'; row: number }
  | { kind: 'measurement'; column: number }
  | { kind: 'cell'; row: number; column: number }
  | { kind: 'sizes' }
  | { kind: 'measurements' }

/** What stops a chart being saved, by position. Empty maps and no messages: it can be saved. */
export interface SizeChartIssues {
  name?: string
  /** No sizes at all. */
  sizes?: string
  /** No measurements at all. */
  measurements?: string
  /** By row index. */
  sizeNames: Record<number, string>
  /** By column index. */
  measurementNames: Record<number, string>
  /** By `cellKey(row, column)`. */
  cells: Record<string, string>
}

export const cellKey = (row: number, column: number): string => `${row}:${column}`

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * What has to be fixed before the chart is saved: a name no other chart in the
 * store has, at least one size and one measurement, sizes and measurement names
 * filled in and different from each other, and a number or a range in every cell.
 * `others` are the other charts (the one being edited left out).
 */
export function sizeChartIssues(draft: SizeChartDraft, others: readonly Pick<SizeChart, 'name' | 'channelId'>[] = []): SizeChartIssues {
  const issues: SizeChartIssues = { sizeNames: {}, measurementNames: {}, cells: {} }
  const name = draft.name.trim()
  if (!name) issues.name = 'Enter a name'
  else if (others.some((chart) => chart.channelId === draft.channelId && same(chart.name, name))) issues.name = 'Another chart in this store has this name'

  if (!draft.rows.length) issues.sizes = 'Add at least one size'
  if (!draft.columns.length) issues.measurements = 'Add at least one measurement'

  draft.columns.forEach((column, c) => {
    if (!column.trim()) issues.measurementNames[c] = 'Name the measurement'
    else if (draft.columns.slice(0, c).some((before) => same(before, column))) issues.measurementNames[c] = `${column.trim()} is already a column`
  })
  draft.rows.forEach((row, r) => {
    if (!row.size.trim()) issues.sizeNames[r] = 'Enter a size'
    else if (draft.rows.slice(0, r).some((before) => same(before.size, row.size))) issues.sizeNames[r] = `${row.size.trim()} is already a size`
    draft.columns.forEach((_, c) => {
      const message = measurementError(row.values[c] ?? '')
      if (message) issues.cells[cellKey(r, c)] = message
    })
  })
  return issues
}

/** Each problem once, in the order a person meets them on the form, said in words. */
export function issueList(draft: Pick<SizeChartDraft, 'columns' | 'rows'>, issues: SizeChartIssues): { target: SizeChartIssueTarget; text: string }[] {
  const list: { target: SizeChartIssueTarget; text: string }[] = []
  if (issues.name) list.push({ target: { kind: 'name' }, text: `Name: ${issues.name}` })
  if (issues.sizes) list.push({ target: { kind: 'sizes' }, text: issues.sizes })
  if (issues.measurements) list.push({ target: { kind: 'measurements' }, text: issues.measurements })
  draft.columns.forEach((_, c) => {
    const message = issues.measurementNames[c]
    if (message) list.push({ target: { kind: 'measurement', column: c }, text: `Measurement ${c + 1}: ${message}` })
  })
  draft.rows.forEach((row, r) => {
    const sizeMessage = issues.sizeNames[r]
    if (sizeMessage) list.push({ target: { kind: 'size', row: r }, text: `Size in row ${r + 1}: ${sizeMessage}` })
    draft.columns.forEach((column, c) => {
      const message = issues.cells[cellKey(r, c)]
      if (message) list.push({ target: { kind: 'cell', row: r, column: c }, text: `${cellLabel(column, c, row.size, r)}: ${message}` })
    })
  })
  return list
}

/** How a cell is named to a person: "Chest for size M", falling back to positions while names are blank. */
export function cellLabel(column: string, columnIndex: number, size: string, rowIndex: number): string {
  const measurement = column.trim() || `Measurement ${columnIndex + 1}`
  return size.trim() ? `${measurement} for size ${size.trim()}` : `${measurement} in row ${rowIndex + 1}`
}

/** True when nothing stops the chart being saved. */
export function canSave(issues: SizeChartIssues): boolean {
  return !issues.name && !issues.sizes && !issues.measurements
    && !Object.keys(issues.sizeNames).length && !Object.keys(issues.measurementNames).length && !Object.keys(issues.cells).length
}

/** The chart as it is saved: names and sizes trimmed, ranges written "34-36", blank lines dropped from how to measure. */
export function cleanSizeChart(draft: SizeChartDraft): SizeChartDraft {
  return {
    channelId: draft.channelId,
    name: draft.name.trim(),
    unit: draft.unit,
    columns: draft.columns.map((column) => column.trim()),
    rows: draft.rows.map((row) => ({ size: row.size.trim(), values: row.values.map(normalizeMeasurement) })),
    fitNote: draft.fitNote.trim(),
    howToMeasure: draft.howToMeasure.split('\n').map((line) => line.trim()).filter(Boolean).join('\n'),
  }
}
