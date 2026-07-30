<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { dateRangeLabel, type DateRangeValue } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'

const store = useCampaignsStore()
const toast = useToast()
const search = ref('')
const filterStatus = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'This year' })

const headers = [
  { title: 'Journey Name', key: 'name', sortable: true },
  { title: 'Active Contacts', key: 'activeContacts', align: 'end' as const },
  { title: 'Status', key: 'status' },
]

// Contacts still progressing through the journey (enrolled minus completed).
const activeContacts = (j: { enrolled: number; completed: number }) => j.enrolled - j.completed

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

// Journeys are ongoing entities rather than dated events, so the range acts as a
// labelled reporting-window control (annotates the header) instead of filtering rows.
const filteredJourneys = computed(() =>
  store.journeys.filter(j => filterStatus.value.length === 0 || filterStatus.value.includes(j.status))
)

function exportCsv() {
  downloadCsv('journey-reports', filteredJourneys.value, [
    { title: 'Journey Name', value: 'name' },
    { title: 'Active Contacts', value: (j) => activeContacts(j) },
    { title: 'Status', value: 'status' },
  ])
  toast.success(`Exported ${filteredJourneys.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Journey Reports"
      :subtitle="`${store.journeys.length} journeys`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        :title="`All Journeys · ${dateRangeLabel(dateRange)}`"
        :active-filters="activeFilterEntries"
        :total-count="filteredJourneys.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterStatus"
              label="Status"
              :items="['Active', 'Paused', 'Draft']"
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
      <v-data-table :headers="headers" :items="filteredJourneys" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.activeContacts="{ item }">{{ activeContacts(item).toLocaleString() }}</template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="x-small" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="waypoints"
            :title="search || filterStatus.length ? 'No journeys match your filters' : 'No journeys yet'"
            :description="search || filterStatus.length ? 'Try a different search or clear filters.' : 'Journeys will appear here once created.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
