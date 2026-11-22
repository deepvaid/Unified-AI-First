<script setup lang="ts">
import type { ShopperMethod } from '@/maropay/storefront'

// One-tap express buttons — Apple Pay, Google Pay, PayPal — in the merchant's
// method order. Shown on the product page, the cart and above the checkout form
// when the merchant turns express checkout on (Store › Payments).

defineProps<{ methods: ShopperMethod[]; disabled?: boolean }>()
const emit = defineEmits<{ pick: [methodId: string] }>()

const ACTION: Record<string, string> = { apple_pay: 'Buy with Apple Pay', google_pay: 'Buy with Google Pay', paypal: 'Pay with PayPal' }
const FACE: Record<string, string> = { apple_pay: 'Apple Pay', google_pay: 'G Pay', paypal: 'PayPal' }
</script>

<template>
  <div class="sf-express">
    <button
      v-for="method in methods"
      :key="method.id"
      type="button"
      class="sf-express__btn"
      :class="`sf-express__btn--${method.id}`"
      :aria-label="ACTION[method.id] ?? method.label"
      :disabled="disabled"
      @click="emit('pick', method.id)"
    >
      {{ FACE[method.id] ?? method.label }}
    </button>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The wallets' own button colours. */
.sf-express {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
}

.sf-express__btn {
  height: 48px;
  border: 0;
  border-radius: var(--sf-radius, 6px);
  background: #000000;
  color: #ffffff;
  font: inherit;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
  cursor: pointer;
}

.sf-express__btn--paypal {
  background: #ffc439;
  color: #003087;
  font-style: italic;
  font-weight: 800;
}

.sf-express__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-express__btn:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}
</style>
