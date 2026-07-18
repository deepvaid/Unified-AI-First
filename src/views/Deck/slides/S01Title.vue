<script setup lang="ts">
import { computed } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import DeckSlide from '../DeckSlide.vue'

const { mode } = useAppTheme()
const isDark = computed(() => mode.value === 'dark')
</script>

<template>
  <DeckSlide centered>
    <div class="d-flex justify-center mb-6">
      <DvOrbitOrb :size="64" :inverse="isDark" />
    </div>
    <div class="mp-eyebrow mb-4">Maropost · Product design</div>
    <h1 class="mp-display-xl s01__title">
      One system.<br />
      <span class="s01__accent">Every screen.</span>
    </h1>
    <p class="s01__sub mt-6">
      A live tour of the design sandbox — and the plan to bring it home.
    </p>
    <div class="text-caption text-medium-emphasis mt-10">
      45 minutes · press <kbd class="s01__kbd">→</kbd> to begin
    </div>
  </DeckSlide>
</template>

<style scoped>
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
  max-width: 520px;
  font-size: var(--mp-typography-fontSize-lg);
  color: rgb(var(--v-theme-on-surface-variant));
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
