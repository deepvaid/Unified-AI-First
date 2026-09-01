<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalyticsStore, type AbReportVariant, type AbVariantMetrics } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { formatCurrencyCents } from '@/utils/formatCurrency'

// UAT parity: /accounts/:id/campaigns/:campaignId/ab_report — the "AB Campaign
// Dashboard": final campaign vs variant A vs variant B, KPI tiles, the ten-row
// metric comparison, the Overview rows and the readonly Details section.
// UAT marks the winner column with a background tint only; here it gets a
// labelled chip as well (IMPROVEMENTS.md).

const route = useRoute()
const router = useRouter()
const store = useAnalyticsStore()

const accountId = computed(() => route.params.accountId as string)
const report = computed(() => store.abReports.find(r => r.campaignId === Number(route.params.id)))
const variants = computed(() => report.value?.variants ?? [])

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
})

function dateTimeLabel(iso: string | null): string {
  if (!iso) return '—'
  const parts = DATE_FMT.formatToParts(new Date(iso))
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')}`
}

function kpis(v: AbReportVariant) {
  const clickToOpen = v.metrics.totalOpens.count === 0
    ? 0
    : Math.round((v.metrics.totalClicks.count / v.metrics.totalOpens.count) * 1000) / 10
  return [
    { label: 'Total Sent', value: v.totalSent.toLocaleString() },
    { label: 'Total Opens', value: `${v.metrics.totalOpens.pct.toFixed(1)}%` },
    { label: 'Total Clicks', value: `${v.metrics.totalClicks.pct.toFixed(1)}%` },
    { label: 'Click-to-Open', value: `${clickToOpen.toFixed(1)}%` },
  ]
}

// UAT links every cell to a legacy sub-report (delivered_report, open_report,
// link_report, bounce_report) that is outside this slice — cells render as
// text here (PARITY.md).
const METRIC_ROWS: Array<{ label: string; key: keyof AbVariantMetrics }> = [
  { label: 'Delivered', key: 'delivered' },
  { label: 'Total Opens', key: 'totalOpens' },
  { label: 'Unique Opens', key: 'uniqueOpens' },
  { label: 'Total Clicks', key: 'totalClicks' },
  { label: 'Unique Clicks', key: 'uniqueClicks' },
  { label: 'Bounced', key: 'bounced' },
  { label: 'Soft Bounced', key: 'softBounced' },
  { label: 'Hard Bounced', key: 'hardBounced' },
  { label: 'Unsubscribed', key: 'unsubscribed' },
  { label: 'Complaints', key: 'complaints' },
]

const OVERVIEW_ROWS: Array<{ label: string; value: (v: AbReportVariant) => string }> = [
  { label: 'Send Time', value: v => dateTimeLabel(v.overview.sendTime) },
  { label: 'Subject', value: v => v.overview.subject },
  { label: 'Pre-Header', value: v => v.overview.preHeader },
  { label: 'Content', value: v => v.overview.contentName ?? '—' },
  { label: 'From Name', value: v => v.overview.fromName },
  { label: 'Size', value: v => `${v.overview.sizePct}%` },
  { label: 'Contacts Count', value: v => v.overview.contactsCount.toLocaleString() },
  { label: 'Conversions', value: v => v.overview.conversions.toLocaleString() },
  { label: 'Total Revenue', value: v => formatCurrencyCents(v.overview.totalRevenue) },
  { label: 'Total Orders', value: v => v.overview.totalOrders.toLocaleString() },
  { label: 'Total Items Purchased', value: v => v.overview.totalItemsPurchased.toLocaleString() },
  { label: 'Total Unique Items Purchased', value: v => v.overview.totalUniqueItemsPurchased.toLocaleString() },
  { label: 'Conversion Rate', value: v => `${v.overview.conversionRate.toFixed(1)}%` },
  { label: 'Average Order Value', value: v => formatCurrencyCents(v.overview.averageOrderValue) },
]

const detailFields = computed(() => report.value
  ? [
      { label: 'From Email', value: report.value.details.fromEmail },
      { label: 'Reply To', value: report.value.details.replyTo },
      { label: 'Language', value: report.value.details.language },
      { label: 'Brand', value: report.value.details.brand },
    ]
  : [])

const chipSections = computed(() => report.value
  ? [
      { label: 'Lists', items: report.value.details.lists },
      { label: 'Segments', items: report.value.details.segments },
      { label: 'Suppress Lists', items: report.value.details.suppressLists },
      { label: 'Suppress Secure Lists', items: report.value.details.suppressSecureLists },
      { label: 'Suppress Segments', items: report.value.details.suppressSegments },
      { label: 'Suppress Journeys', items: report.value.details.suppressJourneys },
      { label: 'Campaign Tags', items: report.value.details.campaignTags },
    ]
  : [])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="report">
      <MpPageHeader
        :title="report.name"
        eyebrow="A/B Campaign Report"
        :back-to="{ name: 'ABCampaignReports', params: { accountId } }"
      />

      <v-card variant="flat" border rounded="lg" class="comparison-card">
        <div class="comparison-scroll">
          <table class="comparison-table" aria-label="Variant comparison">
            <thead>
              <tr>
                <th scope="col" class="row-label-col"><span class="sr-only">Metric</span></th>
                <th v-for="v in variants" :key="v.id" scope="col" :class="{ 'winner-col': v.kind === 'final' }">
                  <div class="variant-head">
                    <div class="variant-name">{{ v.name }}</div>
                    <v-chip
                      v-if="v.kind === 'final'"
                      size="small"
                      color="primary"
                      variant="tonal"
                      prepend-icon="trophy"
                    >
                      Decided by {{ v.decidedBy ?? 'TopChoice' }}
                    </v-chip>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="kpi-row">
                <th scope="row" class="row-label-col"><span class="sr-only">Headline metrics</span></th>
                <td v-for="v in variants" :key="v.id" :class="{ 'winner-col': v.kind === 'final' }">
                  <div class="kpi-grid">
                    <div v-for="kpi in kpis(v)" :key="kpi.label" class="kpi-tile">
                      <div class="kpi-label">{{ kpi.label }}</div>
                      <div class="kpi-value">{{ kpi.value }}</div>
                    </div>
                  </div>
                </td>
              </tr>

              <tr v-for="row in METRIC_ROWS" :key="row.key">
                <th scope="row" class="row-label-col">{{ row.label }}</th>
                <td v-for="v in variants" :key="v.id" :class="{ 'winner-col': v.kind === 'final' }">
                  {{ v.metrics[row.key].pct.toFixed(1) }}%
                  <span class="metric-count">({{ v.metrics[row.key].count.toLocaleString() }})</span>
                </td>
              </tr>

              <tr class="section-row">
                <th scope="row" :colspan="variants.length + 1"><MpSectionHeader title="Overview" :heading-level="2" /></th>
              </tr>

              <tr v-for="row in OVERVIEW_ROWS" :key="row.label">
                <th scope="row" class="row-label-col">{{ row.label }}</th>
                <td v-for="v in variants" :key="v.id" :class="{ 'winner-col': v.kind === 'final' }">
                  {{ row.value(v) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>

      <v-card variant="flat" border rounded="lg" class="details-card">
        <MpSectionHeader title="Details" :heading-level="2" />
        <dl class="details-grid">
          <div v-for="f in detailFields" :key="f.label" class="details-field">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </div>
        </dl>
        <div v-for="section in chipSections" :key="section.label" class="chip-section">
          <h3 class="chip-section-title">{{ section.label }} ({{ section.items.length }})</h3>
          <div v-if="section.items.length" class="d-flex flex-wrap ga-2">
            <v-chip v-for="item in section.items" :key="item" size="small" variant="tonal">{{ item }}</v-chip>
          </div>
          <v-divider class="mt-3" />
        </div>
      </v-card>
    </template>

    <MpEmptyState
      v-else
      icon="split"
      title="A/B report not found"
      description="This A/B test does not exist or has been removed."
      action-label="Back to A/B Campaign Reports"
      @action="router.push({ name: 'ABCampaignReports', params: { accountId } })"
      class="py-10"
    />
  </div>
</template>

<style scoped>
.comparison-card {
  padding: var(--mp-component-card-padding);
}

.comparison-scroll {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.comparison-table th,
.comparison-table td {
  padding: var(--mp-space-10) var(--mp-space-12);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  text-align: left;
  vertical-align: top;
  font-size: var(--mp-text-body-fontSize);
}

.row-label-col {
  width: 220px;
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
  font-weight: 500;
}

.winner-col {
  background: rgba(var(--v-theme-primary), 0.04);
}

.variant-head {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  align-items: flex-start;
}

.variant-name {
  font-weight: 600;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mp-space-8);
}

.kpi-tile {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-10) var(--mp-space-12);
}

.kpi-label {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.kpi-value {
  font-size: var(--mp-fontSize-18);
  font-weight: 600;
}

.metric-count {
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.section-row th {
  padding-top: var(--mp-space-24);
  border-bottom: none;
}

.details-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--mp-space-16);
}

.details-field dt {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.details-field dd {
  margin: 0;
}

.chip-section {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.chip-section-title {
  font-size: var(--mp-fontSize-13);
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
