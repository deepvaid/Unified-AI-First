/**
 * Maropay — per-account payments state for the prototype.
 *
 * One source of truth: Maropay owns payments, refunds, disputes, payouts and
 * balance movements; Commerce orders only carry a summary that this store
 * writes back (useCommerce.applyPaymentSummary) after every change. Commerce
 * re-seeds on each load while this state persists, so the summary is
 * re-projected whenever an account activates.
 *
 * Persisted per account under `mp.maropay.v1:<accountId>`. Never persisted:
 * step-up tokens, full bank numbers (only last four digits reach state),
 * document contents, and the reviewer's failure switches.
 */
import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCommerceStore } from '@/stores/useCommerce'
import type { OrderPaymentSummary } from '@/stores/useCommerce'
import { useNotifications } from '@/stores/useNotifications'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { formatMoney, parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import {
  BUSINESS_CHANGE_LABELS,
  PROVIDER_LABELS,
  canForStore,
  emptyState,
  fail,
  localDateKey,
  nextId,
  ok,
  orderPaymentStatusLabel,
  parseState,
  storageKey,
} from '@/maropay/model'
import type {
  ActionTask,
  BusinessChangeField,
  CaptureMode,
  CheckoutSession,
  RequirementKey,
  DisputeReason,
  EvidenceItem,
  LegalBusiness,
  MaropayAccountState,
  MaropayAction,
  MaropayActingRole,
  MaropayError,
  MaropayScenarioKey,
  MethodDeclineReason,
  MethodStatus,
  MockDocument,
  OnboardingDraft,
  OnboardingStepKey,
  Payment,
  PaymentMethodCatalogEntry,
  Result,
} from '@/maropay/model'
import {
  activationChecklist,
  activationTarget as deriveActivationTarget,
  availablePartnerDecisions,
  awaitingDecision,
  checkoutMethods,
  closureChecks as deriveClosureChecks,
  deriveBalances,
  deriveCapabilities,
  deriveOverviewInstruction,
  formatDay,
  maropayOfferedMethods,
  methodStatusForStore,
  migrationImpact,
  nextPayout,
  paymentBreakdown,
  paymentsFor,
  readinessDimensions,
  refundableRemaining,
  storeActivationState,
  taskTarget,
  storePaymentsTarget,
} from '@/maropay/readiness'
import type { ChannelFacts, MaropayTarget, PaymentFilter } from '@/maropay/readiness'
import { isManualKind, storeProvidersFor as providersOf } from '@/maropay/providers'
import type { ManualMethodSettings, OwnProviderKind } from '@/maropay/providers'
import { storefrontOffer } from '@/maropay/storefront'
import type { StorefrontOfferOptions } from '@/maropay/storefront'
import type { BankAccountInput, OnboardingPatch } from '@/maropay/onboarding'
import { deriveRequirements, rulesForState } from '@/maropay/requirements'
import { MAROPAY_SCENARIOS, buildScenario, eligibleStores, isMaropayScenarioKey, prefillFor } from '@/maropay/scenarios'
import type { ScenarioChannel, ScenarioContext } from '@/maropay/scenarios'
import * as adapter from '@/services/maropay/mockAdapter'
import type { ActivateStoreOptions, AdapterEnv, CheckoutInput, CheckoutOptionsPatch, CheckoutStep, FailurePlan, ReviewOptions, StepUpChallenge, StepUpToken, TaskAnswer } from '@/services/maropay/mockAdapter'

export { MAROPAY_SCENARIOS, isMaropayScenarioKey }
export type { MaropayActingRole, MaropayScenarioKey }

export const useMaropayStore = defineStore('maropay', () => {
  const accounts = useAccountsStore()
  const commerce = useCommerceStore()
  const salesChannels = useSalesChannelsStore()

  /** Clock for derived state; refreshed on every action and once a minute. */
  const now = ref(Date.now())
  const state = ref<MaropayAccountState>(emptyState(accounts.activeId, now.value))
  const activeAccountId = ref<string | null>(null)
  /** A saved Maropay record exists for this account (drives the reviewer Reset button). */
  const hasExplicitState = ref(false)
  const failures = reactive<FailurePlan>(adapter.defaultFailures())
  const lastError = ref<MaropayError | null>(null)
  const stepUp = ref<{ challenge: StepUpChallenge | null; token: StepUpToken | null }>({ challenge: null, token: null })

  if (typeof window !== 'undefined') window.setInterval(() => { now.value = Date.now() }, 60_000)

  // ── Persistence ─────────────────────────────────────────────────────

  function readStored(accountId: string): MaropayAccountState | null {
    if (typeof window === 'undefined') return null
    try {
      return parseState(window.localStorage.getItem(storageKey(accountId)), accountId, Date.now())
    } catch {
      return null
    }
  }

  function persist(): void {
    state.value.updatedAt = new Date(now.value).toISOString()
    hasExplicitState.value = true
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey(state.value.accountId), JSON.stringify(state.value))
    } catch {
      /* private mode or quota — the session keeps working in memory */
    }
  }

  // ── Channels ────────────────────────────────────────────────────────

  const channels = computed(() => salesChannels.channelsForAccount(state.value.accountId))

  function scenarioChannels(): ScenarioChannel[] {
    return channels.value.map((c) => ({ id: c.id, name: c.name, type: c.type, provider: c.provider, status: c.status, domain: c.webStore?.domain ?? null }))
  }

  /** Web stores Maropay can take payments for (Maropost storefronts, not Shopify). */
  const eligibleChannels = computed(() => eligibleStores(scenarioChannels()))

  function channelFacts(channelId: string): ChannelFacts | null {
    const c = channels.value.find((ch) => ch.id === channelId)
    return c ? { name: c.name, type: c.type, provider: c.provider, status: c.status } : null
  }

  function channelName(channelId: string): string {
    return channels.value.find((c) => c.id === channelId)?.name ?? 'this store'
  }

  // ── Projection onto Commerce orders ─────────────────────────────────

  function orderSummary(p: Payment, timelineText?: string): OrderPaymentSummary {
    return {
      provider: p.provider,
      paymentId: p.id,
      paymentStatus: orderPaymentStatusLabel(p.status),
      paymentMethod: p.methodLabel,
      paymentCapturedAt: p.capturedAt ? localDateKey(Date.parse(p.capturedAt)) : null,
      ...(timelineText ? { timelineText } : {}),
    }
  }

  function paymentLine(p: Payment): string {
    const amount = formatMoney(p.amount)
    const via = p.provider === 'maropay' ? 'via Maropay' : `through ${PROVIDER_LABELS[p.provider]}`
    switch (p.status) {
      case 'processing': return isManualKind(p.provider)
        ? `Order placed — awaiting ${p.methodLabel}`
        : `Payment of ${amount} processing ${via} (${p.methodLabel}) — confirmation can take a few days`
      case 'authorised': return `Payment of ${amount} authorised ${via} (${p.methodLabel}) — capture within 7 days`
      case 'failed': return `Payment of ${amount} failed — ${p.failure?.message ?? 'the payment did not complete'}`
      case 'voided': return `Payment authorisation cancelled ${via}`
      default: return `Payment of ${amount} captured ${via} (${p.methodLabel})`
    }
  }

  function ensureCheckoutOrder(session: CheckoutSession, payment: Payment): void {
    if (!session.order) return
    commerce.createCheckoutOrder({
      ...session.order,
      channelId: session.channelId,
      currency: payment.amount.currency,
      payment: orderSummary(payment),
      timeline: [
        { text: `Order placed via ${channelName(session.channelId)} checkout`, date: session.order.date },
        { text: paymentLine(payment), date: session.order.date },
      ],
    })
  }

  function syncOrder(p: Payment, timelineText?: string): void {
    if (p.orderId !== null) commerce.applyPaymentSummary(p.orderId, orderSummary(p, timelineText))
  }

  function project(): void {
    for (const session of state.value.sessions) {
      const payment = session.paymentId ? paymentById(session.paymentId) : undefined
      if (payment) ensureCheckoutOrder(session, payment)
    }
    for (const p of state.value.payments) syncOrder(p)
  }

  function unproject(): void {
    for (const p of state.value.payments) if (p.orderId !== null) commerce.clearPaymentSummary(p.orderId)
  }

  // ── Account activation ──────────────────────────────────────────────

  function activateAccount(accountId: string): void {
    if (!accountId || activeAccountId.value === accountId) return
    if (activeAccountId.value) unproject()
    activeAccountId.value = accountId
    stepUp.value = { challenge: null, token: null }
    lastError.value = null
    now.value = Date.now()
    const stored = readStored(accountId)
    hasExplicitState.value = stored !== null
    state.value = stored ?? emptyState(accountId, now.value)
    // Saves verified before approval raised activation tasks get them once, silently (the op is idempotent).
    if (stored && adapter.ensureActivationTasks(state.value, env()).length) persist()
    project()
  }

  watch(() => accounts.activeId, (id) => activateAccount(id), { immediate: true, flush: 'sync' })

  // ── Running adapter operations ──────────────────────────────────────

  function env(): AdapterEnv {
    now.value = Date.now()
    return {
      now: now.value,
      actor: { role: state.value.actingRole, assignedChannelIds: state.value.assignedChannelIds },
      failures,
      channelName,
      channelFacts,
    }
  }

  /** Runs an operation; on success applies side effects and saves, on failure keeps the error for the UI. */
  function run<T>(op: (e: AdapterEnv) => Result<T>, after?: (value: T) => void): Result<T> {
    const result = op(env())
    if (result.ok) {
      lastError.value = null
      after?.(result.value)
      persist()
    } else {
      lastError.value = result.error
    }
    return result
  }

  /** A list's simulated fetch: fails once when the reviewer armed a timeout. Reads never save. */
  function loadRecords(): MaropayError | null {
    const result = adapter.readRecords(env())
    return result.ok ? null : result.error
  }

  function routeFor(target: MaropayTarget): RouteLocationRaw {
    return { name: target.name, params: { accountId: state.value.accountId, ...(target.params ?? {}) }, query: target.query ?? {} }
  }

  function notify(id: string, title: string, target?: MaropayTarget): void {
    useNotifications().push({ id: `mp-${state.value.accountId}-${id}`, title, ...(target ? { to: routeFor(target) } : {}) })
  }

  function notifyTask(task: ActionTask): void {
    notify(task.id, `Maropay: ${task.title}`, taskTarget(task))
  }

  function notifyNewTasks(before: Set<string>, include: (task: ActionTask) => boolean = () => true): void {
    for (const task of state.value.tasks) if (!before.has(task.id) && task.status !== 'resolved' && include(task)) notifyTask(task)
  }

  function taskIds(): Set<string> {
    return new Set(state.value.tasks.map((t) => t.id))
  }

  // ── Derived state ───────────────────────────────────────────────────

  const account = computed(() => state.value.account)
  const business = computed(() => state.value.business)
  const terms = computed(() => state.value.terms)
  const onboarding = computed(() => state.value.onboarding)
  const bindings = computed(() => state.value.bindings)
  const methods = computed(() => state.value.methods)
  const payouts = computed(() => state.value.payouts)
  const disputes = computed(() => state.value.disputes)
  const tasks = computed(() => state.value.tasks)
  const openTasks = computed(() => state.value.tasks.filter((t) => t.status !== 'resolved'))
  const history = computed(() => state.value.history)
  const milestones = computed(() => state.value.milestones)
  const actingRole = computed(() => state.value.actingRole)
  const assignedChannelIds = computed(() => state.value.assignedChannelIds)
  const scenarioKey = computed(() => state.value.scenarioKey)
  const discoveryDismissedAt = computed(() => state.value.discoveryDismissedAt)

  const capabilities = computed(() => deriveCapabilities(state.value, now.value))
  const dimensions = computed(() => readinessDimensions(state.value, now.value))
  const overview = computed(() => deriveOverviewInstruction(state.value, now.value, channelFacts))
  /** The partner-shaped view: currently due, due later, past due, errors and the deadline. */
  const requirements = computed(() => deriveRequirements(state.value, now.value))
  /** What our payments partner asks of this country and business type. */
  const rules = computed(() => rulesForState(state.value))
  const partnerDecisions = computed(() => availablePartnerDecisions(state.value))
  /** The store to activate next, with its checklist — null when nothing is linked. */
  const activationTarget = computed(() => deriveActivationTarget(state.value, now.value, channelFacts))
  const balances = computed(() => deriveBalances(state.value, now.value))
  const upcomingPayout = computed(() => nextPayout(state.value, now.value))
  const closureChecks = computed(() => deriveClosureChecks(state.value, now.value))

  /** Payments the acting role may see (store operations: their stores only). */
  const payments = computed(() => paymentsFor(state.value, {
    assignedChannelIds: state.value.actingRole === 'store_ops' ? state.value.assignedChannelIds : null,
  }))

  function can(action: MaropayAction, channelId: string | null = null): boolean {
    return canForStore(state.value.actingRole, action, channelId, state.value.assignedChannelIds)
  }

  function filterPayments(filter: PaymentFilter): Payment[] {
    return paymentsFor(state.value, {
      ...filter,
      assignedChannelIds: state.value.actingRole === 'store_ops' ? state.value.assignedChannelIds : null,
    })
  }

  function bindingFor(channelId: string) {
    return state.value.bindings.find((b) => b.channelId === channelId) ?? null
  }

  function checklistFor(channelId: string) {
    const binding = bindingFor(channelId)
    return binding ? activationChecklist(state.value, binding, channelFacts(channelId), now.value) : null
  }

  function storeStateFor(channelId: string) {
    const binding = bindingFor(channelId)
    const checklist = checklistFor(channelId)
    return binding && checklist ? storeActivationState(binding, capabilities.value, checklist) : null
  }

  function methodsForStore(channelId: string): Array<PaymentMethodCatalogEntry & { status: MethodStatus }> {
    const binding = bindingFor(channelId)
    return state.value.methods.map((m) => ({ ...m, status: methodStatusForStore(m, binding) }))
  }

  function checkoutMethodsFor(channelId: string): PaymentMethodCatalogEntry[] {
    const binding = bindingFor(channelId)
    return binding ? checkoutMethods(state.value, binding) : []
  }

  function migrationImpactFor(channelId: string, cardsVia: 'maropay' | 'existing' = 'maropay') {
    const binding = bindingFor(channelId)
    return binding ? migrationImpact(state.value, binding, channelName(channelId), cardsVia) : null
  }

  /** The store's own providers and card processor — the default when nothing was ever saved. */
  function storeProvidersFor(channelId: string) {
    return providersOf(state.value, channelId)
  }

  /** What Maropay itself would put in front of shoppers on this store, for either answer to the Activate dialog. */
  function maropayOfferedFor(channelId: string, cardsVia: 'maropay' | 'existing' = 'maropay'): PaymentMethodCatalogEntry[] {
    const binding = bindingFor(channelId)
    return binding ? maropayOfferedMethods(state.value, binding, providersOf(state.value, channelId), cardsVia) : []
  }

  /** What the store's shoppers see of its payments (every provider at once). */
  function storefrontOfferFor(channelId: string, amount: Money, options: StorefrontOfferOptions = {}) {
    return storefrontOffer(state.value, channelId, amount, options)
  }

  function paymentById(id: string): Payment | undefined {
    return state.value.payments.find((p) => p.id === id)
  }

  function paymentForOrder(orderId: number): Payment | undefined {
    return state.value.payments.find((p) => p.orderId === orderId)
  }

  function breakdownFor(paymentId: string) {
    const payment = paymentById(paymentId)
    if (!payment) return null
    const dispute = payment.disputeId ? state.value.disputes.find((d) => d.id === payment.disputeId) ?? null : null
    return paymentBreakdown(payment, dispute)
  }

  function refundableForOrder(orderId: number): Money | null {
    const payment = paymentForOrder(orderId)
    return payment ? refundableRemaining(payment) : null
  }

  function payoutById(id: string) {
    return state.value.payouts.find((p) => p.id === id)
  }

  function movementsForPayout(payoutId: string) {
    const payout = payoutById(payoutId)
    return payout ? state.value.movements.filter((m) => payout.movementIds.includes(m.id)) : []
  }

  function disputeById(id: string) {
    return state.value.disputes.find((d) => d.id === id)
  }

  function taskById(id: string) {
    return state.value.tasks.find((t) => t.id === id)
  }

  // ── Onboarding (Maropost owns the journey) ──────────────────────────

  function scenarioContext(): ScenarioContext {
    const accountId = state.value.accountId
    return {
      accountId,
      accountName: accounts.accounts.find((a) => a.id === accountId)?.name ?? accountId,
      now: Date.now(),
      channels: scenarioChannels(),
      orders: commerce.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        channelId: o.channelId,
        total: o.total,
        currency: o.currency,
        date: o.date,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        paymentReference: o.paymentReference,
        customer: { name: o.customer.name, email: o.customer.email },
      })),
    }
  }

  function startSetup(choice: 'new' | 'existing' = 'new'): Result<unknown> {
    return run((e) => adapter.startOnboarding(state.value, {
      businessChoice: choice,
      reuseVerifiedDetails: choice === 'existing',
      prefill: prefillFor(scenarioContext()),
    }, e))
  }

  /** Saves the wizard's answers. `complete` marks the step done; `next` is where setup resumes. */
  function saveStep(step: OnboardingStepKey, patch: OnboardingPatch, options: { complete?: boolean; next?: OnboardingStepKey } = {}): Result<OnboardingDraft> {
    return run((e) => adapter.saveOnboardingStep(state.value, step, patch, options, e))
  }

  /** Records the owner's acceptance on Continue, with the date, mock IP and browser our payments partner requires. */
  function acceptTerms(): Result<null> {
    const userAgent = typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent
    return run((e) => adapter.acceptTerms(state.value, { userAgent }, e))
  }

  /** Stores the payout account for setup. The full number is checked once; only its last four digits and the routing number are kept. */
  function savePayoutDetails(input: BankAccountInput): Result<null> {
    return run((e) => adapter.savePayoutDraft(state.value, input, e))
  }

  function requestOwnerReview(): Result<ActionTask> {
    if (state.value.actingRole === 'owner') return fail('invalid_input', 'You’re the owner — submit setup yourself.')
    const at = new Date().toISOString()
    const task: ActionTask = {
      id: nextId(state.value, 'task'),
      kind: 'owner_review',
      title: 'Review and submit Maropay setup',
      description: 'A teammate prepared Maropay setup and asked the business owner to accept the terms and submit it.',
      affects: [],
      dueAt: null,
      blocking: false,
      role: 'owner',
      status: 'open',
      step: 'terms',
      disputeId: null,
      payoutId: null,
      methodId: null,
      channelId: null,
      createdAt: at,
      resolvedAt: null,
    }
    state.value.tasks.push(task)
    state.value.onboarding.ownerReviewRequestedAt = at
    persist()
    notifyTask(task)
    return ok(task)
  }

  function submitSetup() {
    return run((e) => adapter.submitOnboarding(state.value, e), () => {
      notify(`submitted-${state.value.account?.submittedAt ?? now.value}`, 'Maropay: your details were sent for review', { name: 'MaropaySetup' })
    })
  }

  function resolveTask(taskId: string, payload: TaskAnswer) {
    return run((e) => adapter.resolveTask(state.value, taskId, payload, e), (task) => {
      if (task.kind === 'verification') notify(`sent-${task.id}-${now.value}`, `Maropay: sent for review — ${task.title}`, { name: 'MaropayOverview' })
    })
  }

  /** Approval prompts; it never activates. The notification points at the store to activate, not the overview. */
  function notifyVerified(): void {
    const target = activationTarget.value
    const id = `verified-${state.value.account?.verifiedAt ?? now.value}`
    if (target) {
      const name = channelName(target.binding.channelId)
      notify(id, `Maropay: your business is verified — activate it on ${name}`, storePaymentsTarget(target.binding.channelId))
    } else {
      notify(id, 'Maropay: your business is verified — link a store to activate it', { name: 'MaropaySettings', query: { tab: 'stores' } })
    }
  }

  function simulateReviewOutcome(decision: 'verified' | 'rejected' | 'more_info', options: ReviewOptions = {}) {
    const before = taskIds()
    const firstApproval = decision === 'verified' && state.value.account?.verification !== 'verified'
    const accepting = decision === 'verified' && !firstApproval && state.value.tasks.some(awaitingDecision)
    return run((e) => adapter.simulateReviewOutcome(state.value, decision, e, options), () => {
      if (firstApproval) {
        // One notification for approval: it names the store to activate, so the activation tasks aren't announced twice.
        notifyNewTasks(before, (task) => task.kind !== 'activate_store')
        notifyVerified()
      } else {
        notifyNewTasks(before)
      }
      if (accepting) notify(`accepted-${now.value}`, 'Maropay: our payments partner accepted your information', { name: 'MaropayOverview' })
      if (decision === 'rejected') notify(`declined-${state.value.account?.declinedAt ?? now.value}`, 'Maropay: our payments partner couldn’t approve your business', { name: 'MaropayOverview' })
    })
  }

  /** Reviewer control: a later-dated requirement comes due (the partner's payout threshold was reached). */
  function raiseThresholdRequirement(key: RequirementKey) {
    const before = taskIds()
    return run((e) => adapter.raiseThresholdRequirement(state.value, key, e), () => notifyNewTasks(before))
  }

  // ── Stores and methods ──────────────────────────────────────────────

  function linkStore(channelId: string) {
    return run((e) => adapter.linkStore(state.value, channelId, e))
  }

  function setMethodEnabled(channelId: string, methodId: string, enabled: boolean) {
    return run((e) => adapter.setMethodEnabled(state.value, channelId, methodId, enabled, e))
  }

  function simulateMethodApproval(methodId: string, approved: boolean, reason: MethodDeclineReason = 'other') {
    return run((e) => adapter.simulateMethodApproval(state.value, methodId, approved, e, reason))
  }

  function setCaptureMode(channelId: string, mode: CaptureMode) {
    return run((e) => adapter.setCaptureMode(state.value, channelId, mode, e))
  }

  function updateCheckoutOptions(channelId: string, patch: CheckoutOptionsPatch) {
    return run((e) => adapter.updateCheckoutOptions(state.value, channelId, patch, e))
  }

  function validateCheckout(channelId: string) {
    return run((e) => adapter.validateCheckout(state.value, channelId, e))
  }

  function markImpactReviewed(channelId: string) {
    return run((e) => adapter.markImpactReviewed(state.value, channelId, e))
  }

  function activateStore(channelId: string, options: ActivateStoreOptions = {}) {
    return run((e) => adapter.activateStore(state.value, channelId, channelFacts(channelId), e, options), () => {
      useOnboardingStore().complete('payments')
      notify(`live-${channelId}-${now.value}`, `Maropay is live on ${channelName(channelId)}`, storePaymentsTarget(channelId))
    })
  }

  // ── The store's own providers ───────────────────────────────────────

  function connectProvider(channelId: string, kind: OwnProviderKind) {
    return run((e) => adapter.connectProvider(state.value, channelId, kind, e))
  }

  function setProviderStatus(channelId: string, kind: OwnProviderKind, status: 'active' | 'inactive') {
    return run((e) => adapter.setProviderStatus(state.value, channelId, kind, status, e))
  }

  function removeProvider(channelId: string, kind: OwnProviderKind) {
    return run((e) => adapter.removeProvider(state.value, channelId, kind, e))
  }

  function updateManualMethod(channelId: string, kind: OwnProviderKind, fields: Partial<ManualMethodSettings>) {
    return run((e) => adapter.updateManualMethod(state.value, channelId, kind, fields, e))
  }

  /** The store page's "you're verified — finish the checklist" notice, dismissed per store and remembered. */
  function dismissActivationNotice(channelId: string): void {
    const binding = bindingFor(channelId)
    if (!binding) return
    binding.activationNoticeDismissedAt = new Date().toISOString()
    persist()
  }

  function deactivateStore(channelId: string) {
    return run((e) => adapter.deactivateStore(state.value, channelId, e))
  }

  function deactivateAllStores() {
    return run((e) => adapter.deactivateAllStores(state.value, e))
  }

  // ── Shopper checkout ────────────────────────────────────────────────

  function applyCheckoutStep(step: CheckoutStep, hadFirstPayment: boolean): void {
    if (step.createdOrder && step.payment) ensureCheckoutOrder(step.session, step.payment)
    const first = state.value.milestones.firstPaymentId
    if (!hadFirstPayment && first) {
      const payment = paymentById(first)
      notify('first-payment', `Your first Maropay payment came through${payment?.orderNumber ? ` — order ${payment.orderNumber}` : ''}`,
        { name: 'MaropayPaymentDetail', params: { paymentId: first } })
    }
  }

  function startCheckout(input: CheckoutInput) {
    return run((e) => adapter.createCheckoutSession(state.value, input, e))
  }

  function confirmCheckout(sessionId: string) {
    const hadFirst = state.value.milestones.firstPaymentId !== null
    return run((e) => adapter.confirmCheckoutSession(state.value, sessionId, e), (step) => applyCheckoutStep(step, hadFirst))
  }

  function completeCheckoutAction(sessionId: string, outcome: 'completed' | 'abandoned') {
    const hadFirst = state.value.milestones.firstPaymentId !== null
    return run((e) => adapter.completeCheckoutAction(state.value, sessionId, outcome, e), (step) => applyCheckoutStep(step, hadFirst))
  }

  // ── Payments ────────────────────────────────────────────────────────

  function capture(paymentId: string, key: string) {
    return run((e) => adapter.capturePayment(state.value, paymentId, key, e), (p) => syncOrder(p, paymentLine(p)))
  }

  /** A manual payment arrived (or never did) — the merchant records it from the order. */
  function markManualPayment(paymentId: string, outcome: 'received' | 'not_received', key: string) {
    return run((e) => adapter.markManualPayment(state.value, paymentId, outcome, key, e), (p) => syncOrder(p, paymentLine(p)))
  }

  function voidPayment(paymentId: string) {
    return run((e) => adapter.voidPayment(state.value, paymentId, e), (p) => syncOrder(p, paymentLine(p)))
  }

  function refundLine(p: Payment, amount: Money, status: 'pending' | 'succeeded' | 'failed', reason: string): string {
    const via = p.provider === 'maropay' ? 'via Maropay' : `through ${PROVIDER_LABELS[p.provider]} (original provider)`
    if (status === 'failed') return `Refund of ${formatMoney(amount)} failed — nothing was deducted`
    return `Refund of ${formatMoney(amount)} ${status === 'pending' ? 'started' : 'issued'} ${via}${reason ? ` — ${reason}` : ''}`
  }

  function refund(paymentId: string, amount: Money, reason: string, key: string) {
    return run((e) => adapter.refundPayment(state.value, paymentId, amount, reason, key, e),
      ({ payment, refund: r }) => syncOrder(payment, refundLine(payment, r.amount, r.status, reason)))
  }

  /** Refunds from the order page (useCommerce.refundOrder delegates here for tracked orders). */
  function refundLinkedOrder(orderId: number, amountText: string, reason: string) {
    const payment = paymentForOrder(orderId)
    if (!payment) return fail('not_found', 'This order has no tracked payment.')
    const amount = parseDecimal(amountText, payment.amount.currency)
    if (!amount) return fail('invalid_amount', 'Enter a valid amount.')
    return refund(payment.id, amount, reason, `order_${orderId}_${Date.now()}`)
  }

  function settleRefund(paymentId: string, refundId: string, outcome: 'succeeded' | 'failed') {
    return run((e) => adapter.settleRefund(state.value, paymentId, refundId, outcome, e),
      ({ payment, refund: r }) => syncOrder(payment, refundLine(payment, r.amount, r.status, '')))
  }

  /** Reviewer control: deliver a processor event. The default id makes a second delivery a duplicate. */
  function deliverEvent(paymentId: string, kind: 'captured' | 'failed', eventId = `evt_${paymentId}_${kind}`) {
    const hadFirst = state.value.milestones.firstPaymentId !== null
    return run((e) => adapter.applyProcessorEvent(state.value, { id: eventId, paymentId, kind }, e), (outcome) => {
      if (outcome.applied) syncOrder(outcome.payment, paymentLine(outcome.payment))
      if (!hadFirst && state.value.milestones.firstPaymentId) {
        notify('first-payment', 'Your first Maropay payment came through', { name: 'MaropayPaymentDetail', params: { paymentId } })
      }
    })
  }

  // ── Payouts ─────────────────────────────────────────────────────────

  function runPayout() {
    const hadFirst = state.value.milestones.firstPayoutId !== null
    return run((e) => adapter.runPayout(state.value, e), (payout) => {
      if (!hadFirst) {
        notify('first-payout', `Your first Maropay payout of ${formatMoney(payout.amount)} is on its way to ${payout.destination.bankName} •••• ${payout.destination.last4}`,
          { name: 'MaropayPayoutDetail', params: { payoutId: payout.id } })
      }
    })
  }

  function markPayoutPaid(payoutId: string) {
    return run((e) => adapter.markPayoutPaid(state.value, payoutId, e))
  }

  function failPayout(payoutId: string, code: 'account_closed' | 'invalid_account_number' | 'bank_rejected' = 'account_closed') {
    const before = taskIds()
    return run((e) => adapter.failPayout(state.value, payoutId, code, e), () => notifyNewTasks(before))
  }

  function retryPayout(payoutId: string) {
    return run((e) => adapter.retryPayout(state.value, payoutId, e))
  }

  function requestStepUp(): StepUpChallenge {
    const challenge = adapter.requestStepUp(env())
    stepUp.value = { challenge, token: null }
    return challenge
  }

  function confirmStepUp(code: string): Result<StepUpToken> {
    const challenge = stepUp.value.challenge
    if (!challenge) return fail('step_up_required', 'Request a verification code first.')
    const result = adapter.confirmStepUp(challenge, code, env())
    if (result.ok) stepUp.value = { challenge: null, token: result.value }
    return result
  }

  function updateBankAccount(input: { holderName: string; bankName: string; accountNumber: string; bankCode?: string; holderType?: 'individual' | 'company' | null }) {
    const result = run((e) => adapter.updateBankAccount(state.value, input, stepUp.value.token, e), (a) => {
      notify(`bank-${a.payoutDestination?.addedAt ?? ''}`, `Security notice: your Maropay payout bank changed to ${a.payoutDestination?.bankName} •••• ${a.payoutDestination?.last4}`,
        { name: 'MaropaySettings', query: { tab: 'bank' } })
    })
    stepUp.value = { challenge: null, token: null }
    return result
  }

  // ── Business details and closing ────────────────────────────────────

  function requestBusinessChange(field: BusinessChangeField, value: string) {
    return run((e) => adapter.requestBusinessChange(state.value, { field, value }, e))
  }

  function simulateBusinessChangeOutcome(taskId: string, approved: boolean) {
    return run((e) => adapter.simulateBusinessChangeOutcome(state.value, taskId, approved, e), (task) => {
      const label = task.change ? BUSINESS_CHANGE_LABELS[task.change.field] : 'Business details'
      notify(`${task.id}-outcome`, approved ? `Maropay: your ${label.toLowerCase()} change was approved` : `Maropay: your ${label.toLowerCase()} change wasn’t approved — your current details stay`,
        { name: 'MaropaySettings', query: { tab: 'business' } })
    })
  }

  function updatePublicDetails(details: LegalBusiness['publicDetails']) {
    return run((e) => adapter.updatePublicDetails(state.value, details, e))
  }

  /** Needs a confirmed step-up first (confirmStepUp); the token is spent either way. */
  function closeAccount() {
    const result = run((e) => adapter.closeAccount(state.value, stepUp.value.token, e), () => {
      notify('closed', 'Security notice: your Maropay account was closed. Its history stays available.', { name: 'MaropayOverview' })
    })
    stepUp.value = { challenge: null, token: null }
    return result
  }

  // ── Disputes ────────────────────────────────────────────────────────

  function openDispute(paymentId: string, reason: DisputeReason = 'product_not_received') {
    return run((e) => adapter.openDispute(state.value, paymentId, reason, e), (dispute) => {
      const payment = paymentById(paymentId)
      if (payment) syncOrder(payment, `Payment of ${formatMoney(payment.amount)} disputed by the shopper’s bank — respond by ${formatDay(dispute.respondBy)}`)
      notify(dispute.id, `New Maropay dispute on ${dispute.orderNumber ?? paymentId} — respond by ${formatDay(dispute.respondBy)}`,
        { name: 'MaropayDisputeDetail', params: { disputeId: dispute.id } })
    })
  }

  function saveDisputeDraft(disputeId: string, patch: { summary?: string; evidence?: { key: EvidenceItem['key']; note?: string; document?: MockDocument | null } }) {
    return run((e) => adapter.saveDisputeDraft(state.value, disputeId, patch, e))
  }

  function submitEvidence(disputeId: string) {
    return run((e) => adapter.submitDisputeEvidence(state.value, disputeId, e))
  }

  function acceptDispute(disputeId: string) {
    return run((e) => adapter.acceptDispute(state.value, disputeId, e))
  }

  function simulateDisputeOutcome(disputeId: string, outcome: 'won' | 'lost') {
    return run((e) => adapter.simulateDisputeOutcome(state.value, disputeId, outcome, e), (dispute) => {
      const payment = paymentById(dispute.paymentId)
      if (payment) syncOrder(payment, outcome === 'won' ? 'Dispute won — the payment was returned to your Maropay balance' : 'Dispute lost — the amount and dispute fee stay deducted')
    })
  }

  // ── Reviewer controls ───────────────────────────────────────────────

  function applyScenario(key: MaropayScenarioKey): void {
    unproject()
    now.value = Date.now()
    stepUp.value = { challenge: null, token: null }
    lastError.value = null
    Object.assign(failures, adapter.defaultFailures())
    state.value = buildScenario(key, scenarioContext())
    persist()
    project()
    for (const task of openTasks.value) notifyTask(task)
  }

  /** Clears only this account's Maropay state; other demo state (PLG, onboarding) is untouched. */
  function resetScenario(): void {
    unproject()
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey(state.value.accountId))
      } catch {
        /* ignore */
      }
    }
    now.value = Date.now()
    stepUp.value = { challenge: null, token: null }
    lastError.value = null
    Object.assign(failures, adapter.defaultFailures())
    state.value = emptyState(state.value.accountId, now.value)
    hasExplicitState.value = false
  }

  function setActingRole(role: MaropayActingRole, assigned: string[] | null = null): void {
    state.value.actingRole = role
    state.value.assignedChannelIds = role === 'store_ops' ? assigned ?? eligibleChannels.value.slice(0, 1).map((c) => c.id) : null
    persist()
  }

  function setFailure<K extends keyof FailurePlan>(key: K, value: FailurePlan[K]): void {
    failures[key] = value
  }

  function dismissDiscovery(): void {
    state.value.discoveryDismissedAt = new Date().toISOString()
    persist()
  }

  function dismissMilestone(key: 'first_payment' | 'first_payout'): void {
    if (!state.value.milestones.dismissed.includes(key)) state.value.milestones.dismissed.push(key)
    persist()
  }

  return {
    // state
    state, hasExplicitState, failures, lastError, now,
    // derived
    account, business, terms, onboarding, bindings, methods, payments, payouts, disputes, tasks, openTasks,
    history, milestones, actingRole, assignedChannelIds, scenarioKey, discoveryDismissedAt,
    capabilities, dimensions, overview, requirements, rules, partnerDecisions, activationTarget, balances, upcomingPayout, closureChecks, eligibleChannels,
    can, filterPayments, bindingFor, storeStateFor, checklistFor, methodsForStore, checkoutMethodsFor, migrationImpactFor,
    storeProvidersFor, storefrontOfferFor, maropayOfferedFor,
    paymentById, paymentForOrder, breakdownFor, refundableForOrder, payoutById, movementsForPayout, disputeById, taskById,
    channelName, channelFacts, routeFor, loadRecords,
    // onboarding
    startSetup, saveStep, acceptTerms, savePayoutDetails, requestOwnerReview, submitSetup, resolveTask, simulateReviewOutcome,
    raiseThresholdRequirement,
    // stores
    linkStore, setMethodEnabled, simulateMethodApproval, setCaptureMode, updateCheckoutOptions, validateCheckout, markImpactReviewed, activateStore, deactivateStore,
    deactivateAllStores, dismissActivationNotice,
    // the store's own providers
    connectProvider, setProviderStatus, removeProvider, updateManualMethod,
    // account settings
    requestBusinessChange, simulateBusinessChangeOutcome, updatePublicDetails, closeAccount,
    // checkout and payments
    startCheckout, confirmCheckout, completeCheckoutAction, capture, markManualPayment, voidPayment, refund, refundLinkedOrder, settleRefund, deliverEvent,
    // payouts
    runPayout, markPayoutPaid, failPayout, retryPayout, requestStepUp, confirmStepUp, updateBankAccount,
    // disputes
    openDispute, saveDisputeDraft, submitEvidence, acceptDispute, simulateDisputeOutcome,
    // reviewer
    applyScenario, resetScenario, setActingRole, setFailure, dismissDiscovery, dismissMilestone,
  }
})
