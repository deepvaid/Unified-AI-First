<script setup lang="ts">
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { CARD_BRAND_MARKS, markFor } from '@/maropay/methodMarks'
import type { MethodMarkId } from '@/maropay/methodMarks'
import type { Money } from '@/maropay/money'
import type { PayButtonLabel } from '@/maropay/model'
import { payButtonText } from '@/maropay/storefront'
import type { ShopperMethod } from '@/maropay/storefront'

// The checkout's payment options: one radio per method in the merchant's order,
// the card form (the `card` slot) under the selected card option, and what happens
// next under any other. Shared by the checkout and the admin's "What shoppers see"
// preview, so the preview can't drift from what shoppers get.

defineProps<{
  options: ShopperMethod[]
  payButton: PayButtonLabel
  total: Money
  /** The radio group's name, unique on the page. */
  name: string
}>()

const methodId = defineModel<string | null>('methodId', { required: true })

/** Each option leads with its brand tile; cards are offered as Maropay, a provider's own card form as a card. */
function leadMark(method: ShopperMethod): MethodMarkId {
  return method.id === 'card' ? 'maropay' : markFor(method.id)
}
</script>

<template>
  <div class="sf-co__options">
    <div v-for="m in options" :key="m.id" class="sf-co__option" :class="{ 'is-selected': methodId === m.id }">
      <label class="sf-co__option-head">
        <input v-model="methodId" type="radio" :name="name" :value="m.id">
        <MaropayMethodMark :mark="leadMark(m)" size="md" decorative />
        <span class="sf-co__option-text">
          <strong>{{ m.label }}</strong>
          <span class="sf-muted">{{ m.caption }}</span>
        </span>
        <span v-if="m.category === 'cards'" class="sf-co__option-marks"><MaropayMethodMark v-for="brand in CARD_BRAND_MARKS" :key="brand" :mark="brand" size="sm" /></span>
      </label>

      <!-- The card form sits under its own option. -->
      <slot v-if="methodId === m.id && m.category === 'cards'" name="card" :method="m" />
      <div v-else-if="methodId === m.id" class="sf-co__panel sf-muted">
        <template v-if="m.redirects">After you press <strong>{{ payButtonText(m, payButton, total) }}</strong>, you’ll approve the payment on {{ m.label }}’s page and come straight back here.</template>
        <template v-else-if="m.delayed">You’ll authorise a debit from your bank account. Your order is placed straight away; the bank confirms the payment in a few business days.</template>
        <template v-else>Press <strong>{{ payButtonText(m, payButton, total) }}</strong> and confirm with {{ m.label }}.</template>
      </div>
    </div>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-co__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sf-co__option {
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: 8px;
}

.sf-co__option.is-selected {
  border-color: var(--sf-brand, #121011);
  box-shadow: inset 0 0 0 1px var(--sf-brand, #121011);
}

.sf-co__option-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
}

.sf-co__option-head input {
  width: 18px;
  height: 18px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--sf-brand, #121011);
}

.sf-co__option-head input:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-co__option-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
}

.sf-co__option-text strong {
  font-size: 15px;
}

.sf-co__option-marks {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.sf-co__panel {
  margin: 0 16px 16px 46px;
  font-size: 14px;
  line-height: 20px;
}

@media (max-width: 900px) {
  .sf-co__option-head {
    flex-wrap: wrap;
  }

  /* Card marks go under the option's name instead of squeezing it. */
  .sf-co__option-marks {
    flex-basis: 100%;
    justify-content: flex-start;
    padding-left: 30px;
  }
}

/* The same narrow layout inside the admin preview, whatever the window's width. */
@container sf-preview (max-width: 600px) {
  .sf-co__option-head {
    flex-wrap: wrap;
  }

  .sf-co__option-marks {
    flex-basis: 100%;
    justify-content: flex-start;
    padding-left: 30px;
  }
}
</style>
