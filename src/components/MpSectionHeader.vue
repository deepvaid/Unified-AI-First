<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  /** Heading level announced to assistive tech (role="heading" + aria-level). */
  headingLevel?: number
  /** Muted, uppercase, tracked label above the title. */
  eyebrow?: string
  /** Supporting line under the title. */
  description?: string
}>(), {
  headingLevel: 2,
})
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-4">
    <div class="min-width-0">
      <span v-if="eyebrow" class="mp-section-header__eyebrow mp-meta-label">{{ eyebrow }}</span>
      <div class="mp-section-title" role="heading" :aria-level="headingLevel">{{ title }}</div>
      <div v-if="description" class="mp-section-header__description">{{ description }}</div>
    </div>
    <div v-if="$slots.actions" class="d-flex gap-2 flex-shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.mp-section-header__eyebrow {
  display: block;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.mp-section-header__description {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
