import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useOnboardingStore } from '@/stores/useOnboarding'

const productNames = [
  'Nike Air Max 270 - Black/White', 'Patagonia Better Sweater Fleece Vest', 'Apple iPhone 15 Pro Case - Clear',
  'Samsung 65" QLED 4K Smart TV', 'Levi\'s 501 Original Fit Jeans', 'Sony WH-1000XM5 Headphones',
  'Instant Pot Duo 7-in-1 Pressure Cooker', 'Kindle Paperwhite 16GB', 'Hydro Flask 32oz Wide Mouth',
  'Allbirds Tree Runners - Wool White', 'YETI Rambler 20oz Tumbler', 'Dyson V15 Detect Vacuum',
  'TheraGun Pro Massage Device', 'Lululemon Align Leggings 25"', 'Stanley Adventure Quencher 40oz',
  'GoPro HERO12 Black Action Camera', 'KitchenAid Stand Mixer 5Qt - Red', 'Vitamix 5200 Blender',
  'Ember Smart Mug 2 - 14oz', 'Anker 65W USB-C Charging Hub', 'Bose QuietComfort Earbuds II',
  'Away Carry-On Luggage - Bigger', 'Le Creuset Dutch Oven 5.5qt - Blue', 'Oura Ring Gen 3 - Gold',
  'Sonos Era 300 Speaker', 'Purple Hybrid Premier 3 Mattress', 'Breville Espresso Machine Pro',
  'Nespresso Vertuo Next Coffee Maker', 'Peloton Bike+ Guide Bundle', 'Anova Culinary Sous Vide Precision',
  'Rtic 45 Qt Hard Cooler', 'Zojirushi Rice Cooker 5.5 Cup', 'Weber Genesis E-325s Gas Grill',
  'Traeger Ranger Portable Pellet Grill', 'DEWALT 20V MAX Cordless Drill', 'Roomba j7+ Self-Emptying Robot',
  'Philips Hue Starter Kit A19', 'Nest Learning Thermostat - 4th Gen', 'Ring Video Doorbell Pro 2',
  'Tile Pro Bluetooth Tracker 4-Pack',
]
const categories = ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Tools & Garden']
const customerFirstNames = ['James', 'Sofia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'Aiden', 'Amelia', 'Jackson', 'Harper', 'Sebastian', 'Evelyn', 'Mateo', 'Abigail', 'Jack', 'Emily', 'Owen', 'Ella', 'Theodore', 'Scarlett', 'Henry', 'Grace']
const customerLastNames = ['Anderson', 'Thompson', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill']
const cities = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Seattle, WA', 'Miami, FL', 'Boston, MA', 'Denver, CO', 'Los Angeles, CA', 'Phoenix, AZ']
// Real Maropost order status values
const orderStatuses = ['Processing', 'Completed', 'Cancelled', 'Refunded', 'On Hold']
const fulfillmentStatuses = ['Not Ready', 'Ready For Fulfillment', 'Shipped', 'Return Requested', 'Cancelled', 'Unapproved']
const paymentMethods = ['Visa •••• 4242', 'Mastercard •••• 8888', 'Amex •••• 1234', 'PayPal', 'Shop Pay', 'Apple Pay']

const VENDORS = ['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier', 'Local Artisan']
const LOCATIONS = ['Main Warehouse - FL', 'Secondary Node - CA', 'Retail Hub - TX']

export type ProductType = 'product' | 'kit'
export type PublishStatus = 'Draft' | 'Published'

export interface ProductOption {
  name: string
  values: string[]
}

export interface ProductVariant {
  id: number
  title: string
  sku: string
  manageInventory: boolean
  allowBackorder: boolean
  costPrice: string
  price: string
  /** Per-location on-hand counts, keyed by location name. */
  stock: Record<string, number>
}

export interface KitComponent {
  productId: number
  name: string
  sku: string
  qty: number
  price: string
  inStock: number
}

/** Full wizard payload persisted so the editor can repopulate every field. */
export interface ProductDetail {
  subtitle: string
  url: string
  description: string
  hasVariants: boolean
  options: ProductOption[]
  variantsList: ProductVariant[]
  // Organise
  taxCategory: string
  material: string
  brand: string
  tag: string
  collection: string
  categories: string[]
  width: string
  length: string
  height: string
  weight: string
  midCode: string
  hsCode: string
  countryOfOrigin: string
  discountable: boolean
  salesChannels: string[]
}

export interface Product {
  id: number
  name: string
  sku: string
  price: string
  compareAtPrice: string
  inventory: number
  category: string
  status: string
  vendor: string
  images: number
  variants: number
  type: ProductType
  publishStatus: PublishStatus
  detail?: ProductDetail
  components?: KitComponent[]
}

/** Input accepted by createProduct / updateProductDraft (the full-page wizards). */
export interface ProductDraftInput {
  name: string
  sku: string
  category: string
  vendor: string
  price: string
  inventory: number
  variants: number
  type: ProductType
  publishStatus: PublishStatus
  detail?: ProductDetail
  components?: KitComponent[]
}

export interface InventoryItem {
  id: number
  name: string
  sku: string
  inventory: number
  incoming: number
  location: string
  status: string
}

// ── Promotions (coupons & automatic discounts) ─────────────────────────
export type PromotionMethod = 'Order' | 'Product'
export type PromotionMechanism = 'Code' | 'Automatic'
export type PromotionDiscountType = 'Percentage' | 'Fixed'
export type PromotionStatus = 'Active' | 'Inactive'

export interface Promotion {
  id: number
  title: string
  description?: string
  method: PromotionMethod
  mechanism: PromotionMechanism
  code?: string
  discountType: PromotionDiscountType
  value: number
  salesChannels: string[]
  startDate: string
  endDate?: string
  status: PromotionStatus
  usage: number
  limit: number | null
}

/** Input accepted by createPromotion / updatePromotion (the full-page composer). */
export interface PromotionInput {
  title: string
  description?: string
  method: PromotionMethod
  mechanism: PromotionMechanism
  code?: string
  discountType: PromotionDiscountType
  value: number
  salesChannels: string[]
  startDate: string
  endDate?: string
  status: PromotionStatus
  limit?: number | null
}

// ── Custom (merchant-issued) gift cards ────────────────────────────────
export type GiftCardStatus = 'Active' | 'Redeemed' | 'Expired' | 'Disabled'

export interface CustomGiftCard {
  id: number
  code: string
  /** Existing CRM contact this card is linked to, or '—' for a guest recipient. */
  contact: string
  recipient: { name: string; email: string }
  initialValue: number
  balance: number
  message?: string
  expiration: 'none' | 'date'
  status: GiftCardStatus
  issued: string
  expiry: string | null
  lastUsed: string | null
  image?: string
}

/** Input accepted by issueGiftCard / updateGiftCard (the issue drawer). */
export interface GiftCardInput {
  initialValue: number
  email: string
  contact?: string
  message?: string
  expiration: 'none' | 'date'
  expiry?: string | null
  status: 'Active' | 'Disabled'
  image?: string
}

// ── Purchasable gift card products ─────────────────────────────────────
export type PurchasableGiftCardStatus = 'Active' | 'Draft' | 'Archived'

export interface PurchasableGiftCard {
  id: number
  name: string
  slug: string
  kind: 'Digital' | 'Physical'
  message?: string
  denominations: number[]
  sold: number
  revenue: number
  status: PurchasableGiftCardStatus
  created: string
  taxCategory?: string
  brand?: string
  tags: string[]
  collections: string[]
}

/** Input accepted by createPurchasableGiftCard / updatePurchasableGiftCard. */
export interface PurchasableGiftCardInput {
  name: string
  slug: string
  kind: 'Digital' | 'Physical'
  message?: string
  denominations: number[]
  status: PurchasableGiftCardStatus
  taxCategory?: string
  brand?: string
  tags: string[]
  collections: string[]
}

// ── Orders / Draft Orders / Fulfillments (Commerce > Orders domain) ────
export const SALES_CHANNELS = ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']

/**
 * Channels the generated web seed rotates through. POS is excluded on purpose:
 * in-store orders come from the POS seed below, which carries real register,
 * location and staff context.
 */
const WEB_SEED_CHANNELS = SALES_CHANNELS.filter((c) => c !== 'POS')

/** Map the human channel label onto the structured channel identity. */
function channelIdentity(label: string): { channelType: OrderChannelType; channelId: string | null } {
  if (label === 'Online Store') return { channelType: 'web_store', channelId: 'retest-sales-notification' }
  if (label === 'POS') return { channelType: 'offline_store', channelId: 'pos-store' }
  return { channelType: 'marketplace', channelId: null }
}
export const SHIPPING_RATES: Record<string, number> = { Standard: 9.99, Express: 24.99, Overnight: 49.99, Free: 0 }
const ORDER_TAG_POOL = ['VIP', 'Wholesale', 'Repeat Customer', 'Gift', 'Rush', 'Local Pickup']
const STREET_NAMES = ['Market St', 'Main St', 'Broadway', 'Oak Ave', 'Elm St', '5th Ave', 'Sunset Blvd', 'Congress Ave']
/** Order-detail fulfillment step indicators (legacy: Picked → Pack → Carrier → Shipped). */
export const FULFILLMENT_STAGES = ['Picked', 'Pack', 'Carrier', 'Shipped'] as const
export type FulfillmentStage = typeof FULFILLMENT_STAGES[number]
/** Fulfillment-queue statuses (legacy list statuses). */
export const FULFILLMENT_QUEUE_STATUSES = ['Picked', 'Packed', 'Label Created', 'Shipped'] as const
export type FulfillmentQueueStatus = typeof FULFILLMENT_QUEUE_STATUSES[number]
const WAREHOUSE_LOCATIONS = ['Oxford warehouse', 'Main Warehouse - FL', 'Retail Hub - TX']

export interface OrderAddress {
  name: string
  line1: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface OrderLineItem {
  product: string
  sku: string
  qty: number
  price: string
  status: string
  coupon: string | null
  discountPct: number
}

export interface OrderTimelineEvent {
  id: number
  kind: 'note' | 'event'
  text: string
  date: string
}

/** How the sale reached us. POS sales carry `pos` metadata; web sales do not. */
export type OrderChannelType = 'web_store' | 'offline_store' | 'marketplace'

export type TenderType = 'card' | 'cash' | 'tap_to_pay' | 'gift_card' | 'split'
export const TENDER_LABELS: Record<TenderType, string> = {
  card: 'Card',
  cash: 'Cash',
  tap_to_pay: 'Tap to Pay',
  gift_card: 'Gift card',
  split: 'Split',
}

/** BORIS = bought online, returned in store. */
export type OrderOrigin = 'in_store' | 'boris'

export interface OrderTender {
  type: TenderType
  amount: number
}

/** Present only on orders taken at a register. */
export interface OrderPosMeta {
  locationId: string
  registerId: string
  staffId: string
  origin: OrderOrigin
  hasReceipt: boolean
}

export interface Order {
  id: number
  orderNumber: string
  customer: { name: string; email: string; avatar: string }
  city: string
  itemCount: number
  subtotal: string
  shipping: string
  total: string
  status: string
  fulfillmentStatus: string
  paymentStatus: string
  paymentMethod: string
  paymentReference: string
  paymentCapturedAt: string | null
  trackingNumber: string | null
  courier: string | null
  date: string
  lineItems: OrderLineItem[]
  notes: string | null
  tags: string[]
  salesChannel: string
  currency: string
  region: string
  country: string
  phone: string
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
  fulfillmentStage: FulfillmentStage
  fulfilledFromLocation: string
  timeline: OrderTimelineEvent[]
  channelType: OrderChannelType
  /** SalesChannel id, or null for marketplaces we do not model as channels. */
  channelId: string | null
  /** Set iff channelType === 'offline_store'. */
  pos?: OrderPosMeta
  tenders?: OrderTender[]
}

export interface DraftLineItem {
  id: number
  name: string
  sku: string
  price: number
  qty: number
  custom: boolean
}

export interface DraftOrder {
  id: number
  draftNumber: string
  customer: string
  email: string
  phone: string
  salesChannel: string
  items: number
  lineItems: DraftLineItem[]
  total: string
  status: string
  createdAt: string
  shippingAddress: OrderAddress | null
  billingAddress: OrderAddress | null
  shippingMethod: string
  discount: { type: string; value: number }
  notes: string
}

/** Input accepted by createDraftOrder / updateDraftOrder (the full-page composer). */
export interface DraftOrderInput {
  customer: string
  email: string
  phone: string
  salesChannel: string
  lineItems: DraftLineItem[]
  shippingAddress: OrderAddress | null
  billingAddress: OrderAddress | null
  shippingMethod: string
  discount: { type: string; value: number }
  notes: string
}

export interface FulfillmentQueueItem {
  id: number
  orderId: number
  orderNumber: string
  customer: string
  location: string
  status: FulfillmentQueueStatus
  paymentStatus: string
  orderStatus: string
  salesChannel: string
  productQty: number
  total: string
  createdAt: string
  trackingNumber: string | null
}

function buildAddress(name: string, cityState: string, seed: number): OrderAddress {
  const [city, region] = (cityState ?? '—, —').split(', ')
  return {
    name,
    line1: `${100 + (seed * 7) % 900} ${STREET_NAMES[seed % STREET_NAMES.length]}`,
    city: city ?? '—',
    region: region ?? '',
    postalCode: String(10000 + (seed * 137) % 89999),
    country: 'United States',
  }
}

function pickOrderTags(i: number): string[] {
  const tags: string[] = []
  if (i % 3 === 0) tags.push(ORDER_TAG_POOL[i % ORDER_TAG_POOL.length]!)
  if (i % 7 === 0) tags.push(ORDER_TAG_POOL[(i + 2) % ORDER_TAG_POOL.length]!)
  return tags
}

/** Compute the draft total from line items, discount, and shipping method. */
export function draftOrderTotal(input: Pick<DraftOrderInput, 'lineItems' | 'discount' | 'shippingMethod'>): number {
  const subtotal = input.lineItems.reduce((sum, li) => sum + li.price * li.qty, 0)
  const discount = input.discount.type === 'Percentage'
    ? subtotal * (input.discount.value / 100)
    : input.discount.type === 'Fixed' ? input.discount.value : 0
  const shipping = input.lineItems.length ? (SHIPPING_RATES[input.shippingMethod] ?? 0) : 0
  return Math.max(0, subtotal - discount) + shipping
}

/** Derive the stock chip status from an available-inventory count. */
function stockStatus(inv: number): string {
  return inv === 0 ? 'Out of Stock' : inv < 20 ? 'Low Stock' : 'In Stock'
}

/**
 * In-store orders, ported from the retail store's transaction seed.
 *
 * POS sales are Orders like any other — they simply carry register, location
 * and staff context. Ids start at 2000 so they never collide with the web seed
 * or with `convertDraftToOrder`'s max+1 allocation.
 */
function buildPosOrders(): Order[] {
  const L = (sku: string, name: string, qty: number, price: number) => ({ sku, name, qty, price })
  const TEE_B = (q = 1) => L('TEE-001-BLK-M', 'Classic crew tee — Black', q, 39)
  const TEE_W = (q = 1) => L('TEE-001-WHT-M', 'Classic crew tee — White', q, 39)
  const JEAN = (q = 1) => L('JEAN-512-DRK-32', 'Slim denim — Dark, 32', q, 129)
  const SNEAK = (q = 1) => L('SNEAK-A1-WHT-10', 'Court sneaker — White, 10', q, 159)
  const CAP = (q = 1) => L('CAP-001-NVY', 'Cap — Navy', q, 35)
  const BAG = (q = 1) => L('BAG-LTH-BLK', 'Leather tote — Black', q, 249)
  const HOOD = (q = 1) => L('HOOD-101-GRY-L', 'Pullover hoodie — Grey, L', q, 89)
  const JACK = (q = 1) => L('JACK-220-OLI-M', 'Field jacket — Olive, M', q, 219)

  type PosSeedStatus = 'completed' | 'refunded' | 'partial_refund' | 'voided' | 'suspended'
  interface PosSeed {
    locationId: string
    registerId: string
    staffId: string
    customerName?: string
    tender: TenderType
    status: PosSeedStatus
    origin: OrderOrigin
    hasReceipt: boolean
    daysAgo: number
    lines: Array<{ sku: string; name: string; qty: number; price: number }>
  }

  const seed: PosSeed[] = [
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', staffId: 'assoc-1', customerName: 'Hannah Cole',    tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_B(2), CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', staffId: 'assoc-3', customerName: undefined,        tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', staffId: 'assoc-1', customerName: "Liam O'Connor",  tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JEAN(), TEE_W(2), CAP(), TEE_B()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-3', staffId: 'assoc-2', customerName: 'Mia Tan',        tender: 'split',      status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [HOOD(), CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', staffId: 'assoc-1', customerName: 'Noah Williams',  tender: 'card',       status: 'refunded',       origin: 'boris',    hasReceipt: true,  daysAgo: 2, lines: [HOOD()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', staffId: 'assoc-3', customerName: 'Zoe Patel',      tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 3, lines: [TEE_B(), HOOD()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  staffId: 'assoc-4', customerName: 'Aria Singh',     tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_B(2), JEAN()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  staffId: 'assoc-4', customerName: undefined,        tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [CAP()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-2',  staffId: 'assoc-2', customerName: 'Lucas Chen',     tender: 'card',       status: 'partial_refund', origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JACK(), HOOD(), TEE_W(2)] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  staffId: 'assoc-4', customerName: 'Ivy Nguyen',     tender: 'gift_card',  status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 2, lines: [CAP(), TEE_B()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  staffId: 'assoc-4', customerName: undefined,        tender: 'cash',       status: 'voided',         origin: 'in_store', hasReceipt: false, daysAgo: 4, lines: [CAP()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  staffId: 'assoc-6', customerName: 'Olivia Walker',  tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_W(), CAP()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-2',  staffId: 'assoc-6', customerName: 'Jack Pierce',    tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [SNEAK(), CAP(2), TEE_B()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  staffId: 'assoc-6', customerName: 'Ruby Anand',     tender: 'cash',       status: 'suspended',      origin: 'in_store', hasReceipt: false, daysAgo: 3, lines: [TEE_B()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  staffId: 'assoc-7', customerName: 'Henry Adler',    tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [BAG(), CAP(), TEE_B()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  staffId: 'assoc-7', customerName: 'Maya Diaz',      tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [BAG(), JACK(), SNEAK(), JEAN(), TEE_B(2)] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  staffId: 'assoc-8', customerName: undefined,        tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  staffId: 'assoc-8', customerName: 'Sophia Renner',  tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JEAN(), HOOD(), TEE_W(2)] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  staffId: 'assoc-7', customerName: 'Owen Castillo',  tender: 'card',       status: 'refunded',       origin: 'boris',    hasReceipt: true,  daysAgo: 2, lines: [SNEAK()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  staffId: 'assoc-8', customerName: 'Lily Brooks',    tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 3, lines: [TEE_B(), CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  staffId: 'assoc-7', customerName: 'Caleb Foster',   tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 4, lines: [HOOD(), TEE_W(), CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  staffId: 'assoc-8', customerName: 'Ella Ross',      tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 5, lines: [CAP()] },
  ]

  // Counter sales are fulfilled on the spot, so they never enter the fulfillment queue.
  const STATUS_MAP: Record<PosSeedStatus, { status: string; paymentStatus: string; fulfillmentStatus: string; stage: FulfillmentStage }> = {
    completed:      { status: 'Completed', paymentStatus: 'Paid',                fulfillmentStatus: 'Shipped',   stage: 'Shipped' },
    refunded:       { status: 'Refunded',  paymentStatus: 'Refunded',            fulfillmentStatus: 'Shipped',   stage: 'Shipped' },
    partial_refund: { status: 'Completed', paymentStatus: 'Partially Refunded',  fulfillmentStatus: 'Shipped',   stage: 'Shipped' },
    voided:         { status: 'Cancelled', paymentStatus: 'Voided',              fulfillmentStatus: 'Cancelled', stage: 'Pack' },
    suspended:      { status: 'On Hold',   paymentStatus: 'Pending',             fulfillmentStatus: 'Not Ready', stage: 'Pack' },
  }

  const now = Date.now()
  return seed.map((t, i) => {
    const subtotalNum = t.lines.reduce((sum, l) => sum + l.price * l.qty, 0)
    const gross = Math.round(subtotalNum * 1.1 * 100) / 100
    const totalNum = t.status === 'voided' ? 0 : t.status === 'refunded' ? -gross : gross
    const map = STATUS_MAP[t.status]
    const at = new Date(now - t.daysAgo * 86_400_000 - (i * 7 + 25) * 60_000)
    const date = at.toISOString().split('T')[0]!
    const name = t.customerName ?? 'Walk-in customer'
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

    const timeline: OrderTimelineEvent[] = [
      { id: 1, kind: 'event', text: `Sold in store — register ${t.registerId}`, date },
    ]
    if (map.paymentStatus === 'Paid') {
      timeline.push({ id: 2, kind: 'event', text: `Payment of $${gross.toFixed(2)} taken (${TENDER_LABELS[t.tender]})`, date })
    }
    if (t.status === 'refunded') timeline.push({ id: 3, kind: 'event', text: `Refund of $${gross.toFixed(2)} issued`, date })
    if (t.status === 'partial_refund') timeline.push({ id: 3, kind: 'event', text: 'Partial refund issued', date })
    if (t.status === 'voided') timeline.push({ id: 4, kind: 'event', text: 'Sale voided at the register', date })
    if (t.status === 'suspended') timeline.push({ id: 5, kind: 'event', text: 'Sale suspended — parked at the register', date })

    return {
      id: 2000 + i,
      orderNumber: `POS-${12048 - i}`,
      customer: { name, email: t.customerName ? `${t.customerName.split(' ')[0]!.toLowerCase()}@email.com` : '—', avatar: initials },
      city: '—',
      itemCount: t.lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: subtotalNum.toFixed(2),
      shipping: '0.00',
      total: totalNum.toFixed(2),
      status: map.status,
      fulfillmentStatus: map.fulfillmentStatus,
      paymentStatus: map.paymentStatus,
      paymentMethod: TENDER_LABELS[t.tender],
      paymentReference: `pos_${String(910000 + i * 731)}`,
      paymentCapturedAt: map.paymentStatus === 'Pending' ? null : date,
      trackingNumber: null,
      courier: null,
      date,
      lineItems: t.lines.map((l): OrderLineItem => ({
        product: l.name,
        sku: l.sku,
        qty: l.qty,
        price: l.price.toFixed(2),
        status: t.status === 'voided' ? 'Cancelled' : 'Shipped',
        coupon: null,
        discountPct: 0,
      })),
      notes: null,
      tags: [],
      salesChannel: 'POS',
      currency: 'USD',
      region: '—',
      country: '—',
      phone: '—',
      shippingAddress: buildAddress(name, '—', i),
      billingAddress: buildAddress(name, '—', i),
      fulfillmentStage: map.stage,
      fulfilledFromLocation: t.locationId,
      timeline,
      channelType: 'offline_store' as const,
      channelId: 'pos-store',
      pos: {
        locationId: t.locationId,
        registerId: t.registerId,
        staffId: t.staffId,
        origin: t.origin,
        hasReceipt: t.hasReceipt,
      },
      tenders: [{ type: t.tender, amount: totalNum }],
    }
  })
}

export const useCommerceStore = defineStore('commerce', () => {
  const products = ref<Product[]>(productNames.map((name, i) => {
    const inv = i < 3 ? 0 : Math.floor(Math.random() * 500) + 5
    const price = (Math.random() * 450 + 15).toFixed(2)
    return {
      id: 1000 + i,
      name,
      sku: `SKU-${String(10000 + i).padStart(5, '0')}`,
      price,
      compareAtPrice: (parseFloat(price) * 1.2).toFixed(2),
      inventory: inv,
      category: categories[i % categories.length]!,
      status: stockStatus(inv),
      vendor: VENDORS[i % VENDORS.length]!,
      images: 1,
      variants: Math.floor(Math.random() * 4) + 1,
      type: 'product',
      publishStatus: 'Published',
    }
  }))

  // ── Product CRUD (mock-persistent) ───────────────────────────────
  function nextProductId(): number {
    return products.value.reduce((max, p) => Math.max(max, p.id), 999) + 1
  }

  /** Create a product or kit from a full-page wizard payload. */
  function createProduct(input: ProductDraftInput): Product {
    const id = nextProductId()
    const price = input.price || '0.00'
    const product: Product = {
      id,
      name: input.name,
      sku: input.sku || `SKU-${String(10000 + (id % 90000)).padStart(5, '0')}`,
      price,
      compareAtPrice: (parseFloat(price) * 1.2).toFixed(2),
      inventory: input.inventory,
      category: input.category,
      status: stockStatus(input.inventory),
      vendor: input.vendor || '—',
      images: 1,
      variants: input.variants,
      type: input.type,
      publishStatus: input.publishStatus,
      detail: input.detail,
      components: input.components,
    }
    products.value.unshift(product)
    useOnboardingStore().complete('first-product')
    return product
  }

  /** Overwrite an existing product/kit with a full wizard payload. */
  function updateProductDraft(id: number, input: ProductDraftInput): void {
    const product = products.value.find((p) => p.id === id)
    if (!product) return
    product.name = input.name
    product.sku = input.sku || product.sku
    product.category = input.category
    product.vendor = input.vendor || '—'
    product.price = input.price || '0.00'
    product.compareAtPrice = (parseFloat(input.price || '0') * 1.2).toFixed(2)
    product.inventory = input.inventory
    product.status = stockStatus(input.inventory)
    product.variants = input.variants
    product.type = input.type
    product.publishStatus = input.publishStatus
    product.detail = input.detail
    product.components = input.components
  }

  function duplicateProduct(id: number): Product | undefined {
    const source = products.value.find((p) => p.id === id)
    if (!source) return undefined
    const newId = products.value.reduce((max, p) => Math.max(max, p.id), 999) + 1
    const clone: Product = { ...source, id: newId, name: `${source.name} (Copy)`, sku: `${source.sku}-COPY` }
    const index = products.value.findIndex((p) => p.id === id)
    products.value.splice(index + 1, 0, clone)
    return clone
  }

  function deleteProduct(id: number): void {
    products.value = products.value.filter((p) => p.id !== id)
  }

  function deleteProducts(ids: number[]): void {
    const remove = new Set(ids)
    products.value = products.value.filter((p) => !remove.has(p.id))
  }

  // ── Inventory slice (mock-persistent) ────────────────────────────
  const inventory = ref<InventoryItem[]>(products.value.map((p, i) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    inventory: p.inventory,
    incoming: (i * 37) % 500,
    location: LOCATIONS[i % LOCATIONS.length]!,
    status: p.status,
  })))

  function adjustStock(id: number, newCount: number): void {
    const item = inventory.value.find((i) => i.id === id)
    if (!item) return
    item.inventory = Math.max(0, newCount)
    item.status = stockStatus(item.inventory)
  }

  function transferStock(id: number, toLocation: string): void {
    const item = inventory.value.find((i) => i.id === id)
    if (item) item.location = toLocation
  }

  const orders = ref<Order[]>(Array.from({ length: 30 }, (_, i) => {
    const fName = customerFirstNames[i % customerFirstNames.length]!
    const lName = customerLastNames[i % customerLastNames.length]!
    const customerName = `${fName} ${lName}`
    const itemCount = Math.floor(Math.random() * 5) + 1
    const subtotal = (Math.random() * 980 + 45).toFixed(2)
    const shipping = (Math.random() * 25 + 4.99).toFixed(2)
    const total = (parseFloat(subtotal) + parseFloat(shipping)).toFixed(2)
    const status = orderStatuses[i % orderStatuses.length]!
    const fulfillmentStatus = fulfillmentStatuses[i % fulfillmentStatuses.length]!
    const trackingNum = `1Z${Math.random().toString(36).substring(2, 11).toUpperCase()}`
    const city = cities[i % cities.length]!
    const date = new Date(Date.now() - (i * 86400000 * 1.2)).toISOString().split('T')[0]!
    const shipped = fulfillmentStatus === 'Shipped'
    const paymentStatus = status === 'Refunded' ? 'Refunded' : status === 'Cancelled' ? 'Voided' : 'Paid'
    // Map queue state onto the detail step indicator
    const fulfillmentStage: FulfillmentStage = shipped ? 'Shipped'
      : fulfillmentStatus === 'Ready For Fulfillment' ? 'Carrier'
      : fulfillmentStatus === 'Not Ready' ? 'Picked' : 'Pack'

    const timeline: OrderTimelineEvent[] = [
      { id: 1, kind: 'event', text: `Order placed via ${WEB_SEED_CHANNELS[i % WEB_SEED_CHANNELS.length]}`, date },
    ]
    if (paymentStatus === 'Paid') timeline.push({ id: 2, kind: 'event', text: `Payment of $${total} captured (${paymentMethods[i % paymentMethods.length]})`, date })
    if (shipped) timeline.push({ id: 3, kind: 'event', text: `Shipped via ${['UPS', 'FedEx', 'USPS', 'DHL'][i % 4]} — tracking ${trackingNum}`, date })
    if (status === 'Cancelled') timeline.push({ id: 4, kind: 'event', text: 'Order cancelled', date })
    if (status === 'Refunded') timeline.push({ id: 5, kind: 'event', text: `Refund of $${total} issued`, date })

    return {
      id: i + 1,
      orderNumber: `#${10000 + i}`,
      customer: { name: customerName, email: `${fName.toLowerCase()}.${lName.toLowerCase()}@email.com`, avatar: `${fName[0]}${lName[0]}` },
      city,
      itemCount,
      subtotal,
      shipping,
      total,
      status,
      fulfillmentStatus,
      paymentStatus,
      paymentMethod: paymentMethods[i % paymentMethods.length]!,
      paymentReference: `pay_${String(910000 + i * 731)}`,
      paymentCapturedAt: paymentStatus === 'Paid' || paymentStatus === 'Refunded' ? date : null,
      trackingNumber: shipped ? trackingNum : null,
      courier: shipped ? ['UPS', 'FedEx', 'USPS', 'DHL'][i % 4]! : null,
      date,
      lineItems: Array.from({ length: itemCount }, (_, j): OrderLineItem => ({
        product: productNames[(i + j) % productNames.length]!,
        sku: `SKU-${String(10000 + (i + j) % productNames.length).padStart(5, '0')}`,
        qty: Math.floor(Math.random() * 3) + 1,
        price: (Math.random() * 150 + 10).toFixed(2),
        status: shipped ? 'Shipped' : status === 'Cancelled' ? 'Cancelled' : 'Processing',
        coupon: (i + j) % 6 === 0 ? 'WELCOME20' : null,
        discountPct: (i + j) % 6 === 0 ? 20 : 0,
      })),
      notes: i % 7 === 0 ? 'Customer requested gift wrapping.' : null,
      tags: pickOrderTags(i),
      salesChannel: WEB_SEED_CHANNELS[i % WEB_SEED_CHANNELS.length]!,
      currency: 'USD',
      region: city.split(', ')[1] ?? '—',
      country: 'United States',
      phone: `+1 (${200 + (i * 13) % 700}) 555-${String(1000 + i * 41).slice(-4)}`,
      shippingAddress: buildAddress(customerName, city, i),
      billingAddress: buildAddress(customerName, city, i + 3),
      fulfillmentStage,
      fulfilledFromLocation: WAREHOUSE_LOCATIONS[i % WAREHOUSE_LOCATIONS.length]!,
      timeline,
      ...channelIdentity(WEB_SEED_CHANNELS[i % WEB_SEED_CHANNELS.length]!),
    }
  }).concat(buildPosOrders()))

  // ── Order actions (mock-persistent) ──────────────────────────────
  function getOrderById(id: number): Order | undefined {
    return orders.value.find((o) => o.id === id)
  }

  /** Orders taken at a register — the retail transactions log. */
  const posOrders = computed(() => orders.value.filter((o) => o.channelType === 'offline_store'))

  /** Record a sale rung up at a register. */
  function addPosOrder(payload: {
    locationId: string
    registerId: string
    staffId: string
    customerName?: string
    total: number
    tender: TenderType
    itemCount: number
    lines?: Array<{ sku: string; name: string; qty: number; price: number }>
  }): Order {
    const nextId = orders.value.reduce((max, o) => Math.max(max, o.id), 0) + 1
    const name = payload.customerName ?? 'Walk-in customer'
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    const date = new Date().toISOString().split('T')[0]!
    const subtotal = (payload.total / 1.1).toFixed(2)

    const order: Order = {
      id: nextId,
      orderNumber: `POS-${12100 + posOrders.value.length}`,
      customer: { name, email: '—', avatar: initials },
      city: '—',
      itemCount: payload.itemCount,
      subtotal,
      shipping: '0.00',
      total: payload.total.toFixed(2),
      status: 'Completed',
      fulfillmentStatus: 'Shipped',
      paymentStatus: 'Paid',
      paymentMethod: TENDER_LABELS[payload.tender],
      paymentReference: `pos_${Date.now()}`,
      paymentCapturedAt: date,
      trackingNumber: null,
      courier: null,
      date,
      lineItems: (payload.lines ?? []).map((l): OrderLineItem => ({
        product: l.name,
        sku: l.sku,
        qty: l.qty,
        price: l.price.toFixed(2),
        status: 'Shipped',
        coupon: null,
        discountPct: 0,
      })),
      notes: null,
      tags: [],
      salesChannel: 'POS',
      currency: 'USD',
      region: '—',
      country: '—',
      phone: '—',
      shippingAddress: buildAddress(name, '—', nextId),
      billingAddress: buildAddress(name, '—', nextId),
      fulfillmentStage: 'Shipped',
      fulfilledFromLocation: payload.locationId,
      timeline: [
        { id: 1, kind: 'event', text: `Sold in store — register ${payload.registerId}`, date },
        { id: 2, kind: 'event', text: `Payment of $${payload.total.toFixed(2)} taken (${TENDER_LABELS[payload.tender]})`, date },
      ],
      channelType: 'offline_store',
      channelId: 'pos-store',
      pos: {
        locationId: payload.locationId,
        registerId: payload.registerId,
        staffId: payload.staffId,
        origin: 'in_store',
        hasReceipt: true,
      },
      tenders: [{ type: payload.tender, amount: payload.total }],
    }
    orders.value.unshift(order)
    return order
  }

  function refundPosOrder(id: number): void {
    const order = getOrderById(id)
    if (!order || order.status === 'Refunded') return
    order.status = 'Refunded'
    order.paymentStatus = 'Refunded'
    order.total = (-Math.abs(parseFloat(order.total))).toFixed(2)
    logOrderEvent(order, `Refund of $${Math.abs(parseFloat(order.total)).toFixed(2)} issued at the register`)
  }

  function voidPosOrder(id: number): void {
    const order = getOrderById(id)
    if (!order || order.status === 'Cancelled') return
    order.status = 'Cancelled'
    order.paymentStatus = 'Voided'
    order.fulfillmentStatus = 'Cancelled'
    order.total = '0.00'
    logOrderEvent(order, 'Sale voided at the register')
  }

  function logOrderEvent(order: Order, text: string, kind: 'note' | 'event' = 'event'): void {
    const nextId = order.timeline.reduce((max, e) => Math.max(max, e.id), 0) + 1
    order.timeline.push({ id: nextId, kind, text, date: new Date().toISOString().split('T')[0]! })
  }

  /** Append an internal note to the order timeline. */
  function addOrderNote(id: number, text: string): void {
    const order = getOrderById(id)
    if (order && text.trim()) logOrderEvent(order, text.trim(), 'note')
  }

  function setOrderTags(id: number, tags: string[]): void {
    const order = getOrderById(id)
    if (order) order.tags = [...tags]
  }

  function updateOrderAddress(id: number, which: 'shipping' | 'billing', address: OrderAddress): void {
    const order = getOrderById(id)
    if (!order) return
    if (which === 'shipping') order.shippingAddress = { ...address }
    else order.billingAddress = { ...address }
    logOrderEvent(order, `${which === 'shipping' ? 'Shipping' : 'Billing'} address updated`)
  }

  function cancelOrder(id: number): void {
    const order = getOrderById(id)
    if (!order || order.status === 'Cancelled') return
    order.status = 'Cancelled'
    order.fulfillmentStatus = 'Cancelled'
    order.lineItems.forEach((li) => { li.status = 'Cancelled' })
    logOrderEvent(order, 'Order cancelled')
  }

  function cancelOrders(ids: number[]): void {
    ids.forEach(cancelOrder)
  }

  function refundOrder(id: number, amount: string, reason: string): void {
    const order = getOrderById(id)
    if (!order) return
    order.paymentStatus = 'Refunded'
    logOrderEvent(order, `Refund of $${amount} issued${reason ? ` — ${reason}` : ''}`)
  }

  function markOrderFulfilled(id: number): void {
    const order = getOrderById(id)
    if (!order || order.fulfillmentStatus === 'Shipped') return
    order.fulfillmentStatus = 'Shipped'
    order.fulfillmentStage = 'Shipped'
    order.lineItems.forEach((li) => { li.status = 'Shipped' })
    if (!order.trackingNumber) {
      order.trackingNumber = `1Z${Math.random().toString(36).substring(2, 11).toUpperCase()}`
      order.courier = 'UPS'
    }
    logOrderEvent(order, `Marked fulfilled — tracking ${order.trackingNumber}`)
  }

  function markOrdersFulfilled(ids: number[]): void {
    ids.forEach(markOrderFulfilled)
  }

  const promotions = ref<Promotion[]>([
    { id: 1, title: 'Welcome offer', method: 'Order', mechanism: 'Code', code: 'WELCOME20', discountType: 'Percentage', value: 20, salesChannels: ['Online Store'], startDate: '2026-01-01', endDate: '2026-06-30', usage: 342, limit: 1000, status: 'Active' },
    { id: 2, title: 'Free shipping over $75', description: 'Waives shipping on qualifying orders.', method: 'Order', mechanism: 'Automatic', discountType: 'Fixed', value: 0, salesChannels: ['Online Store', 'POS'], startDate: '2026-01-01', usage: 1204, limit: null, status: 'Active' },
    { id: 3, title: 'Black Friday 50', method: 'Order', mechanism: 'Code', code: 'BLACKFRI50', discountType: 'Percentage', value: 50, salesChannels: ['Online Store'], startDate: '2025-11-01', endDate: '2025-11-30', usage: 8921, limit: 10000, status: 'Inactive' },
    { id: 4, title: 'Summer save 15', method: 'Product', mechanism: 'Automatic', discountType: 'Percentage', value: 15, salesChannels: ['Online Store', 'Instagram Shop'], startDate: '2026-06-01', endDate: '2026-08-31', usage: 567, limit: 500, status: 'Active' },
    { id: 5, title: 'VIP $30 off', method: 'Order', mechanism: 'Code', code: 'VIP30OFF', discountType: 'Fixed', value: 30, salesChannels: ['Online Store'], startDate: '2026-01-01', endDate: '2026-12-31', usage: 89, limit: 200, status: 'Active' },
    { id: 6, title: 'New user $10 off', method: 'Order', mechanism: 'Code', code: 'NEWUSER10', discountType: 'Fixed', value: 10, salesChannels: ['Online Store', 'Amazon'], startDate: '2026-01-01', endDate: '2026-03-31', usage: 2341, limit: null, status: 'Active' },
    { id: 7, title: 'Loyalty 25', method: 'Product', mechanism: 'Code', code: 'LOYALTY25', discountType: 'Percentage', value: 25, salesChannels: ['Online Store'], startDate: '2026-01-01', endDate: '2026-09-30', usage: 156, limit: 500, status: 'Active' },
    { id: 8, title: 'Flash $5 off', method: 'Order', mechanism: 'Code', code: 'FLASH5', discountType: 'Fixed', value: 5, salesChannels: ['Online Store'], startDate: '2025-01-01', endDate: '2025-12-31', usage: 4523, limit: 5000, status: 'Inactive' },
    { id: 9, title: 'Refer a friend', method: 'Order', mechanism: 'Code', code: 'REFER20', discountType: 'Percentage', value: 20, salesChannels: ['Online Store', 'POS'], startDate: '2026-01-01', usage: 234, limit: null, status: 'Active' },
    { id: 10, title: 'Holiday 40', method: 'Product', mechanism: 'Code', code: 'HOLIDAY40', discountType: 'Percentage', value: 40, salesChannels: ['Online Store'], startDate: '2026-11-01', endDate: '2026-12-25', usage: 12, limit: 300, status: 'Active' },
    { id: 11, title: 'Bundle save', method: 'Product', mechanism: 'Automatic', discountType: 'Fixed', value: 25, salesChannels: ['Online Store', 'eBay'], startDate: '2026-01-01', endDate: '2026-06-30', usage: 78, limit: 200, status: 'Active' },
    { id: 12, title: 'Spring 10', method: 'Order', mechanism: 'Code', code: 'SPRING10', discountType: 'Percentage', value: 10, salesChannels: ['Online Store'], startDate: '2026-03-01', endDate: '2026-05-31', usage: 892, limit: null, status: 'Active' },
  ])

  function nextPromotionId(): number {
    return promotions.value.reduce((max, p) => Math.max(max, p.id), 0) + 1
  }

  function createPromotion(input: PromotionInput): Promotion {
    const promotion: Promotion = {
      id: nextPromotionId(),
      title: input.title,
      description: input.description,
      method: input.method,
      mechanism: input.mechanism,
      code: input.mechanism === 'Code' ? input.code : undefined,
      discountType: input.discountType,
      value: input.value,
      salesChannels: [...input.salesChannels],
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      usage: 0,
      limit: input.limit ?? null,
    }
    promotions.value.unshift(promotion)
    return promotion
  }

  function updatePromotion(id: number, input: PromotionInput): void {
    const promotion = promotions.value.find((p) => p.id === id)
    if (!promotion) return
    promotion.title = input.title
    promotion.description = input.description
    promotion.method = input.method
    promotion.mechanism = input.mechanism
    promotion.code = input.mechanism === 'Code' ? input.code : undefined
    promotion.discountType = input.discountType
    promotion.value = input.value
    promotion.salesChannels = [...input.salesChannels]
    promotion.startDate = input.startDate
    promotion.endDate = input.endDate
    promotion.status = input.status
    promotion.limit = input.limit ?? null
  }

  function duplicatePromotion(id: number): Promotion | undefined {
    const source = promotions.value.find((p) => p.id === id)
    if (!source) return undefined
    const index = promotions.value.findIndex((p) => p.id === id)
    const clone: Promotion = { ...source, id: nextPromotionId(), title: `${source.title} (Copy)`, code: source.code ? `${source.code}COPY` : undefined, usage: 0 }
    promotions.value.splice(index + 1, 0, clone)
    return clone
  }

  function setPromotionStatus(id: number, status: PromotionStatus): void {
    const promotion = promotions.value.find((p) => p.id === id)
    if (promotion) promotion.status = status
  }

  function deletePromotion(id: number): void {
    promotions.value = promotions.value.filter((p) => p.id !== id)
  }

  function deletePromotions(ids: number[]): void {
    const remove = new Set(ids)
    promotions.value = promotions.value.filter((p) => !remove.has(p.id))
  }

  // Fulfillment queue — one entry per order being fulfilled (orderId links to `orders`)
  const fulfillments = ref<FulfillmentQueueItem[]>(Array.from({ length: 18 }, (_, i) => {
    const orderId = (i % 30) + 1
    const source = orders.value.find((o) => o.id === orderId)!
    return {
      id: i + 1,
      orderId,
      orderNumber: source.orderNumber,
      customer: source.customer.name,
      location: WAREHOUSE_LOCATIONS[i % WAREHOUSE_LOCATIONS.length]!,
      status: FULFILLMENT_QUEUE_STATUSES[i % FULFILLMENT_QUEUE_STATUSES.length]!,
      paymentStatus: source.paymentStatus,
      orderStatus: source.status,
      salesChannel: source.salesChannel,
      productQty: source.lineItems.reduce((sum, li) => sum + li.qty, 0),
      total: source.total,
      createdAt: new Date(Date.now() - (i * 43200000)).toISOString().split('T')[0]!,
      trackingNumber: i % FULFILLMENT_QUEUE_STATUSES.length === 3 ? source.trackingNumber : null,
    }
  }))

  // ── Fulfillment actions (mock-persistent) ────────────────────────
  /** Move a fulfillment one stage forward: Picked → Packed → Label Created → Shipped. */
  function advanceFulfillment(id: number): void {
    const item = fulfillments.value.find((f) => f.id === id)
    if (!item) return
    const index = FULFILLMENT_QUEUE_STATUSES.indexOf(item.status)
    if (index < 0 || index >= FULFILLMENT_QUEUE_STATUSES.length - 1) return
    const next = FULFILLMENT_QUEUE_STATUSES[index + 1]!
    item.status = next
    if (next === 'Shipped') markShipped([id])
  }

  /** Mark fulfillments shipped (with optional tracking number) and sync their orders. */
  function markShipped(ids: number[], trackingNumber?: string): void {
    for (const id of ids) {
      const item = fulfillments.value.find((f) => f.id === id)
      if (!item) continue
      item.status = 'Shipped'
      if (trackingNumber) item.trackingNumber = trackingNumber
      const order = getOrderById(item.orderId)
      if (order && order.fulfillmentStatus !== 'Shipped') {
        order.fulfillmentStatus = 'Shipped'
        order.fulfillmentStage = 'Shipped'
        if (trackingNumber) order.trackingNumber = trackingNumber
        logOrderEvent(order, `Shipped from ${item.location}${trackingNumber ? ` — tracking ${trackingNumber}` : ''}`)
      }
      if (!item.trackingNumber) item.trackingNumber = order?.trackingNumber ?? null
    }
  }

  const draftOrders = ref<DraftOrder[]>(Array.from({ length: 8 }, (_, i) => {
    const fName = customerFirstNames[(i + 15) % customerFirstNames.length]!
    const lName = customerLastNames[(i + 15) % customerLastNames.length]!
    const customerName = `${fName} ${lName}`
    const lineItems: DraftLineItem[] = Array.from({ length: (i % 3) + 1 }, (_, j) => {
      const productIndex = (i * 3 + j) % productNames.length
      return {
        id: j + 1,
        name: productNames[productIndex]!,
        sku: `SKU-${String(10000 + productIndex).padStart(5, '0')}`,
        price: Math.round((Math.random() * 180 + 20) * 100) / 100,
        qty: (j % 2) + 1,
        custom: false,
      }
    })
    const shippingMethod = ['Standard', 'Express', 'Free'][i % 3]!
    const discount = { type: 'None', value: 0 }
    return {
      id: i + 1,
      draftNumber: `D-${500 + i}`,
      customer: customerName,
      email: `${fName.toLowerCase()}@example.com`,
      phone: `+1 (${300 + (i * 17) % 600}) 555-${String(2000 + i * 53).slice(-4)}`,
      salesChannel: WEB_SEED_CHANNELS[i % WEB_SEED_CHANNELS.length]!,
      items: lineItems.length,
      lineItems,
      total: draftOrderTotal({ lineItems, discount, shippingMethod }).toFixed(2),
      status: ['Open', 'Invoice Sent', 'Invoice Sent'][i % 3]!,
      createdAt: new Date(Date.now() - (i * 86400000 * 2)).toISOString().split('T')[0]!,
      shippingAddress: buildAddress(customerName, cities[(i + 4) % cities.length]!, i + 20),
      billingAddress: null,
      shippingMethod,
      discount,
      notes: '',
    }
  }))

  // ── Draft-order actions (mock-persistent) ────────────────────────
  function nextDraftId(): number {
    return draftOrders.value.reduce((max, d) => Math.max(max, d.id), 0) + 1
  }

  function createDraftOrder(input: DraftOrderInput): DraftOrder {
    const id = nextDraftId()
    const draft: DraftOrder = {
      id,
      draftNumber: `D-${499 + id}`,
      customer: input.customer,
      email: input.email,
      phone: input.phone,
      salesChannel: input.salesChannel,
      items: input.lineItems.length,
      lineItems: input.lineItems.map((li) => ({ ...li })),
      total: draftOrderTotal(input).toFixed(2),
      status: 'Open',
      createdAt: new Date().toISOString().split('T')[0]!,
      shippingAddress: input.shippingAddress ? { ...input.shippingAddress } : null,
      billingAddress: input.billingAddress ? { ...input.billingAddress } : null,
      shippingMethod: input.shippingMethod,
      discount: { ...input.discount },
      notes: input.notes,
    }
    draftOrders.value.unshift(draft)
    return draft
  }

  function updateDraftOrder(id: number, input: DraftOrderInput): void {
    const draft = draftOrders.value.find((d) => d.id === id)
    if (!draft) return
    draft.customer = input.customer
    draft.email = input.email
    draft.phone = input.phone
    draft.salesChannel = input.salesChannel
    draft.items = input.lineItems.length
    draft.lineItems = input.lineItems.map((li) => ({ ...li }))
    draft.total = draftOrderTotal(input).toFixed(2)
    draft.shippingAddress = input.shippingAddress ? { ...input.shippingAddress } : null
    draft.billingAddress = input.billingAddress ? { ...input.billingAddress } : null
    draft.shippingMethod = input.shippingMethod
    draft.discount = { ...input.discount }
    draft.notes = input.notes
  }

  function setDraftOrderStatus(id: number, status: string): void {
    const draft = draftOrders.value.find((d) => d.id === id)
    if (draft) draft.status = status
  }

  function deleteDraftOrders(ids: number[]): void {
    const remove = new Set(ids)
    draftOrders.value = draftOrders.value.filter((d) => !remove.has(d.id))
  }

  /** Convert a draft to a real sales order (Mark as Paid); removes the draft. */
  function convertDraftToOrder(id: number): Order | undefined {
    const draft = draftOrders.value.find((d) => d.id === id)
    if (!draft) return undefined
    const orderId = orders.value.reduce((max, o) => Math.max(max, o.id), 0) + 1
    const nameParts = draft.customer.trim().split(/\s+/)
    const avatar = `${nameParts[0]?.[0] ?? '?'}${nameParts[1]?.[0] ?? ''}`
    const subtotal = draft.lineItems.reduce((sum, li) => sum + li.price * li.qty, 0)
    const shipping = draft.lineItems.length ? (SHIPPING_RATES[draft.shippingMethod] ?? 0) : 0
    const today = new Date().toISOString().split('T')[0]!
    const address = draft.shippingAddress ?? buildAddress(draft.customer, cities[orderId % cities.length]!, orderId)
    const order: Order = {
      id: orderId,
      orderNumber: `#${10000 + orderId - 1}`,
      customer: { name: draft.customer, email: draft.email, avatar },
      city: `${address.city}, ${address.region}`,
      itemCount: draft.lineItems.length,
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      total: draft.total,
      status: 'Processing',
      fulfillmentStatus: 'Not Ready',
      paymentStatus: 'Paid',
      paymentMethod: 'Manual — Marked as Paid',
      paymentReference: `pay_${String(910000 + orderId * 731)}`,
      paymentCapturedAt: today,
      trackingNumber: null,
      courier: null,
      date: today,
      lineItems: draft.lineItems.map((li): OrderLineItem => ({
        product: li.name,
        sku: li.sku || '—',
        qty: li.qty,
        price: li.price.toFixed(2),
        status: 'Processing',
        coupon: null,
        discountPct: 0,
      })),
      notes: draft.notes || null,
      tags: [],
      salesChannel: draft.salesChannel,
      currency: 'USD',
      region: address.region || '—',
      country: address.country,
      phone: draft.phone,
      shippingAddress: { ...address },
      billingAddress: draft.billingAddress ? { ...draft.billingAddress } : { ...address },
      fulfillmentStage: 'Picked',
      fulfilledFromLocation: WAREHOUSE_LOCATIONS[orderId % WAREHOUSE_LOCATIONS.length]!,
      timeline: [
        { id: 1, kind: 'event', text: `Order placed via Draft Order ${draft.draftNumber}`, date: today },
        { id: 2, kind: 'event', text: `Payment of $${draft.total} captured (marked as paid)`, date: today },
      ],
      ...channelIdentity(draft.salesChannel),
    }
    orders.value.unshift(order)
    draftOrders.value = draftOrders.value.filter((d) => d.id !== id)
    return order
  }

  // Custom gift cards — merchant-issued cards with a redeemable balance
  const customGiftCards = ref<CustomGiftCard[]>([
    { id: 1, code: 'GC-4KQ9-7XZ2-1MPL', contact: 'Emma Thompson', recipient: { name: 'Emma Thompson', email: 'emma.thompson@email.com' }, initialValue: 100, balance: 62.50, expiration: 'date', status: 'Active', issued: '2026-05-12', expiry: '2027-05-12', lastUsed: '2026-06-28' },
    { id: 2, code: 'GC-8HTP-3RN6-9WQZ', contact: 'Liam Martinez', recipient: { name: 'Liam Martinez', email: 'liam.martinez@email.com' }, initialValue: 50, balance: 50, expiration: 'date', status: 'Active', issued: '2026-06-01', expiry: '2027-06-01', lastUsed: null },
    { id: 3, code: 'GC-2LMD-5FKC-7VBX', contact: 'Olivia Johnson', recipient: { name: 'Olivia Johnson', email: 'olivia.johnson@email.com' }, initialValue: 250, balance: 0, expiration: 'date', status: 'Redeemed', issued: '2026-02-18', expiry: '2027-02-18', lastUsed: '2026-05-03' },
    { id: 4, code: 'GC-9QWE-1TYU-4OPA', contact: '—', recipient: { name: 'Noah Williams', email: 'noah.williams@email.com' }, initialValue: 75, balance: 25.00, expiration: 'date', status: 'Active', issued: '2026-04-22', expiry: '2027-04-22', lastUsed: '2026-06-15' },
    { id: 5, code: 'GC-6ZXC-8VBN-2MKL', contact: 'Ava Brown', recipient: { name: 'Ava Brown', email: 'ava.brown@email.com' }, initialValue: 200, balance: 0, expiration: 'date', status: 'Redeemed', issued: '2025-12-10', expiry: '2026-12-10', lastUsed: '2026-03-19' },
    { id: 6, code: 'GC-3RTY-7UIO-5PAS', contact: 'Ethan Davis', recipient: { name: 'Ethan Davis', email: 'ethan.davis@email.com' }, initialValue: 500, balance: 340.00, expiration: 'none', status: 'Active', issued: '2026-05-30', expiry: null, lastUsed: '2026-06-27' },
    { id: 7, code: 'GC-1QAZ-2WSX-3EDC', contact: '—', recipient: { name: 'Mia Miller', email: 'mia.miller@email.com' }, initialValue: 100, balance: 100, expiration: 'none', status: 'Active', issued: '2026-06-25', expiry: null, lastUsed: null },
    { id: 8, code: 'GC-4RFV-5TGB-6YHN', contact: 'Lucas Wilson', recipient: { name: 'Lucas Wilson', email: 'lucas.wilson@email.com' }, initialValue: 25, balance: 25, expiration: 'date', status: 'Expired', issued: '2024-01-15', expiry: '2025-01-15', lastUsed: null },
    { id: 9, code: 'GC-7UJM-8IK9-0OL1', contact: 'Charlotte Moore', recipient: { name: 'Charlotte Moore', email: 'charlotte.moore@email.com' }, initialValue: 150, balance: 88.75, expiration: 'date', status: 'Active', issued: '2026-03-08', expiry: '2027-03-08', lastUsed: '2026-06-20' },
    { id: 10, code: 'GC-2EDC-3RFV-4TGB', contact: '—', recipient: { name: 'Aiden Taylor', email: 'aiden.taylor@email.com' }, initialValue: 50, balance: 0, expiration: 'date', status: 'Disabled', issued: '2026-01-30', expiry: '2027-01-30', lastUsed: null },
    { id: 11, code: 'GC-5TGB-6YHN-7UJM', contact: 'Amelia Jackson', recipient: { name: 'Amelia Jackson', email: 'amelia.jackson@email.com' }, initialValue: 300, balance: 210.00, expiration: 'none', status: 'Active', issued: '2026-04-11', expiry: null, lastUsed: '2026-06-12' },
    { id: 12, code: 'GC-8IKL-9OP0-1QAZ', contact: 'Jackson White', recipient: { name: 'Jackson White', email: 'jackson.white@email.com' }, initialValue: 40, balance: 12.30, expiration: 'date', status: 'Active', issued: '2026-05-19', expiry: '2027-05-19', lastUsed: '2026-06-29' },
  ])

  function generateGiftCardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const group = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `GC-${group()}-${group()}-${group()}`
  }

  function nextGiftCardId(): number {
    return customGiftCards.value.reduce((max, c) => Math.max(max, c.id), 0) + 1
  }

  function issueGiftCard(input: GiftCardInput): CustomGiftCard {
    const today = new Date().toISOString().split('T')[0]!
    const card: CustomGiftCard = {
      id: nextGiftCardId(),
      code: generateGiftCardCode(),
      contact: input.contact?.trim() || '—',
      recipient: { name: input.contact?.trim() || '—', email: input.email },
      initialValue: input.initialValue,
      balance: input.initialValue,
      message: input.message,
      expiration: input.expiration,
      status: input.status,
      issued: today,
      expiry: input.expiration === 'date' ? (input.expiry ?? null) : null,
      lastUsed: null,
      image: input.image,
    }
    customGiftCards.value.unshift(card)
    return card
  }

  function updateGiftCard(id: number, input: GiftCardInput): void {
    const card = customGiftCards.value.find((c) => c.id === id)
    if (!card) return
    card.contact = input.contact?.trim() || '—'
    card.recipient = { name: input.contact?.trim() || card.recipient.name, email: input.email }
    card.initialValue = input.initialValue
    card.message = input.message
    card.expiration = input.expiration
    card.status = input.status
    card.expiry = input.expiration === 'date' ? (input.expiry ?? null) : null
    card.image = input.image
  }

  function disableGiftCard(id: number): void {
    const card = customGiftCards.value.find((c) => c.id === id)
    if (card) card.status = 'Disabled'
  }

  function deleteGiftCards(ids: number[]): void {
    const remove = new Set(ids)
    customGiftCards.value = customGiftCards.value.filter((c) => !remove.has(c.id))
  }

  // Purchasable gift cards — gift-card products sold on the storefront
  const purchasableGiftCards = ref<PurchasableGiftCard[]>([
    { id: 1, name: 'Digital Gift Card', slug: 'digital-gift-card', kind: 'Digital', denominations: [25, 50, 100, 200], sold: 1240, revenue: 86420, status: 'Active', created: '2025-11-02', taxCategory: 'Standard', brand: 'Acme Corp', tags: ['Featured'], collections: [] },
    { id: 2, name: 'Birthday eGift Card', slug: 'birthday-egift-card', kind: 'Digital', denominations: [25, 50, 100], sold: 512, revenue: 28900, status: 'Active', created: '2026-01-15', taxCategory: 'Standard', brand: 'Acme Corp', tags: ['Seasonal'], collections: [] },
    { id: 3, name: 'Holiday Gift Card', slug: 'holiday-gift-card', kind: 'Digital', denominations: [50, 100, 150, 250], sold: 2103, revenue: 174300, status: 'Active', created: '2025-10-20', taxCategory: 'Standard', brand: 'Brand House', tags: ['Seasonal', 'Sale'], collections: [] },
    { id: 4, name: 'Physical Gift Card', slug: 'physical-gift-card', kind: 'Physical', denominations: [25, 50, 100], sold: 348, revenue: 21750, status: 'Active', created: '2025-09-08', taxCategory: 'Standard', brand: 'Acme Corp', tags: [], collections: [] },
    { id: 5, name: 'Thank You Gift Card', slug: 'thank-you-gift-card', kind: 'Digital', denominations: [20, 40, 60], sold: 87, revenue: 3480, status: 'Draft', created: '2026-06-30', taxCategory: 'Standard', brand: 'Local Artisan', tags: [], collections: [] },
    { id: 6, name: 'Corporate Bulk Gift Card', slug: 'corporate-bulk-gift-card', kind: 'Digital', denominations: [100, 250, 500, 1000], sold: 64, revenue: 41200, status: 'Archived', created: '2025-06-14', taxCategory: 'Standard', brand: 'Global Goods', tags: ['Clearance'], collections: [] },
  ])

  function nextPurchasableGiftCardId(): number {
    return purchasableGiftCards.value.reduce((max, p) => Math.max(max, p.id), 0) + 1
  }

  function createPurchasableGiftCard(input: PurchasableGiftCardInput): PurchasableGiftCard {
    const today = new Date().toISOString().split('T')[0]!
    const product: PurchasableGiftCard = {
      id: nextPurchasableGiftCardId(),
      name: input.name,
      slug: input.slug,
      kind: input.kind,
      message: input.message,
      denominations: [...input.denominations],
      sold: 0,
      revenue: 0,
      status: input.status,
      created: today,
      taxCategory: input.taxCategory,
      brand: input.brand,
      tags: [...input.tags],
      collections: [...input.collections],
    }
    purchasableGiftCards.value.unshift(product)
    return product
  }

  function updatePurchasableGiftCard(id: number, input: PurchasableGiftCardInput): void {
    const product = purchasableGiftCards.value.find((p) => p.id === id)
    if (!product) return
    product.name = input.name
    product.slug = input.slug
    product.kind = input.kind
    product.message = input.message
    product.denominations = [...input.denominations]
    product.status = input.status
    product.taxCategory = input.taxCategory
    product.brand = input.brand
    product.tags = [...input.tags]
    product.collections = [...input.collections]
  }

  function duplicatePurchasableGiftCard(id: number): PurchasableGiftCard | undefined {
    const source = purchasableGiftCards.value.find((p) => p.id === id)
    if (!source) return undefined
    const index = purchasableGiftCards.value.findIndex((p) => p.id === id)
    const clone: PurchasableGiftCard = { ...source, id: nextPurchasableGiftCardId(), name: `${source.name} (Copy)`, slug: `${source.slug}-copy`, sold: 0, revenue: 0, status: 'Draft' }
    purchasableGiftCards.value.splice(index + 1, 0, clone)
    return clone
  }

  function setPurchasableGiftCardStatus(id: number, status: PurchasableGiftCardStatus): void {
    const product = purchasableGiftCards.value.find((p) => p.id === id)
    if (product) product.status = status
  }

  function deletePurchasableGiftCards(ids: number[]): void {
    const remove = new Set(ids)
    purchasableGiftCards.value = purchasableGiftCards.value.filter((p) => !remove.has(p.id))
  }

  return {
    products, orders, promotions, fulfillments, draftOrders, customGiftCards, purchasableGiftCards,
    inventory,
    createProduct, updateProductDraft, duplicateProduct, deleteProduct, deleteProducts,
    adjustStock, transferStock,
    getOrderById, addOrderNote, setOrderTags, updateOrderAddress, cancelOrder, cancelOrders, refundOrder, markOrderFulfilled, markOrdersFulfilled,
    posOrders, addPosOrder, refundPosOrder, voidPosOrder,
    advanceFulfillment, markShipped,
    createDraftOrder, updateDraftOrder, setDraftOrderStatus, deleteDraftOrders, convertDraftToOrder,
    createPromotion, updatePromotion, duplicatePromotion, setPromotionStatus, deletePromotion, deletePromotions,
    issueGiftCard, updateGiftCard, disableGiftCard, deleteGiftCards,
    createPurchasableGiftCard, updatePurchasableGiftCard, duplicatePurchasableGiftCard, setPurchasableGiftCardStatus, deletePurchasableGiftCards,
  }
})
