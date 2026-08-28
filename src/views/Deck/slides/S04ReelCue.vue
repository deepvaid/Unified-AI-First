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
    <div class="d-flex justify-center mb-6 cine" :style="{ '--ci': 0 }">
      <DvOrbitOrb :size="48" :speed="1.4" :inverse="isDark" />
    </div>
    <h2 class="mp-display-lg cine" :style="{ '--ci': 0.5 }">A 75-second intro.</h2>
    <p class="s04__sub mt-4 cine" :style="{ '--ci': 1.2 }">
      Short video first — after that, everything is live.
    </p>
    <div class="d-flex justify-center flex-wrap ga-3 mt-8 cine" :style="{ '--ci': 1.9 }">
      <v-btn color="primary" variant="flat" size="large" class="text-none" prepend-icon="play">
        Play the video
      </v-btn>
      <v-btn variant="outlined" size="large" class="text-none" prepend-icon="clapperboard" to="/reel">
        Open the title cards
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mt-6 cine" :style="{ '--ci': 2.5 }">
      The video file is on the desktop — ⌘-Tab over and back.
    </div>
  </DeckSlide>
</template>

<style scoped>
.s04__sub {
  margin: 0 auto;
  max-width: 480px;
  font-size: var(--mp-fontSize-18);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
