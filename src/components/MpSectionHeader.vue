<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  /** Heading level announced to assistive tech (role="heading" + aria-level). */
  headingLevel?: number
  /** Muted, uppercase, tracked label above the title. */
  eyebrow?: string
  /** Supporting line under the title. */
  description?: string
  /** Optional quiet leading glyph for wayfinding (Lucide name). */
  icon?: string
}>(), {
  headingLevel: 2,
})
</script>

<template>
  <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4">
    <div class="d-flex align-center ga-3 min-width-0">
      <v-icon v-if="icon" size="18" class="mp-section-header__icon">{{ icon }}</v-icon>
      <div class="min-width-0">
        <span v-if="eyebrow" class="mp-section-header__eyebrow mp-meta-label">{{ eyebrow }}</span>
        <div class="mp-section-title" role="heading" :aria-level="headingLevel">{{ title }}</div>
        <div v-if="description" class="mp-section-header__description">{{ description }}</div>
      </div>
    </div>
    <div v-if="$slots.actions" class="d-flex ga-2 flex-shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.mp-section-header__eyebrow {
  display: block;
  margin-bottom: var(--mp-space-4);
  color: var(--text-muted);
}

.mp-section-header__icon {
  flex-shrink: 0;
  color: var(--icon-secondary);
}

.mp-section-header__description {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: 1.4;
  color: var(--text-secondary);
}
</style>
