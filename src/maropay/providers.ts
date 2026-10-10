/**
 * A store's payment providers: Maropay beside the merchant's own PayPal, Stripe,
 * eWay, Afterpay and Zip, and the manual methods (bank deposit, cheque, cash on
 * delivery) that are paid outside the store. One record per store, independent
 * of the Maropay binding — a store that never opened Maropay still has
 * providers. Maropay's own connection *is* the StoreBinding; everything here is
 * the rest.
 *
 * The card-processor pointer is the one piece of coexistence state: whoever it
 * names takes cards and the wallets that ride on them (Apple Pay, Google Pay);
 * every other provider keeps offering what the card processor doesn't.
 *
 * Pure module — relative `.ts` imports only (see money.ts). It imports only
 * types from model.ts, because model.ts imports its tables at runtime.
 */
import type { RateCard } from './money.ts'
import type { CaptureMode, MaropayAccountState, MaropayProvider, MethodCategory } from './model.ts'

export type ProviderKind = MaropayProvider
/** Everything a merchant connects themselves — Maropay's connection is the binding. */
export type OwnProviderKind = Exclude<ProviderKind, 'maropay'>
export type ProviderFamily = 'maropay' | 'gateway' | 'wallet' | 'bnpl' | 'manual'
export type ProviderStatus = 'active' | 'setup_incomplete' | 'inactive'

export interface ProviderMethod {
  /** Maropay's catalogue id where the methods overlap (card, apple_pay, google_pay, paypal, afterpay_clearpay); zip and the manual kinds are their own ids. */
  methodId: string
  /** As the merchant reads it on the provider's row: "Cards via PayPal", "Zip Pay". */
  label: string
  /** null for manual methods — nothing is processed. */
  rate: RateCard | null
}

/** What a manual method says to shoppers (the real product's display name, checkout description and payment instructions). */
export interface ManualMethodSettings {
  displayName: string
  /** Shown under the method when a shopper picks it at checkout. */
  checkoutDescription: string
  /** Shown on the order confirmation, once the order is placed. */
  paymentInstructions: string
}

export interface ProviderConnection {
  kind: OwnProviderKind
  status: ProviderStatus
  methods: ProviderMethod[]
  /** Gateways capture automatically or manually; everything else captures automatically. */
  captureMode: CaptureMode
  /** Saved cards or mandates held by a gateway. `blocking` = they back charges that need a supported migration first. */
  savedCredentials: { count: number; blocking: boolean } | null
  connectedSince: string
  /** Non-null for the manual kinds only. */
  manual: ManualMethodSettings | null
}

/** One store's providers. The card processor is who takes cards and wallets at checkout; null = nobody. */
export interface StoreProviderSetup {
  channelId: string
  connections: ProviderConnection[]
  cardProcessor: ProviderKind | null
  /**
   * The checkout lineup the merchant arranged: providers in the order shoppers see them, Maropay
   * among them once it's live. Absent until they drag something; kinds it doesn't name follow
   * the default rule in `lineupFor`.
   */
  lineup?: ProviderKind[]
}

/** Cards and the wallets that tokenise a card — they always go through the store's card processor. */
export const CARD_FAMILY: readonly string[] = ['card', 'apple_pay', 'google_pay']

interface ProviderSpec {
  label: string
  family: Exclude<ProviderFamily, 'maropay'>
  methods: ProviderMethod[]
  /** The manual kinds' default wording; the merchant edits it. */
  manual: ManualMethodSettings | null
}

function rate(percentBps: number, fixedMinor: number, label: string): RateCard {
  return { percentBps, fixedMinor, label }
}

/** The real product's provider set, with illustrative rates. */
export const PROVIDER_SPECS: Readonly<Record<OwnProviderKind, ProviderSpec>> = {
  stripe: {
    label: 'Stripe', family: 'gateway', manual: null,
    methods: [
      { methodId: 'card', label: 'Cards', rate: rate(290, 30, '2.9% + 30¢') },
      { methodId: 'apple_pay', label: 'Apple Pay', rate: rate(290, 30, '2.9% + 30¢') },
      { methodId: 'google_pay', label: 'Google Pay', rate: rate(290, 30, '2.9% + 30¢') },
    ],
  },
  eway: {
    label: 'eWay', family: 'gateway', manual: null,
    methods: [{ methodId: 'card', label: 'Cards', rate: rate(190, 30, '1.9% + 30¢') }],
  },
  paypal: {
    label: 'PayPal', family: 'wallet', manual: null,
    methods: [
      { methodId: 'paypal', label: 'PayPal Checkout', rate: rate(349, 49, '3.49% + 49¢') },
      { methodId: 'card', label: 'Cards via PayPal', rate: rate(349, 49, '3.49% + 49¢') },
    ],
  },
  afterpay: {
    label: 'Afterpay', family: 'bnpl', manual: null,
    methods: [{ methodId: 'afterpay_clearpay', label: 'Afterpay', rate: rate(600, 30, '6% + 30¢') }],
  },
  zip: {
    label: 'Zip', family: 'bnpl', manual: null,
    methods: [{ methodId: 'zip', label: 'Zip Pay', rate: rate(300, 30, '3% + 30¢') }],
  },
  bank_deposit: {
    label: 'Bank deposit', family: 'manual',
    methods: [{ methodId: 'bank_deposit', label: 'Bank deposit', rate: null }],
    manual: {
      displayName: 'Direct bank transfer',
      checkoutDescription: 'Pay by bank transfer after you order. We ship once the money clears, usually in 1–2 business days.',
      paymentInstructions: 'Transfer the order total to the account in your confirmation email, with your order number as the reference.',
    },
  },
  cheque: {
    label: 'Cheque', family: 'manual',
    methods: [{ methodId: 'cheque', label: 'Cheque', rate: null }],
    manual: {
      displayName: 'Cheque',
      checkoutDescription: 'Post a cheque after you order. We ship once it clears.',
      paymentInstructions: 'Make the cheque payable to the business named on your confirmation email and post it to the address shown there, with your order number on the back.',
    },
  },
  cod: {
    label: 'Cash on delivery', family: 'manual',
    methods: [{ methodId: 'cod', label: 'Cash on delivery', rate: null }],
    manual: {
      displayName: 'Cash on delivery',
      checkoutDescription: 'Pay in cash when your order arrives.',
      paymentInstructions: 'Have the order total ready in cash for the driver.',
    },
  },
}

export const OWN_PROVIDER_KINDS = Object.keys(PROVIDER_SPECS) as OwnProviderKind[]

export function isOwnProviderKind(value: unknown): value is OwnProviderKind {
  return typeof value === 'string' && value in PROVIDER_SPECS
}

export function providerFamily(kind: ProviderKind): ProviderFamily {
  return kind === 'maropay' ? 'maropay' : PROVIDER_SPECS[kind].family
}

export function isManualKind(kind: ProviderKind): boolean {
  return providerFamily(kind) === 'manual'
}

/** Shopper-facing facts for the method ids outside Maropay's catalogue (which stays Maropay's own). */
export const EXTRA_METHOD_FACTS: Readonly<Record<'zip' | 'bank_deposit' | 'cheque' | 'cod', { label: string; category: MethodCategory; redirects: boolean; delayed: boolean }>> = {
  zip: { label: 'Zip', category: 'bnpl', redirects: true, delayed: false },
  bank_deposit: { label: 'Bank deposit', category: 'manual', redirects: false, delayed: false },
  cheque: { label: 'Cheque', category: 'manual', redirects: false, delayed: false },
  cod: { label: 'Cash on delivery', category: 'manual', redirects: false, delayed: false },
}

export interface MethodFacts {
  id: string
  label: string
  category: MethodCategory
  redirects: boolean
  delayed: boolean
}

/** A catalogue entry or an extra method, as the storefront needs to describe it. */
export function methodFacts(state: Pick<MaropayAccountState, 'methods'>, methodId: string): MethodFacts | null {
  const entry = state.methods.find((m) => m.id === methodId)
  if (entry) return { id: entry.id, label: entry.label, category: entry.category, redirects: entry.redirects, delayed: entry.delayed }
  const extra = (EXTRA_METHOD_FACTS as Record<string, (typeof EXTRA_METHOD_FACTS)[keyof typeof EXTRA_METHOD_FACTS]>)[methodId]
  return extra ? { id: methodId, ...extra } : null
}

// ── A store's setup ───────────────────────────────────────────────────────

/** A connection as the spec describes it — the merchant's edits come after. */
export function connectionFor(kind: OwnProviderKind, connectedSince: string, status: ProviderStatus): ProviderConnection {
  const spec = PROVIDER_SPECS[kind]
  return {
    kind,
    status,
    methods: spec.methods.map((m) => ({ ...m, rate: m.rate ? { ...m.rate } : null })),
    captureMode: 'automatic',
    savedCredentials: null,
    connectedSince,
    manual: spec.manual ? { ...spec.manual } : null,
  }
}

/** When the prototype says a store has "long had" a provider. */
export const DEFAULT_PROVIDERS_SINCE = '2024-03-01T00:00:00.000Z'

/** A store that never touched payments keeps its long-standing Stripe checkout (as the sales channel page has always said). */
export function defaultStoreProviders(channelId: string): StoreProviderSetup {
  return { channelId, connections: [connectionFor('stripe', DEFAULT_PROVIDERS_SINCE, 'active')], cardProcessor: 'stripe' }
}

/** The store's providers as saved, or the default. Never writes. */
export function storeProvidersFor(state: Pick<MaropayAccountState, 'storeProviders'>, channelId: string): StoreProviderSetup {
  return state.storeProviders.find((s) => s.channelId === channelId) ?? defaultStoreProviders(channelId)
}

/** For the adapter: the saved record, materialising the default first so a mutation has something to change. */
export function ensureStoreProviders(state: Pick<MaropayAccountState, 'storeProviders'>, channelId: string): StoreProviderSetup {
  const existing = state.storeProviders.find((s) => s.channelId === channelId)
  if (existing) return existing
  const setup = defaultStoreProviders(channelId)
  state.storeProviders.push(setup)
  return setup
}

export function connectionOf(setup: StoreProviderSetup, kind: ProviderKind): ProviderConnection | null {
  return setup.connections.find((c) => c.kind === kind) ?? null
}

export function activeConnections(setup: StoreProviderSetup): ProviderConnection[] {
  return setup.connections.filter((c) => c.status === 'active')
}

/** The merchant's own gateway for cards — the one that holds them, or held them before Maropay took over. */
export function cardGateway(setup: StoreProviderSetup): ProviderConnection | null {
  const active = activeConnections(setup).filter((c) => !isManualKind(c.kind) && c.methods.some((m) => m.methodId === 'card'))
  return active.find((c) => c.kind === setup.cardProcessor) ?? active[0] ?? null
}

/** What a connection puts in front of shoppers: its methods, minus the card family unless it is the card processor. */
export function connectionOfferedMethods(connection: ProviderConnection, setup: Pick<StoreProviderSetup, 'cardProcessor'>): ProviderMethod[] {
  if (connection.status !== 'active') return []
  return connection.methods.filter((m) => !CARD_FAMILY.includes(m.methodId) || connection.kind === setup.cardProcessor)
}

/** Every method id the store's own active connections can offer, whoever takes cards — what the merchant may arrange. */
export function ownMethodIds(setup: StoreProviderSetup): string[] {
  return [...new Set(activeConnections(setup).flatMap((c) => c.methods.map((m) => m.methodId)))]
}

/**
 * The checkout lineup: every provider on the store, in shopper order. The saved order leads
 * (minus anything since removed); a provider it doesn't name slots in by the default rule —
 * whoever takes cards goes first, other online providers follow the ones already there, manual
 * methods close. `maropay` joins the list only while the caller says it is on (live, or a preview).
 */
export function lineupFor(setup: StoreProviderSetup, options: { maropay: boolean; processor?: ProviderKind | null }): ProviderKind[] {
  const processor = options.processor === undefined ? setup.cardProcessor : options.processor
  const present: ProviderKind[] = [...setup.connections.map((c) => c.kind), ...(options.maropay ? (['maropay'] as const) : [])]
  const ordered = (setup.lineup ?? []).filter((kind, i, all) => present.includes(kind) && all.indexOf(kind) === i)
  for (const kind of present) {
    if (ordered.includes(kind)) continue
    if (kind === processor) ordered.unshift(kind)
    else if (isManualKind(kind)) ordered.push(kind)
    else {
      let last = -1
      ordered.forEach((k, i) => { if (!isManualKind(k)) last = i })
      ordered.splice(last + 1, 0, kind)
    }
  }
  return ordered
}

// ── The illustrative platform fee ─────────────────────────────────────────
// Flat, not by plan: every seeded account sits on the same tier, so a tier table
// would show one value everywhere. It is a row label, never recorded on a payment.

export const PLATFORM_FEE_BPS = 100
export const PLATFORM_FEE_LABEL = '1%'
export const PLATFORM_FEE_CAPTION =
  'Illustrative Maropost platform fee on payments taken through other providers. Maropay carries none, and neither do manual payment methods. The fee that applies to your plan is shown before you connect a provider.'

export type PlatformFee = { bps: number; label: string } | null

/**
 * Shopify's rule, mirrored: other providers carry the platform fee; Maropay never
 * does; manual methods never do; and while Maropay is the store's card processor,
 * PayPal is exempt too. The other providers keep paying it.
 */
export function platformFeeFor(kind: ProviderKind, setup: Pick<StoreProviderSetup, 'cardProcessor'>): PlatformFee {
  if (kind === 'maropay' || isManualKind(kind)) return null
  if (kind === 'paypal' && setup.cardProcessor === 'maropay') return null
  return { bps: PLATFORM_FEE_BPS, label: PLATFORM_FEE_LABEL }
}

/** The row's words: "1% Maropost platform fee" · "0% Maropost platform fee" (PayPal, waived) · "No Maropost platform fee" (Maropay, manual). */
export function platformFeeLine(kind: ProviderKind, setup: Pick<StoreProviderSetup, 'cardProcessor'>): string {
  const fee = platformFeeFor(kind, setup)
  if (fee) return `${fee.label} Maropost platform fee`
  return kind === 'paypal' ? '0% Maropost platform fee' : 'No Maropost platform fee'
}

export function providerLabel(kind: ProviderKind): string {
  return kind === 'maropay' ? 'Maropay' : PROVIDER_SPECS[kind].label
}

/** One line under a provider's name: what it offers now, at what rate, with the platform fee. */
export function providerSubtitle(connection: ProviderConnection, setup: StoreProviderSetup): string {
  const kind = connection.kind
  if (isManualKind(kind)) return `Shown at checkout as “${connection.manual?.displayName ?? providerLabel(kind)}” · ${platformFeeLine(kind, setup)}`
  if (connection.status !== 'active') return `${connection.methods.map((m) => m.label).join(', ')} · ${platformFeeLine(kind, setup)}`
  const offered = connectionOfferedMethods(connection, setup)
  if (!offered.length) return `Nothing at checkout — cards and wallets go through ${providerLabel(setup.cardProcessor ?? 'maropay')}`
  const rates = [...new Set(offered.map((m) => m.rate?.label).filter((l): l is string => !!l))]
  return [offered.map((m) => m.label).join(', '), rates.join(' / '), platformFeeLine(kind, setup)].filter(Boolean).join(' · ')
}
