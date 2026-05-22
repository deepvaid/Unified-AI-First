<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCampaignsStore()
const search = ref('')
const filterWinner = ref<string[]>([])

const headers = [
  { title: 'Test Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Winning Variant', key: 'winner' },
  { title: 'Lift', key: 'lift' },
]

const abTests = store.campaigns.slice(10, 20).map(c => ({
  ...c,
  name: `${c.name} - A/B Test`,
  winner: ['Variant A', 'Variant B'][Math.floor(Math.random() * 2)],
  lift: `+${(Math.random() * 10 + 1).toFixed(1)}%`
}))

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterWinner.value.length > 0) filters.push({ key: 'winner', label: `Winner: ${filterWinner.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterWinner.value = []
}

function clearAllFilters() {
  filterWinner.value = []
}

const filteredTests = computed(() =>
  abTests.filter(t => filterWinner.value.length === 0 || (t.winner != null && filterWinner.value.includes(t.winner)))
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="A/B Campaign Reports"
      :subtitle="`${abTests.length} A/B tests`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="A/B Tests"
        :active-filters="activeFilterEntries"
        :total-count="filteredTests.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterWinner"
              label="Winning Variant"
              :items="['Variant A', 'Variant B']"
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
      <v-data-table :headers="headers" :items="filteredTests" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.winner="{ item }">
          <span class="font-weight-bold text-primary">{{ item.winner }}</span>
        </template>
        <template v-slot:item.lift="{ item }">
          <span class="text-success font-weight-medium">{{ item.lift }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
