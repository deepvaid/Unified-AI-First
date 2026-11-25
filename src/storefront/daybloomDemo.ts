// The "Daybloom (demo)" store: everything seeded for sales channel `daybloom-demo`.
//
// Daybloom is a fictional supplements brand in the United States: ten products for
// sleep, energy, gut health, immunity and daily wellness, priced in US dollars and
// sold once or on a "Subscribe and save" plan with a delivery every 1, 2 or 3 months.
// It is the health-and-supplements store on the look of the Aurora theme (the classic
// drawing, in Aurora's own colours and type), with what that look gained for it: a
// mega menu in the header, an icon row on the home page, and collapsible rows and a
// purchase options block on the product page. Vitaheal, the other health store, was
// given the same features afterwards, in its own look and with its own two plans.
//
// Every name, product and line of copy was written for this store; the photos are
// free-licence stock photos kept in public/storefront/daybloom (credits in its
// CREDITS.md). src/storefront/demoStores/daybloom.ts installs it in any store that
// applies the Daybloom theme, so, like northfoldDemo.ts, most of it is built from an
// InstallContext: ids, channel, domain and string-id prefix follow the store.
//
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and no real brand (the shared suite,
// tests/storefront/demoStores.test.ts, checks it). What the copy promises is what the
// checkout does: free shipping, delivery in 3 to 5 business days, to the countries the
// US-dollar checkout offers (src/storefront/checkoutProfile.ts), and no Click & collect.
// The copy describes what a product is for and what is in it; it makes no claim to
// treat anything, and the footer carries the statement US supplement stores show.
// Pure: types and the pure rule modules only, so Node runs it (`npm run
// test:storefront`, tests/storefront/daybloomDemo.test.ts checks the reference tables).

import type { Product, ProductVariant } from '../stores/useCommerce.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { BlogSeoSettings, ContentEntry } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome, StorefrontLink } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../stores/useMerchandising.ts'
import { money, toDecimal } from '../maropay/money.ts'
import { linePlan, nextChargeDate, offeredRows, planFromOptions, pricePerDelivery } from '../subscriptions/plans.ts'
import type { SubscriptionPlan } from '../subscriptions/plans.ts'
import type { ContractEvent, ContractStatus, SubscriptionContract } from '../subscriptions/contracts.ts'
import type { StoreCampaign } from './campaigns.ts'
import type { InstallContext, SnapshotCollection } from './demoStores/types.ts'
import { toHandle } from './handles.ts'
import { createBlock, createSection } from './themeSections.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from './themeSections.ts'

export const DAYBLOOM_CHANNEL_ID = 'daybloom-demo'
export const DAYBLOOM_CHANNEL_NAME = 'Daybloom (demo)'

/** When the seed was written: the channel's dates, the theme's publish date and the collections' last update. */
export const DAYBLOOM_SEEDED_AT = '2026-11-24T09:00:00Z'

/**
 * The store's sales channel. It starts connected to Merchandise Cloud, so search,
 * its rules and "Goes well with" work on the first visit; a restore connects it again.
 */
export const DAYBLOOM_CHANNEL: SalesChannel = {
  id: DAYBLOOM_CHANNEL_ID,
  accountId: '2000290',
  name: DAYBLOOM_CHANNEL_NAME,
  storeNumber: 17,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Daily supplements for sleep, energy, gut health and immunity. Sold once or on a subscribe-and-save plan; prices in US dollars.',
  connectedClouds: ['commerce', 'store_builder', 'merchandise'],
  createdAt: DAYBLOOM_SEEDED_AT,
  updatedAt: DAYBLOOM_SEEDED_AT,
  lastActivityAt: DAYBLOOM_SEEDED_AT,
  merchandising: { status: 'connected', health: 'healthy', lastSyncAt: DAYBLOOM_SEEDED_AT, lastActivityAt: DAYBLOOM_SEEDED_AT },
  webStore: {
    domain: '2000290-17.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: true,
    currency: 'USD',
    demo: true,
  },
}

/** What the store's own page in the admin says about it. The company is made up, like the brand. */
export const DAYBLOOM_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '$61.4K',
  themeName: 'Daybloom 1.0',
  business: [
    { label: 'Legal name', value: 'Daybloom Wellness, Inc.' },
    { label: 'Business type', value: 'Corporation' },
    { label: 'Tax ID (EIN)', value: '12-3456789' },
    { label: 'Phone', value: '(512) 555-0137' },
    { label: 'Public email', value: 'hello@daybloom.example' },
    { label: 'Support email', value: 'hello@daybloom.example' },
    { label: 'Website', value: '2000290-17.uat.maropost.store' },
    { label: 'Street', value: '410 Barton Springs Road' },
    { label: 'City / region', value: 'Austin, TX 78704' },
    { label: 'Country', value: 'United States' },
  ],
} as const

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * Aurora's Default colour scheme, system font stack and 6px corners, as the Aurora
 * theme ships them (the same values the theme library's Aurora carries). No
 * `drawing`: the store is drawn by the classic drawing, whose sizes are Aurora's.
 */
export const DAYBLOOM_THEME_STYLES: ThemeStyles = {
  brandColor: '#373842',
  accentColor: '#121011',
  background: '#FFFFFF',
  textColor: '#121011',
  headingFont: 'system-ui',
  bodyFont: 'system-ui',
  cornerRadius: 6,
  buttonStyle: 'solid',
  saleBadgeColor: '#121011',
  customBadgeColor: '#373842',
  soldOutBadgeColor: '#121011',
}

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const DAYBLOOM_PHOTO_DIR = '/storefront/daybloom'

const photo = (file: string): string => `${DAYBLOOM_PHOTO_DIR}/${file}`

/** The photos the theme's home page and menu use. Product photos are named on each product. */
export const DAYBLOOM_PHOTOS = {
  hero: photo('hero.jpg'),
  tileSleep: photo('tile-sleep.jpg'),
  tileEnergy: photo('tile-energy.jpg'),
  tileGut: photo('tile-gut.jpg'),
  tileImmunity: photo('tile-immunity.jpg'),
  storySubscribe: photo('story-subscribe.jpg'),
  storyQuality: photo('story-quality.jpg'),
  menuFeature: photo('menu-feature.jpg'),
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

/** What a product is for. A product's first collection is its goal: the product page's breadcrumb names it. */
export const DAYBLOOM_GOALS = ['Sleep', 'Energy', 'Gut health', 'Immunity', 'Daily wellness'] as const
/** How it is taken. */
export const DAYBLOOM_FORMATS = ['Capsules', 'Powders', 'Gummies'] as const
/** In the order the admin lists them. */
export const DAYBLOOM_COLLECTION_NAMES = [...DAYBLOOM_GOALS, ...DAYBLOOM_FORMATS, 'Bundles', 'Bestsellers', 'Subscribe and save'] as const
export type DaybloomCollection = (typeof DAYBLOOM_COLLECTION_NAMES)[number]

const LOCATION = 'Oxford Warehouse'
const NO_ALLERGENS = 'Gluten, dairy, soy and artificial colors'

interface ProductSeed {
  /** Its place in the store's id block: product n. */
  n: number
  name: string
  subtitle: string
  description: string
  /** Its two photos are `<photo>-1.jpg` (the pack) and `<photo>-2.jpg` in DAYBLOOM_PHOTO_DIR. */
  photo: string
  sku: string
  /** US dollars. */
  price: number
  compareAt?: number
  weightKg: number
  stock: number
  /** What is in the pack: "60 capsules". */
  size: string
  /** The supplement facts, as the product page's table shows them: label and value. */
  facts: [label: string, value: string][]
  /** The goal first, then the format and the lists it is in. */
  collections: DaybloomCollection[]
}

/**
 * In the order the "All" collection lists them. The first four are the bestsellers,
 * which is also what the home page's "Bestsellers" row shows.
 */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    n: 1,
    name: 'Magnesium Glycinate',
    subtitle: 'For calm evenings and restful sleep',
    description: 'A gentle form of magnesium for winding down at the end of the day. Two capsules with your evening meal.\n\nMagnesium glycinate is easy on the stomach, and each serving gives you 200 mg of magnesium with nothing else added.',
    photo: 'magnesium',
    sku: 'DB-MAG-60',
    price: 29,
    weightKg: 0.12,
    stock: 240,
    size: '60 capsules',
    facts: [
      ['Serving size', '2 capsules'],
      ['Servings per bottle', '30'],
      ['Magnesium (as magnesium glycinate)', '200 mg (48% DV)'],
      ['Other ingredients', 'Vegetable cellulose capsule, rice flour'],
      ['Suggested use', 'Take 2 capsules with your evening meal.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Sleep', 'Capsules', 'Bestsellers', 'Subscribe and save'],
  },
  {
    n: 2,
    name: 'Daily Greens',
    subtitle: 'For steady energy, every morning',
    description: 'One scoop of greens, fiber and B vitamins to start the day. Stir it into cold water or blend it into a smoothie.\n\nIt tastes of apple and mint, with no added sugar, and every scoop lists what is in it and how much.',
    photo: 'daily-greens',
    sku: 'DB-GRN-30',
    price: 39,
    weightKg: 0.3,
    stock: 180,
    size: '30 servings',
    facts: [
      ['Serving size', '1 scoop (8 g)'],
      ['Servings per tub', '30'],
      ['Greens blend (spinach, kale, barley grass, spirulina)', '4 g'],
      ['Fiber (from chicory root)', '2 g (7% DV)'],
      ['Vitamin B12', '6 mcg (250% DV)'],
      ['Vitamin C', '90 mg (100% DV)'],
      ['Other ingredients', 'Natural apple and mint flavor, stevia leaf extract'],
      ['Suggested use', 'Mix 1 scoop into 8 fl oz of cold water each morning.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Energy', 'Gut health', 'Powders', 'Bestsellers', 'Subscribe and save'],
  },
  {
    n: 3,
    name: 'Probiotic 20 Billion',
    subtitle: 'For everyday gut health',
    description: 'Five well-studied strains in one small capsule a day, with a prebiotic fiber to feed them.\n\nThe capsule is made to pass through the stomach before it opens, and it keeps at room temperature, so it can live on your kitchen shelf.',
    photo: 'probiotic',
    sku: 'DB-PRO-30',
    price: 34,
    weightKg: 0.08,
    stock: 160,
    size: '30 capsules',
    facts: [
      ['Serving size', '1 capsule'],
      ['Servings per bottle', '30'],
      ['Probiotic blend (5 strains)', '20 billion CFU'],
      ['Prebiotic fiber (inulin)', '100 mg'],
      ['Other ingredients', 'Delayed-release vegetable capsule'],
      ['Suggested use', 'Take 1 capsule a day, with or without food.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Gut health', 'Capsules', 'Bestsellers', 'Subscribe and save'],
  },
  {
    n: 4,
    name: 'Vitamin D3 + K2',
    subtitle: 'For immune support, all year',
    description: 'Vitamin D3 with vitamin K2 in a small softgel, in olive oil so your body can take it up. One a day with a meal.\n\nMade for the months with little sun, and for anyone who spends most of the day indoors.',
    photo: 'vitamin-d3',
    sku: 'DB-D3K-60',
    price: 19,
    weightKg: 0.07,
    stock: 300,
    size: '60 softgels',
    facts: [
      ['Serving size', '1 softgel'],
      ['Servings per bottle', '60'],
      ['Vitamin D3 (cholecalciferol)', '50 mcg (250% DV)'],
      ['Vitamin K2 (as MK-7)', '90 mcg (75% DV)'],
      ['Other ingredients', 'Extra virgin olive oil, softgel (gelatin, glycerin, water)'],
      ['Suggested use', 'Take 1 softgel a day with a meal.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Immunity', 'Daily wellness', 'Capsules', 'Bestsellers', 'Subscribe and save'],
  },
  {
    n: 5,
    name: 'Sleep Gummies',
    subtitle: 'For falling asleep more easily',
    description: 'Two blackberry gummies about half an hour before bed, with a low dose of melatonin, L-theanine and chamomile.\n\nThey are made with fruit pectin, not gelatin, and have 2 g of sugar a serving.',
    photo: 'sleep-gummies',
    sku: 'DB-SLG-60',
    price: 24,
    weightKg: 0.2,
    stock: 150,
    size: '60 gummies',
    facts: [
      ['Serving size', '2 gummies'],
      ['Servings per jar', '30'],
      ['Melatonin', '1 mg'],
      ['L-theanine', '100 mg'],
      ['Chamomile flower extract', '50 mg'],
      ['Total sugars', '2 g'],
      ['Other ingredients', 'Fruit pectin, cane sugar, natural blackberry flavor, citric acid'],
      ['Suggested use', 'Chew 2 gummies 30 minutes before bed.'],
      ['Free from', 'Gluten, dairy, soy, gelatin and artificial colors'],
    ],
    collections: ['Sleep', 'Gummies', 'Subscribe and save'],
  },
  {
    n: 6,
    name: 'Electrolyte Mix',
    subtitle: 'For hydration and energy on busy days',
    description: 'Sodium, potassium and magnesium in a single lemon stick. Tear one into your water bottle before a workout, on a hot day, or when the afternoon drags.\n\nNo sugar and nothing artificial: the taste comes from real lemon and a pinch of sea salt.',
    photo: 'electrolyte-mix',
    sku: 'DB-ELM-30',
    price: 25,
    weightKg: 0.18,
    stock: 200,
    size: '30 stick packs',
    facts: [
      ['Serving size', '1 stick (5 g)'],
      ['Servings per box', '30'],
      ['Sodium (from sea salt)', '500 mg (22% DV)'],
      ['Potassium (as potassium citrate)', '200 mg (4% DV)'],
      ['Magnesium (as magnesium citrate)', '60 mg (14% DV)'],
      ['Total sugars', '0 g'],
      ['Other ingredients', 'Lemon juice powder, citric acid, stevia leaf extract'],
      ['Suggested use', 'Mix 1 stick into 16 fl oz of water.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Energy', 'Powders', 'Subscribe and save'],
  },
  {
    n: 7,
    name: 'Collagen Peptides',
    subtitle: 'For skin, hair and joints',
    description: 'Unflavored collagen that dissolves in hot or cold drinks. One scoop in your coffee, a smoothie or a glass of water.\n\nOne ingredient, from grass-fed cattle, with 10 g of collagen and 9 g of protein in every scoop.',
    photo: 'collagen',
    sku: 'DB-COL-28',
    price: 36,
    weightKg: 0.32,
    stock: 120,
    size: '28 servings',
    facts: [
      ['Serving size', '1 scoop (10 g)'],
      ['Servings per tub', '28'],
      ['Collagen peptides (bovine, types I and III)', '10 g'],
      ['Protein', '9 g'],
      ['Other ingredients', 'None'],
      ['Suggested use', 'Stir 1 scoop into a hot or cold drink once a day.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Daily wellness', 'Powders', 'Subscribe and save'],
  },
  {
    n: 8,
    name: 'Omega-3 Fish Oil',
    subtitle: 'For heart and brain, every day',
    description: 'Fish oil from wild-caught anchovies and sardines, purified and tested for heavy metals. Two softgels a day with a meal.\n\nA touch of lemon oil means no fishy aftertaste.',
    photo: 'omega-3',
    sku: 'DB-OMG-60',
    price: 27,
    weightKg: 0.14,
    stock: 170,
    size: '60 softgels',
    facts: [
      ['Serving size', '2 softgels'],
      ['Servings per bottle', '30'],
      ['Fish oil concentrate', '2,000 mg'],
      ['EPA (eicosapentaenoic acid)', '600 mg'],
      ['DHA (docosahexaenoic acid)', '400 mg'],
      ['Other ingredients', 'Softgel (gelatin, glycerin, water), natural lemon oil, mixed tocopherols'],
      ['Suggested use', 'Take 2 softgels a day with a meal.'],
      ['Contains', 'Fish (anchovy, sardine)'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Daily wellness', 'Capsules', 'Subscribe and save'],
  },
  {
    n: 9,
    name: 'Sleep Well Bundle',
    subtitle: 'Magnesium Glycinate and Sleep Gummies, $6 off',
    description: 'Our two sleep products together: Magnesium Glycinate with your evening meal, and Sleep Gummies half an hour before bed.\n\nOne bottle and one jar, a month of each, for less than buying them one by one.',
    photo: 'sleep-bundle',
    sku: 'DB-BND-SLP',
    price: 47,
    compareAt: 53,
    weightKg: 0.32,
    stock: 60,
    size: '1 bottle and 1 jar',
    facts: [
      ['In the bundle', 'Magnesium Glycinate (60 capsules) and Sleep Gummies (60 gummies)'],
      ['Lasts', '30 days'],
      ['Suggested use', 'Take 2 capsules with your evening meal, and chew 2 gummies 30 minutes before bed.'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Sleep', 'Bundles'],
  },
  {
    n: 10,
    name: 'Daily Essentials Bundle',
    subtitle: 'Greens, Vitamin D3 + K2 and Omega-3, $10 off',
    description: 'The three we would start with: Daily Greens in the morning, and Vitamin D3 + K2 and Omega-3 Fish Oil with a meal.\n\nOne tub and two bottles, for less than buying them one by one.',
    photo: 'essentials-bundle',
    sku: 'DB-BND-ESS',
    price: 75,
    compareAt: 85,
    weightKg: 0.51,
    stock: 45,
    size: '1 tub and 2 bottles',
    facts: [
      ['In the bundle', 'Daily Greens (30 servings), Vitamin D3 + K2 (60 softgels) and Omega-3 Fish Oil (60 softgels)'],
      ['Lasts', '30 days (the Vitamin D3 + K2 lasts 60)'],
      ['Suggested use', 'Mix 1 scoop of greens into water each morning. Take 1 Vitamin D3 + K2 softgel and 2 Omega-3 softgels with a meal.'],
      ['Contains', 'Fish (anchovy, sardine)'],
      ['Free from', NO_ALLERGENS],
    ],
    collections: ['Daily wellness', 'Energy', 'Immunity', 'Bundles'],
  },
]

const seedOf = (n: number): ProductSeed => {
  const seed = PRODUCT_SEEDS.find((p) => p.n === n)
  if (!seed) throw new Error(`Daybloom has no product ${n}`)
  return seed
}

/** Every product is sold in one size, so each has a single variant. */
function variantOf(seed: ProductSeed, productId: number, ctx: InstallContext): ProductVariant {
  return {
    id: ctx.ids.variant(productId, 1),
    title: 'Default',
    sku: seed.sku,
    manageInventory: true,
    allowBackorder: false,
    costPrice: (seed.price * 0.3).toFixed(2),
    price: seed.price.toFixed(2),
    ...(seed.compareAt ? { compareAtPrice: seed.compareAt.toFixed(2) } : {}),
    weight: seed.weightKg.toFixed(2),
    stock: { [LOCATION]: seed.stock },
  }
}

/**
 * The ten products, assigned to the store they are installed in. `status` is left
 * to useCommerce, which derives it from the stock like every other product's.
 */
export function daybloomProducts(ctx: InstallContext): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const id = ctx.ids.product(seed.n)
    const handle = toHandle(seed.name)
    const bundle = seed.collections.includes('Bundles')
    return {
      id,
      name: seed.name,
      sku: seed.sku,
      price: seed.price.toFixed(2),
      compareAtPrice: seed.compareAt ? seed.compareAt.toFixed(2) : '',
      inventory: seed.stock,
      category: 'Beauty & Health',
      vendor: 'Daybloom',
      images: 2,
      variants: 1,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [ctx.channelName],
      productType: bundle ? 'Bundle' : 'Physical',
      channelIds: [ctx.channelId],
      imageUrls: [photo(`${seed.photo}-1.jpg`), photo(`${seed.photo}-2.jpg`)],
      detail: {
        subtitle: seed.subtitle,
        url: handle,
        description: seed.description,
        hasVariants: false,
        options: [],
        variantsList: [variantOf(seed, id, ctx)],
        taxCategory: 'Standard',
        material: '',
        brand: 'Daybloom',
        tag: bundle ? 'Bundles' : 'Supplements',
        collection: seed.collections[0] ?? '',
        categories: ['Beauty & Health'],
        width: '',
        length: '',
        height: '',
        weight: seed.weightKg.toFixed(2),
        midCode: '',
        hsCode: '2106.90',
        countryOfOrigin: 'United States',
        discountable: true,
        salesChannels: [ctx.channelName],
        seo: {
          title: `${seed.name} | Daybloom`,
          metaDescription: `${seed.subtitle}. ${seed.size}.`,
          urlHandle: handle,
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
        // The supplement facts: the product page's "Supplement facts" row shows them as a table.
        specs: [{ label: 'Size', value: seed.size }, ...seed.facts.map(([label, value]) => ({ label, value }))],
      },
    }
  })
}

const collectionLink = (title: DaybloomCollection): StorefrontLink => ({ label: title, href: `/collections/${toHandle(title)}` })

/** What each collection page says under its title: the goal in one line. */
const COLLECTION_DESCRIPTIONS: Record<DaybloomCollection, string> = {
  Sleep: 'Wind down in the evening and wake up rested.',
  Energy: 'Steady energy from morning to evening, without the crash.',
  'Gut health': 'Look after your digestion, one day at a time.',
  Immunity: 'Everyday support for your body’s defenses.',
  'Daily wellness': 'The basics most of us run short of.',
  Capsules: 'Capsules and softgels: quick to take, easy to travel with.',
  Powders: 'Powders and stick packs to stir into a drink.',
  Gummies: 'Gummies made with fruit pectin, never gelatin.',
  Bundles: 'Products that work well together, for less than buying them one by one.',
  Bestsellers: 'What our customers order most.',
  'Subscribe and save': 'Save up to 20% and never run out. Pause, skip or cancel any time.',
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export function daybloomCollections(ctx: InstallContext): SnapshotCollection[] {
  return DAYBLOOM_COLLECTION_NAMES.map((title, i) => ({
    id: ctx.ids.collection(i + 1),
    title,
    productCount: PRODUCT_SEEDS.filter((p) => p.collections.includes(title)).length,
    updatedAt: DAYBLOOM_SEEDED_AT,
    description: COLLECTION_DESCRIPTIONS[title],
  }))
}

// ── Subscription plan ────────────────────────────────────────────────────────
// One plan with delivery options, each with its own discount (Commerce ›
// Subscriptions › Plans › Plan with delivery options). Shoppers read its label and
// pick how often; the bundles are sold once only.

const PLAN_KEY = 'subscribe-and-save'
/** Percent off by delivery option, most frequent first. */
export const DAYBLOOM_PLAN_OPTIONS = [
  { id: 'o1', intervalCount: 1, intervalUnit: 'month', discountPct: 20, isDefault: true },
  { id: 'o2', intervalCount: 2, intervalUnit: 'month', discountPct: 15, isDefault: false },
  { id: 'o3', intervalCount: 3, intervalUnit: 'month', discountPct: 10, isDefault: false },
] as const

const SUBSCRIBABLE = PRODUCT_SEEDS.filter((p) => p.collections.includes('Subscribe and save'))

const planId = (ctx: InstallContext): string => `plan-${ctx.prefix}-${PLAN_KEY}`

export function daybloomPlans(ctx: InstallContext): SubscriptionPlan[] {
  return [{
    ...planFromOptions({
      name: 'Subscribe and save',
      shopperLabel: 'Subscribe and save',
      status: 'Active',
      options: DAYBLOOM_PLAN_OPTIONS.map((option) => ({ ...option })),
      productIds: SUBSCRIBABLE.map((p) => ctx.ids.product(p.n)),
    }),
    id: planId(ctx),
    channelId: ctx.channelId,
  }]
}

// ── Subscribers ──────────────────────────────────────────────────────────────
// Six made-up subscribers, so Commerce › Subscriptions › Subscribers has something to
// show before the first purchase. Their dates count back from the day the store is
// opened, so "next charge" is always ahead and a failed payment is always recent.
// Numbers start at S-1101: subscriptions of every store share one list.

interface SubscriberSeed {
  name: string
  email: string
  street: string
  city: string
  region: string
  postalCode: string
  /** Product n. */
  product: number
  /** The plan's delivery option. */
  option: (typeof DAYBLOOM_PLAN_OPTIONS)[number]['id']
  /** Days before today that the subscription started. */
  startedDaysAgo: number
  status: ContractStatus
  card: string
  cancelReason?: string
}

const SUBSCRIBER_SEEDS: SubscriberSeed[] = [
  { name: 'Hannah Whitfield', email: 'hannah.whitfield@example.com', street: '1420 Alder Street', city: 'Portland', region: 'OR', postalCode: '97205', product: 1, option: 'o1', startedDaysAgo: 160, status: 'Active', card: 'Visa •••• 4242' },
  { name: 'Marcus Reyes', email: 'marcus.reyes@example.com', street: '88 Juniper Lane', city: 'Denver', region: 'CO', postalCode: '80203', product: 2, option: 'o1', startedDaysAgo: 95, status: 'Active', card: 'Mastercard •••• 5454' },
  { name: 'Priya Nair', email: 'priya.nair@example.com', street: '305 Larkspur Avenue', city: 'Raleigh', region: 'NC', postalCode: '27601', product: 3, option: 'o2', startedDaysAgo: 130, status: 'Active', card: 'Visa •••• 1881' },
  { name: 'Daniel Okafor', email: 'daniel.okafor@example.com', street: '17 Harbor View Drive', city: 'Tampa', region: 'FL', postalCode: '33602', product: 4, option: 'o3', startedDaysAgo: 200, status: 'Paused', card: 'Amex •••• 0005' },
  { name: 'Sofia Marino', email: 'sofia.marino@example.com', street: '942 Birchwood Court', city: 'Madison', region: 'WI', postalCode: '53703', product: 6, option: 'o1', startedDaysAgo: 70, status: 'Payment failed', card: 'Mastercard •••• 3102' },
  { name: 'Grace Lindholm', email: 'grace.lindholm@example.com', street: '56 Cedar Hollow Road', city: 'Boise', region: 'ID', postalCode: '83702', product: 5, option: 'o2', startedDaysAgo: 150, status: 'Cancelled', card: 'Visa •••• 6009', cancelReason: 'I have enough for now' },
]

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's seeded subscribers, as of `ctx.today` ("YYYY-MM-DD"). On its own channel only. */
export function daybloomSubscriptions(ctx: InstallContext): SubscriptionContract[] {
  const rows = offeredRows(daybloomPlans(ctx)[0]!)
  return SUBSCRIBER_SEEDS.map((seed, index): SubscriptionContract => {
    const product = seedOf(seed.product)
    const row = rows.find((r) => r.id.endsWith(`~${seed.option}`))!
    const startedOn = daysBefore(ctx.today, seed.startedDaysAgo)

    // A paused or cancelled subscription stopped being charged on the day it was paused or cancelled.
    const stoppedOn = seed.status === 'Paused' ? daysBefore(ctx.today, 5) : seed.status === 'Cancelled' ? daysBefore(ctx.today, 9) : null

    // Every charge date that came due while it was running; the first one still ahead is the next charge.
    const due: string[] = []
    let next = nextChargeDate(startedOn, row)
    while (next <= ctx.today) {
      if (!stoppedOn || next <= stoppedOn) due.push(next)
      next = nextChargeDate(next, row)
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
      id: `sub-${1101 + index}`,
      number: `S-${1101 + index}`,
      channelId: ctx.channelId,
      customer: {
        name: seed.name,
        email: seed.email,
        address: { line1: seed.street, city: seed.city, region: seed.region, postalCode: seed.postalCode, country: 'United States' },
      },
      productId: ctx.ids.product(product.n),
      product: product.name,
      sku: product.sku,
      qty: 1,
      plan: linePlan(row),
      price: toDecimal(pricePerDelivery(money(product.price * 100, 'USD'), row)),
      currency: 'USD',
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
// One running, one over and one to come, so the Campaigns page shows every state and
// the announcement bar has an offer. Their dates count from the day the store is opened.

/** The store's campaigns, as of `ctx.today` ("YYYY-MM-DD"). */
export function daybloomCampaigns(ctx: InstallContext): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(ctx.today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: `camp-${ctx.prefix}-sleep-week`,
      channelId: ctx.channelId,
      name: 'Sleep week',
      targets: ['Sleep'],
      startDate: day(-4), startTime: '08:00', endDate: day(10), endTime: '23:59',
      updatedAt: stamp(day(-4)),
      offer: { message: 'Sleep week: 15% off the Sleep range with code SLEEP15', code: 'SLEEP15', discountPct: 15 },
      orders: 58,
      revenue: 278_400,
    },
    {
      id: `camp-${ctx.prefix}-fall-restock`,
      channelId: ctx.channelId,
      name: 'Fall restock',
      targets: [],
      startDate: day(-42), startTime: '08:00', endDate: day(-35), endTime: '23:59',
      updatedAt: stamp(day(-35)),
      offer: { message: 'Fall restock: 10% off everything with code RESTOCK10', code: 'RESTOCK10', discountPct: 10 },
      orders: 91,
      revenue: 455_000,
    },
    {
      id: `camp-${ctx.prefix}-bundle-up`,
      channelId: ctx.channelId,
      name: 'Bundle up',
      targets: ['Bundles'],
      startDate: day(14), startTime: '08:00', endDate: day(27), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Bundle up: 10% off bundles with code BUNDLE10', code: 'BUNDLE10', discountPct: 10 },
      orders: 0,
      revenue: 0,
    },
  ]
}

// ── Merchandising ────────────────────────────────────────────────────────────
// Search rules and recommendation engines (the store is connected to Merchandise
// Cloud from the start). Each changes what a shopper sees: what a search finds
// (src/storefront/search.ts) or the row under a product.

const UPDATED = 'Nov 24, 2026'

export function daybloomMerchandising(ctx: InstallContext): {
  synonyms: Synonym[]
  redirects: PageRedirect[]
  searchPins: SearchPin[]
  engines: RecommendationEngine[]
} {
  const id = (name: string): string => `${ctx.home ? 'db' : ctx.prefix}-${name}`
  const row = { channelId: ctx.channelId, updatedAt: UPDATED }
  const storeUrl = `https://${ctx.domain}`
  const pin = (...ns: number[]): string[] => ns.map((n) => String(ctx.ids.product(n)))
  return {
    synonyms: [
      // None of these words is in a product's copy: the rule is why the search finds something.
      { id: id('syn-tired'), ...row, status: 'active', type: 'one_way', queries: ['tired', 'fatigue', 'exhausted', 'sluggish'], leadsTo: ['energy'] },
      { id: id('syn-insomnia'), ...row, status: 'active', type: 'one_way', queries: ['insomnia', 'restless', 'jet lag'], leadsTo: ['sleep'] },
      { id: id('syn-digestion'), ...row, status: 'active', type: 'one_way', queries: ['digestion', 'bloating', 'stomach'], leadsTo: ['gut'] },
      { id: id('syn-immune'), ...row, status: 'active', type: 'one_way', queries: ['immune', 'immune system', 'winter'], leadsTo: ['immunity'] },
      { id: id('syn-fish-oil'), ...row, status: 'active', type: 'two_way', queries: ['fish oil', 'omega-3', 'omega 3', 'epa', 'dha'], leadsTo: [] },
      { id: id('syn-hydration'), ...row, status: 'active', type: 'two_way', queries: ['hydration', 'electrolytes', 'rehydrate'], leadsTo: [] },
    ],
    redirects: [
      { id: id('red-returns'), ...row, queries: ['returns', 'return', 'refund', 'guarantee', 'money back'], leadsTo: `${storeUrl}/policies/refund-policy` },
      { id: id('red-subscribe'), ...row, queries: ['subscription', 'subscribe', 'subscribe and save'], leadsTo: `${storeUrl}/page/subscribe-and-save` },
    ],
    searchPins: [
      // Magnesium Glycinate is the best seller, so it leads a search for sleep.
      { id: id('pin-sleep'), ...row, query: 'sleep', pinnedProductIds: pin(1) },
      // Electrolyte Mix first for energy, then the greens.
      { id: id('pin-energy'), ...row, query: 'energy', pinnedProductIds: pin(6, 2) },
    ],
    engines: [
      { id: id('engine-goes-with'), ...row, name: 'Goes well with', page: 'product', type: 'frequently_purchased_together', status: 'active', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${UPDATED} at 10:15 AM` },
      // Switched off: turn it on, and the first one off, and the row under a product changes to the newest products.
      { id: id('engine-new-in'), ...row, name: 'New in', page: 'product', type: 'newest_products', status: 'inactive', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${UPDATED} at 10:20 AM` },
    ],
  }
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant answers on the supplements profile (src/chatbot/assistantProfiles.ts):
// orders, subscriptions, a product for a goal, and store questions. What it knows
// about the store is written here in short answers, each agreeing with the page it names.

/** What differs from a new chatbot's settings. */
export const DAYBLOOM_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Daybloom',
  storeType: 'Health & wellness',
  brandName: 'Daybloom assistant',
  brandSubtitle: 'Orders, subscriptions and product advice',
  primaryColor: '#373842',
  position: 'right',
  launcherText: 'Need help?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi! I’m the Daybloom assistant. I can look up your order or subscription, or help you find the right product. What can I do for you?',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'Where is my order?', enabled: true },
    { id: 2, text: 'When is my next delivery?', enabled: true },
    { id: 3, text: 'Help me sleep better', enabled: true },
    { id: 4, text: 'What helps with energy?', enabled: true },
    { id: 5, text: 'How do subscriptions work?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 4, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and the 30-day guarantee', url: '/policies/refund-policy', text: 'Every product has a 30-day money-back guarantee. If it is not right for you, write to hello@daybloom.example within 30 days of receiving it and we refund it, opened or not. We refund your original payment method within 5 business days.' },
        { title: 'Subscription terms', url: '/policies/subscription-terms', text: 'A subscription renews at the interval you chose until you cancel it. We email you before each renewal, and you can pause, skip a delivery or cancel from your account at any time before the next charge date.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order and look after your subscription: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices and payment', url: '/policies/terms-of-service', text: 'Prices are in US dollars and shipping is free, so the total at checkout is what you pay. You can pay by card, Apple Pay or Google Pay. One discount code per order.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 6, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Delivery times and shipping cost', url: '/page/shipping-and-returns', text: 'Shipping is free on every order. Orders placed by 1 p.m. CT on a business day ship the same day, and delivery takes 3 to 5 business days. We email you a tracking link when your order ships.' },
        { title: 'Where we ship', url: '/page/shipping-and-returns', text: 'We ship to the United States, Canada, the United Kingdom, Australia and New Zealand. Orders outside the US may owe import duties on delivery.' },
        { title: 'How Subscribe and save works', url: '/page/subscribe-and-save', text: 'Choose a delivery every month, every 2 months or every 3 months. You save 20% on a monthly delivery, 15% every 2 months and 10% every 3 months. You can pause, skip a delivery, change how often it comes or cancel from your account at any time.' },
        { title: 'Quality and testing', url: '/page/quality-and-testing', text: 'Every product is made in the United States in a GMP-certified facility, and every batch is tested by an independent lab for purity and strength before it ships. Every label lists each ingredient and its amount.' },
        { title: 'Vegan, gluten, allergens and what is in each product', url: '/page/faq', text: 'Every product is free from gluten, dairy, soy and artificial colors. Our capsules, powders and gummies are vegan, except Collagen Peptides (from cattle), Omega-3 Fish Oil and Vitamin D3 + K2 (gelatin softgels). Omega-3 Fish Oil contains fish. Every product page lists each ingredient and its amount under Supplement facts.' },
        { title: 'Contact and hours', url: '/page/contact', text: 'Write to hello@daybloom.example and we answer within one business day. We’re here Monday to Friday, 9 a.m. to 5 p.m. CT.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. */
export const DAYBLOOM_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'hannah.whitfield@example.com', startedAt: 'Today, 8:20 AM', topic: 'Subscription', resolved: true,
    messages: [
      { from: 'shopper', text: 'When is my next delivery?', time: '8:20 AM' },
      { from: 'bot', text: 'Your Magnesium Glycinate subscription is active, with a delivery every month. The next delivery date is below, and you can skip it right here if you have enough at home.', time: '8:20 AM' },
      { from: 'shopper', text: 'That works, thanks!', time: '8:21 AM' },
      { from: 'bot', text: 'You’re welcome. Is there anything else I can help with?', time: '8:21 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 9:32 PM', topic: 'Product advice', resolved: true,
    messages: [
      { from: 'shopper', text: 'I keep waking up at night. What do you recommend?', time: '9:32 PM' },
      { from: 'bot', text: 'For better sleep, these are the ones we make for it: Sleep Well Bundle, Magnesium Glycinate and Sleep Gummies.', time: '9:32 PM' },
      { from: 'shopper', text: 'Can I send it back if it does not work for me?', time: '9:33 PM' },
      { from: 'bot', text: 'Every product has a 30-day money-back guarantee. If it is not right for you, write to hello@daybloom.example within 30 days of receiving it and we refund it, opened or not.', time: '9:33 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 1:14 PM', topic: 'Subscription', resolved: true,
    messages: [
      { from: 'shopper', text: 'How does Subscribe and save work?', time: '1:14 PM' },
      { from: 'bot', text: 'Choose a delivery every month, every 2 months or every 3 months. You save 20% on a monthly delivery, 15% every 2 months and 10% every 3 months. You can pause, skip a delivery, change how often it comes or cancel from your account at any time.', time: '1:14 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Mon, 10:48 AM', topic: 'Health question', resolved: false,
    messages: [
      { from: 'shopper', text: 'Is the fish oil safe with my blood pressure medication?', time: '10:48 AM' },
      { from: 'bot', text: 'I can’t give medical advice. Please check with your doctor or pharmacist before starting a supplement.', time: '10:48 AM' },
    ],
  },
]

// ── Storefront header and footer ─────────────────────────────────────────────
// The header's menu: "Shop" and "Learn" open a panel of links (the mega menu),
// the other three go straight to their page.

const GOAL_LINKS = DAYBLOOM_GOALS.map(collectionLink)
const FORMAT_LINKS = DAYBLOOM_FORMATS.map(collectionLink)
const SUBSCRIBE_PAGE: StorefrontLink = { label: 'Subscribe and save', href: '/page/subscribe-and-save' }
const LEARN_LINKS: StorefrontLink[] = [
  { label: 'Our story', href: '/page/about' },
  { label: 'Quality and testing', href: '/page/quality-and-testing' },
  SUBSCRIBE_PAGE,
]
const HELP_LINKS: StorefrontLink[] = [
  { label: 'FAQ', href: '/page/faq' },
  { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
  { label: 'Contact', href: '/page/contact' },
]

const NAV: StorefrontChrome['nav'] = [
  {
    label: 'Shop',
    href: '/collections/all',
    menu: {
      columns: [
        { heading: 'Shop by goal', links: GOAL_LINKS },
        { heading: 'Shop by format', links: FORMAT_LINKS },
        {
          heading: 'More ways to shop',
          links: [collectionLink('Bestsellers'), collectionLink('Bundles'), { label: 'Subscribe and save products', href: '/collections/subscribe-and-save' }, { label: 'Shop all', href: '/collections/all' }],
        },
      ],
      feature: {
        image: DAYBLOOM_PHOTOS.menuFeature,
        heading: 'Subscribe and save up to 20%',
        text: 'A delivery every 1, 2 or 3 months. Pause, skip or cancel any time.',
        link: { label: 'How it works', href: SUBSCRIBE_PAGE.href },
      },
    },
  },
  collectionLink('Bestsellers'),
  collectionLink('Bundles'),
  SUBSCRIBE_PAGE,
  {
    label: 'Learn',
    href: '/page/about',
    menu: {
      columns: [
        { heading: 'About Daybloom', links: LEARN_LINKS },
        { heading: 'Help', links: HELP_LINKS },
      ],
    },
  },
]

export const DAYBLOOM_CHROME: StorefrontChrome = {
  wordmark: 'Daybloom',
  wordmarkIcon: null,
  announcementAboveHeader: true,
  // Search shows while the store is connected to Merchandise Cloud (it starts connected),
  // so a search box never leads to a page that cannot search.
  headerTools: ['account'],
  accountHref: '/account',
  social: [],
  searchPlaceholder: 'Search',
  nav: NAV,
  mobileNav: [
    ...NAV,
    { label: 'Your account', href: '/account' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: [...GOAL_LINKS, collectionLink('Bundles'), collectionLink('Bestsellers')],
    },
    {
      heading: { label: 'Learn', href: '/page/about' },
      items: LEARN_LINKS,
    },
    {
      heading: { label: 'Help', href: '/page/faq' },
      items: [
        ...HELP_LINKS,
        { label: 'Your account', href: '/account' },
        { label: 'Refund policy', href: '/policies/refund-policy' },
        { label: 'Subscription terms', href: '/policies/subscription-terms' },
        { label: 'Privacy policy', href: '/policies/privacy-policy' },
        { label: 'Terms of service', href: '/policies/terms-of-service' },
        { label: 'Accessibility', href: '/page/accessibility' },
      ],
    },
  ],
  newsletter: {
    heading: 'Get the Daybloom letter',
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
  // The statement US supplement stores carry under their claims.
  copyright: '© 2026 Daybloom (demo store). These statements have not been evaluated by the Food and Drug Administration. Our products are not intended to diagnose, treat, cure or prevent any disease.',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────
// The main menu lists the header's five links; the links inside the "Shop" and
// "Learn" panels are the theme's.

export function daybloomMenus(ctx: InstallContext): StoreMenu[] {
  const menu = (name: string, handle: string, key: string, links: StorefrontLink[]): StoreMenu => ({
    id: `menu-${ctx.prefix}-${key}`,
    channelId: ctx.channelId,
    name,
    handle,
    status: 'Active',
    updatedAt: UPDATED,
    items: links.map((link, i) => ({ id: `mi-${ctx.prefix}-${key}-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  })
  return [
    menu('Main menu', 'main-menu', 'main', DAYBLOOM_CHROME.nav),
    menu('Shop by goal', 'shop-by-goal', 'goals', GOAL_LINKS),
    menu('Shop by format', 'shop-by-format', 'formats', FORMAT_LINKS),
    menu('Footer menu', 'footer-menu', 'footer', DAYBLOOM_CHROME.footerColumns.slice(1).flatMap((column) => column.items)),
  ]
}

// ── Pages and policies ───────────────────────────────────────────────────────
// No blog posts, so nothing links to a blog. Every fact agrees with the checkout,
// the plan, the chatbot's knowledge and the other pages.

const PAGES: [kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string][] = [
  [
    'page', 'about', 'Our story',
    '<h2>Supplements you can read the label of</h2><p>Daybloom started with a kitchen drawer full of half-used bottles and no idea what was in most of them. We make a short range instead: ten products, each for one job, each with every ingredient and its amount on the label.</p><h3>How we work</h3><ul><li>No proprietary blends. If it is in the bottle, the label says how much.</li><li>Every batch is tested by an independent lab before it ships.</li><li>Made in the United States in a GMP-certified facility.</li><li>No artificial colors, and no fillers we would not take ourselves.</li></ul><p>Most customers subscribe, which saves up to 20% on every delivery. <a href="/page/subscribe-and-save">See how it works</a>.</p>',
    'Daybloom makes a short range of supplements for sleep, energy, gut health and immunity, with every ingredient and amount on the label.',
  ],
  [
    'page', 'quality-and-testing', 'Quality and testing',
    '<h2>Tested before it reaches you</h2><p>What is on the label is what is in the bottle. Here is how we make sure.</p><h3>Where it is made</h3><p>Every product is made in the United States, in a facility certified for Good Manufacturing Practice (GMP).</p><h3>How it is tested</h3><ul><li><strong>Ingredients:</strong> each raw ingredient is checked for identity before it is used.</li><li><strong>Purity:</strong> every batch is tested by an independent lab for heavy metals and microbes.</li><li><strong>Strength:</strong> every batch is tested to confirm it holds the amounts on the label.</li></ul><h3>What is not in it</h3><p>No proprietary blends, no artificial colors and no gelatin in our gummies. Each product page lists what the product is free from, and anything it contains that some people avoid, such as fish.</p><h3>Ask for a report</h3><p>Write to hello@daybloom.example with the lot number from the bottom of your bottle and we will send you its lab report.</p>',
    'Where Daybloom supplements are made and how every batch is tested for purity and strength.',
  ],
  [
    'page', 'subscribe-and-save', 'Subscribe and save',
    '<h2>Save up to 20%, and never run out</h2><p>Choose how often you want a product and we send it on that schedule, for less than buying it once.</p><h3>What you save</h3><ul><li><strong>A delivery every month:</strong> 20% off</li><li><strong>A delivery every 2 months:</strong> 15% off</li><li><strong>A delivery every 3 months:</strong> 10% off</li></ul><h3>How it works</h3><ol><li>On a product page, choose “Subscribe and save” and how often you want it.</li><li>We charge your card and ship your first delivery today, with free shipping.</li><li>We email you before each renewal. Change your mind at any time.</li></ol><h3>You are in charge</h3><p>Pause, skip a delivery, change how often it comes or cancel from <a href="/account">your account</a>, at any time before the next charge date. There is no minimum number of deliveries.</p><p><a href="/collections/subscribe-and-save">See the products you can subscribe to</a>, or read the <a href="/policies/subscription-terms">subscription terms</a>.</p>',
    'How Subscribe and save works at Daybloom: what you save, and how to pause, skip or cancel.',
  ],
  [
    'page', 'faq', 'FAQ',
    '<h2>Frequently asked questions</h2><h3>How long does delivery take?</h3><p>Orders placed by 1 p.m. CT on a business day ship the same day and arrive in 3 to 5 business days. Shipping is free on every order.</p><h3>Can I return a product I have opened?</h3><p>Yes. Every product has a 30-day money-back guarantee, opened or not. See <a href="/page/shipping-and-returns">shipping and returns</a>.</p><h3>How do I pause or cancel a subscription?</h3><p>From <a href="/account">your account</a>, at any time before the next charge date. There is no minimum number of deliveries.</p><h3>Can I take more than one product?</h3><p>Our products are made to be taken together, and the bundles pair the ones that go well. If you take medication or have a medical condition, ask your doctor first.</p><h3>Are your products vegan?</h3><p>The capsules, powders and gummies are, except Collagen Peptides (from cattle), Omega-3 Fish Oil and Vitamin D3 + K2 (gelatin softgels). Each product page lists what is in it.</p><h3>Who should not take supplements?</h3><p>If you are pregnant, nursing, taking medication or under 18, ask your doctor before you start. Supplements are not a substitute for a varied diet.</p><h3>Something else?</h3><p><a href="/page/contact">Write to us</a> and we answer within one business day.</p>',
    'Answers to common questions about delivery, returns, subscriptions and Daybloom products.',
  ],
  [
    'page', 'shipping-and-returns', 'Shipping and returns',
    '<h2>Free shipping on every order</h2><p>Orders placed by 1 p.m. CT on a business day ship the same day. Delivery takes 3 to 5 business days, and we email you a tracking link when your order ships.</p><p>We ship to the United States, Canada, the United Kingdom, Australia and New Zealand. Orders outside the US may owe import duties on delivery.</p><h2>30-day money-back guarantee</h2><p>If a product is not right for you, tell us within 30 days of delivery and we refund it, opened or not.</p><ol><li>Write to hello@daybloom.example with your order number.</li><li>We email you a prepaid return label, or tell you to keep the product.</li><li>We refund your original payment method within 5 business days.</li></ol><h3>Subscriptions</h3><p>You can cancel a subscription before its next charge date. A delivery that has already been charged has the same 30-day guarantee.</p>',
    'Free shipping on every order and a 30-day money-back guarantee.',
  ],
  [
    'page', 'contact', 'Contact',
    '<h2>We’re here to help</h2><p>Questions about an order, a subscription or a product? Write to us and we’ll answer within one business day.</p><ul><li><strong>Email:</strong> hello@daybloom.example</li><li><strong>Hours:</strong> Monday to Friday, 9 a.m. to 5 p.m. CT</li></ul><h3>Before you write</h3><p>You can see every order and manage your subscriptions in <a href="/account">your account</a>. Our <a href="/page/faq">FAQ</a> answers the questions we hear most.</p><p>We can tell you what is in a product and how to take it. We cannot give medical advice: for that, please ask your doctor or pharmacist.</p>',
    'Contact Daybloom about an order, a subscription or a product.',
  ],
  [
    'page', 'accessibility', 'Accessibility',
    '<h2>Accessibility</h2><p>We want everyone to be able to shop here. This store is built to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.</p><h3>What that means</h3><ul><li>Every page works with a keyboard, and shows where the focus is.</li><li>Text and controls have enough contrast to read.</li><li>Pictures that carry meaning have a text alternative, and no text is baked into a picture.</li><li>Product facts are written as text, so a screen reader can read every ingredient and amount.</li></ul><h3>Tell us what is not working</h3><p>If something gets in your way, write to hello@daybloom.example. We answer within one business day and fix what we can.</p>',
    'How the Daybloom store is built to be usable by everyone, and how to tell us about a problem.',
  ],
  [
    'policy', 'refund-policy', 'Refund policy',
    '<h2>Refund policy</h2><p>Every product has a 30-day money-back guarantee. If it is not right for you, tell us within 30 days of delivery and we refund it, opened or not.</p><h3>How to ask for a refund</h3><p>Write to hello@daybloom.example with your order number. We email you a prepaid return label, or tell you to keep the product.</p><h3>Refunds</h3><p>We refund the full price you paid to your original payment method, within 5 business days.</p><h3>Subscriptions</h3><p>You can cancel a subscription before its next charge date. A delivery that has already been charged has the same 30-day guarantee.</p><p>More on delivery and returns: <a href="/page/shipping-and-returns">Shipping and returns</a>.</p>',
    'How the 30-day money-back guarantee and refunds work at Daybloom.',
  ],
  [
    'policy', 'subscription-terms', 'Subscription terms',
    '<h2>Subscription terms</h2><p>These terms apply when you buy a product on Subscribe and save.</p><h3>What you agree to</h3><p>You ask us to send the product, and charge the payment method you used at checkout, at the interval you chose: every month, every 2 months or every 3 months. The subscription runs until you cancel it. There is no minimum number of deliveries.</p><h3>Price</h3><p>You pay the product’s price less the discount for your interval: 20% for a delivery every month, 15% every 2 months and 10% every 3 months. Shipping is free. If a price changes, we email you before your next renewal.</p><h3>Before each renewal</h3><p>We email you before each renewal, so you have time to change it.</p><h3>Pause, skip or cancel</h3><p>You can pause, skip a delivery, change how often it comes or cancel from <a href="/account">your account</a>, at any time before the next charge date. A delivery that has already been charged can be refunded under our <a href="/policies/refund-policy">refund policy</a>.</p>',
    'The terms that apply to a Subscribe and save subscription at Daybloom.',
  ],
  [
    'policy', 'privacy-policy', 'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect what we need to deliver your order and look after your subscription: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Email</h3><p>We only send marketing email if you sign up for it, and every message has an unsubscribe link.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@daybloom.example.</p>',
    'What personal data Daybloom collects, why, and your rights.',
  ],
  [
    'policy', 'terms-of-service', 'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in US dollars, and shipping is free on every order.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. If a product sells out before we can ship it, we cancel that item and refund it in full.</p><h3>Discount codes</h3><p>One code per order. A code applies only to the products and dates it names, and can’t be exchanged for cash.</p><h3>Subscriptions</h3><p>A subscription renews at the interval you chose until you cancel it. See the <a href="/policies/subscription-terms">subscription terms</a>.</p><h3>Our products</h3><p>Our products are food supplements. They are not intended to diagnose, treat, cure or prevent any disease, and they are not a substitute for a varied diet. If you are pregnant, nursing, taking medication or have a medical condition, ask your doctor before use.</p>',
    'The terms that apply when you buy from the Daybloom store.',
  ],
]

export function daybloomContent(ctx: InstallContext): ContentEntry[] {
  return PAGES.map(([kind, handle, title, body, seoDescription]) => ({
    id: `${ctx.prefix}-${kind}-${handle}`,
    channelId: ctx.channelId,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Daybloom`,
    seoDescription,
    imageName: '',
    publishedAt: '',
    updatedAt: UPDATED,
  }))
}

export const DAYBLOOM_BLOG_SEO: BlogSeoSettings = {
  title: 'The Daybloom Journal',
  metaDescription: 'Short, practical reads on sleep, energy and everyday health from the Daybloom team.',
}

// ── Theme templates ──────────────────────────────────────────────────────────
// Drawn by the classic drawing. The home page follows what a supplements store
// leads with: an offer, the promises, shop by goal, the bestsellers, how the
// subscription works, and why to trust what is in the bottle.

const SHIPPING_AND_RETURNS = 'Free shipping on every order, delivered in 3 to 5 business days.\n\nEvery product has a 30-day money-back guarantee: if it is not right for you, tell us within 30 days of delivery and we refund it, opened or not.'
const SUBSCRIPTION_ROW = 'Choose a delivery every month (20% off), every 2 months (15% off) or every 3 months (10% off).\n\nWe email you before each renewal. Pause, skip a delivery, change how often it comes or cancel from your account at any time. There is no minimum number of deliveries.'
const WARNINGS = 'Do not exceed the suggested use. Food supplements are not a substitute for a varied diet. Keep out of reach of children.\n\nIf you are pregnant, nursing, taking medication or have a medical condition, ask your doctor before use.'

export function daybloomThemeTemplates(ctx: InstallContext): Record<TemplateType, ThemeSection[]> {
  const id = (name: string): string => `${ctx.prefix}-${name}`
  const header = (template: TemplateType) => createSection('header', { menuStyle: 'Centered' }, id(`${template}-header`))
  const footer = (template: TemplateType) => createSection('footer', { showSocial: false, columns: 3 }, id(`${template}-footer`))
  const tile = (title: DaybloomCollection, image: string) => {
    const handle = toHandle(title)
    return createBlock('collection', { label: title, link: `/collections/${handle}`, image }, id(`collection-${handle}`))
  }
  const row = (key: string, settings: Record<string, string | boolean>) => createBlock('collapsible-row', { text: '', open: false, ...settings }, id(`row-${key}`))
  return {
    home: [
      createSection('announcement-bar', { text: 'Free shipping on every order · Subscribe and save up to 20% · 30-day money-back guarantee', link: '' }, id('home-announcement')),
      header('home'),
      {
        ...createSection('image-banner', {
          headline: 'Daily supplements, made simple',
          subheadline: 'For sleep, energy, gut health and immunity. Every ingredient on the label, every batch tested, delivered on your schedule.',
          height: 'Large',
          image: DAYBLOOM_PHOTOS.hero,
        }, id('home-banner')),
        blocks: [createBlock('button', { label: 'Shop bestsellers', link: '/collections/bestsellers' }, id('banner-button'))],
      },
      {
        ...createSection('icon-row', { title: '' }, id('home-promises')),
        blocks: [
          // Short titles: four sit side by side, and each should fit on one line.
          createBlock('feature', { icon: 'shield-check', title: 'Independently tested', text: 'Every batch, for purity and strength.', link: '/page/quality-and-testing' }, id('promise-tested')),
          createBlock('feature', { icon: 'clock', title: 'Subscribe and save', text: 'Up to 20% off. Pause or cancel any time.', link: '/page/subscribe-and-save' }, id('promise-subscribe')),
          createBlock('feature', { icon: 'truck', title: 'Free shipping', text: 'On every order, in 3 to 5 business days.', link: '' }, id('promise-shipping')),
          createBlock('feature', { icon: 'rotate-ccw', title: '30-day guarantee', text: 'Your money back, opened or not.', link: '/page/shipping-and-returns' }, id('promise-guarantee')),
        ],
      },
      {
        ...createSection('collection-grid', { title: 'Shop by goal', columns: 3 }, id('home-collections')),
        blocks: [
          tile('Sleep', DAYBLOOM_PHOTOS.tileSleep),
          tile('Energy', DAYBLOOM_PHOTOS.tileEnergy),
          tile('Gut health', DAYBLOOM_PHOTOS.tileGut),
          tile('Immunity', DAYBLOOM_PHOTOS.tileImmunity),
        ],
      },
      createSection('featured-products', { title: 'Bestsellers', productCount: 4 }, id('home-featured')),
      createSection('image-with-text', {
        heading: 'Subscribe and save up to 20%',
        body: 'Choose a delivery every 1, 2 or 3 months and we send it on that schedule, for less than buying it once. Pause, skip a delivery or cancel from your account at any time.',
        buttonLabel: 'How it works',
        buttonLink: '/page/subscribe-and-save',
        imageSide: 'Left',
        image: DAYBLOOM_PHOTOS.storySubscribe,
      }, id('home-story-subscribe')),
      createSection('image-with-text', {
        heading: 'Tested before it reaches you',
        body: 'Every batch is tested by an independent lab for purity and strength, and every label lists each ingredient and its amount. No proprietary blends, no artificial colors.',
        buttonLabel: 'Quality and testing',
        buttonLink: '/page/quality-and-testing',
        imageSide: 'Right',
        image: DAYBLOOM_PHOTOS.storyQuality,
      }, id('home-story-quality')),
      createSection('rich-text', { heading: 'Start with one', body: 'Most of our customers start with a single product, and Magnesium Glycinate is the one they choose most. Every order has a 30-day money-back guarantee, so there is nothing to lose by trying.', alignment: 'Center' }, id('home-start')),
      createSection('newsletter', { headline: 'Get the Daybloom letter' }, id('home-newsletter')),
      footer('home'),
    ],
    product: [
      header('product'),
      {
        // No reviews line: the store has no reviews to show.
        ...createSection('product-detail', { showReviews: false }, id('product-detail')),
        blocks: [
          // How the product's plan is offered: the subscription first, in cards, with the terms one press away.
          createBlock('purchase-options', {
            style: 'Cards',
            defaultSelection: 'Subscription',
            policyText: 'Pause, skip or cancel any time.',
            termsLink: '/policies/subscription-terms',
            cardBadge: true,
          }, id('purchase-options')),
          row('facts', { title: 'Supplement facts', source: 'facts' }),
          row('subscription', { title: 'How Subscribe and save works', source: 'custom', text: SUBSCRIPTION_ROW }),
          row('shipping', { title: 'Shipping and returns', source: 'delivery-returns', text: SHIPPING_AND_RETURNS }),
          row('warnings', { title: 'Warnings', source: 'custom', text: WARNINGS }),
        ],
      },
      createSection('featured-products', { title: 'You may also like' }, id('product-related')),
      footer('product'),
    ],
    collection: [
      header('collection'),
      createSection('collection-grid', {}, id('collection-grid')),
      footer('collection'),
    ],
    cart: [
      header('cart'),
      createSection('cart-summary', {}, id('cart-summary')),
      footer('cart'),
    ],
  }
}
