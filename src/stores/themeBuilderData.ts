// Store theme builder data — section catalog (schema-driven settings per
// section kind), theme style defaults pulled from design tokens, and section
// factories shared by useStoreThemes seeds and the builder's add-section picker.
// Mirrors the journeyFlowData + schema-driven-config architecture.

import {
  mp_borderRadius_md,
  mp_color_blue_500,
  mp_color_light_primary,
  mp_color_light_surface,
  mp_color_light_textPrimary,
} from '@/design-tokens/generated/tokens'

export interface ThemeSectionField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'color' | 'toggle' | 'slider'
  options?: string[]
  min?: number
  max?: number
}

export interface ThemeSectionDef {
  kind: string
  title: string
  icon: string
  description: string
  fields: ThemeSectionField[]
  unique?: boolean
}

export interface ThemeSection {
  id: string
  kind: string
  label: string
  settings: Record<string, string | number | boolean>
  hidden?: boolean
}

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
}

export interface StoreTheme {
  id: string
  channelId: string
  name: string
  status: 'Draft' | 'Published'
  publishedAt?: string
  updatedAt: string
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
export const themeFonts = ['Inter', 'Georgia', 'Space Grotesk', 'DM Sans']

/** Default global theme styles, sourced from design tokens. */
export function defaultThemeStyles(): ThemeStyles {
  return {
    brandColor: mp_color_light_primary,
    accentColor: mp_color_blue_500,
    background: mp_color_light_surface,
    textColor: mp_color_light_textPrimary,
    headingFont: 'Inter',
    bodyFont: 'Inter',
    cornerRadius: Number.parseInt(mp_borderRadius_md, 10),
    buttonStyle: 'solid',
  }
}

// ── Section catalog ──────────────────────────────────────────────────────────

export const sectionCatalog: ThemeSectionDef[] = [
  {
    kind: 'announcement-bar',
    title: 'Announcement bar',
    icon: 'megaphone',
    description: 'Slim strip above the header for promos and shipping notices.',
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
    unique: true,
    fields: [
      { key: 'menuStyle', label: 'Menu style', type: 'select', options: ['Inline', 'Centered', 'Minimal'] },
      { key: 'sticky', label: 'Sticky on scroll', type: 'toggle' },
    ],
  },
  {
    kind: 'hero',
    title: 'Hero',
    icon: 'image',
    description: 'Full-width banner with headline and call to action.',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'subheadline', label: 'Subheadline', type: 'text' },
      { key: 'ctaLabel', label: 'Button label', type: 'text' },
      { key: 'alignment', label: 'Alignment', type: 'select', options: ['Left', 'Center'] },
      { key: 'overlay', label: 'Overlay strength', type: 'slider', min: 0, max: 60 },
    ],
  },
  {
    kind: 'featured-products',
    title: 'Featured products',
    icon: 'shopping-bag',
    description: 'Curated product cards from a collection.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'productCount', label: 'Products', type: 'slider', min: 2, max: 8 },
      { key: 'layout', label: 'Layout', type: 'select', options: ['Grid', 'Carousel'] },
    ],
  },
  {
    kind: 'collection-grid',
    title: 'Collection grid',
    icon: 'layout-grid',
    description: 'Tiles linking to product collections.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'columns', label: 'Columns', type: 'slider', min: 2, max: 4 },
    ],
  },
  {
    kind: 'image-banner',
    title: 'Image banner',
    icon: 'images',
    description: 'Editorial image break with an optional headline.',
    fields: [
      { key: 'headline', label: 'Headline', type: 'text' },
      { key: 'height', label: 'Height', type: 'select', options: ['Small', 'Medium', 'Large'] },
    ],
  },
  {
    kind: 'rich-text',
    title: 'Rich text',
    icon: 'text',
    description: 'Heading and paragraph for brand storytelling.',
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
    unique: true,
    fields: [
      { key: 'galleryLayout', label: 'Gallery layout', type: 'select', options: ['Thumbnails', 'Stacked'] },
      { key: 'showReviews', label: 'Show reviews', type: 'toggle' },
    ],
  },
  {
    kind: 'cart-summary',
    title: 'Cart summary',
    icon: 'shopping-cart',
    description: 'Line items, totals, and checkout for the cart template.',
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
    unique: true,
    fields: [
      { key: 'showSocial', label: 'Show social icons', type: 'toggle' },
      { key: 'columns', label: 'Link columns', type: 'slider', min: 2, max: 4 },
    ],
  },
]

/** Default settings applied when a section of the given kind is created. */
const sectionDefaults: Record<string, Record<string, string | number | boolean>> = {
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
  return {
    id: id ?? `${kind}-${Date.now().toString(36)}-${sectionIdCounter}`,
    kind,
    label: def?.title ?? kind,
    // Spread clones — settings values are always flat primitives, so no
    // references are shared between sections or with the defaults map.
    settings: { ...(sectionDefaults[kind] ?? {}), ...overrides },
  }
}
