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

/* Pinned to the SAME component.table.* tokens as the real v-data-table rows in
   global.scss, so the skeleton and the table it stands in for cannot drift — a
   loading table and a loaded table are the same height, column for column. */
.mp-table-skeleton__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-24);
  min-height: var(--mp-component-table-rowMinHeight);
  padding: var(--mp-component-table-cellPaddingBlock) var(--mp-component-table-cellPaddingInline);
  border-bottom: 1px solid var(--border-subtle);
}

.mp-table-skeleton__row--header {
  min-height: var(--mp-component-table-headerMinHeight);
  padding-top: var(--mp-component-table-headerPaddingBlock);
  padding-bottom: var(--mp-component-table-headerPaddingBlock);
}

@media (max-width: 599.98px) {
  .mp-table-skeleton__row {
    padding-inline: var(--mp-component-table-cellPaddingInlineCompact);
  }
}

.mp-table-skeleton__bar {
  flex: 1;
  height: var(--mp-space-12);
  border-radius: var(--mp-radius-4);
  background: color-mix(in oklch, var(--text-primary) 8%, transparent);
  animation: mp-skeleton-pulse 1.6s ease-in-out infinite;
}

.mp-table-skeleton__bar--head {
  height: var(--mp-fontSize-11);
  background: color-mix(in oklch, var(--text-primary) 12%, transparent);
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
