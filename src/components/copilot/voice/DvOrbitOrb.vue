<script setup lang="ts">
import { computed } from 'vue'

// CSS twin-ring orb — direct port of the Orbit handoff primitive.
// Layers (outside → in): optional conic arc sweep, outer dashed ring (CW),
// inner dashed ring (CCW), breathing radial glow, white core.
const props = withDefaults(
  defineProps<{
    size: number
    /** Ring-speed multiplier: listening 2.4 · thinking 1.6 · strip 1.4 · keyboard/error 0.6 · paused 0.25 */
    speed?: number
    /** Gray rings, no glow breathe (error/paused) */
    dim?: boolean
    /** Conic violet→cyan arc sweep outside the orb (thinking) */
    arc?: boolean
    /** White rings/glow for dark or gradient backgrounds */
    inverse?: boolean
    /** Dotted ripple rings diffusing out of the orb (ambient identity pulse) */
    pulse?: boolean
  }>(),
  { speed: 1, dim: false, arc: false, inverse: false, pulse: false },
)

const ring1Duration = computed(() => `${16 / props.speed}s`)
const ring2Duration = computed(() => `${11 / props.speed}s`)
const breatheDuration = computed(() => `${3 / Math.min(props.speed, 1.5)}s`)
</script>

<template>
  <div
    class="dv-orbit-orb"
    :class="{ 'dv-orbit-orb--dim': dim, 'dv-orbit-orb--inverse': inverse }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <div v-if="arc" class="dv-orbit-orb__arc"></div>
    <template v-if="pulse">
      <div class="dv-orbit-orb__pulse dv-orbit-orb__pulse--blue"></div>
      <div class="dv-orbit-orb__pulse dv-orbit-orb__pulse--violet"></div>
    </template>
    <div class="dv-orbit-orb__ring dv-orbit-orb__ring--outer" :style="{ animationDuration: ring1Duration }"></div>
    <div
      class="dv-orbit-orb__ring dv-orbit-orb__ring--inner"
      :style="{ inset: `${size * 0.1}px`, animationDuration: ring2Duration }"
    ></div>
    <div class="dv-orbit-orb__glow" :style="{ inset: `${size * 0.21}px`, animationDuration: breatheDuration }"></div>
    <div class="dv-orbit-orb__core" :style="{ inset: `${size * 0.3}px` }"></div>
  </div>
</template>

<style scoped>
.dv-orbit-orb {
  position: relative;
  flex: none;
}

/* Handoff one-off rgba stops — keep literal, never color-mix */
.dv-orbit-orb__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.dv-orbit-orb__ring--outer {
  border: 1.5px dashed rgba(27, 159, 224, 0.55);
  animation: dv-orbit-spin linear infinite;
}

.dv-orbit-orb__ring--inner {
  border: 1.5px dashed rgba(167, 139, 250, 0.5);
  animation: dv-orbit-spin-rev linear infinite;
}

.dv-orbit-orb__glow {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 32%,
    rgba(139, 124, 248, 0.28),
    rgba(34, 211, 238, 0.16) 55%,
    rgba(255, 255, 255, 0) 80%
  );
  animation: dv-orbit-breathe ease-in-out infinite;
}

.dv-orbit-orb__core {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: inset 0 0 0 1.5px rgba(20, 48, 76, 0.7);
}

.dv-orbit-orb__arc {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(139, 124, 248, 0) 0deg,
    rgba(139, 124, 248, 0) 250deg,
    rgba(139, 124, 248, 0.9) 320deg,
    rgba(34, 211, 238, 0.95) 352deg,
    rgba(139, 124, 248, 0) 360deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 3px));
  animation: dv-orbit-spin 1.3s linear infinite;
}

.dv-orbit-orb--dim .dv-orbit-orb__ring--outer {
  border-color: rgba(148, 163, 184, 0.55);
}

.dv-orbit-orb--dim .dv-orbit-orb__ring--inner {
  border-color: rgba(148, 163, 184, 0.4);
}

.dv-orbit-orb--dim .dv-orbit-orb__glow {
  background: radial-gradient(
    circle at 38% 32%,
    rgba(148, 163, 184, 0.2),
    rgba(148, 163, 184, 0.08) 55%,
    rgba(255, 255, 255, 0) 80%
  );
  animation: none;
}

.dv-orbit-orb--dim .dv-orbit-orb__core {
  box-shadow: inset 0 0 0 1.5px rgba(100, 116, 139, 0.55);
}

/* Ambient pulse — dotted rings diffusing out of the orb (mic-ripple sibling) */
.dv-orbit-orb__pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}

.dv-orbit-orb__pulse--blue {
  border: 1.5px dashed rgba(27, 159, 224, 0.5);
  animation: dv-orbit-ripple 3s ease-out infinite;
}

.dv-orbit-orb__pulse--violet {
  border: 1.5px dashed rgba(167, 139, 250, 0.45);
  animation: dv-orbit-ripple 3s ease-out 1.5s infinite;
}

/* Inverse — white rings/glow for dark or gradient backgrounds */
.dv-orbit-orb--inverse .dv-orbit-orb__ring--outer {
  border-color: rgba(255, 255, 255, 0.85);
}

.dv-orbit-orb--inverse .dv-orbit-orb__ring--inner {
  border-color: rgba(255, 255, 255, 0.55);
}

.dv-orbit-orb--inverse .dv-orbit-orb__glow {
  background: radial-gradient(
    circle at 38% 32%,
    rgba(255, 255, 255, 0.35),
    rgba(255, 255, 255, 0.15) 55%,
    rgba(255, 255, 255, 0) 80%
  );
}

.dv-orbit-orb--inverse .dv-orbit-orb__core {
  box-shadow: inset 0 0 0 1.5px rgba(20, 48, 76, 0.55);
}

.dv-orbit-orb--inverse .dv-orbit-orb__pulse--blue {
  border-color: rgba(255, 255, 255, 0.6);
}

.dv-orbit-orb--inverse .dv-orbit-orb__pulse--violet {
  border-color: rgba(255, 255, 255, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-orb__ring,
  .dv-orbit-orb__glow,
  .dv-orbit-orb__arc {
    animation: none;
  }

  .dv-orbit-orb__pulse {
    animation: none;
    opacity: 0;
  }
}
</style>
