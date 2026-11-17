import { exponentOf, formatMoney } from '../maropay/money.ts'
import type { Money } from '../maropay/money.ts'

/**
 * A price as a store's shoppers read it.
 *
 * Without a store locale this is `formatMoney` unchanged ("$94.19"). With one,
 * the amount follows that locale and whole amounts drop their decimals, as
 * Swedish stores write them: "399 kr", but "223,20 kr".
 */
export function formatStorePrice(m: Money, locale?: string): string {
  if (!locale) return formatMoney(m)
  const exp = exponentOf(m.currency)
  const whole = m.amount % 10 ** exp === 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: whole ? 0 : exp,
    maximumFractionDigits: whole ? 0 : exp,
  }).format(m.amount / 10 ** exp)
}

/**
 * Where a price field shows its currency: before the amount ("$") or after it
 * ("kr"), as the store's locale writes it. Without a store it is the dollar sign.
 */
export function currencyAffix(currency = 'USD', locale = 'en-US'): { prefix?: string; suffix?: string } {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(1)
  const at = parts.findIndex((part) => part.type === 'currency')
  const symbol = parts[at]?.value ?? currency
  return at < parts.findIndex((part) => part.type === 'integer') ? { prefix: symbol } : { suffix: symbol }
}
