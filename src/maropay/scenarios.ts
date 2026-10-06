/**
 * Reviewer scenarios M01–M17 (plan §6.5 plus the partner-alignment phase).
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
import { ONBOARDING_STEPS, REPRESENTATIVE_ID, emptyPerson, emptyState, isoAt } from './model.ts'
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
  acceptTerms,
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
  raiseThresholdRequirement,
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
  { key: 'm01', label: 'M01 · New merchant, approved after review', steps: [
    'Open Maropay and choose Set up Maropay.',
    'Complete the six setup steps — the account goes under review.',
    'Approve the review from the reviewer controls, then follow the notification to the store’s Payments page.',
    'Run the test checkout, review the impact and activate; buy something on the store’s storefront, then run a payout.',
  ] },
  { key: 'm02', label: 'M02 · Setup abandoned midway', steps: [
    'The overview says Finish setting up Maropay.',
    'Continue setup — it resumes at step 3 with every answer kept.',
    'Refresh mid-step: nothing is lost.',
  ] },
  { key: 'm03', label: 'M03 · Verification needs more information', steps: [
    'Our payments partner couldn’t confirm the representative’s identity and asks for a photo ID.',
    'Upload it from the task — the account moves back to under review.',
    'Approve the review from the reviewer controls — an activation task appears for the store.',
  ] },
  { key: 'm04', label: 'M04 · Business declined', steps: [
    'The overview says our payments partner couldn’t approve this business, and why.',
    'No activation is offered anywhere; the store keeps PayPal and payments read Not enabled.',
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
  { key: 'm16', label: 'M16 · Information needed later', steps: [
    'Payouts reached the partner’s threshold, so the EIN is now due by a date.',
    'Payments and payouts keep running until the deadline.',
    'Provide the EIN from the task — it goes to the partner for review.',
  ] },
  { key: 'm17', label: 'M17 · Deadline passed', steps: [
    'The EIN deadline passed: payouts paused first, payments a week later.',
    'Checkout refuses new payments until the EIN is provided.',
    'Provide it — the account is under review again and both resume on approval.',
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

function env(at: number, ctx: ScenarioContext): AdapterEnv {
  return {
    now: at,
    actor: { role: 'owner', assignedChannelIds: null },
    failures: defaultFailures(),
    channelName: (id) => ctx.channels.find((c) => c.id === id)?.name ?? 'this store',
    channelFacts: (id) => {
      const channel = ctx.channels.find((c) => c.id === id)
      return channel ? channelFacts(channel) : null
    },
  }
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
      taxId: '84-2210931',
      registrationNumber: '',
      structure: 'private_corporation',
      phone: '+1 (415) 555-0199',
      mcc: '5651',
      website: `https://${site}`,
      noWebsite: false,
      productDescription: '',
      address: { line1: '1450 Mission Street', city: 'San Francisco', region: 'CA', postalCode: '94103', country: 'US' },
    },
    representative: {
      ...emptyPerson(REPRESENTATIVE_ID, 'US'),
      firstName: 'Jordan',
      lastName: 'Lee',
      title: 'Founder and owner',
      email: `jordan@${slug(trading)}.example`,
      phone: '+1 (415) 555-0142',
      address: { line1: '2210 Harrison Street', city: 'San Francisco', region: 'CA', postalCode: '94110', country: 'US' },
      roles: { owner: true, director: false, executive: true },
      percentOwnership: 100,
    },
    persons: [],
    attestations: { owners: false, directors: false, executives: false },
    publicDetails: {
      statementDescriptor: trading.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 22),
      supportEmail: `support@${slug(trading)}.example`,
      supportPhone: '+1 (415) 555-0142',
    },
  }
}

const FIXTURE_USER_AGENT = 'Mozilla/5.0 (Macintosh) Chrome/130 (prototype fixture)'

/** A fully completed draft: every step done, terms accepted, payout account entered. */
function completedDraft(state: MaropayAccountState, ctx: ScenarioContext, at: number): void {
  const draft = state.onboarding
  draft.authorityConfirmed = true
  draft.completedSteps = ONBOARDING_STEPS.filter((s) => s !== 'review')
  draft.lastStep = 'review'
  // What Maropost can't prefill: the representative's date of birth, SSN last 4 and the owners attestation.
  draft.representative.dob = '1986-04-12'
  draft.representative.ssnLast4 = '4821'
  draft.attestations.owners = true
  draft.payout = {
    holderName: draft.business.legalName || `${ctx.accountName} LLC`, bankName: 'Mercury Bank', last4: '4417',
    routingNumber: '021000021', currency: 'USD', country: 'US', holderType: 'company',
  }
  acceptTerms(state, { userAgent: FIXTURE_USER_AGENT }, env(at, ctx))
}

/** Setup submitted for review at `at`; the partner hasn't decided yet. */
function submitted(state: MaropayAccountState, ctx: ScenarioContext, at: number, reuse = false, prefill = prefillFor(ctx)): void {
  startOnboarding(state, { businessChoice: reuse ? 'existing' : 'new', reuseVerifiedDetails: reuse, prefill }, env(at, ctx))
  completedDraft(state, ctx, at)
  submitOnboarding(state, env(at, ctx))
}

/** Setup submitted and approved on review, primary store linked (not yet live). Approval raises the store's activation task. */
function verified(state: MaropayAccountState, ctx: ScenarioContext, at: number, reuse = false, prefill = prefillFor(ctx)): void {
  submitted(state, ctx, at, reuse, prefill)
  simulateReviewOutcome(state, 'verified', env(at, ctx))
}

/** A US company's EIN is only due once payouts pass the partner's threshold — these merchants haven't given it yet. */
function prefillWithoutEin(ctx: ScenarioContext): Partial<OnboardingDraft> {
  const prefill = prefillFor(ctx)
  return { ...prefill, business: { ...prefill.business!, taxId: '' } }
}

function bindingFor(state: MaropayAccountState, channelId: string): StoreBinding | undefined {
  return state.bindings.find((b) => b.channelId === channelId)
}

function activate(state: MaropayAccountState, ctx: ScenarioContext, channel: ScenarioChannel, at: number): void {
  validateCheckout(state, channel.id, env(at, ctx))
  markImpactReviewed(state, channel.id, env(at, ctx))
  activateStore(state, channel.id, channelFacts(channel), env(at, ctx))
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

interface HistoryOptions {
  /** Days ago that payouts run (Maropay only); defaults to one sent to the bank and one in transit. */
  payoutAges?: number[]
  /** No payment is recorded after this time — payments were paused. */
  until?: number
}

/**
 * Gives the store's recent orders a payment history through `provider`. For
 * Maropay, payouts run at fixed ages so the fixture has one payout sent to the
 * bank, one in transit and a balance still waiting. A payout the account
 * couldn't make at that time (payouts paused) is simply refused.
 */
function recordHistory(state: MaropayAccountState, ctx: ScenarioContext, channelId: string, provider: MaropayProvider, options: HistoryOptions = {}): void {
  const refs = linkedOrderRefs(ctx.orders, channelId).slice().reverse()
  const payoutAges = provider === 'maropay' ? [...(options.payoutAges ?? [8, 1])] : []
  for (const ref of refs) {
    const age = ageInDays(ref.date, ctx.now)
    if (options.until !== undefined && orderTime(ref.date, ctx.now) > options.until) continue
    while (payoutAges.length && payoutAges[0]! > age) runPayout(state, env(ctx.now - payoutAges.shift()! * DAY_MS, ctx))
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
    }, env(orderTime(ref.date, ctx.now), ctx))
  }
  while (payoutAges.length) runPayout(state, env(ctx.now - payoutAges.shift()! * DAY_MS, ctx))
  const oldest = state.payouts[state.payouts.length - 1]
  if (oldest && state.payouts.length > 1) markPayoutPaid(state, oldest.id, env(ctx.now - 6 * DAY_MS, ctx))
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

interface LiveOptions {
  previous?: PreviousProvider | null
  prefill?: Partial<OnboardingDraft>
  /** Runs after activation and before the payment history; what it returns can cut the history short. */
  beforeHistory?: (state: MaropayAccountState) => HistoryOptions
}

/** Verified, primary store live for two months with a reconciled payment and payout history. */
function baseLive(ctx: ScenarioContext, options: LiveOptions = {}): MaropayAccountState {
  const state = emptyState(ctx.accountId, ctx.now)
  const primary = eligibleStores(ctx.channels)[0]
  const start = ctx.now - 60 * DAY_MS
  verified(state, ctx, start, false, options.prefill)
  if (!primary) return state
  const binding = bindingFor(state, primary.id)!
  binding.previousProvider = options.previous ?? null
  activate(state, ctx, primary, start)
  recordHistory(state, ctx, primary.id, 'maropay', options.beforeHistory?.(state))
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
      startOnboarding(state, { businessChoice: 'new', reuseVerifiedDetails: false, prefill: prefillFor(ctx) }, env(at, ctx))
      state.onboarding.authorityConfirmed = true
      state.onboarding.completedSteps = ['business', 'terms']
      state.onboarding.lastStep = 'verify'
      acceptTerms(state, { userAgent: FIXTURE_USER_AGENT }, env(at, ctx))
      break
    }

    case 'm03': {
      // Submitted yesterday; the partner couldn't confirm the representative's identity from the keyed details.
      const at = now - DAY_MS
      submitted(state, ctx, at)
      simulateReviewOutcome(state, 'more_info', env(at + 3_600_000, ctx), { request: 'identity_unverified' })
      break
    }

    case 'm04': {
      submitted(state, ctx, now - 3 * DAY_MS)
      simulateReviewOutcome(state, 'rejected', env(now - DAY_MS, ctx), { reason: 'terms_of_service' })
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
      if (secondary) linkStore(state, secondary.id, env(now - 5 * DAY_MS, ctx))
      break

    case 'm08':
      state = baseLive(ctx)
      raiseBankRequirement(state, env(now - DAY_MS, ctx))
      break

    case 'm09': {
      state = baseLive(ctx)
      const inTransit = state.payouts.find((p) => p.status === 'in_transit')
      if (inTransit) failPayout(state, inTransit.id, 'account_closed', env(now - 2 * 3_600_000, ctx))
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
      if (target) openDispute(state, target.id, 'product_not_received', env(now - DAY_MS, ctx))
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
        setMethodEnabled(state, primary.id, 'us_bank_account', true, env(at, ctx))
        const session = createCheckoutSession(state, {
          channelId: primary.id,
          methodId: 'us_bank_account',
          flow: 'delayed',
          amount: money(18_400, 'USD'),
          customer: { name: 'Harper Clark', email: 'harper.clark@email.com' },
          lineItems: [{ product: 'Patagonia Better Sweater Fleece Vest', sku: 'SKU-10001', qty: 1, price: '184.00' }],
        }, env(at, ctx))
        if (session.ok) confirmCheckoutSession(state, session.value.id, env(at, ctx))
      }
      break
    }

    case 'm14':
      state = baseLive(ctx, { previous: PAYPAL_PREVIOUS(now - 400 * DAY_MS) })
      break

    case 'm15': {
      const at = now - 2 * DAY_MS
      verified(state, ctx, at)
      if (primary) {
        setMethodEnabled(state, primary.id, 'klarna', true, env(at, ctx))
        validateCheckout(state, primary.id, env(at, ctx))
        markImpactReviewed(state, primary.id, env(at, ctx))
      }
      break
    }

    case 'm16':
      // Payouts crossed the partner's threshold two days ago: the EIN is due in twelve days; nothing pauses yet.
      state = baseLive(ctx, { prefill: prefillWithoutEin(ctx) })
      raiseThresholdRequirement(state, 'company.tax_id', env(now - 2 * DAY_MS, ctx))
      break

    case 'm17':
      // The same request 25 days ago, raised before the history it shapes: the deadline passed 11 days ago (payouts
      // paused — the last payout ran 12 days ago), and payments paused 4 days ago (nothing taken since).
      state = baseLive(ctx, {
        prefill: prefillWithoutEin(ctx),
        beforeHistory: (s) => {
          const raised = raiseThresholdRequirement(s, 'company.tax_id', env(now - 25 * DAY_MS, ctx))
          return { payoutAges: [15, 12], until: raised.ok ? Date.parse(raised.value.paymentsPauseAt!) : undefined }
        },
      })
      break
  }

  state.scenarioKey = key
  state.updatedAt = isoAt(now)
  return state
}
