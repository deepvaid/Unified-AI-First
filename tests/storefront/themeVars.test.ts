// A theme's styles as the storefront's CSS variables (storefrontThemeVars), and what
// the builder offers a theme. The classic themes (Vitaheal, Atlas, Neelam's Aurora and
// Lumos, Beta) must get exactly the variables they got before the sections drawing;
// the variables below were read from the app before it was added. Northfold, on the
// sections drawing, also gets its button, surfaces and heading type. The finer styles
// Lumos added (part 5) become variables only when a theme sets them, so every theme
// before them keeps its variables to the byte.
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
  storeFacts, themeFonts, THEME_FONT_META, FEATURE_ICONS, accentParts, selectValue, blockHasRoom, createBlock, bannerPhoto, variantPreset,
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

/** The Lumos theme's styles as the contract gives them (Figma's values), on the sections drawing. */
const LUMOS_LIKE = {
  drawing: 'sections', brandColor: '#495DA7', accentColor: '#495DA7', background: '#FFFFFF', textColor: '#272727',
  headingFont: 'Inter', bodyFont: 'Inter', cornerRadius: 4, buttonStyle: 'solid',
  saleBadgeColor: '#D4183D', customBadgeColor: '#495DA7', soldOutBadgeColor: '#272727',
  buttonColor: '#495DA7', surfaceColor: '#F9FAFB', mutedColor: '#6D6D6D', dividerColor: '#E8E8E8', headingCase: 'Uppercase',
  headingWeight: 500, cardColor: '#FFFFFF', cardRadius: 8, cardShadow: 'Soft', buttonBorderColor: '#495DA7', buttonHoverColor: '#394A8A',
  buttonCase: 'Uppercase', tintColor: '#F4F7FF', measure: 1328, gutter: 56, heroTitleSize: 64, sectionTitleSize: 32,
} as const

test('the finer styles become variables: weight, cards, button hover and case, tint, measure, gutter and title sizes', () => {
  assert.deepEqual(storefrontThemeVars(LUMOS_LIKE), {
    '--sf-brand': '#495DA7', '--sf-on-brand': '#ffffff', '--sf-accent': '#495DA7', '--sf-bg': '#FFFFFF', '--sf-text': '#272727',
    '--sf-radius': '4px',
    '--sf-badge-sale': '#D4183D', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#495DA7', '--sf-on-badge-custom': '#ffffff',
    '--sf-badge-sold-out': '#272727', '--sf-on-badge-sold-out': '#ffffff',
    '--sf-button-bg': '#495DA7', '--sf-button-ink': '#ffffff', '--sf-button-border': '#495DA7', '--sf-button-radius': '4px',
    '--sf-surface': '#F9FAFB', '--sf-muted': '#6D6D6D', '--sf-divider': '#E8E8E8',
    // Inter's own heading weight is 700; the theme asks for 500.
    '--sf-heading-font': '"Inter", system-ui, sans-serif', '--sf-heading-weight': '500',
    '--sf-body-font': '"Inter", system-ui, sans-serif', '--sf-heading-case': 'uppercase',
    '--sf-focus': '#495DA7',
    '--sf-button-hover': '#394A8A', '--sf-button-case': 'uppercase',
    '--sf-card': '#FFFFFF', '--sf-card-radius': '8px', '--sf-card-shadow': '0 4px 6px -4px rgba(0,0,0,.10)',
    '--sf-tint': '#F4F7FF',
    // 56px at 1400px and wider, 16px on a phone; the measure is the 1328px content and its two gutters.
    '--sf-gutter': 'clamp(16px, 4vw, 56px)', '--sf-measure': '1440px',
    '--sf-hero-title': '64px', '--sf-hero-title-sm': '48px', '--sf-section-title': '32px', '--sf-section-title-sm': '24px',
  })
})

test('each finer style adds its own variable and changes nothing else; a classic theme gets none of them', () => {
  const northfold = themeOf('theme-northfold').styles
  const before = storefrontThemeVars(northfold)
  const added = (patch: Record<string, unknown>) => {
    const after = storefrontThemeVars({ ...northfold, ...patch })
    return Object.fromEntries(Object.entries(after).filter(([key, value]) => before[key] !== value))
  }
  assert.deepEqual(added({ cardRadius: 0 }), { '--sf-card-radius': '0px' })
  assert.deepEqual(added({ cardShadow: 'None' }), { '--sf-card-shadow': 'none' })
  // Collection tiles' own corners and shadow, for a theme whose tiles differ from its cards; unset, they follow the cards'.
  assert.deepEqual(added({ tileRadius: 8 }), { '--sf-tile-radius': '8px' })
  assert.deepEqual(added({ tileShadow: 'Soft' }), { '--sf-tile-shadow': '0 4px 6px -4px rgba(0,0,0,.10)' })
  assert.deepEqual(added({ tileShadow: 'None' }), { '--sf-tile-shadow': 'none' })
  assert.equal('--sf-tile-radius' in before || '--sf-tile-shadow' in before, false)
  assert.deepEqual(added({ buttonCase: 'As typed' }), { '--sf-button-case': 'none' })
  assert.deepEqual(added({ buttonBorderColor: '#2563eb' }), { '--sf-button-border': '#2563eb' })
  assert.deepEqual(added({ headingWeight: 600 }), { '--sf-heading-weight': '600' })
  assert.deepEqual(added({ measure: 1200 }), { '--sf-measure': '1248px' }, 'the default 24px gutters')
  assert.deepEqual(added({ gutter: 12 }), { '--sf-gutter': 'clamp(12px, 0.86vw, 12px)' }, 'a gutter under 16px stays itself on a phone')
  assert.deepEqual(added({ sectionTitleSize: 30 }), { '--sf-section-title': '30px', '--sf-section-title-sm': '23px' })
  // The finer styles are the sections drawing's: a classic theme with them gets exactly what it had.
  const atlas = themeOf('theme-atlas').styles
  const { drawing: _drawing, ...classicFiner } = LUMOS_LIKE
  assert.deepEqual(storefrontThemeVars({ ...atlas, ...classicFiner, brandColor: atlas.brandColor, accentColor: atlas.accentColor,
    background: atlas.background, textColor: atlas.textColor, headingFont: atlas.headingFont, bodyFont: atlas.bodyFont,
    cornerRadius: atlas.cornerRadius, saleBadgeColor: atlas.saleBadgeColor, customBadgeColor: atlas.customBadgeColor,
    soldOutBadgeColor: atlas.soldOutBadgeColor }), ATLAS_VARS)
})

/**
 * The Aurora theme's styles as the part 6 contract gives them (UAT's look, with a real web serif for headings), with
 * UAT's two card looks: the product card's 24px corners and no shadow, the collection tiles' 8px and a soft shadow.
 */
const AURORA_LIKE = {
  drawing: 'sections', brandColor: '#373842', accentColor: '#121011', background: '#FFFFFF', textColor: '#121011',
  headingFont: 'Source Serif 4', bodyFont: 'system-ui', cornerRadius: 6, buttonStyle: 'solid',
  saleBadgeColor: '#B91C1C', customBadgeColor: '#373842', soldOutBadgeColor: '#121011',
  buttonColor: '#373842', surfaceColor: '#F5F5F6', mutedColor: '#545354', dividerColor: '#F0F0F0', headingCase: 'As typed',
  headingWeight: 700, cardColor: '#FFFFFF', cardRadius: 24, cardShadow: 'None', tileRadius: 8, tileShadow: 'Soft',
  buttonBorderColor: '#373842', buttonHoverColor: '#1F2026',
  buttonCase: 'As typed', tintColor: '#EEEDF5', measure: 1380, gutter: 32, heroTitleSize: 61, sectionTitleSize: 25,
  controlBorderColor: '#8A8A8A',
} as const

test('Aurora’s look becomes its variables: Source Serif 4 headings over a system sans, charcoal buttons, 61px hero titles', () => {
  assert.deepEqual(storefrontThemeVars(AURORA_LIKE), {
    '--sf-brand': '#373842', '--sf-on-brand': '#ffffff', '--sf-accent': '#121011', '--sf-bg': '#FFFFFF', '--sf-text': '#121011',
    '--sf-radius': '6px',
    '--sf-badge-sale': '#B91C1C', '--sf-on-badge-sale': '#ffffff', '--sf-badge-custom': '#373842', '--sf-on-badge-custom': '#ffffff',
    '--sf-badge-sold-out': '#121011', '--sf-on-badge-sold-out': '#ffffff',
    '--sf-button-bg': '#373842', '--sf-button-ink': '#ffffff', '--sf-button-border': '#373842', '--sf-button-radius': '6px',
    '--sf-surface': '#F5F5F6', '--sf-muted': '#545354', '--sf-divider': '#F0F0F0',
    // A real web serif, its fallbacks serif too; the body keeps the system sans Aurora is configured with.
    '--sf-heading-font': `"Source Serif 4", Georgia, 'Times New Roman', serif`, '--sf-heading-weight': '700',
    '--sf-body-font': 'system-ui, sans-serif', '--sf-heading-case': 'none',
    '--sf-focus': '#121011',
    '--sf-button-hover': '#1F2026', '--sf-button-case': 'none',
    '--sf-card': '#FFFFFF', '--sf-card-radius': '24px', '--sf-card-shadow': 'none',
    '--sf-tile-radius': '8px', '--sf-tile-shadow': '0 4px 6px -4px rgba(0,0,0,.10)',
    '--sf-tint': '#EEEDF5',
    '--sf-gutter': 'clamp(16px, 2.29vw, 32px)', '--sf-measure': '1444px',
    // UAT's 61px hero headline, three quarters on a phone (UAT never scaled it down: a defect not copied).
    '--sf-hero-title': '61px', '--sf-hero-title-sm': '46px', '--sf-section-title': '25px', '--sf-section-title-sm': '19px',
  })
})

test('Source Serif 4 is offered, has a serif fallback and a bold heading, and loads in the weights Aurora uses', () => {
  const scss = readFileSync(new URL('../../src/styles/global.scss', import.meta.url), 'utf8')
  assert.ok(themeFonts.includes('Source Serif 4'))
  assert.deepEqual(THEME_FONT_META['Source Serif 4'], { fallback: "Georgia, 'Times New Roman', serif", headingWeight: 700 })
  assert.ok(scss.includes('family=Source+Serif+4:wght@400;600;700'), 'regular, semibold and bold are loaded')
  // The fonts the earlier themes use keep their place in the list.
  assert.deepEqual(themeFonts.filter((font) => font !== 'Source Serif 4'),
    ['Inter', 'Figtree', 'Inconsolata', 'Georgia', 'Space Grotesk', 'DM Sans', 'Instrument Serif', 'Barlow', 'Barlow Condensed', 'system-ui'])
})

test('accent words split a heading where they fall, ignoring case and spaces, as whole words only', () => {
  const words = (text: string, accent?: string) => accentParts(text, accent).map((p) => (p.accent ? `[${p.text}]` : p.text)).join('')
  assert.equal(words('Discover your perfect place', 'perfect place'), 'Discover your [perfect place]')
  assert.equal(words('DISCOVER YOUR PERFECT PLACE', 'Perfect  place'), 'DISCOVER YOUR [PERFECT PLACE]')
  assert.equal(words('Shop by room', 'room'), 'Shop by [room]')
  assert.equal(words('Room by room', 'room'), '[Room] by [room]')
  assert.equal(words('Price (USD) + tax', '(USD) +'), 'Price [(USD) +] tax', 'the words are text, not a pattern')
  assert.equal(words('Living Room', 'kitchen'), 'Living Room', 'words the heading does not hold change nothing')
  // Only whole words: "room" is not the end of "Bedroom", "art" not the end of "Smart".
  assert.equal(words('Bedroom comfort', 'room'), 'Bedroom comfort')
  assert.equal(words('Smart art', 'art'), 'Smart [art]')
  assert.equal(words('Bedroom and living room', 'room'), 'Bedroom and living [room]')
  assert.equal(words('Rooms to love', 'room'), 'Rooms to love', 'a longer word is not the accent word')
  assert.equal(words('Shop the Café range', 'café'), 'Shop the [Café] range', 'letters beyond A to Z count as letters')
  assert.equal(words("Lumos's picks", 'Lumos'), "[Lumos]'s picks", 'punctuation ends a word')
  assert.deepEqual(accentParts('Living Room'), [{ text: 'Living Room', accent: false }])
  assert.deepEqual(accentParts('', 'room'), [])
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
  const all = { parts: true, sizes: true, specs: true }
  const SECTIONS_ONLY = ['icon-row', 'logo-strip', 'vehicle-finder']
  assert.deepEqual(kinds(sectionsFor(undefined)), kinds(sectionCatalog).filter((k) => !SECTIONS_ONLY.includes(k)))
  assert.deepEqual(kinds(sectionsFor(undefined, all)), kinds(sectionsFor(undefined)), 'a classic theme is offered no store-specific kind')
  assert.ok(kinds(sectionsFor('sections')).includes('icon-row'))
  assert.ok(kinds(sectionsFor('sections')).includes('logo-strip'))
  assert.ok(kinds(sectionsFor('sections', all)).includes('vehicle-finder'))
  // A logo strip is the home page's; the other kinds go on any template, as they always did.
  assert.ok(kinds(sectionsFor('sections', all, 'home')).includes('logo-strip'))
  assert.deepEqual(kinds(sectionsFor('sections', all, 'product')), kinds(sectionsFor('sections', all)).filter((k) => k !== 'logo-strip'))

  // A classic theme is offered the layouts it always was; the sections drawing also gets the carousel and words on the left.
  const variants = (drawing: 'sections' | undefined, kind: string) => sectionsFor(drawing, all).find((d) => d.kind === kind)!.variants!.map((v) => v.id)
  assert.deepEqual(variants(undefined, 'collection-grid'), ['two', 'three', 'four'])
  assert.deepEqual(variants('sections', 'collection-grid'), ['two', 'three', 'four', 'carousel'])
  assert.deepEqual(variants(undefined, 'image-banner'), ['container-cta', 'full-cta'])
  // Words on the left in the page colours (Lumos), and white on a shaded photo (Aurora).
  assert.deepEqual(variants('sections', 'image-banner'), ['container-cta', 'full-cta', 'words-left', 'photo-left'])
  // Words on the left only where its Text position can be set back: the home page.
  const onTemplate = (template: 'home' | 'product' | 'collection') => sectionsFor('sections', all, template).find((d) => d.kind === 'image-banner')!.variants!.map((v) => v.id)
  assert.deepEqual(onTemplate('home'), ['container-cta', 'full-cta', 'words-left', 'photo-left'])
  assert.deepEqual(onTemplate('product'), ['container-cta', 'full-cta'])
  assert.deepEqual(onTemplate('collection'), ['container-cta', 'full-cta'])
  assert.ok(fieldsFor(getSectionDef('image-banner')!.fields, 'sections', 'home', all).some((f) => f.key === 'contentPosition'))
  assert.deepEqual(variants('sections', 'icon-row'), ['plain', 'cards'])
  assert.deepEqual(variants('sections', 'logo-strip'), ['page', 'tint'])

  // The general blocks stay the general blocks: a kind's own (a stat, a logo) are never offered elsewhere.
  const general = ['heading', 'paragraph', 'button', 'image', 'collection', 'divider', 'spacer']
  for (const kind of ['hero', 'featured-products', 'collection-grid', 'image-banner', 'rich-text']) {
    assert.deepEqual(kinds(blocksFor(kind, undefined)), general, `${kind} takes the general blocks`)
  }
  for (const kind of ['hero', 'featured-products', 'collection-grid', 'rich-text']) {
    assert.deepEqual(kinds(blocksFor(kind, 'sections')), general, `${kind} takes the general blocks on the sections drawing too`)
  }
  // An image banner keeps its buttons and gains its stats strip.
  assert.deepEqual(kinds(blocksFor('image-banner', 'sections')), [...general, 'stat'])
  assert.deepEqual(kinds(blocksFor('product-detail', undefined)), [], 'a classic product page has no blocks')
  assert.deepEqual(kinds(blocksFor('product-detail', 'sections')), ['collapsible-row'])
  assert.deepEqual(kinds(blocksFor('icon-row', 'sections')), ['feature'])
  assert.deepEqual(kinds(blocksFor('logo-strip', 'sections')), ['logo'])
  assert.deepEqual(kinds(blocksFor('header', 'sections')), [])

  const keys = (kind: string, drawing: 'sections' | undefined, template: 'home' | 'collection' | 'product' = 'home') =>
    fieldsFor(getSectionDef(kind)!.fields, drawing, template, all).map((f) => f.key)
  assert.deepEqual(keys('header', undefined), ['menuStyle', 'sticky'])
  // The social icons are the Stacked header's (Aurora); the builder shows the setting with that style (fieldShown).
  assert.deepEqual(keys('header', 'sections'), ['menuStyle', 'social', 'sticky', 'colorScheme'])
  assert.deepEqual(keys('footer', undefined), ['showSocial', 'columns'])
  // A footer's layout (Aurora's menus beside the newsletter) is the sections drawing's.
  assert.deepEqual(keys('footer', 'sections'), ['layout', 'showSocial', 'columns', 'colorScheme'])
  assert.deepEqual(keys('collection-grid', undefined), ['title', 'columns'])
  // The home page's tiles: accent words, a carousel, the name on the photo and a tinted band (Lumos).
  assert.deepEqual(keys('collection-grid', 'sections'), ['title', 'accentWords', 'columns', 'tileRatio', 'layout', 'tileStyle', 'background'])
  assert.deepEqual(keys('collection-grid', 'sections', 'collection'), ['title', 'columns', 'filters', 'sort', 'quickAdd', 'cardStyle'])
  assert.deepEqual(getSectionDef('collection-grid')!.fields.find((f) => f.key === 'cardStyle')!.options, ['Editorial', 'Dense', 'Boxed', 'Framed'])
  assert.deepEqual(keys('product-detail', undefined, 'product'), ['galleryLayout', 'showReviews'])
  assert.deepEqual(keys('product-detail', 'sections', 'product'), ['galleryLayout', 'imageRatio', 'sizeGuide', 'fitment', 'showReviews'])
  assert.deepEqual(keys('featured-products', undefined), ['title', 'productCount', 'layout'])
  // The vehicle setting, the eyebrow and the accent words are the home page's row only: the product page's row is the recommendations.
  assert.deepEqual(keys('featured-products', 'sections'), ['eyebrow', 'title', 'accentWords', 'collection', 'productCount', 'layout', 'vehicle'])
  assert.deepEqual(keys('featured-products', 'sections', 'product'), ['title', 'collection', 'productCount', 'layout'])
  assert.deepEqual(keys('image-banner', undefined), ['headline', 'subheadline', 'height'])
  assert.deepEqual(keys('image-banner', 'sections'), ['badge', 'headline', 'accentWords', 'subheadline', 'height', 'contentPosition'])
  assert.deepEqual(keys('icon-row', 'sections'), ['eyebrow', 'title', 'subtitle', 'alignment', 'tileStyle'])
  assert.deepEqual(keys('logo-strip', 'sections'), ['eyebrow', 'title', 'background'])
  assert.deepEqual(keys('vehicle-finder', 'sections'), ['headline', 'subheadline', 'partNumberSearch'])

  const blockKeys = (kind: string, drawing: 'sections' | undefined) => fieldsFor(getBlockDef(kind)!.fields, drawing, 'home', all).map((f) => f.key)
  assert.deepEqual(blockKeys('collection', undefined), ['label', 'link'])
  assert.deepEqual(blockKeys('collection', 'sections'), ['label', 'accent', 'link'])
  assert.deepEqual(blockKeys('stat', 'sections'), ['value', 'label'])
  assert.deepEqual(blockKeys('logo', 'sections'), ['name', 'link'])
})

test('the builder offers what the store sells: a clothing store no vehicle settings, a parts store no size guide', () => {
  const store = (id: 'northfold' | 'torqline') => {
    const snapshot = snapshotFor(DEMO_STORES.find((b) => b.id === id)!.homeChannel, id, '2026-11-20')
    return storeFacts(snapshot.products, snapshot.sizeCharts)
  }
  const northfold = store('northfold')
  const torqline = store('torqline')
  assert.deepEqual(northfold, { parts: false, sizes: true, specs: false })
  assert.deepEqual(torqline, { parts: true, sizes: false, specs: true })

  const kinds = (facts: typeof northfold) => sectionsFor('sections', facts).map((d) => d.kind)
  // Northfold is offered the kinds it had before Torqline, and the logo strip Lumos added.
  assert.deepEqual(kinds(northfold), [
    'announcement-bar', 'header', 'hero', 'featured-products', 'collection-grid', 'image-banner', 'image-with-text', 'rich-text',
    'testimonials', 'newsletter', 'product-detail', 'cart-summary', 'footer', 'icon-row', 'logo-strip',
  ])
  assert.deepEqual(kinds(torqline), [...kinds(northfold), 'vehicle-finder'])

  const keys = (kind: string, facts: typeof northfold, template: 'home' | 'product' = 'home') =>
    fieldsFor(getSectionDef(kind)!.fields, 'sections', template, facts).map((f) => f.key)
  assert.deepEqual(keys('product-detail', northfold, 'product'), ['galleryLayout', 'imageRatio', 'sizeGuide', 'showReviews'])
  assert.deepEqual(keys('product-detail', torqline, 'product'), ['galleryLayout', 'imageRatio', 'fitment', 'showReviews'])
  assert.deepEqual(keys('featured-products', northfold), ['eyebrow', 'title', 'accentWords', 'collection', 'productCount', 'layout'])
  assert.deepEqual(keys('featured-products', torqline), ['eyebrow', 'title', 'accentWords', 'collection', 'productCount', 'layout', 'vehicle'])

  // A collapsible row's contents: the vehicle table to a parts store, the fit note and size guide to a store with
  // sizes, specifications and a warranty to a store whose products carry them (a part's, a sofa's).
  const sources = (facts: typeof northfold) => fieldsFor(getBlockDef('collapsible-row')!.fields, 'sections', 'product', facts).find((f) => f.key === 'source')!.options
  assert.deepEqual(sources(northfold), ['description', 'fit', 'fabric-care', 'delivery-returns', 'custom'])
  assert.deepEqual(sources(torqline), ['description', 'fabric-care', 'specs', 'fitment', 'warranty', 'delivery-returns', 'custom'])
  const furniture = { parts: false, sizes: false, specs: true }
  assert.deepEqual(sources(furniture), ['description', 'fabric-care', 'specs', 'warranty', 'delivery-returns', 'custom'])
  // A parts store names them as it always did; any other store reads no parts wording.
  const labels = (facts: typeof northfold) => fieldsFor(getBlockDef('collapsible-row')!.fields, 'sections', 'product', facts).find((f) => f.key === 'source')!.optionLabels!
  assert.equal(labels(torqline).specs, 'Part specifications')
  assert.equal(labels(torqline).warranty, 'Part warranty')
  assert.equal(labels(furniture).specs, 'Specifications (from the product)')
  assert.equal(labels(furniture).warranty, 'Warranty (from the product)')
  for (const label of Object.values(labels(furniture))) assert.doesNotMatch(label, /\bparts?\b/i, label)
  assert.equal(labels(torqline).description, 'Product description', 'the other names stay')
  // Specifications or a warranty make the fact; an empty list does not.
  const sofa = (detail: Record<string, unknown>) => storeFacts([{ detail } as never], []).specs
  assert.equal(sofa({ specs: [{ label: 'Width', value: '84 in' }] }), true)
  assert.equal(sofa({ warranty: '5-year frame warranty' }), true)
  assert.equal(sofa({ specs: [], warranty: '  ' }), false)
  // Told nothing, the builder offers neither.
  assert.deepEqual(fieldsFor(getSectionDef('product-detail')!.fields, 'sections', 'product').map((f) => f.key), ['galleryLayout', 'imageRatio', 'showReviews'])
})

test('Aurora’s options are the sections drawing’s: a classic theme’s header, banner and footer are offered what they always were', () => {
  const field = (kind: string, key: string, drawing: 'sections' | undefined) =>
    fieldsFor(getSectionDef(kind)!.fields, drawing, 'home').find((f) => f.key === key)
  // The Stacked header: a classic theme keeps its three menu styles.
  assert.deepEqual(field('header', 'menuStyle', undefined)!.options, ['Inline', 'Centered', 'Minimal'])
  assert.deepEqual(field('header', 'menuStyle', 'sections')!.options, ['Inline', 'Centered', 'Minimal', 'Stacked'])
  assert.equal(field('header', 'social', undefined), undefined)
  // White words on a shaded photo, beside the Lumos position; the names say where the words go and how they look.
  const position = field('image-banner', 'contentPosition', 'sections')!
  assert.deepEqual(position.options, ['Bottom', 'Center left', 'Middle left'])
  assert.deepEqual(position.options!.map((o) => position.optionLabels?.[o] ?? o), ['Bottom', 'Left, in the page colors', 'Left, white on a shade'])
  // The footer's layout: Standard unless it says otherwise, as Northfold's, Torqline's and Lumos's do.
  const layout = field('footer', 'layout', 'sections')!
  assert.deepEqual(layout.options, ['Standard', 'Menus and newsletter'])
  assert.equal(selectValue(layout, undefined), 'Standard')
  // A new banner from the picker's "White words on the photo" is Aurora's 400px hero.
  const photoLeft = getSectionDef('image-banner')!.variants!.find((v) => v.id === 'photo-left')!
  assert.deepEqual(photoLeft.preset, { height: 'Small', contentPosition: 'Middle left' })
  assert.deepEqual([photoLeft.drawing, photoLeft.templates, photoLeft.photoFromBanner], ['sections', ['home'], true])
})

test('“White words on the photo” starts with the photo of the page’s banner, and is offered only on a page that has one', () => {
  const all = { parts: true, sizes: true, specs: true }
  const layouts = (sections: Parameters<typeof bannerPhoto>[0]) =>
    sectionsFor('sections', all, 'home', sections).find((d) => d.kind === 'image-banner')!.variants!.map((v) => v.id)
  const photoLeft = getSectionDef('image-banner')!.variants!.find((v) => v.id === 'photo-left')!
  // Aurora's home: its hero's photo.
  const aurora = snapshotFor(DEMO_STORES.find((b) => b.id === 'aurora')!.homeChannel, 'aurora', '2026-11-20')
  const hero = String(aurora.theme.templates.home.find((s) => s.kind === 'image-banner')!.settings.image)
  assert.ok(hero.endsWith('.jpg'))
  assert.equal(bannerPhoto(aurora.theme.templates.home), hero)
  assert.deepEqual(variantPreset(photoLeft, aurora.theme.templates.home), { height: 'Small', contentPosition: 'Middle left', image: hero })
  assert.deepEqual(layouts(aurora.theme.templates.home), ['container-cta', 'full-cta', 'words-left', 'photo-left'])
  // A page without a banner photo (a banner with none, or no banner) is not offered it: it would be dark words on grey.
  const bare = [createSection('header', {}, 'h'), createSection('image-banner', { headline: 'Sale' }, 'b'), createSection('image-banner', { image: '  ' }, 'c')]
  assert.equal(bannerPhoto(bare), '')
  assert.deepEqual(layouts(bare), ['container-cta', 'full-cta', 'words-left'])
  assert.deepEqual(layouts([]), ['container-cta', 'full-cta', 'words-left'])
  // Another layout keeps its preset as it was; a photo elsewhere on the page (image with text) is not the banner's.
  const wordsLeft = getSectionDef('image-banner')!.variants!.find((v) => v.id === 'words-left')!
  assert.deepEqual(variantPreset(wordsLeft, aurora.theme.templates.home), wordsLeft.preset)
  assert.equal(bannerPhoto([createSection('image-with-text', { image: '/x.jpg' }, 'iwt')]), '')

  // Added from the builder's picker on a seeded home page, the banner brings that page's banner photo.
  const theme = themeOf('theme-northfold')
  const northfoldPhoto = bannerPhoto(theme.templates.home)
  assert.ok(northfoldPhoto)
  const added = themes.addSection(theme.id, 'home', 'image-banner', undefined, 'photo-left')!
  assert.deepEqual(added.settings, { headline: 'The Winter Edit', height: 'Small', contentPosition: 'Middle left', image: northfoldPhoto })
  themes.removeSection(theme.id, 'home', added.id)
  assert.equal(theme.templates.home.some((s) => s.id === added.id), false)
})

test('the header’s social icons show with the Stacked style only; the footer’s with its standard layout only', () => {
  const social = getSectionDef('header')!.fields.find((f) => f.key === 'social')!
  assert.equal(fieldShown(social, { menuStyle: 'Stacked' }), true)
  for (const menuStyle of ['Inline', 'Centered', 'Minimal']) assert.equal(fieldShown(social, { menuStyle }), false, menuStyle)
  assert.equal(fieldShown(social, {}), false, 'unset is Inline')
  const showSocial = getSectionDef('footer')!.fields.find((f) => f.key === 'showSocial')!
  assert.equal(fieldShown(showSocial, {}), true, 'a classic or earlier footer keeps the setting')
  assert.equal(fieldShown(showSocial, { layout: 'Standard' }), true)
  assert.equal(fieldShown(showSocial, { layout: 'Menus and newsletter' }), false, 'that layout draws no social icons')
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
  for (const kind of ['header', 'hero', 'footer', 'product-detail', 'image-banner', 'collection-grid']) assert.equal(createSection(kind).blocks, undefined, kind)
  // Lumos's "Why choose us" row leads with an award ribbon.
  assert.ok(FEATURE_ICONS.award)
})

test('a new logo strip starts with six brand names to replace; a stat block starts with a figure and what it counts', () => {
  const strip = createSection('logo-strip', { background: 'Tint' }, 'story-logos')
  assert.equal(strip.label, 'Logo strip')
  assert.deepEqual(strip.settings, { eyebrow: '', title: 'Brands we carry', background: 'Tint' })
  assert.deepEqual(strip.blocks!.map((b) => [b.kind, b.settings.name]), Array(6).fill(['logo', 'Brand name']))
  assert.equal(new Set(strip.blocks!.map((b) => b.id)).size, 6, 'each logo has its own id')
  const banner = createSection('image-banner')
  assert.equal(banner.blocks, undefined)
  assert.deepEqual(createBlock('stat').settings, { value: '100+', label: 'Happy customers' })
})

test('a banner takes three stats, as the strip draws no more; other blocks have no limit', () => {
  const stats = (n: number) => Array.from({ length: n }, (_, i) => createBlock('stat', {}, `stat-${i}`))
  assert.equal(blockHasRoom({ blocks: stats(2) }, 'stat'), true)
  assert.equal(blockHasRoom({ blocks: stats(3) }, 'stat'), false)
  assert.equal(blockHasRoom({ blocks: [...stats(3), createBlock('button')] }, 'button'), true, 'buttons beside three stats')
  assert.equal(blockHasRoom({}, 'stat'), true)
  assert.match(getBlockDef('stat')!.limit!.reason, /3/)
})

test('a select shows what the storefront draws: its value, else its default when unset or not one of its options', () => {
  const field = getSectionDef('collection-grid')!.fields.find((f) => f.key === 'tileStyle')!
  assert.equal(selectValue(field, 'Label over photo'), 'Label over photo')
  assert.equal(selectValue(field, undefined), 'Label below', 'unset')
  assert.equal(selectValue(field, 'Photo'), 'Label below', 'an older theme’s value')
  assert.equal(selectValue({ options: ['A', 'B'] }, 'C'), 'C', 'a select without a default shows what it holds')
  assert.equal(selectValue({ options: ['A', 'B'] }, undefined), '')

  // Every default is one of its options.
  const defs = [...sectionCatalog, ...['stat', 'logo', 'collection', 'feature', 'collapsible-row'].map((kind) => getBlockDef(kind)!)]
  for (const def of defs) {
    for (const f of def.fields.filter((f) => f.default !== undefined)) assert.ok(f.options?.includes(f.default!), `${def.kind}.${f.key}`)
  }

  // Each demo store's builder shows one of the options in every select that has a default: Northfold's and
  // Torqline's sections leave the part 5 settings unset (and keep an old tile style), and read what they draw.
  const all = { parts: true, sizes: true, specs: true }
  const shown: Record<string, Record<string, string>> = {}
  for (const blueprint of DEMO_STORES) {
    const { theme } = snapshotFor(blueprint.homeChannel, blueprint.id, '2026-11-20')
    if (theme.styles.drawing !== 'sections') continue
    for (const [template, sections] of Object.entries(theme.templates)) {
      for (const section of sections) {
        for (const f of fieldsFor(getSectionDef(section.kind)?.fields ?? [], 'sections', template as 'home', all)) {
          if (f.default === undefined) continue
          const value = selectValue(f, section.settings[f.key])
          assert.ok(f.options!.includes(value), `${blueprint.id} ${template} ${section.kind}.${f.key} shows ${value}`)
          ;(shown[blueprint.id] ??= {})[`${template} ${section.kind}.${f.key}`] = value
        }
      }
    }
  }
  assert.deepEqual(
    Object.fromEntries(Object.entries(shown.northfold!).filter(([key]) => key.startsWith('home '))),
    {
      'home featured-products.layout': 'Grid',
      'home collection-grid.layout': 'Grid',
      'home collection-grid.tileStyle': 'Label below',
      'home collection-grid.background': 'Page',
      'home image-banner.contentPosition': 'Bottom',
      'home icon-row.alignment': 'Center',
      'home icon-row.tileStyle': 'Plain',
      'home footer.layout': 'Standard',
    },
  )
  assert.equal(shown.lumos!['home image-banner.contentPosition'], 'Center left')
  assert.equal(shown.lumos!['collection collection-grid.cardStyle'], 'Boxed')
  // Aurora's hero, footer and cards read as what they draw.
  assert.equal(shown.aurora!['home image-banner.contentPosition'], 'Middle left')
  assert.equal(shown.aurora!['home footer.layout'], 'Menus and newsletter')
  assert.equal(shown.aurora!['collection collection-grid.cardStyle'], 'Framed')
  // Every page wears the same footer.
  for (const template of ['home', 'product', 'collection', 'cart']) assert.equal(shown.aurora![`${template} footer.layout`], 'Menus and newsletter', template)
})
