<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppTheme } from '@/composables/useAppTheme'
import ShowcaseHero from './sections/ShowcaseHero.vue'
import ShowcaseStatsBar from './sections/ShowcaseStatsBar.vue'
import ShowcaseWall from './sections/ShowcaseWall.vue'
import ShowcaseRecipes from './sections/ShowcaseRecipes.vue'

const route = useRoute()
const { setMode } = useAppTheme()

const storybookUrl = import.meta.env.DEV ? 'http://localhost:6006' : '/storybook/'

const PRINCIPLES = ['Token-pure', 'AA-checked contrast', 'Light + dark', 'Reduced-motion safe']

onMounted(() => {
  // Deterministic entry for presenters: /showcase?theme=light|dark
  const q = route.query.theme
  if (q === 'light' || q === 'dark') setMode(q)
})
</script>

<template>
  <div class="showcase-root">
    <ShowcaseHero />
    <ShowcaseStatsBar />
    <ShowcaseWall />
    <ShowcaseRecipes />

    <footer class="showcase-footer">
      <div class="showcase-footer__principles">
        <span v-for="principle in PRINCIPLES" :key="principle" class="showcase-footer__principle">
          <v-icon size="14" color="success">check</v-icon>
          {{ principle }}
        </span>
      </div>

      <div class="showcase-footer__links mt-5">
        <RouterLink class="showcase-footer__link" to="/deck">Presentation deck</RouterLink>
        <RouterLink class="showcase-footer__link" to="/reel">Reel title cards</RouterLink>
        <RouterLink class="showcase-footer__link" to="/accounts/2000290/design-system">Foundations</RouterLink>
        <a class="showcase-footer__link" :href="storybookUrl" target="_blank" rel="noopener">Storybook</a>
      </div>

      <p class="showcase-footer__note mt-5">
        Maropost design sandbox — mock data, real system. This page is built from the components it
        demonstrates.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.showcase-root {
  min-height: 100dvh;
  width: 100%;
  background:
    radial-gradient(circle at 12% 8%, rgba(var(--v-theme-primary), 0.1), transparent 46%),
    radial-gradient(circle at 88% 92%, rgba(var(--v-theme-secondary), 0.08), transparent 50%),
    rgb(var(--v-theme-background));
  transition: background-color var(--mp-motion-duration-slow) var(--mp-motion-easing-standard);
}

.showcase-footer {
  border-top: 1px solid var(--mp-border-subtle);
  padding: var(--mp-space-48) var(--mp-space-24) var(--mp-space-64);
  text-align: center;
}

.showcase-footer__principles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--mp-space-12) var(--mp-space-24);
}

.showcase-footer__principle {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-on-surface-variant));
}

.showcase-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--mp-space-24);
}

.showcase-footer__link {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.showcase-footer__link:hover {
  text-decoration: underline;
}

.showcase-footer__note {
  margin: 0 auto;
  max-width: 480px;
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
