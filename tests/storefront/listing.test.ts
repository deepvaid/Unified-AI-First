// How products read in a store's lists on the richer theme drawing (src/storefront/listing.ts),
// checked on the Northfold (demo) seed and on Vitaheal's, which must keep reading as products.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { DEFAULT_GRID, cardPhoto, cardPrice, chosenColor, colorsOf, gridSettings, isNewArrival, listingNoun, needsChoice, soldOut } from '../../src/storefront/listing.ts'
import type { CardProduct } from '../../src/storefront/listing.ts'
import { vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-20')
const products = northfold.products as CardProduct[]
const byName = (name: string): CardProduct => {
  const product = northfold.products.find((p) => p.name === name)
  assert.ok(product, name)
  return product as CardProduct
}

test('a card shows the lowest price, and the sale price with the saving on the "was" price', () => {
  assert.deepEqual(cardPrice(byName('Linen Overshirt')), { price: '98.00', from: false })
  assert.deepEqual(cardPrice(byName('Washed Silk Blouse')), { price: '88.00', compareAt: '118.00', salePercent: 25, from: false })
  assert.deepEqual(cardPrice(byName('Cotton Cable Sweater')), { price: '118.00', compareAt: '148.00', salePercent: 20, from: false })
  // Only the two sale styles carry a "was" price.
  assert.deepEqual(products.filter((p) => cardPrice(p).compareAt).map((p) => p.id), [3006, 3008])
})

test('a card reads "From" when the variants differ in price, and prices the cheapest one in stock', () => {
  const tee = structuredClone(byName('Organic Cotton Tee'))
  tee.detail!.variantsList[0]!.price = '30.00'
  assert.deepEqual(cardPrice(tee), { price: '30.00', from: true })
  // That variant sells out: the card prices what can be bought.
  tee.detail!.variantsList[0]!.stock = { 'Oxford Warehouse': 0 }
  assert.equal(cardPrice(tee).price, '34.00')
  // A product without variants reads its own price and "was" price.
  assert.deepEqual(cardPrice({ id: 1, price: '20.00', compareAtPrice: '25.00', inventory: 3 }), { price: '20.00', compareAt: '25.00', salePercent: 20, from: false })
  assert.deepEqual(cardPrice({ id: 1, price: '20.00', compareAtPrice: '', inventory: 3 }), { price: '20.00', from: false })
})

test('colours come in the product\'s order with their swatches, and the chosen colour leads with its own photo', () => {
  const overshirt = byName('Linen Overshirt')
  assert.deepEqual(colorsOf(overshirt).map((c) => [c.name, c.key, c.hex]), [['Sand', 'sand', '#d2bf9f'], ['Black', 'black', '#1a1a1a'], ['Olive', 'olive', '#6b6b3f']])
  assert.equal(cardPhoto(overshirt), '/storefront/northfold/linen-overshirt-sand.jpg')
  assert.equal(cardPhoto(overshirt, chosenColor(overshirt, ['black'])), '/storefront/northfold/linen-overshirt-black.jpg')
  // The first chosen colour the product has wins; a colour it does not come in is passed over.
  assert.equal(chosenColor(overshirt, ['navy', 'olive', 'black'])?.name, 'Olive')
  assert.equal(chosenColor(overshirt, ['navy']), undefined)
  // A colour without photos of its own shows the product's first photo.
  const tee = byName('Heavyweight Pocket Tee')
  assert.equal(cardPhoto(tee, chosenColor(tee, ['black'])), '/storefront/northfold/heavyweight-pocket-tee-1.jpg')
  // The tote has no colour option.
  assert.deepEqual(colorsOf(byName('Canvas Market Tote')), [])
})

test('a colour is available while a variant in it can be bought', () => {
  const sweater = structuredClone(byName('Merino Crewneck Sweater'))
  assert.ok(colorsOf(sweater).every((c) => c.available))
  for (const v of sweater.detail!.variantsList) if (v.title.startsWith('Rust')) v.stock = { 'Oxford Warehouse': 0 }
  assert.deepEqual(colorsOf(sweater).map((c) => c.available), [true, true, false])
})

test('quick add asks for a choice unless the product has one variant', () => {
  assert.equal(needsChoice(byName('Linen Overshirt')), true)
  // Colour only: the scarf and the beanie still need a colour.
  assert.equal(needsChoice(byName('Lambswool Scarf')), true)
  assert.equal(needsChoice(byName('Canvas Market Tote')), false)
  assert.deepEqual(products.filter((p) => !needsChoice(p)).map((p) => p.id), [3014])
})

test('"New" goes on products in a New… collection; sold out means every variant is', () => {
  assert.deepEqual(products.filter(isNewArrival).map((p) => p.id), [3015, 3016, 3017, 3018, 3019, 3020])
  assert.equal(products.some(soldOut), false)
  const coat = structuredClone(byName('Wool-Blend Car Coat'))
  for (const v of coat.detail!.variantsList) v.stock = { 'Oxford Warehouse': 0 }
  assert.equal(soldOut(coat), true)
  assert.equal(soldOut({ id: 1, price: '1.00', inventory: 0 }), true)
})

test('a list of clothes holds styles; supplements stay products', () => {
  assert.deepEqual(listingNoun(products), { one: 'style', other: 'styles' })
  assert.deepEqual(listingNoun(vitahealProducts() as CardProduct[]), { one: 'product', other: 'products' })
  assert.deepEqual(listingNoun([{ id: 1, price: '9.00', inventory: 1, detail: { options: [], variantsList: [], fitment: { universal: true, rows: [] } } }]), { one: 'part', other: 'parts' })
})

test('the grid follows the collection template, falling back to every feature on and four columns', () => {
  assert.deepEqual(gridSettings(northfold.theme.templates.collection), { filters: true, sort: true, quickAdd: true, columns: 4 })
  assert.deepEqual(gridSettings(undefined), DEFAULT_GRID)
  assert.deepEqual(gridSettings([{ kind: 'collection-grid', settings: { filters: false, quickAdd: 'false', columns: 9 } }]), { filters: false, sort: true, quickAdd: false, columns: 5 })
  assert.deepEqual(gridSettings([{ kind: 'rich-text', settings: {} }]), DEFAULT_GRID)
})
