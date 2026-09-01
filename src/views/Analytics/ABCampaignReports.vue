<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { isWithinRange, type DateRangeValue, useAnalyticsStore } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { formatCurrency } from '@/utils/formatCurrency'

// UAT parity: /accounts/:id/ab_reports — every A/B test with roll-up metrics;
// rows expand into variant child rows (A, B, final) and the name opens the
// comparison dashboard at /campaigns/:id/ab_report.
// UAT's two bare Start/End date fields are consolidated into the app's shared
// date-range control (IMPROVEMENTS.md).

const route = useRoute()
const store = useAnalyticsStore()
const accountId = computed(() => route.params.accountId as string)
const { loading } = useInitialLoad()

const search = ref('')
const expanded = ref<string[]>([])
const dateRange = ref<DateRangeValue>({ preset: 'This year' })

const filtered = computed(() =>
  store.abReports.filter(r => isWithinRange(r.sentAt ?? r.updatedAt, dateRange.value)),
)

const headers = [
  { title: '', key: 'data-table-expand', sortable: false, width: 48 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Contacts', key: 'contacts', align: 'end' as const },
  { title: 'Sent', key: 'sent', align: 'end' as const },
  { title: 'Delivered', key: 'delivered', align: 'end' as const },
  { title: 'Opens', key: 'opens', align: 'end' as const },
  { title: 'Clicks', key: 'clicks', align: 'end' as const },
  { title: 'Bounces', key: 'bounces', align: 'end' as const },
  { title: 'Total Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Sent At', key: 'sentAt' },
  { title: 'Updated At', key: 'updatedAt' },
]

// Variant child rows lazy-load in UAT (spinner in the expander cell).
const loadingIds = ref(new Set<number>())
const loadedIds = ref(new Set<number>())
watch(expanded, (ids) => {
  for (const id of ids.map(Number)) {
    if (loadedIds.value.has(id) || loadingIds.value.has(id)) continue
    loadingIds.value = new Set(loadingIds.value).add(id)
    setTimeout(() => {
      loadingIds.value = new Set([...loadingIds.value].filter(i => i !== id))
      loadedIds.value = new Set(loadedIds.value).add(id)
    }, 450)
  }
})

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
})

function dateTimeLabel(iso: string | null): string {
  if (!iso) return ''
  const parts = DATE_FMT.formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')}`
}

function detailLink(campaignId: number) {
  return { name: 'ABCampaignReportDetail', params: { accountId: accountId.value, id: campaignId } }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="A/B Campaign Reports"
      :subtitle="`${filtered.length} A/B tests`"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="A/B tests"
        search-placeholder="Search A/B tests"
        :total-count="filtered.length"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="8" />

      <v-data-table
        v-else
        v-model:expanded="expanded"
        :headers="headers"
        :items="filtered"
        :search="search"
        item-value="id"
        show-expand
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.data-table-expand="{ item, isExpanded, toggleExpand, internalItem }">
          <v-btn
            :icon="isExpanded(internalItem) ? 'chevron-down' : 'chevron-right'"
            variant="text"
            size="small"
            :aria-label="isExpanded(internalItem) ? `Collapse variants of ${item.name}` : `Expand variants of ${item.name}`"
            :aria-expanded="isExpanded(internalItem) ? 'true' : 'false'"
            @click="toggleExpand(internalItem)"
          />
        </template>

        <template #item.name="{ item }">
          <router-link :to="detailLink(item.campaignId)" class="report-link">{{ item.name }}</router-link>
        </template>
        <template #item.contacts="{ item }">{{ item.contacts.toLocaleString() }}</template>
        <template #item.sent="{ item }">{{ item.sent.toLocaleString() }}</template>
        <template #item.delivered="{ item }">{{ item.delivered.toLocaleString() }}</template>
        <template #item.opens="{ item }">{{ item.opens.toLocaleString() }}</template>
        <template #item.clicks="{ item }">{{ item.clicks.toLocaleString() }}</template>
        <template #item.bounces="{ item }">{{ item.bounces.toLocaleString() }}</template>
        <template #item.revenue="{ item }">{{ formatCurrency(item.revenue) }}</template>
        <template #item.sentAt="{ item }">{{ dateTimeLabel(item.sentAt) }}</template>
        <template #item.updatedAt="{ item }">{{ dateTimeLabel(item.updatedAt) }}</template>

        <template #expanded-row="{ columns, item }">
          <tr v-if="!loadedIds.has(item.id)">
            <td :colspan="columns.length" class="text-center py-3">
              <v-progress-circular indeterminate size="20" width="2" color="primary" aria-label="Loading variants" />
            </td>
          </tr>
          <tr v-for="v in loadedIds.has(item.id) ? item.variants : []" :key="v.id" class="variant-row">
            <td />
            <td>
              <span class="variant-marker" aria-hidden="true">↳</span>
              <router-link :to="detailLink(item.campaignId)" class="report-link">{{ v.name }}</router-link>
            </td>
            <td class="text-end">{{ v.overview.contactsCount.toLocaleString() }}</td>
            <td class="text-end">{{ v.totalSent.toLocaleString() }}</td>
            <td class="text-end">{{ v.metrics.delivered.count.toLocaleString() }}</td>
            <td class="text-end">{{ v.metrics.totalOpens.count.toLocaleString() }}</td>
            <td class="text-end">{{ v.metrics.totalClicks.count.toLocaleString() }}</td>
            <td class="text-end">{{ v.metrics.bounced.count.toLocaleString() }}</td>
            <td class="text-end">{{ formatCurrency(v.overview.totalRevenue) }}</td>
            <td>{{ dateTimeLabel(v.sentAt) }}</td>
            <td>{{ dateTimeLabel(item.updatedAt) }}</td>
          </tr>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="split"
            :title="search ? 'No A/B tests match your search' : 'No A/B tests in this range'"
            :description="search ? 'Try a different search.' : 'Try a wider date range, or run an A/B campaign to see it here.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.report-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.report-link:hover,
.report-link:focus-visible {
  text-decoration: underline;
}

.variant-row td {
  background: rgb(var(--v-theme-surface));
}

.variant-marker {
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
  margin-inline-end: var(--mp-space-6);
}
</style>
