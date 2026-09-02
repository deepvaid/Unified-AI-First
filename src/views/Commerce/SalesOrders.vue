<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore, SALES_CHANNELS, type Order } from '@/stores/useCommerce'
import { useRetailStore } from '@/stores/useRetail'
import { downloadCsv } from '@/utils/exportCsv'
import { formatMoneyParts } from '@/utils/formatMoneyParts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'

const store = useCommerceStore()
const retail = useRetailStore()
const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

/**
 * POS mode renders the same orders list as the retail transactions log: scoped
 * to in-store sales for the rail's active location, with register context in
 * place of the fulfillment column.
 */
const posMode = computed(() => route.name === 'RetailTransactions')

/** The order set this page works over. */
const baseOrders = computed(() => {
  if (!posMode.value) return store.orders
  return store.posOrders.filter((o) => retail.scopedLocationIds.includes(o.pos?.locationId ?? ''))
})
function goCreateDraft() {
  router.push({ name: 'CreateDraftOrder', params: { accountId: accountId.value } })
}
function goToOrder(id: number) {
  router.push({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(id) } })
}
const search = ref('')
const expanded = ref<string[]>([])
const selected = ref<number[]>([])
const activeTab = ref('all')
const { loading } = useInitialLoad()

const toast = useToast()
function notify(text: string) { toast.success(text) }

// Tabs matching real Maropost app
const tabs = computed(() =>
  posMode.value
    ? [
        { label: 'All', key: 'all', count: tabCount('all') },
        { label: 'Sales', key: 'sales', count: tabCount('sales') },
        { label: 'Returns', key: 'returns', count: tabCount('returns') },
        { label: 'Voided', key: 'voided', count: tabCount('voided') },
        { label: 'BORIS', key: 'boris', count: tabCount('boris') },
      ]
    : [
        { label: 'All Orders', key: 'all', count: tabCount('all') },
        { label: 'Completed', key: 'completed', count: tabCount('completed') },
        { label: 'Processing', key: 'processing', count: tabCount('processing') },
        { label: 'Not Fulfilled', key: 'not_fulfilled', count: tabCount('not_fulfilled') },
      ],
)

const posHeaders = [
  { title: 'Sale', key: 'orderNumber', sortable: true, width: 120 },
  { title: 'Date', key: 'date', sortable: true, hideBelow: 'md' as const },
  { title: 'Customer', key: 'customer.name' },
  { title: 'Location', key: 'pos.locationId', hideBelow: 'md' as const },
  { title: 'Staff', key: 'pos.staffId', hideBelow: 'lg' as const },
  { title: 'Items', key: 'itemCount', align: 'end' as const, width: 70, hideBelow: 'lg' as const },
  { title: 'Total', key: 'total', align: 'end' as const, sortable: true },
  { title: 'Tender', key: 'paymentMethod', hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
  { title: '', key: 'data-table-expand', width: 40 },
]

const headers = [
  { title: 'Order', key: 'orderNumber', sortable: true, width: 110 },
  { title: 'Date', key: 'date', sortable: true, hideBelow: 'md' as const },
  { title: 'Customer', key: 'customer.name' },
  { title: 'Items', key: 'itemCount', align: 'end' as const, width: 70, hideBelow: 'lg' as const },
  { title: 'Total', key: 'total', align: 'end' as const, sortable: true },
  { title: 'Fulfillment', key: 'fulfillmentStatus', hideBelow: 'md' as const },
  { title: 'Payment', key: 'paymentStatus', hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: 'Sales Channel', key: 'salesChannel', hideBelow: 'lg' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
  { title: '', key: 'data-table-expand', width: 40 },
]

// Payment + Sales Channel are demoted from the default scan (both surface in the
// expanded row / order detail); users can re-enable them via the column menu.
// Keeps the table free of horizontal scroll at common widths.
const hiddenColumns = ref<string[]>(['paymentStatus', 'salesChannel'])
const { visibleHeaders: webHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)
const { visibleHeaders: posVisibleHeaders } = useResponsiveTableHeaders(posHeaders, ref<string[]>([]))
const visibleHeaders = computed(() => (posMode.value ? posVisibleHeaders.value : webHeaders.value))

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (d?: string) => d ? dateFmt.format(new Date(d)) : '—'

// Quiet dot+label treatment for secondary statuses (order status keeps the chip)
const fulfillmentDots: Record<string, string> = {
  'Shipped': 'var(--pos)',
  'Ready For Fulfillment': 'var(--accent-default)',
  'Not Ready': 'var(--warn)',
  'Return Requested': 'var(--warn)',
  'Cancelled': 'var(--neg)',
  'Unapproved': 'var(--text-disabled)',
}
const paymentDots: Record<string, string> = {
  'Paid': 'var(--pos)',
  'Refunded': 'var(--neg)',
  'Partially Refunded': 'var(--warn)',
  'Pending': 'var(--warn)',
  'Voided': 'var(--text-disabled)',
}

// Orders whose total should read as struck-through (money no longer collected)
const isVoidedTotal = (o: Order) => o.status === 'Cancelled' || o.status === 'Refunded'

// Split a stored string amount ("1,234.50") into money parts for the .mp-money treatment
const money = (value: string) => formatMoneyParts(parseFloat(value.replace(/,/g, '')) || 0)

// Line-item total for the expanded row
const lineTotal = (qty: number, price: string) => money((qty * parseFloat(price)).toFixed(2))

// ─── Tab + Filter Filtering ───────────────────────────────────────────────────
function matchesTab(o: Order, key: string): boolean {
  switch (key) {
    case 'completed':     return o.status === 'Completed'
    case 'processing':    return o.status === 'Processing'
    case 'not_fulfilled': return !['Shipped', 'Cancelled'].includes(o.fulfillmentStatus ?? '')
    case 'sales':         return o.status === 'Completed' && o.paymentStatus === 'Paid'
    case 'returns':       return o.paymentStatus === 'Refunded' || o.paymentStatus === 'Partially Refunded'
    case 'voided':        return o.status === 'Cancelled'
    case 'boris':         return o.pos?.origin === 'boris'
    default:              return true
  }
}

const filteredOrders = computed(() => {
  let orders = baseOrders.value.filter(o => matchesTab(o, activeTab.value))

  // Drawer-level filters (aligned to store enum values)
  if (statusFilter.value.length) orders = orders.filter(o => statusFilter.value.includes(o.status))
  if (filters.value.fulfillment) orders = orders.filter(o => o.fulfillmentStatus === filters.value.fulfillment)
  if (filters.value.payment) orders = orders.filter(o => o.paymentStatus === filters.value.payment)
  if (filters.value.channel) orders = orders.filter(o => o.salesChannel === filters.value.channel)

  return orders
})

const tabCount = (key: string) => baseOrders.value.filter(o => matchesTab(o, key)).length

// ─── Filters ──────────────────────────────────────────────────────────────────
// Order Status is the promoted filter: a multi-select pill in the toolbar, so the
// cut people make most often doesn't cost a trip to the drawer.
const statusQuickFilter = {
  key: 'status',
  label: 'Order Status',
  options: (['Processing', 'Completed', 'On Hold', 'Cancelled', 'Refunded']).map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])

const filters = ref({
  fulfillment: null as string | null,
  payment: null as string | null,
  channel: null as string | null,
})

const filterOptions = {
  // Aligned to useCommerce.ts `fulfillmentStatuses`
  fulfillment: ['Not Ready', 'Ready For Fulfillment', 'Shipped', 'Return Requested', 'Cancelled', 'Unapproved'],
  // Aligned to useCommerce.ts paymentStatus logic
  payment: ['Paid', 'Partially Refunded', 'Pending', 'Refunded', 'Voided'],
  channel: SALES_CHANNELS,
}

const filterLabels: Record<string, string> = {
  status: 'Order Status',
  fulfillment: 'Fulfillment',
  payment: 'Payment',
  channel: 'Sales Channel',
}

const activeFilterEntries = computed(() => {
  const entries =
    Object.entries(filters.value)
      .filter(([, v]) => v !== null)
      .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (statusFilter.value.length) {
    entries.unshift({ key: 'status', label: `Order Status: ${statusFilter.value.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'status') {
    statusFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  statusFilter.value = []
  filters.value = { fulfillment: null, payment: null, channel: null }
}

function selectAll() {
  selected.value = filteredOrders.value.map((o) => o.id)
}

// ─── Row / bulk actions ───────────────────────────────────────────────────────
function markFulfilled(order: Order) {
  store.markOrderFulfilled(order.id)
  notify(`${order.orderNumber} marked fulfilled`)
}

const cancelDialog = ref(false)
const pendingCancel = ref<Order | null>(null)
const bulkCancel = ref(false)
function askCancelRow(order: Order) {
  pendingCancel.value = order
  bulkCancel.value = false
  cancelDialog.value = true
}
function askCancelBulk() {
  pendingCancel.value = null
  bulkCancel.value = true
  cancelDialog.value = true
}
const cancelMessage = computed(() =>
  bulkCancel.value
    ? `Cancel ${selected.value.length} selected order${selected.value.length === 1 ? '' : 's'}? Customers will be notified and fulfillment will stop. This cannot be undone.`
    : `Cancel ${pendingCancel.value?.orderNumber ?? ''} for ${pendingCancel.value?.customer.name ?? ''}? The customer will be notified and fulfillment will stop. This cannot be undone.`,
)
function confirmCancel() {
  if (bulkCancel.value) {
    store.cancelOrders([...selected.value])
    notify(`${selected.value.length} order${selected.value.length === 1 ? '' : 's'} cancelled`)
    selected.value = []
  } else if (pendingCancel.value) {
    store.cancelOrder(pendingCancel.value.id)
    notify(`${pendingCancel.value.orderNumber} cancelled`)
  }
}

const bulkFulfillDialog = ref(false)
function confirmBulkFulfill() {
  store.markOrdersFulfilled([...selected.value])
  notify(`${selected.value.length} order${selected.value.length === 1 ? '' : 's'} marked fulfilled`)
  selected.value = []
}

function printInvoice(order: Order) {
  notify(`Invoice for ${order.orderNumber} sent to printer`)
}

// Export the currently visible (tab + filter) rows
function exportOrders() {
  downloadCsv('sales-orders', filteredOrders.value, [
    { title: 'Order', value: 'orderNumber' },
    { title: 'Date', value: 'date' },
    { title: 'Customer', value: (o) => o.customer.name },
    { title: 'Email', value: (o) => o.customer.email },
    { title: 'Items', value: 'itemCount' },
    { title: 'Total', value: 'total' },
    { title: 'Fulfillment Status', value: 'fulfillmentStatus' },
    { title: 'Payment Status', value: 'paymentStatus' },
    { title: 'Status', value: 'status' },
    { title: 'Sales Channel', value: 'salesChannel' },
    { title: 'Tags', value: (o) => o.tags.join('; ') },
  ])
  notify(`Exported ${filteredOrders.value.length} orders`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Page Header -->
    <MpPageHeader
      :eyebrow="posMode ? 'Retail · Sell' : 'Commerce · Orders'"
      :title="posMode ? 'Transactions' : 'Sales Orders'"
      :subtitle="posMode
        ? `${baseOrders.length} in-store sales · ${retail.isAllLocations ? 'all locations' : retail.activeLocation.name}`
        : `${store.orders.length} orders total · $${store.orders.reduce((a,o) => a + parseFloat(o.total), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lifetime revenue`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="exportOrders">Export</v-btn>
        <v-btn v-if="!posMode" color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="goCreateDraft">Create Draft Order</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" />
      </template>
    </MpPageHeader>

    <!-- Main Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden mp-enter">
      <!-- Toolbar -->
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        :headers="headers"
        :active-filters="activeFilterEntries"
        :total-count="filteredOrders.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <!-- Toolbar filters stay compact and suppress details deliberately: this is a
               dense popover, not a form, and no select here carries validation. -->
          <MpFormGrid>
            <v-select
              v-for="(options, key) in filterOptions"
              :key="key"
              v-model="filters[key as keyof typeof filters]"
              :label="filterLabels[key]"
              :items="options"
              hide-details
              clearable
              placeholder="All"
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        :key="activeTab"
        v-model="selected"
        v-model:expanded="expanded"
        :headers="visibleHeaders"
        :items="filteredOrders"
        :search="search"
        item-value="id"
        show-select
        show-expand
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1 orders-table"
        @click:row="(_e: unknown, { item }: { item: Order }) => goToOrder(item.id)"
      >
        <!-- Order number — clickable link style -->
        <template v-slot:item.orderNumber="{ item }">
          <span class="text-primary font-weight-bold cursor-pointer">{{ item.orderNumber }}</span>
        </template>

        <!-- Date — muted, humane, single line -->
        <template v-slot:item.date="{ item }">
          <span class="text-medium-emphasis text-body-2 text-no-wrap">{{ formatDate(item.date) }}</span>
        </template>

        <!-- Customer — ink-strong name; email lives in the expanded row -->
        <template v-slot:item.customer.name="{ item }">
          <span class="ord-customer text-no-wrap">{{ item.customer.name }}</span>
        </template>

        <!-- Items count — right-aligned tabular figure -->
        <template v-slot:item.itemCount="{ item }">
          <span class="text-body-2 text-medium-emphasis ord-tnum">{{ item.itemCount }}</span>
        </template>

        <!-- Total — .mp-money with demoted cents; struck through when no longer collected -->
        <template v-slot:item.total="{ item }">
          <span class="mp-money font-weight-semibold text-no-wrap" :class="{ 'mp-strike': isVoidedTotal(item) }">
            {{ money(item.total).symbol }}{{ money(item.total).integer }}<span class="mp-money__cents">.{{ money(item.total).cents }}</span>
          </span>
        </template>

        <!-- Fulfillment — quiet dot + label (order status keeps the chip) -->
        <template v-slot:item.fulfillmentStatus="{ item }">
          <span class="ord-dot-label text-no-wrap">
            <span class="ord-dot" :style="{ background: fulfillmentDots[item.fulfillmentStatus ?? ''] ?? 'var(--text-disabled)' }" />
            {{ item.fulfillmentStatus }}
          </span>
        </template>

        <!-- Payment — quiet dot + label -->
        <template v-slot:item.paymentStatus="{ item }">
          <span class="ord-dot-label text-no-wrap">
            <span class="ord-dot" :style="{ background: paymentDots[item.paymentStatus ?? ''] ?? 'var(--text-disabled)' }" />
            {{ item.paymentStatus }}
          </span>
        </template>

        <!-- Order Status -->
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="order" size="sm" />
        </template>

        <!-- Sales Channel -->
        <template v-slot:item.salesChannel="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.salesChannel }}</span>
        </template>

        <!-- POS register context -->
        <template v-slot:item.pos.locationId="{ item }">
          <span class="text-body-2 text-no-wrap">{{ item.pos ? retail.locationName(item.pos.locationId) : '—' }}</span>
        </template>

        <template v-slot:item.pos.staffId="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.pos ? retail.staffName(item.pos.staffId) : '—' }}</span>
        </template>

        <template v-slot:item.paymentMethod="{ item }">
          <div class="d-flex align-center ga-2 text-no-wrap">
            <span class="text-body-2">{{ item.paymentMethod }}</span>
            <v-chip v-if="item.pos?.origin === 'boris'" size="x-small" variant="tonal" color="info">BORIS</v-chip>
          </div>
        </template>

        <!-- Row actions -->
        <template v-slot:item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Order actions" :itemLabel="item.orderNumber">
              <MpMenuItem icon="eye" title="View order" @click="goToOrder(item.id)"></MpMenuItem>
              <MpMenuItem icon="package-check" title="Mark fulfilled" :disabled="item.fulfillmentStatus === 'Shipped' || item.status === 'Cancelled'" @click="markFulfilled(item)"></MpMenuItem>
              <MpMenuItem icon="printer" title="Print invoice" @click="printInvoice(item)"></MpMenuItem>
              <v-divider class="my-1" />
              <MpMenuItem icon="ban" title="Cancel order" danger :disabled="item.status === 'Cancelled'" @click="askCancelRow(item)"></MpMenuItem>
            </MpRowActionsMenu>
          </div>
        </template>

        <!-- Expand toggle — stop propagation so it doesn't trigger row navigation -->
        <template v-slot:item.data-table-expand="{ internalItem, isExpanded, toggleExpand }">
          <v-btn
            :icon="isExpanded(internalItem) ? 'chevron-up' : 'chevron-down'"
            variant="text"
            size="small"
            density="comfortable"
            class="text-medium-emphasis"
            aria-label="Toggle order details"
            @click.stop="toggleExpand(internalItem)"
          ></v-btn>
        </template>

        <!-- Expanded detail row -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr class="ord-exp-row" @click.stop>
            <td :colspan="columns.length" class="pa-0 ord-exp-cell">
              <div class="ord-exp">
                <!-- Header: customer + payment/fulfillment meta + actions -->
                <div class="ord-exp__bar">
                  <v-avatar color="primary" size="34" class="font-weight-bold ord-exp__avatar">{{ item.customer.avatar }}</v-avatar>
                  <div class="min-width-0">
                    <div class="ord-exp__name">{{ item.customer.name }}</div>
                    <div class="ord-exp__email">{{ item.customer.email }}</div>
                  </div>
                  <div class="ord-exp__meta">
                    <div class="ord-exp__meta-block">
                      <span class="mp-meta-label">Payment</span>
                      <span class="ord-exp__meta-val">
                        <span class="ord-dot" :style="{ background: paymentDots[item.paymentStatus ?? ''] ?? 'var(--text-disabled)' }" />
                        {{ item.paymentStatus }} · {{ item.paymentMethod }}
                      </span>
                    </div>
                    <div class="ord-exp__meta-block">
                      <span class="mp-meta-label">Fulfillment</span>
                      <span class="ord-exp__meta-val">
                        <span class="ord-dot" :style="{ background: fulfillmentDots[item.fulfillmentStatus ?? ''] ?? 'var(--text-disabled)' }" />
                        {{ item.fulfillmentStatus }}
                      </span>
                    </div>
                  </div>
                  <v-spacer />
                  <div class="d-flex gap-2 flex-shrink-0">
                    <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="package-check" :disabled="item.fulfillmentStatus === 'Shipped' || item.status === 'Cancelled'" @click="markFulfilled(item)">Mark Fulfilled</v-btn>
                    <v-btn variant="flat" color="surface" size="small" class="text-none" prepend-icon="printer" @click="printInvoice(item)">Print Invoice</v-btn>
                    <v-btn variant="text" color="primary" size="small" class="text-none" append-icon="arrow-right" @click="goToOrder(item.id)">Open</v-btn>
                  </div>
                </div>

                <!-- Line items — silent table -->
                <div class="ord-exp__items">
                  <table class="ord-exp__table">
                    <thead>
                      <tr>
                        <th class="mp-meta-label">Product</th>
                        <th class="mp-meta-label ord-num">Qty</th>
                        <th class="mp-meta-label ord-num">Price</th>
                        <th class="mp-meta-label ord-num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="li in item.lineItems" :key="li.sku">
                        <td>
                          <span class="ord-exp__product">{{ li.product }}</span>
                          <span class="ord-exp__sku">{{ li.sku }}</span>
                        </td>
                        <td class="ord-num text-medium-emphasis">{{ li.qty }}</td>
                        <td class="ord-num text-medium-emphasis">
                          <span class="mp-money">{{ money(li.price).symbol }}{{ money(li.price).integer }}<span class="mp-money__cents">.{{ money(li.price).cents }}</span></span>
                        </td>
                        <td class="ord-num ord-exp__linetotal">
                          <span class="mp-money">{{ lineTotal(li.qty, li.price).symbol }}{{ lineTotal(li.qty, li.price).integer }}<span class="mp-money__cents">.{{ lineTotal(li.qty, li.price).cents }}</span></span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <div class="ord-exp__totals">
                    <div class="ord-exp__total-line"><span>Subtotal</span><span class="mp-money">${{ item.subtotal }}</span></div>
                    <div class="ord-exp__total-line"><span>Shipping</span><span class="mp-money">${{ item.shipping }}</span></div>
                    <div class="ord-exp__total-line ord-exp__total-line--grand">
                      <span>Order total</span>
                      <span class="mp-money" :class="{ 'mp-strike': isVoidedTotal(item) }">{{ money(item.total).symbol }}{{ money(item.total).integer }}<span class="mp-money__cents">.{{ money(item.total).cents }}</span></span>
                    </div>
                  </div>

                  <div v-if="item.notes" class="ord-exp__note">
                    <v-icon size="16">sticky-note</v-icon>
                    <span>{{ item.notes }}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
        <template #no-data>
          <MpEmptyState
            v-if="search || activeFilterEntries.length"
            icon="search"
            title="No orders match your search"
            description="Adjust your search or filters to see more."
          />
          <MpEmptyState
            v-else
            emphasis="prominent"
            illustration="empty-orders"
            title="No orders yet"
            description="Orders appear here as your channels start selling."
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredOrders.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="surface" prepend-icon="package-check" class="text-none" rounded="lg" @click="bulkFulfillDialog = true">Mark Fulfilled</v-btn>
      <v-btn size="small" variant="flat" color="surface" prepend-icon="ban" class="text-none text-error" rounded="lg" @click="askCancelBulk">Cancel Orders</v-btn>
    </MpFloatingBulkBar>

    <!-- Cancel confirmation (row + bulk) -->
    <MpConfirmDialog
      v-model="cancelDialog"
      title="Cancel order?"
      :message="cancelMessage"
      confirm-label="Cancel Order"
      danger
      @confirm="confirmCancel"
    />

    <!-- Bulk fulfill confirmation -->
    <MpConfirmDialog
      v-model="bulkFulfillDialog"
      title="Mark orders fulfilled?"
      :message="`Mark ${selected.length} selected order${selected.length === 1 ? '' : 's'} as fulfilled? Tracking numbers will be generated where missing.`"
      confirm-label="Mark Fulfilled"
      @confirm="confirmBulkFulfill"
    />
  </div>
</template>

<style scoped>
:deep(.v-data-table thead th) {
  white-space: nowrap;
}

/* Row click navigates to the order detail */
.orders-table :deep(tbody tr:not(.v-data-table__expanded__content)) {
  cursor: pointer;
}

/* Row grammar — customer name reads ink-strong */
.ord-customer {
  font-size: var(--mp-text-metaValue-fontSize);
  font-weight: var(--mp-text-metaValue-fontWeight);
  color: var(--on-surface);
}

.ord-tnum {
  font-variant-numeric: tabular-nums;
}

/* Quiet secondary statuses: colored dot + muted label */
.ord-dot-label {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  color: var(--on-surface-muted);
  font-size: var(--mp-fontSize-13);
}
.ord-dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  flex-shrink: 0;
}

/* ─── Expanded Row — editorial inset panel ───────────────────────── */
.ord-exp-row :deep(td) {
  background: var(--surface-secondary);
}
/* The expanded cell hosts its own hairline; Vuetify's row border would double it
   (same !important the table cell rule needs — Vuetify's selector is 5 deep). */
.orders-table :deep(.ord-exp-cell) {
  border-bottom: none !important;
}
.ord-exp {
  border-top: 1px solid var(--border-subtle);
}

/* Header bar: customer + payment/fulfillment meta + actions */
.ord-exp__bar {
  display: flex;
  align-items: center;
  gap: var(--mp-space-20);
  padding: var(--mp-space-16) var(--mp-component-card-padding);
}
.ord-exp__avatar {
  font-size: var(--mp-fontSize-13);
  flex-shrink: 0;
}
.ord-exp__name {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--on-surface);
  line-height: var(--mp-lineHeight-snug);
}
.ord-exp__email {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}
.ord-exp__meta {
  display: flex;
  gap: var(--mp-space-32);
  padding-left: var(--mp-space-20);
  border-left: 1px solid var(--border-subtle);
}
.ord-exp__meta-block {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}
.ord-exp__meta-val {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface);
}

/* Line-items silent table */
.ord-exp__items {
  padding: 0 var(--mp-component-card-padding) var(--mp-space-20);
}
.ord-exp__table {
  width: 100%;
  border-collapse: collapse;
}
.ord-exp__table th {
  text-align: left;
  padding: var(--mp-space-6) var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
}
.ord-exp__table td {
  padding: var(--mp-space-8) var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--mp-fontSize-13);
}
.ord-exp__table tbody tr:last-child td {
  border-bottom: none;
}
/* Numeric columns shrink to their content; the product column takes the rest. */
.ord-num {
  width: 1%;
  white-space: nowrap;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ord-exp__product {
  font-weight: var(--mp-text-metaValue-fontWeight);
  color: var(--on-surface);
}
.ord-exp__sku {
  margin-left: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}
.ord-exp__linetotal {
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--on-surface);
}

/* Totals — right-aligned ledger with hairline above the grand total */
.ord-exp__totals {
  margin-left: auto;
  min-width: var(--mp-component-toolbar-searchMinWidth);
  width: max-content;
  padding: var(--mp-space-12) var(--mp-space-12) 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}
.ord-exp__total-line {
  display: flex;
  justify-content: space-between;
  gap: var(--mp-space-24);
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}
.ord-exp__total-line--grand {
  margin-top: var(--mp-space-4);
  padding-top: var(--mp-space-10);
  border-top: 1px solid var(--border-default);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--on-surface);
}
.ord-exp__note {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-12);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-primary);
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}
</style>
