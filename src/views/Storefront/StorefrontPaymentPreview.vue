<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Money } from '@/maropay/money'
import { payButtonText } from '@/maropay/storefront'
import type { CardInput, StorefrontOffer } from '@/maropay/storefront'
import StorefrontCardFields from './StorefrontCardFields.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontPayButton from './StorefrontPayButton.vue'
import StorefrontPaymentOptions from './StorefrontPaymentOptions.vue'

// The payment part of a store's checkout, drawn in the store's theme for the
// admin's "What shoppers see" preview: express buttons, then the payment options
// with the merchant's default selected, then the pay button. Built from the
// checkout's own parts, so the two can't drift. Out of system (P4-8), like the
// storefront; the admin card around it is StorePaymentsPreview.

const props = defineProps<{
  offer: StorefrontOffer
  total: Money
  /** The store's theme as --sf-* custom properties (storefrontThemeVars). */
  themeVars: Record<string, string>
  /** Prefix for ids and the radio group, unique on the page. */
  idPrefix: string
}>()

// Follows the merchant's default as they change it; a removed method falls back to it too.
const methodId = ref<string | null>(props.offer.defaultMethodId)
watch(() => [props.offer.defaultMethodId, props.offer.methods.map((m) => m.id).join()], () => {
  methodId.value = props.offer.defaultMethodId
})
const method = computed(() => props.offer.methods.find((m) => m.id === methodId.value) ?? null)

const card = ref<CardInput>({ number: '', expiry: '', cvc: '' })
</script>

<template>
  <div class="sf-surface sf-pv" :style="themeVars">
    <section v-if="offer.express.length" class="sf-pv__express">
      <h3 class="sf-pv__express-title">Express checkout</h3>
      <StorefrontExpressButtons :methods="offer.express" />
      <p class="sf-or">OR</p>
    </section>

    <section class="sf-pv__payment">
      <h3 class="sf-pv__title">Payment</h3>
      <p class="sf-pv__note sf-muted"><v-icon size="14">lock</v-icon> All payments are secure and encrypted.</p>
      <StorefrontPaymentOptions v-model:method-id="methodId" :options="offer.methods" :pay-button="offer.payButton" :total="total" :name="`${idPrefix}-method`">
        <template #card>
          <StorefrontCardFields v-model:card="card" :id-prefix="idPrefix" />
        </template>
      </StorefrontPaymentOptions>
    </section>

    <StorefrontPayButton :label="payButtonText(method, offer.payButton, total)" secured />
  </div>
</template>

<style scoped src="./storefront-surface.css"></style>
<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The checkout's own
   sizes; the narrow layouts come from the sf-preview container, not the window. */
.sf-pv {
  container: sf-preview / inline-size;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
}

.sf-pv__express {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-pv__express-title {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.sf-pv__payment {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-pv__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.sf-pv__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 0;
  font-size: 13px;
}
</style>
