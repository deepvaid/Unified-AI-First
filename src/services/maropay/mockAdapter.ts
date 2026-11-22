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
import { applyRate, formatMoney, isPositive, money, negate, subtract, sum, toDecimal, zero } from '../../maropay/money.ts'
import type { Money } from '../../maropay/money.ts'
import {
  BUSINESS_CHANGE_LABELS,
  DECLINE_REASON_LABELS,
  DEFAULT_PAYOUT_SCHEDULE,
  METHOD_DECLINE_COPY,
  MOCK_CLIENT_IP,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_RANK,
  PAY_BUTTON_LABELS,
  PROVIDER_LABELS,
  REPRESENTATIVE_ID,
  THRESHOLD_ESCALATION_DAYS,
  canForStore,
  canTransition,
  catalogFor,
  currencyFor,
  daysFrom,
  defaultCheckoutSettings,
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
  CheckoutLineItem,
  CheckoutOrderSnapshot,
  CheckoutSession,
  DeclineReason,
  Dispute,
  DisputeReason,
  EvidenceItem,
  HistoryKind,
  LegalBusiness,
  MaropayAccount,
  MaropayAccountState,
  MaropayAction,
  MaropayActingRole,
  MethodDeclineReason,
  MockDocument,
  OnboardingDraft,
  OnboardingStepKey,
  PayButtonLabel,
  Payment,
  PaymentEventKind,
  PaymentStatus,
  Payout,
  PayoutDestination,
  Refund,
  RequirementKey,
  Result,
  ShopperFlow,
  StoreBinding,
} from '../../maropay/model.ts'
import {
  activationChecklist,
  awaitingDecision,
  canAcceptDispute,
  canCapture,
  canRefund,
  canSubmitEvidence,
  canVoid,
  channelProblem,
  closureChecks,
  deriveCapabilities,
  formatDay,
  isSupportedCountry,
  isThresholdTask,
  joinList,
  maropayOfferedMethods,
  settledStatus,
} from '../../maropay/readiness.ts'
import type { ChannelFacts } from '../../maropay/readiness.ts'
import {
  cardGateway,
  connectionFor,
  connectionOf,
  ensureStoreProviders,
  isManualKind,
  isOwnProviderKind,
  lineupFor,
  methodFacts,
  ownMethodIds,
  providerLabel,
  storeProvidersFor,
} from '../../maropay/providers.ts'
import type { ManualMethodSettings, OwnProviderKind, ProviderKind, ProviderStatus, StoreProviderSetup } from '../../maropay/providers.ts'
import { resolveShopperMethods } from '../../maropay/storefront.ts'
import { EDITABLE_DRAFT_FIELDS, bankAccountErrors, descriptorIssue, digitsOnly, isEmail, submissionIssues } from '../../maropay/onboarding.ts'
import type { BankAccountInput, EditableDraftField, OnboardingPatch } from '../../maropay/onboarding.ts'
import { MOCK_ERRORS, providedKeys, requestSubject, requestSubjectName, requirementForm, requirementLabel, rulesForState } from '../../maropay/requirements.ts'
import type { MockErrorKey, SetupField } from '../../maropay/requirements.ts'
import { normaliseWebsite } from '../../maropay/validation.ts'

// ── Environment ───────────────────────────────────────────────────────────

/** Reviewer-controlled failures. Each one-shot switch resets after it fires. */
export interface FailurePlan {
  /** What the next refund does. */
  refundOutcome: 'succeed' | 'pending' | 'fail' | 'insufficient_balance'
  /** The next financial call times out without applying (retry with the same key succeeds). */
  timeoutNext: boolean
  checkoutValidationFails: boolean
}

export function defaultFailures(): FailurePlan {
  return { refundOutcome: 'succeed', timeoutNext: false, checkoutValidationFails: false }
}

export interface AdapterEnv {
  now: number
  actor: { role: MaropayActingRole; assignedChannelIds: string[] | null }
  failures: FailurePlan
  /** What the operations know about sales channels — names for task titles, facts for store checks. Pure callers may leave them out. */
  channelName?: (channelId: string) => string
  channelFacts?: (channelId: string) => ChannelFacts | null
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
    enabledMethodIds: [...state.defaultMethodIds],
    captureMode,
    checkoutValidation: { status: 'not_run', at: null, failureReason: null },
    impactReviewedAt: null,
    linkedAt: isoAt(now),
    activatedAt: null,
    deactivatedAt: null,
    checkout: defaultCheckoutSettings(),
    methodOrder: [],
    defaultMethodId: null,
    methodSettings: {},
    activationNoticeDismissedAt: null,
  }
  state.bindings.push(binding)
  return binding
}

/** Settlement currency follows the registration country; the catalogue and dispute fee follow it. Pre-submission only. */
function setAccountCurrency(state: MaropayAccountState, account: MaropayAccount, currency: string): void {
  if (account.currency === currency) return
  account.currency = currency
  state.methods = catalogFor(currency)
  state.terms.disputeFee = money(state.terms.disputeFee.amount, currency)
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
  const country = input.prefill.country ?? state.onboarding.country
  const account: MaropayAccount = {
    id: nextId(state, 'mpa'),
    processorAccountRef: `acct_mp${state.accountId}`,
    businessId: state.business?.id ?? nextId(state, 'bus'),
    country,
    currency: state.terms.disputeFee.currency,
    setup: 'in_progress',
    verification: 'not_submitted',
    eligibility: 'unknown',
    declineReason: null,
    declinedAt: null,
    reusedVerifiedDetails: input.reuseVerifiedDetails,
    payoutDestination: null,
    payoutSchedule: { ...DEFAULT_PAYOUT_SCHEDULE },
    createdAt: at,
    submittedAt: null,
    verifiedAt: null,
    closedAt: null,
  }
  state.account = account
  setAccountCurrency(state, account, currencyFor(country))
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

const LAST_FOUR = /^\d{0,4}$/

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
  if (patch.attestations && JSON.stringify(patch.attestations) !== JSON.stringify(draft.attestations) && env.actor.role !== 'owner') {
    return denied('Only the business owner can confirm the people list.')
  }
  // The full SSN is never accepted — only its last four digits ever reach state.
  const people = [...(patch.representative ? [patch.representative] : []), ...(patch.persons ?? [])]
  if (people.some((p) => p.ssnLast4 && !LAST_FOUR.test(p.ssnLast4.trim()))) {
    return fail('invalid_input', 'Enter only the last 4 digits of the SSN — never the full number.')
  }
  Object.assign(draft, JSON.parse(JSON.stringify(patch)) as OnboardingPatch)
  // An individual has no structure and no people list; the addresses are in the registration country by definition.
  if (draft.businessType === 'individual') {
    draft.business.structure = null
    draft.persons = []
    draft.attestations = { owners: false, directors: false, executives: false }
  }
  draft.business.address.country = draft.country
  draft.representative.address.country = draft.country
  for (const p of draft.persons) p.address.country = draft.country
  if (patch.country !== undefined) {
    account.country = patch.country
    account.eligibility = isSupportedCountry(patch.country) ? 'eligible' : 'unsupported'
    setAccountCurrency(state, account, currencyFor(patch.country))
    if (draft.payout && draft.payout.country !== patch.country) draft.payout = null
  }
  if (options.complete && !draft.completedSteps.includes(step)) draft.completedSteps = [...draft.completedSteps, step]
  draft.lastStep = options.next ?? step
  return ok(draft)
}

/** Records the owner's acceptance of the current terms with the date, IP and browser our payments partner requires. Once per version. */
export function acceptTerms(state: MaropayAccountState, input: { userAgent: string }, env: AdapterEnv): Result<null> {
  if (!allowed(env, 'accept_terms')) return denied('Only the business owner or an authorised representative can accept the terms.')
  const account = state.account
  if (!account) return fail('requirement_pending', 'Start Maropay setup first.')
  if (account.setup === 'submitted') return fail('invalid_input', 'Setup has already been submitted.')
  const draft = state.onboarding
  // A first-phase acceptance carries no IP or browser yet, so it is recorded once more.
  if (draft.termsAcceptedVersion === state.terms.version && state.terms.acceptedAt && state.terms.acceptedIp) return ok(null)
  draft.termsAcceptedVersion = state.terms.version
  state.terms.acceptedAt = isoAt(env.now)
  state.terms.acceptedBy = env.actor.role
  state.terms.acceptedIp = MOCK_CLIENT_IP
  state.terms.acceptedUserAgent = input.userAgent.trim().slice(0, 200) || 'unknown'
  log(state, env, 'terms', `Accepted Maropay terms ${state.terms.version}`)
  return ok(null)
}

/**
 * Stores the payout account for setup. The full account number is checked
 * once and only its last four digits are kept; the routing number is kept
 * because it isn't the account number.
 */
export function savePayoutDraft(state: MaropayAccountState, input: BankAccountInput, env: AdapterEnv): Result<null> {
  if (!allowed(env, 'change_bank')) return denied('Only the business owner can add payout details.')
  const account = state.account
  if (!account) return fail('requirement_pending', 'Start Maropay setup first.')
  if (account.setup === 'submitted') return fail('invalid_input', 'Setup has already been submitted — change the bank account from Settings.')
  const draft = state.onboarding
  const issue = Object.values(bankAccountErrors(input, draft.country))[0]
  if (issue) return fail('invalid_input', issue)
  draft.payout = {
    holderName: input.holderName.trim(),
    bankName: input.bankName.trim(),
    last4: digitsOnly(input.accountNumber).slice(-4),
    routingNumber: digitsOnly(input.bankCode),
    currency: currencyFor(draft.country),
    country: draft.country,
    holderType: input.holderType ?? (draft.businessType === 'individual' ? 'individual' : 'company'),
  }
  return ok(null)
}

/**
 * Submits setup to our payments partner. Submission is never approval: the
 * account goes under review and the partner's decision arrives later
 * (simulateReviewOutcome in this prototype).
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
  const missing = submissionIssues(draft, state.terms.version, env.now)
  const payout = draft.payout
  if (missing.length || !payout) return fail('requirement_pending', missing[0]?.message ?? 'Add a payout bank account before you submit.')

  const at = isoAt(env.now)
  state.business = {
    ...JSON.parse(JSON.stringify(draft.business)),
    id: account.businessId,
    type: draft.businessType ?? 'company',
    country: draft.country,
    persons: JSON.parse(JSON.stringify([{ ...draft.representative, id: REPRESENTATIVE_ID }, ...draft.persons])),
    representativeId: REPRESENTATIVE_ID,
    publicDetails: { ...draft.publicDetails },
  }
  account.country = draft.country
  account.setup = 'submitted'
  account.eligibility = 'eligible'
  account.submittedAt = at
  account.reusedVerifiedDetails = draft.reuseVerifiedDetails
  account.payoutDestination = { ...payout, addedAt: at }
  account.verification = 'under_review'
  draft.submittedAt = at
  resolveTasks(state, env, (t) => t.kind === 'owner_review')
  for (const channelId of draft.channelIds) if (!findBinding(state, channelId)) newBinding(state, channelId, env.now)
  log(state, env, 'setup', 'Submitted Maropay setup for review')
  return ok({ outcome: 'under_review' })
}

/** What the merchant sends back for a partner request — one of these per form kind (requirementForm). */
export interface TaskAnswer {
  documents?: { front: MockDocument; back?: MockDocument | null }
  value?: string
  /** Answer with the request's alternative (a document instead of a keyed value, a description instead of a website). */
  useAlternative?: boolean
  confirmed?: boolean
}

/** A keyed value the partner asked for again lands on the draft and, once submitted, on the legal business. */
function applyRequirementValue(state: MaropayAccountState, field: SetupField, value: string, asAlternative: boolean): void {
  if (field === 'supportPhone') {
    state.onboarding.publicDetails.supportPhone = value
    if (state.business) state.business.publicDetails.supportPhone = value
    return
  }
  if (field === 'repEmail' || field === 'repTitle') {
    const business = state.business
    const people = [state.onboarding.representative, ...(business ? business.persons.filter((p) => p.id === business.representativeId) : [])]
    for (const person of people) {
      if (field === 'repEmail') person.email = value
      else person.title = value
    }
    return
  }
  for (const b of [state.onboarding.business, ...(state.business ? [state.business] : [])]) {
    if (field === 'taxId') b.taxId = value
    else if (field === 'website') { b.website = normaliseWebsite(value); b.noWebsite = false }
    else if (field === 'productDescription') { b.productDescription = value; if (asAlternative) b.noWebsite = true }
  }
}

/** Supplies what a verification or bank task asked for. Verification answers go to the partner for review; they never self-approve. */
export function resolveTask(state: MaropayAccountState, taskId: string, payload: TaskAnswer, env: AdapterEnv): Result<ActionTask> {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return fail('not_found', 'That task no longer exists.')
  if (task.status === 'resolved') return ok(task)
  if (!allowed(env, 'resolve_task')) return denied('Only the business owner can provide verification or bank information.')
  if (task.kind === 'verification') {
    const rules = rulesForState(state)
    const key = payload.useAlternative ? task.alternative?.[0] : task.requirement
    if (payload.useAlternative && !key) return fail('invalid_input', 'There’s no alternative for this request.')
    const form = requirementForm(key, rules)
    if (!form) return fail('invalid_input', 'This request can’t be answered here — contact Maropost support.')
    if (form.kind === 'documents') {
      if (!payload.documents?.front) return fail('invalid_input', `Attach the ${form.label.toLowerCase()}.`)
      task.documents = { front: payload.documents.front, back: payload.documents.back ?? null }
    } else if (form.kind === 'value') {
      const value = (payload.value ?? '').trim()
      const issue = form.validate(value)
      if (issue) return fail('invalid_input', issue)
      applyRequirementValue(state, form.field, value, Boolean(payload.useAlternative))
    } else if (!payload.confirmed) {
      return fail('invalid_input', 'Confirm the details before sending them.')
    }
    task.status = 'waiting_review'
    if (state.account?.verification === 'action_required') state.account.verification = 'under_review'
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
  if (task.kind === 'activate_store') return fail('invalid_input', 'This task is resolved by activating Maropay on the store.')
  return fail('invalid_input', 'This task is resolved from its own page.')
}

export interface ReviewOptions {
  /** For a decline: the partner's account-level reason. */
  reason?: DeclineReason
  /** For "needs more information": which of the partner's requests to raise. */
  request?: MockErrorKey
}

/** Reviewer control: what our payments partner decides after review. Approval raises activation tasks; it never activates a store. */
export function simulateReviewOutcome(
  state: MaropayAccountState,
  decision: 'verified' | 'rejected' | 'more_info',
  env: AdapterEnv,
  options: ReviewOptions = {},
): Result<MaropayAccount> {
  const account = state.account
  if (!account || account.setup !== 'submitted') return fail('requirement_pending', 'Submit setup first.')
  if (account.closedAt) return fail('requirement_pending', CLOSED)
  if (account.verification === 'rejected') return fail('stale_state', 'This business was declined — a review of that decision goes through Maropost support.')
  const at = isoAt(env.now)
  if (decision === 'verified') {
    // On an already-verified business this accepts what is awaiting a decision; unanswered threshold items keep their
    // deadline. The activation tasks it raises are idempotent.
    const wasVerified = account.verification === 'verified'
    if (wasVerified && !state.tasks.some(awaitingDecision)) return ok(account)
    account.verification = 'verified'
    if (!wasVerified) account.verifiedAt = at
    resolveTasks(state, env, awaitingDecision)
    log(state, env, 'verification', wasVerified ? 'Information accepted by our payments partner' : 'Business verified by our payments partner')
    ensureActivationTasks(state, env)
    return ok(account)
  }
  if (decision === 'rejected') {
    if (state.bindings.some((b) => b.activation === 'live')) {
      return fail('stale_state', 'A business that is taking payments isn’t declined — our payments partner pauses it with a request instead. Stop Maropay on every store first.')
    }
    account.verification = 'rejected'
    account.declineReason = options.reason ?? 'incomplete_verification'
    account.declinedAt = at
    resolveTasks(state, env, (t) => t.kind === 'verification')
    retireActivationTasks(state, env)
    log(state, env, 'verification', `Verification declined by our payments partner — ${DECLINE_REASON_LABELS[account.declineReason].toLowerCase()}`)
    return ok(account)
  }
  const rules = rulesForState(state)
  const request = MOCK_ERRORS[options.request ?? 'identity_unverified']
  const refusal = request.allowedWhen(state, rules)
  if (refusal) return fail('invalid_input', refusal)
  const key = request.requirement(rules)
  const alternative = request.alternativeFromRules
    ? rules.alternatives.find((a) => a.original === key)?.alternative ?? null
    : request.alternative
  const subject = requestSubject(state, request)
  const wasVerified = account.verification === 'verified'
  // One outstanding request per decision (threshold items aren't requests and keep their own deadline);
  // a verified business gets a deadline, one still in review doesn't.
  resolveTasks(state, env, (t) => t.kind === 'verification' && !isThresholdTask(t))
  retireActivationTasks(state, env)
  addTask(state, env, {
    kind: 'verification',
    title: request.title(requestSubjectName(state, request), rules),
    description: request.description,
    affects: ['payments', 'payouts'],
    dueAt: wasVerified ? daysFrom(env.now, 14) : null,
    blocking: true,
    role: 'owner',
    step: 'verify',
    disputeId: null,
    payoutId: null,
    methodId: null,
    channelId: null,
    requirement: key,
    ...(request.scope === 'owner' && subject ? { personId: subject.id } : {}),
    errorCode: request.code,
    errorReason: request.reason,
    ...(alternative?.length ? { alternative } : {}),
  })
  if (!wasVerified) account.verification = 'action_required'
  log(state, env, 'verification', `More information requested by our payments partner — ${request.reason}`)
  return ok(account)
}

/** Reviewer control: a later-dated item comes due (a volume threshold was reached). Payouts pause at the deadline, payments a week later. */
export function raiseThresholdRequirement(state: MaropayAccountState, key: RequirementKey, env: AdapterEnv): Result<ActionTask> {
  const account = state.account
  if (!account || account.verification !== 'verified' || account.closedAt) return fail('stale_state', 'Later requirements are only raised on a verified account.')
  const rules = rulesForState(state)
  const item = rules.dueLater.find((d) => d.key === key)
  if (!item) return fail('invalid_input', 'Our payments partner doesn’t ask for that later for this business.')
  const existing = state.tasks.find((t) => t.requirement === key && t.status !== 'resolved')
  if (existing) return ok(existing)
  const label = requirementLabel(key, rules)
  if (providedKeys(state.onboarding, state.terms.version, env.now, rules).has(key)) {
    return fail('invalid_input', `The ${label} is already on file, so our payments partner won’t ask for it.`)
  }
  if (!requirementForm(key, rules)) return fail('invalid_input', `The prototype can’t collect the ${label} yet.`)
  const dueAt = daysFrom(env.now, 14)
  const paymentsPauseAt = daysFrom(env.now, 14 + THRESHOLD_ESCALATION_DAYS)
  const task = addTask(state, env, {
    kind: 'verification',
    title: `Provide your ${label} by ${formatDay(dueAt)}`,
    description: `Our payments partner asks for this once your payouts pass its threshold. Payouts pause on ${formatDay(dueAt)} and payments on ${formatDay(paymentsPauseAt)} if it’s still missing.`,
    affects: ['payouts', 'payments'],
    dueAt,
    blocking: false,
    role: 'owner',
    step: 'verify',
    disputeId: null,
    payoutId: null,
    methodId: null,
    channelId: null,
    requirement: key,
    paymentsPauseAt,
  })
  log(state, env, 'verification', `Our payments partner asked for the ${label}`)
  return ok(task)
}

// ── Activation tasks (after approval) ─────────────────────────────────────
// Approval prompts; the owner decides. One task per store that could go live,
// deep-linked to its Payments page. Never automatic, never re-raised after
// the owner stops Maropay on a store.

export function ensureActivationTasks(state: MaropayAccountState, env: AdapterEnv): ActionTask[] {
  const account = state.account
  if (!account || account.verification !== 'verified' || account.closedAt) return []
  const raised: ActionTask[] = []
  for (const binding of state.bindings) {
    if (binding.activation === 'live' || binding.deactivatedAt) continue
    if (channelProblem(env.channelFacts ? env.channelFacts(binding.channelId) : undefined)) continue
    if (state.tasks.some((t) => t.kind === 'activate_store' && t.channelId === binding.channelId && t.status !== 'resolved')) continue
    const name = env.channelName?.(binding.channelId) ?? 'your store'
    raised.push(addTask(state, env, {
      kind: 'activate_store',
      title: `Activate Maropay on ${name}`,
      description: 'Your business is verified. Finish the store’s checklist, then activate Maropay when you’re ready — nothing changes at checkout until you do.',
      affects: ['store_activation'],
      dueAt: null,
      blocking: false,
      role: 'owner',
      step: null,
      disputeId: null,
      payoutId: null,
      methodId: null,
      channelId: binding.channelId,
    }))
  }
  return raised
}

function retireActivationTasks(state: MaropayAccountState, env: AdapterEnv, channelId?: string): void {
  resolveTasks(state, env, (t) => t.kind === 'activate_store' && (channelId === undefined || t.channelId === channelId))
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
  ensureActivationTasks(state, env)
  return ok(binding)
}

const WALLETS_ON_CARD = ['apple_pay', 'google_pay']

/** Whether Maropay takes this store's cards today, as `maropayOfferedMethods` wants to know it. */
function maropayCardsVia(setup: StoreProviderSetup): 'maropay' | 'existing' {
  return setup.cardProcessor === 'maropay' ? 'maropay' : 'existing'
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
    // Wallets tokenise a card, so they ride on card payments.
    if (WALLETS_ON_CARD.includes(methodId) && !binding.enabledMethodIds.includes('card')) {
      return fail('invalid_input', `${method.label} runs on card payments — turn on ${state.methods.find((m) => m.id === 'card')?.label ?? 'Cards'} first.`)
    }
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
    // Turning off cards takes the wallets that run on them too.
    const dropping = methodId === 'card' ? ['card', ...WALLETS_ON_CARD] : [methodId]
    const kept = binding.enabledMethodIds.filter((id) => !dropping.includes(id))
    const setup = storeProvidersFor(state, channelId)
    if (binding.activation === 'live' && maropayOfferedMethods(state, { ...binding, enabledMethodIds: kept }, setup, maropayCardsVia(setup)).length === 0) {
      return fail('invalid_input', 'A live store needs at least one ready payment method.')
    }
    binding.enabledMethodIds = kept
  }
  if (binding.activation !== 'live') resetActivationChecks(binding)
  log(state, env, 'methods', `${enabled ? 'Turned on' : 'Turned off'} ${method.label}`, channelId)
  return ok(binding)
}

/** Reviewer control: the payments partner's decision on a method that needed approval, with its capability-level reason when declined. */
export function simulateMethodApproval(state: MaropayAccountState, methodId: string, approved: boolean, env: AdapterEnv, reason: MethodDeclineReason = 'other'): Result<null> {
  const method = state.methods.find((m) => m.id === methodId)
  if (!method || method.availability !== 'pending_approval') return fail('stale_state', 'That method isn’t awaiting approval.')
  method.availability = approved ? 'available' : 'unavailable'
  method.declineReason = approved ? null : reason
  method.reviewNote = approved ? null : METHOD_DECLINE_COPY[reason]
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

/** How the store's checkout presents its methods. Every field is optional; only what's passed changes. */
export interface CheckoutOptionsPatch {
  expressWallets?: boolean
  payButtonLabel?: PayButtonLabel
  /** Enabled method ids in the order shoppers see them. */
  methodOrder?: string[]
  /** Pre-selected at checkout; null = the first method in order. */
  defaultMethodId?: string | null
}

/**
 * Presentation only: what checkout offers stays the same, so — unlike methods and
 * capture — it keeps the store's test checkout and impact review.
 */
export function updateCheckoutOptions(state: MaropayAccountState, channelId: string, patch: CheckoutOptionsPatch, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change checkout options.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  const label = (id: string) => methodFacts(state, id)?.label ?? id
  // The order and default span every provider on the store: Maropay's methods and the merchant's own.
  const arrangeable = new Set([...binding.enabledMethodIds, ...ownMethodIds(storeProvidersFor(state, channelId))])
  if (patch.payButtonLabel !== undefined && !(patch.payButtonLabel in PAY_BUTTON_LABELS)) return fail('invalid_input', 'Choose one of the pay button labels.')
  if (patch.methodOrder !== undefined) {
    const order = patch.methodOrder
    if (new Set(order).size !== order.length || order.some((id) => !arrangeable.has(id))) {
      return fail('invalid_input', 'The method order can only list methods that are on for this store, once each.')
    }
  }
  if (patch.defaultMethodId != null && !arrangeable.has(patch.defaultMethodId)) {
    return fail('invalid_input', `${label(patch.defaultMethodId)} isn’t on for this store, so it can’t be the default.`)
  }
  const changes: string[] = []
  if (patch.expressWallets !== undefined && patch.expressWallets !== binding.checkout.expressWallets) {
    binding.checkout = { ...binding.checkout, expressWallets: patch.expressWallets }
    changes.push(`express buttons ${patch.expressWallets ? 'on' : 'off'}`)
  }
  if (patch.payButtonLabel !== undefined && patch.payButtonLabel !== binding.checkout.payButtonLabel) {
    binding.checkout = { ...binding.checkout, payButtonLabel: patch.payButtonLabel }
    changes.push(`pay button reads “${PAY_BUTTON_LABELS[patch.payButtonLabel].replace(' {amount}', '')}”`)
  }
  if (patch.methodOrder !== undefined && patch.methodOrder.join() !== binding.methodOrder.join()) {
    binding.methodOrder = [...patch.methodOrder]
    changes.push(`method order ${patch.methodOrder.map(label).join(', ')}`)
  }
  if (patch.defaultMethodId !== undefined && patch.defaultMethodId !== binding.defaultMethodId) {
    binding.defaultMethodId = patch.defaultMethodId
    changes.push(patch.defaultMethodId ? `${label(patch.defaultMethodId)} selected by default` : 'no default method')
  }
  if (changes.length) log(state, env, 'methods', `Checkout options: ${changes.join('; ')}`, channelId)
  return ok(binding)
}

/** Runs a synthetic payment through the store's checkout configuration. */
export function validateCheckout(state: MaropayAccountState, channelId: string, env: AdapterEnv): Result<StoreBinding> {
  if (!allowed(env, 'validate_checkout', channelId)) return denied('Only the business owner can run the activation test.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  const at = isoAt(env.now)
  if (!maropayOfferedMethods(state, binding, storeProvidersFor(state, channelId), 'maropay').length) {
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

export interface ActivateStoreOptions {
  /**
   * The Activate dialog's choice: Maropay takes cards (and the wallets that ride on them) from the
   * store's gateway. On by default, and forced on when the store has no gateway.
   */
  takeCards?: boolean
}

export function activateStore(state: MaropayAccountState, channelId: string, channel: ChannelFacts | null, env: AdapterEnv, options: ActivateStoreOptions = {}): Result<StoreBinding> {
  if (!allowed(env, 'activate_store', channelId)) return denied('Only the business owner can activate Maropay on a store.')
  const binding = findBinding(state, channelId)
  if (!binding) return fail('not_found', 'That store isn’t linked to Maropay.')
  if (binding.activation === 'live') return ok(binding)
  if (state.account?.eligibility === 'unsupported') return fail('unsupported_country', 'Maropay isn’t available for this business.')
  const checklist = activationChecklist(state, binding, channel, env.now)
  if (!checklist.ok) return fail('requirement_pending', 'Finish the activation checklist first.')
  const current = storeProvidersFor(state, channelId)
  const gateway = cardGateway(current)
  const via = gateway ? providerLabel(gateway.kind) : null
  const takeCards = gateway ? options.takeCards ?? true : true
  const added = maropayOfferedMethods(state, binding, current, takeCards ? 'maropay' : 'existing')
  if (!added.length) {
    return fail('invalid_input', via
      ? `Maropay would add nothing while ${via} keeps cards — let Maropay take cards, or turn on a method ${via} doesn’t offer.`
      : 'Turn on at least one payment method before you activate.')
  }
  binding.activation = 'live'
  binding.activatedAt = isoAt(env.now)
  binding.deactivatedAt = null
  binding.activationNoticeDismissedAt = null
  const setup = ensureStoreProviders(state, channelId)
  if (takeCards) setup.cardProcessor = 'maropay'
  retireActivationTasks(state, env, channelId)
  const name = channel?.name ?? 'a store'
  log(state, env, 'store', takeCards
    ? `Activated Maropay on ${name}${via ? ` — takes cards from ${via} for new checkouts` : ''}`
    : `Activated Maropay on ${name} beside ${via} — ${via} keeps cards; Maropay adds ${joinList(added.map((m) => m.label))}`, channelId)
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
  // Cards go back to the merchant's own gateway, when one is still connected.
  const setup = ensureStoreProviders(state, channelId)
  if (setup.cardProcessor === 'maropay') setup.cardProcessor = cardGateway(setup)?.kind ?? null
  const fallback = setup.cardProcessor ? `cards go back to ${providerLabel(setup.cardProcessor)}` : 'no card processor is connected'
  log(state, env, 'store', `Stopped Maropay for new checkouts — ${fallback}`, channelId)
  return ok(binding)
}

// ── The store's own providers ─────────────────────────────────────────────
// PayPal, Stripe, eWay, Afterpay, Zip and the manual methods a merchant adds
// themselves. Connecting is a stub: a provider starts "setup incomplete" and the
// Connect button marks it active, where production would sign in with the provider.

export function connectProvider(state: MaropayAccountState, channelId: string, kind: OwnProviderKind, env: AdapterEnv): Result<StoreProviderSetup> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can add payment providers.')
  if (!isOwnProviderKind(kind)) return fail('invalid_input', 'That provider isn’t available here.')
  if (connectionOf(storeProvidersFor(state, channelId), kind)) return fail('invalid_input', `${providerLabel(kind)} is already on this store.`)
  const setup = ensureStoreProviders(state, channelId)
  const manual = isManualKind(kind)
  const status: ProviderStatus = manual ? 'active' : 'setup_incomplete'
  setup.connections.push(connectionFor(kind, isoAt(env.now), status))
  log(state, env, 'methods', manual ? `Added ${providerLabel(kind)}` : `Connected ${providerLabel(kind)} — setup still to finish`, channelId)
  return ok(setup)
}

/** Switch a provider on or off at checkout. The card processor follows: switching it off hands cards to the next gateway, or to nobody. */
export function setProviderStatus(state: MaropayAccountState, channelId: string, kind: OwnProviderKind, status: 'active' | 'inactive', env: AdapterEnv): Result<StoreProviderSetup> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change payment providers.')
  const current = connectionOf(storeProvidersFor(state, channelId), kind)
  if (!current) return fail('not_found', `${providerLabel(kind)} isn’t on this store.`)
  if (current.status === status) return ok(storeProvidersFor(state, channelId))
  const setup = ensureStoreProviders(state, channelId)
  const connection = connectionOf(setup, kind)!
  const was = connection.status
  connection.status = status
  const offersCards = connection.methods.some((m) => m.methodId === 'card')
  if (status === 'inactive' && setup.cardProcessor === kind) setup.cardProcessor = cardGateway(setup)?.kind ?? null
  if (status === 'active' && setup.cardProcessor === null && offersCards) setup.cardProcessor = kind
  log(state, env, 'methods', status === 'active'
    ? `${was === 'setup_incomplete' ? 'Connected' : 'Turned on'} ${providerLabel(kind)}`
    : `Turned off ${providerLabel(kind)}`, channelId)
  return ok(setup)
}

export function removeProvider(state: MaropayAccountState, channelId: string, kind: OwnProviderKind, env: AdapterEnv): Result<StoreProviderSetup> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can remove payment providers.')
  if (!connectionOf(storeProvidersFor(state, channelId), kind)) return fail('not_found', `${providerLabel(kind)} isn’t on this store.`)
  const setup = ensureStoreProviders(state, channelId)
  setup.connections = setup.connections.filter((c) => c.kind !== kind)
  if (setup.cardProcessor === kind) setup.cardProcessor = cardGateway(setup)?.kind ?? null
  log(state, env, 'methods', `Removed ${providerLabel(kind)} from the store`, channelId)
  return ok(setup)
}

/**
 * The checkout lineup, rearranged: every provider on the store once, Maropay among them while it is
 * live. Presentation only, like checkout options — nothing about what checkout offers changes.
 */
export function reorderLineup(state: MaropayAccountState, channelId: string, kinds: ProviderKind[], env: AdapterEnv): Result<StoreProviderSetup> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change the checkout order.')
  const current = storeProvidersFor(state, channelId)
  const expected = lineupFor(current, { maropay: findBinding(state, channelId)?.activation === 'live' })
  if (kinds.length !== expected.length || new Set(kinds).size !== kinds.length || kinds.some((k) => !expected.includes(k))) {
    return fail('invalid_input', 'The checkout order can only list the providers on this store, once each.')
  }
  if (kinds.join() === expected.join()) return ok(current)
  const setup = ensureStoreProviders(state, channelId)
  setup.lineup = [...kinds]
  log(state, env, 'methods', `Checkout order: ${kinds.map(providerLabel).join(', ')}`, channelId)
  return ok(setup)
}

/** What a manual method says to shoppers. Every field is optional; only what's passed changes. */
export function updateManualMethod(state: MaropayAccountState, channelId: string, kind: OwnProviderKind, fields: Partial<ManualMethodSettings>, env: AdapterEnv): Result<StoreProviderSetup> {
  if (!allowed(env, 'manage_methods', channelId)) return denied('Only the business owner can change payment providers.')
  if (!isManualKind(kind)) return fail('invalid_input', 'Only manual payment methods have checkout wording to edit.')
  const current = connectionOf(storeProvidersFor(state, channelId), kind)
  if (!current?.manual) return fail('not_found', `${providerLabel(kind)} isn’t on this store.`)
  const next: ManualMethodSettings = {
    displayName: (fields.displayName ?? current.manual.displayName).trim(),
    checkoutDescription: (fields.checkoutDescription ?? current.manual.checkoutDescription).trim(),
    paymentInstructions: (fields.paymentInstructions ?? current.manual.paymentInstructions).trim(),
  }
  if (!next.displayName) return fail('invalid_input', 'Give the method a name shoppers will see at checkout.')
  if (JSON.stringify(next) === JSON.stringify(current.manual)) return ok(storeProvidersFor(state, channelId))
  const setup = ensureStoreProviders(state, channelId)
  connectionOf(setup, kind)!.manual = next
  log(state, env, 'methods', `Updated what ${providerLabel(kind)} says at checkout`, channelId)
  return ok(setup)
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
  lineItems: CheckoutLineItem[]
  /** Cards: "Visa •••• 4242" from the number typed (storefront.ts `cardLabel`); the prototype's default when absent. */
  cardLabel?: string | null
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

/**
 * Opens a checkout through whichever provider offers the chosen method on this store — Maropay,
 * one of the merchant's own providers, or a manual method. The offer decides, so the shopper's
 * page and the "server" can't disagree.
 */
export function createCheckoutSession(state: MaropayAccountState, input: CheckoutInput, env: AdapterEnv): Result<CheckoutSession> {
  const method = resolveShopperMethods(state, input.channelId).find((m) => m.id === input.methodId)
  if (!method) {
    const binding = findBinding(state, input.channelId)
    if (binding && binding.activation !== 'live' && binding.enabledMethodIds.includes(input.methodId)) {
      const gateway = cardGateway(storeProvidersFor(state, input.channelId))
      const label = methodFacts(state, input.methodId)?.label ?? 'That method'
      return fail('store_not_live', `Maropay isn’t live on this store, so ${label} isn’t available yet — checkout uses ${gateway ? providerLabel(gateway.kind) : 'the store’s other providers'} for now.`)
    }
    return fail('method_unavailable', 'That payment method isn’t offered at checkout on this store.')
  }
  if (method.providerId === 'maropay' && deriveCapabilities(state, env.now).payments !== 'enabled') return fail('requirement_pending', 'Payments are restricted on this account.')
  if (!isPositive(input.amount)) return fail('invalid_amount', 'Checkout needs an amount greater than zero.')
  if (!input.lineItems.length || input.lineItems.some((l) => l.qty < 1)) return fail('invalid_input', 'Checkout needs at least one item.')
  const session: CheckoutSession = {
    id: nextId(state, 'cs'),
    channelId: input.channelId,
    amount: input.amount,
    methodId: input.methodId,
    providerId: method.providerId,
    methodLabel: method.label,
    cardLabel: input.methodId === 'card' ? input.cardLabel ?? null : null,
    flow: input.flow,
    state: 'open',
    paymentId: null,
    order: null,
    customer: { ...input.customer },
    lineItems: input.lineItems.map((l) => ({ ...l })),
    createdAt: isoAt(env.now),
  }
  state.sessions.unshift(session)
  return ok(session)
}

function sessionPayment(state: MaropayAccountState, session: CheckoutSession, status: PaymentStatus, env: AdapterEnv, failure: Payment['failure'] = null): Payment {
  const ours = session.providerId === 'maropay'
  const binding = findBinding(state, session.channelId)
  // Maropay follows the store's capture setting; a merchant's gateway follows its own, and everything else captures at once.
  const connection = ours ? null : connectionOf(storeProvidersFor(state, session.channelId), session.providerId)
  const captureMode: CaptureMode = ours ? binding?.captureMode ?? 'automatic' : connection?.captureMode ?? 'automatic'
  const facts = methodFacts(state, session.methodId)
  const n = nextNumber(state, 'checkout_payment')
  const at = isoAt(env.now)
  const payment: Payment = {
    id: `pay_mp${1000 + n}`,
    accountId: state.accountId,
    channelId: session.channelId,
    orderId: null,
    orderNumber: null,
    provider: session.providerId,
    processorRef: ours ? `pi_mp${state.accountId}_${n}` : `${session.providerId}_${state.accountId}_${n}`,
    methodId: session.methodId,
    methodLabel: session.methodId === 'card' ? session.cardLabel ?? CARD_LABEL : session.methodLabel,
    amount: session.amount,
    status,
    captureMode,
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
  event(state, payment, env, 'created', `Checkout started on ${facts?.label ?? session.methodLabel}${ours ? '' : ` through ${providerLabel(session.providerId)}`}`)
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
  const payment = sessionPayment(state, session, 'authorised', env)
  const order = orderFor(state, session, payment, env)
  if (payment.captureMode === 'automatic') {
    recordCapture(state, payment, session.id, env)
    event(state, payment, env, 'captured', `Payment captured — ${payment.methodLabel}`)
  } else {
    event(state, payment, env, 'authorised', `Payment authorised — capture it from the order within 7 days`)
    if (payment.provider === 'maropay' && !state.milestones.firstPaymentId) state.milestones.firstPaymentId = payment.id
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
    lineItems: session.lineItems.map((l) => ({ ...l })),
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
    case 'manual': {
      // Paid outside the store: the order is placed now, and the merchant records the money when it arrives.
      const payment = sessionPayment(state, session, 'processing', env)
      payment.expectedResolutionAt = null
      const order = orderFor(state, session, payment, env)
      event(state, payment, env, 'processing', `Awaiting payment — ${payment.methodLabel}. Record it from the order once it arrives.`)
      session.state = 'processing'
      return ok({ session, payment, createdOrder: order })
    }
  }
}

/**
 * The merchant records a manual payment's outcome: the money arrived (captured — no fee, nothing
 * moves in the Maropay balance) or it never did (failed). Idempotent by key, like a capture.
 */
export function markManualPayment(state: MaropayAccountState, paymentId: string, outcome: 'received' | 'not_received', key: string, env: AdapterEnv): Result<Payment> {
  const payment = findPayment(state, paymentId)
  if (!payment) return fail('not_found', 'That payment doesn’t exist on this account.')
  if (!allowed(env, 'capture', payment.channelId)) return denied('You don’t have permission to record payments on this store.')
  if (!isManualKind(payment.provider)) return fail('stale_state', 'Only payments made outside the store are recorded by hand.')
  if (payment.captures.some((c) => c.idempotencyKey === key)) return ok(payment)
  if (payment.status !== 'processing') {
    return payment.status === 'failed' && outcome === 'not_received' ? ok(payment) : fail('stale_state', `This payment is already ${PAYMENT_STATUS_LABELS[payment.status].toLowerCase()}.`)
  }
  if (outcome === 'received') {
    recordCapture(state, payment, key, env)
    event(state, payment, env, 'captured', 'Payment received — recorded in Maropost')
  } else {
    payment.status = 'failed'
    payment.failure = { code: 'not_received', message: 'The payment never arrived.' }
    event(state, payment, env, 'failed', 'Marked as not received — the order can be cancelled')
  }
  payment.expectedResolutionAt = null
  return ok(payment)
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
    // Fixture history through another provider is what "before Maropay" means on Transactions.
    ...(input.provider === 'maropay' ? {} : { legacy: true }),
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
  input: { holderName: string; bankName: string; accountNumber: string; bankCode?: string; holderType?: 'individual' | 'company' | null },
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
  const destination: PayoutDestination = {
    bankName: input.bankName.trim(),
    last4: digits.slice(-4),
    holderName: input.holderName.trim(),
    routingNumber: (input.bankCode ?? '').replace(/[\s-]/g, ''),
    currency: account.currency,
    country: account.country,
    holderType: input.holderType ?? account.payoutDestination?.holderType ?? null,
    addedAt: isoAt(env.now),
  }
  account.payoutDestination = destination
  resolveTasks(state, env, (t) => t.kind === 'bank')
  log(state, env, 'bank', `Payout bank changed to ${destination.bankName} •••• ${destination.last4}`)
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
