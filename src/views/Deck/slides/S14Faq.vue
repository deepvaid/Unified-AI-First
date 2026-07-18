<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const TOPICS = [
  'Production-ready?',
  'LiquidSky',
  'Vuetify lock-in',
  'AI-written code',
  'Accessibility',
  'Tokens',
  'Timeline',
  'Maintenance',
  'Figma',
]
</script>

<template>
  <DeckSlide centered>
    <div class="mp-eyebrow mb-4">Your turn</div>
    <h2 class="mp-display-lg">Ask me the hard ones.</h2>
    <p class="s14__sub mt-5">
      Production-ready? Lock-in? Who maintains it? Can we trust AI-written code?<br />
      I have answers — and where I don't, I have a next step and a name.
    </p>
    <div class="d-flex flex-wrap justify-center ga-2 mt-8">
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
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
