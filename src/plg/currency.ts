/**
 * Display currencies for the PLG plans and checkout pages — pure TS so
 * node:test can import it (see tests/plg/).
 *
 * The catalog, planPrice and the promo maths all stay in USD; conversion
 * happens once, at display, so totals and savings always agree.
 *
 * The rates are ILLUSTRATIVE placeholders. Production has a Chargebee price
 * point per plan per currency, not a conversion.
 */

export interface PlgCurrency {
  code: string
  label: string
  /** Units of this currency per 1 USD. */
  rate: number
}

export const PLG_CURRENCIES: readonly PlgCurrency[] = [
  { code: 'USD', label: 'USD', rate: 1 },
  { code: 'AUD', label: 'AUD', rate: 1.5 },
  { code: 'CAD', label: 'CAD', rate: 1.35 },
  { code: 'GBP', label: 'GBP', rate: 0.8 },
  { code: 'EUR', label: 'EUR', rate: 0.9 },
]

/** The currency for a code, falling back to USD for anything unknown. */
export function resolveCurrency(code: string | null | undefined): PlgCurrency {
  return PLG_CURRENCIES.find(c => c.code === code?.toUpperCase()) ?? PLG_CURRENCIES[0]!
}

export function convert(amountUsd: number, code: string | null | undefined): number {
  return Math.round(amountUsd * resolveCurrency(code).rate * 100) / 100
}

export function formatMoney(amountUsd: number, code: string | null | undefined): string {
  const currency = resolveCurrency(code)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
  }).format(convert(amountUsd, currency.code))
}
