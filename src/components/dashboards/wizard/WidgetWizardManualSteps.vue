<script setup lang="ts">
import { computed, watch } from 'vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import {
  DASHBOARD_SOURCE_META,
  getAvailableDashboardSources,
  getMetricDescriptor,
  getMetricsForSource,
} from '@/stores/dashboards/metricCatalog'
import type {
  DashboardDataSource,
  DashboardFilterState,
  DashboardMetricId,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import { useAccountsStore } from '@/stores/useAccounts'
import { buildPreviewWidget } from './buildPreviewWidget'

export type ManualStep = 'source' | 'metric' | 'visualization' | 'name'

const props = defineProps<{
  accountId: string
  step: ManualStep
  source: DashboardDataSource | null
  metricId: DashboardMetricId | null
  widgetType: DashboardWidgetType | null
  widgetTitle: string
  filters: DashboardFilterState
}>()

const emit = defineEmits<{
  'update:source': [value: DashboardDataSource | null]
  'update:metricId': [value: DashboardMetricId | null]
  'update:widgetType': [value: DashboardWidgetType | null]
  'update:widgetTitle': [value: string]
  'update:step': [value: ManualStep]
}>()

const accountsStore = useAccountsStore()
const account = computed(() => accountsStore.accounts.find((entry) => entry.id === props.accountId))

const sources = computed(() => getAvailableDashboardSources(account.value))
const metrics = computed(() => (props.source ? getMetricsForSource(props.source, account.value) : []))
const descriptor = computed(() => (props.metricId ? getMetricDescriptor(props.metricId) : undefined))
const widgetTypes = computed(() => descriptor.value?.supportedWidgetTypes ?? [])

const previewWidget = computed(() => {
  if (!props.source || !props.metricId || !props.widgetType || !descriptor.value) return null
  return buildPreviewWidget({
    type: props.widgetType,
    title: props.widgetTitle,
    dataSource: props.source,
    metricId: props.metricId,
    descriptor: descriptor.value,
  })
})

watch(
  widgetTypes,
  (types) => {
    if (props.step !== 'visualization') return
    const only = types[0]
    if (types.length === 1 && only && props.widgetType !== only) {
      emit('update:widgetType', only)
      emit('update:step', 'name')
    }
  },
  { immediate: true },
)

function selectSource(value: DashboardDataSource) {
  emit('update:source', value)
  const nextMetric = getMetricsForSource(value, account.value)[0]
  emit('update:metricId', nextMetric?.id ?? null)
  emit('update:widgetType', nextMetric?.defaultWidgetType ?? null)
  emit('update:widgetTitle', nextMetric?.defaultTitle ?? '')
  emit('update:step', 'metric')
}

function selectMetric(value: DashboardMetricId) {
  const next = getMetricDescriptor(value)
  emit('update:metricId', value)
  emit('update:widgetType', next?.defaultWidgetType ?? null)
  emit('update:widgetTitle', next?.defaultTitle ?? '')
  if (next && next.supportedWidgetTypes.length === 1) {
    emit('update:step', 'name')
  } else {
    emit('update:step', 'visualization')
  }
}

function selectWidgetType(value: DashboardWidgetType) {
  emit('update:widgetType', value)
  emit('update:step', 'name')
}
</script>

<template>
  <div class="wizard-manual">
    <div v-if="step === 'source'" class="d-flex flex-column ga-3">
      <div class="text-subtitle-2 font-weight-bold">Choose a data source</div>
      <v-card
        v-for="entry in sources"
        :key="entry.id"
        flat
        border
        rounded="lg"
        class="pa-4 wizard-manual__option"
        @click="selectSource(entry.id)"
      >
        <div class="d-flex align-start ga-3">
          <v-avatar size="40" variant="tonal" color="primary">
            <v-icon>{{ entry.icon }}</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-2 font-weight-bold">{{ entry.label }}</div>
            <div class="text-body-2 text-medium-emphasis mt-1">{{ entry.description }}</div>
          </div>
        </div>
      </v-card>
    </div>

    <div v-else-if="step === 'metric'" class="d-flex flex-column ga-3">
      <div class="d-flex align-center ga-2 text-subtitle-2 font-weight-bold">
        <v-icon size="18" color="primary">{{ source ? DASHBOARD_SOURCE_META[source].icon : 'database' }}</v-icon>
        Choose a {{ source ? DASHBOARD_SOURCE_META[source].label.toLowerCase() : '' }} metric
      </div>
      <v-card
        v-for="metric in metrics"
        :key="metric.id"
        flat
        border
        rounded="lg"
        class="pa-4 wizard-manual__option"
        @click="selectMetric(metric.id)"
      >
        <div class="text-subtitle-2 font-weight-bold">{{ metric.label }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ metric.description }}</div>
      </v-card>
    </div>

    <div v-else-if="step === 'visualization'" class="d-flex flex-column ga-3">
      <div class="text-subtitle-2 font-weight-bold">Choose a visualization</div>
      <v-row>
        <v-col v-for="type in widgetTypes" :key="type" cols="12" sm="6">
          <v-card
            flat
            border
            rounded="lg"
            class="pa-4 wizard-manual__option h-100"
            @click="selectWidgetType(type)"
          >
            <div class="text-subtitle-2 font-weight-bold text-capitalize">{{ type }}</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{
                type === 'kpi'
                  ? 'A compact headline metric.'
                  : type === 'timeseries'
                    ? 'Trend analysis across the selected period.'
                    : type === 'bar'
                      ? 'Compare values across categories.'
                      : 'Show tabular records with quick drill-down context.'
              }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-else class="d-flex flex-column ga-5">
      <div>
        <div class="text-subtitle-2 font-weight-bold mb-3">Name and preview</div>
        <v-text-field
          :model-value="widgetTitle"
          label="Widget title"
          placeholder="Give this widget a clear name"
          density="comfortable"
          @update:model-value="(value: string) => emit('update:widgetTitle', value)"
        />
      </div>

      <DashboardWidgetCard
        v-if="previewWidget"
        :account-id="accountId"
        :widget="previewWidget"
        :filters="filters"
        preview
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.wizard-manual__option {
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.wizard-manual__option:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow: var(--mp-shadow-md);
  transform: translateY(-1px);
}
</style>
