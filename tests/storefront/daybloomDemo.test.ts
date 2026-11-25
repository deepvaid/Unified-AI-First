// The Daybloom (demo) seed against the reference tables of its catalogue: the ten
// products and their prices, the collections by goal and format, the supplement
// facts on every product, the plan sold by delivery options and what each option
// costs, the subscribers, what SLEEP15 takes off, what search and "Goes well with"
// find, the Aurora look and its home and product templates, the mega menu, and the
// store facts the checkout and the copy must agree on. The checks every demo store
// passes are in demoStores.test.ts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAYBLOOM_BLUEPRINT } from '../../src/storefront/demoStores/daybloom.ts'
import { historyFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import { DAYBLOOM_CHANNEL_ID, DAYBLOOM_COLLECTION_NAMES, DAYBLOOM_FORMATS, DAYBLOOM_GOALS, DAYBLOOM_PLAN_OPTIONS } from '../../src/storefront/daybloomDemo.ts'
import { campaignStatus, discountFor, findByCode } from '../../src/storefront/campaigns.ts'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { toHandle } from '../../src/storefront/handles.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { productRows } from '../../src/storefront/productPage.ts'
import { recommendFor, searchStore } from '../../src/storefront/search.ts'
import { purchaseOptionsSettings } from '../../src/storefront/themeSections.ts'
import { fromDecimal, money, toDecimal } from '../../src/maropay/money.ts'
import { defaultOptionId, discountRange, optionLayout, optionsSummary, plansForProduct, purchaseOptions } from '../../src/subscriptions/plans.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-24'
const home = snapshotFor(DAYBLOOM_BLUEPRINT.homeChannel, 'daybloom', TODAY)
/** The store installed in another one (slot 5), as Apply would. */
const qaChannel: SalesChannel = {
  ...DAYBLOOM_BLUEPRINT.homeChannel, id: 'qa-store', name: 'QA store',
  webStore: { ...DAYBLOOM_BLUEPRINT.homeChannel.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 5 } },
}
const copy = snapshotFor(qaChannel, 'daybloom', TODAY)
const history = historyFor(DAYBLOOM_CHANNEL_ID, TODAY)!

type SeededProduct = StoreSnapshot['products'][number]
const byId = (snapshot: StoreSnapshot, id: number): SeededProduct => {
  const product = snapshot.products.find((p) => p.id === id)
  assert.ok(product, String(id))
  return product
}
const ids = (products: { id: number }[]) => products.map((p) => p.id)
const inCollection = (title: string) => ids(home.products.filter((p) => p.collections.includes(title)))
const usd = (amount: string) => fromDecimal(amount, 'USD')!
const pageBody = (kind: 'page' | 'policy', handle: string): string => home.content.find((e) => e.kind === kind && e.handle === handle)!.body

test('the catalogue is the ten reference products, at their prices, each sold in one size', () => {
  assert.deepEqual(home.products.map((p) => [p.id, p.name, p.price, p.detail!.variantsList[0]!.sku]), [
    [7001, 'Magnesium Glycinate', '29.00', 'DB-MAG-60'], [7002, 'Daily Greens', '39.00', 'DB-GRN-30'],
    [7003, 'Probiotic 20 Billion', '34.00', 'DB-PRO-30'], [7004, 'Vitamin D3 + K2', '19.00', 'DB-D3K-60'],
    [7005, 'Sleep Gummies', '24.00', 'DB-SLG-60'], [7006, 'Electrolyte Mix', '25.00', 'DB-ELM-30'],
    [7007, 'Collagen Peptides', '36.00', 'DB-COL-28'], [7008, 'Omega-3 Fish Oil', '27.00', 'DB-OMG-60'],
    [7009, 'Sleep Well Bundle', '47.00', 'DB-BND-SLP'], [7010, 'Daily Essentials Bundle', '75.00', 'DB-BND-ESS'],
  ])
  for (const p of home.products) {
    assert.equal(p.detail!.hasVariants, false, `${p.name} has no options to pick: the classic product page has no picker`)
    assert.equal(p.detail!.variantsList.length, 1, p.name)
    assert.deepEqual(p.channelIds, [DAYBLOOM_CHANNEL_ID])
    assert.equal(p.imageUrls!.length, 2, `${p.name} has a pack shot and a second photo`)
    assert.ok(p.inventory > 0, `${p.name} is in stock`)
  }
  assert.equal(formatStorePrice(money(2900, home.market.currency), home.market.locale), '$29.00')
})

test('a bundle costs less than its products bought one by one, and says by how much', () => {
  const price = (id: number) => Number(byId(home, id).price)
  const sleep = byId(home, 7009)
  assert.equal(price(7001) + price(7005), 53)
  assert.equal(sleep.compareAtPrice, '53.00')
  assert.match(sleep.detail!.subtitle, /\$6 off$/)
  const essentials = byId(home, 7010)
  assert.equal(price(7002) + price(7004) + price(7008), 85)
  assert.equal(essentials.compareAtPrice, '85.00')
  assert.match(essentials.detail!.subtitle, /\$10 off$/)
  for (const bundle of [sleep, essentials]) assert.equal(bundle.productType, 'Bundle')
})

test('collections sort the range by goal and by format, and every product leads with its goal', () => {
  assert.deepEqual(home.collections.map((c) => [c.id, c.title, c.productCount]), [
    [7901, 'Sleep', 3], [7902, 'Energy', 3], [7903, 'Gut health', 2], [7904, 'Immunity', 2], [7905, 'Daily wellness', 4],
    [7906, 'Capsules', 4], [7907, 'Powders', 3], [7908, 'Gummies', 1],
    [7909, 'Bundles', 2], [7910, 'Bestsellers', 4], [7911, 'Subscribe and save', 8],
  ])
  assert.deepEqual(home.collections.map((c) => c.title), [...DAYBLOOM_COLLECTION_NAMES])
  for (const c of home.collections) assert.ok(c.description, `${c.title} says what it is for under its title`)
  const goals: readonly string[] = DAYBLOOM_GOALS
  const formats: readonly string[] = DAYBLOOM_FORMATS
  for (const p of home.products) {
    assert.ok(goals.includes(p.collections[0]!), `${p.name}: the breadcrumb names its goal`)
    const bundle = p.collections.includes('Bundles')
    assert.equal(p.collections.filter((c) => formats.includes(c)).length, bundle ? 0 : 1, `${p.name} is one format, a bundle none`)
  }
  // The home page's "Bestsellers" row shows the first four in-stock products: the bestsellers lead the catalogue.
  assert.deepEqual(inCollection('Bestsellers'), [7001, 7002, 7003, 7004])
  assert.deepEqual(inCollection('Sleep'), [7001, 7005, 7009])
})

test('every product carries its supplement facts, and the product page shows them as a table', () => {
  const blocks = home.theme.templates.product.find((s) => s.kind === 'product-detail')!.blocks
  for (const p of home.products) {
    const facts = p.detail!.specs!
    assert.equal(facts[0]!.label, 'Size', p.name)
    assert.ok(facts.some((f) => f.label === 'Suggested use'), `${p.name} says how to take it`)
    assert.ok(facts.some((f) => f.label === 'Free from' || f.label === 'Contains'), `${p.name} says what it is free from, or what it contains`)
    const rows = productRows(blocks, p, { sizeGuide: false })
    assert.deepEqual(rows.map((r) => [r.title, r.source, r.open]), [
      ['Supplement facts', 'facts', false],
      ['How Subscribe and save works', 'custom', false],
      ['Shipping and returns', 'delivery-returns', false],
      ['Warnings', 'custom', false],
    ], p.name)
    assert.deepEqual(rows[0]!.specs, facts, `${p.name}: the table is the product's own facts`)
  }
  assert.deepEqual(byId(home, 7001).detail!.specs!.slice(0, 4), [
    { label: 'Size', value: '60 capsules' },
    { label: 'Serving size', value: '2 capsules' },
    { label: 'Servings per bottle', value: '30' },
    { label: 'Magnesium (as magnesium glycinate)', value: '200 mg (48% DV)' },
  ])
  // Fish is named where it is: an allergen is never left to the description.
  assert.deepEqual(ids(home.products.filter((p) => p.detail!.specs!.some((f) => f.label === 'Contains'))), [7008, 7010])
})

// ── Subscribe and save ───────────────────────────────────────────────────────

test('one plan sells by delivery options: every month 20% off, every 2 months 15%, every 3 months 10%', () => {
  assert.equal(home.plans.length, 1)
  const plan = home.plans[0]!
  assert.equal(plan.id, 'plan-daybloom-subscribe-and-save')
  assert.equal(plan.shopperLabel, 'Subscribe and save')
  assert.equal(plan.status, 'Active')
  assert.deepEqual(plan.options, DAYBLOOM_PLAN_OPTIONS.map((o) => ({ ...o })))
  assert.equal(optionsSummary(plan.options!), 'Every 1, 2 or 3 months')
  assert.equal(discountRange(plan), '10–20%')
  // The eight single products; a bundle is sold once only.
  assert.deepEqual(plan.productIds, inCollection('Subscribe and save'))
  assert.deepEqual(plan.productIds, [7001, 7002, 7003, 7004, 7005, 7006, 7007, 7008])
  assert.deepEqual(plansForProduct(home.plans, DAYBLOOM_CHANNEL_ID, 7009), [])
})

test('Magnesium Glycinate at $29: $23.20 every month, $24.65 every 2 months, $26.10 every 3, or once', () => {
  const options = purchaseOptions(usd('29.00'), plansForProduct(home.plans, DAYBLOOM_CHANNEL_ID, 7001))
  assert.deepEqual(options.map((o) => [o.name, toDecimal(o.price)]), [
    ['Deliver every month', '23.20'], ['Deliver every 2 months', '24.65'], ['Deliver every 3 months', '26.10'], ['One-time purchase', '29.00'],
  ])
  const layout = optionLayout(options)
  assert.deepEqual(layout.single.map((o) => o.name), ['One-time purchase'])
  assert.deepEqual(layout.groups.map((g) => [g.label, g.options.length]), [['Subscribe and save', 3]])
  // The theme's block opens the page on the subscription: the monthly delivery, the plan's default.
  const buyBox = purchaseOptionsSettings(home.theme)!
  assert.deepEqual(buyBox, { style: 'Cards', subscriptionFirst: true, policyText: 'Pause, skip or cancel any time.', termsLink: '/policies/subscription-terms', cardBadge: true })
  assert.equal(defaultOptionId(options, buyBox.subscriptionFirst), 'plan-daybloom-subscribe-and-save~o1')
})

test('six subscribers are seeded on delivery options, with a next charge ahead and one failed, one paused, one cancelled', () => {
  assert.deepEqual(history.subscriptions.map((s) => [s.number, s.product, s.status, s.price, s.plan.intervalCount]), [
    ['S-1101', 'Magnesium Glycinate', 'Active', '23.20', 1],
    ['S-1102', 'Daily Greens', 'Active', '31.20', 1],
    ['S-1103', 'Probiotic 20 Billion', 'Active', '28.90', 2],
    ['S-1104', 'Vitamin D3 + K2', 'Paused', '17.10', 3],
    ['S-1105', 'Electrolyte Mix', 'Payment failed', '20.00', 1],
    ['S-1106', 'Sleep Gummies', 'Cancelled', '20.40', 2],
  ])
  for (const s of history.subscriptions) {
    assert.equal(s.channelId, DAYBLOOM_CHANNEL_ID)
    assert.equal(s.currency, 'USD')
    assert.equal(s.plan.name, 'Subscribe and save')
    assert.equal(s.plan.byFrequency, true, `${s.number} reads by how often it comes`)
    assert.ok(home.products.some((p) => p.id === s.productId), `${s.number} is for a product of the store`)
    assert.equal(s.customer.address?.country, 'United States')
    if (s.status === 'Cancelled') assert.equal(s.nextChargeOn, null)
    else if (s.status === 'Payment failed') assert.ok(s.nextChargeOn! <= TODAY, 'the failed charge is the one that is due')
    else assert.ok(s.nextChargeOn! > TODAY, `${s.number} is charged next after today`)
  }
  // No other store's subscription has these numbers (Vitaheal's are S-1001 to S-1008).
  assert.ok(history.subscriptions.every((s) => Number(s.number.slice(2)) > 1100))
})

// ── Campaigns, search, recommendations ───────────────────────────────────────

test('SLEEP15 takes 15% off the Sleep range: Magnesium Glycinate comes to $24.65', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  const campaign = findByCode(home.campaigns, DAYBLOOM_CHANNEL_ID, 'sleep15')
  assert.equal(campaign?.name, 'Sleep week')
  assert.equal(campaignStatus(campaign!, now), 'Active')
  const line = (id: number) => ({ price: byId(home, id).price, qty: 1, collections: byId(home, id).collections })
  const off = (...lineIds: number[]) => formatStorePrice(discountFor(lineIds.map(line), campaign, 'USD')!.amount)
  assert.equal(off(7001), '$4.35')
  // Daily Greens is not in the Sleep range: the discount stays the same.
  assert.equal(off(7001, 7002), '$4.35')
  assert.equal(off(7001, 7009), '$11.40')
  assert.deepEqual(ids(home.products.filter((p) => p.collections.some((c) => campaign!.targets.includes(c)))), [7001, 7005, 7009])
})

test('one campaign runs, one has ended and one is to come', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  assert.deepEqual(home.campaigns.map((c) => [c.name, c.targets, c.offer?.code, campaignStatus(c, now)]), [
    ['Sleep week', ['Sleep'], 'SLEEP15', 'Active'],
    ['Fall restock', [], 'RESTOCK10', 'Ended'],
    ['Bundle up', ['Bundles'], 'BUNDLE10', 'Scheduled'],
  ])
  assert.deepEqual(home.campaigns.map((c) => [c.startDate, c.endDate]), [['2026-11-20', '2026-12-04'], ['2026-10-13', '2026-10-20'], ['2026-12-08', '2026-12-21']])
})

test('the search rules change what a search finds', () => {
  const rules = { synonyms: home.merchandising.synonyms, redirects: home.merchandising.redirects, pins: home.merchandising.searchPins, hiddenProductIds: [] }
  const none = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }
  const found = (query: string, withRules = true) => ids(searchStore(query, home.products, withRules ? rules : none).products)
  // The pins: the best seller leads a search for sleep, the electrolytes one for energy.
  assert.deepEqual(found('sleep', false), [7009, 7005, 7001])
  assert.deepEqual(found('sleep'), [7001, 7009, 7005])
  assert.deepEqual(found('energy', false), [7002, 7006, 7010])
  assert.deepEqual(found('energy'), [7006, 7002, 7010])
  // The synonyms: words no product uses.
  for (const [query, expected] of [['tired', [7002, 7006, 7010]], ['insomnia', [7009, 7005, 7001]], ['bloating', [7003, 7002]], ['digestion', [7003, 7002]]] as const) {
    assert.deepEqual(found(query, false), [], `"${query}" finds nothing by itself`)
    assert.deepEqual(found(query), expected, query)
  }
  assert.deepEqual(found('immune', false), [7004])
  assert.deepEqual(found('immune'), [7004, 7010])
  assert.equal(searchStore('refund', home.products, rules).redirectTo, 'https://2000290-17.uat.maropost.store/policies/refund-policy')
  assert.equal(searchStore('subscription', home.products, rules).redirectTo, 'https://2000290-17.uat.maropost.store/page/subscribe-and-save')
})

test('"Goes well with" puts the products that share a goal or a list first, never more than four', () => {
  const engine = home.merchandising.engines.find((e) => e.status === 'active')!
  assert.equal(engine.name, 'Goes well with')
  const row = (id: number) => ids(recommendFor(byId(home, id), home.products, { ...engine, type: engine.type as 'frequently_purchased_together' }).slice(0, 4))
  assert.deepEqual(row(7001), [7003, 7004, 7005, 7002])
  assert.deepEqual(row(7009), [7010, 7001, 7005, 7002], 'a bundle sits beside the other bundle, then what is in it')
  assert.equal(home.merchandising.engines.filter((e) => e.status === 'active').length, 1)
})

// ── The Aurora look ──────────────────────────────────────────────────────────

test('the theme is Aurora’s colours and type on the classic drawing', () => {
  assert.equal(home.theme.id, 'theme-daybloom')
  assert.equal(home.theme.styles.drawing, undefined, 'the classic drawing, whose sizes are Aurora’s')
  assert.deepEqual(home.theme.styles, {
    brandColor: '#373842', accentColor: '#121011', background: '#FFFFFF', textColor: '#121011',
    headingFont: 'system-ui', bodyFont: 'system-ui', cornerRadius: 6, buttonStyle: 'solid',
    saleBadgeColor: '#121011', customBadgeColor: '#373842', soldOutBadgeColor: '#121011',
  })
  assert.deepEqual(DAYBLOOM_BLUEPRINT.capabilities, { subscriptions: true, variantPicker: false, sizeGuide: false, vehicleFitment: false })
  assert.deepEqual(home.market, { currency: 'USD' })
})

test('the home page leads with an offer, the promises, shop by goal and the bestsellers', () => {
  const kinds = (template: 'home' | 'product' | 'collection' | 'cart') => home.theme.templates[template].map((s) => s.kind)
  assert.deepEqual(kinds('home'), [
    'announcement-bar', 'header', 'image-banner', 'icon-row', 'collection-grid', 'featured-products',
    'image-with-text', 'image-with-text', 'rich-text', 'newsletter', 'footer',
  ])
  assert.deepEqual(kinds('product'), ['header', 'product-detail', 'featured-products', 'footer'])
  assert.deepEqual(kinds('collection'), ['header', 'collection-grid', 'footer'])
  assert.deepEqual(kinds('cart'), ['header', 'cart-summary', 'footer'])
  const section = (kind: string) => home.theme.templates.home.find((s) => s.kind === kind)!
  assert.deepEqual(section('icon-row').blocks!.map((b) => [b.settings.icon, b.settings.title]), [
    ['shield-check', 'Independently tested'], ['clock', 'Subscribe and save'], ['truck', 'Free shipping'], ['rotate-ccw', '30-day guarantee'],
  ])
  assert.deepEqual(section('collection-grid').blocks!.map((b) => [b.settings.label, b.settings.link]), [
    ['Sleep', '/collections/sleep'], ['Energy', '/collections/energy'], ['Gut health', '/collections/gut-health'], ['Immunity', '/collections/immunity'],
  ])
  assert.equal(section('featured-products').settings.title, 'Bestsellers')
  assert.deepEqual(home.theme.templates.product[1]!.blocks!.map((b) => b.kind), ['purchase-options', 'collapsible-row', 'collapsible-row', 'collapsible-row', 'collapsible-row'])
})

test('the header’s Shop and Learn open a panel of links; the phone menu holds the same', () => {
  const nav = home.chrome.nav
  assert.deepEqual(nav.map((item) => [item.label, item.href, !!item.menu]), [
    ['Shop', '/collections/all', true], ['Bestsellers', '/collections/bestsellers', false], ['Bundles', '/collections/bundles', false],
    ['Subscribe and save', '/page/subscribe-and-save', false], ['Learn', '/page/about', true],
  ])
  const shop = nav[0]!.menu!
  assert.deepEqual(shop.columns.map((c) => [c.heading, c.links.map((l) => l.label)]), [
    ['Shop by goal', [...DAYBLOOM_GOALS]],
    ['Shop by format', [...DAYBLOOM_FORMATS]],
    ['More ways to shop', ['Bestsellers', 'Bundles', 'Subscribe and save products', 'Shop all']],
  ])
  for (const title of [...DAYBLOOM_GOALS, ...DAYBLOOM_FORMATS]) {
    assert.ok(shop.columns.some((c) => c.links.some((l) => l.href === `/collections/${toHandle(title)}`)), `${title} is one press from the menu`)
  }
  assert.deepEqual(shop.feature, {
    image: '/storefront/daybloom/menu-feature.jpg',
    heading: 'Subscribe and save up to 20%',
    text: 'A delivery every 1, 2 or 3 months. Pause, skip or cancel any time.',
    link: { label: 'How it works', href: '/page/subscribe-and-save' },
  })
  assert.deepEqual(nav[4]!.menu!.columns.map((c) => c.heading), ['About Daybloom', 'Help'])
  assert.equal(nav[4]!.menu!.feature, undefined)
  // On a phone the same links open in place, then the account and the cart.
  assert.deepEqual(home.chrome.mobileNav.slice(0, nav.length), nav)
  assert.deepEqual(home.chrome.mobileNav.slice(nav.length).map((item) => item.href), ['/account', '/cart-page'])
  // The store editor's main menu lists the header's five links.
  assert.deepEqual(home.menus.find((m) => m.handle === 'main-menu')!.items.map((i) => i.title), nav.map((item) => item.label))
})

// ── What the copy promises is what the store does ────────────────────────────

test('the checkout delivers where the copy says, with no pickup, and keeps the address', () => {
  assert.deepEqual(home.checkout, { ...checkoutProfile('USD'), keepsAddress: true, pickup: false })
  const shipping = pageBody('page', 'shipping-and-returns')
  for (const country of ['United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand']) {
    assert.ok(home.checkout.countries.includes(country), country)
    assert.ok(shipping.includes(country), `the shipping page names ${country}`)
  }
  assert.equal(home.checkout.countries.length, 5, 'the copy names every country the checkout offers')
})

test('every page that states the plan’s discounts states the plan’s own', () => {
  const words = ['20%', '15%', '10%']
  assert.deepEqual(DAYBLOOM_PLAN_OPTIONS.map((o) => `${o.discountPct}%`), words)
  const knowledge = home.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? []).find((e) => e.title === 'How Subscribe and save works')!.text
  const row = String(home.theme.templates.product[1]!.blocks!.find((b) => b.settings.title === 'How Subscribe and save works')!.settings.text)
  for (const [where, text] of [['the Subscribe and save page', pageBody('page', 'subscribe-and-save')], ['the subscription terms', pageBody('policy', 'subscription-terms')], ['the chatbot', knowledge], ['the product page', row]] as const) {
    for (const word of words) assert.ok(text.includes(word), `${where} says ${word}`)
    assert.ok(!/\b(25|30|35|40|50)%/.test(text), `${where} promises no other discount`)
  }
  // "Up to 20%" wherever the saving is summed up.
  const upTo = [home.theme.templates.home[0]!.settings.text, home.chrome.nav[0]!.menu!.feature!.heading, home.collections.find((c) => c.title === 'Subscribe and save')!.description]
  for (const text of upTo) assert.match(String(text), /up to 20%/i)
})

test('the store says what a US supplements store must: the footer statement, and warnings on the product page', () => {
  assert.match(home.chrome.copyright, /have not been evaluated by the Food and Drug Administration/)
  assert.match(home.chrome.copyright, /not intended to diagnose, treat, cure or prevent any disease/)
  const warnings = String(home.theme.templates.product[1]!.blocks!.find((b) => b.settings.title === 'Warnings')!.settings.text)
  for (const line of ['Do not exceed the suggested use', 'not a substitute for a varied diet', 'Keep out of reach of children', 'ask your doctor']) assert.ok(warnings.includes(line), line)
  // No product claims to treat anything.
  for (const p of home.products) assert.doesNotMatch(`${p.detail!.subtitle} ${p.detail!.description}`, /\b(cures?|treats?|prevents?|heals?|disease|clinically proven)\b/i, p.name)
  assert.equal(home.chatbot.assistantProfile, 'supplements')
})

// ── Installed in another store ───────────────────────────────────────────────

test('a copy in another store takes that store’s ids, channel and domain, and its plan follows', () => {
  assert.deepEqual(ids(copy.products), [57001, 57002, 57003, 57004, 57005, 57006, 57007, 57008, 57009, 57010])
  assert.deepEqual(copy.products.map((p) => p.detail!.variantsList[0]!.id), copy.products.map((p) => p.id * 100 + 1))
  assert.equal(copy.collections[0]!.id, 57901)
  for (const p of copy.products) assert.deepEqual([p.channelIds, p.salesChannelNames], [['qa-store'], ['QA store']])
  const plan = copy.plans[0]!
  assert.equal(plan.id, 'plan-qa-store--daybloom-subscribe-and-save')
  assert.equal(plan.channelId, 'qa-store')
  assert.deepEqual(plan.productIds, [57001, 57002, 57003, 57004, 57005, 57006, 57007, 57008])
  assert.deepEqual(copy.merchandising.searchPins.map((pin) => pin.pinnedProductIds), [['57001'], ['57006', '57002']])
  assert.ok(copy.merchandising.redirects.every((r) => r.leadsTo.startsWith('https://qa-store.example/')))
  assert.equal(copy.theme.id, 'theme-qa-store--daybloom')
  // The header, the pages and the product template are the same store.
  assert.deepEqual(copy.chrome, home.chrome)
  assert.deepEqual(copy.content.map((e) => [e.kind, e.handle]), home.content.map((e) => [e.kind, e.handle]))
  assert.deepEqual(purchaseOptionsSettings(copy.theme), purchaseOptionsSettings(home.theme))
})
