/**
 * The partner's requirements, as the prototype models them — the ONE rule
 * source for the setup wizard, the validators, the adapter and the review step.
 *
 * Our payments partner decides what a business must provide by registration
 * country and business type, and expresses it as dotted requirement keys
 * (`company.tax_id`, `representative.dob.day`, `owners.email`, `external_account`).
 * This module holds those rules for the five launch countries, maps each key
 * onto a wizard step and field, works out which keys a draft has provided, and
 * derives a partner-shaped requirements view from the account state:
 *
 *   currentlyDue  — keys still owed now (before submission: rules minus provided;
 *                   after: open keyed tasks)
 *   eventuallyDue — keys owed later, once payout volume reaches a threshold
 *   pastDue       — keyed tasks past their deadline
 *   pendingVerification — provided, waiting on the partner
 *   errors        — the partner's reason for asking again
 *   currentDeadline / disabledReason
 *
 * How the stored VerificationState reads against the partner's signals:
 *   not_submitted   ↔ details not submitted
 *   under_review    ↔ pending_verification non-empty
 *   action_required ↔ currently_due non-empty, with errors
 *   verified        ↔ charges and payouts enabled, nothing currently due
 *   rejected        ↔ rejected.<reason>
 *
 * Deliberate simplifications: `eventuallyDue` is kept disjoint from
 * `currentlyDue` (the partner lists a threshold key in both once it is due);
 * one outstanding partner request per decision; non-profit requirement sets are
 * illustrative because the partner's non-profit sets were not researched.
 * `partnerBusinessType()` is the value the partner would receive.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { REPRESENTATIVE_ID, personName } from './model.ts'
import type {
  ActionTask,
  BusinessType,
  CompanyStructure,
  MaropayAccountState,
  OnboardingDraft,
  OnboardingStepKey,
  Person,
  PersonRole,
  RequirementKey,
  SupportedCountry,
} from './model.ts'
import {
  blank,
  descriptorIssue,
  dobIssue,
  isEmail,
  normaliseTaxId,
  phoneIssue,
  postalCodeExample,
  postalCodeIssue,
  productDescriptionIssue,
  ssnLast4Issue,
  websiteIssue,
} from './validation.ts'

// ── Rules per country ─────────────────────────────────────────────────────

/** What a person of a given role must give beyond their name. */
export type PersonField = 'email' | 'phone' | 'dob' | 'address' | 'title' | 'percentOwnership'

export interface DueLaterItem {
  key: RequirementKey
  /** When the partner will ask, in the merchant's words. */
  trigger: string
}

/** `original` counts as provided once every key in `alternative` is. */
export interface Alternative {
  original: RequirementKey
  alternative: RequirementKey[]
}

export interface StructureOption {
  value: CompanyStructure
  /** Public companies have no beneficial owners to list. */
  public?: boolean
  /** Sent to the partner as business type `non_profit`; no owners either. */
  nonProfit?: boolean
}

export interface EntityRules {
  currentlyDue: RequirementKey[]
  eventuallyDue: DueLaterItem[]
  persons: Partial<Record<PersonRole, PersonField[]>>
  alternatives: Alternative[]
}

export interface IdFormat {
  label: string
  hint: string
  /** Matched after normaliseTaxId(). */
  pattern: RegExp
}

export interface CountryRules {
  currency: string
  taxId: IdFormat
  /** AU only: the ACN beside the ABN. */
  registrationNumber: IdFormat | null
  /** Whether addresses carry a state, province or territory. */
  usesRegion: boolean
  regionLabel: string
  postalLabel: string
  structures: StructureOption[]
  company: EntityRules
  individual: EntityRules
}

const COMMON_DUE: RequirementKey[] = ['business_profile.mcc', 'business_profile.url', 'tos_acceptance.date', 'tos_acceptance.ip', 'external_account']

function addressKeys(prefix: string, usesRegion: boolean): RequirementKey[] {
  return [`${prefix}.address.line1`, `${prefix}.address.city`, ...(usesRegion ? [`${prefix}.address.state`] : []), `${prefix}.address.postal_code`]
}

function companyDue(usesRegion: boolean): RequirementKey[] {
  return [
    ...COMMON_DUE,
    'company.name', ...addressKeys('company', usesRegion), 'company.phone',
    'representative.first_name', 'representative.last_name', 'representative.email', 'representative.phone',
    'representative.dob.day', 'representative.dob.month', 'representative.dob.year',
    ...addressKeys('representative', usesRegion), 'representative.relationship.title',
  ]
}

function individualDue(usesRegion: boolean, withEmail = true): RequirementKey[] {
  return [
    ...COMMON_DUE,
    'individual.first_name', 'individual.last_name', ...(withEmail ? ['individual.email'] : []), 'individual.phone',
    'individual.dob.day', 'individual.dob.month', 'individual.dob.year',
    ...addressKeys('individual', usesRegion),
  ]
}

const US_WEBSITE_ALTERNATIVE: Alternative = { original: 'business_profile.url', alternative: ['business_profile.product_description'] }

const PARTNER_LIMIT = 'once payouts reach the partner’s limit'

export const RULES: Record<SupportedCountry, CountryRules> = {
  US: {
    currency: 'USD',
    taxId: { label: 'EIN', hint: 'The 9-digit EIN — dashes and spaces are fine, we remove them.', pattern: /^\d{9}$/ },
    registrationNumber: null,
    usesRegion: true, regionLabel: 'State', postalLabel: 'ZIP code',
    structures: [
      { value: 'sole_proprietorship' }, { value: 'single_member_llc' }, { value: 'multi_member_llc' },
      { value: 'private_partnership' }, { value: 'private_corporation' },
      { value: 'public_partnership', public: true }, { value: 'public_corporation', public: true },
      { value: 'unincorporated_association' },
      { value: 'incorporated_non_profit', nonProfit: true }, { value: 'unincorporated_non_profit', nonProfit: true },
    ],
    company: {
      currentlyDue: [...companyDue(true), 'settings.payments.statement_descriptor', 'representative.ssn_last_4'],
      eventuallyDue: [{ key: 'company.tax_id', trigger: 'asked once payouts reach about $1,500; payouts stop at about $3,000 until it’s provided (illustrative)' }],
      persons: { owner: ['email'] },
      alternatives: [US_WEBSITE_ALTERNATIVE],
    },
    individual: {
      // The partner's helper marks the date of birth as threshold-based; it is kept due now so identity can be keyed.
      currentlyDue: [...individualDue(true), 'settings.payments.statement_descriptor', 'individual.ssn_last_4'],
      eventuallyDue: [],
      persons: {},
      alternatives: [US_WEBSITE_ALTERNATIVE],
    },
  },
  CA: {
    currency: 'CAD',
    // The partner also accepts a 9-digit Business Number here; Maropost allows it too.
    taxId: { label: 'Business number', hint: 'Registry ID, Corporation Number (7 digits) or Québec Enterprise Number (10 digits) — spaces and dashes are fine.', pattern: /^(\d{7}|\d{9}|\d{10})$/ },
    registrationNumber: null,
    usesRegion: true, regionLabel: 'Province', postalLabel: 'Postal code',
    structures: [
      { value: 'private_corporation' }, { value: 'private_partnership' }, { value: 'sole_proprietorship' },
      { value: 'public_corporation', public: true }, { value: 'registered_charity', nonProfit: true },
    ],
    company: {
      currentlyDue: [...companyDue(true), 'company.tax_id', 'business_profile.product_description'],
      eventuallyDue: [{ key: 'business_profile.support_phone', trigger: PARTNER_LIMIT }],
      persons: { owner: ['dob', 'address'], director: ['email'] },
      alternatives: [],
    },
    individual: {
      currentlyDue: [...individualDue(true, false), 'business_profile.product_description'],
      eventuallyDue: [{ key: 'individual.email', trigger: PARTNER_LIMIT }, { key: 'individual.relationship.title', trigger: PARTNER_LIMIT }],
      persons: {},
      alternatives: [],
    },
  },
  AU: {
    currency: 'AUD',
    taxId: { label: 'ABN', hint: 'The 11-digit Australian Business Number — spaces are fine.', pattern: /^\d{11}$/ },
    registrationNumber: { label: 'ACN', hint: 'The 9-digit Australian Company Number.', pattern: /^\d{9}$/ },
    usesRegion: true, regionLabel: 'State or territory', postalLabel: 'Postcode',
    structures: [
      { value: 'public_corporation', public: true }, { value: 'private_corporation' }, { value: 'sole_proprietorship' },
      { value: 'private_partnership' }, { value: 'trust' }, { value: 'unincorporated_association', nonProfit: true },
    ],
    company: {
      currentlyDue: [...companyDue(true), 'company.tax_id', 'company.registration_number'],
      eventuallyDue: [],
      persons: {
        owner: ['email', 'dob', 'address', 'title', 'percentOwnership'],
        director: ['email', 'dob', 'title'],
        executive: ['email', 'dob', 'address', 'title'],
      },
      alternatives: [],
    },
    individual: { currentlyDue: individualDue(true), eventuallyDue: [], persons: {}, alternatives: [] },
  },
  NZ: {
    currency: 'NZD',
    taxId: { label: 'NZBN', hint: 'The 13-digit New Zealand Business Number.', pattern: /^\d{13}$/ },
    registrationNumber: null,
    usesRegion: false, regionLabel: 'Region', postalLabel: 'Postcode',
    structures: [
      { value: 'public_corporation', public: true }, { value: 'private_corporation' }, { value: 'sole_proprietorship' },
      { value: 'private_partnership' }, { value: 'trust' },
    ],
    company: {
      currentlyDue: [...companyDue(false), 'company.tax_id'],
      eventuallyDue: [],
      persons: { owner: ['email', 'dob', 'address'], director: ['email', 'dob', 'title'], executive: ['email', 'dob', 'address'] },
      alternatives: [],
    },
    individual: { currentlyDue: individualDue(false), eventuallyDue: [], persons: {}, alternatives: [] },
  },
  GB: {
    currency: 'GBP',
    taxId: { label: 'Company number', hint: 'The 8-character number from Companies House.', pattern: /^[A-Z0-9]{8}$/ },
    registrationNumber: null,
    usesRegion: false, regionLabel: 'County', postalLabel: 'Postcode',
    structures: [
      { value: 'private_corporation' }, { value: 'public_corporation', public: true },
      { value: 'incorporated_partnership' }, { value: 'unincorporated_partnership' },
      { value: 'incorporated_non_profit', nonProfit: true }, { value: 'unincorporated_non_profit', nonProfit: true },
    ],
    company: {
      currentlyDue: [...companyDue(false), 'company.tax_id'],
      eventuallyDue: [],
      persons: { owner: ['email', 'dob', 'address'], director: ['email', 'dob', 'address', 'title'] },
      alternatives: [],
    },
    individual: { currentlyDue: individualDue(false), eventuallyDue: [], persons: {}, alternatives: [] },
  },
}

export const STRUCTURE_LABELS: Record<CompanyStructure, string> = {
  private_corporation: 'Private company',
  public_corporation: 'Public company',
  sole_proprietorship: 'Sole proprietorship',
  single_member_llc: 'LLC (one owner)',
  multi_member_llc: 'LLC (several owners)',
  private_partnership: 'Private partnership',
  public_partnership: 'Public partnership',
  incorporated_partnership: 'Incorporated partnership',
  unincorporated_partnership: 'Unincorporated partnership',
  unincorporated_association: 'Unincorporated association',
  trust: 'Trust',
  incorporated_non_profit: 'Incorporated non-profit',
  unincorporated_non_profit: 'Unincorporated non-profit',
  registered_charity: 'Registered charity',
}

/** Illustrative merchant categories — the partner's list is far longer. */
export const MCC_OPTIONS: Array<{ value: string; title: string }> = [
  { value: '5651', title: 'Clothing' }, { value: '5661', title: 'Shoes' }, { value: '5691', title: 'Apparel and accessories' },
  { value: '5732', title: 'Electronics' }, { value: '5734', title: 'Software' }, { value: '5712', title: 'Furniture and home' },
  { value: '5941', title: 'Sporting goods' }, { value: '5945', title: 'Toys and games' }, { value: '5942', title: 'Books' },
  { value: '5977', title: 'Cosmetics and beauty' }, { value: '5499', title: 'Food and drink' }, { value: '5399', title: 'General merchandise' },
  { value: '5968', title: 'Subscriptions' }, { value: '7299', title: 'Personal services' }, { value: '8299', title: 'Education' },
]

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  owner: 'Owns 25% or more of the business',
  director: 'Director',
  executive: 'Executive',
}

export function isSupportedRulesCountry(country: string): country is SupportedCountry {
  return country in RULES
}

function structureOption(country: string, structure: CompanyStructure | null): StructureOption | null {
  if (!isSupportedRulesCountry(country) || !structure) return null
  return RULES[country].structures.find((s) => s.value === structure) ?? null
}

/** The business type the partner would receive. */
export function partnerBusinessType(country: string, businessType: BusinessType | null, structure: CompanyStructure | null): 'individual' | 'company' | 'non_profit' {
  if (businessType === 'individual') return 'individual'
  return structureOption(country, structure)?.nonProfit ? 'non_profit' : 'company'
}

// ── Rules for one setup ───────────────────────────────────────────────────

export interface PersonRoleRules {
  role: PersonRole
  label: string
  fields: PersonField[]
}

export interface OnboardingRules {
  country: string
  businessType: BusinessType | null
  partnerBusinessType: 'individual' | 'company' | 'non_profit'
  structures: Array<StructureOption & { label: string }>
  /** Keys currently due for this setup. */
  fields: Set<RequirementKey>
  dueLater: DueLaterItem[]
  personRoles: PersonRoleRules[]
  usesRegion: boolean
  labels: { region: string; postal: string; postalCodeExample: string; taxId: IdFormat; registrationNumber: IdFormat | null }
  industries: typeof MCC_OPTIONS
  alternatives: Alternative[]
  /** The partner's prefix for the person who verifies their identity. */
  identityPrefix: 'individual' | 'representative'
}

const PERSON_FIELD_KEYS: Record<PersonField, (role: PersonRole, usesRegion: boolean) => RequirementKey[]> = {
  email: (r) => [`${r}s.email`],
  phone: (r) => [`${r}s.phone`],
  dob: (r) => [`${r}s.dob.day`, `${r}s.dob.month`, `${r}s.dob.year`],
  address: (r, usesRegion) => addressKeys(`${r}s`, usesRegion),
  title: (r) => [`${r}s.relationship.title`],
  percentOwnership: (r) => [`${r}s.relationship.percent_ownership`],
}

const EMPTY_RULES = (country: string, businessType: BusinessType | null): OnboardingRules => ({
  country, businessType, partnerBusinessType: businessType === 'individual' ? 'individual' : 'company',
  structures: [], fields: new Set(), dueLater: [], personRoles: [], usesRegion: true,
  labels: { region: 'State or region', postal: 'Postal code', postalCodeExample: postalCodeExample(country), taxId: RULES.US.taxId, registrationNumber: null },
  industries: MCC_OPTIONS, alternatives: [], identityPrefix: businessType === 'individual' ? 'individual' : 'representative',
})

/** Everything the partner asks of this country and business type. Unsupported countries get an empty set (the eligibility gate is elsewhere). */
export function rulesFor(country: string, businessType: BusinessType | null, structure: CompanyStructure | null): OnboardingRules {
  if (!isSupportedRulesCountry(country) || !businessType) return EMPTY_RULES(country, businessType)
  const c = RULES[country]
  const entity = businessType === 'individual' ? c.individual : c.company
  const option = businessType === 'company' ? structureOption(country, structure) : null
  const noOwners = Boolean(option?.public || option?.nonProfit)
  const fields = new Set(entity.currentlyDue)
  const personRoles: PersonRoleRules[] = []
  for (const role of ['owner', 'director', 'executive'] as PersonRole[]) {
    const roleFields = entity.persons[role]
    if (!roleFields || (role === 'owner' && noOwners)) continue
    personRoles.push({ role, label: PERSON_ROLE_LABELS[role], fields: roleFields })
    fields.add(`${role}s.first_name`)
    fields.add(`${role}s.last_name`)
    for (const f of roleFields) for (const key of PERSON_FIELD_KEYS[f](role, c.usesRegion)) fields.add(key)
    fields.add(`company.${role}s_provided`)
  }
  return {
    country,
    businessType,
    partnerBusinessType: partnerBusinessType(country, businessType, structure),
    structures: businessType === 'company' ? c.structures.map((s) => ({ ...s, label: STRUCTURE_LABELS[s.value] })) : [],
    fields,
    dueLater: entity.eventuallyDue,
    personRoles,
    usesRegion: c.usesRegion,
    labels: { region: c.regionLabel, postal: c.postalLabel, postalCodeExample: postalCodeExample(country), taxId: c.taxId, registrationNumber: c.registrationNumber },
    industries: MCC_OPTIONS,
    alternatives: entity.alternatives,
    identityPrefix: businessType === 'individual' ? 'individual' : 'representative',
  }
}

export function rulesForDraft(draft: Pick<OnboardingDraft, 'country' | 'businessType' | 'business'>): OnboardingRules {
  return rulesFor(draft.country, draft.businessType, draft.business.structure)
}

/** Rules for the account as submitted, falling back to the draft while setup is in progress. */
export function rulesForState(state: MaropayAccountState): OnboardingRules {
  const b = state.business
  return b ? rulesFor(b.country, b.type, b.structure) : rulesForDraft(state.onboarding)
}

// ── Keys → wizard fields ──────────────────────────────────────────────────

/** Every field the wizard can flag. The rep* fields double for `individual.*` keys. */
export type SetupField =
  | 'authority' | 'country' | 'businessType' | 'structure' | 'industry' | 'website' | 'productDescription' | 'phone'
  | 'terms'
  | 'legalName' | 'taxId' | 'registrationNumber' | 'addressLine1' | 'city' | 'region' | 'postalCode'
  | 'repFirstName' | 'repLastName' | 'repTitle' | 'repEmail' | 'repPhone' | 'repDob'
  | 'repAddressLine1' | 'repCity' | 'repRegion' | 'repPostalCode' | 'repSsnLast4' | 'repOwnership'
  | 'persons' | 'ownersProvided' | 'directorsProvided' | 'executivesProvided' | 'document'
  | 'payout' | 'payoutCurrency'
  | 'statementDescriptor' | 'supportEmail' | 'supportPhone'

export interface RequirementField {
  step: OnboardingStepKey
  field: SetupField
  label: (rules: OnboardingRules) => string
  message: (rules: OnboardingRules) => string
  ownerOnly: boolean
}

function f(step: OnboardingStepKey, field: SetupField, label: string | ((r: OnboardingRules) => string), message: string | ((r: OnboardingRules) => string), ownerOnly = false): RequirementField {
  return {
    step, field, ownerOnly,
    label: typeof label === 'function' ? label : () => label,
    message: typeof message === 'function' ? message : () => message,
  }
}

const REPRESENTATIVE_FIELDS: Record<string, RequirementField> = {
  first_name: f('verify', 'repFirstName', 'First name', 'Enter the first name.'),
  last_name: f('verify', 'repLastName', 'Last name', 'Enter the last name.'),
  email: f('verify', 'repEmail', 'Email', 'Enter an email address like name@example.com.'),
  phone: f('verify', 'repPhone', 'Phone', 'Enter a phone number with the area code.'),
  'dob.day': f('verify', 'repDob', 'Date of birth', 'Enter the date of birth.'),
  'dob.month': f('verify', 'repDob', 'Date of birth', 'Enter the date of birth.'),
  'dob.year': f('verify', 'repDob', 'Date of birth', 'Enter the date of birth.'),
  'address.line1': f('verify', 'repAddressLine1', 'Home address', 'Enter the street address.'),
  'address.city': f('verify', 'repCity', 'City', 'Enter the city.'),
  'address.state': f('verify', 'repRegion', (r) => r.labels.region, (r) => `Enter the ${r.labels.region.toLowerCase()}.`),
  'address.postal_code': f('verify', 'repPostalCode', (r) => r.labels.postal, (r) => `Enter a ${r.labels.postal.toLowerCase()} like ${r.labels.postalCodeExample}.`),
  ssn_last_4: f('verify', 'repSsnLast4', 'Last 4 digits of SSN', 'Enter the last 4 digits of the SSN.'),
  'relationship.title': f('verify', 'repTitle', 'Job title', 'Enter the job title.'),
  'relationship.percent_ownership': f('verify', 'repOwnership', 'Ownership %', 'Enter the ownership percentage.'),
  'verification.document': f('verify', 'document', 'Photo ID', 'Attach the front of the document.'),
  'verification.additional_document': f('verify', 'document', 'Proof of address', 'Attach the document.'),
}

const FIXED_FIELDS: Record<string, RequirementField> = {
  'business_profile.mcc': f('business', 'industry', 'Industry', 'Choose the closest industry.'),
  'business_profile.url': f('business', 'website', 'Website', (r) => (r.alternatives.some((a) => a.original === 'business_profile.url')
    ? 'Enter the website shoppers buy from, or describe what you sell instead.'
    : 'Enter the website shoppers buy from.')),
  'business_profile.product_description': f('business', 'productDescription', 'What you sell', 'Describe what you sell in at least 10 characters.'),
  'business_profile.support_phone': f('public', 'supportPhone', 'Support phone', 'Enter a support phone number.'),
  'company.phone': f('business', 'phone', 'Business phone', 'Enter the business phone number with the area code.'),
  'tos_acceptance.date': f('terms', 'terms', 'Terms of service', 'Accept the terms to take payments with Maropay.', true),
  'tos_acceptance.ip': f('terms', 'terms', 'Terms of service', 'Accept the terms to take payments with Maropay.', true),
  'company.name': f('verify', 'legalName', 'Legal business name', 'Enter the legal business name.'),
  'company.tax_id': f('verify', 'taxId', (r) => r.labels.taxId.label, (r) => `Enter the ${r.labels.taxId.label}.`),
  'company.registration_number': f('verify', 'registrationNumber', (r) => r.labels.registrationNumber?.label ?? 'Registration number', (r) => `Enter the ${r.labels.registrationNumber?.label ?? 'registration number'}.`),
  'company.address.line1': f('verify', 'addressLine1', 'Registered address', 'Enter the street address.'),
  'company.address.city': f('verify', 'city', 'City', 'Enter the city.'),
  'company.address.state': f('verify', 'region', (r) => r.labels.region, (r) => `Enter the ${r.labels.region.toLowerCase()}.`),
  'company.address.postal_code': f('verify', 'postalCode', (r) => r.labels.postal, (r) => `Enter a ${r.labels.postal.toLowerCase()} like ${r.labels.postalCodeExample}.`),
  'company.owners_provided': f('verify', 'ownersProvided', 'Owners confirmed', 'Confirm you’ve added everyone who owns 25% or more.', true),
  'company.directors_provided': f('verify', 'directorsProvided', 'Directors confirmed', 'Confirm you’ve added every director.', true),
  'company.executives_provided': f('verify', 'executivesProvided', 'Executives confirmed', 'Confirm you’ve added every executive.', true),
  'company.verification.document': f('verify', 'document', 'Business registration document', 'Attach the document.'),
  'external_account': f('payout', 'payout', 'Payout bank account', 'Add the bank account payouts go to.', true),
  'settings.payments.statement_descriptor': f('public', 'statementDescriptor', 'Statement descriptor', 'Enter the name shoppers see on their statement.'),
}

const PEOPLE_FIELD = f('verify', 'persons', 'Owners, directors and executives', 'Complete the details of everyone you’ve added.')

/** Where a requirement key is fixed in the wizard. */
export function requirementField(key: RequirementKey): RequirementField {
  const fixed = FIXED_FIELDS[key]
  if (fixed) return fixed
  const person = /^(representative|individual)\.(.+)$/.exec(key)
  if (person) return REPRESENTATIVE_FIELDS[person[2]!] ?? PEOPLE_FIELD
  return PEOPLE_FIELD
}

/** A short label for task titles: 'EIN', 'Photo ID', 'Website'. */
export function requirementLabel(key: RequirementKey, rules: OnboardingRules): string {
  return requirementField(key).label(rules)
}

// ── What a draft has provided ─────────────────────────────────────────────

function addressProvided(address: Person['address'], usesRegion: boolean, country: string, part: string): boolean {
  switch (part) {
    case 'line1': return !blank(address.line1)
    case 'city': return !blank(address.city)
    case 'state': return !usesRegion || !blank(address.region)
    case 'postal_code': return postalCodeIssue(address.postalCode, country) === null
    default: return false
  }
}

/** Whether one person satisfies one of the partner's person fields. */
export function personFieldProvided(person: Person, field: PersonField, rules: OnboardingRules, nowMs: number): boolean {
  switch (field) {
    case 'email': return isEmail(person.email)
    case 'phone': return phoneIssue(person.phone) === null
    case 'dob': return dobIssue(person.dob, nowMs, 13) === null
    case 'address': return ['line1', 'city', 'state', 'postal_code'].every((p) => addressProvided(person.address, rules.usesRegion, rules.country, p))
    case 'title': return !blank(person.title)
    case 'percentOwnership': return person.percentOwnership !== null && person.percentOwnership > 0 && person.percentOwnership <= 100
  }
}

function personProvided(person: Person, key: string, rules: OnboardingRules, nowMs: number): boolean {
  switch (key) {
    case 'first_name': return !blank(person.firstName)
    case 'last_name': return !blank(person.lastName)
    case 'email': return isEmail(person.email)
    case 'phone': return phoneIssue(person.phone) === null
    case 'dob.day': case 'dob.month': case 'dob.year': return dobIssue(person.dob, nowMs, 18) === null
    case 'address.line1': case 'address.city': case 'address.state': case 'address.postal_code':
      return addressProvided(person.address, rules.usesRegion, rules.country, key.slice('address.'.length))
    case 'ssn_last_4': return ssnLast4Issue(person.ssnLast4) === null
    case 'relationship.title': return !blank(person.title)
    case 'relationship.percent_ownership': return person.percentOwnership !== null && person.percentOwnership > 0
    default: return false
  }
}

export function taxIdIssue(value: string, rules: OnboardingRules): string | null {
  const text = normaliseTaxId(value)
  if (!text) return `Enter the ${rules.labels.taxId.label}.`
  if (!rules.labels.taxId.pattern.test(text)) return rules.labels.taxId.hint
  return null
}

export function registrationNumberIssue(value: string, rules: OnboardingRules): string | null {
  const format = rules.labels.registrationNumber
  if (!format) return null
  const text = normaliseTaxId(value)
  if (!text) return `Enter the ${format.label}.`
  if (!format.pattern.test(text)) return format.hint
  return null
}

function personsWithRole(draft: OnboardingDraft, role: PersonRole): Person[] {
  return draft.persons.filter((p) => p.roles[role])
}

/** Whether one requirement key is satisfied by the draft, before alternatives are applied. */
function directlyProvided(draft: OnboardingDraft, termsVersion: string, key: RequirementKey, rules: OnboardingRules, nowMs: number): boolean {
  const b = draft.business
  switch (key) {
    case 'business_profile.mcc': return b.mcc !== null
    case 'business_profile.url': return !b.noWebsite && websiteIssue(b.website) === null
    case 'business_profile.product_description': return productDescriptionIssue(b.productDescription) === null
    case 'business_profile.support_phone': return phoneIssue(draft.publicDetails.supportPhone) === null
    case 'company.name': return !blank(b.legalName)
    case 'company.tax_id': return taxIdIssue(b.taxId, rules) === null
    case 'company.registration_number': return registrationNumberIssue(b.registrationNumber, rules) === null
    case 'company.phone': return phoneIssue(b.phone) === null
    case 'company.owners_provided': return draft.attestations.owners
    case 'company.directors_provided': return draft.attestations.directors
    case 'company.executives_provided': return draft.attestations.executives
    case 'settings.payments.statement_descriptor': return descriptorIssue(draft.publicDetails.statementDescriptor) === null
    case 'tos_acceptance.date': case 'tos_acceptance.ip': return draft.termsAcceptedVersion === termsVersion
    case 'external_account': return draft.payout !== null && (draft.country !== 'US' || /^\d{9}$/.test(draft.payout.routingNumber))
  }
  if (key.startsWith('company.address.')) return addressProvided(b.address, rules.usesRegion, rules.country, key.slice('company.address.'.length))
  const rep = /^(representative|individual)\.(.+)$/.exec(key)
  if (rep) return personProvided(draft.representative, rep[2]!, rules, nowMs)
  const list = /^(owner|director|executive)s\.(.+)$/.exec(key)
  if (list) return personsWithRole(draft, list[1] as PersonRole).every((p) => personProvided(p, list[2]!, rules, nowMs))
  return false
}

/** The keys this draft satisfies, alternatives applied (a US business with no website but a product description has provided its URL). */
export function providedKeys(draft: OnboardingDraft, termsVersion: string, nowMs: number, rules: OnboardingRules = rulesForDraft(draft)): Set<RequirementKey> {
  const provided = new Set<RequirementKey>()
  // Later-dated items count too, so a detail already on file (an EIN typed during setup) is never asked for again.
  for (const key of [...rules.fields, ...rules.dueLater.map((d) => d.key)]) if (directlyProvided(draft, termsVersion, key, rules, nowMs)) provided.add(key)
  for (const alt of rules.alternatives) {
    if (!provided.has(alt.original) && alt.alternative.every((k) => directlyProvided(draft, termsVersion, k, rules, nowMs))) provided.add(alt.original)
  }
  return provided
}

export function isProvided(draft: OnboardingDraft, termsVersion: string, key: RequirementKey, nowMs: number, rules: OnboardingRules = rulesForDraft(draft)): boolean {
  return providedKeys(draft, termsVersion, nowMs, rules).has(key)
}

/** Keys the partner still needs before submission, in rule order. */
export function missingKeys(draft: OnboardingDraft, termsVersion: string, nowMs: number, rules: OnboardingRules = rulesForDraft(draft)): RequirementKey[] {
  const provided = providedKeys(draft, termsVersion, nowMs, rules)
  return [...rules.fields].filter((k) => !provided.has(k))
}

// ── The partner's requests (reviewer choices) ─────────────────────────────

export type MockErrorKey = 'identity_unverified' | 'document_unreadable' | 'name_mismatch' | 'website_inaccessible' | 'address_unverified' | 'owner_identity'

export interface MockError {
  /** The partner's error code — kept for support, never shown. */
  code: string
  requirement: (rules: OnboardingRules) => RequirementKey
  scope: 'representative' | 'company' | 'owner'
  /** Take the alternative from the account's rules rather than this entry. */
  alternativeFromRules: boolean
  alternative: RequirementKey[] | null
  /** The reason in the merchant's words. */
  reason: string
  title: (name: string, rules: OnboardingRules) => string
  description: string
  /** A refusal message when this request makes no sense for the account, else null. */
  allowedWhen: (state: MaropayAccountState, rules: OnboardingRules) => string | null
}

function documentSent(state: MaropayAccountState, key: RequirementKey): boolean {
  return state.tasks.some((t) => t.requirement === key && t.documents)
}

function firstOwner(state: MaropayAccountState): Person | null {
  const persons = state.business?.persons ?? [state.onboarding.representative, ...state.onboarding.persons]
  return persons.find((p) => p.id !== REPRESENTATIVE_ID && p.roles.owner) ?? null
}

export const MOCK_ERRORS: Record<MockErrorKey, MockError> = {
  identity_unverified: {
    code: 'verification_failed_keyed_identity',
    requirement: (r) => `${r.identityPrefix}.verification.document`,
    scope: 'representative', alternativeFromRules: false, alternative: null,
    reason: 'They couldn’t confirm the representative’s identity from the details provided.',
    title: (name) => `Upload a photo ID for ${name}`,
    description: 'A passport, driving licence or national ID for the person who represents the business. Only the file name is kept in this prototype.',
    allowedWhen: () => null,
  },
  document_unreadable: {
    code: 'verification_document_not_readable',
    requirement: (r) => `${r.identityPrefix}.verification.document`,
    scope: 'representative', alternativeFromRules: false, alternative: null,
    reason: 'The photo ID couldn’t be read.',
    title: (name) => `Upload a clearer photo ID for ${name}`,
    description: 'Upload a photo where every corner is visible and the text is sharp.',
    allowedWhen: (state, r) => (documentSent(state, `${r.identityPrefix}.verification.document`) ? null : 'No document has been sent yet — ask for identity verification first.'),
  },
  name_mismatch: {
    code: 'verification_failed_tax_id_match',
    requirement: () => 'company.tax_id',
    scope: 'company', alternativeFromRules: false, alternative: ['company.verification.document'],
    reason: 'The legal name and tax ID don’t match official records.',
    title: (_name, r) => `Confirm your ${r.labels.taxId.label}`,
    description: 'Check the number against your registration documents, or upload the document itself instead.',
    allowedWhen: (_state, r) => (r.businessType === 'individual' ? 'Individuals have no business tax ID to check.' : r.country === 'CA' ? 'Our payments partner doesn’t run this check for businesses registered in Canada.' : null),
  },
  website_inaccessible: {
    code: 'invalid_url_website_inaccessible',
    requirement: () => 'business_profile.url',
    scope: 'company', alternativeFromRules: true, alternative: null,
    reason: 'Your website couldn’t be reached.',
    title: (_name, r) => (r.alternatives.some((a) => a.original === 'business_profile.url') ? 'Fix your website address, or describe what you sell instead' : 'Fix your website address'),
    description: 'Our payments partner checks that the site shoppers buy from is live and matches your business.',
    allowedWhen: (state) => (state.business?.noWebsite ? 'This business described its products instead of a website.' : null),
  },
  address_unverified: {
    code: 'verification_failed_address_match',
    requirement: (r) => `${r.identityPrefix}.verification.additional_document`,
    scope: 'representative', alternativeFromRules: false, alternative: null,
    reason: 'The representative’s home address couldn’t be verified.',
    title: (name) => `Upload proof of address for ${name}`,
    description: 'A utility bill or bank statement from the last 6 months showing the home address.',
    allowedWhen: () => null,
  },
  owner_identity: {
    code: 'verification_failed_keyed_identity',
    requirement: () => 'owners.verification.document',
    scope: 'owner', alternativeFromRules: false, alternative: null,
    reason: 'They couldn’t confirm the owner’s identity from the details provided.',
    title: (name) => `Upload a photo ID for ${name}`,
    description: 'A passport, driving licence or national ID for this owner. Only the file name is kept in this prototype.',
    allowedWhen: (state) => (firstOwner(state) ? null : 'This business has no additional owners on file.'),
  },
}

export const MOCK_ERROR_LABELS: Record<MockErrorKey, string> = {
  identity_unverified: 'Identity not confirmed',
  document_unreadable: 'Photo ID unreadable',
  name_mismatch: 'Name doesn’t match tax ID',
  website_inaccessible: 'Website unreachable',
  address_unverified: 'Address not verified',
  owner_identity: 'Owner identity not confirmed',
}

/** The person a partner request is about — the representative, or the named owner. */
export function requestSubject(state: MaropayAccountState, error: MockError): Person | null {
  if (error.scope === 'owner') return firstOwner(state)
  const rep = state.business ? state.business.persons.find((p) => p.id === state.business!.representativeId) ?? null : state.onboarding.representative
  return rep
}

export function requestSubjectName(state: MaropayAccountState, error: MockError): string {
  const subject = requestSubject(state, error)
  return (subject && personName(subject)) || 'your representative'
}

// ── The form a request renders ────────────────────────────────────────────

export type RequirementForm =
  | { kind: 'documents'; sides: 'front_back' | 'single'; label: string; hint: string; accept: string }
  | { kind: 'value'; field: SetupField; label: string; hint: string | null; inputType: 'text' | 'url' | 'textarea'; validate: (value: string) => string | null }
  | { kind: 'confirm' }

const PHOTO_ID: RequirementForm = { kind: 'documents', sides: 'front_back', label: 'Photo ID', hint: 'A passport, driving licence or national ID.', accept: 'image/*,application/pdf' }

/** The form a request renders, or null for a key the prototype has no form for (the adapter won't raise those). Older tasks without a key ask for a photo ID. */
export function requirementForm(key: RequirementKey | undefined, rules: OnboardingRules): RequirementForm | null {
  if (!key) return PHOTO_ID
  if (/\.verification\.document$/.test(key)) {
    if (key.startsWith('company.')) return { kind: 'documents', sides: 'single', label: 'Business registration document', hint: 'The registration certificate or a recent official letter naming the business.', accept: 'image/*,application/pdf' }
    return PHOTO_ID
  }
  if (/\.verification\.additional_document$/.test(key)) {
    return { kind: 'documents', sides: 'single', label: 'Proof of address', hint: 'A utility bill or bank statement from the last 6 months.', accept: 'image/*,application/pdf' }
  }
  switch (key) {
    case 'company.tax_id':
      return { kind: 'value', field: 'taxId', label: rules.labels.taxId.label, hint: rules.labels.taxId.hint, inputType: 'text', validate: (v) => taxIdIssue(v, rules) }
    case 'business_profile.url':
      return { kind: 'value', field: 'website', label: 'Website', hint: 'The site shoppers buy from.', inputType: 'url', validate: websiteIssue }
    case 'business_profile.product_description':
      return { kind: 'value', field: 'productDescription', label: 'What you sell', hint: 'At least 10 characters.', inputType: 'textarea', validate: productDescriptionIssue }
    case 'business_profile.support_phone':
      return { kind: 'value', field: 'supportPhone', label: 'Support phone', hint: 'The number shoppers can call about an order.', inputType: 'text', validate: phoneIssue }
    case 'individual.email':
      return { kind: 'value', field: 'repEmail', label: 'Email', hint: null, inputType: 'text', validate: (v) => (isEmail(v) ? null : 'Enter an email address like name@example.com.') }
    case 'individual.relationship.title':
      return { kind: 'value', field: 'repTitle', label: 'Job title', hint: null, inputType: 'text', validate: (v) => (blank(v) ? 'Enter the job title.' : null) }
    case 'external_account':
      return { kind: 'confirm' }
    default:
      return null
  }
}

// ── The partner-shaped view of the account ────────────────────────────────

export interface RequirementsView {
  currentlyDue: RequirementKey[]
  eventuallyDue: DueLaterItem[]
  pastDue: RequirementKey[]
  pendingVerification: RequirementKey[]
  errors: Array<{ code: string; reason: string; requirement: RequirementKey }>
  currentDeadline: string | null
  disabledReason: string | null
}

const EMPTY_VIEW: RequirementsView = { currentlyDue: [], eventuallyDue: [], pastDue: [], pendingVerification: [], errors: [], currentDeadline: null, disabledReason: null }

/** Open = not resolved, so a provided-but-unverified key stays currently due (waiting on review) — as the partner does. */
function openRequirementTasks(state: MaropayAccountState): ActionTask[] {
  return state.tasks.filter((t) => t.status !== 'resolved' && typeof t.requirement === 'string')
}

export function deriveRequirements(state: MaropayAccountState, now: number): RequirementsView {
  const account = state.account
  if (!account) return EMPTY_VIEW
  const rules = rulesForState(state)
  if (account.setup !== 'submitted') {
    const onFile = providedKeys(state.onboarding, state.terms.version, now, rules)
    return {
      ...EMPTY_VIEW,
      currentlyDue: missingKeys(state.onboarding, state.terms.version, now, rules),
      eventuallyDue: rules.dueLater.filter((d) => !onFile.has(d.key)),
      disabledReason: 'requirements.past_due',
    }
  }
  const open = openRequirementTasks(state)
  const raised = new Set(state.tasks.filter((t) => typeof t.requirement === 'string').map((t) => t.requirement!))
  const provided = providedKeys(state.onboarding, state.terms.version, now, rules)
  const pastDue = open.filter((t) => t.dueAt !== null && Date.parse(t.dueAt) <= now).map((t) => t.requirement!)
  const pendingVerification = new Set(open.filter((t) => t.status === 'waiting_review').map((t) => t.requirement!))
  if (account.verification === 'under_review') {
    for (const key of ['company.tax_id', `${rules.identityPrefix}.dob.day`, `${rules.identityPrefix}.first_name`]) if (provided.has(key)) pendingVerification.add(key)
  }
  const dated = open.filter((t) => t.dueAt !== null).map((t) => t.dueAt!).sort()
  let disabledReason: string | null = null
  if (account.closedAt) disabledReason = null
  else if (account.verification === 'rejected') disabledReason = `rejected.${account.declineReason ?? 'other'}`
  else if (account.verification === 'under_review') disabledReason = 'requirements.pending_verification'
  else if (account.verification === 'action_required') disabledReason = 'requirements.past_due'
  else if (pastDue.length) disabledReason = 'requirements.past_due'
  return {
    currentlyDue: open.map((t) => t.requirement!),
    eventuallyDue: rules.dueLater.filter((d) => !provided.has(d.key) && !raised.has(d.key)),
    pastDue,
    pendingVerification: [...pendingVerification],
    errors: open.filter((t) => t.errorCode).map((t) => ({ code: t.errorCode!, reason: t.errorReason ?? '', requirement: t.requirement! })),
    currentDeadline: dated[0] ?? null,
    disabledReason,
  }
}

// ── The review step's checklist ───────────────────────────────────────────

export interface ChecklistItem {
  key: string
  title: string
  detail: string
  step: OnboardingStepKey
  complete: boolean
  /** Due-later rows: when the partner will ask. */
  trigger?: string
}

export interface PartnerChecklist {
  dueNow: ChecklistItem[]
  dueLater: ChecklistItem[]
}

/** What our payments partner will check, grouped the way the merchant thinks about it. */
export function partnerChecklist(draft: OnboardingDraft, rules: OnboardingRules, termsVersion: string, nowMs: number): PartnerChecklist {
  const provided = providedKeys(draft, termsVersion, nowMs, rules)
  const keys = [...rules.fields]
  const group = (key: string, title: string, detail: string, step: OnboardingStepKey, match: (k: RequirementKey) => boolean): ChecklistItem | null => {
    const mine = keys.filter(match)
    if (!mine.length) return null
    return { key, title, detail, step, complete: mine.every((k) => provided.has(k)) }
  }
  const identity = rules.businessType === 'individual' ? 'individual.' : 'representative.'
  const dueNow = [
    group('identity', rules.businessType === 'individual' ? 'Your business' : 'Business identity',
      `${rules.labels.taxId.label}, address, industry and website`, 'verify',
      (k) => k.startsWith('company.') && !/_provided$/.test(k) || k.startsWith('business_profile.')),
    group('representative', rules.businessType === 'individual' ? 'About you' : 'Representative',
      'Name, contact details, date of birth and home address', 'verify', (k) => k.startsWith(identity)),
    group('people', 'Owners, directors and executives', 'Everyone the partner needs to know about, confirmed', 'verify',
      (k) => /^(owner|director|executive)s\./.test(k) || /_provided$/.test(k)),
    group('terms', 'Terms of service', 'Accepted, with the date, IP address and browser', 'terms', (k) => k.startsWith('tos_acceptance.')),
    group('payout', 'Payout account', 'Where your money is sent', 'payout', (k) => k === 'external_account'),
    group('descriptor', 'Statement descriptor', 'What shoppers see on their card statement', 'public', (k) => k === 'settings.payments.statement_descriptor'),
  ].filter((g): g is ChecklistItem => g !== null)
  const dueLater = rules.dueLater.map((item) => ({
    key: item.key,
    title: requirementLabel(item.key, rules),
    detail: item.trigger,
    step: requirementField(item.key).step,
    complete: provided.has(item.key),
    trigger: item.trigger,
  }))
  return { dueNow, dueLater }
}
