<script setup lang="ts">
import { computed } from 'vue'
import type { SetupOnboardingAction, SetupOnboardingProps } from '@/stores/useCopilot'
import type { SetupTaskStatus } from '@/stores/useOnboarding'

const props = withDefaults(defineProps<SetupOnboardingProps>(), {
  description: '', kind: 'task', items: () => [], actions: () => [],
  primaryAction: undefined, secondaryAction: undefined, status: 'pending', taskId: undefined,
})

const emit = defineEmits<{ action: [action: string] }>()
const progress = computed(() => Math.min(100, Math.max(0, (props.step / Math.max(1, props.totalSteps)) * 100)))
const visibleActions = computed(() => {
  const actions = props.actions.length
    ? props.actions
    : [props.primaryAction, props.secondaryAction].filter((item): item is SetupOnboardingAction => !!item)
  return actions.slice(0, 3)
})

const statusMeta: Record<SetupTaskStatus, { icon: string; label: string; color: string }> = {
  pending: { icon: 'circle', label: 'To do', color: 'medium-emphasis' },
  verified: { icon: 'badge-check', label: 'Verified', color: 'success' },
  'user-confirmed': { icon: 'circle-check', label: 'You confirmed', color: 'info' },
  blocked: { icon: 'circle-alert', label: 'Blocked', color: 'warning' },
  skipped: { icon: 'circle-minus', label: 'Skipped', color: 'medium-emphasis' },
}

const eyebrow = computed(() => {
  if (props.kind === 'goal') return 'Your goal'
  if (props.kind === 'plan') return 'Setup path'
  if (props.kind === 'complete') return 'Milestone'
  if (props.kind === 'unsupported') return 'Da Vinci boundary'
  return `Step ${props.step} of ${props.totalSteps}`
})

function trigger(action: SetupOnboardingAction) { emit('action', action.action) }
</script>

<template>
  <v-card flat border rounded="xl" class="setup-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-start ga-3">
        <v-avatar color="primary" variant="tonal" size="36">
          <v-icon size="19">{{ kind === 'complete' ? 'sparkles' : 'route' }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-caption text-medium-emphasis mb-1">{{ eyebrow }}</div>
          <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>
          <p v-if="description" class="text-body-2 text-medium-emphasis mt-1 mb-0">{{ description }}</p>
        </div>
      </div>

      <v-progress-linear
        v-if="kind !== 'goal' && kind !== 'unsupported'"
        :model-value="progress"
        color="primary"
        bg-color="surface-variant"
        rounded height="5" class="my-4"
        aria-label="Setup progress"
      />

      <div v-if="items.length" class="setup-card__items mt-4">
        <div v-for="item in items" :key="item.id" class="setup-card__item d-flex align-center ga-2">
          <v-icon :color="statusMeta[item.status].color" size="17">{{ statusMeta[item.status].icon }}</v-icon>
          <span class="text-body-2 flex-grow-1">{{ item.label }}</span>
          <span v-if="item.minutes" class="text-caption text-medium-emphasis">{{ item.minutes }} min</span>
        </div>
        <div v-if="totalSteps > items.length" class="text-caption text-medium-emphasis mt-2 px-1">
          + {{ totalSteps - items.length }} more, shown one at a time
        </div>
      </div>

      <div v-if="status && kind === 'verification'" class="setup-card__status d-flex align-center ga-2 mt-4">
        <v-icon :color="statusMeta[status].color" size="18">{{ statusMeta[status].icon }}</v-icon>
        <span class="text-caption font-weight-medium">{{ statusMeta[status].label }}</span>
      </div>

      <div v-if="visibleActions.length" class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          v-for="(action, index) in visibleActions" :key="action.action"
          :color="index === 0 ? 'primary' : undefined"
          :variant="index === 0 ? 'flat' : 'text'"
          size="small" class="text-none"
          :prepend-icon="action.icon"
          @click="trigger(action)"
        >{{ action.label }}</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.setup-card { background: rgb(var(--v-theme-surface)); }
.setup-card__items { display: grid; gap: 8px; }
.setup-card__item { min-height: 34px; padding: 6px 9px; border-radius: 10px; background: rgba(var(--v-theme-primary), .035); }
.setup-card__status { padding: 10px 12px; border-radius: 10px; background: rgb(var(--v-theme-surface-variant)); }
.min-width-0 { min-width: 0; }
</style>
