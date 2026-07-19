<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const PAINS = [
  {
    icon: 'copy-x',
    text: 'Screens were built at different times, by different teams, without shared UI standards.',
  },
  {
    icon: 'hourglass',
    text: 'Prototyping took weeks, so most design decisions were made from static mockups.',
  },
  {
    icon: 'users',
    text: 'The result is an inconsistent experience — and our customers notice it.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="The problem" title="Every screen does its own thing.">
    <v-row>
      <v-col cols="12" md="5">
        <!-- Deliberately hardcoded chaos — the "before" this whole effort removes -->
        <div class="s03__chaos cine" :style="{ '--ci': 1.2 }" aria-label="A dramatization of inconsistent UI">
          <button class="s03__btn" style="background: #2d63e8; border-radius: 0; font-family: Georgia, serif">Save</button>
          <button class="s03__btn" style="background: #1e88e5; border-radius: 18px; font-family: 'Courier New', monospace">SAVE</button>
          <button class="s03__btn" style="background: #4059ad; border-radius: 3px; padding: 14px 30px">Save changes</button>
          <button class="s03__btn" style="background: #00a0c6; border-radius: 999px; font-size: 11px">save</button>
          <button class="s03__btn" style="background: #3366cc; border-radius: 8px; font-family: Arial; letter-spacing: 2px">S A V E</button>
        </div>
        <div class="text-caption text-medium-emphasis mt-3 cine" :style="{ '--ci': 1.8 }">
          Five different Save buttons, recreated from patterns in our current product.
        </div>
      </v-col>
      <v-col cols="12" md="7" class="d-flex flex-column justify-center">
        <div
          v-for="(pain, i) in PAINS"
          :key="pain.icon"
          class="s03__pain cine"
          :style="{ '--ci': 1.6 + i * 0.7 }"
        >
          <v-icon size="22" color="error" class="mt-1">{{ pain.icon }}</v-icon>
          <span>{{ pain.text }}</span>
        </div>
      </v-col>
    </v-row>
  </DeckSlide>
</template>

<style scoped>
.s03__chaos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-8) var(--mp-spacing-6);
  border: 1px dashed var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-md);
  background: rgb(var(--v-theme-surface));
  transform: rotate(-0.6deg);
}

/* The one place hardcoded styles are welcome: the "before" artifact. */
.s03__btn {
  color: #fff;
  border: none;
  padding: 8px 18px;
  font-size: 14px;
  cursor: default;
}

.s03__pain {
  display: flex;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) 0;
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
}
</style>
