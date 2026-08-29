<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { downloadCsv } from '@/utils/exportCsv'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useCampaignsStore()
const toast = useToast()
const search = ref('')
const filterFrequency = ref<string[]>([])

// The one filter this report has, so it lives in the toolbar as a pill rather
// than behind a drawer.
const filterFrequencyQuickFilter = {
  key: 'frequency',
  label: 'Frequency',
  options: (['Daily', 'Weekly', 'Monthly']).map((v) => ({ label: v, value: v })),
}
const dateRange = ref<DateRangeValue>({ preset: 'This year' })

const headers = [
  { title: 'Recurring Campaign Name', key: 'name', sortable: true },
  { title: 'Frequency', key: 'frequency' },
  { title: 'Next Run', key: 'nextRun', hideBelow: 'md' as const },
  { title: 'Avg Opens', key: 'metrics.opens', align: 'end' as const, hideBelow: 'sm' as const },
]

// Identity + headline metric always show; supporting columns drop out
// progressively so the table never side-scrolls on a phone.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

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
  recurringItems.filter(
    (r) =>
      isWithinRange(r.sentDate, dateRange.value) &&
      (filterFrequency.value.length === 0 || (r.frequency != null && filterFrequency.value.includes(r.frequency))),
  ),
)

function exportCsv() {
  downloadCsv('recurring-campaign-reports', filteredItems.value, [
    { title: 'Recurring Campaign Name', value: 'name' },
    { title: 'Frequency', value: (r) => r.frequency ?? '' },
    { title: 'Next Run', value: 'nextRun' },
    { title: 'Avg Opens', value: (r) => r.metrics.opens },
  ])
  toast.success(`Exported ${filteredItems.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Recurring Campaign Reports"
      :subtitle="`${recurringItems.length} recurring campaigns`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterFrequency"
        :quick-filter="filterFrequencyQuickFilter"
        v-model:search="search"
        title="Recurring Campaigns"
        :active-filters="activeFilterEntries"
        :total-count="filteredItems.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="4" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredItems" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template #no-data>
          <MpEmptyState
            icon="repeat"
            :title="search || filterFrequency.length ? 'No recurring campaigns match your filters' : 'No recurring campaigns in this range'"
            :description="search || filterFrequency.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
