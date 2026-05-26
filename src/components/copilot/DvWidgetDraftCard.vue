<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DvDraftPreview from '@/components/copilot/DvDraftPreview.vue'
import DvRefineDialog from '@/components/copilot/DvRefineDialog.vue'
import DvExpandDialog from '@/components/copilot/DvExpandDialog.vue'
import type { DashboardFilterState, DashboardWidgetDraft, DashboardWidgetType, DashboardChartVariant } from '@/stores/dashboards/types'
import { useDashboardsStore } from '@/stores/useDashboards'

const props = withDefaults(defineProps<{
  accountId: string
  dashboardId: string
  draft: DashboardWidgetDraft
  filters?: DashboardFilterState
  selected?: boolean
}>(), {
  filters: () => ({
    rangePreset: 'last_30_days',
    grain: 'daily',
    comparison: 'previous_period',
  }),
  selected: false,
})

const emit = defineEmits<{
  saved: [payload: { title: string; dashboardName: string }]
  refined: [payload: { title: string }]
}>()

const route = useRoute()
const dashboardsStore = useDashboardsStore()
const isAdded = ref(false)
const localDraft = ref<DashboardWidgetDraft>({ ...props.draft })
const refineOpen = ref(false)
const expandOpen = ref(false)

watch(
  () => props.draft,
  (next) => {
    localDraft.value = { ...next }
    isAdded.value = false
  },
  { deep: true },
)

const currentAccountId = computed(() => {
  const routeAccountId = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId
  return routeAccountId ?? props.accountId
})

const currentDashboard = computed(() => {
  const routeDashboardId = Array.isArray(route.params.dashboardId)
    ? route.params.dashboardId[0]
    : route.params.dashboardId
  return dashboardsStore.getDashboardById(currentAccountId.value, routeDashboardId)
    ?? dashboardsStore.getDashboardById(props.accountId, props.dashboardId)
})

const effectiveAccountId = computed(() => currentDashboard.value?.accountId ?? currentAccountId.value)
const effectiveDashboardId = computed(() => currentDashboard.value?.id ?? props.dashboardId)

const TYPE_META: Record<DashboardWidgetType, { label: string; icon: string }> = {
  kpi: { label: 'KPI summary', icon: 'layout-grid' },
  bar: { label: 'Bar chart', icon: 'bar-chart-3' },
  timeseries: { label: 'Time series', icon: 'line-chart' },
  pie: { label: 'Donut chart', icon: 'pie-chart' },
  table: { label: 'Table', icon: 'table' },
  setup: { label: 'Setup guide', icon: 'list-checks' },
  activity: { label: 'Activity feed', icon: 'list' },
}

const typeMeta = computed(() => {
  const meta = TYPE_META[localDraft.value.type] ?? TYPE_META.kpi
  if (localDraft.value.type === 'timeseries') {
    if (localDraft.value.chartVariant === 'area') return { label: 'Area chart', icon: 'area-chart' }
    return { label: 'Line chart', icon: 'line-chart' }
  }
  return meta
})

const draftTitle = computed(() => localDraft.value.title || 'Widget draft')
const draftSubtitle = computed(() => localDraft.value.subtitle || 'Sourced from your account data')

const sourceLabel = computed(() => {
  const sourceMap: Record<string, string> = {
    marketing: 'Marketing → Email Campaigns',
    commerce: 'Commerce → Orders',
    contacts: 'Contacts → All contacts',
    service: 'Service → Tickets',
    products: 'Products → Catalogue',
  }
  const key = localDraft.value.dataSource as string
  return `${sourceMap[key] ?? 'Workspace data'} · Last 30 days`
})

function handleAdd() {
  if (isAdded.value) return
  refineOpen.value = true
}

function commitDraft() {
  if (isAdded.value) return
  if (!currentDashboard.value) return

  const widget = dashboardsStore.addWidget(effectiveAccountId.value, {
    ...localDraft.value,
    dashboardId: effectiveDashboardId.value,
  })
  if (widget) {
    isAdded.value = true
    emit('saved', {
      title: widget.title || localDraft.value.title || 'Widget',
      dashboardName: currentDashboard.value.name,
    })
  }
}

function handleRefineApply(payload: { title: string; type: DashboardWidgetType; chartVariant?: DashboardChartVariant }) {
  localDraft.value = {
    ...localDraft.value,
    title: payload.title,
    type: payload.type,
    chartVariant: payload.chartVariant,
  }
  emit('refined', { title: payload.title })
  refineOpen.value = false
  commitDraft()
}

function handleExpandAdd() {
  expandOpen.value = false
  commitDraft()
}
</script>

<template>
  <article class="dv-draft" :class="{ 'is-selected': selected, 'is-added': isAdded }">
    <header class="dv-draft__top">
      <span class="dv-draft__type">
        <v-icon size="14">{{ typeMeta.icon }}</v-icon>
        {{ typeMeta.label }}
      </span>
      <span class="dv-draft__badge">
        <v-icon size="11">sparkles</v-icon>
        Draft
      </span>
    </header>

    <div class="dv-draft__title-block">
      <h3 class="dv-draft__title">{{ draftTitle }}</h3>
      <div class="dv-draft__sub">{{ draftSubtitle }}</div>
    </div>

    <div class="dv-draft__preview">
      <DvDraftPreview :draft="localDraft" />
    </div>

    <footer class="dv-draft__actions">
      <v-btn
        class="dv-draft__btn dv-draft__btn--primary text-none"
        variant="flat"
        color="primary"
        :disabled="isAdded"
        density="comfortable"
        @click="handleAdd"
      >
        <v-icon size="15" start>{{ isAdded ? 'check' : 'plus' }}</v-icon>
        {{ isAdded ? 'Added' : 'Add widget' }}
      </v-btn>
      <div class="dv-draft__actions-spacer"></div>
      <v-btn
        icon
        size="32"
        variant="text"
        aria-label="Preview at full size"
        @click="expandOpen = true"
      >
        <v-icon size="16">maximize-2</v-icon>
        <v-tooltip activator="parent" location="left">Preview at full size</v-tooltip>
      </v-btn>
    </footer>

    <DvRefineDialog
      v-model="refineOpen"
      :draft="localDraft"
      :source-label="sourceLabel"
      @apply="handleRefineApply"
    />

    <DvExpandDialog
      v-model="expandOpen"
      :draft="localDraft"
      :type-label="typeMeta.label"
      :is-added="isAdded"
      @add="handleExpandAdd"
    />
  </article>
</template>

<style scoped lang="scss">
.dv-draft {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  position: relative;
  transition: border-color 120ms ease, box-shadow 120ms ease, opacity 220ms ease, transform 220ms ease;
}

.dv-draft:hover {
  border-color: rgb(var(--v-theme-outline));
}

.dv-draft.is-selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px color-mix(in oklch, rgb(var(--v-theme-primary)) 18%, transparent);
}

.dv-draft.is-added {
  opacity: 0.55;
}

.dv-draft__top {
  padding: 12px 14px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.dv-draft__type {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dv-draft__type :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.dv-draft__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: var(--dv-grad);
  color: #1E1B4B;
  border: none;
}

.dv-draft__badge :deep(.v-icon) {
  color: #1E1B4B !important;
}

.dv-draft__title-block {
  padding: 8px 14px 12px;
}

.dv-draft__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.1px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 2px;
}

.dv-draft__sub {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.35;
}

.dv-draft__preview {
  padding: 0 14px 14px;
}


.dv-draft__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-draft__btn {
  height: 32px !important;
  min-height: 32px !important;
  border-radius: 9999px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0;
}

.dv-draft__btn--ghost {
  color: rgb(var(--v-theme-on-surface-variant)) !important;
  font-weight: 500 !important;
}

.dv-draft__actions-spacer {
  flex: 1;
}
</style>
