import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Mock-persistent data for the Products satellite pages that don't live in the
 * core commerce store: the recommendation catalog / feeds / feed templates,
 * pricing configurations (price lists), inventory reservations, tax categories
 * and collections. Shapes mirror UAT account 116000 — see docs/rebuild/.
 */

// ── Product Recommendations: catalog ─────────────────────────────────
/** Import sources a catalog product can arrive from. `All` is the filter-only default. */
export const CATALOG_SOURCES = [
  'Default', 'Sk Test', 'Keap', 'Amazon', 'Woocommerce', 'Magento',
  'Retail Express', 'Commerce Cloud', 'Shopify', 'Unified',
] as const
export type CatalogSource = (typeof CATALOG_SOURCES)[number]

/** Categories a catalog product can be tagged with (Settings → Product Categories). */
export const CATALOG_CATEGORIES = ['Balls', 'Cosmetic-Test', 'Cosmetics-Test', "Men's", 'Home', 'Outdoor']

export interface CatalogProduct {
  itemId: string
  name: string
  price: number
  imageUrl: string
  storeUrl: string
  source: CatalogSource
  categories: string[]
  description: string
  createdAt: string
  updatedAt: string
}

// ── Product Recommendations: feeds ───────────────────────────────────
export const FEED_TYPES = ['Best Sellers', 'New Arrivals', 'Top Trending'] as const
export type FeedType = (typeof FEED_TYPES)[number]
/** Metrics on legacy feeds that the current form can no longer create. */
export type FeedMetric = FeedType | 'Bought Together' | 'Similar Products' | 'Trending'

export const FEED_PERIODS = ['Last 5 days', 'Last 10 days', 'Last 15 days', 'Last 30 days', 'Last 45 days', 'Last 60 days'] as const
export type FeedPeriod = (typeof FEED_PERIODS)[number]

export const FEED_SORTS = ['Random', 'Price Low to High', 'Price High to Low'] as const
export type FeedSort = (typeof FEED_SORTS)[number]

export type CategoryFilterMode = 'all' | 'limit' | 'exclude'

export const FEED_BRANDS = ['Apple', 'brand-29jul', 'brand-vishal1', 'john', 'Max Factor', 'StudioForm']
export const FEED_STORES = ['jatinconnector.myshopify.com', 'demo-store-30-sep', 'uat-commerce-cloud']

export interface ProductFeed {
  id: number
  name: string
  metric: FeedMetric
  activeOnly: boolean
  inStockOnly: boolean
  webstoreApprovedOnly: boolean
  source: CatalogSource
  storeName: string
  brands: string[]
  categoryMode: CategoryFilterMode
  categories: string[]
  period: FeedPeriod
  sortBy: FeedSort
  createdAt: string
  updatedAt: string
}

export interface FeedInput {
  name: string
  activeOnly: boolean
  inStockOnly: boolean
  webstoreApprovedOnly: boolean
  source: CatalogSource
  storeName: string
  brands: string[]
  categoryMode: CategoryFilterMode
  categories: string[]
  metric: FeedType
  period: FeedPeriod
  sortBy: FeedSort
}

// ── Product Recommendations: feed templates ──────────────────────────
export type TemplateMethod = 'feed' | 'manual'

export interface FeedTemplate {
  id: number
  name: string
  rows: number
  columns: number
  method: TemplateMethod
  feedId: number | null
  productItemIds: string[]
  includeImage: boolean
  includeName: boolean
  includePrice: boolean
  includeButton: boolean
  buttonText: string
  buttonTextColor: string
  buttonBgColor: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateInput {
  name: string
  rows: number
  columns: number
  method: TemplateMethod
  feedId: number | null
  productItemIds: string[]
  includeImage: boolean
  includeName: boolean
  includePrice: boolean
  includeButton: boolean
  buttonText: string
  buttonTextColor: string
  buttonBgColor: string
}

// ── Pricing configurations (Price Lists) ─────────────────────────────
export const PRICING_ATTRIBUTES = ['Contact Lists', 'Contact Tags', 'Customer Group'] as const
export const PRICING_OPERATORS = ['Equal', 'Not Equal'] as const
export const PRICING_ADJUSTMENTS = ['Increase', 'Decrease'] as const
export type PricingAdjustment = (typeof PRICING_ADJUSTMENTS)[number]
export type PricingStatus = 'Draft' | 'Active'

export interface PricingConfiguration {
  id: number
  title: string
  description: string
  salesChannel: string
  audienceAttribute: string
  audienceOperator: string
  audienceValue: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  adjustment: PricingAdjustment
  percentage: number
  productCount: number
  status: PricingStatus
}

export interface PricingInput {
  title: string
  description: string
  salesChannel: string
  audienceAttribute: string
  audienceOperator: string
  audienceValue: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  adjustment: PricingAdjustment
  percentage: number
  status: PricingStatus
}

// ── Inventory reservations ───────────────────────────────────────────
/** Stock locations shared by reservations and the product variant grid. */
export const INVENTORY_LOCATIONS = ['Testing', 'Oxford Warehouse'] as const
export type InventoryLocation = (typeof INVENTORY_LOCATIONS)[number]

export interface Reservation {
  id: number
  item: string
  sku: string
  orderNumber: string
  location: InventoryLocation
  description: string
  qty: number
  /** On-hand at this location, shown in the reserve dialog's summary. */
  inStock: number
  available: number
}

export interface ReservationInput {
  item: string
  sku: string
  location: InventoryLocation
  description: string
  qty: number
}

/** A variant the reservation dialog can hold stock against (inventory-managed only). */
export interface ReservableVariant {
  label: string
  sku: string
  inStock: number
  available: number
  manageInventory: boolean
}

// ── Collections ──────────────────────────────────────────────────────
export type CollectionType = 'Automated' | 'Manual'
export type CollectionStatus = 'Active' | 'Inactive'

export const COLLECTION_FIELDS = ['Title', 'Category', 'Tags', 'Brand', 'Product Type', 'Price'] as const
export type CollectionField = (typeof COLLECTION_FIELDS)[number]

export const COLLECTION_TEXT_OPERATORS = ['Contains', 'Does not contain', 'Starts with', 'Ends with'] as const
export const COLLECTION_NUMBER_OPERATORS = ['Equals', 'Greater than', 'Less than'] as const

export interface CollectionRule {
  field: CollectionField
  operator: string
  value: string
}

export interface CollectionSeo {
  title: string
  metaDescription: string
  urlHandle: string
  ogTitle: string
  ogDescription: string
}

export interface Collection {
  id: number
  title: string
  handle: string
  type: CollectionType
  parent: string
  productCount: number
  status: CollectionStatus
  updatedAt: string
  description: string
  matchMode: 'all' | 'any'
  rules: CollectionRule[]
  productItemIds: string[]
  seo: CollectionSeo
  imageName: string
  salesChannels: string[]
}

export interface CollectionInput {
  title: string
  parent: string
  description: string
  type: CollectionType
  status: CollectionStatus
  matchMode: 'all' | 'any'
  rules: CollectionRule[]
  productItemIds: string[]
  seo: CollectionSeo
  imageName: string
}

// ── Tax categories ───────────────────────────────────────────────────
export type TaxCategoryType = 'Physical' | 'Services' | 'Events'

export interface TaxCategory {
  id: string
  name: string
  type: TaxCategoryType
  description: string
}

/** Slugify a title into a URL handle (lowercase, hyphenated). */
function toHandle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `2026-08-29` → `Aug 29, 2026 at 04:45 AM`, the format every UAT table uses. */
export function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} at ${time}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export const useProductExtrasStore = defineStore('productExtras', () => {
  // ── Catalog ────────────────────────────────────────────────────────
  const catalog = ref<CatalogProduct[]>([
    { itemId: '52559657828669', name: 'IGI-game', price: 2000, imageUrl: 'https://cdn.shopify.com/s/files/1/0664/4950/6621/files/IGI2.jpg', storeUrl: 'https://jatinconnector.myshopify.com/products/igi-game', source: 'Shopify', categories: [], description: 'IGI-game', createdAt: '2026-07-29T06:17:00Z', updatedAt: '2026-07-29T06:17:00Z' },
    { itemId: '46512154706070', name: '29jul-shopify-title', price: 199, imageUrl: 'https://cdn.shopify.com/s/files/1/0664/4950/6621/files/coat.jpg', storeUrl: 'https://jatinconnector.myshopify.com/products/29jul', source: 'Shopify', categories: ["Men's"], description: 'Lightweight shell coat', createdAt: '2026-07-29T04:13:00Z', updatedAt: '2026-07-29T04:13:00Z' },
    { itemId: '43625864134806', name: 'Black Mamba Bat', price: 0, imageUrl: 'https://cdn.shopify.com/s/files/1/0664/4950/6621/files/bat.jpg', storeUrl: 'https://jatinconnector.myshopify.com/products/black-mamba-bat', source: 'Shopify', categories: ['Balls'], description: 'Willow cricket bat', createdAt: '2025-11-20T07:33:00Z', updatedAt: '2026-07-20T03:36:00Z' },
    { itemId: '45088858669373', name: 'Naturale Brightening Pomegranate Bodywash', price: 97, imageUrl: 'https://cdn.shopify.com/s/files/1/0664/4950/6621/files/wash.jpg', storeUrl: 'https://jatinconnector.myshopify.com/products/bodywash', source: 'Shopify', categories: ['Cosmetics-Test'], description: 'Pomegranate bodywash, 500ml', createdAt: '2025-11-24T07:29:00Z', updatedAt: '2026-07-13T08:30:00Z' },
    { itemId: '45073012392253', name: 'Blue Eyelash', price: 45, imageUrl: 'https://cdn.shopify.com/s/files/1/0664/4950/6621/files/lash.jpg', storeUrl: 'https://jatinconnector.myshopify.com/products/blue-eyelash', source: 'Shopify', categories: ['Cosmetic-Test'], description: 'Reusable lashes', createdAt: '2025-11-24T07:32:00Z', updatedAt: '2026-07-10T05:20:00Z' },
    { itemId: 'Table-Bel', name: 'Belmont 1.8 x 1.02m & Lux Teak/Steel', price: 2200, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/belmont', source: 'Default', categories: ['Outdoor'], description: 'Outdoor dining table', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'dresblk8', name: '', price: 169.15, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/dresblk8', source: 'Default', categories: [], description: '', createdAt: '2025-08-11T08:11:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'ring1', name: 'Ring 1', price: 14.99, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/ring1', source: 'Default', categories: [], description: 'Silver band', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'JEANS3-CRINK-XXL', name: 'Mid Rise Super Skinny', price: 89, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/jeans3', source: 'Magento', categories: ["Men's"], description: 'Mid-rise denim', createdAt: '2025-08-11T08:11:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'pbd', name: 'Prada Black Dress', price: 350, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/pbd', source: 'Woocommerce', categories: [], description: 'Evening dress', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'bbsm', name: 'Black Belt', price: 35, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/bbsm', source: 'Woocommerce', categories: ["Men's"], description: 'Leather belt', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'ser', name: 'Service:', price: 150, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/ser', source: 'Retail Express', categories: [], description: 'Bench service', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'repair', name: 'Repair:', price: 50, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/repair', source: 'Retail Express', categories: [], description: 'Repair labour', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: '1741', name: 'Tomy Megasketcher - Magnetic Drawing Board', price: 36.99, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/1741', source: 'Amazon', categories: [], description: 'Magnetic drawing board', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'trade-in', name: 'Trade In', price: -250, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/trade-in', source: 'Retail Express', categories: [], description: 'Trade-in credit', createdAt: '2025-08-11T08:12:00Z', updatedAt: '2026-08-21T03:12:00Z' },
    { itemId: 'SMP-1', name: 'Product1', price: 1100, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/product1', source: 'Commerce Cloud', categories: [], description: 'Sample product', createdAt: '2025-09-26T07:23:00Z', updatedAt: '2025-09-26T07:23:00Z' },
    { itemId: 'GP-209-BK', name: "INITIO Parfums Can't Get Enough", price: 4151, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/initio', source: 'Keap', categories: ['Cosmetics-Test'], description: 'Eau de parfum, 90ml', createdAt: '2026-06-05T06:11:00Z', updatedAt: '2026-06-05T06:11:00Z' },
    { itemId: 'A&CNOOKH-.5', name: 'Simple Sunglasses 445', price: 10, imageUrl: '', storeUrl: 'https://demo-store.example.com/products/sunglasses', source: 'Unified', categories: [], description: 'UV400 sunglasses', createdAt: '2024-01-22T00:10:00Z', updatedAt: '2024-01-22T00:10:00Z' },
  ])

  function updateCatalogProduct(itemId: string, patch: { name: string; price: number; imageUrl: string; storeUrl: string; categories: string[]; description: string }): void {
    const product = catalog.value.find((p) => p.itemId === itemId)
    if (!product) return
    Object.assign(product, patch, { updatedAt: nowIso() })
  }

  /** Mock CSV import — appends placeholder rows so the flow lands somewhere real. */
  function importCatalog(fileName: string, rowCount: number): number {
    const stamp = nowIso()
    for (let i = 0; i < rowCount; i += 1) {
      catalog.value.unshift({
        itemId: `IMP-${catalog.value.length + i + 1}`,
        name: `${fileName.replace(/\.[^.]+$/, '')} item ${i + 1}`,
        price: 19.99 + i,
        imageUrl: '',
        storeUrl: 'https://demo-store.example.com/products/imported',
        source: 'Default',
        categories: [],
        description: 'Imported from CSV',
        createdAt: stamp,
        updatedAt: stamp,
      })
    }
    return rowCount
  }

  // ── Product feeds ──────────────────────────────────────────────────
  const productFeeds = ref<ProductFeed[]>([
    { id: 1, name: 'product rec for mcc', metric: 'Best Sellers', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Default', storeName: '', brands: ['Apple', 'brand-29jul', 'brand-vishal1'], categoryMode: 'all', categories: [], period: 'Last 5 days', sortBy: 'Random', createdAt: '2026-08-27T02:41:00Z', updatedAt: '2026-08-27T02:41:00Z' },
    { id: 2, name: 'rstestfeed12', metric: 'Best Sellers', activeOnly: true, inStockOnly: false, webstoreApprovedOnly: true, source: 'Shopify', storeName: 'jatinconnector.myshopify.com', brands: [], categoryMode: 'all', categories: [], period: 'Last 30 days', sortBy: 'Price Low to High', createdAt: '2026-04-27T06:27:00Z', updatedAt: '2026-04-27T06:27:00Z' },
    { id: 3, name: 'Testing product feed with commerce cloud', metric: 'Bought Together', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: false, source: 'Commerce Cloud', storeName: 'uat-commerce-cloud', brands: [], categoryMode: 'limit', categories: ['Cosmetics-Test'], period: 'Last 15 days', sortBy: 'Random', createdAt: '2025-11-03T03:36:00Z', updatedAt: '2025-11-03T03:36:00Z' },
    { id: 4, name: 'NG prod feed', metric: 'Best Sellers', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Default', storeName: '', brands: ['StudioForm'], categoryMode: 'all', categories: [], period: 'Last 10 days', sortBy: 'Random', createdAt: '2025-10-09T08:39:00Z', updatedAt: '2025-10-10T05:59:00Z' },
    { id: 5, name: 'ub-feed1', metric: 'New Arrivals', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Unified', storeName: '', brands: [], categoryMode: 'all', categories: [], period: 'Last 5 days', sortBy: 'Random', createdAt: '2025-09-19T06:28:00Z', updatedAt: '2025-09-19T06:28:00Z' },
    { id: 6, name: 'UB-FEED1.1', metric: 'Trending', activeOnly: false, inStockOnly: true, webstoreApprovedOnly: true, source: 'Unified', storeName: '', brands: [], categoryMode: 'exclude', categories: ['Balls'], period: 'Last 45 days', sortBy: 'Price High to Low', createdAt: '2025-06-18T02:56:00Z', updatedAt: '2025-09-19T06:28:00Z' },
    { id: 7, name: 'sk_test', metric: 'Similar Products', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Sk Test', storeName: '', brands: [], categoryMode: 'all', categories: [], period: 'Last 5 days', sortBy: 'Random', createdAt: '2025-06-06T01:13:00Z', updatedAt: '2025-06-06T01:13:00Z' },
    { id: 8, name: 'rajanbir_test', metric: 'Similar Products', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Magento', storeName: '', brands: ['Max Factor'], categoryMode: 'all', categories: [], period: 'Last 5 days', sortBy: 'Random', createdAt: '2025-05-22T00:19:00Z', updatedAt: '2025-05-22T00:19:00Z' },
    { id: 9, name: 'demo_shopify_ab_cart', metric: 'Similar Products', activeOnly: true, inStockOnly: false, webstoreApprovedOnly: true, source: 'Shopify', storeName: 'jatinconnector.myshopify.com', brands: [], categoryMode: 'all', categories: [], period: 'Last 60 days', sortBy: 'Random', createdAt: '2025-05-13T09:02:00Z', updatedAt: '2025-05-13T09:02:00Z' },
    { id: 10, name: 'keap-newarrivals', metric: 'New Arrivals', activeOnly: true, inStockOnly: true, webstoreApprovedOnly: true, source: 'Keap', storeName: '', brands: [], categoryMode: 'all', categories: [], period: 'Last 30 days', sortBy: 'Price Low to High', createdAt: '2025-04-02T10:12:00Z', updatedAt: '2025-04-02T10:12:00Z' },
  ])

  function nextFeedId(): number {
    return productFeeds.value.reduce((max, f) => Math.max(max, f.id), 0) + 1
  }

  function addFeed(input: FeedInput): ProductFeed {
    const stamp = nowIso()
    const feed: ProductFeed = { id: nextFeedId(), ...input, createdAt: stamp, updatedAt: stamp }
    productFeeds.value.unshift(feed)
    return feed
  }

  function updateFeed(id: number, input: FeedInput): void {
    const feed = productFeeds.value.find((f) => f.id === id)
    if (!feed) return
    Object.assign(feed, input, { updatedAt: nowIso() })
  }

  // ── Feed templates ─────────────────────────────────────────────────
  const feedTemplates = ref<FeedTemplate[]>([
    { id: 1, name: 'him_test_19_08', rows: 1, columns: 3, method: 'feed', feedId: 1, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-08-19T07:55:00Z', updatedAt: '2026-08-20T06:08:00Z' },
    { id: 2, name: 'him_18_08', rows: 1, columns: 3, method: 'feed', feedId: 2, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-08-18T04:02:00Z', updatedAt: '2026-08-18T04:02:00Z' },
    { id: 3, name: 'him_test_17_08', rows: 1, columns: 3, method: 'feed', feedId: 1, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: false, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-08-17T10:10:00Z', updatedAt: '2026-08-17T10:10:00Z' },
    { id: 4, name: 'vishal_testing_product_feed', rows: 1, columns: 3, method: 'manual', feedId: null, productItemIds: ['ring1', 'pbd', 'bbsm'], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Shop Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#0073ABFF', archived: false, createdAt: '2026-06-04T11:00:00Z', updatedAt: '2026-08-17T09:13:00Z' },
    { id: 5, name: 'updated_field', rows: 1, columns: 3, method: 'feed', feedId: 4, productItemIds: [], includeImage: true, includeName: true, includePrice: false, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-06-22T08:56:00Z', updatedAt: '2026-07-01T03:51:00Z' },
    { id: 6, name: 'vishal_testing_product_feed_info', rows: 1, columns: 3, method: 'feed', feedId: 5, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-06-04T03:52:00Z', updatedAt: '2026-06-05T06:11:00Z' },
    { id: 7, name: 'rajat_feed67', rows: 1, columns: 3, method: 'feed', feedId: 8, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-04-27T10:49:00Z', updatedAt: '2026-04-27T10:49:00Z' },
    { id: 8, name: 'rssaksham', rows: 3, columns: 3, method: 'feed', feedId: 2, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2026-04-27T06:28:00Z', updatedAt: '2026-04-27T06:28:00Z' },
    { id: 9, name: 'ng_template', rows: 1, columns: 3, method: 'feed', feedId: 4, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2025-10-09T08:43:00Z', updatedAt: '2025-10-10T05:10:00Z' },
    { id: 10, name: 'umb_tmp', rows: 2, columns: 3, method: 'feed', feedId: 5, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: false, createdAt: '2025-09-19T06:34:00Z', updatedAt: '2025-09-19T06:34:00Z' },
    { id: 11, name: 'legacy_2x3_archived', rows: 2, columns: 3, method: 'feed', feedId: 7, productItemIds: [], includeImage: true, includeName: true, includePrice: true, includeButton: true, buttonText: 'Buy Now', buttonTextColor: '#FFFFFFFF', buttonBgColor: '#000000FF', archived: true, createdAt: '2025-03-11T04:20:00Z', updatedAt: '2025-05-02T09:00:00Z' },
  ])

  function nextTemplateId(): number {
    return feedTemplates.value.reduce((max, t) => Math.max(max, t.id), 0) + 1
  }

  function addTemplate(input: TemplateInput): FeedTemplate {
    const stamp = nowIso()
    const template: FeedTemplate = { id: nextTemplateId(), ...input, archived: false, createdAt: stamp, updatedAt: stamp }
    feedTemplates.value.unshift(template)
    return template
  }

  function updateTemplate(id: number, input: TemplateInput): void {
    const template = feedTemplates.value.find((t) => t.id === id)
    if (!template) return
    Object.assign(template, input, { updatedAt: nowIso() })
  }

  function archiveTemplate(id: number): void {
    const template = feedTemplates.value.find((t) => t.id === id)
    if (template) {
      template.archived = true
      template.updatedAt = nowIso()
    }
  }

  function restoreTemplate(id: number): void {
    const template = feedTemplates.value.find((t) => t.id === id)
    if (template) {
      template.archived = false
      template.updatedAt = nowIso()
    }
  }

  // ── Pricing configurations ─────────────────────────────────────────
  const pricingConfigurations = ref<PricingConfiguration[]>([
    { id: 1, title: 'Winter clearance — Online Store', description: 'Seasonal markdown across the outdoor range.', salesChannel: 'Online Store', audienceAttribute: 'Contact Lists', audienceOperator: 'Equal', audienceValue: 'Newsletter subscribers', startDate: '2026-06-01', startTime: '09:00', endDate: '2026-08-31', endTime: '23:59', adjustment: 'Decrease', percentage: 15, productCount: 42, status: 'Active' },
    { id: 2, title: 'Trade pricing — wholesale list', description: 'Standing discount for trade accounts.', salesChannel: 'Online Store', audienceAttribute: 'Contact Lists', audienceOperator: 'Equal', audienceValue: 'Trade accounts', startDate: '2026-01-01', startTime: '00:00', endDate: '', endTime: '', adjustment: 'Decrease', percentage: 25, productCount: 128, status: 'Active' },
    { id: 3, title: 'POS counter uplift', description: 'Counter pricing to cover in-store handling.', salesChannel: 'POS', audienceAttribute: 'Contact Lists', audienceOperator: 'Equal', audienceValue: '', startDate: '2026-09-01', startTime: '08:00', endDate: '2026-12-24', endTime: '18:00', adjustment: 'Increase', percentage: 5, productCount: 96, status: 'Draft' },
  ])

  function nextPricingId(): number {
    return pricingConfigurations.value.reduce((max, p) => Math.max(max, p.id), 0) + 1
  }

  function addPricingConfiguration(input: PricingInput): PricingConfiguration {
    const config: PricingConfiguration = { id: nextPricingId(), ...input, productCount: 0 }
    pricingConfigurations.value.unshift(config)
    return config
  }

  function updatePricingConfiguration(id: number, input: PricingInput): void {
    const config = pricingConfigurations.value.find((p) => p.id === id)
    if (!config) return
    Object.assign(config, input)
  }

  function deletePricingConfiguration(id: number): void {
    pricingConfigurations.value = pricingConfigurations.value.filter((p) => p.id !== id)
  }

  // ── Reservations ───────────────────────────────────────────────────
  const reservations = ref<Reservation[]>([
    { id: 1, item: 'Plymor Rectangle 5mm Beveled Glass', sku: 'B09F3SGZ8Y-V1', orderNumber: '#9', location: 'Testing', description: 'Items reserved for order #9', qty: 1, inStock: 4, available: 3 },
    { id: 2, item: 'Plymor Rectangle 5mm Beveled Glass', sku: 'B09F3SGZ8Y-V2', orderNumber: '#9', location: 'Testing', description: 'Items reserved for order #9', qty: 1, inStock: 6, available: 5 },
    { id: 3, item: 'AMHANCIBLE C Shaped Side Table', sku: 'B0BT9SVN1V-V1', orderNumber: '#8', location: 'Oxford Warehouse', description: 'Items reserved for order #8', qty: 1, inStock: 12, available: 11 },
    { id: 4, item: 'JOIN IRON Foldable TV Trays for Eating', sku: 'B0CG1N9QRC-V1', orderNumber: '#7', location: 'Oxford Warehouse', description: 'Items reserved for order #7', qty: 2, inStock: 9, available: 7 },
    { id: 5, item: 'Casual Home 5 Piece Tray Table Set', sku: 'B0069H9BYO-V2', orderNumber: '#7', location: 'Oxford Warehouse', description: 'Items reserved for order #7', qty: 1, inStock: 5, available: 4 },
    { id: 6, item: 'Harbor Oval Coffee Table', sku: 'COF-1928-C-MATTE--SOLID-', orderNumber: '#6', location: 'Oxford Warehouse', description: 'Items reserved for order #6', qty: 1, inStock: 3, available: 2 },
    { id: 7, item: 'Blue Eyeliner', sku: 'BLESH012', orderNumber: '#5', location: 'Oxford Warehouse', description: 'Items reserved for order #5', qty: 1, inStock: 8, available: 7 },
  ])

  /**
   * Variants the reservation dialog can hold stock against. UAT queries
   * `manage_inventory=true`, so non-managed products never appear — the rebuild
   * keeps the same rule but says so in the field hint.
   */
  const reservableVariants = ref<ReservableVariant[]>([
    { label: 'Plymor Rectangle 5mm Beveled Glass — V1', sku: 'B09F3SGZ8Y-V1', inStock: 4, available: 3, manageInventory: true },
    { label: 'Plymor Rectangle 5mm Beveled Glass — V2', sku: 'B09F3SGZ8Y-V2', inStock: 6, available: 5, manageInventory: true },
    { label: 'AMHANCIBLE C Shaped Side Table — V1', sku: 'B0BT9SVN1V-V1', inStock: 12, available: 11, manageInventory: true },
    { label: 'AMHANCIBLE C Shaped Side Table — V2', sku: 'B0BT9SVN1V-V2', inStock: 7, available: 7, manageInventory: true },
    { label: 'JOIN IRON Foldable TV Trays for Eating — V1', sku: 'B0CG1N9QRC-V1', inStock: 9, available: 7, manageInventory: true },
    { label: 'Casual Home 5 Piece Tray Table Set — V2', sku: 'B0069H9BYO-V2', inStock: 5, available: 4, manageInventory: true },
    { label: 'Harbor Oval Coffee Table — Matte Black / Solid Wood', sku: 'COF-1928-C-MATTE--SOLID-', inStock: 3, available: 2, manageInventory: true },
    { label: '1 Pack Adjustable Height Center Support — V1', sku: 'B09BVQZM3S-V1', inStock: 14, available: 14, manageInventory: true },
    { label: 'Blue Eyeliner', sku: 'BLESH012', inStock: 8, available: 7, manageInventory: true },
  ])

  function nextReservationId(): number {
    return reservations.value.reduce((max, r) => Math.max(max, r.id), 0) + 1
  }

  function addReservation(input: ReservationInput): Reservation {
    const variant = reservableVariants.value.find((v) => v.sku === input.sku)
    const reservation: Reservation = {
      id: nextReservationId(),
      item: input.item,
      sku: input.sku,
      orderNumber: '—',
      location: input.location,
      description: input.description,
      qty: input.qty,
      inStock: variant?.inStock ?? 0,
      available: Math.max(0, (variant?.available ?? 0) - input.qty),
    }
    if (variant) variant.available = reservation.available
    reservations.value.unshift(reservation)
    return reservation
  }

  function updateReservation(id: number, input: ReservationInput): void {
    const reservation = reservations.value.find((r) => r.id === id)
    if (!reservation) return
    Object.assign(reservation, input)
  }

  function deleteReservation(id: number): void {
    const reservation = reservations.value.find((r) => r.id === id)
    if (reservation) {
      const variant = reservableVariants.value.find((v) => v.sku === reservation.sku)
      if (variant) variant.available += reservation.qty
    }
    reservations.value = reservations.value.filter((r) => r.id !== id)
  }

  // ── Collections ────────────────────────────────────────────────────
  const emptySeo = (): CollectionSeo => ({ title: '', metaDescription: '', urlHandle: '', ogTitle: '', ogDescription: '' })

  function seedCollection(id: number, title: string, type: CollectionType, updatedAt: string, productCount: number, status: CollectionStatus = 'Active'): Collection {
    const handle = `${toHandle(title)}-1`
    return {
      id, title, handle, type, parent: 'Root', productCount, status, updatedAt,
      description: '', matchMode: 'all',
      rules: type === 'Automated' ? [{ field: 'Category', operator: 'Contains', value: title }] : [],
      productItemIds: [],
      seo: { ...emptySeo(), urlHandle: handle },
      imageName: '', salesChannels: [],
    }
  }

  const collections = ref<Collection[]>([
    seedCollection(1, 'TV Trays', 'Automated', '2026-05-18T04:45:00Z', 6),
    seedCollection(2, 'Bed Parts', 'Automated', '2026-05-18T04:45:00Z', 4),
    seedCollection(3, 'Coffee Tables', 'Automated', '2026-05-18T04:45:00Z', 9),
    seedCollection(4, 'Storage Carts', 'Automated', '2026-05-18T04:45:00Z', 3),
    seedCollection(5, 'Home Office Desk Chairs', 'Automated', '2026-05-18T04:45:00Z', 7),
    seedCollection(6, 'Towel Rings', 'Automated', '2026-05-18T04:45:00Z', 5),
    seedCollection(7, 'Over the Door Shoe Organizers', 'Automated', '2026-05-18T04:45:00Z', 2),
    seedCollection(8, 'Chairs', 'Automated', '2026-05-18T04:45:00Z', 11),
    seedCollection(9, 'Hampers', 'Automated', '2026-05-18T04:44:00Z', 4),
    seedCollection(10, 'Free Standing Shoe Racks', 'Automated', '2026-05-18T04:44:00Z', 3),
    seedCollection(11, 'Wall-Mounted Mirrors', 'Automated', '2026-05-18T04:44:00Z', 8),
    seedCollection(12, 'Nightstands', 'Automated', '2026-05-18T04:44:00Z', 6),
    seedCollection(13, 'Tables', 'Automated', '2026-05-18T04:44:00Z', 14),
    seedCollection(14, 'End Tables', 'Automated', '2026-05-18T04:44:00Z', 5),
    seedCollection(15, 'Folding Tables', 'Automated', '2026-05-18T04:44:00Z', 4),
    seedCollection(16, 'TV Mounts', 'Automated', '2026-05-18T04:44:00Z', 7),
    seedCollection(17, 'TV Wall & Ceiling Mounts', 'Automated', '2026-05-18T04:44:00Z', 6),
    seedCollection(18, 'Toy Bags & Nets', 'Automated', '2026-05-18T04:44:00Z', 2),
    seedCollection(19, 'Over-the-Toilet Storage', 'Automated', '2026-05-18T04:44:00Z', 3),
    seedCollection(20, 'All Products', 'Automated', '2025-10-10T19:06:00Z', 45),
    { ...seedCollection(21, 'Summer Feature Picks', 'Manual', '2026-07-12T09:15:00Z', 3), productItemIds: ['ring1', 'pbd', 'bbsm'], rules: [] },
    { ...seedCollection(22, 'Clearance — Inactive', 'Manual', '2026-03-02T11:00:00Z', 0, 'Inactive'), productItemIds: [], rules: [] },
  ])

  function nextCollectionId(): number {
    return collections.value.reduce((max, c) => Math.max(max, c.id), 0) + 1
  }

  function addCollection(input: CollectionInput): Collection {
    const handle = input.seo.urlHandle || toHandle(input.title)
    const collection: Collection = {
      id: nextCollectionId(),
      title: input.title,
      handle,
      type: input.type,
      parent: input.parent || 'Root',
      productCount: input.type === 'Manual' ? input.productItemIds.length : 0,
      status: input.status,
      updatedAt: nowIso(),
      description: input.description,
      matchMode: input.matchMode,
      rules: input.rules,
      productItemIds: input.productItemIds,
      seo: { ...input.seo, urlHandle: handle },
      imageName: input.imageName,
      salesChannels: [],
    }
    collections.value.unshift(collection)
    return collection
  }

  function updateCollection(id: number, input: CollectionInput): void {
    const collection = collections.value.find((c) => c.id === id)
    if (!collection) return
    const handle = input.seo.urlHandle || toHandle(input.title)
    Object.assign(collection, {
      title: input.title,
      handle,
      type: input.type,
      parent: input.parent || 'Root',
      status: input.status,
      description: input.description,
      matchMode: input.matchMode,
      rules: input.rules,
      productItemIds: input.productItemIds,
      productCount: input.type === 'Manual' ? input.productItemIds.length : collection.productCount,
      seo: { ...input.seo, urlHandle: handle },
      imageName: input.imageName,
      updatedAt: nowIso(),
    })
  }

  function deleteCollection(id: number): void {
    collections.value = collections.value.filter((c) => c.id !== id)
  }

  function deleteCollections(ids: number[]): void {
    collections.value = collections.value.filter((c) => !ids.includes(c.id))
  }

  function setCollectionsStatus(ids: number[], status: CollectionStatus): void {
    collections.value.forEach((c) => {
      if (ids.includes(c.id)) {
        c.status = status
        c.updatedAt = nowIso()
      }
    })
  }

  // ── Tax categories ─────────────────────────────────────────────────
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
    Object.assign(category, patch)
  }

  function deleteTaxCategory(id: string): void {
    taxCategories.value = taxCategories.value.filter((c) => c.id !== id)
  }

  return {
    catalog, updateCatalogProduct, importCatalog,
    productFeeds, addFeed, updateFeed,
    feedTemplates, addTemplate, updateTemplate, archiveTemplate, restoreTemplate,
    pricingConfigurations, addPricingConfiguration, updatePricingConfiguration, deletePricingConfiguration,
    reservations, reservableVariants, addReservation, updateReservation, deleteReservation,
    taxCategories, addTaxCategory, updateTaxCategory, deleteTaxCategory,
    collections, addCollection, updateCollection, deleteCollection, deleteCollections, setCollectionsStatus,
    toHandle,
  }
})
