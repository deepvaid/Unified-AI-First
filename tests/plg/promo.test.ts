import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BLACK_FRIDAY_PROMO as promo, activePromo, promoSaving, validateCoupon } from '../../src/plg/promo.ts'

const LIST = 300 // monthly list price of an eligible plan
const ANNUAL = LIST * 12 * 0.8 // the standing 20% annual discount

test('the annual coupon tops the standing discount up to 30% off list', () => {
  const saving = promoSaving(promo, [{ tier: 'essential', price: ANNUAL }], 'annual')
  assert.equal(ANNUAL - saving, LIST * 12 * 0.7)
})

test('the monthly coupon takes 30% off each discounted invoice', () => {
  assert.equal(promoSaving(promo, [{ tier: 'professional', price: LIST }], 'monthly'), 90)
  assert.equal(promo.coupons.monthly.invoices, 3)
})

test('Build is never discounted', () => {
  assert.equal(promoSaving(promo, [{ tier: 'build', price: 29 }], 'monthly'), 0)
  assert.equal(promoSaving(promo, [{ tier: 'build', price: 29 * 12 * 0.8 }], 'annual'), 0)
})

test('a mixed cart discounts the eligible plans only', () => {
  const lines = [
    { tier: 'essential', price: LIST },
    { tier: 'build', price: 29 },
  ]
  assert.equal(promoSaving(promo, lines, 'monthly'), 90)
})

test('savings round to the cent', () => {
  assert.equal(promoSaving(promo, [{ tier: 'essential', price: 299 }], 'monthly'), 89.7)
})

test('each code works on its own billing cycle only', () => {
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', ['essential'])?.code, 'BF26MONTH3')
  assert.equal(validateCoupon(promo, 'BF26ANNUAL', 'annual', ['essential'])?.code, 'BF26ANNUAL')
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'annual', ['essential']), null)
  assert.equal(validateCoupon(promo, 'BF26ANNUAL', 'monthly', ['essential']), null)
})

test('a code needs an eligible plan in the cart', () => {
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', ['build']), null)
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', []), null)
  assert.equal(validateCoupon(promo, 'BF26MONTH3', 'monthly', ['build', 'professional'])?.code, 'BF26MONTH3')
})

test('a pasted code survives stray spaces and lower case', () => {
  assert.equal(validateCoupon(promo, '  bf26month3 ', 'monthly', ['essential'])?.code, 'BF26MONTH3')
  assert.equal(validateCoupon(promo, 'BF26', 'monthly', ['essential']), null)
  assert.equal(validateCoupon(promo, '', 'monthly', ['essential']), null)
})

test('the offer runs through 31 December 2026', () => {
  assert.equal(activePromo(new Date(2026, 10, 10)), promo)
  assert.equal(activePromo(new Date(2026, 11, 31, 23, 59)), promo)
  assert.equal(activePromo(new Date(2027, 0, 1)), null)
})
