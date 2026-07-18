<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'

const PHASE_LABELS = ['Compatibility review', 'Facade pilot', 'Sales Orders pilot', 'Incremental adoption']

const PHASES = [
  {
    title: 'Compatibility review',
    text: 'Map every portable Mp* component to one of four outcomes: reuse LiquidSky, wrap it, contribute a gap, or keep it product-local.',
  },
  {
    title: 'Facade pilot',
    text: 'Start where coupling is lowest — page header, confirm dialog, form drawer, empty and error states.',
  },
  {
    title: 'Sales Orders pilot',
    text: 'One real list page proves the table recipe against LiquidSky — search, filters, selection, bulk actions, a11y.',
  },
  {
    title: 'Incremental adoption',
    text: "Contribute through LiquidSky's normal review and release process, area by area. The app shell moves last.",
  },
]
</script>

<template>
  <DeckSlide eyebrow="The plan" title="Converge into LiquidSky. No second library.">
    <div class="mb-8">
      <MpWizardSteps :steps="PHASE_LABELS" :current="1" />
    </div>
    <v-row>
      <v-col v-for="(phase, i) in PHASES" :key="phase.title" cols="12" md="6">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="d-flex align-center ga-3 mb-2">
            <span class="s12__num">{{ i + 1 }}</span>
            <span class="text-subtitle-1 font-weight-bold">{{ phase.title }}</span>
          </div>
          <p class="s12__text">{{ phase.text }}</p>
        </v-card>
      </v-col>
    </v-row>
    <p class="s12__footnote mt-6">
      Evidence before estimates — the pilots turn unknowns into numbers before anyone commits to a
      migration date.
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
  border-radius: var(--mp-borderRadius-full);
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: var(--mp-typography-fontWeight-bold);
}

.s12__text {
  margin: 0;
  font-size: var(--mp-typography-fontSize-body);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s12__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}
</style>
