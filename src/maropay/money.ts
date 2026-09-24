/**
 * Maropay money: integer minor units plus an ISO currency code.
 *
 * Every Maropay amount is a whole number of the currency's smallest unit
 * (cents for USD, yen for JPY, fils for KWD), so arithmetic never touches
 * floats. Decimal strings only appear at the edges: parsing seed/order data
 * and user input, and formatting for display.
 *
 * Pure module with no imports. Everything under src/maropay/ and
 * src/services/maropay/ imports siblings by relative path with the `.ts`
 * extension, so `node --test` can load it without the Vite `@/` alias.
 */

export interface Money {
  /** Integer amount in the currency's minor unit. */
  amount: number
  currency: string
}

/** Minor-unit exponents that differ from the default of 2, plus the common 2s for clarity. */
export const CURRENCY_EXPONENTS: Readonly<Record<string, number>> = {
  USD: 2, EUR: 2, GBP: 2, CAD: 2, AUD: 2, NZD: 2,
  JPY: 0, KRW: 0,
  KWD: 3, BHD: 3,
}

export function exponentOf(currency: string): number {
  return CURRENCY_EXPONENTS[currency.toUpperCase()] ?? 2
}

export function money(amount: number, currency: string): Money {
  if (!Number.isInteger(amount)) throw new Error(`money: ${amount} is not a whole number of minor units`)
  return { amount: amount === 0 ? 0 : amount, currency }
}

export function zero(currency: string): Money {
  return { amount: 0, currency }
}

/**
 * Parses a decimal string ("129.00", "-12.5", "1,290") into minor units without
 * float arithmetic. Extra fraction digits round half away from zero. Returns
 * null for anything that is not a plain decimal number.
 */
export function parseDecimal(value: string | number, currency: string): Money | null {
  const exp = exponentOf(currency)
  const text = typeof value === 'number' ? value.toFixed(exp) : value.trim().replace(/,/g, '')
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(text)
  if (!match) return null
  const whole = match[2] ?? ''
  const fraction = match[3] ?? ''
  if (whole === '' && fraction === '') return null
  let minor = Number(whole || '0') * 10 ** exp + (exp > 0 ? Number(fraction.slice(0, exp).padEnd(exp, '0')) : 0)
  if (fraction.length > exp && Number(fraction[exp]) >= 5) minor += 1
  const negative = match[1] === '-' && minor !== 0
  return { amount: negative ? -minor : minor, currency }
}

/** Like parseDecimal, but for trusted data (seed strings); throws instead of returning null. */
export function fromDecimal(value: string | number, currency: string): Money {
  const parsed = parseDecimal(value, currency)
  if (!parsed) throw new Error(`money: cannot parse "${value}" as ${currency}`)
  return parsed
}

/** Minor units back to a plain decimal string: 12900 USD → "129.00", 1290 JPY → "1290". */
export function toDecimal(m: Money): string {
  const exp = exponentOf(m.currency)
  const sign = m.amount < 0 ? '-' : ''
  const digits = String(Math.abs(m.amount))
  if (exp === 0) return `${sign}${digits}`
  const padded = digits.padStart(exp + 1, '0')
  return `${sign}${padded.slice(0, -exp)}.${padded.slice(-exp)}`
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error(`money: currency mismatch ${a.currency}/${b.currency}`)
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amount + b.amount, a.currency)
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b)
  return money(a.amount - b.amount, a.currency)
}

export function negate(m: Money): Money {
  return money(-m.amount, m.currency)
}

/** Sums same-currency amounts; an empty list is zero in `currency`. */
export function sum(items: Money[], currency: string): Money {
  return items.reduce((total, item) => add(total, item), zero(currency))
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b)
  return a.amount === b.amount ? 0 : a.amount < b.amount ? -1 : 1
}

export function isZero(m: Money): boolean {
  return m.amount === 0
}

export function isPositive(m: Money): boolean {
  return m.amount > 0
}

export function minOf(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b
}

/**
 * A processing rate: a percentage in basis points plus a fixed part. The fixed
 * part is in the charged currency's minor units — rates are illustrative, not
 * a price list.
 */
export interface RateCard {
  percentBps: number
  fixedMinor: number
  label: string
  /** Optional ceiling on the total fee (bank debits). */
  capMinor?: number
}

/** Fee for `base` at `rate`, rounding the percentage half away from zero. */
export function applyRate(base: Money, rate: RateCard): Money {
  const percent = Math.round((Math.abs(base.amount) * rate.percentBps) / 10_000)
  const fee = percent + rate.fixedMinor
  return money(rate.capMinor === undefined ? fee : Math.min(fee, rate.capMinor), base.currency)
}

/** Display string via Intl; negatives render with a leading minus ("-$12.50"). */
export function formatMoney(m: Money, locale = 'en-US'): string {
  const exp = exponentOf(m.currency)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  }).format(m.amount / 10 ** exp)
}

export interface MoneyDisplayParts {
  negative: boolean
  symbol: string
  integer: string
  /** Fraction digits without the separator; empty for zero-exponent currencies. */
  fraction: string
  formatted: string
}

/** Symbol/integer/fraction split for `.mp-money` markup. The sign is reported, never glued to the integer. */
export function moneyParts(m: Money, locale = 'en-US'): MoneyDisplayParts {
  const exp = exponentOf(m.currency)
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  })
  const value = m.amount / 10 ** exp
  let symbol = ''
  let integer = ''
  let fraction = ''
  for (const part of formatter.formatToParts(Math.abs(value))) {
    if (part.type === 'currency') symbol += part.value
    else if (part.type === 'fraction') fraction += part.value
    else if (part.type === 'integer' || part.type === 'group') integer += part.value
  }
  return { negative: m.amount < 0, symbol, integer, fraction, formatted: formatter.format(value) }
}
