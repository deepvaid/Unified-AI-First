// The "Vitaheal (demo)" store: everything seeded for sales channel `vitaheal-demo`.
//
// Vitaheal is a fictional brand. It stands in for BKM Health, the first reference
// brand for Commerce Cloud (docs/store-builder/bkm-build-prompt.md, section 6), so
// sales people can show the store to any prospect. This file holds the store's data
// in one place; each Pinia store spreads its part into its own seed:
//
//   useSalesChannels    VITAHEAL_CHANNEL
//   useCommerce         vitahealProducts()
//   useProductExtras    VITAHEAL_COLLECTIONS
//   useStoreThemes      VITAHEAL_THEME_STYLES (the templates live there, beside the other themes)
//   useStoreContent     VITAHEAL_CONTENT, VITAHEAL_BLOG_SEO
//   useStoreNavigation  VITAHEAL_MENUS
//   useStorefront       VITAHEAL_CHROME
//
// The catalogue has the shape of BKM's (variants, SEK prices, collections), which
// is what the requirements test. The brand, product and flavour names are made up,
// the copy is written for this prototype, and the pictures are free-licence stock
// photos kept in public/storefront/vitaheal (credits in its CREDITS.md), never BKM's.
//
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and never BKM's name (the test checks that).
// SKUs and weights are placeholders. Type-only imports keep this file runnable in
// Node: `npm run test:storefront` checks it against the reference tables.

import type { Product, ProductVariant } from '../stores/useCommerce.ts'
import type { ThemeStyles } from '../stores/themeBuilderData.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { ContentEntry, BlogSeoSettings } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome } from '../stores/useStorefront.ts'

export const VITAHEAL_CHANNEL_ID = 'vitaheal-demo'
export const VITAHEAL_CHANNEL_NAME = 'Vitaheal (demo)'

export const VITAHEAL_CHANNEL: SalesChannel = {
  id: VITAHEAL_CHANNEL_ID,
  accountId: '2000290',
  name: VITAHEAL_CHANNEL_NAME,
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

/** Navy on white, Figtree, 8px solid buttons, and the two badge colours from the reference theme. */
export const VITAHEAL_THEME_STYLES: ThemeStyles = {
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

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const VITAHEAL_PHOTO_DIR = '/storefront/vitaheal'

/** The photos the theme's home page uses. Product photos are named on each product. */
export const VITAHEAL_PHOTOS = {
  hero: `${VITAHEAL_PHOTO_DIR}/hero.jpg`,
  storyUnwind: `${VITAHEAL_PHOTO_DIR}/story-unwind.jpg`,
  storyFocus: `${VITAHEAL_PHOTO_DIR}/story-focus.jpg`,
  tileSleep: `${VITAHEAL_PHOTO_DIR}/tile-sleep.jpg`,
  tileSport: `${VITAHEAL_PHOTO_DIR}/tile-sport.jpg`,
  tileLongevity: `${VITAHEAL_PHOTO_DIR}/tile-longevity.jpg`,
  tileHydrate: `${VITAHEAL_PHOTO_DIR}/tile-hydrate.jpg`,
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

export const VITAHEAL_COLLECTION_NAMES = ['Subscription', 'Sport', 'Longevity', 'Sleep', 'Hydrate'] as const
type VitahealCollection = (typeof VITAHEAL_COLLECTION_NAMES)[number]

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
  /** Its two photos are `<photo>-1.jpg` (the pack) and `<photo>-2.jpg` in VITAHEAL_PHOTO_DIR. */
  photo: string
  /** The option the variants differ by; absent for a single-variant product. */
  option?: string
  variants: VariantSeed[]
  /** What the product is for first: the product page's breadcrumb uses the first one. */
  collections: VitahealCollection[]
}

/** In the order the "All" collection lists them. */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    id: 2001,
    name: 'Unwind',
    subtitle: 'Sleep and calm',
    description: 'An evening drink mix for winding down. Stir one scoop into warm water about an hour before bed. Covered by our 30-day money-back guarantee.',
    photo: 'unwind',
    option: 'Format',
    variants: [
      { title: 'Can', sku: 'VTH-UNW-CAN', price: 419, weightKg: 0.32, stock: 140 },
      { title: 'Bag', sku: 'VTH-UNW-BAG', price: 399, weightKg: 0.28, stock: 96 },
    ],
    collections: ['Sleep', 'Subscription'],
  },
  {
    id: 2002,
    name: 'Clear Focus',
    subtitle: 'Focus and steady energy',
    description: 'A daily capsule for long working days and hard training blocks. Take two with breakfast.',
    photo: 'clear-focus',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'VTH-FOC-ORG', price: 409, weightKg: 0.12, stock: 120 },
      { title: 'Refill', sku: 'VTH-FOC-REF', price: 389, weightKg: 0.1, stock: 88 },
    ],
    collections: ['Sport', 'Subscription'],
  },
  {
    id: 2003,
    name: 'Daily NAD+',
    subtitle: 'Longevity and cellular energy',
    description: 'Our longevity formula, built around an NAD+ precursor. One capsule each morning.',
    photo: 'daily-nad',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'VTH-NAD-ORG', price: 669, weightKg: 0.11, stock: 74 },
      { title: 'Refill', sku: 'VTH-NAD-REF', price: 649, weightKg: 0.09, stock: 60 },
    ],
    collections: ['Longevity', 'Subscription'],
  },
  {
    id: 2004,
    name: 'Nasal Strips',
    subtitle: 'Easier breathing, day or night',
    description: 'Drug-free strips that gently open the nose. Thirty in a box, for sleep and for training.',
    photo: 'nasal-strips',
    variants: [{ title: 'Default', sku: 'VTH-NSL-30', price: 199, weightKg: 0.04, stock: 210 }],
    collections: ['Sleep', 'Sport'],
  },
  {
    id: 2005,
    name: 'Vitaheal Electrolytes',
    subtitle: 'Daily hydration, no added sugar',
    description: 'Sodium, potassium and magnesium in a single stick. Mix with half a litre of water before, during or after training.',
    photo: 'electrolytes',
    option: 'Flavour',
    variants: [
      { title: 'Lemon & Ginger', sku: 'VTH-ELE-LEM', price: 279, weightKg: 0.18, stock: 180 },
      { title: 'Wild Berries', sku: 'VTH-ELE-BER', price: 279, weightKg: 0.18, stock: 164 },
      { title: 'Starter Pack (both flavours)', sku: 'VTH-ELE-STA', price: 499, compareAt: 558, weightKg: 0.36, stock: 52 },
    ],
    collections: ['Hydrate', 'Sport', 'Subscription'],
  },
  {
    id: 2006,
    name: 'Collagen+',
    subtitle: 'Skin, hair and joints',
    description: 'Collagen with vitamin C in an unflavoured powder. One scoop a day, in coffee, a smoothie or water.',
    photo: 'collagen',
    option: 'Format',
    variants: [
      { title: 'Original', sku: 'VTH-COL-ORG', price: 429, weightKg: 0.3, stock: 110 },
      { title: 'Refill', sku: 'VTH-COL-REF', price: 409, weightKg: 0.27, stock: 82 },
    ],
    collections: ['Longevity', 'Subscription'],
  },
  {
    id: 2007,
    name: 'Balance Refill',
    subtitle: 'Made for women',
    description: 'The refill bag for Balance. Pour it into the can you already own.',
    photo: 'balance-refill',
    variants: [{ title: 'Default', sku: 'VTH-BAL-REF', price: 419, weightKg: 0.26, stock: 68 }],
    collections: ['Longevity'],
  },
  {
    id: 2008,
    name: 'Balance',
    subtitle: 'Made for women',
    description: 'A daily blend for steady energy through the month. One scoop in water, any time of day.',
    photo: 'balance',
    variants: [{ title: 'Default', sku: 'VTH-BAL-CAN', price: 419, weightKg: 0.3, stock: 90 }],
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
export function vitahealProducts(): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const lowest = seed.variants.reduce((min, v) => (v.price < min.price ? v : min))
    const multi = seed.variants.length > 1
    return {
      id: seed.id,
      name: seed.name,
      sku: lowest.sku,
      price: lowest.price.toFixed(2),
      compareAtPrice: lowest.compareAt ? lowest.compareAt.toFixed(2) : '',
      inventory: seed.variants.reduce((total, v) => total + v.stock, 0),
      category: 'Beauty & Health',
      vendor: 'Vitaheal',
      images: 2,
      variants: seed.variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [VITAHEAL_CHANNEL_NAME],
      productType: 'Physical',
      channelIds: [VITAHEAL_CHANNEL_ID],
      imageUrls: [`${VITAHEAL_PHOTO_DIR}/${seed.photo}-1.jpg`, `${VITAHEAL_PHOTO_DIR}/${seed.photo}-2.jpg`],
      detail: {
        subtitle: seed.subtitle,
        url: handleOf(seed.name),
        description: seed.description,
        hasVariants: multi,
        options: multi && seed.option ? [{ name: seed.option, values: seed.variants.map((v) => v.title) }] : [],
        variantsList: seed.variants.map((v, i) => toVariant(seed, v, i)),
        taxCategory: 'Standard',
        material: '',
        brand: 'Vitaheal',
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
        salesChannels: [VITAHEAL_CHANNEL_NAME],
        seo: {
          title: `${seed.name} | Vitaheal`,
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
export const VITAHEAL_COLLECTIONS: { title: VitahealCollection; productCount: number }[] = VITAHEAL_COLLECTION_NAMES.map((title) => ({
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

export const VITAHEAL_CHROME: StorefrontChrome = {
  wordmark: 'Vitaheal',
  wordmarkIcon: null,
  announcementAboveHeader: true,
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
      heading: { label: 'About Vitaheal', href: '/page/about' },
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
    heading: 'Get the Vitaheal letter',
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
  copyright: '© 2026 Vitaheal (demo store). Made in Sweden.',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────
// Flat for now: nesting ("Shop by Category") arrives with slice S2, which also
// makes the storefront header read these menus instead of VITAHEAL_CHROME.

const MENU_DATE = 'Nov 16, 2026'

export const VITAHEAL_MENUS: StoreMenu[] = [
  {
    id: 'menu-vitaheal-main',
    channelId: VITAHEAL_CHANNEL_ID,
    name: 'Main menu',
    handle: 'main-menu',
    status: 'Active',
    updatedAt: MENU_DATE,
    items: VITAHEAL_CHROME.nav.map((link, i) => ({ id: `mi-vitaheal-main-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  },
  {
    id: 'menu-vitaheal-footer',
    channelId: VITAHEAL_CHANNEL_ID,
    name: 'Footer menu',
    handle: 'footer-menu',
    status: 'Active',
    updatedAt: MENU_DATE,
    items: VITAHEAL_CHROME.footerColumns
      .slice(1)
      .flatMap((column) => column.items)
      .map((link, i) => ({ id: `mi-vitaheal-footer-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  },
]

// ── Pages, policies and blog posts ───────────────────────────────────────────

function entry(kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string): ContentEntry {
  return {
    id: `vitaheal-${kind}-${handle}`,
    channelId: VITAHEAL_CHANNEL_ID,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Vitaheal`,
    seoDescription,
    imageName: '',
    publishedAt: kind === 'blog' ? MENU_DATE : '',
    updatedAt: MENU_DATE,
  }
}

export const VITAHEAL_CONTENT: ContentEntry[] = [
  entry(
    'page',
    'about',
    'About Vitaheal',
    '<h2>Made in Sweden, for every day</h2><p>Vitaheal makes a small range of supplements for sleep, focus, hydration and healthy ageing. Each product does one job, and we only keep the ingredients that earn their place.</p><h3>How we work</h3><ul><li>Everything is blended and packed in Sweden.</li><li>Every batch is tested before it ships.</li><li>Refills come in bags, so one can lasts for years.</li></ul><p>Most customers subscribe, which saves 20% on every delivery. You can skip, pause or cancel at any time.</p>',
    'Vitaheal makes a small range of supplements in Sweden for sleep, focus, hydration and healthy ageing.',
  ),
  entry(
    'page',
    'contact',
    'Contact',
    '<h2>We are here to help</h2><p>Questions about an order, a delivery or a subscription? Write to us and we will answer within one working day.</p><ul><li><strong>Email:</strong> hello@vitaheal.example</li><li><strong>Hours:</strong> Monday to Friday, 09:00 to 17:00 CET</li></ul><h3>Before you write</h3><p>Orders placed before 10:00 CET on a weekday leave our warehouse the same day. Delivery takes 3 to 7 working days.</p>',
    'Contact Vitaheal about an order, a delivery or a subscription.',
  ),
  entry(
    'page',
    'ambassadors',
    'Ambassadors',
    '<h2>People who train with Vitaheal</h2><p>Our ambassadors are athletes, coaches and clinicians who already used our products before we asked them. They test new formulas early and tell us plainly what they think.</p><h3>Join the programme</h3><p>We open a few places each season. Tell us about your sport and how you train, and we will be in touch when the next round starts.</p>',
    'Meet the athletes, coaches and clinicians who train with Vitaheal.',
  ),
  entry(
    'page',
    'money-back-guarantee',
    'Money-back guarantee terms',
    '<h2>30 days to try Unwind</h2><p>If Unwind is not right for you, tell us within 30 days of delivery and we will refund your first can or bag.</p><h3>What the guarantee covers</h3><ul><li>Your first order of Unwind, in either format.</li><li>One refund per customer and household.</li></ul><h3>What it does not cover</h3><ul><li>Other Vitaheal products.</li><li>Shipping costs for orders outside Sweden.</li></ul><p>Other returns follow our <a href="/policies/refund-policy">refund policy</a>.</p>',
    'The 30-day money-back guarantee for Unwind: what it covers and how to claim it.',
  ),
  entry(
    'page',
    'cookies',
    'Cookies',
    '<h2>How we use cookies</h2><p>We use a small number of cookies. Some are needed for the store to work, such as the one that remembers your cart. Others help us understand how the store is used, and we only set those with your consent.</p><h3>Your choices</h3><p>You can change your mind at any time from the cookie settings link in the footer.</p>',
    'Which cookies the Vitaheal store sets and how to change your choices.',
  ),
  entry(
    'policy',
    'refund-policy',
    'Refund policy',
    '<h2>Refund policy</h2><p>You can return unopened products within 14 days of delivery for a full refund. Write to us first and we will send a return label.</p><h3>Refunds</h3><p>We refund to your original payment method within 5 working days of receiving the return.</p><h3>Subscriptions</h3><p>You can cancel a subscription before its next charge date. A delivery that has already been charged can be returned under the same 14-day rule.</p><p>Unwind also has a <a href="/page/money-back-guarantee">30-day money-back guarantee</a>.</p>',
    'How returns and refunds work at Vitaheal.',
  ),
  entry(
    'policy',
    'privacy-policy',
    'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect the details we need to deliver your order and look after your subscription: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Marketing</h3><p>We only send marketing email if you ask for it, and every message has an unsubscribe link.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@vitaheal.example.</p>',
    'What personal data Vitaheal collects, why, and your rights.',
  ),
  entry(
    'policy',
    'terms-of-service',
    'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in Swedish kronor and include VAT.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. We may cancel an order if a product is out of stock, and we refund it in full if we do.</p><h3>Subscriptions</h3><p>A subscription renews at the interval you chose until you cancel it. We email you before each renewal.</p><h3>Delivery</h3><p>We deliver within 3 to 7 working days. Duties and taxes may apply outside the EU.</p>',
    'The terms that apply when you buy from the Vitaheal store.',
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
    'Why Vitaheal sells each product once in a can and then in refill bags.',
  ),
]

export const VITAHEAL_BLOG_SEO: BlogSeoSettings = {
  title: 'The Vitaheal Journal',
  metaDescription: 'Short, practical reads on sleep, training and healthy ageing from the Vitaheal team.',
}
