<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const rules = [
  { name: 'Frequently Bought Together', placement: 'Cart Page', performance: '+12.5% AOV', status: 'Active' },
  { name: 'Similar Items', placement: 'Product Detail Page', performance: '+8.2% Conv.', status: 'Active' },
  { name: 'Recently Viewed', placement: 'Homepage & Global Footer', performance: '+3.1% Pageviews', status: 'Active' },
]

const headers = [
  { title: 'Logic / Rule Name', key: 'name', sortable: true },
  { title: 'Placement', key: 'placement' },
  { title: 'Performance Lift', key: 'performance' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const filters = ref({
  status: [] as string[],
  placement: [] as string[],
})
const filterLabels = { status: 'Status', placement: 'Placement' }
const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({ key, label: `${filterLabels[key as keyof typeof filterLabels]}: ${(value as string[]).join(', ')}` }))
)
function removeFilter(key: string) { ;(filters.value as any)[key] = [] }
function clearAllFilters() { filters.value = { status: [], placement: [] } }
const filteredRules = computed(() => {
  let r = rules
  if (filters.value.status.length) r = r.filter(x => filters.value.status.includes(x.status))
  if (filters.value.placement.length) r = r.filter(x => filters.value.placement.includes(x.placement))
  return r
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Product Recommendations"
      :subtitle="`${rules.length} active recommendation rules`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Configure Rules</v-btn>
      </template>
    </MpPageHeader>

    <v-alert type="info" variant="tonal" rounded="xl" density="compact" class="text-body-2">
      AI-powered recommendation engine automatically places products based on user browsing habits and cohort data.
    </v-alert>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Recommendation Rules"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <v-select
            v-model="filters.status"
            :items="['Active', 'Paused']"
            :label="filterLabels.status"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="filters.placement"
            :items="['Cart Page', 'Product Detail Page', 'Homepage & Global Footer']"
            :label="filterLabels.placement"
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
        :items="filteredRules"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.status="{ item }">
          <v-chip color="success" size="small" variant="tonal">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit Rule" />
              <v-list-item prepend-icon="toggle-left" title="Disable" />
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
