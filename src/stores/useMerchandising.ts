import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'

/* ── Types ─────────────────────────────────────────────────────── */

export interface MerchStore {
  id: string
  domain: string
  platform: 'Shopify' | 'BigCommerce' | 'Magento'
  connected: 'active' | 'inactive'
  lastActivity: string
  productCount: number
  engineCount: number
}

export type SynonymType = 'one_way' | 'two_way'
export interface Synonym {
  id: string
  channelId: string
  status: 'active' | 'inactive'
  type: SynonymType
  queries: string[]
  leadsTo: string[]
  updatedAt: string
}

export interface PageRedirect {
  id: string
  channelId: string
  queries: string[]
  leadsTo: string
  updatedAt: string
}

export type CollectionFilterType = 'manual' | 'synced'
export type CollectionFilterOperator = 'equals' | 'contains'

export interface CollectionFilter {
  id: string
  field: string
  operator: CollectionFilterOperator
  value: string
}

export interface SmartCollection {
  id: string
  channelId: string
  name: string
  status: 'active' | 'inactive'
  filterType: CollectionFilterType
  updatedAt: string
  /** Findify collection-edit config (Shopify Filters / Activation / Filters & Sorting tabs). */
  useShopifyFilters?: boolean
  pageUrl?: string
  filters?: CollectionFilter[]
  sortBy?: string
}

/* Default Merchandising (pinning + merchandising rules) */

export interface MerchProduct {
  id: string
  channelId: string
  title: string
  image: string
  price: number
  compareAt?: number
  qty: number
  brand: string
  color: string
  size: string
  category: string
  tags: string[]
  popularity: number
  createdAt: string
}

export interface PinningRule {
  id: string
  channelId: string
  collectionId: string
  pinnedProductIds: string[]
  updatedAt: string
}

export type MerchConditionAction = 'include' | 'exclude' | 'promote' | 'pin'

/** Findify condition-type labels ("include" surfaces as "Only include"). */
export const MERCH_CONDITION_ACTION_LABELS: Record<MerchConditionAction, string> = {
  promote: 'Promote',
  pin: 'Pin',
  include: 'Only include',
  exclude: 'Exclude',
}

export type MerchConditionApplyTo = 'both' | 'product' | 'variant'

export interface MerchCondition {
  id: string
  action: MerchConditionAction
  /** Findify "Apply to" scope; defaults to both. */
  applyTo?: MerchConditionApplyTo
  /** -99 (bury) … 90 (boost); only for action === 'promote' */
  weight?: number
  field: string
  values: string[]
}

export interface MerchRule {
  id: string
  channelId: string
  name: string
  active: boolean
  collectionIds: string[]
  /** Popularity boost multiplier: 0 disables, up to 100 (x) */
  popularityWeight: number
  conditions: MerchCondition[]
  updatedAt: string
}

export type EnginePage = 'home' | 'category' | 'product' | 'cart' | 'custom'
export type EngineType =
  | 'personalized'
  | 'popular_products'
  | 'newest_products'
  | 'visual_recommendations'
  | 'frequently_purchased_together'
  | 'recently_viewed'
  | 'viewed_together'
  | 'new_trending'

export interface RecommendationEngine {
  id: string
  channelId: string
  name: string
  page: EnginePage
  type: EngineType
  status: 'active' | 'inactive'
  updatedAt: string
  /** Product count range the widget renders (defaults 4–10) */
  minProducts?: number
  maxProducts?: number
  /** Fallback strategies when the engine lacks data for a shopper */
  fallbacks?: string[]
  /** Internal notes for the team */
  notes?: string
  /** Optional include/exclude filters applied to the widget's candidates */
  conditions?: MerchCondition[]
}

export interface FieldTransformation {
  id: string
  channelId: string
  name: string
  inputField: string
  outputField: string | null
  ruleType: 'field_manipulation' | 'value_transformation'
  translations: string[]
  status: 'active' | 'inactive'
  updatedAt: string
}

export type MerchPromoScope = 'search' | 'collections'

export interface SearchPin {
  id: string
  channelId: string
  query: string
  pinnedProductIds: string[]
  updatedAt: string
}

export interface SearchRule {
  id: string
  channelId: string
  name: string
  terms: string[]
  conditions: MerchCondition[]
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface PromoCard {
  id: string
  channelId: string
  scope: MerchPromoScope
  title: string
  imageLabel: string
  /** Search terms (or collections) that trigger the card (Findify wizard step 2). */
  terms: string[]
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface MerchBanner {
  id: string
  channelId: string
  scope: MerchPromoScope
  title: string
  imageLabel: string
  targetUrl: string
  /** Search terms (or collections) that trigger the banner (Findify wizard step). */
  terms: string[]
  status: 'active' | 'inactive'
  updatedAt: string
}

export type BlacklistLogic = 'exact' | 'contains'

export interface BlacklistTerm {
  id: string
  channelId: string
  logic: BlacklistLogic
  term: string
}

export interface BlacklistedProduct {
  id: string
  channelId: string
  productId: string
  active: boolean
}

export interface SyncInfo {
  channelId: string
  catalogCount: number
  lastFullSync: string
  lastDeltaSync: string
  feedStatus: 'healthy' | 'delayed' | 'failed'
}

export interface MerchAnalytics {
  totalRevenue: number
  merchCloudRevenue: number
  merchCloudShare: number
  avgOrderValue: number
  totalRevenueTrend: number
  merchCloudRevenueTrend: number
  merchCloudShareTrend: number
  avgOrderValueTrend: number
  revenueTrend: Array<{ date: string; total: number; merchCloud: number }>
  contribution: Array<{ label: string; value: number }>
}

/** Per-module report data backing the merchandising analytics pages. */
export interface MerchModuleAnalytics {
  snapshot: {
    revenue: number
    mcRevenue: number
    avgOrderValue: number
    productsSold: number
    visits: number
    uniqueVisitors: number
  }
  searchReport: {
    queries: Array<{ term: string; count: number; ctr: number; conversion: number }>
    noResultQueries: Array<{ term: string; count: number }>
  }
  collectionsReport: {
    rows: Array<{ collection: string; views: number; revenue: number; conversion: number }>
  }
  recommendationsReport: {
    rows: Array<{ engine: string; impressions: number; clicks: number; revenue: number }>
  }
}

/* ── Sample data ──────────────────────────────────────────────── */

const DEFAULT_CHANNEL_ID = 'retest-sales-notification'
const FASHION_CHANNEL_ID = 'shopify-fashion'

/** Stamp a channel id onto seed rows authored without one. */
const withChannel = <T>(channelId: string, rows: Omit<T, 'channelId'>[]): T[] =>
  rows.map((row) => ({ ...row, channelId }) as T)

const stores: MerchStore[] = [
  {
    id: 'mydemostore',
    domain: 'MyDemostore.com',
    platform: 'Shopify',
    connected: 'active',
    lastActivity: 'May 19, 2026 at 4:22 PM',
    productCount: 4823,
    engineCount: 15,
  },
  {
    id: 'supersalesstore',
    domain: 'SuperSalesStore.com',
    platform: 'Shopify',
    connected: 'active',
    lastActivity: 'May 19, 2026 at 2:29 PM',
    productCount: 612,
    engineCount: 2,
  },
]

const synonyms: Synonym[] = withChannel<Synonym>(DEFAULT_CHANNEL_ID, [
  { id: 's1', status: 'active', type: 'one_way', queries: ['dress2'], leadsTo: ['shoes'], updatedAt: 'May 19, 2026' },
  { id: 's2', status: 'active', type: 'one_way', queries: ['testkiki'], leadsTo: ['newtest'], updatedAt: 'May 18, 2026' },
  { id: 's3', status: 'active', type: 'two_way', queries: ['tee', 'tshirt', 't-shirt'], leadsTo: [], updatedAt: 'May 14, 2026' },
  { id: 's4', status: 'active', type: 'one_way', queries: ['funky shirt'], leadsTo: ['colourful shirt'], updatedAt: 'May 12, 2026' },
  { id: 's5', status: 'active', type: 'one_way', queries: ['dog food'], leadsTo: ['brand'], updatedAt: 'May 10, 2026' },
  { id: 's6', status: 'active', type: 'one_way', queries: ['tablet'], leadsTo: ['ipads'], updatedAt: 'May 8, 2026' },
  { id: 's7', status: 'active', type: 'two_way', queries: ['couch', 'sofa'], leadsTo: [], updatedAt: 'May 7, 2026' },
  { id: 's8', status: 'active', type: 'one_way', queries: ['tablets'], leadsTo: ['ipads'], updatedAt: 'May 5, 2026' },
  { id: 's9', status: 'active', type: 'one_way', queries: ['vegan meal'], leadsTo: ['plant based'], updatedAt: 'May 3, 2026' },
  { id: 's10', status: 'active', type: 'one_way', queries: ['cool socks'], leadsTo: ['colorful socks'], updatedAt: 'May 1, 2026' },
  { id: 's11', status: 'active', type: 'one_way', queries: ['phone'], leadsTo: ['iphone', 'android'], updatedAt: 'Apr 28, 2026' },
  { id: 's12', status: 'active', type: 'one_way', queries: ['apple'], leadsTo: ['computer', 'mac'], updatedAt: 'Apr 25, 2026' },
  { id: 's13', status: 'active', type: 'one_way', queries: ['clock'], leadsTo: ['watch'], updatedAt: 'Apr 22, 2026' },
  { id: 's14', status: 'active', type: 'one_way', queries: ['fruit'], leadsTo: ['banana', 'apple', 'grape', 'pineaple'], updatedAt: 'Apr 19, 2026' },
  { id: 's15', status: 'inactive', type: 'two_way', queries: ['joggers', 'sweatpants'], leadsTo: [], updatedAt: 'Apr 15, 2026' },
  { id: 's16', status: 'active', type: 'one_way', queries: ['sneakers'], leadsTo: ['kicks', 'trainers'], updatedAt: 'Apr 12, 2026' },
])

const pageRedirects: PageRedirect[] = withChannel<PageRedirect>(DEFAULT_CHANNEL_ID, [
  { id: 'r1', queries: ['test', '1233', '23'], leadsTo: 'https://wer.com', updatedAt: 'May 12, 2026' },
  { id: 'r2', queries: ['erwqfsdf', 'sdfsdf', 'sdfsdfdddd'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'May 8, 2026' },
  { id: 'r3', queries: ['help', 'customer service', 'why'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'May 1, 2026' },
  { id: 'r4', queries: ['help', 'faq', 'return policy'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'Apr 21, 2026' },
])

const collections: SmartCollection[] = withChannel<SmartCollection>(DEFAULT_CHANNEL_ID, [
  { id: 'c1', name: 'all', status: 'active', filterType: 'manual', updatedAt: 'Sep 15, 2025 at 5:39 PM' },
  { id: 'c2', name: 'collections/pinning-showcase', status: 'active', filterType: 'manual', updatedAt: 'Apr 18, 2025 at 3:48 PM' },
  { id: 'c3', name: 'test 2', status: 'active', filterType: 'manual', updatedAt: 'Apr 17, 2026 at 3:23 PM' },
  { id: 'c4', name: 'collections/shoes', status: 'active', filterType: 'manual', updatedAt: 'Sep 16, 2024 at 3:56 PM' },
  { id: 'c5', name: 'collection/test', status: 'active', filterType: 'manual', updatedAt: 'May 19, 2026 at 2:29 PM' },
  { id: 'c6', name: 'collections/shirts', status: 'active', filterType: 'manual', updatedAt: 'May 19, 2026 at 2:29 PM' },
  { id: 'c7', name: 'collections/created-on-old-md', status: 'active', filterType: 'manual', updatedAt: 'Jul 24, 2024 at 2:46 PM' },
  { id: 'c8', name: 'collections/created-on-old-dashboard', status: 'active', filterType: 'manual', updatedAt: 'May 19, 2026 at 2:29 PM' },
  { id: 'c9', name: 'testing', status: 'active', filterType: 'manual', updatedAt: 'May 19, 2026 at 2:29 PM' },
  { id: 'c10', name: 'collections/new-test', status: 'active', filterType: 'synced', updatedAt: 'Feb 7, 2024 at 7:04 PM' },
  { id: 'c11', name: 'collections/sale', status: 'active', filterType: 'synced', updatedAt: 'Aug 22, 2023 at 4:43 PM' },
  { id: 'c12', name: 'collections/dresses', status: 'active', filterType: 'synced', updatedAt: 'Jun 8, 2023 at 4:43 PM' },
  { id: 'c13', name: 'collections/men', status: 'active', filterType: 'synced', updatedAt: 'Jun 8, 2023 at 4:43 PM' },
  { id: 'c14', name: 'collections/women', status: 'active', filterType: 'manual', updatedAt: 'Aug 22, 2025 at 7:14 PM' },
])

/* Default Merchandising sample data */

const PRODUCT_NAMES = [
  'Azur Bracelet in Blue Azurite', 'Boyfriend Jeans', 'Lane Bead Bracelet in Gold Brass', 'Salda Earrings',
  '5 Pocket Jeans', 'Saul Necklace', 'Asymmetric Dress in Black', 'Border Dress in Black/Silver',
  'Bean Dress', 'Napilla Dress', 'Taib Dress', 'Layered Contrast Dress in Cream',
  'Neoprene Flower Dress', 'Graphic Dress', 'Elastic Waist Dress', 'Tie Neck Wool Dress',
  'Tie Waist Dress in Black', 'Davi Dress', 'Sleeveless Hidden Pocket Dress', 'Sleeveless Fitted Dress',
  'Cape Dress', 'Iranta Leather Dress', 'Rhesus Gown', 'Desna Dress',
  'Surplice Dress', 'Linen Shirt in White', 'Italian Wool Jacket', 'Mens Chino Pants',
  'Canvas Weekender Bag', 'Suede Ankle Boots', 'Merino Crew Sweater', 'Silk Scarf in Navy',
  'Leather Belt in Tan', 'Classic Trench Coat', 'Pleated Midi Skirt', 'Cashmere Beanie',
  'Aviator Sunglasses', 'Woven Tote Bag', 'Chelsea Boots in Black', 'Quilted Puffer Vest',
]
const MERCH_BRANDS = ['Atlas', 'Nordica', 'Verve', 'Kinfolk']
const MERCH_COLORS = ['Black', 'White', 'Blue', 'Cream', 'Green', 'Gold']
const MERCH_SIZES = ['XS', 'S', 'M', 'L', 'XL']
const MERCH_CATEGORIES = ["Women's Dresses", 'Jewelry', 'Denim', 'Tops', 'Accessories', 'Shoes']

const merchProducts: MerchProduct[] = PRODUCT_NAMES.map((title, i) => {
  const price = 39 + ((i * 37) % 560)
  const discounted = i % 3 === 0
  return {
    id: `p${i + 1}`,
    channelId: DEFAULT_CHANNEL_ID,
    title,
    image: `https://picsum.photos/seed/merch${i + 1}/400/500`,
    price,
    compareAt: discounted ? Math.round(price * 1.6) : undefined,
    qty: 1 + ((i * 7) % 40),
    brand: MERCH_BRANDS[i % MERCH_BRANDS.length]!,
    color: MERCH_COLORS[i % MERCH_COLORS.length]!,
    size: MERCH_SIZES[i % MERCH_SIZES.length]!,
    category: MERCH_CATEGORIES[i % MERCH_CATEGORIES.length]!,
    tags: i % 4 === 0 ? ['new'] : i % 5 === 0 ? ['sale'] : [],
    popularity: (i * 53) % 100,
    createdAt: new Date(Date.now() - i * 9 * 86400000).toISOString(),
  }
})

const pinningRules: PinningRule[] = withChannel<PinningRule>(DEFAULT_CHANNEL_ID, [
  { id: 'pin1', collectionId: 'c14', pinnedProductIds: ['p1', 'p2', 'p3', 'p7'], updatedAt: 'May 19, 2026' },
  { id: 'pin2', collectionId: 'c2', pinnedProductIds: ['p4', 'p5', 'p6', 'p8', 'p9', 'p10', 'p12', 'p15'], updatedAt: 'May 12, 2026' },
  { id: 'pin3', collectionId: 'c1', pinnedProductIds: ['p11', 'p13'], updatedAt: 'May 8, 2026' },
  { id: 'pin4', collectionId: 'c4', pinnedProductIds: ['p30', 'p39'], updatedAt: 'Apr 30, 2026' },
  { id: 'pin5', collectionId: 'c12', pinnedProductIds: ['p16', 'p17', 'p18', 'p20', 'p22'], updatedAt: 'Apr 22, 2026' },
  { id: 'pin6', collectionId: 'c6', pinnedProductIds: [], updatedAt: 'Apr 10, 2026' },
])

const merchRules: MerchRule[] = withChannel<MerchRule>(DEFAULT_CHANNEL_ID, [
  {
    id: 'mr1', name: 'Dress Collection Rules', active: true, collectionIds: ['c12'], popularityWeight: 1,
    conditions: [{ id: 'mc1', action: 'promote', weight: 90, field: 'Color', values: ['Black'] }],
    updatedAt: 'May 18, 2026',
  },
  {
    id: 'mr2', name: 'Promote new arrivals', active: true, collectionIds: ['c1', 'c14'], popularityWeight: 1,
    conditions: [{ id: 'mc2', action: 'promote', weight: 60, field: 'Tags', values: ['new'] }],
    updatedAt: 'May 14, 2026',
  },
  {
    id: 'mr3', name: 'Hide full-price test', active: false, collectionIds: ['c11'], popularityWeight: 0,
    conditions: [{ id: 'mc3', action: 'include', field: 'Discounted', values: ['Yes'] }],
    updatedAt: 'May 6, 2026',
  },
  {
    id: 'mr4', name: 'Bury oversized stock', active: true, collectionIds: ['c1'], popularityWeight: 50,
    conditions: [{ id: 'mc4', action: 'promote', weight: -70, field: 'Size', values: ['XL'] }],
    updatedAt: 'Apr 28, 2026',
  },
  {
    id: 'mr5', name: 'Jewelry spotlight', active: true, collectionIds: ['c14', 'c2', 'c3', 'c5'], popularityWeight: 1,
    conditions: [
      { id: 'mc5', action: 'promote', weight: 40, field: 'Category', values: ['Jewelry'] },
      { id: 'mc6', action: 'exclude', field: 'Brand', values: ['Verve'] },
    ],
    updatedAt: 'Apr 15, 2026',
  },
])

const recommendationEngines: RecommendationEngine[] = withChannel<RecommendationEngine>(DEFAULT_CHANNEL_ID, [
  { id: 'product-mc-rec-94', name: 'Kristian reco', page: 'product', type: 'new_trending', status: 'active', updatedAt: 'May 19, 2026 at 4:10 PM' },
  { id: 'home-mc-rec-93', name: 'Test', page: 'product', type: 'personalized', status: 'active', updatedAt: 'May 19, 2026 at 4:22 PM' },
  { id: 'cart-mc-rec-92', name: 'My Widget', page: 'cart', type: 'personalized', status: 'active', updatedAt: 'May 8, 2026 at 8:22 PM' },
  { id: 'product-mc-rec-91', name: 'Popular Products', page: 'product', type: 'popular_products', status: 'active', updatedAt: 'Apr 27, 2026 at 11:41 AM' },
  { id: 'product-mc-rec-90', name: 'Visual Reccomendation - Colour', page: 'product', type: 'visual_recommendations', status: 'active', updatedAt: 'Feb 24, 2026 at 9:05 PM' },
  { id: 'product-mc-rec-89', name: 'Size', page: 'product', type: 'visual_recommendations', status: 'active', updatedAt: 'Feb 3, 2026 at 2:36 AM' },
  { id: 'product-mc-rec-88', name: 'test rec', page: 'product', type: 'frequently_purchased_together', status: 'active', updatedAt: 'May 14, 2026 at 9:55 PM' },
  { id: 'home-mc-rec-87', name: 'hot sale', page: 'home', type: 'popular_products', status: 'active', updatedAt: 'Nov 24, 2025 at 12:25 PM' },
  { id: 'product-mc-rec-86', name: 'Test demo', page: 'product', type: 'viewed_together', status: 'active', updatedAt: 'Oct 30, 2025 at 5:35 PM' },
  { id: 'product-mc-rec-85', name: 'Test One', page: 'product', type: 'frequently_purchased_together', status: 'active', updatedAt: 'Oct 30, 2025 at 1:33 AM' },
  { id: 'product-mc-rec-84', name: 'Test Two', page: 'product', type: 'frequently_purchased_together', status: 'active', updatedAt: 'Oct 30, 2025 at 1:33 AM' },
  { id: 'product-mc-rec-83', name: 'test', page: 'product', type: 'recently_viewed', status: 'active', updatedAt: 'Aug 28, 2025 at 7:05 PM' },
  { id: 'product-mc-rec-82', name: 'testing visual reco', page: 'product', type: 'visual_recommendations', status: 'active', updatedAt: 'Aug 25, 2025 at 6:18 PM' },
  { id: 'home-mc-rec-81', name: 'Filters preview test', page: 'home', type: 'personalized', status: 'active', updatedAt: 'Aug 28, 2025 at 6:46 PM' },
  { id: 'cart-mc-rec-80', name: 'cart-Freq', page: 'cart', type: 'frequently_purchased_together', status: 'active', updatedAt: 'Jun 16, 2025 at 9:53 PM' },
])

const fieldTransformations: FieldTransformation[] = withChannel<FieldTransformation>(DEFAULT_CHANNEL_ID, [
  { id: 'ft1', name: 'Warren test', inputField: 'Material', outputField: 'ww_material', ruleType: 'field_manipulation', translations: ['EN', 'IT'], status: 'active', updatedAt: 'May 14, 2026' },
  { id: 'ft2', name: 'Color rule test', inputField: 'Color', outputField: null, ruleType: 'field_manipulation', translations: ['EN'], status: 'active', updatedAt: 'May 12, 2026' },
])

/* Fashion Boutique (Shopify) — compact differentiated seed set */

const fashionCollections: SmartCollection[] = withChannel<SmartCollection>(FASHION_CHANNEL_ID, [
  { id: 'fc1', name: 'collections/dresses', status: 'active', filterType: 'synced', updatedAt: 'May 18, 2026 at 6:12 PM' },
  { id: 'fc2', name: 'collections/outerwear', status: 'active', filterType: 'synced', updatedAt: 'May 15, 2026 at 2:40 PM' },
  { id: 'fc3', name: 'collections/new-season', status: 'active', filterType: 'manual', updatedAt: 'May 19, 2026 at 9:05 AM' },
  { id: 'fc4', name: 'collections/sale', status: 'inactive', filterType: 'synced', updatedAt: 'Apr 30, 2026 at 4:18 PM' },
])

const fashionProducts: MerchProduct[] = withChannel<MerchProduct>(FASHION_CHANNEL_ID, [
  { id: 'fp1', title: 'Wrap Midi Dress in Emerald', image: 'https://picsum.photos/seed/fashion1/400/500', price: 128, qty: 18, brand: 'Maison Rue', color: 'Green', size: 'M', category: "Women's Dresses", tags: ['new'], popularity: 88, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'fp2', title: 'Double-Breasted Wool Blazer', image: 'https://picsum.photos/seed/fashion2/400/500', price: 245, compareAt: 320, qty: 9, brand: 'Atelier North', color: 'Black', size: 'S', category: 'Outerwear', tags: ['sale'], popularity: 74, createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: 'fp3', title: 'Pleated Satin Slip Skirt', image: 'https://picsum.photos/seed/fashion3/400/500', price: 98, qty: 26, brand: 'Maison Rue', color: 'Cream', size: 'M', category: 'Skirts', tags: ['new'], popularity: 69, createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'fp4', title: 'Oversized Trench Coat in Camel', image: 'https://picsum.photos/seed/fashion4/400/500', price: 320, qty: 6, brand: 'Atelier North', color: 'Gold', size: 'L', category: 'Outerwear', tags: [], popularity: 91, createdAt: new Date(Date.now() - 34 * 86400000).toISOString() },
  { id: 'fp5', title: 'Silk Camisole in Ivory', image: 'https://picsum.photos/seed/fashion5/400/500', price: 75, compareAt: 95, qty: 31, brand: 'Velle', color: 'White', size: 'XS', category: 'Tops', tags: ['sale'], popularity: 57, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'fp6', title: 'Wide-Leg Linen Trousers', image: 'https://picsum.photos/seed/fashion6/400/500', price: 110, qty: 14, brand: 'Velle', color: 'Cream', size: 'M', category: 'Trousers', tags: ['new'], popularity: 63, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
])

const fashionSynonyms: Synonym[] = withChannel<Synonym>(FASHION_CHANNEL_ID, [
  { id: 'fs1', status: 'active', type: 'one_way', queries: ['gown'], leadsTo: ['dress'], updatedAt: 'May 17, 2026' },
  { id: 'fs2', status: 'active', type: 'two_way', queries: ['blazer', 'suit jacket'], leadsTo: [], updatedAt: 'May 9, 2026' },
])

const fashionPageRedirects: PageRedirect[] = withChannel<PageRedirect>(FASHION_CHANNEL_ID, [
  { id: 'fr1', queries: ['size guide', 'sizing', 'fit'], leadsTo: 'https://fashionboutique.com/pages/size-guide', updatedAt: 'May 11, 2026' },
])

const fashionRecommendationEngines: RecommendationEngine[] = withChannel<RecommendationEngine>(FASHION_CHANNEL_ID, [
  { id: 'home-mc-rec-120', name: 'New season picks', page: 'home', type: 'newest_products', status: 'active', updatedAt: 'May 18, 2026 at 3:45 PM' },
  { id: 'product-mc-rec-121', name: 'Complete the look', page: 'product', type: 'frequently_purchased_together', status: 'active', updatedAt: 'May 12, 2026 at 10:20 AM' },
])

const fashionPinningRules: PinningRule[] = withChannel<PinningRule>(FASHION_CHANNEL_ID, [
  { id: 'fpin1', collectionId: 'fc1', pinnedProductIds: ['fp1', 'fp3'], updatedAt: 'May 16, 2026' },
])

const fashionMerchRules: MerchRule[] = withChannel<MerchRule>(FASHION_CHANNEL_ID, [
  {
    id: 'fmr1', name: 'Push new season stock', active: true, collectionIds: ['fc3'], popularityWeight: 1,
    conditions: [{ id: 'fmc1', action: 'promote', weight: 80, field: 'Tags', values: ['new'] }],
    updatedAt: 'May 15, 2026',
  },
])

const fashionFieldTransformations: FieldTransformation[] = withChannel<FieldTransformation>(FASHION_CHANNEL_ID, [
  { id: 'fft1', name: 'Fabric mapping', inputField: 'Material', outputField: 'fabric', ruleType: 'field_manipulation', translations: ['EN', 'FR'], status: 'active', updatedAt: 'May 10, 2026' },
  { id: 'fft2', name: 'Size normalization', inputField: 'Size', outputField: null, ruleType: 'value_transformation', translations: ['EN'], status: 'inactive', updatedAt: 'Apr 28, 2026' },
])

/* New entity seeds (search pins, promos, banners, blacklists, sync) */

const searchPins: SearchPin[] = [
  { id: 'sp1', channelId: DEFAULT_CHANNEL_ID, query: 'parka', pinnedProductIds: ['p34', 'p40'], updatedAt: 'May 16, 2026' },
  { id: 'sp2', channelId: DEFAULT_CHANNEL_ID, query: 'boots', pinnedProductIds: ['p30', 'p39'], updatedAt: 'May 13, 2026' },
  { id: 'sp3', channelId: DEFAULT_CHANNEL_ID, query: 'tote', pinnedProductIds: ['p29', 'p38'], updatedAt: 'May 4, 2026' },
  { id: 'sp4', channelId: FASHION_CHANNEL_ID, query: 'dress', pinnedProductIds: ['fp1', 'fp3'], updatedAt: 'May 17, 2026' },
  { id: 'sp5', channelId: FASHION_CHANNEL_ID, query: 'blazer', pinnedProductIds: ['fp2'], updatedAt: 'May 8, 2026' },
]

const searchRules: SearchRule[] = [
  {
    id: 'srl1', channelId: DEFAULT_CHANNEL_ID, name: 'Boost denim on jeans searches', terms: ['jeans', 'denim'],
    conditions: [{ id: 'srlc1', action: 'promote', weight: 70, field: 'Category', values: ['Denim'] }],
    status: 'active', updatedAt: 'May 15, 2026',
  },
  {
    id: 'srl2', channelId: DEFAULT_CHANNEL_ID, name: 'Hide Verve on sale queries', terms: ['sale', 'clearance'],
    conditions: [{ id: 'srlc2', action: 'exclude', field: 'Brand', values: ['Verve'] }],
    status: 'inactive', updatedAt: 'May 2, 2026',
  },
  {
    id: 'srl3', channelId: FASHION_CHANNEL_ID, name: 'Promote new season on dress searches', terms: ['dress', 'gown'],
    conditions: [{ id: 'srlc3', action: 'promote', weight: 60, field: 'Tags', values: ['new'] }],
    status: 'active', updatedAt: 'May 16, 2026',
  },
]

const promoCards: PromoCard[] = [
  { id: 'promo1', channelId: DEFAULT_CHANNEL_ID, scope: 'search', title: 'Summer sale — up to 40% off', imageLabel: 'Summer sale hero', terms: ['sale', 'summer'], status: 'active', updatedAt: 'May 14, 2026' },
  { id: 'promo2', channelId: DEFAULT_CHANNEL_ID, scope: 'collections', title: 'New denim drop', imageLabel: 'Denim lifestyle shot', terms: ['collections/new-arrivals'], status: 'inactive', updatedAt: 'Apr 29, 2026' },
  { id: 'promo3', channelId: FASHION_CHANNEL_ID, scope: 'search', title: 'New season edit', imageLabel: 'Runway lookbook card', terms: ['new', 'dress'], status: 'active', updatedAt: 'May 18, 2026' },
  { id: 'promo4', channelId: FASHION_CHANNEL_ID, scope: 'collections', title: 'Outerwear event — 20% off', imageLabel: 'Trench coat street style', terms: ['collections/outerwear'], status: 'active', updatedAt: 'May 6, 2026' },
]

const merchBanners: MerchBanner[] = [
  { id: 'bn1', channelId: DEFAULT_CHANNEL_ID, scope: 'search', title: 'Free shipping over $75', imageLabel: 'Free shipping ribbon', targetUrl: 'https://MyDemostore.com/pages/shipping', terms: ['shipping', 'delivery'], status: 'active', updatedAt: 'May 12, 2026' },
  { id: 'bn2', channelId: DEFAULT_CHANNEL_ID, scope: 'collections', title: 'Members get early access', imageLabel: 'Loyalty banner', targetUrl: 'https://MyDemostore.com/pages/rewards', terms: ['collections/sale'], status: 'inactive', updatedAt: 'Apr 24, 2026' },
  { id: 'bn3', channelId: FASHION_CHANNEL_ID, scope: 'search', title: 'Spring lookbook is live', imageLabel: 'Spring lookbook banner', targetUrl: 'https://fashionboutique.com/pages/lookbook', terms: ['spring', 'lookbook'], status: 'active', updatedAt: 'May 15, 2026' },
]

const blacklistTerms: BlacklistTerm[] = [
  { id: 'bt1', channelId: DEFAULT_CHANNEL_ID, logic: 'exact', term: 'cheap' },
  { id: 'bt2', channelId: DEFAULT_CHANNEL_ID, logic: 'contains', term: 'counterfeit' },
  { id: 'bt3', channelId: FASHION_CHANNEL_ID, logic: 'contains', term: 'replica' },
]

const blacklistedProducts: BlacklistedProduct[] = [
  { id: 'bp1', channelId: DEFAULT_CHANNEL_ID, productId: 'p23', active: true },
  { id: 'bp2', channelId: DEFAULT_CHANNEL_ID, productId: 'p31', active: false },
]

const syncInfoByChannel: Record<string, SyncInfo> = {
  [DEFAULT_CHANNEL_ID]: {
    channelId: DEFAULT_CHANNEL_ID,
    catalogCount: 4823,
    lastFullSync: 'May 19, 2026 at 4:22 PM',
    lastDeltaSync: 'May 19, 2026 at 6:05 PM',
    feedStatus: 'healthy',
  },
  [FASHION_CHANNEL_ID]: {
    channelId: FASHION_CHANNEL_ID,
    catalogCount: 612,
    lastFullSync: 'May 18, 2026 at 11:40 PM',
    lastDeltaSync: 'May 19, 2026 at 5:12 PM',
    feedStatus: 'delayed',
  },
}

function buildAnalytics(
  scale = 1,
  shareShift = 0,
  trends: [number, number, number, number] = [18.4, 23.7, 4.5, 5.2],
): MerchAnalytics {
  const days = 30
  const today = new Date()
  const trend: MerchAnalytics['revenueTrend'] = []
  let total = 0
  let merchCloud = 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // Realistic curve with weekly seasonality
    const base = 14000 + Math.sin(i / 3) * 2200 + (i % 7 === 0 ? 3500 : 0)
    const dayTotal = Math.round((base + (i * 110)) * scale)
    const dayMerchCloud = Math.round(dayTotal * (0.42 + shareShift + Math.sin(i / 5) * 0.05))
    total += dayTotal
    merchCloud += dayMerchCloud
    trend.push({
      date: d.toISOString().slice(0, 10),
      total: dayTotal,
      merchCloud: dayMerchCloud,
    })
  }
  const share = Math.round((merchCloud / total) * 1000) / 10
  const aov = Math.round((total / Math.round(2480 * scale)) * 100) / 100
  return {
    totalRevenue: total,
    merchCloudRevenue: merchCloud,
    merchCloudShare: share,
    avgOrderValue: aov,
    totalRevenueTrend: trends[0],
    merchCloudRevenueTrend: trends[1],
    merchCloudShareTrend: trends[2],
    avgOrderValueTrend: trends[3],
    revenueTrend: trend,
    contribution: [
      { label: 'MerchCloud-driven', value: merchCloud },
      { label: 'Other channels', value: total - merchCloud },
    ],
  }
}

const analyticsByChannel: Record<string, MerchAnalytics> = {
  [DEFAULT_CHANNEL_ID]: buildAnalytics(),
  [FASHION_CHANNEL_ID]: buildAnalytics(0.4, 0.09, [11.2, 15.8, 2.1, 3.4]),
}

const moduleAnalyticsByChannel: Record<string, MerchModuleAnalytics> = {
  [DEFAULT_CHANNEL_ID]: {
    snapshot: { revenue: 486200, mcRevenue: 214900, avgOrderValue: 196.05, productsSold: 6470, visits: 88400, uniqueVisitors: 61200 },
    searchReport: {
      queries: [
        { term: 'dress', count: 4210, ctr: 38.2, conversion: 4.6 },
        { term: 'jeans', count: 2980, ctr: 41.5, conversion: 5.1 },
        { term: 'boots', count: 2140, ctr: 35.8, conversion: 3.9 },
        { term: 'necklace', count: 1620, ctr: 29.4, conversion: 2.8 },
        { term: 'jacket', count: 1480, ctr: 33.1, conversion: 3.4 },
        { term: 'tote', count: 990, ctr: 27.6, conversion: 2.2 },
      ],
      noResultQueries: [
        { term: 'gift card', count: 312 },
        { term: 'swimwear', count: 204 },
        { term: 'kids', count: 158 },
        { term: 'raincoat', count: 96 },
      ],
    },
    collectionsReport: {
      rows: [
        { collection: 'collections/women', views: 18400, revenue: 92300, conversion: 4.2 },
        { collection: 'collections/dresses', views: 14100, revenue: 78600, conversion: 4.8 },
        { collection: 'collections/sale', views: 12800, revenue: 54200, conversion: 5.6 },
        { collection: 'collections/men', views: 9600, revenue: 41800, conversion: 3.1 },
        { collection: 'collections/shoes', views: 7200, revenue: 36500, conversion: 3.7 },
      ],
    },
    recommendationsReport: {
      rows: [
        { engine: 'Popular Products', impressions: 64200, clicks: 5140, revenue: 48200 },
        { engine: 'Kristian reco', impressions: 41800, clicks: 3020, revenue: 29600 },
        { engine: 'hot sale', impressions: 28700, clicks: 2410, revenue: 21900 },
        { engine: 'cart-Freq', impressions: 19300, clicks: 1780, revenue: 17400 },
      ],
    },
  },
  [FASHION_CHANNEL_ID]: {
    snapshot: { revenue: 168400, mcRevenue: 89700, avgOrderValue: 241.3, productsSold: 1580, visits: 32600, uniqueVisitors: 24100 },
    searchReport: {
      queries: [
        { term: 'dress', count: 1860, ctr: 44.7, conversion: 6.2 },
        { term: 'blazer', count: 1240, ctr: 39.3, conversion: 4.9 },
        { term: 'trench coat', count: 880, ctr: 42.1, conversion: 5.4 },
        { term: 'silk', count: 640, ctr: 31.8, conversion: 3.6 },
        { term: 'linen trousers', count: 410, ctr: 36.5, conversion: 4.1 },
        { term: 'skirt', count: 380, ctr: 28.9, conversion: 2.9 },
      ],
      noResultQueries: [
        { term: 'menswear', count: 186 },
        { term: 'bridal', count: 122 },
        { term: 'petite', count: 84 },
        { term: 'shoes', count: 61 },
      ],
    },
    collectionsReport: {
      rows: [
        { collection: 'collections/dresses', views: 9200, revenue: 46800, conversion: 5.8 },
        { collection: 'collections/new-season', views: 7400, revenue: 38200, conversion: 5.1 },
        { collection: 'collections/outerwear', views: 5100, revenue: 33700, conversion: 4.4 },
        { collection: 'collections/sale', views: 3800, revenue: 15900, conversion: 6.3 },
        { collection: 'collections/tops', views: 2600, revenue: 9800, conversion: 2.7 },
      ],
    },
    recommendationsReport: {
      rows: [
        { engine: 'New season picks', impressions: 21400, clicks: 2260, revenue: 19800 },
        { engine: 'Complete the look', impressions: 16800, clicks: 1930, revenue: 17200 },
        { engine: 'Popular products', impressions: 9400, clicks: 720, revenue: 6400 },
        { engine: 'Recently viewed', impressions: 6100, clicks: 480, revenue: 3900 },
      ],
    },
  },
}

/* ── Store ────────────────────────────────────────────────────── */

export const useMerchandisingStore = defineStore('merchandising', () => {
  const merchStores = ref<MerchStore[]>(stores)
  const activeStoreId = ref<string>(stores[0]!.id)

  /* — Channel scoping — */

  const activeChannelId = ref('')

  function setActiveChannel(channelId: string) {
    activeChannelId.value = channelId
  }

  /** Channel stamped onto newly created rows. */
  const seedChannelId = () => activeChannelId.value || DEFAULT_CHANNEL_ID

  /** Channel-filtered view; falls back to all rows when unscoped or the channel has no data. */
  function channelView<T extends { channelId: string }>(rows: Ref<T[]>) {
    return computed(() => {
      if (!activeChannelId.value) return rows.value
      const filtered = rows.value.filter((row) => row.channelId === activeChannelId.value)
      return filtered.length > 0 ? filtered : rows.value
    })
  }

  /* — Internal state (all channels) — */

  const allSynonyms = ref<Synonym[]>([...synonyms, ...fashionSynonyms])
  const allRedirects = ref<PageRedirect[]>([...pageRedirects, ...fashionPageRedirects])
  const allCollections = ref<SmartCollection[]>([...collections, ...fashionCollections])
  const allMerchProducts = ref<MerchProduct[]>([...merchProducts, ...fashionProducts])
  const allPinningRules = ref<PinningRule[]>([...pinningRules, ...fashionPinningRules].map((r) => ({ ...r, pinnedProductIds: [...r.pinnedProductIds] })))
  const allMerchRules = ref<MerchRule[]>([...merchRules, ...fashionMerchRules].map((r) => ({ ...r, collectionIds: [...r.collectionIds], conditions: r.conditions.map((c) => ({ ...c, values: [...c.values] })) })))
  const allEngines = ref<RecommendationEngine[]>([...recommendationEngines, ...fashionRecommendationEngines])
  const allFields = ref<FieldTransformation[]>([...fieldTransformations, ...fashionFieldTransformations])
  const allSearchPins = ref<SearchPin[]>(searchPins.map((p) => ({ ...p, pinnedProductIds: [...p.pinnedProductIds] })))
  const allSearchRules = ref<SearchRule[]>(searchRules.map((r) => ({ ...r, terms: [...r.terms], conditions: r.conditions.map((c) => ({ ...c, values: [...c.values] })) })))
  const allPromoCards = ref<PromoCard[]>([...promoCards])
  const allBanners = ref<MerchBanner[]>([...merchBanners])
  const allBlacklistTerms = ref<BlacklistTerm[]>([...blacklistTerms])
  const allBlacklistedProducts = ref<BlacklistedProduct[]>([...blacklistedProducts])

  /* — Channel-scoped views (names kept stable for consumers) — */

  const synonymList = channelView(allSynonyms)
  const redirectList = channelView(allRedirects)
  const collectionList = channelView(allCollections)
  const merchProductList = channelView(allMerchProducts)
  const pinningRuleList = channelView(allPinningRules)
  const merchRuleList = channelView(allMerchRules)
  const engineList = channelView(allEngines)
  const fieldList = channelView(allFields)
  const searchPinList = channelView(allSearchPins)
  const searchRuleList = channelView(allSearchRules)
  const promoCardList = channelView(allPromoCards)
  const bannerList = channelView(allBanners)
  const blacklistTermList = channelView(allBlacklistTerms)
  const blacklistedProductList = channelView(allBlacklistedProducts)

  const analytics = computed<MerchAnalytics>(() =>
    analyticsByChannel[activeChannelId.value] ?? analyticsByChannel[DEFAULT_CHANNEL_ID]!,
  )

  const moduleAnalytics = computed<MerchModuleAnalytics>(() =>
    moduleAnalyticsByChannel[activeChannelId.value] ?? moduleAnalyticsByChannel[DEFAULT_CHANNEL_ID]!,
  )

  const syncInfo = computed<SyncInfo>(() =>
    syncInfoByChannel[activeChannelId.value] ?? syncInfoByChannel[DEFAULT_CHANNEL_ID]!,
  )

  // When a sales channel is active (channel-scoped workspace), activeStore
  // mirrors that channel so view subtitles show the right domain/platform.
  const salesChannelsStore = useSalesChannelsStore()

  const activeStore = computed<MerchStore>(() => {
    const base = merchStores.value.find((s) => s.id === activeStoreId.value) ?? merchStores.value[0]!
    if (!activeChannelId.value) return base
    const channel = salesChannelsStore.channels.find((c) => c.id === activeChannelId.value)
    if (!channel?.webStore?.domain) return base
    return {
      ...base,
      id: channel.id,
      domain: channel.webStore.domain,
      platform: channel.provider === 'shopify' ? 'Shopify' : base.platform,
    }
  })

  function setActiveStore(id: string) {
    if (merchStores.value.some((s) => s.id === id)) {
      activeStoreId.value = id
    }
  }

  function toggleSynonymStatus(id: string) {
    const row = allSynonyms.value.find((s) => s.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function bulkSetSynonymStatus(ids: string[], status: 'active' | 'inactive') {
    allSynonyms.value.forEach((row) => {
      if (ids.includes(row.id)) row.status = status
    })
  }

  function deleteSynonyms(ids: string[]) {
    allSynonyms.value = allSynonyms.value.filter((row) => !ids.includes(row.id))
  }

  function saveSynonym(id: string, payload: { type: SynonymType; queries: string[]; leadsTo: string[] }) {
    const row = allSynonyms.value.find((s) => s.id === id)
    if (!row) return
    row.type = payload.type
    row.queries = [...payload.queries]
    row.leadsTo = [...payload.leadsTo]
    row.updatedAt = todayLabel()
  }

  function duplicateSynonym(id: string): Synonym | undefined {
    const source = allSynonyms.value.find((s) => s.id === id)
    if (!source) return undefined
    const copy: Synonym = {
      id: `s${Date.now()}`,
      channelId: source.channelId,
      status: source.status,
      type: source.type,
      queries: [...source.queries],
      leadsTo: [...source.leadsTo],
      updatedAt: todayLabel(),
    }
    allSynonyms.value.unshift(copy)
    return copy
  }

  function toggleCollectionStatus(id: string) {
    const row = allCollections.value.find((c) => c.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function createCollection(payload: { name: string; filterType: CollectionFilterType }): SmartCollection {
    const collection: SmartCollection = {
      id: `c${Date.now()}`,
      channelId: seedChannelId(),
      name: payload.name,
      status: 'active',
      filterType: payload.filterType,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    allCollections.value.unshift(collection)
    return collection
  }

  /** Findify collection-edit config: Shopify Filters / Activation / Filters & Sorting. */
  function saveCollectionConfig(
    id: string,
    payload: { useShopifyFilters: boolean; pageUrl: string; filters: CollectionFilter[]; sortBy: string },
  ) {
    const row = allCollections.value.find((c) => c.id === id)
    if (!row) return
    row.useShopifyFilters = payload.useShopifyFilters
    row.pageUrl = payload.pageUrl
    row.filters = payload.filters.map((f) => ({ ...f }))
    row.sortBy = payload.sortBy
    row.updatedAt = todayLabel()
  }

  function duplicateCollection(id: string): SmartCollection | undefined {
    const source = allCollections.value.find((c) => c.id === id)
    if (!source) return undefined
    const copy: SmartCollection = {
      ...source,
      id: `c${Date.now()}`,
      name: `Copy of ${source.name}`,
      updatedAt: todayLabel(),
      filters: source.filters ? source.filters.map((f) => ({ ...f })) : undefined,
    }
    allCollections.value.unshift(copy)
    return copy
  }

  function deleteCollection(id: string) {
    allCollections.value = allCollections.value.filter((c) => c.id !== id)
  }

  function toggleEngineStatus(id: string) {
    const row = allEngines.value.find((e) => e.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  /* — Recommendation engines — */

  function getEngine(id: string) {
    return allEngines.value.find((e) => e.id === id)
  }

  function createEngine(payload: {
    name: string; page: EnginePage; type: EngineType
    minProducts: number; maxProducts: number
    fallbacks: string[]; notes: string
    conditions: MerchCondition[]
  }): RecommendationEngine {
    const engine: RecommendationEngine = {
      id: `${payload.page}-mc-rec-${Date.now() % 100000}`,
      channelId: seedChannelId(),
      name: payload.name,
      page: payload.page,
      type: payload.type,
      status: 'active',
      minProducts: payload.minProducts,
      maxProducts: payload.maxProducts,
      fallbacks: [...payload.fallbacks],
      notes: payload.notes,
      conditions: payload.conditions.map((c) => ({ ...c, values: [...c.values] })),
      updatedAt: `${todayLabel()} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
    }
    allEngines.value.unshift(engine)
    return engine
  }

  function saveEngine(payload: Omit<RecommendationEngine, 'updatedAt' | 'status' | 'channelId'>) {
    const engine = allEngines.value.find((e) => e.id === payload.id)
    if (!engine) return
    engine.name = payload.name
    engine.page = payload.page
    engine.type = payload.type
    engine.minProducts = payload.minProducts
    engine.maxProducts = payload.maxProducts
    engine.fallbacks = [...(payload.fallbacks ?? [])]
    engine.notes = payload.notes
    engine.conditions = (payload.conditions ?? []).map((c) => ({ ...c, values: [...c.values] }))
    engine.updatedAt = `${todayLabel()} at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }

  function duplicateEngine(id: string): RecommendationEngine | undefined {
    const source = allEngines.value.find((e) => e.id === id)
    if (!source) return undefined
    const copy = createEngine({
      name: `${source.name} copy`,
      page: source.page,
      type: source.type,
      minProducts: source.minProducts ?? 4,
      maxProducts: source.maxProducts ?? 10,
      fallbacks: [...(source.fallbacks ?? [])],
      notes: source.notes ?? '',
      conditions: (source.conditions ?? []).map((c) => ({ ...c, values: [...c.values] })),
    })
    copy.channelId = source.channelId
    return copy
  }

  function deleteEngine(id: string) {
    allEngines.value = allEngines.value.filter((e) => e.id !== id)
  }

  function toggleFieldStatus(id: string) {
    const row = allFields.value.find((f) => f.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  /* — Field transformations — */

  function createField(payload: {
    name: string
    inputField: string
    outputField: string | null
    ruleType: FieldTransformation['ruleType']
    translations: string[]
  }): FieldTransformation {
    const field: FieldTransformation = {
      id: `ft${Date.now()}`,
      channelId: seedChannelId(),
      name: payload.name,
      inputField: payload.inputField,
      outputField: payload.outputField,
      ruleType: payload.ruleType,
      translations: [...payload.translations],
      status: 'active',
      updatedAt: todayLabel(),
    }
    allFields.value.unshift(field)
    return field
  }

  function saveField(id: string, payload: {
    name: string
    inputField: string
    outputField: string | null
    ruleType: FieldTransformation['ruleType']
    translations: string[]
  }) {
    const field = allFields.value.find((f) => f.id === id)
    if (!field) return
    field.name = payload.name
    field.inputField = payload.inputField
    field.outputField = payload.outputField
    field.ruleType = payload.ruleType
    field.translations = [...payload.translations]
    field.updatedAt = todayLabel()
  }

  function duplicateField(id: string): FieldTransformation | undefined {
    const source = allFields.value.find((f) => f.id === id)
    if (!source) return undefined
    const copy = createField({
      name: `${source.name} copy`,
      inputField: source.inputField,
      outputField: source.outputField,
      ruleType: source.ruleType,
      translations: [...source.translations],
    })
    copy.channelId = source.channelId
    return copy
  }

  function deleteField(id: string) {
    allFields.value = allFields.value.filter((f) => f.id !== id)
  }

  function deleteRedirect(id: string) {
    allRedirects.value = allRedirects.value.filter((r) => r.id !== id)
  }

  function saveRedirect(id: string, payload: { queries: string[]; leadsTo: string }) {
    const row = allRedirects.value.find((r) => r.id === id)
    if (!row) return
    row.queries = [...payload.queries]
    row.leadsTo = payload.leadsTo
    row.updatedAt = todayLabel()
  }

  function duplicateRedirect(id: string): PageRedirect | undefined {
    const source = allRedirects.value.find((r) => r.id === id)
    if (!source) return undefined
    const copy: PageRedirect = {
      id: `r${Date.now()}`,
      channelId: source.channelId,
      queries: [...source.queries],
      leadsTo: source.leadsTo,
      updatedAt: todayLabel(),
    }
    allRedirects.value.unshift(copy)
    return copy
  }

  /* — Default Merchandising: pinning rules — */

  const todayLabel = () =>
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  function getPinningRule(id: string) {
    return allPinningRules.value.find((r) => r.id === id)
  }

  function createPinningRule(collectionId: string): PinningRule {
    const rule: PinningRule = { id: `pin${Date.now()}`, channelId: seedChannelId(), collectionId, pinnedProductIds: [], updatedAt: todayLabel() }
    allPinningRules.value.unshift(rule)
    return rule
  }

  function savePinningRule(id: string, payload: { collectionId: string; pinnedProductIds: string[] }) {
    const rule = allPinningRules.value.find((r) => r.id === id)
    if (!rule) return
    rule.collectionId = payload.collectionId
    rule.pinnedProductIds = [...payload.pinnedProductIds]
    rule.updatedAt = todayLabel()
  }

  function deletePinningRule(id: string) {
    allPinningRules.value = allPinningRules.value.filter((r) => r.id !== id)
  }

  /* — Default Merchandising: merchandising rules — */

  function getMerchRule(id: string) {
    return allMerchRules.value.find((r) => r.id === id)
  }

  function createMerchRule(): MerchRule {
    const rule: MerchRule = {
      id: `mr${Date.now()}`, channelId: seedChannelId(), name: '', active: true, collectionIds: [],
      popularityWeight: 1, conditions: [], updatedAt: todayLabel(),
    }
    allMerchRules.value.unshift(rule)
    return rule
  }

  function saveMerchRule(payload: Omit<MerchRule, 'channelId'>) {
    const idx = allMerchRules.value.findIndex((r) => r.id === payload.id)
    if (idx === -1) return
    allMerchRules.value[idx] = {
      ...payload,
      channelId: allMerchRules.value[idx]!.channelId,
      collectionIds: [...payload.collectionIds],
      conditions: payload.conditions.map((c) => ({ ...c, values: [...c.values] })),
      updatedAt: todayLabel(),
    }
  }

  function deleteMerchRule(id: string) {
    allMerchRules.value = allMerchRules.value.filter((r) => r.id !== id)
  }

  function toggleMerchRuleActive(id: string) {
    const rule = allMerchRules.value.find((r) => r.id === id)
    if (rule) rule.active = !rule.active
  }

  function createRedirect(payload: { queries: string[]; leadsTo: string }) {
    allRedirects.value.unshift({
      id: `r${Date.now()}`,
      channelId: seedChannelId(),
      queries: payload.queries,
      leadsTo: payload.leadsTo,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })
  }

  /* — Search pins — */

  function getSearchPin(id: string) {
    return allSearchPins.value.find((p) => p.id === id)
  }

  function createSearchPin(payload: { query: string; pinnedProductIds: string[] }): SearchPin {
    const pin: SearchPin = {
      id: `sp${Date.now()}`,
      channelId: seedChannelId(),
      query: payload.query,
      pinnedProductIds: [...payload.pinnedProductIds],
      updatedAt: todayLabel(),
    }
    allSearchPins.value.unshift(pin)
    return pin
  }

  function saveSearchPin(id: string, payload: { query: string; pinnedProductIds: string[] }) {
    const pin = allSearchPins.value.find((p) => p.id === id)
    if (!pin) return
    pin.query = payload.query
    pin.pinnedProductIds = [...payload.pinnedProductIds]
    pin.updatedAt = todayLabel()
  }

  function deleteSearchPin(id: string) {
    allSearchPins.value = allSearchPins.value.filter((p) => p.id !== id)
  }

  /* — Search merchandising rules — */

  function createSearchRule(payload: { name: string; terms: string[]; conditions: MerchCondition[] }): SearchRule {
    const rule: SearchRule = {
      id: `srl${Date.now()}`,
      channelId: seedChannelId(),
      name: payload.name,
      terms: [...payload.terms],
      conditions: payload.conditions.map((c) => ({ ...c, values: [...c.values] })),
      status: 'active',
      updatedAt: todayLabel(),
    }
    allSearchRules.value.unshift(rule)
    return rule
  }

  function saveSearchRule(id: string, payload: { name: string; terms: string[]; conditions: MerchCondition[] }) {
    const rule = allSearchRules.value.find((r) => r.id === id)
    if (!rule) return
    rule.name = payload.name
    rule.terms = [...payload.terms]
    rule.conditions = payload.conditions.map((c) => ({ ...c, values: [...c.values] }))
    rule.updatedAt = todayLabel()
  }

  function deleteSearchRule(id: string) {
    allSearchRules.value = allSearchRules.value.filter((r) => r.id !== id)
  }

  function toggleSearchRuleStatus(id: string) {
    const row = allSearchRules.value.find((r) => r.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  /* — Promo cards — */

  function togglePromoCard(id: string) {
    const row = allPromoCards.value.find((c) => c.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function createPromoCard(payload: { scope: MerchPromoScope; title: string; imageLabel: string; terms: string[] }): PromoCard {
    const card: PromoCard = {
      id: `promo${Date.now()}`,
      channelId: seedChannelId(),
      scope: payload.scope,
      title: payload.title,
      imageLabel: payload.imageLabel,
      terms: [...payload.terms],
      status: 'active',
      updatedAt: todayLabel(),
    }
    allPromoCards.value.unshift(card)
    return card
  }

  function deletePromoCard(id: string) {
    allPromoCards.value = allPromoCards.value.filter((c) => c.id !== id)
  }

  /* — Banners — */

  function toggleBanner(id: string) {
    const row = allBanners.value.find((b) => b.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function createBanner(payload: { scope: MerchPromoScope; title: string; imageLabel: string; targetUrl: string; terms: string[] }): MerchBanner {
    const banner: MerchBanner = {
      id: `bn${Date.now()}`,
      channelId: seedChannelId(),
      scope: payload.scope,
      title: payload.title,
      imageLabel: payload.imageLabel,
      targetUrl: payload.targetUrl,
      terms: [...payload.terms],
      status: 'active',
      updatedAt: todayLabel(),
    }
    allBanners.value.unshift(banner)
    return banner
  }

  function deleteBanner(id: string) {
    allBanners.value = allBanners.value.filter((b) => b.id !== id)
  }

  /* — Search blacklists — */

  function createBlacklistTerm(payload: { logic: BlacklistLogic; term: string }): BlacklistTerm {
    const term: BlacklistTerm = {
      id: `bt${Date.now()}`,
      channelId: seedChannelId(),
      logic: payload.logic,
      term: payload.term,
    }
    allBlacklistTerms.value.unshift(term)
    return term
  }

  function deleteBlacklistTerm(id: string) {
    allBlacklistTerms.value = allBlacklistTerms.value.filter((t) => t.id !== id)
  }

  function toggleBlacklistedProduct(id: string) {
    const row = allBlacklistedProducts.value.find((p) => p.id === id)
    if (row) row.active = !row.active
  }

  function addBlacklistedProduct(productId: string): BlacklistedProduct {
    const row: BlacklistedProduct = {
      id: `bp${Date.now()}`,
      channelId: seedChannelId(),
      productId,
      active: true,
    }
    allBlacklistedProducts.value.unshift(row)
    return row
  }

  return {
    // state
    merchStores,
    activeStoreId,
    activeChannelId,
    // channel-scoped list views
    synonymList,
    redirectList,
    collectionList,
    merchProductList,
    pinningRuleList,
    merchRuleList,
    engineList,
    fieldList,
    searchPinList,
    searchRuleList,
    promoCardList,
    bannerList,
    blacklistTermList,
    blacklistedProductList,
    analytics,
    moduleAnalytics,
    syncInfo,
    // computed
    activeStore,
    // actions
    setActiveStore,
    setActiveChannel,
    toggleSynonymStatus,
    bulkSetSynonymStatus,
    deleteSynonyms,
    saveSynonym,
    duplicateSynonym,
    toggleCollectionStatus,
    saveCollectionConfig,
    createCollection,
    duplicateCollection,
    deleteCollection,
    toggleEngineStatus,
    getEngine,
    createEngine,
    saveEngine,
    duplicateEngine,
    deleteEngine,
    toggleFieldStatus,
    createField,
    saveField,
    duplicateField,
    deleteField,
    deleteRedirect,
    createRedirect,
    saveRedirect,
    duplicateRedirect,
    getPinningRule,
    createPinningRule,
    savePinningRule,
    deletePinningRule,
    getMerchRule,
    createMerchRule,
    saveMerchRule,
    deleteMerchRule,
    toggleMerchRuleActive,
    getSearchPin,
    createSearchPin,
    saveSearchPin,
    deleteSearchPin,
    createSearchRule,
    saveSearchRule,
    deleteSearchRule,
    toggleSearchRuleStatus,
    togglePromoCard,
    createPromoCard,
    deletePromoCard,
    toggleBanner,
    createBanner,
    deleteBanner,
    createBlacklistTerm,
    deleteBlacklistTerm,
    toggleBlacklistedProduct,
    addBlacklistedProduct,
  }
})

/* ── Helpers for badge labels ─────────────────────────────────── */

export const ENGINE_TYPE_LABELS: Record<EngineType, string> = {
  personalized: 'Personalized',
  popular_products: 'Popular Products',
  newest_products: 'Newest Products',
  visual_recommendations: 'Visual Recommendations',
  frequently_purchased_together: 'Frequently Purchased Together',
  recently_viewed: 'Recently Viewed',
  viewed_together: 'Viewed Together',
  new_trending: 'Trending Products',
}

export const ENGINE_PAGE_LABELS: Record<EnginePage, string> = {
  home: 'Home',
  category: 'Category',
  product: 'Product',
  cart: 'Cart',
  custom: 'Custom',
}

export const ENGINE_PAGE_DESCRIPTIONS: Record<EnginePage, string> = {
  home: 'The front page of your online store.',
  category: 'Category or category listing pages of your store (PLP).',
  product: 'The product page with product details.',
  cart: 'The shopping cart page of your online store.',
  custom: 'Any non-specific page of your online store.',
}

export const ENGINE_PAGE_ICONS: Record<EnginePage, string> = {
  home: 'house',
  category: 'layout-grid',
  product: 'package',
  cart: 'shopping-cart',
  custom: 'file-text',
}

export const SYNONYM_TYPE_LABELS: Record<SynonymType, string> = {
  one_way: 'One way',
  two_way: 'Two way',
}

export const COLLECTION_FILTER_LABELS: Record<CollectionFilterType, string> = {
  manual: 'Manual',
  synced: 'Synced',
}

/* ── Default Merchandising helpers ────────────────────────────── */

/** Curated rule fields → selectable values (mirrors the product feed attributes). */
export const MERCH_FIELD_OPTIONS: Record<string, string[]> = {
  Brand: MERCH_BRANDS,
  Color: MERCH_COLORS,
  Size: MERCH_SIZES,
  Category: MERCH_CATEGORIES,
  Tags: ['new', 'sale'],
  Discounted: ['Yes', 'No'],
}

export const MERCH_SORT_OPTIONS = [
  { title: 'Sort by popularity', value: 'popularity' },
  { title: 'Newest (created)', value: 'newest' },
  { title: 'Oldest (created)', value: 'oldest' },
  { title: 'Title A to Z', value: 'title_asc' },
  { title: 'Title Z to A', value: 'title_desc' },
  { title: 'Price high to low', value: 'price_desc' },
  { title: 'Price low to high', value: 'price_asc' },
] as const

export type MerchSortKey = (typeof MERCH_SORT_OPTIONS)[number]['value']

export function sortMerchProducts(products: MerchProduct[], sort: MerchSortKey): MerchProduct[] {
  const rows = [...products]
  switch (sort) {
    case 'newest': return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'oldest': return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'title_asc': return rows.sort((a, b) => a.title.localeCompare(b.title))
    case 'title_desc': return rows.sort((a, b) => b.title.localeCompare(a.title))
    case 'price_desc': return rows.sort((a, b) => b.price - a.price)
    case 'price_asc': return rows.sort((a, b) => a.price - b.price)
    default: return rows.sort((a, b) => b.popularity - a.popularity)
  }
}

function productFieldValues(p: MerchProduct, field: string): string[] {
  switch (field) {
    case 'Brand': return [p.brand]
    case 'Color': return [p.color]
    case 'Size': return [p.size]
    case 'Category': return [p.category]
    case 'Tags': return p.tags
    case 'Discounted': return [p.compareAt ? 'Yes' : 'No']
    default: return []
  }
}

/** Picker copy + icons for the engine type gallery (copy mirrors the Findify wizard cards). */
export const ENGINE_TYPE_DESCRIPTIONS: Record<EngineType, string> = {
  personalized: 'Show recommended products based on purchase history and behavior.',
  popular_products: 'Inspire customers by showcasing what’s popular in your store.',
  newest_products: 'Show customers what’s fresh, from your latest stocked products.',
  visual_recommendations: 'Visually similar products, matched on imagery.',
  frequently_purchased_together: 'Products often bought in the same order.',
  recently_viewed: 'Remind customers of the products they have recently browsed.',
  viewed_together: 'Products browsed in the same sessions.',
  new_trending: 'Highlights items gaining momentum by analyzing engagement over time.',
}

export const ENGINE_TYPE_ICONS: Record<EngineType, string> = {
  personalized: 'sparkles',
  popular_products: 'trending-up',
  newest_products: 'package-plus',
  visual_recommendations: 'image',
  frequently_purchased_together: 'shopping-basket',
  recently_viewed: 'history',
  viewed_together: 'eye',
  new_trending: 'flame',
}

/** Which recommendation types are offered per page placement (context-dependent types need a product). */
export function engineTypesForPage(page: EnginePage): EngineType[] {
  const base: EngineType[] = ['popular_products', 'recently_viewed', 'newest_products', 'personalized', 'new_trending']
  if (page === 'product') return [...base, 'frequently_purchased_together', 'visual_recommendations', 'viewed_together']
  if (page === 'cart') return [...base, 'frequently_purchased_together']
  return base
}

export const ENGINE_FALLBACK_OPTIONS = ['Popular products', 'Newest products', 'Random products']

/** Type-appropriate mock ordering + include/exclude filters for engine previews. */
export function engineRecommendationPreview(
  engine: Pick<RecommendationEngine, 'type' | 'conditions' | 'maxProducts'>,
  products: MerchProduct[],
): MerchProduct[] {
  let rows = products.filter((p) =>
    (engine.conditions ?? []).every((c) => {
      const matches = c.values.length === 0 || c.values.some((v) => productFieldValues(p, c.field).includes(v))
      return c.action === 'include' ? matches : c.action === 'exclude' ? !matches : true
    }),
  )
  switch (engine.type) {
    case 'newest_products':
      rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      break
    case 'recently_viewed':
      rows = [...rows].sort((a, b) => b.id.localeCompare(a.id))
      break
    case 'visual_recommendations':
    case 'viewed_together':
    case 'frequently_purchased_together':
      rows = [...rows].sort((a, b) => a.category.localeCompare(b.category) || b.popularity - a.popularity)
      break
    default:
      // popular, personalized, trending — popularity-driven mock ranking
      rows = [...rows].sort((a, b) => b.popularity - a.popularity)
  }
  return rows.slice(0, engine.maxProducts ?? 10)
}

/** Apply include/exclude filters + promote weights so the rule preview reflects the rule. */
export function applyRuleToProducts(
  rule: Pick<MerchRule, 'conditions' | 'popularityWeight'>,
  products: MerchProduct[],
): MerchProduct[] {
  const rows = products.filter((p) =>
    rule.conditions.every((c) => {
      if (c.action === 'promote') return true
      const matches = c.values.length === 0 || c.values.some((v) => productFieldValues(p, c.field).includes(v))
      return c.action === 'include' ? matches : !matches
    }),
  )
  const score = (p: MerchProduct) => {
    let s = p.popularity * rule.popularityWeight
    for (const c of rule.conditions) {
      if (c.action !== 'promote') continue
      if (c.values.some((v) => productFieldValues(p, c.field).includes(v))) s += (c.weight ?? 0) * 100
    }
    return s
  }
  return rows.sort((a, b) => score(b) - score(a))
}
