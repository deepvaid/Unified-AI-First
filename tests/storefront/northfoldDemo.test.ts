// The Northfold (demo) seed against the reference tables of its catalogue: prices and
// sale prices, the sold-out sizes and the "Only 2 left" ones, size charts, what
// LAYERS20 takes off, the collections, what search and "Goes well with" find, and the
// store facts the checkout and the copy must agree on. The checks every demo store
// passes are in demoStores.test.ts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { historyFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import { NORTHFOLD_CHANNEL_ID } from '../../src/storefront/northfoldDemo.ts'
import { campaignStatus, discountFor, findByCode } from '../../src/storefront/campaigns.ts'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { forSameAudience } from '../../src/storefront/productPage.ts'
import { recommendFor, searchStore } from '../../src/storefront/search.ts'
import { chartFor } from '../../src/storefront/sizeCharts.ts'
import { describeVariant, optionValuesOf, stockNote, valueState, variantFor } from '../../src/storefront/variants.ts'
import { money } from '../../src/maropay/money.ts'
import type { ProductVariant } from '../../src/stores/useCommerce.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-19'
const home = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', TODAY)
/** The store installed in another one (slot 5), as Apply would. */
const qaChannel: SalesChannel = {
  ...NORTHFOLD_BLUEPRINT.homeChannel, id: 'qa-store', name: 'QA store',
  webStore: { ...NORTHFOLD_BLUEPRINT.homeChannel.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 5 } },
}
const copy = snapshotFor(qaChannel, 'northfold', TODAY)

type SeededProduct = StoreSnapshot['products'][number]
const byName = (snapshot: StoreSnapshot, name: string): SeededProduct => {
  const product = snapshot.products.find((p) => p.name === name)
  assert.ok(product, name)
  return product
}
const ids = (products: { id: number }[]) => products.map((p) => p.id)
const variantsOf = (p: SeededProduct) => p.detail!.variantsList
const label = (p: SeededProduct, v: ProductVariant) => `${p.name} › ${optionValuesOf(v, p.detail!.options).join(' / ')}`

test('the catalogue is the twenty reference products, at their prices, in their place', () => {
  // The store's order (every collection lists its products in it): Women opens with pieces
  // photographed on women, and the pieces for everyone come last. The ids are the reference ones.
  assert.deepEqual(home.products.map((p) => [p.id, p.name, Number(p.price)]), [
    [3003, 'Breton Stripe Top', 52], [3005, 'Poplin Relaxed Shirt', 72], [3006, 'Washed Silk Blouse', 88],
    [3007, 'Merino Crewneck Sweater', 128], [3001, 'Organic Cotton Tee', 34], [3002, 'Heavyweight Pocket Tee', 38],
    [3004, 'Oxford Button-Down Shirt', 78], [3008, 'Cotton Cable Sweater', 118], [3009, 'Wool-Blend Car Coat', 268],
    [3010, 'Waxed Cotton Field Jacket', 228], [3011, 'Slim Chino', 88], [3012, 'Wide-Leg Pleated Trouser', 108],
    [3015, 'Linen Overshirt', 98], [3016, 'Lambswool Cardigan', 138], [3017, 'Merino Quarter-Zip', 138],
    [3018, 'Quilted Liner Jacket', 148], [3019, 'Relaxed Wool Trouser', 148], [3013, 'Lambswool Scarf', 68],
    [3014, 'Canvas Market Tote', 48], [3020, 'Ribbed Merino Beanie', 38],
  ])
  const variants = home.products.flatMap(variantsOf)
  assert.equal(variants.length, 195)
  assert.equal(variants.reduce((units, v) => units + v.stock['Oxford Warehouse']!, 0), 2427)
  for (const p of home.products) {
    assert.equal(p.inventory, variantsOf(p).reduce((units, v) => units + v.stock['Oxford Warehouse']!, 0), p.name)
    assert.equal(p.sku, variantsOf(p)[0]!.sku, `${p.name}: its SKU is its first variant's`)
    for (const [n, v] of variantsOf(p).entries()) {
      assert.equal(v.id, p.id * 100 + n + 1, `${label(p, v)}: id`)
      assert.equal(v.price, p.price, `${label(p, v)}: every variant has the product's price`)
      assert.match(v.sku, /^NF-[A-Z]{3}-[A-Z]{3}-(XS|S|M|L|XL|28|30|32|34|36|OS)$/)
    }
  }
  assert.deepEqual(home.market, { currency: 'USD' })
  assert.equal(formatStorePrice(money(6499, home.market.currency), home.market.locale), '$64.99')
})

test('two styles are on sale, with a compare-at price on every variant, and nothing in Outerwear is', () => {
  const onSale = home.products.filter((p) => p.compareAtPrice)
  assert.deepEqual(onSale.map((p) => [p.name, p.price, p.compareAtPrice]), [
    ['Washed Silk Blouse', '88.00', '118.00'],
    ['Cotton Cable Sweater', '118.00', '148.00'],
  ])
  for (const p of onSale) for (const v of variantsOf(p)) assert.equal(v.compareAtPrice, p.compareAtPrice, label(p, v))
  assert.deepEqual(home.products.flatMap(variantsOf).filter((v) => v.compareAtPrice).length, 20)
  assert.ok(onSale.every((p) => !p.collections.includes('Outerwear')), 'LAYERS20 never meets a sale price')
  assert.deepEqual(onSale.map((p) => p.collections.includes('Sale')), [true, true])
})

test('five sizes are sold out and two are down to their last two, and every other variant has four or more', () => {
  const where = (stock: (units: number) => boolean) => home.products.flatMap((p) => variantsOf(p)
    .filter((v) => stock(v.stock['Oxford Warehouse']!))
    .map((v) => label(p, v)))
  assert.deepEqual(where((units) => units === 0), [
    'Merino Crewneck Sweater › Oat / S',
    'Wool-Blend Car Coat › Camel / M',
    'Slim Chino › Khaki / 32',
    'Wide-Leg Pleated Trouser › Black / XS',
    'Linen Overshirt › Sand / L',
  ])
  assert.deepEqual(where((units) => units > 0 && units < 4), ['Merino Crewneck Sweater › Navy / M', 'Wool-Blend Car Coat › Black / L'])

  const sweater = byName(home, 'Merino Crewneck Sweater')
  assert.equal(stockNote(variantFor(sweater, { Color: 'Navy', Size: 'M' })!), 'Only 2 left')
  assert.equal(valueState(sweater, { Color: 'Oat' }, 'Size', 'S'), 'sold-out')
  assert.equal(valueState(sweater, { Color: 'Navy' }, 'Size', 'S'), 'available')
  assert.equal(stockNote(variantFor(byName(home, 'Wool-Blend Car Coat'), { Color: 'Black', Size: 'L' })!), 'Only 2 left')
  const notes = home.products.flatMap(variantsOf).map(stockNote).filter(Boolean)
  assert.deepEqual(notes, ['Only 2 left', 'Only 2 left'], 'no other variant says how many are left')
})

test('options are Color as swatches, then Size as buttons; a cart line reads "Size M · Sand"', () => {
  const overshirt = byName(home, 'Linen Overshirt')
  assert.deepEqual(overshirt.detail!.options, [
    { name: 'Color', values: ['Sand', 'Black', 'Olive'], display: 'swatches', swatches: { Sand: '#d2bf9f', Black: '#1a1a1a', Olive: '#6b6b3f' } },
    { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'], display: 'buttons' },
  ])
  const sandM = variantFor(overshirt, { Color: 'Sand', Size: 'M' })!
  assert.equal(sandM.id, 301503)
  assert.equal(sandM.sku, 'NF-LOS-SND-M')
  assert.equal(describeVariant(sandM, overshirt.detail!.options), 'Size M · Sand')
  // Colour only, and no options at all.
  assert.deepEqual(byName(home, 'Ribbed Merino Beanie').detail!.options.map((o) => o.name), ['Color'])
  const tote = byName(home, 'Canvas Market Tote')
  assert.deepEqual(tote.detail!.options, [])
  assert.equal(tote.detail!.hasVariants, false)
  assert.deepEqual(variantsOf(tote).map((v) => [v.title, v.sku]), [['Default', 'NF-TOT-NAT-OS']])
  const shapes = home.products.map((p) => p.detail!.options.map((o) => o.name).join(' × ') || 'none')
  assert.equal(shapes.filter((s) => s === 'Color × Size').length, 17)
  assert.equal(shapes.filter((s) => s === 'Color').length, 2)
})

test('the four colourway products have photos for each colour; the others show their photos in their first colour', () => {
  const colourways = home.products.filter((p) => p.detail!.imagesByColor)
  assert.deepEqual(ids(colourways).sort(), [3001, 3007, 3009, 3015])
  for (const p of colourways) {
    const byColor = p.detail!.imagesByColor!
    assert.deepEqual(Object.keys(byColor), p.detail!.options.find((o) => o.name === 'Color')!.values, p.name)
    for (const [color, photos] of Object.entries(byColor)) {
      assert.ok(photos.length >= 1, `${p.name} in ${color}`)
      assert.match(photos[0]!, new RegExp(`-${color.toLowerCase()}\\.jpg$`), `${p.name}: ${color} leads with its own photo`)
      for (const file of photos) assert.ok(p.imageUrls!.includes(file), `${p.name}: ${file} is in the default gallery`)
    }
    // A photo is listed under the one colour it shows, so its alt text never names another.
    const listed = Object.values(byColor).flat()
    assert.equal(new Set(listed).size, listed.length, `${p.name}: no photo is listed under two colours`)
    assert.equal(p.imageUrls![0], byColor[p.detail!.options[0]!.values[0]!]![0], `${p.name}: the default gallery leads with its first colour`)
  }
  // Each fabric close-up is of one colour, and is listed under that colour alone.
  const detailOf = (name: string) => Object.entries(byName(home, name).detail!.imagesByColor!).filter(([, photos]) => photos.some((f) => f.endsWith('-detail.jpg'))).map(([color]) => color)
  assert.deepEqual(detailOf('Organic Cotton Tee'), ['Sage'])
  assert.deepEqual(detailOf('Merino Crewneck Sweater'), ['Oat'])
  assert.deepEqual(detailOf('Wool-Blend Car Coat'), ['Camel'])
  assert.deepEqual(detailOf('Linen Overshirt'), ['Sand'])
  for (const p of home.products) {
    assert.ok(p.imageUrls!.length >= 2, `${p.name} has two photos or more`)
    assert.equal(p.images, p.imageUrls!.length)
  }
})

test('every sized product links a size chart that covers each of its sizes, and accessories link none', () => {
  assert.deepEqual(home.sizeCharts.map((c) => c.id), ['nf-chart-womens-tops', 'nf-chart-mens-tops', 'nf-chart-womens-trousers', 'nf-chart-mens-trousers', 'nf-chart-outerwear'])
  for (const p of home.products) {
    const sizes = p.detail!.options.find((o) => o.name === 'Size')?.values
    const chart = chartFor(p, home.sizeCharts)
    if (!sizes) {
      assert.equal(chart, undefined, `${p.name} is one size`)
      continue
    }
    assert.ok(chart, `${p.name} has a chart`)
    assert.equal(chart.channelId, NORTHFOLD_CHANNEL_ID)
    for (const size of sizes) assert.ok(chart.rows.some((row) => row.size === size), `${p.name}: ${chart.name} has ${size}`)
    assert.ok(p.detail!.fitNote, `${p.name} has a fit note`)
  }
  for (const chart of home.sizeCharts) {
    assert.equal(chart.unit, 'in')
    for (const row of chart.rows) assert.equal(row.values.length, chart.columns.length, `${chart.name} › ${row.size}`)
    assert.ok(chart.fitNote && chart.howToMeasure, chart.name)
  }
  assert.equal(chartFor(byName(home, 'Slim Chino'), home.sizeCharts)?.name, 'Men’s trousers')
  for (const p of home.products) assert.ok(p.detail!.material && p.detail!.care, `${p.name}: fabric and care`)
})

test('LAYERS20 takes 20% off outerwear: a Linen Overshirt in M / Sand comes to $78.40', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  const campaign = findByCode(home.campaigns, NORTHFOLD_CHANNEL_ID, 'layers20')
  assert.equal(campaign?.name, 'Fall layers')
  assert.equal(campaignStatus(campaign!, now), 'Active')
  const overshirt = byName(home, 'Linen Overshirt')
  const sandM = variantFor(overshirt, { Color: 'Sand', Size: 'M' })!
  assert.equal(sandM.stock['Oxford Warehouse'], 24)
  const line = { price: sandM.price, qty: 1, collections: overshirt.collections }
  const total = (lines: (typeof line)[]) => {
    const subtotal = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.qty, 0)
    return formatStorePrice(money(subtotal - (discountFor(lines, campaign, 'USD')?.amount.amount ?? 0), 'USD'))
  }
  assert.equal(formatStorePrice(discountFor([line], campaign, 'USD')!.amount), '$19.60')
  assert.equal(total([line]), '$78.40')
  // A tee is not outerwear: the discount stays $19.60.
  const tee = byName(home, 'Organic Cotton Tee')
  assert.equal(total([line, { price: tee.price, qty: 1, collections: tee.collections }]), '$112.40')
  // Every product LAYERS20 covers.
  assert.deepEqual(ids(home.products.filter((p) => p.collections.some((c) => campaign!.targets.includes(c)))), [3009, 3010, 3015, 3018])
})

test('one campaign runs, one has ended and one is to come', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  assert.deepEqual(home.campaigns.map((c) => [c.name, c.offer?.code, campaignStatus(c, now)]), [
    ['Fall layers', 'LAYERS20', 'Active'],
    ['Fall preview', 'PREVIEW15', 'Ended'],
    ['Holiday knits', 'KNIT15', 'Scheduled'],
  ])
  assert.deepEqual(home.campaigns.map((c) => [c.startDate, c.endDate]), [['2026-11-14', '2026-11-29'], ['2026-10-08', '2026-10-15'], ['2026-12-03', '2026-12-16']])
})

test('the collections are the six reference ones, and the newest products are New in', () => {
  const members = (title: string) => ids(home.products.filter((p) => p.collections.includes(title)))
  assert.deepEqual(home.collections.map((c) => [c.id, c.title, c.productCount]), [
    [3901, 'New in', 6], [3902, 'Women', 12], [3903, 'Men', 11], [3904, 'Knitwear', 4], [3905, 'Outerwear', 4], [3906, 'Sale', 2],
  ])
  assert.deepEqual(members('New in'), [3015, 3016, 3017, 3018, 3019, 3020])
  // Women and Men list their own pieces first, then the scarf, the tote and the beanie, which are for everyone.
  // Women opens with pieces photographed on women.
  assert.deepEqual(members('Women'), [3003, 3005, 3006, 3007, 3001, 3009, 3012, 3016, 3018, 3013, 3014, 3020])
  assert.deepEqual(members('Men'), [3002, 3004, 3008, 3010, 3011, 3015, 3017, 3019, 3013, 3014, 3020])
  assert.deepEqual(members('Knitwear'), [3007, 3008, 3016, 3017])
  assert.deepEqual(members('Outerwear'), [3009, 3010, 3015, 3018])
  assert.deepEqual(members('Sale'), [3006, 3008])
  for (const c of home.collections) assert.equal(c.productCount, members(c.title).length, c.title)
  const newest = [...home.products].sort((a, b) => b.id - a.id).slice(0, 6)
  assert.deepEqual(ids(newest).sort(), members('New in'))
  assert.deepEqual([...new Set(home.products.map((p) => p.detail!.tag))], ['Tees', 'Shirts', 'Knitwear', 'Outerwear', 'Trousers', 'Accessories'])
})

test('the search rules change what a search finds, as the catalogue tables say', () => {
  const rules = {
    synonyms: home.merchandising.synonyms,
    redirects: home.merchandising.redirects,
    pins: home.merchandising.searchPins,
    hiddenProductIds: [],
  }
  const none = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }
  const found = (query: string, withRules = true) => ids(searchStore(query, home.products, withRules ? rules : none).products)
  assert.deepEqual(found('jumper', false), [])
  assert.deepEqual(found('jumper'), [3008, 3007, 3017])
  assert.deepEqual(found('sweater', false), [3008, 3007, 3017])
  assert.deepEqual(found('sweater'), [3007, 3008, 3017])
  assert.deepEqual(found('pants', false), [])
  assert.deepEqual(found('pants'), [3011, 3012, 3019])
  assert.deepEqual(found('coat', false), [3009, 3018])
  assert.deepEqual(found('coat'), [3009, 3018, 3010, 3015])
  assert.deepEqual(found('t-shirt', false), [3005, 3004, 3015, 3017])
  assert.deepEqual(found('t-shirt'), [3001, 3002, 3005, 3004, 3015, 3017])
  assert.deepEqual(found('gift'), [3013, 3014, 3020])
  assert.equal(searchStore('returns', home.products, rules).redirectTo, 'https://2000290-13.uat.maropost.store/policies/refund-policy')
  assert.equal(searchStore('size guide', home.products, rules).redirectTo, 'https://2000290-13.uat.maropost.store/page/size-guide')
})

test('"Goes well with" shows products that share the most collections, for the same wearer or for everyone', () => {
  const engine = home.merchandising.engines.find((e) => e.status === 'active')!
  assert.equal(engine.name, 'Goes well with')
  // As the product page asks: among the pieces for the same audience, and those for everyone.
  const row = (name: string) => {
    const product = byName(home, name)
    return ids(recommendFor(product, forSameAudience(home.products, product), { ...engine, type: engine.type as 'frequently_purchased_together' }).slice(0, 4))
  }
  // The men's overshirt: the men's field jacket, quarter-zip and trousers, and the beanie, never the women's liner jacket.
  assert.deepEqual(row('Linen Overshirt'), [3010, 3017, 3019, 3020])
  assert.deepEqual(row('Merino Crewneck Sweater'), [3016, 3003, 3005, 3006])
  assert.deepEqual(row('Quilted Liner Jacket'), [3009, 3016, 3020, 3003])
  // The scarf is for everyone, so anything may go with it.
  assert.deepEqual(row('Lambswool Scarf'), [3014, 3020, 3002, 3004])
  const men = new Set(ids(home.products.filter((p) => p.collections.includes('Men'))))
  const women = new Set(ids(home.products.filter((p) => p.collections.includes('Women'))))
  for (const p of home.products) {
    for (const id of row(p.name)) {
      if (men.has(p.id) && !women.has(p.id)) assert.ok(men.has(id), `${p.name}: ${id} is for men too`)
      if (women.has(p.id) && !men.has(p.id)) assert.ok(women.has(id), `${p.name}: ${id} is for women too`)
    }
  }
})

test('the store is a USD web store with free delivery, no Click & collect, and copy that says what the checkout does', () => {
  const channel = NORTHFOLD_BLUEPRINT.homeChannel
  assert.equal(channel.id, 'northfold-demo')
  assert.equal(channel.name, 'Northfold (demo)')
  assert.equal(channel.storeNumber, 13)
  assert.deepEqual(channel.webStore?.blueprint, { original: 'northfold', slot: 3 })
  assert.equal(channel.webStore?.currency, 'USD')
  assert.equal(channel.webStore?.locale, undefined)
  assert.equal(channel.webStore?.merchandiseConnected, true)
  assert.equal(channel.webStore?.demo, true)
  assert.deepEqual(home.checkout, { ...checkoutProfile('USD'), keepsAddress: true, pickup: false })
  // Where the pages and the chatbot say the store ships is where the checkout delivers.
  const shipping = home.content.find((e) => e.handle === 'shipping-and-returns')!.body
  const whereWeShip = home.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? []).find((e) => e.title === 'Where we ship')!.text
  for (const country of home.checkout.countries) {
    assert.ok(shipping.includes(country), `the shipping page names ${country}`)
    assert.ok(whereWeShip.includes(country), `the chatbot names ${country}`)
  }
  assert.equal(JSON.stringify([home.content, home.chatbot, home.chrome]).match(/click (&|and) collect|collect (it )?(in|from)|pick ?up/i)?.[0], undefined, 'nothing offers collection')
  assert.equal(home.chrome.copyright, '© 2026 Northfold (demo store)')
})

test('the theme is Northfold: drawn with sections, Instrument Serif over DM Sans, square corners, black buttons and a red for sale', () => {
  assert.deepEqual(home.theme.styles, {
    brandColor: '#111111', accentColor: '#111111', background: '#faf8f5', textColor: '#1a1a1a',
    headingFont: 'Instrument Serif', bodyFont: 'DM Sans', cornerRadius: 0, buttonStyle: 'solid',
    saleBadgeColor: '#b3261e', customBadgeColor: '#1a1a1a', soldOutBadgeColor: '#66625c', drawing: 'sections',
    buttonColor: '#111111', surfaceColor: '#f1eee9', mutedColor: '#66625c', dividerColor: '#e4dfd8', headingCase: 'As typed',
  })
  assert.equal(home.theme.id, 'theme-northfold')
  const kinds = (template: keyof StoreSnapshot['theme']['templates']) => home.theme.templates[template].map((s) => s.kind)
  assert.deepEqual(kinds('home'), ['announcement-bar', 'header', 'image-banner', 'collection-grid', 'image-with-text', 'featured-products', 'image-with-text', 'icon-row', 'newsletter', 'footer'])
  assert.deepEqual(kinds('product'), ['header', 'product-detail', 'featured-products', 'footer'])
  const detail = home.theme.templates.product.find((s) => s.kind === 'product-detail')!
  assert.deepEqual(detail.blocks!.map((b) => [b.kind, b.settings.title, b.settings.source]), [
    ['collapsible-row', 'Description', 'description'],
    ['collapsible-row', 'Fit and sizing', 'fit'],
    ['collapsible-row', 'Fabric and care', 'fabric-care'],
    ['collapsible-row', 'Delivery and returns', 'delivery-returns'],
  ])
  const trust = home.theme.templates.home.find((s) => s.kind === 'icon-row')!
  assert.deepEqual(trust.blocks!.map((b) => [b.kind, b.settings.icon, b.settings.title]), [
    ['feature', 'truck', 'Free shipping'], ['feature', 'rotate-ccw', 'Free 30-day returns'], ['feature', 'ruler', 'Help with sizing'],
  ])
  const story = home.theme.templates.home.find((s) => s.id === 'northfold-home-story-knit')!
  assert.equal(story.settings.buttonLink, '/products/merino-crewneck-sweater-3007')
})

test('the chatbot answers on the apparel profile, and the store has three earlier chats and no subscribers', () => {
  assert.equal(home.chatbot.assistantProfile, 'apparel')
  assert.equal(home.chatbot.config.brandName, 'Northfold assistant')
  assert.deepEqual(home.plans, [])
  const history = historyFor(NORTHFOLD_CHANNEL_ID, TODAY)!
  assert.deepEqual(history.subscriptions, [])
  assert.deepEqual(history.conversations.map((c) => c.topic), ['Sizing', 'Returns', 'Fabric and care'])
  assert.equal(NORTHFOLD_BLUEPRINT.packShot?.shape, 'garment')
})

test('installed in another store, the same store with that store\'s ids, channel and links', () => {
  assert.deepEqual(ids(copy.products), home.products.map((p) => p.id - 3000 + 53000))
  assert.ok(copy.products.every((p) => p.channelIds?.length === 1 && p.channelIds[0] === 'qa-store' && p.detail!.salesChannels[0] === 'QA store'))
  const overshirt = byName(copy, 'Linen Overshirt')
  assert.equal(variantFor(overshirt, { Color: 'Sand', Size: 'M' })!.id, 5301503)
  assert.ok(copy.products.every((p) => !p.detail!.sizeChartId || copy.sizeCharts.some((c) => c.id === p.detail!.sizeChartId)))
  assert.ok(copy.sizeCharts.every((c) => c.channelId === 'qa-store' && c.id.startsWith('qa-store--northfold-chart-')))
  assert.deepEqual(copy.merchandising.searchPins.map((p) => p.pinnedProductIds), [['53007'], ['53001', '53002']])
  assert.equal(copy.merchandising.redirects[0]!.leadsTo, 'https://qa-store.example/policies/refund-policy')
  assert.equal(copy.theme.templates.home.find((s) => s.id === 'qa-store--northfold-home-story-knit')?.settings.buttonLink, '/products/merino-crewneck-sweater-53007')
  assert.deepEqual(copy.collections.map((c) => c.id), [53901, 53902, 53903, 53904, 53905, 53906])
  const text = JSON.stringify(copy)
  assert.ok(!text.includes('northfold-demo') && !text.includes('2000290-13'), 'nothing of the home store is left')
  // The store's own facts are the same.
  assert.deepEqual(copy.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory]), home.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory]))
})
