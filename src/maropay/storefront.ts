/**
 * What a shopper sees of a store's payment setup — the one derivation behind the
 * storefront's product page, cart, footer and checkout. The merchant's choices
 * (methods, their order, the default, express buttons, the pay-button label)
 * come from the store's binding. Only methods that are on for the store *and*
 * approved on the account reach a shopper (`checkoutMethods`); the saved order
 * and default are preferences, never trusted on their own.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { formatMoney, money } from './money.ts'
import type { Money } from './money.ts'
import { PAY_BUTTON_LABELS, PROVIDER_LABELS } from './model.ts'
import type { MaropayAccountState, MethodCategory, PayButtonLabel, PaymentMethodCatalogEntry, ShopperFlow, StoreBinding } from './model.ts'
import { checkoutMethods } from './readiness.ts'

/** Cards are offered to shoppers under the store's checkout brand. */
export const MAROPAY_SHOPPER_LABEL = 'Maropay'
export const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex']

/** Methods that can show as one-tap buttons above the checkout form. */
export const EXPRESS_IDS = ['apple_pay', 'google_pay', 'paypal']
const PAY_IN_4_IDS = ['klarna', 'afterpay_clearpay']
const MONTHLY_IDS = ['affirm']

export interface ShopperMethod {
  id: string
  /** As the shopper reads it: cards are "Maropay". */
  label: string
  caption: string
  category: MethodCategory
  /** Approved on the provider's own page (PayPal, buy now pay later). */
  redirects: boolean
  /** Confirmed by the bank days later. */
  delayed: boolean
}

export interface StorefrontOffer {
  /** Maropay takes this store's payments. */
  live: boolean
  /** Who takes payments: Maropay when live, otherwise the store's current provider (null = not known). */
  providerLabel: string | null
  /** In the merchant's order. Empty unless live. */
  methods: ShopperMethod[]
  defaultMethodId: string | null
  /** One-tap buttons above the form, when the merchant shows them. */
  express: ShopperMethod[]
  /** "4 interest-free payments of $25.00 with Klarna or Afterpay" — no line when `labels` is empty. */
  payIn4: { labels: string[]; amount: Money }
  /** "From $8.34/mo with Affirm". */
  monthly: { labels: string[]; amount: Money }
  /** Marks for "We accept" and the footer. */
  acceptedMarks: string[]
  payButton: PayButtonLabel
}

function fraction(amount: Money, parts: number): Money {
  return money(Math.ceil(amount.amount / parts), amount.currency)
}

function caption(m: PaymentMethodCatalogEntry, amount: Money): string {
  switch (m.id) {
    case 'card': return 'Credit or debit card'
    case 'apple_pay': return 'Pay with Face ID or Touch ID'
    case 'google_pay': return 'Pay with a card saved to your Google account'
    case 'paypal': return 'Log in to PayPal to pay'
  }
  if (PAY_IN_4_IDS.includes(m.id)) return `4 interest-free payments of ${formatMoney(fraction(amount, 4))}`
  if (MONTHLY_IDS.includes(m.id)) return `Monthly payments from ${formatMoney(fraction(amount, 12))}/mo`
  return m.delayed ? 'Pay from your bank account. The bank confirms in a few business days.' : 'Pay from your bank account'
}

function shopperMethod(m: PaymentMethodCatalogEntry, amount: Money): ShopperMethod {
  return {
    id: m.id,
    label: m.id === 'card' ? MAROPAY_SHOPPER_LABEL : m.label,
    caption: caption(m, amount),
    category: m.category,
    redirects: m.redirects,
    delayed: m.delayed,
  }
}

/** The store's ready methods as checkout lists them: the merchant's order first, then the rest in catalogue order. */
export function orderedCheckoutMethods(state: MaropayAccountState, binding: StoreBinding): PaymentMethodCatalogEntry[] {
  const order = binding.methodOrder
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return [...checkoutMethods(state, binding)].sort((a, b) => rank(a.id) - rank(b.id))
}

export interface StorefrontOfferOptions {
  /**
   * Offer the store's Maropay setup as if it were live — for the admin's "What shoppers see" preview
   * of a store that isn't live yet. `live` still tells the truth.
   */
  asIfLive?: boolean
}

/** `amount` drives the instalment figures: the product price on a product page, the cart total at checkout. */
export function storefrontOffer(state: MaropayAccountState, binding: StoreBinding | null, amount: Money, options: StorefrontOfferOptions = {}): StorefrontOffer {
  const live = binding?.activation === 'live'
  const offered = live || (!!options.asIfLive && !!binding)
  // Without a Maropay record a store keeps its long-standing Stripe checkout (as the sales channel page says).
  const providerLabel = offered ? 'Maropay' : !binding ? 'Stripe' : binding.previousProvider ? PROVIDER_LABELS[binding.previousProvider.provider] : null
  const methods = offered && binding ? orderedCheckoutMethods(state, binding).map((m) => shopperMethod(m, amount)) : []
  const preferred = binding?.defaultMethodId ?? null
  const labelsOf = (ids: string[]) => methods.filter((m) => ids.includes(m.id)).map((m) => m.label)
  return {
    live,
    providerLabel,
    methods,
    defaultMethodId: methods.some((m) => m.id === preferred) ? preferred : methods[0]?.id ?? null,
    express: binding?.checkout.expressWallets ? methods.filter((m) => EXPRESS_IDS.includes(m.id)) : [],
    payIn4: { labels: labelsOf(PAY_IN_4_IDS), amount: fraction(amount, 4) },
    monthly: { labels: labelsOf(MONTHLY_IDS), amount: fraction(amount, 12) },
    acceptedMarks: methods.flatMap((m) => (m.id === 'card' ? [MAROPAY_SHOPPER_LABEL, ...CARD_BRANDS] : [m.label])),
    payButton: binding?.checkout.payButtonLabel ?? 'pay',
  }
}

/** The pay button's words for the chosen method: redirects say where the shopper goes next. */
export function payButtonText(method: Pick<ShopperMethod, 'id' | 'label' | 'redirects'> | null, label: PayButtonLabel, amount: Money): string {
  if (method?.id === 'paypal') return 'Pay with PayPal'
  if (method?.redirects) return `Continue to ${method.label}`
  return PAY_BUTTON_LABELS[label].replace('{amount}', formatMoney(amount))
}

// ── Test cards ────────────────────────────────────────────────────────────

/** Card numbers that pick the outcome in this prototype; any other valid number pays. */
export const TEST_CARDS: ReadonlyArray<{ number: string; flow: ShopperFlow; label: string }> = [
  { number: '4242 4242 4242 4242', flow: 'success', label: 'Pays straight away' },
  { number: '4000 0025 0000 3155', flow: 'auth_required', label: 'The bank asks the shopper to confirm' },
  { number: '4000 0000 0000 0002', flow: 'declined', label: 'The bank declines it' },
]

/** The checkout flow a payment runs: wallets pay, redirects leave for the provider, bank debits confirm later, cards follow the test number. */
export function flowForMethod(method: Pick<ShopperMethod, 'category' | 'redirects' | 'delayed'>, cardNumber = ''): ShopperFlow {
  if (method.delayed) return 'delayed'
  if (method.redirects) return 'redirect'
  if (method.category !== 'cards') return 'success'
  const digits = cardNumber.replace(/\D/g, '')
  return TEST_CARDS.find((c) => c.number.replace(/\s/g, '') === digits)?.flow ?? 'success'
}

export interface CardInput {
  number: string
  /** MM / YY */
  expiry: string
  cvc: string
}

/** Field messages for the card form; empty when it can be sent. */
export function cardErrors(card: CardInput, now: number): Partial<Record<keyof CardInput, string>> {
  const errors: Partial<Record<keyof CardInput, string>> = {}
  if (!/^\d{13,19}$/.test(card.number.replace(/\s/g, ''))) errors.number = 'Enter the long number on the front of the card.'
  const expiry = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.expiry.trim())
  const month = expiry ? Number(expiry[1]) : 0
  if (!expiry || month < 1 || month > 12) errors.expiry = 'Enter the expiry date as MM / YY.'
  // A card works until the end of its expiry month.
  else if (new Date(2000 + Number(expiry[2]), month, 1).getTime() <= now) errors.expiry = 'This card has expired.'
  if (!/^\d{3,4}$/.test(card.cvc.trim())) errors.cvc = 'Enter the 3 or 4-digit security code.'
  return errors
}
