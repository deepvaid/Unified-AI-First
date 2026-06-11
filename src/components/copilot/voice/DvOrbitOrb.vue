<script setup lang="ts">
import { computed } from 'vue'

// Halftone dot-spiral identity mark — concentric dot rings whose sizes form a
// swirling lobe (monochrome, currentColor). Alternating rings live in two
// counter-rotating groups so the lobes slide against each other (alive at
// rest, urgent when fast). Layers (outside → in): optional conic arc sweep,
// the two dot-ring groups, whole-mark breathing. No ripple/pulse — the mark
// stays contained (the experience-header look, used everywhere).
const props = withDefaults(
  defineProps<{
    size: number
    /** Ring-speed multiplier: listening 2.4 · thinking 1.6 · strip 1.4 · keyboard/error 0.6 · paused 0.25 */
    speed?: number
    /** Slate mark, no breathe (error/paused) */
    dim?: boolean
    /** Monochrome conic arc sweep outside the orb (thinking) */
    arc?: boolean
    /** White mark for dark or gradient backgrounds */
    inverse?: boolean
  }>(),
  { speed: 1, dim: false, arc: false, inverse: false },
)

const ring1Duration = computed(() => `${16 / props.speed}s`)
const ring2Duration = computed(() => `${11 / props.speed}s`)
const breatheDuration = computed(() => `${3 / Math.min(props.speed, 1.5)}s`)

// ── halftone geometry (module-stable: same mark on every surface) ────────────
interface Dot {
  x: number
  y: number
  r: number
  o: number
}

const TAU = Math.PI * 2

function buildDots() {
  const a: Dot[] = [] // even rings → CW group
  const b: Dot[] = [] // odd rings → CCW group
  for (let ri = 0; ri < 7; ri++) {
    const R = 16 + ri * 5 // ring radii 16..46 in the 100×100 viewBox
    const n = Math.round((TAU * R) / 8) // ~8-unit dot spacing per ring
    const base = 2.9 * (1 - (0.35 * ri) / 6) // outer rings taper smaller
    const out = ri % 2 ? b : a
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU
      // spiral wave: lobe sweeps with angle, lags with radius → swirl arm
      let w = 0.5 + 0.5 * Math.cos(ang + R * 0.16)
      w = Math.pow(w, 1.8)
      // deterministic per-dot jitter keeps the grid from feeling mechanical
      const j = 0.94 + 0.12 * Math.abs(Math.sin((ri * 131 + i) * 12.9898))
      out.push({
        x: +(50 + Math.cos(ang) * R).toFixed(2),
        y: +(50 + Math.sin(ang) * R).toFixed(2),
        // high floors keep the mark strong and legible at 20–28px
        r: +Math.min(base * (0.42 + 0.95 * w) * j, 3.6).toFixed(2),
        o: +(0.7 + 0.3 * w).toFixed(2),
      })
    }
  }
  return { a, b }
}

const DOTS = buildDots()
</script>

<template>
  <div
    class="dv-orbit-orb"
    :class="{ 'dv-orbit-orb--dim': dim, 'dv-orbit-orb--inverse': inverse }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <div v-if="arc" class="dv-orbit-orb__arc"></div>
    <svg class="dv-orbit-orb__svg" viewBox="0 0 100 100" :style="{ animationDuration: breatheDuration }">
      <g class="dv-orbit-orb__ring dv-orbit-orb__ring--outer" :style="{ animationDuration: ring1Duration }">
        <circle v-for="(d, i) in DOTS.a" :key="`a${i}`" :cx="d.x" :cy="d.y" :r="d.r" :fill-opacity="d.o" />
      </g>
      <g class="dv-orbit-orb__ring dv-orbit-orb__ring--inner" :style="{ animationDuration: ring2Duration }">
        <circle v-for="(d, i) in DOTS.b" :key="`b${i}`" :cx="d.x" :cy="d.y" :r="d.r" :fill-opacity="d.o" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.dv-orbit-orb {
  position: relative;
  flex: none;
  color: var(--dv-ink, #16181d);
}

.dv-orbit-orb__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  animation: dv-orbit-breathe ease-in-out infinite;
}

.dv-orbit-orb__svg circle {
  fill: currentColor;
}

/* The two counter-rotating halftone ring groups. Class name is a contract:
   AppBar's assistant pill pauses/runs these via :deep(.dv-orbit-orb__ring). */
.dv-orbit-orb__ring {
  transform-origin: 50% 50%;
  transform-box: view-box;
}

.dv-orbit-orb__ring--outer {
  animation: dv-orbit-spin linear infinite;
}

.dv-orbit-orb__ring--inner {
  animation: dv-orbit-spin-rev linear infinite;
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

/* Dim — slate mark, breathe stilled (rings keep their slow spin via speed) */
.dv-orbit-orb--dim {
  color: #94a3b8;
}

.dv-orbit-orb--dim .dv-orbit-orb__svg {
  animation: none;
}

/* Inverse — white mark for dark or gradient backgrounds */
.dv-orbit-orb--inverse {
  color: #ffffff;
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-orb__svg,
  .dv-orbit-orb__ring,
  .dv-orbit-orb__arc {
    animation: none;
  }
}
</style>
