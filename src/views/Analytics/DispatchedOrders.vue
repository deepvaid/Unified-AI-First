<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'

const store = useCommerceStore()
const toast = useToast()
const search = ref('')
const filterCourier = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

const headers = [
  { title: 'Order Number', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customerName' },
  { title: 'Courier', key: 'courier' },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Date', key: 'date' },
]

const couriers = ['UPS', 'FedEx', 'USPS', 'DHL']

// Dispatched = fulfillmentStatus "Shipped" (order.status carries the sales state, not dispatch).
const dispatchedOrders = computed(() =>
  store.orders.filter(
    (o) =>
      o.fulfillmentStatus === 'Shipped' &&
      isWithinRange(o.date, dateRange.value) &&
      (filterCourier.value.length === 0 || (o.courier != null && filterCourier.value.includes(o.courier))),
  ),
)

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterCourier.value.length > 0) filters.push({ key: 'courier', label: `Courier: ${filterCourier.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterCourier.value = []
}

function clearAllFilters() {
  filterCourier.value = []
}

function exportCsv() {
  downloadCsv('dispatched-orders', dispatchedOrders.value, [
    { title: 'Order Number', value: 'orderNumber' },
    { title: 'Customer', value: (o) => o.customer.name },
    { title: 'Courier', value: (o) => o.courier ?? '' },
    { title: 'Total', value: 'total' },
    { title: 'Date', value: 'date' },
  ])
  toast.success(`Exported ${dispatchedOrders.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dispatched Orders"
      :subtitle="`${dispatchedOrders.length} dispatched orders`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Dispatched Orders"
        :active-filters="activeFilterEntries"
        :total-count="dispatchedOrders.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterCourier"
              label="Courier"
              :items="couriers"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              multiple
              chips
              closable-chips
              rounded="lg"
              class="mb-3"
            />
          </div>
        </template>
      </MpDataTableToolbar>
      <v-data-table :headers="headers" :items="dispatchedOrders" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.customerName="{ item }">{{ item.customer.name }}</template>
        <template v-slot:item.total="{ item }">${{ item.total }}</template>
        <template #no-data>
          <MpEmptyState
            icon="truck"
            :title="search || filterCourier.length ? 'No dispatched orders match your filters' : 'No dispatched orders'"
            :description="search || filterCourier.length ? 'Try a different search, courier, or date range.' : 'Orders appear here once they ship.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
