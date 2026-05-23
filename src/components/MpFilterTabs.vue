<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(defineProps<{
  tabs: Array<{ label: string; key: string; count?: number }>
  ariaLabel?: string
}>(), {
  ariaLabel: 'Filter results',
})
</script>

<template>
  <v-tabs
    v-model="model"
    density="comfortable"
    color="primary"
    :aria-label="ariaLabel"
    class="mp-filter-tabs mb-4"
    align-tabs="start"
    show-arrows
  >
    <v-tab
      v-for="tab in tabs"
      :key="tab.key"
      :value="tab.key"
      class="text-none mp-filter-tabs__tab"
    >
      <span>{{ tab.label }}</span>
      <v-chip
        v-if="tab.count != null && tab.count > 0"
        size="x-small"
        variant="tonal"
        color="default"
        class="ms-2 mp-filter-tabs__count"
      >
        {{ tab.count }}
      </v-chip>
    </v-tab>
  </v-tabs>
</template>

<style scoped>
.mp-filter-tabs :deep(.v-tab.v-tab--selected .mp-filter-tabs__count) {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.10);
}

.mp-filter-tabs__tab {
  min-width: 0;
  padding-inline: 14px;
  letter-spacing: 0;
  font-weight: 500;
}

.mp-filter-tabs :deep(.v-slide-group__content) {
  gap: 4px;
}
</style>
