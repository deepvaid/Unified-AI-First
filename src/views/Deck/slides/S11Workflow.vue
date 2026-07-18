<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const STEPS = [
  {
    icon: 'zap',
    title: 'Prototype in the sandbox',
    text: 'AI-assisted builds on system rails — tokens, components, conventions. Hours, not weeks.',
  },
  {
    icon: 'globe',
    title: 'Review on a real URL',
    text: 'Every push deploys to Vercel. Stakeholders click the actual flow on their own laptop.',
  },
  {
    icon: 'check-circle',
    title: 'Decide with evidence',
    text: 'Responsive truth, real states, real interactions — no screenshot archaeology.',
  },
]
</script>

<template>
  <DeckSlide eyebrow="How we use it" title="Idea → running screen → shared link.">
    <div class="s11__flow">
      <template v-for="(step, i) in STEPS" :key="step.title">
        <v-card flat border rounded="lg" class="s11__step pa-6">
          <div class="s11__icon mb-4">
            <v-icon size="22" color="primary">{{ step.icon }}</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-bold">{{ step.title }}</div>
          <p class="s11__text mt-2">{{ step.text }}</p>
        </v-card>
        <v-icon v-if="i < STEPS.length - 1" class="s11__arrow" size="24">arrow-right</v-icon>
      </template>
    </div>
    <p class="s11__footnote mt-8">
      This is the loop that built most of what you'll see today — and the loop your teams inherit.
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
