<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useWidgetData } from '@/composables/useWidgetData'
import { useElementSize } from '@/composables/useElementSize'
import { useLiveAgo } from '@/composables/useRelativeTime'
import { DASHBOARD_SOURCE_META, getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type { DashboardAttentionItem, DashboardFilterState, DashboardInsightItem, DashboardWidget } from '@/stores/dashboards/types'
import MpSourceCloudChip from '@/components/MpSourceCloudChip.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import { detectSize, type WidgetSize } from './widgetSizePresets'
import DashboardChartWidget from './widgets/DashboardChartWidget.vue'
import DashboardKpiWidget from './widgets/DashboardKpiWidget.vue'
import DashboardPieWidget from './widgets/DashboardPieWidget.vue'
import DashboardActivityWidget from './widgets/DashboardActivityWidget.vue'
import DashboardAttentionWidget from './widgets/DashboardAttentionWidget.vue'
import DashboardInsightsWidget from './widgets/DashboardInsightsWidget.vue'
import DashboardTableWidget from './widgets/DashboardTableWidget.vue'
import DashboardMetricExplorerWidget from './widgets/DashboardMetricExplorerWidget.vue'
import DashboardFunnelWidget from './widgets/DashboardFunnelWidget.vue'
import DashboardDonutWidget from './widgets/DashboardDonutWidget.vue'
import DashboardGaugeWidget from './widgets/DashboardGaugeWidget.vue'
import DashboardBarListWidget from './widgets/DashboardBarListWidget.vue'
import DashboardPaletteWidget from './widgets/DashboardPaletteWidget.vue'
import DashboardStackedBarWidget from './widgets/DashboardStackedBarWidget.vue'
import DashboardBreakdownWidget from './widgets/DashboardBreakdownWidget.vue'
import DashboardTabsWidget from './widgets/DashboardTabsWidget.vue'
import DashboardTrendFooter from './widgets/DashboardTrendFooter.vue'
import DashboardWidgetActionMenu from './DashboardWidgetActionMenu.vue'

const props = withDefaults(defineProps<{
  accountId: string
  widget: DashboardWidget
  filters: DashboardFilterState
  /** Grid context: reveals the drag grip on hover (layout is always directly editable). */
  draggable?: boolean
  preview?: boolean
  showActions?: boolean
}>(), {
  draggable: false,
  preview: false,
  showActions: true,
})

const emit = defineEmits<{
  expand: [widgetId: string]
  edit: [widgetId: string]
  refresh: [widgetId: string]
  remove: [widgetId: string]
  resize: [payload: { widgetId: string; size: WidgetSize }]
  setHeight: [payload: { widgetId: string; h: number }]
}>()

const router = useRouter()
const bodyEl = ref<HTMLElement | null>(null)

// Trend/Compare toggle for the channel-trend widget: "Compare" renders the same
// generated channel data as one bar per channel. Card-local view state only —
// the persisted widget config stays `timeseries`.
const supportsChannelToggle = computed(() => props.widget.metricId === 'demo_channel_trend')
const channelMode = ref<'trend' | 'compare'>(props.widget.type === 'bar' ? 'compare' : 'trend')
const effectiveWidget = computed<DashboardWidget>(() => (
  supportsChannelToggle.value && channelMode.value === 'compare'
    ? { ...props.widget, type: 'bar', chartVariant: undefined }
    : props.widget
))

const { data } = useWidgetData(effectiveWidget, computed(() => props.filters))
const { size: bodySize } = useElementSize(bodyEl)

const currentSize = computed<WidgetSize | null>(() => detectSize(props.widget.type, props.widget.layout.w, props.widget.layout.h))
const isCompactHeight = computed(() => bodySize.value.height > 0 && bodySize.value.height < 128)
const isKpiWidget = computed(() => data.value.kind === 'kpi')
// These types render their own top row (KPI strip / tab bar / collapse toggle),
// so the standard card header is suppressed and the floating actions overlay
// (drag grip + menu) is used instead — same treatment as KPI cards.
const bespokeHeader = computed(() => ['metric_explorer', 'tabs', 'attention'].includes(props.widget.type))
const hasFloatingActions = computed(() => !props.preview && props.showActions)
const metricIcon = computed(() => getMetricDescriptor(props.widget.metricId)?.icon ?? '')
const rangeLabels: Record<DashboardFilterState['rangePreset'], string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 days',
  last_30_days: 'Last 30 days',
  last_90_days: 'Last 90 days',
  month_to_date: 'This month so far',
  quarter_to_date: 'This quarter so far',
  year_to_date: 'This year so far',
  black_friday_cyber_monday: 'Black Friday Cyber Monday',
  custom: 'Custom range',
}
const grainLabels: Record<DashboardFilterState['grain'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}
const comparisonLabels: Record<DashboardFilterState['comparison'], string> = {
  none: 'No comparison',
  previous_period: 'Compared to previous period',
  previous_year: 'Compared to previous year',
  custom: 'Compared to custom range',
}
const comparisonContextLabel = computed(() => comparisonLabels[props.filters.comparison])
const kpiComparisonLabel = computed(() => {
  if (props.filters.comparison === 'none') return ''
  if (props.filters.comparison === 'previous_year') return 'vs previous year'
  if (props.filters.comparison === 'custom') return 'vs custom range'

  const range = props.filters.rangePreset
  if (range === 'last_7_days') return 'vs prev 7d'
  if (range === 'last_30_days') return 'vs prev 30d'
  if (range === 'last_90_days') return 'vs prev 90d'
  if (range === 'today') return 'vs yesterday'
  if (range === 'year_to_date') return 'vs prev YTD'
  return 'vs previous period'
})
const DOTTED_TYPES = ['metric_explorer', 'funnel', 'donut', 'gauge', 'bar_list', 'breakdown', 'tabs']

const widgetSubtitle = computed(() => {
  if (props.widget.subtitle) return props.widget.subtitle
  if (isKpiWidget.value) {
    if (props.widget.metricId === 'contacts_total') return 'All time'
    return rangeLabels[props.filters.rangePreset]
  }

  // The dotted v2 widgets aren't grain-driven — fall back to the range label.
  if (DOTTED_TYPES.includes(props.widget.type)) {
    return rangeLabels[props.filters.rangePreset]
  }

  if (props.widget.metricId === 'marketing_top_campaigns') {
    return `${rangeLabels[props.filters.rangePreset]} - by revenue`
  }

  if (props.filters.comparison === 'none') {
    return grainLabels[props.filters.grain]
  }

  return `${grainLabels[props.filters.grain]} - ${comparisonContextLabel.value.toLowerCase()}`
})
const isDataEmpty = computed(() => {
  if (data.value.kind === 'table') return data.value.rows.length === 0
  if (data.value.kind === 'series') return data.value.labels.length === 0 || data.value.series.every((series) => series.data.length === 0)
  if (data.value.kind === 'donut') return data.value.segments.every((segment) => segment.value === 0)
  if (data.value.kind === 'bar_list' || data.value.kind === 'breakdown') return data.value.rows.length === 0
  return false
})

// shadcn trend footer carried on the data payload (KPI cards render their own).
const trendFooter = computed(() => (
  !isKpiWidget.value && 'footer' in data.value ? data.value.footer : undefined
))

const sourceMeta = computed(() => DASHBOARD_SOURCE_META[props.widget.dataSource])
const lastRefreshedAt = toRef(() => props.widget.lastRefreshedAt)
const updatedLabel = useLiveAgo(lastRefreshedAt)

function openDrilldown() {
  router.push({
    name: props.widget.drilldown.routeName,
    params: { accountId: props.accountId },
  })
}

function handleItemAction(item: DashboardAttentionItem | DashboardInsightItem) {
  router.push({
    name: item.routeName,
    params: { accountId: props.accountId },
  })
}

function chooseSize(size: WidgetSize) {
  emit('resize', { widgetId: props.widget.id, size })
}

// Attention banner collapse: shrink the grid row to just the summary row and
// restore the pre-collapse height on expand (vertical-compact reflows the rest).
const COLLAPSED_H = 1
const expandedHeight = ref<number | null>(null)

function handleAttentionCollapse(collapsed: boolean) {
  if (props.preview) return
  if (collapsed) {
    expandedHeight.value = props.widget.layout.h
    emit('setHeight', { widgetId: props.widget.id, h: COLLAPSED_H })
  } else {
    emit('setHeight', { widgetId: props.widget.id, h: expandedHeight.value ?? 6 })
    expandedHeight.value = null
  }
}
</script>

<template>
  <v-card
    flat
    border
    rounded="lg"
    class="dashboard-widget-card h-100 d-flex flex-column"
    :class="{
      'dashboard-widget-card--preview': preview,
      'dashboard-widget-card--draggable': draggable,
      'dashboard-widget-card--kpi': isKpiWidget,
      'dashboard-widget-card--bespoke': bespokeHeader,
      'dashboard-widget-card--attention': widget.type === 'attention',
      'dashboard-widget-card--has-actions': hasFloatingActions,
      'dashboard-widget-drag': draggable && isKpiWidget,
    }"
  >
    <div v-if="(isKpiWidget || bespokeHeader) && !preview && showActions" class="dashboard-widget-card__kpi-actions">
      <v-icon v-if="draggable" size="18" class="dashboard-widget-card__drag-handle" :class="{ 'dashboard-widget-drag': bespokeHeader }">grip-vertical</v-icon>
      <DashboardWidgetActionMenu
        :widget-title="widget.title"
        :current-size="currentSize"
        @expand="emit('expand', widget.id)"
        @edit="emit('edit', widget.id)"
        @view-report="openDrilldown"
        @resize="chooseSize"
        @remove="emit('remove', widget.id)"
      />
    </div>

    <div v-if="!isKpiWidget && !bespokeHeader" class="dashboard-widget-card__header" :class="{ 'dashboard-widget-drag': draggable }">
      <div class="dashboard-widget-card__header-copy">
        <div class="dashboard-widget-card__title-row">
          <DvOrbitOrb v-if="widget.type === 'insights'" :size="14" :speed="1" class="dashboard-widget-card__orb" />
          <div class="dashboard-widget-card__title">{{ widget.title }}</div>
          <v-tooltip
            v-if="widget.aiProvenance"
            location="top"
            :text="widget.aiProvenance.prompt ? `Made by Da Vinci · From prompt: “${widget.aiProvenance.prompt}”` : 'Made by Da Vinci'"
          >
            <template #activator="{ props: tipProps }">
              <span v-bind="tipProps" class="dashboard-widget-card__davinci-chip">
                <v-icon size="11">sparkles</v-icon>
                Da Vinci
              </span>
            </template>
          </v-tooltip>
        </div>
        <div class="dashboard-widget-card__subtitle">{{ widgetSubtitle }}</div>
      </div>

      <div class="dashboard-widget-card__actions">
        <v-icon v-if="draggable" size="18" class="dashboard-widget-card__drag-handle">grip-vertical</v-icon>
        <v-btn-toggle
          v-if="supportsChannelToggle && !preview"
          v-model="channelMode"
          mandatory
          density="compact"
          variant="outlined"
          divided
          class="dashboard-widget-card__view-toggle"
          aria-label="Revenue by channel view"
        >
          <v-btn value="trend" size="small">Trend</v-btn>
          <v-btn value="compare" size="small">Compare</v-btn>
        </v-btn-toggle>
        <DashboardWidgetActionMenu
          v-if="!preview && showActions"
          :widget-title="widget.title"
          :current-size="currentSize"
          @expand="emit('expand', widget.id)"
          @edit="emit('edit', widget.id)"
          @view-report="openDrilldown"
          @resize="chooseSize"
          @remove="emit('remove', widget.id)"
        />
      </div>
    </div>

    <div
      ref="bodyEl"
      class="dashboard-widget-card__body"
    >
      <div v-if="isDataEmpty" class="dashboard-widget-card__empty">
        <div class="dashboard-widget-card__empty-icon">
          <v-icon size="22">{{ sourceMeta.icon }}</v-icon>
        </div>
        <div class="dashboard-widget-card__empty-title">
          No {{ sourceMeta.label.toLowerCase() }} data available
        </div>
        <div class="dashboard-widget-card__empty-sub">
          {{ widget.title }} has nothing to display for the selected range. Try a different period or refresh.
        </div>
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="refresh-cw"
          class="dashboard-widget-card__empty-cta"
          @click="emit('refresh', widget.id)"
        >
          Refresh
        </v-btn>
      </div>
      <DashboardKpiWidget
        v-else-if="data.kind === 'kpi'"
        :data="data"
        :compact="isCompactHeight"
        :title="widget.title"
        :subtitle="widgetSubtitle"
        :comparison-label="kpiComparisonLabel"
        :icon="metricIcon"
        :ai-generated="!!widget.aiProvenance"
        :data-source="widget.dataSource"
        :last-refreshed-at="widget.lastRefreshedAt"
        :show-view-report="widget.dataSource === 'retail'"
        @view-report="openDrilldown"
      />
      <DashboardPieWidget
        v-else-if="data.kind === 'series' && widget.type === 'pie'"
        :data="data"
        :height="bodySize.height"
      />
      <DashboardChartWidget
        v-else-if="data.kind === 'series'"
        :data="data"
        :widget-type="effectiveWidget.type as 'timeseries' | 'bar'"
        :chart-variant="effectiveWidget.chartVariant"
        :height="bodySize.height"
      />
      <DashboardActivityWidget
        v-else-if="data.kind === 'activity'"
        :data="data"
      />
      <DashboardAttentionWidget
        v-else-if="data.kind === 'attention'"
        :data="data"
        @action="handleItemAction"
        @collapse="handleAttentionCollapse"
      />
      <DashboardInsightsWidget
        v-else-if="data.kind === 'insights'"
        :data="data"
        @action="handleItemAction"
      />
      <DashboardMetricExplorerWidget
        v-else-if="data.kind === 'metric_explorer'"
        :data="data"
      />
      <DashboardFunnelWidget
        v-else-if="data.kind === 'funnel'"
        :data="data"
      />
      <DashboardDonutWidget
        v-else-if="data.kind === 'donut'"
        :data="data"
      />
      <DashboardGaugeWidget
        v-else-if="data.kind === 'gauge'"
        :data="data"
      />
      <DashboardBarListWidget
        v-else-if="data.kind === 'bar_list'"
        :data="data"
      />
      <DashboardBreakdownWidget
        v-else-if="data.kind === 'breakdown'"
        :data="data"
        @drilldown="openDrilldown"
      />
      <DashboardPaletteWidget
        v-else-if="data.kind === 'palette'"
        :data="data"
      />
      <DashboardStackedBarWidget
        v-else-if="data.kind === 'stacked_bar'"
        :data="data"
      />
      <DashboardTabsWidget
        v-else-if="data.kind === 'tabs'"
        :data="data"
        @drilldown="openDrilldown"
      />
      <DashboardTableWidget
        v-else
        :data="data"
      />
    </div>

    <DashboardTrendFooter
      v-if="trendFooter && !isDataEmpty"
      class="dashboard-widget-card__trend-foot"
      :trend="trendFooter.trend"
      :caption="trendFooter.caption"
      :direction="trendFooter.direction"
    />

    <!-- The attention banner has no footer at all (design reference): items span
         clouds and carry their own timestamps, and the collapsed state must be a
         single tight row. -->
    <footer v-if="!isKpiWidget && data.kind !== 'attention'" class="dashboard-widget-card__foot">
      <MpSourceCloudChip :data-source="widget.dataSource" size="md" />
      <span v-if="updatedLabel" class="dashboard-widget-card__updated">
        <v-icon size="12">clock</v-icon>
        Updated {{ updatedLabel }}
      </span>
    </footer>
  </v-card>
</template>

<style scoped lang="scss">
.dashboard-widget-card {
  position: relative;
  border-color: var(--border-subtle) !important;
  /* 14px matches the dotted Overview v2 mockup's card radius (--scn-radius in
     the lab view), intentionally off the --r-* scale */
  border-radius: 14px !important;
  background: var(--surface-primary) !important;
  overflow: hidden;
  min-height: 0;
  box-shadow: none;
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.2s ease;
}

.dashboard-widget-card:hover {
  /* !important so the lift beats the finished .mp-enter animation (fill: both
     keeps its final transform:none applied; only !important wins over it) */
  transform: translateY(-2px) !important;
  border-color: color-mix(in oklch, var(--accent) 26%, var(--border-subtle)) !important;
  box-shadow: var(--elevation-modal);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-widget-card:hover {
    transform: none !important;
  }
}

.dashboard-widget-card__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  min-height: 60px;
  padding: 20px 22px 14px;
}

.dashboard-widget-card__header-copy {
  min-width: 0;
}

.dashboard-widget-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dashboard-widget-card__title {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-widget-card__davinci-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
  border: 1px solid var(--dv-border);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: default;
}

.dashboard-widget-card__davinci-chip :deep(.v-icon) {
  color: var(--dv-accent);
}

.dashboard-widget-card__subtitle {
  overflow: hidden;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-widget-card__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin-top: -2px;
}

.dashboard-widget-card__orb {
  flex-shrink: 0;
}

.dashboard-widget-card__view-toggle {
  height: 28px;
  min-height: 0;
  margin-right: 6px;
  border-color: var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

/* Undo the square icon-button sizing the shared actions rule below applies.
   Every property the global VBtn default writes as an inline style
   (min-height, border-radius, font-size, padding-inline — see
   `maropostDefaults` in plugins/maropostTheme.ts) needs !important here:
   inline styles outrank scoped class rules, and 40px pills blow out the
   28px header row. */
.dashboard-widget-card__actions .dashboard-widget-card__view-toggle :deep(.v-btn) {
  width: auto !important;
  min-width: 0;
  height: 26px !important;
  min-height: 0 !important;
  padding: 0 10px !important;
  border-radius: 0 !important;
  font-size: 12px !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  color: var(--muted);
}

.dashboard-widget-card__actions .dashboard-widget-card__view-toggle :deep(.v-btn:first-child) {
  border-start-start-radius: 7px !important;
  border-end-start-radius: 7px !important;
}

.dashboard-widget-card__actions .dashboard-widget-card__view-toggle :deep(.v-btn:last-child) {
  border-start-end-radius: 7px !important;
  border-end-end-radius: 7px !important;
}

.dashboard-widget-card__actions .dashboard-widget-card__view-toggle :deep(.v-btn.v-btn--active) {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.dashboard-widget-card__actions :deep(.v-btn),
.dashboard-widget-card__kpi-actions :deep(.v-btn) {
  min-width: 32px;
  width: 32px !important;
  height: 32px !important;
  padding: 0;
  color: var(--muted);
  border-radius: var(--r-pill);
}

.dashboard-widget-card__actions :deep(.v-btn:hover),
.dashboard-widget-card__kpi-actions :deep(.v-btn:hover) {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.dashboard-widget-card__actions :deep(.v-icon),
.dashboard-widget-card__kpi-actions :deep(.v-icon) {
  font-size: 18px;
}

.dashboard-widget-card__actions :deep(.v-icon svg),
.dashboard-widget-card__kpi-actions :deep(.v-icon svg) {
  stroke-width: 2.25;
}

.dashboard-widget-card__kpi-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* Drag grip is always in-flow (no layout shift) and fades in on card hover. */
.dashboard-widget-card__drag-handle {
  color: var(--muted);
  cursor: grab;
  opacity: 0;
  transition: opacity 120ms ease;
}

.dashboard-widget-card:hover .dashboard-widget-card__drag-handle {
  opacity: 1;
}

.dashboard-widget-card--draggable .dashboard-widget-drag,
.dashboard-widget-card--draggable.dashboard-widget-drag {
  cursor: grab;
}

.dashboard-widget-card--preview {
  border-style: dashed;
}

.dashboard-widget-card__body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0 22px 14px;
}

.dashboard-widget-card--kpi .dashboard-widget-card__body,
.dashboard-widget-card--bespoke .dashboard-widget-card__body {
  padding: 0;
}

/* Bespoke-header widgets render their own top-right controls ("View all",
   "Show", the last KPI cell) — inset them so the floating actions overlay
   (drag grip + kebab, ~64px from the right edge) never sits on top of them. */
.dashboard-widget-card--bespoke.dashboard-widget-card--has-actions :deep(.tabs-widget__bar),
.dashboard-widget-card--bespoke.dashboard-widget-card--has-actions :deep(.attention-widget__toggle) {
  padding-right: 76px;
}

.dashboard-widget-card--bespoke.dashboard-widget-card--has-actions :deep(.mx__cell:last-child) {
  padding-right: 60px;
}

/* The attention banner's collapsed toggle row is much shorter than the other
   bespoke headers (a single compact line, not a KPI cell or tab bar) — the
   shared top:12px overlay offset sits too low against it, so re-center the
   grip/kebab against this specific row height instead. */
.dashboard-widget-card--attention .dashboard-widget-card__kpi-actions {
  top: 1px;
}

.dashboard-widget-card__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 24px;
  gap: 6px;
}

.dashboard-widget-card__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background: var(--surface-secondary);
  color: var(--muted);
  margin-bottom: 4px;
}

.dashboard-widget-card__empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.dashboard-widget-card__empty-sub {
  font-size: 12.5px;
  color: var(--muted);
  max-width: 280px;
  line-height: 1.4;
}

.dashboard-widget-card__empty-cta {
  margin-top: 8px;
  text-transform: none;
}

.dashboard-widget-card__trend-foot {
  flex-shrink: 0;
  padding: 2px 22px 14px;
}

.dashboard-widget-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  min-height: 40px;
  flex-shrink: 0;
}

.dashboard-widget-card__updated {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  /* Keeps "Updated …" right-aligned when the cloud chip is hidden (attention widget). */
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-widget-card__updated :deep(.v-icon) {
  color: var(--muted);
}
</style>
