// A subscription keeps the variant it was bought on. The product page and quick add
// price a plan on the chosen variant, so a later plan change prices the new plan on
// that variant too (contractUnitPrice), not on the product's cheapest one. The
// contract names the variant ("Unwind · Can") when the checkout line had one, and
// the seeded subscribers of every demo store read and cost as they did.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDecimal, toDecimal } from '../../src/maropay/money.ts'
import { lowestPrice } from '../../src/storefront/catalog.ts'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'
import { historyFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'
import { changePlan, chargeAmount, contractFromLine, contractUnitPrice } from '../../src/subscriptions/contracts.ts'
import type { SubscriptionContract } from '../../src/subscriptions/contracts.ts'
import { linePlan, purchaseOptions } from '../../src/subscriptions/plans.ts'
import type { SubscriptionPlan } from '../../src/subscriptions/plans.ts'

const TODAY = '2026-11-25'
const [THREE_MONTH, MONTHLY] = ['plan-3-month', 'plan-monthly'].map((id) => VITAHEAL_PLANS.find((p) => p.id === id)!) as [SubscriptionPlan, SubscriptionPlan]
const PRODUCTS = vitahealProducts()
const productNamed = (name: string) => PRODUCTS.find((p) => p.name === name)!
const variantOf = (name: string, title: string) => productNamed(name).detail!.variantsList.find((v) => v.title.startsWith(title))!

/** What the product page puts on the line for this variant on this plan, checked out today. */
function boughtOn(name: string, title: string, plan: SubscriptionPlan): SubscriptionContract {
  const product = productNamed(name)
  const variant = variantOf(name, title)
  const option = purchaseOptions(parseDecimal(variant.price, 'USD')!, [plan]).find((o) => o.id === plan.id)!
  return contractFromLine({
    id: 'sub-9100', number: 'S-9100', channelId: VITAHEAL_CHANNEL_ID, customer: { name: 'Linnea Berg', email: 'linnea.berg@example.com' },
    productId: product.id,
    line: { product: product.name, sku: variant.sku, variantTitle: variant.title, qty: 1, price: toDecimal(option.price!), plan: linePlan(plan) },
    currency: 'USD', paymentMethod: 'Visa •••• 4242', methodId: 'card', order: { id: 900100, number: '#20100' }, date: TODAY,
  })
}

/** What useSubscriptions.changePlan does: the new plan, priced on the contract's own variant. */
function moveTo(contract: SubscriptionContract, plan: SubscriptionPlan): SubscriptionContract {
  const product = PRODUCTS.find((p) => p.id === contract.productId)!
  return changePlan(contract, plan, parseDecimal(contractUnitPrice(product, contract), contract.currency)!, TODAY, 'customer')
}

test('Electrolytes Starter Pack on the 3-month supply moves to monthly at the Starter Pack’s price, $39.99', () => {
  const contract = boughtOn('Vitaheal Electrolytes', 'Starter Pack', THREE_MONTH)
  assert.equal(contract.price, '104.97')
  assert.equal(contract.sku, 'VTH-ELE-STA')
  assert.equal(contract.variantTitle, 'Starter Pack (both flavours)')
  assert.equal(contractUnitPrice(productNamed('Vitaheal Electrolytes'), contract), '49.99')

  const moved = moveTo(contract, MONTHLY)
  // $49.99 at 20% off, not Lemon & Ginger's $22.39.
  assert.equal(moved.price, '39.99')
  assert.equal(toDecimal(chargeAmount(moved)), '39.99')
  assert.equal(moved.variantTitle, 'Starter Pack (both flavours)', 'the variant stays with the subscription')
  assert.equal(moved.sku, 'VTH-ELE-STA')
})

test('Unwind in a Can and in a Bag are told apart, and each keeps its own price across plans', () => {
  const can = boughtOn('Unwind', 'Can', THREE_MONTH)
  const bag = boughtOn('Unwind', 'Bag', THREE_MONTH)
  assert.deepEqual([can.price, bag.price], ['88.17', '83.97'])
  assert.deepEqual([can.variantTitle, bag.variantTitle], ['Can', 'Bag'])
  assert.deepEqual([moveTo(can, MONTHLY).price, moveTo(bag, MONTHLY).price], ['33.59', '31.99'])
  // And back again: the Can is the Can's 3-month price, not the Bag's.
  assert.equal(moveTo(moveTo(can, MONTHLY), THREE_MONTH).price, '88.17')
})

test('without a variant of its SKU, a subscription is priced as the product’s lowest price, as before', () => {
  const electrolytes = productNamed('Vitaheal Electrolytes')
  assert.equal(contractUnitPrice(electrolytes, { sku: 'VTH-ELE-GONE' }), lowestPrice(electrolytes))
  assert.equal(contractUnitPrice(electrolytes, { sku: 'VTH-ELE-GONE' }), '27.99')
  // A product without variants costs its own price.
  assert.equal(contractUnitPrice({ publishStatus: 'Published', price: '150.00' }, { sku: 'ANY' }), '150.00')
  // A variant without a price is not a price.
  const unpriced = { publishStatus: 'Published', price: '150.00', detail: { variantsList: [{ sku: 'A', price: '' }, { sku: 'B', price: '120.00' }] } }
  assert.equal(contractUnitPrice(unpriced, { sku: 'A' }), '120.00')
})

test('a checkout line without a choice starts a subscription without a variant title', () => {
  const contract = contractFromLine({
    id: 'sub-9101', number: 'S-9101', channelId: VITAHEAL_CHANNEL_ID, customer: { name: 'Ada Stone', email: 'ada@example.com' }, productId: 2008,
    line: { product: 'Balance', sku: 'VTH-BAL-CAN', qty: 1, price: '377.10', plan: linePlan(MONTHLY) },
    currency: 'SEK', paymentMethod: 'Visa •••• 4242', methodId: 'card', order: { id: 900101, number: '#20101' }, date: TODAY,
  })
  assert.equal('variantTitle' in contract, false)
})

test('every demo store’s seeded subscribers are priced and named as before', () => {
  const checked: string[] = []
  for (const blueprint of DEMO_STORES) {
    const subscriptions = historyFor(blueprint.homeChannel.id, TODAY)?.subscriptions ?? []
    if (!subscriptions.length) continue
    const products = snapshotFor(blueprint.homeChannel, blueprint.id, TODAY).products
    for (const contract of subscriptions) {
      const product = products.find((p) => p.id === contract.productId)
      assert.ok(product, `${contract.number}'s product`)
      assert.equal(contractUnitPrice(product, contract), lowestPrice(product), `${blueprint.id} ${contract.number}`)
      assert.equal(contract.variantTitle, undefined, `${blueprint.id} ${contract.number} names no variant`)
    }
    checked.push(blueprint.id)
  }
  assert.deepEqual(checked.sort(), ['daybloom', 'vitaheal'])
})
