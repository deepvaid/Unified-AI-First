<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="settings-page-header">
    <div class="settings-page-header__copy">
      <h2 class="settings-page-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="settings-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="settings-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.settings-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 4px;
}

.settings-page-header__copy {
  min-width: 0;
}

.settings-page-header__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ink);
}

.settings-page-header__subtitle {
  margin: 0;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
}

.settings-page-header__actions {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 640px) {
  .settings-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-page-header__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
