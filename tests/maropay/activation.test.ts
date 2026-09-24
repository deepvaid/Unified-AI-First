import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { activationChecklist, deriveCapabilities, deriveOverviewInstruction, storeActivationState } from '../../src/maropay/readiness.ts'
import {
  activateStore, deactivateStore, markImpactReviewed, resolveTask, setCaptureMode, setMethodEnabled, simulateMethodApproval,
  simulateReviewOutcome, submitOnboarding, validateCheckout,
} from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, BETA, DAY, NOW, channelFacts, context, env } from './fixtures.ts'

function readyState() {
  // M15 without Klarna: verified, Atlas linked, checks passed.
  const state = buildScenario('m15', context())
  return state
}

test('a verified store with passed checks can be activated; activation is a separate decision', () => {
  const state = readyState()
  const binding = state.bindings.find((b) => b.channelId === ATLAS)!
  assert.equal(storeActivationState(binding, deriveCapabilities(state, NOW)), 'ready_to_activate')
  assert.equal(activationChecklist(state, binding, channelFacts(ATLAS), NOW).ok, true)
  const result = activateStore(state, ATLAS, channelFacts(ATLAS), env())
  assert.ok(result.ok)
  assert.equal(binding.activation, 'live')
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'active')
})

test('each checklist item blocks activation on its own', () => {
  const cases: Array<[string, (s: ReturnType<typeof readyState>) => void]> = [
    ['checkout_validated', (s) => { s.bindings[0]!.checkoutValidation = { status: 'failed', at: null, failureReason: 'x' } }],
    ['impact_reviewed', (s) => { s.bindings[0]!.impactReviewedAt = null }],
    ['payout_ready', (s) => { s.account!.payoutDestination = null }],
    ['methods_ready', (s) => { s.bindings[0]!.enabledMethodIds = ['klarna'] }],
    ['payment_capability', (s) => { s.account!.verification = 'under_review' }],
  ]
  for (const [key, mutate] of cases) {
    const state = readyState()
    mutate(state)
    const checklist = activationChecklist(state, state.bindings[0]!, channelFacts(ATLAS), NOW)
    assert.equal(checklist.ok, false, key)
    assert.ok(checklist.blockedBy.includes(key as never), `${key} reported`)
    assert.equal(activateStore(state, ATLAS, channelFacts(ATLAS), env()).ok, false, `${key} refuses activation`)
  }
})

test('the checklist says whose move it is: under review waits on the partner, action required is the merchant’s', () => {
  const m03 = buildScenario('m03', context())
  const [payments, payouts] = activationChecklist(m03, m03.bindings[0]!, channelFacts(ATLAS), NOW).items
  assert.equal(m03.account?.verification, 'action_required')
  assert.equal(payments!.state, 'todo')
  assert.match(payments!.detail, /needs more information/)
  assert.equal(payouts!.state, 'todo')

  m03.account!.verification = 'under_review'
  const waiting = activationChecklist(m03, m03.bindings[0]!, channelFacts(ATLAS), NOW).items
  assert.equal(waiting[0]!.state, 'waiting')
  assert.equal(waiting[1]!.state, 'waiting')
  assert.match(waiting[1]!.detail, /once your business is verified/)
})

test('store prerequisites: drafts, other platforms and POS channels are refused', () => {
  const state = readyState()
  const binding = state.bindings[0]!
  const draft = { ...channelFacts(ATLAS), status: 'draft' }
  assert.ok(activationChecklist(state, binding, draft, NOW).blockedBy.includes('store_prerequisites'))
  const shopify = { ...channelFacts(ATLAS), provider: 'shopify' }
  assert.ok(activationChecklist(state, binding, shopify, NOW).blockedBy.includes('store_prerequisites'))
  const pos = { ...channelFacts(ATLAS), type: 'offline_store' as const }
  assert.ok(activationChecklist(state, binding, pos, NOW).blockedBy.includes('store_prerequisites'))
})

test('manual capture with a method that can’t support it is surfaced before switching', () => {
  const state = readyState()
  setMethodEnabled(state, ATLAS, 'affirm', true, env())
  setCaptureMode(state, ATLAS, 'manual', env())
  validateCheckout(state, ATLAS, env())
  markImpactReviewed(state, ATLAS, env())
  const checklist = activationChecklist(state, state.bindings[0]!, channelFacts(ATLAS), NOW)
  assert.deepEqual(checklist.blockedBy, ['store_prerequisites'])
  assert.match(checklist.items.find((i) => i.key === 'store_prerequisites')!.detail, /Affirm/)
})

test('changing methods resets the test checkout and impact review (M15: a pending method never blocks)', () => {
  const state = readyState()
  const binding = state.bindings[0]!
  assert.ok(binding.enabledMethodIds.includes('klarna'))
  assert.equal(state.methods.find((m) => m.id === 'klarna')!.availability, 'pending_approval')
  assert.equal(activationChecklist(state, binding, channelFacts(ATLAS), NOW).ok, true)
  setMethodEnabled(state, ATLAS, 'afterpay_clearpay', true, env())
  assert.equal(binding.checkoutValidation.status, 'not_run')
  assert.equal(binding.impactReviewedAt, null)
  // Approval later turns Klarna on for the store that asked for it.
  simulateMethodApproval(state, 'klarna', true, env())
  assert.equal(state.methods.find((m) => m.id === 'klarna')!.availability, 'available')
  assert.ok(state.tasks.every((t) => t.kind !== 'method_review' || t.status === 'resolved'))
})

test('M03 → resolve the task → review → ready to activate', () => {
  const state = buildScenario('m03', context())
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'provide_info')
  const task = state.tasks.find((t) => t.kind === 'verification')!
  assert.equal(resolveTask(state, task.id, {}, env()).ok, false)
  assert.ok(resolveTask(state, task.id, { document: { name: 'id.jpg', sizeLabel: '1 MB', status: 'received' } }, env()).ok)
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'under_review')
  simulateReviewOutcome(state, 'verified', env())
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'ready_to_activate')
})

test('a deadline that passes restricts payments', () => {
  const state = buildScenario('m03', context())
  simulateReviewOutcome(state, 'verified', env())
  const later = NOW + 30 * DAY
  const task = state.tasks.find((t) => t.kind === 'verification')!
  assert.equal(task.status, 'resolved')
  state.tasks.push({ ...task, id: 'task_late', status: 'open', dueAt: new Date(NOW + DAY).toISOString(), resolvedAt: null })
  assert.equal(deriveCapabilities(state, NOW).payments, 'enabled')
  assert.equal(deriveCapabilities(state, later).payments, 'restricted')
  assert.equal(deriveOverviewInstruction(state, later).headline, 'Payments are paused until you provide information')
})

test('M04: a rejected business can’t activate anywhere', () => {
  const state = buildScenario('m04', context())
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'unavailable')
  assert.equal(deriveCapabilities(state, NOW).payments, 'disabled')
  assert.equal(activateStore(state, ATLAS, channelFacts(ATLAS), env()).ok, false)
})

test('submission is not approval: an unreadable ID or manual review keeps payments off', () => {
  const state = buildScenario('m02', context())
  assert.equal(submitOnboarding(state, env()).ok, false, 'incomplete setup is refused')
  const m03 = buildScenario('m03', context())
  assert.equal(m03.account?.setup, 'submitted')
  assert.equal(deriveCapabilities(m03, NOW).payments, 'inactive')
})

test('M14: deactivation changes future routing only', () => {
  const state = buildScenario('m14', context())
  const payments = state.payments.length
  const payouts = state.payouts.length
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  assert.equal(state.bindings[0]!.activation, 'inactive')
  assert.equal(state.payments.length, payments)
  assert.equal(state.payouts.length, payouts)
  assert.match(state.history[0]!.text, /PayPal/)
})

test('M07: the second store activates without repeating setup', () => {
  const state = buildScenario('m07', context())
  const beta = state.bindings.find((b) => b.channelId === BETA)!
  assert.equal(storeActivationState(beta, deriveCapabilities(state, NOW)), 'ready_to_activate')
  validateCheckout(state, BETA, env())
  markImpactReviewed(state, BETA, env())
  assert.ok(activateStore(state, BETA, channelFacts(BETA), env()).ok)
  assert.equal(state.bindings.filter((b) => b.activation === 'live').length, 2)
})
