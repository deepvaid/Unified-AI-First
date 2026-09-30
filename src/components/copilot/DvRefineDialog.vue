<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { buildDraftPreviewWidget } from '@/components/dashboards/wizard/buildPreviewWidget'
import { optionFor, optionsForMetric } from '@/davinci/widgetRequest'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardChartVariant,
  DashboardFilterState,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '@/stores/dashboards/types'

// Rename a draft and choose how it is drawn. The choices are exactly the views the metric can
// be drawn as — the old fixed tiles (KPI/Bar/Line/Area/Donut/Table/Scatter/Funnel) mapped most
// metrics onto a type they don't support, so "Add to dashboard" silently added nothing.

const props = defineProps<{
  modelValue: boolean
  draft: DashboardWidgetDraft
  accountId: string
  filters: DashboardFilterState
  sourceLabel: string
  /** Why the draft can't be added right now (full dashboard, unsupported…). Disables Add. */
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [payload: { title: string; type: DashboardWidgetType; chartVariant?: DashboardChartVariant }]
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const metric = computed(() => getMetricDescriptor(props.draft.metricId))
const options = computed(() => (metric.value ? optionsForMetric(metric.value) : []))

function initialKey(): string {
  const current = optionFor(props.draft.type, props.draft.chartVariant)
  return options.value.some((o) => o.key === current.key) ? current.key : (options.value[0]?.key ?? current.key)
}

const name = ref(props.draft.title ?? '')
const selectedKey = ref(initialKey())

watch(
  () => [props.modelValue, props.draft] as const,
  ([open]) => {
    if (!open) return
    name.value = props.draft.title ?? ''
    selectedKey.value = initialKey()
  },
  { immediate: true },
)

const selected = computed(() => options.value.find((o) => o.key === selectedKey.value) ?? optionFor(props.draft.type, props.draft.chartVariant))
const draftName = computed(() => name.value.trim() || props.draft.title || 'Widget draft')

const previewWidget = computed(() =>
  buildDraftPreviewWidget(
    { ...props.draft, title: draftName.value },
    { type: selected.value.type, chartVariant: selected.value.chartVariant },
  ),
)

function handleApply() {
  emit('apply', { title: draftName.value, type: selected.value.type, chartVariant: selected.value.chartVariant })
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Composes MpDialog (P4-6). Was its own head/body/foot at 16x20 / 20 / 12x16. -->
  <MpDialog
    v-model="localOpen"
    size="md"
    title="Refine draft"
    subtitle="Rename it or pick how it’s drawn — the preview uses your live data."
    icon="sparkles"
  >
    <div class="dv-refine__cols">
      <MpFormGrid>
        <v-text-field
          id="dv-refine-name"
          v-model="name"
          label="Widget name"
        />

        <MpFormField label="Visualisation">
          <div v-if="options.length > 1" class="dv-refine__tiles" role="group" aria-label="Visualisation">
            <button
              v-for="option in options"
              :key="option.key"
              type="button"
              class="dv-refine__tile"
              :class="{ 'is-selected': selectedKey === option.key }"
              :aria-pressed="selectedKey === option.key"
              @click="selectedKey = option.key"
            >
              <v-icon size="18">{{ option.icon }}</v-icon>
              <span class="dv-refine__tile-label">{{ option.label }}</span>
            </button>
          </div>
          <div v-else class="dv-refine__static">
            <v-icon size="16">{{ selected.icon }}</v-icon>
            <span>{{ selected.label }} — the only view {{ metric?.label ?? 'this metric' }} has</span>
          </div>
        </MpFormField>

        <MpFormField label="Source">
          <div class="dv-refine__source">
            <v-icon color="primary" size="16">database</v-icon>
            <span>{{ sourceLabel }}</span>
          </div>
        </MpFormField>
      </MpFormGrid>

      <div class="dv-refine__preview">
        <MpFormSection title="Preview" />
        <div class="dv-refine__frame" :class="{ 'dv-refine__frame--kpi': selected.type === 'kpi' }">
          <!-- Keyed by view: switching tiles remounts the card instead of changing a live chart's props. -->
          <DashboardWidgetCard
            v-if="previewWidget"
            :key="selected.key"
            :account-id="accountId"
            :widget="previewWidget"
            :filters="filters"
            preview
            :show-actions="false"
          />
        </div>
      </div>
    </div>

    <MpAlert v-if="error" tone="error" icon="circle-alert">{{ error }}</MpAlert>

    <template #footer>
      <v-btn variant="flat" class="text-none" @click="close" color="surface">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!!error" @click="handleApply">
        <v-icon size="16" start>plus</v-icon>
        Add to dashboard
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped lang="scss">
/* The two-column body sits inside MpDialog's inset, so it only owns the gap
   between its own columns. */
.dv-refine__cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: var(--mp-component-card-padding);
}

.dv-refine__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--mp-space-64), 1fr));
  gap: var(--mp-space-6);
}

.dv-refine__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-8) var(--mp-space-6);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
}

.dv-refine__tile:hover {
  border-color: rgb(var(--v-theme-outline));
  color: rgb(var(--v-theme-on-surface));
}

.dv-refine__tile:focus-visible {
  /* 2px focus ring: geometry, off the spacing scale by decision (DESIGN_AUDIT P4). */
  outline: 2px solid color-mix(in oklch, var(--dv-accent) 60%, transparent);
  outline-offset: 2px;
}

.dv-refine__tile.is-selected {
  border-color: rgb(var(--v-theme-primary));
  background: color-mix(in oklch, rgb(var(--v-theme-primary)) 10%, rgb(var(--v-theme-surface)));
  color: rgb(var(--v-theme-primary));
}

.dv-refine__tile-label {
  font-size: var(--mp-fontSize-12);
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
}

.dv-refine__static,
.dv-refine__source {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-8) var(--mp-space-12);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--mp-radius-10);
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface));
}

.dv-refine__preview {
  min-width: 0;
}

/* The live card sizes its chart from its own body — the frame must have a definite height. */
.dv-refine__frame {
  height: var(--mp-component-preview-widgetHeight-md);
}

.dv-refine__frame--kpi {
  height: var(--mp-component-preview-widgetHeight-sm);
}
</style>
