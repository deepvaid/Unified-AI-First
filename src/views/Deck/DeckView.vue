<script setup lang="ts">
import { computed, markRaw, onMounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppTheme } from '@/composables/useAppTheme'
import { useSlideKeyboard } from './useSlideKeyboard'
import S01Title from './slides/S01Title.vue'
import S02Agenda from './slides/S02Agenda.vue'
import S03Problem from './slides/S03Problem.vue'
import S04ReelCue from './slides/S04ReelCue.vue'
import S05WhatThisIs from './slides/S05WhatThisIs.vue'
import S06LiveStats from './slides/S06LiveStats.vue'
import S07TourMap from './slides/S07TourMap.vue'
import S08LayerModel from './slides/S08LayerModel.vue'
import S09StorybookContract from './slides/S09StorybookContract.vue'
import S10ThemeFlip from './slides/S10ThemeFlip.vue'
import S11Workflow from './slides/S11Workflow.vue'
import S12Convergence from './slides/S12Convergence.vue'
import S13Asks from './slides/S13Asks.vue'
import S14Faq from './slides/S14Faq.vue'
import S15Closer from './slides/S15Closer.vue'

interface SlideEntry {
  key: string
  component: Component
}

const SLIDES: SlideEntry[] = [
  { key: 'title', component: markRaw(S01Title) },
  { key: 'agenda', component: markRaw(S02Agenda) },
  { key: 'problem', component: markRaw(S03Problem) },
  { key: 'reel', component: markRaw(S04ReelCue) },
  { key: 'what', component: markRaw(S05WhatThisIs) },
  { key: 'stats', component: markRaw(S06LiveStats) },
  { key: 'tour', component: markRaw(S07TourMap) },
  { key: 'layers', component: markRaw(S08LayerModel) },
  { key: 'storybook', component: markRaw(S09StorybookContract) },
  { key: 'theme', component: markRaw(S10ThemeFlip) },
  { key: 'workflow', component: markRaw(S11Workflow) },
  { key: 'convergence', component: markRaw(S12Convergence) },
  { key: 'asks', component: markRaw(S13Asks) },
  { key: 'faq', component: markRaw(S14Faq) },
  { key: 'closer', component: markRaw(S15Closer) },
]

const route = useRoute()
const router = useRouter()
const { setMode } = useAppTheme()

const index = ref(0)

function clampIndex(n: number) {
  return Math.min(Math.max(n, 0), SLIDES.length - 1)
}

onMounted(() => {
  // Deterministic entry for presenters: /deck?s=6&theme=dark
  const q = route.query.theme
  if (q === 'light' || q === 'dark') setMode(q)
  index.value = clampIndex((Number(route.query.s) || 1) - 1)
})

// Keep ?s= in the URL so any slide is deep-linkable; replace() avoids history spam.
watch(index, i => {
  router.replace({ query: { ...route.query, s: String(i + 1) } })
})

useSlideKeyboard({
  count: () => SLIDES.length,
  get: () => index.value,
  set: i => {
    index.value = i
  },
  onKey: e => {
    const k = e.key.toLowerCase()
    if (k === 'l') {
      setMode('light')
      return true
    }
    if (k === 'd') {
      setMode('dark')
      return true
    }
    return false
  },
})

const current = computed(() => SLIDES[index.value]!)
const progress = computed(() => ((index.value + 1) / SLIDES.length) * 100)
</script>

<template>
  <div class="deck-root">
    <Transition name="deck" mode="out-in">
      <component :is="current.component" :key="current.key" />
    </Transition>

    <div class="deck-progress" aria-hidden="true">
      <div class="deck-progress__fill" :style="{ width: `${progress}%` }" />
    </div>

    <div class="deck-nav">
      <v-btn
        icon="chevron-left"
        variant="text"
        size="small"
        :disabled="index === 0"
        aria-label="Previous slide"
        @click="index = clampIndex(index - 1)"
      />
      <v-btn
        icon="chevron-right"
        variant="text"
        size="small"
        :disabled="index === SLIDES.length - 1"
        aria-label="Next slide"
        @click="index = clampIndex(index + 1)"
      />
    </div>

    <div class="deck-counter">{{ index + 1 }} / {{ SLIDES.length }}</div>
  </div>
</template>

<style scoped>
.deck-root {
  position: relative;
  height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 6%, rgba(var(--v-theme-primary), 0.08), transparent 42%),
    radial-gradient(circle at 90% 96%, rgba(var(--v-theme-secondary), 0.06), transparent 48%),
    rgb(var(--v-theme-background));
  transition: background-color var(--mp-motion-duration-slow) var(--mp-motion-easing-standard);
}

.deck-enter-active,
.deck-leave-active {
  transition:
    opacity var(--mp-motion-duration-base) var(--mp-motion-easing-standard),
    transform var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
}

.deck-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.deck-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.deck-progress {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--mp-border-subtle);
  z-index: 2;
}

.deck-progress__fill {
  height: 100%;
  background: rgb(var(--v-theme-primary));
  transition: width var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
}

.deck-nav {
  position: fixed;
  bottom: var(--mp-spacing-3);
  left: var(--mp-spacing-4);
  display: flex;
  gap: var(--mp-spacing-1);
  z-index: 2;
}

.deck-counter {
  position: fixed;
  bottom: var(--mp-spacing-3);
  right: var(--mp-spacing-4);
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .deck-enter-active,
  .deck-leave-active,
  .deck-progress__fill {
    transition: none;
  }
}
</style>
