<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const TOPICS = [
  'Production readiness',
  'Vuetify lock-in',
  'Ownership & maintenance',
  'AI-generated code',
  'Accessibility',
  'Timeline',
  'Cost',
  'Where Figma fits',
]
</script>

<template>
  <DeckSlide centered>
    <div class="mp-eyebrow mb-4 cine" :style="{ '--ci': 0 }">Q&amp;A</div>
    <h2 class="mp-display-lg cine" :style="{ '--ci': 0.5 }">Questions.</h2>
    <p class="s14__sub mt-5 cine" :style="{ '--ci': 1.3 }">
      Happy to take the hard ones. Where I don't have an answer today,
      I'll come back with one — not a guess.
    </p>
    <div class="d-flex flex-wrap justify-center ga-2 mt-8 cine" :style="{ '--ci': 2 }">
      <v-chip v-for="topic in TOPICS" :key="topic" label size="large" variant="tonal">
        {{ topic }}
      </v-chip>
    </div>
  </DeckSlide>
</template>

<style scoped>
.s14__sub {
  margin: 0 auto;
  max-width: 620px;
  font-size: var(--mp-fontSize-18);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
