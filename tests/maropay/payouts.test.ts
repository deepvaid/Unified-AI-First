import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { deriveBalances, deriveCapabilities, deriveOverviewInstruction, nextPayout } from '../../src/maropay/readiness.ts'
import {
  STEP_UP_CODE, confirmStepUp, requestStepUp, resolveTask, retryPayout, runPayout, updateBankAccount,
} from '../../src/services/maropay/mockAdapter.ts'
import { payoutCsvRow, payoutLines } from '../../src/maropay/payouts.ts'
import { NOW, context, env } from './fixtures.ts'

test('M09: a failed payout returns its funds and needs a new bank account before retrying', () => {
  const state = buildScenario('m09', context())
  const failed = state.payouts.find((p) => p.status === 'failed')!
  assert.equal(deriveBalances(state, NOW)[0]!.available.amount, failed.amount.amount, 'funds are back in the available balance')
  assert.equal(deriveCapabilities(state, NOW).payouts, 'action_required')

  const early = retryPayout(state, failed.id, env())
  assert.equal(!early.ok && early.error.code, 'requirement_pending')

  const noStepUp = updateBankAccount(state, { holderName: 'Atlas Outfitters LLC', bankName: 'Chase', accountNumber: '000123454421' }, null, env())
  assert.equal(!noStepUp.ok && noStepUp.error.code, 'step_up_required')

  const challenge = requestStepUp(env())
  assert.equal(confirmStepUp(challenge, '000000', env()).ok, false)
  const token = confirmStepUp(challenge, STEP_UP_CODE, env())
  assert.ok(token.ok)
  const later = env(NOW + 60_000)
  const updated = updateBankAccount(state, { holderName: 'Atlas Outfitters LLC', bankName: 'Chase', accountNumber: '0001 2345 4421' }, token.ok ? token.value : null, later)
  assert.ok(updated.ok)
  assert.equal(state.account!.payoutDestination!.last4, '4421')
  assert.ok(!JSON.stringify(state).includes('000123454421'), 'the full account number never reaches state')

  const retry = retryPayout(state, failed.id, env(NOW + 120_000))
  assert.ok(retry.ok)
  assert.equal(retry.ok && retry.value.retryOf, failed.id)
  assert.equal(retry.ok && retry.value.amount.amount, failed.amount.amount)
  assert.equal(deriveCapabilities(state, NOW + 120_000).payouts, 'ready')
  assert.equal(retryPayout(state, failed.id, env(NOW + 180_000)).ok && state.payouts.filter((p) => p.retryOf === failed.id).length, 1, 'retrying twice creates one payout')
})

test('M08: payouts pause while payments keep working, and resume once the bank is confirmed', () => {
  const state = buildScenario('m08', context())
  assert.equal(deriveCapabilities(state, NOW).payments, 'enabled')
  assert.equal(deriveCapabilities(state, NOW).payouts, 'paused')
  assert.equal(deriveOverviewInstruction(state, NOW).headline, 'Payments are active. Payouts need attention')
  assert.equal(runPayout(state, env()).ok, false)
  const task = state.tasks.find((t) => t.kind === 'bank')!
  assert.ok(resolveTask(state, task.id, { confirmed: true }, env()).ok)
  assert.equal(deriveCapabilities(state, NOW).payouts, 'ready')
})

test('the next payout is an estimate of what’s still in the balance', () => {
  const state = buildScenario('m10', context())
  const upcoming = nextPayout(state, NOW)!
  const balance = deriveBalances(state, NOW)[0]!
  assert.equal(upcoming.amount.amount, balance.available.amount + balance.pending.amount)
  assert.equal(upcoming.blocked, false)
  const payout = runPayout(state, env())
  assert.ok(payout.ok)
  assert.equal(nextPayout(state, NOW), null)
  assert.equal(deriveBalances(state, NOW)[0]!.inTransit.amount, upcoming.amount.amount + state.payouts.filter((p) => p.status === 'in_transit' && p.id !== (payout.ok ? payout.value.id : '')).reduce((t, p) => t + p.amount.amount, 0))
})

test('every payout breaks into lines that add up to exactly what was paid', () => {
  for (const key of ['m07', 'm09', 'm10', 'm11', 'm14'] as const) {
    const state = buildScenario(key, context())
    for (const payout of state.payouts) {
      const movements = state.movements.filter((m) => payout.movementIds.includes(m.id))
      const lines = payoutLines(movements, payout.amount.currency)
      const total = lines.reduce((n, line) => n + line.amount.amount, 0)
      assert.equal(total, payout.amount.amount, `${key} ${payout.id}`)
      assert.ok(lines.some((l) => l.key === 'payments'), `${key} ${payout.id} has payments`)
    }
  }
})

test('the payout export says whether arrival is confirmed or estimated', () => {
  const state = buildScenario('m10', context())
  const paid = state.payouts.find((p) => p.status === 'paid')!
  const transit = state.payouts.find((p) => p.status === 'in_transit')!
  assert.match(payoutCsvRow(paid, 3).Arrival, /^Sent /)
  assert.match(payoutCsvRow(transit, 2).Arrival, /^Estimated /)
  assert.equal(payoutCsvRow(paid, 3).Status, 'Sent to bank')
})
