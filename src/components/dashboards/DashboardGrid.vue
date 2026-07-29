<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { useDisplay } from 'vuetify'
import MpEmptyState from '@/components/MpEmptyState.vue'
import type { DashboardFilterState, DashboardWidget } from '@/stores/dashboards/types'
import { getDefaultPreset, type WidgetSize } from './widgetSizePresets'
import DashboardWidgetCard from './DashboardWidgetCard.vue'
import DashboardSetupGuide, { type SetupGuideTask } from './DashboardSetupGuide.vue'

const props = defineProps<{
  accountId: string
  dashboardId: string
  widgets: DashboardWidget[]
  filters: DashboardFilterState
  setupTasks?: SetupGuideTask[]
  setupCompleted?: number
  setupProgress?: number
  setupTotal?: number
  setupGuideRoute?: RouteLocationRaw
}>()

const emit = defineEmits<{
  expandWidget: [widgetId: string]
  editWidget: [widgetId: string]
  refreshWidget: [widgetId: string]
  removeWidget: [widgetId: string]
  resizeWidget: [payload: { widgetId: string; size: WidgetSize }]
  updateLayout: [layout: Array<{ i: string; x: number; y: number; w: number; h: number }>]
  addWidget: []
  selectSetupTask: [task: SetupGuideTask]
}>()

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

const layout = ref<LayoutItem[]>([])
const { mdAndDown } = useDisplay()

function normalizeLayout(items: Array<{ i: string; x: number; y: number; w: number; h: number }>): LayoutItem[] {
  return [...items]
    .map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }))
    .sort((left, right) => left.i.localeCompare(right.i))
}

function layoutsMatch(
  left: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  right: Array<{ i: string; x: number; y: number; w: number; h: number }>,
): boolean {
  if (left.length !== right.length) return false

  const normalizedLeft = normalizeLayout(left)
  const normalizedRight = normalizeLayout(right)

  return normalizedLeft.every((item, index) => {
    const comparison = normalizedRight[index]
    return comparison
      && item.i === comparison.i
      && item.x === comparison.x
      && item.y === comparison.y
      && item.w === comparison.w
      && item.h === comparison.h
  })
}

const layoutFromWidgets = computed<LayoutItem[]>(() => {
  const kpiRowsNeedingSpace = [...new Set(
    props.widgets
      .filter((widget) => widget.type === 'kpi' && widget.layout.h < 4)
      .map((widget) => widget.layout.y),
  )].sort((left, right) => left - right)

  return props.widgets.map((widget) => {
    const fallback = getDefaultPreset(widget.type)
    const yOffset = kpiRowsNeedingSpace.filter((rowY) => widget.layout.y > rowY).length
    const h = widget.type === 'kpi' ? Math.max(widget.layout.h, 4) : widget.layout.h

    return {
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y + yOffset,
      w: widget.layout.w,
      h,
      minW: widget.layout.minW ?? fallback.minW,
      minH: widget.layout.minH ?? fallback.minH,
    }
  })
})

const widgetsById = computed(() => new Map(props.widgets.map((widget) => [widget.id, widget])))
const sortedWidgets = computed(() =>
  [...props.widgets].sort((left, right) => left.layout.y - right.layout.y || left.layout.x - right.layout.x),
)

// Signature entrance: every card fades up once (.mp-enter); only the first row
// is staggered left-to-right so the rhythm reads without animating the whole grid.
const firstRowY = computed(() => (layout.value.length ? Math.min(...layout.value.map((item) => item.y)) : 0))
function enterDelay(item: LayoutItem): string | undefined {
  if (item.y !== firstRowY.value) return undefined
  const rowItems = layout.value
    .filter((entry) => entry.y === firstRowY.value)
    .sort((left, right) => left.x - right.x)
  const index = rowItems.findIndex((entry) => entry.i === item.i)
  return index > 0 ? `calc(var(--stagger-step) * ${index})` : undefined
}

watch(
  layoutFromWidgets,
  (nextLayout) => {
    if (layoutsMatch(layout.value, nextLayout)) return
    layout.value = nextLayout
  },
  { immediate: true, deep: true },
)

function handleLayoutUpdate(nextLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) {
  if (layoutsMatch(nextLayout, layoutFromWidgets.value)) return
  emit('updateLayout', nextLayout)
}
</script>

<template>
  <div class="dashboard-grid">
    <MpEmptyState
      v-if="widgets.length === 0"
      icon="grid-2x2-plus"
      title="This dashboard is empty"
      description="Add a manual widget or ask Da Vinci to create one from your account data."
      action-label="Add widget"
      action-icon="plus"
      @action="emit('addWidget')"
    />

    <GridLayout
      v-else-if="!mdAndDown"
      v-model:layout="layout"
      :col-num="12"
      :row-height="44"
      :margin="[18, 18]"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="true"
      :use-css-transforms="true"
      class="dashboard-grid__layout"
      @layout-updated="handleLayoutUpdate"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :min-w="item.minW"
        :min-h="item.minH"
        drag-allow-from=".dashboard-widget-drag"
        drag-ignore-from="a, button, input, textarea, .v-btn, .v-field"
      >
        <template v-if="widgetsById.get(item.i)">
          <DashboardSetupGuide
            v-if="widgetsById.get(item.i)!.type === 'setup'"
            class="mp-enter"
            :style="{ animationDelay: enterDelay(item) }"
            :tasks="setupTasks ?? []"
            :completed-count="setupCompleted ?? 0"
            :progress="setupProgress ?? 0"
            :total-count="setupTotal"
            :guide-route="setupGuideRoute"
            :draggable="true"
            @select-task="emit('selectSetupTask', $event)"
          />
          <DashboardWidgetCard
            v-else
            class="mp-enter"
            :style="{ animationDelay: enterDelay(item) }"
            :account-id="accountId"
            :widget="widgetsById.get(item.i)!"
            :filters="filters"
            :draggable="true"
            @expand="emit('expandWidget', $event)"
            @edit="emit('editWidget', $event)"
            @refresh="emit('refreshWidget', $event)"
            @remove="emit('removeWidget', $event)"
            @resize="emit('resizeWidget', $event)"
          />
        </template>
      </GridItem>
    </GridLayout>

    <div v-else class="dashboard-grid__mobile-list">
      <div
        v-for="widget in sortedWidgets"
        :key="widget.id"
        class="dashboard-grid__mobile-item mp-enter"
        :class="{
          'dashboard-grid__mobile-item--kpi': widget.type === 'kpi',
          'dashboard-grid__mobile-item--table': widget.type === 'table',
        }"
      >
        <DashboardSetupGuide
          v-if="widget.type === 'setup'"
          :tasks="setupTasks ?? []"
          :completed-count="setupCompleted ?? 0"
          :progress="setupProgress ?? 0"
          :total-count="setupTotal"
          :guide-route="setupGuideRoute"
          @select-task="emit('selectSetupTask', $event)"
        />
        <DashboardWidgetCard
          v-else
          :account-id="accountId"
          :widget="widget"
          :filters="filters"
          @expand="emit('expandWidget', $event)"
          @edit="emit('editWidget', $event)"
          @refresh="emit('refreshWidget', $event)"
          @remove="emit('removeWidget', $event)"
          @resize="emit('resizeWidget', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-grid {
  min-height: 260px;
  margin-inline: -14px;
}

.dashboard-grid__layout {
  min-height: 300px;
  position: relative;
  transition: background 160ms ease;
}

.dashboard-grid__mobile-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

@media (min-width: 640px) {
  .dashboard-grid__mobile-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid__mobile-item:not(.dashboard-grid__mobile-item--kpi) {
    grid-column: 1 / -1;
  }
}

.dashboard-grid__mobile-item {
  height: 360px;
}

.dashboard-grid__mobile-item--kpi {
  height: auto;
  min-height: 168px;
}

.dashboard-grid__mobile-item--table {
  height: 340px;
}

/* Column guides appear only while a card is actively being dragged or resized.
   (:has() arguments are not scope-rewritten, so the unscoped vgl classes match.) */
.dashboard-grid__layout:has(.vgl-item--dragging),
.dashboard-grid__layout:has(.vgl-item--resizing) {
  background-image:
    repeating-linear-gradient(
      to right,
      rgba(var(--v-theme-primary), 0.08) 0,
      rgba(var(--v-theme-primary), 0.08) 1px,
      transparent 1px,
      transparent calc(100% / 12)
    );
  border-radius: 12px;
}

.dashboard-grid :deep(.vgl-item) {
  display: flex;
}

.dashboard-grid :deep(.vgl-item > *:not(.vgl-item__resizer)) {
  width: 100%;
  height: 100%;
}

.dashboard-grid :deep(.vgl-item--placeholder) {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border: 2px dashed rgba(var(--v-theme-primary), 0.55) !important;
  border-radius: 12px !important;
  opacity: 1 !important;
  transition: transform 120ms ease, width 120ms ease, height 120ms ease;
}

.dashboard-grid :deep(.vgl-item.vgl-item--dragging),
.dashboard-grid :deep(.vgl-item.vgl-item--resizing) {
  z-index: 3;
  cursor: grabbing;
}

/* Lets a hovered widget's tooltip (which escapes its overflow:hidden
   ancestors, see DashboardWidgetCard--chart) paint above later DOM siblings.
   Kept below the dragging/resizing z-index so those states still win. */
.dashboard-grid :deep(.vgl-item:hover) {
  z-index: 2;
}

.dashboard-grid :deep(.vgl-item.vgl-item--dragging) .dashboard-widget-card,
.dashboard-grid :deep(.vgl-item.vgl-item--resizing) .dashboard-widget-card {
  box-shadow: var(--elevation-modal);
  border-color: rgb(var(--v-theme-primary));
  border-style: solid;
}

.dashboard-grid :deep(.vgl-item__resizer) {
  display: none;
}

/* Resize handle fades in on card hover and stays visible while resizing.
   A refined three-dot corner grip (rounded, soft) instead of hard diagonal
   ticks — reads as a gentle affordance, not a CAD handle. */
.dashboard-grid :deep(.vgl-item:hover .vgl-item__resizer),
.dashboard-grid :deep(.vgl-item--resizing .vgl-item__resizer) {
  display: block;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 26px;
  height: 26px;
  cursor: nwse-resize;
  z-index: 4;
  background-repeat: no-repeat;
  background-image:
    radial-gradient(circle at 18px 18px, rgba(var(--v-theme-on-surface), 0.34) 1.5px, transparent 2.1px),
    radial-gradient(circle at 12px 18px, rgba(var(--v-theme-on-surface), 0.34) 1.5px, transparent 2.1px),
    radial-gradient(circle at 18px 12px, rgba(var(--v-theme-on-surface), 0.34) 1.5px, transparent 2.1px);
  opacity: 0;
  transition: opacity 140ms ease, background-image 120ms ease;
  animation: mp-resizer-in 160ms ease forwards;
}

@keyframes mp-resizer-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dashboard-grid :deep(.vgl-item__resizer:hover) {
  background-image:
    radial-gradient(circle at 18px 18px, rgb(var(--v-theme-primary)) 1.7px, transparent 2.3px),
    radial-gradient(circle at 12px 18px, rgb(var(--v-theme-primary)) 1.7px, transparent 2.3px),
    radial-gradient(circle at 18px 12px, rgb(var(--v-theme-primary)) 1.7px, transparent 2.3px),
    radial-gradient(130% 130% at 100% 100%, rgba(var(--v-theme-primary), 0.12), transparent 68%);
}
</style>
