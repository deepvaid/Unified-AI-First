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
        <h3 v-if="title" class="settings-section__title">{{ title }}</h3>
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
  background: var(--surface-1);
  border: 1px solid var(--hairline);
  border-radius: 14px;
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
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.settings-section__description {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.4;
}

.settings-section__body {
  display: block;
}

@media (max-width: 640px) {
  .settings-section {
    padding: 16px;
    border-radius: 12px;
  }
}
</style>
