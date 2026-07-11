<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, dateRangePresets, isWithinPreset, type DateRangePreset } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { downloadCsv } from '@/utils/exportCsv'

const store = useAnalyticsStore()
const { transactionalReports } = storeToRefs(store)
const search = ref('')
const filterType = ref<string[]>([])
const dateRange = ref<DateRangePreset>('Last 30 days')

const snackbar = ref(false)
const snackbarText = ref('')

const headers = [
  { title: 'Transactional Event', key: 'event', sortable: true },
  { title: 'Type', key: 'type' },
  { title: 'Trigger Date', key: 'triggerDate' },
  { title: 'Sent', key: 'sent', align: 'end' as const },
  { title: 'Delivery Rate', key: 'deliveryRate', align: 'end' as const },
]

const types = ['Order', 'Shipping', 'Account', 'Payment']

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterType.value.length > 0) filters.push({ key: 'type', label: `Type: ${filterType.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterType.value = []
}

function clearAllFilters() {
  filterType.value = []
}

const filteredReports = computed(() =>
  transactionalReports.value.filter(
    (r) =>
      isWithinPreset(r.triggerDate, dateRange.value) &&
      (filterType.value.length === 0 || filterType.value.includes(r.type)),
  ),
)

function exportCsv() {
  downloadCsv('transactional-reports', filteredReports.value, [
    { title: 'Transactional Event', value: 'event' },
    { title: 'Type', value: 'type' },
    { title: 'Trigger Date', value: 'triggerDate' },
    { title: 'Sent', value: 'sent' },
    { title: 'Delivery Rate', value: (r) => `${r.deliveryRate}%` },
  ])
  snackbarText.value = `Exported ${filteredReports.value.length} rows`
  snackbar.value = true
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional Email Reports"
      :subtitle="`${filteredReports.length} transactional flows`"
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
        title="Transactional Events"
        :active-filters="activeFilterEntries"
        :total-count="filteredReports.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterType"
              label="Type"
              :items="types"
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
        <template v-slot:item.sent="{ item }">{{ item.sent.toLocaleString() }}</template>
        <template v-slot:item.deliveryRate="{ item }">
          <span class="font-weight-medium">{{ item.deliveryRate }}%</span>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="mail-check"
            :title="search || filterType.length ? 'No events match your filters' : 'No transactional events in this range'"
            :description="search || filterType.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
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
