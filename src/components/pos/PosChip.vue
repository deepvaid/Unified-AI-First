<script setup lang="ts">
/**
 * A pill the cashier taps: a filter (collection, history), a preset (10%, $50)
 * or a quick action ("Custom item"). Never shorter than the 44px target.
 *
 * Pass `active` (true or false) for a toggle — it renders `aria-pressed`.
 * Leave it unset for a one-shot action.
 */
withDefaults(defineProps<{
  active?: boolean
  size?: 'md' | 'lg'
  icon?: string
}>(), {
  active: undefined,
  size: 'md',
  icon: undefined,
})
</script>

<template>
  <button
    type="button"
    class="pos-chip"
    :class="[`pos-chip--${size}`, { 'pos-chip--active': active }]"
    :aria-pressed="active === undefined ? undefined : active"
  >
    <v-icon v-if="icon" size="14" aria-hidden="true">{{ icon }}</v-icon>
    <slot />
  </button>
</template>

<style scoped>
.pos-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-4);
  min-height: var(--mp-component-pos-touchTarget);
  padding: 0 var(--mp-space-16);
  border: 1px solid var(--mp-color-light-pos-hairline);
  border-radius: var(--mp-radius-full);
  background: var(--mp-color-light-pos-surface);
  color: var(--mp-color-light-pos-muted);
  font-family: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--mp-motion-duration-instant),
    color var(--mp-motion-duration-instant),
    border-color var(--mp-motion-duration-instant);
}

/* An action chip reads as a command; an off toggle recedes until chosen */
.pos-chip:not([aria-pressed]),
.pos-chip:hover {
  color: var(--mp-color-light-pos-ink);
}

.pos-chip:hover { background: rgba(var(--mp-rgb-color-light-pos-ink), 0.04); }

/* Cash amounts and other money presets: bigger type, the Android 48dp row */
.pos-chip--lg {
  min-height: var(--mp-space-48);
  font-size: var(--mp-fontSize-15);
}

.pos-chip--active,
.pos-chip--active:hover {
  border-color: var(--mp-color-light-pos-ink);
  background: var(--mp-color-light-pos-ink);
  color: var(--mp-color-light-pos-onInk);
}
</style>
