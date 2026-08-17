<script setup lang="ts">
import { computed } from 'vue'
import type { SetupOnboardingProps } from '@/stores/useCopilot'
import type { SetupTaskStatus } from '@/stores/useOnboarding'
import DvOnboardingCardShell from './DvOnboardingCardShell.vue'

// Guided-setup chat card — the Da Vinci onboarding counterpart of
// DvCampaignOnboardingCard, sharing its chrome through DvOnboardingCardShell.
// The `kind` drives the eyebrow and icon; task items render with per-status
// chips (verified vs user-confirmed vs skipped).

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

/** The goal and unsupported phases have no meaningful step position yet. */
const barless = computed(() => props.kind === 'goal' || props.kind === 'unsupported')

const eyebrow = computed(() => {
  const base = kindMeta[props.kind].eyebrow
  return props.kind === 'task' || props.kind === 'complete'
    ? `${base} · Step ${props.step} of ${props.totalSteps}`
    : base
})

const progress = computed(() =>
  barless.value ? null : (props.step / Math.max(1, props.totalSteps)) * 100,
)
</script>

<template>
  <DvOnboardingCardShell
    :icon="kindMeta[kind].icon"
    :eyebrow="eyebrow"
    :title="title"
    :description="description"
    :progress="progress"
    progress-label="Guided setup progress"
    :primary-action="primaryAction"
    :secondary-action="secondaryAction"
    @action="emit('action', $event)"
  >
    <div v-if="items.length" class="d-flex flex-column ga-2" :class="{ 'mt-4': barless }">
      <div
        v-for="item in items"
        :key="item.id"
        class="setup-card__item d-flex align-center ga-3 pa-3"
      >
        <v-icon :color="statusMeta[item.status].color" size="20">
          {{ statusMeta[item.status].icon }}
        </v-icon>
        <div class="flex-grow-1 setup-card__item-body">
          <span class="text-body-2 font-weight-medium">{{ item.label }}</span>
        </div>
        <span class="text-caption text-medium-emphasis text-no-wrap">
          {{ item.status === 'pending' && item.minutes ? `≈ ${item.minutes} min` : statusMeta[item.status].label }}
        </span>
      </div>
    </div>
  </DvOnboardingCardShell>
</template>

<style scoped>
.setup-card__item {
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface-variant));
}

.setup-card__item-body {
  min-width: 0;
}
</style>
