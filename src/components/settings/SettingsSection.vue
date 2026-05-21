<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <section class="settings-section">
    <div v-if="title || description" class="settings-section__head">
      <h3 v-if="title" class="settings-section__title">{{ title }}</h3>
      <p v-if="description" class="settings-section__description">{{ description }}</p>
    </div>
    <div class="settings-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.settings-section {
  padding: 0 0 28px;

  &:not(:last-child) {
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 28px;
  }
}

.settings-section__head {
  margin-bottom: 16px;
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
</style>
