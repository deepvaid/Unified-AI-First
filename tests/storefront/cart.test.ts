import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_QTY, addLine, lineKey, lineProduct, pruneLines } from '../../src/storefront/cart.ts'
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

// ── Variants, vehicles and a store whose products changed ───────────────────

const tee = (variantId: number, variantTitle: string, qty = 1): CartLine => ({
  productId: 3001, name: 'Everyday Tee', sku: `NF-TEE-${variantId}`, price: '38.00', qty, variantId, variantTitle,
})

test('two sizes of one product are two lines, keyed product/variant', () => {
  let lines = addLine([], tee(300102, 'M / Black'))
  lines = addLine(lines, tee(300103, 'L / Black'))
  lines = addLine(lines, tee(300102, 'M / Black', 2))
  assert.deepEqual(lines.map((l) => [lineKey(l), l.qty]), [['3001/300102', 3], ['3001/300103', 1]])
})

test('a variant on a plan keys product/variant:plan', () => {
  assert.equal(lineKey({ ...once, variantId: 20052, plan: threeMonth }), '2005/20052:plan-3-month')
})

test('the vehicle a part was added for does not split a line, and a line for two vehicles names neither', () => {
  const pads: CartLine = { productId: 4001, name: 'Ceramic Brake Pads', sku: 'TQ-BRK-4471', price: '64.99', qty: 1, variantId: 400101, variantTitle: 'Front', vehicle: '2019 Ford F-150' }
  const same = addLine([pads], { ...pads })
  assert.deepEqual(same.map((l) => [lineKey(l), l.qty, l.vehicle]), [['4001/400101', 2, '2019 Ford F-150']])
  const lines = addLine([pads], { ...pads, vehicle: '2015 Honda Civic' })
  assert.deepEqual(lines.map((l) => [lineKey(l), l.qty, l.vehicle]), [['4001/400101', 2, undefined]])
  assert.equal('vehicle' in lines[0]!, false)
})

test('lines whose product the store no longer sells are taken out, and said', () => {
  const lines = [once, tee(300102, 'M / Black'), onPlan(threeMonth, '585.90')]
  const { kept, removed } = pruneLines(lines, [3001])
  assert.deepEqual(kept.map(lineKey), ['3001/300102'])
  assert.deepEqual(removed.map(lineKey), ['2005', '2005:plan-3-month'])
  assert.deepEqual(pruneLines(lines, new Set([2005, 3001])).removed, [])
})

test('a line finds its product by id, or by SKU when it was saved without one', () => {
  const products = [{ id: 2005, sku: 'VTH-ELE-LEM' }, { id: 92005, sku: 'VTH-ELE-LEM' }]
  assert.equal(lineProduct(products, { productId: 92005, sku: 'VTH-ELE-LEM' })?.id, 92005)
  assert.equal(lineProduct(products, { sku: 'VTH-ELE-LEM' })?.id, 2005)
  assert.equal(lineProduct(products, { productId: 1, sku: 'VTH-ELE-LEM' }), undefined)
})
