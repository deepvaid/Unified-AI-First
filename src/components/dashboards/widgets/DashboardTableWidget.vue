<script setup lang="ts">
import { computed } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import type { DashboardTableData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardTableData
}>()

function parseCurrency(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  return Number(value.replace(/[^0-9.-]/g, '')) || 0
}

// Status-chip columns opt the table out of the campaign meter-list treatment —
// they exist only on tables meant to render as real tables (shadcn Overview).
const isCampaignRevenueTable = computed(() =>
  props.data.columns.some((column) => column.key === 'campaign')
  && props.data.columns.some((column) => column.key === 'revenue')
  && !props.data.columns.some((column) => column.cellType === 'status'),
)

const campaignRows = computed(() => {
  const rows = props.data.rows.map((row) => ({
    campaign: String(row.campaign ?? ''),
    revenue: String(row.revenue ?? ''),
    openRate: String(row.openRate ?? ''),
    value: parseCurrency(row.revenue),
  }))
  const maxValue = Math.max(...rows.map((row) => row.value), 1)
  return rows.slice(0, 5).map((row) => ({
    ...row,
    percent: Math.max(8, Math.round((row.value / maxValue) * 100)),
  }))
})
</script>

<template>
  <div class="dashboard-table-widget">
    <div v-if="isCampaignRevenueTable" class="dashboard-campaign-list">
      <div class="dashboard-campaign-list__rows">
        <div v-for="row in campaignRows" :key="row.campaign" class="dashboard-campaign-list__row">
          <div class="dashboard-campaign-list__topline">
            <span class="dashboard-campaign-list__name">{{ row.campaign }}</span>
            <strong class="dashboard-campaign-list__value">{{ row.revenue }}</strong>
          </div>
          <div class="dashboard-campaign-list__meter">
            <span :style="{ width: `${row.percent}%` }" />
          </div>
          <div v-if="row.openRate" class="dashboard-campaign-list__meta">{{ row.openRate }}</div>
        </div>
      </div>
      <button type="button" class="dashboard-campaign-list__link">
        View all campaigns
        <v-icon size="16">arrow-right</v-icon>
      </button>
    </div>

    <v-table v-else density="compact" class="dashboard-table-widget__table">
      <thead>
        <tr>
          <th
            v-for="column in data.columns"
            :key="column.key"
            :class="column.align === 'end' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data.rows"
          :key="`${String(row[data.columns[0]?.key ?? ''] ?? '')}-${index}`"
        >
          <td
            v-for="column in data.columns"
            :key="column.key"
            :class="column.align === 'end' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
          >
            <MpStatusChip
              v-if="column.cellType === 'status'"
              :status="String(row[column.key] ?? '')"
              :type="column.statusType ?? 'general'"
              size="x-small"
            />
            <span v-else class="text-body-2">{{ row[column.key] }}</span>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped lang="scss">
.dashboard-table-widget {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  border-radius: var(--r-card);
}

/* Digit columns (totals, counts) align across rows. */
.dashboard-table-widget__table :deep(td) {
  font-variant-numeric: tabular-nums;
}

.dashboard-campaign-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.dashboard-campaign-list__rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 2px 8px 0;
  overflow-y: auto;
}

.dashboard-campaign-list__row {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.dashboard-campaign-list__topline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 12px;
  color: var(--text-primary);
  font-size: 13.5px;
}

.dashboard-campaign-list__name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-campaign-list__value {
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.dashboard-campaign-list__meter {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--accent-soft);
}

.dashboard-campaign-list__meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dashboard-campaign-list__meta {
  justify-self: end;
  margin-top: -3px;
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.dashboard-campaign-list__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 10px 0 2px;
  border: 0;
  background: transparent;
  color: var(--accent-ink);
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  text-align: left;
  transition: opacity 120ms ease;
}

.dashboard-campaign-list__link:hover {
  opacity: 0.75;
}

.dashboard-campaign-list__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 35%, transparent);
}

.dashboard-table-widget__table {
  background: transparent !important;
}

/* Content must never scroll sideways under the sticky header (the clipped
   column reads as a broken fade) — cells truncate instead. */
.dashboard-table-widget :deep(.v-table__wrapper) {
  overflow-x: hidden;
}

.dashboard-table-widget :deep(th) {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  background: var(--surface-primary);
  z-index: 1;
  white-space: nowrap;
  /* !important: Vuetify's .v-table > .v-table__wrapper > table > thead > tr > th
     selector outguns anything :deep() can express. */
  padding: 0 8px !important;
}

.dashboard-table-widget :deep(td) {
  font-size: 13.5px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  padding: 12px 8px !important;
}

.dashboard-table-widget :deep(th:first-child),
.dashboard-table-widget :deep(td:first-child) {
  padding-left: 2px !important;
}

.dashboard-table-widget :deep(th:last-child),
.dashboard-table-widget :deep(td:last-child) {
  padding-right: 2px !important;
}

.dashboard-table-widget :deep(tr:last-child td) {
  border-bottom: none;
}

.dashboard-table-widget :deep(tr:hover td) {
  background: var(--surface-secondary);
}
</style>
