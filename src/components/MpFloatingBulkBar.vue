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
  <transition name="mp-fbb">
    <div
      v-if="count > 0"
      class="mp-floating-bulk-bar d-flex align-center gap-3"
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
  </transition>
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

/* Entrance — transform/opacity on the base motion tokens */
.mp-fbb-enter-active,
.mp-fbb-leave-active {
  transition:
    transform var(--dur-base) var(--ease),
    opacity var(--dur-base) var(--ease);
}

.mp-fbb-enter-from,
.mp-fbb-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
