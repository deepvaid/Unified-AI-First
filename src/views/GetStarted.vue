<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { ONBOARDING_PHASES, useOnboardingStore } from '@/stores/useOnboarding'

const route = useRoute()
const store = useOnboardingStore()
const accountId = computed(() => String(route.params.accountId ?? '1'))

// Exactly one step is expanded at a time. Follows the store's next task, but the
// user can peek at any step by clicking its row.
const expandedId = ref<string | null>(store.nextTaskId)
watch(
  () => store.nextTaskId,
  (id) => {
    expandedId.value = id
  }
)

// Row-button refs keyed by task id, so acting on a task (which collapses its body)
// can return focus to that task's still-present row instead of dropping it to <body>.
const rowRefs = ref<Record<string, HTMLButtonElement | null>>({})
function setRowRef(id: string, el: unknown) {
  rowRefs.value[id] = (el as { $el?: HTMLButtonElement } | null)?.$el ?? (el as HTMLButtonElement | null)
}
function refocusRow(id: string) {
  nextTick(() => rowRefs.value[id]?.focus())
}

function markDone(id: string) {
  store.complete(id)
  refocusRow(id)
}
function markNotDone(id: string) {
  store.uncomplete(id)
  refocusRow(id)
}
function skipTask(id: string) {
  store.skip(id)
  refocusRow(id)
}
function unskipTask(id: string) {
  store.unskip(id)
  refocusRow(id)
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function taskState(id: string): 'done' | 'skipped' | 'todo' {
  if (store.completed[id]) return 'done'
  if (store.skipped[id]) return 'skipped'
  return 'todo'
}

function taskRoute(routeName: string) {
  return { name: routeName, params: { accountId: accountId.value } }
}

const phaseComplete = (phaseId: string) =>
  store.phaseDone(phaseId) === ONBOARDING_PHASES.find((p) => p.id === phaseId)!.tasks.length

// Reset wipes all progress — gate behind a confirm dialog per the destructive-action convention.
const confirmReset = ref(false)
function doReset() {
  store.reset()
  confirmReset.value = false
}
</script>

<template>
  <div class="gs-page">
    <MpPageHeader
      title="Get started"
      subtitle="A guided path from empty account to first sale — pick up where you left off anytime."
    >
      <template #actions>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="more-vertical" variant="text" size="small" aria-label="Guide options" />
          </template>
          <v-list density="compact" rounded="lg" nav min-width="200">
            <v-list-item prepend-icon="rotate-ccw" title="Reset progress" @click="confirmReset = true" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <!-- ── Progress summary ─────────────────────────────────────── -->
    <v-card variant="flat" border rounded="lg" class="gs-summary d-flex align-center gap-5 pa-5 mb-6">
      <v-progress-circular
        :model-value="store.progress"
        :size="64"
        :width="6"
        color="primary"
        class="flex-shrink-0"
        aria-hidden="true"
      >
        <span class="text-caption font-weight-bold">{{ store.progress }}%</span>
      </v-progress-circular>
      <div class="flex-grow-1 min-w-0">
        <div class="text-subtitle-1 font-weight-semibold">
          {{ store.allResolved ? 'Setup complete — nicely done.' : `${store.doneCount} of ${store.totalCount} tasks complete` }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ store.allResolved
            ? 'Your store, email, audience, and support desk are ready for customers.'
            : 'Most merchants finish setup in under an hour.' }}
        </div>
        <v-progress-linear
          :model-value="store.progress"
          color="primary"
          height="6"
          rounded
          class="mt-3"
          aria-label="Overall setup progress"
        />
      </div>
    </v-card>

    <!-- ── All resolved celebration (every task completed or skipped) ─── -->
    <v-card v-if="store.allResolved" variant="flat" border rounded="lg" class="pa-8 text-center">
      <div class="text-h5 mb-2"><span aria-hidden="true">🎉</span> You're ready for customers</div>
      <p class="text-body-2 text-medium-emphasis mb-5">
        {{ store.skippedCount === 0
          ? "Every setup task is done. From here it's all growth — campaigns, journeys, and orders."
          : `You've been through every step (${store.doneCount} done, ${store.skippedCount} skipped). Revisit a skipped step anytime.` }}
      </p>
      <div class="d-flex justify-center gap-2">
        <v-btn color="primary" variant="flat" class="text-none" :to="taskRoute('Dashboard')">Go to dashboard</v-btn>
        <v-btn variant="text" class="text-none" @click="confirmReset = true">Start over</v-btn>
      </div>
    </v-card>

    <!-- ── Phases ───────────────────────────────────────────────── -->
    <template v-else>
      <section v-for="phase in ONBOARDING_PHASES" :key="phase.id" class="mb-6">
        <div class="d-flex align-baseline justify-space-between mb-2 px-1">
          <div>
            <h2 class="text-subtitle-1 font-weight-semibold gs-phase-title">
              {{ phase.title }}
              <span v-if="phaseComplete(phase.id)" class="gs-phase-done" role="img" aria-label="Phase complete">🎉</span>
            </h2>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ phase.blurb }}</p>
          </div>
          <span class="text-caption text-medium-emphasis flex-shrink-0">
            {{ store.phaseDone(phase.id) }}/{{ phase.tasks.length }}
          </span>
        </div>

        <v-card variant="flat" border rounded="lg" class="overflow-hidden">
          <div v-for="task in phase.tasks" :key="task.id" class="gs-step" :class="`gs-step--${taskState(task.id)}`">
            <!-- Row (always visible) -->
            <button
              :ref="(el) => setRowRef(task.id, el)"
              type="button"
              class="gs-step__row d-flex align-center gap-3 pa-4 w-100 text-left"
              :aria-expanded="expandedId === task.id"
              :aria-label="`${task.title} — ${taskState(task.id) === 'done' ? 'complete' : taskState(task.id) === 'skipped' ? 'skipped' : 'to do'}`"
              @click="toggleExpand(task.id)"
            >
              <span class="gs-step__check flex-shrink-0" aria-hidden="true">
                <v-icon v-if="taskState(task.id) === 'done'" size="22" color="success">circle-check</v-icon>
                <v-icon v-else-if="taskState(task.id) === 'skipped'" size="22" class="text-medium-emphasis">circle-minus</v-icon>
                <v-icon v-else size="22" class="gs-step__check-todo">circle</v-icon>
              </span>
              <span
                class="text-body-2 flex-grow-1 min-w-0 gs-step__title"
                :class="{ 'text-medium-emphasis': taskState(task.id) !== 'todo' }"
              >{{ task.title }}</span>
              <v-chip v-if="taskState(task.id) === 'todo'" size="x-small" variant="tonal" class="flex-shrink-0">
                ≈ {{ task.minutes }} min
              </v-chip>
              <v-icon size="16" class="text-medium-emphasis flex-shrink-0">
                {{ expandedId === task.id ? 'chevron-up' : 'chevron-down' }}
              </v-icon>
            </button>

            <!-- Expanded body (one at a time) -->
            <v-expand-transition>
              <div v-if="expandedId === task.id" class="gs-step__body px-4 pb-4">
                <div class="gs-step__detail d-flex gap-4 align-start">
                  <div class="gs-step__icon flex-shrink-0 d-flex align-center justify-center">
                    <v-icon size="22" color="primary">{{ task.icon }}</v-icon>
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <p class="text-body-2 mb-1">{{ task.description }}</p>
                    <p class="text-caption text-medium-emphasis mb-3">{{ task.why }}</p>
                    <div class="d-flex align-center gap-2 flex-wrap">
                      <v-btn
                        color="primary"
                        variant="flat"
                        size="small"
                        class="text-none"
                        :to="taskRoute(task.routeName)"
                      >{{ task.cta }}</v-btn>
                      <v-btn
                        v-if="taskState(task.id) !== 'done'"
                        variant="text"
                        size="small"
                        class="text-none text-medium-emphasis"
                        @click="markDone(task.id)"
                      >Mark as done</v-btn>
                      <v-btn
                        v-else
                        variant="text"
                        size="small"
                        class="text-none text-medium-emphasis"
                        @click="markNotDone(task.id)"
                      >Mark as not done</v-btn>
                      <v-btn
                        v-if="taskState(task.id) === 'todo'"
                        variant="text"
                        size="small"
                        class="text-none text-medium-emphasis"
                        @click="skipTask(task.id)"
                      >Skip for now</v-btn>
                      <v-btn
                        v-else-if="taskState(task.id) === 'skipped'"
                        variant="text"
                        size="small"
                        class="text-none text-medium-emphasis"
                        @click="unskipTask(task.id)"
                      >Unskip</v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-expand-transition>
          </div>
        </v-card>
      </section>
    </template>

    <MpConfirmDialog
      v-model="confirmReset"
      title="Reset setup progress?"
      message="This clears every completed and skipped step and starts the guide over. This cannot be undone."
      confirm-label="Reset progress"
      danger
      @confirm="doReset"
    />
  </div>
</template>

<style scoped>
.gs-page {
  max-width: 880px;
  margin-inline: auto;
}
.gs-summary {
  background: rgba(var(--v-theme-primary), 0.03);
}
.gs-phase-title {
  line-height: 1.3;
}
.gs-phase-done {
  margin-left: 4px;
}
.min-w-0 {
  min-width: 0;
}

/* ── Steps ─────────────────────────────────────────────────────── */
.gs-step {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.gs-step:last-child {
  border-bottom: none;
}
.gs-step__row {
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s ease;
}
.gs-step__row:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}
.gs-step__row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.gs-step__check-todo {
  color: rgba(var(--v-theme-on-surface), 0.28);
}
.gs-step--done .gs-step__title {
  color: rgba(var(--v-theme-on-surface), 0.55);
}
/* Check pop when a task completes */
.gs-step--done .gs-step__check :deep(svg) {
  animation: gs-check-pop 0.35s ease;
}
@keyframes gs-check-pop {
  0% { transform: scale(0.6); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.gs-step__body {
  margin-top: -4px;
}
.gs-step__detail {
  padding: 12px 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  background: rgba(var(--v-theme-surface-variant), 0.14);
}
.gs-step__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
