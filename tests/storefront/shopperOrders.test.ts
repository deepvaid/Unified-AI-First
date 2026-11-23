// How a shopper's lines and orders read: the variant text and the colour photo of a
// cart, checkout or order line, the orders an account lists, and an order's sums
// (the LAYERS20 order of the Northfold demo).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { VITAHEAL_BLUEPRINT } from '../../src/storefront/demoStores/vitaheal.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import {
  lineColor, lineDetailText, lineImage, lineProductQuery, lineVariantText, orderOfShopper, orderParam, orderSums, ordersOfShopper, placedOn, withQuery,
} from '../../src/storefront/shopperOrders.ts'
import type { ShopperOrderRecord } from '../../src/storefront/shopperOrders.ts'
import { initialSelection, variantFor } from '../../src/storefront/variants.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'

const TODAY = '2026-11-19'
const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', TODAY)
const vitaheal = snapshotFor(VITAHEAL_BLUEPRINT.homeChannel, 'vitaheal', TODAY)
const product = (name: string) => {
  const found = northfold.products.find((p) => p.name === name)
  assert.ok(found, name)
  return found
}
const overshirt = product('Linen Overshirt')
const sandM = variantFor(overshirt, { Color: 'Sand', Size: 'M' })!
const blackL = variantFor(overshirt, { Color: 'Black', Size: 'L' })!

test('a line reads its variant as the shopper chose it, sizes first', () => {
  assert.equal(lineVariantText(overshirt, { productId: 3015, sku: sandM.sku, variantId: sandM.id, variantTitle: sandM.title }), 'Size M · Sand')
  assert.equal(lineVariantText(overshirt, { productId: 3015, sku: blackL.sku, variantId: blackL.id, variantTitle: blackL.title }), 'Size L · Black')
  // Colour only, and no choice at all.
  const beanie = product('Ribbed Merino Beanie')
  const charcoal = beanie.detail!.variantsList[0]!
  assert.equal(lineVariantText(beanie, { productId: beanie.id, sku: charcoal.sku, variantId: charcoal.id, variantTitle: charcoal.title }), charcoal.title)
  assert.equal(lineVariantText(product('Canvas Market Tote'), { productId: 3014, sku: 'NF-TOT-NAT-OS' }), '')
  // A line from before lines carried a variant, as Vitaheal's are: nothing under the name.
  const vh = vitaheal.products[0]!
  assert.equal(lineVariantText(vh, { productId: vh.id, sku: vh.sku }), '')
})

test('a part\'s line names its position, its number and the vehicle it was bought for; clothes read as before', () => {
  const pads = {
    id: 4001,
    sku: 'TQ-BRK-4471',
    detail: { options: [{ name: 'Position', values: ['Front', 'Rear'] }], variantsList: [{ id: 400101, title: 'Front' }, { id: 400102, title: 'Rear' }] },
  }
  const front = { productId: 4001, sku: 'TQ-BRK-4471', variantId: 400101, variantTitle: 'Front' }
  assert.equal(lineDetailText(pads, { ...front, vehicle: '2019 Ford F-150' }, { partNumber: true }), 'Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150')
  // Added without a vehicle, or for one it did not fit: no vehicle.
  assert.equal(lineDetailText(pads, front, { partNumber: true }), 'Front · Part # TQ-BRK-4471')
  // A part without options: its number alone.
  assert.equal(lineDetailText(undefined, { productId: 4020, sku: 'TQ-ACC-4820' }, { partNumber: true }), 'Part # TQ-ACC-4820')
  // Any other store: no part number, the line reads as it always has.
  const sand = { productId: 3015, sku: sandM.sku, variantId: sandM.id, variantTitle: sandM.title }
  assert.equal(lineDetailText(overshirt, sand), 'Size M · Sand')
  assert.equal(lineDetailText(product('Canvas Market Tote'), { productId: 3014, sku: 'NF-TOT-NAT-OS' }), '')
})

test('a line whose variant or product is gone still reads what was bought', () => {
  // The product is still sold, but that variant was removed: its kept title.
  assert.equal(lineVariantText(overshirt, { productId: 3015, sku: 'X', variantId: 399999, variantTitle: 'Sand / M' }), 'Size M · Sand')
  // The product is gone (another theme applied since): the title, split.
  assert.equal(lineVariantText(undefined, { productId: 3015, sku: 'X', variantId: sandM.id, variantTitle: 'Sand / M' }), 'Sand · M')
  assert.equal(lineImage(undefined, { productId: 3015, sku: 'X', variantId: sandM.id }), undefined)
})

test('a line shows the photo of its colour; a product without colour photos shows its first', () => {
  const sand = { productId: 3015, sku: sandM.sku, variantId: sandM.id, variantTitle: sandM.title }
  const black = { productId: 3015, sku: blackL.sku, variantId: blackL.id, variantTitle: blackL.title }
  assert.equal(lineColor(overshirt, sand), 'Sand')
  assert.equal(lineImage(overshirt, sand), '/storefront/northfold/linen-overshirt-sand.jpg')
  assert.equal(lineImage(overshirt, black), '/storefront/northfold/linen-overshirt-black.jpg')
  const chino = product('Slim Chino')
  const last = chino.detail!.variantsList[chino.detail!.variantsList.length - 1]!
  assert.equal(lineImage(chino, { productId: chino.id, sku: last.sku, variantId: last.id }), chino.imageUrls![0])
  const vh = vitaheal.products[0]!
  assert.equal(lineImage(vh, { productId: vh.id, sku: vh.sku }), vh.imageUrls?.[0])
})

test('a line links back to its product page with its choice made', () => {
  const sand = { productId: 3015, sku: sandM.sku, variantId: sandM.id }
  const query = lineProductQuery(overshirt, sand)
  assert.deepEqual(query, { color: 'sand', size: 'm' })
  assert.deepEqual(initialSelection(overshirt, query), { Color: 'Sand', Size: 'M' })
  assert.equal(withQuery('/products/linen-overshirt-3015', query), '/products/linen-overshirt-3015?color=sand&size=m')
  assert.equal(withQuery('/products/canvas-market-tote-3014', lineProductQuery(product('Canvas Market Tote'), { productId: 3014, sku: 'NF-TOT-NAT-OS' })), '/products/canvas-market-tote-3014')
})

const order = (over: Partial<ShopperOrderRecord>): ShopperOrderRecord => ({
  id: 41001,
  orderNumber: '#41001',
  channelId: 'northfold-demo',
  customer: { email: 'ava.brown@example.com' },
  date: '2026-11-19',
  total: '78.40',
  shipping: '0.00',
  currency: 'USD',
  lineItems: [{ price: '98.00', qty: 1, coupon: 'LAYERS20', discountPct: 20 }],
  ...over,
})

test('an account lists only its shopper\'s orders on this store, newest first', () => {
  const orders = [
    order({ id: 1, orderNumber: '#1', date: '2026-11-02' }),
    order({ id: 2, orderNumber: '#2', date: '2026-11-19' }),
    order({ id: 3, orderNumber: '#3', date: '2026-11-19' }),
    order({ id: 4, orderNumber: '#4', channelId: 'vitaheal-demo' }),
    order({ id: 5, orderNumber: '#5', customer: { email: 'someone.else@example.com' } }),
    order({ id: 6, orderNumber: '#6', customer: { email: ' Ava.Brown@Example.com ' } }),
  ]
  assert.deepEqual(ordersOfShopper(orders, 'northfold-demo', 'AVA.brown@example.com').map((o) => o.id), [6, 3, 2, 1])
  assert.deepEqual(ordersOfShopper(orders, 'northfold-demo', null), [])
  assert.deepEqual(ordersOfShopper(orders, 'northfold-demo', '  '), [])
  // An order page finds only the shopper's own order on this store.
  assert.equal(orderOfShopper(orders, 'northfold-demo', 'ava.brown@example.com', '3')?.id, 3)
  assert.equal(orderOfShopper(orders, 'northfold-demo', 'ava.brown@example.com', '#3')?.id, 3)
  assert.equal(orderOfShopper(orders, 'northfold-demo', 'ava.brown@example.com', '4'), undefined, 'another store')
  assert.equal(orderOfShopper(orders, 'northfold-demo', 'ava.brown@example.com', '5'), undefined, 'another shopper')
  assert.equal(orderOfShopper(orders, 'northfold-demo', null, '3'), undefined, 'nobody signed in')
  assert.equal(orderOfShopper(orders, 'northfold-demo', 'ava.brown@example.com', ''), undefined)
  assert.equal(orderParam(' #41001 '), '41001')
})

test('the LAYERS20 order sums to what was charged, its discount to the cent', () => {
  const usd = (m: { amount: number; currency: string }) => formatStorePrice(m)
  const one = orderSums(order({}))
  assert.deepEqual([usd(one.items), usd(one.discount!.amount), one.discount!.code, one.discount!.pct, usd(one.shipping), usd(one.total), one.count],
    ['$98.00', '$19.60', 'LAYERS20', 20, '$0.00', '$78.40', 1])
  // With a tee that the code does not cover.
  const two = orderSums(order({ total: '112.40', lineItems: [{ price: '98.00', qty: 1, coupon: 'LAYERS20', discountPct: 20 }, { price: '34.00', qty: 1, coupon: null, discountPct: 0 }] }))
  assert.deepEqual([usd(two.items), usd(two.discount!.amount), usd(two.total), two.count], ['$132.00', '$19.60', '$112.40', 2])
  // No code: no discount line.
  const plain = orderSums(order({ total: '68.00', lineItems: [{ price: '34.00', qty: 2, coupon: null, discountPct: 0 }] }))
  assert.equal(plain.discount, null)
  assert.equal(plain.count, 2)
})

test('an order\'s day reads the store\'s way', () => {
  assert.equal(placedOn('2026-11-19'), 'Nov 19, 2026')
  assert.equal(placedOn('2026-11-19', true), '19 Nov 2026')
  assert.equal(placedOn('2026-01-02T23:30:00Z'), 'Jan 2, 2026')
})
