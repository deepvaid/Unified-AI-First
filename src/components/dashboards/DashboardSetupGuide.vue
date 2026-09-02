<script setup lang="ts">
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export interface SetupGuideTask {
  title: string
  description: string
  icon: string
  status: string
  complete: boolean
  route: RouteLocationRaw
}

defineProps<{
  tasks: SetupGuideTask[]
  completedCount: number
  progress: number
  /** Overall task total when `tasks` is a subset (e.g. next 5 of 16). Defaults to tasks.length. */
  totalCount?: number
  /** When set, a "View full guide" link renders under the list. */
  guideRoute?: RouteLocationRaw
  /** Grid context: reveals the drag grip on hover (layout is always directly editable). */
  draggable?: boolean
}>()

const emit = defineEmits<{
  selectTask: [task: SetupGuideTask]
}>()

const collapsed = ref(false)

function toggle() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <v-card
    flat
    border
    rounded="lg"
    class="setup-guide-widget h-100 d-flex flex-column"
    :class="{ 'setup-guide-widget--collapsed': collapsed, 'dashboard-widget-drag': draggable }"
    aria-label="Setup guide"
  >
    <header class="setup-guide-widget__header">
      <div class="setup-guide-widget__title-row">
        <h2 class="setup-guide-widget__title">Setup guide</h2>
      </div>
      <v-icon v-if="draggable" size="18" class="setup-guide-widget__drag-handle">grip-vertical</v-icon>
      <button
        type="button"
        class="setup-guide-widget__toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand setup guide' : 'Collapse setup guide'"
        @click="toggle"
      >
        <v-icon size="16">{{ collapsed ? 'chevron-down' : 'chevron-up' }}</v-icon>
      </button>
    </header>

    <div v-show="!collapsed" class="setup-guide-widget__body">
      <p class="setup-guide-widget__desc">
        Use this personalized guide to get your store up and running.
      </p>

      <div class="setup-guide-widget__progress">
        <span class="setup-guide-widget__pill mp-meta-label">
          <strong>{{ completedCount }}</strong> of {{ totalCount ?? tasks.length }} tasks complete
        </span>
        <div
          class="setup-guide-widget__bar"
          role="progressbar"
          aria-label="Setup progress"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span class="setup-guide-widget__bar-fill" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <ul v-if="tasks.length" class="setup-guide-widget__list">
        <li
          v-for="task in tasks"
          :key="task.title"
          class="setup-guide-task"
          :class="{ 'setup-guide-task--done': task.complete }"
        >
          <button
            type="button"
            class="setup-guide-task__btn"
            :aria-label="`${task.title} — ${task.complete ? 'completed' : 'not completed'}`"
            @click="emit('selectTask', task)"
          >
            <span class="setup-guide-task__check" aria-hidden="true">
              <v-icon v-if="task.complete" size="12" class="setup-guide-task__check-icon">check</v-icon>
            </span>
            <span class="setup-guide-task__label">{{ task.title }}</span>
            <v-icon size="16" class="setup-guide-task__chevron">chevron-down</v-icon>
          </button>
        </li>
      </ul>
      <p v-else class="setup-guide-widget__all-done">
        <v-icon size="16" color="success" class="mr-1">circle-check</v-icon>
        You're all set — every setup step is done.
      </p>

      <router-link v-if="guideRoute" :to="guideRoute" class="setup-guide-widget__more">
        View full guide
        <v-icon size="16">arrow-right</v-icon>
      </router-link>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.setup-guide-widget {
  padding: var(--mp-space-20) var(--mp-space-24) var(--mp-space-8);
  background: var(--surface-primary);
  border-color: var(--border-subtle) !important;
  /* Match the widget-card radius so every dashboard card is identical */
  border-radius: var(--mp-radius-12) !important;
  box-shadow: none;
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.2s ease;
}

.setup-guide-widget:hover {
  /* !important so the lift beats the finished .mp-enter animation (fill: both
     keeps its final transform:none applied; only !important wins over it) */
  transform: translateY(-2px) !important;
  border-color: color-mix(in oklch, var(--accent) 26%, var(--border-subtle)) !important;
  box-shadow: var(--elevation-modal);
}

@media (prefers-reduced-motion: reduce) {
  .setup-guide-widget:hover {
    transform: none !important;
  }
}

.setup-guide-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  flex: 0 0 auto;
}

.setup-guide-widget__title-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  min-width: 0;
}

/* Drag grip fades in on hover; the whole guide is the drag region in grid context. */
.setup-guide-widget__drag-handle {
  /* Sits with the collapse toggle in the top-right (consistent grip placement). */
  margin-left: auto;
  color: var(--muted);
  cursor: grab;
  opacity: 0;
  transition: opacity 120ms ease;
}

.setup-guide-widget:hover .setup-guide-widget__drag-handle {
  opacity: 1;
}

.setup-guide-widget.dashboard-widget-drag {
  cursor: grab;
}

.setup-guide-widget__title {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.2;
}

.setup-guide-widget__toggle {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: var(--mp-component-chip-radius);
  appearance: none;
  transition: background 120ms ease, color 120ms ease;
}

.setup-guide-widget__toggle:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.setup-guide-widget__toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 35%, transparent);
}

.setup-guide-widget__body {
  margin-top: var(--mp-space-4);
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.setup-guide-widget__desc {
  margin: 0 0 var(--mp-space-12);
  font-size: var(--mp-fontSize-13);
  line-height: 1.45;
  color: var(--muted);
  flex: 0 0 auto;
}

.setup-guide-widget__progress {
  padding-bottom: var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
  flex: 0 0 auto;
}

.setup-guide-widget__pill {
  display: inline-block;
  color: var(--muted);
  margin-bottom: var(--mp-space-8);
}

.setup-guide-widget__pill strong {
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-bold);
}

.setup-guide-widget__bar {
  height: 6px;
  border-radius: var(--mp-radius-full);
  background: color-mix(in oklch, var(--text-primary) 8%, var(--surface-primary));
  overflow: hidden;
}

.setup-guide-widget__bar-fill {
  display: block;
  height: 100%;
  background: var(--text-primary);
  border-radius: var(--mp-radius-full);
  transition: width 240ms ease;
}

.setup-guide-widget__list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.setup-guide-task {
  border-bottom: 1px solid var(--border-subtle);
}

.setup-guide-task:last-child {
  border-bottom: 0;
}

.setup-guide-task__btn {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-12);
  width: 100%;
  padding: var(--mp-space-10) 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
  appearance: none;
  transition: opacity 120ms ease;
}

.setup-guide-task__btn:hover .setup-guide-task__label {
  color: var(--accent-ink);
}

.setup-guide-task__btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 35%, transparent);
  border-radius: var(--mp-component-chip-radius);
}

.setup-guide-task__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px dashed var(--muted);
  flex-shrink: 0;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
}

.setup-guide-task--done .setup-guide-task__check {
  border: 0;
  background: var(--pos);
}

.setup-guide-task__check-icon {
  color: rgb(var(--v-theme-surface)) !important;
}

.setup-guide-task__label {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 120ms ease;
}

.setup-guide-task--done .setup-guide-task__label {
  color: var(--muted);
}

.setup-guide-task__chevron {
  color: var(--muted);
  flex-shrink: 0;
}

.setup-guide-widget__all-done {
  display: flex;
  align-items: center;
  margin: var(--mp-space-8) 0;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--muted);
  flex: 1 1 auto;
}

.setup-guide-widget__more {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-10) 0 var(--mp-space-8);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--accent-ink);
  text-decoration: none;
  flex: 0 0 auto;
}

.setup-guide-widget__more:hover {
  text-decoration: underline;
}
</style>
