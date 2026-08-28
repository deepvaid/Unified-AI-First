<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  compact?: boolean
}>()
</script>

<template>
  <section class="settings-section" :class="{ 'settings-section--compact': compact }">
    <div v-if="title || description || $slots.actions" class="settings-section__head">
      <div class="settings-section__head-left">
        <h3 v-if="title" class="settings-section__title mp-section-title">{{ title }}</h3>
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
  border-radius: var(--r-section);
  padding: var(--mp-space-20) var(--mp-space-24);
}

.settings-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-12);
  margin-bottom: var(--mp-space-16);
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
  padding: var(--mp-space-16) var(--mp-space-20);
}

.settings-section__title {
  margin: 0 0 var(--mp-space-4);
  color: var(--text-primary);
}

.settings-section__description {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: 1.45;
}

.settings-section__body {
  display: block;
}

@media (max-width: 640px) {
  .settings-section {
    padding: var(--mp-space-16);
    border-radius: var(--r-section);
  }
}
</style>
