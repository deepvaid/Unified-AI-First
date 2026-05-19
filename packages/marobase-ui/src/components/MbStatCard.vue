<script setup lang="ts">
import { computed } from 'vue';
import type { MbStatCardProps } from './MbStatCard.types';

const props = withDefaults(defineProps<MbStatCardProps>(), {
  tone: 'default',
  size: 'md',
  unit: undefined,
  caption: undefined,
  trend: undefined,
  trendValue: undefined,
  icon: undefined,
});

const trendSymbol = computed(() => {
  if (props.trend === 'up') return '↑';
  if (props.trend === 'down') return '↓';
  if (props.trend === 'flat') return '·';
  return '';
});
</script>

<template>
  <article class="mb-stat-card" :data-tone="tone" :data-size="size">
    <header class="mb-stat-card__head">
      <span class="mb-stat-card__label">{{ label }}</span>
      <span v-if="icon" class="mb-stat-card__icon" aria-hidden="true">
        <slot name="icon">
          <i :class="['mdi', icon]" />
        </slot>
      </span>
    </header>

    <div class="mb-stat-card__value-row">
      <span class="mb-stat-card__value">{{ value }}</span>
      <span v-if="unit" class="mb-stat-card__unit">{{ unit }}</span>
    </div>

    <footer v-if="trend || caption || $slots.footer" class="mb-stat-card__foot">
      <span
        v-if="trend"
        class="mb-stat-card__trend"
        :data-trend="trend"
      >
        <span aria-hidden="true">{{ trendSymbol }}</span>
        <span v-if="trendValue">{{ trendValue }}</span>
      </span>
      <span v-if="caption" class="mb-stat-card__caption">{{ caption }}</span>
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.mb-stat-card {
  --mb-stat-bg: var(--mb-color-surface);
  --mb-stat-border: var(--mb-color-border-subtle);
  --mb-stat-label-color: var(--mb-color-text-muted);
  --mb-stat-value-color: var(--mb-color-text);
  --mb-stat-unit-color: var(--mb-color-text-muted);

  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  background: var(--mb-stat-bg);
  border: 1px solid var(--mb-stat-border);
  border-radius: var(--mb-radius-xl);
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.2s ease;
  min-height: 160px;
  box-sizing: border-box;
}

.mb-stat-card[data-tone='soft'] {
  --mb-stat-bg: var(--mb-color-primary-soft);
  --mb-stat-border: transparent;
}

.mb-stat-card[data-tone='warm'] {
  --mb-stat-bg: var(--mb-color-surface-subtle);
  --mb-stat-border: transparent;
}

.mb-stat-card[data-tone='inverse'] {
  --mb-stat-bg: var(--mp-color-blue-900, #0b3558);
  --mb-stat-border: transparent;
  --mb-stat-label-color: rgba(255, 255, 255, 0.7);
  --mb-stat-value-color: rgb(var(--v-theme-on-primary));
  --mb-stat-unit-color: rgba(255, 255, 255, 0.64);
}

.mb-stat-card[data-size='lg'] {
  padding: 36px;
  min-height: 200px;
  gap: 24px;
}

.mb-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--mb-shadow-md);
  border-color: rgba(18, 168, 245, 0.24);
}

.mb-stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mb-stat-card__label {
  font-size: var(--mb-font-size-xs);
  font-weight: var(--mb-font-weight-semibold);
  letter-spacing: var(--mb-letter-spacing-eyebrow);
  text-transform: uppercase;
  color: var(--mb-stat-label-color);
}

.mb-stat-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(18, 168, 245, 0.1);
  color: var(--mb-color-primary);
  font-size: 18px;
}

.mb-stat-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.mb-stat-card__value {
  font-family: var(--mb-font-family-base);
  font-size: var(--mb-font-size-display-sm);
  font-weight: var(--mb-font-weight-heavy);
  line-height: var(--mb-line-height-display);
  letter-spacing: var(--mb-letter-spacing-tighter);
  color: var(--mb-stat-value-color);
  white-space: nowrap;
}

.mb-stat-card[data-size='lg'] .mb-stat-card__value {
  font-size: var(--mb-font-size-display-lg);
  letter-spacing: var(--mb-letter-spacing-hero);
}

.mb-stat-card__unit {
  font-size: var(--mb-font-size-lg);
  font-weight: var(--mb-font-weight-medium);
  color: var(--mb-stat-unit-color);
}

.mb-stat-card__foot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: var(--mb-font-size-sm);
  color: var(--mb-color-text-muted);
  margin-top: auto;
}

.mb-stat-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: var(--mb-font-weight-semibold);
  font-size: var(--mb-font-size-xs);
}

.mb-stat-card__trend[data-trend='up'] {
  background: var(--mb-color-success-soft);
  color: var(--mb-color-success);
}

.mb-stat-card__trend[data-trend='down'] {
  background: var(--mb-color-error-soft);
  color: var(--mb-color-error);
}

.mb-stat-card__trend[data-trend='flat'] {
  background: var(--mb-color-surface-subtle);
  color: var(--mb-color-text-muted);
}

.mb-stat-card__caption {
  line-height: 1.4;
}
</style>
