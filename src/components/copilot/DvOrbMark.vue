<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import {
  createMarkRenderer,
  hexToRgb,
  ZERO_ENERGY,
  type MarkPalette,
  type MarkRenderer,
} from './dvOrbMarkRenderer'
import type { OrbState } from '@/lib/davinci-orb/types'

// Da Vinci identity mark — a small particle-circle orb (2D canvas miniature of
// the WebGL orb). Renders one static frame at rest; breathes while its host
// control is hovered/focused (Marojarvis logo treatment) or while `active`.

const props = withDefaults(
  defineProps<{
    /** CSS size in px */
    size?: number
    /** tile = --dv-grad rounded background (like the classic avatars) */
    variant?: 'bare' | 'tile'
    /** Border radius for the tile variant ('50%' circles, '10px' squircles) */
    tileRadius?: string
    /** Continuously animate (e.g. while the assistant is typing/speaking) */
    active?: boolean
    /** Breathe when the closest interactive ancestor is hovered/focused */
    hoverAnimate?: boolean
    /** Activity flavor — modulates rotation speed/brightness only */
    state?: OrbState
    /** Ink override for fixed-luminance hosts (auto = follow theme) */
    ink?: 'auto' | 'dark' | 'light'
  }>(),
  {
    size: 28,
    variant: 'bare',
    tileRadius: '50%',
    active: false,
    hoverAnimate: true,
    state: 'idle',
    ink: 'auto',
  },
)

const rootEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const hovered = ref(false)

const { mode, accentHex } = useAppTheme()
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let renderer: MarkRenderer | null = null
let rafId = 0
let running = false
let t0 = 0
let lastT = 0
let breath = 0
// Gemini-style hover spin: a rad/s impulse that decays — reads as a ~90°
// rotation surge with emphasized easing (Gmail's .DMDm3d rotate(90deg))
let spin = 0
let hoverHost: HTMLElement | null = null

const DRIVE: Record<OrbState, number> = { idle: 0.25, listening: 0.6, thinking: 0.85, speaking: 1 }
const breathTarget = computed(() => (hovered.value ? 1 : 0))
const dpr = () => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

function resolvePalette(el: HTMLElement): MarkPalette {
  const cs = getComputedStyle(el)
  const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  const dark = mode.value === 'dark'

  return {
    // vibrant neon stops — blue → violet → magenta across the disc
    c1: hexToRgb(read('--dv-ring-c1', '#2563EB')),
    c2: hexToRgb(read('--dv-ring-c2', '#7C3AED')),
    c3: hexToRgb(read('--dv-ring-c3', '#D946EF')),
    // tile sits on the pastel gradient — lift particles toward white sparkle;
    // explicit ink overrides win for fixed-luminance hosts
    whiteMix: props.ink === 'light' ? 0.55 : props.ink === 'dark' ? 0 : props.variant === 'tile' ? 0.5 : 0,
    inkGain: dark ? 1.3 : 1,
    // neon accumulation on dark surfaces (not on the pastel tile)
    additive: dark && props.variant !== 'tile',
  }
}

function drawStatic() {
  renderer?.draw(lastT, ZERO_ENERGY)
}

function loop(now: number) {
  if (!running || !renderer) return
  if (!t0) t0 = now
  const t = (now - t0) / 1000
  lastT = t
  breath += (breathTarget.value - breath) * 0.08
  spin *= 0.9
  if (spin < 0.02) spin = 0
  const drive = props.active ? DRIVE[props.state] : 0
  renderer.draw(t, { breath, drive, spin })
  // Self-terminate once the breathe + spin have decayed and nothing keeps us alive
  if (!props.active && breathTarget.value === 0 && breath < 0.005 && spin === 0) {
    breath = 0
    running = false
    drawStatic()
    return
  }
  rafId = requestAnimationFrame(loop)
}

function start() {
  if (running || reduceMotion || !renderer) return
  running = true
  rafId = requestAnimationFrame(loop)
}

function stop() {
  running = false
  cancelAnimationFrame(rafId)
}

function onHoverStart() {
  hovered.value = true
  spin = 8 // ≈90° surge once the 0.9/frame decay integrates out
  start()
}
function onHoverEnd() {
  hovered.value = false
  // loop self-terminates after the breath decays
}
function onVisibility() {
  if (document.hidden) stop()
  else if (props.active || hovered.value || breath > 0.005) start()
}

onMounted(() => {
  if (!canvasEl.value || !rootEl.value) return
  renderer = createMarkRenderer(canvasEl.value, { size: props.size, dpr: dpr() })
  renderer.setPalette(resolvePalette(rootEl.value))
  drawStatic()

  if (props.hoverAnimate) {
    hoverHost = rootEl.value.closest<HTMLElement>('a, button, [role="button"]') ?? rootEl.value
    hoverHost.addEventListener('mouseenter', onHoverStart)
    hoverHost.addEventListener('mouseleave', onHoverEnd)
    hoverHost.addEventListener('focusin', onHoverStart)
    hoverHost.addEventListener('focusout', onHoverEnd)
  }
  if (props.active) start()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  stop()
  document.removeEventListener('visibilitychange', onVisibility)
  if (hoverHost) {
    hoverHost.removeEventListener('mouseenter', onHoverStart)
    hoverHost.removeEventListener('mouseleave', onHoverEnd)
    hoverHost.removeEventListener('focusin', onHoverStart)
    hoverHost.removeEventListener('focusout', onHoverEnd)
  }
})

watch(
  () => props.active,
  (active) => {
    if (active) start()
    // inactive: loop self-terminates
  },
)
watch(
  () => props.size,
  (size) => {
    renderer?.setSize(size, dpr())
    if (rootEl.value) renderer?.setPalette(resolvePalette(rootEl.value))
    if (!running) drawStatic()
  },
)
watch(
  () => props.state,
  () => {
    if (props.active) start()
  },
)
// Theme/accent change: wait for Vuetify to swap the .v-theme--* class, then
// re-resolve the cascade (same pattern as DvOrbCanvas).
watch([mode, accentHex, () => props.variant, () => props.ink], async () => {
  await nextTick()
  requestAnimationFrame(() => {
    if (renderer && rootEl.value) {
      renderer.setPalette(resolvePalette(rootEl.value))
      if (!running) drawStatic()
    }
  })
})
</script>

<template>
  <span
    ref="rootEl"
    class="dv-orb-mark"
    :class="[`dv-orb-mark--${variant}`, { 'dv-orb-mark--hovered': hovered }]"
    :style="{ width: `${size}px`, height: `${size}px`, '--dv-orb-mark-radius': tileRadius }"
    aria-hidden="true"
  >
    <span v-if="variant === 'tile'" class="dv-orb-mark__state"></span>
    <span class="dv-orb-mark__ring"></span>
    <canvas ref="canvasEl" class="dv-orb-mark__canvas"></canvas>
  </span>
</template>

<style scoped>
.dv-orb-mark {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}

.dv-orb-mark__canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
}

.dv-orb-mark--tile {
  border-radius: var(--dv-orb-mark-radius, 50%);
  background: var(--dv-grad);
  isolation: isolate;
  /* no overflow:hidden — the Gemini ring sits OUTSIDE the tile bounds */
}

/* Gemini-style rotating gradient outline (extracted from Gmail's Ask Gemini
   button: 2px transparent border painted via the padding-box-exclude mask
   trick, conic angle 0→360° over 3s linear, fading in at .5s linear). */
@property --dv-orb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.dv-orb-mark__ring {
  position: absolute;
  inset: -3px;
  border-radius: var(--dv-orb-mark-radius, 50%);
  border: 2px solid transparent;
  background: conic-gradient(
      from var(--dv-orb-angle),
      var(--dv-ring-c1, #0891b2),
      var(--dv-ring-c2, #2563eb),
      var(--dv-accent),
      var(--dv-ring-c3, #7c3aed),
      var(--dv-ring-c1, #0891b2)
    )
    border-box;
  mask: linear-gradient(#fff 0 0) padding-box exclude, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  opacity: 0;
  transition: opacity 0.5s linear;
  pointer-events: none;
}

.dv-orb-mark--hovered .dv-orb-mark__ring {
  opacity: 1;
  animation: dv-orb-ring-spin 3s linear infinite;
}

@keyframes dv-orb-ring-spin {
  0% {
    --dv-orb-angle: 0deg;
  }
  100% {
    --dv-orb-angle: 360deg;
  }
}

/* Marojarvis state layer — gradient bloom + shimmer on host hover/focus */
.dv-orb-mark__state {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--dv-grad);
  background-size: 200% 200%;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.dv-orb-mark--hovered .dv-orb-mark__state {
  opacity: 1;
  transform: scale(1);
  animation: dv-orb-shimmer 2.6s ease infinite;
}

.dv-orb-mark--tile.dv-orb-mark--hovered {
  box-shadow: 0 6px 18px -6px color-mix(in oklch, var(--dv-accent) 55%, transparent);
}

@keyframes dv-orb-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dv-orb-mark__state {
    transform: none;
    transition: opacity 0.3s ease;
  }

  .dv-orb-mark--hovered .dv-orb-mark__state {
    animation: none;
  }

  .dv-orb-mark--hovered .dv-orb-mark__ring {
    animation: none; /* static gradient ring still fades in */
  }

  .dv-orb-mark--tile.dv-orb-mark--hovered {
    box-shadow: none;
  }
}
</style>
