// Store theme sections and styles: the section and block catalogues (schema-driven
// settings per section kind), the section factories shared by the theme seeds and the
// builder's add-section picker, and the theme's styles as the storefront's CSS
// variables. Pure, so the demo store blueprints (src/storefront/demoStores/) and
// Node tests can use it. src/stores/themeBuilderData.ts re-exports all of it and adds
// the token-based defaultThemeStyles.

import { sellsParts } from './fitment.ts'
import type { FitmentProduct } from './fitment.ts'

/**
 * What a store sells, for the settings only some stores can use: parts with vehicle
 * fitment (a vehicle finder, the fit banner), sized products (a size guide), products
 * with specifications (a specifications or warranty row). The builder offers a kind,
 * field or option that `requires` one only to a store that has it.
 */
export interface StoreFacts {
  /** It sells parts with vehicle fitment (`sellsParts`). */
  parts: boolean
  /** It sells sized products: it has size charts, or a product links one. */
  sizes: boolean
  /** Its products carry specifications or a warranty (a part's, a sofa's dimensions and materials). */
  specs: boolean
}

export type StoreNeed = keyof StoreFacts

/** A store that sells none of these: what the builder assumes when it is told nothing. */
const NO_FACTS: StoreFacts = { parts: false, sizes: false, specs: false }

/** What a store sells, from its own products and size charts. */
export function storeFacts(
  products: readonly (FitmentProduct & { detail?: { sizeChartId?: string; specs?: readonly unknown[]; warranty?: string } })[],
  sizeCharts: readonly unknown[],
): StoreFacts {
  return {
    parts: sellsParts(products),
    sizes: sizeCharts.length > 0 || products.some((product) => !!product.detail?.sizeChartId),
    specs: products.some((product) => (product.detail?.specs?.length ?? 0) > 0 || !!product.detail?.warranty?.trim()),
  }
}

/**
 * A heading split where its accent words fall, so those words can be drawn in the
 * accent colour ("Discover your perfect place" with "perfect place"). The words are
 * matched as one phrase, ignoring case and runs of spaces, and only as whole words
 * ("room" is not the end of "Bedroom"); without them, or when the heading does not
 * hold them, the heading is one plain part.
 */
export function accentParts(text: string, accent?: string): { text: string; accent: boolean }[] {
  if (!text) return []
  const words = (accent ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return [{ text, accent: false }]
  const body = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
  const phrase = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'giu')
  const parts: { text: string; accent: boolean }[] = []
  let from = 0
  for (const match of text.matchAll(phrase)) {
    if (match.index > from) parts.push({ text: text.slice(from, match.index), accent: false })
    parts.push({ text: match[0], accent: true })
    from = match.index + match[0].length
  }
  if (from < text.length) parts.push({ text: text.slice(from), accent: false })
  return parts
}

export interface ThemeSectionField {
  key: string
  label: string
  /** 'collection': one of the store's collections (its handle), or 'all'. */
  type: 'text' | 'textarea' | 'select' | 'color' | 'toggle' | 'slider' | 'collection'
  options?: string[]
  /** What the builder shows for a select's options, when that differs from the stored value ("truck" → "Truck"). */
  optionLabels?: Record<string, string>
  /** Option names for a store that sells this, over `optionLabels` (a parts store's "Part specifications"). */
  optionLabelsFor?: Partial<Record<StoreNeed, Record<string, string>>>
  /**
   * The option the storefront draws while a select is unset, or holds a value that is
   * not one of its options (an older theme's): the builder shows it (`selectValue`).
   */
  default?: string
  min?: number
  max?: number
  /** Read by the sections drawing only: the builder offers it on a theme drawn that way (ThemeStyles.drawing). */
  drawing?: 'sections'
  /** The templates the field means something on (a collection grid's filters, on the collection page). Every template when absent. */
  templates?: TemplateType[]
  /** Offered only to a store that sells this (a vehicle setting to a parts store, a size guide to a store with sizes). */
  requires?: StoreNeed
  /** Options of a select offered only to a store that sells this ("Vehicle compatibility table" to a parts store). */
  optionRequires?: Readonly<Record<string, StoreNeed>>
  /** Not shown while another setting has one of these values (a row's text, while its content comes from the part). */
  hideWhen?: { key: string; values: readonly string[] }
}

export interface ThemeSectionVariant {
  id: string
  label: string
  description?: string
  preset: Record<string, string | number | boolean>
  /** A layout only the sections drawing draws (a carousel of collection tiles): offered on a theme drawn that way. */
  drawing?: 'sections'
  /** The templates the layout is offered on, where its settings can be changed back (words on the left, on the home page). Every template when absent. */
  templates?: TemplateType[]
}

export interface ThemeSectionDef {
  kind: string
  title: string
  icon: string
  description: string
  category: string
  fields: ThemeSectionField[]
  variants?: ThemeSectionVariant[]
  acceptsBlocks?: boolean
  /**
   * The blocks a section of this kind holds, when it has blocks of its own (an icon
   * row's features, a product page's collapsible rows): it takes those and no others.
   * Without it, a block-accepting section takes the general blocks.
   */
  blocks?: string[]
  /**
   * With `blocks`: the section also takes the general blocks (an image banner's own
   * stats beside its buttons). Without it, a section with blocks of its own takes those only.
   */
  generalBlocks?: boolean
  unique?: boolean
  /** A kind only the sections drawing draws: the builder offers it on a theme drawn that way. */
  drawing?: 'sections'
  /** Offered only to a store that sells this (the vehicle finder, to a parts store). */
  requires?: StoreNeed
  /** The templates a kind is drawn on (a logo strip, on the home page). Every template when absent. */
  templates?: TemplateType[]
}

/** A block nested inside a block-accepting section. */
export interface ThemeBlock {
  id: string
  kind: string
  settings: Record<string, string | number | boolean>
}

export interface ThemeBlockDef {
  kind: string
  title: string
  icon: string
  fields: ThemeSectionField[]
  /** A block only the sections drawing draws. */
  drawing?: 'sections'
  /** The most a section holds, as the drawing shows no more (a banner's three stats), and why, for the builder to say. */
  limit?: { max: number; reason: string }
}

export interface ThemeSection {
  id: string
  kind: string
  label: string
  settings: Record<string, string | number | boolean>
  blocks?: ThemeBlock[]
  hidden?: boolean
}

/** What the builder calls a section's background: the page's own colour, or the theme's tint as a band. */
const BACKGROUND_LABELS: Readonly<Record<string, string>> = { Page: 'Same as the page', Tint: 'Tinted band' }

/** Display/group order for the categorized Add Section picker. */
export const sectionCategories: string[] = ['Layout', 'Media', 'Featured', 'Content', 'Commerce']

export type TemplateType = 'home' | 'product' | 'collection' | 'cart'

export interface ThemeStyles {
  brandColor: string
  accentColor: string
  background: string
  textColor: string
  headingFont: string
  bodyFont: string
  cornerRadius: number
  buttonStyle: 'solid' | 'outline' | 'pill'
  /** Badge fills on product cards and galleries. Each badge's text colour follows from its fill. */
  saleBadgeColor: string
  /** The merchant's own badges ("New", "Bestseller"). */
  customBadgeColor: string
  soldOutBadgeColor: string
  /**
   * How the storefront draws the theme. 'sections': the richer drawing (header and
   * footer settings, product and collection templates, filters, quick add, the variant
   * picker), set by the Northfold and Torqline themes only. Absent: the classic
   * drawing every other theme has always had.
   */
  drawing?: 'sections'
  // The colours and type below are read by the sections drawing only, and only it
  // emits them as variables (storefrontThemeVars), so a classic theme never changes.
  /** Button fill (solid, pill) or outline colour; the brand colour when absent. */
  buttonColor?: string
  /** Quiet panels: image backgrounds, the newsletter band, sheets. */
  surfaceColor?: string
  /** Secondary text: captions, "Usual price", counts. */
  mutedColor?: string
  /** Hairlines between sections, rows and fields. */
  dividerColor?: string
  headingCase?: 'As typed' | 'Uppercase'
  // Part 5 (Lumos): finer control the sections drawing reads, each optional so the
  // themes before it look the same. Emitted by sectionsDrawingVars (--sf-* names in comments).
  /** Heading weight (--sf-heading-weight); absent: the heading font's own (THEME_FONT_META). */
  headingWeight?: number
  /** Card and tile fill (--sf-card); absent: the page background. */
  cardColor?: string
  /** Card and tile corners in px (--sf-card-radius); absent: cornerRadius. */
  cardRadius?: number
  /** A soft shadow under cards (--sf-card-shadow). Absent: 'None'. */
  cardShadow?: 'None' | 'Soft'
  /** Solid button border (--sf-button-border); absent: the button colour. */
  buttonBorderColor?: string
  /** Solid button fill on hover (--sf-button-hover); absent: the button colour darkened. */
  buttonHoverColor?: string
  /** Button label case (--sf-button-case). Absent: 'As typed'. */
  buttonCase?: 'As typed' | 'Uppercase'
  /** The tint behind sections set to background "Tint" (--sf-tint); absent: surfaceColor. */
  tintColor?: string
  /** Page content width in px (--sf-measure); absent: 1200. */
  measure?: number
  /** Side padding on desktop in px (--sf-gutter); phones keep 16. Absent: 24. */
  gutter?: number
  /** Hero headline size on desktop in px (--sf-hero-title); phones get three quarters. */
  heroTitleSize?: number
  /** Section title size on desktop in px (--sf-section-title); phones get three quarters. Absent: 44. */
  sectionTitleSize?: number
  /** The theme styles its form controls (44px fields, 20px checks in the accent); this is their border, at least 3:1 on the page. Absent: the controls look as they always did. */
  controlBorderColor?: string
}

export interface StoreTheme {
  id: string
  channelId: string
  name: string
  status: 'Draft' | 'Published'
  publishedAt?: string
  updatedAt: string
  /** Who made the theme — "Maropost" for library themes. */
  createdBy?: string
  /** A newer library version the merchant can update to. */
  availableVersion?: string
  styles: ThemeStyles
  templates: Record<TemplateType, ThemeSection[]>
}

export const TEMPLATE_TYPES: TemplateType[] = ['home', 'product', 'collection', 'cart']

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  home: 'Home',
  product: 'Product',
  collection: 'Collection',
  cart: 'Cart',
}

/** Fonts offered by the theme styles panel. */
export const themeFonts = ['Inter', 'Figtree', 'Inconsolata', 'Georgia', 'Space Grotesk', 'DM Sans', 'Instrument Serif', 'Barlow', 'Barlow Condensed', 'system-ui']

/**
 * How the sections drawing sets a font: its fallbacks, and the weight headings take
 * (a display face with one weight is never made bold by the browser). A font missing
 * here falls back to a sans stack and weight 700.
 */
export const THEME_FONT_META: Readonly<Record<string, { fallback: string; headingWeight: number }>> = {
  Inter: { fallback: 'system-ui, sans-serif', headingWeight: 700 },
  Figtree: { fallback: 'system-ui, sans-serif', headingWeight: 700 },
  Inconsolata: { fallback: 'ui-monospace, monospace', headingWeight: 600 },
  Georgia: { fallback: "'Times New Roman', serif", headingWeight: 700 },
  'Space Grotesk': { fallback: 'system-ui, sans-serif', headingWeight: 600 },
  'DM Sans': { fallback: 'system-ui, sans-serif', headingWeight: 600 },
  'Instrument Serif': { fallback: 'Georgia, serif', headingWeight: 400 },
  Barlow: { fallback: 'system-ui, sans-serif', headingWeight: 600 },
  'Barlow Condensed': { fallback: "'Arial Narrow', sans-serif", headingWeight: 700 },
  'system-ui': { fallback: 'sans-serif', headingWeight: 700 },
}

/** A font as a CSS font-family list: the face, quoted, then its fallbacks. */
function fontStack(font: string): string {
  const fallback = THEME_FONT_META[font]?.fallback ?? 'system-ui, sans-serif'
  return font === 'system-ui' ? `system-ui, ${fallback}` : `"${font}", ${fallback}`
}

/** Relative luminance of a #rgb / #rrggbb colour, or null for anything else. */
function hexLuminance(color: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return null
  const hex = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/**
 * Ink for text on the store's brand colour: near-black or white, whichever
 * contrasts more. The store's own colour decides it, so the admin theme can never
 * reach inside the preview (WCAG 1.4.3 — W-19: dark admin's --accent-on put
 * #06212c on a #373842 brand, 1.43:1).
 */
export function onBrandColor(brand: string): string | null {
  const l = hexLuminance(brand)
  if (l === null) return null
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#121011' : '#ffffff'
}

/** `a` mixed into `b`: amount 0 is b, 1 is a. Both #rrggbb or #rgb; null for anything else. */
function mixHex(a: string, b: string, amount: number): string | null {
  const rgb = (color: string) => {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
    if (!m) return null
    const hex = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!
    return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  }
  const [x, y] = [rgb(a), rgb(b)]
  if (!x || !y) return null
  return `#${x.map((v, i) => Math.round(v * amount + y[i]! * (1 - amount)).toString(16).padStart(2, '0')).join('')}`
}

/**
 * The variables only the sections drawing reads: the button, the quiet surfaces,
 * and headings as the font table sets them. A colour the theme does not set comes
 * from its text and background.
 */
function sectionsDrawingVars(styles: Partial<ThemeStyles>): Record<string, string> {
  const vars: Record<string, string> = {}
  const button = styles.buttonColor || styles.brandColor
  if (button) {
    const outline = styles.buttonStyle === 'outline'
    vars['--sf-button-bg'] = outline ? 'transparent' : button
    const ink = outline ? button : onBrandColor(button)
    if (ink) vars['--sf-button-ink'] = ink
    vars['--sf-button-border'] = button
  }
  if (styles.buttonStyle === 'pill') vars['--sf-button-radius'] = '999px'
  else if (styles.cornerRadius !== undefined) vars['--sf-button-radius'] = `${styles.cornerRadius}px`
  const derived = (amount: number) => (styles.textColor && styles.background ? mixHex(styles.textColor, styles.background, amount) : null)
  const surface = styles.surfaceColor || derived(0.04)
  const muted = styles.mutedColor || derived(0.66)
  const divider = styles.dividerColor || derived(0.11)
  if (surface) vars['--sf-surface'] = surface
  if (muted) vars['--sf-muted'] = muted
  if (divider) vars['--sf-divider'] = divider
  if (styles.headingFont) {
    vars['--sf-heading-font'] = fontStack(styles.headingFont)
    vars['--sf-heading-weight'] = String(THEME_FONT_META[styles.headingFont]?.headingWeight ?? 700)
  }
  if (styles.bodyFont) vars['--sf-body-font'] = fontStack(styles.bodyFont)
  vars['--sf-heading-case'] = styles.headingCase === 'Uppercase' ? 'uppercase' : 'none'
  const focus = focusColor(styles)
  if (focus) vars['--sf-focus'] = focus
  return { ...vars, ...finerVars(styles) }
}

/** Figma's shadow.small, under a card on a theme whose cards have a soft shadow. */
const SOFT_CARD_SHADOW = '0 4px 6px -4px rgba(0,0,0,.10)'

/**
 * The finer styles (Lumos): each becomes a variable only when the theme sets it, so a
 * theme without them gets exactly the variables it always had, and the storefront's
 * own fallbacks apply. A heading weight or a button border replaces the one the font
 * and the button colour would give.
 *
 * The gutter is the side padding at 1400px and wider; it narrows with the window to
 * 16px on a phone (Figma: 56 on desktop, 16 on a phone), so it stays one variable every
 * page reads. The measure is the content width: `--sf-measure` is what the storefront
 * has always read as the box the content and both gutters sit in, so it is the content
 * width plus the two desktop gutters. Title sizes are the desktop ones; `-sm` is three
 * quarters of each, for phones.
 */
function finerVars(styles: Partial<ThemeStyles>): Record<string, string> {
  const vars: Record<string, string> = {}
  if (styles.headingWeight !== undefined) vars['--sf-heading-weight'] = String(styles.headingWeight)
  if (styles.buttonBorderColor) vars['--sf-button-border'] = styles.buttonBorderColor
  if (styles.buttonHoverColor) vars['--sf-button-hover'] = styles.buttonHoverColor
  if (styles.buttonCase) vars['--sf-button-case'] = styles.buttonCase === 'Uppercase' ? 'uppercase' : 'none'
  if (styles.cardColor) vars['--sf-card'] = styles.cardColor
  if (styles.cardRadius !== undefined) vars['--sf-card-radius'] = `${styles.cardRadius}px`
  if (styles.cardShadow) vars['--sf-card-shadow'] = styles.cardShadow === 'Soft' ? SOFT_CARD_SHADOW : 'none'
  if (styles.tintColor) vars['--sf-tint'] = styles.tintColor
  if (styles.gutter !== undefined) {
    const gutter = Math.max(0, styles.gutter)
    vars['--sf-gutter'] = `clamp(${Math.min(16, gutter)}px, ${Number((gutter / 14).toFixed(2))}vw, ${gutter}px)`
  }
  if (styles.measure !== undefined) vars['--sf-measure'] = `${styles.measure + 2 * Math.max(0, styles.gutter ?? 24)}px`
  const titles = { 'hero-title': styles.heroTitleSize, 'section-title': styles.sectionTitleSize }
  for (const [name, size] of Object.entries(titles)) {
    if (size === undefined) continue
    vars[`--sf-${name}`] = `${size}px`
    vars[`--sf-${name}-sm`] = `${Math.round(size * 0.75)}px`
  }
  return vars
}

/**
 * The keyboard focus ring on the page: the accent when it stands out from the
 * background (3:1, WCAG 1.4.11), else the text colour. Torqline's safety yellow is
 * 1.6:1 on white, so its rings are charcoal. A dark header or footer sets its own.
 */
function focusColor(styles: Partial<ThemeStyles>): string | null {
  const { accentColor: accent, background, textColor } = styles
  if (!accent || !background) return accent || textColor || null
  const [a, b] = [hexLuminance(accent), hexLuminance(background)]
  if (a === null || b === null) return accent
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  return ratio >= 3 || !textColor ? accent : textColor
}

/**
 * A theme's styles as the storefront's CSS custom properties (--sf-*). Missing
 * values are left out, so the storefront's own fallbacks apply. A theme on the
 * sections drawing also gets its button, surface, muted and divider colours, heading
 * weight and case, and its fonts with their fallbacks; a classic theme's variables
 * are exactly what they have always been (tests/storefront/themeVars.test.ts).
 */
export function storefrontThemeVars(styles?: Partial<ThemeStyles> | null): Record<string, string> {
  if (!styles) return {}
  const vars: Record<string, string> = {}
  if (styles.brandColor) {
    vars['--sf-brand'] = styles.brandColor
    const onBrand = onBrandColor(styles.brandColor)
    if (onBrand) vars['--sf-on-brand'] = onBrand
  }
  if (styles.accentColor) vars['--sf-accent'] = styles.accentColor
  if (styles.background) vars['--sf-bg'] = styles.background
  if (styles.textColor) vars['--sf-text'] = styles.textColor
  if (styles.cornerRadius !== undefined) vars['--sf-radius'] = `${styles.cornerRadius}px`
  if (styles.headingFont) vars['--sf-heading-font'] = styles.headingFont
  if (styles.bodyFont) vars['--sf-body-font'] = styles.bodyFont
  const badges = { sale: styles.saleBadgeColor, custom: styles.customBadgeColor, 'sold-out': styles.soldOutBadgeColor }
  for (const [name, fill] of Object.entries(badges)) {
    if (!fill) continue
    vars[`--sf-badge-${name}`] = fill
    const ink = onBrandColor(fill)
    if (ink) vars[`--sf-on-badge-${name}`] = ink
  }
  return styles.drawing === 'sections' ? { ...vars, ...sectionsDrawingVars(styles) } : vars
}

// ── Section catalog ──────────────────────────────────────────────────────────

export const sectionCatalog: ThemeSectionDef[] = [
  {
    kind: 'announcement-bar',
    title: 'Announcement bar',
    icon: 'megaphone',
    description: 'Slim strip above the header for promos and shipping notices.',
    category: 'Layout',
    fields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'link', label: 'Link label', type: 'text' },
    ],
  },
  {
    kind: 'header',
    title: 'Header',
    icon: 'panel-top',
    description: 'Store logo, navigation menu, and cart.',
    category: 'Layout',
    unique: true,
    fields: [
      { key: 'menuStyle', label: 'Menu style', type: 'select', options: ['Inline', 'Centered', 'Minimal'] },
      { key: 'sticky', label: 'Sticky on scroll', type: 'toggle' },
      { key: 'colorScheme', label: 'Color scheme', type: 'select', options: ['Light', 'Dark'], drawing: 'sections' },
    ],
  },
  {
    kind: 'hero',
    title: 'Hero',
    icon: 'image',
    description: 'Full-width banner with headline and call to action.',
    category: 'Media',
    acceptsBlocks: true,
    variants: [
      { id: 'full-bleed', label: 'Full-bleed', preset: { alignment: 'Left', overlay: 15 } },
      { id: 'split', label: 'Split with image', preset: { alignment: 'Left', overlay: 0 } },
      { id: 'minimal', label: 'Minimal', preset: { alignment: 'Center', overlay: 0 } },
    ],
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'text' },
      { key: 'ctaLabel', label: 'Button label', type: 'text' },
      { key: 'ctaLink', label: 'Button link', type: 'text', drawing: 'sections' },
      { key: 'alignment', label: 'Alignment', type: 'select', options: ['Left', 'Center'] },
      { key: 'overlay', label: 'Overlay strength', type: 'slider', min: 0, max: 60 },
    ],
  },
  {
    kind: 'featured-products',
    title: 'Featured products',
    icon: 'shopping-bag',
    description: 'Curated product cards from a collection.',
    category: 'Featured',
    acceptsBlocks: true,
    variants: [
      { id: 'grid', label: 'Grid', preset: { layout: 'Grid' } },
      { id: 'carousel', label: 'Carousel', preset: { layout: 'Carousel' } },
    ],
    fields: [
      // A short line in the accent colour above the title ("Recommendations"), on the home page.
      { key: 'eyebrow', label: 'Line above the title', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'accentWords', label: 'Title words in the accent color', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'collection', label: 'Collection', type: 'collection', drawing: 'sections' },
      { key: 'productCount', label: 'Products', type: 'slider', min: 2, max: 8 },
      { key: 'layout', label: 'Layout', type: 'select', options: ['Grid', 'Carousel'], default: 'Grid' },
      // An auto-parts store: with the shopper's vehicle chosen, the parts that fit it ("Popular parts for your 2019 Ford F-150").
      { key: 'vehicle', label: 'Parts for the shopper’s vehicle', type: 'toggle', drawing: 'sections', templates: ['home'], requires: 'parts' },
    ],
  },
  {
    kind: 'collection-grid',
    title: 'Collection grid',
    icon: 'layout-grid',
    description: 'Tiles linking to product collections.',
    category: 'Featured',
    acceptsBlocks: true,
    variants: [
      { id: 'two', label: '2-up', preset: { columns: 2 } },
      { id: 'three', label: '3-up', preset: { columns: 3 } },
      { id: 'four', label: '4-up', preset: { columns: 4 } },
      // A looping row of tiles with dots: the columns are the tiles in view (one on a phone).
      { id: 'carousel', label: 'Carousel', description: 'A row that loops, with dots', preset: { columns: 3, layout: 'Carousel', tileStyle: 'Label over photo' }, drawing: 'sections' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'accentWords', label: 'Title words in the accent color', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4 },
      { key: 'tileRatio', label: 'Tile shape', type: 'select', options: ['Portrait', 'Square', 'Landscape'], drawing: 'sections', templates: ['home'] },
      // Grid: every tile, in rows. Carousel: as many tiles as the columns in view, looping, with a dot per tile.
      { key: 'layout', label: 'Layout', type: 'select', options: ['Grid', 'Carousel'], default: 'Grid', drawing: 'sections', templates: ['home'] },
      { key: 'tileStyle', label: 'Tile name', type: 'select', options: ['Label below', 'Label over photo'], optionLabels: { 'Label below': 'Under the photo', 'Label over photo': 'On the photo' }, default: 'Label below', drawing: 'sections', templates: ['home'] },
      { key: 'background', label: 'Background', type: 'select', options: ['Page', 'Tint'], optionLabels: BACKGROUND_LABELS, default: 'Page', drawing: 'sections', templates: ['home'] },
      { key: 'filters', label: 'Filters', type: 'toggle', drawing: 'sections', templates: ['collection'] },
      { key: 'sort', label: 'Sort', type: 'toggle', drawing: 'sections', templates: ['collection'] },
      { key: 'quickAdd', label: 'Quick add on product cards', type: 'toggle', drawing: 'sections', templates: ['collection'] },
      // Editorial (a tall photo, name and price), Dense (a part: square photo, part number, fit, stock and Add to cart)
      // or Boxed (a framed card: photo, name, price and a full-width Add to cart).
      { key: 'cardStyle', label: 'Product card', type: 'select', options: ['Editorial', 'Dense', 'Boxed'], default: 'Editorial', drawing: 'sections', templates: ['collection'] },
    ],
  },
  {
    kind: 'image-banner',
    title: 'Image banner',
    icon: 'images',
    description: 'Editorial image break with an optional headline.',
    category: 'Media',
    acceptsBlocks: true,
    // Its buttons are general `button` blocks; on the sections drawing it also takes `stat` blocks (a strip over the photo).
    blocks: ['stat'],
    generalBlocks: true,
    variants: [
      { id: 'container-cta', label: 'With container & CTA', preset: { height: 'Medium' } },
      { id: 'full-cta', label: 'Full-width with CTA', preset: { height: 'Large' } },
      // On the home page only, where its Text position can be set back.
      { id: 'words-left', label: 'Words on the left', description: 'Text beside a bright photo, with room for stats', preset: { height: 'Large', contentPosition: 'Center left' }, drawing: 'sections', templates: ['home'] },
    ],
    fields: [
      // A pill above the headline ("New arrivals").
      { key: 'badge', label: 'Badge above the headline', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'accentWords', label: 'Headline words in the accent color', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'subheadline', label: 'Subheadline', type: 'text' },
      { key: 'height', label: 'Height', type: 'select', options: ['Small', 'Medium', 'Large'] },
      // Bottom: white words at the foot of the photo, over a dark shade. Center left: the page's own colours beside the photo.
      { key: 'contentPosition', label: 'Text position', type: 'select', options: ['Bottom', 'Center left'], default: 'Bottom', drawing: 'sections', templates: ['home'] },
    ],
  },
  {
    // A photograph beside a short story with one button. The photograph is the section's `image`
    // setting (a path under /public); choosing one in the builder comes with slice S3.
    kind: 'image-with-text',
    title: 'Image with text',
    icon: 'panel-left',
    description: 'A photograph beside a heading, a paragraph and a button.',
    category: 'Media',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
      { key: 'buttonLink', label: 'Button link', type: 'text' },
      { key: 'imageSide', label: 'Image side', type: 'select', options: ['Left', 'Right'] },
    ],
  },
  {
    kind: 'rich-text',
    title: 'Rich text',
    icon: 'text',
    description: 'Heading and paragraph for brand storytelling.',
    category: 'Content',
    acceptsBlocks: true,
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'alignment', label: 'Alignment', type: 'select', options: ['Left', 'Center'] },
    ],
  },
  {
    kind: 'testimonials',
    title: 'Testimonials',
    icon: 'quote',
    description: 'Customer quotes for social proof.',
    category: 'Content',
    variants: [
      { id: 'cards', label: 'Cards', preset: { count: 3 } },
      { id: 'single', label: 'Single quote', preset: { count: 1 } },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'count', label: 'Quotes', type: 'slider', min: 1, max: 4 },
    ],
  },
  {
    kind: 'newsletter',
    title: 'Newsletter',
    icon: 'mail',
    description: 'Email capture with headline and button.',
    category: 'Content',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
    ],
  },
  {
    kind: 'product-detail',
    title: 'Product detail',
    icon: 'package',
    description: 'Gallery, price, and buy box for the product template.',
    category: 'Commerce',
    unique: true,
    // Collapsible rows under the buy box, on the sections drawing (the block is drawn there only).
    acceptsBlocks: true,
    blocks: ['collapsible-row'],
    fields: [
      { key: 'galleryLayout', label: 'Gallery layout', type: 'select', options: ['Thumbnails', 'Stacked'] },
      { key: 'imageRatio', label: 'Image shape', type: 'select', options: ['Portrait', 'Square', 'Landscape'], drawing: 'sections' },
      { key: 'sizeGuide', label: 'Size guide link', type: 'toggle', drawing: 'sections', requires: 'sizes' },
      // An auto-parts store: whether the part fits the shopper's vehicle, under the title.
      { key: 'fitment', label: 'Vehicle fit banner', type: 'toggle', drawing: 'sections', requires: 'parts' },
      { key: 'showReviews', label: 'Show reviews', type: 'toggle' },
    ],
  },
  {
    kind: 'cart-summary',
    title: 'Cart summary',
    icon: 'shopping-cart',
    description: 'Line items, totals, and checkout for the cart template.',
    category: 'Commerce',
    unique: true,
    fields: [
      { key: 'showNotes', label: 'Order notes', type: 'toggle' },
      { key: 'upsells', label: 'Upsell suggestions', type: 'toggle' },
    ],
  },
  {
    kind: 'footer',
    title: 'Footer',
    icon: 'panel-bottom',
    description: 'Link columns, social icons, and legal.',
    category: 'Layout',
    unique: true,
    fields: [
      { key: 'showSocial', label: 'Show social icons', type: 'toggle' },
      { key: 'columns', label: 'Link columns', type: 'slider', min: 2, max: 4 },
      { key: 'colorScheme', label: 'Color scheme', type: 'select', options: ['Light', 'Dark'], drawing: 'sections' },
    ],
  },
  {
    // A row of short promises, each an icon over a title and a line (a trust strip).
    kind: 'icon-row',
    title: 'Icon row',
    icon: 'badge-check',
    description: 'Short promises with icons, such as free shipping, returns and sizing help.',
    category: 'Content',
    acceptsBlocks: true,
    blocks: ['feature'],
    drawing: 'sections',
    variants: [
      { id: 'plain', label: 'Plain', description: 'Icons between two hairlines', preset: { tileStyle: 'Plain' } },
      { id: 'cards', label: 'Cards', description: 'Each promise on its own card', preset: { tileStyle: 'Card', alignment: 'Center' } },
    ],
    fields: [
      { key: 'eyebrow', label: 'Line above the heading', type: 'text', templates: ['home'] },
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Line under the heading', type: 'text', templates: ['home'] },
      // Unset, the promises are centred (the heading keeps to the left).
      { key: 'alignment', label: 'Alignment', type: 'select', options: ['Left', 'Center'], default: 'Center', templates: ['home'] },
      // Plain: icons between two hairlines. Card: each on a card, its icon in a tinted circle.
      { key: 'tileStyle', label: 'Style', type: 'select', options: ['Plain', 'Card'], optionLabels: { Plain: 'Plain', Card: 'Cards' }, default: 'Plain', templates: ['home'] },
    ],
  },
  {
    // Brand logos in a row (six on a desktop, three to a row on a phone), each a link to that brand's products.
    // A logo's picture is its `image` setting (a path under /public), set by the theme; without one its name is drawn.
    kind: 'logo-strip',
    title: 'Logo strip',
    icon: 'gallery-horizontal',
    description: 'A row of brand logos, each a link to that brand’s products.',
    category: 'Featured',
    acceptsBlocks: true,
    blocks: ['logo'],
    drawing: 'sections',
    templates: ['home'],
    variants: [
      { id: 'page', label: 'On the page', preset: { background: 'Page' } },
      { id: 'tint', label: 'On a tinted band', preset: { background: 'Tint' } },
    ],
    fields: [
      { key: 'eyebrow', label: 'Line above the title', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'background', label: 'Background', type: 'select', options: ['Page', 'Tint'], optionLabels: BACKGROUND_LABELS, default: 'Page' },
    ],
  },
  {
    // An auto-parts store's hero: a photograph with Year, Make and Model selects, and a part-number search.
    // Its photograph is the `image` setting (a path under /public), set by the theme, like image-with-text's.
    kind: 'vehicle-finder',
    title: 'Vehicle finder',
    icon: 'car-front',
    description: 'A photo with Year, Make and Model selects, so shoppers see the parts that fit their vehicle.',
    category: 'Commerce',
    drawing: 'sections',
    requires: 'parts',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'text' },
      { key: 'partNumberSearch', label: 'Search by part number', type: 'toggle' },
    ],
  },
]

/** Default settings applied when a section of the given kind is created. */
export const sectionDefaults: Record<string, Record<string, string | number | boolean>> = {
  'announcement-bar': { text: 'Free shipping on orders over $75', link: 'Shop sale' },
  header: { menuStyle: 'Inline', sticky: true },
  hero: {
    headline: 'Fall 26 Drop 02',
    subheadline: 'Limited-run outerwear and trail-ready layers.',
    ctaLabel: 'Shop now',
    alignment: 'Left',
    overlay: 15,
  },
  'featured-products': { title: 'New arrivals', productCount: 4, layout: 'Grid' },
  'collection-grid': { title: 'Shop by collection', columns: 3 },
  'image-banner': { headline: 'The Winter Edit', height: 'Medium' },
  'image-with-text': { heading: 'Made to be used every day', body: 'Tell shoppers what makes this product worth coming back to.', buttonLabel: 'Shop now', buttonLink: '/collections/all', imageSide: 'Left' },
  'rich-text': {
    heading: 'Built for the long way home',
    body: 'Every piece is cut for movement, tested on trail, and backed for life.',
    alignment: 'Center',
  },
  testimonials: { title: 'What customers say', count: 3 },
  newsletter: { headline: 'Join the list', buttonLabel: 'Subscribe' },
  'product-detail': { galleryLayout: 'Thumbnails', showReviews: true },
  'cart-summary': { showNotes: false, upsells: true },
  footer: { showSocial: true, columns: 3 },
  'icon-row': { title: '' },
  'logo-strip': { eyebrow: '', title: 'Brands we carry', background: 'Page' },
  'vehicle-finder': {
    headline: 'Find parts that fit',
    subheadline: 'Choose your vehicle and we’ll show the parts made for it.',
    image: '',
    partNumberSearch: true,
  },
}

/** Blocks a new section of the kind starts with, so it shows something as soon as it is added. */
const sectionStarterBlocks: Record<string, () => ThemeBlock[]> = {
  'icon-row': () => [
    createBlock('feature', { icon: 'truck', title: 'Free shipping', text: 'Say what you deliver, where, and how fast.' }),
    createBlock('feature', { icon: 'rotate-ccw', title: 'Easy returns', text: 'Say how long shoppers have to send something back.' }),
    createBlock('feature', { icon: 'headphones', title: 'Here to help', text: 'Say how shoppers can reach you.' }),
  ],
  // Six names to replace, as the strip draws a logo without a picture.
  'logo-strip': () => Array.from({ length: 6 }, () => createBlock('logo', { name: 'Brand name', link: '/collections/all' })),
}

export function getSectionDef(kind: string): ThemeSectionDef | undefined {
  return sectionCatalog.find((def) => def.kind === kind)
}

let sectionIdCounter = 0

/**
 * Create a new section of the given kind with cloned default settings.
 * Pass `overrides`/`id` for deterministic seeds; generated ids otherwise.
 */
export function createSection(
  kind: string,
  overrides: Record<string, string | number | boolean> = {},
  id?: string,
): ThemeSection {
  const def = getSectionDef(kind)
  sectionIdCounter += 1
  const starter = sectionStarterBlocks[kind]
  return {
    id: id ?? `${kind}-${Date.now().toString(36)}-${sectionIdCounter}`,
    kind,
    label: def?.title ?? kind,
    // Spread clones — settings values are always flat primitives, so no
    // references are shared between sections or with the defaults map.
    settings: { ...(sectionDefaults[kind] ?? {}), ...overrides },
    ...(starter ? { blocks: starter() } : {}),
  }
}

// ── Block catalog ────────────────────────────────────────────────────────────

/** The icons an icon row's feature can show (Lucide names), with what the builder calls them. */
export const FEATURE_ICONS: Readonly<Record<string, string>> = {
  truck: 'Delivery truck',
  'rotate-ccw': 'Return arrow',
  ruler: 'Ruler',
  'badge-check': 'Check badge',
  'shield-check': 'Shield',
  leaf: 'Leaf',
  package: 'Parcel',
  'credit-card': 'Card',
  headphones: 'Headset',
  gift: 'Gift',
  clock: 'Clock',
  'map-pin': 'Map pin',
  award: 'Award ribbon',
}

/** Where a collapsible row's body comes from. */
export const COLLAPSIBLE_SOURCES: Readonly<Record<string, string>> = {
  description: 'Product description',
  fit: 'Fit note and size guide',
  'fabric-care': 'Material and care',
  specs: 'Specifications (from the product)',
  fitment: 'Vehicle compatibility table',
  warranty: 'Warranty (from the product)',
  'delivery-returns': 'Delivery and returns (the text below)',
  custom: 'The text below',
}

/** What a parts store calls a part's own rows, as it always has. */
const PART_SOURCE_LABELS: Readonly<Record<string, string>> = { specs: 'Part specifications', warranty: 'Part warranty' }

/**
 * The row contents only some stores have: the vehicle table (a parts store), the fit note
 * and size guide (a store with sizes), specifications and a warranty (a store whose
 * products carry them: a part's, a sofa's dimensions and materials).
 */
const COLLAPSIBLE_SOURCE_NEEDS: Readonly<Record<string, StoreNeed>> = { fit: 'sizes', specs: 'specs', fitment: 'parts', warranty: 'specs' }
// Blocks nest inside block-accepting sections (hero, image-banner, rich-text,
// featured-products, collection-grid). Fields reuse ThemeSectionField so the
// same schema-driven settings renderer applies to blocks.

export const blockCatalog: ThemeBlockDef[] = [
  {
    kind: 'heading',
    title: 'Heading',
    icon: 'heading',
    fields: [{ key: 'text', label: 'Text', type: 'text' }],
  },
  {
    kind: 'paragraph',
    title: 'Paragraph',
    icon: 'text',
    fields: [{ key: 'body', label: 'Body', type: 'textarea' }],
  },
  {
    kind: 'button',
    title: 'Button',
    icon: 'square-mouse-pointer',
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },
  {
    kind: 'image',
    title: 'Image',
    icon: 'image',
    fields: [
      { key: 'alt', label: 'Alt text', type: 'text' },
      { key: 'ratio', label: 'Ratio', type: 'select', options: ['16:9', '4:3', '1:1'] },
    ],
  },
  {
    // A collection card (Aurora's Featured Collections): a label over an image, linking to a collection.
    kind: 'collection',
    title: 'Collection',
    icon: 'layout-grid',
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'accent', label: 'Label words in the accent color', type: 'text', drawing: 'sections', templates: ['home'] },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },
  {
    kind: 'divider',
    title: 'Divider',
    icon: 'minus',
    fields: [],
  },
  {
    kind: 'spacer',
    title: 'Spacer',
    icon: 'move-vertical',
    fields: [{ key: 'size', label: 'Size', type: 'slider', min: 8, max: 80 }],
  },
  {
    // One promise in an icon row.
    kind: 'feature',
    title: 'Feature',
    icon: 'badge-check',
    drawing: 'sections',
    fields: [
      { key: 'icon', label: 'Icon', type: 'select', options: Object.keys(FEATURE_ICONS), optionLabels: FEATURE_ICONS },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },
  {
    // A row under the product page's buy box that opens and closes. `source` says what it holds.
    kind: 'collapsible-row',
    title: 'Collapsible row',
    icon: 'list-collapse',
    drawing: 'sections',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'source', label: 'Content', type: 'select', options: Object.keys(COLLAPSIBLE_SOURCES), optionLabels: COLLAPSIBLE_SOURCES, optionLabelsFor: { parts: PART_SOURCE_LABELS }, optionRequires: COLLAPSIBLE_SOURCE_NEEDS },
      // A product's rows come from the product, so they take no text.
      { key: 'text', label: 'Text', type: 'textarea', hideWhen: { key: 'source', values: ['specs', 'fitment', 'warranty'] } },
      { key: 'open', label: 'Open when the page loads', type: 'toggle' },
    ],
  },
  {
    // One figure in an image banner's stats strip ("12K+ homes furnished"); up to three are drawn.
    kind: 'stat',
    title: 'Stat',
    icon: 'hash',
    drawing: 'sections',
    limit: { max: 3, reason: 'Up to 3 stats fit in the strip' },
    fields: [
      { key: 'value', label: 'Figure', type: 'text' },
      { key: 'label', label: 'What it counts', type: 'text' },
    ],
  },
  {
    // One brand in a logo strip. Its picture is the `image` setting, set by the theme; the name is its text alternative.
    kind: 'logo',
    title: 'Logo',
    icon: 'image',
    drawing: 'sections',
    fields: [
      { key: 'name', label: 'Brand name', type: 'text' },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },
]

/** Default settings applied when a block of the given kind is created. */
const blockDefaults: Record<string, Record<string, string | number | boolean>> = {
  heading: { text: 'Section heading' },
  paragraph: { body: 'Add supporting copy to describe this section.' },
  button: { label: 'Shop now', link: '#' },
  image: { alt: '', ratio: '4:3' },
  collection: { label: 'Collection', link: '/collections/all' },
  divider: {},
  spacer: { size: 32 },
  feature: { icon: 'badge-check', title: 'A promise', text: 'One line that backs it up.', link: '' },
  'collapsible-row': { title: 'Details', source: 'custom', text: '', open: false },
  stat: { value: '100+', label: 'Happy customers' },
  logo: { name: 'Brand name', link: '/collections/all' },
}

export function getBlockDef(kind: string): ThemeBlockDef | undefined {
  return blockCatalog.find((def) => def.kind === kind)
}

// ── What the builder offers a theme ─────────────────────────────────────────
// A classic theme is offered exactly what it always was; a theme on the sections
// drawing also gets the kinds, blocks and fields only that drawing draws, and of
// those, what the store sells decides the rest: a parts store gets the vehicle
// finder and the fit banner, a store with sizes the size guide (`StoreFacts`).

type Drawing = ThemeStyles['drawing']

const forDrawing = (drawing: Drawing) => (def: { drawing?: 'sections' }) => !def.drawing || def.drawing === drawing
const forStore = (facts: StoreFacts) => (def: { requires?: StoreNeed }) => !def.requires || facts[def.requires]

/**
 * The section kinds the Add section picker offers a theme, on a store that sells what
 * `facts` says, for a template when one is given (a logo strip is the home page's).
 * A kind keeps only the layouts (variants) the theme's drawing draws, on the template.
 */
export function sectionsFor(drawing: Drawing, facts: StoreFacts = NO_FACTS, template?: TemplateType): ThemeSectionDef[] {
  const onTemplate = (def: { templates?: TemplateType[] }) => !template || !def.templates || def.templates.includes(template)
  return sectionCatalog
    .filter((def) => forDrawing(drawing)(def) && forStore(facts)(def) && onTemplate(def))
    .map((def) => (def.variants?.some((variant) => variant.drawing || variant.templates)
      ? { ...def, variants: def.variants.filter((variant) => forDrawing(drawing)(variant) && onTemplate(variant)) }
      : def))
}

/** Blocks some section kind holds as its own (a feature, a collapsible row): never offered elsewhere. */
const OWN_BLOCKS = new Set(sectionCatalog.flatMap((def) => def.blocks ?? []))

/**
 * The blocks a section of the kind can take on a theme: its own blocks when it has
 * them (and the general ones too when it says so: an image banner's buttons beside its
 * stats), else the general blocks when it accepts blocks, else none.
 */
export function blocksFor(kind: string, drawing: Drawing): ThemeBlockDef[] {
  const def = getSectionDef(kind)
  if (!def?.acceptsBlocks) return []
  const usable = blockCatalog.filter(forDrawing(drawing))
  const own = def.blocks ?? []
  if (own.length && !def.generalBlocks) return usable.filter((block) => own.includes(block.kind))
  return usable.filter((block) => !OWN_BLOCKS.has(block.kind) || own.includes(block.kind))
}

/**
 * Whether a section has room for another block of the kind: a banner's stats strip
 * draws three, so a fourth is not offered.
 */
export function blockHasRoom(section: Pick<ThemeSection, 'blocks'>, kind: string): boolean {
  const max = getBlockDef(kind)?.limit?.max
  return max === undefined || (section.blocks ?? []).filter((block) => block.kind === kind).length < max
}

/**
 * The settings the builder shows for a section or block, on a theme and template, on
 * a store that sells what `facts` says: a select keeps only the options the store can
 * use, under the names that store knows them by.
 */
export function fieldsFor(
  fields: readonly ThemeSectionField[],
  drawing: Drawing,
  template: TemplateType,
  facts: StoreFacts = NO_FACTS,
): ThemeSectionField[] {
  return fields
    .filter((field) => forDrawing(drawing)(field) && forStore(facts)(field) && (!field.templates || field.templates.includes(template)))
    .map((field) => {
      const options = field.options && field.optionRequires
        ? field.options.filter((option) => forStore(facts)({ requires: field.optionRequires![option] }))
        : field.options
      const labels = Object.entries(field.optionLabelsFor ?? {})
        .filter(([need]) => facts[need as StoreNeed])
        .reduce((all, [, named]) => ({ ...all, ...named }), field.optionLabels)
      return options === field.options && labels === field.optionLabels ? field : { ...field, options, optionLabels: labels }
    })
}

/**
 * The option a select shows: its value when that is one of the options, else what the
 * storefront draws without one (the field's `default`): an unset Text position reads
 * "Bottom", an older theme's tile style "Photo" reads "Under the photo".
 */
export function selectValue(field: Pick<ThemeSectionField, 'options' | 'default'>, value: unknown): string {
  const stored = value === undefined || value === null ? '' : String(value)
  return !field.default || field.options?.includes(stored) ? stored : field.default
}

/** Whether a setting shows, given the others: a row's text hides while the row's content comes from the part. */
export function fieldShown(field: ThemeSectionField, settings: Readonly<Record<string, string | number | boolean>>): boolean {
  return !field.hideWhen || !field.hideWhen.values.includes(String(settings[field.hideWhen.key] ?? ''))
}

let blockIdCounter = 0

/**
 * Create a new block of the given kind with cloned default settings.
 * Pass `overrides`/`id` for deterministic seeds; generated ids otherwise.
 * Mirrors createSection.
 */
export function createBlock(
  kind: string,
  overrides: Record<string, string | number | boolean> = {},
  id?: string,
): ThemeBlock {
  blockIdCounter += 1
  return {
    id: id ?? `${kind}-block-${Date.now().toString(36)}-${blockIdCounter}`,
    kind,
    settings: { ...(blockDefaults[kind] ?? {}), ...overrides },
  }
}
