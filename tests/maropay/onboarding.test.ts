import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bankAccountErrors, blockingIssues, descriptorIssue, stepIssues, submissionIssues } from '../../src/maropay/onboarding.ts'
import type { OnboardingPatch } from '../../src/maropay/onboarding.ts'
import { deriveOverviewInstruction } from '../../src/maropay/readiness.ts'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { saveOnboardingStep, submitOnboarding } from '../../src/services/maropay/mockAdapter.ts'
import { NOW, context, env } from './fixtures.ts'

/** M02: setup started, authority confirmed, terms accepted, stopped at verification. */
function inProgress() {
  return buildScenario('m02', context())
}

/** M02 with the owner-only pieces supplied, ready to submit. */
function readyToSubmit() {
  const state = inProgress()
  state.onboarding.payout = { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', last4: '4417', currency: 'USD' }
  state.onboarding.idDocument = { name: 'passport.jpg', sizeLabel: '1.2 MB', status: 'received' }
  return state
}

test('the prefilled draft only needs what Maropost can’t know', () => {
  const state = inProgress()
  const version = state.terms.version
  assert.deepEqual(stepIssues(state.onboarding, 'verify', version), [])
  assert.deepEqual(stepIssues(state.onboarding, 'public', version), [])
  assert.deepEqual(submissionIssues(state.onboarding, version).map((i) => i.field), ['payout'])
})

test('owner-only items stop an owner but never a finance user moving through the steps', () => {
  const state = inProgress()
  state.onboarding.authorityConfirmed = false
  const version = state.terms.version
  assert.deepEqual(blockingIssues(state.onboarding, 'business', version, 'owner').map((i) => i.field), ['authority'])
  assert.deepEqual(blockingIssues(state.onboarding, 'business', version, 'finance'), [])
  assert.deepEqual(blockingIssues(state.onboarding, 'payout', version, 'finance'), [])
})

test('registration numbers are required for companies and non-profits, not sole traders', () => {
  const state = inProgress()
  state.onboarding.business.registrationNumber = ''
  const fields = () => stepIssues(state.onboarding, 'verify', state.terms.version).map((i) => i.field)
  assert.deepEqual(fields(), ['registrationNumber'])
  state.onboarding.businessType = 'sole_trader'
  assert.deepEqual(fields(), [])
})

test('statement descriptors follow the card-network rules', () => {
  assert.equal(descriptorIssue('ATLAS OUTFITTERS'), null)
  assert.match(descriptorIssue('ABC') ?? '', /at least 5/)
  assert.match(descriptorIssue('A'.repeat(23)) ?? '', /22 characters/)
  assert.match(descriptorIssue('ATLAS*SHOP') ?? '', /letters, numbers/)
  assert.match(descriptorIssue('12345') ?? '', /one letter/)
})

test('choosing an unsupported country makes Maropay unavailable until it is corrected', () => {
  const state = inProgress()
  assert.ok(saveOnboardingStep(state, 'business', { country: 'BR' }, {}, env()).ok)
  assert.equal(state.account?.eligibility, 'unsupported')
  assert.equal(state.onboarding.business.address.country, 'BR', 'the registered address follows the registration country')
  const unavailable = deriveOverviewInstruction(state, NOW)
  assert.equal(unavailable.key, 'unavailable')
  assert.equal(unavailable.action?.target.name, 'MaropaySetup', 'a draft answer can still be changed')

  assert.ok(saveOnboardingStep(state, 'business', { country: 'US' }, {}, env()).ok)
  assert.equal(state.account?.eligibility, 'eligible')
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'finish_setup')
})

test('saving a step records progress and where setup resumes', () => {
  const state = inProgress()
  const result = saveOnboardingStep(state, 'verify', { representative: { name: 'Sam Rivera', title: 'Director', email: 'sam@atlas.example' } }, { complete: true, next: 'payout' }, env())
  assert.ok(result.ok)
  assert.equal(state.onboarding.representative.name, 'Sam Rivera')
  assert.ok(state.onboarding.completedSteps.includes('verify'))
  assert.equal(state.onboarding.lastStep, 'payout')
})

test('draft saves can’t carry terms or payout details, and respect roles', () => {
  const state = inProgress()
  const smuggled = { termsAcceptedVersion: 'x' } as unknown as OnboardingPatch
  const refused = saveOnboardingStep(state, 'terms', smuggled, {}, env())
  assert.equal(!refused.ok && refused.error.code, 'invalid_input')

  const staff = saveOnboardingStep(state, 'business', { businessType: 'company' }, {}, env(NOW, 'store_ops'))
  assert.equal(!staff.ok && staff.error.code, 'permission_denied')

  const authority = saveOnboardingStep(state, 'business', { authorityConfirmed: false }, {}, env(NOW, 'finance'))
  assert.equal(!authority.ok && authority.error.code, 'permission_denied', 'only an owner can change authority')
  assert.equal(state.onboarding.authorityConfirmed, true)

  assert.ok(saveOnboardingStep(state, 'business', { authorityConfirmed: true, businessType: 'nonprofit' }, {}, env(NOW, 'finance')).ok,
    'an unchanged authority flag rides along with a finance user’s edits')
  assert.equal(state.onboarding.businessType, 'nonprofit')
})

test('submission checks the content, not the progress markers', () => {
  const state = readyToSubmit()
  state.onboarding.completedSteps = ['business', 'terms', 'verify', 'payout', 'public']
  state.onboarding.business.legalName = '  '
  const result = submitOnboarding(state, env())
  assert.equal(!result.ok && result.error.code, 'requirement_pending')
  assert.equal(!result.ok && result.error.message, 'Enter the legal business name.')
  assert.equal(state.account?.setup, 'in_progress')
})

test('a complete draft submits whatever the wizard recorded as visited', () => {
  const state = readyToSubmit()
  assert.deepEqual(state.onboarding.completedSteps, ['business', 'terms'])
  const result = submitOnboarding(state, env())
  assert.ok(result.ok)
  assert.equal(result.value.outcome, 'verified')
  assert.equal(state.business?.legalName, state.onboarding.business.legalName)
  const late = saveOnboardingStep(state, 'public', { businessType: 'company' }, {}, env())
  assert.equal(!late.ok && late.error.code, 'invalid_input', 'a submitted setup is no longer a draft')
})

test('reusing verified details skips the ID request and is recorded on the account', () => {
  const state = readyToSubmit()
  state.onboarding.idDocument = null
  state.onboarding.reuseVerifiedDetails = true
  const result = submitOnboarding(state, env())
  assert.ok(result.ok)
  assert.equal(result.value.outcome, 'verified')
  assert.equal(state.account?.reusedVerifiedDetails, true)
})

test('submitting resolves the owner-review request a teammate raised', () => {
  const state = readyToSubmit()
  state.tasks.push({
    id: 'task_owner', kind: 'owner_review', title: 'Review and submit Maropay setup', description: '', affects: [], dueAt: null,
    blocking: false, role: 'owner', status: 'open', step: 'terms', disputeId: null, payoutId: null, methodId: null, channelId: null,
    createdAt: new Date(NOW).toISOString(), resolvedAt: null,
  })
  assert.ok(submitOnboarding(state, env()).ok)
  assert.equal(state.tasks.find((t) => t.id === 'task_owner')?.status, 'resolved')
})

test('bank account details are checked against the country’s bank code format', () => {
  const good = { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', bankCode: '021 000 021', accountNumber: '9876544417', confirmAccountNumber: '9876544417' }
  assert.deepEqual(bankAccountErrors(good, 'US'), {})
  assert.match(bankAccountErrors(good, 'AU').bankCode ?? '', /6-digit BSB/)
  assert.match(bankAccountErrors({ ...good, confirmAccountNumber: '9876544418' }, 'US').confirmAccountNumber ?? '', /don’t match/)
  assert.match(bankAccountErrors({ ...good, accountNumber: '12' }, 'US').accountNumber ?? '', /4 to 17 digits/)
})
