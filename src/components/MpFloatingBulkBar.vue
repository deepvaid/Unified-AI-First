<script setup lang="ts">
defineProps<{
  count: number
  total?: number
}>()

defineEmits<{
  clear: []
  selectAll: []
}>()
</script>

<template>
  <div
    class="mp-floating-bulk-bar d-flex align-center gap-3"
    :class="{ 'is-visible': count > 0 }"
    role="status"
    aria-label="Bulk actions"
  >
    <div class="mp-fbb__meta">
      <span class="mp-fbb__count">{{ count }}</span>
      <span class="mp-fbb__label">selected</span>
    </div>
    <v-btn
      v-if="total != null && count < total"
      size="small"
      variant="text"
      class="text-none mp-fbb__muted-btn"
      @click="$emit('selectAll')"
    >
      Select all ({{ total }})
    </v-btn>
    <slot />
    <v-spacer />
    <v-btn size="small" variant="text" class="text-none mp-fbb__muted-btn" @click="$emit('clear')">
      Clear selection
    </v-btn>
  </div>
</template>

<style scoped>
/* Compact floating ink-panel pill. Positioning is inherited from the global
   .mp-floating-bulk-bar rule; this scoped block restyles the surface. */
.mp-floating-bulk-bar {
  height: 48px;
  padding: 0 20px;
  margin-bottom: 20px;
  border-radius: 9999px;
  background: var(--ink-panel-bg);
  color: var(--ink-panel-fg);
  border: 1px solid var(--ink-panel-border);
  box-shadow: 0 8px 32px -12px rgba(11, 53, 88, 0.35);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateX(-50%) translateY(12px);
  transition:
    transform var(--dur-base) var(--ease),
    opacity var(--dur-base) var(--ease),
    visibility 0s linear var(--dur-base);
}

.mp-floating-bulk-bar.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
  transition:
    transform var(--dur-base) var(--ease),
    opacity var(--dur-base) var(--ease),
    visibility 0s linear 0s;
}

.mp-fbb__meta {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.mp-fbb__count {
  font-weight: 600;
  color: var(--ink-panel-accent);
  font-variant-numeric: tabular-nums;
}

.mp-fbb__label {
  color: var(--ink-panel-muted-fg);
}

/* Muted control buttons (Select all / Clear) */
.mp-fbb__muted-btn {
  color: var(--ink-panel-muted-fg);
}

/* Slotted + control buttons: readable text buttons on the dark surface */
.mp-floating-bulk-bar :deep(.v-btn) {
  color: var(--ink-panel-fg);
}

.mp-floating-bulk-bar :deep(.v-btn:hover) .v-btn__overlay {
  opacity: 1;
  background: rgba(var(--mp-rgb-color-dark-textPrimary), 0.08);
}
</style>
