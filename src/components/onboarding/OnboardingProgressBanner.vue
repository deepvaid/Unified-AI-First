<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  /** Setup tasks completed. */
  done: number
  /** Setup tasks in the plan. */
  total: number
  /** Replaces the default "N of M tasks complete" title. The count then gets its own line above the bar. */
  title?: string
  caption?: string
  /** Drops the count line under a custom title, for a title that already says it ("Setup complete"). */
  hideCount?: boolean
  /** Link at the end of the row, shown when both `actionLabel` and `to` are set. */
  actionLabel?: string
  to?: RouteLocationRaw
}>()

const percent = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
</script>

<template>
  <v-card variant="flat" border rounded="lg" class="onboarding-banner mp-card-inset d-flex align-center">
    <v-progress-circular
      :model-value="percent"
      :size="64"
      :width="6"
      color="primary"
      class="onboarding-banner__ring flex-shrink-0"
      aria-hidden="true"
    >
      <span class="text-caption font-weight-bold">{{ percent }}%</span>
    </v-progress-circular>
    <div class="onboarding-banner__main">
      <div class="onboarding-banner__title text-subtitle-1 font-weight-semibold">
        {{ title ?? `${done} of ${total} tasks complete` }}
      </div>
      <div v-if="caption" class="onboarding-banner__caption text-body-2 text-medium-emphasis">{{ caption }}</div>
      <div v-if="title && !hideCount" class="onboarding-banner__count text-caption font-weight-medium mt-2">
        {{ done }} of {{ total }} completed
      </div>
      <v-progress-linear
        :model-value="percent"
        color="primary"
        height="6"
        rounded
        class="onboarding-banner__bar mt-3"
        aria-label="Overall setup progress"
      />
    </div>
    <RouterLink v-if="actionLabel && to" :to="to" class="onboarding-banner__action mp-link">
      {{ actionLabel }}
      <v-icon size="16">arrow-right</v-icon>
    </RouterLink>
  </v-card>
</template>

<style scoped>
.onboarding-banner {
  gap: var(--mp-space-20);
  background: rgba(var(--v-theme-primary), 0.03);
}

.onboarding-banner__main {
  flex: 1 1 0;
  min-width: 0;
}

.onboarding-banner__action {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  flex-shrink: 0;
  white-space: nowrap;
}

/* On a phone the action drops under the ring and text instead of squeezing them. */
@media (max-width: 599.98px) {
  .onboarding-banner {
    flex-wrap: wrap;
  }

  .onboarding-banner__action {
    flex-basis: 100%;
  }
}
</style>
