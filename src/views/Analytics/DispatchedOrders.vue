<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCommerceStore()
const search = ref('')
const filterStatus = ref<string[]>([])

const headers = [
  { title: 'Order Number', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customerName' },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Date', key: 'date' },
]

const dispatchedOrders = computed(() =>
  store.orders.filter(o => (o.status === 'Shipped' || o.status === 'Delivered') &&
    (filterStatus.value.length === 0 || filterStatus.value.includes(o.status)))
)

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
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dispatched Orders"
      :subtitle="`${dispatchedOrders.length} dispatched orders`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
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
              v-model="filterStatus"
              label="Status"
              :items="['Shipped', 'Delivered']"
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
      <v-data-table :headers="headers" :items="dispatchedOrders" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1" />
    </v-card>
  </div>
</template>
