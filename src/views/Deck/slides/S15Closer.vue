<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import DeckSlide from '../DeckSlide.vue'

const DvOrbCanvas = defineAsyncComponent(() => import('@/components/copilot/voice/DvOrbCanvas.vue'))

const storybookUrl = import.meta.env.DEV ? 'http://localhost:6006' : '/storybook/'

const CREDITS = [
  '— CAST —',
  'The Numbers … MpKpiCard',
  'Every Status … MpStatusChip',
  'The Long Lists … MpDataTableToolbar',
  'Forms With Manners … MpFormDrawer',
  'Second Chances … MpConfirmDialog',
  'The Quiet Moments … MpEmptyState',
  'The Voice … Da Vinci',
  '',
  '— CREW —',
  'Directed by … the design system',
  'Lighting … one theme switch',
  'Locations … 171 real screens',
  'Wardrobe … 297 shared decisions',
  '',
  'Filmed entirely on location at /deck',
  'No mockups were harmed in the making of this presentation.',
]
</script>

<template>
  <DeckSlide centered>
    <div class="s15__orb cine--soft" :style="{ '--ci': 0 }" aria-hidden="true">
      <DvOrbCanvas state="idle" />
    </div>

    <div class="mp-eyebrow mb-4 cine" :style="{ '--ci': 0.4 }">One last surprise</div>
    <h2 class="mp-display-xl s15__title cine" :style="{ '--ci': 0.9 }">
      These slides<br />were never slides.
    </h2>
    <p class="s15__sub mt-6 cine" :style="{ '--ci': 1.7 }">
      Everything you watched tonight — every card, every color, every flip of the lights — is the
      product itself, running live. If it can carry a film, it can carry our merchants' mornings.
    </p>

    <div class="s15__credits cine--soft" :style="{ '--ci': 2.6 }" aria-label="Closing credits">
      <div class="s15__credits-roll">
        <p v-for="(line, i) in CREDITS" :key="i" :class="{ 's15__credits-head': line.startsWith('—') }">
          {{ line || ' ' }}
        </p>
      </div>
    </div>

    <div class="d-flex justify-center flex-wrap ga-3 mt-6 cine" :style="{ '--ci': 3 }">
      <v-btn color="primary" variant="flat" size="large" class="text-none" append-icon="arrow-right" to="/showcase">
        Visit the front door
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
        Open the manual
      </v-btn>
      <v-btn variant="text" size="large" class="text-none" to="/accounts/2000290/dashboard">
        Wander around
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mt-6 cine--soft" :style="{ '--ci': 3.6 }">
      Press <kbd class="s15__kbd">L</kbd> to leave the lights on for the next meeting.
    </div>
  </DeckSlide>
</template>

<style scoped>
.s15__orb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: none;
  opacity: 0.35;
}

.s15__orb > * {
  width: min(46vh, 46vw);
  height: min(46vh, 46vw);
  margin-top: -6vh;
}

.s15__title {
  position: relative;
  font-size: clamp(
    var(--mp-typography-display-md-fontSize),
    6.5vw,
    var(--mp-typography-display-xl-fontSize)
  );
}

.s15__sub {
  position: relative;
  margin-inline: auto;
  max-width: 600px;
  font-size: var(--mp-typography-fontSize-lg);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Rolling credits — a slow upward scroll behind a soft mask. */
.s15__credits {
  position: relative;
  height: 18vh;
  max-width: 460px;
  margin: var(--mp-spacing-6) auto 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);
}

.s15__credits-roll {
  animation: s15-roll 26s linear infinite;
}

.s15__credits-roll p {
  margin: 0 0 var(--mp-spacing-2);
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
}

.s15__credits-head {
  font-weight: var(--mp-typography-fontWeight-bold);
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-primary)) !important;
}

@keyframes s15-roll {
  from {
    transform: translateY(18vh);
  }
  to {
    transform: translateY(-100%);
  }
}

.s15__kbd {
  display: inline-block;
  padding: 0 var(--mp-spacing-2);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-sm);
  background: rgb(var(--v-theme-surface));
  font-family: var(--mp-typography-fontFamily-mono);
}

@media (prefers-reduced-motion: reduce) {
  .s15__credits-roll {
    animation: none;
  }
}
</style>
