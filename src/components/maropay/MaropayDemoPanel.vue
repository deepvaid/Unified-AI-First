<script setup lang="ts">
// Demo controls for reviewers — simulating our payments partner, the bank or a
// shopper — kept visibly apart from the product: one quiet, dashed, collapsed
// panel at the bottom of the page, the same on every Maropay page. Compose its
// rows as `MpListRow variant="divided"` with the control in `#trailing`.

withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: 'Demo controls',
  description: 'Simulates our payments partner, the bank and shoppers — not part of the product.',
})

const open = defineModel<boolean>('open', { default: false })

function onToggle(event: Event): void {
  open.value = (event.target as HTMLDetailsElement).open
}
</script>

<template>
  <details class="maropay-demo" :open="open" @toggle="onToggle">
    <summary class="maropay-demo__summary">
      <v-icon size="16" class="maropay-demo__icon">flask-conical</v-icon>
      <span class="maropay-demo__text">
        <span class="maropay-demo__title">{{ title }}</span>
        <span class="maropay-demo__description">{{ description }}</span>
      </span>
      <v-icon size="16" class="maropay-demo__chevron">chevron-down</v-icon>
    </summary>
    <div class="maropay-demo__body">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.maropay-demo {
  border: 1px dashed var(--border-strong);
  border-radius: var(--mp-component-card-radius);
  padding: var(--mp-component-card-paddingCompact) var(--mp-component-card-padding);
}

.maropay-demo__summary {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  min-height: var(--mp-component-control-height);
  list-style: none;
  cursor: pointer;
  border-radius: var(--mp-component-chip-radius);
}

.maropay-demo__summary::-webkit-details-marker {
  display: none;
}

.maropay-demo__summary:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.maropay-demo__icon,
.maropay-demo__chevron {
  color: var(--icon-secondary);
}

.maropay-demo__chevron {
  margin-left: auto;
  transition: transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.maropay-demo[open] .maropay-demo__chevron {
  transform: rotate(180deg);
}

.maropay-demo__text {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mp-space-2) var(--mp-space-8);
  min-width: 0;
}

.maropay-demo__title {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  color: var(--text-primary);
}

.maropay-demo__description {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

.maropay-demo__body {
  margin-top: var(--mp-space-8);
}
</style>
