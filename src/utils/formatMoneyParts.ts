export interface MoneyParts {
  integer: string
  cents: string
  symbol: string
  formatted: string
}

/** Splits a currency value into symbol/integer/cents parts (for `.mp-money` + `.mp-money__cents` markup). */
export const formatMoneyParts = (value: number, currency = 'USD', locale = 'en-US'): MoneyParts => {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const parts = formatter.formatToParts(value)

  let symbol = ''
  let integer = ''
  let cents = ''

  for (const part of parts) {
    if (part.type === 'currency') symbol += part.value
    else if (part.type === 'fraction') cents += part.value
    else if (part.type !== 'literal' && part.type !== 'decimal') integer += part.value
  }

  return { integer, cents, symbol, formatted: formatter.format(value) }
}
