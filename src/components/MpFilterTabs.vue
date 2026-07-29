<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(defineProps<{
  tabs: Array<{ label: string; key: string; count?: number }>
  ariaLabel?: string
  /** id of the filtered results container; wired to each tab's aria-controls. */
  controlsId?: string
}>(), {
  ariaLabel: 'Filter results',
  controlsId: undefined,
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
      :aria-controls="controlsId"
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
.mp-filter-tabs__tab {
  min-width: 0;
  padding-inline: 14px;
  letter-spacing: 0;
}

/* Unselected: quiet 500 weight, muted ink. */
.mp-filter-tabs :deep(.v-tab.mp-filter-tabs__tab) {
  font-weight: 500;
  color: var(--text-secondary);
}

/* Selected: 600 weight, full ink — the primary accent lives only in the slider. */
.mp-filter-tabs :deep(.v-tab.mp-filter-tabs__tab.v-tab--selected) {
  font-weight: 600;
  color: var(--text-primary);
}

/* Keep the underline, hold it to a 2px primary hairline. */
.mp-filter-tabs :deep(.v-tab__slider) {
  height: 2px;
  background-color: rgb(var(--v-theme-primary));
}

/* Count reads as a plain tabular figure, not a pill. */
.mp-filter-tabs__count.v-chip {
  background: transparent !important;
  border: none;
  padding-inline: 0;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.mp-filter-tabs__count :deep(.v-chip__underlay) {
  opacity: 0;
}

.mp-filter-tabs :deep(.v-tab--selected) .mp-filter-tabs__count.v-chip {
  color: rgb(var(--v-theme-primary));
}

.mp-filter-tabs :deep(.v-slide-group__content) {
  gap: 4px;
}
</style>
