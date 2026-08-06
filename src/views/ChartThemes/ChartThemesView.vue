<script setup lang="ts">
import { watch } from 'vue'
import { CHART_THEMES, type ChartPalette } from '@/plugins/chartPalette'
import { useCopilotStore } from '@/stores/useCopilot'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardFilterState,
  DashboardMetricId,
  DashboardWidget,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import PaletteScope from './PaletteScope.vue'

// Keep the Da Vinci drawer closed so it never overlaps the side-by-side comparison.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const ACCOUNT_ID = '2000290'

// Real dashboard filters (mirrors createDefaultFilters() in useDashboards.ts).
const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

// Build a genuine DashboardWidget so the comparison renders the exact production widgets
// (DashboardWidgetCard → useWidgetData), not look-alikes.
let widgetSeq = 0
function widget(
  title: string,
  metricId: DashboardMetricId,
  type: DashboardWidgetType,
  w: number,
  h: number,
  chartVariant?: DashboardWidget['chartVariant'],
): DashboardWidget {
  const metric = getMetricDescriptor(metricId)
  return {
    id: `ct-${metricId}-${widgetSeq++}`,
    type,
    title,
    dataSource: metric?.dataSource ?? 'commerce',
    metricId,
    chartVariant,
    layout: { x: 0, y: 0, w, h, minW: 2, minH: 2 },
    drilldown: metric?.drilldown ?? { routeName: 'Dashboard', label: title },
  }
}

// One shared widget set — the same layout every panel renders, so only colour differs.
function panelWidgets() {
  return {
    kpis: [
      widget('Revenue', 'commerce_revenue', 'kpi', 3, 4),
      widget('Orders', 'commerce_orders', 'kpi', 3, 4),
      widget('Open Rate', 'marketing_open_rate', 'kpi', 3, 4),
    ],
    line: widget('Revenue by channel', 'demo_channel_trend', 'timeseries', 7, 8, 'line'),
    donut: widget('Traffic mix', 'demo_channel_mix', 'pie', 5, 8),
    bar: widget('Revenue by Channel', 'commerce_revenue_by_channel', 'bar', 5, 7),
  }
}

interface PanelMeta {
  id: Exclude<ChartPalette, 'blue'>
  descriptor: string
}

const PANEL_META: PanelMeta[] = [
  { id: 'shopify', descriptor: 'Polaris Viz grammar — flat marks and a dashed previous-period line — on one Maropost-blue-to-teal family. The active default.' },
  { id: 'indigo', descriptor: 'One indigo axis, deep to sky — the closest read of the Hyper Charts reference.' },
  { id: 'ocean', descriptor: "Maropost blue flowing into turquoise — the brand's sea-blue heritage as one gradient." },
  { id: 'aurora', descriptor: 'Blue drifting into violet — bolder, still one unified axis.' },
]

const panels = PANEL_META.map((meta) => ({
  ...meta,
  theme: CHART_THEMES[meta.id].light,
  liveLink: `/accounts/${ACCOUNT_ID}/dashboard?chart=${meta.id}`,
  widgets: panelWidgets(),
}))

const blueTheme = CHART_THEMES.blue.light
const blueWidgets = panelWidgets()
</script>

<template>
  <!-- Scoped light preview — palettes are tuned for light surfaces; does not mutate stored app theme. -->
  <v-theme-provider theme="maropostLight" with-background class="ct-light-scope">
  <div class="ct-root">
    <header class="ct-header">
      <p class="ct-eyebrow">SCOP-312 · Gradient chart themes</p>
      <h1 class="ct-title">Three gradient chart themes</h1>
      <p class="ct-lede">
        The "soft gradient" round. Each theme unifies every chart on a single colour axis —
        marks carry soft gradients, bars get rounded caps and floating values, lines and donuts
        a soft glow — styled after the Hyper Charts UI kit. Same dashboard widgets, same data,
        only the theme changes. Open any one live from its panel.
      </p>
    </header>

    <!-- Current baseline reference -->
    <section class="ct-reference">
      <div class="ct-reference__label">
        <span class="ct-chip ct-chip--muted">Previous baseline</span>
        <h2 class="ct-reference__name">Blue</h2>
        <p class="ct-reference__note">The former flat single-hue blue — shown for reference.</p>
        <div class="ct-swatches">
          <span class="ct-axis" :style="{ background: `linear-gradient(90deg, ${blueTheme.axis.join(', ')})` }" />
          <div class="ct-dots">
            <span v-for="c in blueTheme.series" :key="c" class="ct-dot" :style="{ background: c }" :title="c" />
          </div>
        </div>
      </div>
      <PaletteScope :theme="blueTheme" class="ct-reference__charts">
        <div class="ct-cell ct-cell--chart">
          <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="blueWidgets.line" :filters="FILTERS" :show-actions="false" />
        </div>
        <div class="ct-cell ct-cell--chart">
          <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="blueWidgets.donut" :filters="FILTERS" :show-actions="false" />
        </div>
      </PaletteScope>
    </section>

    <!-- The three gradient themes -->
    <div class="ct-grid">
      <section v-for="p in panels" :key="p.id" class="ct-panel">
        <div class="ct-panel__head">
          <div class="ct-panel__title">
            <h2 class="ct-panel__name">{{ p.theme.label }}</h2>
          </div>
          <p class="ct-panel__tag">{{ p.descriptor }}</p>
          <div class="ct-swatches">
            <span class="ct-axis" :style="{ background: `linear-gradient(90deg, ${p.theme.axis.join(', ')})` }" />
            <div class="ct-dots">
              <span v-for="c in p.theme.series" :key="c" class="ct-dot" :style="{ background: c }" :title="c" />
            </div>
          </div>
        </div>

        <PaletteScope :theme="p.theme" class="ct-panel__widgets">
          <!-- Bar leads (the Hyper signature), then multi-series line, then donut -->
          <div class="ct-cell ct-cell--chart">
            <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.bar" :filters="FILTERS" :show-actions="false" />
          </div>
          <div class="ct-cell ct-cell--chart">
            <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.line" :filters="FILTERS" :show-actions="false" />
          </div>
          <div class="ct-cell ct-cell--chart">
            <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.donut" :filters="FILTERS" :show-actions="false" />
          </div>

          <!-- KPI row -->
          <div class="ct-kpis">
            <div v-for="k in p.widgets.kpis" :key="k.id" class="ct-cell ct-cell--kpi">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="k" :filters="FILTERS" :show-actions="false" />
            </div>
          </div>
        </PaletteScope>

        <div class="ct-panel__foot">
          <RouterLink class="ct-cta" :to="p.liveLink">
            Open live dashboard with this theme
            <v-icon size="16">arrow-right</v-icon>
          </RouterLink>
        </div>
      </section>
    </div>

    <footer class="ct-footer">
      Maropost design sandbox — mock data, real system. Gradient effects use native ApexCharts
      options; each theme runs on one unified colour axis, validated on a light surface.
    </footer>
  </div>
  </v-theme-provider>
</template>

<style scoped>
.ct-root {
  min-height: 100dvh;
  width: 100%;
  background: var(--surface-canvas);
  color: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
  padding: 40px clamp(16px, 4vw, 56px) 64px;
  box-sizing: border-box;
}

.ct-header {
  max-width: 900px;
  margin: 0 auto 32px;
  text-align: center;
}
.ct-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-default);
  margin: 0 0 8px;
}
.ct-title {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.ct-lede {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* Baseline reference */
.ct-reference {
  max-width: 1280px;
  margin: 0 auto 40px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: center;
  padding: 20px 24px;
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}
.ct-reference__name {
  font-size: 20px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.ct-reference__note {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 12px;
}
.ct-reference__charts {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  min-width: 0;
}

/* Grid of options */
.ct-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.ct-panel {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ct-panel__head {
  margin-bottom: 16px;
}
.ct-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ct-panel__name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
}
.ct-panel__tag {
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 14px;
}

.ct-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.ct-chip--muted {
  background: var(--surface-secondary);
  color: var(--text-muted);
}

/* Swatches — one continuous gradient chip (the theme axis) + the 6 series dots below */
.ct-swatches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ct-axis {
  display: block;
  width: 100%;
  height: 28px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.ct-dots {
  display: flex;
  gap: 6px;
}
.ct-dot {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

/* Widget cells — give the real widget cards a fixed height (the app grid usually sizes them) */
.ct-panel__widgets {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ct-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ct-cell {
  min-width: 0;
}
.ct-cell--kpi {
  height: 168px;
}
.ct-cell--chart {
  height: 300px;
}

.ct-panel__foot {
  margin-top: auto;
  padding-top: 18px;
}
.ct-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-default);
  text-decoration: none;
}
.ct-cta:hover {
  text-decoration: underline;
}

.ct-footer {
  max-width: 1280px;
  margin: 40px auto 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .ct-grid {
    grid-template-columns: 1fr;
  }
  .ct-reference {
    grid-template-columns: 1fr;
  }
  .ct-reference__charts {
    grid-template-columns: 1fr;
  }
}
</style>
