<script setup lang="ts">
import type { MbCardProps } from './MbCard.types';

withDefaults(defineProps<MbCardProps>(), {
  tone: 'default',
  radius: 'lg',
  padding: 'md',
  interactive: false,
  as: 'article',
});
</script>

<template>
  <component
    :is="as"
    class="mb-card"
    :data-tone="tone"
    :data-radius="radius"
    :data-padding="padding"
    :data-interactive="interactive ? 'true' : 'false'"
  >
    <header v-if="$slots.header" class="mb-card__header">
      <slot name="header" />
    </header>
    <div v-if="$slots.media" class="mb-card__media">
      <slot name="media" />
    </div>
    <div class="mb-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="mb-card__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.mb-card {
  --mb-card-bg: var(--mb-color-surface);
  --mb-card-border: var(--mb-color-border-subtle);
  --mb-card-text: var(--mb-color-text);

  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--mb-card-border);
  border-radius: var(--mb-radius-lg);
  background: var(--mb-card-bg);
  color: var(--mb-card-text);
  box-sizing: border-box;
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color var(--mb-motion-base);
}

.mb-card[data-tone='soft'] {
  --mb-card-bg: var(--mb-color-primary-soft);
  --mb-card-border: transparent;
}

.mb-card[data-tone='warm'] {
  --mb-card-bg: var(--mb-color-surface-subtle);
  --mb-card-border: transparent;
}

.mb-card[data-tone='inverse'] {
  --mb-card-bg: var(--mp-color-blue-900, #0b3558);
  --mb-card-border: transparent;
  --mb-card-text: rgb(var(--v-theme-on-primary));
}

.mb-card[data-radius='sm'] {
  border-radius: var(--mb-radius-sm);
}

.mb-card[data-radius='md'] {
  border-radius: var(--mb-radius-md);
}

.mb-card[data-radius='lg'] {
  border-radius: var(--mb-radius-lg);
}

.mb-card[data-radius='xl'] {
  border-radius: var(--mb-radius-xl);
}

.mb-card[data-padding='sm'] {
  padding: 16px;
}

.mb-card[data-padding='md'] {
  padding: 24px;
}

.mb-card[data-padding='lg'] {
  padding: 32px;
}

.mb-card[data-interactive='true'] {
  cursor: pointer;
}

.mb-card[data-interactive='true']:hover {
  transform: translateY(-2px);
  box-shadow: var(--mb-shadow-md);
}

.mb-card__header,
.mb-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mb-card__media,
.mb-card__body {
  min-width: 0;
}
</style>
