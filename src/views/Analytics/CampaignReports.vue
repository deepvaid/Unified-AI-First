<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { downloadCsv } from '@/utils/exportCsv'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useCampaignsStore()
const toast = useToast()
const search = ref('')
const filterStatus = ref<string[]>([])

// The one filter this report has, so it lives in the toolbar as a pill rather
// than behind a drawer.
const filterStatusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: (['Sent', 'Draft', 'Scheduled']).map((v) => ({ label: v, value: v })),
}
const dateRange = ref<DateRangeValue>({ preset: 'This year' })

const headers = [
  { title: 'Campaign Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate', hideBelow: 'lg' as const },
  { title: 'Sent', key: 'metrics.sent', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Opens', key: 'metrics.opens', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Clicks', key: 'metrics.clicks', align: 'end' as const, hideBelow: 'md' as const },
]

// Identity + headline metric always show; supporting columns drop out
// progressively so the table never side-scrolls on a phone.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

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
  store.campaigns.filter(
    (c) =>
      isWithinRange(c.sentDate, dateRange.value) &&
      (filterStatus.value.length === 0 || filterStatus.value.includes(c.status)),
  ),
)

function exportCsv() {
  downloadCsv('campaign-reports', filteredCampaigns.value, [
    { title: 'Campaign Name', value: 'name' },
    { title: 'Status', value: 'status' },
    { title: 'Sent Date', value: (c) => c.sentDate ?? '' },
    { title: 'Sent', value: (c) => c.metrics.sent },
    { title: 'Opens', value: (c) => c.metrics.opens },
    { title: 'Clicks', value: (c) => c.metrics.clicks },
  ])
  toast.success(`Exported ${filteredCampaigns.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Campaign Reports"
      :subtitle="`${store.campaigns.length} campaigns`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterStatus"
        :quick-filter="filterStatusQuickFilter"
        v-model:search="search"
        title="All Campaigns"
        :active-filters="activeFilterEntries"
        :total-count="filteredCampaigns.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="6" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredCampaigns" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="campaign" size="sm" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="bar-chart-2"
            :title="search || filterStatus.length ? 'No campaigns match your filters' : 'No campaigns in this range'"
            :description="search || filterStatus.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
