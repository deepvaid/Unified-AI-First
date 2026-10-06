/**
 * Payment-method marks — the brand tile shown beside a method wherever it's
 * listed (rates, store methods, transactions, checkout). Each mark is a brand
 * colour (tokens `color.methodMark.<id>`) with a glyph or initials standing in
 * for the brand's artwork, which the prototype doesn't carry.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */

export type MethodMarkId =
  | 'maropay' | 'card' | 'visa' | 'mastercard' | 'amex'
  | 'applePay' | 'googlePay' | 'paypal'
  | 'klarna' | 'afterpay' | 'affirm'
  | 'ach' | 'ideal' | 'sepa'

export interface MethodMarkSpec {
  id: MethodMarkId
  /** The accessible name. */
  name: string
  /** A Lucide icon where the brand has no wordmark to abbreviate. */
  glyph: string | null
  initials: string | null
  /** Light tiles get a hairline edge so they keep their shape on a white page. */
  tone: 'light' | 'dark'
}

function spec(id: MethodMarkId, name: string, look: { glyph?: string; initials?: string }, tone: 'light' | 'dark' = 'dark'): MethodMarkSpec {
  return { id, name, glyph: look.glyph ?? null, initials: look.initials ?? null, tone }
}

export const METHOD_MARKS: Readonly<Record<MethodMarkId, MethodMarkSpec>> = {
  maropay: spec('maropay', 'Maropay', { glyph: 'wallet' }),
  card: spec('card', 'Card', { glyph: 'credit-card' }),
  visa: spec('visa', 'Visa', { initials: 'VISA' }),
  mastercard: spec('mastercard', 'Mastercard', { initials: 'MC' }),
  amex: spec('amex', 'American Express', { initials: 'AMEX' }),
  applePay: spec('applePay', 'Apple Pay', { glyph: 'apple' }),
  googlePay: spec('googlePay', 'Google Pay', { initials: 'G Pay' }, 'light'),
  paypal: spec('paypal', 'PayPal', { initials: 'PP' }),
  klarna: spec('klarna', 'Klarna', { initials: 'K.' }, 'light'),
  afterpay: spec('afterpay', 'Afterpay', { initials: 'AP' }, 'light'),
  affirm: spec('affirm', 'Affirm', { initials: 'aff' }),
  ach: spec('ach', 'ACH Direct Debit', { glyph: 'landmark' }),
  ideal: spec('ideal', 'iDEAL', { initials: 'iD' }),
  sepa: spec('sepa', 'SEPA Direct Debit', { glyph: 'landmark' }),
}

export const METHOD_MARK_IDS = Object.keys(METHOD_MARKS) as MethodMarkId[]

/** The brands a Maropay card form accepts. */
export const CARD_BRAND_MARKS: readonly MethodMarkId[] = ['visa', 'mastercard', 'amex']

const BY_METHOD: Record<string, MethodMarkId> = {
  apple_pay: 'applePay',
  google_pay: 'googlePay',
  paypal: 'paypal',
  // A previous provider's PayPal payments (scenarios) — the same brand.
  paypal_wallet: 'paypal',
  klarna: 'klarna',
  afterpay_clearpay: 'afterpay',
  affirm: 'affirm',
  us_bank_account: 'ach',
  ideal: 'ideal',
  sepa_debit: 'sepa',
}

const CARD_BRAND_PREFIXES: Array<[RegExp, MethodMarkId]> = [
  [/^visa\b/i, 'visa'],
  [/^mastercard\b/i, 'mastercard'],
  [/^(amex|american express)\b/i, 'amex'],
]

/** Wallets a previous provider names only by label ("PayPal Checkout"). */
const WALLET_PREFIXES: Array<[RegExp, MethodMarkId]> = [
  [/^paypal\b/i, 'paypal'],
]

function prefixMark(prefixes: Array<[RegExp, MethodMarkId]>, label: string | null | undefined): MethodMarkId | null {
  const text = label?.trim() ?? ''
  return prefixes.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

function brandOf(label: string | null | undefined): MethodMarkId | null {
  return prefixMark(CARD_BRAND_PREFIXES, label)
}

/**
 * The mark for a catalogue or payment method id. A card payment's label names
 * its brand ("Visa •••• 4242"); anything unknown is a generic card.
 */
export function markFor(methodId: string, label?: string | null): MethodMarkId {
  if (methodId === 'card') return brandOf(label) ?? 'card'
  return BY_METHOD[methodId] ?? brandOf(label) ?? prefixMark(WALLET_PREFIXES, label) ?? 'card'
}

/** The text beside a mark in a cell: the card's last digits when the mark already names the brand, else the label. */
export function methodCaption(methodId: string, label: string): string {
  const brand = markFor(methodId, label)
  if (CARD_BRAND_MARKS.includes(brand)) {
    const digits = /•+\s*\d{2,4}\s*$/.exec(label)?.[0]
    if (digits) return digits.trim()
  }
  return label
}
