<script setup lang="ts">
import { defineAsyncComponent, inject } from 'vue'
import DeckSlide from '../DeckSlide.vue'

// The big three.js orb — loaded only when this slide appears, so the deck
// itself stays light. It has its own graceful CSS fallback while loading.
const DvOrbCanvas = defineAsyncComponent(() => import('@/components/copilot/voice/DvOrbCanvas.vue'))

const play = inject<() => void>('deckPlay', () => {})
</script>

<template>
  <DeckSlide centered>
    <div class="s01__orb" aria-hidden="true">
      <DvOrbCanvas state="idle" />
    </div>

    <div class="s01__content">
      <div class="mp-eyebrow mb-4 cine" :style="{ '--ci': 0 }">
        Maropost · Design system sandbox · UX
      </div>
      <h1 class="mp-display-xl s01__title cine" :style="{ '--ci': 0.6 }">
        One design system.<br />
        <span class="s01__accent">Every screen.</span>
      </h1>
      <p class="s01__sub cine" :style="{ '--ci': 1.4 }">
        A walkthrough of the design sandbox we've built — live screens, not mockups.
        45 minutes, questions welcome anytime.
      </p>

      <div class="cine" :style="{ '--ci': 2.2 }">
        <v-btn
          color="primary"
          variant="flat"
          size="x-large"
          class="text-none mt-8"
          prepend-icon="play"
          @click="play()"
        >
          Start
        </v-btn>
        <div class="text-caption text-medium-emphasis mt-4">
          The deck advances on its own — <kbd class="s01__kbd">P</kbd> plays or pauses,
          arrow keys move manually.
        </div>
      </div>
    </div>
  </DeckSlide>
</template>

<style scoped>
.s01__orb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.5;
}

.s01__orb > * {
  width: min(58vh, 58vw);
  height: min(58vh, 58vw);
}

.s01__content {
  position: relative;
}

.s01__title {
  font-size: clamp(
    var(--mp-typography-display-md-fontSize),
    7vw,
    var(--mp-typography-display-xl-fontSize)
  );
}

.s01__accent {
  color: rgb(var(--v-theme-primary));
}

.s01__sub {
  margin: 0 auto;
  max-width: 540px;
  font-size: var(--mp-typography-fontSize-lg);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: var(--mp-spacing-6);
}

.s01__kbd {
  display: inline-block;
  padding: 0 var(--mp-spacing-2);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-sm);
  background: rgb(var(--v-theme-surface));
  font-family: var(--mp-typography-fontFamily-mono);
}
</style>
