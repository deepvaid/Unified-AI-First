import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LOW_STOCK, buildVariants, cheapestInitialSelection, cheapestSelection, describeVariant, initialSelection, nextVariantId, numberVariants, optionKey, optionKind,
  optionValuesOf, stockNote, valueState, variantAvailable, variantFor,
} from '../../src/storefront/variants.ts'
import type { SellableVariant, VariantOption, VariantProduct } from '../../src/storefront/variants.ts'
import { vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

// A shirt in three colours and three sizes. Navy has no L at all, Sand M is sold
// out, and every Black size is in stock but S, which has two left.
const colour: VariantOption = { name: 'Colour', values: ['Black', 'Sand', 'Navy'], display: 'swatches', swatches: { Black: '#1a1a1a', Sand: '#d8c6a5', Navy: '#1f2a44' } }
const size: VariantOption = { name: 'Size', values: ['S', 'M', 'L'] }
const stocked = (units: number) => ({ manageInventory: true, allowBackorder: false, stock: { Warehouse: units } })
const v = (id: number, values: string[], units: number): SellableVariant => ({ id, title: values.join(' / '), optionValues: values, ...stocked(units) })
const shirt: VariantProduct = {
  detail: {
    options: [colour, size],
    variantsList: [
      v(300101, ['Black', 'S'], 2), v(300102, ['Black', 'M'], 9), v(300103, ['Black', 'L'], 4),
      v(300104, ['Sand', 'S'], 5), v(300105, ['Sand', 'M'], 0), v(300106, ['Sand', 'L'], 3),
      v(300107, ['Navy', 'S'], 0), v(300108, ['Navy', 'M'], 0),
    ],
  },
}

test('an option is a colour by its swatches or its name, a size by its name, otherwise plain', () => {
  assert.equal(optionKind(colour), 'color')
  assert.equal(optionKind({ name: 'Color' }), 'color')
  assert.equal(optionKind({ name: 'Finish', display: 'swatches' }), 'color')
  assert.equal(optionKind(size), 'size')
  assert.equal(optionKind({ name: 'Waist size' }), 'size')
  assert.equal(optionKind({ name: 'Position' }), 'plain')
  assert.equal(optionKind({ name: 'Flavour' }), 'plain')
})

test('option values come from optionValues, else from the title', () => {
  assert.deepEqual(optionValuesOf({ title: 'ignored', optionValues: ['Sand', 'M'] }, [colour, size]), ['Sand', 'M'])
  assert.deepEqual(optionValuesOf({ title: 'Sand / M' }, [colour, size]), ['Sand', 'M'])
  // One option: the title is the value whole, even with a slash in it.
  assert.deepEqual(optionValuesOf({ title: 'Can / Bag bundle' }, [{ name: 'Format' }]), ['Can / Bag bundle'])
  assert.deepEqual(optionValuesOf({ title: 'Default' }, []), [])
  // optionValues of the wrong length are not trusted.
  assert.deepEqual(optionValuesOf({ title: 'Black / L', optionValues: ['Black'] }, [colour, size]), ['Black', 'L'])
})

test('a full selection names its variant; a partial or impossible one names none', () => {
  assert.equal(variantFor(shirt, { Colour: 'Sand', Size: 'L' })?.id, 300106)
  assert.equal(variantFor(shirt, { Colour: 'Sand' }), undefined)
  assert.equal(variantFor(shirt, { Colour: 'Navy', Size: 'L' }), undefined)
})

test('a product without options is its one variant, whatever is selected', () => {
  const strips = vitahealProducts().find((p) => p.name === 'Nasal Strips')!
  assert.equal(variantFor(strips, {})?.sku, 'VTH-NSL-30')
})

test('the seeded Vitaheal products, whose variants have no optionValues, resolve by title', () => {
  const electrolytes = vitahealProducts().find((p) => p.name === 'Vitaheal Electrolytes')!
  assert.equal(variantFor(electrolytes, { Flavour: 'Wild Berries' })?.sku, 'VTH-ELE-BER')
  assert.equal(describeVariant(variantFor(electrolytes, { Flavour: 'Wild Berries' })!, electrolytes.detail!.options), 'Wild Berries')
})

test('a value is available, sold out or absent given the other choices', () => {
  assert.equal(valueState(shirt, {}, 'Size', 'M'), 'available') // Black M
  assert.equal(valueState(shirt, { Colour: 'Sand' }, 'Size', 'M'), 'sold-out')
  assert.equal(valueState(shirt, { Colour: 'Navy' }, 'Size', 'L'), 'absent')
  assert.equal(valueState(shirt, {}, 'Colour', 'Navy'), 'sold-out') // every Navy is out
  assert.equal(valueState(shirt, { Size: 'L' }, 'Colour', 'Navy'), 'absent')
  // The option's own current choice does not narrow its other values.
  assert.equal(valueState(shirt, { Colour: 'Navy' }, 'Colour', 'Black'), 'available')
  assert.equal(valueState(shirt, {}, 'Fit', 'Slim'), 'absent')
})

test('a variant sold without tracking stock, or on backorder, can always be bought', () => {
  assert.equal(variantAvailable({ manageInventory: false, allowBackorder: false, stock: { Warehouse: 0 } }), true)
  assert.equal(variantAvailable({ manageInventory: true, allowBackorder: true, stock: { Warehouse: 0 } }), true)
  assert.equal(variantAvailable(stocked(0)), false)
})

test('the page opens on the first colour in stock and never on a size', () => {
  const soldOutBlack: VariantProduct = { detail: { options: [colour, size], variantsList: shirt.detail!.variantsList.map((x) => (x.optionValues![0] === 'Black' ? { ...x, stock: { Warehouse: 0 } } : x)) } }
  assert.deepEqual(initialSelection(shirt), { Colour: 'Black' })
  assert.deepEqual(initialSelection(soldOutBlack), { Colour: 'Sand' })
})

test('a choice in the URL wins when it exists, written as optionKey writes it', () => {
  assert.deepEqual(initialSelection(shirt, { colour: 'sand', size: 'm' }), { Colour: 'Sand', Size: 'M' })
  // Navy L does not exist: the size is dropped, the colour kept.
  assert.deepEqual(initialSelection(shirt, { colour: 'navy', size: 'l' }), { Colour: 'Navy' })
  // An unknown value falls back to the default.
  assert.deepEqual(initialSelection(shirt, { colour: 'purple' }), { Colour: 'Black' })
  assert.equal(optionKey('Light grey'), 'light-grey')
})

test('an option with one value is chosen for the shopper; a plain choice is left to them', () => {
  const pads: VariantProduct = {
    detail: {
      options: [{ name: 'Position', values: ['Front', 'Rear'] }, { name: 'Pack', values: ['Set of 4'] }],
      variantsList: [v(400101, ['Front', 'Set of 4'], 8), v(400102, ['Rear', 'Set of 4'], 6)],
    },
  }
  assert.deepEqual(initialSelection(pads), { Pack: 'Set of 4' })
  assert.deepEqual(initialSelection({ detail: { options: [], variantsList: [v(1, [], 1)] } }), {})
})

test('a page that opens on the lowest-priced choice: Unwind on Bag, Electrolytes on its cheapest flavour', () => {
  const product = (name: string) => vitahealProducts().find((p) => p.name === name)!
  // Can $41.99, Bag $39.99.
  assert.deepEqual(cheapestSelection(product('Unwind')), { Format: 'Bag' })
  // Lemon & Ginger and Wild Berries cost $27.99 each: the first of the two; the Starter Pack is $49.99.
  assert.deepEqual(cheapestSelection(product('Vitaheal Electrolytes')), { Flavour: 'Lemon & Ginger' })
  assert.equal(variantFor(product('Unwind'), cheapestSelection(product('Unwind')))?.sku, 'VTH-UNW-BAG')
})

test('the lowest-priced choice skips what cannot be bought, and is empty when there is no choice or nothing left', () => {
  const priced = (id: number, values: string[], units: number, price: string) => ({ ...v(id, values, units), price })
  const tee = {
    detail: {
      options: [colour, size],
      variantsList: [priced(1, ['Black', 'S'], 0, '20.00'), priced(2, ['Black', 'M'], 4, '25.00'), priced(3, ['Sand', 'S'], 2, '22.00')],
    },
  }
  // Black S is the cheapest but sold out.
  assert.deepEqual(cheapestSelection(tee), { Colour: 'Sand', Size: 'S' })
  const gone = { detail: { options: [colour, size], variantsList: tee.detail.variantsList.map((x) => ({ ...x, stock: { Warehouse: 0 } })) } }
  assert.deepEqual(cheapestSelection(gone), {})
  assert.deepEqual(cheapestSelection({ detail: { options: [], variantsList: [priced(1, [], 3, '9.00')] } }), {})
})

test('opening on the lowest-priced choice, a choice in the URL still wins and the rest comes with it', () => {
  const unwind = vitahealProducts().find((p) => p.name === 'Unwind')!
  assert.deepEqual(cheapestInitialSelection(unwind), { Format: 'Bag' })
  assert.deepEqual(cheapestInitialSelection(unwind, { format: 'can' }), { Format: 'Can' })
  assert.deepEqual(cheapestInitialSelection(unwind, { format: 'tin' }), { Format: 'Bag' }, 'a value it does not have')
  const priced = (id: number, values: string[], units: number, price: string) => ({ ...v(id, values, units), price })
  const tee = {
    detail: {
      options: [colour, size, { name: 'Pack', values: ['Single'] }],
      variantsList: [
        priced(1, ['Black', 'S', 'Single'], 4, '20.00'), priced(2, ['Black', 'M', 'Single'], 4, '24.00'),
        priced(3, ['Sand', 'M', 'Single'], 4, '22.00'), priced(4, ['Sand', 'L', 'Single'], 4, '21.00'),
      ],
    },
  }
  assert.deepEqual(cheapestInitialSelection(tee), { Colour: 'Black', Size: 'S', Pack: 'Single' })
  // The URL asks for Sand: the cheapest Sand is L (21.00), though Black S (20.00) is cheaper.
  assert.deepEqual(cheapestInitialSelection(tee, { colour: 'sand' }), { Colour: 'Sand', Size: 'L', Pack: 'Single' })
  assert.deepEqual(cheapestSelection(tee, { Size: 'M' }), { Colour: 'Sand', Size: 'M', Pack: 'Single' })
  // Every Sand sold out: the URL's colour stays, the size is left open, the one value is chosen.
  const sandGone = { detail: { ...tee.detail, variantsList: tee.detail.variantsList.map((x) => (x.optionValues![0] === 'Sand' ? { ...x, stock: { Warehouse: 0 } } : x)) } }
  assert.deepEqual(cheapestInitialSelection(sandGone, { colour: 'sand' }), { Colour: 'Sand', Pack: 'Single' })
  // Nothing left: the usual start, a colour in stock or not and the one value.
  const gone = { detail: { ...tee.detail, variantsList: tee.detail.variantsList.map((x) => ({ ...x, stock: { Warehouse: 0 } })) } }
  assert.deepEqual(cheapestInitialSelection(gone), initialSelection(gone))
})

test('a chosen variant reads "Size M · Black", sizes first', () => {
  assert.equal(describeVariant(v(1, ['Black', 'M'], 1), [colour, size]), 'Size M · Black')
  assert.equal(describeVariant({ title: 'M / Black' }, [size, colour]), 'Size M · Black')
  assert.equal(describeVariant({ title: 'One size / Black' }, [size, colour]), 'One size · Black')
  assert.equal(describeVariant({ title: 'Front' }, [{ name: 'Position', values: ['Front', 'Rear'] }]), 'Front')
  assert.equal(describeVariant({ title: 'Default' }, []), '')
})

test('a low stock says how many are left; plenty, none or untracked says nothing', () => {
  assert.equal(stockNote(stocked(2)), 'Only 2 left')
  assert.equal(stockNote(stocked(LOW_STOCK)), `Only ${LOW_STOCK} left`)
  assert.equal(stockNote(stocked(LOW_STOCK + 1)), null)
  assert.equal(stockNote(stocked(0)), null)
  assert.equal(stockNote({ manageInventory: false, allowBackorder: false, stock: { Warehouse: 1 } }), null)
  assert.equal(stockNote({ manageInventory: true, allowBackorder: true, stock: { Warehouse: 1 } }), null)
})

// ── The product form ─────────────────────────────────────────────────────────

interface FormVariant { id: number; title: string; sku: string; optionValues?: string[] }
let draft = 0
const make = (title: string): FormVariant => ({ id: --draft, title, sku: '' })

test('options make one variant per combination, in option order, with their values', () => {
  const built = buildVariants([size, { name: 'Colour', values: ['Black', 'Sand'] }], [], make)
  assert.deepEqual(built.map((x) => x.title), ['S / Black', 'S / Sand', 'M / Black', 'M / Sand', 'L / Black', 'L / Sand'])
  assert.deepEqual(built[3]!.optionValues, ['M', 'Sand'])
  assert.deepEqual(buildVariants([{ name: '', values: ['S'] }, { name: 'Size', values: [] }], [], make), [])
})

test('adding a value keeps the variants that were there, with their ids and SKUs', () => {
  const before = buildVariants([size], [], make).map((x, i) => ({ ...x, id: 300100 + i + 1, sku: `NF-TEE-${x.title}` }))
  const after = buildVariants([{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }], before, make)
  assert.deepEqual(after.slice(0, 3).map((x) => [x.id, x.sku]), [[300101, 'NF-TEE-S'], [300102, 'NF-TEE-M'], [300103, 'NF-TEE-L']])
  assert.ok(after[3]!.id < 0, 'the new size is a draft until saved')
})

test('a variant saved before it had optionValues is found by its title', () => {
  const saved: FormVariant[] = [{ id: 20021, title: 'Original', sku: 'VTH-FOC-ORG' }, { id: 20022, title: 'Refill', sku: 'VTH-FOC-REF' }]
  const built = buildVariants([{ name: 'Format', values: ['Original', 'Refill'] }], saved, make)
  assert.deepEqual(built.map((x) => [x.id, x.sku, x.optionValues]), [[20021, 'VTH-FOC-ORG', ['Original']], [20022, 'VTH-FOC-REF', ['Refill']]])
})

test('a value listed twice does not give one variant to two rows', () => {
  const saved: FormVariant[] = [{ id: 7, title: 'S', sku: 'A', optionValues: ['S'] }]
  const built = buildVariants([{ name: 'Size', values: ['S', 'S'] }], saved, make)
  assert.equal(built[0]!.id, 7)
  assert.notEqual(built[1]!.id, 7)
})

test('saving keeps every id a variant has and numbers new ones from the product id', () => {
  const numbered = numberVariants([{ id: 20011 }, { id: -1 }, { id: 3 }, { id: -2 }], 2001)
  assert.deepEqual(numbered.map((x) => x.id), [20011, 200101, 3, 200102])
})

test('a new variant never takes an id the product already uses, and a repeated id is renumbered', () => {
  const numbered = numberVariants([{ id: 300101 }, { id: 300101 }, { id: 0 }], 3001)
  assert.deepEqual(numbered.map((x) => x.id), [300101, 300102, 300103])
})

test('a copy with every id cleared is numbered 1 to k in its own block', () => {
  assert.deepEqual(numberVariants([{ id: 0 }, { id: 0 }, { id: 0 }], 4001).map((x) => x.id), [400101, 400102, 400103])
})

test('a new variant is numbered past the highest id, never into a gap a removed one left', () => {
  assert.equal(nextVariantId(3001, new Set([300101, 300102, 300104])), 300105)
  assert.equal(nextVariantId(3001, [20011, 300299, 3]), 300101) // ids outside the block don't count
  // S, M and L were saved; the merchant removes M and adds XL.
  const saved = buildVariants([size], [], make).map((x, i) => ({ ...x, id: 300101 + i, sku: `NF-TEE-${x.title}` }))
  const edited = buildVariants([{ name: 'Size', values: ['S', 'L', 'XL'] }], saved, make)
  const numbered = numberVariants(edited, 3001)
  assert.deepEqual(numbered.map((x) => [x.title, x.id]), [['S', 300101], ['L', 300103], ['XL', 300104]])
  assert.ok(!numbered.some((x) => x.id === 300102), "M's id is not handed to XL")
})

test("the ids the product had before are taken too, so removing the top variant doesn't free its id", () => {
  // S, M and L were saved; the merchant removes L and adds XL. Without the ids
  // the form opened with, XL would get L's id.
  const loaded = [300101, 300102, 300103]
  const saved = buildVariants([size], [], make).map((x, i) => ({ ...x, id: loaded[i]!, sku: `NF-TEE-${x.title}` }))
  const edited = buildVariants([{ name: 'Size', values: ['S', 'M', 'XL'] }], saved, make)
  assert.deepEqual(numberVariants(edited, 3001, loaded).map((x) => [x.title, x.id]), [['S', 300101], ['M', 300102], ['XL', 300104]])
  // Vitaheal's older ids (product * 10 + n) are kept and don't move the block.
  assert.deepEqual(numberVariants([{ id: 20011 }, { id: -1 }], 2001, [20011, 20012]).map((x) => x.id), [20011, 200101])
})

test('numbering does not change the list it was given', () => {
  const before = [{ id: -1 }]
  numberVariants(before, 3001)
  assert.deepEqual(before, [{ id: -1 }])
})
