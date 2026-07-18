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
      <DvOrbitOrb :size="48" :speed="1.4" :inverse="isDark" />
    </div>
    <h2 class="mp-display-lg">Roll the film.</h2>
    <p class="s04__sub mt-4">75 seconds. No slides, no talking — just the system.</p>
    <div class="d-flex justify-center flex-wrap ga-3 mt-8">
      <v-btn color="primary" variant="flat" size="large" class="text-none" prepend-icon="play">
        Play the exported reel
      </v-btn>
      <v-btn variant="outlined" size="large" class="text-none" prepend-icon="clapperboard" to="/reel">
        Or open the live title cards
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mt-6">
      The MP4 lives on the desktop — ⌘-Tab to the player, ⌘-Tab back. This slide will wait.
    </div>
  </DeckSlide>
</template>

<style scoped>
.s04__sub {
  margin: 0 auto;
  max-width: 480px;
  font-size: var(--mp-typography-fontSize-lg);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
