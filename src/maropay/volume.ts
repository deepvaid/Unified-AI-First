/**
 * Gross volume over a window of days — the Overview chart (Stripe home's
 * "Gross volume"). Gross means every capture Maropay made, by the day it was
 * captured: refunds, fees and disputes are net-volume concerns, so a refunded
 * payment still counts. Payments that were never captured (processing,
 * authorised, failed, voided) and payments an earlier provider took don't.
 * Currencies are never added together.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { add, money, zero } from './money.ts'
import type { Money } from './money.ts'
import { localDateKey } from './model.ts'
import type { Payment } from './model.ts'

export interface VolumeDay {
  /** Local calendar day, YYYY-MM-DD. */
  day: string
  amount: Money
  count: number
}

export interface VolumeSeries {
  currency: string
  /** Oldest first; the last day is today. Quiet days are zero. */
  days: VolumeDay[]
  total: Money
  /** Captures in the window. */
  count: number
}

/** The window's day keys, oldest first, by calendar arithmetic so a DST change never skips or repeats a day. */
function dayKeys(now: number, days: number): string[] {
  const today = new Date(now)
  return Array.from({ length: days }, (_, i) => localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i)).getTime()))
}

export function volumeSeries(payments: readonly Payment[], now: number, days: number, currency: string): VolumeSeries {
  const keys = dayKeys(now, days)
  const byDay = new Map(keys.map((day) => [day, { day, amount: zero(currency), count: 0 }]))
  for (const payment of payments) {
    if (payment.provider !== 'maropay') continue
    for (const capture of payment.captures) {
      if (capture.amount.currency !== currency) continue
      const at = Date.parse(capture.at)
      if (at > now) continue
      const bucket = byDay.get(localDateKey(at))
      if (!bucket) continue
      bucket.amount = add(bucket.amount, capture.amount)
      bucket.count += 1
    }
  }
  const series = keys.map((day) => byDay.get(day)!)
  return {
    currency,
    days: series,
    total: series.reduce((total, d) => add(total, d.amount), money(0, currency)),
    count: series.reduce((n, d) => n + d.count, 0),
  }
}

export interface VolumeDelta {
  current: Money
  /** The same number of days, ending the day before the window starts. */
  previous: Money
  /** Percent change, one decimal; null when the previous window took nothing (no base to compare). */
  pct: number | null
}

/** This window against the one before it — the Overview's "↗ 12.4%". */
export function volumeDelta(payments: readonly Payment[], now: number, days: number, currency: string): VolumeDelta {
  const today = new Date(now)
  // The previous window ends at the last instant of the day before this window's first day.
  const previousEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1).getTime() - 1
  const current = volumeSeries(payments, now, days, currency).total
  const previous = volumeSeries(payments, previousEnd, days, currency).total
  const pct = previous.amount > 0 ? Math.round(((current.amount - previous.amount) / previous.amount) * 1000) / 10 : null
  return { current, previous, pct }
}

/** "Sep 6" — a chart label for a day key. */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
