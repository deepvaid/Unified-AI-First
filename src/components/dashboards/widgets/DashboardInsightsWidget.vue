<script setup lang="ts">
import { useInitialLoad } from '@/composables/useInitialLoad'
import type { DashboardInsightItem, DashboardInsightsData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardInsightsData
}>()

const emit = defineEmits<{
  action: [item: DashboardInsightItem]
}>()

const { loading } = useInitialLoad(650)
</script>

<template>
  <div class="insights-widget">
    <!-- Loading: 3 gradient-sweep shimmer rows (Da Vinci skeleton idiom) -->
    <div v-if="loading" class="insights-widget__skeleton" role="status" aria-live="polite" aria-label="Loading insights">
      <div v-for="row in 3" :key="row" class="insights-widget__skeleton-row">
        <span class="insights-widget__shimmer" :style="{ width: `${92 - row * 8}%` }" />
        <span class="insights-widget__shimmer insights-widget__shimmer--sub" :style="{ width: `${48 - row * 4}%` }" />
      </div>
      <span class="d-sr-only">Loading data…</span>
    </div>

    <!-- Empty / error -->
    <div v-else-if="data.items.length === 0" class="insights-widget__empty">
      No new insights right now.
    </div>

    <ul v-else class="insights-widget__list" aria-label="Da Vinci insights">
      <li
        v-for="(item, index) in data.items"
        :key="item.id"
        class="insights-widget__row"
        :class="{ 'insights-widget__row--last': index === data.items.length - 1 }"
      >
        <div class="insights-widget__copy">
          <div class="insights-widget__observation">{{ item.observation }}</div>
          <div class="insights-widget__stat">{{ item.stat }}</div>
        </div>
        <v-btn
          variant="text"
          size="small"
          color="primary"
          class="insights-widget__action"
          @click="emit('action', item)"
        >
          {{ item.actionLabel }}
        </v-btn>
      </li>
    </ul>

    <div class="insights-widget__disclaimer">AI-generated, verify before acting</div>
  </div>
</template>

<style scoped>
.insights-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.insights-widget__list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.insights-widget__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-10);
  padding: var(--mp-space-10) 0;
  border-bottom: 1px solid var(--border-subtle);
  min-width: 0;
}

.insights-widget__row--last {
  border-bottom: none;
}

.insights-widget__copy {
  min-width: 0;
  flex: 1 1 auto;
}

.insights-widget__observation {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.35;
}

.insights-widget__stat {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
  margin-top: var(--mp-space-2);
}

.insights-widget__action {
  flex-shrink: 0;
  text-transform: none;
}

.insights-widget__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--mp-space-24);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

.insights-widget__disclaimer {
  flex-shrink: 0;
  padding-top: var(--mp-space-8);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

/* Loading shimmer — reuses the global dv-orbit-shimmer sweep keyframes */
.insights-widget__skeleton {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: var(--mp-space-4) 0;
}

.insights-widget__skeleton-row {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: var(--mp-space-12) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.insights-widget__skeleton-row:last-child {
  border-bottom: none;
}

.insights-widget__shimmer {
  height: 12px;
  border-radius: var(--mp-component-chip-radius);
  background: linear-gradient(
    90deg,
    color-mix(in oklch, var(--text-primary) 8%, transparent) 25%,
    color-mix(in oklch, var(--text-primary) 4%, transparent) 37%,
    color-mix(in oklch, var(--text-primary) 8%, transparent) 63%
  );
  background-size: 200% 100%;
  animation: dv-orbit-shimmer 1.4s linear infinite;
}

.insights-widget__shimmer--sub {
  height: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .insights-widget__shimmer {
    animation: none;
  }
}
</style>
