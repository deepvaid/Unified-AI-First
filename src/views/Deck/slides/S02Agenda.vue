<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const ITEMS = [
  { label: 'A 75-second film', minutes: 2 },
  { label: 'Today vs. tomorrow — the same screen, a new soul', minutes: 5 },
  { label: 'A walk through five real rooms', minutes: 14 },
  { label: 'How it works — the friendly version', minutes: 8 },
  { label: 'The plan: no rewrites, no drama', minutes: 5 },
  { label: 'Your questions — bring the hard ones', minutes: 9 },
  { label: 'One last surprise', minutes: 2 },
]
</script>

<template>
  <DeckSlide eyebrow="Tonight's programme" title="How we'll spend our 45 minutes.">
    <div class="s02__list">
      <div
        v-for="(item, i) in ITEMS"
        :key="item.label"
        class="s02__row cine"
        :style="{ '--ci': 1.2 + i * 0.5 }"
      >
        <span class="s02__num">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="s02__label">{{ item.label }}</span>
        <span class="s02__minutes">{{ item.minutes }} min</span>
      </div>
    </div>
  </DeckSlide>
</template>

<style scoped>
.s02__list {
  max-width: 760px;
}

.s02__row {
  display: flex;
  align-items: baseline;
  gap: var(--mp-spacing-6);
  padding: var(--mp-spacing-4) 0;
  border-bottom: 1px solid var(--mp-border-subtle);
}

.s02__num {
  font-family: var(--mp-typography-fontFamily-mono);
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.s02__label {
  font-size: var(--mp-typography-fontSize-xl);
  font-weight: var(--mp-typography-fontWeight-semibold);
  letter-spacing: var(--mp-typography-letterSpacing-snug);
  flex-grow: 1;
}

.s02__minutes {
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
}
</style>
