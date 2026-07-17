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
        <v-icon v-if="draggable" size="18" class="setup-guide-widget__drag-handle">grip-vertical</v-icon>
        <h2 class="setup-guide-widget__title">Setup guide</h2>
      </div>
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
        <v-icon size="14">arrow-right</v-icon>
      </router-link>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.setup-guide-widget {
  padding: 18px 22px 8px;
  background: var(--surface-1);
  border-color: color-mix(in oklch, var(--ink) 7%, transparent) !important;
  /* Match the widget-card radius so every dashboard card is identical */
  border-radius: var(--r-section) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.setup-guide-widget:hover {
  border-color: color-mix(in oklch, var(--ink) 18%, transparent) !important;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06);
}

.setup-guide-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
}

.setup-guide-widget__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

/* Drag grip fades in on hover; the whole guide is the drag region in grid context. */
.setup-guide-widget__drag-handle {
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
  font-size: 14px;
  font-weight: 650;
  color: var(--ink);
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
  border-radius: 6px;
  appearance: none;
  transition: background 120ms ease, color 120ms ease;
}

.setup-guide-widget__toggle:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.setup-guide-widget__toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.setup-guide-widget__body {
  margin-top: 4px;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.setup-guide-widget__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted);
  flex: 0 0 auto;
}

.setup-guide-widget__progress {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--hairline);
  flex: 0 0 auto;
}

.setup-guide-widget__pill {
  display: inline-block;
  color: var(--muted);
  margin-bottom: 8px;
}

.setup-guide-widget__pill strong {
  color: var(--ink);
  font-weight: 700;
}

.setup-guide-widget__bar {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--ink) 8%, var(--surface-1));
  overflow: hidden;
}

.setup-guide-widget__bar-fill {
  display: block;
  height: 100%;
  background: var(--ink);
  border-radius: 999px;
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
  border-bottom: 1px solid var(--hairline);
}

.setup-guide-task:last-child {
  border-bottom: 0;
}

.setup-guide-task__btn {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 0;
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
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
  border-radius: 6px;
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
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
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
  margin: 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  flex: 1 1 auto;
}

.setup-guide-widget__more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-ink);
  text-decoration: none;
  flex: 0 0 auto;
}

.setup-guide-widget__more:hover {
  text-decoration: underline;
}
</style>
