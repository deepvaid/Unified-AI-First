<script setup lang="ts">
import { ref, computed } from 'vue'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const search = ref('')
const filterLevel = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

const headers = [
  { title: 'Timestamp', key: 'time', sortable: true },
  { title: 'Level', key: 'level' },
  { title: 'Message', key: 'message' },
]

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
        v-model:search="search"
        title="System Logs"
        :active-filters="activeFilterEntries"
        :total-count="filteredLogs.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterLevel"
              label="Log Level"
              :items="['INFO', 'WARNING', 'ERROR']"
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
      <v-data-table :headers="headers" :items="filteredLogs" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.level="{ item }">
          <MpStatusChip :status="item.level ?? ''" type="general" size="x-small" />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="scroll-text"
            :title="search || filterLevel.length ? 'No log entries match your filters' : 'No log entries in this range'"
            :description="search || filterLevel.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
