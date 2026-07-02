<script lang="ts">
import type { DvOrbEngineModule } from '@/lib/davinci-orb/types'

// Module scope: start downloading three.js (~188KB gz lazy chunk) + the shared engine
// (public/dv-orb/dv-orb-engine.js, @vite-ignore — see onMounted note) the moment this
// chunk evaluates — in parallel with Vue mount/render/greeting — instead of waiting for
// onMounted. Memoized so every orb instance (experience backdrop, drawer surface) shares
// one in-flight load. Errors are surfaced at the await site (onMounted try/catch).
let enginePromise: Promise<[typeof import('three'), DvOrbEngineModule]> | null = null
function loadEngine(): Promise<[typeof import('three'), DvOrbEngineModule]> {
  if (!enginePromise) {
    // Full-origin URL on purpose: Vite's dev-time __vite__injectQuery rewrites
    // root-relative dynamic imports to "?import", which public/ files reject.
    const engineUrl = new URL(import.meta.env.BASE_URL + 'dv-orb/dv-orb-engine.js', window.location.origin).href
    enginePromise = Promise.all([
      import('three'),
      import(/* @vite-ignore */ engineUrl) as Promise<DvOrbEngineModule>,
    ])
  }
  return enginePromise
}
if (typeof window !== 'undefined') {
  loadEngine().catch(() => {}) // warm the cache; rejection is handled where it's awaited
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useElementSize } from '@/composables/useElementSize'
import { useAppTheme } from '@/composables/useAppTheme'
// Type-only — the engine itself (and three.js) loads via loadEngine() above
import type { OrbAudioFrame, OrbColorOptions, OrbHandle, OrbState } from '@/lib/davinci-orb/types'

const props = withDefaults(
  defineProps<{
    state?: OrbState
    /** Pull-based audio source (e.g. useDaVinciVoice().getVoiceFrame) */
    audioSource?: (() => OrbAudioFrame | null) | null
    paused?: boolean
    maxPixelRatio?: number
    opacity?: number
  }>(),
  { state: 'idle', audioSource: null, paused: false, maxPixelRatio: 2, opacity: 2.7 },
)

const emit = defineEmits<{
  ready: []
  fallback: [reason: 'webgl-unavailable' | 'load-failed']
}>()

const rootEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const failed = ref<'webgl-unavailable' | 'load-failed' | null>(null)
// WebGL engine up and rendering — flips the CSS placeholder → canvas cross-fade.
const ready = ref(false)
// Placeholder stays mounted through the fade, then unmounts (see FADE_MS).
const fallbackGone = ref(false)
const FADE_MS = 700
let fadeTimer: ReturnType<typeof setTimeout> | null = null
let handle: OrbHandle | null = null

const { mode, accentHex } = useAppTheme()
const { size } = useElementSize(rootEl)

// Colors must be resolved on an element INSIDE .v-application — the dark-theme
// --accent override lives on .v-theme--maropostDark, not :root.
function resolveColors(el: HTMLElement): OrbColorOptions {
  const cs = getComputedStyle(el)
  const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    accent: read('--dv-accent', accentHex.value || '#0092D4'),
    glowA: read('--dv-orb-c1', '#5EEAD4'),
    glowB: read('--dv-orb-c2', '#93C5FD'),
    glowC: read('--dv-orb-c3', '#A78BFA'),
  }
}

onMounted(async () => {
  let THREE: typeof import('three')
  let engine: DvOrbEngineModule
  try {
    // The SHARED engine (also used by the static landing/login pages) lives in
    // public/ — a real runtime URL, invisible to the bundler (@vite-ignore).
    // three.js stays bundled (lazy chunk) and is dependency-injected into it.
    // Download already started at module evaluation (loadEngine above); this just
    // awaits the shared promise.
    ;[THREE, engine] = await loadEngine()
  } catch {
    failed.value = 'load-failed'
    emit('fallback', failed.value)
    return
  }
  if (!canvasEl.value || !rootEl.value) return
  try {
    handle = engine.createDvOrb(canvasEl.value, {
      THREE,
      colors: resolveColors(rootEl.value),
      dark: mode.value === 'dark',
      maxPixelRatio: props.maxPixelRatio,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      getFrame: props.audioSource,
      opacity: props.opacity,
      onContextLost: () => {
        failed.value = 'webgl-unavailable'
        emit('fallback', failed.value)
      },
    })
    handle.setState(props.state)
    handle.setPaused(props.paused)
    ready.value = true // cross-fade: CSS placeholder → live canvas
    fadeTimer = setTimeout(() => {
      fallbackGone.value = true // unmount the placeholder once the fade completes
    }, FADE_MS)
    emit('ready')
  } catch {
    failed.value = 'webgl-unavailable'
    emit('fallback', failed.value)
  }
})

onBeforeUnmount(() => {
  if (fadeTimer) clearTimeout(fadeTimer)
  handle?.dispose()
  handle = null
})

watch(
  () => props.state,
  (s) => handle?.setState(s),
)
watch(
  () => props.paused,
  (p) => handle?.setPaused(p),
)
watch(
  () => props.audioSource,
  (fn) => handle?.setFrameSource(fn ?? null),
)
watch(size, () => handle?.resize())

// Theme/accent changes: wait for Vuetify to swap the .v-theme--* class, then
// re-resolve the cascade and feed the new palette into the shader uniforms.
watch([mode, accentHex], async () => {
  await nextTick()
  requestAnimationFrame(() => {
    if (handle && rootEl.value) handle.setColors(resolveColors(rootEl.value), mode.value === 'dark')
  })
})
</script>

<template>
  <div ref="rootEl" class="dv-orb-stage" :class="{ 'is-ready': ready && !failed }" aria-hidden="true">
    <canvas v-show="!failed" ref="canvasEl" class="dv-orb-stage__canvas"></canvas>
    <!-- Instant CSS orb: visible from first paint while the WebGL engine loads,
         cross-fades out when it's ready; stays as the static fallback on failure. -->
    <div v-if="failed || !fallbackGone" class="dv-orb-stage__fallback"></div>
  </div>
</template>

<style scoped>
.dv-orb-stage {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.dv-orb-stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* Hidden until the engine renders; cross-fades in over the CSS placeholder */
  opacity: 0;
  transition: opacity 0.6s ease;
}

.dv-orb-stage.is-ready .dv-orb-stage__canvas {
  opacity: 1;
}

/* Instant placeholder while the WebGL engine loads; static degradation on failure */
.dv-orb-stage__fallback {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: var(--dv-grad);
  filter: blur(28px);
  opacity: 0.4;
  animation: dv-orb-fallback-pulse 5.5s ease-in-out infinite;
  transition: opacity 0.6s ease;
}

.dv-orb-stage.is-ready .dv-orb-stage__fallback {
  animation: none;
  opacity: 0;
}

@keyframes dv-orb-fallback-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.34;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.46;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dv-orb-stage__fallback {
    animation: none;
  }
}
</style>
