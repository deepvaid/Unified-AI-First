<script setup lang="ts">
import { computed } from 'vue'

// A store's initials in a tile — the lead of a store row on the Maropay overview
// and the setup timeline, where a globe icon said nothing about which store.
// Decorative: the row names the store in words right beside it.

const props = withDefaults(defineProps<{
  name: string
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})

const initials = computed(() => {
  const words = props.name.trim().split(/[\s-]+/).filter(Boolean)
  const letters = words.length >= 2 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
})
</script>

<template>
  <span class="store-mark" :class="`store-mark--${size}`" aria-hidden="true">{{ initials }}</span>
</template>

<style scoped>
.store-mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-secondary);
  color: var(--on-surface);
  font-family: var(--mp-fontFamily-mono);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.02em;
}

.store-mark--sm {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  font-size: var(--mp-fontSize-11);
}

.store-mark--md {
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  font-size: var(--mp-fontSize-13);
}
</style>
