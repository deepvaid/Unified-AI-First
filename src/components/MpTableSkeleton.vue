<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  columns?: number
  showHeader?: boolean
}>(), {
  rows: 5,
  columns: 5,
  showHeader: true,
})
</script>

<template>
  <div class="mp-table-skeleton" role="status" aria-label="Loading" aria-live="polite">
    <div v-if="showHeader" class="mp-table-skeleton__row mp-table-skeleton__row--header">
      <div
        v-for="c in columns"
        :key="`h-${c}`"
        class="mp-table-skeleton__bar mp-table-skeleton__bar--head"
      />
    </div>
    <div
      v-for="r in rows"
      :key="`r-${r}`"
      class="mp-table-skeleton__row"
    >
      <div
        v-for="c in columns"
        :key="`c-${r}-${c}`"
        class="mp-table-skeleton__bar"
        :style="{ width: c === 1 ? '55%' : c === columns ? '40%' : '75%' }"
      />
    </div>
    <span class="mp-table-skeleton__sr">Loading data…</span>
  </div>
</template>

<style scoped>
.mp-table-skeleton {
  width: 100%;
}

.mp-table-skeleton__row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.mp-table-skeleton__row--header {
  padding-top: 14px;
  padding-bottom: 14px;
}

.mp-table-skeleton__bar {
  flex: 1;
  height: 12px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  animation: mp-skeleton-pulse 1.6s ease-in-out infinite;
}

.mp-table-skeleton__bar--head {
  height: 11px;
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.mp-table-skeleton__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes mp-skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mp-table-skeleton__bar {
    animation: none;
  }
}
</style>
