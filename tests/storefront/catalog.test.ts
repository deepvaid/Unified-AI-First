import { test } from 'node:test'
import assert from 'node:assert/strict'
import { catalogFor, hasPriceRange, lowestPrice } from '../../src/storefront/catalog.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { money } from '../../src/maropay/money.ts'

const shared = (name: string, publishStatus = 'Published') => ({ name, publishStatus, price: '10.00' })
const owned = (name: string, channelIds: string[], publishStatus = 'Published') => ({ ...shared(name, publishStatus), channelIds })

const products = [shared('Kettle'), shared('Draft lamp', 'Draft'), owned('Unwind', ['tallvik-demo']), owned('Collagen+', ['tallvik-demo'])]
const names = (list: { name: string }[]) => list.map((p) => p.name)

test('a store with assigned products sells only those', () => {
  assert.deepEqual(names(catalogFor(products, 'tallvik-demo')), ['Unwind', 'Collagen+'])
})

test('a store with none sells the shared catalogue, never another store\'s products', () => {
  assert.deepEqual(names(catalogFor(products, 'neelam-store')), ['Kettle'])
})

test('drafts are never listed', () => {
  const list = [...products, owned('Unreleased', ['tallvik-demo'], 'Draft')]
  assert.deepEqual(names(catalogFor(list, 'tallvik-demo')), ['Unwind', 'Collagen+'])
})

test('a store whose only assigned product is a draft does not fall back to the shared catalogue', () => {
  assert.deepEqual(catalogFor([shared('Kettle'), owned('Unreleased', ['new-store'], 'Draft')], 'new-store'), [])
})

test('without assignments every store gets the same list as before', () => {
  const legacy = [shared('Kettle'), shared('Mug'), shared('Draft lamp', 'Draft')]
  assert.deepEqual(names(catalogFor(legacy, 'any-store')), ['Kettle', 'Mug'])
})

test('"From" shows only when variant prices differ', () => {
  const variants = (...prices: string[]) => ({ ...shared('x'), detail: { variantsList: prices.map((price) => ({ price })) } })
  assert.equal(hasPriceRange(variants('419.00', '399.00')), true)
  assert.equal(hasPriceRange(variants('279.00', '279.00')), false)
  assert.equal(hasPriceRange(shared('no variants')), false)
  assert.equal(lowestPrice(variants('419.00', '399.00')), '399.00')
  assert.equal(lowestPrice(shared('no variants')), '10.00')
})

test('a store without a locale formats prices as before', () => {
  assert.equal(formatStorePrice(money(9419, 'USD')), '$94.19')
  assert.equal(formatStorePrice(money(27900, 'USD')), '$279.00')
})

test('a Swedish store drops the decimals on whole amounts', () => {
  // Intl separates the amount and "kr" with a no-break space.
  assert.equal(formatStorePrice(money(39900, 'SEK'), 'sv-SE').replace(/\s/g, ' '), '399 kr')
  assert.equal(formatStorePrice(money(22320, 'SEK'), 'sv-SE').replace(/\s/g, ' '), '223,20 kr')
})
