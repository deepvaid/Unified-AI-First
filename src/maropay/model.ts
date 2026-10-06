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

/**
 * The partner's top-level split. Non-profits are company structures (the
 * per-country lists in requirements.ts flag them) — see partnerBusinessType().
 */
export type BusinessType = 'individual' | 'company'

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  individual: 'Individual or sole trader',
  company: 'Company or organisation',
}

/** Older saves used a three-way split; parseState maps them onto the partner's. */
export const LEGACY_BUSINESS_TYPES: Record<string, BusinessType> = {
  sole_trader: 'individual', nonprofit: 'company', individual: 'individual', company: 'company',
}

/** How the company is set up — which values apply per country lives in requirements.ts. */
export type CompanyStructure =
  | 'sole_proprietorship' | 'single_member_llc' | 'multi_member_llc'
  | 'private_partnership' | 'public_partnership' | 'private_corporation' | 'public_corporation'
  | 'incorporated_partnership' | 'unincorporated_partnership' | 'unincorporated_association' | 'trust'
  | 'incorporated_non_profit' | 'unincorporated_non_profit' | 'registered_charity'

export type SupportedCountry = 'US' | 'CA' | 'AU' | 'NZ' | 'GB'

/** Settlement currency follows the registration country. */
export const COUNTRY_CURRENCY: Record<SupportedCountry, string> = { US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', GB: 'GBP' }

export function currencyFor(country: string): string {
  return (COUNTRY_CURRENCY as Record<string, string>)[country] ?? 'USD'
}

/** Why our payments partner declined the business — its account-level reasons (platform-initiated ones are Maropost's, not modelled). */
export type DeclineReason = 'fraud' | 'incomplete_verification' | 'listed' | 'terms_of_service' | 'other'

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  fraud: 'Suspected fraud',
  incomplete_verification: 'Incomplete verification',
  listed: 'Listed business',
  terms_of_service: 'Terms of service',
  other: 'Other',
}

export const DECLINE_REASON_COPY: Record<DeclineReason, string> = {
  fraud: 'They found activity they consider fraudulent.',
  incomplete_verification: 'They couldn’t verify the business or the people behind it from what was provided.',
  listed: 'The business appears on a list they can’t onboard from.',
  terms_of_service: 'The business doesn’t meet the terms of the payments agreement.',
  other: 'They didn’t give a reason we can show here.',
}

/** Why a payment method was declined for this business — a capability-level reason. */
export type MethodDeclineReason = 'unsupported_business' | 'other'

export const METHOD_DECLINE_COPY: Record<MethodDeclineReason, string> = {
  unsupported_business: 'Not available for this business — our payments partner doesn’t support it for what you sell.',
  other: 'Not approved for this business.',
}

export type PersonRole = 'owner' | 'director' | 'executive'

export type PayButtonLabel = 'pay' | 'place_order' | 'complete_purchase'

/** `{amount}` is replaced at checkout. */
export const PAY_BUTTON_LABELS: Record<PayButtonLabel, string> = {
  pay: 'Pay {amount}',
  place_order: 'Place order',
  complete_purchase: 'Complete purchase',
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Mondays', tuesday: 'Tuesdays', wednesday: 'Wednesdays', thursday: 'Thursdays', friday: 'Fridays',
}

/** A monthly anchor of 31 means "the last day" — shorter months pay out on their last day, as the partner does. */
export const LAST_DAY_OF_MONTH = 31

/** Days after a missed partner deadline before payments pause too (payouts pause at the deadline). */
export const THRESHOLD_ESCALATION_DAYS = 7

/** Recorded with the terms acceptance, as the partner requires — a documentation-range address in this prototype. */
export const MOCK_CLIENT_IP = '203.0.113.24'

// The six state dimensions (plan §4 "Keep distinct states visible").
export type SetupState = 'not_started' | 'in_progress' | 'submitted'
export type VerificationState = 'not_submitted' | 'under_review' | 'action_required' | 'verified' | 'rejected'
export type EligibilityState = 'unknown' | 'eligible' | 'unsupported'
/** `inactive` = not switched on yet (pre-verification); `disabled` = switched off (rejected). */
export type PaymentCapability = 'inactive' | 'enabled' | 'restricted' | 'disabled'
export type PayoutCapability = 'inactive' | 'ready' | 'action_required' | 'paused'
/** `needs_setup` is derived from the store's checklist — never stored. */
export type StoreActivationState = 'inactive' | 'needs_setup' | 'ready_to_activate' | 'live'
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
  | 'm09' | 'm10' | 'm11' | 'm12' | 'm13' | 'm14' | 'm15' | 'm16' | 'm17'

// ── Results ───────────────────────────────────────────────────────────────

export type MaropayErrorCode =
  | 'permission_denied' | 'not_found' | 'requirement_pending' | 'unsupported_country'
  | 'store_not_live' | 'method_unavailable' | 'invalid_amount' | 'refund_exceeds_remaining'
  | 'insufficient_balance' | 'stale_state' | 'network_timeout' | 'step_up_required'
  | 'deadline_passed' | 'nothing_to_pay' | 'invalid_input' | 'amount_restricted'

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

/**
 * A person behind the business — the representative, or an owner, director or
 * executive. Full ID numbers never exist on this type: only the last four
 * digits of a US SSN, and only when the partner asks for them.
 */
export interface Person {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  /** Job title (representative and executives). */
  title: string
  /** ISO date 'YYYY-MM-DD', or '' when not given. */
  dob: string
  address: PostalAddress
  roles: { owner: boolean; director: boolean; executive: boolean }
  percentOwnership: number | null
  ssnLast4: string | null
}

export function emptyPerson(id: string, country: string): Person {
  return {
    id, firstName: '', lastName: '', email: '', phone: '', title: '', dob: '',
    address: { line1: '', city: '', region: '', postalCode: '', country },
    roles: { owner: false, director: false, executive: false },
    percentOwnership: null,
    ssnLast4: null,
  }
}

export function personName(p: Pick<Person, 'firstName' | 'lastName'>): string {
  return `${p.firstName} ${p.lastName}`.trim()
}

/** The partner's date-of-birth shape; null when the date is missing or malformed. */
export function dobParts(iso: string): { day: number; month: number; year: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

/** Older saves kept one `{ name, title, email }`; the name is split on its last space (one word → first name only). */
export function personFromLegacy(legacy: { name?: string; title?: string; email?: string } | null | undefined, id: string, country: string): Person {
  const person = emptyPerson(id, country)
  const name = (legacy?.name ?? '').trim()
  const cut = name.lastIndexOf(' ')
  person.firstName = cut === -1 ? name : name.slice(0, cut)
  person.lastName = cut === -1 ? '' : name.slice(cut + 1)
  person.title = legacy?.title ?? ''
  person.email = legacy?.email ?? ''
  return person
}

/** The representative's fixed person id in a draft and on the business. */
export const REPRESENTATIVE_ID = 'per_rep'

export interface BusinessDetails {
  legalName: string
  tradingName: string
  /** EIN, Business number, ABN, NZBN or Company number — the partner's `tax_id`, labelled per country. */
  taxId: string
  /** The AU Company Number (ACN); empty elsewhere. */
  registrationNumber: string
  structure: CompanyStructure | null
  phone: string
  /** Merchant category code from the illustrative industry list. */
  mcc: string | null
  website: string
  /** US only: no website, describing the products instead. */
  noWebsite: boolean
  productDescription: string
  address: PostalAddress
}

export interface LegalBusiness extends BusinessDetails {
  id: string
  type: BusinessType
  /** ISO-2 registration country — where the business is registered, not where it sells. */
  country: string
  /** The representative first, then owners, directors and executives. */
  persons: Person[]
  representativeId: string
  publicDetails: { statementDescriptor: string; supportEmail: string; supportPhone: string }
}

export function representativeOf(business: Pick<LegalBusiness, 'persons' | 'representativeId'>): Person | null {
  return business.persons.find((p) => p.id === business.representativeId) ?? business.persons[0] ?? null
}

/** Masked payout bank account — only the last four digits of the account number ever reach state. */
export interface PayoutDestination {
  bankName: string
  last4: string
  holderName: string
  /** Routing number, sort code or the country's institution number — not the account number, so it is kept. */
  routingNumber: string
  currency: string
  country: string
  holderType: 'individual' | 'company' | null
  addedAt: string
}

export interface PayoutSchedule {
  interval: 'daily' | 'weekly' | 'monthly'
  weeklyAnchor: Weekday | null
  /** 1–31; 31 stands for the last day of the month. */
  monthlyAnchor: number | null
  /** Business days a payment is held before it can be paid out. */
  delayDays: number
}

/** The partner's default, and the platform minimum a merchant can't go below. */
export const DEFAULT_PAYOUT_SCHEDULE: PayoutSchedule = { interval: 'daily', weeklyAnchor: null, monthlyAnchor: null, delayDays: 2 }

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
  declineReason: DeclineReason | null
  declinedAt: string | null
  /** Verified details reused from an existing processor account (M05) — fewer questions, never instant approval. */
  reusedVerifiedDetails: boolean
  payoutDestination: PayoutDestination | null
  payoutSchedule: PayoutSchedule
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
  /** How this store's checkout looks (E4a). */
  checkout: CheckoutSettings
  /** Enabled method ids in the order shoppers see them; ids not listed follow the catalogue order. */
  methodOrder: string[]
  defaultMethodId: string | null
  methodSettings: Record<string, MethodSettings>
  /** The "Maropay is live" notice was dismissed on the store page. */
  activationNoticeDismissedAt: string | null
}

export interface CheckoutSettings {
  useStoreTheme: boolean
  /** Name and size only — the file itself is never kept. */
  logo: { name: string; sizeLabel: string } | null
  payButtonLabel: PayButtonLabel
  showSupportContact: boolean
  /** Apple Pay, Google Pay and PayPal as one-tap express buttons above the checkout form. */
  expressWallets: boolean
}

export function defaultCheckoutSettings(): CheckoutSettings {
  return { useStoreTheme: true, logo: null, payButtonLabel: 'pay', showSupportContact: true, expressWallets: true }
}

export interface MethodSettings {
  displayName: string | null
  minOrder: Money | null
  maxOrder: Money | null
  /** `automatic_only` captures this method straight away even when the store captures manually. */
  capture: 'follow_store' | 'automatic_only'
}

export function defaultMethodSettings(): MethodSettings {
  return { displayName: null, minOrder: null, maxOrder: null, capture: 'follow_store' }
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
  /** The shopper approves on the provider's own page (PayPal, buy now pay later). */
  redirects: boolean
  availability: MethodAvailability
  reviewNote: string | null
  /** Maropost's pre-screening answers sent with a review request — kept account-side because approval is account-wide. Not partner data. */
  requested: { at: string; channelId: string | null; answers: Record<string, string> } | null
  declineReason: MethodDeclineReason | null
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
  /** Recorded with the acceptance, as the partner requires (the IP is a mock in this prototype). */
  acceptedIp: string | null
  acceptedUserAgent: string | null
}

export type TaskKind = 'verification' | 'bank' | 'method_review' | 'dispute' | 'payout_failed' | 'owner_review' | 'business_change' | 'activate_store'

/** Verified legal details that change only once our payments partner re-checks them. `registrationNumber` is the AU ACN. */
export type BusinessChangeField = 'legalName' | 'tradingName' | 'taxId' | 'registrationNumber' | 'website'

export const BUSINESS_CHANGE_LABELS: Record<BusinessChangeField, string> = {
  legalName: 'Legal business name',
  tradingName: 'Trading name',
  taxId: 'Tax ID',
  registrationNumber: 'ACN',
  website: 'Website',
}

/** A dotted partner requirement key, e.g. 'representative.verification.document' or 'company.tax_id'. */
export type RequirementKey = string

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
  /** Partner-keyed requirements (verification tasks): what is asked for, and why the last attempt failed. Written only when set. */
  requirement?: RequirementKey
  personId?: string
  /** The partner's error code — for support, never shown to merchants. */
  errorCode?: string
  /** The reason in the merchant's words. */
  errorReason?: string
  /** Keys that satisfy the requirement instead (e.g. a document instead of keyed data). */
  alternative?: RequirementKey[]
  /** What the merchant sent — name and size only. */
  documents?: { front: MockDocument; back: MockDocument | null }
  /** Threshold tasks: when payments pause too (payouts pause at `dueAt`). */
  paymentsPauseAt?: string
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
  business: BusinessDetails
  representative: Person
  /** Owners, directors and executives (the representative is not repeated here). */
  persons: Person[]
  /** "I have added everyone" — one per role the country asks about; owner-only. */
  attestations: { owners: boolean; directors: boolean; executives: boolean }
  payout: {
    holderName: string
    bankName: string
    last4: string
    routingNumber: string
    currency: string
    country: string
    holderType: 'individual' | 'company' | null
  } | null
  publicDetails: { statementDescriptor: string; supportEmail: string; supportPhone: string }
  submittedAt: string | null
}

/** One cart line at checkout; `price` is the unit price as a decimal string. */
export interface CheckoutLineItem {
  product: string
  sku: string
  qty: number
  price: string
}

/** Enough of a checkout-created order to rebuild it after reload (Commerce is not persisted). */
export interface CheckoutOrderSnapshot {
  id: number
  orderNumber: string
  date: string
  customer: { name: string; email: string }
  lineItems: CheckoutLineItem[]
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
  lineItems: CheckoutLineItem[]
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

/** A quiet glyph per history kind (Lucide names), for activity rows. */
export const HISTORY_KIND_ICONS: Record<HistoryKind, string> = {
  setup: 'list-checks',
  terms: 'file-text',
  verification: 'shield-check',
  business: 'building-2',
  store: 'store',
  account: 'wallet',
  methods: 'credit-card',
  bank: 'landmark',
  payout: 'banknote',
  refund: 'undo-2',
  dispute: 'shield-alert',
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
  /** Methods a newly linked store starts with (Settings › Payment methods). */
  defaultMethodIds: string[]
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
export const METHOD_CATALOG: ReadonlyArray<Omit<PaymentMethodCatalogEntry, 'availability' | 'reviewNote' | 'requested' | 'declineReason'>> = [
  { id: 'card', label: 'Cards', category: 'cards', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false, redirects: false },
  { id: 'apple_pay', label: 'Apple Pay', category: 'wallets', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false, redirects: false },
  { id: 'google_pay', label: 'Google Pay', category: 'wallets', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(290, 30, '2.9% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false, redirects: false },
  { id: 'paypal', label: 'PayPal', category: 'wallets', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(349, 49, '3.49% + 49¢'), requirements: [], supportsManualCapture: true, delayed: false, redirects: true },
  { id: 'klarna', label: 'Klarna', category: 'bnpl', currencies: ['USD', 'AUD', 'NZD', 'GBP', 'EUR'], rate: rate(599, 30, '5.99% + 30¢'), requirements: ['Refund and returns policy URL', 'Typical order value range'], supportsManualCapture: true, delayed: false, redirects: true },
  { id: 'afterpay_clearpay', label: 'Afterpay', category: 'bnpl', currencies: ['USD', 'CAD', 'AUD', 'NZD', 'GBP'], rate: rate(600, 30, '6% + 30¢'), requirements: [], supportsManualCapture: true, delayed: false, redirects: true },
  { id: 'affirm', label: 'Affirm', category: 'bnpl', currencies: ['USD', 'CAD'], rate: rate(599, 0, '5.99%'), requirements: [], supportsManualCapture: false, delayed: false, redirects: true },
  { id: 'us_bank_account', label: 'ACH Direct Debit', category: 'local', currencies: ['USD'], rate: rate(80, 0, '0.8%, max $5.00', 500), requirements: [], supportsManualCapture: false, delayed: true, redirects: false },
  { id: 'ideal', label: 'iDEAL', category: 'local', currencies: ['EUR'], rate: rate(0, 29, '€0.29'), requirements: [], supportsManualCapture: false, delayed: false, redirects: false },
  { id: 'sepa_debit', label: 'SEPA Direct Debit', category: 'local', currencies: ['EUR'], rate: rate(80, 0, '0.8%, max €5.00', 500), requirements: [], supportsManualCapture: false, delayed: true, redirects: false },
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
    requested: null,
    declineReason: null,
  }))
}

/** What `defaultMethodIds` starts as — the methods a newly linked store is switched on with. */
export const INITIAL_DEFAULT_METHOD_IDS = ['card', 'apple_pay', 'google_pay']

export function illustrativeTerms(currency: string): CommercialTerms {
  return {
    version: '2026-09-illustrative',
    effectiveAt: '2026-09-01T00:00:00.000Z',
    processorName: 'Stripe',
    processorAgreementName: 'Stripe Connected Account Agreement',
    disputeFee: money(1500, currency),
    acceptedAt: null,
    acceptedBy: null,
    acceptedIp: null,
    acceptedUserAgent: null,
  }
}

export function emptyBusinessDetails(country: string): BusinessDetails {
  return {
    legalName: '', tradingName: '', taxId: '', registrationNumber: '', structure: null, phone: '', mcc: null,
    website: '', noWebsite: false, productDescription: '',
    address: { line1: '', city: '', region: '', postalCode: '', country },
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
    business: emptyBusinessDetails('US'),
    representative: emptyPerson(REPRESENTATIVE_ID, 'US'),
    persons: [],
    attestations: { owners: false, directors: false, executives: false },
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
    defaultMethodIds: [...INITIAL_DEFAULT_METHOD_IDS],
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

type Raw = Record<string, unknown>

function record(value: unknown): Raw | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : null
}

/** Business details from any save: the single `registrationNumber` older saves kept was the tax ID. */
function withBusinessDefaults(raw: unknown, country: string): BusinessDetails {
  const r = record(raw) ?? {}
  const base = emptyBusinessDetails(country)
  const legacy = typeof r.taxId !== 'string'
  return {
    ...base,
    ...r,
    taxId: typeof r.taxId === 'string' ? r.taxId : typeof r.registrationNumber === 'string' ? r.registrationNumber : '',
    registrationNumber: legacy ? '' : typeof r.registrationNumber === 'string' ? r.registrationNumber : '',
    structure: (r.structure as CompanyStructure | null | undefined) ?? null,
    phone: typeof r.phone === 'string' ? r.phone : '',
    mcc: typeof r.mcc === 'string' ? r.mcc : null,
    noWebsite: r.noWebsite === true,
    productDescription: typeof r.productDescription === 'string' ? r.productDescription : '',
    address: { ...base.address, ...(record(r.address) ?? {}) },
  } as BusinessDetails
}

function withPersonDefaults(raw: unknown, id: string, country: string): Person {
  const r = record(raw)
  // An older `{ name, title, email }` object has no firstName.
  if (!r || typeof r.firstName !== 'string') return personFromLegacy(r as { name?: string } | null, id, country)
  const base = emptyPerson(typeof r.id === 'string' ? r.id : id, country)
  return {
    ...base,
    ...r,
    address: { ...base.address, ...(record(r.address) ?? {}) },
    roles: { ...base.roles, ...(record(r.roles) ?? {}) },
  } as Person
}

function withBankDefaults<T extends { country?: unknown; routingNumber?: unknown; holderType?: unknown }>(raw: T, country: string): T & { routingNumber: string; country: string; holderType: 'individual' | 'company' | null } {
  return {
    ...raw,
    routingNumber: typeof raw.routingNumber === 'string' ? raw.routingNumber : '',
    country: typeof raw.country === 'string' ? raw.country : country,
    holderType: raw.holderType === 'individual' || raw.holderType === 'company' ? raw.holderType : null,
  }
}

function legacyBusinessType(value: unknown): BusinessType | null {
  return typeof value === 'string' ? LEGACY_BUSINESS_TYPES[value] ?? null : null
}

function migrateDraft(raw: unknown, base: OnboardingDraft): OnboardingDraft {
  const r = record(raw) ?? {}
  const country = typeof r.country === 'string' ? r.country : base.country
  const businessType = legacyBusinessType(r.businessType)
  const business = withBusinessDefaults(r.business, country)
  // A legacy non-profit was a business type; now it is a company structure.
  if (r.businessType === 'nonprofit' && !business.structure) business.structure = 'incorporated_non_profit'
  const payoutRaw = record(r.payout)
  // Documents are only ever partner-requested now, so a first-phase save's optional photo ID has nothing to attach to.
  const rest = { ...r }
  delete rest.idDocument
  return {
    ...base,
    ...rest,
    businessType,
    business,
    representative: withPersonDefaults(r.representative, REPRESENTATIVE_ID, country),
    persons: Array.isArray(r.persons) ? r.persons.map((p, i) => withPersonDefaults(p, `per_${i + 1}`, country)) : [],
    attestations: { ...base.attestations, ...(record(r.attestations) ?? {}) },
    payout: payoutRaw ? withBankDefaults(payoutRaw as NonNullable<OnboardingDraft['payout']>, country) : null,
  } as OnboardingDraft
}

function migrateBusiness(raw: unknown): LegalBusiness | null {
  const r = record(raw)
  if (!r) return null
  const country = typeof r.country === 'string' ? r.country : 'US'
  const persons = Array.isArray(r.persons)
    ? r.persons.map((p, i) => withPersonDefaults(p, i === 0 ? REPRESENTATIVE_ID : `per_${i}`, country))
    : [withPersonDefaults(r.representative, REPRESENTATIVE_ID, country)]
  const { representative: _legacy, ...rest } = r
  return {
    ...rest,
    ...withBusinessDefaults(r, country),
    id: typeof r.id === 'string' ? r.id : '',
    type: legacyBusinessType(r.type) ?? 'company',
    country,
    persons,
    representativeId: typeof r.representativeId === 'string' ? r.representativeId : REPRESENTATIVE_ID,
    publicDetails: { statementDescriptor: '', supportEmail: '', supportPhone: '', ...(record(r.publicDetails) ?? {}) },
  } as LegalBusiness
}

function migrateAccount(raw: unknown): MaropayAccount | null {
  const r = record(raw)
  if (!r) return null
  const { rejectedReason: _legacy, ...rest } = r
  const destination = record(r.payoutDestination)
  return {
    ...rest,
    closedAt: (r.closedAt as string | null | undefined) ?? null,
    declineReason: (r.declineReason as DeclineReason | null | undefined) ?? (r.verification === 'rejected' ? 'other' : null),
    declinedAt: (r.declinedAt as string | null | undefined) ?? null,
    payoutDestination: destination ? withBankDefaults(destination as unknown as PayoutDestination, typeof r.country === 'string' ? r.country : 'US') : null,
    payoutSchedule: { ...DEFAULT_PAYOUT_SCHEDULE, ...(record(r.payoutSchedule) ?? {}) },
  } as MaropayAccount
}

/** Older business-change requests for the single "registration number" meant the tax ID. */
function migrateTask(task: ActionTask): ActionTask {
  if (task.kind === 'business_change' && task.change?.field === 'registrationNumber') {
    return { ...task, change: { ...task.change, field: 'taxId' } }
  }
  return task
}

/** A first-phase session held one product as `lineItem`. */
function migrateSession(session: CheckoutSession & { lineItem?: Omit<CheckoutLineItem, 'qty'> }): CheckoutSession {
  if (Array.isArray(session.lineItems)) return session
  const { lineItem, ...rest } = session
  return { ...rest, lineItems: lineItem ? [{ ...lineItem, qty: 1 }] : [] }
}

/** Saved methods in catalogue order; methods added to the catalogue since the save (PayPal) join with their fresh availability. */
function migrateMethods(saved: PaymentMethodCatalogEntry[], fresh: PaymentMethodCatalogEntry[]): PaymentMethodCatalogEntry[] {
  const known = new Set(fresh.map((m) => m.id))
  const restore = (m: PaymentMethodCatalogEntry, f?: PaymentMethodCatalogEntry): PaymentMethodCatalogEntry =>
    ({ ...m, redirects: m.redirects ?? f?.redirects ?? false, requested: m.requested ?? null, declineReason: m.declineReason ?? null })
  return [
    ...fresh.map((f) => { const m = saved.find((s) => s.id === f.id); return m ? restore(m, f) : f }),
    ...saved.filter((m) => !known.has(m.id)).map((m) => restore(m)),
  ]
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
  const account = migrateAccount(parsed.account)
  const country = account?.country ?? 'US'
  // Before submission the settlement currency follows the registration country, as setAccountCurrency does;
  // a first-phase save kept USD whatever the country.
  const settleIn = account && account.setup !== 'submitted' && account.currency !== currencyFor(account.country) ? currencyFor(account.country) : null
  if (account && settleIn) account.currency = settleIn
  const terms = { ...base.terms, ...(parsed.terms ?? {}) }
  return {
    ...base,
    ...parsed,
    version: 1,
    accountId,
    onboarding: migrateDraft(parsed.onboarding, base.onboarding),
    business: migrateBusiness(parsed.business),
    account,
    milestones: { ...base.milestones, ...(parsed.milestones ?? {}) },
    terms: settleIn ? { ...terms, disputeFee: money(terms.disputeFee.amount, settleIn) } : terms,
    bindings: list(parsed.bindings, []).map((b) => ({
      ...b,
      checkout: { ...defaultCheckoutSettings(), ...(record(b.checkout) ?? {}) },
      methodOrder: Array.isArray(b.methodOrder) ? b.methodOrder : [],
      defaultMethodId: typeof b.defaultMethodId === 'string' ? b.defaultMethodId : null,
      methodSettings: record(b.methodSettings) ? (b.methodSettings as Record<string, MethodSettings>) : {},
      activationNoticeDismissedAt: b.activationNoticeDismissedAt ?? null,
    })),
    methods: settleIn
      ? catalogFor(settleIn)
      : migrateMethods(list(parsed.methods, base.methods), base.methods),
    payments: list(parsed.payments, []).filter((p) => isMoney(p.amount)).map((p) => ({ ...p, orderId: typeof p.orderId === 'number' ? p.orderId : null })),
    disputes: list(parsed.disputes, []),
    payouts: list(parsed.payouts, []).map((po) => ({ ...po, destination: withBankDefaults(po.destination, country) })),
    movements: list(parsed.movements, []).filter((m) => isMoney(m.net)),
    tasks: list(parsed.tasks, []).map(migrateTask),
    sessions: list(parsed.sessions, []).map(migrateSession),
    history: list(parsed.history, []),
    defaultMethodIds: list(parsed.defaultMethodIds, base.defaultMethodIds),
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
  rejected: 'Declined',
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
  needs_setup: 'Needs setup',
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
