<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useCommerceStore, type Order } from '@/stores/useCommerce'
import { useTicketsStore } from '@/stores/useTickets'
import { useToast } from '@/composables/useToast'
import {
  cancelState,
  formatOrderDate,
  itemsLabel,
  lineTotal,
  money,
  orderSummaryText,
  productsLabel,
  refundState,
} from '@/service/orderSummary'

/**
 * TicketOrdersPanel — the customer's orders, read and acted on without leaving
 * the ticket. A list that drills into one order (items, status, tracking) with
 * the agent's actions pinned below: insert it into the reply, link it to the
 * ticket, cancel or refund it. Orders are Commerce's; the ticket keeps a link.
 */
const props = defineProps<{ ticketId: number }>()

/** The order open in detail; `null` shows the list. */
const orderId = defineModel<number | null>('orderId', { default: null })

const emit = defineEmits<{
  /** Plain text for the reply composer. */
  insert: [text: string]
}>()

const route = useRoute()
const tickets = useTicketsStore()
const commerce = useCommerceStore()
const toast = useToast()

const ticket = computed(() => tickets.find(props.ticketId))
const orders = computed(() => (ticket.value ? commerce.ordersForCustomer(ticket.value.customerEmail) : []))
const linkedId = computed(() => ticket.value?.linkedOrderId ?? null)

// ── List ────────────────────────────────────────────────────────────────────
const search = ref('')
const matches = (o: Order) => {
  const q = search.value.trim().toLowerCase()
  if (!q) return true
  return [o.orderNumber, o.status, ...o.lineItems.map(li => li.product)].some(field => field.toLowerCase().includes(q))
}
/** The linked order on top under its own heading, then the rest, newest first. */
const listGroups = computed(() => {
  const shown = orders.value.filter(matches)
  const linked = shown.filter(o => o.id === linkedId.value)
  const others = shown.filter(o => o.id !== linkedId.value)
  return [
    { key: 'linked', label: 'Linked to this ticket', icon: 'link', orders: linked },
    { key: 'other', label: `${linked.length ? 'Other orders' : 'Orders'} (${others.length})`, icon: '', orders: others },
  ].filter(group => group.orders.length)
})

// ── Detail (drill-in) ───────────────────────────────────────────────────────
const order = computed(() => (orderId.value ? commerce.getOrderById(orderId.value) : undefined))
const listEl = ref<HTMLElement | null>(null)
const headingEl = ref<HTMLElement | null>(null)

async function openOrder(id: number) {
  orderId.value = id
  await nextTick()
  headingEl.value?.focus()
}
async function back() {
  const from = orderId.value
  orderId.value = null
  await nextTick()
  listEl.value?.querySelector<HTMLElement>(`[data-order-id="${from}"]`)?.focus()
}

const commerceRoute = computed(() =>
  order.value
    ? { name: 'OrderDetail', params: { accountId: route.params.accountId as string, orderId: String(order.value.id) } }
    : undefined,
)
const recentActivity = computed(() => (order.value ? [...order.value.timeline].reverse().slice(0, 3) : []))
const cancel = computed(() => (order.value ? cancelState(order.value) : { allowed: false, reason: '' }))
const refund = computed(() => (order.value ? refundState(order.value) : { allowed: false, reason: '' }))
const isLinked = computed(() => !!order.value && order.value.id === linkedId.value)

// ── Actions ─────────────────────────────────────────────────────────────────
function insertInReply() {
  if (order.value) emit('insert', orderSummaryText(order.value))
}

function setLinked(linked: boolean) {
  if (!order.value) return
  tickets.linkOrder(props.ticketId, linked ? order.value : null)
  toast.success(linked ? `Order ${order.value.orderNumber} linked to this ticket` : 'Order unlinked from this ticket')
}

const cancelOpen = ref(false)
const cancelConsequences = computed(() => {
  if (!order.value) return []
  return [
    `${itemsLabel(order.value)} marked Cancelled in Commerce`,
    order.value.paymentStatus === 'Paid' ? `The ${money(order.value.total)} payment isn’t refunded automatically — refund it next if needed` : '',
    'Recorded on the order’s timeline and on this ticket',
  ].filter(Boolean)
})
function confirmCancel() {
  if (!order.value) return
  commerce.cancelOrder(order.value.id)
  tickets.logActivity(props.ticketId, `Cancelled order ${order.value.orderNumber}`)
  toast.success(`Order ${order.value.orderNumber} cancelled`)
}

const REFUND_REASONS = ['Customer request', 'Damaged item', 'Wrong item', 'Late delivery', 'Other']
const refundOpen = ref(false)
const refundForm = reactive({ amount: 0 as number | null, reason: null as string | null })
function openRefund() {
  if (!order.value) return
  refundForm.amount = parseFloat(order.value.total)
  refundForm.reason = null
  refundOpen.value = true
}
const refundError = computed(() => {
  if (!order.value) return ''
  const amount = Number(refundForm.amount)
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount to refund.'
  if (amount > parseFloat(order.value.total)) return `Can't refund more than the order total, ${money(order.value.total)}.`
  return ''
})
function confirmRefund() {
  if (!order.value || refundError.value || !refundForm.reason) return
  const amount = Number(refundForm.amount).toFixed(2)
  commerce.refundOrder(order.value.id, amount, refundForm.reason)
  tickets.logActivity(props.ticketId, `Refunded ${money(amount)} on order ${order.value.orderNumber} — ${refundForm.reason}`)
  toast.success(`Refund of ${money(amount)} issued for order ${order.value.orderNumber}`)
  refundOpen.value = false
}
</script>

<template>
  <div class="top d-flex flex-column">
    <div class="top__scroll">
      <!-- ── List ─────────────────────────────────────────────────────── -->
      <div v-if="!order" ref="listEl" class="d-flex flex-column">
        <!-- Toolbar strip, like the ticket list's: search over a divider. Panel
             chrome, not a form field — placeholder + aria-label, no details row. -->
        <div v-if="orders.length" class="top__toolbar">
          <v-text-field
            v-model="search"
            placeholder="Search orders or products"
            aria-label="Search this customer's orders"
            prepend-inner-icon="search"
            density="compact"
            hide-details
            clearable
          ></v-text-field>
        </div>

        <!-- Full-width rows with hairline dividers — the ticket list's grammar.
             Line 1: number · date, total. Line 2: what they bought, status. -->
        <div v-for="group in listGroups" :key="group.key" role="group" :aria-labelledby="`top-group-${group.key}`" class="top__group">
          <h3 :id="`top-group-${group.key}`" class="top__label d-flex align-center ga-1">
            <v-icon v-if="group.icon" size="14" aria-hidden="true">{{ group.icon }}</v-icon>{{ group.label }}
          </h3>
          <MpListRow
            v-for="o in group.orders"
            :key="o.id"
            clickable
            :data-order-id="o.id"
            class="top__row"
            @click="openOrder(o.id)"
          >
            <span class="d-flex align-center ga-2">
              <span class="top__number text-body-2">{{ o.orderNumber }}</span>
              <span class="top__date text-caption text-medium-emphasis text-no-wrap">{{ formatOrderDate(o.date) }}</span>
              <span class="top__money text-body-2 ms-auto flex-shrink-0">{{ money(o.total) }}</span>
            </span>
            <span class="d-flex align-center ga-2 mt-1">
              <span class="text-caption text-medium-emphasis text-truncate">{{ productsLabel(o) }}</span>
              <MpStatusChip :status="o.status" type="order" size="sm" class="ms-auto flex-shrink-0" />
            </span>
          </MpListRow>
        </div>

        <MpEmptyState
          v-if="!orders.length"
          icon="package"
          title="No orders for this customer"
          :description="`Nothing in Commerce for ${ticket?.customerEmail ?? 'this email'}.`"
          :heading-level="3"
        />
        <p v-else-if="!listGroups.length" class="top__empty text-body-2 text-medium-emphasis">
          No orders match “{{ search.trim() }}”.
        </p>
      </div>

      <!-- ── Detail ───────────────────────────────────────────────────── -->
      <div v-else class="top__detail d-flex flex-column">
        <div class="top__detail-head d-flex align-center ga-1">
          <v-btn icon="arrow-left" variant="text" size="small" aria-label="Back to all orders" @click="back"></v-btn>
          <h3 ref="headingEl" tabindex="-1" class="top__title flex-grow-1 text-truncate">Order {{ order.orderNumber }}</h3>
          <v-tooltip text="Open in Commerce" location="bottom">
            <template #activator="{ props: tooltip }">
              <v-btn v-bind="tooltip" :to="commerceRoute" icon="external-link" variant="text" size="small"
                :aria-label="`Open order ${order.orderNumber} in Commerce`"></v-btn>
            </template>
          </v-tooltip>
        </div>

        <div class="d-flex flex-wrap ga-1 top__chips">
          <MpStatusChip :status="order.status" type="order" size="sm" />
          <MpStatusChip :status="order.fulfillmentStatus" type="fulfillment" size="sm" />
          <MpStatusChip :status="order.paymentStatus" type="payment" size="sm" />
          <MpStatusChip v-if="isLinked" status="Linked to ticket" type="general" size="sm" />
        </div>

        <dl class="mp-label-value mp-label-value--inline top__facts">
          <div><dt>Placed</dt><dd>{{ formatOrderDate(order.date) }}</dd></div>
          <div><dt>Payment</dt><dd>{{ order.paymentMethod }}</dd></div>
          <div><dt>Channel</dt><dd>{{ order.salesChannel }}</dd></div>
        </dl>

        <section class="top__section" aria-labelledby="top-items">
          <h4 id="top-items" class="top__label">Items ({{ order.lineItems.length }})</h4>
          <MpListRow
            v-for="(item, i) in order.lineItems"
            :key="`${item.sku}-${i}`"
            variant="divided"
            :title="item.product"
            :subtitle="`${item.sku} · Qty ${item.qty}${item.coupon ? ` · ${item.coupon} −${item.discountPct}%` : ''}`"
          >
            <template #trailing>
              <span class="top__money">{{ money(lineTotal(item)) }}</span>
            </template>
          </MpListRow>
          <dl class="mp-label-value mp-label-value--inline top__totals">
            <div><dt>Subtotal</dt><dd class="top__money">{{ money(order.subtotal) }}</dd></div>
            <div><dt>Shipping</dt><dd class="top__money">{{ money(order.shipping) }}</dd></div>
            <div class="top__total"><dt>Total</dt><dd class="top__money">{{ money(order.total) }}</dd></div>
          </dl>
        </section>

        <section class="top__section" aria-labelledby="top-shipping">
          <h4 id="top-shipping" class="top__label">Shipping</h4>
          <p class="text-body-2 top__text">
            <template v-if="order.trackingNumber">
              {{ order.courier }} · <span class="top__tracking">{{ order.trackingNumber }}</span>
            </template>
            <span v-else class="text-medium-emphasis">Not shipped yet</span>
          </p>
          <address class="text-body-2 text-medium-emphasis top__text">
            {{ order.shippingAddress.name }}<br>
            {{ order.shippingAddress.line1 }}<br>
            {{ order.shippingAddress.city }}, {{ order.shippingAddress.region }} {{ order.shippingAddress.postalCode }}
          </address>
        </section>

        <section class="top__section" aria-labelledby="top-activity">
          <h4 id="top-activity" class="top__label">Recent activity</h4>
          <ul class="top__activity">
            <li v-for="event in recentActivity" :key="event.id" class="text-body-2">
              {{ event.text }}
              <span class="d-block text-caption text-medium-emphasis">{{ formatOrderDate(event.date.slice(0, 10)) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Pinned: what the agent came here to do. -->
    <div v-if="order" class="top__actions d-flex align-center ga-2">
      <v-btn color="primary" variant="flat" class="text-none flex-grow-1" prepend-icon="reply" @click="insertInReply">
        Insert in reply
      </v-btn>
      <v-btn v-if="!isLinked" variant="outlined" class="text-none" prepend-icon="link" @click="setLinked(true)">
        Link
      </v-btn>
      <MpRowActionsMenu ariaLabel="More order actions" :itemLabel="`order ${order.orderNumber}`">
        <MpMenuItem title="Open in Commerce" icon="external-link" :to="commerceRoute" />
        <MpMenuItem v-if="isLinked" title="Unlink from ticket" icon="unlink" @click="setLinked(false)" />
        <v-divider class="my-1" />
        <MpMenuItem
          :title="refund.allowed ? 'Refund…' : `Refund — ${refund.reason}`"
          icon="undo-2"
          :disabled="!refund.allowed"
          @click="openRefund"
        />
        <MpMenuItem
          :title="cancel.allowed ? 'Cancel order' : `Cancel — ${cancel.reason}`"
          icon="circle-x"
          danger
          :disabled="!cancel.allowed"
          @click="cancelOpen = true"
        />
      </MpRowActionsMenu>
    </div>

    <MpConfirmDialog
      v-model="cancelOpen"
      danger
      :title="`Cancel order ${order?.orderNumber ?? ''}?`"
      :message="`${ticket?.customer ?? 'The customer'}'s order stops before it ships.`"
      :consequences="cancelConsequences"
      confirm-label="Cancel order"
      cancel-label="Keep order"
      @confirm="confirmCancel"
    />

    <MpDialog
      v-model="refundOpen"
      :title="`Refund order ${order?.orderNumber ?? ''}`"
      :subtitle="order ? `Goes back to ${order.paymentMethod}. Order total ${money(order.total)}.` : ''"
      size="sm"
    >
      <MpFormGrid>
        <v-text-field
          v-model.number="refundForm.amount"
          label="Amount *"
          type="number"
          prefix="$"
          min="0"
          step="0.01"
          :error-messages="refundError"
        ></v-text-field>
        <v-select v-model="refundForm.reason" :items="REFUND_REASONS" label="Reason *" placeholder="Choose a reason"></v-select>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="refundOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!!refundError || !refundForm.reason" @click="confirmRefund">
          Refund {{ refundError ? '' : money(refundForm.amount ?? 0) }}
        </v-btn>
      </template>
    </MpDialog>
  </div>
</template>

<style scoped>
/* Fills the rail panel: the list/detail scrolls, the action bar stays put. */
.top {
  height: 100%;
  min-height: 0;
}
.top__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

/* ── List: the ticket list's grammar — edge-to-edge rows, hairline between ── */
.top__toolbar {
  padding: var(--mp-space-12) var(--mp-space-16);
  border-bottom: 1px solid var(--border-subtle);
}
.top__group + .top__group { border-top: 1px solid var(--border-subtle); }
.top__label {
  margin: 0;
  padding: var(--mp-space-12) var(--mp-space-16) var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--on-surface-muted);
}
/* Rows run edge to edge, so the bleed MpListRow adds for inset cards goes. */
.top__row.mp-list-row--interactive {
  margin-inline: 0;
  padding-inline: var(--mp-space-16);
  border-radius: 0;
}
.top__row + .top__row { border-top: 1px solid var(--border-subtle); }
.top__number {
  font-weight: var(--mp-fontWeight-medium);
  color: var(--on-surface);
}
.top__date { font-variant-numeric: tabular-nums; }
.top__empty { margin: 0; padding: var(--mp-space-16); }

/* ── Detail ── */
.top__detail { padding: var(--mp-space-8) var(--mp-space-16) var(--mp-space-16); }
.top__detail-head { margin-inline-start: calc(-1 * var(--mp-space-8)); }
.top__title {
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-semibold);
  outline: none;
}
.top__title:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: var(--mp-radius-4); }
.top__chips { margin-top: var(--mp-space-8); }
.top__facts { margin-top: var(--mp-space-12); }
.top__section { margin-top: var(--mp-space-16); }
.top__section .top__label { padding: 0 0 var(--mp-space-4); }
.top__money { font-variant-numeric: tabular-nums; color: var(--on-surface); }
.top__totals {
  margin-top: var(--mp-space-8);
  padding-top: var(--mp-space-8);
  border-top: 1px solid var(--border-subtle);
}
.top__total { font-weight: var(--mp-fontWeight-semibold); }
.top__text { margin: 0 0 var(--mp-space-4); font-style: normal; }
.top__tracking { font-variant-numeric: tabular-nums; user-select: all; }
.top__activity {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.top__actions {
  flex-shrink: 0;
  padding: var(--mp-space-12) var(--mp-space-16);
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}
</style>
