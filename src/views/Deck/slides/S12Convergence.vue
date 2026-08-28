<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'

const PHASE_LABELS = ['Compatibility review', 'Component pilot', 'One-page pilot', 'Incremental adoption']

const PHASES = [
  {
    title: 'Compatibility review',
    text: 'Compare the sandbox components with LiquidSky, our shared library. Sort each one: reuse, wrap, contribute, or keep product-local.',
  },
  {
    title: 'Pilot the low-risk components',
    text: 'Page headers, confirmation dialogs, side drawers, empty states — small pieces where problems surface cheaply.',
  },
  {
    title: 'Pilot one full page',
    text: 'Sales Orders — our most-used list screen — becomes the real test of the approach.',
  },
  {
    title: 'Adopt incrementally',
    text: 'Area by area as each is ready, app shell last. No big-bang release, nothing breaks in between.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="Implementation plan" title="Converge into LiquidSky — no parallel library.">
    <div class="mb-8 cine" :style="{ '--ci': 1.2 }">
      <MpWizardSteps :steps="PHASE_LABELS" :current="1" />
    </div>
    <v-row>
      <v-col v-for="(phase, i) in PHASES" :key="phase.title" cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-5 h-100 cine" :style="{ '--ci': 1.6 + i * 0.5 }">
          <div class="d-flex align-center ga-3 mb-2">
            <span class="s12__num">{{ i + 1 }}</span>
            <span class="text-subtitle-1 font-weight-bold">{{ phase.title }}</span>
          </div>
          <p class="s12__text">{{ phase.text }}</p>
        </v-card>
      </v-col>
    </v-row>
    <p class="s12__footnote mt-6 cine--soft" :style="{ '--ci': 4 }">
      I'm deliberately not committing to dates yet — the two pilots will give us real numbers,
      and then the estimates will be based on evidence rather than guesses.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s12__num {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-radius-full);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
}

.s12__text {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s12__footnote {
  max-width: 780px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
}
</style>
