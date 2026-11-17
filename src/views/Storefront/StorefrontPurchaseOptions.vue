<script setup lang="ts">
import type { Money } from '@/maropay/money'
import { deliverySummary } from '@/subscriptions/plans'
import type { PurchaseOption } from '@/subscriptions/plans'

// The ways to buy a product, on its page: one card per subscription plan, then
// buying once. Real radio buttons, so arrow keys move between the cards. Each
// plan card has its saving, what a delivery holds and costs, and, once chosen,
// its benefits. The store's badge colours come from its theme.

defineProps<{
  options: PurchaseOption[]
  /** The chosen option's id. */
  modelValue: string
  formatMoney: (amount: Money) => string
}>()

defineEmits<{ 'update:modelValue': [id: string] }>()
</script>

<template>
  <fieldset class="sf-plans">
    <legend class="sf-plans__legend">Purchase options</legend>
    <label v-for="option in options" :key="option.id" class="sf-plan" :class="{ 'is-selected': option.id === modelValue }">
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
  border-radius: var(--sf-radius, 8px);
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
  outline: 2px solid var(--sf-accent, #2563eb);
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
</style>
