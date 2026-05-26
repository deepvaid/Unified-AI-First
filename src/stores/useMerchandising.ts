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
    toggleEngineStatus,
    toggleFieldStatus,
    deleteRedirect,
    createRedirect,
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
