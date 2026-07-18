<script setup lang="ts">
import { computed, markRaw, ref, type Component } from 'vue'
// Shared slide-surface keyboard nav — deliberate cross-view import (see Deck/useSlideKeyboard).
import { useSlideKeyboard } from '@/views/Deck/useSlideKeyboard'
import ReelChaosCard from './cards/ReelChaosCard.vue'
import ReelTypeCard from './cards/ReelTypeCard.vue'
import ReelStatsCard from './cards/ReelStatsCard.vue'
import ReelWordmarkCard from './cards/ReelWordmarkCard.vue'

interface ReelCardEntry {
  key: string
  component: Component
  props?: Record<string, unknown>
}

const CARDS: ReelCardEntry[] = [
  { key: 'chaos', component: markRaw(ReelChaosCard) },
  {
    key: 'type-before',
    component: markRaw(ReelTypeCard),
    props: {
      lines: [
        { text: 'Three buttons.' },
        { text: 'Five blues.' },
        { text: 'Zero consistency.', strong: true },
      ],
    },
  },
  {
    key: 'type-after',
    component: markRaw(ReelTypeCard),
    props: {
      lines: [{ text: 'One system.' }, { text: 'Every screen.', strong: true }],
    },
  },
  { key: 'stats', component: markRaw(ReelStatsCard) },
  { key: 'wordmark', component: markRaw(ReelWordmarkCard) },
]

const index = ref(0)
// R remounts the current card via :key, restarting every CSS animation from t=0.
const runId = ref(0)

useSlideKeyboard({
  count: () => CARDS.length,
  get: () => index.value,
  set: i => {
    index.value = i
  },
  onKey: e => {
    if (e.key.toLowerCase() === 'r') {
      runId.value++
      return true
    }
    return false
  },
})

const current = computed(() => CARDS[index.value]!)
</script>

<template>
  <v-theme-provider theme="maropostDark" with-background class="reel-root">
    <div class="reel-stage">
      <component :is="current.component" :key="`${current.key}:${runId}`" v-bind="current.props" />
    </div>
    <div class="reel-hint" aria-hidden="true">← → cards &nbsp;·&nbsp; R replays</div>
  </v-theme-provider>
</template>

<style scoped>
.reel-root {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 16:9-safe composition at any window shape; letterbox shares the dark stage. */
.reel-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  width: min(100vw, calc(100dvh * 16 / 9));
  max-height: 100dvh;
}

.reel-hint {
  position: fixed;
  bottom: var(--mp-spacing-4);
  left: 50%;
  transform: translateX(-50%);
  font-size: var(--mp-typography-fontSize-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  pointer-events: none;
  animation: reel-hint-fade 600ms var(--mp-motion-easing-exit) 2200ms forwards;
}

@keyframes reel-hint-fade {
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* Keep the hint visible — a recording machine shouldn't run reduced motion anyway. */
  .reel-hint {
    animation: none;
  }
}
</style>
