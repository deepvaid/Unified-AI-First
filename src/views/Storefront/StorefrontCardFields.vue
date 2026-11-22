<script setup lang="ts">
import { TEST_CARDS } from '@/maropay/storefront'
import type { CardInput } from '@/maropay/storefront'

// The card form under the checkout's card option: number, expiry and security
// code, and the prototype's test cards. Shared by the checkout and the admin's
// "What shoppers see" preview; ids take a prefix so both can sit on one page.

const props = defineProps<{
  /** Prefix for the fields' ids, unique on the page. */
  idPrefix: string
  /** Field messages, once the shopper has tried to pay. */
  errors?: Partial<Record<keyof CardInput, string | null>>
  /** Offer the prototype's test cards. */
  testCards?: boolean
}>()

const card = defineModel<CardInput>('card', { required: true })

function update(patch: Partial<CardInput>): void {
  card.value = { ...card.value, ...patch }
}

function onNumber(event: Event): void {
  const input = event.target as HTMLInputElement
  const number = input.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
  // The model may not change (a stray letter), so the field is corrected directly too.
  input.value = number
  update({ number })
}

function useTestCard(number: string): void {
  update({ number, expiry: '12 / 30', cvc: '123' })
}

function errorFor(key: keyof CardInput): string | null {
  return props.errors?.[key] ?? null
}

function id(key: string): string {
  return `${props.idPrefix}-${key}`
}
</script>

<template>
  <div class="sf-co__card">
    <div class="sf-field sf-co__full">
      <label :for="id('cc')">Card number</label>
      <input :id="id('cc')" :value="card.number" class="sf-input" inputmode="numeric" autocomplete="cc-number" :aria-invalid="!!errorFor('number')" :aria-describedby="errorFor('number') ? id('cc-err') : undefined" @input="onNumber">
      <span v-if="errorFor('number')" :id="id('cc-err')" class="sf-field__error">{{ errorFor('number') }}</span>
    </div>
    <div class="sf-field">
      <label :for="id('exp')">Expiry (MM / YY)</label>
      <input :id="id('exp')" :value="card.expiry" class="sf-input" inputmode="numeric" autocomplete="cc-exp" :aria-invalid="!!errorFor('expiry')" :aria-describedby="errorFor('expiry') ? id('exp-err') : undefined" @input="update({ expiry: ($event.target as HTMLInputElement).value })">
      <span v-if="errorFor('expiry')" :id="id('exp-err')" class="sf-field__error">{{ errorFor('expiry') }}</span>
    </div>
    <div class="sf-field">
      <label :for="id('cvc')">Security code</label>
      <input :id="id('cvc')" :value="card.cvc" class="sf-input" inputmode="numeric" autocomplete="cc-csc" maxlength="4" :aria-invalid="!!errorFor('cvc')" :aria-describedby="errorFor('cvc') ? id('cvc-err') : undefined" @input="update({ cvc: ($event.target as HTMLInputElement).value })">
      <span v-if="errorFor('cvc')" :id="id('cvc-err')" class="sf-field__error">{{ errorFor('cvc') }}</span>
    </div>
    <details v-if="testCards" class="sf-co__testcards sf-co__full">
      <summary>Test cards for this prototype</summary>
      <ul>
        <li v-for="test in TEST_CARDS" :key="test.number">
          <button type="button" @click="useTestCard(test.number)"><code>{{ test.number }}</code></button>
          <span>{{ test.label }}</span>
        </li>
      </ul>
    </details>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-co__card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0 16px 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f7f7f5;
}

.sf-co__full {
  grid-column: 1 / -1;
}

.sf-co__testcards {
  font-size: 13px;
}

.sf-co__testcards summary {
  cursor: pointer;
  text-decoration: underline;
}

.sf-co__testcards ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.sf-co__testcards li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sf-co__testcards button {
  padding: 4px 8px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: 4px;
  background: #ffffff;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 900px) {
  .sf-co__card {
    grid-template-columns: 1fr;
  }
}

/* One column inside the admin preview, whatever the window's width. */
@container sf-preview (max-width: 600px) {
  .sf-co__card {
    grid-template-columns: 1fr;
  }
}
</style>
