<script setup lang="ts">
/**
 * Custom Reports — the register of saved reports for the account.
 *
 * Rebuilt from uat.maropost.com/accounts/:id/analytics/custom_reports.
 * See docs/rebuild/custom-reports-list/ for the audit and parity checklist.
 *
 * This is a management list, not a viewer: the source offers no way to open or edit
 * a saved report, and neither does this (audit F1, kept for parity).
 */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore, type CustomReport, type CustomReportType } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useToast } from '@/composables/useToast'

const store = useAnalyticsStore()
const { customReports } = storeToRefs(store)
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const toast = useToast()
const { loading } = useInitialLoad()

const REPORT_TYPES: CustomReportType[] = [
  'Campaign Based', 'SMS Report', 'SMS Message', 'Deliverability', 'Growth & Attrition',
]

const search = ref('')
// Report type is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const typeQuickFilter = {
  key: 'type',
  label: 'Report type',
  options: ([...REPORT_TYPES]).map((v) => ({ label: v, value: v })),
}
const typeFilter = ref<string[]>([])

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Type', key: 'reportType', sortable: false },
  { title: 'Status', key: 'scheduleMode', sortable: false },
  { title: 'Updated at', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: 96 },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return customReports.value.filter(r => {
    if (typeFilter.value.length && !typeFilter.value.includes(r.reportType)) return false
    if (q && !r.name.toLowerCase().includes(q)) return false
    return true
  })
})

const activeFilters = computed(() =>
  !typeFilter.value.length ? [] : [{ key: 'type', label: `Type: ${typeFilter.value.join(', ')}` }],
)

/** UAT labels a one-off report "Scheduled" and a repeating one "Recurring". */
function statusLabel(r: CustomReport) {
  return r.scheduleMode === 'Recurring' ? 'Recurring' : 'Scheduled'
}

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true,
})

function formatUpdated(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const parts = dateFmt.formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`
}

// ── Row actions ───────────────────────────────────────────────────────────────
function duplicateReport(r: CustomReport) {
  const id = customReports.value.reduce((m, x) => Math.max(m, x.id), 0) + 1
  customReports.value.unshift({
    ...r,
    id,
    name: `${r.name} copy`,
    updatedAt: new Date().toISOString().slice(0, 19),
  })
  toast.success(`Duplicated as “${r.name} copy”`)
}

function downloadReport(r: CustomReport) {
  // Mock sandbox — there is no generated file to serve.
  toast.success(`Preparing “${r.name}” for download`)
}

const confirmDelete = ref(false)
const pendingDelete = ref<CustomReport | null>(null)

function askDelete(r: CustomReport) {
  pendingDelete.value = r
  confirmDelete.value = true
}

function doDelete() {
  const r = pendingDelete.value
  if (!r) return
  const ix = customReports.value.findIndex(x => x.id === r.id)
  if (ix !== -1) customReports.value.splice(ix, 1)
  toast.success(`Deleted “${r.name}”`)
  pendingDelete.value = null
}

// ── Sort state for assistive tech ─────────────────────────────────────────────
/**
 * Vuetify 3's v-data-table marks the sorted column with a class and an icon but
 * emits no `aria-sort`, so sort state is visual-only (the same WCAG 1.3.1 gap the
 * source has — audit A5). Mirror it onto the header cells until the design system
 * fixes it centrally. See docs/rebuild/GAPS.md.
 */
type SortItem = { key: string; order?: 'asc' | 'desc' }
const sortBy = ref<SortItem[]>([{ key: 'updatedAt', order: 'desc' }])
const tableEl = useTemplateRef<{ $el?: HTMLElement }>('tableEl')

function syncAriaSort() {
  const ths = tableEl.value?.$el?.querySelectorAll('thead th')
  if (!ths) return
  ths.forEach((th, i) => {
    const header = headers[i]
    if (!header?.sortable) return th.removeAttribute('aria-sort')
    const active = sortBy.value.find(sortItem => sortItem.key === header.key)
    th.setAttribute('aria-sort', active ? (active.order === 'desc' ? 'descending' : 'ascending') : 'none')
  })
}

watch([sortBy, loading], () => { void nextTick(syncAriaSort) }, { deep: true, immediate: true })

function clearFilters() {
  search.value = ''
  typeFilter.value = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Custom Reports"
      subtitle="Saved report exports for this account."
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          :to="{ name: 'CreateCustomReport', params: { accountId } }"
        >
          New report
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="typeFilter"
        :quick-filter="typeQuickFilter"
        v-model:search="search"
        search-placeholder="Search reports by name"
        :active-filters="activeFilters"
        :total-count="filtered.length"
        @remove-filter="typeFilter = []"
        @clear-filters="clearFilters"
      >
        <template #actions>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="10" :columns="5" />

      <v-data-table
        v-else-if="filtered.length"
        :headers="headers"
        :items="filtered"
        :items-per-page="10"
        :items-per-page-options="[5, 10, 25, 50, 100]"
        v-model:sort-by="sortBy"
        ref="tableEl"
        item-value="id"
        density="comfortable"
        class="flex-grow-1"
      >
        <template #[`item.name`]="{ item }">
          <span class="font-weight-medium">{{ item.name }}</span>
        </template>

        <template #[`item.scheduleMode`]="{ item }">
          <MpStatusChip :status="statusLabel(item)" type="report" size="sm" />
        </template>

        <template #[`item.updatedAt`]="{ item }">
          <span class="text-no-wrap">{{ formatUpdated(item.updatedAt) }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <MpRowActionsMenu ariaLabel="Report actions" :item-label="item.name">
            <v-list-item role="menuitem" prepend-icon="copy" title="Duplicate report" @click="duplicateReport(item)" />
            <v-list-item role="menuitem" prepend-icon="download" title="Download report" @click="downloadReport(item)" />
            <v-divider class="my-1" />
            <v-list-item
              role="menuitem"
              prepend-icon="trash-2"
              title="Delete report"
              class="text-error"
              @click="askDelete(item)"
            />
          </MpRowActionsMenu>
        </template>
      </v-data-table>

      <MpEmptyState
        v-else-if="customReports.length"
        icon="search-x"
        title="No reports match your filters"
        description="Try a different search term, or clear the type filter to see every saved report."
        action-label="Clear filters"
        :heading-level="2"
        @action="clearFilters"
      />

      <MpEmptyState
        v-else
        icon="chart-column"
        title="No custom reports yet"
        description="Create a report to schedule an export of your campaign, SMS, deliverability or list-growth data."
        action-label="New report"
        action-icon="plus"
        :heading-level="2"
        @action="$router.push({ name: 'CreateCustomReport', params: { accountId } })"
      />
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      title="Delete this report?"
      :message="pendingDelete ? `“${pendingDelete.name}” will be permanently deleted.` : ''"
      :consequences="['Any schedule attached to it stops immediately.', 'This cannot be undone.']"
      confirm-label="Delete report"
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.crl-type-filter {
  min-width: 200px;
  max-width: 240px;
}
</style>
