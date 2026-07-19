<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const TOPICS = [
  'Is it ready for customers?',
  'Are we locked in?',
  'Who looks after it?',
  'Can we trust AI-built work?',
  'What about accessibility?',
  'How long will it take?',
  'What does it cost?',
  'Where does Figma fit?',
]
</script>

<template>
  <DeckSlide centered>
    <div class="mp-eyebrow mb-4 cine" :style="{ '--ci': 0 }">Your turn</div>
    <h2 class="mp-display-lg cine" :style="{ '--ci': 0.5 }">Ask me the hard ones.</h2>
    <p class="s14__sub mt-5 cine" :style="{ '--ci': 1.3 }">
      Especially the ones you think might hurt.<br />
      Where I don't have an answer, I'll give you a next step and a name instead of an excuse.
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
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
