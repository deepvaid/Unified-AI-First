<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useWidgetData } from '@/composables/useWidgetData'
import { useElementSize } from '@/composables/useElementSize'
import { useLiveAgo } from '@/composables/useRelativeTime'
import { DASHBOARD_SOURCE_META, getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type { DashboardFilterState, DashboardWidget } from '@/stores/dashboards/types'
import MpSourceCloudChip from '@/components/MpSourceCloudChip.vue'
import {
  WIDGET_SIZES,
  detectSize,
  type WidgetSize,
} from './widgetSizePresets'
import DashboardChartWidget from './widgets/DashboardChartWidget.vue'
import DashboardKpiWidget from './widgets/DashboardKpiWidget.vue'
import DashboardPieWidget from './widgets/DashboardPieWidget.vue'
import DashboardActivityWidget from './widgets/DashboardActivityWidget.vue'
import DashboardTableWidget from './widgets/DashboardTableWidget.vue'
import DashboardWidgetActionMenu from './DashboardWidgetActionMenu.vue'

const props = withDefaults(defineProps<{
  accountId: string
  widget: DashboardWidget
  filters: DashboardFilterState
  editable?: boolean
  preview?: boolean
  showActions?: boolean
}>(), {
  editable: false,
  preview: false,
  showActions: true,
})

const emit = defineEmits<{
  expand: [widgetId: string]
  edit: [widgetId: string]
  refresh: [widgetId: string]
  remove: [widgetId: string]
  resize: [payload: { widgetId: string; size: WidgetSize }]
}>()

const router = useRouter()
const bodyEl = ref<HTMLElement | null>(null)
const { data } = useWidgetData(computed(() => props.widget), computed(() => props.filters))
const { size: bodySize } = useElementSize(bodyEl)

const currentSize = computed<WidgetSize | null>(() => detectSize(props.widget.type, props.widget.layout.w, props.widget.layout.h))
const isCompactHeight = computed(() => bodySize.value.height > 0 && bodySize.value.height < 128)
const isKpiWidget = computed(() => data.value.kind === 'kpi')
const usesCommonActions = computed(() => data.value.kind === 'kpi' || data.value.kind === 'series')
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
const widgetSubtitle = computed(() => {
  if (props.widget.subtitle) return props.widget.subtitle
  if (isKpiWidget.value) {
    if (props.widget.metricId === 'contacts_total') return 'All time'
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
  return false
})

const sourceMeta = computed(() => DASHBOARD_SOURCE_META[props.widget.dataSource])
const lastRefreshedAt = toRef(() => props.widget.lastRefreshedAt)
const updatedLabel = useLiveAgo(lastRefreshedAt)

function openDrilldown() {
  router.push({
    name: props.widget.drilldown.routeName,
    params: { accountId: props.accountId },
  })
}

function chooseSize(size: WidgetSize) {
  emit('resize', { widgetId: props.widget.id, size })
}

function openSettings() {
  if (props.preview) return
  emit('edit', props.widget.id)
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
      'dashboard-widget-card--editable': editable,
      'dashboard-widget-card--kpi': isKpiWidget,
    }"
  >
    <div v-if="isKpiWidget && !preview && showActions" class="dashboard-widget-card__kpi-actions">
      <v-icon v-if="editable" size="18" class="dashboard-widget-card__drag-handle">grip-vertical</v-icon>
      <DashboardWidgetActionMenu
        :widget-title="widget.title"
        :editable="editable"
        @expand="emit('expand', widget.id)"
        @edit="emit('edit', widget.id)"
        @refresh="emit('refresh', widget.id)"
        @remove="emit('remove', widget.id)"
      />
    </div>

    <div v-if="!isKpiWidget" class="dashboard-widget-card__header">
      <div class="dashboard-widget-card__header-copy">
        <div class="dashboard-widget-card__title-row">
          <v-icon v-if="editable" size="18" class="dashboard-widget-card__drag-handle">grip-vertical</v-icon>
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
        <DashboardWidgetActionMenu
          v-if="!preview && showActions && usesCommonActions"
          :widget-title="widget.title"
          :editable="editable"
          @expand="emit('expand', widget.id)"
          @edit="emit('edit', widget.id)"
          @refresh="emit('refresh', widget.id)"
          @remove="emit('remove', widget.id)"
        />

        <v-menu v-else-if="!preview && showActions" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="more-vertical"
              variant="text"
              size="small"
              :aria-label="`Actions for ${widget.title}`"
            />
          </template>
          <v-list density="compact" min-width="180">
            <v-list-item
              v-if="editable"
              prepend-icon="pencil"
              title="Edit"
              @click="emit('edit', widget.id)"
            />
            <v-list-item
              prepend-icon="sliders"
              title="Widget settings"
              @click="openSettings"
            />
            <v-list-item
              prepend-icon="refresh-cw"
              title="Refresh widget"
            />
            <v-list-item
              prepend-icon="arrow-up-right"
              title="View report"
              @click="openDrilldown"
            />
            <template v-if="editable">
              <v-divider class="my-1" />
              <v-list-item
                v-for="size in WIDGET_SIZES"
                :key="size"
                :prepend-icon="currentSize === size ? 'check' : undefined"
                :title="`Size ${size}`"
                :active="currentSize === size"
                @click="chooseSize(size)"
              />
              <v-divider class="my-1" />
              <v-list-item
                prepend-icon="trash-2"
                title="Remove"
                base-color="error"
                @click="emit('remove', widget.id)"
              />
            </template>
          </v-list>
        </v-menu>
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
        :widget-type="widget.type as 'timeseries' | 'bar'"
        :chart-variant="widget.chartVariant"
        :height="bodySize.height"
      />
      <DashboardActivityWidget
        v-else-if="data.kind === 'activity'"
        :data="data"
      />
      <DashboardTableWidget
        v-else
        :data="data"
      />
    </div>

    <footer v-if="!isKpiWidget" class="dashboard-widget-card__foot">
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
  border-color: color-mix(in oklch, var(--ink) 7%, transparent) !important;
  border-radius: var(--r-section) !important;
  background: var(--surface-1) !important;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dashboard-widget-card:hover {
  border-color: color-mix(in oklch, var(--ink) 18%, transparent) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06);
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
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
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
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(99, 102, 241, 0.18));
  color: rgb(99, 79, 218);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: default;
}

.dashboard-widget-card__davinci-chip :deep(.v-icon) {
  color: rgb(124, 58, 237);
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
  background: var(--surface-2);
  color: var(--ink);
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

.dashboard-widget-card__drag-handle {
  color: var(--muted);
  cursor: grab;
}

.dashboard-widget-card--preview {
  border-style: dashed;
}

.dashboard-widget-card--editable {
  border-color: color-mix(in oklch, var(--accent) 40%, transparent) !important;
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--accent) 12%, transparent);
  cursor: grab;
}

.dashboard-widget-card__body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0 22px 14px;
}

.dashboard-widget-card--kpi .dashboard-widget-card__body {
  padding: 0;
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
  background: var(--surface-2);
  color: var(--muted);
  margin-bottom: 4px;
}

.dashboard-widget-card__empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
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

.dashboard-widget-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--hairline);
  background: var(--surface-1);
  min-height: 40px;
  flex-shrink: 0;
}

.dashboard-widget-card__updated {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-widget-card__updated :deep(.v-icon) {
  color: var(--muted);
}
</style>
