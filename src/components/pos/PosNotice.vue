<script setup lang="ts">
/**
 * A short note inside a sheet: a duplicate customer, no printer, the $1,000
 * buyer rule. Words wrap around inline `PosButton variant="link"` actions.
 *
 * Give it `role="alert"` when it reports a problem the cashier just caused,
 * `role="note"` when it is advice.
 */
withDefaults(defineProps<{
  tone?: 'neutral' | 'warn'
  icon?: string
}>(), {
  tone: 'neutral',
  icon: undefined,
})
</script>

<template>
  <div class="pos-notice" :class="`pos-notice--${tone}`">
    <v-icon v-if="icon" size="16" aria-hidden="true">{{ icon }}</v-icon>
    <slot />
  </div>
</template>

<style scoped>
.pos-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-4) var(--mp-space-8);
  padding: var(--mp-space-10) var(--mp-space-12);
  border-radius: var(--mp-component-pos-radius-control);
  background: var(--mp-color-light-pos-subtle);
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-compact);
}

.pos-notice--warn {
  background: var(--mp-color-light-pos-warnSoft);
  color: var(--mp-color-light-pos-warnInk);
}
</style>
