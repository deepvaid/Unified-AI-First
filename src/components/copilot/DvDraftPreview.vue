<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardWidgetDraft, DashboardChartVariant } from '@/stores/dashboards/types'

type Density = 'comfortable' | 'compact' | 'expanded'

interface Props {
  draft: DashboardWidgetDraft
  density?: Density
}

const props = withDefaults(defineProps<Props>(), {
  density: 'comfortable',
})

interface KpiCell {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'flat'
}

interface BarSpec {
  label: string
  value: number
  faded?: boolean
}

interface MiniTableSpec {
  headers: { label: string; align?: 'start' | 'end' }[]
  rows: Array<Array<{ value: string; align?: 'start' | 'end'; muted?: boolean }>>
}

interface LineSpec {
  points: Array<{ x: number; y: number }>
  variant: DashboardChartVariant
}

const KPI_DEFAULT: KpiCell[] = [
  { label: 'Sent', value: '241,691', delta: '8%', trend: 'up' },
  { label: 'Open rate', value: '32.4%', delta: '4%', trend: 'up' },
  { label: 'Click rate', value: '9.1%', delta: '1%', trend: 'down' },
  { label: 'Revenue', value: '$612K', delta: '14%', trend: 'up' },
]
const KPI_REVENUE: KpiCell[] = [
  { label: 'Revenue', value: '$842K', delta: '12%', trend: 'up' },
  { label: 'Orders', value: '14,326', delta: '6%', trend: 'up' },
  { label: 'AOV', value: '$58.40', delta: 'flat', trend: 'flat' },
  { label: 'Conv.', value: '1,284', delta: '3%', trend: 'down' },
]
const KPI_ORDERS: KpiCell[] = [
  { label: 'Orders', value: '14,326', delta: '6%', trend: 'up' },
  { label: 'Units', value: '38,210', delta: '4%', trend: 'up' },
  { label: 'Returns', value: '412', delta: '2%', trend: 'down' },
  { label: 'AOV', value: '$58.40', delta: 'flat', trend: 'flat' },
]
const KPI_CONTACTS: KpiCell[] = [
  { label: 'Contacts', value: '184,302', delta: '5%', trend: 'up' },
  { label: 'New', value: '12,118', delta: '11%', trend: 'up' },
  { label: 'Churned', value: '1,402', delta: '2%', trend: 'down' },
  { label: 'Active', value: '76%', delta: '3%', trend: 'up' },
]

function pickKpiPreset(metricId: string): KpiCell[] {
  if (metricId.includes('revenue') || metricId.includes('aov')) return KPI_REVENUE
  if (metricId.includes('order')) return KPI_ORDERS
  if (metricId.includes('contact') || metricId.includes('audience')) return KPI_CONTACTS
  return KPI_DEFAULT
}

const kpiCells = computed<KpiCell[]>(() => pickKpiPreset(props.draft.metricId))

const barData = computed<BarSpec[]>(() => {
  const labelHint = (props.draft.dimension ?? props.draft.metricId ?? '').toLowerCase()
  if (labelHint.includes('channel')) {
    return [
      { label: 'Email', value: 86 },
      { label: 'SMS', value: 64 },
      { label: 'Push', value: 96 },
      { label: 'Social', value: 48 },
      { label: 'Web', value: 30, faded: true },
    ]
  }
  if (labelHint.includes('campaign') || labelHint.includes('email')) {
    return [
      { label: 'Promo', value: 86 },
      { label: 'Welcome', value: 60 },
      { label: 'Cart', value: 96 },
      { label: 'Receipts', value: 46 },
      { label: 'Re-eng.', value: 30, faded: true },
    ]
  }
  return [
    { label: 'Mon', value: 60 },
    { label: 'Tue', value: 84 },
    { label: 'Wed', value: 72 },
    { label: 'Thu', value: 96 },
    { label: 'Fri', value: 50, faded: true },
  ]
})

const barTotal = computed(() => barData.value.reduce((sum, b) => sum + b.value, 0))

const lineSpec = computed<LineSpec>(() => {
  const variant = props.draft.chartVariant ?? 'line'
  const ys = [110, 96, 82, 70, 64, 48, 38]
  const stepX = 320 / (ys.length - 1)
  return {
    variant,
    points: ys.map((y, i) => ({ x: Math.round(i * stepX), y })),
  }
})

const linePath = computed(() => lineSpec.value.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const lineAreaPath = computed(() => `${linePath.value} L320,130 L0,130 Z`)

const tableSpec = computed<MiniTableSpec>(() => {
  const labelHint = (props.draft.metricId ?? '').toLowerCase()
  if (labelHint.includes('open') || labelHint.includes('click') || labelHint.includes('email')) {
    return {
      headers: [
        { label: 'Campaign', align: 'start' },
        { label: 'Open', align: 'end' },
        { label: 'Rev', align: 'end' },
      ],
      rows: [
        [{ value: 'Spring Sale · NA' }, { value: '34.1%', align: 'end' }, { value: '$184K', align: 'end' }],
        [{ value: 'VIP Restock' }, { value: '52.7%', align: 'end' }, { value: '$142K', align: 'end' }],
        [{ value: 'Welcome · APAC' }, { value: '29.6%', align: 'end' }, { value: '$96K', align: 'end' }],
        [{ value: 'Cart abandon · 24h' }, { value: '41.2%', align: 'end' }, { value: '$78K', align: 'end' }],
        [{ value: 'Loyalty re-engage' }, { value: '22.4%', align: 'end' }, { value: '$54K', align: 'end' }],
      ],
    }
  }
  return {
    headers: [
      { label: 'Item', align: 'start' },
      { label: 'Count', align: 'end' },
      { label: 'Rev', align: 'end' },
    ],
    rows: [
      [{ value: 'Top performer' }, { value: '842', align: 'end' }, { value: '$184K', align: 'end' }],
      [{ value: 'Runner-up' }, { value: '512', align: 'end' }, { value: '$142K', align: 'end' }],
      [{ value: 'Mid-tier' }, { value: '316', align: 'end' }, { value: '$96K', align: 'end' }],
      [{ value: 'Long-tail' }, { value: '184', align: 'end' }, { value: '$78K', align: 'end' }],
      [{ value: 'Tail' }, { value: '102', align: 'end' }, { value: '$54K', align: 'end' }],
    ],
  }
})

const pieSlices = computed(() => [
  { value: 38, color: 'rgb(var(--v-theme-primary))' },
  { value: 26, color: 'color-mix(in oklch, rgb(var(--v-theme-primary)) 75%, transparent)' },
  { value: 18, color: 'color-mix(in oklch, rgb(var(--v-theme-primary)) 50%, transparent)' },
  { value: 18, color: 'color-mix(in oklch, rgb(var(--v-theme-primary)) 28%, transparent)' },
])

const previewKind = computed<'kpi' | 'bar' | 'line' | 'area' | 'pie' | 'table' | 'activity'>(() => {
  switch (props.draft.type) {
    case 'kpi':
      return 'kpi'
    case 'bar':
      return 'bar'
    case 'pie':
      return 'pie'
    case 'table':
      return 'table'
    case 'activity':
      return 'activity'
    case 'timeseries':
    default:
      return props.draft.chartVariant === 'area' ? 'area' : 'line'
  }
})

const activityItems = [
  { icon: 'mail', title: 'Welcome series · APAC', meta: 'Sent · 2m ago' },
  { icon: 'shopping-cart', title: 'Cart abandon recovery', meta: 'Triggered · 5m ago' },
  { icon: 'users', title: 'VIP segment refreshed', meta: 'Audience · 12m ago' },
  { icon: 'megaphone', title: 'Spring Sale wave 3', meta: 'Scheduled · 1h ago' },
]
</script>

<template>
  <div class="dv-draft-preview" :data-density="density" :data-kind="previewKind">
    <!-- KPI quad (2×2) -->
    <div v-if="previewKind === 'kpi'" class="dv-kpi-quad">
      <div v-for="(cell, idx) in kpiCells" :key="idx" class="dv-kpi-quad__cell">
        <div class="dv-eyebrow">{{ cell.label }}</div>
        <div class="dv-kpi-quad__row">
          <div class="dv-kpi-quad__v">{{ cell.value }}</div>
          <span class="dv-delta" :class="`dv-delta--${cell.trend}`">
            <v-icon size="12">{{ cell.trend === 'up' ? 'trending-up' : cell.trend === 'down' ? 'trending-down' : 'minus' }}</v-icon>
            {{ cell.delta }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bar chart -->
    <div v-else-if="previewKind === 'bar'" class="dv-bar-chart">
      <div class="dv-bar-chart__legend">
        <span>Total <strong>{{ barTotal }}K</strong></span>
        <span>vs prev <strong class="dv-bar-chart__pct">+14%</strong></span>
      </div>
      <svg class="dv-bar-chart__svg" viewBox="0 0 320 130" preserveAspectRatio="none">
        <line x1="0" y1="20"  x2="320" y2="20"  stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <line x1="0" y1="60"  x2="320" y2="60"  stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <line x1="0" y1="100" x2="320" y2="100" stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <rect
          v-for="(bar, idx) in barData"
          :key="idx"
          :x="14 + idx * 64"
          :y="108 - bar.value"
          width="44"
          :height="bar.value"
          rx="3"
          fill="rgb(var(--v-theme-primary))"
          :opacity="bar.faded ? 0.55 : 1"
        />
      </svg>
      <div class="dv-bar-chart__labels">
        <span v-for="bar in barData" :key="bar.label">{{ bar.label }}</span>
      </div>
    </div>

    <!-- Line / Area -->
    <div v-else-if="previewKind === 'line' || previewKind === 'area'" class="dv-line-chart">
      <div class="dv-bar-chart__legend">
        <span>Trend · <strong>last 30 days</strong></span>
        <span>vs prev <strong class="dv-bar-chart__pct">+9%</strong></span>
      </div>
      <svg class="dv-bar-chart__svg" viewBox="0 0 320 130" preserveAspectRatio="none">
        <defs>
          <linearGradient :id="`dvLineArea-${draft.metricId}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgb(var(--v-theme-primary))" stop-opacity="0.28" />
            <stop offset="100%" stop-color="rgb(var(--v-theme-primary))" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="20"  x2="320" y2="20"  stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <line x1="0" y1="60"  x2="320" y2="60"  stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <line x1="0" y1="100" x2="320" y2="100" stroke="rgb(var(--v-theme-outline-variant))" stroke-width="0.5" />
        <path v-if="previewKind === 'area'" :d="lineAreaPath" :fill="`url(#dvLineArea-${draft.metricId})`" />
        <path :d="linePath" fill="none" stroke="rgb(var(--v-theme-primary))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <circle
          v-for="(p, idx) in lineSpec.points"
          :key="idx"
          :cx="p.x"
          :cy="p.y"
          r="2.5"
          fill="rgb(var(--v-theme-surface))"
          stroke="rgb(var(--v-theme-primary))"
          stroke-width="1.4"
        />
      </svg>
    </div>

    <!-- Donut / Pie -->
    <div v-else-if="previewKind === 'pie'" class="dv-pie-chart">
      <svg viewBox="0 0 120 120" class="dv-pie-chart__svg">
        <g transform="translate(60,60)">
          <template v-for="(slice, idx) in pieSlices" :key="idx">
            <circle
              r="42"
              fill="none"
              :stroke="slice.color"
              stroke-width="20"
              :stroke-dasharray="`${(slice.value / 100) * 264} 264`"
              :stroke-dashoffset="-pieSlices.slice(0, idx).reduce((sum, s) => sum + (s.value / 100) * 264, 0)"
              transform="rotate(-90)"
            />
          </template>
        </g>
      </svg>
      <div class="dv-pie-chart__legend">
        <div v-for="(slice, idx) in pieSlices" :key="idx" class="dv-pie-chart__legend-row">
          <span class="dv-pie-chart__swatch" :style="{ background: slice.color }"></span>
          <span class="dv-pie-chart__label">Segment {{ idx + 1 }}</span>
          <span class="dv-pie-chart__value">{{ slice.value }}%</span>
        </div>
      </div>
    </div>

    <!-- Mini table -->
    <div v-else-if="previewKind === 'table'" class="dv-mini-tbl">
      <table>
        <thead>
          <tr>
            <th
              v-for="(h, idx) in tableSpec.headers"
              :key="idx"
              :style="{ textAlign: h.align ?? 'start' }"
            >
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in tableSpec.rows" :key="rIdx">
            <td
              v-for="(cell, cIdx) in row"
              :key="cIdx"
              :class="{ 'dv-mini-tbl__num': cell.align === 'end', muted: cell.muted }"
            >
              {{ cell.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Activity -->
    <div v-else class="dv-activity">
      <div v-for="item in activityItems" :key="item.title" class="dv-activity__row">
        <div class="dv-activity__icon">
          <v-icon size="14">{{ item.icon }}</v-icon>
        </div>
        <div class="dv-activity__body">
          <div class="dv-activity__title">{{ item.title }}</div>
          <div class="dv-activity__meta">{{ item.meta }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dv-draft-preview {
  width: 100%;
}

/* Chart canvas dimensions (bar/line/pie svg heights and widths below) are
   deliberately NOT on the spacing scale: they are plotting-area geometry sized to
   the data, not a spacing decision the design system should own. Everything that
   IS a spacing or type decision in this file is tokenized. */

/* Eyebrow used inside KPI quad */
.dv-eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: var(--mp-space-8);
}

/* ─── KPI quad ─────────────────────────────────────────────────────── */
.dv-kpi-quad {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* 1px hairline, not spacing: the gap shows the container's background through as the
     cell divider, so this is border geometry and stays off the spacing scale. */
  gap: 1px;
  background: rgb(var(--v-theme-outline-variant));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.dv-kpi-quad__cell {
  background: rgb(var(--v-theme-surface));
  padding: var(--mp-space-12) var(--mp-space-14);
}

.dv-kpi-quad__row {
  display: flex;
  align-items: flex-end;
  gap: var(--mp-space-6);
  justify-content: space-between;
}

.dv-kpi-quad__v {
  font-size: var(--mp-fontSize-24);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}

[data-density='compact'] .dv-kpi-quad__cell { padding: var(--mp-space-10) var(--mp-space-12); }
[data-density='compact'] .dv-kpi-quad__v { font-size: var(--mp-fontSize-20); }
[data-density='expanded'] .dv-kpi-quad__cell { padding: var(--mp-space-20) var(--mp-space-20); }
[data-density='expanded'] .dv-kpi-quad__v { font-size: var(--mp-fontSize-32); }

.dv-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-2);
  padding: var(--mp-space-4) var(--mp-space-8) var(--mp-space-4) var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  line-height: 1;
}

.dv-delta--up { background: rgb(var(--v-theme-success-container, var(--v-theme-success))); color: rgb(var(--v-theme-on-success-container, var(--v-theme-on-surface))); }
.dv-delta--down { background: rgb(var(--v-theme-error-container, var(--v-theme-error))); color: rgb(var(--v-theme-on-error-container, var(--v-theme-on-surface))); }
.dv-delta--flat { background: rgb(var(--v-theme-surface-variant)); color: rgb(var(--v-theme-on-surface-variant)); }

/* ─── Bar chart ────────────────────────────────────────────────────── */
.dv-bar-chart,
.dv-line-chart {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-14) var(--mp-space-14) var(--mp-space-8);
}

.dv-bar-chart__legend {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--mp-space-10);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-bar-chart__legend strong {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dv-bar-chart__pct {
  color: rgb(var(--v-theme-success)) !important;
}

.dv-bar-chart__svg {
  width: 100%;
  height: 130px;
  display: block;
}

[data-density='compact'] .dv-bar-chart__svg { height: 110px; }
[data-density='expanded'] .dv-bar-chart__svg { height: 280px; }

.dv-bar-chart__labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--mp-space-4);
  font-size: var(--mp-fontSize-11);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ─── Donut ────────────────────────────────────────────────────────── */
.dv-pie-chart {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-14);
  display: flex;
  align-items: center;
  gap: var(--mp-space-16);
}

.dv-pie-chart__svg {
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}

.dv-pie-chart__legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
}

.dv-pie-chart__legend-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  color: rgb(var(--v-theme-on-surface));
}

.dv-pie-chart__swatch {
  width: var(--mp-space-10);
  height: var(--mp-space-10);
  border-radius: var(--mp-radius-4);
  flex-shrink: 0;
}

.dv-pie-chart__label { flex: 1; color: rgb(var(--v-theme-on-surface-variant)); }
.dv-pie-chart__value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}

[data-density='expanded'] .dv-pie-chart__svg { width: 160px; height: 160px; }

/* ─── Mini table ───────────────────────────────────────────────────── */
.dv-mini-tbl {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.dv-mini-tbl table {
  width: 100%;
  border-collapse: collapse;
}

.dv-mini-tbl th {
  text-align: left;
  padding: var(--mp-space-8) var(--mp-space-12);
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-mini-tbl td {
  padding: var(--mp-space-10) var(--mp-space-12);
  font-size: var(--mp-fontSize-13);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  font-variant-numeric: tabular-nums;
}

.dv-mini-tbl__num { text-align: right; }
.dv-mini-tbl td.muted { color: rgb(var(--v-theme-on-surface-variant)); font-weight: 400; }
.dv-mini-tbl tr:last-child td { border-bottom: none; }

[data-density='compact'] .dv-mini-tbl td { padding: var(--mp-space-8) var(--mp-space-12); }
[data-density='expanded'] .dv-mini-tbl td { padding: var(--mp-space-14) var(--mp-space-16); font-size: var(--mp-fontSize-14); }
[data-density='expanded'] .dv-mini-tbl th { padding: var(--mp-space-12) var(--mp-space-16); }

/* ─── Activity ─────────────────────────────────────────────────────── */
.dv-activity {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-6) var(--mp-space-10);
}

.dv-activity__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-space-8) var(--mp-space-4);
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-activity__row:last-child { border-bottom: none; }

.dv-activity__icon {
  width: var(--mp-space-24);
  height: var(--mp-space-24);
  border-radius: var(--mp-component-chip-radius);
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.dv-activity__title {
  font-size: var(--mp-fontSize-13);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.dv-activity__meta {
  font-size: var(--mp-fontSize-11);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
