<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { isWithinRange, type DateRangeValue } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useCampaignsStore()
const toast = useToast()
const search = ref('')
const filterWinner = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'This year' })

const headers = [
  { title: 'Test Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status', hideBelow: 'sm' as const },
  { title: 'Winning Variant', key: 'winner', hideBelow: 'md' as const },
  { title: 'Lift', key: 'lift' },
]

// Identity + headline metric always show; supporting columns drop out
// progressively so the table never side-scrolls on a phone.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

const abTests = store.campaigns.slice(10, 20).map(c => ({
  ...c,
  name: `${c.name} - A/B Test`,
  winner: ['Variant A', 'Variant B'][Math.floor(Math.random() * 2)],
  lift: `+${(Math.random() * 10 + 1).toFixed(1)}%`
}))

const activeFilterEntries = computed(() => {
  const filters: Array<{ key: string; label: string }> = []
  if (filterWinner.value.length > 0) filters.push({ key: 'winner', label: `Winner: ${filterWinner.value.join(', ')}` })
  return filters
})

function removeFilter(_key: string) {
  filterWinner.value = []
}

function clearAllFilters() {
  filterWinner.value = []
}

const filteredTests = computed(() =>
  abTests.filter(
    (t) =>
      isWithinRange(t.sentDate, dateRange.value) &&
      (filterWinner.value.length === 0 || (t.winner != null && filterWinner.value.includes(t.winner))),
  ),
)

function exportCsv() {
  downloadCsv('ab-campaign-reports', filteredTests.value, [
    { title: 'Test Name', value: 'name' },
    { title: 'Status', value: 'status' },
    { title: 'Winning Variant', value: (t) => t.winner ?? '' },
    { title: 'Lift', value: 'lift' },
  ])
  toast.success(`Exported ${filteredTests.value.length} rows`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="A/B Campaign Reports"
      :subtitle="`${abTests.length} A/B tests`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="A/B Tests"
        :active-filters="activeFilterEntries"
        :total-count="filteredTests.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <MpFormSection title="Filter by" />
          <MpFormGrid>
            <v-select
              v-model="filterWinner"
              label="Winning Variant"
              :items="['Variant A', 'Variant B']"
              clearable
              multiple
              chips
              closable-chips
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>
      <MpTableSkeleton v-if="loading" :rows="7" :columns="4" />

      <v-data-table v-else :headers="visibleHeaders" :items="filteredTests" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.winner="{ item }">
          <span class="font-weight-bold text-primary">{{ item.winner }}</span>
        </template>
        <template v-slot:item.lift="{ item }">
          <span class="text-success font-weight-medium">{{ item.lift }}</span>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="split"
            :title="search || filterWinner.length ? 'No A/B tests match your filters' : 'No A/B tests in this range'"
            :description="search || filterWinner.length ? 'Try a different search or clear filters.' : 'Try a wider date range.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
