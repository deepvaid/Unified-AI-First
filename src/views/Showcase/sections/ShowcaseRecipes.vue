<script setup lang="ts">
import { ref } from 'vue'
import { useRevealOnce } from '../reveal'

const rootEl = ref<HTMLElement | null>(null)
const revealed = useRevealOnce(rootEl, 0.15)

const RECIPES = [
  {
    icon: 'layout-dashboard',
    title: 'Dashboard',
    text: 'Draggable widgets, KPI sparklines, comparison modes.',
    to: '/accounts/2000290/dashboard',
  },
  {
    icon: 'shopping-cart',
    title: 'Sales Orders',
    text: 'The flagship list recipe — tabs, toolbar, bulk bar, drawers.',
    to: '/commerce/2000290/orders',
  },
  {
    icon: 'workflow',
    title: 'Journey Builder',
    text: 'A full canvas workspace on system foundations.',
    to: '/accounts/2000290/journeys/1/journey-builder',
  },
  {
    icon: 'sparkles',
    title: 'Da Vinci AI',
    text: 'The voice-first AI experience, orb and all.',
    to: '/accounts/2000290/da-vinci/experience',
  },
] as const
</script>

<template>
  <section ref="rootEl" class="recipes">
    <div class="recipes__header">
      <div class="mp-eyebrow">Go deeper</div>
      <h2 class="mp-display-sm mt-2">Four rooms worth walking into.</h2>
      <p class="recipes__sub mt-3">
        Every card opens the live surface — mock data, real interactions.
      </p>
    </div>

    <v-row class="recipes__grid mt-8" :class="{ 'recipes__grid--in': revealed }">
      <v-col
        v-for="(recipe, i) in RECIPES"
        :key="recipe.title"
        cols="12"
        sm="6"
        lg="3"
        class="recipes__tile"
        :style="{ '--i': i }"
      >
        <v-card flat border rounded="lg" class="recipes__card pa-5 h-100 d-flex flex-column" :to="recipe.to">
          <div class="recipes__icon mb-4">
            <v-icon size="22" color="primary">{{ recipe.icon }}</v-icon>
          </div>
          <div class="text-subtitle-1 font-weight-bold">{{ recipe.title }}</div>
          <p class="recipes__text mt-1 flex-grow-1">{{ recipe.text }}</p>
          <div class="recipes__open mt-4">
            Open
            <v-icon size="16" class="recipes__arrow">arrow-right</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.recipes {
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  padding: var(--mp-space-48) var(--mp-space-24) var(--mp-space-80);
}

.recipes__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.recipes__sub {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-16);
}

.recipes__tile {
  opacity: 0;
}

.recipes__grid--in .recipes__tile {
  animation: recipes-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2);
}

@keyframes recipes-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.recipes__card {
  transition:
    transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    border-color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    box-shadow var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.recipes__card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: var(--mp-shadow-md);
}

.recipes__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--mp-radius-12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
}

.recipes__text {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
}

.recipes__open {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-primary));
}

.recipes__arrow {
  transition: transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.recipes__card:hover .recipes__arrow {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .recipes__tile {
    opacity: 1;
    animation: none !important;
  }

  .recipes__card,
  .recipes__arrow {
    transition: none;
  }
}
</style>
