<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const items = [
  { id: 'RES-001', product: 'Premium Item 5', qty: 2, holdsUntil: '2026-03-07T18:00:00Z', status: 'Active Hold' },
  { id: 'RES-002', product: 'Premium Item 12', qty: 1, holdsUntil: '2026-03-08T12:30:00Z', status: 'Active Hold' },
  { id: 'RES-003', product: 'Premium Item 2', qty: 5, holdsUntil: '2026-03-07T08:00:00Z', status: 'Expired' },
]

const headers = [
  { title: 'Hold ID', key: 'id', sortable: true },
  { title: 'Product', key: 'product' },
  { title: 'Qty Held', key: 'qty', align: 'end' as const },
  { title: 'Held Until (Expiry)', key: 'holdsUntil' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const filters = ref({ status: [] as string[] })
const filterLabels = { status: 'Status' }
const activeFilterEntries = computed(() =>
  filters.value.status.length > 0
    ? [{ key: 'status', label: `Status: ${filters.value.status.join(', ')}` }]
    : []
)
function removeFilter(_key: string) { filters.value.status = [] }
function clearAllFilters() { filters.value.status = [] }
const filteredItems = computed(() =>
  filters.value.status.length ? items.filter(i => filters.value.status.includes(i.status)) : items
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Inventory Reservations"
      :subtitle="`${items.filter(i => i.status === 'Active Hold').length} active holds`"
    />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Reservations"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <v-select
            v-model="filters.status"
            :items="['Active Hold', 'Expired']"
            :label="filterLabels.status"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.product="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id + 200}/32/32`"
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
            <div class="text-body-2 font-weight-medium">{{ item.product }}</div>
          </div>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Active Hold' ? 'warning' : 'default'" size="small" variant="tonal">
            {{ item.status }}
          </v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="circle-x" title="Release Hold" />
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
