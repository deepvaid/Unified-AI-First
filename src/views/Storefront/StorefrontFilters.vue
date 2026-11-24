<script setup lang="ts">
import { reactive, useId } from 'vue'
import type { FacetGroup, FacetKey, ListingNoun } from '@/storefront/facets'

// The filter panel of a product list on the richer theme drawing: one group per
// filter the products have (Category, Size, Color, Price, Brand; ./facets.ts),
// each a disclosure with real checkboxes, so a filter can be combined, taken
// off, and reached with Tab and Space. Sizes are boxes like the product page's;
// colours carry their swatch. Each value says how many products it would list
// with the other filters as they are; a value that would list none is
// unavailable unless it is already chosen. A long list (colours) shows its first
// values and "Show all".
//
// The list shows it as a rail beside the products on a desktop, and in its
// "Filter and sort" sheet on a phone; it emits `toggle` and the list puts the
// change in the URL.

const props = withDefaults(defineProps<{
  groups: readonly FacetGroup[]
  /** What the list holds, for the counts screen readers hear: "12 styles". */
  noun?: ListingNoun
  /** `sheet`: larger rows for touch, in the phone's filter sheet. */
  layout?: 'rail' | 'sheet'
}>(), {
  noun: () => ({ one: 'product', other: 'products' }),
  layout: 'rail',
})

const emit = defineEmits<{
  toggle: [key: FacetKey, value: string]
}>()

const uid = useId()

/** Groups the shopper closed (all start open). */
const closed = reactive<Record<string, boolean>>({})
/** Long groups the shopper opened in full. */
const expanded = reactive<Record<string, boolean>>({})

/** A group longer than this shows its first values and "Show all". */
const LONG = 8
const FIRST = 6

/** Sizes are small boxes, so they always show in full. */
const collapses = (group: FacetGroup) => group.key !== 'size' && group.values.length > LONG

function visibleValues(group: FacetGroup) {
  if (!collapses(group) || expanded[group.key]) return group.values
  // The first few, and any chosen value further down, so a choice is never hidden.
  return group.values.filter((value, i) => i < FIRST || value.selected)
}

const countLabel = (count: number) => `${count} ${count === 1 ? props.noun.one : props.noun.other}`
</script>

<template>
  <div class="sf-filters" :class="`sf-filters--${layout}`">
    <section v-for="group in groups" :key="group.key" class="sf-filters__group">
      <h3 class="sf-filters__heading">
        <button
          type="button"
          class="sf-filters__toggle"
          :aria-expanded="!closed[group.key]"
          :aria-controls="`${uid}-${group.key}`"
          @click="closed[group.key] = !closed[group.key]"
        >
          <span class="sf-filters__title">
            {{ group.label }}<span v-if="group.selected" class="sf-filters__selected"> ({{ group.selected }})</span>
          </span>
          <v-icon size="18" class="sf-filters__chevron" aria-hidden="true">chevron-down</v-icon>
        </button>
      </h3>

      <fieldset v-show="!closed[group.key]" :id="`${uid}-${group.key}`" class="sf-filters__panel">
        <legend class="sf-sr">{{ group.label }}</legend>

        <div v-if="group.key === 'size'" class="sf-filters__sizes">
          <label
            v-for="value in visibleValues(group)"
            :key="value.value"
            class="sf-filters__size"
            :class="{ 'is-selected': value.selected, 'is-empty': !value.count && !value.selected }"
          >
            <input
              type="checkbox"
              class="sf-filters__size-input"
              :checked="value.selected"
              :disabled="!value.count && !value.selected"
              :aria-label="`${value.label}, ${countLabel(value.count)}`"
              @change="emit('toggle', group.key, value.value)"
            >
            <span class="sf-filters__size-face" aria-hidden="true">{{ value.label }}</span>
          </label>
        </div>

        <ul v-else class="sf-filters__list" role="list">
          <li v-for="value in visibleValues(group)" :key="value.value">
            <label class="sf-filters__option" :class="{ 'is-empty': !value.count && !value.selected }">
              <input
                type="checkbox"
                class="sf-filters__check"
                :checked="value.selected"
                :disabled="!value.count && !value.selected"
                :aria-label="`${value.label}, ${countLabel(value.count)}`"
                @change="emit('toggle', group.key, value.value)"
              >
              <span v-if="value.swatch" class="sf-filters__swatch" :style="{ '--sf-swatch': value.swatch }" aria-hidden="true" />
              <span class="sf-filters__label" aria-hidden="true">{{ value.label }}</span>
              <span class="sf-filters__count" aria-hidden="true">{{ value.count }}</span>
            </label>
          </li>
        </ul>

        <button
          v-if="collapses(group)"
          type="button"
          class="sf-filters__more"
          :aria-expanded="!!expanded[group.key]"
          @click="expanded[group.key] = !expanded[group.key]"
        >
          {{ expanded[group.key] ? 'Show fewer' : `Show all ${group.values.length}` }}
        </button>
      </fieldset>
    </section>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours and corners
 * come from the store's theme (--sf-*). */
.sf-filters {
  --sf-filters-line: color-mix(in srgb, var(--sf-text, #121011) 13%, transparent);
  --sf-filters-row: 36px;
  display: flex;
  flex-direction: column;
}

.sf-filters--sheet {
  --sf-filters-row: 44px;
}

.sf-filters__group {
  border-top: 1px solid var(--sf-filters-line);
}

.sf-filters__group:last-child {
  border-bottom: 1px solid var(--sf-filters-line);
}

.sf-filters__heading {
  margin: 0;
  font: inherit;
}

.sf-filters__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  text-align: start;
  cursor: pointer;
}

.sf-filters__toggle:focus-visible,
.sf-filters__more:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-filters__selected {
  color: var(--sf-muted, #66625c);
  font-weight: 400;
}

.sf-filters__chevron {
  flex-shrink: 0;
  transition: transform 160ms ease;
}

.sf-filters__toggle[aria-expanded='false'] .sf-filters__chevron {
  transform: rotate(-90deg);
}

.sf-filters__panel {
  min-width: 0;
  margin: 0;
  padding: 0 0 18px;
  border: 0;
}

.sf-filters__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-filters__option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: var(--sf-filters-row);
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}

.sf-filters__option.is-empty {
  color: var(--sf-muted, #66625c);
  cursor: not-allowed;
}

.sf-filters__check {
  flex-shrink: 0;
  /* A theme that styles its controls (Lumos: 20px, in the accent) sets these; others keep 18px in the text colour. */
  width: var(--sf-check-size, 18px);
  height: var(--sf-check-size, 18px);
  margin: 0;
  accent-color: var(--sf-check, var(--sf-text, #121011));
  cursor: inherit;
}

.sf-filters__check:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-filters__swatch {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--sf-swatch);
  /* A hairline so a white or cream swatch shows on a light page. */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);
}

.sf-filters__label {
  flex: 1;
  min-width: 0;
}

.sf-filters__count {
  color: var(--sf-muted, #66625c);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

/* Sizes: boxes, as the product page draws them. */
.sf-filters__sizes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 8px;
}

.sf-filters__size {
  position: relative;
  display: flex;
  cursor: pointer;
}

/* The checkbox covers its box: it takes the click and the focus, the face shows it. */
.sf-filters__size-input {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.sf-filters__size-face {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: var(--sf-radius, 0);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.sf-filters--sheet .sf-filters__size-face {
  min-height: 44px;
}

.sf-filters__size:hover .sf-filters__size-face {
  border-color: var(--sf-text, #121011);
}

.sf-filters__size.is-selected .sf-filters__size-face {
  border-color: var(--sf-text, #121011);
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
}

.sf-filters__size.is-empty {
  cursor: not-allowed;
}

.sf-filters__size.is-empty .sf-filters__size-face {
  border-style: dashed;
  color: var(--sf-muted, #66625c);
  opacity: 0.6;
}

.sf-filters__size-input:focus-visible + .sf-filters__size-face {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-filters__more {
  min-height: 36px;
  margin-top: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .sf-filters__chevron {
    transition: none;
  }
}
</style>
