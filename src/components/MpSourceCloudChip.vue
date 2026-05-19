<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_SOURCE_META } from '@/stores/dashboards/metricCatalog'
import type { DashboardDataSource } from '@/stores/dashboards/types'

const props = withDefaults(defineProps<{
  dataSource: DashboardDataSource
  size?: 'sm' | 'md'
  iconOnly?: boolean
}>(), {
  size: 'md',
  iconOnly: false,
})

const meta = computed(() => DASHBOARD_SOURCE_META[props.dataSource])
const iconSize = computed(() => (props.size === 'sm' ? 12 : 13))
</script>

<template>
  <span
    class="mp-source-cloud-chip"
    :class="[
      `mp-source-cloud-chip--${size}`,
      `mp-source-cloud-chip--${dataSource}`,
      { 'mp-source-cloud-chip--icon-only': iconOnly },
    ]"
    :title="iconOnly ? meta.label : undefined"
    :aria-label="meta.label"
  >
    <v-icon :size="iconSize">{{ meta.icon }}</v-icon>
    <span v-if="!iconOnly" class="mp-source-cloud-chip__label">{{ meta.label }}</span>
  </span>
</template>

<style scoped lang="scss">
.mp-source-cloud-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 0 9px;
  height: 22px;
  border-radius: 999px;
  background: var(--surface-1);
  border: 1px solid var(--hairline);
  color: var(--ink);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: default;
}

.mp-source-cloud-chip--commerce { color: var(--cloud-commerce-text); }
.mp-source-cloud-chip--marketing { color: var(--cloud-marketing-text); }
.mp-source-cloud-chip--analytics { color: var(--cloud-analytics-text); }
.mp-source-cloud-chip--contacts { color: var(--cloud-contacts-text); }
.mp-source-cloud-chip--service { color: var(--cloud-service-text); }
.mp-source-cloud-chip--neto { color: var(--ink); }
.mp-source-cloud-chip--retail { color: var(--cloud-retail-text); }

.mp-source-cloud-chip--sm {
  height: 20px;
  padding: 0 8px;
  font-size: 10.5px;
  gap: 4px;
}

.mp-source-cloud-chip--icon-only {
  padding: 0;
  width: 22px;
  height: 22px;
  justify-content: center;
}

.mp-source-cloud-chip--icon-only.mp-source-cloud-chip--sm {
  width: 20px;
  height: 20px;
}

.mp-source-cloud-chip :deep(.v-icon) {
  color: currentColor;
  opacity: 0.9;
}

.mp-source-cloud-chip__label {
  line-height: 1;
}
</style>
