<script setup lang="ts">
import { computed } from 'vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardChartVariant,
  DashboardFilterState,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import { buildPreviewWidget } from './buildPreviewWidget'

const props = defineProps<{
  accountId: string
  draft: DashboardWidgetDraft
  filters: DashboardFilterState
}>()

const emit = defineEmits<{
  'update:draft': [draft: DashboardWidgetDraft]
}>()

type ChartTypeKey = 'bar' | 'column' | 'area' | 'pie'

const CHART_TYPES: Array<{ key: ChartTypeKey; label: string; icon: string }> = [
  { key: 'bar', label: 'Bar', icon: 'chart-bar-big' },
  { key: 'column', label: 'Column', icon: 'chart-column' },
  { key: 'area', label: 'Area', icon: 'chart-area' },
  { key: 'pie', label: 'Pie chart', icon: 'chart-pie' },
]

const isChartCapable = computed(() => {
  const type = props.draft.type
  return type === 'bar' || type === 'timeseries' || type === 'pie'
})

const currentChartType = computed<ChartTypeKey>(() => {
  if (props.draft.type === 'pie') return 'pie'
  if (props.draft.type === 'timeseries') return 'area'
  // bar
  return props.draft.chartVariant === 'horizontal' ? 'bar' : 'column'
})

const descriptor = computed(() => getMetricDescriptor(props.draft.metricId))

const previewWidget = computed(() => {
  if (!descriptor.value) return null
  return buildPreviewWidget({
    draft: props.draft,
    type: props.draft.type,
    title: props.draft.title,
    subtitle: props.draft.subtitle,
    dataSource: props.draft.dataSource,
    metricId: props.draft.metricId,
    descriptor: descriptor.value,
    chartVariant: props.draft.chartVariant,
  })
})

function updateField<K extends keyof DashboardWidgetDraft>(field: K, value: DashboardWidgetDraft[K]) {
  emit('update:draft', { ...props.draft, [field]: value })
}

function selectChartType(key: ChartTypeKey) {
  let nextType: DashboardWidgetType = props.draft.type
  let nextVariant: DashboardChartVariant | undefined = props.draft.chartVariant
  if (key === 'bar') {
    nextType = 'bar'
    nextVariant = 'horizontal'
  } else if (key === 'column') {
    nextType = 'bar'
    nextVariant = 'vertical'
  } else if (key === 'area') {
    nextType = 'timeseries'
    nextVariant = 'area'
  } else if (key === 'pie') {
    nextType = 'pie'
    nextVariant = undefined
  }
  emit('update:draft', { ...props.draft, type: nextType, chartVariant: nextVariant })
}

const titleModel = computed({
  get: () => props.draft.title,
  set: (value: string) => updateField('title', value),
})

const subtitleModel = computed({
  get: () => props.draft.subtitle ?? '',
  set: (value: string) => updateField('subtitle', value || undefined),
})
</script>

<template>
  <MpFormGrid class="widget-edit">
    <v-text-field v-model="titleModel" label="Title" />

    <v-text-field v-model="subtitleModel" label="Subtitle" hint="Optional — a line of context under the title." />

    <MpFormField v-if="isChartCapable" label="Select chart type">
      <div class="widget-edit__chart-types">
        <button
          v-for="option in CHART_TYPES"
          :key="option.key"
          type="button"
          class="widget-edit__chart-type"
          :class="{ 'widget-edit__chart-type--active': currentChartType === option.key }"
          :aria-pressed="currentChartType === option.key"
          @click="selectChartType(option.key)"
        >
          <span class="widget-edit__chart-radio" aria-hidden="true">
            <span v-if="currentChartType === option.key" class="widget-edit__chart-radio-dot" />
          </span>
          <v-icon size="16" class="widget-edit__chart-icon">{{ option.icon }}</v-icon>
          <span class="widget-edit__chart-label">{{ option.label }}</span>
        </button>
      </div>
    </MpFormField>

    <MpFormSection title="Preview" />
    <div class="widget-edit__preview-body">
      <DashboardWidgetCard
        v-if="previewWidget"
        :account-id="accountId"
        :widget="previewWidget"
        :filters="filters"
        preview
        :show-actions="false"
      />
    </div>
  </MpFormGrid>
</template>

<style scoped lang="scss">
.widget-edit {
  width: 100%;
}

.widget-edit__chart-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--mp-space-10);
}

.widget-edit__chart-type {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-space-12) var(--mp-space-14);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
  background: var(--surface-primary);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 120ms ease, background 120ms ease;
}

.widget-edit__chart-type:hover {
  border-color: color-mix(in oklch, var(--accent) 28%, var(--border-subtle));
  background: var(--surface-secondary);
}

.widget-edit__chart-type--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.widget-edit__chart-radio {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--mp-radius-full);
  background: var(--surface-primary);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.widget-edit__chart-type--active .widget-edit__chart-radio {
  border-color: rgb(var(--v-theme-primary));
}

.widget-edit__chart-radio-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-primary));
}

.widget-edit__chart-icon {
  color: var(--muted);
  flex-shrink: 0;
}

.widget-edit__chart-type--active .widget-edit__chart-icon {
  color: rgb(var(--v-theme-primary));
}

.widget-edit__chart-label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.widget-edit__preview-body {
  min-height: 280px;
  padding: var(--mp-space-16);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
}

.widget-edit__preview-body :deep(.dashboard-widget-card) {
  min-height: 240px;
}
</style>
