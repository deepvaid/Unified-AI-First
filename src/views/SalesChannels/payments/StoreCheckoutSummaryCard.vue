<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatMoney, money } from '@/maropay/money'
import { PAY_BUTTON_LABELS } from '@/maropay/model'
import { payButtonText, storefrontOffer } from '@/maropay/storefront'

// Maropay's checkout settings for this store, summarised — capture and the
// checkout options live on Maropay's own page for the store, where the checklist
// watches them; this card only says what they are and where to change them.

const props = defineProps<{ channelId: string }>()

const route = useRoute()
const maropay = useMaropayStore()

const binding = computed(() => maropay.bindingFor(props.channelId))
const sample = computed(() => money(4999, maropay.account?.currency ?? 'USD'))
const offer = computed(() => storefrontOffer(maropay.state, props.channelId, sample.value, { asIfLive: true }))

const capture = computed(() => (binding.value?.captureMode === 'manual'
  ? 'Manual — authorised at checkout, captured from the order within 7 days.'
  : 'Automatic at checkout — payments are captured as soon as the shopper pays.'))

const options = computed(() => {
  const b = binding.value
  if (!b) return ''
  const first = offer.value.methods.find((m) => m.id === offer.value.defaultMethodId) ?? offer.value.methods[0]
  const button = PAY_BUTTON_LABELS[b.checkout.payButtonLabel].replace('{amount}', formatMoney(sample.value))
  return [
    `Express buttons ${b.checkout.expressWallets ? 'on' : 'off'}`,
    `Pay button “${first ? payButtonText(first, b.checkout.payButtonLabel, sample.value) : button}”`,
    first ? `${first.label} selected first` : null,
  ].filter(Boolean).join(' · ')
})

function manage(hash: string) {
  return { name: 'StorePaymentsMaropay', params: { accountId: route.params.accountId, channelId: props.channelId }, hash }
}
</script>

<template>
  <v-card v-if="binding" flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader title="Checkout" description="Maropay’s settings for this store. Your other providers follow their own." :heading-level="2" />
    <MpListRow variant="divided" title="Payment capture" :subtitle="capture">
      <template #trailing><v-btn size="small" variant="text" class="text-none" :to="manage('#maropay-store-capture')">Manage</v-btn></template>
    </MpListRow>
    <MpListRow variant="divided" title="Checkout options" :subtitle="options">
      <template #trailing><v-btn size="small" variant="text" class="text-none" :to="manage('#maropay-store-checkout')">Manage</v-btn></template>
    </MpListRow>
  </v-card>
</template>
