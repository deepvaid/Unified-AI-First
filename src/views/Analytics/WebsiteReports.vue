<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore, dateRangeLabel, type DateRangeValue } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'

const store = useAnalyticsStore()
const { websiteReports } = storeToRefs(store)
const search = ref('')
const filterCategory = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

const snackbar = ref(false)
const snackbarText = ref('')

const headers = [
  { title: 'Page Path', key: 'path', sortable: true },
  { title: 'Category', key: 'category' },
  { title: 'Pageviews', key: 'views', align: 'end' as const },
  { title: 'Unique Visitors', key: 'visitors', align: 'end' as const },
  { title: 'Avg. Time on Page', key: 'avgTime' },
]

const categories = ['Landing', 'Product', 'Checkout', 'Content']

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterCategory.value.length > 0) filters.push({ key: 'category', label: `Category: ${filterCategory.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterCategory.value = []
}

function clearAllFilters() {
  filterCategory.value = []
}

// Page rows are aggregate totals (no per-row date), so the range acts as a
// labelled reporting-window control that annotates the header.
const filteredReports = computed(() =>
  websiteReports.value.filter(r => filterCategory.value.length === 0 || filterCategory.value.includes(r.category))
)

function exportCsv() {
  downloadCsv('website-reports', filteredReports.value, [
    { title: 'Page Path', value: 'path' },
    { title: 'Category', value: 'category' },
    { title: 'Pageviews', value: 'views' },
    { title: 'Unique Visitors', value: 'visitors' },
    { title: 'Avg. Time on Page', value: 'avgTime' },
  ])
  snackbarText.value = `Exported ${filteredReports.value.length} rows`
  snackbar.value = true
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Website Reports"
      subtitle="Page-level traffic and engagement analytics"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        :title="`Page Analytics · ${dateRangeLabel(dateRange)}`"
        :active-filters="activeFilterEntries"
        :total-count="filteredReports.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filterCategory"
              label="Category"
              :items="categories"
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
        <template v-slot:item.views="{ item }">
          <span class="font-weight-medium">{{ item.views.toLocaleString() }}</span>
        </template>
        <template v-slot:item.visitors="{ item }">
          <span class="font-weight-medium">{{ item.visitors.toLocaleString() }}</span>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="globe"
            :title="search || filterCategory.length ? 'No pages match your filters' : 'No website data'"
            :description="search || filterCategory.length ? 'Try a different search or clear filters.' : 'Page traffic will appear here once tracking is live.'"
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
