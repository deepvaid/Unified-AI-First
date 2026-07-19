<script setup lang="ts">
import DeckSlide from '../DeckSlide.vue'

const STOPS = [
  {
    icon: 'layout-dashboard',
    title: 'The dashboard',
    note: 'Your morning coffee view',
    minutes: 3,
    to: '/accounts/2000290/dashboard',
  },
  {
    icon: 'shopping-cart',
    title: 'Orders',
    note: 'The busiest room in the house',
    minutes: 4,
    to: '/commerce/2000290/orders',
  },
  {
    icon: 'user-round',
    title: 'One customer',
    note: 'Their whole story, one page',
    minutes: 2,
    to: '/accounts/2000290/contacts/1',
  },
  {
    icon: 'workflow',
    title: 'Journey builder',
    note: 'Where marketing gets drawn',
    minutes: 3,
    to: '/accounts/2000290/journeys/1/builder',
  },
  {
    icon: 'sparkles',
    title: 'Da Vinci',
    note: 'The one that talks back',
    minutes: 2,
    to: '/accounts/2000290/da-vinci/experience',
  },
]
</script>

<template>
  <DeckSlide eyebrow="The live tour" title="Five rooms. All real. All clickable.">
    <div class="s07__grid">
      <v-card
        v-for="(stop, i) in STOPS"
        :key="stop.title"
        flat
        border
        rounded="lg"
        class="s07__card pa-5 cine"
        :to="stop.to"
        :style="{ '--ci': 1.2 + i * 0.45 }"
      >
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="s07__icon">
            <v-icon size="20" color="primary">{{ stop.icon }}</v-icon>
          </div>
          <v-chip size="x-small" label variant="tonal">{{ stop.minutes }} min</v-chip>
        </div>
        <div class="text-subtitle-1 font-weight-bold">{{ i + 1 }}. {{ stop.title }}</div>
        <div class="s07__note mt-1">{{ stop.note }}</div>
      </v-card>
    </div>
    <p class="s07__footnote mt-6 cine--soft" :style="{ '--ci': 3.8 }">
      No screenshots on this tour — every stop is the live thing. If you don't believe a screen is
      real, ask me to click something unexpected on it.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s07__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--mp-spacing-4);
}

.s07__card {
  transition:
    transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.s07__card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.s07__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--mp-borderRadius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
}

.s07__note {
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.s07__footnote {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}

@media (prefers-reduced-motion: reduce) {
  .s07__card {
    transition: none;
  }
}
</style>
