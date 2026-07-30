<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, dateRangeLabel, type DateRangeValue } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useAnalyticsStore()
const toast = useToast()
const search = ref('')
const dateRange = ref<DateRangeValue>({ preset: 'This year' })
const { loading } = useInitialLoad()

// Date + Revenue are the identity/headline pair and always show; the three
// supporting metrics drop out on narrower viewports so the table never
// side-scrolls on a phone.
const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Total Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Orders Placed', key: 'orders', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Active Subscribers', key: 'subscribers', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Campaign Sends', key: 'sends', align: 'end' as const, hideBelow: 'md' as const },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

// Monthly rows are keyed by month name (not a full date), so the range acts as a
// labelled control that annotates the period rather than filtering rows.
const rows = computed(() => store.chartData)

function exportCsv() {
  downloadCsv('monthly-totals', rows.value, [
    { title: 'Date', value: 'date' },
    { title: 'Total Revenue', value: 'revenue' },
    { title: 'Orders Placed', value: 'orders' },
    { title: 'Active Subscribers', value: 'subscribers' },
    { title: 'Campaign Sends', value: 'sends' },
  ])
  toast.success(`Exported ${rows.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Monthly Analytics"
      subtitle="High-level overview of revenue and audience growth over time."
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        :title="`Historical Performance · ${dateRangeLabel(dateRange)}`"
        :total-count="rows.length"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table
        v-else
        :headers="visibleHeaders"
        :items="rows"
        :search="search"
        hover
        density="comfortable"
        :items-per-page="12"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.revenue="{ item }">
          <span class="font-weight-bold text-primary">${{ item.revenue.toLocaleString() }}</span>
        </template>
        <template v-slot:item.subscribers="{ item }">
          <span class="font-weight-medium">{{ item.subscribers.toLocaleString() }}</span>
        </template>
        <template v-slot:item.sends="{ item }">
          <span class="text-medium-emphasis">{{ item.sends.toLocaleString() }}</span>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="calendar-range"
            :title="search ? 'No months match your search' : 'No monthly data yet'"
            :description="search ? 'Try a different search term.' : 'Revenue and audience totals will appear here over time.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
