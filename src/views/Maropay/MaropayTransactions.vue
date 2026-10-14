<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import MaropayRefundDrawer from '@/components/maropay/MaropayRefundDrawer.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import type { ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { useMaropayListLoad } from './useMaropayListLoad'
import { downloadCsv } from '@/utils/exportCsv'
import { markFor, methodCaption } from '@/maropay/methodMarks'
import { formatMoney, isPositive, sum } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS, localDateKey } from '@/maropay/model'
import type { MaropayProvider, Payment } from '@/maropay/model'
import { formatDay, paymentBreakdown } from '@/maropay/readiness'
import { TRANSACTION_CSV_HEADERS, TRANSACTION_TABS, inTab, transactionCsvRow } from '@/maropay/transactions'
import type { TransactionTab } from '@/maropay/transactions'
import type { RefundResult } from '@/services/maropay/mockAdapter'

// Maropay → Transactions: every payment across the account's stores, with the
// order and provider behind each one (plan §3F). Payments an earlier provider
// took are listed too, clearly marked, because the order history spans both.
// Store operations users see their own stores only.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()
const { loading, error: loadError, retry: reload } = useMaropayListLoad()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

interface Row {
  id: string
  date: string
  customer: string
  email: string
  orderId: number | null
  orderNumber: string
  storeId: string
  store: string
  methodId: string
  method: string
  provider: MaropayProvider
  providerLabel: string
  /** Taken by another provider before the store used Maropay. */
  legacy: boolean
  amount: Money
  amountSort: number
  refunded: Money
  remaining: Money
  status: Payment['status']
  payment: Payment
}

function disputeFor(p: Payment) {
  return p.disputeId ? maropay.disputeById(p.disputeId) ?? null : null
}

const rows = computed<Row[]>(() => maropay.payments.map((p) => {
  const breakdown = paymentBreakdown(p, disputeFor(p))
  return {
    id: p.id,
    date: p.createdAt,
    customer: p.customer.name,
    email: p.customer.email,
    orderId: p.orderId,
    orderNumber: p.orderNumber ?? '',
    storeId: p.channelId,
    store: maropay.channelName(p.channelId),
    methodId: p.methodId,
    method: p.methodLabel,
    provider: p.provider,
    providerLabel: PROVIDER_LABELS[p.provider],
    legacy: p.legacy === true,
    amount: p.amount,
    amountSort: p.amount.amount,
    refunded: breakdown.refunded,
    remaining: breakdown.remainingRefundable,
    status: p.status,
    payment: p,
  }
}))

// ── Tabs and filters ───────────────────────────────────────────────

const activeTab = ref<TransactionTab>('all')
/** Counts and exports wait for the list; a failed load has none to show. */
const ready = computed(() => !loading.value && !loadError.value)

const search = ref('')
const storeFilter = ref<string[]>([])
const storeOptions = computed(() => [...new Map(rows.value.map((r) => [r.storeId, r.store])).entries()].map(([value, label]) => ({ value, label })))
const storeQuickFilter = computed(() => ({ key: 'store', label: 'Store', icon: 'store', options: storeOptions.value }))

const filters = ref({ provider: null as MaropayProvider | null, method: null as string | null })
/** Set by a payout's "Payments" line: only the payments that went out in that payout. */
const payoutFilter = ref<string | null>(typeof route.query.payout === 'string' ? route.query.payout : null)
const payoutPaymentIds = computed(() => (payoutFilter.value
  ? new Set(maropay.movementsForPayout(payoutFilter.value).map((m) => m.paymentId).filter((id): id is string => id !== null))
  : null))
const providerItems = computed(() => [...new Set(rows.value.map((r) => r.provider))].map((value) => ({ value, title: PROVIDER_LABELS[value] })))
const methodItems = computed(() => [...new Set(rows.value.map((r) => r.methodId))].map((value) => ({
  value,
  title: maropay.methods.find((m) => m.id === value)?.label ?? rows.value.find((r) => r.methodId === value)?.method ?? value,
})))

const activeFilterEntries = computed(() => {
  const entries: Array<{ key: string; label: string }> = []
  if (storeFilter.value.length) entries.push({ key: 'store', label: `Store: ${storeFilter.value.map((id) => maropay.channelName(id)).join(', ')}` })
  if (filters.value.provider) entries.push({ key: 'provider', label: `Provider: ${PROVIDER_LABELS[filters.value.provider]}` })
  if (filters.value.method) entries.push({ key: 'method', label: `Method: ${methodItems.value.find((m) => m.value === filters.value.method)?.title ?? filters.value.method}` })
  if (payoutFilter.value) entries.push({ key: 'payout', label: `Payout: ${payoutFilter.value}` })
  return entries
})

function clearPayoutFilter(): void {
  payoutFilter.value = null
  if (route.query.payout) void router.replace({ query: {} })
}

function removeFilter(key: string): void {
  if (key === 'store') storeFilter.value = []
  else if (key === 'payout') clearPayoutFilter()
  else filters.value[key as keyof typeof filters.value] = null
}

function clearFilters(): void {
  storeFilter.value = []
  filters.value = { provider: null, method: null }
  clearPayoutFilter()
}

/** Every filter except the tab. The tab counts come from this, so they follow the filters (M07). */
const scoped = computed(() => {
  const query = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (storeFilter.value.length && !storeFilter.value.includes(r.storeId)) return false
    if (filters.value.provider && r.provider !== filters.value.provider) return false
    if (filters.value.method && r.methodId !== filters.value.method) return false
    if (payoutPaymentIds.value && !payoutPaymentIds.value.has(r.id)) return false
    if (!query) return true
    return [r.id, r.orderNumber, r.customer, r.email, r.method].some((v) => v.toLowerCase().includes(query))
  })
})
const filtered = computed(() => scoped.value.filter((r) => inTab(r.payment, activeTab.value)))
const tabs = computed(() => TRANSACTION_TABS.map((t) => ({ label: t.label, key: t.key, count: ready.value ? scoped.value.filter((r) => inTab(r.payment, t.key)).length : undefined })))

const narrowed = computed(() => Boolean(search.value.trim() || activeFilterEntries.value.length || activeTab.value !== 'all'))

/** Totals for what's on screen, so a store filter shows that store's own numbers. */
const summary = computed(() => {
  const currency = maropay.account?.currency ?? 'USD'
  const same = filtered.value.filter((r) => r.amount.currency === currency)
  const captured = sum(same.map((r) => paymentBreakdown(r.payment, disputeFor(r.payment)).gross), currency)
  const refunded = sum(same.map((r) => r.refunded), currency)
  return `${formatMoney(captured)} captured${isPositive(refunded) ? ` · ${formatMoney(refunded)} refunded` : ''}`
})

// ── Columns ────────────────────────────────────────────────────────

// Six columns so the table fits beside the Maropay rail (Stripe's payments list):
// the status rides with the amount, and the store and an earlier provider are
// sub-lines. Both stay in the quick filter, the filter drawer and the CSV.
const HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'Amount', key: 'amountSort', sortable: true },
  { title: 'Method', key: 'method', hideBelow: 'md' },
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customer', sortable: true, hideBelow: 'md' },
  { title: 'Date', key: 'date', sortable: true, hideBelow: 'sm' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]
const multiStore = computed(() => storeOptions.value.length > 1)
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(HEADERS, hiddenColumns)

function paymentRoute(id: string) {
  return { name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId: id } }
}

function orderRoute(orderId: number) {
  return { name: 'OrderDetail', params: { accountId: accountId.value, orderId } }
}

function openRow(_event: Event, { item }: { item: Row }): void {
  void router.push(paymentRoute(item.id))
}

// ── Refunds and export ─────────────────────────────────────────────

const refundOpen = ref(false)
const refundTarget = ref<Row | null>(null)

function canRefundRow(row: Row): boolean {
  return maropay.can('refund', row.storeId) && isPositive(row.remaining) && row.status !== 'disputed'
}

function openRefund(row: Row): void {
  refundTarget.value = row
  refundOpen.value = true
}

function onRefunded({ refund }: RefundResult): void {
  const via = refund.provider === 'maropay' ? '' : ` through ${PROVIDER_LABELS[refund.provider]}`
  toast.success(refund.status === 'pending'
    ? `Refund of ${formatMoney(refund.amount)} started${via}. It can take a few days to complete.`
    : `Refunded ${formatMoney(refund.amount)}${via}.`)
}

function exportCsv(): void {
  const data = filtered.value.map((r) => transactionCsvRow(r.payment, r.store, disputeFor(r.payment)))
  downloadCsv(`maropay-transactions-${localDateKey(Date.now())}`, data, TRANSACTION_CSV_HEADERS.map((title) => ({ title, value: title })))
  toast.success(`Exported ${data.length} ${data.length === 1 ? 'payment' : 'payments'}.`)
}

const hasLiveStore = computed(() => maropay.bindings.some((b) => b.activation === 'live'))

/** No payments yet: the first live store's storefront is where one can be made. */
function openLiveStore(): void {
  const live = maropay.bindings.find((b) => b.activation === 'live')
  if (!live) return
  window.open(router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: live.channelId } }).href, '_blank', 'noopener')
}
</script>

<template>
  <!-- No h-100: the Maropay shell scrolls its content, so a height cap would clip the table. -->
  <div class="d-flex flex-column gap-5">
    <MpPageHeader title="Transactions" subtitle="Every payment across your stores, including ones your other providers took.">
      <template v-if="maropay.can('export')" #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" :disabled="!ready || !filtered.length" @click="exportCsv">Export CSV</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter payments by status" />
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        v-model:quick-filter-value="storeFilter"
        :quick-filter="storeOptions.length > 1 ? storeQuickFilter : undefined"
        :headers="HEADERS"
        :active-filters="activeFilterEntries"
        :total-count="ready ? filtered.length : undefined"
        search-placeholder="Search order, customer or payment"
        @remove-filter="removeFilter"
        @clear-filters="clearFilters"
      >
        <template #filter-content>
          <!-- A dense popover, not a form: nothing here validates, so hide-details is deliberate. -->
          <MpFormGrid>
            <v-select v-model="filters.provider" label="Provider" :items="providerItems" placeholder="All" hide-details clearable />
            <v-select v-model="filters.method" label="Payment method" :items="methodItems" placeholder="All" hide-details clearable />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <p v-if="!loading && !loadError && filtered.length" class="maropay-tx__summary">{{ summary }}</p>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="7" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn’t load payments"
        description="The request timed out before we heard back. Your payments are safe — try again."
        @action="reload"
      />

      <v-data-table
        v-else
        :key="activeTab"
        :headers="visibleHeaders"
        :items="filtered"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        :sort-by="[{ key: 'date', order: 'desc' }]"
        fixed-header
        class="flex-grow-1 maropay-tx__table"
        @click:row="openRow"
      >
        <template #item.amountSort="{ item }">
          <div class="maropay-tx__stack">
            <span class="maropay-tx__amount">
              <MaropayMoney :amount="item.amount" class="maropay-tx__strong" />
              <MpStatusChip :status="PAYMENT_STATUS_LABELS[item.status]" type="payment" size="sm" />
            </span>
            <span v-if="isPositive(item.refunded)" class="maropay-tx__sub">{{ formatMoney(item.refunded) }} refunded</span>
          </div>
        </template>

        <template #item.method="{ item }">
          <div class="maropay-tx__stack">
            <span class="maropay-tx__method">
              <MaropayMethodMark :mark="markFor(item.methodId, item.method)" size="sm" decorative />
              {{ methodCaption(item.methodId, item.method) }}
            </span>
            <span v-if="item.provider !== 'maropay'" class="maropay-tx__sub">{{ item.legacy ? `${item.providerLabel} · before Maropay` : `Through ${item.providerLabel}` }}</span>
          </div>
        </template>

        <template #item.orderNumber="{ item }">
          <div class="maropay-tx__stack">
            <router-link v-if="item.orderId" :to="orderRoute(item.orderId)" class="mp-link" @click.stop>{{ item.orderNumber }}</router-link>
            <span v-else class="maropay-tx__sub">—</span>
            <span v-if="multiStore" class="maropay-tx__sub">{{ item.store }}</span>
          </div>
        </template>

        <template #item.customer="{ item }">
          <span class="text-no-wrap">{{ item.customer }}</span>
        </template>

        <template #item.date="{ item }">
          <span class="maropay-tx__sub maropay-tx__date">{{ formatDay(item.date) }}</span>
        </template>

        <template #header.actions>
          <span class="d-sr-only">Actions</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Payment actions" :itemLabel="item.orderNumber || item.id">
              <MpMenuItem title="View payment" icon="receipt" :to="paymentRoute(item.id)" />
              <MpMenuItem v-if="item.orderId" title="Open order" icon="shopping-bag" :to="orderRoute(item.orderId)" />
              <template v-if="canRefundRow(item)">
                <v-divider class="my-1" />
                <MpMenuItem title="Refund" icon="undo-2" @click="openRefund(item)" />
              </template>
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="narrowed"
            icon="search"
            title="No payments match"
            description="Change the search, the filters or the tab to see more."
            :heading-level="2"
          />
          <MpEmptyState
            v-else-if="!maropay.account"
            emphasis="prominent"
            icon="wallet"
            title="Maropay isn’t set up yet"
            description="Payments appear here once a store takes payments with Maropay."
            action-label="See how Maropay works"
            action-icon="arrow-right"
            :heading-level="2"
            @action="router.push({ name: 'MaropayOverview', params: { accountId } })"
          />
          <MpEmptyState
            v-else
            emphasis="prominent"
            icon="receipt"
            title="No payments yet"
            :description="hasLiveStore ? 'Payments appear here as soon as a shopper pays. Buy something on your store to see one arrive.' : 'Payments appear here once a store is live on Maropay.'"
            :action-label="hasLiveStore ? 'Open your store' : 'Go to overview'"
            :action-icon="hasLiveStore ? 'external-link' : 'arrow-right'"
            :heading-level="2"
            @action="hasLiveStore ? openLiveStore() : router.push({ name: 'MaropayOverview', params: { accountId } })"
          />
        </template>
      </v-data-table>
    </v-card>

    <MaropayRefundDrawer
      v-if="refundTarget"
      v-model="refundOpen"
      :payment="refundTarget.payment"
      :remaining="refundTarget.remaining"
      :store-name="refundTarget.store"
      :refund="(amount, reason, key) => maropay.refund(refundTarget!.id, amount, reason, key)"
      @refunded="onRefunded"
    />
  </div>
</template>

<style scoped>
.maropay-tx__summary {
  margin: 0;
  padding: 0 var(--mp-component-table-cellPaddingInline) var(--mp-space-8);
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
  font-variant-numeric: tabular-nums;
}

.maropay-tx__table :deep(tbody tr) {
  cursor: pointer;
}

.maropay-tx__stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.maropay-tx__amount,
.maropay-tx__method {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-4) var(--mp-space-8);
  white-space: nowrap;
}

.maropay-tx__strong {
  font-weight: var(--mp-fontWeight-semibold);
}

.maropay-tx__sub {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
  white-space: nowrap;
}

.maropay-tx__date {
  font-size: var(--mp-text-body-fontSize);
}
</style>
