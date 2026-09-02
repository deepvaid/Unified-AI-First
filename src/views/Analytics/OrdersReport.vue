<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useCommerceStore()
const toast = useToast()
const search = ref('')
const filterStatus = ref<string[]>([])

// The one filter this report has, so it lives in the toolbar as a pill rather
// than behind a drawer.
const filterStatusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: (['Completed', 'Processing', 'Cancelled', 'Refunded', 'On Hold']).map((v) => ({ label: v, value: v })),
}
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })
const { loading } = useInitialLoad()

// Order number + customer identify the row and always show; amount, status and
// date drop out progressively so the table never side-scrolls on a phone.
const headers = [
  { title: 'Order Number', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customerName' },
  { title: 'Total', key: 'total', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Status', key: 'status', hideBelow: 'md' as const },
  { title: 'Date', key: 'date', hideBelow: 'md' as const },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterStatus.value.length > 0) filters.push({ key: 'status', label: `Status: ${filterStatus.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterStatus.value = []
}

function clearAllFilters() {
  filterStatus.value = []
}

const filteredOrders = computed(() =>
  store.orders.filter(
    (o) =>
      isWithinRange(o.date, dateRange.value) &&
      (filterStatus.value.length === 0 || (o.status != null && filterStatus.value.includes(o.status))),
  ),
)

function exportCsv() {
  downloadCsv('sales-by-order', filteredOrders.value, [
    { title: 'Order Number', value: 'orderNumber' },
    { title: 'Customer', value: (o) => o.customer.name },
    { title: 'Total', value: 'total' },
    { title: 'Status', value: (o) => o.status ?? '' },
    { title: 'Date', value: 'date' },
  ])
  toast.success(`Exported ${filteredOrders.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales by Order"
      :subtitle="`${store.orders.length} orders`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterStatus"
        :quick-filter="filterStatusQuickFilter"
        v-model:search="search"
        title="Order Analytics"
        :active-filters="activeFilterEntries"
        :total-count="filteredOrders.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredOrders" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.customerName="{ item }">{{ item.customer.name }}</template>
        <template v-slot:item.total="{ item }">${{ item.total }}</template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="order" size="sm" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="shopping-bag"
            :title="search || filterStatus.length ? 'No orders match your filters' : 'No orders in this range'"
            :description="search || filterStatus.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
