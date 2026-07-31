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
  kind: 'readiness',
  items: () => [],
  brief: undefined,
  actions: () => [],
  primaryAction: undefined,
  secondaryAction: undefined,
})

const emit = defineEmits<{
  action: [action: string]
}>()

const progress = computed(() => Math.min(100, Math.max(0, (props.step / Math.max(1, props.totalSteps)) * 100)))
const cardLabel = computed(() => {
  if (props.kind === 'brief') return 'Campaign brief'
  if (props.kind === 'handoff') return 'Campaign handoff'
  if (props.kind === 'unsupported') return 'Guidance boundary'
  return 'Campaign setup'
})
const nextBlocker = computed(() => props.items.find((item) => item.status !== 'ready') ?? null)
const visibleActions = computed(() => {
  if (props.actions.length) return props.actions
  return [props.primaryAction, props.secondaryAction].filter(
    (action): action is CampaignOnboardingAction => !!action,
  )
})

const statusMeta: Record<CampaignReadinessStatus, { icon: string; label: string; color: string }> = {
  ready: { icon: 'check-circle-2', label: 'Ready', color: 'success' },
  'needs-attention': { icon: 'circle-alert', label: 'Needs attention', color: 'warning' },
  unknown: { icon: 'circle-help', label: 'Can’t verify', color: 'info' },
}

function itemMeta(item: CampaignReadinessItem) {
  return statusMeta[item.status]
}

function freshnessLabel(item: CampaignReadinessItem) {
  const checked = new Date(item.checkedAt).getTime()
  if (!Number.isFinite(checked)) return 'Freshness unknown'
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - checked) / 60_000))
  if (elapsedMinutes < 1) return 'Checked just now'
  if (elapsedMinutes < 60) return `Checked ${elapsedMinutes}m ago`
  return `Checked ${new Date(checked).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
}

function trigger(action?: CampaignOnboardingAction) {
  if (action) emit('action', action.action)
}

function itemIcon(item: CampaignReadinessItem) {
  const icons: Record<CampaignReadinessItem['id'], string> = {
    marketing: 'megaphone',
    permission: 'key-round',
    plan: 'badge-check',
    domain: 'shield-check',
    sender: 'at-sign',
    audience: 'users',
    content: 'mail',
  }
  return icons[item.id]
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
            {{ cardLabel }} · Step {{ step }} of {{ totalSteps }}
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
              <span class="text-caption text-medium-emphasis">
                {{ itemMeta(item).label }} · {{ freshnessLabel(item) }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">{{ item.description }}</div>
          </div>
        </div>
      </div>

      <dl v-if="brief" class="onboarding-card__brief mt-1 mb-0">
        <div>
          <dt>Channel</dt>
          <dd>{{ brief.channel }}</dd>
        </div>
        <div>
          <dt>Objective</dt>
          <dd>{{ brief.objective }}</dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>{{ brief.audience }}</dd>
        </div>
        <div>
          <dt>Readiness</dt>
          <dd>{{ brief.readinessSummary }}</dd>
        </div>
        <div class="onboarding-card__brief-next">
          <dt>Next steps</dt>
          <dd>
            <ol class="pl-5 mb-0">
              <li v-for="stepLabel in brief.nextSteps" :key="stepLabel">{{ stepLabel }}</li>
            </ol>
          </dd>
        </div>
      </dl>

      <v-btn
        v-if="nextBlocker"
        variant="text"
        color="primary"
        size="small"
        :prepend-icon="itemIcon(nextBlocker)"
        class="mt-3"
        @click="emit('action', `open-${nextBlocker.id}`)"
      >
        {{ nextBlocker.actionLabel }}
      </v-btn>

      <div v-if="visibleActions.length" class="d-flex flex-wrap ga-2 mt-4">
        <v-btn
          v-for="(action, index) in visibleActions"
          :key="action.action"
          :color="index === 0 ? 'primary' : undefined"
          :variant="index === 0 ? 'flat' : action.action === 'continue-later' ? 'text' : 'outlined'"
          size="small"
          :prepend-icon="action.icon"
          @click="trigger(action)"
        >
          {{ action.label }}
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

.onboarding-card__brief {
  display: grid;
  gap: var(--mp-spacing-3);
}

.onboarding-card__brief > div {
  display: grid;
  grid-template-columns: minmax(88px, 0.4fr) minmax(0, 1fr);
  gap: var(--mp-spacing-3);
  padding-block: var(--mp-spacing-2);
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.onboarding-card__brief > div:last-child {
  border-bottom: 0;
}

.onboarding-card__brief dt {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
}

.onboarding-card__brief dd {
  min-width: 0;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.8125rem;
  font-weight: 500;
}

.onboarding-card__brief-next {
  align-items: start;
}

.onboarding-card__brief-next li + li {
  margin-top: var(--mp-spacing-1);
}

.min-width-0 {
  min-width: 0;
}

@media (max-width: 480px) {
  .onboarding-card__brief > div {
    grid-template-columns: 1fr;
    gap: var(--mp-spacing-1);
  }
}
</style>
