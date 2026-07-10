<script setup lang="ts">
import { computed } from 'vue';
import type { MbPageHeaderProps } from './MbPageHeader.types';
import type { MbBreadcrumbItem } from './MbBreadcrumbs.types';
import MbBreadcrumbs from './MbBreadcrumbs.vue';

const props = withDefaults(defineProps<MbPageHeaderProps>(), {
  size: 'sm',
  align: 'start',
  eyebrow: undefined,
  subtitle: undefined,
  breadcrumbs: () => [],
});

const breadcrumbItems = computed<MbBreadcrumbItem[]>(() =>
  (props.breadcrumbs ?? []).map((crumb, index) => ({
    id: `mb-page-header-crumb-${index}`,
    label: crumb.label,
    href: crumb.disabled ? undefined : crumb.href,
    disabled: crumb.disabled,
  }))
);

const activeCrumbId = computed(() => {
  const items = breadcrumbItems.value;
  if (!items.length) {
    return '';
  }

  const lastInteractive = [...items].reverse().find((item) => !item.disabled);
  const fallback = items[items.length - 1];
  return (lastInteractive ?? fallback)?.id ?? '';
});
</script>

<template>
  <header class="mb-page-header" :data-size="size" :data-align="align">
    <MbBreadcrumbs
      v-if="breadcrumbItems.length"
      class="mb-page-header__breadcrumbs"
      :items="breadcrumbItems"
      :model-value="activeCrumbId"
      aria-label="Breadcrumb"
    />
    <div class="mb-page-header__row">
      <div class="mb-page-header__text">
        <span v-if="eyebrow" class="mb-page-header__eyebrow">{{ eyebrow }}</span>
        <h1 class="mb-page-header__title">{{ title }}</h1>
        <p v-if="subtitle" class="mb-page-header__subtitle">{{ subtitle }}</p>
        <slot name="meta" />
      </div>

      <div v-if="$slots.actions" class="mb-page-header__actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.default" class="mb-page-header__aside">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.mb-page-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-block: 12px 14px;
}

.mb-page-header[data-align='center'] {
  text-align: center;
  align-items: center;
}

.mb-page-header__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.mb-page-header[data-align='center'] .mb-page-header__row {
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.mb-page-header__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}

.mb-page-header__eyebrow {
  font-size: var(--mb-font-size-xs);
  font-weight: var(--mb-font-weight-semibold);
  letter-spacing: var(--mb-letter-spacing-eyebrow);
  text-transform: uppercase;
  color: var(--mb-color-primary);
}

.mb-page-header__title {
  font-family: var(--mb-font-family-base);
  font-size: var(--mb-font-size-display-md);
  line-height: var(--mb-line-height-display);
  letter-spacing: var(--mb-letter-spacing-tighter);
  font-weight: var(--mb-font-weight-bold);
  color: var(--mb-color-text);
  margin: 0;
}

.mb-page-header[data-size='sm'] .mb-page-header__title {
  font-size: var(--mb-font-size-display-sm);
  letter-spacing: var(--mb-letter-spacing-snug);
}

.mb-page-header[data-size='lg'] .mb-page-header__title {
  font-size: var(--mb-font-size-display-lg);
  letter-spacing: var(--mb-letter-spacing-hero);
  font-weight: var(--mb-font-weight-heavy);
}

.mb-page-header__subtitle {
  font-size: var(--mb-font-size-md);
  line-height: 1.5;
  color: var(--mb-color-text-muted);
  max-width: 68ch;
  margin: 0;
}

.mb-page-header__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.mb-page-header__aside {
  margin-top: 4px;
}

.mb-page-header__breadcrumbs {
  margin-bottom: 4px;
}
</style>
