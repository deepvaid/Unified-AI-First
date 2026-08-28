<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_SOURCE_META } from '@/stores/dashboards/metricCatalog'
import type { DashboardDataSource } from '@/stores/dashboards/types'

const props = withDefaults(defineProps<{
  dataSource: DashboardDataSource
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
}>(), {
  size: 'md',
  iconOnly: false,
})

const meta = computed(() => DASHBOARD_SOURCE_META[props.dataSource])
const iconSize = computed(() => ({ sm: 12, md: 13, lg: 15 } as const)[props.size])
</script>

<template>
  <span
    class="mp-source-cloud-chip"
    :class="[
      `mp-source-cloud-chip--${size}`,
      `mp-source-cloud-chip--${dataSource}`,
      { 'mp-source-cloud-chip--icon-only': iconOnly },
    ]"
    role="img"
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
  gap: var(--mp-space-4);
  flex-shrink: 0;
  padding-inline: var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-radius-full);
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: default;
}

.mp-source-cloud-chip--commerce { color: var(--cloud-commerce-text); }
.mp-source-cloud-chip--marketing { color: var(--cloud-marketing-text); }
.mp-source-cloud-chip--analytics { color: var(--cloud-analytics-text); }
.mp-source-cloud-chip--contacts { color: var(--cloud-contacts-text); }
.mp-source-cloud-chip--service { color: var(--cloud-service-text); }
.mp-source-cloud-chip--neto { color: var(--text-primary); }
.mp-source-cloud-chip--retail { color: var(--cloud-retail-text); }

/* Shared chip height ramp (P2-4). Was 20/22px on a private two-stop scale;
   the 10.5px `sm` label went with it (P2-3, no fractional sizes — P1-6). */
.mp-source-cloud-chip--sm {
  height: var(--mp-component-chip-height-sm);
  font-size: var(--mp-fontSize-11);
}

.mp-source-cloud-chip--md {
  height: var(--mp-component-chip-height-md);
  font-size: var(--mp-fontSize-12);
}

.mp-source-cloud-chip--lg {
  height: var(--mp-component-chip-height-lg);
  font-size: var(--mp-fontSize-13);
}

/* Icon-only collapses to a square at the same ramp height. */
.mp-source-cloud-chip--icon-only {
  padding-inline: 0;
  justify-content: center;
}

.mp-source-cloud-chip--icon-only.mp-source-cloud-chip--sm { width: var(--mp-component-chip-height-sm); }
.mp-source-cloud-chip--icon-only.mp-source-cloud-chip--md { width: var(--mp-component-chip-height-md); }
.mp-source-cloud-chip--icon-only.mp-source-cloud-chip--lg { width: var(--mp-component-chip-height-lg); }

.mp-source-cloud-chip :deep(.v-icon) {
  color: currentColor;
  opacity: 0.9;
}

.mp-source-cloud-chip__label {
  line-height: 1;
}
</style>
