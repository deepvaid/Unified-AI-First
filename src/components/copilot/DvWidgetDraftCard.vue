<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import DvExpandDialog from '@/components/copilot/DvExpandDialog.vue'
import DvRefineDialog from '@/components/copilot/DvRefineDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import { buildDraftPreviewWidget } from '@/components/dashboards/wizard/buildPreviewWidget'
import { useDaVinciTarget } from '@/composables/useDaVinciTarget'
import { addBlockerMessage, optionFor, timeBasisLabel } from '@/davinci/widgetRequest'
import { DASHBOARD_SOURCE_META, getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardChartVariant,
  DashboardFilterState,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '@/stores/dashboards/types'
import type { AddedWidgetRef } from '@/stores/useCopilot'
import { useDashboardsStore } from '@/stores/useDashboards'

// A Da Vinci draft, drawn as the REAL dashboard widget it would become — same card, same
// data, same numbers as the dashboard (the old preview was hard-coded sample art that
// contradicted the KPIs on the page it was about to join).

const props = withDefaults(defineProps<{
  accountId: string
  dashboardId: string
  draft: DashboardWidgetDraft
  /** Dashboard filters to preview with; defaults to the target dashboard's own. */
  filters?: DashboardFilterState
  /** What differs from what was asked for ("Orders can only be shown as a KPI tile…"). */
  note?: string | null
  /** Set once this draft became a widget; persisted on the message so a remount can't offer Add twice. */
  added?: AddedWidgetRef | null
  selected?: boolean
}>(), {
  filters: undefined,
  note: null,
  added: null,
  selected: false,
})

const emit = defineEmits<{
  saved: [payload: AddedWidgetRef]
}>()

const dashboardsStore = useDashboardsStore()

// "Add widget" lands the widget on the dashboard the merchant is looking at; the host's target
// (and finally the dashboard the draft was made for) only apply off a dashboard route.
const { dashboard: target } = useDaVinciTarget({
  accountId: () => props.accountId,
  dashboardId: () => props.dashboardId || props.draft.dashboardId,
})
const effectiveAccountId = computed(() => target.value?.accountId ?? props.accountId)
const effectiveDashboardId = computed(() => target.value?.id ?? props.dashboardId)

const DEFAULT_FILTERS: DashboardFilterState = { rangePreset: 'last_30_days', grain: 'daily', comparison: 'previous_period' }
const previewFilters = computed(() => props.filters ?? target.value?.filters ?? DEFAULT_FILTERS)

const localDraft = ref<DashboardWidgetDraft>({ ...props.draft })
watch(() => props.draft, (next) => { localDraft.value = { ...next } }, { deep: true })

const refineOpen = ref(false)
const expandOpen = ref(false)
const addError = ref('')
const savedHere = ref<AddedWidgetRef | null>(null)

const descriptor = computed(() => getMetricDescriptor(localDraft.value.metricId))
const option = computed(() => optionFor(localDraft.value.type, localDraft.value.chartVariant))
const previewWidget = computed(() => buildDraftPreviewWidget(localDraft.value))
const isKpiPreview = computed(() => localDraft.value.type === 'kpi')

const sourceLabel = computed(() => {
  const metric = descriptor.value
  if (!metric) return 'Workspace data'
  return `${DASHBOARD_SOURCE_META[metric.dataSource].label} → ${metric.label} · ${timeBasisLabel(metric, previewFilters.value.rangePreset)}`
})

/** Added — and the widget is still on that dashboard (Undo or a manual delete re-enables Add). */
const isAdded = computed(() => {
  const ref = props.added ?? savedHere.value
  if (!ref) return false
  return !!dashboardsStore.getDashboardById(ref.accountId, ref.dashboardId)?.widgets.some((w) => w.id === ref.widgetId)
})

const blocker = computed(() => {
  if (isAdded.value) return null
  return dashboardsStore.addWidgetBlocker(effectiveAccountId.value, { ...localDraft.value, dashboardId: effectiveDashboardId.value })
})
const errorText = computed(() => addError.value || (blocker.value ? addBlockerMessage(blocker.value) : ''))

function handleAdd() {
  if (isAdded.value || blocker.value) return
  addError.value = ''
  refineOpen.value = true
}

/** Returns true when the widget was added. Refine and Expand stay open on failure so the error is visible. */
function commit(view?: { type: DashboardWidgetType; chartVariant?: DashboardChartVariant }): boolean {
  if (isAdded.value) return true
  const draft: DashboardWidgetDraft = {
    ...localDraft.value,
    ...(view ? { type: view.type, chartVariant: view.chartVariant } : {}),
    dashboardId: effectiveDashboardId.value,
  }
  const refused = dashboardsStore.addWidgetBlocker(effectiveAccountId.value, draft)
  if (refused) {
    addError.value = addBlockerMessage(refused)
    return false
  }
  const widget = dashboardsStore.addWidget(effectiveAccountId.value, draft)
  if (!widget) {
    addError.value = 'Da Vinci couldn’t add this widget. Try again, or add it from the dashboard’s Add widget menu.'
    return false
  }
  addError.value = ''
  localDraft.value = draft
  const added: AddedWidgetRef = {
    title: widget.title || draft.title || 'Widget',
    dashboardName: target.value?.name ?? 'your dashboard',
    widgetId: widget.id,
    dashboardId: effectiveDashboardId.value,
    accountId: effectiveAccountId.value,
  }
  savedHere.value = added
  emit('saved', added)
  return true
}

function handleRefineApply(payload: { title: string; type: DashboardWidgetType; chartVariant?: DashboardChartVariant }) {
  localDraft.value = { ...localDraft.value, title: payload.title }
  if (commit({ type: payload.type, chartVariant: payload.chartVariant })) refineOpen.value = false
}

function handleExpandAdd() {
  if (commit()) expandOpen.value = false
}
</script>

<template>
  <article class="dv-draft" :class="{ 'is-selected': selected, 'is-added': isAdded }">
    <header class="dv-draft__top">
      <span class="dv-draft__type">
        <v-icon size="14">{{ option.icon }}</v-icon>
        {{ option.noun }}
      </span>
      <span class="dv-draft__badge">
        <v-icon size="11">sparkles</v-icon>
        Draft
      </span>
    </header>

    <MpAlert v-if="note && !isAdded" tone="info" icon="info" live="off" class="dv-draft__alert">{{ note }}</MpAlert>

    <div class="dv-draft__preview">
      <div class="dv-draft__frame" :class="{ 'dv-draft__frame--kpi': isKpiPreview }">
        <DashboardWidgetCard
          v-if="previewWidget"
          :key="`${previewWidget.type}-${previewWidget.chartVariant ?? ''}`"
          :account-id="effectiveAccountId"
          :widget="previewWidget"
          :filters="previewFilters"
          preview
          :show-actions="false"
        />
      </div>
    </div>

    <MpAlert v-if="errorText && !isAdded" tone="error" icon="circle-alert" live="off" class="dv-draft__alert">{{ errorText }}</MpAlert>

    <footer class="dv-draft__actions">
      <v-btn
        class="dv-draft__btn dv-draft__btn--primary text-none"
        variant="flat"
        color="primary"
        :disabled="isAdded || !!blocker"
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
      :account-id="effectiveAccountId"
      :filters="previewFilters"
      :source-label="sourceLabel"
      :error="errorText"
      @apply="handleRefineApply"
    />

    <DvExpandDialog
      v-model="expandOpen"
      :draft="localDraft"
      :account-id="effectiveAccountId"
      :filters="previewFilters"
      :type-label="option.label"
      :is-added="isAdded"
      :error="errorText"
      @add="handleExpandAdd"
    />
  </article>
</template>

<style scoped lang="scss">
.dv-draft {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-12);
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
  padding: var(--mp-space-12) var(--mp-space-14) var(--mp-space-8);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-10);
}

.dv-draft__type {
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.dv-draft__type :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.dv-draft__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-4) var(--mp-space-8) var(--mp-space-4) var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  /* Soft Da Vinci accent tint — matches the orb/mic/chips; legible at this size.
     The brand gradient read muddy and low-contrast as a tiny pill background. */
  background: var(--dv-accent-soft);
  color: var(--dv-accent);
  border: none;
}

.dv-draft__badge :deep(.v-icon) {
  color: var(--dv-accent) !important;
}

/* The note and any error sit inside the card's inset, like the preview. */
.dv-draft__alert {
  margin: 0 var(--mp-space-14) var(--mp-space-10);
}

.dv-draft__preview {
  padding: 0 var(--mp-space-14) var(--mp-space-14);
}

/* A live DashboardWidgetCard sizes its chart from its own body, so the frame needs a definite height. */
.dv-draft__frame {
  height: var(--mp-component-preview-widgetHeight-md);
}

.dv-draft__frame--kpi {
  height: var(--mp-component-preview-widgetHeight-sm);
}

.dv-draft__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-10) var(--mp-space-12);
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-draft__btn {
  height: var(--mp-space-32) !important;
  min-height: var(--mp-space-32) !important;
  border-radius: var(--mp-radius-full) !important;
  font-size: var(--mp-fontSize-13) !important;
  font-weight: 600 !important;
  letter-spacing: 0;
}

.dv-draft__actions-spacer {
  flex: 1;
}
</style>
