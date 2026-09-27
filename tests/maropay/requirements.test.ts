import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyOnboarding, emptyPerson } from '../../src/maropay/model.ts'
import type { BusinessType, OnboardingDraft, SupportedCountry } from '../../src/maropay/model.ts'
import {
  MOCK_ERRORS, deriveRequirements, missingKeys, partnerBusinessType, partnerChecklist, providedKeys, requirementField, requirementForm, rulesFor, taxIdIssue,
} from '../../src/maropay/requirements.ts'
import { personIssues, stepIssues, submissionIssues } from '../../src/maropay/onboarding.ts'
import { dobIssue, normaliseWebsite, postalCodeIssue, websiteIssue } from '../../src/maropay/validation.ts'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { NOW, context } from './fixtures.ts'

const COUNTRIES: SupportedCountry[] = ['US', 'CA', 'AU', 'NZ', 'GB']
const TERMS = '2026-09-illustrative'

function draftFor(country: string, businessType: BusinessType, structure: OnboardingDraft['business']['structure'] = null): OnboardingDraft {
  const draft = emptyOnboarding()
  draft.country = country
  draft.businessType = businessType
  draft.business.structure = structure
  draft.business.address.country = country
  draft.representative = emptyPerson('per_rep', country)
  return draft
}

test('the rules table follows the partner’s per-country sets', () => {
  for (const country of COUNTRIES) {
    for (const type of ['company', 'individual'] as BusinessType[]) {
      const rules = rulesFor(country, type, type === 'company' ? 'private_corporation' : null)
      const keys = [...rules.fields]
      const hasState = keys.some((k) => k.endsWith('.address.state'))
      assert.equal(hasState, country !== 'NZ' && country !== 'GB', `${country} ${type} address.state`)
      assert.equal(keys.includes('company.registration_number'), country === 'AU' && type === 'company', `${country} ${type} ACN`)
      assert.equal(keys.includes('settings.payments.statement_descriptor'), country === 'US', `${country} ${type} descriptor is a partner key for US only`)
      assert.equal(keys.includes('external_account'), true)
      assert.equal(keys.includes('business_profile.mcc'), true)
      if (type === 'company') {
        assert.equal(keys.includes('company.tax_id'), country !== 'US', `${country} tax id due now`)
        assert.equal(rules.dueLater.some((d) => d.key === 'company.tax_id'), country === 'US', `${country} tax id due later`)
      }
    }
  }
  assert.ok(rulesFor('CA', 'company', 'private_corporation').fields.has('business_profile.product_description'))
  assert.ok(rulesFor('CA', 'individual', null).fields.has('business_profile.product_description'))
  assert.ok(rulesFor('CA', 'company', 'private_corporation').dueLater.length > 0, 'a non-US setup has later requirements too')
  assert.ok(!rulesFor('CA', 'individual', null).fields.has('individual.email'), 'CA asks for the individual’s email later')
  assert.deepEqual(rulesFor('US', 'company', 'private_corporation').personRoles.map((r) => r.role), ['owner'])
  assert.deepEqual(rulesFor('CA', 'company', 'private_corporation').personRoles.map((r) => r.role), ['owner', 'director'])
  assert.deepEqual(rulesFor('GB', 'company', 'private_corporation').personRoles.map((r) => r.role), ['owner', 'director'])
  assert.deepEqual(rulesFor('AU', 'company', 'private_corporation').personRoles.map((r) => r.role), ['owner', 'director', 'executive'])
  assert.deepEqual(rulesFor('NZ', 'company', 'private_corporation').personRoles.map((r) => r.role), ['owner', 'director', 'executive'])
  assert.deepEqual(rulesFor('US', 'individual', null).personRoles, [])
  assert.equal(rulesFor('US', 'company', 'private_corporation').alternatives.length, 1)
  assert.equal(rulesFor('US', 'individual', null).alternatives.length, 1)
  assert.equal(rulesFor('CA', 'company', 'private_corporation').alternatives.length, 0)
  assert.equal(rulesFor('BR', 'company', null).fields.size, 0, 'an unsupported country has no partner rules')
})

test('public and non-profit structures have no beneficial owners to list', () => {
  for (const [country, structure] of [['US', 'public_corporation'], ['US', 'incorporated_non_profit'], ['GB', 'unincorporated_non_profit'], ['CA', 'registered_charity']] as const) {
    const rules = rulesFor(country, 'company', structure)
    assert.ok(![...rules.fields].some((k) => k.startsWith('owners.')), `${country} ${structure} owners`)
    assert.ok(!rules.fields.has('company.owners_provided'), `${country} ${structure} owners_provided`)
  }
  assert.ok(rulesFor('GB', 'company', 'incorporated_non_profit').fields.has('company.directors_provided'), 'directors are still asked for')
  assert.equal(partnerBusinessType('GB', 'company', 'incorporated_non_profit'), 'non_profit')
  assert.equal(partnerBusinessType('GB', 'company', 'private_corporation'), 'company')
  assert.equal(partnerBusinessType('US', 'individual', null), 'individual')
})

test('an empty GB company draft is asked for a Company number and no county', () => {
  const draft = draftFor('GB', 'company', 'private_corporation')
  draft.authorityConfirmed = true
  const verify = stepIssues(draft, 'verify', TERMS, NOW)
  const fields = verify.map((i) => i.field)
  assert.ok(fields.includes('taxId'))
  assert.equal(verify.find((i) => i.field === 'taxId')?.message, 'Enter the Company number.')
  assert.ok(!fields.includes('region'), 'GB addresses have no state')
  assert.ok(!fields.includes('repRegion'))
  assert.ok(!fields.includes('repSsnLast4'), 'SSN last 4 is a US field')
  assert.ok(fields.includes('ownersProvided') && fields.includes('directorsProvided'))
  assert.ok(!fields.includes('executivesProvided'))
  assert.ok(verify.filter((i) => i.field === 'repDob').length === 1, 'three dob keys read as one issue')
  const business = stepIssues(draft, 'business', TERMS, NOW).map((i) => i.field)
  assert.deepEqual(business, ['industry', 'website', 'phone'])
})

test('the US website alternative: a product description satisfies the URL, but not in Canada', () => {
  const us = draftFor('US', 'company', 'private_corporation')
  us.business.noWebsite = true
  us.business.productDescription = 'Outdoor clothing and gear for hikers.'
  assert.ok(providedKeys(us, TERMS, NOW).has('business_profile.url'))
  us.business.productDescription = 'short'
  assert.ok(!providedKeys(us, TERMS, NOW).has('business_profile.url'))
  assert.match(stepIssues(us, 'business', TERMS, NOW).find((i) => i.field === 'website')?.message ?? '', /describe what you sell instead/)

  const ca = draftFor('CA', 'company', 'private_corporation')
  ca.business.noWebsite = true
  ca.business.productDescription = 'Outdoor clothing and gear for hikers.'
  assert.ok(!providedKeys(ca, TERMS, NOW).has('business_profile.url'))
})

test('a US payout account needs its routing number before external_account counts as provided', () => {
  const draft = draftFor('US', 'individual')
  draft.payout = { holderName: 'Jordan Lee', bankName: 'Mercury', last4: '4417', routingNumber: '', currency: 'USD', country: 'US', holderType: 'individual' }
  assert.ok(!providedKeys(draft, TERMS, NOW).has('external_account'))
  draft.payout.routingNumber = '021000021'
  assert.ok(providedKeys(draft, TERMS, NOW).has('external_account'))
  draft.country = 'GB'
  draft.payout.routingNumber = ''
  draft.payout.currency = 'GBP'
  assert.ok(providedKeys(draft, TERMS, NOW).has('external_account'), 'only the US requires the routing number')
})

test('individual setups skip the legal name, tax ID, business phone and the people list', () => {
  const draft = draftFor('US', 'individual')
  draft.authorityConfirmed = true
  const fields = submissionIssues(draft, TERMS, NOW).map((i) => i.field)
  for (const absent of ['legalName', 'taxId', 'phone', 'persons', 'ownersProvided', 'structure']) assert.ok(!fields.includes(absent as never), `${absent} not asked`)
  for (const present of ['repFirstName', 'repDob', 'repSsnLast4', 'repAddressLine1', 'industry', 'website', 'terms', 'payout', 'statementDescriptor']) assert.ok(fields.includes(present as never), `${present} asked`)
})

test('validators normalise and explain', () => {
  const us = rulesFor('US', 'company', 'private_corporation')
  assert.equal(taxIdIssue('12-3456789', us), null)
  assert.equal(taxIdIssue('12 3456789', us), null)
  assert.match(taxIdIssue('1234', us) ?? '', /9-digit EIN/)
  assert.equal(taxIdIssue('12 345 678 901', rulesFor('AU', 'company', 'private_corporation')), null)
  assert.equal(taxIdIssue('AB123456', rulesFor('GB', 'company', 'private_corporation')), null)
  assert.equal(normaliseWebsite('atlas.example'), 'https://atlas.example')
  assert.equal(websiteIssue('atlas.example'), null)
  assert.match(websiteIssue('not a site') ?? '', /full website address/)
  assert.equal(postalCodeIssue('94103', 'US'), null)
  assert.equal(postalCodeIssue('SW1A 1AA', 'GB'), null)
  assert.match(postalCodeIssue('9410', 'US') ?? '', /like 94103/)
  assert.equal(dobIssue('1986-04-12', NOW), null)
  assert.match(dobIssue('2015-01-01', NOW) ?? '', /at least 18/)
  assert.match(dobIssue('2015-01-01', NOW, 13) ?? '', /between 13 and 120/)
  assert.equal(dobIssue('2015-01-01', NOW, 13, 120), 'They must be between 13 and 120 years old.')
})

test('people carry only the fields their roles require, and ownership can’t exceed 100%', () => {
  const au = rulesFor('AU', 'company', 'private_corporation')
  const owner = { ...emptyPerson('per_1', 'AU'), firstName: 'Mia', lastName: 'Chen', email: 'mia@atlas.example', roles: { owner: true, director: false, executive: false } }
  const missing = personIssues(owner, au.personRoles, au, NOW).map((i) => i.field)
  assert.deepEqual(missing, ['dob', 'address', 'title', 'percentOwnership'])
  const director = { ...owner, roles: { owner: false, director: true, executive: false }, dob: '1980-02-02', title: 'Director' }
  assert.deepEqual(personIssues(director, au.personRoles, au, NOW), [], 'a director needs no address or ownership')

  const draft = draftFor('AU', 'company', 'private_corporation')
  draft.representative.roles.owner = true
  draft.representative.percentOwnership = 60
  draft.persons = [{ ...owner, dob: '1980-02-02', title: 'Partner', percentOwnership: 50, address: { line1: '1 George St', city: 'Sydney', region: 'NSW', postalCode: '2000', country: 'AU' } }]
  const fields = stepIssues(draft, 'verify', TERMS, NOW).map((i) => i.field)
  assert.ok(fields.includes('repOwnership'))
  assert.ok(!fields.includes('persons'), 'the listed owner is complete')
  draft.persons[0]!.dob = ''
  const issue = stepIssues(draft, 'verify', TERMS, NOW).find((i) => i.field === 'persons')
  assert.equal(issue?.personId, 'per_1')
})

test('a payout account in the wrong currency is an issue for the owner', () => {
  const draft = buildScenario('m02', context()).onboarding
  draft.country = 'CA'
  draft.payout = { holderName: 'Atlas', bankName: 'Mercury', last4: '4417', routingNumber: '', currency: 'USD', country: 'US', holderType: 'company' }
  const issue = stepIssues(draft, 'payout', TERMS, NOW).find((i) => i.field === 'payoutCurrency')
  assert.match(issue?.message ?? '', /paid in CAD/)
  assert.equal(issue?.ownerOnly, true)
})

test('requirement keys map to wizard fields and forms', () => {
  assert.equal(requirementField('representative.dob.month').field, 'repDob')
  assert.equal(requirementField('individual.ssn_last_4').field, 'repSsnLast4')
  assert.equal(requirementField('owners.address.city').field, 'persons')
  assert.equal(requirementField('company.owners_provided').ownerOnly, true)
  const us = rulesFor('US', 'company', 'private_corporation')
  assert.equal(requirementForm('representative.verification.document', us).kind, 'documents')
  assert.equal((requirementForm('representative.verification.document', us) as { sides: string }).sides, 'front_back')
  assert.equal((requirementForm('company.verification.document', us) as { sides: string }).sides, 'single')
  assert.equal((requirementForm('representative.verification.additional_document', us) as { label: string }).label, 'Proof of address')
  assert.equal((requirementForm('company.tax_id', us) as { label: string }).label, 'EIN')
  assert.equal(requirementForm('external_account', us).kind, 'confirm')
  assert.equal(requirementForm(undefined, us).kind, 'documents', 'older tasks render the photo ID form')
  assert.equal(MOCK_ERRORS.identity_unverified.requirement(rulesFor('US', 'individual', null)), 'individual.verification.document')
  assert.equal(MOCK_ERRORS.name_mismatch.requirement(us), 'company.tax_id')
  assert.deepEqual(MOCK_ERRORS.name_mismatch.alternative, ['company.verification.document'])
})

test('deriveRequirements before submission lists what the draft is missing and what comes later', () => {
  const m02 = buildScenario('m02', context())
  const view = deriveRequirements(m02, NOW)
  assert.deepEqual(view.currentlyDue, missingKeys(m02.onboarding, m02.terms.version, NOW))
  assert.ok(view.currentlyDue.includes('representative.ssn_last_4'))
  assert.ok(view.currentlyDue.includes('external_account'))
  assert.deepEqual(view.eventuallyDue, [], 'the prefilled EIN is already on file')
  m02.onboarding.business.taxId = ''
  assert.deepEqual(deriveRequirements(m02, NOW).eventuallyDue.map((d) => d.key), ['company.tax_id'])
  assert.equal(view.disabledReason, 'requirements.past_due')
  const live = deriveRequirements(buildScenario('m10', context()), NOW)
  assert.deepEqual(live.currentlyDue, [])
  assert.deepEqual(live.pastDue, [])
  assert.equal(live.currentDeadline, null)
  assert.equal(live.disabledReason, null)
  assert.deepEqual(live.eventuallyDue, [], 'a live US company whose EIN is on file owes nothing later')
  const noEin = buildScenario('m10', context())
  noEin.onboarding.business.taxId = ''
  assert.deepEqual(deriveRequirements(noEin, NOW).eventuallyDue.map((d) => d.key), ['company.tax_id'], 'without it, the EIN is due later')
  assert.deepEqual(deriveRequirements(buildScenario('m01', context()), NOW).currentlyDue, [])
})

test('the review step’s partner checklist groups what is due now and later', () => {
  const m02 = buildScenario('m02', context())
  const rules = rulesFor(m02.onboarding.country, m02.onboarding.businessType, m02.onboarding.business.structure)
  const checklist = partnerChecklist(m02.onboarding, rules, m02.terms.version, NOW)
  assert.deepEqual(checklist.dueNow.map((i) => i.key), ['identity', 'representative', 'people', 'terms', 'payout', 'descriptor'])
  assert.equal(checklist.dueNow.find((i) => i.key === 'terms')?.complete, true)
  assert.equal(checklist.dueNow.find((i) => i.key === 'representative')?.complete, false)
  assert.deepEqual(checklist.dueLater.map((i) => i.title), ['EIN'])
  const gb = partnerChecklist(draftFor('GB', 'company', 'private_corporation'), rulesFor('GB', 'company', 'private_corporation'), TERMS, NOW)
  assert.ok(!gb.dueNow.some((i) => i.key === 'descriptor'), 'the descriptor is not a partner item outside the US')
})
