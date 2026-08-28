<script setup lang="ts">
import { useToast, type Toast, type ToastType } from '@/composables/useToast'

// WP-C1 (D2 exception to the "no new wrapper components" rule) — the one shared
// toast host for the app, mounted once in App.vue. Renders the singleton stack
// from useToast(). Separate from DvToastStack (the Da Vinci copilot's own toast
// layer, driven by useDaVinciToasts) — that pair is intentionally left as-is by
// this work package and is out of scope here.

const { toasts, dismiss, pause, resume } = useToast()

const ICON_BY_TYPE: Record<ToastType, string> = {
  success: 'check',
  error: 'triangle-alert',
  info: 'info',
}

function handleAction(toast: Toast) {
  toast.action?.onClick()
  dismiss(toast.id)
}
</script>

<template>
  <Teleport to="body">
    <!--
      This container is always mounted — only the toast cards inside it come and
      go. A screen reader needs the aria-live region itself to persist in the DOM
      for updates to reliably announce (see docs/ui-system-audit/03-accessibility-audit.md
      Section 3, item 1).
    -->
    <div class="mp-toast-stack" aria-live="polite">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="mp-toast"
        :class="{ 'is-leaving': toast.leaving }"
        :role="toast.type === 'error' ? 'alert' : 'status'"
        @mouseenter="pause(toast.id)"
        @mouseleave="resume(toast.id)"
        @focusin="pause(toast.id)"
        @focusout="resume(toast.id)"
      >
        <v-card flat border rounded="lg" class="mp-toast__card pa-3 d-flex ga-3">
          <v-icon :color="toast.type" size="18" class="mp-toast__icon">
            {{ ICON_BY_TYPE[toast.type] }}
          </v-icon>
          <div class="mp-toast__body">
            <div v-if="toast.title" class="mp-toast__title">{{ toast.title }}</div>
            <div class="mp-toast__message">{{ toast.message }}</div>
            <v-btn
              v-if="toast.action"
              variant="text"
              size="small"
              color="primary"
              class="text-none px-0 mp-toast__action"
              @click="handleAction(toast)"
            >
              {{ toast.action.label }}
            </v-btn>
          </div>
          <v-btn
            icon="x"
            variant="text"
            size="small"
            density="comfortable"
            aria-label="Dismiss notification"
            class="mp-toast__close"
            @click="dismiss(toast.id)"
          />
        </v-card>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mp-toast-stack {
  position: fixed;
  right: var(--mp-space-24);
  bottom: var(--mp-space-24);
  z-index: var(--mp-zIndex-toast);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  width: 320px;
  max-width: calc(100vw - (var(--mp-space-24) * 2));
  pointer-events: none;
}

.mp-toast {
  pointer-events: auto;
  animation: mp-toast-in 200ms ease;
}

.mp-toast.is-leaving {
  animation: mp-toast-out 200ms ease forwards;
}

/* prefers-reduced-motion is handled globally (src/styles/global.scss, loaded via
   src/styles/app-styles.ts) — it zeroes animation-duration app-wide, so no local
   reduced-motion check is needed here. */
@keyframes mp-toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mp-toast-out {
  to {
    opacity: 0;
    transform: translateY(4px);
  }
}

.mp-toast__card {
  align-items: flex-start;
  background: rgb(var(--v-theme-surface));
}

.mp-toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.mp-toast__body {
  flex: 1 1 auto;
  min-width: 0;
}

.mp-toast__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(var(--v-theme-on-surface));
}

.mp-toast__message {
  font-size: 13px;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: break-word;
}

.mp-toast__action {
  display: block;
  min-width: 0;
  height: auto;
  margin-top: var(--mp-space-4);
}

.mp-toast__close {
  flex-shrink: 0;
  margin: -4px -4px 0 0;
}
</style>
