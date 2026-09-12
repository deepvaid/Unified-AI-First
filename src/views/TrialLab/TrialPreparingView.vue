<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import { useTrialRun } from './useTrialRun'

/**
 * Preparing — the workspace-provisioning state. Progress is derived from the
 * persisted start time, so a refresh or a second tab shows the same point;
 * completion is committed by the store's clock watch. The trial chip in the
 * header flips to "Trial · 14 days left" the moment the workspace is ready,
 * if the email is already verified.
 */
const { store, variant, workspace, arrive, advanceFrom } = useTrialRun()

const STEPS = ['Creating your workspace', 'Applying trial limits', 'Loading sample data']
const STEP_MS = 800

const status = computed(() => workspace.value?.provisioning.status ?? 'idle')
const elapsed = computed(() => {
  const started = workspace.value?.provisioning.startedAt
  return started ? store.tick - new Date(started).getTime() : 0
})
const doneCount = computed(() => (status.value === 'ready' ? STEPS.length : Math.min(STEPS.length, Math.floor(elapsed.value / STEP_MS))))

onMounted(() => {
  arrive('preparing')
  store.startProvisioning(variant.value)
})

watch(status, (s) => {
  if (s === 'ready') void advanceFrom('preparing', true)
}, { immediate: true })
</script>

<template>
  <div class="tl-stage">
    <v-card flat border rounded="lg" class="tl-stage__card" aria-live="polite">
      <h1 class="tl-stage__title">Setting up your workspace</h1>
      <p class="tl-stage__lede">This takes a few seconds. Nothing to do on your side.</p>

      <MpAlert v-if="status === 'failed'" tone="error" title="We couldn’t finish setting up" class="mb-4">
        Something went wrong on our side. Your account is fine — try again, and if it keeps failing we’ll get in touch.
        <template #actions>
          <v-btn size="small" variant="text" class="text-none" prepend-icon="refresh-cw" @click="store.retryProvisioning(variant)">Retry</v-btn>
        </template>
      </MpAlert>

      <v-progress-linear
        v-if="status !== 'failed'"
        :model-value="status === 'ready' ? 100 : Math.min(96, (elapsed / (STEP_MS * STEPS.length)) * 100)"
        color="primary"
        rounded
        class="mb-4"
      />

      <div class="tl-preparing__list">
        <MpListRow v-for="(label, i) in STEPS" :key="label" :title="label" density="compact">
          <template #lead>
            <v-icon v-if="i < doneCount" size="18" color="success">circle-check</v-icon>
            <v-progress-circular v-else-if="i === doneCount && status === 'preparing'" indeterminate size="16" width="2" color="primary" />
            <v-icon v-else size="18" class="tl-preparing__todo">circle</v-icon>
          </template>
        </MpListRow>
      </div>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
<style scoped>
.tl-preparing__list {
  display: flex;
  flex-direction: column;
}

.tl-preparing__todo {
  color: var(--text-muted);
}
</style>
