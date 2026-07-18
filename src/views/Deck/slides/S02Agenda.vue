<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const ITEMS = [
  { label: 'A 75-second film', minutes: 2 },
  { label: "What this is — and isn't", minutes: 5 },
  { label: 'The live tour', minutes: 14 },
  { label: 'Under the hood', minutes: 8 },
  { label: 'The plan: converging into LiquidSky', minutes: 5 },
  { label: 'Your questions — bring the hard ones', minutes: 9 },
  { label: 'One more thing', minutes: 2 },
]
</script>

<template>
  <DeckSlide eyebrow="Agenda" title="The next 45 minutes.">
    <div class="s02__list">
      <div v-for="(item, i) in ITEMS" :key="item.label" class="s02__row" :style="{ '--i': i }">
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
  animation: s02-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2);
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

@keyframes s02-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .s02__row {
    animation: none;
  }
}
</style>
