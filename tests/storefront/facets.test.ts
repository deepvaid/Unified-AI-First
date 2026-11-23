import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  activeFilters, applyFilters, clearFilters, compareSizes, emptyFilters, facetGroups, hasActiveFilters, listProducts,
  listingSorts, noFitText, parseListingQuery, parsePriceRange, priceRangeLabel, priceRanges, removeFilter, resultCountText,
  sortProducts, toListingQuery, toggleFilter, withListingQuery,
} from '../../src/storefront/facets.ts'
import type { ListingFilters, ListingProduct } from '../../src/storefront/facets.ts'
import { vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

// A clothing store like Northfold (docs: the Northfold catalogue, sections 3-6):
// twenty styles, colour × size, five sold-out sizes and two down to their last two.

const HEX: Record<string, string> = {
  White: '#f5f5f2', Black: '#1a1a1a', Sage: '#9caf88', 'Heather Gray': '#a7a9ac', 'Navy Stripe': '#1f2a44',
  'Black Stripe': '#2b2b2b', 'Pale Blue': '#b9cfe4', 'Blue Stripe': '#7d9cc0', Ivory: '#f3ecdc', Oat: '#d8cbb3',
  Navy: '#1f2a44', Rust: '#a4502b', Ecru: '#ece4d2', Forest: '#2f4a3a', Camel: '#b9875a', Olive: '#6b6b3f',
  Khaki: '#c3b091', Stone: '#cfc6b5', Charcoal: '#3b3b3d', Sand: '#d2bf9f', Cream: '#efe7d6',
}
const LETTERS = ['XS', 'S', 'M', 'L', 'XL']
const WAIST = ['28', '30', '32', '34', '36']

/** id, name, price, category, colours, sizes, stock exceptions ("Oat / S": 0). */
const STYLES: [number, string, string, string, string[], string[], Record<string, number>?][] = [
  [3001, 'Organic Cotton Tee', '34.00', 'Tees', ['White', 'Black', 'Sage'], LETTERS],
  [3002, 'Heavyweight Pocket Tee', '38.00', 'Tees', ['White', 'Black', 'Heather Gray'], LETTERS],
  [3003, 'Breton Stripe Top', '52.00', 'Tees', ['Navy Stripe', 'Black Stripe'], LETTERS],
  [3004, 'Oxford Button-Down Shirt', '78.00', 'Shirts', ['Pale Blue', 'White'], LETTERS],
  [3005, 'Poplin Relaxed Shirt', '72.00', 'Shirts', ['White', 'Blue Stripe'], LETTERS],
  [3006, 'Washed Silk Blouse', '88.00', 'Shirts', ['Ivory', 'Black'], LETTERS],
  [3007, 'Merino Crewneck Sweater', '128.00', 'Knitwear', ['Oat', 'Navy', 'Rust'], LETTERS, { 'Oat / S': 0, 'Navy / M': 2 }],
  [3008, 'Cotton Cable Sweater', '118.00', 'Knitwear', ['Ecru', 'Forest'], LETTERS],
  [3009, 'Wool-Blend Car Coat', '268.00', 'Outerwear', ['Camel', 'Black'], LETTERS, { 'Camel / M': 0, 'Black / L': 2 }],
  [3010, 'Waxed Cotton Field Jacket', '228.00', 'Outerwear', ['Olive', 'Navy'], LETTERS],
  [3011, 'Slim Chino', '88.00', 'Trousers', ['Khaki', 'Navy', 'Olive'], WAIST, { 'Khaki / 32': 0 }],
  [3012, 'Wide-Leg Pleated Trouser', '108.00', 'Trousers', ['Black', 'Stone'], LETTERS, { 'Black / XS': 0 }],
  [3013, 'Lambswool Scarf', '68.00', 'Accessories', ['Camel', 'Charcoal'], []],
  [3014, 'Canvas Market Tote', '48.00', 'Accessories', [], []],
  [3015, 'Linen Overshirt', '98.00', 'Outerwear', ['Sand', 'Black', 'Olive'], LETTERS, { 'Sand / L': 0 }],
  [3016, 'Lambswool Cardigan', '138.00', 'Knitwear', ['Cream', 'Charcoal'], LETTERS],
  [3017, 'Merino Quarter-Zip', '138.00', 'Knitwear', ['Navy', 'Charcoal'], LETTERS],
  [3018, 'Quilted Liner Jacket', '148.00', 'Outerwear', ['Olive', 'Black'], LETTERS],
  [3019, 'Relaxed Wool Trouser', '148.00', 'Trousers', ['Charcoal'], ['30', '32', '34', '36']],
  [3020, 'Ribbed Merino Beanie', '38.00', 'Accessories', ['Charcoal', 'Oat', 'Rust'], []],
]

type Fixture = ListingProduct & { collections: string[]; detail: NonNullable<ListingProduct['detail']> }

function style([id, name, price, tag, colors, sizes, stock = {}]: (typeof STYLES)[number]): Fixture {
  const options = [
    ...(colors.length ? [{ name: 'Color', values: colors, display: 'swatches' as const, swatches: Object.fromEntries(colors.map((c) => [c, HEX[c]!])) }] : []),
    ...(sizes.length ? [{ name: 'Size', values: sizes, display: 'buttons' as const }] : []),
  ]
  const combos = colors.length ? colors.flatMap((c) => (sizes.length ? sizes.map((s) => [c, s]) : [[c]])) : [[]]
  const variantsList = combos.map((values, i) => {
    const title = values.length ? values.join(' / ') : 'Default'
    return { id: id * 100 + i + 1, title, optionValues: values.length ? values : undefined, manageInventory: true, allowBackorder: false, price, stock: { 'Oxford Warehouse': stock[title] ?? 10 } }
  })
  return { id, name, price, vendor: 'Northfold', productType: 'Physical', collections: [], detail: { options, variantsList, tag, brand: 'Northfold' } }
}

const STORE: Fixture[] = STYLES.map(style)
const byId = (id: number) => STORE.find((p) => p.id === id)!
const ids = (list: readonly ListingProduct[]) => list.map((p) => p.id)
const filters = (patch: Partial<ListingFilters> = {}): ListingFilters => ({ ...emptyFilters(), ...patch })
const group = (key: string, list = STORE, f = filters()) => facetGroups(list, f).find((g) => g.key === key)

test('the URL holds the filters: comma-separated values, written the query way, unknown parts dropped', () => {
  assert.deepEqual(parseListingQuery({ size: 'M,l', color: ['Black', 'heather-gray'], price: '50-100', category: 'Knitwear', sort: 'price-asc' }), {
    category: ['knitwear'], size: ['m', 'l'], color: ['black', 'heather-gray'], price: ['50-100'], brand: [], fits: true, sort: 'price-asc',
  })
  assert.deepEqual(parseListingQuery({}), emptyFilters())
  // A hand-edited URL never breaks the page.
  const odd = parseListingQuery({ size: ' , m,m ', price: 'cheap,100-50,-50,200-', sort: 'random', fits: 'yes', q: 'linen' })
  assert.deepEqual(odd.size, ['m'])
  assert.deepEqual(odd.price, ['0-50', '200-'])
  assert.equal(odd.sort, 'featured')
  // The fits switch is on unless the URL turns it off.
  assert.equal(odd.fits, true)
  assert.equal(parseListingQuery({ fits: '1' }).fits, true)
  assert.equal(parseListingQuery({ fits: '0' }).fits, false)
  assert.equal(parseListingQuery({ fits: 'false' }).fits, false)
})

test('the filters go back into the URL in a fixed order, leaving the page\'s own keys alone', () => {
  const f = filters({ size: ['m', 'l'], color: ['black'], price: ['50-100'], category: ['knitwear'], sort: 'price-asc' })
  assert.deepEqual(toListingQuery(f), { category: 'knitwear', size: 'm,l', color: 'black', price: '50-100', sort: 'price-asc' })
  assert.deepEqual(Object.keys(toListingQuery({ ...f, fits: false })), ['category', 'size', 'color', 'price', 'fits', 'sort'])
  assert.equal(toListingQuery({ ...f, fits: false }).fits, '0')
  assert.equal(toListingQuery(f).fits, undefined)
  assert.deepEqual(toListingQuery(emptyFilters()), {})
  assert.deepEqual(withListingQuery({ q: 'linen', size: 'xs', sort: 'name' }, filters({ color: ['sand'] })), { q: 'linen', color: 'sand' })
  // Read back, it is the same filters.
  assert.deepEqual(parseListingQuery(toListingQuery(f)), f)
})

test('price ranges read the way a shopper says them', () => {
  assert.deepEqual(parsePriceRange('50-100'), { lo: 50, hi: 100 })
  assert.deepEqual(parsePriceRange('200-'), { lo: 200, hi: undefined })
  assert.deepEqual(parsePriceRange('-50'), { lo: 0, hi: 50 })
  assert.equal(parsePriceRange('-'), null)
  assert.equal(parsePriceRange('100-100'), null)
  assert.equal(priceRangeLabel('0-50'), 'Under $50')
  assert.equal(priceRangeLabel('50-100'), '$50 to $100')
  assert.equal(priceRangeLabel('200-'), 'Over $200')
  assert.equal(priceRangeLabel('12.5-20'), '$12.50 to $20')
  assert.equal(priceRangeLabel('0-500', { currency: 'SEK', locale: 'sv-SE' }), 'Under 500 kr')
})

test('price ranges suit the prices: Northfold\'s $34-$268 gives four, with none empty and at most five', () => {
  const prices = STORE.map((p) => Number(p.price))
  assert.deepEqual(priceRanges(prices), ['0-50', '50-100', '100-200', '200-'])
  assert.deepEqual(group('price')!.values.map((v) => v.label), ['Under $50', '$50 to $100', '$100 to $200', 'Over $200'])
  // A narrow band falls back to finer steps.
  assert.deepEqual(priceRanges([12, 14, 18, 24]), ['0-15', '15-20', '20-'])
  // Empty ranges merge into a neighbour.
  assert.deepEqual(priceRanges([30, 35, 40, 600]), ['0-50', '50-'])
  // Never more than five.
  assert.ok(priceRanges([6, 12, 22, 40, 70, 150, 300, 700, 1600, 4000]).length <= 5)
  // One price, or none, is no choice.
  assert.deepEqual(priceRanges([48, 48]), [])
  assert.deepEqual(priceRanges([]), [])
})

test('the panel lists Category, Size, Color and Price; sizes run XS to XL then waists; Brand only when there is more than one', () => {
  const groups = facetGroups(STORE, filters())
  assert.deepEqual(groups.map((g) => g.label), ['Category', 'Size', 'Color', 'Price'])
  assert.deepEqual(group('size')!.values.map((v) => v.label), ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '36'])
  assert.deepEqual(group('category')!.values.map((v) => v.label), ['Tees', 'Shirts', 'Knitwear', 'Outerwear', 'Trousers', 'Accessories'])
  const colors = group('color')!.values
  assert.equal(colors[0]!.label, 'White')
  assert.equal(colors.find((v) => v.value === 'heather-gray')?.swatch, '#a7a9ac')
  assert.equal(colors.length, 21)
  // A product of another brand brings the Brand group in.
  const withBrand = [...STORE, { ...byId(3014), id: 3999, vendor: 'Field & Co', detail: { ...byId(3014).detail, brand: 'Field & Co' } }]
  assert.deepEqual(group('brand', withBrand)!.values.map((v) => [v.label, v.count]), [['Northfold', 20], ['Field & Co', 1]])
  // A page can leave a group out, and a group with one value says nothing.
  assert.equal(facetGroups(STORE, filters(), { omit: ['category'] }).some((g) => g.key === 'category'), false)
  const knitwear = STORE.filter((p) => p.detail.tag === 'Knitwear')
  assert.equal(facetGroups(knitwear, filters()).some((g) => g.key === 'category'), false)
})

test('sizes sort as they run', () => {
  assert.deepEqual(['36', 'XL', 'one size', 'S', '28', 'xs', 'M', 'L', '2XL'].sort(compareSizes), ['xs', 'S', 'M', 'L', 'XL', '2XL', '28', '36', 'one size'])
})

test('a product matches Size and Color only through a variant in stock that has both', () => {
  // Linen Overshirt: Sand / L is sold out, so it is not "L in Sand", but it is "L" (Black, Olive) and "Sand" (other sizes).
  assert.equal(ids(applyFilters([byId(3015)], filters({ size: ['l'], color: ['sand'] }))).length, 0)
  assert.deepEqual(ids(applyFilters([byId(3015)], filters({ size: ['l'] }))), [3015])
  assert.deepEqual(ids(applyFilters([byId(3015)], filters({ color: ['sand'] }))), [3015])
  // Values of one filter are either-or; filters are all-of.
  assert.deepEqual(ids(applyFilters(STORE, filters({ size: ['32'] }))), [3011, 3019])
  assert.deepEqual(ids(applyFilters(STORE, filters({ size: ['32'], color: ['khaki'] }))), [])
  assert.deepEqual(ids(applyFilters(STORE, filters({ size: ['32'], color: ['khaki', 'charcoal'] }))), [3019])
  assert.deepEqual(ids(applyFilters(STORE, filters({ category: ['knitwear'], price: ['100-200'] }))), [3007, 3008, 3016, 3017])
  assert.deepEqual(ids(applyFilters(STORE, filters({ price: ['0-50', '200-'] }))), [3001, 3002, 3009, 3010, 3014, 3020])
  // A product with no sizes is not listed under a size; one without colours not under a colour.
  assert.equal(applyFilters([byId(3014), byId(3013)], filters({ size: ['m'] })).length, 0)
  assert.deepEqual(ids(applyFilters([byId(3014), byId(3013)], filters({ color: ['camel'] }))), [3013])
})

test('counts follow the other filters: a group\'s own choices widen it, the others narrow it', () => {
  const none = group('size')!
  assert.equal(none.values.find((v) => v.value === 'm')!.count, 15)
  assert.equal(none.values.find((v) => v.value === '32')!.count, 2)
  // With Khaki chosen, size 32 is sold out in Khaki: nothing would be listed.
  const khaki = group('size', STORE, filters({ color: ['khaki'] }))!
  assert.equal(khaki.values.find((v) => v.value === '32')!.count, 0)
  assert.equal(khaki.values.find((v) => v.value === '30')!.count, 1)
  // Choosing M leaves the other sizes' counts as they were (it would add to the list).
  const m = group('size', STORE, filters({ size: ['m'] }))!
  assert.deepEqual(m.values.map((v) => v.count), none.values.map((v) => v.count))
  assert.equal(m.selected, 1)
  assert.equal(m.values.find((v) => v.value === 'm')!.selected, true)
  // And narrows the colours: no M in Rust? The sweater has Rust M, the beanie has no sizes.
  const colors = group('color', STORE, filters({ size: ['m'] }))!
  assert.equal(colors.values.find((v) => v.value === 'rust')!.count, 1)
  assert.equal(colors.values.find((v) => v.value === 'camel')!.count, 0)
  // Categories under a price.
  const cats = group('category', STORE, filters({ price: ['200-'] }))!
  assert.deepEqual(cats.values.filter((v) => v.count).map((v) => [v.label, v.count]), [['Outerwear', 2]])
})

test('a value chosen in the URL that no product has is still listed, so it can be taken off', () => {
  const color = group('color', STORE, filters({ color: ['light-purple'] }))!
  assert.deepEqual(color.values.at(-1), { value: 'light-purple', label: 'Light purple', count: 0, selected: true })
  assert.equal(applyFilters(STORE, filters({ color: ['light-purple'] })).length, 0)
})

test('sold out in every variant: still listed, but last; sorts by the lowest price a shopper can buy at', () => {
  const soldOut = (p: Fixture): Fixture => ({ ...p, detail: { ...p.detail, variantsList: p.detail.variantsList.map((v) => ({ ...v, stock: { 'Oxford Warehouse': 0 } })) } })
  const list = [soldOut(byId(3001)), byId(3002), byId(3009)]
  assert.deepEqual(ids(sortProducts(list, 'featured')), [3002, 3009, 3001])
  assert.deepEqual(ids(sortProducts(list, 'price-desc')), [3009, 3002, 3001])
  assert.deepEqual(ids(sortProducts(STORE.slice(0, 5), 'price-asc')), [3001, 3002, 3003, 3005, 3004])
  assert.deepEqual(ids(sortProducts(STORE.slice(14), 'newest')), [3020, 3019, 3018, 3017, 3016, 3015])
  assert.deepEqual(ids(sortProducts([byId(3017), byId(3016)], 'price-asc')), [3017, 3016], 'ties keep the given order')
  assert.deepEqual(sortProducts([byId(3015), byId(3013), byId(3002)], 'name').map((p) => p.name), ['Heavyweight Pocket Tee', 'Lambswool Scarf', 'Linen Overshirt'])
  // A variant that is cheaper but sold out does not set the price.
  const mixed: Fixture = { ...byId(3011), detail: { ...byId(3011).detail, variantsList: byId(3011).detail.variantsList.map((v) => (v.title === 'Khaki / 32' ? { ...v, price: '10.00' } : v)) } }
  assert.deepEqual(ids(applyFilters([mixed], filters({ price: ['0-50'] }))), [])
  assert.deepEqual(ids(listProducts(STORE, filters({ category: ['trousers'], sort: 'price-desc' }))), [3019, 3012, 3011])
})

test('a product without variants is in stock while it has units', () => {
  const plain: ListingProduct = { id: 1, name: 'Gift card', price: '25.00', inventory: 0 }
  const kept: ListingProduct = { id: 2, name: 'Sticker', price: '2.00', inventory: 4 }
  assert.deepEqual(ids(sortProducts([plain, kept], 'featured')), [2, 1])
})

test('the fits switch waits for a vehicle rule: without one it does nothing, and it is never a chip', () => {
  const on = filters()
  assert.equal(on.fits, true)
  assert.equal(applyFilters(STORE, on).length, 20)
  const fits = (p: ListingProduct) => p.id === 3014 || p.id === 3013
  assert.deepEqual(ids(applyFilters(STORE, on, { fits })), [3013, 3014])
  assert.equal(applyFilters(STORE, { ...on, fits: false }, { fits }).length, 20)
  assert.deepEqual(activeFilters(STORE, on), [])
  assert.equal(hasActiveFilters(on), false)
  // The filter groups count only what fits, so a value with no fitting product is unavailable.
  const category = facetGroups(STORE, on, { fits }).find((g) => g.key === 'category')!
  assert.equal(category.values.find((v) => v.value === 'accessories')!.count, 2)
  assert.equal(category.values.find((v) => v.value === 'tees')!.count, 0)
})

test('when nothing fits, the list says where and offers everything there', () => {
  const civic = '2015 Honda Civic'
  assert.deepEqual(noFitText(civic, { name: 'Brakes', category: true }), { title: 'No parts fit your 2015 Honda Civic in Brakes', showAll: 'Show all brake parts' })
  assert.equal(noFitText(civic, { name: 'Lighting', category: true }).showAll, 'Show all lighting parts')
  assert.equal(noFitText(civic, { name: 'Batteries', category: true }).showAll, 'Show all batteries')
  assert.equal(noFitText(civic, { name: 'Oil & fluids', category: true }).showAll, 'Show all oil & fluids')
  assert.equal(noFitText(civic, { name: 'Deals' }).showAll, 'Show all deals')
  assert.deepEqual(noFitText(civic), { title: 'No parts fit your 2015 Honda Civic', showAll: 'Show all parts' })
  assert.deepEqual(noFitText(civic, { page: 'search' }), { title: 'No parts fit your 2015 Honda Civic', showAll: 'Show all results' })
})

test('chips name each chosen value and know the filters without it', () => {
  const f = filters({ size: ['m', '32'], color: ['heather-gray'], price: ['0-50'], category: ['tees'], sort: 'newest' })
  const chips = activeFilters(STORE, f)
  assert.deepEqual(chips.map((c) => c.label), ['Tees', 'Size M', 'Size 32', 'Heather Gray', 'Under $50'])
  assert.equal(chips[1]!.removeLabel, 'Remove filter Size M')
  assert.deepEqual(chips[1]!.next.size, ['32'])
  assert.equal(chips[1]!.next.sort, 'newest')
  assert.deepEqual(toListingQuery(chips[3]!.next), { category: 'tees', size: 'm,32', price: '0-50', sort: 'newest' })
})

test('editing the filters', () => {
  let f = toggleFilter(emptyFilters('price-asc'), 'size', 'm')
  f = toggleFilter(f, 'size', 'l')
  assert.deepEqual(f.size, ['m', 'l'])
  f = toggleFilter(f, 'size', 'm')
  assert.deepEqual(f.size, ['l'])
  assert.equal(hasActiveFilters(f), true)
  assert.deepEqual(removeFilter(f, 'size').size, [])
  const cleared = clearFilters({ ...f, fits: true, color: ['black'] })
  assert.deepEqual(cleared, emptyFilters('price-asc'))
  assert.equal(hasActiveFilters(cleared), false)
  // Clear all leaves the fits switch as the shopper set it.
  assert.equal(clearFilters({ ...f, fits: false }).fits, false)
})

test('the sorts on offer, and the result count', () => {
  assert.deepEqual(listingSorts().map((s) => s.label), ['Featured', 'Newest', 'Price, low to high', 'Price, high to low', 'Name, A to Z'])
  assert.equal(listingSorts('search')[0]!.label, 'Most relevant')
  const styles = { one: 'style', other: 'styles' }
  assert.equal(resultCountText(20, 20, styles), '20 styles')
  assert.equal(resultCountText(1, 1, styles), '1 style')
  assert.equal(resultCountText(8, 20, styles), '8 of 20 styles')
  assert.equal(resultCountText(0, 20, styles), 'No styles match these filters')
  assert.equal(resultCountText(0, 0, styles), 'No styles yet')
  assert.equal(resultCountText(3, 3), '3 products')
})

test('a commerce product fits the rules as it is: Vitaheal\'s seed lists in its own order, nothing to filter by', () => {
  const products: ListingProduct[] = vitahealProducts()
  assert.deepEqual(ids(listProducts(products, emptyFilters())), ids(products))
  assert.deepEqual(facetGroups(products, emptyFilters()).map((g) => g.key).filter((key) => key === 'size' || key === 'color'), [])
})
