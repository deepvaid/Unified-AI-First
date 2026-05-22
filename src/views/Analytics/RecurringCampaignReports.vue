<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCampaignsStore()
const search = ref('')
const filterFrequency = ref<string[]>([])

const headers = [
  { title: 'Recurring Campaign Name', key: 'name', sortable: true },
  { title: 'Frequency', key: 'frequency' },
  { title: 'Next Run', key: 'nextRun' },
  { title: 'Avg Opens', key: 'metrics.opens', align: 'end' as const },
]

const recurringItems = store.campaigns.slice(0, 10).map(c => ({
  ...c,
  frequency: ['Daily', 'Weekly', 'Monthly'][Math.floor(Math.random() * 3)],
  nextRun: new Date(Date.now() + Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
}))

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterFrequency.value.length > 0) filters.push({ key: 'frequency', label: `Frequency: ${filterFrequency.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterFrequency.value = []
}

function clearAllFilters() {
  filterFrequency.value = []
}

const filteredItems = computed(() =>
  recurringItems.filter(r => filterFrequency.value.length === 0 || (r.frequency != null && filterFrequency.value.includes(r.frequency)))
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Recurring Campaign Reports"
      :subtitle="`${recurringItems.length} recurring campaigns`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Recurring Campaigns"
        :active-filters="activeFilterEntries"
        :total-count="filteredItems.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterFrequency"
              label="Frequency"
              :items="['Daily', 'Weekly', 'Monthly']"
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
      <v-data-table :headers="headers" :items="filteredItems" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1" />
    </v-card>
  </div>
</template>
