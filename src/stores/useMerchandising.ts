import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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
  status: 'active' | 'inactive'
  type: SynonymType
  queries: string[]
  leadsTo: string[]
  updatedAt: string
}

export interface PageRedirect {
  id: string
  queries: string[]
  leadsTo: string
  updatedAt: string
}

export type CollectionFilterType = 'manual' | 'synced'
export interface SmartCollection {
  id: string
  name: string
  status: 'active' | 'inactive'
  filterType: CollectionFilterType
  updatedAt: string
}

/* Default Merchandising (pinning + merchandising rules) */

export interface MerchProduct {
  id: string
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
  collectionId: string
  pinnedProductIds: string[]
  updatedAt: string
}

export type MerchConditionAction = 'include' | 'exclude' | 'promote'

export interface MerchCondition {
  id: string
  action: MerchConditionAction
  /** -100 (bury) … 100 (boost); only for action === 'promote' */
  weight?: number
  field: string
  values: string[]
}

export interface MerchRule {
  id: string
  name: string
  active: boolean
  collectionIds: string[]
  /** Popularity boost multiplier: 0 disables, up to 100 (x) */
  popularityWeight: number
  conditions: MerchCondition[]
  updatedAt: string
}

export type EnginePage = 'product' | 'cart' | 'home'
export type EngineType =
  | 'personalized'
  | 'popular_products'
  | 'visual_recommendations'
  | 'frequently_purchased_together'
  | 'recently_viewed'
  | 'viewed_together'
  | 'new_trending'

export interface RecommendationEngine {
  id: string
  name: string
  page: EnginePage
  type: EngineType
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface FieldTransformation {
  id: string
  name: string
  inputField: string
  outputField: string | null
  ruleType: 'field_manipulation' | 'value_transformation'
  translations: string[]
  status: 'active' | 'inactive'
  updatedAt: string
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

/* ── Sample data ──────────────────────────────────────────────── */

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

const synonyms: Synonym[] = [
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
]

const pageRedirects: PageRedirect[] = [
  { id: 'r1', queries: ['test', '1233', '23'], leadsTo: 'https://wer.com', updatedAt: 'May 12, 2026' },
  { id: 'r2', queries: ['erwqfsdf', 'sdfsdf', 'sdfsdfdddd'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'May 8, 2026' },
  { id: 'r3', queries: ['help', 'customer service', 'why'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'May 1, 2026' },
  { id: 'r4', queries: ['help', 'faq', 'return policy'], leadsTo: 'https://MyDemostore.com/pages/faq', updatedAt: 'Apr 21, 2026' },
]

const collections: SmartCollection[] = [
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
]

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

const pinningRules: PinningRule[] = [
  { id: 'pin1', collectionId: 'c14', pinnedProductIds: ['p1', 'p2', 'p3', 'p7'], updatedAt: 'May 19, 2026' },
  { id: 'pin2', collectionId: 'c2', pinnedProductIds: ['p4', 'p5', 'p6', 'p8', 'p9', 'p10', 'p12', 'p15'], updatedAt: 'May 12, 2026' },
  { id: 'pin3', collectionId: 'c1', pinnedProductIds: ['p11', 'p13'], updatedAt: 'May 8, 2026' },
  { id: 'pin4', collectionId: 'c4', pinnedProductIds: ['p30', 'p39'], updatedAt: 'Apr 30, 2026' },
  { id: 'pin5', collectionId: 'c12', pinnedProductIds: ['p16', 'p17', 'p18', 'p20', 'p22'], updatedAt: 'Apr 22, 2026' },
  { id: 'pin6', collectionId: 'c6', pinnedProductIds: [], updatedAt: 'Apr 10, 2026' },
]

const merchRules: MerchRule[] = [
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
]

const recommendationEngines: RecommendationEngine[] = [
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
]

const fieldTransformations: FieldTransformation[] = [
  { id: 'ft1', name: 'Warren test', inputField: 'Material', outputField: 'ww_material', ruleType: 'field_manipulation', translations: ['EN', 'IT'], status: 'active', updatedAt: 'May 14, 2026' },
  { id: 'ft2', name: 'Color rule test', inputField: 'Color', outputField: null, ruleType: 'field_manipulation', translations: ['EN'], status: 'active', updatedAt: 'May 12, 2026' },
]

function buildAnalytics(): MerchAnalytics {
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
    const dayTotal = Math.round(base + (i * 110))
    const dayMerchCloud = Math.round(dayTotal * (0.42 + Math.sin(i / 5) * 0.05))
    total += dayTotal
    merchCloud += dayMerchCloud
    trend.push({
      date: d.toISOString().slice(0, 10),
      total: dayTotal,
      merchCloud: dayMerchCloud,
    })
  }
  const share = Math.round((merchCloud / total) * 1000) / 10
  const aov = Math.round((total / 2480) * 100) / 100
  return {
    totalRevenue: total,
    merchCloudRevenue: merchCloud,
    merchCloudShare: share,
    avgOrderValue: aov,
    totalRevenueTrend: 18.4,
    merchCloudRevenueTrend: 23.7,
    merchCloudShareTrend: 4.5,
    avgOrderValueTrend: 5.2,
    revenueTrend: trend,
    contribution: [
      { label: 'MerchCloud-driven', value: merchCloud },
      { label: 'Other channels', value: total - merchCloud },
    ],
  }
}

/* ── Store ────────────────────────────────────────────────────── */

export const useMerchandisingStore = defineStore('merchandising', () => {
  const merchStores = ref<MerchStore[]>(stores)
  const activeStoreId = ref<string>(stores[0]!.id)
  const synonymList = ref<Synonym[]>([...synonyms])
  const redirectList = ref<PageRedirect[]>([...pageRedirects])
  const collectionList = ref<SmartCollection[]>([...collections])
  const merchProductList = ref<MerchProduct[]>([...merchProducts])
  const pinningRuleList = ref<PinningRule[]>(pinningRules.map((r) => ({ ...r, pinnedProductIds: [...r.pinnedProductIds] })))
  const merchRuleList = ref<MerchRule[]>(merchRules.map((r) => ({ ...r, collectionIds: [...r.collectionIds], conditions: r.conditions.map((c) => ({ ...c, values: [...c.values] })) })))
  const engineList = ref<RecommendationEngine[]>([...recommendationEngines])
  const fieldList = ref<FieldTransformation[]>([...fieldTransformations])
  const analytics = ref<MerchAnalytics>(buildAnalytics())

  const activeStore = computed(() =>
    merchStores.value.find((s) => s.id === activeStoreId.value) ?? merchStores.value[0]!,
  )

  function setActiveStore(id: string) {
    if (merchStores.value.some((s) => s.id === id)) {
      activeStoreId.value = id
    }
  }

  function toggleSynonymStatus(id: string) {
    const row = synonymList.value.find((s) => s.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function bulkSetSynonymStatus(ids: string[], status: 'active' | 'inactive') {
    synonymList.value.forEach((row) => {
      if (ids.includes(row.id)) row.status = status
    })
  }

  function deleteSynonyms(ids: string[]) {
    synonymList.value = synonymList.value.filter((row) => !ids.includes(row.id))
  }

  function toggleCollectionStatus(id: string) {
    const row = collectionList.value.find((c) => c.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function createCollection(payload: { name: string; filterType: CollectionFilterType }): SmartCollection {
    const collection: SmartCollection = {
      id: `c${Date.now()}`,
      name: payload.name,
      status: 'active',
      filterType: payload.filterType,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    collectionList.value.unshift(collection)
    return collection
  }

  function toggleEngineStatus(id: string) {
    const row = engineList.value.find((e) => e.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function toggleFieldStatus(id: string) {
    const row = fieldList.value.find((f) => f.id === id)
    if (row) row.status = row.status === 'active' ? 'inactive' : 'active'
  }

  function deleteRedirect(id: string) {
    redirectList.value = redirectList.value.filter((r) => r.id !== id)
  }

  /* — Default Merchandising: pinning rules — */

  const todayLabel = () =>
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  function getPinningRule(id: string) {
    return pinningRuleList.value.find((r) => r.id === id)
  }

  function createPinningRule(collectionId: string): PinningRule {
    const rule: PinningRule = { id: `pin${Date.now()}`, collectionId, pinnedProductIds: [], updatedAt: todayLabel() }
    pinningRuleList.value.unshift(rule)
    return rule
  }

  function savePinningRule(id: string, payload: { collectionId: string; pinnedProductIds: string[] }) {
    const rule = pinningRuleList.value.find((r) => r.id === id)
    if (!rule) return
    rule.collectionId = payload.collectionId
    rule.pinnedProductIds = [...payload.pinnedProductIds]
    rule.updatedAt = todayLabel()
  }

  function deletePinningRule(id: string) {
    pinningRuleList.value = pinningRuleList.value.filter((r) => r.id !== id)
  }

  /* — Default Merchandising: merchandising rules — */

  function getMerchRule(id: string) {
    return merchRuleList.value.find((r) => r.id === id)
  }

  function createMerchRule(): MerchRule {
    const rule: MerchRule = {
      id: `mr${Date.now()}`, name: '', active: true, collectionIds: [],
      popularityWeight: 1, conditions: [], updatedAt: todayLabel(),
    }
    merchRuleList.value.unshift(rule)
    return rule
  }

  function saveMerchRule(payload: MerchRule) {
    const idx = merchRuleList.value.findIndex((r) => r.id === payload.id)
    if (idx === -1) return
    merchRuleList.value[idx] = {
      ...payload,
      collectionIds: [...payload.collectionIds],
      conditions: payload.conditions.map((c) => ({ ...c, values: [...c.values] })),
      updatedAt: todayLabel(),
    }
  }

  function deleteMerchRule(id: string) {
    merchRuleList.value = merchRuleList.value.filter((r) => r.id !== id)
  }

  function toggleMerchRuleActive(id: string) {
    const rule = merchRuleList.value.find((r) => r.id === id)
    if (rule) rule.active = !rule.active
  }

  function createRedirect(payload: { queries: string[]; leadsTo: string }) {
    redirectList.value.unshift({
      id: `r${Date.now()}`,
      queries: payload.queries,
      leadsTo: payload.leadsTo,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })
  }

  return {
    // state
    merchStores,
    activeStoreId,
    synonymList,
    redirectList,
    collectionList,
    merchProductList,
    pinningRuleList,
    merchRuleList,
    engineList,
    fieldList,
    analytics,
    // computed
    activeStore,
    // actions
    setActiveStore,
    toggleSynonymStatus,
    bulkSetSynonymStatus,
    deleteSynonyms,
    toggleCollectionStatus,
    createCollection,
    toggleEngineStatus,
    toggleFieldStatus,
    deleteRedirect,
    createRedirect,
    getPinningRule,
    createPinningRule,
    savePinningRule,
    deletePinningRule,
    getMerchRule,
    createMerchRule,
    saveMerchRule,
    deleteMerchRule,
    toggleMerchRuleActive,
  }
})

/* ── Helpers for badge labels ─────────────────────────────────── */

export const ENGINE_TYPE_LABELS: Record<EngineType, string> = {
  personalized: 'Personalized',
  popular_products: 'Popular Products',
  visual_recommendations: 'Visual Recommendations',
  frequently_purchased_together: 'Frequently Purchased Together',
  recently_viewed: 'Recently Viewed',
  viewed_together: 'Viewed Together',
  new_trending: 'New Trending',
}

export const ENGINE_PAGE_LABELS: Record<EnginePage, string> = {
  product: 'Product',
  cart: 'Cart',
  home: 'Home',
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
