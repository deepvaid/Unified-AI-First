import { defineStore } from 'pinia'
import { ref } from 'vue'

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

/** Derive the stock chip status from an available-inventory count. */
function stockStatus(inv: number): string {
  return inv === 0 ? 'Out of Stock' : inv < 20 ? 'Low Stock' : 'In Stock'
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

  const orders = ref(Array.from({ length: 30 }, (_, i) => {
    const fName = customerFirstNames[i % customerFirstNames.length]!
    const lName = customerLastNames[i % customerLastNames.length]!
    const itemCount = Math.floor(Math.random() * 5) + 1
    const subtotal = (Math.random() * 980 + 45).toFixed(2)
    const shipping = (Math.random() * 25 + 4.99).toFixed(2)
    const total = (parseFloat(subtotal) + parseFloat(shipping)).toFixed(2)
    const status = orderStatuses[i % orderStatuses.length]
    const fulfillmentStatus = fulfillmentStatuses[i % fulfillmentStatuses.length]
    const trackingNum = `1Z${Math.random().toString(36).substring(2, 11).toUpperCase()}`

    return {
      id: i + 1,
      orderNumber: `#${10000 + i}`,
      customer: { name: `${fName} ${lName}`, email: `${fName.toLowerCase()}.${lName.toLowerCase()}@email.com`, avatar: `${fName[0]}${lName[0]}` },
      city: cities[i % cities.length],
      itemCount,
      subtotal,
      shipping,
      total,
      status,
      fulfillmentStatus,
      paymentStatus: status === 'Refunded' ? 'Refunded' : status === 'Cancelled' ? 'Voided' : 'Paid',
      paymentMethod: paymentMethods[i % paymentMethods.length],
      trackingNumber: fulfillmentStatus === 'Shipped' ? trackingNum : null,
      courier: fulfillmentStatus === 'Shipped' ? ['UPS', 'FedEx', 'USPS', 'DHL'][i % 4] : null,
      date: new Date(Date.now() - (i * 86400000 * 1.2)).toISOString().split('T')[0],
      lineItems: Array.from({ length: itemCount }, (_, j) => ({
        product: productNames[(i + j) % productNames.length],
        sku: `SKU-${String(10000 + (i + j) % productNames.length).padStart(5, '0')}`,
        qty: Math.floor(Math.random() * 3) + 1,
        price: (Math.random() * 150 + 10).toFixed(2),
      })),
      notes: i % 7 === 0 ? 'Customer requested gift wrapping.' : null,
    }
  }))

  const coupons = ref([
    { id: 1, code: 'WELCOME20', type: 'Percentage', value: 20, minOrder: 50, usage: 342, limit: 1000, expiry: '2026-06-30', status: 'Active' },
    { id: 2, code: 'FREESHIP', type: 'Free Shipping', value: 0, minOrder: 75, usage: 1204, limit: null, expiry: null, status: 'Active' },
    { id: 3, code: 'BLACKFRI50', type: 'Percentage', value: 50, minOrder: 100, usage: 8921, limit: 10000, expiry: '2025-11-30', status: 'Expired' },
    { id: 4, code: 'SUMMER15', type: 'Percentage', value: 15, minOrder: 0, usage: 567, limit: 500, expiry: '2026-08-31', status: 'Maxed Out' },
    { id: 5, code: 'VIP30OFF', type: 'Fixed Amount', value: 30, minOrder: 150, usage: 89, limit: 200, expiry: '2026-12-31', status: 'Active' },
    { id: 6, code: 'NEWUSER10', type: 'Fixed Amount', value: 10, minOrder: 0, usage: 2341, limit: null, expiry: '2026-03-31', status: 'Active' },
    { id: 7, code: 'LOYALTY25', type: 'Percentage', value: 25, minOrder: 200, usage: 156, limit: 500, expiry: '2026-09-30', status: 'Active' },
    { id: 8, code: 'FLASH5', type: 'Fixed Amount', value: 5, minOrder: 0, usage: 4523, limit: 5000, expiry: '2025-12-31', status: 'Expired' },
    { id: 9, code: 'REFER20', type: 'Percentage', value: 20, minOrder: 0, usage: 234, limit: null, expiry: null, status: 'Active' },
    { id: 10, code: 'HOLIDAY40', type: 'Percentage', value: 40, minOrder: 75, usage: 12, limit: 300, expiry: '2026-12-25', status: 'Active' },
    { id: 11, code: 'BUNDLESAVE', type: 'Fixed Amount', value: 25, minOrder: 120, usage: 78, limit: 200, expiry: '2026-06-30', status: 'Active' },
    { id: 12, code: 'SPRING10', type: 'Percentage', value: 10, minOrder: 0, usage: 892, limit: null, expiry: '2026-05-31', status: 'Active' },
  ])

  const fulfillments = ref(Array.from({ length: 18 }, (_, i) => {
    const fName = customerFirstNames[(i + 5) % customerFirstNames.length]!
    const lName = customerLastNames[(i + 5) % customerLastNames.length]!
    const statuses = ['Awaiting Fulfillment', 'Picking', 'Packed', 'Ready to Ship', 'Shipped']
    return {
      id: i + 1,
      orderNumber: `#${10015 + i}`,
      customer: `${fName} ${lName}`,
      items: Math.floor(Math.random() * 4) + 1,
      weight: `${(Math.random() * 5 + 0.3).toFixed(1)} lbs`,
      status: statuses[i % statuses.length],
      location: cities[i % cities.length],
      date: new Date(Date.now() - (i * 43200000)).toISOString().split('T')[0],
      priority: i < 3 ? 'High' : i < 8 ? 'Normal' : 'Low',
    }
  }))

  const draftOrders = ref(Array.from({ length: 8 }, (_, i) => {
    const fName = customerFirstNames[(i + 15) % customerFirstNames.length]!
    const lName = customerLastNames[(i + 15) % customerLastNames.length]!
    return {
      id: i + 1,
      draftNumber: `D-${500 + i}`,
      customer: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}@example.com`,
      items: Math.floor(Math.random() * 5) + 1,
      total: (Math.random() * 600 + 30).toFixed(2),
      status: ['Open', 'Invoice Sent', 'Invoice Sent'][i % 3],
      createdAt: new Date(Date.now() - (i * 86400000 * 2)).toISOString().split('T')[0],
    }
  }))

  // Custom gift cards — merchant-issued cards with a redeemable balance
  const customGiftCards = ref([
    { id: 1, code: 'GC-4KQ9-7XZ2-1MPL', recipient: { name: 'Emma Thompson', email: 'emma.thompson@email.com' }, initialValue: 100, balance: 62.50, status: 'Active', issued: '2026-05-12', expiry: '2027-05-12', lastUsed: '2026-06-28' },
    { id: 2, code: 'GC-8HTP-3RN6-9WQZ', recipient: { name: 'Liam Martinez', email: 'liam.martinez@email.com' }, initialValue: 50, balance: 50, status: 'Active', issued: '2026-06-01', expiry: '2027-06-01', lastUsed: null },
    { id: 3, code: 'GC-2LMD-5FKC-7VBX', recipient: { name: 'Olivia Johnson', email: 'olivia.johnson@email.com' }, initialValue: 250, balance: 0, status: 'Redeemed', issued: '2026-02-18', expiry: '2027-02-18', lastUsed: '2026-05-03' },
    { id: 4, code: 'GC-9QWE-1TYU-4OPA', recipient: { name: 'Noah Williams', email: 'noah.williams@email.com' }, initialValue: 75, balance: 25.00, status: 'Active', issued: '2026-04-22', expiry: '2027-04-22', lastUsed: '2026-06-15' },
    { id: 5, code: 'GC-6ZXC-8VBN-2MKL', recipient: { name: 'Ava Brown', email: 'ava.brown@email.com' }, initialValue: 200, balance: 0, status: 'Redeemed', issued: '2025-12-10', expiry: '2026-12-10', lastUsed: '2026-03-19' },
    { id: 6, code: 'GC-3RTY-7UIO-5PAS', recipient: { name: 'Ethan Davis', email: 'ethan.davis@email.com' }, initialValue: 500, balance: 340.00, status: 'Active', issued: '2026-05-30', expiry: '2027-05-30', lastUsed: '2026-06-27' },
    { id: 7, code: 'GC-1QAZ-2WSX-3EDC', recipient: { name: 'Mia Miller', email: 'mia.miller@email.com' }, initialValue: 100, balance: 100, status: 'Active', issued: '2026-06-25', expiry: '2027-06-25', lastUsed: null },
    { id: 8, code: 'GC-4RFV-5TGB-6YHN', recipient: { name: 'Lucas Wilson', email: 'lucas.wilson@email.com' }, initialValue: 25, balance: 25, status: 'Expired', issued: '2024-01-15', expiry: '2025-01-15', lastUsed: null },
    { id: 9, code: 'GC-7UJM-8IK9-0OL1', recipient: { name: 'Charlotte Moore', email: 'charlotte.moore@email.com' }, initialValue: 150, balance: 88.75, status: 'Active', issued: '2026-03-08', expiry: '2027-03-08', lastUsed: '2026-06-20' },
    { id: 10, code: 'GC-2EDC-3RFV-4TGB', recipient: { name: 'Aiden Taylor', email: 'aiden.taylor@email.com' }, initialValue: 50, balance: 0, status: 'Disabled', issued: '2026-01-30', expiry: '2027-01-30', lastUsed: null },
    { id: 11, code: 'GC-5TGB-6YHN-7UJM', recipient: { name: 'Amelia Jackson', email: 'amelia.jackson@email.com' }, initialValue: 300, balance: 210.00, status: 'Active', issued: '2026-04-11', expiry: '2027-04-11', lastUsed: '2026-06-12' },
    { id: 12, code: 'GC-8IKL-9OP0-1QAZ', recipient: { name: 'Jackson White', email: 'jackson.white@email.com' }, initialValue: 40, balance: 12.30, status: 'Active', issued: '2026-05-19', expiry: '2027-05-19', lastUsed: '2026-06-29' },
  ])

  // Purchasable gift cards — gift-card products sold on the storefront
  const purchasableGiftCards = ref([
    { id: 1, name: 'Digital Gift Card', kind: 'Digital', denominations: [25, 50, 100, 200], allowCustom: true, customMin: 10, customMax: 500, sold: 1240, revenue: 86420, status: 'Active', created: '2025-11-02' },
    { id: 2, name: 'Birthday eGift Card', kind: 'Digital', denominations: [25, 50, 100], allowCustom: false, customMin: 0, customMax: 0, sold: 512, revenue: 28900, status: 'Active', created: '2026-01-15' },
    { id: 3, name: 'Holiday Gift Card', kind: 'Digital', denominations: [50, 100, 150, 250], allowCustom: true, customMin: 25, customMax: 1000, sold: 2103, revenue: 174300, status: 'Active', created: '2025-10-20' },
    { id: 4, name: 'Physical Gift Card', kind: 'Physical', denominations: [25, 50, 100], allowCustom: false, customMin: 0, customMax: 0, sold: 348, revenue: 21750, status: 'Active', created: '2025-09-08' },
    { id: 5, name: 'Thank You Gift Card', kind: 'Digital', denominations: [20, 40, 60], allowCustom: false, customMin: 0, customMax: 0, sold: 87, revenue: 3480, status: 'Draft', created: '2026-06-30' },
    { id: 6, name: 'Corporate Bulk Gift Card', kind: 'Digital', denominations: [100, 250, 500, 1000], allowCustom: true, customMin: 100, customMax: 5000, sold: 64, revenue: 41200, status: 'Archived', created: '2025-06-14' },
  ])

  return {
    products, orders, coupons, fulfillments, draftOrders, customGiftCards, purchasableGiftCards,
    inventory,
    createProduct, updateProductDraft, duplicateProduct, deleteProduct, deleteProducts,
    adjustStock, transferStock,
  }
})
