<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const STEPS = [
  {
    icon: 'lightbulb',
    title: 'Describe the change',
    text: '"Show refunds on the orders page" — a sentence is enough to start.',
  },
  {
    icon: 'zap',
    title: 'Prototype the same day',
    text: 'The components already exist, so a working version takes hours, not weeks.',
  },
  {
    icon: 'link',
    title: 'Review a live link',
    text: 'Everyone clicks the same working screen instead of debating a static mockup.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="Why this matters" title="Idea to clickable prototype in a day.">
    <div class="s11__flow">
      <template v-for="(step, i) in STEPS" :key="step.title">
        <v-card flat border rounded="lg" class="s11__step pa-6 cine" :style="{ '--ci': 1.2 + i * 0.6 }">
          <div class="s11__icon mb-4">
            <v-icon size="22" color="primary">{{ step.icon }}</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-bold">{{ step.title }}</div>
          <p class="s11__text mt-2">{{ step.text }}</p>
        </v-card>
        <v-icon v-if="i < STEPS.length - 1" class="s11__arrow cine" size="24" :style="{ '--ci': 1.5 + i * 0.6 }">arrow-right</v-icon>
      </template>
    </div>
    <p class="s11__footnote mt-8 cine--soft" :style="{ '--ci': 3.4 }">
      This is the process we used to build the sandbox itself — including this deck.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s11__flow {
  display: flex;
  align-items: stretch;
  gap: var(--mp-space-16);
}

.s11__step {
  flex: 1;
}

.s11__arrow {
  align-self: center;
  color: rgb(var(--v-theme-on-surface-variant));
  flex-shrink: 0;
}

.s11__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--mp-radius-12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
}

.s11__text {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s11__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
}

@media (max-width: 900px) {
  .s11__flow {
    flex-direction: column;
  }

  .s11__arrow {
    transform: rotate(90deg);
    align-self: center;
  }
}
</style>
