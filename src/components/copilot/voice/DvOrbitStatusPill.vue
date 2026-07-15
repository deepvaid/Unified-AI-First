<script setup lang="ts">
import { computed } from 'vue'
import DvOrbitWaveBars from './DvOrbitWaveBars.vue'
import type { OrbitState } from './orbit'

// Orbit status pill — READY / LISTENING / THINKING / DIDN'T CATCH THAT / MIC PAUSED.
// Other states render no pill (responding/added use strips, keyboard a title).
const props = defineProps<{
  state: OrbitState
}>()

const LABELS: Partial<Record<OrbitState, string>> = {
  ready: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  error: 'Didn’t catch that',
  paused: 'Mic paused',
}

const label = computed(() => LABELS[props.state])
</script>

<template>
  <div v-if="label" class="dv-orbit-pill" :class="`dv-orbit-pill--${state}`">
    <span v-if="state === 'ready'" class="dv-orbit-pill__dot" aria-hidden="true"></span>
    <DvOrbitWaveBars v-if="state === 'listening'" :count="3" :max-height="10" :bar-width="2.5" :gap="2.5" />
    <span v-if="state === 'thinking'" class="dv-orbit-pill__dots" aria-hidden="true">
      <span v-for="i in 3" :key="i" class="dv-orbit-pill__think-dot" :style="{ animationDelay: `${(i - 1) * 0.18}s` }"></span>
    </span>
    {{ label }}
  </div>
</template>

<style scoped>
.dv-orbit-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--dv-orbit-surface);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--dv-orbit-slate);
}

.dv-orbit-pill--listening {
  background: var(--dv-orbit-strip-grad);
}

.dv-orbit-pill--error {
  background: var(--dv-orbit-warn-bg);
  color: var(--dv-orbit-warn);
}

.dv-orbit-pill--paused {
  background: var(--dv-orbit-muted-bg);
  color: var(--dv-orbit-muted);
}

.dv-orbit-pill__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--dv-orbit-grad);
  animation: dv-orbit-pulse-dot 1.8s ease-in-out infinite;
}

.dv-orbit-pill__dots {
  display: flex;
  gap: 3.5px;
  flex: none;
}

.dv-orbit-pill__think-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dv-orbit-grad);
  animation: dv-orbit-pulse-dot 1.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-pill__dot,
  .dv-orbit-pill__think-dot {
    animation: none;
  }
}
</style>
