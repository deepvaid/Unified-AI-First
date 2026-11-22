<script setup lang="ts">
/**
 * A read-only status mark: stock, sale status, loyalty tier. Text always
 * says the status — tone and icon only reinforce it.
 */
import type { PosTone } from './posArt'

withDefaults(defineProps<{
  tone?: PosTone
  icon?: string
  /** sm sits inside rows and chips; md rides on artwork (product tiles). */
  size?: 'sm' | 'md'
}>(), {
  tone: 'neutral',
  icon: undefined,
  size: 'sm',
})
</script>

<template>
  <span class="pos-badge" :class="[`pos-badge--${tone}`, `pos-badge--${size}`]">
    <v-icon v-if="icon" size="12" aria-hidden="true">{{ icon }}</v-icon>
    <slot />
  </span>
</template>

<style scoped>
.pos-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--mp-space-4);
  padding: var(--mp-space-2) var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
  line-height: var(--mp-lineHeight-compact);
  white-space: nowrap;
}

.pos-badge--md { font-size: var(--mp-fontSize-12); }

.pos-badge--neutral { background: var(--mp-color-light-pos-subtle); color: var(--mp-color-light-pos-muted); }
.pos-badge--success { background: var(--mp-color-light-pos-successSoft); color: var(--mp-color-light-pos-successInk); }
.pos-badge--warn    { background: var(--mp-color-light-pos-warnSoft); color: var(--mp-color-light-pos-warnInk); }
.pos-badge--danger  { background: var(--mp-color-light-pos-dangerSoft); color: var(--mp-color-light-pos-dangerInk); }
.pos-badge--accent  { background: var(--mp-color-light-pos-accentSoft); color: var(--mp-color-light-pos-accentInk); }
.pos-badge--ink     { background: var(--mp-color-light-pos-ink); color: var(--mp-color-light-pos-onInk); }
</style>
