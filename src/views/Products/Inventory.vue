<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

const store = useCommerceStore()
const search = ref('')
const { loading } = useInitialLoad()

const inventoryItems = store.products.map(p => ({
  ...p,
  incoming: Math.floor(Math.random() * 500),
  location: ['Main Warehouse - FL', 'Secondary Node - CA', 'Retail Hub - TX'][Math.floor(Math.random() * 3)]
}))

// KPI breakdown — computed from actual stock data (display only)
const totalUnits = inventoryItems.reduce((sum, i) => sum + (i.inventory ?? 0), 0)
const kpis = computed(() => [
  { label: 'Total Units', value: totalUnits.toLocaleString(), icon: 'library', color: 'primary' },
  { label: 'In Stock', value: inventoryItems.filter(i => i.status === 'In Stock').length, icon: 'circle-check', color: 'success' },
  { label: 'Low Stock', value: inventoryItems.filter(i => i.status === 'Low Stock').length, icon: 'alert-triangle', color: 'warning' },
  { label: 'Out of Stock', value: inventoryItems.filter(i => i.status === 'Out of Stock').length, icon: 'circle-x', color: 'error' },
])

// Multi-select filters
const filters = ref({
  location: [] as string[],
  status: [] as string[],
})

const filterOptions = {
  location: ['Main Warehouse - FL', 'Secondary Node - CA', 'Retail Hub - TX'],
  status: ['In Stock', 'Low Stock', 'Out of Stock'],
}

const filterLabels: Record<string, string> = {
  location: 'Location',
  status: 'Status',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({
      key,
      label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
    }))
)

function removeFilter(key: string) {
  ;(filters.value as any)[key] = []
}

function clearAllFilters() {
  filters.value = { location: [], status: [] }
}

const filteredInventory = computed(() => {
  let items = inventoryItems
  if (filters.value.location.length) items = items.filter(p => p.location != null && filters.value.location.includes(p.location))
  if (filters.value.status.length) items = items.filter(p => p.status != null && filters.value.status.includes(p.status))
  return items
})

const headers = [
  { title: 'Product', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Avail. Inventory', key: 'inventory', align: 'end' as const, sortable: true },
  { title: 'On Order / Incoming', key: 'incoming', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Location', key: 'location' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Inventory"
      :subtitle="`${inventoryItems.length} SKUs across ${filterOptions.location.length} locations`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
      </template>
    </MpPageHeader>

    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <v-card variant="flat" border rounded="lg" class="h-100">
          <v-card-text class="d-flex align-center justify-space-between py-4">
            <div>
              <div class="text-overline text-medium-emphasis">{{ kpi.label }}</div>
              <div class="text-h4 font-weight-bold" :class="`text-${kpi.color}`">{{ kpi.value }}</div>
            </div>
            <v-icon size="36" :color="kpi.color" opacity="0.3">{{ kpi.icon }}</v-icon>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        title="Inventory Items"
        v-model:search="search"
        :active-filters="activeFilterEntries"
        :total-count="filteredInventory.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.location"
              :items="filterOptions.location"
              label="Location"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              rounded="lg"
              hide-details
              class="mb-3"
            />
            <v-select
              v-model="filters.status"
              :items="filterOptions.status"
              label="Status"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              rounded="lg"
              hide-details
              class="mb-2"
            />
          </div>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredInventory"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id}/32/32`"
              :width="32"
              :height="32"
              cover
              rounded="md"
              class="flex-shrink-0 border"
              style="width:32px;height:32px;min-width:32px;max-width:32px"
            >
              <template #error>
                <div class="w-100 h-100 d-flex align-center justify-center bg-surface-variant rounded-md">
                  <v-icon size="16" color="medium-emphasis">image</v-icon>
                </div>
              </template>
            </v-img>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.inventory="{ item }">
          <span :class="item.inventory === 0 ? 'text-error font-weight-bold' : item.inventory < 20 ? 'text-warning font-weight-bold' : 'font-weight-medium'" style="font-variant-numeric: tabular-nums">{{ item.inventory }}</span>
        </template>

        <template v-slot:item.incoming="{ item }">
          <span v-if="item.incoming > 0" class="text-medium-emphasis" style="font-variant-numeric: tabular-nums">
            <v-icon size="13" class="me-1" color="info">truck</v-icon>{{ item.incoming }}
          </span>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="stock" show-icon />
        </template>

        <template v-slot:item.location="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="15" color="medium-emphasis">map-pin</v-icon>
            <span class="text-body-2">{{ item.location }}</span>
          </div>
        </template>

        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" aria-label="Inventory item actions" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Adjust Stock" />
              <v-list-item prepend-icon="arrow-left-right" title="Transfer" />
            </v-list>
          </v-menu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="package"
            :title="search ? 'No items match your search' : 'No inventory items'"
            :description="search ? 'Try a different search term or clear your filters.' : 'Your product inventory will appear here once products are added to your store.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
