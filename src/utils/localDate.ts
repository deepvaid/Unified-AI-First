/**
 * Local calendar date key ("2026-09-29"). The dashboards bucket days in local time
 * (`startOfDay`/`endOfDay` in useWidgetData), so seeding with `toISOString()` — which is
 * UTC — left today's bucket empty for anyone ahead of UTC.
 */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Inverse of `localDateKey`. `new Date('2026-09-29')` parses a date-only string as UTC
 * midnight, which is the PREVIOUS evening anywhere west of UTC — every order landed a day
 * early for US merchants. A date-only key is local midnight; a full timestamp passes through.
 */
export function parseLocalDateKey(value?: string | null): Date {
  if (!value) return new Date(Number.NaN)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
}
