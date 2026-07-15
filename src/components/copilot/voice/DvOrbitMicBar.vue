<script setup lang="ts">
withDefaults(
  defineProps<{
    micSize?: 50 | 56
    ripple?: boolean
    /** Muted gray mic with white slash (paused state) */
    muted?: boolean
    /** Right-side 40px ghost circle: keyboard toggle, cancel ✕, or hidden */
    ghost?: 'keyboard' | 'cancel' | 'none'
    micLabel?: string
  }>(),
  { micSize: 56, ripple: false, muted: false, ghost: 'keyboard', micLabel: 'Tap to talk' },
)

const emit = defineEmits<{
  mic: []
  ghost: []
}>()
</script>

<template>
  <div class="dv-orbit-micbar">
    <div class="dv-orbit-micbar__mic-wrap" :style="{ width: `${micSize}px`, height: `${micSize}px` }">
      <template v-if="ripple && !muted">
        <span class="dv-orbit-micbar__ripple dv-orbit-micbar__ripple--violet" aria-hidden="true"></span>
        <span class="dv-orbit-micbar__ripple dv-orbit-micbar__ripple--cyan" aria-hidden="true"></span>
      </template>
      <button
        type="button"
        class="dv-orbit-micbar__mic"
        :class="{ 'dv-orbit-micbar__mic--muted': muted }"
        :aria-label="micLabel"
        @click="emit('mic')"
      >
        <v-icon :size="Math.round(micSize * 0.44)" class="dv-orbit-micbar__mic-icon">mic</v-icon>
        <span v-if="muted" class="dv-orbit-micbar__slash" aria-hidden="true"></span>
      </button>
    </div>
    <button
      v-if="ghost !== 'none'"
      type="button"
      class="dv-orbit-micbar__ghost"
      :aria-label="ghost === 'keyboard' ? 'Type instead' : 'Cancel'"
      @click="emit('ghost')"
    >
      <v-icon size="17">{{ ghost === 'keyboard' ? 'keyboard' : 'x' }}</v-icon>
    </button>
  </div>
</template>

<style scoped>
.dv-orbit-micbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 28px;
  flex: none;
}

.dv-orbit-micbar__mic-wrap {
  position: relative;
  flex: none;
}

.dv-orbit-micbar__ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}

.dv-orbit-micbar__ripple--violet {
  border: 1.5px solid rgba(139, 124, 248, 0.5);
  animation: dv-orbit-ripple 2.6s ease-out infinite;
}

.dv-orbit-micbar__ripple--cyan {
  border: 1.5px solid rgba(34, 211, 238, 0.45);
  animation: dv-orbit-ripple 2.6s ease-out 1.3s infinite;
}

.dv-orbit-micbar__mic {
  position: absolute;
  inset: 0;
  border: none;
  border-radius: 50%;
  background: var(--dv-orbit-grad);
  box-shadow: var(--dv-orbit-mic-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.dv-orbit-micbar__mic--muted {
  background: linear-gradient(135deg, var(--dv-orbit-muted), var(--dv-orbit-sep));
  box-shadow: 0 8px 20px rgba(100, 116, 139, 0.25);
}

.dv-orbit-micbar__mic-icon {
  color: #ffffff;
}

.dv-orbit-micbar__slash {
  position: absolute;
  left: 18%;
  top: 48%;
  width: 64%;
  height: 2.5px;
  border-radius: 99px;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.7);
  transform: rotate(-45deg);
}

.dv-orbit-micbar__ghost {
  position: absolute;
  right: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--dv-orbit-line);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dv-orbit-mist);
  cursor: pointer;
  padding: 0;
}

.dv-orbit-micbar__ghost:hover {
  background: var(--dv-orbit-surface);
}

@media (prefers-reduced-motion: reduce) {
  .dv-orbit-micbar__ripple {
    animation: none;
    opacity: 0;
  }
}
</style>
