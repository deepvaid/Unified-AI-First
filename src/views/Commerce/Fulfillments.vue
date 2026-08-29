<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, FULFILLMENT_QUEUE_STATUSES, type FulfillmentQueueItem, type FulfillmentQueueStatus } from '@/stores/useCommerce'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpDialog from '@/components/MpDialog.vue'

const store = useCommerceStore()
const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const toast = useToast()
function notify(text: string) { toast.success(text) }

// Legacy-parity columns: ID | Order | Customer | Location | Fulfillment Status |
// Payment Status | Product QTY | Order Status | Sales Channel | Total | Created At | Actions
const headers = [
  { title: 'ID', key: 'id', sortable: true, width: 90 },
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customer' },
  { title: 'Location', key: 'location', hideBelow: 'lg' as const },
  { title: 'Fulfillment', key: 'status' },
  { title: 'Payment', key: 'paymentStatus', hideBelow: 'lg' as const },
  { title: 'Qty', key: 'productQty', align: 'center' as const, hideBelow: 'lg' as const },
  { title: 'Order Status', key: 'orderStatus', hideBelow: 'md' as const },
  { title: 'Sales Channel', key: 'salesChannel', hideBelow: 'lg' as const },
  { title: 'Total', key: 'total', align: 'end' as const, sortable: true },
  { title: 'Created At', key: 'createdAt', hideBelow: 'md' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: 48 },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ─── Filters ──────────────────────────────────────────────────────────────────
const filters = ref({
  status: null as FulfillmentQueueStatus | null,
})

const locationOptions = computed(() => [...new Set(store.fulfillments.map(f => f.location))])

// Location is the promoted filter: a multi-select pill in the toolbar. Its
// options come from live data, so the config is a computed, not a literal —
// the status cut already has its own stage chips above the table.
const locationQuickFilter = computed(() => ({
  key: 'location',
  label: 'Location',
  options: locationOptions.value.map((v) => ({ label: v, value: v })),
}))
const locationFilter = ref<string[]>([])

const filterLabels: Record<string, string> = {
  status: 'Fulfillment Status',
}

const activeFilterEntries = computed(() => {
  const entries =
    Object.entries(filters.value)
      .filter(([, v]) => v !== null)
      .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (locationFilter.value.length) {
    entries.unshift({ key: 'location', label: `Location: ${locationFilter.value.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'location') {
    locationFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  locationFilter.value = []
  filters.value = { status: null }
}

// Status summary chips — colour per fulfillment stage (beats the legacy FILTERS dropdown)
const stageColor: Record<string, string> = {
  'Picked': 'warning',
  'Packed': 'info',
  'Label Created': 'primary',
  'Shipped': 'success',
}
const stageCount = (s: string) => store.fulfillments.filter(f => f.status === s).length
function toggleStage(s: FulfillmentQueueStatus) {
  filters.value.status = filters.value.status === s ? null : s
}

const filteredFulfillments = computed(() => {
  let rows = store.fulfillments
  if (filters.value.status) rows = rows.filter(f => f.status === filters.value.status)
  if (locationFilter.value.length) rows = rows.filter(f => locationFilter.value.includes(f.location))
  return rows
})

function selectAll() {
  selected.value = filteredFulfillments.value.map(f => f.id)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function goToOrder(item: FulfillmentQueueItem) {
  router.push({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(item.orderId) } })
}

const NEXT_STAGE: Record<string, string> = { 'Picked': 'Packed', 'Packed': 'Label Created', 'Label Created': 'Shipped' }

function advanceStage(item: FulfillmentQueueItem) {
  const next = NEXT_STAGE[item.status]
  if (!next) return
  if (next === 'Shipped') {
    askShip([item.id])
    return
  }
  store.advanceFulfillment(item.id)
  notify(`${item.orderNumber} moved to ${next}`)
}

// Ship dialog (row + bulk) with optional tracking number
const shipDialog = ref(false)
const shipIds = ref<number[]>([])
const shipTracking = ref('')
function askShip(ids: number[]) {
  shipIds.value = ids
  shipTracking.value = ''
  shipDialog.value = true
}
function confirmShip() {
  store.markShipped([...shipIds.value], shipTracking.value.trim() || undefined)
  notify(`${shipIds.value.length} fulfillment${shipIds.value.length === 1 ? '' : 's'} marked shipped`)
  selected.value = selected.value.filter(id => !shipIds.value.includes(id))
  shipDialog.value = false
}

function printPackingSlips() {
  const count = selected.value.length || filteredFulfillments.value.length
  notify(`${count} packing slip${count === 1 ? '' : 's'} sent to printer`)
}

function exportFulfillments() {
  downloadCsv('fulfillments', filteredFulfillments.value, [
    { title: 'ID', value: (f) => `FF-${String(f.id).padStart(4, '0')}` },
    { title: 'Order', value: 'orderNumber' },
    { title: 'Customer', value: 'customer' },
    { title: 'Location', value: 'location' },
    { title: 'Fulfillment Status', value: 'status' },
    { title: 'Payment Status', value: 'paymentStatus' },
    { title: 'Product QTY', value: 'productQty' },
    { title: 'Order Status', value: 'orderStatus' },
    { title: 'Sales Channel', value: 'salesChannel' },
    { title: 'Total', value: 'total' },
    { title: 'Created At', value: 'createdAt' },
  ])
  notify(`Exported ${filteredFulfillments.value.length} fulfillments`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Fulfillment"
      :subtitle="`${store.fulfillments.filter(f => f.status !== 'Shipped').length} orders awaiting fulfillment`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportFulfillments">Export</v-btn>
        <v-btn variant="flat" prepend-icon="printer" class="text-none" color="surface" @click="printPackingSlips">Print Packing Slips</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="truck" class="text-none" :disabled="selected.length === 0" @click="askShip([...selected])">Mark Shipped{{ selected.length > 0 ? ` (${selected.length})` : '' }}</v-btn>
      </template>
    </MpPageHeader>

    <!-- Status Summary Chips — colour-coded + click to filter -->
    <div class="d-flex gap-2 flex-wrap">
      <v-chip
        v-for="s in FULFILLMENT_QUEUE_STATUSES"
        :key="s"
        :variant="filters.status === s ? 'flat' : 'tonal'"
        size="small"
        :color="stageColor[s]"
        class="cursor-pointer"
        :aria-pressed="filters.status === s"
        @click="toggleStage(s)"
      >
        {{ s }}
        <span class="fq-count">{{ stageCount(s) }}</span>
      </v-chip>
    </div>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="locationFilter"
        :quick-filter="locationQuickFilter"
        v-model:search="search"
        title="Fulfillment Queue"
        :active-filters="activeFilterEntries"
        :total-count="filteredFulfillments.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div class="mb-3">
              <v-select
                v-model="filters.status"
                label="Fulfillment Status"
                :items="[...FULFILLMENT_QUEUE_STATUSES]"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredFulfillments"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.id="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">FF-{{ String(item.id).padStart(4, '0') }}</span>
        </template>

        <template v-slot:item.orderNumber="{ item }">
          <span class="text-primary font-weight-bold cursor-pointer" @click="goToOrder(item)">{{ item.orderNumber }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="fulfillment" size="md" />
        </template>

        <template v-slot:item.paymentStatus="{ item }">
          <MpStatusChip :status="item.paymentStatus" type="payment" size="sm" />
        </template>

        <template v-slot:item.productQty="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-bold">{{ item.productQty }}</v-chip>
        </template>

        <template v-slot:item.orderStatus="{ item }">
          <MpStatusChip :status="item.orderStatus" type="order" size="sm" />
        </template>

        <template v-slot:item.salesChannel="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.salesChannel }}</span>
        </template>

        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold text-no-wrap">${{ item.total }}</span>
        </template>

        <template v-slot:item.createdAt="{ item }">
          <span class="text-medium-emphasis text-caption text-no-wrap">{{ item.createdAt }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Fulfillment actions">
            <v-list-item prepend-icon="eye" title="View order" @click="goToOrder(item)"></v-list-item>
            <v-list-item
              v-if="NEXT_STAGE[item.status] && NEXT_STAGE[item.status] !== 'Shipped'"
              prepend-icon="arrow-right"
              :title="`Advance to ${NEXT_STAGE[item.status]}`"
              @click="advanceStage(item)"
            ></v-list-item>
            <v-list-item prepend-icon="truck" title="Mark shipped" :disabled="item.status === 'Shipped'" @click="askShip([item.id])"></v-list-item>
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="truck"
            :title="search || activeFilterEntries.length ? 'No fulfillments match' : 'No fulfillments found'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear the filters.' : 'Fulfillment orders will appear here once customers place orders.'"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredFulfillments.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="success" class="text-none" prepend-icon="truck" rounded="lg" @click="askShip([...selected])">Mark Shipped</v-btn>
      <v-btn size="small" variant="flat" color="secondary" class="text-none" prepend-icon="printer" rounded="lg" @click="printPackingSlips">Print Packing Slips</v-btn>
    </MpFloatingBulkBar>

    <!-- ── Mark Shipped dialog (tracking number) ───────────────────── -->
    <MpDialog
      v-model="shipDialog"
      size="sm"
      :title="`Mark ${shipIds.length === 1 ? 'fulfillment' : `${shipIds.length} fulfillments`} shipped?`"
    >
      <div class="text-body-2 text-medium-emphasis">
        The linked order{{ shipIds.length === 1 ? '' : 's' }} will be updated to Shipped and the customer{{ shipIds.length === 1 ? '' : 's' }} notified.
      </div>
      <v-text-field
        v-model="shipTracking"
        label="Tracking number (optional)"
        placeholder="e.g. 1Z999AA10123456784"
        hide-details
      />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="shipDialog = false">Cancel</v-btn>
        <v-btn color="success" variant="flat" class="text-none" prepend-icon="truck" @click="confirmShip">Mark Shipped</v-btn>
      </template>
    </MpDialog>
  </div>
</template>

<style scoped>
.fq-count {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
