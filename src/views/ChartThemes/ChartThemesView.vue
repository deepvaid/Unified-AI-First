<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import type { ApexOptions } from 'apexcharts'
import { CHART_PALETTES, applyChartTheme, chartLabelColor, type ChartPalette } from '@/plugins/chartPalette'
import { useAppTheme } from '@/composables/useAppTheme'
import { useCopilotStore } from '@/stores/useCopilot'

// Force light mode — Ross's agreed direction is the light theme; the review
// happens on a light surface, which is what the palettes are tuned for. Close
// the Da Vinci drawer so it never overlaps the side-by-side comparison.
const { setMode } = useAppTheme()
const copilot = useCopilotStore()
// The Da Vinci drawer opens during app init and would cover the right column of
// the comparison. Keep it closed for the duration of this review page — the
// watcher is tied to this component and stops automatically on unmount, so other
// routes are unaffected.
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })
onMounted(() => setMode('light'))

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

const ACCOUNT_ID = '2000290'

// ── Shared demo data (identical across every palette so only colour varies) ──
const CHANNELS = [
  { name: 'Direct', base: 8200, amp: 900, phase: 0 },
  { name: 'Email', base: 6400, amp: 1200, phase: 1 },
  { name: 'Paid Search', base: 5200, amp: 800, phase: 2 },
  { name: 'Social', base: 3800, amp: 1400, phase: 3 },
  { name: 'Organic', base: 4600, amp: 700, phase: 4 },
  { name: 'Referral', base: 2400, amp: 600, phase: 5 },
]
const POINTS = 8
const trendLabels = Array.from({ length: POINTS }, (_, i) => `W${i + 1}`)
const trendSeries = CHANNELS.map((c) => ({
  name: c.name,
  data: trendLabels.map((_, i) => Math.round(c.base + c.amp * Math.sin((i + c.phase) * 0.6) + i * 60)),
}))
const barSeries = [{ name: 'Revenue', data: CHANNELS.map((c) => c.base) }]
const mix = [31, 24, 17, 12, 10, 6]
const mixLabels = CHANNELS.map((c) => c.name)

function fmtCurrency(v: number): string {
  return v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`
}

// ── Option builders (depend only on the palette's colours) ──
const base = applyChartTheme()
const yLabelStyle = { colors: chartLabelColor, fontSize: '12px', fontWeight: 500 }

function lineOptions(colors: string[]): ApexOptions {
  return {
    ...base,
    colors,
    chart: { ...base.chart, type: 'line', height: 240, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 500 },
    xaxis: { ...base.xaxis, categories: trendLabels },
    yaxis: { labels: { formatter: (v: number) => fmtCurrency(v), style: yLabelStyle } },
    tooltip: { ...base.tooltip, y: { formatter: (v: number) => fmtCurrency(v) } },
  }
}

function columnOptions(colors: string[]): ApexOptions {
  return {
    ...base,
    colors,
    chart: { ...base.chart, type: 'bar', height: 220, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: '52%', distributed: true } },
    legend: { show: false },
    xaxis: { ...base.xaxis, categories: mixLabels },
    yaxis: { labels: { formatter: (v: number) => fmtCurrency(v), style: yLabelStyle } },
    tooltip: { ...base.tooltip, y: { formatter: (v: number) => fmtCurrency(v) } },
  }
}

function hbarOptions(colors: string[]): ApexOptions {
  return {
    ...base,
    colors,
    chart: { ...base.chart, type: 'bar', height: 220, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, barHeight: '58%', distributed: true, horizontal: true } },
    legend: { show: false },
    xaxis: { ...base.xaxis, categories: mixLabels, labels: { ...base.xaxis?.labels, formatter: (v: string) => fmtCurrency(Number(v)) } },
    tooltip: { ...base.tooltip, x: { show: true }, y: { formatter: (v: number) => fmtCurrency(v) } },
  }
}

function donutOptions(colors: string[]): ApexOptions {
  return {
    colors,
    chart: { type: 'donut', height: 240, fontFamily: 'Inter, system-ui, sans-serif', toolbar: { show: false } },
    labels: mixLabels,
    legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, markers: { size: 8 } },
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%`, style: { fontSize: '11px', fontWeight: 600 }, dropShadow: { enabled: false } },
    stroke: { width: 2, colors: ['#ffffff'] },
    plotOptions: { pie: { donut: { size: '62%', labels: { show: false } }, expandOnClick: false } },
    tooltip: { y: { formatter: (v: number) => `${v.toFixed(0)}%` } },
  }
}

// KPI sparkline as an inline SVG polyline (matches DashboardKpiWidget's approach).
function sparkPoints(data: number[]): string {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = 100 / (data.length - 1)
  return data.map((v, i) => `${(i * step).toFixed(1)},${(36 - ((v - min) / range) * 32).toFixed(1)}`).join(' ')
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

const KPI_TILES = [
  { label: 'Revenue', value: '$128.4k', delta: '+12.4%', up: true, spark: [42, 48, 45, 53, 58, 55, 64, 71] },
  { label: 'Orders', value: '3,412', delta: '+8.1%', up: true, spark: [30, 32, 31, 36, 34, 40, 43, 46] },
  { label: 'Avg. order value', value: '$37.60', delta: '−2.2%', up: false, spark: [50, 49, 51, 48, 47, 46, 45, 44] },
]

const panels = computed(() =>
  PALETTE_META.map((meta) => {
    const colors = CHART_PALETTES[meta.id]
    return {
      ...meta,
      colors,
      liveLink: `/accounts/${ACCOUNT_ID}/dashboard?chart=${meta.id}`,
      lineOpts: lineOptions(colors),
      colOpts: columnOptions(colors),
      hbarOpts: hbarOptions(colors),
      donutOpts: donutOptions(colors),
    }
  }),
)

const blueColors = CHART_PALETTES.blue
const blueLineOpts = lineOptions(blueColors)
const blueDonutOpts = donutOptions(blueColors)
</script>

<template>
  <div class="ct-root">
    <header class="ct-header">
      <p class="ct-eyebrow">SCOP-312 · Dashboard chart colours</p>
      <h1 class="ct-title">Four chart-colour directions</h1>
      <p class="ct-lede">
        Same data, same widgets — only the colour palette changes. Each direction answers a
        specific piece of the feedback and is validated for contrast and colour-blind
        readability. Open any one live in the dashboard from its panel.
      </p>
    </header>

    <!-- Current baseline reference -->
    <section class="ct-reference">
      <div class="ct-reference__label">
        <span class="ct-chip ct-chip--muted">Current baseline</span>
        <h2 class="ct-reference__name">Blue</h2>
        <p class="ct-reference__note">Today's single-hue blue — shown for reference.</p>
        <div class="ct-swatches">
          <span
            v-for="c in blueColors"
            :key="c"
            class="ct-swatch"
            :style="{ background: c }"
            :title="c"
          />
        </div>
      </div>
      <div class="ct-reference__charts">
        <ApexChart type="line" height="200" width="100%" :options="blueLineOpts" :series="trendSeries" />
        <ApexChart type="donut" height="200" width="100%" :options="blueDonutOpts" :series="mix" />
      </div>
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
            <span
              v-for="c in p.colors"
              :key="c"
              class="ct-swatch"
              :style="{ background: c }"
              :title="c"
            >
              <span class="ct-swatch__hex">{{ c }}</span>
            </span>
          </div>
        </div>

        <!-- KPI + sparkline row -->
        <div class="ct-kpis">
          <div v-for="(k, i) in KPI_TILES" :key="k.label" class="ct-kpi">
            <span class="ct-kpi__label">{{ k.label }}</span>
            <span class="ct-kpi__value">{{ k.value }}</span>
            <span class="ct-kpi__delta" :class="k.up ? 'is-up' : 'is-down'">{{ k.delta }}</span>
            <svg class="ct-kpi__spark" viewBox="0 0 100 40" preserveAspectRatio="none">
              <polyline
                :points="sparkPoints(k.spark)"
                fill="none"
                :stroke="p.colors[i % p.colors.length]"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <!-- Charts -->
        <div class="ct-charts">
          <div class="ct-chart ct-chart--wide">
            <p class="ct-chart__title">Revenue by channel</p>
            <ApexChart type="line" height="240" width="100%" :options="p.lineOpts" :series="trendSeries" />
          </div>
          <div class="ct-chart">
            <p class="ct-chart__title">Traffic mix</p>
            <ApexChart type="donut" height="240" width="100%" :options="p.donutOpts" :series="mix" />
          </div>
          <div class="ct-chart">
            <p class="ct-chart__title">Revenue by channel (bar)</p>
            <ApexChart type="bar" height="220" width="100%" :options="p.colOpts" :series="barSeries" />
          </div>
          <div class="ct-chart">
            <p class="ct-chart__title">Top channels</p>
            <ApexChart type="bar" height="220" width="100%" :options="p.hbarOpts" :series="barSeries" />
          </div>
        </div>

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

/* KPI tiles */
.ct-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.ct-kpi {
  border: 1px solid #eef0f2;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ct-kpi__label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ct-kpi__value {
  font-size: 18px;
  font-weight: 700;
}
.ct-kpi__delta {
  font-size: 11px;
  font-weight: 600;
}
.ct-kpi__delta.is-up {
  color: #15803d;
}
.ct-kpi__delta.is-down {
  color: #b91c1c;
}
.ct-kpi__spark {
  width: 100%;
  height: 26px;
  margin-top: 4px;
}

/* Charts */
.ct-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.ct-chart {
  border: 1px solid #eef0f2;
  border-radius: 10px;
  padding: 12px 12px 4px;
  min-width: 0;
  overflow: hidden;
}
.ct-chart--wide {
  grid-column: 1 / -1;
}
.ct-chart__title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 4px;
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
