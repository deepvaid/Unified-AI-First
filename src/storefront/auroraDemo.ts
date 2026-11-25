// The "Aurora Outdoor (demo)" store: everything seeded for sales channel `aurora-demo`.
//
// Aurora is a fictional outdoor clothing and footwear store for women and men: down
// jackets, rain shells, fleece, merino base layers, hiking pants and boots, plus a few
// packs and accessories, in sizes and colours, priced in US dollars, with no
// subscriptions. Every name, product and line of copy was written for this store (the
// line names are made up, and so are the fabrics' descriptions); the photos are
// free-licence stock photos kept in public/storefront/aurora (credits in its
// CREDITS.md). It is the showcase store of the Aurora theme, rebuilt from the UAT
// theme "Aurora" 1.8.9: its header and footer, its full-width hero and its Featured
// Collections slider, its monochrome palette and charcoal buttons, and its product
// card scheme (src/storefront/demoStores/aurora.ts installs it in any store that
// applies that theme).
//
// Like northfoldDemo.ts, most of it is built from an InstallContext: the ids, the
// channel, the domain and the string-id prefix of the store it is installed in, so a
// copy in another store gets ids of its own and every link follows them. Constants
// hold what no install changes (the theme's styles, the header and footer, the
// chatbot's knowledge, which link pages and collections only).
//
// The chat answers on the apparel profile, which reads each piece's own fields: its
// fit note, fabric and care, its description (how warm a jacket is, whether a shell is
// waterproof) and its size chart (boots by foot length, socks by shoe size, a hat by
// head). Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and no real brand (the shared suite,
// tests/storefront/demoStores.test.ts, checks it). Shipping copy matches the checkout
// and says nothing more: free shipping in 3 to 5 business days, to the countries the
// US-dollar checkout offers (src/storefront/checkoutProfile.ts). The checkout has no
// Click & collect here. Pure: types and the pure rule modules only, so Node runs it
// (tests/storefront/auroraDemo.test.ts checks the reference tables).

import type { Product, ProductOption, ProductVariant } from '../stores/useCommerce.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { BlogSeoSettings, ContentEntry } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome, StorefrontLink } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../stores/useMerchandising.ts'
import type { StoreCampaign } from './campaigns.ts'
import type { InstallContext, SizeChart, SnapshotCollection } from './demoStores/types.ts'
import { toHandle } from './handles.ts'
import { createBlock, createSection } from './themeSections.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from './themeSections.ts'

export const AURORA_CHANNEL_ID = 'aurora-demo'
export const AURORA_CHANNEL_NAME = 'Aurora Outdoor (demo)'

/** When the seed was written: the channel's dates, the theme's publish date and the collections' last update. */
export const AURORA_SEEDED_AT = '2026-11-24T09:00:00Z'

/**
 * The store's sales channel. It starts connected to Merchandise Cloud, so search,
 * its rules and "Goes well with" work on the first visit; a restore connects it again.
 */
export const AURORA_CHANNEL: SalesChannel = {
  id: AURORA_CHANNEL_ID,
  accountId: '2000290',
  name: AURORA_CHANNEL_NAME,
  storeNumber: 16,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Outdoor clothing, boots and packs for women and men. Size and color variants; prices in US dollars.',
  connectedClouds: ['commerce', 'store_builder', 'merchandise'],
  createdAt: AURORA_SEEDED_AT,
  updatedAt: AURORA_SEEDED_AT,
  lastActivityAt: AURORA_SEEDED_AT,
  merchandising: { status: 'connected', health: 'healthy', lastSyncAt: AURORA_SEEDED_AT, lastActivityAt: AURORA_SEEDED_AT },
  webStore: {
    domain: '2000290-16.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: true,
    currency: 'USD',
    demo: true,
  },
}

/** What the store's own page in the admin says about it. The company is made up, like the brand. */
export const AURORA_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '$96.4K',
  themeName: 'Aurora 1.8.9',
  business: [
    { label: 'Legal name', value: 'Aurora Outdoor Co.' },
    { label: 'Business type', value: 'Corporation' },
    { label: 'Tax ID (EIN)', value: '84-3029176' },
    { label: 'Phone', value: '(303) 555-0187' },
    { label: 'Public email', value: 'hello@aurora.example' },
    { label: 'Support email', value: 'hello@aurora.example' },
    { label: 'Website', value: '2000290-16.uat.maropost.store' },
    { label: 'Street', value: '88 Larkspur Lane' },
    { label: 'City / region', value: 'Denver, CO 80205' },
    { label: 'Country', value: 'United States' },
  ],
} as const

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * UAT's Aurora: near-black ink on white, charcoal buttons with corners of 6, hairlines
 * in a pale grey, and a lavender-grey tint behind the cart summary. Headings in a real
 * web serif, Source Serif 4 at 700 (UAT shows the browser's Times by a font bug; this
 * is the serif look without it), body text in the system sans Aurora is set to. A
 * 1380px page with 32px gutters, a 61px hero headline and 25px section titles, as
 * UAT's type scale draws them on a desktop. Drawn with the sections drawing.
 *
 * Contrast (WCAG 2.1, checked in tests/storefront/auroraDemo.test.ts): text on the page
 * 19.0:1, on the surface 17.4:1, on the tint 16.3:1; muted text on the page 7.7:1, on the
 * surface 7.0:1, on the tint 6.6:1; white on the charcoal button 11.6:1, on its hover
 * 16.2:1; white on the sale red 6.5:1, and the sale red as a price on a white card
 * 6.5:1. Form fields are edged in #8a8a8a, 3.4:1 on the page and on a card (WCAG 2.1
 * asks 3:1 of a field's edge; UAT's #9e9e9e is 2.7:1); hairlines between rows and
 * around cards stay the paler divider.
 */
export const AURORA_THEME_STYLES: ThemeStyles = {
  brandColor: '#373842',
  accentColor: '#121011',
  background: '#ffffff',
  textColor: '#121011',
  headingFont: 'Source Serif 4',
  bodyFont: 'system-ui',
  cornerRadius: 6,
  buttonStyle: 'solid',
  saleBadgeColor: '#b91c1c',
  customBadgeColor: '#373842',
  soldOutBadgeColor: '#121011',
  drawing: 'sections',
  // Read by the sections drawing only.
  buttonColor: '#373842',
  surfaceColor: '#f5f5f6',
  mutedColor: '#545354',
  dividerColor: '#f0f0f0',
  headingCase: 'As typed',
  headingWeight: 700,
  cardColor: '#ffffff',
  cardRadius: 24,
  cardShadow: 'None',
  // The Featured Collections tiles keep UAT's collection card: 8px corners and a soft shadow.
  tileRadius: 8,
  tileShadow: 'Soft',
  buttonBorderColor: '#373842',
  buttonHoverColor: '#1f2026',
  buttonCase: 'As typed',
  tintColor: '#eeedf5',
  measure: 1380,
  gutter: 32,
  heroTitleSize: 61,
  sectionTitleSize: 25,
  controlBorderColor: '#8a8a8a',
}

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const AURORA_PHOTO_DIR = '/storefront/aurora'

const photo = (file: string): string => `${AURORA_PHOTO_DIR}/${file}`

/** The photos the theme's home page uses. Product photos are named on each product. */
export const AURORA_PHOTOS = {
  hero: photo('hero-trail.jpg'),
  tileJackets: photo('tile-jackets.jpg'),
  tileFootwear: photo('tile-footwear.jpg'),
  tilePacks: photo('tile-packs.jpg'),
  tileLayers: photo('tile-layers.jpg'),
  storyTrail: photo('story-trail.jpg'),
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

/** The collections, in the order the admin lists them. A product is in one when it names it. */
export const AURORA_COLLECTION_NAMES = ['Women', 'Men', 'Jackets', 'Fleece & layers', 'Pants', 'Footwear', 'Packs & accessories', 'New arrivals', 'Best sellers', 'Sale'] as const
export type AuroraCollection = (typeof AURORA_COLLECTION_NAMES)[number]

/** The kind of piece (`detail.tag`), which the storefront's Category filter offers. */
export const AURORA_CATEGORIES = ['Jackets', 'Fleece', 'Pants', 'Base layers', 'Boots', 'Packs', 'Accessories'] as const
export type AuroraCategory = (typeof AURORA_CATEGORIES)[number]

/**
 * Every colour a product comes in: its swatch and the code its SKUs use. A light
 * swatch sits on the page with a hairline ring; the chosen one is marked by a dark
 * ring and its name, never by colour alone. A colour that is photographed has the
 * swatch of its photo: Ember the jacket's bright orange, Stone the pants' grey khaki,
 * Oat the ivory of the fleece and the beanie, Khaki the men's pants' tan, Olive the
 * men's fleece and Spruce the backpacking pack's green.
 */
export const AURORA_COLORS: Readonly<Record<string, { hex: string; code: string }>> = {
  Ember: { hex: '#ea6233', code: 'EMB' },
  Black: { hex: '#1c1c1e', code: 'BLK' },
  Moss: { hex: '#3f4a40', code: 'MOS' },
  Slate: { hex: '#5b6873', code: 'SLT' },
  Oat: { hex: '#e5e2d8', code: 'OAT' },
  Forest: { hex: '#2f4a3a', code: 'FOR' },
  Stone: { hex: '#9d977f', code: 'STN' },
  'Heather gray': { hex: '#7e797a', code: 'HGR' },
  Navy: { hex: '#1f2a44', code: 'NVY' },
  Ochre: { hex: '#d0921c', code: 'OCH' },
  Graphite: { hex: '#3d4046', code: 'GPH' },
  Charcoal: { hex: '#3c4449', code: 'CHR' },
  Khaki: { hex: '#9c7b47', code: 'KHK' },
  Rust: { hex: '#b9492a', code: 'RST' },
  Sage: { hex: '#567659', code: 'SGE' },
  Olive: { hex: '#4a4530', code: 'OLV' },
  Spruce: { hex: '#1f6a58', code: 'SPR' },
}

/**
 * The photos of a product's other colours, by its photo name and the colour each
 * shows: `<photo>-<colour>-1.jpg`. A product's own `<photo>-1.jpg` and `-2.jpg` show
 * its first colour; a colour listed here shows its own photo, and a colour not listed
 * shows the first colour's photos, with "Shown in Moss" (the women's rain shell in
 * Slate). Remove a line when its file is not in public/storefront/aurora.
 */
export const AURORA_COLOURWAY_PHOTOS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'summit-down-w': { Black: 'summit-down-w-black-1.jpg' },
  'trailhead-pants-w': { Black: 'trailhead-pants-w-black-1.jpg' },
  'summit-down-m': { Black: 'summit-down-m-black-1.jpg' },
  'trailhead-pants-m': { Black: 'trailhead-pants-m-black-1.jpg' },
  'merino-top-m': { Navy: 'merino-top-m-navy-1.jpg' },
  'peak-beanie': { Black: 'peak-beanie-black-1.jpg', Oat: 'peak-beanie-oat-1.jpg' },
  'trail-bottle': { Black: 'trail-bottle-black-1.jpg' },
}

/** The size charts, by the key a product names: Products › Size charts, and the size guide on the product page. */
type ChartKey = 'womens-tops' | 'mens-tops' | 'womens-pants' | 'mens-pants' | 'boots' | 'socks' | 'hats'

/** Where every variant is stocked (the location the other demo stores use too). */
const LOCATION = 'Oxford Warehouse'

const WOMENS = ['XS', 'S', 'M', 'L', 'XL']
const MENS = ['S', 'M', 'L', 'XL', 'XXL']

interface ProductSeed {
  /** Its place in the id block: product n is id `ctx.ids.product(n)` (6001 at home). Newest lists the highest first. */
  n: number
  /** A style made for women and for men leads with whose it is: "Women’s Summit Down Jacket", "Men’s Summit Down Jacket". */
  name: string
  /** The base of its photos' names: `<photo>-1.jpg`, `<photo>-2.jpg`. */
  photo: string
  /** The style's code in its SKUs: AU-<style>-<colour code>-<size>. */
  style: string
  category: AuroraCategory
  /**
   * The first is the breadcrumb: Women or Men for a piece made for one of them (a style
   * made for both has one piece each, named for whose it is), Packs & accessories for a
   * piece for everyone, which is in Women and Men too.
   */
  collections: AuroraCollection[]
  /** USD, every variant the same. */
  price: number
  /** The "was" price of a piece on sale. */
  compareAt?: number
  /** The Color option's values, in order; the first is the one the photos show. Absent: one colour. */
  colors?: string[]
  /** The Size option's values, in order; absent for a one-size piece. */
  sizes?: string[]
  /** Units on hand per variant: colour by colour, its sizes in order. 0 is sold out. */
  stock: number[]
  sizeChart?: ChartKey
  subtitle: string
  description: string
  fitNote: string
  material: string
  care: string
  countryOfOrigin: string
  hsCode: string
  /** Shipping weight of every variant. */
  weightKg: number
}

// What a style made for women and for men says the same way in both, so the chat
// says it once (src/chatbot/clothingAnswers.ts): the same style name (each piece's name
// without its leading "Women’s " or "Men’s "), fabric and care. Each piece's own name
// says whose it is, so a card, a cart line and an order tell the two apart. Each
// piece's description and fit note say what its own photos show: the women's and the
// men's piece of a style are cut differently (a boxy puffer and a long hooded one, a
// long rain jacket and a pullover anorak), and their pages say so.
const DOWN = {
  material: 'Shell: 100% recycled nylon with a water-resistant finish. Fill: 650-fill responsibly sourced down.',
  /** Said by both down jackets, after what each one looks like: the rating the chat reads, and why it isn't a rain jacket. */
  warmth: 'Warm to about 14°F (−10°C) over a base layer and a fleece. The shell sheds snow and a light shower, but it isn’t waterproof.',
  care: 'Machine wash cold on a gentle cycle. Tumble dry low with two clean tennis balls to lift the down.',
}
const SHELL = {
  material: 'A waterproof, breathable 2.5-layer shell of 100% recycled nylon, with taped seams.',
  care: 'Machine wash cold, then tumble dry low to renew the water-repellent finish.',
}
const MERINO = {
  material: '100% 18.5 micron merino wool.',
  /** Said by both merino tops: what the fibre does. */
  merino: 'Merino stays warm when it’s damp and doesn’t hold odor, so it can go days between washes.',
  care: 'Machine wash cold on a wool cycle. Dry flat.',
}
const FLEECE = {
  material: '100% recycled polyester fleece.',
  care: 'Machine wash cold. Tumble dry low.',
}
const BOOT = {
  material: 'Leather upper with a waterproof, breathable membrane. Cushioned midsole and a rubber lug outsole.',
  fitNote: 'True to size, with room for a hiking sock. Between sizes? Take the larger one.',
  care: 'Brush off dirt and let them dry at room temperature, away from direct heat.',
}
/** Said by both boots, after what each one looks like. */
const BOOT_SUPPORT = 'It supports your ankle on rough ground and grips on wet rock.'
const PANTS = {
  material: '90% nylon, 10% elastane with a water-repellent finish.',
  care: 'Machine wash cold. Hang to dry.',
}

/**
 * In the order the "All" collection lists them, which is also each collection's
 * order: Women's pieces, then Men's, then the ones for everyone, the season's new
 * ones first (newest first), so the home page's New arrivals row (its first four)
 * has the two newest. `n` is the place in the id block, not in this list: sorting by
 * Newest puts the highest id first, so the five New arrivals are 16-20, the newest ids.
 * Best sellers has the Insulated Trail Bottle, so the home page shows a sale price.
 */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    n: 1,
    name: 'Women’s Summit Down Jacket',
    photo: 'summit-down-w',
    style: 'SDW',
    category: 'Jackets',
    collections: ['Women', 'Jackets', 'Best sellers'],
    price: 249,
    colors: ['Ember', 'Black'],
    sizes: WOMENS,
    stock: [6, 12, 0, 10, 5, 8, 14, 16, 12, 7],
    sizeChart: 'womens-tops',
    subtitle: 'Women’s boxy 650-fill down jacket',
    // The photos: a bright orange, boxy puffer cropped at the hip, its shell crinkled; the Black one is a longer,
    // glossy puffer with a high collar. So the copy names neither length nor collar, only what both show.
    description: `A boxy down jacket with big baffles and a high collar, for cold camps and winter walks. The shell has a soft, crinkled finish in Ember and a high shine in Black. ${DOWN.warmth}`,
    fitNote: 'Boxy fit, with room for a fleece underneath. Take your usual size.',
    material: DOWN.material,
    care: DOWN.care,
    countryOfOrigin: 'Vietnam',
    hsCode: '6202.40',
    weightKg: 0.45,
  },
  {
    n: 2,
    name: 'Women’s Ridgeline Rain Shell',
    photo: 'ridgeline-shell-w',
    style: 'RSW',
    category: 'Jackets',
    collections: ['Women', 'Jackets'],
    price: 179,
    colors: ['Moss', 'Slate'],
    sizes: WOMENS,
    stock: [7, 13, 15, 12, 6, 6, 11, 14, 10, 5],
    sizeChart: 'womens-tops',
    subtitle: 'Women’s thigh-length rain shell',
    // The photos: a long, hooded rain jacket in a dark moss green, with a vented yoke across the back.
    description: 'A thigh-length rain jacket for wet hikes and windy ridges, with a hood and a vented yoke across the back that lets the heat out on the climb. Its length keeps the rain off your hips and thighs.',
    fitNote: 'Regular fit, thigh length, with room for a fleece underneath. Take your usual size.',
    ...SHELL,
    countryOfOrigin: 'Vietnam',
    hsCode: '6202.40',
    weightKg: 0.35,
  },
  {
    n: 16,
    name: 'Alpine Fleece Pullover',
    photo: 'alpine-fleece-w',
    style: 'AFP',
    category: 'Fleece',
    collections: ['Women', 'Fleece & layers', 'New arrivals'],
    price: 89,
    colors: ['Oat', 'Forest'],
    sizes: WOMENS,
    stock: [9, 16, 18, 14, 8, 8, 14, 16, 12, 7],
    sizeChart: 'womens-tops',
    subtitle: 'Women’s high-pile fleece half-zip',
    // The photos: an ivory, high-pile fleece half-zip with black trim at the collar, zip and cuffs.
    description: 'A soft, high-pile fleece half-zip with a stand collar and black trim at the collar, zip and cuffs. Wear it as a warm mid layer under a shell, or on its own on a cool morning.',
    fitNote: 'Relaxed fit, with room for a base layer underneath. Take your usual size.',
    ...FLEECE,
    countryOfOrigin: 'Vietnam',
    hsCode: '6110.30',
    weightKg: 0.40,
  },
  {
    n: 3,
    name: 'Women’s Trailhead Hiking Pants',
    photo: 'trailhead-pants-w',
    style: 'THW',
    category: 'Pants',
    collections: ['Women', 'Pants'],
    price: 79,
    colors: ['Stone', 'Black'],
    sizes: WOMENS,
    stock: [8, 15, 18, 14, 7, 9, 16, 19, 15, 8],
    sizeChart: 'womens-pants',
    subtitle: 'Women’s relaxed cargo hiking pants',
    // The photos: loose, grey-khaki cargo pants with flap pockets on the thighs; the Black ones are the same easy cut.
    description: 'Relaxed hiking pants with a roomy leg, deep hand pockets and a flap cargo pocket on each thigh. Light and quick-drying, with a little stretch for the climb.',
    fitNote: 'Relaxed fit with a roomy straight leg, 30 in inseam. Take your usual size.',
    ...PANTS,
    countryOfOrigin: 'Vietnam',
    hsCode: '6204.63',
    weightKg: 0.35,
  },
  {
    n: 4,
    name: 'Women’s Merino Base Layer Top',
    photo: 'merino-top-w',
    style: 'MBW',
    category: 'Base layers',
    collections: ['Women', 'Fleece & layers'],
    price: 69,
    colors: ['Heather gray', 'Black'],
    sizes: WOMENS,
    stock: [10, 18, 22, 16, 9, 11, 19, 23, 17, 10],
    sizeChart: 'womens-tops',
    subtitle: 'Women’s midweight merino quarter-zip',
    // The photos: a relaxed, heather-gray quarter-zip with a stand collar and a soft, brushed face.
    description: `A midweight merino quarter-zip with a stand collar and a soft, brushed face. It’s cut relaxed, to wear on its own on a cool morning or under a fleece and a shell when it turns cold. ${MERINO.merino}`,
    fitNote: 'Relaxed fit that sits at the hip. Take your usual size.',
    material: MERINO.material,
    care: MERINO.care,
    countryOfOrigin: 'Portugal',
    hsCode: '6109.90',
    weightKg: 0.20,
  },
  {
    n: 5,
    name: 'Women’s Canyon Hiking Boot',
    photo: 'canyon-boot-w',
    style: 'CBW',
    category: 'Boots',
    collections: ['Women', 'Footwear', 'Best sellers'],
    price: 159,
    sizes: ['6', '7', '8', '9', '10'],
    stock: [7, 11, 0, 12, 6],
    sizeChart: 'boots',
    subtitle: 'Women’s waterproof hiking boot',
    // The photos: a brown leather boot with mesh panels, a rubber toe cap and a padded collar.
    description: `A mid-height hiking boot in brown leather with breathable mesh panels, a rubber toe cap and a padded collar. ${BOOT_SUPPORT}`,
    ...BOOT,
    countryOfOrigin: 'Vietnam',
    hsCode: '6403.91',
    weightKg: 1.10,
  },
  {
    n: 6,
    name: 'Men’s Summit Down Jacket',
    photo: 'summit-down-m',
    style: 'SDM',
    category: 'Jackets',
    collections: ['Men', 'Jackets', 'Best sellers'],
    price: 249,
    colors: ['Navy', 'Black'],
    sizes: MENS,
    stock: [8, 14, 12, 2, 5, 9, 15, 17, 13, 6],
    sizeChart: 'mens-tops',
    subtitle: 'Men’s hooded 650-fill down jacket',
    // The photos: a long, hooded navy puffer with big baffles; the Black one is hooded too.
    description: `A hooded down jacket with big baffles that falls below the hip, for cold camps and winter walks. ${DOWN.warmth}`,
    fitNote: 'Regular fit that falls below the hip, with room for a fleece underneath. Take your usual size.',
    material: DOWN.material,
    care: DOWN.care,
    countryOfOrigin: 'Vietnam',
    hsCode: '6201.40',
    weightKg: 0.50,
  },
  {
    n: 7,
    name: 'Men’s Ridgeline Rain Shell',
    photo: 'ridgeline-shell-m',
    style: 'RSM',
    category: 'Jackets',
    collections: ['Men', 'Jackets'],
    price: 179,
    colors: ['Ochre', 'Graphite'],
    sizes: MENS,
    stock: [7, 13, 14, 11, 5, 8, 14, 16, 12, 6],
    sizeChart: 'mens-tops',
    subtitle: 'Men’s pullover rain anorak',
    // The photos: a mustard pullover anorak with a drawcord hood and a big front pocket.
    description: 'A pullover rain anorak for wet hikes and windy ridges, with a drawcord hood and a big front pocket. Pull it on over a fleece when the weather turns.',
    fitNote: 'Regular fit, hip length, with room for a fleece underneath. Take your usual size.',
    ...SHELL,
    countryOfOrigin: 'Vietnam',
    hsCode: '6201.40',
    weightKg: 0.40,
  },
  {
    n: 17,
    name: 'Alpine Fleece Jacket',
    photo: 'alpine-fleece-m',
    style: 'AFJ',
    category: 'Fleece',
    collections: ['Men', 'Fleece & layers', 'New arrivals'],
    price: 95,
    colors: ['Olive', 'Charcoal'],
    sizes: MENS,
    stock: [8, 15, 17, 13, 6, 9, 16, 18, 14, 7],
    sizeChart: 'mens-tops',
    subtitle: 'Men’s sweater-knit fleece jacket',
    // The photos: an olive fleece with a sweater-knit face and a zip stand collar. They stop at the chest, so the copy doesn't say how far the zip goes.
    description: 'A warm fleece with a sweater-knit face and a zip stand collar. Wear it as a mid layer under a shell, or on its own on a cool evening in camp.',
    fitNote: 'Regular fit, with room for a base layer underneath. Take your usual size.',
    ...FLEECE,
    countryOfOrigin: 'Vietnam',
    hsCode: '6110.30',
    weightKg: 0.45,
  },
  {
    n: 8,
    // The photos show no zip at the knee, so these are hiking pants, not convertible ones.
    name: 'Men’s Trailhead Hiking Pants',
    photo: 'trailhead-pants-m',
    style: 'THM',
    category: 'Pants',
    collections: ['Men', 'Pants'],
    price: 85,
    colors: ['Khaki', 'Black'],
    sizes: MENS,
    stock: [8, 14, 0, 16, 6, 9, 15, 17, 13, 7],
    sizeChart: 'mens-pants',
    subtitle: 'Men’s stretch hiking pants',
    // The photos: tan, straight-leg pants with a clean front and plain hems; the Black ones have a zip at the ankle.
    description: 'Quick-drying stretch hiking pants with a straight leg and a clean front, for long days on rocky trails. The Black pair has a zip at each ankle that opens the hem to pull them on over boots.',
    fitNote: 'Regular fit with a straight leg, 32 in inseam. Take your usual size.',
    ...PANTS,
    countryOfOrigin: 'Vietnam',
    hsCode: '6203.43',
    weightKg: 0.40,
  },
  {
    n: 9,
    name: 'Men’s Merino Base Layer Top',
    photo: 'merino-top-m',
    style: 'MBM',
    category: 'Base layers',
    collections: ['Men', 'Fleece & layers'],
    price: 69,
    colors: ['Charcoal', 'Navy'],
    sizes: MENS,
    stock: [10, 18, 20, 15, 8, 9, 16, 18, 14, 7],
    sizeChart: 'mens-tops',
    subtitle: 'Men’s merino base layer hoodie',
    // The photos: a close-fitting hooded top in a fine textured knit, with raglan sleeves, in charcoal and in navy.
    description: `A lightweight merino base layer with a close-fitting hood, raglan sleeves and a fine textured knit, to wear next to the skin. ${MERINO.merino}`,
    fitNote: 'Close fit, to wear under other layers. Take your usual size.',
    material: MERINO.material,
    care: MERINO.care,
    countryOfOrigin: 'Portugal',
    hsCode: '6109.90',
    weightKg: 0.22,
  },
  {
    n: 10,
    name: 'Men’s Canyon Hiking Boot',
    photo: 'canyon-boot-m',
    style: 'CBM',
    category: 'Boots',
    collections: ['Men', 'Footwear'],
    price: 159,
    sizes: ['8', '9', '10', '11', '12'],
    stock: [6, 12, 14, 3, 5],
    sizeChart: 'boots',
    subtitle: 'Men’s waterproof hiking boot',
    // The photos: a brown leather boot with olive waxed-canvas panels, black laces through metal hooks, and a lug sole.
    description: `A mid-height hiking boot in brown leather with waxed-canvas panels, black laces through metal hooks, and a lug sole. ${BOOT_SUPPORT}`,
    ...BOOT,
    countryOfOrigin: 'Vietnam',
    hsCode: '6403.91',
    weightKg: 1.25,
  },
  {
    n: 20,
    name: 'Night Trail Headlamp',
    photo: 'trail-headlamp',
    style: 'NTH',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men', 'New arrivals'],
    price: 39,
    stock: [34],
    subtitle: '300-lumen rechargeable headlamp',
    // The photos: an orange lamp with a main beam and two small LEDs beside it, on an orange strap.
    description: 'A 300-lumen headlamp with a main beam and two small LEDs beside it, one of them a red light for camp. Water-resistant (IPX4) against rain and splashes, and it charges by USB-C.',
    fitNote: 'One size. The strap adjusts.',
    material: 'Orange polycarbonate body and an elastic strap.',
    care: 'Wipe clean with a damp cloth.',
    countryOfOrigin: 'China',
    hsCode: '8513.10',
    weightKg: 0.10,
  },
  {
    n: 19,
    name: 'Peak Beanie',
    photo: 'peak-beanie',
    style: 'PKB',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men', 'New arrivals'],
    price: 25,
    colors: ['Rust', 'Black', 'Oat'],
    stock: [24, 0, 18],
    subtitle: 'Merino knit beanie',
    // The photos: a bright rust beanie with a turned-up cuff; a near-black, flecked rib knit in Black; a pale ribbed one in Oat.
    description: 'A warm knit beanie with a turned-up cuff, soft enough to wear all day.',
    fitNote: 'One size. The knit stretches to fit.',
    material: '100% merino wool.',
    care: 'Hand wash cold. Dry flat.',
    countryOfOrigin: 'Portugal',
    hsCode: '6505.00',
    weightKg: 0.10,
  },
  {
    n: 18,
    name: 'Basecamp 45L Pack',
    photo: 'basecamp-pack',
    style: 'BCP',
    category: 'Packs',
    collections: ['Packs & accessories', 'Women', 'Men', 'New arrivals'],
    price: 189,
    colors: ['Spruce', 'Black'],
    stock: [2, 9],
    subtitle: '45-liter backpacking pack',
    // The photos: a green top-loader with mustard straps, a lid, a big front pocket and mesh side pockets.
    description: 'A top-loading pack for overnights and long weekends, with a lid pocket, a big front pocket, mesh side pockets and compression straps to cinch the load. A padded hip belt carries the weight, and a sleeping bag compartment sits at the bottom.',
    fitNote: 'One size, with an adjustable back for torsos 15–20 in.',
    material: 'Recycled nylon with a water-resistant coating.',
    care: 'Spot clean with a damp cloth and let it air dry.',
    countryOfOrigin: 'Vietnam',
    hsCode: '4202.92',
    weightKg: 1.60,
  },
  {
    n: 11,
    name: 'Daybreak 24L Pack',
    photo: 'daybreak-pack',
    style: 'DBP',
    category: 'Packs',
    collections: ['Packs & accessories', 'Women', 'Men'],
    price: 119,
    colors: ['Rust', 'Black'],
    stock: [22, 26],
    subtitle: '24-liter daypack',
    // The photos: a rust daypack with a lid, a stretch front pocket and side compression straps.
    description: 'A daypack for long day hikes, with a lid pocket, a stretch front pocket, side compression straps and stretch side pockets for bottles. Inside, a sleeve takes a 3-liter hydration bladder.',
    fitNote: 'One size. Fits torsos 16–21 in.',
    material: 'Recycled nylon ripstop with a water-resistant coating.',
    care: 'Spot clean with a damp cloth and let it air dry.',
    countryOfOrigin: 'Vietnam',
    hsCode: '4202.92',
    weightKg: 0.85,
  },
  {
    n: 12,
    name: 'Trail Merino Socks, 3-pack',
    photo: 'trail-socks',
    style: 'TMS',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men'],
    price: 29,
    sizes: ['S', 'M', 'L'],
    stock: [30, 42, 36],
    sizeChart: 'socks',
    subtitle: 'Three pairs of ribbed merino hiking socks',
    // The photos: three pairs, red, light blue and charcoal, in a rib knit; one red pair worn, pulled up to the knee.
    description: 'Ribbed merino hiking socks that come up over the calf, with a cushioned sole. Three pairs: one red, one light blue and one charcoal.',
    fitNote: 'Sized by shoe size.',
    material: '64% merino wool, 34% nylon, 2% elastane.',
    care: 'Machine wash warm, inside out. Tumble dry low.',
    countryOfOrigin: 'United States',
    hsCode: '6115.94',
    weightKg: 0.20,
  },
  {
    n: 13,
    name: 'Alpine Trekking Poles',
    photo: 'trekking-poles',
    style: 'ATP',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men'],
    price: 79,
    stock: [16],
    subtitle: 'Adjustable aluminum poles, a pair',
    // The photos: red and black three-section poles with lever locks and black foam grips.
    description: 'A pair of light, adjustable poles in red and black that take weight off your knees on steep climbs and descents. Three sections, each set with a lever lock.',
    fitNote: 'One size. Adjust from 41 to 53 in.',
    material: 'Aluminum shafts, foam grips with wrist straps, and carbide tips.',
    care: 'Wipe dry after use.',
    countryOfOrigin: 'Taiwan',
    hsCode: '6602.00',
    weightKg: 0.55,
  },
  {
    n: 14,
    name: 'Insulated Trail Bottle, 24 oz',
    photo: 'trail-bottle',
    style: 'ITB',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men', 'Best sellers', 'Sale'],
    price: 32,
    compareAt: 40,
    colors: ['Sage', 'Black'],
    stock: [20, 25],
    subtitle: 'Double-wall steel bottle',
    // The photos: a matte green bottle with a screw cap; the Black one has a loop cap.
    description: 'A double-wall steel bottle with a matte finish that keeps drinks cold for 24 hours and hot for 12.',
    fitNote: 'Holds 24 oz.',
    material: 'Double-wall stainless steel, with a leakproof lid.',
    care: 'Hand wash. Not for the dishwasher.',
    countryOfOrigin: 'China',
    hsCode: '9617.00',
    weightKg: 0.40,
  },
  {
    n: 15,
    name: 'Packable Sun Hat',
    photo: 'sun-hat',
    style: 'PSH',
    category: 'Accessories',
    collections: ['Packs & accessories', 'Women', 'Men', 'Sale'],
    price: 35,
    compareAt: 45,
    sizes: ['S/M', 'L/XL'],
    stock: [14, 11],
    sizeChart: 'hats',
    subtitle: 'UPF 50+ wide-brim hat',
    // The photos: a tan wide-brim hat with a stitched brim and a band inside.
    description: 'A tan wide-brim hat with a stitched brim that shades your face and neck, and folds into a pocket.',
    fitNote: 'Two sizes, by head circumference.',
    material: 'Nylon with UPF 50+ sun protection.',
    care: 'Hand wash cold. Reshape and let it air dry.',
    countryOfOrigin: 'Vietnam',
    hsCode: '6505.00',
    weightKg: 0.12,
  },
]

/** A size chart's id: the catalogue's on the store's own channel, the install's prefix elsewhere. */
function chartId(ctx: InstallContext, key: ChartKey): string {
  return `${ctx.home ? 'au' : ctx.prefix}-chart-${key}`
}

/** One variant per colour and size, colour by colour, with its stock. */
function variantsOf(seed: ProductSeed, productId: number, ctx: InstallContext): ProductVariant[] {
  const colors = seed.colors ?? [undefined]
  const sizes = seed.sizes ?? [undefined]
  const combos = colors.flatMap((color) => sizes.map((size) => ({ color, size })))
  if (combos.length !== seed.stock.length) throw new Error(`${seed.name}: ${combos.length} variants, ${seed.stock.length} stock counts`)
  return combos.map(({ color, size }, i): ProductVariant => {
    const values = [color, size].filter((value): value is string => value !== undefined)
    const sku = ['AU', seed.style, color ? AURORA_COLORS[color]!.code : '', size ? size.replace('/', '') : 'OS'].filter(Boolean).join('-')
    return {
      id: ctx.ids.variant(productId, i + 1),
      title: values.length ? values.join(' / ') : 'Default',
      ...(values.length ? { optionValues: values } : {}),
      sku,
      manageInventory: true,
      allowBackorder: false,
      costPrice: (seed.price * 0.4).toFixed(2),
      price: seed.price.toFixed(2),
      ...(seed.compareAt ? { compareAtPrice: seed.compareAt.toFixed(2) } : {}),
      weight: seed.weightKg.toFixed(2),
      stock: { [LOCATION]: seed.stock[i]! },
    }
  })
}

/** Color shown as swatches, then Size as buttons. */
function optionsOf(seed: ProductSeed): ProductOption[] {
  const options: ProductOption[] = []
  if (seed.colors) {
    options.push({
      name: 'Color',
      values: [...seed.colors],
      display: 'swatches',
      swatches: Object.fromEntries(seed.colors.map((color) => [color, AURORA_COLORS[color]!.hex])),
    })
  }
  if (seed.sizes) options.push({ name: 'Size', values: [...seed.sizes], display: 'buttons' })
  return options
}

/**
 * A product's photos: its own two, which show its first colour, then one per other
 * colour photographed (AURORA_COLOURWAY_PHOTOS), with each colour's photos when it has
 * any. A photo is listed under the one colour it shows, so its alt text never names another.
 */
function photosOf(seed: ProductSeed): { imageUrls: string[]; imagesByColor?: Record<string, string[]> } {
  const own = [photo(`${seed.photo}-1.jpg`), photo(`${seed.photo}-2.jpg`)]
  const colourways = Object.entries(AURORA_COLOURWAY_PHOTOS[seed.photo] ?? {})
    .filter(([value]) => seed.colors?.includes(value))
    .map(([value, file]): [string, string[]] => [value, [photo(file)]])
  const first = seed.colors?.[0]
  if (!colourways.length || first === undefined) return { imageUrls: own }
  return {
    imageUrls: [...own, ...colourways.flatMap(([, files]) => files)],
    imagesByColor: Object.fromEntries([[first, own], ...colourways]),
  }
}

/**
 * The twenty products, assigned to the store they are installed in. `status` is
 * left to useCommerce, which derives it from the stock like every other product's.
 */
export function auroraProducts(ctx: InstallContext): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const id = ctx.ids.product(seed.n)
    const variants = variantsOf(seed, id, ctx)
    const handle = toHandle(seed.name)
    const { imageUrls, imagesByColor } = photosOf(seed)
    return {
      id,
      name: seed.name,
      sku: variants[0]!.sku,
      price: seed.price.toFixed(2),
      compareAtPrice: seed.compareAt ? seed.compareAt.toFixed(2) : '',
      inventory: seed.stock.reduce((total, units) => total + units, 0),
      category: 'Apparel',
      vendor: 'Aurora',
      images: imageUrls.length,
      variants: variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [ctx.channelName],
      productType: 'Physical',
      channelIds: [ctx.channelId],
      imageUrls,
      detail: {
        subtitle: seed.subtitle,
        url: handle,
        description: seed.description,
        hasVariants: variants.length > 1,
        options: optionsOf(seed),
        variantsList: variants,
        taxCategory: 'Apparel & Clothing',
        material: seed.material,
        brand: 'Aurora',
        tag: seed.category,
        collection: seed.collections[0] ?? '',
        categories: ['Apparel'],
        width: '',
        length: '',
        height: '',
        weight: seed.weightKg.toFixed(2),
        midCode: '',
        hsCode: seed.hsCode,
        countryOfOrigin: seed.countryOfOrigin,
        discountable: true,
        salesChannels: [ctx.channelName],
        seo: {
          title: `${seed.name} | Aurora Outdoor`,
          metaDescription: `${seed.subtitle}. ${seed.description}`,
          urlHandle: handle,
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
        ...(seed.sizeChart ? { sizeChartId: chartId(ctx, seed.sizeChart) } : {}),
        ...(imagesByColor ? { imagesByColor } : {}),
        fitNote: seed.fitNote,
        care: seed.care,
      },
    }
  })
}

/** What each collection page says under its title. */
const COLLECTION_DESCRIPTIONS: Record<AuroraCollection, string> = {
  Women: 'Jackets, fleece, base layers, pants and boots for women, and the packs and accessories for everyone.',
  Men: 'Jackets, fleece, base layers, pants and boots for men, and the packs and accessories for everyone.',
  Jackets: 'Down for the cold and waterproof shells for the rain, for women and men.',
  'Fleece & layers': 'Merino base layers and fleece mid layers, to wear under a shell or on their own.',
  Pants: 'Quick-drying hiking pants that stretch as you climb.',
  Footwear: 'Waterproof hiking boots for women and men.',
  'Packs & accessories': 'Packs for a day or a weekend, and the small things that go in them.',
  'New arrivals': 'The newest pieces for the season.',
  'Best sellers': 'The pieces our customers come back for.',
  Sale: 'A few pieces at a lower price, while stock lasts. Returns are free, as always.',
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export function auroraCollections(ctx: InstallContext): SnapshotCollection[] {
  return AURORA_COLLECTION_NAMES.map((title, i) => ({
    id: ctx.ids.collection(i + 1),
    title,
    productCount: PRODUCT_SEEDS.filter((p) => p.collections.includes(title)).length,
    updatedAt: AURORA_SEEDED_AT,
    description: COLLECTION_DESCRIPTIONS[title],
  }))
}

// ── Size charts ──────────────────────────────────────────────────────────────
// Body measurements in inches, written as ranges; the size guide converts them to
// centimetres. A row's size is the variant's Size value exactly. One chart serves the
// women's and the men's boots, and one the socks: a column named "Women’s …" or
// "Men’s …" shows only on that audience's piece (src/storefront/audience.ts), and "—"
// marks a size that audience's piece is not made in.

const BETWEEN_SIZES = 'Between sizes? Take the larger size in jackets and fleece, so there’s room to layer, and your usual size in base layers and pants.'
const WOMENS_US_SIZES = 'US sizes: XS is 0-2, S is 4-6, M is 8-10, L is 12-14 and XL is 16.'

const MEASURE = {
  bust: 'Bust: around the fullest part of your bust, under your arms, keeping the tape level.',
  chest: 'Chest: around the fullest part of your chest, under your arms, keeping the tape level.',
  waist: 'Waist: around your natural waist, the narrowest part of your torso.',
  pantsWaist: 'Pants waist: around where you wear your pants, usually just below your navel.',
  hip: 'Hip: around the fullest part of your hips, with your feet together.',
  sleeve: 'Sleeve: from the center back of your neck, over your shoulder and down to your wrist, with your arm relaxed.',
  inseam: 'Inseam: the pants’ inside leg, from the crotch seam to the hem. This is the garment’s length, not a body measurement.',
  foot: 'Foot length: stand on a sheet of paper with your heel against a wall, mark the tip of your longest toe, and measure from the wall to the mark. Measure both feet in the evening, in the socks you hike in, and go by the longer one.',
  shoe: 'Shoe size: the US size of the shoes or boots you wear the socks in.',
  head: 'Head circumference: around your head just above your eyebrows and ears, where a hat sits.',
}

interface ChartSeed {
  key: ChartKey
  name: string
  columns: string[]
  rows: [size: string, ...values: string[]][]
  fitNote: string
  /** One line per measurement. */
  howToMeasure: string[]
}

const CHART_SEEDS: ChartSeed[] = [
  {
    key: 'womens-tops',
    name: 'Women’s tops',
    columns: ['Bust', 'Waist', 'Hip'],
    rows: [['XS', '32-33', '25-26', '35-36'], ['S', '34-35', '27-28', '37-38'], ['M', '36-37', '29-30', '39-40'], ['L', '38-40', '31-33', '41-43'], ['XL', '41-43', '34-36', '44-46']],
    fitNote: `Body measurements, for jackets, fleece and the merino quarter-zip. Jackets and fleece are cut with room for a layer underneath, and the quarter-zip is relaxed. ${WOMENS_US_SIZES} ${BETWEEN_SIZES}`,
    howToMeasure: [MEASURE.bust, MEASURE.waist, MEASURE.hip],
  },
  {
    key: 'mens-tops',
    name: 'Men’s tops',
    columns: ['Chest', 'Waist', 'Sleeve'],
    rows: [['S', '35-37', '29-31', '33'], ['M', '38-40', '32-34', '34'], ['L', '41-43', '35-37', '35'], ['XL', '44-46', '38-40', '36'], ['XXL', '47-49', '41-43', '37']],
    fitNote: `Body measurements, for jackets, fleece and base layers. Jackets and fleece are cut with room for a layer underneath; base layers fit close. ${BETWEEN_SIZES}`,
    howToMeasure: [MEASURE.chest, MEASURE.waist, MEASURE.sleeve],
  },
  {
    key: 'womens-pants',
    name: 'Women’s pants',
    columns: ['Waist', 'Hip', 'Inseam'],
    rows: [['XS', '25-26', '35-36', '30'], ['S', '27-28', '37-38', '30'], ['M', '29-30', '39-40', '30'], ['L', '31-33', '41-43', '30'], ['XL', '34-36', '44-46', '30']],
    fitNote: `Waist and hip are body measurements. Every size has a 30 in inseam. ${WOMENS_US_SIZES}`,
    howToMeasure: [MEASURE.waist, MEASURE.hip, MEASURE.inseam],
  },
  {
    key: 'mens-pants',
    name: 'Men’s pants',
    columns: ['Waist', 'Hip', 'Inseam'],
    rows: [['S', '29-31', '36-38', '32'], ['M', '32-34', '39-41', '32'], ['L', '35-37', '42-44', '32'], ['XL', '38-40', '45-47', '32'], ['XXL', '41-43', '48-50', '32']],
    fitNote: 'Waist and hip are body measurements. Every size has a 32 in inseam.',
    howToMeasure: [MEASURE.pantsWaist, MEASURE.hip, MEASURE.inseam],
  },
  {
    key: 'boots',
    name: 'Boots',
    columns: ['Women’s foot length', 'Men’s foot length'],
    rows: [['6', '9.25', '—'], ['7', '9.5', '—'], ['8', '9.875', '10'], ['9', '10.25', '10.375'], ['10', '10.5', '10.75'], ['11', '—', '11.125'], ['12', '—', '11.5']],
    fitNote: 'The size is the US size. Our boots are true to size, with room for a hiking sock. Between sizes? Take the larger one.',
    howToMeasure: [MEASURE.foot],
  },
  {
    key: 'socks',
    name: 'Socks',
    columns: ['Women’s shoe size', 'Men’s shoe size'],
    rows: [['S', '4-6.5', '—'], ['M', '7-9.5', '6-8.5'], ['L', '10-12', '9-12']],
    fitNote: 'Socks go by your US shoe size. Between sizes? Take the larger one.',
    howToMeasure: [MEASURE.shoe],
  },
  {
    key: 'hats',
    name: 'Hats',
    columns: ['Head circumference'],
    rows: [['S/M', '21.25-22.5'], ['L/XL', '22.75-24']],
    fitNote: 'The inner band adjusts by about half an inch. Between sizes? Take the larger one.',
    howToMeasure: [MEASURE.head],
  },
]

/** The seven size charts. Every product with a Size option names one (`detail.sizeChartId`). */
export function auroraSizeCharts(ctx: InstallContext): SizeChart[] {
  return CHART_SEEDS.map((chart) => ({
    id: chartId(ctx, chart.key),
    channelId: ctx.channelId,
    name: chart.name,
    unit: 'in',
    columns: [...chart.columns],
    rows: chart.rows.map(([size, ...values]) => ({ size, values })),
    fitNote: chart.fitNote,
    howToMeasure: chart.howToMeasure.join('\n'),
  }))
}

// ── Campaigns ────────────────────────────────────────────────────────────────
// One running (it started four days before the store is opened, so its orders and
// revenue have had time to come in), one over and one to come, so the Campaigns page
// shows every state and the bar above the header has an offer. No jacket is on sale,
// so TRAIL20 never meets a sale price.

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's campaigns, as of `ctx.today` ("YYYY-MM-DD"). */
export function auroraCampaigns(ctx: InstallContext): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(ctx.today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: `camp-${ctx.prefix}-trail-season`,
      channelId: ctx.channelId,
      name: 'Trail season',
      targets: ['Jackets'],
      startDate: day(-4), startTime: '00:00', endDate: day(20), endTime: '23:59',
      updatedAt: stamp(day(-4)),
      offer: { message: 'Trail season: 20% off jackets with code TRAIL20', code: 'TRAIL20', discountPct: 20 },
      orders: 18,
      revenue: 358_560,
    },
    {
      id: `camp-${ctx.prefix}-layer-up`,
      channelId: ctx.channelId,
      name: 'Layer up',
      targets: ['Fleece & layers'],
      startDate: day(-40), startTime: '08:00', endDate: day(-33), endTime: '23:59',
      updatedAt: stamp(day(-33)),
      offer: { message: 'Layer up: 15% off fleece and base layers with code LAYERUP15', code: 'LAYERUP15', discountPct: 15 },
      orders: 37,
      revenue: 251_940,
    },
    {
      id: `camp-${ctx.prefix}-boot-week`,
      channelId: ctx.channelId,
      name: 'Boot week',
      targets: ['Footwear'],
      startDate: day(30), startTime: '08:00', endDate: day(37), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Boot week: 15% off hiking boots with code BOOTS15', code: 'BOOTS15', discountPct: 15 },
      orders: 0,
      revenue: 0,
    },
  ]
}

// ── Merchandising ────────────────────────────────────────────────────────────
// Search rules and recommendation engines (the store is connected to Merchandise
// Cloud from the start). Each changes what a shopper sees: what a search finds
// (src/storefront/search.ts) or the row under a product.

const MERCH_UPDATED = 'Nov 24, 2026'

export function auroraMerchandising(ctx: InstallContext): {
  synonyms: Synonym[]
  redirects: PageRedirect[]
  searchPins: SearchPin[]
  engines: RecommendationEngine[]
} {
  const id = (name: string): string => `${ctx.home ? 'au' : ctx.prefix}-${name}`
  const row = { channelId: ctx.channelId, updatedAt: MERCH_UPDATED }
  const storeUrl = `https://${ctx.domain}`
  /** The ids, in this store, of the products with these photo names (two styles share a name). */
  const pin = (...photos: string[]): string[] => photos.map((name) => String(ctx.ids.product(PRODUCT_SEEDS.find((p) => p.photo === name)!.n)))
  return {
    synonyms: [
      // "raincoat" and "puffer" are in no product's copy; with the rules they find the shells and the down jackets.
      { id: id('syn-raincoat'), ...row, status: 'active', type: 'one_way', queries: ['raincoat', 'rain jacket', 'rain coat'], leadsTo: ['rain shell'] },
      { id: id('syn-puffer'), ...row, status: 'active', type: 'one_way', queries: ['puffer', 'puffer jacket', 'puffy'], leadsTo: ['down jacket'] },
      // "backpack" finds the backpacking pack by its own copy; the rule adds the daypack.
      { id: id('syn-backpack'), ...row, status: 'active', type: 'one_way', queries: ['backpack', 'rucksack'], leadsTo: ['daypack', 'backpacking pack'] },
      { id: id('syn-beanie'), ...row, status: 'active', type: 'two_way', queries: ['beanie', 'toque', 'winter hat'], leadsTo: [] },
    ],
    redirects: [
      { id: id('red-returns'), ...row, queries: ['returns', 'return', 'refund', 'exchange', 'return policy'], leadsTo: `${storeUrl}/page/shipping-and-returns` },
      { id: id('red-sizing'), ...row, queries: ['size guide', 'size chart', 'sizing'], leadsTo: `${storeUrl}/page/size-guide` },
    ],
    searchPins: [
      // Without the pin, "hiking" lists the women's hiking pants first (their name says it); the pin puts the boots first.
      { id: id('pin-hiking'), ...row, query: 'hiking', pinnedProductIds: pin('canyon-boot-w', 'canyon-boot-m') },
    ],
    engines: [
      { id: id('engine-goes-with'), ...row, name: 'Goes well with', page: 'product', type: 'frequently_purchased_together', status: 'active', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:15 AM` },
      // Switched off: turn it on, and the first one off, and the row under a product shows the newest pieces.
      { id: id('engine-new-arrivals'), ...row, name: 'New arrivals', page: 'product', type: 'newest_products', status: 'inactive', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:20 AM` },
    ],
  }
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant answers on the apparel profile (src/chatbot/assistantProfiles.ts):
// orders, sizes and fit, fabric and care, returns, and, because the store's own pieces
// say how they stand up to the weather, rain, warmth, layering and boot, sock and hat
// sizes. What it knows about the store is written here in short answers, each agreeing
// with the page it names.

/** What differs from a new chatbot's settings. */
export const AURORA_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Aurora Outdoor',
  storeType: 'Fashion & Apparel',
  brandName: 'Aurora assistant',
  brandSubtitle: 'Sizing, weather and returns',
  primaryColor: '#373842',
  position: 'right',
  launcherText: 'Need help?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi, I’m the Aurora assistant. I can help you find your size, tell you whether a piece is waterproof or warm enough, look up an order, or answer questions about returns. What can I help with?',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'Where is my order?', enabled: true },
    { id: 2, text: 'What size boots should I get?', enabled: true },
    { id: 3, text: 'Is the rain shell waterproof?', enabled: true },
    { id: 4, text: 'How warm is the down jacket?', enabled: true },
    { id: 5, text: 'How do returns work?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 4, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and refunds', url: '/policies/refund-policy', text: 'Returns are free within 30 days of delivery, sale pieces included. Clothes must be unworn and unwashed with the tags on, and boots worn indoors only. Write to hello@aurora.example with your order number and we’ll email you a prepaid label. We refund your original payment method within 5 business days of receiving the return.' },
        { title: 'Changing a size', url: '/page/shipping-and-returns', text: 'The quickest way to get a different size is to order the size you want and return the first one. Shipping and returns are both free.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices and payment', url: '/policies/terms-of-service', text: 'Prices are in US dollars and shipping is free, so the total at checkout is what you pay. You can pay by card, Apple Pay or Google Pay. One discount code per order.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 7, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Shipping times and cost', url: '/page/shipping-and-returns', text: 'Shipping is free on every order. Delivery takes 3 to 5 business days, and we email you a tracking link when your order ships.' },
        { title: 'Where we ship', url: '/page/shipping-and-returns', text: 'We ship to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.' },
        { title: 'Finding your size', url: '/page/size-guide', text: 'Every product page has a size guide in inches and centimeters and a fit note that says how the piece fits. Boots go by foot length, socks by shoe size and the sun hat by head circumference. Between sizes? Take the larger size in jackets, fleece and boots.' },
        { title: 'Fabric and care', url: '/page/fabric-and-care', text: 'Wash rain shells cold and tumble dry low to renew the water-repellent finish. Wash down jackets cold on a gentle cycle and tumble dry low with two clean tennis balls. Wash merino cold on a wool cycle and dry it flat. Brush boots clean and dry them away from direct heat.' },
        { title: 'Waterproof or water-resistant?', url: '/page/fabric-and-care', text: 'A waterproof piece keeps out steady rain: the rain shells have taped seams and the boots a waterproof membrane. A water-resistant piece, like the down jacket or the packs, sheds a light shower but not steady rain.' },
        // The ratings as the products' own pages give them (DOWN.warmth); nothing else has one.
        { title: 'How warm are the jackets and fleece?', url: '/page/fabric-and-care', text: 'The women’s and men’s Summit Down Jackets are warm to about 14°F (−10°C) over a base layer and a fleece. The Alpine Fleece Pullover and the Alpine Fleece Jacket are warm mid layers, to wear under a shell or on their own on a cool day, and the merino base layers stay warm when they’re damp; we don’t give them a temperature rating. The rain shells are for wind and rain, with room for a fleece underneath. How warm you are also depends on the wind, how hard you’re moving and what you wear underneath.' },
        { title: 'Contact and hours', url: '/page/contact', text: 'Write to hello@aurora.example or call (303) 555-0187. We answer within one business day, Monday to Friday, 9 a.m. to 5 p.m. MT.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. Each answer is the one the assistant gives today. */
export const AURORA_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'sam.rivera@example.com', startedAt: 'Today, 8:42 AM', topic: 'Sizing', resolved: true,
    messages: [
      { from: 'shopper', text: 'What size boots should I get?', time: '8:42 AM' },
      { from: 'bot', text: 'Canyon Hiking Boot: True to size, with room for a hiking sock. Between sizes? Take the larger one. Is it the women’s or the men’s Canyon Hiking Boot? Tell me which, and I’ll check its size chart.', time: '8:42 AM' },
      { from: 'shopper', text: 'Women’s. My foot is 10.25 inches long', time: '8:43 AM' },
      { from: 'bot', text: 'With a 10.25 in foot, take size 9 in the women’s Canyon Hiking Boot. Size 9 is foot length 10.25 in. True to size, with room for a hiking sock. Between sizes? Take the larger one.', time: '8:43 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 6:15 PM', topic: 'Weather and warmth', resolved: true,
    messages: [
      { from: 'shopper', text: 'Is the Summit Down Jacket warm enough for 20°F?', time: '6:15 PM' },
      { from: 'bot', text: 'Yes, 20°F (−7°C) is within its rating. Summit Down Jacket: Warm to about 14°F (−10°C) over a base layer and a fleece.', time: '6:15 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Mon, 1:05 PM', topic: 'Returns', resolved: true,
    messages: [
      { from: 'shopper', text: 'How do returns work?', time: '1:05 PM' },
      { from: 'bot', text: 'Returns are free within 30 days of delivery, sale pieces included. Clothes must be unworn and unwashed with the tags on, and boots worn indoors only. Write to hello@aurora.example with your order number and we’ll email you a prepaid label. We refund your original payment method within 5 business days of receiving the return.', time: '1:05 PM' },
    ],
  },
]

// ── Storefront header and footer ─────────────────────────────────────────────

const linkTo = (title: AuroraCollection): StorefrontLink => ({ label: title, href: `/collections/${toHandle(title)}` })
/** The header's menu, centred on its own row under the wordmark. */
const HEADER_LINKS = (['Women', 'Men', 'Jackets', 'Footwear', 'Packs & accessories', 'Sale'] as const).map(linkTo)
/** The Aurora store's page about its trips and photos, where its social icons lead. */
const COMMUNITY = '/page/community'

export const AURORA_CHROME: StorefrontChrome = {
  // Drawn as typed, in the theme's serif.
  wordmark: 'Aurora',
  wordmarkIcon: null,
  // A running campaign's message shows above the header on every page; with none running, nothing does.
  announcementAboveHeader: true,
  // Search shows while the store is connected to Merchandise Cloud (it starts connected).
  headerTools: ['search', 'account', 'wishlist'],
  headerSearch: 'pill',
  accountHref: '/account',
  // `twitter` is Lucide's icon for the network; the header and the builder canvas draw X's own mark for the link labelled X.
  social: [
    { label: 'Facebook', href: COMMUNITY, icon: 'facebook' },
    { label: 'Instagram', href: COMMUNITY, icon: 'instagram' },
    { label: 'X', href: COMMUNITY, icon: 'twitter' },
  ],
  searchPlaceholder: 'Search...',
  nav: HEADER_LINKS,
  mobileNav: [
    { label: 'Shop all', href: '/collections/all' },
    ...(['New arrivals', 'Best sellers', 'Women', 'Men', 'Jackets', 'Fleece & layers', 'Pants', 'Footwear', 'Packs & accessories', 'Sale'] as const).map(linkTo),
    { label: 'Our story', href: '/page/about' },
    { label: 'Join us on the trail', href: COMMUNITY },
    { label: 'Size guide', href: '/page/size-guide' },
    { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
    { label: 'Fabric and care', href: '/page/fabric-and-care' },
    { label: 'Contact', href: '/page/contact' },
    { label: 'Your account', href: '/account' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: (['Women', 'Men', 'New arrivals', 'Sale'] as const).map(linkTo),
    },
    {
      heading: { label: 'Help', href: '/page/contact' },
      items: [
        { label: 'Size guide', href: '/page/size-guide' },
        { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
        { label: 'Contact', href: '/page/contact' },
      ],
    },
    {
      heading: { label: 'About', href: '/page/about' },
      items: [
        { label: 'Our story', href: '/page/about' },
        { label: 'Fabric and care', href: '/page/fabric-and-care' },
      ],
    },
  ],
  newsletter: {
    heading: 'Stay in touch',
    placeholder: 'Email address',
    consent: [
      'I agree to the ',
      { label: 'terms of service', href: '/policies/terms-of-service' },
      ' and the ',
      { label: 'privacy policy', href: '/policies/privacy-policy' },
      '.',
    ],
    button: 'Subscribe',
    busy: 'Subscribing...',
    success: 'Thanks. You’re on the list.',
  },
  copyright: '© 2026 Aurora Outdoor (demo store)',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────

export function auroraMenus(ctx: InstallContext): StoreMenu[] {
  const menu = (name: string, handle: string, key: string, links: StorefrontLink[]): StoreMenu => ({
    id: `menu-${ctx.prefix}-${key}`,
    channelId: ctx.channelId,
    name,
    handle,
    status: 'Active',
    updatedAt: MERCH_UPDATED,
    items: links.map((link, i) => ({ id: `mi-${ctx.prefix}-${key}-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  })
  return [
    menu('Main menu', 'main-menu', 'main', AURORA_CHROME.nav),
    menu('Footer menu', 'footer-menu', 'footer', AURORA_CHROME.footerColumns.flatMap((column) => column.items)),
  ]
}

// ── Pages and policies ───────────────────────────────────────────────────────
// No blog posts, so nothing links to a blog. Every fact agrees with the checkout,
// the chatbot's knowledge and the other pages.

const PAGES: [kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string][] = [
  [
    'page', 'about', 'Our story',
    '<h2>Keep the world adventurous</h2><p>Aurora makes outdoor clothing and footwear for women and men: down jackets, rain shells, fleece, merino base layers, hiking pants and boots, and the packs and small things that go with them. We wear every piece on the trails near our home in Colorado before it goes on sale.</p><h3>How we make it</h3><ul><li>Recycled nylon and polyester wherever they do the job as well, and merino next to the skin.</li><li>650-fill down from responsibly sourced suppliers.</li><li>Every jacket page says whether it keeps out the rain, and the down jackets’ pages how warm they are, so you know what you are buying.</li><li>Shipping is free on every order, and returns are free within 30 days.</li></ul>',
    'Aurora makes outdoor clothing, boots and packs for women and men, tested on the trail.',
  ],
  [
    'page', 'community', 'Join us on the trail',
    '<h2>Join us on the trail</h2><p>This is where we share trip reports from our team, trail photos from our customers, and a first look at new pieces before they arrive.</p><h3>Share your trip</h3><p>Send us a photo from your last hike to hello@aurora.example. With your permission we may share it, with your name and the trail it was taken on.</p><h3>Plan your next one</h3><p>Not sure what to pack? Our <a href="/page/size-guide">size guide</a> helps you find the right fit, and <a href="/page/fabric-and-care">Fabric and care</a> explains what keeps you dry and warm.</p>',
    'Where Aurora Outdoor shares trip reports, trail photos and new pieces.',
  ],
  [
    'page', 'contact', 'Contact',
    '<h2>We’re here to help</h2><p>Questions about an order, a size or a return? Write or call, and we’ll answer within one business day.</p><ul><li><strong>Email:</strong> hello@aurora.example</li><li><strong>Phone:</strong> (303) 555-0187</li><li><strong>Hours:</strong> Monday to Friday, 9 a.m. to 5 p.m. MT</li></ul><h3>Before you write</h3><p>You can see every order and its status in <a href="/account">your account</a>. For sizing, every product page has a size guide, and our <a href="/page/size-guide">size guide page</a> explains how to measure.</p>',
    'Contact Aurora Outdoor about an order, a size or a return.',
  ],
  [
    'page', 'size-guide', 'Size guide',
    '<h2>Finding your size</h2><p>Every product page has its own size guide, in inches and centimeters, and a fit note that says how the piece fits.</p><h3>Jackets, fleece and base layers</h3><ul><li><strong>Bust or chest:</strong> around the fullest part, under your arms, keeping the tape level.</li><li><strong>Waist:</strong> around your natural waist, the narrowest part of your torso.</li><li><strong>Hip:</strong> around the fullest part of your hips, with your feet together.</li><li><strong>Sleeve:</strong> from the center back of your neck, over your shoulder and down to your wrist.</li></ul><p>Jackets and fleece are cut with room for a layer underneath. Between sizes? Take the larger size in jackets and fleece, and your usual size in base layers and pants.</p><h3>Pants</h3><p>Women’s pants have a 30 in inseam and men’s a 32 in inseam. Women’s sizes: XS is US 0–2, S is 4–6, M is 8–10, L is 12–14 and XL is 16.</p><h3>Boots</h3><p>Boots are in US sizes and true to size, with room for a hiking sock. Stand on a sheet of paper with your heel against a wall, mark your longest toe, and measure from the wall to the mark: the size guide on the boot’s page gives the foot length of each size. Between sizes? Take the larger one.</p><h3>Socks and hats</h3><p>Socks go by your US shoe size. The sun hat goes by head circumference, measured just above your eyebrows and ears.</p><p>If it doesn’t fit, returns are free within 30 days.</p>',
    'How to measure yourself and find your size in Aurora jackets, layers, pants, boots, socks and hats.',
  ],
  [
    'page', 'shipping-and-returns', 'Shipping and returns',
    '<h2>Free shipping on every order</h2><p>Delivery takes 3 to 5 business days, and we email you a tracking link when your order ships.</p><p>We ship to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.</p><h2>Free returns within 30 days</h2><p>Send back clothes unworn and unwashed with the tags on, and boots worn indoors only, within 30 days of delivery. Sale pieces too.</p><ol><li>Write to hello@aurora.example with your order number.</li><li>We email you a prepaid return label.</li><li>We refund your original payment method within 5 business days of receiving the return.</li></ol><h3>Need a different size?</h3><p>The quickest way is to order the size you want and return the first one. Shipping and returns are both free. The full terms are in our <a href="/policies/refund-policy">refund policy</a>.</p>',
    'Free shipping on every order and free returns within 30 days.',
  ],
  [
    'page', 'fabric-and-care', 'Fabric and care',
    '<h2>Fabric and care</h2><p>Each product page lists what the piece is made of and how to wash it, under “Fabric and care”.</p><h3>Waterproof or water-resistant?</h3><p>A waterproof piece keeps out steady rain: our rain shells are a waterproof, breathable 2.5-layer shell with taped seams, and our boots have a waterproof membrane. A water-resistant piece, like the down jacket or the packs, sheds a light shower but not steady rain.</p><h3>How warm?</h3><p>Our down jackets, for women and men, are warm to about 14°F (−10°C) over a base layer and a fleece. Fleece is a warm mid layer, and merino stays warm when it’s damp; we don’t give them a temperature rating. The rain shells are for wind and rain, with room for a fleece underneath. How warm you are also depends on the wind, how hard you’re moving and what you wear underneath.</p><h3>Rain shells</h3><p>Machine wash cold, then tumble dry low: the heat renews the water-repellent finish. Never use fabric softener.</p><h3>Down</h3><p>Machine wash cold on a gentle cycle, then tumble dry low with two clean tennis balls to lift the down. Store it loose, not squeezed into a stuff sack.</p><h3>Fleece and merino</h3><p>Wash fleece cold and tumble dry low. Wash merino cold on a wool cycle and dry it flat; it needs washing less often than you think.</p><h3>Boots and packs</h3><p>Brush boots clean and let them dry at room temperature, away from direct heat. Spot clean packs with a damp cloth.</p>',
    'What keeps out the rain, and how to wash shells, down, fleece, merino, boots and packs.',
  ],
  [
    'policy', 'refund-policy', 'Refund policy',
    '<h2>Refund policy</h2><p>You can return clothes unworn and unwashed with the tags on, and boots worn indoors only, within 30 days of delivery. Returns are free, sale pieces included.</p><h3>How to return</h3><p>Write to hello@aurora.example with your order number and we’ll email you a prepaid return label.</p><h3>Refunds</h3><p>We refund the full price you paid to your original payment method, within 5 business days of receiving the return.</p><p>More on delivery and returns: <a href="/page/shipping-and-returns">Shipping and returns</a>.</p>',
    'How returns and refunds work at Aurora Outdoor.',
  ],
  [
    'policy', 'privacy-policy', 'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Email</h3><p>We only send marketing email if you sign up for it, and every message has an unsubscribe link.</p><h3>Your wishlist</h3><p>The pieces you save to your wishlist are kept in this browser only.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@aurora.example.</p>',
    'What personal data Aurora Outdoor collects, why, and your rights.',
  ],
  [
    'policy', 'terms-of-service', 'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in US dollars, and shipping is free on every order.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. If a size sells out before we can ship it, we cancel that item and refund it in full.</p><h3>Discount codes</h3><p>One code per order. A code applies only to the collections and dates it names, and can’t be exchanged for cash.</p><h3>Delivery and returns</h3><p>Delivery takes 3 to 5 business days. You can return unworn clothes, and boots worn indoors only, within 30 days of delivery for a full refund.</p>',
    'The terms that apply when you buy from the Aurora Outdoor store.',
  ],
]

export function auroraContent(ctx: InstallContext): ContentEntry[] {
  return PAGES.map(([kind, handle, title, body, seoDescription]) => ({
    id: `${ctx.prefix}-${kind}-${handle}`,
    channelId: ctx.channelId,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Aurora Outdoor`,
    seoDescription,
    imageName: '',
    publishedAt: '',
    updatedAt: MERCH_UPDATED,
  }))
}

export const AURORA_BLOG_SEO: BlogSeoSettings = {
  title: 'Aurora Journal',
  metaDescription: 'Trail notes, layering tips and new pieces from the Aurora team.',
}

// ── Theme templates ──────────────────────────────────────────────────────────
// Drawn by the sections drawing (AURORA_THEME_STYLES.drawing), with what the Aurora
// theme adds to it:
//   header             `menuStyle: 'Stacked'` (social icons, the wordmark centred, the
//                      search pill and the tools on one row, the menu centred under it)
//                      and `social` (the chrome's social icons at the left).
//   footer             `layout: 'Menus and newsletter'`: the link columns under small
//                      uppercase heads beside the newsletter, then the copyright.
//   image-banner       `contentPosition: 'Middle left'`: white words at the left over a
//                      dark shade, the first button white.
//   collection-grid    on the home page: `layout` 'Carousel', `tileStyle` 'Label over
//                      photo' and landscape tiles: UAT's Featured Collections slider.
//   collection-grid    on the collection template: `cardStyle: 'Framed'`, UAT's product
//                      card scheme (a 5px frame, the photo inset, Add to cart below), and
//                      `facets` (the filter groups, in order).
// Every page wears the same header and footer.

const HEADER = { menuStyle: 'Stacked', social: true, sticky: false, colorScheme: 'Light' } as const
const FOOTER = { layout: 'Menus and newsletter', showSocial: false, columns: 3, colorScheme: 'Light' } as const
const DELIVERY_AND_RETURNS = 'Free shipping on every order, delivered in 3 to 5 business days. Free returns within 30 days of delivery: clothes unworn with the tags on, boots worn indoors only.'

/** The collections on the home page's Featured Collections slider, with their photos. */
const FEATURED_TILES: [title: AuroraCollection, image: string][] = [
  ['Jackets', AURORA_PHOTOS.tileJackets],
  ['Footwear', AURORA_PHOTOS.tileFootwear],
  ['Packs & accessories', AURORA_PHOTOS.tilePacks],
  ['Fleece & layers', AURORA_PHOTOS.tileLayers],
]

export function auroraThemeTemplates(ctx: InstallContext): Record<TemplateType, ThemeSection[]> {
  const id = (name: string): string => `${ctx.prefix}-${name}`
  const header = (template: TemplateType) => createSection('header', { ...HEADER }, id(`${template}-header`))
  const footer = (template: TemplateType) => createSection('footer', { ...FOOTER }, id(`${template}-footer`))
  const row = (key: string, settings: Record<string, string | boolean>) => createBlock('collapsible-row', { text: '', open: false, ...settings }, id(`row-${key}`))
  return {
    home: [
      header('home'),
      {
        ...createSection('image-banner', {
          headline: 'Keep the world adventurous forever',
          subheadline: 'Jackets, layers, boots and packs for women and men, made for rain, wind and the long way around.',
          height: 'Small',
          contentPosition: 'Middle left',
          image: AURORA_PHOTOS.hero,
        }, id('home-hero')),
        blocks: [createBlock('button', { label: 'Shop new arrivals', link: '/collections/new-arrivals' }, id('hero-new-arrivals'))],
      },
      {
        ...createSection('collection-grid', {
          title: 'Featured Collections',
          layout: 'Carousel',
          tileStyle: 'Label over photo',
          tileRatio: 'Landscape',
          columns: 3,
          background: 'Page',
        }, id('home-collections')),
        blocks: FEATURED_TILES.map(([title, image]) => {
          const handle = toHandle(title)
          return createBlock('collection', { label: title, link: `/collections/${handle}`, image }, id(`collection-${handle}`))
        }),
      },
      createSection('featured-products', { eyebrow: '', title: 'New arrivals', collection: 'new-arrivals', productCount: 4, layout: 'Grid' }, id('home-new-arrivals')),
      createSection('image-with-text', {
        heading: 'Made for the trail',
        body: 'We wear every piece on the trails near our home in Colorado before it goes on sale: in the rain, in the snow and on the long way down. If it doesn’t keep up, it doesn’t make the cut.',
        buttonLabel: 'Read our story',
        buttonLink: '/page/about',
        imageSide: 'Left',
        image: AURORA_PHOTOS.storyTrail,
      }, id('home-story')),
      createSection('featured-products', { eyebrow: '', title: 'Best sellers', collection: 'best-sellers', productCount: 4, layout: 'Grid' }, id('home-best-sellers')),
      footer('home'),
    ],
    product: [
      header('product'),
      {
        // Square, as the framed card's photo is.
        ...createSection('product-detail', { galleryLayout: 'Thumbnails', imageRatio: 'Square', sizeGuide: true, fitment: false, showReviews: false }, id('product-detail')),
        blocks: [
          row('description', { title: 'Description', source: 'description', open: true }),
          row('fit', { title: 'Fit and sizing', source: 'fit' }),
          row('fabric-care', { title: 'Fabric and care', source: 'fabric-care' }),
          row('delivery-returns', { title: 'Delivery and returns', source: 'delivery-returns', text: DELIVERY_AND_RETURNS }),
        ],
      },
      createSection('featured-products', { eyebrow: '', title: 'You may also like' }, id('product-related')),
      footer('product'),
    ],
    collection: [
      header('collection'),
      // The product grid: filters for size, color, the kind of piece and price, in that order; sort, quick add, and the framed card.
      createSection('collection-grid', { title: '', columns: 3, filters: true, facets: 'size,color,category,price', sort: true, quickAdd: true, cardStyle: 'Framed' }, id('collection-grid')),
      footer('collection'),
    ],
    cart: [
      header('cart'),
      createSection('cart-summary', { showNotes: false, upsells: true }, id('cart-summary')),
      footer('cart'),
    ],
  }
}
