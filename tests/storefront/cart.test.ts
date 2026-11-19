import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_QTY, addLine, lineKey } from '../../src/storefront/cart.ts'
import type { CartLine } from '../../src/storefront/cart.ts'
import { VITAHEAL_PLANS } from '../../src/storefront/vitahealDemo.ts'
import { linePlan } from '../../src/subscriptions/plans.ts'

const [threeMonth, monthly] = VITAHEAL_PLANS.map(linePlan)
const once: CartLine = { productId: 2005, name: 'Vitaheal Electrolytes', sku: 'VTH-ELE-LEM', price: '279.00', qty: 1 }
const onPlan = (plan: CartLine['plan'], price: string, qty = 1): CartLine => ({ ...once, price, qty, plan })

test('a cart saved before plans existed still reads: a line without a plan is bought once', () => {
  assert.equal(lineKey(once), '2005')
})

test('the same product bought once and on each plan are separate lines', () => {
  let lines = addLine([], once)
  lines = addLine(lines, onPlan(threeMonth, '585.90'))
  lines = addLine(lines, onPlan(monthly, '223.20'))
  assert.deepEqual(lines.map(lineKey), ['2005', '2005:plan-3-month', '2005:plan-monthly'])
  assert.deepEqual(lines.map((l) => l.price), ['279.00', '585.90', '223.20'])
})

test('adding the same line again raises its quantity and leaves the others alone', () => {
  let lines = addLine([once], onPlan(threeMonth, '585.90'))
  lines = addLine(lines, onPlan(threeMonth, '585.90', 2))
  assert.deepEqual(lines.map((l) => [lineKey(l), l.qty]), [['2005', 1], ['2005:plan-3-month', 3]])
})

test('a line never holds more than the cart allows, and never less than one', () => {
  assert.equal(addLine([{ ...once, qty: 98 }], { ...once, qty: 5 })[0]?.qty, MAX_QTY)
  assert.equal(addLine([], { ...once, qty: 0 })[0]?.qty, 1)
})

test('adding does not change the cart it was given', () => {
  const before = [once]
  addLine(before, once)
  assert.deepEqual(before, [{ ...once, qty: 1 }])
})
