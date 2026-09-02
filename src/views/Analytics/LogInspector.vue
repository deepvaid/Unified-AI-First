<script setup lang="ts">
import { ref, computed } from 'vue'
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

const toast = useToast()
const search = ref('')
const filterLevel = ref<string[]>([])

// The one filter this report has, so it lives in the toolbar as a pill rather
// than behind a drawer.
const filterLevelQuickFilter = {
  key: 'level',
  label: 'Log Level',
  options: (['INFO', 'WARNING', 'ERROR']).map((v) => ({ label: v, value: v })),
}
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

const headers = [
  { title: 'Timestamp', key: 'time', sortable: true, hideBelow: 'sm' as const },
  { title: 'Level', key: 'level' },
  { title: 'Message', key: 'message' },
]

// For a log, Level + Message are the content, so those always show and the
// timestamp is what drops on a phone — the inverse of the report tables, where
// the leading identity column stays.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

const logs = Array.from({ length: 50 }, (_, i) => ({
  time: new Date(Date.now() - i * 60000).toISOString(),
  level: ['INFO', 'WARNING', 'ERROR'][Math.floor(Math.random() * 3)],
  message: `System service execution log entry #${i + 1000}`
}))

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterLevel.value.length > 0) filters.push({ key: 'level', label: `Level: ${filterLevel.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterLevel.value = []
}

function clearAllFilters() {
  filterLevel.value = []
}

const filteredLogs = computed(() =>
  logs.filter(
    (l) =>
      isWithinRange(l.time, dateRange.value) &&
      (filterLevel.value.length === 0 || (l.level != null && filterLevel.value.includes(l.level))),
  ),
)

function exportCsv() {
  downloadCsv('log-inspector', filteredLogs.value, [
    { title: 'Timestamp', value: 'time' },
    { title: 'Level', value: (l) => l.level ?? '' },
    { title: 'Message', value: 'message' },
  ])
  toast.success(`Exported ${filteredLogs.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Log Inspector"
      subtitle="System service execution logs"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export Logs</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterLevel"
        :quick-filter="filterLevelQuickFilter"
        v-model:search="search"
        title="System Logs"
        :active-filters="activeFilterEntries"
        :total-count="filteredLogs.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="3" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredLogs" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.level="{ item }">
          <MpStatusChip :status="item.level ?? ''" type="general" size="sm" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="scroll-text"
            :title="search || filterLevel.length ? 'No log entries match your filters' : 'No log entries in this range'"
            :description="search || filterLevel.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
