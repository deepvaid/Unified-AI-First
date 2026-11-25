// The Aurora Outdoor (demo) seed against the reference tables of its catalogue: prices
// and sale prices, options and swatches, the colourway photos, the sold-out and "Only
// N left" variants, the size charts for clothes, boots, socks and hats, the collections
// and what Newest puts first, what TRAIL20 takes off, what search and "Goes well with"
// find, the theme's styles and colour contrast, the templates the Aurora theme draws,
// the header and footer, the chatbot and its earlier chats, and the store facts the
// checkout and the copy must agree on.
//
// The checks every demo store passes (photo files and credits, fonts, SKUs, real
// brands, capabilities) are in demoStores.test.ts, which runs them for Aurora once it
// is in DEMO_STORES. This file builds the blueprint itself, so it also checks here
// that every link leads to a page the store serves, at home, installed and in its
// history.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AURORA_BLUEPRINT } from '../../src/storefront/demoStores/aurora.ts'
import { contextFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import {
  AURORA_CATEGORIES, AURORA_CHANNEL_ID, AURORA_COLLECTION_NAMES, AURORA_COLORS, AURORA_COLOURWAY_PHOTOS, AURORA_PHOTO_DIR,
} from '../../src/storefront/auroraDemo.ts'
import { chartForAudience, audienceOf } from '../../src/storefront/audience.ts'
import { campaignStatus, discountFor, findByCode } from '../../src/storefront/campaigns.ts'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { emptyFilters, facetGroups, sortProducts } from '../../src/storefront/facets.ts'
import { productHandle, toHandle } from '../../src/storefront/handles.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { forSameAudience, galleryFor } from '../../src/storefront/productPage.ts'
import { recommendFor, searchStore } from '../../src/storefront/search.ts'
import { chartFor } from '../../src/storefront/sizeCharts.ts'
import { onBrandColor, themeFonts } from '../../src/storefront/themeSections.ts'
import { describeVariant, optionValuesOf, stockNote, valueState, variantAvailable, variantFor } from '../../src/storefront/variants.ts'
import { bestEntry } from '../../src/chatbot/previewResponder.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantState } from '../../src/chatbot/storeAssistant.ts'
import { money } from '../../src/maropay/money.ts'
import { contrastRatio } from '../../src/utils/brandContrast.ts'
import type { ProductVariant } from '../../src/stores/useCommerce.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-19'
const STOCK = 'Oxford Warehouse'
const build = (channel: SalesChannel): StoreSnapshot => AURORA_BLUEPRINT.build(contextFor(AURORA_BLUEPRINT, channel, TODAY))
const home = build(AURORA_BLUEPRINT.homeChannel)
/** The store installed in another one (slot 9), as Apply would. */
const qaChannel: SalesChannel = {
  ...AURORA_BLUEPRINT.homeChannel, id: 'qa-store', name: 'QA store',
  webStore: { ...AURORA_BLUEPRINT.homeChannel.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 9 } },
}
const copy = build(qaChannel)
const history = AURORA_BLUEPRINT.history!(contextFor(AURORA_BLUEPRINT, AURORA_BLUEPRINT.homeChannel, TODAY))

type SeededProduct = StoreSnapshot['products'][number]
const byId = (snapshot: StoreSnapshot, id: number): SeededProduct => {
  const product = snapshot.products.find((p) => p.id === id)
  assert.ok(product, String(id))
  return product
}
const ids = (products: { id: number }[]) => products.map((p) => p.id)
const variantsOf = (p: SeededProduct) => p.detail!.variantsList
const label = (p: SeededProduct, v: ProductVariant) => [p.name, ...optionValuesOf(v, p.detail!.options)].join(' › ')
/** The five styles made for women and for men: each is two pieces, "Women’s <style>" and "Men’s <style>". */
const PAIRED_STYLES = ['Summit Down Jacket', 'Ridgeline Rain Shell', 'Trailhead Hiking Pants', 'Merino Base Layer Top', 'Canyon Hiking Boot']
const section = (snapshot: StoreSnapshot, id: string) => {
  const t = snapshot.theme.templates
  const found = [...t.home, ...t.product, ...t.collection, ...t.cart].find((s) => s.id === id)
  assert.ok(found, id)
  return found
}

test('the catalogue is the twenty reference products, at their prices, in their place', () => {
  // Women's pieces, then men's, then the ones for everyone, the newest of those first; the five New arrivals have the
  // newest ids (6016-6020).
  assert.deepEqual(home.products.map((p) => [p.id, p.name, audienceOf(p.collections) ?? 'all', p.price]), [
    [6001, 'Women’s Summit Down Jacket', 'her', '249.00'], [6002, 'Women’s Ridgeline Rain Shell', 'her', '179.00'], [6016, 'Alpine Fleece Pullover', 'her', '89.00'],
    [6003, 'Women’s Trailhead Hiking Pants', 'her', '79.00'], [6004, 'Women’s Merino Base Layer Top', 'her', '69.00'], [6005, 'Women’s Canyon Hiking Boot', 'her', '159.00'],
    [6006, 'Men’s Summit Down Jacket', 'him', '249.00'], [6007, 'Men’s Ridgeline Rain Shell', 'him', '179.00'], [6017, 'Alpine Fleece Jacket', 'him', '95.00'],
    [6008, 'Men’s Trailhead Hiking Pants', 'him', '85.00'], [6009, 'Men’s Merino Base Layer Top', 'him', '69.00'], [6010, 'Men’s Canyon Hiking Boot', 'him', '159.00'],
    [6020, 'Night Trail Headlamp', 'all', '39.00'], [6019, 'Peak Beanie', 'all', '25.00'], [6018, 'Basecamp 45L Pack', 'all', '189.00'],
    [6011, 'Daybreak 24L Pack', 'all', '119.00'], [6012, 'Trail Merino Socks, 3-pack', 'all', '29.00'], [6013, 'Alpine Trekking Poles', 'all', '79.00'],
    [6014, 'Insulated Trail Bottle, 24 oz', 'all', '32.00'], [6015, 'Packable Sun Hat', 'all', '35.00'],
  ])
  for (const p of home.products) {
    assert.equal(p.vendor, 'Aurora', p.name)
    assert.equal(p.inventory, variantsOf(p).reduce((units, v) => units + v.stock[STOCK]!, 0), p.name)
    assert.equal(p.sku, variantsOf(p)[0]!.sku, `${p.name}: its SKU is its first variant's`)
    for (const [n, v] of variantsOf(p).entries()) {
      assert.equal(v.id, p.id * 100 + n + 1, `${label(p, v)}: id`)
      assert.equal(v.price, p.price, `${label(p, v)}: every variant has the product's price`)
      assert.match(v.sku, /^AU-[A-Z]{3}(-[A-Z]{3})?-(XS|S|M|L|XL|XXL|6|7|8|9|10|11|12|SM|LXL|OS)$/, label(p, v))
    }
  }
  const variants = home.products.flatMap(variantsOf)
  assert.equal(variants.length, 126)
  assert.equal(variants.reduce((units, v) => units + v.stock[STOCK]!, 0), 1570)
  assert.deepEqual(home.market, { currency: 'USD' })
  assert.equal(formatStorePrice(money(24900, home.market.currency), home.market.locale), '$249.00')
  // Every product has a name of its own, so a card, a cart line, an order and an admin list tell them apart.
  assert.equal(new Set(home.products.map((p) => p.name)).size, home.products.length, 'no two products share a name')
  assert.equal(new Set(home.products.map((p) => p.detail!.seo!.urlHandle)).size, home.products.length, 'no two products share an SEO handle')
  // A style made for women and for men is one piece each, named for whose it is ("Women’s …", "Men’s …", the
  // apostrophe the subtitles use), with SKUs and pages of its own. The chat calls the pair by the style's name.
  const styleOf = (name: string) => name.replace(/^(Women|Men)’s /, '')
  const paired = home.products.filter((p) => /^(Women|Men)’s /.test(p.name))
  assert.deepEqual([...new Set(paired.map((p) => styleOf(p.name)))], PAIRED_STYLES)
  for (const style of PAIRED_STYLES) {
    const pair = home.products.filter((p) => styleOf(p.name) === style)
    assert.deepEqual(pair.map((p) => [p.name, audienceOf(p.collections)]), [[`Women’s ${style}`, 'her'], [`Men’s ${style}`, 'him']], style)
    for (const p of pair) assert.ok(p.detail!.subtitle.startsWith(`${p.name.split(' ')[0]!} `), `${p.name}: the subtitle says whose it is too`)
    assert.notEqual(pair[0]!.sku, pair[1]!.sku, style)
    assert.notEqual(productHandle(pair[0]!), productHandle(pair[1]!), `${style}: two pages`)
  }
  // Only a paired style says whose it is in its name; the fleeces are one piece each, under names of their own.
  assert.deepEqual(home.products.filter((p) => /\b(women|men)’?s?\b/i.test(p.name)).map((p) => p.id), paired.map((p) => p.id))
  assert.deepEqual([...new Set(home.products.map((p) => p.detail!.tag))].sort(), [...AURORA_CATEGORIES].sort())
})

test('two accessories are on sale, with a compare-at price on every variant, both in Sale, and no jacket is', () => {
  const onSale = home.products.filter((p) => p.compareAtPrice)
  assert.deepEqual(onSale.map((p) => [p.name, p.price, p.compareAtPrice]), [
    ['Insulated Trail Bottle, 24 oz', '32.00', '40.00'],
    ['Packable Sun Hat', '35.00', '45.00'],
  ])
  for (const p of onSale) {
    for (const v of variantsOf(p)) assert.equal(v.compareAtPrice, p.compareAtPrice, label(p, v))
    assert.ok(p.collections.includes('Sale'), p.name)
  }
  assert.equal(home.products.flatMap(variantsOf).filter((v) => v.compareAtPrice).length, 4)
  assert.ok(onSale.every((p) => !p.collections.includes('Jackets')), 'TRAIL20 never meets a sale price')
})

test('four variants are sold out and three are down to their last few, and nothing else is low', () => {
  const where = (stock: (units: number) => boolean) => home.products.flatMap((p) => variantsOf(p).filter((v) => stock(v.stock[STOCK]!)).map((v) => label(p, v)))
  assert.deepEqual(where((units) => units === 0), [
    'Women’s Summit Down Jacket › Ember › M',
    'Women’s Canyon Hiking Boot › 8',
    'Men’s Trailhead Hiking Pants › Khaki › L',
    'Peak Beanie › Black',
  ])
  assert.deepEqual(where((units) => units > 0 && units < 4), [
    'Men’s Summit Down Jacket › Navy › XL',
    'Men’s Canyon Hiking Boot › 11',
    'Basecamp 45L Pack › Spruce',
  ])
  const jacket = byId(home, 6001)
  assert.equal(valueState(jacket, { Color: 'Ember' }, 'Size', 'M'), 'sold-out')
  assert.equal(valueState(jacket, { Color: 'Black' }, 'Size', 'M'), 'available')
  assert.equal(stockNote(variantFor(byId(home, 6006), { Color: 'Navy', Size: 'XL' })!), 'Only 2 left')
  assert.equal(stockNote(variantFor(byId(home, 6010), { Size: '11' })!), 'Only 3 left')
  assert.deepEqual(home.products.flatMap(variantsOf).map(stockNote).filter(Boolean), ['Only 2 left', 'Only 3 left', 'Only 2 left'])
  // Every product has something to buy.
  for (const p of home.products) assert.ok(variantsOf(p).some(variantAvailable), p.name)
})

test('options are Color as swatches, then Size as buttons; a cart line reads "Size M · Black", a boot "Size 9"', () => {
  const jacket = byId(home, 6001)
  assert.deepEqual(jacket.detail!.options, [
    { name: 'Color', values: ['Ember', 'Black'], display: 'swatches', swatches: { Ember: '#ea6233', Black: '#1c1c1e' } },
    { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'], display: 'buttons' },
  ])
  const blackM = variantFor(jacket, { Color: 'Black', Size: 'M' })!
  assert.deepEqual([blackM.id, blackM.sku, describeVariant(blackM, jacket.detail!.options)], [600108, 'AU-SDW-BLK-M', 'Size M · Black'])
  const boot = byId(home, 6005)
  assert.deepEqual(boot.detail!.options, [{ name: 'Size', values: ['6', '7', '8', '9', '10'], display: 'buttons' }])
  assert.deepEqual(byId(home, 6010).detail!.options[0]!.values, ['8', '9', '10', '11', '12'])
  assert.equal(describeVariant(variantFor(boot, { Size: '9' })!, boot.detail!.options), 'Size 9')
  // Women's sizes run XS-XL, men's S-XXL.
  const sizes = (id: number) => byId(home, id).detail!.options.find((o) => o.name === 'Size')!.values
  assert.deepEqual([sizes(6002), sizes(6007)], [['XS', 'S', 'M', 'L', 'XL'], ['S', 'M', 'L', 'XL', 'XXL']])
  assert.deepEqual([sizes(6012), sizes(6015)], [['S', 'M', 'L'], ['S/M', 'L/XL']])
  const shapes = home.products.map((p) => p.detail!.options.map((o) => o.name).join(' × ') || 'none')
  const count = (shape: string) => shapes.filter((s) => s === shape).length
  assert.deepEqual([count('Color × Size'), count('Color'), count('Size'), count('none')], [10, 4, 4, 2])
  const poles = byId(home, 6013)
  assert.deepEqual([poles.detail!.options, poles.detail!.hasVariants, variantsOf(poles).map((v) => [v.title, v.sku])], [[], false, [['Default', 'AU-ATP-OS']]])
  // Every swatch is the store's colour, and every colour of the store is offered.
  for (const p of home.products) {
    for (const option of p.detail!.options) for (const [value, hex] of Object.entries(option.swatches ?? {})) assert.equal(hex, AURORA_COLORS[value]!.hex, `${p.name} › ${value}`)
  }
  const offered = new Set(home.products.flatMap((p) => p.detail!.options.flatMap((o) => Object.keys(o.swatches ?? {}))))
  assert.deepEqual(Object.keys(AURORA_COLORS).filter((value) => !offered.has(value)), [])
  // The colours the contract names, in order (the first is the one photographed).
  const colours = (id: number) => byId(home, id).detail!.options.find((o) => o.name === 'Color')?.values
  assert.deepEqual(
    [6001, 6002, 6016, 6003, 6004, 6006, 6007, 6017, 6008, 6009, 6011, 6018, 6019, 6014].map(colours),
    [['Ember', 'Black'], ['Moss', 'Slate'], ['Oat', 'Forest'], ['Stone', 'Black'], ['Heather gray', 'Black'], ['Navy', 'Black'], ['Ochre', 'Graphite'],
      ['Olive', 'Charcoal'], ['Khaki', 'Black'], ['Charcoal', 'Navy'], ['Rust', 'Black'], ['Spruce', 'Black'], ['Rust', 'Black', 'Oat'], ['Sage', 'Black']],
  )
  // A photographed colour has the swatch of its photo: the men's fleece is olive and the backpacking pack a bright
  // spruce green, not the dark Forest of the women's fleece (which has no photo of its own).
  assert.deepEqual(['Olive', 'Spruce', 'Forest'].map((value) => AURORA_COLORS[value]!.hex), ['#4a4530', '#1f6a58', '#2f4a3a'])
})

test('the colourway photos are wired to their colour; any other colour shows the first colour, and says so', () => {
  const files = (p: SeededProduct) => p.imageUrls!.map((url) => url.slice(AURORA_PHOTO_DIR.length + 1))
  for (const p of home.products) {
    const base = files(p)[0]!.replace(/-1\.jpg$/, '')
    assert.deepEqual(files(p), [`${base}-1.jpg`, `${base}-2.jpg`, ...Object.values(AURORA_COLOURWAY_PHOTOS[base] ?? {})], p.name)
    assert.equal(p.images, p.imageUrls!.length)
    const byColor = p.detail!.imagesByColor
    if (!byColor) continue
    const first = p.detail!.options[0]!.values[0]!
    assert.deepEqual(byColor[first], p.imageUrls!.slice(0, 2), `${p.name}: its own photos are of ${first}`)
    const listed = Object.values(byColor).flat()
    assert.equal(new Set(listed).size, listed.length, `${p.name}: no photo is listed under two colours`)
  }
  // The other colour of a style: its own photo when there is one, else the first colour's with "Shown in".
  for (const p of home.products) {
    const option = p.detail!.options.find((o) => o.name === 'Color')
    if (!option) continue
    const [first, ...others] = option.values
    for (const color of others) {
      const g = galleryFor(p, { Color: color })
      const own = AURORA_COLOURWAY_PHOTOS[files(p)[0]!.replace(/-1\.jpg$/, '')]?.[color]
      assert.deepEqual([g.images.map((url) => url.slice(AURORA_PHOTO_DIR.length + 1)), g.shownIn], own ? [[own], ''] : [files(p).slice(0, 2), `Shown in ${first}`], `${p.name} in ${color}`)
    }
  }
  // A piece with no colour option has its two photos and no "Shown in".
  assert.deepEqual(galleryFor(byId(home, 6005), { Size: '9' }).shownIn, '')
  // What the walkthrough shows (step 5): the women's down jacket's Black has its own photo; the women's rain shell's
  // Slate has none, so its page says "Shown in Moss".
  assert.equal(galleryFor(byId(home, 6001), { Color: 'Black' }).shownIn, '')
  assert.equal(galleryFor(byId(home, 6002), { Color: 'Slate' }).shownIn, 'Shown in Moss')
})

test('every sized piece links a size chart that covers each of its sizes for whom it is made', () => {
  assert.deepEqual(home.sizeCharts.map((c) => [c.id, c.name, c.columns]), [
    ['au-chart-womens-tops', 'Women’s tops', ['Bust', 'Waist', 'Hip']],
    ['au-chart-mens-tops', 'Men’s tops', ['Chest', 'Waist', 'Sleeve']],
    ['au-chart-womens-pants', 'Women’s pants', ['Waist', 'Hip', 'Inseam']],
    ['au-chart-mens-pants', 'Men’s pants', ['Waist', 'Hip', 'Inseam']],
    ['au-chart-boots', 'Boots', ['Women’s foot length', 'Men’s foot length']],
    ['au-chart-socks', 'Socks', ['Women’s shoe size', 'Men’s shoe size']],
    ['au-chart-hats', 'Hats', ['Head circumference']],
  ])
  for (const p of home.products) {
    const sizes = p.detail!.options.find((o) => o.name === 'Size')?.values
    const chart = chartFor(p, home.sizeCharts)
    assert.ok(p.detail!.fitNote && p.detail!.material && p.detail!.care, `${p.name}: fit, fabric and care`)
    if (!sizes) {
      assert.equal(chart, undefined, `${p.name} is one size`)
      continue
    }
    assert.ok(chart, `${p.name} has a chart`)
    assert.equal(chart.channelId, AURORA_CHANNEL_ID)
    // As the product page's size guide shows it: the columns for whom the piece is made, with a value in each of
    // its sizes ("—" only in the other audience's column of a piece for everyone, the socks).
    const audience = audienceOf(p.collections)
    const own = chartForAudience(chart, audience)
    for (const size of sizes) {
      const row = own.rows.find((r) => r.size === size)
      assert.ok(row, `${p.name}: ${chart.name} has ${size}`)
      const measured = row.values.filter((value) => /\d/.test(value))
      assert.ok(audience ? measured.length === row.values.length : measured.length > 0, `${p.name} › ${size}: ${row.values.join(', ')}`)
    }
  }
  for (const chart of home.sizeCharts) {
    assert.equal(chart.unit, 'in')
    for (const row of chart.rows) assert.equal(row.values.length, chart.columns.length, `${chart.name} › ${row.size}`)
    assert.ok(chart.fitNote && chart.howToMeasure, chart.name)
  }
  const boots = home.sizeCharts.find((c) => c.name === 'Boots')!
  assert.deepEqual(chartForAudience(boots, 'her').columns, ['Foot length'])
  assert.deepEqual(chartForAudience(boots, 'her').rows.find((r) => r.size === '9')!.values, ['10.25'])
  assert.deepEqual(chartForAudience(boots, 'him').rows.find((r) => r.size === '9')!.values, ['10.375'])
  // Clothes take the tops and pants charts for whom they are made.
  const chartName = (id: number) => chartFor(byId(home, id), home.sizeCharts)!.name
  assert.deepEqual([6001, 6016, 6003, 6006, 6017, 6008, 6012, 6015].map(chartName), ['Women’s tops', 'Women’s tops', 'Women’s pants', 'Men’s tops', 'Men’s tops', 'Men’s pants', 'Socks', 'Hats'])
})

test('TRAIL20 takes 20% off jackets: the Women’s Summit Down Jacket in Black / M comes to $199.20, and a fleece keeps its price', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  const campaign = findByCode(home.campaigns, AURORA_CHANNEL_ID, 'trail20')
  assert.equal(campaign?.name, 'Trail season')
  assert.equal(campaign!.offer!.message, 'Trail season: 20% off jackets with code TRAIL20')
  assert.equal(campaignStatus(campaign!, now), 'Active')
  // Running for four days when the store is opened, so its 18 orders are not one morning's.
  assert.deepEqual([campaign!.startDate, campaign!.startTime, campaign!.orders], ['2026-11-15', '00:00', 18])
  const line = (id: number, choice: Record<string, string> = {}) => {
    const product = byId(home, id)
    const variant = Object.keys(choice).length ? variantFor(product, choice)! : variantsOf(product)[0]!
    return { price: variant.price, qty: 1, collections: product.collections }
  }
  const total = (lines: ReturnType<typeof line>[]) => {
    const subtotal = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.qty, 0)
    return formatStorePrice(money(subtotal - (discountFor(lines, campaign, 'USD')?.amount.amount ?? 0), 'USD'))
  }
  const jacket = line(6001, { Color: 'Black', Size: 'M' })
  assert.equal(formatStorePrice(discountFor([jacket], campaign, 'USD')!.amount), '$49.80')
  assert.equal(total([jacket]), '$199.20')
  assert.equal(total([jacket, line(6016, { Color: 'Oat', Size: 'M' })]), '$288.20')
  assert.equal(total([line(6007, { Color: 'Ochre', Size: 'L' })]), '$143.20')
  // Every piece TRAIL20 covers: the four jackets, for women and men.
  assert.deepEqual(ids(home.products.filter((p) => p.collections.some((c) => campaign!.targets.includes(c)))), [6001, 6002, 6006, 6007])
})

test('one campaign runs, one has ended and one is to come', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  assert.deepEqual(home.campaigns.map((c) => [c.name, c.offer?.code, c.targets, campaignStatus(c, now)]), [
    ['Trail season', 'TRAIL20', ['Jackets'], 'Active'],
    ['Layer up', 'LAYERUP15', ['Fleece & layers'], 'Ended'],
    ['Boot week', 'BOOTS15', ['Footwear'], 'Scheduled'],
  ])
  assert.deepEqual(home.campaigns.map((c) => [c.startDate, c.endDate]), [['2026-11-15', '2026-12-09'], ['2026-10-10', '2026-10-17'], ['2026-12-19', '2026-12-26']])
  for (const c of home.campaigns) assert.ok(AURORA_COLLECTION_NAMES.includes(c.targets[0] as never), c.name)
})

test('the collections are the ten reference ones; Women and Men list their own pieces first; Newest leads with the New arrivals', () => {
  const members = (title: string) => ids(home.products.filter((p) => p.collections.includes(title)))
  assert.deepEqual(home.collections.map((c) => [c.id, c.title, c.productCount]), [
    [6901, 'Women', 14], [6902, 'Men', 14], [6903, 'Jackets', 4], [6904, 'Fleece & layers', 4], [6905, 'Pants', 2],
    [6906, 'Footwear', 2], [6907, 'Packs & accessories', 8], [6908, 'New arrivals', 5], [6909, 'Best sellers', 4], [6910, 'Sale', 2],
  ])
  assert.deepEqual(home.collections.map((c) => c.title), [...AURORA_COLLECTION_NAMES])
  // The pieces for everyone: the season's new ones first, newest first.
  const forEveryone = [6020, 6019, 6018, 6011, 6012, 6013, 6014, 6015]
  assert.deepEqual(members('Women'), [6001, 6002, 6016, 6003, 6004, 6005, ...forEveryone])
  assert.deepEqual(members('Men'), [6006, 6007, 6017, 6008, 6009, 6010, ...forEveryone])
  assert.deepEqual(members('Jackets'), [6001, 6002, 6006, 6007])
  assert.deepEqual(members('Fleece & layers'), [6016, 6004, 6017, 6009])
  assert.deepEqual(members('Pants'), [6003, 6008])
  assert.deepEqual(members('Footwear'), [6005, 6010])
  assert.deepEqual(members('Packs & accessories'), forEveryone)
  assert.deepEqual(members('New arrivals'), [6016, 6017, 6020, 6019, 6018])
  assert.deepEqual(members('Best sellers'), [6001, 6005, 6006, 6014])
  assert.deepEqual(members('Sale'), [6014, 6015])
  // Sorted by Newest (the highest id first), the shop leads with its New arrivals.
  assert.deepEqual(ids(sortProducts(home.products, 'newest').slice(0, 5)).sort(), members('New arrivals').sort())
  // The home page's rows show a collection's first four, in the store's order: New arrivals has the two newest
  // pieces, and Best sellers a sale piece, whose card shows the price it was.
  const homeRow = (id: string) => {
    const handle = section(home, `aurora-${id}`).settings.collection
    return home.products.filter((p) => p.collections.some((c) => toHandle(c) === handle)).slice(0, 4)
  }
  assert.deepEqual(ids(homeRow('home-new-arrivals')), [6016, 6017, 6020, 6019])
  assert.deepEqual(ids(homeRow('home-best-sellers')), [6001, 6005, 6006, 6014])
  assert.deepEqual(homeRow('home-best-sellers').filter((p) => p.compareAtPrice).map((p) => [p.name, p.price, p.compareAtPrice]), [['Insulated Trail Bottle, 24 oz', '32.00', '40.00']])
  // The filters a collection shows (walkthrough step 4): a group with one value is left out, so Jackets, all of one
  // kind, has no Category; Women, Men and Packs & accessories do.
  const filters = (title: string) => facetGroups(home.products.filter((p) => p.collections.includes(title)), emptyFilters(), { facets: ['size', 'color', 'category', 'price'] }).map((g) => g.key)
  assert.deepEqual(filters('Jackets'), ['size', 'color', 'price'])
  for (const title of ['Women', 'Men', 'Packs & accessories']) assert.deepEqual(filters(title), ['size', 'color', 'category', 'price'], title)
  for (const c of home.collections) {
    assert.equal(c.productCount, members(c.title).length, c.title)
    assert.ok(c.description, c.title)
  }
  // The breadcrumb is the first collection a piece names: whose it is, or Packs & accessories for a piece for everyone.
  for (const p of home.products) assert.equal(p.detail!.collection, p.collections[0], p.name)
  assert.deepEqual([...new Set(home.products.map((p) => p.collections[0]))], ['Women', 'Men', 'Packs & accessories'])
})

test('the search rules change what a search finds, as the catalogue tables say', () => {
  const rules = { synonyms: home.merchandising.synonyms, redirects: home.merchandising.redirects, pins: home.merchandising.searchPins, hiddenProductIds: [] }
  const none = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }
  const found = (query: string, withRules = true) => ids(searchStore(query, home.products, withRules ? rules : none).products)
  // Raincoat finds the rain shells, puffer the down jackets: no product says either word.
  assert.deepEqual(found('raincoat', false), [])
  assert.deepEqual(found('raincoat'), [6002, 6007])
  assert.deepEqual(found('puffer', false), [])
  assert.deepEqual(found('puffer'), [6001, 6006])
  assert.deepEqual(found('backpack', false), [6018])
  assert.deepEqual(found('backpack'), [6018, 6011])
  assert.deepEqual(found('toque', false), [])
  assert.deepEqual(found('toque'), [6019])
  // The pin puts the boots before the pants whose name says "hiking".
  assert.deepEqual(found('hiking', false), [6003, 6005, 6008, 6010, 6012])
  assert.deepEqual(found('hiking'), [6005, 6010, 6003, 6008, 6012])
  const store = 'https://2000290-16.uat.maropost.store'
  assert.equal(searchStore('returns', home.products, rules).redirectTo, `${store}/page/shipping-and-returns`)
  assert.equal(searchStore('size chart', home.products, rules).redirectTo, `${store}/page/size-guide`)
})

test('"Goes well with" shows pieces that share the most collections, for the same wearer or for everyone', () => {
  const engine = home.merchandising.engines.find((e) => e.status === 'active')!
  assert.deepEqual(home.merchandising.engines.map((e) => [e.name, e.type, e.status]), [
    ['Goes well with', 'frequently_purchased_together', 'active'],
    ['New arrivals', 'newest_products', 'inactive'],
  ])
  // As the product page asks it.
  const row = (id: number) => {
    const product = byId(home, id)
    return ids(recommendFor(product, forSameAudience(home.products, product), { ...engine, type: engine.type as 'frequently_purchased_together' }).slice(0, 4))
  }
  // The women's down jacket: her rain shell and boots, the trail bottle (a best seller too) and her fleece; never the
  // men's jacket.
  assert.deepEqual(row(6001), [6002, 6005, 6014, 6016])
  assert.deepEqual(row(6006), [6007, 6014, 6017, 6008])
  assert.deepEqual(row(6010), [6006, 6007, 6017, 6008])
  assert.deepEqual(row(6013), [6020, 6019, 6018, 6011])
  const men = new Set(ids(home.products.filter((p) => audienceOf(p.collections) === 'him')))
  const women = new Set(ids(home.products.filter((p) => audienceOf(p.collections) === 'her')))
  for (const p of home.products) {
    for (const id of row(p.id)) {
      if (women.has(p.id)) assert.ok(!men.has(id), `${p.name}: ${id} is not a men's piece`)
      if (men.has(p.id)) assert.ok(!women.has(id), `${p.name}: ${id} is not a women's piece`)
    }
  }
})

test('the store is a USD web store with free shipping, no Click & collect, and copy that says what the checkout does', () => {
  const channel = AURORA_BLUEPRINT.homeChannel
  assert.deepEqual([channel.id, channel.name, channel.storeNumber, channel.webStore?.domain], ['aurora-demo', 'Aurora Outdoor (demo)', 16, '2000290-16.uat.maropost.store'])
  assert.deepEqual(channel.webStore?.blueprint, { original: 'aurora', slot: 6 })
  assert.equal(channel.webStore?.currency, 'USD')
  assert.equal(channel.webStore?.locale, undefined)
  assert.equal(channel.webStore?.merchandiseConnected, true)
  assert.equal(channel.webStore?.demo, true)
  assert.equal(AURORA_BLUEPRINT.seedVersion, 1)
  assert.deepEqual(home.checkout, { ...checkoutProfile('USD'), keepsAddress: true, pickup: false })
  assert.deepEqual(home.plans, [])
  // Where the pages and the chatbot say the store ships is where the checkout delivers.
  const shipping = home.content.find((e) => e.handle === 'shipping-and-returns')!.body
  const whereWeShip = home.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? []).find((e) => e.title === 'Where we ship')!.text
  for (const country of home.checkout.countries) {
    assert.ok(shipping.includes(country), `the shipping page names ${country}`)
    assert.ok(whereWeShip.includes(country), `the chatbot names ${country}`)
  }
  const copyText = JSON.stringify([home.content, home.chatbot, home.chrome, home.theme.templates, home.campaigns, history])
  assert.equal(copyText.match(/click (&|and) collect|collect (it )?(in|from)|pick ?up|in-store/i)?.[0], undefined, 'nothing offers collection')
  assert.equal(copyText.match(/\b\d+ to \d+ business days/g)?.find((days) => days !== '3 to 5 business days'), undefined, 'every delivery time is 3 to 5 business days')
  assert.ok(copyText.includes('3 to 5 business days'))
  assert.equal(copyText.match(/orders? over \$|same.day|express|next.day|overnight shipping/i)?.[0], undefined, 'nothing else about shipping')
  assert.equal(copyText.match(/\b(14|60|90) days\b/)?.[0], undefined, 'returns are 30 days everywhere')
})

test('the theme is Aurora: UAT’s monochrome, charcoal buttons with corners of 6, Source Serif 4 headings over the system sans', () => {
  assert.deepEqual(home.theme.styles, {
    brandColor: '#373842', accentColor: '#121011', background: '#ffffff', textColor: '#121011',
    headingFont: 'Source Serif 4', bodyFont: 'system-ui', cornerRadius: 6, buttonStyle: 'solid',
    saleBadgeColor: '#b91c1c', customBadgeColor: '#373842', soldOutBadgeColor: '#121011', drawing: 'sections',
    buttonColor: '#373842', surfaceColor: '#f5f5f6', mutedColor: '#545354', dividerColor: '#f0f0f0', headingCase: 'As typed',
    headingWeight: 700, cardColor: '#ffffff', cardRadius: 24, cardShadow: 'None', tileRadius: 8, tileShadow: 'Soft', buttonBorderColor: '#373842',
    buttonHoverColor: '#1f2026', buttonCase: 'As typed', tintColor: '#eeedf5', measure: 1380, gutter: 32,
    heroTitleSize: 61, sectionTitleSize: 25, controlBorderColor: '#8a8a8a',
  })
  assert.ok(themeFonts.includes(home.theme.styles.headingFont), 'Source Serif 4 is offered by the theme builder')
  assert.ok(themeFonts.includes(home.theme.styles.bodyFont))
  assert.deepEqual([home.theme.id, home.theme.name, home.theme.version], ['theme-aurora', 'Aurora', '1.8.9'])
  assert.deepEqual(AURORA_BLUEPRINT.card, {
    name: 'Aurora', version: '1.8.9', kind: 'Outdoor clothing and gear', description: AURORA_BLUEPRINT.card.description, thumbnail: '/storefront/aurora/theme.jpg',
  })
  assert.equal(AURORA_BLUEPRINT.admin.themeName, 'Aurora 1.8.9')
})

test('the theme’s colour pairs pass WCAG 2.1 AA for text, and a field’s edge is 3:1', () => {
  const s = home.theme.styles
  const ratio = (a: string, b: string) => contrastRatio(a, b)!
  const pairs: [string, string, string][] = [
    ['text on the page', s.textColor, s.background],
    ['text on the surface', s.textColor, s.surfaceColor!],
    ['text on a card', s.textColor, s.cardColor!],
    ['text on the tint (the cart summary)', s.textColor, s.tintColor!],
    ['muted text on the page', s.mutedColor!, s.background],
    ['muted text on the surface', s.mutedColor!, s.surfaceColor!],
    ['muted text on the tint', s.mutedColor!, s.tintColor!],
    ['button text on the charcoal', onBrandColor(s.buttonColor!)!, s.buttonColor!],
    ['button text on its hover', onBrandColor(s.buttonHoverColor!)!, s.buttonHoverColor!],
    ['the announcement bar', onBrandColor(s.brandColor)!, s.brandColor],
    ['sale badge', onBrandColor(s.saleBadgeColor)!, s.saleBadgeColor],
    ['sale price on a card', s.saleBadgeColor, s.cardColor!],
    ['new badge', onBrandColor(s.customBadgeColor)!, s.customBadgeColor],
    ['sold-out badge', onBrandColor(s.soldOutBadgeColor)!, s.soldOutBadgeColor],
  ]
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name}: ${ratio(fg, bg).toFixed(2)}:1`)
  // Form fields (checkout, cart, search, newsletter) sit on the page or on a card: their edge is 3:1 (1.4.11).
  for (const bg of [s.background, s.cardColor!]) assert.ok(ratio(s.controlBorderColor!, bg) >= 3, `field edge on ${bg}: ${ratio(s.controlBorderColor!, bg).toFixed(2)}:1`)
  // UAT's own field edge, #9e9e9e, is not: that is why the theme has its own.
  assert.ok(ratio('#9e9e9e', s.background) < 3)
  // The hairlines stay the paler divider, which is not a field's edge.
  assert.notEqual(s.controlBorderColor, s.dividerColor)
  assert.equal(onBrandColor(s.buttonColor!), '#ffffff')
  assert.equal(onBrandColor(s.saleBadgeColor), '#ffffff')
  // The chat's brand colour is the theme's button charcoal.
  assert.equal(home.chatbot.config.primaryColor, s.buttonColor)
})

test('the templates are the ones the Aurora theme names: its header and footer on every page, the hero, the collection slider and framed cards', () => {
  const t = home.theme.templates
  const kinds = (template: keyof typeof t) => t[template].map((s) => s.kind)
  assert.deepEqual(kinds('home'), ['header', 'image-banner', 'collection-grid', 'featured-products', 'image-with-text', 'featured-products', 'footer'])
  assert.deepEqual(kinds('product'), ['header', 'product-detail', 'featured-products', 'footer'])
  assert.deepEqual(kinds('collection'), ['header', 'collection-grid', 'footer'])
  assert.deepEqual(kinds('cart'), ['header', 'cart-summary', 'footer'])
  const settings = (id: string, keys: string[]) => keys.map((key) => section(home, `aurora-${id}`).settings[key])
  for (const s of [...t.home, ...t.product, ...t.collection, ...t.cart]) {
    if (s.kind === 'header') assert.deepEqual([s.settings.menuStyle, s.settings.social, s.settings.sticky, s.settings.colorScheme], ['Stacked', true, false, 'Light'], s.id)
    if (s.kind === 'footer') assert.deepEqual([s.settings.layout, s.settings.showSocial, s.settings.colorScheme], ['Menus and newsletter', false, 'Light'], s.id)
  }

  assert.deepEqual(settings('home-hero', ['headline', 'height', 'contentPosition', 'image']), [
    'Keep the world adventurous forever', 'Small', 'Middle left', '/storefront/aurora/hero-trail.jpg',
  ])
  assert.ok(section(home, 'aurora-home-hero').settings.subheadline)
  assert.deepEqual(section(home, 'aurora-home-hero').blocks!.map((b) => [b.kind, b.settings.label, b.settings.link]), [
    ['button', 'Shop new arrivals', '/collections/new-arrivals'],
  ])

  assert.deepEqual(settings('home-collections', ['title', 'layout', 'tileStyle', 'tileRatio', 'columns']), ['Featured Collections', 'Carousel', 'Label over photo', 'Landscape', 3])
  assert.deepEqual(section(home, 'aurora-home-collections').blocks!.map((b) => [b.kind, b.settings.label, b.settings.link, b.settings.image]), [
    ['collection', 'Jackets', '/collections/jackets', '/storefront/aurora/tile-jackets.jpg'],
    ['collection', 'Footwear', '/collections/footwear', '/storefront/aurora/tile-footwear.jpg'],
    ['collection', 'Packs & accessories', '/collections/packs-accessories', '/storefront/aurora/tile-packs.jpg'],
    ['collection', 'Fleece & layers', '/collections/fleece-layers', '/storefront/aurora/tile-layers.jpg'],
  ])
  assert.deepEqual(settings('home-new-arrivals', ['title', 'collection', 'productCount', 'layout']), ['New arrivals', 'new-arrivals', 4, 'Grid'])
  assert.deepEqual(settings('home-story', ['heading', 'buttonLabel', 'buttonLink', 'imageSide', 'image']), ['Made for the trail', 'Read our story', '/page/about', 'Left', '/storefront/aurora/story-trail.jpg'])
  assert.deepEqual(settings('home-best-sellers', ['title', 'collection', 'productCount', 'layout']), ['Best sellers', 'best-sellers', 4, 'Grid'])

  const detail = section(home, 'aurora-product-detail')
  assert.deepEqual([detail.settings.galleryLayout, detail.settings.imageRatio, detail.settings.sizeGuide, detail.settings.fitment], ['Thumbnails', 'Square', true, false])
  assert.deepEqual(detail.blocks!.map((b) => [b.kind, b.settings.title, b.settings.source, b.settings.open]), [
    ['collapsible-row', 'Description', 'description', true],
    ['collapsible-row', 'Fit and sizing', 'fit', false],
    ['collapsible-row', 'Fabric and care', 'fabric-care', false],
    ['collapsible-row', 'Delivery and returns', 'delivery-returns', false],
  ])
  assert.equal(section(home, 'aurora-product-related').settings.title, 'You may also like')
  const grid = section(home, 'aurora-collection-grid').settings
  assert.deepEqual([grid.filters, grid.sort, grid.quickAdd, grid.cardStyle, grid.columns], [true, true, true, 'Framed', 3])
  // The filter groups, in order.
  assert.equal(grid.facets, 'size,color,category,price')
})

test('the header and footer: the Aurora wordmark, social icons, a search pill, the menu, three link columns and the newsletter', () => {
  const c = home.chrome
  assert.equal(c.wordmark, 'Aurora')
  assert.equal(home.theme.styles.headingCase, 'As typed')
  assert.deepEqual(c.headerTools, ['search', 'account', 'wishlist'])
  assert.equal(c.headerSearch, 'pill')
  assert.equal(c.searchPlaceholder, 'Search...')
  assert.equal(c.announcementAboveHeader, true, 'a running campaign is announced above the header')
  assert.deepEqual(c.social.map((s) => [s.label, s.icon, s.href]), [
    ['Facebook', 'facebook', '/page/community'], ['Instagram', 'instagram', '/page/community'], ['X', 'twitter', '/page/community'],
  ])
  assert.deepEqual(c.nav.map((l) => [l.label, l.href]), [
    ['Women', '/collections/women'], ['Men', '/collections/men'], ['Jackets', '/collections/jackets'],
    ['Footwear', '/collections/footwear'], ['Packs & accessories', '/collections/packs-accessories'], ['Sale', '/collections/sale'],
  ])
  assert.deepEqual(c.footerColumns.map((col) => [col.heading.label, col.items.map((l) => l.label)]), [
    ['Shop', ['Women', 'Men', 'New arrivals', 'Sale']],
    ['Help', ['Size guide', 'Shipping and returns', 'Contact']],
    ['About', ['Our story', 'Fabric and care']],
  ])
  assert.equal(c.newsletter?.heading, 'Stay in touch')
  assert.equal(c.newsletter?.button, 'Subscribe')
  assert.deepEqual(c.newsletter?.consent.filter((part) => typeof part !== 'string').map((part) => (part as { href: string }).href), ['/policies/terms-of-service', '/policies/privacy-policy'])
  assert.equal(c.copyright, '© 2026 Aurora Outdoor (demo store)')
  // UAT's Aurora footer has no wordmark column, tagline or bottom links.
  assert.deepEqual([c.tagline, c.newsletterColumn, c.bottomLinks], [undefined, undefined, undefined])
  // Every collection is one menu or another away.
  const linked = new Set([...c.nav, ...c.mobileNav, ...c.footerColumns.flatMap((col) => col.items)].map((l) => l.href))
  for (const title of AURORA_COLLECTION_NAMES) assert.ok(linked.has(`/collections/${toHandle(title)}`), title)
  assert.ok(linked.has('/page/community'), 'the phone menu reaches the community page, as the hidden social icons do')
  assert.deepEqual(home.content.map((e) => `${e.kind}:${e.handle}`), [
    'page:about', 'page:community', 'page:contact', 'page:size-guide', 'page:shipping-and-returns', 'page:fabric-and-care',
    'policy:refund-policy', 'policy:privacy-policy', 'policy:terms-of-service',
  ])
  assert.equal(home.content.find((e) => e.handle === 'community')!.title, 'Join us on the trail')
})

// ── The chat ─────────────────────────────────────────────────────────────────

/** The store's chat as the storefront widget asks it (StorefrontChat.vue): the pieces in stock, the knowledge base, the running campaign, the size charts. */
function storeChat(snapshot: StoreSnapshot): AssistantContext {
  const sources = (snapshot.chatbot.config.knowledgeSources ?? []).filter((s) => s.enabled && s.status === 'Active')
  const running = snapshot.campaigns.find((c) => campaignStatus(c, new Date(`${TODAY}T12:00:00`)) === 'Active')
  return {
    email: null, orders: [], subscriptions: [], shoppingEnabled: true, trackingEnabled: true, demo: true,
    products: snapshot.products.filter((p) => variantsOf(p).some(variantAvailable)).map((p) => assistantProduct(p, `/products/${productHandle(p)}`)),
    entries: sources.flatMap((s) => (s.entries ?? []).map((e) => ({ title: e.title, text: e.text, url: e.url, source: s.name }))),
    promotion: running?.offer?.message ?? '',
    profile: snapshot.chatbot.assistantProfile,
    sizeCharts: snapshot.sizeCharts,
  }
}

test('the chatbot answers on the apparel profile, knows what the pages say, and every quick prompt gets an answer on its topic', () => {
  assert.equal(home.chatbot.assistantProfile, 'apparel')
  const config = home.chatbot.config
  assert.deepEqual([config.storeName, config.storeType, config.brandName, config.position], ['Aurora Outdoor', 'Fashion & Apparel', 'Aurora assistant', 'right'])
  assert.match(config.welcomeMessage!, /size.*waterproof or warm enough.*returns/)
  for (const source of config.knowledgeSources!) assert.equal(source.items, source.entries!.length, source.name)
  // Every entry names a page of the store, and the apparel profile's own links are pages of the store too.
  const pages = new Set(home.content.map((e) => `/${e.kind === 'page' ? 'page' : 'policies'}/${e.handle}`))
  for (const entry of config.knowledgeSources!.flatMap((s) => s.entries ?? [])) assert.ok(pages.has(entry.url!), `${entry.title} → ${entry.url}`)
  for (const href of ['/page/fabric-and-care', '/page/size-guide']) assert.ok(pages.has(href), href)
  assert.ok(home.collections.some((c) => c.title === 'Sale'))
  // How warm the jackets and fleece are: a Help pages entry gives the ratings exactly as the products' own pages do,
  // so the builder's preview, which reads only the knowledge base, answers "How warm is the down jacket?" from it.
  const entries = config.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name })))
  const ratingsIn = (text: string) => [...text.matchAll(/\bwarm to about ([^.]+)\./gi)].map((m) => m[1]!.toLowerCase())
  const rated = new Set(home.products.flatMap((p) => ratingsIn(p.detail!.description)))
  assert.deepEqual([...rated], ['14°f (−10°c) over a base layer and a fleece'])
  assert.deepEqual(ids(home.products.filter((p) => ratingsIn(p.detail!.description).length)), [6001, 6006])
  const warmth = entries.find((e) => e.title === 'How warm are the jackets and fleece?')
  assert.ok(warmth && ratingsIn(warmth.text).length === 1, 'the warmth entry gives the down jackets’ rating')
  for (const text of [...entries.map((e) => e.text), ...home.content.map((e) => e.body)]) {
    for (const rating of ratingsIn(text)) assert.ok(rated.has(rating), `"${rating}" is a rating a product's page gives`)
  }
  assert.equal(bestEntry('How warm is the down jacket?', entries)?.title, warmth.title)
  assert.equal(bestEntry('Is the rain shell waterproof?', entries)?.title, 'Waterproof or water-resistant?')

  const prompts = config.quickPrompts!.filter((p) => p.enabled).map((p) => p.text)
  assert.deepEqual(prompts, ['Where is my order?', 'What size boots should I get?', 'Is the rain shell waterproof?', 'How warm is the down jacket?', 'How do returns work?'])
  const ctx = storeChat(home)
  const said = (prompt: string) => assistantReply(prompt, ctx, NEW_CONVERSATION).replies
  assert.match(said(prompts[0]!)[0]!.text, /email/i)
  assert.match(said(prompts[1]!)[0]!.text, /^Canyon Hiking Boot: True to size.*women’s or the men’s/)
  assert.match(said(prompts[2]!)[0]!.text, /^Yes\. Ridgeline Rain Shell: A waterproof, breathable 2\.5-layer shell/)
  assert.match(said(prompts[3]!)[0]!.text, /^Summit Down Jacket: Warm to about 14°F \(−10°C\)/)
  assert.equal(said(prompts[4]!)[0]!.text, config.knowledgeSources![0]!.entries!.find((e) => e.title === 'Returns and refunds')!.text)
  // What's on sale: the sale pieces, then the running code.
  const sale = said('What’s on sale?')
  assert.ok(sale[0]!.kind === 'products' && sale[0]!.productIds.every((id) => byId(home, id).collections.includes('Sale')))
  assert.match(sale[1]!.text, /TRAIL20/)
})

test('the store has three earlier chats, and each answer in them is the one the assistant gives today', () => {
  assert.deepEqual(history.subscriptions, [])
  assert.deepEqual(history.conversations.map((c) => c.topic), ['Sizing', 'Weather and warmth', 'Returns'])
  const ctx = storeChat(home)
  for (const conversation of history.conversations) {
    let state: AssistantState = NEW_CONVERSATION
    const messages = conversation.messages
    for (const [i, message] of messages.entries()) {
      if (message.from !== 'shopper') continue
      const turn = assistantReply(message.text, ctx, state)
      state = turn.state
      const answer = messages[i + 1]
      assert.equal(answer?.from, 'bot', `${conversation.topic}: "${message.text}" is answered`)
      assert.equal(answer.text, turn.replies.map((r) => r.text).join(' '), `${conversation.topic}: "${message.text}"`)
    }
  }
})

// ── Links, photos, ids ───────────────────────────────────────────────────────

/** Every string in a value, with where it is. */
function* stringsOf(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value]
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* stringsOf(item, `${path}[${i}]`)
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) yield* stringsOf(item, path ? `${path}.${key}` : key)
}

test('every link leads to a page the store serves, at home, installed and in its history', () => {
  // As demoStores.test.ts reads them, which runs the same check once Aurora is in DEMO_STORES.
  const served = (snapshot: StoreSnapshot) => new Set([
    '/', '/cart-page', '/account', '/search', '/checkout', '/collections/all',
    ...[...new Set([...snapshot.collections.map((c) => c.title), ...snapshot.products.flatMap((p) => p.collections)])].map((title) => `/collections/${toHandle(title)}`),
    ...snapshot.products.map((p) => `/products/${productHandle(p)}`),
    ...snapshot.content.map((e) => `/${e.kind === 'page' ? 'page' : 'policies'}/${e.handle}`),
  ])
  const linksOf = (value: unknown, domain: string): [string, string][] => {
    const links: [string, string][] = []
    const storeUrl = new RegExp(`https://${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/[^\\s"'<>()]*)?`, 'g')
    for (const [where, text] of stringsOf(value)) {
      if (/^\/(?!storefront\/)[a-z0-9-/]*([?#].*)?$/i.test(text)) links.push([where, text])
      for (const match of text.matchAll(/href="([^"]+)"/g)) links.push([`${where} (href)`, match[1]!])
      for (const match of text.matchAll(storeUrl)) links.push([`${where} (url)`, (match[1] ?? '').replace(/[.,;:!]+$/, '')])
    }
    return links.map(([where, href]) => [where, href.replace(/[?#].*$/, '') || '/'])
  }
  const checks: [string, unknown, string, Set<string>][] = [
    ['home', home, '2000290-16.uat.maropost.store', served(home)],
    ['installed', copy, 'qa-store.example', served(copy)],
    ['history', history, '2000290-16.uat.maropost.store', served(home)],
  ]
  for (const [where, value, domain, pages] of checks) {
    const links = linksOf(value, domain)
    if (where !== 'history') assert.ok(links.length > 20, `${where}: the store links somewhere`)
    for (const [field, href] of links) if (!/^(https?:|mailto:|tel:)/.test(href)) assert.ok(pages.has(href), `${where}: ${field} → ${href} is not a page of the store`)
  }
})

/** The photo names of the catalogue table, in its order. */
const PRODUCT_PHOTOS = [
  'summit-down-w', 'ridgeline-shell-w', 'alpine-fleece-w', 'trailhead-pants-w', 'merino-top-w', 'canyon-boot-w',
  'summit-down-m', 'ridgeline-shell-m', 'alpine-fleece-m', 'trailhead-pants-m', 'merino-top-m', 'canyon-boot-m',
  'daybreak-pack', 'basecamp-pack', 'trail-socks', 'peak-beanie', 'trekking-poles', 'trail-headlamp', 'trail-bottle', 'sun-hat',
]

test('every photo is one of the files the theme names, in its own folder', () => {
  const products = PRODUCT_PHOTOS.flatMap((base) => [`${base}-1.jpg`, `${base}-2.jpg`])
  const colourways = Object.values(AURORA_COLOURWAY_PHOTOS).flatMap((byValue) => Object.values(byValue))
  const homePage = ['hero-trail.jpg', 'tile-jackets.jpg', 'tile-footwear.jpg', 'tile-packs.jpg', 'tile-layers.jpg', 'story-trail.jpg']
  const expected = new Set([...homePage, ...products, ...colourways].map((file) => `${AURORA_PHOTO_DIR}/${file}`))
  const photos = new Set([...stringsOf(home)].map(([, text]) => text).filter((text) => text.startsWith('/storefront/')))
  assert.deepEqual([...photos].sort(), [...expected].sort())
  assert.deepEqual(new Set([...stringsOf(copy)].map(([, text]) => text).filter((text) => text.startsWith('/storefront/'))), photos, 'an install shows the same photos')
  // A colourway photo is of a colour its product comes in, named after it.
  for (const [base, byValue] of Object.entries(AURORA_COLOURWAY_PHOTOS)) {
    assert.ok(PRODUCT_PHOTOS.includes(base), base)
    for (const [value, file] of Object.entries(byValue)) assert.equal(file, `${base}-${toHandle(value)}-1.jpg`)
  }
})

test('what it sells matches its capabilities, its pack shot is a garment, and its ids are slot 6’s', () => {
  assert.deepEqual(AURORA_BLUEPRINT.capabilities, { subscriptions: false, variantPicker: true, sizeGuide: true, vehicleFitment: false })
  assert.ok(home.products.every((p) => !p.detail!.fitment))
  assert.deepEqual([AURORA_BLUEPRINT.id, AURORA_BLUEPRINT.slot, AURORA_BLUEPRINT.photoDir], ['aurora', 6, '/storefront/aurora'])
  assert.deepEqual([AURORA_BLUEPRINT.admin.audienceListId, AURORA_BLUEPRINT.admin.announcementContentId, AURORA_BLUEPRINT.admin.timezone], [906, 9005, 'America/Denver'])
  assert.equal(AURORA_BLUEPRINT.packShot!.shape, 'garment')
})

test('installed in another store, the same store with that store\'s ids, channel and links', () => {
  assert.deepEqual(ids(copy.products), home.products.map((p) => p.id - 6000 + 96000))
  assert.ok(copy.products.every((p) => p.channelIds?.length === 1 && p.channelIds[0] === 'qa-store' && p.detail!.salesChannels[0] === 'QA store'))
  assert.equal(variantFor(byId(copy, 96001), { Color: 'Black', Size: 'M' })!.id, 9600108)
  assert.ok(copy.products.every((p) => !p.detail!.sizeChartId || copy.sizeCharts.some((c) => c.id === p.detail!.sizeChartId)))
  assert.ok(copy.sizeCharts.every((c) => c.channelId === 'qa-store' && c.id.startsWith('qa-store--aurora-chart-')))
  assert.deepEqual(copy.merchandising.searchPins.map((p) => p.pinnedProductIds), [['96005', '96010']])
  assert.equal(copy.merchandising.redirects[0]!.leadsTo, 'https://qa-store.example/page/shipping-and-returns')
  assert.ok(copy.merchandising.synonyms.every((s) => s.id.startsWith('qa-store--aurora-') && s.channelId === 'qa-store'))
  assert.deepEqual(copy.collections.map((c) => c.id), [96901, 96902, 96903, 96904, 96905, 96906, 96907, 96908, 96909, 96910])
  assert.equal(copy.theme.id, 'theme-qa-store--aurora')
  assert.ok(section(copy, 'qa-store--aurora-home-hero'))
  assert.ok(copy.campaigns.every((c) => c.channelId === 'qa-store' && c.id.includes('qa-store--aurora')))
  const text = JSON.stringify(copy)
  assert.ok(!text.includes('aurora-demo') && !text.includes('2000290-16'), 'nothing of the home store is left')
  assert.deepEqual(
    copy.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.fitNote, p.imageUrls]),
    home.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.fitNote, p.imageUrls]),
  )
})
