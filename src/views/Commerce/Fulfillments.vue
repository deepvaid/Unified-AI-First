<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])

const headers = [
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customer' },
  { title: 'Items', key: 'items', align: 'center' as const },
  { title: 'Weight', key: 'weight' },
  { title: 'Location', key: 'location' },
  { title: 'Priority', key: 'priority' },
  { title: 'Status', key: 'status' },
  { title: 'Date', key: 'date' },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
]

const priorityColor = (p: string | undefined): string =>
  p ? ({ 'High': 'error', 'Normal': 'info', 'Low': 'grey' } as Record<string, string>)[p] ?? 'default' : 'default'

// ─── Filters ──────────────────────────────────────────────────────────────────
const filters = ref({
  status: null as string | null,
  priority: null as string | null,
})

const filterOptions = {
  status: ['Awaiting Fulfillment', 'Picking', 'Packed', 'Ready to Ship', 'Shipped'],
  priority: ['High', 'Normal', 'Low'],
}

const filterLabels: Record<string, string> = {
  status: 'Status',
  priority: 'Priority',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  filters.value = { status: null, priority: null }
}

function selectAll() {
  selected.value = store.fulfillments.map((_: any, i: number) => i)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Fulfillment Queue"
      :subtitle="`${store.fulfillments.filter(f => f.status !== 'Shipped').length} orders awaiting fulfillment`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="printer" class="text-none" color="surface">Print Packing Slips</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="truck" class="text-none" :disabled="selected.length === 0">Mark Shipped{{ selected.length > 0 ? ` (${selected.length})` : '' }}</v-btn>
      </template>
    </MpPageHeader>

    <!-- Status Summary Chips -->
    <div class="d-flex gap-2 flex-wrap">
      <v-chip v-for="s in ['Awaiting Fulfillment', 'Picking', 'Packed', 'Ready to Ship', 'Shipped']" :key="s"
        variant="tonal" size="small" color="primary">
        {{ s }}: {{ store.fulfillments.filter(f => f.status === s).length }}
      </v-chip>
    </div>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Fulfillment Queue"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="store.fulfillments.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
        @clear-selection="selected = []"
        @select-all="selectAll"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div v-for="(options, key) in filterOptions" :key="key" class="mb-3">
              <v-select
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
        <template #bulk-actions>
          <v-btn size="small" variant="flat" color="success" class="text-none" prepend-icon="truck" rounded="lg">Mark Shipped</v-btn>
          <v-btn size="small" variant="flat" color="secondary" class="text-none" prepend-icon="printer" rounded="lg">Print Labels</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="store.fulfillments"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.orderNumber="{ item }">
          <span class="text-primary font-weight-bold cursor-pointer">{{ item.orderNumber }}</span>
        </template>

        <template v-slot:item.items="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-bold">{{ item.items }}</v-chip>
        </template>

        <template v-slot:item.priority="{ item }">
          <v-chip :color="priorityColor(item.priority)" size="x-small" variant="flat" class="font-weight-bold px-2">{{ item.priority }}</v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="fulfillment" size="small" />
        </template>

        <template v-slot:item.date="{ item }">
          <span class="text-medium-emphasis text-caption">{{ item.date }}</span>
        </template>

        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-btn icon="eye" variant="text" size="small" color="primary"></v-btn>
            <v-btn icon="truck" variant="text" size="small" color="success"></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="truck"
            title="No fulfillments found"
            description="Fulfillment orders will appear here once customers place orders."
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.ActionButtons { opacity: 0; transition: opacity 0.2s ease; }
tr:hover .ActionButtons { opacity: 1; }
</style>
