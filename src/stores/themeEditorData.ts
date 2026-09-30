// Theme editor (store builder re-skin) — the builder's own data model, catalog and seeds.
//
// Deliberately separate from `themeBuilderData.ts`, which backs the AI-first StoreThemeBuilder.
// The re-skin mirrors the UAT builder as crawled on 2026-09-30 (docs/rebuild/theme-editor-reskin):
// ~25 page templates, sections with nested blocks (Trust Stats Bar → Stat: …), the "Add section"
// catalog with its categories and variants, and the Theme Settings groups. `toPreviewSections`
// projects this model onto the StorefrontPreview mock (which only knows the AI-first kinds).

import { createBlock, createSection, type ThemeBlock, type ThemeSection, type ThemeStyles } from './themeBuilderData'
import { TEMPLATE_NAMES, templateLabel } from './themeEditorLumosFiles'

export type ThemeEditorValue = string | number | boolean

export interface ThemeEditorBlock {
  id: string
  kind: string
  label: string
  settings: Record<string, ThemeEditorValue>
  /** Nested blocks (a Trust Stats Bar holds its Stat blocks). */
  blocks?: ThemeEditorBlock[]
}

export interface ThemeEditorSection {
  id: string
  kind: string
  label: string
  /** The catalog variant it was added as (e.g. "slider"). */
  variant?: string
  settings: Record<string, ThemeEditorValue>
  blocks: ThemeEditorBlock[]
}

export interface ThemeEditorTemplate {
  /** URL value — `template-type` query param ("home", "order_confirmation", "404"). */
  type: string
  label: string
  sections: ThemeEditorSection[]
}

export interface ThemeEditorField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'slider' | 'image' | 'richtext' | 'align' | 'link'
  options?: string[]
  min?: number
  max?: number
  step?: number
  hint?: string
}

// ── Add-section catalog ───────────────────────────────────────────────────────

/** Category filters, in the order the "All (6)" list shows them. */
export const SECTION_CATEGORIES = ['Multicolumn', 'Home', 'Content', 'General', 'Products', 'Marketing'] as const

export interface ThemeEditorVariant {
  id: string
  label: string
  description: string
  /** Settings applied when the section is added as this variant. */
  preset?: Record<string, ThemeEditorValue>
}

export interface ThemeEditorSectionDef {
  kind: string
  title: string
  /** Accordion group in the Add-section dialog ("Featured In Focus", "Text & Image", …). */
  group: string
  categories: string[]
  icon: string
  description: string
  fields: ThemeEditorField[]
  variants?: ThemeEditorVariant[]
  /** Block kinds the "Add block" menu offers. */
  blockKinds?: string[]
  /** Blocks a freshly added section starts with. */
  starterBlocks?: () => ThemeEditorBlock[]
  /** Not offered in the dialog — kinds that only seeds use (page content, product details). */
  hidden?: boolean
}

/** Every section gets these after its own fields — the UAT "Style" group. */
export const STYLE_FIELDS: ThemeEditorField[] = [
  { key: 'colorScheme', label: 'Select color schema', type: 'select', options: ['Default', 'Dark', 'Modern'] },
  { key: 'textScheme', label: 'Select text schema', type: 'select', options: ['Default', 'Compact', 'Editorial', 'Elegant', 'Technical'] },
  { key: 'buttonScheme', label: 'Select button schema', type: 'select', options: ['Default', 'Rounded', 'Square'] },
]

const ALIGNMENT: ThemeEditorField = { key: 'alignment', label: 'Content alignment', type: 'select', options: ['Left', 'Center', 'Right'] }

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export const sectionCatalog: ThemeEditorSectionDef[] = [
  {
    kind: 'hero-banner',
    title: 'Hero Banner',
    group: 'Text & Image',
    categories: ['Home', 'Marketing'],
    icon: 'image',
    description: 'Full-width banner with a heading, call-to-action buttons and a trust stats bar.',
    fields: [
      ALIGNMENT,
      { key: 'backgroundImage', label: 'Background image', type: 'image' },
      { key: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 1, step: 0.1 },
    ],
    blockKinds: ['heading-tag', 'heading', 'cta-buttons', 'trust-stats-bar'],
    starterBlocks: () => [
      block('heading-tag', 'Heading Tag', { text: 'New Arrivals', style: 'Pill' }),
      block('heading', 'Heading', { content: '<h1>Your headline here</h1><p>Supporting copy for the banner.</p>', alignment: 'left' }),
      block('cta-buttons', 'CTA Buttons', { primaryLabel: 'Shop now', primaryLink: '/collections/all', secondaryLabel: '', secondaryLink: '' }),
    ],
  },
  {
    kind: 'featured-collections',
    title: 'Featured Collections',
    group: 'Featured In Focus',
    categories: ['Home', 'Products'],
    icon: 'layout-grid',
    description: 'Collection cards in a grid or slider.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 5, step: 1 },
    ],
    variants: [
      { id: 'grid', label: 'Featured Collections Grid', description: 'Featured collections in a grid layout. Add collection card blocks inside the featured collections block.', preset: { columns: 3 } },
      { id: 'slider', label: 'Featured Collections Slider', description: 'Featured collections in a slider layout. Add collection card blocks inside the featured collections block.', preset: { columns: 4 } },
    ],
    blockKinds: ['collection-card'],
    starterBlocks: () => [
      block('collection-card', 'Collection Card', { title: 'New collection', link: '/collections/all' }),
      block('collection-card', 'Collection Card', { title: 'Best sellers', link: '/collections/best-sellers' }),
      block('collection-card', 'Collection Card', { title: 'Sale', link: '/collections/sale' }),
    ],
  },
  {
    kind: 'featured-recommendations',
    title: 'Featured Product Recommendations',
    group: 'Featured In Focus',
    categories: ['Home', 'Products'],
    icon: 'shopping-bag',
    description: 'Products picked by the recommendation engine.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'productCount', label: 'Products', type: 'slider', min: 2, max: 8, step: 1 },
      { key: 'layout', label: 'Layout', type: 'select', options: ['Grid', 'Carousel'] },
    ],
    variants: [
      { id: 'grid', label: 'Recommendations Grid', description: 'Recommended products in a grid layout.', preset: { layout: 'Grid' } },
      { id: 'carousel', label: 'Recommendations Carousel', description: 'Recommended products in a horizontal carousel.', preset: { layout: 'Carousel' } },
    ],
  },
  {
    kind: 'image-banner',
    title: 'Image Banner',
    group: 'Text & Image',
    categories: ['Home', 'Content', 'Marketing'],
    icon: 'panel-top',
    description: 'A single image with an optional headline and call to action.',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'height', label: 'Height', type: 'select', options: ['Small', 'Medium', 'Large'] },
      { key: 'backgroundImage', label: 'Image', type: 'image' },
    ],
    variants: [
      { id: 'standard', label: 'Image Banner', description: 'An image banner with a headline.', preset: { height: 'Medium' } },
      { id: 'with-cta', label: 'Image Banner with CTA', description: 'An image banner with a headline and a button.', preset: { height: 'Large', ctaLabel: 'Shop now' } },
    ],
  },
  {
    kind: 'categories',
    title: 'Category Grid',
    group: 'Products',
    categories: ['Home', 'Products'],
    icon: 'layout-dashboard',
    description: 'Category cards linking into the catalog.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 5, step: 1 },
    ],
    blockKinds: ['category-card'],
    starterBlocks: () => [block('category-card', 'Category Card', { title: 'Category', link: '/collections/all' })],
  },
  {
    kind: 'brands',
    title: 'Brands',
    group: 'Multicolumn',
    categories: ['Multicolumn', 'Home'],
    icon: 'badge-check',
    description: 'A row of brand logos.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Logos per row', type: 'slider', min: 3, max: 6, step: 1 },
    ],
    blockKinds: ['brand-logo'],
    starterBlocks: () => [block('brand-logo', 'Brand Logo', { name: 'Brand', link: '' })],
  },
  {
    kind: 'multi-column',
    title: 'Multi-column',
    group: 'Multicolumn',
    categories: ['Multicolumn', 'Content', 'General'],
    icon: 'columns-3',
    description: 'Text and icon cards in columns.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4, step: 1 },
    ],
    variants: [
      { id: 'stacked', label: 'Multi-column', description: 'Icon above title and text, in columns.', preset: { columns: 3 } },
      { id: 'horizontal', label: 'Multi-column Horizontal Items', description: 'Icon beside title and text, in columns.', preset: { columns: 2 } },
    ],
    blockKinds: ['info-card'],
    starterBlocks: () => [
      block('info-card', 'Info Card', { icon: 'truck', title: 'Free delivery', description: 'On orders over $50.' }),
      block('info-card', 'Info Card', { icon: 'rotate-ccw', title: '30-day returns', description: 'No questions asked.' }),
      block('info-card', 'Info Card', { icon: 'headphones', title: 'Expert support', description: 'Seven days a week.' }),
    ],
  },
  {
    kind: 'benefits',
    title: 'Benefits',
    group: 'Content',
    categories: ['Content', 'Home'],
    icon: 'list-checks',
    description: 'Why-shop-with-us bullet cards.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4, step: 1 },
    ],
    blockKinds: ['info-card'],
    starterBlocks: () => [block('info-card', 'Info Card', { icon: 'check', title: 'Benefit', description: 'Describe the benefit.' })],
  },
  {
    kind: 'rich-content',
    title: 'Rich Content',
    group: 'Content',
    categories: ['Content', 'General'],
    icon: 'text',
    description: 'A heading and formatted body copy.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      ALIGNMENT,
    ],
  },
  {
    kind: 'newsletter',
    title: 'Newsletter',
    group: 'Marketing',
    categories: ['Marketing', 'General'],
    icon: 'mail',
    description: 'Email sign-up form.',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
    ],
  },
  // Hidden kinds — used by template seeds, not offered in the dialog.
  { kind: 'page-content', title: 'Page content', group: 'Content', categories: [], icon: 'file-text', description: 'The page body.', fields: [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' }, ALIGNMENT], hidden: true },
  { kind: 'product-details', title: 'Product Details', group: 'Products', categories: [], icon: 'package', description: 'Gallery, price, variants and add to cart.', fields: [{ key: 'galleryLayout', label: 'Gallery layout', type: 'select', options: ['Thumbnails', 'Stacked'] }, { key: 'showReviews', label: 'Show reviews', type: 'toggle' }], hidden: true },
  { kind: 'cart', title: 'Cart', group: 'Products', categories: [], icon: 'shopping-cart', description: 'Line items and totals.', fields: [{ key: 'showNotes', label: 'Order notes', type: 'toggle' }, { key: 'upsells', label: 'Upsell suggestions', type: 'toggle' }], hidden: true },
  { kind: 'search-results', title: 'Search Results', group: 'Products', categories: [], icon: 'search', description: 'Filterable product results.', fields: [{ key: 'productCount', label: 'Products per page', type: 'slider', min: 8, max: 48, step: 8 }], hidden: true },
]

export function getSectionDef(kind: string): ThemeEditorSectionDef | undefined {
  return sectionCatalog.find((def) => def.kind === kind)
}

/** Dialog groups in display order, each with its visible defs (optionally narrowed to a category). */
export function catalogGroups(category?: string) {
  const visible = sectionCatalog.filter((def) => !def.hidden && (!category || def.categories.includes(category)))
  const order = ['Featured In Focus', 'Text & Image', 'Multicolumn', 'Products', 'Content', 'Marketing']
  return order
    .map((group) => ({ group, defs: visible.filter((def) => def.group === group) }))
    .filter((entry) => entry.defs.length > 0)
}

// ── Block catalog ─────────────────────────────────────────────────────────────

export interface ThemeEditorBlockDef {
  kind: string
  title: string
  icon: string
  fields: ThemeEditorField[]
  /** Block kinds nested inside this one (Trust Stats Bar → Stat). */
  childKinds?: string[]
  defaults: Record<string, ThemeEditorValue>
}

export const blockCatalog: ThemeEditorBlockDef[] = [
  { kind: 'heading-tag', title: 'Heading Tag', icon: 'tag', fields: [{ key: 'text', label: 'Text', type: 'text' }, { key: 'style', label: 'Style', type: 'select', options: ['Pill', 'Plain'] }], defaults: { text: 'New Arrivals', style: 'Pill' } },
  { kind: 'heading', title: 'Heading', icon: 'heading', fields: [{ key: 'content', label: 'Content', type: 'richtext' }, { key: 'alignment', label: 'Content alignment', type: 'align' }], defaults: { content: '<h1>Heading</h1>', alignment: 'left' } },
  { kind: 'cta-buttons', title: 'CTA Buttons', icon: 'mouse-pointer-click', fields: [{ key: 'primaryLabel', label: 'Primary label', type: 'text' }, { key: 'primaryLink', label: 'Primary link', type: 'link' }, { key: 'secondaryLabel', label: 'Secondary label', type: 'text' }, { key: 'secondaryLink', label: 'Secondary link', type: 'link' }], defaults: { primaryLabel: 'Shop now', primaryLink: '/collections/all', secondaryLabel: '', secondaryLink: '' } },
  { kind: 'trust-stats-bar', title: 'Trust Stats Bar', icon: 'bar-chart-3', fields: [{ key: 'showDividers', label: 'Show dividers', type: 'toggle' }, { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4, step: 1 }], childKinds: ['stat'], defaults: { showDividers: true, columns: 3 } },
  { kind: 'stat', title: 'Stat', icon: 'hash', fields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }], defaults: { value: '100+', label: 'Label' } },
  { kind: 'category-card', title: 'Category Card', icon: 'square', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'link', label: 'Link', type: 'link' }], defaults: { title: 'Category', image: '', link: '/collections/all' } },
  { kind: 'collection-card', title: 'Collection Card', icon: 'square', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'image', label: 'Image', type: 'image' }, { key: 'link', label: 'Link', type: 'link' }], defaults: { title: 'Collection', image: '', link: '/collections/all' } },
  { kind: 'brand-logo', title: 'Brand Logo', icon: 'image', fields: [{ key: 'name', label: 'Brand name', type: 'text' }, { key: 'image', label: 'Logo', type: 'image' }, { key: 'link', label: 'Link', type: 'link' }], defaults: { name: 'Brand', image: '', link: '' } },
  { kind: 'info-card', title: 'Info Card', icon: 'square', fields: [{ key: 'icon', label: 'Icon', type: 'text', hint: 'Lucide icon name' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'description', label: 'Description', type: 'textarea' }], defaults: { icon: 'star', title: 'Title', description: 'Description' } },
  { kind: 'paragraph', title: 'Paragraph', icon: 'pilcrow', fields: [{ key: 'text', label: 'Text', type: 'textarea' }, { key: 'alignment', label: 'Content alignment', type: 'align' }], defaults: { text: 'Paragraph text.', alignment: 'left' } },
  { kind: 'button', title: 'Button', icon: 'mouse-pointer-click', fields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'link', label: 'Link', type: 'link' }, { key: 'style', label: 'Style', type: 'select', options: ['Primary', 'Secondary'] }], defaults: { label: 'Button', link: '/', style: 'Primary' } },
  { kind: 'image', title: 'Image', icon: 'image', fields: [{ key: 'image', label: 'Image', type: 'image' }, { key: 'alt', label: 'Alt text', type: 'text' }], defaults: { image: '', alt: '' } },
]

export function getBlockDef(kind: string): ThemeEditorBlockDef | undefined {
  return blockCatalog.find((def) => def.kind === kind)
}

/** Block kinds "Add block" offers for a section, or for a block that nests children. */
export function addableBlockKinds(section: ThemeEditorSection, parent?: ThemeEditorBlock): string[] {
  if (parent) return getBlockDef(parent.kind)?.childKinds ?? []
  return getSectionDef(section.kind)?.blockKinds ?? ['paragraph', 'button', 'image']
}

// ── Factories ─────────────────────────────────────────────────────────────────

export function block(kind: string, label?: string, settings: Record<string, ThemeEditorValue> = {}, id?: string, blocks?: ThemeEditorBlock[]): ThemeEditorBlock {
  const def = getBlockDef(kind)
  return {
    id: id ?? nextId(kind),
    kind,
    label: label ?? def?.title ?? kind,
    settings: { ...(def?.defaults ?? {}), ...settings },
    ...(blocks ? { blocks } : def?.childKinds ? { blocks: [] } : {}),
  }
}

export function section(kind: string, label?: string, settings: Record<string, ThemeEditorValue> = {}, blocks: ThemeEditorBlock[] = [], id?: string, variant?: string): ThemeEditorSection {
  const def = getSectionDef(kind)
  return {
    id: id ?? nextId(kind),
    kind,
    label: label ?? def?.title ?? kind,
    ...(variant ? { variant } : {}),
    settings: { colorScheme: 'Default', textScheme: 'Default', buttonScheme: 'Default', ...settings },
    blocks,
  }
}

/** A section as the Add-section dialog creates it: variant preset + starter blocks. */
export function sectionFromDef(def: ThemeEditorSectionDef, variantId?: string): ThemeEditorSection {
  const variant = def.variants?.find((entry) => entry.id === variantId)
  return section(def.kind, variant?.label ?? def.title, { ...(variant?.preset ?? {}) }, def.starterBlocks?.() ?? [], undefined, variant?.id)
}

// ── Theme settings ────────────────────────────────────────────────────────────

export interface ThemeColorScheme { id: string; name: string; background: string; text: string; primary: string; secondary: string }
export interface ThemeTypeScheme { id: string; name: string; headingFont: string; bodyFont: string; baseSize: number }

export interface ThemeEditorSettings {
  logo: { image: string; link: string; storeName: string; description: string; languageCode: string }
  socialMedia: { facebook: string; instagram: string; x: string; youtube: string; tiktok: string }
  colorSchemes: ThemeColorScheme[]
  defaultColorScheme: string
  typography: ThemeTypeScheme[]
  defaultTypography: string
  buttons: { radius: number; style: 'Solid' | 'Outline'; uppercase: boolean }
  productCard: { showVendor: boolean; showRating: boolean; imageRatio: 'Square' | 'Portrait' | 'Landscape'; quickAdd: boolean }
  furnitureSurfaces: { wood: string; fabric: string; metal: string }
}

export const THEME_SETTINGS_ITEMS = [
  { id: 'logo', label: 'Logo' },
  { id: 'social-media', label: 'Social Media' },
  { id: 'theme-colors', label: 'Theme Colors' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'product-card', label: 'Product Card' },
  { id: 'typography', label: 'Typography' },
  { id: 'furniture-surfaces', label: 'Furniture surfaces' },
] as const
export type ThemeSettingsItemId = (typeof THEME_SETTINGS_ITEMS)[number]['id']

export const THEME_FONTS = ['Inter', 'Georgia', 'Playfair Display', 'DM Sans', 'Space Grotesk', 'JetBrains Mono', 'system-ui']

export function seedSettings(): ThemeEditorSettings {
  return {
    logo: {
      image: 'images/logo.svg',
      link: '/',
      storeName: 'Furniture & Home',
      description: "Quality furniture and home furnishings. Shop living room, bedroom, dining, office and outdoor — design the space you'll love.",
      languageCode: 'en',
    },
    socialMedia: { facebook: 'https://facebook.com/furnitureandhome', instagram: 'https://instagram.com/furnitureandhome', x: '', youtube: '', tiktok: '' },
    colorSchemes: [
      { id: 'default', name: 'Default', background: '#FFFFFF', text: '#1F2937', primary: '#5B5FC7', secondary: '#EEF0FB' },
      { id: 'dark', name: 'Dark', background: '#0B0B0B', text: '#FFFFFF', primary: '#FFFFFF', secondary: '#9CA3AF' },
      { id: 'modern', name: 'Modern', background: '#FFF5F2', text: '#1F2937', primary: '#F4A582', secondary: '#111111' },
    ],
    defaultColorScheme: 'default',
    typography: [
      { id: 'default', name: 'Default', headingFont: 'Georgia', bodyFont: 'Inter', baseSize: 16 },
      { id: 'compact', name: 'Compact', headingFont: 'Inter', bodyFont: 'Inter', baseSize: 14 },
      { id: 'editorial', name: 'Editorial', headingFont: 'Playfair Display', bodyFont: 'Georgia', baseSize: 18 },
      { id: 'elegant', name: 'Elegant', headingFont: 'Playfair Display', bodyFont: 'DM Sans', baseSize: 16 },
      { id: 'technical', name: 'Technical', headingFont: 'Space Grotesk', bodyFont: 'JetBrains Mono', baseSize: 15 },
    ],
    defaultTypography: 'default',
    buttons: { radius: 8, style: 'Solid', uppercase: false },
    productCard: { showVendor: false, showRating: true, imageRatio: 'Square', quickAdd: true },
    furnitureSurfaces: { wood: 'Walnut', fabric: 'Linen', metal: 'Brushed brass' },
  }
}

// ── Template seeds (Lumos, store #9) ──────────────────────────────────────────

export function seedTemplates(): ThemeEditorTemplate[] {
  return TEMPLATE_NAMES.map((type) => ({ type, label: templateLabel(type), sections: seedSections(type) }))
}

function seedSections(type: string): ThemeEditorSection[] {
  const label = templateLabel(type)
  switch (type) {
    case 'home':
      return [
        section('hero-banner', 'Hero Banner', { alignment: 'Left', backgroundImage: 'images/banner-1.webp', opacity: 1 }, [
          block('heading-tag', 'Heading Tag', { text: 'New Arrivals', style: 'Pill' }, 'lumos-home-hero-tag'),
          block('heading', 'Heading', { content: '<h1>DISCOVER YOUR <strong>PERFECT</strong> PLACE</h1><p>Luxury living room with a Contemporary Touch. Premium Luxury Office outdoor Interiors. Brands.</p>', alignment: 'left' }, 'lumos-home-hero-heading'),
          block('cta-buttons', 'CTA Buttons', { primaryLabel: 'See More', primaryLink: '/collections/all', secondaryLabel: 'Categories', secondaryLink: '/collections' }, 'lumos-home-hero-cta'),
          block('trust-stats-bar', 'Trust Stats Bar', { showDividers: true, columns: 3 }, 'lumos-home-hero-stats', [
            block('stat', 'Stat: Happy Homes', { value: '25K+', label: 'Happy Homes' }, 'lumos-home-stat-1'),
            block('stat', 'Stat: Furniture Pieces', { value: '500+', label: 'Furniture Pieces' }, 'lumos-home-stat-2'),
            block('stat', 'Stat: Customer Rating', { value: '4.9★', label: 'Customer Rating' }, 'lumos-home-stat-3'),
          ]),
        ], 'lumos-home-hero'),
        section('categories', 'Categories', { title: 'Categories', columns: 4 }, [
          block('category-card', 'Living Room', { title: 'Living Room', image: 'images/car-image-1.webp', link: '/collections/living-room' }, 'lumos-home-cat-1'),
          block('category-card', 'Bedroom', { title: 'Bedroom', image: 'images/car-image-2.webp', link: '/collections/bedroom' }, 'lumos-home-cat-2'),
          block('category-card', 'Dining', { title: 'Dining', image: 'images/car-image-3.webp', link: '/collections/dining' }, 'lumos-home-cat-3'),
          block('category-card', 'Office', { title: 'Office', image: 'images/banner2.webp', link: '/collections/office' }, 'lumos-home-cat-4'),
        ], 'lumos-home-categories'),
        section('brands', 'Brand', { title: 'Brands', columns: 5 }, [
          block('brand-logo', 'Artifox', { name: 'Artifox', image: 'images/brand-artifox.png', link: '' }, 'lumos-home-brand-1'),
          block('brand-logo', 'Castlery', { name: 'Castlery', image: 'images/brand-castlery.png', link: '' }, 'lumos-home-brand-2'),
          block('brand-logo', 'Floyd', { name: 'Floyd', image: 'images/brand-floyd.png', link: '' }, 'lumos-home-brand-3'),
          block('brand-logo', 'Frontgate', { name: 'Frontgate', image: 'images/brand-frontgate.png', link: '' }, 'lumos-home-brand-4'),
          block('brand-logo', 'Stickley', { name: 'Stickley', image: 'images/brand-stickley.png', link: '' }, 'lumos-home-brand-5'),
        ], 'lumos-home-brands'),
        section('featured-recommendations', 'Featured Recommendations', { title: 'Featured Recommendations', productCount: 4, layout: 'Grid' }, [], 'lumos-home-recommendations', 'grid'),
        section('multi-column', 'Why Choose Us', { heading: 'Why Choose Us', columns: 3 }, [
          block('info-card', 'Free Delivery', { icon: 'truck', title: 'Free Delivery', description: 'Free shipping on orders over $50.' }, 'lumos-home-why-1'),
          block('info-card', '30-Day Returns', { icon: 'rotate-ccw', title: '30-Day Returns', description: 'Changed your mind? Send it back.' }, 'lumos-home-why-2'),
          block('info-card', 'Expert Support', { icon: 'headphones', title: 'Expert Support', description: 'Design advice seven days a week.' }, 'lumos-home-why-3'),
        ], 'lumos-home-why', 'stacked'),
      ]
    case 'product':
      return [
        section('product-details', 'Product Details', { galleryLayout: 'Thumbnails', showReviews: true }, [], 'lumos-product-details'),
        section('featured-recommendations', 'You May Also Like', { title: 'You May Also Like', productCount: 4, layout: 'Carousel' }, [], 'lumos-product-recommendations', 'carousel'),
      ]
    case 'collection':
      return [
        section('image-banner', 'Collection Banner', { headline: 'Collection', height: 'Small', backgroundImage: 'images/banner2.webp' }, [], 'lumos-collection-banner', 'standard'),
        section('featured-recommendations', 'Product Grid', { title: 'Products', productCount: 8, layout: 'Grid' }, [], 'lumos-collection-grid', 'grid'),
      ]
    case 'cart':
      return [section('cart', 'Cart', { showNotes: true, upsells: false }, [], 'lumos-cart')]
    case 'search':
      return [section('search-results', 'Search Results', { productCount: 24 }, [], 'lumos-search-results')]
    case 'header':
    case 'footer':
      return [section('page-content', label, { heading: label, body: `The ${label.toLowerCase()} is edited from the storefront preview.`, alignment: 'Left' }, [], `lumos-${type}-content`)]
    default:
      return [section('page-content', label, { heading: label, body: `${label} content.`, alignment: 'Left' }, [], `lumos-${type}-content`)]
  }
}

// ── Preview projection ────────────────────────────────────────────────────────

/** Strips tags from the heading block's rich content: first block-level chunk = title, the rest = body. */
export function splitRichContent(html: string): { title: string; body: string } {
  const chunks = html
    .split(/<\/(?:h[1-6]|p|div)>/i)
    .map((chunk) => chunk.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return { title: chunks[0] ?? '', body: chunks.slice(1).join(' ') }
}

const str = (value: ThemeEditorValue | undefined, fallback = ''): string => (typeof value === 'string' && value.trim() ? value : fallback)
const num = (value: ThemeEditorValue | undefined, fallback: number): number => (typeof value === 'number' ? value : fallback)

/**
 * Projects a template onto the StorefrontPreview model. The storefront chrome (announcement bar,
 * header, footer) is fixed — in UAT those live in their own templates and are edited from the
 * preview's "Edit header" overlay, not the Layers list — so it is added around the sections here.
 * Section ids are preserved, so selection in the Layers list highlights the same section in the
 * preview; blocks are projected where the mock has an equivalent.
 */
export function toPreviewSections(template: ThemeEditorTemplate): ThemeSection[] {
  const head: ThemeSection[] = [
    { ...createSection('announcement-bar', { text: 'Free shipping on orders over $50' }, 'lumos-chrome-announcement'), label: 'Announcement bar' },
    { ...createSection('header', { menuStyle: 'Inline' }, 'lumos-chrome-header'), label: 'Header' },
  ]
  const foot: ThemeSection = { ...createSection('footer', { columns: 3, showSocial: true }, 'lumos-chrome-footer'), label: 'Footer' }
  return [...head, ...template.sections.map(projectSection), foot]
}

function projectSection(s: ThemeEditorSection): ThemeSection {
  const base = (kind: string, settings: Record<string, ThemeEditorValue>, blocks?: ThemeBlock[]): ThemeSection => ({
    ...createSection(kind, settings, s.id),
    label: s.label,
    ...(blocks && blocks.length ? { blocks } : {}),
  })
  switch (s.kind) {
    case 'hero-banner': {
      const heading = s.blocks.find((b) => b.kind === 'heading')
      const cta = s.blocks.find((b) => b.kind === 'cta-buttons')
      const tag = s.blocks.find((b) => b.kind === 'heading-tag')
      const stats = s.blocks.find((b) => b.kind === 'trust-stats-bar')
      const { title, body } = splitRichContent(str(heading?.settings.content))
      const blocks: ThemeBlock[] = []
      if (tag) blocks.push(createBlock('paragraph', { body: str(tag.settings.text, 'New Arrivals') }, tag.id))
      if (stats?.blocks?.length) {
        blocks.push(
          createBlock('paragraph', { body: stats.blocks.map((stat) => `${str(stat.settings.value)} ${str(stat.settings.label)}`).join('   ·   ') }, stats.id),
        )
      }
      return base('hero', {
        headline: title || 'Hero headline',
        subheadline: body,
        ctaLabel: str(cta?.settings.primaryLabel, 'Shop now'),
        alignment: s.settings.alignment === 'Center' ? 'Center' : 'Left',
        overlay: Math.round((1 - num(s.settings.opacity, 1)) * 60),
      }, blocks)
    }
    case 'categories':
    case 'brands':
    case 'featured-collections':
      return base('collection-grid', { title: str(s.settings.title, s.label), columns: num(s.settings.columns, 3) },
        s.blocks.map((b) => createBlock('collection', { label: str(b.settings.title ?? b.settings.name, b.label), link: str(b.settings.link) }, b.id)))
    case 'featured-recommendations':
      return base('featured-products', { title: str(s.settings.title, s.label), productCount: num(s.settings.productCount, 4), layout: str(s.settings.layout, 'Grid') })
    case 'search-results':
      return base('featured-products', { title: 'Search results', productCount: num(s.settings.productCount, 8), layout: 'Grid' })
    case 'multi-column':
    case 'benefits':
      return base('testimonials', { title: str(s.settings.heading, s.label), count: s.blocks.length || num(s.settings.columns, 3) })
    case 'image-banner':
      return base('image-banner', { headline: str(s.settings.headline, s.label), height: str(s.settings.height, 'Medium') },
        s.settings.ctaLabel ? [createBlock('button', { label: str(s.settings.ctaLabel) }, `${s.id}-cta`)] : undefined)
    case 'newsletter':
      return base('newsletter', { headline: str(s.settings.headline, 'Join the list'), buttonLabel: str(s.settings.buttonLabel, 'Subscribe') })
    case 'product-details':
      return base('product-detail', { galleryLayout: str(s.settings.galleryLayout, 'Thumbnails'), showReviews: s.settings.showReviews !== false })
    case 'cart':
      return base('cart-summary', { showNotes: s.settings.showNotes === true, upsells: s.settings.upsells === true })
    default:
      return base('rich-text', { heading: str(s.settings.heading, s.label), body: str(s.settings.body), alignment: s.settings.alignment === 'Center' ? 'Center' : 'Left' })
  }
}

/** The preview's global styles from the default colour and type schemes. */
export function toPreviewStyles(settings: ThemeEditorSettings): Partial<ThemeStyles> {
  const scheme = settings.colorSchemes.find((entry) => entry.id === settings.defaultColorScheme) ?? settings.colorSchemes[0]
  const type = settings.typography.find((entry) => entry.id === settings.defaultTypography) ?? settings.typography[0]
  return {
    brandColor: scheme?.primary,
    accentColor: scheme?.primary,
    background: scheme?.background,
    textColor: scheme?.text,
    headingFont: type?.headingFont,
    bodyFont: type?.bodyFont,
    cornerRadius: settings.buttons.radius,
    buttonStyle: settings.buttons.style === 'Outline' ? 'outline' : 'solid',
  }
}
