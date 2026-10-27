/**
 * Register sale maths for the POS preview — pure, so the totals a cashier reads
 * out loud can be proven to add up (tests/pos/sale.test.ts). No Vue, no stores.
 *
 * Money is computed in integer cents and handed back in dollars, so every row
 * in the totals block sums exactly to the total shown on the Charge button.
 */

export type Country = 'US' | 'CA' | 'AU' | 'NZ'

const cents = (n: number) => Math.round(n * 100)
const dollars = (c: number) => c / 100

/* ── Money format ──────────────────────────────────────────────── */

const MONEY: Record<Country, { locale: string; currency: string }> = {
  AU: { locale: 'en-AU', currency: 'AUD' },
  CA: { locale: 'en-CA', currency: 'CAD' },
  NZ: { locale: 'en-NZ', currency: 'NZD' },
  US: { locale: 'en-US', currency: 'USD' },
}

export function formatMoney(amount: number, country: Country): string {
  const { locale, currency } = MONEY[country]
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function formatDate(iso: string, country: Country): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(MONEY[country].locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Tax ───────────────────────────────────────────────────────── */

export interface TaxRule {
  /** inclusive = shelf prices already contain the tax (AU/NZ GST); exclusive = added at checkout (CA, US). */
  mode: 'inclusive' | 'exclusive'
  components: { label: string; rate: number }[]
}

const CA_PROVINCES: Record<string, TaxRule['components']> = {
  BC: [{ label: 'GST', rate: 0.05 }, { label: 'PST', rate: 0.07 }],
  ON: [{ label: 'HST', rate: 0.13 }],
  QC: [{ label: 'GST', rate: 0.05 }, { label: 'QST', rate: 0.09975 }],
}

export function taxRuleFor(country: Country, region?: string): TaxRule {
  switch (country) {
    case 'AU': return { mode: 'inclusive', components: [{ label: 'GST', rate: 0.1 }] }
    case 'NZ': return { mode: 'inclusive', components: [{ label: 'GST', rate: 0.15 }] }
    case 'CA': return { mode: 'exclusive', components: CA_PROVINCES[region ?? ''] ?? [{ label: 'GST', rate: 0.05 }] }
    // US rates vary by city; the preview keeps its earlier flat 10% until a US pass.
    case 'US': return { mode: 'exclusive', components: [{ label: 'Tax', rate: 0.1 }] }
  }
}

export function taxRuleSummary(rule: TaxRule): string {
  const parts = rule.components.map((c) => `${c.label} ${+(c.rate * 100).toFixed(3)}%`).join(' + ')
  return rule.mode === 'inclusive' ? `${parts} · included in prices` : `${parts} · added at checkout`
}

/* ── Lines, promotions, line discounts ─────────────────────────── */

export const DISCOUNT_REASONS = ['Price match', 'Damaged', 'Staff', 'Loyalty', 'Other'] as const
export type DiscountReason = typeof DISCOUNT_REASONS[number]

export interface LineDiscount {
  kind: 'percent' | 'amount'
  /** percent: 0–100 · amount: dollars off the whole line */
  value: number
  reason: DiscountReason
}

export interface SaleLine {
  sku: string
  /** Unit sell price after any override. */
  price: number
  qty: number
  discount?: LineDiscount | null
}

/**
 * Automatic register promotions. The shared promotions store has no product
 * scope, so the preview keeps its sale rules here (same approach as the mocked
 * per-location stock).
 */
export interface PosPromotion {
  id: string
  title: string
  percent: number
  skuPrefixes: string[]
}

export const POS_PROMOTIONS: PosPromotion[] = [
  { id: 'spring-30', title: 'Spring sale', percent: 30, skuPrefixes: ['TEE-', 'HOOD-'] },
]

export function promotionFor(sku: string, promos: PosPromotion[]): PosPromotion | null {
  return promos.find((p) => p.skuPrefixes.some((prefix) => sku.startsWith(prefix))) ?? null
}

export interface LineNote {
  kind: 'promo' | 'discount'
  label: string
  /** Negative dollars. */
  amount: number
}

export interface LineBreakdown {
  gross: number
  notes: LineNote[]
  final: number
}

function lineCents(line: SaleLine, promos: PosPromotion[]) {
  const gross = cents(line.price * line.qty)
  const promo = promotionFor(line.sku, promos)
  const promoOff = promo ? Math.round(gross * promo.percent / 100) : 0
  const afterPromo = gross - promoOff
  const d = line.discount
  const manualOff = !d ? 0 : Math.min(afterPromo, d.kind === 'percent'
    ? Math.round(afterPromo * Math.min(100, Math.max(0, d.value)) / 100)
    : Math.max(0, cents(d.value)))
  return { gross, promo, promoOff, manualOff, final: afterPromo - manualOff }
}

export function lineBreakdown(line: SaleLine, promos: PosPromotion[]): LineBreakdown {
  const c = lineCents(line, promos)
  const notes: LineNote[] = []
  if (c.promo && c.promoOff > 0) notes.push({ kind: 'promo', label: `${c.promo.title} ${c.promo.percent}%`, amount: -dollars(c.promoOff) })
  if (line.discount && c.manualOff > 0) {
    const what = line.discount.kind === 'percent' ? ` ${line.discount.value}%` : ''
    notes.push({ kind: 'discount', label: `${line.discount.reason}${what}`, amount: -dollars(c.manualOff) })
  }
  return { gross: dollars(c.gross), notes, final: dollars(c.final) }
}

/* ── Coupons ───────────────────────────────────────────────────── */

/** The subset of the commerce store's Promotion a coupon check reads. */
export interface CouponSource {
  title: string
  mechanism: string
  code?: string
  discountType: 'Percentage' | 'Fixed' | string
  value: number
  salesChannels: string[]
  startDate: string
  endDate?: string
  status: string
  usage: number
  limit: number | null
}

export interface Coupon {
  code: string
  title: string
  kind: 'percent' | 'amount'
  value: number
}

export type CouponResult = { ok: true; coupon: Coupon } | { ok: false; reason: string }

export function validateCoupon(input: string, sources: CouponSource[], todayIso: string, country: Country): CouponResult {
  const code = input.trim().toUpperCase()
  if (!code) return { ok: false, reason: 'Enter a coupon code' }
  const src = sources.find((s) => s.mechanism === 'Code' && s.code?.toUpperCase() === code)
  if (!src) return { ok: false, reason: `No coupon matches “${code}”` }
  if (src.endDate && src.endDate < todayIso) return { ok: false, reason: `Expired ${formatDate(src.endDate, country)}` }
  if (src.status !== 'Active') return { ok: false, reason: 'This code is switched off' }
  if (src.startDate > todayIso) return { ok: false, reason: `Starts ${formatDate(src.startDate, country)}` }
  if (!src.salesChannels.includes('POS')) return { ok: false, reason: 'Online-only code — not valid at the register' }
  if (src.limit !== null && src.usage >= src.limit) return { ok: false, reason: 'Usage limit reached' }
  return {
    ok: true,
    coupon: { code, title: src.title, kind: src.discountType === 'Percentage' ? 'percent' : 'amount', value: src.value },
  }
}

/* ── Sale totals ───────────────────────────────────────────────── */

export interface DiscountRow {
  key: string
  label: string
  /** Negative dollars. */
  amount: number
}

export interface TaxRow {
  label: string
  rate: number
  amount: number
}

export interface SaleTotals {
  /** Before any discount. */
  subtotal: number
  discounts: DiscountRow[]
  /** Sum of `discounts` (negative). */
  discountTotal: number
  taxMode: TaxRule['mode']
  /** exclusive: rows added to reach the total · inclusive: tax already inside the total. */
  taxes: TaxRow[]
  total: number
}

/** Applied in this order: automatic promos → item discounts → whole-sale discount → coupon. */
export function saleTotals(
  lines: SaleLine[],
  opts: { promos: PosPromotion[]; orderDiscount?: LineDiscount | null; coupon?: Coupon | null; taxRule: TaxRule },
): SaleTotals {
  let subtotal = 0
  let afterLines = 0
  const promoOff = new Map<string, { title: string; percent: number; off: number }>()
  let manualOff = 0
  for (const line of lines) {
    const c = lineCents(line, opts.promos)
    subtotal += c.gross
    afterLines += c.final
    if (c.promo && c.promoOff > 0) {
      const prev = promoOff.get(c.promo.id)
      promoOff.set(c.promo.id, { title: c.promo.title, percent: c.promo.percent, off: (prev?.off ?? 0) + c.promoOff })
    }
    manualOff += c.manualOff
  }

  const discounts: DiscountRow[] = []
  for (const [id, p] of promoOff) discounts.push({ key: `promo-${id}`, label: `${p.title} ${p.percent}%`, amount: -dollars(p.off) })
  if (manualOff > 0) discounts.push({ key: 'line', label: 'Item discounts', amount: -dollars(manualOff) })

  let orderOff = 0
  const od = opts.orderDiscount
  if (od) {
    orderOff = Math.min(afterLines, od.kind === 'percent'
      ? Math.round(afterLines * Math.min(100, Math.max(0, od.value)) / 100)
      : Math.max(0, cents(od.value)))
    const what = od.kind === 'percent' ? `Sale discount ${od.value}%` : 'Sale discount'
    if (orderOff > 0) discounts.push({ key: 'order', label: `${what} · ${od.reason}`, amount: -dollars(orderOff) })
  }
  const afterOrder = afterLines - orderOff

  let couponOff = 0
  if (opts.coupon) {
    couponOff = Math.min(afterOrder, opts.coupon.kind === 'percent'
      ? Math.round(afterOrder * opts.coupon.value / 100)
      : cents(opts.coupon.value))
    if (couponOff > 0) discounts.push({ key: 'coupon', label: `Coupon ${opts.coupon.code}`, amount: -dollars(couponOff) })
  }

  const base = afterOrder - couponOff
  const rule = opts.taxRule
  const taxes: TaxRow[] = rule.mode === 'exclusive'
    ? rule.components.map((c) => ({ label: c.label, rate: c.rate, amount: dollars(Math.round(base * c.rate)) }))
    : rule.components.map((c) => ({ label: c.label, rate: c.rate, amount: dollars(Math.round(base * c.rate / (1 + c.rate))) }))
  const added = rule.mode === 'exclusive' ? taxes.reduce((s, t) => s + cents(t.amount), 0) : 0

  return {
    subtotal: dollars(subtotal),
    discounts,
    discountTotal: dollars(-(subtotal - base)),
    taxMode: rule.mode,
    taxes,
    total: dollars(base + added),
  }
}

/* ── Cash ──────────────────────────────────────────────────────── */

/** AU and CA have both withdrawn the 1c coin: cash totals round to the nearest 5c. Card stays exact. */
export function cashRound(amount: number): number {
  return dollars(Math.round(cents(amount) / 5) * 5)
}

export function changeDue(tendered: number, due: number): number {
  return dollars(Math.max(0, cents(tendered) - cents(due)))
}

/** Exact amount plus the next few note-sized amounts a customer is likely to hand over. */
export function quickTenderAmounts(due: number): number[] {
  const due100 = cents(due)
  const next = [500, 1000, 2000, 5000, 10000]
    .map((step) => Math.ceil(due100 / step) * step)
    .filter((c) => c > due100)
  return [due100, ...new Set(next)].slice(0, 4).map(dollars)
}

/* ── Customer details ──────────────────────────────────────────── */

export interface CustomerDraft {
  firstName: string
  lastName: string
  email: string
  phone: string
  note: string
  emailReceipts: boolean
  marketingEmail: boolean
  marketingSms: boolean
}

export interface CustomerIdentity {
  id: number
  name: string
  email: string
  phone: string
}

export type CustomerField = 'firstName' | 'email' | 'phone'

export interface CustomerValidation {
  errors: Partial<Record<CustomerField, string>>
  /** Another customer already owns this email or phone. */
  duplicate: { id: number; name: string; field: 'email' | 'phone' } | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Digits in national form: +61 412… → 0412…, +1 604… → 604…. */
export function normalizePhone(raw: string, country: Country): string {
  let d = raw.replace(/\D/g, '')
  if (country === 'AU' && d.startsWith('61')) d = `0${d.slice(2)}`
  if (country === 'NZ' && d.startsWith('64')) d = `0${d.slice(2)}`
  if ((country === 'CA' || country === 'US') && d.length === 11 && d.startsWith('1')) d = d.slice(1)
  return d
}

const PHONE_RULES: Record<Country, { re: RegExp; example: string }> = {
  AU: { re: /^0[2-478]\d{8}$/, example: '0412 345 678' },
  NZ: { re: /^0\d{7,9}$/, example: '021 123 4567' },
  CA: { re: /^[2-9]\d{9}$/, example: '(604) 555-0123' },
  US: { re: /^[2-9]\d{9}$/, example: '(212) 555-0123' },
}

export function phoneExample(country: Country): string {
  return PHONE_RULES[country].example
}

export function formatPhone(raw: string, country: Country): string {
  const d = normalizePhone(raw, country)
  if (!PHONE_RULES[country].re.test(d)) return raw.trim()
  if (country === 'CA' || country === 'US') return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (country === 'AU') return d.startsWith('04') ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export function validateCustomer(
  draft: CustomerDraft,
  country: Country,
  others: CustomerIdentity[],
  selfId: number | null,
): CustomerValidation {
  const errors: CustomerValidation['errors'] = {}
  const email = draft.email.trim().toLowerCase()
  const phone = normalizePhone(draft.phone, country)

  if (!draft.firstName.trim()) errors.firstName = 'Enter a first name'
  if (email && !EMAIL_RE.test(email)) errors.email = 'Enter an email like name@example.com'
  else if (!email && draft.emailReceipts) errors.email = 'Add an email to send receipts'
  if (draft.phone.trim() && !PHONE_RULES[country].re.test(phone)) errors.phone = `Use a number like ${PHONE_RULES[country].example}`
  else if (!draft.phone.trim() && draft.marketingSms) errors.phone = 'Add a mobile number for SMS'

  let duplicate: CustomerValidation['duplicate'] = null
  for (const o of others) {
    if (o.id === selfId) continue
    if (email && !errors.email && o.email.trim().toLowerCase() === email) { duplicate = { id: o.id, name: o.name, field: 'email' }; break }
    if (phone && !errors.phone && normalizePhone(o.phone, country) === phone) { duplicate = { id: o.id, name: o.name, field: 'phone' }; break }
  }
  if (duplicate) errors[duplicate.field] = `Already used by ${duplicate.name}`

  return { errors, duplicate }
}
