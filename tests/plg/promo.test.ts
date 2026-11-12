import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BLACK_FRIDAY_PROMO as promo, activePromo, isEligible, promoSaving, validateCoupon } from '../../src/plg/promo.ts'

const LIST = 300 // monthly list price of an eligible plan
const ANNUAL = LIST * 12 * 0.8 // the standing 20% annual discount

const essential = { cloud: 'marketing', tier: 'essential' }
const build = { cloud: 'marketing', tier: 'build' }
const retail = { cloud: 'retail', tier: 'professional' }

test('the annual coupon tops the standing discount up to 30% off list', () => {
  const saving = promoSaving(promo, [{ ...essential, price: ANNUAL }], 'annual')
  assert.equal(ANNUAL - saving, LIST * 12 * 0.7)
})

test('the monthly coupon takes 30% off each discounted invoice', () => {
  assert.equal(promoSaving(promo, [{ cloud: 'service', tier: 'professional', price: LIST }], 'monthly'), 90)
  assert.equal(promo.coupons.monthly.invoices, 3)
})

test('the codes cover Marketing, Commerce and Service, Essential and above', () => {
  for (const cloud of ['marketing', 'commerce', 'service']) {
    for (const tier of ['essential', 'professional', 'enterprise']) {
      assert.equal(isEligible(promo, { cloud, tier }), true, `${cloud} ${tier}`)
    }
    assert.equal(isEligible(promo, { cloud, tier: 'build' }), false, `${cloud} build`)
  }
})

test('Build is never discounted', () => {
  assert.equal(promoSaving(promo, [{ ...build, price: 29 }], 'monthly'), 0)
  assert.equal(promoSaving(promo, [{ ...build, price: 29 * 12 * 0.8 }], 'annual'), 0)
})

test('Retail Cloud is never discounted, whatever the tier', () => {
  assert.equal(isEligible(promo, retail), false)
  assert.equal(isEligible(promo, { cloud: 'retail', tier: 'enterprise' }), false)
  assert.equal(promoSaving(promo, [{ ...retail, price: LIST }], 'monthly'), 0)
})

test('a mixed cart discounts the eligible plans only', () => {
  const lines = [
    { ...essential, price: LIST },
    { cloud: 'commerce', tier: 'build', price: 29 },
    { ...retail, price: 500 },
  ]
  assert.equal(promoSaving(promo, lines, 'monthly'), 90)
})

test('savings round to the cent', () => {
  assert.equal(promoSaving(promo, [{ ...essential, price: 299 }], 'monthly'), 89.7)
})

test('each code works on its own billing cycle only', () => {
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', [essential])?.code, 'BF26MONTH3')
  assert.equal(validateCoupon(promo, 'BF26ANNUAL', 'annual', [essential])?.code, 'BF26ANNUAL')
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'annual', [essential]), null)
  assert.equal(validateCoupon(promo, 'BF26ANNUAL', 'monthly', [essential]), null)
})

test('a code needs an eligible plan in the cart', () => {
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', [build]), null)
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', [retail]), null)
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', []), null)
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', [build, retail, essential])?.code, 'BF26MONTH3')
})

test('a pasted code survives stray spaces and lower case', () => {
  assert.equal(validateCoupon(promo, '  bf26month3 ', 'monthly', [essential])?.code, 'BF26MONTH3')
  assert.equal(validateCoupon(promo, 'BF26', 'monthly', [essential]), null)
  assert.equal(validateCoupon(promo, '', 'monthly', [essential]), null)
})

test('the invoice wording says invoices, not months', () => {
  assert.equal(promo.coupons.monthly.description, 'Black Friday: 30% off first 3 invoices')
  assert.ok(promo.coupons.monthly.description.length <= 50)
})

test('the offer runs through 31 December 2026', () => {
  assert.equal(activePromo(new Date(2026, 10, 10)), promo)
  assert.equal(activePromo(new Date(2026, 11, 31, 23, 59)), promo)
  assert.equal(activePromo(new Date(2027, 0, 1)), null)
})
