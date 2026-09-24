/**
 * Maropay setup rules — what each wizard step needs before the merchant moves
 * on, and what must be true before setup can be submitted.
 *
 * The same rules run in the wizard (to guide) and in the mock adapter (to
 * refuse), so the "server" never trusts the interface. Owner-only items —
 * authority, terms, payout account — never stop a finance user moving through
 * the steps; they stop submission, which is the owner's call.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { COUNTRY_LABELS, SUPPORTED_COUNTRIES } from './model.ts'
import type { MaropayActingRole, OnboardingDraft, OnboardingStepKey } from './model.ts'

/** Draft fields the wizard saves as it goes. Terms and the payout account have their own owner-only actions. */
export const EDITABLE_DRAFT_FIELDS = [
  'authorityConfirmed', 'businessChoice', 'reuseVerifiedDetails', 'country', 'businessType', 'channelIds',
  'business', 'representative', 'idDocument', 'publicDetails',
] as const satisfies ReadonlyArray<keyof OnboardingDraft>

export type EditableDraftField = typeof EDITABLE_DRAFT_FIELDS[number]
export type OnboardingPatch = Partial<Pick<OnboardingDraft, EditableDraftField>>

export type SetupField =
  | 'authority' | 'country' | 'businessType'
  | 'terms'
  | 'legalName' | 'registrationNumber' | 'addressLine1' | 'city' | 'region' | 'postalCode'
  | 'repName' | 'repEmail'
  | 'payout'
  | 'statementDescriptor' | 'supportEmail'

export interface SetupIssue {
  step: OnboardingStepKey
  field: SetupField
  message: string
  /** Only the business owner or an authorised representative can resolve it. */
  ownerOnly: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Card statement text: letters, digits, spaces and . - & only. */
const DESCRIPTOR = /^[A-Za-z0-9 .&-]+$/

export function isEmail(value: string): boolean {
  return EMAIL.test(value.trim())
}

export function descriptorIssue(value: string): string | null {
  const text = value.trim()
  if (!text) return 'Enter the name shoppers see on their statement.'
  if (text.length < 5) return 'Use at least 5 characters.'
  if (text.length > 22) return 'Use 22 characters or fewer.'
  if (!DESCRIPTOR.test(text)) return 'Use letters, numbers, spaces and . - & only.'
  if (!/[A-Za-z]/.test(text)) return 'Include at least one letter.'
  return null
}

export function countryLabel(code: string): string {
  return COUNTRY_LABELS[code] ?? code
}

function blank(value: string): boolean {
  return !value.trim()
}

/** Everything a step still needs, owner-only items included. */
export function stepIssues(draft: OnboardingDraft, step: OnboardingStepKey, termsVersion: string): SetupIssue[] {
  const out: SetupIssue[] = []
  const add = (field: SetupField, message: string, ownerOnly = false) => out.push({ step, field, message, ownerOnly })
  switch (step) {
    case 'business':
      if (!draft.authorityConfirmed) add('authority', 'Confirm you own the business or are authorised to act for it.', true)
      if (!SUPPORTED_COUNTRIES.includes(draft.country)) add('country', `Maropay isn’t available for businesses registered in ${countryLabel(draft.country)} yet.`)
      if (!draft.businessType) add('businessType', 'Choose the business type.')
      break
    case 'terms':
      if (draft.termsAcceptedVersion !== termsVersion) add('terms', 'Accept the terms to take payments with Maropay.', true)
      break
    case 'verify': {
      const { business, representative } = draft
      if (blank(business.legalName)) add('legalName', 'Enter the legal business name.')
      if (draft.businessType !== 'sole_trader' && blank(business.registrationNumber)) add('registrationNumber', 'Enter the registration number.')
      if (blank(business.address.line1)) add('addressLine1', 'Enter the street address.')
      if (blank(business.address.city)) add('city', 'Enter the city.')
      if (blank(business.address.region)) add('region', 'Enter the state or region.')
      if (blank(business.address.postalCode)) add('postalCode', 'Enter the postal code.')
      if (blank(representative.name)) add('repName', 'Enter the representative’s full name.')
      if (!isEmail(representative.email)) add('repEmail', 'Enter an email address like name@example.com.')
      break
    }
    case 'payout':
      if (!draft.payout) add('payout', 'Add the bank account payouts go to.', true)
      break
    case 'public': {
      const descriptor = descriptorIssue(draft.publicDetails.statementDescriptor)
      if (descriptor) add('statementDescriptor', descriptor)
      if (!isEmail(draft.publicDetails.supportEmail)) add('supportEmail', 'Enter a support email like help@example.com.')
      break
    }
    case 'review':
      break
  }
  return out
}

/** What stops this role leaving a step forward. Owner-only items never stop anyone else. */
export function blockingIssues(draft: OnboardingDraft, step: OnboardingStepKey, termsVersion: string, role: MaropayActingRole): SetupIssue[] {
  return stepIssues(draft, step, termsVersion).filter((i) => role === 'owner' || !i.ownerOnly)
}

const STEPS_BEFORE_REVIEW: OnboardingStepKey[] = ['business', 'terms', 'verify', 'payout', 'public']

/** Everything between this draft and submission, in step order. */
export function submissionIssues(draft: OnboardingDraft, termsVersion: string): SetupIssue[] {
  return STEPS_BEFORE_REVIEW.flatMap((step) => stepIssues(draft, step, termsVersion))
}

// ── Payout bank account ───────────────────────────────────────────────────
// Shared by setup and by changing the account later. The full numbers are
// validated here and never stored: the store keeps the last four digits.

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
