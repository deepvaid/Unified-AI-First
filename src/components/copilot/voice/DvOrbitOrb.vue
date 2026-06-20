<script setup lang="ts">
import { computed } from 'vue'

// "Glow" particle-orb identity mark — exact reproduction of the reference Glow
// (logo_compare_nav.html / the landing nav + FAB): a dense, evenly-spaced halo
// RING + a faint outward dust SCATTER, one slow coherent spin (~20s). Same PRNG
// + seeds + radii + opacities as the landing → identical particle field, just in
// the 100 viewBox here. Monochrome (currentColor). Pure SVG + CSS transforms.
const props = withDefaults(
  defineProps<{
    size: number
    /** Spin-speed multiplier: listening 2.4 · thinking 1.6 · strip 1.4 · keyboard/error 0.6 · paused 0.25 */
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

const spinDuration = computed(() => `${40 / props.speed}s`)
const shimmerSpin = computed(() => `${28 / props.speed}s`) // glints drift vs the 40s ring
const breatheDuration = computed(() => `${7 / Math.min(props.speed, 1.5)}s`)

// All in-app marks render 20% larger than their passed `size` (brand bump to
// match the landing). renderSize drives the element box, tier, and dot radii.
const renderSize = computed(() => props.size * 1.2)

// ── orb geometry (module-stable: identical mark on every surface) ────────────
const TAU = Math.PI * 2
const CENTER = 50 // viewBox 0..100 (reference 512-space radii ×100/512)

interface Pt {
  x: number
  y: number
  o: number
}
interface ShPt {
  x: number
  y: number
  c: number // brand colour stop 1|2|3
  dur: number
  delay: number
}

// Reference Glow PRNG — fract(sin(s·127.1+311.7)·43758.5453). Seeded by particle
// index so the field is deterministic and identical to the landing.
function rng(s: number) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Counts: the reference draws every 2nd of 1300 halo (=650) + 364 scatter, plus a
// sparse spectral shimmer. Tiny repeated marks (chat avatars, pill) step sparser
// for DOM perf. `step` keeps full-ring coverage (angle derives from index).
type TierKey = 's' | 'l'
const STEPS: Record<TierKey, { hStep: number; sStep: number; sh: number }> = {
  s: { hStep: 3, sStep: 2, sh: 32 }, // ≤40px → ~434 halo + 182 scatter + 32 glints
  l: { hStep: 2, sStep: 1, sh: 72 }, // ≥41px → 650 halo + 364 scatter + 72 glints
}
function tierKey(size: number): TierKey {
  return size <= 40 ? 's' : 'l'
}

function buildOrb(key: TierKey): { halo: Pt[]; scatter: Pt[]; shimmer: ShPt[] } {
  const { hStep, sStep, sh } = STEPS[key]
  const halo: Pt[] = []
  const scatter: Pt[] = []
  const shimmer: ShPt[] = []
  // halo ring — gR 126, gBW 43.52 → ×100/512 = r 24.6 + 8.5
  for (let i = 0; i < 1300; i += hStep) {
    const a = (i / 1300) * TAU + (rng(i * 5 + 10) - 0.5) * 0.18
    const r = 24.6 + rng(i * 5 + 11) * 8.5
    // radial fade — inner edge a touch lighter (×0.55) → full at the outer rim
    const t = (r - 24.6) / 8.5
    const o = (0.16 + rng(i * 5 + 12) * 0.4) * (0.55 + 0.45 * t)
    halo.push({ x: +(CENTER + Math.cos(a) * r).toFixed(2), y: +(CENTER + Math.sin(a) * r).toFixed(2), o: +o.toFixed(3) })
  }
  // scatter — gSS 178.74 → gSM 253.95 → ×100/512 = r 34.91 + 14.69
  for (let j = 0; j < 364; j += sStep) {
    const a = (j / 364) * TAU + (rng(j * 3 + 99) - 0.5) * 0.6
    const r = 34.91 + rng(j * 7 + 51) * 14.69
    const o = (0.08 + rng(j * 3 + 20) * 0.14) * 0.6
    scatter.push({ x: +(CENTER + Math.cos(a) * r).toFixed(2), y: +(CENTER + Math.sin(a) * r).toFixed(2), o: +o.toFixed(3) })
  }
  // shimmer — sparse spectral glints on the ring band; each twinkles on its own
  // phase, the group drifts at a different speed (CSS) for a traveling sparkle
  for (let k = 0; k < sh; k++) {
    const a = (k / sh) * TAU + (rng(k * 9 + 7) - 0.5) * 0.5
    const r = 24.6 + rng(k * 9 + 8) * 8.5
    shimmer.push({
      x: +(CENTER + Math.cos(a) * r).toFixed(2),
      y: +(CENTER + Math.sin(a) * r).toFixed(2),
      c: 1 + (k % 3),
      dur: +(2.4 + rng(k * 9 + 9) * 2.2).toFixed(2),
      delay: +(-rng(k * 9 + 10) * 4).toFixed(2),
    })
  }
  return { halo, scatter, shimmer }
}

const orbCache = new Map<TierKey, { halo: Pt[]; scatter: Pt[]; shimmer: ShPt[] }>()
function orbFor(size: number) {
  const key = tierKey(size)
  let g = orbCache.get(key)
  if (!g) {
    g = buildOrb(key)
    orbCache.set(key, g)
  }
  return g
}

const orb = computed(() => orbFor(renderSize.value))

// Constant on-screen dot size (the reference clamps dots to a fine px) → viewBox
// radius scales inversely with the rendered size. Halo finest, shimmer a touch larger.
const haloR = computed(() => +Math.max(0.12, Math.min(8, (0.46 * 100) / renderSize.value)).toFixed(3))
const scatterR = computed(() => +Math.max(0.12, Math.min(10, (0.6 * 100) / renderSize.value)).toFixed(3))
const shimmerR = computed(() => +Math.max(0.15, Math.min(9, (0.5 * 100) / renderSize.value)).toFixed(3))
</script>

<template>
  <div
    class="dv-orbit-orb"
    :class="{ 'dv-orbit-orb--dim': dim, 'dv-orbit-orb--inverse': inverse }"
    :style="{ width: `${renderSize}px`, height: `${renderSize}px` }"
    aria-hidden="true"
  >
    <div v-if="arc" class="dv-orbit-orb__arc"></div>
    <svg class="dv-orbit-orb__svg" viewBox="0 0 100 100" :style="{ animationDuration: breatheDuration }">
      <!-- one coherent rotating field; class is a contract for AppBar hover-pause -->
      <g class="dv-orbit-orb__ring" :style="{ animationDuration: spinDuration }">
        <circle v-for="(p, i) in orb.halo" :key="`h${i}`" :cx="p.x" :cy="p.y" :r="haloR" :fill-opacity="p.o" />
        <circle v-for="(p, i) in orb.scatter" :key="`s${i}`" :cx="p.x" :cy="p.y" :r="scatterR" :fill-opacity="p.o" />
      </g>
      <!-- spectral shimmer: glints drift on their own spin + twinkle per-dot -->
      <g class="dv-orbit-orb__ring dv-orbit-orb__shimmer" :style="{ animationDuration: shimmerSpin }">
        <circle
          v-for="(p, i) in orb.shimmer"
          :key="`sh${i}`"
          :cx="p.x"
          :cy="p.y"
          :r="shimmerR"
          :class="`dv-orbit-orb__sh--${p.c}`"
          :style="{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }"
        />
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
  animation: dv-orbit-breath ease-in-out infinite;
}

.dv-orbit-orb__svg circle {
  fill: currentColor;
}

/* Single coherent rotating field (CCW, ~20s). Class name is a contract: AppBar's
   assistant pill pauses/runs this via :deep(.dv-orbit-orb__ring). dv-orbit-spin-rev
   is the shared global keyframe (src/styles/dv-orbit.css). */
.dv-orbit-orb__ring {
  transform-origin: 50% 50%;
  transform-box: view-box;
  animation: dv-orbit-spin-rev linear infinite;
}

/* Spectral shimmer — sparse teal/blue/violet glints (matches the landing), each
   twinkling on its own phase; the group drifts at 14s (vs the 20s ring). Selectors
   outrank `.dv-orbit-orb__svg circle { fill: currentColor }`. */
.dv-orbit-orb__shimmer circle {
  animation-name: dv-orbit-twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.dv-orbit-orb__shimmer .dv-orbit-orb__sh--1 {
  fill: #5eead4;
}
.dv-orbit-orb__shimmer .dv-orbit-orb__sh--2 {
  fill: #93c5fd;
}
.dv-orbit-orb__shimmer .dv-orbit-orb__sh--3 {
  fill: #a78bfa;
}
@keyframes dv-orbit-twinkle {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

/* Subtle breathing — barely-there scale pulse (asymmetric inhale/exhale). Scoped
   so it doesn't touch the shared dv-orbit-breathe used elsewhere. */
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

.dv-orbit-orb--dim .dv-orbit-orb__svg {
  animation: none;
}

/* Dim stays quiet — no spectral shimmer on error/paused */
.dv-orbit-orb--dim .dv-orbit-orb__shimmer {
  display: none;
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
  .dv-orbit-orb__shimmer circle {
    animation: none !important;
  }
}
</style>
