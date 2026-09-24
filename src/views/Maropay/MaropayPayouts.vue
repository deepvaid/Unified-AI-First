<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MaropayBalanceCards from '@/components/maropay/MaropayBalanceCards.vue'
import MaropayBankAccountDrawer from '@/components/maropay/MaropayBankAccountDrawer.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import type { ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { useMaropayListLoad } from './useMaropayListLoad'
import { downloadCsv } from '@/utils/exportCsv'
import { formatMoney } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { PAYOUT_STATUS_LABELS, localDateKey } from '@/maropay/model'
import type { Payout } from '@/maropay/model'
import { PAYOUT_CSV_HEADERS, PAYOUT_TABS, UPCOMING_PAYOUT_ID, payoutCsvRow } from '@/maropay/payouts'
import type { PayoutTab } from '@/maropay/payouts'
import { formatDay, payoutScheduleLabel } from '@/maropay/readiness'

// Maropay → Payouts: money sent to the bank, and what went into each payout
// (plan §3G). The next payout is an estimate, shown as one — never a promise.
// "Sent to bank" means the transfer was confirmed as sent, not that the bank
// has credited it. Paused and failed payouts say why and how to fix them here.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()
const { loading, error: loadError, retry: reload } = useMaropayListLoad()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const canView = computed(() => maropay.can('view_payouts'))
const destination = computed(() => maropay.account?.payoutDestination ?? null)
const isOwner = computed(() => maropay.actingRole === 'owner')

interface Row {
  id: string
  upcoming: boolean
  date: string
  destination: string
  payments: number
  amount: Money
  amountSort: number
  statusLabel: string
  arrival: string
  payout: Payout | null
}

function chargeCount(movementIds: string[]): number {
  return maropay.state.movements.filter((m) => movementIds.includes(m.id) && m.kind === 'charge').length
}

function arrivalOf(p: Payout): string {
  if (p.status === 'paid' && p.paidAt) return `Sent ${formatDay(p.paidAt)}`
  if (p.status === 'failed' && p.failure) return `Returned ${formatDay(p.failure.at)}`
  return p.arrivalEstimate ? `Estimated ${formatDay(p.arrivalEstimate)}` : '—'
}

const rows = computed<Row[]>(() => {
  const upcoming = maropay.upcomingPayout
  const stored = maropay.payouts.map((p): Row => ({
    id: p.id,
    upcoming: false,
    date: p.createdAt,
    destination: `${p.destination.bankName} •••• ${p.destination.last4}`,
    payments: chargeCount(p.movementIds),
    amount: p.amount,
    amountSort: p.amount.amount,
    statusLabel: PAYOUT_STATUS_LABELS[p.status],
    arrival: arrivalOf(p),
    payout: p,
  }))
  if (!upcoming) return stored
  return [{
    id: UPCOMING_PAYOUT_ID,
    upcoming: true,
    date: upcoming.estimatedAt,
    destination: destination.value ? `${destination.value.bankName} •••• ${destination.value.last4}` : 'No bank account yet',
    payments: chargeCount(upcoming.movementIds),
    amount: upcoming.amount,
    amountSort: upcoming.amount.amount,
    statusLabel: 'Upcoming',
    arrival: upcoming.blocked ? 'Paused' : `Estimated ${formatDay(upcoming.estimatedAt)}`,
    payout: null,
  }, ...stored]
})

// ── Tabs and search ────────────────────────────────────────────────

const activeTab = ref<PayoutTab>('all')

function inTab(row: Row, tab: PayoutTab): boolean {
  if (tab === 'all') return true
  if (tab === 'upcoming') return row.upcoming
  return row.payout?.status === tab
}

/** Counts and exports wait for the list; a failed load has none to show. */
const ready = computed(() => !loading.value && !loadError.value)
const search = ref('')
/** The search, before the tab — the tab counts come from this so they follow the search. */
const scoped = computed(() => {
  const query = search.value.trim().toLowerCase()
  return rows.value.filter((r) => !query || [r.id, r.destination].some((v) => v.toLowerCase().includes(query)))
})
const filtered = computed(() => scoped.value.filter((r) => inTab(r, activeTab.value)))
const tabs = computed(() => PAYOUT_TABS.map((t) => ({ label: t.label, key: t.key, count: ready.value ? scoped.value.filter((r) => inTab(r, t.key)).length : undefined })))

const HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Payout', key: 'id' },
  { title: 'Destination', key: 'destination', hideBelow: 'md' },
  { title: 'Payments', key: 'payments', align: 'end', hideBelow: 'lg' },
  { title: 'Amount', key: 'amountSort', sortable: true, align: 'end' },
  { title: 'Status', key: 'statusLabel' },
  { title: 'Arrival', key: 'arrival', hideBelow: 'md' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(HEADERS, hiddenColumns)

function detailRoute(id: string) {
  return { name: 'MaropayPayoutDetail', params: { accountId: accountId.value, payoutId: id } }
}

function openRow(_event: Event, { item }: { item: Row }): void {
  void router.push(detailRoute(item.id))
}

// ── Paused and failed payouts ──────────────────────────────────────

const bankTask = computed(() => maropay.openTasks.find((t) => t.kind === 'bank') ?? null)
const failedTasks = computed(() => maropay.openTasks.filter((t) => t.kind === 'payout_failed'))
const bankOpen = ref(false)

function confirmBank(): void {
  if (!bankTask.value) return
  const result = maropay.resolveTask(bankTask.value.id, { confirmed: true })
  if (result.ok) toast.success('Bank account confirmed. Payouts are running again.')
  else toast.error(result.error.message)
}

function onBankSaved(): void {
  toast.success('Payout bank account changed.')
}

function retry(row: Row): void {
  if (!row.payout) return
  const result = maropay.retryPayout(row.payout.id)
  if (result.ok) toast.success(`Payout retried as ${result.value.id}.`)
  else toast.error(result.error.message)
}

function canRetry(row: Row): boolean {
  const p = row.payout
  return Boolean(p && p.status === 'failed' && !p.retriedBy && maropay.can('retry_payout'))
}

// ── Export and demo ────────────────────────────────────────────────

function exportCsv(): void {
  const data = filtered.value.filter((r) => r.payout).map((r) => payoutCsvRow(r.payout!, r.payments))
  downloadCsv(`maropay-payouts-${localDateKey(Date.now())}`, data, PAYOUT_CSV_HEADERS.map((title) => ({ title, value: title })))
  toast.success(`Exported ${data.length} ${data.length === 1 ? 'payout' : 'payouts'}.`)
}

function runPayout(): void {
  const result = maropay.runPayout()
  if (result.ok) toast.info(`Simulated: payout ${result.value.id} of ${formatMoney(result.value.amount)} sent.`)
  else toast.error(result.error.message)
}

const balance = computed(() => maropay.balances.find((b) => b.currency === (maropay.account?.currency ?? 'USD')) ?? maropay.balances[0] ?? null)
const subtitle = computed(() => {
  const account = maropay.account
  if (!destination.value || !account) return 'Money Maropay sends to your bank.'
  return `Paid to ${destination.value.bankName} •••• ${destination.value.last4} · ${payoutScheduleLabel(account.payoutSchedule)}.`
})
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader title="Payouts" :subtitle="subtitle">
      <template v-if="canView && maropay.can('export')" #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" :disabled="!ready || !maropay.payouts.length" @click="exportCsv">Export CSV</v-btn>
      </template>
      <template v-if="canView && maropay.account" #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter payouts by status" />
      </template>
    </MpPageHeader>

    <v-card v-if="!canView" flat border rounded="lg">
      <MpEmptyState
        icon="lock"
        title="Payouts are for owners and finance"
        description="Store operations users can see payments for their stores, but not balances or payouts."
        :heading-level="2"
      />
    </v-card>

    <v-card v-else-if="!maropay.account" flat border rounded="lg">
      <MpEmptyState
        emphasis="prominent"
        icon="landmark"
        title="Maropay isn’t set up yet"
        description="Payouts start once a store takes payments with Maropay."
        action-label="See how Maropay works"
        action-icon="arrow-right"
        :heading-level="2"
        @action="router.push({ name: 'MaropayOverview', params: { accountId } })"
      />
    </v-card>

    <template v-else>
      <MpAlert v-if="bankTask" tone="warning" live="off" title="Payouts are paused">
        {{ bankTask.description }}{{ isOwner ? '' : ' The business owner needs to confirm the bank account.' }}
        <template v-if="isOwner" #actions>
          <v-btn v-if="destination" size="small" variant="outlined" class="text-none" @click="confirmBank">Confirm {{ destination.bankName }} •••• {{ destination.last4 }}</v-btn>
          <v-btn size="small" variant="text" class="text-none" @click="bankOpen = true">Use a different account</v-btn>
        </template>
      </MpAlert>
      <MpAlert v-for="task in failedTasks" :key="task.id" tone="error" live="off" :title="task.title">
        {{ task.description }}
        <template v-if="task.payoutId" #actions>
          <v-btn size="small" variant="outlined" class="text-none" :to="detailRoute(task.payoutId)">Fix this payout</v-btn>
        </template>
      </MpAlert>

      <MaropayBalanceCards v-if="balance" :balance="balance" :upcoming="maropay.upcomingPayout" />

      <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
        <MpDataTableToolbar
          v-model:search="search"
          v-model:hidden-columns="hiddenColumns"
          :headers="HEADERS"
          :total-count="ready ? filtered.length : undefined"
          search-placeholder="Search payout or bank"
        />

        <MpTableSkeleton v-if="loading" :rows="6" :columns="6" />

        <MpErrorState
          v-else-if="loadError"
          title="Couldn’t load payouts"
          description="The request timed out before we heard back. Your payouts are safe — try again."
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
          class="maropay-payouts__table"
          @click:row="openRow"
        >
          <template #item.date="{ item }">
            <span class="text-no-wrap">{{ formatDay(item.date) }}</span>
          </template>

          <template #item.id="{ item }">
            <span class="maropay-payouts__id">{{ item.upcoming ? 'Next payout' : item.id }}</span>
          </template>

          <template #item.destination="{ item }">
            <span class="text-body-2 text-no-wrap">{{ item.destination }}</span>
          </template>

          <template #item.amountSort="{ item }">
            <span :class="{ 'maropay-payouts__estimate': item.upcoming }">
              <template v-if="item.upcoming">≈ </template><MaropayMoney :amount="item.amount" />
            </span>
          </template>

          <template #item.statusLabel="{ item }">
            <MpStatusChip :status="item.statusLabel" type="payout" size="sm" />
          </template>

          <template #item.arrival="{ item }">
            <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.arrival }}</span>
          </template>

          <template #header.actions>
            <span class="d-sr-only">Actions</span>
          </template>

          <template #item.actions="{ item }">
            <div @click.stop>
              <MpRowActionsMenu ariaLabel="Payout actions" :itemLabel="item.upcoming ? 'next payout' : item.id">
                <MpMenuItem title="View payout" icon="landmark" :to="detailRoute(item.id)" />
                <MpMenuItem v-if="!item.upcoming" title="Payments in this payout" icon="receipt" :to="{ name: 'MaropayTransactions', params: { accountId }, query: { payout: item.id } }" />
                <template v-if="canRetry(item)">
                  <v-divider class="my-1" />
                  <MpMenuItem title="Retry payout" icon="rotate-ccw" @click="retry(item)" />
                </template>
              </MpRowActionsMenu>
            </div>
          </template>

          <template #no-data>
            <MpEmptyState
              v-if="search || activeTab !== 'all'"
              icon="search"
              title="No payouts match"
              description="Change the search or the tab to see more."
              :heading-level="2"
            />
            <MpEmptyState
              v-else
              emphasis="prominent"
              icon="landmark"
              title="No payouts yet"
              description="Once payments settle, Maropay pays them out to your bank and they appear here."
              :heading-level="2"
            />
          </template>
        </v-data-table>
      </v-card>

      <v-card v-if="isOwner && maropay.upcomingPayout" flat border rounded="lg" class="maropay-payouts__card">
        <MpSectionHeader icon="flask-conical" title="Simulate the payout schedule" description="Demo controls — not part of the product." :heading-level="2" />
        <div class="d-flex flex-wrap align-center ga-3">
          <v-btn size="small" variant="outlined" class="text-none" :disabled="maropay.upcomingPayout.blocked" @click="runPayout">Run the next payout now</v-btn>
          <span v-if="maropay.upcomingPayout.blocked" class="maropay-payouts__note">Payouts are paused, so the schedule waits.</span>
        </div>
      </v-card>
    </template>

    <MaropayBankAccountDrawer
      v-model="bankOpen"
      :current="destination"
      :country="maropay.account?.country ?? 'US'"
      :default-holder="maropay.business?.legalName ?? ''"
      @saved="onBankSaved"
    />
  </div>
</template>

<style scoped>
.maropay-payouts__table :deep(tbody tr) {
  cursor: pointer;
}

.maropay-payouts__id {
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.maropay-payouts__estimate {
  color: var(--text-secondary);
  white-space: nowrap;
}

.maropay-payouts__card {
  padding: var(--mp-component-card-padding);
}

.maropay-payouts__note {
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
