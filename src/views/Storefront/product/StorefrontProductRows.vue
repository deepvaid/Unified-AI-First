<script setup lang="ts">
import type { ProductRow } from '@/storefront/productPage'

// The collapsible rows under the buy box (the product template's `collapsible-row`
// blocks, read by `productRows` in src/storefront/productPage.ts): Description, Fit
// and sizing, Fabric and care, Delivery and returns, and a part's Specifications,
// Vehicle fit and Warranty. Each is a native <details>/<summary>, so it opens with
// Enter or Space and a screen reader hears whether it is expanded. The fit row ends
// with "Open the size guide". Specifications are a two-column table; Vehicle fit is
// the compatibility table (Make, Model, Years, Position), the shopper's vehicle
// highlighted and labelled "Your vehicle" in words.

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
        <table v-if="row.specs.length" class="sf-row__table sf-row__table--specs">
          <caption class="sf-row__hidden">{{ row.title }}</caption>
          <tbody>
            <tr v-for="spec in row.specs" :key="spec.label">
              <th scope="row">{{ spec.label }}</th>
              <td>{{ spec.value }}</td>
            </tr>
          </tbody>
        </table>
        <table v-if="row.fitment.length" class="sf-row__table sf-row__table--fit">
          <caption class="sf-row__hidden">Vehicles this part fits</caption>
          <thead>
            <tr>
              <th scope="col">Make</th>
              <th scope="col">Model</th>
              <th scope="col">Years</th>
              <th v-if="row.fitment.some((r) => r.detail)" scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fit, index) in row.fitment" :key="index" :class="{ 'is-yours': fit.yours }">
              <td>{{ fit.make }}</td>
              <td>
                {{ fit.model }}
                <span v-if="fit.yours" class="sf-row__yours">
                  <v-icon size="14" aria-hidden="true">circle-check</v-icon>
                  Your vehicle
                </span>
              </td>
              <td class="sf-row__years">{{ fit.years }}</td>
              <td v-if="row.fitment.some((r) => r.detail)">{{ fit.detail }}</td>
            </tr>
          </tbody>
        </table>
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
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
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
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* Tables: specifications and vehicle fit. Figures line up (years, sizes). */
.sf-row__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.sf-row__table th,
.sf-row__table td {
  padding: 9px 12px 9px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--sf-text, #121011) 12%, transparent);
  text-align: left;
  vertical-align: top;
}

.sf-row__table th:last-child,
.sf-row__table td:last-child {
  padding-right: 0;
}

.sf-row__table--specs th {
  width: 45%;
  color: var(--sf-muted, #66625c);
  font-weight: 400;
}

.sf-row__table--fit thead th {
  color: var(--sf-muted, #66625c);
  font-size: 13px;
  font-weight: 600;
}

.sf-row__years {
  white-space: nowrap;
}

/* The shopper's vehicle: a green wash with its own ink (#17191c on #e6f4ea, 15.5:1; the tag #146c2e, 5.75:1), and the words "Your vehicle". */
.sf-row__table--fit tr.is-yours td {
  background: #e6f4ea;
  color: #17191c;
  font-weight: 600;
}

.sf-row__table--fit tr.is-yours td:first-child {
  padding-left: 8px;
  box-shadow: inset 3px 0 0 #146c2e;
}

.sf-row__yours {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: #146c2e;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sf-row__hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .sf-row__icon {
    transition: none;
  }
}
</style>
