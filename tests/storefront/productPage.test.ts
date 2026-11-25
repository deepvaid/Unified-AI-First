// The product page of the sections drawing (src/storefront/productPage.ts), on
// Northfold's own seed: the gallery follows the colour, a colour without photos
// says what is shown, sale prices and "From", the choice kept in the URL, the
// product template's collapsible rows, and the row of other products when the store
// has no recommendation engine.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { TORQLINE_BLUEPRINT } from '../../src/storefront/demoStores/torqline.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import {
  acrossCollections, colorOptionOf, fitmentTable, forSameAudience, forSameVehicles, galleryAlt, galleryFor, partNumberOf, priceFor, productRows,
  relatedByCollection, rowSource, selectionFromQuery, selectionQuery, sharesVehicle, UNIVERSAL_FIT_TEXT, withSelectionQuery,
} from '../../src/storefront/productPage.ts'
import { initialSelection, variantFor } from '../../src/storefront/variants.ts'

const home = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-20')
type Seeded = StoreSnapshot['products'][number]
const byName = (name: string): Seeded => {
  const product = home.products.find((p) => p.name === name)
  assert.ok(product, name)
  return product
}
const overshirt = byName('Linen Overshirt')
const blouse = byName('Washed Silk Blouse')
const tee = byName('Organic Cotton Tee')
const tote = byName('Canvas Market Tote')
const photo = (file: string) => `/storefront/northfold/${file}`

test('the gallery shows the chosen colour’s own photos, and only photos of that colour', () => {
  assert.deepEqual(galleryFor(overshirt, { Color: 'Sand' }), {
    images: [photo('linen-overshirt-sand.jpg'), photo('linen-overshirt-detail.jpg')], colors: ['Sand', 'Sand'], color: 'Sand', shownIn: '',
  })
  // The close-up is of the sand linen, so Black and Olive show their own photo alone.
  assert.deepEqual(galleryFor(overshirt, { Color: 'Black' }), { images: [photo('linen-overshirt-black.jpg')], colors: ['Black'], color: 'Black', shownIn: '' })
  assert.deepEqual(galleryFor(overshirt, { Color: 'Olive', Size: 'M' }).images, [photo('linen-overshirt-olive.jpg')])
  // Every colourway product leads with its first colour's photos when nothing is chosen.
  assert.deepEqual(galleryFor(overshirt, {}).images, [photo('linen-overshirt-sand.jpg'), photo('linen-overshirt-detail.jpg')])
  assert.deepEqual(galleryFor(tee, { Color: 'Sage' }).colors, ['Sage', 'Sage'])
})

test('a photo listed under several colours, or under none, names no colour in its alt text', () => {
  const shared = {
    name: 'Shirt',
    imageUrls: ['a.jpg', 'b.jpg', 'detail.jpg', 'loose.jpg'],
    detail: { options: [{ name: 'Color', values: ['Red', 'Blue', 'Green'] }], imagesByColor: { Red: ['a.jpg', 'detail.jpg'], Blue: ['b.jpg', 'detail.jpg'] } },
  }
  const red = galleryFor(shared, { Color: 'Red' })
  assert.deepEqual(red.colors, ['Red', ''])
  assert.deepEqual(red.images.map((_, i) => galleryAlt(shared.name, red.colors[i]!, i, red.images.length)), ['Shirt in Red', 'Shirt, picture 2 of 2'])
  // Green has no photos: Red's are shown, said so, and each still names only its own colour.
  assert.deepEqual(galleryFor(shared, { Color: 'Green' }), { images: ['a.jpg', 'detail.jpg'], colors: ['Red', ''], color: 'Red', shownIn: 'Shown in Red' })
  // Photos by colour but none for the first colour: the product's photos, each named only when one colour lists it.
  const unlisted = { ...shared, detail: { ...shared.detail, imagesByColor: { Blue: ['b.jpg'] } } }
  assert.deepEqual(galleryFor(unlisted, { Color: 'Red' }).colors, ['', 'Blue', '', ''])
})

test('a colour without photos of its own shows the first colour and says so', () => {
  // A product without photos by colour pictures its first colour.
  assert.deepEqual(galleryFor(blouse, { Color: 'Ivory' }), {
    images: [photo('washed-silk-blouse-1.jpg'), photo('washed-silk-blouse-2.jpg')], colors: ['Ivory', 'Ivory'], color: 'Ivory', shownIn: '',
  })
  assert.deepEqual(galleryFor(blouse, { Color: 'Black' }), {
    images: [photo('washed-silk-blouse-1.jpg'), photo('washed-silk-blouse-2.jpg')], colors: ['Ivory', 'Ivory'], color: 'Ivory', shownIn: 'Shown in Ivory',
  })
  // A product in one look has no colour to name.
  assert.deepEqual(galleryFor(tote, {}), { images: tote.imageUrls, colors: ['', ''], color: '', shownIn: '' })
  assert.equal(colorOptionOf(tote.detail!.options), undefined)
})

test('alt text names the product and the colour pictured', () => {
  assert.equal(galleryAlt('Linen Overshirt', 'Sand', 0, 2), 'Linen Overshirt in Sand')
  assert.equal(galleryAlt('Linen Overshirt', 'Sand', 1, 2), 'Linen Overshirt in Sand, picture 2 of 2')
  assert.equal(galleryAlt('Canvas Market Tote', '', 0, 1), 'Canvas Market Tote')
})

test('a sale price reads with the "was" price and the percent off', () => {
  assert.deepEqual(priceFor(blouse), { price: '88.00', compareAt: '118.00', percentOff: 25, from: false })
  assert.deepEqual(priceFor(byName('Cotton Cable Sweater')), { price: '118.00', compareAt: '148.00', percentOff: 20, from: false })
  const black = variantFor(blouse, { Color: 'Black', Size: 'M' })!
  assert.deepEqual(priceFor(blouse, black), { price: '88.00', compareAt: '118.00', percentOff: 25, from: false })
  assert.deepEqual(priceFor(overshirt), { price: '98.00', compareAt: '', percentOff: 0, from: false })
})

test('variants that differ in price read "From" the lowest until one is chosen', () => {
  const product = {
    price: '20.00', compareAtPrice: '', publishStatus: 'Published',
    detail: { variantsList: [{ price: '24.00' }, { price: '20.00' }, { price: '30.00' }] },
  }
  assert.deepEqual(priceFor(product), { price: '20.00', compareAt: '', percentOff: 0, from: true })
  assert.deepEqual(priceFor(product, { price: '30.00' }), { price: '30.00', compareAt: '', percentOff: 0, from: false })
  // A "was" price that is not higher is no sale.
  assert.equal(priceFor({ ...product, detail: undefined }, { price: '30.00', compareAtPrice: '30.00' }).compareAt, '')
})

test('the choice goes in the URL, and a shared link opens it again', () => {
  const options = overshirt.detail!.options
  assert.deepEqual(selectionQuery(options, { Color: 'Sand', Size: 'M' }), { color: 'sand', size: 'm' })
  assert.deepEqual(selectionQuery(options, { Color: 'Sand' }), { color: 'sand' })
  // Other keys stay; an option let go leaves the URL.
  assert.deepEqual(withSelectionQuery({ size: 'l', sizeGuide: '1', color: 'black' }, options, { Color: 'Olive' }), { sizeGuide: '1', color: 'olive' })
  const shared = selectionFromQuery({ color: 'sand', size: ['m', 'l'], other: undefined })
  assert.deepEqual(shared, { color: 'sand', size: 'm' })
  assert.deepEqual(initialSelection(overshirt, shared), { Color: 'Sand', Size: 'M' })
  // A colour in two words.
  const stripe = byName('Breton Stripe Top')
  assert.deepEqual(selectionQuery(stripe.detail!.options, { Color: 'Black Stripe', Size: 'XS' }), { color: 'black-stripe', size: 'xs' })
  assert.deepEqual(initialSelection(stripe, { color: 'black-stripe' }), { Color: 'Black Stripe' })
})

test('an option with one value needs no word in the URL', () => {
  const options = [{ name: 'Color', values: ['Natural'] }, { name: 'Size', values: ['S', 'M'] }]
  assert.deepEqual(selectionQuery(options, { Color: 'Natural', Size: 'S' }), { size: 's' })
})

test('the product template’s rows read the product', () => {
  const detail = home.theme.templates.product.find((s) => s.kind === 'product-detail')!
  const rows = productRows(detail.blocks, overshirt, { sizeGuide: true })
  assert.deepEqual(rows.map((r) => [r.title, r.source, r.open]), [
    ['Description', 'description', true],
    ['Fit and sizing', 'fit', false],
    ['Fabric and care', 'fabric-care', false],
    ['Delivery and returns', 'delivery-returns', false],
  ])
  assert.deepEqual(rows[0]!.paragraphs, [overshirt.detail!.description])
  assert.deepEqual(rows[1]!.paragraphs, [`Relaxed fit. Model is 6'1" and wears M.`])
  assert.equal(rows[1]!.sizeGuide, true)
  assert.deepEqual(rows[2]!.facts, [
    { label: 'Fabric', value: '55% linen, 45% cotton twill' },
    { label: 'Care', value: 'Machine wash cold. Line dry. Warm iron if needed.' },
    { label: 'Made in', value: 'Portugal' },
  ])
  assert.match(rows[3]!.paragraphs[0]!, /^Free shipping on every order/)
})

test('a row with nothing to say is left out; a section without rows shows the description', () => {
  const detail = home.theme.templates.product.find((s) => s.kind === 'product-detail')!
  const bare = { detail: { description: 'Plain.' } }
  assert.deepEqual(productRows(detail.blocks, bare, { sizeGuide: false }).map((r) => r.source), ['description', 'delivery-returns'])
  // The size guide alone keeps the fit row.
  assert.deepEqual(productRows(detail.blocks, bare, { sizeGuide: true }).map((r) => r.source), ['description', 'fit', 'delivery-returns'])
  assert.deepEqual(productRows([], tee, { sizeGuide: true }).map((r) => [r.title, r.open]), [['Description', true]])
  // Custom text in paragraphs; a custom row without a title is left out.
  const custom = [
    { id: 'a', kind: 'collapsible-row', settings: { title: 'Gift wrap', source: 'custom', text: 'Wrapped in paper.\n\nWith a card.' } },
    { id: 'b', kind: 'collapsible-row', settings: { title: '', source: 'custom', text: 'No title.' } },
  ]
  assert.deepEqual(productRows(custom, bare, { sizeGuide: false }).map((r) => r.paragraphs), [['Wrapped in paper.', 'With a card.']])
})

test('a row’s source may be written as the builder labels it', () => {
  assert.equal(rowSource('Fit and sizing'), 'fit')
  assert.equal(rowSource('Fabric and care'), 'fabric-care')
  assert.equal(rowSource('Delivery and returns'), 'delivery-returns')
  assert.equal(rowSource('Description'), 'description')
  assert.equal(rowSource('Custom'), 'custom')
  assert.equal(rowSource(undefined), 'custom')
})

test('without an engine, "You may also like" is the product’s own collection first', () => {
  // Linen Overshirt's breadcrumb is Men: Men's products in store order, then those sharing Outerwear or New in.
  const related = relatedByCollection(home.products, overshirt)
  assert.deepEqual(related.map((p) => p.name), ['Heavyweight Pocket Tee', 'Oxford Button-Down Shirt', 'Cotton Cable Sweater', 'Waxed Cotton Field Jacket'])
  assert.ok(related.every((p) => p.collections.includes('Men')))
  assert.ok(!related.some((p) => p.id === overshirt.id))
  // A product whose collection holds few others is topped up with those sharing another.
  const few = [{ id: 1, collections: ['A', 'B'] }, { id: 2, collections: ['A'] }, { id: 3, collections: ['B'] }, { id: 4, collections: ['C'] }]
  assert.deepEqual(relatedByCollection(few, few[0]!).map((p) => p.id), [2, 3])
  assert.equal(relatedByCollection(home.products, tee, 2).length, 2)
})

test('the row under a men’s or women’s piece keeps to that wearer and to pieces for everyone', () => {
  const names = (list: { name: string }[]) => list.map((p) => p.name)
  const forOvershirt = names(forSameAudience(home.products, overshirt))
  assert.ok(!forOvershirt.includes('Quilted Liner Jacket'), 'no women’s jacket under the men’s overshirt')
  assert.ok(forOvershirt.includes('Waxed Cotton Field Jacket') && forOvershirt.includes('Ribbed Merino Beanie'))
  const forBlouse = names(forSameAudience(home.products, blouse))
  assert.ok(!forBlouse.includes('Merino Quarter-Zip') && forBlouse.includes('Lambswool Scarf'))
  // A piece for everyone, and a store that does not sell by wearer, keep every product.
  assert.equal(forSameAudience(home.products, tote).length, home.products.length)
  const plain = [{ collections: ['Brakes'] }, { collections: ['Filters'] }]
  assert.equal(forSameAudience(plain, plain[0]!).length, 2)
})

// ── A part (an auto-parts store) ─────────────────────────────────────────────

const pads = {
  sku: 'TQ-BRK-4471',
  detail: {
    description: 'Quiet, low-dust ceramic pads.',
    specs: [{ label: 'Friction material', value: 'Ceramic' }, { label: 'Hardware included', value: ' Yes ' }, { label: 'Shims', value: '' }],
    warranty: 'Limited lifetime warranty.\n\nKeep your receipt.',
    fitment: {
      universal: false,
      rows: [
        { make: 'Ford', model: 'F-150', yearFrom: 2015, yearTo: 2020, position: 'Front' },
        { make: 'Ford', model: 'F-150', yearFrom: 2021, yearTo: 2024, position: 'Front', note: 'With 18 in wheels' },
        { make: 'Toyota', model: 'Tacoma', yearFrom: 2019, yearTo: 2019 },
      ],
    },
    options: [{ name: 'Position', values: ['Front', 'Rear'] }],
    variantsList: [{ sku: 'TQ-BRK-4471' }, { sku: 'TQ-BRK-4472' }],
  },
}
const oil = { sku: 'TQ-OIL-4410', detail: { fitment: { universal: true, rows: [] }, options: [], variantsList: [{ sku: 'TQ-OIL-4410' }] } }
const partRows = [
  { id: 'specs', kind: 'collapsible-row', settings: { source: 'specs' } },
  { id: 'fit', kind: 'collapsible-row', settings: { source: 'fitment', open: true } },
  { id: 'warranty', kind: 'collapsible-row', settings: { source: 'warranty' } },
  { id: 'shipping', kind: 'collapsible-row', settings: { title: 'Shipping and returns', source: 'delivery-returns', text: 'Free shipping.' } },
]
const f150 = { year: 2019, make: 'Ford', model: 'F-150' }

test('a part’s rows: specifications, vehicle fit and warranty', () => {
  const rows = productRows(partRows, pads, { sizeGuide: false, vehicle: f150 })
  assert.deepEqual(rows.map((r) => [r.title, r.source, r.open]), [
    ['Specifications', 'specs', false],
    ['Vehicle fit', 'fitment', true],
    ['Warranty', 'warranty', false],
    ['Shipping and returns', 'delivery-returns', false],
  ])
  // A spec without a value is left out; values are trimmed.
  assert.deepEqual(rows[0]!.specs, [{ label: 'Friction material', value: 'Ceramic' }, { label: 'Hardware included', value: 'Yes' }])
  assert.deepEqual(rows[1]!.fitment, [
    { make: 'Ford', model: 'F-150', years: '2015–2020', detail: 'Front', yours: true },
    { make: 'Ford', model: 'F-150', years: '2021–2024', detail: 'Front · With 18 in wheels', yours: false },
    { make: 'Toyota', model: 'Tacoma', years: '2019', detail: '', yours: false },
  ])
  assert.deepEqual(rows[2]!.paragraphs, ['Limited lifetime warranty.', 'Keep your receipt.'])
})

test('without a vehicle no row is the shopper’s; a universal part says so in one line', () => {
  assert.ok(productRows(partRows, pads, { sizeGuide: false }).find((r) => r.source === 'fitment')!.fitment.every((r) => !r.yours))
  assert.ok(fitmentTable(pads.detail.fitment, { year: 2019, make: 'Toyota', model: 'Tacoma' })[2]!.yours)
  const universal = productRows(partRows, oil, { sizeGuide: false, vehicle: f150 }).find((r) => r.source === 'fitment')!
  assert.deepEqual([universal.paragraphs, universal.fitment], [[UNIVERSAL_FIT_TEXT], []])
  assert.deepEqual(fitmentTable(oil.detail.fitment, f150), [])
})

test('a product that is not a part has none of a part’s rows', () => {
  // Northfold's overshirt has no specs, fitment or warranty: those rows are left out.
  assert.deepEqual(productRows(partRows, overshirt, { sizeGuide: false }).map((r) => r.source), ['delivery-returns'])
  assert.deepEqual(productRows(partRows, { detail: { fitment: { universal: false, rows: [] } } }, { sizeGuide: false }).map((r) => r.source), ['delivery-returns'])
})

test('a part’s row sources may be written as the builder labels them', () => {
  assert.equal(rowSource('Specifications'), 'specs')
  assert.equal(rowSource('Vehicle fit'), 'fitment')
  assert.equal(rowSource('Vehicle compatibility'), 'fitment')
  assert.equal(rowSource('Warranty'), 'warranty')
})

test('the part number follows the chosen variant, and waits for a choice that changes it', () => {
  assert.equal(partNumberOf(pads, { sku: 'TQ-BRK-4472' }), 'TQ-BRK-4472')
  assert.equal(partNumberOf(pads), '', 'Front or Rear still to choose')
  assert.equal(partNumberOf(oil), 'TQ-OIL-4410')
  // Nothing to choose: the product's own number, as its cart line carries it.
  assert.equal(partNumberOf({ sku: '', detail: { options: [], variantsList: [{ sku: 'TQ-ACC-4420' }] } }), 'TQ-ACC-4420')
  assert.equal(partNumberOf({ sku: 'TQ-ACC-4421', detail: { options: [], variantsList: [] } }), 'TQ-ACC-4421')
})

// ── The row under a part, on Torqline's own seed ─────────────────────────────

const parts = snapshotFor(TORQLINE_BLUEPRINT.homeChannel, 'torqline', '2026-11-20').products
const part = (id: number) => {
  const found = parts.find((p) => p.id === id)
  assert.ok(found, String(id))
  return found
}
const ids = (list: { id: number }[]) => list.map((p) => p.id).sort((a, b) => a - b)
const UNIVERSAL = [4010, 4011, 4020, 4021]

test('with a vehicle chosen, the row under a part offers the parts that fit it and the universal ones', () => {
  const fits = [4001, 4003, 4006, 4008, 4009, 4012, 4014, 4015, 4016, 4018, 4019]
  assert.deepEqual(ids(forSameVehicles(parts, part(4001), f150)), [...fits, ...UNIVERSAL].sort((a, b) => a - b))
  // Whatever part it is under: a part that doesn't fit the F-150 still leads to parts that do.
  assert.deepEqual(ids(forSameVehicles(parts, part(4002), f150)), ids(forSameVehicles(parts, part(4001), f150)))
  // A 2015 Honda Civic has no brake parts: only the universal brake fluid is left in Brakes.
  const civic = forSameVehicles(parts, part(4002), { year: 2015, make: 'Honda', model: 'Civic' })
  assert.ok(civic.length > UNIVERSAL.length)
  assert.deepEqual(civic.filter((p) => p.collections.includes('Brakes')).map((p) => p.id).filter((id) => !UNIVERSAL.includes(id)), [])
})

test('without a vehicle, it offers the parts that fit a vehicle this part fits: truck pads never lead to car pads', () => {
  const forTruckPads = forSameVehicles(parts, part(4001), null)
  assert.ok(!forTruckPads.some((p) => p.id === 4002 || p.id === 4004), 'no car brake parts under the truck pads')
  assert.ok(UNIVERSAL.every((id) => forTruckPads.some((p) => p.id === id)), 'universal parts stay')
  const related = relatedByCollection(forTruckPads, part(4001))
  assert.equal(related[0]!.id, 4003, 'the truck rotor comes first')
  assert.ok(!forSameVehicles(parts, part(4002), null).some((p) => p.id === 4001 || p.id === 4003), 'and the car pads never lead to truck parts')
  // A universal part may lead to any part.
  assert.equal(forSameVehicles(parts, part(4010), null).length, parts.length)
})

test('two fitments share a vehicle when a model’s years overlap, or one is universal', () => {
  const row = (model: string, yearFrom: number, yearTo: number) => ({ make: 'Ford', model, yearFrom, yearTo })
  const early = { universal: false, rows: [row('F-150', 2015, 2020)] }
  assert.ok(sharesVehicle(early, { universal: false, rows: [row('f150', 2020, 2024)] }))
  assert.ok(!sharesVehicle(early, { universal: false, rows: [row('F-150', 2021, 2024)] }))
  assert.ok(!sharesVehicle(early, { universal: false, rows: [row('Ranger', 2015, 2020)] }))
  assert.ok(sharesVehicle(early, { universal: true, rows: [] }))
})

test('a row across the range takes a product from each category in turn', () => {
  const list = [
    { id: 1, collections: ['Brakes'] }, { id: 2, collections: ['Brakes'] }, { id: 3, collections: ['Brakes', 'Deals'] },
    { id: 4, collections: ['Filters'] }, { id: 5, collections: ['Filters'] }, { id: 6, collections: ['Wipers'] }, { id: 7, collections: [] },
  ]
  assert.deepEqual(acrossCollections(list, 4).map((p) => p.id), [1, 4, 6, 7])
  assert.deepEqual(acrossCollections(list, 6).map((p) => p.id), [1, 4, 6, 7, 2, 5])
  assert.deepEqual(acrossCollections(list, 20).map((p) => p.id), [1, 4, 6, 7, 2, 5, 3])
  assert.deepEqual(acrossCollections([], 4), [])
})

test('Torqline’s Popular parts, before a vehicle is chosen, is four categories, not the brakes row again', () => {
  const popular = acrossCollections(parts, 4)
  assert.equal(new Set(popular.map((p) => p.collections[0])).size, 4)
  const brakes = parts.filter((p) => p.collections.includes('Brakes')).slice(0, 4)
  assert.ok(popular.filter((p) => brakes.includes(p)).length <= 1)
})
