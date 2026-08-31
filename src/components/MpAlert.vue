<script setup lang="ts">
import { computed, useSlots } from 'vue'

export type MpAlertTone = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    /** Feedback severity — drives tint, default icon, role and aria-live. */
    tone?: MpAlertTone
    /** Optional bold line above the body. */
    title?: string
    /**
     * Live-region politeness. Defaults by tone: info/success → 'polite',
     * warning/error → 'assertive'. Pass 'polite' explicitly for a warning that
     * re-renders often (e.g. a live count), 'off' for static page furniture.
     */
    live?: 'off' | 'polite' | 'assertive'
    /** Renders a dismiss button; visibility stays consumer-owned (v-if + @dismiss). */
    dismissible?: boolean
    /** Lucide icon override; `false` hides the icon. Defaults per tone. */
    icon?: string | false
  }>(),
  { tone: 'info', dismissible: false }
)

const emit = defineEmits<{ dismiss: [] }>()

const slots = useSlots()
const hasActions = computed(() => Boolean(slots.actions))

// Severity icon vocabulary (shared app-wide).
const TONE_ICONS: Record<MpAlertTone, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  error: 'circle-alert',
}

const TONE_LABELS: Record<MpAlertTone, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

const resolvedIcon = computed(() => (props.icon === false ? null : (props.icon ?? TONE_ICONS[props.tone])))
const role = computed(() => (props.tone === 'warning' || props.tone === 'error' ? 'alert' : 'status'))
const ariaLive = computed(() => props.live ?? (props.tone === 'warning' || props.tone === 'error' ? 'assertive' : 'polite'))
</script>

<template>
  <div
    class="mp-alert"
    :class="`mp-alert--${props.tone}`"
    :role="role"
    :aria-live="ariaLive === 'off' ? undefined : ariaLive"
  >
    <v-icon v-if="resolvedIcon" size="18" class="mp-alert__icon" aria-hidden="true">{{ resolvedIcon }}</v-icon>
    <div class="mp-alert__body">
      <span class="d-sr-only">{{ TONE_LABELS[props.tone] }}: </span>
      <div v-if="props.title" class="mp-alert__title">{{ props.title }}</div>
      <div class="mp-alert__message"><slot /></div>
      <div v-if="hasActions" class="mp-alert__actions">
        <slot name="actions" />
      </div>
    </div>
    <button
      v-if="props.dismissible"
      type="button"
      class="mp-alert__dismiss"
      aria-label="Dismiss"
      @click="emit('dismiss')"
    >
      <v-icon size="16">x</v-icon>
    </button>
  </div>
</template>

<style scoped>
/* Borderless soft fill on the semantic container pairs — the fill bounds an
   in-page block, so no border (the .28-alpha hairline stays MpBanner's edge-
   strip signature). Every value is a primitive the system already carries —
   deliberately no component.alert.* token group. */
.mp-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-10);
  padding: var(--mp-space-12) var(--mp-space-16);
  border-radius: var(--mp-radius-12);
  font-size: var(--mp-fontSize-14);
  line-height: 1.5;
}

/* The pairing rule: a painted surface declares its foreground. Icon, title and
   body all inherit the tone ink via currentColor. */
.mp-alert--info {
  background: var(--accent-container);
  color: var(--accent-on-container);
}

.mp-alert--success {
  background: var(--pos-soft);
  color: var(--pos-ink);
}

.mp-alert--warning {
  background: var(--warn-soft);
  color: var(--warn-ink);
}

.mp-alert--error {
  background: var(--neg-soft);
  color: var(--neg-ink);
}

.mp-alert__icon {
  flex-shrink: 0;
  /* Optical centre against the 14px/1.5 first text line. */
  margin-top: var(--mp-space-2);
}

.mp-alert__body {
  flex: 1 1 auto;
  min-width: 0;
}

.mp-alert__title {
  font-weight: var(--mp-fontWeight-semibold);
}

.mp-alert__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-8);
}

.mp-alert__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin: calc(-1 * var(--mp-space-4)) calc(-1 * var(--mp-space-4)) 0 0;
  border: 0;
  border-radius: var(--mp-radius-full);
  background: transparent;
  color: currentColor;
  opacity: 0.7;
  appearance: none;
  cursor: pointer;
  transition: opacity 120ms ease, background 120ms ease;
}

.mp-alert__dismiss:hover,
.mp-alert__dismiss:focus-visible {
  opacity: 1;
  background: color-mix(in srgb, currentColor 10%, transparent);
}
</style>
