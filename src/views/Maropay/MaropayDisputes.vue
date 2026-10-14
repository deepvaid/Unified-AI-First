<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import type { ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useMaropayStore } from '@/stores/useMaropay'
import { useMaropayListLoad } from './useMaropayListLoad'
import { DISPUTE_REASON_LABELS, DISPUTE_STATUS_LABELS } from '@/maropay/model'
import type { Dispute } from '@/maropay/model'
import { DISPUTE_TABS, daysUntil, deadlineLabel } from '@/maropay/disputes'
import type { DisputeTab } from '@/maropay/disputes'
import { formatDay } from '@/maropay/readiness'

// Maropay → Disputes: payments a shopper's bank has reversed, each with its
// response deadline written out — "Due in 3 days", never just a red date.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const { loading, error: loadError, retry: reload } = useMaropayListLoad()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const canView = computed(() => maropay.can('view_disputes'))

interface Row {
  id: string
  opened: string
  orderId: number | null
  orderNumber: string
  customer: string
  store: string
  reason: string
  amount: Dispute['amount']
  amountSort: number
  respondBy: string
  status: Dispute['status']
  dispute: Dispute
}

const rows = computed<Row[]>(() => maropay.disputes.map((d) => ({
  id: d.id,
  opened: d.openedAt,
  orderId: d.orderId,
  orderNumber: d.orderNumber ?? '',
  customer: maropay.paymentById(d.paymentId)?.customer.name ?? '',
  store: maropay.channelName(d.channelId),
  reason: DISPUTE_REASON_LABELS[d.reason],
  amount: d.amount,
  amountSort: d.amount.amount,
  respondBy: d.respondBy,
  status: d.status,
  dispute: d,
})))

const activeTab = ref<DisputeTab>('all')
/** Counts wait for the list; a failed load has none to show. */
const ready = computed(() => !loading.value && !loadError.value)
const search = ref('')
/** The search, before the tab — the tab counts come from this so they follow the search. */
const scoped = computed(() => {
  const query = search.value.trim().toLowerCase()
  return rows.value.filter((r) => !query || [r.id, r.orderNumber, r.customer, r.reason].some((v) => v.toLowerCase().includes(query)))
})
const filtered = computed(() => scoped.value.filter((r) => activeTab.value === 'all' || r.status === activeTab.value))
const tabs = computed(() => DISPUTE_TABS.map((t) => ({ label: t.label, key: t.key, count: ready.value ? scoped.value.filter((r) => t.key === 'all' || r.status === t.key).length : undefined })))

const needResponse = computed(() => rows.value.filter((r) => r.status === 'needs_response').length)

// As Transactions: the status rides with the amount and the reason sits under it,
// the customer under the order — five columns that fit beside the rail.
const HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'Amount', key: 'amountSort', sortable: true },
  { title: 'Respond by', key: 'respondBy', sortable: true },
  { title: 'Order', key: 'orderNumber', hideBelow: 'sm' },
  { title: 'Opened', key: 'opened', sortable: true, hideBelow: 'sm' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(HEADERS, hiddenColumns)

function detailRoute(id: string) {
  return { name: 'MaropayDisputeDetail', params: { accountId: accountId.value, disputeId: id } }
}

function openRow(_event: Event, { item }: { item: Row }): void {
  void router.push(detailRoute(item.id))
}

/** Three days or less is urgent enough to say so in the ink, on top of the words. */
function urgent(row: Row): boolean {
  return row.status === 'needs_response' && daysUntil(row.respondBy, maropay.now) <= 3
}
</script>

<template>
  <!-- No h-100: the Maropay shell scrolls its content, so a height cap would clip the table. -->
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="Disputes"
      :subtitle="needResponse ? `${needResponse} ${needResponse === 1 ? 'dispute needs' : 'disputes need'} a response before the deadline.` : 'When a shopper’s bank reverses a payment, respond here before the deadline.'"
    >
      <template v-if="canView && maropay.account" #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter disputes by status" />
      </template>
    </MpPageHeader>

    <v-card v-if="!canView" flat border rounded="lg">
      <MpEmptyState
        icon="lock"
        title="Disputes are for owners and finance"
        description="Store operations users can see payments for their stores, but not disputes."
        :heading-level="2"
      />
    </v-card>

    <v-card v-else flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        :headers="HEADERS"
        :total-count="ready ? filtered.length : undefined"
        search-placeholder="Search order, customer or reason"
      />

      <MpTableSkeleton v-if="loading" :rows="5" :columns="6" />

      <MpErrorState
        v-else-if="loadError"
        title="Couldn’t load disputes"
        description="The request timed out before we heard back. Your disputes are safe — try again."
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
        :sort-by="[{ key: 'opened', order: 'desc' }]"
        fixed-header
        class="flex-grow-1 maropay-disputes__table"
        @click:row="openRow"
      >
        <template #item.amountSort="{ item }">
          <div class="maropay-disputes__stack">
            <span class="maropay-disputes__amount">
              <MaropayMoney :amount="item.amount" class="maropay-disputes__strong" />
              <MpStatusChip :status="DISPUTE_STATUS_LABELS[item.status]" type="dispute" size="sm" />
            </span>
            <span class="maropay-disputes__sub">{{ item.reason }}</span>
          </div>
        </template>

        <template #item.respondBy="{ item }">
          <div v-if="item.status === 'needs_response'" class="maropay-disputes__stack">
            <span class="text-no-wrap">{{ formatDay(item.respondBy) }}</span>
            <span class="maropay-disputes__sub" :class="{ 'maropay-disputes__due--urgent': urgent(item) }">{{ deadlineLabel(item.respondBy, maropay.now) }}</span>
          </div>
          <span v-else class="maropay-disputes__sub">—</span>
        </template>

        <template #item.orderNumber="{ item }">
          <div class="maropay-disputes__stack">
            <router-link v-if="item.orderId" :to="{ name: 'OrderDetail', params: { accountId, orderId: item.orderId } }" class="mp-link" @click.stop>{{ item.orderNumber }}</router-link>
            <span v-else class="maropay-disputes__sub">—</span>
            <span class="maropay-disputes__sub">{{ item.customer }}</span>
          </div>
        </template>

        <template #item.opened="{ item }">
          <span class="maropay-disputes__sub maropay-disputes__date">{{ formatDay(item.opened) }}</span>
        </template>

        <template #header.actions>
          <span class="d-sr-only">Actions</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Dispute actions" :itemLabel="item.orderNumber || item.id">
              <MpMenuItem :title="item.status === 'needs_response' ? 'Respond' : 'View dispute'" icon="shield-alert" :to="detailRoute(item.id)" />
              <MpMenuItem title="View payment" icon="receipt" :to="{ name: 'MaropayPaymentDetail', params: { accountId, paymentId: item.dispute.paymentId } }" />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search || activeTab !== 'all'"
            icon="search"
            title="No disputes match"
            description="Change the search or the tab to see more."
            :heading-level="2"
          />
          <MpEmptyState
            v-else
            emphasis="prominent"
            icon="shield-check"
            title="No disputes"
            description="If a shopper’s bank disputes a payment, it shows up here with its response deadline."
            :heading-level="2"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.maropay-disputes__table :deep(tbody tr) {
  cursor: pointer;
}

.maropay-disputes__stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.maropay-disputes__amount {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-4) var(--mp-space-8);
  white-space: nowrap;
}

.maropay-disputes__strong {
  font-weight: var(--mp-fontWeight-semibold);
}

.maropay-disputes__sub {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}

.maropay-disputes__date {
  font-size: var(--mp-text-body-fontSize);
}

.maropay-disputes__due--urgent {
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--warn-ink);
}
</style>
