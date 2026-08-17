<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignOnboardingAction } from '@/stores/useCopilot'

// Shared chrome for the Da Vinci onboarding chat cards (DvCampaignOnboardingCard,
// DvSetupOnboardingCard): avatar + eyebrow + title header, optional progress bar,
// and the primary/secondary action row. The two cards differ only in how their
// item rows render, so those stay in the children and arrive through the default
// slot — scoped styles don't cross the slot boundary, so each child keeps its own
// row styling.

const props = withDefaults(defineProps<{
  /** Lucide icon name for the header avatar. */
  icon: string
  /** Muted line above the title (callers append "· Step n of m" when relevant). */
  eyebrow: string
  title: string
  description?: string
  /** 0–100. Pass null to hide the bar entirely (e.g. goal/unsupported phases). */
  progress?: number | null
  /** Accessible name for the progress bar — required whenever `progress` is shown. */
  progressLabel?: string
  primaryAction?: CampaignOnboardingAction
  secondaryAction?: CampaignOnboardingAction
}>(), {
  description: '',
  progress: null,
  progressLabel: 'Progress',
  primaryAction: undefined,
  secondaryAction: undefined,
})

const emit = defineEmits<{
  action: [action: string]
}>()

defineSlots<{
  /** Item rows, plus any card-specific affordance rendered under them. */
  default?(): unknown
}>()

const clampedProgress = computed(() =>
  props.progress == null ? null : Math.min(100, Math.max(0, props.progress)),
)

function trigger(action?: CampaignOnboardingAction) {
  if (action) emit('action', action.action)
}
</script>

<template>
  <v-card flat border rounded="lg" class="dv-onboarding-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-3">
        <v-avatar color="primary" variant="tonal" size="36">
          <v-icon size="20">{{ icon }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1 dv-onboarding-card__head">
          <div class="text-caption text-medium-emphasis mb-1">{{ eyebrow }}</div>
          <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>
          <p v-if="description" class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ description }}
          </p>
        </div>
      </div>

      <v-progress-linear
        v-if="clampedProgress !== null"
        :model-value="clampedProgress"
        color="primary"
        bg-color="surface-variant"
        rounded
        height="6"
        class="my-4"
        :aria-label="progressLabel"
      />

      <slot />

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
.dv-onboarding-card {
  background: rgb(var(--v-theme-surface));
}

.dv-onboarding-card__head {
  min-width: 0;
}
</style>
