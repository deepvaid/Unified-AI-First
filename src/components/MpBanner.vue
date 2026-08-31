<script setup lang="ts">
import { computed } from 'vue'

export type MpBannerTone = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    /** Feedback severity — drives tint, default icon, role and aria-live. */
    tone?: MpBannerTone
    /** One-line message; use the default slot instead for rich markup (bold lead + body). */
    message?: string
    /** Lucide icon override; `false` hides the icon. Defaults per tone. */
    icon?: string | false
    /** Renders a dismiss button; visibility stays consumer-owned (v-if + @dismiss). */
    dismissible?: boolean
    /** Accessible label for the dismiss button, e.g. "Dismiss for this session". */
    dismissLabel?: string
  }>(),
  { tone: 'info', dismissible: false, dismissLabel: 'Dismiss' }
)

const emit = defineEmits<{ dismiss: [] }>()

// Severity icon vocabulary (shared app-wide).
const TONE_ICONS: Record<MpBannerTone, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  error: 'circle-alert',
}

const TONE_LABELS: Record<MpBannerTone, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

const resolvedIcon = computed(() => (props.icon === false ? null : (props.icon ?? TONE_ICONS[props.tone])))
const role = computed(() => (props.tone === 'warning' || props.tone === 'error' ? 'alert' : 'status'))
</script>

<template>
  <div class="mp-banner" :class="`mp-banner--${props.tone}`" :role="role">
    <v-icon v-if="resolvedIcon" size="18" class="mp-banner__icon" aria-hidden="true">{{ resolvedIcon }}</v-icon>
    <span class="mp-banner__message text-body-2">
      <span class="d-sr-only">{{ TONE_LABELS[props.tone] }}: </span>
      <slot>{{ props.message }}</slot>
    </span>
    <div class="mp-banner__actions">
      <slot name="actions" />
      <button
        v-if="props.dismissible"
        type="button"
        class="mp-banner__dismiss"
        :aria-label="props.dismissLabel"
        @click="emit('dismiss')"
      >
        <v-icon size="16">x</v-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* The full-width edge strip: square (no radius — it meets the frame edges),
   soft tone fill, and a bottom hairline as its boundary against app chrome.
   MpAlert is the rounded borderless in-page sibling; the hairline is this
   component's signature. Geometry generalizes PlgTrialBanner. */
.mp-banner {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  width: 100%;
  min-height: var(--mp-component-banner-minHeight);
  padding: var(--mp-space-6) var(--mp-space-16);
  font-size: var(--mp-fontSize-14);
}

/* The pairing rule: a painted surface declares its foreground. */
.mp-banner--info {
  background: var(--accent-container);
  color: var(--accent-on-container);
  border-block-end: 1px solid color-mix(in srgb, var(--accent-on-container) 25%, transparent);
}

.mp-banner--success {
  background: var(--pos-soft);
  color: var(--pos-ink);
  border-block-end: 1px solid color-mix(in srgb, var(--pos-ink) 25%, transparent);
}

.mp-banner--warning {
  background: var(--warn-soft);
  color: var(--warn-ink);
  border-block-end: 1px solid color-mix(in srgb, var(--warn-ink) 25%, transparent);
}

.mp-banner--error {
  background: var(--neg-soft);
  color: var(--neg-ink);
  border-block-end: 1px solid color-mix(in srgb, var(--neg-ink) 25%, transparent);
}

.mp-banner__icon {
  flex-shrink: 0;
}

.mp-banner__message {
  flex: 1 1 auto;
  min-width: 0;
}

.mp-banner__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  flex-shrink: 0;
}

.mp-banner__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: var(--mp-space-2);
  border: 0;
  border-radius: var(--mp-radius-full);
  background: transparent;
  color: currentColor;
  opacity: 0.7;
  appearance: none;
  cursor: pointer;
  transition: opacity 120ms ease, background 120ms ease;
}

.mp-banner__dismiss:hover,
.mp-banner__dismiss:focus-visible {
  opacity: 1;
  background: color-mix(in srgb, currentColor 10%, transparent);
}
</style>
