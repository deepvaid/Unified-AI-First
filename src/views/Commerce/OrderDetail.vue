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
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpAlert from '@/components/MpAlert.vue'
import MaropayRefundDrawer from '@/components/maropay/MaropayRefundDrawer.vue'
import { formatMoneyParts } from '@/utils/formatMoneyParts'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatMoney, isPositive } from '@/maropay/money'
import { PROVIDER_LABELS } from '@/maropay/model'
import { formatDay } from '@/maropay/readiness'
import type { RefundResult } from '@/services/maropay/mockAdapter'

const route = useRoute()
const router = useRouter()
const store = useCommerceStore()

const accountId = computed(() => route.params.accountId as string)
const order = computed(() => store.getOrderById(Number(route.params.orderId)))
const ordersListRoute = computed(() => ({ name: 'SalesOrders', params: { accountId: accountId.value } }))

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (d?: string | null) => d ? dateFmt.format(new Date(d)) : '—'

const toast = useToast()
function notify(text: string) { toast.success(text) }

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

// ── Maropay payment ───────────────────────────────────────────────
// Orders Maropay tracks carry a payment id; the payment itself (status,
// refunds, what's left) lives in Maropay, so the order reads it from there.
const maropay = useMaropayStore()
const payment = computed(() => (order.value?.paymentId ? maropay.paymentById(order.value.paymentId) ?? null : null))
const paymentBreakdown = computed(() => (payment.value ? maropay.breakdownFor(payment.value.id) : null))
const paymentRoute = computed(() => (payment.value ? { name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId: payment.value.id } } : null))
const paymentProviderLabel = computed(() => {
  if (!payment.value) return null
  return payment.value.provider === 'maropay' ? 'Maropay' : `${PROVIDER_LABELS[payment.value.provider]} (original provider)`
})
const canCapturePayment = computed(() => payment.value?.status === 'authorised' && maropay.can('capture', payment.value.channelId))
const canVoidPayment = computed(() => payment.value?.status === 'authorised' && maropay.can('void', payment.value.channelId))
const captureDialog = ref(false)
const voidDialog = ref(false)
const maropayRefundOpen = ref(false)

function capturePayment() {
  if (!payment.value) return
  const result = maropay.capture(payment.value.id, `capture_${payment.value.id}`)
  if (result.ok) notify(`Captured ${formatMoney(payment.value.amount)}`)
  else toast.error(result.error.message)
}

function voidPayment() {
  if (!payment.value) return
  const result = maropay.voidPayment(payment.value.id)
  if (result.ok) notify('Authorisation cancelled — the shopper won’t be charged')
  else toast.error(result.error.message)
}

function onMaropayRefunded({ refund }: RefundResult) {
  const via = refund.provider === 'maropay' ? '' : ` through ${PROVIDER_LABELS[refund.provider]}`
  notify(refund.status === 'pending' ? `Refund of ${formatMoney(refund.amount)} started${via}` : `Refunded ${formatMoney(refund.amount)}${via}`)
}

// Refund dialog (orders Maropay doesn't track)
const refundDialog = ref(false)
const refundAmount = ref('')
const refundReason = ref('')
function openRefund() {
  if (payment.value) {
    maropayRefundOpen.value = true
    return
  }
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
const canRefund = computed(() => {
  const p = payment.value
  if (p) return p.status !== 'disputed' && maropay.can('refund', p.channelId) && isPositive(paymentBreakdown.value?.remainingRefundable ?? { amount: 0, currency: p.amount.currency })
  return order.value?.paymentStatus === 'Paid'
})

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

// ── Money formatting (symbol / integer / demoted cents) ───────────
function money(value: string) {
  return formatMoneyParts(parseFloat(value || '0'), order.value?.currency ?? 'USD')
}
const heroMoney = computed(() => money(order.value?.total ?? '0'))

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

// Typed glyph for each timeline entry, inferred from its text (store only stores note|event)
function timelineIcon(entry: { kind: string; text: string }): string {
  if (entry.kind === 'note') return 'message-square'
  const t = entry.text.toLowerCase()
  if (t.includes('placed') || t.includes('draft order')) return 'shopping-bag'
  if (t.includes('payment') || t.includes('captured')) return 'credit-card'
  if (t.includes('shipped') || t.includes('tracking')) return 'truck'
  if (t.includes('refund')) return 'undo-2'
  if (t.includes('cancel')) return 'ban'
  return 'circle-dot'
}
</script>

<template>
  <div v-if="order" class="d-flex flex-column gap-4">
    <!-- Header: back + order # + inline status chips -->
    <MpPageHeader :title="`Order ${order.orderNumber}`" eyebrow="Commerce · Orders" :back-to="ordersListRoute">
      <template #actions>
        <v-btn variant="flat" color="surface" prepend-icon="printer" class="text-none" @click="printInvoice">Print Invoice</v-btn>
        <v-btn variant="flat" color="surface" prepend-icon="undo-2" class="text-none" :disabled="!canRefund" @click="openRefund">Refund</v-btn>
        <v-btn variant="tonal" color="error" prepend-icon="ban" class="text-none" :disabled="!canCancel" @click="cancelDialog = true">Cancel Order</v-btn>
      </template>
      <template #tabs>
        <div class="d-flex align-center gap-2 flex-wrap mt-1">
          <MpStatusChip :status="order.status" type="order" size="sm" variant="flat" />
          <MpStatusChip :status="order.paymentStatus" type="payment" size="sm" />
          <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="sm" show-icon />
          <span class="text-caption text-medium-emphasis">Placed {{ formatDate(order.date) }} · {{ order.salesChannel }}</span>
        </div>
      </template>
    </MpPageHeader>

    <div class="order-detail-layout mp-enter">
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
          <v-divider class="mb-5" style="opacity: 0.5" />
          <dl class="mp-label-value">
            <div v-for="cell in infoGrid" :key="cell.label">
              <dt>{{ cell.label }}</dt>
              <dd>{{ cell.value }}</dd>
            </div>
          </dl>
        </v-card>

        <!-- Addresses -->
        <div class="od-address-row">
          <v-card v-for="kind in (['shipping', 'billing'] as const)" :key="kind" flat border rounded="lg" class="pa-5 flex-grow-1">
            <MpSectionHeader :icon="kind === 'shipping' ? 'truck' : 'receipt'" :title="kind === 'shipping' ? 'Shipping Address' : 'Billing Address'">
              <template #actions>
                <v-btn icon="pencil" variant="text" size="small" density="comfortable" :aria-label="`Edit ${kind} address`" @click="openAddressDrawer(kind)" />
              </template>
            </MpSectionHeader>
            <dl class="mp-label-value od-address-grid mt-1">
              <div>
                <dt>Recipient</dt>
                <dd>{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).name }}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).line1 }}<br>
                  {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).city }}, {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).region }} {{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).postalCode }}
                </dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{{ (kind === 'shipping' ? order.shippingAddress : order.billingAddress).country }}</dd>
              </div>
            </dl>
          </v-card>
        </div>

        <!-- Line items -->
        <v-card flat border rounded="lg" class="overflow-hidden">
          <div class="pa-5 pb-2"><MpSectionHeader icon="package" :title="`Line items (${order.lineItems.length})`" /></div>
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
                <td><MpStatusChip :status="li.status" type="fulfillment" size="sm" /></td>
                <td class="text-right text-medium-emphasis text-no-wrap"><span class="mp-money">{{ money(li.price).symbol }}{{ money(li.price).integer }}<span class="mp-money__cents">.{{ money(li.price).cents }}</span></span></td>
                <td class="text-center text-medium-emphasis">{{ li.qty }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ li.coupon ?? '—' }}</td>
                <td class="text-right text-medium-emphasis">{{ li.discountPct ? `${li.discountPct}%` : '—' }}</td>
                <td class="text-right font-weight-semibold text-no-wrap"><span class="mp-money">{{ money(lineTotal(li.qty, li.price, li.discountPct)).symbol }}{{ money(lineTotal(li.qty, li.price, li.discountPct)).integer }}<span class="mp-money__cents">.{{ money(lineTotal(li.qty, li.price, li.discountPct)).cents }}</span></span></td>
              </tr>
            </tbody>
          </v-table>
          <div class="pa-5 pt-4 d-flex flex-column gap-2 od-totals">
            <div class="d-flex justify-space-between text-body-2"><span class="text-medium-emphasis">Subtotal</span><span class="mp-money">${{ order.subtotal }}</span></div>
            <div class="d-flex justify-space-between text-body-2"><span class="text-medium-emphasis">Shipping</span><span class="mp-money">${{ order.shipping }}</span></div>
            <div class="d-flex justify-space-between align-baseline pt-3 mt-1 od-total-row">
              <span class="text-body-2 text-medium-emphasis">Net payable</span>
              <span class="od-total-amount mp-money">{{ money(order.total).symbol }}{{ money(order.total).integer }}<span class="mp-money__cents">.{{ money(order.total).cents }}</span></span>
            </div>
          </div>
        </v-card>

        <!-- Payment -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader icon="credit-card" title="Payment">
            <template #actions>
              <MpStatusChip :status="order.paymentStatus" type="payment" size="sm" />
              <v-btn v-if="paymentRoute" size="small" variant="text" class="text-none" append-icon="arrow-right" :to="paymentRoute">View in Maropay</v-btn>
            </template>
          </MpSectionHeader>
          <MpAlert v-if="payment?.status === 'authorised'" tone="warning" live="off" class="mb-4" :title="payment.authorisationExpiresAt ? `Capture by ${formatDay(payment.authorisationExpiresAt)}` : 'Waiting for capture'">
            The payment is authorised but not taken yet. Capture it before then, or the authorisation lapses.
            <template v-if="canCapturePayment || canVoidPayment" #actions>
              <v-btn v-if="canCapturePayment" size="small" variant="outlined" class="text-none" @click="captureDialog = true">Capture {{ formatMoney(payment.amount) }}</v-btn>
              <v-btn v-if="canVoidPayment" size="small" variant="text" class="text-none" @click="voidDialog = true">Cancel authorisation</v-btn>
            </template>
          </MpAlert>
          <MpAlert v-else-if="payment?.status === 'processing'" tone="info" live="off" class="mb-4" title="Payment processing">
            {{ payment.methodLabel }} can take a few business days to confirm, so the order stays Pending until the shopper’s bank confirms.
          </MpAlert>
          <dl class="mp-label-value mt-2">
            <div>
              <dt>Reference</dt>
              <dd>{{ order.paymentReference }}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{{ order.paymentMethod }}</dd>
            </div>
            <div v-if="paymentProviderLabel">
              <dt>Provider</dt>
              <dd>{{ paymentProviderLabel }}</dd>
            </div>
            <div>
              <dt>Captured</dt>
              <dd>{{ formatDate(order.paymentCapturedAt) }}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd class="mp-money">{{ money(order.total).symbol }}{{ money(order.total).integer }}<span class="mp-money__cents">.{{ money(order.total).cents }}</span></dd>
            </div>
            <div v-if="paymentBreakdown && isPositive(paymentBreakdown.refunded)">
              <dt>Refunded</dt>
              <dd>{{ formatMoney(paymentBreakdown.refunded) }} · {{ formatMoney(paymentBreakdown.remainingRefundable) }} left to refund</dd>
            </div>
          </dl>
        </v-card>

        <!-- Fulfillment -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader icon="package-check" title="Fulfillment">
            <template #actions>
              <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="sm" show-icon />
            </template>
          </MpSectionHeader>
          <div class="my-5">
            <MpWizardSteps :steps="[...FULFILLMENT_STAGES]" :current="stageIndex" />
          </div>
          <dl class="mp-label-value">
            <div>
              <dt>Fulfilled from</dt>
              <dd>{{ order.fulfilledFromLocation }}</dd>
            </div>
            <div v-if="linkedFulfillment">
              <dt>Fulfillment</dt>
              <dd>FF-{{ String(linkedFulfillment.id).padStart(4, '0') }}</dd>
            </div>
            <div v-if="order.trackingNumber">
              <dt>Tracking</dt>
              <dd>{{ order.courier }} · {{ order.trackingNumber }}</dd>
            </div>
          </dl>
        </v-card>
      </div>

      <!-- ═══ RIGHT SIDEBAR (sticky) ════════════════════════════════ -->
      <div class="od-sidebar d-flex flex-column gap-4">
        <v-card flat border rounded="lg" class="pa-5">
          <div class="mp-meta-label od-hero-label">Net payable</div>
          <div class="od-hero-amount mp-money">{{ heroMoney.symbol }}{{ heroMoney.integer }}<span class="mp-money__cents">.{{ heroMoney.cents }}</span></div>
          <v-divider class="my-4" style="opacity: 0.5" />
          <div class="d-flex flex-column gap-3">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Order</span>
              <MpStatusChip :status="order.status" type="order" size="sm" variant="flat" />
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Payment</span>
              <MpStatusChip :status="order.paymentStatus" type="payment" size="sm" />
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Fulfillment</span>
              <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="sm" />
            </div>
          </div>
        </v-card>

        <!-- Tags -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader icon="tags" title="Tags" />
          <v-combobox
            :model-value="order.tags"
            :items="tagSuggestions"
            label="Tags"
            multiple
            chips
            closable-chips
            placeholder="e.g. VIP, gift"
            @update:model-value="onTagsChange"
          />
        </v-card>

        <!-- Timeline -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader icon="history" :title="`Timeline (${order.timeline.length})`" />
          <v-textarea
            v-model="noteText"
            label="Internal note"
            rows="3"
            auto-grow
          />
          <div class="d-flex justify-end mt-3 mb-4">
            <v-btn size="small" color="primary" variant="flat" class="text-none" :disabled="!noteText.trim()" @click="addNote">Add Note</v-btn>
          </div>
          <div class="od-timeline">
            <div v-for="entry in timelineNewestFirst" :key="entry.id" class="od-event">
              <span class="od-event__icon" :class="{ 'od-event__icon--note': entry.kind === 'note' }">
                <v-icon size="13">{{ timelineIcon(entry) }}</v-icon>
              </span>
              <div class="min-width-0">
                <div class="od-event__head">
                  <span class="od-event__title">{{ entry.text }}</span>
                  <span class="od-event__time mp-money">{{ formatDate(entry.date) }}</span>
                </div>
                <div v-if="entry.kind === 'note'" class="od-event__meta">Internal note</div>
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

    <!-- ── Maropay: capture, cancel and refund go to the payment's provider ── -->
    <template v-if="payment">
      <MpConfirmDialog
        v-model="captureDialog"
        :title="`Capture ${formatMoney(payment.amount)}?`"
        message="The shopper is charged now."
        :consequences="['The order is marked Paid.', 'The money joins a Maropay payout once it settles.']"
        confirm-label="Capture"
        @confirm="capturePayment"
      />
      <MpConfirmDialog
        v-model="voidDialog"
        title="Cancel this authorisation?"
        message="The shopper won’t be charged, and the hold on their card is released."
        :consequences="['You can’t capture this payment afterwards.', 'The order stays open — cancel it separately if you won’t fulfil it.']"
        confirm-label="Cancel authorisation"
        danger
        @confirm="voidPayment"
      />
      <MaropayRefundDrawer
        v-if="paymentBreakdown"
        v-model="maropayRefundOpen"
        :payment="payment"
        :remaining="paymentBreakdown.remainingRefundable"
        :store-name="maropay.channelName(payment.channelId)"
        :refund="(amount, reason, key) => maropay.refund(payment!.id, amount, reason, key)"
        @refunded="onMaropayRefunded"
      />
    </template>

    <!-- ── Refund dialog ────────────────────────────────────────────── -->
    <MpFormDrawer v-model="refundDialog" :title="`Refund ${order.orderNumber}`" size="sm">
      <div class="text-body-2 text-medium-emphasis">Up to ${{ order.total }} captured on {{ order.paymentMethod }}.</div>
      <MpFormGrid>
        <v-text-field v-model="refundAmount" label="Refund amount" prefix="$" type="number" />
        <v-text-field v-model="refundReason" label="Reason (optional)" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="refundDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" class="text-none" :disabled="!refundValid" @click="submitRefund">Issue Refund</v-btn>
      </template>
    </MpFormDrawer>

    <!-- ── Address drawer ───────────────────────────────────────────── -->
    <MpFormDrawer v-model="addressDrawer" :title="addressKind === 'shipping' ? 'Edit Shipping Address' : 'Edit Billing Address'" size="sm">
      <MpFormGrid :cols="2">
        <v-text-field v-model="addressForm.name" label="Full name" class="mp-form-grid__full" />
        <v-text-field v-model="addressForm.line1" label="Address" class="mp-form-grid__full" />
        <v-text-field v-model="addressForm.city" label="City" />
        <v-text-field v-model="addressForm.region" label="State / Region" />
        <v-text-field v-model="addressForm.postalCode" label="Postal code" />
        <v-text-field v-model="addressForm.country" label="Country" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addressDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveAddress">Save Address</v-btn>
      </template>
    </MpFormDrawer>
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

/* Label-over-value grids — muted uppercase label above value */
.mp-label-value dt {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 2px;
}
.od-address-grid {
  grid-template-columns: 1fr;
  gap: 14px;
}
.od-address-grid dd {
  line-height: 1.5;
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

/* Silent line-items table: transparent header, hairline rows */
.od-items-table :deep(th) {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface-variant));
  background: transparent;
}
.od-items-table :deep(tbody td) {
  font-size: 14px;
}

/* Totals block */
.od-total-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.od-total-amount {
  font-size: 16px;
  font-weight: 700;
}

/* Hero amount */
.od-hero-label {
  color: rgb(var(--v-theme-on-surface-variant));
}
.od-hero-amount {
  margin-top: 4px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.od-link {
  text-decoration: none;
}
.od-link:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

/* Timeline — typed-glyph rail with a connecting hairline */
.od-timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
}
.od-event {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}
/* connecting line between glyph nodes */
.od-event:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 26px;
  bottom: -18px;
  width: 1px;
  background: rgba(var(--v-theme-on-surface), 0.1);
}
.od-event__icon {
  flex-shrink: 0;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgb(var(--v-theme-on-surface-variant));
  z-index: 1;
}
.od-event__icon--note {
  border-color: rgba(var(--v-theme-primary), 0.35);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}
.od-event__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.od-event__title {
  font-size: 13px;
  font-weight: 550;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
  min-width: 0;
}
.od-event__time {
  flex-shrink: 0;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.od-event__meta {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
