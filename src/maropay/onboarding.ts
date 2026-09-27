/**
 * Maropay setup rules — what each wizard step needs before the merchant moves
 * on, and what must be true before setup can be submitted.
 *
 * The partner's requirements come from requirements.ts (one rule source); this
 * module turns the keys a draft is missing into field-level issues, adds the
 * few things Maropost itself needs (authority, a support email, a payout
 * account in the right currency), and de-duplicates by field so three
 * date-of-birth keys read as one message.
 *
 * The same rules run in the wizard (to guide) and in the mock adapter (to
 * refuse), so the "server" never trusts the interface. Owner-only items —
 * authority, terms, the people attestations, payout account — never stop a
 * finance user moving through the steps; they stop submission, which is the
 * owner's call.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { SUPPORTED_COUNTRIES, currencyFor } from './model.ts'
import type { MaropayActingRole, OnboardingDraft, OnboardingStepKey, Person, RequirementKey } from './model.ts'
import {
  missingKeys,
  registrationNumberIssue,
  requirementField,
  rulesForDraft,
  taxIdIssue,
} from './requirements.ts'
import type { OnboardingRules, PersonRoleRules, SetupField } from './requirements.ts'
import {
  blank,
  countryLabel,
  descriptorIssue,
  dobIssue,
  isEmail,
  phoneIssue,
  postalCodeIssue,
  productDescriptionIssue,
  ssnLast4Issue,
  websiteIssue,
} from './validation.ts'

export { countryLabel, descriptorIssue, isEmail } from './validation.ts'
export type { SetupField } from './requirements.ts'

/** Draft fields the wizard saves as it goes. Terms and the payout account have their own owner-only actions. */
export const EDITABLE_DRAFT_FIELDS = [
  'authorityConfirmed', 'businessChoice', 'reuseVerifiedDetails', 'country', 'businessType', 'channelIds',
  'business', 'representative', 'persons', 'attestations', 'publicDetails',
] as const satisfies ReadonlyArray<keyof OnboardingDraft>

export type EditableDraftField = typeof EDITABLE_DRAFT_FIELDS[number]
export type OnboardingPatch = Partial<Pick<OnboardingDraft, EditableDraftField>>

export interface SetupIssue {
  step: OnboardingStepKey
  field: SetupField
  message: string
  /** Only the business owner or an authorised representative can resolve it. */
  ownerOnly: boolean
  /** The partner key behind it, or null for a Maropost-only rule. */
  requirement: RequirementKey | null
  /** The person a `persons` issue is about. */
  personId?: string
}

// ── People ────────────────────────────────────────────────────────────────

export interface PersonIssue {
  field: 'firstName' | 'lastName' | 'email' | 'phone' | 'dob' | 'address' | 'title' | 'percentOwnership'
  message: string
}

/** What one owner, director or executive still needs, given the roles they hold. */
export function personIssues(person: Person, roles: PersonRoleRules[], rules: OnboardingRules, nowMs: number): PersonIssue[] {
  const out: PersonIssue[] = []
  const add = (field: PersonIssue['field'], message: string | null) => { if (message && !out.some((i) => i.field === field)) out.push({ field, message }) }
  if (blank(person.firstName)) add('firstName', 'Enter the first name.')
  if (blank(person.lastName)) add('lastName', 'Enter the last name.')
  const held = roles.filter((r) => person.roles[r.role])
  if (!held.length) add('percentOwnership', 'Choose at least one role.')
  const fields = new Set(held.flatMap((r) => r.fields))
  if (fields.has('email') && !isEmail(person.email)) add('email', 'Enter an email address like name@example.com.')
  if (fields.has('phone')) add('phone', phoneIssue(person.phone))
  if (fields.has('dob')) add('dob', dobIssue(person.dob, nowMs, 13))
  if (fields.has('address')) {
    const a = person.address
    if (blank(a.line1) || blank(a.city) || (rules.usesRegion && blank(a.region))) add('address', 'Enter the full home address.')
    else add('address', postalCodeIssue(a.postalCode, rules.country))
  }
  if (fields.has('title') && blank(person.title)) add('title', 'Enter the job title.')
  if (fields.has('percentOwnership') && (person.percentOwnership === null || person.percentOwnership <= 0 || person.percentOwnership > 100)) add('percentOwnership', 'Enter the ownership percentage.')
  return out
}

/** Ownership across the representative and the people list — the partner's owners hold 25% or more each. */
export function ownershipTotal(draft: OnboardingDraft): number {
  const people = [draft.representative, ...draft.persons]
  return people.filter((p) => p.roles.owner).reduce((total, p) => total + (p.percentOwnership ?? 0), 0)
}

// ── Step issues ───────────────────────────────────────────────────────────

/** A field's message from its validator when the value is present but wrong, else the rule's generic line. */
function detailedMessage(field: SetupField, draft: OnboardingDraft, rules: OnboardingRules, nowMs: number, generic: string): string {
  const b = draft.business
  const rep = draft.representative
  const pick = (issue: string | null) => issue ?? generic
  switch (field) {
    case 'website': return pick(blank(b.website) || b.noWebsite ? null : websiteIssue(b.website))
    case 'productDescription': return pick(productDescriptionIssue(b.productDescription))
    case 'phone': return pick(blank(b.phone) ? null : phoneIssue(b.phone))
    case 'taxId': return pick(taxIdIssue(b.taxId, rules))
    case 'registrationNumber': return pick(registrationNumberIssue(b.registrationNumber, rules))
    case 'postalCode': return pick(blank(b.address.postalCode) ? null : postalCodeIssue(b.address.postalCode, rules.country))
    case 'repPhone': return pick(blank(rep.phone) ? null : phoneIssue(rep.phone))
    case 'repDob': return pick(dobIssue(rep.dob, nowMs, 18))
    case 'repPostalCode': return pick(blank(rep.address.postalCode) ? null : postalCodeIssue(rep.address.postalCode, rules.country))
    case 'repSsnLast4': return pick(ssnLast4Issue(rep.ssnLast4))
    case 'statementDescriptor': return pick(descriptorIssue(draft.publicDetails.statementDescriptor))
    default: return generic
  }
}

/** Everything a step still needs, owner-only items included. `nowMs` dates the age checks. */
export function stepIssues(draft: OnboardingDraft, step: OnboardingStepKey, termsVersion: string, nowMs: number = Date.now()): SetupIssue[] {
  const out: SetupIssue[] = []
  const seen = new Set<SetupField>()
  const add = (field: SetupField, message: string, ownerOnly = false, requirement: RequirementKey | null = null, personId?: string) => {
    if (seen.has(field)) return
    seen.add(field)
    out.push({ step, field, message, ownerOnly, requirement, ...(personId ? { personId } : {}) })
  }
  const rules = rulesForDraft(draft)

  // Maropost's own gates come first, so the partner's keys read against a valid setup.
  if (step === 'business') {
    if (!draft.authorityConfirmed) add('authority', 'Confirm you own the business or are authorised to act for it.', true)
    if (!SUPPORTED_COUNTRIES.includes(draft.country)) add('country', `Maropay isn’t available for businesses registered in ${countryLabel(draft.country)} yet.`)
    if (!draft.businessType) add('businessType', 'Choose the business type.')
    else if (draft.businessType === 'company' && rules.structures.length && !draft.business.structure) add('structure', 'Choose the business structure.')
  }

  // The partner's keys that live on this step, one issue per field.
  for (const key of missingKeys(draft, termsVersion, nowMs, rules)) {
    const spec = requirementField(key)
    if (spec.step !== step) continue
    if (spec.field === 'persons') {
      const person = draft.persons.find((p) => personIssues(p, rules.personRoles, rules, nowMs).length > 0)
      add('persons', spec.message(rules), false, key, person?.id)
      continue
    }
    add(spec.field, detailedMessage(spec.field, draft, rules, nowMs, spec.message(rules)), spec.ownerOnly, key)
  }

  if (step === 'verify') {
    if (ownershipTotal(draft) > 100) add('repOwnership', 'Ownership adds up to more than 100%.')
    const incomplete = draft.persons.find((p) => personIssues(p, rules.personRoles, rules, nowMs).length > 0)
    if (incomplete) add('persons', 'Complete the details of everyone you’ve added.', false, null, incomplete.id)
  }

  if (step === 'payout') {
    if (!draft.payout) add('payout', 'Add the bank account payouts go to.', true, 'external_account')
    else if (draft.payout.currency !== currencyFor(draft.country)) {
      const expected = currencyFor(draft.country)
      add('payoutCurrency', `Your payout account is in ${draft.payout.currency}, but a business registered in ${countryLabel(draft.country)} is paid in ${expected}. Add a ${expected} account.`, true)
    }
  }

  if (step === 'public') {
    // The descriptor is a partner key for US setups only, but shoppers see it everywhere.
    const descriptor = descriptorIssue(draft.publicDetails.statementDescriptor)
    if (descriptor) add('statementDescriptor', descriptor)
    if (!isEmail(draft.publicDetails.supportEmail)) add('supportEmail', 'Enter a support email like help@example.com.')
  }
  return out
}

/** What stops this role leaving a step forward. Owner-only items never stop anyone else. */
export function blockingIssues(draft: OnboardingDraft, step: OnboardingStepKey, termsVersion: string, role: MaropayActingRole, nowMs: number = Date.now()): SetupIssue[] {
  return stepIssues(draft, step, termsVersion, nowMs).filter((i) => role === 'owner' || !i.ownerOnly)
}

const STEPS_BEFORE_REVIEW: OnboardingStepKey[] = ['business', 'terms', 'verify', 'payout', 'public']

/** Everything between this draft and submission, in step order. */
export function submissionIssues(draft: OnboardingDraft, termsVersion: string, nowMs: number = Date.now()): SetupIssue[] {
  return STEPS_BEFORE_REVIEW.flatMap((step) => stepIssues(draft, step, termsVersion, nowMs))
}

// ── Payout bank account ───────────────────────────────────────────────────
// Shared by setup and by changing the account later. The account number is
// validated here and never stored: the store keeps the last four digits and
// the routing number.

export interface BankCodeFormat {
  label: string
  /** The code as it reads mid-sentence ("the 9-digit routing number"). */
  noun: string
  length: number
}

export const BANK_CODES: Record<string, BankCodeFormat> = {
  US: { label: 'Routing number', noun: 'routing number', length: 9 },
  CA: { label: 'Transit and institution number', noun: 'transit and institution number', length: 8 },
  AU: { label: 'BSB', noun: 'BSB', length: 6 },
  NZ: { label: 'Bank and branch number', noun: 'bank and branch number', length: 6 },
  GB: { label: 'Sort code', noun: 'sort code', length: 6 },
}

export function bankCodeFor(country: string): BankCodeFormat {
  return BANK_CODES[country] ?? BANK_CODES.US!
}

export interface BankAccountInput {
  holderName: string
  bankName: string
  bankCode: string
  accountNumber: string
  confirmAccountNumber: string
  /** Who the account belongs to — defaulted from the business type, never blocking. */
  holderType?: 'individual' | 'company' | null
}

export type BankAccountErrors = Partial<Record<keyof BankAccountInput, string>>

export function digitsOnly(value: string): string {
  return value.replace(/[\s-]/g, '')
}

export function bankAccountErrors(input: BankAccountInput, country: string): BankAccountErrors {
  const errors: BankAccountErrors = {}
  const code = bankCodeFor(country)
  if (blank(input.holderName)) errors.holderName = 'Enter the account holder’s name.'
  if (blank(input.bankName)) errors.bankName = 'Enter the bank’s name.'
  const bankCode = digitsOnly(input.bankCode)
  if (!/^\d+$/.test(bankCode) || bankCode.length !== code.length) errors.bankCode = `Enter the ${code.length}-digit ${code.noun}.`
  const account = digitsOnly(input.accountNumber)
  if (!/^\d{4,17}$/.test(account)) errors.accountNumber = 'Enter an account number of 4 to 17 digits.'
  else if (digitsOnly(input.confirmAccountNumber) !== account) errors.confirmAccountNumber = 'The account numbers don’t match.'
  return errors
}
