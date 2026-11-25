import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {
  VITAHEAL_BLOG_SEO, VITAHEAL_CHANNEL, VITAHEAL_CHANNEL_ID, VITAHEAL_CHROME, VITAHEAL_COLLECTIONS, VITAHEAL_CONTENT, VITAHEAL_MENUS, VITAHEAL_PHOTOS, VITAHEAL_PLANS, VITAHEAL_THEME_STYLES, VITAHEAL_THEME_TEMPLATES, vitahealProducts,
} from '../../src/storefront/vitahealDemo.ts'
import { productRows } from '../../src/storefront/productPage.ts'
import { onBrandColor, purchaseOptionsSettings, themeFonts } from '../../src/storefront/themeSections.ts'
import type { ThemeSection } from '../../src/storefront/themeSections.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { fromDecimal, money } from '../../src/maropay/money.ts'
import { contrastRatio } from '../../src/utils/brandContrast.ts'
import { defaultOptionId, plansForProduct, purchaseOptions } from '../../src/subscriptions/plans.ts'
import { catalogFor, hasPriceRange } from '../../src/storefront/catalog.ts'

// The seed against the reference tables in docs/store-builder/bkm-build-prompt.md, section 6.

const products = vitahealProducts()
const byName = (name: string) => products.find((p) => p.name === name)!
const variantPrices = (name: string) => Object.fromEntries(byName(name).detail!.variantsList.map((v) => [v.title, Number(v.price)]))
const handle = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

test('the catalogue is the eight reference products at their SEK prices, then the eight added after the second review', () => {
  assert.equal(products.length, 16)
  assert.deepEqual(products.slice(0, 8).map((p) => p.name), [
    'Unwind', 'Clear Focus', 'Daily NAD+', 'Nasal Strips', 'Vitaheal Electrolytes', 'Collagen+', 'Balance Refill', 'Balance',
  ])
  assert.deepEqual(variantPrices('Vitaheal Electrolytes'), { 'Lemon & Ginger': 279, 'Wild Berries': 279, 'Starter Pack (both flavours)': 499 })
  assert.deepEqual(variantPrices('Unwind'), { Can: 419, Bag: 399 })
  assert.deepEqual(variantPrices('Clear Focus'), { Original: 409, Refill: 389 })
  assert.deepEqual(variantPrices('Collagen+'), { Original: 429, Refill: 409 })
  assert.deepEqual(variantPrices('Daily NAD+'), { Original: 669, Refill: 649 })
  for (const single of ['Balance', 'Balance Refill']) assert.deepEqual(Object.values(variantPrices(single)), [419])
  assert.deepEqual(Object.values(variantPrices('Nasal Strips')), [199])
})

test('the Starter Pack is the only variant with a compare-at price', () => {
  const withCompareAt = products.flatMap((p) => p.detail!.variantsList).filter((v) => v.compareAtPrice)
  assert.deepEqual(withCompareAt.map((v) => [v.title, v.compareAtPrice]), [['Starter Pack (both flavours)', '558.00']])
})

test('every variant has a unique SKU and a weight', () => {
  const variants = products.flatMap((p) => p.detail!.variantsList)
  assert.equal(new Set(variants.map((v) => v.sku)).size, variants.length)
  for (const v of variants) {
    assert.ok(v.sku, `${v.title} has a SKU`)
    assert.ok(Number(v.weight) > 0, `${v.sku} has a weight`)
  }
})

test('a card shows the lowest price, with "From" only where variants differ', () => {
  assert.equal(byName('Unwind').price, '399.00')
  assert.equal(hasPriceRange(byName('Unwind')), true)
  assert.equal(byName('Nasal Strips').price, '199.00')
  assert.equal(hasPriceRange(byName('Nasal Strips')), false)
})

test('products belong to this store only, are published, in stock and have two pictures', () => {
  assert.equal(catalogFor(products, VITAHEAL_CHANNEL_ID).length, 16)
  assert.equal(catalogFor(products, 'neelam-store').length, 0)
  for (const p of products) {
    assert.deepEqual(p.channelIds, [VITAHEAL_CHANNEL_ID])
    assert.ok(p.inventory > 0, `${p.name} is in stock`)
    assert.equal(p.imageUrls?.length, 2)
    assert.notEqual(p.imageUrls![0], p.imageUrls![1])
    assert.equal(p.inventory, p.detail!.variantsList.reduce((n, v) => n + Object.values(v.stock).reduce((a, b) => a + b, 0), 0))
  }
})

test('collections match the reference, with Immunity last: eight on subscription', () => {
  const counts = Object.fromEntries(VITAHEAL_COLLECTIONS.map((c) => [c.title, c.productCount]))
  assert.deepEqual(Object.keys(counts), ['Subscription', 'Sport', 'Longevity', 'Sleep', 'Hydrate', 'Immunity'])
  assert.equal(counts.Subscription, 8)
  // Each count is the products that carry the collection.
  for (const c of VITAHEAL_COLLECTIONS) assert.equal(c.productCount, products.filter((p) => p.collections.includes(c.title)).length, c.title)
  assert.deepEqual(counts, { Subscription: 8, Sport: 6, Longevity: 6, Sleep: 3, Hydrate: 1, Immunity: 3 })
  for (const c of VITAHEAL_COLLECTIONS) assert.ok(c.productCount > 0, `${c.title} has products`)
})

test('the store is a published web store priced in SEK', () => {
  assert.equal(VITAHEAL_CHANNEL.type, 'web_store')
  assert.equal(VITAHEAL_CHANNEL.webStore?.currency, 'SEK')
  assert.equal(VITAHEAL_CHANNEL.webStore?.storeBuilderEnabled, true)
})

// ── The Lumos look (second feedback round, 2026-11-25) ───────────────────────

test('the theme is Vitaheal’s navy and badges on the Lumos look: Inter in uppercase, square-ish buttons, soft white cards', () => {
  assert.deepEqual(
    { ...VITAHEAL_THEME_STYLES, brandColor: VITAHEAL_THEME_STYLES.brandColor.toLowerCase() },
    {
      brandColor: '#0a2240', accentColor: '#0a2240', background: '#ffffff', textColor: '#1b1f27',
      headingFont: 'Inter', bodyFont: 'Inter', cornerRadius: 4, buttonStyle: 'solid',
      saleBadgeColor: '#6d52ff', customBadgeColor: '#e4ff52', soldOutBadgeColor: '#000000', drawing: 'sections',
      buttonColor: '#0a2240', surfaceColor: '#f8fafc', mutedColor: '#5f6672', dividerColor: '#e5e8ee', headingCase: 'Uppercase',
      headingWeight: 500, cardColor: '#ffffff', cardRadius: 8, cardShadow: 'Soft', buttonBorderColor: '#0a2240',
      buttonHoverColor: '#16335c', buttonCase: 'Uppercase', tintColor: '#f1f4f9', measure: 1328, gutter: 56,
      heroTitleSize: 64, sectionTitleSize: 32, controlBorderColor: '#8c919b',
    },
  )
  assert.ok(themeFonts.includes(VITAHEAL_THEME_STYLES.headingFont))
})

test('the theme’s colour pairs pass WCAG 2.1 AA for text, and a field’s edge is 3:1', () => {
  const s = VITAHEAL_THEME_STYLES
  const ratio = (a: string, b: string) => contrastRatio(a, b)!
  const pairs: [string, string, string][] = [
    ['text on the page', s.textColor, s.background],
    ['text on the surface', s.textColor, s.surfaceColor!],
    ['text on the tint', s.textColor, s.tintColor!],
    ['text on a card', s.textColor, s.cardColor!],
    ['muted text on the page', s.mutedColor!, s.background],
    ['muted text on the surface', s.mutedColor!, s.surfaceColor!],
    ['muted text on the tint', s.mutedColor!, s.tintColor!],
    ['button text on the navy', onBrandColor(s.buttonColor!)!, s.buttonColor!],
    ['button text on its hover', onBrandColor(s.buttonHoverColor!)!, s.buttonHoverColor!],
    ['the navy as text on the page', s.accentColor, s.background],
    ['the navy as text on the tint', s.accentColor, s.tintColor!],
    ['sale badge', onBrandColor(s.saleBadgeColor)!, s.saleBadgeColor],
    ['sale price on a card', s.saleBadgeColor, s.cardColor!],
    ['the lime badge (Subscribe available)', onBrandColor(s.customBadgeColor)!, s.customBadgeColor],
    ['sold-out badge', onBrandColor(s.soldOutBadgeColor)!, s.soldOutBadgeColor],
  ]
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name}: ${ratio(fg, bg).toFixed(2)}:1`)
  // Form fields (checkout, cart, search, newsletter) sit on the page, a card or the surface: their edge is 3:1 (1.4.11).
  for (const bg of [s.background, s.cardColor!, s.surfaceColor!]) assert.ok(ratio(s.controlBorderColor!, bg) >= 3, `field edge on ${bg}: ${ratio(s.controlBorderColor!, bg).toFixed(2)}:1`)
  // The hairlines stay the paler divider, which is not a field's edge.
  assert.notEqual(s.controlBorderColor, s.dividerColor)
  assert.equal(onBrandColor(s.buttonColor!), '#ffffff')
  assert.equal(onBrandColor(s.customBadgeColor), '#121011', 'dark ink on the lime badge')
})

test('the move to the sections drawing keeps what checkout and the account read: kronor, the account link', () => {
  assert.equal(VITAHEAL_THEME_STYLES.drawing, 'sections')
  assert.deepEqual([VITAHEAL_CHANNEL.webStore?.currency, VITAHEAL_CHANNEL.webStore?.locale, VITAHEAL_CHANNEL.webStore?.demo], ['SEK', 'sv-SE', true])
  // Whole kronor on the pages, öre where an amount is charged.
  assert.equal(formatStorePrice(money(39900, 'SEK'), 'sv-SE').replace(/\s/g, ' '), '399 kr')
  assert.equal(formatStorePrice(money(58590, 'SEK'), 'sv-SE').replace(/\s/g, ' '), '585,90 kr')
  assert.equal(VITAHEAL_CHROME.accountHref, '/account')
})

test('the content is the pages, policies and posts the store needs', () => {
  const handles = (kind: string) => VITAHEAL_CONTENT.filter((e) => e.kind === kind).map((e) => e.handle)
  assert.deepEqual(handles('page'), ['about', 'contact', 'ambassadors', 'money-back-guarantee', 'cookies'])
  assert.deepEqual(handles('policy'), ['refund-policy', 'privacy-policy', 'terms-of-service', 'subscription-terms'])
  assert.equal(handles('blog').length, 3)
  for (const e of VITAHEAL_CONTENT) {
    assert.equal(e.channelId, VITAHEAL_CHANNEL_ID)
    assert.equal(e.status, 'Active')
    assert.ok(e.body.length > 80 && e.seoDescription, `${e.title} has a body and a description`)
  }
})

test('every photo the store names is a file in public/, so nothing is loaded from another site', () => {
  const photos = [...Object.values(VITAHEAL_PHOTOS), ...products.flatMap((p) => p.imageUrls!)]
  // The home page's eight photos (the Immunity tile added), and two for each of the sixteen products.
  assert.equal(photos.length, 8 + 16 * 2)
  for (const photo of photos) {
    assert.match(photo, /^\/storefront\/vitaheal\/[a-z0-9-]+\.jpg$/)
    assert.ok(existsSync(new URL(`../../public${photo}`, import.meta.url)), `${photo} exists`)
  }
})

test('the store carries a fictional brand: nothing in the seed names the real one', () => {
  const seed = JSON.stringify([
    VITAHEAL_CHANNEL, VITAHEAL_CHROME, VITAHEAL_COLLECTIONS, VITAHEAL_CONTENT, VITAHEAL_MENUS, VITAHEAL_BLOG_SEO, VITAHEAL_THEME_TEMPLATES,
    products.map((p) => ({ ...p, imageUrls: p.imageUrls!.map(decodeURIComponent) })),
  ])
  const realNames = /bkm|tranquil|ultra focused|life nad|glow\+|harmonized|elderflower|swedish berries/i
  assert.equal(seed.match(realNames)?.[0], undefined)
})

test('the header offers no tool whose page does not exist yet: the account, and search as a field once the store can search', () => {
  assert.deepEqual(VITAHEAL_CHROME.headerTools, ['account'])
  assert.equal(VITAHEAL_CHROME.accountHref, '/account')
  // The field shows only while the store is connected to Merchandise Cloud, and it starts unconnected.
  assert.equal(VITAHEAL_CHROME.headerSearch, 'field')
  assert.equal(VITAHEAL_CHANNEL.webStore?.merchandiseConnected, false)
  assert.equal(VITAHEAL_CHROME.searchPlaceholder, 'Search supplements')
})

test('the footer: the tagline, three link columns, the newsletter in a column of its own and the legal links in the bottom row', () => {
  const c = VITAHEAL_CHROME
  assert.equal(c.tagline, 'Made in Sweden, for every day')
  assert.match(VITAHEAL_CONTENT.find((e) => e.handle === 'about')!.body, /<h2>Made in Sweden, for every day<\/h2>/, 'the About page’s own words')
  assert.equal(c.newsletterColumn, true)
  assert.ok(c.newsletter?.consent?.length, 'the sign-up keeps its consent line')
  assert.deepEqual(c.footerColumns.map((col) => [col.heading.label, col.items.map((l) => l.label)]), [
    ['Shop', ['All products', 'Sleep', 'Sport', 'Longevity', 'Hydrate', 'Immunity', 'Subscription']],
    ['About Vitaheal', ['Our story', 'Ambassadors', 'Contact']],
    ['Help', ['My subscription', 'Money-back guarantee', 'Refund policy', 'Subscription terms']],
  ])
  assert.deepEqual(c.bottomLinks, [
    { label: 'Privacy policy', href: '/policies/privacy-policy' },
    { label: 'Terms of service', href: '/policies/terms-of-service' },
    { label: 'Cookies', href: '/page/cookies' },
  ])
  // The store editor's footer menu keeps the same pages, in the same order: the About and Help columns, then the legal links.
  assert.deepEqual(VITAHEAL_MENUS.find((m) => m.handle === 'footer-menu')!.items.map((i) => i.title), [
    'Our story', 'Ambassadors', 'Contact', 'My subscription', 'Money-back guarantee', 'Refund policy', 'Subscription terms',
    'Privacy policy', 'Terms of service', 'Cookies',
  ])
})

test('every header, footer, menu and in-copy link leads somewhere', () => {
  const known = new Set<string>([
    '/', '/cart-page', '/account', '/collections/all',
    ...VITAHEAL_COLLECTIONS.map((c) => `/collections/${handle(c.title)}`),
    ...VITAHEAL_CONTENT.filter((e) => e.kind === 'page').map((e) => `/page/${e.handle}`),
    ...VITAHEAL_CONTENT.filter((e) => e.kind === 'policy').map((e) => `/policies/${e.handle}`),
  ])
  const chrome = [
    ...VITAHEAL_CHROME.nav, ...VITAHEAL_CHROME.mobileNav,
    ...VITAHEAL_CHROME.footerColumns.flatMap((c) => [c.heading, ...c.items]),
    ...(VITAHEAL_CHROME.bottomLinks ?? []),
    ...VITAHEAL_CHROME.nav.flatMap((item) => item.menu ? [...item.menu.columns.flatMap((col) => col.links), ...(item.menu.feature ? [item.menu.feature.link] : [])] : []),
    ...(VITAHEAL_CHROME.newsletter?.consent ?? []).filter((part) => typeof part !== 'string'),
  ].map((link) => link.href)
  const menus = VITAHEAL_MENUS.flatMap((m) => m.items.map((i) => i.target))
  const inCopy = VITAHEAL_CONTENT.flatMap((e) => [...e.body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!))
  const sections = Object.values(VITAHEAL_THEME_TEMPLATES).flat()
  const inTheme = [...sections.map((s) => s.settings), ...sections.flatMap((s) => s.blocks ?? []).map((b) => b.settings)]
    .flatMap((settings) => [settings.link, settings.buttonLink, settings.termsLink])
    .filter((href): href is string => typeof href === 'string' && href !== '' && !href.startsWith('/products/'))
  for (const href of [...chrome, ...menus, ...inCopy, ...inTheme]) assert.ok(known.has(href), `${href} is a real storefront path`)
})

// ── The health-store features (feedback round, 2026-11-24) ───────────────────

test('the header’s Shop and About open a panel of links; Subscription goes straight to its collection', () => {
  const nav = VITAHEAL_CHROME.nav
  assert.deepEqual(nav.map((item) => [item.label, item.href, !!item.menu]), [
    ['Shop', '/collections/all', true], ['Subscription', '/collections/subscription', false], ['About', '/page/about', true],
  ])
  const shop = nav[0]!.menu!
  assert.deepEqual(shop.columns.map((c) => [c.heading, c.links.map((l) => l.label)]), [
    ['Shop by goal', ['Sleep', 'Sport', 'Longevity', 'Hydrate', 'Immunity']],
    ['More ways to shop', ['All products', 'Subscribe and save']],
  ])
  assert.equal(shop.feature?.link.href, '/collections/subscription')
  assert.match(shop.feature!.heading, /20% to 30%/)
  assert.deepEqual(nav[2]!.menu!.columns.map((c) => c.heading), ['About Vitaheal', 'Help'])
  // On a phone the same links open in place, then the account and the cart.
  assert.deepEqual(VITAHEAL_CHROME.mobileNav.slice(0, nav.length), nav)
  assert.deepEqual(VITAHEAL_CHROME.mobileNav.slice(nav.length).map((item) => item.href), ['/account', '/cart-page'])
  // The store editor's main menu lists the header's three links.
  assert.deepEqual(VITAHEAL_MENUS.find((m) => m.handle === 'main-menu')!.items.map((i) => i.title), ['Shop', 'Subscription', 'About'])
})

test('every product carries its facts, and every collection a line under its title', () => {
  for (const p of vitahealProducts()) {
    const facts = p.detail!.specs!
    assert.ok(facts.length >= 6, `${p.name} has its facts`)
    assert.ok(facts.some((f) => f.label === 'Free from'), `${p.name} says what it is free from`)
    assert.ok(facts.some((f) => /^How to (take|use) it$/.test(f.label)), `${p.name} says how to take it`)
    assert.deepEqual(facts.at(-1), { label: 'Made in', value: 'Sweden' })
  }
  // Nutrient amounts are written the European way.
  const text = JSON.stringify(vitahealProducts().map((p) => p.detail!.specs))
  assert.match(text, /% NRV/)
  assert.doesNotMatch(text, /% DV/)
  for (const c of VITAHEAL_COLLECTIONS) assert.ok(c.description.length > 20, `${c.title} says what it is for`)
})

const sectionOf = (id: string): ThemeSection => Object.values(VITAHEAL_THEME_TEMPLATES).flat().find((s) => s.id === id)!

test('the home page: the hero with its badge and three figures, the goals carousel, the range, two stories and the promises as cards', () => {
  const home = VITAHEAL_THEME_TEMPLATES.home
  assert.deepEqual(home.map((s) => s.kind), [
    'announcement-bar', 'header', 'image-banner', 'collection-grid', 'featured-products', 'image-with-text', 'icon-row',
    'image-with-text', 'footer',
  ])
  // The sign-up is the footer's newsletter column on every page, not a home section.
  assert.equal(home.some((s) => s.kind === 'newsletter' || s.kind === 'rich-text'), false)

  const hero = sectionOf('vitaheal-home-banner')
  const settings = (s: ThemeSection, keys: string[]) => keys.map((key) => s.settings[key])
  assert.deepEqual(settings(hero, ['badge', 'headline', 'height', 'image']), [
    'Made in Sweden', 'Supplements that do one job well', 'Large', '/storefront/vitaheal/hero.jpg',
  ])
  // Words on the left, in the page's colours on a wash (white words over the photo's bright mist
  // did not reach 3:1); the photo is cropped so the runner sits past the wash.
  assert.equal(hero.settings.contentPosition, 'Center left')
  assert.equal(hero.settings.accentWords, 'one job well')
  assert.deepEqual(hero.blocks!.map((b) => (b.kind === 'stat' ? [b.kind, b.settings.value, b.settings.label] : [b.kind, b.settings.label, b.settings.link])), [
    ['button', 'Shop all products', '/collections/all'],
    ['button', 'Subscribe and save', '/collections/subscription'],
    ['stat', '20–30%', 'Saved on a plan'],
    ['stat', '549 kr', 'Free shipping over'],
    ['stat', '30 days', 'Money back on Unwind'],
  ])
  // The figures are the store's own facts, as its plans and pages state them: no rating, no count of customers.
  assert.deepEqual(VITAHEAL_PLANS.map((p) => p.discountPct).sort(), [20, 30])
  assert.match(String(sectionOf('vitaheal-home-announcement').settings.text), /Free shipping over 549 kr/)
  assert.match(VITAHEAL_CONTENT.find((e) => e.handle === 'money-back-guarantee')!.body, /30 days to try Unwind/)

  const goals = sectionOf('vitaheal-home-collections')
  assert.deepEqual(settings(goals, ['title', 'accentWords', 'layout', 'tileStyle', 'background', 'tileRatio', 'columns']), [
    'Shop by goal', 'goal', 'Carousel', 'Label over photo', 'Tint', 'Landscape', 3,
  ])
  assert.deepEqual(goals.blocks!.map((b) => [b.settings.label, b.settings.link]), [
    // Immunity, new for winter, is third: in view on a desktop, where the carousel shows three.
    ['Sleep', '/collections/sleep'], ['Sport', '/collections/sport'], ['Immunity', '/collections/immunity'],
    ['Longevity', '/collections/longevity'], ['Hydrate', '/collections/hydrate'],
  ])
  assert.equal(goals.blocks!.find((b) => b.id === 'vitaheal-collection-immunity')!.settings.image, VITAHEAL_PHOTOS.tileImmunity)
  assert.deepEqual(settings(sectionOf('vitaheal-home-featured'), ['eyebrow', 'title', 'collection', 'productCount', 'layout']), [
    'Blended and packed in Sweden', 'Our range', 'all', 12, 'Carousel',
  ])
  assert.deepEqual(home.filter((s) => s.kind === 'image-with-text').map((s) => [s.settings.buttonLabel, s.settings.imageSide]), [['Shop Unwind', 'Left'], ['Shop Clear Focus', 'Right']])

  const promises = sectionOf('vitaheal-home-promises')
  assert.deepEqual(settings(promises, ['eyebrow', 'title', 'alignment', 'tileStyle']), ['Why Vitaheal', 'The Vitaheal promise', 'Center', 'Card'])
  assert.deepEqual(promises.blocks!.map((b) => b.settings.title), ['Tested in Sweden', 'Subscribe and save', 'Free shipping', '30-day guarantee'])
})

test('every template has the Lumos header and footer, and every section and block id starts with "vitaheal-"', () => {
  for (const [template, sections] of Object.entries(VITAHEAL_THEME_TEMPLATES)) {
    const header = sections.find((s) => s.kind === 'header')!
    const footer = sections.find((s) => s.kind === 'footer')!
    assert.deepEqual([header.id, header.settings.menuStyle, header.settings.sticky, header.settings.colorScheme], [`vitaheal-${template}-header`, 'Inline', true, 'Light'])
    assert.deepEqual([footer.id, footer.settings.showSocial, footer.settings.columns, footer.settings.colorScheme], [`vitaheal-${template}-footer`, false, 3, 'Light'])
    // A copy in another store takes its prefix (demoStores/vitaheal.ts reprefixes "vitaheal-").
    for (const id of [...sections.map((s) => s.id), ...sections.flatMap((s) => s.blocks ?? []).map((b) => b.id)]) assert.match(id, /^vitaheal-/)
  }
  assert.deepEqual(Object.keys(VITAHEAL_THEME_TEMPLATES), ['home', 'product', 'collection', 'cart'])
})

test('the product page: the plans, then the description open and four rows; it opens on the lowest-priced choice', () => {
  const t = VITAHEAL_THEME_TEMPLATES
  assert.deepEqual(t.product.map((s) => s.kind), ['header', 'product-detail', 'featured-products', 'footer'])
  const detail = sectionOf('vitaheal-product-detail')
  assert.deepEqual(detail.settings, {
    galleryLayout: 'Thumbnails', imageRatio: 'Square', sizeGuide: false, fitment: false, showReviews: false,
    preselectVariant: true, quantity: true, stockLine: true,
  })
  assert.deepEqual(detail.blocks!.map((b) => [b.kind, b.settings.title ?? '', b.settings.source ?? '', b.settings.open ?? '']), [
    ['purchase-options', '', '', ''],
    ['collapsible-row', 'Description', 'description', true],
    ['collapsible-row', 'Product facts', 'facts', false],
    ['collapsible-row', 'How subscriptions work', 'custom', false],
    ['collapsible-row', 'Shipping and returns', 'delivery-returns', false],
    ['collapsible-row', 'Warnings', 'custom', false],
  ])
  assert.equal(detail.blocks![1]!.id, 'vitaheal-row-description')
  const unwind = vitahealProducts()[0]!
  const rows = productRows(detail.blocks, unwind, { sizeGuide: false, hasPlans: true })
  assert.deepEqual(rows.map((r) => r.title), ['Description', 'Product facts', 'How subscriptions work', 'Shipping and returns', 'Warnings'])
  assert.deepEqual(rows[1]!.specs, unwind.detail!.specs)
  assert.deepEqual([sectionOf('vitaheal-product-related').settings.title], ['You may also like'])

  // The collection page: boxed cards with quick add, four to a row, a price filter and sort. The cart is as it was.
  assert.deepEqual(sectionOf('vitaheal-collection-grid').settings, {
    title: '', columns: 4, filters: true, facets: 'price', sort: true, quickAdd: true, cardStyle: 'Boxed',
  })
  assert.deepEqual(t.collection.map((s) => s.kind), ['header', 'collection-grid', 'footer'])
  assert.deepEqual(t.cart.map((s) => s.kind), ['header', 'cart-summary', 'footer'])
  assert.deepEqual(sectionOf('vitaheal-cart-summary').settings, { showNotes: false, upsells: true })
})

test('“How subscriptions work” shows only on a product sold on a plan: on Unwind and Creatine, not on Nasal Strips or Omega-3, and on Balance once a plan offers it', () => {
  const detail = sectionOf('vitaheal-product-detail')
  assert.deepEqual(detail.blocks!.filter((b) => b.settings.plansOnly === true).map((b) => b.id), ['vitaheal-row-subscription'])
  const titles = (name: string, plans: typeof VITAHEAL_PLANS = VITAHEAL_PLANS) => {
    const product = byName(name)
    const hasPlans = plansForProduct(plans, VITAHEAL_CHANNEL_ID, product.id).length > 0
    return productRows(detail.blocks, product, { sizeGuide: false, hasPlans }).map((r) => r.title)
  }
  const onPlan = products.filter((p) => plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, p.id).length > 0).map((p) => p.name)
  assert.deepEqual(onPlan, ['Unwind', 'Clear Focus', 'Daily NAD+', 'Vitaheal Electrolytes', 'Collagen+', 'Plant Protein', 'Daily Greens', 'Creatine'])
  for (const name of onPlan) assert.ok(titles(name).includes('How subscriptions work'), name)
  for (const name of ['Nasal Strips', 'Balance', 'Balance Refill', 'Vitamin D3 + K2', 'Omega-3', 'Magnesium', 'Vitamin C + Zinc', 'Daily Multi']) {
    assert.deepEqual(titles(name), ['Description', 'Product facts', 'Shipping and returns', 'Warnings'], name)
  }
  // The merchant puts Balance on the monthly plan: the row comes with it. Paused, the plan offers it nothing again.
  const balance = byName('Balance').id
  const withBalance = VITAHEAL_PLANS.map((p) => (p.id === 'plan-monthly' ? { ...p, productIds: [...p.productIds, balance] } : p))
  assert.ok(titles('Balance', withBalance).includes('How subscriptions work'))
  const paused = withBalance.map((p) => (p.id === 'plan-monthly' ? { ...p, status: 'Paused' as const } : p))
  assert.equal(titles('Balance', paused).includes('How subscriptions work'), false)
})

test('the plans, their prices and the default are as they were: the 3-month supply is still chosen first', () => {
  assert.deepEqual(VITAHEAL_PLANS.map((p) => [p.name, p.discountPct, p.unitsPerDelivery, p.isDefault, p.options]), [
    ['3-month supply', 30, 3, true, undefined], ['Monthly subscription', 20, 1, false, undefined],
  ])
  const options = purchaseOptions(fromDecimal('279.00', 'SEK')!, plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, 2005))
  const block = purchaseOptionsSettings({ templates: VITAHEAL_THEME_TEMPLATES })!
  assert.equal(block.subscriptionFirst, false)
  assert.equal(defaultOptionId(options, block.subscriptionFirst), 'plan-3-month')
  // Every page that states the saving states the plans' own.
  const terms = VITAHEAL_CONTENT.find((e) => e.kind === 'policy' && e.handle === 'subscription-terms')!.body
  assert.match(terms, /monthly subscription saves 20% and a 3-month supply saves 30%/)
})
