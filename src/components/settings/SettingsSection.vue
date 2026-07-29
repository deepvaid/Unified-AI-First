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
  padding: 20px 24px;
}

.settings-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.settings-section__head-left {
  flex: 1;
  min-width: 0;
}

.settings-section__head-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-section--compact {
  padding: 16px 20px;
}

.settings-section__title {
  margin: 0 0 3px;
  color: var(--text-primary);
}

.settings-section__description {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
}

.settings-section__body {
  display: block;
}

@media (max-width: 640px) {
  .settings-section {
    padding: 16px;
    border-radius: var(--r-section);
  }
}
</style>
