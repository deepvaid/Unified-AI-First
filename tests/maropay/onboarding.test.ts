import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bankAccountErrors, blockingIssues, descriptorIssue, stepIssues, submissionIssues } from '../../src/maropay/onboarding.ts'
import type { OnboardingPatch } from '../../src/maropay/onboarding.ts'
import { deriveOverviewInstruction } from '../../src/maropay/readiness.ts'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { MOCK_CLIENT_IP, emptyPerson } from '../../src/maropay/model.ts'
import { acceptTerms, savePayoutDraft, saveOnboardingStep, submitOnboarding } from '../../src/services/maropay/mockAdapter.ts'
import { NOW, context, env } from './fixtures.ts'

/** M02: setup started, authority confirmed, terms accepted, stopped at verification. */
function inProgress() {
  return buildScenario('m02', context())
}

/** M02 with what Maropost can't know and the owner-only pieces supplied, ready to submit. */
function readyToSubmit() {
  const state = inProgress()
  state.onboarding.representative.dob = '1986-04-12'
  state.onboarding.representative.ssnLast4 = '4821'
  state.onboarding.attestations.owners = true
  state.onboarding.payout = { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', last4: '4417', routingNumber: '021000021', currency: 'USD', country: 'US', holderType: 'company' }
  return state
}

test('the prefilled draft only needs what Maropost can’t know', () => {
  const state = inProgress()
  const version = state.terms.version
  // Guards prefill drift: a new required field must be prefilled or added here deliberately.
  assert.deepEqual(stepIssues(state.onboarding, 'verify', version, NOW).map((i) => i.field), ['repDob', 'repSsnLast4', 'ownersProvided'])
  assert.deepEqual(stepIssues(state.onboarding, 'business', version, NOW), [])
  assert.deepEqual(stepIssues(state.onboarding, 'public', version, NOW), [])
  assert.deepEqual(submissionIssues(state.onboarding, version, NOW).map((i) => i.field), ['repDob', 'repSsnLast4', 'ownersProvided', 'payout'])
})

test('owner-only items stop an owner but never a finance user moving through the steps', () => {
  const state = inProgress()
  state.onboarding.authorityConfirmed = false
  const version = state.terms.version
  assert.deepEqual(blockingIssues(state.onboarding, 'business', version, 'owner').map((i) => i.field), ['authority'])
  assert.deepEqual(blockingIssues(state.onboarding, 'business', version, 'finance'), [])
  assert.deepEqual(blockingIssues(state.onboarding, 'payout', version, 'finance'), [])
})

test('the tax ID is due now for a CA company, later for a US company, never for an individual', () => {
  const state = readyToSubmit()
  state.onboarding.business.taxId = ''
  const fields = () => stepIssues(state.onboarding, 'verify', state.terms.version, NOW).map((i) => i.field)
  assert.deepEqual(fields(), [], 'a US company gives its EIN once payouts reach the partner’s threshold')
  state.onboarding.country = 'CA'
  state.onboarding.business.productDescription = 'Outdoor clothing and gear for hikers.'
  assert.ok(fields().includes('taxId'))
  state.onboarding.businessType = 'individual'
  assert.ok(!fields().includes('taxId'))
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
  const representative = { ...emptyPerson('per_rep', 'US'), firstName: 'Sam', lastName: 'Rivera', title: 'Director', email: 'sam@atlas.example' }
  const result = saveOnboardingStep(state, 'verify', { representative }, { complete: true, next: 'payout' }, env())
  assert.ok(result.ok)
  assert.equal(state.onboarding.representative.firstName, 'Sam')
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

  assert.ok(saveOnboardingStep(state, 'business', { authorityConfirmed: true, businessType: 'individual' }, {}, env(NOW, 'finance')).ok,
    'an unchanged authority flag rides along with a finance user’s edits')
  assert.equal(state.onboarding.businessType, 'individual')
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

test('a complete draft submits whatever the wizard recorded as visited — and always goes under review', () => {
  const state = readyToSubmit()
  assert.deepEqual(state.onboarding.completedSteps, ['business', 'terms'])
  const result = submitOnboarding(state, env())
  assert.ok(result.ok)
  assert.equal(result.value.outcome, 'under_review')
  assert.equal(state.account?.verification, 'under_review')
  assert.equal(state.account?.verifiedAt, null, 'submission is never approval')
  assert.equal(state.tasks.filter((t) => t.status !== 'resolved').length, 0, 'nothing is asked of the merchant at submit')
  assert.equal(deriveOverviewInstruction(state, NOW).key, 'under_review')
  assert.equal(state.business?.legalName, state.onboarding.business.legalName)
  const late = saveOnboardingStep(state, 'public', { businessType: 'company' }, {}, env())
  assert.equal(!late.ok && late.error.code, 'invalid_input', 'a submitted setup is no longer a draft')
})

test('reusing verified details is recorded on the account and still goes to review', () => {
  const state = readyToSubmit()
  state.onboarding.reuseVerifiedDetails = true
  const result = submitOnboarding(state, env())
  assert.ok(result.ok)
  assert.equal(result.value.outcome, 'under_review')
  assert.equal(state.account?.reusedVerifiedDetails, true)
})

test('terms are recorded on Continue with the date, IP and browser — owner only, once per version', () => {
  const state = inProgress()
  state.onboarding.termsAcceptedVersion = null
  state.terms.acceptedAt = null
  assert.equal(acceptTerms(state, { userAgent: 'x' }, env(NOW, 'finance')).ok, false)
  assert.ok(acceptTerms(state, { userAgent: 'Mozilla/5.0 test' }, env()).ok)
  assert.equal(state.onboarding.termsAcceptedVersion, state.terms.version)
  assert.equal(state.terms.acceptedIp, MOCK_CLIENT_IP)
  assert.equal(state.terms.acceptedUserAgent, 'Mozilla/5.0 test')
  const history = state.history.length
  assert.ok(acceptTerms(state, { userAgent: 'other' }, env(NOW + 1000)).ok)
  assert.equal(state.history.length, history, 'accepting the same version again records nothing')
})

test('the payout draft keeps the last four digits and the routing number, never the account number', () => {
  const state = inProgress()
  state.onboarding.payout = null
  const input = { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', bankCode: '021 000 021', accountNumber: '9876544417', confirmAccountNumber: '9876544417' }
  assert.equal(savePayoutDraft(state, input, env(NOW, 'finance')).ok, false)
  const bad = savePayoutDraft(state, { ...input, confirmAccountNumber: '1' }, env())
  assert.equal(!bad.ok && bad.error.code, 'invalid_input')
  assert.ok(savePayoutDraft(state, input, env()).ok)
  assert.deepEqual(state.onboarding.payout, { holderName: 'Atlas Outfitters LLC', bankName: 'Mercury Bank', last4: '4417', routingNumber: '021000021', currency: 'USD', country: 'US', holderType: 'company' })
  assert.ok(!JSON.stringify(state).includes('9876544417'))
})

test('a finance user can list people but not confirm them; a full SSN is refused', () => {
  const state = inProgress()
  const finance = env(NOW, 'finance')
  const person = { ...emptyPerson('per_1', 'US'), firstName: 'Sam', lastName: 'Rivera', roles: { owner: true, director: false, executive: false }, percentOwnership: 30 }
  assert.ok(saveOnboardingStep(state, 'verify', { persons: [person] }, {}, finance).ok)
  const confirm = saveOnboardingStep(state, 'verify', { attestations: { owners: true, directors: false, executives: false } }, {}, finance)
  assert.equal(!confirm.ok && confirm.error.code, 'permission_denied')
  assert.ok(saveOnboardingStep(state, 'verify', { attestations: { owners: true, directors: false, executives: false } }, {}, env()).ok)
  const full = saveOnboardingStep(state, 'verify', { representative: { ...state.onboarding.representative, ssnLast4: '123456789' } }, {}, env())
  assert.equal(!full.ok && full.error.code, 'invalid_input')
  assert.equal(state.onboarding.representative.ssnLast4, null, 'nothing was stored')
})

test('the settlement currency follows the registration country', () => {
  const state = inProgress()
  assert.ok(saveOnboardingStep(state, 'business', { country: 'CA' }, {}, env()).ok)
  assert.equal(state.account?.currency, 'CAD')
  assert.equal(state.terms.disputeFee.currency, 'CAD')
  assert.ok(state.methods.every((m) => m.currencies.includes('CAD') || m.availability === 'unavailable'))
  state.onboarding.payout = { holderName: 'x', bankName: 'y', last4: '1234', routingNumber: '021000021', currency: 'USD', country: 'US', holderType: 'company' }
  assert.ok(stepIssues(state.onboarding, 'payout', state.terms.version, NOW).some((i) => i.field === 'payoutCurrency'))
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
