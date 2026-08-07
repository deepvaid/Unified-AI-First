<script setup lang="ts">
import { watch } from 'vue'
import { CHART_THEMES, type ChartPalette, type ChartTreatment } from '@/plugins/chartPalette'
import { useCopilotStore } from '@/stores/useCopilot'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardChartVariant,
  DashboardFilterState,
  DashboardMetricId,
  DashboardSeriesData,
  DashboardWidget,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import DashboardChartWidget from '@/components/dashboards/widgets/DashboardChartWidget.vue'
import DashboardPieWidget from '@/components/dashboards/widgets/DashboardPieWidget.vue'
import PaletteScope from '@/views/ChartThemes/PaletteScope.vue'
import {
  SPECIMEN_AREA,
  SPECIMEN_BAR,
  SPECIMEN_DIVERGING,
  SPECIMEN_DONUT,
  SPECIMEN_LINE,
} from './specimenData'

// Keep the Da Vinci drawer closed so it never overlaps the comparison (same as /chart-themes).
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const ACCOUNT_ID = '2000290'

// Specimen cells are ~260px wide — Option D's floating bar labels collide at that
// size (they read fine at real widget size), so small cells suppress them.
const specimenTheme = (id: ChartPalette) => {
  const base = CHART_THEMES[id].light
  const t = base.treatment
  if (!t?.bar.floatingLabels) return base
  return { ...base, treatment: { ...t, bar: { ...t.bar, floatingLabels: false } } }
}

// Real dashboard filters (mirrors createDefaultFilters() in useDashboards.ts).
const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

/* ---------------------------------------------------------------------------
 * Leadership copy — source of truth: docs/chart-exploration/copy.json
 * (inlined so the review page has no runtime fetch; keep the two in sync).
 * ------------------------------------------------------------------------- */
interface OptionCopy {
  id: ChartPalette
  /** `?chart=` value + `data-chart` scope; undefined on the baseline (no scope). */
  chartId?: string
  name: string
  philosophy: string
  /** Tooltip family — the one treatment decision that lives in CSS, not ChartTreatment. */
  tooltipNote: string
}

const BASELINE: OptionCopy = {
  id: 'shopify',
  name: '00 — Current Dashboard',
  philosophy: "Today's default: flat marks and dashed previous-period comparison in a six-step blue ramp. Calm, but the supporting pieces each do their own thing — there is no single system.",
  tooltipNote: 'light tooltip',
}

const OPTIONS: OptionCopy[] = [
  {
    id: 'optionA',
    chartId: 'optionA',
    name: 'Option A — Restrained Blue',
    philosophy: 'One blue, weighted by importance. Everything secondary steps back into neutrals.',
    tooltipNote: 'minimal light tooltip',
  },
  {
    id: 'optionB',
    chartId: 'optionB',
    name: 'Option B — Sophisticated Multi-Color',
    philosophy: 'Color is meaning — one hue per data family, used intentionally, never decoratively.',
    tooltipNote: 'dark inverse tooltip',
  },
  {
    id: 'optionC',
    chartId: 'optionC',
    name: 'Option C — Maropost Blue · Teal · Green',
    philosophy: 'An ownable family — Maropost blue flowing through teal into green, one temperature.',
    tooltipNote: 'family-tinted light tooltip',
  },
  {
    id: 'optionD',
    chartId: 'optionD',
    name: 'Option D — Modern Gradient',
    philosophy: 'Data with presence — depth and light, never noise. Every gradient encodes something.',
    tooltipNote: 'deep indigo tooltip',
  },
]

const ALL_SYSTEMS: OptionCopy[] = [BASELINE, ...OPTIONS]

/* ---------------------------------------------------------------------------
 * Section 1 — panels of real dashboard widgets
 * ------------------------------------------------------------------------- */

// Build genuine DashboardWidgets so the panels render the exact production widgets
// (DashboardWidgetCard → useWidgetData), not look-alikes. Same builder shape as
// ChartThemesView; layout w/h only feed the size presets, the CSS grid does the sizing.
let widgetSeq = 0
function widget(
  title: string,
  metricId: DashboardMetricId,
  type: DashboardWidgetType,
  w: number,
  h: number,
  chartVariant?: DashboardChartVariant,
): DashboardWidget {
  const metric = getMetricDescriptor(metricId)
  return {
    id: `cx-${metricId}-${widgetSeq++}`,
    type,
    title,
    dataSource: metric?.dataSource ?? 'commerce',
    metricId,
    chartVariant,
    layout: { x: 0, y: 0, w, h, minW: 2, minH: 2 },
    drilldown: metric?.drilldown ?? { routeName: 'Dashboard', label: title },
  }
}

/** The Overview chart set — every widget on the real dashboard that carries the theme. */
function panelWidgets() {
  return {
    kpis: [
      widget('Revenue', 'commerce_revenue', 'kpi', 3, 4),
      widget('Orders', 'commerce_orders', 'kpi', 3, 4),
      widget('Average Order Value', 'commerce_aov', 'kpi', 3, 4),
      widget('Open Rate', 'marketing_open_rate', 'kpi', 3, 4),
    ],
    area: widget('Revenue over time', 'commerce_revenue_over_time', 'timeseries', 8, 8, 'area'),
    deviceDonut: widget('Sessions by device type', 'analytics_sessions_by_device', 'donut', 4, 8),
    line: widget('Revenue by channel', 'demo_channel_trend', 'timeseries', 7, 8, 'line'),
    pie: widget('Traffic mix', 'demo_channel_mix', 'pie', 5, 8),
    customers: widget('Customers over time', 'commerce_customers_over_time', 'timeseries', 7, 8, 'stacked-area'),
    salesByProduct: widget('Sales by product name', 'commerce_sales_by_product', 'stacked_bar', 5, 8),
    bar: widget('Email volume', 'marketing_email_volume', 'bar', 7, 9),
    donut: widget('Contacts by domain', 'contacts_by_domain', 'donut', 5, 9),
    // Full width here: on the real dashboard this pairs with Recent orders, and
    // tables carry no theme so the compare page leaves them out.
    country: widget('Sessions by country', 'analytics_sessions_by_country', 'bar', 12, 7, 'stacked-column'),
  }
}

const panels = ALL_SYSTEMS.map((system) => ({
  ...system,
  theme: CHART_THEMES[system.id].light,
  widgets: panelWidgets(),
}))

function liveLink(system: OptionCopy) {
  return `/accounts/${ACCOUNT_ID}/dashboard?chart=${system.chartId ?? 'shopify'}`
}

/* ---------------------------------------------------------------------------
 * Section 2 — specimen grid (same chart, four systems)
 * ------------------------------------------------------------------------- */
interface SpecimenRow {
  key: string
  label: string
  note: string
  /** Row height in px — shared by the label column so the rows stay aligned. */
  height: number
  data: DashboardSeriesData
  kind: 'chart' | 'donut'
  widgetType?: 'timeseries' | 'bar'
  chartVariant?: DashboardChartVariant
}

const SPECIMEN_ROWS: SpecimenRow[] = [
  { key: 'line', label: 'Line', note: 'Three channels', height: 208, data: SPECIMEN_LINE, kind: 'chart', widgetType: 'timeseries', chartVariant: 'line' },
  { key: 'area', label: 'Area', note: 'With previous period', height: 208, data: SPECIMEN_AREA, kind: 'chart', widgetType: 'timeseries', chartVariant: 'area' },
  { key: 'bar', label: 'Bar', note: 'Grouped, two series', height: 208, data: SPECIMEN_BAR, kind: 'chart', widgetType: 'bar' },
  { key: 'donut', label: 'Donut', note: 'Six slices', height: 236, data: SPECIMEN_DONUT, kind: 'donut' },
  { key: 'diverging', label: 'Diverging bar', note: 'Positive / negative', height: 208, data: SPECIMEN_DIVERGING, kind: 'chart', widgetType: 'bar' },
]

/** Chart body height inside a cell — cell height minus the cell's own padding. */
const CELL_PADDING = 20
function chartHeight(row: SpecimenRow) {
  return row.height - CELL_PADDING
}

/* ---------------------------------------------------------------------------
 * Section 3 — token strips
 * ------------------------------------------------------------------------- */
const SERIES_SLOTS = ['s1', 's2', 's3', 's4', 's5', 's6']

function semanticSwatches(theme: (typeof CHART_THEMES)['optionA']['light']) {
  const t = theme.treatment as ChartTreatment
  return [
    { label: 'comparison', hex: t.comparison.color ?? theme.comparisonColor ?? t.posNeg.neutral },
    { label: 'positive', hex: t.posNeg.positive },
    { label: 'negative', hex: t.posNeg.negative },
    { label: 'warning', hex: t.posNeg.warning },
    { label: 'neutral', hex: t.posNeg.neutral },
  ]
}

/** One-line treatment summary, read off the treatment itself — never re-stated by hand. */
function treatmentSummary(theme: (typeof CHART_THEMES)['optionA']['light'], tooltipNote: string) {
  const t = theme.treatment as ChartTreatment
  return [
    `${t.stroke.curve} ${t.stroke.width}px`,
    `${t.comparison.dash ? 'dashed' : 'solid'} comparison`,
    `${t.grid.dashArray ? 'dotted' : 'solid'} grid`,
    `${t.bar.fill} bars ${t.bar.radius}px`,
    `${t.area.fill} area fill`,
    `${t.legend.markerShape} legends`,
    tooltipNote,
  ].join(' · ')
}

const tokenStrips = OPTIONS.map((option) => {
  const theme = CHART_THEMES[option.id].light
  return {
    ...option,
    theme,
    semantics: semanticSwatches(theme),
    summary: treatmentSummary(theme, option.tooltipNote),
  }
})
</script>

<template>
  <!-- Scoped light preview — the option palettes are tuned for light surfaces and this
       page is the leadership review surface; it never mutates the stored app theme. -->
  <v-theme-provider theme="maropostLight" with-background>
    <div class="cx-root">
      <header class="cx-header">
        <p class="cx-eyebrow">SCOP-312 · Chart visual systems</p>
        <h1 class="cx-title">Chart Visual System Exploration</h1>
        <p class="cx-lede">
          One dashboard, five visualization languages. Layout, widgets, metrics and data are
          identical everywhere — only the visualization layer changes.
        </p>
        <nav class="cx-links" aria-label="Open a live dashboard in each system">
          <a
            v-for="system in ALL_SYSTEMS"
            :key="system.id"
            class="cx-link"
            :href="liveLink(system)"
            target="_blank"
            rel="noopener"
          >
            <span
              class="cx-link__dot"
              :style="{ background: CHART_THEMES[system.id].light.series[0] }"
            />
            {{ system.chartId ? system.name.split(' — ')[0] : 'Current' }}
            <v-icon size="13">external-link</v-icon>
          </a>
        </nav>
      </header>

      <!-- Section 1 — the same Overview chart set under each system -->
      <section class="cx-section" aria-labelledby="cx-panels-heading">
        <h2 id="cx-panels-heading" class="cx-section__title">The dashboard, five ways</h2>

        <section
          v-for="panel in panels"
          :id="`panel-${panel.id}`"
          :key="panel.id"
          class="cx-panel"
        >
          <div class="cx-panel__head">
            <h3 class="cx-panel__name">{{ panel.name }}</h3>
            <p class="cx-panel__philosophy">{{ panel.philosophy }}</p>
            <div class="cx-panel__dots">
              <span
                v-for="(hex, i) in panel.theme.series"
                :key="hex + i"
                class="cx-dot"
                :style="{ background: hex }"
                :title="hex"
              />
            </div>
          </div>

          <PaletteScope
            :theme="panel.theme"
            :chart-id="panel.chartId"
            class="cx-panel__grid"
          >
            <div
              v-for="k in panel.widgets.kpis"
              :key="k.id"
              class="cx-cell cx-cell--kpi"
            >
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="k" :filters="FILTERS" :show-actions="false" />
            </div>

            <div class="cx-cell cx-cell--wide">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.area" :filters="FILTERS" :show-actions="false" />
            </div>
            <div class="cx-cell cx-cell--narrow">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.deviceDonut" :filters="FILTERS" :show-actions="false" />
            </div>

            <div class="cx-cell cx-cell--main">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.line" :filters="FILTERS" :show-actions="false" />
            </div>
            <div class="cx-cell cx-cell--side">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.pie" :filters="FILTERS" :show-actions="false" />
            </div>

            <div class="cx-cell cx-cell--main">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.customers" :filters="FILTERS" :show-actions="false" />
            </div>
            <div class="cx-cell cx-cell--side">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.salesByProduct" :filters="FILTERS" :show-actions="false" />
            </div>

            <div class="cx-cell cx-cell--main cx-cell--tall">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.bar" :filters="FILTERS" :show-actions="false" />
            </div>
            <div class="cx-cell cx-cell--side cx-cell--tall">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.donut" :filters="FILTERS" :show-actions="false" />
            </div>

            <div class="cx-cell cx-cell--full">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="panel.widgets.country" :filters="FILTERS" :show-actions="false" />
            </div>
          </PaletteScope>
        </section>
      </section>

      <!-- Section 2 — same chart, four systems, identical fixture numbers -->
      <section class="cx-section" aria-labelledby="cx-specimen-heading">
        <h2 id="cx-specimen-heading" class="cx-section__title">Chart by chart</h2>
        <p class="cx-section__note">
          The same five chart types under each option, plotting identical fixture numbers.
          The diverging row is the only chart with values below zero — it is what shows each
          system's positive / negative vocabulary.
        </p>

        <div id="specimen-grid" class="cx-specimen">
          <div class="cx-specimen__labels">
            <div class="cx-specimen__corner" />
            <div
              v-for="row in SPECIMEN_ROWS"
              :key="row.key"
              class="cx-specimen__label"
              :style="{ height: `${row.height}px` }"
            >
              <span class="cx-specimen__label-name">{{ row.label }}</span>
              <span class="cx-specimen__label-note">{{ row.note }}</span>
            </div>
          </div>

          <div
            v-for="option in OPTIONS"
            :id="`specimen-${option.chartId}`"
            :key="option.id"
            class="cx-specimen__column"
          >
            <div class="cx-specimen__head">{{ option.name.split(' — ')[1] }}</div>
            <PaletteScope
              v-for="row in SPECIMEN_ROWS"
              :key="row.key"
              :theme="specimenTheme(option.id)"
              :chart-id="option.chartId"
              class="cx-specimen__cell"
              :style="{ height: `${row.height}px` }"
            >
              <DashboardPieWidget
                v-if="row.kind === 'donut'"
                :data="row.data"
                :height="chartHeight(row)"
              />
              <DashboardChartWidget
                v-else
                :data="row.data"
                :widget-type="row.widgetType!"
                :chart-variant="row.chartVariant"
                :height="chartHeight(row)"
              />
            </PaletteScope>
          </div>
        </div>
      </section>

      <!-- Section 3 — the tokens behind each system -->
      <section class="cx-section" aria-labelledby="cx-tokens-heading">
        <h2 id="cx-tokens-heading" class="cx-section__title">Tokens</h2>

        <div class="cx-tokens">
          <article
            v-for="strip in tokenStrips"
            :id="`tokens-${strip.chartId}`"
            :key="strip.id"
            class="cx-token-card"
          >
            <h3 class="cx-token-card__name">{{ strip.name }}</h3>

            <div class="cx-token-group">
              <p class="cx-token-group__label">Series</p>
              <div class="cx-token-row">
                <div v-for="(hex, i) in strip.theme.series" :key="hex + i" class="cx-swatch">
                  <span class="cx-swatch__chip" :style="{ background: hex }" />
                  <span class="cx-swatch__slot">{{ SERIES_SLOTS[i] }}</span>
                  <span class="cx-swatch__hex">{{ hex }}</span>
                </div>
              </div>
            </div>

            <div class="cx-token-group">
              <p class="cx-token-group__label">Axis ramp</p>
              <div class="cx-token-row">
                <div v-for="(hex, i) in strip.theme.axis" :key="hex + i" class="cx-swatch">
                  <span class="cx-swatch__chip" :style="{ background: hex }" />
                  <span class="cx-swatch__slot">a{{ i + 1 }}</span>
                  <span class="cx-swatch__hex">{{ hex }}</span>
                </div>
              </div>
            </div>

            <div class="cx-token-group">
              <p class="cx-token-group__label">Semantic</p>
              <div class="cx-token-row">
                <div v-for="s in strip.semantics" :key="s.label" class="cx-swatch">
                  <span class="cx-swatch__chip" :style="{ background: s.hex }" />
                  <span class="cx-swatch__slot">{{ s.label }}</span>
                  <span class="cx-swatch__hex">{{ s.hex }}</span>
                </div>
              </div>
            </div>

            <p class="cx-token-card__summary">{{ strip.summary }}</p>
          </article>
        </div>
      </section>

      <footer class="cx-footer">
        Maropost design sandbox — mock data, real components. Section 1 renders the production
        dashboard widgets; section 2 uses fixed fixture numbers so every column is comparable.
      </footer>
    </div>
  </v-theme-provider>
</template>

<style scoped>
.cx-root {
  min-height: 100dvh;
  width: 100%;
  background: var(--surface-canvas);
  color: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
  padding: 48px clamp(16px, 4vw, 56px) 72px;
  box-sizing: border-box;
}

/* Header */
.cx-header {
  max-width: 900px;
  margin: 0 auto 48px;
  text-align: center;
}
.cx-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-default);
}
.cx-title {
  margin: 0 0 12px;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.02em;
}
.cx-lede {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.cx-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.cx-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  background: var(--surface-primary);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;
}
.cx-link:hover {
  border-color: var(--accent-default);
  color: var(--accent-default);
}
.cx-link__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

/* Sections */
.cx-section {
  max-width: 1280px;
  margin: 0 auto 56px;
}
.cx-section__title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.cx-section__note {
  margin: 0 0 20px;
  max-width: 720px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Section 1 — panels */
.cx-panel {
  margin-top: 24px;
  padding: 24px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}
.cx-panel__head {
  margin-bottom: 20px;
}
.cx-panel__name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.cx-panel__philosophy {
  margin: 6px 0 0;
  max-width: 720px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-muted);
}
.cx-panel__dots {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}
.cx-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.cx-panel__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
.cx-cell {
  min-width: 0;
}
/* Heights reproduce the real dashboard grid at 1440px, so leadership judges the
   charts at the size they actually ship: row unit ~45.75px + 16px gap, spans
   h=4 (KPI) / h=8 (charts) / h=9 (bar + ring donut) — measured 230 / 478 / 540. */
.cx-cell--kpi {
  grid-column: span 3;
  height: 230px;
}
.cx-cell--wide {
  grid-column: span 8;
  height: 478px;
}
.cx-cell--narrow {
  grid-column: span 4;
  height: 478px;
}
.cx-cell--main {
  grid-column: span 7;
  height: 478px;
}
.cx-cell--side {
  grid-column: span 5;
  height: 478px;
}
.cx-cell--tall {
  height: 540px;
}
/* h=7 on the real grid — Sessions by country runs full width here because its
   dashboard partner (Recent orders) is an unthemed table. */
.cx-cell--full {
  grid-column: span 12;
  height: 432px;
}

/* Section 2 — specimen grid */
.cx-specimen {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  overflow-x: auto;
  padding: 20px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}
.cx-specimen__labels {
  flex: 0 0 116px;
}
.cx-specimen__corner {
  height: 34px;
}
.cx-specimen__label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding-right: 8px;
  border-top: 1px solid var(--border-subtle);
}
.cx-specimen__label-name {
  font-size: 13px;
  font-weight: 650;
}
.cx-specimen__label-note {
  font-size: 11.5px;
  color: var(--text-muted);
}
.cx-specimen__column {
  flex: 1 1 0;
  min-width: 240px;
}
.cx-specimen__head {
  height: 34px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}
.cx-specimen__cell {
  padding: 10px;
  border-top: 1px solid var(--border-subtle);
  box-sizing: border-box;
  overflow: hidden;
}

/* Section 3 — token strips */
.cx-tokens {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.cx-token-card {
  padding: 20px 22px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}
.cx-token-card__name {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
}
.cx-token-group + .cx-token-group {
  margin-top: 14px;
}
.cx-token-group__label {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.cx-token-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cx-swatch {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 62px;
}
.cx-swatch__chip {
  height: 26px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.cx-swatch__slot {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.cx-swatch__hex {
  font-size: 10.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-muted);
  text-transform: uppercase;
}
.cx-token-card__summary {
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.cx-footer {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 1100px) {
  .cx-tokens {
    grid-template-columns: 1fr;
  }
  .cx-cell--kpi {
    grid-column: span 6;
  }
  .cx-cell--wide,
  .cx-cell--narrow,
  .cx-cell--main,
  .cx-cell--side {
    grid-column: span 12;
  }
}
</style>
