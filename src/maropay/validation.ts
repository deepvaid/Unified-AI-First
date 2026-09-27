/**
 * Field validators shared by the setup wizard, the rules engine and the mock
 * adapter, so the "server" of this prototype refuses exactly what the form
 * flags. Every function returns a merchant-facing message, or null when the
 * value is fine.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { COUNTRY_LABELS, dobParts } from './model.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Card statement text: letters, digits, spaces and . - & only. */
const DESCRIPTOR = /^[A-Za-z0-9 .&-]+$/
const URL_LIKE = /^https?:\/\/[^\s/$.?#][^\s]*\.[a-z]{2,}(\/[^\s]*)?$/i

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

export function blank(value: string | null | undefined): boolean {
  return !value || !value.trim()
}

/** Adds the scheme the merchant left off ("atlas.example" → "https://atlas.example"). */
export function normaliseWebsite(value: string): string {
  const text = value.trim()
  if (!text || /^https?:\/\//i.test(text)) return text
  return `https://${text}`
}

export function websiteIssue(value: string): string | null {
  const text = normaliseWebsite(value)
  if (!text) return 'Enter the website shoppers buy from.'
  if (!URL_LIKE.test(text)) return 'Enter a full website address, like https://example.com.'
  return null
}

export function productDescriptionIssue(value: string): string | null {
  return value.trim().length >= 10 ? null : 'Describe what you sell in at least 10 characters.'
}

/** Phone numbers are kept as typed; only the digit count is checked. */
export function phoneIssue(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 'Enter a phone number.'
  if (digits.length < 7 || digits.length > 15) return 'Enter a phone number with the area code.'
  return null
}

const POSTAL: Record<string, { pattern: RegExp; example: string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, example: '94103' },
  CA: { pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, example: 'M5V 2T6' },
  AU: { pattern: /^\d{4}$/, example: '2000' },
  NZ: { pattern: /^\d{4}$/, example: '1010' },
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, example: 'SW1A 1AA' },
}

export function postalCodeExample(country: string): string {
  return POSTAL[country]?.example ?? '94103'
}

export function postalCodeIssue(value: string, country: string): string | null {
  const text = value.trim()
  if (!text) return 'Enter the postal code.'
  const rule = POSTAL[country]
  if (rule && !rule.pattern.test(text)) return `Enter a postal code like ${rule.example}.`
  return null
}

/** Age is worked out on the calendar, not in milliseconds, so a birthday counts on the day. */
export function ageOn(iso: string, nowMs: number): number | null {
  const parts = dobParts(iso)
  if (!parts) return null
  const today = new Date(nowMs)
  let age = today.getFullYear() - parts.year
  const hadBirthday = today.getMonth() + 1 > parts.month || (today.getMonth() + 1 === parts.month && today.getDate() >= parts.day)
  if (!hadBirthday) age -= 1
  return age
}

export function dobIssue(iso: string, nowMs: number, minAge = 18, maxAge = 120): string | null {
  if (!iso.trim()) return 'Enter the date of birth.'
  const parts = dobParts(iso)
  const valid = parts && parts.month >= 1 && parts.month <= 12 && parts.day >= 1 && parts.day <= 31
  if (!valid) return 'Enter the date of birth as a full date.'
  const age = ageOn(iso, nowMs)!
  if (age < minAge) return minAge === 18 ? 'They must be at least 18.' : `They must be between ${minAge} and ${maxAge} years old.`
  if (age > maxAge) return `They must be between ${minAge} and ${maxAge} years old.`
  return null
}

export function ssnLast4Issue(value: string | null): string | null {
  const text = (value ?? '').trim()
  if (!text) return 'Enter the last 4 digits of the SSN.'
  if (!/^\d{4}$/.test(text)) return 'Enter only the last 4 digits.'
  return null
}

/** Tax IDs are matched after spaces and dashes are stripped, so "12-3456789" and "12 3456789" both pass. */
export function normaliseTaxId(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}
