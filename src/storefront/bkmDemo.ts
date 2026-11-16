// The "BKM (demo)" store: everything seeded for sales channel `bkm-demo`.
//
// BKM Health is the first reference brand for Commerce Cloud
// (docs/store-builder/bkm-build-prompt.md, section 6). This file holds the store's
// data in one place; each Pinia store spreads its part into its own seed:
//
//   useSalesChannels    BKM_CHANNEL
//   useCommerce         bkmProducts()
//   useProductExtras    BKM_COLLECTIONS
//   useStoreThemes      BKM_THEME_STYLES (the templates live there, beside the other themes)
//   useStoreContent     BKM_CONTENT, BKM_BLOG_SEO
//   useStoreNavigation  BKM_MENUS
//   useStorefront       BKM_CHROME
//
// The catalogue structure (names, variants, SEK prices, collections) is BKM's. The
// copy is written for this prototype, and the pictures are generated pack shots.
//
// Sales people show this store to prospects. Everything a visitor can see or click
// must read like a real store: no internal wording, and no link to a missing page.
// SKUs and weights are placeholders. Type-only imports keep this file runnable in
// Node: `npm run test:storefront` checks it against the reference tables.

import type { Product, ProductVariant } from '../stores/useCommerce.ts'
import type { ThemeStyles } from '../stores/themeBuilderData.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { ContentEntry, BlogSeoSettings } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome } from '../stores/useStorefront.ts'
import { packShot } from './packShot.ts'
import type { PackShape } from './packShot.ts'

export const BKM_CHANNEL_ID = 'bkm-demo'
export const BKM_CHANNEL_NAME = 'BKM (demo)'

export const BKM_CHANNEL: SalesChannel = {
  id: BKM_CHANNEL_ID,
  accountId: '2000290',
  name: BKM_CHANNEL_NAME,
  storeNumber: 12,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Swedish supplements store. Most orders are subscriptions, and prices are in SEK.',
  connectedClouds: ['commerce', 'store_builder'],
  createdAt: '2026-11-16T09:00:00Z',
  updatedAt: '2026-11-16T09:00:00Z',
  lastActivityAt: '2026-11-16T09:00:00Z',
  webStore: {
    domain: '2000290-12.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: false,
    currency: 'SEK',
    locale: 'sv-SE',
  },
}

// ── Theme ────────────────────────────────────────────────────────────────────

/** Navy on white, Figtree, 8px solid buttons, and BKM's two badge colours. */
export const BKM_THEME_STYLES: ThemeStyles = {
  brandColor: '#0a2240',
  accentColor: '#0a2240',
  background: '#ffffff',
  textColor: '#000000',
  headingFont: 'Figtree',
  bodyFont: 'Figtree',
  cornerRadius: 8,
  buttonStyle: 'solid',
  saleBadgeColor: '#6d52ff',
  customBadgeColor: '#e4ff52',
  soldOutBadgeColor: '#000000',
}

/** The pale backdrop the pack shots sit on. */
const PACK_BACKDROP = '#f2f4f7'

// ── Catalogue ────────────────────────────────────────────────────────────────

export const BKM_COLLECTION_NAMES = ['Subscription', 'Sport', 'Longevity', 'Sleep', 'Hydrate'] as const
type BkmCollection = (typeof BKM_COLLECTION_NAMES)[number]

interface VariantSeed {
  title: string
  sku: string
  /** SEK, VAT included. */
  price: number
  compareAt?: number
  weightKg: number
  stock: number
}

interface ProductSeed {
  id: number
  name: string
  subtitle: string
  description: string
  shape: PackShape
  /** The stripe on the pack shot. */
  accent: string
  /** The option the variants differ by; absent for a single-variant product. */
  option?: string
  variants: VariantSeed[]
  /** What the product is for first: the product page's breadcrumb uses the first one. */
  collections: BkmCollection[]
}

/** In the order BKM lists them on its "All" collection. */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: 2001,
    name: 'Tranquil',
    subtitle: 'Sleep and calm',
    description: 'An evening drink mix for winding down. Stir one scoop into warm water about an hour before bed. Covered by our 30-day money-back guarantee.',
    shape: 'can',
    accent: '#6d52ff',
    option: 'Format',
    variants: [
      { title: 'Can', sku: 'BKM-TRQ-CAN', price: 419, weightKg: 0.32, stock: 140 },
      { title: 'Bag', sku: 'BKM-TRQ-BAG', price: 399, weightKg: 0.28, stock: 96 },
    ],
    collections: ['Sleep', 'Subscription'],
  },
  {
    id: 2002,
    name: 'Ultra Focused',
    subtitle: 'Focus and steady energy',
    description: 'A daily capsule for long working days and hard training blocks. Take two with breakfast.',
    shape: 'can',
    accent: '#ff9d5c',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'BKM-UFO-ORG', price: 409, weightKg: 0.12, stock: 120 },
      { title: 'Refill', sku: 'BKM-UFO-REF', price: 389, weightKg: 0.1, stock: 88 },
    ],
    collections: ['Sport', 'Subscription'],
  },
  {
    id: 2003,
    name: 'Life NAD+',
    subtitle: 'Longevity and cellular energy',
    description: 'Our longevity formula, built around an NAD+ precursor. One capsule each morning.',
    shape: 'can',
    accent: '#7fd0ff',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'BKM-NAD-ORG', price: 669, weightKg: 0.11, stock: 74 },
      { title: 'Refill', sku: 'BKM-NAD-REF', price: 649, weightKg: 0.09, stock: 60 },
    ],
    collections: ['Longevity', 'Subscription'],
  },
  {
    id: 2004,
    name: 'Nasal Strips',
    subtitle: 'Easier breathing, day or night',
    description: 'Drug-free strips that gently open the nose. Thirty in a box, for sleep and for training.',
    shape: 'strips',
    accent: '#9db7d9',
    variants: [{ title: 'Default', sku: 'BKM-NSL-30', price: 199, weightKg: 0.04, stock: 210 }],
    collections: ['Sleep', 'Sport'],
  },
  {
    id: 2005,
    name: 'BKM Electrolytes',
    subtitle: 'Daily hydration, no added sugar',
    description: 'Sodium, potassium and magnesium in a single stick. Mix with half a litre of water before, during or after training.',
    shape: 'box',
    accent: '#e4ff52',
    option: 'Flavour',
    variants: [
      { title: 'Elderflower & Lime', sku: 'BKM-ELE-ELD', price: 279, weightKg: 0.18, stock: 180 },
      { title: 'Swedish Berries', sku: 'BKM-ELE-BER', price: 279, weightKg: 0.18, stock: 164 },
      { title: 'Starter Pack (both flavours)', sku: 'BKM-ELE-STA', price: 499, compareAt: 558, weightKg: 0.36, stock: 52 },
    ],
    collections: ['Hydrate', 'Sport', 'Subscription'],
  },
  {
    id: 2006,
    name: 'Glow+',
    subtitle: 'Skin, hair and joints',
    description: 'Collagen with vitamin C in an unflavoured powder. One scoop a day, in coffee, a smoothie or water.',
    shape: 'can',
    accent: '#f4c6dd',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'BKM-GLW-ORG', price: 429, weightKg: 0.3, stock: 110 },
      { title: 'Refill', sku: 'BKM-GLW-REF', price: 409, weightKg: 0.27, stock: 82 },
    ],
    collections: ['Longevity', 'Subscription'],
  },
  {
    id: 2007,
    name: 'Harmonized Refill',
    subtitle: 'Made for women',
    description: 'The refill bag for Harmonized. Pour it into the can you already own.',
    shape: 'bag',
    accent: '#f2b8a0',
    variants: [{ title: 'Default', sku: 'BKM-HRM-REF', price: 419, weightKg: 0.26, stock: 68 }],
    collections: ['Longevity'],
  },
  {
    id: 2008,
    name: 'Harmonized',
    subtitle: 'Made for women',
    description: 'A daily blend for balance through the month. One scoop in water, any time of day.',
    shape: 'can',
    accent: '#f2b8a0',
    variants: [{ title: 'Default', sku: 'BKM-HRM-CAN', price: 419, weightKg: 0.3, stock: 90 }],
    collections: ['Longevity'],
  },
]

function handleOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function toVariant(seed: ProductSeed, v: VariantSeed, index: number): ProductVariant {
  return {
    id: seed.id * 10 + index + 1,
    title: v.title,
    sku: v.sku,
    manageInventory: true,
    allowBackorder: false,
    costPrice: (v.price * 0.32).toFixed(2),
    price: v.price.toFixed(2),
    ...(v.compareAt ? { compareAtPrice: v.compareAt.toFixed(2) } : {}),
    weight: v.weightKg.toFixed(2),
    stock: { 'Oxford Warehouse': v.stock },
  }
}

/**
 * The eight products, assigned to this store only. `status` is left to
 * useCommerce, which derives it from the stock like every other product's.
 */
export function bkmProducts(): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const lowest = seed.variants.reduce((min, v) => (v.price < min.price ? v : min))
    const art = { name: seed.name, shape: seed.shape, ink: BKM_THEME_STYLES.brandColor, surface: PACK_BACKDROP, accent: seed.accent }
    const multi = seed.variants.length > 1
    return {
      id: seed.id,
      name: seed.name,
      sku: lowest.sku,
      price: lowest.price.toFixed(2),
      compareAtPrice: lowest.compareAt ? lowest.compareAt.toFixed(2) : '',
      inventory: seed.variants.reduce((total, v) => total + v.stock, 0),
      category: 'Beauty & Health',
      vendor: 'BKM',
      images: 2,
      variants: seed.variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [BKM_CHANNEL_NAME],
      productType: 'Physical',
      channelIds: [BKM_CHANNEL_ID],
      imageUrls: [packShot({ ...art, view: 'front' }), packShot({ ...art, view: 'angle' })],
      detail: {
        subtitle: seed.subtitle,
        url: handleOf(seed.name),
        description: seed.description,
        hasVariants: multi,
        options: multi && seed.option ? [{ name: seed.option, values: seed.variants.map((v) => v.title) }] : [],
        variantsList: seed.variants.map((v, i) => toVariant(seed, v, i)),
        taxCategory: 'Standard',
        material: '',
        brand: 'BKM',
        tag: 'Supplements',
        collection: seed.collections[0] ?? '',
        categories: [...seed.collections],
        width: '',
        length: '',
        height: '',
        weight: lowest.weightKg.toFixed(2),
        midCode: '',
        hsCode: '2106.90',
        countryOfOrigin: 'Sweden',
        discountable: true,
        salesChannels: [BKM_CHANNEL_NAME],
        seo: {
          title: `${seed.name} | BKM`,
          metaDescription: `${seed.subtitle}. ${seed.description}`,
          urlHandle: handleOf(seed.name),
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
      },
    }
  })
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export const BKM_COLLECTIONS: { title: BkmCollection; productCount: number }[] = BKM_COLLECTION_NAMES.map((title) => ({
  title,
  productCount: PRODUCT_SEEDS.filter((p) => p.collections.includes(title)).length,
}))

// ── Storefront header and footer ─────────────────────────────────────────────

const COLLECTION_LINKS = [
  { label: 'Sleep', href: '/collections/sleep' },
  { label: 'Sport', href: '/collections/sport' },
  { label: 'Longevity', href: '/collections/longevity' },
  { label: 'Hydrate', href: '/collections/hydrate' },
]

export const BKM_CHROME: StorefrontChrome = {
  wordmark: 'BKM',
  wordmarkIcon: null,
  // No search, account or wishlist until their pages exist (search S13, account S8): a demo must not hit a 404.
  headerTools: [],
  social: [],
  searchPlaceholder: 'Search...',
  nav: [
    { label: 'All products', href: '/collections/all' },
    ...COLLECTION_LINKS,
    { label: 'Subscription', href: '/collections/subscription' },
    { label: 'About', href: '/page/about' },
  ],
  mobileNav: [
    { label: 'All products', href: '/collections/all' },
    ...COLLECTION_LINKS,
    { label: 'Subscription', href: '/collections/subscription' },
    { label: 'About', href: '/page/about' },
    { label: 'Contact', href: '/page/contact' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: [...COLLECTION_LINKS, { label: 'Subscription', href: '/collections/subscription' }],
    },
    {
      heading: { label: 'About BKM', href: '/page/about' },
      items: [
        { label: 'Our story', href: '/page/about' },
        { label: 'Ambassadors', href: '/page/ambassadors' },
        { label: 'Contact', href: '/page/contact' },
      ],
    },
    {
      heading: { label: 'Help', href: '/page/contact' },
      items: [
        { label: 'Money-back guarantee', href: '/page/money-back-guarantee' },
        { label: 'Refund policy', href: '/policies/refund-policy' },
        { label: 'Privacy policy', href: '/policies/privacy-policy' },
        { label: 'Terms of service', href: '/policies/terms-of-service' },
        { label: 'Cookies', href: '/page/cookies' },
      ],
    },
  ],
  newsletter: {
    heading: 'Get the BKM letter',
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
    success: 'Thank you. You are on the list.',
  },
  copyright: '© 2026 BKM (demo store). Made in Sweden.',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────
// Flat for now: nesting ("Shop by Category") arrives with slice S2, which also
// makes the storefront header read these menus instead of BKM_CHROME.

const MENU_DATE = 'Nov 16, 2026'

export const BKM_MENUS: StoreMenu[] = [
  {
    id: 'menu-bkm-main',
    channelId: BKM_CHANNEL_ID,
    name: 'Main menu',
    handle: 'main-menu',
    status: 'Active',
    updatedAt: MENU_DATE,
    items: BKM_CHROME.nav.map((link, i) => ({ id: `mi-bkm-main-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  },
  {
    id: 'menu-bkm-footer',
    channelId: BKM_CHANNEL_ID,
    name: 'Footer menu',
    handle: 'footer-menu',
    status: 'Active',
    updatedAt: MENU_DATE,
    items: BKM_CHROME.footerColumns
      .slice(1)
      .flatMap((column) => column.items)
      .map((link, i) => ({ id: `mi-bkm-footer-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  },
]

// ── Pages, policies and blog posts ───────────────────────────────────────────

function entry(kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string): ContentEntry {
  return {
    id: `bkm-${kind}-${handle}`,
    channelId: BKM_CHANNEL_ID,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | BKM`,
    seoDescription,
    imageName: '',
    publishedAt: kind === 'blog' ? MENU_DATE : '',
    updatedAt: MENU_DATE,
  }
}

export const BKM_CONTENT: ContentEntry[] = [
  entry(
    'page',
    'about',
    'About BKM',
    '<h2>Made in Sweden, for every day</h2><p>BKM makes a small range of supplements for sleep, focus, hydration and healthy ageing. Each product does one job, and we only keep the ingredients that earn their place.</p><h3>How we work</h3><ul><li>Everything is blended and packed in Sweden.</li><li>Every batch is tested before it ships.</li><li>Refills come in bags, so one can lasts for years.</li></ul><p>Most customers subscribe, which saves 20% on every delivery. You can skip, pause or cancel at any time.</p>',
    'BKM makes a small range of supplements in Sweden for sleep, focus, hydration and healthy ageing.',
  ),
  entry(
    'page',
    'contact',
    'Contact',
    '<h2>We are here to help</h2><p>Questions about an order, a delivery or a subscription? Write to us and we will answer within one working day.</p><ul><li><strong>Email:</strong> hello@bkm-demo.example</li><li><strong>Hours:</strong> Monday to Friday, 09:00 to 17:00 CET</li></ul><h3>Before you write</h3><p>Orders placed before 10:00 CET on a weekday leave our warehouse the same day. Delivery takes 3 to 7 working days.</p>',
    'Contact BKM about an order, a delivery or a subscription.',
  ),
  entry(
    'page',
    'ambassadors',
    'Ambassadors',
    '<h2>People who train with BKM</h2><p>Our ambassadors are athletes, coaches and clinicians who already used our products before we asked them. They test new formulas early and tell us plainly what they think.</p><h3>Join the programme</h3><p>We open a few places each season. Tell us about your sport and how you train, and we will be in touch when the next round starts.</p>',
    'Meet the athletes, coaches and clinicians who train with BKM.',
  ),
  entry(
    'page',
    'money-back-guarantee',
    'Money-back guarantee terms',
    '<h2>30 days to try Tranquil</h2><p>If Tranquil is not right for you, tell us within 30 days of delivery and we will refund your first can or bag.</p><h3>What the guarantee covers</h3><ul><li>Your first order of Tranquil, in either format.</li><li>One refund per customer and household.</li></ul><h3>What it does not cover</h3><ul><li>Other BKM products.</li><li>Shipping costs for orders outside Sweden.</li></ul><p>Other returns follow our <a href="/policies/refund-policy">refund policy</a>.</p>',
    'The 30-day money-back guarantee for Tranquil: what it covers and how to claim it.',
  ),
  entry(
    'page',
    'cookies',
    'Cookies',
    '<h2>How we use cookies</h2><p>We use a small number of cookies. Some are needed for the store to work, such as the one that remembers your cart. Others help us understand how the store is used, and we only set those with your consent.</p><h3>Your choices</h3><p>You can change your mind at any time from the cookie settings link in the footer.</p>',
    'Which cookies the BKM store sets and how to change your choices.',
  ),
  entry(
    'policy',
    'refund-policy',
    'Refund policy',
    '<h2>Refund policy</h2><p>You can return unopened products within 14 days of delivery for a full refund. Write to us first and we will send a return label.</p><h3>Refunds</h3><p>We refund to your original payment method within 5 working days of receiving the return.</p><h3>Subscriptions</h3><p>You can cancel a subscription before its next charge date. A delivery that has already been charged can be returned under the same 14-day rule.</p><p>Tranquil also has a <a href="/page/money-back-guarantee">30-day money-back guarantee</a>.</p>',
    'How returns and refunds work at BKM.',
  ),
  entry(
    'policy',
    'privacy-policy',
    'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect the details we need to deliver your order and look after your subscription: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Marketing</h3><p>We only send marketing email if you ask for it, and every message has an unsubscribe link.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@bkm-demo.example.</p>',
    'What personal data BKM collects, why, and your rights.',
  ),
  entry(
    'policy',
    'terms-of-service',
    'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in Swedish kronor and include VAT.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. We may cancel an order if a product is out of stock, and we refund it in full if we do.</p><h3>Subscriptions</h3><p>A subscription renews at the interval you chose until you cancel it. We email you before each renewal.</p><h3>Delivery</h3><p>We deliver within 3 to 7 working days. Duties and taxes may apply outside the EU.</p>',
    'The terms that apply when you buy from the BKM store.',
  ),
  entry(
    'blog',
    'three-habits-for-better-sleep',
    'Three habits for better sleep',
    '<p>Good sleep starts hours before bed. These three habits cost nothing and work for most people.</p><h3>1. Keep one wake-up time</h3><p>Getting up at the same time every day, weekends included, does more for your sleep than an early night.</p><h3>2. Dim the lights after dinner</h3><p>Bright light tells your body it is still daytime. Lower lamps and a darker screen help it wind down.</p><h3>3. Give yourself an hour</h3><p>Stop work, put the phone in another room, and do something slow for the last hour of the day.</p>',
    'Three simple evening habits that make it easier to fall asleep.',
  ),
  entry(
    'blog',
    'how-much-water-do-you-need',
    'How much water do you need when you train?',
    '<p>There is no single number. How much you need depends on how long you train, how hard, and how warm it is.</p><h3>A simple check</h3><p>Weigh yourself before and after a session. Each kilo you lose is about a litre of sweat to replace over the next few hours.</p><h3>Why salt matters</h3><p>Sweat carries sodium out with it. On long or hot sessions, water with electrolytes replaces what plain water cannot.</p>',
    'A practical way to work out how much to drink around training.',
  ),
  entry(
    'blog',
    'why-we-sell-refills',
    'Why we sell refills',
    '<p>A can is the best way to store a powder: it keeps out light, air and moisture. It is also the heaviest part of the parcel.</p><p>So we sell each product once in a can, and after that in a bag. A refill uses far less packaging, costs a little less, and fits through more letterboxes.</p><p>If you subscribe, your first delivery is a can and the ones after it are refills.</p>',
    'Why BKM sells each product once in a can and then in refill bags.',
  ),
]

export const BKM_BLOG_SEO: BlogSeoSettings = {
  title: 'The BKM Journal',
  metaDescription: 'Short, practical reads on sleep, training and healthy ageing from the BKM team.',
}
