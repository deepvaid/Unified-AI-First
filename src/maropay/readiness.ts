/**
 * Maropay readiness: everything derived from state, and the guards financial
 * actions check before they run. Nothing here mutates.
 *
 * Capabilities are derived (verification + open tasks + deadlines), not
 * stored, so a resolved task or a passed deadline can never leave a stale
 * "Payments enabled" behind.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { applyRate, compare, formatMoney, isPositive, subtract, sum, zero } from './money.ts'
import type { Money } from './money.ts'
import { DECLINE_REASON_COPY, LAST_DAY_OF_MONTH, ONBOARDING_STEPS, PROVIDER_LABELS, SUPPORTED_COUNTRIES, WEEKDAY_LABELS, problem } from './model.ts'
import type {
  ActionTask,
  CaptureMode,
  Dispute,
  MaropayAccount,
  MaropayAccountState,
  MaropayError,
  MaropayProvider,
  MethodStatus,
  OnboardingStepKey,
  Payment,
  PaymentCapability,
  PaymentMethodCatalogEntry,
  PaymentStatus,
  PayoutCapability,
  SetupState,
  StoreActivationState,
  StoreBinding,
  VerificationState,
} from './model.ts'

/** A route to open, without accountId — the UI adds the active account. */
export interface MaropayTarget {
  name: string
  params?: Record<string, string>
  query?: Record<string, string>
}

/**
 * One store's payments inside Maropay's own frame (its rail and way back stay on screen).
 * The store editor shows the same page as `StorePayments`, for people who come from Sales channels.
 */
export const MAROPAY_STORE_ROUTE = 'MaropayStorePayments'

/** Where a store's payments open: Maropay's frame by default, the store editor's on request. */
export function storePaymentsTarget(channelId: string, frame: 'maropay' | 'store' = 'maropay'): MaropayTarget {
  return { name: frame === 'maropay' ? MAROPAY_STORE_ROUTE : 'StorePayments', params: { channelId } }
}

/** English list: "Cards, Apple Pay and Google Pay". */
export function joinList(items: readonly string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatDay(iso: string): string {
  return DATE_FORMAT.format(new Date(iso))
}

/** Short enough for the wizard's step chips; the step cards carry the longer titles. */
export const STEP_LABELS: Record<OnboardingStepKey, string> = {
  business: 'Business',
  terms: 'Rates and terms',
  verify: 'Verification',
  payout: 'Payout account',
  public: 'Public details',
  review: 'Review',
}

/** "Daily, 2 business days after a payment" · "Weekly on Fridays, …" · "Monthly on the last day, …" */
export function payoutScheduleLabel(schedule: MaropayAccount['payoutSchedule']): string {
  const when = schedule.interval === 'daily'
    ? 'Daily'
    : schedule.interval === 'weekly'
      ? `Weekly on ${WEEKDAY_LABELS[schedule.weeklyAnchor ?? 'friday']}`
      : `Monthly on ${schedule.monthlyAnchor === null || schedule.monthlyAnchor >= LAST_DAY_OF_MONTH ? 'the last day' : `day ${schedule.monthlyAnchor}`}`
  return `${when}, ${schedule.delayDays} business days after a payment`
}

export function isSupportedCountry(country: string): boolean {
  return SUPPORTED_COUNTRIES.includes(country)
}

// ── Capabilities and the six state dimensions ─────────────────────────────

export interface Capabilities {
  payments: PaymentCapability
  payouts: PayoutCapability
}

function openTasks(state: MaropayAccountState): ActionTask[] {
  return state.tasks.filter((t) => t.status !== 'resolved')
}

/** Threshold items (raised when payouts pass the partner's threshold) carry their own staged deadline; a decision never discharges them unanswered. */
export function isThresholdTask(task: ActionTask): boolean {
  return task.kind === 'verification' && task.paymentsPauseAt !== undefined
}

/** What a partner decision acts on: its own requests in any state, and threshold items the merchant has answered. */
export function awaitingDecision(task: ActionTask): boolean {
  if (task.kind !== 'verification' || task.status === 'resolved') return false
  return !isThresholdTask(task) || task.status === 'waiting_review'
}

export function deriveCapabilities(state: MaropayAccountState, now: number): Capabilities {
  const account = state.account
  if (!account) return { payments: 'inactive', payouts: 'inactive' }
  if (account.closedAt) return { payments: 'disabled', payouts: 'inactive' }
  // A decline switches off a business that was trading; one that never traded simply stays off ("Not enabled").
  if (account.verification === 'rejected') return { payments: account.verifiedAt ? 'disabled' : 'inactive', payouts: 'inactive' }
  if (account.verification !== 'verified') return { payments: 'inactive', payouts: 'inactive' }
  const open = openTasks(state)
  // Staged enforcement: payouts pause at a task's deadline, payments at its later pause date (or the deadline when it has none).
  const restricted = open.some((t) => t.affects.includes('payments') && t.dueAt !== null && Date.parse(t.paymentsPauseAt ?? t.dueAt) <= now)
  const payoutTasks = open.filter((t) => t.affects.includes('payouts') && (t.dueAt === null || Date.parse(t.dueAt) <= now))
  const payouts: PayoutCapability = !account.payoutDestination || payoutTasks.some((t) => t.kind === 'payout_failed')
    ? 'action_required'
    : payoutTasks.length ? 'paused' : 'ready'
  return { payments: restricted ? 'restricted' : 'enabled', payouts }
}

/** One answer per store: live, inactive (the account can't take payments yet), needs setup, or ready to activate. */
export function storeActivationState(binding: StoreBinding, capabilities: Capabilities, checklist: ActivationChecklist): StoreActivationState {
  if (binding.activation === 'live') return 'live'
  if (capabilities.payments !== 'enabled') return 'inactive'
  return checklist.ok ? 'ready_to_activate' : 'needs_setup'
}

/** A store's line in a list (Overview, Settings › Stores): who takes its checkout's payments today. */
export function storeCheckoutNote(binding: StoreBinding, state: StoreActivationState): string {
  if (state === 'live') return 'Checkout uses Maropay'
  return binding.previousProvider ? `Checkout uses ${PROVIDER_LABELS[binding.previousProvider.provider]}` : 'Keeps its current payment setup'
}

export interface ReadinessDimensions {
  setup: SetupState
  verification: VerificationState
  payments: PaymentCapability
  payouts: PayoutCapability
  liveStores: number
  linkedStores: number
}

export function readinessDimensions(state: MaropayAccountState, now: number): ReadinessDimensions {
  const caps = deriveCapabilities(state, now)
  return {
    setup: state.account?.setup ?? 'not_started',
    verification: state.account?.verification ?? 'not_submitted',
    payments: caps.payments,
    payouts: caps.payouts,
    liveStores: state.bindings.filter((b) => b.activation === 'live').length,
    linkedStores: state.bindings.length,
  }
}

// ── Overview headline (plan §4) ───────────────────────────────────────────

export type OverviewKey =
  | 'not_started' | 'closed' | 'declined' | 'unavailable' | 'finish_setup' | 'provide_info'
  | 'under_review' | 'set_up_store' | 'ready_to_activate' | 'payouts_attention' | 'activate_more' | 'active'

/** Sales-channel facts by id — the overview needs names and store checks; tests may leave it out. */
export type FactsFor = (channelId: string) => ChannelFacts | null

export type PartnerDecision = 'verified' | 'more_info' | 'rejected'

/** What our payments partner could still decide about this account (the reviewer's choices). */
export function availablePartnerDecisions(state: MaropayAccountState): PartnerDecision[] {
  const account = state.account
  if (!account || account.setup !== 'submitted' || account.closedAt || account.verification === 'rejected') return []
  // A verified business is "approved" again only when something is awaiting the partner's decision.
  const decisions: PartnerDecision[] = account.verification === 'verified' && !state.tasks.some(awaitingDecision) ? ['more_info'] : ['verified', 'more_info']
  // A business with a live store is never declined — the partner pauses it with a request instead.
  return state.bindings.some((b) => b.activation === 'live') ? decisions : [...decisions, 'rejected']
}

export interface OverviewInstruction {
  key: OverviewKey
  headline: string
  detail: string
  action: { label: string; target: MaropayTarget } | null
  task: ActionTask | null
  deadline: string | null
}

export function taskTarget(task: ActionTask): MaropayTarget {
  switch (task.kind) {
    case 'verification':
      return { name: 'MaropaySetup', query: { task: task.id } }
    case 'owner_review':
      return { name: 'MaropaySetup' }
    case 'bank':
      return { name: 'MaropayPayouts' }
    case 'payout_failed':
      return task.payoutId ? { name: 'MaropayPayoutDetail', params: { payoutId: task.payoutId } } : { name: 'MaropayPayouts' }
    case 'dispute':
      return task.disputeId ? { name: 'MaropayDisputeDetail', params: { disputeId: task.disputeId } } : { name: 'MaropayDisputes' }
    case 'method_review':
      return task.channelId ? storePaymentsTarget(task.channelId) : { name: 'MaropaySettings', query: { tab: 'methods' } }
    case 'business_change':
      return { name: 'MaropaySettings', query: { tab: 'business' } }
    case 'activate_store':
      return task.channelId ? storePaymentsTarget(task.channelId) : { name: 'MaropaySettings', query: { tab: 'stores' } }
  }
}

/** Dated tasks affecting payments in one status, earliest deadline first. Open ones are the merchant's move; waiting ones the partner's. */
function datedTasks(state: MaropayAccountState, status: ActionTask['status']): ActionTask[] {
  return state.tasks
    .filter((t) => t.status === status && t.dueAt !== null && t.affects.includes('payments'))
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))
}

/**
 * Translates the state dimensions into the one instruction the merchant needs
 * (plan §4). Priority: closed → declined → unavailable → finish setup →
 * provide information → under review → set up / ready to activate → payouts
 * need attention → activate more → active. Exiting onboarding is never
 * treated as approval, and approval never activates a store by itself.
 */
export function deriveOverviewInstruction(state: MaropayAccountState, now: number, factsFor?: FactsFor): OverviewInstruction {
  const account = state.account
  const base = { task: null, deadline: null }
  const nameOf = (channelId: string) => factsFor?.(channelId)?.name ?? 'your store'
  if (!account) {
    return {
      ...base,
      key: 'not_started',
      headline: 'Accept payments and manage your money from Maropost',
      detail: 'Set up Maropay to take payments on your stores. It’s optional — your current provider keeps working until you switch.',
      action: { label: 'Set up Maropay', target: { name: 'MaropaySetup' } },
    }
  }
  if (account.closedAt) {
    return {
      ...base,
      key: 'closed',
      headline: 'Your Maropay account is closed',
      detail: `Closed on ${formatDay(account.closedAt)}. Your payments, refunds and payouts stay here to look back on. To use Maropay again, contact Maropost support.`,
      action: null,
    }
  }
  if (account.verification === 'rejected') {
    return {
      ...base,
      key: 'declined',
      headline: 'Our payments partner couldn’t approve this business',
      detail: `${DECLINE_REASON_COPY[account.declineReason ?? 'other']} Your stores keep their current payment setup. You can ask for the decision to be reviewed through Maropost support.`,
      action: null,
    }
  }
  if (account.eligibility === 'unsupported') {
    return {
      ...base,
      key: 'unavailable',
      headline: 'Maropay isn’t available for this business',
      detail: 'Businesses registered in this country aren’t supported yet. Your current payment provider keeps working.',
      // Before submission the country is still the merchant's answer, so it can be corrected.
      action: account.setup === 'submitted' ? null : { label: 'Review setup details', target: { name: 'MaropaySetup' } },
    }
  }
  if (account.setup !== 'submitted') {
    const step = state.onboarding.lastStep
    return {
      ...base,
      key: 'finish_setup',
      headline: 'Finish setting up Maropay',
      detail: `Step ${ONBOARDING_STEPS.indexOf(step) + 1} of ${ONBOARDING_STEPS.length} — ${STEP_LABELS[step]}. Your progress is saved.`,
      action: { label: 'Continue setup', target: { name: 'MaropaySetup' } },
    }
  }
  const task = datedTasks(state, 'open')[0]
  if (task) {
    // Staged: the deadline pauses payouts, the later pause date (or the deadline itself) pauses payments too.
    const due = Date.parse(task.dueAt!)
    const paymentsPause = task.paymentsPauseAt ? Date.parse(task.paymentsPauseAt) : due
    return {
      key: 'provide_info',
      headline: now >= paymentsPause
        ? 'Payments and payouts are paused until you provide information'
        : now >= due
          ? 'Payouts are paused until you provide information'
          : `Provide information by ${formatDay(task.dueAt!)} to avoid an interruption`,
      detail: task.title,
      action: { label: 'Provide information', target: taskTarget(task) },
      task,
      deadline: task.dueAt,
    }
  }
  // Answered but past its deadline: the pause holds until the partner accepts it, and the next move is theirs.
  const sent = account.verification === 'verified' ? datedTasks(state, 'waiting_review').find((t) => Date.parse(t.dueAt!) <= now) : undefined
  if (sent) {
    return {
      key: 'under_review',
      headline: deriveCapabilities(state, now).payments === 'restricted'
        ? 'Payments and payouts are paused while our payments partner reviews what you sent'
        : 'Payouts are paused while our payments partner reviews what you sent',
      detail: 'Nothing more is needed from you. Everything resumes once our payments partner accepts it — we’ll let you know.',
      action: null,
      task: sent,
      deadline: sent.dueAt,
    }
  }
  if (account.verification === 'action_required') {
    const open = openTasks(state).find((t) => t.kind === 'verification' && t.status === 'open') ?? null
    return {
      key: 'provide_info',
      headline: 'Provide the information our payments partner asked for',
      detail: open?.title ?? 'Some details need another look before your account can be verified.',
      action: open ? { label: 'Provide information', target: taskTarget(open) } : { label: 'Open setup', target: { name: 'MaropaySetup' } },
      task: open,
      deadline: null,
    }
  }
  if (account.verification !== 'verified') {
    return {
      ...base,
      key: 'under_review',
      headline: 'Your details are under review',
      detail: 'Our payments partner is checking your details. Nothing is needed from you right now — we’ll let you know when you can activate a store.',
      action: null,
    }
  }
  const caps = deriveCapabilities(state, now)
  const live = state.bindings.filter((b) => b.activation === 'live')
  const target = activationTarget(state, now, factsFor)
  if (!live.length) {
    if (!target) {
      return {
        ...base,
        key: 'ready_to_activate',
        headline: 'Ready to activate on your store',
        detail: 'Your business is verified. Link a store, choose payment methods and run a test checkout, then activate Maropay when you’re ready.',
        action: { label: 'Link a store', target: { name: 'MaropaySettings', query: { tab: 'stores' } } },
      }
    }
    const name = nameOf(target.binding.channelId)
    const progress = checklistProgress(target.checklist)
    const storeTarget = storePaymentsTarget(target.binding.channelId)
    if (target.kind === 'set_up_store') {
      return {
        ...base,
        key: 'set_up_store',
        headline: `Your business is verified — set up ${name} to activate`,
        detail: `${progress.done} of ${progress.total} checklist steps done. ${name} keeps its current payment setup until you activate Maropay on it.`,
        action: { label: `Set up ${name}`, target: storeTarget },
      }
    }
    return {
      ...base,
      key: 'ready_to_activate',
      headline: `Ready to activate on ${name}`,
      detail: `Every checklist step is done. ${name} keeps its current payment setup until you activate Maropay on it.`,
      action: { label: 'Review activation', target: storeTarget },
    }
  }
  if (caps.payouts !== 'ready') {
    const payoutTask = openTasks(state).find((t) => t.affects.includes('payouts')) ?? null
    return {
      key: 'payouts_attention',
      headline: 'Payments are active. Payouts need attention',
      detail: payoutTask?.title ?? 'Add a payout bank account so we can send your money.',
      action: payoutTask
        ? { label: 'Fix payouts', target: taskTarget(payoutTask) }
        : { label: 'Add bank account', target: { name: 'MaropaySettings', query: { tab: 'bank' } } },
      task: payoutTask,
      deadline: null,
    }
  }
  const stores = `${live.length} of ${state.bindings.length} linked ${state.bindings.length === 1 ? 'store' : 'stores'}`
  if (target) {
    const name = nameOf(target.binding.channelId)
    return {
      ...base,
      key: 'activate_more',
      headline: `Payments are active — ${name} isn’t on Maropay yet`,
      detail: `Maropay is live on ${stores}. ${target.kind === 'ready_to_activate' ? `${name} is ready to activate.` : `Finish ${name}’s checklist to activate it.`}`,
      action: { label: target.kind === 'ready_to_activate' ? `Activate on ${name}` : `Set up ${name}`, target: storePaymentsTarget(target.binding.channelId) },
    }
  }
  return {
    ...base,
    key: 'active',
    headline: 'Payments are active',
    detail: `Maropay is live on ${stores}.`,
    action: { label: 'View transactions', target: { name: 'MaropayTransactions' } },
  }
}

// ── Which store to activate next ──────────────────────────────────────────

export interface ActivationTarget {
  /** `ready_to_activate` = the checklist is done; `set_up_store` = it isn't. */
  kind: 'ready_to_activate' | 'set_up_store'
  binding: StoreBinding
  checklist: ActivationChecklist
}

/** Stores that aren't live and whose sales channel isn't the obstacle. */
export function activatableBindings(state: MaropayAccountState, factsFor?: FactsFor): StoreBinding[] {
  return state.bindings.filter((b) => b.activation !== 'live' && channelProblem(factsFor ? factsFor(b.channelId) : undefined) === null)
}

/** The store to activate next: one whose checklist is done, else the first that still needs setting up. Null when nothing is linked. */
export function activationTarget(state: MaropayAccountState, now: number, factsFor?: FactsFor): ActivationTarget | null {
  const candidates = activatableBindings(state, factsFor).map((binding) => ({
    binding,
    checklist: activationChecklist(state, binding, factsFor ? factsFor(binding.channelId) : undefined, now),
  }))
  const ready = candidates.find((c) => c.checklist.ok)
  if (ready) return { kind: 'ready_to_activate', ...ready }
  const next = candidates[0]
  return next ? { kind: 'set_up_store', ...next } : null
}

export function checklistProgress(checklist: ActivationChecklist): { done: number; total: number } {
  return { done: checklist.items.filter((i) => i.ok).length, total: checklist.items.length }
}

// ── Closing the account ───────────────────────────────────────────────────

export interface ClosureCheck {
  key: 'stores' | 'disputes' | 'payouts' | 'balance'
  label: string
  ok: boolean
  detail: string
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** What must be settled before the account can close — no money or decision may be left in flight. */
export function closureChecks(state: MaropayAccountState, now: number): ClosureCheck[] {
  const live = state.bindings.filter((b) => b.activation === 'live').length
  const disputes = state.disputes.filter((d) => d.status === 'needs_response' || d.status === 'under_review').length
  const inTransit = state.payouts.filter((p) => p.status === 'in_transit').length
  const held = deriveBalances(state, now)
    .map((b) => sum([b.available, b.pending], b.currency))
    .filter((total) => total.amount !== 0)
  return [
    {
      key: 'stores',
      label: 'No store uses Maropay',
      ok: live === 0,
      detail: live ? `${count(live, 'store still takes', 'stores still take')} payments with Maropay.` : 'No checkout uses Maropay.',
    },
    {
      key: 'disputes',
      label: 'No open disputes',
      ok: disputes === 0,
      detail: disputes ? `${count(disputes, 'dispute is', 'disputes are')} still open.` : 'Every dispute is settled.',
    },
    {
      key: 'payouts',
      label: 'No payouts on the way',
      ok: inTransit === 0,
      detail: inTransit ? `${count(inTransit, 'payout is', 'payouts are')} still on the way to your bank.` : 'Every payout has been sent.',
    },
    {
      key: 'balance',
      label: 'Nothing left in your balance',
      ok: held.length === 0,
      detail: held.length ? `Your balance is ${held.map((m) => formatMoney(m)).join(' and ')}. It has to be paid out or settled first.` : 'Your balance is zero.',
    },
  ]
}

// ── Methods ───────────────────────────────────────────────────────────────

export function methodStatusForStore(entry: PaymentMethodCatalogEntry, binding: StoreBinding | null): MethodStatus {
  if (entry.availability === 'unavailable') return 'unavailable'
  const wanted = binding?.enabledMethodIds.includes(entry.id) ?? false
  if (entry.availability === 'pending_approval') return wanted ? 'pending_approval' : 'setup_required'
  if (entry.availability === 'setup_required') return 'setup_required'
  return wanted ? 'enabled' : 'available'
}

/** Methods shoppers actually see: wanted on the store and approved on the account. */
export function checkoutMethods(state: MaropayAccountState, binding: StoreBinding): PaymentMethodCatalogEntry[] {
  return state.methods.filter((m) => m.availability === 'available' && binding.enabledMethodIds.includes(m.id))
}

function captureIncompatibleMethods(methods: PaymentMethodCatalogEntry[], captureMode: CaptureMode): PaymentMethodCatalogEntry[] {
  return captureMode === 'manual' ? methods.filter((m) => !m.supportsManualCapture) : []
}

// ── Store activation checklist (plan §3D) ─────────────────────────────────

export type ActivationCheckKey =
  | 'payment_capability' | 'payout_ready' | 'account_tasks' | 'methods_ready'
  | 'store_prerequisites' | 'checkout_validated' | 'impact_reviewed'

export interface ActivationCheckItem {
  key: ActivationCheckKey
  label: string
  ok: boolean
  /** `waiting` = on our payments partner; `todo` = on the merchant. */
  state: 'done' | 'waiting' | 'todo'
  detail: string
}

export interface ActivationChecklist {
  items: ActivationCheckItem[]
  ok: boolean
  blockedBy: ActivationCheckKey[]
}

/** What the checklist needs to know about the sales channel. */
export interface ChannelFacts {
  name: string
  type: 'web_store' | 'offline_store'
  provider: string
  status: string
}

function item(key: ActivationCheckKey, label: string, ok: boolean, detail: string, waiting = false): ActivationCheckItem {
  return { key, label, ok, state: ok ? 'done' : waiting ? 'waiting' : 'todo', detail }
}

/**
 * Why the sales channel itself can't take Maropay payments — null when it can.
 * `undefined` means the channel isn't known here (pure callers without channel
 * facts), which is treated as no problem; `null` means it no longer exists.
 */
export function channelProblem(channel: ChannelFacts | null | undefined): string | null {
  if (channel === undefined) return null
  if (!channel) return 'This sales channel no longer exists.'
  if (channel.type !== 'web_store') return 'Maropay online payments apply to web stores.'
  if (channel.provider !== 'maropost_store_builder') return `${channel.name} checks out on another platform, so Maropay can’t take its payments.`
  if (channel.status === 'draft') return `${channel.name} is still a draft. Finish the store before switching payments on.`
  return null
}

/** The channel problem, or a configuration the store can't go live with (capture mode, saved cards). */
export function storePrerequisiteProblem(state: MaropayAccountState, binding: StoreBinding, channel: ChannelFacts | null | undefined): string | null {
  const incompatible = captureIncompatibleMethods(checkoutMethods(state, binding), binding.captureMode)
  const credentials = binding.previousProvider?.savedCredentials
  return channelProblem(channel)
    ?? (incompatible.length
      ? `Manual capture isn’t supported by ${incompatible.map((m) => m.label).join(', ')}. Switch to automatic capture or turn those methods off.`
      : credentials?.blocking
        ? `${credentials.count} saved cards back recurring charges with ${PROVIDER_LABELS[binding.previousProvider!.provider]}. They need a supported migration before you switch.`
        : null)
}

export function activationChecklist(
  state: MaropayAccountState,
  binding: StoreBinding,
  channel: ChannelFacts | null | undefined,
  now: number,
): ActivationChecklist {
  const account = state.account
  const caps = deriveCapabilities(state, now)
  // Under review is our payments partner's move; action required is the merchant's.
  const underReview = account?.verification === 'under_review'
  const needsInformation = account?.verification === 'action_required'
  const blockingTasks = openTasks(state).filter((t) => t.blocking)
  const ready = checkoutMethods(state, binding)
  const pending = state.methods.filter((m) => m.availability === 'pending_approval' && binding.enabledMethodIds.includes(m.id))
  const storeProblem = storePrerequisiteProblem(state, binding, channel)

  const items: ActivationCheckItem[] = [
    item('payment_capability', 'Payments are enabled on your account', caps.payments === 'enabled',
      caps.payments === 'enabled' ? 'Your account can take payments.'
        : underReview ? 'Waiting on verification by our payments partner.'
          : needsInformation ? 'Our payments partner needs more information before payments turn on.'
            : caps.payments === 'restricted' ? 'Payments are restricted until you provide the requested information.'
              : 'Finish Maropay setup to enable payments.', underReview),
    item('payout_ready', 'Payouts and bank account are ready', caps.payouts === 'ready',
      account?.verification !== 'verified' ? 'Payouts turn on once your business is verified.'
        : !account.payoutDestination ? 'Add a payout bank account.'
          : caps.payouts === 'ready' ? `Payouts go to ${account.payoutDestination.bankName} •••• ${account.payoutDestination.last4}.`
            : 'Payouts need attention — see your Maropay tasks.', underReview),
    item('account_tasks', 'Required account tasks are resolved', blockingTasks.length === 0,
      blockingTasks.length === 0 ? 'Nothing outstanding.' : `${blockingTasks.length} open ${blockingTasks.length === 1 ? 'task' : 'tasks'}: ${blockingTasks.map((t) => t.title).join('; ')}`,
      blockingTasks.every((t) => t.status === 'waiting_review') && blockingTasks.length > 0),
    item('methods_ready', 'At least one payment method is ready', ready.length > 0,
      ready.length
        ? `${ready.map((m) => m.label).join(', ')} ${ready.length === 1 ? 'is' : 'are'} ready.${pending.length ? ` ${pending.map((m) => m.label).join(', ')} will turn on when approved.` : ''}`
        : pending.length ? `${pending.map((m) => m.label).join(', ')} ${pending.length === 1 ? 'is' : 'are'} awaiting approval. Turn on another method to go live now.` : 'Turn on at least one payment method.',
      !ready.length && pending.length > 0),
    item('store_prerequisites', 'Store is ready for payments', storeProblem === null,
      storeProblem ?? `${channel?.name ?? 'The store'} is ready. Capture: ${binding.captureMode === 'automatic' ? 'automatic' : 'manual'}.`),
    item('checkout_validated', 'Test checkout has passed', binding.checkoutValidation.status === 'passed',
      binding.checkoutValidation.status === 'passed' ? 'A test payment completed end to end.'
        : binding.checkoutValidation.status === 'failed' ? binding.checkoutValidation.failureReason ?? 'The last test checkout failed.'
          : 'Run a test checkout with the methods you’ve chosen.'),
    item('impact_reviewed', 'Owner has reviewed what changes', binding.impactReviewedAt !== null,
      binding.impactReviewedAt ? 'Activation impact reviewed.' : 'Review which methods, fees and provider settings change.'),
  ]
  const blockedBy = items.filter((i) => !i.ok).map((i) => i.key)
  return { items, ok: blockedBy.length === 0, blockedBy }
}

// ── Payments ──────────────────────────────────────────────────────────────

function capturedTotal(p: Payment): Money {
  return sum(p.captures.map((c) => c.amount), p.amount.currency)
}

function committedRefunds(p: Payment): Money {
  return sum(p.refunds.filter((r) => r.status !== 'failed').map((r) => r.amount), p.amount.currency)
}

/** Captured minus refunds that succeeded or are still pending. Zero unless the payment is settled and undisputed. */
export function refundableRemaining(p: Payment): Money {
  if (p.status !== 'captured' && p.status !== 'partially_refunded') return zero(p.amount.currency)
  const remaining = subtract(capturedTotal(p), committedRefunds(p))
  return isPositive(remaining) ? remaining : zero(p.amount.currency)
}

/** Status a settled payment returns to once a dispute is won or a refund is reversed. */
export function settledStatus(p: Payment): PaymentStatus {
  const refunded = committedRefunds(p)
  if (!isPositive(refunded)) return 'captured'
  return compare(refunded, capturedTotal(p)) >= 0 ? 'refunded' : 'partially_refunded'
}

export function canCapture(p: Payment, now: number): MaropayError | null {
  if (p.status !== 'authorised') return problem('stale_state', 'Only an authorised payment can be captured.')
  if (p.authorisationExpiresAt && Date.parse(p.authorisationExpiresAt) <= now) {
    return problem('deadline_passed', 'This authorisation has expired. Ask the shopper to pay again.')
  }
  return null
}

export function canVoid(p: Payment): MaropayError | null {
  return p.status === 'authorised' ? null : problem('stale_state', 'Only an authorised payment that hasn’t been captured can be cancelled.')
}

export function canRefund(p: Payment, amount: Money): MaropayError | null {
  if (p.status === 'disputed') return problem('stale_state', 'This payment is disputed. Respond to the dispute instead of refunding.')
  const remaining = refundableRemaining(p)
  if (!isPositive(remaining)) return problem('stale_state', 'Nothing is left to refund on this payment.')
  if (amount.currency !== p.amount.currency) return problem('invalid_amount', `Refunds are made in ${p.amount.currency}.`)
  if (!isPositive(amount)) return problem('invalid_amount', 'Enter an amount greater than zero.')
  if (compare(amount, remaining) > 0) return problem('refund_exceeds_remaining', 'That’s more than is left to refund on this payment.')
  return null
}

export interface PaymentBreakdown {
  gross: Money
  fee: Money
  refunded: Money
  disputed: Money
  disputeFee: Money
  net: Money
  remainingRefundable: Money
}

/** Gross → fees → refunds → disputes → net, for payment detail and the refund drawer. */
export function paymentBreakdown(p: Payment, dispute: Dispute | null): PaymentBreakdown {
  const currency = p.amount.currency
  const gross = capturedTotal(p)
  const refunded = committedRefunds(p)
  const lostDispute = dispute && dispute.status !== 'won'
  const disputed = lostDispute ? dispute.amount : zero(currency)
  const disputeFee = dispute ? dispute.fee : zero(currency)
  const net = subtract(subtract(subtract(subtract(gross, p.fee), refunded), disputed), disputeFee)
  return { gross, fee: p.fee, refunded, disputed, disputeFee, net, remainingRefundable: refundableRemaining(p) }
}

export interface PaymentFilter {
  channelId?: string
  provider?: MaropayProvider
  status?: PaymentStatus[]
  query?: string
  /** Store-operations scope; null = all stores. */
  assignedChannelIds?: string[] | null
}

export function paymentsFor(state: MaropayAccountState, filter: PaymentFilter = {}): Payment[] {
  const query = filter.query?.trim().toLowerCase() ?? ''
  return state.payments.filter((p) => {
    if (p.accountId !== state.accountId) return false
    if (filter.channelId && p.channelId !== filter.channelId) return false
    if (filter.assignedChannelIds && !filter.assignedChannelIds.includes(p.channelId)) return false
    if (filter.provider && p.provider !== filter.provider) return false
    if (filter.status?.length && !filter.status.includes(p.status)) return false
    if (!query) return true
    return [p.id, p.orderNumber ?? '', p.customer.name, p.customer.email, p.methodLabel].some((v) => v.toLowerCase().includes(query))
  })
}

// ── Disputes ──────────────────────────────────────────────────────────────

export function canSubmitEvidence(d: Dispute, now: number): MaropayError | null {
  if (d.status !== 'needs_response') return problem('stale_state', 'This dispute isn’t waiting for a response.')
  if (Date.parse(d.respondBy) <= now) return problem('deadline_passed', 'The response deadline has passed.')
  const missing = d.evidence.filter((e) => e.required && !e.document)
  if (missing.length) return problem('requirement_pending', `Add the required evidence: ${missing.map((e) => e.label).join(', ')}.`)
  return null
}

export function canAcceptDispute(d: Dispute, now: number): MaropayError | null {
  if (d.status !== 'needs_response') return problem('stale_state', 'This dispute isn’t waiting for a response.')
  if (Date.parse(d.respondBy) <= now) return problem('deadline_passed', 'The response deadline has passed.')
  return null
}

// ── Balances and payouts ──────────────────────────────────────────────────

export interface BalanceSummary {
  currency: string
  available: Money
  pending: Money
  inTransit: Money
}

/** Per-currency balances. Currencies are never mixed; legacy-provider money never enters Maropay balances. */
export function deriveBalances(state: MaropayAccountState, now: number): BalanceSummary[] {
  const currencies = new Set<string>(state.movements.map((m) => m.net.currency))
  state.payouts.forEach((p) => currencies.add(p.amount.currency))
  if (state.account) currencies.add(state.account.currency)
  return [...currencies].map((currency) => {
    const unpaid = state.movements.filter((m) => m.net.currency === currency && m.payoutId === null)
    return {
      currency,
      available: sum(unpaid.filter((m) => Date.parse(m.availableAt) <= now).map((m) => m.net), currency),
      pending: sum(unpaid.filter((m) => Date.parse(m.availableAt) > now).map((m) => m.net), currency),
      inTransit: sum(state.payouts.filter((p) => p.amount.currency === currency && p.status === 'in_transit').map((p) => p.amount), currency),
    }
  })
}

export interface UpcomingPayout {
  amount: Money
  estimatedAt: string
  movementIds: string[]
  /** Payouts are paused or need action, so this will wait. */
  blocked: boolean
}

/** The next payout, estimated from what's still in the balance. Estimates only — never a promise. */
export function nextPayout(state: MaropayAccountState, now: number): UpcomingPayout | null {
  const account = state.account
  if (!account) return null
  const unpaid = state.movements.filter((m) => m.payoutId === null && m.net.currency === account.currency)
  const amount = sum(unpaid.map((m) => m.net), account.currency)
  if (!isPositive(amount)) return null
  const latest = Math.max(now + 86_400_000, ...unpaid.map((m) => Date.parse(m.availableAt)))
  return {
    amount,
    estimatedAt: new Date(latest).toISOString(),
    movementIds: unpaid.map((m) => m.id),
    blocked: deriveCapabilities(state, now).payouts !== 'ready',
  }
}

// ── Migration from a previous provider (plan §3E) ─────────────────────────

export interface MigrationRow {
  label: string
  /** The Maropay catalogue method it maps to, when there is one — for its mark. */
  methodId: string | null
  currentRate: string
  maropayLabel: string | null
  maropayRate: string | null
  change: 'lower' | 'higher' | 'same' | 'stays'
}

export interface MigrationImpact {
  rows: MigrationRow[]
  transfers: string[]
  needsSetup: string[]
  staysWithPrevious: string[]
  blocking: string[]
}

/** Reference order used to compare rates on like terms. */
const REFERENCE_ORDER: Money = { amount: 10_000, currency: 'USD' }

export function migrationImpact(state: MaropayAccountState, binding: StoreBinding, storeName: string): MigrationImpact | null {
  const previous = binding.previousProvider
  if (!previous) return null
  const provider = PROVIDER_LABELS[previous.provider]
  const byId = new Map(state.methods.map((m) => [m.id, m]))
  const rows: MigrationRow[] = previous.methods.map((method) => {
    const target = method.maropayMethodId ? byId.get(method.maropayMethodId) ?? null : null
    if (!target || method.keepSeparately) {
      return { label: method.label, methodId: method.maropayMethodId, currentRate: method.rate.label, maropayLabel: null, maropayRate: null, change: 'stays' }
    }
    const diff = compare(applyRate(REFERENCE_ORDER, target.rate), applyRate(REFERENCE_ORDER, method.rate))
    return {
      label: method.label,
      methodId: method.maropayMethodId,
      currentRate: method.rate.label,
      maropayLabel: target.label,
      maropayRate: target.rate.label,
      change: diff === 0 ? 'same' : diff < 0 ? 'lower' : 'higher',
    }
  })
  const moving = rows.filter((r) => r.change !== 'stays')
  const staying = previous.methods.filter((m) => m.keepSeparately || !m.maropayMethodId)
  const needsSetup = state.methods
    .filter((m) => binding.enabledMethodIds.includes(m.id) && m.availability !== 'available')
    .map((m) => `${m.label} needs approval before shoppers see it`)
  if (!state.account?.payoutDestination) needsSetup.push('A payout bank account')
  if (previous.captureMode === 'manual') {
    needsSetup.push(binding.captureMode === 'manual'
      ? 'Manual capture is kept — capture each authorised payment from the order'
      : 'Capture changes from manual to automatic')
  }
  const credentials = previous.savedCredentials
  return {
    rows,
    transfers: [`New checkout sessions on ${storeName}`, ...moving.map((r) => `${r.label} → ${r.maropayLabel} on Maropay`)],
    needsSetup,
    staysWithPrevious: [
      `Payments taken before the switch, with their refunds and disputes, stay with ${provider}`,
      `Any unsettled ${provider} balance and its payouts`,
      ...staying.map((m) => `${m.label} stays connected through ${provider}`),
      ...(credentials && !credentials.blocking ? [`${credentials.count} saved cards stay with ${provider} — shoppers re-enter card details on their next checkout`] : []),
    ],
    blocking: credentials?.blocking
      ? [`${credentials.count} saved cards back recurring charges. They need a supported migration before you switch.`]
      : [],
  }
}
