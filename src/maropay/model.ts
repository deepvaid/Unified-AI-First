/**
 * Maropay domain model: record types, the persisted per-account state, the
 * illustrative method catalogue and terms, and the small pure tables (status
 * ranks, labels, the role → action matrix) the rest of the module derives from.
 *
 * Maropay owns Payment records in integer minor units; Commerce orders only
 * carry a derived summary (see useCommerce.applyPaymentSummary).
 *
 * Pure module — relative `.ts` imports only (see money.ts), so node:test can
 * load it. No enums or namespaces (erasableSyntaxOnly).
 */
import { money, zero } from './money.ts'
import type { Money, RateCard } from './money.ts'

// ── Vocabulary ────────────────────────────────────────────────────────────

/** Who processed a payment. Anything but 'maropay' is a previous provider kept for history. */
export type MaropayProvider = 'maropay' | 'stripe-legacy' | 'paypal' | 'manual'
export type LegacyProvider = Exclude<MaropayProvider, 'maropay'>

export const PROVIDER_LABELS: Record<MaropayProvider, string> = {
  maropay: 'Maropay',
  'stripe-legacy': 'Stripe',
  paypal: 'PayPal',
  manual: 'Manual payment',
}

/** The reviewer-selectable persona the prototype acts as (plan §2 access model). */
export type MaropayActingRole = 'owner' | 'finance' | 'store_ops'

export const ROLE_LABELS: Record<MaropayActingRole, string> = {
  owner: 'Business owner',
  finance: 'Finance user',
  store_ops: 'Store operations',
}

export type BusinessType = 'sole_trader' | 'company' | 'nonprofit'

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  sole_trader: 'Sole trader',
  company: 'Company',
  nonprofit: 'Non-profit',
}

// The six state dimensions (plan §4 "Keep distinct states visible").
export type SetupState = 'not_started' | 'in_progress' | 'submitted'
export type VerificationState = 'not_submitted' | 'under_review' | 'action_required' | 'verified' | 'rejected'
export type EligibilityState = 'unknown' | 'eligible' | 'unsupported'
/** `inactive` = not switched on yet (pre-verification); `disabled` = switched off (rejected). */
export type PaymentCapability = 'inactive' | 'enabled' | 'restricted' | 'disabled'
export type PayoutCapability = 'inactive' | 'ready' | 'action_required' | 'paused'
export type StoreActivationState = 'inactive' | 'ready_to_activate' | 'live'
export type MethodStatus = 'available' | 'setup_required' | 'pending_approval' | 'enabled' | 'unavailable'

export type MethodCategory = 'cards' | 'wallets' | 'bnpl' | 'local'
export const METHOD_CATEGORY_LABELS: Record<MethodCategory, string> = {
  cards: 'Cards',
  wallets: 'Wallets',
  bnpl: 'Buy now, pay later',
  local: 'Bank and local methods',
}

/** Account-level availability of a method (store enablement lives on the binding). */
export type MethodAvailability = 'available' | 'setup_required' | 'pending_approval' | 'unavailable'
export type CaptureMode = 'automatic' | 'manual'

export type OnboardingStepKey = 'business' | 'terms' | 'verify' | 'payout' | 'public' | 'review'
export const ONBOARDING_STEPS: OnboardingStepKey[] = ['business', 'terms', 'verify', 'payout', 'public', 'review']

export type MaropayScenarioKey =
  | 'm01' | 'm02' | 'm03' | 'm04' | 'm05' | 'm06' | 'm07' | 'm08'
  | 'm09' | 'm10' | 'm11' | 'm12' | 'm13' | 'm14' | 'm15'

// ── Results ───────────────────────────────────────────────────────────────

export type MaropayErrorCode =
  | 'permission_denied' | 'not_found' | 'requirement_pending' | 'unsupported_country'
  | 'store_not_live' | 'method_unavailable' | 'invalid_amount' | 'refund_exceeds_remaining'
  | 'insufficient_balance' | 'stale_state' | 'network_timeout' | 'step_up_required'
  | 'deadline_passed' | 'nothing_to_pay' | 'invalid_input'

export interface MaropayError {
  code: MaropayErrorCode
  message: string
  /** Safe to try again with the same idempotency key. */
  retryable: boolean
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: MaropayError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function fail<T = never>(code: MaropayErrorCode, message: string, retryable = false): Result<T> {
  return { ok: false, error: { code, message, retryable } }
}

export function problem(code: MaropayErrorCode, message: string): MaropayError {
  return { code, message, retryable: false }
}

// ── Records ───────────────────────────────────────────────────────────────

/** A picked file, kept as name + status only — contents are never stored. */
export interface MockDocument {
  name: string
  sizeLabel: string
  status: 'received' | 'rejected'
}

export interface PostalAddress {
  line1: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface LegalBusiness {
  id: string
  legalName: string
  tradingName: string
  type: BusinessType
  /** ISO-2 registration country — where the business is registered, not where it sells. */
  country: string
  registrationNumber: string
  address: PostalAddress
  website: string
  representative: { name: string; title: string; email: string }
  publicDetails: { statementDescriptor: string; supportEmail: string; supportPhone: string }
}

/** Masked payout bank account — only the last four digits ever reach state. */
export interface PayoutDestination {
  bankName: string
  last4: string
  holderName: string
  currency: string
  addedAt: string
}

export interface MaropayAccount {
  id: string
  /** Processor-side reference for support; never shown as merchant copy. */
  processorAccountRef: string
  businessId: string
  country: string
  /** Settlement currency. */
  currency: string
  setup: SetupState
  verification: VerificationState
  eligibility: EligibilityState
  rejectedReason: string | null
  /** Verified details reused from an existing processor account (M05). */
  reusedVerifiedDetails: boolean
  payoutDestination: PayoutDestination | null
  payoutSchedule: { interval: 'daily' | 'weekly'; delayDays: number }
  createdAt: string
  submittedAt: string | null
  verifiedAt: string | null
  /** Set once the owner closes the account. Its history stays readable. */
  closedAt: string | null
}

export interface PreviousProviderMethod {
  label: string
  /** Maropay equivalent, or null when the method has none. */
  maropayMethodId: string | null
  rate: RateCard
  /** Stays connected through the previous provider after the switch. */
  keepSeparately: boolean
}

export interface PreviousProvider {
  provider: LegacyProvider
  methods: PreviousProviderMethod[]
  captureMode: CaptureMode
  /** Saved cards/mandates. `blocking` = they back charges that need a supported migration first. */
  savedCredentials: { count: number; blocking: boolean } | null
  connectedSince: string
}

/** A sales channel linked to the Maropay account. One business, many bindings. */
export interface StoreBinding {
  id: string
  accountId: string
  channelId: string
  activation: 'inactive' | 'live'
  /** Methods the merchant wants on this store; checkout offers only the available ones. */
  enabledMethodIds: string[]
  captureMode: CaptureMode
  previousProvider: PreviousProvider | null
  checkoutValidation: { status: 'not_run' | 'passed' | 'failed'; at: string | null; failureReason: string | null }
  impactReviewedAt: string | null
  linkedAt: string
  activatedAt: string | null
  deactivatedAt: string | null
}

export interface PaymentMethodCatalogEntry {
  id: string
  label: string
  category: MethodCategory
  /** Presentment currencies the method supports. */
  currencies: string[]
  rate: RateCard
  /** Extra information needed before the method can be used; non-empty = setup required. */
  requirements: string[]
  supportsManualCapture: boolean
  /** Confirmation can take days (bank debits). */
  delayed: boolean
  availability: MethodAvailability
  reviewNote: string | null
}

export type PaymentStatus =
  | 'processing' | 'authorised' | 'captured' | 'partially_refunded'
  | 'refunded' | 'failed' | 'voided' | 'disputed'

export type ShopperFlow = 'success' | 'auth_required' | 'declined' | 'redirect' | 'delayed'

export interface Capture {
  id: string
  amount: Money
  at: string
  idempotencyKey: string
}

export interface Refund {
  id: string
  amount: Money
  reason: string
  status: 'pending' | 'succeeded' | 'failed'
  at: string
  idempotencyKey: string
  /** The provider that returns the money — always the payment's original provider. */
  provider: MaropayProvider
  failureReason: string | null
}

export type PaymentEventKind =
  | 'created' | 'processing' | 'authorised' | 'captured' | 'failed' | 'voided'
  | 'refund_pending' | 'refund_succeeded' | 'refund_failed'
  | 'dispute_opened' | 'dispute_submitted' | 'dispute_won' | 'dispute_lost' | 'dispute_accepted'
  | 'late_event_ignored'

export interface PaymentEvent {
  id: string
  at: string
  kind: PaymentEventKind
  text: string
}

export interface Payment {
  /** Also the order's payment reference, so one id reads the same everywhere. */
  id: string
  accountId: string
  channelId: string
  orderId: number | null
  orderNumber: string | null
  provider: MaropayProvider
  /** Internal processor reference for support escalation. */
  processorRef: string
  methodId: string
  methodLabel: string
  amount: Money
  status: PaymentStatus
  captureMode: CaptureMode
  captures: Capture[]
  refunds: Refund[]
  disputeId: string | null
  /** Processing fee; zero until captured, and unknown (zero) for previous providers. */
  fee: Money
  customer: { name: string; email: string }
  createdAt: string
  capturedAt: string | null
  authorisationExpiresAt: string | null
  /** Delayed methods: when the outcome is expected. */
  expectedResolutionAt: string | null
  failure: { code: string; message: string } | null
  flow: ShopperFlow | null
  timeline: PaymentEvent[]
  /** Processor event ids already applied — late or duplicated deliveries are ignored. */
  appliedEventIds: string[]
}

export type DisputeStatus = 'needs_response' | 'under_review' | 'won' | 'lost' | 'accepted'
export type DisputeReason =
  | 'fraudulent' | 'product_not_received' | 'product_unacceptable'
  | 'duplicate' | 'credit_not_processed' | 'general'

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  fraudulent: 'Fraudulent',
  product_not_received: 'Product not received',
  product_unacceptable: 'Product unacceptable',
  duplicate: 'Duplicate charge',
  credit_not_processed: 'Credit not processed',
  general: 'General',
}

export type EvidenceKey = 'receipt' | 'shipping_proof' | 'customer_communication' | 'refund_policy' | 'product_description'

export interface EvidenceItem {
  key: EvidenceKey
  label: string
  required: boolean
  note: string
  document: MockDocument | null
}

export interface Dispute {
  id: string
  accountId: string
  channelId: string
  paymentId: string
  orderId: number | null
  orderNumber: string | null
  reason: DisputeReason
  /** What the shopper told their bank, as relayed by the processor. */
  claim: string
  amount: Money
  fee: Money
  openedAt: string
  respondBy: string
  status: DisputeStatus
  evidence: EvidenceItem[]
  summary: string
  draftUpdatedAt: string | null
  submittedAt: string | null
  resolvedAt: string | null
}

/** Stored payout states; the upcoming payout is derived (readiness.nextPayout), never stored. */
export type PayoutStatus = 'in_transit' | 'paid' | 'failed'

export interface Payout {
  id: string
  accountId: string
  amount: Money
  status: PayoutStatus
  /** Snapshot of where the money was sent. */
  destination: PayoutDestination
  createdAt: string
  arrivalEstimate: string | null
  /** When the bank transfer was confirmed as sent ("Sent to bank"). */
  paidAt: string | null
  failure: { code: string; message: string; at: string } | null
  movementIds: string[]
  retryOf: string | null
  retriedBy: string | null
}

export type MovementKind = 'charge' | 'refund' | 'refund_reversal' | 'dispute' | 'dispute_reversal'

/** One signed change to the Maropay balance. Payouts group these; nothing else moves money. */
export interface BalanceMovement {
  id: string
  accountId: string
  channelId: string | null
  kind: MovementKind
  gross: Money
  fee: Money
  /** gross − fee, signed: inflows positive, outflows negative. */
  net: Money
  paymentId: string | null
  refundId: string | null
  disputeId: string | null
  /** Payout this movement was paid out in; null while it is still in the balance. */
  payoutId: string | null
  availableAt: string
  createdAt: string
  description: string
}

export interface CommercialTerms {
  version: string
  effectiveAt: string
  /** Rendered only on the agreements step — every other screen is processor-agnostic. */
  processorName: string
  processorAgreementName: string
  disputeFee: Money
  acceptedAt: string | null
  acceptedBy: MaropayActingRole | null
}

export type TaskKind = 'verification' | 'bank' | 'method_review' | 'dispute' | 'payout_failed' | 'owner_review' | 'business_change'

/** Verified legal details that change only once our payments partner re-checks them. */
export type BusinessChangeField = 'legalName' | 'tradingName' | 'registrationNumber' | 'website'

export const BUSINESS_CHANGE_LABELS: Record<BusinessChangeField, string> = {
  legalName: 'Legal business name',
  tradingName: 'Trading name',
  registrationNumber: 'Registration number',
  website: 'Website',
}

export interface ActionTask {
  id: string
  kind: TaskKind
  title: string
  description: string
  affects: Array<'payments' | 'payouts' | 'store_activation'>
  dueAt: string | null
  /** Blocks store activation while open. */
  blocking: boolean
  /** Who is expected to act. */
  role: MaropayActingRole
  status: 'open' | 'waiting_review' | 'resolved'
  /** Onboarding step that fixes it (verification tasks). */
  step: OnboardingStepKey | null
  disputeId: string | null
  payoutId: string | null
  methodId: string | null
  channelId: string | null
  /** The value asked for (business_change tasks); applied only on approval. */
  change?: { field: BusinessChangeField; value: string }
  createdAt: string
  resolvedAt: string | null
}

/** The wizard's form state. Saved on every step change so setup survives refresh (M02). */
export interface OnboardingDraft {
  startedAt: string | null
  lastStep: OnboardingStepKey
  completedSteps: OnboardingStepKey[]
  authorityConfirmed: boolean
  ownerReviewRequestedAt: string | null
  businessChoice: 'existing' | 'new' | null
  reuseVerifiedDetails: boolean
  country: string
  businessType: BusinessType | null
  channelIds: string[]
  termsAcceptedVersion: string | null
  business: {
    legalName: string
    tradingName: string
    registrationNumber: string
    website: string
    address: PostalAddress
  }
  representative: { name: string; title: string; email: string }
  /** Photo ID for the representative; null = "upload later" (triggers a verification task). */
  idDocument: MockDocument | null
  payout: { holderName: string; bankName: string; last4: string; currency: string } | null
  publicDetails: { statementDescriptor: string; supportEmail: string; supportPhone: string }
  submittedAt: string | null
}

/** Enough of a checkout-created order to rebuild it after reload (Commerce is not persisted). */
export interface CheckoutOrderSnapshot {
  id: number
  orderNumber: string
  date: string
  customer: { name: string; email: string }
  lineItems: Array<{ product: string; sku: string; qty: number; price: string }>
  shipping: string
  total: string
}

export interface CheckoutSession {
  id: string
  channelId: string
  amount: Money
  methodId: string
  flow: ShopperFlow
  state: 'open' | 'requires_action' | 'redirected' | 'processing' | 'complete' | 'failed'
  paymentId: string | null
  order: CheckoutOrderSnapshot | null
  customer: { name: string; email: string }
  lineItem: { product: string; sku: string; price: string }
  createdAt: string
}

export type HistoryKind = 'setup' | 'terms' | 'verification' | 'business' | 'store' | 'methods' | 'bank' | 'payout' | 'refund' | 'dispute' | 'account'

export interface HistoryEntry {
  id: string
  at: string
  actor: MaropayActingRole
  kind: HistoryKind
  channelId: string | null
  text: string
}

export interface MaropayAccountState {
  version: 1
  accountId: string
  scenarioKey: MaropayScenarioKey | null
  actingRole: MaropayActingRole
  /** Stores a store-operations user may act on; null = all stores. */
  assignedChannelIds: string[] | null
  updatedAt: string
  discoveryDismissedAt: string | null
  business: LegalBusiness | null
  account: MaropayAccount | null
  terms: CommercialTerms
  onboarding: OnboardingDraft
  bindings: StoreBinding[]
  methods: PaymentMethodCatalogEntry[]
  payments: Payment[]
  disputes: Dispute[]
  payouts: Payout[]
  movements: BalanceMovement[]
  tasks: ActionTask[]
  sessions: CheckoutSession[]
  history: HistoryEntry[]
  milestones: { firstPaymentId: string | null; firstPayoutId: string | null; dismissed: Array<'first_payment' | 'first_payout'> }
  /** Persisted id sequences, so ids never collide after a reload. */
  counters: Record<string, number>
}

// ── Illustrative catalogue and terms ──────────────────────────────────────

const DAY_MS = 86_400_000

/** Registration countries the sample launch matrix treats as supported. Illustrative, not an approval list. */
export const SUPPORTED_COUNTRIES = ['US', 'CA', 'AU', 'NZ', 'GB']

export const COUNTRY_LABELS: Record<string, string> = {
  US: 'United States', CA: 'Canada', AU: 'Australia', NZ: 'New Zealand', GB: 'United Kingdom',
  BR: 'Brazil', IN: 'India', NG: 'Nigeria',
}

function rate(percentBps: number, fixedMinor: number, label: string, capMinor?: number): RateCard {
  return capMinor === undefined ? { percentBps, fixedMinor, label } : { percentBps, fixedMinor, label, capMinor }
}

/**
 * Sample of the eligible online catalogue across the four categories. The rates
 * and availability are placeholders for the approved launch matrix (plan §5).
 */
export const METHOD_CATALOG: ReadonlyArray<Omit<PaymentMethodCatalogEntry, 'availability' | 'reviewNote'>> = [
  { id: 'card', label: 'Cards', category: 'cards', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false },
  { id: 'apple_pay', label: 'Apple Pay', category: 'wallets', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false },
  { id: 'google_pay', label: 'Google Pay', category: 'wallets', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false },
  { id: 'klarna', label: 'Klarna', category: 'bnpl', currencies: ['USD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(599, 30, '5.99% + 30¢'), requirements: ['Refund and returns policy URL', 'Typical order value range'], supportsManualCapture: true, delayed: false },
  { id: 'afterpay_clearpay', label: 'Afterpay', category: 'bnpl', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP'], rate: rate(600, 30, '6% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false },
  { id: 'affirm', label: 'Affirm', category: 'bnpl', currencies: ['USD', 'CAD'], rate: rate(599, 0, '5.99%'), requirements: [], supportsManualCapture: false, delayed: false },
  { id: 'us_bank_account', label: 'ACH Direct Debit', category: 'local', currencies: ['USD'], rate: rate(80, 0, '0.8%, max $5.00', 500), requirements: [], supportsManualCapture: false, delayed: true },
  { id: 'ideal', label: 'iDEAL', category: 'local', currencies: ['EUR'], rate: rate(0, 29, '€0.29'), requirements: [], supportsManualCapture: false, delayed: false },
  { id: 'sepa_debit', label: 'SEPA Direct Debit', category: 'local', currencies: ['EUR'], rate: rate(80, 0, '0.8%, max €5.00', 500), requirements: [], supportsManualCapture: false, delayed: true },
]

/** Account-scoped copy of the catalogue: methods the settlement currency can't present are unavailable. */
export function catalogFor(currency: string): PaymentMethodCatalogEntry[] {
  return METHOD_CATALOG.map((entry) => ({
    ...entry,
    currencies: [...entry.currencies],
    requirements: [...entry.requirements],
    availability: !entry.currencies.includes(currency)
      ? 'unavailable'
      : entry.requirements.length ? 'setup_required' : 'available',
    reviewNote: entry.currencies.includes(currency) ? null : `Not available for ${currency} accounts`,
  }))
}

/** Default methods switched on for a newly linked store. */
export const DEFAULT_METHOD_IDS = ['card', 'apple_pay', 'google_pay']

export function illustrativeTerms(currency: string): CommercialTerms {
  return {
    version: '2026-09-illustrative',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    processorName: 'Stripe',
    processorAgreementName: 'Stripe Connected Account Agreement',
    disputeFee: money(1500, currency),
    acceptedAt: null,
    acceptedBy: null,
  }
}

export function emptyOnboarding(): OnboardingDraft {
  return {
    startedAt: null,
    lastStep: 'business',
    completedSteps: [],
    authorityConfirmed: false,
    ownerReviewRequestedAt: null,
    businessChoice: null,
    reuseVerifiedDetails: false,
    country: 'US',
    businessType: null,
    channelIds: [],
    termsAcceptedVersion: null,
    business: {
      legalName: '',
      tradingName: '',
      registrationNumber: '',
      website: '',
      address: { line1: '', city: '', region: '', postalCode: '', country: 'US' },
    },
    representative: { name: '', title: '', email: '' },
    idDocument: null,
    payout: null,
    publicDetails: { statementDescriptor: '', supportEmail: '', supportPhone: '' },
    submittedAt: null,
  }
}

export function emptyState(accountId: string, now: number, currency = 'USD'): MaropayAccountState {
  return {
    version: 1,
    accountId,
    scenarioKey: null,
    actingRole: 'owner',
    assignedChannelIds: null,
    updatedAt: new Date(now).toISOString(),
    discoveryDismissedAt: null,
    business: null,
    account: null,
    terms: illustrativeTerms(currency),
    onboarding: emptyOnboarding(),
    bindings: [],
    methods: catalogFor(currency),
    payments: [],
    disputes: [],
    payouts: [],
    movements: [],
    tasks: [],
    sessions: [],
    history: [],
    milestones: { firstPaymentId: null, firstPayoutId: null, dismissed: [] },
    counters: {},
  }
}

// ── Persistence helpers ───────────────────────────────────────────────────

export const STORAGE_PREFIX = 'mp.maropay.v1'

export function storageKey(accountId: string): string {
  return `${STORAGE_PREFIX}:${accountId}`
}

function isMoney(value: unknown): value is Money {
  const m = value as Money | null
  return !!m && typeof m === 'object' && Number.isInteger(m.amount) && typeof m.currency === 'string'
}

/**
 * Reads a persisted state back, or null when it is missing, from another
 * account, from a different version, or malformed. Arrays missing from older
 * saves are filled from an empty state; payments with non-integer money are
 * dropped rather than trusted.
 */
export function parseState(raw: string | null, accountId: string, now: number): MaropayAccountState | null {
  if (!raw) return null
  let parsed: Partial<MaropayAccountState>
  try {
    parsed = JSON.parse(raw) as Partial<MaropayAccountState>
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || parsed.version !== 1 || parsed.accountId !== accountId) return null
  const base = emptyState(accountId, now, parsed.account?.currency ?? 'USD')
  const list = <T,>(value: T[] | undefined, fallback: T[]): T[] => (Array.isArray(value) ? value : fallback)
  return {
    ...base,
    ...parsed,
    version: 1,
    accountId,
    onboarding: { ...base.onboarding, ...(parsed.onboarding ?? {}) },
    account: parsed.account ? { ...parsed.account, closedAt: parsed.account.closedAt ?? null } : null,
    milestones: { ...base.milestones, ...(parsed.milestones ?? {}) },
    terms: parsed.terms ?? base.terms,
    bindings: list(parsed.bindings, []),
    methods: list(parsed.methods, base.methods),
    payments: list(parsed.payments, []).filter((p) => isMoney(p.amount)).map((p) => ({ ...p, orderId: typeof p.orderId === 'number' ? p.orderId : null })),
    disputes: list(parsed.disputes, []),
    payouts: list(parsed.payouts, []),
    movements: list(parsed.movements, []).filter((m) => isMoney(m.net)),
    tasks: list(parsed.tasks, []),
    sessions: list(parsed.sessions, []),
    history: list(parsed.history, []),
    counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
  }
}

/** Next id in a persisted sequence: nextId(state, 'po') → 'po_1001'. */
export function nextId(state: MaropayAccountState, prefix: string, start = 1000): string {
  const n = (state.counters[prefix] ?? start) + 1
  state.counters[prefix] = n
  return `${prefix}_${n}`
}

/** Next number in a persisted sequence without a prefix (checkout order ids). */
export function nextNumber(state: MaropayAccountState, key: string): number {
  const n = (state.counters[key] ?? 0) + 1
  state.counters[key] = n
  return n
}

export function isoAt(ms: number): string {
  return new Date(ms).toISOString()
}

/** Local calendar date key, matching how Commerce seeds order dates. */
export function localDateKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysFrom(ms: number, days: number): string {
  return new Date(ms + days * DAY_MS).toISOString()
}

// ── Payment status ranks and order labels ─────────────────────────────────

/** Rank used to refuse regressions from late events: a confirmed state never moves back. */
export const PAYMENT_STATUS_RANK: Record<PaymentStatus, number> = {
  processing: 1,
  authorised: 2,
  captured: 3,
  failed: 3,
  voided: 3,
  partially_refunded: 4,
  disputed: 4,
  refunded: 5,
}

const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  processing: ['authorised', 'captured', 'failed'],
  authorised: ['captured', 'voided', 'failed'],
  captured: ['partially_refunded', 'refunded', 'disputed'],
  partially_refunded: ['partially_refunded', 'refunded', 'disputed'],
  disputed: ['captured', 'partially_refunded', 'disputed'],
  refunded: [],
  failed: [],
  voided: [],
}

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Payment status as Commerce orders spell it (MpStatusChip `payment` keys, lower-cased). */
export type OrderPaymentStatusLabel =
  | 'Pending' | 'Authorised' | 'Paid' | 'Partially Refunded' | 'Refunded' | 'Failed' | 'Voided' | 'Disputed'

const ORDER_LABELS: Record<PaymentStatus, OrderPaymentStatusLabel> = {
  processing: 'Pending',
  authorised: 'Authorised',
  captured: 'Paid',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
  failed: 'Failed',
  voided: 'Voided',
  disputed: 'Disputed',
}

export function orderPaymentStatusLabel(status: PaymentStatus): OrderPaymentStatusLabel {
  return ORDER_LABELS[status]
}

/**
 * Merchant-facing wording for the state dimensions. Each label is also its
 * MpStatusChip `readiness` key (lower-cased), so the chip tone follows the text.
 */
export const SETUP_LABELS: Record<SetupState, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
}

export const VERIFICATION_LABELS: Record<VerificationState, string> = {
  not_submitted: 'Not submitted',
  under_review: 'Under review',
  action_required: 'Action required',
  verified: 'Verified',
  rejected: 'Rejected',
}

export const PAYMENT_CAPABILITY_LABELS: Record<PaymentCapability, string> = {
  inactive: 'Not enabled',
  enabled: 'Enabled',
  restricted: 'Restricted',
  disabled: 'Disabled',
}

export const PAYOUT_CAPABILITY_LABELS: Record<PayoutCapability, string> = {
  inactive: 'Not enabled',
  ready: 'Ready',
  action_required: 'Action required',
  paused: 'Paused',
}

export const STORE_ACTIVATION_LABELS: Record<StoreActivationState, string> = {
  inactive: 'Inactive',
  ready_to_activate: 'Ready to activate',
  live: 'Live',
}

export const METHOD_STATUS_LABELS: Record<MethodStatus, string> = {
  available: 'Available',
  setup_required: 'Setup required',
  pending_approval: 'Pending approval',
  enabled: 'Enabled',
  unavailable: 'Unavailable',
}

/** Payout wording: a paid payout was *sent* — that is all the processor can confirm. */
export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  in_transit: 'In transit',
  paid: 'Sent to bank',
  failed: 'Failed',
}

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  needs_response: 'Needs response',
  under_review: 'Under review',
  won: 'Won',
  lost: 'Lost',
  accepted: 'Accepted',
}

/** Merchant-facing payment status wording in Maropay lists. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  processing: 'Processing',
  authorised: 'Authorised',
  captured: 'Succeeded',
  partially_refunded: 'Partially refunded',
  refunded: 'Refunded',
  failed: 'Failed',
  voided: 'Cancelled',
  disputed: 'Disputed',
}

// ── Access model (plan §2) ────────────────────────────────────────────────

export type MaropayAction =
  | 'view_balances' | 'view_transactions' | 'view_payouts' | 'view_disputes' | 'export'
  | 'capture' | 'void' | 'refund' | 'respond_dispute' | 'accept_dispute'
  | 'edit_onboarding' | 'submit_onboarding' | 'accept_terms' | 'resolve_task'
  | 'manage_methods' | 'validate_checkout' | 'activate_store' | 'deactivate_store' | 'link_store'
  | 'change_business' | 'change_bank' | 'retry_payout' | 'close_account'

const FINANCE_ACTIONS: MaropayAction[] = [
  'view_balances', 'view_transactions', 'view_payouts', 'view_disputes', 'export',
  'capture', 'void', 'refund', 'respond_dispute', 'accept_dispute', 'retry_payout', 'edit_onboarding',
]
const STORE_OPS_ACTIONS: MaropayAction[] = ['view_transactions', 'capture', 'void']

/** Owners can do everything; finance handles money; store operations see payments for their stores. */
export function can(role: MaropayActingRole, action: MaropayAction): boolean {
  if (role === 'owner') return true
  return (role === 'finance' ? FINANCE_ACTIONS : STORE_OPS_ACTIONS).includes(action)
}

/** `can`, narrowed to the stores a store-operations user is assigned to. */
export function canForStore(role: MaropayActingRole, action: MaropayAction, channelId: string | null, assigned: string[] | null): boolean {
  if (!can(role, action)) return false
  if (role !== 'store_ops' || assigned === null || channelId === null) return true
  return assigned.includes(channelId)
}

/** Zero in the account's settlement currency (USD when no account exists yet). */
export function accountZero(state: MaropayAccountState): Money {
  return zero(state.account?.currency ?? state.terms.disputeFee.currency)
}
