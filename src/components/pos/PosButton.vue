<script setup lang="ts">
/**
 * The register's one button. Every size clears the 44px touch target;
 * `lg` (52) is for the buttons a cashier hits most — Charge, the cart actions.
 * `link` is the one exception (32): an action inside a sentence, which
 * WCAG 2.5.8 exempts as inline.
 *
 * Icon-only when there is no label: pass `aria-label`, and it renders square.
 */
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  tone?: 'neutral' | 'danger'
  size?: 'md' | 'lg'
  /** Lucide icon name, shown before the label (or above it when `stacked`). */
  icon?: string
  /** Icon above a short label — the cart's Park / Discount / Customer / Clear row. */
  stacked?: boolean
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'primary',
  tone: 'neutral',
  size: 'md',
  icon: undefined,
  stacked: false,
  block: false,
  disabled: false,
  type: 'button',
})

const slots = useSlots()
const iconOnly = computed(() => !!props.icon && !slots.default)
const iconSize = computed(() => (props.size === 'lg' && !props.stacked ? 18 : 16))
</script>

<template>
  <button
    class="pos-button"
    :class="[
      `pos-button--${variant}`,
      `pos-button--${size}`,
      {
        'pos-button--danger': tone === 'danger',
        'pos-button--stacked': stacked,
        'pos-button--block': block,
        'pos-button--icon-only': iconOnly,
      },
    ]"
    :type="type"
    :disabled="disabled"
  >
    <v-icon v-if="icon" :size="iconSize" aria-hidden="true">{{ icon }}</v-icon>
    <span v-if="$slots.default" class="pos-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.pos-button {
  --pos-button-fg: var(--mp-color-light-pos-ink);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-6);
  min-width: 0;
  min-height: var(--mp-component-pos-touchTarget);
  padding: 0 var(--mp-space-16);
  border: 1px solid transparent;
  border-radius: var(--mp-component-pos-radius-control);
  background: transparent;
  color: var(--pos-button-fg);
  font-family: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-tight);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--mp-motion-duration-instant),
    border-color var(--mp-motion-duration-instant),
    transform var(--mp-motion-duration-instant);
}

.pos-button:active:not(:disabled) { transform: scale(0.99); }

.pos-button__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Sizes ── */
.pos-button--lg {
  min-height: var(--mp-component-pos-touchTargetLarge);
  padding: 0 var(--mp-space-20);
  border-radius: var(--mp-component-pos-radius-card);
  font-size: var(--mp-fontSize-14);
}

.pos-button--block { display: flex; width: 100%; }

.pos-button--icon-only {
  width: var(--mp-component-pos-touchTarget);
  padding: 0;
}

.pos-button--lg.pos-button--icon-only { width: var(--mp-component-pos-touchTargetLarge); }

/* ── Variants ── */
.pos-button--primary {
  border-color: var(--mp-color-light-pos-ink);
  background: var(--mp-color-light-pos-ink);
  color: var(--mp-color-light-pos-onInk);
  font-weight: var(--mp-fontWeight-bold);
}

.pos-button--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mp-color-light-pos-ink) 88%, black);
}

.pos-button--primary.pos-button--lg { font-size: var(--mp-fontSize-16); }

.pos-button--secondary {
  border-color: var(--mp-color-light-pos-hairline);
  background: var(--mp-color-light-pos-surface);
}

.pos-button--secondary:hover:not(:disabled) {
  border-color: rgba(var(--mp-rgb-color-light-pos-ink), 0.18);
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.04);
}

.pos-button--ghost { --pos-button-fg: var(--mp-color-light-pos-muted); }

.pos-button--ghost:hover:not(:disabled) { background: rgba(var(--mp-rgb-color-light-pos-ink), 0.05); }

/* Inline action inside copy (alerts, notices): reads as a link, still a button */
.pos-button--link {
  --pos-button-fg: var(--mp-color-light-pos-accentInk);

  min-height: var(--mp-space-32);
  padding: 0 var(--mp-space-4);
  font-size: inherit;
  font-weight: var(--mp-fontWeight-bold);
  text-decoration: underline;
}

.pos-button--danger { --pos-button-fg: var(--mp-color-light-pos-dangerInk); }

.pos-button--danger.pos-button--secondary:hover:not(:disabled) {
  border-color: rgba(var(--mp-rgb-color-light-pos-dangerInk), 0.3);
  background: var(--mp-color-light-pos-dangerSoft);
}

.pos-button--danger.pos-button--ghost:hover:not(:disabled) { background: var(--mp-color-light-pos-dangerSoft); }

.pos-button--danger.pos-button--primary {
  border-color: var(--mp-color-light-pos-dangerInk);
  background: var(--mp-color-light-pos-dangerInk);
}

/* ── Stacked: icon over a short label ── */
.pos-button--stacked {
  flex-direction: column;
  gap: var(--mp-space-2);
  min-width: var(--mp-component-pos-touchTargetLarge);
  padding: var(--mp-space-6) var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
}

.pos-button--stacked.pos-button--md { min-height: var(--mp-component-pos-touchTargetLarge); }

/* Disabled: still legible, plainly not live (1.4.3 exempts it from contrast) */
.pos-button:disabled {
  border-color: transparent;
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.12);
  color: rgba(var(--mp-rgb-color-light-pos-ink), 0.55);
  cursor: not-allowed;
}

.pos-button--ghost:disabled,
.pos-button--link:disabled { background: transparent; }
</style>
