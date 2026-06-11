<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useElementSize } from '@/composables/useElementSize'
import { useAppTheme } from '@/composables/useAppTheme'
// Type-only — the engine itself (and three.js) loads via dynamic import below
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
  let createOrb: typeof import('@/lib/davinci-orb/orb').createOrb
  try {
    // Import orb.ts directly (not the barrel) so the heavy chunk is named orb-*.js
    ;({ createOrb } = await import('@/lib/davinci-orb/orb'))
  } catch {
    failed.value = 'load-failed'
    emit('fallback', failed.value)
    return
  }
  if (!canvasEl.value || !rootEl.value) return
  try {
    handle = createOrb(canvasEl.value, {
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
    emit('ready')
  } catch {
    failed.value = 'webgl-unavailable'
    emit('fallback', failed.value)
  }
})

onBeforeUnmount(() => {
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
  <div ref="rootEl" class="dv-orb-stage" aria-hidden="true">
    <canvas v-show="!failed" ref="canvasEl" class="dv-orb-stage__canvas"></canvas>
    <div v-if="failed" class="dv-orb-stage__fallback"></div>
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
}

/* Static degradation when WebGL is unavailable or the chunk failed to load */
.dv-orb-stage__fallback {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: var(--dv-grad);
  filter: blur(28px);
  opacity: 0.4;
  animation: dv-orb-fallback-pulse 5.5s ease-in-out infinite;
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
