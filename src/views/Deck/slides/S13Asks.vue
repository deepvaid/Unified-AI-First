<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const ASKS = [
  'Sign-off on the visual direction.',
  'Agree the sandbox and Storybook are our shared design reference.',
  'Two names for the compatibility review — one LiquidSky maintainer, one product engineer.',
  'Access to the LiquidSky repo and its contribution process.',
  'Approval to run the two pilots — components first, then the orders page.',
  'Agreement that no separate library gets published from this sandbox.',
]
</script>

<template>
  <DeckSlide eyebrow="Decisions I need today" title="Six asks.">
    <v-row>
      <v-col v-for="(ask, i) in ASKS" :key="ask" cols="12" md="6">
        <div class="s13__ask cine" :style="{ '--ci': 1.2 + i * 0.45 }">
          <span class="s13__num">{{ i + 1 }}</span>
          <span class="s13__text">{{ ask }}</span>
        </div>
      </v-col>
    </v-row>
    <p class="s13__footnote mt-8 cine--soft" :style="{ '--ci': 4.2 }">
      None of these need budget or headcount this quarter — they let the compatibility review
      start this week.
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
</style>
