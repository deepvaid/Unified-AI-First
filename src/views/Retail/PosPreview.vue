<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import type { TenderType } from '@/stores/useRetail'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()

const accountId = computed(() => route.params.accountId as string)

/* ── Device frame select ───────────────────────────────────────── */
type DeviceFrame = 'ipad' | 'iphone' | 'android-tablet'
const device = ref<DeviceFrame>('ipad')

const DEVICE_FRAMES: { value: DeviceFrame; label: string; icon: string; w: number; h: number }[] = [
  { value: 'ipad',           label: 'iPad',           icon: 'tablet',       w: 768, h: 1024 },
  { value: 'iphone',         label: 'iPhone',         icon: 'smartphone',   w: 390, h: 844 },
  { value: 'android-tablet', label: 'Android Tablet', icon: 'tablet',       w: 800, h: 1280 },
]

// currentFrame available if needed for future device-specific layout tweaks

/* ── Offline mode toggle ───────────────────────────────────────── */
const isOffline = computed(() => store.offlineMode)
function toggleOffline() { store.setOfflineMode(!store.offlineMode) }

/* ── Associate (mock logged-in associate) ──────────────────────── */
const activeAssociateId = ref('assoc-1')
const activeAssociate = computed(() => store.associateList.find((a) => a.id === activeAssociateId.value) ?? store.associateList[0]!)

/* ── POS navigation ────────────────────────────────────────────── */
type PosView = 'sale' | 'customers' | 'transactions' | 'settings' | 'getapp'
const posView = ref<PosView>('sale')

const POS_NAV = [
  { key: 'sale',         icon: 'shopping-cart',  label: 'Sale' },
  { key: 'customers',    icon: 'users',           label: 'Customers' },
  { key: 'transactions', icon: 'receipt',         label: 'History' },
  { key: 'settings',     icon: 'settings',        label: 'Settings' },
  { key: 'getapp',       icon: 'download-cloud',  label: 'Get App' },
] as const

/* ── Catalog ───────────────────────────────────────────────────── */
const catalogSearch = ref('')

const catalog = computed(() =>
  store.channelPriceList.filter((p) =>
    !catalogSearch.value || p.productName.toLowerCase().includes(catalogSearch.value.toLowerCase()) || p.sku.toLowerCase().includes(catalogSearch.value.toLowerCase()),
  ),
)

/* ── Cart ──────────────────────────────────────────────────────── */
interface CartLine {
  sku: string
  name: string
  price: number
  qty: number
}

const cart = ref<CartLine[]>([])
const discountPct = ref(0)
const customerName = ref('')

function addToCart(item: { sku: string; productName: string; pos: number }) {
  const existing = cart.value.find((c) => c.sku === item.sku)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ sku: item.sku, name: item.productName, price: item.pos, qty: 1 })
  }
}

function removeFromCart(sku: string) {
  cart.value = cart.value.filter((c) => c.sku !== sku)
}

function incrementQty(sku: string) {
  const line = cart.value.find((c) => c.sku === sku)
  if (line) line.qty++
}

function decrementQty(sku: string) {
  const line = cart.value.find((c) => c.sku === sku)
  if (!line) return
  if (line.qty <= 1) removeFromCart(sku)
  else line.qty--
}

const subtotal = computed(() => cart.value.reduce((s, c) => s + c.price * c.qty, 0))
const discountAmount = computed(() => subtotal.value * (discountPct.value / 100))
const taxAmount = computed(() => (subtotal.value - discountAmount.value) * 0.1)
const grandTotal = computed(() => subtotal.value - discountAmount.value + taxAmount.value)

function clearCart() {
  cart.value = []
  discountPct.value = 0
  customerName.value = ''
  discountDialogOpen.value = false
  customerDialogOpen.value = false
}

/* ── Discount dialog ───────────────────────────────────────────── */
const discountDialogOpen = ref(false)
const pendingDiscount = ref(0)

function applyDiscount() {
  discountPct.value = pendingDiscount.value
  discountDialogOpen.value = false
}

/* ── Customer dialog ───────────────────────────────────────────── */
const customerDialogOpen = ref(false)
const pendingCustomer = ref('')

function applyCustomer() {
  customerName.value = pendingCustomer.value
  customerDialogOpen.value = false
}

/* ── Payment flow ──────────────────────────────────────────────── */
type PaymentStep = 'idle' | 'select' | 'processing' | 'approved'
const paymentStep = ref<PaymentStep>('idle')
const selectedTender = ref<TenderType>('card')

function openPay() {
  if (cart.value.length === 0) return
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

function completeApproved() {
  // Append real transaction to store — the demo loop
  const locId = store.activeLocation?.id ?? store.locationList[0]!.id
  const txn = store.addTransaction({
    locationId: locId,
    registerId: store.registerList.find((r) => r.locationId === locId)?.id ?? store.registerList[0]!.id,
    associateId: activeAssociateId.value,
    customerName: customerName.value || undefined,
    total: grandTotal.value,
    tender: selectedTender.value,
    itemCount: cart.value.reduce((s, c) => s + c.qty, 0),
    lines: cart.value.map((c) => ({ sku: c.sku, name: c.name, qty: c.qty, price: c.price })),
  })
  lastTxnId.value = txn.id
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
const APPROVED_TEXT: Record<TenderType, string> = {
  card: 'Payment accepted',
  tap_to_pay: 'Tap payment accepted',
  cash: 'Cash received',
  gift_card: 'Gift card accepted',
  split: 'Split payment complete',
}

/* ── Recent transactions (for History tab in POS) ──────────────── */
const recentTxns = computed(() =>
  store.transactionList
    .filter((t) => t.associateId === activeAssociateId.value)
    .slice(0, 8),
)

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
        <v-chip size="x-small" variant="tonal" color="info" class="ml-2">Demo mode</v-chip>
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
        :class="`pos-device-frame--${device}`"
      >
        <!-- Bezel top (camera notch area) -->
        <div class="pos-device-frame__bezel-top">
          <div class="pos-device-frame__camera" />
        </div>

        <!-- POS Screen -->
        <div class="pos-screen">

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
                <div class="pos-rail__associate">
                  <v-avatar size="26" color="primary">
                    <span class="text-caption text-white" style="font-size: 9px; font-weight: 700;">
                      {{ activeAssociate?.name.split(' ').map((n) => n[0]).join('') ?? '' }}
                    </span>
                  </v-avatar>
                </div>
              </div>
            </div>

            <!-- ── SALE VIEW ──────────────────────────────────── -->
            <template v-if="posView === 'sale'">
              <!-- Product catalog pane -->
              <div class="pos-catalog">
                <div class="pos-catalog__search">
                  <v-text-field
                    v-model="catalogSearch"
                    placeholder="Search or scan barcode…"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="search"
                    hide-details
                    bg-color="surface"
                    style="font-size: 13px;"
                  />
                </div>

                <div class="pos-catalog__grid">
                  <button
                    v-for="item in catalog"
                    :key="item.sku"
                    class="pos-product-tile"
                    @click="addToCart(item)"
                  >
                    <div class="pos-product-tile__icon">
                      <v-icon size="20" color="primary">package</v-icon>
                    </div>
                    <div class="pos-product-tile__name">{{ item.productName }}</div>
                    <div class="pos-product-tile__sku">{{ item.sku }}</div>
                    <div class="pos-product-tile__price">{{ fmt(item.pos) }}</div>
                  </button>

                  <div v-if="catalog.length === 0" class="pos-catalog__empty">
                    <v-icon size="32" color="medium-emphasis">search</v-icon>
                    <div>No products found</div>
                  </div>
                </div>
              </div>

              <!-- Cart / right pane -->
              <div class="pos-cart">
                <div class="pos-cart__header">
                  <span class="pos-cart__title">Sale</span>
                  <span v-if="customerName" class="pos-cart__customer">
                    <v-icon size="12">user</v-icon> {{ customerName }}
                  </span>
                  <v-btn
                    v-if="cart.length > 0"
                    icon="x"
                    variant="text"
                    size="x-small"
                    class="ml-auto"
                    @click="clearCart"
                    title="Clear sale"
                  />
                </div>

                <!-- Line items -->
                <div class="pos-cart__lines">
                  <div v-if="cart.length === 0" class="pos-cart__empty">
                    <v-icon size="28" color="medium-emphasis">shopping-cart</v-icon>
                    <div style="font-size: 12px; margin-top: 6px; color: var(--muted);">Tap a product to add it</div>
                  </div>

                  <div v-for="line in cart" :key="line.sku" class="pos-cart__line">
                    <div class="pos-cart__line-name">{{ line.name }}</div>
                    <div class="pos-cart__line-controls">
                      <button class="pos-qty-btn" @click="decrementQty(line.sku)">−</button>
                      <span class="pos-qty-value">{{ line.qty }}</span>
                      <button class="pos-qty-btn" @click="incrementQty(line.sku)">+</button>
                    </div>
                    <div class="pos-cart__line-price">{{ fmt(line.price * line.qty) }}</div>
                    <button class="pos-cart__line-remove" @click="removeFromCart(line.sku)">
                      <v-icon size="12">x</v-icon>
                    </button>
                  </div>
                </div>

                <!-- Totals -->
                <div class="pos-cart__totals">
                  <div class="pos-total-row">
                    <span>Subtotal</span><span>{{ fmt(subtotal) }}</span>
                  </div>
                  <div v-if="discountPct > 0" class="pos-total-row pos-total-row--discount">
                    <span>Discount ({{ discountPct }}%)</span>
                    <span>−{{ fmt(discountAmount) }}</span>
                  </div>
                  <div class="pos-total-row">
                    <span>Tax (10%)</span><span>{{ fmt(taxAmount) }}</span>
                  </div>
                  <div class="pos-total-row pos-total-row--grand">
                    <span>Total</span><span>{{ fmt(grandTotal) }}</span>
                  </div>
                </div>

                <!-- Action bar -->
                <div class="pos-cart__actions">
                  <button class="pos-action-btn" @click="suspendSale">
                    <v-icon size="14">pause-circle</v-icon>Suspend
                  </button>
                  <button class="pos-action-btn" @click="discountDialogOpen = true; pendingDiscount = discountPct">
                    <v-icon size="14">percent</v-icon>Discount
                  </button>
                  <button class="pos-action-btn" @click="customerDialogOpen = true; pendingCustomer = customerName">
                    <v-icon size="14">user</v-icon>Customer
                  </button>
                  <button
                    class="pos-pay-btn"
                    :class="{ 'pos-pay-btn--disabled': cart.length === 0 }"
                    @click="openPay"
                  >
                    <v-icon size="16">credit-card</v-icon>
                    Pay {{ fmt(grandTotal) }}
                  </button>
                </div>
              </div>
            </template>

            <!-- ── CUSTOMERS VIEW ──────────────────────────────── -->
            <div v-else-if="posView === 'customers'" class="pos-placeholder-pane">
              <v-icon size="40" color="medium-emphasis">users</v-icon>
              <div class="pos-placeholder-pane__title">Customer lookup</div>
              <div class="pos-placeholder-pane__sub">Search by name, email, or phone number to attach a loyalty profile to this sale.</div>
            </div>

            <!-- ── TRANSACTIONS VIEW ───────────────────────────── -->
            <div v-else-if="posView === 'transactions'" class="pos-history-pane">
              <div class="pos-history-pane__header">Recent — {{ activeAssociate?.name ?? '' }}</div>
              <div v-if="recentTxns.length === 0" class="pos-placeholder-pane">
                <v-icon size="36" color="medium-emphasis">receipt</v-icon>
                <div class="pos-placeholder-pane__sub">No recent transactions</div>
              </div>
              <div
                v-for="txn in recentTxns"
                :key="txn.id"
                class="pos-history-row"
              >
                <div>
                  <div class="pos-history-row__id">{{ txn.id }}</div>
                  <div class="pos-history-row__meta">{{ txn.itemCount }} item{{ txn.itemCount !== 1 ? 's' : '' }} · {{ txn.tender }}</div>
                </div>
                <div class="pos-history-row__total" :class="txn.total < 0 ? 'pos-history-row__total--neg' : ''">
                  {{ fmt(txn.total) }}
                </div>
              </div>
            </div>

            <!-- ── SETTINGS VIEW ──────────────────────────────── -->
            <div v-else-if="posView === 'settings'" class="pos-placeholder-pane">
              <v-icon size="40" color="medium-emphasis">settings</v-icon>
              <div class="pos-placeholder-pane__title">POS Settings</div>
              <div class="pos-placeholder-pane__sub">Printer, display, and tax configuration managed from the web back-office.</div>
            </div>

            <!-- ── GET APP VIEW ───────────────────────────────── -->
            <div v-else-if="posView === 'getapp'" class="pos-getapp-pane">

              <!-- Android: real APK download -->
              <template v-if="isAndroidDevice">
                <div class="pos-getapp-pane__icon">
                  <v-icon size="36" color="primary">tablet</v-icon>
                </div>
                <div class="pos-getapp-pane__title">Install Retail Cloud POS</div>
                <div class="pos-getapp-pane__sub">Scan the QR code with your Android device or tap Download to install the app directly.</div>

                <!-- QR code (served by qrserver.com using local APK URL) -->
                <div class="pos-getapp-qr">
                  <img
                    :src="apkQrUrl"
                    alt="QR code to download Retail Cloud POS APK"
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
                <div class="pos-getapp-pane__sub">Retail Cloud POS for iOS is distributed to beta testers via Apple TestFlight.</div>

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
        </div><!-- pos-screen -->

        <!-- Bezel bottom (home area) -->
        <div class="pos-device-frame__bezel-bottom">
          <div class="pos-device-frame__home" />
        </div>
      </div><!-- pos-device-frame -->
    </div><!-- pos-stage -->

    <!-- ── Payment overlay (rendered inside the device frame via portal) ── -->
    <v-overlay
      :model-value="paymentStep !== 'idle'"
      class="pos-payment-overlay"
      persistent
      scrim="rgba(0,0,0,0.6)"
    >
      <div class="pos-payment-modal">

        <!-- Select tender -->
        <template v-if="paymentStep === 'select'">
          <div class="pos-payment-modal__title">Select payment method</div>
          <div class="pos-payment-modal__amount">{{ fmt(grandTotal) }}</div>
          <div class="pos-tender-grid">
            <button
              v-for="t in (['card', 'tap_to_pay', 'cash', 'split'] as TenderType[])"
              :key="t"
              class="pos-tender-btn"
              :class="{ 'pos-tender-btn--selected': selectedTender === t }"
              @click="selectTender(t)"
            >
              <v-icon size="22">{{ TENDER_ICONS[t] }}</v-icon>
              <span>{{ TENDER_DISPLAY[t] }}</span>
            </button>
          </div>
          <div class="d-flex gap-3 mt-4">
            <button class="pos-cancel-btn" @click="paymentStep = 'idle'">Cancel</button>
            <button class="pos-confirm-btn" @click="processPayment">
              Charge {{ fmt(grandTotal) }}
            </button>
          </div>
        </template>

        <!-- Processing -->
        <template v-else-if="paymentStep === 'processing'">
          <v-progress-circular indeterminate color="primary" size="52" class="mb-4" />
          <div class="pos-payment-modal__title">Processing…</div>
          <div class="pos-payment-modal__sub">{{ PROCESSING_TEXT[selectedTender] }}</div>
        </template>

        <!-- Approved -->
        <template v-else-if="paymentStep === 'approved'">
          <div class="pos-approved-icon">
            <v-icon size="48" color="success">circle-check-big</v-icon>
          </div>
          <div class="pos-payment-modal__title" style="color: #22c55e;">Approved</div>
          <div class="pos-payment-modal__amount">{{ fmt(grandTotal) }}</div>
          <div class="pos-payment-modal__sub">
            {{ APPROVED_TEXT[selectedTender] }}
            <span v-if="selectedTender === 'cash'"> — change due: {{ fmt(Math.ceil(grandTotal / 10) * 10 - grandTotal) }}</span>
          </div>
          <div class="d-flex gap-3 mt-5">
            <button class="pos-cancel-btn" @click="completeApproved">No receipt</button>
            <button class="pos-confirm-btn" @click="completeApproved">
              <v-icon size="16" style="margin-right: 4px;">printer</v-icon>
              Print receipt
            </button>
          </div>
        </template>
      </div>
    </v-overlay>

    <!-- Discount dialog (small floating) -->
    <v-dialog v-model="discountDialogOpen" max-width="340">
      <v-card rounded="lg" class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-3">Apply discount</div>
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
        <div class="d-flex justify-end gap-2 mt-3">
          <v-btn variant="text" class="text-none" @click="discountDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="applyDiscount">Apply</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Customer dialog -->
    <v-dialog v-model="customerDialogOpen" max-width="360">
      <v-card rounded="lg" class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-3">Attach customer</div>
        <v-text-field
          v-model="pendingCustomer"
          label="Customer name or email"
          variant="outlined"
          density="compact"
          prepend-inner-icon="user"
        />
        <div class="d-flex justify-end gap-2 mt-3">
          <v-btn variant="text" class="text-none" @click="customerDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="applyCustomer">Attach</v-btn>
        </div>
      </v-card>
    </v-dialog>

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

  </div>
</template>

<style scoped lang="scss">
/* ── Shell ─────────────────────────────────────────────────────── */
.pos-preview-shell {
  width: 100vw;
  height: 100vh;
  background: color-mix(in oklch, var(--ink) 6%, var(--surface-1));
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
  border-bottom: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
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
    color: var(--ink);
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

  &--ipad {
    width: min(768px, calc(100vw - 48px));
    height: min(780px, calc(100vh - 140px));
  }

  &--iphone {
    width: min(390px, calc(100vw - 48px));
    height: min(780px, calc(100vh - 140px));
  }

  &--android-tablet {
    width: min(800px, calc(100vw - 48px));
    height: min(780px, calc(100vh - 140px));
  }

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
.pos-rail {
  width: 64px;
  flex-shrink: 0;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  padding: 8px 0;

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    margin-bottom: 8px;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 4px;
    border-radius: 8px;
    margin: 0 4px;
    cursor: pointer;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 9px;
    font-weight: 500;
    transition: background 120ms, color 120ms;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.8);
    }

    &--active {
      background: rgba(13, 148, 136, 0.25);
      color: #0d9488;
    }
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding: 8px;
  }

  &__associate {
    cursor: pointer;
  }
}

/* ── Catalog ───────────────────────────────────────────────────── */
.pos-catalog {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
  overflow: hidden;

  &__search {
    padding: 10px 12px 8px;
    flex-shrink: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    padding: 0 10px 10px;
    overflow-y: auto;
    align-content: start;
  }

  &__empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--muted);
    font-size: 12px;
    gap: 8px;
  }
}

/* ── Product tile ──────────────────────────────────────────────── */
.pos-product-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px;
  border: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
  border-radius: 10px;
  background: var(--surface-1);
  cursor: pointer;
  text-align: left;
  transition: border-color 100ms, background 100ms;
  min-height: 90px;

  &:hover {
    border-color: var(--cloud-retail-accent);
    background: color-mix(in oklch, var(--cloud-retail-accent) 5%, var(--surface-1));
  }

  &:active {
    transform: scale(0.97);
  }

  &__icon {
    margin-bottom: 2px;
  }

  &__name {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__sku {
    font-size: 9px;
    color: var(--muted);
    font-family: monospace;
  }

  &__price {
    font-size: 12px;
    font-weight: 700;
    color: var(--cloud-retail-accent);
    margin-top: auto;
  }
}

/* ── Cart ──────────────────────────────────────────────────────── */
.pos-cart {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: color-mix(in oklch, var(--ink) 1.5%, var(--surface-1));

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px 8px;
    border-bottom: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
  }

  &__customer {
    font-size: 11px;
    color: var(--cloud-retail-accent);
    display: flex;
    align-items: center;
    gap: 3px;
  }

  &__lines {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
  }

  &__line {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: 6px;
    padding: 7px 0;
    border-bottom: 1px solid color-mix(in oklch, var(--ink) 6%, transparent);
    font-size: 11px;

    &:last-child { border-bottom: none; }
  }

  &__line-name {
    font-weight: 500;
    color: var(--ink);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 11px;
  }

  &__line-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__line-price {
    font-weight: 700;
    font-size: 11px;
    color: var(--ink);
    white-space: nowrap;
  }

  &__line-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: none;
    background: color-mix(in oklch, var(--ink) 10%, transparent);
    cursor: pointer;
    color: var(--muted);
    padding: 0;

    &:hover { background: #ef4444; color: white; }
  }

  &__totals {
    padding: 8px 12px;
    border-top: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
    flex-shrink: 0;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    padding: 8px;
    border-top: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
    flex-shrink: 0;
  }
}

/* ── Cart total rows ───────────────────────────────────────────── */
.pos-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
  padding: 2px 0;

  &--discount { color: #22c55e; }

  &--grand {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed color-mix(in oklch, var(--ink) 12%, transparent);
  }
}

/* ── Qty controls ──────────────────────────────────────────────── */
.pos-qty-btn {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid color-mix(in oklch, var(--ink) 15%, transparent);
  background: var(--surface-1);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent); border-color: var(--cloud-retail-accent); }
}

.pos-qty-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  min-width: 18px;
  text-align: center;
}

/* ── Action buttons ────────────────────────────────────────────── */
.pos-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklch, var(--ink) 10%, transparent);
  background: var(--surface-1);
  cursor: pointer;
  font-size: 9px;
  font-weight: 600;
  color: var(--muted);
  transition: border-color 100ms;

  &:hover {
    border-color: var(--cloud-retail-accent);
    color: var(--cloud-retail-accent);
  }
}

.pos-pay-btn {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: var(--cloud-retail-accent);
  color: white;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 150ms;

  &:hover { opacity: 0.9; }
  &:active { opacity: 0.8; transform: scale(0.99); }

  &--disabled {
    background: color-mix(in oklch, var(--ink) 15%, transparent);
    color: var(--muted);
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* ── Placeholder pane ──────────────────────────────────────────── */
.pos-placeholder-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 8px;
  text-align: center;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
  }

  &__sub {
    font-size: 12px;
    color: var(--muted);
    max-width: 260px;
  }
}

/* ── History pane ──────────────────────────────────────────────── */
.pos-history-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
    flex-shrink: 0;
  }
}

.pos-history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid color-mix(in oklch, var(--ink) 5%, transparent);
  cursor: default;

  &:hover { background: color-mix(in oklch, var(--ink) 2%, transparent); }

  &__id {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    font-family: monospace;
  }

  &__meta {
    font-size: 11px;
    color: var(--muted);
  }

  &__total {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);

    &--neg { color: #ef4444; }
  }
}

/* ── Payment modal ─────────────────────────────────────────────── */
.pos-payment-overlay :deep(.v-overlay__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pos-payment-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgb(var(--v-theme-surface));
  border-radius: 20px;
  padding: 32px;
  width: min(380px, calc(100vw - 32px));
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  pointer-events: all;

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 4px;
  }

  &__amount {
    font-size: 32px;
    font-weight: 800;
    color: var(--cloud-retail-accent);
    margin-bottom: 16px;
    letter-spacing: -0.5px;
  }

  &__sub {
    font-size: 13px;
    color: var(--muted);
  }
}

.pos-approved-icon {
  margin-bottom: 12px;
}

.pos-tender-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.pos-tender-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid color-mix(in oklch, var(--ink) 10%, transparent);
  background: var(--surface-1);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  transition: border-color 120ms, background 120ms;

  &:hover { border-color: var(--cloud-retail-accent); }

  &--selected {
    border-color: var(--cloud-retail-accent);
    background: color-mix(in oklch, var(--cloud-retail-accent) 10%, var(--surface-1));
    color: var(--cloud-retail-accent);
  }
}

.pos-cancel-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in oklch, var(--ink) 15%, transparent);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);

  &:hover { background: color-mix(in oklch, var(--ink) 5%, transparent); }
}

.pos-confirm-btn {
  flex: 2;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: var(--cloud-retail-accent);
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:hover { opacity: 0.9; }
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
    background: color-mix(in oklch, var(--cloud-retail-accent) 12%, var(--surface-1));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
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
  background: var(--surface-1);
  border: 1px solid var(--hairline);

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
  background: color-mix(in oklch, var(--ink) 6%, transparent);
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.2px;
}

.pos-getapp-steps {
  width: 100%;
  max-width: 300px;
  background: var(--surface-1);
  border: 1px solid var(--hairline);
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
    color: var(--ink);
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
</style>
