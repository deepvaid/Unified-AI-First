<script setup lang="ts">
import { computed } from 'vue'
import type {
  CampaignOnboardingAction,
  CampaignOnboardingProps,
} from '@/stores/useCopilot'
import type {
  CampaignReadinessItem,
  CampaignReadinessStatus,
} from '@/stores/useDaVinciOnboarding'

const props = withDefaults(defineProps<CampaignOnboardingProps>(), {
  description: '',
  items: () => [],
  primaryAction: undefined,
  secondaryAction: undefined,
})

const emit = defineEmits<{
  action: [action: string]
}>()

const progress = computed(() => Math.min(100, Math.max(0, (props.step / Math.max(1, props.totalSteps)) * 100)))
const nextBlocker = computed(() => props.items.find((item) => item.status !== 'ready') ?? null)

const statusMeta: Record<CampaignReadinessStatus, { icon: string; label: string; color: string }> = {
  ready: { icon: 'check-circle-2', label: 'Ready', color: 'success' },
  'needs-setup': { icon: 'circle-alert', label: 'Needs setup', color: 'warning' },
  unknown: { icon: 'circle-help', label: 'Can’t verify', color: 'info' },
}

function itemMeta(item: CampaignReadinessItem) {
  return statusMeta[item.status]
}

function trigger(action?: CampaignOnboardingAction) {
  if (action) emit('action', action.action)
}
</script>

<template>
  <v-card flat border rounded="lg" class="onboarding-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-3">
        <v-avatar color="primary" variant="tonal" size="36">
          <v-icon size="20">route</v-icon>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-caption text-medium-emphasis mb-1">
            Campaign setup · Step {{ step }} of {{ totalSteps }}
          </div>
          <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>
          <p v-if="description" class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ description }}
          </p>
        </div>
      </div>

      <v-progress-linear
        :model-value="progress"
        color="primary"
        bg-color="surface-variant"
        rounded
        height="6"
        class="my-4"
        aria-label="Campaign onboarding progress"
      />

      <div v-if="items.length" class="d-flex flex-column ga-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="onboarding-card__item d-flex align-start ga-3 pa-3"
        >
          <v-icon :color="itemMeta(item).color" size="20">
            {{ itemMeta(item).icon }}
          </v-icon>
          <div class="flex-grow-1 min-width-0">
            <div class="d-flex align-center justify-space-between ga-2">
              <span class="text-body-2 font-weight-medium">{{ item.label }}</span>
              <span class="text-caption text-medium-emphasis">{{ itemMeta(item).label }}</span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">{{ item.description }}</div>
          </div>
        </div>
      </div>

      <v-btn
        v-if="nextBlocker"
        variant="text"
        color="primary"
        size="small"
        :prepend-icon="nextBlocker.id === 'domain' ? 'shield-check' : nextBlocker.id === 'audience' ? 'users' : 'mail'"
        class="mt-3"
        @click="emit('action', `open-${nextBlocker.id}`)"
      >
        {{ nextBlocker.actionLabel }}
      </v-btn>

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
.onboarding-card {
  background: rgb(var(--v-theme-surface));
}

.onboarding-card__item {
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface-variant));
}

.min-width-0 {
  min-width: 0;
}
</style>
