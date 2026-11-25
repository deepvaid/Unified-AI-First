<script setup lang="ts">
import { computed, useId } from 'vue'
import type { Money } from '@/maropay/money'
import { deliverySummary, optionLayout } from '@/subscriptions/plans'
import type { PurchaseOption } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'

// The ways to buy a product, on its page. A plan of one fixed delivery is a card
// of its own, then buying once: each plan card has its saving, what a delivery
// holds and costs, and, once chosen, its benefits. A plan sold by delivery options
// follows under its label ("Subscribe and save"), one row per frequency.
// Real radio buttons, so arrow keys move between the rows; the store's theme can
// ask for plain radio rows or one dropdown instead of cards, and for a line under
// the options. The store's badge colours come from its theme.

const props = withDefaults(defineProps<{
  options: PurchaseOption[]
  /** The chosen option's id. */
  modelValue: string
  formatMoney: (amount: Money) => string
  /** How the options are laid out: boxed cards, plain radio rows, or one dropdown. */
  variant?: 'cards' | 'radios' | 'dropdown'
  /** One line under the options: "Pause or cancel any time." */
  policyText?: string
  /** Where "Subscription terms" leads. */
  termsHref?: string
  /** Where "My subscriptions" leads, on a store whose shoppers manage theirs. */
  accountHref?: string
}>(), {
  variant: 'cards',
  policyText: '',
  termsHref: '',
  accountHref: '',
})

defineEmits<{ 'update:modelValue': [id: string] }>()

const layout = computed(() => optionLayout(props.options))
const legendId = useId()
/** A dropdown's row has no room for a badge, so the saving is part of its words. */
const inWords = (option: PurchaseOption): string =>
  `${option.name}${option.plan?.discountPct ? `, save ${option.plan.discountPct}%` : ''}: ${props.formatMoney(option.price)}`
</script>

<template>
  <fieldset class="sf-plans" :class="`sf-plans--${variant}`">
    <legend :id="legendId" class="sf-plans__legend">Purchase options</legend>

    <select
      v-if="variant === 'dropdown'"
      class="sf-plans__select"
      :value="modelValue"
      :aria-labelledby="legendId"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in layout.single" :key="option.id" :value="option.id">{{ inWords(option) }}</option>
      <optgroup v-for="group in layout.groups" :key="group.planId" :label="group.maxDiscountPct ? `${group.label} (save up to ${group.maxDiscountPct}%)` : group.label">
        <option v-for="option in group.options" :key="option.id" :value="option.id">{{ inWords(option) }}</option>
      </optgroup>
    </select>

    <template v-else>
      <label v-for="option in layout.single" :key="option.id" class="sf-plan" :class="{ 'is-selected': option.id === modelValue }">
        <input
          type="radio"
          name="sf-purchase-option"
          :value="option.id"
          :checked="option.id === modelValue"
          @change="$emit('update:modelValue', option.id)"
        >
        <span class="sf-plan__body">
          <span class="sf-plan__head">
            <span class="sf-plan__name">{{ option.name }}</span>
            <span v-if="option.plan?.discountPct" class="sf-plan__badge sf-plan__badge--save">Save {{ option.plan.discountPct }}%</span>
            <span v-if="option.plan?.freeShipping" class="sf-plan__badge sf-plan__badge--ship">Free shipping</span>
          </span>
          <span v-if="option.plan" class="sf-plan__meta">{{ deliverySummary(option.plan) }}</span>
          <ul v-if="option.plan?.benefits.length && option.id === modelValue" class="sf-plan__benefits">
            <li v-for="benefit in option.plan.benefits" :key="benefit">
              <v-icon size="14" aria-hidden="true">check</v-icon>
              {{ benefit }}
            </li>
          </ul>
        </span>
        <span class="sf-plan__price">
          <s v-if="option.compareAt"><span class="sf-plans__sr">Usual price </span>{{ formatMoney(option.compareAt) }}</s>
          <strong>{{ formatMoney(option.price) }}</strong>
          <span v-if="option.plan" class="sf-plan__per">per delivery</span>
        </span>
      </label>

      <div v-for="group in layout.groups" :key="group.planId" class="sf-plans__group" role="group" :aria-label="group.label">
        <p class="sf-plans__group-label">
          {{ group.label }}
          <span v-if="group.maxDiscountPct" class="sf-plan__badge sf-plan__badge--save">Save up to {{ group.maxDiscountPct }}%</span>
        </p>
        <label v-for="option in group.options" :key="option.id" class="sf-plan" :class="{ 'is-selected': option.id === modelValue }">
          <input
            type="radio"
            name="sf-purchase-option"
            :value="option.id"
            :checked="option.id === modelValue"
            @change="$emit('update:modelValue', option.id)"
          >
          <span class="sf-plan__body">
            <span class="sf-plan__head">
              <span class="sf-plan__name">{{ option.name }}</span>
              <span v-if="option.plan?.discountPct" class="sf-plan__badge sf-plan__badge--save">Save {{ option.plan.discountPct }}%</span>
            </span>
          </span>
          <span class="sf-plan__price sf-plan__price--row">
            <s v-if="option.compareAt"><span class="sf-plans__sr">Usual price </span>{{ formatMoney(option.compareAt) }}</s>
            <strong>{{ formatMoney(option.price) }}</strong>
          </span>
        </label>
      </div>
    </template>

    <p v-if="policyText || termsHref || accountHref" class="sf-plans__policy">
      <v-icon size="14" aria-hidden="true">refresh-cw</v-icon>
      <span v-if="policyText">{{ policyText }}</span>
      <StorefrontAnchor v-if="termsHref" :href="termsHref">Subscription terms</StorefrontAnchor>
      <span v-if="termsHref && accountHref" aria-hidden="true">·</span>
      <StorefrontAnchor v-if="accountHref" :href="accountHref">My subscriptions</StorefrontAnchor>
    </p>
  </fieldset>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-plans {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.sf-plans__legend {
  margin-bottom: 8px;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
}

.sf-plans__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sf-plan {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  /* A theme with card corners of its own (the sections drawing's) rounds plans like its cards; others keep --sf-radius. */
  border-radius: var(--sf-card-radius, var(--sf-radius, 8px));
  cursor: pointer;
}

.sf-plan.is-selected {
  border-color: var(--sf-brand, #121011);
  box-shadow: inset 0 0 0 1px var(--sf-brand, #121011);
}

.sf-plan input {
  width: 18px;
  height: 18px;
  margin: 2px 0 0;
  flex-shrink: 0;
  accent-color: var(--sf-brand, #121011);
}

.sf-plan input:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-plan__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sf-plan__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.sf-plan__name {
  font-size: 15px;
  font-weight: 600;
}

.sf-plan__badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}

/* Each badge sets its own text colour: the theme derives one that reads on its fill. */
.sf-plan__badge--save {
  background: var(--sf-badge-sale, #121011);
  color: var(--sf-on-badge-sale, #ffffff);
}

.sf-plan__badge--ship {
  background: var(--sf-badge-custom, #f0f0f0);
  color: var(--sf-on-badge-custom, #121011);
}

.sf-plan__meta {
  font-size: 13px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-plan__benefits {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.sf-plan__benefits li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sf-plan__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 15px;
  text-align: end;
  white-space: nowrap;
}

.sf-plan__price s {
  font-size: 13px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-plan__per {
  font-size: 12px;
  color: var(--sf-muted, #5f5f5f);
}

/* A delivery option is one line: its price and usual price sit side by side. */
.sf-plan__price--row {
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

/* A plan's delivery options, under its label. */
.sf-plans__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.sf-plans__group-label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

/* Plain radio rows: the same choices without their boxes. */
.sf-plans--radios .sf-plan {
  padding: 6px 0;
  border: 0;
  border-radius: 0;
}

.sf-plans--radios .sf-plan.is-selected {
  box-shadow: none;
}

.sf-plans--radios .sf-plan.is-selected .sf-plan__name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* The chevron is drawn here, as on the store's sort menu: the browser's own is switched off. */
.sf-plans__select {
  width: 100%;
  min-height: 44px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: var(--sf-radius, 8px);
  background: var(--sf-bg, #ffffff) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
  color: inherit;
  font: inherit;
  font-size: 15px;
  appearance: none;
  cursor: pointer;
}

.sf-plans__select:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-plans__policy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-plans__policy a {
  color: inherit;
  text-decoration: underline;
}
</style>
