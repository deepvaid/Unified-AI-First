<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted, provide, readonly, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppTheme } from '@/composables/useAppTheme'
import { useSlideKeyboard } from './useSlideKeyboard'
import S01Title from './slides/S01Title.vue'
import S02Agenda from './slides/S02Agenda.vue'
import S03Morning from './slides/S03Morning.vue'
import S04Problem from './slides/S03Problem.vue'
import S05ReelCue from './slides/S04ReelCue.vue'
import S06WhatThisIs from './slides/S05WhatThisIs.vue'
import S07LiveStats from './slides/S06LiveStats.vue'
import S08TourMap from './slides/S07TourMap.vue'
import S09LayerModel from './slides/S08LayerModel.vue'
import S10StorybookContract from './slides/S09StorybookContract.vue'
import S11ThemeFlip from './slides/S10ThemeFlip.vue'
import S12Workflow from './slides/S11Workflow.vue'
import S13Convergence from './slides/S12Convergence.vue'
import S14Asks from './slides/S13Asks.vue'
import S15Faq from './slides/S14Faq.vue'
import S16Closer from './slides/S15Closer.vue'

interface SlideEntry {
  key: string
  component: Component
  /** Movie-mode hold time for this slide, in ms. */
  duration: number
}

const SLIDES: SlideEntry[] = [
  { key: 'title', component: markRaw(S01Title), duration: 9000 },
  { key: 'agenda', component: markRaw(S02Agenda), duration: 9000 },
  { key: 'morning', component: markRaw(S03Morning), duration: 16000 },
  { key: 'problem', component: markRaw(S04Problem), duration: 10000 },
  { key: 'reel', component: markRaw(S05ReelCue), duration: 8000 },
  { key: 'what', component: markRaw(S06WhatThisIs), duration: 12000 },
  { key: 'stats', component: markRaw(S07LiveStats), duration: 12000 },
  { key: 'tour', component: markRaw(S08TourMap), duration: 12000 },
  { key: 'layers', component: markRaw(S09LayerModel), duration: 14000 },
  { key: 'storybook', component: markRaw(S10StorybookContract), duration: 10000 },
  { key: 'theme', component: markRaw(S11ThemeFlip), duration: 12000 },
  { key: 'workflow', component: markRaw(S12Workflow), duration: 12000 },
  { key: 'convergence', component: markRaw(S13Convergence), duration: 12000 },
  { key: 'asks', component: markRaw(S14Asks), duration: 12000 },
  { key: 'faq', component: markRaw(S15Faq), duration: 8000 },
  { key: 'closer', component: markRaw(S16Closer), duration: 16000 },
]

const route = useRoute()
const router = useRouter()
const { setMode } = useAppTheme()

const index = ref(0)

function clampIndex(n: number) {
  return Math.min(Math.max(n, 0), SLIDES.length - 1)
}

// ── Movie mode ───────────────────────────────────────────────────────────────
// A rAF-driven autoplay: each slide holds for its `duration`, the timeline
// fills continuously, and any manual navigation hands control back to the
// presenter (pause). `P` plays/pauses from anywhere.
const playing = ref(false)
const slideProgress = ref(0)
let rafId = 0
let slideStartedAt = 0

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function tick(now: number) {
  const duration = SLIDES[index.value]!.duration
  const p = (now - slideStartedAt) / duration
  if (p >= 1) {
    if (index.value >= SLIDES.length - 1) {
      slideProgress.value = 1
      stopMovie()
      return
    }
    index.value = index.value + 1
    slideStartedAt = now
    slideProgress.value = 0
  } else {
    slideProgress.value = p
  }
  rafId = requestAnimationFrame(tick)
}

function playMovie() {
  if (playing.value || reducedMotion()) return
  playing.value = true
  slideStartedAt = performance.now() - slideProgress.value * SLIDES[index.value]!.duration
  rafId = requestAnimationFrame(tick)
}

function stopMovie() {
  playing.value = false
  cancelAnimationFrame(rafId)
}

function toggleMovie() {
  if (playing.value) stopMovie()
  else playMovie()
}

/** Manual navigation always hands the wheel back to the presenter. */
function goTo(i: number) {
  stopMovie()
  index.value = clampIndex(i)
  slideProgress.value = 0
}

// Slides (e.g. the theme-flip moment) can choreograph themselves while the film runs.
provide('deckPlaying', readonly(playing))
provide('deckPlay', playMovie)

onBeforeUnmount(stopMovie)

// ── Entry, URL sync, keys ────────────────────────────────────────────────────
onMounted(() => {
  // Deterministic entry for presenters: /deck?s=6&theme=dark — and ?play=1 to
  // let the film start rolling on its own.
  const q = route.query.theme
  if (q === 'light' || q === 'dark') setMode(q)
  index.value = clampIndex((Number(route.query.s) || 1) - 1)
  if (route.query.play === '1') window.setTimeout(playMovie, 600)
})

// Keep ?s= in the URL so any slide is deep-linkable; replace() avoids history spam.
watch(index, i => {
  router.replace({ query: { ...route.query, s: String(i + 1) } })
  slideProgress.value = 0
})

useSlideKeyboard({
  count: () => SLIDES.length,
  get: () => index.value,
  set: i => goTo(i),
  onKey: e => {
    const k = e.key.toLowerCase()
    if (k === 'p') {
      toggleMovie()
      return true
    }
    if (k === ' ' && playing.value) {
      stopMovie()
      return true
    }
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
</script>

<template>
  <div class="deck-root">
    <!-- Ambient set lighting — two slow color drifts behind every scene -->
    <div class="deck-ambient" aria-hidden="true">
      <div class="deck-ambient__blob deck-ambient__blob--a" />
      <div class="deck-ambient__blob deck-ambient__blob--b" />
    </div>

    <Transition name="deck" mode="out-in">
      <component :is="current.component" :key="current.key" />
    </Transition>

    <!-- Film-strip timeline: one segment per scene -->
    <div class="deck-timeline" aria-hidden="true">
      <div
        v-for="(slide, i) in SLIDES"
        :key="slide.key"
        class="deck-timeline__seg"
        :class="{ 'deck-timeline__seg--past': i < index }"
      >
        <div
          v-if="i === index"
          class="deck-timeline__fill"
          :style="{ width: `${(playing ? slideProgress : 1) * 100}%` }"
        />
      </div>
    </div>

    <div class="deck-nav">
      <v-btn
        :icon="playing ? 'pause' : 'play'"
        variant="text"
        size="small"
        :aria-label="playing ? 'Pause the film' : 'Play the film'"
        @click="toggleMovie"
      />
      <v-btn
        icon="chevron-left"
        variant="text"
        size="small"
        :disabled="index === 0"
        aria-label="Previous slide"
        @click="goTo(index - 1)"
      />
      <v-btn
        icon="chevron-right"
        variant="text"
        size="small"
        :disabled="index === SLIDES.length - 1"
        aria-label="Next slide"
        @click="goTo(index + 1)"
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
  background: rgb(var(--v-theme-background));
  transition: background-color var(--mp-motion-duration-slow) var(--mp-motion-easing-standard);
}

/* ── Ambient set lighting ──────────────────────────────────────── */
.deck-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.deck-ambient__blob {
  position: absolute;
  width: 55vw;
  height: 55vw;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
}

.deck-ambient__blob--a {
  top: -22vw;
  left: -14vw;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.16), transparent 65%);
  animation: deck-drift-a 26s ease-in-out infinite alternate;
}

.deck-ambient__blob--b {
  bottom: -26vw;
  right: -16vw;
  background: radial-gradient(circle, rgba(var(--v-theme-secondary), 0.12), transparent 65%);
  animation: deck-drift-b 34s ease-in-out infinite alternate;
}

@keyframes deck-drift-a {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(9vw, 7vh) scale(1.18); }
}

@keyframes deck-drift-b {
  from { transform: translate(0, 0) scale(1.12); }
  to { transform: translate(-8vw, -6vh) scale(0.94); }
}

/* ── Cinematic scene change ────────────────────────────────────── */
.deck-enter-active {
  transition:
    opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.deck-leave-active {
  transition:
    opacity 0.45s var(--mp-motion-easing-exit),
    transform 0.45s var(--mp-motion-easing-exit),
    filter 0.45s var(--mp-motion-easing-exit);
}

.deck-enter-from {
  opacity: 0;
  transform: scale(1.035);
  filter: blur(14px);
}

.deck-leave-to {
  opacity: 0;
  transform: scale(0.985);
  filter: blur(8px);
}

/* ── The ~3s scene build: slides tag elements with .cine + --ci ──
   Each step is 420ms apart, so a 6-beat slide finishes composing in
   about three seconds — the film pace. Slides remount on navigation,
   so every visit replays its build. */
:deep(.cine) {
  opacity: 0;
  animation: deck-cine-in 1.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--ci, 0) * 420ms + 200ms);
}

:deep(.cine--soft) {
  opacity: 0;
  animation: deck-cine-soft 2.2s ease-out both;
  animation-delay: calc(var(--ci, 0) * 420ms + 200ms);
}

@keyframes deck-cine-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.985);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@keyframes deck-cine-soft {
  from {
    opacity: 0;
    filter: blur(6px);
  }
  to {
    opacity: 1;
    filter: none;
  }
}

/* ── Film-strip timeline ───────────────────────────────────────── */
.deck-timeline {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 0 var(--mp-space-16) var(--mp-space-8);
  z-index: 2;
}

.deck-timeline__seg {
  position: relative;
  flex: 1;
  height: 3px;
  border-radius: var(--mp-radius-full);
  background: var(--mp-border-subtle);
  overflow: hidden;
}

.deck-timeline__seg--past {
  background: rgba(var(--v-theme-primary), 0.55);
}

.deck-timeline__fill {
  height: 100%;
  border-radius: inherit;
  background: rgb(var(--v-theme-primary));
}

.deck-nav {
  position: fixed;
  bottom: var(--mp-space-16);
  left: var(--mp-space-16);
  display: flex;
  gap: var(--mp-space-4);
  z-index: 2;
}

.deck-counter {
  position: fixed;
  bottom: var(--mp-space-16);
  right: var(--mp-space-16);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .deck-enter-active,
  .deck-leave-active {
    transition: none;
  }

  .deck-ambient__blob {
    animation: none;
  }

  :deep(.cine),
  :deep(.cine--soft) {
    animation: none;
    opacity: 1;
  }
}
</style>
