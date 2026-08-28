<script setup lang="ts">
import MpEmptyState from './MpEmptyState.vue'

withDefaults(defineProps<{
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
  /** Heading level announced to assistive tech (role="heading" + aria-level). */
  headingLevel?: number
}>(), {
  icon: 'alert-triangle',
  title: 'Something went wrong',
  actionLabel: 'Try again',
  actionIcon: 'refresh-cw',
  headingLevel: 2,
})

defineEmits<{
  action: []
}>()
</script>

<template>
  <!-- Composes MpEmptyState rather than re-implementing the centred-state shape.
       What it adds is the semantics: role="alert" (an error must be announced, an
       empty list must not) plus the error tone and retry-flavoured defaults. -->
  <MpEmptyState
    class="mp-error-state"
    role="alert"
    tone="error"
    :icon="icon"
    :title="title"
    :description="description"
    :action-label="actionLabel"
    :action-icon="actionIcon"
    :heading-level="headingLevel"
    @action="$emit('action')"
  >
    <template v-if="$slots.illustration" #illustration><slot name="illustration" /></template>
  </MpEmptyState>
</template>
