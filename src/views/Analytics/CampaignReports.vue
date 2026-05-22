<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const store = useCampaignsStore()
const search = ref('')
const filterStatus = ref<string[]>([])

const headers = [
  { title: 'Campaign Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate' },
  { title: 'Sent', key: 'metrics.sent', align: 'end' as const },
  { title: 'Opens', key: 'metrics.opens', align: 'end' as const },
  { title: 'Clicks', key: 'metrics.clicks', align: 'end' as const },
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

const filteredCampaigns = computed(() =>
  store.campaigns.filter(c => filterStatus.value.length === 0 || filterStatus.value.includes(c.status))
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Campaign Reports"
      :subtitle="`${store.campaigns.length} campaigns`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Campaigns"
        :active-filters="activeFilterEntries"
        :total-count="filteredCampaigns.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterStatus"
              label="Status"
              :items="['Sent', 'Draft', 'Scheduled']"
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
      <v-data-table :headers="headers" :items="filteredCampaigns" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="campaign" size="x-small" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="bar-chart-2"
            :title="search || filterStatus.length ? 'No campaigns match your filters' : 'No campaigns yet'"
            :description="search || filterStatus.length ? 'Try a different search or clear filters.' : 'Campaigns will appear here once sent.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
