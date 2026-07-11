/**
 * Client-side CSV export for list/report views (legacy-parity "Export CSV").
 * Serializes rows via column definitions and triggers a browser download.
 */

export interface CsvColumn<T> {
  /** Column header label. */
  title: string
  /** Row accessor — key or getter. */
  value: keyof T | ((row: T) => string | number | null | undefined)
}

// Quote when the value contains a delimiter, quote, or newline.
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((col) => escapeCell(col.title)).join(',')
  const body = rows
    .map((row) => columns.map((col) => escapeCell(typeof col.value === 'function' ? col.value(row) : (row[col.value] as string | number | null | undefined))).join(','))
    .join('\n')
  return `${header}\n${body}`
}

/** Download `rows` as `<filename>.csv` (filename without extension). */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
