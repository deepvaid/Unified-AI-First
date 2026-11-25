import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromDecimal, money, toDecimal } from '../../src/maropay/money.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'
import {
  ONE_TIME, defaultOptionId, deliverySummary, fullPricePerDelivery, intervalLabel, linePlan, nextChargeDate,
  planErrors, plansForProduct, pricePerDelivery, purchaseOptions, recurringCharges, roundForDisplay,
} from '../../src/subscriptions/plans.ts'
import type { PlanInput, SubscriptionPlan } from '../../src/subscriptions/plans.ts'

const sek = (value: string) => fromDecimal(value, 'SEK')
const shown = (value: string) => formatStorePrice(roundForDisplay(sek(value)), 'sv-SE').replace(/\s/g, ' ')

const [THREE_MONTH, MONTHLY] = VITAHEAL_PLANS as [SubscriptionPlan, SubscriptionPlan]
const ELECTROLYTES = 2005
const NASAL_STRIPS = 2004

// ── The build prompt's test cases (S7): Electrolytes at 279 kr ───────────────

test('Electrolytes monthly is 223,20 kr per delivery', () => {
  assert.equal(toDecimal(pricePerDelivery(sek('279.00'), MONTHLY)), '223.20')
})

test('Electrolytes as a 3-month supply is 3 × 195,30 = 585,90 kr per delivery', () => {
  assert.equal(toDecimal(pricePerDelivery(sek('279.00'), { discountPct: 30, unitsPerDelivery: 1 })), '195.30')
  assert.equal(toDecimal(pricePerDelivery(sek('279.00'), THREE_MONTH)), '585.90')
})

test('kronor are shown without decimals: 223 kr and 586 kr', () => {
  assert.equal(shown('223.20'), '223 kr')
  assert.equal(shown('585.90'), '586 kr')
})

// ── Price ────────────────────────────────────────────────────────────────────

test('the discount is rounded on one unit, then multiplied, so a delivery is a whole number of unit prices', () => {
  // 99,95 at 15% off is 84,9575: 84,96 a unit, so 254,88 for three. Rounding the total instead would give 254,87.
  assert.equal(toDecimal(pricePerDelivery(sek('99.95'), { discountPct: 15, unitsPerDelivery: 3 })), '254.88')
})

test('a plan with no discount costs the unit price times its units', () => {
  assert.deepEqual(pricePerDelivery(sek('279.00'), { discountPct: 0, unitsPerDelivery: 2 }), sek('558.00'))
  assert.deepEqual(fullPricePerDelivery(sek('279.00'), THREE_MONTH), sek('837.00'))
})

test('only the display is rounded, and only for a currency shops write whole', () => {
  assert.deepEqual(roundForDisplay(sek('585.90')), sek('586.00'))
  assert.deepEqual(roundForDisplay(sek('223.50')), sek('224.00'))
  assert.deepEqual(roundForDisplay(money(22320, 'USD')), money(22320, 'USD'))
})

// ── Wording ──────────────────────────────────────────────────────────────────

test('intervals and deliveries read as a shopper would say them', () => {
  assert.equal(intervalLabel(MONTHLY), 'every month')
  assert.equal(intervalLabel(THREE_MONTH), 'every 3 months')
  assert.equal(intervalLabel({ intervalCount: 2, intervalUnit: 'week' }), 'every 2 weeks')
  assert.equal(deliverySummary(THREE_MONTH), '3 units every 3 months')
  assert.equal(deliverySummary(MONTHLY), '1 unit every month')
})

// ── Dates ────────────────────────────────────────────────────────────────────

test('the next charge is one interval after the checkout', () => {
  assert.equal(nextChargeDate('2026-11-17', MONTHLY), '2026-12-17')
  assert.equal(nextChargeDate('2026-11-17T09:30:00Z', THREE_MONTH), '2027-02-17')
  assert.equal(nextChargeDate('2026-11-17', { intervalCount: 2, intervalUnit: 'week' }), '2026-12-01')
})

test('a charge on a day the next month lacks lands on that month\'s last day', () => {
  assert.equal(nextChargeDate('2027-01-31', MONTHLY), '2027-02-28')
  assert.equal(nextChargeDate('2028-01-31', MONTHLY), '2028-02-29')
  assert.equal(nextChargeDate('2026-11-30', THREE_MONTH), '2027-02-28')
})

// ── What a shopper is offered ────────────────────────────────────────────────

test('a product on plans is offered them with the preselected one first, then buying once', () => {
  const options = purchaseOptions(sek('279.00'), plansForProduct([MONTHLY, THREE_MONTH], VITAHEAL_CHANNEL_ID, ELECTROLYTES))
  assert.deepEqual(options.map((o) => o.name), ['3-month supply', 'Monthly subscription', 'One-time purchase'])
  assert.deepEqual(options.map((o) => toDecimal(o.price)), ['585.90', '223.20', '279.00'])
  assert.deepEqual(options.map((o) => o.compareAt && toDecimal(o.compareAt)), ['837.00', '279.00', null])
  assert.equal(defaultOptionId(options), THREE_MONTH.id)
})

test('a product on no plan, or in another store, is only sold once', () => {
  assert.deepEqual(plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, NASAL_STRIPS), [])
  assert.deepEqual(plansForProduct(VITAHEAL_PLANS, 'neelam-store', ELECTROLYTES), [])
  const options = purchaseOptions(sek('199.00'), [])
  assert.deepEqual(options.map((o) => o.id), [ONE_TIME])
  assert.equal(defaultOptionId(options), ONE_TIME)
})

test('a paused plan is not offered, and without a preselected plan buying once is chosen', () => {
  const plans = [{ ...THREE_MONTH, status: 'Paused' as const }, MONTHLY]
  const offered = plansForProduct(plans, VITAHEAL_CHANNEL_ID, ELECTROLYTES)
  assert.deepEqual(offered.map((p) => p.id), [MONTHLY.id])
  assert.equal(defaultOptionId(purchaseOptions(sek('279.00'), offered)), ONE_TIME)
})

// ── Cart and order lines ─────────────────────────────────────────────────────

test('a line keeps the plan as it was chosen, without the fields an order does not need', () => {
  assert.deepEqual(linePlan(THREE_MONTH), {
    id: 'plan-3-month', name: '3-month supply', intervalCount: 3, intervalUnit: 'month', unitsPerDelivery: 3, freeShipping: true,
  })
})

test('what is charged again is totalled per interval, and one-time lines are left out', () => {
  const total = (line: { price: string; qty: number }) => money(sek(line.price).amount * line.qty, 'SEK')
  const charges = recurringCharges([
    { price: '585.90', qty: 1, plan: linePlan(THREE_MONTH) },
    { price: '199.00', qty: 2 },
    { price: '223.20', qty: 2, plan: linePlan(MONTHLY) },
    { price: '1201.20', qty: 1, plan: linePlan(THREE_MONTH) },
  ], total)
  assert.deepEqual(charges, [
    { interval: 'every 3 months', amount: sek('1787.10') },
    { interval: 'every month', amount: sek('446.40') },
  ])
})

// ── Validation ───────────────────────────────────────────────────────────────

test('a seeded plan has nothing to fix', () => {
  for (const { id: _id, channelId: _channelId, ...input } of VITAHEAL_PLANS) assert.deepEqual(planErrors(input), {})
})

test('a plan needs a name, sensible numbers and at least one product', () => {
  const input: PlanInput = {
    name: ' ', intervalCount: 0, intervalUnit: 'month', unitsPerDelivery: 1.5, discountPct: 120,
    freeShipping: false, benefits: [], productIds: [], isDefault: false, status: 'Active',
  }
  assert.deepEqual(Object.keys(planErrors(input)), ['name', 'intervalCount', 'unitsPerDelivery', 'discountPct', 'productIds'])
  assert.deepEqual(planErrors({ ...input, discountPct: Number.NaN, name: 'Weekly', intervalCount: 1, unitsPerDelivery: 1, productIds: [1] }), {
    discountPct: 'Enter a discount from 0 to 90.',
  })
})

// ── The seed ─────────────────────────────────────────────────────────────────

test('the demo store has the reference store\'s two plans, on the products of its Subscription collection', () => {
  const onPlans = vitahealProducts().filter((p) => p.collections.includes('Subscription')).map((p) => p.id)
  // The reference store's five, then the three powders added on 2026-11-25: Plant Protein, Daily Greens and Creatine.
  assert.deepEqual(onPlans, [2001, 2002, 2003, 2005, 2006, 2009, 2010, 2014])
  assert.deepEqual(VITAHEAL_PLANS.map((p) => [p.name, deliverySummary(p), p.discountPct, p.freeShipping, p.isDefault]), [
    ['3-month supply', '3 units every 3 months', 30, true, true],
    ['Monthly subscription', '1 unit every month', 20, false, false],
  ])
  for (const plan of VITAHEAL_PLANS) {
    assert.equal(plan.channelId, VITAHEAL_CHANNEL_ID)
    assert.equal(plan.status, 'Active')
    assert.deepEqual(plan.productIds, onPlans)
  }
})
