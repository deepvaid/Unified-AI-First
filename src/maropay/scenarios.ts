/**
 * Reviewer scenarios M01–M15 (plan §6.5).
 *
 * Every fixture is built by running the mock adapter's own operations at
 * back-dated times — onboarding, activation, payments, refunds, payouts,
 * disputes — so the numbers always reconcile: each payout equals the sum of
 * its movements, each payment matches its order's total.
 *
 * Fixture payments reuse the existing Commerce orders of the account's
 * primary store (the most recent twelve), so Transactions and Orders tell the
 * same story. Merchants, people and bank accounts are fictional.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { fromDecimal, money } from './money.ts'
import { ONBOARDING_STEPS, emptyState, isoAt } from './model.ts'
import type {
  MaropayAccountState,
  MaropayProvider,
  MaropayScenarioKey,
  OnboardingDraft,
  PreviousProvider,
  StoreBinding,
} from './model.ts'
import type { ChannelFacts } from './readiness.ts'
import {
  activateStore,
  confirmCheckoutSession,
  createCheckoutSession,
  defaultFailures,
  failPayout,
  linkStore,
  markImpactReviewed,
  markPayoutPaid,
  openDispute,
  raiseBankRequirement,
  recordHistoricalPayment,
  runPayout,
  setMethodEnabled,
  simulateReviewOutcome,
  startOnboarding,
  submitOnboarding,
  validateCheckout,
} from '../services/maropay/mockAdapter.ts'
import type { AdapterEnv } from '../services/maropay/mockAdapter.ts'

const DAY_MS = 86_400_000

// ── Catalogue ─────────────────────────────────────────────────────────────

export interface MaropayScenario {
  key: MaropayScenarioKey
  label: string
  /** What the reviewer should be able to demonstrate. */
  steps: string[]
}

export const MAROPAY_SCENARIOS: MaropayScenario[] = [
  { key: 'm01', label: 'M01 · New merchant, immediate approval', steps: [
    'Open Maropay and choose Set up Maropay.',
    'Complete the six setup steps — attach the photo ID for instant approval.',
    'On the store’s Payments page, run the test checkout, review the impact and activate.',
    'Take a payment in Checkout preview, then run a payout from the reviewer controls.',
  ] },
  { key: 'm02', label: 'M02 · Setup abandoned midway', steps: [
    'The overview says Finish setting up Maropay.',
    'Continue setup — it resumes at step 3 with every answer kept.',
    'Refresh mid-step: nothing is lost.',
  ] },
  { key: 'm03', label: 'M03 · Verification needs more information', steps: [
    'The overview asks for a photo ID by a date.',
    'Upload it from the task — the account moves to under review.',
    'Approve the review from the reviewer controls — the store becomes ready to activate.',
  ] },
  { key: 'm04', label: 'M04 · Business not supported', steps: [
    'The overview explains that Maropay isn’t available for this business.',
    'No activation is offered anywhere; the store keeps PayPal.',
    'Use the support route to ask for the decision to be reviewed.',
  ] },
  { key: 'm05', label: 'M05 · Existing Stripe merchant', steps: [
    'Verified details were reused from the existing Stripe account.',
    'Earlier payments stay with Stripe — balances and payouts are not merged.',
    'Activate: manual capture is kept, so new payments arrive authorised.',
  ] },
  { key: 'm06', label: 'M06 · Switching from PayPal', steps: [
    'Compare fees and what stays with PayPal on the store’s Payments page.',
    'Activate — new checkouts route to Maropay; PayPal Checkout stays connected.',
    'Refund an earlier order: it goes back through PayPal.',
  ] },
  { key: 'm07', label: 'M07 · One business, two stores', steps: [
    'The primary store is live; the second store is linked but inactive.',
    'Filter Transactions by store — totals stay per store.',
    'Activate the second store without repeating setup.',
  ] },
  { key: 'm08', label: 'M08 · Payments active, payouts paused', steps: [
    'The overview says payments are active but payouts need attention.',
    'Checkout keeps working while payouts wait.',
    'Confirm the bank account to resume payouts.',
  ] },
  { key: 'm09', label: 'M09 · Failed payout', steps: [
    'Open the failed payout to see why and which funds came back.',
    'Update the bank account (verification code 246810).',
    'Retry the payout.',
  ] },
  { key: 'm10', label: 'M10 · Partial refund', steps: [
    'Open the most recent payment.',
    'Refund part of it — the remaining refundable amount updates in the payment, the order and the balance.',
  ] },
  { key: 'm11', label: 'M11 · Dispute', steps: [
    'Open the dispute and note the response deadline.',
    'Add the required evidence, then submit.',
    'Decide the outcome from the reviewer controls.',
  ] },
  { key: 'm12', label: 'M12 · Store staff permissions', steps: [
    'You’re acting as store operations for the primary store.',
    'You can see its payments and capture or cancel authorisations.',
    'Bank details, agreements and activation are owner-only.',
  ] },
  { key: 'm13', label: 'M13 · Delayed payment', steps: [
    'A bank-debit payment is still processing — its order shows payment pending.',
    'Deliver the confirmation event: the payment succeeds exactly once.',
    'Deliver it again, or a late failure — both are ignored.',
  ] },
  { key: 'm14', label: 'M14 · Stop using Maropay', steps: [
    'Stop Maropay on the primary store from its Payments page.',
    'New checkouts route back to PayPal.',
    'Earlier payments, refunds, disputes and payouts stay available.',
  ] },
  { key: 'm15', label: 'M15 · Optional method pending approval', steps: [
    'Klarna is awaiting approval; cards are ready.',
    'Activate the store — cards go live now.',
    'Approve Klarna from the reviewer controls — it turns on.',
  ] },
]

export function isMaropayScenarioKey(value: unknown): value is MaropayScenarioKey {
  return typeof value === 'string' && MAROPAY_SCENARIOS.some((s) => s.key === value)
}

// ── Context ───────────────────────────────────────────────────────────────

export interface ScenarioChannel {
  id: string
  name: string
  type: 'web_store' | 'offline_store'
  provider: string
  status: string
  domain: string | null
}

export interface ScenarioOrderRef {
  id: number
  orderNumber: string
  channelId: string | null
  total: string
  currency: string
  /** Local date key, YYYY-MM-DD. */
  date: string
  paymentStatus: string
  paymentMethod: string
  paymentReference: string
  customer: { name: string; email: string }
}

export interface ScenarioContext {
  accountId: string
  accountName: string
  now: number
  channels: ScenarioChannel[]
  orders: ScenarioOrderRef[]
}

/** Stores Maropay can take payments for: Maropost web stores. Shopify stores keep their own checkout. */
export function eligibleStores(channels: ScenarioChannel[]): ScenarioChannel[] {
  return channels.filter((c) => c.type === 'web_store' && c.provider === 'maropost_store_builder')
}

export function channelFacts(channel: ScenarioChannel): ChannelFacts {
  return { name: channel.name, type: channel.type, provider: channel.provider, status: channel.status }
}

/** The store's most recent orders (order ids ascend with recency), newest first. */
export function linkedOrderRefs(orders: ScenarioOrderRef[], channelId: string, limit = 12): ScenarioOrderRef[] {
  return orders
    .filter((o) => o.channelId === channelId && /^#\d+$/.test(o.orderNumber))
    .sort((a, b) => a.id - b.id)
    .slice(0, limit)
}

// ── Builders ──────────────────────────────────────────────────────────────

function env(at: number, overrides: Partial<AdapterEnv['failures']> = {}): AdapterEnv {
  return { now: at, actor: { role: 'owner', assignedChannelIds: null }, failures: { ...defaultFailures(), ...overrides } }
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'store'
}

/** Synthetic business details the wizard starts from — the merchant reviews and edits them. */
export function prefillFor(ctx: ScenarioContext): Partial<OnboardingDraft> {
  const primary = eligibleStores(ctx.channels)[0]
  const trading = primary?.name ?? ctx.accountName.replace(/\s*\(.*\)\s*$/, '')
  const site = primary?.domain ?? `${slug(trading)}.example`
  return {
    authorityConfirmed: false,
    country: 'US',
    businessType: 'company',
    channelIds: primary ? [primary.id] : [],
    business: {
      legalName: `${trading} LLC`,
      tradingName: trading,
      registrationNumber: '84-2210931',
      website: `https://${site}`,
      address: { line1: '1450 Mission Street', city: 'San Francisco', region: 'CA', postalCode: '94103', country: 'US' },
    },
    representative: { name: 'Jordan Lee', title: 'Founder and owner', email: `jordan@${slug(trading)}.example` },
    publicDetails: {
      statementDescriptor: trading.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 22),
      supportEmail: `support@${slug(trading)}.example`,
      supportPhone: '+1 (415) 555-0142',
    },
  }
}

/** A fully completed draft: every step done, terms accepted, ID attached, payout account entered. */
function completedDraft(state: MaropayAccountState, ctx: ScenarioContext, withDocument = true): void {
  const draft = state.onboarding
  draft.authorityConfirmed = true
  draft.completedSteps = ONBOARDING_STEPS.filter((s) => s !== 'review')
  draft.lastStep = 'review'
  draft.termsAcceptedVersion = state.terms.version
  draft.idDocument = withDocument ? { name: 'jordan-lee-passport.jpg', sizeLabel: '1.8 MB', status: 'received' } : null
  draft.payout = { holderName: draft.business.legalName || `${ctx.accountName} LLC`, bankName: 'Mercury Bank', last4: '4417', currency: 'USD' }
}

function acceptTerms(state: MaropayAccountState, at: number): void {
  state.terms.acceptedAt = isoAt(at)
  state.terms.acceptedBy = 'owner'
}

/** Setup submitted and verified, primary store linked (not yet live). */
function verified(state: MaropayAccountState, ctx: ScenarioContext, at: number, reuse = false): void {
  startOnboarding(state, { businessChoice: reuse ? 'existing' : 'new', reuseVerifiedDetails: reuse, prefill: prefillFor(ctx) }, env(at))
  completedDraft(state, ctx)
  acceptTerms(state, at)
  submitOnboarding(state, env(at))
}

function bindingFor(state: MaropayAccountState, channelId: string): StoreBinding | undefined {
  return state.bindings.find((b) => b.channelId === channelId)
}

function activate(state: MaropayAccountState, channel: ScenarioChannel, at: number): void {
  validateCheckout(state, channel.id, env(at))
  markImpactReviewed(state, channel.id, env(at))
  activateStore(state, channel.id, channelFacts(channel), env(at))
}

/** Local noon of an order's date, never later than an hour before now. */
function orderTime(date: string, now: number): number {
  return Math.min(Date.parse(`${date}T12:00:00`), now - 3_600_000)
}

function ageInDays(date: string, now: number): number {
  const today = new Date(now)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.round((startOfToday - Date.parse(`${date}T00:00:00`)) / DAY_MS)
}

const SEED_METHODS: Record<string, { id: string; label: string }> = {
  'Apple Pay': { id: 'apple_pay', label: 'Apple Pay' },
  PayPal: { id: 'google_pay', label: 'Google Pay' },
  'Shop Pay': { id: 'card', label: 'Visa •••• 1881' },
}

/** Maropay only offers its own catalogue, so seed labels from other wallets map onto it. */
function maropayMethod(seedLabel: string): { id: string; label: string } {
  return SEED_METHODS[seedLabel] ?? { id: 'card', label: seedLabel }
}

const OUTCOMES: Record<string, 'captured' | 'refunded' | 'voided'> = { Paid: 'captured', Refunded: 'refunded', Voided: 'voided' }

/**
 * Gives the store's recent orders a payment history through `provider`. For
 * Maropay, payouts run at fixed ages so the fixture has one payout sent to the
 * bank, one in transit and a balance still waiting.
 */
function recordHistory(state: MaropayAccountState, ctx: ScenarioContext, channelId: string, provider: MaropayProvider): void {
  const refs = linkedOrderRefs(ctx.orders, channelId).slice().reverse()
  const payoutAges = provider === 'maropay' ? [8, 1] : []
  for (const ref of refs) {
    const age = ageInDays(ref.date, ctx.now)
    while (payoutAges.length && payoutAges[0]! > age) runPayout(state, env(ctx.now - payoutAges.shift()! * DAY_MS))
    const outcome = OUTCOMES[ref.paymentStatus]
    if (!outcome) continue
    const method = provider === 'maropay' ? maropayMethod(ref.paymentMethod) : { id: ref.paymentMethod === 'PayPal' ? 'paypal_wallet' : 'card', label: ref.paymentMethod }
    recordHistoricalPayment(state, {
      id: ref.paymentReference,
      channelId,
      orderId: ref.id,
      orderNumber: ref.orderNumber,
      provider,
      methodId: method.id,
      methodLabel: method.label,
      amount: fromDecimal(ref.total, ref.currency),
      outcome,
      customer: ref.customer,
    }, env(orderTime(ref.date, ctx.now)))
  }
  while (payoutAges.length) runPayout(state, env(ctx.now - payoutAges.shift()! * DAY_MS))
  const oldest = state.payouts[state.payouts.length - 1]
  if (oldest && state.payouts.length > 1) markPayoutPaid(state, oldest.id, env(ctx.now - 6 * DAY_MS))
}

const PAYPAL_PREVIOUS = (since: number): PreviousProvider => ({
  provider: 'paypal',
  methods: [
    { label: 'Cards via PayPal', maropayMethodId: 'card', rate: { percentBps: 349, fixedMinor: 49, label: '3.49% + 49¢' }, keepSeparately: false },
    { label: 'PayPal Checkout', maropayMethodId: null, rate: { percentBps: 349, fixedMinor: 49, label: '3.49% + 49¢' }, keepSeparately: true },
  ],
  captureMode: 'automatic',
  savedCredentials: null,
  connectedSince: isoAt(since),
})

const STRIPE_PREVIOUS = (since: number): PreviousProvider => ({
  provider: 'stripe-legacy',
  methods: [
    { label: 'Cards via Stripe', maropayMethodId: 'card', rate: { percentBps: 290, fixedMinor: 30, label: '2.9% + 30¢' }, keepSeparately: false },
    { label: 'Apple Pay via Stripe', maropayMethodId: 'apple_pay', rate: { percentBps: 290, fixedMinor: 30, label: '2.9% + 30¢' }, keepSeparately: false },
    { label: 'Google Pay via Stripe', maropayMethodId: 'google_pay', rate: { percentBps: 290, fixedMinor: 30, label: '2.9% + 30¢' }, keepSeparately: false },
  ],
  captureMode: 'manual',
  savedCredentials: { count: 38, blocking: false },
  connectedSince: isoAt(since),
})

/** Verified, primary store live for two months with a reconciled payment and payout history. */
function baseLive(ctx: ScenarioContext, previous: PreviousProvider | null = null): MaropayAccountState {
  const state = emptyState(ctx.accountId, ctx.now)
  const primary = eligibleStores(ctx.channels)[0]
  const start = ctx.now - 60 * DAY_MS
  verified(state, ctx, start)
  if (!primary) return state
  const binding = bindingFor(state, primary.id)!
  binding.previousProvider = previous
  activate(state, primary, start)
  recordHistory(state, ctx, primary.id, 'maropay')
  // An established merchant has long since seen the first-payment and first-payout moments.
  state.milestones.dismissed = ['first_payment', 'first_payout']
  return state
}

// ── Scenarios ─────────────────────────────────────────────────────────────

export function buildScenario(key: MaropayScenarioKey, ctx: ScenarioContext): MaropayAccountState {
  const stores = eligibleStores(ctx.channels)
  const primary = stores[0]
  const secondary = stores[1]
  const now = ctx.now
  let state = emptyState(ctx.accountId, now)

  switch (key) {
    case 'm01':
      break

    case 'm02': {
      const at = now - 26 * 3_600_000
      startOnboarding(state, { businessChoice: 'new', reuseVerifiedDetails: false, prefill: prefillFor(ctx) }, env(at))
      state.onboarding.authorityConfirmed = true
      state.onboarding.completedSteps = ['business', 'terms']
      state.onboarding.lastStep = 'verify'
      state.onboarding.termsAcceptedVersion = state.terms.version
      acceptTerms(state, at)
      break
    }

    case 'm03': {
      const at = now - DAY_MS
      startOnboarding(state, { businessChoice: 'new', reuseVerifiedDetails: false, prefill: prefillFor(ctx) }, env(at))
      completedDraft(state, ctx, false)
      acceptTerms(state, at)
      submitOnboarding(state, env(at))
      break
    }

    case 'm04': {
      const at = now - 3 * DAY_MS
      startOnboarding(state, { businessChoice: 'new', reuseVerifiedDetails: false, prefill: prefillFor(ctx) }, env(at))
      completedDraft(state, ctx)
      acceptTerms(state, at)
      submitOnboarding(state, env(at, { reviewDelay: true }))
      simulateReviewOutcome(state, 'rejected', env(now - DAY_MS))
      if (primary) bindingFor(state, primary.id)!.previousProvider = PAYPAL_PREVIOUS(now - 400 * DAY_MS)
      break
    }

    case 'm05': {
      verified(state, ctx, now - 2 * DAY_MS, true)
      if (primary) {
        const binding = bindingFor(state, primary.id)!
        binding.previousProvider = STRIPE_PREVIOUS(now - 700 * DAY_MS)
        binding.captureMode = 'manual'
        recordHistory(state, ctx, primary.id, 'stripe-legacy')
      }
      break
    }

    case 'm06': {
      verified(state, ctx, now - 2 * DAY_MS)
      if (primary) {
        bindingFor(state, primary.id)!.previousProvider = PAYPAL_PREVIOUS(now - 400 * DAY_MS)
        recordHistory(state, ctx, primary.id, 'paypal')
      }
      break
    }

    case 'm07':
      state = baseLive(ctx)
      if (secondary) linkStore(state, secondary.id, env(now - 5 * DAY_MS))
      break

    case 'm08':
      state = baseLive(ctx)
      raiseBankRequirement(state, env(now - DAY_MS))
      break

    case 'm09': {
      state = baseLive(ctx)
      const inTransit = state.payouts.find((p) => p.status === 'in_transit')
      if (inTransit) failPayout(state, inTransit.id, 'account_closed', env(now - 2 * 3_600_000))
      break
    }

    case 'm10':
      state = baseLive(ctx)
      break

    case 'm11': {
      state = baseLive(ctx)
      const target = state.payments
        .filter((p) => p.status === 'captured' && now - Date.parse(p.createdAt) >= 10 * DAY_MS)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
      if (target) openDispute(state, target.id, 'product_not_received', env(now - DAY_MS))
      break
    }

    case 'm12':
      state = baseLive(ctx)
      state.actingRole = 'store_ops'
      state.assignedChannelIds = primary ? [primary.id] : []
      break

    case 'm13': {
      state = baseLive(ctx)
      if (primary) {
        const at = now - DAY_MS
        setMethodEnabled(state, primary.id, 'us_bank_account', true, env(at))
        const session = createCheckoutSession(state, {
          channelId: primary.id,
          methodId: 'us_bank_account',
          flow: 'delayed',
          amount: money(18_400, 'USD'),
          customer: { name: 'Harper Clark', email: 'harper.clark@email.com' },
          lineItem: { product: 'Patagonia Better Sweater Fleece Vest', sku: 'SKU-10001', price: '184.00' },
        }, env(at))
        if (session.ok) confirmCheckoutSession(state, session.value.id, env(at))
      }
      break
    }

    case 'm14':
      state = baseLive(ctx, PAYPAL_PREVIOUS(now - 400 * DAY_MS))
      break

    case 'm15': {
      const at = now - 2 * DAY_MS
      verified(state, ctx, at)
      if (primary) {
        setMethodEnabled(state, primary.id, 'klarna', true, env(at))
        validateCheckout(state, primary.id, env(at))
        markImpactReviewed(state, primary.id, env(at))
      }
      break
    }
  }

  state.scenarioKey = key
  state.updatedAt = isoAt(now)
  return state
}
