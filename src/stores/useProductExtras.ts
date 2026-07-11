import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Mock-persistent data for the Products satellite pages that don't live in the
 * core commerce store: recommendation rules, inventory reservations, and tax
 * categories. Kept separate from useCommerce so those flows can be wired to a
 * real backend independently.
 */

export type RecommendationLogic =
  | 'Frequently Bought Together'
  | 'Similar Items'
  | 'Recently Viewed'
  | 'Trending'
  | 'Personalized'

export type RecommendationPlacement =
  | 'Cart Page'
  | 'Product Detail Page'
  | 'Homepage & Global Footer'

export interface RecommendationRule {
  id: number
  name: string
  logicType: RecommendationLogic
  placement: RecommendationPlacement
  metric: string
  metricLabel: string
  status: 'Active' | 'Paused'
}

export interface Reservation {
  id: string
  product: string
  sku: string
  orderNumber: string
  location: string
  description: string
  qty: number
  status: 'Active Hold' | 'Expired'
}

export type TaxCategoryType = 'Physical' | 'Services' | 'Events'

export interface TaxCategory {
  id: string
  name: string
  type: TaxCategoryType
  description: string
}

export type CollectionType = 'Automated' | 'Manual'

export interface Collection {
  id: number
  title: string
  handle: string
  type: CollectionType
  productCount: number
  status: 'Active' | 'Draft'
  updatedAt: string
  root: boolean
}

/** Slugify a title into a URL handle (lowercase, hyphenated). */
function toHandle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const useProductExtrasStore = defineStore('productExtras', () => {
  // ── Recommendation rules ─────────────────────────────────────────
  const recommendations = ref<RecommendationRule[]>([
    { id: 1, name: 'Frequently Bought Together', logicType: 'Frequently Bought Together', placement: 'Cart Page', metric: '+12.5%', metricLabel: 'AOV', status: 'Active' },
    { id: 2, name: 'Similar Items', logicType: 'Similar Items', placement: 'Product Detail Page', metric: '+8.2%', metricLabel: 'Conv.', status: 'Active' },
    { id: 3, name: 'Recently Viewed', logicType: 'Recently Viewed', placement: 'Homepage & Global Footer', metric: '+3.1%', metricLabel: 'Pageviews', status: 'Active' },
  ])

  function addRule(input: { name: string; logicType: RecommendationLogic; placement: RecommendationPlacement; status: 'Active' | 'Paused' }): RecommendationRule {
    const id = recommendations.value.reduce((max, r) => Math.max(max, r.id), 0) + 1
    const rule: RecommendationRule = { id, ...input, metric: '—', metricLabel: 'New' }
    recommendations.value.unshift(rule)
    return rule
  }

  function updateRule(id: number, patch: { name: string; logicType: RecommendationLogic; placement: RecommendationPlacement; status: 'Active' | 'Paused' }): void {
    const rule = recommendations.value.find((r) => r.id === id)
    if (!rule) return
    rule.name = patch.name
    rule.logicType = patch.logicType
    rule.placement = patch.placement
    rule.status = patch.status
  }

  function toggleRule(id: number): void {
    const rule = recommendations.value.find((r) => r.id === id)
    if (rule) rule.status = rule.status === 'Active' ? 'Paused' : 'Active'
  }

  function deleteRule(id: number): void {
    recommendations.value = recommendations.value.filter((r) => r.id !== id)
  }

  // ── Reservations ─────────────────────────────────────────────────
  const reservations = ref<Reservation[]>([
    { id: 'RES-001', product: 'Premium Item 5', sku: 'SKU-10005', orderNumber: '#10231', location: 'Main Warehouse - FL', description: 'VIP customer hold', qty: 2, status: 'Active Hold' },
    { id: 'RES-002', product: 'Premium Item 12', sku: 'SKU-10012', orderNumber: '#10244', location: 'Secondary Node - CA', description: 'Awaiting payment confirmation', qty: 1, status: 'Active Hold' },
    { id: 'RES-003', product: 'Premium Item 2', sku: 'SKU-10002', orderNumber: '#10198', location: 'Retail Hub - TX', description: 'Backorder allocation', qty: 5, status: 'Expired' },
  ])

  function addReservation(input: { product: string; sku: string; orderNumber: string; location: string; description: string; qty: number }): Reservation {
    const nextNum = reservations.value.reduce((max, r) => {
      const n = parseInt(r.id.replace('RES-', ''), 10)
      return Number.isNaN(n) ? max : Math.max(max, n)
    }, 0) + 1
    const reservation: Reservation = {
      id: `RES-${String(nextNum).padStart(3, '0')}`,
      product: input.product,
      sku: input.sku,
      orderNumber: input.orderNumber,
      location: input.location,
      description: input.description,
      qty: input.qty,
      status: 'Active Hold',
    }
    reservations.value.unshift(reservation)
    return reservation
  }

  function releaseReservation(id: string): void {
    reservations.value = reservations.value.filter((r) => r.id !== id)
  }

  // ── Tax categories ───────────────────────────────────────────────
  const taxCategories = ref<TaxCategory[]>([
    { id: 'TAX-001', name: 'Standard General Merchandise', type: 'Physical', description: 'Default rate map — varies by location' },
    { id: 'TAX-DIG-05', name: 'Digital Services / SaaS', type: 'Services', description: '0% in most states' },
    { id: 'TAX-APP-12', name: 'Apparel & Clothing', type: 'Physical', description: 'Exempt under $110 (NY)' },
    { id: 'TAX-FOOD-00', name: 'Grocery / Unprepared Food', type: 'Physical', description: 'Exempt' },
    { id: 'TAX-EVT-03', name: 'Event Tickets & Admissions', type: 'Events', description: 'Taxable where the event is held' },
  ])

  function addTaxCategory(input: { name: string; type: TaxCategoryType; description: string }): TaxCategory {
    const category: TaxCategory = {
      id: `TAX-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: input.name,
      type: input.type,
      description: input.description,
    }
    taxCategories.value.unshift(category)
    return category
  }

  function updateTaxCategory(id: string, patch: { name: string; type: TaxCategoryType; description: string }): void {
    const category = taxCategories.value.find((c) => c.id === id)
    if (!category) return
    category.name = patch.name
    category.type = patch.type
    category.description = patch.description
  }

  function deleteTaxCategory(id: string): void {
    taxCategories.value = taxCategories.value.filter((c) => c.id !== id)
  }

  // ── Collections ──────────────────────────────────────────────────
  const collections = ref<Collection[]>([
    { id: 1, title: 'All Products', handle: 'all-products', type: 'Automated', productCount: 128, status: 'Active', updatedAt: '2026-07-08', root: true },
    { id: 2, title: 'New Arrivals', handle: 'new-arrivals', type: 'Automated', productCount: 24, status: 'Active', updatedAt: '2026-07-05', root: false },
    { id: 3, title: 'Best Sellers', handle: 'best-sellers', type: 'Automated', productCount: 32, status: 'Active', updatedAt: '2026-06-28', root: false },
    { id: 4, title: 'Sale Items', handle: 'sale-items', type: 'Automated', productCount: 47, status: 'Active', updatedAt: '2026-06-20', root: false },
    { id: 5, title: 'Summer Collection', handle: 'summer-collection', type: 'Manual', productCount: 18, status: 'Draft', updatedAt: '2026-06-12', root: false },
  ])

  function addCollection(input: { title: string; handle: string; type: CollectionType; status: 'Active' | 'Draft' }): Collection {
    const id = collections.value.reduce((max, c) => Math.max(max, c.id), 0) + 1
    const collection: Collection = {
      id,
      title: input.title,
      handle: input.handle || toHandle(input.title),
      type: input.type,
      productCount: 0,
      status: input.status,
      updatedAt: new Date().toISOString().split('T')[0]!,
      root: false,
    }
    collections.value.unshift(collection)
    return collection
  }

  function updateCollection(id: number, patch: { title: string; handle: string; type: CollectionType; status: 'Active' | 'Draft' }): void {
    const collection = collections.value.find((c) => c.id === id)
    if (!collection) return
    collection.title = patch.title
    collection.handle = patch.handle || toHandle(patch.title)
    collection.type = patch.type
    collection.status = patch.status
    collection.updatedAt = new Date().toISOString().split('T')[0]!
  }

  function deleteCollection(id: number): void {
    collections.value = collections.value.filter((c) => c.id !== id)
  }

  return {
    recommendations, addRule, updateRule, toggleRule, deleteRule,
    reservations, addReservation, releaseReservation,
    taxCategories, addTaxCategory, updateTaxCategory, deleteTaxCategory,
    collections, addCollection, updateCollection, deleteCollection, toHandle,
  }
})
