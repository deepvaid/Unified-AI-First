<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCommerceStore,
  SALES_CHANNELS,
  SHIPPING_RATES,
  draftOrderTotal,
  type DraftLineItem,
  type DraftOrderInput,
  type OrderAddress,
  type Product,
} from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})
const draftsRoute = computed(() => ({ name: 'DraftOrders', params: { accountId: accountId.value } }))

const editingId = computed(() => {
  const raw = route.params.draftId
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? Number(value) : null
})
const isEdit = computed(() => editingId.value !== null)
const editingDraft = computed(() => isEdit.value ? store.draftOrders.find(d => d.id === editingId.value) : undefined)

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// ── Contact ───────────────────────────────────────────────────────
interface SeedContact { name: string; email: string; phone: string; city: string }
const CONTACTS: SeedContact[] = [
  { name: 'James Anderson', email: 'james.anderson@email.com', phone: '+1 (415) 555-0134', city: 'San Francisco, CA' },
  { name: 'Sofia Thompson', email: 'sofia.thompson@email.com', phone: '+1 (212) 555-0188', city: 'New York, NY' },
  { name: 'Liam Martinez', email: 'liam.martinez@email.com', phone: '+1 (512) 555-0142', city: 'Austin, TX' },
  { name: 'Emma Johnson', email: 'emma.johnson@email.com', phone: '+1 (312) 555-0117', city: 'Chicago, IL' },
  { name: 'Noah Williams', email: 'noah.williams@email.com', phone: '+1 (206) 555-0161', city: 'Seattle, WA' },
  { name: 'Olivia Brown', email: 'olivia.brown@email.com', phone: '+1 (305) 555-0129', city: 'Miami, FL' },
  { name: 'Ethan Davis', email: 'ethan.davis@email.com', phone: '+1 (617) 555-0175', city: 'Boston, MA' },
  { name: 'Ava Miller', email: 'ava.miller@email.com', phone: '+1 (720) 555-0153', city: 'Denver, CO' },
]

const contactMode = ref<'search' | 'new'>('search')
const selectedContact = ref<SeedContact | null>(null)
const customer = ref('')
const email = ref('')
const phone = ref('')
const salesChannel = ref('')

function onContactSelect(contact: SeedContact | null) {
  selectedContact.value = contact
  customer.value = contact?.name ?? ''
  email.value = contact?.email ?? ''
  phone.value = contact?.phone ?? ''
}

function switchContactMode(mode: 'search' | 'new') {
  contactMode.value = mode
  if (mode === 'new') {
    selectedContact.value = null
    customer.value = ''
    email.value = ''
    phone.value = ''
  }
}

const hasCustomer = computed(() => customer.value.trim().length > 0)

const infoGrid = computed(() => [
  { label: 'Currency', value: 'USD' },
  { label: 'Region', value: selectedContact.value?.city.split(', ')[1] ?? '—' },
  { label: 'Sales Channel', value: salesChannel.value || '—' },
  { label: 'Email', value: email.value || '—' },
  { label: 'Phone', value: phone.value || '—' },
  { label: 'Country', value: 'United States' },
])

// ── Addresses ─────────────────────────────────────────────────────
const shippingAddress = ref<OrderAddress | null>(null)
const billingAddress = ref<OrderAddress | null>(null)
const addressDrawer = ref(false)
const addressKind = ref<'shipping' | 'billing'>('shipping')
const addressForm = ref<OrderAddress>({ name: '', line1: '', city: '', region: '', postalCode: '', country: 'United States' })
function openAddressDrawer(kind: 'shipping' | 'billing') {
  addressKind.value = kind
  const existing = kind === 'shipping' ? shippingAddress.value : billingAddress.value
  addressForm.value = existing
    ? { ...existing }
    : { name: customer.value, line1: '', city: '', region: '', postalCode: '', country: 'United States' }
  addressDrawer.value = true
}
function saveAddress() {
  const value = { ...addressForm.value }
  if (addressKind.value === 'shipping') shippingAddress.value = value
  else billingAddress.value = value
  addressDrawer.value = false
}

// ── Order lines ───────────────────────────────────────────────────
const lineItems = ref<DraftLineItem[]>([])
let lineSeq = 0
const productSearch = ref<Product | null>(null)

function addProduct(product: Product | null) {
  if (!product) return
  const existing = lineItems.value.find(li => !li.custom && li.sku === product.sku)
  if (existing) existing.qty++
  else lineItems.value.push({ id: ++lineSeq, name: product.name, sku: product.sku, price: parseFloat(product.price), qty: 1, custom: false })
  productSearch.value = null
}

function addCustomItem() {
  lineItems.value.push({ id: ++lineSeq, name: '', sku: '', price: 0, qty: 1, custom: true })
}

function removeLine(index: number) {
  lineItems.value.splice(index, 1)
}

const validLineItems = computed(() => lineItems.value.filter(li => li.name.trim().length > 0))

// ── Notes / summary ───────────────────────────────────────────────
const notes = ref('')
const shippingMethod = ref('Standard')
const discount = ref({ type: 'None', value: 0 })
const shippingOptions = Object.entries(SHIPPING_RATES).map(([method, price]) => ({
  title: `${method} — ${price === 0 ? 'Free' : `$${price.toFixed(2)}`}`,
  value: method,
}))

const subtotal = computed(() => validLineItems.value.reduce((s, li) => s + li.price * li.qty, 0))
const discountAmt = computed(() => {
  if (discount.value.type === 'Percentage') return subtotal.value * (discount.value.value / 100)
  if (discount.value.type === 'Fixed') return discount.value.value
  return 0
})
const shippingCost = computed(() => validLineItems.value.length ? (SHIPPING_RATES[shippingMethod.value] ?? 0) : 0)
const total = computed(() => draftOrderTotal({ lineItems: validLineItems.value, discount: discount.value, shippingMethod: shippingMethod.value }))

// ── Conversion checklist (fixes the legacy wall-of-text) ─────────
const checklist = computed(() => [
  { label: 'Customer selected', done: hasCustomer.value },
  { label: 'Sales channel chosen', done: !!salesChannel.value },
  { label: 'Shipping method set', done: !!shippingMethod.value },
  { label: 'At least one item added', done: validLineItems.value.length > 0 },
])
const canConvert = computed(() => checklist.value.every(c => c.done))

// ── Persistence ───────────────────────────────────────────────────
function buildInput(): DraftOrderInput {
  return {
    customer: customer.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    salesChannel: salesChannel.value,
    lineItems: validLineItems.value.map(li => ({ ...li })),
    shippingAddress: shippingAddress.value ? { ...shippingAddress.value } : null,
    billingAddress: billingAddress.value ? { ...billingAddress.value } : null,
    shippingMethod: shippingMethod.value,
    discount: { ...discount.value },
    notes: notes.value.trim(),
  }
}

/** Create or update the draft; returns its id. */
function persistDraft(): number {
  const input = buildInput()
  if (isEdit.value && editingId.value !== null && editingDraft.value) {
    store.updateDraftOrder(editingId.value, input)
    return editingId.value
  }
  return store.createDraftOrder(input).id
}

const canSave = computed(() => hasCustomer.value || validLineItems.value.length > 0)

function saveDraft() {
  if (!canSave.value) return
  persistDraft()
  router.push(draftsRoute.value)
}

function markAsPaid() {
  if (!canConvert.value) return
  const id = persistDraft()
  const order = store.convertDraftToOrder(id)
  if (order) router.push({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(order.id) } })
}

// Payment link
const paymentLinkDialog = ref(false)
const paymentLink = ref('')
const savedDraftId = ref<number | null>(null)
function generatePaymentLink() {
  if (!canConvert.value) return
  const id = persistDraft()
  savedDraftId.value = id
  store.setDraftOrderStatus(id, 'Invoice Sent')
  paymentLink.value = `https://pay.maropost.com/checkout/${accountId.value}/dft_${String(100000 + id * 7919)}`
  paymentLinkDialog.value = true
}
function copyPaymentLink() {
  navigator.clipboard?.writeText(paymentLink.value)
  notify('Payment link copied')
}
function closePaymentLink() {
  paymentLinkDialog.value = false
  router.push(draftsRoute.value)
}

// Leave guard
const confirmLeave = ref(false)

// ── Hydrate for edit ──────────────────────────────────────────────
onMounted(() => {
  const draft = editingDraft.value
  if (!draft) return
  customer.value = draft.customer
  email.value = draft.email
  phone.value = draft.phone
  salesChannel.value = draft.salesChannel
  const match = CONTACTS.find(c => c.name === draft.customer)
  if (match) { selectedContact.value = match } else if (draft.customer) { contactMode.value = 'new' }
  lineItems.value = draft.lineItems.map(li => ({ ...li, id: ++lineSeq }))
  shippingAddress.value = draft.shippingAddress ? { ...draft.shippingAddress } : null
  billingAddress.value = draft.billingAddress ? { ...draft.billingAddress } : null
  shippingMethod.value = draft.shippingMethod
  discount.value = { ...draft.discount }
  notes.value = draft.notes
})
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 bg-surface cdo-border-b">
      <MpPageHeader
        :title="isEdit ? `Edit Draft Order ${editingDraft?.draftNumber ?? ''}` : 'New Draft Order'"
        subtitle="Compose a manual order — save as draft, send a payment link, or mark it paid to convert."
        :back-to="draftsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="confirmLeave = true">Cancel</v-btn>
        </template>
      </MpPageHeader>
    </div>

    <!-- Content -->
    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div class="cdo-layout">
        <!-- ═══ LEFT ═══════════════════════════════════════════════ -->
        <div class="d-flex flex-column gap-5 min-width-0">

          <!-- Contact -->
          <v-card flat border rounded="lg" class="pa-6">
            <MpSectionHeader title="Contact">
              <template #actions>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none"
                  :prepend-icon="contactMode === 'search' ? 'user-plus' : 'search'"
                  @click="switchContactMode(contactMode === 'search' ? 'new' : 'search')"
                >
                  {{ contactMode === 'search' ? 'Create New Contact' : 'Search Existing Contact' }}
                </v-btn>
              </template>
            </MpSectionHeader>

            <v-autocomplete
              v-if="contactMode === 'search'"
              :model-value="selectedContact"
              :items="CONTACTS"
              item-title="name"
              return-object
              label="Search existing contact"
              prepend-inner-icon="search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              class="mt-2 mb-4"
              @update:model-value="onContactSelect"
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :subtitle="item.raw.email" />
              </template>
            </v-autocomplete>

            <v-row v-else dense class="mt-2 mb-2">
              <v-col cols="12" md="4"><v-text-field v-model="customer" label="Full name *" density="comfortable" hide-details /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="email" label="Email" type="email" density="comfortable" hide-details /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="phone" label="Phone" density="comfortable" hide-details /></v-col>
            </v-row>

            <v-select
              v-model="salesChannel"
              :items="SALES_CHANNELS"
              label="Sales channel *"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-4"
              style="max-width: 320px"
            />

            <v-divider class="mb-4" style="opacity: 0.5" />
            <div class="cdo-info-grid mb-2">
              <div v-for="cell in infoGrid" :key="cell.label">
                <div class="text-caption text-medium-emphasis">{{ cell.label }}</div>
                <div class="text-body-2 font-weight-medium">{{ cell.value }}</div>
              </div>
            </div>

            <v-divider class="my-4" style="opacity: 0.5" />
            <div class="cdo-address-row">
              <div v-for="kind in (['shipping', 'billing'] as const)" :key="kind" class="flex-grow-1">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-subtitle-2 font-weight-medium">{{ kind === 'shipping' ? 'Shipping Address' : 'Billing Address' }}</span>
                  <v-btn
                    variant="text"
                    size="small"
                    class="text-none"
                    :prepend-icon="(kind === 'shipping' ? shippingAddress : billingAddress) ? 'pencil' : 'plus'"
                    @click="openAddressDrawer(kind)"
                  >
                    {{ (kind === 'shipping' ? shippingAddress : billingAddress) ? 'Edit' : 'Add Address' }}
                  </v-btn>
                </div>
                <template v-if="kind === 'shipping' ? shippingAddress : billingAddress">
                  <div class="text-body-2" style="line-height: 1.6">
                    <div class="font-weight-medium">{{ (kind === 'shipping' ? shippingAddress : billingAddress)!.name }}</div>
                    <div>{{ (kind === 'shipping' ? shippingAddress : billingAddress)!.line1 }}</div>
                    <div>{{ (kind === 'shipping' ? shippingAddress : billingAddress)!.city }}, {{ (kind === 'shipping' ? shippingAddress : billingAddress)!.region }} {{ (kind === 'shipping' ? shippingAddress : billingAddress)!.postalCode }}</div>
                  </div>
                </template>
                <div v-else class="text-body-2 text-medium-emphasis">No address added.</div>
              </div>
            </div>
          </v-card>

          <!-- Order lines -->
          <v-card flat border rounded="lg" class="pa-6">
            <MpSectionHeader title="Order Lines">
              <template #actions>
                <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addCustomItem">Add Custom Item</v-btn>
              </template>
            </MpSectionHeader>

            <v-autocomplete
              :model-value="productSearch"
              :items="store.products"
              item-title="name"
              return-object
              label="Search existing products by name or SKU"
              prepend-inner-icon="search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              class="mt-2 mb-4"
              @update:model-value="addProduct"
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :subtitle="`${item.raw.sku} · $${item.raw.price} · ${item.raw.inventory} in stock`" />
              </template>
            </v-autocomplete>

            <div v-if="lineItems.length === 0" class="text-body-2 text-medium-emphasis text-center pa-6 rounded-lg" style="background: rgba(var(--v-theme-on-surface), 0.03)">
              No items yet — search the catalog above or add a custom item.
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <div v-for="(li, index) in lineItems" :key="li.id" class="cdo-line d-flex align-center gap-3">
                <v-avatar color="surface-variant" variant="flat" size="36" rounded="lg" class="flex-shrink-0">
                  <v-icon size="18" color="primary">{{ li.custom ? 'pencil-ruler' : 'package' }}</v-icon>
                </v-avatar>

                <template v-if="li.custom">
                  <v-text-field v-model="li.name" label="Item name *" density="compact" hide-details class="flex-grow-1" />
                  <v-text-field v-model.number="li.price" label="Price" prefix="$" type="number" density="compact" hide-details style="max-width: 120px" />
                </template>
                <template v-else>
                  <div class="flex-grow-1 min-width-0">
                    <div class="text-body-2 font-weight-medium text-truncate">{{ li.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ li.sku }} · ${{ li.price.toFixed(2) }} each</div>
                  </div>
                </template>

                <div class="d-flex align-center gap-1 flex-shrink-0">
                  <v-btn icon="minus" variant="text" size="x-small" aria-label="Decrease quantity" @click="li.qty > 1 ? li.qty-- : removeLine(index)"></v-btn>
                  <span class="text-body-2 font-weight-bold text-center" style="min-width: 24px">{{ li.qty }}</span>
                  <v-btn icon="plus" variant="text" size="x-small" aria-label="Increase quantity" @click="li.qty++"></v-btn>
                </div>
                <span class="font-weight-bold text-body-2 text-right flex-shrink-0" style="min-width: 72px">${{ (li.price * li.qty).toFixed(2) }}</span>
                <v-btn icon="trash-2" variant="text" size="x-small" color="error" aria-label="Remove item" class="flex-shrink-0" @click="removeLine(index)"></v-btn>
              </div>
            </div>
          </v-card>

          <!-- Notes -->
          <v-card flat border rounded="lg" class="pa-6">
            <MpSectionHeader title="Notes" />
            <v-textarea v-model="notes" placeholder="Add an internal note for your team…" variant="outlined" density="comfortable" rows="2" auto-grow hide-details class="mt-2" />
          </v-card>
        </div>

        <!-- ═══ RIGHT (sticky) ═════════════════════════════════════ -->
        <div class="cdo-sidebar d-flex flex-column gap-4">
          <!-- Summary -->
          <v-card flat border rounded="lg" class="pa-5">
            <MpSectionHeader title="Summary" />
            <div class="d-flex flex-column gap-2 mt-2">
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">Items ({{ validLineItems.length }})</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>

              <div class="d-flex gap-2 align-center my-1">
                <v-select v-model="discount.type" :items="['None', 'Percentage', 'Fixed']" label="Discount" density="compact" hide-details style="max-width: 130px" />
                <v-text-field
                  v-if="discount.type !== 'None'"
                  v-model.number="discount.value"
                  :label="discount.type === 'Percentage' ? '%' : '$'"
                  type="number"
                  density="compact"
                  hide-details
                />
              </div>
              <div v-if="discountAmt > 0" class="d-flex justify-space-between text-body-2 text-success">
                <span>Discount</span><span>−${{ discountAmt.toFixed(2) }}</span>
              </div>

              <v-select v-model="shippingMethod" :items="shippingOptions" label="Shipping method" density="compact" hide-details class="my-1" />
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">Shipping</span>
                <span>{{ shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}` }}</span>
              </div>

              <v-divider class="my-2" style="opacity: 0.5" />
              <div class="d-flex justify-space-between text-body-1 font-weight-bold">
                <span>Total</span><span class="text-primary">${{ total.toFixed(2) }}</span>
              </div>
            </div>
          </v-card>

          <!-- Conversion checklist -->
          <v-card flat border rounded="lg" class="pa-5">
            <MpSectionHeader title="Ready to Convert?" />
            <div class="d-flex flex-column gap-2 mt-2">
              <div v-for="item in checklist" :key="item.label" class="d-flex align-center gap-2">
                <v-icon :color="item.done ? 'success' : 'medium-emphasis'" size="17">{{ item.done ? 'circle-check' : 'circle' }}</v-icon>
                <span class="text-body-2" :class="item.done ? '' : 'text-medium-emphasis'">{{ item.label }}</span>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mt-3">
              Complete all four to mark this draft as paid or send a payment link.
            </div>
          </v-card>

          <!-- Actions -->
          <div class="d-flex flex-column gap-2">
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="badge-check" :disabled="!canConvert" @click="markAsPaid">Mark as Paid</v-btn>
            <v-btn color="primary" variant="tonal" class="text-none" prepend-icon="link" :disabled="!canConvert" @click="generatePaymentLink">Generate Payment Link</v-btn>
            <v-btn variant="flat" color="surface" class="text-none" prepend-icon="save" :disabled="!canSave" @click="saveDraft">{{ isEdit ? 'Save Changes' : 'Save Draft' }}</v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Address drawer ──────────────────────────────────────────── -->
    <MpFormDrawer v-model="addressDrawer" :title="addressKind === 'shipping' ? 'Shipping Address' : 'Billing Address'" :width="420">
      <v-row dense>
        <v-col cols="12"><v-text-field v-model="addressForm.name" label="Full name" /></v-col>
        <v-col cols="12"><v-text-field v-model="addressForm.line1" label="Address" /></v-col>
        <v-col cols="7"><v-text-field v-model="addressForm.city" label="City" /></v-col>
        <v-col cols="5"><v-text-field v-model="addressForm.region" label="State / Region" /></v-col>
        <v-col cols="5"><v-text-field v-model="addressForm.postalCode" label="Postal code" /></v-col>
        <v-col cols="7"><v-text-field v-model="addressForm.country" label="Country" /></v-col>
      </v-row>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addressDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveAddress">Save Address</v-btn>
      </template>
    </MpFormDrawer>

    <!-- ── Payment link dialog ─────────────────────────────────────── -->
    <v-dialog v-model="paymentLinkDialog" max-width="480" persistent>
      <v-card rounded="lg" border flat class="pa-1">
        <v-card-title class="text-body-1 font-weight-bold d-flex align-center gap-2">
          <v-icon color="success" size="20">circle-check</v-icon>
          Payment link generated
        </v-card-title>
        <v-card-text class="pt-1">
          <div class="text-body-2 text-medium-emphasis mb-3">
            The draft is marked <strong>Invoice Sent</strong>. Share this link with {{ customer || 'the customer' }} to collect payment.
          </div>
          <v-text-field :model-value="paymentLink" readonly variant="outlined" density="compact" hide-details append-inner-icon="copy" @click:append-inner="copyPaymentLink" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" class="text-none" @click="copyPaymentLink">Copy Link</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" @click="closePaymentLink">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Leave confirmation ──────────────────────────────────────── -->
    <MpConfirmDialog
      v-model="confirmLeave"
      title="Discard this draft order?"
      message="Any unsaved changes will be lost."
      confirm-label="Discard"
      danger
      @confirm="router.push(draftsRoute)"
    />

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.cdo-border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cdo-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
  max-width: 1180px;
  margin: 0 auto;
}

.cdo-sidebar {
  position: sticky;
  top: 0;
}

@media (max-width: 1000px) {
  .cdo-layout {
    grid-template-columns: 1fr;
  }
  .cdo-sidebar {
    position: static;
  }
}

.cdo-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px 20px;
}

.cdo-address-row {
  display: flex;
  gap: 24px;
}

@media (max-width: 800px) {
  .cdo-address-row {
    flex-direction: column;
  }
}

.cdo-line {
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
</style>
