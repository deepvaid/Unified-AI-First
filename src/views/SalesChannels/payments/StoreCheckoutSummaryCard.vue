<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMaropayStore } from '@/stores/useMaropay'
import { money } from '@/maropay/money'
import { payButtonText, storefrontOffer } from '@/maropay/storefront'

// Maropay's checkout settings for this store, as two tiles — capture and the
// checkout options live on Maropay's own page for the store, where the checklist
// watches them; these only say what they are and where to change them.

const props = defineProps<{ channelId: string }>()

const route = useRoute()
const maropay = useMaropayStore()

const binding = computed(() => maropay.bindingFor(props.channelId))
const sample = computed(() => money(4999, maropay.account?.currency ?? 'USD'))
const offer = computed(() => storefrontOffer(maropay.state, props.channelId, sample.value, { asIfLive: true }))

const capture = computed(() => (binding.value?.captureMode === 'manual'
  ? { value: 'Manual', caption: 'Authorised at checkout, captured from the order within 7 days' }
  : { value: 'Automatic', caption: 'Captured as soon as the shopper pays' }))

const options = computed(() => {
  const b = binding.value
  if (!b) return { value: '', caption: '' }
  const first = offer.value.methods.find((m) => m.id === offer.value.defaultMethodId) ?? offer.value.methods[0]
  const parts = [first ? `Pay button reads “${payButtonText(first, b.checkout.payButtonLabel, sample.value)}”` : null, first ? `${first.label} shown first` : null]
  return { value: `Express buttons ${b.checkout.expressWallets ? 'on' : 'off'}`, caption: parts.filter(Boolean).join(' · ') }
})

function manage(hash: string) {
  return { name: 'StorePaymentsMaropay', params: { accountId: route.params.accountId, channelId: props.channelId }, hash }
}
</script>

<template>
  <div v-if="binding" class="checkout-tiles">
    <v-card flat border rounded="lg" class="mp-card-inset checkout-tile">
      <div class="checkout-tile__head">
        <h2 class="checkout-tile__label">Payment capture</h2>
        <RouterLink class="mp-link" :to="manage('#maropay-store-capture')">Manage<span class="d-sr-only"> payment capture</span></RouterLink>
      </div>
      <p class="checkout-tile__value">{{ capture.value }}</p>
      <p class="checkout-tile__caption">{{ capture.caption }}</p>
    </v-card>
    <v-card flat border rounded="lg" class="mp-card-inset checkout-tile">
      <div class="checkout-tile__head">
        <h2 class="checkout-tile__label">Checkout options</h2>
        <RouterLink class="mp-link" :to="manage('#maropay-store-checkout')">Manage<span class="d-sr-only"> checkout options</span></RouterLink>
      </div>
      <p class="checkout-tile__value">{{ options.value }}</p>
      <p class="checkout-tile__caption">{{ options.caption }}</p>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.checkout-tiles {
  display: grid;
  gap: var(--mp-space-20);
}

@media (min-width: #{$mp-layout-breakpointCompact}) {
  .checkout-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.checkout-tile {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.checkout-tile__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-12);
  margin-bottom: var(--mp-space-4);
}

.checkout-tile__label {
  margin: 0;
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  color: var(--text-muted);
}

.checkout-tile__value {
  margin: 0;
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-tight);
  color: var(--text-primary);
}

.checkout-tile__caption {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
