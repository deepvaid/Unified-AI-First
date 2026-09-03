<script setup lang="ts">
// The Settings-module skin over the one containment recipe: the same surface,
// border, radius and inset a `v-card variant="flat" border rounded="lg"` section
// gets, kept as a component so nine Settings pages share one heading spec and one
// named region (`aria-labelledby`) instead of hand-rolling both.
import { useId } from 'vue'

defineProps<{
  title?: string
  description?: string
  compact?: boolean
}>()

const headingId = useId()
</script>

<template>
  <section
    class="settings-section"
    :class="{ 'settings-section--compact': compact }"
    :aria-labelledby="title ? headingId : undefined"
  >
    <div v-if="title || description || $slots.actions" class="settings-section__head">
      <div class="settings-section__head-left">
        <h3 v-if="title" :id="headingId" class="settings-section__title mp-section-title">{{ title }}</h3>
        <p v-if="description" class="settings-section__description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="settings-section__head-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="settings-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.settings-section {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-card-radius);
  padding: var(--mp-component-card-padding);
}

.settings-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-12);
  margin-bottom: var(--mp-component-card-gap);
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  /* A long #actions button no longer squeezes the description at 375. */
  .settings-section__head {
    flex-wrap: wrap;
  }
}

.settings-section__head-left {
  flex: 1;
  min-width: 0;
}

.settings-section__head-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.settings-section--compact {
  padding: var(--mp-component-card-paddingCompact);
}

.settings-section__title {
  margin: 0 0 var(--mp-space-4);
  color: var(--text-primary);
}

.settings-section__description {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: var(--mp-lineHeight-compact);
}

.settings-section__body {
  display: block;
}

@media (max-width: $mp-layout-breakpointCompact) {
  .settings-section {
    padding: var(--mp-component-card-paddingCompact);
  }
}
</style>
