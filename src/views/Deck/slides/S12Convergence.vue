<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'

const PHASE_LABELS = ['Look at what we own', 'Try the smallest pieces', 'Prove it on one busy screen', 'Grow room by room']

const PHASES = [
  {
    title: 'Look at what we already own',
    text: "We sit down with LiquidSky — the shared library our teams already use — and sort every piece: keep, borrow, or offer ours as a gift.",
  },
  {
    title: 'Try the smallest pieces first',
    text: 'Headers, confirmation boxes, side panels — the low-risk furniture. If something feels off, we find out cheaply.',
  },
  {
    title: 'Prove it on one busy screen',
    text: 'The orders page — our busiest room — becomes the honest test. If the approach works there, it works.',
  },
  {
    title: 'Then grow, room by room',
    text: 'No big-bang launch, no frozen roadmaps. Each area moves when it\'s ready, and nothing breaks along the way.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="The plan, without drama" title="We're not building a second kitchen.">
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
      One kitchen, better stocked — not two kitchens arguing about recipes. And no dates promised
      until the first try-outs teach us the truth. That's respect for your teams, not slowness.
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
  max-width: 780px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}
</style>
