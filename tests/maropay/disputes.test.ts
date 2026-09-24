import { test } from 'node:test'
import assert from 'node:assert/strict'
import { daysUntil, deadlineLabel, missingEvidence } from '../../src/maropay/disputes.ts'
import { deriveBalances } from '../../src/maropay/readiness.ts'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { acceptDispute, saveDisputeDraft, simulateDisputeOutcome, submitDisputeEvidence } from '../../src/services/maropay/mockAdapter.ts'
import { NOW, context, env } from './fixtures.ts'

const HOUR = 3_600_000

test('deadlines read in calendar days, and passing one is said in words', () => {
  const at = (days: number, hours = 0) => new Date(NOW + days * 24 * HOUR + hours * HOUR).toISOString()
  assert.equal(deadlineLabel(at(9), NOW), 'Due in 9 days')
  assert.equal(deadlineLabel(at(9), NOW + 2 * HOUR), 'Due in 9 days', 'the same date later in the day is still 9 days')
  assert.equal(deadlineLabel(at(1), NOW), 'Due tomorrow')
  assert.equal(deadlineLabel(at(0, 2), NOW), 'Due today')
  assert.equal(deadlineLabel(at(0, -1), NOW), 'Deadline passed today')
  assert.equal(deadlineLabel(at(-2), NOW), 'Overdue by 2 days')
  assert.equal(daysUntil(at(-1), NOW), -1)
})

test('M11: evidence is required before submitting, and a won dispute returns the amount but not the fee', () => {
  const state = buildScenario('m11', context())
  const dispute = state.disputes[0]!
  const before = deriveBalances(state, NOW)[0]!.available.amount
  assert.deepEqual(missingEvidence(dispute).map((e) => e.key), ['receipt', 'shipping_proof'])
  const early = submitDisputeEvidence(state, dispute.id, env())
  assert.equal(!early.ok && early.error.code, 'requirement_pending')

  for (const key of ['receipt', 'shipping_proof'] as const) {
    assert.ok(saveDisputeDraft(state, dispute.id, { evidence: { key, document: { name: `${key}.pdf`, sizeLabel: '120 KB', status: 'received' } } }, env()).ok)
  }
  assert.ok(saveDisputeDraft(state, dispute.id, { summary: 'Delivered and signed for on 12 Sep.' }, env()).ok)
  assert.equal(missingEvidence(dispute).length, 0)
  assert.ok(submitDisputeEvidence(state, dispute.id, env()).ok)
  assert.equal(dispute.status, 'under_review')
  const locked = saveDisputeDraft(state, dispute.id, { summary: 'changed' }, env())
  assert.equal(!locked.ok && locked.error.code, 'stale_state', 'evidence can’t change after submitting')

  assert.ok(simulateDisputeOutcome(state, dispute.id, 'won', env()).ok)
  const after = deriveBalances(state, NOW)[0]!.available.amount
  assert.equal(after - before, dispute.amount.amount, 'the disputed amount comes back; the fee stays deducted')
})

test('accepting a dispute ends it without evidence, and only while it still needs a response', () => {
  const state = buildScenario('m11', context())
  const dispute = state.disputes[0]!
  assert.ok(acceptDispute(state, dispute.id, env()).ok)
  assert.equal(dispute.status, 'accepted')
  const again = submitDisputeEvidence(state, dispute.id, env())
  assert.equal(again.ok, false)
})
