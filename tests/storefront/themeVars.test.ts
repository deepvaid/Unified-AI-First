// A theme's styles as the storefront's CSS variables (storefrontThemeVars), and what
// the builder offers a theme. The classic themes (Vitaheal, Atlas, Neelam's Aurora and
// Lumos, Beta) must get exactly the variables they got before the sections drawing;
// the variables below were read from the app before it was added. Northfold, on the
// sections drawing, also gets its button, surfaces and heading type.
// The themes come from the app's own store, so the app's imports are registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)) },
    removeItem: (key: string) => { memory.delete(key) },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
    clear: () => memory.clear(),
  },
  window: new EventTarget(),
})

const { createPinia, setActivePinia } = await import('pinia')
const { useStoreThemesStore } = await import('@/stores/useStoreThemes')
const { DEMO_STORES } = await import('@/storefront/demoStores')
const { snapshotFor } = await import('@/storefront/demoStores/install')
const {
  storefrontThemeVars, sectionsFor, blocksFor, fieldsFor, fieldShown, getSectionDef, getBlockDef, sectionCatalog, createSection,
  storeFacts, themeFonts, THEME_FONT_META, FEATURE_ICONS,
} = await import('@/storefront/themeSections')

setActivePinia(createPinia())
const themes = useStoreThemesStore()
const themeOf = (id: string) => {
  const theme = themes.themes.find((t) => t.id === id)
  assert.ok(theme, `the app seeds ${id}`)
  return theme
}

const ATLAS_VARS = {
  '--sf-brand': '#0071A8', '--sf-on-brand': '#ffffff', '--sf-accent': '#1ab7ea', '--sf-bg': '#ffffff', '--sf-text': '#1a1814',
  '--sf-radius': '12px', '--sf-heading-font': 'Inter', '--sf-body-font': 'Inter',
  '--sf-badge-sale': '#c0392b', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#1ab7ea', '--sf-on-badge-custom': '#121011',
  '--sf-badge-sold-out': '#121011', '--sf-on-badge-sold-out': '#ffffff',
}

/** What every classic theme the app seeds got before the sections drawing existed. */
const BEFORE: Record<string, Record<string, string>> = {
  'theme-atlas': ATLAS_VARS,
  'theme-beta': ATLAS_VARS,
  'theme-neelam-lumos': ATLAS_VARS,
  'theme-neelam-aurora': {
    '--sf-brand': '#373842', '--sf-on-brand': '#ffffff', '--sf-accent': '#121011', '--sf-bg': '#FFFFFF', '--sf-text': '#121011',
    '--sf-radius': '6px', '--sf-heading-font': 'system-ui', '--sf-body-font': 'system-ui',
    '--sf-badge-sale': '#121011', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#373842', '--sf-on-badge-custom': '#ffffff',
    '--sf-badge-sold-out': '#121011', '--sf-on-badge-sold-out': '#ffffff',
  },
  'theme-vitaheal': {
    '--sf-brand': '#0a2240', '--sf-on-brand': '#ffffff', '--sf-accent': '#0a2240', '--sf-bg': '#ffffff', '--sf-text': '#000000',
    '--sf-radius': '8px', '--sf-heading-font': 'Figtree', '--sf-body-font': 'Figtree',
    '--sf-badge-sale': '#6d52ff', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#e4ff52', '--sf-on-badge-custom': '#121011',
    '--sf-badge-sold-out': '#000000', '--sf-on-badge-sold-out': '#ffffff',
  },
}

test('the classic themes get exactly the variables they always had', () => {
  for (const [id, vars] of Object.entries(BEFORE)) {
    const theme = themeOf(id)
    assert.equal(theme.styles.drawing, undefined, `${id} keeps the classic drawing`)
    assert.deepEqual(storefrontThemeVars(theme.styles), vars, id)
  }
  // No other theme is seeded on a store that must not change.
  const classic = themes.themes.filter((t) => t.styles.drawing !== 'sections').map((t) => t.id).sort()
  assert.deepEqual(classic, Object.keys(BEFORE).sort())
})

test('Northfold, on the sections drawing, also gets its button, surfaces and heading type', () => {
  const vars = storefrontThemeVars(themeOf('theme-northfold').styles)
  assert.deepEqual(vars, {
    '--sf-brand': '#111111', '--sf-on-brand': '#ffffff', '--sf-accent': '#111111', '--sf-bg': '#faf8f5', '--sf-text': '#1a1a1a',
    '--sf-radius': '0px',
    '--sf-badge-sale': '#b3261e', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#1a1a1a', '--sf-on-badge-custom': '#ffffff',
    '--sf-badge-sold-out': '#66625c', '--sf-on-badge-sold-out': '#ffffff',
    '--sf-button-bg': '#111111', '--sf-button-ink': '#ffffff', '--sf-button-border': '#111111', '--sf-button-radius': '0px',
    '--sf-surface': '#f1eee9', '--sf-muted': '#66625c', '--sf-divider': '#e4dfd8',
    // A display face with one weight: headings are never made bold.
    '--sf-heading-font': '"Instrument Serif", Georgia, serif', '--sf-heading-weight': '400',
    '--sf-body-font': '"DM Sans", system-ui, sans-serif', '--sf-heading-case': 'none',
    // Its near-black accent stands out on the page, so focus rings keep it.
    '--sf-focus': '#111111',
  })
})

test('focus rings use the accent where it stands out from the page, and the text colour where it does not', () => {
  const torqline = storefrontThemeVars(themeOf('theme-torqline').styles)
  assert.equal(torqline['--sf-accent'], '#ffc61a')
  assert.equal(torqline['--sf-focus'], '#17191c', 'safety yellow is 1.6:1 on white: charcoal rings instead')
  const blue = storefrontThemeVars({ ...themeOf('theme-northfold').styles, accentColor: '#2563eb' })
  assert.equal(blue['--sf-focus'], '#2563eb')
  // A classic theme never gets the variable: its rings are what they were.
  for (const theme of themes.themes.filter((t) => t.styles.drawing !== 'sections')) {
    assert.equal(storefrontThemeVars(theme.styles)['--sf-focus'], undefined, theme.id)
  }
})

test('the button follows the button style, and the quiet colours follow the text and background when the theme leaves them out', () => {
  const base = { ...themeOf('theme-northfold').styles }
  delete base.buttonColor
  delete base.surfaceColor
  delete base.mutedColor
  delete base.dividerColor
  const outline = storefrontThemeVars({ ...base, buttonStyle: 'outline', brandColor: '#17191c' })
  assert.equal(outline['--sf-button-bg'], 'transparent')
  assert.equal(outline['--sf-button-ink'], '#17191c')
  assert.equal(outline['--sf-button-border'], '#17191c')
  const pill = storefrontThemeVars({ ...base, buttonStyle: 'pill', buttonColor: '#ffc61a', headingCase: 'Uppercase', headingFont: 'Barlow Condensed' })
  assert.equal(pill['--sf-button-radius'], '999px')
  assert.equal(pill['--sf-button-bg'], '#ffc61a')
  assert.equal(pill['--sf-button-ink'], '#121011', 'dark ink on a yellow button')
  assert.equal(pill['--sf-heading-case'], 'uppercase')
  assert.equal(pill['--sf-heading-font'], `"Barlow Condensed", 'Arial Narrow', sans-serif`)
  assert.equal(pill['--sf-heading-weight'], '700')
  const derived = storefrontThemeVars(base)
  assert.deepEqual([derived['--sf-surface'], derived['--sf-muted'], derived['--sf-divider']], ['#f1efec', '#666564', '#e1e0dd'])
})

test('every font a demo theme uses is offered, loaded and has a heading weight', () => {
  const scss = readFileSync(new URL('../../src/styles/global.scss', import.meta.url), 'utf8')
  for (const blueprint of DEMO_STORES) {
    const { styles } = snapshotFor(blueprint.homeChannel, blueprint.id, '2026-11-20').theme
    for (const font of [styles.headingFont, styles.bodyFont]) {
      assert.ok(themeFonts.includes(font), `${font} is in the styles panel`)
      assert.ok(THEME_FONT_META[font], `${font} has a font-table entry`)
      assert.ok(font === 'system-ui' || scss.includes(`family=${font.replaceAll(' ', '+')}`), `${font} is loaded`)
    }
  }
})

test('the builder offers a classic theme what it always did, and the sections drawing its own kinds, blocks and fields', () => {
  const kinds = (defs: { kind: string }[]) => defs.map((d) => d.kind)
  const both = { parts: true, sizes: true }
  assert.deepEqual(kinds(sectionsFor(undefined)), kinds(sectionCatalog).filter((k) => k !== 'icon-row' && k !== 'vehicle-finder'))
  assert.deepEqual(kinds(sectionsFor(undefined, both)), kinds(sectionsFor(undefined)), 'a classic theme is offered no store-specific kind')
  assert.ok(kinds(sectionsFor('sections')).includes('icon-row'))
  assert.ok(kinds(sectionsFor('sections', both)).includes('vehicle-finder'))

  const general = ['heading', 'paragraph', 'button', 'image', 'collection', 'divider', 'spacer']
  for (const kind of ['hero', 'featured-products', 'collection-grid', 'image-banner', 'rich-text']) {
    assert.deepEqual(kinds(blocksFor(kind, undefined)), general, `${kind} takes the general blocks`)
    assert.deepEqual(kinds(blocksFor(kind, 'sections')), general, `${kind} takes the general blocks on the sections drawing too`)
  }
  assert.deepEqual(kinds(blocksFor('product-detail', undefined)), [], 'a classic product page has no blocks')
  assert.deepEqual(kinds(blocksFor('product-detail', 'sections')), ['collapsible-row'])
  assert.deepEqual(kinds(blocksFor('icon-row', 'sections')), ['feature'])
  assert.deepEqual(kinds(blocksFor('header', 'sections')), [])

  const keys = (kind: string, drawing: 'sections' | undefined, template: 'home' | 'collection' | 'product' = 'home') =>
    fieldsFor(getSectionDef(kind)!.fields, drawing, template, both).map((f) => f.key)
  assert.deepEqual(keys('header', undefined), ['menuStyle', 'sticky'])
  assert.deepEqual(keys('header', 'sections'), ['menuStyle', 'sticky', 'colorScheme'])
  assert.deepEqual(keys('footer', undefined), ['showSocial', 'columns'])
  assert.deepEqual(keys('collection-grid', undefined), ['title', 'columns'])
  assert.deepEqual(keys('collection-grid', 'sections'), ['title', 'columns', 'tileRatio'])
  assert.deepEqual(keys('collection-grid', 'sections', 'collection'), ['title', 'columns', 'filters', 'sort', 'quickAdd', 'cardStyle'])
  assert.deepEqual(keys('product-detail', undefined, 'product'), ['galleryLayout', 'showReviews'])
  assert.deepEqual(keys('product-detail', 'sections', 'product'), ['galleryLayout', 'imageRatio', 'sizeGuide', 'fitment', 'showReviews'])
  assert.deepEqual(keys('featured-products', undefined), ['title', 'productCount', 'layout'])
  // The vehicle setting is the home page's row only: the product page's row is the recommendations.
  assert.deepEqual(keys('featured-products', 'sections'), ['title', 'collection', 'productCount', 'layout', 'vehicle'])
  assert.deepEqual(keys('featured-products', 'sections', 'product'), ['title', 'collection', 'productCount', 'layout'])
  assert.deepEqual(keys('vehicle-finder', 'sections'), ['headline', 'subheadline', 'partNumberSearch'])
})

test('the builder offers what the store sells: a clothing store no vehicle settings, a parts store no size guide', () => {
  const store = (id: 'northfold' | 'torqline') => {
    const snapshot = snapshotFor(DEMO_STORES.find((b) => b.id === id)!.homeChannel, id, '2026-11-20')
    return storeFacts(snapshot.products, snapshot.sizeCharts)
  }
  const northfold = store('northfold')
  const torqline = store('torqline')
  assert.deepEqual(northfold, { parts: false, sizes: true })
  assert.deepEqual(torqline, { parts: true, sizes: false })

  const kinds = (facts: typeof northfold) => sectionsFor('sections', facts).map((d) => d.kind)
  // Northfold is offered exactly the kinds it had before Torqline.
  assert.deepEqual(kinds(northfold), [
    'announcement-bar', 'header', 'hero', 'featured-products', 'collection-grid', 'image-banner', 'image-with-text', 'rich-text',
    'testimonials', 'newsletter', 'product-detail', 'cart-summary', 'footer', 'icon-row',
  ])
  assert.deepEqual(kinds(torqline), [...kinds(northfold), 'vehicle-finder'])

  const keys = (kind: string, facts: typeof northfold, template: 'home' | 'product' = 'home') =>
    fieldsFor(getSectionDef(kind)!.fields, 'sections', template, facts).map((f) => f.key)
  assert.deepEqual(keys('product-detail', northfold, 'product'), ['galleryLayout', 'imageRatio', 'sizeGuide', 'showReviews'])
  assert.deepEqual(keys('product-detail', torqline, 'product'), ['galleryLayout', 'imageRatio', 'fitment', 'showReviews'])
  assert.deepEqual(keys('featured-products', northfold), ['title', 'collection', 'productCount', 'layout'])
  assert.deepEqual(keys('featured-products', torqline), ['title', 'collection', 'productCount', 'layout', 'vehicle'])

  // A collapsible row's contents: a part's rows to a parts store, the fit note and size guide to a store with sizes.
  const sources = (facts: typeof northfold) => fieldsFor(getBlockDef('collapsible-row')!.fields, 'sections', 'product', facts).find((f) => f.key === 'source')!.options
  assert.deepEqual(sources(northfold), ['description', 'fit', 'fabric-care', 'delivery-returns', 'custom'])
  assert.deepEqual(sources(torqline), ['description', 'fabric-care', 'specs', 'fitment', 'warranty', 'delivery-returns', 'custom'])
  // Told nothing, the builder offers neither.
  assert.deepEqual(fieldsFor(getSectionDef('product-detail')!.fields, 'sections', 'product').map((f) => f.key), ['galleryLayout', 'imageRatio', 'showReviews'])
})

test('a part’s rows take no text, so the builder hides it for them', () => {
  const text = getBlockDef('collapsible-row')!.fields.find((f) => f.key === 'text')!
  for (const source of ['specs', 'fitment', 'warranty']) assert.equal(fieldShown(text, { source }), false, source)
  for (const source of ['description', 'fit', 'fabric-care', 'delivery-returns', 'custom']) assert.equal(fieldShown(text, { source }), true, source)
  assert.equal(fieldShown(getBlockDef('collapsible-row')!.fields[0]!, { source: 'specs' }), true, 'a field without a condition always shows')
})

test('a new icon row starts with three features, and every feature icon has a name', () => {
  const row = createSection('icon-row')
  assert.equal(row.label, 'Icon row')
  assert.deepEqual(row.blocks!.map((b) => [b.kind, b.settings.icon]), [['feature', 'truck'], ['feature', 'rotate-ccw'], ['feature', 'headphones']])
  for (const block of row.blocks!) assert.ok(FEATURE_ICONS[String(block.settings.icon)])
  // The seeded store's features use icons the builder can show.
  const northfold = snapshotFor(DEMO_STORES.find((b) => b.id === 'northfold')!.homeChannel, 'northfold', '2026-11-20')
  const trust = northfold.theme.templates.home.find((s) => s.kind === 'icon-row')!
  for (const block of trust.blocks!) assert.ok(FEATURE_ICONS[String(block.settings.icon)], `${block.settings.icon} is offered`)
  // Kinds that existed before start as they always did: no blocks.
  for (const kind of ['header', 'hero', 'footer', 'product-detail']) assert.equal(createSection(kind).blocks, undefined, kind)
})
