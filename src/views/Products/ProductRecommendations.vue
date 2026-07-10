<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

const search = ref('')
const { loading } = useInitialLoad()

const rules = [
  { name: 'Frequently Bought Together', placement: 'Cart Page', metric: '+12.5%', metricLabel: 'AOV', status: 'Active' },
  { name: 'Similar Items', placement: 'Product Detail Page', metric: '+8.2%', metricLabel: 'Conv.', status: 'Active' },
  { name: 'Recently Viewed', placement: 'Homepage & Global Footer', metric: '+3.1%', metricLabel: 'Pageviews', status: 'Active' },
]

const placementIcon: Record<string, string> = {
  'Cart Page': 'shopping-cart',
  'Product Detail Page': 'package',
  'Homepage & Global Footer': 'layout-grid',
}

const headers = [
  { title: 'Logic / Rule Name', key: 'name', sortable: true },
  { title: 'Placement', key: 'placement' },
  { title: 'Performance Lift', key: 'metric', align: 'end' as const },
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
function removeFilter(key: string) { filters.value[key as keyof typeof filters.value] = [] }
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

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="text-body-2">
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

      <MpTableSkeleton v-if="loading" :rows="3" :columns="5" />

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredRules"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>

        <template v-slot:item.placement="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="16" color="medium-emphasis">{{ placementIcon[item.placement] ?? 'map-pin' }}</v-icon>
            <span class="text-body-2">{{ item.placement }}</span>
          </div>
        </template>

        <template v-slot:item.metric="{ item }">
          <v-chip size="small" variant="tonal" color="success" class="font-weight-bold" label>
            <v-icon start size="13">trending-up</v-icon>
            {{ item.metric }}
            <span class="text-medium-emphasis font-weight-regular ms-1">{{ item.metricLabel }}</span>
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>

        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" aria-label="Rule actions" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit Rule" />
              <v-list-item prepend-icon="toggle-left" title="Disable" />
            </v-list>
          </v-menu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="sparkles"
            :title="search ? 'No rules match your search' : 'No recommendation rules'"
            :description="search ? 'Try a different search term or clear your filters.' : 'Configure a rule to start placing personalised recommendations across your storefront.'"
            :action-label="search ? undefined : 'Configure Rules'"
            :action-icon="search ? undefined : 'plus'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
