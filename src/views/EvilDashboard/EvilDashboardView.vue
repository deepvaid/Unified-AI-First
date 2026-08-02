<script setup lang="ts">
// Evilcharts-style dashboard — separate URL, production dashboard untouched.
// Card designs replicate evilcharts.com (peak-glow bars, dot-matrix grid,
// dotted line, mono/gradient donuts, banded gauge, activity rings, region
// bars) with deterministic Maropost data. Card shell + tokens reused from
// the shadcn dashboard (read-only cross-imports).
import { watch } from 'vue'
import { useCopilotStore } from '@/stores/useCopilot'
import ScnCard from '../ShadcnDashboard/components/ScnCard.vue'
import EvPeakBars from './components/EvPeakBars.vue'
import EvGridBars from './components/EvGridBars.vue'
import EvDottedLine from './components/EvDottedLine.vue'
import EvMonoDonut from './components/EvMonoDonut.vue'
import EvGradientDonut from './components/EvGradientDonut.vue'
import EvGauge from './components/EvGauge.vue'
import EvRadialRings from './components/EvRadialRings.vue'
import EvRegionBars from './components/EvRegionBars.vue'
import {
  ENGAGEMENT_RINGS,
  HOUR_LABELS,
  OPENS_BY_DEVICE,
  ORDERS_BY_HOUR,
  REGION_MONTHS,
  REGION_SALES,
  REVENUE_BY_CATEGORY,
  REVENUE_MIX,
  REVENUE_MIX_GRADIENTS,
  SENDER_SCORE,
  SIGNUPS_PEAK_INDEX,
  SIGNUPS_WEEKLY,
} from './evilDemoData'

// Keep the Da Vinci drawer closed so the page reviews cleanly.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const ordersTotal = ORDERS_BY_HOUR.reduce((a, b) => a + b, 0)
const peakHourIndex = ORDERS_BY_HOUR.indexOf(Math.max(...ORDERS_BY_HOUR))
const peakHourLabel = HOUR_LABELS[peakHourIndex] ?? '—'
const peakWeek = SIGNUPS_WEEKLY[SIGNUPS_PEAK_INDEX] ?? { week: 'W08', organic: 0, paid: 0 }
const peakSignups = peakWeek.organic + peakWeek.paid

const dottedSeries = [
  { name: 'Desktop', color: '#2F6B4F', data: OPENS_BY_DEVICE.desktop },
  { name: 'Mobile', color: '#C4314B', data: OPENS_BY_DEVICE.mobile },
]

const formatK = (v: number) => `$${Math.round(v / 1000)}K`
</script>

<template>
  <div class="scn">
    <!-- Inert replica of the main dashboard's page header (DashboardView.vue) -->
    <header class="scn-head">
      <div class="scn-head__top">
        <div class="scn-head__heading">
          <span class="scn-head__eyebrow">Dashboards</span>
          <div class="scn-head__title-area">
            <button type="button" class="scn-head__fav scn-head__fav--active" aria-label="Favorited dashboard">
              <v-icon size="16">star</v-icon>
            </button>
            <button type="button" class="scn-head__switcher">
              <h1 class="scn-head__h1">Overview</h1>
              <v-icon size="16" class="scn-head__chevron" aria-hidden="true">chevron-down</v-icon>
            </button>
          </div>
        </div>
        <div class="scn-head__actions">
          <v-btn variant="text" size="small" append-icon="chevron-down" class="text-none">Actions</v-btn>
          <v-btn color="primary" variant="flat" size="small" prepend-icon="plus" class="text-none">Add widget</v-btn>
        </div>
      </div>
      <div class="scn-head__filters">
        <button type="button" class="scn-head__pill">
          <v-icon size="14" aria-hidden="true">calendar-range</v-icon>
          Last 30 days
          <v-icon size="14" aria-hidden="true">chevron-down</v-icon>
        </button>
        <div class="scn-head__filters-right">
          <span class="scn-head__status">
            <span class="scn-head__dot" aria-hidden="true" />
            Live &middot; synced 2 min ago
          </span>
          <v-btn icon="refresh-cw" variant="text" size="x-small" class="scn-head__refresh" aria-label="Refresh dashboard" />
        </div>
      </div>
    </header>

    <div class="scn-body">
      <div class="scn-grid">
        <!-- Row 1 · Peak Week + Revenue Mix -->
        <ScnCard class="scn-cell scn-cell--7">
          <template #heading>
            <p class="evl-stat__label">Best week</p>
            <p class="evl-stat__line">
              <span class="evl-stat__value">{{ peakSignups.toLocaleString('en-US') }}</span>
              <span class="evl-stat__caption">signups in {{ peakWeek.week }}</span>
            </p>
          </template>
          <template #action>
            <div class="evl-legend evl-legend--stack">
              <span class="evl-legend__item"><span class="evl-legend__dot" style="background: #7c3aed" />Organic</span>
              <span class="evl-legend__item"><span class="evl-legend__dot" style="background: #387c99" />Paid</span>
            </div>
          </template>
          <EvPeakBars
            :items="SIGNUPS_WEEKLY"
            :peak-index="SIGNUPS_PEAK_INDEX"
            chart-label="Weekly contact signups, organic versus paid, peak in week 8"
          />
        </ScnCard>

        <ScnCard class="scn-cell scn-cell--5" title="Revenue mix" description="Orders by sales channel · last 30 days">
          <EvGradientDonut
            :items="REVENUE_MIX"
            :gradients="REVENUE_MIX_GRADIENTS"
            center-value="47"
            center-caption="Total orders"
            :format-value="(v: number) => `$${v.toLocaleString('en-US')}`"
            chart-label="Revenue mix by sales channel"
          />
        </ScnCard>

        <!-- Row 2 · Grid bars + Gauge -->
        <ScnCard class="scn-cell scn-cell--7">
          <template #heading>
            <div class="evl-mono">
              <div class="evl-mono__stat">
                <span class="evl-mono__label">[Σ] Total</span>
                <span class="evl-mono__value">{{ ordersTotal.toLocaleString('en-US') }}</span>
              </div>
              <div class="evl-mono__divider" aria-hidden="true" />
              <div class="evl-mono__stat">
                <span class="evl-mono__label">[⬆] Peak</span>
                <span class="evl-mono__value">{{ peakHourLabel }}</span>
              </div>
            </div>
          </template>
          <template #action>
            <div class="evl-mono__comments" aria-hidden="true">
              <span>// CELL: <strong>1:1</strong></span>
              <span>// TYPE: <strong>GRID</strong></span>
            </div>
          </template>
          <div class="evl-dash-divider" aria-hidden="true" />
          <EvGridBars
            :values="ORDERS_BY_HOUR"
            :labels="HOUR_LABELS"
            chart-label="Orders per hour of day as a grid of cells, peaking at 14:00"
          />
        </ScnCard>

        <ScnCard class="scn-cell scn-cell--5" title="Sender score" description="Deliverability · rolling 30 days">
          <EvGauge
            :score="SENDER_SCORE.value"
            :max="SENDER_SCORE.max"
            :bands="SENDER_SCORE.bands"
            :status="SENDER_SCORE.status"
            :updated="SENDER_SCORE.updated"
            chart-label="Sender score gauge reading 842 of 1000, excellent"
          />
        </ScnCard>

        <!-- Row 3 · Dotted line + Mono donut -->
        <ScnCard class="scn-cell scn-cell--7" title="Opens by device" description="Desktop vs mobile · Jan – Dec">
          <EvDottedLine
            :labels="OPENS_BY_DEVICE.labels"
            :series="dottedSeries"
            chart-label="Email opens by device per month, desktop versus mobile"
          />
        </ScnCard>

        <ScnCard class="scn-cell scn-cell--5" title="Revenue by category" description="Share of total revenue">
          <EvMonoDonut
            :items="REVENUE_BY_CATEGORY"
            center-value="$1.25M"
            center-caption="Total revenue"
            chart-label="Revenue share by product category"
          />
        </ScnCard>

        <!-- Row 4 · Rings + stacked regions -->
        <ScnCard class="scn-cell scn-cell--5" title="Engagement by mail client" description="Opens · last 30 days">
          <EvRadialRings :items="ENGAGEMENT_RINGS" chart-label="Open engagement by mail client as activity rings" />
        </ScnCard>

        <ScnCard class="scn-cell scn-cell--7" title="Sales breakdown by regions" description="Monthly revenue of top 3 store regions">
          <EvRegionBars
            :months="REGION_MONTHS"
            :regions="REGION_SALES"
            :format-axis="formatK"
            chart-label="Stacked monthly revenue for Auckland, Wellington and Christchurch"
          />
        </ScnCard>

        <!-- Row 5 · selectable regions -->
        <ScnCard class="scn-cell scn-cell--12" title="Sales breakdown by regions" description="Click a region to drill in">
          <EvRegionBars
            :months="REGION_MONTHS"
            :regions="REGION_SALES"
            selectable
            :format-axis="formatK"
            chart-label="Monthly revenue for the selected store region"
          />
        </ScnCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* shadcn tokens, scoped to this page — same values as the shadcn dashboard. */
.scn {
  --chart-1: #8ec5ff;
  --chart-2: #2b7fff;
  --chart-3: #1447e6;
  --chart-4: #193cb8;
  --chart-5: #1c398e;
  --scn-card: #ffffff;
  --scn-border: #e5e5e5;
  --scn-muted: #737373;
  --scn-fg: #0a0a0a;
  --scn-soft: #f5f5f5;
  --scn-track: #e8e8e8;
  --scn-radius: 14px;

  font-family: Inter, system-ui, -apple-system, sans-serif;
}

.v-theme--maropostDark .scn {
  --scn-card: #171717;
  --scn-border: #262626;
  --scn-muted: #a1a1a1;
  --scn-fg: #fafafa;
  --scn-soft: #262626;
  --scn-track: #262626;
}

.scn-body {
  max-width: 1280px;
  margin: 0 auto;
}

.scn-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.scn-cell {
  min-width: 0;
}

.scn-cell--5 { grid-column: span 5; }
.scn-cell--7 { grid-column: span 7; }
.scn-cell--12 { grid-column: span 12; }

@media (max-width: 1100px) {
  .scn-cell--5,
  .scn-cell--7 { grid-column: span 12; }
}

/* Card-header stat blocks (Peak Week / Grid Bar cards) */
.evl-stat__label {
  font-size: 14px;
  color: var(--scn-muted);
  margin: 0;
}

.evl-stat__line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 2px 0 0;
}

.evl-stat__value {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.evl-stat__caption {
  font-size: 16px;
  color: var(--scn-fg);
}

.evl-legend {
  display: flex;
  gap: 6px 16px;
}

.evl-legend--stack {
  flex-direction: column;
  align-items: flex-end;
}

.evl-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--scn-fg);
}

.evl-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* Terminal-style mono header for the grid-bar card */
.evl-mono {
  display: flex;
  align-items: stretch;
  gap: 20px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

.evl-mono__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.evl-mono__label {
  font-size: 13px;
  color: var(--scn-fg);
}

.evl-mono__value {
  font-size: 34px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
}

.evl-mono__divider {
  width: 1px;
  border-left: 1px dashed var(--scn-border);
}

.evl-mono__comments {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 12px;
  color: var(--scn-muted);
}

.evl-mono__comments strong {
  color: var(--scn-fg);
  font-weight: 600;
}

.evl-dash-divider {
  border-top: 1px dashed var(--scn-border);
  margin-bottom: 16px;
}

/* Faithful inert replica of DashboardView's page header (values copied from
   its style block) — uses the app semantic vars, not the scn card tokens. */
.scn-head {
  margin: -32px -36px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

.scn-head__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 36px;
}

.scn-head__heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.scn-head__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  line-height: 1.2;
  margin-left: 38px;
  margin-bottom: 1px;
}

.scn-head__title-area {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scn-head__fav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
}

.scn-head__fav:hover {
  background: var(--surface-secondary);
}

.scn-head__fav--active {
  color: rgb(var(--v-theme-warning));
}

.scn-head__fav--active :deep(.v-icon svg) {
  fill: currentColor;
}

.scn-head__switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  min-width: 0;
}

.scn-head__switcher:hover {
  background: var(--surface-secondary);
  border-color: var(--border-subtle);
}

.scn-head__h1 {
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.15;
  white-space: nowrap;
  margin: 0;
  color: var(--text-primary);
  font-feature-settings: 'ss01', 'cv11';
}

.scn-head__chevron {
  color: var(--muted);
}

.scn-head__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.scn-head__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 36px;
  border-top: 1px solid var(--border-subtle);
}

.scn-head__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px 0 10px;
  border: none;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--text-primary);
  background: color-mix(in oklch, var(--text-primary) 5%, var(--surface-primary));
  cursor: pointer;
}

.scn-head__pill:hover {
  background: color-mix(in oklch, var(--text-primary) 9%, var(--surface-primary));
}

.scn-head__pill .v-icon {
  color: var(--muted);
  opacity: 0.85;
}

.scn-head__filters-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scn-head__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.scn-head__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--pos);
}

.scn-head__refresh {
  width: 22px !important;
  height: 22px !important;
  color: var(--muted);
}

.scn-head__refresh :deep(.v-icon) {
  font-size: 13px;
}

@media (max-width: 1024px) {
  .scn-head {
    margin: -28px -28px 10px;
  }

  .scn-head__top {
    padding: 10px 28px;
  }

  .scn-head__filters {
    padding: 4px 28px;
  }
}

@media (max-width: 640px) {
  .scn-head {
    margin: -22px -22px 8px;
  }

  .scn-head__top {
    padding: 8px 22px;
  }

  .scn-head__filters {
    padding: 4px 22px;
  }
}
</style>
