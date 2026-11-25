<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import { setupProgress } from '@/storefront/storeLaunch'
import type { SetupStep, SetupStepStatus } from '@/storefront/storeLaunch'

// What a store's page shows while a store just made is being set up: its steps,
// one running at a time, until the store is ready (`ready` is emitted once).
// Where it stands is read from when the store was made (`setupProgress`), so a
// reload or another tab shows the same step. `now` is for stories and tests: a
// fixed moment, with no clock running.

const props = defineProps<{
  storeName: string
  steps: SetupStep[]
  /** When the store was made (ISO). */
  startedAt: string
  /** A fixed moment (ms) to draw, instead of the clock. */
  now?: number
}>()

const emit = defineEmits<{
  /** Every step is done. */
  ready: []
}>()

const clock = ref(Date.now())
const progress = computed(() => setupProgress(props.steps, props.startedAt, props.now ?? clock.value))

let timer: ReturnType<typeof setInterval> | undefined
function stop(): void {
  clearInterval(timer)
  timer = undefined
}
onMounted(() => {
  if (props.now !== undefined || progress.value.ready) return
  timer = setInterval(() => { clock.value = Date.now() }, 200)
})
onBeforeUnmount(stop)
watch(() => progress.value.ready, (ready) => {
  if (!ready) return
  stop()
  emit('ready')
}, { immediate: true })

const STATUS: Record<SetupStepStatus, { label: string; icon: string }> = {
  done: { label: 'Done', icon: 'circle-check' },
  running: { label: 'In progress', icon: 'loader-circle' },
  waiting: { label: 'Waiting', icon: 'circle-dashed' },
}
/** What a screen reader hears as the steps go by. */
const announcement = computed(() => (progress.value.current ? `${progress.value.current.title}.` : `${props.storeName} is ready.`))
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset mp-card-inset--spacious store-setup">
    <div class="store-setup__head">
      <h2 class="text-h6">{{ progress.ready ? `${storeName} is ready` : `Setting up ${storeName}` }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ progress.ready ? 'Every step is done.' : 'This takes a few seconds. You can leave this page: setup carries on.' }}
      </p>
    </div>

    <v-progress-linear
      :model-value="progress.percent"
      height="6"
      rounded
      color="primary"
      :aria-label="`${progress.doneCount} of ${progress.steps.length} setup steps done`"
    />

    <ol class="store-setup__steps" aria-label="Setup steps">
      <li v-for="step in progress.steps" :key="step.id" class="store-setup__step">
        <MpListRow
          :title="step.status === 'done' ? step.doneTitle : step.title"
          :meta="STATUS[step.status].label"
          :class="`store-setup__step--${step.status}`"
        >
          <template #lead>
            <v-progress-circular v-if="step.status === 'running'" indeterminate size="18" width="2" color="primary" aria-hidden="true" />
            <v-icon v-else size="18" :color="step.status === 'done' ? 'success' : undefined" aria-hidden="true">{{ STATUS[step.status].icon }}</v-icon>
          </template>
        </MpListRow>
      </li>
    </ol>

    <p class="d-sr-only" aria-live="polite">{{ announcement }}</p>
  </v-card>
</template>

<style scoped>
.store-setup {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  max-width: var(--mp-component-dialog-width-md);
  margin-inline: auto;
}

.store-setup__head {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.store-setup__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.store-setup__step + .store-setup__step {
  border-top: 1px solid var(--border-subtle);
}

/* A step still to come reads quieter than the one running and those done. */
.store-setup__step--waiting {
  color: var(--text-secondary);
}
</style>
