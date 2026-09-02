<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnalyticsStore, type RecurringOccurrence } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { formatCurrency } from '@/utils/formatCurrency'

// UAT parity: /accounts/:id/reports/recurring_campaign_report — a flat report
// table of recurring campaigns whose rows expand into one child row per
// occurrence (each actual send). See docs/rebuild/content-reporting.

const route = useRoute()
const store = useAnalyticsStore()
const accountId = computed(() => route.params.accountId as string)
const { loading } = useInitialLoad()

const search = ref('')
const expanded = ref<string[]>([])

const METRIC_KEYS = ['sent', 'delivered', 'opens', 'clicks', 'bounces', 'revenue'] as const

const rows = computed(() =>
  store.recurringReports.map((r) => {
    const totals = { sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, revenue: 0 }
    for (const o of r.occurrences) for (const k of METRIC_KEYS) totals[k] += o[k]
    return { id: r.id, campaignId: r.campaignId, name: r.name, occurrences: r.occurrences, ...totals }
  }),
)

// Name + revenue identify the row and always show; the funnel metrics drop out
// progressively so the table never side-scrolls on a phone. The occurrence
// child rows render the same visible columns.
const headers = [
  { title: '', key: 'data-table-expand', sortable: false, width: 48 },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Sent', key: 'sent', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Delivered', key: 'delivered', align: 'end' as const, hideBelow: 'lg' as const },
  { title: 'Opens', key: 'opens', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Clicks', key: 'clicks', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Bounces', key: 'bounces', align: 'end' as const, hideBelow: 'lg' as const },
  { title: 'Total Revenue', key: 'revenue', align: 'end' as const },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

function occurrenceCell(occ: RecurringOccurrence, key: string): string {
  if (key === 'revenue') return formatCurrency(occ.revenue)
  const metric = METRIC_KEYS.find((k) => k === key)
  return metric ? occ[metric].toLocaleString() : ''
}

// UAT lazy-loads occurrences on expand (spinner in the expander cell); the
// mock keeps that loading state visible for a beat so the flow is walkable.
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

function occurrenceLabel(iso: string): string {
  const parts = DATE_FMT.formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')}`
}

function reportLink(campaignId: number) {
  return { name: 'CampaignReport', params: { accountId: accountId.value, id: campaignId } }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Recurring Campaign Reports"
      :subtitle="`${rows.length} recurring campaigns`"
    />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Recurring campaigns"
        search-placeholder="Search recurring campaigns"
        :total-count="rows.length"
      />
      <MpTableSkeleton v-if="loading" :rows="7" :columns="7" />

      <v-data-table
        v-else
        v-model:expanded="expanded"
        :headers="visibleHeaders"
        :items="rows"
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
            :aria-label="isExpanded(internalItem) ? `Collapse occurrences of ${item.name}` : `Expand occurrences of ${item.name}`"
            :aria-expanded="isExpanded(internalItem) ? 'true' : 'false'"
            @click="toggleExpand(internalItem)"
          />
        </template>

        <template #item.name="{ item }">
          <router-link :to="reportLink(item.campaignId)" class="report-link">{{ item.name }}</router-link>
        </template>
        <template #item.sent="{ item }">{{ item.sent.toLocaleString() }}</template>
        <template #item.delivered="{ item }">{{ item.delivered.toLocaleString() }}</template>
        <template #item.opens="{ item }">{{ item.opens.toLocaleString() }}</template>
        <template #item.clicks="{ item }">{{ item.clicks.toLocaleString() }}</template>
        <template #item.bounces="{ item }">{{ item.bounces.toLocaleString() }}</template>
        <template #item.revenue="{ item }">{{ formatCurrency(item.revenue) }}</template>

        <template #expanded-row="{ columns, item }">
          <tr v-if="!loadedIds.has(item.id)">
            <td :colspan="columns.length" class="text-center py-3">
              <v-progress-circular indeterminate size="20" width="2" color="primary" aria-label="Loading occurrences" />
            </td>
          </tr>
          <tr v-for="occ in loadedIds.has(item.id) ? item.occurrences : []" :key="occ.id" class="occurrence-row">
            <td v-for="h in visibleHeaders" :key="h.key" :class="{ 'text-end': h.align === 'end' }">
              <template v-if="h.key === 'name'">
                <span class="occurrence-marker" aria-hidden="true">↳</span>
                <router-link :to="reportLink(occ.campaignId)" class="report-link">
                  {{ occurrenceLabel(occ.sentAt) }}
                </router-link>
              </template>
              <template v-else>{{ occurrenceCell(occ, h.key) }}</template>
            </td>
          </tr>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="repeat"
            :title="search ? 'No recurring campaigns match your search' : 'No recurring campaign reports yet'"
            :description="search ? 'Try a different search.' : 'Reports appear here after a recurring campaign has sent.'"
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

.occurrence-row td {
  background: rgb(var(--v-theme-surface));
}

.occurrence-marker {
  color: var(--on-surface-muted);
  margin-inline-end: var(--mp-space-6);
}
</style>
