<script setup lang="ts">
import { computed } from 'vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayRatesTable from '@/components/maropay/MaropayRatesTable.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatDay } from '@/maropay/readiness'

// Settings → Payment methods: what the account can offer and at what rate.
// Stores pick their own methods from this list on their Payments page.

const maropay = useMaropayStore()

const caption = computed(() => {
  const terms = maropay.terms
  return terms.acceptedAt
    ? `Rates from the terms you accepted on ${formatDay(terms.acceptedAt)} (version ${terms.version}). Illustrative in this prototype. No additional Maropay fee.`
    : undefined
})
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-methods__card">
    <MpSectionHeader title="Payment methods" description="What your account can offer shoppers. Each store chooses its own methods from these." :heading-level="2">
      <template #actions>
        <v-btn size="small" variant="text" class="text-none" append-icon="arrow-right" :to="{ query: { tab: 'stores' } }">Choose per store</v-btn>
      </template>
    </MpSectionHeader>
    <MaropayRatesTable :methods="maropay.methods" :caption="caption" />
  </v-card>
</template>

<style scoped>
.maropay-methods__card {
  padding: var(--mp-component-card-padding);
}
</style>
