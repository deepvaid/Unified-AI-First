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
//   useSubscriptions    VITAHEAL_PLANS, vitahealSubscriptions()
//   useChatbot          VITAHEAL_CHATBOT, VITAHEAL_CONVERSATIONS
//   useStoreCampaigns   vitahealCampaigns()
//
// The catalogue has the shape of BKM's (variants, SEK prices, collections), which
// is what the requirements test. The brand, product and flavour names are made up,
// the copy is written for this prototype, and the pictures are free-licence stock
// photos kept in public/storefront/vitaheal (credits in its CREDITS.md), never BKM's.
//
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and never BKM's name (the test checks that).
// SKUs and weights are placeholders. It imports only types and the pure rule modules,
// so Node can run it: `npm run test:storefront` checks it against the reference tables.

import type { Product, ProductVariant } from '../stores/useCommerce.ts'
import type { ThemeStyles } from '../stores/themeBuilderData.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { ContentEntry, BlogSeoSettings } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import { money, toDecimal } from '../maropay/money.ts'
import { linePlan, nextChargeDate, pricePerDelivery } from '../subscriptions/plans.ts'
import type { SubscriptionPlan } from '../subscriptions/plans.ts'
import type { ContractEvent, ContractStatus, SubscriptionContract } from '../subscriptions/contracts.ts'
import type { StoreCampaign } from './campaigns.ts'

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
    demo: true,
  },
}

/**
 * What the store's own page in the admin says about the store, where other web
 * stores show one placeholder company and dollar figures. The company and its
 * details are made up, like the brand.
 */
export const VITAHEAL_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '1.9M kr',
  themeName: 'Vitaheal 1.0',
  business: [
    { label: 'Legal name', value: 'Vitaheal AB' },
    { label: 'Business type', value: 'Limited company (aktiebolag)' },
    { label: 'Reg. number', value: '559999-0000' },
    { label: 'Phone', value: '+46 8 465 004 12' },
    { label: 'Public email', value: 'hello@vitaheal.example' },
    { label: 'Support email', value: 'hello@vitaheal.example' },
    { label: 'Website', value: '2000290-12.uat.maropost.store' },
    { label: 'Street', value: 'Hantverkargatan 8' },
    { label: 'City / region', value: '112 21 Stockholm' },
    { label: 'Country', value: 'Sweden' },
  ],
} as const

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
        categories: ['Beauty & Health'],
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

// ── Subscription plans ───────────────────────────────────────────────────────

/** The products sold on a plan: the ones in the Subscription collection. */
const SUBSCRIPTION_PRODUCT_IDS = PRODUCT_SEEDS.filter((p) => p.collections.includes('Subscription')).map((p) => p.id)

/** The reference store's two plans: a prepaid 3-month supply (preselected) and a monthly delivery. */
export const VITAHEAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-3-month',
    channelId: VITAHEAL_CHANNEL_ID,
    name: '3-month supply',
    intervalCount: 3,
    intervalUnit: 'month',
    unitsPerDelivery: 3,
    discountPct: 30,
    freeShipping: true,
    benefits: ['Our best price per pack', 'Skip or cancel anytime'],
    productIds: [...SUBSCRIPTION_PRODUCT_IDS],
    isDefault: true,
    status: 'Active',
  },
  {
    id: 'plan-monthly',
    channelId: VITAHEAL_CHANNEL_ID,
    name: 'Monthly subscription',
    intervalCount: 1,
    intervalUnit: 'month',
    unitsPerDelivery: 1,
    discountPct: 20,
    freeShipping: false,
    benefits: ['A fresh pack every month', 'Skip or cancel anytime'],
    productIds: [...SUBSCRIPTION_PRODUCT_IDS],
    isDefault: false,
    status: 'Active',
  },
]

// ── Subscribers ──────────────────────────────────────────────────────────────
// Eight made-up subscribers, so Commerce › Subscriptions › Subscribers has something
// to show before the first purchase. Their dates count back from the day the store
// is opened, so "next charge" is always ahead and a failed payment is always recent.

interface SubscriberSeed {
  name: string
  email: string
  street: string
  postalCode: string
  city: string
  productId: number
  planId: string
  /** Days before today that the subscription started. */
  startedDaysAgo: number
  status: ContractStatus
  card: string
  cancelReason?: string
}

const SUBSCRIBER_SEEDS: SubscriberSeed[] = [
  { name: 'Astrid Lindqvist', email: 'astrid.lindqvist@example.com', street: 'Vasagatan 21', postalCode: '411 24', city: 'Göteborg', productId: 2001, planId: 'plan-3-month', startedDaysAgo: 200, status: 'Active', card: 'Visa •••• 4242' },
  { name: 'Erik Johansson', email: 'erik.johansson@example.com', street: 'Södra Förstadsgatan 40', postalCode: '211 43', city: 'Malmö', productId: 2005, planId: 'plan-monthly', startedDaysAgo: 75, status: 'Active', card: 'Mastercard •••• 5454' },
  { name: 'Maja Nilsson', email: 'maja.nilsson@example.com', street: 'Kungsgatan 9', postalCode: '753 21', city: 'Uppsala', productId: 2002, planId: 'plan-monthly', startedDaysAgo: 140, status: 'Active', card: 'Visa •••• 1881' },
  { name: 'Oskar Bergström', email: 'oskar.bergstrom@example.com', street: 'Drottninggatan 55', postalCode: '111 21', city: 'Stockholm', productId: 2003, planId: 'plan-3-month', startedDaysAgo: 310, status: 'Active', card: 'Amex •••• 0005' },
  { name: 'Elsa Karlsson', email: 'elsa.karlsson@example.com', street: 'Storgatan 3', postalCode: '582 23', city: 'Linköping', productId: 2006, planId: 'plan-monthly', startedDaysAgo: 110, status: 'Paused', card: 'Visa •••• 7720' },
  { name: 'Lucas Andersson', email: 'lucas.andersson@example.com', street: 'Nygatan 14', postalCode: '702 11', city: 'Örebro', productId: 2005, planId: 'plan-3-month', startedDaysAgo: 185, status: 'Payment failed', card: 'Mastercard •••• 3102' },
  { name: 'Freja Holm', email: 'freja.holm@example.com', street: 'Hamngatan 7', postalCode: '392 31', city: 'Kalmar', productId: 2001, planId: 'plan-monthly', startedDaysAgo: 95, status: 'Cancelled', card: 'Visa •••• 6009', cancelReason: 'Too expensive' },
  { name: 'Nils Ekström', email: 'nils.ekstrom@example.com', street: 'Rådhusesplanaden 2', postalCode: '903 28', city: 'Umeå', productId: 2002, planId: 'plan-3-month', startedDaysAgo: 30, status: 'Active', card: 'Visa •••• 4242' },
]

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's seeded subscribers, as of `today` ("YYYY-MM-DD"). */
export function vitahealSubscriptions(today: string): SubscriptionContract[] {
  return SUBSCRIBER_SEEDS.map((seed, index): SubscriptionContract => {
    const product = PRODUCT_SEEDS.find((p) => p.id === seed.productId)!
    const plan = VITAHEAL_PLANS.find((p) => p.id === seed.planId)!
    const lowest = product.variants.reduce((min, v) => (v.price < min.price ? v : min))
    const startedOn = daysBefore(today, seed.startedDaysAgo)

    // A paused or cancelled subscription stopped being charged on the day it was paused or cancelled.
    const stoppedOn = seed.status === 'Paused' ? daysBefore(today, 6) : seed.status === 'Cancelled' ? daysBefore(today, 12) : null

    // Every charge date that came due while it was running; the first one still ahead is the next charge.
    const due: string[] = []
    let next = nextChargeDate(startedOn, plan)
    while (next <= today) {
      if (!stoppedOn || next <= stoppedOn) due.push(next)
      next = nextChargeDate(next, plan)
    }
    // A failed payment is the latest charge that came due and did not go through.
    const failed = seed.status === 'Payment failed' ? due.pop() : undefined

    const history: ContractEvent[] = [
      { date: startedOn, text: 'Subscription started', actor: 'customer' },
      ...due.map((date): ContractEvent => ({ date, text: `Renewal charged to ${seed.card}`, actor: 'merchant' })),
    ]
    if (failed) history.push({ date: failed, text: `Renewal payment failed: ${seed.card} was declined`, actor: 'merchant' })
    if (stoppedOn && seed.status === 'Paused') history.push({ date: stoppedOn, text: 'Paused. Nothing is charged or sent until it is resumed', actor: 'customer' })
    if (stoppedOn && seed.status === 'Cancelled') history.push({ date: stoppedOn, text: `Cancelled. Reason: ${seed.cancelReason}`, actor: 'customer' })

    return {
      id: `sub-${1001 + index}`,
      number: `S-${1001 + index}`,
      channelId: VITAHEAL_CHANNEL_ID,
      customer: {
        name: seed.name,
        email: seed.email,
        address: { line1: seed.street, city: seed.city, region: '', postalCode: seed.postalCode, country: 'Sweden' },
      },
      productId: product.id,
      product: product.name,
      sku: lowest.sku,
      qty: 1,
      plan: linePlan(plan),
      price: toDecimal(pricePerDelivery(money(lowest.price * 100, 'SEK'), plan)),
      currency: 'SEK',
      paymentMethod: seed.card,
      methodId: 'card',
      status: seed.status,
      startedOn,
      nextChargeOn: seed.status === 'Cancelled' ? null : failed ?? next,
      ...(seed.cancelReason ? { cancelReason: seed.cancelReason } : {}),
      history: history.reverse(),
    }
  })
}

// ── Campaigns ────────────────────────────────────────────────────────────────
// One running, one to come and one over, so the store editor's Campaigns page
// shows every state and the storefront has an offer to show. Like the
// subscribers, their dates count from the day the store is opened.

/** The store's seeded campaigns, as of `today` ("YYYY-MM-DD"). */
export function vitahealCampaigns(today: string): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: 'camp-vitaheal-winter',
      channelId: VITAHEAL_CHANNEL_ID,
      name: 'Winter wellness week',
      targets: [],
      startDate: day(-3), startTime: '08:00', endDate: day(11), endTime: '23:59',
      updatedAt: stamp(day(-3)),
      offer: { message: 'Winter wellness week: 15% off everything with code WINTER15', code: 'WINTER15', discountPct: 15 },
      orders: 37,
      revenue: 2_148_000,
    },
    {
      id: 'camp-vitaheal-sleep',
      channelId: VITAHEAL_CHANNEL_ID,
      name: 'New year, better sleep',
      targets: ['Sleep'],
      startDate: day(40), startTime: '08:00', endDate: day(54), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Sleep better this year: 20% off the Sleep range with code SLEEP20', code: 'SLEEP20', discountPct: 20 },
      orders: 0,
      revenue: 0,
    },
    {
      id: 'camp-vitaheal-black-week',
      channelId: VITAHEAL_CHANNEL_ID,
      name: 'Black week',
      targets: [],
      startDate: day(-30), startTime: '00:00', endDate: day(-23), endTime: '23:59',
      updatedAt: stamp(day(-23)),
      offer: { message: 'Black week: 25% off everything with code BLACK25', code: 'BLACK25', discountPct: 25 },
      orders: 112,
      revenue: 5_936_000,
    },
  ]
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant on the store's pages (Service › Chatbots in the admin, and the
// store's own Chatbot page). What it knows about the store is written here in
// short answers, each agreeing with the page it names. Orders, subscriptions and
// products it reads live (src/chatbot/storeAssistant.ts).

/** What differs from a new chatbot's settings. */
export const VITAHEAL_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Vitaheal',
  storeType: 'Health & wellness',
  brandName: 'Vitaheal assistant',
  brandSubtitle: 'Orders, subscriptions and product advice',
  primaryColor: '#0a2240',
  position: 'right',
  launcherText: 'Need help?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi! I’m the Vitaheal assistant. I can look up your order or subscription, or help you find the right product. What can I do for you?',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'Where is my order?', enabled: true },
    { id: 2, text: 'When is my next delivery?', enabled: true },
    { id: 3, text: 'Help me sleep better', enabled: true },
    { id: 4, text: 'What helps with focus?', enabled: true },
    { id: 5, text: 'What is your return policy?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 4, meta: 'Added 16 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and refunds', url: '/policies/refund-policy', text: 'You can return unopened products within 14 days of delivery for a full refund. Write to us first and we will send a return label. We refund to your original payment method within 5 working days of receiving the return.' },
        { title: 'Money-back guarantee on Unwind', url: '/page/money-back-guarantee', text: 'If Unwind is not right for you, tell us within 30 days of delivery and we will refund your first can or bag. The guarantee covers your first order of Unwind, once per household.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order and look after your subscription: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices, VAT and payment', url: '/policies/terms-of-service', text: 'Prices are in Swedish kronor and include VAT. You can pay by card, Apple Pay or Google Pay.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 5, meta: 'Added 16 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Delivery times and shipping cost', url: '/page/contact', text: 'Orders placed before 10:00 CET on a weekday leave our warehouse the same day. Delivery takes 3 to 7 working days, and shipping is free on orders over 549 kr.' },
        { title: 'Which countries we ship to', url: '/policies/terms-of-service', text: 'We ship to Sweden, Norway, Denmark, Finland and Iceland, and to the rest of the EU. Duties and taxes may apply outside the EU.' },
        { title: 'How subscriptions work', url: '/page/about', text: 'A subscription sends your product at the interval you choose and saves 20% to 30% on every delivery. You can skip a delivery, pause or cancel at any time from your account page, before the next charge date.' },
        { title: 'Contact and opening hours', url: '/page/contact', text: 'Write to hello@vitaheal.example and we answer within one working day. We are here Monday to Friday, 09:00 to 17:00 CET.' },
        { title: 'Where our products are made and tested', url: '/page/about', text: 'Everything is blended and packed in Sweden, and every batch is tested before it ships. Refills come in bags, so one can lasts for years.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. */
export const VITAHEAL_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'astrid.lindqvist@example.com', startedAt: 'Today, 8:12 AM', topic: 'Subscription', resolved: true,
    messages: [
      { from: 'shopper', text: 'When is my next delivery?', time: '8:12 AM' },
      { from: 'bot', text: 'Your Unwind subscription is active on the 3-month supply. The next delivery date is below, and you can skip it right here if you have enough at home.', time: '8:12 AM' },
      { from: 'shopper', text: 'No, that is fine. Thanks!', time: '8:13 AM' },
      { from: 'bot', text: 'You’re welcome. Is there anything else I can help with?', time: '8:13 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 9:47 PM', topic: 'Product advice', resolved: true,
    messages: [
      { from: 'shopper', text: 'I keep waking up at night. What do you recommend?', time: '9:47 PM' },
      { from: 'bot', text: 'For better sleep, these are the ones we make for it: Unwind and Nasal Strips.', time: '9:47 PM' },
      { from: 'shopper', text: 'Is Unwind covered by the guarantee?', time: '9:48 PM' },
      { from: 'bot', text: 'If Unwind is not right for you, tell us within 30 days of delivery and we will refund your first can or bag.', time: '9:48 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 2:05 PM', topic: 'Delivery', resolved: true,
    messages: [
      { from: 'shopper', text: 'Do you ship to Norway?', time: '2:05 PM' },
      { from: 'bot', text: 'We ship to Sweden, Norway, Denmark, Finland and Iceland, and to the rest of the EU. Duties and taxes may apply outside the EU.', time: '2:05 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Mon, 11:30 AM', topic: 'Health question', resolved: false,
    messages: [
      { from: 'shopper', text: 'Can I take Clear Focus with my blood pressure medication?', time: '11:30 AM' },
      { from: 'bot', text: 'I can’t give medical advice. Please check with your doctor or pharmacist before starting a supplement.', time: '11:30 AM' },
    ],
  },
]

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
  // No search or wishlist until their pages exist (search S13): a demo must not hit a 404.
  // The account icon opens the shopper's subscriptions (/account).
  headerTools: ['account'],
  accountHref: '/account',
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
    { label: 'My subscription', href: '/account' },
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
        { label: 'My subscription', href: '/account' },
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
