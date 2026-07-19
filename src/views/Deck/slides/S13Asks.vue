<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const ASKS = [
  'Agree this look and feel is the direction we want.',
  'Treat this sandbox as our shared reference for "done looks like this."',
  'Give me two names — one from the shared-library team, one from product engineering.',
  'Open the doors: access to the shared library and how changes get accepted.',
  'Say yes to the two small try-outs — the furniture first, then the orders page.',
  "And hold me to my own promise: we build no second, competing library. Ever.",
]
</script>

<template>
  <DeckSlide eyebrow="What I need from this room" title="Six small yeses.">
    <v-row>
      <v-col v-for="(ask, i) in ASKS" :key="ask" cols="12" md="6">
        <div class="s13__ask cine" :style="{ '--ci': 1.2 + i * 0.45 }">
          <span class="s13__num">{{ i + 1 }}</span>
          <span class="s13__text">{{ ask }}</span>
        </div>
      </v-col>
    </v-row>
    <p class="s13__footnote mt-8 cine--soft" :style="{ '--ci': 4.2 }">
      None of these cost money or headcount this quarter. They're just the keys that let the first
      try-out start this week.
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
