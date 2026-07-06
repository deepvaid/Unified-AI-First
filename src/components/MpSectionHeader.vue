<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  /** Heading level announced to assistive tech (role="heading" + aria-level). */
  headingLevel?: number
}>(), {
  headingLevel: 2,
})
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-4">
    <div class="text-h6 font-weight-medium" role="heading" :aria-level="headingLevel">{{ title }}</div>
    <div v-if="$slots.actions" class="d-flex gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
