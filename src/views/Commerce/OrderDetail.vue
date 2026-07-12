<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore, FULFILLMENT_STAGES, type OrderAddress } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpErrorState from '@/components/MpErrorState.vue'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const accountId = computed(() => route.params.accountId as string)
const order = computed(() => store.getOrderById(Number(route.params.orderId)))
const ordersListRoute = computed(() => ({ name: 'SalesOrders', params: { accountId: accountId.value } }))

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (d?: string | null) => d ? dateFmt.format(new Date(d)) : '—'

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// ── Header actions ────────────────────────────────────────────────
const cancelDialog = ref(false)
function confirmCancel() {
  if (!order.value) return
  store.cancelOrder(order.value.id)
  notify('Order cancelled')
}

function printInvoice() {
  notify(`Invoice for ${order.value?.orderNumber} sent to printer`)
}

// Refund dialog
const refundDialog = ref(false)
const refundAmount = ref('')
const refundReason = ref('')
function openRefund() {
  refundAmount.value = order.value?.total ?? ''
  refundReason.value = ''
  refundDialog.value = true
}
const refundValid = computed(() => {
  const amt = parseFloat(refundAmount.value)
  return !Number.isNaN(amt) && amt > 0 && amt <= parseFloat(order.value?.total ?? '0')
})
function submitRefund() {
  if (!order.value || !refundValid.value) return
  store.refundOrder(order.value.id, parseFloat(refundAmount.value).toFixed(2), refundReason.value.trim())
  refundDialog.value = false
  notify('Refund issued')
}

const canCancel = computed(() => order.value && !['Cancelled', 'Refunded'].includes(order.value.status))
const canRefund = computed(() => order.value?.paymentStatus === 'Paid')

// ── Info grid (legacy parity) ─────────────────────────────────────
const infoGrid = computed(() => order.value ? [
  { label: 'Currency', value: order.value.currency },
  { label: 'Region', value: order.value.region },
  { label: 'Payment Method', value: order.value.paymentMethod },
  { label: 'Country', value: order.value.country },
  { label: 'Email', value: order.value.customer.email },
  { label: 'Sales Channel', value: order.value.salesChannel },
  { label: 'Phone', value: order.value.phone },
] : [])

// ── Address editing (small drawers) ───────────────────────────────
const addressDrawer = ref(false)
const addressKind = ref<'shipping' | 'billing'>('shipping')
const addressForm = ref<OrderAddress>({ name: '', line1: '', city: '', region: '', postalCode: '', country: '' })
function openAddressDrawer(kind: 'shipping' | 'billing') {
  if (!order.value) return
  addressKind.value = kind
  addressForm.value = { ...(kind === 'shipping' ? order.value.shippingAddress : order.value.billingAddress) }
  addressDrawer.value = true
}
function saveAddress() {
  if (!order.value) return
  store.updateOrderAddress(order.value.id, addressKind.value, { ...addressForm.value })
  addressDrawer.value = false
  notify(`${addressKind.value === 'shipping' ? 'Shipping' : 'Billing'} address updated`)
}

// ── Line items ────────────────────────────────────────────────────
function lineTotal(qty: number, price: string, discountPct: number): string {
  return (qty * parseFloat(price) * (1 - discountPct / 100)).toFixed(2)
}

// ── Fulfillment stepper ───────────────────────────────────────────
const stageIndex = computed(() => order.value ? FULFILLMENT_STAGES.indexOf(order.value.fulfillmentStage) + 1 : 1)
const linkedFulfillment = computed(() => order.value ? store.fulfillments.find(f => f.orderId === order.value!.id) : undefined)

// ── Tags ──────────────────────────────────────────────────────────
const tagSuggestions = ['VIP', 'Wholesale', 'Repeat Customer', 'Gift', 'Rush', 'Local Pickup']
function onTagsChange(tags: unknown) {
  if (!order.value || !Array.isArray(tags)) return
  store.setOrderTags(order.value.id, tags.map(String))
}

// ── Timeline / internal notes ─────────────────────────────────────
const noteText = ref('')
function addNote() {
  if (!order.value || !noteText.value.trim()) return
  store.addOrderNote(order.value.id, noteText.value)
  noteText.value = ''
  notify('Note added')
}
const timelineNewestFirst = computed(() => order.value ? [...order.value.timeline].reverse() : [])
</script>

<template>
  <div v-if="order" class="d-flex flex-column gap-4">
    <!-- Header: back + order # + inline status chips -->
    <MpPageHeader :title="`Order ${order.orderNumber}`" :back-to="ordersListRoute">
      <template #actions>
        <v-btn variant="flat" color="surface" prepend-icon="printer" class="text-none" @click="printInvoice">Print Invoice</v-btn>
        <v-btn variant="flat" color="surface" prepend-icon="banknote" class="text-none" :disabled="!canRefund" @click="openRefund">Refund</v-btn>
        <v-btn variant="tonal" color="error" prepend-icon="ban" class="text-none" :disabled="!canCancel" @click="cancelDialog = true">Cancel Order</v-btn>
      </template>
      <template #tabs>
        <div class="d-flex align-center gap-2 flex-wrap mt-1">
          <MpStatusChip :status="order.status" type="order" size="x-small" variant="flat" />
          <MpStatusChip :status="order.paymentStatus" type="payment" size="x-small" />
          <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="x-small" show-icon />
          <span class="text-caption text-medium-emphasis">Placed {{ formatDate(order.date) }} · {{ order.salesChannel }}</span>
        </div>
      </template>
    </MpPageHeader>

    <div class="order-detail-layout">
      <!-- ═══ LEFT COLUMN ═══════════════════════════════════════════ -->
      <div class="d-flex flex-column gap-4 min-width-0">

        <!-- Customer + info grid -->
        <v-card flat border rounded="lg" class="pa-5">
          <div class="d-flex align-center gap-4 mb-4">
            <v-avatar color="primary" size="44" class="font-weight-bold text-white">{{ order.customer.avatar }}</v-avatar>
            <div class="min-width-0">
              <div class="text-subtitle-1 font-weight-bold">{{ order.customer.name }}</div>
              <a :href="`mailto:${order.customer.email}`" class="text-body-2 text-medium-emphasis od-link">{{ order.customer.email }}</a>
            </div>
          </div>
          <v-divider class="mb-4" style="opacity: 0.5" />
          <div class="od-info-grid">
            <div v-for="cell in infoGrid" :key="cell.label">
              <div class="text-caption text-medium-emphasis">{{ cell.label }}</div>
              <div class="text-body-2 font-weight-medium">{{ cell.value }}</div>
            </div>
          </div>
        </v-card>

        <!-- Addresses -->
        <div class="od-address-row">
          <v-card v-for="kind in (['shipping', 'billing'] as const)" :key="kind" flat border rounded="lg" class="pa-5 flex-grow-1">
            <MpSectionHeader :title="kind === 'shipping' ? 'Shipping Address' : 'Billing Address'">
              <template #actions>
                <v-btn icon="pencil" variant="text" size="small" density="comfortable" :aria-label="`Edit ${kind} address`" @click="openAddressDrawer(kind)" />
              </template>
            </MpSectionHeader>
            <div class="text-body-2 mt-1" style="line-height: 1.7">
              <div class="font-weight-medium">{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).name }}</div>
              <div>{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).line1 }}</div>
              <div>{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).city }}, {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).region }} {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).postalCode }}</div>
              <div class="text-medium-emphasis">{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).country }}</div>
            </div>
          </v-card>
        </div>

        <!-- Line items -->
        <v-card flat border rounded="lg" class="overflow-hidden">
          <div class="pa-5 pb-3"><MpSectionHeader :title="`Summary (${order.lineItems.length} items)`" /></div>
          <v-table density="comfortable" class="od-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th class="text-right">Price</th>
                <th class="text-center">Qty</th>
                <th>Coupon</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="li in order.lineItems" :key="li.sku + li.product">
                <td>
                  <div class="text-body-2 font-weight-medium">{{ li.product }}</div>
                  <div class="text-caption text-medium-emphasis">{{ li.sku }}</div>
                </td>
                <td><MpStatusChip :status="li.status" type="fulfillment" size="x-small" /></td>
                <td class="text-right text-body-2 text-no-wrap">${{ li.price }}</td>
                <td class="text-center text-body-2">{{ li.qty }}</td>
                <td class="text-body-2">{{ li.coupon ?? '—' }}</td>
                <td class="text-right text-body-2">{{ li.discountPct ? `${li.discountPct}%` : '—' }}</td>
                <td class="text-right text-body-2 font-weight-semibold text-no-wrap">${{ lineTotal(li.qty, li.price, li.discountPct) }}</td>
              </tr>
            </tbody>
          </v-table>
          <v-divider style="opacity: 0.5" />
          <div class="pa-5 pt-4 d-flex flex-column gap-1 od-totals">
            <div class="d-flex justify-space-between text-body-2"><span class="text-medium-emphasis">Subtotal</span><span>${{ order.subtotal }}</span></div>
            <div class="d-flex justify-space-between text-body-2"><span class="text-medium-emphasis">Shipping</span><span>${{ order.shipping }}</span></div>
            <div class="d-flex justify-space-between text-body-1 font-weight-bold pt-2 mt-1 od-total-row"><span>Net Payable</span><span class="text-primary">${{ order.total }}</span></div>
          </div>
        </v-card>

        <!-- Payment -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Payment">
            <template #actions>
              <MpStatusChip :status="order.paymentStatus" type="payment" size="x-small" />
            </template>
          </MpSectionHeader>
          <div class="od-info-grid mt-2">
            <div>
              <div class="text-caption text-medium-emphasis">Reference</div>
              <div class="text-body-2 font-weight-medium">{{ order.paymentReference }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Method</div>
              <div class="text-body-2 font-weight-medium">{{ order.paymentMethod }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Captured At</div>
              <div class="text-body-2 font-weight-medium">{{ formatDate(order.paymentCapturedAt) }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Amount</div>
              <div class="text-body-2 font-weight-medium">${{ order.total }}</div>
            </div>
          </div>
        </v-card>

        <!-- Fulfillment -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Fulfillment">
            <template #actions>
              <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="x-small" show-icon />
            </template>
          </MpSectionHeader>
          <div class="my-4">
            <MpWizardSteps :steps="[...FULFILLMENT_STAGES]" :current="stageIndex" />
          </div>
          <div class="od-info-grid">
            <div>
              <div class="text-caption text-medium-emphasis">Fulfilled From</div>
              <div class="text-body-2 font-weight-medium">{{ order.fulfilledFromLocation }}</div>
            </div>
            <div v-if="linkedFulfillment">
              <div class="text-caption text-medium-emphasis">Fulfillment</div>
              <div class="text-body-2 font-weight-medium">FF-{{ String(linkedFulfillment.id).padStart(4, '0') }}</div>
            </div>
            <div v-if="order.trackingNumber">
              <div class="text-caption text-medium-emphasis">Tracking</div>
              <div class="text-body-2 font-weight-medium">{{ order.courier }} · {{ order.trackingNumber }}</div>
            </div>
          </div>
        </v-card>
      </div>

      <!-- ═══ RIGHT SIDEBAR (sticky) ════════════════════════════════ -->
      <div class="od-sidebar d-flex flex-column gap-4">
        <v-card flat border rounded="lg" class="pa-5">
          <div class="d-flex flex-column gap-3">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Order Status</span>
              <MpStatusChip :status="order.status" type="order" size="x-small" variant="flat" />
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Payment Status</span>
              <MpStatusChip :status="order.paymentStatus" type="payment" size="x-small" />
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Fulfillment Status</span>
              <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="x-small" />
            </div>
            <v-divider style="opacity: 0.5" />
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 font-weight-medium">Net Payable</span>
              <span class="text-h6 font-weight-bold text-primary">${{ order.total }}</span>
            </div>
          </div>
        </v-card>

        <!-- Tags -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Tags" />
          <v-combobox
            :model-value="order.tags"
            :items="tagSuggestions"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            placeholder="Add tags…"
            class="mt-2"
            @update:model-value="onTagsChange"
          />
        </v-card>

        <!-- Timeline -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader :title="`Timeline (${order.timeline.length})`" />
          <v-textarea
            v-model="noteText"
            placeholder="Write internal notes…"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            class="mt-2 mb-2"
          />
          <div class="d-flex justify-end mb-4">
            <v-btn size="small" color="primary" variant="flat" class="text-none" :disabled="!noteText.trim()" @click="addNote">Add Note</v-btn>
          </div>
          <div class="od-timeline">
            <div v-for="(entry, idx) in timelineNewestFirst" :key="entry.id" class="od-timeline__entry">
              <div class="od-timeline__rail">
                <v-avatar :color="entry.kind === 'note' ? 'secondary' : 'primary'" size="26" variant="tonal" class="od-timeline__dot">
                  <v-icon size="13">{{ entry.kind === 'note' ? 'sticky-note' : 'circle-dot' }}</v-icon>
                </v-avatar>
                <div v-if="idx < timelineNewestFirst.length - 1" class="od-timeline__line" />
              </div>
              <div class="od-timeline__content">
                <div class="text-body-2">{{ entry.text }}</div>
                <div class="text-caption text-medium-emphasis mt-1">{{ entry.kind === 'note' ? 'Internal note · ' : '' }}{{ formatDate(entry.date) }}</div>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <!-- ── Cancel confirmation ─────────────────────────────────────── -->
    <MpConfirmDialog
      v-model="cancelDialog"
      title="Cancel this order?"
      :message="`Cancel ${order.orderNumber} for ${order.customer.name}? The customer will be notified and fulfillment will stop. This cannot be undone.`"
      confirm-label="Cancel Order"
      danger
      @confirm="confirmCancel"
    />

    <!-- ── Refund dialog ────────────────────────────────────────────── -->
    <v-dialog v-model="refundDialog" max-width="440">
      <v-card rounded="lg" border flat class="pa-1">
        <v-card-title class="text-body-1 font-weight-bold">Refund {{ order.orderNumber }}</v-card-title>
        <v-card-text class="pt-1">
          <div class="text-body-2 text-medium-emphasis mb-4">Up to ${{ order.total }} captured on {{ order.paymentMethod }}.</div>
          <v-text-field v-model="refundAmount" label="Refund amount" prefix="$" type="number" variant="outlined" density="comfortable" class="mb-3" hide-details />
          <v-text-field v-model="refundReason" label="Reason (optional)" variant="outlined" density="comfortable" hide-details />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" class="text-none" @click="refundDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="text-none" :disabled="!refundValid" @click="submitRefund">Issue Refund</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Address drawer ───────────────────────────────────────────── -->
    <MpFormDrawer v-model="addressDrawer" :title="addressKind === 'shipping' ? 'Edit Shipping Address' : 'Edit Billing Address'" :width="420">
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

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>

  <!-- ── Not found ─────────────────────────────────────────────────── -->
  <div v-else class="pa-10">
    <MpErrorState
      icon="package-x"
      title="Order not found"
      description="This order may have been removed, or the link is incorrect."
      action-label="Back to Sales Orders"
      action-icon="arrow-left"
      @action="router.push(ordersListRoute)"
    />
  </div>
</template>

<style scoped>
.order-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.od-sidebar {
  position: sticky;
  top: 16px;
}

@media (max-width: 1100px) {
  .order-detail-layout {
    grid-template-columns: 1fr;
  }
  .od-sidebar {
    position: static;
  }
}

.od-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px 20px;
}

.od-address-row {
  display: flex;
  gap: 16px;
}

@media (max-width: 800px) {
  .od-address-row {
    flex-direction: column;
  }
}

.od-items-table :deep(th) {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.od-total-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.od-link {
  text-decoration: none;
}
.od-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

/* Timeline */
.od-timeline {
  display: flex;
  flex-direction: column;
}
.od-timeline__entry {
  display: flex;
  gap: 10px;
}
.od-timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 26px;
}
.od-timeline__dot {
  flex-shrink: 0;
  z-index: 1;
}
.od-timeline__line {
  width: 2px;
  flex-grow: 1;
  background: rgba(var(--v-border-color), 0.15);
  border-radius: 1px;
  margin: 3px 0;
  min-height: 10px;
}
.od-timeline__content {
  flex-grow: 1;
  padding-bottom: 14px;
  min-width: 0;
}
</style>
