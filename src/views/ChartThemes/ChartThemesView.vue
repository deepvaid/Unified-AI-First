<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { CHART_PALETTES, type ChartPalette } from '@/plugins/chartPalette'
import { useAppTheme } from '@/composables/useAppTheme'
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

// Force light mode — Ross's agreed direction is the light theme; the review happens on a
// light surface, which the palettes are tuned for. Keep the Da Vinci drawer closed so it
// never overlaps the side-by-side comparison (it opens during app init).
const { setMode } = useAppTheme()
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })
onMounted(() => setMode('light'))

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

interface PaletteMeta {
  id: Exclude<ChartPalette, 'blue'>
  name: string
  tag: string
  recommended?: boolean
}

const PALETTE_META: PaletteMeta[] = [
  { id: 'seaglass', name: 'Sea Glass', tag: 'Turquoise / sea-blue heritage · soft & fresh' },
  { id: 'harbor', name: 'Harbor', tag: 'Blue + teal base with warm accents · on-brand contrast', recommended: true },
  { id: 'electric', name: 'Electric', tag: 'Bold electric blue (#162ADE) · modern & confident' },
  { id: 'spectrum', name: 'Soft Spectrum', tag: 'Muted full-spectrum · maximum series distinction' },
]

const panels = PALETTE_META.map((meta) => ({
  ...meta,
  colors: CHART_PALETTES[meta.id],
  liveLink: `/accounts/${ACCOUNT_ID}/dashboard?chart=${meta.id}`,
  widgets: panelWidgets(),
}))

const blueColors = CHART_PALETTES.blue
const blueWidgets = panelWidgets()
</script>

<template>
  <div class="ct-root">
    <header class="ct-header">
      <p class="ct-eyebrow">SCOP-312 · Dashboard chart colours</p>
      <h1 class="ct-title">Four chart-colour directions</h1>
      <p class="ct-lede">
        The exact dashboard widgets, same data — only the colour palette changes. Each
        direction answers a specific piece of the feedback and is validated for contrast and
        colour-blind readability. Open any one live in the dashboard from its panel.
      </p>
    </header>

    <!-- Current baseline reference -->
    <section class="ct-reference">
      <div class="ct-reference__label">
        <span class="ct-chip ct-chip--muted">Current baseline</span>
        <h2 class="ct-reference__name">Blue</h2>
        <p class="ct-reference__note">Today's single-hue blue — shown for reference.</p>
        <div class="ct-swatches">
          <span v-for="c in blueColors" :key="c" class="ct-swatch" :style="{ background: c }" :title="c" />
        </div>
      </div>
      <PaletteScope :colors="blueColors" class="ct-reference__charts">
        <div class="ct-cell ct-cell--chart">
          <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="blueWidgets.line" :filters="FILTERS" :show-actions="false" />
        </div>
        <div class="ct-cell ct-cell--chart">
          <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="blueWidgets.donut" :filters="FILTERS" :show-actions="false" />
        </div>
      </PaletteScope>
    </section>

    <!-- The four options -->
    <div class="ct-grid">
      <section v-for="p in panels" :key="p.id" class="ct-panel">
        <div class="ct-panel__head">
          <div class="ct-panel__title">
            <h2 class="ct-panel__name">{{ p.name }}</h2>
            <span v-if="p.recommended" class="ct-chip ct-chip--rec">Recommended</span>
          </div>
          <p class="ct-panel__tag">{{ p.tag }}</p>
          <div class="ct-swatches">
            <span v-for="c in p.colors" :key="c" class="ct-swatch" :style="{ background: c }" :title="c">
              <span class="ct-swatch__hex">{{ c }}</span>
            </span>
          </div>
        </div>

        <PaletteScope :colors="p.colors" class="ct-panel__widgets">
          <!-- KPI row -->
          <div class="ct-kpis">
            <div v-for="k in p.widgets.kpis" :key="k.id" class="ct-cell ct-cell--kpi">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="k" :filters="FILTERS" :show-actions="false" />
            </div>
          </div>

          <!-- Charts -->
          <div class="ct-cell ct-cell--chart ct-cell--wide">
            <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.line" :filters="FILTERS" :show-actions="false" />
          </div>
          <div class="ct-charts-row">
            <div class="ct-cell ct-cell--chart">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.donut" :filters="FILTERS" :show-actions="false" />
            </div>
            <div class="ct-cell ct-cell--chart">
              <DashboardWidgetCard :account-id="ACCOUNT_ID" :widget="p.widgets.bar" :filters="FILTERS" :show-actions="false" />
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
      Maropost design sandbox — mock data, real system. Palettes validated for lightness,
      chroma, colour-blind separation and contrast on a light surface.
    </footer>
  </div>
</template>

<style scoped>
.ct-root {
  min-height: 100dvh;
  width: 100%;
  background: #f9fafb;
  color: #111827;
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
  color: #1a56db;
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
  color: #4b5563;
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.ct-reference__name {
  font-size: 20px;
  font-weight: 700;
  margin: 8px 0 4px;
}
.ct-reference__note {
  font-size: 13px;
  color: #6b7280;
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
  background: #ffffff;
  border: 1px solid #e5e7eb;
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
  color: #6b7280;
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
.ct-chip--rec {
  background: #dcfce7;
  color: #166534;
}
.ct-chip--muted {
  background: #f3f4f6;
  color: #6b7280;
}

.ct-swatches {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ct-swatch {
  position: relative;
  width: 100%;
  flex: 1 1 0;
  min-width: 44px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 3px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.ct-swatch__hex {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  letter-spacing: 0.02em;
}

/* Widget cells — give the real widget cards a fixed height (the app grid usually sizes them) */
.ct-panel__widgets {
  display: block;
}
.ct-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.ct-charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
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
  color: #1a56db;
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
  color: #9ca3af;
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
