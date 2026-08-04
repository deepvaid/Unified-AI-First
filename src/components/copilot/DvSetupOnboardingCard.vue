<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignOnboardingAction, SetupOnboardingProps } from '@/stores/useCopilot'
import type { SetupTaskStatus } from '@/stores/useOnboarding'

// Guided-setup chat card — the Da Vinci onboarding counterpart of
// DvCampaignOnboardingCard. The `kind` drives the eyebrow and icon; task
// items render with per-status chips (verified vs user-confirmed vs skipped).

const props = withDefaults(defineProps<SetupOnboardingProps>(), {
  description: '',
  taskId: undefined,
  status: undefined,
  items: () => [],
  primaryAction: undefined,
  secondaryAction: undefined,
})

const emit = defineEmits<{
  action: [action: string]
}>()

const progress = computed(() => Math.min(100, Math.max(0, (props.step / Math.max(1, props.totalSteps)) * 100)))

const kindMeta: Record<SetupOnboardingProps['kind'], { eyebrow: string; icon: string }> = {
  goal: { eyebrow: 'Guided setup', icon: 'compass' },
  plan: { eyebrow: 'Guided setup · Your path', icon: 'route' },
  task: { eyebrow: 'Guided setup', icon: 'list-checks' },
  verification: { eyebrow: 'Guided setup · Check', icon: 'circle-help' },
  complete: { eyebrow: 'Guided setup', icon: 'circle-check' },
  unsupported: { eyebrow: 'Guided setup', icon: 'hand' },
}

const statusMeta: Record<SetupTaskStatus, { icon: string; label: string; color: string }> = {
  pending: { icon: 'circle-dashed', label: 'To do', color: 'info' },
  verified: { icon: 'check-circle-2', label: 'Verified', color: 'success' },
  'user-confirmed': { icon: 'circle-check', label: 'Confirmed', color: 'success' },
  skipped: { icon: 'redo-2', label: 'Skipped', color: 'warning' },
}

const eyebrow = computed(() => {
  const base = kindMeta[props.kind].eyebrow
  return props.kind === 'task' || props.kind === 'complete'
    ? `${base} · Step ${props.step} of ${props.totalSteps}`
    : base
})

function trigger(action?: CampaignOnboardingAction) {
  if (action) emit('action', action.action)
}
</script>

<template>
  <v-card flat border rounded="lg" class="setup-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-3">
        <v-avatar color="primary" variant="tonal" size="36">
          <v-icon size="20">{{ kindMeta[kind].icon }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-caption text-medium-emphasis mb-1">{{ eyebrow }}</div>
          <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>
          <p v-if="description" class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ description }}
          </p>
        </div>
      </div>

      <v-progress-linear
        v-if="kind !== 'goal' && kind !== 'unsupported'"
        :model-value="progress"
        color="primary"
        bg-color="surface-variant"
        rounded
        height="6"
        class="my-4"
        aria-label="Guided setup progress"
      />

      <div v-if="items.length" class="d-flex flex-column ga-2" :class="{ 'mt-4': kind === 'goal' || kind === 'unsupported' }">
        <div
          v-for="item in items"
          :key="item.id"
          class="setup-card__item d-flex align-center ga-3 pa-3"
        >
          <v-icon :color="statusMeta[item.status].color" size="20">
            {{ statusMeta[item.status].icon }}
          </v-icon>
          <div class="flex-grow-1 min-width-0">
            <span class="text-body-2 font-weight-medium">{{ item.label }}</span>
          </div>
          <span class="text-caption text-medium-emphasis text-no-wrap">
            {{ item.status === 'pending' && item.minutes ? `≈ ${item.minutes} min` : statusMeta[item.status].label }}
          </span>
        </div>
      </div>

      <div v-if="primaryAction || secondaryAction" class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          v-if="primaryAction"
          color="primary"
          variant="flat"
          size="small"
          :prepend-icon="primaryAction.icon"
          @click="trigger(primaryAction)"
        >
          {{ primaryAction.label }}
        </v-btn>
        <v-btn
          v-if="secondaryAction"
          variant="outlined"
          size="small"
          :prepend-icon="secondaryAction.icon"
          @click="trigger(secondaryAction)"
        >
          {{ secondaryAction.label }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.setup-card {
  background: rgb(var(--v-theme-surface));
}

.setup-card__item {
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface-variant));
}

.min-width-0 {
  min-width: 0;
}
</style>
