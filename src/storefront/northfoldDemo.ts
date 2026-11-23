// The "Northfold (demo)" store: everything seeded for sales channel `northfold-demo`.
//
// Northfold is a fictional clothing label for women and men: tees, shirts, knitwear,
// outerwear, trousers and a few accessories, in sizes and colours, priced in US
// dollars, with no subscriptions. Every name, product and line of copy was written
// for this store; the photos are free-licence stock photos kept in
// public/storefront/northfold (credits in its CREDITS.md). It is the showcase store of
// the Northfold theme, so src/storefront/demoStores/northfold.ts installs it in any
// store that applies that theme.
//
// Unlike vitahealDemo.ts, most of it is built from an InstallContext: the ids, the
// channel, the domain and the string-id prefix of the store it is installed in, so a
// copy in another store gets ids of its own and every link follows them. Constants
// hold what no install changes (the theme's styles, the header and footer, the
// chatbot's knowledge, which link pages and collections only).
//
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and no real brand (the shared suite,
// tests/storefront/demoStores.test.ts, checks it). Shipping copy matches the
// checkout: free delivery in 3 to 5 business days, to the countries the US-dollar
// checkout offers (src/storefront/checkoutProfile.ts). The checkout has no Click &
// collect here. Pure: types and the pure rule modules only, so Node runs it
// (`npm run test:storefront`, tests/storefront/northfoldDemo.test.ts checks the
// reference tables of the catalogue).

import type { Product, ProductOption, ProductVariant } from '../stores/useCommerce.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { BlogSeoSettings, ContentEntry } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../stores/useMerchandising.ts'
import type { StoreCampaign } from './campaigns.ts'
import type { InstallContext, SizeChart, SnapshotCollection } from './demoStores/types.ts'
import { productHandle, toHandle } from './handles.ts'
import { createBlock, createSection } from './themeSections.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from './themeSections.ts'

export const NORTHFOLD_CHANNEL_ID = 'northfold-demo'
export const NORTHFOLD_CHANNEL_NAME = 'Northfold (demo)'

/** When the seed was written: the channel's dates, the theme's publish date and the collections' last update. */
export const NORTHFOLD_SEEDED_AT = '2026-11-19T09:00:00Z'

/**
 * The store's sales channel. It starts connected to Merchandise Cloud, so search,
 * its rules and "Goes well with" work on the first visit; a restore connects it again.
 */
export const NORTHFOLD_CHANNEL: SalesChannel = {
  id: NORTHFOLD_CHANNEL_ID,
  accountId: '2000290',
  name: NORTHFOLD_CHANNEL_NAME,
  storeNumber: 13,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Women’s and men’s clothing in natural fabrics. Size and color variants; prices in US dollars.',
  connectedClouds: ['commerce', 'store_builder', 'merchandise'],
  createdAt: NORTHFOLD_SEEDED_AT,
  updatedAt: NORTHFOLD_SEEDED_AT,
  lastActivityAt: NORTHFOLD_SEEDED_AT,
  merchandising: { status: 'connected', health: 'healthy', lastSyncAt: NORTHFOLD_SEEDED_AT, lastActivityAt: NORTHFOLD_SEEDED_AT },
  webStore: {
    domain: '2000290-13.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: true,
    currency: 'USD',
    demo: true,
  },
}

/** What the store's own page in the admin says about it. The company is made up, like the brand. */
export const NORTHFOLD_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '$48.2K',
  themeName: 'Northfold 1.0',
  business: [
    { label: 'Legal name', value: 'Northfold Clothing Co.' },
    { label: 'Business type', value: 'Corporation' },
    { label: 'Tax ID (EIN)', value: '12-3456789' },
    { label: 'Phone', value: '(207) 555-0142' },
    { label: 'Public email', value: 'hello@northfold.example' },
    { label: 'Support email', value: 'hello@northfold.example' },
    { label: 'Website', value: '2000290-13.uat.maropost.store' },
    { label: 'Street', value: '18 Ferry Lane' },
    { label: 'City / region', value: 'Portland, ME 04101' },
    { label: 'Country', value: 'United States' },
  ],
} as const

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * Ink on warm off-white, Instrument Serif headings over DM Sans, square corners,
 * black buttons and a red for sale prices. Drawn with the sections drawing.
 * Contrast (WCAG 2.1): text on the page 16.4:1, the sale red 6.2:1, white on the red badge 6.5:1.
 */
export const NORTHFOLD_THEME_STYLES: ThemeStyles = {
  brandColor: '#111111',
  accentColor: '#111111',
  background: '#faf8f5',
  textColor: '#1a1a1a',
  headingFont: 'Instrument Serif',
  bodyFont: 'DM Sans',
  cornerRadius: 0,
  buttonStyle: 'solid',
  saleBadgeColor: '#b3261e',
  customBadgeColor: '#1a1a1a',
  soldOutBadgeColor: '#66625c',
  drawing: 'sections',
  // Read by the sections drawing only. Muted text on the page 5.7:1, on the surface 5.2:1.
  buttonColor: '#111111',
  surfaceColor: '#f1eee9',
  mutedColor: '#66625c',
  dividerColor: '#e4dfd8',
  headingCase: 'As typed',
}

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const NORTHFOLD_PHOTO_DIR = '/storefront/northfold'

const photo = (file: string): string => `${NORTHFOLD_PHOTO_DIR}/${file}`

/** The photos the theme's home page uses. Product photos are named on each product. */
export const NORTHFOLD_PHOTOS = {
  hero: photo('hero.jpg'),
  tileNewIn: photo('tile-new-in.jpg'),
  tileKnitwear: photo('tile-knitwear.jpg'),
  tileOuterwear: photo('tile-outerwear.jpg'),
  tileSale: photo('tile-sale.jpg'),
  storyKnit: photo('story-knit.jpg'),
  storyStudio: photo('story-studio.jpg'),
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

/** The collections, in the order the admin and the menu list them. A product is in one when it names it. */
export const NORTHFOLD_COLLECTION_NAMES = ['New in', 'Women', 'Men', 'Knitwear', 'Outerwear', 'Sale'] as const
export type NorthfoldCollection = (typeof NORTHFOLD_COLLECTION_NAMES)[number]

/** The kind of garment (`detail.tag`), which the storefront's Category filter offers. */
export const NORTHFOLD_CATEGORIES = ['Tees', 'Shirts', 'Knitwear', 'Outerwear', 'Trousers', 'Accessories'] as const
export type NorthfoldCategory = (typeof NORTHFOLD_CATEGORIES)[number]

/**
 * Every colour a product comes in: its swatch and the code its SKUs use. A light
 * swatch sits on the page with a hairline ring; the chosen one is marked by a dark
 * ring and its name, never by colour alone.
 */
export const NORTHFOLD_COLORS: Readonly<Record<string, { hex: string; code: string }>> = {
  White: { hex: '#f5f5f2', code: 'WHT' },
  Black: { hex: '#1a1a1a', code: 'BLK' },
  Sage: { hex: '#9caf88', code: 'SGE' },
  'Heather Gray': { hex: '#a7a9ac', code: 'HGR' },
  'Navy Stripe': { hex: '#1f2a44', code: 'NVS' },
  'Black Stripe': { hex: '#2b2b2b', code: 'BKS' },
  'Pale Blue': { hex: '#b9cfe4', code: 'PBL' },
  'Blue Stripe': { hex: '#7d9cc0', code: 'BLS' },
  Ivory: { hex: '#f3ecdc', code: 'IVR' },
  Oat: { hex: '#d8cbb3', code: 'OAT' },
  Navy: { hex: '#1f2a44', code: 'NVY' },
  Rust: { hex: '#a4502b', code: 'RST' },
  Ecru: { hex: '#ece4d2', code: 'ECR' },
  Forest: { hex: '#2f4a3a', code: 'FOR' },
  Camel: { hex: '#b9875a', code: 'CML' },
  Olive: { hex: '#6b6b3f', code: 'OLV' },
  Khaki: { hex: '#c3b091', code: 'KHK' },
  Stone: { hex: '#cfc6b5', code: 'STN' },
  Charcoal: { hex: '#3b3b3d', code: 'CHR' },
  Sand: { hex: '#d2bf9f', code: 'SND' },
  Cream: { hex: '#efe7d6', code: 'CRM' },
}

/** The size charts, by the key a product names: Products › Size charts, and the size guide on the product page. */
type ChartKey = 'womens-tops' | 'mens-tops' | 'womens-trousers' | 'mens-trousers' | 'outerwear'

/** Where every variant is stocked (the location Vitaheal uses too). */
const LOCATION = 'Oxford Warehouse'

interface ProductSeed {
  /** Its place in the "All" collection and in the id block: product n is id `ctx.ids.product(n)` (3001 at home). */
  n: number
  name: string
  /** The style's code in its SKUs: NF-<style>-<colour code>-<size>. */
  style: string
  category: NorthfoldCategory
  /** The first is the breadcrumb. */
  collections: NorthfoldCollection[]
  /** USD, every variant the same. */
  price: number
  /** The "was" price of a style on sale. */
  compareAt?: number
  /** The Color option's values, in order; absent for a product in one colour only. */
  colors?: string[]
  /** The Size option's values, in order; absent for a one-size product. */
  sizes?: string[]
  /** The colour code of a product with no options (its one SKU). */
  skuColor?: string
  /** Units on hand per variant: colour by colour, its sizes in order. 0 is a sold-out size. */
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
  /** Files in NORTHFOLD_PHOTO_DIR, the gallery's default order. */
  photos: string[]
  /**
   * For a product photographed in every colour: each colour's photos. A photo is listed
   * only under the colour it shows (a fabric close-up is of one colour), because the
   * gallery's alt text names that colour.
   */
  colorPhotos?: Record<string, string[]>
}

/**
 * In the order the "All" collection lists them, which is also each collection's
 * order: a collection lists its products in this order. `n` is the place in the id
 * block, not in this list. New in is 15-20, the newest ids.
 *
 * Women opens with pieces photographed on women (the Organic Cotton Tee's white
 * and black photos are worn by a man), and Women and Men list their own pieces
 * before the ones for everyone (the scarf, the tote and the beanie).
 */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    n: 3,
    name: 'Breton Stripe Top',
    style: 'BRT',
    category: 'Tees',
    collections: ['Women'],
    price: 52,
    colors: ['Navy Stripe', 'Black Stripe'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [9, 18, 24, 18, 10, 6, 12, 16, 12, 7],
    sizeChart: 'womens-tops',
    subtitle: "Women's long-sleeve stripe top",
    description: 'A long-sleeve boat-neck top in sturdy cotton interlock, with the stripe knitted in, not printed.',
    fitNote: `Regular fit, hip length. Model is 5'10" and wears S.`,
    material: '100% cotton interlock',
    care: 'Machine wash cold. Dry flat to keep the length.',
    countryOfOrigin: 'Portugal',
    hsCode: '6109.10',
    weightKg: 0.25,
    photos: ['breton-stripe-top-1.jpg', 'breton-stripe-top-2.jpg'],
  },
  {
    n: 5,
    name: 'Poplin Relaxed Shirt',
    style: 'POP',
    category: 'Shirts',
    collections: ['Women'],
    price: 72,
    colors: ['White', 'Blue Stripe'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [9, 18, 24, 18, 10, 6, 12, 16, 12, 7],
    sizeChart: 'womens-tops',
    subtitle: "Women's oversized shirt",
    description: 'A crisp cotton poplin shirt cut loose through the body, to wear tucked, open or knotted at the waist.',
    fitNote: `Relaxed and slightly oversized. Model is 5'9" and wears XS. Size down for a closer fit.`,
    material: '100% cotton poplin',
    care: 'Machine wash cold. Iron on medium.',
    countryOfOrigin: 'Portugal',
    hsCode: '6206.30',
    weightKg: 0.25,
    photos: ['poplin-relaxed-shirt-1.jpg', 'poplin-relaxed-shirt-2.jpg'],
  },
  {
    n: 6,
    name: 'Washed Silk Blouse',
    style: 'SLK',
    category: 'Shirts',
    collections: ['Women', 'Sale'],
    price: 88,
    compareAt: 118,
    colors: ['Ivory', 'Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [7, 14, 19, 14, 8, 5, 10, 13, 10, 6],
    sizeChart: 'womens-tops',
    subtitle: "Women's silk shirt",
    description: 'A fluid sand-washed silk blouse with a soft matte finish and hidden buttons.',
    fitNote: `Relaxed fit with a straight hem. Model is 5'10" and wears S.`,
    material: '100% sand-washed silk',
    care: 'Hand wash cold or dry clean. Do not tumble dry.',
    countryOfOrigin: 'Portugal',
    hsCode: '6206.10',
    weightKg: 0.18,
    photos: ['washed-silk-blouse-1.jpg', 'washed-silk-blouse-2.jpg'],
  },
  {
    n: 7,
    name: 'Merino Crewneck Sweater',
    style: 'MCR',
    category: 'Knitwear',
    collections: ['Women', 'Knitwear'],
    price: 128,
    colors: ['Oat', 'Navy', 'Rust'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [11, 0, 29, 22, 13, 7, 14, 2, 14, 8, 5, 11, 14, 11, 6],
    sizeChart: 'womens-tops',
    subtitle: "Women's fine-knit sweater",
    description: 'A lightweight crewneck in extra-fine merino wool, warm without bulk and soft enough to wear next to the skin.',
    fitNote: `Regular fit, true to size. Model is 5'9" and wears S.`,
    material: '100% extra-fine merino wool',
    care: 'Hand wash cold or use a wool cycle. Dry flat.',
    countryOfOrigin: 'Italy',
    hsCode: '6110.11',
    weightKg: 0.35,
    photos: ['merino-crewneck-sweater-oat.jpg', 'merino-crewneck-sweater-navy.jpg', 'merino-crewneck-sweater-rust.jpg', 'merino-crewneck-sweater-detail.jpg'],
    colorPhotos: { Oat: ['merino-crewneck-sweater-oat.jpg', 'merino-crewneck-sweater-detail.jpg'], Navy: ['merino-crewneck-sweater-navy.jpg'], Rust: ['merino-crewneck-sweater-rust.jpg'] },
  },
  {
    n: 1,
    name: 'Organic Cotton Tee',
    style: 'OCT',
    category: 'Tees',
    collections: ['Women'],
    price: 34,
    colors: ['White', 'Black', 'Sage'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [14, 29, 38, 29, 17, 10, 19, 26, 19, 11, 7, 14, 19, 14, 8],
    sizeChart: 'womens-tops',
    subtitle: "Women's crewneck tee",
    description: 'A soft, midweight tee in organic cotton jersey with a clean crew neck. It keeps its shape wash after wash.',
    fitNote: `Regular fit. Model is 5'9" and wears S.`,
    material: '100% organic cotton jersey, 180 gsm',
    care: 'Machine wash cold. Tumble dry low. Warm iron if needed.',
    countryOfOrigin: 'Portugal',
    hsCode: '6109.10',
    weightKg: 0.20,
    photos: ['organic-cotton-tee-white.jpg', 'organic-cotton-tee-black.jpg', 'organic-cotton-tee-sage.jpg', 'organic-cotton-tee-detail.jpg'],
    colorPhotos: { White: ['organic-cotton-tee-white.jpg'], Black: ['organic-cotton-tee-black.jpg'], Sage: ['organic-cotton-tee-sage.jpg', 'organic-cotton-tee-detail.jpg'] },
  },
  {
    n: 2,
    name: 'Heavyweight Pocket Tee',
    style: 'PKT',
    category: 'Tees',
    collections: ['Men'],
    price: 38,
    colors: ['White', 'Black', 'Heather Gray'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [13, 25, 34, 25, 15, 8, 17, 22, 17, 10, 6, 13, 17, 13, 7],
    sizeChart: 'mens-tops',
    subtitle: "Men's boxy tee",
    description: 'A heavyweight cotton tee with a chest pocket and a dropped shoulder. Thick enough to wear on its own into fall.',
    fitNote: `Boxy fit with a dropped shoulder. Model is 6'1" and wears M.`,
    material: '100% cotton jersey, 240 gsm',
    care: 'Machine wash cold. Hang to dry.',
    countryOfOrigin: 'Portugal',
    hsCode: '6109.10',
    weightKg: 0.25,
    photos: ['heavyweight-pocket-tee-1.jpg', 'heavyweight-pocket-tee-2.jpg'],
  },
  {
    n: 4,
    name: 'Oxford Button-Down Shirt',
    style: 'OXF',
    category: 'Shirts',
    collections: ['Men'],
    price: 78,
    colors: ['Pale Blue', 'White'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [11, 22, 29, 22, 13, 7, 14, 19, 14, 8],
    sizeChart: 'mens-tops',
    subtitle: "Men's everyday shirt",
    description: 'A button-down collar shirt in soft cotton oxford cloth. Smart enough for work, easy enough for the weekend.',
    fitNote: `Regular fit. Model is 6'0" and wears M. Between sizes? Take the larger one.`,
    material: '100% cotton oxford cloth',
    care: 'Machine wash warm. Iron on medium.',
    countryOfOrigin: 'Portugal',
    hsCode: '6205.20',
    weightKg: 0.30,
    photos: ['oxford-button-down-shirt-1.jpg', 'oxford-button-down-shirt-2.jpg'],
  },
  {
    n: 8,
    name: 'Cotton Cable Sweater',
    style: 'CBL',
    category: 'Knitwear',
    collections: ['Men', 'Knitwear', 'Sale'],
    price: 118,
    compareAt: 148,
    colors: ['Ecru', 'Forest'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [7, 14, 19, 14, 8, 5, 10, 13, 10, 6],
    sizeChart: 'mens-tops',
    subtitle: "Men's cable-knit sweater",
    description: 'A chunky cable sweater in pure cotton, knitted for texture and warmth without the itch.',
    fitNote: `Relaxed fit. Model is 6'1" and wears M.`,
    material: '100% cotton',
    care: 'Machine wash cold on a wool cycle. Dry flat.',
    countryOfOrigin: 'Portugal',
    hsCode: '6110.20',
    weightKg: 0.70,
    photos: ['cotton-cable-sweater-1.jpg', 'cotton-cable-sweater-2.jpg'],
  },
  {
    n: 9,
    name: 'Wool-Blend Car Coat',
    style: 'CAR',
    category: 'Outerwear',
    collections: ['Women', 'Outerwear'],
    price: 268,
    colors: ['Camel', 'Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [6, 13, 0, 13, 7, 4, 8, 11, 2, 5],
    sizeChart: 'outerwear',
    subtitle: "Women's mid-length coat",
    description: 'A mid-thigh car coat in a dense wool blend, fully lined, with a concealed placket and deep pockets.',
    fitNote: `Relaxed fit, cut to wear over a sweater. Model is 5'10" and wears S. Take your usual size.`,
    material: '70% wool, 30% recycled polyamide. Lining: 100% viscose',
    care: 'Dry clean only.',
    countryOfOrigin: 'Portugal',
    hsCode: '6202.20',
    weightKg: 1.40,
    photos: ['wool-blend-car-coat-camel.jpg', 'wool-blend-car-coat-black.jpg', 'wool-blend-car-coat-detail.jpg'],
    colorPhotos: { Camel: ['wool-blend-car-coat-camel.jpg', 'wool-blend-car-coat-detail.jpg'], Black: ['wool-blend-car-coat-black.jpg'] },
  },
  {
    n: 10,
    name: 'Waxed Cotton Field Jacket',
    style: 'FLD',
    category: 'Outerwear',
    collections: ['Men', 'Outerwear'],
    price: 228,
    colors: ['Olive', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [6, 13, 17, 13, 7, 4, 8, 11, 8, 5],
    sizeChart: 'outerwear',
    subtitle: "Men's four-pocket jacket",
    description: 'A waxed cotton jacket that sheds rain and softens with age, with a corduroy collar and four patch pockets.',
    fitNote: `Regular fit with room for a sweater underneath. Model is 6'0" and wears M.`,
    material: '100% waxed cotton. Collar: 100% cotton corduroy',
    care: 'Do not wash. Wipe clean with a damp cloth and re-wax once a year.',
    countryOfOrigin: 'Portugal',
    hsCode: '6201.30',
    weightKg: 1.20,
    photos: ['waxed-cotton-field-jacket-1.jpg', 'waxed-cotton-field-jacket-2.jpg'],
  },
  {
    n: 11,
    name: 'Slim Chino',
    style: 'CHN',
    category: 'Trousers',
    collections: ['Men'],
    price: 88,
    colors: ['Khaki', 'Navy', 'Olive'],
    sizes: ['28', '30', '32', '34', '36'],
    stock: [10, 20, 0, 20, 12, 7, 13, 18, 13, 8, 5, 10, 13, 10, 6],
    sizeChart: 'mens-trousers',
    subtitle: "Men's slim chinos",
    description: 'Slim cotton twill chinos with a touch of stretch, a tapered leg and a 32 in inseam.',
    fitNote: `Slim through the thigh with a tapered leg, 32 in inseam. Model is 6'1" and wears 32.`,
    material: '98% cotton, 2% elastane twill',
    care: 'Machine wash cold, inside out. Hang to dry.',
    countryOfOrigin: 'Portugal',
    hsCode: '6203.42',
    weightKg: 0.50,
    photos: ['slim-chino-1.jpg', 'slim-chino-2.jpg'],
  },
  {
    n: 12,
    name: 'Wide-Leg Pleated Trouser',
    style: 'WLT',
    category: 'Trousers',
    collections: ['Women'],
    price: 108,
    colors: ['Black', 'Stone'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [0, 18, 24, 18, 10, 6, 12, 16, 12, 7],
    sizeChart: 'womens-trousers',
    subtitle: "Women's high-rise trousers",
    description: 'High-rise trousers with front pleats and a wide leg that falls straight from the hip, in a fluid twill that resists creasing.',
    fitNote: `High rise with a wide leg, 30 in inseam. Model is 5'9" and wears S.`,
    material: '64% recycled polyester, 33% viscose, 3% elastane',
    care: 'Machine wash cold on a gentle cycle. Hang to dry.',
    countryOfOrigin: 'Portugal',
    hsCode: '6204.63',
    weightKg: 0.45,
    photos: ['wide-leg-pleated-trouser-1.jpg', 'wide-leg-pleated-trouser-2.jpg'],
  },
  {
    n: 15,
    name: 'Linen Overshirt',
    style: 'LOS',
    category: 'Outerwear',
    collections: ['Men', 'Outerwear', 'New in'],
    price: 98,
    colors: ['Sand', 'Black', 'Olive'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [9, 18, 24, 0, 10, 6, 12, 16, 12, 7, 4, 9, 12, 9, 5],
    sizeChart: 'outerwear',
    subtitle: "Men's shirt jacket",
    description: 'A washed linen and cotton overshirt, heavy enough to wear open over a tee as a light jacket.',
    fitNote: `Relaxed fit. Model is 6'1" and wears M.`,
    material: '55% linen, 45% cotton twill',
    care: 'Machine wash cold. Line dry. Warm iron if needed.',
    countryOfOrigin: 'Portugal',
    hsCode: '6205.90',
    weightKg: 0.55,
    photos: ['linen-overshirt-sand.jpg', 'linen-overshirt-black.jpg', 'linen-overshirt-olive.jpg', 'linen-overshirt-detail.jpg'],
    colorPhotos: { Sand: ['linen-overshirt-sand.jpg', 'linen-overshirt-detail.jpg'], Black: ['linen-overshirt-black.jpg'], Olive: ['linen-overshirt-olive.jpg'] },
  },
  {
    n: 16,
    name: 'Lambswool Cardigan',
    style: 'CDG',
    category: 'Knitwear',
    collections: ['Women', 'Knitwear', 'New in'],
    price: 138,
    colors: ['Cream', 'Charcoal'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [7, 14, 19, 14, 8, 5, 10, 13, 10, 6],
    sizeChart: 'womens-tops',
    subtitle: "Women's V-neck cardigan",
    description: 'A relaxed V-neck cardigan in brushed lambswool with horn-effect buttons.',
    fitNote: `Relaxed fit, hip length. Model is 5'8" and wears S.`,
    material: '100% lambswool',
    care: 'Hand wash cold. Dry flat.',
    countryOfOrigin: 'United Kingdom',
    hsCode: '6110.11',
    weightKg: 0.45,
    photos: ['lambswool-cardigan-1.jpg', 'lambswool-cardigan-2.jpg'],
  },
  {
    n: 17,
    name: 'Merino Quarter-Zip',
    style: 'QZP',
    category: 'Knitwear',
    collections: ['Men', 'Knitwear', 'New in'],
    price: 138,
    colors: ['Navy', 'Charcoal'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [7, 14, 19, 14, 8, 5, 10, 13, 10, 6],
    sizeChart: 'mens-tops',
    subtitle: "Men's zip-neck sweater",
    description: 'A fine merino sweater with a quarter-zip neck, light enough to wear over a shirt on a cool day.',
    fitNote: `Regular fit. Model is 6'0" and wears M.`,
    material: '100% extra-fine merino wool',
    care: 'Hand wash cold or use a wool cycle. Dry flat.',
    countryOfOrigin: 'Italy',
    hsCode: '6110.11',
    weightKg: 0.40,
    photos: ['merino-quarter-zip-1.jpg', 'merino-quarter-zip-2.jpg'],
  },
  {
    n: 18,
    name: 'Quilted Liner Jacket',
    style: 'QLT',
    category: 'Outerwear',
    collections: ['Women', 'Outerwear', 'New in'],
    price: 148,
    colors: ['Olive', 'Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: [7, 14, 19, 14, 8, 5, 10, 13, 10, 6],
    sizeChart: 'outerwear',
    subtitle: "Women's lightweight jacket",
    description: 'A lightweight quilted jacket with recycled insulation. Wear it on its own, or under a coat when it turns cold.',
    fitNote: `Regular fit, light enough to wear under a coat. Model is 5'9" and wears S.`,
    material: 'Shell: 100% recycled nylon. Fill: 100% recycled polyester',
    care: 'Machine wash cold on a gentle cycle. Tumble dry low.',
    countryOfOrigin: 'Portugal',
    hsCode: '6202.40',
    weightKg: 0.50,
    photos: ['quilted-liner-jacket-1.jpg', 'quilted-liner-jacket-2.jpg'],
  },
  {
    n: 19,
    name: 'Relaxed Wool Trouser',
    style: 'WTR',
    category: 'Trousers',
    collections: ['Men', 'New in'],
    price: 148,
    colors: ['Charcoal'],
    sizes: ['30', '32', '34', '36'],
    stock: [12, 19, 14, 8],
    sizeChart: 'mens-trousers',
    subtitle: "Men's flannel trousers",
    description: 'Relaxed wool flannel trousers with a straight leg and a little stretch, for cold days and dressier ones.',
    fitNote: `Relaxed fit with a straight leg, 32 in inseam. Model is 6'1" and wears 32.`,
    material: '98% wool, 2% elastane flannel',
    care: 'Dry clean only.',
    countryOfOrigin: 'Portugal',
    hsCode: '6203.41',
    weightKg: 0.55,
    photos: ['relaxed-wool-trouser-1.jpg', 'relaxed-wool-trouser-2.jpg'],
  },
  {
    n: 13,
    name: 'Lambswool Scarf',
    style: 'SCF',
    category: 'Accessories',
    collections: ['Women', 'Men'],
    price: 68,
    colors: ['Camel', 'Charcoal'],
    stock: [22, 16],
    subtitle: 'Woven wool scarf',
    description: 'A generous scarf woven from soft lambswool, finished with a short fringe.',
    fitNote: 'One size: 72 x 12 in, plus fringe.',
    material: '100% lambswool',
    care: 'Hand wash cold. Dry flat.',
    countryOfOrigin: 'United Kingdom',
    hsCode: '6214.20',
    weightKg: 0.25,
    photos: ['lambswool-scarf-1.jpg', 'lambswool-scarf-2.jpg'],
  },
  {
    n: 14,
    name: 'Canvas Market Tote',
    style: 'TOT',
    category: 'Accessories',
    collections: ['Women', 'Men'],
    price: 48,
    skuColor: 'NAT',
    stock: [36],
    subtitle: 'Heavy canvas tote bag',
    description: 'A roomy tote in heavyweight cotton canvas with an inside pocket and handles long enough to wear on the shoulder.',
    fitNote: 'One size: 16 x 15 x 5 in, 24 in handles.',
    material: '100% cotton canvas, 16 oz',
    care: 'Spot clean with a damp cloth.',
    countryOfOrigin: 'United States',
    hsCode: '4202.92',
    weightKg: 0.40,
    photos: ['canvas-market-tote-1.jpg', 'canvas-market-tote-2.jpg'],
  },
  {
    n: 20,
    name: 'Ribbed Merino Beanie',
    style: 'BNE',
    category: 'Accessories',
    collections: ['Women', 'Men', 'New in'],
    price: 38,
    colors: ['Charcoal', 'Oat', 'Rust'],
    stock: [28, 20, 14],
    subtitle: 'Rib-knit hat',
    description: 'A soft rib-knit beanie in merino wool with a deep turn-up.',
    fitNote: 'One size. The rib stretches to fit.',
    material: '100% merino wool',
    care: 'Hand wash cold. Dry flat.',
    countryOfOrigin: 'Portugal',
    hsCode: '6505.00',
    weightKg: 0.10,
    photos: ['ribbed-merino-beanie-1.jpg', 'ribbed-merino-beanie-2.jpg'],
  },
]

const seedOf = (n: number): ProductSeed => {
  const seed = PRODUCT_SEEDS.find((p) => p.n === n)
  if (!seed) throw new Error(`Northfold has no product ${n}`)
  return seed
}

/** A size chart's id: the catalogue's on the store's own channel, the install's prefix elsewhere. */
function chartId(ctx: InstallContext, key: ChartKey): string {
  return `${ctx.home ? 'nf' : ctx.prefix}-chart-${key}`
}

/** One variant per colour and size, colour by colour, with its stock. */
function variantsOf(seed: ProductSeed, productId: number, ctx: InstallContext): ProductVariant[] {
  const colors = seed.colors ?? [undefined]
  const sizes = seed.sizes ?? [undefined]
  const combos = colors.flatMap((color) => sizes.map((size) => ({ color, size })))
  if (combos.length !== seed.stock.length) throw new Error(`${seed.name}: ${combos.length} variants, ${seed.stock.length} stock counts`)
  return combos.map(({ color, size }, i): ProductVariant => {
    const values = [color, size].filter((value): value is string => value !== undefined)
    const colorCode = color ? NORTHFOLD_COLORS[color]!.code : seed.skuColor
    return {
      id: ctx.ids.variant(productId, i + 1),
      title: values.length ? values.join(' / ') : 'Default',
      ...(values.length ? { optionValues: values } : {}),
      sku: `NF-${seed.style}-${colorCode}-${size ?? 'OS'}`,
      manageInventory: true,
      allowBackorder: false,
      costPrice: (seed.price * 0.38).toFixed(2),
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
      swatches: Object.fromEntries(seed.colors.map((color) => [color, NORTHFOLD_COLORS[color]!.hex])),
    })
  }
  if (seed.sizes) options.push({ name: 'Size', values: [...seed.sizes], display: 'buttons' })
  return options
}

/**
 * The twenty products, assigned to the store they are installed in. `status` is
 * left to useCommerce, which derives it from the stock like every other product's.
 */
export function northfoldProducts(ctx: InstallContext): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const id = ctx.ids.product(seed.n)
    const variants = variantsOf(seed, id, ctx)
    const handle = toHandle(seed.name)
    return {
      id,
      name: seed.name,
      sku: variants[0]!.sku,
      price: seed.price.toFixed(2),
      compareAtPrice: seed.compareAt ? seed.compareAt.toFixed(2) : '',
      inventory: seed.stock.reduce((total, units) => total + units, 0),
      category: 'Apparel',
      vendor: 'Northfold',
      images: seed.photos.length,
      variants: variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [ctx.channelName],
      productType: 'Physical',
      channelIds: [ctx.channelId],
      imageUrls: seed.photos.map(photo),
      detail: {
        subtitle: seed.subtitle,
        url: handle,
        description: seed.description,
        hasVariants: variants.length > 1,
        options: optionsOf(seed),
        variantsList: variants,
        taxCategory: 'Apparel & Clothing',
        material: seed.material,
        brand: 'Northfold',
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
          title: `${seed.name} | Northfold`,
          metaDescription: `${seed.subtitle}. ${seed.description}`,
          urlHandle: handle,
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
        ...(seed.sizeChart ? { sizeChartId: chartId(ctx, seed.sizeChart) } : {}),
        ...(seed.colorPhotos
          ? { imagesByColor: Object.fromEntries(Object.entries(seed.colorPhotos).map(([color, files]) => [color, files.map(photo)])) }
          : {}),
        fitNote: seed.fitNote,
        care: seed.care,
      },
    }
  })
}

/** The storefront link of product n, as installed. */
function productLink(ctx: InstallContext, n: number): string {
  return `/products/${productHandle({ name: seedOf(n).name, id: ctx.ids.product(n) })}`
}

/** What each collection page says under its title (the catalogue, section 7). */
const COLLECTION_DESCRIPTIONS: Record<NorthfoldCollection, string> = {
  'New in': 'The latest arrivals for the season.',
  Women: 'Tees, shirts, knitwear, coats and trousers for women.',
  Men: 'Tees, shirts, knitwear, jackets and trousers for men.',
  Knitwear: 'Merino, lambswool and cotton knits for women and men.',
  Outerwear: 'Coats, jackets and overshirts to wear through fall and winter.',
  Sale: 'A few styles at a lower price. Returns are free, as always.',
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export function northfoldCollections(ctx: InstallContext): SnapshotCollection[] {
  return NORTHFOLD_COLLECTION_NAMES.map((title, i) => ({
    id: ctx.ids.collection(i + 1),
    title,
    productCount: PRODUCT_SEEDS.filter((p) => p.collections.includes(title)).length,
    updatedAt: NORTHFOLD_SEEDED_AT,
    description: COLLECTION_DESCRIPTIONS[title],
  }))
}

// ── Size charts ──────────────────────────────────────────────────────────────
// Body measurements in inches, written as ranges; the size guide converts them to
// centimetres. A row's size is the variant's Size value exactly. Women's US sizes are
// in the fit note: a column of them would be converted to centimetres with the rest.

const BETWEEN_SIZES = 'Between sizes? Take the larger size for knitwear and outerwear, and your usual size for tees and shirts.'
const WOMENS_US_SIZES = 'US sizes: XS is 0-2, S is 4-6, M is 8-10, L is 12-14 and XL is 16.'

const MEASURE = {
  bust: 'Bust: around the fullest part of your bust, under your arms, keeping the tape level.',
  chest: 'Chest: around the fullest part of your chest, under your arms, keeping the tape level.',
  waist: 'Waist: around your natural waist, the narrowest part of your torso.',
  trouserWaist: 'Trouser waist: around where you wear your trousers, usually just below your navel.',
  hip: 'Hip: around the fullest part of your hips, with your feet together.',
  neck: 'Neck: around the base of your neck, with a finger’s room under the tape.',
  sleeve: 'Sleeve: from the center back of your neck, over your shoulder and down to your wrist, with your arm relaxed.',
  inseam: 'Inseam: the trouser’s inside leg, from the crotch seam to the hem. This is the garment’s length, not a body measurement.',
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
    fitNote: `Body measurements. Our tops are cut true to size; each product’s fit note says when a style is cut loose. ${WOMENS_US_SIZES} ${BETWEEN_SIZES}`,
    howToMeasure: [MEASURE.bust, MEASURE.waist, MEASURE.hip],
  },
  {
    key: 'mens-tops',
    name: 'Men’s tops',
    columns: ['Chest', 'Neck', 'Sleeve'],
    rows: [['XS', '32-34', '13.5-14', '32'], ['S', '35-37', '14.5-15', '33'], ['M', '38-40', '15.5-16', '34'], ['L', '41-43', '16.5-17', '35'], ['XL', '44-46', '17.5-18', '36']],
    fitNote: `Body measurements. Our tops are cut true to size; each product’s fit note says when a style is cut loose. ${BETWEEN_SIZES}`,
    howToMeasure: [MEASURE.chest, MEASURE.neck, MEASURE.sleeve],
  },
  {
    key: 'womens-trousers',
    name: 'Women’s trousers',
    columns: ['Waist', 'Hip', 'Inseam'],
    rows: [['XS', '25-26', '35-36', '30'], ['S', '27-28', '37-38', '30'], ['M', '29-30', '39-40', '30'], ['L', '31-33', '41-43', '30'], ['XL', '34-36', '44-46', '30']],
    fitNote: `Waist and hip are body measurements. Every size has a 30 in inseam. ${WOMENS_US_SIZES}`,
    howToMeasure: [MEASURE.waist, MEASURE.hip, MEASURE.inseam],
  },
  {
    key: 'mens-trousers',
    name: 'Men’s trousers',
    columns: ['Waist', 'Hip', 'Inseam'],
    rows: [['28', '28-29', '35-36', '32'], ['30', '30-31', '37-38', '32'], ['32', '32-33', '39-40', '32'], ['34', '34-35', '41-42', '32'], ['36', '36-37', '43-44', '32']],
    fitNote: 'The size is your waist in inches. Every size has a 32 in inseam.',
    howToMeasure: [MEASURE.trouserWaist, MEASURE.hip, MEASURE.inseam],
  },
  {
    key: 'outerwear',
    name: 'Outerwear',
    columns: ['Women’s bust', 'Women’s sleeve', 'Men’s chest', 'Men’s sleeve'],
    rows: [['XS', '32-33', '30', '32-34', '32'], ['S', '34-35', '30.5', '35-37', '33'], ['M', '36-37', '31', '38-40', '34'], ['L', '38-40', '31.5', '41-43', '35'], ['XL', '41-43', '32', '44-46', '36']],
    fitNote: 'Body measurements, the same as our tops. Coats and jackets are cut with room for a sweater underneath, so take your usual size.',
    howToMeasure: [MEASURE.bust, MEASURE.chest, MEASURE.sleeve],
  },
]

/** The five size charts. Every product with a Size option names one (`detail.sizeChartId`). */
export function northfoldSizeCharts(ctx: InstallContext): SizeChart[] {
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
// One running, one over and one to come, so the Campaigns page shows every state and
// the announcement bar has an offer. Their dates count from the day the store is opened.

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's campaigns, as of `ctx.today` ("YYYY-MM-DD"). */
export function northfoldCampaigns(ctx: InstallContext): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(ctx.today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: `camp-${ctx.prefix}-fall-layers`,
      channelId: ctx.channelId,
      name: 'Fall layers',
      targets: ['Outerwear'],
      startDate: day(-5), startTime: '08:00', endDate: day(10), endTime: '23:59',
      updatedAt: stamp(day(-5)),
      offer: { message: 'Fall layers: 20% off outerwear with code LAYERS20', code: 'LAYERS20', discountPct: 20 },
      orders: 46,
      revenue: 862_400,
    },
    {
      id: `camp-${ctx.prefix}-fall-preview`,
      channelId: ctx.channelId,
      name: 'Fall preview',
      targets: ['New in'],
      startDate: day(-42), startTime: '08:00', endDate: day(-35), endTime: '23:59',
      updatedAt: stamp(day(-35)),
      offer: { message: 'Fall preview: 15% off new arrivals with code PREVIEW15', code: 'PREVIEW15', discountPct: 15 },
      orders: 63,
      revenue: 1_071_000,
    },
    {
      id: `camp-${ctx.prefix}-holiday-knits`,
      channelId: ctx.channelId,
      name: 'Holiday knits',
      targets: ['Knitwear'],
      startDate: day(14), startTime: '08:00', endDate: day(27), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Holiday knits: 15% off knitwear with code KNIT15', code: 'KNIT15', discountPct: 15 },
      orders: 0,
      revenue: 0,
    },
  ]
}

// ── Merchandising ────────────────────────────────────────────────────────────
// Search rules and recommendation engines (the store is connected to Merchandise
// Cloud from the start). Each changes what a shopper sees: what a search finds
// (src/storefront/search.ts) or the row under a product.

const MERCH_UPDATED = 'Nov 19, 2026'

export function northfoldMerchandising(ctx: InstallContext): {
  synonyms: Synonym[]
  redirects: PageRedirect[]
  searchPins: SearchPin[]
  engines: RecommendationEngine[]
} {
  const id = (name: string): string => `${ctx.home ? 'nf' : ctx.prefix}-${name}`
  const row = { channelId: ctx.channelId, updatedAt: MERCH_UPDATED }
  const storeUrl = `https://${ctx.domain}`
  const pin = (...ns: number[]): string[] => ns.map((n) => String(ctx.ids.product(n)))
  return {
    synonyms: [
      // "jumper" and "pullover" are in no product's copy; with the rule they find the sweaters.
      { id: id('syn-sweater'), ...row, status: 'active', type: 'two_way', queries: ['sweater', 'jumper', 'pullover'], leadsTo: [] },
      { id: id('syn-pants'), ...row, status: 'active', type: 'two_way', queries: ['pants', 'trousers', 'chinos', 'slacks'], leadsTo: [] },
      { id: id('syn-coat'), ...row, status: 'active', type: 'two_way', queries: ['coat', 'jacket'], leadsTo: [] },
      { id: id('syn-tee'), ...row, status: 'active', type: 'one_way', queries: ['t-shirt', 'tshirt', 't shirt'], leadsTo: ['tee'] },
      { id: id('syn-gift'), ...row, status: 'active', type: 'one_way', queries: ['gift', 'gifts', 'present'], leadsTo: ['scarf', 'beanie', 'tote'] },
    ],
    redirects: [
      { id: id('red-returns'), ...row, queries: ['returns', 'return', 'refund', 'exchange', 'return policy'], leadsTo: `${storeUrl}/policies/refund-policy` },
      { id: id('red-sizing'), ...row, queries: ['size guide', 'size chart', 'sizing'], leadsTo: `${storeUrl}/page/size-guide` },
    ],
    searchPins: [
      // The Merino Crewneck is the best seller, so it leads a search for sweaters.
      { id: id('pin-sweater'), ...row, query: 'sweater', pinnedProductIds: pin(7) },
      // "t-shirt" holds the word "shirt": without the pin the shirts would come first.
      { id: id('pin-tshirt'), ...row, query: 't-shirt', pinnedProductIds: pin(1, 2) },
    ],
    engines: [
      { id: id('engine-goes-with'), ...row, name: 'Goes well with', page: 'product', type: 'frequently_purchased_together', status: 'active', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:15 AM` },
      // Switched off: turn it on, and the first one off, and the row under a product shows the newest styles.
      { id: id('engine-new-in'), ...row, name: 'New in', page: 'product', type: 'newest_products', status: 'inactive', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:20 AM` },
    ],
  }
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant answers on the apparel profile (src/chatbot/assistantProfiles.ts):
// orders, sizes and fit, fabric and care, returns. What it knows about the store is
// written here in short answers, each agreeing with the page it names.

/** What differs from a new chatbot's settings. */
export const NORTHFOLD_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Northfold',
  storeType: 'Fashion & Apparel',
  brandName: 'Northfold assistant',
  brandSubtitle: 'Orders, sizing and returns',
  primaryColor: '#111111',
  position: 'right',
  launcherText: 'Need help?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi, I’m the Northfold assistant. I can look up an order, help you find your size, or answer questions about returns and care. What can I help with?',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'Where is my order?', enabled: true },
    { id: 2, text: 'Which size should I get?', enabled: true },
    { id: 3, text: 'How do returns work?', enabled: true },
    { id: 4, text: 'How do I wash merino?', enabled: true },
    { id: 5, text: 'What’s on sale?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 4, meta: 'Added 19 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and refunds', url: '/policies/refund-policy', text: 'Returns are free within 30 days of delivery, sale styles included. Items must be unworn and unwashed, with the tags on. Write to hello@northfold.example with your order number and we’ll email you a prepaid label. We refund your original payment method within 5 business days of receiving the return.' },
        { title: 'Changing a size', url: '/page/shipping-and-returns', text: 'The quickest way to get a different size is to order the size you want and return the first one. Shipping and returns are both free.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices and payment', url: '/policies/terms-of-service', text: 'Prices are in US dollars and shipping is free, so the total at checkout is what you pay. You can pay by card, Apple Pay or Google Pay. One discount code per order.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 5, meta: 'Added 19 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Shipping times and cost', url: '/page/shipping-and-returns', text: 'Shipping is free on every order. Orders placed by 1 p.m. ET on a business day ship the same day, and delivery takes 3 to 5 business days. We email you a tracking link when your order ships.' },
        { title: 'Where we ship', url: '/page/shipping-and-returns', text: 'We ship to the United States, Canada, the United Kingdom, Australia and New Zealand. Orders outside the US may owe import duties on delivery.' },
        { title: 'Finding your size', url: '/page/size-guide', text: 'Every product page has a size guide in inches and centimeters, and a fit note that says how the style fits and what the model wears. Between sizes? Take the larger size for knitwear and outerwear, and your usual size for tees and shirts.' },
        { title: 'Fabric and care', url: '/page/fabric-and-care', text: 'Hand wash wool and merino cold, or use a wool cycle, and dry flat; never tumble dry. Hand wash silk cold or dry clean. Cotton and linen can go in the machine on cold. Never wash the waxed jacket: wipe it clean and re-wax it once a year.' },
        { title: 'Contact and hours', url: '/page/contact', text: 'Write to hello@northfold.example and we answer within one business day. We’re here Monday to Friday, 9 a.m. to 5 p.m. ET.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. */
export const NORTHFOLD_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'maya.chen@example.com', startedAt: 'Today, 9:05 AM', topic: 'Sizing', resolved: true,
    messages: [
      { from: 'shopper', text: 'I’m usually a medium. Will the Merino Crewneck fit?', time: '9:05 AM' },
      { from: 'bot', text: `The Merino Crewneck Sweater is a regular fit and true to size, so M should be right. The model is 5'9" and wears S. The size guide on the product page has the bust measurement for each size.`, time: '9:05 AM' },
      { from: 'shopper', text: 'Great, thanks.', time: '9:06 AM' },
      { from: 'bot', text: 'You’re welcome. Anything else I can help with?', time: '9:06 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 7:40 PM', topic: 'Returns', resolved: true,
    messages: [
      { from: 'shopper', text: 'Can I return something from the sale?', time: '7:40 PM' },
      { from: 'bot', text: 'Yes. Sale styles can be returned free within 30 days of delivery, like everything else, as long as they’re unworn with the tags on.', time: '7:40 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Mon, 2:18 PM', topic: 'Fabric and care', resolved: true,
    messages: [
      { from: 'shopper', text: 'How do I clean the waxed jacket?', time: '2:18 PM' },
      { from: 'bot', text: 'Never wash it. Wipe it clean with a damp cloth and re-wax it once a year.', time: '2:18 PM' },
    ],
  },
]

// ── Storefront header and footer ─────────────────────────────────────────────

const COLLECTION_LINKS = NORTHFOLD_COLLECTION_NAMES.map((title) => ({ label: title, href: `/collections/${toHandle(title)}` }))

export const NORTHFOLD_CHROME: StorefrontChrome = {
  wordmark: 'Northfold',
  wordmarkIcon: null,
  announcementAboveHeader: true,
  // Search shows while the store is connected to Merchandise Cloud (it starts connected),
  // so a search box never leads to a page that cannot search.
  headerTools: ['account'],
  accountHref: '/account',
  social: [],
  searchPlaceholder: 'Search',
  nav: COLLECTION_LINKS,
  mobileNav: [
    ...COLLECTION_LINKS,
    { label: 'Shop all', href: '/collections/all' },
    { label: 'About', href: '/page/about' },
    { label: 'Size guide', href: '/page/size-guide' },
    { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
    { label: 'Contact', href: '/page/contact' },
    { label: 'Your account', href: '/account' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: [{ label: 'Shop all', href: '/collections/all' }, ...COLLECTION_LINKS],
    },
    {
      heading: { label: 'Help', href: '/page/contact' },
      items: [
        { label: 'Size guide', href: '/page/size-guide' },
        { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
        { label: 'Fabric and care', href: '/page/fabric-and-care' },
        { label: 'Contact', href: '/page/contact' },
        { label: 'Your account', href: '/account' },
      ],
    },
    {
      heading: { label: 'Northfold', href: '/page/about' },
      items: [
        { label: 'About', href: '/page/about' },
        { label: 'Refund policy', href: '/policies/refund-policy' },
        { label: 'Privacy policy', href: '/policies/privacy-policy' },
        { label: 'Terms of service', href: '/policies/terms-of-service' },
      ],
    },
  ],
  newsletter: {
    heading: 'Letters from Northfold',
    placeholder: 'Email address',
    consent: [
      'I agree to the ',
      { label: 'terms of service', href: '/policies/terms-of-service' },
      ' and the ',
      { label: 'privacy policy', href: '/policies/privacy-policy' },
      '.',
    ],
    button: 'Sign up',
    busy: 'Signing up...',
    success: 'Thanks. You’re on the list.',
  },
  copyright: '© 2026 Northfold (demo store)',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────

export function northfoldMenus(ctx: InstallContext): StoreMenu[] {
  const menu = (name: string, handle: string, key: string, links: { label: string; href: string }[]): StoreMenu => ({
    id: `menu-${ctx.prefix}-${key}`,
    channelId: ctx.channelId,
    name,
    handle,
    status: 'Active',
    updatedAt: MERCH_UPDATED,
    items: links.map((link, i) => ({ id: `mi-${ctx.prefix}-${key}-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  })
  return [
    menu('Main menu', 'main-menu', 'main', NORTHFOLD_CHROME.nav),
    menu('Footer menu', 'footer-menu', 'footer', NORTHFOLD_CHROME.footerColumns.slice(1).flatMap((column) => column.items)),
  ]
}

// ── Pages and policies ───────────────────────────────────────────────────────
// No blog posts, so nothing links to a blog. Every fact agrees with the checkout,
// the chatbot's knowledge and the other pages.

const PAGES: [kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string][] = [
  [
    'page', 'about', 'About Northfold',
    '<h2>Clothes made to be worn for years</h2><p>Northfold makes a small wardrobe for women and men: tees, shirts, knitwear, coats and trousers in natural fabrics and quiet colors. We keep the same styles in stock season after season, so you can replace what wears out instead of starting over.</p><h3>How we work</h3><ul><li>We use a short list of fabrics we have worn ourselves: organic cotton, linen, merino and lambswool.</li><li>Most of our clothes are cut and sewn by family-run workshops in Portugal. Our merino is knitted in Italy and our lambswool in the UK.</li><li>Shipping and returns are free on every order.</li></ul>',
    'Northfold makes a small range of clothes for women and men in natural fabrics, made to be worn for years.',
  ],
  [
    'page', 'contact', 'Contact',
    '<h2>We’re here to help</h2><p>Questions about an order, a size or a return? Write to us and we’ll answer within one business day.</p><ul><li><strong>Email:</strong> hello@northfold.example</li><li><strong>Hours:</strong> Monday to Friday, 9 a.m. to 5 p.m. ET</li></ul><h3>Before you write</h3><p>You can see every order and its status in <a href="/account">your account</a>. For sizing, every product page has a size guide, and our <a href="/page/size-guide">size guide page</a> explains how to measure.</p>',
    'Contact Northfold about an order, a size or a return.',
  ],
  [
    'page', 'size-guide', 'Size guide',
    '<h2>Finding your size</h2><p>Every product page has its own size guide, in inches and centimeters, and a fit note that says how the style fits and what the model wears.</p><h3>How to measure</h3><ul><li><strong>Bust or chest:</strong> around the fullest part, under your arms, keeping the tape level.</li><li><strong>Waist:</strong> around your natural waist, the narrowest part of your torso. For trousers, measure where you wear them.</li><li><strong>Hip:</strong> around the fullest part of your hips, with your feet together.</li><li><strong>Sleeve:</strong> from the center back of your neck, over your shoulder and down to your wrist.</li></ul><h3>Between sizes?</h3><p>Take the larger size for knitwear and outerwear, and your usual size for tees and shirts. If it doesn’t fit, returns are free within 30 days.</p><h3>Women’s sizes</h3><p>XS is US 0–2, S is 4–6, M is 8–10, L is 12–14 and XL is 16.</p><h3>Men’s trousers</h3><p>Sized by waist in inches, from 28 to 36, with a 32 in inseam.</p>',
    'How to measure yourself and find your size in Northfold tops, trousers and outerwear.',
  ],
  [
    'page', 'shipping-and-returns', 'Shipping and returns',
    '<h2>Free shipping on every order</h2><p>Orders placed by 1 p.m. ET on a business day ship the same day. Delivery takes 3 to 5 business days, and we email you a tracking link when your order ships.</p><p>We ship to the United States, Canada, the United Kingdom, Australia and New Zealand. Orders outside the US may owe import duties on delivery.</p><h2>Free returns within 30 days</h2><p>Send back anything unworn and unwashed, with the tags on, within 30 days of delivery. Sale styles too.</p><ol><li>Write to hello@northfold.example with your order number.</li><li>We email you a prepaid return label.</li><li>We refund your original payment method within 5 business days of receiving the return.</li></ol><h3>Need a different size?</h3><p>The quickest way is to order the size you want and return the first one. Shipping and returns are both free.</p>',
    'Free shipping on every order and free returns within 30 days.',
  ],
  [
    'page', 'fabric-and-care', 'Fabric and care',
    '<h2>Fabric and care</h2><p>Most of our clothes need less washing than you think. Airing a sweater overnight often does the job.</p><h3>Wool and merino</h3><p>Hand wash cold or use a wool cycle, then dry flat. Never tumble dry: heat shrinks wool.</p><h3>Silk</h3><p>Hand wash cold or dry clean. Roll it in a towel to dry, and never wring it.</p><h3>Cotton and linen</h3><p>Machine wash cold and hang to dry. Linen softens with every wash.</p><h3>Waxed cotton</h3><p>Never wash it. Wipe it clean with a damp cloth and re-wax it once a year.</p><p>Each product page lists its fabric and care under “Fabric and care”.</p>',
    'How to wash and look after wool, silk, cotton, linen and waxed cotton.',
  ],
  [
    'policy', 'refund-policy', 'Refund policy',
    '<h2>Refund policy</h2><p>You can return anything unworn and unwashed, with the tags on, within 30 days of delivery. Returns are free, sale styles included.</p><h3>How to return</h3><p>Write to hello@northfold.example with your order number and we’ll email you a prepaid return label.</p><h3>Refunds</h3><p>We refund the full price you paid to your original payment method, within 5 business days of receiving the return.</p><p>More on delivery and returns: <a href="/page/shipping-and-returns">Shipping and returns</a>.</p>',
    'How returns and refunds work at Northfold.',
  ],
  [
    'policy', 'privacy-policy', 'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Email</h3><p>We only send marketing email if you sign up for it, and every message has an unsubscribe link.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@northfold.example.</p>',
    'What personal data Northfold collects, why, and your rights.',
  ],
  [
    'policy', 'terms-of-service', 'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in US dollars, and shipping is free on every order.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. If a size sells out before we can ship it, we cancel that item and refund it in full.</p><h3>Discount codes</h3><p>One code per order. A code applies only to the styles and dates it names, and can’t be exchanged for cash.</p><h3>Delivery and returns</h3><p>Delivery takes 3 to 5 business days. You can return unworn items within 30 days of delivery for a full refund.</p>',
    'The terms that apply when you buy from the Northfold store.',
  ],
]

export function northfoldContent(ctx: InstallContext): ContentEntry[] {
  return PAGES.map(([kind, handle, title, body, seoDescription]) => ({
    id: `${ctx.prefix}-${kind}-${handle}`,
    channelId: ctx.channelId,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Northfold`,
    seoDescription,
    imageName: '',
    publishedAt: '',
    updatedAt: MERCH_UPDATED,
  }))
}

export const NORTHFOLD_BLOG_SEO: BlogSeoSettings = {
  title: 'Northfold Journal',
  metaDescription: 'Notes on fabric, fit and care from the Northfold team.',
}

// ── Theme templates ──────────────────────────────────────────────────────────
// Drawn by the sections drawing (NORTHFOLD_THEME_STYLES.drawing). Two kinds are new
// with it, with these settings:
//   icon-row         a trust strip: `title` (may be empty), and `feature` blocks of
//                    { icon (a Lucide name), title, text, link ('' for none) }.
//   collapsible-row  a block of product-detail: { title, source, text, open }, where
//                    source 'description' | 'fit' | 'fabric-care' | 'delivery-returns' |
//                    'custom' says where the body comes from (the product's description;
//                    its fit note and size guide; its material and care; the store's
//                    delivery and returns, written in `text`; or `text` alone), and
//                    `open` whether it starts open.
// Settings the classic drawing ignores (the header's colorScheme and searchStyle, a
// collection grid's layout and tile ratio) are read by the sections drawing only.

const HEADER = { menuStyle: 'Inline', sticky: false, colorScheme: 'Light', searchStyle: 'Icon' } as const
const FOOTER = { showSocial: false, columns: 3, colorScheme: 'Light' } as const
const DELIVERY_AND_RETURNS = 'Free shipping on every order, delivered in 3 to 5 business days. Free returns within 30 days of delivery, unworn with the tags on.'

export function northfoldThemeTemplates(ctx: InstallContext): Record<TemplateType, ThemeSection[]> {
  const id = (name: string): string => `${ctx.prefix}-${name}`
  const header = (template: TemplateType) => createSection('header', { ...HEADER }, id(`${template}-header`))
  const footer = (template: TemplateType) => createSection('footer', { ...FOOTER }, id(`${template}-footer`))
  const tile = (title: NorthfoldCollection, image: string) => {
    const handle = toHandle(title)
    return createBlock('collection', { label: title, link: `/collections/${handle}`, image }, id(`collection-${handle}`))
  }
  const row = (key: string, settings: Record<string, string | boolean>) => createBlock('collapsible-row', { text: '', open: false, ...settings }, id(`row-${key}`))
  return {
    home: [
      createSection('announcement-bar', { text: 'Free shipping and free 30-day returns on every order', link: '' }, id('home-announcement')),
      header('home'),
      {
        ...createSection('image-banner', {
          headline: 'Layers for the cold months',
          subheadline: 'Merino, wool and washed cotton for women and men, made to be worn for years.',
          height: 'Large',
          image: NORTHFOLD_PHOTOS.hero,
        }, id('home-hero')),
        blocks: [
          createBlock('button', { label: 'Shop women', link: '/collections/women' }, id('hero-women')),
          createBlock('button', { label: 'Shop men', link: '/collections/men' }, id('hero-men')),
        ],
      },
      {
        ...createSection('collection-grid', { title: 'Shop by category', layout: 'Grid', columns: 4, tileRatio: 'Portrait', tileStyle: 'Photo' }, id('home-collections')),
        blocks: [
          tile('New in', NORTHFOLD_PHOTOS.tileNewIn),
          tile('Knitwear', NORTHFOLD_PHOTOS.tileKnitwear),
          tile('Outerwear', NORTHFOLD_PHOTOS.tileOuterwear),
          tile('Sale', NORTHFOLD_PHOTOS.tileSale),
        ],
      },
      createSection('image-with-text', {
        heading: 'Merino that keeps its shape',
        body: 'Our crewneck is knitted in Italy from extra-fine merino. It is warm without bulk, soft against the skin, and it looks better after a hundred wears than after one.',
        buttonLabel: 'Shop the Merino Crewneck',
        buttonLink: productLink(ctx, 7),
        imageSide: 'Left',
        image: NORTHFOLD_PHOTOS.storyKnit,
      }, id('home-story-knit')),
      createSection('featured-products', { title: 'Layers for fall', collection: 'outerwear', productCount: 4, layout: 'Grid' }, id('home-featured')),
      createSection('image-with-text', {
        heading: 'Fewer, better clothes',
        body: 'We make a small range and keep it in stock season after season, so you can replace what wears out instead of starting over. Every piece is cut from fabric we have worn ourselves.',
        buttonLabel: 'Read our story',
        buttonLink: '/page/about',
        imageSide: 'Right',
        image: NORTHFOLD_PHOTOS.storyStudio,
      }, id('home-story-made')),
      {
        ...createSection('icon-row', { title: '' }, id('home-trust')),
        blocks: [
          createBlock('feature', { icon: 'truck', title: 'Free shipping', text: 'On every order, delivered in 3 to 5 business days.', link: '' }, id('trust-shipping')),
          createBlock('feature', { icon: 'rotate-ccw', title: 'Free 30-day returns', text: 'Unworn with the tags on? Send it back free.', link: '' }, id('trust-returns')),
          createBlock('feature', { icon: 'ruler', title: 'Help with sizing', text: 'Every style has a size guide and a fit note.', link: '/page/size-guide' }, id('trust-sizing')),
        ],
      },
      createSection('newsletter', { headline: 'Letters from Northfold', buttonLabel: 'Sign up' }, id('home-newsletter')),
      footer('home'),
    ],
    product: [
      header('product'),
      {
        ...createSection('product-detail', { galleryLayout: 'Stacked', imageRatio: 'Portrait', sizeGuide: true, fitment: false, showReviews: false }, id('product-detail')),
        blocks: [
          row('description', { title: 'Description', source: 'description', open: true }),
          row('fit', { title: 'Fit and sizing', source: 'fit' }),
          row('fabric-care', { title: 'Fabric and care', source: 'fabric-care' }),
          row('delivery-returns', { title: 'Delivery and returns', source: 'delivery-returns', text: DELIVERY_AND_RETURNS }),
        ],
      },
      createSection('featured-products', { title: 'You may also like' }, id('product-related')),
      footer('product'),
    ],
    collection: [
      header('collection'),
      // The product grid: filters for what the products have (size, color, price, and category on "all"), sort and quick add.
      createSection('collection-grid', { title: '', columns: 4, filters: true, sort: true, quickAdd: true, cardStyle: 'Editorial' }, id('collection-grid')),
      footer('collection'),
    ],
    cart: [
      header('cart'),
      createSection('cart-summary', { showNotes: false, upsells: true }, id('cart-summary')),
      footer('cart'),
    ],
  }
}
