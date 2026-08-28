<script setup lang="ts">
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'

const { toasts, triggerAction, pause, resume } = useDaVinciToasts()
</script>

<template>
  <Teleport to="body">
    <div class="dv-toast-stack" aria-live="polite">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="dv-toast"
        :class="{ 'is-leaving': toast.leaving }"
        role="status"
        @mouseenter="pause(toast.id)"
        @mouseleave="resume(toast.id)"
        @focusin="pause(toast.id)"
        @focusout="resume(toast.id)"
      >
        <div class="dv-toast__icon">
          <v-icon size="14">check</v-icon>
        </div>
        <div class="dv-toast__body">
          <div class="dv-toast__title">{{ toast.title }}</div>
          <div v-if="toast.sub" class="dv-toast__sub">{{ toast.sub }}</div>
        </div>
        <button
          v-if="toast.action"
          type="button"
          class="dv-toast__action"
          @click="triggerAction(toast.id)"
        >
          {{ toast.action }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.dv-toast-stack {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: var(--mp-zIndex-toast);
  pointer-events: none;
}

.dv-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  /* P5.5: the branded inverted surface, not a hand-rolled one. Composing
     --ink-panel-* pairs the fill with an ink the token layer guarantees
     (tokens.json -> $contrastPairs); the previous on-surface/surface swap put
     the brand-cyan action link on a near-white slab in dark theme at ~2.5:1. */
  background: var(--ink-panel-bg);
  color: var(--ink-panel-fg);
  border-radius: var(--mp-radius-10);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  box-shadow: var(--elevation-overlay);
  min-width: 280px;
  max-width: 440px;
  animation: dvToastIn 220ms cubic-bezier(0.2, 0.7, 0.3, 1.2);
}

.dv-toast.is-leaving {
  animation: dvToastOut 180ms ease forwards;
}

@keyframes dvToastIn {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes dvToastOut {
  to {
    transform: translateY(8px);
    opacity: 0;
  }
}

.dv-toast__icon {
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.dv-toast__body {
  flex: 1;
  min-width: 0;
}

.dv-toast__title {
  font-weight: 600;
}

.dv-toast__sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--ink-panel-muted-fg);
  margin-top: 1px;
}

.dv-toast__action {
  background: transparent;
  border: none;
  color: var(--ink-panel-accent);
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease;
}

.dv-toast__action:hover {
  background: color-mix(in oklch, var(--ink-panel-fg) 14%, transparent);
}
</style>
