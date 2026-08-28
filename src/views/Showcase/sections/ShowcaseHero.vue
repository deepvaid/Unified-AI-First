<script setup lang="ts">
import { computed } from 'vue'
import { useAppTheme, type ThemeMode } from '@/composables/useAppTheme'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'

const { mode, setMode } = useAppTheme()
const isDark = computed(() => mode.value === 'dark')

const storybookUrl = import.meta.env.DEV ? 'http://localhost:6006' : '/storybook/'

/** Page-wide crossfade where supported; plain swap elsewhere / under reduced motion. */
function flipTo(m: ThemeMode) {
  if (m === mode.value) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!reduced && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => setMode(m))
  } else {
    setMode(m)
  }
}

interface TokenChip {
  label: string
  x: number
  y: number
  swatch?: 'primary' | 'success' | 'warning' | 'error' | 'secondary'
  mono?: boolean
  hideSm?: boolean
}

// Real values from tokens.json — the cascade is a truthful token sampler.
const CHIPS: TokenChip[] = [
  { label: 'primary', swatch: 'primary', x: 9, y: 15 },
  { label: 'success', swatch: 'success', x: 83, y: 13 },
  { label: 'warning', swatch: 'warning', x: 5, y: 47, hideSm: true },
  { label: 'error', swatch: 'error', x: 90, y: 44, hideSm: true },
  { label: 'secondary', swatch: 'secondary', x: 14, y: 80, hideSm: true },
  { label: '--mp-space-24 · 24px', mono: true, x: 21, y: 7 },
  { label: 'radius-lg · 14px', mono: true, x: 69, y: 5 },
  { label: 'Inter · 100–900', x: 40, y: 3 },
  { label: 'easing-standard', mono: true, x: 87, y: 26, hideSm: true },
  { label: 'stagger · 40ms', mono: true, x: 3, y: 30, hideSm: true },
  { label: 'shadow-md', mono: true, x: 79, y: 82, hideSm: true },
  { label: 'AA contrast · 5.2:1', x: 6, y: 64, hideSm: true },
  { label: 'tabular-nums', mono: true, x: 63, y: 89, hideSm: true },
  { label: '2 themes · 1 flip', x: 30, y: 90, hideSm: true },
]
</script>

<template>
  <section class="hero">
    <!-- Token cascade — decorative sampler of real token values -->
    <div class="hero__chips" aria-hidden="true">
      <span
        v-for="(chip, i) in CHIPS"
        :key="chip.label"
        class="hero__chip"
        :class="{ 'hero__chip--hide-sm': chip.hideSm }"
        :style="{ left: `${chip.x}%`, top: `${chip.y}%`, '--i': i }"
      >
        <span class="hero__chip-inner" :class="{ 'hero__chip-inner--mono': chip.mono }" :style="{ '--i': i }">
          <span v-if="chip.swatch" class="hero__swatch" :class="`hero__swatch--${chip.swatch}`" />
          {{ chip.label }}
        </span>
      </span>
    </div>

    <div class="hero__center">
      <div class="hero__reveal d-flex justify-center" :style="{ '--d': '0ms' }">
        <DvOrbitOrb :size="56" :inverse="isDark" />
      </div>

      <div class="mp-eyebrow hero__reveal mt-4" :style="{ '--d': '80ms' }">
        Maropost design system sandbox
      </div>

      <h1 class="mp-display-xl hero__title hero__reveal mt-3" :style="{ '--d': '160ms' }">
        One system.<br />
        <span class="hero__title-accent">Every screen.</span>
      </h1>

      <p class="hero__sub hero__reveal mt-5" :style="{ '--d': '240ms' }">
        A working Vue&nbsp;3 + Vuetify sandbox where the approved visual direction runs as a real
        product — 89 live components, 171 screens, one token source of truth.
      </p>

      <div class="hero__reveal mt-7" :style="{ '--d': '320ms' }">
        <div class="hero__flip" role="group" aria-label="Theme">
          <v-btn
            class="text-none"
            :variant="!isDark ? 'flat' : 'text'"
            :color="!isDark ? 'primary' : undefined"
            prepend-icon="sun"
            @click="flipTo('light')"
          >
            Light
          </v-btn>
          <v-btn
            class="text-none"
            :variant="isDark ? 'flat' : 'text'"
            :color="isDark ? 'primary' : undefined"
            prepend-icon="moon"
            @click="flipTo('dark')"
          >
            Dark
          </v-btn>
        </div>
        <div class="text-caption text-medium-emphasis mt-2">
          Go on — flip it. The whole system comes along.
        </div>
      </div>

      <div class="hero__ctas hero__reveal mt-8" :style="{ '--d': '400ms' }">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="text-none"
          append-icon="arrow-right"
          to="/accounts/2000290/dashboard"
        >
          Enter the sandbox
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          class="text-none"
          prepend-icon="book-open"
          :href="storybookUrl"
          target="_blank"
          rel="noopener"
        >
          Open Storybook
        </v-btn>
        <v-btn variant="text" size="large" class="text-none" prepend-icon="presentation" to="/deck">
          View the deck
        </v-btn>
      </div>
    </div>

    <div class="hero__scroll-hint" aria-hidden="true">
      <v-icon size="20" class="text-medium-emphasis">chevron-down</v-icon>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: var(--mp-space-64) var(--mp-space-24);
}

.hero__center {
  position: relative;
  max-width: 880px;
  text-align: center;
  z-index: 1;
}

/* ── Entrance for the centre column ─────────────────────────── */
.hero__reveal {
  animation: hero-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: var(--d, 0ms);
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero__title {
  font-size: clamp(
    var(--mp-display-md-fontSize),
    7.5vw,
    var(--mp-display-xl-fontSize)
  );
}

.hero__title-accent {
  color: rgb(var(--v-theme-primary));
}

.hero__sub {
  margin: 0 auto;
  max-width: 560px;
  font-size: var(--mp-fontSize-16);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ── Theme flip pill ────────────────────────────────────────── */
.hero__flip {
  display: inline-flex;
  gap: var(--mp-space-4);
  padding: var(--mp-space-4);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--mp-shadow-sm);
}

.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--mp-space-12);
}

/* ── Token cascade chips ────────────────────────────────────── */
.hero__chips {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero__chip {
  position: absolute;
  animation: chip-settle var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2 + 260ms);
}

.hero__chip:nth-child(odd) {
  --tilt: -3deg;
}

.hero__chip:nth-child(even) {
  --tilt: 2.5deg;
}

@keyframes chip-settle {
  from {
    opacity: 0;
    transform: translateY(-56px) rotate(var(--tilt, -3deg)) scale(0.92);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero__chip-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-space-4) var(--mp-space-12);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--mp-shadow-sm);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  animation: chip-float 7s ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * -700ms);
}

.hero__chip-inner--mono {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-11);
}

@keyframes chip-float {
  from {
    transform: translateY(-3px);
  }
  to {
    transform: translateY(3px);
  }
}

.hero__swatch {
  width: 10px;
  height: 10px;
  border-radius: var(--mp-radius-full);
  flex-shrink: 0;
}

.hero__swatch--primary { background: rgb(var(--v-theme-primary)); }
.hero__swatch--success { background: rgb(var(--v-theme-success)); }
.hero__swatch--warning { background: rgb(var(--v-theme-warning)); }
.hero__swatch--error { background: rgb(var(--v-theme-error)); }
.hero__swatch--secondary { background: rgb(var(--v-theme-secondary)); }

/* ── Scroll hint ────────────────────────────────────────────── */
.hero__scroll-hint {
  position: absolute;
  bottom: var(--mp-space-24);
  left: 50%;
  transform: translateX(-50%);
  animation: hint-bounce 2.2s var(--mp-motion-easing-standard) infinite;
}

@keyframes hint-bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateX(-50%) translateY(6px);
    opacity: 1;
  }
}

@media (max-width: 960px) {
  .hero__chip--hide-sm {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__reveal,
  .hero__chip,
  .hero__chip-inner,
  .hero__scroll-hint {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .hero__scroll-hint {
    transform: translateX(-50%);
  }
}
</style>
