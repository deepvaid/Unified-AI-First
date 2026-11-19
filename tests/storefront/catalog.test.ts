import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogFor, channelIdsFor, hasPriceRange, isAvailable, lowestPrice, storesWithOwnCatalogue, totalStock, withPrimaryCollection,
} from '../../src/storefront/catalog.ts'
import { currencyAffix, formatStorePrice } from '../../src/storefront/price.ts'
import { money } from '../../src/maropay/money.ts'

const shared = (name: string, publishStatus = 'Published') => ({ name, publishStatus, price: '10.00' })
const owned = (name: string, channelIds: string[], publishStatus = 'Published') => ({ ...shared(name, publishStatus), channelIds })

const products = [shared('Kettle'), shared('Draft lamp', 'Draft'), owned('Unwind', ['vitaheal-demo']), owned('Collagen+', ['vitaheal-demo'])]
const names = (list: { name: string }[]) => list.map((p) => p.name)

test('a store with assigned products sells only those', () => {
  assert.deepEqual(names(catalogFor(products, 'vitaheal-demo')), ['Unwind', 'Collagen+'])
})

test('a store with none sells the shared catalogue, never another store\'s products', () => {
  assert.deepEqual(names(catalogFor(products, 'neelam-store')), ['Kettle'])
})

test('drafts are never listed', () => {
  const list = [...products, owned('Unreleased', ['vitaheal-demo'], 'Draft')]
  assert.deepEqual(names(catalogFor(list, 'vitaheal-demo')), ['Unwind', 'Collagen+'])
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

// ── Product form rules ───────────────────────────────────────────────────────

const STORES = [{ id: 'vitaheal-demo', name: 'Vitaheal (demo)' }]

test('the stores with their own catalogue are the ones products are assigned to', () => {
  assert.deepEqual(storesWithOwnCatalogue(products), ['vitaheal-demo'])
  assert.deepEqual(storesWithOwnCatalogue([shared('Kettle')]), [])
})

test('picking a store on the product form assigns the product to it; other channels assign nothing', () => {
  assert.deepEqual(channelIdsFor(['Online Store', 'Vitaheal (demo)'], STORES), ['vitaheal-demo'])
  assert.deepEqual(channelIdsFor(['Online Store', 'POS'], STORES), [])
})

test('a product added to a store shows up there and nowhere else', () => {
  const added = owned('Magnesium', channelIdsFor(['Vitaheal (demo)'], STORES))
  const list = [...products, added]
  assert.deepEqual(names(catalogFor(list, 'vitaheal-demo')), ['Unwind', 'Collagen+', 'Magnesium'])
  assert.deepEqual(names(catalogFor(list, 'neelam-store')), ['Kettle'])
})

const variant = (stock: Record<string, number>, manageInventory = true, allowBackorder = false) => ({ manageInventory, allowBackorder, stock })

test('stock is counted under every location name, so an edit never zeroes it', () => {
  // The seed keeps stock under "Oxford Warehouse"; the form once looked for "Oxford warehouse" and found none.
  assert.equal(totalStock([variant({ 'Oxford Warehouse': 140 }), variant({ Testing: 6, 'Oxford Warehouse': 90 })]), 236)
})

test('a variant whose stock is not tracked adds nothing to the count', () => {
  assert.equal(totalStock([variant({ Testing: 50 }, false), variant({ Testing: 4 })]), 4)
})

test('a product is available with stock, without stock tracking, or on backorder; otherwise it is sold out', () => {
  assert.equal(isAvailable({ inventory: 3 }), true)
  assert.equal(isAvailable({ inventory: 0 }), false)
  assert.equal(isAvailable({ inventory: 0, detail: { variantsList: [variant({})] } }), false)
  assert.equal(isAvailable({ inventory: 0, detail: { variantsList: [variant({}, false)] } }), true)
  assert.equal(isAvailable({ inventory: 0, detail: { variantsList: [variant({}, true, true)] } }), true)
})

test('a new leading collection keeps the product in its other collections', () => {
  assert.deepEqual(withPrimaryCollection(['Hydrate', 'Sport', 'Subscription'], 'Sport'), ['Sport', 'Hydrate', 'Subscription'])
  assert.deepEqual(withPrimaryCollection(['Hydrate', 'Sport'], 'Sleep'), ['Sleep', 'Hydrate', 'Sport'])
  assert.deepEqual(withPrimaryCollection(['Hydrate', 'Sport'], ''), ['Hydrate', 'Sport'])
})

test('a price field shows the store\'s currency where its locale puts it', () => {
  assert.deepEqual(currencyAffix('SEK', 'sv-SE'), { suffix: 'kr' })
  assert.deepEqual(currencyAffix(), { prefix: '$' })
})
