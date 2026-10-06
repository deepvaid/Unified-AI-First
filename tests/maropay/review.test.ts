import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { MOCK_CLIENT_IP, parseState } from '../../src/maropay/model.ts'
import type { MaropayAccountState } from '../../src/maropay/model.ts'
import {
  activationChecklist, activationTarget, availablePartnerDecisions, deriveCapabilities, deriveOverviewInstruction, formatDay, storeActivationState,
} from '../../src/maropay/readiness.ts'
import { deriveRequirements, partnerChecklist, requirementForm, rulesForState } from '../../src/maropay/requirements.ts'
import { money } from '../../src/maropay/money.ts'
import {
  acceptTerms, activateStore, createCheckoutSession, deactivateStore, linkStore, markImpactReviewed, raiseThresholdRequirement, resolveTask,
  setMethodEnabled, simulateReviewOutcome, validateCheckout,
} from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, BETA, DAY, NOW, channelFacts, context, env } from './fixtures.ts'

const MAX_TEST_STORE = 'max-test-store'
const ID = { name: 'passport.jpg', sizeLabel: '1.2 MB', status: 'received' as const }

function openActivationTasks(state: MaropayAccountState) {
  return state.tasks.filter((t) => t.kind === 'activate_store' && t.status !== 'resolved')
}

/** Every operation leaves state that survives storage unchanged. */
function roundTrips(state: MaropayAccountState): void {
  assert.deepEqual(parseState(JSON.stringify(state), state.accountId, NOW), state)
}

// ── Approval prompts; the owner decides ───────────────────────────────────

test('approval raises one activation task per store that could go live — never for a draft store, never twice', () => {
  const state = buildScenario('m03', context())
  linkStore(state, MAX_TEST_STORE, env())
  assert.equal(openActivationTasks(state).length, 0, 'nothing before approval')
  const task = state.tasks.find((t) => t.kind === 'verification')!
  assert.ok(resolveTask(state, task.id, { documents: { front: ID, back: null } }, env()).ok)
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok)
  const raised = openActivationTasks(state)
  assert.deepEqual(raised.map((t) => t.channelId), [ATLAS], 'the draft store gets no task')
  assert.equal(raised[0]!.title, 'Activate Maropay on Atlas Outfitters')
  assert.equal(raised[0]!.blocking, false, 'it never blocks the checklist it points at')
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok)
  assert.equal(openActivationTasks(state).length, 1, 'approving again raises nothing new')
  assert.equal(resolveTask(state, raised[0]!.id, { confirmed: true }, env()).ok, false, 'only activation resolves it')
  roundTrips(state)
})

test('linking a store after approval raises its task; activating resolves it; stopping never re-raises it', () => {
  const state = buildScenario('m06', context())
  assert.deepEqual(openActivationTasks(state).map((t) => t.channelId), [ATLAS])
  linkStore(state, BETA, env())
  assert.deepEqual(openActivationTasks(state).map((t) => t.channelId), [ATLAS, BETA])
  validateCheckout(state, ATLAS, env())
  markImpactReviewed(state, ATLAS, env())
  assert.ok(activateStore(state, ATLAS, channelFacts(ATLAS), env()).ok)
  assert.deepEqual(openActivationTasks(state).map((t) => t.channelId), [BETA])
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  assert.deepEqual(openActivationTasks(state).map((t) => t.channelId), [BETA], 'the owner stopped it on purpose')
  roundTrips(state)
})

test('a partner request retires the activation tasks; approval raises them again', () => {
  const state = buildScenario('m15', context())
  assert.equal(openActivationTasks(state).length, 1)
  assert.ok(simulateReviewOutcome(state, 'more_info', env()).ok)
  assert.equal(openActivationTasks(state).length, 0)
  const request = state.tasks.find((t) => t.kind === 'verification' && t.status === 'open')!
  assert.equal(request.dueAt !== null, true, 'a verified business gets a deadline')
  assert.equal(state.account?.verification, 'verified', 'verification is not withdrawn by a request')
  assert.ok(resolveTask(state, request.id, { documents: { front: ID, back: ID } }, env()).ok)
  assert.deepEqual(request.documents, { front: ID, back: ID })
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok)
  assert.equal(openActivationTasks(state).length, 1)
  roundTrips(state)
})

// ── The partner's requests ────────────────────────────────────────────────

test('M03 is a keyed identity request: partner code kept for support, reason in the merchant’s words, no deadline before verification', () => {
  const state = buildScenario('m03', context())
  const task = state.tasks.find((t) => t.kind === 'verification')!
  assert.equal(task.requirement, 'representative.verification.document')
  assert.equal(task.errorCode, 'verification_failed_keyed_identity')
  assert.match(task.errorReason ?? '', /identity/)
  assert.equal(task.dueAt, null)
  assert.equal(task.title, 'Upload a photo ID for Jordan Lee')
  const view = deriveRequirements(state, NOW)
  assert.deepEqual(view.currentlyDue, ['representative.verification.document'])
  assert.deepEqual(view.errors.map((e) => e.code), ['verification_failed_keyed_identity'])
  assert.equal(view.disabledReason, 'requirements.past_due')
  assert.ok(resolveTask(state, task.id, { documents: { front: ID } }, env()).ok)
  const waiting = deriveRequirements(state, NOW)
  assert.deepEqual(waiting.currentlyDue, ['representative.verification.document'], 'a provided key stays due until the partner checks it')
  assert.ok(waiting.pendingVerification.includes('representative.verification.document'))
  assert.equal(waiting.disabledReason, 'requirements.pending_verification')
})

test('requests that make no sense for the account are refused', () => {
  const state = buildScenario('m03', context())
  const unreadable = simulateReviewOutcome(state, 'more_info', env(), { request: 'document_unreadable' })
  assert.equal(!unreadable.ok && unreadable.error.code, 'invalid_input', 'nothing was sent yet')
  const owner = simulateReviewOutcome(state, 'more_info', env(), { request: 'owner_identity' })
  assert.equal(owner.ok, false, 'no other owners on file')
  assert.ok(simulateReviewOutcome(state, 'more_info', env(), { request: 'website_inaccessible' }).ok)
  const website = state.tasks.find((t) => t.kind === 'verification' && t.status === 'open')!
  assert.equal(website.requirement, 'business_profile.url')
  assert.deepEqual(website.alternative, ['business_profile.product_description'], 'a US business may describe what it sells instead')
  assert.equal(state.tasks.filter((t) => t.kind === 'verification' && t.status !== 'resolved').length, 1, 'one outstanding request per decision')
})

test('a keyed value is validated and applied; the alternative answers with a document instead', () => {
  const state = buildScenario('m10', context())
  assert.ok(simulateReviewOutcome(state, 'more_info', env(), { request: 'name_mismatch' }).ok)
  const task = state.tasks.find((t) => t.kind === 'verification' && t.status === 'open')!
  assert.equal(task.requirement, 'company.tax_id')
  assert.deepEqual(task.alternative, ['company.verification.document'])
  const bad = resolveTask(state, task.id, { value: '12' }, env())
  assert.equal(!bad.ok && bad.error.code, 'invalid_input')
  assert.ok(resolveTask(state, task.id, { value: '12-3456789' }, env()).ok)
  assert.equal(state.business?.taxId, '12-3456789')
  assert.equal(state.onboarding.business.taxId, '12-3456789')
  assert.equal(task.status, 'waiting_review')

  const again = buildScenario('m10', context())
  simulateReviewOutcome(again, 'more_info', env(), { request: 'name_mismatch' })
  const alt = again.tasks.find((t) => t.kind === 'verification' && t.status === 'open')!
  assert.equal(resolveTask(again, alt.id, { useAlternative: true }, env()).ok, false, 'the alternative wants a document')
  assert.ok(resolveTask(again, alt.id, { useAlternative: true, documents: { front: ID } }, env()).ok)
  assert.deepEqual(alt.documents, { front: ID, back: null })
  roundTrips(again)
})

test('the tax-ID check is refused where the partner doesn’t run it', () => {
  const ca = buildScenario('m10', context())
  ca.business!.country = 'CA'
  ca.account!.country = 'CA'
  assert.equal(simulateReviewOutcome(ca, 'more_info', env(), { request: 'name_mismatch' }).ok, false)
  const individual = buildScenario('m10', context())
  individual.business!.type = 'individual'
  assert.equal(simulateReviewOutcome(individual, 'more_info', env(), { request: 'name_mismatch' }).ok, false)
})

// ── Declines ──────────────────────────────────────────────────────────────

test('a decline names its reason, keeps payments off and is never offered while a store is trading', () => {
  const live = buildScenario('m10', context())
  const refused = simulateReviewOutcome(live, 'rejected', env())
  assert.equal(!refused.ok && refused.error.code, 'stale_state')

  const state = buildScenario('m06', context())
  assert.ok(simulateReviewOutcome(state, 'rejected', env(), { reason: 'listed' }).ok)
  assert.equal(state.account?.declineReason, 'listed')
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'declined')
  assert.match(deriveOverviewInstruction(state, NOW).detail, /appears on a list/)
  assert.equal(openActivationTasks(state).length, 0)
  assert.deepEqual(availablePartnerDecisions(state), [], 'no appeal flow — support only')
  assert.equal(simulateReviewOutcome(state, 'verified', env()).ok, false)
  roundTrips(state)
})

test('the reviewer is offered only the decisions the partner could still make', () => {
  assert.deepEqual(availablePartnerDecisions(buildScenario('m02', context())), [])
  assert.deepEqual(availablePartnerDecisions(buildScenario('m03', context())), ['verified', 'more_info', 'rejected'])
  const live = buildScenario('m10', context())
  assert.deepEqual(availablePartnerDecisions(live), ['more_info'], 'a trading business is paused with a request, never declined')
  simulateReviewOutcome(live, 'more_info', env())
  assert.deepEqual(availablePartnerDecisions(live), ['verified', 'more_info'], 'a request can be accepted')
  assert.deepEqual(availablePartnerDecisions(buildScenario('m15', context())), ['more_info', 'rejected'], 'verified, nothing live, nothing pending')
  assert.deepEqual(availablePartnerDecisions(buildScenario('m16', context())), ['more_info'], 'an unanswered threshold item is not awaiting a decision')
  assert.deepEqual(availablePartnerDecisions(buildScenario('m04', context())), [])
})

// ── Later-dated requirements and staged enforcement ───────────────────────

test('M16: a later requirement is dated; payouts pause at the deadline and payments a week after', () => {
  const state = buildScenario('m16', context())
  const task = state.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.match(task.title, /^Provide your EIN by /)
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'provide_info')
  assert.match(deriveOverviewInstruction(state, NOW).headline, /^Provide information by /)
  assert.deepEqual(deriveCapabilities(state, NOW), { payments: 'enabled', payouts: 'ready' })
  const due = Date.parse(task.dueAt!)
  assert.deepEqual(deriveCapabilities(state, due + DAY), { payments: 'enabled', payouts: 'paused' })
  assert.equal(deriveOverviewInstruction(state, due + DAY).headline, 'Payouts are paused until you provide information')
  assert.deepEqual(deriveCapabilities(state, due + 8 * DAY), { payments: 'restricted', payouts: 'paused' })
  assert.deepEqual(deriveRequirements(state, NOW).eventuallyDue, [], 'once raised it is no longer "later"')
  assert.equal(raiseThresholdRequirement(state, 'company.tax_id', env()).ok && state.tasks.filter((t) => t.requirement === 'company.tax_id').length, 1, 'raising twice adds nothing')
  assert.equal(raiseThresholdRequirement(state, 'business_profile.support_phone', env()).ok, false, 'not a later item for a US company')
  assert.equal(raiseThresholdRequirement(buildScenario('m03', context()), 'company.tax_id', env()).ok, false, 'only on a verified account')
  roundTrips(state)
})

test('M17: past the deadline, checkout refuses and the partner view says why; providing the EIN reopens review', () => {
  const state = buildScenario('m17', context())
  assert.equal(deriveOverviewInstruction(state, NOW).headline, 'Payments and payouts are paused until you provide information')
  assert.deepEqual(deriveCapabilities(state, NOW), { payments: 'restricted', payouts: 'paused' })
  const view = deriveRequirements(state, NOW)
  assert.deepEqual(view.pastDue, ['company.tax_id'])
  assert.equal(view.disabledReason, 'requirements.past_due')
  const refused = createCheckoutSession(state, {
    channelId: ATLAS, methodId: 'card', flow: 'success', amount: money(1000, 'USD'),
    customer: { name: 'A', email: 'a@example.com' }, lineItems: [{ product: 'Tee', sku: 'S', qty: 1, price: '10.00' }],
  }, env())
  assert.equal(!refused.ok && refused.error.code, 'requirement_pending')
  const task = state.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(resolveTask(state, task.id, { value: '84-2210931' }, env()).ok)
  assert.equal(task.status, 'waiting_review')
  assert.deepEqual(deriveCapabilities(state, NOW), { payments: 'restricted', payouts: 'paused' }, 'waiting on review keeps the pause')
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok)
  assert.deepEqual(deriveCapabilities(state, NOW), { payments: 'enabled', payouts: 'ready' })
  roundTrips(state)
})

// ── Store states and the activation target ────────────────────────────────

test('needs setup and ready to activate are different answers, and the target picks the store that is furthest along', () => {
  const m05 = buildScenario('m05', context())
  const atlas = m05.bindings.find((b) => b.channelId === ATLAS)!
  assert.equal(storeActivationState(atlas, deriveCapabilities(m05, NOW), activationChecklist(m05, atlas, channelFacts(ATLAS), NOW)), 'needs_setup')
  assert.equal(activationTarget(m05, NOW, channelFacts)?.kind, 'set_up_store')

  const m15 = buildScenario('m15', context())
  const ready = m15.bindings.find((b) => b.channelId === ATLAS)!
  assert.equal(storeActivationState(ready, deriveCapabilities(m15, NOW), activationChecklist(m15, ready, channelFacts(ATLAS), NOW)), 'ready_to_activate')
  linkStore(m15, BETA, env())
  assert.equal(activationTarget(m15, NOW, channelFacts)?.binding.channelId, ATLAS, 'the ready store wins over the one still to set up')
  assert.equal(deriveOverviewInstruction(m15, NOW, channelFacts).headline, 'Ready to activate on Atlas Outfitters')

  assert.equal(activationTarget(buildScenario('m01', context()), NOW), null)
  const drafts = buildScenario('m06', context())
  linkStore(drafts, MAX_TEST_STORE, env())
  assert.deepEqual(activationTarget(drafts, NOW, channelFacts)?.binding.channelId, ATLAS, 'a draft store is never the target')
})

// ── Methods ───────────────────────────────────────────────────────────────

test('wallets ride on card payments', () => {
  const live = buildScenario('m10', context())
  assert.equal(setMethodEnabled(live, ATLAS, 'card', false, env()).ok, false, 'a live store keeps a ready method')
  const state = buildScenario('m15', context())
  const binding = state.bindings.find((b) => b.channelId === ATLAS)!
  assert.ok(setMethodEnabled(state, ATLAS, 'apple_pay', false, env()).ok)
  assert.ok(setMethodEnabled(state, ATLAS, 'card', false, env()).ok, 'Google Pay goes with the cards')
  assert.equal(binding.enabledMethodIds.includes('google_pay'), false)
  const refused = setMethodEnabled(state, ATLAS, 'apple_pay', true, env())
  assert.equal(!refused.ok && refused.error.code, 'invalid_input')
  assert.ok(setMethodEnabled(state, ATLAS, 'card', true, env()).ok)
  assert.ok(setMethodEnabled(state, ATLAS, 'apple_pay', true, env()).ok)
})

// ── Review fixes ──────────────────────────────────────────────────────────

test('an answered item past its deadline reads as paused under review, never as "payments are active"', () => {
  const m17 = buildScenario('m17', context())
  const ein = m17.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(resolveTask(m17, ein.id, { value: '84-2210931' }, env()).ok)
  const paused = deriveOverviewInstruction(m17, NOW, channelFacts)
  assert.equal(paused.key, 'under_review')
  assert.equal(paused.headline, 'Payments and payouts are paused while our payments partner reviews what you sent')
  assert.equal(paused.action, null, 'the next move is the partner’s')

  const m16 = buildScenario('m16', context())
  const early = m16.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(resolveTask(m16, early.id, { value: '84-2210931' }, env()).ok)
  assert.equal(deriveOverviewInstruction(m16, NOW, channelFacts).key, 'active', 'answered before the deadline, nothing is paused')

  const m07 = buildScenario('m07', context())
  assert.ok(simulateReviewOutcome(m07, 'more_info', env(), { request: 'website_inaccessible' }).ok)
  const request = m07.tasks.find((t) => t.requirement === 'business_profile.url' && t.status === 'open')!
  assert.ok(resolveTask(m07, request.id, { value: 'https://atlas-outfitters.example' }, env()).ok)
  const afterDeadline = Date.parse(request.dueAt!) + DAY
  assert.deepEqual(deriveCapabilities(m07, afterDeadline), { payments: 'restricted', payouts: 'paused' })
  assert.equal(deriveOverviewInstruction(m07, afterDeadline, channelFacts).headline, 'Payments and payouts are paused while our payments partner reviews what you sent')
})

test('a partner decision never discharges a threshold item the merchant hasn’t answered', () => {
  const state = buildScenario('m16', context())
  const ein = () => state.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(simulateReviewOutcome(state, 'more_info', env()).ok)
  assert.equal(ein().status, 'open', 'a new request doesn’t resolve the EIN')
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok, 'accepting the request')
  assert.equal(ein().status, 'open', 'accepting a request doesn’t resolve the EIN either')
  assert.equal(state.tasks.filter((t) => t.kind === 'verification' && t.status !== 'resolved').length, 1)
  assert.ok(resolveTask(state, ein().id, { value: '84-2210931' }, env()).ok)
  assert.ok(simulateReviewOutcome(state, 'verified', env()).ok)
  assert.equal(ein().status, 'resolved', 'once answered, approval accepts it')
})

test('every later item has a form of its own, and the value lands where the partner reads it', () => {
  const state = buildScenario('m10', context())
  state.business!.country = 'CA'
  state.account!.country = 'CA'
  state.business!.publicDetails.supportPhone = ''
  state.onboarding.publicDetails.supportPhone = ''
  const rules = rulesForState(state)
  for (const item of rules.dueLater) assert.ok(requirementForm(item.key, rules), `${item.key} has a form`)
  assert.equal(requirementForm('company.unknown_key', rules), null)
  const raised = raiseThresholdRequirement(state, 'business_profile.support_phone', env())
  assert.ok(raised.ok)
  assert.equal(requirementForm(raised.ok ? raised.value.requirement : undefined, rules)?.kind, 'value')
  const bad = resolveTask(state, raised.ok ? raised.value.id : '', { value: 'call us' }, env())
  assert.equal(!bad.ok && bad.error.code, 'invalid_input')
  assert.equal(resolveTask(state, raised.ok ? raised.value.id : '', { documents: { front: ID } }, env()).ok, false, 'a photo ID is not a phone number')
  assert.ok(resolveTask(state, raised.ok ? raised.value.id : '', { value: '+1 416 555 0100' }, env()).ok)
  assert.equal(state.business!.publicDetails.supportPhone, '+1 416 555 0100')
})

test('a later item already on file is never asked for', () => {
  const state = buildScenario('m10', context())
  assert.equal(state.business!.taxId, '84-2210931')
  assert.ok(!deriveRequirements(state, NOW).eventuallyDue.some((d) => d.key === 'company.tax_id'))
  const refused = raiseThresholdRequirement(state, 'company.tax_id', env())
  assert.equal(!refused.ok && refused.error.code, 'invalid_input')
  assert.match(!refused.ok ? refused.error.message : '', /already on file/)
  const later = partnerChecklist(state.onboarding, rulesForState(state), state.terms.version, NOW).dueLater
  assert.equal(later.find((i) => i.key === 'company.tax_id')?.complete, true)
  assert.equal(buildScenario('m16', context()).business!.taxId, '', 'M16 hasn’t given its EIN yet')
})

test('M17 is built in date order: nothing is paid out after the deadline or taken after the pause', () => {
  const state = buildScenario('m17', context())
  const ein = state.tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(state.payouts.length >= 1, 'payouts ran before the deadline')
  for (const payout of state.payouts) assert.ok(Date.parse(payout.createdAt) <= Date.parse(ein.dueAt!), `${payout.id} predates the deadline`)
  for (const payment of state.payments) assert.ok(Date.parse(payment.createdAt) <= Date.parse(ein.paymentsPauseAt!), `${payment.id} predates the pause`)
  assert.ok(Date.parse(ein.createdAt) < Math.min(...state.payments.map((p) => Date.parse(p.createdAt))), 'raised before the history it shapes')
})

test('the threshold task tells the merchant both pause dates in one sentence', () => {
  const ein = buildScenario('m16', context()).tasks.find((t) => t.requirement === 'company.tax_id')!
  assert.ok(ein.description.includes(formatDay(ein.dueAt!)) && ein.description.includes(formatDay(ein.paymentsPauseAt!)))
  assert.ok(!/illustrative|asked once/.test(ein.description))
})

test('a first-phase acceptance is recorded again, once, with the IP address and browser', () => {
  const state = buildScenario('m02', context())
  state.terms.acceptedIp = null
  state.terms.acceptedUserAgent = null
  const history = state.history.length
  assert.ok(acceptTerms(state, { userAgent: 'Mozilla/5.0 later' }, env()).ok)
  assert.equal(state.terms.acceptedIp, MOCK_CLIENT_IP)
  assert.equal(state.terms.acceptedUserAgent, 'Mozilla/5.0 later')
  assert.equal(state.history.length, history + 1)
  assert.ok(acceptTerms(state, { userAgent: 'again' }, env()).ok)
  assert.equal(state.history.length, history + 1, 'and only once')
})

test('a pre-submission save reads back in its country’s currency', () => {
  const state = buildScenario('m02', context())
  const raw = JSON.parse(JSON.stringify(state)) as MaropayAccountState
  raw.account!.country = 'CA'
  raw.onboarding.country = 'CA'
  const parsed = parseState(JSON.stringify(raw), state.accountId, NOW)!
  assert.equal(parsed.account!.currency, 'CAD')
  assert.equal(parsed.terms.disputeFee.currency, 'CAD')
  assert.ok(parsed.methods.every((m) => m.availability !== 'available' || m.currencies.includes('CAD')))
  assert.deepEqual(parseState(JSON.stringify(parsed), state.accountId, NOW), parsed, 'and stays that way')
  const submittedSave = parseState(JSON.stringify(buildScenario('m10', context())), state.accountId, NOW)!
  assert.equal(submittedSave.account!.currency, 'USD', 'a submitted account keeps its currency')
})
