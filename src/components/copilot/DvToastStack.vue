<script setup lang="ts">
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'

const { toasts, triggerAction } = useDaVinciToasts()
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
      >
        <div class="dv-toast__icon">
          <v-icon size="14" color="white">check</v-icon>
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
  z-index: 10000;
  pointer-events: none;
}

.dv-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  box-shadow: var(--mp-shadow-md);
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
  opacity: 0.75;
  margin-top: 1px;
}

.dv-toast__action {
  background: transparent;
  border: none;
  color: rgb(var(--v-theme-primary));
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease;
}

.dv-toast__action:hover {
  background: color-mix(in oklch, var(--dv-on-accent) 12%, transparent);
}
</style>
