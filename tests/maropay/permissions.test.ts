import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { can, canForStore } from '../../src/maropay/model.ts'
import { paymentsFor } from '../../src/maropay/readiness.ts'
import { money } from '../../src/maropay/money.ts'
import {
  activateStore, capturePayment, deactivateStore, linkStore, refundPayment, submitOnboarding, updateBankAccount,
} from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, BETA, NOW, channelFacts, context, env } from './fixtures.ts'

test('the role matrix follows the access model', () => {
  for (const action of ['change_bank', 'accept_terms', 'activate_store', 'submit_onboarding', 'close_account'] as const) {
    assert.equal(can('owner', action), true)
    assert.equal(can('finance', action), false, `finance can’t ${action}`)
    assert.equal(can('store_ops', action), false, `store ops can’t ${action}`)
  }
  assert.equal(can('finance', 'refund'), true)
  assert.equal(can('finance', 'respond_dispute'), true)
  assert.equal(can('store_ops', 'refund'), false)
  assert.equal(can('store_ops', 'capture'), true)
  assert.equal(canForStore('store_ops', 'view_transactions', BETA, [ATLAS]), false)
  assert.equal(canForStore('store_ops', 'view_transactions', ATLAS, [ATLAS]), true)
})

test('M12: the adapter refuses owner-only actions from store staff', () => {
  const state = buildScenario('m12', context())
  const staff = env(NOW, 'store_ops', [ATLAS])
  assert.equal(state.actingRole, 'store_ops')
  const bank = updateBankAccount(state, { holderName: 'X', bankName: 'Y', accountNumber: '12345678' }, { challengeId: 'x', expiresAt: new Date(NOW + 60_000).toISOString() }, staff)
  assert.equal(!bank.ok && bank.error.code, 'permission_denied')
  assert.equal(deactivateStore(state, ATLAS, staff).ok, false)
  assert.equal(linkStore(state, BETA, staff).ok, false)
  assert.equal(activateStore(state, BETA, channelFacts(BETA), staff).ok, false)
  const payment = state.payments.find((p) => p.status === 'captured')!
  const refund = refundPayment(state, payment.id, money(100, 'USD'), '', 'r', staff)
  assert.equal(!refund.ok && refund.error.code, 'permission_denied')
  assert.equal(state.bindings[0]!.activation, 'live', 'nothing changed')
})

test('store staff only see payments for their stores', () => {
  const state = buildScenario('m10', context())
  state.payments.push({ ...state.payments[0]!, id: 'pay_beta', channelId: BETA })
  assert.equal(paymentsFor(state, { assignedChannelIds: [ATLAS] }).some((p) => p.id === 'pay_beta'), false)
  assert.equal(paymentsFor(state, { assignedChannelIds: null }).some((p) => p.id === 'pay_beta'), true)
  const staff = env(NOW, 'store_ops', [ATLAS])
  assert.equal(capturePayment(state, 'pay_beta', 'k', staff).ok, false)
})

test('only an owner can submit setup; others save progress and ask the owner', () => {
  const state = buildScenario('m03', context())
  state.account!.setup = 'in_progress'
  const result = submitOnboarding(state, env(NOW, 'finance'))
  assert.equal(!result.ok && result.error.code, 'permission_denied')
})
