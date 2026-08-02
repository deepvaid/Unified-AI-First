<script setup lang="ts">
// The full reference-styled widget grid, shared by the Chart Lab exploration
// page and the in-chrome dashboard copy (DashboardLabView). Composes the
// generic shared components with the chartLabData fixtures.
import { ref } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import KpiStatCard from './KpiStatCard.vue'
import LabWidgetFrame from './LabWidgetFrame.vue'
import EngagementLineChart from './EngagementLineChart.vue'
import SnapshotStack, { type SnapshotStat } from './SnapshotStack.vue'
import StackedPillColumns from './StackedPillColumns.vue'
import TrafficDonut from './TrafficDonut.vue'
import MiniColumns, { type MiniColumnItem } from './MiniColumns.vue'
import GoalTrackBars from './GoalTrackBars.vue'
import ThermometerColumns from './ThermometerColumns.vue'
import GoalGauge from './GoalGauge.vue'
import PairedBarsList, { type PairedBarsRow } from './PairedBarsList.vue'
import RankProgressList, { type RankProgressRow } from './RankProgressList.vue'
import DotMatrix from './DotMatrix.vue'
import {
  AOV,
  C,
  DEVICES,
  GAUGE,
  KPIS,
  SMART_SUGGESTION,
  SNAPSHOT,
  TOP_CAMPAIGNS,
  TOP_PRODUCTS,
  formatCurrencyShort,
  type EngagementRange,
} from '../chartLabData'

withDefaults(defineProps<{ showNotes?: boolean }>(), { showNotes: true })

const engagementRange = ref<EngagementRange['key']>('weekly')

// Snapshot stats — upward revenue/orders are good.
const snapshotStats: SnapshotStat[] = SNAPSHOT.map((s) => ({
  label: s.label,
  value: s.value,
  deltaLabel: s.deltaLabel,
  tone: s.deltaPct >= 0 ? 'pos' : 'neg',
  up: s.deltaPct >= 0,
}))

// Sessions by device → mini columns.
const maxDevicePct = Math.max(...DEVICES.map((d) => d.pct))
const deviceItems: MiniColumnItem[] = DEVICES.map((d) => ({
  key: d.key,
  name: d.name,
  headline: `${d.pct}%`,
  barPct: (d.pct / maxDevicePct) * 100,
  color: d.color,
  footer: d.sessions.toLocaleString('en-US'),
  deltaPct: d.deltaPct,
  tipLabel: `${d.sessions.toLocaleString('en-US')} sessions`,
  tipValue: `${d.deltaPct >= 0 ? '+' : '−'}${Math.abs(d.deltaPct)}%`,
  aria: `${d.name}: ${d.pct}% of sessions, ${d.sessions.toLocaleString('en-US')}, ${d.deltaPct >= 0 ? 'up' : 'down'} ${Math.abs(d.deltaPct)}% vs previous 30 days`,
}))

// Top products → paired bars.
const maxOrders = Math.max(...TOP_PRODUCTS.map((p) => p.orders))
const maxRevenue = Math.max(...TOP_PRODUCTS.map((p) => p.revenue))
const productRows: PairedBarsRow[] = TOP_PRODUCTS.map((p) => ({
  key: p.name,
  name: p.name,
  aPct: (p.orders / maxOrders) * 100,
  aLabel: `${p.orders}`,
  bPct: (p.revenue / maxRevenue) * 88,
  bLabel: formatCurrencyShort(p.revenue),
  aria: `${p.name}: ${p.orders} orders, ${formatCurrencyShort(p.revenue)} revenue`,
}))

// Top campaigns → rank list (one blue-led ramp; rank carries the order).
const CAMPAIGN_FILLS = [C.navy, C.indigo, C.sky, C.teal, C.amber, C.coral]
const maxCampaignRevenue = Math.max(...TOP_CAMPAIGNS.map((c) => c.revenue))
const campaignRows: RankProgressRow[] = TOP_CAMPAIGNS.map((c, i) => ({
  key: c.name,
  name: c.name,
  color: CAMPAIGN_FILLS[i] ?? C.navy,
  pct: (c.revenue / maxCampaignRevenue) * 100,
  valueLabel: formatCurrencyShort(c.revenue),
  pill: `${c.openRate}%`,
  aria: `${c.name}: ${formatCurrencyShort(c.revenue)} revenue, ${c.openRate}% open rate`,
}))
</script>

<template>
  <div class="ldg">
    <!-- Row 1 · KPI strip -->
    <KpiStatCard v-for="k in KPIS" :key="k.key" :kpi="k" class="ldg-cell ldg-cell--3" />

    <!-- Row 2 · Hero engagement + snapshot stack -->
    <LabWidgetFrame
      class="ldg-cell ldg-cell--8"
      title="Email engagement"
      subtitle="Opens, clicks and conversions"
      icon="activity"
    >
      <template #aside>
        <v-btn-toggle
          v-model="engagementRange"
          mandatory
          density="compact"
          variant="outlined"
          divided
          class="ldg-tabs"
          aria-label="Engagement range"
        >
          <v-btn value="weekly" size="small">Weekly</v-btn>
          <v-btn value="monthly" size="small">Monthly</v-btn>
        </v-btn-toggle>
      </template>
      <EngagementLineChart :range-key="engagementRange" :height="296" />
    </LabWidgetFrame>
    <SnapshotStack
      class="ldg-cell ldg-cell--4"
      title="This Week Snapshot"
      :stats="snapshotStats"
      :quote="SMART_SUGGESTION.quote"
      :caption="SMART_SUGGESTION.caption"
    />

    <!-- Row 3 · Stacked pills + donut + devices -->
    <LabWidgetFrame
      class="ldg-cell ldg-cell--5"
      title="Revenue by channel"
      subtitle="May–Jul · split synthesized from channel mix"
      icon="bar-chart-3"
    >
      <StackedPillColumns />
    </LabWidgetFrame>
    <LabWidgetFrame class="ldg-cell ldg-cell--4" title="Traffic mix" subtitle="Share of sessions · 30 days" icon="pie-chart">
      <TrafficDonut />
    </LabWidgetFrame>
    <LabWidgetFrame class="ldg-cell ldg-cell--3" title="Sessions by device" subtitle="Last 30 days" icon="monitor-smartphone">
      <MiniColumns :items="deviceItems" group-label="Sessions by device, last 30 days." />
    </LabWidgetFrame>

    <!-- Row 4 · Goal bars + AOV thermometer + gauge -->
    <LabWidgetFrame class="ldg-cell ldg-cell--4" title="Monthly revenue" subtitle="vs monthly goal" icon="target">
      <GoalTrackBars />
    </LabWidgetFrame>
    <LabWidgetFrame class="ldg-cell ldg-cell--5" title="Average order value" subtitle="Feb–Jul" icon="receipt">
      <ThermometerColumns
        :labels="[...AOV.months]"
        :values="[...AOV.values]"
        :max="AOV.max"
        :initial-active="AOV.activeIndex"
        group-label="Average order value by month — select a month to inspect it."
        :headline="{ value: AOV.headline, deltaLabel: AOV.deltaLabel, deltaPositive: AOV.deltaPct >= 0, caption: AOV.caption }"
      />
    </LabWidgetFrame>
    <LabWidgetFrame class="ldg-cell ldg-cell--3" title="Open-rate goal" subtitle="Rolling 30 days" icon="gauge">
      <GoalGauge :pct="GAUGE.pct" :center="`${GAUGE.pct}%`" :center-caption="GAUGE.centerCaption" :line="GAUGE.line" />
    </LabWidgetFrame>

    <!-- Row 5 · Products + campaigns -->
    <LabWidgetFrame class="ldg-cell ldg-cell--6" title="Top products" subtitle="Orders vs revenue · 30 days" icon="package">
      <PairedBarsList
        :rows="productRows"
        legend-a="Orders"
        legend-b="Revenue"
        :color-a="C.navy"
        :color-b="C.sky"
        :fill-a="`linear-gradient(90deg, ${C.navy}, ${tintHex(C.navy, 0.25)})`"
        :fill-b="`linear-gradient(90deg, ${C.sky}, ${tintHex(C.sky, 0.35)})`"
        list-label="Top products by orders and revenue"
      />
    </LabWidgetFrame>
    <LabWidgetFrame class="ldg-cell ldg-cell--6" title="Top campaigns" subtitle="By revenue · open rate at right" icon="megaphone">
      <RankProgressList :rows="campaignRows" list-label="Top campaigns by revenue" />
    </LabWidgetFrame>

    <!-- Row 6 · Audience quality + notes -->
    <LabWidgetFrame
      class="ldg-cell"
      :class="showNotes ? 'ldg-cell--6' : 'ldg-cell--12'"
      title="Audience quality"
      subtitle="Contact engagement segments"
      icon="users"
    >
      <DotMatrix />
    </LabWidgetFrame>
    <section v-if="showNotes" class="ldg-cell ldg-cell--6 ldg-notes" aria-label="About this prototype">
      <h3 class="ldg-notes__title">About this exploration</h3>
      <ul class="ldg-notes__list">
        <li>One visual package everywhere: rounded marks, soft gradients inside marks, direct labels, tinted delta pills, context tracks.</li>
        <li>The same category keeps the same colour in every chart; warm accents are limited to two hues.</li>
        <li>Values mirror this account where deterministic (open rate 54.6%, contacts 60, top campaigns, product names); the rest is labeled synthesized.</li>
        <li>Nothing here touches the production dashboard — this page is reachable only by URL.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
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
.ldg-cell--6 { grid-column: span 6; }
.ldg-cell--8 { grid-column: span 8; }
.ldg-cell--12 { grid-column: span 12; }

.ldg-tabs :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

/* Notes card */
.ldg-notes {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), 0 10px 28px rgba(15, 23, 42, 0.04);
  padding: 20px 22px;
}

.ldg-notes__title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.ldg-notes__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-secondary);
}

/* Shared rich-tooltip skin (Apex tooltip.custom renders inside chart roots) */
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

/* Laptop widths */
@media (max-width: 1280px) {
  .ldg-cell--3 { grid-column: span 6; }
  .ldg-cell--4 { grid-column: span 6; }
  .ldg-cell--5 { grid-column: span 6; }
  .ldg-cell--8 { grid-column: span 12; }
}

@media (max-width: 1024px) {
  .ldg-cell--4,
  .ldg-cell--5,
  .ldg-cell--6 { grid-column: span 12; }
  .ldg-cell--3 { grid-column: span 6; }
}
</style>
