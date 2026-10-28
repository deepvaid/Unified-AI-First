<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { useContactsStore, LOYALTY_TIER_LABELS, type Contact, type LoyaltyTier } from '@/stores/useContacts'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Order, TenderType } from '@/stores/useCommerce'
import { useElementSize } from '@/composables/useElementSize'
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import ReceiptPaper from '@/components/retail/ReceiptPaper.vue'
import PosBadge from '@/components/pos/PosBadge.vue'
import PosButton from '@/components/pos/PosButton.vue'
import PosCartLine, { type PosLineNote } from '@/components/pos/PosCartLine.vue'
import PosChip from '@/components/pos/PosChip.vue'
import PosCustomerChip from '@/components/pos/PosCustomerChip.vue'
import PosField from '@/components/pos/PosField.vue'
import PosNotice from '@/components/pos/PosNotice.vue'
import PosProductTile from '@/components/pos/PosProductTile.vue'
import PosSheet from '@/components/pos/PosSheet.vue'
import PosTenderRow from '@/components/pos/PosTenderRow.vue'
import PosTierChip from '@/components/pos/PosTierChip.vue'
import PosTotals from '@/components/pos/PosTotals.vue'
import { posArt, posInitials, posStock, type PosTone } from '@/components/pos/posArt'
import {
  DISCOUNT_REASONS, POS_PROMOTIONS, cashRound, changeDue, formatMoney, formatPhone, lineBreakdown, phoneExample,
  isEmail, quickTenderAmounts, saleTotals, taxRuleFor, taxRuleSummary, validateCoupon, validateCustomer,
  type Coupon, type CustomerDraft, type CustomerField, type DiscountReason, type LineDiscount,
} from './pos/saleModel'
import { needsBuyerDetails, renderReceipt, sampleSale, type ReceiptSale } from './receipts/receiptModel'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()
const commerce = useCommerceStore()
const contacts = useContactsStore()

/**
 * Loyalty members as the register sees them. The record is a Contact — this is
 * just the counter's view of one, so shoppers are the same people online and
 * in store.
 */
interface PosCustomerView {
  id: number
  name: string
  email: string
  phone: string
  tier: LoyaltyTier
  points: number
  lifetimeSpend: number
  visits: number
  since: string
  homeLocationId: string
  notes?: string
}

function toPosCustomer(c: Contact): PosCustomerView {
  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    phone: c.phone,
    tier: c.loyalty!.tier,
    points: c.loyalty!.points,
    lifetimeSpend: parseFloat(c.revenue) || 0,
    visits: c.loyalty!.visits,
    since: c.loyalty!.memberSince,
    homeLocationId: c.loyalty!.homeLocationId,
    notes: c.loyalty!.notes,
  }
}

const loyaltyCustomers = computed<PosCustomerView[]>(() => contacts.loyaltyContacts.map(toPosCustomer))

const accountId = computed(() => route.params.accountId as string)

/* ── Register market: currency, tax and cash rules follow the store ── */
const posCountry = computed(() => store.activeLocation.country)
const taxRule = computed(() => taxRuleFor(posCountry.value, store.activeLocation.region))

/* ── Device frame select ───────────────────────────────────────── */
type DeviceFrame = 'ipad' | 'iphone' | 'android-tablet'
type Orientation = 'portrait' | 'landscape'

const device = ref<DeviceFrame>('ipad')
const orientation = ref<Orientation>('landscape')

const DEVICE_FRAMES: { value: DeviceFrame; label: string; icon: string; w: number; h: number; supportsLandscape: boolean }[] = [
  { value: 'ipad',           label: 'iPad',           icon: 'tablet',     w: 820, h: 1180, supportsLandscape: true  },
  { value: 'iphone',         label: 'iPhone',         icon: 'smartphone', w: 390, h: 844,  supportsLandscape: false },
  { value: 'android-tablet', label: 'Android Tablet', icon: 'tablet',     w: 800, h: 1280, supportsLandscape: true  },
]

const currentFrame = computed(() => DEVICE_FRAMES.find((f) => f.value === device.value)!)

// iPhone is portrait-only — POS-on-phone is universally portrait
const effectiveOrientation = computed<Orientation>(() =>
  currentFrame.value.supportsLandscape ? orientation.value : 'portrait',
)

const frameSize = computed(() => {
  const f = currentFrame.value
  return effectiveOrientation.value === 'landscape'
    ? { w: f.h, h: f.w }
    : { w: f.w, h: f.h }
})

/* ── POS interior breakpoint ───────────────────────────────────────
   Driven by the MEASURED .pos-screen width (not frame state): the frame
   is CSS-clamped to the viewport, so a real phone with "iPad" selected
   still renders ~374px wide and must get the phone layout. Frame state
   is only the pre-mount fallback. */
type PosBreakpoint = 'phone' | 'tablet' | 'wide'
const screenEl = ref<HTMLElement | null>(null)
const { size: screenSize } = useElementSize(screenEl)
const posBreakpoint = computed<PosBreakpoint>(() => {
  const w = screenSize.value.width || frameSize.value.w
  return w < 600 ? 'phone' : w < 960 ? 'tablet' : 'wide'
})
const isPhone = computed(() => posBreakpoint.value === 'phone')

/* Phone-only: full cart rendered as a slide-up sheet */
const cartSheetOpen = ref(false)
watch(posBreakpoint, (bp) => {
  if (bp !== 'phone') {
    cartSheetOpen.value = false
    productDetailSheetOpen.value = false
  }
})

/* ── Offline mode toggle ───────────────────────────────────────── */
const isOffline = computed(() => store.offlineMode)
function toggleOffline() { store.setOfflineMode(!store.offlineMode) }

/* ── Staff (mock logged-in staff) ────────────────────────────── */
const activeStaffId = ref('assoc-1')
const activeStaffMember = computed(() => store.staffList.find((a) => a.id === activeStaffId.value) ?? store.staffList[0]!)

/* ── POS navigation ────────────────────────────────────────────── */
type PosView = 'sale' | 'products' | 'customers' | 'transactions' | 'settings' | 'getapp'
const posView = ref<PosView>('sale')

const POS_NAV = [
  { key: 'sale',         icon: 'shopping-cart',  label: 'Sale' },
  { key: 'products',     icon: 'package',         label: 'Products' },
  { key: 'customers',    icon: 'users',           label: 'Customers' },
  { key: 'transactions', icon: 'receipt',         label: 'History' },
  { key: 'settings',     icon: 'settings',        label: 'Settings' },
  { key: 'getapp',       icon: 'download-cloud',  label: 'Get App' },
] as const

/* ── Sale sub-mode (smart-grid home vs. catalog) ───────────────── */
type SaleMode = 'smart-grid' | 'catalog'
const saleMode = ref<SaleMode>('smart-grid')

/* ── Catalog ───────────────────────────────────────────────────── */
const catalogSearch = ref('')
type Collection = 'all' | 'apparel' | 'footwear' | 'accessories'
const activeCollection = ref<Collection>('all')

const COLLECTION_CHIPS: { value: Collection; label: string }[] = [
  { value: 'all',         label: 'All items' },
  { value: 'apparel',     label: 'Apparel' },
  { value: 'footwear',    label: 'Footwear' },
  { value: 'accessories', label: 'Accessories' },
]

/** A sellable row on the register, priced for this POS channel. */
interface PosCatalogItem {
  sku: string
  productName: string
  pos: number
}

/** The shared price list, read at the counter's channel price. */
const posCatalog = computed<PosCatalogItem[]>(() =>
  commerce.priceLists.map((entry) => ({
    sku: entry.sku,
    productName: entry.productName,
    pos: commerce.priceFor(entry.sku, store.activeChannelId) ?? 0,
  })),
)

// Group products by base name — one tile per product, variant picker on tap
interface VariantGroup {
  baseName: string
  representative: PosCatalogItem
  variants: PosCatalogItem[]
}

const catalogGroups = computed<VariantGroup[]>(() => {
  const map = new Map<string, PosCatalogItem[]>()
  posCatalog.value
    .filter((p) => saleMode.value !== 'catalog' || activeCollection.value === 'all' || collectionOf(p.sku) === activeCollection.value)
    .filter((p) =>
      !catalogSearch.value ||
      p.productName.toLowerCase().includes(catalogSearch.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.value.toLowerCase()),
    )
    .forEach((p) => {
      const { name } = parseTileProduct(p.productName)
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(p)
    })
  return [...map.entries()].map(([baseName, variants]) => ({
    baseName,
    representative: variants[0]!,
    variants,
  }))
})

/* ── Variant picker ─────────────────────────────────────────────── */
const variantPickerOpen = ref(false)
const variantPickerGroup = ref<VariantGroup | null>(null)

function handleTileClick(group: VariantGroup) {
  if (group.variants.length === 1) {
    requestAdd(group.variants[0]!)
  } else {
    variantPickerGroup.value = group
    variantPickerOpen.value = true
  }
}

function selectVariant(item: PosCatalogItem) {
  variantPickerOpen.value = false
  requestAdd(item)
}

/* ── Adding to the sale: open price, stock check, then add ─────── */
// The register checks before it adds, so a shortage is a decision the cashier
// makes up front — not a note discovered on the receipt.
function onHandHere(sku: string): number {
  return stockAt(sku, store.activeLocation.id)
}

function qtyInCart(sku: string): number {
  return cart.value.filter((c) => c.sku === sku).reduce((s, c) => s + c.qty, 0)
}

/** One price for the tile: the price, or "from" the cheapest variant. */
function tilePrice(group: VariantGroup): string {
  return group.variants.length === 1
    ? fmt(group.representative.pos)
    : `from ${fmt(Math.min(...group.variants.map((v) => v.pos)))}`
}

function groupOnHand(group: VariantGroup): number {
  return group.variants.reduce((s, v) => s + onHandHere(v.sku), 0)
}

/** Units on the sale beyond what this store holds — shown as a note on the line. */
function oversoldQty(line: CartLine): number {
  if (line.sku.startsWith('CUSTOM-')) return 0
  const sameSku = cart.value.filter((c) => c.sku === line.sku)
  const over = Math.max(0, qtyInCart(line.sku) - onHandHere(line.sku))
  // Pin the shortfall to the last line of that SKU so it is counted once
  return sameSku[sameSku.length - 1]?.id === line.id ? over : 0
}

function requestAdd(item: PosCatalogItem) {
  if (item.pos <= 0) {
    openPriceFor({ sku: item.sku, name: item.productName, editableName: false })
    return
  }
  if (onHandHere(item.sku) - qtyInCart(item.sku) <= 0) {
    oversellItem.value = item
    oversellShowStores.value = false
    announce(`${parseTileProduct(item.productName).name}: ${onHandHere(item.sku)} on hand at ${store.activeLocation.name}`)
    return
  }
  addToCart(item)
}

/* Oversell sheet */
const oversellItem = ref<PosCatalogItem | null>(null)
const oversellShowStores = ref(false)

function otherLocationStock(sku: string) {
  return store.locationList
    .filter((l) => l.id !== store.activeLocation.id)
    .map((l) => ({ loc: l, qty: stockAt(sku, l.id) }))
}

function sellAnyway() {
  const item = oversellItem.value
  oversellItem.value = null
  if (item) addToCart(item)
}

/* Open price sheet — unpriced catalog items and custom sales */
const openPriceTarget = ref<{ sku: string; name: string; editableName: boolean } | null>(null)
const openPriceName = ref('')
const openPriceValue = ref('')
const openPriceTouched = ref(false)
const openPriceAmount = computed(() => {
  const n = parseFloat(openPriceValue.value)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
})
const openPriceError = computed(() => {
  if (!openPriceTouched.value) return ''
  if (openPriceAmount.value <= 0) return 'Enter a price above $0.00'
  if (openPriceTarget.value?.editableName && !openPriceName.value.trim()) return 'Name the item so it reads on the receipt'
  return ''
})

function openPriceFor(target: { sku: string; name: string; editableName: boolean }) {
  openPriceTarget.value = target
  openPriceName.value = target.editableName ? '' : target.name
  openPriceValue.value = ''
  openPriceTouched.value = false
  nextTick(() => document.getElementById(target.editableName ? 'pos-openprice-name' : 'pos-openprice-value')?.focus())
}

function confirmOpenPrice() {
  openPriceTouched.value = true
  const target = openPriceTarget.value
  if (!target || openPriceError.value) return
  const { name, variant } = parseTileProduct(target.editableName ? openPriceName.value.trim() : target.name)
  pushLine({ sku: target.sku, name, variant, price: openPriceAmount.value })
  openPriceTarget.value = null
}

/* ── Products view (catalog lookup + details panel) ─────────────── */
// Retail feedback: Products in the left nav is a LOOKUP surface — more room
// for details (stock elsewhere, options) — distinct from the Sale quick-add flow.
const productsSearch = ref('')
const productsCollection = ref<Collection>('all')
const selectedProductKey = ref<string | null>(null)   // VariantGroup.baseName
const selectedProductSku = ref<string | null>(null)   // selected variant within group
const productDetailSheetOpen = ref(false)             // phone-only slide-up detail
const otherLocationsOpen = ref(false)                 // stock-by-location sheet

// SKU prefix → collection, so the chips actually filter in the lookup view
const COLLECTION_BY_PREFIX: [string, Collection][] = [
  ['TEE-', 'apparel'], ['HOOD-', 'apparel'], ['JACK-', 'apparel'], ['JEAN-', 'apparel'],
  ['SNEAK-', 'footwear'],
  ['CAP-', 'accessories'], ['BAG-', 'accessories'],
]

function collectionOf(sku: string): Collection {
  return COLLECTION_BY_PREFIX.find(([prefix]) => sku.startsWith(prefix))?.[1] ?? 'accessories'
}

// Same grouping as catalogGroups, but with independent search/collection state
// so a lookup here never disturbs the Sale screen's scan field.
const productsGroups = computed<VariantGroup[]>(() => {
  const query = productsSearch.value.trim().toLowerCase()
  const map = new Map<string, PosCatalogItem[]>()
  posCatalog.value
    .filter((p) =>
      (!query ||
        p.productName.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)) &&
      (productsCollection.value === 'all' || collectionOf(p.sku) === productsCollection.value),
    )
    .forEach((p) => {
      const { name } = parseTileProduct(p.productName)
      if (!map.has(name)) map.set(name, [])
      map.get(name)!.push(p)
    })
  return [...map.entries()].map(([baseName, variants]) => ({
    baseName,
    representative: variants[0]!,
    variants,
  }))
})

const selectedGroup = computed<VariantGroup | null>(
  () => productsGroups.value.find((g) => g.baseName === selectedProductKey.value) ?? null,
)

const selectedVariant = computed<PosCatalogItem | null>(() =>
  selectedGroup.value?.variants.find((v) => v.sku === selectedProductSku.value) ??
  selectedGroup.value?.representative ??
  null,
)

function selectProduct(group: VariantGroup) {
  selectedProductKey.value = group.baseName
  selectedProductSku.value = group.representative.sku
  if (isPhone.value) productDetailSheetOpen.value = true
}

// Tablet/wide: keep the panel populated when a filter drops the current selection
watch(productsGroups, (groups) => {
  if (isPhone.value || posView.value !== 'products' || groups.length === 0) return
  if (!groups.some((g) => g.baseName === selectedProductKey.value)) {
    selectedProductKey.value = groups[0]!.baseName
    selectedProductSku.value = groups[0]!.representative.sku
  }
})

// Deterministic per-location stock — the shared inventory store uses a
// different SKU keyspace, so the register mocks quantities (stable per reload).
// Pinned so the default store shows every stock state the register handles (out, low, last units).
const STOCK_PINS: Record<string, number> = { 'SNEAK-A1-WHT-10:loc-bondi': 0, 'BAG-LTH-BLK:loc-bondi': 2 }

function stockAt(sku: string, locationId: string): number {
  const key = `${sku}:${locationId}`
  if (key in STOCK_PINS) return STOCK_PINS[key]!
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i)
  const qty = Math.abs(hash) % 41
  return qty < 5 ? 0 : qty // some location/SKU pairs genuinely out of stock
}

const selectedVariantStock = computed(() =>
  selectedVariant.value ? stockAt(selectedVariant.value.sku, store.activeLocation.id) : 0,
)
const selectedVariantBadge = computed(() => posStock(selectedVariantStock.value)!)

const otherLocationRows = computed(() => (selectedVariant.value ? otherLocationStock(selectedVariant.value.sku) : []))

function addSelectedToCart() {
  if (!selectedVariant.value || selectedVariantStock.value === 0) return
  addToCart(selectedVariant.value)
  flashGridToast(`${selectedVariant.value.productName} added to sale`)
  if (isPhone.value) productDetailSheetOpen.value = false
  // Stay on Products — that's the point of the lookup flow
}

function lockRegister() {
  flashGridToast('Register locked — enter PIN to resume')
}

/* ── Scan / search from the default sale screen ─────────────────── */
// Retail feedback: a register session almost always starts by adding a product,
// so the scan field lives on the sale home (smart grid) — not behind Browse.
const scanFieldRef = ref<{ focus: () => void } | null>(null)

function focusScanField() {
  nextTick(() => scanFieldRef.value?.focus?.())
}

function onScanSubmit() {
  const query = catalogSearch.value.trim()
  if (!query) return
  // Hardware scanners type the barcode + Enter: exact SKU adds instantly
  const exact = posCatalog.value.find((p) => p.sku.toLowerCase() === query.toLowerCase())
  if (exact) {
    requestAdd(exact)
    catalogSearch.value = ''
    focusScanField()
    return
  }
  // A single match on Enter behaves like tapping its tile (variant picker aware)
  const groups = catalogGroups.value
  if (groups.length === 0) {
    announce(`No product for “${query}”`)
    return
  }
  if (groups.length === 1) {
    const group = groups[0]!
    handleTileClick(group)
    if (group.variants.length === 1) catalogSearch.value = ''
    focusScanField()
  }
}

// Cashiers scan the moment the sale screen is up — keep the field focused
onMounted(focusScanField)
onMounted(() => {
  if (store.isAllLocations) store.setActiveLocation(store.locationList[0]!.id)
})
watch(posView, (view) => {
  if (view === 'sale') focusScanField()
  // Products on tablet/wide: panel should never sit empty (matches the real app)
  if (view === 'products' && !selectedProductKey.value && !isPhone.value) {
    const first = productsGroups.value[0]
    if (first) selectProduct(first)
  }
})

/* ── Parse product name / variant from "Name — Variant" pattern ─── */
function parseTileProduct(fullName: string): { name: string; variant: string | null } {
  const idx = fullName.indexOf(' — ')
  if (idx === -1) return { name: fullName, variant: null }
  return { name: fullName.slice(0, idx), variant: fullName.slice(idx + 3) }
}

/* ── Product tile gradient (Shopify-style placeholder when no image) ─ */
/* ── Cart ──────────────────────────────────────────────────────── */
interface CartLine {
  id: string              // stable per-line key
  sku: string
  name: string            // base product name (variant split off)
  variant: string | null  // e.g. "Black / M"
  originalPrice: number   // catalog unit price, immutable after add
  price: number           // actual unit sell price (override target)
  qty: number
  note: string            // '' = no note
  discount: LineDiscount | null
}

const cart = ref<CartLine[]>([])
let lineSeq = 0

const isOverridden = (l: CartLine) => Math.abs(l.price - l.originalPrice) > 0.005
const itemCount = computed(() => cart.value.reduce((s, c) => s + c.qty, 0))

/* ── Screen-reader announcements + the just-added line highlight ── */
const liveMessage = ref('')
function announce(text: string) {
  liveMessage.value = ''
  nextTick(() => { liveMessage.value = text })
}

const freshLineId = ref<string | null>(null)
let freshTimer: ReturnType<typeof setTimeout> | undefined
function markFresh(id: string, name: string) {
  freshLineId.value = id
  nextTick(() => screenEl.value?.querySelector(`[data-line-id="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
  clearTimeout(freshTimer)
  freshTimer = setTimeout(() => { freshLineId.value = null }, 1400)
  announce(`Added ${name}. ${itemCount.value} item${itemCount.value === 1 ? '' : 's'}, total ${fmt(grandTotal.value)}`)
}

function addToCart(item: { sku: string; productName: string; pos: number }) {
  // Merge into an existing same-SKU line only if it's untouched (no note/override/discount),
  // so a modified line keeps its own identity.
  const existing = cart.value.find((c) => c.sku === item.sku && !c.note && !isOverridden(c) && !c.discount)
  if (existing) {
    existing.qty++
    markFresh(existing.id, existing.name)
  } else {
    const { name, variant } = parseTileProduct(item.productName)
    pushLine({ sku: item.sku, name, variant, price: item.pos })
  }
}

function pushLine(l: { sku: string; name: string; variant: string | null; price: number }) {
  const id = `L${lineSeq++}`
  cart.value.push({ id, sku: l.sku, name: l.name, variant: l.variant, originalPrice: l.price, price: l.price, qty: 1, note: '', discount: null })
  markFresh(id, l.name)
}

function removeFromCart(id: string) {
  cart.value = cart.value.filter((c) => c.id !== id)
}

function incrementQty(id: string) {
  const line = cart.value.find((c) => c.id === id)
  if (line) line.qty++
}

/* ── Totals — one model, so every visible row adds up to the Charge amount ── */
const orderDiscount = ref<LineDiscount | null>(null)
const appliedCoupon = ref<Coupon | null>(null)

const totals = computed(() => saleTotals(cart.value, {
  promos: POS_PROMOTIONS,
  orderDiscount: orderDiscount.value,
  coupon: appliedCoupon.value,
  taxRule: taxRule.value,
}))
const grandTotal = computed(() => totals.value.total)
/** Breakdown under "Discounts" — closed by default so line items keep the room. */
const discountsOpen = ref(false)

const lineViews = computed(() => new Map(cart.value.map((l) => [l.id, lineBreakdown(l, POS_PROMOTIONS)])))
const lineView = (l: CartLine) => lineViews.value.get(l.id)!
/** Catalog price × qty — struck through whenever the customer pays less. */
const lineWas = (l: CartLine) => l.originalPrice * l.qty

function pct(rate: number) {
  return `${+(rate * 100).toFixed(3)}%`
}

function lineAriaLabel(l: CartLine): string {
  const v = lineView(l)
  const parts = [l.name, l.variant, `quantity ${l.qty}`, fmt(v.final)]
  v.notes.forEach((n) => parts.push(`${n.label}, minus ${fmt(-n.amount)}`))
  if (oversoldQty(l)) parts.push(`${oversoldQty(l)} more than in stock`)
  if (l.note) parts.push(`note: ${l.note}`)
  return `${parts.filter(Boolean).join(', ')}. Edit line`
}

/** A cart line as PosCartLine shows it: formatted prices and one note per reason. */
function lineCard(l: CartLine) {
  const v = lineView(l)
  const notes: PosLineNote[] = v.notes.map((n) => ({ kind: n.kind, label: n.label, amount: `−${fmt(-n.amount)}` }))
  if (oversoldQty(l)) notes.push({ kind: 'stock', label: `${oversoldQty(l)} more than in stock` })
  if (l.note) notes.push({ kind: 'note', label: l.note })
  return {
    meta: [l.variant, l.sku].filter(Boolean).join(' · '),
    unitLabel: l.qty > 1 || isOverridden(l)
      ? `${l.qty} × ${fmt(l.price)}${isOverridden(l) ? ` · price changed from ${fmt(l.originalPrice)}` : ''}`
      : undefined,
    wasLabel: lineWas(l) - v.final > 0.005 ? fmt(lineWas(l)) : undefined,
    totalLabel: fmt(v.final),
    notes,
  }
}

/** The sale's totals as PosTotals shows them. */
const totalsView = computed(() => {
  const t = totals.value
  return {
    subtotal: fmt(t.subtotal),
    discounts: t.discounts.map((d) => ({
      key: d.key,
      label: d.label,
      amount: `−${fmt(-d.amount)}`,
      removable: d.key === 'coupon' || d.key === 'order',
    })),
    discountTotal: `−${fmt(-t.discountTotal)}`,
    taxes: t.taxMode === 'exclusive' ? t.taxes.map((x) => ({ label: `${x.label} ${pct(x.rate)}`, amount: fmt(x.amount) })) : [],
    taxNote: t.taxMode === 'inclusive' ? `Includes ${t.taxes.map((x) => `${x.label} ${fmt(x.amount)}`).join(' · ')}` : undefined,
    total: fmt(t.total),
  }
})

function removeTotalsDiscount(key: string) {
  if (key === 'coupon') removeCoupon()
  else removeOrderDiscount()
}

/* ── Undo toast — cheaper than a confirm at a busy counter ──────── */
const undoToast = reactive({ open: false, text: '', action: null as null | (() => void) })
function flashUndo(text: string, action: () => void) {
  gridToast.value = false // one toast at a time — the newest wins
  undoToast.text = text
  undoToast.action = action
  undoToast.open = true
  announce(`${text}. Undo available`)
}
function runUndo() {
  undoToast.action?.()
  undoToast.action = null
  undoToast.open = false
}

function clearCart() {
  cart.value = []
  orderDiscount.value = null
  appliedCoupon.value = null
  attachedCustomerId.value = null
  discountDialogOpen.value = false
  customerPickerOpen.value = false
}

function clearSale() {
  const snapshot = {
    lines: cart.value.map((l) => ({ ...l, discount: l.discount && { ...l.discount } })),
    orderDiscount: orderDiscount.value,
    coupon: appliedCoupon.value,
    customerId: attachedCustomerId.value,
  }
  clearCart()
  flashUndo('Sale cleared', () => {
    cart.value = snapshot.lines
    orderDiscount.value = snapshot.orderDiscount
    appliedCoupon.value = snapshot.coupon
    attachedCustomerId.value = snapshot.customerId
  })
}

/* ── Line actions sheet (tap a cart line → edit menu) ──────────── */
const lineActionsOpen = ref(false)
const lineActionsId = ref<string | null>(null)
const lineActionsLine = computed(() => cart.value.find((c) => c.id === lineActionsId.value) ?? null)
const lineSheetMode = ref<'menu' | 'price' | 'note' | 'discount'>('menu')
const pendingPrice = ref('')
const pendingNote = ref('')

function openLineActions(line: CartLine) {
  lineActionsId.value = line.id
  lineSheetMode.value = 'menu'
  lineActionsOpen.value = true
}

function openPriceMode() {
  if (!lineActionsLine.value) return
  pendingPrice.value = lineActionsLine.value.price.toFixed(2)
  lineSheetMode.value = 'price'
}

function applyPriceOverride() {
  const line = lineActionsLine.value
  if (!line) return
  const parsed = parseFloat(pendingPrice.value)
  if (!Number.isNaN(parsed)) line.price = Math.max(0, parsed)
  lineSheetMode.value = 'menu'
}

function removePriceOverride() {
  const line = lineActionsLine.value
  if (line) line.price = line.originalPrice
  lineSheetMode.value = 'menu'
}

function openNoteMode() {
  if (!lineActionsLine.value) return
  pendingNote.value = lineActionsLine.value.note
  lineSheetMode.value = 'note'
}

function saveLineNote() {
  const line = lineActionsLine.value
  if (line) line.note = pendingNote.value.trim()
  lineSheetMode.value = 'menu'
}

function sheetDecrementQty() {
  const line = lineActionsLine.value
  if (!line) return
  if (line.qty <= 1) {
    removeFromCart(line.id)
    lineActionsOpen.value = false
  } else {
    line.qty--
  }
}

function removeLineFromSheet() {
  const line = lineActionsLine.value
  if (!line) return
  const at = cart.value.indexOf(line)
  removeFromCart(line.id)
  lineActionsOpen.value = false
  flashUndo(`${line.name} removed`, () => { cart.value.splice(at, 0, line) })
}

// If the line disappears while the sheet is open (clear sale, checkout), close it.
watch(lineActionsLine, (l) => {
  if (!l) lineActionsOpen.value = false
})

/* ── Discount entry (a line, or the whole sale) — always with a reason ── */
interface DiscountEntry { kind: LineDiscount['kind']; value: string; reason: DiscountReason | null; touched: boolean }

function entryFrom(d: LineDiscount | null): DiscountEntry {
  return { kind: d?.kind ?? 'percent', value: d ? String(d.value) : '', reason: d?.reason ?? null, touched: false }
}

function entryErrors(e: DiscountEntry): { value?: string; reason?: string } {
  if (!e.touched) return {}
  const out: { value?: string; reason?: string } = {}
  const n = parseFloat(e.value)
  if (!Number.isFinite(n) || n <= 0) out.value = e.kind === 'percent' ? 'Enter a percentage above 0' : 'Enter an amount above $0.00'
  else if (e.kind === 'percent' && n > 100) out.value = 'A discount can’t be more than 100%'
  if (!e.reason) out.reason = 'Pick a reason — it’s kept on the audit log'
  return out
}

function entryError(e: DiscountEntry): string {
  const errs = entryErrors(e)
  return errs.value ?? errs.reason ?? ''
}

function entryToDiscount(e: DiscountEntry): LineDiscount | null {
  const n = parseFloat(e.value)
  return Number.isFinite(n) && n > 0 && e.reason ? { kind: e.kind, value: Math.round(n * 100) / 100, reason: e.reason } : null
}

const PERCENT_PRESETS = [10, 15, 20, 25]

const lineEntry = reactive<DiscountEntry>(entryFrom(null))
const lineEntryPreview = computed(() => {
  const line = lineActionsLine.value
  return line ? lineBreakdown({ ...line, discount: entryToDiscount(lineEntry) }, POS_PROMOTIONS).final : 0
})

function openDiscountMode() {
  Object.assign(lineEntry, entryFrom(lineActionsLine.value?.discount ?? null))
  lineSheetMode.value = 'discount'
}

function applyLineDiscount() {
  lineEntry.touched = true
  const line = lineActionsLine.value
  const d = entryToDiscount(lineEntry)
  if (!line || entryError(lineEntry) || !d) return
  line.discount = d
  lineSheetMode.value = 'menu'
  announce(`Discount applied. ${line.name} now ${fmt(lineView(line).final)}`)
}

function removeLineDiscount() {
  const line = lineActionsLine.value
  if (line) line.discount = null
  lineSheetMode.value = 'menu'
}

/* ── Discounts dialog: coupon code + whole-sale discount ───────── */
const discountDialogOpen = ref(false)
const couponInput = ref('')
const couponError = ref('')
const orderEntry = reactive<DiscountEntry>(entryFrom(null))

function openDiscountDialog() {
  couponInput.value = ''
  couponError.value = ''
  Object.assign(orderEntry, entryFrom(orderDiscount.value))
  discountDialogOpen.value = true
}

function applyCouponCode(): boolean {
  const result = validateCoupon(couponInput.value, commerce.promotions, new Date().toISOString().slice(0, 10), posCountry.value)
  if (!result.ok) {
    couponError.value = result.reason
    return false
  }
  appliedCoupon.value = result.coupon
  couponInput.value = ''
  couponError.value = ''
  announce(`Coupon ${result.coupon.code} applied`)
  return true
}

function applyDiscounts() {
  if (couponInput.value.trim() && !applyCouponCode()) return
  if (orderEntry.value.trim()) {
    orderEntry.touched = true
    if (entryError(orderEntry)) return
    orderDiscount.value = entryToDiscount(orderEntry)
  } else {
    orderDiscount.value = null
  }
  discountDialogOpen.value = false
}

function removeCoupon() {
  const c = appliedCoupon.value
  appliedCoupon.value = null
  if (c) flashUndo(`Coupon ${c.code} removed`, () => { appliedCoupon.value = c })
}

function removeOrderDiscount() {
  const d = orderDiscount.value
  orderDiscount.value = null
  if (d) flashUndo('Sale discount removed', () => { orderDiscount.value = d })
}

/* ── Customer picker (in-frame sheet: search real customers, attach loyalty; Create hands off to the customer sheet) ── */
const customerPickerOpen = ref(false)
const customerPickerSearch = ref('')
const customerPickerFieldRef = ref<{ focus: () => void } | null>(null)

const customerPickerResults = computed<PosCustomerView[]>(() => {
  const q = customerPickerSearch.value.trim().toLowerCase()
  const list = loyaltyCustomers.value.slice().sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
  // Empty query → surface top customers by spend so the sheet is never blank
  if (!q) return list.slice(0, 6)
  return list.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.toLowerCase().includes(q),
  )
})

function openCustomerPicker() {
  customerPickerSearch.value = ''
  customerPickerOpen.value = true
  nextTick(() => customerPickerFieldRef.value?.focus?.())
}

function attachExistingCustomer(c: PosCustomerView) {
  attachedCustomerId.value = c.id // real loyalty profile rides into checkout
  customerPickerOpen.value = false
  flashGridToast(`${c.name} added to sale`)
}

function attachTopResult() {
  const top = customerPickerResults.value[0]
  if (top) attachExistingCustomer(top)
}

/* Create from the sale — the same customer sheet as Edit, prefilled from the search */
function startCreateFromPicker() {
  const query = customerPickerSearch.value.trim()
  customerPickerOpen.value = false
  openCreateCustomer(query, true)
}

/* ── Attached loyalty customer (rides alongside customerName) ───── */
const attachedCustomerId = ref<number | null>(null)
const attachedCustomer = computed<PosCustomerView | null>(
  () => loyaltyCustomers.value.find((c) => c.id === attachedCustomerId.value) ?? null,
)
// Derived, not copied, so an edit to the profile shows on the sale at once
const customerName = computed(() => attachedCustomer.value?.name ?? '')

function detachCustomer() {
  const id = attachedCustomerId.value
  const name = customerName.value
  attachedCustomerId.value = null
  hideCustomerSheet()
  if (id !== null) flashUndo(`${name} removed from sale`, () => { attachedCustomerId.value = id })
}

/* ── Customer sheet: one form for New and Edit, plus the on-sale summary ── */
// Three ways in — Customers › New customer, the sale's "Create new customer", and Edit
// on the chip or a profile — so the same checks run wherever a profile is made or changed.
type CustomerSheetMode = 'view' | 'edit' | 'create'
const customerSheetOpen = ref(false)
const customerSheetId = ref<number | null>(null) // null while creating
const customerSheetMode = ref<CustomerSheetMode>('view')
/** Where Save/Cancel go: back to the summary (opened from the sale) or closed (New, or Edit from a profile). */
const customerSheetReturn = ref<'view' | 'close'>('view')
/** Created from the sale: the new customer goes straight onto it. */
const createAttaches = ref(false)
const customerSheetCustomer = computed(
  () => loyaltyCustomers.value.find((c) => c.id === customerSheetId.value) ?? null,
)
const customerSheetContact = computed(() => contacts.contacts.find((c) => c.id === customerSheetId.value) ?? null)

const EMPTY_CUSTOMER_DRAFT: CustomerDraft = {
  firstName: '', lastName: '', email: '', phone: '', note: '',
  emailReceipts: false, marketingEmail: false, marketingSms: false,
}
const customerDraft = reactive<CustomerDraft>({ ...EMPTY_CUSTOMER_DRAFT })
const draftBaseline = ref('')
const draftDirty = computed(() => JSON.stringify(customerDraft) !== draftBaseline.value)
const showCustomerErrors = ref(false)
const confirmDiscard = ref(false)
/** The discard prompt came from closing the sheet (not Cancel), so Discard closes it. */
const closeAfterDiscard = ref(false)

const customerValidation = computed(() =>
  validateCustomer(customerDraft, posCountry.value, loyaltyCustomers.value, customerSheetId.value),
)
const customerErrors = computed<Partial<Record<CustomerField, string>>>(() =>
  showCustomerErrors.value ? customerValidation.value.errors : {},
)
const draftName = computed(() => `${customerDraft.firstName.trim()} ${customerDraft.lastName.trim()}`.trim())

function loadCustomerDraft(draft: CustomerDraft) {
  Object.assign(customerDraft, draft)
  draftBaseline.value = JSON.stringify(customerDraft)
  showCustomerErrors.value = false
  confirmDiscard.value = false
}

function hideCustomerSheet() {
  customerSheetOpen.value = false
  customerSheetId.value = null
  confirmDiscard.value = false
}

function openCustomerSheet(id: number, mode: 'view' | 'edit') {
  customerSheetId.value = id
  customerSheetReturn.value = mode === 'edit' ? 'close' : 'view'
  customerSheetMode.value = 'view'
  customerSheetOpen.value = true
  if (mode === 'edit') startCustomerEdit()
}

/** Whatever the cashier already typed in search — an email, a number or a name — starts the form. */
function draftFromQuery(query: string): CustomerDraft {
  const draft = { ...EMPTY_CUSTOMER_DRAFT }
  if (query.includes('@')) draft.email = query
  else if (/^\+?[\d\s().-]{6,}$/.test(query)) draft.phone = query
  else {
    const [first = '', ...rest] = query.split(/\s+/)
    draft.firstName = first
    draft.lastName = rest.join(' ')
  }
  return draft
}

function openCreateCustomer(query = '', attach = false) {
  customerSheetId.value = null
  customerSheetMode.value = 'create'
  customerSheetReturn.value = 'close'
  createAttaches.value = attach
  loadCustomerDraft(draftFromQuery(query))
  customerSheetOpen.value = true
  nextTick(() => document.getElementById('pos-cust-firstName')?.focus())
}

function startCustomerEdit() {
  const c = customerSheetContact.value
  if (!c) return
  loadCustomerDraft({
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    note: c.loyalty?.notes ?? '',
    emailReceipts: c.customFields?.emailReceipts === true,
    marketingEmail: !!c.optedInEmail,
    marketingSms: !!c.optedInSms,
  })
  customerSheetMode.value = 'edit'
}

function leaveCustomerEdit() {
  if (customerSheetReturn.value === 'close') {
    hideCustomerSheet()
  } else {
    confirmDiscard.value = false
    customerSheetMode.value = 'view'
  }
}

function saveCustomer() {
  showCustomerErrors.value = true
  const errors = customerValidation.value.errors
  // Form order, so focus lands on the first error the cashier sees
  const first = (['firstName', 'phone', 'email'] as CustomerField[]).find((f) => errors[f])
  if (first) {
    nextTick(() => document.getElementById(`pos-cust-${first}`)?.focus())
    return
  }
  const details = {
    firstName: customerDraft.firstName.trim(),
    lastName: customerDraft.lastName.trim(),
    email: customerDraft.email.trim(),
    phone: customerDraft.phone.trim() ? formatPhone(customerDraft.phone, posCountry.value) : '',
    optedInEmail: customerDraft.marketingEmail,
    optedInSms: customerDraft.marketingSms,
  }
  const note = customerDraft.note.trim() || undefined

  if (customerSheetMode.value === 'create') {
    const created = contacts.addLoyaltyContact({
      name: draftName.value,
      email: details.email,
      phone: details.phone,
      homeLocationId: store.activeLocation.id,
    })
    // addLoyaltyContact splits a full name at the first space; keep the names as typed
    contacts.updateContact(created.id, {
      ...details,
      customFields: { emailReceipts: customerDraft.emailReceipts },
      loyalty: created.loyalty && { ...created.loyalty, notes: note },
    })
    const name = draftName.value
    hideCustomerSheet()
    if (createAttaches.value) {
      attachedCustomerId.value = created.id
      flashGridToast(`${name} joined and was added to the sale`)
    } else {
      selectedCustomerId.value = created.id
      flashGridToast(`${name} joined as a member`)
    }
    return
  }

  const c = customerSheetContact.value
  if (!c) return
  contacts.updateContact(c.id, {
    ...details,
    customFields: { ...c.customFields, emailReceipts: customerDraft.emailReceipts },
    loyalty: c.loyalty && { ...c.loyalty, notes: note },
  })
  leaveCustomerEdit()
  flashGridToast('Customer details updated')
}

function cancelCustomerEdit() {
  if (draftDirty.value) {
    closeAfterDiscard.value = false
    confirmDiscard.value = true
    return
  }
  leaveCustomerEdit()
}

function closeCustomerSheet() {
  if (customerSheetMode.value !== 'view' && draftDirty.value) {
    closeAfterDiscard.value = true
    confirmDiscard.value = true
    return
  }
  hideCustomerSheet()
}

function discardCustomerEdit() {
  if (closeAfterDiscard.value) hideCustomerSheet()
  else leaveCustomerEdit()
}

/** From the sale, a duplicate goes onto it; from Customers, it opens that profile. */
const duplicateGoesToSale = computed(() =>
  customerSheetMode.value === 'create' ? createAttaches.value : attachedCustomerId.value === customerSheetId.value,
)

/** The email/phone belongs to someone else — use them rather than split one shopper into two profiles. */
function useDuplicateCustomer() {
  const dup = customerValidation.value.duplicate
  if (!dup) return
  const toSale = duplicateGoesToSale.value
  hideCustomerSheet()
  if (toSale) {
    attachedCustomerId.value = dup.id
    flashGridToast(`${dup.name} is now on the sale`)
  } else {
    selectedCustomerId.value = dup.id
  }
}

/* ── Payment flow ──────────────────────────────────────────────── */
type PaymentStep = 'idle' | 'select' | 'processing' | 'approved'
const paymentStep = ref<PaymentStep>('idle')
const selectedTender = ref<TenderType>('card')

/* Cash: AU and CA round cash (not card) to 5c; change is counted from what was handed over */
const cashInput = ref('')
const cashTendered = computed(() => {
  const n = parseFloat(cashInput.value)
  return Number.isFinite(n) ? n : null
})
// NZ rounds to 10c and the US still has the cent — out of scope for this AU/CA pass
const roundsCash = computed(() => posCountry.value === 'AU' || posCountry.value === 'CA')
const cashDue = computed(() => (roundsCash.value ? cashRound(grandTotal.value) : grandTotal.value))
const cashRounding = computed(() => Math.round((cashDue.value - grandTotal.value) * 100) / 100)
const cashQuickAmounts = computed(() => quickTenderAmounts(cashDue.value))
const cashChange = computed(() => (cashTendered.value === null ? 0 : changeDue(cashTendered.value, cashDue.value)))
const cashShort = computed(() => cashTendered.value !== null && cashTendered.value < cashDue.value)
/** What this tender actually collects. */
const amountDue = computed(() => (selectedTender.value === 'cash' ? cashDue.value : grandTotal.value))
const canCharge = computed(() => selectedTender.value !== 'cash' || (cashTendered.value !== null && !cashShort.value))

function openPay() {
  if (cart.value.length === 0) return
  if (!posSettings.enabledTenders[selectedTender.value]) selectedTender.value = enabledTenderList.value[0]!
  cashInput.value = ''
  cartSheetOpen.value = false
  paymentStep.value = 'select'
}

function selectTender(t: TenderType) {
  selectedTender.value = t
  // Bring the amount-handed-over buttons up; the change line is pinned below them
  if (t === 'cash') nextTick(() => screenEl.value?.querySelector('.pos-cash')?.scrollIntoView({ block: 'end' }))
}

function processPayment() {
  if (!canCharge.value) return
  paymentStep.value = 'processing'
  setTimeout(() => {
    paymentStep.value = 'approved'
  }, 1800)
}

/* ── Active register (current location's first register) ────────── */
const activeRegister = computed(() => {
  const locId = store.activeLocation?.id ?? store.locationList[0]!.id
  return store.registerList.find((r) => r.locationId === locId) ?? store.registerList[0]!
})

/* ── Receipts — printed from the template assigned to this POS channel ── */
const receiptTemplate = computed(() => store.templateForChannel(store.activeChannelId))
type ReceiptDelivery = 'print' | 'email'
const receiptSheet = ref<{
  sale: ReceiptSale
  locationId: string
  number: string
  delivery: ReceiptDelivery
  email: string
  sent: boolean
} | null>(null)
/** Re-rendered live, so buyer details typed on the sheet appear on the receipt. */
const receiptDoc = computed(() => {
  const sheet = receiptSheet.value
  return sheet ? renderReceipt(receiptTemplate.value, sheet.sale, store.receiptLocationFor(sheet.locationId)) : null
})
/** ATO: AU tax invoices of $1,000 or more must name the buyer. */
const receiptNeedsBuyer = computed(() => {
  const sheet = receiptSheet.value
  const doc = receiptDoc.value
  return !!sheet && !!doc && !sheet.sale.customer
    && needsBuyerDetails(store.receiptLocationFor(sheet.locationId).country, doc.total)
})
const saleNeedsBuyer = computed(() => !attachedCustomer.value && needsBuyerDetails(posCountry.value, grandTotal.value))
const receiptEmailTouched = ref(false)
const receiptEmailError = computed(() =>
  receiptSheet.value && receiptEmailTouched.value && !isEmail(receiptSheet.value.email) ? 'Enter an email like name@example.com' : '',
)
const receiptPrinter = computed(() => activeRegister.value.pairedPrinter)
const receiptSubject = computed(() => store.receiptSettings.emailSubject.replace('{{store}}', store.activeLocation.name))
/** POS Settings shows the template this register prints, with the sample sale. */
const receiptSettingsPreview = computed(() =>
  renderReceipt(receiptTemplate.value, sampleSale(), store.receiptLocationFor(store.activeLocation.id)),
)

/** The sale as its receipt needs it — taken before the cart clears. */
function receiptSaleFor(number: string): ReceiptSale {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const [first = '', last = ''] = activeStaffMember.value.name.split(' ')
  return {
    number,
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
    register: activeRegister.value.name,
    staff: last ? `${first} ${last[0]}.` : first,
    // Points are added after the receipt renders, so show the balance as it will be
    customer: attachedCustomer.value
      ? { name: attachedCustomer.value.name, points: attachedCustomer.value.points + Math.round(amountDue.value), pointsEarned: Math.round(amountDue.value) }
      : null,
    lines: cart.value.map((c) => ({ name: c.name, variant: c.variant, sku: c.sku, qty: c.qty, price: c.price, discount: c.discount })),
    orderDiscount: orderDiscount.value,
    coupon: appliedCoupon.value,
    tender: selectedTender.value,
    cashTendered: selectedTender.value === 'cash' ? cashTendered.value : null,
    cardLast4: selectedTender.value === 'card' ? '4242' : undefined,
  }
}

function sendReceiptEmail() {
  const sheet = receiptSheet.value
  if (!sheet) return
  receiptEmailTouched.value = true
  if (!isEmail(sheet.email)) {
    nextTick(() => document.getElementById('pos-receipt-email')?.focus())
    return
  }
  sheet.sent = true
  announce(`Receipt emailed to ${sheet.email}`)
}

/** No printer on this register: send the same receipt by email instead. */
function emailInsteadOfPrint() {
  const sheet = receiptSheet.value
  if (!sheet) return
  sheet.delivery = 'email'
  receiptEmailTouched.value = false
  nextTick(() => document.getElementById('pos-receipt-email')?.focus())
}

function completeApproved(delivery: ReceiptDelivery | null = null) {
  // Append real transaction to store — the demo loop
  const locId = store.activeLocation?.id ?? store.locationList[0]!.id
  const txn = commerce.addPosOrder({
    locationId: locId,
    registerId: activeRegister.value.id,
    staffId: activeStaffId.value,
    customerName: customerName.value || undefined,
    total: amountDue.value,
    tender: selectedTender.value,
    itemCount: cart.value.reduce((s, c) => s + c.qty, 0),
    lines: cart.value.map((c) => ({
      sku: c.sku,
      name: c.variant ? `${c.name} — ${c.variant}` : c.name,
      qty: c.qty,
      price: c.price,
    })),
  })
  // Render before the cart clears; the receipt is the sale as it was charged
  const receipt = delivery
    ? { sale: { ...receiptSaleFor(txn.orderNumber), buyer: { name: '', abn: '' } }, email: attachedCustomer.value?.email ?? '' }
    : null
  if (attachedCustomerId.value) contacts.recordLoyaltyPurchase(attachedCustomerId.value, amountDue.value)
  lastTxnId.value = txn.orderNumber
  paymentStep.value = 'idle'
  clearCart()
  if (receipt && delivery) {
    receiptEmailTouched.value = false
    receiptSheet.value = { ...receipt, locationId: locId, number: txn.orderNumber, delivery, sent: delivery === 'email' && isEmail(receipt.email) }
    if (delivery === 'print' && receiptPrinter.value) announce(`Receipt printed on ${receiptPrinter.value}`)
  }
  saleCompleteVisible.value = true
  setTimeout(() => { saleCompleteVisible.value = false }, 3000)
}

/* ── Sale-complete toast ───────────────────────────────────────── */
const saleCompleteVisible = ref(false)
const lastTxnId = ref('')

/* ── Suspend ───────────────────────────────────────────────────── */
const suspendSnackbar = ref(false)
function suspendSale() {
  suspendSnackbar.value = true
}

/* ── Formatters ────────────────────────────────────────────────── */
function fmt(n: number) {
  return formatMoney(n, posCountry.value)
}

/* ── Tender display maps (must include all TenderType values) ───── */
const TENDER_ICONS: Record<TenderType, string> = {
  card: 'credit-card',
  tap_to_pay: 'smartphone',
  cash: 'banknote',
  gift_card: 'gift',
  split: 'split-square-horizontal',
}
const TENDER_DISPLAY: Record<TenderType, string> = {
  card: 'Card',
  tap_to_pay: 'Tap to Pay',
  cash: 'Cash',
  gift_card: 'Gift card',
  split: 'Split',
}
const PROCESSING_TEXT: Record<TenderType, string> = {
  card: 'Insert or tap card',
  tap_to_pay: 'Hold phone near terminal',
  cash: 'Counting cash',
  gift_card: 'Checking gift card balance',
  split: 'Processing split payment',
}

/* ── POS settings (session-local; Payments group filters the tender sheet) ── */
const TENDER_ORDER: TenderType[] = ['card', 'tap_to_pay', 'cash', 'gift_card', 'split']

const posSettings = reactive({
  printReceipt: true,
  emailReceipt: true,
  enabledTenders: { card: true, tap_to_pay: true, cash: true, gift_card: true, split: true } as Record<TenderType, boolean>,
})

const enabledTenderList = computed<TenderType[]>(() => TENDER_ORDER.filter((t) => posSettings.enabledTenders[t]))

function toggleTender(t: TenderType) {
  if (posSettings.enabledTenders[t] && enabledTenderList.value.length === 1) {
    flashGridToast('At least one tender must stay enabled')
    return
  }
  posSettings.enabledTenders[t] = !posSettings.enabledTenders[t]
}

/* ── History tab — location-scoped, filterable, grouped by day ──── */
type HistoryFilter = 'all' | 'sales' | 'refunds'
const HISTORY_FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'sales',   label: 'Sales' },
  { value: 'refunds', label: 'Refunds' },
]
const historyFilter = ref<HistoryFilter>('all')

const historyTxns = computed(() =>
  commerce.posOrders.filter((o) => {
    if (o.pos?.locationId !== store.activeLocationId) return false
    if (historyFilter.value === 'sales') return o.status === 'Completed'
    if (historyFilter.value === 'refunds') return o.paymentStatus === 'Refunded' || o.paymentStatus === 'Partially Refunded'
    return true
  }),
)

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const historyGroups = computed<{ label: string; txns: Order[] }[]>(() => {
  const groups: { label: string; txns: Order[] }[] = []
  for (const t of historyTxns.value) {
    const label = dayLabel(t.date)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.txns.push(t)
    else groups.push({ label, txns: [t] })
  }
  return groups
})

/** Keyed by the order's payment status, which carries the POS outcome. */
const STATUS_PILL_META: Record<string, { label: string; tone: PosTone }> = {
  'Paid':                { label: 'Completed',      tone: 'success' },
  'Refunded':            { label: 'Refunded',       tone: 'danger' },
  'Partially Refunded':  { label: 'Partial refund', tone: 'warn' },
  'Voided':              { label: 'Voided',         tone: 'neutral' },
  'Pending':             { label: 'Suspended',      tone: 'warn' },
}
function statusPill(o: Order) {
  return STATUS_PILL_META[o.paymentStatus] ?? STATUS_PILL_META['Paid']!
}

/* ── Transaction detail sheet ──────────────────────────────────── */
const detailTxn = ref<Order | null>(null)
function openTxnDetail(t: Order) { detailTxn.value = t }
function closeTxnDetail() { detailTxn.value = null }
const detailSubtotal = computed(() =>
  (detailTxn.value?.lineItems ?? []).reduce((sum, l) => sum + parseFloat(l.price) * l.qty, 0),
)
function printDetailReceipt() { flashGridToast('Receipt sent to printer') }
function emailDetailReceipt() {
  const name = detailTxn.value?.customer.name
  flashGridToast(name && name !== 'Walk-in customer' ? `Receipt emailed to ${name}` : 'Receipt emailed')
}
function refundDetailTxn() {
  if (!detailTxn.value) return
  commerce.refundPosOrder(detailTxn.value.id)
  flashGridToast('Refund processed')
}

/* ── Customers tab ─────────────────────────────────────────────── */
const customerSearch = ref('')
const selectedCustomerId = ref<number | null>(null)

const filteredCustomers = computed(() => {
  const q = customerSearch.value.trim().toLowerCase()
  return loyaltyCustomers.value
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
})

const selectedCustomer = computed<PosCustomerView | null>(
  () => loyaltyCustomers.value.find((c) => c.id === selectedCustomerId.value) ?? null,
)

const selectedCustomerTxns = computed(() =>
  selectedCustomer.value
    ? commerce.posOrders.filter((o) => o.customer.name === selectedCustomer.value!.name).slice(0, 5)
    : [],
)

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function attachCustomerToSale(c: PosCustomerView) {
  attachedCustomerId.value = c.id
  posView.value = 'sale'
  flashGridToast(`${c.name} added to sale`)
}

/* ── Smart Grid (Shopify-style home tiles) ─────────────────────── */
interface SmartGridTile {
  key: string
  label: string
  icon: string
  color: string  // tailwind-500ish hex
  action: () => void
}
const gridToast = ref(false)
const gridToastText = ref('')
function flashGridToast(text: string) {
  undoToast.open = false
  gridToastText.value = text
  gridToast.value = true
}

/** Open-price entry: the cashier names it and keys the price, rather than a silent placeholder line. */
function addCustomSale() {
  openPriceFor({ sku: `CUSTOM-${Date.now().toString(36).slice(-4).toUpperCase()}`, name: '', editableName: true })
}

const SMART_GRID_TILES: SmartGridTile[] = [
  { key: 'browse',    label: 'Browse products', icon: 'grid-2x2',     color: '#6366f1', action: () => { saleMode.value = 'catalog' } },
  { key: 'custom',    label: 'Add custom sale', icon: 'plus-circle',  color: '#0d9488', action: addCustomSale },
  { key: 'discount',  label: 'Apply discount',  icon: 'percent',      color: '#f59e0b', action: openDiscountDialog },
  { key: 'email',     label: 'Email customer',  icon: 'mail',         color: '#8b5cf6', action: openCustomerPicker },
  { key: 'save',      label: 'Save as draft',   icon: 'bookmark',     color: '#64748b', action: () => flashGridToast('Sale saved as draft') },
  { key: 'ship',      label: 'Ship all items',  icon: 'truck',        color: '#0ea5e9', action: () => flashGridToast('Ship from store flow opened') },
  { key: 'note',      label: 'Add note',        icon: 'sticky-note',  color: '#f43f5e', action: () => flashGridToast('Note attached to sale') },
  { key: 'loyalty',   label: 'Loyalty lookup',  icon: 'user-search',  color: '#10b981', action: openCustomerPicker },
]

/* ── Get App — device-conditional install flow ──────────────────── */
const isAndroidDevice = computed(() =>
  device.value === 'android-tablet',
)
const apkToast = ref(false)
const apkQrUrl = computed(() =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0d9488&bgcolor=ffffff&data=${encodeURIComponent('http://localhost:5174/retail-cloud-pos.apk')}`,
)
</script>

<template>
  <!-- Full-page POS Preview — no sidebar/appbar chrome -->
  <div class="pos-preview-shell">

    <!-- Header strip -->
    <div class="pos-header">
      <v-btn
        variant="text"
        prepend-icon="arrow-left"
        class="text-none pos-header__back"
        @click="router.push({ name: 'RetailHome', params: { accountId } })"
      >
        Back to Retail
      </v-btn>

      <div class="pos-header__title">
        <v-icon size="16" color="primary" class="me-2">monitor-smartphone</v-icon>
        <span>POS Preview</span>
      </div>

      <div class="pos-header__controls">
        <!-- Location select -->
        <!-- Chrome control: no label (aria-label instead) and hide-details keeps it flush in the header row. -->
        <v-select
          :model-value="store.activeLocationId"
          :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
          density="compact"
          hide-details
          aria-label="Location"
          class="pos-header__location"
          @update:model-value="store.setActiveLocation"
        />

        <!-- Device frame select -->
        <MpSegmentedControl
          :model-value="device"
          :items="DEVICE_FRAMES.map((df) => ({ value: df.value, label: df.label, icon: df.icon, tooltip: df.label }))"
          size="sm"
          ariaLabel="Device frame"
          @update:model-value="(v) => { if (v) device = v as DeviceFrame }"
        />

        <!-- Orientation toggle (tablets only) -->
        <MpSegmentedControl
          v-if="currentFrame.supportsLandscape"
          :model-value="orientation"
          :items="[
            { value: 'portrait', label: 'Portrait', icon: 'rectangle-vertical', tooltip: 'Portrait' },
            { value: 'landscape', label: 'Landscape', icon: 'rectangle-horizontal', tooltip: 'Landscape' },
          ]"
          size="sm"
          ariaLabel="Orientation"
          @update:model-value="(v) => { if (v) orientation = v as Orientation }"
        />

        <!-- Offline toggle -->
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">Offline</span>
          <!-- Chrome toggle: the visible caption is decorative, the switch names itself. -->
          <v-switch
            :model-value="isOffline"
            color="warning"
            hide-details
            density="compact"
            aria-label="Simulate offline mode"
            @change="toggleOffline"
          />
          <div v-if="isOffline" class="offline-badge">OFFLINE</div>
        </div>
      </div>
    </div>

    <!-- Device frame stage -->
    <div class="pos-stage">
      <div
        class="pos-device-frame"
        :class="[`pos-device-frame--${device}`, `pos-device-frame--${effectiveOrientation}`]"
        :style="{
          width:  `min(${frameSize.w}px, calc(100vw - var(--frame-margin, 48px)))`,
          height: `min(${frameSize.h}px, calc(100vh - var(--frame-chrome, 140px)))`,
        }"
      >
        <!-- Bezel top (camera notch area) -->
        <div class="pos-device-frame__bezel-top">
          <div class="pos-device-frame__camera" />
        </div>

        <!-- POS Screen -->
        <div ref="screenEl" class="pos-screen" :class="`pos-screen--${posBreakpoint}`">

          <!-- Screen-reader announcements: adds, stock warnings, scan misses -->
          <div class="d-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveMessage }}</div>

          <!-- Offline banner -->
          <div v-if="isOffline" class="pos-offline-banner">
            <v-icon size="14">wifi-off</v-icon>
            <span>Offline — transactions will sync when reconnected</span>
          </div>

          <!-- POS layout -->
          <div class="pos-layout">

            <!-- Left rail nav -->
            <div class="pos-rail">
              <div class="pos-rail__brand">
                <v-icon size="20" color="white">store</v-icon>
              </div>

              <div class="pos-rail__nav">
                <button
                  v-for="nav in POS_NAV"
                  :key="nav.key"
                  class="pos-rail__item"
                  :class="{ 'pos-rail__item--active': posView === nav.key }"
                  :aria-current="posView === nav.key ? 'page' : undefined"
                  @click="posView = nav.key as PosView"
                >
                  <v-icon size="18">{{ nav.icon }}</v-icon>
                  <span>{{ nav.label }}</span>
                </button>
              </div>

              <div class="pos-rail__footer">
                <div class="pos-rail__staff">
                  <v-avatar size="26" color="primary">
                    <span class="text-caption text-white" style="font-size: 9px; font-weight: 700;">
                      {{ activeStaffMember?.name.split(' ').map((n) => n[0]).join('') ?? '' }}
                    </span>
                  </v-avatar>
                </div>
              </div>
            </div>

            <!-- ── SALE VIEW ──────────────────────────────────── -->
            <template v-if="posView === 'sale'">
              <!-- Main pane: Smart Grid home OR product catalog -->
              <div class="pos-main">

                <!-- Pane header (mode switcher) -->
                <div class="pos-pane-head">
                  <div class="pos-pane-head__title">
                    {{ saleMode === 'catalog' ? 'Products' : (catalogSearch ? 'Search results' : 'Smart grid') }}
                  </div>
                  <button
                    v-if="saleMode === 'smart-grid'"
                    class="pos-pane-head__link"
                    @click="saleMode = 'catalog'"
                  >
                    Show full catalog
                    <v-icon size="13" style="margin-left: 2px;">chevron-right</v-icon>
                  </button>
                  <button
                    v-else
                    class="pos-pane-head__link"
                    @click="saleMode = 'smart-grid'"
                  >
                    <v-icon size="13" style="margin-right: 2px;">chevron-left</v-icon>
                    Smart grid
                  </button>
                </div>

                <!-- Persistent scan / search — always ready on the sale screen -->
                <div class="pos-scanbar">
                  <v-text-field
                    ref="scanFieldRef"
                    v-model="catalogSearch"
                    placeholder="Scan barcode or search products"
                    aria-label="Scan barcode or search products"
                    density="default"
                    variant="solo"
                    flat
                    prepend-inner-icon="search"
                    append-inner-icon="scan-line"
                    hide-details
                    clearable
                    bg-color="surface"
                    rounded="lg"
                    style="font-size: 15px;"
                    @keydown.enter="onScanSubmit"
                  />
                </div>

                <!-- ── SMART GRID home ─────────────────────────── -->
                <div v-if="saleMode === 'smart-grid' && !catalogSearch" class="pos-smartgrid">
                  <button
                    v-for="tile in SMART_GRID_TILES"
                    :key="tile.key"
                    class="pos-smartgrid__tile"
                    @click="tile.action"
                  >
                    <div class="pos-smartgrid__icon" :style="{ background: tile.color }">
                      <v-icon size="22" color="white">{{ tile.icon }}</v-icon>
                    </div>
                    <div class="pos-smartgrid__label">{{ tile.label }}</div>
                  </button>
                </div>

                <!-- ── CATALOG / search results ─────────────────── -->
                <div v-else class="pos-catalog">
                  <div v-if="saleMode === 'catalog'" class="pos-catalog__chips" role="group" aria-label="Collections">
                    <PosChip
                      v-for="chip in COLLECTION_CHIPS"
                      :key="chip.value"
                      :active="activeCollection === chip.value"
                      @click="activeCollection = chip.value"
                    >
                      {{ chip.label }}
                    </PosChip>
                  </div>

                  <div class="pos-catalog__grid">
                    <PosProductTile
                      v-for="group in catalogGroups"
                      :key="group.representative.sku"
                      :name="group.baseName"
                      :meta="group.variants.map(v => parseTileProduct(v.productName).variant).filter(Boolean).join(' · ') || undefined"
                      :price="tilePrice(group)"
                      :seed="group.representative.sku"
                      :variants="group.variants.length"
                      :stock="posStock(groupOnHand(group), 'tile')"
                      @click="handleTileClick(group)"
                    />

                    <div v-if="catalogGroups.length === 0" class="pos-catalog__empty">
                      <v-icon size="32" class="text-medium-emphasis">scan-search</v-icon>
                      <div class="pos-catalog__empty-title">
                        {{ catalogSearch.trim() ? `No product for “${catalogSearch.trim()}”` : 'Nothing in this collection' }}
                      </div>
                      <div class="pos-catalog__empty-sub">Check the barcode, or sell it as a custom item.</div>
                      <PosChip icon="plus" @click="addCustomSale">Sell as custom item</PosChip>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Phone: scrim behind the cart sheet -->
              <div v-if="isPhone && cartSheetOpen" class="pos-cart-scrim" @click="cartSheetOpen = false" />

              <!-- Cart / right pane (Shopify-style); becomes a slide-up sheet on phone -->
              <div class="pos-cart" :class="{ 'pos-cart--open': cartSheetOpen }">
                <div class="pos-cart__header">
                  <span class="pos-cart__title">Current sale</span>
                  <span v-if="cart.length > 0" class="pos-cart__count">
                    {{ cart.reduce((s, c) => s + c.qty, 0) }} item{{ cart.reduce((s, c) => s + c.qty, 0) !== 1 ? 's' : '' }}
                  </span>
                  <button v-if="isPhone" class="pos-cart__collapse" aria-label="Close cart" @click="cartSheetOpen = false">
                    <v-icon size="16">chevron-down</v-icon>
                  </button>
                </div>

                <!-- Customer chip: tap for details / edit; remove sits on its own 44px target -->
                <PosCustomerChip
                  v-if="attachedCustomer"
                  class="pos-cart__customer"
                  :name="attachedCustomer.name"
                  :tier="attachedCustomer.tier"
                  :points="attachedCustomer.points"
                  @open="openCustomerSheet(attachedCustomer.id, 'view')"
                  @remove="detachCustomer"
                />

                <!-- Line items -->
                <div class="pos-cart__lines">
                  <div v-if="cart.length === 0" class="pos-cart__empty">
                    <div class="pos-cart__empty-illo">
                      <v-icon size="42">shopping-bag</v-icon>
                    </div>
                    <div class="pos-cart__empty-title">Add a product to get started</div>
                    <div class="pos-cart__empty-sub">Browse the smart grid or scan a barcode</div>
                    <div class="pos-cart__empty-chips">
                      <PosChip icon="plus" @click="addCustomSale">Custom item</PosChip>
                      <PosChip icon="user-plus" @click="openCustomerPicker">Add customer</PosChip>
                    </div>
                  </div>

                  <transition-group name="pos-line-in">
                    <PosCartLine
                      v-for="line in cart"
                      :key="line.id"
                      v-bind="lineCard(line)"
                      :name="line.name"
                      :qty="line.qty"
                      :seed="line.sku"
                      :fresh="line.id === freshLineId"
                      :data-line-id="line.id"
                      :aria-label="lineAriaLabel(line)"
                      @open="openLineActions(line)"
                    />
                  </transition-group>
                </div>

                <!-- Totals: every row adds up to the Charge amount -->
                <PosTotals
                  v-if="cart.length > 0"
                  v-model:open="discountsOpen"
                  class="pos-cart__totals"
                  v-bind="totalsView"
                  @remove="removeTotalsDiscount"
                />

                <!-- Cart actions: labelled, with Clear set apart from the rest -->
                <div v-if="cart.length > 0" class="pos-cart__secondary">
                  <PosButton variant="secondary" stacked icon="pause-circle" @click="suspendSale">Park</PosButton>
                  <PosButton variant="secondary" stacked icon="percent" @click="openDiscountDialog">Discount</PosButton>
                  <PosButton variant="secondary" stacked icon="user-plus" @click="openCustomerPicker">Customer</PosButton>
                  <PosButton variant="secondary" tone="danger" stacked icon="trash-2" class="pos-cart__clear" @click="clearSale">Clear</PosButton>
                </div>

                <!-- Charge button (Shopify-iconic) -->
                <PosButton size="lg" class="pos-cart__charge" :disabled="cart.length === 0" @click="openPay">
                  Charge {{ fmt(grandTotal) }}
                </PosButton>
              </div>

              <!-- Phone: collapsed cart bar (summary + charge), sits above the tab bar -->
              <div v-if="isPhone" class="pos-cartbar">
                <button class="pos-cartbar__summary" @click="cartSheetOpen = true">
                  <v-icon size="16">shopping-bag</v-icon>
                  <span>{{ cart.reduce((s, c) => s + c.qty, 0) }} item{{ cart.reduce((s, c) => s + c.qty, 0) !== 1 ? 's' : '' }} · {{ fmt(grandTotal) }}</span>
                  <v-icon size="14">chevron-up</v-icon>
                </button>
                <PosButton :disabled="cart.length === 0" @click="openPay">Charge</PosButton>
              </div>
            </template>

            <!-- ── PRODUCTS VIEW (catalog lookup + details panel) ── -->
            <div v-else-if="posView === 'products'" class="pos-products">
              <!-- Main pane: search + collection chips + product grid -->
              <div class="pos-products__main">
                <div class="pos-pane-head">
                  <div class="pos-pane-head__title">Products</div>
                  <button class="pos-pane-head__link" @click="lockRegister">
                    <v-icon size="13" style="margin-right: 2px;">lock</v-icon>
                    Lock
                  </button>
                </div>

                <div class="pos-scanbar">
                  <v-text-field
                    v-model="productsSearch"
                    placeholder="Search products…"
                    density="compact"
                    variant="solo"
                    flat
                    prepend-inner-icon="search"
                    hide-details
                    clearable
                    bg-color="surface"
                    rounded="lg"
                    style="font-size: 13px;"
                  />
                </div>

                <div class="pos-catalog__chips" role="group" aria-label="Collections">
                  <PosChip
                    v-for="chip in COLLECTION_CHIPS"
                    :key="chip.value"
                    :active="productsCollection === chip.value"
                    @click="productsCollection = chip.value"
                  >
                    {{ chip.label }}
                  </PosChip>
                </div>

                <div class="pos-catalog__grid">
                  <PosProductTile
                    v-for="group in productsGroups"
                    :key="group.baseName"
                    :name="group.baseName"
                    :meta="group.representative.sku"
                    :price="tilePrice(group)"
                    :seed="group.representative.sku"
                    :variants="group.variants.length"
                    icon="package"
                    :selected="selectedProductKey === group.baseName"
                    @click="selectProduct(group)"
                  />

                  <div v-if="productsGroups.length === 0" class="pos-catalog__empty">
                    <v-icon size="32" class="text-medium-emphasis">search</v-icon>
                    <div>No products found</div>
                  </div>
                </div>
              </div>

              <!-- Phone: scrim behind the detail sheet -->
              <div v-if="isPhone && productDetailSheetOpen" class="pos-cart-scrim" @click="productDetailSheetOpen = false" />

              <!-- Details panel — persistent on tablet/wide, slide-up sheet on phone -->
              <div class="pos-products__detail" :class="{ 'pos-products__detail--open': productDetailSheetOpen }">
                <div v-if="!selectedGroup" class="pos-customers__detail-empty">
                  <v-icon size="40">package</v-icon>
                  <div class="pos-customers__detail-empty-title">Select a product</div>
                  <div class="pos-customers__detail-empty-sub">View pricing, options, and stock at every location.</div>
                </div>

                <template v-else>
                  <div class="pos-products__detail-head">
                    <div class="pos-products__detail-thumb" :style="{ background: posArt(selectedVariant!.sku) }">
                      <v-icon size="18">package</v-icon>
                    </div>
                    <div class="pos-products__detail-id">
                      <div class="pos-products__detail-name">{{ selectedGroup.baseName }}</div>
                      <div class="pos-products__detail-sku">SKU: {{ selectedVariant!.sku }} · GST 10%</div>
                    </div>
                    <button v-if="isPhone" class="pos-cart__collapse" aria-label="Close product details" @click="productDetailSheetOpen = false">
                      <v-icon size="16">chevron-down</v-icon>
                    </button>
                  </div>

                  <div class="pos-products__detail-price">{{ fmt(selectedVariant!.pos) }}</div>

                  <div class="pos-products__stockrow">
                    <PosBadge :tone="selectedVariantBadge.tone" :icon="selectedVariantBadge.icon">
                      {{ selectedVariantBadge.label }}
                    </PosBadge>
                    <button class="pos-pane-head__link" @click="otherLocationsOpen = true">
                      Check Other Locations
                    </button>
                  </div>

                  <div class="pos-profile__section-title">Options</div>
                  <div class="pos-products__options">
                    <PosChip
                      v-for="v in selectedGroup.variants"
                      :key="v.sku"
                      :active="selectedProductSku === v.sku"
                      @click="selectedProductSku = v.sku"
                    >
                      {{ parseTileProduct(v.productName).variant ?? 'Default' }}
                    </PosChip>
                  </div>

                  <div class="pos-products__detail-spacer" />

                  <PosButton size="lg" block class="pos-products__add" :disabled="selectedVariantStock === 0" @click="addSelectedToCart">
                    Add to Cart · {{ fmt(selectedVariant!.pos) }}
                  </PosButton>
                </template>
              </div>
            </div>

            <!-- ── CUSTOMERS VIEW ──────────────────────────────── -->
            <div v-else-if="posView === 'customers'" class="pos-customers" :class="{ 'pos-customers--detail': isPhone && selectedCustomerId }">
              <!-- List column -->
              <div class="pos-customers__list">
                <div class="pos-pane-head">
                  <div class="pos-pane-head__title">Customers</div>
                  <button class="pos-pane-head__link" @click="openCreateCustomer()">
                    <v-icon size="13" style="margin-right: 2px;">user-plus</v-icon>
                    New customer
                  </button>
                </div>
                <div class="pos-customers__search">
                  <v-text-field
                    v-model="customerSearch"
                    placeholder="Search name or email"
                    density="compact"
                    variant="solo"
                    flat
                    prepend-inner-icon="search"
                    hide-details
                    bg-color="surface"
                    rounded="lg"
                    style="font-size: 13px;"
                  />
                </div>
                <div class="pos-customers__rows">
                  <button
                    v-for="c in filteredCustomers"
                    :key="c.id"
                    class="pos-customer-row"
                    :class="{ 'pos-customer-row--selected': selectedCustomerId === c.id }"
                    @click="selectedCustomerId = c.id"
                  >
                    <div class="pos-customer-row__avatar" :style="{ background: posArt(String(c.id)) }">{{ posInitials(c.name) }}</div>
                    <div class="pos-customer-row__body">
                      <div class="pos-customer-row__name">{{ c.name }}</div>
                      <div class="pos-customer-row__email">{{ c.email }}</div>
                    </div>
                    <div class="pos-customer-row__chips">
                      <PosTierChip :tier="c.tier" />
                      <span class="pos-customer-row__spend">{{ fmt(c.lifetimeSpend) }}</span>
                    </div>
                  </button>
                  <div v-if="filteredCustomers.length === 0" class="pos-catalog__empty">
                    <v-icon size="32" class="text-medium-emphasis">search</v-icon>
                    <div>No customers match</div>
                  </div>
                </div>
              </div>

              <!-- Detail pane -->
              <div class="pos-customers__detail">
                <div v-if="!selectedCustomer" class="pos-customers__detail-empty">
                  <v-icon size="40" color="#9ca3af">users</v-icon>
                  <div class="pos-customers__detail-empty-title">Select a customer</div>
                  <div class="pos-customers__detail-empty-sub">View their profile, loyalty status, and purchase history.</div>
                </div>

                <div v-else class="pos-profile">
                  <!-- Phone: back to list -->
                  <button v-if="isPhone" class="pos-profile__back" @click="selectedCustomerId = null">
                    <v-icon size="15">chevron-left</v-icon>
                    Customers
                  </button>

                  <div class="pos-profile__header">
                    <div class="pos-profile__avatar" :style="{ background: posArt(String(selectedCustomer.id)) }">{{ posInitials(selectedCustomer.name) }}</div>
                    <div class="pos-profile__id">
                      <div class="pos-profile__name">{{ selectedCustomer.name }}</div>
                      <div class="pos-profile__meta">
                        {{ LOYALTY_TIER_LABELS[selectedCustomer.tier] }} · Member since {{ memberSince(selectedCustomer.since) }} · {{ store.locationName(selectedCustomer.homeLocationId) }}
                      </div>
                    </div>
                    <button
                      v-if="attachedCustomerId !== selectedCustomer.id"
                      class="pos-action-btn pos-action-btn--primary"
                      @click="attachCustomerToSale(selectedCustomer)"
                    >
                      <v-icon size="14">user-plus</v-icon>
                      Add to sale
                    </button>
                    <div v-else class="pos-action-btn pos-action-btn--attached">
                      <v-icon size="14">check</v-icon>
                      On current sale
                    </div>
                    <button class="pos-action-btn" @click="openCustomerSheet(selectedCustomer.id, 'edit')">
                      <v-icon size="14">pencil</v-icon>
                      Edit
                    </button>
                  </div>

                  <div class="pos-profile__stats">
                    <div class="pos-stat">
                      <div class="pos-stat__value">{{ fmt(selectedCustomer.lifetimeSpend) }}</div>
                      <div class="pos-stat__label">Lifetime spend</div>
                    </div>
                    <div class="pos-stat">
                      <div class="pos-stat__value">{{ selectedCustomer.points.toLocaleString() }}</div>
                      <div class="pos-stat__label">Points</div>
                    </div>
                    <div class="pos-stat">
                      <div class="pos-stat__value">{{ selectedCustomer.visits }}</div>
                      <div class="pos-stat__label">Visits</div>
                    </div>
                  </div>

                  <div class="pos-profile__section-title">Contact</div>
                  <div class="pos-profile__card">
                    <div class="pos-setting-row">
                      <div class="pos-setting-row__icon"><v-icon size="15">mail</v-icon></div>
                      <div class="pos-setting-row__label">{{ selectedCustomer.email }}</div>
                    </div>
                    <div class="pos-setting-row">
                      <div class="pos-setting-row__icon"><v-icon size="15">phone</v-icon></div>
                      <div class="pos-setting-row__label">{{ selectedCustomer.phone }}</div>
                    </div>
                  </div>

                  <div class="pos-profile__section-title">Recent purchases</div>
                  <div class="pos-profile__card">
                    <button
                      v-for="txn in selectedCustomerTxns"
                      :key="txn.id"
                      class="pos-history-row"
                      @click="openTxnDetail(txn)"
                    >
                      <div>
                        <div class="pos-history-row__id">{{ txn.orderNumber }}</div>
                        <div class="pos-history-row__meta">{{ dayLabel(txn.date) }} · {{ txn.itemCount }} item{{ txn.itemCount !== 1 ? 's' : '' }}</div>
                      </div>
                      <div class="pos-history-row__total" :class="parseFloat(txn.total) < 0 ? 'pos-history-row__total--neg' : ''">
                        {{ fmt(parseFloat(txn.total)) }}
                      </div>
                    </button>
                    <div v-if="selectedCustomerTxns.length === 0" class="pos-profile__empty-note">No purchases yet</div>
                  </div>

                  <div class="pos-profile__section-title">Notes</div>
                  <div class="pos-profile__card pos-profile__card--notes">
                    {{ selectedCustomer.notes ?? 'No notes' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ── TRANSACTIONS VIEW ───────────────────────────── -->
            <div v-else-if="posView === 'transactions'" class="pos-history-pane">
              <div class="pos-pane-head">
                <div class="pos-pane-head__title">History</div>
                <div class="pos-pane-head__sub">{{ store.activeLocation?.name }}</div>
              </div>

              <div class="pos-history-pane__chips" role="group" aria-label="Show">
                <PosChip
                  v-for="f in HISTORY_FILTERS"
                  :key="f.value"
                  :active="historyFilter === f.value"
                  @click="historyFilter = f.value"
                >
                  {{ f.label }}
                </PosChip>
              </div>

              <div class="pos-history-pane__scroll">
                <template v-for="group in historyGroups" :key="group.label">
                  <div class="pos-history-group">{{ group.label }}</div>
                  <button
                    v-for="txn in group.txns"
                    :key="txn.id"
                    class="pos-history-row"
                    @click="openTxnDetail(txn)"
                  >
                    <div>
                      <div class="pos-history-row__id">{{ txn.orderNumber }}</div>
                      <div class="pos-history-row__meta">
                        {{ timeLabel(txn.date) }}<template v-if="txn.customer.name !== 'Walk-in customer'"> · {{ txn.customer.name }}</template> · {{ txn.itemCount }} item{{ txn.itemCount !== 1 ? 's' : '' }} · {{ txn.paymentMethod }}
                      </div>
                    </div>
                    <div class="pos-history-row__right">
                      <PosBadge v-if="txn.paymentStatus !== 'Paid'" :tone="statusPill(txn).tone">{{ statusPill(txn).label }}</PosBadge>
                      <span class="pos-history-row__total" :class="parseFloat(txn.total) < 0 ? 'pos-history-row__total--neg' : ''">
                        {{ fmt(parseFloat(txn.total)) }}
                      </span>
                      <v-icon size="14" color="#9ca3af">chevron-right</v-icon>
                    </div>
                  </button>
                </template>

                <div v-if="historyGroups.length === 0" class="pos-catalog__empty">
                  <v-icon size="32" class="text-medium-emphasis">receipt</v-icon>
                  <div>{{ historyFilter === 'refunds' ? 'No refunds yet' : 'No transactions yet' }}</div>
                </div>
              </div>
            </div>

            <!-- ── SETTINGS VIEW ──────────────────────────────── -->
            <div v-else-if="posView === 'settings'" class="pos-settings">
              <div class="pos-pane-head">
                <div class="pos-pane-head__title">Settings</div>
              </div>

              <div class="pos-settings__scroll">
                <div class="pos-settings__group-label">Receipt</div>
                <div class="pos-settings__group">
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">receipt-text</v-icon></div>
                    <div>
                      <div class="pos-setting-row__label">Template</div>
                      <div class="pos-setting-row__sub">Set for {{ store.activeChannel?.name ?? 'this channel' }} in Retail › Receipts</div>
                    </div>
                    <div class="pos-setting-row__value">{{ receiptTemplate.name }}</div>
                  </div>
                  <div class="pos-receipt-settings-preview" aria-hidden="true">
                    <ReceiptPaper :doc="receiptSettingsPreview" :scale="0.7" />
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">printer</v-icon></div>
                    <div class="pos-setting-row__label">Print receipt</div>
                    <v-switch v-model="posSettings.printReceipt" color="#0d9488" hide-details density="compact" class="pos-setting-row__control" />
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">mail</v-icon></div>
                    <div class="pos-setting-row__label">Email receipt</div>
                    <v-switch v-model="posSettings.emailReceipt" color="#0d9488" hide-details density="compact" class="pos-setting-row__control" />
                  </div>
                </div>

                <div class="pos-settings__group-label">Taxes</div>
                <div class="pos-settings__group">
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">landmark</v-icon></div>
                    <div>
                      <div class="pos-setting-row__label">Tax</div>
                      <div class="pos-setting-row__sub">Set by {{ store.activeLocation.name }}<template v-if="store.activeLocation.region"> ({{ store.activeLocation.region }})</template></div>
                    </div>
                    <div class="pos-setting-row__value">{{ taxRuleSummary(taxRule) }}</div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">coins</v-icon></div>
                    <div>
                      <div class="pos-setting-row__label">Cash rounding</div>
                      <div class="pos-setting-row__sub">Cash totals round to the nearest 5c; card is exact</div>
                    </div>
                    <div class="pos-setting-row__value">{{ roundsCash ? 'On' : 'Off' }}</div>
                  </div>
                </div>

                <div class="pos-settings__group-label">Payments</div>
                <div class="pos-settings__group">
                  <div v-for="t in TENDER_ORDER" :key="t" class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">{{ TENDER_ICONS[t] }}</v-icon></div>
                    <div class="pos-setting-row__label">{{ TENDER_DISPLAY[t] }}</div>
                    <v-switch
                      :model-value="posSettings.enabledTenders[t]"
                      color="#0d9488"
                      hide-details
                      density="compact"
                      class="pos-setting-row__control"
                      @update:model-value="toggleTender(t)"
                    />
                  </div>
                </div>

                <div class="pos-settings__group-label">Hardware</div>
                <div class="pos-settings__group">
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">credit-card</v-icon></div>
                    <div class="pos-setting-row__label">{{ activeRegister.pairedTerminal ?? 'No terminal paired' }}</div>
                    <div class="pos-setting-row__value">
                      <span class="pos-status-dot" :class="activeRegister.pairedTerminal ? 'pos-status-dot--online' : 'pos-status-dot--off'" />
                      {{ activeRegister.pairedTerminal ? 'Connected' : 'Not paired' }}
                    </div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">printer</v-icon></div>
                    <div class="pos-setting-row__label">{{ activeRegister.pairedPrinter ?? 'No printer paired' }}</div>
                    <div class="pos-setting-row__value">
                      <span class="pos-status-dot" :class="activeRegister.pairedPrinter ? 'pos-status-dot--online' : 'pos-status-dot--off'" />
                      {{ activeRegister.pairedPrinter ? 'Connected' : 'Not paired' }}
                    </div>
                  </div>
                  <div v-if="activeRegister.pendingOfflineTxns > 0" class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">cloud-off</v-icon></div>
                    <div class="pos-setting-row__label">Offline queue</div>
                    <div class="pos-setting-row__value">{{ activeRegister.pendingOfflineTxns }} transaction{{ activeRegister.pendingOfflineTxns !== 1 ? 's' : '' }}</div>
                  </div>
                </div>

                <div class="pos-settings__group-label">Register</div>
                <div class="pos-settings__group">
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">map-pin</v-icon></div>
                    <div class="pos-setting-row__label">Location</div>
                    <div class="pos-setting-row__value">{{ store.activeLocation?.name }}</div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">monitor</v-icon></div>
                    <div class="pos-setting-row__label">Register</div>
                    <div class="pos-setting-row__value">{{ activeRegister.name }}</div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">smartphone</v-icon></div>
                    <div class="pos-setting-row__label">Device</div>
                    <div class="pos-setting-row__value">{{ activeRegister.deviceModel }}</div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">badge-check</v-icon></div>
                    <div class="pos-setting-row__label">App version</div>
                    <div class="pos-setting-row__value">{{ activeRegister.appVersion }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── GET APP VIEW ───────────────────────────────── -->
            <div v-else-if="posView === 'getapp'" class="pos-getapp-pane">

              <!-- Android: real APK download -->
              <template v-if="isAndroidDevice">
                <div class="pos-getapp-pane__icon">
                  <v-icon size="36" color="primary">tablet</v-icon>
                </div>
                <div class="pos-getapp-pane__title">Install Retail POS</div>
                <div class="pos-getapp-pane__sub">Scan the QR code with your Android device or tap Download to install the app directly.</div>

                <!-- QR code (served by qrserver.com using local APK URL) -->
                <div class="pos-getapp-qr">
                  <img
                    :src="apkQrUrl"
                    alt="QR code to download Retail POS APK"
                    width="160"
                    height="160"
                    style="border-radius: 12px; display: block;"
                  />
                  <div class="pos-getapp-qr__label">Scan with Android camera</div>
                </div>

                <!-- Download button -->
                <a
                  href="/retail-cloud-pos.apk"
                  download="RetailCloudPOS.apk"
                  class="pos-getapp-download-btn"
                >
                  <v-icon size="16" style="margin-right: 6px;">download</v-icon>
                  Download APK
                </a>

                <!-- Version info -->
                <div class="pos-getapp-badge">
                  v1.4.2 &nbsp;·&nbsp; ~204 MB &nbsp;·&nbsp; Android 8.0+
                </div>

                <!-- Pairing instructions -->
                <div class="pos-getapp-steps">
                  <div class="pos-getapp-steps__title">After installing:</div>
                  <div class="pos-getapp-steps__step"><span class="pos-getapp-steps__num">1</span>Open the app on your device</div>
                  <div class="pos-getapp-steps__step"><span class="pos-getapp-steps__num">2</span>Tap <strong>Settings → Pair Device</strong></div>
                  <div class="pos-getapp-steps__step"><span class="pos-getapp-steps__num">3</span>Enter the pairing code shown in <strong>Registers → Pair register</strong></div>
                </div>
              </template>

              <!-- iPad / iPhone: TestFlight -->
              <template v-else>
                <div class="pos-getapp-pane__icon">
                  <v-icon size="36" color="primary">apple</v-icon>
                </div>
                <div class="pos-getapp-pane__title">Install via TestFlight</div>
                <div class="pos-getapp-pane__sub">Retail POS for iOS is distributed to beta testers via Apple TestFlight.</div>

                <button class="pos-getapp-download-btn" style="border: none; cursor: pointer;" @click="apkToast = true">
                  <v-icon size="16" style="margin-right: 6px;">mail</v-icon>
                  Send TestFlight invite
                </button>

                <div class="pos-getapp-badge">
                  v1.4.2 &nbsp;·&nbsp; iOS 15.0+ &nbsp;·&nbsp; iPad &amp; iPhone
                </div>

                <div class="pos-getapp-steps">
                  <div class="pos-getapp-steps__title">Or contact your account manager for an iOS invite code.</div>
                </div>
              </template>
            </div>

          </div><!-- pos-layout -->

          <!-- ── Variant picker sheet (Shopify POS style) ──────── -->
          <PosSheet
            v-model="variantPickerOpen"
            :tall="isPhone"
            :title="variantPickerGroup?.baseName"
            :subtitle="`${variantPickerGroup?.variants.length} variants available`"
            close-label="Close variants"
          >
            <template #lead>
              <div class="pos-sheet-thumb" :style="{ background: posArt(variantPickerGroup?.representative.sku ?? '') }">
                <v-icon size="16">package</v-icon>
              </div>
            </template>
            <div class="pos-sheet-list">
              <button
                v-for="v in variantPickerGroup?.variants"
                :key="v.sku"
                class="pos-variant-row"
                @click="selectVariant(v)"
              >
                <div class="pos-variant-row__swatch" :style="{ background: posArt(v.sku) }" />
                <div class="pos-variant-row__info">
                  <div class="pos-variant-row__label">{{ parseTileProduct(v.productName).variant }}</div>
                  <div class="pos-variant-row__sku">SKU: {{ v.sku }}</div>
                </div>
                <PosBadge v-if="onHandHere(v.sku) < 8" :tone="posStock(onHandHere(v.sku))!.tone" :icon="posStock(onHandHere(v.sku))!.icon">
                  {{ posStock(onHandHere(v.sku))!.label }}
                </PosBadge>
                <div class="pos-variant-row__price">{{ fmt(v.pos) }}</div>
                <v-icon size="14" class="pos-chevron">chevron-right</v-icon>
              </button>
            </div>
          </PosSheet>

          <!-- ── Line actions sheet (tap a cart line → edit menu) ── -->
          <PosSheet
            :model-value="lineActionsOpen && !!lineActionsLine"
            :subtitle="`SKU: ${lineActionsLine?.sku}`"
            close-label="Close line actions"
            :tall="isPhone"
            @close="lineActionsOpen = false"
          >
            <template #lead>
              <div class="pos-sheet-thumb" :style="{ background: posArt(lineActionsLine?.sku ?? '') }">
                <v-icon size="16">package</v-icon>
              </div>
            </template>
            <template #title>
              {{ lineActionsLine?.name }}<template v-if="lineActionsLine?.variant"> — {{ lineActionsLine.variant }}</template>
            </template>

            <template v-if="lineActionsLine">
              <!-- MENU MODE: qty stepper + action rows -->
              <template v-if="lineSheetMode === 'menu'">
                <div class="pos-line-sheet__qty">
                  <PosButton
                    variant="secondary"
                    :icon="lineActionsLine.qty <= 1 ? 'trash-2' : 'minus'"
                    :aria-label="lineActionsLine.qty <= 1 ? 'Remove item' : 'Decrease quantity'"
                    @click="sheetDecrementQty"
                  />
                  <span class="pos-qty-value pos-qty-value--lg" aria-live="polite">{{ lineActionsLine.qty }}</span>
                  <PosButton variant="secondary" icon="plus" aria-label="Increase quantity" @click="incrementQty(lineActionsLine.id)" />
                </div>

                <div class="pos-sheet-list">
                  <button class="pos-line-sheet__action" @click="openPriceMode">
                    <v-icon size="15" class="pos-line-sheet__action-icon">pencil</v-icon>
                    <div class="pos-line-sheet__action-info">
                      <div class="pos-line-sheet__action-label">Override price</div>
                      <div class="pos-line-sheet__action-sub">
                        {{ fmt(lineActionsLine.price) }} ea
                        <s v-if="isOverridden(lineActionsLine)">{{ fmt(lineActionsLine.originalPrice) }}</s>
                      </div>
                    </div>
                    <v-icon size="14" class="pos-chevron">chevron-right</v-icon>
                  </button>
                  <button class="pos-line-sheet__action" @click="openNoteMode">
                    <v-icon size="15" class="pos-line-sheet__action-icon">sticky-note</v-icon>
                    <div class="pos-line-sheet__action-info">
                      <div class="pos-line-sheet__action-label">{{ lineActionsLine.note ? 'Edit note' : 'Add note' }}</div>
                      <div v-if="lineActionsLine.note" class="pos-line-sheet__action-sub pos-line-sheet__action-sub--clamp">{{ lineActionsLine.note }}</div>
                    </div>
                    <v-icon size="14" class="pos-chevron">chevron-right</v-icon>
                  </button>
                  <button class="pos-line-sheet__action" @click="openDiscountMode">
                    <v-icon size="15" class="pos-line-sheet__action-icon">percent</v-icon>
                    <div class="pos-line-sheet__action-info">
                      <div class="pos-line-sheet__action-label">{{ lineActionsLine.discount ? 'Edit discount' : 'Apply discount' }}</div>
                      <div v-if="lineView(lineActionsLine).notes.length" class="pos-line-sheet__action-sub">
                        {{ lineView(lineActionsLine).notes.map((n) => n.label).join(' · ') }}
                      </div>
                    </div>
                    <v-icon size="14" class="pos-chevron">chevron-right</v-icon>
                  </button>
                  <button class="pos-line-sheet__action pos-line-sheet__action--danger" @click="removeLineFromSheet">
                    <v-icon size="15" class="pos-line-sheet__action-icon">trash-2</v-icon>
                    <div class="pos-line-sheet__action-info">
                      <div class="pos-line-sheet__action-label">Remove item</div>
                    </div>
                  </button>
                </div>
              </template>

              <!-- PRICE MODE -->
              <div v-else-if="lineSheetMode === 'price'" class="pos-line-sheet__form">
                <PosField
                  id="pos-line-price"
                  v-model="pendingPrice"
                  label="Unit price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputmode="decimal"
                  :hint="isOverridden(lineActionsLine) ? `Original price ${fmt(lineActionsLine.originalPrice)}` : undefined"
                />
                <PosButton @click="applyPriceOverride">Apply</PosButton>
                <PosButton v-if="isOverridden(lineActionsLine)" variant="ghost" tone="danger" @click="removePriceOverride">
                  Remove override
                </PosButton>
                <PosButton variant="ghost" @click="lineSheetMode = 'menu'">Back</PosButton>
              </div>

              <!-- DISCOUNT MODE -->
              <div v-else-if="lineSheetMode === 'discount'" class="pos-line-sheet__form">
                <MpSegmentedControl
                  :model-value="lineEntry.kind"
                  :items="[{ value: 'percent', label: 'Percent' }, { value: 'amount', label: 'Amount' }]"
                  ariaLabel="Discount type"
                  @update:model-value="(v) => { if (v) { lineEntry.kind = v as LineDiscount['kind']; lineEntry.value = '' } }"
                />
                <PosField
                  id="pos-line-discount"
                  v-model="lineEntry.value"
                  :label="lineEntry.kind === 'percent' ? 'Percent off this line' : 'Amount off this line'"
                  type="number"
                  min="0"
                  :step="lineEntry.kind === 'percent' ? 1 : 0.01"
                  inputmode="decimal"
                  :placeholder="lineEntry.kind === 'percent' ? '10' : '5.00'"
                  :error="entryError(lineEntry) || undefined"
                  :hint="`Line total becomes ${fmt(lineEntryPreview)}`"
                />
                <div v-if="lineEntry.kind === 'percent'" class="pos-chip-row" role="group" aria-label="Quick percentages">
                  <PosChip
                    v-for="p in PERCENT_PRESETS"
                    :key="p"
                    :active="lineEntry.value === String(p)"
                    @click="lineEntry.value = String(p)"
                  >
                    {{ p }}%
                  </PosChip>
                </div>
                <div id="pos-line-reason-label" class="pos-group-label">Reason</div>
                <div class="pos-chip-row" role="group" aria-labelledby="pos-line-reason-label">
                  <PosChip
                    v-for="r in DISCOUNT_REASONS"
                    :key="r"
                    :active="lineEntry.reason === r"
                    @click="lineEntry.reason = r"
                  >
                    {{ r }}
                  </PosChip>
                </div>
                <PosButton @click="applyLineDiscount">Apply discount</PosButton>
                <PosButton v-if="lineActionsLine.discount" variant="ghost" tone="danger" @click="removeLineDiscount">
                  Remove discount
                </PosButton>
                <PosButton variant="ghost" @click="lineSheetMode = 'menu'">Back</PosButton>
              </div>

              <!-- NOTE MODE -->
              <div v-else class="pos-line-sheet__form">
                <PosField
                  id="pos-line-note"
                  v-model="pendingNote"
                  label="Line note"
                  :rows="3"
                  placeholder="e.g. Gift wrap this item"
                />
                <PosButton @click="saveLineNote">Save note</PosButton>
                <PosButton variant="ghost" @click="lineSheetMode = 'menu'">Back</PosButton>
              </div>
            </template>
          </PosSheet>

          <!-- ── Customer picker sheet (search real customers, attach loyalty, inline create) ── -->
          <PosSheet
            v-model="customerPickerOpen"
            title="Attach customer"
            subtitle="Link loyalty, purchase history & receipts"
            close-label="Close customer search"
            tall
          >
            <!-- Currently attached -->
            <div v-if="attachedCustomer" class="pos-customer-picker__attached">
              <div class="pos-customer-row__avatar" :style="{ background: posArt(String(attachedCustomer.id)) }">{{ posInitials(attachedCustomer.name) }}</div>
              <div class="pos-customer-picker__attached-body">
                <div class="pos-customer-picker__attached-name">
                  {{ attachedCustomer.name }}
                  <PosTierChip :tier="attachedCustomer.tier" />
                </div>
                <div class="pos-customer-picker__attached-meta">On this sale · {{ attachedCustomer.points.toLocaleString() }} pts</div>
              </div>
              <PosButton variant="ghost" tone="danger" @click="detachCustomer">Remove</PosButton>
            </div>

            <!-- Search -->
            <div class="pos-customer-picker__search">
              <v-text-field
                ref="customerPickerFieldRef"
                v-model="customerPickerSearch"
                placeholder="Search name, email or phone"
                aria-label="Search customers"
                density="compact"
                variant="solo"
                flat
                prepend-inner-icon="search"
                hide-details
                clearable
                bg-color="surface"
                rounded="lg"
                style="font-size: 13px;"
                @keydown.enter="attachTopResult"
              />
            </div>

            <!-- Results -->
            <div class="pos-sheet-list pos-customer-picker__list">
              <div v-if="!customerPickerSearch.trim()" class="pos-customer-picker__section">Top customers</div>
              <button
                v-for="c in customerPickerResults"
                :key="c.id"
                class="pos-customer-row"
                :class="{ 'pos-customer-row--selected': attachedCustomerId === c.id }"
                @click="attachExistingCustomer(c)"
              >
                <div class="pos-customer-row__avatar" :style="{ background: posArt(String(c.id)) }">{{ posInitials(c.name) }}</div>
                <div class="pos-customer-row__body">
                  <div class="pos-customer-row__name">{{ c.name }}</div>
                  <div class="pos-customer-row__email">{{ c.email }}</div>
                </div>
                <div class="pos-customer-row__chips">
                  <PosTierChip :tier="c.tier" />
                  <span class="pos-customer-row__spend">{{ fmt(c.lifetimeSpend) }}</span>
                </div>
              </button>

              <div v-if="customerPickerResults.length === 0" class="pos-customer-picker__empty">
                <v-icon size="26" class="pos-chevron">user-search</v-icon>
                <div class="pos-customer-picker__empty-title">No match for “{{ customerPickerSearch.trim() }}”</div>
              </div>
            </div>

            <!-- Create CTA -->
            <button class="pos-customer-picker__create-cta" @click="startCreateFromPicker">
              <v-icon size="16">user-plus</v-icon>
              <span>Create new customer<template v-if="customerPickerSearch.trim()"> “{{ customerPickerSearch.trim() }}”</template></span>
            </button>
          </PosSheet>

          <!-- ── Stock at other locations sheet ───────────────── -->
          <PosSheet
            v-model="otherLocationsOpen"
            :tall="isPhone"
            title="Stock at other locations"
            :subtitle="`${selectedVariant?.productName} · ${selectedVariant?.sku}`"
          >
            <template #lead>
              <div class="pos-sheet-thumb" :style="{ background: posArt(selectedVariant?.sku ?? '') }">
                <v-icon size="16">map-pin</v-icon>
              </div>
            </template>
            <div class="pos-sheet-list">
              <div v-for="row in otherLocationRows" :key="row.loc.id" class="pos-variant-row pos-variant-row--static">
                <div class="pos-variant-row__swatch" :style="{ background: posArt(row.loc.id) }" />
                <div class="pos-variant-row__info">
                  <div class="pos-variant-row__label">{{ row.loc.name }}</div>
                  <div class="pos-variant-row__sku">{{ row.loc.kind === 'warehouse' ? 'Warehouse' : row.loc.address }}</div>
                </div>
                <div class="pos-variant-row__price">{{ row.qty }}</div>
                <PosBadge :tone="posStock(row.qty)!.tone" :icon="posStock(row.qty)!.icon">{{ posStock(row.qty)!.label }}</PosBadge>
              </div>
            </div>
          </PosSheet>

          <!-- ── Oversell sheet: a shortfall is decided before the line is added ── -->
          <PosSheet
            :model-value="!!oversellItem"
            :title="oversellItem ? (onHandHere(oversellItem.sku) === 0 ? 'Out of stock at this store' : `All ${onHandHere(oversellItem.sku)} on hand are already on the sale`) : undefined"
            :subtitle="`${oversellItem?.productName} · ${store.activeLocation.name}`"
            :tall="isPhone"
            @close="oversellItem = null"
          >
            <template #lead>
              <div class="pos-sheet-thumb pos-sheet-thumb--warn">
                <v-icon size="18">package-x</v-icon>
              </div>
            </template>
            <div v-if="oversellItem" class="pos-sheet-body">
              <p class="pos-sheet-copy">
                If the customer is holding it, sell it anyway — the line is flagged so stock gets recounted.
                Otherwise, check whether another store has one.
              </p>
              <div v-if="oversellShowStores" class="pos-sheet-list pos-sheet-body__list">
                <div v-for="row in otherLocationStock(oversellItem.sku)" :key="row.loc.id" class="pos-variant-row pos-variant-row--static">
                  <div class="pos-variant-row__info">
                    <div class="pos-variant-row__label">{{ row.loc.name }}</div>
                    <div class="pos-variant-row__sku">{{ row.loc.kind === 'warehouse' ? 'Warehouse' : row.loc.address }}</div>
                  </div>
                  <div class="pos-variant-row__price">{{ row.qty }}</div>
                  <PosBadge :tone="posStock(row.qty)!.tone" :icon="posStock(row.qty)!.icon">{{ posStock(row.qty)!.label }}</PosBadge>
                </div>
              </div>
              <div class="pos-sheet-actions">
                <PosButton variant="ghost" :aria-expanded="oversellShowStores" @click="oversellShowStores = !oversellShowStores">
                  {{ oversellShowStores ? 'Hide other stores' : 'Check other stores' }}
                </PosButton>
                <PosButton @click="sellAnyway">Sell anyway</PosButton>
              </div>
            </div>
          </PosSheet>

          <!-- ── Open price sheet: unpriced items and custom sales ─────── -->
          <PosSheet
            :model-value="!!openPriceTarget"
            :title="openPriceTarget?.editableName ? 'Custom item' : 'Enter a price'"
            :subtitle="openPriceTarget?.editableName ? 'Sells as a one-off line on this sale' : `${openPriceTarget?.name} has no register price`"
            close-label="Cancel"
            :tall="isPhone"
            @close="openPriceTarget = null"
          >
            <form v-if="openPriceTarget" class="pos-line-sheet__form" novalidate @submit.prevent="confirmOpenPrice">
              <PosField
                v-if="openPriceTarget.editableName"
                id="pos-openprice-name"
                v-model="openPriceName"
                label="Item name"
                placeholder="Hem alteration"
                autocomplete="off"
              />
              <PosField
                id="pos-openprice-value"
                v-model="openPriceValue"
                label="Price"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                placeholder="25.00"
                :error="openPriceError || undefined"
                :hint="taxRule.mode === 'inclusive'
                  ? `Enter the shelf price — it includes ${taxRule.components.map((c) => c.label).join(' + ')}`
                  : `${taxRule.components.map((c) => c.label).join(' + ')} is added at checkout`"
              />
              <PosButton type="submit">Add to sale</PosButton>
              <PosButton variant="ghost" @click="openPriceTarget = null">Cancel</PosButton>
            </form>
          </PosSheet>

          <!-- ── Customer sheet: New customer, Edit details, and who is on the sale — one form ── -->
          <PosSheet
            :model-value="customerSheetOpen && (customerSheetMode === 'create' || !!customerSheetCustomer)"
            :title="customerSheetMode === 'create' ? 'New customer' : customerSheetMode === 'edit' ? 'Edit customer details' : customerSheetCustomer?.name"
            :subtitle="customerSheetCustomer
              ? `${LOYALTY_TIER_LABELS[customerSheetCustomer.tier]} · ${customerSheetCustomer.points.toLocaleString()} pts · ${customerSheetCustomer.visits} visits`
              : `Joins as a Member at ${store.activeLocation.name}${createAttaches ? ' · goes on this sale' : ''}`"
            :close-label="customerSheetMode === 'create' ? 'Close new customer' : 'Close customer details'"
            tall
            @close="closeCustomerSheet"
          >
            <template #lead>
              <div class="pos-customer-row__avatar" :style="{ background: posArt(String(customerSheetCustomer?.id ?? 'new')) }">
                <v-icon v-if="customerSheetMode === 'create' && !draftName" size="16">user-plus</v-icon>
                <template v-else>{{ posInitials(customerSheetMode === 'create' ? draftName : customerSheetCustomer?.name ?? '') }}</template>
              </div>
            </template>

            <!-- VIEW -->
            <div v-if="customerSheetMode === 'view' && customerSheetCustomer" class="pos-sheet-body">
              <div class="pos-profile__card">
                <div class="pos-setting-row">
                  <div class="pos-setting-row__icon"><v-icon size="15">mail</v-icon></div>
                  <div class="pos-setting-row__label">{{ customerSheetCustomer.email || 'No email on file' }}</div>
                </div>
                <div class="pos-setting-row">
                  <div class="pos-setting-row__icon"><v-icon size="15">phone</v-icon></div>
                  <div class="pos-setting-row__label">{{ customerSheetCustomer.phone || 'No mobile on file' }}</div>
                </div>
                <div v-if="customerSheetCustomer.notes" class="pos-setting-row">
                  <div class="pos-setting-row__icon"><v-icon size="15">sticky-note</v-icon></div>
                  <div class="pos-setting-row__label">{{ customerSheetCustomer.notes }}</div>
                </div>
                <div class="pos-setting-row">
                  <div class="pos-setting-row__icon"><v-icon size="15">receipt-text</v-icon></div>
                  <div class="pos-setting-row__label">
                    {{ customerSheetContact?.customFields?.emailReceipts === true ? 'Email receipts on' : 'Printed receipts' }} ·
                    {{ customerSheetContact?.optedInEmail || customerSheetContact?.optedInSms ? 'Marketing opted in' : 'No marketing' }}
                  </div>
                </div>
              </div>
              <div class="pos-sheet-actions pos-sheet-actions--stack">
                <PosButton icon="pencil" @click="startCustomerEdit">Edit details</PosButton>
                <PosButton variant="ghost" @click="hideCustomerSheet(); openCustomerPicker()">Change customer</PosButton>
                <PosButton
                  v-if="attachedCustomerId === customerSheetCustomer.id"
                  variant="ghost"
                  tone="danger"
                  @click="detachCustomer"
                >
                  Remove from sale
                </PosButton>
              </div>
            </div>

            <!-- NEW / EDIT — same fields, checks and consent either way -->
            <form v-else class="pos-sheet-body pos-customer-form" novalidate @submit.prevent="saveCustomer">
              <div class="pos-customer-form__names">
                <v-text-field
                  id="pos-cust-firstName"
                  v-model="customerDraft.firstName"
                  label="First name *"
                  autocomplete="given-name"
                  :error-messages="customerErrors.firstName"
                />
                <v-text-field
                  v-model="customerDraft.lastName"
                  label="Last name"
                  autocomplete="family-name"
                />
              </div>
              <v-text-field
                id="pos-cust-phone"
                v-model="customerDraft.phone"
                label="Mobile"
                hint="Overseas number? Start with + and the country code"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :placeholder="phoneExample(posCountry)"
                :error-messages="customerErrors.phone"
              />
              <v-text-field
                id="pos-cust-email"
                v-model="customerDraft.email"
                label="Email"
                type="email"
                inputmode="email"
                autocomplete="email"
                placeholder="name@example.com"
                :error-messages="customerErrors.email"
              />
              <PosNotice v-if="showCustomerErrors && customerValidation.duplicate" icon="users" role="alert">
                <span>
                  {{ customerValidation.duplicate.name }} already has this {{ customerValidation.duplicate.field === 'email' ? 'email' : 'mobile' }}.
                  Keep one profile per shopper.
                </span>
                <PosButton variant="link" @click="useDuplicateCustomer">
                  {{ duplicateGoesToSale ? 'Use' : 'Open' }} {{ customerValidation.duplicate.name }}
                </PosButton>
              </PosNotice>
              <v-textarea
                v-model="customerDraft.note"
                label="Note for staff"
                rows="3"
                placeholder="Size M in outerwear"
              />
              <MpFormField
                label="Contact preferences"
                hint="Marketing needs the customer’s yes — ask before switching it on."
              >
                <template #default="{ labelId, descriptionId }">
                  <div class="pos-customer-form__consent" role="group" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                    <v-switch v-model="customerDraft.emailReceipts" label="Email receipts" color="var(--mp-color-light-pos-accentInk)" />
                    <v-switch v-model="customerDraft.marketingEmail" label="Marketing emails" color="var(--mp-color-light-pos-accentInk)" />
                    <v-switch v-model="customerDraft.marketingSms" label="Marketing SMS" color="var(--mp-color-light-pos-accentInk)" />
                  </div>
                </template>
              </MpFormField>
              <div class="pos-customer-form__readonly">
                <v-icon size="14">lock</v-icon>
                {{ customerSheetMode === 'create' ? 'New customers start as Member with 0 points.' : 'Tier and points are managed in back office.' }}
              </div>
              <PosNotice v-if="confirmDiscard" tone="warn" icon="triangle-alert" role="alert">
                <span>Discard your changes?</span>
                <PosButton variant="link" @click="confirmDiscard = false">Keep editing</PosButton>
                <PosButton variant="link" tone="danger" @click="discardCustomerEdit">Discard</PosButton>
              </PosNotice>
              <div class="pos-sheet-actions">
                <PosButton variant="ghost" @click="cancelCustomerEdit">Cancel</PosButton>
                <PosButton type="submit">
                  {{ customerSheetMode === 'create' ? (createAttaches ? 'Create & add to sale' : 'Create customer') : 'Save details' }}
                </PosButton>
              </div>
            </form>
          </PosSheet>

          <!-- ── Receipt sheet: the sale's receipt, from this channel's template ── -->
          <PosSheet
            :model-value="!!receiptSheet"
            close-label="Close receipt"
            tall
            @close="receiptSheet = null"
          >
            <template #lead>
              <div class="pos-sheet-thumb pos-sheet-thumb--accent">
                <v-icon size="18">{{ receiptSheet?.delivery === 'print' ? 'printer' : 'mail' }}</v-icon>
              </div>
            </template>
            <template #title>
              <template v-if="receiptSheet?.delivery === 'print'">
                {{ receiptPrinter ? `Printed on ${receiptPrinter}` : 'No receipt printer on this register' }}
              </template>
              <template v-else>{{ receiptSheet?.sent ? `Emailed to ${receiptSheet.email}` : 'Email the receipt' }}</template>
            </template>
            <template #subtitle>
              {{ receiptSheet?.number }} · {{ receiptTemplate.name }} template<template v-if="receiptSheet?.delivery === 'email'"> · “{{ receiptSubject }}”</template>
            </template>

            <template v-if="receiptSheet">
              <div class="pos-sheet-body">
                <PosNotice v-if="receiptSheet.delivery === 'print' && !receiptPrinter" tone="warn" icon="printer-x" role="alert">
                  <span>{{ activeRegister.name }} has no printer paired.</span>
                  <PosButton variant="link" @click="emailInsteadOfPrint">Email it instead</PosButton>
                </PosNotice>

                <form
                  v-if="receiptSheet.delivery === 'email' && !receiptSheet.sent"
                  class="pos-receipt-sheet__email"
                  novalidate
                  @submit.prevent="sendReceiptEmail"
                >
                  <PosField
                    id="pos-receipt-email"
                    v-model="receiptSheet.email"
                    label="Email address"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    :error="receiptEmailError || undefined"
                    hint="Sent once. It doesn’t sign the shopper up for marketing."
                  />
                  <PosButton type="submit">Send receipt</PosButton>
                </form>

                <div v-if="receiptNeedsBuyer && receiptSheet.sale.buyer" class="pos-receipt-sheet__buyer">
                  <PosNotice icon="file-text" role="note">
                    <span>Tax invoices of $1,000 or more need the buyer's name or ABN. It prints as you type.</span>
                  </PosNotice>
                  <PosField
                    id="pos-receipt-buyer"
                    v-model="receiptSheet.sale.buyer.name"
                    label="Buyer name"
                    autocomplete="organization"
                    placeholder="Coastal Fitout Pty Ltd"
                  />
                  <PosField
                    id="pos-receipt-abn"
                    v-model="receiptSheet.sale.buyer.abn"
                    label="Buyer ABN (optional)"
                    inputmode="numeric"
                    placeholder="98 765 432 109"
                  />
                </div>

                <div v-if="receiptDoc" class="pos-receipt-sheet__paper">
                  <ReceiptPaper :doc="receiptDoc" :scale="0.9" />
                </div>
              </div>

              <div class="pos-receipt-sheet__footer">
                <PosButton block @click="receiptSheet = null">Done</PosButton>
              </div>
            </template>
          </PosSheet>

          <!-- ── Transaction detail sheet ─────────────────────── -->
          <PosSheet
            :model-value="!!detailTxn"
            close-label="Close transaction"
            tall
            @close="closeTxnDetail"
          >
            <template #title>
              <span class="pos-txn-sheet__id">{{ detailTxn?.orderNumber }}</span>
            </template>
            <template #aside>
              <PosBadge v-if="detailTxn" :tone="statusPill(detailTxn).tone">{{ statusPill(detailTxn).label }}</PosBadge>
            </template>

            <div v-if="detailTxn" class="pos-txn-sheet">
              <div class="pos-txn-sheet__meta">
                <div class="pos-txn-sheet__meta-row"><span>Date</span><span>{{ dayLabel(detailTxn.date) }} · {{ timeLabel(detailTxn.date) }}</span></div>
                <div class="pos-txn-sheet__meta-row"><span>Staff</span><span>{{ store.staffName(detailTxn.pos?.staffId ?? '') }}</span></div>
                <div class="pos-txn-sheet__meta-row"><span>Register</span><span>{{ store.registerName(detailTxn.pos?.registerId ?? '') }}</span></div>
                <div class="pos-txn-sheet__meta-row"><span>Customer</span><span>{{ detailTxn.customer.name }}</span></div>
                <div class="pos-txn-sheet__meta-row"><span>Tender</span><span><v-icon v-if="detailTxn.tenders?.[0]" size="13" class="pos-txn-sheet__tender-icon">{{ TENDER_ICONS[detailTxn.tenders[0].type] }}</v-icon>{{ detailTxn.paymentMethod }}</span></div>
              </div>

              <div v-if="detailTxn.lineItems.length" class="pos-txn-sheet__lines">
                <div v-for="l in detailTxn.lineItems" :key="l.sku" class="pos-txn-sheet__line">
                  <div class="pos-variant-row__swatch" :style="{ background: posArt(l.sku) }" />
                  <span class="pos-txn-sheet__line-name">{{ l.product }} ×{{ l.qty }}</span>
                  <span class="pos-txn-sheet__line-total">{{ fmt(parseFloat(l.price) * l.qty) }}</span>
                </div>
                <PosTotals
                  class="pos-txn-sheet__totals"
                  :subtotal="fmt(detailSubtotal)"
                  :taxes="[{ label: 'Tax', amount: fmt(Math.abs(parseFloat(detailTxn.total)) - detailSubtotal) }]"
                  :total="fmt(parseFloat(detailTxn.total))"
                />
              </div>
              <div v-else class="pos-txn-sheet__no-lines">
                {{ detailTxn.itemCount }} item{{ detailTxn.itemCount !== 1 ? 's' : '' }} — line detail unavailable
              </div>

              <div class="pos-txn-sheet__actions">
                <PosButton variant="secondary" size="lg" icon="printer" @click="printDetailReceipt">Print</PosButton>
                <PosButton variant="secondary" size="lg" icon="mail" @click="emailDetailReceipt">Email</PosButton>
                <PosButton
                  v-if="detailTxn.status === 'completed'"
                  variant="secondary"
                  size="lg"
                  tone="danger"
                  icon="rotate-ccw"
                  @click="refundDetailTxn"
                >
                  Refund
                </PosButton>
              </div>
            </div>
          </PosSheet>

          <!-- ── Payment sheet (in-frame slide-up; mirrors the variant-sheet pattern) ── -->
          <transition name="pos-variant-up">
            <div v-if="paymentStep !== 'idle'" class="pos-payment-overlay">
              <div class="pos-payment-sheet" role="dialog" aria-modal="true" aria-label="Take payment">

                <!-- Sheet grabber -->
                <div class="pos-payment-sheet__grabber" />

                <!-- Select tender -->
                <template v-if="paymentStep === 'select'">
                  <div class="pos-payment-sheet__head">
                    <div class="pos-payment-sheet__eyebrow">{{ selectedTender === 'cash' ? 'Cash to collect' : 'Tender amount' }}</div>
                    <div class="pos-payment-sheet__amount">{{ fmt(amountDue) }}</div>
                    <div v-if="selectedTender === 'cash' && cashRounding !== 0" class="pos-payment-sheet__rounding">
                      Sale total {{ fmt(grandTotal) }} · rounded {{ cashRounding > 0 ? 'up' : 'down' }} {{ fmt(Math.abs(cashRounding)) }} (no 1c coins)
                    </div>
                  </div>

                  <div class="pos-tender-list">
                    <PosTenderRow
                      v-for="t in enabledTenderList"
                      :key="t"
                      :label="TENDER_DISPLAY[t]"
                      :icon="TENDER_ICONS[t]"
                      :selected="selectedTender === t"
                      @click="selectTender(t)"
                    />
                  </div>

                  <PosNotice v-if="saleNeedsBuyer" class="pos-payment-sheet__notice" icon="file-text" role="note">
                    <span>Over $1,000: the tax invoice needs the buyer's name or ABN.</span>
                    <PosButton variant="link" @click="paymentStep = 'idle'; openCustomerPicker()">Add customer</PosButton>
                    <span>or enter it on the receipt.</span>
                  </PosNotice>

                  <!-- Cash: what was handed over → change due -->
                  <div v-if="selectedTender === 'cash'" class="pos-cash">
                    <div id="pos-cash-quick-label" class="pos-group-label">Amount handed over</div>
                    <div class="pos-chip-row" role="group" aria-labelledby="pos-cash-quick-label">
                      <PosChip
                        v-for="a in cashQuickAmounts"
                        :key="a"
                        size="lg"
                        :active="cashTendered === a"
                        @click="cashInput = a.toFixed(2)"
                      >
                        {{ a === cashDue ? `Exact ${fmt(a)}` : fmt(a) }}
                      </PosChip>
                    </div>
                    <PosField
                      id="pos-cash-input"
                      v-model="cashInput"
                      label="Other amount handed over"
                      hide-label
                      type="number"
                      min="0"
                      step="0.05"
                      inputmode="decimal"
                      placeholder="Other amount"
                      aria-describedby="pos-cash-change"
                    />
                  </div>

                  <!-- Pinned: change due + the charge button never scroll out of reach -->
                  <div class="pos-payment-sheet__footer">
                    <div
                      v-if="selectedTender === 'cash'"
                      id="pos-cash-change"
                      class="pos-cash__change"
                      :class="{ 'pos-cash__change--short': cashShort, 'pos-cash__change--ready': cashTendered !== null && !cashShort }"
                      aria-live="polite"
                    >
                      <template v-if="cashShort">Short by {{ fmt(changeDue(cashDue, cashTendered ?? 0)) }}</template>
                      <template v-else-if="cashTendered !== null">Change due <strong>{{ fmt(cashChange) }}</strong></template>
                      <template v-else>Pick or key in the amount handed over</template>
                    </div>
                    <div class="pos-payment-sheet__actions">
                      <PosButton variant="secondary" size="lg" @click="paymentStep = 'idle'">Cancel</PosButton>
                      <PosButton size="lg" class="pos-payment-sheet__charge" :disabled="!canCharge" @click="processPayment">
                        {{ selectedTender === 'cash' ? `Take cash ${fmt(cashDue)}` : `Charge ${fmt(grandTotal)}` }}
                      </PosButton>
                    </div>
                  </div>
                </template>

                <!-- Processing -->
                <template v-else-if="paymentStep === 'processing'">
                  <div class="pos-payment-sheet__center">
                    <v-progress-circular aria-hidden="true" indeterminate color="primary" size="52" class="mb-4" />
                    <div class="pos-payment-sheet__big-title">Processing…</div>
                    <div class="pos-payment-sheet__sub">{{ PROCESSING_TEXT[selectedTender] }}</div>
                  </div>
                </template>

                <!-- Approved -->
                <template v-else-if="paymentStep === 'approved'">
                  <div class="pos-payment-sheet__center">
                    <div class="pos-approved-icon">
                      <v-icon size="56" color="success">circle-check-big</v-icon>
                    </div>
                    <div class="pos-payment-sheet__big-title">Approved</div>
                    <div class="pos-payment-sheet__big-amount">{{ fmt(amountDue) }}</div>
                    <div class="pos-payment-sheet__sub">Paid via {{ TENDER_DISPLAY[selectedTender] }}</div>
                    <div v-if="selectedTender === 'cash' && cashChange > 0" class="pos-cash__change pos-cash__change--ready pos-cash__change--big">
                      Change due <strong>{{ fmt(cashChange) }}</strong>
                    </div>
                  </div>

                  <div class="pos-payment-sheet__receipt-actions">
                    <PosButton variant="secondary" size="lg" icon="mail" @click="completeApproved('email')">Email receipt</PosButton>
                    <PosButton variant="secondary" size="lg" icon="printer" @click="completeApproved('print')">Print receipt</PosButton>
                    <PosButton size="lg" @click="completeApproved(null)">Done</PosButton>
                  </div>
                </template>
              </div>
            </div>
          </transition>

        </div><!-- pos-screen -->

        <!-- Bezel bottom (home area) -->
        <div class="pos-device-frame__bezel-bottom">
          <div class="pos-device-frame__home" />
        </div>
      </div><!-- pos-device-frame -->
    </div><!-- pos-stage -->

    <!-- Discounts dialog: coupon code + whole-sale discount (item discounts live on each line) -->
    <MpDialog v-model="discountDialogOpen" size="sm" title="Discounts" subtitle="Item discounts are on each line — tap the line.">
      <v-text-field
        v-model="couponInput"
        label="Coupon code"
        placeholder="REFER20"
        autocomplete="off"
        autocapitalize="characters"
        :error-messages="couponError"
        :hint="appliedCoupon ? `${appliedCoupon.code} is applied — a new code replaces it` : ''"
        persistent-hint
        @update:model-value="couponError = ''"
        @keydown.enter="applyDiscounts"
      />
      <MpSegmentedControl
        :model-value="orderEntry.kind"
        :items="[{ value: 'percent', label: 'Percent' }, { value: 'amount', label: 'Amount' }]"
        ariaLabel="Whole-sale discount type"
        @update:model-value="(v) => { if (v) { orderEntry.kind = v as LineDiscount['kind']; orderEntry.value = '' } }"
      />
      <v-text-field
        v-model="orderEntry.value"
        :label="orderEntry.kind === 'percent' ? 'Discount the whole sale (%)' : 'Discount the whole sale'"
        type="number"
        inputmode="decimal"
        :placeholder="orderEntry.kind === 'percent' ? '10' : '20.00'"
        :suffix="orderEntry.kind === 'percent' ? '%' : undefined"
        :error-messages="entryErrors(orderEntry).value"
      />
      <MpFormField label="Reason" :error="orderEntry.value.trim() ? entryErrors(orderEntry).reason : undefined">
        <template #default="{ labelId }">
          <v-chip-group v-model="orderEntry.reason" :aria-labelledby="labelId" selected-class="text-primary">
            <v-chip v-for="r in DISCOUNT_REASONS" :key="r" :value="r" filter variant="outlined">{{ r }}</v-chip>
          </v-chip-group>
        </template>
      </MpFormField>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="discountDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="applyDiscounts">Apply</v-btn>
      </template>
    </MpDialog>

    <!-- Sale complete toast -->
    <v-snackbar v-model="saleCompleteVisible" :timeout="3000" color="success" location="top right">
      <div class="d-flex align-center ga-2">
        <v-icon size="18">circle-check-big</v-icon>
        <div>
          <div class="font-weight-bold">Sale complete — {{ lastTxnId }}</div>
          <div style="font-size: 12px;">Transaction added to Retail records</div>
        </div>
      </div>
    </v-snackbar>

    <!-- Suspend snackbar -->
    <v-snackbar v-model="suspendSnackbar" :timeout="2500" location="top">
      <v-icon size="16" class="mr-2">pause-circle</v-icon>
      Sale suspended — cart saved for later
    </v-snackbar>

    <!-- TestFlight invite snackbar -->
    <v-snackbar v-model="apkToast" :timeout="3000" location="top">
      <v-icon size="16" class="mr-2">mail</v-icon>
      TestFlight invite sent to your email
    </v-snackbar>

    <!-- Undo toast (clear sale, remove item / customer / coupon) -->
    <v-snackbar v-model="undoToast.open" :timeout="6000" location="top">
      {{ undoToast.text }}
      <template #actions>
        <v-btn variant="text" class="text-none" @click="runUndo">Undo</v-btn>
      </template>
    </v-snackbar>

    <!-- Smart-grid action toast -->
    <v-snackbar v-model="gridToast" :timeout="2200" location="top">
      <v-icon size="16" class="mr-2">check-circle</v-icon>
      {{ gridToastText }}
    </v-snackbar>

  </div>
</template>

<style scoped lang="scss">
/* ── Shell ─────────────────────────────────────────────────────── */
.pos-preview-shell {
  /* Sanctioned fixed-look POS mock: pin the retail accent to its light value so this
     terminal never shifts color under the dark-mode cloud-accent override. */
  --cloud-retail-accent: var(--mp-color-light-pos-accent);
  width: 100vw;
  height: 100vh;
  background: color-mix(in oklch, var(--text-primary) 6%, var(--surface-primary));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ────────────────────────────────────────────────────── */
/* Page chrome (header + stage) is app UI and sits on tokens; only the device mock
   below is the sanctioned fixed-look surface. */
.pos-header {
  display: flex;
  align-items: center;
  gap: var(--mp-space-16);
  padding: var(--mp-space-10) var(--mp-space-20);
  background: var(--surface-primary);
  color: var(--on-surface);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  flex-wrap: wrap;

  &__back {
    color: var(--on-surface-muted);
    font-size: var(--mp-text-label-fontSize);
  }

  &__title {
    display: flex;
    align-items: center;
    font-weight: var(--mp-fontWeight-semibold);
    font-size: var(--mp-text-body-fontSize);
    color: var(--on-surface);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--mp-space-12);
    margin-left: auto;
    flex-wrap: wrap;
  }

  &__location {
    min-width: var(--mp-component-menu-minWidth);
    max-width: var(--mp-component-toolbar-searchMinWidth);
  }
}

.offline-badge {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: var(--mp-text-eyebrow-letterSpacing);
  color: var(--on-warn);
  background: var(--warn);
  padding: var(--mp-space-2) var(--mp-space-6);
  border-radius: var(--mp-radius-4);
}

/* ── Stage ─────────────────────────────────────────────────────── */
.pos-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--mp-space-24);
  overflow: auto;
}

/* ── Device frame ──────────────────────────────────────────────── */
.pos-device-frame {
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 24px;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.08),
    0 32px 80px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: width 280ms ease, height 280ms ease;

  &__bezel-top {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    flex-shrink: 0;
  }

  &__camera {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #333;
    box-shadow: inset 0 0 0 1.5px #444;
  }

  &__bezel-bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    flex-shrink: 0;
  }

  &__home {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
  }
}

/* ── Screen ────────────────────────────────────────────────────── */
.pos-screen {
  flex: 1;
  background: rgb(var(--v-theme-surface));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative; // needed to contain the variant-picker overlay
}

/* ── Offline banner ────────────────────────────────────────────── */
.pos-offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

/* ── POS layout ────────────────────────────────────────────────── */
.pos-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Rail ──────────────────────────────────────────────────────── */
/* POS palette — short names for the color.light.pos.* tokens (contrast-checked in tokens.json).
   Shared with src/components/pos; see Storybook › Product › POS › Foundations. */
$pos-ink: var(--mp-color-light-pos-ink);
$pos-muted: var(--mp-color-light-pos-muted);
$pos-hairline: var(--mp-color-light-pos-hairline);
$pos-surface: var(--mp-color-light-pos-surface);
$pos-bg: var(--mp-color-light-pos-background);
$pos-success-ink: var(--mp-color-light-pos-successInk);
$pos-success-soft: var(--mp-color-light-pos-successSoft);
$pos-warn-ink: var(--mp-color-light-pos-warnInk);
$pos-warn-soft: var(--mp-color-light-pos-warnSoft);
$pos-danger-ink: var(--mp-color-light-pos-dangerInk);
$pos-danger-soft: var(--mp-color-light-pos-dangerSoft);
$pos-accent-ink: var(--mp-color-light-pos-accentInk);
$pos-accent-soft: var(--mp-color-light-pos-accentSoft);
// Minimum touch target: Apple HIG 44pt (Material asks 48dp — Android tablets get the 48 rows below)
$pos-target: var(--mp-component-pos-touchTarget);

.pos-rail {
  width: 72px;
  flex-shrink: 0;
  background: $pos-ink;
  display: flex;
  flex-direction: column;
  padding: 10px 0;

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin: 0 auto 14px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    padding: 0 8px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px;
    border-radius: 10px;
    cursor: pointer;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
    font-size: 10px;
    font-weight: 500;
    transition: background 120ms, color 120ms;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.95);
    }

    &--active {
      background: rgba(13, 148, 136, 0.22);
      color: #5eead4;
      font-weight: 600;
    }
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding: 10px;
  }

  &__staff {
    cursor: pointer;
  }
}

/* ── Main pane (smart-grid or catalog) ─────────────────────────── */
.pos-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $pos-bg;
  overflow: hidden;
}

.pos-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  flex-shrink: 0;

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: $pos-ink;
    letter-spacing: -0.2px;
  }

  &__sub {
    font-size: 12px;
    font-weight: 600;
    color: $pos-muted;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: none;
    position: relative;
    padding: 4px 8px;
    border-radius: 6px;
    color: $pos-muted;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &::before { content: ''; position: absolute; inset: -9px 0; } // 44px hit area, header keeps its height
    &:hover { background: rgba(17, 24, 39, 0.05); color: $pos-ink; }
  }
}

/* ── Smart Grid (Shopify-iconic home tiles) ─────────────────────── */
.pos-smartgrid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 4px 18px 18px;
  overflow-y: auto;
  align-content: start;
}

.pos-smartgrid__tile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: $pos-surface;
  border: 1px solid $pos-hairline;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  min-height: 110px;
  transition: transform 120ms, box-shadow 120ms, border-color 120ms;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(17, 24, 39, 0.06);
    border-color: rgba(17, 24, 39, 0.12);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(17, 24, 39, 0.05);
  }
}

.pos-smartgrid__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

.pos-smartgrid__label {
  font-size: 13px;
  font-weight: 600;
  color: $pos-ink;
  line-height: 1.35;
  margin-top: auto;
}

/* ── Catalog ───────────────────────────────────────────────────── */
.pos-scanbar {
  padding: 0 18px 10px;
  flex-shrink: 0;

  :deep(.v-field) {
    background: $pos-surface !important;
    border: 1px solid $pos-hairline;
    border-radius: 12px !important;
  }
  :deep(.v-field:focus-within) {
    border-color: rgba(17, 24, 39, 0.25);
    box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
  }
}

.pos-catalog {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__chips {
    display: flex;
    gap: 6px;
    padding: 0 18px 12px;
    overflow-x: auto;
    flex-shrink: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 0 18px 18px;
    overflow-y: auto;
    align-content: start;
  }

  &__empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: $pos-muted;
    font-size: 12px;
    gap: 8px;
    text-align: center;
  }

  &__empty-title { font-size: 14px; font-weight: 600; color: $pos-ink; }
  &__empty-sub   { font-size: 12px; margin-bottom: 4px; }
}

/* Stock on the tile — so a shortage is seen before it is tapped */
/* ── Cart panel (Shopify-style) ────────────────────────────────── */
.pos-cart {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: $pos-surface;
  border-left: 1px solid $pos-hairline;

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 18px 10px;
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: $pos-ink;
    letter-spacing: -0.2px;
  }

  &__count {
    font-size: 12px;
    color: $pos-muted;
    font-weight: 500;
  }

  &__lines {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0 8px;
    // Scroll shadows: a soft edge appears only where more lines are hidden
    background:
      linear-gradient($pos-surface 30%, rgba(255, 255, 255, 0)) top / 100% 24px no-repeat local,
      linear-gradient(rgba(255, 255, 255, 0), $pos-surface 70%) bottom / 100% 24px no-repeat local,
      radial-gradient(farthest-side at 50% 0, rgba(17, 24, 39, 0.14), transparent) top / 100% 10px no-repeat scroll,
      radial-gradient(farthest-side at 50% 100%, rgba(17, 24, 39, 0.14), transparent) bottom / 100% 10px no-repeat scroll;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 32px 24px;
    text-align: center;
  }

  &__empty-illo {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(17, 24, 39, 0.04);
    margin-bottom: 14px;
  }

  &__empty-title {
    font-size: 14px;
    font-weight: 600;
    color: $pos-ink;
    margin-bottom: 4px;
  }

  &__empty-sub {
    font-size: 12px;
    color: $pos-muted;
    margin-bottom: 16px;
  }

  &__empty-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__totals {
    padding: 12px 18px;
    border-top: 1px solid $pos-hairline;
    flex-shrink: 0;
  }

  &__secondary {
    display: flex;
    gap: 6px;
    padding: 8px 18px 0;
    flex-shrink: 0;
  }
}

/* One note per reason the line costs less (or needs a look) — icon + words, never colour alone */

/* Small icon button whose hit area still reaches 44px */
.pos-qty-value {
  font-size: 12.5px;
  font-weight: 700;
  color: $pos-ink;
  min-width: 18px;
  text-align: center;

  &--lg {
    font-size: 15px;
    min-width: 32px;
  }
}

/* ── History pane ──────────────────────────────────────────────── */
.pos-history-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__chips {
    display: flex;
    gap: 6px;
    padding: 4px 16px 10px;
    flex-shrink: 0;
  }

  &__scroll {
    flex: 1;
    overflow-y: auto;
  }
}

.pos-history-group {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: $pos-muted;
  background: $pos-bg;
}

.pos-history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-bottom: 1px solid color-mix(in oklch, var(--text-primary) 5%, transparent);
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &:hover { background: color-mix(in oklch, var(--text-primary) 2%, transparent); }

  &__id {
    font-size: 12px;
    font-weight: 600;
    color: $pos-ink;
    font-family: monospace;
  }

  &__meta {
    font-size: 11px;
    color: $pos-muted;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__total {
    font-size: 13px;
    font-weight: 700;
    color: $pos-ink;

    &--neg { color: #ef4444; }
  }
}

/* ── Payment sheet (in-frame slide-up, contained by .pos-screen) ── */
.pos-payment-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.pos-payment-sheet {
  display: flex;
  flex-direction: column;
  background: $pos-surface;
  border-radius: 20px 20px 0 0;
  padding: 14px 24px 24px;
  width: min(440px, calc(100% - 32px));
  max-height: 88%;
  overflow-y: auto;
  box-shadow: 0 -16px 64px rgba(15, 23, 42, 0.25);
  pointer-events: all;
  animation: pos-sheet-up 240ms cubic-bezier(0.16, 1, 0.3, 1);

  &__grabber {
    width: 38px;
    height: 4px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.12);
    margin: 0 auto 14px;
  }

  &__head {
    text-align: center;
    margin-bottom: 18px;
  }

  &__eyebrow {
    font-size: 11px;
    font-weight: 600;
    color: $pos-muted;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  &__amount {
    font-size: 36px;
    font-weight: 800;
    color: $pos-ink;
    letter-spacing: -0.8px;
    line-height: 1.1;
    margin-top: 4px;
  }

  &__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px 0 12px;
  }

  &__big-title {
    font-size: 18px;
    font-weight: 700;
    color: $pos-ink;
    margin-bottom: 4px;
  }

  &__big-amount {
    font-size: 32px;
    font-weight: 800;
    color: $pos-ink;
    letter-spacing: -0.6px;
    margin: 4px 0 8px;
  }

  &__sub {
    font-size: 13px;
    color: $pos-muted;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
  }

  &__receipt-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 18px;
  }
}

@keyframes pos-sheet-up {
  from { transform: translateY(20%); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

.pos-approved-icon {
  margin-bottom: 8px;
}

/* ── Tender rows (full-width Shopify list) ─────────────────────── */
.pos-tender-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Get App pane ───────────────────────────────────────────────── */
.pos-getapp-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 32px 24px 24px;
  overflow-y: auto;
  text-align: center;
  gap: 12px;

  &__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: color-mix(in oklch, var(--cloud-retail-accent) 12%, var(--surface-primary));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  &__sub {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
    max-width: 280px;
  }
}

.pos-getapp-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);

  &__label {
    font-size: 11px;
    color: var(--muted);
    font-weight: 500;
  }
}

.pos-getapp-download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  border-radius: 10px;
  background: var(--cloud-retail-accent);
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  gap: 6px;
  transition: opacity 120ms;

  &:hover { opacity: 0.88; }
}

.pos-getapp-badge {
  font-size: 11px;
  color: var(--muted);
  background: color-mix(in oklch, var(--text-primary) 6%, transparent);
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.2px;
}

.pos-getapp-steps {
  width: 100%;
  max-width: 300px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__title {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  &__step {
    font-size: 12px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.4;
  }

  &__num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--cloud-retail-accent);
    color: white;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* ── Variant row ───────────────────────────────────────────────── */
.pos-variant-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid $pos-hairline;
  transition: background 80ms;
  width: 100%;

  &:last-child { border-bottom: none; }
  &:hover      { background: rgba(17, 24, 39, 0.03); }
  &:active     { background: rgba(17, 24, 39, 0.07); }

  &__swatch {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: $pos-ink;
  }

  &__sku {
    font-size: 10px;
    color: $pos-muted;
    margin-top: 1px;
  }

  &__price {
    font-size: 13px;
    font-weight: 700;
    color: $pos-ink;
    flex-shrink: 0;
  }
}

/* ── Line actions sheet (tap a cart line) ──────────────────────── */
.pos-line-sheet {
  &__qty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 12px 14px;
    border-bottom: 1px solid $pos-hairline;
    flex-shrink: 0;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid $pos-hairline;
    transition: background 80ms;
    width: 100%;

    &:last-child { border-bottom: none; }
    &:hover      { background: rgba(17, 24, 39, 0.03); }
    &:active     { background: rgba(17, 24, 39, 0.07); }
  }

  &__action-info { flex: 1; min-width: 0; }

  &__action-label {
    font-size: 13px;
    font-weight: 600;
    color: $pos-ink;
  }

  &__action-icon { color: $pos-muted; }

  &__action--danger &__action-label,
  &__action--danger &__action-icon { color: $pos-danger-ink; }

  &__action-sub {
    font-size: 11px;
    color: $pos-muted;
    margin-top: 1px;

    s { margin-left: 4px; }

    &--clamp {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px 6px;
  }
}

/* ── Payment sheet slide-up (PosSheet owns the other sheets' motion) ── */
.pos-variant-up-enter-active {
  animation: pos-sheet-up 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.pos-variant-up-leave-active {
  animation: pos-sheet-up 160ms cubic-bezier(0.55, 0, 1, 0.45) reverse;
}

/* ── Customer picker sheet ─────────────────────────────────────── */
.pos-customer-picker {
  &__attached {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 14px 0;
    padding: 9px 10px 9px 12px;
    border-radius: 12px;
    background: color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 8%, transparent);
    border: 1px solid color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 22%, transparent);
    flex-shrink: 0;

    &-body { flex: 1; min-width: 0; }

    &-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: $pos-ink;
    }

    &-meta {
      font-size: 11px;
      color: $pos-muted;
      margin-top: 2px;
    }
  }

  &__search {
    padding: 10px 14px 8px;
    flex-shrink: 0;

    :deep(.v-field) {
      background: $pos-bg !important;
      border-radius: 10px !important;
    }
    :deep(.v-field:focus-within) {
      box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
    }
  }

  &__section {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $pos-muted;
    padding: 2px 14px 6px;
  }

  &__list { flex: 1; }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 26px 20px;
    text-align: center;

    &-title {
      font-size: 12.5px;
      font-weight: 600;
      color: $pos-muted;
    }
  }

  &__create-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 8px 14px;
    padding: 12px;
    border: 1px dashed color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 45%, $pos-hairline);
    border-radius: 12px;
    background: $pos-surface;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--cloud-retail-accent, #0d9488);
    cursor: pointer;
    flex-shrink: 0;

    &:hover { background: color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 6%, transparent); }

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

}

/* ── Cart line enter animation ─────────────────────────────────── */
.pos-line-in-enter-active {
  transition: opacity 140ms ease, transform 140ms ease;
}
.pos-line-in-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

/* ── Customers screen ──────────────────────────────────────────── */
.pos-customers {
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
  background: $pos-bg;

  &__list {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: $pos-surface;
    border-right: 1px solid $pos-hairline;
    overflow: hidden;
  }

  &__search { padding: 0 12px 10px; }

  &__rows {
    flex: 1;
    overflow-y: auto;
  }

  &__detail {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }

  &__detail-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 24px;
    text-align: center;
  }

  &__detail-empty-title {
    font-size: 14px;
    font-weight: 700;
    color: $pos-ink;
  }

  &__detail-empty-sub {
    font-size: 12px;
    color: $pos-muted;
    max-width: 240px;
  }
}

/* ── Products screen (catalog lookup + details panel) ──────────── */
.pos-products {
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
  background: $pos-bg;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* Mirrors .pos-cart so Sale → Products keeps a stable right-panel width */
  &__detail {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: $pos-surface;
    border-left: 1px solid $pos-hairline;
    padding: 16px 18px;
    overflow-y: auto;
  }

  &__detail-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__detail-thumb {
    width: 40px;
    height: 40px;
    border-radius: 9px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__detail-id { flex: 1; min-width: 0; }

  &__detail-name {
    font-size: 15px;
    font-weight: 700;
    color: $pos-ink;
    letter-spacing: -0.2px;
    line-height: 1.3;
  }

  &__detail-sku {
    font-size: 11px;
    color: $pos-muted;
    margin-top: 1px;
  }

  &__detail-price {
    font-size: 26px;
    font-weight: 800;
    color: $pos-ink;
    letter-spacing: -0.4px;
    margin: 10px 0 6px;
  }

  &__stockrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .pos-pane-head__link { padding-left: 4px; }
  }

  &__options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__detail-spacer { flex: 1; min-height: 16px; }

  .pos-products__add { margin-top: var(--mp-space-12); }
}

.pos-variant-row--static {
  cursor: default;

  &:hover,
  &:active { background: transparent; }
}

.pos-customer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid color-mix(in oklch, var(--text-primary) 5%, transparent);
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &:hover { background: rgba(17, 24, 39, 0.03); }

  &--selected {
    background: color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 7%, transparent);
    box-shadow: inset 2px 0 0 var(--cloud-retail-accent, #0d9488);
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: rgba(17, 24, 39, 0.6);
  }

  &__body { flex: 1; min-width: 0; }

  &__name {
    font-size: 12.5px;
    font-weight: 600;
    color: $pos-ink;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 11px;
    color: $pos-muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chips {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    flex-shrink: 0;
  }

  &__spend {
    font-size: 11px;
    font-weight: 600;
    color: $pos-muted;
  }
}

.pos-profile {
  padding: 16px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 560px;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    align-self: flex-start;
    border: none;
    background: none;
    padding: 4px 8px 4px 2px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: $pos-muted;
    cursor: pointer;

    &:hover { color: $pos-ink; }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: $pos-surface;
    border: 1px solid $pos-hairline;
    border-radius: 12px;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: rgba(17, 24, 39, 0.6);
  }

  &__id { flex: 1; min-width: 0; }

  &__name {
    font-size: 16px;
    font-weight: 700;
    color: $pos-ink;
    letter-spacing: -0.2px;
  }

  &__meta {
    font-size: 11.5px;
    color: $pos-muted;
    margin-top: 2px;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  &__section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $pos-muted;
    margin-top: 6px;
  }

  &__card {
    background: $pos-surface;
    border: 1px solid $pos-hairline;
    border-radius: 12px;
    overflow: hidden;

    &--notes {
      padding: 12px 14px;
      font-size: 12px;
      color: $pos-muted;
      line-height: 1.5;
    }

    .pos-history-row:last-child,
    .pos-setting-row:last-child { border-bottom: none; }
  }

  &__empty-note {
    padding: 14px;
    font-size: 12px;
    color: $pos-muted;
  }
}

.pos-stat {
  background: $pos-surface;
  border: 1px solid $pos-hairline;
  border-radius: 12px;
  padding: 12px 14px;

  &__value {
    font-size: 18px;
    font-weight: 800;
    color: $pos-ink;
    letter-spacing: -0.4px;
  }

  &__label {
    font-size: 11px;
    color: $pos-muted;
    margin-top: 2px;
  }
}

.pos-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: none;
  border-radius: 9px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;

  &--primary {
    background: $pos-ink;
    color: #fff;

    &:hover { background: #000; }
  }

  &--attached {
    background: color-mix(in oklch, var(--cloud-retail-accent, #0d9488) 10%, transparent);
    color: var(--cloud-retail-accent, #0d9488);
    cursor: default;
  }
}

/* ── Settings screen ───────────────────────────────────────────── */
.pos-settings {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: $pos-bg;

  &__scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 18px 24px;
    max-width: 560px;
    width: 100%;
  }

  &__group-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $pos-muted;
    margin: 16px 0 6px;
  }

  &__group {
    background: $pos-surface;
    border: 1px solid $pos-hairline;
    border-radius: 12px;
    overflow: hidden;

    .pos-setting-row:last-child { border-bottom: none; }
  }
}

.pos-setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in oklch, var(--text-primary) 5%, transparent);

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(17, 24, 39, 0.05);
    color: $pos-muted;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: $pos-ink;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sub {
    font-size: 11px;
    color: $pos-muted;
    margin-top: 1px;
  }

  &__value {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $pos-muted;
    flex-shrink: 0;
  }

  &__control { flex-shrink: 0; }

  &--stacked {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;

    .pos-setting-row__label { flex: none; }
  }

  // The label sits inside a wrapping div on two-line rows
  > div:not([class]) { flex: 1; min-width: 0; }
}

.pos-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &--online { background: #16a34a; }
  &--off    { background: #9ca3af; }
}

/* Settings: the template this register prints, cropped to its top */
.pos-receipt-settings-preview {
  display: flex;
  justify-content: center;
  max-height: 240px;
  margin: 4px 14px 12px;
  padding-top: 12px;
  overflow: hidden;
  border-radius: 10px;
  background: $pos-bg;
}

/* ── Transaction detail sheet ──────────────────────────────────── */
.pos-txn-sheet {
  display: flex;
  flex-direction: column;
  padding: 0 var(--mp-space-16) var(--mp-space-14);
  overflow-y: auto;

  &__id { font-family: var(--mp-fontFamily-mono); }

  &__tender-icon { margin-right: var(--mp-space-4); }

  &__totals { padding-top: var(--mp-space-8); }

  &__meta {
    padding: 10px 0;
    border-bottom: 1px solid $pos-hairline;
  }

  &__meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    font-size: 12px;

    > span:first-child { color: $pos-muted; }
    > span:last-child { color: $pos-ink; font-weight: 600; }
  }

  &__lines { padding: 10px 0 4px; }

  &__line {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
  }

  &__line-name {
    flex: 1;
    min-width: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: $pos-ink;
  }

  &__line-total {
    font-size: 12.5px;
    font-weight: 700;
    color: $pos-ink;
  }

  &__no-lines {
    padding: 14px 0;
    font-size: 12px;
    color: $pos-muted;
  }

  &__actions {
    display: flex;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid $pos-hairline;

    > * { flex: 1; }
  }
}

/* ── Tactile press states ──────────────────────────────────────── */
.pos-smartgrid__tile:active { transform: scale(0.98); }
.pos-rail__item:active { background: rgba(255, 255, 255, 0.12); }

/* ════ POS interior breakpoints — .pos-screen--phone / --tablet ════
   Class driven by the measured .pos-screen width (useElementSize):
   wide ≥960 · tablet 600–959 · phone <600. Works inside simulated
   device frames and on real devices (frame width is CSS-clamped). */

/* — Tablet portrait: 2-pane retained, narrower cart — */
.pos-screen--tablet .pos-cart { width: 280px; }
.pos-screen--tablet .pos-products__detail { width: 280px; }

/* — Phone: single column · rail → bottom tab bar · cart → sheet — */
.pos-screen--phone {
  .pos-layout { flex-direction: column; }

  /* Left rail becomes the bottom tab bar (same DOM, same active styles) */
  .pos-rail {
    order: 3;
    width: 100%;
    height: auto;
    flex-direction: row;
    padding: 4px 8px calc(4px + env(safe-area-inset-bottom, 0px));

    .pos-rail__brand,
    .pos-rail__footer { display: none; }

    .pos-rail__nav {
      flex-direction: row;
      flex: 1;
      gap: 0;
      padding: 0;
    }

    .pos-rail__item {
      flex: 1;
      gap: 2px;
      padding: 6px 2px;
      border-radius: 8px;
    }
  }

  .pos-main { order: 1; }
  .pos-cartbar { order: 2; }
  .pos-customers, .pos-products, .pos-history-pane, .pos-settings { order: 1; }

  /* Full cart panel becomes a slide-up sheet over the screen */
  .pos-cart {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: calc(100% - 48px);
    border-left: none;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.25);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    z-index: 15;
    transform: translateY(102%);
    visibility: hidden;
    transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s 240ms;

    &.pos-cart--open {
      transform: translateY(0);
      visibility: visible;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
    }
  }

  /* Products: detail panel becomes a slide-up sheet (same treatment as the cart) */
  .pos-products__detail {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: calc(100% - 48px);
    border-left: none;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.25);
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 15;
    transform: translateY(102%);
    visibility: hidden;
    transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s 240ms;

    &.pos-products__detail--open {
      transform: translateY(0);
      visibility: visible;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
    }
  }

  /* Catalog: 2-col grid, tighter gutters */
  .pos-pane-head { padding: 12px 12px 8px; }
  .pos-scanbar, .pos-catalog__chips { padding-left: 12px; padding-right: 12px; }
  .pos-catalog__grid { grid-template-columns: repeat(2, 1fr); padding: 0 12px 12px; }
  .pos-smartgrid { padding: 4px 12px 12px; }

  /* Customers: master-detail collapses to a single pane (list ⇄ detail) */
  .pos-customers__list { width: 100%; border-right: none; }
  .pos-customers__detail { display: none; }
  .pos-customers--detail .pos-customers__list { display: none; }
  .pos-customers--detail .pos-customers__detail { display: block; }

  /* Settings/profile content uses the full width */
  .pos-settings__scroll { padding: 0 12px 20px; max-width: none; }
  .pos-profile { max-width: none; padding: 12px 12px 20px; }

  /* Sheets: full width, taller */
  .pos-payment-sheet {
    width: 100%;
    max-height: 92%;
    padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  }
}

/* — Phone-only elements (rendered only when isPhone) — */
.pos-cart-scrim {
  position: absolute;
  inset: 0;
  z-index: 14;
  background: rgba(15, 23, 42, 0.42);
}

.pos-cartbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: $pos-surface;
  border-top: 1px solid $pos-hairline;
  flex-shrink: 0;

  &__summary {
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: $pos-ink;
  }
}

.pos-cart__collapse {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-left: auto;
  border: none;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.07);
  color: $pos-muted;
  cursor: pointer;

  &:hover { background: rgba(17, 24, 39, 0.12); }
}

/* ── Responsive page chrome (Vuetify breakpoints) ─────────────── */
/* Mobile (xs <600): stack header, allow frame to use full width */
@media (max-width: 600px) {
  .pos-preview-shell {
    --frame-margin: 16px;
    --frame-chrome: 180px;
  }

  .pos-header {
    padding: var(--mp-space-10) var(--mp-space-12);
    gap: var(--mp-space-8);

    &__back  { font-size: var(--mp-text-caption-fontSize); }
    &__title { display: none; }
    &__controls {
      width: 100%;
      margin-left: 0;
      justify-content: space-between;
      gap: var(--mp-space-8);
    }
  }

  .pos-stage { padding: var(--mp-space-12); }

  .pos-device-frame__bezel-top,
  .pos-device-frame__bezel-bottom { height: 18px; }
}

/* ── POS components (src/components/pos): layout hooks only — the components own their look ── */
.pos-cart__customer { margin: 0 18px 8px; }
.pos-cart__secondary > * { flex: 1; }
.pos-cart__clear { margin-left: 8px; } // the destructive action stands apart
.pos-cart__charge { flex-shrink: 0; margin: 12px 18px 18px; }
.pos-payment-sheet__charge { flex: 1; }

.pos-sheet-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

// Fills PosSheet's 40px lead square
.pos-sheet-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(var(--mp-rgb-color-light-pos-ink), 0.4);

  &--warn { background: $pos-warn-soft; color: $pos-warn-ink; }
  &--accent { background: $pos-accent-soft; color: $pos-accent-ink; }
}

.pos-chevron { color: $pos-muted; }

// Names a chip group the way PosField names an input
.pos-group-label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
  color: $pos-muted;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Cashier pass: shared sheet body, chips, alerts, cash ──────── */
.pos-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 8px;
  overflow-y: auto;

  &__list {
    max-height: 200px;
    border: 1px solid $pos-hairline;
    border-radius: 12px;
  }
}

.pos-sheet-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: $pos-muted;
}

.pos-sheet-actions {
  display: flex;
  gap: 8px;

  > * { flex: 1; }

  &--stack { flex-direction: column; }
}

.pos-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pos-customer-form {
  gap: 16px;

  &__names {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  &__consent {
    display: flex;
    flex-direction: column;
  }

  &__readonly {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $pos-muted;
  }

  // Save stays reachable without scrolling past the consent toggles
  .pos-sheet-actions {
    position: sticky;
    bottom: -8px;
    margin: 0 -14px -8px;
    padding: 8px 14px;
    background: $pos-surface;
    border-top: 1px solid $pos-hairline;
  }
}

.pos-payment-sheet__footer {
  position: sticky;
  bottom: -24px;
  margin: 0 -24px -24px;
  padding: 12px 24px 24px;
  background: $pos-surface;
  border-top: 1px solid $pos-hairline;

  .pos-cash__change { margin-bottom: 10px; text-align: center; }
}

.pos-receipt-sheet {
  &__email {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__paper {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-radius: 12px;
    background: $pos-bg;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    padding: 8px 14px 4px;
    border-top: 1px solid $pos-hairline;
  }
}

.pos-payment-sheet__notice { margin: 4px 0 12px; }

.pos-receipt-sheet__buyer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pos-payment-sheet__rounding {
  margin-top: 4px;
  font-size: 12px;
  color: $pos-muted;
}

.pos-cash {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 18px 12px;
  scroll-margin-bottom: 160px; // clears the pinned change-due footer when scrolled into view

  &__change {
    min-height: 24px;
    font-size: 14px;
    color: $pos-muted;

    strong { font-size: 20px; }

    &--ready { color: $pos-success-ink; font-weight: 600; }
    &--short { color: $pos-danger-ink; font-weight: 600; }
    &--big   { margin-top: 12px; font-size: 16px; strong { font-size: 28px; } }
  }
}

/* Small tablet (sm 601–960): tighten chrome but keep layout intact */
@media (min-width: 601px) and (max-width: 960px) {
  .pos-preview-shell { --frame-margin: 32px; }
  .pos-header        { padding: var(--mp-space-10) var(--mp-space-16); gap: var(--mp-space-12); }
  .pos-stage         { padding: var(--mp-space-16); }
}
</style>
