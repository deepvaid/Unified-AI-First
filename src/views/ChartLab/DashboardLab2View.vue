<script setup lang="ts">
// Dashboard Lab · Option 2 — every widget is a REAL metric from the dashboard's
// Add-widget library / metric catalog, redesigned with the shared lab visual
// package. In-chrome route (no fullPage meta → real sidebar + app bar).
// Production dashboard and components untouched.
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { tintHex } from '@/plugins/chartPalette'
import { useCopilotStore } from '@/stores/useCopilot'
import KpiStatCard from './components/KpiStatCard.vue'
import LabWidgetFrame from './components/LabWidgetFrame.vue'
import LabAreaChart from './components/LabAreaChart.vue'
import SnapshotStack from './components/SnapshotStack.vue'
import LabGradientBars from './components/LabGradientBars.vue'
import PairedBarsList, { type PairedBarsRow } from './components/PairedBarsList.vue'
import RankProgressList, { type RankProgressRow } from './components/RankProgressList.vue'
import ThermometerColumns from './components/ThermometerColumns.vue'
import MiniColumns, { type MiniColumnItem } from './components/MiniColumns.vue'
import GoalGauge from './components/GoalGauge.vue'
import LabTable from './components/LabTable.vue'
import LabActivityFeed from './components/LabActivityFeed.vue'
import { C, formatCurrencyShort } from './chartLabData'
import {
  ACTIVITY_ITEMS,
  CAMPAIGNS_TABLE,
  CAT_KPIS,
  CHANNEL_BARS,
  DELIVERABILITY,
  DOMAIN_ROWS,
  EMAIL_VOLUME,
  OPEN_RATE_TREND,
  ORDERS_TABLE,
  REVENUE_OVER_TIME,
  SALES_BY_LOCATION,
  SERVICE_SNAPSHOT,
  TICKETS_BY_TYPE,
} from './catalogLabData'

// Keep the Da Vinci drawer closed so the option reviews cleanly.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const route = useRoute()
const accountId = (route.params.accountId as string) || '2000290'

// marketing_email_volume → paired bars (Sent vs Delivered).
const maxSent = Math.max(...EMAIL_VOLUME.map((v) => v.sent))
const volumeRows: PairedBarsRow[] = EMAIL_VOLUME.map((v) => ({
  key: v.key,
  name: v.name,
  // Cap at 78% so the value labels never clip at the card edge.
  aPct: (v.sent / maxSent) * 78,
  aLabel: v.sent.toLocaleString('en-US'),
  bPct: (v.delivered / maxSent) * 78,
  bLabel: v.delivered.toLocaleString('en-US'),
  aria: `${v.name}: ${v.sent.toLocaleString('en-US')} sent, ${v.delivered.toLocaleString('en-US')} delivered`,
}))

// contacts_by_domain → rank list.
const maxDomain = Math.max(...DOMAIN_ROWS.map((d) => d.value))
const domainRows: RankProgressRow[] = DOMAIN_ROWS.map((d) => ({
  key: d.key,
  name: d.name,
  color: d.color,
  pct: (d.value / maxDomain) * 100,
  valueLabel: `${d.value}`,
  aria: `${d.name}: ${d.value} contacts`,
}))

// service_tickets_by_type → mini columns.
const ticketTotal = TICKETS_BY_TYPE.reduce((a, t) => a + t.count, 0)
const maxTickets = Math.max(...TICKETS_BY_TYPE.map((t) => t.count))
const ticketItems: MiniColumnItem[] = TICKETS_BY_TYPE.map((t) => ({
  key: t.key,
  name: t.name,
  headline: `${t.count}`,
  barPct: (t.count / maxTickets) * 100,
  color: t.color,
  footer: `${Math.round((t.count / ticketTotal) * 100)}%`,
  tipLabel: `${t.count} tickets`,
  tipValue: `${Math.round((t.count / ticketTotal) * 100)}% of total`,
  aria: `${t.name}: ${t.count} tickets, ${Math.round((t.count / ticketTotal) * 100)}% of total`,
}))

// retail_sales_by_location → rank list.
const maxLocation = Math.max(...SALES_BY_LOCATION.map((l) => l.value))
const locationRows: RankProgressRow[] = SALES_BY_LOCATION.map((l) => ({
  key: l.key,
  name: l.name,
  color: l.color,
  pct: (l.value / maxLocation) * 100,
  valueLabel: formatCurrencyShort(l.value),
  aria: `${l.name}: ${formatCurrencyShort(l.value)} POS revenue`,
}))
</script>

<template>
  <div class="dlb">
    <!-- Dashboard-style page header (visual copy; controls are inert placeholders) -->
    <header class="dlb__header">
      <div class="dlb__row">
        <div class="dlb__titles">
          <p class="dlb__eyebrow">Dashboards</p>
          <div class="dlb__title-line">
            <v-icon size="18" class="dlb__star" aria-hidden="true">star</v-icon>
            <h1 class="dlb__title">Overview</h1>
            <span class="dlb__chip">Option 2 · catalog widgets</span>
          </div>
        </div>
        <div class="dlb__actions">
          <RouterLink class="dlb__switch" :to="{ name: 'DashboardLab', params: { accountId } }">
            View Option 1
            <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
          </RouterLink>
          <v-btn variant="outlined" size="small" disabled>Actions</v-btn>
          <v-btn color="primary" size="small" prepend-icon="plus" disabled>Add widget</v-btn>
        </div>
      </div>
      <div class="dlb__filters">
        <span class="dlb__filter-chip">
          <v-icon size="13" aria-hidden="true">calendar</v-icon>
          Last 30 days
          <v-icon size="13" aria-hidden="true">chevron-down</v-icon>
        </span>
        <span class="dlb__live">
          <span class="dlb__live-dot" aria-hidden="true" />
          Live · synced 2 min ago
        </span>
      </div>
    </header>

    <div class="ldg">
      <!-- Row 1 · commerce_revenue / commerce_orders / commerce_aov / marketing_open_rate -->
      <KpiStatCard v-for="k in CAT_KPIS" :key="k.key" :kpi="k" class="ldg-cell ldg-cell--3" />

      <!-- Row 2 · commerce_revenue_over_time + service snapshot -->
      <LabWidgetFrame
        class="ldg-cell ldg-cell--8"
        title="Revenue over time"
        subtitle="Daily revenue · last 30 days"
        icon="trending-up"
      >
        <LabAreaChart
          :labels="REVENUE_OVER_TIME.labels"
          :values="REVENUE_OVER_TIME.values"
          name="Revenue"
          :color="C.navy"
          :height="296"
          chart-label="Daily revenue for the last 30 days, ending at the badged final value."
        />
      </LabWidgetFrame>
      <SnapshotStack
        class="ldg-cell ldg-cell--4"
        :title="SERVICE_SNAPSHOT.title"
        :stats="SERVICE_SNAPSHOT.stats"
        :quote="SERVICE_SNAPSHOT.quote"
        :caption="SERVICE_SNAPSHOT.caption"
      />

      <!-- Row 3 · commerce_revenue_by_channel + marketing_email_volume + contacts_by_domain -->
      <LabWidgetFrame class="ldg-cell ldg-cell--5" title="Revenue by Channel" subtitle="Last 30 days" icon="bar-chart-3">
        <LabGradientBars :items="CHANNEL_BARS" group-label="Revenue by sales channel, last 30 days." />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--4" title="Email Volume" subtitle="Sent vs delivered · last 5 sends" icon="mail">
        <PairedBarsList
          :rows="volumeRows"
          legend-a="Sent"
          legend-b="Delivered"
          :color-a="C.indigo"
          :color-b="C.teal"
          :fill-a="`linear-gradient(90deg, ${C.indigo}, ${tintHex(C.indigo, 0.3)})`"
          :fill-b="`linear-gradient(90deg, ${C.teal}, ${tintHex(C.teal, 0.35)})`"
          list-label="Email volume: sent versus delivered per campaign"
          dense
        />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--3" title="Email Address by Domain" subtitle="All contacts" icon="at-sign">
        <RankProgressList :rows="domainRows" list-label="Contacts by email domain" />
      </LabWidgetFrame>

      <!-- Row 4 · marketing_open_rate_over_time + service_tickets_by_type + deliverability -->
      <LabWidgetFrame class="ldg-cell ldg-cell--5" title="Open Rate Trend" subtitle="Last 7 sent campaigns" icon="mail-open">
        <ThermometerColumns
          :labels="OPEN_RATE_TREND.labels"
          :values="OPEN_RATE_TREND.values"
          :max="OPEN_RATE_TREND.max"
          :initial-active="OPEN_RATE_TREND.activeIndex"
          :format-value="(v: number) => `${v.toFixed(1)}%`"
          group-label="Open rate per campaign — select a campaign to inspect it."
          :headline="OPEN_RATE_TREND.headline"
        />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--4" title="Tickets by Type" subtitle="Open tickets by category" icon="headset">
        <MiniColumns :items="ticketItems" group-label="Open tickets by category." />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--3" title="Deliverability Score" subtitle="Rolling 30 days" icon="shield-check">
        <GoalGauge
          :pct="DELIVERABILITY.pct"
          :center="DELIVERABILITY.center"
          :center-caption="DELIVERABILITY.centerCaption"
          :line="DELIVERABILITY.line"
        />
      </LabWidgetFrame>

      <!-- Row 5 · marketing_top_campaigns + commerce_recent_orders -->
      <LabWidgetFrame class="ldg-cell ldg-cell--7" title="Top Campaigns" subtitle="By attributed revenue" icon="megaphone">
        <LabTable
          :columns="[
            { key: 'name', label: 'Campaign' },
            { key: 'status', label: 'Status' },
            { key: 'openRate', label: 'Open rate', align: 'right' },
            { key: 'revenue', label: 'Revenue', align: 'right' },
          ]"
          :rows="CAMPAIGNS_TABLE.map((c) => ({ name: c.name, status: { pill: c.status.label, tone: c.status.tone }, openRate: c.openRate, revenue: c.revenue }))"
          table-label="Top campaigns by revenue"
        />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--5" title="Recent Orders" subtitle="Latest 6" icon="shopping-cart">
        <LabTable
          :columns="[
            { key: 'order', label: 'Order' },
            { key: 'customer', label: 'Customer' },
            { key: 'total', label: 'Total', align: 'right' },
            { key: 'status', label: 'Status' },
          ]"
          :rows="ORDERS_TABLE.map((o) => ({ order: o.order, customer: o.customer, total: o.total, status: { pill: o.status.label, tone: o.status.tone } }))"
          table-label="Recent orders"
        />
      </LabWidgetFrame>

      <!-- Row 6 · marketing_live_activity + retail_sales_by_location -->
      <LabWidgetFrame class="ldg-cell ldg-cell--7" title="Live Activity" subtitle="Across campaigns, orders and automations" icon="activity">
        <LabActivityFeed :items="ACTIVITY_ITEMS" list-label="Live activity feed" />
      </LabWidgetFrame>
      <LabWidgetFrame class="ldg-cell ldg-cell--5" title="Sales by Location" subtitle="Completed POS revenue" icon="store">
        <RankProgressList :rows="locationRows" list-label="POS sales by store location" />
      </LabWidgetFrame>
    </div>

    <p class="dlb__footnote">
      Option 2 — every widget above is a real metric from the dashboard's Add-widget catalog,
      restyled with the shared chart package on fixture data. The real dashboard is unchanged.
    </p>
  </div>
</template>

<style scoped>
.dlb {
  width: 100%;
  font-family: Inter, system-ui, sans-serif;
}

.dlb__header {
  margin-bottom: 18px;
}

.dlb__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dlb__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 2px;
}

.dlb__title-line {
  display: flex;
  align-items: center;
  gap: 9px;
}

.dlb__star {
  color: #d7a437;
}

.dlb__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text-primary);
}

.dlb__chip {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-default);
  background: color-mix(in srgb, var(--accent-default) 10%, transparent);
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}

.dlb__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dlb__switch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-default);
  text-decoration: none;
}

.dlb__switch:hover {
  text-decoration: underline;
}

.dlb__switch:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 4px;
}

.dlb__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.dlb__filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--surface-secondary);
  border-radius: 8px;
  padding: 5px 10px;
}

.dlb__live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-muted);
}

.dlb__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--pos-ink, #16a34a);
}

.dlb__footnote {
  margin: 20px 2px 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* Grid + shared tooltip skin (same contract as LabDashboardGrid) */
.ldg {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
}

.ldg-cell {
  min-width: 0;
}

.ldg-cell--3 { grid-column: span 3; }
.ldg-cell--4 { grid-column: span 4; }
.ldg-cell--5 { grid-column: span 5; }
.ldg-cell--7 { grid-column: span 7; }
.ldg-cell--8 { grid-column: span 8; }

.ldg :deep(.apexcharts-tooltip) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.ldg :deep(.lab-tip) {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  padding: 10px 12px;
  min-width: 150px;
  font-family: Inter, system-ui, sans-serif;
}

.ldg :deep(.lab-tip__title) {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.ldg :deep(.lab-tip__row) {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  padding: 2px 0;
}

.ldg :deep(.lab-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ldg :deep(.lab-tip__label) {
  color: var(--text-secondary);
}

.ldg :deep(.lab-tip__value) {
  margin-left: auto;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1280px) {
  .ldg-cell--3 { grid-column: span 6; }
  .ldg-cell--4 { grid-column: span 6; }
  .ldg-cell--5 { grid-column: span 6; }
  .ldg-cell--7 { grid-column: span 12; }
  .ldg-cell--8 { grid-column: span 12; }
}

@media (max-width: 1024px) {
  .ldg-cell--4,
  .ldg-cell--5,
  .ldg-cell--7 { grid-column: span 12; }
  .ldg-cell--3 { grid-column: span 6; }
}
</style>
