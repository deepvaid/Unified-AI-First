/**
 * What a shopper sees of a store's payment setup — the one derivation behind the
 * storefront's product page, cart, footer and checkout. A store offers every
 * provider it has at once: Maropay's ready methods beside the merchant's own
 * PayPal, Stripe, eWay, Afterpay or Zip, and the manual methods paid outside
 * the store. Cards and the wallets that ride on them come from exactly one
 * processor; a method the merchant's own account offers wins over the same
 * method through Maropay. The merchant's order, default, express switch and
 * pay-button words (the binding) apply to the whole list.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { formatMoney, money } from './money.ts'
import type { Money } from './money.ts'
import { PAY_BUTTON_LABELS, defaultCheckoutSettings } from './model.ts'
import type { MaropayAccountState, MaropayProvider, MethodCategory, PayButtonLabel, Payment, PaymentMethodCatalogEntry, ShopperFlow, StoreBinding } from './model.ts'
import { CARD_FAMILY, activeConnections, cardGateway, connectionOfferedMethods, isManualKind, methodFacts, providerLabel, storeProvidersFor } from './providers.ts'
import type { MethodFacts, ProviderConnection, StoreProviderSetup } from './providers.ts'
import { checkoutMethods } from './readiness.ts'

/** Cards are offered to shoppers under the store's checkout brand when Maropay takes them (F2). */
export const MAROPAY_SHOPPER_LABEL = 'Maropay'
export const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex']

/** Methods that can show as one-tap buttons above the checkout form. */
export const EXPRESS_IDS = ['apple_pay', 'google_pay', 'paypal']
/** "4 interest-free payments" — whichever provider offers them. */
export const PAY_IN_4_IDS = ['klarna', 'afterpay_clearpay', 'zip']
const MONTHLY_IDS = ['affirm']

/** Shopper order when the merchant hasn't arranged a method: cards lead, manual methods close. */
const CATEGORY_RANK: Record<MethodCategory, number> = { cards: 0, wallets: 1, bnpl: 2, local: 3, manual: 4 }

export interface ShopperMethod {
  /** Unique within an offer (one provider per method id), so it stays the radio value and the session's method. */
  id: string
  providerId: MaropayProvider
  providerLabel: string
  /** As the shopper reads it: Maropay's cards are "Maropay", a gateway's are "Credit or debit card", a manual method is its display name. */
  label: string
  caption: string
  category: MethodCategory
  /** Approved on the provider's own page (PayPal, buy now pay later). */
  redirects: boolean
  /** Confirmed by the bank days later. */
  delayed: boolean
  /** Manual methods: the merchant's checkout description, shown under the selected option. */
  description: string | null
  /** Manual methods: the merchant's payment instructions, shown once the order is placed. */
  instructions: string | null
}

export type ShopperMethodBase = Omit<ShopperMethod, 'caption'>

export interface StorefrontOffer {
  /** Maropay takes (some of) this store's payments right now. */
  live: boolean
  /** Who takes cards at this checkout, as the trust line names them; null when nobody offers cards. */
  providerLabel: string | null
  cardsVia: MaropayProvider | null
  /** Every provider with a method in the offer, in first-appearance order. */
  providers: Array<{ id: MaropayProvider; label: string }>
  /** One list across providers, in the merchant's order. */
  methods: ShopperMethod[]
  defaultMethodId: string | null
  /** One-tap buttons above the form, when the merchant shows them. */
  express: ShopperMethod[]
  /** "4 interest-free payments of $25.00 with Afterpay or Zip" — no line when `labels` is empty. */
  payIn4: { labels: string[]; amount: Money }
  /** "From $8.34/mo with Affirm". */
  monthly: { labels: string[]; amount: Money }
  /** Marks for "We accept" and the footer. */
  acceptedMarks: string[]
  payButton: PayButtonLabel
}

export interface StorefrontOfferOptions {
  /**
   * Offer the store's Maropay setup as if it were live — for the admin's "What shoppers see" preview
   * of a store that isn't live yet. `live` still tells the truth.
   */
  asIfLive?: boolean
  /** With `asIfLive`: who takes cards in the preview — Maropay (the Activate dialog's default) or the store's existing gateway. */
  cardsVia?: 'maropay' | 'existing'
}

function fraction(amount: Money, parts: number): Money {
  return money(Math.ceil(amount.amount / parts), amount.currency)
}

function bindingOf(state: MaropayAccountState, channelId: string): StoreBinding | null {
  return state.bindings.find((b) => b.channelId === channelId) ?? null
}

/**
 * Who takes cards: the store's pointer when it can, else Maropay when it is on with cards,
 * else the merchant's own gateway. A preview overrides the pointer with the dialog's choice.
 */
function cardProcessorFor(setup: StoreProviderSetup, maropayCards: boolean, preview: 'maropay' | 'existing' | null): MaropayProvider | null {
  const gateway = cardGateway(setup)?.kind ?? null
  const wanted = preview ? (preview === 'existing' ? gateway : 'maropay') : setup.cardProcessor
  if (wanted === 'maropay') return maropayCards ? 'maropay' : gateway
  // cardGateway already prefers the pointer when it names an active connection that offers cards.
  if (wanted !== null && wanted === gateway) return gateway
  return maropayCards ? 'maropay' : gateway
}

function shopperMethod(facts: MethodFacts, providerId: MaropayProvider, connection: ProviderConnection | null): ShopperMethodBase {
  const manual = connection?.manual ?? null
  return {
    id: facts.id,
    providerId,
    providerLabel: providerLabel(providerId),
    label: facts.id === 'card' ? (providerId === 'maropay' ? MAROPAY_SHOPPER_LABEL : 'Credit or debit card') : manual ? manual.displayName : facts.label,
    category: facts.category,
    redirects: facts.redirects,
    delayed: facts.delayed,
    description: manual?.checkoutDescription ?? null,
    instructions: manual?.paymentInstructions ?? null,
  }
}

/**
 * The amount-free list: which methods this store offers, through which provider, in shopper
 * order. The adapter resolves a checkout's provider from it and checkout options are validated
 * against it, so the shopper, the merchant's preview and the "server" never disagree.
 */
export function resolveShopperMethods(state: MaropayAccountState, channelId: string, options: StorefrontOfferOptions = {}): ShopperMethodBase[] {
  const binding = bindingOf(state, channelId)
  const setup = storeProvidersFor(state, channelId)
  const live = binding?.activation === 'live'
  const maropayOn = live || (!!options.asIfLive && !!binding)
  const preview = !live && options.asIfLive && binding ? options.cardsVia ?? 'maropay' : null
  const maropayReady = maropayOn && binding ? checkoutMethods(state, binding) : []
  const processor = cardProcessorFor(setup, maropayReady.some((m) => m.id === 'card'), preview)
  const view = { cardProcessor: processor }
  const candidates: ShopperMethodBase[] = []
  // The merchant's own providers first: they win a method they share with Maropay.
  for (const connection of activeConnections(setup)) {
    for (const method of connectionOfferedMethods(connection, view)) {
      const facts = methodFacts(state, method.methodId)
      if (!facts || candidates.some((c) => c.id === method.methodId)) continue
      candidates.push(shopperMethod(facts, connection.kind, connection))
    }
  }
  if (binding && maropayOn) {
    for (const m of maropayReady) {
      if (CARD_FAMILY.includes(m.id) && processor !== 'maropay') continue
      if (candidates.some((c) => c.id === m.id)) continue
      candidates.push(shopperMethod(m, 'maropay', null))
    }
  }
  const order = binding?.methodOrder ?? []
  const catalogueIndex = (id: string) => {
    const i = state.methods.findIndex((m) => m.id === id)
    return i === -1 ? state.methods.length : i
  }
  const rank = (m: ShopperMethodBase) => (order.includes(m.id) ? order.indexOf(m.id) : order.length + CATEGORY_RANK[m.category] * 100 + catalogueIndex(m.id))
  return candidates.sort((a, b) => rank(a) - rank(b))
}

function caption(m: ShopperMethodBase, amount: Money): string {
  if (m.category === 'manual') return m.description ?? 'Paid outside the store'
  switch (m.id) {
    case 'card': return m.providerId === 'maropay' ? 'Credit or debit card' : 'Enter your card details'
    case 'apple_pay': return 'Pay with Face ID or Touch ID'
    case 'google_pay': return 'Pay with a card saved to your Google account'
    case 'paypal': return 'Log in to PayPal to pay'
  }
  if (PAY_IN_4_IDS.includes(m.id)) return `4 interest-free payments of ${formatMoney(fraction(amount, 4))}`
  if (MONTHLY_IDS.includes(m.id)) return `Monthly payments from ${formatMoney(fraction(amount, 12))}/mo`
  return m.delayed ? 'Pay from your bank account. The bank confirms in a few business days.' : 'Pay from your bank account'
}

/** Maropay's ready methods as the merchant arranged them: the saved order first, then the rest in catalogue order. */
export function orderedCheckoutMethods(state: MaropayAccountState, binding: StoreBinding): PaymentMethodCatalogEntry[] {
  const order = binding.methodOrder
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return [...checkoutMethods(state, binding)].sort((a, b) => rank(a.id) - rank(b.id))
}

/** `amount` drives the instalment figures: the product price on a product page, the cart total at checkout. */
export function storefrontOffer(state: MaropayAccountState, channelId: string, amount: Money, options: StorefrontOfferOptions = {}): StorefrontOffer {
  const binding = bindingOf(state, channelId)
  const methods = resolveShopperMethods(state, channelId, options).map((m) => ({ ...m, caption: caption(m, amount) }))
  const cardsVia = methods.find((m) => m.id === 'card')?.providerId ?? null
  const checkout = binding?.checkout ?? defaultCheckoutSettings()
  const preferred = binding?.defaultMethodId ?? null
  const labelsOf = (ids: string[]) => methods.filter((m) => ids.includes(m.id)).map((m) => m.label)
  const providers: StorefrontOffer['providers'] = []
  for (const m of methods) if (!providers.some((p) => p.id === m.providerId)) providers.push({ id: m.providerId, label: m.providerLabel })
  return {
    live: binding?.activation === 'live',
    providerLabel: cardsVia ? providerLabel(cardsVia) : null,
    cardsVia,
    providers,
    methods,
    defaultMethodId: methods.some((m) => m.id === preferred) ? preferred : methods[0]?.id ?? null,
    express: checkout.expressWallets ? methods.filter((m) => EXPRESS_IDS.includes(m.id)) : [],
    payIn4: { labels: labelsOf(PAY_IN_4_IDS), amount: fraction(amount, 4) },
    monthly: { labels: labelsOf(MONTHLY_IDS), amount: fraction(amount, 12) },
    acceptedMarks: [...new Set(methods.flatMap((m) =>
      m.id === 'card'
        ? (m.providerId === 'maropay' ? [MAROPAY_SHOPPER_LABEL, ...CARD_BRANDS] : CARD_BRANDS)
        : [isManualKind(m.providerId) ? providerLabel(m.providerId) : m.label]))],
    payButton: checkout.payButtonLabel,
  }
}

/** The pay button's words for the chosen method: redirects say where the shopper goes next; a manual method only places the order. */
export function payButtonText(method: Pick<ShopperMethod, 'id' | 'label' | 'redirects' | 'category'> | null, label: PayButtonLabel, amount: Money): string {
  if (method?.id === 'paypal') return 'Pay with PayPal'
  if (method?.redirects) return `Continue to ${method.label}`
  if (method?.category === 'manual') return 'Place order'
  return PAY_BUTTON_LABELS[label].replace('{amount}', formatMoney(amount))
}

/** "Paid with" on the confirmation: Maropay's cards carry the brand (F2); everything else is just the method. */
export function paidWithText(p: Pick<Payment, 'provider' | 'methodId' | 'methodLabel' | 'status'>): string {
  if (isManualKind(p.provider)) return p.status === 'processing' ? `${p.methodLabel} — awaiting payment` : p.methodLabel
  if (p.methodId === 'card' && p.provider === 'maropay') return `${MAROPAY_SHOPPER_LABEL} · ${p.methodLabel}`
  return p.methodLabel
}

// ── Test cards ────────────────────────────────────────────────────────────

/** Card numbers that pick the outcome in this prototype, on any card processor; any other valid number pays. */
export const TEST_CARDS: ReadonlyArray<{ number: string; flow: ShopperFlow; label: string }> = [
  { number: '4242 4242 4242 4242', flow: 'success', label: 'Pays straight away' },
  { number: '4000 0025 0000 3155', flow: 'auth_required', label: 'The bank asks the shopper to confirm' },
  { number: '4000 0000 0000 0002', flow: 'declined', label: 'The bank declines it' },
]

/** The checkout flow a payment runs: manual methods place the order, wallets pay, redirects leave for the provider, bank debits confirm later, cards follow the test number. */
export function flowForMethod(method: Pick<ShopperMethod, 'category' | 'redirects' | 'delayed'>, cardNumber = ''): ShopperFlow {
  if (method.category === 'manual') return 'manual'
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
