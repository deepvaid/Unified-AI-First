<script setup lang="ts">
import type { ProductRow } from '@/storefront/productPage'

// The collapsible rows under the buy box (the product template's `collapsible-row`
// blocks, read by `productRows` in src/storefront/productPage.ts): Description, Fit
// and sizing, Fabric and care, Delivery and returns. Each is a native
// <details>/<summary>, so it opens with Enter or Space and a screen reader hears
// whether it is expanded. The fit row ends with "Open the size guide".

defineProps<{ rows: ProductRow[] }>()
const emit = defineEmits<{
  /** "Open the size guide" in the fit row. */
  'size-guide': []
}>()
</script>

<template>
  <div v-if="rows.length" class="sf-rows">
    <details v-for="row in rows" :key="row.id" class="sf-row" :open="row.open">
      <summary class="sf-row__summary">
        <span>{{ row.title }}</span>
        <v-icon class="sf-row__icon" size="18" aria-hidden="true">chevron-down</v-icon>
      </summary>
      <div class="sf-row__body">
        <p v-for="(paragraph, index) in row.paragraphs" :key="index">{{ paragraph }}</p>
        <dl v-if="row.facts.length" class="sf-row__facts">
          <div v-for="fact in row.facts" :key="fact.label" class="sf-row__fact">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <p v-if="row.sizeGuide">
          <button type="button" class="sf-row__link" @click="emit('size-guide')">
            <v-icon size="16" aria-hidden="true">ruler</v-icon>
            Open the size guide
          </button>
        </p>
      </div>
    </details>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The hairlines are the
 * theme's text colour, faded, so they show on any page colour. */
.sf-rows {
  border-bottom: 1px solid color-mix(in srgb, var(--sf-text, #121011) 14%, transparent);
}

.sf-row {
  border-top: 1px solid color-mix(in srgb, var(--sf-text, #121011) 14%, transparent);
}

.sf-row__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  list-style: none;
  cursor: pointer;
}

.sf-row__summary::-webkit-details-marker {
  display: none;
}

.sf-row__summary:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-row__icon {
  flex: none;
  transition: transform 160ms ease;
}

.sf-row[open] .sf-row__icon {
  transform: rotate(180deg);
}

.sf-row__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 20px;
  font-size: 15px;
  line-height: 24px;
}

.sf-row__body p {
  margin: 0;
}

.sf-row__facts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.sf-row__fact {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
}

.sf-row__fact dt {
  color: var(--sf-muted, #66625c);
}

.sf-row__fact dd {
  margin: 0;
}

/* Underlined like a link; at least 24px tall, 44px of hit area. */
.sf-row__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-row__link::after {
  content: '';
  position: absolute;
  inset: -10px -4px;
}

.sf-row__link:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .sf-row__icon {
    transition: none;
  }
}
</style>
