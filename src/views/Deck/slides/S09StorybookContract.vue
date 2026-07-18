<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const storybookUrl = import.meta.env.DEV ? 'http://localhost:6006' : '/storybook/'

const POINTS = [
  {
    icon: 'book-open',
    text: '84 stories with autodocs — API, states, usage rules, and the axe accessibility panel on every one.',
  },
  {
    icon: 'git-merge',
    text: 'Stories load the exact app stylesheets through one shared manifest — Storybook renders what the product renders. We fixed the drift once, structurally.',
  },
  {
    icon: 'scale',
    text: 'House rule: components ship with stories; views compose components. If it has no story, it has no contract.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="The contract" title="If it isn't in Storybook, it doesn't exist.">
    <div class="s09__points">
      <div v-for="point in POINTS" :key="point.icon" class="s09__point">
        <div class="s09__icon">
          <v-icon size="20" color="primary">{{ point.icon }}</v-icon>
        </div>
        <p class="s09__text">{{ point.text }}</p>
      </div>
    </div>
    <div class="d-flex flex-wrap ga-3 mt-8">
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        class="text-none"
        prepend-icon="book-open"
        :href="storybookUrl"
        target="_blank"
        rel="noopener"
      >
        Open Storybook
      </v-btn>
      <v-btn
        variant="outlined"
        size="large"
        class="text-none"
        prepend-icon="swatch-book"
        to="/accounts/2000290/design-system"
      >
        In-app foundations
      </v-btn>
    </div>
  </DeckSlide>
</template>

<style scoped>
.s09__points {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-5);
  max-width: 820px;
}

.s09__point {
  display: flex;
  gap: var(--mp-spacing-4);
}

.s09__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--mp-borderRadius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
}

.s09__text {
  margin: 0;
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
}
</style>
