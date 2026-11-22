import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  POS_PROMOTIONS, cashRound, changeDue, formatPhone, lineBreakdown, quickTenderAmounts, saleTotals,
  taxRuleFor, taxRuleSummary, validateCoupon, validateCustomer,
  type CouponSource, type CustomerDraft, type SaleLine, type SaleTotals,
} from '../../src/views/Retail/pos/saleModel.ts'

const c = (n: number) => Math.round(n * 100)

/** Every visible row must add up to the total the cashier reads out. */
function assertReconciles(t: SaleTotals) {
  assert.equal(c(t.discountTotal), t.discounts.reduce((s, d) => s + c(d.amount), 0), 'discount rows sum to the discount total')
  const added = t.taxMode === 'exclusive' ? t.taxes.reduce((s, x) => s + c(x.amount), 0) : 0
  assert.equal(c(t.subtotal) + c(t.discountTotal) + added, c(t.total), 'subtotal + discounts + added tax = total')
}

const basket: SaleLine[] = [
  { sku: 'TEE-001-BLK-M', price: 39, qty: 2, discount: { kind: 'percent', value: 10, reason: 'Staff' } }, // promo + manual
  { sku: 'HOOD-101-GRY-L', price: 89, qty: 1 },                                                          // promo only
  { sku: 'CAP-001-NVY', price: 35, qty: 1, discount: { kind: 'amount', value: 5, reason: 'Damaged' } },   // manual only
  { sku: 'SNEAK-A1-WHT-10', price: 159, qty: 1 },                                                       // full price
]

const coupons: CouponSource[] = [
  { title: 'Refer a friend', mechanism: 'Code', code: 'REFER20', discountType: 'Percentage', value: 20, salesChannels: ['Online Store', 'POS'], startDate: '2026-01-01', status: 'Active', usage: 234, limit: null },
  { title: 'VIP $30 off', mechanism: 'Code', code: 'VIP30OFF', discountType: 'Fixed', value: 30, salesChannels: ['Online Store'], startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active', usage: 89, limit: 200 },
  { title: 'Flash $5 off', mechanism: 'Code', code: 'FLASH5', discountType: 'Fixed', value: 5, salesChannels: ['Online Store'], startDate: '2025-01-01', endDate: '2025-12-31', status: 'Inactive', usage: 4523, limit: 5000 },
  { title: 'Capped', mechanism: 'Code', code: 'CAPPED', discountType: 'Fixed', value: 5, salesChannels: ['POS'], startDate: '2026-01-01', status: 'Active', usage: 10, limit: 10 },
]
const TODAY = '2026-10-27'

test('line breakdown stacks the automatic promo, then the manual discount, and shows the final line total', () => {
  const b = lineBreakdown(basket[0]!, POS_PROMOTIONS)
  assert.equal(b.gross, 78)
  assert.deepEqual(b.notes.map((n) => [n.kind, n.amount]), [['promo', -23.4], ['discount', -5.46]])
  assert.equal(b.final, 49.14)
  assert.equal(lineBreakdown(basket[2]!, POS_PROMOTIONS).final, 30)
  assert.equal(lineBreakdown({ sku: 'CAP-001-NVY', price: 35, qty: 1, discount: { kind: 'amount', value: 99, reason: 'Other' } }, POS_PROMOTIONS).final, 0, 'a discount never takes a line below zero')
})

test('AU: GST is included, the rows reconcile, and the coupon is one of the discounts', () => {
  const coupon = validateCoupon('refer20', coupons, TODAY, 'AU')
  assert.ok(coupon.ok)
  const t = saleTotals(basket, { promos: POS_PROMOTIONS, coupon: coupon.coupon, taxRule: taxRuleFor('AU', 'NSW') })
  assertReconciles(t)
  assert.equal(t.taxMode, 'inclusive')
  assert.deepEqual(t.discounts.map((d) => d.key), ['promo-spring-30', 'line', 'coupon'])
  assert.equal(t.subtotal, 361)
  // 49.14 + 62.30 + 30 + 159 = 300.44 → REFER20 −60.09 → 240.35, GST = 1/11
  assert.equal(t.total, 240.35)
  assert.equal(t.taxes[0]!.amount, 21.85)
})

test('CA (BC): GST and PST are added on top as separate rows that reconcile', () => {
  const t = saleTotals(basket, { promos: POS_PROMOTIONS, taxRule: taxRuleFor('CA', 'BC') })
  assertReconciles(t)
  assert.deepEqual(t.taxes.map((x) => [x.label, x.amount]), [['GST', 15.02], ['PST', 21.03]])
  assert.equal(t.total, 336.49)
  assert.equal(taxRuleSummary(taxRuleFor('CA', 'BC')), 'GST 5% + PST 7% · added at checkout')
  assert.equal(taxRuleSummary(taxRuleFor('AU')), 'GST 10% · included in prices')
  assert.deepEqual(taxRuleFor('CA', 'ON').components, [{ label: 'HST', rate: 0.13 }])
})

test('a whole-sale discount sits between item discounts and the coupon', () => {
  const t = saleTotals(basket, {
    promos: POS_PROMOTIONS,
    orderDiscount: { kind: 'percent', value: 10, reason: 'Loyalty' },
    coupon: { code: 'REFER20', title: 'Refer a friend', kind: 'percent', value: 20 },
    taxRule: taxRuleFor('CA', 'BC'),
  })
  assertReconciles(t)
  assert.deepEqual(t.discounts.map((d) => [d.key, d.label, d.amount]), [
    ['promo-spring-30', 'Spring sale 30%', -50.1],
    ['line', 'Item discounts', -10.46],
    ['order', 'Sale discount 10% · Loyalty', -30.04],
    ['coupon', 'Coupon REFER20', -54.08],
  ])
})

test('reconciles for many random baskets in every market', () => {
  let seed = 7
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const skus = ['TEE-001-WHT-M', 'HOOD-101-GRY-L', 'BAG-LTH-BLK', 'JEAN-512-DRK-32']
  for (let i = 0; i < 300; i++) {
    const lines: SaleLine[] = skus.slice(0, 1 + Math.floor(rnd() * 4)).map((sku) => ({
      sku, price: Math.round(rnd() * 30000) / 100, qty: 1 + Math.floor(rnd() * 4),
      discount: rnd() < 0.4 ? { kind: rnd() < 0.5 ? 'percent' : 'amount', value: Math.round(rnd() * 40), reason: 'Other' } : null,
    }))
    const coupon = rnd() < 0.5 ? { code: 'X', title: 'X', kind: 'percent' as const, value: 15 } : { code: 'Y', title: 'Y', kind: 'amount' as const, value: 1000 }
    for (const [country, region] of [['AU', 'NSW'], ['CA', 'BC'], ['CA', 'ON'], ['CA', 'QC'], ['NZ', ''], ['US', 'NY']] as const) {
      const orderDiscount = rnd() < 0.3 ? { kind: 'amount' as const, value: Math.round(rnd() * 50), reason: 'Other' as const } : null
      const t = saleTotals(lines, { promos: POS_PROMOTIONS, orderDiscount, coupon, taxRule: taxRuleFor(country, region) })
      assertReconciles(t)
      assert.ok(t.total >= 0)
    }
  }
})

test('coupon checks give the cashier a reason they can say out loud', () => {
  assert.deepEqual(validateCoupon(' Refer20 ', coupons, TODAY, 'AU'), { ok: true, coupon: { code: 'REFER20', title: 'Refer a friend', kind: 'percent', value: 20 } })
  assert.deepEqual(validateCoupon('VIP30OFF', coupons, TODAY, 'AU'), { ok: false, reason: 'Online-only code — not valid at the register' })
  assert.deepEqual(validateCoupon('FLASH5', coupons, TODAY, 'AU'), { ok: false, reason: 'Expired 31 Dec 2025' })
  assert.deepEqual(validateCoupon('CAPPED', coupons, TODAY, 'CA'), { ok: false, reason: 'Usage limit reached' })
  assert.deepEqual(validateCoupon('NOPE', coupons, TODAY, 'CA'), { ok: false, reason: 'No coupon matches “NOPE”' })
  assert.deepEqual(validateCoupon('  ', coupons, TODAY, 'CA'), { ok: false, reason: 'Enter a coupon code' })
})

test('cash rounds to the nearest 5c (no 1c coin in AU or CA); change is exact', () => {
  assert.equal(cashRound(174.68), 174.7)
  assert.equal(cashRound(84.62), 84.6)
  assert.deepEqual([10.01, 10.02, 10.03, 10.04, 10.06, 10.07, 10.08, 10.09].map(cashRound), [10, 10, 10.05, 10.05, 10.05, 10.05, 10.1, 10.1])
  assert.deepEqual(quickTenderAmounts(174.7), [174.7, 175, 180, 200])
  assert.deepEqual(quickTenderAmounts(20), [20, 50, 100])
  assert.equal(changeDue(200, 174.7), 25.3)
  assert.equal(changeDue(100, 174.7), 0)
})

const draft = (patch: Partial<CustomerDraft> = {}): CustomerDraft => ({
  firstName: 'Mia', lastName: 'Nguyen', email: '', phone: '', note: '',
  emailReceipts: false, marketingEmail: false, marketingSms: false, ...patch,
})
const others = [
  { id: 1, name: 'Maya Diaz', email: 'maya@example.com', phone: '0412 345 678' },
  { id: 2, name: 'Liam Chen', email: 'liam@example.ca', phone: '(604) 555-0123' },
]

test('customer details: name, email and phone are checked for the store’s country', () => {
  assert.deepEqual(validateCustomer(draft(), 'AU', others, null).errors, {})
  assert.equal(validateCustomer(draft({ firstName: ' ' }), 'AU', others, null).errors.firstName, 'Enter a first name')
  assert.equal(validateCustomer(draft({ email: 'mia@' }), 'AU', others, null).errors.email, 'Enter an email like name@example.com')
  assert.equal(validateCustomer(draft({ emailReceipts: true }), 'AU', others, null).errors.email, 'Add an email to send receipts')
  assert.equal(validateCustomer(draft({ marketingSms: true }), 'CA', others, null).errors.phone, 'Add a mobile number for SMS')
  // AU accepts local and +61 forms; a Canadian number typed without its code is read as Australian
  assert.deepEqual(validateCustomer(draft({ phone: '+61 400 111 222' }), 'AU', others, null).errors, {})
  assert.equal(validateCustomer(draft({ phone: '604 555 0199' }), 'AU', others, null).errors.phone,
    'Use a number like 0412 345 678, or start with + and the country code')
  // CA accepts NANP with or without the leading 1
  assert.deepEqual(validateCustomer(draft({ phone: '1-604-555-0199' }), 'CA', others, null).errors, {})
  assert.equal(validateCustomer(draft({ phone: '0412 345 678' }), 'CA', others, null).errors.phone,
    'Use a number like (604) 555-0123, or start with + and the country code')
  // Stored with the country code
  assert.equal(formatPhone('+61400111222', 'AU'), '+61 400 111 222')
  assert.equal(formatPhone('0298765432', 'AU'), '+61 2 9876 5432')
  assert.equal(formatPhone('16045550199', 'CA'), '+1 (604) 555-0199')
})

test('customer details: a duplicate email or phone points at the existing customer, but never at yourself', () => {
  const dupEmail = validateCustomer(draft({ email: 'MAYA@example.com' }), 'AU', others, null)
  assert.deepEqual(dupEmail.duplicate, { id: 1, name: 'Maya Diaz', field: 'email' })
  assert.equal(dupEmail.errors.email, 'Already used by Maya Diaz')
  assert.deepEqual(validateCustomer(draft({ phone: '+1 604 555 0123' }), 'CA', others, null).duplicate, { id: 2, name: 'Liam Chen', field: 'phone' })
  assert.equal(validateCustomer(draft({ email: 'maya@example.com' }), 'AU', others, 1).duplicate, null, 'editing Maya keeps her own email')
  assert.deepEqual(validateCustomer(draft({ phone: '+61 412 345 678' }), 'AU', others, null).duplicate, { id: 1, name: 'Maya Diaz', field: 'phone' }, '+61 and 0 forms are the same number')
})

test('customer details: a visitor’s number with + and a country code works at any store', () => {
  // A New Yorker shopping in Sydney, an Australian shopping in Vancouver, a Kiwi anywhere
  assert.deepEqual(validateCustomer(draft({ phone: '+1 (646) 555-0117' }), 'AU', others, null).errors, {})
  assert.deepEqual(validateCustomer(draft({ phone: '+61 412 999 000' }), 'CA', others, null).errors, {})
  assert.deepEqual(validateCustomer(draft({ phone: '+64 21 123 4567' }), 'AU', others, null).errors, {})
  assert.deepEqual(validateCustomer(draft({ phone: '+44 20 7946 0958' }), 'CA', others, null).errors, {})
  // Still checked: a short or malformed international number
  assert.equal(validateCustomer(draft({ phone: '+1 646' }), 'AU', others, null).errors.phone, 'Check the number — country code, then the full number')
  assert.equal(validateCustomer(draft({ phone: '+61 99' }), 'CA', others, null).errors.phone, 'Check the number — country code, then the full number')
  // Saved in a form every store reads the same way
  assert.equal(formatPhone('+1 646 555 0117', 'AU'), '+1 (646) 555-0117')
  assert.equal(formatPhone('+61412999000', 'CA'), '+61 412 999 000')
  assert.equal(formatPhone('+44  20 7946 0958', 'AU'), '+44 20 7946 0958')
  // And a duplicate is found across stores and formats
  const withOwen = [...others, { id: 3, name: 'Owen Castillo', email: 'owen@example.com', phone: '+1 (646) 555-0117' }]
  assert.deepEqual(validateCustomer(draft({ phone: '+1 646 555 0117' }), 'AU', withOwen, null).duplicate, { id: 3, name: 'Owen Castillo', field: 'phone' })
})
