<script setup lang="ts">
import { computed } from 'vue'
import type { CampaignOnboardingProps } from '@/stores/useCopilot'
import type {
  CampaignReadinessItem,
  CampaignReadinessStatus,
} from '@/stores/useDaVinciOnboarding'
import DvOnboardingCardShell from './DvOnboardingCardShell.vue'

// Campaign-readiness chat card. Chrome (header, progress, action row) comes from
// DvOnboardingCardShell, shared with DvSetupOnboardingCard; this component owns
// the two-line readiness rows and the next-blocker shortcut.

const props = withDefaults(defineProps<CampaignOnboardingProps>(), {
  description: '',
  items: () => [],
  primaryAction: undefined,
  secondaryAction: undefined,
})

const emit = defineEmits<{
  action: [action: string]
}>()

const progress = computed(() => (props.step / Math.max(1, props.totalSteps)) * 100)
const eyebrow = computed(() => `Campaign setup · Step ${props.step} of ${props.totalSteps}`)
const nextBlocker = computed(() => props.items.find((item) => item.status !== 'ready') ?? null)

const statusMeta: Record<CampaignReadinessStatus, { icon: string; label: string; color: string }> = {
  ready: { icon: 'check-circle-2', label: 'Ready', color: 'success' },
  'needs-setup': { icon: 'circle-alert', label: 'Needs setup', color: 'warning' },
  unknown: { icon: 'circle-help', label: 'Can’t verify', color: 'info' },
}

function itemMeta(item: CampaignReadinessItem) {
  return statusMeta[item.status]
}

const BLOCKER_ICONS: Record<string, string> = { domain: 'shield-check', audience: 'users' }
</script>

<template>
  <DvOnboardingCardShell
    icon="route"
    :eyebrow="eyebrow"
    :title="title"
    :description="description"
    :progress="progress"
    progress-label="Campaign onboarding progress"
    :primary-action="primaryAction"
    :secondary-action="secondaryAction"
    @action="emit('action', $event)"
  >
    <div v-if="items.length" class="d-flex flex-column ga-2">
      <div
        v-for="item in items"
        :key="item.id"
        class="onboarding-card__item d-flex align-start ga-3 pa-3"
      >
        <v-icon :color="itemMeta(item).color" size="20">
          {{ itemMeta(item).icon }}
        </v-icon>
        <div class="flex-grow-1 onboarding-card__item-body">
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
      :prepend-icon="BLOCKER_ICONS[nextBlocker.id] ?? 'mail'"
      class="mt-3"
      @click="emit('action', `open-${nextBlocker.id}`)"
    >
      {{ nextBlocker.actionLabel }}
    </v-btn>
  </DvOnboardingCardShell>
</template>

<style scoped>
.onboarding-card__item {
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface-variant));
}

.onboarding-card__item-body {
  min-width: 0;
}
</style>
