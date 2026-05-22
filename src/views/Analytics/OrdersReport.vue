<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const store = useCommerceStore()
const search = ref('')
const filterStatus = ref<string[]>([])

const headers = [
  { title: 'Order Number', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customerName' },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Date', key: 'date' },
]

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
  store.orders.filter(o => filterStatus.value.length === 0 || (o.status != null && filterStatus.value.includes(o.status)))
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales by Order"
      :subtitle="`${store.orders.length} orders`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Order Analytics"
        :active-filters="activeFilterEntries"
        :total-count="filteredOrders.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterStatus"
              label="Status"
              :items="['Completed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']"
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
      <v-data-table :headers="headers" :items="filteredOrders" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="order" size="x-small" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="shopping-bag"
            :title="search || filterStatus.length ? 'No orders match your filters' : 'No orders yet'"
            :description="search || filterStatus.length ? 'Try a different search or clear filters.' : 'Orders will appear here once received.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
