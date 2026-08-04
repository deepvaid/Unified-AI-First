<script setup lang="ts">
// "Dashboard Overview v2 – dotted" — widget area implemented from the Claude
// Design export (Dashboard Overview v2 - dotted.dc.html). Separate URL, the
// production dashboard stays untouched; the page header below is the same
// inert replica of DashboardView's header as before. Data is fixture-driven
// (dottedDemoData.ts), interactions are real: range switching, KPI-driven
// metric chart, compare toggle, tabs, collapsible attention banner.
import { computed, ref, watch } from 'vue'
import { useCopilotStore } from '@/stores/useCopilot'
import MpStatusChip from '@/components/MpStatusChip.vue'
import {
  ATTENTION_ITEMS,
  ATTENTION_SUMMARY,
  BAR_GRADIENT_GREEN,
  BEST_SELLERS,
  CHANNEL_LEGEND,
  CHANNEL_SEGMENTS,
  DELIVERABILITY,
  DV_INSIGHTS,
  FULFILLMENT_QUEUE,
  JOURNEYS,
  METRICS,
  NVR_LEGEND,
  NVR_SEGMENTS,
  RETAIL_LOCATIONS,
  SALES_CHANNEL_LEGEND,
  SALES_PIE_WEDGES,
  SERIES,
  SERVICE_TICKETS,
  type KpiCell,
  bounds,
  linePath,
  money,
  pct,
  sum,
  type DottedMetric,
  type DottedRange,
} from './dottedDemoData'
import DtAttentionBanner from './components/DtAttentionBanner.vue'
import DtCard from './components/DtCard.vue'
import DtDottedBar from './components/DtDottedBar.vue'
import DtFunnelCard from './components/DtFunnelCard.vue'
import DtGauge from './components/DtGauge.vue'
import DtKpiStrip from './components/DtKpiStrip.vue'
import DtLegendList from './components/DtLegendList.vue'
import DtMetricChart from './components/DtMetricChart.vue'
import DtPieChart from './components/DtPieChart.vue'
import DtRingDonut from './components/DtRingDonut.vue'
import DtTabbedCard from './components/DtTabbedCard.vue'

// Keep the Da Vinci drawer closed so the option reviews cleanly.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const RANGES: Array<{ key: DottedRange; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

const range = ref<DottedRange>('30d')
const metric = ref<DottedMetric>('revenue')
const compare = ref(true)

const series = computed(() => SERIES[range.value])

const upColor = (a: number, b: number) => (a >= b ? 'var(--pos)' : 'var(--neg)')

const kpiCells = computed<KpiCell[]>(() => {
  const s = series.value
  const rev = sum(s.cur)
  const revPrev = sum(s.prev)
  const aov = rev / s.orders
  const aovPrev = revPrev / s.ordersPrev
  return [
    { key: 'revenue', label: 'Revenue', value: money(rev), delta: pct(rev, revPrev), deltaColor: upColor(rev, revPrev) },
    { key: 'orders', label: 'Orders', value: String(s.orders), delta: pct(s.orders, s.ordersPrev), deltaColor: upColor(s.orders, s.ordersPrev) },
    { key: 'aov', label: 'Average order value', value: money(aov), delta: pct(aov, aovPrev), deltaColor: upColor(aov, aovPrev) },
    {
      key: 'conv',
      label: 'Conversion rate',
      value: s.conv.toFixed(1) + '%',
      delta: (s.conv >= s.convPrev ? '+' : '−') + Math.abs(s.conv - s.convPrev).toFixed(1) + ' pp',
      deltaColor: upColor(s.conv, s.convPrev),
    },
  ]
})

const chart = computed(() => {
  const s = series.value
  const m = METRICS[metric.value]
  const cur = m.cur(s)
  const prev = m.prev(s)
  let [lo, hi] = bounds(compare.value ? cur.concat(prev) : cur, m.zero)
  if (m.snap) hi = Math.ceil(hi / m.snap) * m.snap
  const close = (d: string) => (d ? `${d} L 720 200 L 0 200 Z` : '')
  const line = linePath(cur, hi, lo)
  const prevLine = compare.value ? linePath(prev, hi, lo) : ''
  return {
    label: m.label,
    strokePath: line,
    areaPath: close(line),
    prevStrokePath: prevLine,
    prevAreaPath: close(prevLine),
    curValues: cur,
    prevValues: prev,
    lo,
    hi,
    // Full-precision values for the tooltip (m.fmt is the abbreviated axis form).
    formatValue: (value: number) => {
      if (metric.value === 'conv') return `${value.toFixed(1)}%`
      if (metric.value === 'orders') return Math.round(value).toLocaleString('en-US')
      return `$${Math.round(value).toLocaleString('en-US')}`
    },
  }
})
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
      <div class="dt-stack">
        <!-- Range control (lives in the mockup's page header; the inert header stays untouched) -->
        <div class="dt-range-row">
          <div class="dt-range" role="group" aria-label="Date range">
            <button
              v-for="r in RANGES"
              :key="r.key"
              type="button"
              class="dt-range__btn"
              :class="{ 'dt-range__btn--active': range === r.key }"
              :aria-pressed="range === r.key"
              @click="range = r.key"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <DtAttentionBanner :items="ATTENTION_ITEMS" :summary="ATTENTION_SUMMARY" />

        <DtKpiStrip v-model="metric" :cells="kpiCells" :vs-label="series.vs" />

        <!-- Main chart + revenue attribution donut -->
        <section class="dt-row dt-row--split">
          <DtMetricChart
            v-model:compare="compare"
            :metric-label="chart.label"
            :vs-label-long="series.vsLong"
            :area-path="chart.areaPath"
            :stroke-path="chart.strokePath"
            :prev-area-path="chart.prevAreaPath"
            :prev-stroke-path="chart.prevStrokePath"
            :x-labels="series.x"
            :point-labels="series.pointLabels"
            :cur-values="chart.curValues"
            :prev-values="chart.prevValues"
            :lo="chart.lo"
            :hi="chart.hi"
            :format-value="chart.formatValue"
          />
          <DtCard title="Where revenue comes from" subtitle="Share of attributed revenue">
            <div class="dt-donut-block">
              <DtRingDonut :segments="CHANNEL_SEGMENTS" center-value="$20,330" center-caption="attributed" />
              <DtLegendList :rows="CHANNEL_LEGEND" />
            </div>
            <template #footer>
              <div class="dt-stat">
                <span class="dt-stat__label">Email open rate</span>
                <span class="dt-stat__value">54.6%</span>
              </div>
              <div class="dt-stat">
                <span class="dt-stat__label">Total contacts</span>
                <span class="dt-stat__value">12,604</span>
              </div>
            </template>
          </DtCard>
        </section>

        <DtFunnelCard />

        <!-- Channel pie · goal gauge · new vs returning -->
        <section class="dt-row dt-row--thirds">
          <DtCard title="Orders by sales channel" subtitle="47 orders · last 30 days">
            <div class="dt-pie-block">
              <DtPieChart :wedges="SALES_PIE_WEDGES" label="Orders by sales channel" />
              <DtLegendList :rows="SALES_CHANNEL_LEGEND" :gap="10" class="dt-pie-block__legend" />
            </div>
            <template #footer>
              <div class="dt-stat">
                <span class="dt-stat__label">Fastest growing</span>
                <span class="dt-stat__value">Marketplace</span>
              </div>
              <div class="dt-stat">
                <span class="dt-stat__label">Average order value</span>
                <span class="dt-stat__value">$433</span>
              </div>
            </template>
          </DtCard>

          <DtCard title="Rolling 30-day goal" subtitle="$9,670 to go · 4 days left in the window">
            <div class="dt-center">
              <DtGauge :pct="68" center-value="68%" center-caption="of $30,000" />
            </div>
            <template #footer>
              <div class="dt-stat">
                <span class="dt-stat__label">Pace per day</span>
                <span class="dt-stat__value">$678</span>
              </div>
              <div class="dt-stat">
                <span class="dt-stat__label">Needed per day</span>
                <span class="dt-stat__value">$2,418</span>
              </div>
            </template>
          </DtCard>

          <DtCard title="New vs returning" subtitle="Share of the 47 orders placed">
            <div class="dt-center">
              <DtRingDonut :segments="NVR_SEGMENTS" center-value="62%" center-caption="returning" :center-size="26" />
            </div>
            <DtLegendList :rows="NVR_LEGEND" :gap="10" />
          </DtCard>
        </section>

        <!-- Tabbed lists + Da Vinci insights -->
        <section class="dt-row dt-row--split">
          <DtTabbedCard />

          <section class="dt-insights">
            <div class="dt-insights__head">
              <span class="dt-insights__orb" aria-hidden="true" />
              <div class="dt-insights__heading">
                <h2 class="dt-insights__title">Da Vinci insights</h2>
                <p class="dt-insights__sub">Fresh observations from your data</p>
              </div>
            </div>
            <div class="dt-insights__list">
              <div
                v-for="insight in DV_INSIGHTS"
                :key="insight.title"
                class="dt-insights__item"
                :class="{ 'dt-insights__item--highlight': insight.highlighted }"
              >
                <span class="dt-insights__item-title">{{ insight.title }}</span>
                <span class="dt-insights__item-meta">{{ insight.meta }}</span>
                <a href="#" class="dt-link">{{ insight.actionLabel }}</a>
              </div>
            </div>
            <p class="dt-insights__disclaimer">AI-generated — verify before acting</p>
          </section>
        </section>

        <!-- Fulfillment · service · deliverability -->
        <section class="dt-row dt-row--thirds">
          <DtCard title="Fulfillment queue" subtitle="71 orders in the pipeline">
            <template #action>
              <span class="dt-cloud-icon" style="--dt-cloud: var(--cloud-commerce-accent); --dt-cloud-text: var(--cloud-commerce-text)">
                <v-icon size="14">truck</v-icon>
              </span>
            </template>
            <div class="dt-list">
              <div v-for="row in FULFILLMENT_QUEUE" :key="row.status" class="dt-list__row">
                <MpStatusChip :status="row.status" type="fulfillment" />
                <span class="dt-list__count">{{ row.count }}</span>
              </div>
            </div>
            <a href="#" class="dt-link dt-link--footer">Open fulfillment</a>
          </DtCard>

          <DtCard title="Service tickets" subtitle="Avg first response 42m">
            <template #action>
              <span class="dt-cloud-icon" style="--dt-cloud: var(--cloud-service-accent); --dt-cloud-text: var(--cloud-service-text)">
                <v-icon size="14">life-buoy</v-icon>
              </span>
            </template>
            <div class="dt-bignum">
              <span class="dt-bignum__value">{{ SERVICE_TICKETS.open }}</span>
              <span class="dt-bignum__caption">open tickets</span>
            </div>
            <div class="dt-list">
              <div v-for="row in SERVICE_TICKETS.rows" :key="row.label" class="dt-list__row dt-list__row--text">
                <span :class="row.alert ? 'dt-list__label--alert' : 'dt-list__label'">{{ row.label }}</span>
                <span class="dt-list__count" :class="{ 'dt-list__label--alert': row.alert }">{{ row.value }}</span>
              </div>
            </div>
            <a href="#" class="dt-link dt-link--footer">Open ticket queue</a>
          </DtCard>

          <DtCard title="Email deliverability" subtitle="Last 30 days · 9,840 sends">
            <template #action>
              <span class="dt-cloud-icon" style="--dt-cloud: var(--cloud-marketing-accent); --dt-cloud-text: var(--cloud-marketing-text)">
                <v-icon size="14">mail-check</v-icon>
              </span>
            </template>
            <div class="dt-deliv">
              <div class="dt-deliv__head">
                <span class="dt-deliv__value">{{ DELIVERABILITY.delivered }}%</span>
                <span class="dt-deliv__caption">delivered</span>
              </div>
              <DtDottedBar :pct="DELIVERABILITY.delivered" :gradient="BAR_GRADIENT_GREEN" />
            </div>
            <div class="dt-list">
              <div v-for="row in DELIVERABILITY.rows" :key="row.label" class="dt-list__row dt-list__row--text">
                <span class="dt-list__label">{{ row.label }}</span>
                <span class="dt-list__count">{{ row.value }}</span>
              </div>
            </div>
            <div class="dt-warning">
              <v-icon size="14" aria-hidden="true">shield-alert</v-icon>
              <span>{{ DELIVERABILITY.warning }}</span>
            </div>
          </DtCard>
        </section>

        <!-- Best sellers · retail · journeys -->
        <section class="dt-row dt-row--thirds">
          <DtCard title="Best sellers" subtitle="By revenue, last 30 days">
            <div class="dt-bars">
              <div v-for="row in BEST_SELLERS" :key="row.label" class="dt-bars__item">
                <div class="dt-bars__head">
                  <span class="dt-bars__label">{{ row.label }}</span>
                  <span class="dt-bars__value">{{ row.value }}</span>
                </div>
                <DtDottedBar :pct="row.pct" />
                <span class="dt-bars__meta">{{ row.meta }}</span>
              </div>
            </div>
          </DtCard>

          <DtCard title="Retail today" subtitle="POS takings by location">
            <template #action>
              <span class="dt-cloud-icon" style="--dt-cloud: var(--cloud-retail-accent); --dt-cloud-text: var(--cloud-retail-text)">
                <v-icon size="14">store</v-icon>
              </span>
            </template>
            <div class="dt-bignum">
              <span class="dt-bignum__value">$620</span>
              <span class="dt-bignum__delta">+9.4%</span>
            </div>
            <div class="dt-bars">
              <div v-for="row in RETAIL_LOCATIONS" :key="row.label" class="dt-bars__item">
                <div class="dt-bars__head">
                  <span class="dt-bars__label">{{ row.label }}</span>
                  <span class="dt-bars__muted-value">{{ row.value }}</span>
                </div>
                <DtDottedBar :pct="row.pct" />
              </div>
            </div>
          </DtCard>

          <DtCard title="Journeys in flight" subtitle="3,154 contacts in an automation">
            <template #action>
              <span class="dt-cloud-icon" style="--dt-cloud: var(--cloud-marketing-accent); --dt-cloud-text: var(--cloud-marketing-text)">
                <v-icon size="14">workflow</v-icon>
              </span>
            </template>
            <div class="dt-journeys">
              <div v-for="row in JOURNEYS" :key="row.name" class="dt-journeys__row">
                <span class="dt-journeys__dot" :class="`dt-journeys__dot--${row.tone}`" aria-hidden="true" />
                <div class="dt-journeys__text">
                  <span class="dt-journeys__name">{{ row.name }}</span>
                  <span class="dt-journeys__meta">{{ row.meta }}</span>
                </div>
                <span class="dt-journeys__spacer" />
                <span class="dt-journeys__count">{{ row.count }}</span>
              </div>
            </div>
            <a href="#" class="dt-link dt-link--footer">View all journeys</a>
          </DtCard>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* scn tokens, scoped to this page — measured from ui.shadcn.com. */
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

.scn-body {
  max-width: 1280px;
  margin: 0 auto;
}

.v-theme--maropostDark .scn {
  --scn-card: #171717;
  --scn-border: #262626;
  --scn-muted: #a1a1a1;
  --scn-fg: #fafafa;
  --scn-soft: #262626;
  --scn-track: #262626;
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

/* ------------------------------------------------------------------ */
/* Dotted Overview v2 widget area                                      */
/* ------------------------------------------------------------------ */

.dt-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dt-range-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: -6px;
}

.dt-range {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--scn-border);
  border-radius: 999px;
  background: var(--scn-card);
}

.dt-range__btn {
  height: 30px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-fg);
  cursor: pointer;
}

.dt-range__btn--active {
  background: var(--scn-soft);
}

.dt-row {
  display: grid;
  gap: 20px;
}

.dt-row--split {
  grid-template-columns: minmax(0, 1.62fr) minmax(0, 1fr);
}

.dt-row--thirds {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

@media (max-width: 1100px) {
  .dt-row--split {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .dt-row--thirds {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Shared bits */
.dt-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dt-stat__label {
  font-size: 11.5px;
  color: var(--scn-muted);
}

.dt-stat__value {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-link {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.dt-link:hover {
  color: var(--accent-ink);
}

.dt-link--footer {
  margin-top: auto;
}

.dt-cloud-icon {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--dt-cloud) 12%, transparent);
  color: var(--dt-cloud-text);
}

.dt-center {
  display: flex;
  justify-content: center;
}

.dt-donut-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.dt-pie-block {
  display: flex;
  align-items: center;
  gap: 20px;
}

.dt-pie-block__legend {
  flex: 1;
  min-width: 0;
}

/* Simple label/value list rows (fulfillment, tickets, deliverability) */
.dt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dt-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dt-list__row--text {
  font-size: 13px;
}

.dt-list__label {
  color: var(--scn-muted);
}

.dt-list__label--alert {
  color: var(--neg);
  font-weight: 600;
}

.dt-list__count {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-list__row--text .dt-list__count {
  font-size: 13px;
}

.dt-bignum {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.dt-bignum__value {
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-bignum__caption {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-bignum__delta {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pos);
}

.dt-deliv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dt-deliv__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.dt-deliv__value {
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-deliv__caption {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-warning {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: 12.5px;
  font-weight: 600;
}

/* Dotted progress-bar lists (best sellers, retail) */
.dt-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dt-bars__item {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.dt-bars__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dt-bars__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-bars__value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-bars__muted-value {
  font-size: 12.5px;
  color: var(--scn-muted);
  font-variant-numeric: tabular-nums;
}

.dt-bars__meta {
  font-size: 11.5px;
  color: var(--scn-muted);
}

/* Journeys */
.dt-journeys {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dt-journeys__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dt-journeys__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 99px;
}

.dt-journeys__dot--success {
  background: var(--pos);
}

.dt-journeys__dot--warning {
  background: rgb(var(--v-theme-warning));
}

.dt-journeys__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dt-journeys__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-journeys__meta {
  font-size: 11.5px;
  color: var(--scn-muted);
}

.dt-journeys__spacer {
  flex: 1;
}

.dt-journeys__count {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

/* Da Vinci insights */
.dt-insights {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.dt-insights__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dt-insights__orb {
  width: 22px;
  height: 22px;
  border-radius: 99px;
  background: var(--dv-grad);
  animation: dt-breathe 6s ease-in-out infinite;
}

@keyframes dt-breathe {
  0%, 100% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1.12); opacity: 1; }
}

.dt-insights__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dt-insights__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--scn-fg);
}

.dt-insights__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-insights__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dt-insights__item {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--scn-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dt-insights__item--highlight {
  border: 0;
  background: linear-gradient(
    135deg,
    var(--dv-accent-soft) 0%,
    color-mix(in oklch, var(--dv-accent-soft) 40%, var(--scn-card)) 100%
  );
}

.dt-insights__item-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.4;
  text-wrap: pretty;
  color: var(--scn-fg);
}

.dt-insights__item-meta {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-insights__disclaimer {
  margin: 0;
  font-size: 11.5px;
  color: var(--scn-muted);
}
</style>
