<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import { launchSummary } from '@/storefront/storeLaunch'
import type { LaunchAction, LaunchStep, LaunchStepId, LaunchTarget } from '@/storefront/storeLaunch'

// "Launch your store": the eight steps that take a new web store to launch
// (`launchChecklist` in src/storefront/storeLaunch.ts), in order, each with what is
// true now and a way to do it. A step the store cannot read has "Mark as done".
// With every step done it says the store is ready.

const props = defineProps<{
  steps: LaunchStep[]
  /** Nothing to look at yet (no theme): the ready message has no "View store". */
  canView?: boolean
}>()

const emit = defineEmits<{
  /** A step's button: where it leads on the store's page. */
  run: [target: Exclude<LaunchTarget, 'confirm'>]
  /** "Mark as done" on a manual step. */
  confirm: [id: LaunchStepId]
}>()

const summary = computed(() => launchSummary(props.steps))

function press(step: LaunchStep, action: LaunchAction): void {
  if (action.target === 'confirm') emit('confirm', step.id)
  else emit('run', action.target)
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset store-launch">
    <div class="store-launch__head">
      <h2 class="text-subtitle-1 font-weight-medium">Launch your store</h2>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ summary.ready ? 'Every step is done' : `${summary.done} of ${summary.total} steps done` }}
      </p>
    </div>

    <v-progress-linear
      :model-value="summary.percent"
      height="6"
      rounded
      :color="summary.ready ? 'success' : 'primary'"
      :aria-label="`${summary.done} of ${summary.total} launch steps done`"
    />

    <MpAlert v-if="summary.ready" tone="success" title="Your store is ready to launch">
      Have a last look, then share your store’s address.
      <template v-if="canView" #actions>
        <v-btn variant="flat" color="primary" class="text-none" prepend-icon="external-link" @click="emit('run', 'preview')">View store</v-btn>
      </template>
    </MpAlert>

    <ol class="store-launch__steps" aria-label="Steps to launch">
      <li v-for="step in steps" :key="step.id" class="store-launch__step">
        <MpListRow :title="step.title" :subtitle="step.description">
          <template #lead>
            <v-icon size="20" :color="step.done ? 'success' : undefined" aria-hidden="true">{{ step.done ? 'circle-check' : 'circle-dashed' }}</v-icon>
            <span class="d-sr-only">{{ step.done ? 'Done:' : 'To do:' }}</span>
          </template>
        </MpListRow>
        <!-- Under the step's words, never beside them: the card is often a narrow column. -->
        <div v-if="step.action || step.link" class="store-launch__actions">
          <v-btn
            v-if="step.action"
            size="small"
            color="primary"
            :variant="step.done ? 'outlined' : 'tonal'"
            class="text-none"
            :aria-label="`${step.action.label}: ${step.title}`"
            @click="press(step, step.action)"
          >
            {{ step.action.label }}
          </v-btn>
          <v-btn
            v-if="step.link"
            size="small"
            variant="text"
            class="text-none"
            :aria-label="`${step.link.label}: ${step.title}`"
            @click="press(step, step.link)"
          >
            {{ step.link.label }}
          </v-btn>
        </div>
      </li>
    </ol>
  </v-card>
</template>

<style scoped>
.store-launch {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  min-width: 0;
}

.store-launch__head {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.store-launch__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.store-launch__step + .store-launch__step {
  border-top: 1px solid var(--border-subtle);
}

/* Level with the step's words: past the icon and the row's gap. */
.store-launch__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  padding: 0 0 var(--mp-space-12) calc(var(--mp-space-20) + var(--mp-component-listItem-gap));
}
</style>
