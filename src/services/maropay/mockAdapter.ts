/**
 * Deterministic mock of the processor side of Maropay.
 *
 * Each operation takes the account state, validates, then mutates it in place
 * and returns a Result — validation always runs first, so a failed operation
 * leaves state untouched. Permissions are checked here as well as in the UI
 * (the "server" of this prototype). Financial operations take an idempotency
 * key: repeating a key returns the original outcome instead of acting twice.
 *
 * No randomness: ids come from the persisted counters, outcomes from rules and
 * the reviewer's FailurePlan. A production adapter would implement the same
 * operations against authenticated Maropost endpoints.
 *
 * Pure module — relative `.ts` imports only (see src/maropay/money.ts).
 */
import { applyRate, formatMoney, isPositive, negate, subtract, sum, toDecimal, zero } from '../../maropay/money.ts'
import type { Money } from '../../maropay/money.ts'
import {
  BUSINESS_CHANGE_LABELS,
  DEFAULT_METHOD_IDS,
  PAYMENT_STATUS_RANK,
  PROVIDER_LABELS,
  canForStore,
  canTransition,
  daysFrom,
  fail,
  isoAt,
  localDateKey,
  nextId,
  nextNumber,
  ok,
} from '../../maropay/model.ts'
import type {
  ActionTask,
  BusinessChangeField,
  CaptureMode,
  CheckoutOrderSnapshot,
  CheckoutSession,
  Dispute,
  DisputeReason,
  EvidenceItem,
  HistoryKind,
  LegalBusiness,
  MaropayAccount,
  MaropayAccountState,
  MaropayAction,
  MaropayActingRole,
  MockDocument,
  OnboardingDraft,
  OnboardingStepKey,
  Payment,
  PaymentEventKind,
  PaymentStatus,
  Payout,
  Refund,
  Result,
  ShopperFlow,
  StoreBinding,
} from '../../maropay/model.ts'
import {
  activationChecklist,
  canAcceptDispute,
  canCapture,
  canRefund,
  canSubmitEvidence,
  canVoid,
  checkoutMethods,
  closureChecks,
  deriveCapabilities,
  formatDay,
  isSupportedCountry,
  settledStatus,
} from '../../maropay/readiness.ts'
import type { ChannelFacts } from '../../maropay/readiness.ts'
import { EDITABLE_DRAFT_FIELDS, descriptorIssue, isEmail, submissionIssues } from '../../maropay/onboarding.ts'
import type { EditableDraftField, OnboardingPatch } from '../../maropay/onboarding.ts'

// ── Environment ───────────────────────────────────────────────────────────

/** Reviewer-controlled failures. Each one-shot switch resets after it fires. */
export interface FailurePlan {
  /** What the next refund does. */
  refundOutcome: 'succeed' | 'pending' | 'fail' | 'insufficient_balance'
  /** The next financial call times out without applying (retry with the same key succeeds). */
  timeoutNext: boolean
  checkoutValidationFails: boolean
  /** Submissions go to manual review instead of instant verification. */
  reviewDelay: boolean
}

export function defaultFailures(): FailurePlan {
  return { refundOutcome: 'succeed', timeoutNext: false, checkoutValidationFails: false, reviewDelay: false }
}

export interface AdapterEnv {
  now: number
  actor: { role: MaropayActingRole; assignedChannelIds: string[] | null }
  failures: FailurePlan
}

/** Mock step-up code shown in the prototype's own hint. */
export const STEP_UP_CODE = '246810'
const STEP_UP_TTL_MS = 5 * 60_000

function denied<T>(message: string): Result<T> {
  return fail('permission_denied', message)
}

const CLOSED = 'This Maropay account is closed.'

function allowed(env: AdapterEnv, action: MaropayAction, channelId: string | null = null): boolean {
  return canForStore(env.actor.role, action, channelId, env.actor.assignedChannelIds)
}

/** One-shot timeout: fires once, then the retry goes through. */
function consumeTimeout<T>(env: AdapterEnv): Result<T> | null {
  if (!env.failures.timeoutNext) return null
  env.failures.timeoutNext = false
  return fail('network_timeout', 'The request timed out before we heard back. Nothing was changed — try again.', true)
}

/** Reading records. In the prototype only the reviewer's one-shot timeout can fail it. */
export function readRecords(env: AdapterEnv): Result<null> {
  return consumeTimeout<null>(env) ?? ok(null)
}

function log(state: MaropayAccountState, env: AdapterEnv, kind: HistoryKind, text: string, channelId: string | null = null): void {
  state.history.unshift({ id: nextId(state, 'his'), at: isoAt(env.now), actor: env.actor.role, kind, channelId, text })
}

function event(state: MaropayAccountState, payment: Payment, env: AdapterEnv, kind: PaymentEventKind, text: string): void {
  payment.timeline.push({ id: nextId(state, 'evt'), at: isoAt(env.now), kind, text })
}

function findPayment(state: MaropayAccountState, paymentId: string): Payment | undefined {
  return state.payments.find((p) => p.id === paymentId)
}

function findBinding(state: MaropayAccountState, channelId: string): StoreBinding | undefined {
  return state.bindings.find((b) => b.channelId === channelId)
}

function addTask(state: MaropayAccountState, env: AdapterEnv, task: Omit<ActionTask, 'id' | 'createdAt' | 'resolvedAt' | 'status'>): ActionTask {
  const created: ActionTask = { ...task, id: nextId(state, 'task'), status: 'open', createdAt: isoAt(env.now), resolvedAt: null }
  state.tasks.push(created)
  return created
}

function resolveTasks(state: MaropayAccountState, env: AdapterEnv, match: (t: ActionTask) => boolean): void {
  for (const t of state.tasks) {
    if (t.status !== 'resolved' && match(t)) {
      t.status = 'resolved'
      t.resolvedAt = isoAt(env.now)
    }
  }
}

// ── Onboarding ────────────────────────────────────────────────────────────

export function newBinding(state: MaropayAccountState, channelId: string, now: number, captureMode: CaptureMode = 'automatic'): StoreBinding {
  const binding: StoreBinding = {
    id: nextId(state, 'bind'),
    accountId: state.accountId,
    channelId,
    activation: 'inactive',
    enabledMethodIds: [...DEFAULT_METHOD_IDS],
    captureMode,
    previousProvider: null,
    checkoutValidation: { status: 'not_run', at: null, failureReason: null },
    impactReviewedAt: null,
    linkedAt: isoAt(now),
    activatedAt: null,
    deactivatedAt: null,
  }
  state.bindings.push(binding)
  return binding
}

/** Opens a connected account in setup and seeds the wizard (Maropost owns the journey, the processor owns the account). */
export function startOnboarding(
  state: MaropayAccountState,
  input: { businessChoice: 'existing' | 'new'; reuseVerifiedDetails: boolean; prefill: Partial<OnboardingDraft> },
  env: AdapterEnv,
): Result<MaropayAccount> {
  if (!allowed(env, 'edit_onboarding')) return denied('Store operations users can’t start Maropay setup.')
  if (state.account) return ok(state.account)
  const at = isoAt(env.now)
  const account: MaropayAccount = {
    id: nextId(state, 'mpa'),
    processorAccountRef: `acct_mp${state.accountId}`,
    businessId: state.business?.id ?? nextId(state, 'bus'),
    country: input.prefill.country ?? state.onboarding.country,
    currency: 'USD',
    setup: 'in_progress',
    verification: 'not_submitted',
    eligibility: 'unknown',
    rejectedReason: null,
    reusedVerifiedDetails: input.reuseVerifiedDetails,
    payoutDestination: null,
    payoutSchedule: { interval: 'daily', delayDays: 2 },
    createdAt: at,
    submittedAt: null,
    verifiedAt: null,
    closedAt: null,
  }
  state.account = account
  state.onboarding = {
    ...state.onboarding,
    ...input.prefill,
    startedAt: at,
    businessChoice: input.businessChoice,
    reuseVerifiedDetails: input.reuseVerifiedDetails,
  }
  log(state, env, 'setup', input.reuseVerifiedDetails ? 'Started Maropay setup with verified details from an existing account' : 'Started Maropay setup')
  return ok(account)
}

/**
 * Saves the wizard's answers as the merchant goes. `complete` marks the step
 * done; `next` is where setup resumes. Terms and the payout account have their
 * own owner-only operations, so they can't ride along in a draft save.
 */
export function saveOnboardingStep(
  state: MaropayAccountState,
  step: OnboardingStepKey,
  patch: OnboardingPatch,
  options: { complete?: boolean; next?: OnboardingStepKey },
  env: AdapterEnv,
): Result<OnboardingDraft> {
  if (!allowed(env, 'edit_onboarding')) return denied('Store operations users can’t edit Maropay setup.')
  const account = state.account
  if (!account) return fail('requirement_pending', 'Start Maropay setup first.')
  if (account.setup === 'submitted') return fail('invalid_input', 'Setup has already been submitted.')
  if (Object.keys(patch).some((key) => !EDITABLE_DRAFT_FIELDS.includes(key as EditableDraftField))) {
    return fail('invalid_input', 'Terms and payout details have their own owner-only actions.')
  }
  const draft = state.onboarding
  if (patch.authorityConfirmed !== undefined && patch.authorityConfirmed !== draft.authorityConfirmed && env.actor.role !== 'owner') {
    return denied('Only the business owner or an authorised representative can confirm authority.')
  }
  Object.assign(draft, JSON.parse(JSON.stringify(patch)) as OnboardingPatch)
  // The registered address is in the registration country by definition.
  draft.business.address.country = draft.country
  if (patch.country !== undefined) {
    account.country = patch.country
    account.eligibility = isSupportedCountry(patch.country) ? 'eligible' : 'unsupported'
  }
  if (options.complete && !draft.completedSteps.includes(step)) draft.completedSteps = [...draft.completedSteps, step]
  draft.lastStep = options.next ?? step
  return ok(draft)
}

/**
 * Submits setup for review. Separates submission from approval: the outcome is
 * verified, under review, or action required — never assumed.
 */
export function submitOnboarding(state: MaropayAccountState, env: AdapterEnv): Result<{ outcome: MaropayAccount['verification'] }> {
  if (!allowed(env, 'submit_onboarding')) {
    return denied('Only the business owner or an authorised representative can submit Maropay setup. Save your progress and ask them to review it.')
  }
  const draft = state.onboarding
  const account = state.account
  if (!account) return fail('requirement_pending', 'Start Maropay setup first.')
  if (!isSupportedCountry(draft.country)) {
    return fail('unsupported_country', 'Maropay isn’t available for businesses registered in this country yet.')
  }
  if (account.setup === 'submitted') return ok({ outcome: account.verification })
  // Content, not the wizard's progress markers, decides whether setup is complete.
  const missing = submissionIssues(draft, state.terms.version)
  const payout = draft.payout
  if (missing.length || !payout) return fail('requirement_pending', missing[0]?.message ?? 'Add a payout bank account before you submit.')

  const at = isoAt(env.now)
  state.business = {
    id: account.businessId,
    legalName: draft.business.legalName,
    tradingName: draft.business.tradingName,
    type: draft.businessType ?? 'company',
    country: draft.country,
    registrationNumber: draft.business.registrationNumber,
    address: { ...draft.business.address },
    website: draft.business.website,
    representative: { ...draft.representative },
    publicDetails: { ...draft.publicDetails },
  }
  account.country = draft.country
  account.setup = 'submitted'
  account.eligibility = 'eligible'
  account.submittedAt = at
  account.reusedVerifiedDetails = draft.reuseVerifiedDetails
  account.payoutDestination = { ...payout, addedAt: at }
  draft.submittedAt = at
  resolveTasks(state, env, (t) => t.kind === 'owner_review')

  let outcome: MaropayAccount['verification']
  if (!draft.idDocument && !draft.reuseVerifiedDetails) {
    outcome = 'action_required'
    addTask(state, env, {
      kind: 'verification',
      title: `Upload a photo ID for ${draft.representative.name || 'your representative'}`,
      description: 'Our payments partner needs to confirm who represents the business before payments can be enabled.',
      affects: ['payments', 'payouts'],
      dueAt: daysFrom(env.now, 5),
      blocking: true,
      role: 'owner',
      step: 'verify',
      disputeId: null,
      payoutId: null,
      methodId: null,
      channelId: null,
    })
  } else if (env.failures.reviewDelay) {
    outcome = 'under_review'
  } else {
    outcome = 'verified'
    account.verifiedAt = at
  }
  account.verification = outcome
  for (const channelId of draft.channelIds) if (!findBinding(state, channelId)) newBinding(state, channelId, env.now)
  log(state, env, 'setup', 'Submitted Maropay setup for review')
  if (outcome === 'verified') log(state, env, 'verification', 'Business verified by our payments partner')
  return ok({ outcome })
}

/** Supplies the information a verification or bank task asked for. */
export function resolveTask(
  state: MaropayAccountState,
  taskId: string,
  payload: { document?: MockDocument; confirmed?: boolean },
  env: AdapterEnv,
): Result<ActionTask> {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return fail('not_found', 'That task no longer exists.')
  if (task.status === 'resolved') return ok(task)
  if (!allowed(env, 'resolve_task')) return denied('Only the business owner can provide verification or bank information.')
  if (task.kind === 'verification') {
    if (!payload.document) return fail('invalid_input', 'Attach the requested document.')
    state.onboarding.idDocument = payload.document
    task.status = 'waiting_review'
    if (state.account) state.account.verification = 'under_review'
    log(state, env, 'verification', `Provided: ${task.title}`)
    return ok(task)
  }
  if (task.kind === 'bank' || task.kind === 'owner_review') {
    if (task.kind === 'bank' && !payload.confirmed) return fail('invalid_input', 'Confirm the bank account details.')
    task.status = 'resolved'
    task.resolvedAt = isoAt(env.now)
    log(state, env, task.kind === 'bank' ? 'bank' : 'setup', `Resolved: ${task.title}`)
    return ok(task)
  }
  return fail('invalid_input', 'This task is resolved from its own page.')
}

/** Reviewer control: what our payments partner decides after manual review. */
export function simulateReviewOutcome(state: MaropayAccountState, decision: 'verified' | 'rejected' | 'more_info', env: AdapterEnv): Result<MaropayAccount> {
  const account = state.account
  if (!account || account.setup !== 'submitted') return fail('requirement_pending', 'Submit setup first.')
  const at = isoAt(env.now)
  if (decision === 'verified') {
    account.verification = 'verified'
    account.verifiedAt = at
    resolveTasks(state, env, (t) => t.kind === 'verification')
    log(state, env, 'verification', 'Business verified by our payments partner')
  } else if (decision === 'rejected') {
    account.verification = 'rejected'
    account.rejectedReason = 'Our payments partner couldn’t verify this business for the products it sells. You can ask for the decision to be reviewed through Maropost support.'
    resolveTasks(state, env, (t) => t.kind === 'verification')
    log(state, env, 'verification', 'Verification declined by our payments partner')
  } else {
    account.verification = 'action_required'
    resolveTasks(state, env, (t) => t.kind === 'verification')
    addTask(state, env, {
      kind: 'verification',
      title: 'Upload a clearer photo ID — the last one was unreadable',
      description: 'The document couldn’t be read. Upload a photo where every corner is visible.',
      affects: ['payments', 'payouts'],
      dueAt: daysFrom(env.now, 5),
      blocking: true,
      role: 'owner',
      step: 'verify',
      disputeId: null,
      payoutId: null,
      methodId: null,
      channelId: null,
    })
    log(state, env, 'verification', 'More information requested by our payments partner')
  }
  return ok(account)
}

// ── Stores and methods ────────────────────────────────────────────────────

export function linkStore(state: MaropayAccountState, channelId: string, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'link_store')) return denied('Only the business owner can link stores to Maropay.')
  if (!state.account || state.account.setup !== 'submitted') return fail('requirement_pending', 'Finish Maropay setup before linking more stores.')
  if (state.account.closedAt) return fail('requirement_pending', CLOSED)
  const existing = findBinding(state, channelId)
  if (existing) return ok(existing)
  const binding = newBinding(state, channelId, env.now)
  log(state, env, 'store', 'Linked a store to Maropay', channelId)
  return ok(binding)
}

/** Any change to what checkout offers invalidates the last test and the impact review. */
function resetActivationChecks(binding: StoreBinding): void {
  binding.checkoutValidation = { status: 'not_run', at: null, failureReason: null }
  binding.impactReviewedAt = null
}

export function setMethodEnabled(state: MaropayAccountState, channelId: string, methodId: string, enabled: boolean, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change payment methods.')
  const binding = findBinding(state, channelId)
  const method = state.methods.find((m) => m.id === methodId)
  if (!binding || !method) return fail('not_found', 'That store or method isn’t linked to Maropay.')
  const has = binding.enabledMethodIds.includes(methodId)
  if (enabled === has) return ok(binding)
  if (enabled) {
    if (method.availability === 'unavailable') return fail('method_unavailable', method.reviewNote ?? `${method.label} isn’t available for this account.`)
    if (method.availability === 'setup_required') {
      method.availability = 'pending_approval'
      method.reviewNote = 'Requested — our payments partner is reviewing it.'
      addTask(state, env, {
        kind: 'method_review',
        title: `${method.label} is awaiting approval`,
        description: `Shoppers won’t see ${method.label} until it’s approved. Other methods keep working.`,
        affects: [],
        dueAt: null,
        blocking: false,
        role: 'owner',
        step: null,
        disputeId: null,
        payoutId: null,
        methodId,
        channelId,
      })
    }
    binding.enabledMethodIds = [...binding.enabledMethodIds, methodId]
  } else {
    const remaining = checkoutMethods(state, { ...binding, enabledMethodIds: binding.enabledMethodIds.filter((id) => id !== methodId) })
    if (binding.activation === 'live' && remaining.length === 0) {
      return fail('invalid_input', 'A live store needs at least one ready payment method.')
    }
    binding.enabledMethodIds = binding.enabledMethodIds.filter((id) => id !== methodId)
  }
  if (binding.activation !== 'live') resetActivationChecks(binding)
  log(state, env, 'methods', `${enabled ? 'Turned on' : 'Turned off'} ${method.label}`, channelId)
  return ok(binding)
}

/** Reviewer control: the payments partner's decision on a method that needed approval. */
export function simulateMethodApproval(state: MaropayAccountState, methodId: string, approved: boolean, env: AdapterEnv): Result<null> {
  const method = state.methods.find((m) => m.id === methodId)
  if (!method || method.availability !== 'pending_approval') return fail('stale_state', 'That method isn’t awaiting approval.')
  method.availability = approved ? 'available' : 'unavailable'
  method.reviewNote = approved ? null : 'Not approved for this business.'
  if (!approved) {
    for (const b of state.bindings) b.enabledMethodIds = b.enabledMethodIds.filter((id) => id !== methodId)
  }
  resolveTasks(state, env, (t) => t.kind === 'method_review' && t.methodId === methodId)
  log(state, env, 'methods', `${method.label} ${approved ? 'approved' : 'declined'} by our payments partner`)
  return ok(null)
}

export function setCaptureMode(state: MaropayAccountState, channelId: string, mode: CaptureMode, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change capture settings.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  if (binding.captureMode === mode) return ok(binding)
  binding.captureMode = mode
  if (binding.activation !== 'live') resetActivationChecks(binding)
  log(state, env, 'methods', `Capture set to ${mode}`, channelId)
  return ok(binding)
}

/** Runs a synthetic payment through the store's checkout configuration. */
export function validateCheckout(state: MaropayAccountState, channelId: string, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'validate_checkout', channelId)) return denied('Only the business owner can run the activation test.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  const at = isoAt(env.now)
  if (!checkoutMethods(state, binding).length) {
    binding.checkoutValidation = { status: 'failed', at, failureReason: 'No payment method is ready, so checkout had nothing to offer.' }
  } else if (env.failures.checkoutValidationFails) {
    binding.checkoutValidation = { status: 'failed', at, failureReason: 'The test payment didn’t complete: checkout returned an error at the payment step.' }
  } else {
    binding.checkoutValidation = { status: 'passed', at, failureReason: null }
  }
  log(state, env, 'store', `Test checkout ${binding.checkoutValidation.status}`, channelId)
  return ok(binding)
}

export function markImpactReviewed(state: MaropayAccountState, channelId: string, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'activate_store', channelId)) return denied('Only the business owner can review the activation impact.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  binding.impactReviewedAt = isoAt(env.now)
  return ok(binding)
}

export function activateStore(state: MaropayAccountState, channelId: string, channel: ChannelFacts | null, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'activate_store', channelId)) return denied('Only the business owner can activate Maropay on a store.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  if (binding.activation === 'live') return ok(binding)
  if (state.account?.eligibility === 'unsupported') return fail('unsupported_country', 'Maropay isn’t available for this business.')
  const checklist = activationChecklist(state, binding, channel, env.now)
  if (!checklist.ok) return fail('requirement_pending', 'Finish the activation checklist first.')
  binding.activation = 'live'
  binding.activatedAt = isoAt(env.now)
  binding.deactivatedAt = null
  const replaced = binding.previousProvider ? ` — replaces ${PROVIDER_LABELS[binding.previousProvider.provider]} for new checkouts` : ''
  log(state, env, 'store', `Activated Maropay on ${channel?.name ?? 'a store'}${replaced}`, channelId)
  return ok(binding)
}

/** Changes routing for future checkouts only. Completed payments, refunds, disputes and payouts stay where they are. */
export function deactivateStore(state: MaropayAccountState, channelId: string, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'deactivate_store', channelId)) return denied('Only the business owner can stop Maropay on a store.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  if (binding.activation !== 'live') return ok(binding)
  binding.activation = 'inactive'
  binding.deactivatedAt = isoAt(env.now)
  binding.impactReviewedAt = null
  const fallback = binding.previousProvider ? PROVIDER_LABELS[binding.previousProvider.provider] : 'no online payment provider'
  log(state, env, 'store', `Stopped Maropay for new checkouts — they now use ${fallback}`, channelId)
  return ok(binding)
}

/** Stops Maropay on every live store at once — routing only, exactly like deactivateStore. */
export function deactivateAllStores(state: MaropayAccountState, env: AdapterEnv): Result<StoreBinding[]> {
  if (!allowed(env, 'deactivate_store')) return denied('Only the business owner can stop Maropay on a store.')
  const live = state.bindings.filter((b) => b.activation === 'live')
  for (const binding of live) deactivateStore(state, binding.channelId, env)
  return ok(live)
}

// ── Shopper checkout ──────────────────────────────────────────────────────

export interface CheckoutInput {
  channelId: string
  methodId: string
  flow: ShopperFlow
  amount: Money
  customer: { name: string; email: string }
  lineItem: { product: string; sku: string; price: string }
}

export interface CheckoutStep {
  session: CheckoutSession
  payment: Payment | null
  /** Set when this step created the order (the store materialises it in Commerce). */
  createdOrder: CheckoutOrderSnapshot | null
}

const CARD_LABEL = 'Visa •••• 4242'
const MAROPAY_ORDER_BASE = 900_000
const MAROPAY_ORDER_NUMBER_BASE = 20_000

export function createCheckoutSession(state: MaropayAccountState, input: CheckoutInput, env: AdapterEnv): Result<CheckoutSession> {
  const binding = findBinding(state, input.channelId)
  if (!binding || binding.activation !== 'live') {
    const fallback = binding?.previousProvider ? PROVIDER_LABELS[binding.previousProvider.provider] : 'another provider'
    return fail('store_not_live', `Maropay isn’t live on this store, so checkout uses ${fallback}.`)
  }
  if (deriveCapabilities(state, env.now).payments !== 'enabled') return fail('requirement_pending', 'Payments are restricted on this account.')
  if (!checkoutMethods(state, binding).some((m) => m.id === input.methodId)) {
    return fail('method_unavailable', 'That payment method isn’t offered at checkout on this store.')
  }
  if (!isPositive(input.amount)) return fail('invalid_amount', 'Checkout needs an amount greater than zero.')
  const session: CheckoutSession = {
    id: nextId(state, 'cs'),
    channelId: input.channelId,
    amount: input.amount,
    methodId: input.methodId,
    flow: input.flow,
    state: 'open',
    paymentId: null,
    order: null,
    customer: { ...input.customer },
    lineItem: { ...input.lineItem },
    createdAt: isoAt(env.now),
  }
  state.sessions.unshift(session)
  return ok(session)
}

function sessionPayment(state: MaropayAccountState, session: CheckoutSession, status: PaymentStatus, env: AdapterEnv, failure: Payment['failure'] = null): Payment {
  const binding = findBinding(state, session.channelId)!
  const method = state.methods.find((m) => m.id === session.methodId)!
  const n = nextNumber(state, 'checkout_payment')
  const at = isoAt(env.now)
  const payment: Payment = {
    id: `pay_mp${1000 + n}`,
    accountId: state.accountId,
    channelId: session.channelId,
    orderId: null,
    orderNumber: null,
    provider: 'maropay',
    processorRef: `pi_mp${state.accountId}_${n}`,
    methodId: method.id,
    methodLabel: method.id === 'card' ? CARD_LABEL : method.label,
    amount: session.amount,
    status,
    captureMode: binding.captureMode,
    captures: [],
    refunds: [],
    disputeId: null,
    fee: zero(session.amount.currency),
    customer: { ...session.customer },
    createdAt: at,
    capturedAt: null,
    authorisationExpiresAt: status === 'authorised' ? daysFrom(env.now, 7) : null,
    expectedResolutionAt: status === 'processing' ? daysFrom(env.now, 3) : null,
    failure,
    flow: session.flow,
    timeline: [],
    appliedEventIds: [],
  }
  state.payments.unshift(payment)
  session.paymentId = payment.id
  event(state, payment, env, 'created', `Checkout started on ${method.label}`)
  return payment
}

function recordCapture(state: MaropayAccountState, payment: Payment, key: string, env: AdapterEnv): void {
  const method = state.methods.find((m) => m.id === payment.methodId)
  const at = isoAt(env.now)
  payment.captures.push({ id: nextId(state, 'cap'), amount: payment.amount, at, idempotencyKey: key })
  payment.status = 'captured'
  payment.capturedAt = at
  payment.authorisationExpiresAt = null
  if (payment.provider !== 'maropay') return
  payment.fee = method ? applyRate(payment.amount, method.rate) : zero(payment.amount.currency)
  const delay = state.account?.payoutSchedule.delayDays ?? 2
  state.movements.unshift({
    id: nextId(state, 'mv'),
    accountId: state.accountId,
    channelId: payment.channelId,
    kind: 'charge',
    gross: payment.amount,
    fee: payment.fee,
    net: subtract(payment.amount, payment.fee),
    paymentId: payment.id,
    refundId: null,
    disputeId: null,
    payoutId: null,
    availableAt: daysFrom(env.now, delay),
    createdAt: at,
    description: `Payment ${payment.id}${payment.orderNumber ? ` for order ${payment.orderNumber}` : ''}`,
  })
  if (!state.milestones.firstPaymentId) state.milestones.firstPaymentId = payment.id
}

/** Captured or authorised, per the store's capture setting — plus the order that now exists. */
function succeed(state: MaropayAccountState, session: CheckoutSession, env: AdapterEnv): CheckoutStep {
  const binding = findBinding(state, session.channelId)!
  const payment = sessionPayment(state, session, 'authorised', env)
  const order = orderFor(state, session, payment, env)
  if (binding.captureMode === 'automatic') {
    recordCapture(state, payment, session.id, env)
    event(state, payment, env, 'captured', `Payment captured — ${payment.methodLabel}`)
  } else {
    event(state, payment, env, 'authorised', `Payment authorised — capture it from the order within 7 days`)
    if (!state.milestones.firstPaymentId) state.milestones.firstPaymentId = payment.id
  }
  session.state = 'complete'
  return { session, payment, createdOrder: order }
}

function orderFor(state: MaropayAccountState, session: CheckoutSession, payment: Payment, env: AdapterEnv): CheckoutOrderSnapshot {
  const n = nextNumber(state, 'checkout_order')
  const order: CheckoutOrderSnapshot = {
    id: MAROPAY_ORDER_BASE + n,
    orderNumber: `#${MAROPAY_ORDER_NUMBER_BASE + n}`,
    date: localDateKey(env.now),
    customer: { ...session.customer },
    lineItems: [{ ...session.lineItem, qty: 1 }],
    shipping: '0.00',
    total: toDecimal(session.amount),
  }
  session.order = order
  payment.orderId = order.id
  payment.orderNumber = order.orderNumber
  return order
}

function failSession(state: MaropayAccountState, session: CheckoutSession, env: AdapterEnv, code: string, message: string): CheckoutStep {
  const payment = sessionPayment(state, session, 'failed', env, { code, message })
  event(state, payment, env, 'failed', message)
  session.state = 'failed'
  return { session, payment, createdOrder: null }
}

function currentStep(state: MaropayAccountState, session: CheckoutSession): CheckoutStep {
  return { session, payment: session.paymentId ? findPayment(state, session.paymentId) ?? null : null, createdOrder: null }
}

/**
 * The shopper presses Pay. Repeating it for the same session returns the same
 * result — reloads and double clicks can't create a second charge.
 */
export function confirmCheckoutSession(state: MaropayAccountState, sessionId: string, env: AdapterEnv): Result<CheckoutStep> {
  const session = state.sessions.find((s) => s.id === sessionId)
  if (!session) return fail('not_found', 'That checkout session expired. Start again.')
  if (session.state !== 'open') return ok(currentStep(state, session))
  const timeout = consumeTimeout<CheckoutStep>(env)
  if (timeout) return timeout
  switch (session.flow) {
    case 'success':
      return ok(succeed(state, session, env))
    case 'auth_required':
      session.state = 'requires_action'
      return ok(currentStep(state, session))
    case 'redirect':
      session.state = 'redirected'
      return ok(currentStep(state, session))
    case 'declined':
      return ok(failSession(state, session, env, 'card_declined', 'The card was declined. The shopper can try another card.'))
    case 'delayed': {
      const payment = sessionPayment(state, session, 'processing', env)
      const order = orderFor(state, session, payment, env)
      event(state, payment, env, 'processing', `Payment processing — ${payment.methodLabel} can take a few days to confirm`)
      session.state = 'processing'
      return ok({ session, payment, createdOrder: order })
    }
  }
}

/** The shopper finishes (or walks away from) authentication or a redirect. */
export function completeCheckoutAction(
  state: MaropayAccountState,
  sessionId: string,
  outcome: 'completed' | 'abandoned',
  env: AdapterEnv,
): Result<CheckoutStep> {
  const session = state.sessions.find((s) => s.id === sessionId)
  if (!session) return fail('not_found', 'That checkout session expired. Start again.')
  if (session.state !== 'requires_action' && session.state !== 'redirected') return ok(currentStep(state, session))
  if (outcome === 'completed') return ok(succeed(state, session, env))
  return ok(session.state === 'requires_action'
    ? failSession(state, session, env, 'authentication_abandoned', 'The shopper didn’t finish authentication, so no payment was taken.')
    : failSession(state, session, env, 'redirect_abandoned', 'The shopper didn’t come back from the payment page, so no payment was taken.'))
}

// ── Captures, voids and refunds ───────────────────────────────────────────

export function capturePayment(state: MaropayAccountState, paymentId: string, key: string, env: AdapterEnv): Result<Payment> {
  const payment = findPayment(state, paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (!allowed(env, 'capture', payment.channelId)) return denied('You don’t have permission to capture payments on this store.')
  if (payment.captures.some((c) => c.idempotencyKey === key)) return ok(payment)
  const timeout = consumeTimeout<Payment>(env)
  if (timeout) return timeout
  const problem = canCapture(payment, env.now)
  if (problem) return { ok: false, error: problem }
  recordCapture(state, payment, key, env)
  event(state, payment, env, 'captured', `Payment captured${payment.provider === 'maropay' ? '' : ` through ${PROVIDER_LABELS[payment.provider]}`}`)
  return ok(payment)
}

export function voidPayment(state: MaropayAccountState, paymentId: string, env: AdapterEnv): Result<Payment> {
  const payment = findPayment(state, paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (!allowed(env, 'void', payment.channelId)) return denied('You don’t have permission to cancel payments on this store.')
  if (payment.status === 'voided') return ok(payment)
  const problem = canVoid(payment)
  if (problem) return { ok: false, error: problem }
  payment.status = 'voided'
  payment.authorisationExpiresAt = null
  event(state, payment, env, 'voided', 'Authorisation cancelled — the shopper was not charged')
  return ok(payment)
}

export interface RefundResult {
  payment: Payment
  refund: Refund
}

/**
 * Refunds go back through the payment's original provider. Maropay refunds
 * debit the Maropay balance; previous-provider refunds never touch it.
 * Processing fees are not returned.
 */
export function refundPayment(
  state: MaropayAccountState,
  paymentId: string,
  amount: Money,
  reason: string,
  key: string,
  env: AdapterEnv,
): Result<RefundResult> {
  const payment = findPayment(state, paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (!allowed(env, 'refund', payment.channelId)) return denied('You don’t have permission to issue refunds.')
  const existing = payment.refunds.find((r) => r.idempotencyKey === key)
  if (existing) return ok({ payment, refund: existing })
  const timeout = consumeTimeout<RefundResult>(env)
  if (timeout) return timeout
  const problem = canRefund(payment, amount)
  if (problem) return { ok: false, error: problem }
  const outcome = env.failures.refundOutcome
  env.failures.refundOutcome = 'succeed'
  if (outcome === 'insufficient_balance' && payment.provider === 'maropay') {
    return fail('insufficient_balance', 'Your Maropay balance can’t cover this refund right now. It can be issued once new payments settle.')
  }
  const status: Refund['status'] = outcome === 'pending' ? 'pending' : outcome === 'fail' ? 'failed' : 'succeeded'
  const refund: Refund = {
    id: nextId(state, 're'),
    amount,
    reason,
    status,
    at: isoAt(env.now),
    idempotencyKey: key,
    provider: payment.provider,
    failureReason: status === 'failed' ? 'The shopper’s bank rejected the refund. Nothing was deducted.' : null,
  }
  payment.refunds.push(refund)
  const via = payment.provider === 'maropay' ? 'via Maropay' : `through ${PROVIDER_LABELS[payment.provider]} (original provider)`
  if (status === 'failed') {
    event(state, payment, env, 'refund_failed', `Refund of ${formatMoney(amount)} failed — ${refund.failureReason}`)
    return ok({ payment, refund })
  }
  if (payment.provider === 'maropay') {
    state.movements.unshift({
      id: nextId(state, 'mv'),
      accountId: state.accountId,
      channelId: payment.channelId,
      kind: 'refund',
      gross: negate(amount),
      fee: zero(amount.currency),
      net: negate(amount),
      paymentId: payment.id,
      refundId: refund.id,
      disputeId: null,
      payoutId: null,
      availableAt: isoAt(env.now),
      createdAt: isoAt(env.now),
      description: `Refund ${refund.id} on payment ${payment.id}`,
    })
  }
  payment.status = settledStatus(payment)
  event(state, payment, env, status === 'pending' ? 'refund_pending' : 'refund_succeeded',
    `Refund of ${formatMoney(amount)} ${status === 'pending' ? 'started' : 'issued'} ${via}${reason ? ` — ${reason}` : ''}`)
  log(state, env, 'refund', `Refunded ${formatMoney(amount)} on ${payment.orderNumber ?? payment.id}`, payment.channelId)
  return ok({ payment, refund })
}

/** Reviewer control: a pending refund completes or bounces back. */
export function settleRefund(state: MaropayAccountState, paymentId: string, refundId: string, outcome: 'succeeded' | 'failed', env: AdapterEnv): Result<RefundResult> {
  const payment = findPayment(state, paymentId)
  const refund = payment?.refunds.find((r) => r.id === refundId)
  if (!payment || !refund) return fail('not_found', 'That refund doesn’t exist.')
  if (refund.status !== 'pending') return ok({ payment, refund })
  refund.status = outcome
  if (outcome === 'failed') {
    refund.failureReason = 'The shopper’s bank rejected the refund. The amount was returned to your balance.'
    if (payment.provider === 'maropay') {
      state.movements.unshift({
        id: nextId(state, 'mv'),
        accountId: state.accountId,
        channelId: payment.channelId,
        kind: 'refund_reversal',
        gross: refund.amount,
        fee: zero(refund.amount.currency),
        net: refund.amount,
        paymentId: payment.id,
        refundId: refund.id,
        disputeId: null,
        payoutId: null,
        availableAt: isoAt(env.now),
        createdAt: isoAt(env.now),
        description: `Refund ${refund.id} returned`,
      })
    }
  }
  payment.status = settledStatus(payment)
  event(state, payment, env, outcome === 'succeeded' ? 'refund_succeeded' : 'refund_failed',
    outcome === 'succeeded' ? `Refund of ${formatMoney(refund.amount)} completed` : `Refund of ${formatMoney(refund.amount)} failed — ${refund.failureReason}`)
  return ok({ payment, refund })
}

// ── Payment history (scenario fixtures) ───────────────────────────────────

export interface HistoricalPaymentInput {
  /** The order's existing payment reference, kept as the payment id. */
  id: string
  channelId: string
  orderId: number
  orderNumber: string
  provider: Payment['provider']
  methodId: string
  methodLabel: string
  amount: Money
  outcome: 'captured' | 'refunded' | 'voided'
  customer: { name: string; email: string }
}

/**
 * Records a payment that already happened at `env.now` — used to give fixture
 * orders a payment history. Maropay payments move the balance; payments taken
 * by a previous provider never do.
 */
export function recordHistoricalPayment(state: MaropayAccountState, input: HistoricalPaymentInput, env: AdapterEnv): Payment {
  const binding = findBinding(state, input.channelId)
  const at = isoAt(env.now)
  const payment: Payment = {
    id: input.id,
    accountId: state.accountId,
    channelId: input.channelId,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    provider: input.provider,
    processorRef: input.provider === 'maropay' ? `pi_mp${input.id.replace(/\D/g, '')}` : input.id,
    methodId: input.methodId,
    methodLabel: input.methodLabel,
    amount: input.amount,
    status: 'authorised',
    captureMode: binding?.captureMode ?? 'automatic',
    captures: [],
    refunds: [],
    disputeId: null,
    fee: zero(input.amount.currency),
    customer: { ...input.customer },
    createdAt: at,
    capturedAt: null,
    authorisationExpiresAt: daysFrom(env.now, 7),
    expectedResolutionAt: null,
    failure: null,
    flow: null,
    timeline: [],
    appliedEventIds: [],
  }
  state.payments.unshift(payment)
  const via = input.provider === 'maropay' ? '' : ` through ${PROVIDER_LABELS[input.provider]}`
  event(state, payment, env, 'authorised', `Payment authorised${via} — ${input.methodLabel}`)
  if (input.outcome === 'voided') {
    payment.status = 'voided'
    payment.authorisationExpiresAt = null
    event(state, payment, env, 'voided', 'Authorisation cancelled — the order was cancelled before capture')
    return payment
  }
  recordCapture(state, payment, `hist_${input.id}`, env)
  event(state, payment, env, 'captured', `Payment captured${via}`)
  if (input.outcome === 'refunded') refundPayment(state, payment.id, input.amount, 'Order refunded', `hist_refund_${input.id}`, env)
  return payment
}

/** The processor asks the merchant to confirm the payout bank account; payouts pause until they do. */
export function raiseBankRequirement(state: MaropayAccountState, env: AdapterEnv): ActionTask {
  return addTask(state, env, {
    kind: 'bank',
    title: 'Confirm your payout bank account',
    description: 'Our payments partner couldn’t verify the payout account. Payments keep working; payouts are paused until you confirm it.',
    affects: ['payouts'],
    dueAt: null,
    blocking: false,
    role: 'owner',
    step: null,
    disputeId: null,
    payoutId: null,
    methodId: null,
    channelId: null,
  })
}

// ── Processor events (delayed methods, late and duplicate deliveries) ─────

export interface ProcessorEvent {
  /** Stable id: redelivering the same id is a duplicate. */
  id: string
  paymentId: string
  kind: 'captured' | 'failed'
}

export interface EventOutcome {
  payment: Payment
  applied: boolean
  reason: 'duplicate' | 'stale_state' | null
}

/**
 * Applies a verified processor event. Duplicates and events that would move a
 * confirmed payment backwards are recorded and ignored — never re-applied.
 */
export function applyProcessorEvent(state: MaropayAccountState, incoming: ProcessorEvent, env: AdapterEnv): Result<EventOutcome> {
  const payment = findPayment(state, incoming.paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (payment.appliedEventIds.includes(incoming.id)) {
    event(state, payment, env, 'late_event_ignored', `Duplicate “${incoming.kind}” notification ignored — already applied`)
    return ok({ payment, applied: false, reason: 'duplicate' })
  }
  const target: PaymentStatus = incoming.kind
  if (!canTransition(payment.status, target) || PAYMENT_STATUS_RANK[target] < PAYMENT_STATUS_RANK[payment.status]) {
    payment.appliedEventIds.push(incoming.id)
    event(state, payment, env, 'late_event_ignored', `Late “${incoming.kind}” notification ignored — the payment is already ${payment.status.replace('_', ' ')}`)
    return ok({ payment, applied: false, reason: 'stale_state' })
  }
  payment.appliedEventIds.push(incoming.id)
  if (target === 'captured') {
    recordCapture(state, payment, incoming.id, env)
    payment.expectedResolutionAt = null
    event(state, payment, env, 'captured', 'Payment confirmed by the shopper’s bank')
  } else {
    payment.status = 'failed'
    payment.expectedResolutionAt = null
    payment.failure = { code: 'debit_failed', message: 'The shopper’s bank couldn’t complete the debit (insufficient funds).' }
    event(state, payment, env, 'failed', payment.failure.message)
  }
  return ok({ payment, applied: true, reason: null })
}

// ── Payouts and the payout bank account ───────────────────────────────────

function unpaidMovements(state: MaropayAccountState, currency: string) {
  return state.movements.filter((m) => m.payoutId === null && m.net.currency === currency)
}

/** Reviewer control: runs the next payout from everything still in the balance (as if the settlement date arrived). */
export function runPayout(state: MaropayAccountState, env: AdapterEnv): Result<Payout> {
  const account = state.account
  if (!account?.payoutDestination) return fail('requirement_pending', 'Add a payout bank account first.')
  if (deriveCapabilities(state, env.now).payouts !== 'ready') return fail('requirement_pending', 'Payouts are paused until the payout task is resolved.')
  const movements = unpaidMovements(state, account.currency)
  const amount = sum(movements.map((m) => m.net), account.currency)
  if (!isPositive(amount)) return fail('nothing_to_pay', 'There’s nothing to pay out yet.')
  const payout: Payout = {
    id: nextId(state, 'po'),
    accountId: state.accountId,
    amount,
    status: 'in_transit',
    destination: { ...account.payoutDestination },
    createdAt: isoAt(env.now),
    arrivalEstimate: daysFrom(env.now, 2),
    paidAt: null,
    failure: null,
    movementIds: movements.map((m) => m.id),
    retryOf: null,
    retriedBy: null,
  }
  movements.forEach((m) => { m.payoutId = payout.id })
  state.payouts.unshift(payout)
  if (!state.milestones.firstPayoutId) state.milestones.firstPayoutId = payout.id
  log(state, env, 'payout', `Payout ${payout.id} of ${formatMoney(amount)} sent to ${payout.destination.bankName} •••• ${payout.destination.last4}`)
  return ok(payout)
}

/** Reviewer control: the bank transfer is confirmed as sent. */
export function markPayoutPaid(state: MaropayAccountState, payoutId: string, env: AdapterEnv): Result<Payout> {
  const payout = state.payouts.find((p) => p.id === payoutId)
  if (!payout) return fail('not_found', 'That payout doesn’t exist.')
  if (payout.status !== 'in_transit') return fail('stale_state', 'Only a payout in transit can be confirmed.')
  payout.status = 'paid'
  payout.paidAt = isoAt(env.now)
  return ok(payout)
}

const PAYOUT_FAILURES: Record<'account_closed' | 'invalid_account_number' | 'bank_rejected', string> = {
  account_closed: 'The bank account is closed.',
  invalid_account_number: 'The bank couldn’t find this account number.',
  bank_rejected: 'The bank rejected the transfer.',
}

/** Reviewer control: the bank returns a payout. Its funds go back to the available balance. */
export function failPayout(state: MaropayAccountState, payoutId: string, code: keyof typeof PAYOUT_FAILURES, env: AdapterEnv): Result<Payout> {
  const payout = state.payouts.find((p) => p.id === payoutId)
  if (!payout) return fail('not_found', 'That payout doesn’t exist.')
  if (payout.status === 'failed') return ok(payout)
  payout.status = 'failed'
  payout.failure = { code, message: PAYOUT_FAILURES[code], at: isoAt(env.now) }
  for (const m of state.movements) if (m.payoutId === payout.id) m.payoutId = null
  addTask(state, env, {
    kind: 'payout_failed',
    title: `Payout of ${formatMoney(payout.amount)} failed — update your bank account`,
    description: `${PAYOUT_FAILURES[code]} The money is back in your Maropay balance and will be paid once the account is fixed.`,
    affects: ['payouts'],
    dueAt: null,
    blocking: false,
    role: 'owner',
    step: null,
    disputeId: null,
    payoutId: payout.id,
    methodId: null,
    channelId: null,
  })
  log(state, env, 'payout', `Payout ${payout.id} failed: ${PAYOUT_FAILURES[code]}`)
  return ok(payout)
}

export function retryPayout(state: MaropayAccountState, payoutId: string, env: AdapterEnv): Result<Payout> {
  if (!allowed(env, 'retry_payout')) return denied('You don’t have permission to retry payouts.')
  const failed = state.payouts.find((p) => p.id === payoutId)
  const destination = state.account?.payoutDestination
  if (!failed || failed.status !== 'failed') return fail('stale_state', 'Only a failed payout can be retried.')
  if (failed.retriedBy) return ok(state.payouts.find((p) => p.id === failed.retriedBy) ?? failed)
  if (!destination || !failed.failure || Date.parse(destination.addedAt) <= Date.parse(failed.failure.at)) {
    return fail('requirement_pending', 'Update the payout bank account before retrying.')
  }
  const movements = state.movements.filter((m) => failed.movementIds.includes(m.id) && m.payoutId === null)
  const amount = sum(movements.map((m) => m.net), failed.amount.currency)
  if (!isPositive(amount)) return fail('nothing_to_pay', 'These funds were already paid out.')
  const retry: Payout = {
    id: nextId(state, 'po'),
    accountId: state.accountId,
    amount,
    status: 'in_transit',
    destination: { ...destination },
    createdAt: isoAt(env.now),
    arrivalEstimate: daysFrom(env.now, 2),
    paidAt: null,
    failure: null,
    movementIds: movements.map((m) => m.id),
    retryOf: failed.id,
    retriedBy: null,
  }
  movements.forEach((m) => { m.payoutId = retry.id })
  failed.retriedBy = retry.id
  state.payouts.unshift(retry)
  resolveTasks(state, env, (t) => t.kind === 'payout_failed' && t.payoutId === failed.id)
  log(state, env, 'payout', `Retried payout ${failed.id} as ${retry.id} to ${destination.bankName} •••• ${destination.last4}`)
  return ok(retry)
}

export interface StepUpChallenge {
  id: string
  expiresAt: string
}

export interface StepUpToken {
  challengeId: string
  expiresAt: string
}

export function requestStepUp(env: AdapterEnv): StepUpChallenge {
  return { id: `su_${env.now}`, expiresAt: isoAt(env.now + STEP_UP_TTL_MS) }
}

export function confirmStepUp(challenge: StepUpChallenge, code: string, env: AdapterEnv): Result<StepUpToken> {
  if (Date.parse(challenge.expiresAt) <= env.now) return fail('step_up_required', 'That code expired. Request a new one.')
  if (code.trim() !== STEP_UP_CODE) return fail('invalid_input', 'That code isn’t right. Check your authenticator and try again.')
  return ok({ challengeId: challenge.id, expiresAt: isoAt(env.now + STEP_UP_TTL_MS) })
}

/** Changes where payouts go. Needs a fresh step-up; only the last four digits are kept. */
export function updateBankAccount(
  state: MaropayAccountState,
  input: { holderName: string; bankName: string; accountNumber: string },
  token: StepUpToken | null,
  env: AdapterEnv,
): Result<MaropayAccount> {
  if (!allowed(env, 'change_bank')) return denied('Only the business owner can change the payout bank account.')
  const account = state.account
  if (!account) return fail('requirement_pending', 'Set up Maropay first.')
  if (account.closedAt) return fail('requirement_pending', CLOSED)
  if (!token || Date.parse(token.expiresAt) <= env.now) return fail('step_up_required', 'Confirm it’s you before changing bank details.')
  const digits = input.accountNumber.replace(/\s/g, '')
  if (!/^\d{4,17}$/.test(digits)) return fail('invalid_input', 'Enter an account number of 4 to 17 digits.')
  if (!input.holderName.trim() || !input.bankName.trim()) return fail('invalid_input', 'Enter the account holder and bank name.')
  account.payoutDestination = {
    bankName: input.bankName.trim(),
    last4: digits.slice(-4),
    holderName: input.holderName.trim(),
    currency: account.currency,
    addedAt: isoAt(env.now),
  }
  resolveTasks(state, env, (t) => t.kind === 'bank')
  log(state, env, 'bank', `Payout bank changed to ${account.payoutDestination.bankName} •••• ${account.payoutDestination.last4}`)
  return ok(account)
}

// ── Business details and closing the account ─────────────────────────────

function editableBusiness(state: MaropayAccountState, env: AdapterEnv): Result<LegalBusiness> {
  if (!allowed(env, 'change_business')) return denied('Only the business owner can change business details.')
  if (!state.business || !state.account) return fail('requirement_pending', 'Submit Maropay setup first.')
  if (state.account.closedAt) return fail('requirement_pending', CLOSED)
  return ok(state.business)
}

/** Asks our payments partner to re-check a verified detail. The current value stays in use until they approve. */
export function requestBusinessChange(
  state: MaropayAccountState,
  input: { field: BusinessChangeField; value: string },
  env: AdapterEnv,
): Result<ActionTask> {
  const business = editableBusiness(state, env)
  if (!business.ok) return business
  const label = BUSINESS_CHANGE_LABELS[input.field]
  const value = input.value.trim()
  if (!value) return fail('invalid_input', `Enter the new ${label.toLowerCase()}.`)
  if (value === business.value[input.field]) return fail('invalid_input', `That’s already your ${label.toLowerCase()}.`)
  if (state.tasks.some((t) => t.kind === 'business_change' && t.status !== 'resolved' && t.change?.field === input.field)) {
    return fail('invalid_input', `A change to your ${label.toLowerCase()} is already being reviewed.`)
  }
  const task = addTask(state, env, {
    kind: 'business_change',
    title: `${label} change under review`,
    description: `You asked to change it to “${value}”. Your current details stay in use until our payments partner approves it.`,
    affects: [],
    dueAt: null,
    blocking: false,
    role: 'owner',
    step: null,
    disputeId: null,
    payoutId: null,
    methodId: null,
    channelId: null,
    change: { field: input.field, value },
  })
  task.status = 'waiting_review'
  log(state, env, 'business', `Asked to change the ${label.toLowerCase()}`)
  return ok(task)
}

/** Reviewer control: our payments partner's decision on a requested change. */
export function simulateBusinessChangeOutcome(state: MaropayAccountState, taskId: string, approved: boolean, env: AdapterEnv): Result<ActionTask> {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || task.kind !== 'business_change' || !task.change || task.status === 'resolved') return fail('stale_state', 'That change isn’t awaiting review.')
  if (approved && state.business) state.business[task.change.field] = task.change.value
  task.status = 'resolved'
  task.resolvedAt = isoAt(env.now)
  log(state, env, 'business', `${BUSINESS_CHANGE_LABELS[task.change.field]} change ${approved ? 'approved' : 'declined'} by our payments partner`)
  return ok(task)
}

/** What shoppers see on statements and receipts. Not verified, so it applies straight away. */
export function updatePublicDetails(state: MaropayAccountState, details: LegalBusiness['publicDetails'], env: AdapterEnv): Result<LegalBusiness> {
  const business = editableBusiness(state, env)
  if (!business.ok) return business
  const issue = descriptorIssue(details.statementDescriptor) ?? (isEmail(details.supportEmail) ? null : 'Enter a support email like help@example.com.')
  if (issue) return fail('invalid_input', issue)
  business.value.publicDetails = {
    statementDescriptor: details.statementDescriptor.trim(),
    supportEmail: details.supportEmail.trim(),
    supportPhone: details.supportPhone.trim(),
  }
  log(state, env, 'business', 'Updated the details shoppers see')
  return ok(business.value)
}

/**
 * Closes the connected account once nothing is left in flight (closureChecks).
 * Needs a fresh step-up. Payments, payouts and history stay readable; open
 * tasks no longer apply, so they close with it.
 */
export function closeAccount(state: MaropayAccountState, token: StepUpToken | null, env: AdapterEnv): Result<MaropayAccount> {
  if (!allowed(env, 'close_account')) return denied('Only the business owner can close the Maropay account.')
  const account = state.account
  if (!account) return fail('not_found', 'There’s no Maropay account to close.')
  if (account.closedAt) return ok(account)
  const blocking = closureChecks(state, env.now).find((c) => !c.ok)
  if (blocking) return fail('requirement_pending', blocking.detail)
  if (!token || Date.parse(token.expiresAt) <= env.now) return fail('step_up_required', 'Confirm it’s you before closing the account.')
  account.closedAt = isoAt(env.now)
  resolveTasks(state, env, () => true)
  log(state, env, 'account', 'Closed the Maropay account')
  return ok(account)
}

// ── Disputes ──────────────────────────────────────────────────────────────

const EVIDENCE: Record<EvidenceItem['key'], string> = {
  receipt: 'Receipt or invoice',
  shipping_proof: 'Proof of delivery',
  customer_communication: 'Messages with the shopper',
  refund_policy: 'Refund and returns policy',
  product_description: 'Product description',
}

const REQUIRED_EVIDENCE: Record<DisputeReason, EvidenceItem['key'][]> = {
  fraudulent: ['receipt', 'customer_communication'],
  product_not_received: ['receipt', 'shipping_proof'],
  product_unacceptable: ['receipt', 'product_description'],
  duplicate: ['receipt'],
  credit_not_processed: ['receipt', 'refund_policy'],
  general: ['receipt'],
}

const CLAIMS: Record<DisputeReason, string> = {
  fraudulent: 'The cardholder says they didn’t authorise this payment.',
  product_not_received: 'The shopper says the order never arrived.',
  product_unacceptable: 'The shopper says the item was damaged or not as described.',
  duplicate: 'The shopper says they were charged twice.',
  credit_not_processed: 'The shopper says a promised refund never arrived.',
  general: 'The shopper disputed this payment with their bank.',
}

export function evidenceTemplate(reason: DisputeReason): EvidenceItem[] {
  return (Object.keys(EVIDENCE) as EvidenceItem['key'][]).map((key) => ({
    key,
    label: EVIDENCE[key],
    required: REQUIRED_EVIDENCE[reason].includes(key),
    note: '',
    document: null,
  }))
}

/** Reviewer control (and scenario builder): the shopper's bank opens a dispute. */
export function openDispute(state: MaropayAccountState, paymentId: string, reason: DisputeReason, env: AdapterEnv, respondInDays = 9): Result<Dispute> {
  const payment = findPayment(state, paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (payment.provider !== 'maropay') return fail('stale_state', 'Disputes on earlier payments are handled by the original provider.')
  if (payment.status !== 'captured' && payment.status !== 'partially_refunded') return fail('stale_state', 'Only a settled payment can be disputed.')
  const at = isoAt(env.now)
  const dispute: Dispute = {
    id: nextId(state, 'dp'),
    accountId: state.accountId,
    channelId: payment.channelId,
    paymentId,
    orderId: payment.orderId,
    orderNumber: payment.orderNumber,
    reason,
    claim: CLAIMS[reason],
    amount: payment.amount,
    fee: state.terms.disputeFee,
    openedAt: at,
    respondBy: daysFrom(env.now, respondInDays),
    status: 'needs_response',
    evidence: evidenceTemplate(reason),
    summary: '',
    draftUpdatedAt: null,
    submittedAt: null,
    resolvedAt: null,
  }
  state.disputes.unshift(dispute)
  payment.status = 'disputed'
  payment.disputeId = dispute.id
  state.movements.unshift({
    id: nextId(state, 'mv'),
    accountId: state.accountId,
    channelId: payment.channelId,
    kind: 'dispute',
    gross: negate(dispute.amount),
    fee: dispute.fee,
    net: negate(sumOf(dispute.amount, dispute.fee)),
    paymentId,
    refundId: null,
    disputeId: dispute.id,
    payoutId: null,
    availableAt: at,
    createdAt: at,
    description: `Dispute ${dispute.id} on payment ${paymentId}`,
  })
  addTask(state, env, {
    kind: 'dispute',
    title: `Respond to the dispute on ${payment.orderNumber ?? paymentId} by ${formatDay(dispute.respondBy)}`,
    description: CLAIMS[reason],
    affects: [],
    dueAt: dispute.respondBy,
    blocking: false,
    role: 'finance',
    step: null,
    disputeId: dispute.id,
    payoutId: null,
    methodId: null,
    channelId: payment.channelId,
  })
  event(state, payment, env, 'dispute_opened', `Disputed by the shopper’s bank — ${CLAIMS[reason]}`)
  log(state, env, 'dispute', `Dispute opened on ${payment.orderNumber ?? paymentId}`, payment.channelId)
  return ok(dispute)
}

function sumOf(a: Money, b: Money): Money {
  return sum([a, b], a.currency)
}

export function saveDisputeDraft(
  state: MaropayAccountState,
  disputeId: string,
  patch: { summary?: string; evidence?: { key: EvidenceItem['key']; note?: string; document?: MockDocument | null } },
  env: AdapterEnv,
): Result<Dispute> {
  const dispute = state.disputes.find((d) => d.id === disputeId)
  if (!dispute) return fail('not_found', 'That dispute doesn’t exist.')
  if (!allowed(env, 'respond_dispute', dispute.channelId)) return denied('You don’t have permission to respond to disputes.')
  if (dispute.status !== 'needs_response') return fail('stale_state', 'Evidence can’t be edited after it’s submitted.')
  if (patch.summary !== undefined) dispute.summary = patch.summary
  if (patch.evidence) {
    const item = dispute.evidence.find((e) => e.key === patch.evidence!.key)
    if (!item) return fail('invalid_input', 'Unknown evidence item.')
    if (patch.evidence.note !== undefined) item.note = patch.evidence.note
    if (patch.evidence.document !== undefined) item.document = patch.evidence.document
  }
  dispute.draftUpdatedAt = isoAt(env.now)
  return ok(dispute)
}

export function submitDisputeEvidence(state: MaropayAccountState, disputeId: string, env: AdapterEnv): Result<Dispute> {
  const dispute = state.disputes.find((d) => d.id === disputeId)
  if (!dispute) return fail('not_found', 'That dispute doesn’t exist.')
  if (!allowed(env, 'respond_dispute', dispute.channelId)) return denied('You don’t have permission to respond to disputes.')
  if (dispute.status === 'under_review') return ok(dispute)
  const timeout = consumeTimeout<Dispute>(env)
  if (timeout) return timeout
  const problem = canSubmitEvidence(dispute, env.now)
  if (problem) return { ok: false, error: problem }
  dispute.status = 'under_review'
  dispute.submittedAt = isoAt(env.now)
  resolveTasks(state, env, (t) => t.kind === 'dispute' && t.disputeId === disputeId)
  const payment = findPayment(state, dispute.paymentId)
  if (payment) event(state, payment, env, 'dispute_submitted', 'Evidence submitted — the shopper’s bank will decide')
  log(state, env, 'dispute', `Evidence submitted for dispute ${dispute.id}`, dispute.channelId)
  return ok(dispute)
}

export function acceptDispute(state: MaropayAccountState, disputeId: string, env: AdapterEnv): Result<Dispute> {
  const dispute = state.disputes.find((d) => d.id === disputeId)
  if (!dispute) return fail('not_found', 'That dispute doesn’t exist.')
  if (!allowed(env, 'accept_dispute', dispute.channelId)) return denied('You don’t have permission to accept disputes.')
  if (dispute.status === 'accepted') return ok(dispute)
  const problem = canAcceptDispute(dispute, env.now)
  if (problem) return { ok: false, error: problem }
  dispute.status = 'accepted'
  dispute.resolvedAt = isoAt(env.now)
  resolveTasks(state, env, (t) => t.kind === 'dispute' && t.disputeId === disputeId)
  const payment = findPayment(state, dispute.paymentId)
  if (payment) event(state, payment, env, 'dispute_accepted', 'Dispute accepted — the amount and dispute fee stay deducted')
  log(state, env, 'dispute', `Accepted dispute ${dispute.id}`, dispute.channelId)
  return ok(dispute)
}

/** Reviewer control: the shopper's bank decides a submitted dispute. */
export function simulateDisputeOutcome(state: MaropayAccountState, disputeId: string, outcome: 'won' | 'lost', env: AdapterEnv): Result<Dispute> {
  const dispute = state.disputes.find((d) => d.id === disputeId)
  if (!dispute || dispute.status !== 'under_review') return fail('stale_state', 'Only a dispute under review can be decided.')
  dispute.status = outcome
  dispute.resolvedAt = isoAt(env.now)
  const payment = findPayment(state, dispute.paymentId)
  if (outcome === 'won' && payment) {
    payment.status = settledStatus(payment)
    state.movements.unshift({
      id: nextId(state, 'mv'),
      accountId: state.accountId,
      channelId: dispute.channelId,
      kind: 'dispute_reversal',
      gross: dispute.amount,
      fee: zero(dispute.amount.currency),
      net: dispute.amount,
      paymentId: dispute.paymentId,
      refundId: null,
      disputeId: dispute.id,
      payoutId: null,
      availableAt: isoAt(env.now),
      createdAt: isoAt(env.now),
      description: `Dispute ${dispute.id} won — funds returned`,
    })
  }
  if (payment) {
    event(state, payment, env, outcome === 'won' ? 'dispute_won' : 'dispute_lost',
      outcome === 'won' ? 'Dispute won — the disputed amount was returned to your balance' : 'Dispute lost — the amount and dispute fee stay deducted')
  }
  log(state, env, 'dispute', `Dispute ${dispute.id} ${outcome}`, dispute.channelId)
  return ok(dispute)
}
