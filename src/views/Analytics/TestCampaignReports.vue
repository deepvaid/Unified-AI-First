<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, dateRangePresets, isWithinPreset, type DateRangePreset } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { downloadCsv } from '@/utils/exportCsv'

const store = useAnalyticsStore()
const { testCampaignReports } = storeToRefs(store)
const search = ref('')
const filterProvider = ref<string[]>([])
const dateRange = ref<DateRangePreset>('Last 30 days')

const snackbar = ref(false)
const snackbarText = ref('')

const headers = [
  { title: 'Test Scenario', key: 'scenario', sortable: true },
  { title: 'Provider', key: 'provider' },
  { title: 'Date Scheduled', key: 'scheduledDate' },
  { title: 'Inbox Placement', key: 'placement', align: 'end' as const },
  { title: 'Spam Score', key: 'spamScore', align: 'end' as const },
]

const providers = ['Gmail', 'Outlook', 'Yahoo', 'Apple Mail']

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterProvider.value.length > 0) filters.push({ key: 'provider', label: `Provider: ${filterProvider.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterProvider.value = []
}

function clearAllFilters() {
  filterProvider.value = []
}

const filteredReports = computed(() =>
  testCampaignReports.value.filter(
    (r) =>
      isWithinPreset(r.scheduledDate, dateRange.value) &&
      (filterProvider.value.length === 0 || filterProvider.value.includes(r.provider)),
  ),
)

function exportCsv() {
  downloadCsv('test-campaign-reports', filteredReports.value, [
    { title: 'Test Scenario', value: 'scenario' },
    { title: 'Provider', value: 'provider' },
    { title: 'Date Scheduled', value: 'scheduledDate' },
    { title: 'Inbox Placement', value: (r) => `${r.placement}%` },
    { title: 'Spam Score', value: 'spamScore' },
  ])
  snackbarText.value = `Exported ${filteredReports.value.length} rows`
  snackbar.value = true
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Test Campaign Reports"
      :subtitle="`${filteredReports.length} test scenarios`"
    >
      <template #actions>
        <v-select
          v-model="dateRange"
          :items="dateRangePresets"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          prepend-inner-icon="calendar-range"
          class="mp-range-select"
        />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Test Reports"
        :active-filters="activeFilterEntries"
        :total-count="filteredReports.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterProvider"
              label="Provider"
              :items="providers"
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
      <v-data-table :headers="headers" :items="filteredReports" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.placement="{ item }">
          <span class="font-weight-medium">{{ item.placement }}%</span>
        </template>
        <template v-slot:item.spamScore="{ item }">{{ item.spamScore.toFixed(1) }}</template>
        <template #no-data>
          <MpEmptyState
            icon="mail-search"
            :title="search || filterProvider.length ? 'No test scenarios match your filters' : 'No test scenarios in this range'"
            :description="search || filterProvider.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.mp-range-select {
  max-width: 190px;
}
</style>
