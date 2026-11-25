// The Torqline Auto Parts (demo) seed against the reference tables of its catalogue:
// prices, part numbers, the sold-out and "Only 2 left" variants, the collections,
// the universal parts, what fits which vehicle (a 2015 Civic has no brake parts, a
// 2016 Civic has), what BRAKES15 takes off, what search and "Goes well with" find,
// the theme's colour contrast, and the store facts the checkout and the copy must
// agree on. The checks every demo store passes are in demoStores.test.ts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TORQLINE_BLUEPRINT } from '../../src/storefront/demoStores/torqline.ts'
import { historyFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import { TORQLINE_BRANDS, TORQLINE_CATEGORIES, TORQLINE_CHANNEL_ID } from '../../src/storefront/torqlineDemo.ts'
import { campaignStatus, discountFor, findByCode } from '../../src/storefront/campaigns.ts'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { fitLabel, fitState, fittingRows } from '../../src/storefront/fitment.ts'
import type { Vehicle } from '../../src/storefront/fitment.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { recommendFor, searchStore } from '../../src/storefront/search.ts'
import { onBrandColor } from '../../src/storefront/themeSections.ts'
import { optionValuesOf, stockNote } from '../../src/storefront/variants.ts'
import { VEHICLE_YEAR_FROM, VEHICLE_YEAR_TO, VEHICLES } from '../../src/storefront/vehicles.ts'
import { money } from '../../src/maropay/money.ts'
import { contrastRatio } from '../../src/utils/brandContrast.ts'
import type { ProductVariant } from '../../src/stores/useCommerce.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-19'
const STOCK = 'Oxford Warehouse'
const home = snapshotFor(TORQLINE_BLUEPRINT.homeChannel, 'torqline', TODAY)
/** The store installed in another one (slot 5), as Apply would. */
const qaChannel: SalesChannel = {
  ...TORQLINE_BLUEPRINT.homeChannel, id: 'qa-store', name: 'QA store',
  webStore: { ...TORQLINE_BLUEPRINT.homeChannel.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 5 } },
}
const copy = snapshotFor(qaChannel, 'torqline', TODAY)

type SeededProduct = StoreSnapshot['products'][number]
const byId = (snapshot: StoreSnapshot, id: number): SeededProduct => {
  const product = snapshot.products.find((p) => p.id === id)
  assert.ok(product, String(id))
  return product
}
const ids = (products: { id: number }[]) => products.map((p) => p.id)
const variantsOf = (p: SeededProduct) => p.detail!.variantsList
const label = (p: SeededProduct, v: ProductVariant) => [p.name, ...optionValuesOf(v, p.detail!.options)].join(' › ')
const F150_2019: Vehicle = { year: 2019, make: 'Ford', model: 'F-150' }
const fittingIds = (vehicle: Vehicle, state: 'fits' | 'no-fit' | 'universal') => ids(home.products.filter((p) => fitState(p, vehicle) === state))

test('the catalogue is the twenty-one reference parts, at their prices, in their place', () => {
  assert.deepEqual(home.products.map((p) => [p.id, p.name, p.price]), [
    [4001, 'Ceramic Brake Pads, Truck & SUV', '64.99'], [4002, 'Ceramic Brake Pads, Car & Crossover', '49.99'],
    [4003, 'Coated Brake Rotor, Truck & SUV', '79.99'], [4004, 'Coated Brake Rotor, Car & Crossover', '59.99'],
    [4005, 'Extended-Life Oil Filter, Compact', '8.99'], [4006, 'Extended-Life Oil Filter, Truck', '10.99'],
    [4007, 'Cartridge Oil Filter', '11.49'], [4008, 'Engine Air Filter, Truck & SUV', '24.99'], [4009, 'Cabin Air Filter', '21.99'],
    [4010, 'Full Synthetic Motor Oil', '32.99'], [4011, 'DOT 4 Brake Fluid', '14.99'],
    [4012, 'AGM Battery', '219.99'], [4013, 'Standard Battery', '159.99'],
    [4014, 'Halogen Headlight Bulbs, Pair', '24.99'], [4015, 'Brighter Halogen Headlight Bulbs, Pair', '39.99'],
    [4016, 'All-Season Beam Wiper Blade', '21.99'], [4017, 'Rear Wiper Blade', '15.99'],
    [4018, 'Iridium Spark Plugs', '39.99'], [4019, 'All-Weather Floor Mats', '89.99'],
    [4020, 'Digital Tire Pressure Gauge', '14.99'], [4021, 'Portable Jump Starter', '99.99'],
  ])
  const variants = home.products.flatMap(variantsOf)
  assert.equal(variants.length, 35)
  assert.equal(variants.reduce((units, v) => units + v.stock[STOCK]!, 0), 1009)
  for (const p of home.products) {
    assert.equal(p.inventory, variantsOf(p).reduce((units, v) => units + v.stock[STOCK]!, 0), p.name)
    assert.equal(p.sku, variantsOf(p)[0]!.sku, `${p.name}: its SKU is its first variant's`)
    assert.equal(p.price, variantsOf(p).map((v) => v.price).sort((a, b) => Number(a) - Number(b))[0], `${p.name}: its price is its lowest variant's`)
    for (const [n, v] of variantsOf(p).entries()) {
      assert.equal(v.id, p.id * 100 + n + 1, `${label(p, v)}: id`)
      assert.match(v.sku, /^TQ-(BRK|FLT|OIL|BAT|LGT|WPR|IGN|ACC)-\d{4}$/, label(p, v))
    }
  }
  assert.deepEqual(home.market, { currency: 'USD' })
  assert.equal(formatStorePrice(money(5499, home.market.currency), home.market.locale), '$54.99')
})

test('every variant has its own part number, unique however a shopper types it', () => {
  assert.deepEqual(home.products.flatMap((p) => variantsOf(p).map((v) => [label(p, v), v.sku, v.price])), [
    ['Ceramic Brake Pads, Truck & SUV › Front', 'TQ-BRK-4471', '64.99'], ['Ceramic Brake Pads, Truck & SUV › Rear', 'TQ-BRK-4472', '64.99'],
    ['Ceramic Brake Pads, Car & Crossover › Front', 'TQ-BRK-4481', '49.99'], ['Ceramic Brake Pads, Car & Crossover › Rear', 'TQ-BRK-4482', '49.99'],
    ['Coated Brake Rotor, Truck & SUV › Front', 'TQ-BRK-5171', '79.99'], ['Coated Brake Rotor, Truck & SUV › Rear', 'TQ-BRK-5172', '79.99'],
    ['Coated Brake Rotor, Car & Crossover › Front', 'TQ-BRK-5181', '59.99'], ['Coated Brake Rotor, Car & Crossover › Rear', 'TQ-BRK-5182', '59.99'],
    ['Extended-Life Oil Filter, Compact', 'TQ-FLT-2105', '8.99'], ['Extended-Life Oil Filter, Truck', 'TQ-FLT-2160', '10.99'],
    ['Cartridge Oil Filter', 'TQ-FLT-2230', '11.49'], ['Engine Air Filter, Truck & SUV', 'TQ-FLT-3310', '24.99'], ['Cabin Air Filter', 'TQ-FLT-3520', '21.99'],
    ['Full Synthetic Motor Oil › 0W-20', 'TQ-OIL-1020', '32.99'], ['Full Synthetic Motor Oil › 5W-20', 'TQ-OIL-1520', '32.99'], ['Full Synthetic Motor Oil › 5W-30', 'TQ-OIL-1530', '32.99'],
    ['DOT 4 Brake Fluid', 'TQ-OIL-7104', '14.99'],
    ['AGM Battery', 'TQ-BAT-4870', '219.99'], ['Standard Battery', 'TQ-BAT-3510', '159.99'],
    ['Halogen Headlight Bulbs, Pair', 'TQ-LGT-1100', '24.99'], ['Brighter Halogen Headlight Bulbs, Pair', 'TQ-LGT-1150', '39.99'],
    ['All-Season Beam Wiper Blade › 16 in', 'TQ-WPR-6016', '21.99'], ['All-Season Beam Wiper Blade › 18 in', 'TQ-WPR-6018', '21.99'],
    ['All-Season Beam Wiper Blade › 20 in', 'TQ-WPR-6020', '21.99'], ['All-Season Beam Wiper Blade › 22 in', 'TQ-WPR-6022', '21.99'],
    ['All-Season Beam Wiper Blade › 24 in', 'TQ-WPR-6024', '21.99'], ['All-Season Beam Wiper Blade › 26 in', 'TQ-WPR-6026', '21.99'],
    ['Rear Wiper Blade', 'TQ-WPR-6412', '15.99'],
    ['Iridium Spark Plugs › Set of 4', 'TQ-IGN-8104', '39.99'], ['Iridium Spark Plugs › Set of 6', 'TQ-IGN-8106', '57.99'], ['Iridium Spark Plugs › Set of 8', 'TQ-IGN-8108', '75.99'],
    ['All-Weather Floor Mats › Front row', 'TQ-ACC-9201', '89.99'], ['All-Weather Floor Mats › Front and rear', 'TQ-ACC-9202', '139.99'],
    ['Digital Tire Pressure Gauge', 'TQ-ACC-9310', '14.99'], ['Portable Jump Starter', 'TQ-ACC-9420', '99.99'],
  ])
  const typed = home.products.flatMap(variantsOf).map((v) => v.sku.toLowerCase().replace(/-/g, ''))
  assert.equal(new Set(typed).size, typed.length, 'no two part numbers are the same without case or dashes')
})

test('options are one row of buttons: Position, Grade, Length, Pack or Set; every other part has none', () => {
  const shapes = home.products.map((p) => [p.id, p.detail!.options.map((o) => `${o.name}: ${o.values.join(', ')}`).join('') || 'none'])
  assert.deepEqual(shapes.filter(([, shape]) => shape !== 'none'), [
    [4001, 'Position: Front, Rear'], [4002, 'Position: Front, Rear'], [4003, 'Position: Front, Rear'], [4004, 'Position: Front, Rear'],
    [4010, 'Grade: 0W-20, 5W-20, 5W-30'], [4016, 'Length: 16 in, 18 in, 20 in, 22 in, 24 in, 26 in'],
    [4018, 'Pack: Set of 4, Set of 6, Set of 8'], [4019, 'Set: Front row, Front and rear'],
  ])
  for (const p of home.products) {
    for (const option of p.detail!.options) assert.equal(option.display, 'buttons', `${p.name} › ${option.name}`)
    assert.equal(p.detail!.hasVariants, p.detail!.options.length > 0, p.name)
    if (!p.detail!.options.length) assert.deepEqual(variantsOf(p).map((v) => v.title), ['Default'], p.name)
  }
})

test('one variant is sold out and three are down to their last few; every other has four or more', () => {
  const where = (stock: (units: number) => boolean) => home.products.flatMap((p) => variantsOf(p).filter((v) => stock(v.stock[STOCK]!)).map((v) => label(p, v)))
  assert.deepEqual(where((units) => units === 0), ['Coated Brake Rotor, Car & Crossover › Rear'])
  assert.deepEqual(where((units) => units > 0 && units < 4), [
    'Ceramic Brake Pads, Car & Crossover › Rear',
    'AGM Battery',
    'Iridium Spark Plugs › Set of 8',
  ])
  const notes = home.products.flatMap((p) => variantsOf(p).map((v) => [label(p, v), stockNote(v)])).filter(([, note]) => note)
  assert.deepEqual(notes, [
    ['Ceramic Brake Pads, Car & Crossover › Rear', 'Only 2 left'],
    ['AGM Battery', 'Only 3 left'],
    ['Iridium Spark Plugs › Set of 8', 'Only 1 left'],
  ])
})

test('three parts are on sale in Deals, with a compare-at price on every variant, and none is a brake part', () => {
  const onSale = home.products.filter((p) => p.compareAtPrice)
  assert.deepEqual(onSale.map((p) => [p.name, p.price, p.compareAtPrice]), [
    ['AGM Battery', '219.99', '249.99'],
    ['Brighter Halogen Headlight Bulbs, Pair', '39.99', '49.99'],
    ['Portable Jump Starter', '99.99', '129.99'],
  ])
  for (const p of onSale) {
    assert.ok(p.collections.includes('Deals'), `${p.name} is in Deals`)
    assert.ok(!p.collections.includes('Brakes'), `${p.name}: BRAKES15 never meets a sale price`)
    for (const v of variantsOf(p)) assert.equal(v.compareAtPrice, p.compareAtPrice, label(p, v))
  }
})

test('the collections are the eight categories, then Deals; each part is in its category first', () => {
  const members = (title: string) => ids(home.products.filter((p) => p.collections.includes(title)))
  assert.deepEqual(home.collections.map((c) => [c.id, c.title, c.productCount]), [
    [4901, 'Brakes', 4], [4902, 'Filters', 5], [4903, 'Oil & fluids', 2], [4904, 'Batteries', 2], [4905, 'Lighting', 2],
    [4906, 'Wipers', 2], [4907, 'Ignition', 1], [4908, 'Accessories', 3], [4909, 'Deals', 3],
  ])
  assert.deepEqual(members('Brakes'), [4001, 4002, 4003, 4004])
  assert.deepEqual(members('Filters'), [4005, 4006, 4007, 4008, 4009])
  assert.deepEqual(members('Oil & fluids'), [4010, 4011])
  assert.deepEqual(members('Batteries'), [4012, 4013])
  assert.deepEqual(members('Accessories'), [4019, 4020, 4021])
  assert.deepEqual(members('Deals'), [4012, 4015, 4021])
  for (const c of home.collections) {
    assert.equal(c.productCount, members(c.title).length, c.title)
    assert.ok(c.description, `${c.title} has a description`)
  }
  for (const p of home.products) {
    assert.equal(p.detail!.tag, p.collections[0], `${p.name}: its category is its first collection`)
    assert.equal(p.detail!.collection, p.collections[0], p.name)
    assert.ok((TORQLINE_CATEGORIES as readonly string[]).includes(p.detail!.tag), p.name)
  }
  assert.deepEqual([...new Set(home.products.map((p) => p.detail!.tag))], [...TORQLINE_CATEGORIES])
})

test('four made-up part brands, each the vendor of its parts', () => {
  assert.deepEqual([...new Set(home.products.map((p) => p.detail!.brand))].sort(), [...TORQLINE_BRANDS].sort())
  for (const p of home.products) assert.equal(p.vendor, p.detail!.brand, p.name)
  const brandOf = (brand: string) => ids(home.products.filter((p) => p.detail!.brand === brand))
  assert.deepEqual(brandOf('Haltmark'), [4001, 4002, 4003, 4004])
  assert.deepEqual(brandOf('Voltaro'), [4012, 4013, 4021])
  assert.deepEqual(brandOf('Lumvane'), [4014, 4015, 4016, 4017])
})

test('every part has specifications and a warranty, and photos: two each, one for the truck oil filter, still waiting for a card photo', () => {
  for (const p of home.products) {
    const specs = p.detail!.specs ?? []
    assert.ok(specs.length >= 3, `${p.name}: specifications`)
    for (const spec of specs) assert.ok(spec.label && spec.value, `${p.name}: ${spec.label}`)
    assert.ok(p.detail!.warranty, `${p.name}: warranty`)
    assert.equal(p.images, p.imageUrls!.length)
  }
  assert.deepEqual(byId(home, 4001).detail!.specs![0], { label: 'Friction material', value: 'Ceramic' })
  assert.equal(byId(home, 4001).detail!.warranty, 'Limited lifetime warranty')
  const photoCount = home.products.map((p) => [p.id, p.imageUrls!.length])
  assert.deepEqual(photoCount.filter(([, n]) => n !== 2), [[4006, 1]])
  assert.deepEqual(byId(home, 4006).imageUrls, ['/storefront/torqline/oil-filter-truck-2.jpg'])
  assert.deepEqual(byId(home, 4013).imageUrls, ['/storefront/torqline/battery-standard-1.jpg', '/storefront/torqline/battery-standard-2.jpg'])
})

test('oil, brake fluid, the tire gauge and the jump starter fit any vehicle; every other part lists the vehicles it fits', () => {
  assert.deepEqual(ids(home.products.filter((p) => p.detail!.fitment!.universal)), [4010, 4011, 4020, 4021])
  for (const p of home.products) {
    const fitment = p.detail!.fitment!
    assert.equal(fitment.universal, fitment.rows.length === 0, `${p.name}: universal, or rows`)
    assert.equal(fitState(p, null), fitment.universal ? 'universal' : 'unknown', p.name)
    // A note only where the fit depends on it: the wiper lengths.
    for (const row of fitment.rows) if (row.note) assert.equal(p.id, 4016, `${p.name}: ${row.make} ${row.model} note`)
  }
  assert.deepEqual(fittingRows(byId(home, 4016), F150_2019).map((row) => row.note), ['Driver 22 in, passenger 22 in'])
  // Truck & SUV parts fit the five trucks and SUVs; car & crossover parts the five cars and crossovers.
  const models = (id: number) => [...new Set(byId(home, id).detail!.fitment!.rows.map((row) => row.model))]
  assert.deepEqual(models(4001), ['F-150', 'Silverado 1500', '1500', 'Tacoma', 'Wrangler'])
  assert.deepEqual(models(4002), ['Camry', 'Civic', 'RAV4', 'CR-V', 'Rogue'])
  assert.deepEqual(models(4017).sort(), ['CR-V', 'RAV4', 'Rogue', 'Wrangler'])
  // Split by generation where the part changes with it.
  assert.deepEqual(byId(home, 4001).detail!.fitment!.rows.filter((row) => row.model === 'F-150').map((row) => [row.yearFrom, row.yearTo]), [[2015, 2020], [2021, 2024]])
})

test('every vehicle, in every year, has parts that fit it and parts that don’t', () => {
  for (const model of VEHICLES) {
    for (let year = VEHICLE_YEAR_FROM; year <= VEHICLE_YEAR_TO; year++) {
      const vehicle = { year, make: model.make, model: model.model }
      assert.ok(fittingIds(vehicle, 'fits').length >= 5, `${year} ${model.model}: parts that fit`)
      assert.ok(fittingIds(vehicle, 'no-fit').length >= 5, `${year} ${model.model}: parts that don’t`)
      // Every vehicle takes one of the three oil filters, and one battery.
      assert.equal(fittingIds(vehicle, 'fits').filter((id) => [4005, 4006, 4007].includes(id)).length, 1, `${year} ${model.model}: one oil filter`)
      assert.equal(fittingIds(vehicle, 'fits').filter((id) => [4012, 4013].includes(id)).length, 1, `${year} ${model.model}: one battery`)
    }
  }
})

test('a 2019 F-150 sees the truck parts fit and the car parts not, in the words of every badge', () => {
  assert.deepEqual(fittingIds(F150_2019, 'fits'), [4001, 4003, 4006, 4008, 4009, 4012, 4014, 4015, 4016, 4018, 4019])
  assert.deepEqual(fittingIds(F150_2019, 'no-fit'), [4002, 4004, 4005, 4007, 4013, 4017])
  assert.deepEqual(fittingIds(F150_2019, 'universal'), [4010, 4011, 4020, 4021])
  assert.equal(fitLabel(fitState(byId(home, 4001), F150_2019), F150_2019), 'Fits your 2019 Ford F-150')
  assert.equal(fitLabel(fitState(byId(home, 4002), F150_2019), F150_2019), 'Doesn’t fit your 2019 Ford F-150')
  assert.equal(fitLabel(fitState(byId(home, 4010), F150_2019), F150_2019), 'Universal fit')
  assert.equal(fitLabel(fitState(byId(home, 4001), null), null), 'Check fit')
})

test('a 2015 Civic has no brake parts, and a 2016 Civic has the car pads and rotors', () => {
  const brakes = (vehicle: Vehicle) => ids(home.products.filter((p) => p.collections.includes('Brakes') && fitState(p, vehicle) === 'fits'))
  assert.deepEqual(brakes({ year: 2015, make: 'Honda', model: 'Civic' }), [])
  assert.deepEqual(brakes({ year: 2016, make: 'Honda', model: 'Civic' }), [4002, 4004])
  // No brake part fits any vehicle universally, so the 2015 Civic's Brakes list is empty.
  assert.ok(home.products.filter((p) => p.collections.includes('Brakes')).every((p) => !p.detail!.fitment!.universal))
  // It still has parts elsewhere.
  assert.deepEqual(fittingIds({ year: 2015, make: 'Honda', model: 'Civic' }, 'fits'), [4005, 4009, 4013, 4014, 4015, 4016, 4018])
})

test('BRAKES15 takes 15% off brakes: front truck pads come to $55.24', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  const campaign = findByCode(home.campaigns, TORQLINE_CHANNEL_ID, 'brakes15')
  assert.equal(campaign?.name, 'Brake week')
  assert.equal(campaignStatus(campaign!, now), 'Active')
  const pads = byId(home, 4001)
  const front = variantsOf(pads)[0]!
  assert.equal(front.sku, 'TQ-BRK-4471')
  const line = { price: front.price, qty: 1, collections: pads.collections }
  const total = (lines: (typeof line)[]) => {
    const subtotal = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.qty, 0)
    return formatStorePrice(money(subtotal - (discountFor(lines, campaign, 'USD')?.amount.amount ?? 0), 'USD'))
  }
  assert.equal(formatStorePrice(discountFor([line], campaign, 'USD')!.amount), '$9.75')
  assert.equal(total([line]), '$55.24')
  // Motor oil is not a brake part: the discount stays $9.75.
  const oil = byId(home, 4010)
  assert.equal(total([line, { price: oil.price, qty: 1, collections: oil.collections }]), '$88.23')
  // Two rotors and the pads: 15% off all three.
  const rotor = byId(home, 4003)
  assert.equal(total([line, { price: rotor.price, qty: 2, collections: rotor.collections }]), '$191.22')
  assert.deepEqual(ids(home.products.filter((p) => p.collections.some((c) => campaign!.targets.includes(c)))), [4001, 4002, 4003, 4004])
})

test('one campaign runs, one has ended and one is to come', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  assert.deepEqual(home.campaigns.map((c) => [c.name, c.targets, c.offer?.code, campaignStatus(c, now)]), [
    ['Brake week', ['Brakes'], 'BRAKES15', 'Active'],
    ['Battery check', ['Batteries'], 'BATTERY10', 'Ended'],
    ['Winter wipers', ['Wipers'], 'WIPERS20', 'Scheduled'],
  ])
  assert.deepEqual(home.campaigns.map((c) => [c.startDate, c.endDate]), [['2026-11-16', '2026-11-30'], ['2026-10-10', '2026-10-17'], ['2026-12-03', '2026-12-16']])
})

test('the search rules change what a search finds, as the catalogue tables say', () => {
  const rules = { synonyms: home.merchandising.synonyms, redirects: home.merchandising.redirects, pins: home.merchandising.searchPins, hiddenProductIds: [] }
  const none = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }
  const found = (query: string, withRules = true) => ids(searchStore(query, home.products, withRules ? rules : none).products)
  assert.deepEqual(found('disc', false), [])
  assert.deepEqual(found('disc'), [4003, 4004])
  assert.deepEqual(found('brake disc'), [4003, 4004])
  assert.deepEqual(found('car battery', false), [])
  assert.deepEqual(found('car battery'), [4012, 4013])
  assert.deepEqual(found('windshield wiper', false), [4016])
  assert.deepEqual(found('windshield wiper'), [4016, 4017])
  assert.deepEqual(found('floor liners', false), [])
  assert.deepEqual(found('floor liners'), [4019])
  assert.deepEqual(found('headlight', false), [4014, 4015])
  assert.deepEqual(found('headlight'), [4015, 4014])
  assert.deepEqual(found('oil change', false), [4005])
  assert.deepEqual(found('oil change'), [4010, 4005, 4006, 4007])
  assert.equal(searchStore('returns', home.products, rules).redirectTo, 'https://2000290-14.uat.maropost.store/policies/refund-policy')
  assert.equal(searchStore('fitment', home.products, rules).redirectTo, 'https://2000290-14.uat.maropost.store/page/fitment-guarantee')
  assert.equal(searchStore('shipping', home.products, rules).redirectTo, 'https://2000290-14.uat.maropost.store/page/shipping-and-returns')
})

test('"Goes well with" puts a part beside the others of its category first', () => {
  const engine = home.merchandising.engines.find((e) => e.status === 'active')!
  assert.equal(engine.name, 'Goes well with')
  const row = (id: number) => ids(recommendFor(byId(home, id), home.products, { ...engine, type: engine.type as 'frequently_purchased_together' }).slice(0, 4))
  assert.deepEqual(row(4001).slice(0, 3), [4002, 4003, 4004])
  assert.deepEqual(row(4005), [4006, 4007, 4008, 4009])
  assert.deepEqual(row(4021).slice(0, 2), [4012, 4015], 'the other deals first')
})

test('the store is a USD web store with free delivery, no Click & collect, and copy that says what the checkout does', () => {
  const channel = TORQLINE_BLUEPRINT.homeChannel
  assert.equal(channel.id, 'torqline-demo')
  assert.equal(channel.name, 'Torqline Auto Parts (demo)')
  assert.equal(channel.storeNumber, 14)
  assert.equal(channel.webStore?.domain, '2000290-14.uat.maropost.store')
  assert.deepEqual(channel.webStore?.blueprint, { original: 'torqline', slot: 4 })
  assert.equal(channel.webStore?.currency, 'USD')
  assert.equal(channel.webStore?.locale, undefined)
  assert.equal(channel.webStore?.merchandiseConnected, true)
  assert.equal(channel.webStore?.demo, true)
  assert.equal(TORQLINE_BLUEPRINT.seedVersion, 1)
  assert.deepEqual(TORQLINE_BLUEPRINT.capabilities, { subscriptions: false, variantPicker: true, sizeGuide: false, vehicleFitment: true })
  assert.deepEqual(TORQLINE_BLUEPRINT.admin.timezone, 'America/New_York')
  assert.deepEqual([TORQLINE_BLUEPRINT.admin.audienceListId, TORQLINE_BLUEPRINT.admin.announcementContentId], [904, 9003])
  assert.deepEqual(home.checkout, { ...checkoutProfile('USD'), keepsAddress: true, pickup: false })
  assert.deepEqual(home.sizeCharts, [])
  // Where the pages and the chatbot say the store ships is where the checkout delivers.
  const shipping = home.content.find((e) => e.handle === 'shipping-and-returns')!.body
  const whereWeShip = home.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? []).find((e) => e.title === 'Where we ship')!.text
  for (const country of home.checkout.countries) {
    assert.ok(shipping.includes(country), `the shipping page names ${country}`)
    assert.ok(whereWeShip.includes(country), `the chatbot names ${country}`)
  }
  const copyText = JSON.stringify([home.content, home.chatbot, home.chrome, home.theme.templates])
  // "Pickups" are trucks; no copy offers to collect an order.
  assert.equal(copyText.match(/click (&|and) collect|collect (it )?(in|from)|pick ?up (in|from|at)|in-store pickup/i)?.[0], undefined, 'nothing offers collection')
  assert.equal(copyText.match(/\b(2 to 4|1 to 3|5 to 7) business days/)?.[0], undefined, 'every delivery time is 3 to 5 business days')
  assert.ok(copyText.includes('3 to 5 business days'))
  assert.equal(copyText.match(/\b30 days\b/)?.[0], undefined, 'returns are 90 days everywhere')
  assert.equal(home.chrome.copyright, '© 2026 Torqline Auto Parts (demo store)')
  assert.equal(home.chrome.wordmark, 'Torqline')
})

test('the theme is Torqline: sections drawing, charcoal and safety yellow, Barlow Condensed uppercase over Barlow, corners of 4', () => {
  const styles = home.theme.styles
  assert.deepEqual(styles, {
    brandColor: '#17191c', accentColor: '#ffc61a', background: '#ffffff', textColor: '#17191c',
    headingFont: 'Barlow Condensed', bodyFont: 'Barlow', cornerRadius: 4, buttonStyle: 'solid',
    saleBadgeColor: '#c8102e', customBadgeColor: '#17191c', soldOutBadgeColor: '#5b616b', drawing: 'sections',
    buttonColor: '#ffc61a', surfaceColor: '#f2f3f5', mutedColor: '#5b616b', dividerColor: '#dfe2e6', headingCase: 'Uppercase',
  })
  assert.equal(home.theme.id, 'theme-torqline')
  assert.equal(TORQLINE_BLUEPRINT.packShot?.shape, 'box')
  assert.equal(TORQLINE_BLUEPRINT.card.thumbnail, '/storefront/torqline/theme.jpg')
})

test('the theme’s colour pairs pass WCAG 2.1 AA for text', () => {
  const s = home.theme.styles
  const ratio = (a: string, b: string) => contrastRatio(a, b)!
  const pairs: [string, string, string][] = [
    ['text on the page', s.textColor, s.background],
    ['text on the surface', s.textColor, s.surfaceColor!],
    ['muted text on the page', s.mutedColor!, s.background],
    ['muted text on the surface', s.mutedColor!, s.surfaceColor!],
    ['button text on the yellow', onBrandColor(s.buttonColor!)!, s.buttonColor!],
    ['header text on charcoal', onBrandColor(s.brandColor)!, s.brandColor],
    ['sale badge', onBrandColor(s.saleBadgeColor)!, s.saleBadgeColor],
    ['custom badge', onBrandColor(s.customBadgeColor)!, s.customBadgeColor],
    ['sold-out badge', onBrandColor(s.soldOutBadgeColor)!, s.soldOutBadgeColor],
    ['yellow on charcoal', s.accentColor, s.brandColor],
  ]
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name}: ${ratio(fg, bg).toFixed(2)}:1`)
  // The yellow button's text comes out charcoal, and the sale badge's white.
  assert.equal(onBrandColor(s.buttonColor!), '#121011')
  assert.equal(onBrandColor(s.saleBadgeColor), '#ffffff')
})

test('the templates are the ones the theme names, with the new vehicle finder, fit rows and dense cards', () => {
  const t = home.theme.templates
  const kinds = (template: keyof typeof t) => t[template].map((s) => s.kind)
  assert.deepEqual(kinds('home'), ['announcement-bar', 'header', 'vehicle-finder', 'collection-grid', 'featured-products', 'image-with-text', 'featured-products', 'image-with-text', 'icon-row', 'newsletter', 'footer'])
  assert.deepEqual(kinds('product'), ['header', 'product-detail', 'featured-products', 'footer'])
  assert.deepEqual(kinds('collection'), ['header', 'collection-grid', 'footer'])
  assert.deepEqual(kinds('cart'), ['header', 'cart-summary', 'footer'])
  const section = (id: string) => [...t.home, ...t.product, ...t.collection, ...t.cart].find((s) => s.id === `torqline-${id}`)!
  const finder = section('home-vehicle-finder').settings
  assert.equal(finder.image, '/storefront/torqline/hero.jpg')
  assert.equal(finder.partNumberSearch, true)
  assert.ok(finder.headline && finder.subheadline)
  assert.deepEqual(section('home-collections').blocks!.map((b) => [b.settings.label, b.settings.link]), TORQLINE_CATEGORIES.map((c) => [c, `/collections/${c === 'Oil & fluids' ? 'oil-fluids' : c.toLowerCase()}`]))
  const popular = section('home-popular').settings
  assert.equal(popular.title, 'Popular parts')
  assert.equal(popular.collection, 'all')
  assert.equal(popular.productCount, 4)
  assert.equal(popular.vehicle, true)
  assert.equal(section('home-brakes').settings.collection, 'brakes')
  assert.equal(section('home-story-oil').settings.buttonLink, '/products/full-synthetic-motor-oil-4010')
  assert.deepEqual(section('home-trust').blocks!.map((b) => b.settings.icon), ['truck', 'shield-check', 'rotate-ccw', 'headphones'])
  for (const kind of ['header', 'footer']) for (const s of [...t.home, ...t.product, ...t.collection, ...t.cart].filter((x) => x.kind === kind)) assert.equal(s.settings.colorScheme, 'Dark', s.id)
  assert.equal(section('home-header').settings.sticky, true)
  const detail = section('product-detail')
  assert.equal(detail.settings.imageRatio, 'Square')
  assert.equal(detail.settings.fitment, true)
  assert.equal(detail.settings.sizeGuide, false)
  assert.deepEqual(detail.blocks!.map((b) => [b.kind, b.settings.title, b.settings.source, b.settings.open]), [
    ['collapsible-row', 'Description', 'description', true],
    ['collapsible-row', 'Specifications', 'specs', false],
    ['collapsible-row', 'Vehicle fit', 'fitment', false],
    ['collapsible-row', 'Warranty', 'warranty', false],
    ['collapsible-row', 'Shipping and returns', 'delivery-returns', false],
  ])
  assert.equal(section('product-related').settings.title, 'You may also need')
  const grid = section('collection-grid').settings
  assert.deepEqual([grid.filters, grid.sort, grid.quickAdd, grid.cardStyle, grid.columns], [true, true, true, 'Dense', 4])
})

test('the chatbot answers on the auto-parts profile, and the store has three earlier chats, one about fit, and no subscribers', () => {
  assert.equal(home.chatbot.assistantProfile, 'auto-parts')
  const config = home.chatbot.config
  assert.equal(config.brandName, 'Torqline assistant')
  assert.equal(config.position, 'right')
  assert.deepEqual(config.quickPrompts!.map((p) => p.text), ['Does this part fit my vehicle?', 'Where is my order?', 'How do returns work?', 'Look up a part number', 'What’s on sale?'])
  // What the chatbot knows agrees with the pages it names.
  const entries = config.knowledgeSources!.flatMap((s) => s.entries ?? [])
  for (const source of config.knowledgeSources!) assert.equal(source.items, source.entries!.length, source.name)
  const pages = new Map(home.content.map((e) => [`/${e.kind === 'page' ? 'page' : 'policies'}/${e.handle}`, e.body]))
  for (const entry of entries) assert.ok(pages.has(entry.url!), `${entry.title} → ${entry.url}`)
  assert.ok(pages.get('/page/fitment-guarantee')!.includes('TQ-BRK-4471'))
  assert.deepEqual(home.plans, [])
  const history = historyFor(TORQLINE_CHANNEL_ID, TODAY)!
  assert.deepEqual(history.subscriptions, [])
  assert.deepEqual(history.conversations.map((c) => c.topic), ['Fitment', 'Part numbers', 'Returns'])
  // The part numbers and prices a chat quotes are the catalogue's.
  const said = history.conversations.flatMap((c) => c.messages.map((m) => m.text)).join(' ')
  for (const sku of said.match(/TQ-[A-Z]{3}-\d{4}/g) ?? []) assert.ok(home.products.some((p) => variantsOf(p).some((v) => v.sku === sku)), sku)
  assert.ok(said.includes('$10.99') && byId(home, 4006).price === '10.99')
})

test('installed in another store, the same store with that store\'s ids, channel and links, and fitment copied per part', () => {
  assert.deepEqual(ids(copy.products), home.products.map((p) => p.id - 4000 + 54000))
  assert.ok(copy.products.every((p) => p.channelIds?.length === 1 && p.channelIds[0] === 'qa-store' && p.detail!.salesChannels[0] === 'QA store'))
  assert.equal(variantsOf(byId(copy, 54001))[0]!.id, 5400101)
  assert.equal(variantsOf(byId(copy, 54001))[0]!.sku, 'TQ-BRK-4471')
  assert.deepEqual(copy.merchandising.searchPins.map((p) => p.pinnedProductIds), [['54010', '54005', '54006', '54007'], ['54015']])
  assert.equal(copy.merchandising.redirects[0]!.leadsTo, 'https://qa-store.example/policies/refund-policy')
  assert.equal(copy.theme.templates.home.find((s) => s.id === 'qa-store--torqline-home-story-oil')?.settings.buttonLink, '/products/full-synthetic-motor-oil-54010')
  assert.deepEqual(copy.collections.map((c) => c.id), [54901, 54902, 54903, 54904, 54905, 54906, 54907, 54908, 54909])
  const text = JSON.stringify(copy)
  assert.ok(!text.includes('torqline-demo') && !text.includes('2000290-14'), 'nothing of the home store is left')
  assert.deepEqual(copy.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.fitment]), home.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.fitment]))
  // Two parts that fit the same vehicles never share a row: editing one leaves the other as it was.
  const fresh = snapshotFor(TORQLINE_BLUEPRINT.homeChannel, 'torqline', TODAY)
  fresh.products[1]!.detail!.fitment!.rows[0]!.yearTo = 2015
  assert.equal(fresh.products[3]!.detail!.fitment!.rows[0]!.yearTo, 2017, 'the car rotor keeps its own row')
})
