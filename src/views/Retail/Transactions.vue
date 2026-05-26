<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import { useRetailStore } from '@/stores/useRetail'
import type { RetailTransaction, TxnStatus } from '@/stores/useRetail'
import { TENDER_LABELS } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) { snackbar.value = { visible: true, message } }

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/* ── KPIs ──────────────────────────────────────────────────────── */
const kpis = computed(() => {
  const txns = store.transactionList.filter((t) => t.locationId === store.activeLocationId)
  const completed = txns.filter((t) => t.status === 'completed')
  const salesToday = completed.reduce((s, t) => s + t.total, 0)
  const returns = txns.filter((t) => t.status === 'refunded' || t.status === 'partial_refund')
  const avgBasket = completed.length > 0 ? salesToday / completed.length : 0
  return [
    { label: "Today's sales",   value: fmt(salesToday),         icon: 'trending-up',  color: 'retail' },
    { label: 'Transactions',    value: completed.length,         icon: 'receipt',      color: 'primary' },
    { label: 'Returns',         value: returns.length,           icon: 'undo-2',       color: 'warning' },
    { label: 'Average basket',  value: fmt(avgBasket),           icon: 'shopping-bag', color: 'analytics' },
  ]
})

/* ── Filter tabs ───────────────────────────────────────────────── */
const activeTab = ref('all')

const tabCounts = computed(() => {
  const all = store.transactionList.filter((t) => t.locationId === store.activeLocationId)
  return {
    all: all.length,
    sales: all.filter((t) => t.status === 'completed').length,
    returns: all.filter((t) => t.status === 'refunded' || t.status === 'partial_refund').length,
    voided: all.filter((t) => t.status === 'voided').length,
    suspended: all.filter((t) => t.status === 'suspended').length,
    boris: all.filter((t) => t.origin === 'boris').length,
  }
})

const tabs = computed(() => [
  { label: 'All',       key: 'all',       count: tabCounts.value.all },
  { label: 'Sales',     key: 'sales',     count: tabCounts.value.sales },
  { label: 'Returns',   key: 'returns',   count: tabCounts.value.returns },
  { label: 'Voided',    key: 'voided',    count: tabCounts.value.voided },
  { label: 'BORIS',     key: 'boris',     count: tabCounts.value.boris },
])

/* ── Table ─────────────────────────────────────────────────────── */
const search = ref('')
const associateFilter = ref('')

const tableHeaders = [
  { title: 'Receipt #',   key: 'id',           sortable: true,  width: 130 },
  { title: 'Time',        key: 'completedAt',  sortable: true,  width: 120 },
  { title: 'Location',    key: 'locationId',   sortable: false, width: 160 },
  { title: 'Associate',   key: 'associateId',  sortable: false, width: 160 },
  { title: 'Customer',    key: 'customerName', sortable: false, width: 160 },
  { title: 'Items',       key: 'itemCount',    sortable: true,  align: 'end' as const, width: 80 },
  { title: 'Tender',      key: 'tender',       sortable: false, width: 130 },
  { title: 'Total',       key: 'total',        sortable: true,  align: 'end' as const, width: 120 },
  { title: 'Status',      key: 'status',       sortable: false, width: 140 },
]

const rows = computed(() => {
  let list = store.transactionList.filter((t) => t.locationId === store.activeLocationId)
  if (activeTab.value === 'sales') list = list.filter((t) => t.status === 'completed')
  else if (activeTab.value === 'returns') list = list.filter((t) => t.status === 'refunded' || t.status === 'partial_refund')
  else if (activeTab.value === 'voided') list = list.filter((t) => t.status === 'voided')
  else if (activeTab.value === 'suspended') list = list.filter((t) => t.status === 'suspended')
  else if (activeTab.value === 'boris') list = list.filter((t) => t.origin === 'boris')
  if (associateFilter.value) list = list.filter((t) => t.associateId === associateFilter.value)
  return list
})

const STATUS_CHIP: Record<TxnStatus, string> = {
  completed: 'Active',
  refunded: 'Returned',
  partial_refund: 'Flagged',
  voided: 'Inactive',
  suspended: 'Pending',
}

const TENDER_ICON: Record<string, string> = {
  card: 'credit-card',
  cash: 'banknote',
  tap_to_pay: 'smartphone-nfc',
  gift_card: 'gift',
  split: 'split',
}

/* ── Detail drawer ─────────────────────────────────────────────── */
const detailDrawer = ref(false)
const selectedTxn = ref<RetailTransaction | null>(null)

function openDetail(item: RetailTransaction) {
  selectedTxn.value = item
  detailDrawer.value = true
}

const MOCK_LINES = [
  { sku: 'TEE-001-BLK-M',   name: 'Classic crew tee — Black', qty: 1, price: 39.00 },
  { sku: 'CAP-001-NVY',     name: 'Cap — Navy',                qty: 1, price: 35.00 },
  { sku: 'SOCKS-3PK-BLK',   name: 'Crew socks 3-pack',        qty: 2, price: 18.00 },
]

function associateName(id: string) {
  return store.associateList.find((a) => a.id === id)?.name ?? id
}

function registerName(id: string) {
  return store.registerList.find((r) => r.id === id)?.name ?? id
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactions"
      :subtitle="`Transaction history for ${store.activeLocation?.name ?? ''}.`"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="download" @click="showToast('Export — mock only')">
          Export
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- KPI row -->
    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <v-card flat border rounded="lg" class="retail-kpi-card h-100">
          <div class="retail-kpi-card__inner">
            <div class="retail-kpi-card__left">
              <div class="retail-kpi-card__header-row">
                <div class="retail-kpi-card__icon-chip" :class="`retail-kpi-card__icon-chip--${kpi.color}`">
                  <v-icon size="14">{{ kpi.icon }}</v-icon>
                </div>
                <div class="retail-kpi-card__title">{{ kpi.label }}</div>
              </div>
              <div class="retail-kpi-card__value num">{{ kpi.value }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <MpFilterTabs v-model="activeTab" :tabs="tabs" />

    <v-card flat border rounded="lg" class="retail-widget-card d-flex flex-column">
      <MpDataTableToolbar v-model:search="search" search-placeholder="Search receipt # or customer…">
        <template #filters>
          <v-select
            v-model="associateFilter"
            :items="[{ title: 'All associates', value: '' }, ...store.associateList.map((a) => ({ title: a.name, value: a.id }))]"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 180px;"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="tableHeaders"
        :items="rows"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        @click:row="(_e: Event, { item }: { item: RetailTransaction }) => openDetail(item)"
        style="cursor: pointer;"
      >
        <template #item.id="{ item }">
          <div class="d-flex align-center ga-2">
            <span class="font-weight-medium text-mono">{{ item.id }}</span>
            <v-chip v-if="item.origin === 'boris'" size="x-small" variant="tonal" color="info" class="font-weight-medium">BORIS</v-chip>
          </div>
        </template>

        <template #item.completedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatAgo(item.completedAt) }}</span>
        </template>

        <template #item.locationId="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
            {{ store.locationName(item.locationId) }}
          </v-chip>
        </template>

        <template #item.associateId="{ item }">
          <span class="text-body-2">{{ associateName(item.associateId) }}</span>
        </template>

        <template #item.customerName="{ item }">
          <span v-if="item.customerName" class="text-body-2">{{ item.customerName }}</span>
          <span v-else class="text-medium-emphasis">Guest</span>
        </template>

        <template #item.tender="{ item }">
          <div class="d-flex align-center ga-1">
            <v-icon size="13" color="medium-emphasis">{{ TENDER_ICON[item.tender] ?? 'credit-card' }}</v-icon>
            <span class="text-body-2">{{ TENDER_LABELS[item.tender] }}</span>
          </div>
        </template>

        <template #item.total="{ item }">
          <span
            class="font-weight-bold"
            :style="item.total < 0 ? 'color: var(--neg)' : 'color: var(--ink)'"
          >{{ fmt(item.total) }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="STATUS_CHIP[item.status]" type="general" size="x-small" />
        </template>

        <template #no-data>
          <MpEmptyState icon="receipt" title="No transactions" description="Transactions appear here as they're completed at your registers." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Transaction detail drawer -->
    <MpFormDrawer
      v-model="detailDrawer"
      :title="selectedTxn?.id ?? 'Transaction'"
      :subtitle="selectedTxn ? formatAgo(selectedTxn.completedAt) : ''"
      :width="520"
    >
      <template v-if="selectedTxn">
        <!-- Status + metadata -->
        <div class="d-flex align-center ga-3 mb-5 flex-wrap">
          <MpStatusChip :status="STATUS_CHIP[selectedTxn.status]" type="general" />
          <v-chip v-if="selectedTxn.origin === 'boris'" size="small" variant="tonal" color="info">BORIS</v-chip>
          <span class="text-medium-emphasis text-body-2" style="margin-left: auto;">{{ store.locationName(selectedTxn.locationId) }}</span>
        </div>

        <!-- Associates + register row -->
        <v-row dense class="mb-4">
          <v-col cols="6">
            <div class="txn-detail-meta">
              <div class="txn-detail-meta__label">Associate</div>
              <div class="txn-detail-meta__value">{{ associateName(selectedTxn.associateId) }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="txn-detail-meta">
              <div class="txn-detail-meta__label">Register</div>
              <div class="txn-detail-meta__value">{{ registerName(selectedTxn.registerId) }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="txn-detail-meta">
              <div class="txn-detail-meta__label">Customer</div>
              <div class="txn-detail-meta__value">{{ selectedTxn.customerName ?? 'Guest' }}</div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="txn-detail-meta">
              <div class="txn-detail-meta__label">Tender</div>
              <div class="txn-detail-meta__value">{{ TENDER_LABELS[selectedTxn.tender] }}</div>
            </div>
          </v-col>
        </v-row>

        <!-- Line items -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Items</div>
        <v-list density="compact" class="retail-detail-list mb-4">
          <v-list-item v-for="line in MOCK_LINES.slice(0, selectedTxn.itemCount)" :key="line.sku">
            <template #title>
              <span class="text-body-2 font-weight-medium">{{ line.name }}</span>
            </template>
            <template #subtitle>
              <span class="text-caption text-mono">{{ line.sku }}</span>
            </template>
            <template #append>
              <div class="text-right">
                <div class="text-body-2 font-weight-medium">{{ fmt(line.price) }}</div>
                <div class="text-caption text-medium-emphasis">× {{ line.qty }}</div>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <!-- Payment breakdown -->
        <div class="txn-total-row">
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span class="text-medium-emphasis">Subtotal</span>
            <span>{{ fmt(Math.abs(selectedTxn.total) * 0.909) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-2">
            <span class="text-medium-emphasis">Tax (10%)</span>
            <span>{{ fmt(Math.abs(selectedTxn.total) * 0.091) }}</span>
          </div>
          <v-divider class="mb-2" />
          <div class="d-flex justify-space-between font-weight-bold">
            <span>Total</span>
            <span :style="selectedTxn.total < 0 ? 'color: var(--neg)' : ''">{{ fmt(selectedTxn.total) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex flex-column gap-2 mt-4">
          <v-btn
            v-if="selectedTxn.hasReceipt"
            variant="outlined"
            class="text-none"
            prepend-icon="printer"
            @click="showToast('Receipt reprinted — mock only')"
          >
            Reprint receipt
          </v-btn>
          <v-btn
            v-if="selectedTxn.status === 'completed'"
            variant="outlined"
            class="text-none"
            color="warning"
            prepend-icon="undo-2"
            @click="showToast('Refund initiated — mock only')"
          >
            Issue refund
          </v-btn>
          <v-btn
            v-if="selectedTxn.status === 'completed'"
            variant="outlined"
            class="text-none"
            color="error"
            prepend-icon="x-circle"
            @click="showToast('Void — mock only')"
          >
            Void transaction
          </v-btn>
        </div>
      </template>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="detailDrawer = false">Close</v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.text-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.retail-detail-list {
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
}

.txn-detail-meta {
  padding: 10px 12px;
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);

  &__label {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 2px;
  }

  &__value {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
  }
}

.txn-total-row {
  padding: 14px;
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
}
</style>
