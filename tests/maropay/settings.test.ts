import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { DEFAULT_PAYOUT_SCHEDULE, parseState, representativeOf } from '../../src/maropay/model.ts'
import { closureChecks, deriveCapabilities, deriveOverviewInstruction, taskTarget } from '../../src/maropay/readiness.ts'
import {
  closeAccount, deactivateAllStores, linkStore, requestBusinessChange, simulateBusinessChangeOutcome, updatePublicDetails,
} from '../../src/services/maropay/mockAdapter.ts'
import { BETA, NOW, context, env } from './fixtures.ts'

const TOKEN = { challengeId: 'su_test', expiresAt: new Date(NOW + 60_000).toISOString() }

test('a verified account with nothing in flight closes after a step-up, and its history stays', () => {
  const state = buildScenario('m05', context())
  assert.ok(closureChecks(state, NOW).every((c) => c.ok))
  const history = state.history.length

  assert.equal(closeAccount(state, TOKEN, env(NOW, 'finance')).ok, false, 'finance can’t close the account')
  const noStepUp = closeAccount(state, null, env())
  assert.equal(!noStepUp.ok && noStepUp.error.code, 'step_up_required')

  assert.ok(closeAccount(state, TOKEN, env()).ok)
  assert.ok(state.account!.closedAt)
  assert.deepEqual(deriveCapabilities(state, NOW), { payments: 'disabled', payouts: 'inactive' })
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'closed')
  assert.equal(deriveOverviewInstruction(state, NOW).action, null)
  assert.equal(state.tasks.filter((t) => t.status !== 'resolved').length, 0, 'open tasks close with the account')
  assert.equal(state.history.length, history + 1)
  assert.equal(closeAccount(state, TOKEN, env()).ok, true, 'closing twice is a no-op')

  const relink = linkStore(state, BETA, env())
  assert.equal(!relink.ok && relink.error.code, 'requirement_pending')
})

test('M14: live stores, payouts on the way and a balance each block closing', () => {
  const state = buildScenario('m14', context())
  const failing = closureChecks(state, NOW).filter((c) => !c.ok).map((c) => c.key)
  assert.deepEqual(failing, ['stores', 'payouts', 'balance'])
  const refused = closeAccount(state, TOKEN, env())
  assert.equal(!refused.ok && refused.error.code, 'requirement_pending')
  assert.equal(state.account!.closedAt, null)

  const payments = state.payments.length
  const stopped = deactivateAllStores(state, env())
  assert.ok(stopped.ok)
  assert.equal(stopped.ok && stopped.value.length, 1)
  assert.equal(state.bindings.some((b) => b.activation === 'live'), false)
  assert.equal(state.payments.length, payments, 'stopping is routing only')
  assert.equal(closureChecks(state, NOW).find((c) => c.key === 'stores')!.ok, true)
  assert.equal(deactivateAllStores(state, env(NOW, 'finance')).ok, false)
})

test('a legal-detail change waits for review; the current value stays until it’s approved', () => {
  const state = buildScenario('m07', context())
  const before = state.business!.legalName

  assert.equal(requestBusinessChange(state, { field: 'legalName', value: '  ' }, env()).ok, false)
  const same = requestBusinessChange(state, { field: 'legalName', value: before }, env())
  assert.equal(!same.ok && same.error.code, 'invalid_input')
  assert.equal(requestBusinessChange(state, { field: 'legalName', value: 'Atlas Group LLC' }, env(NOW, 'finance')).ok, false)

  const request = requestBusinessChange(state, { field: 'legalName', value: ' Atlas Group LLC ' }, env())
  assert.ok(request.ok)
  const task = request.ok ? request.value : null
  assert.equal(task?.status, 'waiting_review')
  assert.deepEqual(task?.change, { field: 'legalName', value: 'Atlas Group LLC' })
  assert.deepEqual(taskTarget(task!), { name: 'MaropaySettings', query: { tab: 'business' } })
  assert.equal(state.business!.legalName, before, 'nothing changes until approval')
  assert.equal(requestBusinessChange(state, { field: 'legalName', value: 'Atlas Holdings' }, env()).ok, false, 'one open request per field')
  assert.equal(deriveCapabilities(state, NOW).payments, 'enabled', 'a pending change doesn’t interrupt payments')

  assert.ok(simulateBusinessChangeOutcome(state, task!.id, true, env()).ok)
  assert.equal(state.business!.legalName, 'Atlas Group LLC')
  assert.equal(simulateBusinessChangeOutcome(state, task!.id, true, env()).ok, false, 'a decision lands once')

  const website = requestBusinessChange(state, { field: 'website', value: 'https://atlas.example' }, env())
  assert.ok(website.ok && simulateBusinessChangeOutcome(state, website.value.id, false, env()).ok)
  assert.notEqual(state.business!.website, 'https://atlas.example', 'a declined change is never applied')
})

test('public details apply straight away, validated like setup', () => {
  const state = buildScenario('m07', context())
  const details = { statementDescriptor: 'ATLAS OUTFIT', supportEmail: 'help@atlas.example', supportPhone: '+1 555 0100' }
  const bad = updatePublicDetails(state, { ...details, statementDescriptor: 'AT' }, env())
  assert.equal(!bad.ok && bad.error.code, 'invalid_input')
  assert.equal(updatePublicDetails(state, { ...details, supportEmail: 'nope' }, env()).ok, false)
  assert.equal(updatePublicDetails(state, details, env(NOW, 'store_ops', null)).ok, false)
  assert.ok(updatePublicDetails(state, { ...details, statementDescriptor: ' ATLAS OUTFIT ' }, env()).ok)
  assert.deepEqual(state.business!.publicDetails, details)
})

test('a save from the first phase reads back in the partner-shaped model, and round-trips again', () => {
  const state = buildScenario('m07', context())
  const raw = JSON.parse(JSON.stringify(state)) as Record<string, any>
  // Rewind the record to the shape the first phase persisted.
  raw.onboarding.businessType = 'sole_trader'
  raw.onboarding.business = { legalName: 'Atlas Outfitters LLC', tradingName: 'Atlas', registrationNumber: '84-2210931', website: 'https://atlas.example', address: raw.onboarding.business.address }
  raw.onboarding.representative = { name: 'Jordan Lee', title: 'Founder', email: 'jordan@atlas.example' }
  raw.onboarding.idDocument = { name: 'passport.jpg', sizeLabel: '1 MB', status: 'received' }
  raw.onboarding.payout = { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', last4: '4417', currency: 'USD' }
  delete raw.onboarding.persons; delete raw.onboarding.attestations
  raw.business = { id: raw.business.id, legalName: 'Atlas Outfitters LLC', tradingName: 'Atlas', type: 'nonprofit', country: 'US', registrationNumber: '84-2210931', address: raw.business.address, website: 'https://atlas.example', representative: { name: 'Cher', title: '', email: 'cher@atlas.example' }, publicDetails: raw.business.publicDetails }
  raw.account.rejectedReason = null; delete raw.account.declineReason; delete raw.account.declinedAt; delete raw.account.closedAt
  raw.account.payoutSchedule = { interval: 'daily', delayDays: 2 }
  const { routingNumber: _r, country: _c, holderType: _h, ...legacyDestination } = raw.account.payoutDestination
  raw.account.payoutDestination = legacyDestination
  for (const po of raw.payouts) { delete po.destination.routingNumber; delete po.destination.country; delete po.destination.holderType }
  delete raw.terms.acceptedIp; delete raw.terms.acceptedUserAgent
  for (const b of raw.bindings) { delete b.checkout; delete b.methodOrder; delete b.defaultMethodId; delete b.methodSettings; delete b.activationNoticeDismissedAt }
  for (const m of raw.methods) { delete m.requested; delete m.declineReason }
  delete raw.defaultMethodIds
  raw.tasks.push({ id: 'task_legacy', kind: 'business_change', title: 'Registration number change under review', description: '', affects: [], dueAt: null, blocking: false, role: 'owner', status: 'resolved', step: null, disputeId: null, payoutId: null, methodId: null, channelId: null, change: { field: 'registrationNumber', value: '99-1' }, createdAt: raw.updatedAt, resolvedAt: raw.updatedAt })

  const parsed = parseState(JSON.stringify(raw), state.accountId, NOW)!
  assert.equal(parsed.onboarding.businessType, 'individual')
  assert.equal(parsed.onboarding.business.taxId, '84-2210931', 'the single registration number was the tax ID')
  assert.equal(parsed.onboarding.business.registrationNumber, '')
  assert.deepEqual([parsed.onboarding.representative.firstName, parsed.onboarding.representative.lastName], ['Jordan', 'Lee'])
  assert.deepEqual(parsed.onboarding.persons, [])
  assert.deepEqual(parsed.onboarding.attestations, { owners: false, directors: false, executives: false })
  assert.equal('idDocument' in parsed.onboarding, false, 'the optional photo ID has nothing to attach to now')
  assert.equal(parsed.onboarding.payout?.routingNumber, '')
  assert.equal(parsed.onboarding.payout?.country, 'US')
  assert.equal(parsed.business?.type, 'company')
  assert.equal(parsed.business?.structure, null)
  assert.equal(parsed.business?.taxId, '84-2210931')
  assert.deepEqual([representativeOf(parsed.business!)?.firstName, representativeOf(parsed.business!)?.lastName], ['Cher', ''], 'a one-word name is a first name')
  assert.equal(parsed.account?.declineReason, null)
  assert.deepEqual(parsed.account?.payoutSchedule, DEFAULT_PAYOUT_SCHEDULE)
  assert.equal(parsed.account?.payoutDestination?.holderType, null)
  assert.equal(parsed.payouts[0]?.destination.country, 'US')
  assert.equal(parsed.terms.acceptedIp, null)
  assert.equal(parsed.bindings[0]?.checkout.payButtonLabel, 'pay')
  assert.deepEqual(parsed.bindings[0]?.methodOrder, [])
  assert.equal(parsed.methods[0]?.declineReason, null)
  assert.deepEqual(parsed.defaultMethodIds, ['card', 'apple_pay', 'google_pay'])
  assert.equal(parsed.tasks.find((t) => t.id === 'task_legacy')?.change?.field, 'taxId', 'resolved requests are remapped too')
  assert.deepEqual(parseState(JSON.stringify(parsed), state.accountId, NOW), parsed, 'a migrated save is stable')
  assert.ok(!JSON.stringify(parsed).includes('rejectedReason'))
})

test('saves from before accounts could close read back as open accounts', () => {
  const state = buildScenario('m07', context())
  const raw = JSON.parse(JSON.stringify(state)) as { account: Record<string, unknown> }
  delete raw.account.closedAt
  const parsed = parseState(JSON.stringify(raw), state.accountId, NOW)
  assert.equal(parsed?.account?.closedAt, null)
})
