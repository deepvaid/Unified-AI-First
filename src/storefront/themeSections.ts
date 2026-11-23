// Store theme sections and styles: the section and block catalogues (schema-driven
// settings per section kind), the section factories shared by the theme seeds and the
// builder's add-section picker, and the theme's styles as the storefront's CSS
// variables. Pure, so the demo store blueprints (src/storefront/demoStores/) and
// Node tests can use it. src/stores/themeBuilderData.ts re-exports all of it and adds
// the token-based defaultThemeStyles.

export interface ThemeSectionField {
  key: string
  label: string
  /** 'collection': one of the store's collections (its handle), or 'all'. */
  type: 'text' | 'textarea' | 'select' | 'color' | 'toggle' | 'slider' | 'collection'
  options?: string[]
  /** What the builder shows for a select's options, when that differs from the stored value ("truck" → "Truck"). */
  optionLabels?: Record<string, string>
  min?: number
  max?: number
  /** Read by the sections drawing only: the builder offers it on a theme drawn that way (ThemeStyles.drawing). */
  drawing?: 'sections'
  /** The templates the field means something on (a collection grid's filters, on the collection page). Every template when absent. */
  templates?: TemplateType[]
}

export interface ThemeSectionVariant {
  id: string
  label: string
  description?: string
  preset: Record<string, string | number | boolean>
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
  unique?: boolean
  /** A kind only the sections drawing draws: the builder offers it on a theme drawn that way. */
  drawing?: 'sections'
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
}

export interface ThemeSection {
  id: string
  kind: string
  label: string
  settings: Record<string, string | number | boolean>
  blocks?: ThemeBlock[]
  hidden?: boolean
}

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
export const themeFonts = ['Inter', 'Figtree', 'Inconsolata', 'Georgia', 'Space Grotesk', 'DM Sans', 'Instrument Serif', 'system-ui']

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
  return vars
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
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'collection', label: 'Collection', type: 'collection', drawing: 'sections' },
      { key: 'productCount', label: 'Products', type: 'slider', min: 2, max: 8 },
      { key: 'layout', label: 'Layout', type: 'select', options: ['Grid', 'Carousel'] },
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
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4 },
      { key: 'tileRatio', label: 'Tile shape', type: 'select', options: ['Portrait', 'Square', 'Landscape'], drawing: 'sections', templates: ['home'] },
      { key: 'filters', label: 'Filters', type: 'toggle', drawing: 'sections', templates: ['collection'] },
      { key: 'sort', label: 'Sort', type: 'toggle', drawing: 'sections', templates: ['collection'] },
      { key: 'quickAdd', label: 'Quick add on product cards', type: 'toggle', drawing: 'sections', templates: ['collection'] },
    ],
  },
  {
    kind: 'image-banner',
    title: 'Image banner',
    icon: 'images',
    description: 'Editorial image break with an optional headline.',
    category: 'Media',
    acceptsBlocks: true,
    variants: [
      { id: 'container-cta', label: 'With container & CTA', preset: { height: 'Medium' } },
      { id: 'full-cta', label: 'Full-width with CTA', preset: { height: 'Large' } },
    ],
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'text' },
      { key: 'height', label: 'Height', type: 'select', options: ['Small', 'Medium', 'Large'] },
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
      { key: 'sizeGuide', label: 'Size guide link', type: 'toggle', drawing: 'sections' },
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
    fields: [{ key: 'title', label: 'Heading', type: 'text' }],
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
}

/** Blocks a new section of the kind starts with, so it shows something as soon as it is added. */
const sectionStarterBlocks: Record<string, () => ThemeBlock[]> = {
  'icon-row': () => [
    createBlock('feature', { icon: 'truck', title: 'Free shipping', text: 'Say what you deliver, where, and how fast.' }),
    createBlock('feature', { icon: 'rotate-ccw', title: 'Easy returns', text: 'Say how long shoppers have to send something back.' }),
    createBlock('feature', { icon: 'headphones', title: 'Here to help', text: 'Say how shoppers can reach you.' }),
  ],
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
}

/** Where a collapsible row's body comes from. */
export const COLLAPSIBLE_SOURCES: Readonly<Record<string, string>> = {
  description: 'Product description',
  fit: 'Fit note and size guide',
  'fabric-care': 'Material and care',
  'delivery-returns': 'Delivery and returns (the text below)',
  custom: 'The text below',
}
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
      { key: 'source', label: 'Content', type: 'select', options: Object.keys(COLLAPSIBLE_SOURCES), optionLabels: COLLAPSIBLE_SOURCES },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'open', label: 'Open when the page loads', type: 'toggle' },
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
}

export function getBlockDef(kind: string): ThemeBlockDef | undefined {
  return blockCatalog.find((def) => def.kind === kind)
}

// ── What the builder offers a theme ─────────────────────────────────────────
// A classic theme is offered exactly what it always was; a theme on the sections
// drawing also gets the kinds, blocks and fields only that drawing draws.

type Drawing = ThemeStyles['drawing']

const forDrawing = (drawing: Drawing) => (def: { drawing?: 'sections' }) => !def.drawing || def.drawing === drawing

/** The section kinds the Add section picker offers a theme. */
export function sectionsFor(drawing: Drawing): ThemeSectionDef[] {
  return sectionCatalog.filter(forDrawing(drawing))
}

/** Blocks some section kind holds as its own (a feature, a collapsible row): never offered elsewhere. */
const OWN_BLOCKS = new Set(sectionCatalog.flatMap((def) => def.blocks ?? []))

/**
 * The blocks a section of the kind can take on a theme: its own blocks when it has
 * them, else the general blocks when it accepts blocks, else none.
 */
export function blocksFor(kind: string, drawing: Drawing): ThemeBlockDef[] {
  const def = getSectionDef(kind)
  if (!def?.acceptsBlocks) return []
  const usable = blockCatalog.filter(forDrawing(drawing))
  return def.blocks ? usable.filter((block) => def.blocks!.includes(block.kind)) : usable.filter((block) => !OWN_BLOCKS.has(block.kind))
}

/** The settings the builder shows for a section or block, on a theme and template. */
export function fieldsFor(fields: readonly ThemeSectionField[], drawing: Drawing, template: TemplateType): ThemeSectionField[] {
  return fields.filter((field) => forDrawing(drawing)(field) && (!field.templates || field.templates.includes(template)))
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
