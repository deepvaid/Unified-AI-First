<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const storybookUrl = import.meta.env.DEV ? 'http://localhost:6006' : '/storybook/'
</script>

<template>
  <DeckSlide centered>
    <div class="mp-eyebrow mb-4">One more thing</div>
    <h2 class="mp-display-xl s15__title">These slides?<br />Also the system.</h2>
    <p class="s15__sub mt-6">
      This deck is a route in the sandbox — <code class="s15__code">/deck</code> — built from the
      same tokens, cards and chips you just toured. If it can carry a keynote, it can carry a
      product.
    </p>
    <div class="d-flex justify-center flex-wrap ga-3 mt-8">
      <v-btn color="primary" variant="flat" size="large" class="text-none" append-icon="arrow-right" to="/showcase">
        Back to the showcase
      </v-btn>
      <v-btn
        variant="outlined"
        size="large"
        class="text-none"
        prepend-icon="book-open"
        :href="storybookUrl"
        target="_blank"
        rel="noopener"
      >
        Storybook
      </v-btn>
      <v-btn variant="text" size="large" class="text-none" to="/accounts/2000290/dashboard">
        Wander the sandbox
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mt-10">
      Press <kbd class="s15__kbd">L</kbd> to leave the lights on for the next meeting.
    </div>
  </DeckSlide>
</template>

<style scoped>
.s15__title {
  font-size: clamp(
    var(--mp-typography-display-md-fontSize),
    6.5vw,
    var(--mp-typography-display-xl-fontSize)
  );
}

.s15__sub {
  margin: 0 auto;
  max-width: 560px;
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s15__code {
  font-family: var(--mp-typography-fontFamily-mono);
  font-size: 0.9em;
  padding: 0 var(--mp-spacing-1);
  border-radius: var(--mp-borderRadius-sm);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.s15__kbd {
  display: inline-block;
  padding: 0 var(--mp-spacing-2);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-sm);
  background: rgb(var(--v-theme-surface));
  font-family: var(--mp-typography-fontFamily-mono);
}
</style>
