<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createMarkOrb, type MarkOrbHandle } from '@/lib/davinci-orb/mark'

// "Glow Mist Medium" particle-orb identity mark — canvas renderer (the finalized
// stakeholder design). A dense even halo RING + soft tapered SCATTER on one slow
// CCW spin (~20s), with the brand spectral glints drifting + twinkling on top.
// Ink colour comes from `currentColor` via CSS (--dv-ink · --inverse · --dim), so
// the engine just reads the inherited `color`. Pure canvas + a CSS breathe.
const props = withDefaults(
  defineProps<{
    size: number
    /** Spin-speed multiplier: listening 2.4 · thinking 1.6 · strip 1.4 · keyboard/error 0.6 · paused 0.25 */
    speed?: number
    /** Slate mark, no breathe, no glints (error/paused) */
    dim?: boolean
    /** Monochrome conic arc sweep outside the orb (thinking) */
    arc?: boolean
    /** White mark for dark or gradient backgrounds */
    inverse?: boolean
  }>(),
  { speed: 1, dim: false, arc: false, inverse: false },
)

// All in-app marks render larger than their passed `size` (brand bump + the
// stakeholder's +20%). renderSize drives the element box; the canvas fills it.
const renderSize = computed(() => props.size * 1.44)
const breatheDuration = computed(() => `${7 / Math.min(props.speed, 1.5)}s`)

const canvasEl = ref<HTMLCanvasElement | null>(null)
let handle: MarkOrbHandle | null = null

onMounted(() => {
  if (!canvasEl.value) return
  handle = createMarkOrb(canvasEl.value, {
    speed: props.speed,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })
})

onBeforeUnmount(() => {
  handle?.destroy()
  handle = null
})

watch(
  () => props.speed,
  (s) => handle?.setSpeed(s),
)
// `dim`/`inverse` only change colour (slate / white) and stop breathe — handled
// by the --dim/--inverse CSS classes; the engine reads the inherited `color`, so
// no JS wiring is needed.
</script>

<template>
  <div
    class="dv-orbit-orb"
    :class="{ 'dv-orbit-orb--dim': dim, 'dv-orbit-orb--inverse': inverse }"
    :style="{ width: `${renderSize}px`, height: `${renderSize}px` }"
    aria-hidden="true"
  >
    <div v-if="arc" class="dv-orbit-orb__arc"></div>
    <canvas ref="canvasEl" class="dv-orbit-orb__canvas" :style="{ animationDuration: breatheDuration }"></canvas>
  </div>
</template>

<style scoped>
.dv-orbit-orb {
  position: relative;
  flex: none;
  color: var(--dv-ink, #16181d);
}

/* The canvas fills the box; `color` is inherited and read by the engine for the
   dot ink. Breathe is a barely-there scale pulse (GPU, asymmetric inhale/exhale). */
.dv-orbit-orb__canvas {
  display: block;
  width: 100%;
  height: 100%;
  animation: dv-orbit-breath ease-in-out infinite;
}

@keyframes dv-orbit-breath {
  0% {
    transform: scale(0.97);
    opacity: 0.88;
  }
  42% {
    transform: scale(1.03);
    opacity: 1;
  }
  100% {
    transform: scale(0.97);
    opacity: 0.88;
  }
}

/* Thinking sweep — monochrome conic arc orbiting outside the mark */
.dv-orbit-orb__arc {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 250deg,
    currentColor 330deg,
    transparent 360deg
  );
  opacity: 0.75;
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px));
  animation: dv-orbit-spin 1.3s linear infinite;
}

/* Dim — slate mark, breathe stilled (error/paused) */
.dv-orbit-orb--dim {
  color: #94a3b8;
}

.dv-orbit-orb--dim .dv-orbit-orb__canvas {
  animation: none;
}

/* Inverse — white mark for dark or gradient backgrounds */
.dv-orbit-orb--inverse {
  color: #ffffff;
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-orb__canvas,
  .dv-orbit-orb__arc {
    animation: none;
  }
}
</style>
