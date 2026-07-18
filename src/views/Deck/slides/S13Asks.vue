<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const ASKS = [
  'Confirm LiquidSky as the destination for shared capabilities.',
  'Adopt this sandbox + Storybook as the visual acceptance reference.',
  'Name one LiquidSky maintainer and one product frontend owner for the review.',
  'Share the LiquidSky source and contribution requirements.',
  'Green-light the facade pilot, then the Sales Orders pilot.',
  'Agree no parallel package ships from this sandbox. (Yes, I am volunteering that.)',
]
</script>

<template>
  <DeckSlide eyebrow="What I need from this room" title="Six small yeses.">
    <v-row>
      <v-col v-for="(ask, i) in ASKS" :key="ask" cols="12" md="6">
        <div class="s13__ask" :style="{ '--i': i }">
          <span class="s13__num">{{ i + 1 }}</span>
          <span class="s13__text">{{ ask }}</span>
        </div>
      </v-col>
    </v-row>
    <p class="s13__footnote mt-8">
      None of these are estimates or rewrites — they're the keys that start the compatibility
      review this week.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s13__ask {
  display: flex;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) var(--mp-spacing-5);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface));
  height: 100%;
  animation: s13-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2);
}

.s13__num {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-borderRadius-full);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: var(--mp-typography-fontWeight-bold);
}

.s13__text {
  font-size: var(--mp-typography-fontSize-md);
  line-height: var(--mp-typography-lineHeight-normal);
}

.s13__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}

@keyframes s13-rise {
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
  .s13__ask {
    animation: none;
  }
}
</style>
