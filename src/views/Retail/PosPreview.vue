<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import { useContactsStore, LOYALTY_TIER_LABELS, type Contact, type LoyaltyTier } from '@/stores/useContacts'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Order, TenderType } from '@/stores/useCommerce'
import { useElementSize } from '@/composables/useElementSize'
import MpDialog from '@/components/MpDialog.vue'

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
    addToCart(group.variants[0]!)
  } else {
    variantPickerGroup.value = group
    variantPickerOpen.value = true
  }
}

function selectVariant(item: PosCatalogItem) {
  addToCart(item)
  variantPickerOpen.value = false
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
function stockAt(sku: string, locationId: string): number {
  const key = `${sku}:${locationId}`
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash) + key.charCodeAt(i)
  const qty = Math.abs(hash) % 41
  return qty < 5 ? 0 : qty // some location/SKU pairs genuinely out of stock
}

function stockBadge(qty: number): { label: string; cls: string } {
  if (qty === 0) return { label: 'Out of stock', cls: 'pos-stock-badge--out' }
  if (qty < 8) return { label: `Low stock · ${qty}`, cls: 'pos-stock-badge--low' }
  return { label: 'In Stock', cls: 'pos-stock-badge--in' }
}

const selectedVariantStock = computed(() =>
  selectedVariant.value ? stockAt(selectedVariant.value.sku, store.activeLocation.id) : 0,
)

const otherLocationRows = computed(() =>
  store.locationList
    .filter((l) => l.id !== store.activeLocation.id)
    .map((l) => ({ loc: l, qty: selectedVariant.value ? stockAt(selectedVariant.value.sku, l.id) : 0 })),
)

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
    addToCart(exact)
    catalogSearch.value = ''
    focusScanField()
    return
  }
  // A single match on Enter behaves like tapping its tile (variant picker aware)
  const groups = catalogGroups.value
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
const TILE_GRADIENTS = [
  ['#fee2e2', '#fecaca'], // soft rose
  ['#fef3c7', '#fde68a'], // soft amber
  ['#dbeafe', '#bfdbfe'], // soft blue
  ['#dcfce7', '#bbf7d0'], // soft green
  ['#ede9fe', '#ddd6fe'], // soft violet
  ['#cffafe', '#a5f3fc'], // soft cyan
  ['#fce7f3', '#fbcfe8'], // soft pink
  ['#fed7aa', '#fdba74'], // soft orange
] as const

function tileGradient(sku: string): string {
  let hash = 0
  for (let i = 0; i < sku.length; i++) hash = ((hash << 5) - hash) + sku.charCodeAt(i)
  const idx = Math.abs(hash) % TILE_GRADIENTS.length
  const colors = TILE_GRADIENTS[idx]!
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
}

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
}

const cart = ref<CartLine[]>([])
const discountPct = ref(0)
const customerName = ref('')
let lineSeq = 0

const isOverridden = (l: CartLine) => Math.abs(l.price - l.originalPrice) > 0.005

function addToCart(item: { sku: string; productName: string; pos: number }) {
  // Merge into an existing same-SKU line only if it's untouched (no note/override),
  // so a modified line keeps its own identity.
  const existing = cart.value.find((c) => c.sku === item.sku && !c.note && !isOverridden(c))
  if (existing) {
    existing.qty++
  } else {
    const { name, variant } = parseTileProduct(item.productName)
    cart.value.push({
      id: `L${lineSeq++}`,
      sku: item.sku,
      name,
      variant,
      originalPrice: item.pos,
      price: item.pos,
      qty: 1,
      note: '',
    })
  }
}

function removeFromCart(id: string) {
  cart.value = cart.value.filter((c) => c.id !== id)
}

function incrementQty(id: string) {
  const line = cart.value.find((c) => c.id === id)
  if (line) line.qty++
}

const subtotal = computed(() => cart.value.reduce((s, c) => s + c.price * c.qty, 0))
const discountAmount = computed(() => subtotal.value * (discountPct.value / 100))
// Tax-inclusive mode (Settings): prices already include 10% GST — back it out instead of adding.
const taxAmount = computed(() => {
  const net = subtotal.value - discountAmount.value
  return posSettings.taxInclusive ? net - net / 1.1 : net * 0.1
})
const grandTotal = computed(() => {
  const net = subtotal.value - discountAmount.value
  return posSettings.taxInclusive ? net : net + taxAmount.value
})

function clearCart() {
  cart.value = []
  discountPct.value = 0
  customerName.value = ''
  attachedCustomerId.value = null
  discountDialogOpen.value = false
  customerPickerOpen.value = false
}

/* ── Line actions sheet (tap a cart line → edit menu) ──────────── */
const lineActionsOpen = ref(false)
const lineActionsId = ref<string | null>(null)
const lineActionsLine = computed(() => cart.value.find((c) => c.id === lineActionsId.value) ?? null)
const lineSheetMode = ref<'menu' | 'price' | 'note'>('menu')
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
  if (lineActionsLine.value) removeFromCart(lineActionsLine.value.id)
  lineActionsOpen.value = false
}

// If the line disappears while the sheet is open (clear sale, checkout), close it.
watch(lineActionsLine, (l) => {
  if (!l) lineActionsOpen.value = false
})

/* ── Discount dialog ───────────────────────────────────────────── */
const discountDialogOpen = ref(false)
const pendingDiscount = ref(0)

function applyDiscount() {
  discountPct.value = pendingDiscount.value
  discountDialogOpen.value = false
}

/* ── Customer picker (in-frame sheet: search real customers, attach loyalty, inline create) ── */
const customerPickerOpen = ref(false)
const customerPickerSearch = ref('')
const customerPickerMode = ref<'search' | 'create'>('search')
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
  customerPickerMode.value = 'search'
  customerPickerSearch.value = ''
  customerPickerOpen.value = true
  nextTick(() => customerPickerFieldRef.value?.focus?.())
}

function attachExistingCustomer(c: PosCustomerView) {
  customerName.value = c.name
  attachedCustomerId.value = c.id // real loyalty profile rides into checkout
  customerPickerOpen.value = false
  flashGridToast(`${c.name} added to sale`)
}

function attachTopResult() {
  const top = customerPickerResults.value[0]
  if (top) attachExistingCustomer(top)
}

/* Inline create — prefill from the current query, then attach on save */
function startCreateFromPicker() {
  const q = customerPickerSearch.value.trim()
  const looksLikeEmail = q.includes('@')
  newCustomerDraft.name = looksLikeEmail ? '' : q
  newCustomerDraft.email = looksLikeEmail ? q : ''
  newCustomerDraft.phone = ''
  customerPickerMode.value = 'create'
}

function createAndAttachCustomer() {
  if (!newCustomerDraft.name.trim()) return
  const c = toPosCustomer(contacts.addLoyaltyContact({
    name: newCustomerDraft.name.trim(),
    email: newCustomerDraft.email.trim(),
    phone: newCustomerDraft.phone.trim(),
    homeLocationId: store.activeLocation.id,
  }))
  newCustomerDraft.name = ''
  newCustomerDraft.email = ''
  newCustomerDraft.phone = ''
  attachExistingCustomer(c)
}

/* ── Attached loyalty customer (rides alongside customerName) ───── */
const attachedCustomerId = ref<number | null>(null)
const attachedCustomer = computed<PosCustomerView | null>(
  () => loyaltyCustomers.value.find((c) => c.id === attachedCustomerId.value) ?? null,
)

function detachCustomer() {
  customerName.value = ''
  attachedCustomerId.value = null
}

/* ── Payment flow ──────────────────────────────────────────────── */
type PaymentStep = 'idle' | 'select' | 'processing' | 'approved'
const paymentStep = ref<PaymentStep>('idle')
const selectedTender = ref<TenderType>('card')

function openPay() {
  if (cart.value.length === 0) return
  if (!posSettings.enabledTenders[selectedTender.value]) selectedTender.value = enabledTenderList.value[0]!
  cartSheetOpen.value = false
  paymentStep.value = 'select'
}

function selectTender(t: TenderType) {
  selectedTender.value = t
}

function processPayment() {
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

function completeApproved() {
  // Append real transaction to store — the demo loop
  const locId = store.activeLocation?.id ?? store.locationList[0]!.id
  const txn = commerce.addPosOrder({
    locationId: locId,
    registerId: activeRegister.value.id,
    staffId: activeStaffId.value,
    customerName: customerName.value || undefined,
    total: grandTotal.value,
    tender: selectedTender.value,
    itemCount: cart.value.reduce((s, c) => s + c.qty, 0),
    lines: cart.value.map((c) => ({
      sku: c.sku,
      name: c.variant ? `${c.name} — ${c.variant}` : c.name,
      qty: c.qty,
      price: c.price,
    })),
  })
  if (attachedCustomerId.value) contacts.recordLoyaltyPurchase(attachedCustomerId.value, grandTotal.value)
  lastTxnId.value = txn.orderNumber
  paymentStep.value = 'idle'
  clearCart()
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
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
  receiptFooter: 'Thanks for shopping with us!',
  taxInclusive: false,
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
const STATUS_PILL_META: Record<string, { label: string; cls: string }> = {
  'Paid':                { label: 'Completed',      cls: 'pos-status-pill--completed' },
  'Refunded':            { label: 'Refunded',       cls: 'pos-status-pill--refunded' },
  'Partially Refunded':  { label: 'Partial refund', cls: 'pos-status-pill--partial' },
  'Voided':              { label: 'Voided',         cls: 'pos-status-pill--voided' },
  'Pending':             { label: 'Suspended',      cls: 'pos-status-pill--suspended' },
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

function customerInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function attachCustomerToSale(c: PosCustomerView) {
  customerName.value = c.name
  attachedCustomerId.value = c.id
  posView.value = 'sale'
  flashGridToast(`${c.name} added to sale`)
}

/* New-customer dialog */
const newCustomerOpen = ref(false)
const newCustomerDraft = reactive({ name: '', email: '', phone: '' })
function saveNewCustomer() {
  if (!newCustomerDraft.name.trim()) return
  const c = toPosCustomer(contacts.addLoyaltyContact({
    name: newCustomerDraft.name.trim(),
    email: newCustomerDraft.email.trim(),
    phone: newCustomerDraft.phone.trim(),
    homeLocationId: store.activeLocation.id,
  }))
  selectedCustomerId.value = c.id
  newCustomerOpen.value = false
  newCustomerDraft.name = ''
  newCustomerDraft.email = ''
  newCustomerDraft.phone = ''
  flashGridToast('Customer created')
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
  gridToastText.value = text
  gridToast.value = true
}

function addCustomSale() {
  const customSku = `CUSTOM-${Date.now().toString(36).slice(-4).toUpperCase()}`
  cart.value.push({
    id: `L${lineSeq++}`,
    sku: customSku,
    name: 'Custom item',
    variant: null,
    originalPrice: 25,
    price: 25,
    qty: 1,
    note: '',
  })
  saleMode.value = 'catalog'
  flashGridToast('Custom item added to sale')
}

const SMART_GRID_TILES: SmartGridTile[] = [
  { key: 'browse',    label: 'Browse products', icon: 'grid-2x2',     color: '#6366f1', action: () => { saleMode.value = 'catalog' } },
  { key: 'custom',    label: 'Add custom sale', icon: 'plus-circle',  color: '#0d9488', action: addCustomSale },
  { key: 'discount',  label: 'Apply discount',  icon: 'percent',      color: '#f59e0b', action: () => { discountDialogOpen.value = true; pendingDiscount.value = discountPct.value } },
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
        <v-icon size="16" color="primary" style="margin-right: 6px;">monitor-smartphone</v-icon>
        <span>POS Preview</span>
      </div>

      <div class="pos-header__controls">
        <!-- Location select -->
        <v-select
          :model-value="store.activeLocationId"
          :items="store.locationList.map((l) => ({ title: l.name, value: l.id }))"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 160px; max-width: 180px;"
          @update:model-value="store.setActiveLocation"
        />

        <!-- Device frame select -->
        <v-btn-toggle v-model="device" mandatory density="compact" rounded="lg" border>
          <v-btn
            v-for="df in DEVICE_FRAMES"
            :key="df.value"
            :value="df.value"
            size="small"
            :icon="df.icon"
            :title="df.label"
          />
        </v-btn-toggle>

        <!-- Orientation toggle (tablets only) -->
        <v-btn-toggle
          v-if="currentFrame.supportsLandscape"
          v-model="orientation"
          mandatory
          density="compact"
          rounded="lg"
          border
        >
          <v-btn value="portrait"  size="small" icon="rectangle-vertical"   title="Portrait" />
          <v-btn value="landscape" size="small" icon="rectangle-horizontal" title="Landscape" />
        </v-btn-toggle>

        <!-- Offline toggle -->
        <div class="d-flex align-center ga-2">
          <span class="text-body-2" style="font-size: 12px; color: var(--muted);">Offline</span>
          <v-switch
            :model-value="isOffline"
            color="warning"
            hide-details
            density="compact"
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
                  :title="nav.label"
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
                    density="compact"
                    variant="solo"
                    flat
                    prepend-inner-icon="search"
                    append-inner-icon="scan-line"
                    hide-details
                    clearable
                    bg-color="surface"
                    rounded="lg"
                    style="font-size: 13px;"
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
                  <div v-if="saleMode === 'catalog'" class="pos-catalog__chips">
                    <button
                      v-for="chip in COLLECTION_CHIPS"
                      :key="chip.value"
                      class="pos-chip"
                      :class="{ 'pos-chip--active': activeCollection === chip.value }"
                      @click="activeCollection = chip.value"
                    >
                      {{ chip.label }}
                    </button>
                  </div>

                  <div class="pos-catalog__grid">
                    <button
                      v-for="group in catalogGroups"
                      :key="group.representative.sku"
                      class="pos-product-tile"
                      @click="handleTileClick(group)"
                    >
                      <div class="pos-product-tile__image" :style="{ background: tileGradient(group.representative.sku) }">
                        <v-icon size="20" color="#11182766">package</v-icon>
                        <div v-if="group.variants.length > 1" class="pos-product-tile__variants-badge">
                          {{ group.variants.length }} variants
                        </div>
                      </div>
                      <div class="pos-product-tile__body">
                        <div class="pos-product-tile__name">{{ group.baseName }}</div>
                        <div class="pos-product-tile__variant">
                          <template v-if="group.variants.length === 1">
                            {{ parseTileProduct(group.representative.productName).variant }}
                          </template>
                          <template v-else>
                            {{ group.variants.map(v => parseTileProduct(v.productName).variant).filter(Boolean).join(' · ') }}
                          </template>
                        </div>
                        <div class="pos-product-tile__price">
                          <template v-if="group.variants.length === 1">{{ fmt(group.representative.pos) }}</template>
                          <template v-else>from {{ fmt(Math.min(...group.variants.map(v => v.pos))) }}</template>
                        </div>
                      </div>
                    </button>

                    <div v-if="catalogGroups.length === 0" class="pos-catalog__empty">
                      <v-icon size="32" class="text-medium-emphasis">search</v-icon>
                      <div>No products found</div>
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

                <!-- Customer chip -->
                <div v-if="customerName" class="pos-customer-chip">
                  <v-icon size="14">user</v-icon>
                  <span>{{ customerName }}<template v-if="attachedCustomer"> · {{ LOYALTY_TIER_LABELS[attachedCustomer.tier] }}</template></span>
                  <button class="pos-customer-chip__x" @click="detachCustomer" aria-label="Remove customer">
                    <v-icon size="12">x</v-icon>
                  </button>
                </div>

                <!-- Line items -->
                <div class="pos-cart__lines">
                  <div v-if="cart.length === 0" class="pos-cart__empty">
                    <div class="pos-cart__empty-illo">
                      <v-icon size="42" color="#9ca3af">shopping-bag</v-icon>
                    </div>
                    <div class="pos-cart__empty-title">Add a product to get started</div>
                    <div class="pos-cart__empty-sub">Browse the smart grid or scan a barcode</div>
                    <div class="pos-cart__empty-chips">
                      <button class="pos-empty-chip" @click="addCustomSale">
                        <v-icon size="13">plus</v-icon>
                        Custom item
                      </button>
                      <button class="pos-empty-chip" @click="openCustomerPicker">
                        <v-icon size="13">user-plus</v-icon>
                        Add customer
                      </button>
                    </div>
                  </div>

                  <transition-group name="pos-line-in">
                    <div
                      v-for="line in cart"
                      :key="line.id"
                      class="pos-line"
                      role="button"
                      tabindex="0"
                      @click="openLineActions(line)"
                      @keydown.enter="openLineActions(line)"
                    >
                      <div class="pos-line__thumb" :style="{ background: tileGradient(line.sku) }" />
                      <div class="pos-line__body">
                        <div class="pos-line__name">{{ line.name }}</div>
                        <div v-if="line.variant" class="pos-line__variant">{{ line.variant }}</div>
                        <div class="pos-line__sku">{{ line.sku }}</div>
                        <div v-if="isOverridden(line) || line.note" class="pos-line__tags">
                          <span v-if="isOverridden(line)" class="pos-line-tag pos-line-tag--override">Price overridden</span>
                          <span v-if="line.note" class="pos-line-tag pos-line-tag--note">Note</span>
                        </div>
                      </div>
                      <div class="pos-line__pricing">
                        <span v-if="line.qty > 1" class="pos-line__qtytext">× {{ line.qty }}</span>
                        <span v-if="isOverridden(line)" class="pos-line__was">{{ fmt(line.originalPrice * line.qty) }}</span>
                        <span class="pos-line__now">{{ fmt(line.price * line.qty) }}</span>
                      </div>
                    </div>
                  </transition-group>
                </div>

                <!-- Totals -->
                <div v-if="cart.length > 0" class="pos-cart__totals">
                  <div class="pos-total-row">
                    <span>Subtotal</span><span>{{ fmt(subtotal) }}</span>
                  </div>
                  <div v-if="discountPct > 0" class="pos-total-row pos-total-row--discount">
                    <span>Discount ({{ discountPct }}%)</span>
                    <span>−{{ fmt(discountAmount) }}</span>
                  </div>
                  <div class="pos-total-row">
                    <span>{{ posSettings.taxInclusive ? 'Includes GST (10%)' : 'Tax (10%)' }}</span><span>{{ fmt(taxAmount) }}</span>
                  </div>
                  <div class="pos-total-row pos-total-row--grand">
                    <span>Total</span><span>{{ fmt(grandTotal) }}</span>
                  </div>
                </div>

                <!-- Cart secondary actions -->
                <div v-if="cart.length > 0" class="pos-cart__secondary">
                  <button class="pos-secondary-btn" @click="suspendSale" title="Suspend sale">
                    <v-icon size="14">pause-circle</v-icon>
                  </button>
                  <button class="pos-secondary-btn" @click="discountDialogOpen = true; pendingDiscount = discountPct" title="Discount">
                    <v-icon size="14">percent</v-icon>
                  </button>
                  <button class="pos-secondary-btn" @click="openCustomerPicker" title="Customer">
                    <v-icon size="14">user-plus</v-icon>
                  </button>
                  <button class="pos-secondary-btn" @click="clearCart" title="Clear sale">
                    <v-icon size="14">trash-2</v-icon>
                  </button>
                </div>

                <!-- Charge button (Shopify-iconic) -->
                <button
                  class="pos-charge-btn"
                  :class="{ 'pos-charge-btn--disabled': cart.length === 0 }"
                  @click="openPay"
                >
                  Charge {{ fmt(grandTotal) }}
                </button>
              </div>

              <!-- Phone: collapsed cart bar (summary + charge), sits above the tab bar -->
              <div v-if="isPhone" class="pos-cartbar">
                <button class="pos-cartbar__summary" @click="cartSheetOpen = true">
                  <v-icon size="16">shopping-bag</v-icon>
                  <span>{{ cart.reduce((s, c) => s + c.qty, 0) }} item{{ cart.reduce((s, c) => s + c.qty, 0) !== 1 ? 's' : '' }} · {{ fmt(grandTotal) }}</span>
                  <v-icon size="14">chevron-up</v-icon>
                </button>
                <button
                  class="pos-charge-btn pos-charge-btn--bar"
                  :class="{ 'pos-charge-btn--disabled': cart.length === 0 }"
                  @click="openPay"
                >
                  Charge
                </button>
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

                <div class="pos-catalog__chips">
                  <button
                    v-for="chip in COLLECTION_CHIPS"
                    :key="chip.value"
                    class="pos-chip"
                    :class="{ 'pos-chip--active': productsCollection === chip.value }"
                    @click="productsCollection = chip.value"
                  >
                    {{ chip.label }}
                  </button>
                </div>

                <div class="pos-catalog__grid">
                  <button
                    v-for="group in productsGroups"
                    :key="group.baseName"
                    class="pos-product-tile"
                    :class="{ 'pos-product-tile--selected': selectedProductKey === group.baseName }"
                    @click="selectProduct(group)"
                  >
                    <div class="pos-product-tile__image" :style="{ background: tileGradient(group.representative.sku) }">
                      <v-icon size="20" color="#11182766">package</v-icon>
                      <div v-if="group.variants.length > 1" class="pos-product-tile__variants-badge">
                        {{ group.variants.length }} variants
                      </div>
                    </div>
                    <div class="pos-product-tile__body">
                      <div class="pos-product-tile__name">{{ group.baseName }}</div>
                      <div class="pos-product-tile__variant">{{ group.representative.sku }}</div>
                      <div class="pos-product-tile__price">
                        <template v-if="group.variants.length === 1">{{ fmt(group.representative.pos) }}</template>
                        <template v-else>from {{ fmt(Math.min(...group.variants.map(v => v.pos))) }}</template>
                      </div>
                    </div>
                  </button>

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
                  <v-icon size="40" color="#9ca3af">package</v-icon>
                  <div class="pos-customers__detail-empty-title">Select a product</div>
                  <div class="pos-customers__detail-empty-sub">View pricing, options, and stock at every location.</div>
                </div>

                <template v-else>
                  <div class="pos-products__detail-head">
                    <div class="pos-products__detail-thumb" :style="{ background: tileGradient(selectedVariant!.sku) }">
                      <v-icon size="18" color="#11182766">package</v-icon>
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
                    <span class="pos-stock-badge" :class="stockBadge(selectedVariantStock).cls">
                      {{ stockBadge(selectedVariantStock).label }}
                    </span>
                    <button class="pos-pane-head__link" @click="otherLocationsOpen = true">
                      Check Other Locations
                    </button>
                  </div>

                  <div class="pos-profile__section-title">Options</div>
                  <div class="pos-products__options">
                    <button
                      v-for="v in selectedGroup.variants"
                      :key="v.sku"
                      class="pos-chip"
                      :class="{ 'pos-chip--active': selectedProductSku === v.sku }"
                      @click="selectedProductSku = v.sku"
                    >
                      {{ parseTileProduct(v.productName).variant ?? 'Default' }}
                    </button>
                  </div>

                  <div class="pos-products__detail-spacer" />

                  <button
                    class="pos-charge-btn"
                    :class="{ 'pos-charge-btn--disabled': selectedVariantStock === 0 }"
                    @click="addSelectedToCart"
                  >
                    Add to Cart · {{ fmt(selectedVariant!.pos) }}
                  </button>
                </template>
              </div>
            </div>

            <!-- ── CUSTOMERS VIEW ──────────────────────────────── -->
            <div v-else-if="posView === 'customers'" class="pos-customers" :class="{ 'pos-customers--detail': isPhone && selectedCustomerId }">
              <!-- List column -->
              <div class="pos-customers__list">
                <div class="pos-pane-head">
                  <div class="pos-pane-head__title">Customers</div>
                  <button class="pos-pane-head__link" @click="newCustomerOpen = true">
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
                    <div class="pos-customer-row__avatar" :style="{ background: tileGradient(String(c.id)) }">{{ customerInitials(c.name) }}</div>
                    <div class="pos-customer-row__body">
                      <div class="pos-customer-row__name">{{ c.name }}</div>
                      <div class="pos-customer-row__email">{{ c.email }}</div>
                    </div>
                    <div class="pos-customer-row__chips">
                      <span class="pos-tier-chip" :class="`pos-tier-chip--${c.tier}`">{{ LOYALTY_TIER_LABELS[c.tier] }}</span>
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
                    <div class="pos-profile__avatar" :style="{ background: tileGradient(String(selectedCustomer.id)) }">{{ customerInitials(selectedCustomer.name) }}</div>
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

              <div class="pos-history-pane__chips">
                <button
                  v-for="f in HISTORY_FILTERS"
                  :key="f.value"
                  class="pos-chip"
                  :class="{ 'pos-chip--active': historyFilter === f.value }"
                  @click="historyFilter = f.value"
                >
                  {{ f.label }}
                </button>
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
                      <span v-if="txn.paymentStatus !== 'Paid'" class="pos-status-pill" :class="statusPill(txn).cls">
                        {{ statusPill(txn).label }}
                      </span>
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
                  <div class="pos-receipt-preview">
                    <div class="pos-receipt-preview__store">{{ store.activeLocation?.name }}</div>
                    <div class="pos-receipt-preview__line"><span>Classic crew tee</span><span>$39.00</span></div>
                    <div class="pos-receipt-preview__line"><span>Cap — Navy</span><span>$35.00</span></div>
                    <div class="pos-receipt-preview__line pos-receipt-preview__line--total"><span>Total</span><span>$81.40</span></div>
                    <div class="pos-receipt-preview__footer">{{ posSettings.receiptFooter }}</div>
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
                  <div class="pos-setting-row pos-setting-row--stacked">
                    <div class="pos-setting-row__label">Footer message</div>
                    <v-text-field
                      v-model="posSettings.receiptFooter"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="font-size: 13px;"
                    />
                  </div>
                </div>

                <div class="pos-settings__group-label">Taxes</div>
                <div class="pos-settings__group">
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">landmark</v-icon></div>
                    <div class="pos-setting-row__label">Tax rate</div>
                    <div class="pos-setting-row__value">10% GST</div>
                  </div>
                  <div class="pos-setting-row">
                    <div class="pos-setting-row__icon"><v-icon size="15">receipt-text</v-icon></div>
                    <div>
                      <div class="pos-setting-row__label">Tax-inclusive pricing</div>
                      <div class="pos-setting-row__sub">Prices shown include tax</div>
                    </div>
                    <v-switch v-model="posSettings.taxInclusive" color="#0d9488" hide-details density="compact" class="pos-setting-row__control" />
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
          <transition name="pos-variant-up">
            <div
              v-if="variantPickerOpen"
              class="pos-variant-overlay"
              @click.self="variantPickerOpen = false"
            >
              <div class="pos-variant-sheet">
                <!-- Grabber -->
                <div class="pos-variant-sheet__grabber" />

                <!-- Header: product image + name + close -->
                <div class="pos-variant-sheet__header">
                  <div
                    class="pos-variant-sheet__thumb"
                    :style="{ background: tileGradient(variantPickerGroup!.representative.sku) }"
                  >
                    <v-icon size="16" color="#11182766">package</v-icon>
                  </div>
                  <div class="pos-variant-sheet__info">
                    <div class="pos-variant-sheet__title">{{ variantPickerGroup?.baseName }}</div>
                    <div class="pos-variant-sheet__sub">{{ variantPickerGroup?.variants.length }} variants available</div>
                  </div>
                  <button class="pos-variant-sheet__close" @click="variantPickerOpen = false">
                    <v-icon size="14">x</v-icon>
                  </button>
                </div>

                <!-- Variant rows -->
                <div class="pos-variant-sheet__list">
                  <button
                    v-for="v in variantPickerGroup?.variants"
                    :key="v.sku"
                    class="pos-variant-row"
                    @click="selectVariant(v)"
                  >
                    <div class="pos-variant-row__swatch" :style="{ background: tileGradient(v.sku) }" />
                    <div class="pos-variant-row__info">
                      <div class="pos-variant-row__label">{{ parseTileProduct(v.productName).variant }}</div>
                      <div class="pos-variant-row__sku">SKU: {{ v.sku }}</div>
                    </div>
                    <div class="pos-variant-row__price">{{ fmt(v.pos) }}</div>
                    <v-icon size="14" color="#9ca3af">chevron-right</v-icon>
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <!-- ── Line actions sheet (tap a cart line → edit menu) ── -->
          <transition name="pos-variant-up">
            <div
              v-if="lineActionsOpen && lineActionsLine"
              class="pos-variant-overlay"
              @click.self="lineActionsOpen = false"
            >
              <div class="pos-variant-sheet pos-line-sheet">
                <div class="pos-variant-sheet__grabber" />

                <!-- Header: line thumb + name + close -->
                <div class="pos-variant-sheet__header">
                  <div class="pos-variant-sheet__thumb" :style="{ background: tileGradient(lineActionsLine.sku) }">
                    <v-icon size="16" color="#11182766">package</v-icon>
                  </div>
                  <div class="pos-variant-sheet__info">
                    <div class="pos-variant-sheet__title">
                      {{ lineActionsLine.name }}<template v-if="lineActionsLine.variant"> — {{ lineActionsLine.variant }}</template>
                    </div>
                    <div class="pos-variant-sheet__sub">SKU: {{ lineActionsLine.sku }}</div>
                  </div>
                  <button class="pos-variant-sheet__close" @click="lineActionsOpen = false">
                    <v-icon size="14">x</v-icon>
                  </button>
                </div>

                <!-- MENU MODE: qty stepper + action rows -->
                <template v-if="lineSheetMode === 'menu'">
                  <div class="pos-line-sheet__qty">
                    <button
                      class="pos-qty-btn pos-qty-btn--lg"
                      :aria-label="lineActionsLine.qty <= 1 ? 'Remove item' : 'Decrease quantity'"
                      @click="sheetDecrementQty"
                    >
                      <v-icon v-if="lineActionsLine.qty <= 1" size="14">trash-2</v-icon>
                      <template v-else>−</template>
                    </button>
                    <span class="pos-qty-value pos-qty-value--lg">{{ lineActionsLine.qty }}</span>
                    <button class="pos-qty-btn pos-qty-btn--lg" aria-label="Increase quantity" @click="incrementQty(lineActionsLine.id)">+</button>
                  </div>

                  <div class="pos-variant-sheet__list">
                    <button class="pos-line-sheet__action" @click="openPriceMode">
                      <v-icon size="15" color="#6b7280">pencil</v-icon>
                      <div class="pos-line-sheet__action-info">
                        <div class="pos-line-sheet__action-label">Override price</div>
                        <div class="pos-line-sheet__action-sub">
                          {{ fmt(lineActionsLine.price) }} ea
                          <s v-if="isOverridden(lineActionsLine)">{{ fmt(lineActionsLine.originalPrice) }}</s>
                        </div>
                      </div>
                      <v-icon size="14" color="#9ca3af">chevron-right</v-icon>
                    </button>
                    <button class="pos-line-sheet__action" @click="openNoteMode">
                      <v-icon size="15" color="#6b7280">sticky-note</v-icon>
                      <div class="pos-line-sheet__action-info">
                        <div class="pos-line-sheet__action-label">{{ lineActionsLine.note ? 'Edit note' : 'Add note' }}</div>
                        <div v-if="lineActionsLine.note" class="pos-line-sheet__action-sub pos-line-sheet__action-sub--clamp">{{ lineActionsLine.note }}</div>
                      </div>
                      <v-icon size="14" color="#9ca3af">chevron-right</v-icon>
                    </button>
                    <button class="pos-line-sheet__action" @click="flashGridToast('Line discounts coming soon')">
                      <v-icon size="15" color="#6b7280">percent</v-icon>
                      <div class="pos-line-sheet__action-info">
                        <div class="pos-line-sheet__action-label">Apply discount</div>
                      </div>
                      <v-icon size="14" color="#9ca3af">chevron-right</v-icon>
                    </button>
                    <button class="pos-line-sheet__action pos-line-sheet__action--danger" @click="removeLineFromSheet">
                      <v-icon size="15" color="#dc2626">trash-2</v-icon>
                      <div class="pos-line-sheet__action-info">
                        <div class="pos-line-sheet__action-label">Remove item</div>
                      </div>
                    </button>
                  </div>
                </template>

                <!-- PRICE MODE -->
                <template v-else-if="lineSheetMode === 'price'">
                  <div class="pos-line-sheet__form">
                    <label class="pos-line-sheet__field-label" for="pos-line-price">Unit price</label>
                    <input
                      id="pos-line-price"
                      v-model="pendingPrice"
                      class="pos-line-sheet__input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputmode="decimal"
                    />
                    <div v-if="isOverridden(lineActionsLine)" class="pos-line-sheet__hint">
                      Original price {{ fmt(lineActionsLine.originalPrice) }}
                    </div>
                    <button class="pos-line-sheet__primary" @click="applyPriceOverride">Apply</button>
                    <button
                      v-if="isOverridden(lineActionsLine)"
                      class="pos-line-sheet__ghost pos-line-sheet__ghost--danger"
                      @click="removePriceOverride"
                    >
                      Remove override
                    </button>
                    <button class="pos-line-sheet__ghost" @click="lineSheetMode = 'menu'">Back</button>
                  </div>
                </template>

                <!-- NOTE MODE -->
                <template v-else>
                  <div class="pos-line-sheet__form">
                    <label class="pos-line-sheet__field-label" for="pos-line-note">Line note</label>
                    <textarea
                      id="pos-line-note"
                      v-model="pendingNote"
                      class="pos-line-sheet__textarea"
                      rows="3"
                      placeholder="e.g. Gift wrap this item"
                    />
                    <button class="pos-line-sheet__primary" @click="saveLineNote">Save note</button>
                    <button class="pos-line-sheet__ghost" @click="lineSheetMode = 'menu'">Back</button>
                  </div>
                </template>
              </div>
            </div>
          </transition>

          <!-- ── Customer picker sheet (search real customers, attach loyalty, inline create) ── -->
          <transition name="pos-variant-up">
            <div
              v-if="customerPickerOpen"
              class="pos-variant-overlay"
              @click.self="customerPickerOpen = false"
            >
              <div class="pos-variant-sheet pos-customer-picker">
                <div class="pos-variant-sheet__grabber" />

                <!-- SEARCH MODE -->
                <template v-if="customerPickerMode === 'search'">
                  <div class="pos-variant-sheet__header">
                    <div class="pos-variant-sheet__info">
                      <div class="pos-variant-sheet__title">Attach customer</div>
                      <div class="pos-variant-sheet__sub">Link loyalty, purchase history &amp; receipts</div>
                    </div>
                    <button class="pos-variant-sheet__close" @click="customerPickerOpen = false">
                      <v-icon size="14">x</v-icon>
                    </button>
                  </div>

                  <!-- Currently attached -->
                  <div v-if="attachedCustomer" class="pos-customer-picker__attached">
                    <div class="pos-customer-row__avatar" :style="{ background: tileGradient(String(attachedCustomer.id)) }">{{ customerInitials(attachedCustomer.name) }}</div>
                    <div class="pos-customer-picker__attached-body">
                      <div class="pos-customer-picker__attached-name">
                        {{ attachedCustomer.name }}
                        <span class="pos-tier-chip" :class="`pos-tier-chip--${attachedCustomer.tier}`">{{ LOYALTY_TIER_LABELS[attachedCustomer.tier] }}</span>
                      </div>
                      <div class="pos-customer-picker__attached-meta">On this sale · {{ attachedCustomer.points.toLocaleString() }} pts</div>
                    </div>
                    <button class="pos-customer-picker__remove" @click="detachCustomer">Remove</button>
                  </div>

                  <!-- Search -->
                  <div class="pos-customer-picker__search">
                    <v-text-field
                      ref="customerPickerFieldRef"
                      v-model="customerPickerSearch"
                      placeholder="Search name, email or phone"
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
                  <div class="pos-variant-sheet__list pos-customer-picker__list">
                    <div v-if="!customerPickerSearch.trim()" class="pos-customer-picker__section">Top customers</div>
                    <button
                      v-for="c in customerPickerResults"
                      :key="c.id"
                      class="pos-customer-row"
                      :class="{ 'pos-customer-row--selected': attachedCustomerId === c.id }"
                      @click="attachExistingCustomer(c)"
                    >
                      <div class="pos-customer-row__avatar" :style="{ background: tileGradient(String(c.id)) }">{{ customerInitials(c.name) }}</div>
                      <div class="pos-customer-row__body">
                        <div class="pos-customer-row__name">{{ c.name }}</div>
                        <div class="pos-customer-row__email">{{ c.email }}</div>
                      </div>
                      <div class="pos-customer-row__chips">
                        <span class="pos-tier-chip" :class="`pos-tier-chip--${c.tier}`">{{ LOYALTY_TIER_LABELS[c.tier] }}</span>
                        <span class="pos-customer-row__spend">{{ fmt(c.lifetimeSpend) }}</span>
                      </div>
                    </button>

                    <div v-if="customerPickerResults.length === 0" class="pos-customer-picker__empty">
                      <v-icon size="26" color="#9ca3af">user-search</v-icon>
                      <div class="pos-customer-picker__empty-title">No match for “{{ customerPickerSearch.trim() }}”</div>
                    </div>
                  </div>

                  <!-- Create CTA -->
                  <button class="pos-customer-picker__create-cta" @click="startCreateFromPicker">
                    <v-icon size="16">user-plus</v-icon>
                    <span>Create new customer<template v-if="customerPickerSearch.trim()"> “{{ customerPickerSearch.trim() }}”</template></span>
                  </button>
                </template>

                <!-- CREATE MODE -->
                <template v-else>
                  <div class="pos-variant-sheet__header">
                    <button class="pos-customer-picker__back" @click="customerPickerMode = 'search'">
                      <v-icon size="15">chevron-left</v-icon>
                    </button>
                    <div class="pos-variant-sheet__info">
                      <div class="pos-variant-sheet__title">New customer</div>
                      <div class="pos-variant-sheet__sub">Add to loyalty &amp; attach to this sale</div>
                    </div>
                    <button class="pos-variant-sheet__close" @click="customerPickerOpen = false">
                      <v-icon size="14">x</v-icon>
                    </button>
                  </div>

                  <div class="pos-customer-picker__form">
                    <v-text-field
                      v-model="newCustomerDraft.name"
                      label="Full name"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="user"
                      hide-details
                      class="mb-2"
                      @keydown.enter="createAndAttachCustomer"
                    />
                    <v-text-field
                      v-model="newCustomerDraft.email"
                      label="Email"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mail"
                      hide-details
                      class="mb-2"
                      @keydown.enter="createAndAttachCustomer"
                    />
                    <v-text-field
                      v-model="newCustomerDraft.phone"
                      label="Phone"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="phone"
                      hide-details
                      @keydown.enter="createAndAttachCustomer"
                    />
                    <div class="pos-customer-picker__form-actions">
                      <button class="pos-sheet-cancel" @click="customerPickerMode = 'search'">Back</button>
                      <button
                        class="pos-customer-picker__save"
                        :class="{ 'pos-customer-picker__save--disabled': !newCustomerDraft.name.trim() }"
                        @click="createAndAttachCustomer"
                      >
                        Create &amp; attach
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </transition>

          <!-- ── Stock at other locations sheet ───────────────── -->
          <transition name="pos-variant-up">
            <div
              v-if="otherLocationsOpen"
              class="pos-variant-overlay"
              @click.self="otherLocationsOpen = false"
            >
              <div class="pos-variant-sheet">
                <div class="pos-variant-sheet__grabber" />

                <div class="pos-variant-sheet__header">
                  <div
                    class="pos-variant-sheet__thumb"
                    :style="{ background: tileGradient(selectedVariant?.sku ?? '') }"
                  >
                    <v-icon size="16" color="#11182766">map-pin</v-icon>
                  </div>
                  <div class="pos-variant-sheet__info">
                    <div class="pos-variant-sheet__title">Stock at other locations</div>
                    <div class="pos-variant-sheet__sub">{{ selectedVariant?.productName }} · {{ selectedVariant?.sku }}</div>
                  </div>
                  <button class="pos-variant-sheet__close" @click="otherLocationsOpen = false">
                    <v-icon size="14">x</v-icon>
                  </button>
                </div>

                <div class="pos-variant-sheet__list">
                  <div v-for="row in otherLocationRows" :key="row.loc.id" class="pos-variant-row pos-variant-row--static">
                    <div class="pos-variant-row__swatch" :style="{ background: tileGradient(row.loc.id) }" />
                    <div class="pos-variant-row__info">
                      <div class="pos-variant-row__label">{{ row.loc.name }}</div>
                      <div class="pos-variant-row__sku">{{ row.loc.kind === 'warehouse' ? 'Warehouse' : row.loc.address }}</div>
                    </div>
                    <div class="pos-variant-row__price">{{ row.qty }}</div>
                    <span class="pos-stock-badge" :class="stockBadge(row.qty).cls">{{ stockBadge(row.qty).label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <!-- ── Transaction detail sheet ─────────────────────── -->
          <transition name="pos-variant-up">
            <div v-if="detailTxn" class="pos-variant-overlay" @click.self="closeTxnDetail">
              <div class="pos-txn-sheet">
                <div class="pos-variant-sheet__grabber" />

                <div class="pos-txn-sheet__header">
                  <span class="pos-txn-sheet__id">{{ detailTxn.orderNumber }}</span>
                  <span class="pos-status-pill" :class="statusPill(detailTxn).cls">
                    {{ statusPill(detailTxn).label }}
                  </span>
                  <button class="pos-variant-sheet__close" @click="closeTxnDetail">
                    <v-icon size="14">x</v-icon>
                  </button>
                </div>

                <div class="pos-txn-sheet__meta">
                  <div class="pos-txn-sheet__meta-row"><span>Date</span><span>{{ dayLabel(detailTxn.date) }} · {{ timeLabel(detailTxn.date) }}</span></div>
                  <div class="pos-txn-sheet__meta-row"><span>Staff</span><span>{{ store.staffName(detailTxn.pos?.staffId ?? '') }}</span></div>
                  <div class="pos-txn-sheet__meta-row"><span>Register</span><span>{{ store.registerName(detailTxn.pos?.registerId ?? '') }}</span></div>
                  <div class="pos-txn-sheet__meta-row"><span>Customer</span><span>{{ detailTxn.customer.name }}</span></div>
                  <div class="pos-txn-sheet__meta-row"><span>Tender</span><span><v-icon v-if="detailTxn.tenders?.[0]" size="13" style="margin-right: 4px;">{{ TENDER_ICONS[detailTxn.tenders[0].type] }}</v-icon>{{ detailTxn.paymentMethod }}</span></div>
                </div>

                <div v-if="detailTxn.lineItems.length" class="pos-txn-sheet__lines">
                  <div v-for="l in detailTxn.lineItems" :key="l.sku" class="pos-txn-sheet__line">
                    <div class="pos-variant-row__swatch" :style="{ background: tileGradient(l.sku) }" />
                    <span class="pos-txn-sheet__line-name">{{ l.product }} ×{{ l.qty }}</span>
                    <span class="pos-txn-sheet__line-total">{{ fmt(parseFloat(l.price) * l.qty) }}</span>
                  </div>
                  <div class="pos-cart__totals" style="padding: 8px 0 0;">
                    <div class="pos-total-row"><span>Subtotal</span><span>{{ fmt(detailSubtotal) }}</span></div>
                    <div class="pos-total-row"><span>Tax (10%)</span><span>{{ fmt(Math.abs(parseFloat(detailTxn.total)) - detailSubtotal) }}</span></div>
                    <div class="pos-total-row pos-total-row--grand"><span>Total</span><span>{{ fmt(parseFloat(detailTxn.total)) }}</span></div>
                  </div>
                </div>
                <div v-else class="pos-txn-sheet__no-lines">
                  {{ detailTxn.itemCount }} item{{ detailTxn.itemCount !== 1 ? 's' : '' }} — line detail unavailable
                </div>

                <div class="pos-txn-sheet__actions">
                  <button class="pos-receipt-action" @click="printDetailReceipt">
                    <v-icon size="16">printer</v-icon>
                    <span>Print</span>
                  </button>
                  <button class="pos-receipt-action" @click="emailDetailReceipt">
                    <v-icon size="16">mail</v-icon>
                    <span>Email</span>
                  </button>
                  <button
                    v-if="detailTxn.status === 'completed'"
                    class="pos-receipt-action pos-receipt-action--danger"
                    @click="refundDetailTxn"
                  >
                    <v-icon size="16">rotate-ccw</v-icon>
                    <span>Refund</span>
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <!-- ── Payment sheet (in-frame slide-up; mirrors the variant-sheet pattern) ── -->
          <transition name="pos-variant-up">
            <div v-if="paymentStep !== 'idle'" class="pos-payment-overlay">
              <div class="pos-payment-sheet">

                <!-- Sheet grabber -->
                <div class="pos-payment-sheet__grabber" />

                <!-- Select tender -->
                <template v-if="paymentStep === 'select'">
                  <div class="pos-payment-sheet__head">
                    <div class="pos-payment-sheet__eyebrow">Tender amount</div>
                    <div class="pos-payment-sheet__amount">{{ fmt(grandTotal) }}</div>
                  </div>

                  <div class="pos-tender-list">
                    <button
                      v-for="t in enabledTenderList"
                      :key="t"
                      class="pos-tender-row"
                      :class="{ 'pos-tender-row--selected': selectedTender === t }"
                      @click="selectTender(t)"
                    >
                      <div class="pos-tender-row__icon">
                        <v-icon size="20">{{ TENDER_ICONS[t] }}</v-icon>
                      </div>
                      <div class="pos-tender-row__label">{{ TENDER_DISPLAY[t] }}</div>
                      <div class="pos-tender-row__check">
                        <v-icon v-if="selectedTender === t" size="18" color="primary">check</v-icon>
                      </div>
                    </button>
                  </div>

                  <div class="pos-payment-sheet__actions">
                    <button class="pos-sheet-cancel" @click="paymentStep = 'idle'">Cancel</button>
                    <button class="pos-charge-btn pos-charge-btn--in-sheet" @click="processPayment">
                      Charge {{ fmt(grandTotal) }}
                    </button>
                  </div>
                </template>

                <!-- Processing -->
                <template v-else-if="paymentStep === 'processing'">
                  <div class="pos-payment-sheet__center">
                    <v-progress-circular indeterminate color="primary" size="52" class="mb-4" />
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
                    <div class="pos-payment-sheet__big-amount">{{ fmt(grandTotal) }}</div>
                    <div class="pos-payment-sheet__sub">
                      Paid via {{ TENDER_DISPLAY[selectedTender] }}
                      <span v-if="selectedTender === 'cash'"> · change due {{ fmt(Math.ceil(grandTotal / 10) * 10 - grandTotal) }}</span>
                    </div>
                  </div>

                  <div class="pos-payment-sheet__receipt-actions">
                    <button class="pos-receipt-action" @click="completeApproved">
                      <v-icon size="16">mail</v-icon>
                      <span>Email receipt</span>
                    </button>
                    <button class="pos-receipt-action" @click="completeApproved">
                      <v-icon size="16">printer</v-icon>
                      <span>Print receipt</span>
                    </button>
                    <button class="pos-receipt-action pos-receipt-action--primary" @click="completeApproved">
                      <span>Done</span>
                    </button>
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

    <!-- Discount dialog (small floating) -->
    <MpDialog v-model="discountDialogOpen" size="sm" title="Apply discount">
      <v-text-field
        v-model.number="pendingDiscount"
        label="Discount %"
        type="number"
        :min="0"
        :max="100"
        variant="outlined"
        density="compact"
        suffix="%"
      />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="discountDialogOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="applyDiscount">Apply</v-btn>
      </template>
    </MpDialog>

    <!-- New customer dialog -->
    <MpDialog v-model="newCustomerOpen" size="sm" title="New customer">
      <v-text-field
        v-model="newCustomerDraft.name"
        label="Full name"
        variant="outlined"
        density="compact"
        prepend-inner-icon="user"
      />
      <v-text-field
        v-model="newCustomerDraft.email"
        label="Email"
        variant="outlined"
        density="compact"
        prepend-inner-icon="mail"
      />
      <v-text-field
        v-model="newCustomerDraft.phone"
        label="Phone"
        variant="outlined"
        density="compact"
        prepend-inner-icon="phone"
      />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="newCustomerOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!newCustomerDraft.name.trim()" @click="saveNewCustomer">Save</v-btn>
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
  --cloud-retail-accent: #0d9488;
  width: 100vw;
  height: 100vh;
  background: color-mix(in oklch, var(--text-primary) 6%, var(--surface-primary));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ────────────────────────────────────────────────────── */
.pos-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid color-mix(in oklch, var(--text-primary) 8%, transparent);
  flex-shrink: 0;
  flex-wrap: wrap;

  &__back {
    color: var(--muted);
    font-size: 13px;
  }

  &__title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    flex-wrap: wrap;
  }
}

.offline-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: white;
  background: #f59e0b;
  padding: 2px 6px;
  border-radius: 4px;
}

/* ── Stage ─────────────────────────────────────────────────────── */
.pos-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
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
/* Shopify POS token vars (scoped to PosPreview) */
$pos-ink: #111827;
$pos-muted: #6b7280;
$pos-hairline: #e5e7eb;
$pos-surface: #ffffff;
$pos-bg: #f4f4f5;

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
    padding: 4px 8px;
    border-radius: 6px;
    color: $pos-muted;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

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
  }
}

.pos-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid $pos-hairline;
  border-radius: 999px;
  background: $pos-surface;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: $pos-muted;
  white-space: nowrap;
  transition: background 100ms, color 100ms, border-color 100ms;

  &:hover { background: rgba(17, 24, 39, 0.04); color: $pos-ink; }

  &--active {
    background: $pos-ink;
    border-color: $pos-ink;
    color: white;

    &:hover { background: $pos-ink; color: white; }
  }
}

/* ── Product tile (Shopify-style) ──────────────────────────────── */
.pos-product-tile {
  display: flex;
  flex-direction: column;
  background: $pos-surface;
  border: 1px solid $pos-hairline;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  position: relative;
  transition: transform 120ms, box-shadow 120ms, border-color 120ms;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(17, 24, 39, 0.07);
    border-color: rgba(17, 24, 39, 0.12);
  }

  &:active {
    transform: translateY(0);
  }

  &__image {
    height: 88px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  &__variants-badge {
    position: absolute;
    top: 7px;
    right: 7px;
    font-size: 10px;
    font-weight: 600;
    color: $pos-ink;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(4px);
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid rgba(17, 24, 39, 0.1);
    pointer-events: none;
  }

  &__body {
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__name {
    font-size: 12px;
    font-weight: 600;
    color: $pos-ink;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  &__variant {
    font-size: 11px;
    font-weight: 400;
    color: $pos-muted;
    line-height: 1.3;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__price {
    font-size: 13px;
    font-weight: 700;
    color: $pos-ink;
    margin-top: 3px;
  }
}

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

.pos-customer-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 18px 8px;
  padding: 6px 10px;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cloud-retail-accent);
  width: fit-content;

  &__x {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: currentColor;
    cursor: pointer;
    padding: 0;
    opacity: 0.7;

    &:hover { opacity: 1; background: rgba(13, 148, 136, 0.15); }
  }
}

.pos-empty-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid $pos-hairline;
  border-radius: 999px;
  background: $pos-surface;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: $pos-ink;

  &:hover { background: rgba(17, 24, 39, 0.04); }
}

.pos-line {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.04);
  cursor: pointer;
  transition: background 80ms;

  &:last-child { border-bottom: none; }
  &:hover      { background: rgba(17, 24, 39, 0.03); }
  &:active     { background: rgba(17, 24, 39, 0.07); }

  &__thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  &__body {
    min-width: 0;
  }

  &__name {
    font-size: 12.5px;
    font-weight: 600;
    color: $pos-ink;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__variant {
    font-size: 11.5px;
    color: $pos-muted;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sku {
    font-size: 10.5px;
    color: #9ca3af;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  &__pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    white-space: nowrap;
    min-width: 56px;
  }

  &__qtytext {
    font-size: 11px;
    font-weight: 600;
    color: $pos-muted;
  }

  &__was {
    font-size: 11px;
    color: $pos-muted;
    text-decoration: line-through;
  }

  &__now {
    font-size: 13px;
    font-weight: 700;
    color: $pos-ink;
  }
}

.pos-line-tag {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 700;

  &--override { background: #fef3c7; color: #a16207; }
  &--note     { background: #dbeafe; color: #1d4ed8; }
}

/* ── Cart total rows ───────────────────────────────────────────── */
.pos-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: $pos-muted;
  padding: 3px 0;

  &--discount { color: #16a34a; }

  &--grand {
    font-size: 16px;
    font-weight: 700;
    color: $pos-ink;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid $pos-hairline;
  }
}

/* ── Qty controls ──────────────────────────────────────────────── */
.pos-qty-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: $pos-surface;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: $pos-ink;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);

  &:hover { background: rgba(17, 24, 39, 0.06); }

  &--lg {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 16px;
    background: rgba(17, 24, 39, 0.05);
    box-shadow: none;
  }
}

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

.pos-secondary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid $pos-hairline;
  background: $pos-surface;
  color: $pos-muted;
  cursor: pointer;
  transition: background 100ms, color 100ms, border-color 100ms;

  &:hover {
    background: rgba(17, 24, 39, 0.04);
    color: $pos-ink;
    border-color: rgba(17, 24, 39, 0.18);
  }
}

/* ── Charge button (Shopify-iconic) ────────────────────────────── */
.pos-charge-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 18px 18px;
  padding: 16px;
  border-radius: 12px;
  border: none;
  background: $pos-ink;
  color: white;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.2px;
  cursor: pointer;
  transition: opacity 150ms, transform 80ms;
  flex-shrink: 0;

  &:hover { background: #0b1220; }
  &:active { transform: scale(0.995); }

  &--disabled {
    background: rgba(17, 24, 39, 0.12);
    color: rgba(17, 24, 39, 0.45);
    cursor: not-allowed;
    pointer-events: none;
  }

  &--in-sheet {
    flex: 1;
    margin: 0;
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

.pos-status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;

  &--completed { background: #dcfce7; color: #15803d; }
  &--refunded  { background: #fee2e2; color: #b91c1c; }
  &--partial   { background: #ffedd5; color: #c2410c; }
  &--voided    { background: #f3f4f6; color: #6b7280; }
  &--suspended { background: #fef3c7; color: #a16207; }
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

.pos-tender-row {
  display: grid;
  grid-template-columns: 40px 1fr 22px;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border: 1px solid $pos-hairline;
  border-radius: 12px;
  background: $pos-surface;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: $pos-ink;
  text-align: left;
  transition: border-color 100ms, background 100ms;

  &:hover {
    background: rgba(17, 24, 39, 0.03);
    border-color: rgba(17, 24, 39, 0.16);
  }

  &__icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(17, 24, 39, 0.06);
    color: $pos-ink;
  }

  &__label { font-size: 14px; font-weight: 600; }

  &__check { display: flex; justify-content: center; }

  &--selected {
    border-color: var(--cloud-retail-accent);
    background: rgba(13, 148, 136, 0.06);
  }

  &--selected .pos-tender-row__icon {
    background: var(--cloud-retail-accent);
    color: white;
  }
}

.pos-sheet-cancel {
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid $pos-hairline;
  background: $pos-surface;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: $pos-ink;

  &:hover { background: rgba(17, 24, 39, 0.04); }
}

.pos-receipt-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid $pos-hairline;
  background: $pos-surface;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: $pos-ink;

  &:hover { background: rgba(17, 24, 39, 0.04); }

  &--primary {
    background: $pos-ink;
    color: white;
    border-color: $pos-ink;

    &:hover { background: #0b1220; }
  }
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

/* ── Variant picker overlay (contained within .pos-screen) ─────── */
.pos-variant-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: flex-end;
}

.pos-variant-sheet {
  width: 100%;
  background: $pos-surface;
  border-radius: 16px 16px 0 0;
  padding: 10px 0 8px;
  box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.18);
  max-height: 72%;
  display: flex;
  flex-direction: column;

  &__grabber {
    width: 32px;
    height: 4px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.12);
    margin: 0 auto 10px;
    flex-shrink: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px 10px;
    border-bottom: 1px solid $pos-hairline;
    flex-shrink: 0;
  }

  &__thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: $pos-ink;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sub {
    font-size: 11px;
    color: $pos-muted;
    margin-top: 1px;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: rgba(17, 24, 39, 0.07);
    border-radius: 50%;
    cursor: pointer;
    color: $pos-muted;
    flex-shrink: 0;

    &:hover { background: rgba(17, 24, 39, 0.12); }
  }

  &__list {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
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

  &__action--danger &__action-label { color: #dc2626; }

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

  &__field-label {
    font-size: 11px;
    font-weight: 700;
    color: $pos-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input,
  &__textarea {
    width: 100%;
    border: 1px solid $pos-hairline;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 13px;
    font-family: inherit;
    color: $pos-ink;
    background: $pos-surface;
    outline: none;

    &:focus { border-color: rgba(17, 24, 39, 0.28); }
  }

  &__textarea { resize: none; }

  &__hint {
    font-size: 11px;
    color: $pos-muted;
  }

  &__primary {
    border: none;
    border-radius: 10px;
    padding: 10px;
    background: $pos-ink;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &:hover { opacity: 0.92; }
  }

  &__ghost {
    border: none;
    border-radius: 10px;
    padding: 9px;
    background: transparent;
    color: $pos-muted;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;

    &:hover { background: rgba(17, 24, 39, 0.04); }

    &--danger { color: #dc2626; }
  }
}

/* ── Variant sheet slide-up transition ─────────────────────────── */
.pos-variant-up-enter-active {
  animation: pos-sheet-up 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.pos-variant-up-leave-active {
  animation: pos-sheet-up 160ms cubic-bezier(0.55, 0, 1, 0.45) reverse;
}

/* ── Customer picker sheet ─────────────────────────────────────── */
.pos-customer-picker {
  max-height: 84%;

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

  &__remove {
    border: none;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: $pos-muted;
    cursor: pointer;
    padding: 5px 8px;
    border-radius: 7px;
    flex-shrink: 0;

    &:hover { color: #dc2626; background: rgba(220, 38, 38, 0.08); }
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

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: rgba(17, 24, 39, 0.07);
    border-radius: 50%;
    cursor: pointer;
    color: $pos-muted;
    flex-shrink: 0;

    &:hover { background: rgba(17, 24, 39, 0.12); }
  }

  &__form {
    padding: 14px;
    overflow-y: auto;
  }

  &__form-actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 8px;
    margin-top: 14px;
  }

  &__save {
    border: none;
    border-radius: 12px;
    background: var(--cloud-retail-accent, #0d9488);
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    padding: 13px;
    transition: filter 100ms;

    &:hover { filter: brightness(1.05); }

    &--disabled { opacity: 0.5; pointer-events: none; }
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

  .pos-charge-btn { margin: 12px 0 0; }
}

.pos-stock-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;

  &--in  { background: #dcfce7; color: #15803d; }
  &--low { background: #fef3c7; color: #b45309; }
  &--out { background: #fee2e2; color: #b91c1c; }
}

.pos-product-tile--selected {
  border-color: var(--cloud-retail-accent, #0d9488);
  box-shadow: 0 0 0 1px var(--cloud-retail-accent, #0d9488);

  &:hover { border-color: var(--cloud-retail-accent, #0d9488); }
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

.pos-tier-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;

  &--member { background: #f3f4f6; color: #4b5563; }
  &--silver { background: #e2e8f0; color: #475569; }
  &--gold   { background: #fef3c7; color: #a16207; }
  &--vip    { background: $pos-ink; color: #5eead4; }
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

.pos-receipt-preview {
  margin: 12px 14px;
  padding: 12px 14px;
  border: 1px dashed $pos-hairline;
  border-radius: 8px;
  font-family: monospace;
  font-size: 10px;
  color: $pos-muted;

  &__store {
    text-align: center;
    font-weight: 700;
    color: $pos-ink;
    font-size: 11px;
    margin-bottom: 8px;
  }

  &__line {
    display: flex;
    justify-content: space-between;
    padding: 1px 0;

    &--total {
      border-top: 1px dashed $pos-hairline;
      margin-top: 4px;
      padding-top: 4px;
      font-weight: 700;
      color: $pos-ink;
    }
  }

  &__footer {
    text-align: center;
    margin-top: 8px;
    font-style: italic;
  }
}

/* ── Transaction detail sheet ──────────────────────────────────── */
.pos-txn-sheet {
  width: 100%;
  background: $pos-surface;
  border-radius: 16px 16px 0 0;
  padding: 10px 16px 14px;
  box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.18);
  max-height: 86%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid $pos-hairline;
  }

  &__id {
    flex: 1;
    font-size: 14px;
    font-weight: 700;
    font-family: monospace;
    color: $pos-ink;
  }

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
  }
}

.pos-receipt-action--danger {
  color: #ef4444;

  &:hover { background: #fee2e2; }
}

/* ── Tactile press states ──────────────────────────────────────── */
.pos-smartgrid__tile:active,
.pos-product-tile:active { transform: scale(0.98); }
.pos-qty-btn:active { background: rgba(17, 24, 39, 0.1); }
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
  .pos-variant-sheet, .pos-txn-sheet { max-height: 92%; }
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

.pos-charge-btn--bar {
  margin: 0;
  padding: 10px 18px;
  font-size: 14px;
  flex-shrink: 0;
  width: auto;
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
    padding: 10px 12px;
    gap: 8px;

    &__back  { font-size: 12px; }
    &__title { display: none; }
    &__controls {
      width: 100%;
      margin-left: 0;
      justify-content: space-between;
      gap: 8px;
    }
  }

  .pos-stage { padding: 12px; }

  .pos-device-frame__bezel-top,
  .pos-device-frame__bezel-bottom { height: 18px; }
}

/* Small tablet (sm 601–960): tighten chrome but keep layout intact */
@media (min-width: 601px) and (max-width: 960px) {
  .pos-preview-shell { --frame-margin: 32px; }
  .pos-header        { padding: 10px 16px; gap: 12px; }
  .pos-stage         { padding: 16px; }
}
</style>
