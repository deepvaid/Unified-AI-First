<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import DvDraftPreview from '@/components/copilot/DvDraftPreview.vue'
import type { DashboardChartVariant, DashboardWidgetDraft, DashboardWidgetType } from '@/stores/dashboards/types'

const props = defineProps<{
  modelValue: boolean
  draft: DashboardWidgetDraft
  sourceLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [payload: { title: string; type: DashboardWidgetType; chartVariant?: DashboardChartVariant }]
}>()

type TileType = 'kpi' | 'bar' | 'line' | 'area' | 'pie' | 'table' | 'scatter' | 'funnel'

interface Tile {
  type: TileType
  label: string
  icon: string
}

const TILES: Tile[] = [
  { type: 'kpi', label: 'KPI', icon: 'layout-grid' },
  { type: 'bar', label: 'Bar', icon: 'bar-chart-3' },
  { type: 'line', label: 'Line', icon: 'line-chart' },
  { type: 'area', label: 'Area', icon: 'area-chart' },
  { type: 'pie', label: 'Donut', icon: 'pie-chart' },
  { type: 'table', label: 'Table', icon: 'table' },
  { type: 'scatter', label: 'Scatter', icon: 'scatter-chart' },
  { type: 'funnel', label: 'Funnel', icon: 'filter' },
]

function inferTile(draft: DashboardWidgetDraft): TileType {
  switch (draft.type) {
    case 'kpi':
      return 'kpi'
    case 'bar':
      return 'bar'
    case 'pie':
      return 'pie'
    case 'table':
      return 'table'
    case 'activity':
      return 'table'
    case 'timeseries':
      return draft.chartVariant === 'area' ? 'area' : 'line'
    default:
      return 'kpi'
  }
}

function tileToWidgetType(tile: TileType): { type: DashboardWidgetType; chartVariant?: DashboardChartVariant } {
  switch (tile) {
    case 'kpi':
      return { type: 'kpi' }
    case 'bar':
      return { type: 'bar' }
    case 'line':
      return { type: 'timeseries', chartVariant: 'line' }
    case 'area':
      return { type: 'timeseries', chartVariant: 'area' }
    case 'pie':
      return { type: 'pie' }
    case 'table':
      return { type: 'table' }
    case 'scatter':
      return { type: 'timeseries', chartVariant: 'line' }
    case 'funnel':
      return { type: 'bar' }
  }
}

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const name = ref(props.draft.title ?? '')
const selectedTile = ref<TileType>(inferTile(props.draft))
const loadingPreview = ref(false)
let loaderTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => [props.modelValue, props.draft] as const,
  ([open]) => {
    if (open) {
      name.value = props.draft.title ?? ''
      selectedTile.value = inferTile(props.draft)
      loadingPreview.value = false
      if (loaderTimer) {
        clearTimeout(loaderTimer)
        loaderTimer = null
      }
    }
  },
  { immediate: true },
)

watch(selectedTile, (next, prev) => {
  if (next === prev) return
  loadingPreview.value = true
  if (loaderTimer) clearTimeout(loaderTimer)
  loaderTimer = setTimeout(() => {
    loadingPreview.value = false
    loaderTimer = null
  }, 500)
})

const previewDraft = computed<DashboardWidgetDraft>(() => {
  const mapped = tileToWidgetType(selectedTile.value)
  return {
    ...props.draft,
    title: name.value.trim() || props.draft.title || 'Widget draft',
    type: mapped.type,
    chartVariant: mapped.chartVariant,
  }
})

function handleApply() {
  const mapped = tileToWidgetType(selectedTile.value)
  emit('apply', {
    title: name.value.trim() || props.draft.title || 'Widget draft',
    type: mapped.type,
    chartVariant: mapped.chartVariant,
  })
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
    subtitle="Adjust the metric, name, or how it&rsquo;s visualised — preview updates live."
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
          <div class="dv-refine__tiles">
            <button
              v-for="tile in TILES"
              :key="tile.type"
              type="button"
              class="dv-refine__tile"
              :class="{ 'is-selected': selectedTile === tile.type }"
              :aria-pressed="selectedTile === tile.type"
              @click="selectedTile = tile.type"
            >
              <v-icon size="18">{{ tile.icon }}</v-icon>
              <span class="dv-refine__tile-label">{{ tile.label }}</span>
            </button>
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
        <div class="dv-refine__preview-frame">
          <DvDraftPreview :draft="previewDraft" density="compact" />
          <transition name="dv-refine-fade">
            <div v-if="loadingPreview" class="dv-refine__preview-loader">
              <v-progress-circular indeterminate size="28" width="3" color="primary" />
              <span class="dv-refine__preview-loader-label">Updating preview…</span>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <template #footer>
      <v-btn variant="flat" class="text-none" @click="close" color="surface">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="handleApply">
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
  grid-template-columns: repeat(4, 1fr);
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
  color: rgb(var(--v-theme-on-surface));
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
}

.dv-refine__tile :deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface-variant));
  transition: color 120ms ease;
}

.dv-refine__tile:hover {
  background: rgb(var(--v-theme-surface-variant));
  border-color: rgb(var(--v-theme-outline));
}

/* P5.5: the fill and the ink each carried their own CSS fallback, and CSS
   resolves them independently — so a theme defining only one of the pair would
   paint the container fill with on-primary ink, or vice versa. Both themes
   define primary-container/on-primary-container, so the fallbacks only added
   a way to desync. */
.dv-refine__tile.is-selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary-container));
}

.dv-refine__tile.is-selected,
.dv-refine__tile.is-selected :deep(.v-icon) {
  color: rgb(var(--v-theme-on-primary-container));
}

.dv-refine__tile-label {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
}

.dv-refine__source {
  display: flex;
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  padding: var(--mp-component-listItem-paddingBlock) var(--mp-component-listItem-paddingInline);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--mp-radius-10);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}

.dv-refine__preview {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-labelGap);
  min-width: 0;
}

.dv-refine__preview-frame {
  position: relative;
  flex: 1;
  /* Plotting-area size, not a spacing step — same exemption as the other
     preview canvases (Phase 2/3). */
  min-height: 260px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-component-card-paddingCompact);
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.dv-refine__preview-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-10);
  background: rgba(var(--v-theme-surface), 0.78);
  backdrop-filter: blur(2px);
}

.dv-refine__preview-loader-label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 0.2px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-refine-fade-enter-active,
.dv-refine-fade-leave-active {
  transition: opacity 160ms ease;
}

.dv-refine-fade-enter-from,
.dv-refine-fade-leave-to {
  opacity: 0;
}
</style>
