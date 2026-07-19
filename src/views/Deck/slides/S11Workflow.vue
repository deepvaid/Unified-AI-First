<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const STEPS = [
  {
    icon: 'lightbulb',
    title: 'Say the idea',
    text: '"What if the orders page showed refunds too?" That sentence is the whole ticket.',
  },
  {
    icon: 'zap',
    title: 'See it real — same day',
    text: 'Because the building blocks already exist, a working version appears in hours, not weeks.',
  },
  {
    icon: 'link',
    title: 'Click it together, decide together',
    text: 'You get a link in chat. Everyone opens the same living screen and the debate ends itself.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="What changes for you" title="From “what if…” to a link in your chat. In a day.">
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
      This is the loop that built almost everything you're watching tonight. It's not a promise —
      it's how this deck itself came to exist.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s11__flow {
  display: flex;
  align-items: stretch;
  gap: var(--mp-spacing-4);
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
  border-radius: var(--mp-borderRadius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
}

.s11__text {
  margin: 0;
  font-size: var(--mp-typography-fontSize-body);
  line-height: var(--mp-typography-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s11__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
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
