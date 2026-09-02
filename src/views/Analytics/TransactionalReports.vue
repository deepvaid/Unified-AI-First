<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useAnalyticsStore()
const { transactionalReports } = storeToRefs(store)
const toast = useToast()
const search = ref('')
const filterType = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

const headers = [
  { title: 'Transactional Event', key: 'event', sortable: true },
  { title: 'Type', key: 'type', hideBelow: 'md' as const },
  { title: 'Trigger Date', key: 'triggerDate', hideBelow: 'lg' as const },
  { title: 'Sent', key: 'sent', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Delivery Rate', key: 'deliveryRate', align: 'end' as const },
]

// Identity + headline metric always show; supporting columns drop out
// progressively so the table never side-scrolls on a phone.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

const types = ['Order', 'Shipping', 'Account', 'Payment']
// The one filter this report has, so it lives in the toolbar as a pill rather
// than behind a drawer.
const filterTypeQuickFilter = {
  key: 'type',
  label: 'Type',
  options: (types).map((v) => ({ label: v, value: v })),
}


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
      isWithinRange(r.triggerDate, dateRange.value) &&
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
  toast.success(`Exported ${filteredReports.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional Email Reports"
      :subtitle="`${filteredReports.length} transactional flows`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterType"
        :quick-filter="filterTypeQuickFilter"
        v-model:search="search"
        title="Transactional Events"
        :active-filters="activeFilterEntries"
        :total-count="filteredReports.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredReports" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.sent="{ item }">{{ item.sent.toLocaleString() }}</template>
        <template v-slot:item.deliveryRate="{ item }">
          <span class="font-weight-medium">{{ item.deliveryRate }}%</span>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="mail-check"
            :title="search || filterType.length ? 'No events match your filters' : 'No transactional events in this range'"
            :description="search || filterType.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
