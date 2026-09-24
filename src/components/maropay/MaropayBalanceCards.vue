<script setup lang="ts">
import { computed } from 'vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MaropayMoney from './MaropayMoney.vue'
import { zero } from '@/maropay/money'
import { formatDay } from '@/maropay/readiness'
import type { BalanceSummary, UpcomingPayout } from '@/maropay/readiness'

// The four balance figures for one currency. Currencies are never added
// together — a multi-currency business gets one row per currency.

const props = defineProps<{
  balance: BalanceSummary
  upcoming: UpcomingPayout | null
}>()

const cards = computed(() => {
  const { available, pending, inTransit, currency } = props.balance
  const next = props.upcoming?.amount.currency === currency ? props.upcoming : null
  return [
    {
      label: 'Available',
      icon: 'wallet',
      amount: available,
      sub: available.amount < 0 ? 'Recovered from upcoming payments' : 'Included in your next payout',
    },
    {
      label: 'Pending',
      icon: 'hourglass',
      amount: pending,
      sub: 'Becomes available as payments settle',
    },
    {
      label: 'In transit',
      icon: 'send',
      amount: inTransit,
      sub: 'Sent, on its way to your bank',
    },
    {
      label: 'Next payout',
      icon: 'calendar-clock',
      amount: next?.amount ?? zero(currency),
      sub: !next ? 'Nothing waiting to be paid out' : next.blocked ? 'Paused until payouts are fixed' : `Estimated ${formatDay(next.estimatedAt)}`,
    },
  ]
})
</script>

<template>
  <v-row dense>
    <v-col v-for="card in cards" :key="card.label" cols="12" sm="6" md="3">
      <MpKpiCard :label="card.label" :value="''" :icon="card.icon" color="default" :sub-stat="card.sub">
        <template #value>
          <MaropayMoney :amount="card.amount" emphasis="prominent" />
        </template>
      </MpKpiCard>
    </v-col>
  </v-row>
</template>
